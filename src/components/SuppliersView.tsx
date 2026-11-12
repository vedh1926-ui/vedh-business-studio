'use client';

import React, { useMemo, useState } from 'react';
import { Expense, Supplier } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import {
  computeSupplierMetrics,
  getInstagramProfileUrl,
  getWhatsAppChatUrl,
  normalizeWebsiteUrl,
} from '@/lib/oprFormulas';
import {
  Plus,
  Truck,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Eye,
  Edit3,
  Trash2,
  Search,
  MessageCircle,
  Instagram,
  Globe,
  ExternalLink,
  ShoppingBag,
  Star,
  Clock,
  CreditCard,
} from 'lucide-react';

interface SuppliersViewProps {
  suppliers: Supplier[];
  expenses?: Expense[];
  categories?: string[];
  onOpenNewSupplier: () => void;
  onViewSupplier: (supplier: Supplier) => void;
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onRecordPurchaseForSupplier?: (supplier: Supplier) => void;
}

type VendorTypeFilter =
  | 'All'
  | 'Wholesale Market'
  | 'Online Portal'
  | 'Direct Manufacturer'
  | 'Boutique Retail'
  | 'Artisan Craft';

type SortMode = 'spend-desc' | 'orders-desc' | 'rating-desc' | 'name-asc';

function cleanPhone(raw?: string): string {
  const v = (raw || '').trim();
  return v && v !== '—' && v !== '-' ? v : '';
}

