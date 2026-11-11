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
  computeRecipeAndProductSnapshot,
  exportRecipesToCsv,
  findLinkedInventoryItem,
  normalizeNameKey,
} from '@/lib/oprFormulas';
import { formatINR, round2 } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  Layers,
  PackageCheck,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface RecipeViewProps {
  products: Product[];
  recipes: RecipeIngredient[];
  orders: Order[];
  inventory: InventoryItem[];
  expenses?: Expense[];
  adjustments?: StockAdjustment[];
  unitOptions: string[];
  selectedProductName: string | null;
  onSelectProductName: (name: string) => void;
  onAddIngredient: (payload: {
    productId: string;
    productName: string;
    materialId: string;
    materialName: string;
    qtyPerUnit: number;
    unit: string;
    createNewMaterial?: {
      name: string;
      type: 'Raw Material' | 'Packaging';
      unit: string;
      stock: number;
      avgUnitCost?: number;
    };
  }) => void;
  onUpdateIngredient: (
    ingredientId: string,
    updates: { qtyPerUnit?: number; overrideUnitCost?: number; unit?: string }
  ) => void;
  onDeleteIngredient: (ingredientId: string) => void;
  onCloneRecipe: (sourceProductName: string, targetProductId: string, targetProductName: string) => void;
  onUpdateInventoryMaterial: (
    materialId: string,
    updates: { stock?: number; avgUnitCost?: number }
  ) => void;
  onOpenEnquiryChecker?: () => void;
}

