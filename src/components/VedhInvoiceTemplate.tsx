'use client';

import React from 'react';
import { Customer, Order } from '@/lib/types';
import {
  extractOrderLocation,
  formatInvoiceDisplayDate,
  formatInvoiceNumber,
} from '@/lib/oprFormulas';
import { round2 } from '@/lib/utils';

export interface VedhInvoiceTemplateProps {
  order: Order;
  customers?: Customer[];
  /** Optional interactive overrides from the invoice customization toolbar */
  invoiceNumberOverride?: string;
  invoiceDateOverride?: string;
  deliveryDateOverride?: string;
  locationOverride?: string;
  subtitleOverride?: string;
  taxOverride?: number;
  shippingOverride?: number;
  showPaymentSummary?: boolean;
}

function formatLinePrice(val: number): string {
  const rounded = round2(val);
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2);
}

function formatSummaryMoney(val: number): string {
  const rounded = round2(val);
  if (rounded === 0) return '00.00';
  return rounded.toFixed(2);
}

export default function VedhInvoiceTemplate({
  order,
  customers = [],
  invoiceNumberOverride,
  invoiceDateOverride,
  deliveryDateOverride,
  locationOverride,
  subtitleOverride,
  taxOverride,
  shippingOverride,
  showPaymentSummary = false,
}: VedhInvoiceTemplateProps) {
  const invoiceNo = invoiceNumberOverride?.trim() || formatInvoiceNumber(order);
  const rawInvoiceDate = invoiceDateOverride?.trim() || order.createdAt;
  const invoiceDateText = formatInvoiceDisplayDate(rawInvoiceDate) || '—';

  const rawDeliveryDate =
    deliveryDateOverride !== undefined
      ? deliveryDateOverride.trim()
      : order.deliveredOn || order.targetDeliveryDate || '';
  const deliveryDateText = rawDeliveryDate
    ? formatInvoiceDisplayDate(rawDeliveryDate)
    : 'To be confirmed';

  const resolvedLocation =
    locationOverride !== undefined
      ? locationOverride.trim()
      : extractOrderLocation(order, customers);

  const items = order.items?.length ? order.items : [];
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const subTotal = round2(
    items.length > 0
      ? items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      : order.totalAmount || 0
  );
  const tax = round2(typeof taxOverride === 'number' ? taxOverride : order.tax ?? 0);
  const shipping = round2(
    typeof shippingOverride === 'number' ? shippingOverride : order.shipping ?? 0
  );
  const grandTotal = round2(subTotal + tax + shipping);
  const advancePaid = round2(order.advancePaid || 0);
  const balanceDue = round2(Math.max(0, grandTotal - advancePaid));

  // Scale row spacing smoothly when an order has many line items so it stays on 1 A4 page
  const isDense = items.length >= 6;
  const isUltraDense = items.length >= 9;
  const rowPadClass = isUltraDense
    ? 'py-1.5 text-[11px]'
    : isDense
    ? 'py-2.5 text-[11.5px]'
    : 'py-3.5 text-[12px]';

  return (
    <div
      id="printable-invoice"
      className="relative w-[794px] min-h-[1123px] mx-auto bg-[#FBF4EB] text-[#231F20] overflow-hidden select-text flex flex-col justify-between shadow-sm"
      style={{ fontFamily: 'var(--font-invoice-sans), "DM Sans", sans-serif' }}
    >
      {/* Background Bottom-Right Calligraphy Watermark */}
      <img
        src="/invoice/vedh-watermark.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute -right-[110px] bottom-[2px] w-[588px] h-auto opacity-[0.055] z-0"
      />

      {/* Main Two-Column Upper Area */}
      <div className="relative z-10 flex flex-1">
        {/* LEFT BURGUNDY PANEL (#6A1C28 matches Canva SWOP burgundy cleanly) */}
        <div className="relative w-[322px] shrink-0">
          {/* Colored Burgundy Slab ending at 830px (~74% page height) so cream sits underneath */}
          <div
            className="bg-[#6A1C28] text-[#FBF4EB] px-[52px] pt-[144px] pb-[82px] min-h-[830px] flex flex-col"
            style={{ backgroundColor: '#6A1C28' }}
          >
            {/* Hero INVOICE heading aligned cleanly with top-right logo rule */}
            <h1
              className="-ml-[18px] text-[54px] leading-none tracking-[0.02em] text-[#FED69D] uppercase font-normal"
              style={{ fontFamily: 'var(--font-invoice-display), "Cal Sans", sans-serif' }}
            >
              INVOICE
            </h1>

            {/* INVOICE TO */}
            <div className="mt-[32px]">
              <div
                className="text-[12px] tracking-[0.06em] uppercase text-[#FBF4EB]"
                style={{ fontFamily: 'var(--font-invoice-display), "Cal Sans", sans-serif' }}
              >
                INVOICE TO
              </div>
              <div className="mt-2.5 h-[1px] w-full bg-[#C7BDAB]/80" />

              <div className="mt-5 space-y-1.5">
                <div className="text-[17.5px] leading-snug font-medium text-[#C7BDAB] break-words">
                  {order.customerName}
                </div>
                {subtitleOverride?.trim() && (
                  <div className="text-[12.5px] text-[#FBF4EB]/90 leading-snug">
                    {subtitleOverride.trim()}
                  </div>
                )}
                {resolvedLocation && (
                  <div className="pt-1.5 text-[12px] text-[#FBF4EB] leading-[1.45] whitespace-pre-line break-words">
                    {resolvedLocation}
                  </div>
                )}
                {order.customerPhone?.trim() && (
                  <div className="pt-0.5 text-[11.5px] text-[#FBF4EB]/85">
                    {order.customerPhone.trim()}
                  </div>
                )}
              </div>
            </div>

            {/* CONTACT DETAILS (fixed VEDH branding per template) */}
            <div className="mt-[32px]">
              <div
                className="text-[12px] tracking-[0.06em] uppercase text-[#FBF4EB]"
                style={{ fontFamily: 'var(--font-invoice-display), "Cal Sans", sans-serif' }}
              >
                CONTACT DETAILS
              </div>
              <div className="mt-2.5 h-[1px] w-full bg-[#C7BDAB]/80" />

              <div className="mt-5 space-y-3.5 text-[13px] text-[#FBF4EB]">
                <div className="flex items-center gap-3">
                  <img
                    src="/invoice/icon-globe.svg"
                    alt=""
                    className="w-[12px] h-[12px] shrink-0"
                  />
                  <span>www.vedhartistry.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src="/invoice/icon-phone.svg"
                    alt=""
                    className="w-[12px] h-[12px] shrink-0"
                  />
                  <span>+91 7981631783</span>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src="/invoice/icon-instagram.svg"
                    alt=""
                    className="w-[12px] h-[12px] shrink-0"
                  />
                  <span>@vedh.artistry</span>
                </div>
              </div>
            </div>

            {/* INFORMATION */}
            <div className="mt-[32px]">
              <div
                className="text-[12px] tracking-[0.06em] uppercase text-[#FBF4EB]"
                style={{ fontFamily: 'var(--font-invoice-display), "Cal Sans", sans-serif' }}
              >
                INFORMATION
              </div>
              <div className="mt-2.5 h-[1px] w-full bg-[#C7BDAB]/80" />

              <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 text-[12px] text-[#FBF4EB]">
                <div>
                  <div className="text-[#FBF4EB]/90">Invoice Date:</div>
                  <div className="mt-1 font-normal text-[#FBF4EB]">{invoiceDateText}</div>
                </div>
                <div>
                  <div className="text-[#FBF4EB]/90">Invoice No:</div>
                  <div className="mt-1 font-normal text-[#FBF4EB]">{invoiceNo}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[#FBF4EB]/90">Delivery Date:</div>
                  <div className="mt-1 font-normal text-[#FBF4EB]">{deliveryDateText}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Instagram QR Box straddling the bottom edge of the burgundy panel */}
          <div
            className="absolute left-[57px] top-[768px] w-[123px] h-[123px] bg-[#FBF4EB] flex items-center justify-center p-[14px] z-20"
            style={{ backgroundColor: '#FBF4EB' }}
          >
            <img
              src="/invoice/vedh-ig-qr.svg"
              alt="Scan @vedh.artistry on Instagram"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* RIGHT CREAM COLUMN */}
        <div className="flex-1 pr-[36px] pt-[122px] pb-6 flex flex-col">
          {/* Top-Right Brand Mark + Rule + Tagline */}
          <div className="flex flex-col items-end">
            <img
              src="/invoice/vedh-calligraphy.svg"
              alt="vedh"
              className="w-[108px] h-auto mr-[13px]"
            />
            <div className="mt-[6px] w-[336px] mr-[13px] h-[1px] bg-[#6D1C29]" />
            <img
              src="/invoice/vedh-tagline.svg"
              alt="Little things, made meaningful."
              className="mt-[6px] w-[162px] h-auto mr-[13px]"
            />
          </div>

          {/* Line Items Table */}
          <div className="mt-[106px] relative">
            {/* Peach-Gold Header overlapping 32px left into the burgundy panel */}
            <div
              className="-ml-[32px] pl-[32px] bg-[#FED69D] text-[#6D1C29] h-[44px] grid grid-cols-[62px_1fr_48px_82px_84px] items-center text-[12px]"
              style={{
                backgroundColor: '#FED69D',
                fontFamily: 'var(--font-invoice-display), "Cal Sans", sans-serif',
              }}
            >
              <div className="pl-[20px]">Sr. No.:</div>
              <div className="pl-2">Description</div>
              <div className="text-center">Qty</div>
              <div className="text-right pr-2">Prices</div>
              <div className="text-right pr-[24px]">Total</div>
            </div>

            {/* Body Rows aligned strictly within cream area */}
            <div>
              {items.map((item, idx) => {
                const isShaded = idx % 2 === 1;
                const lineTotal = round2(item.quantity * item.unitPrice);
                return (
                  <div
                    key={`${item.productId}-${idx}`}
                    className={`grid grid-cols-[62px_1fr_48px_82px_84px] items-center ${rowPadClass} text-[#231F20] ${
                      isShaded ? 'bg-[#E7E4E1]' : 'bg-transparent'
                    }`}
                  >
                    <div className="pl-[20px]">{String(idx + 1).padStart(2, '0')}</div>
                    <div className="pl-2 pr-2 font-normal leading-snug break-words">
                      {item.productName}
                    </div>
                    <div className="text-center">{item.quantity}</div>
                    <div className="text-right pr-2 whitespace-nowrap">
                      Rs. {formatLinePrice(item.unitPrice)}
                    </div>
                    <div className="text-right pr-[24px] whitespace-nowrap">
                      Rs. {formatLinePrice(lineTotal)}
                    </div>
                  </div>
                );
              })}

              {/* Table Total Row */}
              <div
                className={`grid grid-cols-[62px_1fr_48px_82px_84px] items-center bg-[#E7E4E1] ${rowPadClass} ${
                  items.length % 2 === 0 ? 'border-t border-[#D3CEC8]' : ''
                }`}
              >
                <div className="pl-[20px] font-bold text-[#010202]">Total</div>
                <div className="pl-2 text-[#231F20]">
                  {String(items.length).padStart(2, '0')}
                </div>
                <div className="text-center text-[#231F20]">{totalQty}</div>
                <div />
                <div />
              </div>
            </div>

            {/* Sub Total / Tax / Shipping / TOTAL Grey Card */}
            <div className="mt-[25px] bg-[#E7E4E1] py-[22px] pl-[206px] pr-[24px] text-[12px] text-[#231F20]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Sub Total</span>
                  <span className="whitespace-nowrap">Rs. {formatSummaryMoney(subTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax</span>
                  <span className="whitespace-nowrap">Rs. {formatSummaryMoney(tax)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span className="whitespace-nowrap">Rs. {formatSummaryMoney(shipping)}</span>
                </div>
              </div>

              <div className="my-[14px] h-[0.75px] bg-[#231F20]/80 w-full" />

              <div className="flex items-center justify-between font-bold text-[#010202] text-[12.5px]">
                <span>TOTAL</span>
                <span className="whitespace-nowrap">Rs. {formatSummaryMoney(grandTotal)}</span>
              </div>

              {showPaymentSummary && (
                <div className="mt-3 pt-2.5 border-t border-[#231F20]/20 space-y-1.5 text-[11px] text-[#4B4442]">
                  <div className="flex items-center justify-between">
                    <span>Advance Paid</span>
                    <span>Rs. {formatSummaryMoney(advancePaid)}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold text-[#6D1C29]">
                    <span>Balance Due</span>
                    <span>Rs. {formatSummaryMoney(balanceDue)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Thank-You Signature & Gold Accent Strip */}
      <div className="relative z-10 mt-auto">
        <div className="px-[42px] pt-[74px] pb-[34px]">
          <p
            className="text-[38px] leading-[0.84] text-[#6D1C29]"
            style={{ fontFamily: 'var(--font-invoice-script), "Sacramento", cursive' }}
          >
            Thank you for making our handmade creations
            <br />a part of your world...
          </p>
        </div>

        {/* Full-Width Peach-Gold Bottom Bar */}
        <div
          className="w-full h-[22px] bg-[#FED69D]"
          style={{ backgroundColor: '#FED69D' }}
        />
      </div>
    </div>
  );
}
