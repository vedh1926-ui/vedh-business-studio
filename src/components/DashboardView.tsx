'use client';

import React from 'react';
import { Order, Product, InventoryItem, ActiveTab } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { ArrowUpRight, AlertTriangle, PackageCheck, Clock, Sparkles } from 'lucide-react';

interface DashboardViewProps {
  orders: Order[];
  products: Product[];
  inventory: InventoryItem[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewOrder: () => void;
  onOpenNewStock: () => void;
  onSelectOrderForInvoice: (order: Order) => void;
}

export default function DashboardView({
  orders,
  products,
  inventory,
  setActiveTab,
  onOpenNewOrder,
  onOpenNewStock,
  onSelectOrderForInvoice,
}: DashboardViewProps) {
  // Calculate metrics
  const totalOrderValue = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalReceived = orders.reduce((acc, curr) => acc + curr.advancePaid, 0);
  // Rough expenses or recorded
  const totalExpenses = 15450; 
  const grossPosition = totalReceived - totalExpenses;

  // Active orders in motion
  const ordersInMotion = orders.filter((o) => o.status === 'Production' || o.status === 'Ready' || o.status === 'Inquiry');

  // Low stock items
  const lowStockItems = inventory.filter((item) => item.stock <= item.reorderLevel);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#FAF5EE] via-[#FDFBF8] to-[#FAF5EE] border border-[#E8DDCF] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#8F243C] mb-1">
            <Sparkles size={14} className="text-[#C69C31]" />
            <span>Artisanal Heritage & Studio Overview</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C181B] tracking-tight">
            Good morning, Vedh.
          </h2>
          <p className="mt-2 text-sm text-[#635B5B]">
            Manage your Vedh records, track bespoke orders, monitor artisanal materials, and issue branded invoices.
          </p>
        </div>
      </div>

      {/* 4 Core Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Order value */}
        <div className="bg-white border border-[#E8DDCF] rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="text-xs font-medium text-[#7A6E6E] tracking-wide">Order value</div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-[#2C181B]">
            {formatINR(totalOrderValue)}
          </div>
          <div className="mt-1 text-xs text-[#8C7D7D] flex items-center justify-between">
            <span>All recorded orders</span>
            <span className="text-[#8F243C] font-medium">{orders.length} orders</span>
          </div>
        </div>

        {/* Customer payments */}
        <div className="bg-white border border-[#E8DDCF] rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="text-xs font-medium text-[#7A6E6E] tracking-wide">Customer payments</div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-emerald-800">
            {formatINR(totalReceived)}
          </div>
          <div className="mt-1 text-xs text-[#8C7D7D] flex items-center justify-between">
            <span>Money received</span>
            <span className="text-emerald-700 font-medium">Verified</span>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white border border-[#E8DDCF] rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="text-xs font-medium text-[#7A6E6E] tracking-wide">Expenses</div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-[#8F243C]">
            {formatINR(totalExpenses)}
          </div>
          <div className="mt-1 text-xs text-[#8C7D7D] flex items-center justify-between">
            <span>Money spent</span>
            <span className="text-amber-700 font-medium">Materials & Boxes</span>
          </div>
        </div>

        {/* Gross position */}
        <div className="bg-white border border-[#E8DDCF] rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="text-xs font-medium text-[#7A6E6E] tracking-wide">Gross position</div>
          <div className={`mt-2 text-2xl sm:text-3xl font-serif font-bold ${grossPosition >= 0 ? 'text-emerald-800' : 'text-[#8F243C]'}`}>
            {formatINR(grossPosition)}
          </div>
          <div className="mt-1 text-xs text-[#8C7D7D]">
            Received less expenses
          </div>
        </div>
      </div>

      {/* Two Column Section: Orders In Motion & Stock Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Orders in motion (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2C181B]">
                Orders in motion
              </h3>
              <p className="text-xs text-[#7A6E6E]">
                {ordersInMotion.length} currently tracked in workshop
              </p>
            </div>
            <button
              onClick={onOpenNewOrder}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-medium transition"
            >
              <span>+ New order</span>
            </button>
          </div>

          <div className="divide-y divide-[#F2EBE0] overflow-x-auto">
            {ordersInMotion.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8C7D7D]">
                No active orders in production.
              </div>
            ) : (
              ordersInMotion.map((order) => (
                <div
                  key={order.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF6F0]/60 px-2 rounded-lg transition"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-semibold text-[#8F243C] bg-[#FAF0E6] px-2 py-1 rounded">
                      {order.orderNumber}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-[#2C181B]">
                        {order.customerName}
                      </div>
                      <div className="text-xs text-[#7A6E6E]">
                        {order.items.map((i) => `${i.productName} × ${i.quantity}`).join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 justify-between sm:justify-end">
                    <span className="text-sm font-semibold font-serif text-[#2C181B]">
                      {formatINR(order.totalAmount)}
                    </span>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        order.status === 'Production'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : order.status === 'Ready'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {order.status}
                    </span>

                    <button
                      onClick={() => onSelectOrderForInvoice(order)}
                      className="text-xs text-[#8F243C] hover:underline font-medium"
                      title="Generate or view Invoice"
                    >
                      Invoice
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#F2EBE0] text-right">
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs text-[#8F243C] font-semibold hover:underline inline-flex items-center space-x-1"
            >
              <span>View all orders</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Column: Stock Attention */}
        <div className="bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#2C181B]">
                  Stock attention
                </h3>
                <p className="text-xs text-[#7A6E6E]">Items to review</p>
              </div>
              <button
                onClick={onOpenNewStock}
                className="px-3 py-1.5 rounded-lg border border-[#D9C9B4] text-xs font-medium text-[#423A3A] bg-[#FAF6F0] hover:bg-[#F0EAE1] transition"
              >
                + Add stock
              </button>
            </div>

            <div className="space-y-3">
              {lowStockItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-emerald-700 bg-emerald-50 rounded-lg">
                  All inventory healthy. No reorders needed!
                </div>
              ) : (
                lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#FAF5EE] border border-[#EBDCCB] rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#2C181B]">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-[#7A6E6E]">
                        <span className="font-semibold text-rose-700">{item.stock} left</span> — reorder at {item.reorderLevel}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      Low
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Traditional Craft Reminder Quote */}
          <div className="mt-6 pt-4 border-t border-[#F2EBE0] text-center">
            <p className="text-[11px] italic text-[#8F243C] font-serif">
              "Keeping Indian tradition alive through designer artisan pieces."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
