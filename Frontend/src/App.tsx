import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import AudioTranscriptionPage from './pages/AudioTranscriptionPage';
import LoginModal from './components/LoginModal';

const queryClient = new QueryClient();

function AppContent() {
  const { isAuthenticated, user, fetchUser } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchUser().catch(() => {
        // Silent fail
      });
    }
  }, [isAuthenticated, user, fetchUser]);

  const handleLoginRequired = () => {
    setShowLoginModal(true);
  };

  return (
    <>
      <AudioTranscriptionPage
        isAuthenticated={isAuthenticated}
        user={user}
        onLoginRequired={handleLoginRequired}
      />

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
