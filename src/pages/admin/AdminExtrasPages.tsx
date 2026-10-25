import React, { useEffect, useState } from 'react';
import { 
  getAllReviewsAdmin, 
  updateReviewStatus, 
  deleteReview,
  createAdminReview,
  getAllProductsAdmin,
  getAuditLogs 
} from '../../services/api';
import { Review, AuditLog, Product } from '../../types';
import { Check, X, Star, Trash2, Plus } from 'lucide-react';
import { TableSkeleton } from '../../components/ui/Skeletons';

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Review Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState<Review["status"]>('approved');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const [allRevs, allProds] = await Promise.all([
        getAllReviewsAdmin(),
        getAllProductsAdmin()
      ]);
      setReviews(allRevs);
      setProducts(allProds);
      if (allProds.length > 0 && !selectedProductId) {
        setSelectedProductId(allProds[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleStatusChange = async (id: string, status: Review["status"]) => {
    try {
      await updateReviewStatus(id, status);
      setReviews(reviews.map(r => r.id === id ? { ...r, status } : r));
    } catch (e: any) {
      alert("Failed to update review status: " + e.message);
    }
  };

  const handleDeleteReview = async (id: string, name: string) => {
    if (window.confirm(`Permanently delete review by "${name}"? This action cannot be undone.`)) {
      try {
        await deleteReview(id);
        setReviews(reviews.filter(r => r.id !== id));
      } catch (err: any) {
        alert("Failed to delete review: " + err.message);
      }
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !reviewerName.trim()) {
      alert("Reviewer name and comment are required.");
      return;
    }

    const selectedProduct = products.find(p => p.id === selectedProductId);

    setSubmittingReview(true);
    try {
      await createAdminReview({
        productId: selectedProductId || 'general-review',
        productName: selectedProduct?.name || 'Vyrqonix Asset',
        userId: 'admin-created-review',
        userName: reviewerName.trim(),
        userEmail: reviewerEmail.trim() || 'customer@example.com',
        rating: Number(rating),
        comment: comment.trim(),
        status: reviewStatus,
        isVerifiedPurchase: true
      });

      setShowAddModal(false);
      setReviewerName('');
      setReviewerEmail('');
      setComment('');
      setRating(5);
      await loadReviews();
    } catch (err: any) {
      alert("Failed to create review: " + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Reviews Moderation</h1>
          <p className="text-xs text-slate-500 mt-1">Approve authentic reviews, create testimonials, and delete spam</p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Review</span>
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : reviews.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400 shadow-xs">
          No customer reviews submitted yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Rating & Review</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Moderation & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{r.userName}</p>
                      <p className="text-[11px] text-slate-400">{r.userEmail}</p>
                    </td>

                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {r.productName}
                    </td>

                    <td className="px-6 py-4 space-y-1">
                      <div className="flex text-amber-400">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-slate-600 italic">{r.comment}</p>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : r.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.status !== 'approved' && (
                          <button
                            onClick={() => handleStatusChange(r.id, 'approved')}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                            title="Approve Review"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {r.status !== 'rejected' && (
                          <button
                            onClick={() => handleStatusChange(r.id, 'rejected')}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                            title="Reject / Hide"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReview(r.id, r.userName)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                          title="Delete Review Permanently"
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
      )}

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Customer Review</h3>
                  <p className="text-[11px] text-slate-500">Record a verified review or testimonial</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-800">Select Product *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-800">Reviewer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-800">Reviewer Email</label>
                  <input
                    type="email"
                    placeholder="tanvir@example.com"
                    value={reviewerEmail}
                    onChange={(e) => setReviewerEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-800">Rating (Stars) *</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-amber-600"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                    <option value={3}>⭐⭐⭐ (3 Stars)</option>
                    <option value={2}>⭐⭐ (2 Stars)</option>
                    <option value={1}>⭐ (1 Star)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-800">Status</label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  >
                    <option value="approved">Approved (Live)</option>
                    <option value="pending">Pending Moderation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">Review Feedback / Comment *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Excellent design templates! Super easy to customize in Photoshop..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
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
                  disabled={submittingReview}
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm text-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingReview ? "Saving..." : "Add Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminDownloadAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs(30).then((all) => {
      setLogs(all);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System & Admin Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-1">Immutable activity tracking for sensitive operations</p>
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : logs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400 shadow-xs">
          No audit logs recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Admin Performer</th>
                  <th className="px-6 py-4">Target Entity</th>
                  <th className="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{log.action}</td>
                    <td className="px-6 py-4 text-slate-600">{log.adminEmail || log.adminUid}</td>
                    <td className="px-6 py-4 text-slate-500">[{log.targetType}] {log.targetId}</td>
                    <td className="px-6 py-4 text-right text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
