'use client';

import React, { useState } from 'react';
import { Expense } from '@/lib/types';
import { X } from 'lucide-react';

interface NewExpenseModalProps {
  categories?: string[];
  paymentModes?: string[];
  purchaseStatuses?: string[];
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'>) => void;
}

export default function NewExpenseModal({
  categories = ['Wax / Candles', 'Packaging', 'Resin Supplies', 'Fabric', 'Tools', 'Other'],
  paymentModes = ['UPI', 'Cash', 'Card', 'Net Banking', 'Cash on Delivery', 'Other'],
  purchaseStatuses = ['Ordered', 'Shipped', 'Delayed', 'Delivered', 'Self Pick-Up', 'Rapido', 'Replaced', 'Returned', 'Refund Pending', 'Cancelled'],
  onClose,
  onSave,
}: NewExpenseModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>(categories[0] || 'Wax / Candles');
  const [amount, setAmount] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [paymentMode, setPaymentMode] = useState<Expense['paymentMode']>(paymentModes[0] || 'UPI');
  const [purchaseStatus, setPurchaseStatus] = useState<string>(purchaseStatuses[0] || 'Ordered');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    onSave({
      title,
      category,
      amount: parseFloat(amount) || 0,
      date: new Date().toISOString().split('T')[0],
      supplierName,
      paymentMode,
      purchaseStatus,
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#E8DDCF] shadow-2xl overflow-hidden">
        <div className="bg-[#FAF5EE] border-b border-[#E8DDCF] px-6 py-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-[#2C181B]">
            Record Workshop Expense
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
              Expense Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Scented Oils Batch #4, 100 Rigid Boxes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
                aria-label="Expense category"
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
                Purchase Status
              </label>
              <select
                value={purchaseStatus}
                onChange={(e) => setPurchaseStatus(e.target.value)}
                aria-label="Purchase status"
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
              >
                {purchaseStatuses.map((ps) => (
                  <option key={ps} value={ps}>
                    {ps}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                required
                placeholder="2500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                aria-label="Expense payment mode"
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
              >
                {paymentModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#423A3A] font-semibold mb-1">
              Supplier / Vendor Name
            </label>
            <input
              type="text"
              placeholder="e.g. Royal Box Printers"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
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
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
