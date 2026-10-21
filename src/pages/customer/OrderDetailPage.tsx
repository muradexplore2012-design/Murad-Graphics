import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { CheckCircle2, Clock, XCircle, ArrowRight, Download, ExternalLink, KeyRound, Copy, Check } from 'lucide-react';
import { TableSkeleton } from '../../components/ui/Skeletons';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedPass, setCopiedPass] = useState<string | null>(null);
  const [showZipModal, setShowZipModal] = useState<boolean>(Boolean((location.state as any)?.justPlaced));

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        const snap = await getDoc(doc(db, "orders", id));
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() } as Order);
        }
      } catch (e) {
        console.error("Error fetching order:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <p className="text-slate-500 text-sm mt-2">Could not find record for order #{id}.</p>
        <Link to="/account" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
          View My Orders
        </Link>
      </div>
    );
  }

  const isVerified = order.paymentStatus === 'verified';
  const isPending = order.paymentStatus === 'pending';
  const zipItems = order.items.filter((item) => Boolean(item.zipPassword));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* 1. Modal Popup on initial arrival right after checkout (if order has ZIP password) */}
      {showZipModal && zipItems.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900">আপনার অর্ডারটি সফল হয়েছে!</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                আপনার ফাইলটি ZIP ফরম্যাটে রয়েছে। ফাইলটি ডাউনলোড করার পর আনজিপ (Unzip) করতে নিচের পাসওয়ার্ডটি ব্যবহার করুন:
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-2xl border-2 border-dashed border-purple-300 space-y-2">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
                আনজিপ করার পাসওয়ার্ড
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {zipItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-purple-200 shadow-xs">
                    {zipItems.length > 1 && (
                      <span className="text-xs text-slate-500 font-medium truncate max-w-[100px]">{item.name}:</span>
                    )}
                    <span className="font-mono text-xl font-black text-[#7a00ea] tracking-widest">{item.zipPassword}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(item.zipPassword || '');
                        setCopiedPass(item.zipPassword || '');
                        setTimeout(() => setCopiedPass(null), 2500);
                      }}
                      className="px-2.5 py-1 bg-[#7a00ea] hover:bg-[#6c00d4] text-white text-[11px] font-bold rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPass === item.zipPassword ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              পাসওয়ার্ডটি কপি করে সংরক্ষণ করুন। এটি আপনার অর্ডার ও ডাউনলোড পেজেও থাকবে।
            </p>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowZipModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                ঠিক আছে
              </button>
              <Link
                to="/account/downloads"
                className="w-1/2 py-2.5 rounded-xl bg-[#7a00ea] hover:bg-[#6c00d4] text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ডাউনলোড পেজ</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. Permanent ZIP Password Card if items have extraction passwords */}
      {zipItems.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-purple-50/80 border-2 border-purple-200 text-slate-800 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
            <KeyRound className="w-5 h-5 text-[#7a00ea]" />
            <span>ফাইল আনজিপ (Unzip) করার পাসওয়ার্ড</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            আপনার অর্ডারের ফাইলটি ZIP আকারে রয়েছে। ফাইলটি ডাউনলোড করার পর আনজিপ (Extract) করার জন্য নিচের পাসওয়ার্ডটি প্রয়োজন হবে:
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {zipItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-2xl border border-purple-200 shadow-xs">
                {zipItems.length > 1 && (
                  <span className="text-xs text-slate-500 font-medium truncate max-w-[120px]">{item.name}:</span>
                )}
                <span className="font-mono text-lg font-black text-[#7a00ea] tracking-wider">{item.zipPassword}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(item.zipPassword || '');
                    setCopiedPass(item.zipPassword || '');
                    setTimeout(() => setCopiedPass(null), 2500);
                  }}
                  className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                  title="Copy Password"
                >
                  {copiedPass === item.zipPassword ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border text-center space-y-3 ${
        isVerified 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
          : isPending
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : 'bg-rose-50 border-rose-200 text-rose-900'
      }`}>
        <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-white shadow-sm">
          {isVerified ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          ) : isPending ? (
            <Clock className="w-6 h-6 text-amber-600" />
          ) : (
            <XCircle className="w-6 h-6 text-rose-600" />
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold">
          {isVerified
            ? "Order Confirmed & Entitlement Activated!"
            : isPending
            ? "Payment Verification in Progress"
            : `Order ${order.paymentStatus}`}
        </h1>

        <p className="text-xs sm:text-sm max-w-md mx-auto leading-relaxed opacity-90">
          {isVerified
            ? "Thank you for your purchase! All digital assets in this order are now accessible in your Downloads Library."
            : isPending
            ? `We received your order reference (${order.orderNumber}). Our team is verifying your payment with ${order.paymentMethod || 'the gateway'}. Your files will unlock once verified.`
            : "This order could not be completed or was cancelled."}
        </p>

        {isVerified && (
          <div className="pt-2">
            <Link
              to="/account/downloads"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Go to My Downloads</span>
            </Link>
          </div>
        )}
      </div>

      {/* Order specifics */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 text-xs">
          <div>
            <span className="text-slate-400">Order Number:</span>
            <span className="font-mono font-bold text-slate-800 ml-2">#{order.orderNumber}</span>
          </div>
          <div>
            <span className="text-slate-400">Date:</span>
            <span className="text-slate-700 ml-2 font-medium">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Payment Status:</span>
            <span className={`ml-2 font-bold uppercase ${
              isVerified ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordered Assets</h3>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
              <img
                src={item.thumbnail || '/logo.png'}
                alt={item.name}
                className="w-12 h-12 rounded-lg object-cover bg-slate-200"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                <p className="text-[10px] text-slate-400">{item.formats?.join(', ')}</p>
              </div>
              <span className="text-xs font-black text-slate-900">
                {item.isFree ? 'FREE' : `৳${item.price}`}
              </span>
            </div>
          ))}
        </div>

        {/* Pricing breakdown */}
        <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>৳{order.subtotal}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Discount</span>
              <span>-৳{order.discount}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-100">
            <span>Total Paid</span>
            <span className="text-blue-600">৳{order.total}</span>
          </div>
          {order.transactionId && (
            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
              <span>Transaction Reference:</span>
              <span className="font-mono">{order.transactionId}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
