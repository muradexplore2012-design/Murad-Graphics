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
      
      {/* 1. Thumbnail Container (Square 1:1, Full-Bleed Top with Inset Badges) */}
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

        {/* Free / Price Badge (Top Left) */}
        {product.isFree ? (
          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 pointer-events-none z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black bg-[#00c853] text-white shadow-md uppercase tracking-wider">
              <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span>FREE</span>
            </span>
          </div>
        ) : (
          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 pointer-events-none z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black bg-[#ef4444] text-white shadow-md tracking-tight">
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span>৳{product.price}</span>
            </span>
          </div>
        )}

        {/* Wishlist floating toggle (Top Right, Circular White Button with Purple Heart) */}
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
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white text-[#7c3aed] shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-20 border border-slate-100 cursor-pointer"
          title={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label="Wishlist"
        >
          <Heart
            className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] transition-colors ${
              isFavorited ? 'fill-[#7c3aed] text-[#7c3aed]' : 'text-[#7c3aed]'
            }`}
          />
        </button>
      </div>

      {/* 2. Content Body (Title, Price & Action Button) */}
      <div className="p-3.5 sm:p-4.5 flex flex-col items-center text-center flex-1 justify-between gap-2 sm:gap-2.5">
        
        {/* Product Title (Centered, 2 Lines Max) */}
        <div className="w-full text-center px-0.5 min-h-[40px] sm:min-h-[44px] flex items-center justify-center">
          <Link to={productLink} className="block w-full">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base md:text-[17px] leading-snug line-clamp-2 hover:text-[#7c3aed] transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Product Price / Free Download (Centered) */}
        <div className="w-full flex items-center justify-center my-1 sm:my-1.5 min-h-[28px] sm:min-h-[32px]">
          {product.isFree ? (
            <div className="inline-flex items-center justify-center gap-1.5 text-[#059669] font-bold text-xs sm:text-base md:text-[17px]">
              <Download className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              <span>Free Download</span>
            </div>
          ) : (
            <div className="flex items-baseline justify-center gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-[#7c3aed] tracking-tight">
                ৳{product.price}
              </span>
              {product.comparePrice && product.comparePrice > product.price ? (
                <span className="text-xs sm:text-sm md:text-base font-bold text-slate-400 line-through">
                  ৳{product.comparePrice}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* Action Button: Full-width Pill Button */}
        <div className="w-full pt-1 mt-auto">
          <button
            type="button"
            onClick={handleBuyNow}
            className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs sm:text-sm md:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
          >
            {product.isFree ? (
              <>
                <Download className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                <span>Get Free</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                <span>Buy Now</span>
              </>
            )}
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
