import razorpay
import hmac
import hashlib
from django.conf import settings
import logging

logger = logging.getLogger('api')


class PaymentService:
    def __init__(self):
        try:
            self.client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )
        except Exception as e:
            logger.error(f"Failed to initialize Razorpay client: {e}")
            raise
    
    def create_order(self, amount, user):
        """
        Create Razorpay order for wallet recharge.
        Property 17: Razorpay Payment Session Creation
        """
        try:
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
            
            logger.info(f"Creating Razorpay order: {order_data}")
            logger.info(f"Using Razorpay Key ID: {settings.RAZORPAY_KEY_ID[:10]}...")
            
            order = self.client.order.create(data=order_data)
            logger.info(f"Razorpay order created: {order}")
            
            return {
                'order_id': order['id'],
                'amount': amount,
                'currency': 'INR',
                'key_id': settings.RAZORPAY_KEY_ID,
            }
        except razorpay.errors.BadRequestError as e:
            logger.error(f"Razorpay Bad Request: {e}")
            raise ValueError("Invalid payment request. Please check your payment details.")
        except razorpay.errors.GatewayError as e:
            logger.error(f"Razorpay Gateway Error: {e}")
            raise ValueError("Payment gateway error. Please try again later.")
        except razorpay.errors.ServerError as e:
            logger.error(f"Razorpay Server Error: {e}")
            raise ValueError("Payment service temporarily unavailable. Please try again later.")
        except Exception as e:
            logger.exception(f"Error creating Razorpay order: {e}")
            
            # Check for JSON decode error (invalid credentials)
            if "JSONDecodeError" in str(type(e)) or "Expecting value" in str(e):
                logger.error("Razorpay returned empty response - likely invalid API credentials")
                raise ValueError("Payment gateway configuration error. Please contact support.")
            
            # Check if it's an authentication error
            if "401" in str(e) or "Unauthorized" in str(e):
                raise ValueError("Payment gateway authentication failed. Please contact support.")
            
            raise ValueError("Payment service is currently unavailable. Please try again later.")
    
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
