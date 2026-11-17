'use client';

import React, { useMemo, useState } from 'react';
import {
  Expense,
  InventoryItem,
  Order,
  Product,
  RecipeIngredient,
  StockAdjustment,
} from '@/lib/types';
import {
  computeInventoryLedgerMetrics,
  getLocalTodayYmd,
  normalizeNameKey,
} from '@/lib/oprFormulas';
import { formatINR } from '@/lib/utils';
import {
  AlertTriangle,
  ClipboardCheck,
  History,
  Plus,
  ShoppingBag,
  Truck,
  Search,
  X,
  Layers,
  FolderTree,
  ArrowUpDown,
  Pencil,
  Trash2,
  Tag,
  CheckCircle2,
  PackageCheck,
  ExternalLink,
} from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  categories?: string[];
  products?: Product[];
  recipes?: RecipeIngredient[];
  orders?: Order[];
  expenses?: Expense[];
  adjustments?: StockAdjustment[];
  adjustmentReasons?: string[];
  onOpenNewStock: () => void;
  onEditStock?: (item: InventoryItem) => void;
  onDeleteInventoryMaterial?: (id: string) => void;
  onAdjustStock: (id: string, delta: number, reason?: string, notes?: string) => void;
  onUpdateInventoryMaterial?: (
    id: string,
    updates: Partial<InventoryItem>
  ) => void;
  onAddAdjustment?: (payload: Omit<StockAdjustment, 'id'>) => void;
  onOpenEnquiryChecker?: () => void;
}

type InventorySectionView = 'ledger' | 'categories' | 'adjustments';
type StockHealthFilter = 'all' | 'attention' | 'missing-count' | 'incoming' | 'low' | 'critical';
type InventoryOrderBy =
  | 'category_name'
  | 'name_asc'
  | 'name_desc'
  | 'stock_desc'
  | 'stock_asc'
  | 'urgency'
  | 'cost_desc'
  | 'supplier';

