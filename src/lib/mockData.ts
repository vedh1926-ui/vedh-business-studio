import {
  Product,
  Order,
  InventoryItem,
  Customer,
  Supplier,
  Expense,
  Payment,
  HistoryLog,
  MasterListGroup,
  RecipeIngredient,
  StockAdjustment,
} from './types';
import {
  initialPurchaseExpenses,
  initialSheetSuppliers,
} from './purchaseSheetSeed';
import {
  initialSheetAdjustments,
  initialSheetInventory,
  initialSheetOrders,
  initialSheetPayments,
  initialSheetProducts,
  initialSheetRecipes,
} from './oprSheetSeed';
import { buildCustomersFromOrders } from './oprFormulas';

const mkItems = (prefix: string, labels: string[]) =>
  labels.map((label, idx) => ({
    id: `${prefix}-${idx + 1}`,
    label,
    isActive: true,
  }));

export const initialMasterLists: MasterListGroup[] = [
  {
    id: 'ml-category',
    key: 'category',
    name: 'Category',
    description: 'Workshop raw materials, craft supplies, and product classification tags.',
    usedIn: ['Inventory', 'Products', 'Expenses', 'Reports'],
    items: mkItems('cat', [
      'Fabric',
      'Kundan / Stones / Beads',
      'Wax / Candles',
      'Candle Moulds',
      'Silicon Moulds',
      'Metal Holders',
      'Candle Holders',
      'Base Board / MDF',
      'Adhesives',
      'Packaging',
      'Powders / Colours',
      'Threads / Rolls',
      'Resin Supplies',
      'Resin Mould',
      'Art Supplies',
      'Tools',
      'Other',
    ]),
  },
  {
    id: 'ml-unit',
    key: 'unit',
    name: 'Unit',
    description: 'Measurement units for inventory stocks, raw materials, and packaging.',
    usedIn: ['Inventory', 'Products', 'Stock Adjustments'],
    items: mkItems('unit', [
      'pcs',
      'g',
      'kg',
      'ml',
      'm',
      'roll',
      'set',
      'inch',
      'cm',
      'pack',
    ]),
  },
  {
    id: 'ml-payment-mode',
    key: 'payment_mode',
    name: 'Payment Mode',
    description: 'Accepted modes for receiving customer payments and paying suppliers.',
    usedIn: ['Payments', 'Expenses', 'Orders', 'Reports'],
    items: mkItems('pay', [
      'UPI',
      'Cash',
      'Card',
      'Net Banking',
      'Cash on Delivery',
      'Other',
    ]),
  },
  {
    id: 'ml-order-status',
    key: 'order_status',
    name: 'Order Status',
    description: 'Lifecycle stages for tracking customer and bulk return-gift orders.',
    usedIn: ['Dashboard', 'Orders', 'Reports'],
    items: mkItems('ordstat', [
      'New',
      'In Production',
      'Ready',
      'Delivered',
      'Cancelled',
    ]),
  },
  {
    id: 'ml-purchase-status',
    key: 'purchase_status',
    name: 'Purchase Status',
    description: 'Delivery and tracking statuses for workshop supply purchases & procurement.',
    usedIn: ['Expenses', 'Suppliers', 'Reports'],
    items: mkItems('purstat', [
      'Ordered',
      'Shipped',
      'Delayed',
      'Delivered',
      'Self Pick-Up',
      'Rapido',
      'Replaced',
      'Returned',
      'Refund Pending',
      'Cancelled',
    ]),
  },
  {
    id: 'ml-platform',
    key: 'platform',
    name: 'Platform / Source',
    description: 'Marketplaces, online portals, and offline wholesale markets tracked in Purchases & Platform Summary.',
    usedIn: ['Dashboard', 'Expenses', 'Suppliers', 'Reports'],
    items: mkItems('plat', [
      'Amazon',
      'Meesho',
      'CSC',
      'Bakematic Digital PvtLtd',
      'Local market',
      'Outstation Market',
      'Luxury Deco',
      'Just Kraft',
      'Flipkart',
      'IndiaMART',
    ]),
  },
  {
    id: 'ml-yes-no',
    key: 'yes_no',
    name: 'Yes/No',
    description: 'Standard boolean conditional options used in operational forms and filters.',
    usedIn: ['Settings', 'Reports', 'Forms'],
    items: mkItems('yn', ['Yes', 'No']),
  },
  {
    id: 'ml-adjustment-reason',
    key: 'adjustment_reason',
    name: 'Adjustment Reason',
    description: 'Conditional reasons required when increasing or deducting workshop stock.',
    usedIn: ['Inventory', 'History', 'Reports'],
    items: mkItems('adj', [
      'Breakage / wastage',
      'Stock count correction',
      'Sample / trial piece',
      'Gift / free item',
      'Other',
    ]),
  },
];

export const initialProducts: Product[] = initialSheetProducts;

export const initialOrders: Order[] = initialSheetOrders;

export const initialInventory: InventoryItem[] = initialSheetInventory;

export const initialAdjustments: StockAdjustment[] = initialSheetAdjustments;

export const initialRecipes: RecipeIngredient[] = initialSheetRecipes;

export const initialCustomers: Customer[] = buildCustomersFromOrders(initialSheetOrders);

export const initialSuppliers: Supplier[] = initialSheetSuppliers;

export const initialExpenses: Expense[] = initialPurchaseExpenses;

export const initialPayments: Payment[] = initialSheetPayments;

export const initialHistory: HistoryLog[] = [
  {
    id: 'hist-1',
    category: 'Order',
    description: 'Imported 43 order lines (22 customer orders, ₹28,400 total value, 17 open units)',
    timestamp: '2026-11-11 09:00',
  },
  {
    id: 'hist-2',
    category: 'Product',
    description: 'Synced 31 catalog products across 10 collections with live margin & open-demand tracking',
    timestamp: '2026-11-11 09:00',
  },
  {
    id: 'hist-3',
    category: 'Recipe',
    description: 'Imported 23 recipe ingredient lines across 3 products & linked Purchase landed unit costs',
    timestamp: '2026-11-11 09:00',
  },
  {
    id: 'hist-4',
    category: 'Expense',
    description: 'Synced 131 procurement purchases (₹34,831.25) across 15 platforms/vendors',
    timestamp: '2026-11-11 09:00',
  },
];
