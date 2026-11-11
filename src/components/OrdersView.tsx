'use client';

import React, { useState } from 'react';
import { Order, OrderStatus } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { Plus, Trash2, FileText, CheckCircle, Clock, Truck, Sparkles } from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  orderStatuses: string[];
  onOpenNewOrder: () => void;
  onDeleteOrder: (id: string) => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onSelectOrderForInvoice: (order: Order) => void;
}

export default function OrdersView({
  orders,
  orderStatuses,
  onOpenNewOrder,
  onDeleteOrder,
  onUpdateStatus,
  onSelectOrderForInvoice,
}: OrdersViewProps) {
  const [filter, setFilter] = useState<'All' | OrderStatus>('All');

  const filteredOrders = filter === 'All'
    ? orders
    : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Orders Studio
          </h2>
          <p className="text-xs text-[#7A6E6E]">
            {orders.length} records in this workspace — track bespoke crafting & delivery
          </p>
        </div>

        <button
          onClick={onOpenNewOrder}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide transition shadow-sm"
        >
          <Plus size={16} />
          <span>+ Add order</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        {['All', ...orderStatuses].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition whitespace-nowrap ${
              filter === status
                ? 'bg-[#541523] text-white border-[#541523]'
                : 'bg-white text-[#635B5B] border-[#E8DDCF] hover:bg-[#FAF6F0]'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-[#F2EBE0]">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#8C7D7D]">
              No orders found matching status &quot;{filter}&quot;.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF6F0]/60 transition"
              >
                {/* Left: Number & Customer Info */}
                <div className="flex items-start space-x-4">
                  <span className="font-mono text-xs font-bold text-[#8F243C] bg-[#FAF0E6] px-2.5 py-1.5 rounded-md border border-[#EBDCCB]">
                    {order.orderNumber}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-[#2C181B]">
                        {order.customerName}
                      </span>
                      {order.occasion && (
                        <span className="text-[10px] bg-[#F2EBE0] text-[#541523] px-2 py-0.5 rounded-full font-medium">
                          {order.occasion}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#7A6E6E] mt-0.5">
                      {order.items.map((i) => `${i.productName} (Qty: ${i.quantity})`).join(', ')}
                    </div>
                    {order.targetDeliveryDate && (
                      <div className="text-[11px] text-[#A67E1F] flex items-center space-x-1 mt-1">
                        <Clock size={12} />
                        <span>Target: {order.targetDeliveryDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Payment, Status selector, Invoice & Delete */}
                <div className="flex flex-wrap items-center gap-4 justify-between md:justify-end">
                  {/* Amount Breakdown */}
                  <div className="text-right">
                    <div className="font-serif font-bold text-[#2C181B] text-base">
                      {formatINR(order.totalAmount)}
                    </div>
                    <div className="text-[11px] text-[#7A6E6E]">
                      Advance: <span className="text-emerald-700 font-semibold">{formatINR(order.advancePaid)}</span>
                      {order.balanceDue > 0 && (
                        <span className="text-amber-700 ml-1">| Due: {formatINR(order.balanceDue)}</span>
                      )}
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={order.status}
                    onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                    aria-label={`Update status for order ${order.orderNumber}`}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border focus:outline-none transition ${
                      order.status === 'In Production' || order.status === 'Production'
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : order.status === 'Ready'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : order.status === 'New' || order.status === 'Inquiry'
                        ? 'bg-blue-50 text-blue-900 border-blue-300'
                        : order.status === 'Cancelled'
                        ? 'bg-rose-50 text-rose-900 border-rose-300'
                        : 'bg-stone-50 text-stone-800 border-stone-300'
                    }`}
                  >
                    {(orderStatuses.includes(order.status)
                      ? orderStatuses
                      : [order.status, ...orderStatuses]
                    ).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  {/* Invoice Generator Button */}
                  <button
                    onClick={() => onSelectOrderForInvoice(order)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md border border-[#D9C9B4] text-xs font-medium text-[#541523] bg-white hover:bg-[#F2EBE0] transition"
                    title="Generate printable invoice"
                  >
                    <FileText size={14} />
                    <span>Invoice</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDeleteOrder(order.id)}
                    className="text-stone-400 hover:text-rose-700 transition p-1"
                    title="Delete order"
                    aria-label={`Delete order ${order.orderNumber}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
