'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import OrderEnquiryCheckerModal from '@/components/OrderEnquiryCheckerModal';

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
  StockAdjustment,
} from '@/lib/types';

import {
  initialProducts,
  initialOrders,
  initialInventory,
  initialAdjustments,
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
  computeInventoryLedgerMetrics,
  getLocalTodayYmd,
  isOrderOpen,
  normalizeNameKey,
} from '@/lib/oprFormulas';
import { round2 } from '@/lib/utils';
import {
  luxuryDecoOrder14290Expenses,
  luxuryDecoOrder14507Expenses,
} from '@/lib/purchaseSheetSeed';
import { normalizeOrderNumberKey } from '@/lib/purchaseMediaStore';
import { PurchaseMediaUpdateItem } from '@/components/PurchaseMediaModals';
import {
  EXPENSES_DATA_VERSION,
  OPR_DATA_VERSION,
  SupabaseSyncDiagnostic,
  persistStudioKey,
  probeSupabaseSchemaStatus,
  readVersionFlag,
  subscribeStudioSync,
  writeVersionFlag,
} from '@/lib/studioSync';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Core Data States
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(initialAdjustments);
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
  const [isEnquiryCheckerOpen, setIsEnquiryCheckerOpen] = useState(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewStockOpen, setIsNewStockOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [syncDiagnostic, setSyncDiagnostic] = useState<SupabaseSyncDiagnostic | undefined>(undefined);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const formatSaveClock = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Hydrate from localStorage on client mount & keep tabs synchronized in real time
  useEffect(() => {
    let active = true;

    try {
      // Upgrade Orders / Products / Recipes / Inventory once to the audited clean workbook v4.0_clean
      const oprVer = readVersionFlag('vedh_opr_version');
      if (oprVer === OPR_DATA_VERSION) {
        writeVersionFlag('vedh_opr_version', OPR_DATA_VERSION);
        const savedOrders = localStorage.getItem('vedh_orders');
        const parsedOrders: Order[] = savedOrders ? JSON.parse(savedOrders) : initialOrders;
        setOrders(parsedOrders);

        const savedProducts = localStorage.getItem('vedh_products');
        if (savedProducts) setProducts(JSON.parse(savedProducts));

        const savedInventory = localStorage.getItem('vedh_inventory');
        if (savedInventory) setInventory(JSON.parse(savedInventory));

        const savedAdjustments = localStorage.getItem('vedh_adjustments');
        if (savedAdjustments) setAdjustments(JSON.parse(savedAdjustments));

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
        localStorage.setItem('vedh_adjustments', JSON.stringify(initialAdjustments));
        localStorage.setItem('vedh_recipes', JSON.stringify(initialRecipes));
        localStorage.setItem('vedh_customers', JSON.stringify(initialCustomers));
        localStorage.setItem('vedh_payments', JSON.stringify(initialPayments));
        writeVersionFlag('vedh_opr_version', OPR_DATA_VERSION);
        setOrders(initialOrders);
        setProducts(initialProducts);
        setInventory(initialInventory);
        setAdjustments(initialAdjustments);
        setRecipes(initialRecipes);
        setCustomers(initialCustomers);
        setPayments(initialPayments);
      }

      // Upgrade expenses/suppliers to v4.0_clean with Shipped incoming stock links
      const sheetVer = readVersionFlag('vedh_expenses_version');
      const savedExpenses = localStorage.getItem('vedh_expenses');
      const seeded14290 = readVersionFlag('vedh_luxury14290_seeded') === '1';
      const seeded14507 = readVersionFlag('vedh_luxury14507_seeded') === '1';
      const incrementalOrderSeeds: Array<{
        flagKey: string;
        alreadySeeded: boolean;
        cutoffDate: string;
        items: Expense[];
      }> = [
        {
          flagKey: 'vedh_luxury14290_seeded',
          alreadySeeded: seeded14290,
          cutoffDate: '2026-10-01',
          items: luxuryDecoOrder14290Expenses,
        },
        {
          flagKey: 'vedh_luxury14507_seeded',
          alreadySeeded: seeded14507,
          cutoffDate: '2026-10-08',
          items: luxuryDecoOrder14507Expenses,
        },
      ];

      if (savedExpenses && sheetVer === EXPENSES_DATA_VERSION) {
        // Ensure plain string flag (fixes legacy JSON-quoted '"4.0_clean"' values)
        writeVersionFlag('vedh_expenses_version', EXPENSES_DATA_VERSION);
        let loadedExpenses: Expense[] = JSON.parse(savedExpenses);
        let modifiedExpenses = false;

        for (const seed of incrementalOrderSeeds) {
          if (seed.alreadySeeded) continue;
          const existingIds = new Set(loadedExpenses.map((e) => e.id));
          const missing = seed.items.filter((item) => !existingIds.has(item.id));
          if (missing.length > 0) {
            const insertIdx = loadedExpenses.findIndex((e) => (e.date || '') < seed.cutoffDate);
            loadedExpenses =
              insertIdx === -1
                ? [...loadedExpenses, ...missing]
                : [
                    ...loadedExpenses.slice(0, insertIdx),
                    ...missing,
                    ...loadedExpenses.slice(insertIdx),
                  ];
            modifiedExpenses = true;
          }
          writeVersionFlag(seed.flagKey, '1');
        }

        if (modifiedExpenses) {
          persistStudioKey('vedh_expenses', loadedExpenses);
        }
        setExpenses(loadedExpenses);
      } else {
        localStorage.setItem('vedh_expenses', JSON.stringify(initialExpenses));
        writeVersionFlag('vedh_expenses_version', EXPENSES_DATA_VERSION);
        writeVersionFlag('vedh_luxury14290_seeded', '1');
        writeVersionFlag('vedh_luxury14507_seeded', '1');
        localStorage.setItem('vedh_suppliers', JSON.stringify(initialSuppliers));
        setExpenses(initialExpenses);
        setSuppliers(initialSuppliers);
      }

      const savedSuppliers = localStorage.getItem('vedh_suppliers');
      if (savedSuppliers && sheetVer === EXPENSES_DATA_VERSION) {
        let loadedSuppliers: Supplier[] = JSON.parse(savedSuppliers);
        if (!seeded14290 || !seeded14507) {
          const luxurySeed = initialSuppliers.find((s) => s.id === 'sup-luxurydeco');
          if (luxurySeed) {
            let changed = false;
            loadedSuppliers = loadedSuppliers.map((sup) => {
              if (sup.id === 'sup-luxurydeco' && (sup.totalPaid || 0) < luxurySeed.totalPaid) {
                changed = true;
                return luxurySeed;
              }
              return sup;
            });
            if (changed) persistStudioKey('vedh_suppliers', loadedSuppliers);
          }
        }
        setSuppliers(loadedSuppliers);
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

    probeSupabaseSchemaStatus().then((diag) => {
      if (active) setSyncDiagnostic(diag);
    });

    const syncHandlers: Record<string, (parsed: any) => void> = {
      vedh_orders: setOrders,
      vedh_products: setProducts,
      vedh_inventory: setInventory,
      vedh_adjustments: setAdjustments,
      vedh_recipes: setRecipes,
      vedh_customers: setCustomers,
      vedh_suppliers: setSuppliers,
      vedh_expenses: setExpenses,
      vedh_payments: setPayments,
      vedh_master_lists: setMasterLists,
    };

    const unsubscribe = subscribeStudioSync((changedKey) => {
      const handler = syncHandlers[changedKey];
      if (!handler) return;
      try {
        const raw = localStorage.getItem(changedKey);
        if (raw) {
          handler(JSON.parse(raw));
          setLastSavedAt(formatSaveClock());
        }
      } catch {
        // Ignore malformed storage payload from external tab
      }
    });

    return () => {
      active = false;
      unsubscribe();
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Save changes to localStorage and notify other open Studio tabs
  const persist = (key: string, data: any) => {
    if (persistStudioKey(key, data)) {
      setLastSavedAt(formatSaveClock());
    }
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
    updates: { stock?: number; avgUnitCost?: number; openingStock?: number | null }
  ) => {
    const updated = inventory.map((item) => {
      if (item.id !== materialId) return item;
      const nextOpeningStock =
        'openingStock' in updates ? updates.openingStock : item.openingStock;
      const nextStock =
        updates.stock !== undefined
          ? Math.max(0, updates.stock)
          : 'openingStock' in updates
          ? Math.max(0, nextOpeningStock ?? 0)
          : item.stock;
      const nextStatus: InventoryItem['status'] =
        nextStock <= 0 ? 'Critical' : nextStock <= item.reorderLevel ? 'Low' : 'Healthy';
      return {
        ...item,
        openingStock: nextOpeningStock,
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
      openingStock: stockData.openingStock !== undefined ? stockData.openingStock : stockData.stock,
      id: `inv-${Date.now()}`,
      status,
    };
    const updated = [newItem, ...inventory];
    setInventory(updated);
    persist('vedh_inventory', updated);
    addLog('Product', `Stock registered: ${newItem.name} (${newItem.stock} ${newItem.unit})`);
  };

  const handleAddAdjustment = (payload: Omit<StockAdjustment, 'id'>) => {
    const entry: StockAdjustment = {
      ...payload,
      id: `adj-${Date.now()}`,
    };
    const nextAdjustments = [entry, ...adjustments];
    setAdjustments(nextAdjustments);
    persist('vedh_adjustments', nextAdjustments);

    const updatedInv = inventory.map((item) => {
      if (item.id !== payload.materialId) return item;
      const nextStock = Math.max(0, round2(item.stock + payload.delta));
      const status: InventoryItem['status'] =
        nextStock <= 0 ? 'Critical' : nextStock <= item.reorderLevel ? 'Low' : 'Healthy';
      return {
        ...item,
        stock: nextStock,
        status,
        lastAdjustmentReason: payload.reason || item.lastAdjustmentReason,
      };
    });
    setInventory(updatedInv);
    persist('vedh_inventory', updatedInv);

    addLog(
      'Inventory',
      `Stock adjusted for ${payload.materialName} (${payload.delta > 0 ? '+' : ''}${payload.delta}) — ${payload.reason}${
        payload.notes ? ` (${payload.notes})` : ''
      }`
    );
  };

  const handleAdjustStock = (id: string, delta: number, reason?: string, notes?: string) => {
    const target = inventory.find((item) => item.id === id);
    if (!target || delta === 0) return;
    handleAddAdjustment({
      date: getLocalTodayYmd(),
      materialId: target.id,
      materialName: target.name,
      delta,
      reason: reason || 'Stock count correction',
      notes,
    });
  };

  // Expenses / Purchases Handlers
  const handleSaveExpense = (
    expData: Omit<Expense, 'id'>,
    existingId?: string,
    options?: { linkBillToOrder?: boolean }
  ) => {
    const orderKey = options?.linkBillToOrder
      ? normalizeOrderNumberKey(expData.orderId)
      : '';
    const hasBillPayload = Boolean(
      expData.receiptFile || expData.receiptUrl || expData.receiptMediaId
    );
    const applyOrderBillSync = (rows: Expense[], savedRowId: string) => {
      if (!orderKey || !hasBillPayload) return rows;
      return rows.map((row) =>
        row.id !== savedRowId && normalizeOrderNumberKey(row.orderId) === orderKey
          ? {
              ...row,
              receiptFile: expData.receiptFile,
              receiptUrl: expData.receiptUrl,
              receiptMediaId: expData.receiptMediaId,
            }
          : row
      );
    };

    if (existingId) {
      const baseUpdated = expenses.map((e) =>
        e.id === existingId ? { ...expData, id: existingId } : e
      );
      const updated = applyOrderBillSync(baseUpdated, existingId);
      setExpenses(updated);
      persist('vedh_expenses', updated);
      writeVersionFlag('vedh_expenses_version', EXPENSES_DATA_VERSION);
      addLog('Expense', `Purchase updated: ${expData.title} (₹${expData.amount})`);
      showToast(`Purchase updated: ${expData.title}`);
      return;
    }

    const newExpense: Expense = {
      ...expData,
      id: `pur-${Date.now()}`,
    };
    const updated = applyOrderBillSync([newExpense, ...expenses], newExpense.id);
    setExpenses(updated);
    persist('vedh_expenses', updated);
    writeVersionFlag('vedh_expenses_version', EXPENSES_DATA_VERSION);
    addLog(
      'Expense',
      `Purchase recorded (${newExpense.platform || 'Direct'}): ${newExpense.title} (₹${newExpense.amount})`
    );
    showToast(`Purchase recorded: ${newExpense.title}`);
  };

  const handleAttachPurchaseMedia = (
    updates: PurchaseMediaUpdateItem[],
    summaryMsg?: string
  ) => {
    if (updates.length === 0) return;
    const byId = new Map(updates.map((u) => [u.id, u]));
    const updated = expenses.map((exp) => {
      const patch = byId.get(exp.id);
      if (!patch) return exp;
      const hasBillPatch =
        'receiptFile' in patch || 'receiptUrl' in patch || 'receiptMediaId' in patch;
      const hasImagePatch =
        'imageRef' in patch || 'imageUrl' in patch || 'imageMediaId' in patch;
      return {
        ...exp,
        ...(hasBillPatch
          ? {
              receiptFile: patch.receiptFile,
              receiptUrl: patch.receiptUrl,
              receiptMediaId: patch.receiptMediaId,
            }
          : {}),
        ...(hasImagePatch
          ? {
              imageRef: patch.imageRef,
              imageUrl: patch.imageUrl,
              imageMediaId: patch.imageMediaId,
            }
          : {}),
      };
    });

    setExpenses(updated);
    persist('vedh_expenses', updated);
    writeVersionFlag('vedh_expenses_version', EXPENSES_DATA_VERSION);
    const logMsg = summaryMsg || `Updated attachments on ${updates.length} purchase(s)`;
    addLog('Expense', logMsg);
    showToast(logMsg);
  };

  const handleUpdateExpenseStatus = (id: string, purchaseStatus: string) => {
    const target = expenses.find((e) => e.id === id);
    const updated = expenses.map((e) => (e.id === id ? { ...e, purchaseStatus } : e));
    setExpenses(updated);
    persist('vedh_expenses', updated);
    if (target) {
      addLog('Expense', `Purchase status for ${target.title} updated to ${purchaseStatus}`);
      showToast(`${target.title} marked ${purchaseStatus}`);
    }
  };

  const handleDeleteExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    persist('vedh_expenses', updated);
    if (target) {
      addLog('Expense', `Purchase deleted: ${target.title} (₹${target.amount})`);
      showToast(`Deleted purchase: ${target.title}`);
    }
  };

  const handleResetExpenseSheet = () => {
    setExpenses(initialExpenses);
    setSuppliers(initialSuppliers);
    persist('vedh_expenses', initialExpenses);
    persist('vedh_suppliers', initialSuppliers);
    writeVersionFlag('vedh_expenses_version', EXPENSES_DATA_VERSION);
    writeVersionFlag('vedh_luxury14290_seeded', '1');
    writeVersionFlag('vedh_luxury14507_seeded', '1');
    addLog('Expense', 'Reloaded cleaned Purchase Sheet defaults');
    showToast('Reloaded default Purchase Sheet');
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
    const updated = customers.filter((c) => c.id !== id);
    setCustomers(updated);
    persist('vedh_customers', updated);
  };

  // Suppliers Handlers
  const handleAddSupplier = (supData: Omit<Supplier, 'id' | 'totalOrders' | 'totalPaid'>) => {
    const newSup: Supplier = {
      ...supData,
      id: `sup-${Date.now()}`,
      totalOrders: 0,
      totalPaid: 0,
    };
    const updated = [newSup, ...suppliers];
    setSuppliers(updated);
    persist('vedh_suppliers', updated);
    addLog('Product', `Material supplier added: ${newSup.name} (${newSup.category})`);
  };

  const handleDeleteSupplier = (id: string) => {
    const updated = suppliers.filter((s) => s.id !== id);
    setSuppliers(updated);
    persist('vedh_suppliers', updated);
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
      const nextOrders = orders.map((o) => {
        if (o.orderNumber === newPay.orderNumber) {
          const nextAdv = o.advancePaid + newPay.amount;
          const nextBal = Math.max(0, o.totalAmount - nextAdv);
          return { ...o, advancePaid: nextAdv, balanceDue: nextBal };
        }
        return o;
      });
      setOrders(nextOrders);
      persist('vedh_orders', nextOrders);
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
        syncDiagnostic={syncDiagnostic}
        lastSavedAt={lastSavedAt}
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
              adjustments={adjustments}
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
              onOpenEnquiryChecker={() => setIsEnquiryCheckerOpen(true)}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView
              orders={orders}
              products={products}
              recipes={recipes}
              inventory={inventory}
              expenses={expenses}
              adjustments={adjustments}
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
              onOpenEnquiryChecker={() => setIsEnquiryCheckerOpen(true)}
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
              expenses={expenses}
              adjustments={adjustments}
              unitOptions={getActiveOptions('unit')}
              selectedProductName={selectedRecipeProductName}
              onSelectProductName={(name) => setSelectedRecipeProductName(name)}
              onAddIngredient={handleAddRecipeIngredient}
              onUpdateIngredient={handleUpdateRecipeIngredient}
              onDeleteIngredient={handleDeleteRecipeIngredient}
              onCloneRecipe={handleCloneRecipe}
              onUpdateInventoryMaterial={handleUpdateInventoryMaterial}
              onOpenEnquiryChecker={() => setIsEnquiryCheckerOpen(true)}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              inventory={inventory}
              products={products}
              recipes={recipes}
              orders={orders}
              expenses={expenses}
              adjustments={adjustments}
              adjustmentReasons={getActiveOptions('adjustment_reason')}
              onOpenNewStock={() => setIsNewStockOpen(true)}
              onAdjustStock={handleAdjustStock}
              onUpdateInventoryMaterial={handleUpdateInventoryMaterial}
              onAddAdjustment={handleAddAdjustment}
              onOpenEnquiryChecker={() => setIsEnquiryCheckerOpen(true)}
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
              onAttachPurchaseMedia={handleAttachPurchaseMedia}
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

          {activeTab === 'settings' && (
            <SettingsView syncDiagnostic={syncDiagnostic} lastSavedAt={lastSavedAt} />
          )}

          {activeTab === 'history' && <HistoryView logs={history} />}
        </main>

        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-5 right-5 z-50 bg-[#541523] text-[#F3E3B5] border border-[#D4AF37]/40 shadow-lg rounded-xl px-4 py-2.5 text-xs font-medium flex items-center space-x-2"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
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
          key={editingOrder?.id ?? 'new-order'}
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
          key={editingProduct?.id ?? 'new-product'}
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
          key={editingExpense?.id ?? 'new-expense'}
          initialExpense={editingExpense}
          platforms={getActiveOptions('platform')}
          categories={getActiveOptions('category')}
          paymentModes={getActiveOptions('payment_mode')}
          purchaseStatuses={getActiveOptions('purchase_status')}
          stockItemOptions={inventory.map((i) => i.name)}
          onClose={() => {
            setIsNewExpenseOpen(false);
            setEditingExpense(null);
          }}
          onSave={handleSaveExpense}
        />
      )}

      {isEnquiryCheckerOpen && (
        <OrderEnquiryCheckerModal
          products={products}
          recipes={recipes}
          inventory={inventory}
          ledgerByMaterialKey={
            computeInventoryLedgerMetrics(inventory, recipes, orders, expenses, adjustments, products)
              .ledgerByMaterialKey
          }
          onClose={() => setIsEnquiryCheckerOpen(false)}
        />
      )}
    </div>
  );
}
