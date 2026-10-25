import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  getAllProductsAdmin, 
  deleteProduct, 
  updateProduct,
  recordAuditLog 
} from '../../services/api';
import { Product } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, Edit2, Trash2, HardDrive, ExternalLink, Sparkles } from 'lucide-react';
import { TableSkeleton } from '../../components/ui/Skeletons';

const ADMIN_PRODUCTS_CACHE_KEY = 'mg_admin_products_cache_v1';

export const AdminProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_PRODUCTS_CACHE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem(ADMIN_PRODUCTS_CACHE_KEY));
  const [search, setSearch] = useState('');

  const loadProducts = async () => {
    try {
      const prods = await getAllProductsAdmin();
      setProducts(prods);
      try {
        localStorage.setItem(ADMIN_PRODUCTS_CACHE_KEY, JSON.stringify(prods));
      } catch {}
    } catch (e) {
      console.error("Error loading products:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete product "${name}"? This action cannot be undone.`)) {
      try {
        await deleteProduct(id);
        await recordAuditLog({
          adminUid: user?.uid || '',
          adminEmail: user?.email || '',
          action: 'DELETE_PRODUCT',
          targetType: 'PRODUCT',
          targetId: id,
          details: { name }
        });
        setProducts(products.filter(p => p.id !== id));
      } catch (err: any) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const nextActive = !product.isActive;
      await updateProduct(product.id, { isActive: nextActive });
      setProducts(products.map(p => p.id === product.id ? { ...p, isActive: nextActive } : p));
    } catch (e: any) {
      alert("Failed to update status: " + e.message);
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.categoryName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Products ({products.length})</h1>
          <p className="text-xs text-slate-500 mt-1">Manage files, formats, pricing, and Google Drive links</p>
        </div>

        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Filter / Search Bar - Light Theme */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Filter products by title or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full"
        />
      </div>

      {/* Products Display (Responsive: Mobile Cards + Desktop Table) */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 shadow-xs">
          No products found. Click "Add Product" to create your first digital asset.
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* ================= 1. MOBILE & TABLET CARDS VIEW (Clean & No Horizontal Scroll) ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 lg:hidden">
            {filtered.map((prod) => (
              <div 
                key={prod.id} 
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                {/* Header: Thumbnail + Title + Price */}
                <div className="flex items-start gap-3">
                  <img
                    src={prod.thumbnail || '/logo.png'}
                    alt={prod.name}
                    className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link 
                        to={`/product/${prod.slug}`} 
                        target="_blank" 
                        className="font-bold text-slate-900 hover:text-blue-600 text-xs sm:text-sm line-clamp-2 leading-snug flex items-center gap-1"
                      >
                        <span>{prod.name}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                      </Link>
                      <div className="shrink-0 text-right">
                        {prod.isFree ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                            FREE
                          </span>
                        ) : (
                          <span className="font-black text-slate-900 text-sm">
                            ৳{prod.price}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {prod.categoryName || 'General'}
                      </span>
                      <span>•</span>
                      <span>{prod.purchaseCount || 0} orders</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Source & Formats */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {prod.deliveryMethod === 'subscription_access' ? (
                      <span className="text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1 font-bold">
                        <Sparkles className="w-3 h-3 text-purple-600" /> Subscription
                      </span>
                    ) : prod.deliveryMethod === 'google_drive' ? (
                      <span className="text-cyan-700 bg-cyan-50 border border-cyan-200/80 px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1 font-bold">
                        <ExternalLink className="w-3 h-3" /> Drive
                      </span>
                    ) : (
                      <span className="text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1 font-bold">
                        <HardDrive className="w-3 h-3" /> Storage
                      </span>
                    )}

                    {prod.formats?.slice(0, 3).map((f, i) => (
                      <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {f}
                      </span>
                    ))}
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    DL: {prod.downloadCount || 0}
                  </span>
                </div>

                {/* Bottom Row: Quick Toggle Status + Edit / Delete */}
                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {/* Status Toggle */}
                    <button
                      onClick={() => handleToggleActive(prod)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        prod.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                      title="Click to toggle Active status"
                    >
                      {prod.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/admin/products/${prod.id}`}
                      className="px-2.5 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(prod.id, prod.name)}
                      className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 rounded-xl transition-colors cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ================= 2. DESKTOP OPTIMIZED TABLE (Compact & Fits on Screen) ================= */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-3 xl:px-4 xl:py-3.5">Product</th>
                    <th className="px-3 py-3 xl:px-3.5 xl:py-3.5">Category</th>
                    <th className="px-3 py-3 xl:px-3.5 xl:py-3.5 whitespace-nowrap">Price</th>
                    <th className="px-3 py-3 xl:px-3.5 xl:py-3.5 whitespace-nowrap">Delivery</th>
                    <th className="px-3 py-3 xl:px-3.5 xl:py-3.5 whitespace-nowrap">Sales / DL</th>
                    <th className="px-3 py-3 xl:px-3.5 xl:py-3.5 whitespace-nowrap">Status</th>
                    <th className="px-3.5 py-3 xl:px-4 xl:py-3.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Thumbnail + Name + Formats */}
                      <td className="px-3.5 py-3 xl:px-4 xl:py-3.5 min-w-[200px] max-w-[260px]">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.thumbnail || '/logo.png'}
                            alt={prod.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <Link 
                              to={`/product/${prod.slug}`} 
                              target="_blank" 
                              className="font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1 group"
                            >
                              <span className="truncate max-w-[190px] text-xs">{prod.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0" />
                            </Link>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {prod.formats?.slice(0, 2).map((f, i) => (
                                <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-3 xl:px-3.5 xl:py-3.5 text-slate-600 font-medium whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                          {prod.categoryName || '—'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-3 py-3 xl:px-3.5 xl:py-3.5 whitespace-nowrap">
                        {prod.isFree ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                            FREE
                          </span>
                        ) : (
                          <span className="font-black text-slate-900 text-xs">
                            ৳{prod.price}
                          </span>
                        )}
                      </td>

                      {/* Delivery Source */}
                      <td className="px-3 py-3 xl:px-3.5 xl:py-3.5 whitespace-nowrap">
                        {prod.deliveryMethod === 'subscription_access' ? (
                          <span className="text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-lg text-[11px] flex items-center gap-1 font-bold inline-flex">
                            <Sparkles className="w-3 h-3 text-purple-600" /> Subscription
                          </span>
                        ) : prod.deliveryMethod === 'google_drive' ? (
                          <span className="text-cyan-700 bg-cyan-50 border border-cyan-200/80 px-2 py-0.5 rounded-lg text-[11px] flex items-center gap-1 font-semibold inline-flex">
                            <ExternalLink className="w-3 h-3" /> Drive
                          </span>
                        ) : (
                          <span className="text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-lg text-[11px] flex items-center gap-1 font-semibold inline-flex">
                            <HardDrive className="w-3 h-3" /> Storage
                          </span>
                        )}
                      </td>

                      {/* Sales / Downloads */}
                      <td className="px-3 py-3 xl:px-3.5 xl:py-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                        <span className="text-slate-900 font-semibold">{prod.purchaseCount || 0}</span> orders • <span className="text-slate-900 font-semibold">{prod.downloadCount || 0}</span> dl
                      </td>

                      {/* Status Toggle */}
                      <td className="px-3 py-3 xl:px-3.5 xl:py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(prod)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            prod.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Click to toggle Active status"
                        >
                          {prod.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-3.5 py-3 xl:px-4 xl:py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/products/${prod.id}`}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(prod.id, prod.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
