import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Download, Gift } from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { LoginRequiredModal } from './LoginRequiredModal';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isFavorited = isInWishlist(product.id);
  const inCart = isInCart(product.id);
  const productLink = `/product/${product.slug || product.id}`;

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.isFree) {
      navigate(productLink);
      return;
    }
    if (!inCart) {
      addToCart(product);
    }
    navigate('/checkout');
  };

  return (
    <div className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 hover:border-purple-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
      
      {/* 1. Thumbnail Container (Square 1:1, Full-Bleed Top with Optional Inset Badges) */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-900">
        <Link to={productLink} className="block w-full h-full">
          <img
            src={product.thumbnail || '/logo.png'}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Free Badge (Only shown if toggled ON in Admin Panel) */}
        {product.isFree && Boolean(product.showFreeBadge) ? (
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 pointer-events-none z-10">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-[#00c853] text-white shadow-sm uppercase tracking-wide leading-none">
              <Gift className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
              <span>FREE</span>
            </span>
          </div>
        ) : !product.isFree ? (
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 pointer-events-none z-10">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-[#ef4444] text-white shadow-sm tracking-tight leading-none">
              <ShoppingCart className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
              <span>৳{product.price}</span>
            </span>
          </div>
        ) : null}
      </div>

      {/* 2. Content Body (Title, Price & Action + Wishlist Row) */}
      <div className="p-3.5 sm:p-4.5 flex flex-col items-center text-center flex-1 justify-between gap-2 sm:gap-2.5">
        
        {/* Product Title (Centered, 2 Lines Max) */}
        <div className="w-full text-center px-0.5 min-h-[40px] sm:min-h-[46px] flex items-center justify-center">
          <Link to={productLink} className="block w-full">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base md:text-[17px] leading-snug line-clamp-2 hover:text-[#7c3aed] transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Paid Product Price (Free products have no redundant text as requested) */}
        {!product.isFree ? (
          <div className="w-full flex items-baseline justify-center gap-1.5 sm:gap-2 my-1 min-h-[28px] sm:min-h-[32px]">
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-[#7c3aed] tracking-tight">
              ৳{product.price}
            </span>
            {product.comparePrice && product.comparePrice > product.price ? (
              <span className="text-xs sm:text-sm md:text-base font-bold text-slate-400 line-through">
                ৳{product.comparePrice}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Action Button & Wishlist: Side-by-side at bottom */}
        <div className="w-full pt-1.5 mt-auto flex items-center gap-2">
          {/* Main Action Button (Get Free / Buy Now) */}
          <button
            type="button"
            onClick={handleBuyNow}
            className="flex-1 min-w-0 py-2.5 sm:py-3 px-3 sm:px-4 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs sm:text-sm md:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
          >
            {product.isFree ? (
              <>
                <Download className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] shrink-0" />
                <span className="truncate">Get Free</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] shrink-0" />
                <span className="truncate">Buy Now</span>
              </>
            )}
          </button>

          {/* Wishlist Heart Button next to Get Free / Buy Now */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!user) {
                setShowAuthModal(true);
                return;
              }
              toggleWishlist(product);
            }}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-purple-200 bg-white hover:bg-purple-50 flex items-center justify-center shrink-0 transition-all duration-200 shadow-xs hover:shadow active:scale-95 cursor-pointer ${
              isFavorited ? 'text-[#7c3aed] border-purple-400 bg-purple-50' : 'text-slate-500 hover:text-[#7c3aed]'
            }`}
            title={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-label="Wishlist"
          >
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] transition-colors ${
                isFavorited ? 'fill-[#7c3aed] text-[#7c3aed]' : 'text-slate-500 hover:text-[#7c3aed]'
              }`}
            />
          </button>
        </div>

      </div>

      <LoginRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        type="wishlist"
      />

    </div>
  );
};
