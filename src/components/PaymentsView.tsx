'use client';

import React, { useState } from 'react';
import { Payment } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { Plus, CreditCard, CheckCircle2 } from 'lucide-react';

interface PaymentsViewProps {
  payments: Payment[];
  paymentModes?: string[];
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
}

export default function PaymentsView({
  payments,
  paymentModes = ['UPI', 'Cash', 'Card', 'Net Banking', 'Cash on Delivery', 'Other'],
  onAddPayment,
}: PaymentsViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<Payment['method']>(paymentModes[0] || 'UPI');

  const totalPayments = payments.reduce((acc, curr) => acc + curr.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !amount) return;
    onAddPayment({
      orderNumber: orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`,
      customerName,
      amount: parseFloat(amount) || 0,
      date: new Date().toISOString().split('T')[0],
      method,
      status: 'Received',
    });
    setOrderNumber('');
    setCustomerName('');
    setAmount('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Payments
          </h2>
          <p className="text-xs text-[#7A6E6E]">
            {payments.length} records in this workspace — record money received from customers
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide transition shadow-sm"
        >
          <Plus size={16} />
          <span>+ Add payment</span>
        </button>
      </div>

      {/* Metric card */}
      <div className="bg-white border border-[#E8DDCF] rounded-xl p-5 max-w-sm shadow-sm">
        <div className="text-xs text-[#7A6E6E]">Total Verified Cash In</div>
        <div className="text-3xl font-serif font-bold text-emerald-800 mt-1">
          {formatINR(totalPayments)}
        </div>
        <div className="text-[11px] text-[#8C7D7D] mt-0.5">
          Settled across UPI, Net Banking &amp; Cash
        </div>
      </div>

      {/* Payments Table matching page 8 styling */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
        {payments.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#8C7D7D]">
            No records yet. Click &quot;+ Add payment&quot; to log your first payment.
          </div>
        ) : (
          <div className="divide-y divide-[#F2EBE0]">
            {payments.map((pay) => (
              <div
                key={pay.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF6F0]/60 transition"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#2C181B]">
                      {pay.customerName}
                    </div>
                    <div className="text-xs text-[#7A6E6E] flex items-center space-x-2 mt-0.5">
                      <span className="font-mono text-[#541523] font-medium">{pay.orderNumber}</span>
                      <span>• {pay.method}</span>
                      <span>• {pay.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6 justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="font-serif font-bold text-emerald-800 text-base">
                      +{formatINR(pay.amount)}
                    </div>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {pay.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E8DDCF] shadow-xl">
            <h3 className="font-serif text-lg font-bold text-[#2C181B] mb-4">
              Record Customer Payment
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Mehta"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#423A3A] font-semibold mb-1">
                    Order Ref Number
                  </label>
                  <input
                    type="text"
                    placeholder="#1024"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                  />
                </div>
                <div>
                  <label className="block text-[#423A3A] font-semibold mb-1">
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Payment Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  aria-label="Payment method"
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                >
                  {paymentModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
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
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
