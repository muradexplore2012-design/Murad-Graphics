import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  ShoppingBag, 
  Download, 
  MessageSquare, 
  Tag, 
  Image as ImageIcon, 
  Globe, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 text-xs font-medium">
        Verifying administrator authorization...
      </div>
    );
  }

  // Security check: if not authenticated or not admin UID/email, redirect directly to /admin/login
  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Orders & Sales', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'Download Audit', path: '/admin/downloads', icon: Download },
    { label: 'Coupons', path: '/admin/coupons', icon: Tag },
    { label: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
    { label: 'Homepage Banners', path: '/admin/banners', icon: ImageIcon },
    { label: 'Footer & Social', path: '/admin/footer', icon: Globe },
    { label: 'Site Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col lg:flex-row antialiased">
      
      {/* Mobile Admin Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-700 hover:text-slate-900 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Open Admin Menu"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="Admin" 
              className="h-8 w-auto object-contain drop-shadow-[0_1px_4px_rgba(59,130,246,0.18)]" 
            />
            <span className="font-black text-sm text-slate-900 tracking-wider">VYRQONIX ADMIN</span>
          </div>
        </div>
        <Link
          to="/"
          target="_blank"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-100 transition-colors"
        >
          <span>Store</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity cursor-pointer"
        />
      )}

      {/* Sidebar for Desktop & Mobile drawer - Light Theme & Pinned */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:z-30 shrink-0 shadow-2xl lg:shadow-xs ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 space-y-5 flex-1 overflow-y-auto">
          {/* Logo & Console Badge + Close Button on Mobile */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
            <Link to="/admin" className="flex items-center gap-2.5 sm:gap-3 group">
              <img 
                src="/logo.png" 
                alt="Vyrqonix Admin Logo" 
                className="h-8 sm:h-9 w-auto object-contain shrink-0 drop-shadow-[0_1px_4px_rgba(59,130,246,0.14)] transition-transform group-hover:scale-105" 
              />
              <div>
                <span className="font-black text-sm text-slate-900 block tracking-tight leading-tight">
                  VYR<span className="text-blue-600">QONIX</span>
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  ADMIN CONSOLE
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close Admin Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer - Light Theme */}
        <div className="p-4 border-t border-slate-100 space-y-2 shrink-0 bg-white">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Customer Storefront</span>
            </span>
          </Link>

          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Body - Light Theme Background */}
      <main className="flex-1 p-3.5 sm:p-6 lg:p-7 xl:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden bg-slate-50">
        <Outlet />
      </main>

    </div>
  );
};
