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

        // Merge free entitlements into orders list so claimed free items show up in My Orders & Purchases
        const existingProductIdsInOrders = new Set();
        userOrders.forEach(o => o.items?.forEach(i => existingProductIdsInOrders.add(i.productId)));

        const syntheticOrders: Order[] = userEnts
          .filter(ent => !existingProductIdsInOrders.has(ent.productId))
          .map(ent => ({
            id: `ent_${ent.id}`,
            orderNumber: `FREE-${(ent.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'CLAIM'}`,
            userId: ent.userId,
            userEmail: ent.userEmail,
            items: [{
              productId: ent.productId,
              name: ent.productName,
              slug: ent.productSlug,
              price: 0,
              thumbnail: ent.thumbnail,
              isFree: true,
              formats: [],
              zipPassword: ent.zipPassword || '',
              deliveryMethod: ent.deliveryMethod || 'direct_upload',
            }],
            subtotal: 0,
            discount: 0,
            total: 0,
            currency: 'BDT' as const,
            paymentMethod: 'free_checkout' as const,
            paymentStatus: 'verified' as const,
            createdAt: ent.accessGrantedAt || new Date().toISOString(),
            updatedAt: ent.accessGrantedAt || new Date().toISOString()
          }));

        const combinedOrders = [...userOrders, ...syntheticOrders].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setOrders(combinedOrders);
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
    <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Account Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4 text-center sm:text-left">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || "User"} 
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-slate-100 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
            </div>
          )}
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
            <span>Vyrqonix Library ({entitlements.length})</span>
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
            <p className="text-xs text-slate-500 mt-0.5">Real-time status of your orders & claimed products</p>
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
                    <th className="px-6 py-4">Item / Product</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => {
                    const firstItem = o.items?.[0];
                    const isFreeOrder = o.total === 0 || o.paymentMethod === 'free_checkout';
                    return (
                      <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          #{o.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {firstItem?.thumbnail ? (
                              <img 
                                src={firstItem.thumbnail} 
                                alt="" 
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200/80 shadow-xs shrink-0" 
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                <Package className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-[320px]">
                                {firstItem?.name || "Product Item"}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {isFreeOrder ? (
                                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded font-semibold">
                                    Free Claim
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 py-0.2 rounded font-semibold">
                                    Paid Order
                                  </span>
                                )}
                                {o.items?.length > 1 && (
                                  <span className="text-[10px] text-slate-400">+{o.items.length - 1} more</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isFreeOrder ? (
                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[11px]">
                              Free (৳0)
                            </span>
                          ) : (
                            <span className="font-black text-slate-900 text-sm">
                              ৳{o.total}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            o.paymentStatus === 'verified'
                              ? 'bg-emerald-50 text-emerald-700'
                              : o.paymentStatus === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {o.paymentStatus === 'verified' && <CheckCircle className="w-3 h-3" />}
                            {o.paymentStatus === 'pending' && <Clock className="w-3 h-3" />}
                            {isFreeOrder ? 'Claimed' : o.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {o.id.startsWith('ent_') ? (
                            <Link
                              to="/account/downloads"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-xl transition-all shadow-xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </Link>
                          ) : (
                            <Link
                              to={`/account/orders/${o.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl transition-all"
                            >
                              <span>View Details</span>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
