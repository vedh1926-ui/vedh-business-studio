import {
  Expense,
  PurchaseRowMetrics,
  PlatformSummaryRow,
  CategorySpendRow,
} from './types';
import { round2 } from './utils';

const MS_PER_DAY = 86_400_000;

export const PROBLEM_PURCHASE_STATUSES = ['Returned', 'Refund Pending', 'Cancelled'];
export const IN_TRANSIT_PURCHASE_STATUSES = ['Ordered', 'Shipped', 'Delayed'];

function parseIsoDateUtc(ymd?: string): number | null {
  if (!ymd) return null;
  const trimmed = ymd.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return Date.UTC(year, month - 1, day);
}

/**
 * Exact calendar day difference between two ISO YYYY-MM-DD dates (end - start).
 */
export function diffCalendarDays(startYmd?: string, endYmd?: string): number | null {
  const start = parseIsoDateUtc(startYmd);
  const end = parseIsoDateUtc(endYmd);
  if (start === null || end === null) return null;
  return Math.round((end - start) / MS_PER_DAY);
}

/**
 * Computes spreadsheet row-level formulas for a single purchase / expense record:
 * - Total Cost (₹) = Qty × Unit Price + Shipping
 * - Total Units = Qty × Pieces/Pack
 * - Landed Cost / Unit = Total Cost / Total Units
 * - Days Taken = Actual Delivery - Order Date
 * - Delay (days) = Actual Delivery - Expected Delivery
 */
export function computePurchaseRowMetrics(exp: Expense): PurchaseRowMetrics {
  const hasLinePricing =
    typeof exp.qty === 'number' &&
    exp.qty > 0 &&
    typeof exp.unitPrice === 'number';

  const qty = exp.qty && exp.qty > 0 ? exp.qty : 1;
  const piecesPerPack = exp.piecesPerPack && exp.piecesPerPack > 0 ? exp.piecesPerPack : 1;
  const unitPrice = hasLinePricing ? (exp.unitPrice ?? 0) : round2(exp.amount);
  const shipping = round2(exp.shipping ?? 0);

  const subtotal = round2(qty * unitPrice);
  const totalCost = hasLinePricing ? round2(subtotal + shipping) : round2(exp.amount);
  const totalUnits = round2(qty * piecesPerPack);
  const costPerUnit = totalUnits > 0 ? round2(totalCost / totalUnits) : 0;

  const daysTaken = diffCalendarDays(exp.date, exp.actualDelivery);
  const delayDays = diffCalendarDays(exp.expectedDelivery, exp.actualDelivery);
  const status = (exp.purchaseStatus || 'Delivered').trim();

  return {
    qty,
    piecesPerPack,
    unitPrice,
    shipping,
    subtotal,
    totalCost,
    totalUnits,
    costPerUnit,
    daysTaken,
    delayDays,
    isLate: delayDays !== null && delayDays > 0,
    isEarly: delayDays !== null && delayDays < 0,
    isInTransit: IN_TRANSIT_PURCHASE_STATUSES.includes(status),
    isProblemOrder: PROBLEM_PURCHASE_STATUSES.includes(status),
  };
}

export interface PurchaseOverview {
  totalSpend: number;
  netEffectiveSpend: number;
  totalShipping: number;
  lineItemCount: number;
  activePlatformCount: number;
  deliveredCount: number;
  inTransitCount: number;
  inTransitValue: number;
  lateDeliveryCount: number;
  problemOrderCount: number;
  problemOrderValue: number;
  avgDaysToDeliver: number | null;
  inTransitExpenses: Expense[];
  problemExpenses: Expense[];
  lateExpenses: Expense[];
}

/**
 * Live workbook totals across all Purchase / Expense rows.
 */
export function computePurchaseOverview(expenses: Expense[]): PurchaseOverview {
  let totalSpend = 0;
  let totalShipping = 0;
  let deliveredDaysSum = 0;
  let deliveredDaysCount = 0;
  let deliveredCount = 0;
  let inTransitValue = 0;
  let problemOrderValue = 0;

  const activePlatforms = new Set<string>();
  const inTransitExpenses: Expense[] = [];
  const problemExpenses: Expense[] = [];
  const lateExpenses: Expense[] = [];

  for (const exp of expenses) {
    const m = computePurchaseRowMetrics(exp);
    totalSpend += m.totalCost;
    totalShipping += m.shipping;

    if (exp.platform && exp.platform.trim()) {
      activePlatforms.add(exp.platform.trim());
    }

    if (m.daysTaken !== null) {
      deliveredDaysSum += m.daysTaken;
      deliveredDaysCount += 1;
    }

    if (m.isLate) {
      lateExpenses.push(exp);
    }

    if (m.isInTransit) {
      inTransitValue += m.totalCost;
      inTransitExpenses.push(exp);
    } else if (m.isProblemOrder) {
      problemOrderValue += m.totalCost;
      problemExpenses.push(exp);
    } else {
      deliveredCount += 1;
    }
  }

  const roundedTotal = round2(totalSpend);
  const roundedProblem = round2(problemOrderValue);

  return {
    totalSpend: roundedTotal,
    netEffectiveSpend: round2(roundedTotal - roundedProblem),
    totalShipping: round2(totalShipping),
    lineItemCount: expenses.length,
    activePlatformCount: activePlatforms.size,
    deliveredCount,
    inTransitCount: inTransitExpenses.length,
    inTransitValue: round2(inTransitValue),
    lateDeliveryCount: lateExpenses.length,
    problemOrderCount: problemExpenses.length,
    problemOrderValue: roundedProblem,
    avgDaysToDeliver:
      deliveredDaysCount > 0 ? round2(deliveredDaysSum / deliveredDaysCount) : null,
    inTransitExpenses,
    problemExpenses,
    lateExpenses,
  };
}

