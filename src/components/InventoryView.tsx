'use client';

import React, { useState } from 'react';
import { InventoryItem } from '@/lib/types';
import { Plus, AlertCircle, CheckCircle2, Boxes } from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onOpenNewStock: () => void;
  onAdjustStock: (id: string, delta: number) => void;
}

export default function InventoryView({
  inventory,
  onOpenNewStock,
  onAdjustStock,
}: InventoryViewProps) {
  const [tab, setTab] = useState<'All' | 'Finished Good' | 'Raw Material' | 'Packaging'>('All');

  const filteredItems = tab === 'All'
    ? inventory
    : inventory.filter((item) => item.type === tab);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Inventory
          </h2>
          <p className="text-xs text-[#7A6E6E]">
            {inventory.length} records in this workspace — track ready pieces and workshop supplies
          </p>
        </div>

        <button
          onClick={onOpenNewStock}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide transition shadow-sm"
        >
          <Plus size={16} />
          <span>+ Add stock</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 text-xs">
        {(['All', 'Finished Good', 'Raw Material', 'Packaging'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition ${
              tab === t
                ? 'bg-[#541523] text-white border-[#541523]'
                : 'bg-white text-[#635B5B] border-[#E8DDCF] hover:bg-[#FAF6F0]'
            }`}
          >
            {t === 'All' ? 'All Items' : t}
          </button>
        ))}
      </div>

      {/* Inventory Table matching page 4 styling */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-[#F2EBE0]">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF6F0]/60 transition"
            >
              {/* Left: Item name and type */}
              <div>
                <div className="text-sm font-semibold text-[#2C181B]">
                  {item.name}
                </div>
                <div className="text-[11px] text-[#7A6E6E] flex items-center space-x-2 mt-0.5">
                  <span className="bg-[#FAF0E6] text-[#8F243C] px-1.5 py-0.5 rounded font-medium">
                    {item.type}
                  </span>
                  {item.supplier && <span>Supplier: {item.supplier}</span>}
                </div>
              </div>

              {/* Middle & Right: Units, Reorder at X, Health Status, Quick Adjust */}
              <div className="flex items-center space-x-6 justify-between sm:justify-end">
                <div className="text-sm font-bold text-[#2C181B]">
                  {item.stock} {item.unit}
                </div>

                <div className="text-xs text-[#7A6E6E]">
                  Reorder at {item.reorderLevel}
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    item.status === 'Healthy'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {item.status}
                </span>

                {/* Quick adjustments +/- */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onAdjustStock(item.id, -1)}
                    className="w-7 h-7 rounded border border-[#E8DDCF] bg-[#FAF6F0] hover:bg-[#F2EBE0] text-xs font-bold text-[#541523] flex items-center justify-center transition"
                    title="Deduct 1"
                  >
                    -
                  </button>
                  <button
                    onClick={() => onAdjustStock(item.id, 1)}
                    className="w-7 h-7 rounded border border-[#E8DDCF] bg-[#FAF6F0] hover:bg-[#F2EBE0] text-xs font-bold text-[#541523] flex items-center justify-center transition"
                    title="Add 1"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
