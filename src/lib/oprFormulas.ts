import {
  Customer,
  EnquiryCheckResult,
  EnquiryItem,
  EnquiryMaterialRow,
  Expense,
  InventoryItem,
  InventoryLedgerMetrics,
  Order,
  OrderComputedMetrics,
  OrderOverviewMetrics,
  Product,
  ProductEconomics,
  RecipeIngredient,
  RecipeIngredientMetrics,
  StockAdjustment,
  Supplier,
} from './types';
import {
  computePurchaseRowMetrics,
  diffCalendarDays,
  IN_TRANSIT_PURCHASE_STATUSES,
  PROBLEM_PURCHASE_STATUSES,
  RECEIVED_STOCK_PURCHASE_STATUSES,
} from './purchaseFormulas';
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

function resolvePurchaseUnits(exp: Expense): number {
  if (typeof exp.stockQtyReceived === 'number' && !Number.isNaN(exp.stockQtyReceived) && exp.stockQtyReceived > 0) {
    return round2(exp.stockQtyReceived);
  }
  const qty = Number(exp.qty) || 0;
  const pack = Number(exp.piecesPerPack) || 1;
  return round2(qty * (pack > 0 ? pack : 1));
}

export interface PurchaseAndAdjustmentFlow {
  receivedByKey: Record<string, number>;
  incomingByKey: Record<string, number>;
  adjustmentsByKey: Record<string, number>;
}

/**
 * Aggregates post-count received stock, incoming shipments (Ordered/Shipped/Delayed),
 * and manual Stock Adjustments per normalized material key.
 */
export function computePurchaseAndAdjustmentFlow(
  expenses: Expense[] = [],
  adjustments: StockAdjustment[] = [],
  inventory: InventoryItem[] = []
): PurchaseAndAdjustmentFlow {
  const receivedByKey: Record<string, number> = {};
  const incomingByKey: Record<string, number> = {};
  const adjustmentsByKey: Record<string, number> = {};
  const invIdToKey = new Map(inventory.map((i) => [i.id, normalizeNameKey(i.name)]));

  for (const exp of expenses) {
    const matKey = normalizeNameKey(exp.stockItem);
    if (!matKey) continue;
    const units = resolvePurchaseUnits(exp);
    if (units <= 0) continue;

    const status = (exp.purchaseStatus ?? 'Delivered').trim();
    if (IN_TRANSIT_PURCHASE_STATUSES.includes(status)) {
      incomingByKey[matKey] = round2((incomingByKey[matKey] ?? 0) + units);
    } else if (exp.appliedToStock === true && RECEIVED_STOCK_PURCHASE_STATUSES.includes(status)) {
      receivedByKey[matKey] = round2((receivedByKey[matKey] ?? 0) + units);
    }
  }

  for (const adj of adjustments) {
    const matKey = invIdToKey.get(adj.materialId) ?? normalizeNameKey(adj.materialName);
    if (!matKey) continue;
    const delta = Number(adj.delta) || 0;
    adjustmentsByKey[matKey] = round2((adjustmentsByKey[matKey] ?? 0) + delta);
  }

  return { receivedByKey, incomingByKey, adjustmentsByKey };
}

/**
 * Computes effective Physical In Hand = Opening Count + Received (post-count purchases) + Adjustments.
 * Falls back to `inv.stock` when `openingStock` is undefined for backward compatibility.
 */
