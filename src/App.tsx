import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { getSiteSettings } from './services/api';

// Layouts
import { Layout } from './components/layout/Layout';
import { AdminLayout } from './components/layout/AdminLayout';

// Direct critical home page for immediate first paint
import { HomePage } from './pages/customer/HomePage';

// Lazy Customer Pages
const ShopPage = React.lazy(() => import('./pages/customer/ShopPage').then(m => ({ default: m.ShopPage })));
const CategoryPage = React.lazy(() => import('./pages/customer/CategoryPage').then(m => ({ default: m.CategoryPage })));
const ProductDetailPage = React.lazy(() => import('./pages/customer/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartPage = React.lazy(() => import('./pages/customer/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = React.lazy(() => import('./pages/customer/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderDetailPage = React.lazy(() => import('./pages/customer/OrderDetailPage').then(m => ({ default: m.OrderDetailPage })));
const AccountPage = React.lazy(() => import('./pages/customer/AccountPage').then(m => ({ default: m.AccountPage })));
const DownloadsPage = React.lazy(() => import('./pages/customer/DownloadsPage').then(m => ({ default: m.DownloadsPage })));
const WishlistPage = React.lazy(() => import('./pages/customer/WishlistPage').then(m => ({ default: m.WishlistPage })));
const LoginPage = React.lazy(() => import('./pages/customer/LoginPage').then(m => ({ default: m.LoginPage })));
const NotFoundPage = React.lazy(() => import('./pages/customer/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Lazy Static Pages
const AboutPage = React.lazy(() => import('./pages/customer/StaticPages').then(m => ({ default: m.AboutPage })));
const ContactPage = React.lazy(() => import('./pages/customer/StaticPages').then(m => ({ default: m.ContactPage })));
const LicensePolicyPage = React.lazy(() => import('./pages/customer/StaticPages').then(m => ({ default: m.LicensePolicyPage })));
const RefundPolicyPage = React.lazy(() => import('./pages/customer/StaticPages').then(m => ({ default: m.RefundPolicyPage })));
const TermsPage = React.lazy(() => import('./pages/customer/StaticPages').then(m => ({ default: m.TermsPage })));
const PrivacyPage = React.lazy(() => import('./pages/customer/StaticPages').then(m => ({ default: m.PrivacyPage })));
const FaqPage = React.lazy(() => import('./pages/customer/StaticPages').then(m => ({ default: m.FaqPage })));

// Lazy Admin Pages
const AdminLoginPage = React.lazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AccessDeniedPage = React.lazy(() => import('./pages/admin/AccessDeniedPage').then(m => ({ default: m.AccessDeniedPage })));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminProductsPage = React.lazy(() => import('./pages/admin/AdminProductsPage').then(m => ({ default: m.AdminProductsPage })));
const AdminProductFormPage = React.lazy(() => import('./pages/admin/AdminProductFormPage').then(m => ({ default: m.AdminProductFormPage })));
const AdminCategoriesPage = React.lazy(() => import('./pages/admin/AdminCategoriesPage').then(m => ({ default: m.AdminCategoriesPage })));
const AdminOrdersPage = React.lazy(() => import('./pages/admin/AdminOrdersPage').then(m => ({ default: m.AdminOrdersPage })));
const AdminCouponsPage = React.lazy(() => import('./pages/admin/AdminCouponsPage').then(m => ({ default: m.AdminCouponsPage })));
const AdminSettingsPage = React.lazy(() => import('./pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));
const AdminBannersPage = React.lazy(() => import('./pages/admin/AdminBannersPage').then(m => ({ default: m.AdminBannersPage })));
const AdminFooterSocialPage = React.lazy(() => import('./pages/admin/AdminFooterSocialPage').then(m => ({ default: m.AdminFooterSocialPage })));
const AdminReviewsPage = React.lazy(() => import('./pages/admin/AdminExtrasPages').then(m => ({ default: m.AdminReviewsPage })));
const AdminDownloadAuditPage = React.lazy(() => import('./pages/admin/AdminExtrasPages').then(m => ({ default: m.AdminDownloadAuditPage })));

const PageLoader: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center py-16">
    <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
  </div>
);

// Dynamic Site Title Synchronizer (Controlled from Admin Settings Panel)
const SiteTitleSync: React.FC = () => {
  useEffect(() => {
    const applyTitle = (title?: string, name?: string) => {
      if (title && title.trim()) {
        document.title = title.trim();
      } else if (name && name.trim()) {
        document.title = `${name.trim()} | Digital Marketplace`;
      }
    };

    // 1. Instant sync from local cache to prevent title flicker
    try {
      const cached = localStorage.getItem('mg_site_settings_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        applyTitle(parsed.siteTitle, parsed.siteName);
      }
    } catch {}

    // 2. Fetch latest settings from Firestore and apply
    getSiteSettings().then((s) => {
      applyTitle(s.siteTitle, s.siteName);
      try {
        localStorage.setItem('mg_site_settings_cache', JSON.stringify(s));
      } catch {}
    });
  }, []);

  return null;
};

export function App() {
  return (
    <BrowserRouter>
      <SiteTitleSync />
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                
                {/* Customer Website Routes */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="shop" element={<ShopPage />} />
                  <Route path="category/:slug" element={<CategoryPage />} />
                  <Route path="product/:slug" element={<ProductDetailPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="account" element={<AccountPage />} />
                  <Route path="account/orders/:id" element={<OrderDetailPage />} />
                  <Route path="account/downloads" element={<DownloadsPage />} />
                  <Route path="wishlist" element={<WishlistPage />} />
                  <Route path="login" element={<LoginPage />} />
                  
                  {/* Information pages */}
                  <Route path="about" element={<AboutPage />} />
                  <Route path="contact" element={<ContactPage />} />
                  <Route path="license-policy" element={<LicensePolicyPage />} />
                  <Route path="refund-policy" element={<RefundPolicyPage />} />
                  <Route path="terms" element={<TermsPage />} />
                  <Route path="privacy-policy" element={<PrivacyPage />} />
                  <Route path="faq" element={<FaqPage />} />

                  {/* 404 handler inside layout */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* Admin Portal Authentication */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin/access-denied" element={<AccessDeniedPage />} />

                {/* Protected Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="products/new" element={<AdminProductFormPage />} />
                  <Route path="products/:id" element={<AdminProductFormPage />} />
                  <Route path="categories" element={<AdminCategoriesPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="coupons" element={<AdminCouponsPage />} />
                  <Route path="reviews" element={<AdminReviewsPage />} />
                  <Route path="downloads" element={<AdminDownloadAuditPage />} />
                  <Route path="banners" element={<AdminBannersPage />} />
                  <Route path="footer" element={<AdminFooterSocialPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>

              </Routes>
            </Suspense>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
