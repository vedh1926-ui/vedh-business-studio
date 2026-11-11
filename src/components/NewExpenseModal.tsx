'use client';

import React, { useMemo, useState } from 'react';
import { Expense } from '@/lib/types';
import { round2, formatINR } from '@/lib/utils';
import { diffCalendarDays } from '@/lib/purchaseFormulas';
import { X, Calculator } from 'lucide-react';

interface NewExpenseModalProps {
  initialExpense?: Expense | null;
  platforms?: string[];
  categories?: string[];
  paymentModes?: string[];
  purchaseStatuses?: string[];
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'>, existingId?: string) => void;
}

export default function NewExpenseModal({
  initialExpense,
  platforms = [
    'Amazon',
    'Meesho',
    'CSC',
    'Bakematic Digital PvtLtd',
    'Local market',
    'Outstation Market',
    'Luxury Deco',
    'Just Kraft',
    'Flipkart',
    'IndiaMART',
  ],
  categories = ['Wax / Candles', 'Packaging', 'Resin Supplies', 'Fabric', 'Tools', 'Other'],
  paymentModes = ['UPI', 'Cash', 'Card', 'Net Banking', 'Cash on Delivery', 'Other'],
  purchaseStatuses = [
    'Ordered',
    'Shipped',
    'Delayed',
    'Delivered',
    'Self Pick-Up',
    'Rapido',
    'Replaced',
    'Returned',
    'Refund Pending',
    'Cancelled',
  ],
  onClose,
  onSave,
}: NewExpenseModalProps) {
  const isEditing = Boolean(initialExpense);
  const today = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState(initialExpense?.title || '');
  const [date, setDate] = useState(initialExpense?.date || today);
  const [orderId, setOrderId] = useState(initialExpense?.orderId || '');
  const [platform, setPlatform] = useState(
    initialExpense?.platform || platforms[0] || 'Amazon'
  );
  const [dimensions, setDimensions] = useState(initialExpense?.dimensions || '');
  const [category, setCategory] = useState<string>(
    initialExpense?.category || categories[0] || 'Packaging'
  );
  const [qtyStr, setQtyStr] = useState(String(initialExpense?.qty ?? 1));
  const [piecesStr, setPiecesStr] = useState(String(initialExpense?.piecesPerPack ?? 1));
  const [unitPriceStr, setUnitPriceStr] = useState(
    initialExpense?.unitPrice !== undefined
      ? String(initialExpense.unitPrice)
      : initialExpense
      ? String(initialExpense.amount)
      : ''
  );
  const [shippingStr, setShippingStr] = useState(String(initialExpense?.shipping ?? 0));
  const [paymentMode, setPaymentMode] = useState<string>(
    initialExpense?.paymentMode || paymentModes[0] || 'UPI'
  );
  const [purchaseStatus, setPurchaseStatus] = useState<string>(
    initialExpense?.purchaseStatus || purchaseStatuses[0] || 'Ordered'
  );
  const [expectedDelivery, setExpectedDelivery] = useState(
    initialExpense?.expectedDelivery || ''
  );
  const [actualDelivery, setActualDelivery] = useState(
    initialExpense?.actualDelivery || ''
  );
  const [supplierName, setSupplierName] = useState(initialExpense?.supplierName || '');
  const [invoiceNo, setInvoiceNo] = useState(initialExpense?.invoiceNo || '');
  const [receiptFile, setReceiptFile] = useState(initialExpense?.receiptFile || '');
  const [imageRef, setImageRef] = useState(initialExpense?.imageRef || '');
  const [contactDetails, setContactDetails] = useState(
    initialExpense?.contactDetails || ''
  );
  const [notes, setNotes] = useState(initialExpense?.notes || '');

  // Live spreadsheet formulas preview
  const liveFormulas = useMemo(() => {
    const qty = Math.max(0, parseFloat(qtyStr) || 0);
    const piecesPerPack = Math.max(1, parseFloat(piecesStr) || 1);
    const unitPrice = parseFloat(unitPriceStr) || 0;
    const shipping = parseFloat(shippingStr) || 0;
    const subtotal = round2(qty * unitPrice);
    const totalCost = round2(subtotal + shipping);
    const totalUnits = round2(qty * piecesPerPack);
    const costPerUnit = totalUnits > 0 ? round2(totalCost / totalUnits) : 0;
    const daysTaken = diffCalendarDays(date, actualDelivery);
    const delayDays = diffCalendarDays(expectedDelivery, actualDelivery);

    return {
      qty,
      piecesPerPack,
      unitPrice,
      shipping,
      subtotal,
      totalCost,
      totalUnits,
      costPerUnit,
      daysTaken,
      delayDays,
    };
  }, [qtyStr, piecesStr, unitPriceStr, shippingStr, date, expectedDelivery, actualDelivery]);

  const ensureOption = (list: string[], current: string) =>
    current && !list.includes(current) ? [current, ...list] : list;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(
      {
        orderId: orderId.trim() || undefined,
        platform: platform.trim(),
        category,
        title: title.trim(),
        dimensions: dimensions.trim() || undefined,
        qty: liveFormulas.qty || 1,
        piecesPerPack: liveFormulas.piecesPerPack || 1,
        unitPrice: liveFormulas.unitPrice,
        shipping: liveFormulas.shipping,
        amount: liveFormulas.totalCost,
        date: date || today,
        expectedDelivery: expectedDelivery || undefined,
        actualDelivery: actualDelivery || undefined,
        supplierName: (supplierName.trim() || platform.trim()) || undefined,
        paymentMode: paymentMode || 'UPI',
        purchaseStatus,
        invoiceNo: invoiceNo.trim() || undefined,
        receiptFile: receiptFile.trim() || undefined,
        imageRef: imageRef.trim() || undefined,
        contactDetails: contactDetails.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      initialExpense?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#E8DDCF] shadow-2xl overflow-hidden my-6">
        <div className="bg-[#FAF5EE] border-b border-[#E8DDCF] px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#2C181B]">
              {isEditing ? 'Edit Purchase / Expense Record' : 'Record Purchase / Workshop Expense'}
            </h3>
            <p className="text-[11px] text-[#7A6E6E]">
              Auto-calculates Total Cost, Cost/Unit, Days Taken &amp; Platform Summary formulas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
          {/* Row 1: Item & Platform */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[#423A3A] font-semibold mb-1">
                Item / Material Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Divyakosh Golden Folding Gift Boxes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Order Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
          </div>

          {/* Row 2: Platform, Category, Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Platform / Source
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                aria-label="Platform or source"
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
              >
                {ensureOption(platforms, platform).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Purchase category"
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
              >
                {ensureOption(categories, category).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Dimensions / Pack Spec
              </label>
              <input
                type="text"
                placeholder="e.g. 12 x 12 x 5 cm"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
          </div>

          {/* Row 3: Pricing & Quantity Formula Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#F2EBE0]">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Qty (Packs / Items)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={qtyStr}
                onChange={(e) => setQtyStr(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Pieces / Pack
              </label>
              <input
                type="number"
                step="any"
                min="1"
                value={piecesStr}
                onChange={(e) => setPiecesStr(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Unit Price (₹) *
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="266"
                value={unitPriceStr}
                onChange={(e) => setUnitPriceStr(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Shipping / Adj (₹)
              </label>
              <input
                type="number"
                step="any"
                placeholder="0"
                value={shippingStr}
                onChange={(e) => setShippingStr(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
          </div>

          {/* Live Formula Bar */}
          <div className="bg-[#FAF5EE] border border-[#E8DDCF] rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-[#541523]">
              <Calculator size={15} />
              <span className="font-semibold">
                Total Cost: <span className="font-serif text-sm font-bold">{formatINR(liveFormulas.totalCost, 2)}</span>
              </span>
              <span className="text-[11px] text-[#7A6E6E]">
                ({liveFormulas.qty} × ₹{liveFormulas.unitPrice} {liveFormulas.shipping >= 0 ? `+ ₹${liveFormulas.shipping}` : `- ₹${Math.abs(liveFormulas.shipping)}`})
              </span>
            </div>

            <div className="text-[11px] text-[#423A3A] flex items-center space-x-3">
              <span>
                Units Received: <strong className="text-[#2C181B]">{liveFormulas.totalUnits}</strong>
              </span>
              <span>
                Cost / Unit: <strong className="text-[#8F243C]">{formatINR(liveFormulas.costPerUnit, 2)}</strong>
              </span>
            </div>
          </div>

          {/* Row 4: Payment Mode, Purchase Status, Dates */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
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
                {ensureOption(paymentModes, paymentMode).map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
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
                {ensureOption(purchaseStatuses, purchaseStatus).map((ps) => (
                  <option key={ps} value={ps}>
                    {ps}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Expected Delivery
              </label>
              <input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Actual Delivery
              </label>
              <input
                type="date"
                value={actualDelivery}
                onChange={(e) => setActualDelivery(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
          </div>

          {(liveFormulas.daysTaken !== null || liveFormulas.delayDays !== null) && (
            <div className="text-[11px] flex items-center space-x-4 text-[#635B5B] bg-[#FCFAF7] border border-[#E8DDCF] rounded-lg px-3 py-2">
              {liveFormulas.daysTaken !== null && (
                <span>
                  Days Taken: <strong className="text-[#2C181B]">{liveFormulas.daysTaken}d</strong>
                </span>
              )}
              {liveFormulas.delayDays !== null && (
                <span>
                  Schedule Variance:{' '}
                  <strong
                    className={
                      liveFormulas.delayDays > 0
                        ? 'text-amber-700'
                        : liveFormulas.delayDays < 0
                        ? 'text-emerald-700'
                        : 'text-[#2C181B]'
                    }
                  >
                    {liveFormulas.delayDays > 0
                      ? `+${liveFormulas.delayDays}d Late`
                      : liveFormulas.delayDays < 0
                      ? `${Math.abs(liveFormulas.delayDays)}d Early`
                      : 'On Time (0d)'}
                  </strong>
                </span>
              )}
            </div>
          )}

          {/* Row 5: Order ID, Invoice, Supplier / Shop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#F2EBE0]">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Order ID / Ref
              </label>
              <input
                type="text"
                placeholder="Order Number: 406-..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Vendor / Shop Name
              </label>
              <input
                type="text"
                placeholder="e.g. NandiArts Stationery"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Invoice / Bill No.
              </label>
              <input
                type="text"
                placeholder="INV2627-7450"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
          </div>

          {/* Row 6: Receipt File, Image Ref, Contact / Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Receipt File / Link
              </label>
              <input
                type="text"
                placeholder="GoldGiftBoxRibbon.pdf"
                value={receiptFile}
                onChange={(e) => setReceiptFile(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Image Ref
              </label>
              <input
                type="text"
                placeholder="ImageKRAFT.jpeg"
                value={imageRef}
                onChange={(e) => setImageRef(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>

            <div>
              <label className="block text-[#423A3A] font-semibold mb-1">
                Contact / Notes
              </label>
              <input
                type="text"
                placeholder="Phone, email or remarks"
                value={notes || contactDetails}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setContactDetails('');
                }}
                className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
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
              {isEditing ? 'Update Purchase' : 'Save Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
