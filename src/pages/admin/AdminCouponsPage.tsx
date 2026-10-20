import React, { useEffect, useState } from 'react';
import { 
  getCoupons, 
  createCoupon, 
  updateCoupon, 
  deleteCoupon,
  recordAuditLog 
} from '../../services/api';
import { Coupon } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Tag, Plus, Trash2, Edit2, Percent, DollarSign } from 'lucide-react';
import { TableSkeleton } from '../../components/ui/Skeletons';

export const AdminCouponsPage: React.FC = () => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [minSubtotal, setMinSubtotal] = useState(0);
  const [expiryDate, setExpiryDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const all = await getCoupons();
      setCoupons(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || discountValue <= 0) return;

    try {
      if (editingId) {
        await updateCoupon(editingId, {
          code: code.trim().toUpperCase(),
          discountType,
          discountValue: Number(discountValue),
          minSubtotal: Number(minSubtotal),
          expiryDate: expiryDate || undefined
        });
      } else {
        await createCoupon({
          code: code.trim().toUpperCase(),
          discountType,
          discountValue: Number(discountValue),
          minSubtotal: Number(minSubtotal),
          expiryDate: expiryDate || undefined,
          isActive: true
        });
      }

      setCode('');
      setDiscountValue(10);
      setMinSubtotal(0);
      setExpiryDate('');
      setEditingId(null);
      await loadCoupons();
    } catch (e: any) {
      alert("Error saving coupon: " + e.message);
    }
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (window.confirm(`Delete coupon "${couponCode}"?`)) {
      try {
        await deleteCoupon(id);
        setCoupons(coupons.filter(c => c.id !== id));
      } catch (e: any) {
        alert("Failed to delete coupon: " + e.message);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Discounts & Promo Coupons</h1>
        <p className="text-xs text-slate-500 mt-1">Manage promotional campaign vouchers for digital sales</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            {editingId ? "Edit Promo Code" : "Create New Coupon"}
          </h2>

          <form onSubmit={handleSave} className="space-y-4 text-xs text-slate-700">
            <div>
              <label className="font-semibold block mb-1 text-slate-800">Coupon Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. MURAD20, RAMADAN50"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold block mb-1 text-slate-800">Discount Type</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed BDT (৳)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Value ({discountType === 'percentage' ? '%' : '৳'}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-slate-800">Minimum Subtotal (BDT ৳)</label>
              <input
                type="number"
                min="0"
                value={minSubtotal}
                onChange={(e) => setMinSubtotal(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-slate-800">Expiry Date (Optional)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm active:scale-95 text-xs"
            >
              {editingId ? "Update Coupon" : "Create Coupon"}
            </button>
          </form>
        </div>

        {/* Existing Coupons Table */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Active Promo Codes ({coupons.length})
          </h2>

          {loading ? (
            <TableSkeleton rows={3} />
          ) : coupons.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">
              No coupons created yet. Add one to offer customer discounts.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="pb-3 px-2">Code</th>
                    <th className="pb-3 px-2">Discount</th>
                    <th className="pb-3 px-2">Min Order</th>
                    <th className="pb-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-2 font-mono font-bold text-slate-900 tracking-wider">{c.code}</td>
                      <td className="py-3.5 px-2 font-bold text-emerald-700">
                        {c.discountType === 'percentage' ? `${c.discountValue}%` : `৳${c.discountValue}`}
                      </td>
                      <td className="py-3.5 px-2 text-slate-600">৳{c.minSubtotal || 0}</td>
                      <td className="py-3.5 px-2 text-right">
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
