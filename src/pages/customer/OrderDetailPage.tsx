import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { CheckCircle2, Clock, XCircle, ArrowRight, Download, ExternalLink } from 'lucide-react';
import { TableSkeleton } from '../../components/ui/Skeletons';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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
