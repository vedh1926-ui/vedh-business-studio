export type OrderStatus = string; // Driven dynamically by Master Lists (e.g. 'New', 'In Production', 'Ready', 'Delivered', 'Cancelled')

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerLocation?: string;
  items: OrderItem[];
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  shipping?: number;
  tax?: number;
  invoiceNumber?: string;
  status: OrderStatus;
  paymentMode?: string;
  createdAt: string;
  targetDeliveryDate?: string;
  deliveredOn?: string;
  deductStock?: boolean;
  notes?: string;
  occasion?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string; // Driven by Category master list
  collection?: string; // Driven by Products sheet Collection (e.g. 'Diya & Holder', 'Candle & Tealight')
  price: number;
  estimatedCost: number;
  stock: number;
  unit?: string; // Driven by Unit master list
  reorderLevel: number;
  status: 'Healthy' | 'Low' | 'Out of Stock';
  imageUrl?: string;
  description?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'Finished Good' | 'Raw Material' | 'Packaging';
  category?: string; // Driven by Category master list
  openingStock?: number | null; // Physical shelf count baseline (null/undefined = missing opening count)
  stock: number; // Computed Physical In Hand = (openingStock ?? 0) + received + adjustments
  unit: string; // Driven by Unit master list
  reorderLevel: number;
  avgUnitCost?: number; // Landed cost per unit (₹), synced from purchases or manually set
  purchaseSource?: string; // Vendor / purchase reference note
  status: 'Healthy' | 'Low' | 'Critical';
  supplier?: string;
  lastAdjustmentReason?: string; // Driven by Adjustment Reason master list
}

export interface StockAdjustment {
  id: string;
  date: string;
  materialId: string;
  materialName: string;
  delta: number;
  reason: string; // Breakage / wastage, Stock count correction, Sample / trial piece, Gift / free item, etc.
  notes?: string;
}

export interface InventoryLedgerMetrics {
  openingStock: number | null;
  receivedFromPurchases: number;
  adjustmentsTotal: number;
  physicalInHand: number;
  committedToOrders: number;
  freeAfterOrders: number;
  incomingFromPurchases: number;
  freeInclIncoming: number;
  needsOpeningCount: boolean;
  ledgerStatus: 'OK' | 'LOW' | 'Short - stock arriving' | 'SHORT' | 'Enter opening count';
  shortByAfterIncoming: number;
  recommendedOrderQty: number;
  estRestockCost: number | null;
}

export interface EnquiryItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface EnquiryMaterialRow {
  materialId: string;
  materialName: string;
  unit: string;
  neededForEnquiry: number;
  freeNow: number;
  leftAfterEnquiry: number;
  incoming: number;
  toBuy: number;
  avgUnitCost: number | null;
  estCost: number | null;
  status: 'OK' | 'ARRIVING' | 'BUY';
}

export interface EnquiryCheckResult {
  verdict: 'EMPTY' | 'YES' | 'OK_WITH_INCOMING' | 'BUY_FIRST' | 'MISSING_RECIPE';
  missingRecipeProducts: string[];
  rows: EnquiryMaterialRow[];
  totalEstBuyCost: number;
}

export interface RecipeIngredient {
  id: string;
  productId: string;
  productName: string;
  materialId: string;
  materialName: string;
  qtyPerUnit: number;
  unit: string;
  overrideUnitCost?: number;
  notes?: string;
}

export interface OrderComputedMetrics {
  qty: number;
  unitPrice: number;
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  paymentState: 'Paid' | 'Partial' | 'Unpaid';
  isOpen: boolean;
  dueAlert: 'Overdue' | 'Due soon' | '';
  deductStock: boolean;
  stockCheck: 'OK' | 'No recipe' | 'Shortage' | '-';
}

export interface OrderOverviewMetrics {
  totalOrderLines: number;
  distinctOrdersCount: number;
  totalOrderValue: number;
  totalReceived: number;
  totalBalanceDue: number;
  totalUnitsOrdered: number;
  openOrderLines: number;
  openUnitsCount: number;
  unitsToMake: number;
  unitsReadyWaitingDelivery: number;
  openBalanceDue: number;
  deliveredUnpaidAmount: number;
  dueSoonCount: number;
  overdueCount: number;
  unpaidCount: number;
  partialCount: number;
  paidCount: number;
  missingRecipeOpenCount: number;
  shortageCount: number;
}

