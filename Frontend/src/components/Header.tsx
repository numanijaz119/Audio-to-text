import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Wallet, LogOut, User as UserIcon } from 'lucide-react';
import WalletModal from './WalletModal';
import type { User } from '../types';

interface Props {
  user: User | null;
}

export default function Header({ user }: Props) {
  const { logout } = useAuthStore();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AudioText</h1>
                <p className="text-xs text-gray-500">AI Transcription</p>
              </div>
            </div>

            {user && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Wallet className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Wallet</span>
                </button>

                <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg">
                  <UserIcon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showWalletModal && (
        <WalletModal onClose={() => setShowWalletModal(false)} />
      )}
    </>
  );
}
