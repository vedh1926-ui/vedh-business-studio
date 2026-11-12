'use client';

import React, { useEffect, useState } from 'react';
import { Customer, Order } from '@/lib/types';
import {
  extractOrderLocation,
  formatInvoiceDisplayDate,
  formatInvoiceNumber,
} from '@/lib/oprFormulas';
import { formatINR, round2 } from '@/lib/utils';
import VedhInvoiceTemplate from './VedhInvoiceTemplate';
import {
  X,
  Printer,
  Share2,
  SlidersHorizontal,
  Save,
  Check,
  MapPin,
} from 'lucide-react';

export interface InvoiceOrderDetailsPatch {
  customerLocation?: string;
  deliveredOn?: string;
  targetDeliveryDate?: string;
  shipping?: number;
  tax?: number;
  invoiceNumber?: string;
}

interface InvoiceModalProps {
  order: Order | null;
  customers?: Customer[];
  onClose: () => void;
  onSaveOrderInvoiceDetails?: (order: Order, patch: InvoiceOrderDetailsPatch) => void;
}

export default function InvoiceModal({
  order,
  customers = [],
  onClose,
  onSaveOrderInvoiceDetails,
}: InvoiceModalProps) {
  const [showCustomize, setShowCustomize] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [locationText, setLocationText] = useState('');
  const [customerSubtitle, setCustomerSubtitle] = useState('');
  const [shippingStr, setShippingStr] = useState('0');
  const [taxStr, setTaxStr] = useState('0');
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!order) return;
    setInvoiceNumber(formatInvoiceNumber(order));
    setInvoiceDate(order.createdAt || '');
    setDeliveryDate(order.deliveredOn || order.targetDeliveryDate || '');
    setLocationText(extractOrderLocation(order, customers));
    setCustomerSubtitle('');
    setShippingStr(String(order.shipping ?? 0));
    setTaxStr(String(order.tax ?? 0));
    setShowPaymentSummary(false);
    setSavedNotice(false);
  }, [order, customers]);

  if (!order) return null;

  const shippingVal = Math.max(0, round2(parseFloat(shippingStr) || 0));
  const taxVal = Math.max(0, round2(parseFloat(taxStr) || 0));
  const subTotal = round2(
    order.items?.length
      ? order.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)
      : order.totalAmount || 0
  );
  const grandTotal = round2(subTotal + taxVal + shippingVal);
  const effectiveBalance = round2(Math.max(0, grandTotal - (order.advancePaid || 0)));

  const handlePrint = () => {
    window.print();
  };

  const handleSaveDetails = () => {
    if (!onSaveOrderInvoiceDetails) return;
    const isDeliveredStatus = order.status === 'Delivered';
    onSaveOrderInvoiceDetails(order, {
      customerLocation: locationText.trim() || undefined,
      deliveredOn: isDeliveredStatus ? deliveryDate || undefined : order.deliveredOn,
      targetDeliveryDate: !isDeliveredStatus
        ? deliveryDate || undefined
        : order.targetDeliveryDate,
      shipping: shippingVal,
      tax: taxVal,
      invoiceNumber: invoiceNumber.trim() || undefined,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  const handleWhatsAppShare = () => {
    const itemsSummary = order.items
      .map((it) => `• ${it.productName} × ${it.quantity} (${formatINR(it.quantity * it.unitPrice)})`)
      .join('\n');
    const delivLabel = deliveryDate
      ? `\nDelivery Date: ${formatInvoiceDisplayDate(deliveryDate)}`
      : '';
    const locLabel = locationText.trim() ? `\nDelivery Location: ${locationText.trim()}` : '';

    const text = encodeURIComponent(
      `Hello ${order.customerName},\n\nThank you for choosing *VEDH Artistry* ("Little things, made meaningful."). Here is your invoice ${invoiceNumber} for order ${order.orderNumber}:${locLabel}${delivLabel}\n\n${itemsSummary}\n\nSubtotal: ${formatINR(subTotal)}${
        shippingVal > 0 ? `\nShipping: ${formatINR(shippingVal)}` : ''
      }${taxVal > 0 ? `\nTax: ${formatINR(taxVal)}` : ''}\nTotal Amount: ${formatINR(
        grandTotal
      )}\nAdvance Paid: ${formatINR(order.advancePaid)}\nBalance Due: ${formatINR(
        effectiveBalance
      )}\n\nwww.vedhartistry.com | @vedh.artistry`
    );
    window.open(
      `https://wa.me/${order.customerPhone?.replace(/[^0-9]/g, '') || ''}?text=${text}`,
      '_blank'
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex justify-center p-2 sm:p-6 print:static print:overflow-visible print:bg-transparent print:backdrop-blur-none print:p-0 print:block">
      <div className="relative w-full max-w-[840px] my-auto bg-[#FAF5EE] rounded-2xl shadow-2xl border border-[#E8DDCF] overflow-hidden print:w-full print:max-w-none print:my-0 print:bg-transparent print:border-0 print:rounded-none print:shadow-none">
        {/* Modal Top Actions (no-print) */}
        <div className="no-print bg-[#FAF5EE] border-b border-[#E8DDCF] px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-serif font-bold text-[#541523] text-sm">
              Invoice {invoiceNumber}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              {order.orderNumber} · {order.customerName}
            </span>
            {!locationText.trim() && (
              <button
                type="button"
                onClick={() => setShowCustomize(true)}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 hover:bg-amber-200 transition"
              >
                <MapPin size={11} />
                <span>+ Add location</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCustomize((v) => !v)}
              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                showCustomize
                  ? 'bg-[#6D1C29] text-white border-[#6D1C29]'
                  : 'bg-white text-[#541523] border-[#D9C9B4] hover:bg-[#F2EBE0]'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Edit Details</span>
            </button>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition"
            >
              <Share2 size={13} />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold transition"
            >
              <Printer size={13} />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-[#F2EBE0] transition"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Optional Customize Bar (no-print) */}
        {showCustomize && (
          <div className="no-print bg-white border-b border-[#E8DDCF] px-4 sm:px-6 py-4 text-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#423A3A] mb-1">
                  Delivery Location / Address
                </label>
                <textarea
                  rows={2}
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="House / Flat, Society, Street, City..."
                  className="w-full px-2.5 py-1.5 border border-[#D9C9B4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#541523] resize-none"
                />
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block font-semibold text-[#423A3A] mb-1">
                    Invoice No.
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#D9C9B4] rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#541523]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#423A3A] mb-1">
                    Subtitle (optional)
                  </label>
                  <input
                    type="text"
                    value={customerSubtitle}
                    onChange={(e) => setCustomerSubtitle(e.target.value)}
                    placeholder="Occasion / Role..."
                    className="w-full px-2.5 py-1.5 border border-[#D9C9B4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#541523]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-[#423A3A] mb-1">
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full px-2 py-1.5 border border-[#D9C9B4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#541523]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#423A3A] mb-1">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-2 py-1.5 border border-[#D9C9B4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#541523]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-[#423A3A] mb-1">
                      Tax (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={taxStr}
                      onChange={(e) => setTaxStr(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#D9C9B4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#541523]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#423A3A] mb-1">
                      Shipping (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingStr}
                      onChange={(e) => setShippingStr(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#D9C9B4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#541523]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F2EBE0]">
              <label className="inline-flex items-center gap-2 text-[#423A3A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPaymentSummary}
                  onChange={(e) => setShowPaymentSummary(e.target.checked)}
                  className="rounded border-[#D9C9B4] text-[#541523] focus:ring-[#541523]"
                />
                <span>Show Advance Paid &amp; Balance Due under Total</span>
              </label>

              {onSaveOrderInvoiceDetails && (
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white font-semibold transition"
                >
                  {savedNotice ? <Check size={13} /> : <Save size={13} />}
                  <span>{savedNotice ? 'Saved to Order' : 'Save to Order'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Printable A4 Invoice Preview Canvas */}
        <div className="p-3 sm:p-5 overflow-x-auto bg-[#EDE5D9] print:p-0 print:overflow-visible print:bg-transparent">
          <VedhInvoiceTemplate
            order={order}
            customers={customers}
            invoiceNumberOverride={invoiceNumber}
            invoiceDateOverride={invoiceDate}
            deliveryDateOverride={deliveryDate}
            locationOverride={locationText}
            subtitleOverride={customerSubtitle}
            taxOverride={taxVal}
            shippingOverride={shippingVal}
            showPaymentSummary={showPaymentSummary}
          />
        </div>
      </div>
    </div>
  );
}
