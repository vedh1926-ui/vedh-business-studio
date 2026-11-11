'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  FolderOpen,
  Upload,
  ExternalLink,
  Download,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  AlertCircle,
  Layers,
  Trash2,
  Files,
} from 'lucide-react';
import { Expense } from '@/lib/types';
import {
  getPurchaseMedia,
  savePurchaseMedia,
  deletePurchaseMedia,
  matchFolderFilesToExpenses,
  normalizeOrderNumberKey,
  FolderFileMatch,
} from '@/lib/purchaseMediaStore';

export interface PurchaseMediaUpdateItem {
  id: string;
  receiptFile?: string;
  receiptUrl?: string;
  receiptMediaId?: string;
  imageRef?: string;
  imageUrl?: string;
  imageMediaId?: string;
}

export interface AttachmentPreviewTarget {
  expense: Expense;
  kind: 'bill' | 'product';
  fileName: string;
  url?: string;
  mediaId?: string;
  inheritedFromOrder?: boolean;
}

function isPdfNameOrMime(fileName: string, mimeType?: string): boolean {
  if (mimeType && mimeType.toLowerCase().includes('pdf')) return true;
  return fileName.toLowerCase().endsWith('.pdf');
}

function isImageNameOrMime(fileName: string, mimeType?: string): boolean {
  if (mimeType && mimeType.toLowerCase().startsWith('image/')) return true;
  return /\.(png|jpe?g|webp|gif|bmp|svg|heic|avif)$/i.test(fileName);
}

interface PreviewModalProps {
  target: AttachmentPreviewTarget;
  orderSiblingCount: number;
  onClose: () => void;
  onReplaceFile: (
    target: AttachmentPreviewTarget,
    file: File,
    applyToOrder: boolean
  ) => Promise<void>;
  onClearFile: (target: AttachmentPreviewTarget) => Promise<void>;
}

