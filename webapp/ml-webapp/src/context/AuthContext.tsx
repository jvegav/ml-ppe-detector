import { useState, type ReactNode } from 'react';
import type { AuthContextType, LoginCredentials, User } from '../types/auth.ts';
import { authService } from '../services/authService.ts';
import { AuthContext } from './authContextInstance.ts';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize state directly from stored session (no effect needed)
  const [session, setSession] = useState<{ user: User | null; token: string | null }>(() =>
    authService.getStoredSession()
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      if (response.success && response.user && response.token) {
        setSession({ user: response.user, token: response.token });
        setIsLoading(false);
        return true;
      } else {
        setError(response.message || 'Login failed. Please check your credentials.');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    setSession({ user: null, token: null });
    setError(null);
  };

  const clearError = () => setError(null);

  const contextValue: AuthContextType = {
    user: session.user,
    token: session.token,
    isAuthenticated: !!session.user && !!session.token,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
