import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  getAllProductsAdmin, 
  getAllOrdersAdmin, 
  getCategories 
} from '../../services/api';
import { Product, Order, Category } from '../../types';
import { 
  Package, 
  DollarSign, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  Layers 
} from 'lucide-react';

interface CachedDashboardStats {
  totalProducts: number;
  activeProducts: number;
  freeProducts: number;
  paidProducts: number;
  totalOrders: number;
  verifiedOrdersCount: number;
  pendingOrdersCount: number;
  totalVerifiedRevenue: number;
  categoriesCount: number;
  activeCategoriesCount: number;
  recentOrders: Order[];
}

const DASHBOARD_CACHE_KEY = 'mg_admin_dashboard_metrics_cache_v1';

const getCachedDashboardStats = (): CachedDashboardStats | null => {
  try {
    const saved = localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Dashboard cache read error:", e);
  }
  return null;
};

export const AdminDashboard: React.FC = () => {
  const [cachedStats, setCachedStats] = useState<CachedDashboardStats | null>(() => getCachedDashboardStats());
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => cachedStats?.recentOrders || []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!cachedStats);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAdminStats = async () => {
      if (!cachedStats) {
        setLoading(true);
      }
      try {
        const [prodList, orderList, catList] = await Promise.all([
          getAllProductsAdmin(),
          getAllOrdersAdmin(),
          getCategories(false)
        ]);

        if (!isMounted) return;

        setProducts(prodList);
        setOrders(orderList);
        setCategories(catList);
        setHasFetched(true);

        const verifiedOrders = orderList.filter(o => o.paymentStatus === 'verified');
        const pendingOrders = orderList.filter(o => o.paymentStatus === 'pending');
        const totalRev = verifiedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        const freshStats: CachedDashboardStats = {
          totalProducts: prodList.length,
          activeProducts: prodList.filter(p => p.isActive).length,
          freeProducts: prodList.filter(p => p.isFree).length,
          paidProducts: prodList.filter(p => !p.isFree).length,
          totalOrders: orderList.length,
          verifiedOrdersCount: verifiedOrders.length,
          pendingOrdersCount: pendingOrders.length,
          totalVerifiedRevenue: totalRev,
          categoriesCount: catList.length,
          activeCategoriesCount: catList.filter(c => c.isActive).length,
          recentOrders: orderList.slice(0, 5)
        };

        setCachedStats(freshStats);
        try {
          localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(freshStats));
        } catch (e) {
          console.warn("Could not save to localStorage", e);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAdminStats();
    return () => { isMounted = false; };
  }, []);

  // Compute metrics from live database collections if fetched, else immediately from instant cache
  const totalProducts = hasFetched ? products.length : (cachedStats?.totalProducts ?? 0);
  const activeProducts = hasFetched ? products.filter(p => p.isActive).length : (cachedStats?.activeProducts ?? 0);
  const freeProducts = hasFetched ? products.filter(p => p.isFree).length : (cachedStats?.freeProducts ?? 0);
  const paidProducts = hasFetched ? products.filter(p => !p.isFree).length : (cachedStats?.paidProducts ?? 0);

  const totalOrders = hasFetched ? orders.length : (cachedStats?.totalOrders ?? 0);
  const verifiedOrdersCount = hasFetched ? orders.filter(o => o.paymentStatus === 'verified').length : (cachedStats?.verifiedOrdersCount ?? 0);
  const pendingOrdersCount = hasFetched ? orders.filter(o => o.paymentStatus === 'pending').length : (cachedStats?.pendingOrdersCount ?? 0);
  const totalVerifiedRevenue = hasFetched 
    ? orders.filter(o => o.paymentStatus === 'verified').reduce((sum, o) => sum + (o.total || 0), 0)
    : (cachedStats?.totalVerifiedRevenue ?? 0);

  const totalCategories = hasFetched ? categories.length : (cachedStats?.categoriesCount ?? 0);
  const activeCategoriesCount = hasFetched ? categories.filter(c => c.isActive).length : (cachedStats?.activeCategoriesCount ?? 0);

  const isDatabaseCompletelyEmpty = !loading && totalProducts === 0 && totalOrders === 0 && totalCategories === 0;

  const displayOrders = orders.length > 0 ? orders.slice(0, 5) : (cachedStats?.recentOrders || []);

  return (
    <div className="space-y-8">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Administrator Overview</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time metrics and store health from Firebase Firestore</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
          <Link
            to="/admin/categories"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition-all"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Manage Categories</span>
          </Link>
        </div>
      </div>

      {/* Database Empty First-Login Guide */}
      {isDatabaseCompletelyEmpty && (
        <div className="p-6 sm:p-8 rounded-3xl bg-blue-50 border border-blue-200/80 text-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Welcome, Murad! Your Store is Ready for Content</h2>
              <p className="text-xs text-blue-700 font-medium">Your Firebase Firestore database is connected and currently empty (no fake data).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white border border-blue-100 space-y-2 shadow-xs">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">Step 1</span>
              <h4 className="text-sm font-bold text-slate-900">Create Categories</h4>
              <p className="text-xs text-slate-600">Add categories like Logo Design, Mockups, Social Media, Software.</p>
              <Link to="/admin/categories" className="text-xs text-blue-600 font-bold hover:underline inline-block pt-1">
                Go to Categories →
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-blue-100 space-y-2 shadow-xs">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">Step 2</span>
              <h4 className="text-sm font-bold text-slate-900">Add Your First Product</h4>
              <p className="text-xs text-slate-600">Upload preview images, select Free or Paid, and upload source files.</p>
              <Link to="/admin/products/new" className="text-xs text-blue-600 font-bold hover:underline inline-block pt-1">
                Create Product →
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-blue-100 space-y-2 shadow-xs">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">Step 3</span>
              <h4 className="text-sm font-bold text-slate-900">Configure Settings</h4>
              <p className="text-xs text-slate-600">Review phone numbers, WhatsApp, site policies, and social links.</p>
              <Link to="/admin/settings" className="text-xs text-blue-600 font-bold hover:underline inline-block pt-1">
                Open Settings →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats KPI Cards - 2x2 Grid on Mobile, 4 columns on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
        
        {/* Total Products */}
        <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider gap-1">
              <span className="truncate">Total Products</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            {loading && !cachedStats ? (
              <div className="h-7 sm:h-9 w-16 sm:w-20 bg-slate-100 rounded-lg animate-pulse my-1" />
            ) : (
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900">{totalProducts}</div>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight">
            {activeProducts} active • {paidProducts} paid
          </p>
        </div>

        {/* Verified Revenue */}
        <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider gap-1">
              <span className="truncate">Verified Revenue</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            {loading && !cachedStats ? (
              <div className="h-7 sm:h-9 w-20 sm:w-28 bg-slate-100 rounded-lg animate-pulse my-1" />
            ) : (
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600">৳{totalVerifiedRevenue}</div>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight">
            From {verifiedOrdersCount} orders
          </p>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider gap-1">
              <span className="truncate">Pending Orders</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            {loading && !cachedStats ? (
              <div className="h-7 sm:h-9 w-14 sm:w-16 bg-slate-100 rounded-lg animate-pulse my-1" />
            ) : (
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-600">{pendingOrdersCount}</div>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight">
            Needs verification
          </p>
        </div>

        {/* Categories */}
        <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider gap-1">
              <span className="truncate">Categories</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            {loading && !cachedStats ? (
              <div className="h-7 sm:h-9 w-14 sm:w-16 bg-slate-100 rounded-lg animate-pulse my-1" />
            ) : (
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-cyan-700">{totalCategories}</div>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight">
            {activeCategoriesCount} active
          </p>
        </div>

      </div>

      {/* Recent Orders Table - Light Theme */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Customer Orders</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real purchases recorded in Firestore</p>
          </div>
          <Link to="/admin/orders" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {displayOrders.length === 0 ? (
          loading && !cachedStats ? (
            <div className="py-12 flex justify-center items-center">
              <div className="animate-pulse text-xs text-slate-400">Loading orders...</div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">
              No orders placed yet. Orders will appear here in real time.
            </div>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">#{o.orderNumber}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{o.customerName || o.userEmail}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">৳{o.total}</td>
                    <td className="py-3.5 px-4 text-slate-500">{o.paymentMethod || 'Manual'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        o.paymentStatus === 'verified'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : o.paymentStatus === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/admin/orders`} className="text-blue-600 hover:underline font-bold">
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

