import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { LoginRequiredModal } from '../ui/LoginRequiredModal';

// 1. Menu Icon (Outline vs Solid Brand Fill)
const MenuIcon: React.FC<{ active?: boolean; className?: string }> = ({ active, className }) => {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <rect x="3" y="3" width="7" height="7" rx="1.8" />
        <rect x="14" y="3" width="7" height="7" rx="1.8" />
        <rect x="3" y="14" width="7" height="7" rx="1.8" />
        <rect x="14" y="14" width="7" height="7" rx="1.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="1.8" />
      <rect x="14" y="14" width="7" height="7" rx="1.8" />
    </svg>
  );
};

// 2. Shop Icon (Outline vs Solid Storefront)
const ShopIcon: React.FC<{ active?: boolean; className?: string }> = ({ active, className }) => {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M21.7 8.2 19.3 3.3A2 2 0 0 0 17.5 2H6.5a2 2 0 0 0-1.8 1.3L2.3 8.2A2 2 0 0 0 2 9.2V10a3 3 0 0 0 3 3 3 3 0 0 0 3-3V9h1v1a3 3 0 0 0 3 3 3 3 0 0 0 3-3V9h1v1a3 3 0 0 0 3 3 3 3 0 0 0 3-3V9.2a2 2 0 0 0-.3-1z" />
        <path d="M4 14.8V19a2 2 0 0 0 2 2h4v-5a2 2 0 0 1 4 0v5h4a2 2 0 0 0 2-2v-4.2a4.9 4.9 0 0 1-2 .2 5 5 0 0 1-3.5-1.4A5 5 0 0 1 12 15a5 5 0 0 1-3.5-1.4A5 5 0 0 1 6 15c-.7 0-1.4-.1-2-.2z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-2-.7 2.7 2.7 0 0 1-2 .7 2.7 2.7 0 0 1-2-.7 2.7 2.7 0 0 1-2 .7 2 2 0 0 1-2-2V7" />
    </svg>
  );
};

// 3. Home Icon (Outline vs Solid Silhouette)
const HomeIcon: React.FC<{ active?: boolean; className?: string }> = ({ active, className }) => {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M 12 3 L 3 10.5 H 4.5 V 19.5 C 4.5 20.3 5.2 21 6 21 H 9.5 V 15.5 C 9.5 14.1 10.6 13 12 13 C 13.4 13 14.5 14.1 14.5 15.5 V 21 H 18 C 18.8 21 19.5 20.3 19.5 19.5 V 10.5 H 21 Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
    </svg>
  );
};

// 4. Wishlist Icon (Outline vs Solid Heart)
const WishlistIcon: React.FC<{ active?: boolean; className?: string }> = ({ active, className }) => {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
};

// 5. Download Icon (Outline vs Solid Tray Download)
const DownloadIcon: React.FC<{ active?: boolean; className?: string }> = ({ active, className }) => {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v10.19l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 1 1 1.06-1.06l2.72 2.72V3a.75.75 0 0 1 .75-.75Zm-8.25 14a.75.75 0 0 1 .75.75v2.25c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75V17a.75.75 0 0 1 1.5 0v2.25A2.25 2.25 0 0 1 18.75 21.5H5.25A2.25 2.25 0 0 1 3 19.25V17a.75.75 0 0 1 .75-.75Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
};

