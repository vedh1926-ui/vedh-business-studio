'use client';

import React, { useState } from 'react';
import { InventoryItem } from '@/lib/types';
import { X } from 'lucide-react';

interface NewStockModalProps {
  categories?: string[];
  units?: string[];
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id' | 'status'>) => void;
}

export default function NewStockModal({
  categories = ['Wax / Candles', 'Packaging', 'Resin Supplies', 'Fabric', 'Other'],
  units = ['pcs', 'g', 'kg', 'ml', 'm', 'roll', 'set', 'inch', 'cm', 'pack'],
  onClose,
  onSave,
}: NewStockModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<InventoryItem['type']>('Raw Material');
  const [category, setCategory] = useState<string>(categories[0] || 'Wax / Candles');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState<string>(units[0] || 'pcs');
  const [reorderLevel, setReorderLevel] = useState('10');
  const [supplier, setSupplier] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name,
      type,
      category,
      stock: parseInt(stock) || 0,
      unit,
      reorderLevel: parseInt(reorderLevel) || 5,
      supplier,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#E8DDCF] shadow-2xl overflow-hidden">
        <div className="bg-[#FAF5EE] border-b border-[#E8DDCF] px-6 py-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-[#2C181B]">
            Add Stock / Workshop Supplies
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[#423A3A] font-semibold mb-1">
              Item Name *
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

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Material Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Material category"
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Quantity *
              </label>
              <input
                type="number"
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
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Supplier Vendor (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Vedic Aromas"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-[#F2EBE0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D9C9B4] rounded-lg text-[#635B5B] hover:bg-[#FAF6F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#541523] text-white rounded-lg font-semibold hover:bg-[#6E1C30]"
            >
              Record Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
