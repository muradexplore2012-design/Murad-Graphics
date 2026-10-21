import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, ShoppingBag, Download } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isFavorited = isInWishlist(product.id);
  const inCart = isInCart(product.id);

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.isFree) {
      navigate(`/product/${product.slug}`);
      return;
    }
    if (!inCart) {
      addToCart(product);
    }
    navigate('/checkout');
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
  };

  return (
    <div className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-2.5 sm:p-3.5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative">
      
      {/* 1. Thumbnail Container (Square 1:1, Rounded Corners) */}
      <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl overflow-hidden bg-slate-900 mb-2 sm:mb-3">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.thumbnail || '/logo.png'}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Free / Discount Badge (Top Left) */}
        {product.isFree ? (
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 pointer-events-none z-10">
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-black bg-emerald-500 text-white shadow-sm uppercase tracking-wide">
              FREE
            </span>
          </div>
        ) : Boolean(product.showDiscountBadge) && product.comparePrice && product.comparePrice > product.price ? (
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 pointer-events-none z-10">
            <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-black bg-rose-500 text-white shadow-sm uppercase tracking-wider">
              {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
            </span>
          </div>
        ) : null}

        {/* Wishlist floating toggle (Top Right, Circular White Button with Purple Heart) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-white text-purple-600 shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-20 ${
            isFavorited ? 'text-purple-600' : 'text-purple-600'
          }`}
          title={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label="Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.2] ${isFavorited ? 'fill-purple-600 text-purple-600' : 'text-purple-600'}`} />
        </button>
      </div>

      {/* 2. Product Title (Centered, 2 Lines Max) */}
      <div className="px-0.5 sm:px-1 text-center mb-1">
        <Link to={`/product/${product.slug}`} className="block">
          <h3 className="font-bold text-slate-900 text-xs sm:text-base leading-snug line-clamp-2 hover:text-purple-600 transition-colors">
            {product.name}
          </h3>
        </Link>
      </div>

      {/* 3. Product Price (Centered, Vibrant Purple) */}
      <div className="text-center my-1.5 sm:my-2">
        {product.isFree ? (
          <span className="text-xs sm:text-lg font-black text-emerald-600">
            Free Download
          </span>
        ) : product.comparePrice && product.comparePrice > product.price ? (
          <div className="text-xs sm:text-lg font-black text-purple-600 tracking-tight">
            <span>{product.price}৳</span>
            <span className="mx-0.5 sm:mx-1 font-normal text-purple-400">–</span>
            <span>{product.comparePrice}৳</span>
          </div>
        ) : (
          <span className="text-xs sm:text-lg font-black text-purple-600 tracking-tight">
            {product.price}৳
          </span>
        )}
      </div>

      {/* 4. Action Buttons (Buy Now Pill Button + Circular Cart Button) */}
      <div className="flex items-center gap-1.5 sm:gap-2 pt-1 mt-auto">
        {/* Left: Buy Now Button */}
        <button
          type="button"
          onClick={handleBuyNow}
          className="flex-1 py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-[11px] sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-xs active:scale-95 group/btn"
        >
          {product.isFree ? (
            <>
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Get Free</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="whitespace-nowrap">Buy Now</span>
            </>
          )}
        </button>

        {/* Right: Circular Cart Icon Button */}
        {!product.isFree && (
          <button
            type="button"
            onClick={handleCartClick}
            disabled={inCart}
            className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full border border-purple-500 flex items-center justify-center shrink-0 transition-all active:scale-95 ${
              inCart
                ? 'bg-purple-100 text-purple-700 border-purple-600 cursor-default'
                : 'bg-white hover:bg-purple-50 text-purple-600 hover:border-purple-600'
            }`}
            title={inCart ? 'Already in cart' : 'Add to cart'}
            aria-label="Add to cart"
          >
            <ShoppingCart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${inCart ? 'fill-purple-600' : ''}`} />
          </button>
        )}
      </div>

    </div>
  );
};
