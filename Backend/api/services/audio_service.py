import os
import uuid
from django.conf import settings
from django.core.files.storage import default_storage
from mutagen import File as MutagenFile
from pydub import AudioSegment
from ..models import AudioFile
from decimal import Decimal


class AudioService:
    ALLOWED_FORMATS = settings.ALLOWED_AUDIO_FORMATS
    MAX_DURATION_MINUTES = settings.MAX_AUDIO_DURATION_MINUTES
    
    @staticmethod
    def validate_audio_file(file):
        """
        Validate audio file format and size.
        Property 5: Audio File Format Validation
        """
        # Check file extension
        file_ext = file.name.split('.')[-1].lower()
        if file_ext not in AudioService.ALLOWED_FORMATS:
            return False, f"Unsupported format. Allowed formats: {', '.join(AudioService.ALLOWED_FORMATS)}"
        
        # Check file size
        if file.size > settings.MAX_UPLOAD_SIZE:
            return False, f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB"
        
        return True, None
    
    @staticmethod
    def extract_audio_duration(file_path):
        """
        Extract duration from audio file in minutes.
        Property 7: Audio Duration Calculation Accuracy
        """
        try:
            # Try mutagen first (more accurate)
            audio = MutagenFile(file_path)
            if audio and audio.info:
                duration_seconds = audio.info.length
                return Decimal(str(duration_seconds / 60))
        except Exception:
            pass
        
        try:
            # Fallback to pydub
            audio = AudioSegment.from_file(file_path)
            duration_seconds = len(audio) / 1000.0
            return Decimal(str(duration_seconds / 60))
        except Exception as e:
            raise ValueError(f"Could not extract audio duration: {str(e)}")
    
    @staticmethod
    def store_audio_file(file, user):
        """
        Store audio file and create database record.
        Property 6: Audio File Storage and ID Generation
        """
        # Validate file
        is_valid, error_message = AudioService.validate_audio_file(file)
        if not is_valid:
            raise ValueError(error_message)
        
        # Generate unique filename
        file_ext = file.name.split('.')[-1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join('audio_files', str(user.id), unique_filename)
        
        # Save file
        saved_path = default_storage.save(file_path, file)
        full_path = os.path.join(settings.MEDIA_ROOT, saved_path)
        
        # Extract duration
        try:
            duration_minutes = AudioService.extract_audio_duration(full_path)
        except ValueError as e:
            # Clean up file if duration extraction fails
            default_storage.delete(saved_path)
            raise e
        
        # Check duration limit
        if duration_minutes > Decimal(str(AudioService.MAX_DURATION_MINUTES)):
            default_storage.delete(saved_path)
            raise ValueError(f"Audio duration exceeds maximum of {AudioService.MAX_DURATION_MINUTES} minutes")
        
        # Create database record
        audio_file = AudioFile.objects.create(
            user=user,
            filename=file.name,
            file_path=saved_path,
            duration=duration_minutes,
            size=file.size,
            format=file_ext
        )
        
        return audio_file
    
    @staticmethod
    def delete_audio_file(audio_file):
        """
        Delete audio file from storage and database.
        """
        # Delete physical file
        if default_storage.exists(audio_file.file_path):
            default_storage.delete(audio_file.file_path)
        
        # Delete database record
        audio_file.delete()
