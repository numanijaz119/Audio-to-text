from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'wallet', views.WalletViewSet, basename='wallet')
router.register(r'transactions', views.TransactionViewSet, basename='transaction')
router.register(r'audio', views.AudioFileViewSet, basename='audiofile')
router.register(r'transcriptions', views.TranscriptionViewSet, basename='transcription')

urlpatterns = [
    # Auth endpoints
    path('auth/google/login/', views.google_login, name='google-login'),
    path('auth/facebook/login/', views.facebook_login, name='facebook-login'),
    path('auth/user/', views.get_current_user, name='current-user'),
    
    # Contact form
    path('contact/', views.contact_form, name='contact-form'),
    
    # Health check
    path('health/', views.health_check, name='health-check'),
    
    # Webhook
    path('payment/webhook/', views.razorpay_webhook, name='razorpay-webhook'),
    
    # Router URLs
    path('', include(router.urls)),
]
