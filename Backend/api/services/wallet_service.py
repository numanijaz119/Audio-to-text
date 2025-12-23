from django.db import transaction
from decimal import Decimal
from ..models import Wallet, Transaction
from django.conf import settings
import math


class WalletService:
    @staticmethod
    def check_sufficient_balance(user, duration_minutes):
        """
        Check if user has sufficient demo minutes or wallet balance.
        Property 14: Wallet Charging After Demo Exhaustion
        """
        wallet = user.wallet
        cost = WalletService.calculate_cost(duration_minutes, wallet.demo_minutes_remaining)
        
        if wallet.demo_minutes_remaining >= Decimal(str(duration_minutes)):
            return True, cost
        
        remaining_duration = Decimal(str(duration_minutes)) - wallet.demo_minutes_remaining
        remaining_cost = remaining_duration * Decimal(str(settings.COST_PER_MINUTE))
        
        return wallet.balance >= remaining_cost, cost
    
    @staticmethod
    def calculate_cost(duration_minutes, demo_minutes_available):
        """
        Calculate transcription cost considering demo minutes.
        Property 15: Transcription Cost Calculation
        """
        duration = Decimal(str(duration_minutes))
        demo_available = Decimal(str(demo_minutes_available))
        
        # Round up to nearest minute
        duration_rounded = Decimal(math.ceil(float(duration)))
        
        if demo_available >= duration_rounded:
            return Decimal('0.00')
        
        billable_minutes = duration_rounded - demo_available
        cost = billable_minutes * Decimal(str(settings.COST_PER_MINUTE))
        
        return max(cost, Decimal('0.00'))
    
    @staticmethod
    @transaction.atomic
    def deduct_transcription_cost(user, duration_minutes):
        """
        Deduct cost from demo minutes first, then wallet balance.
        Property 13: Demo Minutes Priority in Billing
        Property 16: Transaction Record Creation
        """
        wallet = Wallet.objects.select_for_update().get(user=user)
        duration = Decimal(str(duration_minutes))
        duration_rounded = Decimal(math.ceil(float(duration)))
        
        balance_before = wallet.balance
        demo_before = wallet.demo_minutes_remaining
        
        # Deduct from demo minutes first
        if wallet.demo_minutes_remaining > 0:
            demo_used = min(wallet.demo_minutes_remaining, duration_rounded)
            wallet.demo_minutes_remaining -= demo_used
            duration_rounded -= demo_used
        
        # Deduct remaining from wallet balance
        cost = Decimal('0.00')
        if duration_rounded > 0:
            cost = duration_rounded * Decimal(str(settings.COST_PER_MINUTE))
            wallet.balance -= cost
            wallet.total_spent += cost
        
        wallet.total_minutes_used += Decimal(str(duration_minutes))
        wallet.save()
        
        # Create transaction record
        transaction_obj = Transaction.objects.create(
            wallet=wallet,
            type='debit',
            amount=cost,
            balance_before=balance_before,
            balance_after=wallet.balance,
            description=f'Transcription cost for {duration_minutes:.2f} minutes (Demo: {demo_before:.2f} -> {wallet.demo_minutes_remaining:.2f})'
        )
        
        return transaction_obj, cost
    
    @staticmethod
    @transaction.atomic
    def process_recharge(user, amount, payment_id, razorpay_order_id):
        """
        Credit wallet after successful payment.
        Property 18: Payment Webhook Processing
        Property 16: Transaction Record Creation
        """
        wallet = Wallet.objects.select_for_update().get(user=user)
        balance_before = wallet.balance
        
        amount_decimal = Decimal(str(amount))
        wallet.balance += amount_decimal
        wallet.save()
        
        transaction_obj = Transaction.objects.create(
            wallet=wallet,
            type='recharge',
            amount=amount_decimal,
            balance_before=balance_before,
            balance_after=wallet.balance,
            description=f'Wallet recharge via Razorpay',
            payment_id=payment_id,
            razorpay_order_id=razorpay_order_id
        )
        
        return transaction_obj
    
    @staticmethod
    def get_usage_statistics(user):
        """
        Calculate usage statistics for user.
        Property 20: Usage Statistics Calculation
        """
        wallet = user.wallet
        
        return {
            'total_minutes_transcribed': float(wallet.total_minutes_used),
            'total_amount_spent': float(wallet.total_spent),
            'current_balance': float(wallet.balance),
            'demo_minutes_remaining': float(wallet.demo_minutes_remaining),
        }
