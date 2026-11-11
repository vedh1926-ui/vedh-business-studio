'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/types';
import { X } from 'lucide-react';

interface NewProductModalProps {
  categories?: string[];
  units?: string[];
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'status'>) => void;
}

export default function NewProductModal({
  categories = ['Wax / Candles', 'Resin Supplies', 'Fabric', 'Packaging', 'Art Supplies', 'Other'],
  units = ['pcs', 'set', 'pack', 'g', 'kg', 'ml', 'm', 'roll', 'inch', 'cm'],
  onClose,
  onSave,
}: NewProductModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Product['category']>(categories[0] || 'Wax / Candles');
  const [unit, setUnit] = useState<string>(units[0] || 'pcs');
  const [price, setPrice] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [stock, setStock] = useState('10');
  const [reorderLevel, setReorderLevel] = useState('5');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name,
      category,
      unit,
      price: parseFloat(price) || 0,
      estimatedCost: parseFloat(estimatedCost) || 0,
      stock: parseInt(stock) || 0,
      reorderLevel: parseInt(reorderLevel) || 5,
      description,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#E8DDCF] shadow-2xl overflow-hidden">
        <div className="bg-[#FAF5EE] border-b border-[#E8DDCF] px-6 py-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-[#2C181B]">
            Add New Product / Design
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
              Product Title / Piece Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Scented Rose &amp; Soy Candle Bowl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Product category"
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                aria-label="Product unit"
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
                Selling Price (₹) *
              </label>
              <input
                type="number"
                required
                placeholder="1499"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Material Cost (₹)
              </label>
              <input
                type="number"
                placeholder="650"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Initial Stock Count
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Reorder Alert Level
              </label>
              <input
                type="number"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#423A3A] font-semibold mb-1">
              Short Description / Craft Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Pure soy wax, gold foil rim, cotton wick..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
            />
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
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
