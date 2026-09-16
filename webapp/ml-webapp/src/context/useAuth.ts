import { useContext } from 'react';
import { AuthContext } from './authContextInstance.ts';
import type { AuthContextType } from '../types/auth.ts';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
