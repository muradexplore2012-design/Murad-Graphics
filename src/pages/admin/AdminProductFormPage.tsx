import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  createProduct, 
  updateProduct, 
  getProductById, 
  getCategories, 
  uploadImageWithFallback,
  recordAuditLog 
} from '../../services/api';
import { Product, Category, ProductType, DeliveryMethod } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, 
  Upload, 
  Check, 
  AlertCircle, 
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Tag,
  ImagePlus
} from 'lucide-react';

const DEFAULT_FORMATS = [
  'Subscription',
  'Invite Link',
  'License Key',
  'Private Account',
  'Shared Account',
  'Email Delivery',
  'Lifetime',
  'AI',
  'EPS',
  'PSD',
  'PDF',
  'ZIP',
  'APK',
  'EXE'
];

export const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productType, setProductType] = useState<ProductType>('template');

  // Pricing
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [comparePrice, setComparePrice] = useState<number>(0);
  const [showDiscountBadge, setShowDiscountBadge] = useState<boolean>(false);

  // Images & Previews (Supports 1, 2, 3 or more photos)
  const [thumbnail, setThumbnail] = useState('');
  const [previews, setPreviews] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [directPhotoUrl, setDirectPhotoUrl] = useState('');

  // Delivery
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('google_drive');
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [directDownloadUrl, setDirectDownloadUrl] = useState('');
  const [directFileName, setDirectFileName] = useState('');
  const [directFileSize, setDirectFileSize] = useState<number>(0);
  const [subscriptionDuration, setSubscriptionDuration] = useState('1 Year');
  const [subscriptionInstructions, setSubscriptionInstructions] = useState('');
  const [subscriptionInviteUrl, setSubscriptionInviteUrl] = useState('');
  const [zipPassword, setZipPassword] = useState('');

  // Metadata
  const [availableFormats, setAvailableFormats] = useState<string[]>(DEFAULT_FORMATS);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [customFormatInput, setCustomFormatInput] = useState('');
  const [fileSizeText, setFileSizeText] = useState('');
  const [compatibility, setCompatibility] = useState('');
  const [bundleContents, setBundleContents] = useState('');
  const [licenseTerms, setLicenseTerms] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    getCategories(false).then(setCategories);

    if (id) {
      getProductById(id).then((prod) => {
        if (prod) {
          setName(prod.name);
          setSlug(prod.slug);
          setShortDescription(prod.shortDescription || '');
          setDescription(prod.description || '');
          setCategoryId(prod.categoryId);
          setProductType(prod.productType);
          setIsFree(prod.isFree);
          setPrice(prod.price || 0);
          setComparePrice(prod.comparePrice || 0);
          setShowDiscountBadge(prod.showDiscountBadge ?? false);
          setThumbnail(prod.thumbnail || '');
          setPreviews(prod.previews || []);
          const allInitialPhotos = [prod.thumbnail, ...(prod.previews || [])].filter(Boolean) as string[];
          setPhotos(allInitialPhotos);
          setDeliveryMethod(prod.deliveryMethod === 'subscription_access' ? 'subscription_access' : 'google_drive');
          setGoogleDriveUrl(prod.googleDriveUrl || '');
          setSubscriptionDuration(prod.subscriptionDuration || '1 Year');
          setSubscriptionInstructions(prod.subscriptionInstructions || '');
          setZipPassword(prod.zipPassword || '');
          if (prod.deliveryMethod === 'subscription_access' && prod.googleDriveUrl) {
            setSubscriptionInviteUrl(prod.googleDriveUrl);
          }
          if (prod.formats && prod.formats.length > 0) {
            setSelectedFormats(prod.formats);
            setAvailableFormats(prev => {
              const merged = [...prev];
              prod.formats.forEach(f => {
                if (!merged.includes(f)) merged.push(f);
              });
              return merged;
            });
          }
          setFileSizeText(prod.fileSizeText || '');
          setCompatibility(prod.compatibility || '');
          setBundleContents(prod.bundleContents || '');
          setLicenseTerms(prod.licenseTerms || '');
          setTagsInput((prod.tags || []).join(', '));
          setIsFeatured(prod.isFeatured);
          setIsActive(prod.isActive);

          if (prod.fileMetadata) {
            setDirectDownloadUrl(prod.fileMetadata.downloadUrl || '');
            setDirectFileName(prod.fileMetadata.name || '');
            setDirectFileSize(prod.fileMetadata.size || 0);
          }
        }
      });
    }
  }, [id]);

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const fileList = Array.from(files);
      setUploadProgress(15);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const path = `previews/${Date.now()}_${i}_${file.name}`;
        const url = await uploadImageWithFallback(file, path, (p) => {
          const stepProgress = Math.round(((i + p / 100) / fileList.length) * 100);
          setUploadProgress(stepProgress);
        });
        uploadedUrls.push(url);
      }

      setPhotos(prev => {
        const next = [...prev, ...uploadedUrls];
        setThumbnail(next[0] || '');
        setPreviews(next.slice(1));
        return next;
      });
    } catch (err: any) {
      alert("Image upload failed: " + err.message);
    } finally {
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotos(prev => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      setThumbnail(next[0] || '');
      setPreviews(next.slice(1));
      return next;
    });
  };

  const handleSetPrimaryPhoto = (indexToPrimary: number) => {
    setPhotos(prev => {
      const selected = prev[indexToPrimary];
      const rest = prev.filter((_, idx) => idx !== indexToPrimary);
      const next = [selected, ...rest];
      setThumbnail(next[0] || '');
      setPreviews(next.slice(1));
      return next;
    });
  };

  const handleAddDirectPhotoUrl = () => {
    const trimmed = directPhotoUrl.trim();
    if (!trimmed) return;
    setPhotos(prev => {
      const next = [...prev, trimmed];
      setThumbnail(next[0] || '');
      setPreviews(next.slice(1));
      return next;
    });
    setDirectPhotoUrl('');
  };

  const toggleFormat = (fmt: string) => {
    if (selectedFormats.includes(fmt)) {
      setSelectedFormats(selectedFormats.filter(f => f !== fmt));
    } else {
      setSelectedFormats([...selectedFormats, fmt]);
    }
  };

  const handleAddCustomFormat = () => {
    const trimmed = customFormatInput.trim();
    if (!trimmed) return;
    if (!availableFormats.includes(trimmed)) {
      setAvailableFormats(prev => [...prev, trimmed]);
    }
    if (!selectedFormats.includes(trimmed)) {
      setSelectedFormats(prev => [...prev, trimmed]);
    }
    setCustomFormatInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !categoryId) {
      alert("Please fill in the product name, slug, and category.");
      return;
    }

    if (!isFree && price <= 0) {
      alert("Paid products require a valid price in BDT.");
      return;
    }

    if (deliveryMethod === 'google_drive' && !googleDriveUrl) {
      alert("Please enter the Google Drive URL when Google Drive delivery is chosen.");
      return;
    }

    setLoading(true);
    try {
      const selectedCategoryObj = categories.find(c => c.id === categoryId);
      const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

      const productPayload = {
        name,
        slug,
        shortDescription,
        description,
        categoryId,
        categoryName: selectedCategoryObj?.name || 'General',
        productType,
        isFree,
        price: isFree ? 0 : Number(price),
        comparePrice: isFree ? 0 : Number(comparePrice || 0),
        showDiscountBadge: Boolean(showDiscountBadge),
        thumbnail: photos[0] || thumbnail || '',
        previews: photos.length > 1 ? photos.slice(1) : (photos.length === 1 ? [] : previews),
        deliveryMethod,
        googleDriveUrl: deliveryMethod === 'google_drive' 
          ? googleDriveUrl 
          : (deliveryMethod === 'subscription_access' ? subscriptionInviteUrl : ''),
        zipPassword: zipPassword.trim() || '',
        subscriptionDuration: subscriptionDuration.trim() || '1 Year',
        subscriptionInstructions: subscriptionInstructions.trim() || 'অর্ডার সফল হলে আপনার ইমেইল বা হোয়াটসঅ্যাপে সাবস্ক্রিপশন ইনভাইটেশন লিংক / লগইন অ্যাক্সেস পাঠানো হবে।',
        ...(directDownloadUrl ? {
          fileMetadata: {
            name: directFileName || 'download_asset',
            size: directFileSize || 0,
            mimeType: 'application/octet-stream',
            format: selectedFormats[0] || 'ZIP',
            downloadUrl: directDownloadUrl,
            updatedAt: new Date().toISOString()
          }
        } : {}),
        formats: selectedFormats,
        fileSizeText,
        compatibility,
        bundleContents,
        licenseTerms,
        tags: tagsArray,
        isFeatured,
        isActive
      };

      if (isEditing && id) {
        await updateProduct(id, productPayload);
        await recordAuditLog({
          adminUid: user?.uid || '',
          adminEmail: user?.email || '',
          action: 'UPDATE_PRODUCT',
          targetType: 'PRODUCT',
          targetId: id,
          details: { name }
        });
      } else {
        const newId = await createProduct(productPayload);
        await recordAuditLog({
          adminUid: user?.uid || '',
          adminEmail: user?.email || '',
          action: 'CREATE_PRODUCT',
          targetType: 'PRODUCT',
          targetId: newId,
          details: { name }
        });
      }

      navigate('/admin/products');
    } catch (err: any) {
      alert("Failed to save product: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/products"
          className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isEditing ? `Edit Product: ${name}` : 'Create New Digital Product'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Set pricing, upload previews, and configure digital delivery
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 text-xs text-slate-700">
        
        {/* Basic Details Box */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            1. Title, Slug & Category
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1 text-slate-800">Product Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Modern Ramadan Social Media Post Bundle"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-slate-800">URL Slug *</label>
              <input
                type="text"
                required
                placeholder="modern-ramadan-post-bundle"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-slate-800">Category *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-slate-800">Asset Type *</label>
              <select
                value={productType}
                onChange={(e) => {
                  const val = e.target.value as ProductType;
                  setProductType(val);
                  if (val === 'subscription') {
                    setDeliveryMethod('subscription_access');
                    if (!selectedFormats.includes('Subscription')) {
                      setSelectedFormats(prev => [...prev, 'Subscription']);
                    }
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
              >
                <option value="subscription">Subscription / Digital Service (Canva, Adobe, ChatGPT, etc.)</option>
                <option value="template">Template</option>
                <option value="theme">Website Theme</option>
                <option value="graphic_resource">Graphic Resource</option>
                <option value="font">Font</option>
                <option value="mockup">Mockup</option>
                <option value="software">Software / Tool</option>
                <option value="bundle">Bundle</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1 text-slate-800">Short Description</label>
              <input
                type="text"
                placeholder="Brief summary for product card..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1 text-slate-800">Full Detailed Description</label>
              <textarea
                rows={5}
                placeholder="Comprehensive overview of design assets, features, and instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Pricing Options */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            2. Pricing (Free or Paid)
          </h2>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setIsFree(false)}
              className={`flex-1 p-4 rounded-2xl border text-center font-bold text-xs transition-all ${
                !isFree
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              PAID PRODUCT (BDT ৳)
            </button>

            <button
              type="button"
              onClick={() => setIsFree(true)}
              className={`flex-1 p-4 rounded-2xl border text-center font-bold text-xs transition-all ${
                isFree
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              FREE GIVEAWAY (৳0)
            </button>
          </div>

          {!isFree && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="font-semibold block mb-1 text-slate-800">Selling Price (BDT ৳) *</label>
                <input
                  type="number"
                  min="0"
                  required={!isFree}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">Compare-at Price (Optional strike-through)</label>
                <input
                  type="number"
                  min="0"
                  value={comparePrice}
                  onChange={(e) => setComparePrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Show Offer / Discount Badge Toggle */}
              <div className="sm:col-span-2 pt-2">
                <label 
                  className={`flex items-start sm:items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    showDiscountBadge 
                      ? 'border-emerald-500 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-500/20' 
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={showDiscountBadge}
                    onChange={(e) => setShowDiscountBadge(e.target.checked)}
                    className="mt-0.5 sm:mt-0 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <p className={`font-bold text-xs flex items-center gap-2 ${showDiscountBadge ? 'text-emerald-950' : 'text-slate-800'}`}>
                      <span>Show Offer / Discount Badge (% OFF) on Product Card</span>
                      {showDiscountBadge ? (
                        <span className="px-2 py-0.5 rounded-md text-[9px] bg-emerald-600 text-white font-extrabold uppercase tracking-wide shadow-xs">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[9px] bg-slate-200 text-slate-600 font-bold uppercase tracking-wide">
                          Hidden
                        </span>
                      )}
                    </p>
                    <p className={`text-[11px] font-normal mt-0.5 ${showDiscountBadge ? 'text-emerald-800' : 'text-slate-500'}`}>
                      টিক চিহ্ন দিলে কার্ডের উপর "50% OFF" স্টিকার শো করবে। আনচেক রাখলে প্রোডাক্ট কার্ডে কোনো অফার ব্যাজ দেখাবে না।
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Digital File Delivery Method */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            3. Digital Delivery Method & Access
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setDeliveryMethod('google_drive')}
              className={`p-4 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                deliveryMethod === 'google_drive'
                  ? 'border-cyan-500 bg-cyan-50 text-slate-900 shadow-xs ring-2 ring-cyan-500/20'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-cyan-700">
                <ExternalLink className="w-4 h-4" />
                <span>Google Drive Link</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Paste a Google Drive shareable link for templates, bundles, or source files.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setDeliveryMethod('subscription_access');
                if (productType !== 'subscription') {
                  setProductType('subscription');
                }
                if (!selectedFormats.includes('Subscription')) {
                  setSelectedFormats(prev => [...prev, 'Subscription']);
                }
              }}
              className={`p-4 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                deliveryMethod === 'subscription_access'
                  ? 'border-purple-500 bg-purple-50 text-slate-900 shadow-xs ring-2 ring-purple-500/20'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-purple-700">
                <Sparkles className="w-4 h-4" />
                <span>Subscription / Account</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Canva Pro, Adobe CC, ChatGPT Plus, OTT, Windows Key or private credentials.
              </p>
            </button>
          </div>

          {/* Delivery Configuration Inputs */}
          {deliveryMethod === 'subscription_access' ? (
            /* Subscription & Digital Service Setup */
            <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="font-bold text-xs text-purple-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Subscription Delivery & Access Settings
                </span>
                <span className="text-[10px] bg-purple-200/80 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">
                  No file upload needed
                </span>
              </div>

              {/* Validity / Duration Presets */}
              <div>
                <label className="font-bold block mb-1 text-slate-800 text-xs">
                  Subscription Duration / Plan Validity *
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['1 Month', '3 Months', '6 Months', '1 Year', '2 Years', 'Lifetime'].map((dur) => (
                    <button
                      type="button"
                      key={dur}
                      onClick={() => setSubscriptionDuration(dur)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        subscriptionDuration === dur
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="e.g. 1 Year, 6 Months, or Lifetime..."
                  value={subscriptionDuration}
                  onChange={(e) => setSubscriptionDuration(e.target.value)}
                  className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                />
              </div>

              {/* Customer Delivery Instructions */}
              <div>
                <label className="font-bold block mb-1 text-slate-800 text-xs">
                  Customer Delivery Instructions & Notice *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. অর্ডার কনফার্ম হওয়ার পর ১০-৩০ মিনিটের মধ্যে আপনার ইমেইল বা হোয়াটসঅ্যাপে ইনভাইটেশন লিংক / লগইন অ্যাক্সেস পাঠানো হবে। দ্রুত পাওয়ার জন্য হোয়াটসঅ্যাপে অর্ডার আইডি মেসেজ দিন।"
                  value={subscriptionInstructions}
                  onChange={(e) => setSubscriptionInstructions(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs leading-relaxed"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  এই বার্তাটি কাস্টমার অর্ডার সফল হওয়ার পর তার অ্যাকাউন্ট ও অর্ডারের পাতায় দেখতে পাবেন।
                </p>
              </div>

              {/* Optional Instant Invite / Direct Link */}
              <div>
                <label className="font-bold block mb-1 text-slate-800 text-xs">
                  Direct Invitation / Access Link (Optional - যদি সরাসরি ইনভাইটেশন লিংক থাকে)
                </label>
                <input
                  type="url"
                  placeholder="https://canva.com/brand/join?... or direct invite link (leave empty if delivered manually)"
                  value={subscriptionInviteUrl}
                  onChange={(e) => setSubscriptionInviteUrl(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  যদি সরাসরি ইনভাইটেশন লিংক থাকে তবে দিতে পারেন। না থাকলে খালি রাখুন; কাস্টমারকে ম্যানুয়ালি হোয়াটসঅ্যাপ বা ইমেইলে দেওয়া হবে।
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="font-bold block text-slate-800 text-xs">Google Drive Shareable Link *</label>
              <input
                type="url"
                required
                placeholder="https://drive.google.com/file/d/..."
                value={googleDriveUrl}
                onChange={(e) => setGoogleDriveUrl(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-xs"
              />
              <p className="text-[11px] text-slate-500">
                Note: Ensure the file permission in Google Drive is set to "Anyone with the link can view". This link remains protected until purchase confirmation.
              </p>
            </div>
          )}

          {/* ZIP / Extraction Password (Optional for drive / file deliveries) */}
          {deliveryMethod !== 'subscription_access' && (
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#7a00ea]" />
                  <span>ZIP / ফাইল আনজিপ করার পাসওয়ার্ড (ঐচ্ছিক / Optional)</span>
                </label>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md">
                  পাসওয়ার্ড না থাকলে ফাঁকা রাখুন
                </span>
              </div>
              <input
                type="text"
                placeholder="যেমন: 1234 বা MG2026 (না থাকলে খালি রাখুন)"
                value={zipPassword}
                onChange={(e) => setZipPassword(e.target.value)}
                className="w-full bg-white border border-purple-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7a00ea] font-mono text-xs tracking-wider"
              />
              <p className="text-[11px] text-slate-600 leading-relaxed">
                💡 <strong>কখন দিবেন?</strong> ফাইলটিতে যদি আনজিপ করার কোনো পাসওয়ার্ড থাকে (যেমন ৪ সংখ্যার পাসওয়ার্ড), তবে সেটি এখানে দিন। কাস্টমার অর্ডার সফল হওয়ার পর স্বয়ংক্রিয়ভাবে একটি সুন্দর নোটিশে পাসওয়ার্ড ও কপি বাটন দেখতে পাবে। পাসওয়ার্ড না থাকলে এটি ফাঁকা রাখুন।
              </p>
            </div>
          )}
        </div>

        {/* Media & Previews (1/3+ Photos) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                4. Preview Images & Photos
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Upload 1, 2, 3 or more photos. Any specific photo can be removed individually. The first photo is your Main Thumbnail.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-xl">
                {photos.length} Photo{photos.length === 1 ? '' : 's'} Selected
              </span>
            </div>
          </div>

          {/* Hidden multi-file input */}
          <input
            id="product-photos-file-input"
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotosUpload}
            disabled={uploadProgress !== null}
            className="hidden"
          />

          {/* Controls: Add Photo Button + URL input */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="product-photos-file-input"
                className={`inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-all ${
                  uploadProgress !== null ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <ImagePlus className="w-4 h-4" />
                <span>Add Photo{photos.length > 0 ? 's' : ''}</span>
              </label>

              <span className="text-xs text-slate-400">
                Supports selecting 1 or multiple files from your device (JPG, PNG, WEBP)
              </span>
            </div>

            {/* Upload Progress Indicator */}
            {uploadProgress !== null && (
              <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-1.5 max-w-md">
                <div className="flex items-center justify-between text-xs font-semibold text-blue-800">
                  <span>Uploading photos...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Direct URL entry */}
            <div className="flex items-center gap-2 max-w-xl">
              <input
                type="text"
                placeholder="Or paste direct image URL (e.g. https://...)"
                value={directPhotoUrl}
                onChange={(e) => setDirectPhotoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDirectPhotoUrl();
                  }
                }}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddDirectPhotoUrl}
                disabled={!directPhotoUrl.trim()}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
              >
                Add URL
              </button>
            </div>
          </div>

          {/* Photo Cards Grid with Specific Remove Buttons */}
          <div className="pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((photoUrl, idx) => (
                <div
                  key={`${photoUrl}-${idx}`}
                  className="relative group rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-blue-400 bg-slate-100 aspect-square shadow-xs hover:shadow-md transition-all flex flex-col"
                >
                  <img
                    src={photoUrl}
                    alt={`Product photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Top Badges: Primary Indicator & Dedicated Remove Button */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    {idx === 0 ? (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg shadow-sm">
                        Primary
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium rounded-lg">
                        Photo {idx + 1}
                      </span>
                    )}

                    {/* Specific Remove Button: clicking this removes THIS exact photo */}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="w-7 h-7 rounded-xl bg-white/95 hover:bg-rose-600 text-slate-700 hover:text-white flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer"
                      title={`Remove Photo #${idx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Set as Main Thumbnail Button on Hover (for non-primary photos) */}
                  {idx !== 0 && (
                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryPhoto(idx)}
                        className="w-full py-1.5 bg-black/80 hover:bg-blue-600 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg shadow-sm transition-colors text-center cursor-pointer"
                      >
                        Set as Main
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Photo Dropzone Card */}
              <label
                htmlFor="product-photos-file-input"
                className={`aspect-square rounded-2xl bg-slate-50 hover:bg-blue-50/60 border-2 border-dashed border-slate-300 hover:border-blue-500 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 cursor-pointer transition-all group ${
                  uploadProgress !== null ? 'opacity-50 pointer-events-none' : ''
                }`}
                title="Click to add photo"
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200 group-hover:border-blue-300 flex items-center justify-center mb-1.5 transition-colors">
                  <ImagePlus className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                  Add Photo
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {photos.length === 0 ? 'Click to select' : `${photos.length} uploaded`}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Search Tags & Visibility */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            5. Search Tags & Visibility
          </h2>

          <div className="space-y-4">
            <div>
              <label className="font-semibold block mb-1 text-slate-800 text-xs">Search Tags (comma separated)</label>
              <input
                type="text"
                placeholder="flyer, ramadan, editable, mockup, psd"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs"
              />
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-bold text-slate-800">Feature on Homepage</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-bold text-emerald-700">Published / Active</span>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to="/admin/products"
            className="px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold bg-white transition-all shadow-xs"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Saving to Database..." : isEditing ? "Save Product Changes" : "Publish Product"}
          </button>
        </div>

      </form>
    </div>
  );
};
