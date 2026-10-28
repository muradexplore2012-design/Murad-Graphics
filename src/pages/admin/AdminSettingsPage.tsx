import React, { useEffect, useState } from 'react';
import { 
  getSiteSettings, 
  updateSiteSettings,
  recordAuditLog,
  getAdminList,
  makeAdminByEmail,
  revokeAdmin 
} from '../../services/api';
import { SiteSettings, AdminMember } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  Info,
  Save, 
  ShieldCheck, 
  Sliders, 
  UserPlus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Shield, 
  Crown, 
  Mail, 
  Calendar, 
  Lock,
  RefreshCw 
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'general' | 'make-admin'>('general');

  // General Settings State
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Make Admin State
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [submittingAdmin, setSubmittingAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [confirmGrantModal, setConfirmGrantModal] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState<AdminMember | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    getSiteSettings(true).then((s) => {
      setSettings(s);
      if (s.defaultLicensePolicy && s.defaultRefundPolicy) {
        updateSiteSettings({
          defaultLicensePolicy: s.defaultLicensePolicy,
          defaultRefundPolicy: s.defaultRefundPolicy
        }).catch((e) => console.warn("Auto-sync policies:", e));
      }
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'make-admin' && isSuperAdmin) {
      loadAdmins();
    }
  }, [activeTab, isSuperAdmin]);

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const list = await getAdminList();
      setAdmins(list);
    } catch (err: any) {
      console.error("Failed to load admin list:", err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateSiteSettings(settings);
      if (settings.siteTitle) {
        document.title = settings.siteTitle;
      }
      try {
        localStorage.setItem('mg_site_settings_cache', JSON.stringify(settings));
        window.dispatchEvent(new CustomEvent('mg_site_settings_updated', { detail: settings }));
      } catch {}
      await recordAuditLog({
        adminUid: user?.uid || '',
        adminEmail: user?.email || '',
        action: 'UPDATE_SITE_SETTINGS',
        targetType: 'SETTINGS',
        targetId: 'general',
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert("Failed to save settings: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Open confirmation modal for Make Admin
  const handleInitiateMakeAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    const targetEmail = emailInput.trim().toLowerCase();
    if (!targetEmail) {
      setAdminError("দয়া করে একটি সঠিক ইমেইল এড্রেস লিখুন।");
      return;
    }

    if (!targetEmail.includes('@') || !targetEmail.includes('.')) {
      setAdminError("দয়া করে সঠিক ফরম্যাটের ইমেইল এড্রেস লিখুন।");
      return;
    }

    setConfirmGrantModal(true);
  };

  // Execute Make Admin after confirmation
  const handleConfirmMakeAdmin = async () => {
    setConfirmGrantModal(false);
    setSubmittingAdmin(true);
    setAdminError('');
    setAdminSuccess('');

    try {
      if (!user) throw new Error("Authentication required.");

      const newAdmin = await makeAdminByEmail(emailInput, {
        uid: user.uid,
        email: user.email
      });

      setAdminSuccess(`সফল হয়েছে! ${newAdmin.email} কে এডমিন অ্যাক্সেস দেওয়া হয়েছে। তিনি ব্রাউজার রিফ্রেশ করলেই বা পুনরায় লগইন করলেই এডমিন সুবিধা ব্যবহার করতে পারবেন।`);
      setEmailInput('');
      await loadAdmins();
    } catch (err: any) {
      setAdminError(err.message || "এডমিন নিয়োগ করতে ব্যর্থ হয়েছে।");
    } finally {
      setSubmittingAdmin(false);
    }
  };

  // Execute Revoke Admin after confirmation
  const handleConfirmRevokeAdmin = async () => {
    if (!adminToRemove || !user) return;

    setRevoking(true);
    setAdminError('');
    setAdminSuccess('');

    try {
      await revokeAdmin(adminToRemove.uid, {
        uid: user.uid,
        email: user.email
      });

      setAdminSuccess(`Administrator access revoked for ${adminToRemove.email}.`);
      setAdminToRemove(null);
      await loadAdmins();
    } catch (err: any) {
      setAdminError(err.message || "Failed to remove administrator.");
    } finally {
      setRevoking(false);
    }
  };

  if (!settings) return <div className="text-slate-500 text-xs">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-xs text-slate-700 antialiased pb-12">
      
      {/* Header & Tabs */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Marketplace Settings & Administration</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure marketplace localization, policies, and manage privileged access
        </p>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 pb-3 px-4 font-bold text-xs transition-all border-b-2 cursor-pointer ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>General Settings</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('make-admin')}
              className={`flex items-center gap-2 pb-3 px-4 font-bold text-xs transition-all border-b-2 cursor-pointer ${
                activeTab === 'make-admin'
                  ? 'border-[#7a00ea] text-[#7a00ea]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Make Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: GENERAL SETTINGS */}
      {/* ========================================================= */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="space-y-8">
          
          {/* Contact Info & Metadata */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <span>1. Business Contact & Bangladesh Localization</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1 text-slate-800">
                  Browser Tab Title (ওয়েবসাইটের ব্রাউজার ট্যাব টাইটেল)
                </label>
                <input
                  type="text"
                  value={settings.siteTitle || ''}
                  placeholder="Vyrqonix | Digital Graphic Resources, Templates & Software"
                  onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  ব্রাউজারের ওপরে ট্যাবে যে নাম ও স্লোগান দেখায় তা এখান থেকে পরিবর্তন করতে পারবেন।
                </p>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">Marketplace Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Logo Subtitle / Tagline (লোগোর নিচের ছোট লেখা)
                </label>
                <input
                  type="text"
                  value={settings.siteSubtitle ?? 'YOUR DIGITAL WORLD'}
                  placeholder="YOUR DIGITAL WORLD"
                  onChange={(e) => setSettings({ ...settings, siteSubtitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  হেডারে লোগোর নামের নিচে এবং অ্যাপে যে ছোট লেখাটি দেখায় (যেমন: YOUR DIGITAL WORLD)।
                </p>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">Support Phone (Bangladesh)</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">Support Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">WhatsApp Hotline</label>
                <input
                  type="text"
                  value={settings.whatsapp}
                  onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1 text-slate-800">Physical / Business Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1 text-slate-800">Store Tagline / Description</label>
                <textarea
                  rows={2}
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Legal Policies */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              2. Digital Policies & Terms
            </h2>

            <div className="space-y-4">
              <div>
                <label className="font-semibold block mb-1 text-slate-800">Usage & Service Terms</label>
                <textarea
                  rows={4}
                  value={settings.defaultLicensePolicy}
                  onChange={(e) => setSettings({ ...settings, defaultLicensePolicy: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">Digital Refund Policy</label>
                <textarea
                  rows={4}
                  value={settings.defaultRefundPolicy}
                  onChange={(e) => setSettings({ ...settings, defaultRefundPolicy: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Save Bar */}
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 sticky bottom-4 shadow-lg">
            <span className="text-slate-600 text-xs font-medium">
              {saveSuccess ? "✓ Settings successfully updated in Firestore!" : "Ready to save modifications"}
            </span>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save All Settings"}</span>
            </button>
          </div>

        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MAKE ADMIN (SUPER ADMIN ONLY) */}
      {/* ========================================================= */}
      {activeTab === 'make-admin' && isSuperAdmin && (
        <div className="space-y-8">
          
          {/* Alerts */}
          {adminError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-xs">Action Failed</p>
                <p className="text-xs mt-0.5 leading-relaxed">{adminError}</p>
              </div>
            </div>
          )}

          {adminSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-xs">Action Completed</p>
                <p className="text-xs mt-0.5 leading-relaxed">{adminSuccess}</p>
              </div>
            </div>
          )}

          {/* Make Admin Form Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#7a00ea] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Appoint Administrator (এডমিন নিয়োগ)</h2>
                <p className="text-[11px] text-slate-500">
                  নিবন্ধিত অ্যাকাউন্টকে ওয়েবসাইটের এডমিন এক্সেস ও পরিচালনা সুবিধা দিন
                </p>
              </div>
            </div>

            {/* Bengali Rule Guide Box */}
            <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 sm:p-5 text-xs space-y-3">
              <div className="flex items-center gap-2 text-purple-950 font-bold">
                <Info className="w-4 h-4 text-[#7a00ea] shrink-0" />
                <span className="text-xs">নতুন এডমিন যুক্ত করার নিয়মাবলী (Guidelines):</span>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-slate-700 text-[11px] leading-relaxed pl-0.5">
                <li>
                  <strong className="text-slate-900">১. ওয়েবসাইটে আগে সাইন-ইন/একাউন্ট করতে হবে:</strong> যাকে আপনি এডমিন বানাতে চান, তাকে প্রথমে <a href="/" target="_blank" rel="noreferrer" className="text-[#7a00ea] font-bold underline underline-offset-2">Vyrqonix</a> ওয়েবসাইটে গিয়ে (কাস্টমার হিসেবে) অন্তত একবার গুগল বা ইমেইল দিয়ে লগইন/সাইন-আপ করতে হবে।
                </li>
                <li>
                  <strong className="text-slate-900">২. সঠিক ইমেইল দিন:</strong> ইউজার যে ইমেইল দিয়ে একাউন্ট খুলেছেন, ঠিক সেই ইমেইল এড্রেসটি নিচের ইনপুট বক্সে লিখুন।
                </li>
                <li>
                  <strong className="text-slate-900">৩. Make Admin বাটনে চাপ দিন:</strong> <strong>"Make Admin"</strong> বাটনে ক্লিক করে কনফার্ম করলে তিনি তাৎক্ষণিকভাবে এডমিন তালিকায় যুক্ত হয়ে যাবেন।
                </li>
                <li>
                  <strong className="text-slate-900">৪. এডমিন প্যানেল এক্সেস:</strong> এরপর তিনি পেজ রিফ্রেশ করলে কিংবা লগআউট করে পুনরায় লগইন করলেই এডমিন কনসোল ব্যবহার করতে পারবেন।
                </li>
              </ol>
            </div>

            <form onSubmit={handleInitiateMakeAdmin} className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  ইউজারের ইমেইল এড্রেস (User Account Email Address) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. employee@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    disabled={submittingAdmin}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7a00ea] focus:bg-white transition-all text-xs"
                  />
                </div>
                <div className="mt-2 text-[11px] bg-amber-50 text-amber-800 border border-amber-200/80 p-2.5 rounded-xl font-medium leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>জরুরি নিয়ম:</strong> ইউজারকে অবশ্যই আগে Vyrqonix ওয়েবসাইটে একবার সাইন-ইন করে একাউন্ট তৈরি করতে হবে। একাউন্ট তৈরি না থাকলে ফায়ারবেসে ইউজার খুঁজে পাওয়া যাবে না এবং এডমিন বানানো যাবে না।
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submittingAdmin || !emailInput.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-[#7a00ea] hover:bg-[#6800c7] text-white rounded-xl font-bold transition-all shadow-md shadow-purple-600/20 active:scale-95 disabled:opacity-50 cursor-pointer text-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{submittingAdmin ? "যাচাই করা হচ্ছে..." : "Make Admin"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Admin List Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">Current Administrator List</h2>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {admins.length} Total
                </span>
              </div>

              <button
                type="button"
                onClick={loadAdmins}
                disabled={loadingAdmins}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Refresh Administrator List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAdmins ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingAdmins ? (
              <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#7a00ea]" />
                <span>Loading administrator list...</span>
              </div>
            ) : admins.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No administrators found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3">Administrator</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Date Added</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {admins.map((adm) => {
                      const isRootSuper = adm.role === 'super_admin';
                      return (
                        <tr key={adm.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                {adm.displayName || adm.email.split('@')[0]}
                                {isRootSuper && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                              </span>
                              <span className="text-[11px] text-slate-500">{adm.email}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            {isRootSuper ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-[#7a00ea] border border-purple-200">
                                <Crown className="w-3 h-3" />
                                Super Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <Shield className="w-3 h-3" />
                                Admin
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{new Date(adm.addedAt).toLocaleDateString('en-GB')}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            {isRootSuper ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium select-none" title="Root Super Administrator is protected">
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                Root Authority
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setAdminToRemove(adm)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* CONFIRMATION MODAL: MAKE ADMIN */}
      {/* ========================================================= */}
      {confirmGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#7a00ea] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">এডমিন নিয়োগ নিশ্চিত করুন (Confirm Promotion)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                আপনি কি নিশ্চিত যে এই ইউজারকে সম্পূর্ণ এডমিন ক্ষমতা দিতে চান?
              </p>
              <p className="text-xs font-bold text-[#7a00ea] bg-purple-50 border border-purple-100 py-2 px-3 rounded-xl break-all">
                {emailInput.trim().toLowerCase()}
              </p>
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 leading-normal">
                এই ইউজার ওয়েবসাইটটির প্রোডাক্ট, ক্যাটাগরি, সেলস অর্ডার, কুপন এবং ব্যানার ম্যানেজ করতে পারবেন।
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmGrantModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMakeAdmin}
                className="py-2.5 px-4 rounded-xl bg-[#7a00ea] hover:bg-[#6800c7] text-white font-bold transition-all shadow-md shadow-purple-600/20 text-xs cursor-pointer"
              >
                Confirm & Appoint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONFIRMATION MODAL: REVOKE ADMIN */}
      {/* ========================================================= */}
      {adminToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">Revoke Administrator Access</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to remove administrator privileges from:
              </p>
              <p className="text-xs font-bold text-slate-900 bg-slate-100 py-2 px-3 rounded-xl break-all">
                {adminToRemove.email}
              </p>
              <p className="text-[11px] text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 leading-normal">
                This account will immediately lose all administrative rights and access to the Vyrqonix admin console.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={revoking}
                onClick={() => setAdminToRemove(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revoking}
                onClick={handleConfirmRevokeAdmin}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md shadow-rose-600/20 text-xs cursor-pointer"
              >
                {revoking ? "Revoking..." : "Revoke Access"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
