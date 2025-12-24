import os
import logging
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from openai import OpenAI
import openai
from ..models import Transcription, AudioFile
from .wallet_service import WalletService

logger = logging.getLogger('api')


class TranscriptionService:
    @staticmethod
    def create_transcription(audio_file_id, language, user):
        """
        Create transcription request with cost validation.
        Property 8: Transcription Processing
        """
        print(f"\n{'='*80}")
        print(f"[TRANSCRIPTION] CREATE_TRANSCRIPTION STARTED")
        print(f"{'='*80}")
        print(f"[TRANSCRIPTION] User ID: {user.id}")
        print(f"[TRANSCRIPTION] User Email: {user.email}")
        print(f"[TRANSCRIPTION] Audio File ID: {audio_file_id}")
        print(f"[TRANSCRIPTION] Language: {language}")
        
        try:
            print(f"[TRANSCRIPTION] Fetching audio file...")
            audio_file = AudioFile.objects.get(id=audio_file_id, user=user)
            print(f"[TRANSCRIPTION] ✓ Audio file found: {audio_file.filename}")
            print(f"[TRANSCRIPTION] Audio duration: {audio_file.duration} minutes")
            print(f"[TRANSCRIPTION] Audio size: {audio_file.size} bytes")
        except AudioFile.DoesNotExist:
            print(f"[TRANSCRIPTION] ✗ Audio file NOT found for ID: {audio_file_id}")
            raise ValueError("Audio file not found")
        
        # Check if user has sufficient balance
        print(f"[TRANSCRIPTION] Checking wallet balance...")
        has_balance, estimated_cost = WalletService.check_sufficient_balance(
            user, 
            float(audio_file.duration)
        )
        print(f"[TRANSCRIPTION] Has sufficient balance: {has_balance}")
        print(f"[TRANSCRIPTION] Estimated cost: ₹{estimated_cost}")
        
        if not has_balance:
            print(f"[TRANSCRIPTION] ✗ INSUFFICIENT BALANCE - Transaction rejected")
            raise ValueError("Insufficient balance. Please recharge your wallet.")
        
        # Create transcription record
        print(f"[TRANSCRIPTION] Creating transcription record in database...")
        transcription = Transcription.objects.create(
            user=user,
            audio_file=audio_file,
            language=language,
            duration=audio_file.duration,
            cost=estimated_cost,
            status='pending'
        )
        print(f"[TRANSCRIPTION] ✓ Transcription record created")
        print(f"[TRANSCRIPTION] Transcription ID: {transcription.id}")
        print(f"[TRANSCRIPTION] Status: {transcription.status}")
        print(f"[TRANSCRIPTION] CREATE_TRANSCRIPTION COMPLETED")
        print(f"{'='*80}\n")
        
        return transcription
    
    @staticmethod
    @transaction.atomic
    def process_transcription(transcription):
        """
        Process transcription using OpenAI Whisper API.
        Property 8: Transcription Processing
        Property 9: Transcription Result Persistence
        Property 10: Transcription Error Handling
        """
        print(f"\n{'='*80}")
        print(f"[TRANSCRIPTION] PROCESS_TRANSCRIPTION STARTED")
        print(f"{'='*80}")
        print(f"[TRANSCRIPTION] Transcription ID: {transcription.id}")
        print(f"[TRANSCRIPTION] User ID: {transcription.user.id}")
        print(f"[TRANSCRIPTION] Audio File: {transcription.audio_file.filename}")
        print(f"[TRANSCRIPTION] Language: {transcription.language}")
        print(f"[TRANSCRIPTION] Duration: {transcription.duration} minutes")
        
        try:
            logger.info(f"Starting transcription {transcription.id} for user {transcription.user.id}")
            print(f"[TRANSCRIPTION] ✓ Logging initialized")
            
            # Update status to processing
            print(f"[TRANSCRIPTION] Updating status to 'processing'...")
            transcription.status = 'processing'
            transcription.save()
            print(f"[TRANSCRIPTION] ✓ Status updated to: {transcription.status}")
            
            # Get audio file path
            print(f"[TRANSCRIPTION] Constructing audio file path...")
            audio_path = os.path.join(
                settings.MEDIA_ROOT, 
                transcription.audio_file.file_path
            )
            print(f"[TRANSCRIPTION] Audio path: {audio_path}")
            
            if not os.path.exists(audio_path):
                print(f"[TRANSCRIPTION] ✗ Audio file NOT found at path: {audio_path}")
                logger.error(f"Audio file not found for transcription {transcription.id}: {transcription.audio_file.file_path}",
                           extra={'user_id': str(transcription.user.id)})
                raise FileNotFoundError("Audio file not found on disk")
            
            print(f"[TRANSCRIPTION] ✓ Audio file exists at path")
            
            # Call OpenAI Whisper API
            print(f"[TRANSCRIPTION] Initializing OpenAI client...")
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            print(f"[TRANSCRIPTION] ✓ OpenAI client initialized")
            
            print(f"[TRANSCRIPTION] Opening audio file for transcription...")
            with open(audio_path, 'rb') as audio_file:
                # Map language to Whisper language codes
                language_code = 'en' if transcription.language == 'english' else 'hi'
                print(f"[TRANSCRIPTION] Language code: {language_code}")
                
                print(f"[TRANSCRIPTION] Calling OpenAI Whisper API...")
                print(f"[TRANSCRIPTION] Model: whisper-1")
                print(f"[TRANSCRIPTION] Response format: text")
                
                response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language_code,
                    response_format="text"
                )
                
                print(f"[TRANSCRIPTION] ✓ OpenAI API call successful")
                print(f"[TRANSCRIPTION] Response length: {len(response)} characters")
                print(f"[TRANSCRIPTION] Response preview: {response[:100]}...")
            
            # Deduct cost from wallet
            print(f"[TRANSCRIPTION] Deducting cost from wallet...")
            transaction_obj, actual_cost = WalletService.deduct_transcription_cost(
                transcription.user,
                float(transcription.duration)
            )
            print(f"[TRANSCRIPTION] ✓ Cost deducted: ₹{actual_cost}")
            print(f"[TRANSCRIPTION] Transaction ID: {transaction_obj.id}")
            
            # Update transcription with result
            print(f"[TRANSCRIPTION] Updating transcription record with results...")
            transcription.text = response
            transcription.cost = actual_cost
            transcription.status = 'completed'
            transcription.completed_at = timezone.now()
            transcription.save()
            print(f"[TRANSCRIPTION] ✓ Transcription record updated")
            print(f"[TRANSCRIPTION] Final status: {transcription.status}")
            print(f"[TRANSCRIPTION] Completed at: {transcription.completed_at}")
            
            logger.info(f"Transcription {transcription.id} completed successfully")
            print(f"[TRANSCRIPTION] ✓ PROCESS_TRANSCRIPTION COMPLETED SUCCESSFULLY")
            print(f"{'='*80}\n")
            
            return transcription
            
        except openai.APIError as e:
            print(f"[TRANSCRIPTION] ✗ OpenAI API Error: {str(e)}")
            logger.error(f"OpenAI API error for transcription {transcription.id}: {e}", 
                        extra={'user_id': str(transcription.user.id), 'error_type': 'openai_api'})
            transcription.status = 'failed'
            transcription.error_message = "AI service temporarily unavailable. Please try again in a few minutes."
            transcription.save()
            print(f"[TRANSCRIPTION] ✓ Error status saved to database")
            print(f"[TRANSCRIPTION] ✗ PROCESS_TRANSCRIPTION FAILED")
            print(f"{'='*80}\n")
            raise
            
        except FileNotFoundError as e:
            print(f"[TRANSCRIPTION] ✗ File Not Found Error: {str(e)}")
            logger.error(f"Audio file not found for transcription {transcription.id}: {transcription.audio_file.file_path}",
                        extra={'user_id': str(transcription.user.id)})
            transcription.status = 'failed'
            transcription.error_message = "Audio file not found. Please re-upload your file."
            transcription.save()
            print(f"[TRANSCRIPTION] ✓ Error status saved to database")
            print(f"[TRANSCRIPTION] ✗ PROCESS_TRANSCRIPTION FAILED")
            print(f"{'='*80}\n")
            raise
            
        except Exception as e:
            print(f"[TRANSCRIPTION] ✗ Unexpected Error: {str(e)}")
            print(f"[TRANSCRIPTION] Error type: {type(e).__name__}")
            logger.exception(f"Unexpected error in transcription {transcription.id}",
                           extra={'user_id': str(transcription.user.id)})
            transcription.status = 'failed'
            transcription.error_message = "An unexpected error occurred. Our team has been notified."
            transcription.save()
            print(f"[TRANSCRIPTION] ✓ Error status saved to database")
            print(f"[TRANSCRIPTION] ✗ PROCESS_TRANSCRIPTION FAILED")
            print(f"{'='*80}\n")
            raise
    
    @staticmethod
    def get_transcription_history(user, filters=None):
        """
        Get user's transcription history with optional filters.
        Property 21: Usage History Filtering
        """
        queryset = Transcription.objects.filter(user=user)
        
        if filters:
            if 'language' in filters:
                queryset = queryset.filter(language=filters['language'])
            
            if 'date_from' in filters:
                queryset = queryset.filter(created_at__gte=filters['date_from'])
            
            if 'date_to' in filters:
                queryset = queryset.filter(created_at__lte=filters['date_to'])
            
            if 'status' in filters:
                queryset = queryset.filter(status=filters['status'])
        
        return queryset
    
    @staticmethod
    def generate_download_file(transcription):
        """
        Generate downloadable text file for transcription.
        Property 11: Transcription Download File Generation
        """
        if transcription.status != 'completed':
            raise ValueError("Transcription is not completed")
        
        content = f"""Transcription Result
====================

Audio File: {transcription.audio_file.filename}
Language: {transcription.language.title()}
Duration: {transcription.duration} minutes
Date: {transcription.completed_at.strftime('%Y-%m-%d %H:%M:%S')}

Transcription:
--------------

{transcription.text}
"""
        
        return content.encode('utf-8')
