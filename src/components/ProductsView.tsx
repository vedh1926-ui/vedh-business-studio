'use client';

import React from 'react';
import { Product } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { Plus, Trash2, Tag, Percent } from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  onOpenNewProduct: () => void;
  onDeleteProduct: (id: string) => void;
}

export default function ProductsView({
  products,
  onOpenNewProduct,
  onDeleteProduct,
}: ProductsViewProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Products
          </h2>
          <p className="text-xs text-[#7A6E6E]">
            {products.length} records in this workspace — handcrafted catalog & pricing
          </p>
        </div>

        <button
          onClick={onOpenNewProduct}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide transition shadow-sm"
        >
          <Plus size={16} />
          <span>+ Add product</span>
        </button>
      </div>

      {/* Products List matching prototype styling */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-[#F2EBE0]">
          {products.map((product) => {
            const margin = product.price > 0 && product.estimatedCost > 0
              ? Math.round(((product.price - product.estimatedCost) / product.price) * 100)
              : null;

            return (
              <div
                key={product.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF6F0]/60 transition"
              >
                {/* Left: Product Name & Category */}
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] border border-[#E8DDCF] flex items-center justify-center text-[#8F243C]">
                    <Tag size={18} />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-[#2C181B]">
                      {product.name}
                    </div>
                    <div className="text-xs text-[#7A6E6E] flex items-center space-x-2">
                      <span className="font-medium text-[#8F243C]">{product.category}</span>
                      {product.estimatedCost > 0 && (
                        <span>• Cost: {formatINR(product.estimatedCost)}</span>
                      )}
                      {margin !== null && (
                        <span className="text-emerald-700 font-medium">({margin}% margin)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Price, Stock, Status Badge, Delete */}
                <div className="flex items-center space-x-6 justify-between md:justify-end">
                  <div className="font-serif font-bold text-base text-[#2C181B]">
                    {formatINR(product.price)}
                  </div>

                  <div className="text-xs text-[#635B5B] min-w-[70px]">
                    <span className="font-semibold text-[#2C181B]">{product.stock}</span>{' '}
                    {product.unit ? `${product.unit} in stock` : 'in stock'}
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      product.status === 'Healthy'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : product.status === 'Low'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {product.status}
                  </span>

                  <button
                    onClick={() => onDeleteProduct(product.id)}
                    className="text-xs text-[#8F243C] hover:underline font-medium hover:text-rose-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
