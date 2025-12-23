import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api.service';
import { Wallet, Clock, TrendingUp, FileText } from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: apiService.getWallet,
  });

  const { data: transcriptions } = useQuery({
    queryKey: ['transcriptions'],
    queryFn: () => apiService.getTranscriptions({ status: 'completed' }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
        <p className="text-gray-600 mt-1">Manage your audio transcriptions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Wallet Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{walletData?.wallet.balance.toFixed(2) || '0.00'}
              </p>
            </div>
            <Wallet className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Demo Minutes</p>
              <p className="text-2xl font-bold text-gray-900">
                {walletData?.wallet.demo_minutes_remaining.toFixed(2) || '0.00'}
              </p>
            </div>
            <Clock className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{walletData?.wallet.total_spent.toFixed(2) || '0.00'}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transcriptions</p>
              <p className="text-2xl font-bold text-gray-900">
                {transcriptions?.length || 0}
              </p>
            </div>
            <FileText className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Transcriptions</h2>
        {transcriptions && transcriptions.length > 0 ? (
          <div className="space-y-3">
            {transcriptions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="font-medium">{t.audio_filename}</p>
                  <p className="text-sm text-gray-600">
                    {t.language} • {t.duration} min • ₹{t.cost}
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No transcriptions yet. Upload an audio file to get started!</p>
        )}
      </div>
    </div>
  );
}
