'use client';

import React, { useMemo, useState } from 'react';
import { Expense } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { computePurchaseRowMetrics } from '@/lib/purchaseFormulas';
import { resolveEffectiveReceipt, normalizeOrderNumberKey } from '@/lib/purchaseMediaStore';
import {
  X,
  Pencil,
  Trash2,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Package,
  Calendar,
  Store,
  CreditCard,
  Truck,
  Layers,
  Download,
  AlertTriangle,
  Receipt,
  Tag,
  Hash,
} from 'lucide-react';

interface ExpenseDetailModalProps {
  expense: Expense;
  allExpenses?: Expense[];
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onSelectSiblingExpense?: (expense: Expense) => void;
  onPreviewBill?: (expense: Expense) => void;
  onPreviewImage?: (expense: Expense) => void;
}

export default function ExpenseDetailModal({
  expense,
  allExpenses = [],
  onClose,
  onEdit,
  onDelete,
  onSelectSiblingExpense,
  onPreviewBill,
  onPreviewImage,
}: ExpenseDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const metrics = useMemo(() => computePurchaseRowMetrics(expense), [expense]);
  const effectiveBill = useMemo(
    () => resolveEffectiveReceipt(expense, allExpenses),
    [expense, allExpenses]
  );

  // Sibling items in the same purchase order
  const orderSiblings = useMemo(() => {
    const k = normalizeOrderNumberKey(expense.orderId);
    if (!k) return [];
    return allExpenses.filter((e) => e.id !== expense.id && normalizeOrderNumberKey(e.orderId) === k);
  }, [expense, allExpenses]);

  const totalOrderSpend = useMemo(() => {
    const allInOrder = [expense, ...orderSiblings];
    return allInOrder.reduce((acc, curr) => acc + (computePurchaseRowMetrics(curr).totalCost || 0), 0);
  }, [expense, orderSiblings]);

  const hasViewableBill = Boolean(effectiveBill.url || effectiveBill.mediaId);
  const hasBillRef = Boolean(effectiveBill.fileName || hasViewableBill);
  const hasViewableImg = Boolean(expense.imageUrl || expense.imageMediaId);
  const hasImgRef = Boolean(expense.imageRef || hasViewableImg);

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(expense.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-[#E8DDCF] overflow-hidden">
        {/* Pinned Header */}
        <div className="shrink-0 bg-[#FAF5EE] border-b border-[#E8DDCF] px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="min-w-0 pr-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FAF0E6] text-[#8F243C] border border-[#E8DDCF]">
                {expense.category}
              </span>
              {expense.orderId && (
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-[#541523] border border-[#D9C9B4] flex items-center gap-1">
                  <Hash size={11} />
                  <span>{expense.orderId}</span>
                </span>
              )}
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  metrics.isProblemOrder
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : metrics.isInTransit
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {expense.purchaseStatus || 'Delivered'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2C181B] truncate mt-1">
              {expense.title}
            </h2>
            <p className="text-xs text-[#7A6E6E] mt-0.5">
              Ordered {expense.date} • {expense.platform || 'Direct'}
              {expense.supplierName && expense.supplierName !== expense.platform
                ? ` (${expense.supplierName})`
                : ''}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => onEdit(expense)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold shadow-sm transition"
              title="Edit purchase details"
            >
              <Pencil size={13} />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* Main Financial KPI Banner */}
          <div className="bg-gradient-to-br from-[#FCFAF7] to-[#F7F2EB] border border-[#E8DDCF] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-[#7A6E6E] font-medium uppercase tracking-wider">
                Total Purchase Cost
              </span>
              <div className="text-3xl font-serif font-bold text-[#8F243C] mt-0.5">
                {formatINR(metrics.totalCost, 2)}
              </div>
              <div className="text-[11px] text-[#7A6E6E] mt-1 flex flex-wrap items-center gap-1.5">
                <span>
                  Landed Rate: <strong className="text-[#2C181B]">{formatINR(metrics.costPerUnit, 2)}</strong> / unit
                </span>
                <span>•</span>
                <span>
                  {metrics.totalUnits} total unit{metrics.totalUnits !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="bg-white/80 border border-[#E8DDCF] rounded-lg p-3 sm:text-right space-y-1">
              <div className="text-[#541523] font-semibold">
                {metrics.qty} pack{metrics.qty !== 1 ? 's' : ''} × ₹{metrics.unitPrice}
              </div>
              <div className="text-[11px] text-[#7A6E6E]">
                {metrics.shipping !== 0 ? (
                  <span>
                    Shipping / Adjustments:{' '}
                    <strong className={metrics.shipping > 0 ? 'text-amber-800' : 'text-emerald-700'}>
                      {metrics.shipping > 0 ? `+₹${metrics.shipping}` : `-₹${Math.abs(metrics.shipping)}`}
                    </strong>
                  </span>
                ) : (
                  <span>Free shipping / No extra charges</span>
                )}
              </div>
              <div className="text-[11px] text-[#7A6E6E]">
                Payment:{' '}
                <strong className={expense.paymentMode === 'Unspecified' ? 'text-amber-700' : 'text-[#2C181B]'}>
                  {expense.paymentMode || 'Unspecified'}
                </strong>
              </div>
            </div>
          </div>

          {/* 2-Column Grid: Procurement & Item Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Item & Specifications */}
            <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-1.5 font-semibold text-[#541523] border-b border-[#F2EBE0] pb-2">
                <Package size={14} />
                <span>Item &amp; Specifications</span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-[10px] text-[#8C7D7D] uppercase tracking-wider">Item Name</div>
                  <div className="font-semibold text-[#2C181B] mt-0.5">{expense.title}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-[#8C7D7D] uppercase tracking-wider">Category</div>
                    <div className="font-medium text-[#2C181B] mt-0.5">{expense.category}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8C7D7D] uppercase tracking-wider">Dimensions / Specs</div>
                    <div className="font-medium text-[#2C181B] mt-0.5">{expense.dimensions || '—'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-[#8C7D7D] uppercase tracking-wider">Quantity Bought</div>
                    <div className="font-medium text-[#2C181B] mt-0.5">
                      {expense.qty ?? 1} {expense.qty === 1 ? 'pack / item' : 'packs / items'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8C7D7D] uppercase tracking-wider">Pieces Per Pack</div>
                    <div className="font-medium text-[#2C181B] mt-0.5">
                      {expense.piecesPerPack ?? 1} pcs/pack
                    </div>
                  </div>
                </div>

                {expense.stockItem && (
                  <div className="bg-[#FAF6F0] border border-[#E8DDCF] rounded-lg p-2.5 mt-2">
                    <div className="text-[10px] font-semibold text-[#541523] flex items-center space-x-1">
                      <Layers size={12} />
                      <span>Stock Ledger Link</span>
                    </div>
                    <div className="font-medium text-[#2C181B] mt-1">{expense.stockItem}</div>
                    <div className="text-[10px] text-[#7A6E6E] mt-0.5">
                      {expense.appliedToStock
                        ? `Received: ${expense.stockQtyReceived ?? metrics.totalUnits} units (counted in Physical In Hand)`
                        : `Incoming tracker: ${metrics.totalUnits} units pending arrival`}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Procurement & Vendor Reference */}
            <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-1.5 font-semibold text-[#541523] border-b border-[#F2EBE0] pb-2">
                <Store size={14} />
                <span>Procurement &amp; Vendor</span>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-[#8C7D7D] uppercase tracking-wider">Order No. / Ref</div>
                    <div className="font-mono font-semibold text-[#541523] mt-0.5">
                      {expense.orderId || 'Unassigned'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8C7D7D] uppercase tracking-wider">Invoice / Bill No.</div>
                    <div className="font-mono text-[#2C181B] mt-0.5">{expense.invoiceNo || '—'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-[#8C7D7D] uppercase tracking-wider">Platform / Source</div>
                    <div className="font-semibold text-[#2C181B] mt-0.5">{expense.platform || 'Direct'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8C7D7D] uppercase tracking-wider">Supplier / Vendor</div>
                    <div className="font-medium text-[#2C181B] mt-0.5">
                      {expense.supplierName || expense.platform || '—'}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#8C7D7D] uppercase tracking-wider">Contact / Counter Ref</div>
                  <div className="font-medium text-[#2C181B] mt-0.5">{expense.contactDetails || '—'}</div>
                </div>

                <div>
                  <div className="text-[10px] text-[#8C7D7D] uppercase tracking-wider">Payment Mode</div>
                  <div className="mt-0.5">
                    {expense.paymentMode === 'Unspecified' ? (
                      <span className="inline-flex items-center space-x-1 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                        <AlertTriangle size={11} />
                        <span>Payment Mode Missing</span>
                      </span>
                    ) : (
                      <span className="font-medium text-[#2C181B]">{expense.paymentMode || 'UPI'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fulfillment & Delivery Telemetry */}
          <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-1.5 font-semibold text-[#541523] border-b border-[#F2EBE0] pb-2">
              <Truck size={14} />
              <span>Fulfillment &amp; Delivery Telemetry</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <div className="text-[10px] text-[#8C7D7D] uppercase tracking-wider">Order Date</div>
                <div className="font-semibold text-[#2C181B] mt-0.5">{expense.date}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#8C7D7D] uppercase tracking-wider">Expected Delivery</div>
                <div className="font-medium text-[#2C181B] mt-0.5">{expense.expectedDelivery || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#8C7D7D] uppercase tracking-wider">Actual Delivery</div>
                <div className="font-medium text-[#2C181B] mt-0.5">{expense.actualDelivery || 'Pending'}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#8C7D7D] uppercase tracking-wider">Delivery Status</div>
                <div className="mt-0.5">
                  {metrics.delayDays !== null ? (
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-semibold text-[11px] ${
                        metrics.isLate
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : metrics.isEarly
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {metrics.isLate
                        ? `+${metrics.delayDays}d Late (${metrics.daysTaken}d transit)`
                        : metrics.isEarly
                        ? `${Math.abs(metrics.delayDays)}d Early`
                        : `On Time (${metrics.daysTaken ?? 0}d)`}
                    </span>
                  ) : (
                    <span className="font-medium text-[#7A6E6E]">
                      {metrics.isInTransit ? 'In Transit' : 'Standard Delivery'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Attached Files & Proofs */}
          <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-1.5 font-semibold text-[#541523] border-b border-[#F2EBE0] pb-2">
              <Receipt size={14} />
              <span>Receipts &amp; Attachments</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Bill / Invoice */}
              <div className="border border-[#E8DDCF] rounded-lg p-3 bg-[#FAF8F5]">
                <div className="text-[11px] font-semibold text-[#541523] flex items-center space-x-1 mb-2">
                  <FileText size={13} />
                  <span>Purchase Bill / Invoice</span>
                </div>

                {hasBillRef ? (
                  <div className="space-y-2">
                    <div className="text-xs text-[#2C181B] font-medium break-all flex items-center gap-1.5">
                      <span className="truncate">{effectiveBill.fileName || 'Attached Receipt'}</span>
                      {effectiveBill.inheritedFromOrder && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-normal whitespace-nowrap">
                          Linked via {expense.orderId}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {hasViewableBill && onPreviewBill && (
                        <button
                          type="button"
                          onClick={() => onPreviewBill(expense)}
                          className="px-2.5 py-1 rounded bg-[#541523] hover:bg-[#6E1C30] text-white font-semibold text-[11px] transition inline-flex items-center gap-1"
                        >
                          <FileText size={11} />
                          <span>Preview Bill</span>
                        </button>
                      )}
                      {effectiveBill.url && (
                        <a
                          href={effectiveBill.url}
                          target="_blank"
                          rel="noreferrer"
                          download={effectiveBill.fileName || 'purchase_bill'}
                          className="px-2.5 py-1 rounded border border-[#D9C9B4] bg-white hover:bg-[#F2EBE0] text-[#541523] font-medium text-[11px] transition inline-flex items-center gap-1"
                        >
                          <ExternalLink size={11} />
                          <span>Open / Download</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-[#8C7D7D] text-[11px] italic">
                    No bill or receipt file attached. Click Edit to attach an invoice.
                  </div>
                )}
              </div>

              {/* Product Photo */}
              <div className="border border-[#E8DDCF] rounded-lg p-3 bg-[#FAF8F5]">
                <div className="text-[11px] font-semibold text-[#541523] flex items-center space-x-1 mb-2">
                  <ImageIcon size={13} />
                  <span>Product Photo / Proof</span>
                </div>

                {hasImgRef ? (
                  <div className="space-y-2">
                    <div className="text-xs text-[#2C181B] font-medium truncate">
                      {expense.imageRef || 'Product Photo'}
                    </div>
                    {expense.imageUrl && (
                      <div className="relative w-20 h-20 rounded-lg border border-[#D9C9B4] overflow-hidden bg-white">
                        <img
                          src={expense.imageUrl}
                          alt={expense.title}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                          onClick={() => onPreviewImage && onPreviewImage(expense)}
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {hasViewableImg && onPreviewImage && (
                        <button
                          type="button"
                          onClick={() => onPreviewImage(expense)}
                          className="px-2.5 py-1 rounded bg-[#FAF0E6] text-[#8F243C] border border-[#D9C9B4] hover:bg-[#F2EBE0] font-semibold text-[11px] transition inline-flex items-center gap-1"
                        >
                          <ImageIcon size={11} />
                          <span>View Photo</span>
                        </button>
                      )}
                      {expense.imageUrl && (
                        <a
                          href={expense.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={expense.imageRef || 'product_photo'}
                          className="px-2.5 py-1 rounded border border-[#D9C9B4] bg-white hover:bg-[#F2EBE0] text-[#541523] font-medium text-[11px] transition inline-flex items-center gap-1"
                        >
                          <ExternalLink size={11} />
                          <span>Full Size</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-[#8C7D7D] text-[11px] italic">
                    No product image attached. Click Edit to upload photo.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes Card */}
          {expense.notes && (
            <div className="bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl p-4 space-y-1">
              <div className="text-[10px] font-bold text-[#8F243C] uppercase tracking-wider">
                Private Studio Notes
              </div>
              <p className="text-xs text-[#423A3A] whitespace-pre-wrap">{expense.notes}</p>
            </div>
          )}

          {/* Sibling Items in Same Order */}
          {orderSiblings.length > 0 && (
            <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#F2EBE0] pb-2">
                <div className="font-semibold text-[#541523] flex items-center space-x-1.5">
                  <Layers size={14} />
                  <span>
                    Other Items in {expense.orderId} ({orderSiblings.length} other{orderSiblings.length > 1 ? 's' : ''})
                  </span>
                </div>
                <div className="text-[11px] text-[#7A6E6E]">
                  Total Order Value: <strong className="text-[#8F243C]">{formatINR(totalOrderSpend, 2)}</strong>
                </div>
              </div>

              <div className="divide-y divide-[#F2EBE0]">
                {orderSiblings.map((sib) => {
                  const sibMetrics = computePurchaseRowMetrics(sib);
                  return (
                    <div
                      key={sib.id}
                      className="py-2.5 flex items-center justify-between gap-3 hover:bg-[#FAF6F0]/60 rounded-lg px-2 transition"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-[#2C181B] truncate">{sib.title}</div>
                        <div className="text-[11px] text-[#7A6E6E] mt-0.5">
                          {sib.category} • {sibMetrics.qty} × ₹{sibMetrics.unitPrice}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="font-serif font-bold text-[#8F243C]">
                          {formatINR(sibMetrics.totalCost, 2)}
                        </div>
                        {onSelectSiblingExpense && (
                          <button
                            type="button"
                            onClick={() => onSelectSiblingExpense(sib)}
                            className="px-2 py-1 text-[11px] text-[#541523] hover:bg-[#F2EBE0] rounded border border-[#D9C9B4] transition font-medium"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pinned Footer */}
        <div className="shrink-0 bg-[#FCFAF7] border-t border-[#E8DDCF] px-5 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <button
              onClick={handleDeleteClick}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                confirmDelete
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'text-rose-700 hover:bg-rose-50 border border-rose-200'
              }`}
              title="Delete this purchase permanently"
            >
              <Trash2 size={14} />
              <span>{confirmDelete ? 'Confirm Delete?' : 'Delete'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#D9C9B4] bg-white hover:bg-[#FAF6F0] text-[#541523] text-xs font-medium transition"
            >
              Close
            </button>
            <button
              onClick={() => onEdit(expense)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide shadow-sm transition"
            >
              <Pencil size={14} />
              <span>Edit Purchase Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
