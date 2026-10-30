import React, { useEffect, useState } from 'react';
import { getSiteSettings, DEFAULT_SITE_SETTINGS } from '../../services/api';
import { SiteSettings } from '../../types';
import { ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';
import { useSEO } from '../../hooks/useSEO';

export const AboutPage: React.FC = () => {
  useSEO({
    title: 'About Us | Vyrqonix Digital Marketplace',
    description: 'Learn about Vyrqonix, our mission, digital graphic resources, software solutions and creative tools.',
    canonical: '/about'
  });
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  useEffect(() => { getSiteSettings().then(setSettings); }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900">About Vyrqonix</h1>
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed whitespace-pre-line">
        {settings.aboutText}
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  useSEO({
    title: 'Contact Support & Helpdesk | Vyrqonix',
    description: 'Get in touch with Vyrqonix support team via Phone, WhatsApp or Email for instant assistance with orders and files.',
    canonical: '/contact'
  });
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  useEffect(() => { getSiteSettings().then(setSettings); }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">Contact Support</h1>
        <p className="text-xs text-slate-500">Need help with your order or access? Reach out to our Dhaka support desk.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col items-center">
            <Phone className="w-6 h-6 text-blue-600 mb-2" />
            <span className="text-xs text-slate-500 font-medium">Direct Phone</span>
            <span className="text-xs font-bold text-slate-800 mt-1">{settings.phone}</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col items-center">
            <Mail className="w-6 h-6 text-blue-600 mb-2" />
            <span className="text-xs text-slate-500 font-medium">Support Email</span>
            <span className="text-xs font-bold text-slate-800 mt-1">{settings.email}</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col items-center">
            <MapPin className="w-6 h-6 text-blue-600 mb-2" />
            <span className="text-xs text-slate-500 font-medium">Location</span>
            <span className="text-xs font-bold text-slate-800 mt-1">{settings.address}</span>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
          <p className="text-xs text-emerald-800 font-bold">Fast WhatsApp Response Available</p>
          <a
            href={`https://wa.me/88${settings.whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <img src="/whatsapp.webp" alt="WhatsApp" className="w-4 h-4 rounded object-contain" />
            Chat on WhatsApp ({settings.whatsapp})
          </a>
        </div>
      </div>
    </div>
  );
};

export const LicensePolicyPage: React.FC = () => {
  useSEO({
    title: 'Commercial & Digital License Policy | Vyrqonix',
    description: 'Understand license terms for templates, digital downloads, software and creative assets on Vyrqonix.',
    canonical: '/license-policy'
  });
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  useEffect(() => { getSiteSettings().then(setSettings); }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Commercial & Digital License Policy</h1>
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed whitespace-pre-line">
        {settings.defaultLicensePolicy}
      </div>
    </div>
  );
};

export const RefundPolicyPage: React.FC = () => {
  useSEO({
    title: 'Digital Refund Policy | Vyrqonix',
    description: 'Review the digital refund and customer satisfaction policy of Vyrqonix digital marketplace.',
    canonical: '/refund-policy'
  });
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  useEffect(() => { getSiteSettings().then(setSettings); }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Digital Refund Policy</h1>
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed whitespace-pre-line">
        {settings.defaultRefundPolicy}
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  useSEO({
    title: 'Terms of Service | Vyrqonix',
    description: 'Read the terms of service, conditions and acceptable usage guidelines for Vyrqonix marketplace.',
    canonical: '/terms'
  });
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  useEffect(() => { getSiteSettings().then(setSettings); }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Terms of Service</h1>
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed whitespace-pre-line">
        {settings.defaultLicensePolicy || settings.termsAndConditions}
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  useSEO({
    title: 'Privacy Policy | Vyrqonix',
    description: 'Learn how Vyrqonix handles and protects your digital privacy, personal data, and account information.',
    canonical: '/privacy'
  });
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  useEffect(() => { getSiteSettings().then(setSettings); }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed whitespace-pre-line">
        {settings.privacyPolicy}
      </div>
    </div>
  );
};

export const FaqPage: React.FC = () => {
  useSEO({
    title: 'Frequently Asked Questions (FAQ) | Vyrqonix',
    description: 'Find answers to common questions about downloads, payments, licenses, file formats, and software installation at Vyrqonix.',
    canonical: '/faq'
  });
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  useEffect(() => { getSiteSettings().then(setSettings); }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <h1 className="text-3xl font-extrabold text-slate-900 text-center">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {settings.faqList?.map((faq: { question: string; answer: string }, i: number) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">{faq.question}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
