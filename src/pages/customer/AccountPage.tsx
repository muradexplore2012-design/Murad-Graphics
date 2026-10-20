import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserOrders, getUserEntitlements } from '../../services/api';
import { Order, DownloadEntitlement } from '../../types';
import { 
  User as UserIcon, 
  Package, 
  Download, 
  Clock, 
  CheckCircle, 
  ExternalLink,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeletons';

export const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [entitlements, setEntitlements] = useState<DownloadEntitlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [userOrders, userEnts] = await Promise.all([
          getUserOrders(user.uid),
          getUserEntitlements(user.uid)
        ]);
        setOrders(userOrders);
        setEntitlements(userEnts);
      } catch (e) {
        console.error("Error loading account data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Please Sign In</h2>
        <p className="text-xs text-slate-500 mt-2">Log in to view your orders, profile, and download library.</p>
        <Link to="/login" className="mt-4 inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Account Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {user.displayName || "Customer Account"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px]">
              Active Creator Account
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/account/downloads"
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Downloads Library ({entitlements.length})</span>
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Orders History Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">My Orders & Purchases</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time status of your orders</p>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={3} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="w-8 h-8 text-blue-600" />}
            title="No orders found"
            description="You have not placed any orders yet. Discover high-quality design assets and software."
            actionLabel="Start Browsing"
            actionHref="/shop"
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Order #</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        #{o.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {o.items?.length || 0} item{o.items?.length > 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">
                        ৳{o.total}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          o.paymentStatus === 'verified'
                            ? 'bg-emerald-50 text-emerald-700'
                            : o.paymentStatus === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {o.paymentStatus === 'verified' && <CheckCircle className="w-3 h-3" />}
                          {o.paymentStatus === 'pending' && <Clock className="w-3 h-3" />}
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/account/orders/${o.id}`}
                          className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
