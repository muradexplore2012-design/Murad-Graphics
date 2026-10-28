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
  Share2, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ExternalLink,
  Crown,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, isOwner, isManager, isViewer, loading, logout } = useAuth();
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
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
      
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
            <span className="font-black text-sm text-slate-900 tracking-wider">Vyrqonix Admin</span>
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

      {/* Sidebar for Desktop & Mobile drawer - Strictly Fixed & Pinned */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] h-screen h-[100dvh] bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-2xl lg:shadow-xs transition-transform duration-300 ease-in-out lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          height: '100vh',
          zIndex: 40
        }}
      >
        <div className="p-5 space-y-5 flex-1 overflow-y-auto overscroll-contain">
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
                  Vyr<span className="text-blue-600">qonix</span>
                </span>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md inline-block">
                    ADMIN
                  </span>
                  {isOwner ? (
                    <span className="text-[9px] font-bold text-[#7a00ea] bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5 fill-purple-100" />
                      OWNER
                    </span>
                  ) : isViewer ? (
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                      <Eye className="w-2.5 h-2.5" />
                      VIEWER
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      MANAGER
                    </span>
                  )}
                </div>
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

      {/* Main Admin Content Body - Light Theme Background with Left Offset for Fixed Sidebar */}
      <main className="lg:pl-72 w-full min-w-0 min-h-screen flex flex-col bg-slate-50">
        <div className="flex-1 p-3.5 sm:p-6 lg:p-7 xl:p-8 max-w-7xl mx-auto w-full min-w-0">
          {isViewer && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 shadow-xs">
              <Eye className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">ভিউয়ার মোড (Viewer / Read-Only Mode)</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  আপনি একজন ভিউয়ার হিসেবে অ্যাডমিন প্যানেলে লগইন আছেন। আপনি সকল রিপোর্ট, সেলস অর্ডার এবং প্রোডাক্টের তালিকা দেখতে পারবেন, তবে কোনো তথ্য যোগ, এডিট বা ডিলিট করার অনুমতি নেই।
                </p>
              </div>
            </div>
          )}
          <Outlet />
        </div>
      </main>

    </div>
  );
};
