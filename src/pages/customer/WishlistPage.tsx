import React from 'react';
import { useWishlist } from '../../contexts/WishlistContext';
import { ProductCard } from '../../components/ui/ProductCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Heart } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { wishlist, clearWishlist } = useWishlist();

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
