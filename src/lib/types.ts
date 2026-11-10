export type OrderStatus = 'Inquiry' | 'Production' | 'Ready' | 'Dispatched' | 'Delivered' | 'Cancelled';

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
  createdAt: string;
  targetDeliveryDate?: string;
  notes?: string;
  occasion?: string; // e.g. Diwali Corporate Gift, Wedding Return Gifts, Housewarming
}

export interface Product {
  id: string;
  name: string;
  category: 'Candles' | 'Resin Coasters' | 'Embroidery' | 'Gift Hampers' | 'Custom';
  price: number;
  estimatedCost: number;
  stock: number;
  reorderLevel: number;
  status: 'Healthy' | 'Low' | 'Out of Stock';
  imageUrl?: string;
  description?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'Finished Good' | 'Raw Material' | 'Packaging';
  stock: number;
  unit: string; // e.g., 'units', 'kg', 'liters', 'pieces'
  reorderLevel: number;
  status: 'Healthy' | 'Low' | 'Critical';
  supplier?: string;
}

export interface Expense {
  id: string;
  category: 'Raw Materials' | 'Packaging' | 'Courier / Logistics' | 'Marketing' | 'Tools & Molds' | 'Other';
  title: string;
  amount: number;
  date: string;
  supplierName?: string;
  paymentMode: 'UPI' | 'Bank Transfer' | 'Cash' | 'Card';
  notes?: string;
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
  category: 'Wax & Fragrance' | 'Resin & Hardener' | 'Gift Boxes & Packaging' | 'Embroidery Materials' | 'General';
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
  method: 'UPI / GPay / PhonePe' | 'Bank Transfer' | 'Cash' | 'Card';
  status: 'Received' | 'Pending Verification';
}

export interface HistoryLog {
  id: string;
  category: 'All' | 'Product' | 'Order' | 'Expense' | 'Payment' | 'Customer';
  description: string;
  timestamp: string;
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
  | 'settings'
  | 'history';
