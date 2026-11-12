'use client';

import React, { useState } from 'react';
import { Expense, Supplier } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import {
  computeSupplierMetrics,
  getInstagramProfileUrl,
  getWhatsAppChatUrl,
  normalizeWebsiteUrl,
} from '@/lib/oprFormulas';
import { computePurchaseRowMetrics } from '@/lib/purchaseFormulas';
import {
  X,
  Truck,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Instagram,
  Globe,
  ExternalLink,
  Edit3,
  ShoppingBag,
  Star,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Clock,
  CreditCard,
} from 'lucide-react';

interface SupplierDetailModalProps {
  supplier: Supplier | null;
  expenses: Expense[];
  onClose: () => void;
  onEdit: (supplier: Supplier) => void;
  onRecordPurchase?: (supplier: Supplier) => void;
}

export default function SupplierDetailModal({
  supplier,
  expenses,
  onClose,
  onEdit,
  onRecordPurchase,
}: SupplierDetailModalProps) {
  const [copiedUpi, setCopiedUpi] = useState(false);

  if (!supplier) return null;

  const metrics = computeSupplierMetrics(supplier, expenses);
  const cleanPhone =
    supplier.phone && supplier.phone !== '—' && supplier.phone !== '-' ? supplier.phone : '';
  const whatsappUrl = getWhatsAppChatUrl(supplier.whatsappNumber || cleanPhone);
  const igUrl = getInstagramProfileUrl(supplier.instagramHandle);
  const webUrl = normalizeWebsiteUrl(supplier.websiteUrl);

  const handleCopyUpi = () => {
    if (!supplier.upiId) return;
    navigator.clipboard?.writeText(supplier.upiId).catch(() => {});
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-[#E8DDCF] shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#FAF5EE] border-b border-[#E8DDCF] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-white border border-[#E8DDCF] flex items-center justify-center text-[#541523] shrink-0">
              <Truck size={21} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-[#2C181B]">
                  {supplier.name}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F2EBE0] text-[#541523] border border-[#E8DDCF] font-semibold">
                  {supplier.category}
                </span>
                {supplier.vendorType && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#635B5B] border border-[#E8DDCF]">
                    {supplier.vendorType}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-[#7A6E6E]">
                {supplier.reliabilityRating && (
                  <span className="inline-flex items-center gap-0.5 text-[#C69C31] font-semibold">
                    {Array.from({ length: supplier.reliabilityRating }).map((_, idx) => (
                      <Star key={idx} size={11} className="fill-[#C69C31] text-[#C69C31]" />
                    ))}
                    <span className="ml-1 text-[#541523]">{supplier.reliabilityRating}/5</span>
                  </span>
                )}
                {supplier.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={11} className="text-[#8F243C]" />
                    <span>
                      {supplier.city}
                      {supplier.pincode ? ` - ${supplier.pincode}` : ''}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onRecordPurchase && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRecordPurchase(supplier);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold transition"
              >
                <ShoppingBag size={13} />
                <span>+ Purchase</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(supplier);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9C9B4] bg-white hover:bg-[#F2EBE0] text-[#541523] text-xs font-semibold transition"
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md"
              aria-label="Close supplier details"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 text-xs">
          {/* Top Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-[#FAF6F0] border border-[#E8DDCF] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7A6E6E]">
                Total Spend
              </div>
              <div className="mt-1 text-lg font-serif font-bold text-[#8F243C]">
                {formatINR(metrics.displayPaid)}
              </div>
              <div className="text-[10px] text-[#7A6E6E]">
                {metrics.lineCount > 0 ? 'Live from Purchase ledger' : 'Recorded vendor total'}
              </div>
            </div>

            <div className="rounded-xl bg-[#FAF6F0] border border-[#E8DDCF] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7A6E6E]">
                Purchase Orders
              </div>
              <div className="mt-1 text-lg font-serif font-bold text-[#2C181B]">
                {metrics.displayOrders}
              </div>
              <div className="text-[10px] text-[#7A6E6E]">
                {metrics.distinctOrders > 0
                  ? `${metrics.distinctOrders} distinct order refs`
                  : metrics.lastPurchaseDate
                  ? `Last: ${metrics.lastPurchaseDate}`
                  : 'No matched orders'}
              </div>
            </div>

            <div className="rounded-xl bg-[#FAF6F0] border border-[#E8DDCF] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7A6E6E]">
                Delivery Speed
              </div>
              <div className="mt-1 text-lg font-serif font-bold text-[#2C181B] flex items-center gap-1">
                <Clock size={14} className="text-[#8F243C]" />
                <span>
                  {metrics.avgDaysToDeliver !== null
                    ? `${metrics.avgDaysToDeliver}d avg`
                    : supplier.leadTimeDays !== undefined
                    ? `~${supplier.leadTimeDays}d`
                    : '—'}
                </span>
              </div>
              <div className="text-[10px] text-[#7A6E6E]">
                {metrics.inTransitCount > 0
                  ? `${metrics.inTransitCount} currently in transit`
                  : 'No open shipments'}
              </div>
            </div>

            <div className="rounded-xl bg-[#FAF6F0] border border-[#E8DDCF] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7A6E6E]">
                Payment Terms
              </div>
              <div className="mt-1 text-sm font-semibold text-[#2C181B] flex items-center gap-1">
                <CreditCard size={13} className="text-[#8F243C]" />
                <span>{supplier.paymentTerms || 'Immediate / UPI'}</span>
              </div>
              <div className="text-[10px] text-[#7A6E6E] truncate">
                {supplier.gstin ? `GSTIN: ${supplier.gstin}` : 'No GSTIN saved'}
              </div>
            </div>
          </div>

          {/* Contact & Procurement Profile Card */}
          <div className="rounded-xl border border-[#E8DDCF] bg-[#FCFAF7] p-4 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8F243C]">
              Vendor Contact, Online Portals &amp; Notes
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-[10px] text-[#7A6E6E]">Contact Person</div>
                <div className="font-medium text-[#2C181B]">
                  {supplier.contactPerson || '—'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#7A6E6E]">Phone / Counter Ref</div>
                <div className="font-mono text-[#2C181B] flex items-center gap-1.5">
                  <Phone size={11} className="text-[#8F243C]" />
                  <span>{cleanPhone || 'Not added'}</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#7A6E6E]">Email</div>
                {supplier.email ? (
                  <a
                    href={`mailto:${supplier.email}`}
                    className="inline-flex items-center gap-1 text-[#541523] hover:underline"
                  >
                    <Mail size={11} />
                    <span>{supplier.email}</span>
                  </a>
                ) : (
                  <span className="text-[#8C7D7D]">Not added</span>
                )}
              </div>

              <div>
                <div className="text-[10px] text-[#7A6E6E]">Saved UPI ID / Bank Ref</div>
                {supplier.upiId ? (
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="inline-flex items-center gap-1.5 font-mono text-[#541523] hover:underline"
                    title="Copy UPI ID"
                  >
                    <span>{supplier.upiId}</span>
                    {copiedUpi ? (
                      <Check size={11} className="text-emerald-700" />
                    ) : (
                      <Copy size={11} />
                    )}
                  </button>
                ) : (
                  <span className="text-[#8C7D7D]">—</span>
                )}
              </div>

              <div>
                <div className="text-[10px] text-[#7A6E6E]">Social / Portal Links</div>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-[11px]"
                    >
                      <MessageCircle size={10} />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  {igUrl && (
                    <a
                      href={igUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-[#8F243C] border border-rose-200 hover:bg-rose-100 text-[11px]"
                    >
                      <Instagram size={10} />
                      <span>{supplier.instagramHandle}</span>
                      <ExternalLink size={9} />
                    </a>
                  )}
                  {webUrl && (
                    <a
                      href={webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 text-[11px]"
                    >
                      <Globe size={10} />
                      <span>Website</span>
                      <ExternalLink size={9} />
                    </a>
                  )}
                  {!whatsappUrl && !igUrl && !webUrl && (
                    <span className="text-[#8C7D7D]">No links saved</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#7A6E6E]">Expense Match Aliases</div>
                <div className="text-[#2C181B] truncate" title={supplier.platformAlias || supplier.name}>
                  {supplier.platformAlias || `Auto (${supplier.name})`}
                </div>
              </div>
            </div>

            {supplier.materialsSupplied && (
              <div className="pt-2 border-t border-[#F2EBE0]">
                <span className="font-semibold text-[#423A3A]">Key Materials: </span>
                <span className="text-[#635B5B]">{supplier.materialsSupplied}</span>
              </div>
            )}

            {supplier.notes && (
              <div className="pt-1 text-[#635B5B] italic">
                &ldquo;{supplier.notes}&rdquo;
              </div>
            )}
          </div>

          {/* Linked Purchase Ledger */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8F243C]">
                Linked Purchase History ({metrics.matchedExpenses.length} items)
              </div>
              {metrics.matchedExpenses.length > 0 && (
                <span className="text-[11px] text-[#7A6E6E]">
                  Showing recent ledger items matched from Expenses
                </span>
              )}
            </div>

            {metrics.matchedExpenses.length === 0 ? (
              <div className="border border-dashed border-[#D9C9B4] rounded-xl p-6 text-center space-y-2 bg-[#FAF6F0]/40">
                <p className="text-xs text-[#635B5B]">
                  No Expenses ledger lines are currently matched to <strong>{supplier.name}</strong>.
                </p>
                <p className="text-[11px] text-[#8C7D7D]">
                  Click <strong>+ Purchase</strong> to record an order with this vendor, or edit{' '}
                  <em>Expense Match Keywords</em> if purchases use a different vendor/platform label.
                </p>
              </div>
            ) : (
              <div className="border border-[#E8DDCF] rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#FAF5EE] text-[#541523] sticky top-0 border-b border-[#E8DDCF]">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Date &amp; Order Ref</th>
                      <th className="py-2 px-3 font-semibold">Item &amp; Category</th>
                      <th className="py-2 px-3 font-semibold text-right">Qty × Rate</th>
                      <th className="py-2 px-3 font-semibold text-right">Total (₹)</th>
                      <th className="py-2 px-3 font-semibold">Status &amp; Media</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EBE0] bg-white">
                    {metrics.matchedExpenses.slice(0, 60).map((exp) => {
                      const rm = computePurchaseRowMetrics(exp);
                      return (
                        <tr key={exp.id} className="hover:bg-[#FAF6F0]/60">
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="font-mono text-[11px] text-[#2C181B]">
                              {exp.date}
                            </div>
                            {exp.orderId && (
                              <div className="text-[10px] text-[#7A6E6E] font-mono">
                                {exp.orderId}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-medium text-[#2C181B]">{exp.title}</div>
                            <div className="text-[10px] text-[#7A6E6E]">
                              {exp.category}
                              {exp.dimensions ? ` · ${exp.dimensions}` : ''}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap text-[#635B5B]">
                            {rm.qty} × {formatINR(rm.unitPrice)}
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap font-serif font-bold text-[#8F243C]">
                            {formatINR(rm.totalCost)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F2EBE0] text-[#541523] font-medium">
                                {exp.purchaseStatus || 'Delivered'}
                              </span>
                              {(exp.receiptUrl || exp.receiptFile) && (
                                <span title="Invoice/Bill attached" className="text-[#8F243C]">
                                  <FileText size={12} />
                                </span>
                              )}
                              {(exp.imageUrl || exp.imageRef) && (
                                <span title="Product image attached" className="text-emerald-700">
                                  <ImageIcon size={12} />
                                </span>
                              )}
                            </div>
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
      </div>
    </div>
  );
}