export function resolveEffectivePhysicalStock(
  inv: InventoryItem,
  flow: PurchaseAndAdjustmentFlow
): number {
  const matKey = normalizeNameKey(inv.name);
  const opening = inv.openingStock === undefined ? inv.stock : inv.openingStock ?? 0;
  const received = flow.receivedByKey[matKey] ?? 0;
  const adj = flow.adjustmentsByKey[matKey] ?? 0;
  return round2(opening + received + adj);
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
    const units = resolvePurchaseUnits(exp);
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
 * and product margins across Orders + Products + Recipes + Inventory (+ Purchases & Adjustments).
 */
export function computeRecipeAndProductSnapshot(
  products: Product[],
  recipes: RecipeIngredient[],
  orders: Order[],
  inventory: InventoryItem[],
  expenses: Expense[] = [],
  adjustments: StockAdjustment[] = []
): RecipeSystemSnapshot {
  const flow = computePurchaseAndAdjustmentFlow(expenses, adjustments, inventory);
  const physicalByMatKey: Record<string, number> = {};
  for (const inv of inventory) {
    physicalByMatKey[normalizeNameKey(inv.name)] = resolveEffectivePhysicalStock(inv, flow);
  }
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
    const physical = physicalByMatKey[matKey] ?? inv.stock;
    freeByMaterialKey[matKey] = round2(physical - reserved);
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
    const stockAvailable = inv ? round2(physicalByMatKey[matKey] ?? inv.stock) : 0;
    const totalReservedForMat = reservedByMaterialKey[matKey] ?? neededForOrders;
    const freeAfterOrders = inv ? round2(stockAvailable - totalReservedForMat) : round2(-totalReservedForMat);

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
  let unitsToMake = 0;
  let unitsReadyWaitingDelivery = 0;
  let openBalanceDue = 0;
  let deliveredUnpaidAmount = 0;
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

    if (order.status === 'New' || order.status === 'In Production') {
      unitsToMake += m.qty;
    } else if (order.status === 'Ready') {
      unitsReadyWaitingDelivery += m.qty;
    } else if (order.status === 'Delivered' && m.balanceDue > 0) {
      deliveredUnpaidAmount = round2(deliveredUnpaidAmount + m.balanceDue);
    }

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
    unitsToMake,
    unitsReadyWaitingDelivery,
    openBalanceDue,
    deliveredUnpaidAmount,
    dueSoonCount,
    overdueCount,
    unpaidCount,
    partialCount,
    paidCount,
    missingRecipeOpenCount,
    shortageCount,
  };
}

export interface ShoppingListEntry {
  item: InventoryItem;
  ledger: InventoryLedgerMetrics;
}

export interface InventoryLedgerSummary {
  ledgerById: Record<string, InventoryLedgerMetrics>;
  ledgerByMaterialKey: Record<string, InventoryLedgerMetrics>;
  shoppingList: ShoppingListEntry[];
  missingOpeningCount: number;
  shortCount: number;
  shortArrivingCount: number;
  lowCount: number;
}

/**
 * Full workbook Stock ledger engine:
 * Physical In Hand = Opening + Received (post-count purchases) + Adjustments
 * Free After Orders = Physical In Hand - Committed to Orders
 * Free Incl. Incoming = Free After Orders + On Order (Ordered/Shipped/Delayed purchases)
 */
