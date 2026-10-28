import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, LogIn, ArrowRight, X, Lock } from 'lucide-react';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'cart' | 'wishlist' | 'general';
  redirectPath?: string;
  onCancelNavigateTo?: string;
}

export const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({
  isOpen,
  onClose,
  type = 'cart',
  redirectPath,
  onCancelNavigateTo
}) => {
  const navigate = useNavigate();

  // Freeze background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resolvedRedirect = redirectPath || (type === 'wishlist' ? '/wishlist' : '/cart');

  const handleLogin = () => {
    onClose();
    navigate(`/login?redirect=${encodeURIComponent(resolvedRedirect)}`);
  };

  const handleClose = () => {
    onClose();
    if (onCancelNavigateTo) {
      navigate(onCancelNavigateTo);
    }
  };

  const isCart = type === 'cart';
  const isWishlist = type === 'wishlist';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={handleClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200 cursor-pointer"
      />

      {/* Modal Dialog Card */}
      <div 
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-slate-100 z-10 animate-in zoom-in-95 fade-in duration-200"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Icon Badge */}
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-purple-100 via-indigo-50 to-purple-50 border-2 border-purple-200/80 flex items-center justify-center shadow-inner mb-5 relative group">
          {isWishlist ? (
            <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500 fill-rose-100" />
          ) : isCart ? (
            <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-[#7a00ea]" />
          ) : (
            <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-[#7a00ea]" />
          )}
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#7a00ea] text-white flex items-center justify-center shadow-md">
            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
          </span>
        </div>

        {/* Capsule Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#7a00ea] text-xs font-bold border border-purple-200/70 mb-3">
          <LogIn className="w-3.5 h-3.5" />
          <span>সাইন-ইন প্রয়োজন (Sign In Required)</span>
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
          {isWishlist 
            ? 'উইশলিস্ট দেখতে আগে লগইন করুন' 
            : isCart 
            ? 'কার্ট দেখতে আগে লগইন করুন' 
            : 'অনুগ্রহ করে প্রথমে লগইন করুন'}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed max-w-xs mx-auto">
          {isWishlist
            ? 'আপনার পছন্দের সেভ করা ডিজাইন ফাইল ও সফটওয়্যার তালিকা দেখতে অনুগ্রহ করে আপনার একাউন্টে লগইন করুন।'
            : isCart
            ? 'আপনার সিলেক্ট করা ডিজিটাল ফাইল দেখতে এবং অর্ডার সম্পন্ন করতে প্রথমে ওয়েবসাইটে লগইন করতে হবে।'
            : 'এই পেজের সুবিধা পেতে প্রথমে আপনার একাউন্টে লগইন করুন।'}
        </p>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={handleLogin}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#7a00ea] hover:bg-[#6c00d4] text-white font-extrabold text-sm shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>লগইন করুন (Log In Now)</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            পরে করব (Cancel)
          </button>
        </div>
      </div>
    </div>
  );
};
