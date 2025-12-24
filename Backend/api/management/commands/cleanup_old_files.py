from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import AudioFile
import os
import logging

logger = logging.getLogger('api')


class Command(BaseCommand):
    help = 'Clean up old audio files and transcriptions'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Delete files older than this many days (default: 30)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
    
    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Find old audio files
        old_audio_files = AudioFile.objects.filter(uploaded_at__lt=cutoff_date)
        
        self.stdout.write(f"\nFound {old_audio_files.count()} audio files older than {days} days")
        
        deleted_count = 0
        failed_count = 0
        freed_space = 0
        
        for audio_file in old_audio_files:
            file_path = audio_file.file_path
            file_size = audio_file.size
            
            if dry_run:
                self.stdout.write(f"[DRY RUN] Would delete: {audio_file.filename} ({file_size} bytes)")
                continue
            
            try:
                # Delete physical file
                from django.conf import settings
                full_path = os.path.join(settings.MEDIA_ROOT, file_path)
                if os.path.exists(full_path):
                    os.remove(full_path)
                    freed_space += file_size
                
                # Delete database record (cascades to transcriptions)
                audio_file.delete()
                deleted_count += 1
                
                logger.info(f"Deleted old file: {audio_file.filename}")
                
            except Exception as e:
                failed_count += 1
                logger.error(f"Failed to delete {audio_file.filename}: {e}")
                self.stdout.write(self.style.ERROR(f"Failed to delete {audio_file.filename}: {e}"))
        
        if dry_run:
            self.stdout.write(self.style.WARNING(f"\n[DRY RUN] No files were actually deleted"))
        else:
            self.stdout.write(self.style.SUCCESS(f"\n✓ Successfully deleted {deleted_count} files"))
            self.stdout.write(self.style.SUCCESS(f"✓ Freed {freed_space / (1024*1024):.2f} MB of storage"))
            
            if failed_count > 0:
                self.stdout.write(self.style.WARNING(f"⚠ Failed to delete {failed_count} files"))
