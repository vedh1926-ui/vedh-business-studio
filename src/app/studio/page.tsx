'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DashboardView from '@/components/DashboardView';
import OrdersView from '@/components/OrdersView';
import ProductsView from '@/components/ProductsView';
import RecipeView from '@/components/RecipeView';
import InventoryView from '@/components/InventoryView';
import InvoicesView from '@/components/InvoicesView';
import ExpensesView from '@/components/ExpensesView';
import CustomersView from '@/components/CustomersView';
import SuppliersView from '@/components/SuppliersView';
import PaymentsView from '@/components/PaymentsView';
import ReportsView from '@/components/ReportsView';
import SettingsView from '@/components/SettingsView';
import HistoryView from '@/components/HistoryView';
import MasterListsView from '@/components/MasterListsView';

import InvoiceModal from '@/components/InvoiceModal';
import NewOrderModal from '@/components/NewOrderModal';
import NewProductModal from '@/components/NewProductModal';
import NewStockModal from '@/components/NewStockModal';
import NewExpenseModal from '@/components/NewExpenseModal';

import {
  ActiveTab,
  Order,
  Product,
  InventoryItem,
  Customer,
  Supplier,
  Expense,
  Payment,
  HistoryLog,
  OrderStatus,
  MasterListGroup,
  RecipeIngredient,
} from '@/lib/types';

