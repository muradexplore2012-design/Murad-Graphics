import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  Heart, 
  User as UserIcon, 
  Menu, 
  X, 
  Download, 
  LogOut, 
  ChevronDown, 
  LayoutDashboard,
  Layers,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { getCategories, getSiteSettings, DEFAULT_SITE_SETTINGS } from '../../services/api';
import { Category, SiteSettings } from '../../types';
import { CategoryIcon } from '../ui/CategoryIcon';

// Demo categories matching user reference screenshot when categories are loading or empty
const sampleCategories: { id: string; name: string; slug: string }[] = [
  { id: 'cat-1', name: 'AI & Productivity', slug: 'ai-productivity' },
  { id: 'cat-2', name: 'Adobe Creative Cloud', slug: 'adobe-creative-cloud' },
  { id: 'cat-3', name: 'Creative Tools', slug: 'creative-tools' },
  { id: 'cat-4', name: 'LinkedIn Subscription', slug: 'linkedin-subscription' },
  { id: 'cat-5', name: 'Windows Licence', slug: 'windows-licence' },
  { id: 'cat-6', name: 'Educational', slug: 'educational' },
  { id: 'cat-7', name: 'Microsoft Office', slug: 'microsoft-office' },
  { id: 'cat-8', name: 'Autodesk', slug: 'autodesk' },
];

