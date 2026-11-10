'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Flame,
  Gift,
  Heart,
  Calendar,
  Layers,
  CheckCircle2,
  Phone,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Truck,
  Palette,
  ChevronDown,
  ShoppingBag,
  ExternalLink,
  Star,
  Users
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { initialProducts } from '@/lib/mockData';
import { Product } from '@/lib/types';

export default function Storefront() {
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
  const [inquiryProduct, setInquiryProduct] = useState<Product | null>(null);

  // Bulk Order Form State
  const [bulkOccasion, setBulkOccasion] = useState('Wedding Return Gifts');
  const [bulkQty, setBulkQty] = useState('50 - 100 sets');
  const [bulkCraft, setBulkCraft] = useState('Moonlit Diya & Candle Sets');
  const [targetDate, setTargetDate] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Filter products by occasion/category
  const filteredProducts = selectedOccasion === 'all'
    ? initialProducts
    : selectedOccasion === 'candles'
    ? initialProducts.filter(p => p.category === 'Candles')
    : selectedOccasion === 'resin'
    ? initialProducts.filter(p => p.category === 'Resin Coasters')
    : selectedOccasion === 'embroidery'
    ? initialProducts.filter(p => p.category === 'Embroidery')
    : initialProducts.filter(p => p.category === 'Gift Hampers');

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return;

    // Save inquiry to localStorage so it syncs with Studio!
    try {
      const existing = JSON.parse(localStorage.getItem('vedh_orders') || '[]');
      const newInquiry = {
        id: `inq-${Date.now()}`,
        orderNumber: `#${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: clientName,
        customerPhone: clientPhone,
        customerEmail: '',
        items: [
          {
            productId: 'bulk-craft',
            productName: `${bulkCraft} (Bulk: ${bulkQty})`,
            quantity: 1,
            unitPrice: 0,
          },
        ],
        totalAmount: 0,
        advancePaid: 0,
        balanceDue: 0,
        status: 'Inquiry',
        createdAt: new Date().toISOString().split('T')[0],
        targetDeliveryDate: targetDate,
        occasion: `${bulkOccasion} (${clientCity})`,
        notes: `Bulk Inquiry: ${bulkQty} of ${bulkCraft}. Client Notes: ${customNotes}`,
      };
      localStorage.setItem('vedh_orders', JSON.stringify([newInquiry, ...existing]));
    } catch {}

    setIsSubmitted(true);
  };

  const openWhatsApp = (msg: string) => {
    const text = encodeURIComponent(msg);
    window.open(`https://wa.me/919820144521?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#241A1B] flex flex-col font-sans selection:bg-[#541523] selection:text-[#F3E3B5]">
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div className="bg-[#3D0E18] text-[#F3E3B5] px-4 py-2 text-center text-xs tracking-wider flex items-center justify-center space-x-2 border-b border-[#D4AF37]/30">
        <Sparkles size={13} className="text-[#D4AF37]" />
        <span>Keeping Indian Traditions Alive With Art • Bespoke Wedding Return Gifts &amp; Festive Collections</span>
        <Sparkles size={13} className="text-[#D4AF37]" />
      </div>

      {/* 2. ROYAL NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#E8DDCF] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-md shrink-0 bg-[#3D0E18]">
              <Image
                src="/vedh-logo.jpg"
                alt="VEDH Artistry Logo"
                fill
                className="object-cover group-hover:scale-105 transition duration-300"
                priority
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-serif tracking-widest text-xl font-bold text-[#541523]">
                  VEDH
                </span>
                <span className="text-[10px] tracking-widest uppercase text-[#A87E1F] font-semibold border-l border-[#D4AF37] pl-1.5">
                  Artistry
                </span>
              </div>
              <p className="text-[10px] text-[#7A6E6E] tracking-wider uppercase">
                Designer Handicrafts
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-7 text-xs uppercase tracking-widest font-semibold text-[#541523]">
            <a href="#collections" className="hover:text-[#A87E1F] transition">
              Collections
            </a>
            <a href="#occasions" className="hover:text-[#A87E1F] transition">
              Occasions
            </a>
            <a href="#bulk-gifting" className="hover:text-[#A87E1F] transition text-[#8F243C]">
              Bulk &amp; Return Gifts
            </a>
            <a href="#heritage" className="hover:text-[#A87E1F] transition">
              Our Soul
            </a>
          </nav>

          {/* Actions & Studio Access */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => openWhatsApp('Hello Vedh Artistry! I would like to inquire about bespoke handcrafted pieces.')}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-[#FAF6F0] text-xs font-semibold tracking-wide transition shadow-sm active:scale-95"
            >
              <MessageCircle size={14} className="text-[#F3E3B5]" />
              <span className="hidden sm:inline">WhatsApp Concierge</span>
              <span className="sm:hidden">Inquire</span>
            </button>

            {/* Link to internal Business Studio */}
            <Link
              href="/studio"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-[#D9C9B4] text-xs font-medium text-[#541523] bg-white hover:bg-[#F2EBE0] transition"
              title="Access Internal Tracking Studio"
            >
              <span className="hidden sm:inline">Studio Login</span>
              <ExternalLink size={12} className="text-[#A87E1F]" />
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION — Royal Indian Luxury */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#4A121E] via-[#541523] to-[#3D0E18] text-white py-16 sm:py-24 px-4 sm:px-8 border-b-4 border-[#D4AF37]">
        {/* Subtle Decorative Elements */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Insignia Pill */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#2B0B12]/80 border border-[#D4AF37]/50 shadow-inner text-[#F3E3B5] text-xs font-semibold tracking-widest uppercase mb-6 animate-fadeIn">
            <Sparkles size={14} className="text-[#D4AF37]" />
            <span>Preserving Traditions With Designer Art</span>
            <Sparkles size={14} className="text-[#D4AF37]" />
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-[#FDFBF7] tracking-tight leading-tight sm:leading-none">
            Traditions Crafted into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F3E3B5] via-[#D4AF37] to-[#E9D08A] italic">
              Designer Masterpieces.
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-base text-[#E8DDCF]/90 max-w-2xl mx-auto font-light leading-relaxed">
            Welcome to <strong className="font-semibold text-white">VEDH</strong>. We create exclusive handcrafted collections of festive soy wax candles, artisanal crystal resin art, and bespoke return gifts for life’s most auspicious moments.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#bulk-gifting"
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C69C31] text-[#2B0B12] font-semibold text-xs tracking-wider uppercase hover:shadow-lg hover:shadow-[#D4AF37]/20 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
            >
              <Gift size={16} />
              <span>Bespoke &amp; Return Gifts</span>
            </a>

            <a
              href="#collections"
              className="w-full sm:w-auto px-7 py-3 rounded-xl border border-[#D4AF37]/60 text-[#FDFBF7] hover:bg-[#3D0E18] font-semibold text-xs tracking-wider uppercase transition flex items-center justify-center space-x-2"
            >
              <span>Explore Collections</span>
              <ArrowRight size={14} />
            </a>
          </div>

          {/* 3 Pillars Badge */}
          <div className="mt-14 pt-10 border-t border-[#6E1C30]/60 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs text-[#E8DDCF]">
            <div className="flex flex-col items-center space-y-1.5">
              <span className="w-8 h-8 rounded-full bg-[#3D0E18] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <Flame size={16} />
              </span>
              <span className="font-semibold text-white">Pure Natural Soy Wax</span>
              <span className="text-[11px] text-[#E8DDCF]/70">Eco-conscious slow burns with brass diya accents</span>
            </div>

            <div className="flex flex-col items-center space-y-1.5">
              <span className="w-8 h-8 rounded-full bg-[#3D0E18] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <Palette size={16} />
              </span>
              <span className="font-semibold text-white">Bespoke Personalization</span>
              <span className="text-[11px] text-[#E8DDCF]/70">Calligraphy tags, engraved initials &amp; custom hues</span>
            </div>

            <div className="flex flex-col items-center space-y-1.5">
              <span className="w-8 h-8 rounded-full bg-[#3D0E18] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <Truck size={16} />
              </span>
              <span className="font-semibold text-white">Pan-India Express Delivery</span>
              <span className="text-[11px] text-[#E8DDCF]/70">Rigid luxury box packaging for bulk wedding orders</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. OCCASION & EVENT CURATOR */}
      <section id="occasions" className="py-16 sm:py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-semibold tracking-widest uppercase text-[#8F243C] mb-1">
            Curated For Sacred Moments
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C181B]">
            Celebrations Enriched by Art
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#7A6E6E]">
            Whether it is an intimate family festival or a grand 500-guest wedding celebration, our designer creations are handcrafted to leave lasting memories.
          </p>
        </div>

        {/* 4 Occasion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Festive & Diwali */}
          <div className="bg-white rounded-2xl border border-[#E8DDCF] p-6 shadow-sm hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-xl bg-[#FAF0E6] border border-[#EBDCCB] flex items-center justify-center text-[#8F243C] mb-4 group-hover:scale-110 transition">
              <Flame size={24} />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#2C181B]">
              Diwali &amp; Festive Lights
            </h3>
            <p className="text-xs text-[#7A6E6E] mt-2 leading-relaxed">
              Moonlit brass diya sets, hand-poured lavender and hazelnut candles that fill homes with auspicious warmth.
            </p>
            <div className="mt-4 pt-3 border-t border-[#F2EBE0] text-xs font-semibold text-[#8F243C] flex items-center justify-between">
              <span>Diwali Gift Hampers</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 2. Wedding & Shubh Muhurat */}
          <div className="bg-white rounded-2xl border border-[#E8DDCF] p-6 shadow-sm hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-xl bg-[#FAF0E6] border border-[#EBDCCB] flex items-center justify-center text-[#8F243C] mb-4 group-hover:scale-110 transition">
              <Heart size={24} />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#2C181B]">
              Weddings &amp; Return Gifts
            </h3>
            <p className="text-xs text-[#7A6E6E] mt-2 leading-relaxed">
              Bespoke resin coasters with gold foil, personalized bride &amp; groom monograms, and luxury return gift hampers.
            </p>
            <div className="mt-4 pt-3 border-t border-[#F2EBE0] text-xs font-semibold text-[#8F243C] flex items-center justify-between">
              <span>Wedding Favors</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 3. Griha Pravesh */}
          <div className="bg-white rounded-2xl border border-[#E8DDCF] p-6 shadow-sm hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-xl bg-[#FAF0E6] border border-[#EBDCCB] flex items-center justify-center text-[#8F243C] mb-4 group-hover:scale-110 transition">
              <Sparkles size={24} />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#2C181B]">
              Griha Pravesh &amp; Home
            </h3>
            <p className="text-xs text-[#7A6E6E] mt-2 leading-relaxed">
              Traditional marigold zardozi embroidery frames and crystal geode platters designed to bring prosperity.
            </p>
            <div className="mt-4 pt-3 border-t border-[#F2EBE0] text-xs font-semibold text-[#8F243C] flex items-center justify-between">
              <span>Housewarming Pieces</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 4. Corporate & Executive */}
          <div className="bg-white rounded-2xl border border-[#E8DDCF] p-6 shadow-sm hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-xl bg-[#FAF0E6] border border-[#EBDCCB] flex items-center justify-center text-[#8F243C] mb-4 group-hover:scale-110 transition">
              <Gift size={24} />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#2C181B]">
              Corporate &amp; VIP Gifting
            </h3>
            <p className="text-xs text-[#7A6E6E] mt-2 leading-relaxed">
              Custom company logo debossing on luxury rigid boxes with curated gourmet &amp; scented artisanal pairings.
            </p>
            <div className="mt-4 pt-3 border-t border-[#F2EBE0] text-xs font-semibold text-[#8F243C] flex items-center justify-between">
              <span>Corporate Catalog</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* 5. MASTERPIECES COLLECTION (Interactive Catalog) */}
      <section id="collections" className="py-16 bg-[#F4EFEA] border-y border-[#E8DDCF] px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase text-[#8F243C] mb-1">
                Handcrafted With Devotion
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C181B]">
                The Masterpieces Collection
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 text-xs">
              {[
                { id: 'all', label: 'All Pieces' },
                { id: 'candles', label: 'Diya & Candles' },
                { id: 'resin', label: 'Resin Art' },
                { id: 'embroidery', label: 'Embroidery' },
                { id: 'hampers', label: 'Gift Hampers' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedOccasion(tab.id)}
                  className={`px-4 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
                    selectedOccasion === tab.id
                      ? 'bg-[#541523] text-white shadow-sm'
                      : 'bg-white text-[#635B5B] border border-[#E8DDCF] hover:bg-[#FAF6F0]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-[#E8DDCF] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Visual Header */}
                  <div className="h-48 bg-gradient-to-br from-[#FAF0E6] via-[#F4EAE1] to-[#EBDCCB] relative flex items-center justify-center p-6 border-b border-[#E8DDCF]">
                    <div className="text-center">
                      <span className="font-serif italic text-3xl text-[#541523]/40 tracking-wider">
                        VEDH
                      </span>
                      <div className="mt-2 text-xs uppercase tracking-widest text-[#8F243C] font-semibold">
                        {product.category}
                      </div>
                    </div>

                    <span className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-[#541523] text-[#F3E3B5] border border-[#D4AF37]/50">
                      Handcrafted
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <h3 className="font-serif text-lg font-bold text-[#2C181B] group-hover:text-[#8F243C] transition">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-xs text-[#7A6E6E] leading-relaxed line-clamp-3">
                      {product.description || 'Artisanal designer piece made with traditional techniques and premium finishes.'}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Price & Inquiry button */}
                <div className="p-6 pt-0 border-t border-[#F2EBE0] mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#7A6E6E] uppercase tracking-wider block">Artisan Price</span>
                    <span className="font-serif text-xl font-bold text-[#2C181B]">
                      {formatINR(product.price)}
                    </span>
                  </div>

                  <button
                    onClick={() => openWhatsApp(`Hello Vedh Artistry! I would like to inquire about ordering / customizing the "${product.name}" (${formatINR(product.price)}).`)}
                    className="px-4 py-2 rounded-xl bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide transition shadow-sm flex items-center space-x-1.5"
                  >
                    <MessageCircle size={13} className="text-[#F3E3B5]" />
                    <span>Inquire / Customize</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. BESPOKE & BULK RETURN GIFTS CONCIERGE (Interactive Wizard) */}
      <section id="bulk-gifting" className="py-20 px-4 sm:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-white rounded-3xl border-2 border-[#D4AF37]/50 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#4A121E] via-[#541523] to-[#3D0E18] text-white p-8 sm:p-10 text-center">
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold inline-flex items-center space-x-1 mb-2">
              <Gift size={14} />
              <span>Bulk Gifting &amp; Return Gifts Studio</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#FDFBF7]">
              Plan Your Bespoke Event Gifting
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#E8DDCF]/80 max-w-xl mx-auto">
              Weddings, Diwali corporate packages, housewarmings, and special family gatherings. Fill in your details below for custom quotations and sample boxes.
            </p>
          </div>

          {/* Form / Confirmation Body */}
          <div className="p-8 sm:p-12">
            {isSubmitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto border-2 border-emerald-300">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#2C181B]">
                  Thank You, {clientName}!
                </h3>
                <p className="text-sm text-[#635B5B] max-w-md mx-auto">
                  Your bulk gifting inquiry for <strong>{bulkCraft} ({bulkQty})</strong> has been received by our lead artisan. We will connect with you on WhatsApp at <strong>{clientPhone}</strong> shortly.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => openWhatsApp(`Hi Vedh Artistry! I just submitted an inquiry for ${bulkQty} of ${bulkCraft} for my ${bulkOccasion}. Can we discuss further?`)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs tracking-wide transition flex items-center space-x-2"
                  >
                    <MessageCircle size={15} />
                    <span>Chat on WhatsApp Directly</span>
                  </button>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="px-6 py-2.5 rounded-xl border border-[#D9C9B4] text-[#541523] text-xs font-semibold hover:bg-[#FAF6F0]"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBulkSubmit} className="space-y-6 text-xs">
                {/* Step 1: Occasion & Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#423A3A] font-bold uppercase tracking-wider mb-2">
                      1. Occasion / Event Type *
                    </label>
                    <select
                      value={bulkOccasion}
                      onChange={(e) => setBulkOccasion(e.target.value)}
                      className="w-full px-3.5 py-2.5 border rounded-xl border-[#D9C9B4] text-sm bg-[#FCFAF7] focus:ring-1 focus:ring-[#541523] focus:outline-none"
                    >
                      <option value="Wedding Return Gifts">Wedding Return Gifts (Shaadi Favors)</option>
                      <option value="Diwali Corporate Gifting">Diwali Corporate &amp; Executive Hampers</option>
                      <option value="Griha Pravesh / Housewarming">Griha Pravesh / Housewarming Return Gifts</option>
                      <option value="Baby Shower / Naming Ceremony">Baby Shower / Naming Ceremony</option>
                      <option value="Milestone Anniversary">Milestone Anniversary Celebration</option>
                      <option value="Custom Designer Order">Custom Personal Designer Order</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#423A3A] font-bold uppercase tracking-wider mb-2">
                      2. Estimated Quantity Required *
                    </label>
                    <select
                      value={bulkQty}
                      onChange={(e) => setBulkQty(e.target.value)}
                      className="w-full px-3.5 py-2.5 border rounded-xl border-[#D9C9B4] text-sm bg-[#FCFAF7] focus:ring-1 focus:ring-[#541523] focus:outline-none"
                    >
                      <option value="25 - 50 sets">25 - 50 Pieces / Sets</option>
                      <option value="50 - 100 sets">50 - 100 Pieces / Sets (Popular)</option>
                      <option value="100 - 250 sets">100 - 250 Pieces / Sets</option>
                      <option value="250 - 500 sets">250 - 500 Pieces (Large Wedding)</option>
                      <option value="500+ sets">500+ Pieces (Grand Corporate/Wedding)</option>
                    </select>
                  </div>
                </div>

                {/* Step 2: Preferred Craft & Target Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#423A3A] font-bold uppercase tracking-wider mb-2">
                      3. Preferred Art Form / Craft *
                    </label>
                    <select
                      value={bulkCraft}
                      onChange={(e) => setBulkCraft(e.target.value)}
                      className="w-full px-3.5 py-2.5 border rounded-xl border-[#D9C9B4] text-sm bg-[#FCFAF7] focus:ring-1 focus:ring-[#541523] focus:outline-none"
                    >
                      <option value="Moonlit Diya & Candle Sets">Moonlit Diya &amp; Scented Soy Candles</option>
                      <option value="Royal Ocean Resin Coaster Sets">Ocean Resin Coaster Sets with Gold Foiling</option>
                      <option value="Marigold Zardozi Embroidery Frames">Handmade Zardozi Embroidery Keepsakes</option>
                      <option value="Curated Luxury Gift Hampers">Curated Luxury Gift Hampers with Rigid Box</option>
                      <option value="Mix of Everything / Custom Suggestion">Suggest a Custom Mix for My Budget</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#423A3A] font-bold uppercase tracking-wider mb-2">
                      4. Target Event / Delivery Date
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 border rounded-xl border-[#D9C9B4] text-sm bg-[#FCFAF7] focus:ring-1 focus:ring-[#541523] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Step 3: Contact Info */}
                <div className="pt-2 border-t border-[#F2EBE0] grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[#423A3A] font-bold mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Radhika Sharma"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:ring-1 focus:ring-[#541523] focus:outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[#423A3A] font-bold mb-1">
                      WhatsApp / Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98201 44521"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:ring-1 focus:ring-[#541523] focus:outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[#423A3A] font-bold mb-1">
                      City / Event Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai, Delhi, Jaipur"
                      value={clientCity}
                      onChange={(e) => setClientCity(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:ring-1 focus:ring-[#541523] focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#423A3A] font-bold mb-1">
                    Customization Notes (Names, Inscriptions, Colors, Logo)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. We want bride & groom initials engraved in gold leaf on the back of each coaster, with royal maroon gift boxes..."
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:ring-1 focus:ring-[#541523] focus:outline-none text-sm"
                  />
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="submit"
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#541523] to-[#3D0E18] text-[#F3E3B5] font-semibold text-xs tracking-widest uppercase hover:shadow-lg transition transform hover:-translate-y-0.5"
                  >
                    Submit Gifting Inquiry &amp; Get Custom Quote
                  </button>
                  <p className="mt-2 text-[11px] text-[#7A6E6E]">
                    Our artisan team responds within 2 hours with digital design mockups and pricing options.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 7. BRAND STORY: "The Soul of Vedh" */}
      <section id="heritage" className="py-20 bg-[#FAF5EE] border-t border-[#E8DDCF] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          {/* Left: Graphic badge */}
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden border-4 border-[#D4AF37] shadow-2xl bg-[#3D0E18]">
              <Image
                src="/vedh-logo.jpg"
                alt="VEDH Heritage"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Right: Narrative */}
          <div className="w-full md:w-1/2 space-y-4">
            <div className="text-xs font-semibold tracking-widest uppercase text-[#8F243C]">
              Our Heritage &amp; Philosophy
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C181B] leading-tight">
              Art That Keeps Generational Traditions Alive.
            </h2>
            <p className="text-xs sm:text-sm text-[#635B5B] leading-relaxed">
              In a world flooded with automated factory items, <strong>VEDH Artistry</strong> was born out of a deep reverence for Indian handcraft traditions. We believe that true luxury lies in the patience of the artisan’s hand.
            </p>
            <p className="text-xs sm:text-sm text-[#635B5B] leading-relaxed">
              Every soy candle is slow-poured in small batches, every resin coaster is sculpted with shimmering gold veins, and every festive frame carries the legacy of Indian embroidery. When you gift a Vedh piece, you gift a story of heritage, love, and timeless elegance.
            </p>

            <div className="pt-2 flex items-center space-x-6 text-xs font-serif font-bold text-[#541523]">
              <div>• Pure Botanical Soy</div>
              <div>• Non-Toxic Resin</div>
              <div>• Zardozi Craftsmanship</div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FLOATING WHATSAPP BUTTON */}
      <button
        onClick={() => openWhatsApp('Hello Vedh Artistry! I would like to inquire about your collections and return gifts.')}
        className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xl hover:scale-110 transition flex items-center space-x-2 border-2 border-white/80"
        aria-label="Chat with Vedh Artistry on WhatsApp"
      >
        <MessageCircle size={22} />
        <span className="hidden sm:inline text-xs font-bold tracking-wide pr-1">Chat With Artisan</span>
      </button>

      {/* 9. ROYAL FOOTER */}
      <footer className="bg-[#2B0B12] text-[#E8DDCF] pt-14 pb-8 px-4 sm:px-8 border-t-2 border-[#D4AF37]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-xs">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="font-serif tracking-widest text-2xl font-bold text-[#F3E3B5]">
              VEDH
            </div>
            <p className="text-xs text-[#E8DDCF]/80 leading-relaxed font-light">
              Exclusively handcrafted designer handicrafts, Diwali candles, resin coaster sets, and return gifts. Preserving traditions with art.
            </p>
            <div className="text-[11px] text-[#D4AF37]">
              Domain: <span className="underline font-semibold">vedhartistry.com</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-2">
            <div className="font-serif text-sm font-bold text-[#F3E3B5] uppercase tracking-wider">
              Collections
            </div>
            <ul className="space-y-1.5 text-[#E8DDCF]/70">
              <li><a href="#collections" className="hover:text-white transition">Moonlit Diya Sets</a></li>
              <li><a href="#collections" className="hover:text-white transition">Resin Coasters &amp; Platters</a></li>
              <li><a href="#collections" className="hover:text-white transition">Zardozi Embroidery</a></li>
              <li><a href="#collections" className="hover:text-white transition">Festive Gift Boxes</a></li>
            </ul>
          </div>

          {/* Occasions */}
          <div className="space-y-2">
            <div className="font-serif text-sm font-bold text-[#F3E3B5] uppercase tracking-wider">
              Occasions
            </div>
            <ul className="space-y-1.5 text-[#E8DDCF]/70">
              <li><a href="#occasions" className="hover:text-white transition">Wedding Favors &amp; Return Gifts</a></li>
              <li><a href="#occasions" className="hover:text-white transition">Diwali Festive Gifting</a></li>
              <li><a href="#occasions" className="hover:text-white transition">Housewarming Keepsakes</a></li>
              <li><a href="#occasions" className="hover:text-white transition">Corporate Custom Orders</a></li>
            </ul>
          </div>

          {/* Studio & Contact */}
          <div className="space-y-2">
            <div className="font-serif text-sm font-bold text-[#F3E3B5] uppercase tracking-wider">
              Studio Portal
            </div>
            <p className="text-[#E8DDCF]/70 leading-relaxed">
              Manage inventory, track workshop production, and generate tax invoices.
            </p>
            <div className="pt-2">
              <Link
                href="/studio"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold border border-[#D4AF37]/40 transition"
              >
                <span>Open Business Studio</span>
                <ExternalLink size={12} className="text-[#D4AF37]" />
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-[#4A121E] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#E8DDCF]/60 gap-3">
          <div>
            © {new Date().getFullYear()} VEDH Artistry (vedhartistry.com). All rights reserved.
          </div>
          <div className="italic text-[#D4AF37]">
            Handcrafted with love in India • Preserving heritage through art
          </div>
        </div>
      </footer>
    </div>
  );
}
