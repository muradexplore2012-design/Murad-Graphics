import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  DownloadCloud, 
  Sparkles,
  Zap,
  CheckCircle2,
  Headphones,
  ExternalLink
} from 'lucide-react';
import { getSiteSettings, DEFAULT_SITE_SETTINGS } from '../../services/api';
import { SiteSettings, FooterFeatureBadge, FooterColumn } from '../../types';

export const Footer: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  const badges: FooterFeatureBadge[] = (settings.footerBadges && settings.footerBadges.length > 0)
    ? settings.footerBadges
    : (DEFAULT_SITE_SETTINGS.footerBadges || []);

  const showBadges = settings.showFooterBadges !== false;

  const footerColumns: FooterColumn[] = (settings.footerColumns && settings.footerColumns.length > 0)
    ? settings.footerColumns
    : (DEFAULT_SITE_SETTINGS.footerColumns || []);

  const badgeColorStyles = [
    { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    { bg: 'bg-purple-50', text: 'text-[#7a00ea]', border: 'border-purple-100' },
    { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
  ];

  const renderBadgeIcon = (iconName?: string, index: number = 0) => {
    const norm = (iconName || '').toLowerCase();
    if (norm.includes('shield') || norm.includes('authentic') || norm.includes('security')) {
      return <ShieldCheck className="w-6 h-6 stroke-[2.2]" />;
    }
    if (norm.includes('sparkle') || norm.includes('star') || norm.includes('edit')) {
      return <Sparkles className="w-6 h-6 stroke-[2.2]" />;
    }
    if (norm.includes('zap') || norm.includes('fast')) {
      return <Zap className="w-6 h-6 stroke-[2.2]" />;
    }
    if (norm.includes('check')) {
      return <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />;
    }
    if (norm.includes('support') || norm.includes('headphone')) {
      return <Headphones className="w-6 h-6 stroke-[2.2]" />;
    }
    if (norm.includes('download') || norm.includes('delivery')) {
      return <DownloadCloud className="w-6 h-6 stroke-[2.2]" />;
    }

    if (index === 0) return <DownloadCloud className="w-6 h-6 stroke-[2.2]" />;
    if (index === 1) return <ShieldCheck className="w-6 h-6 stroke-[2.2]" />;
    return <Sparkles className="w-6 h-6 stroke-[2.2]" />;
  };

  const copyrightText = (settings.footerCopyrightText || "© {year} {siteName}. All rights reserved.")
    .replace('{year}', new Date().getFullYear().toString())
    .replace('{siteName}', settings.siteName || 'Vyrqonix');

  const designerPrefix = settings.footerDesignerPrefix || "Design by";
  const designerName = settings.footerDesignerName || "Murad Rahman";
  const designerUrl = settings.footerDesignerUrl || "https://www.facebook.com/profile.php?id=100085471628384";

  // Compute grid columns based on number of footer link columns
  // 1 column -> 4 grid columns (Brand spans 2, Links spans 1, Contact spans 1)
  // 2 columns -> 5 grid columns (Brand spans 2, Links spans 1 each, Contact spans 1)
  const gridLayoutClass = footerColumns.length > 1 ? 'lg:grid-cols-5' : 'lg:grid-cols-4';

  // All visible links for mobile footer
  const allVisibleLinks = footerColumns.flatMap(c => c.links.filter(l => l.isVisible));

  return (
    <>
      {/* ================= STANDALONE VALUE PROPOSITION BADGES ================= */}
      {showBadges && badges.length > 0 && (
        <section className="hidden md:block py-8 sm:py-10">
          <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(badges.length, 4)} gap-6`}>
              {badges.map((badge, idx) => {
                const style = badgeColorStyles[idx % badgeColorStyles.length];
                return (
                  <div key={badge.id || idx} className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <div className={`w-12 h-12 rounded-xl ${style.bg} ${style.text} flex items-center justify-center shrink-0 border ${style.border}`}>
                      {renderBadgeIcon(badge.icon, idx)}
                    </div>
                    <div>
                      <h4 className="text-slate-900 font-bold text-sm">{badge.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{badge.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ================= DESKTOP FOOTER (hidden md:block) ================= */}
      <footer className="hidden md:block bg-white text-slate-700 pt-14 pb-8 border-t border-slate-200/80">
        <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Footer Links */}
          <div className={`grid grid-cols-1 md:grid-cols-2 ${gridLayoutClass} gap-10 pb-12`}>
            
            {/* Brand Col */}
            <div className="md:col-span-2 lg:col-span-2 space-y-4">
              <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
                <img 
                  src="/logo.png" 
                  alt={settings.siteName || "Vyrqonix"} 
                  className="h-8 sm:h-9 w-auto object-contain drop-shadow-[0_1px_4px_rgba(59,130,246,0.14)]"
                />
                <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                  Vyr<span className="text-blue-600">qonix</span>
                </span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
                {settings.siteDescription}
              </p>
              
              {/* Dynamic Social Links: YouTube, Facebook, WhatsApp, etc. */}
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
                      className={`w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center transition-all duration-200 shadow-xs text-slate-600 ${
                        isYouTube 
                          ? 'hover:bg-red-600 hover:text-white hover:border-red-600' 
                          : isFacebook 
                          ? 'hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]' 
                          : isWhatsApp 
                          ? 'hover:bg-[#25D366] hover:text-white hover:border-[#25D366]' 
                          : 'hover:bg-blue-600 hover:text-white hover:border-blue-600'
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
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Link Columns */}
            {footerColumns.map((col) => (
              <div key={col.id} className="space-y-3">
                <h4 className="text-slate-900 font-bold text-sm tracking-wider uppercase">
                  {col.title}
                </h4>
                <ul className="space-y-2.5 text-sm font-medium text-slate-600">
                  {col.links.filter(l => l.isVisible).map((link) => {
                    const isExternal = link.url.startsWith('http://') || link.url.startsWith('https://');
                    return (
                      <li key={link.id}>
                        {isExternal ? (
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:text-blue-600 transition-colors"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link 
                            to={link.url} 
                            className="hover:text-blue-600 transition-colors"
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            {/* Direct Contact */}
            <div className="space-y-3">
              <h4 className="text-slate-900 font-bold text-sm tracking-wider uppercase">
                {settings.footerContactTitle || "Direct Contact"}
              </h4>
              <div className="space-y-2.5 text-xs text-slate-600 font-medium">
                {settings.address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{settings.address}</span>
                  </div>
                )}
                {settings.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                    <a href={`tel:${settings.phone}`} className="hover:text-blue-600 transition-colors">{settings.phone}</a>
                  </div>
                )}
                {settings.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                    <a href={`mailto:${settings.email}`} className="hover:text-blue-600 transition-colors">{settings.email}</a>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Bottom copyright line */}
          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>{copyrightText}</p>
            <p className="text-xs text-slate-500 font-medium">
              <span>{designerPrefix} </span>
              <a 
                href={designerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-700 hover:text-blue-600 hover:underline underline-offset-4 decoration-blue-600 transition-colors"
              >
                {designerName}
              </a>
            </p>
          </div>

        </div>
      </footer>

      {/* ================= MOBILE SHORT COMPACT FOOTER (md:hidden) ================= */}
      <footer className="md:hidden bg-white text-slate-800 pt-6 pb-24 px-4 border-t border-slate-100 text-center">
        <div className="max-w-sm mx-auto space-y-3">
          
          {/* 1. Brand Logo & Name */}
          <Link to="/" className="inline-flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt={settings.siteName || "Vyrqonix"} 
              className="h-7 w-auto object-contain drop-shadow-[0_1px_3px_rgba(59,130,246,0.14)]"
            />
            <span className="font-black text-xl tracking-tight text-slate-900 leading-none">
              Vyr<span className="text-blue-600">qonix</span>
            </span>
          </Link>

          {/* 2. Direct Contact hotline & email in one neat line */}
          {(settings.phone || settings.email) && (
            <div className="flex items-center justify-center gap-3 text-xs font-semibold text-slate-600">
              {settings.phone && (
                <a 
                  href={`tel:${settings.phone}`} 
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>{settings.phone}</span>
                </a>
              )}
              {settings.phone && settings.email && <span className="text-slate-300">•</span>}
              {settings.email && (
                <a 
                  href={`mailto:${settings.email}`} 
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>{settings.email}</span>
                </a>
              )}
            </div>
          )}

          {/* 3. Essential Quick Links */}
          {allVisibleLinks.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs font-medium text-slate-500">
              {allVisibleLinks.map((link, idx) => (
                <React.Fragment key={link.id || idx}>
                  {idx > 0 && <span className="text-slate-300">•</span>}
                  {link.url.startsWith('http') ? (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">{link.label}</a>
                  ) : (
                    <Link to={link.url} className="hover:text-blue-600 transition-colors">{link.label}</Link>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* 4. Compact Social Channels */}
          <div className="flex items-center justify-center gap-3 pt-0.5">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/88${(settings.whatsapp || settings.phone || "01566088159").replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-transform"
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </a>

            {/* Facebook */}
            <a
              href={`${settings.socialLinks?.find(s => s.name.toLowerCase().includes('facebook'))?.url || "https://facebook.com/vyrqonix"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-transform"
              aria-label="Facebook"
              title="Facebook"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* YouTube */}
            <a
              href={`${settings.socialLinks?.find(s => s.name.toLowerCase().includes('youtube'))?.url || "https://www.youtube.com/channel/UCDP9PD8OEpJkq63hMVNCYSg"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-transform"
              aria-label="YouTube"
              title="YouTube"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>

          {/* 5. Copyright */}
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div>{copyrightText}</div>
            <div>
              <span>{designerPrefix} </span>
              <a 
                href={designerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-600 hover:text-blue-600 hover:underline underline-offset-2 transition-colors"
              >
                {designerName}
              </a>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
};
