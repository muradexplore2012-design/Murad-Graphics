import React, { useEffect, useState } from 'react';
import { 
  getSiteSettings, 
  updateSiteSettings,
  recordAuditLog,
  DEFAULT_SITE_SETTINGS
} from '../../services/api';
import { 
  SiteSettings, 
  SocialLink, 
  FooterFeatureBadge, 
  FooterColumn, 
  FooterLinkItem 
} from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Globe, 
  Trash2, 
  Save, 
  Plus, 
  ExternalLink, 
  Check, 
  Share2, 
  Sparkles, 
  ShieldCheck, 
  DownloadCloud, 
  Zap, 
  CheckCircle2, 
  Headphones, 
  Columns, 
  Phone, 
  Mail, 
  MapPin, 
  Eye, 
  EyeOff, 
  Layers, 
  FileText, 
  Info,
  Link as LinkIcon
} from 'lucide-react';

export const AdminFooterSocialPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Social Link Form
  const [socialName, setSocialName] = useState('');
  const [socialUrl, setSocialUrl] = useState('');

  // New Column Form
  const [newColTitle, setNewColTitle] = useState('');

  // Quick link addition temp states per column
  const [newLinkLabels, setNewLinkLabels] = useState<Record<string, string>>({});
  const [newLinkUrls, setNewLinkUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    getSiteSettings().then((s) => {
      // Ensure defaults are populated if missing in existing doc
      const merged: SiteSettings = {
        ...DEFAULT_SITE_SETTINGS,
        ...s,
        footerBadges: (s.footerBadges && s.footerBadges.length > 0)
          ? s.footerBadges
          : (DEFAULT_SITE_SETTINGS.footerBadges || []),
        footerColumns: (s.footerColumns && s.footerColumns.length > 0)
          ? s.footerColumns
          : (DEFAULT_SITE_SETTINGS.footerColumns || []),
        socialLinks: s.socialLinks || DEFAULT_SITE_SETTINGS.socialLinks || []
      };
      setSettings(merged);
    });
  }, []);

  const handleSaveAll = async () => {
    if (!settings) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      const payload: Partial<SiteSettings> = {
        // Feature Badges
        showFooterBadges: settings.showFooterBadges !== false,
        footerBadges: settings.footerBadges || [],

        // Brand Description
        siteDescription: settings.siteDescription || '',

        // Footer Columns
        footerColumns: settings.footerColumns || [],

        // Direct Contact
        footerContactTitle: settings.footerContactTitle || 'Direct Contact',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',

        // Social Links
        socialLinks: settings.socialLinks || [],

        // Bottom Copyright & Credits
        footerCopyrightText: settings.footerCopyrightText || '© {year} {siteName}. All rights reserved.',
        footerDesignerPrefix: settings.footerDesignerPrefix || 'Design by',
        footerDesignerName: settings.footerDesignerName || 'Murad Rahman',
        footerDesignerUrl: settings.footerDesignerUrl || ''
      };

      await updateSiteSettings(payload);
      await recordAuditLog({
        adminUid: user?.uid || '',
        adminEmail: user?.email || '',
        action: 'UPDATE_FOOTER_SETTINGS',
        targetType: 'SETTINGS',
        targetId: 'footer',
        details: { fieldsUpdated: Object.keys(payload) }
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (e: any) {
      alert("Failed to save footer settings: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ================= BADGES HANDLERS =================
  const handleToggleBadges = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      showFooterBadges: settings.showFooterBadges === false ? true : false
    });
  };

  const handleUpdateBadge = (id: string, field: keyof FooterFeatureBadge, value: string) => {
    if (!settings) return;
    const updated = (settings.footerBadges || []).map(b => b.id === id ? { ...b, [field]: value } : b);
    setSettings({ ...settings, footerBadges: updated });
  };

  const handleAddBadge = () => {
    if (!settings) return;
    const newBadge: FooterFeatureBadge = {
      id: 'badge-' + Date.now(),
      title: 'New Feature Title',
      subtitle: 'Add short feature description here',
      icon: 'sparkles'
    };
    setSettings({
      ...settings,
      footerBadges: [...(settings.footerBadges || []), newBadge]
    });
  };

  const handleRemoveBadge = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      footerBadges: (settings.footerBadges || []).filter(b => b.id !== id)
    });
  };

  // ================= FOOTER COLUMNS & LINKS HANDLERS =================
  const handleAddColumn = () => {
    if (!settings || !newColTitle.trim()) return;
    const newCol: FooterColumn = {
      id: 'col-' + Date.now(),
      title: newColTitle.trim(),
      links: []
    };
    setSettings({
      ...settings,
      footerColumns: [...(settings.footerColumns || []), newCol]
    });
    setNewColTitle('');
  };

  const handleRemoveColumn = (colId: string) => {
    if (!settings) return;
    if (confirm("Are you sure you want to delete this footer column? All its links will also be removed.")) {
      setSettings({
        ...settings,
        footerColumns: (settings.footerColumns || []).filter(c => c.id !== colId)
      });
    }
  };

  const handleUpdateColumnTitle = (colId: string, title: string) => {
    if (!settings) return;
    const updated = (settings.footerColumns || []).map(c => c.id === colId ? { ...c, title } : c);
    setSettings({ ...settings, footerColumns: updated });
  };

  const handleAddLinkToColumn = (colId: string) => {
    if (!settings) return;
    const label = (newLinkLabels[colId] || '').trim();
    const url = (newLinkUrls[colId] || '').trim();
    if (!label || !url) return;

    const newLink: FooterLinkItem = {
      id: 'link-' + Date.now(),
      label,
      url,
      isVisible: true
    };

    const updated = (settings.footerColumns || []).map(c => {
      if (c.id === colId) {
        return { ...c, links: [...c.links, newLink] };
      }
      return c;
    });

    setSettings({ ...settings, footerColumns: updated });
    setNewLinkLabels({ ...newLinkLabels, [colId]: '' });
    setNewLinkUrls({ ...newLinkUrls, [colId]: '' });
  };

  const handleUpdateLink = (colId: string, linkId: string, field: 'label' | 'url', value: string) => {
    if (!settings) return;
    const updated = (settings.footerColumns || []).map(c => {
      if (c.id === colId) {
        return {
          ...c,
          links: c.links.map(l => l.id === linkId ? { ...l, [field]: value } : l)
        };
      }
      return c;
    });
    setSettings({ ...settings, footerColumns: updated });
  };

  const handleToggleLinkVisibility = (colId: string, linkId: string) => {
    if (!settings) return;
    const updated = (settings.footerColumns || []).map(c => {
      if (c.id === colId) {
        return {
          ...c,
          links: c.links.map(l => l.id === linkId ? { ...l, isVisible: !l.isVisible } : l)
        };
      }
      return c;
    });
    setSettings({ ...settings, footerColumns: updated });
  };

  const handleRemoveLink = (colId: string, linkId: string) => {
    if (!settings) return;
    const updated = (settings.footerColumns || []).map(c => {
      if (c.id === colId) {
        return {
          ...c,
          links: c.links.filter(l => l.id !== linkId)
        };
      }
      return c;
    });
    setSettings({ ...settings, footerColumns: updated });
  };

  // ================= SOCIAL LINKS HANDLERS =================
  const handleAddSocial = (presetName?: string, presetUrl?: string) => {
    const nameToAdd = (presetName || socialName).trim();
    const urlToAdd = (presetUrl || socialUrl).trim();

    if (!nameToAdd || !urlToAdd || !settings) return;

    const newLink: SocialLink = {
      id: Date.now().toString(),
      name: nameToAdd,
      url: urlToAdd,
      icon: nameToAdd.toLowerCase(),
      isVisible: true,
      order: (settings.socialLinks?.length || 0) + 1
    };

    setSettings({
      ...settings,
      socialLinks: [...(settings.socialLinks || []), newLink]
    });

    if (!presetName) {
      setSocialName('');
      setSocialUrl('');
    }
  };

  const handleRemoveSocial = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      socialLinks: (settings.socialLinks || []).filter(s => s.id !== id)
    });
  };

  const handleToggleSocialVisibility = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      socialLinks: (settings.socialLinks || []).map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s)
    });
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
        Loading Footer & Social Media configuration...
      </div>
    );
  }

  const existingNames = (settings.socialLinks || []).map(s => s.name.toLowerCase());

  const presets = [
    { name: 'YouTube', url: 'https://youtube.com/@vyrqonix' },
    { name: 'Facebook', url: 'https://facebook.com/vyrqonix' },
    { name: 'WhatsApp', url: 'https://wa.me/8801566088159' },
    { name: 'Telegram', url: 'https://t.me/vyrqonix' },
    { name: 'Behance', url: 'https://behance.net/vyrqonix' },
    { name: 'Twitter', url: 'https://twitter.com/vyrqonix' },
    { name: 'Instagram', url: 'https://instagram.com/vyrqonix' },
    { name: 'LinkedIn', url: 'https://linkedin.com/company/vyrqonix' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-xs text-slate-700 pb-24">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-600" />
          <span>Footer & Social Media Management</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Customize all footer sections live: Feature Badges, Brand Description, Navigation Columns & Links, Direct Contact info, Social Links, and Designer Credits.
        </p>
      </div>

      {/* 1. TOP VALUE PROPOSITION BADGES */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>1. Value Proposition Feature Badges (Top Cards)</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              The 3 highlight cards displayed above the footer (e.g. Instant Digital Delivery, 100% Genuine, Editable Files).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleBadges}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                settings.showFooterBadges !== false
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {settings.showFooterBadges !== false ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Badges Enabled</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Badges Disabled</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleAddBadge}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Badge</span>
            </button>
          </div>
        </div>

        {/* Badges List */}
        <div className="space-y-4">
          {(settings.footerBadges || []).length === 0 ? (
            <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No badges currently defined. Click "Add Badge" above to create one.
            </div>
          ) : (
            (settings.footerBadges || []).map((badge, idx) => (
              <div key={badge.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>Feature Card #{idx + 1}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveBadge(badge.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove Badge"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Icon Style</label>
                    <select
                      value={badge.icon || 'download'}
                      onChange={(e) => handleUpdateBadge(badge.id, 'icon', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    >
                      <option value="download">Download (Cloud Icon)</option>
                      <option value="shield">Shield (Authentic/Verified)</option>
                      <option value="sparkles">Sparkles (Creative/Editable)</option>
                      <option value="zap">Zap (Instant/Fast)</option>
                      <option value="check">Checkmark (Tested/Working)</option>
                      <option value="support">Headphones (24/7 Support)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Badge Title</label>
                    <input
                      type="text"
                      value={badge.title}
                      onChange={(e) => handleUpdateBadge(badge.id, 'title', e.target.value)}
                      placeholder="e.g. Instant Digital Delivery"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Subtitle / Description</label>
                    <input
                      type="text"
                      value={badge.subtitle}
                      onChange={(e) => handleUpdateBadge(badge.id, 'subtitle', e.target.value)}
                      placeholder="e.g. Download source files right after order confirmation"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. BRAND & SUMMARY INFO */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span>2. Brand Column & Footer Description</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            The description text shown under the Vyrqonix logo in the main footer.
          </p>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
            Footer Site Description
          </label>
          <textarea
            rows={2}
            value={settings.siteDescription || ''}
            onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
            placeholder="A digital marketplace for graphic design resources, editable design files, software and apps."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all leading-relaxed"
          />
        </div>
      </div>

      {/* 3. FOOTER NAVIGATION COLUMNS & LINKS */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Columns className="w-4 h-4 text-blue-600" />
              <span>3. Footer Link Columns & Menu Items</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Add, rename, or remove link columns (like "SUPPORT & INFO"). Add custom links, edit URLs, or toggle visibility.
            </p>
          </div>

          {/* Add new column inline input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="New column name..."
              value={newColTitle}
              onChange={(e) => setNewColTitle(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddColumn}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Column</span>
            </button>
          </div>
        </div>

        {/* Render each column */}
        <div className="space-y-6">
          {(settings.footerColumns || []).map((col, cIdx) => (
            <div key={col.id || cIdx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-slate-400 font-bold text-xs">Column #{cIdx + 1} Title:</span>
                  <input
                    type="text"
                    value={col.title}
                    onChange={(e) => handleUpdateColumnTitle(col.id, e.target.value)}
                    className="font-bold text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-wider w-64"
                  />
                  <span className="text-[11px] text-slate-400">({col.links.length} links)</span>
                </div>

                {(settings.footerColumns || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveColumn(col.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete entire column"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Links list inside this column */}
              <div className="space-y-2.5">
                {col.links.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 text-[11px]">
                    No links in this column. Add one below.
                  </div>
                ) : (
                  col.links.map((link) => (
                    <div key={link.id} className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200">
                      <div className="sm:w-1/3">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => handleUpdateLink(col.id, link.id, 'label', e.target.value)}
                          placeholder="Link Label (e.g. About Us)"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex-1">
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => handleUpdateLink(col.id, link.id, 'url', e.target.value)}
                          placeholder="/about or https://..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleToggleLinkVisibility(col.id, link.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                            link.isVisible 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {link.isVisible ? 'Visible' : 'Hidden'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveLink(col.id, link.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Link form inside this column */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="New link name (e.g. FAQs & Help, Terms)"
                  value={newLinkLabels[col.id] || ''}
                  onChange={(e) => setNewLinkLabels({ ...newLinkLabels, [col.id]: e.target.value })}
                  className="sm:w-1/3 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="URL Path (/faq or https://...)"
                  value={newLinkUrls[col.id] || ''}
                  onChange={(e) => setNewLinkUrls({ ...newLinkUrls, [col.id]: e.target.value })}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddLinkToColumn(col.id)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Link</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. DIRECT CONTACT DETAILS */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-600" />
            <span>4. Direct Contact Information</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            The contact details shown in the footer contact column and mobile footer bar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Column Title
            </label>
            <input
              type="text"
              value={settings.footerContactTitle || 'Direct Contact'}
              onChange={(e) => setSettings({ ...settings, footerContactTitle: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Address</span>
            </label>
            <input
              type="text"
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              placeholder="Dhaka, Bangladesh"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Phone / Hotline</span>
            </label>
            <input
              type="text"
              value={settings.phone || ''}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              placeholder="01566088159"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              value={settings.email || ''}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              placeholder="vyrqonix.info@gmail.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* 5. CONFIGURED SOCIAL CHANNELS */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-600" />
              <span>5. Social Media Channels ({settings.socialLinks?.length || 0})</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              These links appear in the brand column with custom branded icons (YouTube, Facebook, WhatsApp, etc.).
            </p>
          </div>
        </div>

        {/* Existing Social Links list */}
        <div className="space-y-3">
          {(!settings.socialLinks || settings.socialLinks.length === 0) ? (
            <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No social media channels added yet. Add one below or use one of the quick presets.
            </div>
          ) : (
            settings.socialLinks.map((soc) => (
              <div key={soc.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-900 w-28 shrink-0">{soc.name}</span>
                
                <input
                  type="url"
                  value={soc.url}
                  onChange={(e) => {
                    const updated = (settings.socialLinks || []).map(s => s.id === soc.id ? { ...s, url: e.target.value } : s);
                    setSettings({ ...settings, socialLinks: updated });
                  }}
                  placeholder="https://..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {soc.url && (
                    <a
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-200 rounded-xl transition-colors"
                      title="Open link preview"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleSocialVisibility(soc.id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-colors ${
                      soc.isVisible 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {soc.isVisible ? 'Visible' : 'Hidden'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveSocial(soc.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Remove Link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Quick Presets */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 block mb-2">Quick Add Channel:</span>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => {
                const isAdded = existingNames.includes(preset.name.toLowerCase());
                return (
                  <button
                    key={preset.name}
                    type="button"
                    disabled={isAdded}
                    onClick={() => handleAddSocial(preset.name, preset.url)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isAdded 
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        : 'bg-white hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-200 hover:border-blue-600 shadow-2xs'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{preset.name}</span>
                    {isAdded && <span className="text-[10px] text-slate-400">(added)</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Add form */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-xs mb-3">Add Custom Social Link</h3>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Platform Name (e.g. Behance, Twitter, Pinterest)"
                value={socialName}
                onChange={(e) => setSocialName(e.target.value)}
                className="sm:w-1/3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <input
                type="url"
                placeholder="Profile or Channel URL (https://...)"
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => handleAddSocial()}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shrink-0 active:scale-95 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Channel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM COPYRIGHT & DESIGNER CREDITS */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>6. Bottom Copyright & Designer Credits</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Manage the bottom-most copyright notice and the designer credit name & link.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Copyright Notice Template
            </label>
            <input
              type="text"
              value={settings.footerCopyrightText || '© {year} {siteName}. All rights reserved.'}
              onChange={(e) => setSettings({ ...settings, footerCopyrightText: e.target.value })}
              placeholder="© {year} {siteName}. All rights reserved."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Tip: Use &#123;year&#125; and &#123;siteName&#125; placeholders for dynamic auto-updating.
            </span>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Credit Prefix
            </label>
            <input
              type="text"
              value={settings.footerDesignerPrefix || 'Design by'}
              onChange={(e) => setSettings({ ...settings, footerDesignerPrefix: e.target.value })}
              placeholder="Design by"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Designer Name
            </label>
            <input
              type="text"
              value={settings.footerDesignerName || 'Murad Rahman'}
              onChange={(e) => setSettings({ ...settings, footerDesignerName: e.target.value })}
              placeholder="Murad Rahman"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Designer Portfolio or Profile Link
            </label>
            <input
              type="url"
              value={settings.footerDesignerUrl || ''}
              onChange={(e) => setSettings({ ...settings, footerDesignerUrl: e.target.value })}
              placeholder="https://www.facebook.com/profile.php?id=100085471628384"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Floating Save Action Bar */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 sticky bottom-4 shadow-xl z-20">
        <div className="flex items-center gap-2">
          {saveSuccess ? (
            <span className="text-emerald-600 text-xs font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>All footer and social settings saved successfully!</span>
            </span>
          ) : (
            <span className="text-slate-500 text-xs font-medium">
              Click "Save All Footer Settings" to immediately apply changes across your website.
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 text-xs"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving Changes..." : "Save All Footer Settings"}</span>
        </button>
      </div>

    </div>
  );
};
