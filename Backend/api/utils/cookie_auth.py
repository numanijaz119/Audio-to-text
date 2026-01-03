from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads tokens from httpOnly cookies
    Falls back to Authorization header if cookie is not present
    """
    def authenticate(self, request):
        # Try to get token from cookie first
        cookie_name = getattr(settings, 'JWT_AUTH_COOKIE', 'access_token')
        raw_token = request.COOKIES.get(cookie_name)
        
        # If no cookie, fall back to header authentication
        if raw_token is None:
            return super().authenticate(request)
        
        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except InvalidToken:
            return None


def set_auth_cookies(response, tokens):
    """
    Set JWT tokens in httpOnly cookies
    
    Args:
        response: Django Response object
        tokens: Dict with 'access' and 'refresh' token strings
    """
    access_token = tokens.get('access')
    refresh_token = tokens.get('refresh')
    
    if access_token:
        response.set_cookie(
            key=getattr(settings, 'JWT_AUTH_COOKIE', 'access_token'),
            value=access_token,
            max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
            httponly=getattr(settings, 'JWT_AUTH_HTTPONLY', True),
            secure=getattr(settings, 'JWT_AUTH_SECURE', False),
            samesite=getattr(settings, 'JWT_AUTH_SAMESITE', 'Lax'),
        )
    
    if refresh_token:
        response.set_cookie(
            key=getattr(settings, 'JWT_AUTH_REFRESH_COOKIE', 'refresh_token'),
            value=refresh_token,
            max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
            httponly=getattr(settings, 'JWT_AUTH_HTTPONLY', True),
            secure=getattr(settings, 'JWT_AUTH_SECURE', False),
            samesite=getattr(settings, 'JWT_AUTH_SAMESITE', 'Lax'),
        )


def clear_auth_cookies(response):
    """
    Clear JWT authentication cookies
    
    Args:
        response: Django Response object
    """
    response.delete_cookie(
        key=getattr(settings, 'JWT_AUTH_COOKIE', 'access_token'),
        samesite=getattr(settings, 'JWT_AUTH_SAMESITE', 'Lax'),
    )
    response.delete_cookie(
        key=getattr(settings, 'JWT_AUTH_REFRESH_COOKIE', 'refresh_token'),
        samesite=getattr(settings, 'JWT_AUTH_SAMESITE', 'Lax'),
    )