export function computeInventoryLedgerMetrics(
  inventory: InventoryItem[],
  recipes: RecipeIngredient[],
  orders: Order[],
  expenses: Expense[] = [],
  adjustments: StockAdjustment[] = [],
  products: Product[] = []
): InventoryLedgerSummary {
  const flow = computePurchaseAndAdjustmentFlow(expenses, adjustments, inventory);
  const snapshot = computeRecipeAndProductSnapshot(products, recipes, orders, inventory, expenses, adjustments);

  const ledgerById: Record<string, InventoryLedgerMetrics> = {};
  const ledgerByMaterialKey: Record<string, InventoryLedgerMetrics> = {};
  const shoppingList: ShoppingListEntry[] = [];

  let missingOpeningCount = 0;
  let shortCount = 0;
  let shortArrivingCount = 0;
  let lowCount = 0;

  for (const inv of inventory) {
    const matKey = normalizeNameKey(inv.name);
    const needsOpeningCount = inv.openingStock === null;
    const openingStock = inv.openingStock === undefined ? inv.stock : inv.openingStock;
    const receivedFromPurchases = flow.receivedByKey[matKey] ?? 0;
    const adjustmentsTotal = flow.adjustmentsByKey[matKey] ?? 0;
    const physicalInHand = resolveEffectivePhysicalStock(inv, flow);
    const committedToOrders = snapshot.reservedByMaterialKey[matKey] ?? 0;
    const freeAfterOrders = round2(physicalInHand - committedToOrders);
    const incomingFromPurchases = flow.incomingByKey[matKey] ?? 0;
    const freeInclIncoming = round2(freeAfterOrders + incomingFromPurchases);

    if (needsOpeningCount) missingOpeningCount += 1;

    let ledgerStatus: InventoryLedgerMetrics['ledgerStatus'];
    if (freeAfterOrders < 0 && freeInclIncoming >= 0) {
      ledgerStatus = 'Short - stock arriving';
      shortArrivingCount += 1;
    } else if (freeAfterOrders < 0) {
      ledgerStatus = 'SHORT';
      shortCount += 1;
    } else if (needsOpeningCount) {
      ledgerStatus = 'Enter opening count';
    } else if (inv.reorderLevel > 0 && freeInclIncoming <= inv.reorderLevel) {
      ledgerStatus = 'LOW';
      lowCount += 1;
    } else {
      ledgerStatus = 'OK';
    }

    const shortByAfterIncoming = round2(Math.max(0, -freeInclIncoming));
    const recommendedOrderQty =
      ledgerStatus === 'SHORT'
        ? round2(Math.max(shortByAfterIncoming, (inv.reorderLevel || 0) - freeInclIncoming))
        : ledgerStatus === 'LOW'
        ? round2(Math.max(0, (inv.reorderLevel || 0) - freeInclIncoming))
        : 0;
    const estRestockCost =
      recommendedOrderQty > 0 && typeof inv.avgUnitCost === 'number' && !Number.isNaN(inv.avgUnitCost)
        ? round2(recommendedOrderQty * inv.avgUnitCost)
        : null;

    const ledger: InventoryLedgerMetrics = {
      openingStock,
      receivedFromPurchases,
      adjustmentsTotal,
      physicalInHand,
      committedToOrders,
      freeAfterOrders,
      incomingFromPurchases,
      freeInclIncoming,
      needsOpeningCount,
      ledgerStatus,
      shortByAfterIncoming,
      recommendedOrderQty,
      estRestockCost,
    };

    ledgerById[inv.id] = ledger;
    ledgerByMaterialKey[matKey] = ledger;

    if (ledgerStatus === 'SHORT' || ledgerStatus === 'Short - stock arriving' || ledgerStatus === 'LOW') {
      shoppingList.push({ item: inv, ledger });
    }
  }

  const priorityOrder: Record<InventoryLedgerMetrics['ledgerStatus'], number> = {
    SHORT: 0,
    'Short - stock arriving': 1,
    LOW: 2,
    'Enter opening count': 3,
    OK: 4,
  };
  shoppingList.sort(
    (a, b) =>
      priorityOrder[a.ledger.ledgerStatus] - priorityOrder[b.ledger.ledgerStatus] ||
      a.item.name.localeCompare(b.item.name)
  );

  return {
    ledgerById,
    ledgerByMaterialKey,
    shoppingList,
    missingOpeningCount,
    shortCount,
    shortArrivingCount,
    lowCount,
  };
}

/**
 * Evaluates "Can I accept this order?" for a prospective customer enquiry without mutating
 * real inventory or saved orders. Deduplicates materials shared across multiple products cleanly.
 */
