import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import MinValueValidator
from decimal import Decimal


class UserManager(BaseUserManager):
    def create_user(self, email, name, provider, provider_id, password=None):
        if not email:
            raise ValueError('Users must have an email address')
        
        user = self.model(
            email=self.normalize_email(email),
            name=name,
            provider=provider,
            provider_id=provider_id,
        )
        user.set_unusable_password()
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, name, password=None):
        user = self.model(
            email=self.normalize_email(email),
            name=name,
            provider='admin',
            provider_id='admin',
        )
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    PROVIDER_CHOICES = [
        ('google', 'Google'),
        ('facebook', 'Facebook'),
        ('admin', 'Admin'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, max_length=255)
    name = models.CharField(max_length=255)
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    provider_id = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['provider', 'provider_id']),
        ]
    
    def __str__(self):
        return self.email


class Wallet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    demo_minutes_remaining = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('10.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    total_spent = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00')
    )
    total_minutes_used = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'wallets'
    
    def __str__(self):
        return f"Wallet for {self.user.email}"


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('recharge', 'Recharge'),
        ('debit', 'Debit'),
        ('demo_credit', 'Demo Credit'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    balance_before = models.DecimalField(max_digits=10, decimal_places=2)
    balance_after = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    payment_id = models.CharField(max_length=255, null=True, blank=True)
    razorpay_order_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['wallet', '-created_at']),
            models.Index(fields=['payment_id']),
        ]
    
    def __str__(self):
        return f"{self.type} - {self.amount} - {self.created_at}"


class AudioFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='audio_files')
    filename = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    duration = models.DecimalField(max_digits=6, decimal_places=2)  # in minutes
    size = models.BigIntegerField()  # in bytes
    format = models.CharField(max_length=10)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audio_files'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['user', '-uploaded_at']),
        ]
    
    def __str__(self):
        return f"{self.filename} - {self.user.email}"


class Transcription(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    LANGUAGE_CHOICES = [
        ('auto', 'Auto Detect'),
        ('english', 'English'),
        ('hindi', 'Hindi'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transcriptions')
    audio_file = models.ForeignKey(AudioFile, on_delete=models.CASCADE, related_name='transcriptions')
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES)
    text = models.TextField(blank=True)
    duration = models.DecimalField(max_digits=6, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'transcriptions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Transcription {self.id} - {self.status}"


class ContactMessage(models.Model):
    SUBJECT_CHOICES = [
        ('general', 'General Inquiry'),
        ('technical', 'Technical Support'),
        ('billing', 'Billing & Payments'),
        ('feature', 'Feature Request'),
        ('bug', 'Bug Report'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    subject = models.CharField(max_length=20, choices=SUBJECT_CHOICES)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    admin_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'contact_messages'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['email']),
            models.Index(fields=['subject']),
        ]
    
    def __str__(self):
        return f"Contact from {self.name} - {self.subject}"
