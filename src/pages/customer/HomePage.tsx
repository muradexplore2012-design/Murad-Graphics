import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  FolderOpen,
  Flame,
  CheckCircle2,
  Mail,
  MessageSquare
} from 'lucide-react';
import { 
  getProducts, 
  getCategories, 
  getBanners 
} from '../../services/api';
import { Product, Category, Banner } from '../../types';
import { ProductCard } from '../../components/ui/ProductCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProductCardSkeleton } from '../../components/ui/Skeletons';
import { CategoryIcon } from '../../components/ui/CategoryIcon';

// Demo sample banners if admin has not uploaded any banners yet
const SAMPLE_SLIDERS: Banner[] = [
  {
    id: 'demo-slider-1',
    title: 'Murad Graphics Premium Digital Marketplace',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
    ctaLink: '/shop',
    placement: 'slider',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-slider-2',
    title: 'Website Themes & Graphic Assets',
    imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1600&q=80',
    ctaLink: '/shop',
    placement: 'slider',
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-slider-3',
    title: 'Professional Graphic Design Templates & Mockups',
    imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1600&q=80',
    ctaLink: '/shop',
    placement: 'slider',
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString()
  }
];

const SAMPLE_SIDE_TOP: Banner = {
  id: 'demo-side-top',
  title: 'LinkedIn Premium Up To 90% Discount',
  imageUrl: 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?auto=format&fit=crop&w=1000&q=80',
  ctaLink: '/shop',
  placement: 'side_top',
  isActive: true,
  order: 1,
  createdAt: new Date().toISOString()
};

const SAMPLE_SIDE_BOTTOM_LEFT: Banner = {
  id: 'demo-side-bl',
  title: 'Windows 11 Professional',
  imageUrl: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=600&q=80',
  ctaLink: '/shop',
  placement: 'side_bottom_left',
  isActive: true,
  order: 2,
  createdAt: new Date().toISOString()
};

const SAMPLE_SIDE_BOTTOM_RIGHT: Banner = {
  id: 'demo-side-br',
  title: 'ChatGPT Plus Be Faster',
  imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80',
  ctaLink: '/shop',
  placement: 'side_bottom_right',
  isActive: true,
  order: 3,
  createdAt: new Date().toISOString()
};

