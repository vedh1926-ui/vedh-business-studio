'use client';

import React, { useMemo, useState } from 'react';
import { Expense, InventoryItem } from '@/lib/types';
import {
  normalizeNameKey,
  resolvePurchaseUnits,
} from '@/lib/oprFormulas';
import { computePurchaseRowMetrics } from '@/lib/purchaseFormulas';
import { formatINR } from '@/lib/utils';
import {
  X,
  PackagePlus,
  PackageCheck,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Unlink,
  Check,
} from 'lucide-react';

export interface LinkExpenseToInventoryPayload {
  expenseId: string;
  mode: 'existing' | 'new';
  targetInventoryId?: string;
  newItemData?: {
    name: string;
    type: 'Raw Material' | 'Packaging' | 'Finished Good';
    category: string;
    unit: string;
    reorderLevel: number;
    supplier?: string;
  };
  quantityToAdd: number;
  markDelivered?: boolean;
}

interface AddToInventoryModalProps {
  expense: Expense;
  inventory: InventoryItem[];
  categories?: string[];
  units?: string[];
  onClose: () => void;
  onLink: (payload: LinkExpenseToInventoryPayload) => void;
  onUnlink?: (expenseId: string, deductStock: boolean) => void;
  onNavigateToInventory?: () => void;
}

/**
 * Infer the most appropriate inventory type based on purchase category or item title.
 */
function inferInventoryType(category: string, title: string): InventoryItem['type'] {
  const cat = (category || '').toLowerCase();
  const t = (title || '').toLowerCase();

  if (
    cat.includes('packaging') ||
    cat.includes('box') ||
    t.includes('box') ||
    t.includes('bag') ||
    t.includes('ribbon') ||
    t.includes('pouch') ||
    t.includes('packaging')
  ) {
    return 'Packaging';
  }

  if (cat.includes('finished') || cat.includes('product') || cat.includes('hamper')) {
    return 'Finished Good';
  }

  return 'Raw Material';
}

/**
 * Infer unit of measure from title/dimensions if possible, fallback to 'pcs'.
 */
function inferUnitOfMeasure(
  dimensions?: string,
  title?: string,
  availableUnits: string[] = []
): string {
  const text = `${dimensions || ''} ${title || ''}`.toLowerCase();

  if (text.includes('kg') && availableUnits.includes('kg')) return 'kg';
  if (text.includes(' gm') || text.includes('gram') || text.includes(' g ') || text.endsWith('g')) {
    if (availableUnits.includes('g')) return 'g';
  }
  if (text.includes('ml') && availableUnits.includes('ml')) return 'ml';
  if (text.includes('roll') && availableUnits.includes('roll')) return 'roll';
  if (text.includes('meter') || text.includes(' m ')) {
    if (availableUnits.includes('m')) return 'm';
  }
  if (text.includes('set') && availableUnits.includes('set')) return 'set';
  if (text.includes('pack') && availableUnits.includes('pack')) return 'pack';

  return availableUnits.includes('pcs') ? 'pcs' : availableUnits[0] || 'pcs';
}

