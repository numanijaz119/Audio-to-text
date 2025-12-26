from django.db import transaction
from decimal import Decimal
from ..models import Wallet, Transaction
from django.conf import settings
from ..utils.decorators import retry_on_deadlock
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
        
        has_balance = wallet.balance >= remaining_cost
        
        return has_balance, cost
    
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
    @retry_on_deadlock(max_retries=3)
    @transaction.atomic
    def deduct_transcription_cost(user, duration_minutes):
        """
        Deduct cost from demo minutes first, then wallet balance.
        Property 13: Demo Minutes Priority in Billing
        Property 16: Transaction Record Creation
        """
        print(f"\n[WALLET] deduct_transcription_cost() called")
        print(f"[WALLET] User ID: {user.id}")
        print(f"[WALLET] Duration: {duration_minutes} minutes")
        
        print(f"[WALLET] Acquiring wallet lock (select_for_update)...")
        wallet = Wallet.objects.select_for_update().get(user=user)
        print(f"[WALLET] ✓ Wallet lock acquired")
        
        duration = Decimal(str(duration_minutes))
        duration_rounded = Decimal(math.ceil(float(duration)))
        print(f"[WALLET] Duration rounded: {duration_rounded} minutes")
        
        balance_before = wallet.balance
        demo_before = wallet.demo_minutes_remaining
        print(f"[WALLET] Balance before: ₹{balance_before}")
        print(f"[WALLET] Demo minutes before: {demo_before}")
        
        # Track the billed minutes (rounded up)
        billed_minutes = duration_rounded
        
        # Deduct from demo minutes first
        print(f"[WALLET] Deducting from demo minutes...")
        if wallet.demo_minutes_remaining > 0:
            demo_used = min(wallet.demo_minutes_remaining, duration_rounded)
            print(f"[WALLET] Demo used: {demo_used} minutes")
            wallet.demo_minutes_remaining -= demo_used
            duration_rounded -= demo_used
            print(f"[WALLET] Demo remaining: {wallet.demo_minutes_remaining}")
            print(f"[WALLET] Duration remaining: {duration_rounded} minutes")
        
        # Deduct remaining from wallet balance
        print(f"[WALLET] Deducting from wallet balance...")
        cost = Decimal('0.00')
        if duration_rounded > 0:
            cost = duration_rounded * Decimal(str(settings.COST_PER_MINUTE))
            print(f"[WALLET] Cost to deduct: ₹{cost}")
            wallet.balance -= cost
            wallet.total_spent += cost
            print(f"[WALLET] Balance after: ₹{wallet.balance}")
            print(f"[WALLET] Total spent: ₹{wallet.total_spent}")
        else:
            print(f"[WALLET] No balance deduction needed (covered by demo)")
        
        # Track billed minutes (rounded up) instead of actual duration
        wallet.total_minutes_used += billed_minutes
        print(f"[WALLET] Billed minutes: {billed_minutes}")
        print(f"[WALLET] Total minutes used: {wallet.total_minutes_used}")
        
        print(f"[WALLET] Saving wallet to database...")
        wallet.save()
        print(f"[WALLET] ✓ Wallet saved")
        
        # Create transaction record
        print(f"[WALLET] Creating transaction record...")
        transaction_obj = Transaction.objects.create(
            wallet=wallet,
            type='debit',
            amount=cost,
            balance_before=balance_before,
            balance_after=wallet.balance,
            description=f'Transcription cost for {duration_minutes:.2f} minutes (Billed: {billed_minutes} min, Demo: {demo_before:.2f} -> {wallet.demo_minutes_remaining:.2f})'
        )
        print(f"[WALLET] ✓ Transaction created with ID: {transaction_obj.id}")
        print(f"[WALLET] Transaction type: {transaction_obj.type}")
        print(f"[WALLET] Transaction amount: ₹{transaction_obj.amount}")
        print(f"[WALLET] ✓ deduct_transcription_cost() completed\n")
        
        return transaction_obj, cost
    
    @staticmethod
    @retry_on_deadlock(max_retries=3)
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
