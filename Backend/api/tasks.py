from celery import shared_task
from .models import Transcription
from .services.transcription_service import TranscriptionService
import logging

logger = logging.getLogger('api')


@shared_task
def process_transcription_task(transcription_id):
    """
    Async task to process transcription without blocking HTTP request.
    Prevents 30+ second request timeouts.
    """
    try:
        logger.info(f"Starting async transcription task for ID: {transcription_id}")
        transcription = Transcription.objects.get(id=transcription_id)
        TranscriptionService.process_transcription(transcription)
        logger.info(f"Transcription {transcription_id} completed successfully")
        return {'status': 'success', 'transcription_id': str(transcription_id)}
    except Transcription.DoesNotExist:
        logger.error(f"Transcription {transcription_id} not found")
        return {'status': 'error', 'error': 'Transcription not found'}
    except Exception as e:
        logger.exception(f"Error processing transcription {transcription_id}")
        return {'status': 'error', 'error': str(e)}
