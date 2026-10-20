import React, { useEffect, useState } from 'react';
import { 
  getBanners, 
  createBanner, 
  deleteBanner, 
  uploadImageWithFallback,
  recordAuditLog 
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
  Sparkles
} from 'lucide-react';
import { TableSkeleton } from '../../components/ui/Skeletons';

export const AdminBannersPage: React.FC = () => {
  const { user } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'slider' | 'posters'>('slider');

  // Slider Banner Form State
  const [sliderTitle, setSliderTitle] = useState('');
  const [sliderLink, setSliderLink] = useState('/shop');
  const [sliderImage, setSliderImage] = useState('');
  const [sliderUploadProgress, setSliderUploadProgress] = useState<number | null>(null);
  const [submittingSlider, setSubmittingSlider] = useState(false);

  // Side Poster Form State
  const [posterTitle, setPosterTitle] = useState('');
  const [posterLink, setPosterLink] = useState('/shop');
  const [posterImage, setPosterImage] = useState('');
  const [posterSlot, setPosterSlot] = useState<'side_top' | 'side_bottom_left' | 'side_bottom_right'>('side_top');
  const [posterUploadProgress, setPosterUploadProgress] = useState<number | null>(null);
  const [submittingPoster, setSubmittingPoster] = useState(false);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await getBanners(false);
      setBanners(data);
    } catch (e) {
      console.error("Error loading banners:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // Filter sliders vs posters
  const sliderBanners = banners.filter(b => !b.placement || b.placement === 'slider');
  const posterBanners = banners.filter(b => b.placement && b.placement !== 'slider');

  const topPoster = banners.find(b => b.placement === 'side_top');
  const blPoster = banners.find(b => b.placement === 'side_bottom_left');
  const brPoster = banners.find(b => b.placement === 'side_bottom_right');

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
      alert("Image processing failed: " + err.message);
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
      alert("Poster processing failed: " + err.message);
    } finally {
      setPosterUploadProgress(null);
    }
  };

  // Create Slider Banner
  const handleCreateSlider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sliderImage) {
      alert("Please upload a slide image first.");
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
        placement: 'slider'
      });

      await recordAuditLog({
        adminUid: user?.uid || '',
        adminEmail: user?.email || '',
        action: 'CREATE_HOMEPAGE_BANNER',
        targetType: 'BANNER',
        targetId: 'slider',
        details: { title: sliderTitle, placement: 'slider' }
      });

      setSliderTitle('');
      setSliderImage('');
      setSliderLink('/shop');
      await loadBanners();
    } catch (err: any) {
      alert("Failed to save slide: " + err.message);
    } finally {
      setSubmittingSlider(false);
    }
  };

  // Create Side Poster
  const handleCreatePoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posterImage) {
      alert("Please upload a poster image first.");
      return;
    }

    setSubmittingPoster(true);
    try {
      // If a poster already exists in this slot, remove or replace it
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
        placement: posterSlot
      });

      await recordAuditLog({
        adminUid: user?.uid || '',
        adminEmail: user?.email || '',
        action: 'CREATE_HOMEPAGE_BANNER',
        targetType: 'BANNER',
        targetId: posterSlot,
        details: { title: posterTitle, placement: posterSlot }
      });

      setPosterTitle('');
      setPosterImage('');
      setPosterLink('/shop');
      await loadBanners();
    } catch (err: any) {
      alert("Failed to save poster: " + err.message);
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
        setBanners(banners.filter(b => b.id !== id));
      } catch (e: any) {
        alert("Failed to delete banner: " + e.message);
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
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-blue-600" />
          <span>Hero Banners & Side Posters</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage the Main Hero Carousel slider (left) and the Promotional Side Posters (right) independently.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('slider')}
          className={`pb-3 px-2 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
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
          className={`pb-3 px-2 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
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

              <button
                type="submit"
                disabled={submittingSlider || !sliderImage}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold transition-all shadow-sm active:scale-95 text-xs flex items-center justify-center gap-2"
              >
                <span>{submittingSlider ? "Saving..." : "Add to Hero Slider"}</span>
              </button>
            </form>
          </div>

          {/* Active Sliders Grid */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Active Hero Slider Banners ({sliderBanners.length})
            </h2>

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
                {sliderBanners.map((b, idx) => (
                  <div key={b.id} className="relative group bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
                    <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden">
                      <img 
                        src={b.imageUrl} 
                        alt={b.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold">
                        Slide #{idx + 1}
                      </span>
                    </div>

                    <div className="p-3.5 flex items-center justify-between bg-white border-t border-slate-100">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-900 truncate">{b.title}</p>
                        <p className="text-[10px] text-blue-600 font-mono truncate">{b.ctaLink || '/shop'}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteBanner(b.id, b.title)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                        title="Delete Slide"
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

              <button
                type="submit"
                disabled={submittingPoster || !posterImage}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold transition-all shadow-sm active:scale-95 text-xs flex items-center justify-center gap-2"
              >
                <span>{submittingPoster ? "Saving..." : "Save Poster to Selected Slot"}</span>
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
                Here is how the right side of your homepage looks currently. You can remove any poster to revert to the default or replace it with a new one.
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
                      <button
                        onClick={() => handleDeleteBanner(topPoster.id, topPoster.title)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-xs"
                        title="Delete Top Poster"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
                        <button
                          onClick={() => handleDeleteBanner(blPoster.id, blPoster.title)}
                          className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-xs"
                          title="Delete Poster"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                        <button
                          onClick={() => handleDeleteBanner(brPoster.id, brPoster.title)}
                          className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-xs"
                          title="Delete Poster"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                        <img src={p.imageUrl} alt={p.title} className="w-16 h-12 rounded-lg object-cover border border-slate-200" />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 inline-block mb-0.5">
                            {getSlotLabel(p.placement)}
                          </span>
                          <p className="text-xs font-bold text-slate-900 truncate">{p.title}</p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{p.ctaLink || '/shop'}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteBanner(p.id, p.title)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                        title="Delete Poster"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
