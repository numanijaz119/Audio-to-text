from django.test import TestCase
from decimal import Decimal
from api.models import User, Wallet
from api.services.wallet_service import WalletService


class WalletServiceTestCase(TestCase):
    def setUp(self):
        """Set up test user and wallet"""
        self.user = User.objects.create(
            email='test@example.com',
            name='Test User',
            provider='google',
            provider_id='test123'
        )
        self.wallet = Wallet.objects.create(
            user=self.user,
            balance=Decimal('100.00'),
            demo_minutes_remaining=Decimal('10.00')
        )
    
    def test_calculate_cost_only_demo(self):
        """Test cost calculation when only demo minutes are used"""
        cost = WalletService.calculate_cost(5.0, 10.0)
        self.assertEqual(cost, Decimal('0.00'))
    
    def test_calculate_cost_demo_and_paid(self):
        """Test cost calculation when both demo and paid minutes are used"""
        cost = WalletService.calculate_cost(15.0, 10.0)
        self.assertEqual(cost, Decimal('5.00'))
    
    def test_calculate_cost_no_demo(self):
        """Test cost calculation when no demo minutes available"""
        cost = WalletService.calculate_cost(15.0, 0.0)
        self.assertEqual(cost, Decimal('15.00'))
    
    def test_check_sufficient_balance_true(self):
        """Test balance check when user has enough balance"""
        has_balance, cost = WalletService.check_sufficient_balance(self.user, 15.0)
        self.assertTrue(has_balance)
        self.assertEqual(cost, Decimal('5.00'))  # 15 - 10 demo = 5
    
    def test_check_sufficient_balance_false(self):
        """Test balance check when user has insufficient balance"""
        has_balance, cost = WalletService.check_sufficient_balance(self.user, 150.0)
        self.assertFalse(has_balance)
        self.assertEqual(cost, Decimal('140.00'))  # 150 - 10 demo = 140
    
    def test_deduct_transcription_cost(self):
        """Test wallet deduction for transcription"""
        transaction, cost = WalletService.deduct_transcription_cost(self.user, 15.0)
        
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, Decimal('95.00'))  # 100 - 5
        self.assertEqual(self.wallet.demo_minutes_remaining, Decimal('0.00'))  # 10 - 10
        self.assertEqual(cost, Decimal('5.00'))
        self.assertEqual(transaction.type, 'debit')
        self.assertEqual(transaction.amount, Decimal('5.00'))
    
    def test_process_recharge(self):
        """Test wallet recharge"""
        transaction = WalletService.process_recharge(
            self.user, 
            50.0, 
            'pay_test123', 
            'order_test123'
        )
        
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, Decimal('150.00'))  # 100 + 50
        self.assertEqual(transaction.type, 'recharge')
        self.assertEqual(transaction.amount, Decimal('50.00'))
        self.assertEqual(transaction.payment_id, 'pay_test123')
