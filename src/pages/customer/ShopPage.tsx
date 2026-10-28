import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { 
  Filter, 
  X, 
  SlidersHorizontal, 
  Search, 
  Check, 
  Tag, 
  Sparkles 
} from 'lucide-react';
import { getProducts, getCategories } from '../../services/api';
import { Product, Category } from '../../types';
import { ProductCard } from '../../components/ui/ProductCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProductCardSkeleton } from '../../components/ui/Skeletons';

const FORMAT_OPTIONS = ['AI', 'EPS', 'PSD', 'SVG', 'PNG', 'PDF', 'ZIP', 'APK', 'EXE'];

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Lock body scroll when mobile filter is open
  useEffect(() => {
    if (mobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFilterOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileFilterOpen) {
        setMobileFilterOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileFilterOpen]);

  // Filter state
  const selectedCategory = searchParams.get('category') || '';
  const priceType = searchParams.get('type') || 'all'; // 'all' | 'free' | 'paid'
  const searchQuery = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort') || 'newest'; // 'newest' | 'price_asc' | 'price_desc' | 'popular'
  const selectedFormat = searchParams.get('format') || '';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [prodList, catList] = await Promise.all([
          getProducts({ onlyActive: true }),
          getCategories(true)
        ]);
        setProducts(prodList);
        setCategories(catList);
      } catch (err) {
        console.error("Error fetching shop data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Filter and sort products client-side efficiently without downloading extra unnecessary data
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory && p.categoryId !== selectedCategory && p.slug !== selectedCategory) {
        return false;
      }
      // Price filter
      if (priceType === 'free' && !p.isFree) return false;
      if (priceType === 'paid' && p.isFree) return false;

      // Format filter
      if (selectedFormat && !p.formats.includes(selectedFormat)) {
        return false;
      }

      // Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.shortDescription?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
        const matchesTags = p.tags?.some(t => t.toLowerCase().includes(q));
        const matchesCat = p.categoryName?.toLowerCase().includes(q);
        const matchesType = p.productType?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesTags && !matchesCat && !matchesType) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'popular') return (b.downloadCount || 0) - (a.downloadCount || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // newest
    });
  }, [products, selectedCategory, priceType, selectedFormat, searchQuery, sortBy]);

  const activeFilterCount = (selectedCategory ? 1 : 0) + (priceType !== 'all' ? 1 : 0) + (selectedFormat ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Digital Asset Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing <span className="font-semibold text-slate-800">{filteredProducts.length}</span> verified products
          </p>
        </div>

        {/* Sort & Mobile filter trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm active:scale-95 transition-all"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#7a00ea]" />
            <span>Filters {activeFilterCount > 0 && <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-[#7a00ea] text-white text-[10px] font-bold">{activeFilterCount}</span>}</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Downloaded</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Filters - Desktop */}
        <aside className="hidden lg:block space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 sticky top-28">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" /> Filters
              </span>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-rose-600 font-semibold hover:underline"
                >
                  Reset all
                </button>
              )}
            </div>

            {/* Pricing Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pricing Type</label>
              <div className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                <button
                  onClick={() => updateFilter('type', 'all')}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                    priceType === 'all' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <span>All Items</span>
                  {priceType === 'all' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <button
                  onClick={() => updateFilter('type', 'free')}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                    priceType === 'free' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <span>Free Only</span>
                  {priceType === 'free' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => updateFilter('type', 'paid')}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                    priceType === 'paid' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <span>Paid Only (BDT)</span>
                  {priceType === 'paid' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              </div>
            </div>

            {/* Categories Filter */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categories</label>
              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto no-scrollbar text-xs font-medium text-slate-700">
                <button
                  onClick={() => updateFilter('category', '')}
                  className={`px-3 py-2 rounded-xl text-left transition-all ${
                    !selectedCategory ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => updateFilter('category', c.id)}
                    className={`px-3 py-2 rounded-xl text-left transition-all flex items-center justify-between ${
                      selectedCategory === c.id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    {selectedCategory === c.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Formats Filter */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">File Format</label>
              <div className="flex flex-wrap gap-1.5">
                {FORMAT_OPTIONS.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => updateFilter('format', selectedFormat === fmt ? '' : fmt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                      selectedFormat === fmt
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title="No products matched your criteria"
              description="Try adjusting or clearing your search filters to find what you're looking for."
              actionLabel="Clear Filters"
              onActionClick={clearAllFilters}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>

      </div>

      {/* Mobile Filters Drawer Portal */}
      {typeof document !== 'undefined' && createPortal(
        <div className="lg:hidden">
          {/* Backdrop - darkens the ENTIRE viewport including sticky Header and BottomNavigation */}
          <div 
            className={`fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[999] transition-opacity duration-300 ease-in-out ${
              mobileFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setMobileFilterOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in from Left Drawer Panel */}
          <aside 
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] h-full bg-white z-[1000] shadow-2xl flex flex-col justify-between border-r border-slate-200 rounded-r-2xl sm:rounded-r-3xl transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              mobileFilterOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Top Header & Scrollable content with top safe-area padding */}
            <div className="flex-1 overflow-y-auto p-5 pt-[max(1.25rem,env(safe-area-inset-top,16px))] space-y-6 overscroll-contain">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7a00ea] text-white text-xs font-bold shadow-sm shadow-purple-600/20">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
                </div>
                <button 
                  onClick={() => setMobileFilterOpen(false)} 
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Pricing filter */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pricing</span>
                <div className="space-y-1">
                  {[
                    { id: 'all', label: 'All Items' },
                    { id: 'free', label: 'Free Only' },
                    { id: 'paid', label: 'Paid Only (BDT)' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => updateFilter('type', t.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        priceType === t.id 
                          ? 'bg-[#7a00ea] text-white shadow-sm' 
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{t.label}</span>
                      {priceType === t.id && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category filter */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</span>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  <button
                    onClick={() => updateFilter('category', '')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      !selectedCategory 
                        ? 'bg-[#7a00ea] text-white shadow-sm' 
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>All Categories</span>
                    {!selectedCategory && <Check className="w-4 h-4 text-white" />}
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => updateFilter('category', c.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        selectedCategory === c.id 
                          ? 'bg-[#7a00ea] text-white shadow-sm' 
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      {selectedCategory === c.id && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formats Filter */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">File Format</span>
                <div className="flex flex-wrap gap-1.5">
                  {FORMAT_OPTIONS.map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => updateFilter('format', selectedFormat === fmt ? '' : fmt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                        selectedFormat === fmt
                          ? 'bg-[#7a00ea] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions with bottom safe-area padding */}
            <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom,16px))] border-t border-slate-100 bg-white/95 backdrop-blur-xs flex gap-2 shrink-0">
              <button
                onClick={clearAllFilters}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 active:scale-98 transition-all"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-1/2 py-2.5 rounded-xl bg-[#7a00ea] hover:bg-[#6c00d4] text-white text-xs font-bold shadow-md shadow-purple-600/20 active:scale-98 transition-all"
              >
                Apply {filteredProducts.length > 0 ? `(${filteredProducts.length})` : ''}
              </button>
            </div>
          </aside>
        </div>,
        document.body
      )}

    </div>
  );
};
