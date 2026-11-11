'use client';

import React, { useState } from 'react';
import { Product, Order, OrderItem } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { X, Plus, Trash2 } from 'lucide-react';

interface NewOrderModalProps {
  products: Product[];
  paymentModes?: string[];
  orderStatuses?: string[];
  onClose: () => void;
  onSave: (order: Omit<Order, 'id'>) => void;
}

export default function NewOrderModal({
  products,
  paymentModes = ['UPI', 'Cash', 'Card', 'Net Banking', 'Cash on Delivery', 'Other'],
  orderStatuses = ['New', 'In Production', 'Ready', 'Delivered', 'Cancelled'],
  onClose,
  onSave,
}: NewOrderModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [occasion, setOccasion] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>(paymentModes[0] || 'UPI');
  const [status, setStatus] = useState<string>(orderStatuses[0] || 'New');

  // Line items state
  const [items, setItems] = useState<OrderItem[]>([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      quantity: 1,
      unitPrice: products[0]?.price || 0,
    },
  ]);

  const handleProductChange = (index: number, prodId: string) => {
    const selected = products.find((p) => p.id === prodId);
    if (!selected) return;

    const next = [...items];
    next[index] = {
      productId: selected.id,
      productName: selected.name,
      quantity: next[index].quantity,
      unitPrice: selected.price,
    };
    setItems(next);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const next = [...items];
    next[index].quantity = Math.max(1, qty);
    setItems(next);
  };

  const handleAddItem = () => {
    const first = products[0];
    if (!first) return;
    setItems([
      ...items,
      {
        productId: first.id,
        productName: first.name,
        quantity: 1,
        unitPrice: first.price,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((acc, curr) => acc + curr.quantity * curr.unitPrice, 0);
  const balanceDue = Math.max(0, totalAmount - advancePaid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || items.length === 0) return;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `#${randomNum}`;

    onSave({
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      items,
      totalAmount,
      advancePaid,
      balanceDue,
      status,
      paymentMode,
      createdAt: new Date().toISOString().split('T')[0],
      targetDeliveryDate: targetDate,
      notes,
      occasion,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-[#E8DDCF] shadow-2xl overflow-hidden my-8">
        <div className="bg-[#FAF5EE] border-b border-[#E8DDCF] px-6 py-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-[#2C181B]">
            Create New Order
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
          {/* Customer info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Radhika Sharma"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Phone / WhatsApp Number
              </label>
              <input
                type="text"
                placeholder="+91 98201..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Occasion / Note
              </label>
              <input
                type="text"
                placeholder="e.g. Diwali Return Gifts, Wedding Hamper"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Target Delivery Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
          </div>

          {/* Line items section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[#423A3A] font-bold">
                Order Items &amp; Handcrafted Pieces
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[#8F243C] font-semibold flex items-center space-x-1 hover:underline"
              >
                <Plus size={13} />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 border border-[#E8DDCF] rounded-xl p-3 bg-[#FCFAF7]">
              {items.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <select
                    value={item.productId}
                    onChange={(e) => handleProductChange(index, e.target.value)}
                    aria-label={`Select product for item ${index + 1}`}
                    className="flex-1 px-2.5 py-1.5 border rounded-lg border-[#D9C9B4] bg-white text-xs"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatINR(p.price)})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQtyChange(index, parseInt(e.target.value) || 1)}
                    className="w-16 px-2.5 py-1.5 border rounded-lg border-[#D9C9B4] text-center text-xs"
                    aria-label={`Quantity for item ${index + 1}`}
                  />

                  <div className="w-20 text-right font-serif font-semibold text-[#2C181B]">
                    {formatINR(item.quantity * item.unitPrice)}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-stone-400 hover:text-rose-600"
                      aria-label={`Remove item ${index + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Status & Payment breakdown */}
          <div className="pt-2 border-t border-[#F2EBE0] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Advance Paid (₹)
              </label>
              <input
                type="number"
                min="0"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || 0)}
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
                aria-label="Payment mode"
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
              >
                {paymentModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Order Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Initial order status"
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
              >
                {orderStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-right flex items-center justify-end space-x-4">
            <div className="text-xs text-[#7A6E6E]">
              Total: <span className="font-serif font-bold text-[#2C181B] text-sm">{formatINR(totalAmount)}</span>
            </div>
            <div className="text-xs text-[#8F243C] font-semibold">
              Balance Due: {formatINR(balanceDue)}
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
              Record Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
