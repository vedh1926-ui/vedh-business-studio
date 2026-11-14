'use client';

import React, { useState } from 'react';
import { Customer } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { normalizeInstagramHandle, getInstagramProfileUrl } from '@/lib/oprFormulas';
import {
  X,
  Instagram,
  Phone,
  MessageCircle,
  MapPin,
  Sparkles,
  ExternalLink,
  CopyCheck,
} from 'lucide-react';

export interface CustomerFormPayload {
  name: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  city?: string;
  pincode?: string;
  instagramHandle?: string;
  socialPlatform?: string;
  socialHandle?: string;
  preferredContact?: Customer['preferredContact'];
  acquisitionSource?: Customer['acquisitionSource'];
  referredBy?: string;
  occasionFocus?: string;
  stylePreferences?: string;
  importantDates?: string;
  gstin?: string;
  notes?: string;
  type: Customer['type'];
}

interface CustomerModalProps {
  initialCustomer?: Customer | null;
  existingCustomers?: Customer[];
  onClose: () => void;
  onSave: (data: CustomerFormPayload, existingId?: string) => void;
}

const CUSTOMER_TYPES: Customer['type'][] = ['Individual', 'VIP', 'Corporate'];
const PREFERRED_CHANNELS: NonNullable<Customer['preferredContact']>[] = [
  'WhatsApp',
  'Instagram DM',
  'Phone Call',
  'Email',
];
const ACQUISITION_SOURCES: NonNullable<Customer['acquisitionSource']>[] = [
  'Instagram',
  'WhatsApp Referral',
  'Word of Mouth',
  'Exhibition / Pop-up',
  'Website / Storefront',
  'Corporate Outreach',
  'Repeat Client',
  'Other',
];
const OTHER_SOCIAL_PLATFORMS = [
  'Facebook',
  'Pinterest',
  'LinkedIn',
  'YouTube',
  'WhatsApp Business',
  'Other',
];

function cleanInitialPhone(raw?: string): string {
  const v = (raw || '').trim();
  return v && v !== '—' && v !== '-' ? v : '';
}

