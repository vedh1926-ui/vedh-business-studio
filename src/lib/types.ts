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
  items: OrderItem[];
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  status: OrderStatus;
  paymentMode?: string;
  createdAt: string;
  targetDeliveryDate?: string;
  notes?: string;
  occasion?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string; // Driven by Category master list or collection name
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
  stock: number;
  unit: string; // Driven by Unit master list
  reorderLevel: number;
  status: 'Healthy' | 'Low' | 'Critical';
  supplier?: string;
  lastAdjustmentReason?: string; // Driven by Adjustment Reason master list
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
  imageRef?: string;
  contactDetails?: string;
  stockItem?: string;
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
  category: 'All' | 'Product' | 'Order' | 'Expense' | 'Payment' | 'Customer' | 'Master List';
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
