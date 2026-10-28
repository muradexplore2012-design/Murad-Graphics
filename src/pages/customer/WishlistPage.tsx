import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { ProductCard } from '../../components/ui/ProductCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoginRequiredModal } from '../../components/ui/LoginRequiredModal';
import { Heart } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { wishlist, clearWishlist } = useWishlist();

  // Require user authentication to access wishlist
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-slate-50/50">
        <LoginRequiredModal
          isOpen={true}
          onClose={() => navigate(-1)}
          type="wishlist"
          onCancelNavigateTo="/shop"
        />
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 text-rose-500 flex items-center justify-center shadow-inner">
            <Heart className="w-8 h-8 fill-rose-200" />
          </div>
          <h2 className="text-xl font-black text-slate-900">উইশলিস্ট দেখতে আগে লগইন করুন</h2>
          <p className="text-xs text-slate-500">আপনার পছন্দের সেভ করা ডিজাইন ফাইল ও সফটওয়্যার তালিকা দেখতে অনুগ্রহ করে একাউন্টে লগইন করুন।</p>
          <button
            type="button"
            onClick={() => navigate('/login?redirect=/wishlist')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#7a00ea] text-white rounded-2xl text-xs font-bold shadow-md hover:bg-[#6c00d4] transition-all cursor-pointer"
          >
            লগইন করুন (Log In Now)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Wishlist</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Saved design assets for future projects</p>
        </div>
        {wishlist.length > 0 && (
          <button
            onClick={clearWishlist}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
          >
            Clear Wishlist
          </button>
        )}
      </div>

      {wishlist.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-8 h-8 text-rose-500" />}
          title="Your Wishlist is Empty"
          description="Click the heart icon on any product to save it to your wishlist."
          actionLabel="Explore Shop"
          actionHref="/shop"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-6">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