export default function CustomerModal({
  initialCustomer = null,
  existingCustomers = [],
  onClose,
  onSave,
}: CustomerModalProps) {
  const [name, setName] = useState(initialCustomer?.name || '');
  const [type, setType] = useState<Customer['type']>(initialCustomer?.type || 'Individual');
  const [preferredContact, setPreferredContact] = useState<
    NonNullable<Customer['preferredContact']>
  >(initialCustomer?.preferredContact || 'WhatsApp');

  const [phone, setPhone] = useState(cleanInitialPhone(initialCustomer?.phone));
  const [whatsappNumber, setWhatsappNumber] = useState(
    cleanInitialPhone(initialCustomer?.whatsappNumber)
  );
  const [email, setEmail] = useState(initialCustomer?.email || '');
  const [city, setCity] = useState(initialCustomer?.city || '');
  const [pincode, setPincode] = useState(initialCustomer?.pincode || '');

  const [instagramHandle, setInstagramHandle] = useState(
    initialCustomer?.instagramHandle || ''
  );
  const [socialPlatform, setSocialPlatform] = useState(
    initialCustomer?.socialPlatform || 'Facebook'
  );
  const [socialHandle, setSocialHandle] = useState(initialCustomer?.socialHandle || '');
  const [acquisitionSource, setAcquisitionSource] = useState<
    NonNullable<Customer['acquisitionSource']>
  >(initialCustomer?.acquisitionSource || 'Instagram');
  const [referredBy, setReferredBy] = useState(initialCustomer?.referredBy || '');

  const [occasionFocus, setOccasionFocus] = useState(initialCustomer?.occasionFocus || '');
  const [stylePreferences, setStylePreferences] = useState(
    initialCustomer?.stylePreferences || ''
  );
  const [importantDates, setImportantDates] = useState(
    initialCustomer?.importantDates || ''
  );
  const [gstin, setGstin] = useState(initialCustomer?.gstin || '');
  const [notes, setNotes] = useState(initialCustomer?.notes || '');

  const normalizedDraftName = name.trim().toLowerCase().replace(/\s+/g, ' ');
  const matchingExisting =
    !initialCustomer && normalizedDraftName
      ? existingCustomers.find(
          (c) => (c.name || '').trim().toLowerCase().replace(/\s+/g, ' ') === normalizedDraftName
        )
      : undefined;

  const igPreviewUrl = getInstagramProfileUrl(instagramHandle);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const normalizedIg = normalizeInstagramHandle(instagramHandle);

    onSave(
      {
        name: name.trim(),
        phone: phone.trim() || '—',
        whatsappNumber: whatsappNumber.trim() || undefined,
        email: email.trim() || undefined,
        city: city.trim() || undefined,
        pincode: pincode.trim() || undefined,
        instagramHandle: normalizedIg || undefined,
        socialPlatform: socialHandle.trim() ? socialPlatform : undefined,
        socialHandle: socialHandle.trim() || undefined,
        preferredContact,
        acquisitionSource,
        referredBy: referredBy.trim() || undefined,
        occasionFocus: occasionFocus.trim() || undefined,
        stylePreferences: stylePreferences.trim() || undefined,
        importantDates: importantDates.trim() || undefined,
        gstin: gstin.trim().toUpperCase() || undefined,
        notes: notes.trim() || undefined,
        type,
      },
      initialCustomer?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-[#E8DDCF] shadow-2xl overflow-hidden">
        {/* Header (pinned) */}
        <div className="shrink-0 bg-[#FAF5EE] border-b border-[#E8DDCF] px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-lg font-bold text-[#2C181B] truncate">
              {initialCustomer ? `Edit Customer · ${initialCustomer.name}` : 'Add New Customer'}
            </h3>
            <p className="text-[11px] text-[#7A6E6E]">
              Saves phone, delivery address &amp; social details directly in sync with Orders &amp; Invoices
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1 text-stone-400 hover:text-stone-700 rounded-md"
            aria-label="Close customer modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col text-xs">
          <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {initialCustomer && initialCustomer.totalOrders > 0 && (
            <div className="rounded-xl bg-[#FAF6F0] border border-[#E8DDCF] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#541523]">
              <span>
                Linked history: <strong>{initialCustomer.totalOrders}</strong> orders ·{' '}
                <strong>{formatINR(initialCustomer.totalSpent)}</strong> lifetime spend
              </span>
              <span className="text-[#7A6E6E]">
                Contact &amp; address updates sync automatically to Orders &amp; Invoices
              </span>
            </div>
          )}

          {matchingExisting && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-[11px] text-amber-900">
              A customer named <strong>{matchingExisting.name}</strong> already exists (
              {matchingExisting.totalOrders} orders). Saving will update &amp; enrich their existing profile without duplicating.
            </div>
          )}

          {/* Section 1: Identity & Classification */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8F243C]">
              1. Identity &amp; Relationship
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Customer / Client Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhika Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Customer Tier
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Customer['type'])}
                  aria-label="Customer Tier"
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                >
                  {CUSTOMER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Preferred Contact
                </label>
                <select
                  value={preferredContact}
                  onChange={(e) =>
                    setPreferredContact(
                      e.target.value as NonNullable<Customer['preferredContact']>
                    )
                  }
                  aria-label="Preferred Contact"
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                >
                  {PREFERRED_CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Direct Contact & Delivery Address */}
          <div className="pt-3 border-t border-[#F2EBE0] space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8F243C] flex items-center gap-1.5">
              <Phone size={12} />
              <span>2. Direct Contact &amp; Delivery Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="9848481203"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[#423A3A] font-semibold flex items-center gap-1">
                    <MessageCircle size={11} className="text-emerald-700" />
                    <span>WhatsApp Number</span>
                  </label>
                  {phone.trim() && whatsappNumber.trim() !== phone.trim() && (
                    <button
                      type="button"
                      onClick={() => setWhatsappNumber(phone.trim())}
                      className="text-[10px] text-[#8F243C] hover:underline inline-flex items-center gap-0.5 font-medium"
                    >
                      <CopyCheck size={10} />
                      <span>Same as phone</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="WhatsApp number if different"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-[#423A3A] font-semibold mb-1 flex items-center gap-1">
                  <MapPin size={11} className="text-[#8F243C]" />
                  <span>Delivery Address / Society / City</span>
                </label>
                <input
                  type="text"
                  placeholder="Flat / Tower / Community / City (appears on Orders & Invoices)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  placeholder="500081"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] font-mono focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Social Media & Acquisition */}
          <div className="pt-3 border-t border-[#F2EBE0] space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8F243C] flex items-center gap-1.5">
              <Instagram size={12} />
              <span>3. Social Media &amp; Referral Tracking</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[#423A3A] font-semibold">
                    Instagram Handle
                  </label>
                  {igPreviewUrl && (
                    <a
                      href={igPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#8F243C] hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Open IG</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="@radhika.studio or instagram.com/..."
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Other Social Platform
                </label>
                <select
                  value={socialPlatform}
                  onChange={(e) => setSocialPlatform(e.target.value)}
                  aria-label="Other Social Platform"
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                >
                  {OTHER_SOCIAL_PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Secondary Handle / Profile Link
                </label>
                <input
                  type="text"
                  placeholder="@handle or profile URL"
                  value={socialHandle}
                  onChange={(e) => setSocialHandle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Lead / Acquisition Source
                </label>
                <select
                  value={acquisitionSource}
                  onChange={(e) =>
                    setAcquisitionSource(
                      e.target.value as NonNullable<Customer['acquisitionSource']>
                    )
                  }
                  aria-label="Acquisition Source"
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                >
                  {ACQUISITION_SOURCES.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Referred By / Community Group
                </label>
                <input
                  type="text"
                  placeholder="e.g. Appu ref, Prestige Beverly Hills group..."
                  value={referredBy}
                  onChange={(e) => setReferredBy(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Artisanal Gifting Preferences & Notes */}
          <div className="pt-3 border-t border-[#F2EBE0] space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8F243C] flex items-center gap-1.5">
              <Sparkles size={12} />
              <span>4. Gifting Preferences &amp; CRM Notes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Occasion / Hamper Focus
                </label>
                <input
                  type="text"
                  placeholder="Diwali hampers, Wedding return gifts, Pooja decor..."
                  value={occasionFocus}
                  onChange={(e) => setOccasionFocus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Colour / Fragrance / Style Preferences
                </label>
                <input
                  type="text"
                  placeholder="Pastel rose, jasmine wax, pearl brass accents..."
                  value={stylePreferences}
                  onChange={(e) => setStylePreferences(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Key Dates / Follow-up Reminder
                </label>
                <input
                  type="text"
                  placeholder="e.g. Housewarming Nov 25, Corporate order Oct..."
                  value={importantDates}
                  onChange={(e) => setImportantDates(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Company / GSTIN (for Corporate Invoices)
                </label>
                <input
                  type="text"
                  placeholder="Optional 15-character GSTIN"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Private Studio Notes
              </label>
              <textarea
                rows={2}
                placeholder="Packaging notes, delivery timing preferences, budget range..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
          </div>
          </div>

          <div className="shrink-0 bg-[#FCFAF7] flex justify-end space-x-3 px-5 sm:px-6 py-3.5 border-t border-[#E8DDCF]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D9C9B4] rounded-lg text-[#635B5B] bg-white hover:bg-[#FAF6F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#541523] text-white rounded-lg font-semibold hover:bg-[#6E1C30] shadow-sm"
            >
              {initialCustomer ? 'Save Customer Changes' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