export default function SuppliersView({
  suppliers,
  expenses = [],
  categories = [],
  onOpenNewSupplier,
  onViewSupplier,
  onEditSupplier,
  onDeleteSupplier,
  onRecordPurchaseForSupplier,
}: SuppliersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [vendorTypeFilter, setVendorTypeFilter] = useState<VendorTypeFilter>('All');
  const [sortBy, setSortBy] = useState<SortMode>('spend-desc');

  const computedList = useMemo(() => {
    return suppliers.map((sup) => ({
      supplier: sup,
      metrics: computeSupplierMetrics(sup, expenses),
    }));
  }, [suppliers, expenses]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>(categories);
    suppliers.forEach((s) => {
      if (s.category?.trim()) set.add(s.category.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [suppliers, categories]);

  const summary = useMemo(() => {
    const total = computedList.length;
    const wholesaleCount = computedList.filter(
      ({ supplier }) => supplier.vendorType === 'Wholesale Market'
    ).length;
    const onlineCount = computedList.filter(
      ({ supplier }) =>
        supplier.vendorType === 'Online Portal' ||
        supplier.phone.toLowerCase().includes('online')
    ).length;
    const totalSpend = computedList.reduce((s, x) => s + x.metrics.displayPaid, 0);
    const totalOrders = computedList.reduce((s, x) => s + x.metrics.displayOrders, 0);
    const inTransit = computedList.reduce((s, x) => s + x.metrics.inTransitCount, 0);
    const withDirectContact = computedList.filter(({ supplier }) => {
      const ph = cleanPhone(supplier.phone) || cleanPhone(supplier.whatsappNumber);
      return Boolean(/\d{8}/.test(ph) || supplier.email || supplier.instagramHandle);
    }).length;
    const withGstin = computedList.filter(({ supplier }) => Boolean(supplier.gstin?.trim())).length;

    return {
      total,
      wholesaleCount,
      onlineCount,
      totalSpend,
      totalOrders,
      inTransit,
      withDirectContact,
      withGstin,
    };
  }, [computedList]);

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = computedList.filter(({ supplier }) => {
      if (categoryFilter !== 'All' && supplier.category !== categoryFilter) return false;
      if (vendorTypeFilter !== 'All' && supplier.vendorType !== vendorTypeFilter) return false;
      if (!q) return true;

      const haystack = [
        supplier.name,
        supplier.category,
        supplier.vendorType,
        supplier.contactPerson,
        supplier.phone,
        supplier.whatsappNumber,
        supplier.email,
        supplier.city,
        supplier.pincode,
        supplier.instagramHandle,
        supplier.websiteUrl,
        supplier.upiId,
        supplier.gstin,
        supplier.materialsSupplied,
        supplier.platformAlias,
        supplier.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'orders-desc') {
        if (b.metrics.displayOrders !== a.metrics.displayOrders) {
          return b.metrics.displayOrders - a.metrics.displayOrders;
        }
        return b.metrics.displayPaid - a.metrics.displayPaid;
      }
      if (sortBy === 'rating-desc') {
        const ra = a.supplier.reliabilityRating || 0;
        const rb = b.supplier.reliabilityRating || 0;
        if (rb !== ra) return rb - ra;
        return b.metrics.displayPaid - a.metrics.displayPaid;
      }
      if (sortBy === 'name-asc') {
        return a.supplier.name.localeCompare(b.supplier.name);
      }
      if (b.metrics.displayPaid !== a.metrics.displayPaid) {
        return b.metrics.displayPaid - a.metrics.displayPaid;
      }
      return a.supplier.name.localeCompare(b.supplier.name);
    });
  }, [computedList, searchQuery, categoryFilter, vendorTypeFilter, sortBy]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#C69C31] mb-1">
            <Sparkles size={14} />
            <span>Procurement &amp; Raw Material Vendors</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Suppliers Directory
          </h2>
          <p className="text-xs text-[#7A6E6E]">
            {suppliers.length} vendors synced with Expenses — view order history, edit contact/UPI/GSTIN, or record new purchases
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewSupplier}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide transition shadow-sm"
        >
          <Plus size={16} />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8DDCF] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#7A6E6E]">
            <span>Total Vendors</span>
            <Truck size={15} className="text-[#8F243C]" />
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-[#2C181B]">
            {summary.total}
          </div>
          <div className="mt-1 text-[11px] text-[#7A6E6E]">
            {summary.wholesaleCount} Wholesale · {summary.onlineCount} Online Portals
          </div>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#7A6E6E]">
            <span>Procurement Spend</span>
            <CreditCard size={15} className="text-[#C69C31]" />
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-[#8F243C]">
            {formatINR(summary.totalSpend)}
          </div>
          <div className="mt-1 text-[11px] text-[#7A6E6E]">
            Linked across active vendor ledger
          </div>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#7A6E6E]">
            <span>Purchase Orders</span>
            <ShoppingBag size={15} className="text-emerald-700" />
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-[#2C181B]">
            {summary.totalOrders}
          </div>
          <div className="mt-1 text-[11px] text-[#7A6E6E]">
            {summary.inTransit > 0
              ? `${summary.inTransit} currently in transit`
              : 'All matched shipments settled'}
          </div>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#7A6E6E]">
            <span>Direct Contacts</span>
            <Phone size={15} className="text-[#8F243C]" />
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-[#2C181B]">
            {summary.withDirectContact}{' '}
            <span className="text-xs font-sans font-normal text-[#7A6E6E]">
              of {summary.total}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#7A6E6E]">
            {summary.withGstin} with GSTIN saved
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7D7D]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search supplier name, material, bazaar location, phone, @instagram, GSTIN..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#D9C9B4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#541523]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              className="px-3 py-2 border border-[#D9C9B4] rounded-xl bg-white text-[#423A3A] focus:outline-none focus:ring-1 focus:ring-[#541523]"
            >
              <option value="All">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortMode)}
              aria-label="Sort suppliers"
              className="px-3 py-2 border border-[#D9C9B4] rounded-xl bg-white text-[#423A3A] focus:outline-none focus:ring-1 focus:ring-[#541523]"
            >
              <option value="spend-desc">Highest Spend</option>
              <option value="orders-desc">Most Orders</option>
              <option value="rating-desc">Highest Rating</option>
              <option value="name-asc">Name (A–Z)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                'All',
                'Wholesale Market',
                'Online Portal',
                'Direct Manufacturer',
                'Boutique Retail',
                'Artisan Craft',
              ] as VendorTypeFilter[]
            ).map((vt) => (
              <button
                key={vt}
                type="button"
                onClick={() => setVendorTypeFilter(vt)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  vendorTypeFilter === vt
                    ? 'bg-[#541523] text-white'
                    : 'bg-[#FAF6F0] text-[#541523] border border-[#E8DDCF] hover:bg-[#F2EBE0]'
                }`}
              >
                {vt}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-[#7A6E6E]">
            Showing {filteredSuppliers.length} of {suppliers.length} suppliers
          </span>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
        {filteredSuppliers.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-serif font-semibold text-[#2C181B]">
              No matching suppliers found
            </p>
            <p className="text-xs text-[#7A6E6E]">
              Try adjusting your search or category filter, or click &ldquo;Add Supplier&rdquo; to add a vendor.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F2EBE0]">
            {filteredSuppliers.map(({ supplier: sup, metrics }) => {
              const primaryPhone = cleanPhone(sup.phone);
              const whatsappUrl = getWhatsAppChatUrl(sup.whatsappNumber || primaryPhone);
              const igUrl = getInstagramProfileUrl(sup.instagramHandle);
              const webUrl = normalizeWebsiteUrl(sup.websiteUrl);

              return (
                <div
                  key={sup.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#FAF6F0]/60 transition"
                >
                  {/* Supplier Info */}
                  <div className="flex items-start space-x-4 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onViewSupplier(sup)}
                      className="w-11 h-11 rounded-xl bg-[#FAF0E6] border border-[#E8DDCF] flex items-center justify-center text-[#541523] hover:bg-[#F2EBE0] transition shrink-0"
                      title={`View ${sup.name}`}
                    >
                      <Truck size={20} />
                    </button>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onViewSupplier(sup)}
                          className="text-sm font-semibold text-[#2C181B] hover:text-[#8F243C] hover:underline text-left"
                        >
                          {sup.name}
                        </button>

                        <span className="bg-[#F2EBE0] text-[#541523] border border-[#E8DDCF] px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          {sup.category}
                        </span>

                        {sup.vendorType && (
                          <span className="bg-[#FAF6F0] text-[#635B5B] border border-[#E8DDCF] px-2 py-0.5 rounded-full text-[10px]">
                            {sup.vendorType}
                          </span>
                        )}

                        {sup.reliabilityRating && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-[#541523] font-semibold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            <Star size={10} className="fill-[#C69C31] text-[#C69C31]" />
                            <span>{sup.reliabilityRating}</span>
                          </span>
                        )}

                        {metrics.inTransitCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
                            {metrics.inTransitCount} in transit
                          </span>
                        )}
                      </div>

                      {/* Contact & Portal Strip */}
                      <div className="text-xs text-[#635B5B] flex flex-wrap items-center gap-x-4 gap-y-1">
                        {sup.contactPerson && (
                          <span className="text-[11px] font-medium text-[#2C181B]">
                            {sup.contactPerson}
                          </span>
                        )}

                        {sup.city && (
                          <span className="inline-flex items-center space-x-1 text-[11px]">
                            <MapPin size={11} className="text-[#8F243C] shrink-0" />
                            <span>
                              {sup.city}
                              {sup.pincode ? ` - ${sup.pincode}` : ''}
                            </span>
                          </span>
                        )}

                        {primaryPhone ? (
                          <span className="inline-flex items-center space-x-1 font-mono text-[11px]">
                            <Phone size={11} className="text-[#8F243C]" />
                            <span>{primaryPhone}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEditSupplier(sup)}
                            className="inline-flex items-center space-x-1 text-[11px] text-amber-800 hover:underline"
                          >
                            <Phone size={11} />
                            <span>+ Add phone</span>
                          </button>
                        )}

                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition"
                          >
                            <MessageCircle size={10} />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {sup.instagramHandle && igUrl && (
                          <a
                            href={igUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-[#8F243C] border border-rose-200 hover:bg-rose-100 transition"
                          >
                            <Instagram size={10} />
                            <span>{sup.instagramHandle}</span>
                            <ExternalLink size={9} />
                          </a>
                        )}

                        {webUrl && (
                          <a
                            href={webUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 transition"
                          >
                            <Globe size={10} />
                            <span>Portal</span>
                            <ExternalLink size={9} />
                          </a>
                        )}

                        {sup.email && (
                          <span className="inline-flex items-center space-x-1 text-[11px]">
                            <Mail size={11} className="text-[#8F243C]" />
                            <span>{sup.email}</span>
                          </span>
                        )}
                      </div>

                      {/* Materials, Terms, Lead Time & Notes */}
                      {(sup.materialsSupplied ||
                        sup.paymentTerms ||
                        sup.upiId ||
                        sup.gstin ||
                        sup.notes ||
                        metrics.avgDaysToDeliver !== null ||
                        sup.leadTimeDays !== undefined) && (
                        <div className="text-[11px] text-[#7A6E6E] flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                          {sup.materialsSupplied && (
                            <span>
                              <strong className="text-[#423A3A]">Materials:</strong>{' '}
                              {sup.materialsSupplied}
                            </span>
                          )}
                          {sup.paymentTerms && (
                            <span>
                              <strong className="text-[#423A3A]">Terms:</strong>{' '}
                              {sup.paymentTerms}
                            </span>
                          )}
                          {sup.upiId && (
                            <span className="font-mono">
                              <strong className="text-[#423A3A] font-sans">UPI:</strong>{' '}
                              {sup.upiId}
                            </span>
                          )}
                          {sup.gstin && (
                            <span className="font-mono">
                              <strong className="text-[#423A3A] font-sans">GSTIN:</strong>{' '}
                              {sup.gstin}
                            </span>
                          )}
                          {(metrics.avgDaysToDeliver !== null ||
                            sup.leadTimeDays !== undefined) && (
                            <span className="inline-flex items-center gap-1">
                              <Clock size={10} />
                              <span>
                                {metrics.avgDaysToDeliver !== null
                                  ? `${metrics.avgDaysToDeliver}d avg delivery`
                                  : `~${sup.leadTimeDays}d lead time`}
                              </span>
                            </span>
                          )}
                          {sup.notes && (
                            <span className="italic text-[#635B5B]">
                              &ldquo;{sup.notes}&rdquo;
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats & Actions */}
                  <div className="flex flex-wrap items-center gap-4 lg:gap-5 justify-between lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#F2EBE0]">
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-[#635B5B]">
                        <span className="font-semibold text-[#2C181B]">
                          {metrics.displayOrders}
                        </span>{' '}
                        {metrics.displayOrders === 1 ? 'order' : 'orders'}
                        {metrics.lastPurchaseDate && (
                          <div className="text-[10px] text-[#8C7D7D]">
                            Last: {metrics.lastPurchaseDate}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider text-[#8C7D7D]">
                          Total paid
                        </div>
                        <div className="font-serif font-bold text-[#8F243C] text-sm">
                          {formatINR(metrics.displayPaid)}
                        </div>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewSupplier(sup)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D9C9B4] bg-[#FAF6F0] text-[#541523] hover:bg-[#F2EBE0] text-[11px] font-semibold transition"
                        title={`View ${sup.name} details & purchases`}
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditSupplier(sup)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D9C9B4] bg-white text-[#541523] hover:bg-[#F2EBE0] text-[11px] font-semibold transition"
                        title={`Edit ${sup.name}`}
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>

                      {onRecordPurchaseForSupplier && (
                        <button
                          type="button"
                          onClick={() => onRecordPurchaseForSupplier(sup)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D9C9B4] bg-white text-[#541523] hover:bg-[#F2EBE0] text-[11px] font-semibold transition"
                          title={`Record purchase from ${sup.name}`}
                        >
                          <ShoppingBag size={12} />
                          <span>+ Purchase</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete supplier "${sup.name}"? Linked Expenses/Purchases will stay in your ledger.`
                            )
                          ) {
                            onDeleteSupplier(sup.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition"
                        title={`Delete ${sup.name}`}
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
