import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('muradexplore2012@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const { user, isAdmin, login, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSent(false);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin');
    } catch (err: any) {
      console.error("Admin login failed:", err);
      setError('Invalid administrator credentials. If you forgot your password, click "Reset Password" below.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setError('');
    setResetSent(false);
    setLoading(true);

    try {
      await loginWithGoogle();
      navigate('/admin');
    } catch (err: any) {
      console.error("Google Admin login failed:", err);
      setError(err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your administrator email first.');
      return;
    }
    setError('');
    setResetLoading(true);
    try {
      await resetPassword(email.trim());
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16 text-slate-800 antialiased">
      <div className="w-full max-w-md bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <img
            src="/logo.png"
            alt="Murad Graphics Admin"
            className="w-16 h-16 mx-auto object-contain"
          />
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Admin Portal Authentication
          </h1>
          <p className="text-xs text-slate-500">
            Protected management workspace for Murad Graphics
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resetSent && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Password reset link sent to <strong>{email}</strong>! Please check your email inbox (and spam folder) to set a new password.
            </span>
          </div>
        )}

        {/* Quick Google Sign In for Admin */}
        <button
          type="button"
          onClick={handleGoogleAdminLogin}
          disabled={loading}
          className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-xl shadow-xs transition-all active:scale-95 text-xs flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google (Instant Login)</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            Or login with email
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Administrator Email</label>
            <div className="relative flex items-center">
              <input
                type="email"
                required
                placeholder="muradexplore2012@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 block">Password</label>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                {resetLoading ? 'Sending link...' : 'Forgot password?'}
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? "Authenticating..." : "Authorize Admin Access"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <a href="/" className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors">
            ← Return to Customer Website
          </a>
        </div>

      </div>
    </div>
  );
};
