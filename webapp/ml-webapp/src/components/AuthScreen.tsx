import { useState, type FormEvent } from 'react';
import {
  Code,
  Eye,
  EyeOff,
  HardHat,
  Info,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/useAuth.ts';

export function AuthScreen() {
  const { login, isLoading, error, clearError } = useAuth();

  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('password123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    await login({ username, password });
  };

  const handleQuickFill = (userType: 'admin' | 'inspector') => {
    clearError();
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('admin_pass2026');
    } else {
      setUsername('safety_officer');
      setPassword('ppe_inspector_secure');
    }
  };

  return (
    <div className="auth-page-container">
      {/* Ambient background glow */}
      <div className="auth-glow-top" />
      <div className="auth-glow-bottom" />

      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="brand-badge-container">
            <div className="brand-badge">
              <HardHat size={28} className="brand-badge-icon" />
              <ShieldCheck size={18} className="brand-badge-subicon" />
            </div>
          </div>
          <h1 className="auth-title">PPE Vision System</h1>
          <p className="auth-subtitle">
            Real-time Personal Protective Equipment compliance & safety monitoring
          </p>
        </div>

        {/* Developer Integration Note */}
        <div className="api-notice-box">
          <div className="notice-header">
            <Code size={16} />
            <strong>Custom API Connection</strong>
          </div>
          <p>
            API connection point is isolated in <code>src/services/authService.ts</code>. You can plug
            in your Spring Boot authentication microservice anytime.
          </p>
          <div className="quick-fill-row">
            <span className="quick-fill-label">Quick Test:</span>
            <button
              type="button"
              className="chip-btn"
              onClick={() => handleQuickFill('admin')}
            >
              Fill Admin
            </button>
            <button
              type="button"
              className="chip-btn"
              onClick={() => handleQuickFill('inspector')}
            >
              Fill Inspector
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="auth-error-banner">
            <Info size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username-input" className="form-label">
              Username or Email
            </label>
            <div className="input-with-icon">
              <UserIcon size={18} className="input-icon" />
              <input
                id="username-input"
                type="text"
                className="form-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) clearError();
                }}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-with-aside">
              <label htmlFor="password-input" className="form-label">
                Password
              </label>
            </div>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                className="form-input has-action"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-options-row">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkbox-label">Keep me logged in</span>
            </label>
            <span className="auth-help-hint">
              <KeyRound size={13} /> Secure Session
            </span>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-lg full-width ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="spin-animation" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In to Dashboard</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="security-notice">
            Authorized safety personnel access only. All sessions and inference feeds are logged.
          </p>
        </div>
      </div>
    </div>
  );
}
