from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
from ..models import User, Wallet
from django.conf import settings
from decimal import Decimal


class AuthService:
    @staticmethod
    @transaction.atomic
    def get_or_create_user(email, name, provider, provider_id):
        """
        Get existing user or create new user with initialized wallet.
        Property 1: OAuth Provider User Creation or Retrieval
        Property 3: New User Wallet Initialization
        """
        user, created = User.objects.get_or_create(
            provider=provider,
            provider_id=provider_id,
            defaults={
                'email': email,
                'name': name,
            }
        )
        
        if created:
            # Initialize wallet for new user
            Wallet.objects.create(
                user=user,
                demo_minutes_remaining=Decimal(str(settings.DEMO_MINUTES))
            )
        
        return user, created
    
    @staticmethod
    def generate_tokens(user):
        """
        Generate JWT access and refresh tokens.
        Property 2: JWT Token Generation on Authentication
        """
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
    
    @staticmethod
    def authenticate_oauth_user(provider, email, name, provider_id):
        """
        Complete OAuth authentication flow.
        """
        user, created = AuthService.get_or_create_user(email, name, provider, provider_id)
        tokens = AuthService.generate_tokens(user)
        
        return {
            'user': user,
            'tokens': tokens,
            'is_new_user': created,
        }
