'use client';

import React from 'react';
import { Order, Product, Expense, Payment } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { BarChart3, TrendingUp, PieChart, Sparkles } from 'lucide-react';

interface ReportsViewProps {
  orders: Order[];
  products: Product[];
  expenses: Expense[];
  payments: Payment[];
}

export default function ReportsView({
  orders,
  products,
  expenses,
  payments,
}: ReportsViewProps) {
  const totalOrdersVal = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalPaymentsRec = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netCashPosition = totalPaymentsRec - totalExpenses;

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
          Reports &amp; Analytics
        </h2>
        <p className="text-xs text-[#7A6E6E]">
          Understand how Vedh is performing — financial health, sales volume, and product profitability
        </p>
      </div>

      {/* 4 Cards matching page 9 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8DDCF] rounded-xl p-5 shadow-sm">
          <div className="text-xs text-[#7A6E6E]">Orders created</div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-[#2C181B]">
            {formatINR(totalOrdersVal)}
          </div>
          <div className="mt-1 text-xs text-[#8C7D7D]">Sales booked</div>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-xl p-5 shadow-sm">
          <div className="text-xs text-[#7A6E6E]">Payments received</div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-emerald-800">
            {formatINR(totalPaymentsRec)}
          </div>
          <div className="mt-1 text-xs text-[#8C7D7D]">Actual cash in</div>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-xl p-5 shadow-sm">
          <div className="text-xs text-[#7A6E6E]">Expenses recorded</div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-[#8F243C]">
            {formatINR(totalExpenses)}
          </div>
          <div className="mt-1 text-xs text-[#8C7D7D]">Actual cash out</div>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-xl p-5 shadow-sm">
          <div className="text-xs text-[#7A6E6E]">Net cash position</div>
          <div className={`mt-2 text-2xl sm:text-3xl font-serif font-bold ${netCashPosition >= 0 ? 'text-emerald-800' : 'text-[#8F243C]'}`}>
            {formatINR(netCashPosition)}
          </div>
          <div className="mt-1 text-xs text-[#8C7D7D]">Received less spent</div>
        </div>
      </div>

      {/* Two Panes: Expense Breakdown & Product Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expense breakdown */}
        <div className="bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-[#2C181B] mb-2">
            Expense breakdown
          </h3>
          <p className="text-xs text-[#7A6E6E] mb-6">
            Workshop procurement distribution
          </p>

          <div className="space-y-4 text-xs">
            {Object.keys(expensesByCategory).length === 0 ? (
              <div className="py-8 text-center text-[#8C7D7D]">
                Record expenses to see their breakdown.
              </div>
            ) : (
              Object.entries(expensesByCategory).map(([cat, amount]) => {
                const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-[#2C181B] font-medium">
                      <span>{cat}</span>
                      <span className="font-bold">{formatINR(amount)} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-[#FAF0E6] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#8F243C] h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Product performance */}
        <div className="bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-[#2C181B] mb-2">
            Product performance
          </h3>
          <p className="text-xs text-[#7A6E6E] mb-6">
            Revenue generated by collection
          </p>

          <div className="space-y-4 text-xs divide-y divide-[#F2EBE0]">
            {products.map((prod) => {
              // Calculate revenue from orders for this product
              const revenue = orders.reduce((acc, order) => {
                const item = order.items.find((i) => i.productId === prod.id || i.productName === prod.name);
                return acc + (item ? item.quantity * item.unitPrice : 0);
              }, 0);

              return (
                <div key={prod.id} className="pt-3 first:pt-0 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#2C181B]">{prod.name}</div>
                    <div className="text-[11px] text-[#7A6E6E]">Catalog price: {formatINR(prod.price)}</div>
                  </div>
                  <div className="font-serif font-bold text-[#541523] text-sm">
                    {formatINR(revenue)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
