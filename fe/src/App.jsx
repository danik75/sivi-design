import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import LoginModal from './components/LoginModal';
import MainPanel from './pages/MainPanel';

const queryClient = new QueryClient();

function getInitialAuth() {
  return !!localStorage.getItem('sivi_token');
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuth);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-root">
        {/* main panel is hidden/inert until authenticated */}
        <main aria-hidden={!isAuthenticated}>
          {isAuthenticated ? <MainPanel /> : <div className="min-h-screen" />}
        </main>

        {/* Login modal overlays the entire app when not authenticated */}
        <LoginModal isOpen={!isAuthenticated} onLoginSuccess={handleLoginSuccess} />
      </div>
    </QueryClientProvider>
  );
}
