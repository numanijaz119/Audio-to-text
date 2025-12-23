import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api.service';
import { Wallet, TrendingUp, Clock, Plus } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function WalletPage() {
  const [rechargeAmount, setRechargeAmount] = useState('');
  const queryClient = useQueryClient();

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: apiService.getWallet,
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: apiService.getTransactions,
  });

  const createOrderMutation = useMutation({
    mutationFn: apiService.createOrder,
    onSuccess: (orderData) => {
      // Initialize Razorpay payment
      const options = {
        key: orderData.key_id,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: 'Audio to Text',
        description: 'Wallet Recharge',
        handler: async (response: any) => {
          try {
            await apiService.verifyPayment({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              amount: orderData.amount,
            });
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            alert('Payment successful!');
          } catch (error) {
            alert('Payment verification failed');
          }
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    },
  });

  const handleRecharge = (amount: number) => {
    createOrderMutation.mutate(amount);
  };

  const handleCustomRecharge = () => {
    const amount = parseFloat(rechargeAmount);
    if (amount > 0) {
      handleRecharge(amount);
      setRechargeAmount('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-600 mt-1">Manage your wallet and view transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                ₹{walletData?.wallet.balance.toFixed(2) || '0.00'}
              </p>
            </div>
            <Wallet className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Demo Minutes</p>
              <p className="text-3xl font-bold text-gray-900">
                {walletData?.wallet.demo_minutes_remaining.toFixed(2) || '0.00'}
              </p>
            </div>
            <Clock className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-3xl font-bold text-gray-900">
                ₹{walletData?.wallet.total_spent.toFixed(2) || '0.00'}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Recharge Wallet</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[100, 500, 1000, 2000].map((amount) => (
            <button
              key={amount}
              onClick={() => handleRecharge(amount)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 rounded-lg border border-blue-200"
            >
              ₹{amount}
            </button>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="number"
            value={rechargeAmount}
            onChange={(e) => setRechargeAmount(e.target.value)}
            placeholder="Custom amount"
            className="flex-1 border border-gray-300 rounded-md px-4 py-2"
          />
          <button
            onClick={handleCustomRecharge}
            disabled={!rechargeAmount || parseFloat(rechargeAmount) <= 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <Plus className="w-5 h-5 mr-1" />
            Recharge
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        {transactions && transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((t) => (
              <div key={t.id} className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="font-medium capitalize">{t.type.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-600">{t.description}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${t.type === 'recharge' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'recharge' ? '+' : '-'}₹{t.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No transactions yet</p>
        )}
      </div>
    </div>
  );
}
