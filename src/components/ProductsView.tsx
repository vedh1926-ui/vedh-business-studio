'use client';

import React, { useMemo, useState } from 'react';
import {
  InventoryItem,
  Order,
  Product,
  RecipeIngredient,
} from '@/lib/types';
import { computeRecipeAndProductSnapshot } from '@/lib/oprFormulas';
import { formatINR } from '@/lib/utils';
import {
  Edit3,
  Layers,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  recipes: RecipeIngredient[];
  orders: Order[];
  inventory: InventoryItem[];
  onOpenNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onOpenRecipeForProduct: (productName: string) => void;
}

export default function ProductsView({
  products,
  recipes,
  orders,
  inventory,
  onOpenNewProduct,
  onEditProduct,
  onDeleteProduct,
  onOpenRecipeForProduct,
}: ProductsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionFilter, setCollectionFilter] = useState<string>('All');
  const [recipeFilter, setRecipeFilter] = useState<'all' | 'has-recipe' | 'no-recipe' | 'open-demand'>('all');

  const snapshot = useMemo(
    () => computeRecipeAndProductSnapshot(products, recipes, orders, inventory),
    [products, recipes, orders, inventory]
  );

  const collections = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      set.add(p.collection || p.category || 'General');
    }
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const econ = snapshot.productEconomicsById[p.id];
      const coll = p.collection || p.category || 'General';
      if (collectionFilter !== 'All' && coll !== collectionFilter) return false;
      if (recipeFilter === 'has-recipe' && !econ?.hasRecipe) return false;
      if (recipeFilter === 'no-recipe' && econ?.hasRecipe) return false;
      if (recipeFilter === 'open-demand' && (econ?.openUnits ?? 0) === 0) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        coll.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, collectionFilter, recipeFilter, snapshot]);

  const kpis = useMemo(() => {
    const econs = Object.values(snapshot.productEconomicsById);
    const withRecipe = econs.filter((e) => e.hasRecipe).length;
    const totalOpenUnits = econs.reduce((s, e) => s + e.openUnits, 0);
    const avgPrice =
      products.length > 0
        ? Math.round(products.reduce((s, p) => s + p.price, 0) / products.length)
        : 0;
    return {
      withRecipe,
      totalOpenUnits,
      avgPrice,
      collectionsCount: Math.max(0, collections.length - 1),
    };
  }, [snapshot, products, collections]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Products Catalog &amp; Margins
          </h2>
          <p className="text-xs text-[#7A6E6E]">
            {products.length} catalog models across {kpis.collectionsCount} collections — live recipe coverage, open units &amp; gross margins
          </p>
        </div>

        <button
          onClick={onOpenNewProduct}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide transition shadow-sm"
        >
          <Plus size={16} />
          <span>+ Add product</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-[#7A6E6E] font-medium">Catalog Products</p>
          <p className="text-2xl font-serif font-bold text-[#2C181B] mt-1">{products.length}</p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">{kpis.collectionsCount} collections</p>
        </div>
        <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-[#7A6E6E] font-medium">Average Selling Price</p>
          <p className="text-2xl font-serif font-bold text-[#541523] mt-1">{formatINR(kpis.avgPrice)}</p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">Across catalog models</p>
        </div>
        <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-[#7A6E6E] font-medium">Recipes Defined</p>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">
            {kpis.withRecipe} <span className="text-sm font-normal text-[#8C7D7D]">/ {products.length}</span>
          </p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">Linked to Inventory costs</p>
        </div>
        <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-[#7A6E6E] font-medium">Open Order Units</p>
          <p className="text-2xl font-serif font-bold text-[#A67E1F] mt-1">{kpis.totalOpenUnits}</p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">New + In Production + Ready</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-2.5 text-[#8C7D7D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or collection..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#D9C9B4] bg-[#FDFBF7] text-xs focus:outline-none focus:ring-1 focus:ring-[#541523]"
            />
          </div>

          <select
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
            aria-label="Filter by collection"
            className="px-3 py-1.5 rounded-lg border border-[#D9C9B4] bg-white text-xs text-[#2C181B]"
          >
            {collections.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Collections' : c}
              </option>
            ))}
          </select>
        </div>

        <div className="inline-flex rounded-lg border border-[#E8DDCF] bg-[#FAF5EE] p-0.5 text-[11px]">
          {[
            { id: 'all', label: `All (${products.length})` },
            { id: 'has-recipe', label: 'Has Recipe' },
            { id: 'no-recipe', label: 'No Recipe' },
            { id: 'open-demand', label: 'Open Demand' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setRecipeFilter(pill.id as typeof recipeFilter)}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                recipeFilter === pill.id
                  ? 'bg-white text-[#541523] shadow-sm font-semibold'
                  : 'text-[#635B5B] hover:text-[#2C181B]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF5EE] border-b border-[#E8DDCF] text-[#635B5B] font-semibold">
                <th className="py-3 px-4">Product / Model</th>
                <th className="py-3 px-3">Collection</th>
                <th className="py-3 px-3 text-right">Price (₹)</th>
                <th className="py-3 px-3 text-center">Recipe?</th>
                <th className="py-3 px-3 text-right">Open Units</th>
                <th className="py-3 px-3 text-right">Mat. Cost / Unit</th>
                <th className="py-3 px-3 text-center">Costed Materials</th>
                <th className="py-3 px-3 text-right">Margin / Unit</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EBE0]">
              {filteredProducts.map((product) => {
                const econ = snapshot.productEconomicsById[product.id];
                const coll = econ?.collection || product.collection || product.category;
                return (
                  <tr key={product.id} className="hover:bg-[#FAF6F0]/60 transition">
                    <td className="py-3 px-4 font-semibold text-[#2C181B]">
                      {product.name}
                      {econ && econ.totalUnitsOrdered > 0 && (
                        <div className="text-[10px] font-normal text-[#8C7D7D]">
                          {econ.totalUnitsOrdered} ordered · {formatINR(econ.totalRevenue)} rev
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#635B5B]">
                      <span className="px-2 py-0.5 rounded bg-[#FAF5EE] border border-[#E8DDCF] text-[10px] font-medium text-[#541523]">
                        {coll}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-serif font-bold text-[#2C181B]">
                      {formatINR(product.price)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {econ?.hasRecipe ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[10px] font-semibold">
                          NO RECIPE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold">
                      {(econ?.openUnits ?? 0) > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          {econ?.openUnits}
                        </span>
                      ) : (
                        <span className="text-[#8C7D7D]">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#541523]">
                      {econ?.hasRecipe ? formatINR(econ.materialCostPerUnit, 2) : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {econ?.hasRecipe ? (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            econ.costComplete
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {econ.costedIngredientCount} of {econ.ingredientCount}
                        </span>
                      ) : (
                        <span className="text-[#8C7D7D]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {econ?.marginPerUnit !== null && econ ? (
                        <div>
                          <span className="font-bold text-emerald-700">
                            {formatINR(econ.marginPerUnit, 2)}
                          </span>
                          <span className="text-[10px] text-[#7A6E6E] ml-1">
                            ({econ.marginPct}%)
                          </span>
                          {!econ.costComplete && (
                            <div className="text-[9px] text-amber-700">partial</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#8C7D7D]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenRecipeForProduct(product.name)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                            econ?.hasRecipe
                              ? 'border border-[#D9C9B4] bg-white text-[#541523] hover:bg-[#F2EBE0]'
                              : 'bg-[#541523]/10 text-[#541523] hover:bg-[#541523] hover:text-white'
                          }`}
                        >
                          {econ?.hasRecipe ? <Layers size={12} /> : <Sparkles size={12} />}
                          <span>{econ?.hasRecipe ? 'Recipe' : '+ Recipe'}</span>
                        </button>
                        <button
                          onClick={() => onEditProduct(product)}
                          className="p-1.5 rounded border border-[#D9C9B4] bg-white text-[#541523] hover:bg-[#F2EBE0]"
                          title="Edit product"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-1.5 rounded text-stone-400 hover:text-rose-700 hover:bg-rose-50"
                          title="Delete product"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
