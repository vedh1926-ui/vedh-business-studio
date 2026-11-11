'use client';

import React, { useState } from 'react';
import { HistoryLog } from '@/lib/types';
import { History as HistoryIcon, Clock } from 'lucide-react';

interface HistoryViewProps {
  logs: HistoryLog[];
}

export default function HistoryView({ logs }: HistoryViewProps) {
  const [filter, setFilter] = useState<HistoryLog['category']>('All');

  const filteredLogs = filter === 'All'
    ? logs
    : logs.filter((log) => log.category === filter);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
          History
        </h2>
        <p className="text-xs text-[#7A6E6E]">
          Your business memory, organised by category — complete audit log of products, orders, and payments.
        </p>
      </div>

      {/* Main Container matching page 11 */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        {/* Category Filter Pills matching screenshot */}
        <div className="inline-flex rounded-md border border-[#D9C9B4] bg-[#FAF5EE] p-0.5 text-xs mb-6 overflow-x-auto max-w-full">
          {(['All', 'Product', 'Order', 'Expense', 'Payment', 'Customer', 'Master List'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                filter === cat
                  ? 'bg-white text-[#541523] shadow-sm font-semibold'
                  : 'text-[#635B5B] hover:text-[#2C181B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Logs Feed */}
        <div className="border border-[#E8DDCF] rounded-xl bg-[#FCFAF7] p-4 divide-y divide-[#F2EBE0] text-xs font-mono">
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-[#8C7D7D]">
              No history recorded for category &quot;{filter}&quot;.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="py-2.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[#2C181B]"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#8F243C]">
                    {log.category}:
                  </span>
                  <span className="font-sans text-[#2C181B]">
                    {log.description}
                  </span>
                </div>

                <span className="text-[10px] text-[#8C7D7D] shrink-0 font-sans flex items-center space-x-1">
                  <Clock size={11} />
                  <span>{log.timestamp}</span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