export interface RecipeIngredientMetrics {
  countedUnitsOrdered: number;
  consumedUnitsSoFar: number;
  openUnitsDemand: number;
  neededForOrders: number;
  consumedSoFar: number;
  neededForOpenOrders: number;
  stockAvailable: number;
  freeAfterOrders: number;
  isShort: boolean;
  missingStockLink: boolean;
  avgUnitCost: number | null;
  lineCost: number | null;
  isCostKnown: boolean;
}

export interface ProductEconomics {
  productId: string;
  productName: string;
  collection: string;
  price: number;
  hasRecipe: boolean;
  ingredientCount: number;
  costedIngredientCount: number;
  costComplete: boolean;
  materialCostPerUnit: number;
  marginPerUnit: number | null;
  marginPct: number | null;
  openUnits: number;
  totalUnitsOrdered: number;
  totalRevenue: number;
  hasShortage: boolean;
}

export interface Expense {
  id: string;
  orderId?: string;
  platform?: string; // Driven by Platform Master List (e.g. Amazon, Meesho, Local market, Just Kraft)
  category: string; // Driven by Category master list
  title: string; // Item name
  dimensions?: string;
  qty?: number; // Packs / items bought
  piecesPerPack?: number; // Units per pack
  unitPrice?: number; // ₹ per pack/item
  shipping?: number; // Shipping / Other charges or adjustments (₹)
  amount: number; // Total Cost (₹) = qty * unitPrice + shipping
  date: string; // Order Date (YYYY-MM-DD)
  expectedDelivery?: string;
  actualDelivery?: string;
  supplierName?: string; // Vendor / Bill / Shop name
  paymentMode: string; // Driven by Payment Mode master list
  purchaseStatus?: string; // Driven by Purchase Status master list
  invoiceNo?: string;
  receiptFile?: string;
  receiptUrl?: string;
  receiptMediaId?: string;
  imageRef?: string;
  imageUrl?: string;
  imageMediaId?: string;
  contactDetails?: string;
  stockItem?: string;
  stockQtyReceived?: number;
  appliedToStock?: boolean;
  notes?: string;
}

export interface PurchaseRowMetrics {
  qty: number;
  piecesPerPack: number;
  unitPrice: number;
  shipping: number;
  subtotal: number;
  totalCost: number;
  totalUnits: number;
  costPerUnit: number;
  daysTaken: number | null;
  delayDays: number | null;
  isLate: boolean;
  isEarly: boolean;
  isInTransit: boolean;
  isProblemOrder: boolean;
}

export interface PlatformSummaryRow {
  platform: string;
  lineItems: number;
  totalSpend: number;
  avgDaysToDeliver: number | null;
  lateDeliveries: number;
  problemOrders: number;
  inTransitCount: number;
  sharePct: number;
  notes?: string;
}

export interface CategorySpendRow {
  category: string;
  lineItems: number;
  totalSpend: number;
  totalUnits: number;
  sharePct: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  totalOrders: number;
  totalSpent: number;
  type: 'Individual' | 'Corporate' | 'VIP';
  lastOrderDate?: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  phone: string;
  email?: string;
  city?: string;
  totalOrders: number;
  totalPaid: number;
}

export interface Payment {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  date: string;
  method: string; // Driven by Payment Mode master list
  status: 'Received' | 'Pending Verification';
}

export interface HistoryLog {
  id: string;
  category: 'All' | 'Product' | 'Order' | 'Recipe' | 'Inventory' | 'Expense' | 'Payment' | 'Customer' | 'Master List';
  description: string;
  timestamp: string;
}

export interface MasterListItem {
  id: string;
  label: string;
  isActive: boolean;
}

export interface MasterListGroup {
  id: string;
  key: string; // e.g. 'category', 'unit', 'payment_mode', 'order_status', 'purchase_status', 'yes_no', 'adjustment_reason'
  name: string; // Display name e.g. 'Category', 'Order Status'
  description: string; // Where it is used in the studio
  usedIn: string[]; // Tags showing connected modules e.g. ['Inventory', 'Expenses', 'Reports']
  items: MasterListItem[];
}

export type ActiveTab =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'recipe'
  | 'inventory'
  | 'invoices'
  | 'expenses'
  | 'customers'
  | 'suppliers'
  | 'payments'
  | 'reports'
  | 'master-lists'
  | 'settings'
  | 'history';
