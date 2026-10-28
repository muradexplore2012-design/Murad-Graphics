import React, { useEffect, useState, useRef } from 'react';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  uploadImageWithFallback,
  getSiteSettings,
  updateSiteSettings,
  recordAuditLog 
} from '../../services/api';
import { Category } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Upload, 
  Image as ImageIcon,
  Sparkles,
  Eye
} from 'lucide-react';
import { TableSkeleton } from '../../components/ui/Skeletons';
import { CategoryIcon } from '../../components/ui/CategoryIcon';

const ADMIN_CATEGORIES_CACHE_KEY = 'mg_admin_categories_cache_v1';

export const AdminCategoriesPage: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_CATEGORIES_CACHE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem(ADMIN_CATEGORIES_CACHE_KEY));

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(0);
  const [image, setImage] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // All Products Card Image State
  const [allProductsImg, setAllProductsImg] = useState<string>('/categories/all-products.png');
  const [uploadingAllProducts, setUploadingAllProducts] = useState(false);
  const [savingAllProducts, setSavingAllProducts] = useState(false);
  const [allProductsSuccess, setAllProductsSuccess] = useState(false);
  const allProductsFileInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const [cats, settings] = await Promise.all([
        getCategories(false),
        getSiteSettings(true).catch(() => null)
      ]);
      setCategories(cats);
      if (settings?.allProductsImage) {
        setAllProductsImg(settings.allProductsImage);
      }
      try {
        localStorage.setItem(ADMIN_CATEGORIES_CACHE_KEY, JSON.stringify(cats));
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAllProductsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAllProducts(true);
    try {
      const path = `categories/all_products_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const url = await uploadImageWithFallback(file, path);
      setAllProductsImg(url);
      
      setSavingAllProducts(true);
      await updateSiteSettings({ allProductsImage: url });
      
      try {
        const cachedRaw = localStorage.getItem('mg_site_settings_cache');
        const cachedSettings = cachedRaw ? JSON.parse(cachedRaw) : {};
        cachedSettings.allProductsImage = url;
        localStorage.setItem('mg_site_settings_cache', JSON.stringify(cachedSettings));
        window.dispatchEvent(new CustomEvent('mg_site_settings_updated', { detail: cachedSettings }));
      } catch {}

      await recordAuditLog({
        adminUid: user?.uid || '',
        adminEmail: user?.email || '',
        action: 'UPDATE_ALL_PRODUCTS_IMAGE',
        targetType: 'SETTINGS',
        targetId: 'allProductsImage',
        details: { imageUrl: url }
      });

      setAllProductsSuccess(true);
      setTimeout(() => setAllProductsSuccess(false), 3000);
    } catch (err: any) {
      alert("Failed to upload image: " + err.message);
    } finally {
      setUploadingAllProducts(false);
      setSavingAllProducts(false);
      if (allProductsFileInputRef.current) {
        allProductsFileInputRef.current.value = '';
      }
    }
  };

  const handleResetAllProductsImg = async () => {
    if (!window.confirm("All Products কার্ডের ছবিটি ডিফল্ট ছবিতে রিসেট করতে চান?")) return;
    
    setSavingAllProducts(true);
    try {
      const defaultImg = '/categories/all-products.png';
      setAllProductsImg(defaultImg);
      await updateSiteSettings({ allProductsImage: defaultImg });
      try {
        const cachedRaw = localStorage.getItem('mg_site_settings_cache');
        const cachedSettings = cachedRaw ? JSON.parse(cachedRaw) : {};
        cachedSettings.allProductsImage = defaultImg;
        localStorage.setItem('mg_site_settings_cache', JSON.stringify(cachedSettings));
        window.dispatchEvent(new CustomEvent('mg_site_settings_updated', { detail: cachedSettings }));
      } catch {}
      setAllProductsSuccess(true);
      setTimeout(() => setAllProductsSuccess(false), 3000);
    } catch (err: any) {
      alert("Failed to reset: " + err.message);
    } finally {
      setSavingAllProducts(false);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingId) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadProgress(20);
      const path = `categories/icon_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const url = await uploadImageWithFallback(file, path, setUploadProgress);
      setImage(url);
    } catch (err: any) {
      alert("Failed to upload icon image: " + err.message);
    } finally {
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setOrder(0);
    setImage('');
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    try {
      const categoryPayload = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        order: Number(order) || 0,
        image: image.trim() || undefined,
        isActive: true
      };

      if (editingId) {
        await updateCategory(editingId, categoryPayload);
        await recordAuditLog({
          adminUid: user?.uid || '',
          adminEmail: user?.email || '',
          action: 'UPDATE_CATEGORY',
          targetType: 'CATEGORY',
          targetId: editingId,
          details: { name, image }
        });
      } else {
        const newId = await createCategory(categoryPayload);
        await recordAuditLog({
          adminUid: user?.uid || '',
          adminEmail: user?.email || '',
          action: 'CREATE_CATEGORY',
          targetType: 'CATEGORY',
          targetId: newId,
          details: { name, image }
        });
      }

      resetForm();
      await loadData();
    } catch (err: any) {
      alert("Error saving category: " + err.message);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setOrder(cat.order || 0);
    setImage(cat.image || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, catName: string) => {
    if (window.confirm(`Delete category "${catName}"?`)) {
      try {
        await deleteCategory(id);
        await recordAuditLog({
          adminUid: user?.uid || '',
          adminEmail: user?.email || '',
          action: 'DELETE_CATEGORY',
          targetType: 'CATEGORY',
          targetId: id,
          details: { catName }
        });
        setCategories(categories.filter(c => c.id !== id));
      } catch (err: any) {
        alert("Failed to delete category: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Categories Management</h1>
        <p className="text-xs text-slate-500 mt-1">Organize graphic resources, templates, and apps with custom icons</p>
      </div>

      {/* ================= ALL PRODUCTS 1ST CARD CUSTOMIZER ================= */}
      <div className="bg-gradient-to-r from-slate-900 via-[#180a33] to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-24 sm:w-32 aspect-[4/3] rounded-2xl overflow-hidden border-2 border-purple-400/50 shadow-lg shrink-0 relative bg-black/60 group">
            <img
              src={allProductsImg || '/categories/all-products.png'}
              alt="All Products Card"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />
            <span className="absolute bottom-1.5 left-1.5 right-1.5 text-center text-[9px] font-black uppercase tracking-wider bg-black/75 backdrop-blur-xs text-purple-300 py-0.5 rounded">
              Current Card
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-400/30">
                Home Collections 1st Card
              </span>
              {allProductsSuccess && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3 h-3" /> Saved Live!
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-black text-white mt-1.5">
              All Products Card Picture (প্রথম কার্ডের ছবি)
            </h2>
            <p className="text-xs text-purple-200/80 mt-0.5 max-w-xl leading-relaxed">
              হোমপেজের Collections সেকশনের একদম প্রথম কার্ড ("All Products")-এর ছবি ও আইকন এখান থেকে সরাসরি পরিবর্তন করতে পারবেন।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
          <input
            ref={allProductsFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAllProductsUpload}
            disabled={uploadingAllProducts || savingAllProducts}
            className="hidden"
            id="all-products-file-input"
          />
          <button
            type="button"
            onClick={() => allProductsFileInputRef.current?.click()}
            disabled={uploadingAllProducts || savingAllProducts}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{uploadingAllProducts ? "Uploading..." : savingAllProducts ? "Saving..." : "Change Image (ছবি পরিবর্তন)"}</span>
          </button>

          {allProductsImg && allProductsImg !== '/categories/all-products.png' && (
            <button
              type="button"
              onClick={handleResetAllProductsImg}
              disabled={savingAllProducts}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition-all border border-white/10 cursor-pointer"
              title="ডিফল্ট ছবিতে রিসেট করুন"
            >
              Reset Default
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Create / Edit Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              {editingId ? "Edit Category" : "Add New Category"}
            </h2>
            {editingId && (
              <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Editing
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs text-slate-700">
            <div>
              <label className="font-semibold block mb-1 text-slate-800">Category Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. ElevenLabs, WordPress, Themes"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-slate-800">Slug (URL) *</label>
              <input
                type="text"
                required
                placeholder="e.g. elevenlabs, themes, logo-design"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
              />
            </div>

            {/* ================= CATEGORY PHOTO / ICON UPLOAD (DIRECT FROM DEVICE / MOBILE) ================= */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
              <label className="font-bold text-slate-900 block flex items-center justify-between">
                <span>Category Photo / Icon *</span>
                <span className="text-[10px] text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  300x225 (4:3 Card)
                </span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleIconUpload}
                disabled={uploadProgress !== null}
                className="hidden"
                id="category-icon-file-input"
              />

              {image ? (
                /* Uploaded Photo Preview Card */
                <div className="space-y-2">
                  <div className="relative group w-44 aspect-[4/3] rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-md bg-[#0d0524] mx-auto">
                    <img
                      src={image}
                      alt="Category Photo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label
                        htmlFor="category-icon-file-input"
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer text-[11px] font-bold transition-all shadow"
                      >
                        Change
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-all shadow"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center gap-2">
                    <label
                      htmlFor="category-icon-file-input"
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer font-semibold"
                    >
                      Change Photo
                    </label>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                /* Upload Box - Direct click to select from PC or mobile gallery */
                <label
                  htmlFor="category-icon-file-input"
                  className={`w-full py-6 border-2 border-dashed border-purple-300 hover:border-purple-600 rounded-2xl flex flex-col items-center justify-center gap-2 bg-white hover:bg-purple-50/40 cursor-pointer transition-all ${
                    uploadProgress !== null ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-xs text-slate-800 block">
                      {uploadProgress !== null ? `Uploading ${uploadProgress}%...` : 'Click to Upload Photo from Device / Mobile'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      PNG, JPG, SVG, WebP (Like Adobe CC, All Products card)
                    </span>
                  </div>
                </label>
              )}

              {/* Optional URL input */}
              <div className="pt-1">
                <input
                  type="url"
                  placeholder="Or paste image URL (https://... or /categories/...)"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-slate-800">Display Order</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-slate-800">Description (Optional)</label>
              <textarea
                rows={2}
                placeholder="Brief description for SEO and category banner..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex gap-2 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={uploadProgress !== null}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {editingId ? "Update Category" : "Save Category"}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Categories Table */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Existing Categories ({categories.length})
            </h2>
            <span className="text-[11px] text-slate-400">
              Drag or set Order number to rearrange
            </span>
          </div>

          {loading ? (
            <TableSkeleton rows={4} />
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">
              No categories created yet. Use the form on the left to add your first category.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="pb-3 px-2">Icon</th>
                    <th className="pb-3 px-2">Name</th>
                    <th className="pb-3 px-2">Slug</th>
                    <th className="pb-3 px-2 text-center">Order</th>
                    <th className="pb-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-2">
                        <div className="w-10 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 shadow-xs overflow-hidden">
                          <CategoryIcon image={c.image} icon={c.icon} className="w-4 h-4 text-blue-400" imgClassName="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="py-3 px-2 font-bold text-slate-900">
                        {c.name}
                        {c.description && (
                          <span className="block text-[10px] font-normal text-slate-400 truncate max-w-[200px]">
                            {c.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-slate-500 font-mono text-[11px]">{c.slug}</td>
                      <td className="py-3 px-2 text-center font-semibold text-slate-700">{c.order ?? 0}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Category"
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
          )}
        </div>

      </div>
    </div>
  );
};
