'use client';

import React, { useState } from 'react';
import { Supplier } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { Plus, Truck, Phone, Mail, MapPin, Sparkles } from 'lucide-react';

interface SuppliersViewProps {
  suppliers: Supplier[];
  categories?: string[];
  onAddSupplier: (supplier: Omit<Supplier, 'id' | 'totalOrders' | 'totalPaid'>) => void;
  onDeleteSupplier: (id: string) => void;
}

export default function SuppliersView({
  suppliers,
  categories = ['Wax / Candles', 'Resin Supplies', 'Packaging', 'Fabric', 'Other'],
  onAddSupplier,
  onDeleteSupplier,
}: SuppliersViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Supplier['category']>(categories[0] || 'Wax / Candles');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddSupplier({
      name,
      category,
      phone,
      email,
      city,
    });
    setName('');
    setPhone('');
    setEmail('');
    setCity('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#C69C31] mb-1">
            <Sparkles size={14} />
            <span>Procurement &amp; Raw Material Vendors</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Suppliers Directory
          </h2>
          <p className="text-xs text-[#7A6E6E]">
            {suppliers.length} vendors in this workspace — wax, epoxy resin, jars, packaging boxes &amp; wicks
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide transition shadow-sm"
        >
          <Plus size={16} />
          <span>+ Add supplier</span>
        </button>
      </div>

      {/* Suppliers List */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-[#F2EBE0]">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF6F0]/60 transition"
            >
              {/* Supplier Info */}
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] border border-[#E8DDCF] flex items-center justify-center text-[#541523]">
                  <Truck size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#2C181B]">
                    {sup.name}
                  </div>
                  <div className="text-xs text-[#7A6E6E] flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="bg-[#F2EBE0] text-[#541523] px-2 py-0.5 rounded text-[10px] font-semibold">
                      {sup.category}
                    </span>
                    {sup.city && (
                      <span className="flex items-center space-x-1">
                        <MapPin size={11} />
                        <span>{sup.city}</span>
                      </span>
                    )}
                    {sup.phone && (
                      <span className="flex items-center space-x-1 font-mono">
                        <Phone size={11} />
                        <span>{sup.phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Spend & Delete */}
              <div className="flex items-center space-x-6 justify-between md:justify-end">
                <div className="text-xs text-[#635B5B]">
                  <span className="font-semibold text-[#2C181B]">{sup.totalOrders}</span> orders placed
                </div>

                <div className="text-right">
                  <div className="text-xs text-[#7A6E6E]">
                    Total paid: <span className="font-serif font-bold text-[#8F243C] text-sm">{formatINR(sup.totalPaid)}</span>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteSupplier(sup.id)}
                  className="text-xs text-[#8F243C] hover:underline font-medium hover:text-rose-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E8DDCF] shadow-xl">
            <h3 className="font-serif text-lg font-bold text-[#2C181B] mb-4">
              Add Material Supplier
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Supplier / Vendor Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Fragrances & Waxes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="Supplier category"
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#423A3A] font-semibold mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                  />
                </div>
                <div>
                  <label className="block text-[#423A3A] font-semibold mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Delhi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="contact@vendor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#F2EBE0]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#D9C9B4] rounded-lg text-[#635B5B] hover:bg-[#FAF6F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#541523] text-white rounded-lg font-semibold hover:bg-[#6E1C30]"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
