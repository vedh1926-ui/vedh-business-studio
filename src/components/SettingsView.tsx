'use client';

import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  DEFAULT_STUDIO_SETTINGS,
  StudioSettings,
  SupabaseSyncDiagnostic,
} from '@/lib/studioSync';
import { Settings as SettingsIcon, Cloud, ShieldCheck, Key, CheckCircle, ExternalLink } from 'lucide-react';

interface SettingsViewProps {
  settings?: StudioSettings;
  onSaveSettings?: (next: StudioSettings) => void;
  syncDiagnostic?: SupabaseSyncDiagnostic;
  lastSavedAt?: string | null;
}

export default function SettingsView({
  settings = DEFAULT_STUDIO_SETTINGS,
  onSaveSettings,
  syncDiagnostic,
  lastSavedAt,
}: SettingsViewProps) {
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [currency, setCurrency] = useState(settings.currency);
  const [showLowStock, setShowLowStock] = useState(settings.showLowStock);
  const [tagline, setTagline] = useState(settings.tagline);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setBusinessName(settings.businessName);
    setCurrency(settings.currency);
    setShowLowStock(settings.showLowStock);
    setTagline(settings.tagline);
  }, [settings.businessName, settings.currency, settings.showLowStock, settings.tagline]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings?.({
      businessName: businessName.trim() || DEFAULT_STUDIO_SETTINGS.businessName,
      currency,
      showLowStock,
      tagline: tagline.trim() || DEFAULT_STUDIO_SETTINGS.tagline,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
          Settings
        </h2>
        <p className="text-xs text-[#7A6E6E]">
          Manage your Vedh records, brand preferences &amp; cloud database synchronization
        </p>
      </div>

      {/* Business Settings Card matching page 10 */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl p-6 sm:p-8 shadow-sm">
        <h3 className="font-serif text-lg font-bold text-[#2C181B] mb-1">
          Business settings
        </h3>
        <p className="text-xs text-[#7A6E6E] mb-6">
          These preferences are saved in your current Vedh workspace.
        </p>

        <form onSubmit={handleSave} className="space-y-6 max-w-xl text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1.5">
                Business name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523] text-sm"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523] text-sm"
              >
                <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                <option value="USD ($)">USD ($) - US Dollar</option>
                <option value="AED (AED)">AED - UAE Dirham</option>
                <option value="GBP (£)">GBP (£) - British Pound</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#423A3A] font-semibold mb-1.5">
              Brand Subtitle / Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523] text-sm"
            />
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <input
              type="checkbox"
              id="lowStockReminder"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="w-4 h-4 text-[#541523] rounded border-[#D9C9B4] focus:ring-[#541523]"
            />
            <label htmlFor="lowStockReminder" className="text-xs font-medium text-[#2C181B] cursor-pointer">
              Show low-stock reminders on dashboard
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#541523] text-white rounded-lg font-semibold hover:bg-[#6E1C30] transition flex items-center space-x-2 text-xs"
            >
              <span>Save Business Settings</span>
              {saved && <CheckCircle size={14} className="text-emerald-400" />}
            </button>
          </div>
        </form>
      </div>

      {/* Cloud & Supabase Integration Panel */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <Cloud size={20} className="text-[#8F243C]" />
          <h3 className="font-serif text-lg font-bold text-[#2C181B]">
            Cloud &amp; Supabase Integration
          </h3>
        </div>
        <p className="text-xs text-[#7A6E6E] mb-6">
          Connect your remote PostgreSQL database for real-time cloud synchronization, multi-device access, and future e-commerce storefront linkage.
        </p>

        <div className="p-4 rounded-xl border border-[#E8DDCF] bg-[#FAF5EE] space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  syncDiagnostic?.mode === 'connected'
                    ? 'bg-emerald-500'
                    : isSupabaseConfigured
                    ? 'bg-amber-500'
                    : 'bg-amber-500'
                }`}
              />
              <span className="font-semibold text-[#2C181B]">
                {syncDiagnostic
                  ? syncDiagnostic.settingsHeading
                  : isSupabaseConfigured
                  ? 'Supabase Credentials Present (Local Storage Workspace Active)'
                  : 'Operating in Secure Local State'}
              </span>
            </div>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-[11px] text-[#8F243C] font-semibold hover:underline shrink-0"
            >
              <span>Supabase Dashboard</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <p className="text-[11px] text-[#635B5B] leading-relaxed">
            {syncDiagnostic
              ? syncDiagnostic.settingsDetail
              : 'Edits save directly to your browser workspace and sync immediately across open tabs in the same browser.'}
            {lastSavedAt && (
              <span className="ml-2 font-mono text-emerald-700">
                Last saved at {lastSavedAt}.
              </span>
            )}
          </p>

          <p className="text-[11px] text-[#635B5B] leading-relaxed">
            To apply the latest tables/columns on Supabase, execute <code>supabase_schema.sql</code> in the Supabase SQL Editor and ensure environment variables are set:
          </p>

          <pre className="p-3 bg-[#3D0E18] text-[#F3E3B5] rounded-lg font-mono text-[11px] overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key`}
          </pre>
        </div>
      </div>
    </div>
  );
}
