'use client';

import React, { useState } from 'react';
import { Customer, Product, Order, OrderItem } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { X, Plus, Trash2 } from 'lucide-react';

interface NewOrderModalProps {
  products: Product[];
  customers?: Customer[];
  paymentModes?: string[];
  orderStatuses?: string[];
  initialOrder?: Order | null;
  prefillCustomer?: Customer | null;
  nextOrderNumberSuggestion?: string;
  onClose: () => void;
  onSave: (order: Omit<Order, 'id'>, existingId?: string) => void;
}

export default function NewOrderModal({
  products,
  customers = [],
  paymentModes = ['UPI', 'Cash', 'Card', 'Net Banking', 'Cash on Delivery', 'Other'],
  orderStatuses = ['New', 'In Production', 'Ready', 'Delivered', 'Cancelled'],
  initialOrder = null,
  prefillCustomer = null,
  nextOrderNumberSuggestion = 'ORD-021',
  onClose,
  onSave,
}: NewOrderModalProps) {
  const cleanPhoneValue = (v?: string) => {
    const t = (v || '').trim();
    return t && t !== '—' && t !== '-' ? t : '';
  };

  const formatCustomerLocation = (c?: Customer | null) => {
    if (!c?.city?.trim()) return '';
    return c.pincode?.trim() ? `${c.city.trim()} - ${c.pincode.trim()}` : c.city.trim();
  };

  const [orderNumber, setOrderNumber] = useState(
    initialOrder?.orderNumber || nextOrderNumberSuggestion
  );
  const [orderDate, setOrderDate] = useState(
    initialOrder?.createdAt || new Date().toISOString().split('T')[0]
  );
  const [customerName, setCustomerName] = useState(
    initialOrder?.customerName || prefillCustomer?.name || ''
  );
  const [customerPhone, setCustomerPhone] = useState(
    initialOrder?.customerPhone ||
      cleanPhoneValue(prefillCustomer?.phone) ||
      cleanPhoneValue(prefillCustomer?.whatsappNumber) ||
      ''
  );
  const [customerEmail, setCustomerEmail] = useState(
    initialOrder?.customerEmail || prefillCustomer?.email || ''
  );
  const [customerLocation, setCustomerLocation] = useState(
    initialOrder?.customerLocation || formatCustomerLocation(prefillCustomer) || ''
  );
  const [occasion, setOccasion] = useState(
    initialOrder?.occasion || prefillCustomer?.occasionFocus || ''
  );
  const [targetDate, setTargetDate] = useState(initialOrder?.targetDeliveryDate || '');
  const [deliveredOn, setDeliveredOn] = useState(initialOrder?.deliveredOn || '');
  const [notes, setNotes] = useState(initialOrder?.notes || '');

  const matchedCustomer = customers.find(
    (c) =>
      c.name.trim().toLowerCase().replace(/\s+/g, ' ') ===
      customerName.trim().toLowerCase().replace(/\s+/g, ' ')
  );

  const handleCustomerNameChange = (nextName: string) => {
    setCustomerName(nextName);
    if (initialOrder) return;
    const match = customers.find(
      (c) =>
        c.name.trim().toLowerCase().replace(/\s+/g, ' ') ===
        nextName.trim().toLowerCase().replace(/\s+/g, ' ')
    );
    if (match) {
      const ph = cleanPhoneValue(match.phone) || cleanPhoneValue(match.whatsappNumber);
      const loc = formatCustomerLocation(match);
      if (ph) setCustomerPhone(ph);
      if (match.email) setCustomerEmail(match.email);
      if (loc) setCustomerLocation(loc);
      if (match.occasionFocus && !occasion) setOccasion(match.occasionFocus);
    }
  };
  const [advancePaid, setAdvancePaid] = useState<number>(initialOrder?.advancePaid ?? 0);
  const [paymentMode, setPaymentMode] = useState<string>(
    initialOrder?.paymentMode || paymentModes[0] || 'UPI'
  );
  const [status, setStatus] = useState<string>(
    initialOrder?.status || orderStatuses[0] || 'New'
  );
  const [deductStock, setDeductStock] = useState<boolean>(
    initialOrder ? initialOrder.deductStock !== false : true
  );

  const [items, setItems] = useState<OrderItem[]>(
    initialOrder?.items?.length
      ? initialOrder.items
      : [
          {
            productId: products[0]?.id || '',
            productName: products[0]?.name || '',
            quantity: 1,
            unitPrice: products[0]?.price || 0,
          },
        ]
  );

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
    next[index] = { ...next[index], quantity: Math.max(1, qty) };
    setItems(next);
  };

  const handleUnitPriceChange = (index: number, price: number) => {
    const next = [...items];
    next[index] = { ...next[index], unitPrice: Math.max(0, price) };
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

    onSave(
      {
        orderNumber: orderNumber.trim() || nextOrderNumberSuggestion,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || initialOrder?.customerEmail,
        customerLocation: customerLocation.trim() || undefined,
        shipping: initialOrder?.shipping,
        tax: initialOrder?.tax,
        invoiceNumber: initialOrder?.invoiceNumber,
        items,
        totalAmount,
        advancePaid,
        balanceDue,
        status,
        paymentMode,
        createdAt: orderDate,
        targetDeliveryDate: targetDate || undefined,
        deliveredOn: deliveredOn || undefined,
        deductStock,
        notes: notes.trim() || undefined,
        occasion: occasion.trim() || undefined,
      },
      initialOrder?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-[#E8DDCF] shadow-2xl overflow-hidden">
        <div className="shrink-0 bg-[#FAF5EE] border-b border-[#E8DDCF] px-5 sm:px-6 py-3.5 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-[#2C181B]">
            {initialOrder ? `Edit Order ${initialOrder.orderNumber}` : 'Create New Order'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col text-xs">
          <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {/* Order # & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">Order No. *</label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] font-mono focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">Order Date</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">Deduct Stock?</label>
              <select
                value={deductStock ? 'Yes' : 'No'}
                onChange={(e) => setDeductStock(e.target.value === 'Yes')}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
              >
                <option value="Yes">Yes (Track raw material need)</option>
                <option value="No">No (Skip deduction)</option>
              </select>
            </div>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                list="vedh-customer-suggestions"
                placeholder="e.g. Radhika Sharma"
                value={customerName}
                onChange={(e) => handleCustomerNameChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
              <datalist id="vedh-customer-suggestions">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
              {matchedCustomer && (
                <div className="mt-1 text-[10px] text-[#8F243C] font-medium truncate">
                  CRM match: {matchedCustomer.type}
                  {matchedCustomer.instagramHandle ? ` · ${matchedCustomer.instagramHandle}` : ''}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Phone / WhatsApp Number
              </label>
              <input
                type="text"
                placeholder="9848481203"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Delivery Location / Address
              </label>
              <input
                type="text"
                placeholder="Flat / Society / City for invoice"
                value={customerLocation}
                onChange={(e) => setCustomerLocation(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Delivery Due Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Delivered On
              </label>
              <input
                type="date"
                value={deliveredOn}
                onChange={(e) => setDeliveredOn(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Occasion / Tag
              </label>
              <input
                type="text"
                placeholder="Diwali, Housewarming..."
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
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
                <div key={index} className="grid grid-cols-12 items-center gap-2">
                  <select
                    value={item.productId}
                    onChange={(e) => handleProductChange(index, e.target.value)}
                    aria-label={`Select product for item ${index + 1}`}
                    className="col-span-6 px-2.5 py-1.5 border rounded-lg border-[#D9C9B4] bg-white text-xs"
                  >
                    {!products.some((p) => p.id === item.productId) && (
                      <option value={item.productId}>{item.productName}</option>
                    )}
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
                    className="col-span-2 px-2 py-1.5 border rounded-lg border-[#D9C9B4] text-center text-xs"
                    aria-label={`Quantity for item ${index + 1}`}
                    title="Qty"
                  />

                  <input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => handleUnitPriceChange(index, parseFloat(e.target.value) || 0)}
                    className="col-span-2 px-2 py-1.5 border rounded-lg border-[#D9C9B4] text-right text-xs"
                    aria-label={`Unit price for item ${index + 1}`}
                    title="Unit price ₹"
                  />

                  <div className="col-span-2 flex items-center justify-end gap-1 font-serif font-semibold text-[#2C181B]">
                    <span>{formatINR(item.quantity * item.unitPrice)}</span>
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
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[#423A3A] font-semibold mb-1">
              Customisation / Address Notes
            </label>
            <input
              type="text"
              placeholder="Delivery address or colour preference..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
            />
          </div>

          {/* Status & Payment breakdown */}
          <div className="pt-2 border-t border-[#F2EBE0] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Amount Received (₹)
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
          </div>

          <div className="shrink-0 bg-[#FCFAF7] flex justify-end space-x-3 px-5 sm:px-6 py-3.5 border-t border-[#E8DDCF]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D9C9B4] rounded-lg text-[#635B5B] bg-white hover:bg-[#FAF6F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#541523] text-white rounded-lg font-semibold hover:bg-[#6E1C30]"
            >
              {initialOrder ? 'Save Changes' : 'Record Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
