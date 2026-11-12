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

import InvoiceModal, { InvoiceOrderDetailsPatch } from '@/components/InvoiceModal';
import NewOrderModal from '@/components/NewOrderModal';
import NewProductModal from '@/components/NewProductModal';
import NewStockModal from '@/components/NewStockModal';
import NewExpenseModal from '@/components/NewExpenseModal';
import OrderEnquiryCheckerModal from '@/components/OrderEnquiryCheckerModal';
import CustomerModal, { CustomerFormPayload } from '@/components/CustomerModal';

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
  buildCombinedInvoiceOrder,
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
  ALL_STUDIO_SECTIONS,
  DEFAULT_STUDIO_SETTINGS,
  EXPENSES_DATA_VERSION,
  OPR_DATA_VERSION,
  StudioSectionKey,
  StudioSettings,
  SupabaseSyncDiagnostic,
  hydrateAllStudioSectionsFromCloud,
  persistStudioKey,
  probeSupabaseSchemaStatus,
  readVersionFlag,
  registerSyncLifecycleListeners,
  subscribeStudioSync,
  subscribeSupabaseStudioRealtime,
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
  const historyRef = useRef<HistoryLog[]>(initialHistory);
  const [masterLists, setMasterLists] = useState<MasterListGroup[]>(initialMasterLists);
  const [studioSettings, setStudioSettings] = useState<StudioSettings>(DEFAULT_STUDIO_SETTINGS);

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
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [prefillOrderCustomer, setPrefillOrderCustomer] = useState<Customer | null>(null);
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

  // Hydrate from localStorage on client mount, then synchronize with Supabase Cloud & Realtime
  useEffect(() => {
    let active = true;

    let localOrders: Order[] = initialOrders;
    let localProducts: Product[] = initialProducts;
    let localInventory: InventoryItem[] = initialInventory;
    let localAdjustments: StockAdjustment[] = initialAdjustments;
    let localRecipes: RecipeIngredient[] = initialRecipes;
    let localCustomers: Customer[] = initialCustomers;
    let localSuppliers: Supplier[] = initialSuppliers;
    let localExpenses: Expense[] = initialExpenses;
    let localPayments: Payment[] = initialPayments;
    let localMasterLists: MasterListGroup[] = initialMasterLists;
    let localHistory: HistoryLog[] = initialHistory;
    let localSettings: StudioSettings = DEFAULT_STUDIO_SETTINGS;

    let hadSavedOpr = false;
    let hadSavedExpenses = false;
    let hadSavedSuppliers = false;
    let hadSavedMasterLists = false;
    let hadSavedHistory = false;
    let hadSavedSettings = false;

    try {
      // Upgrade Orders / Products / Recipes / Inventory once to the audited clean workbook v4.0_clean
      const oprVer = readVersionFlag('vedh_opr_version');
      if (oprVer === OPR_DATA_VERSION) {
        hadSavedOpr = Boolean(localStorage.getItem('vedh_orders'));
        writeVersionFlag('vedh_opr_version', OPR_DATA_VERSION);
        const savedOrders = localStorage.getItem('vedh_orders');
        localOrders = savedOrders ? JSON.parse(savedOrders) : initialOrders;
        setOrders(localOrders);

        const savedProducts = localStorage.getItem('vedh_products');
        if (savedProducts) {
          localProducts = JSON.parse(savedProducts);
          setProducts(localProducts);
        }

        const savedInventory = localStorage.getItem('vedh_inventory');
        if (savedInventory) {
          localInventory = JSON.parse(savedInventory);
          setInventory(localInventory);
        }

        const savedAdjustments = localStorage.getItem('vedh_adjustments');
        if (savedAdjustments) {
          localAdjustments = JSON.parse(savedAdjustments);
          setAdjustments(localAdjustments);
        }

        const savedRecipes = localStorage.getItem('vedh_recipes');
        if (savedRecipes) {
          localRecipes = JSON.parse(savedRecipes);
          setRecipes(localRecipes);
        }

        const savedCustomers = localStorage.getItem('vedh_customers');
        if (savedCustomers) {
          localCustomers = JSON.parse(savedCustomers);
          setCustomers(localCustomers);
        } else {
          localCustomers = buildCustomersFromOrders(localOrders);
          setCustomers(localCustomers);
        }

        const savedPayments = localStorage.getItem('vedh_payments');
        if (savedPayments) {
          localPayments = JSON.parse(savedPayments);
          setPayments(localPayments);
        }
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
      const seeded14901Media = readVersionFlag('vedh_luxury14901_media_seeded') === '2';
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

        if (!seeded14901Media) {
          const seeds14901 = initialExpenses.filter(
            (e) => e.id === 'pur-087' || e.id === 'pur-088' || e.id === 'pur-089'
          );
          const seed14901ById = new Map(seeds14901.map((e) => [e.id, e]));
          let hasAny14901 = false;

          loadedExpenses = loadedExpenses.map((exp) => {
            const byId = seed14901ById.get(exp.id);
            const byOrderAndTitle =
              !byId && normalizeOrderNumberKey(exp.orderId) === '14901'
                ? seeds14901.find((s) =>
                    exp.title.toLowerCase().includes(s.title.toLowerCase().slice(0, 10))
                  )
                : undefined;
            const src = byId || byOrderAndTitle;
            if (!src) {
              if (normalizeOrderNumberKey(exp.orderId) === '14901') hasAny14901 = true;
              return exp;
            }
            hasAny14901 = true;
            const next = { ...exp };
            if (!next.receiptMediaId && !next.receiptUrl && src.receiptUrl) {
              next.receiptFile = src.receiptFile;
              next.receiptUrl = src.receiptUrl;
              next.invoiceNo = src.invoiceNo;
              modifiedExpenses = true;
            }
            if (!next.imageMediaId && !next.imageUrl && src.imageUrl) {
              next.imageRef = src.imageRef;
              next.imageUrl = src.imageUrl;
              modifiedExpenses = true;
            }
            return next;
          });

          if (!hasAny14901 && seeds14901.length > 0) {
            const insertIdx = loadedExpenses.findIndex((e) => (e.date || '') < '2026-10-28');
            loadedExpenses =
              insertIdx === -1
                ? [...loadedExpenses, ...seeds14901]
                : [
                    ...loadedExpenses.slice(0, insertIdx),
                    ...seeds14901,
                    ...loadedExpenses.slice(insertIdx),
                  ];
            modifiedExpenses = true;
          }

          writeVersionFlag('vedh_luxury14901_media_seeded', '2');
        }

        if (modifiedExpenses) {
          persistStudioKey('vedh_expenses', loadedExpenses, { skipCloud: true });
        }
        localExpenses = loadedExpenses;
        hadSavedExpenses = true;
        setExpenses(loadedExpenses);
      } else {
        localStorage.setItem('vedh_expenses', JSON.stringify(initialExpenses));
        writeVersionFlag('vedh_expenses_version', EXPENSES_DATA_VERSION);
        writeVersionFlag('vedh_luxury14290_seeded', '1');
        writeVersionFlag('vedh_luxury14507_seeded', '1');
        writeVersionFlag('vedh_luxury14901_media_seeded', '2');
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
            if (changed) {
              persistStudioKey('vedh_suppliers', loadedSuppliers, { skipCloud: true });
            }
          }
        }
        localSuppliers = loadedSuppliers;
        hadSavedSuppliers = true;
        setSuppliers(loadedSuppliers);
      }

      const savedMasterLists = localStorage.getItem('vedh_master_lists');
      if (savedMasterLists) {
        hadSavedMasterLists = true;
        const parsedLists: MasterListGroup[] = JSON.parse(savedMasterLists);
        const platformDefault = initialMasterLists.find((g) => g.key === 'platform');
        if (platformDefault && !parsedLists.some((g) => g.key === 'platform')) {
          const merged = [...parsedLists, platformDefault];
          localMasterLists = merged;
          setMasterLists(merged);
          localStorage.setItem('vedh_master_lists', JSON.stringify(merged));
        } else {
          localMasterLists = parsedLists;
          setMasterLists(parsedLists);
        }
      }

      const savedHistory = localStorage.getItem('vedh_history');
      if (savedHistory) {
        hadSavedHistory = true;
        const parsedHistory: HistoryLog[] = JSON.parse(savedHistory);
        localHistory = parsedHistory;
        historyRef.current = parsedHistory;
        setHistory(parsedHistory);
      }

      const savedSettings = localStorage.getItem('vedh_settings');
      if (savedSettings) {
        hadSavedSettings = true;
        localSettings = { ...DEFAULT_STUDIO_SETTINGS, ...JSON.parse(savedSettings) };
        setStudioSettings(localSettings);
      }
    } catch {
      // LocalStorage access restricted or empty
    }

    registerSyncLifecycleListeners({
      onCloudSaved: () => {
        if (active) setLastSavedAt(formatSaveClock());
      },
      onSyncDiagnostic: (diag) => {
        if (active) setSyncDiagnostic(diag);
      },
    });

    const sectionSetters: Record<StudioSectionKey, (parsed: any) => void> = {
      orders: setOrders,
      products: setProducts,
      recipes: setRecipes,
      inventory: setInventory,
      adjustments: setAdjustments,
      expenses: setExpenses,
      customers: setCustomers,
      suppliers: setSuppliers,
      payments: setPayments,
      master_lists: setMasterLists,
      history: (val: HistoryLog[]) => {
        historyRef.current = val;
        setHistory(val);
      },
      settings: (val: StudioSettings) => {
        setStudioSettings({ ...DEFAULT_STUDIO_SETTINGS, ...val });
      },
    };

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
      vedh_history: sectionSetters.history,
      vedh_settings: sectionSetters.settings,
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

    let unsubscribeRealtime = () => {};

    void (async () => {
      const diag = await probeSupabaseSchemaStatus();
      if (!active) return;
      setSyncDiagnostic(diag);

      const resolved = await hydrateAllStudioSectionsFromCloud({
        orders: {
          localCandidate: localOrders,
          factoryDefault: initialOrders,
          dataVersion: OPR_DATA_VERSION,
          shouldRescueLocal: hadSavedOpr,
        },
        products: {
          localCandidate: localProducts,
          factoryDefault: initialProducts,
          dataVersion: OPR_DATA_VERSION,
          shouldRescueLocal: hadSavedOpr,
        },
        recipes: {
          localCandidate: localRecipes,
          factoryDefault: initialRecipes,
          dataVersion: OPR_DATA_VERSION,
          shouldRescueLocal: hadSavedOpr,
        },
        inventory: {
          localCandidate: localInventory,
          factoryDefault: initialInventory,
          dataVersion: OPR_DATA_VERSION,
          shouldRescueLocal: hadSavedOpr,
        },
        adjustments: {
          localCandidate: localAdjustments,
          factoryDefault: initialAdjustments,
          dataVersion: OPR_DATA_VERSION,
          shouldRescueLocal: hadSavedOpr,
        },
        expenses: {
          localCandidate: localExpenses,
          factoryDefault: initialExpenses,
          dataVersion: EXPENSES_DATA_VERSION,
          shouldRescueLocal: hadSavedExpenses,
        },
        customers: {
          localCandidate: localCustomers,
          factoryDefault: initialCustomers,
          dataVersion: OPR_DATA_VERSION,
          shouldRescueLocal: hadSavedOpr,
        },
        suppliers: {
          localCandidate: localSuppliers,
          factoryDefault: initialSuppliers,
          dataVersion: EXPENSES_DATA_VERSION,
          shouldRescueLocal: hadSavedSuppliers,
        },
        payments: {
          localCandidate: localPayments,
          factoryDefault: initialPayments,
          dataVersion: OPR_DATA_VERSION,
          shouldRescueLocal: hadSavedOpr,
        },
        master_lists: {
          localCandidate: localMasterLists,
          factoryDefault: initialMasterLists,
          dataVersion: OPR_DATA_VERSION,
          shouldRescueLocal: hadSavedMasterLists,
        },
        history: {
          localCandidate: localHistory,
          factoryDefault: initialHistory,
          dataVersion: OPR_DATA_VERSION,
          shouldRescueLocal: hadSavedHistory,
        },
        settings: {
          localCandidate: localSettings,
          factoryDefault: DEFAULT_STUDIO_SETTINGS,
          dataVersion: OPR_DATA_VERSION,
          shouldRescueLocal: hadSavedSettings,
        },
      });

      if (!active) return;
      if (resolved) {
        for (const section of ALL_STUDIO_SECTIONS) {
          if (resolved[section] !== undefined) {
            sectionSetters[section](resolved[section]);
          }
        }
        setLastSavedAt(formatSaveClock());
      }

      unsubscribeRealtime = subscribeSupabaseStudioRealtime({
        onSectionData: (section, data) => {
          if (!active) return;
          sectionSetters[section]?.(data);
          setLastSavedAt(formatSaveClock());
        },
        onStatusChange: (nextDiag) => {
          if (active) setSyncDiagnostic(nextDiag);
        },
      });
    })();

    return () => {
      active = false;
      unsubscribe();
      unsubscribeRealtime();
      registerSyncLifecycleListeners({});
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Save changes to localStorage, cross-tab channel, and Supabase Cloud
  const persist = (key: string, data: any) => {
    if (persistStudioKey(key, data)) {
      queueMicrotask(() => setLastSavedAt(formatSaveClock()));
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
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category,
      description,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    const next = [newLog, ...historyRef.current].slice(0, 200);
    historyRef.current = next;
    setHistory(next);
    persist('vedh_history', next);
  };

  const handleSaveSettings = (nextSettings: StudioSettings) => {
    setStudioSettings(nextSettings);
    persist('vedh_settings', nextSettings);
    addLog('All', `Updated studio settings (${nextSettings.businessName} · ${nextSettings.currency})`);
    showToast('Business settings saved and synced');
  };

  // Order Handlers
  const syncCustomersFromOrdersList = (
    nextOrders: Order[],
    baseCustomers: Customer[] = customers
  ) => {
    const nextCustomers = buildCustomersFromOrders(nextOrders, baseCustomers);
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
      const updatedCustomerBase = customers.map((c) => {
        if (normalizeNameKey(c.name) !== normalizeNameKey(orderData.customerName)) return c;
        return {
          ...c,
          ...(orderData.customerPhone?.trim() ? { phone: orderData.customerPhone.trim() } : {}),
          ...(orderData.customerEmail?.trim() ? { email: orderData.customerEmail.trim() } : {}),
          ...(orderData.customerLocation?.trim() ? { city: orderData.customerLocation.trim() } : {}),
        };
      });
      syncCustomersFromOrdersList(updated, updatedCustomerBase);

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
    const updatedCustomerBase = customers.map((c) => {
      if (normalizeNameKey(c.name) !== normalizeNameKey(newOrder.customerName)) return c;
      return {
        ...c,
        ...(newOrder.customerPhone?.trim() ? { phone: newOrder.customerPhone.trim() } : {}),
        ...(newOrder.customerEmail?.trim() ? { email: newOrder.customerEmail.trim() } : {}),
        ...(newOrder.customerLocation?.trim() ? { city: newOrder.customerLocation.trim() } : {}),
      };
    });
    syncCustomersFromOrdersList(updated, updatedCustomerBase);

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

  const handleSaveOrderInvoiceDetails = (
    targetOrder: Order,
    patch: InvoiceOrderDetailsPatch
  ) => {
    const groupKey = `${targetOrder.orderNumber.trim().toUpperCase()}__${normalizeNameKey(
      targetOrder.customerName
    )}__${targetOrder.createdAt}`;
    const updated = orders.map((o) => {
      const k = `${o.orderNumber.trim().toUpperCase()}__${normalizeNameKey(
        o.customerName
      )}__${o.createdAt}`;
      if (k !== groupKey) return o;
      return {
        ...o,
        ...(patch.customerLocation !== undefined
          ? { customerLocation: patch.customerLocation }
          : {}),
        ...(patch.deliveredOn !== undefined ? { deliveredOn: patch.deliveredOn } : {}),
        ...(patch.targetDeliveryDate !== undefined
          ? { targetDeliveryDate: patch.targetDeliveryDate }
          : {}),
        ...(patch.shipping !== undefined ? { shipping: patch.shipping } : {}),
        ...(patch.tax !== undefined ? { tax: patch.tax } : {}),
        ...(patch.invoiceNumber !== undefined ? { invoiceNumber: patch.invoiceNumber } : {}),
      };
    });
    setOrders(updated);
    persist('vedh_orders', updated);
    const updatedCustomerBase =
      patch.customerLocation !== undefined
        ? customers.map((c) =>
            normalizeNameKey(c.name) === normalizeNameKey(targetOrder.customerName)
              ? { ...c, city: patch.customerLocation?.trim() || c.city }
              : c
          )
        : customers;
    syncCustomersFromOrdersList(updated, updatedCustomerBase);
    const refreshedMatch = updated.find((o) => o.id === targetOrder.id) || targetOrder;
    setSelectedOrderForInvoice(buildCombinedInvoiceOrder(refreshedMatch, updated));
    addLog(
      'Order',
      `Updated invoice details for ${targetOrder.orderNumber} (${targetOrder.customerName})`
    );
    showToast(`Saved invoice details for ${targetOrder.orderNumber}`);
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
    writeVersionFlag('vedh_luxury14901_media_seeded', '2');
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
  const handleSaveCustomer = (data: CustomerFormPayload, existingId?: string) => {
    const cleanPhoneVal = (v?: string) => {
      const trimmed = (v || '').trim();
      return trimmed && trimmed !== '—' && trimmed !== '-' ? trimmed : '';
    };

    const newKey = normalizeNameKey(data.name);
    const targetExisting = existingId
      ? customers.find((c) => c.id === existingId)
      : customers.find((c) => normalizeNameKey(c.name) === newKey);

    if (targetExisting) {
      const oldKey = normalizeNameKey(targetExisting.name);
      const oldPhone = cleanPhoneVal(targetExisting.phone);
      const oldEmail = (targetExisting.email || '').trim();
      const oldLocation = targetExisting.pincode?.trim()
        ? `${(targetExisting.city || '').trim()} - ${targetExisting.pincode.trim()}`
        : (targetExisting.city || '').trim();

      const nextPhone = cleanPhoneVal(data.phone) || cleanPhoneVal(data.whatsappNumber) || '—';
      const nextEmail = data.email?.trim() || undefined;
      const nextCity = data.city?.trim() || undefined;
      const nextFullLocation =
        nextCity && data.pincode?.trim()
          ? `${nextCity} - ${data.pincode.trim()}`
          : nextCity || '';

      const updatedCustomer: Customer = {
        ...targetExisting,
        ...data,
        id: targetExisting.id,
        phone: nextPhone,
      };

      let nextCustomers = customers.map((c) =>
        c.id === targetExisting.id ? updatedCustomer : c
      );

      // Keep linked orders & payments in sync when customer details or name change
      let ordersChanged = false;
      const updatedOrders = orders.map((o) => {
        if (normalizeNameKey(o.customerName) !== oldKey) return o;
        const patch: Partial<Order> = {};
        if (data.name !== targetExisting.name) {
          patch.customerName = data.name;
        }
        const curOrderPhone = cleanPhoneVal(o.customerPhone);
        const resolvedPhone = cleanPhoneVal(nextPhone);
        if (resolvedPhone && (!curOrderPhone || curOrderPhone === oldPhone)) {
          patch.customerPhone = resolvedPhone;
        }
        const curOrderEmail = (o.customerEmail || '').trim();
        if (nextEmail && (!curOrderEmail || curOrderEmail === oldEmail)) {
          patch.customerEmail = nextEmail;
        }
        const curOrderLoc = (o.customerLocation || '').trim();
        if (nextFullLocation && (!curOrderLoc || curOrderLoc === oldLocation || curOrderLoc === (targetExisting.city || '').trim())) {
          patch.customerLocation = nextFullLocation;
        }
        if (Object.keys(patch).length === 0) return o;
        ordersChanged = true;
        return { ...o, ...patch };
      });

      if (ordersChanged) {
        setOrders(updatedOrders);
        persist('vedh_orders', updatedOrders);
        nextCustomers = buildCustomersFromOrders(updatedOrders, nextCustomers);
      }

      if (newKey !== oldKey) {
        const updatedPayments = payments.map((p) =>
          normalizeNameKey(p.customerName) === oldKey ? { ...p, customerName: data.name } : p
        );
        setPayments(updatedPayments);
        persist('vedh_payments', updatedPayments);
      }

      setCustomers(nextCustomers);
      persist('vedh_customers', nextCustomers);
      addLog('Customer', `Customer profile updated: ${data.name} (${data.type})`);
      showToast(`Saved customer "${data.name}" & synced with Orders`);
      return;
    }

    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      phone: cleanPhoneVal(data.phone) || cleanPhoneVal(data.whatsappNumber) || '—',
      totalOrders: 0,
      totalSpent: 0,
    };
    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    persist('vedh_customers', updated);
    addLog(
      'Customer',
      `Customer added: ${newCustomer.name}${newCustomer.instagramHandle ? ` (${newCustomer.instagramHandle})` : ''}`
    );
    showToast(`Added customer "${newCustomer.name}"`);
  };

  const handleDeleteCustomer = (id: string) => {
    const target = customers.find((c) => c.id === id);
    const updated = customers.filter((c) => c.id !== id);
    setCustomers(updated);
    persist('vedh_customers', updated);
    if (target) {
      addLog('Customer', `Customer removed: ${target.name}`);
      showToast(`Deleted customer "${target.name}"`);
    }
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
  const handleQuickAdd = (
    type: 'order' | 'product' | 'stock' | 'expense' | 'recipe' | 'customer'
  ) => {
    if (type === 'order') {
      setEditingOrder(null);
      setPrefillOrderCustomer(null);
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
    if (type === 'customer') {
      setEditingCustomer(null);
      setIsNewCustomerOpen(true);
    }
  };

  const openOrdersBadgeCount = orders.filter((o) => isOrderOpen(o.status)).length;
  const lowStockBadgeCount = inventory.filter((i) => i.stock <= i.reorderLevel).length;

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex print:block print:min-h-0 print:bg-transparent">
      {/* Persistent Burgundy Sidebar */}
      <div className={selectedOrderForInvoice ? 'no-print' : undefined}>
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
      </div>

      {/* Main Content Area */}
      <div
        className={`flex-1 lg:pl-64 flex flex-col min-w-0 ${
          selectedOrderForInvoice ? 'no-print' : ''
        }`}
      >
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
                setPrefillOrderCustomer(null);
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
                setPrefillOrderCustomer(null);
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
              customers={customers}
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
              onOpenNewCustomer={() => {
                setEditingCustomer(null);
                setIsNewCustomerOpen(true);
              }}
              onEditCustomer={(cust) => {
                setEditingCustomer(cust);
                setIsNewCustomerOpen(true);
              }}
              onDeleteCustomer={handleDeleteCustomer}
              onCreateOrderForCustomer={(cust) => {
                setEditingOrder(null);
                setPrefillOrderCustomer(cust);
                setIsNewOrderOpen(true);
              }}
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
            <SettingsView
              settings={studioSettings}
              onSaveSettings={handleSaveSettings}
              syncDiagnostic={syncDiagnostic}
              lastSavedAt={lastSavedAt}
            />
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
          customers={customers}
          onSaveOrderInvoiceDetails={handleSaveOrderInvoiceDetails}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}

      {isNewOrderOpen && (
        <NewOrderModal
          key={editingOrder?.id ?? prefillOrderCustomer?.id ?? 'new-order'}
          products={products}
          customers={customers}
          paymentModes={getActiveOptions('payment_mode')}
          orderStatuses={getActiveOptions('order_status')}
          initialOrder={editingOrder}
          prefillCustomer={prefillOrderCustomer}
          onClose={() => {
            setIsNewOrderOpen(false);
            setEditingOrder(null);
            setPrefillOrderCustomer(null);
          }}
          onSave={handleSaveOrder}
        />
      )}

      {isNewCustomerOpen && (
        <CustomerModal
          key={editingCustomer?.id ?? 'new-customer'}
          initialCustomer={editingCustomer}
          existingCustomers={customers}
          onClose={() => {
            setIsNewCustomerOpen(false);
            setEditingCustomer(null);
          }}
          onSave={handleSaveCustomer}
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
