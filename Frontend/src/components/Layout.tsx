import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Wallet, Upload, FileText, LogOut, Home } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link to="/" className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900">
                <Home className="w-5 h-5 mr-2" />
                Dashboard
              </Link>
              <Link to="/upload" className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900">
                <Upload className="w-5 h-5 mr-2" />
                Upload
              </Link>
              <Link to="/transcriptions" className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900">
                <FileText className="w-5 h-5 mr-2" />
                Transcriptions
              </Link>
              <Link to="/wallet" className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900">
                <Wallet className="w-5 h-5 mr-2" />
                Wallet
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button onClick={handleLogout} className="flex items-center text-gray-700 hover:text-gray-900">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
