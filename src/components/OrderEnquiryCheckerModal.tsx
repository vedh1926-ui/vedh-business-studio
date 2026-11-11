'use client';

import React, { useMemo, useState } from 'react';
import {
  EnquiryItem,
  InventoryItem,
  InventoryLedgerMetrics,
  Product,
  RecipeIngredient,
} from '@/lib/types';
import { evaluateOrderEnquiry, normalizeNameKey } from '@/lib/oprFormulas';
import { formatINR } from '@/lib/utils';
import {
  CheckCircle2,
  ClipboardCheck,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  AlertTriangle,
  X,
} from 'lucide-react';

interface OrderEnquiryCheckerModalProps {
  products: Product[];
  recipes: RecipeIngredient[];
  inventory: InventoryItem[];
  ledgerByMaterialKey: Record<string, InventoryLedgerMetrics>;
  onClose: () => void;
  onCreateOrderFromEnquiry?: (items: EnquiryItem[], customerLabel: string) => void;
}

export default function OrderEnquiryCheckerModal({
  products,
  recipes,
  inventory,
  ledgerByMaterialKey,
  onClose,
}: OrderEnquiryCheckerModalProps) {
  const recipeProdKeys = useMemo(
    () => new Set(recipes.map((r) => normalizeNameKey(r.productName))),
    [recipes]
  );

  const sortedProducts = useMemo(
    () =>
      [...products].sort((a, b) => {
        const aHas = recipeProdKeys.has(normalizeNameKey(a.name)) ? 0 : 1;
        const bHas = recipeProdKeys.has(normalizeNameKey(b.name)) ? 0 : 1;
        if (aHas !== bHas) return aHas - bHas;
        return a.name.localeCompare(b.name);
      }),
    [products, recipeProdKeys]
  );

  const [customerLabel, setCustomerLabel] = useState('Prospective Customer Enquiry');
  const [enquiryLines, setEnquiryLines] = useState<Array<{ key: string; productId: string; productName: string; quantity: number }>>(() => {
    const gold = products.find((p) => p.name.includes('Lotus Petals Diya (Set of 2) GOLD'));
    const pink = products.find((p) => p.name.includes('Lotus Petals Diya (Set of 2) PINK'));
    const seeds: Array<{ key: string; productId: string; productName: string; quantity: number }> = [];
    if (gold) seeds.push({ key: 'enq-1', productId: gold.id, productName: gold.name, quantity: 2 });
    if (pink) seeds.push({ key: 'enq-2', productId: pink.id, productName: pink.name, quantity: 1 });
    if (seeds.length === 0 && products[0]) {
      seeds.push({ key: 'enq-1', productId: products[0].id, productName: products[0].name, quantity: 1 });
    }
    return seeds;
  });

  const enquiryResult = useMemo(
    () =>
      evaluateOrderEnquiry(
        enquiryLines.map((l) => ({
          productId: l.productId,
          productName: l.productName,
          quantity: l.quantity,
        })),
        products,
        recipes,
        ledgerByMaterialKey,
        inventory
      ),
    [enquiryLines, products, recipes, ledgerByMaterialKey, inventory]
  );

  const estOrderValue = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return enquiryLines.reduce((sum, l) => {
      const p = byId.get(l.productId);
      return sum + (p?.price || 0) * Math.max(0, Number(l.quantity) || 0);
    }, 0);
  }, [enquiryLines, products]);

  const handleAddLine = () => {
    const fallback = sortedProducts[0];
    if (!fallback) return;
    setEnquiryLines((prev) => [
      ...prev,
      {
        key: `enq-${Date.now()}-${prev.length + 1}`,
        productId: fallback.id,
        productName: fallback.name,
        quantity: 1,
      },
    ]);
  };

  const handleUpdateLineProduct = (key: string, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    setEnquiryLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, productId: prod.id, productName: prod.name } : l))
    );
  };

  const handleUpdateLineQty = (key: string, qty: number) => {
    setEnquiryLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, quantity: Math.max(0, qty) } : l))
    );
  };

  const handleRemoveLine = (key: string) => {
    setEnquiryLines((prev) => prev.filter((l) => l.key !== key));
  };

  const verdictBanner = (() => {
    switch (enquiryResult.verdict) {
      case 'YES':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          badge: 'bg-emerald-600 text-white',
          icon: CheckCircle2,
          title: 'YES — Ready to Accept & Produce Now',
          subtitle: 'All recipe materials have enough free stock after accounting for active orders.',
        };
      case 'OK_WITH_INCOMING':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          badge: 'bg-amber-600 text-white',
          icon: Truck,
          title: 'OK ONCE INCOMING ARRIVES',
          subtitle: 'Short on shelf today, but Ordered/Shipped incoming purchases cover 100% of this enquiry.',
        };
      case 'BUY_FIRST':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900',
          badge: 'bg-rose-600 text-white',
          icon: ShoppingBag,
          title: 'BUY FIRST — Materials Short Even After Incoming',
          subtitle:
            enquiryResult.totalEstBuyCost > 0
              ? `Need to purchase short materials first (estimated restock cost: ${formatINR(enquiryResult.totalEstBuyCost)} for costed items).`
              : 'One or more materials are short even after counting incoming deliveries.',
        };
      case 'MISSING_RECIPE':
        return {
          bg: 'bg-violet-50 border-violet-200 text-violet-900',
          badge: 'bg-violet-600 text-white',
          icon: AlertTriangle,
          title: 'MISSING RECIPE — Cannot Fully Verify',
          subtitle: `Define recipes in Recipe Studio for: ${enquiryResult.missingRecipeProducts.join(', ')}.`,
        };
      default:
        return {
          bg: 'bg-stone-50 border-stone-200 text-stone-700',
          badge: 'bg-stone-500 text-white',
          icon: ClipboardCheck,
          title: 'Add Products Below to Check Feasibility',
          subtitle: 'Does not save orders or alter real stock — pure feasibility test.',
        };
    }
  })();

  const VerdictIcon = verdictBanner.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-[#E8DDCF] shadow-2xl overflow-hidden my-6">
        <div className="bg-[#FAF5EE] border-b border-[#E8DDCF] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#541523] text-amber-200 flex items-center justify-center">
              <ClipboardCheck size={18} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2C181B]">
                Can I Accept This Order? — Stock Feasibility Simulator
              </h3>
              <p className="text-[11px] text-[#7A6E6E]">
                Multi-product material aggregator (deduplicated) · Checks Free After Orders + In-Transit Purchases
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md"
            aria-label="Close feasibility checker"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs max-h-[82vh] overflow-y-auto">
          {/* Customer Label + Est Order Total */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#423A3A] mb-1">
                Enquiry Label / Customer Name (Test Only — Not Saved)
              </label>
              <input
                type="text"
                value={customerLabel}
                onChange={(e) => setCustomerLabel(e.target.value)}
                placeholder="e.g. Diwali Bulk Enquiry — Tech Corp"
                className="w-full px-3 py-2 border border-[#D9C9B4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#541523]"
              />
            </div>
            <div className="bg-[#FAF5EE] border border-[#E8DDCF] rounded-lg px-3.5 py-2 flex items-center justify-between">
              <span className="text-[#7A6E6E] font-medium">Est. Order Value</span>
              <span className="font-bold text-sm text-[#2C181B]">{formatINR(estOrderValue)}</span>
            </div>
          </div>

          {/* Enquiry Lines Builder */}
          <div className="border border-[#E8DDCF] rounded-xl overflow-hidden">
            <div className="bg-[#FAF5EE] px-4 py-2.5 border-b border-[#E8DDCF] flex items-center justify-between">
              <span className="font-bold text-[#2C181B]">Requested Products ({enquiryLines.length})</span>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#541523] text-white font-semibold hover:bg-[#3e0f1a]"
              >
                <Plus size={13} /> Add Product
              </button>
            </div>
            <div className="divide-y divide-[#F0E6D8]">
              {enquiryLines.length === 0 ? (
                <div className="p-4 text-center text-[#7A6E6E]">No products added yet. Click &ldquo;Add Product&rdquo;.</div>
              ) : (
                enquiryLines.map((line, idx) => {
                  const hasRec = recipeProdKeys.has(normalizeNameKey(line.productName));
                  return (
                    <div key={line.key} className="p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <span className="text-[#7A6E6E] font-mono w-6 text-center">{idx + 1}.</span>
                      <select
                        value={line.productId}
                        onChange={(e) => handleUpdateLineProduct(line.key, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-[#D9C9B4] rounded-lg bg-white text-[#2C181B] font-medium"
                      >
                        {sortedProducts.map((p) => {
                          const okRec = recipeProdKeys.has(normalizeNameKey(p.name));
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatINR(p.price)}){okRec ? '' : ' — [No recipe]'}
                            </option>
                          );
                        })}
                      </select>
                      <div className="flex items-center gap-2">
                        {!hasRec && (
                          <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[10px] font-semibold whitespace-nowrap">
                            No Recipe
                          </span>
                        )}
                        <label className="text-[#7A6E6E] font-medium">Qty:</label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={line.quantity}
                          onChange={(e) => handleUpdateLineQty(line.key, parseInt(e.target.value || '0', 10))}
                          className="w-20 px-2 py-1.5 border border-[#D9C9B4] rounded-lg text-center font-bold text-[#2C181B]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(line.key)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md"
                          aria-label="Remove product row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Verdict Callout */}
          <div className={`border rounded-xl p-4 flex items-start gap-3 ${verdictBanner.bg}`}>
            <VerdictIcon size={20} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${verdictBanner.badge}`}>
                  VERDICT
                </span>
                <span className="font-bold text-sm">{verdictBanner.title}</span>
              </div>
              <p className="mt-1 opacity-90">{verdictBanner.subtitle}</p>
              {enquiryResult.missingRecipeProducts.length > 0 && enquiryResult.verdict !== 'MISSING_RECIPE' && (
                <p className="mt-1.5 text-[11px] font-semibold text-violet-900">
                  ⚠ Note: Also missing recipes for: {enquiryResult.missingRecipeProducts.join(', ')} (excluded from table).
                </p>
              )}
            </div>
          </div>

          {/* Deduplicated Materials Table */}
          {enquiryResult.rows.length > 0 && (
            <div className="border border-[#E8DDCF] rounded-xl overflow-hidden">
              <div className="bg-[#FAF5EE] px-4 py-2.5 border-b border-[#E8DDCF] flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#2C181B]">
                  Deduplicated Materials Breakdown ({enquiryResult.rows.length} unique materials)
                </span>
                <span className="text-[11px] text-[#7A6E6E]">
                  Shared materials across multiple products are automatically combined into 1 row
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#FBF8F3] border-b border-[#E8DDCF] text-[10px] uppercase tracking-wider text-[#7A6E6E]">
                    <tr>
                      <th className="py-2 px-3">Material</th>
                      <th className="py-2 px-2 text-right">Needed</th>
                      <th className="py-2 px-2 text-right">Free Now</th>
                      <th className="py-2 px-2 text-right">Left After</th>
                      <th className="py-2 px-2 text-right">Incoming</th>
                      <th className="py-2 px-2 text-right">To Buy</th>
                      <th className="py-2 px-2 text-right">Est. Cost</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E6D8]">
                    {enquiryResult.rows.map((row) => (
                      <tr key={row.materialName} className="hover:bg-[#FAF5EE]/60">
                        <td className="py-2 px-3 font-medium text-[#2C181B]">
                          {row.materialName}{' '}
                          <span className="text-[10px] text-[#7A6E6E]">({row.unit})</span>
                        </td>
                        <td className="py-2 px-2 text-right font-semibold">{row.neededForEnquiry}</td>
                        <td className="py-2 px-2 text-right">{row.freeNow}</td>
                        <td
                          className={`py-2 px-2 text-right font-bold ${
                            row.leftAfterEnquiry < 0 ? 'text-rose-700' : 'text-emerald-700'
                          }`}
                        >
                          {row.leftAfterEnquiry}
                        </td>
                        <td className="py-2 px-2 text-right text-amber-700 font-medium">
                          {row.incoming > 0 ? `+${row.incoming}` : '0'}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-[#2C181B]">
                          {row.toBuy > 0 ? row.toBuy : '—'}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {row.estCost !== null ? formatINR(row.estCost) : row.toBuy > 0 ? '—' : '₹0'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.status === 'BUY' ? (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                              BUY
                            </span>
                          ) : row.status === 'ARRIVING' ? (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                              ARRIVING
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