export default function RecipeView({
  products,
  recipes,
  orders,
  inventory,
  expenses = [],
  adjustments = [],
  unitOptions,
  selectedProductName,
  onSelectProductName,
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
  onCloneRecipe,
  onUpdateInventoryMaterial,
  onOpenEnquiryChecker,
}: RecipeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState<'all' | 'has-recipe' | 'needs-recipe' | 'open-demand'>('all');
  const [batchQty, setBatchQty] = useState<number>(1);
  const [cloneSource, setCloneSource] = useState<string>('');

  // Add Ingredient Form state
  const [newMatMode, setNewMatMode] = useState<'existing' | 'create'>('existing');
  const [selectedMatId, setSelectedMatId] = useState<string>('');
  const [qtyPerUnitInput, setQtyPerUnitInput] = useState<string>('1');
  const [newMatName, setNewMatName] = useState('');
  const [newMatType, setNewMatType] = useState<'Raw Material' | 'Packaging'>('Raw Material');
  const [newMatUnit, setNewMatUnit] = useState(unitOptions[0] || 'pcs');
  const [newMatStock, setNewMatStock] = useState('0');
  const [newMatCost, setNewMatCost] = useState('');

  const snapshot = useMemo(
    () => computeRecipeAndProductSnapshot(products, recipes, orders, inventory, expenses, adjustments),
    [products, recipes, orders, inventory, expenses, adjustments]
  );

  // Pick initial active product intelligently
  const activeProduct = useMemo(() => {
    if (selectedProductName) {
      const found = products.find((p) => normalizeNameKey(p.name) === normalizeNameKey(selectedProductName));
      if (found) return found;
    }
    const firstWithRecipe = products.find(
      (p) => snapshot.productEconomicsById[p.id]?.hasRecipe
    );
    return firstWithRecipe || products[0] || null;
  }, [products, selectedProductName, snapshot]);

  const rawMaterials = useMemo(
    () =>
      inventory
        .filter((i) => i.type === 'Raw Material' || i.type === 'Packaging')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [inventory]
  );

  const productsWithRecipes = useMemo(
    () => products.filter((p) => snapshot.productEconomicsById[p.id]?.hasRecipe),
    [products, snapshot]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const econ = snapshot.productEconomicsById[p.id];
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.collection || p.category || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (productFilter === 'has-recipe') return Boolean(econ?.hasRecipe);
      if (productFilter === 'needs-recipe') return !econ?.hasRecipe;
      if (productFilter === 'open-demand') return (econ?.openUnits ?? 0) > 0;
      return true;
    });
  }, [products, searchQuery, productFilter, snapshot]);

  const activeRecipes = useMemo(() => {
    if (!activeProduct) return [];
    const targetKey = normalizeNameKey(activeProduct.name);
    return recipes.filter((r) => normalizeNameKey(r.productName) === targetKey);
  }, [recipes, activeProduct]);

  const activeEcon = activeProduct ? snapshot.productEconomicsById[activeProduct.id] : undefined;

  // Global stats across recipes
  const stats = useMemo(() => {
    const totalWithRecipe = productsWithRecipes.length;
    const openWithoutRecipe = products.filter((p) => {
      const e = snapshot.productEconomicsById[p.id];
      return (e?.openUnits ?? 0) > 0 && !e?.hasRecipe;
    }).length;
    const shortCount = Object.values(snapshot.ingredientMetricsById).filter((m) => m.isShort).length;
    const uncostedCount = Object.values(snapshot.ingredientMetricsById).filter((m) => !m.isCostKnown).length;
    return { totalWithRecipe, openWithoutRecipe, shortCount, uncostedCount };
  }, [products, productsWithRecipes, snapshot]);

  const handleExportCsv = () => {
    const csv = exportRecipesToCsv(recipes, snapshot.ingredientMetricsById);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vedh_recipes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;
    const qtyVal = Number(qtyPerUnitInput);
    if (!Number.isFinite(qtyVal) || qtyVal <= 0) return;

    if (newMatMode === 'existing') {
      const mat = rawMaterials.find((m) => m.id === selectedMatId);
      if (!mat) return;
      onAddIngredient({
        productId: activeProduct.id,
        productName: activeProduct.name,
        materialId: mat.id,
        materialName: mat.name,
        qtyPerUnit: qtyVal,
        unit: mat.unit,
      });
      setSelectedMatId('');
      setQtyPerUnitInput('1');
    } else {
      const cleanName = newMatName.trim();
      if (!cleanName) return;
      const stockNum = Number(newMatStock) || 0;
      const costNum = newMatCost.trim() ? Number(newMatCost) : undefined;
      onAddIngredient({
        productId: activeProduct.id,
        productName: activeProduct.name,
        materialId: '',
        materialName: cleanName,
        qtyPerUnit: qtyVal,
        unit: newMatUnit,
        createNewMaterial: {
          name: cleanName,
          type: newMatType,
          unit: newMatUnit,
          stock: stockNum,
          avgUnitCost: costNum !== undefined && Number.isFinite(costNum) ? round2(costNum) : undefined,
        },
      });
      setNewMatName('');
      setNewMatStock('0');
      setNewMatCost('');
      setQtyPerUnitInput('1');
      setNewMatMode('existing');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Product Recipes &amp; Material Costing
          </h2>
          <p className="text-xs text-[#7A6E6E]">
            Define materials consumed per unit sold, link stock from Inventory &amp; Purchases, and calculate live product margins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenEnquiryChecker && (
            <button
              onClick={onOpenEnquiryChecker}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold transition shadow-sm"
            >
              <ClipboardCheck size={14} />
              <span>Can I Accept Order?</span>
            </button>
          )}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg border border-[#D9C9B4] bg-[#FDFBF7] hover:bg-[#F2EBE0] text-xs font-semibold text-[#541523] transition shadow-sm"
          >
            <Download size={14} />
            <span>Export Recipes CSV</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-[#7A6E6E] font-medium">Products With Recipes</p>
          <p className="text-2xl font-serif font-bold text-[#2C181B] mt-1">
            {stats.totalWithRecipe} <span className="text-sm font-normal text-[#8C7D7D]">/ {products.length}</span>
          </p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">{recipes.length} total ingredient lines</p>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-[#7A6E6E] font-medium">Open Orders Missing Recipe</p>
          <p className={`text-2xl font-serif font-bold mt-1 ${stats.openWithoutRecipe > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {stats.openWithoutRecipe}
          </p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">
            {stats.openWithoutRecipe > 0 ? 'Add recipes to enable stock deduction' : 'All open orders covered'}
          </p>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-[#7A6E6E] font-medium">Materials Short (Orders)</p>
          <p className={`text-2xl font-serif font-bold mt-1 ${stats.shortCount > 0 ? 'text-[#A02020]' : 'text-emerald-700'}`}>
            {stats.shortCount}
          </p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">
            Free stock after active deducted orders
          </p>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-[#7A6E6E] font-medium">Uncosted Material Lines</p>
          <p className={`text-2xl font-serif font-bold mt-1 ${stats.uncostedCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {stats.uncostedCount}
          </p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">Enter unit ₹ directly in table below</p>
        </div>
      </div>

      {/* Main Split Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Product Catalog Selector */}
        <div className="lg:col-span-4 bg-white border border-[#E8DDCF] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif font-bold text-[#2C181B]">Select Product</h3>
            <span className="text-[11px] text-[#8C7D7D]">{filteredProducts.length} shown</span>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[#8C7D7D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or collection..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#D9C9B4] bg-[#FDFBF7] text-xs focus:outline-none focus:ring-1 focus:ring-[#541523]"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {[
              { id: 'all', label: 'All' },
              { id: 'has-recipe', label: 'Has Recipe' },
              { id: 'open-demand', label: 'Open Demand' },
              { id: 'needs-recipe', label: 'No Recipe' },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setProductFilter(pill.id as typeof productFilter)}
                className={`px-2.5 py-1 rounded-full font-medium transition ${
                  productFilter === pill.id
                    ? 'bg-[#541523] text-white'
                    : 'bg-[#FAF5EE] text-[#635B5B] hover:bg-[#F2EBE0]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="max-h-[540px] overflow-y-auto divide-y divide-[#F2EBE0] border border-[#E8DDCF] rounded-xl">
            {filteredProducts.map((p) => {
              const econ = snapshot.productEconomicsById[p.id];
              const isSelected = activeProduct?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProductName(p.name)}
                  className={`w-full text-left p-3 transition flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-[#541523]/10 border-l-4 border-l-[#541523]'
                      : 'hover:bg-[#FAF5EE]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[#2C181B] leading-snug">
                      {p.name}
                    </span>
                    <span className="text-xs font-bold text-[#541523] shrink-0">
                      {formatINR(p.price)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[10px]">
                    <span className="text-[#8C7D7D]">{econ?.collection || p.collection || p.category}</span>
                    <div className="flex items-center gap-1">
                      {(econ?.openUnits ?? 0) > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                          {econ?.openUnits} open
                        </span>
                      )}
                      {econ?.hasRecipe ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                          {econ.ingredientCount} items
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
                          NO RECIPE
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Product Recipe Workbench */}
        <div className="lg:col-span-8 space-y-5">
          {activeProduct && activeEcon ? (
            <>
              {/* Product Summary Header Card */}
              <div className="bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FAF5EE] border border-[#E8DDCF] text-[#541523]">
                        {activeEcon.collection}
                      </span>
                      {activeEcon.openUnits > 0 && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          {activeEcon.openUnits} units open in Orders
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-serif font-bold text-[#2C181B] mt-2">
                      {activeProduct.name}
                    </h3>
                  </div>

                  {/* Clone Recipe Tool */}
                  <div className="flex items-center gap-2 bg-[#FAF5EE] border border-[#E8DDCF] p-2 rounded-xl">
                    <select
                      value={cloneSource}
                      onChange={(e) => setCloneSource(e.target.value)}
                      className="text-xs border border-[#D9C9B4] rounded-md px-2 py-1.5 bg-white max-w-[200px]"
                    >
                      <option value="">Clone recipe from...</option>
                      {productsWithRecipes
                        .filter((p) => p.id !== activeProduct.id)
                        .map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      disabled={!cloneSource}
                      onClick={() => {
                        if (!cloneSource) return;
                        onCloneRecipe(cloneSource, activeProduct.id, activeProduct.name);
                        setCloneSource('');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#541523] disabled:opacity-40 text-white text-xs font-semibold hover:bg-[#6D1D30] transition"
                    >
                      <Copy size={12} />
                      <span>Clone</span>
                    </button>
                  </div>
                </div>

                {/* Economics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#F2EBE0]">
                  <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#E8DDCF]">
                    <p className="text-[11px] text-[#7A6E6E]">Selling Price</p>
                    <p className="text-lg font-bold text-[#2C181B]">{formatINR(activeProduct.price)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#E8DDCF]">
                    <p className="text-[11px] text-[#7A6E6E]">Material Cost / Unit</p>
                    <p className="text-lg font-bold text-[#541523]">
                      {activeEcon.hasRecipe ? formatINR(activeEcon.materialCostPerUnit, 2) : '—'}
                    </p>
                    <p className="text-[10px] text-[#8C7D7D]">
                      {activeEcon.hasRecipe
                        ? `${activeEcon.costedIngredientCount} of ${activeEcon.ingredientCount} costed`
                        : 'No ingredients yet'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#E8DDCF]">
                    <p className="text-[11px] text-[#7A6E6E]">Margin / Unit</p>
                    <p className="text-lg font-bold text-emerald-700">
                      {activeEcon.marginPerUnit !== null ? formatINR(activeEcon.marginPerUnit, 2) : '—'}
                    </p>
                    <p className="text-[10px] text-[#8C7D7D]">
                      {activeEcon.costComplete
                        ? `${activeEcon.marginPct ?? 0}% gross margin`
                        : activeEcon.hasRecipe
                        ? 'Partial (complete all costs)'
                        : 'Add recipe to compute'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#E8DDCF]">
                    <label className="text-[11px] text-[#7A6E6E] block mb-1">
                      Batch Simulator (Qty)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={batchQty}
                        onChange={(e) => setBatchQty(Math.max(1, Number(e.target.value) || 1))}
                        className="w-20 px-2 py-1 rounded border border-[#D9C9B4] bg-white text-sm font-bold text-[#2C181B]"
                      />
                      <span className="text-[11px] text-[#8C7D7D]">
                        {batchQty > 1 && activeEcon.hasRecipe
                          ? `Est ${formatINR(round2(activeEcon.materialCostPerUnit * batchQty))}`
                          : 'units'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipe Ingredients Table */}
              <div className="bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={18} className="text-[#8F243C]" />
                    <h4 className="text-base font-serif font-bold text-[#2C181B]">
                      Bill of Materials ({activeRecipes.length} ingredients)
                    </h4>
                  </div>
                  {activeEcon.hasShortage && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                      <AlertTriangle size={13} />
                      Stock shortage detected
                    </span>
                  )}
                </div>

                {activeRecipes.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-[#D9C9B4] rounded-xl bg-[#FDFBF7] space-y-2">
                    <Sparkles size={24} className="mx-auto text-[#C69C31]" />
                    <p className="text-sm font-semibold text-[#2C181B]">
                      No recipe defined yet for {activeProduct.name}
                    </p>
                    <p className="text-xs text-[#7A6E6E] max-w-md mx-auto">
                      Add raw materials below or clone from an existing recipe above to unlock automatic material costing and order stock checks.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E8DDCF] text-[#7A6E6E] font-medium">
                          <th className="py-2.5 pr-3">Material Used</th>
                          <th className="py-2.5 px-2">Qty / Unit</th>
                          <th className="py-2.5 px-2">Unit</th>
                          <th className="py-2.5 px-2 text-right">Stock Avail</th>
                          <th className="py-2.5 px-2 text-right">
                            {batchQty > 1 ? `Batch ×${batchQty}` : 'Order Need'}
                          </th>
                          <th className="py-2.5 px-2 text-right">Free / Status</th>
                          <th className="py-2.5 px-2 text-right">Unit Cost (₹)</th>
                          <th className="py-2.5 px-2 text-right">Line Cost (₹)</th>
                          <th className="py-2.5 pl-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F2EBE0]">
                        {activeRecipes.map((ing) => {
                          const m = snapshot.ingredientMetricsById[ing.id];
                          const inv = findLinkedInventoryItem(ing, inventory);
                          const batchNeed = round2(ing.qtyPerUnit * batchQty);
                          const batchShort = inv ? batchNeed > inv.stock : batchNeed > 0;
                          return (
                            <tr key={ing.id} className="hover:bg-[#FDFBF7]">
                              <td className="py-2.5 pr-3">
                                <div className="font-semibold text-[#2C181B]">{ing.materialName}</div>
                                {inv?.purchaseSource && (
                                  <div className="text-[10px] text-[#8C7D7D] line-clamp-1 max-w-[230px]" title={inv.purchaseSource}>
                                    {inv.purchaseSource}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={ing.qtyPerUnit}
                                  onChange={(e) => {
                                    const v = Number(e.target.value);
                                    if (Number.isFinite(v) && v >= 0) {
                                      onUpdateIngredient(ing.id, { qtyPerUnit: v });
                                    }
                                  }}
                                  className="w-16 px-2 py-1 rounded border border-[#D9C9B4] bg-white text-right font-semibold"
                                />
                              </td>
                              <td className="py-2.5 px-2 text-[#635B5B]">{inv?.unit || ing.unit}</td>
                              <td className="py-2.5 px-2 text-right">
                                {inv ? (
                                  <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={inv.stock}
                                    title="Edit live Inventory stock"
                                    onChange={(e) => {
                                      const v = Number(e.target.value);
                                      if (Number.isFinite(v) && v >= 0) {
                                        onUpdateInventoryMaterial(inv.id, { stock: v });
                                      }
                                    }}
                                    className="w-16 px-1.5 py-1 rounded border border-[#E8DDCF] bg-[#FDFBF7] text-right font-mono"
                                  />
                                ) : (
                                  <span className="text-red-600">Unlinked</span>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono">
                                {batchQty > 1 ? batchNeed : m?.neededForOrders ?? 0}
                              </td>
                              <td className="py-2.5 px-2 text-right">
                                {batchQty > 1 ? (
                                  batchShort ? (
                                    <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
                                      Short {round2(batchNeed - (inv?.stock ?? 0))}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold">
                                      <CheckCircle2 size={12} /> OK
                                    </span>
                                  )
                                ) : m?.isShort ? (
                                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
                                    {m.freeAfterOrders} SHORT
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                    <PackageCheck size={12} />
                                    {m?.freeAfterOrders ?? 0}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Enter ₹"
                                  value={m?.avgUnitCost ?? ''}
                                  title={inv ? 'Updates landed Avg Unit Cost in Inventory' : 'Set cost override'}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    const v = raw === '' ? undefined : Number(raw);
                                    if (v === undefined || (Number.isFinite(v) && v >= 0)) {
                                      if (inv) {
                                        onUpdateInventoryMaterial(inv.id, { avgUnitCost: v });
                                      } else {
                                        onUpdateIngredient(ing.id, { overrideUnitCost: v });
                                      }
                                    }
                                  }}
                                  className={`w-20 px-2 py-1 rounded border text-right font-mono ${
                                    m?.isCostKnown
                                      ? 'border-[#D9C9B4] bg-white'
                                      : 'border-amber-300 bg-amber-50/70 placeholder:text-amber-700'
                                  }`}
                                />
                              </td>
                              <td className="py-2.5 px-2 text-right font-semibold text-[#2C181B]">
                                {m?.lineCost !== null ? formatINR(m.lineCost, 2) : (
                                  <span className="text-[10px] text-amber-700">Need cost</span>
                                )}
                              </td>
                              <td className="py-2.5 pl-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => onDeleteIngredient(ing.id)}
                                  className="p-1.5 rounded text-[#8C7D7D] hover:text-red-700 hover:bg-red-50 transition"
                                  title="Remove ingredient"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add Ingredient Form */}
                <form
                  onSubmit={handleAddSubmit}
                  className="pt-4 mt-4 border-t border-[#E8DDCF] bg-[#FAF5EE]/60 rounded-xl p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#541523]">
                      + Add Ingredient to {activeProduct.name}
                    </span>
                    <div className="inline-flex rounded-md border border-[#D9C9B4] bg-white p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setNewMatMode('existing')}
                        className={`px-2.5 py-1 rounded font-medium ${
                          newMatMode === 'existing' ? 'bg-[#541523] text-white' : 'text-[#635B5B]'
                        }`}
                      >
                        From Inventory
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewMatMode('create')}
                        className={`px-2.5 py-1 rounded font-medium ${
                          newMatMode === 'create' ? 'bg-[#541523] text-white' : 'text-[#635B5B]'
                        }`}
                      >
                        + New Material
                      </button>
                    </div>
                  </div>

                  {newMatMode === 'existing' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-7">
                        <label className="text-[11px] font-medium text-[#635B5B] block mb-1">
                          Select Inventory Material
                        </label>
                        <select
                          value={selectedMatId}
                          onChange={(e) => setSelectedMatId(e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-lg border border-[#D9C9B4] bg-white text-xs"
                        >
                          <option value="">Choose raw material / packaging...</option>
                          {rawMaterials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.stock} {m.unit}{m.avgUnitCost !== undefined ? ` · ₹${m.avgUnitCost}/${m.unit}` : ''})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-medium text-[#635B5B] block mb-1">
                          Qty per Unit Sold
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={qtyPerUnitInput}
                          onChange={(e) => setQtyPerUnitInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#D9C9B4] bg-white text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="submit"
                          className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[#541523] hover:bg-[#6D1D30] text-white text-xs font-semibold transition"
                        >
                          <Plus size={14} />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-4">
                        <label className="text-[11px] font-medium text-[#635B5B] block mb-1">
                          New Material Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Velvet Box Ribbon"
                          value={newMatName}
                          onChange={(e) => setNewMatName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#D9C9B4] bg-white text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-medium text-[#635B5B] block mb-1">
                          Type
                        </label>
                        <select
                          value={newMatType}
                          onChange={(e) => setNewMatType(e.target.value as 'Raw Material' | 'Packaging')}
                          className="w-full px-2 py-2 rounded-lg border border-[#D9C9B4] bg-white text-xs"
                        >
                          <option value="Raw Material">Raw Material</option>
                          <option value="Packaging">Packaging</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-medium text-[#635B5B] block mb-1">
                          Qty / Unit
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={qtyPerUnitInput}
                          onChange={(e) => setQtyPerUnitInput(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg border border-[#D9C9B4] bg-white text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-medium text-[#635B5B] block mb-1">
                          Unit &amp; Cost (₹)
                        </label>
                        <div className="flex gap-1">
                          <select
                            value={newMatUnit}
                            onChange={(e) => setNewMatUnit(e.target.value)}
                            className="w-16 px-1.5 py-2 rounded-lg border border-[#D9C9B4] bg-white text-xs"
                          >
                            {unitOptions.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="₹/u"
                            value={newMatCost}
                            onChange={(e) => setNewMatCost(e.target.value)}
                            className="w-full px-2 py-2 rounded-lg border border-[#D9C9B4] bg-white text-xs"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-medium text-[#635B5B] block mb-1">
                          Stock: {newMatStock}
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            min="0"
                            placeholder="Stock"
                            value={newMatStock}
                            onChange={(e) => setNewMatStock(e.target.value)}
                            className="w-14 px-2 py-2 rounded-lg border border-[#D9C9B4] bg-white text-xs"
                          />
                          <button
                            type="submit"
                            className="flex-1 inline-flex items-center justify-center px-2.5 py-2 rounded-lg bg-[#541523] hover:bg-[#6D1D30] text-white text-xs font-semibold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