export function PurchaseAttachmentPreviewModal({
  target,
  orderSiblingCount,
  onClose,
  onReplaceFile,
  onClearFile,
}: PreviewModalProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(target.url || null);
  const [mimeType, setMimeType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(Boolean(target.mediaId && !target.url));
  const [zoomFullWidth, setZoomFullWidth] = useState<boolean>(false);
  const [applyToOrder, setApplyToOrder] = useState<boolean>(
    target.kind === 'bill' && orderSiblingCount > 1
  );
  const [busy, setBusy] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let revokedUrl: string | null = null;
    let active = true;

    async function load() {
      if (target.mediaId) {
        setLoading(true);
        try {
          const rec = await getPurchaseMedia(target.mediaId);
          if (!active) return;
          if (rec?.blob) {
            revokedUrl = URL.createObjectURL(rec.blob);
            setResolvedSrc(revokedUrl);
            setMimeType(rec.mimeType || '');
            setLoading(false);
            return;
          }
        } catch {
          // Fall through to URL or missing notice
        }
      }
      if (active) {
        setResolvedSrc(target.url || null);
        setMimeType('');
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [target.mediaId, target.url, target.fileName]);

  const isPdf = isPdfNameOrMime(target.fileName, mimeType);
  const isImage = !isPdf && isImageNameOrMime(target.fileName, mimeType);

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      await onReplaceFile(target, file, applyToOrder);
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    setBusy(true);
    try {
      await onClearFile(target);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${target.kind === 'bill' ? 'Bill Preview' : 'Product Image Preview'}: ${target.fileName}`}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-2xl border border-[#D9C9B4] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#541523] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {target.kind === 'bill' ? (
              <FileText className="w-5 h-5 text-[#E8CF96] shrink-0" />
            ) : (
              <ImageIcon className="w-5 h-5 text-[#E8CF96] shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-[#F4D996] font-semibold flex items-center gap-2">
                <span>{target.kind === 'bill' ? 'Purchase Bill / Invoice' : 'Product Photo'}</span>
                {target.inheritedFromOrder && (
                  <span className="px-1.5 py-0.5 rounded bg-white/15 text-[10px]">
                    Linked via {target.expense.orderId}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold truncate" title={target.fileName}>
                {target.fileName}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15 text-white transition"
            aria-label="Close attachment preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Purchase context strip */}
        <div className="px-5 py-2.5 bg-[#FDFBF7] border-b border-[#E8DEC9] flex flex-wrap items-center justify-between gap-2 text-xs text-[#541523]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              <strong className="font-semibold">Item:</strong> {target.expense.title}
            </span>
            {target.expense.orderId && (
              <span>
                <strong className="font-semibold">Order:</strong> {target.expense.orderId}
                {orderSiblingCount > 1 && (
                  <span className="ml-1 text-[#70615B]">({orderSiblingCount} items in order)</span>
                )}
              </span>
            )}
            <span>
              <strong className="font-semibold">Platform:</strong> {target.expense.platform}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {resolvedSrc && isImage && (
              <button
                type="button"
                onClick={() => setZoomFullWidth((v) => !v)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#D9C9B4] bg-white hover:bg-[#FAF5EB] text-[11px] font-semibold"
              >
                {zoomFullWidth ? (
                  <>
                    <ZoomOut className="w-3.5 h-3.5" /> Fit Window
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-3.5 h-3.5" /> Full Detail
                  </>
                )}
              </button>
            )}
            {resolvedSrc && (
              <>
                <a
                  href={resolvedSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#D9C9B4] bg-white hover:bg-[#FAF5EB] text-[11px] font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Tab
                </a>
                <a
                  href={resolvedSrc}
                  download={target.fileName}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#D9C9B4] bg-white hover:bg-[#FAF5EB] text-[11px] font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </>
            )}
          </div>
        </div>

        {/* Viewer Body */}
        <div className="flex-1 overflow-auto bg-[#F5EFE6] p-4 flex items-center justify-center min-h-[260px]">
          {loading ? (
            <div className="text-sm text-[#70615B] py-12">Loading saved file from browser storage...</div>
          ) : resolvedSrc ? (
            isPdf ? (
              <iframe
                src={resolvedSrc}
                title={target.fileName}
                className="w-full h-[60vh] rounded-lg border border-[#D9C9B4] bg-white"
              />
            ) : isImage ? (
              <div className={zoomFullWidth ? 'w-full overflow-auto' : 'max-w-full'}>
                <img
                  src={resolvedSrc}
                  alt={target.fileName}
                  className={
                    zoomFullWidth
                      ? 'mx-auto max-w-none w-auto rounded-lg shadow-md border border-[#D9C9B4] bg-white'
                      : 'mx-auto max-h-[62vh] w-auto object-contain rounded-lg shadow-md border border-[#D9C9B4] bg-white'
                  }
                />
              </div>
            ) : (
              <div className="bg-white border border-[#D9C9B4] rounded-xl p-6 text-center max-w-md">
                <FileText className="w-10 h-10 text-[#541523] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#2E1A1E] mb-1">{target.fileName}</p>
                <p className="text-xs text-[#70615B] mb-4">
                  Preview isn&apos;t supported inline for this format. Use Download or Open Tab above.
                </p>
                <a
                  href={resolvedSrc}
                  download={target.fileName}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#541523] text-white text-xs font-semibold hover:bg-[#6E1E30]"
                >
                  <Download className="w-3.5 h-3.5" /> Download File
                </a>
              </div>
            )
          ) : (
            <div className="bg-white border border-[#D9C9B4] rounded-xl p-6 text-center max-w-md shadow-xs">
              <AlertCircle className="w-9 h-9 text-amber-600 mx-auto mb-2.5" />
              <h4 className="text-sm font-bold text-[#2E1A1E] mb-1">
                Filename Reference Only: {target.fileName}
              </h4>
              <p className="text-xs text-[#70615B] mb-4">
                Your spreadsheet recorded this filename, but the image/PDF hasn&apos;t been uploaded from your
                computer yet. Upload it once now or use <strong>Folder &amp; Bill Upload</strong> to match all files in a folder automatically.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#541523] text-white text-xs font-semibold hover:bg-[#6E1E30] disabled:opacity-60"
              >
                <Upload className="w-3.5 h-3.5" /> Upload {target.fileName} Now
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 bg-white border-t border-[#E8DEC9] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept={target.kind === 'bill' ? 'image/*,.pdf' : 'image/*'}
              onChange={handleFilePicked}
              className="hidden"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#541523]/30 text-[#541523] font-semibold hover:bg-[#541523]/5 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {resolvedSrc ? 'Replace File' : 'Upload File'}
            </button>

            {target.kind === 'bill' && orderSiblingCount > 1 && target.expense.orderId && (
              <label className="inline-flex items-center gap-1.5 text-[#541523] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyToOrder}
                  onChange={(e) => setApplyToOrder(e.target.checked)}
                  className="accent-[#541523]"
                />
                <span>Apply to all {orderSiblingCount} items in {target.expense.orderId}</span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!target.inheritedFromOrder && (target.expense.receiptFile || target.expense.imageRef) && (
              <button
                type="button"
                disabled={busy}
                onClick={handleClear}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-700 hover:bg-red-50 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Link
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#541523] text-white font-semibold hover:bg-[#6E1E30]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FolderUploadModalProps {
  expenses: Expense[];
  onClose: () => void;
  onApplyMediaUpdates: (updates: PurchaseMediaUpdateItem[], summaryMsg: string) => void;
}

interface ManualAssignment {
  file: File;
  expenseId: string;
  targetKind: 'bill' | 'product';
}

export function FolderMediaUploadModal({
  expenses,
  onClose,
  onApplyMediaUpdates,
}: FolderUploadModalProps) {
  const [activeTab, setActiveTab] = useState<'folder' | 'orderBill'>('folder');
  const [uploadMode, setUploadMode] = useState<'auto' | 'bill' | 'product'>('auto');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [matches, setMatches] = useState<FolderFileMatch[]>([]);
  const [unmatched, setUnmatched] = useState<File[]>([]);
  const [manualMap, setManualMap] = useState<Record<string, ManualAssignment>>({});
  const [saving, setSaving] = useState(false);

  // Tab 2: Attach one bill to all items sharing an orderId
  const orderGroups = useMemo(() => {
    const map = new Map<
      string,
      { orderKey: string; displayOrderId: string; platform: string; date: string; count: number; total: number; expenseIds: string[]; hasBill: boolean }
    >();
    for (const exp of expenses) {
      const key = normalizeOrderNumberKey(exp.orderId);
      if (!key) continue;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          orderKey: key,
          displayOrderId: exp.orderId || key,
          platform: exp.platform || 'Direct',
          date: exp.date,
          count: 1,
          total: exp.amount,
          expenseIds: [exp.id],
          hasBill: Boolean(exp.receiptUrl || exp.receiptMediaId),
        });
      } else {
        existing.count += 1;
        existing.total += exp.amount;
        existing.expenseIds.push(exp.id);
        existing.hasBill = existing.hasBill || Boolean(exp.receiptUrl || exp.receiptMediaId);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count || b.date.localeCompare(a.date));
  }, [expenses]);

  const [selectedOrderKey, setSelectedOrderKey] = useState<string>(
    () => orderGroups[0]?.orderKey || ''
  );
  const [orderBillFile, setOrderBillFile] = useState<File | null>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const runMatching = (files: File[], mode: 'auto' | 'bill' | 'product') => {
    const valid = files.filter((f) => /\.(png|jpe?g|webp|gif|bmp|pdf|heic|avif)$/i.test(f.name));
    setSelectedFiles(valid);
    const res = matchFolderFilesToExpenses(valid, expenses, mode);
    setMatches(res.matches);
    setUnmatched(res.unmatched);
    setManualMap({});
  };

  const handleModeChange = (mode: 'auto' | 'bill' | 'product') => {
    setUploadMode(mode);
    if (selectedFiles.length > 0) {
      runMatching(selectedFiles, mode);
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (picked.length === 0) return;
    runMatching(picked, uploadMode);
  };

  const removeMatch = (idx: number) => {
    const removed = matches[idx];
    setMatches((prev) => prev.filter((_, i) => i !== idx));
    if (removed) setUnmatched((prev) => [removed.file, ...prev]);
  };

  const setManualAssignment = (
    file: File,
    expenseId: string,
    targetKind: 'bill' | 'product'
  ) => {
    if (!expenseId) {
      setManualMap((prev) => {
        const next = { ...prev };
        delete next[file.name];
        return next;
      });
      return;
    }
    setManualMap((prev) => ({
      ...prev,
      [file.name]: { file, expenseId, targetKind },
    }));
  };

  const manualCount = Object.keys(manualMap).length;
  const totalReadyFiles = matches.length + manualCount;

  const handleApplyFolderMatches = async () => {
    if (totalReadyFiles === 0) return;
    setSaving(true);
    try {
      const updatesByExpense = new Map<string, PurchaseMediaUpdateItem>();
      const ensureEntry = (id: string): PurchaseMediaUpdateItem => {
        let item = updatesByExpense.get(id);
        if (!item) {
          item = { id };
          updatesByExpense.set(id, item);
        }
        return item;
      };

      for (const m of matches) {
        const stored = await savePurchaseMedia(m.file, m.file.name, m.targetKind);
        for (const expId of m.matchedExpenseIds) {
          const item = ensureEntry(expId);
          if (m.targetKind === 'bill') {
            item.receiptFile = m.file.name;
            item.receiptMediaId = stored.id;
            item.receiptUrl = undefined;
          } else {
            item.imageRef = m.file.name;
            item.imageMediaId = stored.id;
            item.imageUrl = undefined;
          }
        }
      }

      for (const assignment of Object.values(manualMap)) {
        const stored = await savePurchaseMedia(
          assignment.file,
          assignment.file.name,
          assignment.targetKind
        );
        const item = ensureEntry(assignment.expenseId);
        if (assignment.targetKind === 'bill') {
          item.receiptFile = assignment.file.name;
          item.receiptMediaId = stored.id;
          item.receiptUrl = undefined;
        } else {
          item.imageRef = assignment.file.name;
          item.imageMediaId = stored.id;
          item.imageUrl = undefined;
        }
      }

      const updates = Array.from(updatesByExpense.values());
      onApplyMediaUpdates(
        updates,
        `Attached ${totalReadyFiles} file(s) across ${updates.length} purchase row(s)`
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleApplyOrderBill = async () => {
    const grp = orderGroups.find((g) => g.orderKey === selectedOrderKey);
    if (!grp || !orderBillFile) return;
    setSaving(true);
    try {
      const stored = await savePurchaseMedia(orderBillFile, orderBillFile.name, 'bill');
      const updates: PurchaseMediaUpdateItem[] = grp.expenseIds.map((id) => ({
        id,
        receiptFile: orderBillFile.name,
        receiptMediaId: stored.id,
        receiptUrl: undefined,
      }));
      onApplyMediaUpdates(
        updates,
        `Linked bill "${orderBillFile.name}" to all ${grp.count} items of ${grp.displayOrderId}`
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const activeOrderGroup = orderGroups.find((g) => g.orderKey === selectedOrderKey);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Folder and Bulk Bill Upload"
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl border border-[#D9C9B4] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#541523] text-white flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[#E8CF96]" />
              Smart Folder &amp; Order Bill Upload
            </h3>
            <p className="text-xs text-white/80 mt-0.5">
              Pick a local folder of product photos or invoices to auto-match rows, or attach one bill across an entire order.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15 text-white transition"
            aria-label="Close upload manager"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-5 pt-3 bg-[#FDFBF7] border-b border-[#E8DEC9] flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('folder')}
            className={`px-3.5 py-2 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'folder'
                ? 'border-[#541523] text-[#541523] bg-white'
                : 'border-transparent text-[#70615B] hover:text-[#541523]'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Pick Local Folder / Multiple Files
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orderBill')}
            className={`px-3.5 py-2 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'orderBill'
                ? 'border-[#541523] text-[#541523] bg-white'
                : 'border-transparent text-[#70615B] hover:text-[#541523]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Attach One Bill to Whole Order
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'folder' ? (
            <>
              <div className="bg-[#FAF5EB] border border-[#E8DEC9] rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[#541523]">1. What kind of files are in this folder?</div>
                    <div className="text-[11px] text-[#70615B]">
                      Auto-detect matches spreadsheet Bill/Image refs, Order IDs (like <code>14290</code>, <code>14901</code>), or product names.
                    </div>
                  </div>
                  <select
                    value={uploadMode}
                    onChange={(e) => handleModeChange(e.target.value as 'auto' | 'bill' | 'product')}
                    className="px-3 py-1.5 rounded-lg border border-[#D9C9B4] bg-white text-xs font-semibold text-[#541523]"
                    aria-label="Folder file classification mode"
                  >
                    <option value="auto">Auto-detect (Bills + Product Images)</option>
                    <option value="product">Product Images Folder</option>
                    <option value="bill">Purchase Bills / Invoices Folder</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
                    onChange={handleFilesSelected}
                    className="hidden"
                  />
                  <input
                    ref={multiFileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFilesSelected}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#541523] text-white text-xs font-semibold hover:bg-[#6E1E30]"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Choose Folder from PC
                  </button>
                  <button
                    type="button"
                    onClick={() => multiFileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#541523]/30 bg-white text-[#541523] text-xs font-semibold hover:bg-[#541523]/5"
                  >
                    <Files className="w-4 h-4" />
                    Select Individual Files
                  </button>
                  {selectedFiles.length > 0 && (
                    <span className="text-xs text-[#70615B]">
                      Scanned <strong>{selectedFiles.length}</strong> file(s)
                    </span>
                  )}
                </div>
              </div>

              {/* Matched preview */}
              {matches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                    Matched Automatically ({matches.length})
                  </div>
                  <div className="border border-emerald-200 rounded-xl divide-y divide-emerald-100 bg-emerald-50/30">
                    {matches.map((m, idx) => (
                      <div key={`${m.file.name}-${idx}`} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <div className="font-semibold text-[#2E1A1E] flex items-center gap-2">
                            <span className="truncate">{m.file.name}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                m.targetKind === 'bill'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {m.targetKind === 'bill' ? 'Bill' : 'Product Img'}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#70615B] mt-0.5">
                            {m.matchReason} · Links to <strong>{m.matchedExpenseIds.length}</strong> purchase row(s)
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMatch(idx)}
                          className="text-[11px] text-[#70615B] hover:text-red-700 px-2 py-1 rounded"
                        >
                          Skip
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unmatched manual assigner */}
              {unmatched.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Assign Manually ({unmatched.length} unmatched)
                    </span>
                    {manualCount > 0 && (
                      <span className="text-emerald-700 font-semibold">{manualCount} manually assigned</span>
                    )}
                  </div>
                  <div className="border border-amber-200 rounded-xl divide-y divide-amber-100 bg-amber-50/20 max-h-60 overflow-y-auto">
                    {unmatched.map((file) => {
                      const chosen = manualMap[file.name];
                      const defaultKind =
                        uploadMode === 'bill'
                          ? 'bill'
                          : uploadMode === 'product'
                          ? 'product'
                          : /^(inv|ord)/i.test(file.name) || file.name.toLowerCase().endsWith('.pdf')
                          ? 'bill'
                          : 'product';
                      return (
                        <div key={file.name} className="px-3.5 py-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-medium text-[#2E1A1E] truncate min-w-[140px] flex-1" title={file.name}>
                            {file.name}
                          </span>
                          <select
                            value={chosen?.targetKind || defaultKind}
                            onChange={(e) =>
                              chosen &&
                              setManualAssignment(
                                file,
                                chosen.expenseId,
                                e.target.value as 'bill' | 'product'
                              )
                            }
                            disabled={!chosen}
                            className="px-2 py-1 rounded border border-[#D9C9B4] bg-white text-[11px] disabled:opacity-50"
                          >
                            <option value="product">Product Img</option>
                            <option value="bill">Bill / Inv</option>
                          </select>
                          <select
                            value={chosen?.expenseId || ''}
                            onChange={(e) =>
                              setManualAssignment(file, e.target.value, chosen?.targetKind || defaultKind)
                            }
                            className="px-2 py-1 rounded border border-[#D9C9B4] bg-white text-[11px] max-w-[260px]"
                          >
                            <option value="">-- Leave unattached --</option>
                            {expenses.map((exp) => (
                              <option key={exp.id} value={exp.id}>
                                {exp.date} · {exp.title.slice(0, 28)} ({exp.platform})
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#FAF5EB] border border-[#E8DEC9] rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#541523] mb-1">
                    1. Select Purchase Order (Bill will link to all items in the order)
                  </label>
                  <select
                    value={selectedOrderKey}
                    onChange={(e) => setSelectedOrderKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D9C9B4] bg-white text-xs text-[#2E1A1E]"
                    aria-label="Select purchase order for bulk bill attachment"
                  >
                    {orderGroups.map((grp) => (
                      <option key={grp.orderKey} value={grp.orderKey}>
                        {grp.displayOrderId} — {grp.platform} ({grp.count} item
                        {grp.count > 1 ? 's' : ''}, ₹{grp.total.toFixed(0)})
                        {grp.hasBill ? ' [Has Bill]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {activeOrderGroup && (
                  <div className="text-xs text-[#541523] bg-white border border-[#E8DEC9] rounded-lg px-3 py-2">
                    Attaching a bill to <strong>{activeOrderGroup.displayOrderId}</strong> will update all{' '}
                    <strong>{activeOrderGroup.count}</strong> purchase row(s) under this order automatically.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#541523] mb-1">
                    2. Choose Bill / Invoice File (Image or PDF)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setOrderBillFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-[#541523] file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#541523] file:text-white hover:file:bg-[#6E1E30]"
                  />
                  {orderBillFile && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-1.5">
                      Ready: {orderBillFile.name} ({Math.round(orderBillFile.size / 1024)} KB)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#FDFBF7] border-t border-[#E8DEC9] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#D9C9B4] text-xs font-semibold text-[#541523] hover:bg-white"
          >
            Cancel
          </button>
          {activeTab === 'folder' ? (
            <button
              type="button"
              disabled={saving || totalReadyFiles === 0}
              onClick={handleApplyFolderMatches}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#541523] text-white text-xs font-semibold hover:bg-[#6E1E30] disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {saving
                ? 'Saving files...'
                : `Attach ${totalReadyFiles} File${totalReadyFiles === 1 ? '' : 's'}`}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving || !activeOrderGroup || !orderBillFile}
              onClick={handleApplyOrderBill}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#541523] text-white text-xs font-semibold hover:bg-[#6E1E30] disabled:opacity-50"
            >
              <Layers className="w-3.5 h-3.5" />
              {saving
                ? 'Linking bill...'
                : `Link Bill to All ${activeOrderGroup?.count || 0} Items`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export async function clearStoredMediaIfUnused(
  mediaId: string | undefined,
  expenses: Expense[],
  excludingExpenseId?: string
): Promise<void> {
  if (!mediaId) return;
  const stillUsed = expenses.some(
    (e) =>
      e.id !== excludingExpenseId &&
      (e.receiptMediaId === mediaId || e.imageMediaId === mediaId)
  );
  if (!stillUsed) {
    await deletePurchaseMedia(mediaId);
  }
}
