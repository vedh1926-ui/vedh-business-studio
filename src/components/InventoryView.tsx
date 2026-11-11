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
} from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  products?: Product[];
  recipes?: RecipeIngredient[];
  orders?: Order[];
  expenses?: Expense[];
  adjustments?: StockAdjustment[];
  adjustmentReasons?: string[];
  onOpenNewStock: () => void;
  onAdjustStock: (id: string, delta: number, reason?: string, notes?: string) => void;
  onUpdateInventoryMaterial?: (
    id: string,
    updates: { stock?: number; avgUnitCost?: number; openingStock?: number | null }
  ) => void;
  onAddAdjustment?: (payload: Omit<StockAdjustment, 'id'>) => void;
  onOpenEnquiryChecker?: () => void;
}

export default function InventoryView({
  inventory,
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
  onAdjustStock,
  onUpdateInventoryMaterial,
  onAddAdjustment,
  onOpenEnquiryChecker,
}: InventoryViewProps) {
  const [tab, setTab] = useState<'All' | 'Finished Good' | 'Raw Material' | 'Packaging'>('All');
  const [sectionView, setSectionView] = useState<'ledger' | 'adjustments'>('ledger');
  const [selectedReason, setSelectedReason] = useState<string>(
    adjustmentReasons[0] || 'Stock count correction'
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'attention' | 'missing-count' | 'incoming'>('all');

  // Custom Adjustment Log form
  const [adjMaterialId, setAdjMaterialId] = useState<string>(inventory[0]?.id || '');
  const [adjDeltaStr, setAdjDeltaStr] = useState<string>('');
  const [adjReason, setAdjReason] = useState<string>(adjustmentReasons[1] || adjustmentReasons[0] || 'Breakage / wastage');
  const [adjNotes, setAdjNotes] = useState<string>('');

  const ledgerSummary = useMemo(
    () => computeInventoryLedgerMetrics(inventory, recipes, orders, expenses, adjustments, products),
    [inventory, recipes, orders, expenses, adjustments, products]
  );

  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      if (tab !== 'All' && item.type !== tab) return false;
      const l = ledgerSummary.ledgerById[item.id];
      if (!l) return true;
      if (statusFilter === 'missing-count') return l.needsOpeningCount;
      if (statusFilter === 'incoming') return l.incomingFromPurchases > 0;
      if (statusFilter === 'attention') {
        return (
          l.ledgerStatus === 'SHORT' ||
          l.ledgerStatus === 'Short - stock arriving' ||
          l.ledgerStatus === 'LOW'
        );
      }
      return true;
    });
  }, [inventory, tab, statusFilter, ledgerSummary.ledgerById]);

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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Inventory &amp; Raw Materials Ledger
          </h2>
          <p className="text-xs text-[#7A6E6E]">
            {inventory.length} clean materials — In Hand = Opening Count + Received + Adjustments; Free = In Hand − Committed Orders
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
            statusFilter === 'all' ? 'border-[#541523]/40' : 'border-[#E8DDCF]'
          }`}
        >
          <p className="text-[11px] text-[#7A6E6E] font-medium">Materials Tracked</p>
          <p className="text-2xl font-serif font-bold text-[#2C181B] mt-1">{inventory.length}</p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">Deduplicated clean master</p>
        </button>

        <button
          onClick={() => {
            setSectionView('ledger');
            setStatusFilter('attention');
          }}
          className={`text-left bg-white border rounded-xl p-4 shadow-sm transition ${
            statusFilter === 'attention' ? 'border-rose-400' : 'border-[#E8DDCF]'
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
            statusFilter === 'missing-count' ? 'border-amber-400' : 'border-[#E8DDCF]'
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
            statusFilter === 'incoming' ? 'border-emerald-400' : 'border-[#E8DDCF]'
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
              <span>SHOPPING LIST — Materials to Buy or Below Reorder Level ({ledgerSummary.shoppingList.length})</span>
            </div>
            <span className="text-[11px] text-amber-800">
              Auto-calculated after counting committed open orders &amp; incoming shipments
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {ledgerSummary.shoppingList.slice(0, 8).map(({ item, ledger }) => (
              <div
                key={item.id}
                className="bg-white border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[#2C181B] truncate">{item.name}</div>
                  <div className="text-[10px] text-[#7A6E6E]">
                    Free: {ledger.freeAfterOrders} {item.unit}
                    {ledger.incomingFromPurchases > 0 ? ` · +${ledger.incomingFromPurchases} incoming` : ''}
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

      {/* Section View Switch + Tabs & Active Adjustment Reason Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-[#D9C9B4] bg-[#FAF5EE] p-0.5">
            <button
              onClick={() => setSectionView('ledger')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                sectionView === 'ledger' ? 'bg-[#541523] text-white' : 'text-[#635B5B]'
              }`}
            >
              Stock Ledger ({inventory.length})
            </button>
            <button
              onClick={() => setSectionView('adjustments')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md font-semibold transition ${
                sectionView === 'adjustments' ? 'bg-[#541523] text-white' : 'text-[#635B5B]'
              }`}
            >
              <History size={13} />
              <span>Adjustments ({adjustments.length})</span>
            </button>
          </div>

          {sectionView === 'ledger' && (
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              {(['All', 'Raw Material', 'Packaging', 'Finished Good'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-2.5 py-1.5 rounded-lg border font-medium transition whitespace-nowrap ${
                    tab === t
                      ? 'bg-[#541523] text-white border-[#541523]'
                      : 'bg-white text-[#635B5B] border-[#E8DDCF] hover:bg-[#FAF6F0]'
                  }`}
                >
                  {t === 'All' ? 'All Items' : t}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[#7A6E6E] font-medium whitespace-nowrap">Quick +/- reason:</span>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            aria-label="Stock adjustment reason"
            className="px-2.5 py-1.5 rounded-lg border border-[#D9C9B4] bg-white text-[#2C181B] font-medium focus:outline-none focus:ring-1 focus:ring-[#541523]"
          >
            {adjustmentReasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {sectionView === 'adjustments' ? (
        <div className="space-y-4">
          {/* Add Custom Adjustment Form */}
          <form
            onSubmit={handleCreateCustomAdjustment}
            className="bg-white border border-[#E8DDCF] rounded-2xl p-5 shadow-sm grid grid-cols-1 sm:grid-cols-5 gap-3 items-end text-xs"
          >
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#423A3A] mb-1">Material</label>
              <select
                value={adjMaterialId}
                onChange={(e) => setAdjMaterialId(e.target.value)}
                className="w-full px-2.5 py-2 border border-[#D9C9B4] rounded-lg bg-white"
              >
                {inventory.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#423A3A] mb-1">
                Qty Change (+ add / − remove)
              </label>
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
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Notes (optional)"
                value={adjNotes}
                onChange={(e) => setAdjNotes(e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-2 border border-[#D9C9B4] rounded-lg"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-[#541523] text-white font-semibold hover:bg-[#6E1C30] shrink-0"
              >
                Log
              </button>
            </div>
          </form>

          {/* Adjustments History Table */}
          <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
            {adjustments.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#7A6E6E]">
                No manual wastage, breakage, or stock count adjustments recorded yet. Use the +/- buttons or the form above whenever shelf stock changes outside Purchases &amp; Orders.
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
      ) : (
        /* Inventory Table */
        <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-[#F2EBE0]">
            {filteredItems.map((item) => {
              const ledger = ledgerSummary.ledgerById[item.id];
              const reserved = ledger?.committedToOrders ?? 0;
              const free = ledger?.freeAfterOrders ?? item.stock;
              const inHand = ledger?.physicalInHand ?? item.stock;
              const incoming = ledger?.incomingFromPurchases ?? 0;
              const ledgerStatus = ledger?.ledgerStatus ?? 'OK';
              const key = normalizeNameKey(item.name);
              void key;

              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:bg-[#FAF6F0]/60 transition"
                >
                  {/* Left: Item name and type */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#2C181B]">{item.name}</span>
                      {incoming > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                          <Truck size={11} />
                          +{incoming} {item.unit} arriving
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#7A6E6E] flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="bg-[#FAF0E6] text-[#8F243C] px-1.5 py-0.5 rounded font-medium">
                        {item.type}
                      </span>
                      {item.category && (
                        <span className="bg-[#F2EBE0] text-[#541523] px-1.5 py-0.5 rounded font-medium">
                          {item.category}
                        </span>
                      )}
                      {item.supplier && <span>Supplier: {item.supplier}</span>}
                      {item.purchaseSource && (
                        <span className="text-[#8C7D7D]">{item.purchaseSource}</span>
                      )}
                    </div>
                  </div>

                  {/* Middle & Right: Opening Count, Avg Cost, In Hand, Committed/Free, Status, Quick Adjust */}
                  <div className="flex flex-wrap items-center gap-4 justify-between xl:justify-end">
                    {/* Opening Count inline editor */}
                    <div className="text-xs flex items-center gap-1.5">
                      <span className="text-[#7A6E6E]">Opening ({item.unit}):</span>
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

                    {/* Computed Ledger Numbers */}
                    <div className="text-right min-w-[115px]">
                      <div className="text-sm font-bold text-[#2C181B]">
                        {ledger?.needsOpeningCount ? '—' : `${inHand} ${item.unit}`}
                      </div>
                      <div className="text-[10px] text-[#7A6E6E]">
                        {reserved > 0 ? `${reserved} committed · Free: ${free}` : `Reorder at ${item.reorderLevel}`}
                        {(ledger?.receivedFromPurchases || 0) > 0 && ` · +${ledger?.receivedFromPurchases} recv`}
                        {(ledger?.adjustmentsTotal || 0) !== 0 &&
                          ` · ${ledger!.adjustmentsTotal > 0 ? '+' : ''}${ledger!.adjustmentsTotal} adj`}
                      </div>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap ${
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

                    {/* Quick adjustments +/- */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onAdjustStock(item.id, -1, selectedReason)}
                        className="w-7 h-7 rounded border border-[#E8DDCF] bg-[#FAF6F0] hover:bg-[#F2EBE0] text-xs font-bold text-[#541523] flex items-center justify-center transition"
                        title={`Deduct 1 (${selectedReason})`}
                      >
                        -
                      </button>
                      <button
                        onClick={() => onAdjustStock(item.id, 1, selectedReason)}
                        className="w-7 h-7 rounded border border-[#E8DDCF] bg-[#FAF6F0] hover:bg-[#F2EBE0] text-xs font-bold text-[#541523] flex items-center justify-center transition"
                        title={`Add 1 (${selectedReason})`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
