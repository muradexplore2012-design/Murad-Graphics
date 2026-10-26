import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { createOrder } from '../../services/api';
import confetti from 'canvas-confetti';

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const { cart, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const stateCouponDiscount = location.state?.couponDiscount || 0;
  const stateCouponCode = location.state?.couponCode || '';

  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const subtotal = totalPrice;
  const discount = Math.min(stateCouponDiscount, subtotal);
  const finalTotal = Math.max(0, subtotal - discount);
  const isFreeCheckout = finalTotal === 0;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (cart.length === 0) {
      navigate('/shop');
      return;
    }

    if (!isFreeCheckout && !transactionId.trim()) {
      setErrorMessage('Please provide the transaction ID (TrxID) after completing your mobile payment.');
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = cart.map((p) => ({
        productId: p.id,
        name: p.name,
        slug: p.slug,
        thumbnail: p.thumbnail,
        price: p.price,
        isFree: p.isFree,
        formats: p.formats || [],
        deliveryMethod: p.deliveryMethod,
        zipPassword: p.zipPassword || ''
      }));

      const newOrder = await createOrder({
        userId: user.uid,
        userEmail: user.email || '',
        customerName: customerName.trim() || user.displayName || 'Customer',
        customerPhone: customerPhone.trim(),
        items: orderItems,
        subtotal,
        discount,
        total: finalTotal,
        currency: 'BDT',
        paymentStatus: isFreeCheckout ? 'verified' : 'pending',
        paymentMethod: isFreeCheckout ? 'free_checkout' : paymentMethod,
        transactionId: isFreeCheckout ? 'FREE-GRANT' : transactionId.trim()
      });

      clearCart();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      navigate(`/account/orders/${newOrder.id}`, { state: { justPlaced: true } });
    } catch (err: any) {
      console.error("Order placement error:", err);
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Your cart is empty</h2>
        <p className="text-slate-500 text-sm mt-2">Add items to your cart before proceeding to checkout.</p>
        <Link to="/shop" className="inline-block mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs">
          Explore Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Digital Checkout</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Instant digital delivery to your account library</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form: Customer Details & Payment instructions */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handlePlaceOrder} id="checkout-form" className="space-y-6">
            
            {/* Customer Details */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                1. Customer Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone Number (Bangladesh)</label>
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Account Email</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || 'Login required'}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-slate-500 cursor-not-allowed"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Your digital files will be linked to this account for lifetime access.
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Section (only if not completely free) */}
            {!isFreeCheckout ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                  2. Select Payment Method (BDT ৳)
                </h2>

                <div className="grid grid-cols-3 gap-3">
                  {(['bKash', 'Nagad', 'Rocket'] as const).map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3.5 rounded-xl border text-center font-bold text-xs transition-all ${
                        paymentMethod === method
                          ? 'border-blue-600 bg-blue-50/80 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {/* Bangladesh Mobile Payment Instructions */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-800 font-bold">
                    <span>Send Money ({paymentMethod} Personal):</span>
                    <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      01566088159
                    </span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>Go to your {paymentMethod} App or dial USSD.</li>
                    <li>Choose <strong>Send Money</strong> to the number above.</li>
                    <li>Enter exact amount: <strong>৳{finalTotal}</strong></li>
                    <li>Copy and enter the Transaction ID (TrxID) below.</li>
                  </ol>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="font-bold text-slate-800 block">Transaction ID (TrxID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BL92KJ78X"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Your purchase will be verified swiftly by our automated system / admin team.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-emerald-900 space-y-2">
                <h3 className="font-bold text-sm">Free Checkout Entitlement</h3>
                <p className="text-xs text-emerald-700">
                  Your total amount is ৳0. Clicking "Complete Free Acquisition" will instantly grant lifetime download entitlements to your library.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </form>
        </div>

        {/* Right Summary Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 sticky top-28">
            <h2 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">Order Overview</h2>

            {/* List of items */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img
                    src={item.thumbnail || '/logo.png'}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400">{item.formats?.join(', ')}</p>
                  </div>
                  <span className="text-xs font-black text-slate-900 shrink-0">
                    {item.isFree ? 'FREE' : `৳${item.price}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal</span>
                <span>৳{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount ({stateCouponCode})</span>
                  <span>-৳{discount}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-600">
                <span>Digital Delivery</span>
                <span className="text-emerald-600 font-medium">Direct Download</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm font-extrabold text-slate-900">
                <span>Payable Total</span>
                <span className="text-xl text-blue-600 font-black">৳{finalTotal}</span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              form="checkout-form"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>
                {submitting
                  ? "Processing Order..."
                  : isFreeCheckout
                  ? "Complete Free Acquisition"
                  : `Confirm & Pay ৳${finalTotal}`}
              </span>
            </button>

            <div className="text-[11px] text-slate-400 text-center leading-relaxed">
              By confirming your order, you agree to Vyrqonix's terms of service and instant access policy.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
