import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, LogIn } from 'lucide-react';

export const AccessDeniedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16 text-center text-slate-800 antialiased">
      <div className="max-w-md bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Access Denied</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            You do not possess administrative permissions to access the Murad Graphics management portal.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Website</span>
          </Link>
          <Link
            to="/admin/login"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-200"
          >
            <LogIn className="w-4 h-4" />
            <span>Admin Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
