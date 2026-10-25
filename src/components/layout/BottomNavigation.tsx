import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

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

// 4. Cart Icon (Outline vs Solid Cart)
const CartIcon: React.FC<{ active?: boolean; className?: string }> = ({ active, className }) => {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12z" />
        <circle cx="8" cy="20.5" r="2" fill="currentColor" />
        <circle cx="19" cy="20.5" r="2" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="8" cy="21" r="1.5" />
      <circle cx="19" cy="21" r="1.5" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
};

// 5. Account Icon (Outline vs Solid User)
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
  const { cart } = useCart();
  const { user } = useAuth();

  const pathname = location.pathname;

  // Active status checks based on current route
  const isHomeActive = pathname === '/';
  const isShopActive = pathname.startsWith('/shop') || pathname.startsWith('/category') || pathname.startsWith('/product');
  const isCartActive = pathname.startsWith('/cart') || pathname.startsWith('/checkout');
  const isAccountActive = pathname.startsWith('/account') || pathname === '/login';

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] rounded-t-3xl pb-[max(0.4rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-4 items-center max-w-md mx-auto px-2 h-16">
        
        {/* 1. Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center pb-1 transition-all select-none active:scale-95 cursor-pointer ${
            isHomeActive ? 'text-[#7a00ea]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative flex items-center justify-center w-6 h-6">
            <HomeIcon active={isHomeActive} className="w-5 h-5 transition-transform" />
          </div>
          <span className={`text-[11px] mt-1 leading-tight transition-colors ${
            isHomeActive ? 'font-bold text-[#7a00ea]' : 'font-medium text-slate-500'
          }`}>
            Home
          </span>
        </Link>

        {/* 2. Shop */}
        <Link
          to="/shop"
          className={`flex flex-col items-center justify-center pb-1 transition-all select-none active:scale-95 cursor-pointer ${
            isShopActive ? 'text-[#7a00ea]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative flex items-center justify-center w-6 h-6">
            <ShopIcon active={isShopActive} className="w-5 h-5 transition-transform" />
          </div>
          <span className={`text-[11px] mt-1 leading-tight transition-colors ${
            isShopActive ? 'font-bold text-[#7a00ea]' : 'font-medium text-slate-500'
          }`}>
            Shop
          </span>
        </Link>

        {/* 3. Cart */}
        <Link
          to="/cart"
          className={`flex flex-col items-center justify-center pb-1 transition-all select-none active:scale-95 cursor-pointer relative ${
            isCartActive ? 'text-[#7a00ea]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative flex items-center justify-center w-6 h-6">
            <CartIcon active={isCartActive} className="w-5 h-5 transition-transform" />

            {/* Cart Badge */}
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-[#7a00ea] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white pointer-events-none shadow-xs">
                {cart.length > 99 ? '99+' : cart.length}
              </span>
            )}
          </div>
          <span className={`text-[11px] mt-1 leading-tight transition-colors ${
            isCartActive ? 'font-bold text-[#7a00ea]' : 'font-medium text-slate-500'
          }`}>
            Cart
          </span>
        </Link>

        {/* 4. Account */}
        <Link
          to={user ? "/account" : "/login"}
          className={`flex flex-col items-center justify-center pb-1 transition-all select-none active:scale-95 cursor-pointer ${
            isAccountActive ? 'text-[#7a00ea]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative flex items-center justify-center w-6 h-6">
            <AccountIcon active={isAccountActive} className="w-5 h-5 transition-transform" />
          </div>
          <span className={`text-[11px] mt-1 leading-tight transition-colors ${
            isAccountActive ? 'font-bold text-[#7a00ea]' : 'font-medium text-slate-500'
          }`}>
            Account
          </span>
        </Link>

      </div>
    </nav>
  );
};
