'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Expense, Supplier } from '@/lib/types';
import { round2, formatINR } from '@/lib/utils';
import { diffCalendarDays } from '@/lib/purchaseFormulas';
import { getPurchaseMedia, savePurchaseMedia } from '@/lib/purchaseMediaStore';
import { X, Calculator, FileText, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';

interface NewExpenseModalProps {
  initialExpense?: Expense | null;
  prefillSupplier?: Supplier | null;
  platforms?: string[];
  categories?: string[];
  paymentModes?: string[];
  purchaseStatuses?: string[];
  stockItemOptions?: string[];
  onClose: () => void;
  onSave: (
    expense: Omit<Expense, 'id'>,
    existingId?: string,
    options?: { linkBillToOrder?: boolean }
  ) => void;
}

export default function NewExpenseModal({
  initialExpense,
  prefillSupplier = null,
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
  stockItemOptions = [],
  onClose,
  onSave,
}: NewExpenseModalProps) {
  const isEditing = Boolean(initialExpense);
  const today = new Date().toISOString().split('T')[0];

  const matchedPlatform = prefillSupplier
    ? platforms.find(
        (p) =>
          p.toLowerCase() === prefillSupplier.name.toLowerCase() ||
          prefillSupplier.name.toLowerCase().includes(p.toLowerCase())
      ) ||
      (prefillSupplier.vendorType === 'Wholesale Market' ? 'Local market' : platforms[0])
    : platforms[0] || 'Amazon';

  const [title, setTitle] = useState(initialExpense?.title || '');
  const [date, setDate] = useState(initialExpense?.date || today);
  const [orderId, setOrderId] = useState(initialExpense?.orderId || '');
  const [platform, setPlatform] = useState(
    initialExpense?.platform || matchedPlatform || 'Amazon'
  );
  const [dimensions, setDimensions] = useState(initialExpense?.dimensions || '');
  const [category, setCategory] = useState<string>(
    initialExpense?.category || prefillSupplier?.category || categories[0] || 'Packaging'
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
  const [supplierName, setSupplierName] = useState(
    initialExpense?.supplierName || prefillSupplier?.name || ''
  );
  const [invoiceNo, setInvoiceNo] = useState(initialExpense?.invoiceNo || '');
  const [receiptFile, setReceiptFile] = useState(initialExpense?.receiptFile || '');
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(initialExpense?.receiptUrl);
  const [receiptMediaId, setReceiptMediaId] = useState<string | undefined>(
    initialExpense?.receiptMediaId
  );
  const [pendingBillFile, setPendingBillFile] = useState<File | null>(null);
  const [billPreviewSrc, setBillPreviewSrc] = useState<string | null>(
    initialExpense?.receiptUrl || null
  );
  const [linkBillToOrder, setLinkBillToOrder] = useState<boolean>(
    Boolean(initialExpense?.orderId)
  );

  const [imageRef, setImageRef] = useState(initialExpense?.imageRef || '');
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialExpense?.imageUrl);
  const [imageMediaId, setImageMediaId] = useState<string | undefined>(
    initialExpense?.imageMediaId
  );
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imagePreviewSrc, setImagePreviewSrc] = useState<string | null>(
    initialExpense?.imageUrl || null
  );

  const [savingMedia, setSavingMedia] = useState(false);
  const billInputRef = useRef<HTMLInputElement>(null);
  const productImgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const urlsToRevoke: string[] = [];

    async function hydratePreviews() {
      if (!pendingBillFile && initialExpense?.receiptMediaId) {
        try {
          const rec = await getPurchaseMedia(initialExpense.receiptMediaId);
          if (active && rec?.blob) {
            const url = URL.createObjectURL(rec.blob);
            urlsToRevoke.push(url);
            setBillPreviewSrc(url);
          } else if (active && rec?.publicUrl && !initialExpense.receiptUrl) {
            setBillPreviewSrc(rec.publicUrl);
          }
        } catch {
          // ignore
        }
      }
      if (!pendingImageFile && initialExpense?.imageMediaId) {
        try {
          const rec = await getPurchaseMedia(initialExpense.imageMediaId);
          if (active && rec?.blob) {
            const url = URL.createObjectURL(rec.blob);
            urlsToRevoke.push(url);
            setImagePreviewSrc(url);
          } else if (active && rec?.publicUrl && !initialExpense.imageUrl) {
            setImagePreviewSrc(rec.publicUrl);
          }
        } catch {
          // ignore
        }
      }
    }

    hydratePreviews();
    return () => {
      active = false;
      urlsToRevoke.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [
    initialExpense?.receiptMediaId,
    initialExpense?.imageMediaId,
    pendingBillFile,
    pendingImageFile,
  ]);
  const [contactDetails, setContactDetails] = useState(
    initialExpense?.contactDetails || ''
  );
  const initialDefaultUnits = initialExpense
    ? round2(
        Math.max(0, initialExpense.qty ?? 1) *
          (initialExpense.piecesPerPack && initialExpense.piecesPerPack > 0
            ? initialExpense.piecesPerPack
            : 1)
      )
    : 0;
  const hasCustomStockQty =
    initialExpense?.stockQtyReceived !== undefined &&
    round2(initialExpense.stockQtyReceived) !== initialDefaultUnits;

  const [stockItem, setStockItem] = useState(initialExpense?.stockItem || '');
  const [stockQtyStr, setStockQtyStr] = useState(
    hasCustomStockQty ? String(initialExpense?.stockQtyReceived) : ''
  );
  const [appliedToStock, setAppliedToStock] = useState<boolean>(
    initialExpense?.appliedToStock ?? !initialExpense
  );
  const [notes, setNotes] = useState(initialExpense?.notes || '');

  // Live spreadsheet formulas preview
  const liveFormulas = useMemo(() => {
    const qty = Math.max(0, parseFloat(qtyStr) || 0);
    const parsedPieces = parseFloat(piecesStr);
    const piecesPerPack = parsedPieces > 0 ? parsedPieces : 1;
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

  useEffect(() => {
    if (!pendingBillFile) return;
    const url = URL.createObjectURL(pendingBillFile);
    setBillPreviewSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingBillFile]);

  useEffect(() => {
    if (!pendingImageFile) return;
    const url = URL.createObjectURL(pendingImageFile);
    setImagePreviewSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingImageFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || savingMedia) return;

    setSavingMedia(true);
    try {
      let nextReceiptFile = receiptFile.trim() || undefined;
      let nextReceiptUrl = receiptUrl;
      let nextReceiptMediaId = receiptMediaId;

      if (pendingBillFile) {
        const displayName = receiptFile.trim() || pendingBillFile.name;
        const stored = await savePurchaseMedia(
          pendingBillFile,
          displayName,
          'bill'
        );
        nextReceiptFile = displayName;
        nextReceiptMediaId = stored.id;
        nextReceiptUrl = stored.publicUrl || undefined;
      }

      let nextImageRef = imageRef.trim() || undefined;
      let nextImageUrl = imageUrl;
      let nextImageMediaId = imageMediaId;

      if (pendingImageFile) {
        const displayName = imageRef.trim() || pendingImageFile.name;
        const stored = await savePurchaseMedia(
          pendingImageFile,
          displayName,
          'product',
          imageMediaId
        );
        nextImageRef = displayName;
        nextImageMediaId = stored.id;
        nextImageUrl = stored.publicUrl || undefined;
      }

      const trimmedOrderId = orderId.trim();
      const shouldLinkOrder = Boolean(
        linkBillToOrder &&
          trimmedOrderId &&
          (nextReceiptFile || nextReceiptUrl || nextReceiptMediaId)
      );

      onSave(
        {
          orderId: trimmedOrderId || undefined,
          platform: platform.trim(),
          category,
          title: title.trim(),
          dimensions: dimensions.trim() || undefined,
          qty: liveFormulas.qty,
          piecesPerPack: liveFormulas.piecesPerPack,
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
          receiptFile: nextReceiptFile,
          receiptUrl: nextReceiptUrl,
          receiptMediaId: nextReceiptMediaId,
          imageRef: nextImageRef,
          imageUrl: nextImageUrl,
          imageMediaId: nextImageMediaId,
          contactDetails: contactDetails.trim() || undefined,
          stockItem: stockItem.trim() || undefined,
          stockQtyReceived: stockQtyStr.trim()
            ? parseFloat(stockQtyStr) || undefined
            : stockItem.trim()
            ? liveFormulas.totalUnits
            : undefined,
          appliedToStock: Boolean(stockItem.trim()) && appliedToStock,
          notes: notes.trim() || undefined,
        },
        initialExpense?.id,
        { linkBillToOrder: shouldLinkOrder }
      );

      onClose();
    } finally {
      setSavingMedia(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-[#E8DDCF] shadow-2xl overflow-hidden">
        <div className="shrink-0 bg-[#FAF5EE] border-b border-[#E8DDCF] px-5 sm:px-6 py-3.5 flex items-center justify-between">
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

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col text-xs">
          <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
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
                min="0.01"
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

          {/* Row 6: Dual Upload Provisions (1. Purchase Bill / Invoice, 2. Individual Product Image) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Provision 1: Bill / Invoice Upload */}
            <div className="border border-[#E8DDCF] bg-[#FCF9F4] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[#423A3A] font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#541523]" />
                  <span>1. Bill / Invoice Upload</span>
                </label>
                {(receiptFile || billPreviewSrc) && (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingBillFile(null);
                      setReceiptFile('');
                      setReceiptUrl(undefined);
                      setReceiptMediaId(undefined);
                      setBillPreviewSrc(null);
                    }}
                    className="text-[11px] text-red-700 hover:underline inline-flex items-center gap-0.5"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={billInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  aria-label="Upload Bill or Invoice file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setPendingBillFile(f);
                    setReceiptFile(f.name);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => billInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#541523] text-white text-[11px] font-semibold hover:bg-[#6E1C30] shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {billPreviewSrc ? 'Change Bill' : 'Upload Bill'}
                </button>
                <input
                  type="text"
                  placeholder="Bill filename or ref"
                  value={receiptFile}
                  onChange={(e) => setReceiptFile(e.target.value)}
                  className="flex-1 min-w-0 px-2.5 py-1.5 border rounded-lg border-[#D9C9B4] bg-white text-[11px] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              {billPreviewSrc && (
                <div className="flex items-center gap-2 bg-white border border-[#E8DEC9] rounded-lg p-1.5">
                  {receiptFile.toLowerCase().endsWith('.pdf') ? (
                    <FileText className="w-6 h-6 text-[#541523] shrink-0" />
                  ) : (
                    <img
                      src={billPreviewSrc}
                      alt={receiptFile || 'Bill preview'}
                      className="w-9 h-9 object-cover rounded border border-[#D9C9B4] shrink-0"
                    />
                  )}
                  <span className="text-[11px] text-emerald-700 font-medium truncate">
                    {pendingBillFile ? `Ready to attach: ${pendingBillFile.name}` : `Attached: ${receiptFile}`}
                  </span>
                </div>
              )}

              {orderId.trim() && (
                <label className="flex items-center gap-1.5 text-[11px] text-[#541523] cursor-pointer select-none pt-0.5">
                  <input
                    type="checkbox"
                    checked={linkBillToOrder}
                    onChange={(e) => setLinkBillToOrder(e.target.checked)}
                    className="accent-[#541523]"
                  />
                  <span>Link bill to all items in {orderId.trim()}</span>
                </label>
              )}
            </div>

            {/* Provision 2: Individual Product Image Upload */}
            <div className="border border-[#E8DDCF] bg-[#FCF9F4] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[#423A3A] font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#541523]" />
                  <span>2. Product Image Upload</span>
                </label>
                {(imageRef || imagePreviewSrc) && (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingImageFile(null);
                      setImageRef('');
                      setImageUrl(undefined);
                      setImageMediaId(undefined);
                      setImagePreviewSrc(null);
                    }}
                    className="text-[11px] text-red-700 hover:underline inline-flex items-center gap-0.5"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={productImgInputRef}
                  type="file"
                  accept="image/*"
                  aria-label="Upload Individual Product Image"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setPendingImageFile(f);
                    setImageRef(f.name);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => productImgInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#541523] bg-white text-[#541523] text-[11px] font-semibold hover:bg-[#541523]/5 shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {imagePreviewSrc ? 'Change Photo' : 'Upload Photo'}
                </button>
                <input
                  type="text"
                  placeholder="Product photo filename"
                  value={imageRef}
                  onChange={(e) => setImageRef(e.target.value)}
                  className="flex-1 min-w-0 px-2.5 py-1.5 border rounded-lg border-[#D9C9B4] bg-white text-[11px] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              {imagePreviewSrc && (
                <div className="flex items-center gap-2 bg-white border border-[#E8DEC9] rounded-lg p-1.5">
                  <img
                    src={imagePreviewSrc}
                    alt={imageRef || 'Product image preview'}
                    className="w-9 h-9 object-cover rounded border border-[#D9C9B4] shrink-0"
                  />
                  <span className="text-[11px] text-emerald-700 font-medium truncate">
                    {pendingImageFile ? `Ready to attach: ${pendingImageFile.name}` : `Attached: ${imageRef}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Row 7: Contact / Notes */}
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

          {/* Stock Ledger Link (Optional: Incoming vs Received Post-Count) */}
          <div className="bg-[#FAF5EE] border border-[#E8DDCF] rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#2C181B]">
                Stock Ledger Link (Feeds Incoming &amp; Received Stock)
              </span>
              <span className="text-[10px] text-[#7A6E6E]">
                Ordered/Shipped → Incoming · Delivered + Checked → Adds to Shelf In Hand
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-[#423A3A] font-medium mb-1">
                  Linked Stock Material
                </label>
                <input
                  list="vedh-stock-item-options"
                  value={stockItem}
                  onChange={(e) => setStockItem(e.target.value)}
                  placeholder="Leave blank or pick Stock material"
                  className="w-full px-2.5 py-1.5 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
                <datalist id="vedh-stock-item-options">
                  {stockItemOptions.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-[#423A3A] font-medium mb-1">
                  Stock Units (Default: {liveFormulas.totalUnits})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={stockQtyStr}
                  onChange={(e) => setStockQtyStr(e.target.value)}
                  placeholder={String(liveFormulas.totalUnits)}
                  className="w-full px-2.5 py-1.5 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>
              <label className="flex items-center gap-2 text-[#423A3A] pt-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={appliedToStock}
                  onChange={(e) => setAppliedToStock(e.target.checked)}
                  className="rounded border-[#D9C9B4] text-[#541523] focus:ring-[#541523]"
                />
                <span>Add to Physical In Hand when Delivered (not already counted)</span>
              </label>
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
              disabled={savingMedia}
              className="px-5 py-2 bg-[#541523] text-white rounded-lg font-semibold hover:bg-[#6E1C30] disabled:opacity-60"
            >
              {savingMedia
                ? 'Saving Files...'
                : isEditing
                ? 'Update Purchase'
                : 'Save Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
