import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import TranscribePage from './pages/TranscribePage';
import { AuthProvider, useAuth } from './hooks/useAuth';
import './styles/globals.css';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    // Small delay for smooth transition
    const timer = setTimeout(() => setShowApp(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-light">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-opacity duration-500 ${showApp ? 'opacity-100' : 'opacity-0'}`}>
      {isAuthenticated ? <TranscribePage /> : <LandingPage />}
    </div>
  );
}

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  
  // Initialize Facebook SDK with App ID
  useEffect(() => {
    const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (fbAppId && window.FB) {
      window.FB.init({
        appId: fbAppId,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
    }
  }, []);
  
  // If no client ID, show a setup message
  if (!clientId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Setup Required</h1>
          <p className="text-gray-600 mb-4">Please configure your Google OAuth Client ID</p>
          <ol className="text-left text-gray-600 space-y-2 mb-6">
            <li>1. Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google Cloud Console</a></li>
            <li>2. Create a new OAuth 2.0 Client ID</li>
            <li>3. Add <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:5173</code> to authorized origins</li>
            <li>4. Copy the Client ID to <code className="bg-gray-100 px-2 py-1 rounded">Frontend/.env</code></li>
            <li>5. Refresh this page</li>
          </ol>
          <p className="text-sm text-gray-500">Or set <code className="bg-gray-100 px-2 py-1 rounded">VITE_GOOGLE_CLIENT_ID</code> in your .env file</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <Toaster 
          position="top-center"
          toastOptions={{
            className: 'font-sans',
            style: {
              background: '#1e293b',
              color: '#fff',
              borderRadius: '12px',
              padding: '16px 24px',
            },
            success: {
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#fff',
              },
            },
          }}
        />
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
