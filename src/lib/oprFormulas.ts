import {
  Customer,
  Expense,
  InventoryItem,
  Order,
  OrderComputedMetrics,
  OrderOverviewMetrics,
  Product,
  ProductEconomics,
  RecipeIngredient,
  RecipeIngredientMetrics,
} from './types';
import { diffCalendarDays } from './purchaseFormulas';
import { round2 } from './utils';

export const OPEN_ORDER_STATUSES = ['New', 'In Production', 'Ready'];
export const CONSUMED_ORDER_STATUSES = ['In Production', 'Ready', 'Delivered'];

export function normalizeNameKey(value?: string): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function getLocalTodayYmd(referenceDate = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isOrderOpen(status: string): boolean {
  return OPEN_ORDER_STATUSES.includes(status);
}

/**
 * Matches a RecipeIngredient to its backing InventoryItem by id first,
 * then by case-insensitive normalized material name.
 */
export function findLinkedInventoryItem(
  ingredient: Pick<RecipeIngredient, 'materialId' | 'materialName'>,
  inventory: InventoryItem[]
): InventoryItem | undefined {
  if (ingredient.materialId) {
    const byId = inventory.find((item) => item.id === ingredient.materialId);
    if (byId) return byId;
  }
  const key = normalizeNameKey(ingredient.materialName);
  if (!key) return undefined;
  return inventory.find((item) => normalizeNameKey(item.name) === key);
}

/**
 * Computes weighted average landed unit cost across Purchases/Expenses that
 * mention the given stock item / material name (used to sync Purchase costs into Inventory).
 */
export function computePurchaseWeightedCostForMaterial(
  materialName: string,
  expenses: Expense[]
): number | null {
  const targetKey = normalizeNameKey(materialName);
  if (!targetKey) return null;

  let totalSpend = 0;
  let totalUnits = 0;

  for (const exp of expenses) {
    if (normalizeNameKey(exp.stockItem) !== targetKey) continue;
    const status = (exp.purchaseStatus ?? '').trim();
    if (status === 'Cancelled' || status === 'Returned') continue;
    const qty = exp.qty ?? 0;
    const pack = exp.piecesPerPack ?? 1;
    const units = qty * (pack > 0 ? pack : 1);
    const cost = exp.amount ?? 0;
    if (units > 0 && cost > 0) {
      totalUnits += units;
      totalSpend += cost;
    }
  }

  return totalUnits > 0 ? round2(totalSpend / totalUnits) : null;
}

export interface RecipeSystemSnapshot {
  ingredientMetricsById: Record<string, RecipeIngredientMetrics>;
  productEconomicsById: Record<string, ProductEconomics>;
  productEconomicsByName: Record<string, ProductEconomics>;
  reservedByMaterialKey: Record<string, number>;
  freeByMaterialKey: Record<string, number>;
}

/**
 * Computes live cross-sheet demand, stock checks, reserved quantities, landed material cost,
 * and product margins across Orders + Products + Recipes + Inventory.
 */
export function computeRecipeAndProductSnapshot(
  products: Product[],
  recipes: RecipeIngredient[],
  orders: Order[],
  inventory: InventoryItem[]
): RecipeSystemSnapshot {
  const totalOrderedByProd: Record<string, number> = {};
  const countedOrderedByProd: Record<string, number> = {};
  const consumedByProd: Record<string, number> = {};
  const openByProd: Record<string, number> = {};
  const openDeductedByProd: Record<string, number> = {};
  const revenueByProd: Record<string, number> = {};

  for (const order of orders) {
    if (order.status === 'Cancelled') continue;
    const deduct = order.deductStock !== false;
    const open = isOrderOpen(order.status);
    const consumed = CONSUMED_ORDER_STATUSES.includes(order.status);

    for (const item of order.items) {
      const pKey = normalizeNameKey(item.productName);
      const qty = Number(item.quantity) || 0;
      const rev = round2(qty * (Number(item.unitPrice) || 0));

      totalOrderedByProd[pKey] = (totalOrderedByProd[pKey] ?? 0) + qty;
      revenueByProd[pKey] = round2((revenueByProd[pKey] ?? 0) + rev);
      if (deduct) {
        countedOrderedByProd[pKey] = (countedOrderedByProd[pKey] ?? 0) + qty;
        if (consumed) {
          consumedByProd[pKey] = (consumedByProd[pKey] ?? 0) + qty;
        }
        if (open) {
          openDeductedByProd[pKey] = (openDeductedByProd[pKey] ?? 0) + qty;
        }
      }
      if (open) {
        openByProd[pKey] = (openByProd[pKey] ?? 0) + qty;
      }
    }
  }

  // Pass 1: total demand reserved per raw material across ALL active product recipes
  const reservedByMaterialKey: Record<string, number> = {};
  for (const ing of recipes) {
    const pKey = normalizeNameKey(ing.productName);
    const countedQty = countedOrderedByProd[pKey] ?? 0;
    const needed = round2(ing.qtyPerUnit * countedQty);
    const inv = findLinkedInventoryItem(ing, inventory);
    const matKey = normalizeNameKey(inv?.name ?? ing.materialName);
    reservedByMaterialKey[matKey] = round2((reservedByMaterialKey[matKey] ?? 0) + needed);
  }

  const freeByMaterialKey: Record<string, number> = {};
  for (const inv of inventory) {
    const matKey = normalizeNameKey(inv.name);
    const reserved = reservedByMaterialKey[matKey] ?? 0;
    freeByMaterialKey[matKey] = round2(inv.stock - reserved);
  }

  // Pass 2: detailed per-ingredient metrics
  const ingredientMetricsById: Record<string, RecipeIngredientMetrics> = {};
  const recipesByProdKey: Record<string, RecipeIngredient[]> = {};

  for (const ing of recipes) {
    const pKey = normalizeNameKey(ing.productName);
    if (!recipesByProdKey[pKey]) recipesByProdKey[pKey] = [];
    recipesByProdKey[pKey].push(ing);

    const countedUnitsOrdered = countedOrderedByProd[pKey] ?? 0;
    const consumedUnitsSoFar = consumedByProd[pKey] ?? 0;
    const openUnitsDemand = openDeductedByProd[pKey] ?? 0;

    const neededForOrders = round2(ing.qtyPerUnit * countedUnitsOrdered);
    const consumedSoFar = round2(ing.qtyPerUnit * consumedUnitsSoFar);
    const neededForOpenOrders = round2(ing.qtyPerUnit * openUnitsDemand);

    const inv = findLinkedInventoryItem(ing, inventory);
    const matKey = normalizeNameKey(inv?.name ?? ing.materialName);
    const stockAvailable = inv ? round2(inv.stock) : 0;
    const totalReservedForMat = reservedByMaterialKey[matKey] ?? neededForOrders;
    const freeAfterOrders = inv ? round2(inv.stock - totalReservedForMat) : round2(-totalReservedForMat);

    const avgUnitCost =
      typeof ing.overrideUnitCost === 'number' && !Number.isNaN(ing.overrideUnitCost)
        ? round2(ing.overrideUnitCost)
        : typeof inv?.avgUnitCost === 'number' && !Number.isNaN(inv.avgUnitCost)
        ? round2(inv.avgUnitCost)
        : null;

    const lineCost = avgUnitCost !== null ? round2(ing.qtyPerUnit * avgUnitCost) : null;

    ingredientMetricsById[ing.id] = {
      countedUnitsOrdered,
      consumedUnitsSoFar,
      openUnitsDemand,
      neededForOrders,
      consumedSoFar,
      neededForOpenOrders,
      stockAvailable,
      freeAfterOrders,
      isShort: freeAfterOrders < 0,
      missingStockLink: !inv,
      avgUnitCost,
      lineCost,
      isCostKnown: avgUnitCost !== null,
    };
  }

  // Pass 3: product economics matching Products sheet
  const productEconomicsById: Record<string, ProductEconomics> = {};
  const productEconomicsByName: Record<string, ProductEconomics> = {};

  for (const prod of products) {
    const pKey = normalizeNameKey(prod.name);
    const prodRecipes = recipesByProdKey[pKey] ?? [];
    const hasRecipe = prodRecipes.length > 0;
    let costedIngredientCount = 0;
    let materialCostPerUnit = 0;
    let hasShortage = false;

    for (const ing of prodRecipes) {
      const m = ingredientMetricsById[ing.id];
      if (m?.isCostKnown && m.lineCost !== null) {
        costedIngredientCount += 1;
        materialCostPerUnit = round2(materialCostPerUnit + m.lineCost);
      }
      if (m?.isShort) {
        hasShortage = true;
      }
    }

    const costComplete = hasRecipe && costedIngredientCount === prodRecipes.length;
    const marginPerUnit = hasRecipe ? round2(prod.price - materialCostPerUnit) : null;
    const marginPct =
      hasRecipe && prod.price > 0
        ? round2(((prod.price - materialCostPerUnit) / prod.price) * 100)
        : null;

    const econ: ProductEconomics = {
      productId: prod.id,
      productName: prod.name,
      collection: prod.collection || prod.category || 'General',
      price: round2(prod.price),
      hasRecipe,
      ingredientCount: prodRecipes.length,
      costedIngredientCount,
      costComplete,
      materialCostPerUnit,
      marginPerUnit,
      marginPct,
      openUnits: openByProd[pKey] ?? 0,
      totalUnitsOrdered: totalOrderedByProd[pKey] ?? 0,
      totalRevenue: revenueByProd[pKey] ?? 0,
      hasShortage,
    };

    productEconomicsById[prod.id] = econ;
    productEconomicsByName[pKey] = econ;
  }

  return {
    ingredientMetricsById,
    productEconomicsById,
    productEconomicsByName,
    reservedByMaterialKey,
    freeByMaterialKey,
  };
}

/**
 * Computes spreadsheet row formulas for a single Order record:
 * - Total = sum(Qty * Unit Price)
 * - Balance Due = Total - Amount Received
 * - Payment = Paid | Partial | Unpaid
 * - Due Alert = Overdue | Due soon | '' (active for open orders only)
 * - Stock Check = OK | No recipe | Shortage | '-'
 */
export function computeOrderMetrics(
  order: Order,
  productEconomicsByName: Record<string, ProductEconomics>,
  todayYmd = getLocalTodayYmd()
): OrderComputedMetrics {
  const qty = order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const rawTotal =
    order.items.length > 0
      ? round2(order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0))
      : round2(order.totalAmount || 0);
  const unitPrice = qty > 0 ? round2(rawTotal / qty) : round2(order.items[0]?.unitPrice || 0);
  const advancePaid = round2(order.advancePaid || 0);
  const balanceDue = round2(rawTotal - advancePaid);

  const paymentState: OrderComputedMetrics['paymentState'] =
    advancePaid <= 0 ? 'Unpaid' : balanceDue <= 0 ? 'Paid' : 'Partial';

  const open = isOrderOpen(order.status);
  let dueAlert: OrderComputedMetrics['dueAlert'] = '';
  if (open && order.targetDeliveryDate) {
    const diff = diffCalendarDays(todayYmd, order.targetDeliveryDate);
    if (diff !== null) {
      if (diff < 0) dueAlert = 'Overdue';
      else if (diff <= 3) dueAlert = 'Due soon';
    }
  }

  const deductStock = order.deductStock !== false;
  let stockCheck: OrderComputedMetrics['stockCheck'] = '-';
  if (deductStock && order.status !== 'Cancelled') {
    if (order.items.length === 0) {
      stockCheck = 'No recipe';
    } else {
      let missingRecipe = false;
      let anyShortage = false;
      for (const item of order.items) {
        const econ = productEconomicsByName[normalizeNameKey(item.productName)];
        if (!econ || !econ.hasRecipe) {
          missingRecipe = true;
        } else if (econ.hasShortage) {
          anyShortage = true;
        }
      }
      if (missingRecipe) stockCheck = 'No recipe';
      else if (anyShortage) stockCheck = 'Shortage';
      else stockCheck = 'OK';
    }
  }

  return {
    qty,
    unitPrice,
    totalAmount: rawTotal,
    advancePaid,
    balanceDue,
    paymentState,
    isOpen: open,
    dueAlert,
    deductStock,
    stockCheck,
  };
}

