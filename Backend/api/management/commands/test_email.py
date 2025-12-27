from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from api.models import ContactMessage
import uuid
from datetime import datetime


class Command(BaseCommand):
    help = 'Test email functionality with sample contact form data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--to-email',
            type=str,
            help='Email address to send test email to',
            default='test@example.com'
        )

    def handle(self, *args, **options):
        to_email = options['to_email']
        
        # Create a sample contact message (not saved to DB)
        sample_contact = ContactMessage(
            id=uuid.uuid4(),
            name='John Doe',
            email=to_email,
            subject='technical',
            message='This is a test message to verify that the email templates are working correctly. The contact form should send admin notifications when users submit inquiries.',
            status='new',
            created_at=datetime.now()
        )
        
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@audioscribe.com')
        
        try:
            self.stdout.write('Testing admin notification email...')
            
            admin_context = {
                'contact': sample_contact,
                'frontend_url': frontend_url,
            }
            
            admin_subject = f"Test Email - New Contact Form Submission - {sample_contact.get_subject_display()}"
            admin_html_message = render_to_string('emails/contact_admin_notification.html', admin_context)
            admin_plain_message = render_to_string('emails/contact_admin_notification.txt', admin_context)
            
            send_mail(
                subject=admin_subject,
                message=admin_plain_message,
                html_message=admin_html_message,
                from_email=from_email,
                recipient_list=[to_email],
                fail_silently=False,
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'✅ Admin notification email sent to {to_email}')
            )
            
            self.stdout.write(
                self.style.SUCCESS('\n🎉 Email test completed successfully!')
            )
            self.stdout.write(
                'Check your email inbox and spam folder for the test email.'
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Email test failed: {str(e)}')
            )
            self.stdout.write(
                'Please check your email configuration in settings.py and .env file.'
            )
            
            # Show current email settings (without sensitive data)
            self.stdout.write('\nCurrent email configuration:')
            self.stdout.write(f'EMAIL_BACKEND: {settings.EMAIL_BACKEND}')
            self.stdout.write(f'EMAIL_HOST: {getattr(settings, "EMAIL_HOST", "Not set")}')
            self.stdout.write(f'EMAIL_PORT: {getattr(settings, "EMAIL_PORT", "Not set")}')
            self.stdout.write(f'EMAIL_USE_TLS: {getattr(settings, "EMAIL_USE_TLS", "Not set")}')
            self.stdout.write(f'DEFAULT_FROM_EMAIL: {getattr(settings, "DEFAULT_FROM_EMAIL", "Not set")}')
            self.stdout.write(f'SUPPORT_EMAIL: {getattr(settings, "SUPPORT_EMAIL", "Not set")}')
            self.stdout.write(f'ADMIN_EMAIL: {getattr(settings, "ADMIN_EMAIL", "Not set")}')