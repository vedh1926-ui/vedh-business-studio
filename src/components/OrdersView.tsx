'use client';

import React, { useMemo, useState } from 'react';
import {
  Expense,
  InventoryItem,
  Order,
  OrderStatus,
  Product,
  RecipeIngredient,
  StockAdjustment,
} from '@/lib/types';
import {
  buildCombinedInvoiceOrder,
  computeOrderMetrics,
  computeOrderOverview,
  computeRecipeAndProductSnapshot,
  exportOrdersToCsv,
  normalizeNameKey,
} from '@/lib/oprFormulas';
import { formatINR } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Edit3,
  FileText,
  Layers,
  List,
  Plus,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  products: Product[];
  recipes: RecipeIngredient[];
  inventory: InventoryItem[];
  expenses?: Expense[];
  adjustments?: StockAdjustment[];
  orderStatuses: string[];
  onOpenNewOrder: () => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onToggleDeductStock: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onSelectOrderForInvoice: (order: Order) => void;
  onOpenRecipeForProduct?: (productName: string) => void;
  onOpenEnquiryChecker?: () => void;
}

export default function OrdersView({
  orders,
  products,
  recipes,
  inventory,
  expenses = [],
  adjustments = [],
  orderStatuses,
  onOpenNewOrder,
  onEditOrder,
  onDeleteOrder,
  onUpdateStatus,
  onToggleDeductStock,
  onMarkPaid,
  onSelectOrderForInvoice,
  onOpenRecipeForProduct,
  onOpenEnquiryChecker,
}: OrdersViewProps) {
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [smartFilter, setSmartFilter] = useState<'all' | 'unpaid' | 'delivered-unpaid' | 'due' | 'recipe-alert'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'lines' | 'grouped'>('lines');

  const snapshot = useMemo(
    () => computeRecipeAndProductSnapshot(products, recipes, orders, inventory, expenses, adjustments),
    [products, recipes, orders, inventory, expenses, adjustments]
  );

  const overview = useMemo(
    () => computeOrderOverview(orders, snapshot.productEconomicsByName),
    [orders, snapshot.productEconomicsByName]
  );

  const rowsWithMetrics = useMemo(() => {
    return orders.map((order) => ({
      order,
      metrics: computeOrderMetrics(order, snapshot.productEconomicsByName),
    }));
  }, [orders, snapshot.productEconomicsByName]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rowsWithMetrics.filter(({ order, metrics }) => {
      if (statusFilter !== 'All' && order.status !== statusFilter) return false;
      if (smartFilter === 'unpaid' && metrics.paymentState === 'Paid') return false;
      if (smartFilter === 'delivered-unpaid' && (order.status !== 'Delivered' || metrics.balanceDue <= 0)) {
        return false;
      }
      if (smartFilter === 'due' && !metrics.dueAlert) return false;
      if (
        smartFilter === 'recipe-alert' &&
        metrics.stockCheck !== 'No recipe' &&
        metrics.stockCheck !== 'Shortage'
      ) {
        return false;
      }
      if (!q) return true;
      const itemNames = order.items.map((i) => i.productName).join(' ');
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        (order.customerPhone || '').toLowerCase().includes(q) ||
        itemNames.toLowerCase().includes(q) ||
        (order.notes || '').toLowerCase().includes(q)
      );
    });
  }, [rowsWithMetrics, statusFilter, smartFilter, searchQuery]);

  // Grouped view (merge order lines with same Order No + Customer Name + Order Date)
  const groupedOrders = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        primary: Order;
        lines: typeof filteredRows;
        totalAmount: number;
        advancePaid: number;
        balanceDue: number;
        totalQty: number;
      }
    >();

    for (const row of filteredRows) {
      const { order, metrics } = row;
      const gKey = `${order.orderNumber.trim().toUpperCase()}__${normalizeNameKey(order.customerName)}__${order.createdAt}`;
      const prev = groups.get(gKey);
      if (prev) {
        prev.lines.push(row);
        prev.totalAmount += metrics.totalAmount;
        prev.advancePaid += metrics.advancePaid;
        prev.balanceDue += metrics.balanceDue;
        prev.totalQty += metrics.qty;
      } else {
        groups.set(gKey, {
          key: gKey,
          primary: order,
          lines: [row],
          totalAmount: metrics.totalAmount,
          advancePaid: metrics.advancePaid,
          balanceDue: metrics.balanceDue,
          totalQty: metrics.qty,
        });
      }
    }
    return Array.from(groups.values());
  }, [filteredRows]);

  const handleExportCsv = () => {
    const csv = exportOrdersToCsv(orders, snapshot.productEconomicsByName);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vedh_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">Orders Studio</h2>
          <p className="text-xs text-[#7A6E6E]">
            {overview.totalOrderLines} order lines across {overview.distinctOrdersCount} customer orders — live due alerts, payment states &amp; recipe stock checks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenEnquiryChecker && (
            <button
              onClick={onOpenEnquiryChecker}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg border border-[#D9C9B4] bg-[#FDFBF7] hover:bg-[#F2EBE0] text-xs font-semibold text-[#541523] transition shadow-sm"
            >
              <ClipboardCheck size={14} />
              <span>Can I Accept?</span>
            </button>
          )}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg border border-[#D9C9B4] bg-[#FDFBF7] hover:bg-[#F2EBE0] text-xs font-semibold text-[#541523] transition shadow-sm"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenNewOrder}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide transition shadow-sm"
          >
            <Plus size={16} />
            <span>+ Add order</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-[#7A6E6E] font-medium">Total Order Value</p>
          <p className="text-2xl font-serif font-bold text-[#2C181B] mt-1">
            {formatINR(overview.totalOrderValue)}
          </p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">
            {overview.totalUnitsOrdered} units · {overview.distinctOrdersCount} orders
          </p>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-[#7A6E6E] font-medium">Amount Received</p>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">
            {formatINR(overview.totalReceived)}
          </p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">
            {overview.paidCount} paid · {overview.partialCount} partial lines
          </p>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-[#7A6E6E] font-medium">Balance Due</p>
          <p className="text-2xl font-serif font-bold text-[#8F243C] mt-1">
            {formatINR(overview.totalBalanceDue)}
          </p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">
            {overview.unpaidCount} unpaid ·{' '}
            <button
              onClick={() => setSmartFilter('delivered-unpaid')}
              className="text-rose-700 font-semibold hover:underline"
            >
              {formatINR(overview.deliveredUnpaidAmount)} delivered unpaid
            </button>
          </p>
        </div>

        <div className="bg-white border border-[#E8DDCF] rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-[#7A6E6E] font-medium">Open Production Units</p>
          <p className="text-2xl font-serif font-bold text-[#A67E1F] mt-1">
            {overview.openUnitsCount} <span className="text-xs font-normal text-[#8C7D7D]">({overview.unitsToMake} make · {overview.unitsReadyWaitingDelivery} ready)</span>
          </p>
          <p className="text-[11px] text-[#8C7D7D] mt-0.5">
            {overview.dueSoonCount + overview.overdueCount} due/overdue · {overview.missingRecipeOpenCount} need recipe
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-[#E8DDCF] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-2.5 text-[#8C7D7D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order #, Customer, Phone, Product or Notes..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#D9C9B4] bg-[#FDFBF7] text-xs focus:outline-none focus:ring-1 focus:ring-[#541523]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Smart quick filters */}
            <div className="inline-flex rounded-lg border border-[#E8DDCF] bg-[#FAF5EE] p-0.5 text-[11px]">
              {[
                { id: 'all', label: 'All Lines' },
                { id: 'unpaid', label: 'Unpaid / Partial' },
                { id: 'delivered-unpaid', label: 'Delivered Unpaid' },
                { id: 'due', label: 'Due Soon / Overdue' },
                { id: 'recipe-alert', label: 'Recipe / Stock Alert' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSmartFilter(item.id as typeof smartFilter)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    smartFilter === item.id
                      ? 'bg-white text-[#541523] shadow-sm font-semibold'
                      : 'text-[#635B5B] hover:text-[#2C181B]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Lines vs Grouped toggle */}
            <div className="inline-flex rounded-lg border border-[#D9C9B4] bg-[#FAF5EE] p-0.5 text-[11px]">
              <button
                onClick={() => setViewMode('lines')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium ${
                  viewMode === 'lines' ? 'bg-[#541523] text-white' : 'text-[#635B5B]'
                }`}
              >
                <List size={12} />
                <span>Lines ({filteredRows.length})</span>
              </button>
              <button
                onClick={() => setViewMode('grouped')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium ${
                  viewMode === 'grouped' ? 'bg-[#541523] text-white' : 'text-[#635B5B]'
                }`}
              >
                <Layers size={12} />
                <span>Orders ({groupedOrders.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-0.5 text-xs">
          {['All', ...orderStatuses].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full border font-medium transition whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-[#541523] text-white border-[#541523]'
                  : 'bg-[#FDFBF7] text-[#635B5B] border-[#E8DDCF] hover:bg-[#FAF6F0]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Orders Data Table / Grouped Cards */}
      {viewMode === 'lines' ? (
        <div className="bg-white border border-[#E8DDCF] rounded-2xl shadow-sm overflow-hidden">
          {filteredRows.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#8C7D7D]">
              No order lines match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF5EE] border-b border-[#E8DDCF] text-[#635B5B] font-semibold">
                    <th className="py-3 px-4">Order # / Date</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Product &amp; Qty</th>
                    <th className="py-3 px-3 text-right">Total / Due</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Due / Alert</th>
                    <th className="py-3 px-3 text-center">Deduct?</th>
                    <th className="py-3 px-3">Stock Check</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EBE0]">
                  {filteredRows.map(({ order, metrics }) => {
                    const primaryProdName = order.items[0]?.productName || '';
                    return (
                      <tr key={order.id} className="hover:bg-[#FAF6F0]/60 transition">
                        <td className="py-3 px-4 align-top whitespace-nowrap">
                          <div className="font-mono font-bold text-[#8F243C]">
                            {order.orderNumber}
                          </div>
                          <div className="text-[10px] text-[#8C7D7D]">{order.createdAt}</div>
                        </td>

                        <td className="py-3 px-3 align-top">
                          <div className="font-semibold text-[#2C181B]">{order.customerName}</div>
                          {order.customerPhone && (
                            <div className="text-[10px] text-[#7A6E6E] font-mono">
                              {order.customerPhone}
                            </div>
                          )}
                          {order.notes && (
                            <div className="text-[10px] text-[#8F243C] mt-0.5 max-w-[190px] line-clamp-2" title={order.notes}>
                              {order.notes}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 align-top">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-[#2C181B] font-medium">
                              {item.productName}{' '}
                              <span className="font-bold text-[#541523]">×{item.quantity}</span>
                            </div>
                          ))}
                          <div className="text-[10px] text-[#8C7D7D]">
                            Unit: {formatINR(metrics.unitPrice)}
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                          <div className="font-serif font-bold text-[#2C181B]">
                            {formatINR(metrics.totalAmount)}
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                metrics.paymentState === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : metrics.paymentState === 'Partial'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {metrics.paymentState}
                            </span>
                            {metrics.balanceDue > 0 && (
                              <span className="text-[10px] text-rose-700 font-semibold">
                                Due {formatINR(metrics.balanceDue)}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top">
                          <select
                            value={order.status}
                            onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                            aria-label={`Status for ${order.orderNumber}`}
                            className={`text-[11px] font-semibold px-2 py-1 rounded-md border focus:outline-none ${
                              order.status === 'In Production'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : order.status === 'Ready'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                : order.status === 'New'
                                ? 'bg-blue-50 text-blue-900 border-blue-300'
                                : order.status === 'Cancelled'
                                ? 'bg-rose-50 text-rose-900 border-rose-300'
                                : 'bg-stone-50 text-stone-700 border-stone-300'
                            }`}
                          >
                            {(orderStatuses.includes(order.status)
                              ? orderStatuses
                              : [order.status, ...orderStatuses]
                            ).map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          {order.targetDeliveryDate && (
                            <div className="text-[11px] text-[#635B5B] flex items-center gap-1">
                              <Clock size={11} />
                              <span>{order.targetDeliveryDate}</span>
                            </div>
                          )}
                          {order.deliveredOn && (
                            <div className="text-[10px] text-emerald-700">
                              Del: {order.deliveredOn}
                            </div>
                          )}
                          {metrics.dueAlert && (
                            <span
                              className={`inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                metrics.dueAlert === 'Overdue'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {metrics.dueAlert}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 align-top text-center">
                          <button
                            type="button"
                            onClick={() => onToggleDeductStock(order.id)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border transition ${
                              metrics.deductStock
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-stone-100 text-stone-600 border-stone-300'
                            }`}
                            title="Click to toggle stock deduction in Recipe planning"
                          >
                            {metrics.deductStock ? 'Yes' : 'No'}
                          </button>
                        </td>

                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          {metrics.stockCheck === 'No recipe' ? (
                            <button
                              type="button"
                              onClick={() => onOpenRecipeForProduct?.(primaryProdName)}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 transition"
                              title="Click to build recipe for this product"
                            >
                              <AlertTriangle size={11} />
                              <span>No recipe</span>
                            </button>
                          ) : metrics.stockCheck === 'Shortage' ? (
                            <button
                              type="button"
                              onClick={() => onOpenRecipeForProduct?.(primaryProdName)}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-red-100 text-red-800 hover:bg-red-200 transition"
                            >
                              <AlertTriangle size={11} />
                              <span>Shortage</span>
                            </button>
                          ) : metrics.stockCheck === 'OK' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              <CheckCircle2 size={11} />
                              <span>OK</span>
                            </span>
                          ) : (
                            <span className="text-[#8C7D7D]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {metrics.balanceDue > 0 && order.status !== 'Cancelled' && (
                              <button
                                onClick={() => onMarkPaid(order.id)}
                                className="p-1.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                                title="Mark full balance received"
                              >
                                <Wallet size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => onEditOrder(order)}
                              className="p-1.5 rounded border border-[#D9C9B4] bg-white text-[#541523] hover:bg-[#F2EBE0] transition"
                              title="Edit order row"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => onSelectOrderForInvoice(buildCombinedInvoiceOrder(order, orders))}
                              className="p-1.5 rounded border border-[#D9C9B4] bg-white text-[#541523] hover:bg-[#F2EBE0] transition"
                              title="Generate combined customer invoice"
                            >
                              <FileText size={13} />
                            </button>
                            <button
                              onClick={() => onDeleteOrder(order.id)}
                              className="p-1.5 rounded text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition"
                              title="Delete order row"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {groupedOrders.map((g) => (
            <div
              key={g.key}
              className="bg-white border border-[#E8DDCF] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#8F243C] bg-[#FAF0E6] px-2.5 py-1 rounded-md border border-[#EBDCCB]">
                    {g.primary.orderNumber}
                  </span>
                  <span className="text-sm font-bold text-[#2C181B]">
                    {g.primary.customerName}
                  </span>
                  <span className="text-[11px] text-[#8C7D7D]">{g.primary.createdAt}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF5EE] border border-[#E8DDCF] text-[#635B5B]">
                    {g.lines.length} line{g.lines.length > 1 ? 's' : ''} · {g.totalQty} units
                  </span>
                </div>
                <div className="text-xs text-[#635B5B] space-y-0.5">
                  {g.lines.map(({ order, metrics }) => (
                    <div key={order.id} className="flex items-center gap-2">
                      <span>• {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                        {order.status}
                      </span>
                      {metrics.dueAlert && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                          {metrics.dueAlert}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 justify-between md:justify-end">
                <div className="text-right">
                  <div className="font-serif font-bold text-base text-[#2C181B]">
                    {formatINR(g.totalAmount)}
                  </div>
                  <div className="text-[11px] text-[#7A6E6E]">
                    Received: <span className="text-emerald-700 font-semibold">{formatINR(g.advancePaid)}</span>
                    {g.balanceDue > 0 && (
                      <span className="text-rose-700 ml-1">| Due: {formatINR(g.balanceDue)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onSelectOrderForInvoice(buildCombinedInvoiceOrder(g.primary, orders))}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[#D9C9B4] text-xs font-semibold text-[#541523] bg-white hover:bg-[#F2EBE0] transition"
                >
                  <FileText size={14} />
                  <span>Invoice</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
