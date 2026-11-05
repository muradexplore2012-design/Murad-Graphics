import React, { useEffect, useState } from 'react';
import { 
  getBanners, 
  createBanner, 
  updateBanner, 
  deleteBanner, 
  uploadImageWithFallback, 
  recordAuditLog,
  fastCacheInvalidate
} from '../../services/api';
import { Banner } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Upload, 
  Layers, 
  Sliders, 
  LayoutTemplate,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Star,
  ZoomIn,
  Check,
  X,
  Pencil,
  Save,
  RotateCcw
} from 'lucide-react';
import { TableSkeleton } from '../../components/ui/Skeletons';

export const AdminBannersPage: React.FC = () => {
  const { user } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'slider' | 'posters'>('slider');

  // Slider Banner Upload Form State
  const [sliderTitle, setSliderTitle] = useState('');
  const [sliderLink, setSliderLink] = useState('/shop');
  const [sliderImage, setSliderImage] = useState('');
  const [sliderHoverZoom, setSliderHoverZoom] = useState(false);
  const [sliderUploadProgress, setSliderUploadProgress] = useState<number | null>(null);
  const [submittingSlider, setSubmittingSlider] = useState(false);

  // Side Poster Upload Form State
  const [posterTitle, setPosterTitle] = useState('');
  const [posterLink, setPosterLink] = useState('/shop');
  const [posterImage, setPosterImage] = useState('');
  const [posterSlot, setPosterSlot] = useState<'side_top' | 'side_bottom_left' | 'side_bottom_right'>('side_top');
  const [posterHoverZoom, setPosterHoverZoom] = useState(false);
  const [posterUploadProgress, setPosterUploadProgress] = useState<number | null>(null);
  const [submittingPoster, setSubmittingPoster] = useState(false);

  // Action States
  const [updatingZoomId, setUpdatingZoomId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  // Edit Modal State
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editHoverZoom, setEditHoverZoom] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editOrder, setEditOrder] = useState<number>(1);
  const [editUploadProgress, setEditUploadProgress] = useState<number | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await getBanners(false);
      setBanners(data);
    } catch (e) {
      console.error('Error loading banners:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // Filter sliders vs posters
  const sliderBanners = banners
    .filter(b => !b.placement || b.placement === 'slider')
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const posterBanners = banners.filter(b => b.placement && b.placement !== 'slider');

  const topPoster = banners.find(b => b.placement === 'side_top');
  const blPoster = banners.find(b => b.placement === 'side_bottom_left');
  const brPoster = banners.find(b => b.placement === 'side_bottom_right');

  // Toggle Hover Zoom on an existing banner (1-click action)
  const handleToggleZoom = async (id: string, currentZoom: boolean | undefined) => {
    setUpdatingZoomId(id);
    try {
      const newZoom = !currentZoom;
      await updateBanner(id, { enableHoverZoom: newZoom });
      fastCacheInvalidate('banners_');
      setBanners(prev => prev.map(b => b.id === id ? { ...b, enableHoverZoom: newZoom } : b));
    } catch (err: any) {
      alert('হোভার জুম সেটিং পরিবর্তন করতে ব্যর্থ হয়েছে: ' + err.message);
    } finally {
      setUpdatingZoomId(null);
    }
  };

  // Move banner to any position (e.g. move banner #3 to #2 or #1)
  const handleSetPosition = async (id: string, targetPosition: number) => {
    const currentIndex = sliderBanners.findIndex(b => b.id === id);
    if (currentIndex === -1) return;
    const targetIndex = targetPosition - 1;
    if (targetIndex < 0 || targetIndex >= sliderBanners.length || targetIndex === currentIndex) return;

    setReorderingId(id);
    const reordered = [...sliderBanners];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    // Optimistic UI update
    setBanners(prev => {
      const nonSliders = prev.filter(b => b.placement && b.placement !== 'slider');
      const updatedSliders = reordered.map((b, idx) => ({ ...b, order: idx + 1 }));
      return [...updatedSliders, ...nonSliders];
    });

    try {
      await Promise.all(
        reordered.map((b, idx) => updateBanner(b.id, { order: idx + 1 }))
      );
      fastCacheInvalidate('banners_');
      await loadBanners();
    } catch (err: any) {
      alert('ব্যানারের পজিশন পরিবর্তন করতে সমস্যা হয়েছে: ' + err.message);
      await loadBanners();
    } finally {
      setReorderingId(null);
    }
  };

  // Quick 1-click set as #1 cover banner
  const handleSetFirst = async (id: string) => {
    await handleSetPosition(id, 1);
  };

  // Move slide up or down by 1 step
  const handleMoveOrder = async (id: string, direction: 'up' | 'down') => {
    const index = sliderBanners.findIndex(b => b.id === id);
    if (index === -1) return;
    const targetIdx = direction === 'up' ? index : index + 2;
    await handleSetPosition(id, targetIdx);
  };

  // Open Edit Modal
  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setEditTitle(banner.title || '');
    setEditLink(banner.ctaLink || '/shop');
    setEditImage(banner.imageUrl || '');
    setEditHoverZoom(!!banner.enableHoverZoom);
    setEditIsActive(banner.isActive !== false);
    const currentIdx = sliderBanners.findIndex(b => b.id === banner.id);
    setEditOrder(currentIdx !== -1 ? currentIdx + 1 : (banner.order || 1));
  };

  // Edit image file upload
  const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setEditUploadProgress(20);
      const path = `banners/edit_${Date.now()}_${file.name}`;
      const url = await uploadImageWithFallback(file, path, setEditUploadProgress);
      setEditImage(url);
    } catch (err: any) {
      alert('ছবি আপলোড করতে ব্যর্থ হয়েছে: ' + err.message);
    } finally {
      setEditUploadProgress(null);
    }
  };

  // Save changes from Edit Modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    setSavingEdit(true);
    try {
      const isSlider = !editingBanner.placement || editingBanner.placement === 'slider';

      if (isSlider) {
        const currentIdx = sliderBanners.findIndex(b => b.id === editingBanner.id);
        const targetIdx = editOrder - 1;

        if (currentIdx !== -1 && targetIdx !== currentIdx && targetIdx >= 0 && targetIdx < sliderBanners.length) {
          const reordered = [...sliderBanners];
          const [moved] = reordered.splice(currentIdx, 1);
          reordered.splice(targetIdx, 0, moved);

          await Promise.all(
            reordered.map((b, idx) => updateBanner(b.id, { 
              order: idx + 1,
              ...(b.id === editingBanner.id ? {
                title: editTitle.trim(),
                ctaLink: editLink.trim(),
                imageUrl: editImage,
                enableHoverZoom: editHoverZoom,
                isActive: editIsActive
              } : {})
            }))
          );
        } else {
          await updateBanner(editingBanner.id, {
            title: editTitle.trim(),
            ctaLink: editLink.trim(),
            imageUrl: editImage,
            enableHoverZoom: editHoverZoom,
            isActive: editIsActive,
            order: editOrder
          });
        }
      } else {
        await updateBanner(editingBanner.id, {
          title: editTitle.trim(),
          ctaLink: editLink.trim(),
          imageUrl: editImage,
          enableHoverZoom: editHoverZoom,
          isActive: editIsActive
        });
      }

      fastCacheInvalidate('banners_');
      await recordAuditLog({
        adminUid: user?.uid || '',
        adminEmail: user?.email || '',
        action: 'UPDATE_HOMEPAGE_BANNER',
        targetType: 'BANNER',
        targetId: editingBanner.id,
        details: { title: editTitle, enableHoverZoom: editHoverZoom, order: editOrder }
      });

      setEditingBanner(null);
      await loadBanners();
    } catch (err: any) {
      alert('ব্যানার আপডেট করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Slider Image Upload
  const handleSliderFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSliderUploadProgress(20);
      const path = `banners/slider_${Date.now()}_${file.name}`;
      const url = await uploadImageWithFallback(file, path, setSliderUploadProgress);
      setSliderImage(url);
    } catch (err: any) {
      alert('Image processing failed: ' + err.message);
    } finally {
      setSliderUploadProgress(null);
    }
  };

  // Handle Poster Image Upload
  const handlePosterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPosterUploadProgress(20);
      const path = `banners/poster_${Date.now()}_${file.name}`;
      const url = await uploadImageWithFallback(file, path, setPosterUploadProgress);
      setPosterImage(url);
    } catch (err: any) {
      alert('Poster processing failed: ' + err.message);
    } finally {
      setPosterUploadProgress(null);
    }
  };

  // Create Slider Banner
  const handleCreateSlider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sliderImage) {
      alert('Please upload a slide image first.');
      return;
    }

    setSubmittingSlider(true);
    try {
      await createBanner({
        title: sliderTitle.trim() || `Hero Slide #${sliderBanners.length + 1}`,
        imageUrl: sliderImage,
        ctaLink: sliderLink.trim() || '/shop',
        isActive: true,
        order: sliderBanners.length + 1,
        placement: 'slider',
        enableHoverZoom: sliderHoverZoom
      });

      await recordAuditLog({
        adminUid: user?.uid || '',
        adminEmail: user?.email || '',
        action: 'CREATE_HOMEPAGE_BANNER',
        targetType: 'BANNER',
        targetId: 'slider',
        details: { title: sliderTitle, placement: 'slider', enableHoverZoom: sliderHoverZoom }
      });

      setSliderTitle('');
      setSliderImage('');
      setSliderLink('/shop');
      setSliderHoverZoom(false);
      fastCacheInvalidate('banners_');
      await loadBanners();
    } catch (err: any) {
      alert('Failed to save slide: ' + err.message);
    } finally {
      setSubmittingSlider(false);
    }
  };

  // Create Side Poster
  const handleCreatePoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posterImage) {
      alert('Please upload a poster image first.');
      return;
    }

    setSubmittingPoster(true);
    try {
      const existingInSlot = banners.find(b => b.placement === posterSlot);
      if (existingInSlot) {
        await deleteBanner(existingInSlot.id);
      }

      await createBanner({
        title: posterTitle.trim() || `Promo Poster (${posterSlot})`,
        imageUrl: posterImage,
        ctaLink: posterLink.trim() || '/shop',
        isActive: true,
        order: posterSlot === 'side_top' ? 1 : posterSlot === 'side_bottom_left' ? 2 : 3,
        placement: posterSlot,
        enableHoverZoom: posterHoverZoom
      });

      await recordAuditLog({
        adminUid: user?.uid || '',
        adminEmail: user?.email || '',
        action: 'CREATE_HOMEPAGE_BANNER',
        targetType: 'BANNER',
        targetId: posterSlot,
        details: { title: posterTitle, placement: posterSlot, enableHoverZoom: posterHoverZoom }
      });

      setPosterTitle('');
      setPosterImage('');
      setPosterLink('/shop');
      setPosterHoverZoom(false);
      fastCacheInvalidate('banners_');
      await loadBanners();
    } catch (err: any) {
      alert('Failed to save poster: ' + err.message);
    } finally {
      setSubmittingPoster(false);
    }
  };

  // Delete Banner (slider or poster)
  const handleDeleteBanner = async (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"?`)) {
      try {
        await deleteBanner(id);
        await recordAuditLog({
          adminUid: user?.uid || '',
          adminEmail: user?.email || '',
          action: 'DELETE_HOMEPAGE_BANNER',
          targetType: 'BANNER',
          targetId: id
        });
        fastCacheInvalidate('banners_');
        setBanners(banners.filter(b => b.id !== id));
      } catch (e: any) {
        alert('Failed to delete banner: ' + e.message);
      }
    }
  };

  const getSlotLabel = (placement?: string) => {
    switch (placement) {
      case 'side_top':
        return 'Top Poster (Wide)';
      case 'side_bottom_left':
        return 'Bottom Left Poster';
      case 'side_bottom_right':
        return 'Bottom Right Poster';
      default:
        return 'Side Poster';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-blue-600" />
          <span>Homepage Hero Banners & Posters</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          ব্যানার আপলোড, যেকোনো পজিশনে সরানো (১ম, ২য়, ৩য়...), হোভার জুম নিয়ন্ত্রণ এবং ব্যানার সেটিং এডিট করার পূর্ণ সুবিধা।
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('slider')}
          className={`py-3 px-5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'slider'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Main Hero Slider ({sliderBanners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('posters')}
          className={`py-3 px-5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'posters'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>Side Promo Posters ({posterBanners.length})</span>
        </button>
      </div>

      {/* TAB 1: MAIN HERO SLIDER */}
      {activeTab === 'slider' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form: Upload New Hero Slide */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-1 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Add Hero Slide (Left Slider)</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                These slides appear in the left carousel on the homepage and rotate automatically.
              </p>
            </div>

            <form onSubmit={handleCreateSlider} className="space-y-4 text-xs text-slate-700">
              {/* Image upload box */}
              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Slide Image (Recommended: 1200x520px or 1024x440px | 2.3:1 Wide Ratio) *
                </label>
                <div className="p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-blue-500 transition-colors text-center space-y-2">
                  <input
                    type="file"
                    id="slider-file"
                    accept="image/*"
                    onChange={handleSliderFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <label 
                      htmlFor="slider-file" 
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Slide Image</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setSliderImage('/banners/main-hero-banner.png')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs border border-purple-200 transition-all shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Use Perfect 1200x520 Banner</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">PNG, JPG, WEBP formats supported (Auto-compressed)</p>

                  {sliderUploadProgress !== null && (
                    <div className="pt-2 space-y-1">
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all" style={{ width: `${sliderUploadProgress}%` }} />
                      </div>
                      <span className="text-[10px] text-blue-600 font-semibold">Processing image: {sliderUploadProgress}%</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200/70">
                    <input
                      type="text"
                      placeholder="Or paste direct image URL (ImgBB, Unsplash, etc.)"
                      value={sliderImage}
                      onChange={(e) => setSliderImage(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Preview of chosen image */}
              {sliderImage && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Image Ready</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSliderImage('')}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      Remove / Change
                    </button>
                  </div>
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                    <img src={sliderImage} alt="Slide Preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold block mb-1 text-slate-800">Slide Title / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Premium Digital Products for Smart Buyers"
                  value={sliderTitle}
                  onChange={(e) => setSliderTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">Click Destination Link</label>
                <input
                  type="text"
                  placeholder="/shop, /category/software, or https://..."
                  value={sliderLink}
                  onChange={(e) => setSliderLink(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono text-[11px] transition-all"
                />
              </div>

              {/* Hover Zoom Toggle Option */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sliderHoverZoom}
                    onChange={(e) => setSliderHoverZoom(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                      <span>মাউস হোভার জুম এফেক্ট (Zoom on Hover)</span>
                      {sliderHoverZoom ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          চালু থাকবে
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          বন্ধ থাকবে
                        </span>
                      )}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      টিক দিলে ভিজিটর মাউস নিলে ব্যানারটি অত্যন্ত হালকা জুম হবে। টিক না দিলে স্বাভাবিক স্থির থাকবে।
                    </p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={submittingSlider || !sliderImage}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold transition-all shadow-sm active:scale-95 text-xs flex items-center justify-center gap-2"
              >
                <span>{submittingSlider ? 'Saving...' : 'Add to Hero Slider'}</span>
              </button>
            </form>
          </div>

          {/* Active Sliders Grid & Reorder Controls */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Active Hero Slider Banners ({sliderBanners.length})
              </h2>
              <span className="text-[11px] text-slate-500">
                ★ যেকোনো ব্যানার ২য়, ৩য় বা ১ম পজিশনে সেট করুন ও এডিট করুন
              </span>
            </div>

            {loading ? (
              <TableSkeleton rows={3} />
            ) : sliderBanners.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs space-y-2">
                <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">No custom slider banners uploaded yet</p>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Default marketplace banners are currently showing. Upload your custom banners using the form on the left.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sliderBanners.map((b, idx) => {
                  const isFirst = idx === 0;
                  return (
                    <div 
                      key={b.id} 
                      className={`relative group rounded-2xl border overflow-hidden shadow-xs flex flex-col justify-between transition-all ${
                        isFirst 
                          ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-400/30' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {/* Image container */}
                      <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden">
                        <img 
                          src={b.imageUrl} 
                          alt={b.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />

                        {/* Order Badge on Top-Left */}
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          {isFirst ? (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                              <Star className="w-3 h-3 fill-white" />
                              <span>Slide #1 (১ম কভার ব্যানার)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold">
                              Slide #{idx + 1}
                            </span>
                          )}
                        </div>

                        {/* Top-Right Quick Action Buttons */}
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(b)}
                            className="p-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white transition-all shadow-md active:scale-95 flex items-center gap-1 text-[10px] font-bold"
                            title="ব্যানার এডিট করুন"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>এডিট</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteBanner(b.id, b.title)}
                            className="p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white transition-all shadow-md active:scale-95"
                            title="ব্যানার ডিলিট করুন"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Card Content & Reorder / Edit Controls */}
                      <div className="p-3 bg-white border-t border-slate-100 space-y-2.5">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{b.title}</p>
                          <p className="text-[10px] text-blue-600 font-mono truncate">{b.ctaLink || '/shop'}</p>
                        </div>

                        {/* Position Selector & Step Nudge Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 bg-slate-50/70 p-2 rounded-xl">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">পজিশন:</span>
                            <select
                              value={idx + 1}
                              disabled={reorderingId !== null}
                              onChange={(e) => handleSetPosition(b.id, Number(e.target.value))}
                              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
                              title="যেকোনো পজিশন নির্বাচন করুন (১, ২, ৩...)"
                            >
                              {sliderBanners.map((_, pIdx) => (
                                <option key={pIdx + 1} value={pIdx + 1}>
                                  {pIdx === 0 ? '১ম ব্যানার (Cover)' : `${pIdx + 1} নাম্বার ব্যানার`}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {idx > 0 && (
                              <button
                                type="button"
                                disabled={reorderingId !== null}
                                onClick={() => handleMoveOrder(b.id, 'up')}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs transition-all active:scale-95"
                                title="এক ধাপ আগে নিন (Move Up)"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                            )}

                            {idx < sliderBanners.length - 1 && (
                              <button
                                type="button"
                                disabled={reorderingId !== null}
                                onClick={() => handleMoveOrder(b.id, 'down')}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs transition-all active:scale-95"
                                title="এক ধাপ পরে নিন (Move Down)"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            )}

                            {!isFirst && (
                              <button
                                type="button"
                                disabled={reorderingId !== null}
                                onClick={() => handleSetFirst(b.id)}
                                className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold shadow-xs flex items-center gap-0.5 transition-all active:scale-95"
                                title="সবার প্রথমে ১ম ব্যানার বানান"
                              >
                                <Star className="w-2.5 h-2.5 fill-white" />
                                <span>১ম</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Quick Hover Zoom Toggle & Full Edit Button */}
                        <div className="flex items-center justify-between gap-1 pt-1">
                          <button
                            type="button"
                            disabled={updatingZoomId === b.id}
                            onClick={() => handleToggleZoom(b.id, b.enableHoverZoom)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                              b.enableHoverZoom
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                            title="হোভার জুম চালু বা বন্ধ করতে ক্লিক করুন"
                          >
                            <ZoomIn className="w-3 h-3" />
                            {updatingZoomId === b.id ? (
                              <span>Saving...</span>
                            ) : b.enableHoverZoom ? (
                              <span>জুম চালু (হালকা)</span>
                            ) : (
                              <span>জুম বন্ধ (স্থির)</span>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(b)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[10px] font-bold border border-slate-200 transition-all flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>এডিট সেটিং</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SIDE PROMO POSTERS */}
      {activeTab === 'posters' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form: Add Side Poster */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-1 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Upload Side Promo Poster</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                These posters appear on the right side of the Hero section (Fixed promos, do not slide).
              </p>
            </div>

            <form onSubmit={handleCreatePoster} className="space-y-4 text-xs text-slate-700">
              {/* Select Position / Slot */}
              <div>
                <label className="font-semibold block mb-1 text-slate-800">Select Poster Slot / Position *</label>
                <div className="grid grid-cols-1 gap-2">
                  <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    posterSlot === 'side_top' 
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold' 
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="slot"
                      value="side_top"
                      checked={posterSlot === 'side_top'}
                      onChange={() => setPosterSlot('side_top')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-xs">Top Poster (Wide Banner)</p>
                      <p className="text-[10px] text-slate-500 font-normal">e.g. LinkedIn Premium Up To 90% Discount (~800x380px)</p>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    posterSlot === 'side_bottom_left' 
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold' 
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="slot"
                      value="side_bottom_left"
                      checked={posterSlot === 'side_bottom_left'}
                      onChange={() => setPosterSlot('side_bottom_left')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-xs">Bottom-Left Poster</p>
                      <p className="text-[10px] text-slate-500 font-normal">e.g. Canva / Promo (~400x320px or 16:10)</p>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    posterSlot === 'side_bottom_right' 
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold' 
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="slot"
                      value="side_bottom_right"
                      checked={posterSlot === 'side_bottom_right'}
                      onChange={() => setPosterSlot('side_bottom_right')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-xs">Bottom-Right Poster</p>
                      <p className="text-[10px] text-slate-500 font-normal">e.g. Adobe / Promo (~400x320px or 16:10)</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Image upload box */}
              <div>
                <label className="font-semibold block mb-1 text-slate-800">Poster Image *</label>
                <div className="p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-blue-500 transition-colors text-center space-y-2">
                  <input
                    type="file"
                    id="poster-file"
                    accept="image/*"
                    onChange={handlePosterFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <label 
                      htmlFor="poster-file" 
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Poster Image</span>
                    </label>

                    {posterSlot === 'side_top' && (
                      <button
                        type="button"
                        onClick={() => setPosterImage('/banners/side-poster-top.png')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs border border-purple-200 transition-all shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Use Perfect 720x380 Side Poster</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">PNG, JPG, WEBP formats supported (Auto-compressed)</p>

                  {posterUploadProgress !== null && (
                    <div className="pt-2 space-y-1">
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all" style={{ width: `${posterUploadProgress}%` }} />
                      </div>
                      <span className="text-[10px] text-blue-600 font-semibold">Processing image: {posterUploadProgress}%</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200/70">
                    <input
                      type="text"
                      placeholder="Or paste direct image URL (ImgBB, Unsplash, etc.)"
                      value={posterImage}
                      onChange={(e) => setPosterImage(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Preview of chosen image */}
              {posterImage && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Image Ready</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPosterImage('')}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      Remove / Change
                    </button>
                  </div>
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                    <img src={posterImage} alt="Poster Preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold block mb-1 text-slate-800">Poster Title / Name</label>
                <input
                  type="text"
                  placeholder="e.g. LinkedIn Premium 90% Off"
                  value={posterTitle}
                  onChange={(e) => setPosterTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">Click Destination Link</label>
                <input
                  type="text"
                  placeholder="/shop, /product/..., or https://..."
                  value={posterLink}
                  onChange={(e) => setPosterLink(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono text-[11px] transition-all"
                />
              </div>

              {/* Hover Zoom Toggle Option */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={posterHoverZoom}
                    onChange={(e) => setPosterHoverZoom(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                      <span>পোস্টারে হোভার জুম এফেক্ট (Zoom on Hover)</span>
                      {posterHoverZoom ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          চালু থাকবে
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          বন্ধ থাকবে
                        </span>
                      )}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      টিক দিলে মাউস নিলে পোস্টারটি হালকা জুম হবে, টিক না দিলে স্বাভাবিক থাকবে।
                    </p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={submittingPoster || !posterImage}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold transition-all shadow-sm active:scale-95 text-xs flex items-center justify-center gap-2"
              >
                <span>{submittingPoster ? 'Saving...' : 'Save Poster to Selected Slot'}</span>
              </button>
            </form>
          </div>

          {/* Current Side Posters Layout Overview */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                Current Side Posters Layout
              </h2>
              <p className="text-xs text-slate-500">
                Here is how the right side of your homepage looks currently. You can edit settings, toggle zoom, or replace any poster.
              </p>

              {/* Visual Layout Mockup */}
              <div className="flex flex-col gap-3 p-4 bg-slate-100 rounded-2xl border border-slate-200">
                {/* Top Poster Slot */}
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white aspect-[21/9] flex items-center justify-center shadow-xs">
                  {topPoster ? (
                    <>
                      <img src={topPoster.imageUrl} alt={topPoster.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                        Top Poster (Wide)
                      </div>
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(topPoster)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs text-[10px] font-bold flex items-center gap-1"
                          title="Edit Top Poster"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>এডিট</span>
                        </button>
                        <button
                          type="button"
                          disabled={updatingZoomId === topPoster.id}
                          onClick={() => handleToggleZoom(topPoster.id, topPoster.enableHoverZoom)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-1 ${
                            topPoster.enableHoverZoom
                              ? 'bg-emerald-600 text-white'
                              : 'bg-black/60 text-white hover:bg-black/80'
                          }`}
                          title="হোভার জুম চালু/বন্ধ"
                        >
                          <ZoomIn className="w-3 h-3" />
                          <span>{topPoster.enableHoverZoom ? 'জুম অন' : 'জুম অফ'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(topPoster.id, topPoster.title)}
                          className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-xs"
                          title="Delete Top Poster"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4 text-slate-400">
                      <p className="font-bold text-xs text-slate-600">Top Poster: Default Demo Active</p>
                      <p className="text-[10px] text-slate-400">Upload to slot &quot;Top Poster&quot; to customize</p>
                    </div>
                  )}
                </div>

                {/* Bottom 2 Posters Slots */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Bottom Left */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white aspect-[4/3] flex items-center justify-center shadow-xs">
                    {blPoster ? (
                      <>
                        <img src={blPoster.imageUrl} alt={blPoster.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                          Bottom-Left
                        </div>
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(blPoster)}
                            className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs"
                            title="এডিট"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={updatingZoomId === blPoster.id}
                            onClick={() => handleToggleZoom(blPoster.id, blPoster.enableHoverZoom)}
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold shadow-xs flex items-center gap-1 ${
                              blPoster.enableHoverZoom
                                ? 'bg-emerald-600 text-white'
                                : 'bg-black/60 text-white hover:bg-black/80'
                            }`}
                            title="হোভার জুম চালু/বন্ধ"
                          >
                            <ZoomIn className="w-2.5 h-2.5" />
                            <span>{blPoster.enableHoverZoom ? 'অন' : 'অফ'}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(blPoster.id, blPoster.title)}
                            className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-xs"
                            title="Delete Poster"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-3 text-slate-400">
                        <p className="font-bold text-xs text-slate-600">Bottom Left</p>
                        <p className="text-[10px] text-slate-400">Default Demo Active</p>
                      </div>
                    )}
                  </div>

                  {/* Bottom Right */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white aspect-[4/3] flex items-center justify-center shadow-xs">
                    {brPoster ? (
                      <>
                        <img src={brPoster.imageUrl} alt={brPoster.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                          Bottom-Right
                        </div>
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(brPoster)}
                            className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs"
                            title="এডিট"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={updatingZoomId === brPoster.id}
                            onClick={() => handleToggleZoom(brPoster.id, brPoster.enableHoverZoom)}
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold shadow-xs flex items-center gap-1 ${
                              brPoster.enableHoverZoom
                                ? 'bg-emerald-600 text-white'
                                : 'bg-black/60 text-white hover:bg-black/80'
                            }`}
                            title="হোভার জুম চালু/বন্ধ"
                          >
                            <ZoomIn className="w-2.5 h-2.5" />
                            <span>{brPoster.enableHoverZoom ? 'অন' : 'অফ'}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(brPoster.id, brPoster.title)}
                            className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-xs"
                            title="Delete Poster"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-3 text-slate-400">
                        <p className="font-bold text-xs text-slate-600">Bottom Right</p>
                        <p className="text-[10px] text-slate-400">Default Demo Active</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* List of custom posters */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                Uploaded Custom Posters ({posterBanners.length})
              </h2>

              {posterBanners.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <p>No custom posters uploaded yet. Default digital deals are displaying on homepage.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posterBanners.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={p.imageUrl} alt={p.title} className="w-16 h-12 rounded-lg object-cover border border-slate-200 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 inline-block mb-0.5">
                            {getSlotLabel(p.placement)}
                          </span>
                          <p className="text-xs font-bold text-slate-900 truncate">{p.title}</p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{p.ctaLink || '/shop'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-all flex items-center gap-1 shadow-xs"
                          title="পোস্টার এডিট করুন"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>এডিট</span>
                        </button>

                        <button
                          type="button"
                          disabled={updatingZoomId === p.id}
                          onClick={() => handleToggleZoom(p.id, p.enableHoverZoom)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                            p.enableHoverZoom
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                          title="হোভার জুম অন/অফ"
                        >
                          {p.enableHoverZoom ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>জুম অন</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 text-slate-400" />
                              <span>জুম অফ</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteBanner(p.id, p.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                          title="Delete Poster"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT BANNER MODAL ================= */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ব্যানার সেটিং এডিট করুন (Edit Banner)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {!editingBanner.placement || editingBanner.placement === 'slider'
                      ? 'Hero Slider Banner'
                      : getSlotLabel(editingBanner.placement)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingBanner(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Image preview & replacement */}
              <div>
                <label className="font-semibold block mb-1 text-slate-800">ব্যানারের ছবি (Banner Image)</label>
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 mb-2">
                  <img src={editImage} alt="Preview" className="w-full h-full object-cover" />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="edit-file-upload"
                    accept="image/*"
                    onChange={handleEditFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="edit-file-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-all border border-blue-200"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>নতুন ছবি আপলোড করুন</span>
                  </label>
                  {editUploadProgress !== null && (
                    <span className="text-[11px] font-bold text-blue-600">
                      Uploading {editUploadProgress}%...
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Or paste direct image URL"
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Title input */}
              <div>
                <label className="font-semibold block mb-1 text-slate-800">টাইটেল / নাম (Title)</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="ব্যানারের নাম লিখুন"
                />
              </div>

              {/* Link input */}
              <div>
                <label className="font-semibold block mb-1 text-slate-800">ক্লিক লিংক (Destination Link)</label>
                <input
                  type="text"
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="/shop, /product/..., or https://..."
                />
              </div>

              {/* If Slider, Order Position Dropdown */}
              {(!editingBanner.placement || editingBanner.placement === 'slider') && (
                <div>
                  <label className="font-semibold block mb-1 text-slate-800">
                    ব্যানারের পজিশন / ক্রম নম্বর (Slide Position)
                  </label>
                  <select
                    value={editOrder}
                    onChange={(e) => setEditOrder(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
                  >
                    {sliderBanners.map((_, pIdx) => (
                      <option key={pIdx + 1} value={pIdx + 1}>
                        {pIdx === 0 ? '১ম ব্যানার (⭐ Cover Banner)' : `${pIdx + 1} নাম্বার ব্যানার`}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    পজিশন পরিবর্তন করলে অন্যান্য ব্যানারগুলো স্বয়ংক্রিয়ভাবে আগে বা পরে সরে যাবে।
                  </p>
                </div>
              )}

              {/* Hover Zoom Toggle Checkbox */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editHoverZoom}
                    onChange={(e) => setEditHoverZoom(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                      <span>মাউস হোভার জুম এফেক্ট (Zoom on Hover)</span>
                      {editHoverZoom ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          চালু
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          বন্ধ
                        </span>
                      )}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      টিক দিলে মাউস রাখলে ব্যানারটি হালকা জুম হবে, টিক না দিলে সম্পূর্ণ স্থির থাকবে।
                    </p>
                  </div>
                </label>
              </div>

              {/* Active Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-bold text-slate-800 text-xs">ব্যানার স্ট্যাটাস (Active)</p>
                    <p className="text-[11px] text-slate-500">ব্যানারটি ওয়েবসাইটে লাইভ চালু রাখবেন কি?</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold transition-all text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editImage}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold transition-all text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