export function evaluateOrderEnquiry(
  enquiryItems: EnquiryItem[],
  products: Product[],
  recipes: RecipeIngredient[],
  ledgerByMaterialKey: Record<string, InventoryLedgerMetrics>,
  inventory: InventoryItem[]
): EnquiryCheckResult {
  const activeItems = enquiryItems.filter((item) => (item.productId || item.productName) && item.quantity > 0);
  if (activeItems.length === 0) {
    return {
      verdict: 'EMPTY',
      missingRecipeProducts: [],
      rows: [],
      totalEstBuyCost: 0,
    };
  }

  const prodById = new Map(products.map((p) => [p.id, p]));
  const invByKey = new Map(inventory.map((i) => [normalizeNameKey(i.name), i]));

  const missingRecipeProducts: string[] = [];
  const neededAcc = new Map<
    string,
    { materialId: string; materialName: string; unit: string; needed: number; inv?: InventoryItem }
  >();

  for (const item of activeItems) {
    const resolvedName = prodById.get(item.productId)?.name || item.productName;
    const pKey = normalizeNameKey(resolvedName);
    const prodRecipes = recipes.filter((r) => normalizeNameKey(r.productName) === pKey);

    if (prodRecipes.length === 0) {
      if (resolvedName && !missingRecipeProducts.includes(resolvedName)) {
        missingRecipeProducts.push(resolvedName);
      }
      continue;
    }

    for (const ing of prodRecipes) {
      const inv = findLinkedInventoryItem(ing, inventory);
      const canonicalName = inv?.name ?? ing.materialName;
      const matKey = normalizeNameKey(canonicalName);
      const qtyNeeded = round2(ing.qtyPerUnit * item.quantity);

      const existing = neededAcc.get(matKey);
      if (existing) {
        existing.needed = round2(existing.needed + qtyNeeded);
      } else {
        neededAcc.set(matKey, {
          materialId: inv?.id ?? ing.materialId,
          materialName: canonicalName,
          unit: inv?.unit ?? ing.unit,
          needed: qtyNeeded,
          inv: inv ?? invByKey.get(matKey),
        });
      }
    }
  }

  const rows: EnquiryMaterialRow[] = [];
  let totalEstBuyCost = 0;
  let anyBuy = false;
  let anyArriving = false;

  for (const [matKey, entry] of neededAcc.entries()) {
    const ledger = ledgerByMaterialKey[matKey];
    const freeNow = ledger ? ledger.freeAfterOrders : round2(entry.inv?.stock ?? 0);
    const incoming = ledger ? ledger.incomingFromPurchases : 0;
    const leftAfterEnquiry = round2(freeNow - entry.needed);

    let status: EnquiryMaterialRow['status'] = 'OK';
    let toBuy = 0;
    if (leftAfterEnquiry < 0) {
      toBuy = round2(Math.max(0, -(leftAfterEnquiry + incoming)));
      if (toBuy > 0) {
        status = 'BUY';
        anyBuy = true;
      } else {
        status = 'ARRIVING';
        anyArriving = true;
      }
    }

    const avgUnitCost =
      typeof entry.inv?.avgUnitCost === 'number' && !Number.isNaN(entry.inv.avgUnitCost)
        ? round2(entry.inv.avgUnitCost)
        : null;
    const estCost = toBuy > 0 && avgUnitCost !== null ? round2(toBuy * avgUnitCost) : null;
    if (estCost !== null) {
      totalEstBuyCost = round2(totalEstBuyCost + estCost);
    }

    rows.push({
      materialId: entry.materialId,
      materialName: entry.materialName,
      unit: entry.unit,
      neededForEnquiry: entry.needed,
      freeNow,
      leftAfterEnquiry,
      incoming,
      toBuy,
      avgUnitCost,
      estCost,
      status,
    });
  }

  const rowPriority: Record<EnquiryMaterialRow['status'], number> = {
    BUY: 0,
    ARRIVING: 1,
    OK: 2,
  };
  rows.sort((a, b) => rowPriority[a.status] - rowPriority[b.status] || a.materialName.localeCompare(b.materialName));

  let verdict: EnquiryCheckResult['verdict'];
  if (anyBuy) {
    verdict = 'BUY_FIRST';
  } else if (anyArriving) {
    verdict = 'OK_WITH_INCOMING';
  } else if (missingRecipeProducts.length > 0 && rows.length === 0) {
    verdict = 'MISSING_RECIPE';
  } else if (missingRecipeProducts.length > 0) {
    verdict = 'MISSING_RECIPE';
  } else {
    verdict = 'YES';
  }

  return {
    verdict,
    missingRecipeProducts,
    rows,
    totalEstBuyCost,
  };
}

const INVOICE_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function extractAddressFromNotes(notes?: string): string {
  if (!notes) return '';
  const m = notes.match(/(?:^|[,\n|•]\s*)(?:delivery\s*)?address\s*[:\-]\s*(.+)$/i);
  if (m?.[1]) return m[1].trim();
  return '';
}

