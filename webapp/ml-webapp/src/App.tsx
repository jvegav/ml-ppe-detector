import { AuthProvider } from './context/AuthContext.tsx';
import { useAuth } from './context/useAuth.ts';
import { AuthScreen } from './components/AuthScreen.tsx';
import { DashboardScreen } from './components/DashboardScreen.tsx';
import { Loader2 } from 'lucide-react';
import './App.css';

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="app-loading-screen">
        <Loader2 size={36} className="spin-animation text-accent" />
        <p>Loading PPE Vision System...</p>
      </div>
    );
  }

  return isAuthenticated ? <DashboardScreen /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
