'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Expense } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import {
  computePurchaseRowMetrics,
  computePurchaseOverview,
  computePlatformStats,
  computeCategorySpend,
  exportPurchasesToCsv,
} from '@/lib/purchaseFormulas';
import {
  resolveEffectiveReceipt,
  normalizeOrderNumberKey,
  savePurchaseMedia,
} from '@/lib/purchaseMediaStore';
import {
  PurchaseAttachmentPreviewModal,
  FolderMediaUploadModal,
  AttachmentPreviewTarget,
  PurchaseMediaUpdateItem,
  clearStoredMediaIfUnused,
} from './PurchaseMediaModals';
import {
  Plus,
  Search,
  Download,
  Pencil,
  Trash2,
  Truck,
  AlertTriangle,
  Store,
  FileText,
  Image as ImageIcon,
  RotateCcw,
  FolderOpen,
} from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  platforms?: string[];
  categories?: string[];
  purchaseStatuses?: string[];
  onOpenNewExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onUpdatePurchaseStatus?: (id: string, purchaseStatus: string) => void;
  onAttachPurchaseMedia?: (updates: PurchaseMediaUpdateItem[], summaryMsg?: string) => void;
  onResetSheetData?: () => void;
}

type ExpensesSubTab = 'ledger' | 'platforms' | 'categories';
type QuickPreset = 'all' | 'in_transit' | 'late' | 'problems' | 'missing_payment';