export const HomePage: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>(() => {
    try {
      const saved = sessionStorage.getItem('mg_cache_home_products') || localStorage.getItem('mg_cache_home_products') || sessionStorage.getItem('mg_cache_home_featured');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [productFilter, setProductFilter] = useState<'all' | 'paid' | 'free'>('all');
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = sessionStorage.getItem('mg_client_categories_cache') || localStorage.getItem('mg_client_categories_cache');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [sliderBanners, setSliderBanners] = useState<Banner[]>(() => {
    try {
      const saved = sessionStorage.getItem('mg_cache_home_sliders');
      if (saved) return JSON.parse(saved);
    } catch {}
    return SAMPLE_SLIDERS;
  });
  const [sideTopPoster, setSideTopPoster] = useState<Banner | null>(() => {
    try {
      const saved = sessionStorage.getItem('mg_cache_home_top_poster');
      if (saved) return JSON.parse(saved);
    } catch {}
    return SAMPLE_SIDE_TOP;
  });
  const [sideBottomLeftPoster, setSideBottomLeftPoster] = useState<Banner | null>(() => {
    try {
      const saved = sessionStorage.getItem('mg_cache_home_bl_poster');
      if (saved) return JSON.parse(saved);
    } catch {}
    return SAMPLE_SIDE_BOTTOM_LEFT;
  });
  const [sideBottomRightPoster, setSideBottomRightPoster] = useState<Banner | null>(() => {
    try {
      const saved = sessionStorage.getItem('mg_cache_home_br_poster');
      if (saved) return JSON.parse(saved);
    } catch {}
    return SAMPLE_SIDE_BOTTOM_RIGHT;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem('mg_cache_home_products') || localStorage.getItem('mg_cache_home_products') || sessionStorage.getItem('mg_cache_home_featured');
      if (saved && JSON.parse(saved).length > 0) return false;
    } catch {}
    return true;
  });

  // Hero Slider State (smooth fade & slide)
  const [currentSlide, setCurrentSlide] = useState(0);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollCategoriesLeft, setCanScrollCategoriesLeft] = useState(false);
  const [canScrollCategoriesRight, setCanScrollCategoriesRight] = useState(false);
  const [hasCategoriesOverflow, setHasCategoriesOverflow] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [activeProducts, cats, bannerList] = await Promise.all([
          getProducts({ onlyActive: true }),
          getCategories(true),
          getBanners(true)
        ]);

        if (!isMounted) return;

        const sliders: Banner[] = [];
        let topPoster: Banner | null = null;
        let blPoster: Banner | null = null;
        let brPoster: Banner | null = null;
        const generalPosters: Banner[] = [];

        bannerList.forEach((b) => {
          if (b.placement === 'side_top') {
            topPoster = b;
          } else if (b.placement === 'side_bottom_left') {
            blPoster = b;
          } else if (b.placement === 'side_bottom_right') {
            brPoster = b;
          } else if (b.placement === 'poster') {
            generalPosters.push(b);
          } else {
            // Default or placement === 'slider'
            sliders.push(b);
          }
        });

        // Distribute general posters into empty slots if any
        if (!topPoster && generalPosters.length > 0) topPoster = generalPosters[0];
        if (!blPoster && generalPosters.length > 1) blPoster = generalPosters[1];
        if (!brPoster && generalPosters.length > 2) brPoster = generalPosters[2];

        // Sort all products: featured first, then newest
        const sortedProducts = [...activeProducts].sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        const finalSliders = sliders.length > 0 ? sliders : SAMPLE_SLIDERS;
        const finalTop = topPoster || SAMPLE_SIDE_TOP;
        const finalBl = blPoster || SAMPLE_SIDE_BOTTOM_LEFT;
        const finalBr = brPoster || SAMPLE_SIDE_BOTTOM_RIGHT;

        setAllProducts(sortedProducts);
        setCategories(cats);
        setSliderBanners(finalSliders);
        setSideTopPoster(finalTop);
        setSideBottomLeftPoster(finalBl);
        setSideBottomRightPoster(finalBr);

        // Cache for ultra-fast instant refresh
        try {
          sessionStorage.setItem('mg_cache_home_products', JSON.stringify(sortedProducts));
          localStorage.setItem('mg_cache_home_products', JSON.stringify(sortedProducts));
          sessionStorage.setItem('mg_client_categories_cache', JSON.stringify(cats));
          localStorage.setItem('mg_client_categories_cache', JSON.stringify(cats));
          sessionStorage.setItem('mg_cache_home_sliders', JSON.stringify(finalSliders));
          sessionStorage.setItem('mg_cache_home_top_poster', JSON.stringify(finalTop));
          sessionStorage.setItem('mg_cache_home_bl_poster', JSON.stringify(finalBl));
          sessionStorage.setItem('mg_cache_home_br_poster', JSON.stringify(finalBr));
        } catch {}
      } catch (e) {
        console.error("Error loading homepage data:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  // Automatic hero slide interval if multiple sliders exist (ONLY left hero slider slides!)
  useEffect(() => {
    if (sliderBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderBanners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [sliderBanners.length]);

  const handlePrevSlide = () => {
    if (sliderBanners.length <= 1) return;
    setCurrentSlide((prev) => (prev === 0 ? sliderBanners.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    if (sliderBanners.length <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % sliderBanners.length);
  };

  const checkCategoryScroll = () => {
    const el = categoriesScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Only consider overflow if content exceeds viewport by at least 10px
    const overflow = scrollWidth > clientWidth + 10;
    setHasCategoriesOverflow(overflow);
    setCanScrollCategoriesLeft(overflow && scrollLeft > 10);
    setCanScrollCategoriesRight(overflow && scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    const timer = setTimeout(checkCategoryScroll, 150);
    const el = categoriesScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkCategoryScroll);
    }
    window.addEventListener('resize', checkCategoryScroll);

    return () => {
      clearTimeout(timer);
      if (el) el.removeEventListener('scroll', checkCategoryScroll);
      window.removeEventListener('resize', checkCategoryScroll);
    };
  }, [categories]);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesScrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      categoriesScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkCategoryScroll, 350);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      
      {/* ================= HERO SECTION (LEFT MAIN SLIDER + RIGHT PROMO POSTERS) ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
          
          {/* ================= LEFT: MAIN HERO SLIDER (Circled Section - ONLY THIS SLIDES) ================= */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="relative w-full aspect-[1024/440] min-h-[145px] lg:aspect-auto lg:h-[345px] xl:h-[355px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-950 group">
              
              {/* Slider Slides with Smooth Fade/Slide */}
              {sliderBanners.map((slide, index) => {
                const isActive = index === currentSlide;
                const isExternal = slide.ctaLink?.startsWith('http');
                return (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${
                      isActive 
                        ? 'opacity-100 scale-100 pointer-events-auto z-10' 
                        : 'opacity-0 scale-105 pointer-events-none z-0'
                    }`}
                  >
                    {isExternal ? (
                      <a href={slide.ctaLink} target="_blank" rel="noopener noreferrer" className="block w-full h-full overflow-hidden">
                        <img
                          src={slide.imageUrl}
                          alt={slide.title || 'Murad Graphics Banner'}
                          loading={index === 0 ? "eager" : "lazy"}
                          decoding="async"
                          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      </a>
                    ) : (
                      <Link to={slide.ctaLink || '/shop'} className="block w-full h-full overflow-hidden">
                        <img
                          src={slide.imageUrl}
                          alt={slide.title || 'Murad Graphics Banner'}
                          loading={index === 0 ? "eager" : "lazy"}
                          decoding="async"
                          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      </Link>
                    )}
                  </div>
                );
              })}

              {/* Navigation Arrows for Slider (only if multiple slides exist) */}
              {sliderBanners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:scale-95 shadow-md"
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextSlide}
                    className="absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:scale-95 shadow-md"
                    aria-label="Next Slide"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Pure Micro Dot indicators - Lower down and smaller */}
                  <div className="absolute bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-1.5">
                    {sliderBanners.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentSlide(i)}
                        className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          i === currentSlide
                            ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)] scale-125'
                            : 'bg-white/40 hover:bg-white/80'
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}

            </div>
          </div>

          {/* ================= MOBILE VIEW: TRUST BADGES BAR ================= */}
          <div className="lg:hidden col-span-1 mt-4 sm:mt-5 mb-1">
            <div className="flex items-center justify-between py-3.5 px-2.5 sm:px-4 rounded-2xl bg-white border border-purple-100/70 shadow-xs divide-x divide-slate-100">
              
              {/* 100% Genuine */}
              <div className="flex-1 flex items-center justify-center gap-1.5 px-1 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-purple-50 text-[#7a00ea] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="font-bold text-[11px] sm:text-xs text-slate-800 whitespace-nowrap">
                  100% Genuine
                </span>
              </div>

              {/* Fast Delivery */}
              <div className="flex-1 flex items-center justify-center gap-1.5 px-1 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-purple-50 text-[#7a00ea] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="font-bold text-[11px] sm:text-xs text-slate-800 whitespace-nowrap">
                  Fast Delivery
                </span>
              </div>

              {/* Live Support */}
              <div className="flex-1 flex items-center justify-center gap-1.5 px-1 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-purple-50 text-[#7a00ea] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="font-bold text-[11px] sm:text-xs text-slate-800 whitespace-nowrap">
                  Live Support
                </span>
              </div>

            </div>
          </div>

          {/* ================= DESKTOP: SIDE PROMO POSTERS (Fixed Promos, Does Not Slide) ================= */}
          <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col gap-3 sm:gap-4 lg:h-[345px] xl:h-[355px]">
            
            {/* Top Poster (Wide banner) - Hidden on mobile, visible on tablet/desktop */}
            {sideTopPoster && (
              <div className="hidden md:block w-full md:h-[175px] lg:h-[185px] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm group relative bg-slate-950 shrink-0">
                {sideTopPoster.ctaLink?.startsWith('http') ? (
                  <a href={sideTopPoster.ctaLink} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <img
                      src={sideTopPoster.imageUrl}
                      alt={sideTopPoster.title || 'Special Promotion'}
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </a>
                ) : (
                  <Link to={sideTopPoster.ctaLink || '/shop'} className="block w-full h-full">
                    <img
                      src={sideTopPoster.imageUrl}
                      alt={sideTopPoster.title || 'Special Promotion'}
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                )}
              </div>
            )}

            {/* Bottom 2 Posters (Side by side) */}
            <div className={`grid ${sideBottomLeftPoster && sideBottomRightPoster ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5 sm:gap-4 h-[112px] min-[390px]:h-[120px] sm:h-[125px] md:h-[135px] lg:h-[145px]`}>
              
              {/* Bottom Left Poster */}
              {sideBottomLeftPoster && (
                <div className="w-full h-full rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm group relative bg-slate-950">
                  {sideBottomLeftPoster.ctaLink?.startsWith('http') ? (
                    <a href={sideBottomLeftPoster.ctaLink} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                      <img
                        src={sideBottomLeftPoster.imageUrl}
                        alt={sideBottomLeftPoster.title || 'Deal'}
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    </a>
                  ) : (
                    <Link to={sideBottomLeftPoster.ctaLink || '/shop'} className="block w-full h-full">
                      <img
                        src={sideBottomLeftPoster.imageUrl}
                        alt={sideBottomLeftPoster.title || 'Deal'}
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                  )}
                </div>
              )}

              {/* Bottom Right Poster */}
              {sideBottomRightPoster && (
                <div className="w-full h-full rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm group relative bg-slate-950">
                  {sideBottomRightPoster.ctaLink?.startsWith('http') ? (
                    <a href={sideBottomRightPoster.ctaLink} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                      <img
                        src={sideBottomRightPoster.imageUrl}
                        alt={sideBottomRightPoster.title || 'Deal'}
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    </a>
                  ) : (
                    <Link to={sideBottomRightPoster.ctaLink || '/shop'} className="block w-full h-full">
                      <img
                        src={sideBottomRightPoster.imageUrl}
                        alt={sideBottomRightPoster.title || 'Deal'}
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* ================= CATEGORIES SECTION (CAROUSEL SLIDER WITH OVERFLOW-ONLY ARROWS) ================= */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header: Collections */}
          <div className="mb-2 sm:mb-2.5">
            <h2 className="text-xs sm:text-sm font-bold text-purple-600 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Collections
            </h2>
          </div>

          <div className="relative group">
            {/* Left Scroll Arrow */}
            {hasCategoriesOverflow && canScrollCategoriesLeft && (
              <button
                type="button"
                onClick={() => scrollCategories('left')}
                className="absolute -left-1.5 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/95 hover:bg-purple-600 text-white border border-white/30 backdrop-blur-md flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                aria-label="Previous Category"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Scrollable Categories Row */}
            <div
              ref={categoriesScrollRef}
              className="flex items-center gap-2.5 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth px-0.5 py-1 sm:py-2.5"
            >
              {/* All Products First Card */}
              <Link
                to="/shop"
                className="shrink-0 w-28 sm:w-52 aspect-[4/3] rounded-xl sm:rounded-3xl overflow-hidden border sm:border-2 border-purple-500/50 hover:border-purple-400 shadow-sm sm:shadow-[0_0_18px_rgba(147,51,234,0.25)] hover:shadow-[0_0_28px_rgba(168,85,247,0.55)] transition-all duration-300 hover:scale-105 active:scale-95 group/card relative bg-[#0d0524]"
              >
                <img
                  src="/categories/all-products.png"
                  alt="All Products"
                  className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                />
              </Link>

              {/* Dynamic categories from Firestore */}
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="shrink-0 w-28 sm:w-52 aspect-[4/3] rounded-xl sm:rounded-3xl overflow-hidden border sm:border-2 border-purple-500/50 hover:border-purple-400 shadow-sm sm:shadow-[0_0_18px_rgba(147,51,234,0.25)] hover:shadow-[0_0_28px_rgba(168,85,247,0.55)] transition-all duration-300 hover:scale-105 active:scale-95 group/card relative bg-[#0d0524]"
                >
                  {cat.image ? (
                    <img 
                      src={cat.image} 
                      alt={cat.name} 
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-[#1b0a38] via-[#0d0424] to-[#070114] flex flex-col justify-between p-2 sm:p-4 text-center">
                      <div className="flex-1 w-full flex items-center justify-center min-h-0 pt-0.5">
                        <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl bg-purple-600/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-[0_0_16px_rgba(168,85,247,0.3)] group-hover/card:bg-purple-600 group-hover/card:text-white transition-all duration-300">
                          <CategoryIcon icon={cat.icon} className="w-4 h-4 sm:w-7 sm:h-7" />
                        </div>
                      </div>
                      <div className="w-full pb-0.5">
                        <span className="font-bold text-[10px] sm:text-sm text-slate-100 group-hover/card:text-purple-200 transition-colors block truncate drop-shadow-sm">
                          {cat.name}
                        </span>
                        <div className="relative flex items-center justify-center w-8 sm:w-16 h-0.5 sm:h-1 mx-auto mt-0.5 sm:mt-1.5 group-hover/card:w-20 transition-all duration-300">
                          <span className="absolute inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
                          <span className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-300 shadow-[0_0_6px_rgba(192,132,252,1)]" />
                        </div>
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Right Scroll Arrow */}
            {hasCategoriesOverflow && canScrollCategoriesRight && (
              <button
                type="button"
                onClick={() => scrollCategories('right')}
                className="absolute -right-1.5 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/95 hover:bg-purple-600 text-white border border-white/30 backdrop-blur-md flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                aria-label="Next Category"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </section>
      )}

      {/* ================= PRODUCT SECTIONS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* All Products (Free & Paid) */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> All Digital Resources
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Explore Products
              </h2>
            </div>

            {/* Quick Filter: All | Premium | Free */}
            <div className="flex items-center gap-2 flex-wrap">
              {allProducts.length > 0 && (
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setProductFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      productFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({allProducts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductFilter('paid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      productFilter === 'paid'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    💎 Premium ({allProducts.filter(p => !p.isFree).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductFilter('free')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      productFilter === 'free'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🎁 Free ({allProducts.filter(p => p.isFree).length})
                  </button>
                </div>
              )}

              <Link to="/shop" className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group ml-1">
                Browse Shop <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : allProducts.filter(p => productFilter === 'all' ? true : productFilter === 'free' ? p.isFree : !p.isFree).length === 0 ? (
            <EmptyState
              title="No products found"
              description="Digital assets and design files will be displayed here once published by the administrator."
              actionLabel="Explore All Products"
              actionHref="/shop"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {allProducts
                .filter(p => productFilter === 'all' ? true : productFilter === 'free' ? p.isFree : !p.isFree)
                .map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};
