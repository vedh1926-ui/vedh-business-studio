'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  FileText,
  Receipt,
  Users,
  Truck,
  CreditCard,
  BarChart3,
  Settings,
  History,
  ListChecks,
  Cloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { ActiveTab } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag size={18} />, badge: '3' },
    { id: 'products', label: 'Products', icon: <Package size={18} /> },
    { id: 'inventory', label: 'Inventory', icon: <Boxes size={18} />, badge: 'Alert' },
    { id: 'invoices', label: 'Invoices', icon: <FileText size={18} /> },
    { id: 'expenses', label: 'Expenses', icon: <Receipt size={18} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={18} /> },
    { id: 'suppliers', label: 'Suppliers', icon: <Truck size={18} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={18} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} /> },
    { id: 'master-lists', label: 'Master Lists', icon: <ListChecks size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    { id: 'history', label: 'History', icon: <History size={18} /> },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#541523] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-2xl`}
      >
        {/* Brand Header */}
        <div>
          <div className="p-6 border-b border-[#6E1C30]/50 flex items-center space-x-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#D4AF37]/50 shadow-md shrink-0 bg-[#3D0E18]">
              <Image
                src="/vedh-logo.jpg"
                alt="VEDH Brand Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-serif tracking-widest text-lg font-bold text-[#F3E3B5]">
                  VEDH
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] px-1.5 py-0.5 rounded bg-[#3D0E18] border border-[#D4AF37]/30">
                  Studio
                </span>
              </div>
              <p className="text-[11px] text-[#E8DDCF]/70 tracking-wider uppercase">
                Artisanal Tracking
              </p>
            </div>
          </div>

          {/* Quick link to Storefront */}
          <div className="px-3 pt-3 pb-1">
            <Link
              href="/"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#F3E3B5] bg-[#3D0E18]/80 hover:bg-[#621829] border border-[#D4AF37]/30 transition group"
            >
              <span>← View Storefront</span>
              <ExternalLink size={12} className="text-[#D4AF37] group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#701E31] text-[#FDFBF7] shadow-inner font-semibold border-l-4 border-[#D4AF37]'
                      : 'text-[#E8DDCF]/80 hover:bg-[#621829] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={isActive ? 'text-[#D4AF37]' : 'text-[#E8DDCF]/70'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded-full font-sans ${
                        item.badge === 'Alert'
                          ? 'bg-[#AB2E4A] text-white'
                          : 'bg-[#3D0E18] text-[#D4AF37] border border-[#D4AF37]/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Cloud Connection & Status Footer */}
        <div className="p-4 border-t border-[#6E1C30]/50 bg-[#3D0E18]/70 text-[11px] text-[#E8DDCF]/80">
          <div className="flex items-center space-x-2 mb-1.5">
            <Cloud size={14} className="text-[#D4AF37]" />
            <span className="font-medium text-[#F3E3B5]">
              {isSupabaseConfigured ? 'Supabase Connected' : 'Local Storage Mode'}
            </span>
          </div>
          <p className="text-[10px] text-[#E8DDCF]/60 leading-relaxed">
            {isSupabaseConfigured
              ? 'Real-time synchronization enabled.'
              : 'Local workspace is active. Connect Supabase credentials in Settings to sync with cloud.'}
          </p>
        </div>
      </aside>
    </>
  );
}