/**
 * Aggregates KPI overview numbers across all Orders, matching the clean Excel summary card totals.
 */
export function computeOrderOverview(
  orders: Order[],
  productEconomicsByName: Record<string, ProductEconomics>,
  todayYmd = getLocalTodayYmd()
): OrderOverviewMetrics {
  const distinctGroups = new Set<string>();
  let totalOrderLines = 0;
  let totalOrderValue = 0;
  let totalReceived = 0;
  let totalBalanceDue = 0;
  let totalUnitsOrdered = 0;
  let openOrderLines = 0;
  let openUnitsCount = 0;
  let openBalanceDue = 0;
  let dueSoonCount = 0;
  let overdueCount = 0;
  let unpaidCount = 0;
  let partialCount = 0;
  let paidCount = 0;
  let missingRecipeOpenCount = 0;
  let shortageCount = 0;

  for (const order of orders) {
    if (order.status === 'Cancelled') continue;
    totalOrderLines += 1;
    distinctGroups.add(
      `${order.orderNumber.trim().toUpperCase()}__${normalizeNameKey(order.customerName)}__${order.createdAt}`
    );

    const m = computeOrderMetrics(order, productEconomicsByName, todayYmd);
    totalOrderValue = round2(totalOrderValue + m.totalAmount);
    totalReceived = round2(totalReceived + m.advancePaid);
    totalBalanceDue = round2(totalBalanceDue + m.balanceDue);
    totalUnitsOrdered += m.qty;

    if (m.paymentState === 'Unpaid') unpaidCount += 1;
    else if (m.paymentState === 'Partial') partialCount += 1;
    else paidCount += 1;

    if (m.isOpen) {
      openOrderLines += 1;
      openUnitsCount += m.qty;
      openBalanceDue = round2(openBalanceDue + Math.max(0, m.balanceDue));
      if (m.dueAlert === 'Due soon') dueSoonCount += 1;
      if (m.dueAlert === 'Overdue') overdueCount += 1;
      if (m.stockCheck === 'No recipe') missingRecipeOpenCount += 1;
    }
    if (m.stockCheck === 'Shortage') shortageCount += 1;
  }

  return {
    totalOrderLines,
    distinctOrdersCount: distinctGroups.size,
    totalOrderValue,
    totalReceived,
    totalBalanceDue,
    totalUnitsOrdered,
    openOrderLines,
    openUnitsCount,
    openBalanceDue,
    dueSoonCount,
    overdueCount,
    unpaidCount,
    partialCount,
    paidCount,
    missingRecipeOpenCount,
    shortageCount,
  };
}

