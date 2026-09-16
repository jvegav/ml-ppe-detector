import { createContext } from 'react';
import type { AuthContextType } from '../types/auth.ts';

export const AuthContext = createContext<AuthContextType | null>(null);
