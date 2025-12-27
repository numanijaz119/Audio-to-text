from rest_framework import serializers
from .models import User, Wallet, Transaction, AudioFile, Transcription, ContactMessage


class UserSerializer(serializers.ModelSerializer):
    demo_minutes_remaining = serializers.SerializerMethodField()
    wallet_balance = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'provider', 'demo_minutes_remaining', 'wallet_balance', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_demo_minutes_remaining(self, obj):
        if hasattr(obj, 'wallet'):
            return float(obj.wallet.demo_minutes_remaining)
        return 0.0
    
    def get_wallet_balance(self, obj):
        if hasattr(obj, 'wallet'):
            return float(obj.wallet.balance)
        return 0.0


class WalletSerializer(serializers.ModelSerializer):
    balance = serializers.FloatField()
    demo_minutes_remaining = serializers.FloatField()
    total_spent = serializers.FloatField()
    total_minutes_used = serializers.FloatField()
    
    class Meta:
        model = Wallet
        fields = ['id', 'balance', 'demo_minutes_remaining', 'total_spent', 'total_minutes_used', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class TransactionSerializer(serializers.ModelSerializer):
    amount = serializers.FloatField()
    balance_before = serializers.FloatField()
    balance_after = serializers.FloatField()
    
    class Meta:
        model = Transaction
        fields = ['id', 'type', 'amount', 'balance_before', 'balance_after', 'description', 'payment_id', 'created_at']
        read_only_fields = ['id', 'created_at']


class AudioFileSerializer(serializers.ModelSerializer):
    duration = serializers.FloatField()
    
    class Meta:
        model = AudioFile
        fields = ['id', 'filename', 'duration', 'size', 'format', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class TranscriptionSerializer(serializers.ModelSerializer):
    audio_filename = serializers.CharField(source='audio_file.filename', read_only=True)
    duration = serializers.FloatField()
    cost = serializers.FloatField()
    
    class Meta:
        model = Transcription
        fields = ['id', 'audio_file', 'audio_filename', 'language', 'text', 'duration', 'cost', 'status', 'error_message', 'created_at', 'completed_at']
        read_only_fields = ['id', 'text', 'cost', 'status', 'error_message', 'created_at', 'completed_at']


class TranscriptionCreateSerializer(serializers.Serializer):
    audio_file_id = serializers.UUIDField()
    language = serializers.ChoiceField(choices=['auto', 'english', 'hindi'])


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']
    
    def validate_email(self, value):
        """Validate email format"""
        if not value or '@' not in value:
            raise serializers.ValidationError("Please provide a valid email address.")
        return value
    
    def validate_message(self, value):
        """Validate message length"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Message must be at least 10 characters long.")
        return value.strip()
    
    def validate_name(self, value):
        """Validate name"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long.")
        return value.strip()
    
    def validate_subject(self, value):
        """Validate subject is in allowed choices"""
        valid_subjects = ['general', 'technical', 'billing', 'feature', 'bug', 'other']
        if value not in valid_subjects:
            raise serializers.ValidationError(f"Invalid subject. Must be one of: {', '.join(valid_subjects)}")
        return value
