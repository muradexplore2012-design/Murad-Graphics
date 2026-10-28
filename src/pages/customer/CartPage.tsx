import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  Tag, 
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { validateCouponCode } from '../../services/api';
import { EmptyState } from '../../components/ui/EmptyState';

export const CartPage: React.FC = () => {
  const { cart, removeFromCart, clearCart, totalPrice } = useCart();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    setCouponMessage(null);
    try {
      const result = await validateCouponCode(couponCode, totalPrice);
      if (result.valid) {
        setCouponDiscount(result.discountAmount);
        setCouponMessage({ text: `Coupon applied! Saved ৳${result.discountAmount}`, isError: false });
      } else {
        setCouponDiscount(0);
        setCouponMessage({ text: result.error || 'Invalid coupon.', isError: true });
      }
    } catch {
      setCouponMessage({ text: 'Error applying coupon.', isError: true });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const finalTotal = Math.max(0, totalPrice - couponDiscount);

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8 text-blue-600" />}
          title="Your Cart is Empty"
          description="Explore our digital graphics catalog and add editable templates, software, and tools to your cart."
          actionLabel="Browse Marketplace"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Digital Cart ({cart.length})</h1>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart items list */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-5 flex flex-row items-center gap-3 sm:gap-6 shadow-sm"
            >
              <img
                src={item.thumbnail || '/logo.png'}
                alt={item.name}
                className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-xl bg-slate-100 shrink-0"
              />

              <div className="flex-1 text-left space-y-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block truncate">
                  {item.categoryName}
                </span>
                <Link to={`/product/${item.slug}`}>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-base hover:text-blue-600 line-clamp-2">
                    {item.name}
                  </h3>
                </Link>
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  {item.formats?.slice(0, 3).map((fmt, i) => (
                    <span key={i} className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {fmt}
                    </span>
                  ))}
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                    • Direct Download
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between self-stretch shrink-0 gap-2">
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Remove item"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <span className="font-black text-slate-900 text-sm sm:text-lg">
                  {item.isFree ? 'FREE' : `৳${item.price}`}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Coupon box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6 sticky top-28">
            <h2 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">Order Summary</h2>

            {/* Subtotal lines */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal ({cart.length} item{cart.length > 1 ? 's' : ''})</span>
                <span className="font-semibold text-slate-900">৳{totalPrice}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 font-semibold">
                  <span>Discount</span>
                  <span>-৳{couponDiscount}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600">
                <span>Digital Delivery</span>
                <span className="font-semibold text-emerald-600">Free / Direct</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-base font-extrabold text-slate-900">
                <span>Total Amount</span>
                <span className="text-xl text-blue-600 font-black">৳{finalTotal}</span>
              </div>
            </div>

            {/* Coupon input */}
            <form onSubmit={handleApplyCoupon} className="space-y-2 pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo/Coupon Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={validatingCoupon || !couponCode}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shrink-0 transition-all"
                >
                  {validatingCoupon ? "..." : "Apply"}
                </button>
              </div>

              {couponMessage && (
                <p className={`text-xs font-medium ${couponMessage.isError ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {couponMessage.text}
                </p>
              )}
            </form>

            {/* Checkout action */}
            <button
              onClick={() => navigate('/checkout', { state: { couponDiscount, couponCode } })}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Bangladeshi mobile payment & secure file delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
