'use client';

import React, { useMemo, useState } from 'react';
import { Customer } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { getInstagramProfileUrl, getWhatsAppChatUrl } from '@/lib/oprFormulas';
import {
  Plus,
  Users,
  Phone,
  Mail,
  MapPin,
  Instagram,
  MessageCircle,
  Edit3,
  Trash2,
  Search,
  Sparkles,
  ShoppingBag,
  Share2,
  Calendar,
  ExternalLink,
  UserCheck,
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  onOpenNewCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onCreateOrderForCustomer?: (customer: Customer) => void;
}

type TierFilter = 'All' | 'VIP' | 'Corporate' | 'Individual';
type ReadinessFilter = 'All' | 'Has Instagram' | 'Has Address' | 'Needs Details';
type SortMode = 'spend-desc' | 'orders-desc' | 'recent-desc' | 'name-asc';

function cleanPhone(raw?: string): string {
  const v = (raw || '').trim();
  return v && v !== '—' && v !== '-' ? v : '';
}

export default function CustomersView({
  customers,
  onOpenNewCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onCreateOrderForCustomer,
}: CustomersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('All');
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>('All');
  const [sortBy, setSortBy] = useState<SortMode>('spend-desc');

  const summary = useMemo(() => {
    const total = customers.length;
    const vipCount = customers.filter((c) => c.type === 'VIP').length;
    const corporateCount = customers.filter((c) => c.type === 'Corporate').length;
    const repeatCount = customers.filter((c) => c.totalOrders >= 2).length;
    const totalRevenue = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);
    const buyersCount = customers.filter((c) => c.totalOrders > 0).length;
    const withPhone = customers.filter(
      (c) => Boolean(cleanPhone(c.phone) || cleanPhone(c.whatsappNumber))
    ).length;
    const withInstagram = customers.filter((c) => Boolean(c.instagramHandle?.trim())).length;

    return {
      total,
      vipCount,
      corporateCount,
      repeatCount,
      totalRevenue,
      avgCustomerValue: buyersCount > 0 ? totalRevenue / buyersCount : 0,
      withPhone,
      withInstagram,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = customers.filter((c) => {
      if (tierFilter !== 'All' && c.type !== tierFilter) return false;

      if (readinessFilter === 'Has Instagram' && !c.instagramHandle?.trim()) return false;
      if (readinessFilter === 'Has Address' && !c.city?.trim()) return false;
      if (
        readinessFilter === 'Needs Details' &&
        cleanPhone(c.phone) &&
        c.city?.trim()
      ) {
        return false;
      }

      if (!q) return true;
      const haystack = [
        c.name,
        c.phone,
        c.whatsappNumber,
        c.email,
        c.city,
        c.pincode,
        c.instagramHandle,
        c.socialHandle,
        c.socialPlatform,
        c.acquisitionSource,
        c.referredBy,
        c.occasionFocus,
        c.stylePreferences,
        c.notes,
        c.type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'orders-desc') {
        if (b.totalOrders !== a.totalOrders) return b.totalOrders - a.totalOrders;
        return b.totalSpent - a.totalSpent;
      }
      if (sortBy === 'recent-desc') {
        const da = a.lastOrderDate || '';
        const db = b.lastOrderDate || '';
        if (db !== da) return db.localeCompare(da);
        return b.totalSpent - a.totalSpent;
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (b.totalSpent !== a.totalSpent) return b.totalSpent - a.totalSpent;
      return a.name.localeCompare(b.name);
    });
  }, [customers, searchQuery, tierFilter, readinessFilter, sortBy]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Customers &amp; Client CRM
          </h2>
          <p className="text-xs text-[#7A6E6E] mt-0.5">
            {customers.length} synced profiles — phone, WhatsApp, Instagram handles, delivery addresses &amp; gifting preferences shared live with Orders &amp; Invoices
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewCustomer}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide transition shadow-sm"
        >
          <Plus size={16} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8DDCF] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#7A6E6E]">
            <span>Total Clients</span>
            <Users size={15} className="text-[#8F243C]" />
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-[#2C181B]">
            {summary.total}
          </div>
          <div className="mt-1 text-[11px] text-[#7A6E6E]">
            {summary.vipCount} VIP · {summary.corporateCount} Corporate
          </div>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#7A6E6E]">
            <span>Lifetime Revenue</span>
            <Sparkles size={15} className="text-[#C69C31]" />
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-[#2C181B]">
            {formatINR(summary.totalRevenue)}
          </div>
          <div className="mt-1 text-[11px] text-[#7A6E6E]">
            Avg {formatINR(Math.round(summary.avgCustomerValue))} per ordering client
          </div>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#7A6E6E]">
            <span>Repeat Buyers</span>
            <UserCheck size={15} className="text-emerald-700" />
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-[#2C181B]">
            {summary.repeatCount}
          </div>
          <div className="mt-1 text-[11px] text-[#7A6E6E]">
            {summary.total > 0 ? Math.round((summary.repeatCount / summary.total) * 100) : 0}% with 2+ orders
          </div>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#7A6E6E]">
            <span>Social &amp; Contact</span>
            <Instagram size={15} className="text-[#8F243C]" />
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-[#2C181B]">
            {summary.withInstagram}{' '}
            <span className="text-xs font-sans font-normal text-[#7A6E6E]">IG handles</span>
          </div>
          <div className="mt-1 text-[11px] text-[#7A6E6E]">
            {summary.withPhone} of {summary.total} have Phone / WhatsApp
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
              placeholder="Search name, phone, @instagram, society/address, occasion, referral..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#D9C9B4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#541523]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={readinessFilter}
              onChange={(e) => setReadinessFilter(e.target.value as ReadinessFilter)}
              aria-label="Filter by profile completeness"
              className="px-3 py-2 border border-[#D9C9B4] rounded-xl bg-white text-[#423A3A] focus:outline-none focus:ring-1 focus:ring-[#541523]"
            >
              <option value="All">All Profiles</option>
              <option value="Has Instagram">Has Instagram Handle</option>
              <option value="Has Address">Has Delivery Address</option>
              <option value="Needs Details">Missing Phone / Address</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortMode)}
              aria-label="Sort customers"
              className="px-3 py-2 border border-[#D9C9B4] rounded-xl bg-white text-[#423A3A] focus:outline-none focus:ring-1 focus:ring-[#541523]"
            >
              <option value="spend-desc">Highest Spend</option>
              <option value="orders-desc">Most Orders</option>
              <option value="recent-desc">Most Recent Order</option>
              <option value="name-asc">Name (A–Z)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'VIP', 'Corporate', 'Individual'] as TierFilter[]).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setTierFilter(tier)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  tierFilter === tier
                    ? 'bg-[#541523] text-white'
                    : 'bg-[#FAF6F0] text-[#541523] border border-[#E8DDCF] hover:bg-[#F2EBE0]'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-[#7A6E6E]">
            Showing {filteredCustomers.length} of {customers.length} customers
          </span>
        </div>
      </div>

      {/* Customers Directory List */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-serif font-semibold text-[#2C181B]">
              No matching customers found
            </p>
            <p className="text-xs text-[#7A6E6E]">
              Try adjusting your search/filters or click &ldquo;Add Customer&rdquo; to create a new profile.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F2EBE0]">
            {filteredCustomers.map((cust) => {
              const primaryPhone = cleanPhone(cust.phone);
              const whatsappRaw = cleanPhone(cust.whatsappNumber) || primaryPhone;
              const whatsappUrl = getWhatsAppChatUrl(whatsappRaw);
              const igUrl = getInstagramProfileUrl(cust.instagramHandle);

              return (
                <div
                  key={cust.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#FAF6F0]/60 transition"
                >
                  {/* Left: Identity, Contact, Social & Preferences */}
                  <div className="flex items-start space-x-4 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-[#FAF0E6] border border-[#E8DDCF] flex items-center justify-center text-[#541523] font-serif font-bold text-sm shrink-0">
                      {cust.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#2C181B]">
                          {cust.name}
                        </span>

                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                            cust.type === 'VIP'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                              : cust.type === 'Corporate'
                              ? 'bg-sky-50 text-sky-900 border border-sky-200 font-semibold'
                              : 'bg-[#F2EBE0] text-[#541523] border border-[#E8DDCF]'
                          }`}
                        >
                          {cust.type || 'Individual'}
                        </span>

                        {cust.acquisitionSource && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF6F0] border border-[#E8DDCF] text-[#635B5B]">
                            via {cust.acquisitionSource}
                          </span>
                        )}

                        {cust.preferredContact && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                            Prefers {cust.preferredContact}
                          </span>
                        )}
                      </div>

                      {/* Contact & Social Row */}
                      <div className="text-xs text-[#635B5B] flex flex-wrap items-center gap-x-4 gap-y-1">
                        {primaryPhone ? (
                          <span className="inline-flex items-center space-x-1 font-mono text-[11px]">
                            <Phone size={11} className="text-[#8F243C]" />
                            <span>{primaryPhone}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEditCustomer(cust)}
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
                            title={`Message ${cust.name} on WhatsApp`}
                          >
                            <MessageCircle size={11} />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {cust.instagramHandle && igUrl ? (
                          <a
                            href={igUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-[#8F243C] border border-rose-200 hover:bg-rose-100 transition"
                            title="Open Instagram profile"
                          >
                            <Instagram size={11} />
                            <span>{cust.instagramHandle}</span>
                            <ExternalLink size={9} />
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEditCustomer(cust)}
                            className="inline-flex items-center space-x-1 text-[11px] text-[#8C7D7D] hover:text-[#8F243C] hover:underline"
                          >
                            <Instagram size={11} />
                            <span>+ Add IG handle</span>
                          </button>
                        )}

                        {cust.socialHandle && (
                          <span className="inline-flex items-center space-x-1 text-[11px] text-[#541523]">
                            <Share2 size={11} />
                            <span>
                              {cust.socialPlatform ? `${cust.socialPlatform}: ` : ''}
                              {cust.socialHandle}
                            </span>
                          </span>
                        )}

                        {cust.email && (
                          <span className="inline-flex items-center space-x-1 text-[11px]">
                            <Mail size={11} className="text-[#8F243C]" />
                            <span>{cust.email}</span>
                          </span>
                        )}

                        {cust.city && (
                          <span className="inline-flex items-center space-x-1 text-[11px]">
                            <MapPin size={11} className="text-[#8F243C] shrink-0" />
                            <span>
                              {cust.city}
                              {cust.pincode ? ` - ${cust.pincode}` : ''}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Gifting Preferences, Referrals & Notes */}
                      {(cust.referredBy ||
                        cust.occasionFocus ||
                        cust.stylePreferences ||
                        cust.importantDates ||
                        cust.gstin ||
                        cust.notes) && (
                        <div className="text-[11px] text-[#7A6E6E] flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                          {cust.referredBy && (
                            <span>
                              <strong className="text-[#423A3A]">Ref:</strong> {cust.referredBy}
                            </span>
                          )}
                          {cust.occasionFocus && (
                            <span>
                              <strong className="text-[#423A3A]">Occasion:</strong>{' '}
                              {cust.occasionFocus}
                            </span>
                          )}
                          {cust.stylePreferences && (
                            <span>
                              <strong className="text-[#423A3A]">Style:</strong>{' '}
                              {cust.stylePreferences}
                            </span>
                          )}
                          {cust.importantDates && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={10} />
                              <span>{cust.importantDates}</span>
                            </span>
                          )}
                          {cust.gstin && (
                            <span className="font-mono">
                              <strong className="text-[#423A3A] font-sans">GSTIN:</strong>{' '}
                              {cust.gstin}
                            </span>
                          )}
                          {cust.notes && (
                            <span className="italic text-[#635B5B]">
                              &ldquo;{cust.notes}&rdquo;
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Order Stats & Actions */}
                  <div className="flex flex-wrap items-center gap-4 lg:gap-5 justify-between lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#F2EBE0]">
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-[#635B5B]">
                        <span className="font-semibold text-[#2C181B]">
                          {cust.totalOrders}
                        </span>{' '}
                        {cust.totalOrders === 1 ? 'order' : 'orders'}
                        {cust.lastOrderDate && (
                          <div className="text-[10px] text-[#8C7D7D]">
                            Last: {cust.lastOrderDate}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider text-[#8C7D7D]">
                          Spent
                        </div>
                        <div className="font-serif font-bold text-[#2C181B] text-sm">
                          {formatINR(cust.totalSpent)}
                        </div>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5">
                      {onCreateOrderForCustomer && (
                        <button
                          type="button"
                          onClick={() => onCreateOrderForCustomer(cust)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D9C9B4] bg-[#FAF6F0] text-[#541523] hover:bg-[#F2EBE0] text-[11px] font-semibold transition"
                          title={`Create a new order for ${cust.name}`}
                        >
                          <ShoppingBag size={12} />
                          <span>+ Order</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onEditCustomer(cust)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D9C9B4] bg-white text-[#541523] hover:bg-[#F2EBE0] text-[11px] font-semibold transition"
                        title={`Edit ${cust.name}`}
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const msg =
                            cust.totalOrders > 0
                              ? `Delete customer "${cust.name}"? Their existing ${cust.totalOrders} order(s) will stay in Orders unless deleted separately.`
                              : `Delete customer "${cust.name}"?`;
                          if (window.confirm(msg)) {
                            onDeleteCustomer(cust.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition"
                        title={`Delete ${cust.name}`}
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
