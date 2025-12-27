from django.contrib import admin
from .models import User, Wallet, Transaction, AudioFile, Transcription, ContactMessage


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'name', 'provider', 'created_at']
    list_filter = ['provider', 'created_at']
    search_fields = ['email', 'name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance', 'demo_minutes_remaining', 'total_spent', 'total_minutes_used']
    search_fields = ['user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['wallet', 'type', 'amount', 'balance_after', 'created_at']
    list_filter = ['type', 'created_at']
    search_fields = ['wallet__user__email', 'payment_id']
    readonly_fields = ['id', 'created_at']


@admin.register(AudioFile)
class AudioFileAdmin(admin.ModelAdmin):
    list_display = ['filename', 'user', 'duration', 'format', 'uploaded_at']
    list_filter = ['format', 'uploaded_at']
    search_fields = ['filename', 'user__email']
    readonly_fields = ['id', 'uploaded_at']


@admin.register(Transcription)
class TranscriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'language', 'status', 'duration', 'cost', 'created_at']
    list_filter = ['status', 'language', 'created_at']
    search_fields = ['user__email', 'audio_file__filename']
    readonly_fields = ['id', 'created_at', 'completed_at']


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'subject', 'status', 'created_at']
    list_filter = ['subject', 'status', 'created_at']
    search_fields = ['name', 'email', 'message']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Contact Information', {
            'fields': ('name', 'email', 'subject')
        }),
        ('Message', {
            'fields': ('message',)
        }),
        ('Status & Notes', {
            'fields': ('status', 'admin_notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        # Make contact info readonly after creation
        if obj:  # editing an existing object
            return self.readonly_fields + ('name', 'email', 'subject', 'message')
        return self.readonly_fields
