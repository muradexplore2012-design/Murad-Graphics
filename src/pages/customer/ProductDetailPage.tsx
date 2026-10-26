import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Download, 
  ShoppingCart, 
  Heart, 
  CheckCircle2, 
  Mail,
  MessageSquare,
  Search,
  X,
  Star,
  ShieldCheck,
  Check,
  Sparkles,
  Layers,
  HardDrive,
  ExternalLink,
  KeyRound,
  Copy,
  ArrowRight
} from 'lucide-react';
import { 
  getProductBySlug, 
  getProducts, 
  grantFreeEntitlement, 
  checkUserEntitlement, 
  recordDownloadEvent,
  getProductReviews,
  createReview 
} from '../../services/api';
import { Product, Review } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { ProductCard } from '../../components/ui/ProductCard';
import { EmptyState } from '../../components/ui/EmptyState';
import confetti from 'canvas-confetti';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [hasEntitlement, setHasEntitlement] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [copiedZipPass, setCopiedZipPass] = useState(false);

  // Interactive Product States (Matching user screenshot)
  const [selectedPlan, setSelectedPlan] = useState<string>('1 Month');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'description' | 'additional' | 'reviews'>('description');
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);

  // Review form state
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [slug]);

  useEffect(() => {
    let isMounted = true;
    const loadProduct = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const prod = await getProductBySlug(slug);
        if (!isMounted) return;
        setProduct(prod);

        if (prod) {
          setSelectedImage(prod.thumbnail || (prod.previews && prod.previews[0]) || '/logo.png');

          // Check entitlement if user is logged in (non-blocking)
          if (user) {
            checkUserEntitlement(user.uid, prod.id).then((entitled) => {
              if (isMounted) setHasEntitlement(entitled);
            }).catch(() => {});
          }

          // Fetch related products in same category (non-blocking)
          getProducts({ categoryId: prod.categoryId, limitCount: 4 }).then((related) => {
            if (isMounted) setRelatedProducts(related.filter(r => r.id !== prod.id));
          }).catch(() => {});

          // Fetch reviews (non-blocking)
          getProductReviews(prod.id).then((revs) => {
            if (isMounted) setReviews(revs);
          }).catch(() => {});
        }
      } catch (err) {
        console.error("Error loading product detail:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [slug, user]);

  const handleFreeDownload = async () => {
    if (!product) return;
    if (!user) {
      navigate('/login?redirect=/product/' + product.slug);
      return;
    }

    setDownloading(true);
    try {
      await grantFreeEntitlement({ uid: user.uid, email: user.email || '' }, product);
      setHasEntitlement(true);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });

      if (product.deliveryMethod === 'google_drive' && product.googleDriveUrl) {
        window.open(product.googleDriveUrl, '_blank');
      } else if (product.fileMetadata?.downloadUrl) {
        window.open(product.fileMetadata.downloadUrl, '_blank');
      }

      setDownloadSuccessMessage('Item claimed! It has also been saved to your Downloads Library.');
      setShowDownloadModal(true);
    } catch (e: any) {
      alert("Error processing free download: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  const handlePaidDownloadAccess = async () => {
    if (!product) return;
    if (!user) {
      navigate('/login?redirect=/product/' + product.slug);
      return;
    }

    setDownloading(true);
    try {
      await recordDownloadEvent('direct_entitlement', product.id, user.uid);
      
      if (product.deliveryMethod === 'subscription_access') {
        if (product.googleDriveUrl) {
          window.open(product.googleDriveUrl, '_blank');
        } else {
          alert("Subscription Activation: " + (product.subscriptionInstructions || "Details have been sent to your registered email / WhatsApp."));
        }
      } else if (product.deliveryMethod === 'google_drive' && product.googleDriveUrl) {
        window.open(product.googleDriveUrl, '_blank');
      } else if (product.fileMetadata?.downloadUrl) {
        window.open(product.fileMetadata.downloadUrl, '_blank');
      } else {
        alert("The download link is currently being prepared by the administrator.");
      }

      setShowDownloadModal(true);
    } catch (e: any) {
      alert("Failed to initiate file download: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product || !commentInput.trim()) return;

    setReviewSubmitting(true);
    try {
      await createReview({
        productId: product.id,
        productName: product.name,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Customer',
        userEmail: user.email || '',
        rating: ratingInput,
        comment: commentInput.trim(),
        isVerifiedPurchase: hasEntitlement
      });
      setReviewSubmitted(true);
      setCommentInput('');
      const revs = await getProductReviews(product.id);
      setReviews(revs);
    } catch (e: any) {
      alert("Failed to post review: " + e.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square w-full bg-slate-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-6 bg-slate-200 rounded w-1/4" />
            <div className="h-32 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <EmptyState
          title="Product Not Found"
          description="The requested digital resource does not exist or may have been archived."
          actionLabel="Return to Catalog"
          actionHref="/shop"
        />
      </div>
    );
  }

  const isFavorited = isInWishlist(product.id);
  const inCart = isInCart(product.id);
  const allImages = [product.thumbnail, ...(product.previews || [])].filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Breadcrumb Navigation (Matching Reference Screenshot) */}
      <nav className="text-xs text-slate-500 flex items-center gap-2">
        <Link to="/" className="hover:text-purple-600 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-purple-600 transition-colors">All Products</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate max-w-sm sm:max-w-md">{product.name}</span>
      </nav>

      {/* ================= MAIN PRODUCT DETAIL SECTION (MATCHING SCREENSHOT) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* ================= LEFT COLUMN: MAIN PRODUCT POSTER & GALLERY ================= */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Main Poster Container (Exact 1080:1080 Square 1:1 Aspect Ratio Matching Photo 2) */}
          <div className="relative group rounded-3xl border border-slate-200/90 overflow-hidden bg-slate-900 shadow-sm aspect-square w-full flex items-center justify-center">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />

            {/* Magnifying Glass Zoom Button */}
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="absolute top-4 right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-10 border border-slate-200/80 cursor-pointer"
              title="Click to Zoom Poster"
              aria-label="Zoom poster"
            >
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-700" />
            </button>

            {product.isFree && (
              <span className="absolute top-4 left-4 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-md tracking-wider z-10">
                FREE DOWNLOAD
              </span>
            )}
          </div>

          {/* Thumbnails row if multiple preview images exist */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === img ? 'border-purple-600 ring-4 ring-purple-100 shadow-sm' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail preview" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN: DETAILS, PRICE, ACTIONS & TRUST BADGES ================= */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* Product Title & Wishlist */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-black text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>
            <button
              onClick={() => toggleWishlist(product)}
              className={`p-2.5 rounded-2xl border transition-all shrink-0 ${
                isFavorited ? 'border-rose-200 bg-rose-50 text-rose-500' : 'border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600'
              }`}
              title="Add to Wishlist"
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-500' : ''}`} />
            </button>
          </div>

          {/* Price Range & In Stock Badge (Matching Screenshot) */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl sm:text-3xl font-black text-[#7a00ea] tracking-tight">
              {product.isFree ? (
                <span className="text-emerald-600">FREE</span>
              ) : product.comparePrice ? (
                `${product.price.toLocaleString()}৳ – ${product.comparePrice.toLocaleString()}৳`
              ) : (
                `${product.price.toLocaleString()}৳`
              )}
            </span>
            <span className="px-3 py-1 rounded-md bg-purple-100/90 text-purple-700 font-bold text-xs tracking-wide">
              In Stock
            </span>
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {product.shortDescription}
            </p>
          )}


          {/* Plan Selector (Matching Screenshot: 1 Month, 6 Months, 1 Year) */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Plan</label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {['1 Month', '6 Months', '1 Year'].map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    selectedPlan === plan
                      ? 'bg-purple-50 text-purple-700 border-2 border-purple-600 shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {plan}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Stepper & Add to Cart / Buy Now (Matching Screenshot) */}
          <div className="pt-2">
            {hasEntitlement ? (
              <div className="space-y-3">
                {product.deliveryMethod === 'subscription_access' ? (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-purple-950 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-purple-900">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>সাবস্ক্রিপশন অর্ডার সম্পন্ন হয়েছে</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {product.subscriptionInstructions || "আপনার সাবস্ক্রিপশন ইনভাইটেশন লিংক / লগইন অ্যাক্সেস আপনার ইমেইল বা হোয়াটসঅ্যাপে পাঠানো হচ্ছে।"}
                    </p>
                    {product.googleDriveUrl && (
                      <a
                        href={product.googleDriveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>ইনভাইটেশন লিংক খুলুন</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>You have purchased access to this product. Download your source files anytime below:</span>
                    </div>
                    <button
                      onClick={handlePaidDownloadAccess}
                      disabled={downloading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>{downloading ? "Preparing file..." : "Download Source File"}</span>
                    </button>
                  </>
                )}
              </div>
            ) : product.isFree ? (
              <button
                onClick={handleFreeDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? "Processing..." : "Download Free Resource"}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 w-full">
                {/* Quantity Stepper: [-] 1 [+] */}
                <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden h-11 sm:h-12 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 sm:w-10 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-sm sm:text-base transition-colors"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-7 sm:w-10 text-center font-bold text-xs sm:text-sm text-slate-900 select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 sm:w-10 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-sm sm:text-base transition-colors"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart Button (Purple) */}
                <button
                  onClick={() => addToCart(product)}
                  disabled={inCart}
                  className={`flex-1 h-11 sm:h-12 px-2.5 sm:px-6 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 cursor-pointer whitespace-nowrap min-w-0 ${
                    inCart 
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                      : 'bg-[#7a00ea] hover:bg-[#6c00d4] text-white shadow-purple-600/20'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">{inCart ? 'Item in Cart' : 'Add to Cart'}</span>
                </button>

                {/* Buy Now Button (Black) */}
                <button
                  onClick={() => {
                    addToCart(product);
                    navigate('/checkout');
                  }}
                  className="flex-1 h-11 sm:h-12 px-3 sm:px-6 rounded-xl bg-black hover:bg-slate-900 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center active:scale-95 cursor-pointer whitespace-nowrap min-w-0"
                >
                  <span className="truncate">Buy Now</span>
                </button>
              </div>
            )}

            {downloadSuccessMessage && (
              <div className="mt-3 p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl text-center">
                {downloadSuccessMessage}
              </div>
            )}
          </div>

          {/* Trust Badges Box (Matching Screenshot: 100% Genuine | Digital Delivery | Priority Support) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-purple-600 stroke-[2.5]" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-slate-900 leading-tight">100% Genuine</h5>
                <p className="text-[10px] text-slate-500 mt-0.5">Fully Authentic Product</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-purple-600 stroke-[2.5]" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-slate-900 leading-tight">Digital Delivery</h5>
                <p className="text-[10px] text-slate-500 mt-0.5">Instant Email Delivery</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-purple-600 stroke-[2.5]" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-slate-900 leading-tight">Priority Support</h5>
                <p className="text-[10px] text-slate-500 mt-0.5">Remote Live Assistance</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ================= BOTTOM TABS SECTION (MATCHING SCREENSHOT) ================= */}
      <div className="space-y-6 pt-4">
        
        {/* Tab Buttons (Description | Additional information | Reviews) */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('description')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'description'
                ? 'bg-[#7a00ea] text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Description
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('additional')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'additional'
                ? 'bg-[#7a00ea] text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Additional information
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-[#7a00ea] text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab Content Box */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xs min-h-[220px]">
          
          {/* TAB 1: DESCRIPTION */}
          {activeTab === 'description' && (
            <div className="space-y-6">
              <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description || product.shortDescription}
              </div>

              {product.bundleContents && (
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">What is Included in Package:</h3>
                  <div className="bg-slate-50 p-4 rounded-2xl text-xs sm:text-sm text-slate-700 whitespace-pre-line border border-slate-200">
                    {product.bundleContents}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADDITIONAL INFORMATION */}
          {activeTab === 'additional' && (
            <div className="max-w-2xl">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-700 w-1/3">Category</td>
                    <td className="py-3 px-4 text-slate-600">{product.categoryName}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-700">File Formats</td>
                    <td className="py-3 px-4 text-slate-600">
                      {product.formats && product.formats.length > 0 ? product.formats.join(', ') : 'Direct Access / Cloud Delivery'}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-700">Compatibility</td>
                    <td className="py-3 px-4 text-slate-600">{product.compatibility || 'Windows, Mac, iOS, Android, Web'}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-700">Delivery Method</td>
                    <td className="py-3 px-4 text-slate-600">
                      {product.deliveryMethod === 'subscription_access'
                        ? 'Subscription / Email & WhatsApp Activation (10-30 mins)'
                        : product.deliveryMethod === 'google_drive' 
                        ? 'Google Drive Link / Instant Email' 
                        : 'Direct Cloud Download'}
                    </td>
                  </tr>
                  {product.version && (
                    <tr className="bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-700">Version</td>
                      <td className="py-3 px-4 text-slate-600">{product.version}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: CUSTOMER REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-bold text-slate-900">Customer Feedback ({reviews.length})</h3>
                <p className="text-xs text-slate-500 mt-0.5">Reviews from verified purchasers</p>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">
                  There are no reviews yet. Be the first to review this product!
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{rev.userName}</span>
                          {rev.isVerifiedPurchase && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="flex text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Leave Review Form */}
              <div className="pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 mb-3">Add a Review</h4>
                {user ? (
                  reviewSubmitted ? (
                    <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
                      Thank you! Your review has been submitted successfully.
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-3 max-w-xl">
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-slate-600 font-semibold">Your Rating:</label>
                        <select
                          value={ratingInput}
                          onChange={(e) => setRatingInput(Number(e.target.value))}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800"
                        >
                          <option value={5}>5 Stars - Excellent</option>
                          <option value={4}>4 Stars - Very Good</option>
                          <option value={3}>3 Stars - Good</option>
                          <option value={2}>2 Stars - Fair</option>
                          <option value={1}>1 Star - Poor</option>
                        </select>
                      </div>
                      <textarea
                        rows={3}
                        required
                        placeholder="Write your review about this product..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="px-5 py-2.5 bg-[#7a00ea] hover:bg-[#6c00d4] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {reviewSubmitting ? "Submitting..." : "Submit Review"}
                      </button>
                    </form>
                  )
                ) : (
                  <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <Link to="/login" className="text-purple-600 font-bold hover:underline">Log in to your account</Link> to leave a verified review.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ================= RELATED PRODUCTS ================= */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Related Products in {product.categoryName}</h2>
            <Link to="/shop" className="text-xs sm:text-sm font-semibold text-purple-600 hover:text-purple-700">
              View Catalog →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ================= POSTER ZOOM / LIGHTBOX MODAL ================= */}
      {isZoomOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-950 rounded-3xl overflow-hidden p-2 shadow-2xl border border-white/20" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-all shadow-md"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-auto max-h-[82vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* ================= DOWNLOAD SUCCESS & ZIP PASSWORD MODAL ================= */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative space-y-5 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Icon & Title */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                ডাউনলোড শুরু হয়েছে! 🎉
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {product.name}
              </p>
            </div>

            {/* ZIP Password Notice (If Product has ZIP Password) */}
            {product.zipPassword ? (
              <div className="space-y-3 p-4 bg-purple-50/80 border border-purple-200/90 rounded-2xl">
                <div className="flex items-start gap-2.5">
                  <KeyRound className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    ফাইলটি <strong className="text-purple-950 font-black">ZIP</strong> আকারে রয়েছে। ফাইলটি ডাউনলোড করার পর আনজিপ (Unzip/Extract) করতে নিচের <strong className="text-purple-950 font-black">৪ সংখ্যার পাসওয়ার্ডটি</strong> প্রয়োজন হবে:
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-purple-200 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Unzip Password</span>
                    <span className="font-mono text-2xl font-black text-[#7a00ea] tracking-widest select-all">
                      {product.zipPassword}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(product.zipPassword || '');
                      setCopiedZipPass(true);
                      setTimeout(() => setCopiedZipPass(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
                  >
                    {copiedZipPass ? (
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
            ) : product.deliveryMethod === 'subscription_access' ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-slate-700 space-y-2">
                <p className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>সাবস্ক্রিপশন এক্সেস</span>
                </p>
                <p className="leading-relaxed">
                  {product.subscriptionInstructions || "আপনার সাবস্ক্রিপশন ইনভাইটেশন ও লগইন তথ্য প্রসেস করা হচ্ছে।"}
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 text-center">
                ফাইলটি আপনার ডিভাইসে ডাউনলোড হচ্ছে। এটি আপনার Downloads Library-তেও সংরক্ষণ করা হয়েছে।
              </div>
            )}

            {/* Notification Badge */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>রিসোর্সটি আপনার <strong>Downloads Library</strong>-তে যুক্ত করা হয়েছে।</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <Link
                to="/downloads"
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 text-center"
              >
                <span>Downloads Library দেখুন</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
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
