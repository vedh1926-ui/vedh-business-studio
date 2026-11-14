'use client';

import React, { useState } from 'react';
import { Supplier } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import {
  getInstagramProfileUrl,
  normalizeInstagramHandle,
  normalizeWebsiteUrl,
} from '@/lib/oprFormulas';
import {
  X,
  Truck,
  Phone,
  MessageCircle,
  MapPin,
  Instagram,
  Globe,
  ExternalLink,
  CopyCheck,
  CreditCard,
  Star,
} from 'lucide-react';

export interface SupplierFormPayload {
  name: string;
  category: string;
  vendorType?: Supplier['vendorType'];
  contactPerson?: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  city?: string;
  pincode?: string;
  websiteUrl?: string;
  instagramHandle?: string;
  paymentTerms?: Supplier['paymentTerms'];
  upiId?: string;
  gstin?: string;
  leadTimeDays?: number;
  reliabilityRating?: number;
  materialsSupplied?: string;
  platformAlias?: string;
  notes?: string;
}

interface SupplierModalProps {
  initialSupplier?: Supplier | null;
  categories?: string[];
  existingSuppliers?: Supplier[];
  onClose: () => void;
  onSave: (data: SupplierFormPayload, existingId?: string) => void;
}

const VENDOR_TYPES: NonNullable<Supplier['vendorType']>[] = [
  'Wholesale Market',
  'Online Portal',
  'Direct Manufacturer',
  'Boutique Retail',
  'Artisan Craft',
];

const PAYMENT_TERMS: NonNullable<Supplier['paymentTerms']>[] = [
  'Immediate / UPI',
  'Cash Counter',
  'Prepaid Online',
  'COD',
  'Net 7 / Credit',
  'Other',
];

