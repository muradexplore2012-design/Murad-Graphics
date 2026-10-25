import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <img
          src="/logo.png"
          alt="Vyrqonix"
          className="w-16 h-16 mx-auto object-contain rounded-2xl shadow-sm"
        />
        <div className="space-y-2">
          <span className="text-5xl font-black text-blue-600">404</span>
          <h1 className="text-2xl font-extrabold text-slate-900">Page Not Found</h1>
          <p className="text-xs text-slate-500">
            The design resource, page, or category you requested could not be located.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <Link
            to="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
