import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserOrders, getUserEntitlements, deleteUserOrder } from '../../services/api';
import { Order, DownloadEntitlement } from '../../types';
import { 
  User as UserIcon, 
  Package, 
  Download, 
  Clock, 
  CheckCircle, 
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Calendar,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeletons';

export const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [entitlements, setEntitlements] = useState<DownloadEntitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.photoURL]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      const ordersCacheKey = `mg_user_orders_${user.uid}`;
      try {
        const cachedRaw = localStorage.getItem(ordersCacheKey);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrders(parsed);
            setLoading(false);
          }
        }
      } catch {}

      try {
        const [userOrders, userEnts] = await Promise.all([
          getUserOrders(user.uid),
          getUserEntitlements(user.uid, user.email || undefined)
        ]);

        // Filter out deleted items from local blacklist
        const deletedOrderIds = new Set<string>();
        try {
          const rawO = localStorage.getItem(`mg_deleted_order_ids_${user.uid}`);
          if (rawO) JSON.parse(rawO).forEach((id: string) => deletedOrderIds.add(id));
        } catch {}

        const deletedProductIds = new Set<string>();
        try {
          const rawP = localStorage.getItem(`mg_deleted_product_ids_${user.uid}`);
          if (rawP) JSON.parse(rawP).forEach((id: string) => deletedProductIds.add(id));
        } catch {}

        const activeOrders = userOrders.filter(o => !deletedOrderIds.has(o.id));
        const activeEnts = userEnts.filter(e => !deletedProductIds.has(e.productId));

        // Merge free entitlements into orders list so claimed free items show up in My Orders & Purchases
        const existingProductIdsInOrders = new Set();
        activeOrders.forEach(o => o.items?.forEach(i => existingProductIdsInOrders.add(i.productId)));

        const syntheticOrders: Order[] = activeEnts
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

        const combinedOrders = [...activeOrders, ...syntheticOrders].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setOrders(combinedOrders);
        setEntitlements(activeEnts);
        try {
          localStorage.setItem(ordersCacheKey, JSON.stringify(combinedOrders));
        } catch {}
      } catch (e) {
        console.error("Error loading account data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const handleDeleteOrder = async (order: Order) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে এই আইটেমটি (#${order.orderNumber}) ডিলিট করতে চান?`)) {
      return;
    }
    setDeletingOrderId(order.id);
    try {
      // 1. Optimistic state update
      const nextOrders = orders.filter(o => o.id !== order.id);
      setOrders(nextOrders);

      const productIds = order.items?.map(i => i.productId).filter(Boolean) || [];
      if (productIds.length > 0) {
        setEntitlements(prev => prev.filter(e => !productIds.includes(e.productId)));
      }

      // 2. Persist updated cache and deleted blacklist
      if (user) {
        const ordersCacheKey = `mg_user_orders_${user.uid}`;
        try {
          localStorage.setItem(ordersCacheKey, JSON.stringify(nextOrders));
        } catch {}

        // Add to deleted order IDs
        try {
          const rawO = localStorage.getItem(`mg_deleted_order_ids_${user.uid}`);
          const oList: string[] = rawO ? JSON.parse(rawO) : [];
          if (!oList.includes(order.id)) {
            oList.push(order.id);
            localStorage.setItem(`mg_deleted_order_ids_${user.uid}`, JSON.stringify(oList));
          }
        } catch {}

        // Add to deleted product IDs so they don't reappear in Vyrqonix Library
        if (productIds.length > 0) {
          try {
            const rawP = localStorage.getItem(`mg_deleted_product_ids_${user.uid}`);
            const pList: string[] = rawP ? JSON.parse(rawP) : [];
            productIds.forEach(pId => {
              if (!pList.includes(pId)) pList.push(pId);
            });
            localStorage.setItem(`mg_deleted_product_ids_${user.uid}`, JSON.stringify(pList));

            // Also update Vyrqonix library cache
            const libKey = `mg_user_entitlements_${user.uid}`;
            const rawLib = localStorage.getItem(libKey);
            if (rawLib) {
              const currentLib = JSON.parse(rawLib);
              if (Array.isArray(currentLib)) {
                const updatedLib = currentLib.filter((e: any) => !productIds.includes(e.productId));
                localStorage.setItem(libKey, JSON.stringify(updatedLib));
                localStorage.setItem(`mg_cache_entitlements_${user.uid}`, JSON.stringify(updatedLib));
              }
            }
          } catch {}
        }

        // 3. Delete in Firestore
        await deleteUserOrder(order.id, user.uid, productIds);
      }
    } catch (err) {
      console.error("Error deleting order:", err);
    } finally {
      setDeletingOrderId(null);
    }
  };

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
    <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-10">
      
      {/* Account Profile Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-5 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6 shadow-sm">
        <div className="flex items-center gap-3.5 sm:gap-4 text-left w-full sm:w-auto">
          {user.photoURL && !avatarError ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || "User"} 
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-md border-2 border-slate-100 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-md shrink-0">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 truncate">
              {user.displayName || "Customer Account"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{user.email}</p>
            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px]">
              Active Creator Account
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link
            to="/account/downloads"
            className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="truncate">Vyrqonix Library ({entitlements.length})</span>
          </Link>
          <button
            onClick={logout}
            className="px-3.5 sm:px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all shrink-0"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Orders History Section */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">My Orders & Purchases</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time status of your orders & claimed products</p>
          </div>
          {orders.length > 0 && (
            <span className="text-[11px] text-slate-400 font-medium">
              Showing {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="hidden lg:block">
              <TableSkeleton rows={3} />
            </div>
            <div className="lg:hidden space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-slate-200 rounded w-28" />
                    <div className="h-5 bg-slate-200 rounded-full w-20" />
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <div className="h-4 bg-slate-200 rounded w-16" />
                    <div className="h-8 bg-slate-200 rounded-xl w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="w-8 h-8 text-blue-600" />}
            title="No orders found"
            description="You have not placed any orders yet. Discover high-quality design assets and software."
            actionLabel="Start Browsing"
            actionHref="/shop"
          />
        ) : (
          <>
            {/* Mobile View: High-clarity responsive order cards (No horizontal scroll) */}
            <div className="lg:hidden space-y-3">
              {orders.map((o) => {
                const firstItem = o.items?.[0];
                const isFreeOrder = o.total === 0 || o.paymentMethod === 'free_checkout';
                const isVerified = o.paymentStatus === 'verified' || isFreeOrder;
                const isPending = o.paymentStatus === 'pending';

                return (
                  <div 
                    key={o.id} 
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3.5 transition-all hover:border-slate-300"
                  >
                    {/* Top Row: Order # and Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md truncate">
                          #{o.orderNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(o.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : isPending
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                      }`}>
                        {isVerified && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                        {isFreeOrder ? 'Claimed' : o.paymentStatus}
                      </span>
                    </div>

                    {/* Middle Row: Product info with thumbnail */}
                    <div className="flex items-center gap-3">
                      {firstItem?.thumbnail ? (
                        <img 
                          src={firstItem.thumbnail} 
                          alt="" 
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200/80 shadow-xs shrink-0" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                          {firstItem?.name || "Product Item"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
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
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{o.items.length - 1} more items
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Amount & Action Buttons (Download/View Details + Delete) */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Amount
                        </span>
                        {isFreeOrder ? (
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                            Free (৳0)
                          </span>
                        ) : (
                          <span className="font-extrabold text-slate-900 text-sm">
                            ৳{o.total}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(o)}
                          disabled={deletingOrderId === o.id}
                          title="অর্ডারটি ডিলিট করুন"
                          className="px-2.5 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1 text-xs font-semibold"
                          aria-label="Delete order"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Delete</span>
                        </button>

                        {o.id.startsWith('ent_') ? (
                          <Link
                            to="/account/downloads"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98]"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </Link>
                        ) : (
                          <Link
                            to={`/account/orders/${o.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98]"
                          >
                            <span>Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
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
                            <div className="inline-flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(o)}
                                disabled={deletingOrderId === o.id}
                                title="অর্ডারটি ডিলিট করুন"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer text-xs font-semibold disabled:opacity-50"
                                aria-label="Delete order"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Delete</span>
                              </button>

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
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
};
