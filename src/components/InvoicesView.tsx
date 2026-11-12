'use client';

import React, { useMemo, useState } from 'react';
import { Customer, Order } from '@/lib/types';
import {
  buildGroupedInvoices,
  extractOrderLocation,
  formatInvoiceDisplayDate,
  formatInvoiceNumber,
} from '@/lib/oprFormulas';
import { formatINR, round2 } from '@/lib/utils';
import {
  FileText,
  Search,
  MapPin,
  Calendar,
  Package,
  Printer,
} from 'lucide-react';

interface InvoicesViewProps {
  orders: Order[];
  customers?: Customer[];
  onSelectOrderForInvoice: (order: Order) => void;
}

export default function InvoicesView({
  orders,
  customers = [],
  onSelectOrderForInvoice,
}: InvoicesViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'due'>('all');

  const groupedInvoices = useMemo(() => buildGroupedInvoices(orders), [orders]);

  const enrichedInvoices = useMemo(() => {
    return groupedInvoices.map((inv) => {
      const invNo = formatInvoiceNumber(inv);
      const location = extractOrderLocation(inv, customers);
      const totalQty = inv.items.reduce((s, it) => s + (it.quantity || 0), 0);
      const deliveryRaw = inv.deliveredOn || inv.targetDeliveryDate || '';
      const grandTotal = round2(
        inv.totalAmount + (inv.tax ?? 0) + (inv.shipping ?? 0)
      );
      const effectiveBalance = round2(
        Math.max(0, grandTotal - (inv.advancePaid || 0))
      );
      return {
        order: inv,
        invNo,
        location,
        totalQty,
        deliveryRaw,
        grandTotal,
        effectiveBalance,
        isFullyPaid: effectiveBalance <= 0,
      };
    });
  }, [groupedInvoices, customers]);

  const stats = useMemo(() => {
    const totalValue = round2(
      enrichedInvoices.reduce((s, x) => s + x.grandTotal, 0)
    );
    const totalCollected = round2(
      enrichedInvoices.reduce((s, x) => s + (x.order.advancePaid || 0), 0)
    );
    const totalDue = round2(
      enrichedInvoices.reduce((s, x) => s + x.effectiveBalance, 0)
    );
    const paidCount = enrichedInvoices.filter((x) => x.isFullyPaid).length;
    const dueCount = enrichedInvoices.length - paidCount;
    return { totalValue, totalCollected, totalDue, paidCount, dueCount };
  }, [enrichedInvoices]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrichedInvoices.filter((entry) => {
      if (statusFilter === 'paid' && !entry.isFullyPaid) return false;
      if (statusFilter === 'due' && entry.isFullyPaid) return false;
      if (!q) return true;
      const itemsText = entry.order.items.map((i) => i.productName).join(' ');
      const haystack = [
        entry.invNo,
        entry.order.orderNumber,
        entry.order.customerName,
        entry.location,
        entry.order.createdAt,
        entry.deliveryRaw,
        itemsText,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [enrichedInvoices, search, statusFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Invoices &amp; Billing
          </h2>
          <p className="text-xs text-[#7A6E6E]">
            VEDH branded A4 invoices grouped by customer order — with customer location, delivery date &amp; instant PDF print
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3.5 py-2 rounded-xl bg-[#FAF5EE] border border-[#E8DDCF]">
            <div className="text-[10px] uppercase tracking-wider text-[#7A6E6E]">
              Invoices
            </div>
            <div className="font-serif font-bold text-[#541523] text-sm">
              {enrichedInvoices.length} Orders
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#FAF5EE] border border-[#E8DDCF]">
            <div className="text-[10px] uppercase tracking-wider text-[#7A6E6E]">
              Total Billed
            </div>
            <div className="font-serif font-bold text-[#2C181B] text-sm">
              {formatINR(stats.totalValue)}
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200">
            <div className="text-[10px] uppercase tracking-wider text-amber-800">
              Balance Pending
            </div>
            <div className="font-serif font-bold text-amber-900 text-sm">
              {formatINR(stats.totalDue)}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7D7D]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice #, order #, customer, location, or product..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E8DDCF] rounded-xl bg-[#FAF6F0]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'all'
                ? 'bg-[#541523] text-white'
                : 'bg-[#FAF5EE] text-[#541523] hover:bg-[#F2EBE0]'
            }`}
          >
            All ({enrichedInvoices.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'paid'
                ? 'bg-emerald-700 text-white'
                : 'bg-[#FAF5EE] text-[#541523] hover:bg-[#F2EBE0]'
            }`}
          >
            Paid ({stats.paidCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('due')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'due'
                ? 'bg-amber-700 text-white'
                : 'bg-[#FAF5EE] text-[#541523] hover:bg-[#F2EBE0]'
            }`}
          >
            Balance Due ({stats.dueCount})
          </button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#7A6E6E]">
            No customer invoices match your filter.
          </div>
        ) : (
          <div className="divide-y divide-[#F2EBE0]">
            {filtered.map((entry) => {
              const { order, invNo, location, totalQty, deliveryRaw, grandTotal, effectiveBalance, isFullyPaid } = entry;
              const invDateLabel = formatInvoiceDisplayDate(order.createdAt);
              const delivLabel = deliveryRaw ? formatInvoiceDisplayDate(deliveryRaw) : 'Pending';
              const itemsPreview = order.items
                .map((it) => `${it.productName} ×${it.quantity}`)
                .join(', ');

              return (
                <div
                  key={`${order.orderNumber}-${order.customerName}-${order.createdAt}`}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#FAF6F0]/60 transition"
                >
                  {/* Left: Invoice info */}
                  <div className="flex items-start space-x-4 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#6A1C28] text-[#FED69D] flex items-center justify-center shrink-0 shadow-sm">
                      <FileText size={19} />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#6A1C28] bg-[#FED69D]/55 px-2 py-0.5 rounded">
                          {invNo}
                        </span>
                        <span className="text-sm font-bold text-[#2C181B]">
                          {order.customerName}
                        </span>
                        <span className="text-[11px] font-mono text-[#7A6E6E]">
                          ({order.orderNumber})
                        </span>
                        {location && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#FAF5EE] border border-[#E8DDCF] text-[#635B5B]">
                            <MapPin size={10} className="text-[#8F243C]" />
                            <span className="truncate max-w-[220px]">{location}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#635B5B]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={11} className="text-[#8C7D7D]" />
                          Invoice: {invDateLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#541523] font-medium">
                          <Calendar size={11} />
                          Delivery: {delivLabel}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Package size={11} className="text-[#8C7D7D]" />
                          {order.items.length} item{order.items.length > 1 ? 's' : ''} · {totalQty} qty
                        </span>
                      </div>

                      <div className="text-[11px] text-[#7A6E6E] truncate max-w-2xl">
                        {itemsPreview}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amounts & Action */}
                  <div className="flex items-center space-x-4 justify-between lg:justify-end shrink-0">
                    <div className="text-right">
                      <div className="font-serif font-bold text-[#2C181B] text-base">
                        {formatINR(grandTotal)}
                      </div>
                      <div className="text-[11px]">
                        {isFullyPaid ? (
                          <span className="text-emerald-700 font-medium">
                            Paid ({formatINR(order.advancePaid)})
                          </span>
                        ) : (
                          <span className="text-amber-700 font-medium">
                            Due: {formatINR(effectiveBalance)}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        isFullyPaid
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {isFullyPaid ? 'Paid' : 'Pending'}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectOrderForInvoice(order)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#6A1C28] hover:bg-[#541523] text-[#FED69D] text-xs font-semibold transition shadow-sm"
                    >
                      <Printer size={14} />
                      <span>Invoice / PDF</span>
                    </button>
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
