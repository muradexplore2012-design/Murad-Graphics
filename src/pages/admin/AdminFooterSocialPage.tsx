import React, { useEffect, useState } from 'react';
import { 
  getSiteSettings, 
  updateSiteSettings,
  recordAuditLog 
} from '../../services/api';
import { SiteSettings, SocialLink } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Globe, 
  Trash2, 
  Save, 
  Plus, 
  ExternalLink,
  Check,
  Share2
} from 'lucide-react';

export const AdminFooterSocialPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Social Link Form
  const [socialName, setSocialName] = useState('');
  const [socialUrl, setSocialUrl] = useState('');

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  const handleSaveLinks = async () => {
    if (!settings) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateSiteSettings({ socialLinks: settings.socialLinks || [] });
      await recordAuditLog({
        adminUid: user?.uid || '',
        adminEmail: user?.email || '',
        action: 'UPDATE_FOOTER_SOCIAL_LINKS',
        targetType: 'SETTINGS',
        targetId: 'socialLinks',
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert("Failed to save social links: " + e.message);
    } finally {
      setSaving(false);
    }
  };

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
    { name: 'YouTube', url: 'https://youtube.com/@muradgraphics' },
    { name: 'Facebook', url: 'https://facebook.com/muradgraphics' },
    { name: 'WhatsApp', url: 'https://wa.me/8801566088159' },
    { name: 'Telegram', url: 'https://t.me/muradgraphics' },
    { name: 'Behance', url: 'https://behance.net/muradgraphics' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-xs text-slate-700">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-600" />
          <span>Footer & Social Media Links</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage, toggle visibility, and update official social media channels displayed in the website footer.
        </p>
      </div>

      {/* Main Social Links Box */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-600" />
              <span>Configured Social Channels ({settings.socialLinks?.length || 0})</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              These links appear in the footer with custom branded icons (YouTube, Facebook, WhatsApp, etc.)
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

      {/* Save Action Floating Bar */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 sticky bottom-4 shadow-lg">
        <span className="text-slate-600 text-xs font-medium">
          {saveSuccess ? "✓ Footer social links saved successfully!" : "Make sure to click save to store changes in the database."}
        </span>

        <button
          type="button"
          onClick={handleSaveLinks}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 text-xs"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save Social Links"}</span>
        </button>
      </div>

    </div>
  );
};