export default function InventoryView({
  inventory,
  categories = [],
  products = [],
  recipes = [],
  orders = [],
  expenses = [],
  adjustments = [],
  adjustmentReasons = [
    'Stock count correction',
    'Breakage / wastage',
    'Sample / trial piece',
    'Gift / free item',
    'Other',
  ],
  onOpenNewStock,
  onEditStock,
  onDeleteInventoryMaterial,
  onAdjustStock,
  onUpdateInventoryMaterial,
  onAddAdjustment,
  onOpenEnquiryChecker,
}: InventoryViewProps) {
  // Navigation View Tab
  const [sectionView, setSectionView] = useState<InventorySectionView>('ledger');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Raw Material' | 'Packaging' | 'Finished Good'>('All');
  const [statusFilter, setStatusFilter] = useState<StockHealthFilter>('all');
  const [orderBy, setOrderBy] = useState<InventoryOrderBy>('category_name');
  const [groupByCategory, setGroupByCategory] = useState<boolean>(true);

  // Quick adjustment reason
  const [selectedReason, setSelectedReason] = useState<string>(
    adjustmentReasons[0] || 'Stock count correction'
  );

  // Custom Adjustment Log form
  const [adjMaterialId, setAdjMaterialId] = useState<string>(inventory[0]?.id || '');
  const [adjDeltaStr, setAdjDeltaStr] = useState<string>('');
  const [adjReason, setAdjReason] = useState<string>(
    adjustmentReasons[1] || adjustmentReasons[0] || 'Breakage / wastage'
  );
  const [adjNotes, setAdjNotes] = useState<string>('');

  // Comprehensive ledger summary
  const ledgerSummary = useMemo(
    () =>
      computeInventoryLedgerMetrics(
        inventory,
        recipes,
        orders,
        expenses,
        adjustments,
        products
      ),
    [inventory, recipes, orders, expenses, adjustments, products]
  );

  // Dynamic aggregation of all active categories (combining master lists, expenses, and inventory)
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    // Add categories from props (Master Lists)
    for (const c of categories) {
      if (c && c.trim()) set.add(c.trim());
    }
    // Add categories from current inventory
    for (const item of inventory) {
      if (item.category && item.category.trim()) set.add(item.category.trim());
    }
    // Add categories from expenses
    for (const exp of expenses) {
      if (exp.category && exp.category.trim()) set.add(exp.category.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categories, inventory, expenses]);

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of inventory) {
      const cat = (item.category || 'Uncategorized').trim();
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [inventory]);

  // Filtered and Sorted Inventory Items
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    const result = inventory.filter((item) => {
      // Type Filter
      if (typeFilter !== 'All' && item.type !== typeFilter) return false;

      // Category Filter
      if (categoryFilter !== 'All') {
        const itemCat = (item.category || 'Uncategorized').trim().toLowerCase();
        if (itemCat !== categoryFilter.toLowerCase()) return false;
      }

      // Health / Status Filter
      const l = ledgerSummary.ledgerById[item.id];
      if (statusFilter === 'missing-count') {
        if (!l?.needsOpeningCount) return false;
      } else if (statusFilter === 'incoming') {
        if (!l || l.incomingFromPurchases <= 0) return false;
      } else if (statusFilter === 'attention') {
        if (
          !l ||
          (l.ledgerStatus !== 'SHORT' &&
            l.ledgerStatus !== 'Short - stock arriving' &&
            l.ledgerStatus !== 'LOW')
        ) {
          return false;
        }
      } else if (statusFilter === 'low') {
        if (l?.ledgerStatus !== 'LOW') return false;
      } else if (statusFilter === 'critical') {
        if (l?.ledgerStatus !== 'SHORT') return false;
      }

      // Search Query
      if (q) {
        const haystack = [
          item.name,
          item.category,
          item.type,
          item.unit,
          item.supplier,
          item.purchaseSource,
          item.lastAdjustmentReason,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    // Sorting / Ordering Logic
    result.sort((a, b) => {
      const lA = ledgerSummary.ledgerById[a.id];
      const lB = ledgerSummary.ledgerById[b.id];
      const inHandA = lA?.physicalInHand ?? a.stock ?? 0;
      const inHandB = lB?.physicalInHand ?? b.stock ?? 0;
      const costA = a.avgUnitCost ?? 0;
      const costB = b.avgUnitCost ?? 0;

      switch (orderBy) {
        case 'category_name': {
          const catA = (a.category || 'zzz').toLowerCase();
          const catB = (b.category || 'zzz').toLowerCase();
          if (catA !== catB) return catA.localeCompare(catB);
          return a.name.localeCompare(b.name);
        }
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'stock_desc':
          return inHandB - inHandA;
        case 'stock_asc':
          return inHandA - inHandB;
        case 'cost_desc':
          return costB - costA;
        case 'supplier': {
          const supA = (a.supplier || 'zzz').toLowerCase();
          const supB = (b.supplier || 'zzz').toLowerCase();
          if (supA !== supB) return supA.localeCompare(supB);
          return a.name.localeCompare(b.name);
        }
        case 'urgency': {
          const rank = (status?: string) => {
            if (status === 'SHORT') return 0;
            if (status === 'Short - stock arriving') return 1;
            if (status === 'LOW') return 2;
            if (status === 'Enter opening count') return 3;
            return 4;
          };
          const rA = rank(lA?.ledgerStatus);
          const rB = rank(lB?.ledgerStatus);
          if (rA !== rB) return rA - rB;
          return inHandA - inHandB;
        }
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [
    inventory,
    search,
    categoryFilter,
    typeFilter,
    statusFilter,
    orderBy,
    ledgerSummary.ledgerById,
  ]);

  // Group items by category for grouped view
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, InventoryItem[]> = {};
    for (const item of filteredItems) {
      const cat = (item.category || 'Uncategorized').trim();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [filteredItems]);

  // Category Breakdown Matrix data (matching Expenses Category Breakdown)
  const categoryMatrix = useMemo(() => {
    const matrix: Array<{
      category: string;
      itemCount: number;
      totalUnits: number;
      incomingUnits: number;
      estTotalValue: number;
      healthyCount: number;
      lowCount: number;
      shortCount: number;
    }> = [];

    // Group all inventory items by category
    const map: Record<string, InventoryItem[]> = {};
    for (const item of inventory) {
      const cat = (item.category || 'Uncategorized').trim();
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    }

    for (const [cat, items] of Object.entries(map)) {
      let totalUnits = 0;
      let incomingUnits = 0;
      let estTotalValue = 0;
      let healthyCount = 0;
      let lowCount = 0;
      let shortCount = 0;

      for (const item of items) {
        const l = ledgerSummary.ledgerById[item.id];
        const inHand = l?.physicalInHand ?? item.stock ?? 0;
        const incoming = l?.incomingFromPurchases ?? 0;
        const cost = item.avgUnitCost ?? 0;

        totalUnits += inHand;
        incomingUnits += incoming;
        estTotalValue += inHand * cost;

        if (l?.ledgerStatus === 'SHORT') shortCount += 1;
        else if (l?.ledgerStatus === 'LOW' || l?.ledgerStatus === 'Short - stock arriving') lowCount += 1;
        else healthyCount += 1;
      }

      matrix.push({
        category: cat,
        itemCount: items.length,
        totalUnits: Math.round(totalUnits * 100) / 100,
        incomingUnits: Math.round(incomingUnits * 100) / 100,
        estTotalValue: Math.round(estTotalValue * 100) / 100,
        healthyCount,
        lowCount,
        shortCount,
      });
    }

    matrix.sort((a, b) => b.itemCount - a.itemCount || a.category.localeCompare(b.category));
    return matrix;
  }, [inventory, ledgerSummary.ledgerById]);

  // Totals for active filtered view
  const activeStats = useMemo(() => {
    let units = 0;
    let estVal = 0;
    for (const item of filteredItems) {
      const l = ledgerSummary.ledgerById[item.id];
      const inHand = l?.physicalInHand ?? item.stock ?? 0;
      units += inHand;
      estVal += inHand * (item.avgUnitCost ?? 0);
    }
    return {
      units: Math.round(units * 100) / 100,
      estVal: Math.round(estVal * 100) / 100,
    };
  }, [filteredItems, ledgerSummary.ledgerById]);

  const hasActiveFilters =
    search.trim() !== '' ||
    categoryFilter !== 'All' ||
    typeFilter !== 'All' ||
    statusFilter !== 'all';

  const resetAllFilters = () => {
    setSearch('');
    setCategoryFilter('All');
    setTypeFilter('All');
    setStatusFilter('all');
    setOrderBy('category_name');
  };

  const handleCreateCustomAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const mat = inventory.find((i) => i.id === adjMaterialId) || inventory[0];
    const delta = parseFloat(adjDeltaStr);
    if (!mat || Number.isNaN(delta) || delta === 0) return;
    if (onAddAdjustment) {
      onAddAdjustment({
        date: getLocalTodayYmd(),
        materialId: mat.id,
        materialName: mat.name,
        delta,
        reason: adjReason,
        notes: adjNotes.trim() || undefined,
      });
    } else {
      onAdjustStock(mat.id, delta, adjReason, adjNotes.trim() || undefined);
    }
    setAdjDeltaStr('');
    setAdjNotes('');
  };

  const renderItemCard = (item: InventoryItem) => {
    const ledger = ledgerSummary.ledgerById[item.id];
    const reserved = ledger?.committedToOrders ?? 0;
    const free = ledger?.freeAfterOrders ?? item.stock;
    const inHand = ledger?.physicalInHand ?? item.stock;
    const incoming = ledger?.incomingFromPurchases ?? 0;
    const ledgerStatus = ledger?.ledgerStatus ?? 'OK';

    return (
      <div
        key={item.id}
        className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:bg-[#FAF6F0]/60 transition"
      >
        {/* Left: Item name, Category, Type, Supplier */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[#2C181B]">{item.name}</span>
            {item.category && (
              <span
                className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#FAF0E6] text-[#8F243C] border border-[#E8DDCF]"
                title={`Category: ${item.category}`}
              >
                <Tag size={10} />
                <span>{item.category}</span>
              </span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F2EBE0] text-[#541523] font-medium">
              {item.type}
            </span>
            {incoming > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                <Truck size={11} />
                +{incoming} {item.unit} arriving
              </span>
            )}
          </div>

          <div className="text-[11px] text-[#7A6E6E] flex flex-wrap items-center gap-2 mt-1">
            {item.supplier && <span>Supplier: <strong className="text-[#2C181B] font-medium">{item.supplier}</strong></span>}
            {item.purchaseSource && (
              <span className="text-[#8C7D7D] truncate max-w-[280px]" title={item.purchaseSource}>
                · {item.purchaseSource}
              </span>
            )}
          </div>
        </div>

        {/* Middle & Right: Opening Count, Avg Cost, In Hand, Status, Actions */}
        <div className="flex flex-wrap items-center gap-4 justify-between xl:justify-end">
          {/* Opening Count */}
          <div className="text-xs flex items-center gap-1.5">
            <span className="text-[#7A6E6E]">Opening:</span>
            {onUpdateInventoryMaterial ? (
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Count?"
                value={item.openingStock ?? ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  const val = raw === '' ? null : Number(raw);
                  if (val === null || (Number.isFinite(val) && val >= 0)) {
                    onUpdateInventoryMaterial(item.id, { openingStock: val });
                  }
                }}
                className={`w-20 px-2 py-1 rounded border text-right font-mono text-xs ${
                  item.openingStock === null
                    ? 'border-amber-400 bg-amber-50 placeholder:text-amber-700'
                    : 'border-[#D9C9B4] bg-white'
                }`}
              />
            ) : (
              <span className="font-mono font-semibold text-[#2C181B]">
                {item.openingStock ?? '—'}
              </span>
            )}
          </div>

          {/* Avg Cost / Unit */}
          <div className="text-xs flex items-center gap-1.5">
            <span className="text-[#7A6E6E]">Avg ₹/{item.unit}:</span>
            {onUpdateInventoryMaterial ? (
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="—"
                value={item.avgUnitCost ?? ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  const val = raw === '' ? undefined : Number(raw);
                  if (val === undefined || (Number.isFinite(val) && val >= 0)) {
                    onUpdateInventoryMaterial(item.id, { avgUnitCost: val });
                  }
                }}
                className="w-20 px-2 py-1 rounded border border-[#D9C9B4] bg-white text-right font-mono text-xs"
              />
            ) : (
              <span className="font-mono font-semibold text-[#2C181B]">
                {item.avgUnitCost !== undefined ? formatINR(item.avgUnitCost, 2) : '—'}
              </span>
            )}
          </div>

          {/* In Hand Stock */}
          <div className="text-right min-w-[110px]">
            <div className="text-sm font-bold text-[#2C181B]">
              {ledger?.needsOpeningCount ? '—' : `${inHand} ${item.unit}`}
            </div>
            <div className="text-[10px] text-[#7A6E6E]">
              {reserved > 0 ? `${reserved} reserved · Free: ${free}` : `Reorder at ${item.reorderLevel}`}
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${
              ledgerStatus === 'OK'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : ledgerStatus === 'SHORT'
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : ledgerStatus === 'Short - stock arriving'
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : ledgerStatus === 'LOW'
                ? 'bg-yellow-100 text-yellow-900 border border-yellow-200'
                : 'bg-stone-100 text-amber-800 border border-amber-300'
            }`}
          >
            {ledgerStatus === 'Enter opening count' ? (
              <span className="inline-flex items-center gap-1">
                <AlertTriangle size={12} /> Enter count
              </span>
            ) : (
              ledgerStatus
            )}
          </span>

          {/* Quick +/- and Edit/Delete Actions */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onAdjustStock(item.id, -1, selectedReason)}
              className="w-7 h-7 rounded border border-[#D9C9B4] bg-white text-stone-700 hover:bg-[#FAF6F0] flex items-center justify-center font-bold text-xs"
              title={`-1 (${selectedReason})`}
            >
              -
            </button>
            <button
              onClick={() => onAdjustStock(item.id, 1, selectedReason)}
              className="w-7 h-7 rounded border border-[#D9C9B4] bg-white text-stone-700 hover:bg-[#FAF6F0] flex items-center justify-center font-bold text-xs"
              title={`+1 (${selectedReason})`}
            >
              +
            </button>
            {onEditStock && (
              <button
                onClick={() => onEditStock(item)}
                className="p-1.5 text-stone-500 hover:text-[#541523] hover:bg-[#F2EBE0] rounded transition ml-1"
                title="Edit material details and category"
              >
                <Pencil size={13} />
              </button>
            )}
            {onDeleteInventoryMaterial && (
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${item.name}" from inventory?`)) {
                    onDeleteInventoryMaterial(item.id);
                  }
                }}
                className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                title="Delete material from inventory"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Inventory &amp; Raw Materials Ledger
          </h2>
          <p className="text-xs text-[#7A6E6E] mt-0.5">
            {inventory.length} materials tracked across {Object.keys(categoryCounts).length} categories — synced with Purchases &amp; Orders
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenEnquiryChecker && (
            <button
              onClick={onOpenEnquiryChecker}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg border border-[#D9C9B4] bg-[#FDFBF7] hover:bg-[#F2EBE0] text-xs font-semibold text-[#541523] transition shadow-sm"
            >
              <ClipboardCheck size={15} />
              <span>Can I Accept?</span>
            </button>
          )}
          <button
            onClick={onOpenNewStock}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide transition shadow-sm"
          >
            <Plus size={16} />
            <span>+ Add stock</span>
          </button>
        </div>
      </div>

      {/* Workbook Stock KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => {
            setSectionView('ledger');
            setStatusFilter('all');
          }}
          className={`text-left bg-white border rounded-xl p-4 shadow-sm transition ${
            statusFilter === 'all' && sectionView === 'ledger' ? 'border-[#541523]/60 bg-[#FAF6F0]/40' : 'border-[#E8DDCF]'
          }`}
        >
          <p className="text-[11px] text-[#7A6E6E] font-medium">Materials Tracked</p>
          <p className="text-2xl font-serif font-bold text-[#2C181B] mt-1">{inventory.length}</p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">{Object.keys(categoryCounts).length} active categories</p>
        </button>

        <button
          onClick={() => {
            setSectionView('ledger');
            setStatusFilter('attention');
          }}
          className={`text-left bg-white border rounded-xl p-4 shadow-sm transition ${
            statusFilter === 'attention' ? 'border-rose-400 bg-rose-50/40' : 'border-[#E8DDCF]'
          }`}
        >
          <p className="text-[11px] text-[#7A6E6E] font-medium">Shopping List Alerts</p>
          <p className="text-2xl font-serif font-bold text-rose-700 mt-1">
            {ledgerSummary.shortCount + ledgerSummary.shortArrivingCount + ledgerSummary.lowCount}
          </p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">
            {ledgerSummary.shortCount} short · {ledgerSummary.lowCount} low reorder
          </p>
        </button>

        <button
          onClick={() => {
            setSectionView('ledger');
            setStatusFilter('missing-count');
          }}
          className={`text-left bg-white border rounded-xl p-4 shadow-sm transition ${
            statusFilter === 'missing-count' ? 'border-amber-400 bg-amber-50/40' : 'border-[#E8DDCF]'
          }`}
        >
          <p className="text-[11px] text-[#7A6E6E] font-medium">Missing Opening Count</p>
          <p className="text-2xl font-serif font-bold text-amber-700 mt-1">
            {ledgerSummary.missingOpeningCount}
          </p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">Click to enter shelf counts</p>
        </button>

        <button
          onClick={() => {
            setSectionView('ledger');
            setStatusFilter('incoming');
          }}
          className={`text-left bg-white border rounded-xl p-4 shadow-sm transition ${
            statusFilter === 'incoming' ? 'border-emerald-400 bg-emerald-50/40' : 'border-[#E8DDCF]'
          }`}
        >
          <p className="text-[11px] text-[#7A6E6E] font-medium">Incoming Shipments</p>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">
            {Object.values(ledgerSummary.ledgerById).filter((l) => l.incomingFromPurchases > 0).length}
          </p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">Linked from Ordered/Shipped POs</p>
        </button>
      </div>

      {/* Shopping List Callout if any items need attention */}
      {ledgerSummary.shoppingList.length > 0 && sectionView === 'ledger' && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <ShoppingBag size={15} className="text-amber-700" />
              <span>SHOPPING LIST — Materials to Restock ({ledgerSummary.shoppingList.length})</span>
            </div>
            <span className="text-[11px] text-amber-800">
              Auto-calculated after reserving committed customer orders &amp; incoming purchases
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {ledgerSummary.shoppingList.slice(0, 8).map(({ item, ledger }) => (
              <div
                key={item.id}
                className="bg-white border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[#2C181B] truncate">{item.name}</div>
                  <div className="text-[10px] text-[#7A6E6E]">
                    {item.category && <span className="text-[#8F243C]">{item.category} · </span>}
                    Free: {ledger.freeAfterOrders} {item.unit}
                    {ledger.incomingFromPurchases > 0 ? ` · +${ledger.incomingFromPurchases} inc` : ''}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    ledger.ledgerStatus === 'SHORT'
                      ? 'bg-rose-100 text-rose-800'
                      : ledger.ledgerStatus === 'Short - stock arriving'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {ledger.ledgerStatus === 'LOW' ? `Buy ~${ledger.recommendedOrderQty}` : ledger.ledgerStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Section View Tabs: Stock Ledger vs Category Matrix vs Adjustments */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="inline-flex rounded-xl border border-[#D9C9B4] bg-[#FAF5EE] p-1">
          <button
            onClick={() => setSectionView('ledger')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
              sectionView === 'ledger' ? 'bg-[#541523] text-white shadow-xs' : 'text-[#635B5B] hover:text-[#2C181B]'
            }`}
          >
            Stock Ledger ({inventory.length})
          </button>
          <button
            onClick={() => setSectionView('categories')}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition ${
              sectionView === 'categories' ? 'bg-[#541523] text-white shadow-xs' : 'text-[#635B5B] hover:text-[#2C181B]'
            }`}
          >
            <FolderTree size={13} />
            <span>Category Matrix ({Object.keys(categoryCounts).length})</span>
          </button>
          <button
            onClick={() => setSectionView('adjustments')}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition ${
              sectionView === 'adjustments' ? 'bg-[#541523] text-white shadow-xs' : 'text-[#635B5B] hover:text-[#2C181B]'
            }`}
          >
            <History size={13} />
            <span>Adjustments ({adjustments.length})</span>
          </button>
        </div>

        {sectionView === 'ledger' && (
          <div className="flex items-center space-x-2">
            <span className="text-[#7A6E6E] font-medium whitespace-nowrap text-[11px]">Quick +/- reason:</span>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="px-2.5 py-1 border border-[#D9C9B4] rounded-lg bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#541523]"
            >
              {adjustmentReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: CATEGORY MATRIX (BREAKDOWN) */}
      {sectionView === 'categories' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E8DDCF] rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2EBE0] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#2C181B] flex items-center space-x-2">
                  <FolderTree size={18} className="text-[#541523]" />
                  <span>Workshop Inventory Category Matrix</span>
                </h3>
                <p className="text-xs text-[#7A6E6E] mt-0.5">
                  Consolidated material quantities, incoming purchases, and stock health synchronized with Expenses categories
                </p>
              </div>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF5EE] border-b border-[#E8DDCF] text-[10px] uppercase tracking-wider text-[#7A6E6E]">
                    <th className="py-2.5 px-4 font-semibold">Category</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Materials Count</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Total Stock In Hand</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Incoming Orders</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Est. Inventory Value (₹)</th>
                    <th className="py-2.5 px-4 text-center font-semibold">Health Breakdown</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EBE0]">
                  {categoryMatrix.map((row) => (
                    <tr key={row.category} className="hover:bg-[#FAF6F0] transition">
                      <td className="py-3 px-4 font-semibold text-[#2C181B]">
                        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-[#FAF0E6] text-[#8F243C] font-semibold border border-[#E8DDCF]">
                          <Tag size={11} />
                          <span>{row.category}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium">{row.itemCount}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#2C181B]">
                        {row.totalUnits}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {row.incomingUnits > 0 ? (
                          <span className="text-amber-700 font-semibold">+{row.incomingUnits} arriving</span>
                        ) : (
                          <span className="text-[#8C7D7D]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-serif font-bold text-[#2C181B]">
                        {formatINR(row.estTotalValue)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {row.shortCount > 0 && (
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                              {row.shortCount} Short
                            </span>
                          )}
                          {row.lowCount > 0 && (
                            <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-900 text-[10px] font-bold">
                              {row.lowCount} Low
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {row.healthyCount} OK
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setCategoryFilter(row.category);
                            setSectionView('ledger');
                          }}
                          className="px-2.5 py-1 rounded-md border border-[#D9C9B4] bg-white hover:bg-[#FAF6F0] text-[#541523] font-semibold text-[11px] transition shadow-xs"
                        >
                          Filter Ledger →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ADJUSTMENTS HISTORY */}
      {sectionView === 'adjustments' && (
        <div className="space-y-4">
          {/* Custom Adjustment Form */}
          <form
            onSubmit={handleCreateCustomAdjustment}
            className="bg-[#FAF5EE] border border-[#E8DDCF] rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs"
          >
            <div>
              <label className="block font-semibold text-[#423A3A] mb-1">Select Material *</label>
              <select
                value={adjMaterialId}
                onChange={(e) => setAdjMaterialId(e.target.value)}
                className="w-full px-2.5 py-2 border border-[#D9C9B4] rounded-lg bg-white"
              >
                {inventory.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} [{m.category || m.type}] ({m.stock} {m.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#423A3A] mb-1">Delta / Qty Change *</label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. -2 or +5"
                value={adjDeltaStr}
                onChange={(e) => setAdjDeltaStr(e.target.value)}
                className="w-full px-2.5 py-2 border border-[#D9C9B4] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#423A3A] mb-1">Reason</label>
              <select
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className="w-full px-2.5 py-2 border border-[#D9C9B4] rounded-lg bg-white"
              >
                {adjustmentReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <input
                type="text"
                placeholder="Notes (optional)"
                value={adjNotes}
                onChange={(e) => setAdjNotes(e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-2 border border-[#D9C9B4] rounded-lg"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#541523] text-white font-semibold hover:bg-[#6E1C30] shrink-0"
              >
                Log
              </button>
            </div>
          </form>

          {/* Adjustments Table */}
          <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
            {adjustments.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#7A6E6E]">
                No manual wastage, breakage, or stock count adjustments recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#FAF5EE] border-b border-[#E8DDCF] text-[10px] uppercase tracking-wider text-[#7A6E6E]">
                    <tr>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Material</th>
                      <th className="py-2.5 px-4 text-right">Qty Change</th>
                      <th className="py-2.5 px-4">Reason</th>
                      <th className="py-2.5 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EBE0]">
                    {adjustments.map((adj) => (
                      <tr key={adj.id}>
                        <td className="py-2.5 px-4 font-mono text-[#7A6E6E]">{adj.date}</td>
                        <td className="py-2.5 px-4 font-semibold text-[#2C181B]">{adj.materialName}</td>
                        <td
                          className={`py-2.5 px-4 text-right font-bold ${
                            adj.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {adj.delta > 0 ? `+${adj.delta}` : adj.delta}
                        </td>
                        <td className="py-2.5 px-4">{adj.reason}</td>
                        <td className="py-2.5 px-4 text-[#7A6E6E]">{adj.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: STOCK LEDGER WITH ADVANCED FILTERS & ORDER BY */}
      {sectionView === 'ledger' && (
        <div className="space-y-4">
          {/* Comprehensive Filter Bar (Matching ExpensesView) */}
          <div className="bg-white border border-[#E8DDCF] rounded-2xl p-4 shadow-sm space-y-3">
            {/* Row 1: Search & Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* Search Bar */}
              <div className="lg:col-span-2 relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7D7D]"
                />
                <input
                  type="text"
                  placeholder="Search material, category, supplier, notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border rounded-xl border-[#D9C9B4] bg-white focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category Filter Dropdown */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  aria-label="Filter by material category"
                  className="w-full px-3 py-2 border rounded-xl border-[#D9C9B4] bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#541523]"
                >
                  <option value="All">All Categories ({inventory.length})</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} {categoryCounts[cat] ? `(${categoryCounts[cat]})` : '(0)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Health / Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StockHealthFilter)}
                  aria-label="Filter by stock health"
                  className="w-full px-3 py-2 border rounded-xl border-[#D9C9B4] bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#541523]"
                >
                  <option value="all">All Stock Statuses</option>
                  <option value="attention">Alerts: Short &amp; Low</option>
                  <option value="critical">Critical (Out of Stock / Short)</option>
                  <option value="low">Low Stock (At Reorder Level)</option>
                  <option value="incoming">Incoming Orders Arriving</option>
                  <option value="missing-count">Missing Opening Count</option>
                </select>
              </div>

              {/* Order By / Sort By Dropdown */}
              <div>
                <div className="relative">
                  <select
                    value={orderBy}
                    onChange={(e) => {
                      const next = e.target.value as InventoryOrderBy;
                      setOrderBy(next);
                      if (next === 'category_name') {
                        setGroupByCategory(true);
                      }
                    }}
                    aria-label="Order inventory by"
                    className="w-full px-3 py-2 border rounded-xl border-[#D9C9B4] bg-white font-medium text-[#2C181B] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                  >
                    <option value="category_name">Order by: Category &amp; Name</option>
                    <option value="name_asc">Order by: Name (A → Z)</option>
                    <option value="name_desc">Order by: Name (Z → A)</option>
                    <option value="stock_desc">Order by: Stock (High → Low)</option>
                    <option value="stock_asc">Order by: Stock (Low → High)</option>
                    <option value="urgency">Order by: Urgency (Short First)</option>
                    <option value="cost_desc">Order by: Landed Cost (High → Low)</option>
                    <option value="supplier">Order by: Supplier (A → Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2: Secondary Quick Filters & Grouping Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#F2EBE0] text-xs">
              {/* Type Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto">
                <span className="text-[#7A6E6E] font-medium text-[11px] whitespace-nowrap">Type:</span>
                {(['All', 'Raw Material', 'Packaging', 'Finished Good'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-lg border font-medium transition whitespace-nowrap ${
                      typeFilter === t
                        ? 'bg-[#541523] text-white border-[#541523]'
                        : 'bg-white text-[#635B5B] border-[#E8DDCF] hover:bg-[#FAF6F0]'
                    }`}
                  >
                    {t === 'All' ? 'All Types' : t}
                  </button>
                ))}
              </div>

              {/* Group By Category Switch & Summary / Reset */}
              <div className="flex items-center space-x-3">
                <label className="inline-flex items-center space-x-1.5 cursor-pointer select-none text-[11px] font-semibold text-[#541523]">
                  <input
                    type="checkbox"
                    checked={groupByCategory}
                    onChange={(e) => setGroupByCategory(e.target.checked)}
                    className="rounded border-[#D9C9B4] text-[#541523] focus:ring-[#541523]"
                  />
                  <FolderTree size={13} className="text-[#8F243C]" />
                  <span>Group by Category</span>
                </label>

                {hasActiveFilters && (
                  <button
                    onClick={resetAllFilters}
                    className="text-[#8F243C] hover:underline font-semibold text-[11px]"
                  >
                    Reset filters
                  </button>
                )}

                <div className="text-[11px] text-[#7A6E6E]">
                  Showing <strong className="text-[#2C181B]">{filteredItems.length}</strong> of {inventory.length} items
                  <span className="hidden sm:inline"> · Total: <strong>{activeStats.units}</strong> units ({formatINR(activeStats.estVal)})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Display: Grouped by Category vs Continuous Sorted List */}
          {filteredItems.length === 0 ? (
            <div className="bg-white border border-[#E8DDCF] rounded-2xl p-12 text-center text-xs space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#FAF5EE] text-[#541523] flex items-center justify-center mx-auto">
                <Search size={20} />
              </div>
              <p className="font-semibold text-[#2C181B] text-sm">No inventory materials match your filters</p>
              <p className="text-[#7A6E6E]">
                Try adjusting your search keywords, category filter, or stock health status.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-[#541523] text-white font-semibold text-xs hover:bg-[#6E1C30]"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : groupByCategory ? (
            /* GROUPED BY CATEGORY VIEW */
            <div className="space-y-4">
              {Object.entries(groupedByCategory).map(([cat, items]) => {
                const totalUnits = items.reduce((acc, i) => {
                  const l = ledgerSummary.ledgerById[i.id];
                  return acc + (l?.physicalInHand ?? i.stock ?? 0);
                }, 0);
                const incomingUnits = items.reduce((acc, i) => {
                  const l = ledgerSummary.ledgerById[i.id];
                  return acc + (l?.incomingFromPurchases ?? 0);
                }, 0);

                return (
                  <div
                    key={cat}
                    className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden"
                  >
                    {/* Category Header Card */}
                    <div className="bg-[#FAF5EE] border-b border-[#E8DDCF] px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Tag size={15} className="text-[#8F243C]" />
                        <h4 className="font-serif font-bold text-sm text-[#2C181B]">{cat}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#D9C9B4] font-semibold text-[#541523]">
                          {items.length} {items.length === 1 ? 'material' : 'materials'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-[#7A6E6E]">
                        <span>
                          In Hand: <strong className="text-[#2C181B] font-mono">{Math.round(totalUnits * 100) / 100}</strong> units
                        </span>
                        {incomingUnits > 0 && (
                          <span className="text-amber-700 font-semibold">
                            +{incomingUnits} arriving
                          </span>
                        )}
                        {categoryFilter !== cat && (
                          <button
                            onClick={() => setCategoryFilter(cat)}
                            className="text-[10px] text-[#8F243C] hover:underline font-semibold"
                          >
                            Isolate Category
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Materials under this category */}
                    <div className="divide-y divide-[#F2EBE0]">
                      {items.map((item) => renderItemCard(item))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* CONTINUOUS SORTED LIST VIEW */
            <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
              <div className="divide-y divide-[#F2EBE0]">
                {filteredItems.map((item) => renderItemCard(item))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
