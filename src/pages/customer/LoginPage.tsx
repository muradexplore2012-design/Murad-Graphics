import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GOOGLE_CLIENT_ID } from '../../lib/firebase';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Password reset state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [gisFailed, setGisFailed] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const { user, login, register, loginWithGoogle, loginWithGoogleCredential, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || (location.state as any)?.from?.pathname || '/account';

  // Detect In-App Browsers (WhatsApp, Facebook, Messenger, Instagram, etc.)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
      if (/FBAN|FBAV|Instagram|WhatsApp|Line|Twitter|Snapchat|BytedanceWebview/i.test(ua)) {
        setIsInAppBrowser(true);
      }
    }
  }, []);

  // Direct Google Sign-In via Firebase Auth (Popup with Mobile Redirect Fallback)
  const handleDirectGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      console.error("Direct Google Sign-In error:", err);
      let msg = err.message || 'Google sign-in failed.';
      if (err.code === 'auth/popup-blocked') {
        msg = 'Popups are blocked in this browser. Please allow popups or use email login.';
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        msg = 'An account already exists with the same email address.';
      }
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Automatically redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, redirectPath]);

  // Google Identity Services (GIS) integration with 100% resilient fallback
  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      if (!response.credential) return;
      setError('');
      setGoogleLoading(true);
      try {
        await loginWithGoogleCredential(response.credential);
        navigate(redirectPath, { replace: true });
      } catch (err: any) {
        console.error("GIS Sign-In error, attempting fallback popup:", err);
        try {
          await loginWithGoogle();
          navigate(redirectPath, { replace: true });
        } catch (fallbackErr: any) {
          let msg = fallbackErr?.message || err?.message || 'Google authentication failed.';
          if (
            fallbackErr?.code === 'auth/account-exists-with-different-credential' ||
            err?.code === 'auth/account-exists-with-different-credential'
          ) {
            msg = 'An account already exists with the same email address but different sign-in credentials.';
          }
          setError(msg);
        }
      } finally {
        setGoogleLoading(false);
      }
    };

    let timer: any;

    const initGIS = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Clear previous render to prevent duplicates on tab switch
          googleButtonRef.current.innerHTML = '';

          const containerWidth = googleButtonRef.current.parentElement?.offsetWidth || googleButtonRef.current.offsetWidth || 340;
          const targetWidth = Math.min(Math.max(Math.floor(containerWidth), 220), 400);

          // Render official GIS button with container width and forced English locale
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'center',
            locale: 'en',
            width: targetWidth,
          });
          setGisFailed(false);
        } catch (e) {
          console.error("GIS render error:", e);
          setGisFailed(true);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGIS();
    } else {
      let attempts = 0;
      timer = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          initGIS();
        } else if (attempts > 20) {
          clearInterval(timer);
          setGisFailed(true);
        }
      }, 80);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loginWithGoogle, loginWithGoogleCredential, navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        await register(email.trim(), password, name.trim());
      } else {
        await login(email.trim(), password);
      }
      navigate(redirectPath);
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || 'Authentication failed.';
      if (
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/invalid-credential'
      ) {
        msg = 'Invalid email or password. Please check your credentials.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please log in.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setResetError('');
    setResetLoading(true);
    try {
      await resetPassword(forgotEmail.trim());
      setResetSent(true);
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:py-16 bg-slate-50/60 antialiased">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 p-7 sm:p-10 shadow-[0_25px_60px_-15px_rgba(122,0,234,0.22),0_10px_30px_-10px_rgba(0,0,0,0.06)] space-y-6">
        
        {/* Brand Logo */}
        <div className="flex justify-center -mb-2">
          <Link to="/" className="inline-block transition-transform hover:scale-105" title="Vyrqonix">
            <img
              src="/logo.png"
              alt="Vyrqonix"
              className="h-16 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Header Tabs: Login & Register */}
        <div className="space-y-3 text-center">
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError('');
              }}
              className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                !isRegister
                  ? 'bg-[#7a00ea] text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError('');
              }}
              className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                isRegister
                  ? 'bg-[#7a00ea] text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              Register
            </button>
          </div>

          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {isRegister
              ? "Sign up for an account to download digital assets, track orders, and manage purchases."
              : "Sign in to your account to continue shopping, track orders, and manage your profile."}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Full Name for Registration */}
          {isRegister && (
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                Full Name <span className="text-[#7a00ea]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7a00ea] focus:border-transparent transition-all"
              />
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="font-bold text-slate-800 block mb-1.5">
              Email Address <span className="text-[#7a00ea]">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="Enter Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7a00ea] focus:border-transparent transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="font-bold text-slate-800 block mb-1.5">
              Password <span className="text-[#7a00ea]">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-11 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7a00ea] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                tabIndex={-1}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Remember Me & Forgot Password (Shown in Login mode) */}
            {!isRegister && (
              <div className="flex items-center justify-between mt-1.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#7a00ea] focus:ring-[#7a00ea]"
                  />
                  <span className="text-slate-600 font-medium text-xs">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setResetSent(false);
                    setResetError('');
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] text-[#7a00ea] hover:underline font-medium transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          {/* Primary Action Button: LOG IN or REGISTER */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#7a00ea] hover:bg-[#6800c7] text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 transition-all active:scale-[0.98] text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
          >
            <span>
              {loading
                ? "Processing..."
                : isRegister
                ? "REGISTER"
                : "LOG IN"}
            </span>
          </button>
        </form>

        {/* Separator & Google Sign-In via Google Identity Services (GIS) & Direct Mobile Fallback */}
        <div className="space-y-3 pt-1">
          <div className="relative flex items-center justify-center my-1">
            <div className="w-full border-t border-slate-200" />
            <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 absolute">
              OR
            </span>
          </div>

          {/* In-App Browser Warning Alert */}
          {isInAppBrowser && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-[11px] leading-relaxed">
              <span className="font-bold">⚠️ খেয়াল করুন:</span> আপনি WhatsApp বা Facebook এর ইন-অ্যাপ ব্রাউজারে আছেন। গুগল লগইনে সমস্যা হলে ওপরের ডানপাশে ৩-ডট (⋮) এ ট্যাপ করে <strong>"Open in Chrome / Browser"</strong> সিলেক্ট করুন অথবা সরাসরি ওপরের ফর্ম দিয়ে ইমেইলে লগইন করুন।
            </div>
          )}

          {/* Single, 100% Reliable Google Sign-In Button */}
          <div className="relative w-full min-h-[44px] flex items-center justify-center overflow-hidden rounded-xl">
            {/* GIS Render Anchor (Permanent, no layout shifts) */}
            <div 
              ref={googleButtonRef} 
              className={`w-full flex items-center justify-center min-h-[44px] transition-opacity duration-200 ${
                gisFailed ? 'hidden' : googleLoading ? 'opacity-30 pointer-events-none' : 'opacity-100'
              }`}
            />

            {/* Seamless Single Fallback Button (Only shown if Google GIS script failed to load or is blocked) */}
            {gisFailed && (
              <button
                type="button"
                onClick={handleDirectGoogleLogin}
                disabled={googleLoading}
                className="w-full h-11 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 shadow-xs text-xs flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            )}

            {/* Clean Centered Loading Overlay */}
            {googleLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/95 rounded-xl z-10 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <div className="w-4 h-4 border-2 border-[#7a00ea] border-t-transparent rounded-full animate-spin" />
                  <span>Signing in with Google...</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">Reset Your Password</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {resetSent ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Check your inbox</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    We sent a password reset link to <strong className="text-slate-700">{forgotEmail}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2.5 bg-[#7a00ea] text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                <p className="text-slate-500 text-xs">
                  Enter your account email address and we will send you a password recovery link.
                </p>

                {resetError && (
                  <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl text-[11px] font-semibold border border-rose-200">
                    {resetError}
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter Email Address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a00ea]"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-1/2 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-1/2 py-2.5 bg-[#7a00ea] hover:bg-[#6800c7] text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {resetLoading ? "Sending..." : "Send Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
