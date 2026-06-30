import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import LoginModal from './components/LoginModal';
import MainPanel from './pages/MainPanel';

const queryClient = new QueryClient();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('sivi_token');
    if (token) setIsAuthenticated(true);
    else setShowLogin(true);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLogin(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-root">
        {/* main panel is hidden/inert until authenticated */}
        <main aria-hidden={!isAuthenticated}>
          {isAuthenticated ? <MainPanel /> : <div className="min-h-screen" />}
        </main>

        {/* Login modal overlays the entire app when not authenticated */}
        <LoginModal isOpen={!isAuthenticated && showLogin} onClose={() => setShowLogin(false)} />

        {/* Provide LoginPage for direct route if needed (kept for compatibility) */}
        {!isAuthenticated && !showLogin && <LoginPage onSuccess={handleLoginSuccess} />}
      </div>
    </QueryClientProvider>
  );
}