export default function AddToInventoryModal({
  expense,
  inventory,
  categories = ['Wax / Candles', 'Packaging', 'Resin Supplies', 'Fabric', 'Other'],
  units = ['pcs', 'g', 'kg', 'ml', 'm', 'roll', 'set', 'inch', 'cm', 'pack'],
  onClose,
  onLink,
  onUnlink,
  onNavigateToInventory,
}: AddToInventoryModalProps) {
  const metrics = useMemo(() => computePurchaseRowMetrics(expense), [expense]);
  const defaultUnits = useMemo(() => resolvePurchaseUnits(expense), [expense]);

  // Is this expense already linked to an inventory item?
  const isAlreadyLinked = Boolean(expense.appliedToStock && expense.stockItem);

  // Search existing inventory for smart matches
  const { suggestedItem, matchedExistingItem } = useMemo(() => {
    const rawStockItem = (expense.stockItem || '').trim();
    const cleanTitle = (expense.title || '').trim();
    const titleKey = normalizeNameKey(cleanTitle);
    const stockKey = normalizeNameKey(rawStockItem);

    // Exact match by linked stockItem or title
    let exact: InventoryItem | undefined;
    if (stockKey) {
      exact = inventory.find((i) => normalizeNameKey(i.name) === stockKey);
    }
    if (!exact && titleKey) {
      exact = inventory.find((i) => normalizeNameKey(i.name) === titleKey);
    }

    // Fuzzy / substring match
    let fuzzy: InventoryItem | undefined;
    if (!exact) {
      const words = cleanTitle.toLowerCase().split(/\s+/).filter((w) => w.length >= 3);
      fuzzy = inventory.find((i) => {
        const iName = i.name.toLowerCase();
        return words.some((w) => iName.includes(w));
      });
    }

    return {
      matchedExistingItem: exact || null,
      suggestedItem: exact || fuzzy || null,
    };
  }, [expense, inventory]);

  // Mode state: 'existing' vs 'new'
  const [mode, setMode] = useState<'existing' | 'new'>(
    suggestedItem && inventory.length > 0 ? 'existing' : 'new'
  );

  // Existing selection state
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>(
    suggestedItem?.id || inventory[0]?.id || ''
  );
  const [existingSearch, setExistingSearch] = useState('');

  // Ensure expense category is in the options list
  const allCategoryOptions = useMemo(() => {
    const list = [expense.category, ...categories].filter(Boolean);
    return Array.from(new Set(list));
  }, [expense.category, categories]);

  // New item form state
  const [newName, setNewName] = useState(
    (expense.stockItem || expense.title || '').trim()
  );
  const [newType, setNewType] = useState<InventoryItem['type']>(() =>
    inferInventoryType(expense.category, expense.title)
  );
  const [newCategory, setNewCategory] = useState<string>(() => {
    return expense.category || categories[0] || 'Packaging';
  });
  const [newUnit, setNewUnit] = useState<string>(() =>
    inferUnitOfMeasure(expense.dimensions, expense.title, units)
  );
  const [newReorderLevel, setNewReorderLevel] = useState('5');
  const [newSupplier, setNewSupplier] = useState(
    expense.supplierName || expense.platform || ''
  );

  // Existing selection category filter
  const [existingCategoryFilter, setExistingCategoryFilter] = useState<string>('all');

  // Quantity to add
  const [quantityToAddStr, setQuantityToAddStr] = useState<string>(
    String(expense.stockQtyReceived ?? defaultUnits)
  );

  // Mark delivered toggle
  const isDelivered = (expense.purchaseStatus || '').toLowerCase() === 'delivered';
  const [markDelivered, setMarkDelivered] = useState<boolean>(!isDelivered);

  // Unlink confirmation state
  const [isConfirmingUnlink, setIsConfirmingUnlink] = useState(false);
  const [deductOnUnlink, setDeductOnUnlink] = useState(true);

  // Filtered inventory list for existing picker, prioritizing items with same category
  const filteredInventoryOptions = useMemo(() => {
    let list = inventory;
    if (existingCategoryFilter !== 'all') {
      list = list.filter(
        (item) => (item.category || '').toLowerCase() === existingCategoryFilter.toLowerCase()
      );
    }
    if (existingSearch.trim()) {
      const q = existingSearch.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
      );
    }
    // Sort so items matching expense.category come first, then alphabetical by name
    return [...list].sort((a, b) => {
      const matchA =
        (a.category || '').toLowerCase() === (expense.category || '').toLowerCase();
      const matchB =
        (b.category || '').toLowerCase() === (expense.category || '').toLowerCase();
      if (matchA && !matchB) return -1;
      if (!matchA && matchB) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [inventory, existingSearch, existingCategoryFilter, expense.category]);

  // Selected item reference for 'existing' mode
  const selectedItem = useMemo(() => {
    return (
      inventory.find((i) => i.id === selectedInventoryId) ||
      filteredInventoryOptions[0] ||
      inventory[0] ||
      null
    );
  }, [inventory, selectedInventoryId, filteredInventoryOptions]);

  const quantityToAdd = parseFloat(quantityToAddStr) || 0;

  // Compute live preview metrics for existing item
  const existingPreview = useMemo(() => {
    if (!selectedItem) return null;
    const currentStock = selectedItem.stock ?? 0;
    const nextStock = Math.max(0, currentStock + quantityToAdd);
    const unitPrice = metrics.costPerUnit || (quantityToAdd > 0 ? expense.amount / quantityToAdd : 0);
    const oldVal = currentStock * (selectedItem.avgUnitCost || 0);
    const newVal = quantityToAdd * unitPrice;
    const blendedCost =
      nextStock > 0 ? (oldVal + newVal) / nextStock : unitPrice;

    return {
      currentStock,
      nextStock,
      unitPrice,
      blendedCost,
    };
  }, [selectedItem, quantityToAdd, metrics.costPerUnit, expense.amount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantityToAdd <= 0) return;

    if (mode === 'new') {
      if (!newName.trim()) return;
      onLink({
        expenseId: expense.id,
        mode: 'new',
        newItemData: {
          name: newName.trim(),
          type: newType,
          category: newCategory,
          unit: newUnit,
          reorderLevel: parseInt(newReorderLevel, 10) || 5,
          supplier: newSupplier.trim() || undefined,
        },
        quantityToAdd,
        markDelivered: !isDelivered && markDelivered,
      });
    } else {
      if (!selectedItem) return;
      onLink({
        expenseId: expense.id,
        mode: 'existing',
        targetInventoryId: selectedItem.id,
        quantityToAdd,
        markDelivered: !isDelivered && markDelivered,
      });
    }
  };

  const handleExecuteUnlink = () => {
    if (onUnlink) {
      onUnlink(expense.id, deductOnUnlink);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-to-inventory-title"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col border border-[#E8DDCF] shadow-2xl overflow-hidden my-auto">
        {/* Pinned Header */}
        <div className="shrink-0 bg-[#FAF5EE] border-b border-[#E8DDCF] px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#541523] text-white flex items-center justify-center shrink-0 shadow-sm">
              {isAlreadyLinked ? <PackageCheck size={19} /> : <PackagePlus size={19} />}
            </div>
            <div>
              <h3 id="add-to-inventory-title" className="font-serif text-lg font-bold text-[#2C181B] leading-tight">
                {isAlreadyLinked ? 'Manage Inventory Link' : 'Add Purchase to Inventory'}
              </h3>
              <p className="text-[11px] text-[#7A6E6E] mt-0.5">
                {expense.orderId ? `${expense.orderId} · ` : ''}
                {expense.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-[#541523] hover:bg-[#F2EBE0] rounded-lg transition"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col text-xs">
          <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
            {/* Purchase Item Summary Card */}
            <div className="bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8DDCF]/70 pb-2">
                <span className="font-semibold text-[#2C181B] text-xs">
                  {expense.title}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border border-[#D9C9B4] text-[#541523]">
                  {expense.category}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] pt-1">
                <div>
                  <span className="text-[#7A6E6E] block text-[10px]">Purchase Qty:</span>
                  <span className="font-semibold text-[#2C181B]">
                    {expense.qty ?? 1} {expense.piecesPerPack ? `× ${expense.piecesPerPack}u` : 'packs'}
                  </span>
                </div>
                <div>
                  <span className="text-[#7A6E6E] block text-[10px]">Total Units:</span>
                  <span className="font-bold text-[#541523]">
                    {metrics.totalUnits} units
                  </span>
                </div>
                <div>
                  <span className="text-[#7A6E6E] block text-[10px]">Unit Cost:</span>
                  <span className="font-semibold text-[#2C181B]">
                    {formatINR(metrics.costPerUnit)}/u
                  </span>
                </div>
                <div>
                  <span className="text-[#7A6E6E] block text-[10px]">Delivery Status:</span>
                  <span
                    className={`font-semibold ${
                      isDelivered ? 'text-emerald-700' : 'text-blue-700'
                    }`}
                  >
                    {expense.purchaseStatus || 'Delivered'}
                  </span>
                </div>
              </div>

              {expense.dimensions && (
                <div className="text-[10px] text-[#7A6E6E] pt-1">
                  <strong>Specs/Dimensions:</strong> {expense.dimensions}
                </div>
              )}
            </div>

            {/* If Already Linked Banner */}
            {isAlreadyLinked && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-emerald-950 animate-fadeIn">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-700" />
                  <div>
                    <span className="font-semibold">Linked to Stock Material: </span>
                    <strong className="underline decoration-emerald-500">{expense.stockItem}</strong>
                    <div className="text-[10px] text-emerald-800 mt-0.5">
                      Applied: {expense.stockQtyReceived ?? defaultUnits} units recorded to Physical In Hand
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  {onNavigateToInventory && (
                    <button
                      type="button"
                      onClick={onNavigateToInventory}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100/60 transition"
                      title="Open Stock Ledger to view material"
                    >
                      <ExternalLink size={12} />
                      <span>View in Stock</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsConfirmingUnlink(true)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white border border-rose-300 text-[11px] font-semibold text-rose-800 hover:bg-rose-50 transition"
                    title="Unlink this purchase from inventory"
                  >
                    <Unlink size={12} />
                    <span>Unlink</span>
                  </button>
                </div>
              </div>
            )}

            {/* Unlink Confirmation Card */}
            {isConfirmingUnlink && (
              <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 space-y-2.5 text-rose-950 animate-fadeIn">
                <div className="flex items-center space-x-2 text-rose-800 font-semibold text-xs">
                  <AlertCircle size={15} />
                  <span>Unlink this purchase from Inventory?</span>
                </div>
                <p className="text-[11px] text-rose-800">
                  This will remove the stock link for &ldquo;{expense.stockItem}&rdquo; from this purchase order.
                </p>
                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-rose-900 select-none">
                  <input
                    type="checkbox"
                    checked={deductOnUnlink}
                    onChange={(e) => setDeductOnUnlink(e.target.checked)}
                    className="rounded border-rose-300 text-[#541523] focus:ring-[#541523]"
                  />
                  <span>
                    Also deduct {expense.stockQtyReceived ?? defaultUnits} units from &ldquo;{expense.stockItem}&rdquo; shelf count
                  </span>
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExecuteUnlink}
                    className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-semibold text-xs transition"
                  >
                    Yes, Unlink Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingUnlink(false)}
                    className="px-3 py-1 bg-white border border-rose-300 text-rose-800 rounded-lg text-xs hover:bg-rose-100/50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Smart Suggested Match Banner */}
            {matchedExistingItem && mode === 'new' && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-2 text-amber-950">
                <div className="flex items-center space-x-2">
                  <Sparkles size={16} className="shrink-0 text-amber-700" />
                  <div>
                    <span className="font-semibold text-xs">Existing Material Match Found: </span>
                    <strong>{matchedExistingItem.name}</strong> ({matchedExistingItem.stock} {matchedExistingItem.unit} in stock)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInventoryId(matchedExistingItem.id);
                    setMode('existing');
                  }}
                  className="shrink-0 px-2.5 py-1 rounded-md bg-[#541523] text-white font-semibold text-[11px] hover:bg-[#6E1C30] transition"
                >
                  Use Match
                </button>
              </div>
            )}

            {/* Mode Switch Tabs */}
            <div>
              <label className="block text-[#423A3A] font-semibold mb-1.5">
                How should this purchase be recorded in Inventory?
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF5EE] border border-[#E8DDCF] rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode('existing')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                    mode === 'existing'
                      ? 'bg-[#541523] text-white shadow-sm'
                      : 'text-[#635B5B] hover:text-[#2C181B] hover:bg-white/60'
                  }`}
                >
                  <Layers size={13} />
                  <span>Add to Existing Item</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('new')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                    mode === 'new'
                      ? 'bg-[#541523] text-white shadow-sm'
                      : 'text-[#635B5B] hover:text-[#2C181B] hover:bg-white/60'
                  }`}
                >
                  <PackagePlus size={13} />
                  <span>Create New Material</span>
                </button>
              </div>
            </div>

            {/* MODE 1: Add to Existing Item */}
            {mode === 'existing' && (
              <div className="space-y-3 bg-stone-50/60 border border-[#E8DDCF] rounded-xl p-3.5">
                <div>
                  <label className="block text-[#423A3A] font-semibold mb-1">
                    Select Existing Material in Stock *
                  </label>
                  <div className="space-y-1.5">
                    {/* Category Filter Pills for Existing Items */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setExistingCategoryFilter('all')}
                        className={`px-2 py-0.5 rounded-full border transition whitespace-nowrap ${
                          existingCategoryFilter === 'all'
                            ? 'bg-[#541523] text-white border-[#541523]'
                            : 'bg-white text-[#635B5B] border-[#D9C9B4] hover:bg-[#FAF6F0]'
                        }`}
                      >
                        All Categories ({inventory.length})
                      </button>
                      {expense.category && (
                        <button
                          type="button"
                          onClick={() => setExistingCategoryFilter(expense.category)}
                          className={`px-2 py-0.5 rounded-full border transition font-medium whitespace-nowrap ${
                            existingCategoryFilter.toLowerCase() === expense.category.toLowerCase()
                              ? 'bg-[#541523] text-white border-[#541523]'
                              : 'bg-[#FAF0E6] text-[#8F243C] border-[#E8DDCF] hover:bg-[#F2E5D5]'
                          }`}
                        >
                          Matching Category: {expense.category}
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Search materials (e.g. Soy Wax, Box, Ribbon)..."
                      value={existingSearch}
                      onChange={(e) => setExistingSearch(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                    />
                    <select
                      value={selectedInventoryId}
                      onChange={(e) => setSelectedInventoryId(e.target.value)}
                      required
                      aria-label="Select existing inventory material"
                      className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white font-medium text-xs focus:outline-none focus:ring-1 focus:ring-[#541523]"
                    >
                      {filteredInventoryOptions.length === 0 ? (
                        <option value="" disabled>
                          No matching materials found in this category
                        </option>
                      ) : (
                        filteredInventoryOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} [{item.category || item.type}] — Current: {item.stock} {item.unit}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Stock Level Preview Card */}
                {existingPreview && selectedItem && (
                  <div className="bg-white border border-[#E8DDCF] rounded-lg p-3 space-y-2">
                    <div className="text-[11px] font-semibold text-[#541523] flex items-center justify-between border-b border-[#F2EBE0] pb-1.5">
                      <span>Stock Impact Preview</span>
                      <span className="text-[10px] text-[#7A6E6E]">{selectedItem.type}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <div className="text-center">
                        <span className="text-[10px] text-[#7A6E6E] block">Current Shelf Count</span>
                        <span className="font-bold text-[#2C181B] text-sm">
                          {existingPreview.currentStock} {selectedItem.unit}
                        </span>
                      </div>

                      <div className="flex flex-col items-center px-2 text-[#8F243C]">
                        <span className="text-[10px] font-semibold">+{quantityToAdd} {selectedItem.unit}</span>
                        <ArrowRight size={15} />
                      </div>

                      <div className="text-center">
                        <span className="text-[10px] text-[#7A6E6E] block">New Shelf Count</span>
                        <span className="font-bold text-emerald-700 text-sm">
                          {existingPreview.nextStock} {selectedItem.unit}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-[#7A6E6E] pt-1 border-t border-[#F2EBE0]">
                      Landed cost will average from ₹{selectedItem.avgUnitCost || 0} →{' '}
                      <strong className="text-[#2C181B]">₹{formatINR(existingPreview.blendedCost)}/{selectedItem.unit}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: Create New Material */}
            {mode === 'new' && (
              <div className="space-y-3 bg-stone-50/60 border border-[#E8DDCF] rounded-xl p-3.5">
                <div>
                  <label className="block text-[#423A3A] font-semibold mb-1">
                    Material / Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Corrugated Gift Box 12x12, Soy Wax Flakes"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#541523]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#423A3A] font-semibold mb-1">
                      Inventory Type
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as InventoryItem['type'])}
                      className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                    >
                      <option value="Raw Material">Raw Material</option>
                      <option value="Packaging">Packaging</option>
                      <option value="Finished Good">Finished Good</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#423A3A] font-semibold mb-1">
                      Material Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => {
                        const nextCat = e.target.value;
                        setNewCategory(nextCat);
                        setNewType(inferInventoryType(nextCat, newName));
                      }}
                      className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                    >
                      {allCategoryOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#423A3A] font-semibold mb-1">
                      Unit of Measure
                    </label>
                    <select
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                    >
                      {units.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#423A3A] font-semibold mb-1">
                      Low-Stock Reorder Alert
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newReorderLevel}
                      onChange={(e) => setNewReorderLevel(e.target.value)}
                      placeholder="5"
                      className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#423A3A] font-semibold mb-1">
                      Supplier / Source
                    </label>
                    <input
                      type="text"
                      value={newSupplier}
                      onChange={(e) => setNewSupplier(e.target.value)}
                      placeholder="e.g. Amazon, Begum Bazaar"
                      className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quantity to Add & Delivery Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Quantity / Units to Add *
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    value={quantityToAddStr}
                    onChange={(e) => setQuantityToAddStr(e.target.value)}
                    placeholder={String(defaultUnits)}
                    className="flex-1 px-3 py-2 border rounded-lg border-[#D9C9B4] bg-white font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-[#541523]"
                  />
                  <span className="text-xs text-[#7A6E6E] font-medium shrink-0">
                    {mode === 'new' ? newUnit : selectedItem?.unit || 'units'}
                  </span>
                </div>
                <p className="text-[10px] text-[#7A6E6E] mt-1">
                  Defaulted to {metrics.totalUnits} units ({expense.qty ?? 1} packs × {expense.piecesPerPack ?? 1} per pack).
                </p>
              </div>

              {!isDelivered && (
                <div className="flex flex-col justify-center pt-2">
                  <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-[#2C181B]">
                    <input
                      type="checkbox"
                      checked={markDelivered}
                      onChange={(e) => setMarkDelivered(e.target.checked)}
                      className="rounded border-[#D9C9B4] text-[#541523] focus:ring-[#541523] mt-0.5"
                    />
                    <span>
                      <strong className="font-semibold block text-[#541523]">
                        Mark Purchase as Delivered
                      </strong>
                      <span className="text-[10px] text-[#7A6E6E] block mt-0.5">
                        Delivered items immediately reflect in Physical In Hand. Uncheck to track as Incoming stock.
                      </span>
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Pinned Footer */}
          <div className="shrink-0 bg-[#FCFAF7] border-t border-[#E8DDCF] px-5 sm:px-6 py-3.5 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D9C9B4] rounded-lg text-xs font-medium text-[#635B5B] bg-white hover:bg-[#FAF6F0] transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={quantityToAdd <= 0 || (mode === 'new' && !newName.trim())}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition"
            >
              {isAlreadyLinked ? <Check size={14} /> : <PackagePlus size={14} />}
              <span>
                {isAlreadyLinked
                  ? 'Update Inventory Link'
                  : mode === 'existing'
                  ? `Add +${quantityToAdd} to ${selectedItem?.name || 'Stock'}`
                  : `Create & Add ${quantityToAdd} to Stock`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
