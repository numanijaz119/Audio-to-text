import { Wallet, Clock } from 'lucide-react';

interface Props {
  balance: number;
  demoMinutes: number;
}

export default function WalletBalance({ balance, demoMinutes }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
      <div className="flex items-center justify-center space-x-8">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Wallet Balance</p>
            <p className="text-lg font-bold text-gray-900">₹{balance.toFixed(2)}</p>
          </div>
        </div>

        <div className="h-8 w-px bg-gray-200"></div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Free Minutes</p>
            <p className="text-lg font-bold text-gray-900">{demoMinutes.toFixed(1)} min</p>
          </div>
        </div>
      </div>
    </div>
  );
}
