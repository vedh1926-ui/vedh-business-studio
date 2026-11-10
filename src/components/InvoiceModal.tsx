'use client';

import React from 'react';
import Image from 'next/image';
import { Order } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { X, Printer, Share2, Download, CheckCircle } from 'lucide-react';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export default function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  if (!order) return null;

  const invoiceNumber = `INV-${order.orderNumber.replace('#', '')}`;
  const invoiceDate = order.createdAt;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hello ${order.customerName},\n\nThank you for choosing VEDH Handicrafts! Here is your invoice summary for ${order.orderNumber}:\n\nTotal Amount: ${formatINR(order.totalAmount)}\nAdvance Received: ${formatINR(order.advancePaid)}\nBalance Due: ${formatINR(order.balanceDue)}\nStatus: ${order.status}\n\nWe are lovingly handcrafting your pieces.\nWarm regards,\nVEDH Business Studio`
    );
    window.open(`https://wa.me/${order.customerPhone?.replace(/[^0-9]/g, '') || ''}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E8DDCF] overflow-hidden my-8">
        {/* Modal Top Actions (no-print) */}
        <div className="no-print bg-[#FAF5EE] border-b border-[#E8DDCF] px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-[#541523] text-sm">
              Invoice #{invoiceNumber}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              Ready to Share
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleWhatsAppShare}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition"
            >
              <Share2 size={13} />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold transition"
            >
              <Printer size={13} />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-[#F2EBE0] transition"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="p-8 sm:p-10 bg-white text-[#2C181B]" id="printable-invoice">
          {/* Header with Logo */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-[#E8DDCF] gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#D4AF37]/60 shadow-sm shrink-0 bg-[#3D0E18]">
                <Image
                  src="/vedh-logo.jpg"
                  alt="VEDH Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-[#541523] tracking-wide">
                  VEDH
                </h1>
                <p className="text-xs text-[#8F243C] font-medium uppercase tracking-wider">
                  Luxury Handicrafts &amp; Return Gifts
                </p>
                <p className="text-[11px] text-[#7A6E6E] italic mt-0.5">
                  &quot;Preserving traditions with designer art&quot;
                </p>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-xl font-serif font-bold text-[#2C181B]">
                TAX INVOICE
              </div>
              <div className="text-xs text-[#7A6E6E] mt-1">
                Invoice No: <span className="font-mono font-bold text-[#541523]">{invoiceNumber}</span>
              </div>
              <div className="text-xs text-[#7A6E6E]">
                Date: {invoiceDate}
              </div>
              {order.targetDeliveryDate && (
                <div className="text-xs text-[#A67E1F] font-medium">
                  Delivery Target: {order.targetDeliveryDate}
                </div>
              )}
            </div>
          </div>

          {/* Billed To Section */}
          <div className="grid grid-cols-2 gap-6 my-6 text-xs">
            <div>
              <div className="font-semibold uppercase tracking-wider text-[#8F243C] text-[10px] mb-1">
                Billed To:
              </div>
              <div className="text-sm font-bold text-[#2C181B]">
                {order.customerName}
              </div>
              {order.customerPhone && (
                <div className="text-[#635B5B]">{order.customerPhone}</div>
              )}
              {order.customerEmail && (
                <div className="text-[#635B5B]">{order.customerEmail}</div>
              )}
              {order.occasion && (
                <div className="mt-1 text-[11px] text-[#8F243C] font-medium">
                  Occasion: {order.occasion}
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="font-semibold uppercase tracking-wider text-[#8F243C] text-[10px] mb-1">
                Issued By:
              </div>
              <div className="text-sm font-bold text-[#2C181B]">
                VEDH Business Studio
              </div>
              <div className="text-[#635B5B]">Artisanal Design Studio</div>
              <div className="text-[#635B5B]">India</div>
              <div className="text-[11px] text-[#8F243C]">GPay / PhonePe / UPI Accepted</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-[#E8DDCF] rounded-xl overflow-hidden my-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] text-[#541523] border-b border-[#E8DDCF] font-semibold">
                <tr>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EBE0]">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#FCFAF7]">
                    <td className="p-3">
                      <div className="font-semibold text-[#2C181B]">{item.productName}</div>
                      {order.notes && idx === 0 && (
                        <div className="text-[10px] text-[#7A6E6E] italic mt-0.5">
                          Note: {order.notes}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center font-medium">{item.quantity}</td>
                    <td className="p-3 text-right font-medium">{formatINR(item.unitPrice)}</td>
                    <td className="p-3 text-right font-bold font-serif text-[#2C181B]">
                      {formatINR(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t border-[#E8DDCF]">
            <div className="text-xs text-[#7A6E6E] max-w-xs space-y-1">
              <div className="font-semibold text-[#2C181B]">Terms &amp; Craftsmanship Note:</div>
              <p className="text-[11px] leading-relaxed">
                All VEDH creations are uniquely handmade. Minor variations in texture, shade, and wax marbling celebrate the beauty of handcrafted heritage art.
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-[#635B5B]">
                <span>Subtotal:</span>
                <span className="font-semibold text-[#2C181B]">{formatINR(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-800">
                <span>Advance Paid:</span>
                <span className="font-semibold">{formatINR(order.advancePaid)}</span>
              </div>
              <div className="flex justify-between text-[#541523] pt-2 border-t border-[#E8DDCF] font-serif text-base font-bold">
                <span>Balance Due:</span>
                <span>{formatINR(order.balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* Footer Signature */}
          <div className="mt-10 pt-6 border-t border-[#E8DDCF] flex items-center justify-between text-[11px] text-[#8C7D7D]">
            <span>Thank you for supporting authentic artisanal handicrafts!</span>
            <span className="font-serif font-bold text-[#541523]">Authorized Signature</span>
          </div>
        </div>
      </div>
    </div>
  );
}