export function extractOrderLocation(order: Order, customers: Customer[] = []): string {
  if (order.customerLocation?.trim()) return order.customerLocation.trim();
  const matchedCustomer = customers.find(
    (c) => normalizeNameKey(c.name) === normalizeNameKey(order.customerName)
  );
  if (matchedCustomer?.city?.trim()) return matchedCustomer.city.trim();
  const fromNotes = extractAddressFromNotes(order.notes);
  if (fromNotes) return fromNotes;
  const occMatch = order.occasion?.match(/\(([^)]+)\)\s*$/);
  if (occMatch?.[1]?.trim()) return occMatch[1].trim();
  return '';
}

export function formatInvoiceNumber(order: Pick<Order, 'orderNumber' | 'invoiceNumber'>): string {
  if (order.invoiceNumber?.trim()) return order.invoiceNumber.trim();
  const raw = (order.orderNumber || '').trim();
  if (!raw) return '#001';
  if (raw.startsWith('#')) return raw;
  const ordMatch = raw.match(/^ORD[-_ ]*(.+)$/i);
  if (ordMatch?.[1]) return `#${ordMatch[1].trim()}`;
  return `#${raw}`;
}

export function formatInvoiceDisplayDate(ymd?: string): string {
  if (!ymd) return '';
  const trimmed = ymd.trim();
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return trimmed;
  const year = m[1];
  const monthIdx = parseInt(m[2], 10) - 1;
  const day = m[3];
  const monthLabel = INVOICE_MONTHS[monthIdx];
  if (!monthLabel) return trimmed;
  return `${monthLabel}, ${day} ${year}`;
}

export function normalizeInstagramHandle(raw?: string): string {
  const cleaned = (raw || '')
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/.*$/, '')
    .replace(/^@+/, '')
    .trim();
  return cleaned ? `@${cleaned}` : '';
}

export function getInstagramProfileUrl(handle?: string): string | null {
  const normalized = normalizeInstagramHandle(handle);
  if (!normalized) return null;
  return `https://www.instagram.com/${encodeURIComponent(normalized.slice(1))}/`;
}