/**
 * Aggregates Customer records directly from Orders so customer spend and counts stay in sync.
 */
export function buildCustomersFromOrders(orders: Order[], existingCustomers: Customer[] = []): Customer[] {
  const existingByKey = new Map<string, Customer>();
  for (const c of existingCustomers) {
    existingByKey.set(normalizeNameKey(c.name), c);
  }

  const map = new Map<
    string,
    {
      name: string;
      phone: string;
      email: string;
      orderGroups: Set<string>;
      totalSpent: number;
      lastOrderDate: string;
    }
  >();

  for (const order of orders) {
    if (order.status === 'Cancelled') continue;
    const key = normalizeNameKey(order.customerName);
    if (!key) continue;

    const lineTotal =
      order.items.length > 0
        ? round2(order.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0))
        : round2(order.totalAmount || 0);
    const groupKey = `${order.orderNumber.trim().toUpperCase()}__${order.createdAt}`;

    const prev = map.get(key);
    if (prev) {
      prev.orderGroups.add(groupKey);
      prev.totalSpent = round2(prev.totalSpent + lineTotal);
      if (!prev.phone && order.customerPhone) prev.phone = order.customerPhone;
      if (!prev.email && order.customerEmail) prev.email = order.customerEmail;
      if (order.createdAt && (!prev.lastOrderDate || order.createdAt > prev.lastOrderDate)) {
        prev.lastOrderDate = order.createdAt;
      }
    } else {
      map.set(key, {
        name: order.customerName.trim(),
        phone: order.customerPhone || '',
        email: order.customerEmail || '',
        orderGroups: new Set([groupKey]),
        totalSpent: lineTotal,
        lastOrderDate: order.createdAt || '',
      });
    }
  }

  const list: Customer[] = [];
  let idx = 1;
  for (const [key, entry] of map.entries()) {
    const prevCust = existingByKey.get(key);
    const orderCount = entry.orderGroups.size;
    const type: Customer['type'] =
      prevCust?.type ??
      (entry.totalSpent >= 3000 || orderCount >= 3 ? 'VIP' : 'Individual');

    list.push({
      id: prevCust?.id ?? `cust-sheet-${idx++}`,
      name: entry.name,
      phone: entry.phone || prevCust?.phone || '—',
      email: entry.email || prevCust?.email,
      city: prevCust?.city,
      totalOrders: orderCount,
      totalSpent: entry.totalSpent,
      type,
      lastOrderDate: entry.lastOrderDate || prevCust?.lastOrderDate,
    });
  }

  return list.sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Merges multi-line order rows that share Order No + Customer + Order Date into a single combined invoice view.
 */
