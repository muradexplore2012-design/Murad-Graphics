import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserEntitlements, recordDownloadEvent, getProductById, getUserOrders } from '../../services/api';
import { DownloadEntitlement, Product } from '../../types';
import { Download, KeyRound, Copy, Check, X, FolderDown } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';

export const DownloadsPage: React.FC = () => {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<DownloadEntitlement[]>([]);
  const [productCache, setProductCache] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal for downloadable file ZIP Password
  const [activeDownloadModal, setActiveDownloadModal] = useState<{
    productName: string;
    zipPassword?: string;
    downloadUrl?: string;
  } | null>(null);

  useEffect(() => {
    const fetchEntitlements = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [ents, orders] = await Promise.all([
          getUserEntitlements(user.uid),
          getUserOrders(user.uid).catch(() => [])
        ]);

        const combined = [...ents];
        const existingProductIds = new Set(ents.map(e => e.productId));

        // Fallback: If any verified order has items not yet in entitlements, include them
        orders.forEach(order => {
          if (order.paymentStatus === 'verified' || order.subtotal === 0) {
            order.items?.forEach(item => {
              if (!existingProductIds.has(item.productId)) {
                existingProductIds.add(item.productId);
                combined.push({
                  id: `order_${order.id}_${item.productId}`,
                  userId: user.uid,
                  userEmail: user.email || '',
                  productId: item.productId,
                  productName: item.name,
                  productSlug: item.slug,
                  thumbnail: item.thumbnail,
                  orderId: order.id,
                  isFree: item.isFree,
                  zipPassword: item.zipPassword || '',
                  deliveryMethod: item.deliveryMethod,
                  accessGrantedAt: order.createdAt,
                  downloadCount: 0,
                  status: 'active'
                });
              }
            });
          }
        });

        setEntitlements(combined);

        // Fetch products in background to accurately resolve delivery method & links
        const uniqueProductIds = Array.from(new Set(combined.map(e => e.productId)));
        const productsList = await Promise.all(
          uniqueProductIds.map(id => getProductById(id).catch(() => null))
        );
        const pMap: Record<string, Product> = {};
        productsList.forEach(p => {
          if (p) pMap[p.id] = p;
        });
        setProductCache(pMap);
      } catch (err) {
        console.error("Error loading entitlements:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEntitlements();
  }, [user]);

  const handleDownloadFile = async (entitlement: DownloadEntitlement) => {
    setDownloadingId(entitlement.id);
    try {
      // 1. Fetch real product to get the download file / google drive link
      const product = productCache[entitlement.productId] || await getProductById(entitlement.productId);
      if (!product) {
        alert("Product record could not be found.");
        return;
      }

      // 2. Audit the download event in Firestore
      await recordDownloadEvent(entitlement.id, entitlement.productId, user?.uid || '');

      const zipPass = entitlement.zipPassword || product.zipPassword || '';
      let targetUrl = '';

      if (product.deliveryMethod === 'google_drive' && product.googleDriveUrl) {
        targetUrl = product.googleDriveUrl;
        window.open(product.googleDriveUrl, '_blank');
        setActiveDownloadModal({
          productName: product.name,
          zipPassword: zipPass,
          downloadUrl: targetUrl
        });
      } else if (product.fileMetadata?.downloadUrl) {
        targetUrl = product.fileMetadata.downloadUrl;
        window.open(product.fileMetadata.downloadUrl, '_blank');
        setActiveDownloadModal({
          productName: product.name,
          zipPassword: zipPass,
          downloadUrl: targetUrl
        });
      } else {
        alert("Digital download is being refreshed. Please contact support if this persists.");
      }
    } catch (e: any) {
      alert("Error initiating file download: " + e.message);
    } finally {
      setDownloadingId(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Please Sign In</h2>
        <p className="text-xs text-slate-500 mt-2">Sign in to access your digital downloads library.</p>
        <Link to="/login" className="mt-4 inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold">
          Login Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Digital Library</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access and re-download your purchased assets and design files
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : entitlements.length === 0 ? (
        <EmptyState
          icon={<FolderDown className="w-8 h-8 text-blue-600" />}
          title="No digital items found"
          description="You haven't claimed any freebies or completed any purchases yet."
          actionLabel="Explore Marketplace"
          actionHref="/shop"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {entitlements.map((ent) => {
            return (
              <div 
                key={ent.id} 
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex gap-4">
                  <img
                    src={ent.thumbnail || '/logo.png'}
                    alt={ent.productName}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ent.isFree ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {ent.isFree ? 'Free Claim' : 'Verified Purchase'}
                      </span>
                    </div>

                    <Link to={`/product/${ent.productSlug}`}>
                      <h3 className="font-bold text-slate-900 text-sm hover:text-blue-600 line-clamp-2">
                        {ent.productName}
                      </h3>
                    </Link>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Added: {new Date(ent.accessGrantedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* ZIP Extraction Password chip */}
                {ent.zipPassword && (
                  <div className="mt-3 p-2.5 bg-purple-50 border border-purple-200/80 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-purple-900 font-semibold text-[11px]">
                      <KeyRound className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>ZIP Pass:</span>
                      <span className="font-mono font-black bg-white px-2 py-0.5 rounded border border-purple-200 text-[#7a00ea] tracking-wider">
                        {ent.zipPassword}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(ent.zipPassword || '');
                        setCopiedId(ent.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-950 flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-md border border-purple-200 shadow-2xs active:scale-95 transition-all"
                    >
                      {copiedId === ent.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
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
                )}

                {/* Bottom Action Area */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Downloaded: {ent.downloadCount || 0} times
                  </span>
                  <button
                    onClick={() => handleDownloadFile(ent)}
                    disabled={downloadingId === ent.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingId === ent.id ? "Opening..." : "Download File"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= FILE DOWNLOAD / ZIP PASSWORD POPUP MODAL ================= */}
      {activeDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative space-y-5 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setActiveDownloadModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Icon & Title */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-xs">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                ডাউনলোড শুরু হয়েছে! 🎉
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {activeDownloadModal.productName}
              </p>
            </div>

            {/* ZIP Password Notice (If Product has Password) */}
            {activeDownloadModal.zipPassword ? (
              <div className="space-y-3 p-4 bg-purple-50/80 border border-purple-200/90 rounded-2xl">
                <div className="flex items-start gap-2.5">
                  <KeyRound className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    ফাইলটি <strong className="text-purple-950 font-black">ZIP</strong> আকারে রয়েছে। ফাইলটি ডাউনলোড করার পর আনজিপ (Unzip/Extract) করতে নিচের <strong className="text-purple-950 font-black">পাসওয়ার্ডটি</strong> প্রয়োজন হবে:
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-purple-200 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Unzip Password</span>
                    <span className="font-mono text-2xl font-black text-[#7a00ea] tracking-widest select-all">
                      {activeDownloadModal.zipPassword}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeDownloadModal.zipPassword || '');
                      setCopiedId('modal_copied');
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
                  >
                    {copiedId === 'modal_copied' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>পাসওয়ার্ড কপি</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 text-center">
                ফাইলটি আপনার ডিভাইসে ডাউনলোড হচ্ছে। কোনো সমস্যা হলে নিচের বাটন দিয়ে পুনরায় ডাউনলোড করতে পারেন।
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              {activeDownloadModal.downloadUrl && (
                <button
                  type="button"
                  onClick={() => window.open(activeDownloadModal.downloadUrl, '_blank')}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>পুনরায় ডাউনলোড লিংক খুলুন</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveDownloadModal(null)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                ঠিক আছে, বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