export function getWhatsAppChatUrl(phone?: string): string | null {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  const normalizedDigits = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${normalizedDigits}`;
}

function cleanCustomerPhone(value?: string): string {
  const v = (value || '').trim();
  return v && v !== '—' && v !== '-' ? v : '';
}

/**
 * Aggregates Customer records directly from Orders while preserving manual CRM customers
 * (including prospects with 0 orders) and custom social/contact/preference metadata.
 */
export function buildCustomersFromOrders(orders: Order[], existingCustomers: Customer[] = []): Customer[] {
  const existingByKey = new Map<string, Customer>();
  for (const c of existingCustomers) {
    const key = normalizeNameKey(c.name);
    if (key) existingByKey.set(key, c);
  }

  const map = new Map<
    string,
    {
      name: string;
      phone: string;
      email: string;
      city: string;
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
    const resolvedLocation =
      order.customerLocation?.trim() || extractAddressFromNotes(order.notes);
    const orderPhone = cleanCustomerPhone(order.customerPhone);
    const orderEmail = (order.customerEmail || '').trim();

    const prev = map.get(key);
    if (prev) {
      prev.orderGroups.add(groupKey);
      prev.totalSpent = round2(prev.totalSpent + lineTotal);
      if (orderPhone) prev.phone = orderPhone;
      if (orderEmail) prev.email = orderEmail;
      if (resolvedLocation) prev.city = resolvedLocation;
      if (order.createdAt && (!prev.lastOrderDate || order.createdAt > prev.lastOrderDate)) {
        prev.lastOrderDate = order.createdAt;
      }
    } else {
      map.set(key, {
        name: order.customerName.trim(),
        phone: orderPhone,
        email: orderEmail,
        city: resolvedLocation || '',
        orderGroups: new Set([groupKey]),
        totalSpent: lineTotal,
        lastOrderDate: order.createdAt || '',
      });
    }
  }

  const list: Customer[] = [];
  const seenKeys = new Set<string>();
  let idx = 1;

  for (const [key, entry] of map.entries()) {
    seenKeys.add(key);
    const prevCust = existingByKey.get(key);
    const orderCount = entry.orderGroups.size;
    const type: Customer['type'] =
      prevCust?.type ??
      (entry.totalSpent >= 3000 || orderCount >= 3 ? 'VIP' : 'Individual');

    const prevPhone = cleanCustomerPhone(prevCust?.phone);
    list.push({
      ...(prevCust || {}),
      id: prevCust?.id ?? `cust-sheet-${idx++}`,
      name: prevCust?.name?.trim() || entry.name,
      phone: prevPhone || entry.phone || '—',
      email: prevCust?.email?.trim() || entry.email || undefined,
      city: prevCust?.city?.trim() || entry.city || undefined,
      totalOrders: orderCount,
      totalSpent: entry.totalSpent,
      type,
      lastOrderDate: entry.lastOrderDate || prevCust?.lastOrderDate,
    });
  }

  // Keep manually added customers who do not yet have any non-cancelled orders
  for (const cust of existingCustomers) {
    const key = normalizeNameKey(cust.name);
    if (!key || seenKeys.has(key)) continue;
    seenKeys.add(key);
    list.push({
      ...cust,
      phone: cleanCustomerPhone(cust.phone) || '—',
      totalOrders: 0,
      totalSpent: 0,
    });
  }

  return list.sort((a, b) => {
    if (b.totalSpent !== a.totalSpent) return b.totalSpent - a.totalSpent;
    return a.name.localeCompare(b.name);
  });
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
  const shipping = matching.find((o) => typeof o.shipping === 'number')?.shipping;
  const tax = matching.find((o) => typeof o.tax === 'number')?.tax;
  const invoiceNumber =
    matching.find((o) => o.invoiceNumber?.trim())?.invoiceNumber || targetOrder.invoiceNumber;
  const customerPhone =
    matching.find((o) => o.customerPhone?.trim())?.customerPhone || targetOrder.customerPhone;
  const customerEmail =
    matching.find((o) => o.customerEmail?.trim())?.customerEmail || targetOrder.customerEmail;
  const customerLocation =
    matching.find((o) => o.customerLocation?.trim())?.customerLocation ||
    targetOrder.customerLocation;
  const deliveredDates = matching
    .map((o) => o.deliveredOn)
    .filter((d): d is string => Boolean(d))
    .sort();
  const targetDates = matching
    .map((o) => o.targetDeliveryDate)
    .filter((d): d is string => Boolean(d))
    .sort();
  const notes = Array.from(
    new Set(matching.map((o) => o.notes?.trim()).filter((n): n is string => Boolean(n)))
  ).join(' • ');

  return {
    ...targetOrder,
    customerPhone,
    customerEmail,
    customerLocation,
    invoiceNumber,
    shipping,
    tax,
    deliveredOn: deliveredDates.at(-1) || targetOrder.deliveredOn,
    targetDeliveryDate: targetDates.at(-1) || targetOrder.targetDeliveryDate,
    items: combinedItems,
    totalAmount,
    advancePaid,
    balanceDue: round2(totalAmount - advancePaid),
    notes: notes || targetOrder.notes,
  };
}

/**
 * Groups multi-line customer orders into unique invoices for the Invoices module.
 */
export function buildGroupedInvoices(orders: Order[]): Order[] {
  const seen = new Set<string>();
  const grouped: Order[] = [];

  for (const order of orders) {
    if (order.status === 'Cancelled') continue;
    const key = `${order.orderNumber.trim().toUpperCase()}__${normalizeNameKey(order.customerName)}__${order.createdAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    grouped.push(buildCombinedInvoiceOrder(order, orders));
  }

  return grouped;
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

const KNOWN_SUPPLIER_ALIASES: Record<string, string[]> = {
  'sup-amazon': ['amazon'],
  'sup-meesho': ['meesho'],
  'sup-justkraft': ['just kraft'],
  'sup-shanti': ['shanti novelties', 'outstation market'],
  'sup-csc': ['csc craft'],
  'sup-bakematic': ['bakematic'],
  'sup-nandiarts': ['nandiarts'],
  'sup-begum-packing': ['bhagwan das', 'begum bazaar packing'],
  'sup-bhavani': ['bhavani retail'],
  'sup-giftinghouse': ['giftinghouse', 'the giftinghouse'],
  'sup-tilakchand': ['tilak chand'],
  'sup-bhagwanlal': ['bhagwanlal'],
  'sup-luxurydeco': ['luxury deco'],
  'sup-runicha': ['runicha'],
  'sup-mschem': ['m/s chem', 'chem soy wax'],
};

export function normalizeWebsiteUrl(raw?: string): string | null {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes('.')) return `https://${trimmed}`;
  return null;
}