/**
 * Live Platform / Supplier summary formulas replicating the Platform Excel sheet:
 * - Line Items (COUNTIF)
 * - Total Spend (SUMIF)
 * - Avg Days to Deliver (AVERAGEIF excluding empty/undelivered)
 * - Late Deliveries (Delay > 0)
 * - Problem Orders (Returned / Refund Pending / Cancelled)
 */
export function computePlatformStats(
  expenses: Expense[],
  configuredPlatforms: string[] = []
): PlatformSummaryRow[] {
  const orderedNames: string[] = [];
  const seen = new Set<string>();

  for (const p of configuredPlatforms) {
    const clean = p.trim();
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      orderedNames.push(clean);
    }
  }

  for (const exp of expenses) {
    const clean = (exp.platform || exp.supplierName || 'Other / Direct').trim();
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      orderedNames.push(clean);
    }
  }

  const rows: PlatformSummaryRow[] = orderedNames.map((platform) => ({
    platform,
    lineItems: 0,
    totalSpend: 0,
    avgDaysToDeliver: null,
    lateDeliveries: 0,
    problemOrders: 0,
    inTransitCount: 0,
    sharePct: 0,
  }));

  const byName = new Map(rows.map((r) => [r.platform, r]));
  const daysAcc = new Map<string, { sum: number; count: number }>();

  let grandTotal = 0;

  for (const exp of expenses) {
    const key = (exp.platform || exp.supplierName || 'Other / Direct').trim();
    const target = byName.get(key);
    if (!target) continue;

    const m = computePurchaseRowMetrics(exp);
    target.lineItems += 1;
    target.totalSpend = round2(target.totalSpend + m.totalCost);
    grandTotal += m.totalCost;

    if (m.daysTaken !== null) {
      const prev = daysAcc.get(key) || { sum: 0, count: 0 };
      prev.sum += m.daysTaken;
      prev.count += 1;
      daysAcc.set(key, prev);
    }

    if (m.isLate) target.lateDeliveries += 1;
    if (m.isProblemOrder) target.problemOrders += 1;
    if (m.isInTransit) target.inTransitCount += 1;
  }

  for (const row of rows) {
    const d = daysAcc.get(row.platform);
    row.avgDaysToDeliver = d && d.count > 0 ? d.sum / d.count : null;
    row.sharePct = grandTotal > 0 ? round2((row.totalSpend / grandTotal) * 100) : 0;
  }

  return rows;
}

/**
 * Aggregates spend, item count, and units received by Master Category.
 */
export function computeCategorySpend(expenses: Expense[]): CategorySpendRow[] {
  const map = new Map<string, CategorySpendRow>();
  let grandTotal = 0;

  for (const exp of expenses) {
    const cat = (exp.category || 'Other').trim();
    const m = computePurchaseRowMetrics(exp);
    grandTotal += m.totalCost;

    const existing = map.get(cat) || {
      category: cat,
      lineItems: 0,
      totalSpend: 0,
      totalUnits: 0,
      sharePct: 0,
    };

    existing.lineItems += 1;
    existing.totalSpend = round2(existing.totalSpend + m.totalCost);
    existing.totalUnits = round2(existing.totalUnits + m.totalUnits);
    map.set(cat, existing);
  }

  const list = Array.from(map.values()).sort((a, b) => b.totalSpend - a.totalSpend);
  for (const row of list) {
    row.sharePct = grandTotal > 0 ? round2((row.totalSpend / grandTotal) * 100) : 0;
  }
  return list;
}

function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates a spreadsheet-compatible CSV matching the Purchase Sheet structure + computed formula columns.
 */
export function exportPurchasesToCsv(expenses: Expense[]): string {
  const headers = [
    'Order Date',
    'Order ID',
    'Platform',
    'Item',
    'Dimensions',
    'Category',
    'Qty (packs / items bought)',
    'Pieces per pack (info)',
    'Unit Price (₹)',
    'Shipping / Other (₹)',
    'Total Cost (₹)',
    'Payment Mode',
    'Expected Delivery',
    'Actual Delivery',
    'Days Taken',
    'Delay (days)',
    'Status',
    'Invoice / Bill No.',
    'Receipt File / Link',
    'Image Ref',
    'Supplier / Vendor',
    'Notes',
    'Contact Details',
    'Stock Item',
    'Stock Qty Received (total units)',
    'Cost / Unit (₹)',
  ];

  const lines = [headers.map(escapeCsvCell).join(',')];

  for (const exp of expenses) {
    const m = computePurchaseRowMetrics(exp);
    lines.push(
      [
        exp.date,
        exp.orderId || '',
        exp.platform || '',
        exp.title,
        exp.dimensions || '',
        exp.category,
        m.qty,
        m.piecesPerPack,
        m.unitPrice,
        m.shipping,
        m.totalCost,
        exp.paymentMode,
        exp.expectedDelivery || '',
        exp.actualDelivery || '',
        m.daysTaken === null ? '' : m.daysTaken,
        m.delayDays === null ? '' : m.delayDays,
        exp.purchaseStatus || '',
        exp.invoiceNo || '',
        exp.receiptFile || '',
        exp.imageRef || '',
        exp.supplierName || '',
        exp.notes || '',
        exp.contactDetails || '',
        exp.stockItem || '',
        m.totalUnits,
        m.costPerUnit,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  return lines.join('\n');
}
