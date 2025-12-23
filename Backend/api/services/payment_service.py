import razorpay
import hmac
import hashlib
from django.conf import settings


class PaymentService:
    def __init__(self):
        self.client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
    
    def create_order(self, amount, user):
        """
        Create Razorpay order for wallet recharge.
        Property 17: Razorpay Payment Session Creation
        """
        # Amount should be in paise (smallest currency unit)
        amount_paise = int(float(amount) * 100)
        
        order_data = {
            'amount': amount_paise,
            'currency': 'INR',
            'receipt': f'order_{user.id}',
            'notes': {
                'user_id': str(user.id),
                'user_email': user.email,
            }
        }
        
        order = self.client.order.create(data=order_data)
        
        return {
            'order_id': order['id'],
            'amount': amount,
            'currency': 'INR',
            'key_id': settings.RAZORPAY_KEY_ID,
        }
    
    def verify_payment_signature(self, order_id, payment_id, signature):
        """
        Verify Razorpay payment signature for security.
        Property 18: Payment Webhook Processing
        """
        try:
            # Generate expected signature
            message = f"{order_id}|{payment_id}"
            expected_signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode(),
                message.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(expected_signature, signature)
        except Exception:
            return False
    
    def verify_webhook_signature(self, payload, signature):
        """
        Verify webhook signature from Razorpay.
        """
        try:
            expected_signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode(),
                payload.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(expected_signature, signature)
        except Exception:
            return False
    
    def fetch_payment(self, payment_id):
        """
        Fetch payment details from Razorpay.
        """
        try:
            payment = self.client.payment.fetch(payment_id)
            return payment
        except Exception as e:
            raise ValueError(f"Failed to fetch payment: {str(e)}")