export function buildCombinedInvoiceOrder(targetOrder: Order, allOrders: Order[]): Order {
  const key = `${targetOrder.orderNumber.trim().toUpperCase()}__${normalizeNameKey(targetOrder.customerName)}__${targetOrder.createdAt}`;
  const matching = allOrders.filter(
    (o) =>
      `${o.orderNumber.trim().toUpperCase()}__${normalizeNameKey(o.customerName)}__${o.createdAt}` === key &&
      o.status !== 'Cancelled'
  );

  if (matching.length <= 1) return targetOrder;

  const combinedItems = matching.flatMap((o) => o.items);
  const totalAmount = round2(combinedItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0));
  const advancePaid = round2(matching.reduce((s, o) => s + (o.advancePaid || 0), 0));
  const notes = matching
    .map((o) => o.notes?.trim())
    .filter(Boolean)
    .join(' • ');

  return {
    ...targetOrder,
    items: combinedItems,
    totalAmount,
    advancePaid,
    balanceDue: round2(totalAmount - advancePaid),
    notes: notes || targetOrder.notes,
  };
}

function csvCell(val: string | number | boolean | null | undefined): string {
  const str = val === null || val === undefined ? '' : String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportOrdersToCsv(
  orders: Order[],
  productEconomicsByName: Record<string, ProductEconomics>,
  todayYmd = getLocalTodayYmd()
): string {
  const header = [
    'Order No.',
    'Order Date',
    'Customer Name',
    'Phone',
    'Product / Item',
    'Qty',
    'Unit Price (Rs)',
    'Total (Rs)',
    'Status',
    'Due Date',
    'Delivered On',
    'Alert',
    'Amount Received (Rs)',
    'Balance Due (Rs)',
    'Payment',
    'Deduct Stock?',
    'Stock Check',
    'Customisation / Notes',
  ];

  const rows = orders.map((order) => {
    const m = computeOrderMetrics(order, productEconomicsByName, todayYmd);
    const prodLabel = order.items.map((it) => it.productName).join(' + ');
    return [
      order.orderNumber,
      order.createdAt,
      order.customerName,
      order.customerPhone ?? '',
      prodLabel,
      m.qty,
      m.unitPrice,
      m.totalAmount,
      order.status,
      order.targetDeliveryDate ?? '',
      order.deliveredOn ?? '',
      m.dueAlert,
      m.advancePaid,
      m.balanceDue,
      m.paymentState,
      m.deductStock ? 'Yes' : 'No',
      m.stockCheck,
      order.notes ?? '',
    ]
      .map(csvCell)
      .join(',');
  });

  return [header.map(csvCell).join(','), ...rows].join('\r\n');
}

export function exportRecipesToCsv(
  recipes: RecipeIngredient[],
  ingredientMetricsById: Record<string, RecipeIngredientMetrics>
): string {
  const header = [
    'Product',
    'Material Used',
    'Qty per Unit Sold',
    'Unit',
    'Units Ordered (Counted)',
    'Needed for Orders',
    'Available Stock',
    'Free After Orders',
    'Short?',
    'Avg Cost / Unit (Rs)',
    'Line Cost (Rs)',
  ];

  const rows = recipes.map((ing) => {
    const m = ingredientMetricsById[ing.id];
    return [
      ing.productName,
      ing.materialName,
      ing.qtyPerUnit,
      ing.unit,
      m?.countedUnitsOrdered ?? 0,
      m?.neededForOrders ?? 0,
      m?.stockAvailable ?? 0,
      m?.freeAfterOrders ?? 0,
      m?.isShort ? 'SHORT' : 'OK',
      m?.avgUnitCost ?? '',
      m?.lineCost ?? '',
    ]
      .map(csvCell)
      .join(',');
  });

  return [header.map(csvCell).join(','), ...rows].join('\r\n');
}