// 6. Account Icon (Outline vs Solid User)
const AccountIcon: React.FC<{ active?: boolean; className?: string }> = ({ active, className }) => {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <circle cx="12" cy="7" r="4.5" />
        <path d="M12 13.5c-4.5 0-8 2.5-8 6.5 0 .5.5 1 1 1h14c.5 0 1-.5 1-1 0-4-3.5-6.5-8-6.5z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" className={className}>
      <circle cx="12" cy="7.5" r="4" />
      <path d="M5.5 20.5 C 5.5 16.5 8.5 14.5 12 14.5 C 15.5 14.5 18.5 16.5 18.5 20.5" />
    </svg>
  );
};

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { wishlist } = useWishlist();
  const { user } = useAuth();
  const [avatarError, setAvatarError] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalType, setAuthModalType] = useState<'wishlist' | 'downloads'>('wishlist');

  useEffect(() => {
    setAvatarError(false);
  }, [user?.photoURL]);

  const pathname = location.pathname;

  // Active status checks based on current route
  const isHomeActive = pathname === '/';
  const isShopActive = pathname.startsWith('/shop') || pathname.startsWith('/category') || pathname.startsWith('/product');
  const isWishlistActive = pathname.startsWith('/wishlist');
  const isDownloadsActive = pathname.startsWith('/account/downloads') || pathname === '/downloads';
  const isAccountActive = (pathname.startsWith('/account') && !isDownloadsActive) || pathname === '/login';

  // Active column index (0: Home, 1: Shop, 2: Wishlist, 3: Downloads, 4: Account)
  let activeIndex = -1;
  if (isHomeActive) activeIndex = 0;
  else if (isShopActive) activeIndex = 1;
  else if (isWishlistActive) activeIndex = 2;
  else if (isDownloadsActive) activeIndex = 3;
  else if (isAccountActive) activeIndex = 4;

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] rounded-t-3xl pb-[max(0.4rem,env(safe-area-inset-bottom))] overflow-hidden"
    >
      <div className="relative max-w-md mx-auto h-16">

        {/* Animated Spotlight Lamp & Soft Beam (Glides smoothly across tabs) */}
        <div 
          className="absolute inset-y-0 left-0 w-1/5 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.34,1.25,0.64,1)] z-0"
          style={{
            transform: activeIndex >= 0 ? `translateX(${activeIndex * 100}%)` : 'translateY(100%)',
            opacity: activeIndex >= 0 ? 1 : 0,
          }}
        >
          {/* Top Glowing Laser / Neon Lamp Indicator Bar */}
          <div className="relative mx-auto w-9 sm:w-10 h-[3px] rounded-b-full bg-gradient-to-r from-[#9d4edd] via-[#7a00ea] to-[#6c00d4] shadow-[0_0_12px_#7a00ea,0_0_4px_#7a00ea,0_2px_6px_rgba(122,0,234,0.4)]" />

          {/* Soft Feathered Downward Spotlight Cone / Beam */}
          <div className="absolute top-[2px] left-1/2 -translate-x-1/2 w-[72px] h-[46px] pointer-events-none">
            <svg
              viewBox="0 0 72 46"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="navSpotlightBeam" x1="36" y1="0" x2="36" y2="46" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#7a00ea" stopOpacity="0.25" />
                  <stop offset="35%" stopColor="#7a00ea" stopOpacity="0.12" />
                  <stop offset="70%" stopColor="#7a00ea" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#7a00ea" stopOpacity="0" />
                </linearGradient>
                <filter id="softRayBlur" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.5" />
                </filter>
              </defs>
              <polygon
                points="20,0 52,0 66,46 6,46"
                fill="url(#navSpotlightBeam)"
                filter="url(#softRayBlur)"
              />
            </svg>
          </div>

          {/* Soft Ambient Radial Aura right behind active icon */}
          <div 
            className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-10 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(122, 0, 234, 0.16) 0%, rgba(122, 0, 234, 0) 75%)',
            }}
          />
        </div>

        {/* 5 Navigation Buttons */}
        <div className="relative z-10 grid grid-cols-5 items-center h-full">
        
        {/* 1. Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center pb-1 transition-all select-none active:scale-95 cursor-pointer relative h-full group ${
            isHomeActive ? 'text-[#7a00ea]' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className={`relative flex items-center justify-center w-6 h-6 transition-transform duration-300 ${
            isHomeActive ? 'scale-110' : 'group-hover:scale-105'
          }`}>
            <HomeIcon active={isHomeActive} className="w-5 h-5 transition-colors" />
          </div>
          <span className={`text-[10px] sm:text-[11px] mt-1 leading-tight transition-colors ${
            isHomeActive ? 'font-bold text-[#7a00ea]' : 'font-medium text-slate-400 group-hover:text-slate-600'
          }`}>
            Home
          </span>
        </Link>

        {/* 2. Shop */}
        <Link
          to="/shop"
          className={`flex flex-col items-center justify-center pb-1 transition-all select-none active:scale-95 cursor-pointer relative h-full group ${
            isShopActive ? 'text-[#7a00ea]' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className={`relative flex items-center justify-center w-6 h-6 transition-transform duration-300 ${
            isShopActive ? 'scale-110' : 'group-hover:scale-105'
          }`}>
            <ShopIcon active={isShopActive} className="w-5 h-5 transition-colors" />
          </div>
          <span className={`text-[10px] sm:text-[11px] mt-1 leading-tight transition-colors ${
            isShopActive ? 'font-bold text-[#7a00ea]' : 'font-medium text-slate-400 group-hover:text-slate-600'
          }`}>
            Shop
          </span>
        </Link>

        {/* 3. Wishlist */}
        {user ? (
          <Link
            to="/wishlist"
            className={`flex flex-col items-center justify-center pb-1 transition-all select-none active:scale-95 cursor-pointer relative h-full group ${
              isWishlistActive ? 'text-[#7a00ea]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div className={`relative flex items-center justify-center w-6 h-6 transition-transform duration-300 ${
              isWishlistActive ? 'scale-110' : 'group-hover:scale-105'
            }`}>
              <WishlistIcon active={isWishlistActive} className="w-5 h-5 transition-colors" />

              {/* Wishlist Badge */}
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-[#7a00ea] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white pointer-events-none shadow-xs">
                  {wishlist.length > 99 ? '99+' : wishlist.length}
                </span>
              )}
            </div>
            <span className={`text-[10px] sm:text-[11px] mt-1 leading-tight transition-colors ${
              isWishlistActive ? 'font-bold text-[#7a00ea]' : 'font-medium text-slate-400 group-hover:text-slate-600'
            }`}>
              Wishlist
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              setAuthModalType('wishlist');
              setAuthModalOpen(true);
            }}
            className={`flex flex-col items-center justify-center pb-1 transition-all select-none active:scale-95 cursor-pointer relative w-full h-full group ${
              isWishlistActive ? 'text-[#7a00ea]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div className={`relative flex items-center justify-center w-6 h-6 transition-transform duration-300 ${
              isWishlistActive ? 'scale-110' : 'group-hover:scale-105'
            }`}>
              <WishlistIcon active={isWishlistActive} className="w-5 h-5 transition-colors" />

              {/* Wishlist Badge */}
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-[#7a00ea] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white pointer-events-none shadow-xs">
                  {wishlist.length > 99 ? '99+' : wishlist.length}
                </span>
              )}
            </div>
            <span className={`text-[10px] sm:text-[11px] mt-1 leading-tight transition-colors ${
              isWishlistActive ? 'font-bold text-[#7a00ea]' : 'font-medium text-slate-400 group-hover:text-slate-600'
            }`}>
              Wishlist
            </span>
          </button>
        )}

        {/* 4. Downloads Library */}
        {user ? (
          <Link
            to="/account/downloads"
            className={`flex flex-col items-center justify-center pb-1 transition-all select-none active:scale-95 cursor-pointer relative h-full group ${
              isDownloadsActive ? 'text-[#7a00ea]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div className={`relative flex items-center justify-center w-6 h-6 transition-transform duration-300 ${
              isDownloadsActive ? 'scale-110' : 'group-hover:scale-105'
            }`}>
              <DownloadIcon active={isDownloadsActive} className="w-5 h-5 transition-colors" />
            </div>
            <span className={`text-[10px] sm:text-[11px] mt-1 leading-tight transition-colors truncate max-w-full text-center ${
              isDownloadsActive ? 'font-bold text-[#7a00ea]' : 'font-medium text-slate-400 group-hover:text-slate-600'
            }`}>
              Downloads
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              setAuthModalType('downloads');
              setAuthModalOpen(true);
            }}
            className={`flex flex-col items-center justify-center pb-1 transition-all select-none active:scale-95 cursor-pointer relative w-full h-full group ${
              isDownloadsActive ? 'text-[#7a00ea]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div className={`relative flex items-center justify-center w-6 h-6 transition-transform duration-300 ${
              isDownloadsActive ? 'scale-110' : 'group-hover:scale-105'
            }`}>
              <DownloadIcon active={isDownloadsActive} className="w-5 h-5 transition-colors" />
            </div>
            <span className={`text-[10px] sm:text-[11px] mt-1 leading-tight transition-colors truncate max-w-full text-center ${
              isDownloadsActive ? 'font-bold text-[#7a00ea]' : 'font-medium text-slate-400 group-hover:text-slate-600'
            }`}>
              Downloads
            </span>
          </button>
        )}

        {/* 5. Account */}
        <Link
          to={user ? "/account" : "/login"}
          className={`flex flex-col items-center justify-center pb-1 transition-all select-none active:scale-95 cursor-pointer relative h-full group ${
            isAccountActive ? 'text-[#7a00ea]' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className={`relative flex items-center justify-center w-6 h-6 transition-transform duration-300 ${
            isAccountActive ? 'scale-110' : 'group-hover:scale-105'
          }`}>
            {user?.photoURL && !avatarError ? (
              <img
                key={user.photoURL}
                src={user.photoURL}
                alt={user.displayName || "Account"}
                onError={() => setAvatarError(true)}
                referrerPolicy="no-referrer"
                className={`w-6 h-6 rounded-full object-cover transition-all ${
                  isAccountActive
                    ? 'ring-2 ring-[#7a00ea] ring-offset-1'
                    : 'border border-slate-300'
                }`}
              />
            ) : (
              <AccountIcon active={isAccountActive} className="w-5 h-5 transition-colors" />
            )}
          </div>
          <span className={`text-[10px] sm:text-[11px] mt-1 leading-tight transition-colors ${
            isAccountActive ? 'font-bold text-[#7a00ea]' : 'font-medium text-slate-400 group-hover:text-slate-600'
          }`}>
            Account
          </span>
        </Link>

        </div>
      </div>

      <LoginRequiredModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        type={authModalType}
        redirectPath={authModalType === 'wishlist' ? '/wishlist' : '/account/downloads'}
      />
    </nav>
  );
};
