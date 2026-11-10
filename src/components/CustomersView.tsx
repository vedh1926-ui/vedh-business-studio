'use client';

import React from 'react';
import { Customer } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { Plus, Users, Phone, Mail, MapPin } from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  onOpenNewCustomer: () => void;
  onDeleteCustomer: (id: string) => void;
}

export default function CustomersView({
  customers,
  onOpenNewCustomer,
  onDeleteCustomer,
}: CustomersViewProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Customers
          </h2>
          <p className="text-xs text-[#7A6E6E]">
            {customers.length} records in this workspace — manage client relationships &amp; festive gift clients
          </p>
        </div>

        <button
          onClick={onOpenNewCustomer}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide transition shadow-sm"
        >
          <Plus size={16} />
          <span>+ Add customer</span>
        </button>
      </div>

      {/* Customers List matching page 6 styling */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-[#F2EBE0]">
          {customers.map((cust) => (
            <div
              key={cust.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF6F0]/60 transition"
            >
              {/* Customer Info */}
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] border border-[#E8DDCF] flex items-center justify-center text-[#541523] font-serif font-bold text-sm">
                  {cust.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#2C181B]">
                    {cust.name}
                  </div>
                  <div className="text-xs text-[#7A6E6E] flex items-center space-x-3 mt-0.5">
                    {cust.phone && (
                      <span className="flex items-center space-x-1">
                        <Phone size={11} />
                        <span>{cust.phone}</span>
                      </span>
                    )}
                    {cust.city && (
                      <span className="flex items-center space-x-1">
                        <MapPin size={11} />
                        <span>{cust.city}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats & Badge */}
              <div className="flex items-center space-x-6 justify-between md:justify-end">
                <div className="text-xs text-[#635B5B]">
                  <span className="font-semibold text-[#2C181B]">{cust.totalOrders}</span> orders
                </div>

                <div className="text-right">
                  <div className="text-xs text-[#7A6E6E]">
                    Spent <span className="font-serif font-bold text-[#2C181B] text-sm">{formatINR(cust.totalSpent)}</span>
                  </div>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    cust.type === 'VIP'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                      : 'bg-[#F2EBE0] text-[#541523] border border-[#E8DDCF]'
                  }`}
                >
                  {cust.type || 'Customer'}
                </span>

                <button
                  onClick={() => onDeleteCustomer(cust.id)}
                  className="text-xs text-[#8F243C] hover:underline font-medium hover:text-rose-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
