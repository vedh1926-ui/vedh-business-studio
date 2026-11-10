'use client';

import React from 'react';
import { Order } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { FileText, Printer, Share2, CheckCircle2, Clock } from 'lucide-react';

interface InvoicesViewProps {
  orders: Order[];
  onSelectOrderForInvoice: (order: Order) => void;
}

export default function InvoicesView({ orders, onSelectOrderForInvoice }: InvoicesViewProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Invoices &amp; Billing
          </h2>
          <p className="text-xs text-[#7A6E6E]">
            Generate branded PDF invoices, track advances, and share instantly over WhatsApp
          </p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-[#F2EBE0]">
          {orders.map((order) => {
            const invoiceNumber = `INV-${order.orderNumber.replace('#', '')}`;
            const isFullyPaid = order.balanceDue === 0;

            return (
              <div
                key={order.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF6F0]/60 transition"
              >
                {/* Left: Invoice info */}
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] border border-[#E8DDCF] flex items-center justify-center text-[#541523]">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-[#541523]">
                        {invoiceNumber}
                      </span>
                      <span className="text-xs font-semibold text-[#2C181B]">
                        • {order.customerName}
                      </span>
                    </div>
                    <div className="text-xs text-[#7A6E6E] mt-0.5">
                      Order: {order.orderNumber} • Date: {order.createdAt}
                    </div>
                  </div>
                </div>

                {/* Middle & Right: Payment Status, Amounts, Action Buttons */}
                <div className="flex items-center space-x-6 justify-between md:justify-end">
                  <div className="text-right">
                    <div className="font-serif font-bold text-[#2C181B] text-base">
                      {formatINR(order.totalAmount)}
                    </div>
                    <div className="text-[11px]">
                      {isFullyPaid ? (
                        <span className="text-emerald-700 font-medium">Fully Paid</span>
                      ) : (
                        <span className="text-amber-700 font-medium">
                          Bal: {formatINR(order.balanceDue)}
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
                    {isFullyPaid ? 'Paid' : 'Partial'}
                  </span>

                  <button
                    onClick={() => onSelectOrderForInvoice(order)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold transition"
                  >
                    <FileText size={14} />
                    <span>View &amp; Print</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
