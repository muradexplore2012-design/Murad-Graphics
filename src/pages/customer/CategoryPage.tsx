import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProducts, getCategories } from '../../services/api';
import { Product, Category } from '../../types';
import { ProductCard } from '../../components/ui/ProductCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProductCardSkeleton } from '../../components/ui/Skeletons';
import { Layers } from 'lucide-react';
import { CategoryIcon } from '../../components/ui/CategoryIcon';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const categories = await getCategories(false);
        const matched = categories.find((c) => c.slug === slug || c.id === slug);
        setCurrentCategory(matched || null);

        if (matched) {
          const prods = await getProducts({ categoryId: matched.id });
          setProducts(prods);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Error loading category:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="h-10 bg-slate-200 rounded-xl w-1/3 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <EmptyState
          icon={<Layers className="w-8 h-8 text-blue-600" />}
          title="Category Not Found"
          description={`We couldn't find a category matching "${slug}".`}
          actionLabel="Return to Shop"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Category banner header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-10 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 text-white shadow-lg">
            <CategoryIcon image={currentCategory.image} icon={currentCategory.icon} className="w-6 h-6 sm:w-8 sm:h-8 text-blue-200" imgClassName="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
          </div>
          <div className="min-w-0">
            <nav className="text-xs text-blue-200 mb-1.5 flex items-center gap-1.5 font-medium flex-wrap">
              <Link to="/" className="hover:underline">Home</Link>
              <span>/</span>
              <Link to="/shop" className="hover:underline">Categories</Link>
              <span>/</span>
              <span className="text-white truncate">{currentCategory.name}</span>
            </nav>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight break-words">{currentCategory.name}</h1>
            {currentCategory.description && (
              <p className="text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed">{currentCategory.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Category product catalog */}
      <div>
        {products.length === 0 ? (
          <EmptyState
            title="No products in this category yet"
            description={`No digital resources have been published under ${currentCategory.name} yet.`}
            actionLabel="Browse other categories"
            actionHref="/shop"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
