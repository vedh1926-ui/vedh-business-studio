'use client';

import React, { useState } from 'react';
import { Menu, Plus, History, Sparkles } from 'lucide-react';
import { ActiveTab } from '@/lib/types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSidebar: () => void;
  onQuickAdd: (type: 'order' | 'product' | 'stock' | 'expense') => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  onOpenSidebar,
  onQuickAdd,
}: HeaderProps) {
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const breadcrumbLabels: Record<ActiveTab, string> = {
    dashboard: 'DASHBOARD',
    orders: 'ORDERS',
    products: 'PRODUCTS',
    inventory: 'INVENTORY',
    invoices: 'INVOICES & BILLING',
    expenses: 'EXPENSES',
    customers: 'CUSTOMERS',
    suppliers: 'SUPPLIERS',
    payments: 'PAYMENTS',
    reports: 'REPORTS & ANALYTICS',
    'master-lists': 'MASTER LISTS & PARAMETERS',
    settings: 'SETTINGS',
    history: 'HISTORY & LOGS',
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#E8DDCF] px-6 py-4 flex items-center justify-between">
      {/* Left: Mobile hamburger & Breadcrumb */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-md text-[#541523] hover:bg-[#EFE8DD] transition"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="text-[11px] font-semibold tracking-widest uppercase text-[#8F243C]">
            VEDH / {breadcrumbLabels[activeTab]}
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#2C181B] capitalize">
            {activeTab === 'invoices'
              ? 'Invoices & Billing'
              : activeTab === 'master-lists'
              ? 'Master Lists'
              : activeTab}
          </h1>
        </div>
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center space-x-3">
        {activeTab !== 'history' && (
          <button
            onClick={() => setActiveTab('history')}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-[#D9C9B4] text-xs font-medium text-[#423A3A] bg-[#FDFBF7] hover:bg-[#F2EBE0] transition shadow-sm"
          >
            <History size={14} className="text-[#8F243C]" />
            <span>View history</span>
          </button>
        )}

        {/* Quick Add Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-[#541523] hover:bg-[#681B2C] text-[#FAF6F0] text-xs font-semibold tracking-wide transition shadow-md active:scale-95"
          >
            <Plus size={15} />
            <span>+ Quick add</span>
          </button>

          {showQuickMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowQuickMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-[#E8DDCF] py-1.5 z-50 text-xs">
                <button
                  onClick={() => {
                    onQuickAdd('order');
                    setShowQuickMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#F9F5EE] text-[#2C181B] flex items-center space-x-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#8F243C]"></span>
                  <span>New Order</span>
                </button>
                <button
                  onClick={() => {
                    onQuickAdd('product');
                    setShowQuickMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#F9F5EE] text-[#2C181B] flex items-center space-x-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#C69C31]"></span>
                  <span>New Product</span>
                </button>
                <button
                  onClick={() => {
                    onQuickAdd('stock');
                    setShowQuickMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#F9F5EE] text-[#2C181B] flex items-center space-x-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span>Add Stock</span>
                </button>
                <button
                  onClick={() => {
                    onQuickAdd('expense');
                    setShowQuickMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#F9F5EE] text-[#2C181B] flex items-center space-x-2 border-t border-[#F2EBE0]"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  <span>Record Expense</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