export default function ExpensesView({
  expenses,
  platforms = [],
  categories = [],
  purchaseStatuses = [],
  onOpenNewExpense,
  onEditExpense,
  onDeleteExpense,
  onUpdatePurchaseStatus,
  onAttachPurchaseMedia,
  onResetSheetData,
}: ExpensesViewProps) {
  const [subTab, setSubTab] = useState<ExpensesSubTab>('ledger');
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [quickPreset, setQuickPreset] = useState<QuickPreset>('all');
  const [previewTarget, setPreviewTarget] = useState<AttachmentPreviewTarget | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const quickUploadTargetRef = useRef<{ expenseId: string; kind: 'bill' | 'product' } | null>(null);
  const quickUploadInputRef = useRef<HTMLInputElement>(null);

  const orderSiblingMap = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const exp of expenses) {
      const k = normalizeOrderNumberKey(exp.orderId);
      if (!k) continue;
      const list = map.get(k);
      if (list) list.push(exp);
      else map.set(k, [exp]);
    }
    return map;
  }, [expenses]);

  const overview = useMemo(() => computePurchaseOverview(expenses), [expenses]);
  const platformStats = useMemo(
    () => computePlatformStats(expenses, platforms),
    [expenses, platforms]
  );
  const categoryStats = useMemo(() => computeCategorySpend(expenses), [expenses]);

  const missingPaymentCount = useMemo(
    () =>
      expenses.filter(
        (e) => !e.paymentMode || e.paymentMode === 'Unspecified'
      ).length,
    [expenses]
  );

  // Build available filter options combining Master Lists & active rows
  const availablePlatforms = useMemo(() => {
    const set = new Set<string>(platforms);
    for (const e of expenses) {
      if (e.platform) set.add(e.platform);
    }
    return ['All', ...Array.from(set)];
  }, [platforms, expenses]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>(categories);
    for (const e of expenses) {
      if (e.category) set.add(e.category);
    }
    return ['All', ...Array.from(set)];
  }, [categories, expenses]);

  const availableStatuses = useMemo(() => {
    const set = new Set<string>(purchaseStatuses);
    for (const e of expenses) {
      if (e.purchaseStatus) set.add(e.purchaseStatus);
    }
    return ['All', ...Array.from(set)];
  }, [purchaseStatuses, expenses]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses
      .map((exp) => ({ exp, metrics: computePurchaseRowMetrics(exp) }))
      .filter(({ exp, metrics }) => {
        if (platformFilter !== 'All' && (exp.platform || '') !== platformFilter) {
          return false;
        }
        if (categoryFilter !== 'All' && exp.category !== categoryFilter) {
          return false;
        }
        if (statusFilter !== 'All' && (exp.purchaseStatus || 'Delivered') !== statusFilter) {
          return false;
        }
        if (quickPreset === 'in_transit' && !metrics.isInTransit) return false;
        if (quickPreset === 'late' && !metrics.isLate) return false;
        if (quickPreset === 'problems' && !metrics.isProblemOrder) return false;
        if (
          quickPreset === 'missing_payment' &&
          exp.paymentMode &&
          exp.paymentMode !== 'Unspecified'
        ) {
          return false;
        }
        if (!q) return true;

        const haystack = [
          exp.title,
          exp.orderId,
          exp.platform,
          exp.category,
          exp.supplierName,
          exp.invoiceNo,
          exp.dimensions,
          exp.stockItem,
          exp.receiptFile,
          exp.imageRef,
          exp.contactDetails,
          exp.notes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(q);
      });
  }, [expenses, search, platformFilter, categoryFilter, statusFilter, quickPreset]);

  const filteredSpend = useMemo(
    () => filteredRows.reduce((s, r) => s + r.metrics.totalCost, 0),
    [filteredRows]
  );

  const handleDownloadCsv = () => {
    const csv = exportPurchasesToCsv(expenses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vedh-purchases-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAllFilters = () => {
    setSearch('');
    setPlatformFilter('All');
    setCategoryFilter('All');
    setStatusFilter('All');
    setQuickPreset('all');
  };

  const jumpToPlatformLedger = (platformName: string) => {
    resetAllFilters();
    setPlatformFilter(platformName);
    setSubTab('ledger');
  };

  const triggerInlineRowUpload = (expenseId: string, kind: 'bill' | 'product') => {
    quickUploadTargetRef.current = { expenseId, kind };
    if (quickUploadInputRef.current) {
      quickUploadInputRef.current.accept = kind === 'bill' ? 'image/*,.pdf' : 'image/*';
      quickUploadInputRef.current.click();
    }
  };

  const handleQuickRowFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const target = quickUploadTargetRef.current;
    quickUploadTargetRef.current = null;
    if (!file || !target || !onAttachPurchaseMedia) return;

    const row = expenses.find((item) => item.id === target.expenseId);
    if (!row) return;

    const stored = await savePurchaseMedia(file, file.name, target.kind);
    if (target.kind === 'bill') {
      const orderKey = normalizeOrderNumberKey(row.orderId);
      const siblings = orderKey ? orderSiblingMap.get(orderKey) || [row] : [row];
      const updates: PurchaseMediaUpdateItem[] = siblings.map((sib) => ({
        id: sib.id,
        receiptFile: file.name,
        receiptMediaId: stored.id,
        receiptUrl: undefined,
      }));
      onAttachPurchaseMedia(
        updates,
        siblings.length > 1
          ? `Attached bill "${file.name}" to all ${siblings.length} items in ${row.orderId}`
          : `Attached bill "${file.name}" to ${row.title}`
      );
    } else {
      onAttachPurchaseMedia(
        [
          {
            id: row.id,
            imageRef: file.name,
            imageMediaId: stored.id,
            imageUrl: undefined,
          },
        ],
        `Attached product image "${file.name}" to ${row.title}`
      );
    }
  };

  const handleReplacePreviewFile = async (
    target: AttachmentPreviewTarget,
    file: File,
    applyToOrder: boolean
  ) => {
    if (!onAttachPurchaseMedia) return;
    const stored = await savePurchaseMedia(file, file.name, target.kind);
    if (target.kind === 'bill') {
      const orderKey = normalizeOrderNumberKey(target.expense.orderId);
      const targets =
        applyToOrder && orderKey
          ? orderSiblingMap.get(orderKey) || [target.expense]
          : [target.expense];
      const updates: PurchaseMediaUpdateItem[] = targets.map((item) => ({
        id: item.id,
        receiptFile: file.name,
        receiptMediaId: stored.id,
        receiptUrl: undefined,
      }));
      onAttachPurchaseMedia(
        updates,
        targets.length > 1
          ? `Updated bill "${file.name}" across ${targets.length} items`
          : `Updated bill "${file.name}"`
      );
      setPreviewTarget({
        ...target,
        fileName: file.name,
        mediaId: stored.id,
        url: undefined,
        inheritedFromOrder: false,
      });
    } else {
      onAttachPurchaseMedia(
        [
          {
            id: target.expense.id,
            imageRef: file.name,
            imageMediaId: stored.id,
            imageUrl: undefined,
          },
        ],
        `Updated product image "${file.name}"`
      );
      setPreviewTarget({
        ...target,
        fileName: file.name,
        mediaId: stored.id,
        url: undefined,
      });
    }
  };

  const handleClearPreviewFile = async (target: AttachmentPreviewTarget) => {
    if (!onAttachPurchaseMedia) return;
    if (target.kind === 'bill') {
      await clearStoredMediaIfUnused(target.expense.receiptMediaId, expenses, target.expense.id);
      onAttachPurchaseMedia(
        [
          {
            id: target.expense.id,
            receiptFile: undefined,
            receiptUrl: undefined,
            receiptMediaId: undefined,
          },
        ],
        `Removed bill link from ${target.expense.title}`
      );
    } else {
      await clearStoredMediaIfUnused(target.expense.imageMediaId, expenses, target.expense.id);
      onAttachPurchaseMedia(
        [
          {
            id: target.expense.id,
            imageRef: undefined,
            imageUrl: undefined,
            imageMediaId: undefined,
          },
        ],
        `Removed product image from ${target.expense.title}`
      );
    }
  };

  const renderRowDocLinks = (exp: Expense) => {
    const effectiveBill = resolveEffectiveReceipt(exp, expenses);
    const hasViewableBill = Boolean(effectiveBill.url || effectiveBill.mediaId);
    const hasBillRef = Boolean(effectiveBill.fileName || hasViewableBill);
    const hasViewableImg = Boolean(exp.imageUrl || exp.imageMediaId);
    const hasImgRef = Boolean(exp.imageRef || hasViewableImg);

    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
        {hasBillRef ? (
          <button
            type="button"
            onClick={() =>
              setPreviewTarget({
                expense: exp,
                kind: 'bill',
                fileName: effectiveBill.fileName || 'Purchase_Bill',
                url: effectiveBill.url,
                mediaId: effectiveBill.mediaId,
                inheritedFromOrder: effectiveBill.inheritedFromOrder,
              })
            }
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border transition ${
              hasViewableBill
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-semibold'
                : 'bg-[#FAF6F0] text-[#541523] border-dashed border-[#D9C9B4] hover:bg-[#F2EBE0]'
            }`}
            title={
              hasViewableBill
                ? `View bill: ${effectiveBill.fileName}${effectiveBill.inheritedFromOrder ? ' (shared via order)' : ''}`
                : `Bill ref: ${effectiveBill.fileName} (click to view or upload)`
            }
          >
            <FileText size={10} />
            <span className="max-w-[92px] truncate">
              {effectiveBill.fileName || 'View Bill'}
            </span>
          </button>
        ) : (
          onAttachPurchaseMedia && (
            <button
              type="button"
              onClick={() => triggerInlineRowUpload(exp.id, 'bill')}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-dashed border-[#D9C9B4] text-[#7A6E6E] hover:text-[#541523] hover:border-[#541523] transition"
              title="Attach bill / invoice for this purchase"
            >
              <FileText size={10} />
              <span>+ Bill</span>
            </button>
          )
        )}

        {hasImgRef ? (
          <button
            type="button"
            onClick={() =>
              setPreviewTarget({
                expense: exp,
                kind: 'product',
                fileName: exp.imageRef || `${exp.title}_photo`,
                url: exp.imageUrl,
                mediaId: exp.imageMediaId,
              })
            }
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border transition ${
              hasViewableImg
                ? 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100 font-semibold'
                : 'bg-[#FAF6F0] text-[#541523] border-dashed border-[#D9C9B4] hover:bg-[#F2EBE0]'
            }`}
            title={
              hasViewableImg
                ? `View product image: ${exp.imageRef}`
                : `Product image ref: ${exp.imageRef} (click to view or upload)`
            }
          >
            <ImageIcon size={10} />
            <span className="max-w-[70px] truncate">{exp.imageRef || 'Img'}</span>
          </button>
        ) : (
          onAttachPurchaseMedia && (
            <button
              type="button"
              onClick={() => triggerInlineRowUpload(exp.id, 'product')}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-dashed border-[#D9C9B4] text-[#7A6E6E] hover:text-[#541523] hover:border-[#541523] transition"
              title="Upload individual product photo"
            >
              <ImageIcon size={10} />
              <span>+ Img</span>
            </button>
          )
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <input
        ref={quickUploadInputRef}
        type="file"
        onChange={handleQuickRowFileChange}
        className="hidden"
        aria-label="Quick upload bill or product photo for purchase row"
      />
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Purchases &amp; Expenses Ledger
          </h2>
          <p className="text-xs text-[#7A6E6E]">
            Full vendor procurement sheet with live Total Cost, Unit Cost, Delivery Delay &amp; Platform Summary formulas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onResetSheetData && (
            <button
              onClick={onResetSheetData}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-[#D9C9B4] bg-[#FAF6F0] hover:bg-[#F2EBE0] text-[#541523] text-xs font-medium transition"
              title="Reload original imported Purchase Sheet"
            >
              <RotateCcw size={14} />
              <span>Reload Sheet</span>
            </button>
          )}
          <button
            onClick={() => setShowFolderModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-[#541523]/30 bg-[#FAF6F0] hover:bg-[#F2EBE0] text-[#541523] text-xs font-semibold transition"
            title="Upload product photos or invoices from a folder or attach one bill to a whole order"
          >
            <FolderOpen size={14} />
            <span>Folder &amp; Bill Upload</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-[#D9C9B4] bg-white hover:bg-[#FAF6F0] text-[#423A3A] text-xs font-medium transition"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenNewExpense}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide transition shadow-sm"
          >
            <Plus size={16} />
            <span>+ Add purchase</span>
          </button>
        </div>
      </div>

      {/* 4 Live Formula KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8DDCF] rounded-xl p-5 shadow-sm">
          <div className="text-xs text-[#7A6E6E]">Total Purchase Spend</div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#8F243C] mt-1">
            {formatINR(overview.totalSpend, 2)}
          </div>
          <div className="text-[11px] text-[#8C7D7D] mt-1">
            Net ex-returns: <strong className="text-[#2C181B]">{formatINR(overview.netEffectiveSpend, 2)}</strong>
          </div>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-xl p-5 shadow-sm">
          <div className="text-xs text-[#7A6E6E]">Line Items &amp; Shipping</div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2C181B] mt-1">
            {overview.lineItemCount} items
          </div>
          <div className="text-[11px] text-[#8C7D7D] mt-1">
            {overview.activePlatformCount} active sources • Shipping: {formatINR(overview.totalShipping, 2)}
          </div>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-xl p-5 shadow-sm">
          <div className="text-xs text-[#7A6E6E]">In Transit (Shipped)</div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-blue-800 mt-1">
            {formatINR(overview.inTransitValue, 2)}
          </div>
          <div className="text-[11px] text-[#8C7D7D] mt-1">
            {overview.inTransitCount} open shipments awaiting delivery
          </div>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-xl p-5 shadow-sm">
          <div className="text-xs text-[#7A6E6E]">Delivery &amp; Return Health</div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2C181B] mt-1">
            {overview.lateDeliveryCount} Late • {overview.problemOrderCount} Returns
          </div>
          <div className="text-[11px] text-rose-700 mt-1">
            Returned / Refund value: {formatINR(overview.problemOrderValue, 2)}
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs matching both Excel Sheets + Category Analytics */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-[#D9C9B4] bg-[#FAF5EE] p-1 text-xs">
          <button
            onClick={() => setSubTab('ledger')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition ${
              subTab === 'ledger'
                ? 'bg-[#541523] text-white shadow-sm'
                : 'text-[#635B5B] hover:text-[#2C181B]'
            }`}
          >
            Purchase Ledger ({expenses.length})
          </button>
          <button
            onClick={() => setSubTab('platforms')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition ${
              subTab === 'platforms'
                ? 'bg-[#541523] text-white shadow-sm'
                : 'text-[#635B5B] hover:text-[#2C181B]'
            }`}
          >
            Platform Summary Sheet ({platformStats.length})
          </button>
          <button
            onClick={() => setSubTab('categories')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition ${
              subTab === 'categories'
                ? 'bg-[#541523] text-white shadow-sm'
                : 'text-[#635B5B] hover:text-[#2C181B]'
            }`}
          >
            Category Breakdown ({categoryStats.length})
          </button>
        </div>

        {missingPaymentCount > 0 && subTab === 'ledger' && (
          <button
            onClick={() =>
              setQuickPreset(quickPreset === 'missing_payment' ? 'all' : 'missing_payment')
            }
            className={`text-xs px-3 py-1.5 rounded-full border font-medium flex items-center space-x-1.5 transition ${
              quickPreset === 'missing_payment'
                ? 'bg-amber-700 text-white border-amber-700'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle size={13} />
            <span>{missingPaymentCount} row missing Payment Mode — review</span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: PURCHASE LEDGER */}
      {subTab === 'ledger' && (
        <div className="space-y-4">
          {/* Search, Dropdown Filters & Quick Formula Filter Pills */}
          <div className="bg-white border border-[#E8DDCF] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div className="relative lg:col-span-2">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7D7D]"
                />
                <input
                  type="text"
                  placeholder="Search item, order ID, bill no, shop, dimensions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                aria-label="Filter by platform"
                className="px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
              >
                {availablePlatforms.map((p) => (
                  <option key={p} value={p}>
                    {p === 'All' ? 'All Platforms' : p}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
                className="px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'All Categories' : c}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by purchase status"
                className="px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
              >
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All Statuses' : s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'all', label: `All (${expenses.length})` },
                    { id: 'in_transit', label: `Shipped / In Transit (${overview.inTransitCount})` },
                    { id: 'late', label: `Late Deliveries (${overview.lateDeliveryCount})` },
                    { id: 'problems', label: `Returns & Refunds (${overview.problemOrderCount})` },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setQuickPreset(pill.id)}
                    className={`px-3 py-1 rounded-full border font-medium transition ${
                      quickPreset === pill.id
                        ? 'bg-[#541523] text-white border-[#541523]'
                        : 'bg-[#FAF6F0] text-[#635B5B] border-[#E8DDCF] hover:bg-[#F2EBE0]'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}

                {(search ||
                  platformFilter !== 'All' ||
                  categoryFilter !== 'All' ||
                  statusFilter !== 'All' ||
                  quickPreset !== 'all') && (
                  <button
                    onClick={resetAllFilters}
                    className="px-2.5 py-1 text-[#8F243C] hover:underline font-medium"
                  >
                    Reset filters
                  </button>
                )}
              </div>

              <div className="text-[#635B5B]">
                Showing <strong className="text-[#2C181B]">{filteredRows.length}</strong> items •{' '}
                Subtotal: <strong className="text-[#8F243C] font-serif">{formatINR(filteredSpend, 2)}</strong>
              </div>
            </div>
          </div>

          {/* Purchase Ledger Table */}
          <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
            {filteredRows.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#8C7D7D]">
                No purchases match the active filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF5EE] border-b border-[#E8DDCF] text-[11px] uppercase tracking-wider text-[#7A6E6E]">
                      <th className="py-3 px-4 font-semibold">Date &amp; Order Ref</th>
                      <th className="py-3 px-3 font-semibold">Item &amp; Category</th>
                      <th className="py-3 px-3 font-semibold">Platform / Shop</th>
                      <th className="py-3 px-3 text-right font-semibold">Qty &amp; Rate</th>
                      <th className="py-3 px-3 text-right font-semibold">Total Cost (₹)</th>
                      <th className="py-3 px-3 font-semibold">Delivery Telemetry</th>
                      <th className="py-3 px-3 font-semibold">Status &amp; Docs</th>
                      <th className="py-3 px-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EBE0]">
                    {filteredRows.map(({ exp, metrics }) => (
                      <tr key={exp.id} className="hover:bg-[#FAF6F0]/60 transition align-top">
                        {/* Date & Order Ref */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-[#2C181B]">{exp.date}</div>
                          {exp.orderId && (
                            <div
                              className="text-[10px] font-mono text-[#7A6E6E] max-w-[140px] truncate"
                              title={exp.orderId}
                            >
                              {exp.orderId}
                            </div>
                          )}
                          {exp.invoiceNo && (
                            <div
                              className="text-[10px] text-[#8F243C] max-w-[140px] truncate"
                              title={exp.invoiceNo}
                            >
                              {exp.invoiceNo}
                            </div>
                          )}
                        </td>

                        {/* Item & Category */}
                        <td className="py-3 px-3 min-w-[200px]">
                          <div className="font-semibold text-[#2C181B]">{exp.title}</div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#FAF0E6] text-[#8F243C] font-medium">
                              {exp.category}
                            </span>
                            {exp.dimensions && (
                              <span className="text-[10px] text-[#7A6E6E]">{exp.dimensions}</span>
                            )}
                            {exp.stockItem && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5EFE6] text-[#423A3A] border border-[#E8DDCF]"
                                title={
                                  exp.appliedToStock
                                    ? 'Linked to Stock Ledger (adds to Physical In Hand when Delivered)'
                                    : 'Linked to Stock Ledger (tracks Incoming while Shipped/Ordered)'
                                }
                              >
                                Stock: {exp.stockItem}
                                {typeof exp.stockQtyReceived === 'number' &&
                                exp.stockQtyReceived > 0
                                  ? ` (${exp.stockQtyReceived}u)`
                                  : ''}
                              </span>
                            )}
                          </div>
                          {(exp.notes || exp.contactDetails) && (
                            <div
                              className="text-[10px] text-[#7A6E6E] mt-1 max-w-[260px] truncate"
                              title={exp.notes || exp.contactDetails}
                            >
                              Note: {exp.notes || exp.contactDetails}
                            </div>
                          )}
                        </td>

                        {/* Platform & Payment */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-semibold text-[#2C181B]">
                            {exp.platform || 'Direct'}
                          </div>
                          {exp.supplierName && exp.supplierName !== exp.platform && (
                            <div
                              className="text-[10px] text-[#7A6E6E] max-w-[150px] truncate"
                              title={exp.supplierName}
                            >
                              {exp.supplierName}
                            </div>
                          )}
                          <div className="mt-1">
                            {exp.paymentMode === 'Unspecified' ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                                Payment missing
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-[#635B5B]">
                                {exp.paymentMode}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Qty & Formula Rate */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="font-medium text-[#2C181B]">
                            {metrics.qty} × ₹{metrics.unitPrice}
                          </div>
                          <div className="text-[10px] text-[#7A6E6E]">
                            {metrics.shipping !== 0 && (
                              <span>
                                {metrics.shipping > 0
                                  ? `+₹${metrics.shipping} ship`
                                  : `-₹${Math.abs(metrics.shipping)} disc`}{' '}
                                •{' '}
                              </span>
                            )}
                            {metrics.totalUnits} u ({formatINR(metrics.costPerUnit, 2)}/u)
                          </div>
                        </td>

                        {/* Total Cost */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="font-serif font-bold text-[#8F243C] text-sm">
                            {formatINR(metrics.totalCost, 2)}
                          </div>
                        </td>

                        {/* Delivery Telemetry */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {metrics.isInTransit ? (
                            <div className="text-[11px] text-blue-800 font-medium flex items-center space-x-1">
                              <Truck size={12} />
                              <span>Exp: {exp.expectedDelivery || 'TBD'}</span>
                            </div>
                          ) : (
                            <div>
                              <div className="text-[11px] text-[#423A3A]">
                                {exp.actualDelivery || exp.date}
                                {metrics.daysTaken !== null && (
                                  <span className="text-[#7A6E6E]"> ({metrics.daysTaken}d)</span>
                                )}
                              </div>
                              {metrics.delayDays !== null ? (
                                <span
                                  className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium mt-0.5 ${
                                    metrics.isLate
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : metrics.isEarly
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-stone-100 text-stone-600'
                                  }`}
                                >
                                  {metrics.isLate
                                    ? `+${metrics.delayDays}d Late`
                                    : metrics.isEarly
                                    ? `${Math.abs(metrics.delayDays)}d Early`
                                    : 'On time'}
                                </span>
                              ) : (
                                exp.expectedDelivery && (
                                  <div className="text-[10px] text-[#7A6E6E] mt-0.5">
                                    Exp: {exp.expectedDelivery}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </td>

                        {/* Status & Receipt/Img Docs */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {onUpdatePurchaseStatus && availableStatuses.length > 1 ? (
                            <select
                              value={exp.purchaseStatus || 'Delivered'}
                              onChange={(e) => onUpdatePurchaseStatus(exp.id, e.target.value)}
                              aria-label={`Purchase status for ${exp.title}`}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border focus:outline-none ${
                                metrics.isProblemOrder
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : metrics.isInTransit
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : exp.purchaseStatus === 'Replaced'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {availableStatuses
                                .filter((s) => s !== 'All')
                                .map((ps) => (
                                  <option key={ps} value={ps}>
                                    {ps}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#FAF6F0] border border-[#E8DDCF]">
                              {exp.purchaseStatus}
                            </span>
                          )}

                          {renderRowDocLinks(exp)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center space-x-1">
                            <button
                              onClick={() => onEditExpense(exp)}
                              className="p-1.5 text-[#541523] hover:bg-[#F2EBE0] rounded transition"
                              title="Edit purchase"
                              aria-label={`Edit ${exp.title}`}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => onDeleteExpense(exp.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                              title="Delete purchase"
                              aria-label={`Delete ${exp.title}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PLATFORM SUMMARY SHEET */}
      {subTab === 'platforms' && (
        <div className="bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#8F243C]">
                <Store size={14} />
                <span>Platform / Supplier Formula Matrix</span>
              </div>
              <p className="text-xs text-[#7A6E6E] mt-0.5">
                Click any platform row to filter its line items in the Purchase Ledger. Add new platforms anytime in Master Lists.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF5EE] border-b border-[#E8DDCF] text-[11px] uppercase tracking-wider text-[#7A6E6E]">
                  <th className="py-3 px-4 font-semibold">Platform / Supplier</th>
                  <th className="py-3 px-3 text-right font-semibold">Line Items</th>
                  <th className="py-3 px-3 text-right font-semibold">Total Spend (₹)</th>
                  <th className="py-3 px-3 text-right font-semibold">Avg Days to Deliver</th>
                  <th className="py-3 px-3 text-right font-semibold">Late Deliveries</th>
                  <th className="py-3 px-3 text-right font-semibold">Problem Orders (Returned/Refund/Cancel)</th>
                  <th className="py-3 px-4 text-right font-semibold">Spend Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EBE0]">
                {platformStats.map((row) => (
                  <tr
                    key={row.platform}
                    onClick={() => row.lineItems > 0 && jumpToPlatformLedger(row.platform)}
                    className={`transition ${
                      row.lineItems > 0 ? 'hover:bg-[#FAF6F0] cursor-pointer' : 'opacity-65'
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-[#2C181B]">
                      {row.platform}
                      {row.inTransitCount > 0 && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                          {row.inTransitCount} shipped
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">{row.lineItems}</td>
                    <td className="py-3 px-3 text-right font-serif font-bold text-[#2C181B]">
                      {formatINR(row.totalSpend, 2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#635B5B]">
                      {row.avgDaysToDeliver === null
                        ? '—'
                        : row.avgDaysToDeliver.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {row.lateDeliveries > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-semibold">
                          {row.lateDeliveries}
                        </span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {row.problemOrders > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-semibold">
                          {row.problemOrders}
                        </span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-[#7A6E6E]">
                      {row.sharePct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#FAF5EE] border-t-2 border-[#E8DDCF] font-bold text-[#2C181B]">
                  <td className="py-3 px-4">ALL PLATFORMS TOTAL</td>
                  <td className="py-3 px-3 text-right font-mono">{overview.lineItemCount}</td>
                  <td className="py-3 px-3 text-right font-serif text-[#8F243C]">
                    {formatINR(overview.totalSpend, 2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {overview.avgDaysToDeliver === null
                      ? '—'
                      : overview.avgDaysToDeliver.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-800">
                    {overview.lateDeliveryCount}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-800">
                    {overview.problemOrderCount}
                  </td>
                  <td className="py-3 px-4 text-right">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CATEGORY BREAKDOWN */}
      {subTab === 'categories' && (
        <div className="bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#2C181B]">
              Procurement Spend by Category
            </h3>
            <p className="text-xs text-[#7A6E6E]">
              Click a category to inspect all matching purchases in the Ledger.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryStats.map((cat) => (
              <div
                key={cat.category}
                onClick={() => {
                  resetAllFilters();
                  setCategoryFilter(cat.category);
                  setSubTab('ledger');
                }}
                className="p-4 rounded-xl border border-[#E8DDCF] hover:border-[#8F243C] bg-[#FCFAF7] hover:bg-[#FAF5EE] cursor-pointer transition space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#2C181B]">{cat.category}</span>
                  <span className="font-serif font-bold text-[#8F243C] text-sm">
                    {formatINR(cat.totalSpend, 2)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EFE5D6] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#541523]"
                    style={{ width: `${Math.min(100, cat.sharePct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#7A6E6E]">
                  <span>
                    {cat.lineItems} line items • {cat.totalUnits.toLocaleString('en-IN')} units
                  </span>
                  <span>{cat.sharePct.toFixed(1)}% of spend</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {previewTarget && (
        <PurchaseAttachmentPreviewModal
          target={previewTarget}
          orderSiblingCount={
            orderSiblingMap.get(normalizeOrderNumberKey(previewTarget.expense.orderId))?.length || 1
          }
          onClose={() => setPreviewTarget(null)}
          onReplaceFile={handleReplacePreviewFile}
          onClearFile={handleClearPreviewFile}
        />
      )}

      {showFolderModal && onAttachPurchaseMedia && (
        <FolderMediaUploadModal
          expenses={expenses}
          onClose={() => setShowFolderModal(false)}
          onApplyMediaUpdates={(updates, msg) => onAttachPurchaseMedia(updates, msg)}
        />
      )}
    </div>
  );
}
