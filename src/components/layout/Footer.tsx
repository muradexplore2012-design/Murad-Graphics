import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  DownloadCloud, 
  Sparkles,
  MessageCircle,
  Share2,
  Globe,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { getSiteSettings, DEFAULT_SITE_SETTINGS } from '../../services/api';
import { SiteSettings } from '../../types';

export const Footer: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  return (
    <>
      {/* ================= DESKTOP FOOTER (hidden md:block) ================= */}
      <footer className="hidden md:block bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Value Proposition Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12 mb-12 border-b border-slate-800/80">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <DownloadCloud className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Instant Digital Delivery</h4>
                <p className="text-xs text-slate-400 mt-0.5">Download source files right after order confirmation</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Commercial License</h4>
                <p className="text-xs text-slate-400 mt-0.5">Safe to use in your client graphics and digital projects</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">100% Editable Source Files</h4>
                <p className="text-xs text-slate-400 mt-0.5">AI, PSD, EPS, SVG, fonts, software & apps</p>
              </div>
            </div>
          </div>

          {/* Main Footer Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12">
            
            {/* Brand Col */}
            <div className="lg:col-span-2 space-y-4">
              <Link to="/" className="flex items-center gap-3 group">
                <img 
                  src="/logo.png" 
                  alt="Vyrqonix Logo" 
                  className="h-10 w-auto object-contain"
                />
                <span className="text-xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  VYR <span className="text-blue-500">QONIX</span>
                </span>
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                {settings.siteDescription}
              </p>
              
              {/* Dynamic Social Links: YouTube, Facebook, WhatsApp */}
              <div className="pt-2 flex items-center gap-3">
                {settings.socialLinks?.filter(s => s.isVisible && s.url).map((s) => {
                  const nameLower = s.name.toLowerCase();
                  const isYouTube = nameLower.includes('youtube') || s.url.includes('youtube');
                  const isFacebook = nameLower.includes('facebook') || s.url.includes('facebook');
                  const isWhatsApp = nameLower.includes('whatsapp') || s.url.includes('wa.me');

                  return (
                    <a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center transition-all duration-200 shadow-sm ${
                        isYouTube 
                          ? 'hover:bg-red-600 text-slate-300 hover:text-white' 
                          : isFacebook 
                          ? 'hover:bg-[#1877F2] text-slate-300 hover:text-white' 
                          : isWhatsApp 
                          ? 'hover:bg-emerald-600 text-slate-300 hover:text-white' 
                          : 'hover:bg-blue-600 text-slate-300 hover:text-white'
                      }`}
                      title={s.name}
                    >
                      {isYouTube ? (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      ) : isFacebook ? (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      ) : isWhatsApp ? (
                        <img src="/whatsapp.webp" alt="WhatsApp" className="w-5 h-5 object-contain rounded" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold text-sm tracking-wider uppercase">Marketplace</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/shop" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link to="/shop?type=free" className="hover:text-emerald-400 transition-colors">Free Resources</Link></li>
                <li><Link to="/shop?type=paid" className="hover:text-blue-400 transition-colors">Premium Assets</Link></li>
                <li><Link to="/cart" className="hover:text-white transition-colors">Cart</Link></li>
                <li><Link to="/wishlist" className="hover:text-white transition-colors">Wishlist</Link></li>
              </ul>
            </div>

            {/* Customer Support */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold text-sm tracking-wider uppercase">Support & Info</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">FAQs & Help</Link></li>
                <li><Link to="/license-policy" className="hover:text-white transition-colors">License Policy</Link></li>
                <li><Link to="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Contact Details */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold text-sm tracking-wider uppercase">Direct Contact</h4>
              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>{settings.address}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                  <a href={`tel:${settings.phone}`} className="hover:text-white">{settings.phone}</a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                  <a href={`mailto:${settings.email}`} className="hover:text-white">{settings.email}</a>
                </div>
                <div className="pt-2">
                  <a 
                    href={`https://wa.me/88${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all group"
                  >
                    <img src="/whatsapp.webp" alt="WhatsApp" className="w-4 h-4 rounded object-contain" />
                    WhatsApp Support
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom copyright line */}
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} {settings.siteName}. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/license-policy" className="hover:text-slate-400">License</Link>
              <Link to="/privacy-policy" className="hover:text-slate-400">Privacy</Link>
              <Link to="/terms" className="hover:text-slate-400">Terms</Link>
              <Link to="/admin" className="text-slate-600 hover:text-slate-400">Admin</Link>
            </div>
          </div>

        </div>
      </footer>

      {/* ================= MOBILE SHORT FOOTER (md:hidden) ================= */}
      <footer className="md:hidden bg-white text-slate-800 pt-10 pb-24 px-5 border-t border-slate-200">
        <div className="max-w-md mx-auto">
          
          {/* 1. Brand Logo & Name */}
          <div className="flex flex-col items-center text-center">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img 
                src="/logo.png" 
                alt={settings.siteName} 
                className="w-9 h-9 object-contain rounded-xl"
              />
              <span className="font-black text-2xl tracking-tight text-slate-900 leading-none">
                VYR<span className="text-[#7a00ea]">QONIX</span>
              </span>
            </Link>

            {/* Short Description matching user image */}
            <p className="text-xs text-slate-600 leading-relaxed mt-3 max-w-xs">
              {(!settings.siteName || settings.siteName === 'Murad Graphics') ? 'Vyrqonix' : settings.siteName} is a trusted marketplace for premium software, subscriptions, templates, courses, and creative resources—offering fast delivery, secure access, and reliable support.
            </p>

            {/* Direct Contact: Phone & Hours */}
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-[#7a00ea] shrink-0">
                <Phone className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <a 
                  href={`tel:${settings.phone}`} 
                  className="font-bold text-sm text-slate-900 hover:text-[#7a00ea] block leading-tight"
                >
                  {settings.phone}
                </a>
                <span className="text-[11px] text-slate-500 font-medium">9:00 AM – 11:00 PM</span>
              </div>
            </div>

            {/* Email */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <Mail className="w-4 h-4 text-[#7a00ea] shrink-0" />
              <a 
                href={`mailto:${settings.email}`} 
                className="font-bold text-xs sm:text-sm text-slate-900 hover:text-[#7a00ea]"
              >
                {settings.email}
              </a>
            </div>
          </div>

          {/* 2. Customer Service & Useful Links (2 Columns side by side) */}
          <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100 text-left">
            
            {/* Left: Customer Service */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 mb-3.5">Customer Service</h4>
              <ul className="space-y-2.5 text-xs font-medium text-slate-700">
                <li>
                  <Link to="/contact" className="inline-flex items-center gap-1.5 hover:text-[#7a00ea] transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-[#7a00ea] shrink-0 stroke-[2.5]" />
                    <span>Contact Us</span>
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="inline-flex items-center gap-1.5 hover:text-[#7a00ea] transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-[#7a00ea] shrink-0 stroke-[2.5]" />
                    <span>Return Policy</span>
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="inline-flex items-center gap-1.5 hover:text-[#7a00ea] transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-[#7a00ea] shrink-0 stroke-[2.5]" />
                    <span>How to Buy</span>
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="inline-flex items-center gap-1.5 hover:text-[#7a00ea] transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-[#7a00ea] shrink-0 stroke-[2.5]" />
                    <span>Privacy Policy</span>
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="inline-flex items-center gap-1.5 hover:text-[#7a00ea] transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-[#7a00ea] shrink-0 stroke-[2.5]" />
                    <span>FAQ</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Right: Useful Links */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 mb-3.5">Useful Links</h4>
              <ul className="space-y-2.5 text-xs font-medium text-slate-700">
                <li>
                  <Link to="/shop" className="inline-flex items-center gap-1.5 hover:text-[#7a00ea] transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-[#7a00ea] shrink-0 stroke-[2.5]" />
                    <span>All Products</span>
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="inline-flex items-center gap-1.5 hover:text-[#7a00ea] transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-[#7a00ea] shrink-0 stroke-[2.5]" />
                    <span>About Us</span>
                  </Link>
                </li>
                <li>
                  <Link to="/shop?type=free" className="inline-flex items-center gap-1.5 hover:text-[#7a00ea] transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-[#7a00ea] shrink-0 stroke-[2.5]" />
                    <span>Free Resources</span>
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="inline-flex items-center gap-1.5 hover:text-[#7a00ea] transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-[#7a00ea] shrink-0 stroke-[2.5]" />
                    <span>FAQ</span>
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="inline-flex items-center gap-1.5 hover:text-[#7a00ea] transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-[#7a00ea] shrink-0 stroke-[2.5]" />
                    <span>Terms & Conditions</span>
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          {/* 3. Follow Us */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <h4 className="font-bold text-sm text-slate-900">Follow Us</h4>
            <p className="text-xs text-slate-500 mt-0.5">Stay connected with us</p>

            <div className="mt-4 flex items-center justify-center gap-3.5">
              {/* YouTube */}
              <a
                href={settings.socialLinks?.find(s => s.name.toLowerCase().includes('youtube'))?.url || "https://www.youtube.com/channel/UCDP9PD8OEpJkq63hMVNCYSg"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform"
                aria-label="YouTube"
                title="YouTube"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>

              {/* Facebook */}
              <a
                href={settings.socialLinks?.find(s => s.name.toLowerCase().includes('facebook'))?.url || "https://facebook.com/Vyrqonix"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform"
                aria-label="Facebook"
                title="Facebook"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/88${(settings.whatsapp || "01566088159").replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform"
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} {settings.siteName}. All rights reserved.
          </div>

        </div>
      </footer>
    </>
  );
};
