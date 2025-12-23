import os
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from openai import OpenAI
from ..models import Transcription, AudioFile
from .wallet_service import WalletService


class TranscriptionService:
    @staticmethod
    def create_transcription(audio_file_id, language, user):
        """
        Create transcription request with cost validation.
        Property 8: Transcription Processing
        """
        try:
            audio_file = AudioFile.objects.get(id=audio_file_id, user=user)
        except AudioFile.DoesNotExist:
            raise ValueError("Audio file not found")
        
        # Check if user has sufficient balance
        has_balance, estimated_cost = WalletService.check_sufficient_balance(
            user, 
            float(audio_file.duration)
        )
        
        if not has_balance:
            raise ValueError("Insufficient balance. Please recharge your wallet.")
        
        # Create transcription record
        transcription = Transcription.objects.create(
            user=user,
            audio_file=audio_file,
            language=language,
            duration=audio_file.duration,
            cost=estimated_cost,
            status='pending'
        )
        
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
        try:
            # Update status to processing
            transcription.status = 'processing'
            transcription.save()
            
            # Get audio file path
            audio_path = os.path.join(
                settings.MEDIA_ROOT, 
                transcription.audio_file.file_path
            )
            
            if not os.path.exists(audio_path):
                raise FileNotFoundError("Audio file not found on disk")
            
            # Call OpenAI Whisper API
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            
            with open(audio_path, 'rb') as audio_file:
                # Map language to Whisper language codes
                language_code = 'en' if transcription.language == 'english' else 'hi'
                
                response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language_code,
                    response_format="text"
                )
            
            # Deduct cost from wallet
            transaction_obj, actual_cost = WalletService.deduct_transcription_cost(
                transcription.user,
                float(transcription.duration)
            )
            
            # Update transcription with result
            transcription.text = response
            transcription.cost = actual_cost
            transcription.status = 'completed'
            transcription.completed_at = timezone.now()
            transcription.save()
            
            return transcription
            
        except Exception as e:
            # Handle transcription failure
            transcription.status = 'failed'
            transcription.error_message = str(e)
            transcription.save()
            
            # Note: Cost is NOT deducted on failure (Property 10)
            raise e
    
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
