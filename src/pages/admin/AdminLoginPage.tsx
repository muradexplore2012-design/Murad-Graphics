import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { checkIsAdminEmail } from '../../services/api';
import { auth, GOOGLE_CLIENT_ID } from '../../lib/firebase';
import { Lock, Mail, AlertCircle, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('muradexplore2012@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const googleAdminButtonRef = useRef<HTMLDivElement>(null);

  const { user, isAdmin, login, loginWithGoogleCredential, logout, resetPassword } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  // Google Identity Services (GIS) for bulletproof cross-browser Admin Sign-In
  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      if (!response.credential) return;
      setError('');
      setResetSent(false);
      setGoogleLoading(true);

      try {
        const userCred = await loginWithGoogleCredential(response.credential);
        const loggedEmail = userCred.user?.email?.toLowerCase();
        if (loggedEmail) {
          const isAllowedAdmin = await checkIsAdminEmail(loggedEmail);
          if (!isAllowedAdmin) {
            await logout();
            setError(`Access Denied: Google account (${loggedEmail}) is not registered in the Administrator List.`);
            return;
          }
        }
        navigate('/admin', { replace: true });
      } catch (err: any) {
        console.error("GIS Admin Sign-In error:", err);
        setError(err.message || 'Google authentication failed.');
      } finally {
        setGoogleLoading(false);
      }
    };

    const initGIS = () => {
      if (window.google?.accounts?.id && googleAdminButtonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          googleAdminButtonRef.current.innerHTML = '';
          const containerWidth = googleAdminButtonRef.current.parentElement?.offsetWidth || googleAdminButtonRef.current.offsetWidth || 340;
          const targetWidth = Math.min(Math.max(Math.floor(containerWidth), 220), 400);

          window.google.accounts.id.renderButton(googleAdminButtonRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'center',
            locale: 'en',
            width: targetWidth,
          });
        } catch (e) {
          console.error("Admin GIS render error:", e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGIS();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          initGIS();
        }
      }, 80);
      return () => clearInterval(timer);
    }
  }, [loginWithGoogleCredential, logout, navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSent(false);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      // 🔒 Pre-validate that email is an appointed administrator
      const isAllowedAdmin = await checkIsAdminEmail(cleanEmail);
      if (!isAllowedAdmin) {
        setError('Access Denied: This email is not authorized as an administrator. / এই ইমেইলটি অ্যাডমিনিস্ট্রেটর হিসেবে অনুমোদিত নয়।');
        setLoading(false);
        return;
      }

      await login(cleanEmail, password);
      navigate('/admin');
    } catch (err: any) {
      console.error("Admin login failed:", err);
      setError('Invalid administrator credentials. If you forgot your password, click "Forgot password?" above.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your administrator email first.');
      return;
    }
    setError('');
    setResetSent(false);
    setResetLoading(true);

    try {
      // 🔒 SECURITY CHECK: Only authorized administrator emails can reset admin password
      const isAllowedAdmin = await checkIsAdminEmail(cleanEmail);
      if (!isAllowedAdmin) {
        setError('Access Denied: This email is not registered as an administrator. / এই ইমেইলটি অ্যাডমিনিস্ট্রেটর হিসেবে অনুমোদিত নয়।');
        return;
      }

      await resetPassword(cleanEmail);
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
            alt="Vyrqonix Admin"
            className="w-16 h-16 mx-auto object-contain"
          />
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Admin Portal Authentication
          </h1>
          <p className="text-xs text-slate-500">
            Protected management workspace for Vyrqonix
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

        {/* Quick Google Sign In for Admin via GIS (Cross-Browser Bulletproof) */}
        <div className="relative w-full min-h-[44px] flex items-center justify-center overflow-hidden rounded-xl">
          {/* GIS Render Anchor (Permanent, no layout shifts) */}
          <div 
            ref={googleAdminButtonRef} 
            className={`w-full flex items-center justify-center min-h-[44px] transition-opacity duration-200 ${
              googleLoading ? 'opacity-30 pointer-events-none' : 'opacity-100'
            }`}
          />

          {/* Clean Centered Loading Overlay */}
          {googleLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl z-10 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Verifying admin authentication...</span>
              </div>
            </div>
          )}
        </div>

        <div className="relative flex items-center justify-center my-1">
          <div className="flex-1 border-t border-slate-200" />
          <span className="shrink-0 px-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider whitespace-nowrap bg-white">
            Or login with email
          </span>
          <div className="flex-1 border-t border-slate-200" />
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