export const Header: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { cart, totalPrice } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('mg_client_categories_cache');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem('mg_site_settings_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.siteName === 'Murad Graphics' || !parsed.siteName) parsed.siteName = 'Vyrqonix';
        return parsed;
      }
    } catch {}
    return DEFAULT_SITE_SETTINGS;
  });
  const [categoriesDrawerOpen, setCategoriesDrawerOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const displayCategories = categories.length > 0 ? categories : sampleCategories;
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCategories(true).then((cats) => {
      setCategories(cats);
      try { localStorage.setItem('mg_client_categories_cache', JSON.stringify(cats)); } catch {}
    });
    getSiteSettings().then((s) => {
      setSettings(s);
      try { localStorage.setItem('mg_site_settings_cache', JSON.stringify(s)); } catch {}
    });
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setCategoriesDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (categoriesDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [categoriesDrawerOpen]);

  // Listen for mobile bottom bar Menu clicks to toggle categories drawer
  useEffect(() => {
    const handleToggle = () => setCategoriesDrawerOpen((prev) => !prev);
    window.addEventListener('toggle-mobile-categories', handleToggle);
    return () => window.removeEventListener('toggle-mobile-categories', handleToggle);
  }, []);

  // Broadcast categories drawer state to mobile bottom nav
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('mobile-categories-state', { detail: categoriesDrawerOpen }));
  }, [categoriesDrawerOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setCategoriesDrawerOpen(false);
    }
  };

  const isActiveRoute = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const whatsappPhone = settings.whatsapp || "01566088159";
  const whatsappCleanNumber = whatsappPhone.replace(/[^0-9]/g, '');

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-100 transition-all">
      
      {/* ================= DESKTOP TOP ROW (hidden md:block) ================= */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex items-center justify-between gap-4 md:gap-8">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group">
            <img 
              src="/logo.png" 
              alt="Vyrqonix" 
              className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_1px_4px_rgba(59,130,246,0.14)]"
            />
            <div className="flex flex-col">
              <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-900 leading-none">
                VYR<span className="text-blue-600">QONIX</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400 mt-0.5 sm:mt-1">
                Digital Marketplace
              </span>
            </div>
          </Link>

          {/* Centered Search Bar with Purple/Blue Circular Search Button */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="flex-1 max-w-2xl flex items-center relative"
          >
            <div className="w-full relative flex items-center">
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-sm text-slate-800 placeholder-slate-400 rounded-full pl-6 pr-14 py-3 border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100/50 shadow-sm transition-all"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1.5 w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center shadow-sm hover:shadow transition-all active:scale-95"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </form>

          {/* Right Header Area: WhatsApp Chat Support */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`https://wa.me/88${whatsappCleanNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl hover:bg-emerald-50/70 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
                <img 
                  src="/whatsapp.webp" 
                  alt="WhatsApp Chat Support" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">Chat Support</span>
                <span className="text-[11px] font-semibold text-emerald-600">{whatsappPhone}</span>
              </div>
            </a>
          </div>

        </div>
      </div>

      {/* ================= MOBILE HEADER (md:hidden) ================= */}
      <div className="md:hidden px-4 py-2.5 bg-white">
        {/* Top Row: Purple Menu Button (Left) | Brand Logo (Center) | Account + Purple Cart (Right) */}
        <div className="flex items-center justify-between gap-2">
          
          {/* Left: Purple Circular Hamburger Menu Button (Opens All Categories Drawer) */}
          <button
            type="button"
            onClick={() => setCategoriesDrawerOpen(!categoriesDrawerOpen)}
            className="w-10 h-10 rounded-full bg-[#7a00ea] hover:bg-[#6c00d4] text-white flex items-center justify-center shadow-md shadow-purple-600/20 active:scale-95 transition-all shrink-0 cursor-pointer"
            title="All Categories"
            aria-label="Toggle All Categories menu"
          >
            {categoriesDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 stroke-[2.5]" />}
          </button>

          {/* Center: Brand Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img 
              src="/logo.png" 
              alt="Vyrqonix" 
              className="h-7 w-auto object-contain drop-shadow-[0_1px_3px_rgba(59,130,246,0.12)]"
            />
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-slate-900 leading-none">
                VYR<span className="text-[#7a00ea]">QONIX</span>
              </span>
            </div>
          </Link>

          {/* Right: Account Icon + Circular Purple Cart Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Account Icon */}
            <Link
              to={user ? "/account" : "/login"}
              className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-800 flex items-center justify-center transition-all cursor-pointer"
              title={user ? "My Account" : "Login"}
              aria-label="User Account"
            >
              <UserIcon className="w-5 h-5 text-slate-800 stroke-[2]" />
            </Link>

            {/* Purple Circular Cart Button with Badge */}
            <Link
              to="/cart"
              className="w-10 h-10 rounded-full bg-[#7a00ea] hover:bg-[#6c00d4] text-white flex items-center justify-center relative shadow-md shadow-purple-600/20 active:scale-95 transition-all shrink-0 cursor-pointer"
              title="Shopping Cart"
              aria-label="View Shopping Cart"
            >
              <div className="relative inline-flex items-center justify-center">
                <svg 
                  className="w-5 h-5 text-white" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M8 8V6a4 4 0 0 1 8 0v2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <path d="M4.5 9l1.6 8.5a2 2 0 0 0 2 1.5h7.8a2 2 0 0 0 2-1.5L19.5 9" />
                  <line x1="9.5" y1="12" x2="10" y2="16.5" />
                  <line x1="12" y1="12" x2="12" y2="16.5" />
                  <line x1="14.5" y1="12" x2="14" y2="16.5" />
                </svg>
                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-black text-white text-[10px] font-black rounded-full flex items-center justify-center pointer-events-none ring-1 ring-black">
                  {cart.length}
                </span>
              </div>
            </Link>
          </div>

        </div>

        {/* Bottom Row: Full-Width Search Input with Purple Circular Search Button */}
        <div className="mt-2.5">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-sm text-slate-800 placeholder-slate-400 rounded-full pl-5 pr-12 py-2.5 border border-slate-200 hover:border-slate-300 focus:outline-none focus:border-[#7a00ea] focus:ring-2 focus:ring-purple-100 shadow-xs"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1 w-8 h-8 rounded-full bg-[#7a00ea] hover:bg-[#6c00d4] text-white flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>

      {/* ================= BOTTOM ROW: Category Pill + Menu Links + Actions ================= */}
      <div className="bg-white border-t border-slate-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            
            {/* Left: All Categories Pill Button + Navigation Links */}
            <div className="flex items-center gap-4 sm:gap-6">
              
              {/* All Categories Capsule Button with Drawer Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setCategoriesDrawerOpen(!categoriesDrawerOpen)}
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-bold shadow-md shadow-violet-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Menu className="w-4 h-4 stroke-[2.5]" />
                  <span>All Categories</span>
                </button>
              </div>

              {/* Navigation Menu Links */}
              <nav className="hidden lg:flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-bold">
                <Link
                  to="/"
                  className={`px-3.5 py-1.5 rounded-full transition-all ${
                    isActiveRoute('/')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  Home
                </Link>

                <Link
                  to="/shop"
                  className={`px-3.5 py-1.5 rounded-full transition-all ${
                    isActiveRoute('/shop')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  Shop
                </Link>

                <Link
                  to="/about"
                  className={`px-3.5 py-1.5 rounded-full transition-all ${
                    isActiveRoute('/about')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  About
                </Link>

                <Link
                  to="/shop?search=theme"
                  className={`px-3.5 py-1.5 rounded-full transition-all ${
                    location.search.toLowerCase().includes('theme')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  Theme
                </Link>

                <Link
                  to="/contact"
                  className={`px-3.5 py-1.5 rounded-full transition-all ${
                    isActiveRoute('/contact')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  Our Contacts
                </Link>
              </nav>

            </div>

            {/* Right: Wishlist Icon + Account Icon + Purple/Blue Cart Capsule Button */}
            <div className="flex items-center gap-3 sm:gap-4">
              
              {/* Wishlist Circular Icon */}
              <Link
                to="/wishlist"
                className="w-10 h-10 rounded-full border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all relative group"
                title="Wishlist"
              >
                <Heart className={`w-4 h-4 transition-colors ${wishlist.length > 0 ? 'fill-rose-500 stroke-rose-500 text-rose-500' : 'group-hover:text-blue-600 group-hover:stroke-blue-600'}`} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Account Circular Icon with Dropdown */}
              <div className="relative" ref={userRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-10 h-10 rounded-full border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all"
                  title="My Account"
                >
                  <UserIcon className="w-4 h-4" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {user ? (
                      <>
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Signed in as</p>
                          <p className="text-xs font-bold text-slate-800 truncate">{user.email}</p>
                        </div>

                        {isAdmin && (
                          <Link 
                            to="/admin" 
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-blue-600" />
                            Admin Console
                          </Link>
                        )}

                        <Link 
                          to="/account" 
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          My Profile & Orders
                        </Link>

                        <Link 
                          to="/account/downloads" 
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Download className="w-4 h-4 text-slate-400" />
                          Download Library
                        </Link>

                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left border-t border-slate-100 mt-1"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <div className="p-3 space-y-2">
                        <p className="text-xs text-slate-600 font-medium">Sign in to access your downloads and purchases.</p>
                        <Link
                          to="/login"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center shadow-sm"
                        >
                          Login / Register
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 100% Pixel-Perfect Matching Purple Cart Capsule Button */}
              <Link
                to="/cart"
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#7a00ea] hover:bg-[#6c00d4] text-white transition-transform active:scale-95 shadow-sm select-none"
              >
                <div className="relative inline-flex items-center justify-center">
                  {/* Shopping Basket Icon matching user image */}
                  <svg 
                    className="w-6 h-6 text-white" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    {/* Top handle */}
                    <path d="M8 8V6a4 4 0 0 1 8 0v2" />
                    {/* Horizontal rim */}
                    <line x1="3" y1="9" x2="21" y2="9" />
                    {/* Basket contour */}
                    <path d="M4.5 9l1.6 8.5a2 2 0 0 0 2 1.5h7.8a2 2 0 0 0 2-1.5L19.5 9" />
                    {/* Basket 3 vertical lines */}
                    <line x1="9.5" y1="12" x2="10" y2="16.5" />
                    <line x1="12" y1="12" x2="12" y2="16.5" />
                    <line x1="14.5" y1="12" x2="14" y2="16.5" />
                  </svg>

                  {/* Black badge on top-right of basket */}
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white text-[11px] font-black rounded-full flex items-center justify-center pointer-events-none ring-1 ring-black">
                    {cart.length}
                  </span>
                </div>

                {/* Exact 0৳ Text */}
                <span className="font-extrabold text-white text-[15px] tracking-tight leading-none">
                  {totalPrice}৳
                </span>
              </Link>

            </div>

          </div>
        </div>
      </div>

      {/* ================= ALL CATEGORIES SIDEBAR DRAWER (Mobile & Desktop) ================= */}
      {/* Semi-transparent dark background backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity duration-300 ease-in-out ${
          categoriesDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setCategoriesDrawerOpen(false)}
      />

      {/* Left Sidebar Drawer Menu Panel with smooth transform ease-out */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-72 sm:w-80 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col justify-between border-r border-slate-200 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          categoriesDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header Capsule Button matching screenshot */}
        <div className="p-3.5 sm:p-4 pb-2 border-b border-slate-100 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7a00ea] text-white text-sm font-bold shadow-md shadow-purple-600/20">
            <Menu className="w-4 h-4 stroke-[2.5]" />
            <span>All Categories</span>
          </div>

          <button 
            type="button"
            onClick={() => setCategoriesDrawerOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories List Links matching screenshot */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-0.5">
          {/* 1. All Products (Purple colored link) */}
          <Link
            to="/shop"
            onClick={() => setCategoriesDrawerOpen(false)}
            className="block px-3 py-2 text-[15px] font-bold text-[#7a00ea] hover:bg-purple-50 rounded-xl transition-colors"
          >
            All Products
          </Link>

          {/* Dynamic or Sample categories matching user's image */}
          {displayCategories.map((c) => (
            <Link
              key={c.id}
              to={`/category/${c.slug}`}
              onClick={() => setCategoriesDrawerOpen(false)}
              className="block px-3 py-2 text-[15px] font-semibold text-slate-800 hover:text-[#7a00ea] hover:bg-slate-50 rounded-xl transition-colors"
            >
              {c.name}
            </Link>
          ))}

          {/* Secondary links */}
          <div className="pt-3 mt-3 border-t border-slate-100 space-y-0.5">
            <Link
              to="/shop?type=free"
              onClick={() => setCategoriesDrawerOpen(false)}
              className="block px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
            >
              Free Resources
            </Link>
            <Link
              to="/about"
              onClick={() => setCategoriesDrawerOpen(false)}
              className="block px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              About Vyrqonix
            </Link>
            <Link
              to="/contact"
              onClick={() => setCategoriesDrawerOpen(false)}
              className="block px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Our Contacts
            </Link>
          </div>
        </div>

        {/* Bottom Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-2">
          {isAdmin && (
            <Link
              to="/admin/categories"
              onClick={() => setCategoriesDrawerOpen(false)}
              className="block w-full py-2 px-3 text-center text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors mb-2"
            >
              + Manage Categories (Admin)
            </Link>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Vyrqonix Catalog</span>
            <Link 
              to="/shop"
              onClick={() => setCategoriesDrawerOpen(false)} 
              className="font-bold text-[#7a00ea] hover:underline"
            >
              Explore All →
            </Link>
          </div>
        </div>
      </aside>

    </header>
  );
};
