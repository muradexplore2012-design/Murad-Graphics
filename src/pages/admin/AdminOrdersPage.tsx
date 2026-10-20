import React, { useEffect, useState } from 'react';
import { 
  getAllOrdersAdmin, 
  updateOrderStatus,
  deleteOrder,
  createAdminManualOrder,
  recordAuditLog 
} from '../../services/api';
import { Order, OrderPaymentStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ShoppingBag, 
  Search, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Filter, 
  ExternalLink,
  Trash2,
  Plus,
  AlertCircle
} from 'lucide-react';
import { TableSkeleton } from '../../components/ui/Skeletons';

export const AdminOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Manual Order Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualTotal, setManualTotal] = useState(0);
  const [manualMethod, setManualMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'manual'>('bKash');
  const [manualTrx, setManualTrx] = useState('');
  const [manualStatus, setManualStatus] = useState<OrderPaymentStatus>('verified');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const all = await getAllOrdersAdmin();
      setOrders(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (order: Order, newStatus: OrderPaymentStatus) => {
    if (order.paymentStatus === newStatus) return;

    if (window.confirm(`Change order #${order.orderNumber} status to "${newStatus}"? If changed to "verified", digital downloads will automatically unlock for customer ${order.userEmail}.`)) {
      setUpdatingId(order.id);
      try {
        await updateOrderStatus(order.id, newStatus);
        await recordAuditLog({
          adminUid: user?.uid || '',
          adminEmail: user?.email || '',
          action: 'UPDATE_ORDER_STATUS',
          targetType: 'ORDER',
          targetId: order.id,
          details: { orderNumber: order.orderNumber, from: order.paymentStatus, to: newStatus }
        });
        setOrders(orders.map(o => o.id === order.id ? { ...o, paymentStatus: newStatus } : o));
      } catch (e: any) {
        alert("Failed to update status: " + e.message);
      } finally {
        setUpdatingId(null);
      }
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (window.confirm(`Are you sure you want to permanently delete Order #${orderNumber}? This action cannot be undone.`)) {
      try {
        await deleteOrder(orderId);
        await recordAuditLog({
          adminUid: user?.uid || '',
          adminEmail: user?.email || '',
          action: 'DELETE_ORDER',
          targetType: 'ORDER',
          targetId: orderId,
          details: { orderNumber }
        });
        setOrders(orders.filter(o => o.id !== orderId));
      } catch (err: any) {
        alert("Failed to delete order: " + err.message);
      }
    }
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim()) {
      alert("Customer email is required.");
      return;
    }

    setSubmittingOrder(true);
    try {
      const orderId = await createAdminManualOrder({
        userEmail: manualEmail.trim().toLowerCase(),
        customerName: manualName.trim() || 'Direct Customer',
        customerPhone: manualPhone.trim(),
        total: Number(manualTotal) || 0,
        subtotal: Number(manualTotal) || 0,
        paymentMethod: manualMethod,
        transactionId: manualTrx.trim() || `MANUAL-${Date.now().toString().slice(-4)}`,
        paymentStatus: manualStatus,
        items: []
      });

      await recordAuditLog({
        adminUid: user?.uid || '',
        adminEmail: user?.email || '',
        action: 'CREATE_MANUAL_ORDER',
        targetType: 'ORDER',
        targetId: orderId,
        details: { customerEmail: manualEmail, amount: manualTotal }
      });

      setShowAddModal(false);
      setManualEmail('');
      setManualName('');
      setManualPhone('');
      setManualTotal(0);
      setManualTrx('');
      await loadOrders();
    } catch (err: any) {
      alert("Failed to create manual order: " + err.message);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const filtered = orders.filter(o => {
    if (statusFilter !== 'all' && o.paymentStatus !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchNum = o.orderNumber?.toLowerCase().includes(q);
      const matchEmail = o.userEmail?.toLowerCase().includes(q);
      const matchTrx = o.transactionId?.toLowerCase().includes(q);
      if (!matchNum && !matchEmail && !matchTrx) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Orders & Purchases ({orders.length})</h1>
          <p className="text-xs text-slate-500 mt-1">Verify mobile payments (bKash/Nagad/Rocket), add manual sales, and delete records</p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Manual Order</span>
        </button>
      </div>

      {/* Filter and search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-3 flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by order number, customer email, or TrxID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 font-semibold focus:outline-none"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending Verification</option>
            <option value="verified">Verified (Active)</option>
            <option value="failed">Failed / Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table - Light Theme */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400 shadow-xs">
          No orders found matching the filter criteria.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Order / Time</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Payment & Trx</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status & Verification</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="font-mono font-bold text-slate-900 block">#{order.orderNumber}</span>
                        <span className="text-[11px] text-slate-400">{new Date(order.createdAt).toLocaleString()}</span>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {order.items?.length || 0} product{order.items?.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{order.customerName}</p>
                      <p className="text-[11px] text-slate-500">{order.userEmail}</p>
                      {order.customerPhone && (
                        <p className="text-[11px] text-blue-600 font-mono mt-0.5">{order.customerPhone}</p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold text-slate-700 text-[10px] uppercase block w-fit">
                        {order.paymentMethod || 'Manual'}
                      </span>
                      <p className="text-[11px] font-mono text-emerald-700 font-bold mt-1">
                        TrxID: {order.transactionId || 'None'}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-900">৳{order.total}</span>
                      {order.discount > 0 && (
                        <span className="text-[10px] text-emerald-600 font-bold block">(-৳{order.discount} coupon)</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          disabled={updatingId === order.id}
                          value={order.paymentStatus}
                          onChange={(e) => handleStatusChange(order, e.target.value as OrderPaymentStatus)}
                          className={`rounded-xl px-2.5 py-1.5 text-xs font-bold uppercase focus:outline-none transition-all ${
                            order.paymentStatus === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : order.paymentStatus === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <option value="pending" className="bg-white text-amber-700">PENDING</option>
                          <option value="verified" className="bg-white text-emerald-700">VERIFIED (GRANT DOWNLOAD)</option>
                          <option value="failed" className="bg-white text-rose-700">FAILED / CANCELLED</option>
                        </select>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                        className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                        title="Delete Order Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-[11px] font-semibold">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Order Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create Manual Order</h3>
                  <p className="text-[11px] text-slate-500">Record direct or offline customer payments</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-800">Customer Email *</label>
                <input
                  type="email"
                  required
                  placeholder="customer@example.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-800">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-800">Phone Number</label>
                  <input
                    type="text"
                    placeholder="017xxxxxxxx"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-800">Total Amount (৳) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={manualTotal}
                    onChange={(e) => setManualTotal(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-800">Payment Method</label>
                  <select
                    value={manualMethod}
                    onChange={(e) => setManualMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="manual">Manual / Cash</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-800">Transaction ID (TrxID)</label>
                  <input
                    type="text"
                    placeholder="e.g. BKL789456"
                    value={manualTrx}
                    onChange={(e) => setManualTrx(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-800">Status</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  >
                    <option value="verified">Verified (Active)</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm text-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingOrder ? "Saving..." : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
