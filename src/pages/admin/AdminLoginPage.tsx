import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, isAdmin, login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Auth state update will propagate; navigate to admin
      navigate('/admin');
    } catch (err: any) {
      console.error("Admin login failed:", err);
      setError('Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16 text-slate-800 antialiased">
      <div className="w-full max-w-md bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl shadow-xl space-y-8">
        
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
            <label className="font-semibold text-slate-700 block mb-1">Password</label>
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
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs flex items-center justify-center gap-2 disabled:opacity-50"
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
