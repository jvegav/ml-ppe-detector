import type { AuthResponse, LoginCredentials, User } from '../types/auth.ts';

/**
 * Authentication Service
 * 
 * NOTE FOR DEVELOPER:
 * Connect your real backend authentication API (e.g. Spring Boot ms-auth)
 * by updating the `loginWithApi` function below.
 */

const STORAGE_KEY_USER = 'ppe_auth_user';
const STORAGE_KEY_TOKEN = 'ppe_auth_token';

// Base URL for your Spring Boot authentication microservice
export const AUTH_API_BASE_URL = 'http://localhost:8080/api/auth';

/**
 * Real API integration placeholder.
 * Customize this to match your Spring Boot authentication endpoints and payload schema.
 */
export async function loginWithApi(credentials: LoginCredentials): Promise<AuthResponse> {
  /*
  // TODO: Uncomment and adapt to your Spring Boot endpoint when ready:
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `Authentication failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      user: {
        id: data.id || data.userId || '1',
        username: data.username || credentials.username,
        email: data.email,
        role: data.role || 'Operator',
      },
      token: data.token || data.jwt || 'mock-jwt-token',
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unable to connect to authentication server',
    };
  }
  */

  // --- MOCK / DEMO IMPLEMENTATION (Active by default for local testing) ---
  // Simulate small network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!credentials.username.trim() || !credentials.password.trim()) {
    return {
      success: false,
      message: 'Username and password are required',
    };
  }

  // Allow any login or specific test credentials
  const demoUser: User = {
    id: 'user-' + Date.now(),
    username: credentials.username,
    email: `${credentials.username.toLowerCase()}@safety.corp`,
    role: credentials.username.toLowerCase() === 'admin' ? 'Administrator' : 'Safety Inspector',
  };

  const demoToken = 'mock-jwt-token-' + Math.random().toString(36).substring(2);

  return {
    success: true,
    user: demoUser,
    token: demoToken,
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const result = await loginWithApi(credentials);
    if (result.success && result.user && result.token) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(result.user));
      localStorage.setItem(STORAGE_KEY_TOKEN, result.token);
    }
    return result;
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  },

  getStoredSession(): { user: User | null; token: string | null } {
    try {
      const rawUser = localStorage.getItem(STORAGE_KEY_USER);
      const token = localStorage.getItem(STORAGE_KEY_TOKEN);
      const user = rawUser ? (JSON.parse(rawUser) as User) : null;
      return { user, token };
    } catch {
      return { user: null, token: null };
    }
  },
};
