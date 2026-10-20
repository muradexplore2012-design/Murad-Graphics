import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';

// Layouts
import { Layout } from './components/layout/Layout';
import { AdminLayout } from './components/layout/AdminLayout';

// Customer Pages
import { HomePage } from './pages/customer/HomePage';
import { ShopPage } from './pages/customer/ShopPage';
import { CategoryPage } from './pages/customer/CategoryPage';
import { ProductDetailPage } from './pages/customer/ProductDetailPage';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrderDetailPage } from './pages/customer/OrderDetailPage';
import { AccountPage } from './pages/customer/AccountPage';
import { DownloadsPage } from './pages/customer/DownloadsPage';
import { WishlistPage } from './pages/customer/WishlistPage';
import { LoginPage } from './pages/customer/LoginPage';
import { NotFoundPage } from './pages/customer/NotFoundPage';

// Static info pages
import { 
  AboutPage, 
  ContactPage, 
  LicensePolicyPage, 
  RefundPolicyPage, 
  TermsPage, 
  PrivacyPage, 
  FaqPage 
} from './pages/customer/StaticPages';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminProductFormPage } from './pages/admin/AdminProductFormPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminBannersPage } from './pages/admin/AdminBannersPage';
import { AdminFooterSocialPage } from './pages/admin/AdminFooterSocialPage';
import { AdminReviewsPage, AdminDownloadAuditPage } from './pages/admin/AdminExtrasPages';
import { AccessDeniedPage } from './pages/admin/AccessDeniedPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
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
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