import {
  initialProducts,
  initialOrders,
  initialInventory,
  initialRecipes,
  initialCustomers,
  initialSuppliers,
  initialExpenses,
  initialPayments,
  initialHistory,
  initialMasterLists,
} from '@/lib/mockData';
import {
  buildCustomersFromOrders,
  isOrderOpen,
  normalizeNameKey,
} from '@/lib/oprFormulas';
import { round2 } from '@/lib/utils';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Core Data States
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [recipes, setRecipes] = useState<RecipeIngredient[]>(initialRecipes);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [history, setHistory] = useState<HistoryLog[]>(initialHistory);
  const [masterLists, setMasterLists] = useState<MasterListGroup[]>(initialMasterLists);

  // Selection & Modal States
  const [selectedRecipeProductName, setSelectedRecipeProductName] = useState<string | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewStockOpen, setIsNewStockOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Hydrate from localStorage on client mount if available
  useEffect(() => {
    try {
      // Upgrade Orders / Products / Recipes / Inventory once to the audited workbook v3.0_sheet
      const oprVer = localStorage.getItem('vedh_opr_version');
      if (oprVer === '3.0_sheet') {
        const savedOrders = localStorage.getItem('vedh_orders');
        const parsedOrders: Order[] = savedOrders ? JSON.parse(savedOrders) : initialOrders;
        setOrders(parsedOrders);

        const savedProducts = localStorage.getItem('vedh_products');
        if (savedProducts) setProducts(JSON.parse(savedProducts));

        const savedInventory = localStorage.getItem('vedh_inventory');
        if (savedInventory) setInventory(JSON.parse(savedInventory));

        const savedRecipes = localStorage.getItem('vedh_recipes');
        if (savedRecipes) setRecipes(JSON.parse(savedRecipes));

        const savedCustomers = localStorage.getItem('vedh_customers');
        if (savedCustomers) {
          setCustomers(JSON.parse(savedCustomers));
        } else {
          setCustomers(buildCustomersFromOrders(parsedOrders));
        }

        const savedPayments = localStorage.getItem('vedh_payments');
        if (savedPayments) setPayments(JSON.parse(savedPayments));
      } else {
        localStorage.setItem('vedh_orders', JSON.stringify(initialOrders));
        localStorage.setItem('vedh_products', JSON.stringify(initialProducts));
        localStorage.setItem('vedh_inventory', JSON.stringify(initialInventory));
        localStorage.setItem('vedh_recipes', JSON.stringify(initialRecipes));
        localStorage.setItem('vedh_customers', JSON.stringify(initialCustomers));
        localStorage.setItem('vedh_payments', JSON.stringify(initialPayments));
        localStorage.setItem('vedh_opr_version', '3.0_sheet');
        setOrders(initialOrders);
        setProducts(initialProducts);
        setInventory(initialInventory);
        setRecipes(initialRecipes);
        setCustomers(initialCustomers);
        setPayments(initialPayments);
      }

      // Upgrade placeholder expenses/suppliers once to the audited 131-row Purchase Sheet
      const sheetVer = localStorage.getItem('vedh_expenses_version');
      const savedExpenses = localStorage.getItem('vedh_expenses');
      if (savedExpenses && sheetVer === '2.0_sheet') {
        setExpenses(JSON.parse(savedExpenses));
      } else {
        localStorage.setItem('vedh_expenses', JSON.stringify(initialExpenses));
        localStorage.setItem('vedh_expenses_version', '2.0_sheet');
        localStorage.setItem('vedh_suppliers', JSON.stringify(initialSuppliers));
        setExpenses(initialExpenses);
        setSuppliers(initialSuppliers);
      }

      const savedSuppliers = localStorage.getItem('vedh_suppliers');
      if (savedSuppliers && sheetVer === '2.0_sheet') {
        setSuppliers(JSON.parse(savedSuppliers));
      }

      const savedMasterLists = localStorage.getItem('vedh_master_lists');
      if (savedMasterLists) {
        const parsedLists: MasterListGroup[] = JSON.parse(savedMasterLists);
        const platformDefault = initialMasterLists.find((g) => g.key === 'platform');
        if (platformDefault && !parsedLists.some((g) => g.key === 'platform')) {
          const merged = [...parsedLists, platformDefault];
          setMasterLists(merged);
          localStorage.setItem('vedh_master_lists', JSON.stringify(merged));
        } else {
          setMasterLists(parsedLists);
        }
      }
    } catch {
      // LocalStorage access restricted or empty
    }
  }, []);

  // Save changes to localStorage
  const persist = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  };

  // Active option lookup helper from Master Lists
  const getActiveOptions = (key: string): string[] => {
    const group = masterLists.find((g) => g.key === key);
    if (!group) return [];
    return group.items.filter((i) => i.isActive).map((i) => i.label);
  };

  // Add history log helper
  const addLog = (category: HistoryLog['category'], description: string) => {
    const newLog: HistoryLog = {
      id: `hist-${Date.now()}`,
      category,
      description,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setHistory((prev) => [newLog, ...prev]);
  };

  // Order Handlers
  const syncCustomersFromOrdersList = (nextOrders: Order[]) => {
    const nextCustomers = buildCustomersFromOrders(nextOrders, customers);
    setCustomers(nextCustomers);
    persist('vedh_customers', nextCustomers);
  };

  const handleSaveOrder = (orderData: Omit<Order, 'id'>, existingId?: string) => {
    if (existingId) {
      const prev = orders.find((o) => o.id === existingId);
      const updated = orders.map((o) =>
        o.id === existingId ? { ...orderData, id: existingId } : o
      );
      setOrders(updated);
      persist('vedh_orders', updated);
      syncCustomersFromOrdersList(updated);

      if (prev && orderData.advancePaid > prev.advancePaid) {
        const delta = round2(orderData.advancePaid - prev.advancePaid);
        const newPay: Payment = {
          id: `pay-${Date.now()}`,
          orderNumber: orderData.orderNumber,
          customerName: orderData.customerName,
          amount: delta,
          date: new Date().toISOString().split('T')[0],
          method: orderData.paymentMode || 'UPI',
          status: 'Received',
        };
        setPayments((p) => {
          const next = [newPay, ...p];
          persist('vedh_payments', next);
          return next;
        });
      }
      addLog('Order', `Order ${orderData.orderNumber} (${orderData.customerName}) updated`);
      return;
    }

    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
    };
    const updated = [newOrder, ...orders];
    setOrders(updated);
    persist('vedh_orders', updated);
    syncCustomersFromOrdersList(updated);

    if (newOrder.advancePaid > 0) {
      const newPay: Payment = {
        id: `pay-${Date.now()}`,
        orderNumber: newOrder.orderNumber,
        customerName: newOrder.customerName,
        amount: newOrder.advancePaid,
        date: newOrder.createdAt,
        method: newOrder.paymentMode || 'UPI',
        status: 'Received',
      };
      setPayments((prev) => {
        const nextPayments = [newPay, ...prev];
        persist('vedh_payments', nextPayments);
        return nextPayments;
      });
    }

    addLog('Order', `Order ${newOrder.orderNumber} placed by ${newOrder.customerName} (₹${newOrder.totalAmount})`);
  };

  const handleDeleteOrder = (id: string) => {
    const toDelete = orders.find((o) => o.id === id);
    const updated = orders.filter((o) => o.id !== id);
    setOrders(updated);
    persist('vedh_orders', updated);
    syncCustomersFromOrdersList(updated);
    if (toDelete) {
      addLog('Order', `Order ${toDelete.orderNumber} (${toDelete.customerName}) deleted`);
    }
  };

  const handleUpdateOrderStatus = (id: string, status: OrderStatus) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = orders.map((o) =>
      o.id === id
        ? {
            ...o,
            status,
            deliveredOn: status === 'Delivered' && !o.deliveredOn ? today : o.deliveredOn,
          }
        : o
    );
    setOrders(updated);
    persist('vedh_orders', updated);
    const target = orders.find((o) => o.id === id);
    if (target) {
      addLog('Order', `Order ${target.orderNumber} status changed to ${status}`);
    }
  };

  const handleToggleDeductStock = (id: string) => {
    const target = orders.find((o) => o.id === id);
    if (!target) return;
    const nextDeduct = !(target.deductStock !== false);
    const updated = orders.map((o) => (o.id === id ? { ...o, deductStock: nextDeduct } : o));
    setOrders(updated);
    persist('vedh_orders', updated);
    addLog(
      'Order',
      `Order ${target.orderNumber} stock deduction set to ${nextDeduct ? 'Yes' : 'No'}`
    );
  };

  const handleMarkOrderPaid = (id: string) => {
    const target = orders.find((o) => o.id === id);
    if (!target) return;
    const total =
      target.items.length > 0
        ? round2(target.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0))
        : round2(target.totalAmount);
    const remaining = round2(total - target.advancePaid);
    if (remaining <= 0) return;

    const updated = orders.map((o) =>
      o.id === id ? { ...o, advancePaid: total, balanceDue: 0 } : o
    );
    setOrders(updated);
    persist('vedh_orders', updated);

    const newPay: Payment = {
      id: `pay-${Date.now()}`,
      orderNumber: target.orderNumber,
      customerName: target.customerName,
      amount: remaining,
      date: new Date().toISOString().split('T')[0],
      method: target.paymentMode || 'UPI',
      status: 'Received',
    };
    setPayments((prev) => {
      const nextPayments = [newPay, ...prev];
      persist('vedh_payments', nextPayments);
      return nextPayments;
    });
    addLog('Payment', `Marked ₹${remaining} balance paid for ${target.orderNumber} (${target.customerName})`);
  };

  // Product Handlers
  const handleSaveProduct = (prodData: Omit<Product, 'id' | 'status'>, existingId?: string) => {
    const status: Product['status'] =
      prodData.stock <= 0 ? 'Out of Stock' : prodData.stock <= prodData.reorderLevel ? 'Low' : 'Healthy';

    if (existingId) {
      const prevProd = products.find((p) => p.id === existingId);
      const updated = products.map((p) =>
        p.id === existingId ? { ...prodData, id: existingId, status } : p
      );
      setProducts(updated);
      persist('vedh_products', updated);

      if (prevProd && prevProd.name !== prodData.name) {
        const nextRecipes = recipes.map((r) =>
          r.productId === existingId || normalizeNameKey(r.productName) === normalizeNameKey(prevProd.name)
            ? { ...r, productName: prodData.name }
            : r
        );
        setRecipes(nextRecipes);
        persist('vedh_recipes', nextRecipes);
      }

      addLog('Product', `Product updated: ${prodData.name} (₹${prodData.price})`);
      return;
    }

    const newProduct: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      status,
    };
    const updated = [newProduct, ...products];
    setProducts(updated);
    persist('vedh_products', updated);

    // Also add finished good to inventory
    const newInv: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: newProduct.name,
      type: 'Finished Good',
      category: newProduct.category,
      stock: newProduct.stock,
      unit: newProduct.unit || 'set',
      reorderLevel: newProduct.reorderLevel,
      status: status === 'Out of Stock' ? 'Critical' : status,
    };
    setInventory((prev) => {
      const nextInv = [newInv, ...prev];
      persist('vedh_inventory', nextInv);
      return nextInv;
    });

    addLog('Product', `New product catalogued: ${newProduct.name} (₹${newProduct.price})`);
  };

  const handleDeleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    persist('vedh_products', updated);
    if (target) {
      addLog('Product', `Product removed: ${target.name}`);
    }
  };

  // Recipe Handlers
  const handleAddRecipeIngredient = (payload: {
    productId: string;
    productName: string;
    materialId: string;
    materialName: string;
    qtyPerUnit: number;
    unit: string;
    createNewMaterial?: {
      name: string;
      type: 'Raw Material' | 'Packaging';
      unit: string;
      stock: number;
      avgUnitCost?: number;
    };
  }) => {
    let resolvedMatId = payload.materialId;
    let resolvedMatName = payload.materialName;
    let resolvedUnit = payload.unit;

    if (payload.createNewMaterial) {
      const existing = inventory.find(
        (i) => normalizeNameKey(i.name) === normalizeNameKey(payload.createNewMaterial!.name)
      );
      if (existing) {
        resolvedMatId = existing.id;
        resolvedMatName = existing.name;
        resolvedUnit = existing.unit;
      } else {
        const nm = payload.createNewMaterial;
        const status: InventoryItem['status'] =
          nm.stock <= 0 ? 'Critical' : nm.stock <= 10 ? 'Low' : 'Healthy';
        const createdInv: InventoryItem = {
          id: `inv-mat-${Date.now()}`,
          name: nm.name,
          type: nm.type,
          category: nm.type === 'Packaging' ? 'Packaging' : 'Art Supplies',
          stock: nm.stock,
          unit: nm.unit,
          reorderLevel: 10,
          avgUnitCost: nm.avgUnitCost,
          purchaseSource: 'Added from Recipe Studio',
          status,
        };
        resolvedMatId = createdInv.id;
        resolvedMatName = createdInv.name;
        resolvedUnit = createdInv.unit;
        setInventory((prev) => {
          const nextInv = [createdInv, ...prev];
          persist('vedh_inventory', nextInv);
          return nextInv;
        });
      }
    }

    const newIng: RecipeIngredient = {
      id: `rec-${Date.now()}`,
      productId: payload.productId,
      productName: payload.productName,
      materialId: resolvedMatId,
      materialName: resolvedMatName,
      qtyPerUnit: payload.qtyPerUnit,
      unit: resolvedUnit,
    };

    const nextRecipes = [...recipes, newIng];
    setRecipes(nextRecipes);
    persist('vedh_recipes', nextRecipes);
    addLog(
      'Recipe',
      `Added ${resolvedMatName} (×${payload.qtyPerUnit} ${resolvedUnit}) to ${payload.productName}`
    );
  };

  const handleUpdateRecipeIngredient = (
    ingredientId: string,
    updates: { qtyPerUnit?: number; overrideUnitCost?: number; unit?: string }
  ) => {
    const nextRecipes = recipes.map((r) =>
      r.id === ingredientId ? { ...r, ...updates } : r
    );
    setRecipes(nextRecipes);
    persist('vedh_recipes', nextRecipes);
  };

  const handleDeleteRecipeIngredient = (ingredientId: string) => {
    const target = recipes.find((r) => r.id === ingredientId);
    const nextRecipes = recipes.filter((r) => r.id !== ingredientId);
    setRecipes(nextRecipes);
    persist('vedh_recipes', nextRecipes);
    if (target) {
      addLog('Recipe', `Removed ${target.materialName} from ${target.productName}`);
    }
  };

  const handleCloneRecipe = (
    sourceProductName: string,
    targetProductId: string,
    targetProductName: string
  ) => {
    const sourceLines = recipes.filter(
      (r) => normalizeNameKey(r.productName) === normalizeNameKey(sourceProductName)
    );
    if (sourceLines.length === 0) return;

    const existingMatKeys = new Set(
      recipes
        .filter((r) => normalizeNameKey(r.productName) === normalizeNameKey(targetProductName))
        .map((r) => normalizeNameKey(r.materialName))
    );

    const cloned: RecipeIngredient[] = sourceLines
      .filter((s) => !existingMatKeys.has(normalizeNameKey(s.materialName)))
      .map((s, idx) => ({
        ...s,
        id: `rec-${Date.now()}-${idx}`,
        productId: targetProductId,
        productName: targetProductName,
      }));

    if (cloned.length === 0) return;
    const nextRecipes = [...recipes, ...cloned];
    setRecipes(nextRecipes);
    persist('vedh_recipes', nextRecipes);
    addLog(
      'Recipe',
      `Cloned ${cloned.length} ingredients from "${sourceProductName}" to "${targetProductName}"`
    );
  };

  const handleUpdateInventoryMaterial = (
    materialId: string,
    updates: { stock?: number; avgUnitCost?: number }
  ) => {
    const updated = inventory.map((item) => {
      if (item.id !== materialId) return item;
      const nextStock = updates.stock !== undefined ? Math.max(0, updates.stock) : item.stock;
      const nextStatus: InventoryItem['status'] =
        nextStock <= 0 ? 'Critical' : nextStock <= item.reorderLevel ? 'Low' : 'Healthy';
      return {
        ...item,
        stock: nextStock,
        avgUnitCost:
          'avgUnitCost' in updates ? updates.avgUnitCost : item.avgUnitCost,
        status: nextStatus,
      };
    });
    setInventory(updated);
    persist('vedh_inventory', updated);
  };

  const handleOpenRecipeForProduct = (productName: string) => {
    setSelectedRecipeProductName(productName);
    setActiveTab('recipe');
  };

  // Inventory Handlers
  const handleSaveStock = (stockData: Omit<InventoryItem, 'id' | 'status'>) => {
    const status = stockData.stock <= stockData.reorderLevel ? 'Low' : 'Healthy';
    const newItem: InventoryItem = {
      ...stockData,
      id: `inv-${Date.now()}`,
      status,
    };
    const updated = [newItem, ...inventory];
    setInventory(updated);
    persist('vedh_inventory', updated);
    addLog('Product', `Stock registered: ${newItem.name} (${newItem.stock} ${newItem.unit})`);
  };

  const handleAdjustStock = (id: string, delta: number, reason?: string) => {
    const target = inventory.find((item) => item.id === id);
    const updated = inventory.map((item) => {
      if (item.id === id) {
        const nextStock = Math.max(0, item.stock + delta);
        const status: InventoryItem['status'] = nextStock <= item.reorderLevel ? 'Low' : 'Healthy';
        return {
          ...item,
          stock: nextStock,
          status,
          lastAdjustmentReason: reason || item.lastAdjustmentReason,
        };
      }
      return item;
    });
    setInventory(updated);
    persist('vedh_inventory', updated);
    if (target) {
      addLog(
        'Product',
        `Stock adjusted for ${target.name} (${delta > 0 ? '+' : ''}${delta} ${target.unit})${
          reason ? ` — ${reason}` : ''
        }`
      );
    }
  };

  // Expenses / Purchases Handlers
  const handleSaveExpense = (expData: Omit<Expense, 'id'>, existingId?: string) => {
    if (existingId) {
      const updated = expenses.map((e) =>
        e.id === existingId ? { ...expData, id: existingId } : e
      );
      setExpenses(updated);
      persist('vedh_expenses', updated);
      persist('vedh_expenses_version', '2.0_sheet');
      addLog('Expense', `Purchase updated: ${expData.title} (₹${expData.amount})`);
      return;
    }

    const newExpense: Expense = {
      ...expData,
      id: `pur-${Date.now()}`,
    };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    persist('vedh_expenses', updated);
    persist('vedh_expenses_version', '2.0_sheet');
    addLog(
      'Expense',
      `Purchase recorded (${newExpense.platform || 'Direct'}): ${newExpense.title} (₹${newExpense.amount})`
    );
  };

  const handleUpdateExpenseStatus = (id: string, purchaseStatus: string) => {
    const target = expenses.find((e) => e.id === id);
    const updated = expenses.map((e) => (e.id === id ? { ...e, purchaseStatus } : e));
    setExpenses(updated);
    persist('vedh_expenses', updated);
    if (target) {
      addLog('Expense', `Purchase status for ${target.title} updated to ${purchaseStatus}`);
    }
  };

  const handleDeleteExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    persist('vedh_expenses', updated);
    if (target) {
      addLog('Expense', `Purchase deleted: ${target.title} (₹${target.amount})`);
    }
  };

  const handleResetExpenseSheet = () => {
    setExpenses(initialExpenses);
    setSuppliers(initialSuppliers);
    persist('vedh_expenses', initialExpenses);
    persist('vedh_suppliers', initialSuppliers);
    persist('vedh_expenses_version', '2.0_sheet');
    addLog('Expense', 'Reloaded cleaned 131-item Purchase Sheet defaults');
  };

  // Master Lists CRUD Handlers
  const handleAddMasterItem = (groupId: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const targetGroup = masterLists.find((g) => g.id === groupId);
    const updated = masterLists.map((group) => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        items: [
          ...group.items,
          { id: `ml-item-${Date.now()}`, label: trimmed, isActive: true },
        ],
      };
    });
    setMasterLists(updated);
    persist('vedh_master_lists', updated);
    if (targetGroup) {
      addLog('Master List', `Added "${trimmed}" to ${targetGroup.name}`);
    }
  };

  const handleEditMasterItem = (groupId: string, itemId: string, newLabel: string) => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    const targetGroup = masterLists.find((g) => g.id === groupId);
    const oldItem = targetGroup?.items.find((i) => i.id === itemId);
    const updated = masterLists.map((group) => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        items: group.items.map((item) =>
          item.id === itemId ? { ...item, label: trimmed } : item
        ),
      };
    });
    setMasterLists(updated);
    persist('vedh_master_lists', updated);
    if (targetGroup && oldItem && oldItem.label !== trimmed) {
      addLog(
        'Master List',
        `Renamed "${oldItem.label}" to "${trimmed}" in ${targetGroup.name}`
      );
    }
  };

  const handleToggleMasterItem = (groupId: string, itemId: string) => {
    const targetGroup = masterLists.find((g) => g.id === groupId);
    const targetItem = targetGroup?.items.find((i) => i.id === itemId);
    const updated = masterLists.map((group) => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        items: group.items.map((item) =>
          item.id === itemId ? { ...item, isActive: !item.isActive } : item
        ),
      };
    });
    setMasterLists(updated);
    persist('vedh_master_lists', updated);
    if (targetGroup && targetItem) {
      addLog(
        'Master List',
        `${targetItem.isActive ? 'Hid' : 'Activated'} "${targetItem.label}" in ${targetGroup.name}`
      );
    }
  };

  const handleDeleteMasterItem = (groupId: string, itemId: string) => {
    const targetGroup = masterLists.find((g) => g.id === groupId);
    const targetItem = targetGroup?.items.find((i) => i.id === itemId);
    const updated = masterLists.map((group) => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        items: group.items.filter((item) => item.id !== itemId),
      };
    });
    setMasterLists(updated);
    persist('vedh_master_lists', updated);
    if (targetGroup && targetItem) {
      addLog('Master List', `Deleted "${targetItem.label}" from ${targetGroup.name}`);
    }
  };

  const handleAddMasterGroup = (name: string, description: string, usedIn: string[]) => {
    const baseKey =
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '') || `custom_${Date.now()}`;
    const keyExists = masterLists.some((g) => g.key === baseKey);
    const key = keyExists ? `${baseKey}_${Date.now()}` : baseKey;

    const newGroup: MasterListGroup = {
      id: `ml-grp-${Date.now()}`,
      key,
      name: name.trim(),
      description: description.trim() || 'Custom parameter list',
      usedIn: usedIn.length > 0 ? usedIn : ['Studio Operations'],
      items: [],
    };
    const updated = [...masterLists, newGroup];
    setMasterLists(updated);
    persist('vedh_master_lists', updated);
    addLog('Master List', `Created new parameter table "${newGroup.name}"`);
  };

  const handleDeleteMasterGroup = (groupId: string) => {
    const targetGroup = masterLists.find((g) => g.id === groupId);
    const updated = masterLists.filter((g) => g.id !== groupId);
    setMasterLists(updated);
    persist('vedh_master_lists', updated);
    if (targetGroup) {
      addLog('Master List', `Deleted parameter table "${targetGroup.name}"`);
    }
  };

  const handleResetMasterLists = () => {
    setMasterLists(initialMasterLists);
    persist('vedh_master_lists', initialMasterLists);
    addLog('Master List', 'Reset all Master Lists to Excel factory defaults');
  };

  // Customers Handlers
  const handleDeleteCustomer = (id: string) => {
    setCustomers(customers.filter((c) => c.id !== id));
  };

  // Suppliers Handlers
  const handleAddSupplier = (supData: Omit<Supplier, 'id' | 'totalOrders' | 'totalPaid'>) => {
    const newSup: Supplier = {
      ...supData,
      id: `sup-${Date.now()}`,
      totalOrders: 0,
      totalPaid: 0,
    };
    setSuppliers([newSup, ...suppliers]);
    addLog('Product', `Material supplier added: ${newSup.name} (${newSup.category})`);
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers(suppliers.filter((s) => s.id !== id));
  };

  // Payments Handlers
  const handleAddPayment = (payData: Omit<Payment, 'id'>) => {
    const newPay: Payment = {
      ...payData,
      id: `pay-${Date.now()}`,
    };
    const updated = [newPay, ...payments];
    setPayments(updated);
    persist('vedh_payments', updated);

    // If matches order, update balance
    if (newPay.orderNumber) {
      setOrders(
        orders.map((o) => {
          if (o.orderNumber === newPay.orderNumber) {
            const nextAdv = o.advancePaid + newPay.amount;
            const nextBal = Math.max(0, o.totalAmount - nextAdv);
            return { ...o, advancePaid: nextAdv, balanceDue: nextBal };
          }
          return o;
        })
      );
    }

    addLog('Payment', `Payment of ₹${newPay.amount} received from ${newPay.customerName}`);
  };

  // Quick Action Dispatcher
  const handleQuickAdd = (type: 'order' | 'product' | 'stock' | 'expense' | 'recipe') => {
    if (type === 'order') {
      setEditingOrder(null);
      setIsNewOrderOpen(true);
    }
    if (type === 'product') {
      setEditingProduct(null);
      setIsNewProductOpen(true);
    }
    if (type === 'stock') setIsNewStockOpen(true);
    if (type === 'recipe') setActiveTab('recipe');
    if (type === 'expense') {
      setEditingExpense(null);
      setIsNewExpenseOpen(true);
    }
  };

  const openOrdersBadgeCount = orders.filter((o) => isOrderOpen(o.status)).length;
  const lowStockBadgeCount = inventory.filter((i) => i.stock <= i.reorderLevel).length;

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex">
      {/* Persistent Burgundy Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        openOrdersCount={openOrdersBadgeCount}
        lowStockCount={lowStockBadgeCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onQuickAdd={handleQuickAdd}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              orders={orders}
              products={products}
              inventory={inventory}
              expenses={expenses}
              recipes={recipes}
              platforms={getActiveOptions('platform')}
              setActiveTab={setActiveTab}
              onOpenNewOrder={() => {
                setEditingOrder(null);
                setIsNewOrderOpen(true);
              }}
              onOpenNewStock={() => setIsNewStockOpen(true)}
              onOpenNewExpense={() => {
                setEditingExpense(null);
                setIsNewExpenseOpen(true);
              }}
              onSelectOrderForInvoice={(order) => setSelectedOrderForInvoice(order)}
              onOpenRecipeForProduct={handleOpenRecipeForProduct}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView
              orders={orders}
              products={products}
              recipes={recipes}
              inventory={inventory}
              orderStatuses={getActiveOptions('order_status')}
              onOpenNewOrder={() => {
                setEditingOrder(null);
                setIsNewOrderOpen(true);
              }}
              onEditOrder={(order) => {
                setEditingOrder(order);
                setIsNewOrderOpen(true);
              }}
              onDeleteOrder={handleDeleteOrder}
              onUpdateStatus={handleUpdateOrderStatus}
              onToggleDeductStock={handleToggleDeductStock}
              onMarkPaid={handleMarkOrderPaid}
              onSelectOrderForInvoice={(order) => setSelectedOrderForInvoice(order)}
              onOpenRecipeForProduct={handleOpenRecipeForProduct}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={products}
              recipes={recipes}
              orders={orders}
              inventory={inventory}
              onOpenNewProduct={() => {
                setEditingProduct(null);
                setIsNewProductOpen(true);
              }}
              onEditProduct={(product) => {
                setEditingProduct(product);
                setIsNewProductOpen(true);
              }}
              onDeleteProduct={handleDeleteProduct}
              onOpenRecipeForProduct={handleOpenRecipeForProduct}
            />
          )}

          {activeTab === 'recipe' && (
            <RecipeView
              products={products}
              recipes={recipes}
              orders={orders}
              inventory={inventory}
              unitOptions={getActiveOptions('unit')}
              selectedProductName={selectedRecipeProductName}
              onSelectProductName={(name) => setSelectedRecipeProductName(name)}
              onAddIngredient={handleAddRecipeIngredient}
              onUpdateIngredient={handleUpdateRecipeIngredient}
              onDeleteIngredient={handleDeleteRecipeIngredient}
              onCloneRecipe={handleCloneRecipe}
              onUpdateInventoryMaterial={handleUpdateInventoryMaterial}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              inventory={inventory}
              products={products}
              recipes={recipes}
              orders={orders}
              adjustmentReasons={getActiveOptions('adjustment_reason')}
              onOpenNewStock={() => setIsNewStockOpen(true)}
              onAdjustStock={handleAdjustStock}
              onUpdateInventoryMaterial={handleUpdateInventoryMaterial}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesView
              orders={orders}
              onSelectOrderForInvoice={(order) => setSelectedOrderForInvoice(order)}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              platforms={getActiveOptions('platform')}
              categories={getActiveOptions('category')}
              purchaseStatuses={getActiveOptions('purchase_status')}
              onOpenNewExpense={() => {
                setEditingExpense(null);
                setIsNewExpenseOpen(true);
              }}
              onEditExpense={(expense) => {
                setEditingExpense(expense);
                setIsNewExpenseOpen(true);
              }}
              onDeleteExpense={handleDeleteExpense}
              onUpdatePurchaseStatus={handleUpdateExpenseStatus}
              onResetSheetData={handleResetExpenseSheet}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={customers}
              onOpenNewCustomer={() => setIsNewOrderOpen(true)}
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersView
              suppliers={suppliers}
              categories={getActiveOptions('category')}
              onAddSupplier={handleAddSupplier}
              onDeleteSupplier={handleDeleteSupplier}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsView
              payments={payments}
              paymentModes={getActiveOptions('payment_mode')}
              onAddPayment={handleAddPayment}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              orders={orders}
              products={products}
              expenses={expenses}
              payments={payments}
              recipes={recipes}
              inventory={inventory}
              platforms={getActiveOptions('platform')}
            />
          )}

          {activeTab === 'master-lists' && (
            <MasterListsView
              masterLists={masterLists}
              onAddItem={handleAddMasterItem}
              onEditItem={handleEditMasterItem}
              onToggleItem={handleToggleMasterItem}
              onDeleteItem={handleDeleteMasterItem}
              onAddGroup={handleAddMasterGroup}
              onDeleteGroup={handleDeleteMasterGroup}
              onResetDefaults={handleResetMasterLists}
            />
          )}

          {activeTab === 'settings' && <SettingsView />}

          {activeTab === 'history' && <HistoryView logs={history} />}
        </main>
      </div>

      {/* Global Modals */}
      {selectedOrderForInvoice && (
        <InvoiceModal
          order={selectedOrderForInvoice}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}

      {isNewOrderOpen && (
        <NewOrderModal
          products={products}
          paymentModes={getActiveOptions('payment_mode')}
          orderStatuses={getActiveOptions('order_status')}
          initialOrder={editingOrder}
          onClose={() => {
            setIsNewOrderOpen(false);
            setEditingOrder(null);
          }}
          onSave={handleSaveOrder}
        />
      )}

      {isNewProductOpen && (
        <NewProductModal
          categories={getActiveOptions('category')}
          units={getActiveOptions('unit')}
          initialProduct={editingProduct}
          onClose={() => {
            setIsNewProductOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
        />
      )}

      {isNewStockOpen && (
        <NewStockModal
          categories={getActiveOptions('category')}
          units={getActiveOptions('unit')}
          onClose={() => setIsNewStockOpen(false)}
          onSave={handleSaveStock}
        />
      )}

      {isNewExpenseOpen && (
        <NewExpenseModal
          initialExpense={editingExpense}
          platforms={getActiveOptions('platform')}
          categories={getActiveOptions('category')}
          paymentModes={getActiveOptions('payment_mode')}
          purchaseStatuses={getActiveOptions('purchase_status')}
          onClose={() => {
            setIsNewExpenseOpen(false);
            setEditingExpense(null);
          }}
          onSave={handleSaveExpense}
        />
      )}
    </div>
  );
}