export default function SupplierModal({
  initialSupplier = null,
  categories = ['Wax / Candles', 'Resin Supplies', 'Packaging', 'Fabric', 'Other'],
  existingSuppliers = [],
  onClose,
  onSave,
}: SupplierModalProps) {
  const categoryOptions =
    initialSupplier?.category && !categories.includes(initialSupplier.category)
      ? [initialSupplier.category, ...categories]
      : categories;

  const [name, setName] = useState(initialSupplier?.name || '');
  const [category, setCategory] = useState(
    initialSupplier?.category || categoryOptions[0] || 'Wax / Candles'
  );
  const [vendorType, setVendorType] = useState<NonNullable<Supplier['vendorType']>>(
    initialSupplier?.vendorType || 'Wholesale Market'
  );
  const [contactPerson, setContactPerson] = useState(initialSupplier?.contactPerson || '');
  const [phone, setPhone] = useState(initialSupplier?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialSupplier?.whatsappNumber || ''
  );
  const [email, setEmail] = useState(initialSupplier?.email || '');
  const [city, setCity] = useState(initialSupplier?.city || '');
  const [pincode, setPincode] = useState(initialSupplier?.pincode || '');
  const [websiteUrl, setWebsiteUrl] = useState(initialSupplier?.websiteUrl || '');
  const [instagramHandle, setInstagramHandle] = useState(
    initialSupplier?.instagramHandle || ''
  );
  const [paymentTerms, setPaymentTerms] = useState<
    NonNullable<Supplier['paymentTerms']>
  >(initialSupplier?.paymentTerms || 'Immediate / UPI');
  const [upiId, setUpiId] = useState(initialSupplier?.upiId || '');
  const [gstin, setGstin] = useState(initialSupplier?.gstin || '');
  const [leadTimeDays, setLeadTimeDays] = useState(
    initialSupplier?.leadTimeDays !== undefined ? String(initialSupplier.leadTimeDays) : ''
  );
  const [reliabilityRating, setReliabilityRating] = useState<number>(
    initialSupplier?.reliabilityRating || 5
  );
  const [materialsSupplied, setMaterialsSupplied] = useState(
    initialSupplier?.materialsSupplied || ''
  );
  const [platformAlias, setPlatformAlias] = useState(
    initialSupplier?.platformAlias || ''
  );
  const [notes, setNotes] = useState(initialSupplier?.notes || '');

  const normalizedDraftName = name.trim().toLowerCase().replace(/\s+/g, ' ');
  const duplicateMatch =
    !initialSupplier && normalizedDraftName
      ? existingSuppliers.find(
          (s) => (s.name || '').trim().toLowerCase().replace(/\s+/g, ' ') === normalizedDraftName
        )
      : undefined;

  const igPreview = getInstagramProfileUrl(instagramHandle);
  const webPreview = normalizeWebsiteUrl(websiteUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedLead = parseInt(leadTimeDays, 10);

    onSave(
      {
        name: name.trim(),
        category: category.trim() || categoryOptions[0] || 'Other',
        vendorType,
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || '—',
        whatsappNumber: whatsappNumber.trim() || undefined,
        email: email.trim() || undefined,
        city: city.trim() || undefined,
        pincode: pincode.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        instagramHandle: normalizeInstagramHandle(instagramHandle) || undefined,
        paymentTerms,
        upiId: upiId.trim() || undefined,
        gstin: gstin.trim().toUpperCase() || undefined,
        leadTimeDays: Number.isFinite(parsedLead) && parsedLead >= 0 ? parsedLead : undefined,
        reliabilityRating,
        materialsSupplied: materialsSupplied.trim() || undefined,
        platformAlias: platformAlias.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      initialSupplier?.id
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
              {initialSupplier
                ? `Edit Supplier · ${initialSupplier.name}`
                : 'Add Material Supplier'}
            </h3>
            <p className="text-[11px] text-[#7A6E6E]">
              Manage vendor contact, UPI/GSTIN, delivery lead time &amp; automatic Expenses ledger linking
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1 text-stone-400 hover:text-stone-700 rounded-md"
            aria-label="Close supplier modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col text-xs">
          <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {initialSupplier && (initialSupplier.totalOrders > 0 || initialSupplier.totalPaid > 0) && (
            <div className="rounded-xl bg-[#FAF6F0] border border-[#E8DDCF] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#541523]">
              <span>
                Recorded vendor totals: <strong>{initialSupplier.totalOrders}</strong> orders ·{' '}
                <strong>{formatINR(initialSupplier.totalPaid)}</strong>
              </span>
              <span className="text-[#7A6E6E]">
                Live totals recalculate automatically from matched Expenses
              </span>
            </div>
          )}

          {duplicateMatch && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-[11px] text-amber-900">
              Supplier <strong>{duplicateMatch.name}</strong> already exists. Saving will update that vendor record cleanly.
            </div>
          )}

          {/* Section 1: Vendor Identity & Materials */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8F243C] flex items-center gap-1.5">
              <Truck size={12} />
              <span>1. Vendor Identity &amp; Supply Focus</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Supplier / Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Just Kraft / Luxury Deco"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Primary Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="Supplier category"
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Vendor Type
                </label>
                <select
                  value={vendorType}
                  onChange={(e) =>
                    setVendorType(e.target.value as NonNullable<Supplier['vendorType']>)
                  }
                  aria-label="Vendor Type"
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                >
                  {VENDOR_TYPES.map((vt) => (
                    <option key={vt} value={vt}>
                      {vt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Key Raw Materials Supplied
                </label>
                <input
                  type="text"
                  placeholder="e.g. Soy wax flakes, 100% cotton wicks, silicone lotus moulds..."
                  value={materialsSupplied}
                  onChange={(e) => setMaterialsSupplied(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Quality / Reliability Rating
                </label>
                <div className="flex items-center gap-1 px-3 py-1.5 border border-[#D9C9B4] rounded-lg bg-[#FCFAF7]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReliabilityRating(star)}
                      className="p-0.5 transition"
                      title={`Rate ${star} of 5`}
                    >
                      <Star
                        size={15}
                        className={
                          star <= reliabilityRating
                            ? 'fill-[#C69C31] text-[#C69C31]'
                            : 'text-stone-300'
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-1.5 text-[11px] font-semibold text-[#541523]">
                    {reliabilityRating}/5
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Contact, Address & Online Links */}
          <div className="pt-3 border-t border-[#F2EBE0] space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8F243C] flex items-center gap-1.5">
              <Phone size={12} />
              <span>2. Contact, Bazaar Address &amp; Portal Links</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Contact Person / Counter Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Bhai, Counter 2"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Phone / Counter Ref
                </label>
                <input
                  type="text"
                  placeholder="+91 98... or Online Portal"
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
                  {phone.trim() && whatsappNumber.trim() !== phone.trim() && /\d{10}/.test(phone) && (
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
                  placeholder="WhatsApp order desk number"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-[#423A3A] font-semibold mb-1 flex items-center gap-1">
                  <MapPin size={11} className="text-[#8F243C]" />
                  <span>Shop / Bazaar Address / City</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Begum Bazaar, Near Just Kraft, Kachiguda, Hyderabad"
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
                  placeholder="500012"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] font-mono focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="vendor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[#423A3A] font-semibold flex items-center gap-1">
                    <Globe size={11} className="text-[#8F243C]" />
                    <span>Website / Store Portal</span>
                  </label>
                  {webPreview && (
                    <a
                      href={webPreview}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#8F243C] hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Open</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="https://luxurydeco.in"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[#423A3A] font-semibold flex items-center gap-1">
                    <Instagram size={11} className="text-[#8F243C]" />
                    <span>Instagram Handle</span>
                  </label>
                  {igPreview && (
                    <a
                      href={igPreview}
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
                  placeholder="@vendor.handle"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment, Lead Time & Ledger Linking */}
          <div className="pt-3 border-t border-[#F2EBE0] space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8F243C] flex items-center gap-1.5">
              <CreditCard size={12} />
              <span>3. Payment Terms, Tax &amp; Expenses Ledger Link</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) =>
                    setPaymentTerms(
                      e.target.value as NonNullable<Supplier['paymentTerms']>
                    )
                  }
                  aria-label="Payment Terms"
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                >
                  {PAYMENT_TERMS.map((pt) => (
                    <option key={pt} value={pt}>
                      {pt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Saved UPI ID / Bank Ref
                </label>
                <input
                  type="text"
                  placeholder="vendor@okicici"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] font-mono focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Vendor GSTIN
                </label>
                <input
                  type="text"
                  placeholder="36AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Lead Time (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 3"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Expenses / Platform Match Keywords (Optional)
              </label>
              <input
                type="text"
                placeholder="Comma-separated aliases e.g. Bhagwan Das, Begum Bazaar Packing Shop"
                value={platformAlias}
                onChange={(e) => setPlatformAlias(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Vendor Notes &amp; Buying Tips
              </label>
              <textarea
                rows={2}
                placeholder="MOQ rules, wholesale discount tiers, closed days (e.g. Sunday closed), packing quality..."
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
              {initialSupplier ? 'Save Supplier Changes' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
