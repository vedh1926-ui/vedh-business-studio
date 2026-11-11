'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/types';
import { X } from 'lucide-react';

interface NewProductModalProps {
  categories?: string[];
  collections?: string[];
  units?: string[];
  initialProduct?: Product | null;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'status'>, existingId?: string) => void;
}

export default function NewProductModal({
  categories = ['Diyas', 'Candles', 'Home Decor', 'Festive Hampers', 'Wax / Candles', 'Packaging', 'Other'],
  collections = [
    'Lotus Petals Diya',
    'Zari Bloom',
    'Shells Two Layers',
    'Pearls and Flower Diya',
    'Fabric Theme Diya',
    'Hand-painted Terracotta Diya',
    'Diwali Hamper',
    'GLASS',
    'Pooja & Urli',
    'Custom Assorted',
  ],
  units = ['set', 'pcs', 'pack', 'g', 'kg', 'ml', 'm', 'roll'],
  initialProduct = null,
  onClose,
  onSave,
}: NewProductModalProps) {
  const [name, setName] = useState(initialProduct?.name || '');
  const [collection, setCollection] = useState(
    initialProduct?.collection || collections[0] || 'Lotus Petals Diya'
  );
  const [category, setCategory] = useState<Product['category']>(
    initialProduct?.category || categories[0] || 'Diyas'
  );
  const [unit, setUnit] = useState<string>(initialProduct?.unit || units[0] || 'set');
  const [price, setPrice] = useState(
    initialProduct ? String(initialProduct.price) : ''
  );
  const [estimatedCost, setEstimatedCost] = useState(
    initialProduct ? String(initialProduct.estimatedCost || '') : ''
  );
  const [stock, setStock] = useState(
    initialProduct ? String(initialProduct.stock) : '0'
  );
  const [reorderLevel, setReorderLevel] = useState(
    initialProduct ? String(initialProduct.reorderLevel) : '5'
  );
  const [description, setDescription] = useState(initialProduct?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(
      {
        name: name.trim(),
        category,
        collection: collection.trim() || category,
        unit,
        price: parseFloat(price) || 0,
        estimatedCost: parseFloat(estimatedCost) || 0,
        stock: parseInt(stock, 10) || 0,
        reorderLevel: parseInt(reorderLevel, 10) || 5,
        description: description.trim() || undefined,
      },
      initialProduct?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#E8DDCF] shadow-2xl overflow-hidden">
        <div className="bg-[#FAF5EE] border-b border-[#E8DDCF] px-6 py-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-[#2C181B]">
            {initialProduct ? 'Edit Product / Design' : 'Add New Product / Design'}
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
              Product Title / Model *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lotus Petals Diya (Set of 2) EMERALD"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Collection
              </label>
              <input
                list="vedh-collection-options"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                placeholder="e.g. Zari Bloom"
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
              <datalist id="vedh-collection-options">
                {collections.map((col) => (
                  <option key={col} value={col} />
                ))}
              </datalist>
            </div>

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
                {(categories.includes(category) ? categories : [category, ...categories]).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                required
                placeholder="300"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
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

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Est. Cost (₹)
              </label>
              <input
                type="number"
                placeholder="Auto from Recipe"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Finished Stock Count
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
              Craft / Customisation Notes
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
              {initialProduct ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
