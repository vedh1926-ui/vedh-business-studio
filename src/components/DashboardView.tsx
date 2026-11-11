'use client';

import React from 'react';
import {
  ActiveTab,
  Expense,
  InventoryItem,
  Order,
  Product,
  RecipeIngredient,
  StockAdjustment,
} from '@/lib/types';
import { formatINR } from '@/lib/utils';
import {
  computePurchaseOverview,
  computePlatformStats,
  computeCategorySpend,
} from '@/lib/purchaseFormulas';
import {
  buildCombinedInvoiceOrder,
  computeInventoryLedgerMetrics,
  computeOrderMetrics,
  computeOrderOverview,
  computeRecipeAndProductSnapshot,
} from '@/lib/oprFormulas';
import {
  ArrowUpRight,
  AlertTriangle,
  ClipboardCheck,
  Layers,
  Clock,
  ShoppingBag,
  Sparkles,
  Truck,
  Store,
  RotateCcw,
} from 'lucide-react';

interface DashboardViewProps {
  orders: Order[];
  products: Product[];
  inventory: InventoryItem[];
  expenses: Expense[];
  adjustments?: StockAdjustment[];
  recipes?: RecipeIngredient[];
  platforms?: string[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewOrder: () => void;
  onOpenNewStock: () => void;
  onOpenNewExpense?: () => void;
  onSelectOrderForInvoice: (order: Order) => void;
  onOpenRecipeForProduct?: (productName: string) => void;
  onOpenEnquiryChecker?: () => void;
}

export default function DashboardView({
  orders,
  products,
  inventory,
  expenses,
  adjustments = [],
  recipes = [],
  platforms = [],
  setActiveTab,
  onOpenNewOrder,
  onOpenNewStock,
  onOpenNewExpense,
  onSelectOrderForInvoice,
  onOpenRecipeForProduct,
  onOpenEnquiryChecker,
}: DashboardViewProps) {
  // Calculate live metrics across Orders, Products, Recipes, Inventory & Purchases
  const purchaseOverview = computePurchaseOverview(expenses);
  const platformStats = computePlatformStats(expenses, platforms);
  const categorySpend = computeCategorySpend(expenses);
  const recipeSnapshot = computeRecipeAndProductSnapshot(products, recipes, orders, inventory, expenses, adjustments);
  const ledgerSummary = computeInventoryLedgerMetrics(inventory, recipes, orders, expenses, adjustments, products);
  const orderOverview = computeOrderOverview(orders, recipeSnapshot.productEconomicsByName);

  const totalOrderValue = orderOverview.totalOrderValue;
  const totalReceived = orderOverview.totalReceived;
  const totalExpenses = purchaseOverview.totalSpend;
  const grossPosition = totalReceived - totalExpenses;

  // Active orders in motion
  const ordersInMotion = orders.filter(
    (o) => o.status !== 'Delivered' && o.status !== 'Cancelled'
  );

  // Recipe readiness stats
  const productEcons = Object.values(recipeSnapshot.productEconomicsById);
  const productsWithRecipeCount = productEcons.filter((e) => e.hasRecipe).length;
  const openProductsNeedingRecipe = productEcons.filter((e) => e.openUnits > 0 && !e.hasRecipe);
  const costedProductsSample = productEcons.filter((e) => e.hasRecipe);

  // Shopping list items from workbook ledger engine
  const shoppingList = ledgerSummary.shoppingList;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#FAF5EE] via-[#FDFBF8] to-[#FAF5EE] border border-[#E8DDCF] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#8F243C] mb-1">
            <Sparkles size={14} className="text-[#C69C31]" />
            <span>Artisanal Heritage & Studio Overview</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C181B] tracking-tight">
            Good morning, Vedh.
          </h2>
          <p className="mt-2 text-sm text-[#635B5B]">
            Manage your Vedh records, track bespoke orders, monitor artisanal materials, and issue branded invoices.
          </p>
        </div>

        {onOpenEnquiryChecker && (
          <button
            onClick={onOpenEnquiryChecker}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold shadow-sm transition shrink-0 self-start md:self-center"
          >
            <ClipboardCheck size={16} className="text-amber-200" />
            <span>Can I Accept This Order?</span>
          </button>
        )}
      </div>

