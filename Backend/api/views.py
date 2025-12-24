from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import HttpResponse, JsonResponse
from django.db.models import Q
from django.db import connection
from django.utils import timezone
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from datetime import datetime
import csv
import json

from .models import User, Wallet, Transaction, AudioFile, Transcription
from .serializers import (
    UserSerializer, WalletSerializer, TransactionSerializer,
    AudioFileSerializer, TranscriptionSerializer, TranscriptionCreateSerializer
)
from .services import (
    AuthService, WalletService, AudioService,
    TranscriptionService, PaymentService
)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    """Handle Google OAuth login"""
    try:
        # In production, verify the Google token here
        email = request.data.get('email')
        name = request.data.get('name')
        provider_id = request.data.get('provider_id')
        
        if not all([email, name, provider_id]):
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = AuthService.authenticate_oauth_user('google', email, name, provider_id)
        
        user_data = UserSerializer(result['user']).data
        
        return Response({
            'user': user_data,
            'tokens': result['tokens'],
            'is_new_user': result['is_new_user']
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def facebook_login(request):
    """Handle Facebook OAuth login"""
    try:
        # In production, verify the Facebook token here
        email = request.data.get('email')
        name = request.data.get('name')
        provider_id = request.data.get('provider_id')
        
        if not all([email, name, provider_id]):
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = AuthService.authenticate_oauth_user('facebook', email, name, provider_id)
        
        user_data = UserSerializer(result['user']).data
        
        return Response({
            'user': user_data,
            'tokens': result['tokens'],
            'is_new_user': result['is_new_user']
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Get current authenticated user"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


class WalletViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Wallet.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def details(self, request):
        """Get wallet details with statistics"""
        wallet = request.user.wallet
        serializer = self.get_serializer(wallet)
        stats = WalletService.get_usage_statistics(request.user)
        
        return Response({
            'wallet': serializer.data,
            'statistics': stats
        })
    
    @method_decorator(ratelimit(key='user', rate='10/h', method='POST'))
    @action(detail=False, methods=['post'])
    def create_order(self, request):
        """Create Razorpay order for recharge - Rate limited to 10 per hour"""
        try:
            amount = request.data.get('amount')
            if not amount or float(amount) <= 0:
                return Response(
                    {'error': 'Invalid amount'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            payment_service = PaymentService()
            order = payment_service.create_order(amount, request.user)
            
            return Response(order)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def verify_payment(self, request):
        """Verify payment and credit wallet"""
        try:
            order_id = request.data.get('order_id')
            payment_id = request.data.get('payment_id')
            signature = request.data.get('signature')
            amount = request.data.get('amount')
            
            if not all([order_id, payment_id, signature, amount]):
                return Response(
                    {'error': 'Missing required fields'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            payment_service = PaymentService()
            is_valid = payment_service.verify_payment_signature(order_id, payment_id, signature)
            
            if not is_valid:
                return Response(
                    {'error': 'Invalid payment signature'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Credit wallet
            transaction = WalletService.process_recharge(
                request.user,
                amount,
                payment_id,
                order_id
            )
            
            return Response({
                'message': 'Payment verified and wallet credited',
                'transaction': TransactionSerializer(transaction).data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Transaction.objects.filter(wallet__user=self.request.user)


class AudioFileViewSet(viewsets.ModelViewSet):
    serializer_class = AudioFileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        """Optimized queryset"""
        return AudioFile.objects.filter(
            user=self.request.user
        ).only(
            'id', 'filename', 'duration', 'size', 'format', 'uploaded_at'
        ).order_by('-uploaded_at')
    
    @method_decorator(ratelimit(key='user', rate='50/h', method='POST'))
    def create(self, request):
        """Upload audio file - Rate limited to 50 per hour"""
        try:
            file = request.FILES.get('file')
            if not file:
                return Response(
                    {'error': 'No file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            audio_file = AudioService.store_audio_file(file, request.user)
            serializer = self.get_serializer(audio_file)
            
            # Calculate estimated cost
            has_balance, estimated_cost = WalletService.check_sufficient_balance(
                request.user,
                float(audio_file.duration)
            )
            
            return Response({
                'audio_file': serializer.data,
                'estimated_cost': float(estimated_cost),
                'has_sufficient_balance': has_balance
            }, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, pk=None):
        """Delete audio file"""
        try:
            audio_file = self.get_object()
            AudioService.delete_audio_file(audio_file)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TranscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = TranscriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Optimized queryset with select_related to prevent N+1 queries"""
        queryset = Transcription.objects.filter(
            user=self.request.user
        ).select_related(
            'audio_file'  # Join audio_file in single query
        ).only(
            # Only fetch needed fields
            'id', 'language', 'status', 'duration', 
            'cost', 'created_at', 'completed_at', 'error_message',
            'audio_file__id', 'audio_file__filename'
        ).order_by('-created_at')
        
        # Apply filters
        language = self.request.query_params.get('language')
        status_filter = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if language:
            queryset = queryset.filter(language=language)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        return queryset
    
    @method_decorator(ratelimit(key='user', rate='20/h', method='POST'))
    def create(self, request):
        """Create transcription request - Rate limited to 20 per hour"""
        try:
            serializer = TranscriptionCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            transcription = TranscriptionService.create_transcription(
                serializer.validated_data['audio_file_id'],
                serializer.validated_data['language'],
                request.user
            )
            
            # Try async processing with Celery, fallback to sync if not available
            try:
                from .tasks import process_transcription_task
                process_transcription_task.delay(str(transcription.id))
                message = 'Transcription queued. Check status in a moment.'
            except Exception as celery_error:
                # Celery not available, process synchronously
                import logging
                logger = logging.getLogger('api')
                logger.warning(f"Celery not available, processing synchronously: {celery_error}")
                try:
                    TranscriptionService.process_transcription(transcription)
                    message = 'Transcription completed.'
                except Exception as process_error:
                    # Transcription failed, but record is created
                    message = 'Transcription failed. Check status for details.'
            
            result_serializer = TranscriptionSerializer(transcription)
            return Response({
                **result_serializer.data,
                'message': message
            }, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download transcription as text file"""
        try:
            transcription = self.get_object()
            content = TranscriptionService.generate_download_file(transcription)
            
            response = HttpResponse(content, content_type='text/plain; charset=utf-8')
            response['Content-Disposition'] = f'attachment; filename="transcription_{transcription.id}.txt"'
            return response
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export transcription history to CSV"""
        try:
            transcriptions = self.get_queryset()
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="transcriptions.csv"'
            
            writer = csv.writer(response)
            writer.writerow(['ID', 'Audio File', 'Language', 'Duration (min)', 'Cost (₹)', 'Status', 'Created At', 'Completed At'])
            
            for t in transcriptions:
                writer.writerow([
                    str(t.id),
                    t.audio_file.filename,
                    t.language,
                    float(t.duration),
                    float(t.cost),
                    t.status,
                    t.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    t.completed_at.strftime('%Y-%m-%d %H:%M:%S') if t.completed_at else ''
                ])
            
            return response
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['POST'])
@permission_classes([AllowAny])
def razorpay_webhook(request):
    """Handle Razorpay webhook"""
    try:
        payload = request.body.decode('utf-8')
        signature = request.headers.get('X-Razorpay-Signature')
        
        payment_service = PaymentService()
        is_valid = payment_service.verify_webhook_signature(payload, signature)
        
        if not is_valid:
            return Response(
                {'error': 'Invalid signature'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data = json.loads(payload)
        event = data.get('event')
        
        if event == 'payment.captured':
            payment = data.get('payload', {}).get('payment', {}).get('entity', {})
            # Process payment captured event
            # This is handled in verify_payment endpoint for now
            pass
        
        return Response({'status': 'success'})
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for monitoring systems.
    Returns service status and dependency checks.
    """
    health_status = {
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'services': {}
    }
    
    # Check database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['services']['database'] = 'connected'
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['services']['database'] = f'error: {str(e)}'
    
    # Check OpenAI configuration
    from django.conf import settings
    if settings.OPENAI_API_KEY:
        health_status['services']['openai'] = 'configured'
    else:
        health_status['status'] = 'degraded'
        health_status['services']['openai'] = 'missing'
    
    # Check Razorpay configuration
    if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
        health_status['services']['razorpay'] = 'configured'
    else:
        health_status['status'] = 'degraded'
        health_status['services']['razorpay'] = 'missing'
    
    # Check Redis/Celery (optional - not required for basic operation)
    try:
        from django.core.cache import cache
        cache.set('health_check', 'ok', 10)
        if cache.get('health_check') == 'ok':
            health_status['services']['redis'] = 'connected'
        else:
            health_status['services']['redis'] = 'not connected (using fallback cache)'
    except Exception as e:
        health_status['services']['redis'] = f'not available (using fallback cache)'
    
    # Check Celery (optional)
    try:
        from .tasks import process_transcription_task
        health_status['services']['celery'] = 'configured'
    except Exception as e:
        health_status['services']['celery'] = 'not available (using synchronous processing)'
    
    status_code = 200 if health_status['status'] == 'healthy' else 503
    return JsonResponse(health_status, status=status_code)

