'use client';

import React, { useState, useEffect } from 'react';
import { InventoryItem } from '@/lib/types';
import { X, Layers, Tag } from 'lucide-react';

interface NewStockModalProps {
  initialItem?: InventoryItem | null;
  categories?: string[];
  units?: string[];
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id' | 'status'>, existingId?: string) => void;
}

export default function NewStockModal({
  initialItem = null,
  categories = [
    'Packaging',
    'Fabric',
    'Paints',
    'Prints / Stickers',
    'Wax / Candles',
    'Candle Moulds',
    'Silicon Moulds',
    'Resin Supplies',
    'Resin Mould',
    'Art Supplies',
    'Flower Petals',
    'Artificial Flowers',
    'Base Board / MDF',
    'Metal Holders',
    'Candle Holders',
    'Kundan / Stones / Beads',
    'Threads / Rolls',
    'Adhesives',
    'Powders / Colours',
    'Tools',
    'Other',
  ],
  units = ['pcs', 'g', 'kg', 'ml', 'm', 'roll', 'set', 'inch', 'cm', 'pack', 'box', 'can', 'sheet'],
  onClose,
  onSave,
}: NewStockModalProps) {
  const isEditing = Boolean(initialItem);

  const [name, setName] = useState(initialItem?.name || '');
  const [type, setType] = useState<InventoryItem['type']>(initialItem?.type || 'Raw Material');
  const [category, setCategory] = useState<string>(
    initialItem?.category || (categories.includes('Packaging') ? 'Packaging' : categories[0] || 'Packaging')
  );
  const [stock, setStock] = useState(initialItem ? String(initialItem.stock ?? 0) : '');
  const [unit, setUnit] = useState<string>(initialItem?.unit || units[0] || 'pcs');
  const [reorderLevel, setReorderLevel] = useState(
    initialItem?.reorderLevel ? String(initialItem.reorderLevel) : '5'
  );
  const [supplier, setSupplier] = useState(initialItem?.supplier || '');
  const [avgUnitCost, setAvgUnitCost] = useState(
    initialItem?.avgUnitCost !== undefined ? String(initialItem.avgUnitCost) : ''
  );

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setType(initialItem.type);
      setCategory(initialItem.category || categories[0] || 'Packaging');
      setStock(String(initialItem.stock ?? 0));
      setUnit(initialItem.unit);
      setReorderLevel(String(initialItem.reorderLevel ?? 5));
      setSupplier(initialItem.supplier || '');
      setAvgUnitCost(initialItem.avgUnitCost !== undefined ? String(initialItem.avgUnitCost) : '');
    }
  }, [initialItem, categories]);

  // Ensure category from item is in the options list
  const allCategoryOptions = Array.from(
    new Set([category, ...categories].filter(Boolean))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedStock = parseFloat(stock);
    const parsedReorder = parseFloat(reorderLevel);
    const parsedCost = avgUnitCost.trim() ? parseFloat(avgUnitCost) : undefined;

    onSave(
      {
        name: name.trim(),
        type,
        category,
        stock: Number.isFinite(parsedStock) ? Math.max(0, parsedStock) : 0,
        unit,
        reorderLevel: Number.isFinite(parsedReorder) ? Math.max(0, parsedReorder) : 5,
        supplier: supplier.trim() || undefined,
        avgUnitCost: Number.isFinite(parsedCost) ? parsedCost : undefined,
        openingStock: initialItem?.openingStock,
        purchaseSource: initialItem?.purchaseSource,
      },
      initialItem?.id
    );

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] border border-[#E8DDCF] shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-[#FAF5EE] border-b border-[#E8DDCF] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#541523] text-white flex items-center justify-center shrink-0">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2C181B] leading-tight">
                {isEditing ? 'Edit Stock Material' : 'Add Stock / Workshop Supplies'}
              </h3>
              <p className="text-[11px] text-[#7A6E6E] mt-0.5">
                {isEditing
                  ? 'Update category, unit of measure, and stock reorder levels'
                  : 'Register a craft raw material or packaging consumable'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-[#541523] hover:bg-[#F2EBE0] rounded-lg transition"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 text-xs">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-[#423A3A] font-semibold mb-1">
              Material / Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Soy Wax Flakes, Resin Hardener, Golden Ribbon"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Material category"
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#541523]"
              >
                {allCategoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Inventory Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as InventoryItem['type'])}
                aria-label="Inventory type"
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
              >
                <option value="Raw Material">Raw Material</option>
                <option value="Packaging">Packaging</option>
                <option value="Finished Good">Finished Good</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Physical Shelf Count *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="20"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Unit of Measure
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                aria-label="Unit of measure"
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Reorder Threshold
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
              <span className="text-[10px] text-[#7A6E6E] mt-0.5 block">
                Alerts when stock drops to or below this
              </span>
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Avg Landed Cost (₹/unit)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="₹ per unit"
                value={avgUnitCost}
                onChange={(e) => setAvgUnitCost(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
              <span className="text-[10px] text-[#7A6E6E] mt-0.5 block">
                Syncs automatically from Purchases
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[#423A3A] font-semibold mb-1">
              Supplier / Source (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Begum Bazaar, Amazon, Luxury Deco"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
            />
          </div>
          </div>

          <div className="flex justify-end space-x-3 px-6 py-4 bg-[#FAF5EE]/60 border-t border-[#E8DDCF] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D9C9B4] rounded-lg text-[#635B5B] bg-white hover:bg-[#FAF6F0] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#541523] text-white rounded-lg font-semibold hover:bg-[#6E1C30] transition shadow-sm"
            >
              {isEditing ? 'Save Material Changes' : 'Record Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
