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
  ExternalLink,
  Star,
  Award
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { initialProducts } from '@/lib/mockData';
import { Product } from '@/lib/types';

export default function Storefront() {
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');

  // Bulk Order Form State
  const [bulkOccasion, setBulkOccasion] = useState('Wedding Return Gifts');
  const [bulkQty, setBulkQty] = useState('50 - 100 sets');
  const [bulkCraft, setBulkCraft] = useState('The Golden Lotus Diya Sets');
  const [targetDate, setTargetDate] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Filter products by category
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
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-[#3D0E18] text-[#F3E3B5] px-4 py-2 text-center text-xs tracking-wider flex items-center justify-center space-x-2 border-b border-[#D4AF37]/30">
        <Sparkles size={13} className="text-[#D4AF37]" />
        <span>VEDH Artistry • Little things, made meaningful • Bespoke Wedding Return Gifts &amp; Festive Collections</span>
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
              <p className="text-[10px] text-[#7A6E6E] tracking-wider italic">
                Little things, made meaningful.
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-7 text-xs uppercase tracking-widest font-semibold text-[#541523]">
            <a href="#signature" className="hover:text-[#A87E1F] transition text-[#8F243C]">
              Signature Diya Sets
            </a>
            <a href="#collections" className="hover:text-[#A87E1F] transition">
              Collections
            </a>
            <a href="#occasions" className="hover:text-[#A87E1F] transition">
              Occasions
            </a>
            <a href="#bulk-gifting" className="hover:text-[#A87E1F] transition">
              Bulk &amp; Return Gifts
            </a>
            <a href="#heritage" className="hover:text-[#A87E1F] transition">
              Our Soul
            </a>
          </nav>

          {/* Actions & Studio Access */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => openWhatsApp('Hello Vedh Artistry! I would like to explore bespoke handcrafted return gifts.')}
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

      {/* 3. HERO SECTION — Royal Indian Luxury with Master Visual */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#4A121E] via-[#541523] to-[#3D0E18] text-white py-12 sm:py-20 px-4 sm:px-8 border-b-4 border-[#D4AF37]">
        {/* Subtle Decorative Backdrop Texture */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
          {/* Left Column: Brand Story & Call to Actions (7 cols on lg) */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            {/* Slogan Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#2B0B12]/80 border border-[#D4AF37]/50 shadow-inner text-[#F3E3B5] text-xs font-semibold tracking-widest uppercase">
              <Sparkles size={14} className="text-[#D4AF37]" />
              <span>Little things, made meaningful.</span>
              <Sparkles size={14} className="text-[#D4AF37]" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#FDFBF7] tracking-tight leading-tight sm:leading-none">
              Traditions Crafted into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F3E3B5] via-[#D4AF37] to-[#E9D08A] italic">
                Designer Masterpieces.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#E8DDCF]/90 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
              Welcome to <strong className="font-semibold text-white">VEDH</strong>. We celebrate Indian heritage through handcrafted luxury — from multi-petaled golden lotus diyas and botanical soy wax candles to pearl-encrusted return gift hampers designed for life’s most auspicious celebrations.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a
                href="#bulk-gifting"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C69C31] text-[#2B0B12] font-semibold text-xs tracking-wider uppercase hover:shadow-lg hover:shadow-[#D4AF37]/20 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
              >
                <Gift size={16} />
                <span>Bespoke &amp; Return Gifts</span>
              </a>

              <a
                href="#signature"
                className="w-full sm:w-auto px-7 py-3 rounded-xl border border-[#D4AF37]/60 text-[#FDFBF7] hover:bg-[#3D0E18] font-semibold text-xs tracking-wider uppercase transition flex items-center justify-center space-x-2"
              >
                <span>View Signature Diya Sets</span>
                <ArrowRight size={14} />
              </a>
            </div>

            {/* 3 Pillars Footer */}
            <div className="pt-6 border-t border-[#6E1C30]/60 grid grid-cols-3 gap-4 text-center lg:text-left text-xs text-[#E8DDCF]">
              <div>
                <span className="font-serif font-bold text-white text-sm block">100% Pure</span>
                <span className="text-[11px] text-[#E8DDCF]/70">Natural Soy Wax</span>
              </div>
              <div>
                <span className="font-serif font-bold text-white text-sm block">Hand-Embellished</span>
                <span className="text-[11px] text-[#E8DDCF]/70">Seed Pearls &amp; Filigree</span>
              </div>
              <div>
                <span className="font-serif font-bold text-white text-sm block">Pan-India</span>
                <span className="text-[11px] text-[#E8DDCF]/70">Luxury Rigid Box Delivery</span>
              </div>
            </div>
          </div>

          {/* Right Column: The Master Photograph (5 cols on lg) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md group">
              {/* Golden Ambient Glow */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-[#D4AF37] via-[#F3E3B5] to-[#C69C31] rounded-3xl blur-md opacity-40 group-hover:opacity-60 transition duration-500" />

              {/* Master Image Container */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#D4AF37] shadow-2xl bg-[#3D0E18]">
                <Image
                  src="/hero-vedh.jpg"
                  alt="VEDH Signature Diya Collection - Little things, made meaningful."
                  width={724}
                  height={1024}
                  className="w-full h-auto object-cover group-hover:scale-[1.02] transition duration-500"
                  priority
                />

                {/* Floating Bottom Card */}
                <div className="absolute bottom-3 inset-x-3 p-3.5 bg-[#2B0B12]/85 backdrop-blur-md rounded-xl border border-[#D4AF37]/50 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold block">
                      Artisan Spotlight
                    </span>
                    <span className="font-serif text-xs font-bold text-[#FDFBF7]">
                      The Signature Festive Diya Ensemble
                    </span>
                  </div>
                  <a
                    href="#signature"
                    className="px-2.5 py-1 rounded-md bg-[#D4AF37] text-[#2B0B12] text-[10px] font-bold tracking-wider uppercase hover:bg-white transition"
                  >
                    Explore
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE SIGNATURE COLLECTION (Detailed breakdown of pieces in the photograph) */}
      <section id="signature" className="py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-semibold tracking-widest uppercase text-[#8F243C] mb-1">
            Featured In The Hero Ensemble
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C181B]">
            The Signature Diya &amp; Candle Creations
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#7A6E6E]">
            Each piece is individually handcrafted with layered petal trims, seed pearl borders, and hand-sculpted floral candles. Perfect for Diwali pooja decor and wedding return gifts.
          </p>
        </div>

        {/* 6 Curated Showcase Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-[#E8DDCF] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Visual Header */}
                <div className="h-44 bg-gradient-to-br from-[#FAF0E6] via-[#F4EAE1] to-[#EBDCCB] relative flex items-center justify-center p-6 border-b border-[#E8DDCF]">
                  <div className="text-center">
                    <span className="font-serif italic text-2xl text-[#541523]/40 tracking-wider">
                      VEDH
                    </span>
                    <div className="mt-1 text-[11px] uppercase tracking-widest text-[#8F243C] font-semibold">
                      {product.category}
                    </div>
                  </div>

                  <span className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#541523] text-[#F3E3B5] border border-[#D4AF37]/50">
                    Handmade
                  </span>
                </div>

                {/* Body */}
                <div className="p-6">
                  <h3 className="font-serif text-lg font-bold text-[#2C181B] group-hover:text-[#8F243C] transition">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-xs text-[#7A6E6E] leading-relaxed line-clamp-3">
                    {product.description}
                  </p>
                </div>
              </div>

              {/* Price & Action */}
              <div className="p-6 pt-0 border-t border-[#F2EBE0] mt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#7A6E6E] uppercase tracking-wider block">Price</span>
                  <span className="font-serif text-xl font-bold text-[#2C181B]">
                    {formatINR(product.price)}
                  </span>
                </div>

                <button
                  onClick={() => openWhatsApp(`Hello Vedh Artistry! I am interested in inquiring about "${product.name}" (${formatINR(product.price)}).`)}
                  className="px-3.5 py-2 rounded-xl bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide transition shadow-sm flex items-center space-x-1.5"
                >
                  <MessageCircle size={13} className="text-[#F3E3B5]" />
                  <span>Inquire / Customize</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. OCCASION & EVENT CURATOR */}
      <section id="occasions" className="py-16 bg-[#F4EFEA] border-y border-[#E8DDCF] px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-semibold tracking-widest uppercase text-[#8F243C] mb-1">
              Curated For Sacred Moments
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C181B]">
              Celebrations Enriched by Art
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#7A6E6E]">
              From personal gifts to 500-guest wedding return gift hampers, our creations are handcrafted to leave lasting memories.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-[#E8DDCF] p-6 shadow-sm hover:shadow-md transition group">
              <div className="w-12 h-12 rounded-xl bg-[#FAF0E6] border border-[#EBDCCB] flex items-center justify-center text-[#8F243C] mb-4 group-hover:scale-110 transition">
                <Flame size={24} />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#2C181B]">
                Diwali &amp; Festive Lights
              </h3>
              <p className="text-xs text-[#7A6E6E] mt-2 leading-relaxed">
                Golden lotus diyas, botanical soy candles, and brass hampers that fill homes with auspicious radiance.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8DDCF] p-6 shadow-sm hover:shadow-md transition group">
              <div className="w-12 h-12 rounded-xl bg-[#FAF0E6] border border-[#EBDCCB] flex items-center justify-center text-[#8F243C] mb-4 group-hover:scale-110 transition">
                <Heart size={24} />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#2C181B]">
                Weddings &amp; Return Gifts
              </h3>
              <p className="text-xs text-[#7A6E6E] mt-2 leading-relaxed">
                Bespoke guest return gifts, bridal favors, monogrammed initials, and custom color palettes.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8DDCF] p-6 shadow-sm hover:shadow-md transition group">
              <div className="w-12 h-12 rounded-xl bg-[#FAF0E6] border border-[#EBDCCB] flex items-center justify-center text-[#8F243C] mb-4 group-hover:scale-110 transition">
                <Sparkles size={24} />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#2C181B]">
                Griha Pravesh &amp; Home
              </h3>
              <p className="text-xs text-[#7A6E6E] mt-2 leading-relaxed">
                Blessed embroidery keepsakes, crystal resin geode platters, and scented heirloom decor.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8DDCF] p-6 shadow-sm hover:shadow-md transition group">
              <div className="w-12 h-12 rounded-xl bg-[#FAF0E6] border border-[#EBDCCB] flex items-center justify-center text-[#8F243C] mb-4 group-hover:scale-110 transition">
                <Gift size={24} />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#2C181B]">
                Corporate &amp; VIP Gifting
              </h3>
              <p className="text-xs text-[#7A6E6E] mt-2 leading-relaxed">
                Custom company logo debossing, bespoke rigid maroon boxes, and curated fragrance sets.
              </p>
            </div>
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
                      <option value="The Golden Lotus Diya Sets">The Golden Lotus Diya &amp; Scented Soy Candles</option>
                      <option value="Peach Blossom & Pearl Coasters">Peach Blossom &amp; Pearl Coasters with Gold Foiling</option>
                      <option value="Royal Banarasi Brocade Favors">Royal Banarasi Brocade Favors</option>
                      <option value="Curated Luxury Gift Hampers">The Vedh Signature Gift Box (Set of 5)</option>
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
          {/* Graphic badge */}
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden border-4 border-[#D4AF37] shadow-2xl bg-[#3D0E18]">
              <Image
                src="/hero-vedh.jpg"
                alt="VEDH Heritage Diya Sets"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Narrative */}
          <div className="w-full md:w-1/2 space-y-4">
            <div className="text-xs font-semibold tracking-widest uppercase text-[#8F243C]">
              Our Heritage &amp; Philosophy
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C181B] leading-tight">
              Little things, made meaningful.
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
              <li><a href="#signature" className="hover:text-white transition">The Golden Lotus Diya</a></li>
              <li><a href="#signature" className="hover:text-white transition">Peach Blossom &amp; Pearl Coasters</a></li>
              <li><a href="#signature" className="hover:text-white transition">Royal Banarasi Brocade Favors</a></li>
              <li><a href="#signature" className="hover:text-white transition">The Signature Gift Box</a></li>
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
