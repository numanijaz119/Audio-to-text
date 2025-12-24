import { useState } from 'react';
import { X, Wallet, Plus, History } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api.service';

interface Props {
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function WalletModal({ onClose }: Props) {
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'recharge' | 'history'>('recharge');
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
      const options = {
        key: orderData.key_id,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: 'AudioText',
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Wallet</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-700">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="text-sm opacity-90">Total Balance</p>
              <p className="text-4xl font-bold mt-1">₹{walletData?.wallet.balance.toFixed(2) || '0.00'}</p>
            </div>
            <Wallet className="w-16 h-16 opacity-20" />
          </div>
          <div className="mt-4 flex items-center space-x-4 text-white text-sm">
            <div>
              <span className="opacity-90">Free Minutes:</span>
              <span className="font-semibold ml-2">{walletData?.wallet.demo_minutes_remaining.toFixed(1) || '0.0'} min</span>
            </div>
            <div className="w-px h-4 bg-white opacity-30"></div>
            <div>
              <span className="opacity-90">Total Spent:</span>
              <span className="font-semibold ml-2">₹{walletData?.wallet.total_spent.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('recharge')}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                activeTab === 'recharge'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Recharge
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="w-4 h-4 inline mr-2" />
              History
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'recharge' ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Recharge</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[100, 500, 1000, 2000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleRecharge(amount)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-4 rounded-lg border border-blue-200 transition-colors"
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Amount</h3>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleCustomRecharge}
                  disabled={!rechargeAmount || parseFloat(rechargeAmount) <= 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
                >
                  <Plus className="w-5 h-5 mr-1" />
                  Add
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>
              {transactions && transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{t.type.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-600 mt-1">{t.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(t.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          t.type === 'recharge' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {t.type === 'recharge' ? '+' : '-'}₹{t.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No transactions yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
