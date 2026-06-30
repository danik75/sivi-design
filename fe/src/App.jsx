import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import LoginModal from './components/LoginModal';
import { ToastContainer } from './components/chadcn/Toast';
import { ToastProvider } from './components/chadcn/useToast';
import MainPanel from './pages/MainPanel';

const queryClient = new QueryClient();

function getInitialAuth() {
  return !!localStorage.getItem('sivi_token');
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuth);

  const handleLoginSuccess = () => setIsAuthenticated(true);
  const handleLogout = () => setIsAuthenticated(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <div className="app-root">
          {isAuthenticated ? (
            <MainPanel onLogout={handleLogout} />
          ) : (
            <div className="min-h-screen" aria-hidden="true" />
          )}

          {!isAuthenticated ? <LoginModal onLoginSuccess={handleLoginSuccess} /> : null}
        </div>
        <ToastContainer />
      </ToastProvider>
    </QueryClientProvider>
  );
}