/**
 * Matches Expenses / Purchase ledger entries linked to a Supplier record using exact name,
 * normalized prefix (stripping parenthetical notes), custom aliases, and known seeded aliases.
 */
export function matchSupplierExpenses(supplier: Supplier, expenses: Expense[]): Expense[] {
  const baseName = normalizeNameKey(supplier.name);
  const strippedName = normalizeNameKey(supplier.name.replace(/\([^)]*\)/g, ''));
  const customAliases = (supplier.platformAlias || '')
    .split(',')
    .map((s) => normalizeNameKey(s))
    .filter((s) => s.length >= 2);
  const seededAliases = KNOWN_SUPPLIER_ALIASES[supplier.id] || [];

  const tokens = Array.from(
    new Set([baseName, strippedName, ...customAliases, ...seededAliases].filter((t) => t.length >= 2))
  );
  if (tokens.length === 0) return [];

  return expenses
    .filter((exp) => {
      const supField = normalizeNameKey(exp.supplierName);
      const platField = normalizeNameKey(exp.platform);
      return tokens.some(
        (tok) =>
          supField === tok ||
          platField === tok ||
          (tok.length >= 4 && (supField.includes(tok) || platField.includes(tok)))
      );
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export interface SupplierComputedMetrics {
  matchedExpenses: Expense[];
  lineCount: number;
  distinctOrders: number;
  liveSpend: number;
  displayOrders: number;
  displayPaid: number;
  inTransitCount: number;
  avgDaysToDeliver: number | null;
  lastPurchaseDate: string;
}

export function computeSupplierMetrics(
  supplier: Supplier,
  expenses: Expense[]
): SupplierComputedMetrics {
  const matched = matchSupplierExpenses(supplier, expenses);
  const problemSet = new Set(PROBLEM_PURCHASE_STATUSES.map((s) => s.toLowerCase()));
  const transitSet = new Set(IN_TRANSIT_PURCHASE_STATUSES.map((s) => s.toLowerCase()));

  let liveSpend = 0;
  let inTransitCount = 0;
  let daysSum = 0;
  let daysCount = 0;
  const orderKeys = new Set<string>();
  let lastPurchaseDate = '';

  for (const exp of matched) {
    const metrics = computePurchaseRowMetrics(exp);
    const st = (exp.purchaseStatus || '').trim().toLowerCase();
    const isProblem = problemSet.has(st);

    if (!isProblem) {
      liveSpend = round2(liveSpend + metrics.totalCost);
    }
    if (transitSet.has(st)) {
      inTransitCount += 1;
    }
    if (metrics.daysTaken !== null && metrics.daysTaken >= 0) {
      daysSum += metrics.daysTaken;
      daysCount += 1;
    }
    const oKey = (exp.orderId || exp.invoiceNo || exp.id).trim().toLowerCase();
    if (oKey) orderKeys.add(oKey);
    if (exp.date && (!lastPurchaseDate || exp.date > lastPurchaseDate)) {
      lastPurchaseDate = exp.date;
    }
  }

  const hasLive = matched.length > 0;
  return {
    matchedExpenses: matched,
    lineCount: matched.length,
    distinctOrders: orderKeys.size,
    liveSpend,
    displayOrders: hasLive ? matched.length : supplier.totalOrders || 0,
    displayPaid: hasLive ? liveSpend : supplier.totalPaid || 0,
    inTransitCount,
    avgDaysToDeliver: daysCount > 0 ? round2(daysSum / daysCount) : null,
    lastPurchaseDate,
  };
}
