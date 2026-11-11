'use client';

import React, { useMemo, useState } from 'react';
import {
  InventoryItem,
  Order,
  Product,
  RecipeIngredient,
} from '@/lib/types';
import {
  computeRecipeAndProductSnapshot,
  normalizeNameKey,
} from '@/lib/oprFormulas';
import { formatINR } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  products?: Product[];
  recipes?: RecipeIngredient[];
  orders?: Order[];
  adjustmentReasons?: string[];
  onOpenNewStock: () => void;
  onAdjustStock: (id: string, delta: number, reason?: string) => void;
  onUpdateInventoryMaterial?: (
    id: string,
    updates: { stock?: number; avgUnitCost?: number }
  ) => void;
}

export default function InventoryView({
  inventory,
  products = [],
  recipes = [],
  orders = [],
  adjustmentReasons = [
    'Stock count correction',
    'Breakage / wastage',
    'Sample / trial piece',
    'Gift / free item',
    'Other',
  ],
  onOpenNewStock,
  onAdjustStock,
  onUpdateInventoryMaterial,
}: InventoryViewProps) {
  const [tab, setTab] = useState<'All' | 'Finished Good' | 'Raw Material' | 'Packaging'>('All');
  const [selectedReason, setSelectedReason] = useState<string>(
    adjustmentReasons[0] || 'Stock count correction'
  );

  const snapshot = useMemo(
    () => computeRecipeAndProductSnapshot(products, recipes, orders, inventory),
    [products, recipes, orders, inventory]
  );

  const filteredItems = tab === 'All'
    ? inventory
    : inventory.filter((item) => item.type === tab);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Inventory &amp; Raw Materials
          </h2>
          <p className="text-xs text-[#7A6E6E]">
            {inventory.length} materials &amp; pieces — landed unit costs sync automatically with Recipes &amp; Product margins
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

      {/* Tabs & Active Adjustment Reason Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {(['All', 'Raw Material', 'Packaging', 'Finished Good'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg border font-medium transition whitespace-nowrap ${
                tab === t
                  ? 'bg-[#541523] text-white border-[#541523]'
                  : 'bg-white text-[#635B5B] border-[#E8DDCF] hover:bg-[#FAF6F0]'
              }`}
            >
              {t === 'All' ? 'All Items' : t}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[#7A6E6E] font-medium whitespace-nowrap">Adjustment reason:</span>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            aria-label="Stock adjustment reason"
            className="px-2.5 py-1.5 rounded-lg border border-[#D9C9B4] bg-white text-[#2C181B] font-medium focus:outline-none focus:ring-1 focus:ring-[#541523]"
          >
            {adjustmentReasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-[#F2EBE0]">
          {filteredItems.map((item) => {
            const key = normalizeNameKey(item.name);
            const reserved = snapshot.reservedByMaterialKey[key] ?? 0;
            const free = snapshot.freeByMaterialKey[key] ?? item.stock;
            return (
              <div
                key={item.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#FAF6F0]/60 transition"
              >
                {/* Left: Item name and type */}
                <div>
                  <div className="text-sm font-semibold text-[#2C181B]">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-[#7A6E6E] flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="bg-[#FAF0E6] text-[#8F243C] px-1.5 py-0.5 rounded font-medium">
                      {item.type}
                    </span>
                    {item.category && (
                      <span className="bg-[#F2EBE0] text-[#541523] px-1.5 py-0.5 rounded font-medium">
                        {item.category}
                      </span>
                    )}
                    {item.supplier && <span>Supplier: {item.supplier}</span>}
                    {item.purchaseSource && (
                      <span className="text-[#8C7D7D]">{item.purchaseSource}</span>
                    )}
                  </div>
                </div>

                {/* Middle & Right: Cost, Stock, Reserved, Status, Quick Adjust */}
                <div className="flex flex-wrap items-center gap-4 justify-between lg:justify-end">
                  {/* Avg Cost / Unit */}
                  <div className="text-xs flex items-center gap-1.5">
                    <span className="text-[#7A6E6E]">Avg ₹/{item.unit}:</span>
                    {onUpdateInventoryMaterial ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="—"
                        value={item.avgUnitCost ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = raw === '' ? undefined : Number(raw);
                          if (val === undefined || (Number.isFinite(val) && val >= 0)) {
                            onUpdateInventoryMaterial(item.id, { avgUnitCost: val });
                          }
                        }}
                        className="w-20 px-2 py-1 rounded border border-[#D9C9B4] bg-white text-right font-mono text-xs"
                      />
                    ) : (
                      <span className="font-mono font-semibold text-[#2C181B]">
                        {item.avgUnitCost !== undefined ? formatINR(item.avgUnitCost, 2) : '—'}
                      </span>
                    )}
                  </div>

                  <div className="text-right min-w-[90px]">
                    <div className="text-sm font-bold text-[#2C181B]">
                      {item.stock} {item.unit}
                    </div>
                    {reserved > 0 && (
                      <div className="text-[10px] text-[#7A6E6E]">
                        {reserved} needed · Free: {free}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-[#7A6E6E]">
                    Reorder at {item.reorderLevel}
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      item.status === 'Healthy'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : item.status === 'Critical'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.status}
                  </span>

                  {/* Quick adjustments +/- */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onAdjustStock(item.id, -1, selectedReason)}
                      className="w-7 h-7 rounded border border-[#E8DDCF] bg-[#FAF6F0] hover:bg-[#F2EBE0] text-xs font-bold text-[#541523] flex items-center justify-center transition"
                      title={`Deduct 1 (${selectedReason})`}
                    >
                      -
                    </button>
                    <button
                      onClick={() => onAdjustStock(item.id, 1, selectedReason)}
                      className="w-7 h-7 rounded border border-[#E8DDCF] bg-[#FAF6F0] hover:bg-[#F2EBE0] text-xs font-bold text-[#541523] flex items-center justify-center transition"
                      title={`Add 1 (${selectedReason})`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
