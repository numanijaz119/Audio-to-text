import { useState, useEffect } from 'react';
import { X, Wallet, History, Plus, Loader2, CheckCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { walletApi, transactionApi } from '../services/api';
import type { WalletDetails, Transaction } from '../types';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletData: WalletDetails | null;
  onRefresh: () => void;
}

type TabType = 'balance' | 'recharge' | 'history';

export default function WalletModal({ isOpen, onClose, walletData, onRefresh }: WalletModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('balance');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const presetAmounts = [100, 250, 500, 1000];

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchTransactions();
    }
  }, [isOpen, activeTab]);

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const data = await transactionApi.getAll();
      setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleRecharge = async () => {
    const amount = selectedAmount || parseFloat(customAmount);
    
    if (!amount || amount < 10) {
      toast.error('Minimum recharge amount is ₹10');
      return;
    }

    setIsProcessing(true);

    try {
      const order = await walletApi.createOrder(amount);

      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
      }

      const options = {
        key: order.key_id,
        amount: order.amount * 100,
        currency: order.currency,
        order_id: order.order_id,
        name: 'AudioScribe',
        description: 'Wallet Recharge',
        theme: { color: '#3b82f6' },
        handler: async (response: any) => {
          try {
            await walletApi.verifyPayment({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              amount: amount,
            });
            
            toast.success(`₹${amount} added to your wallet!`);
            onRefresh();
            setSelectedAmount(null);
            setCustomAmount('');
            setActiveTab('balance');
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => setIsProcessing(false),
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in" onClick={onClose} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl pointer-events-auto animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Wallet</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {[
              { id: 'balance', label: 'Balance', icon: <Wallet className="w-4 h-4" /> },
              { id: 'recharge', label: 'Add Funds', icon: <Plus className="w-4 h-4" /> },
              { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Balance Tab */}
            {activeTab === 'balance' && (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white">
                  <p className="text-blue-100 text-sm mb-1">Current Balance</p>
                  <p className="text-4xl font-bold">₹{walletData?.wallet.balance.toFixed(2) || '0.00'}</p>
                  
                  {(walletData?.wallet.demo_minutes_remaining || 0) > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <p className="text-blue-100 text-sm">Free Minutes Remaining</p>
                      <p className="text-2xl font-semibold">
                        {walletData?.wallet.demo_minutes_remaining.toFixed(1)} min
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-slate-500 text-sm">Total Spent</p>
                    <p className="text-xl font-semibold text-slate-800">
                      ₹{walletData?.wallet.total_spent.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-slate-500 text-sm">Minutes Used</p>
                    <p className="text-xl font-semibold text-slate-800">
                      {walletData?.wallet.total_minutes_used.toFixed(1) || '0'} min
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('recharge')}
                  className="w-full btn btn-primary"
                >
                  <Plus className="w-5 h-5" />
                  Add Funds
                </button>
              </div>
            )}

            {/* Recharge Tab */}
            {activeTab === 'recharge' && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">Select Amount</p>
                  <div className="grid grid-cols-2 gap-3">
                    {presetAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => {
                          setSelectedAmount(amount);
                          setCustomAmount('');
                        }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedAmount === amount
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 hover:border-blue-300 text-slate-700'
                        }`}
                      >
                        <p className="text-2xl font-bold">₹{amount}</p>
                        <p className="text-sm text-slate-500">{amount} minutes</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-sm text-slate-400">or enter custom amount</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Custom Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(null);
                      }}
                      placeholder="Enter amount"
                      className="input pl-8"
                      min="10"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Minimum ₹10</p>
                </div>

                <button
                  onClick={handleRecharge}
                  disabled={isProcessing || (!selectedAmount && !customAmount)}
                  className="w-full btn btn-primary"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Pay ₹{selectedAmount || customAmount || 0}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === 'recharge' ? 'bg-emerald-100' : 'bg-blue-100'
                          }`}>
                            {tx.type === 'recharge' ? (
                              <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">
                              {tx.type === 'recharge' ? 'Wallet Recharge' : 'Transcription'}
                            </p>
                            <p className="text-xs text-slate-400">{formatDate(tx.created_at)}</p>
                          </div>
                        </div>
                        <p className={`font-semibold ${
                          tx.type === 'recharge' ? 'text-emerald-600' : 'text-slate-700'
                        }`}>
                          {tx.type === 'recharge' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