      {/* 4 Core Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Order value */}
        <div
          onClick={() => setActiveTab('orders')}
          className="bg-white border border-[#E8DDCF] rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <div className="text-xs font-medium text-[#7A6E6E] tracking-wide">Order value</div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-[#2C181B]">
            {formatINR(totalOrderValue)}
          </div>
          <div className="mt-1 text-xs text-[#8C7D7D] flex items-center justify-between gap-2">
            <span>{orderOverview.distinctOrdersCount} orders ({orderOverview.openOrderLines} open)</span>
            <span className="text-[#8F243C] font-medium">
              {orderOverview.unitsToMake} make · {orderOverview.unitsReadyWaitingDelivery} ready
            </span>
          </div>
        </div>

        {/* Customer payments */}
        <div
          onClick={() => setActiveTab('orders')}
          className="bg-white border border-[#E8DDCF] rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <div className="text-xs font-medium text-[#7A6E6E] tracking-wide">Customer payments</div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-emerald-800">
            {formatINR(totalReceived)}
          </div>
          <div className="mt-1 text-xs text-[#8C7D7D] flex flex-wrap items-center justify-between gap-1">
            <span>Due: {formatINR(orderOverview.totalBalanceDue)}</span>
            {orderOverview.deliveredUnpaidAmount > 0 && (
              <span className="text-rose-700 font-semibold">
                {formatINR(orderOverview.deliveredUnpaidAmount)} delivered unpaid
              </span>
            )}
          </div>
        </div>

        {/* Expenses */}
        <div
          onClick={() => setActiveTab('expenses')}
          className="bg-white border border-[#E8DDCF] rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <div className="text-xs font-medium text-[#7A6E6E] tracking-wide">Purchases &amp; expenses</div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-[#8F243C]">
            {formatINR(totalExpenses, 2)}
          </div>
          <div className="mt-1 text-xs text-[#8C7D7D] flex items-center justify-between">
            <span>{purchaseOverview.lineItemCount} items · {purchaseOverview.inTransitCount} pending</span>
            <span className="text-rose-700 font-medium">
              {purchaseOverview.refundChaseCount > 0
                ? `${purchaseOverview.refundChaseCount} refunds to chase`
                : 'Live Sheet'}
            </span>
          </div>
        </div>

        {/* Gross position */}
        <div className="bg-white border border-[#E8DDCF] rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="text-xs font-medium text-[#7A6E6E] tracking-wide">Gross position</div>
          <div className={`mt-2 text-2xl sm:text-3xl font-serif font-bold ${grossPosition >= 0 ? 'text-emerald-800' : 'text-[#8F243C]'}`}>
            {formatINR(grossPosition, 2)}
          </div>
          <div className="mt-1 text-xs text-[#8C7D7D] flex items-center justify-between">
            <span>Received less purchases</span>
            {purchaseOverview.problemOrderValue > 0 && (
              <span className="text-rose-700 font-medium">
                {formatINR(purchaseOverview.problemOrderValue)} returns
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Section: Orders In Motion & Stock Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Orders in motion (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2C181B]">
                Orders in motion
              </h3>
              <p className="text-xs text-[#7A6E6E]">
                {ordersInMotion.length} currently tracked in workshop
              </p>
            </div>
            <button
              onClick={onOpenNewOrder}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-medium transition"
            >
              <span>+ New order</span>
            </button>
          </div>

          <div className="divide-y divide-[#F2EBE0] overflow-x-auto">
            {ordersInMotion.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8C7D7D]">
                No active orders in production.
              </div>
            ) : (
              ordersInMotion.map((order) => {
                const m = computeOrderMetrics(order, recipeSnapshot.productEconomicsByName);
                return (
                  <div
                    key={order.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF6F0]/60 px-2 rounded-lg transition"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-semibold text-[#8F243C] bg-[#FAF0E6] px-2 py-1 rounded">
                        {order.orderNumber}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#2C181B]">
                            {order.customerName}
                          </span>
                          {m.dueAlert && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                m.dueAlert === 'Overdue'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {m.dueAlert}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#7A6E6E]">
                          {order.items.map((i) => `${i.productName} × ${i.quantity}`).join(', ')}
                          {order.targetDeliveryDate ? ` • Due ${order.targetDeliveryDate}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 justify-between sm:justify-end">
                      <span className="text-sm font-semibold font-serif text-[#2C181B]">
                        {formatINR(m.totalAmount)}
                      </span>

                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          order.status === 'In Production' || order.status === 'Production'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : order.status === 'Ready'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : order.status === 'New'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {order.status}
                      </span>

                      <button
                        onClick={() => onSelectOrderForInvoice(buildCombinedInvoiceOrder(order, orders))}
                        className="text-xs text-[#8F243C] hover:underline font-medium"
                        title="Generate or view combined Invoice"
                      >
                        Invoice
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#F2EBE0] text-right">
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs text-[#8F243C] font-semibold hover:underline inline-flex items-center space-x-1"
            >
              <span>View all orders</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Column: Shopping List & Stock Attention */}
        <div className="bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#2C181B] flex items-center gap-1.5">
                  <ShoppingBag size={16} className="text-[#8F243C]" />
                  <span>Shopping list &amp; stock</span>
                </h3>
                <p className="text-xs text-[#7A6E6E]">
                  {inventory.length} tracked · {ledgerSummary.missingOpeningCount} missing shelf count
                </p>
              </div>
              <button
                onClick={onOpenNewStock}
                className="px-3 py-1.5 rounded-lg border border-[#D9C9B4] text-xs font-medium text-[#423A3A] bg-[#FAF6F0] hover:bg-[#F0EAE1] transition"
              >
                + Add stock
              </button>
            </div>

            {ledgerSummary.missingOpeningCount > 0 && (
              <button
                onClick={() => setActiveTab('inventory')}
                className="w-full mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-left text-[11px] text-amber-900 hover:bg-amber-100/70 transition flex items-center justify-between"
              >
                <span>
                  ⚠ <strong>{ledgerSummary.missingOpeningCount} materials</strong> still need physical opening shelf counts
                </span>
                <span className="font-semibold text-[#541523] shrink-0 ml-2">Enter →</span>
              </button>
            )}

            <div className="space-y-2.5">
              {shoppingList.length === 0 ? (
                <div className="py-6 text-center text-xs text-emerald-700 bg-emerald-50 rounded-lg">
                  All counted inventory healthy. No reorders needed!
                </div>
              ) : (
                shoppingList.slice(0, 5).map(({ item, ledger }) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#FAF5EE] border border-[#EBDCCB] rounded-xl flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#2C181B] truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-[#7A6E6E]">
                        <span className="font-semibold text-rose-700">Free: {ledger.freeAfterOrders} {item.unit}</span>
                        {ledger.incomingFromPurchases > 0 ? ` · +${ledger.incomingFromPurchases} arriving` : ` — reorder ${item.reorderLevel}`}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                      {ledger.ledgerStatus === 'LOW' ? `Buy ${ledger.recommendedOrderQty}` : ledger.ledgerStatus}
                    </span>
                  </div>
                ))
              )}
              {shoppingList.length > 5 && (
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="w-full text-center text-xs text-[#8F243C] font-semibold hover:underline pt-1"
                >
                  +{shoppingList.length - 5} more in Stock Shopping List →
                </button>
              )}
            </div>
          </div>

          {/* Traditional Craft Reminder Quote */}
          <div className="mt-6 pt-4 border-t border-[#F2EBE0] text-center">
            <p className="text-[11px] italic text-[#8F243C] font-serif">
              "Keeping Indian tradition alive through designer artisan pieces."
            </p>
          </div>
        </div>
      </div>

      {/* Recipes, Open Demand & Margin Readiness */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8F243C] mb-0.5">
              <Layers size={13} className="text-[#C69C31]" />
              <span>Products &amp; Recipe Economics (Live Sync)</span>
            </div>
            <h3 className="font-serif text-lg font-bold text-[#2C181B]">
              Recipe Coverage &amp; Unit Margins
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#FAF5EE] border border-[#E8DDCF] font-semibold text-[#541523]">
              {productsWithRecipeCount} / {products.length} recipes active
            </span>
            <button
              onClick={() => setActiveTab('recipe')}
              className="px-3 py-1.5 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold transition"
            >
              Open Recipe Studio
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Open Orders Needing Recipes */}
          <div className="space-y-2.5">
            <p className="font-semibold text-[#635B5B]">
              Open Order Demand Missing Recipes ({openProductsNeedingRecipe.length})
            </p>
            {openProductsNeedingRecipe.length === 0 ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                Every open order product has a configured recipe!
              </div>
            ) : (
              <div className="space-y-2">
                {openProductsNeedingRecipe.map((econ) => (
                  <div
                    key={econ.productId}
                    className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-[#2C181B]">{econ.productName}</div>
                      <div className="text-[11px] text-amber-800">
                        {econ.openUnits} open units • Missing BOM for stock check
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenRecipeForProduct ? onOpenRecipeForProduct(econ.productName) : setActiveTab('recipe')}
                      className="px-2.5 py-1 rounded-md bg-white border border-amber-300 text-[#541523] font-semibold hover:bg-[#FAF5EE] shrink-0"
                    >
                      + Build Recipe
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Configured Product Margins */}
          <div className="space-y-2.5">
            <p className="font-semibold text-[#635B5B]">
              Configured Product Margins ({costedProductsSample.length})
            </p>
            <div className="space-y-2">
              {costedProductsSample.slice(0, 4).map((econ) => (
                <div
                  key={econ.productId}
                  onClick={() => onOpenRecipeForProduct ? onOpenRecipeForProduct(econ.productName) : setActiveTab('recipe')}
                  className="p-3 rounded-xl bg-[#FDFBF7] border border-[#E8DDCF] flex items-center justify-between gap-2 cursor-pointer hover:bg-[#FAF5EE] transition"
                >
                  <div>
                    <div className="font-semibold text-[#2C181B]">{econ.productName}</div>
                    <div className="text-[11px] text-[#7A6E6E]">
                      Price {formatINR(econ.price)} • Mat cost {formatINR(econ.materialCostPerUnit, 2)} ({econ.costedIngredientCount}/{econ.ingredientCount} costed)
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-emerald-700">
                      {econ.marginPerUnit !== null ? formatINR(econ.marginPerUnit, 2) : '—'}
                    </div>
                    <div className="text-[10px] text-[#8C7D7D]">{econ.marginPct ?? 0}% margin</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Procurement & Platform Performance (Live Formulas from Purchase & Platform Sheets) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Platform Summary Table (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8F243C] mb-0.5">
                <Store size={13} className="text-[#C69C31]" />
                <span>Platform Summary Formulas (Live Sync)</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-[#2C181B]">
                Platform &amp; Vendor Performance
              </h3>
              <p className="text-xs text-[#7A6E6E]">
                Live COUNTIF / SUMIF / AVERAGEIF metrics across {platformStats.length} procurement sources
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {onOpenNewExpense && (
                <button
                  onClick={onOpenNewExpense}
                  className="px-3 py-1.5 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-medium transition"
                >
                  + Record purchase
                </button>
              )}
              <button
                onClick={() => setActiveTab('expenses')}
                className="px-3 py-1.5 rounded-lg border border-[#D9C9B4] text-xs font-medium text-[#541523] bg-[#FAF6F0] hover:bg-[#F2EBE0] transition"
              >
                Open ledger →
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8DDCF] text-[11px] uppercase tracking-wider text-[#7A6E6E]">
                  <th className="py-2.5 pr-3 font-semibold">Platform / Source</th>
                  <th className="py-2.5 px-2 text-right font-semibold">Items</th>
                  <th className="py-2.5 px-2 text-right font-semibold">Total Spend (₹)</th>
                  <th className="py-2.5 px-2 text-right font-semibold">Avg Days</th>
                  <th className="py-2.5 px-2 text-right font-semibold">Late</th>
                  <th className="py-2.5 px-2 text-right font-semibold">Problems</th>
                  <th className="py-2.5 pl-2 text-right font-semibold">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EBE0]">
                {platformStats.map((row) => (
                  <tr key={row.platform} className="hover:bg-[#FAF6F0]/60 transition">
                    <td className="py-2.5 pr-3 font-semibold text-[#2C181B]">
                      <div className="flex items-center space-x-2">
                        <span>{row.platform}</span>
                        {row.inTransitCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                            {row.inTransitCount} shipped
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-[#423A3A]">
                      {row.lineItems}
                    </td>
                    <td className="py-2.5 px-2 text-right font-serif font-semibold text-[#2C181B]">
                      {formatINR(row.totalSpend, 2)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-[#635B5B]">
                      {row.avgDaysToDeliver === null
                        ? '—'
                        : row.avgDaysToDeliver === 0
                        ? '0d'
                        : `${row.avgDaysToDeliver.toFixed(1)}d`}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {row.lateDeliveries > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-[11px]">
                          {row.lateDeliveries}
                        </span>
                      ) : (
                        <span className="text-[#9A8A8A]">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {row.problemOrders > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-semibold text-[11px]">
                          {row.problemOrders}
                        </span>
                      ) : (
                        <span className="text-[#9A8A8A]">0</span>
                      )}
                    </td>
                    <td className="py-2.5 pl-2 text-right text-[#7A6E6E]">
                      {row.sharePct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#E8DDCF] bg-[#FAF5EE]/70 font-semibold text-[#2C181B]">
                  <td className="py-2.5 pr-3">Total Procurement</td>
                  <td className="py-2.5 px-2 text-right font-mono">
                    {purchaseOverview.lineItemCount}
                  </td>
                  <td className="py-2.5 px-2 text-right font-serif font-bold text-[#8F243C]">
                    {formatINR(purchaseOverview.totalSpend, 2)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-[#635B5B]">
                    {purchaseOverview.avgDaysToDeliver === null
                      ? '—'
                      : `${purchaseOverview.avgDaysToDeliver.toFixed(1)}d`}
                  </td>
                  <td className="py-2.5 px-2 text-right text-amber-800">
                    {purchaseOverview.lateDeliveryCount}
                  </td>
                  <td className="py-2.5 px-2 text-right text-rose-800">
                    {purchaseOverview.problemOrderCount}
                  </td>
                  <td className="py-2.5 pl-2 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right: Shipments in Transit, Refunds & Top Categories */}
        <div className="space-y-4">
          {/* In Transit / Problem Watch */}
          <div className="bg-white border border-[#E8DDCF] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Truck size={15} className="text-[#8F243C]" />
                <h4 className="font-serif text-base font-bold text-[#2C181B]">
                  Delivery &amp; Refund Watch
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-[#8F243C]">
                {purchaseOverview.inTransitCount} active
              </span>
            </div>

            {purchaseOverview.inTransitExpenses.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-800">
                  In Transit ({formatINR(purchaseOverview.inTransitValue, 2)})
                </div>
                {purchaseOverview.inTransitExpenses.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-[#2C181B] truncate">{item.title}</div>
                      <div className="text-[11px] text-[#635B5B]">
                        {item.platform} • Exp: {item.expectedDelivery || 'TBD'}
                      </div>
                    </div>
                    <span className="font-serif font-bold text-[#2C181B] shrink-0">
                      {formatINR(item.amount, 2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {purchaseOverview.problemExpenses.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#F2EBE0]">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-rose-800">
                  <span className="flex items-center space-x-1">
                    <RotateCcw size={12} />
                    <span>Returns &amp; Refunds</span>
                  </span>
                  <span>{formatINR(purchaseOverview.problemOrderValue, 2)}</span>
                </div>
                {purchaseOverview.problemExpenses.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-rose-50/70 border border-rose-200 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-medium text-[#2C181B] truncate">{item.title}</div>
                      <div className="text-[10px] text-rose-700">
                        {item.platform} • {item.purchaseStatus}
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-rose-800 shrink-0">
                      {formatINR(item.amount, 2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Top Categories */}
            <div className="space-y-2.5 pt-2 border-t border-[#F2EBE0]">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#7A6E6E]">
                <span>Top Spend Categories</span>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="text-[#8F243C] hover:underline capitalize font-semibold"
                >
                  Reports →
                </button>
              </div>
              {categorySpend.slice(0, 4).map((cat) => (
                <div key={cat.category} className="space-y-1 text-xs">
                  <div className="flex justify-between text-[#2C181B]">
                    <span className="font-medium truncate pr-2">{cat.category}</span>
                    <span className="font-semibold shrink-0">
                      {formatINR(cat.totalSpend)} ({cat.sharePct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#FAF0E6] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#8F243C]"
                      style={{ width: `${Math.min(100, cat.sharePct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
