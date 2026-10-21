import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserEntitlements, recordDownloadEvent, getProductById } from '../../services/api';
import { DownloadEntitlement, Product } from '../../types';
import { Download, FileText, CheckCircle2, AlertCircle, KeyRound, Copy, Check } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProductCardSkeleton } from '../../components/ui/Skeletons';

export const DownloadsPage: React.FC = () => {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<DownloadEntitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntitlements = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const ents = await getUserEntitlements(user.uid);
        setEntitlements(ents);
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
      const product = await getProductById(entitlement.productId);
      if (!product) {
        alert("Product record could not be found.");
        return;
      }

      // 2. Audit the download event in Firestore
      await recordDownloadEvent(entitlement.id, entitlement.productId, user?.uid || '');

      // 3. Open appropriate link
      if (product.deliveryMethod === 'subscription_access') {
        if (product.googleDriveUrl) {
          window.open(product.googleDriveUrl, '_blank');
        } else {
          alert("সাবস্ক্রিপশন তথ্য: " + (product.subscriptionInstructions || "আপনার সাবস্ক্রিপশন অ্যাক্টিভেশন তথ্য আপনার ইমেইল বা হোয়াটসঅ্যাপে পাঠানো হয়েছে।"));
        }
      } else if (product.deliveryMethod === 'google_drive' && product.googleDriveUrl) {
        window.open(product.googleDriveUrl, '_blank');
      } else if (product.fileMetadata?.downloadUrl) {
        window.open(product.fileMetadata.downloadUrl, '_blank');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Digital Downloads Library</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Access and re-download your purchased assets and claimed freebies at any time
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : entitlements.length === 0 ? (
        <EmptyState
          icon={<Download className="w-8 h-8 text-blue-600" />}
          title="No digital downloads yet"
          description="You haven't claimed any freebies or completed any purchases yet."
          actionLabel="Explore Marketplace"
          actionHref="/shop"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {entitlements.map((ent) => (
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
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${
                    ent.isFree ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {ent.isFree ? 'Free Claim' : 'Verified Purchase'}
                  </span>
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

              {/* ZIP Extraction Password chip if applicable */}
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
                        <Copy className="w-3 h-3 text-purple-600" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  Downloaded: {ent.downloadCount || 0} times
                </span>
                <button
                  onClick={() => handleDownloadFile(ent)}
                  disabled={downloadingId === ent.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingId === ent.id ? "Opening..." : "Download File"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
