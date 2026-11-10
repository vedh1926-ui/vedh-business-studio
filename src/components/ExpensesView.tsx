'use client';

import React from 'react';
import { Expense } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { Plus, Receipt, Calendar, CreditCard } from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  onOpenNewExpense: () => void;
  onDeleteExpense: (id: string) => void;
}

export default function ExpensesView({
  expenses,
  onOpenNewExpense,
  onDeleteExpense,
}: ExpensesViewProps) {
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Expenses
          </h2>
          <p className="text-xs text-[#7A6E6E]">
            {expenses.length} records in this workspace — track raw materials, wax, resin, and packaging costs
          </p>
        </div>

        <button
          onClick={onOpenNewExpense}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide transition shadow-sm"
        >
          <Plus size={16} />
          <span>+ Add expense</span>
        </button>
      </div>

      {/* Expense Total Card */}
      <div className="bg-white border border-[#E8DDCF] rounded-xl p-5 max-w-sm shadow-sm">
        <div className="text-xs text-[#7A6E6E]">Total Workshop Expenses</div>
        <div className="text-3xl font-serif font-bold text-[#8F243C] mt-1">
          {formatINR(totalExpenses)}
        </div>
        <div className="text-[11px] text-[#8C7D7D] mt-0.5">
          Recorded for raw materials &amp; supplies
        </div>
      </div>

      {/* Expenses Table matching page 5 style */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
        {expenses.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#8C7D7D]">
            No records yet. Click &quot;+ Add expense&quot; to log your first workshop expense.
          </div>
        ) : (
          <div className="divide-y divide-[#F2EBE0]">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF6F0]/60 transition"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] border border-[#E8DDCF] flex items-center justify-center text-[#8F243C]">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#2C181B]">
                      {expense.title}
                    </div>
                    <div className="text-xs text-[#7A6E6E] flex items-center space-x-2 mt-0.5">
                      <span className="font-medium text-[#8F243C]">{expense.category}</span>
                      {expense.supplierName && <span>• {expense.supplierName}</span>}
                      <span>• {expense.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6 justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="font-serif font-bold text-[#8F243C] text-base">
                      {formatINR(expense.amount)}
                    </div>
                    <div className="text-[10px] text-[#7A6E6E] font-mono">
                      {expense.paymentMode}
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteExpense(expense.id)}
                    className="text-xs text-[#8F243C] hover:underline font-medium hover:text-rose-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
