import { isSupabaseConfigured, supabase } from './supabase';
import type { Customer, Order } from './types';

export const OPR_DATA_VERSION = '4.0_clean';
export const EXPENSES_DATA_VERSION = '4.0_clean';
export const STUDIO_SYNC_CHANNEL = 'vedh_studio_sync';
export const STUDIO_CLOUD_MIGRATION_KEY = 'vedh_cloud_migrated_v2';

export type StudioSectionKey =
  | 'orders'
  | 'products'
  | 'recipes'
  | 'inventory'
  | 'adjustments'
  | 'expenses'
  | 'customers'
  | 'suppliers'
  | 'payments'
  | 'master_lists'
  | 'history'
  | 'settings';

export const ALL_STUDIO_SECTIONS: StudioSectionKey[] = [
  'orders',
  'products',
  'recipes',
  'inventory',
  'adjustments',
  'expenses',
  'customers',
  'suppliers',
  'payments',
  'master_lists',
  'history',
  'settings',
];

export const KEY_TO_SECTION: Record<string, StudioSectionKey> = {
  vedh_orders: 'orders',
  vedh_products: 'products',
  vedh_recipes: 'recipes',
  vedh_inventory: 'inventory',
  vedh_adjustments: 'adjustments',
  vedh_expenses: 'expenses',
  vedh_customers: 'customers',
  vedh_suppliers: 'suppliers',
  vedh_payments: 'payments',
  vedh_master_lists: 'master_lists',
  vedh_history: 'history',
  vedh_settings: 'settings',
};

export const SECTION_TO_KEY: Record<StudioSectionKey, string> = {
  orders: 'vedh_orders',
  products: 'vedh_products',
  recipes: 'vedh_recipes',
  inventory: 'vedh_inventory',
  adjustments: 'vedh_adjustments',
  expenses: 'vedh_expenses',
  customers: 'vedh_customers',
  suppliers: 'vedh_suppliers',
  payments: 'vedh_payments',
  master_lists: 'vedh_master_lists',
  history: 'vedh_history',
  settings: 'vedh_settings',
};

export interface StudioSettings {
  businessName: string;
  currency: string;
  showLowStock: boolean;
  tagline: string;
}

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  businessName: 'VEDH Artistry',
  currency: 'INR (₹)',
  showLowStock: true,
  tagline: 'Little things, made meaningful',
};

export interface SupabaseSyncDiagnostic {
  mode: 'local' | 'checking' | 'connected' | 'rls-blocked' | 'schema-pending' | 'error';
  sidebarTitle: string;
  sidebarSubtitle: string;
  settingsHeading: string;
  settingsDetail: string;
}

interface CloudRecordRow {
  section: StudioSectionKey;
  record_id: string;
  sort_order: number;
  payload: Record<string, unknown>;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface CloudMetaRow {
  section: StudioSectionKey;
  data_version: string;
  reset_epoch?: number;
}

const DEFAULT_LOCAL_DIAGNOSTIC: SupabaseSyncDiagnostic = {
  mode: 'local',
  sidebarTitle: 'Local Storage Mode',
  sidebarSubtitle: 'Offline browser workspace · Cross-tab live sync active.',
  settingsHeading: 'Offline Browser Workspace Active',
  settingsDetail:
    'Changes update immediately across open tabs in this browser. Configure Supabase environment variables to enable live multi-device cloud sync.',
};

const SENDER_TAB_ID =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tab-${Math.random().toString(36).slice(2)}-${Date.now()}`;

const MAX_HISTORY_RECORDS = 200;
const CHUNK_SIZE = 100;

// In-memory snapshot state per section used to compute minimal O(changed) cloud diffs
const recordPayloads = new Map<StudioSectionKey, Map<string, string>>();
const recordSortOrders = new Map<StudioSectionKey, Map<string, number>>();
const recordObjects = new Map<
  StudioSectionKey,
  Map<string, { sortOrder: number; item: Record<string, unknown> }>
>();
const sectionSyncChains = new Map<StudioSectionKey, Promise<void>>();
const dirtySections = new Set<StudioSectionKey>();
const dirtySectionLatestData = new Map<StudioSectionKey, unknown>();

let hydrationComplete = false;
let hydrationInFlight: Promise<Partial<Record<StudioSectionKey, unknown>> | null> | null = null;
let lastCloudSignature = '';

let activeListeners: {
  onCloudSaved?: () => void;
  onSyncDiagnostic?: (diag: SupabaseSyncDiagnostic) => void;
} = {};

export function registerSyncLifecycleListeners(listeners: {
  onCloudSaved?: () => void;
  onSyncDiagnostic?: (diag: SupabaseSyncDiagnostic) => void;
}) {
  activeListeners = listeners;
}

function getPayloadMap(section: StudioSectionKey): Map<string, string> {
  let m = recordPayloads.get(section);
  if (!m) {
    m = new Map();
    recordPayloads.set(section, m);
  }
  return m;
}

function getSortMap(section: StudioSectionKey): Map<string, number> {
  let m = recordSortOrders.get(section);
  if (!m) {
    m = new Map();
    recordSortOrders.set(section, m);
  }
  return m;
}

function getObjectMap(
  section: StudioSectionKey
): Map<string, { sortOrder: number; item: Record<string, unknown> }> {
  let m = recordObjects.get(section);
  if (!m) {
    m = new Map();
    recordObjects.set(section, m);
  }
  return m;
}

function canonicalStringify(value: unknown): string {
  return JSON.stringify(value);
}

function normalizeSectionData(section: StudioSectionKey, data: unknown): unknown {
  if (section === 'settings') {
    const raw = (data && typeof data === 'object' ? data : {}) as Partial<StudioSettings>;
    return {
      businessName: raw.businessName ?? DEFAULT_STUDIO_SETTINGS.businessName,
      currency: raw.currency ?? DEFAULT_STUDIO_SETTINGS.currency,
      showLowStock:
        typeof raw.showLowStock === 'boolean'
          ? raw.showLowStock
          : DEFAULT_STUDIO_SETTINGS.showLowStock,
      tagline: raw.tagline ?? DEFAULT_STUDIO_SETTINGS.tagline,
    };
  }
  if (!Array.isArray(data)) return [];
  if (section === 'history' && data.length > MAX_HISTORY_RECORDS) {
    return data.slice(0, MAX_HISTORY_RECORDS);
  }
  return data;
}

function toCloudEntries(
  section: StudioSectionKey,
  data: unknown
): Array<{ id: string; payload: Record<string, unknown> }> {
  const normalized = normalizeSectionData(section, data);
  if (section === 'settings') {
    return [
      {
        id: 'default',
        payload: { id: 'default', ...(normalized as Record<string, unknown>) },
      },
    ];
  }
  if (!Array.isArray(normalized)) return [];
  const entries: Array<{ id: string; payload: Record<string, unknown> }> = [];
  const seen = new Set<string>();
  for (const rawItem of normalized) {
    if (!rawItem || typeof rawItem !== 'object') continue;
    const item = rawItem as Record<string, unknown>;
    const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    // Clean round-trip strips undefined properties to match JSONB storage identically
    entries.push({ id, payload: JSON.parse(JSON.stringify(item)) as Record<string, unknown> });
  }
  return entries;
}

function fromCloudObjectMap(section: StudioSectionKey): unknown {
  const objMap = getObjectMap(section);
  if (section === 'settings') {
    const rec = objMap.get('default');
    if (!rec) return { ...DEFAULT_STUDIO_SETTINGS };
    const { businessName, currency, showLowStock, tagline } = rec.item as Partial<StudioSettings>;
    return normalizeSectionData('settings', {
      businessName,
      currency,
      showLowStock,
      tagline,
    });
  }
  const list = Array.from(objMap.entries())
    .sort((a, b) => a[1].sortOrder - b[1].sortOrder || a[0].localeCompare(b[0]))
    .map(([, entry]) => entry.item);
  if (section === 'history' && list.length > MAX_HISTORY_RECORDS) {
    return list.slice(0, MAX_HISTORY_RECORDS);
  }
  return list;
}

function assignSortOrders(
  section: StudioSectionKey,
  entries: Array<{ id: string; payload: Record<string, unknown> }>,
  existingSortMap: Map<string, number>
): number[] {
  if (section === 'settings') return entries.map(() => 0);

  if (existingSortMap.size === 0) {
    return entries.map((_, idx) => idx * 100);
  }

  let minKnown = Infinity;
  let maxKnown = -Infinity;
  for (const val of existingSortMap.values()) {
    if (val < minKnown) minKnown = val;
    if (val > maxKnown) maxKnown = val;
  }
  if (!Number.isFinite(minKnown)) minKnown = 0;
  if (!Number.isFinite(maxKnown)) maxKnown = 0;

  const result = new Array<number>(entries.length);
  const nowBase = Date.now();

  // First pass: copy known sort orders
  for (let i = 0; i < entries.length; i++) {
    const known = existingSortMap.get(entries[i].id);
    if (typeof known === 'number' && Number.isFinite(known)) {
      result[i] = known;
    }
  }

  // Second pass: assign positions for new items without shifting existing rows
  let i = 0;
  while (i < entries.length) {
    if (result[i] !== undefined) {
      i++;
      continue;
    }
    const start = i;
    while (i < entries.length && result[i] === undefined) {
      i++;
    }
    const runLen = i - start;
    const prevSort = start > 0 ? result[start - 1] : undefined;
    const nextSort = i < entries.length ? result[i] : undefined;

    if (prevSort === undefined && nextSort !== undefined) {
      // Prepended at the top (e.g. new Order/Expense/Log)
      const anchor = Math.min(-nowBase, nextSort - 1000 - runLen * 10);
      for (let k = 0; k < runLen; k++) {
        result[start + k] = anchor + k * 0.01;
      }
    } else if (prevSort !== undefined && nextSort === undefined) {
      // Appended at the bottom (e.g. Recipe ingredient / Master List group)
      const anchor = Math.max(prevSort + 1000, nowBase);
      for (let k = 0; k < runLen; k++) {
        result[start + k] = anchor + k * 0.01;
      }
    } else if (prevSort !== undefined && nextSort !== undefined && nextSort > prevSort) {
      const step = (nextSort - prevSort) / (runLen + 1);
      for (let k = 0; k < runLen; k++) {
        result[start + k] = prevSort + step * (k + 1);
      }
    } else {
      // No known anchors survived (e.g. full replacement)
      for (let k = 0; k < runLen; k++) {
        result[start + k] = k * 100;
      }
    }
  }

  return result;
}

function recordLocalSnapshot(
  section: StudioSectionKey,
  rows: Array<{ id: string; sortOrder: number; payload: Record<string, unknown> }>
) {
  const payloadMap = getPayloadMap(section);
  const sortMap = getSortMap(section);
  const objMap = getObjectMap(section);

  payloadMap.clear();
  sortMap.clear();
  objMap.clear();

  for (const row of rows) {
    payloadMap.set(row.id, canonicalStringify(row.payload));
    sortMap.set(row.id, row.sortOrder);
    objMap.set(row.id, { sortOrder: row.sortOrder, item: row.payload });
  }
}

/**
 * Reads a version marker from localStorage, normalizing legacy values
 * that may have been JSON-serialized with extra quotes.
 */
export function readVersionFlag(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    if (raw.startsWith('"') && raw.endsWith('"')) {
      return JSON.parse(raw) as string;
    }
    return raw;
  } catch {
    return localStorage.getItem(key);
  }
}

/**
 * Writes an unquoted version marker string to localStorage.
 */
export function writeVersionFlag(key: string, version: string): void {
  try {
    localStorage.setItem(key, version);
  } catch (err) {
    console.warn(`Unable to write Studio version flag "${key}":`, err);
  }
}

function enqueueSectionTask(section: StudioSectionKey, task: () => Promise<void>): Promise<void> {
  const prev = sectionSyncChains.get(section) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(task);
  sectionSyncChains.set(section, next);
  return next;
}

async function syncSectionToSupabase(
  section: StudioSectionKey,
  data: unknown,
  dataVersion?: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const entries = toCloudEntries(section, data);
  const prevPayloads = getPayloadMap(section);
  const prevSorts = getSortMap(section);
  const nextSorts = assignSortOrders(section, entries, prevSorts);

  const toUpsert: Array<{
    section: StudioSectionKey;
    record_id: string;
    sort_order: number;
    payload: Record<string, unknown>;
    updated_by: string;
  }> = [];

  const nextIds = new Set<string>();
  const snapshotRows: Array<{
    id: string;
    sortOrder: number;
    payload: Record<string, unknown>;
  }> = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const sortOrder = nextSorts[i];
    nextIds.add(entry.id);
    snapshotRows.push({ id: entry.id, sortOrder, payload: entry.payload });

    const serialized = canonicalStringify(entry.payload);
    const oldSerialized = prevPayloads.get(entry.id);
    const oldSort = prevSorts.get(entry.id);

    if (oldSerialized !== serialized || oldSort !== sortOrder) {
      toUpsert.push({
        section,
        record_id: entry.id,
        sort_order: sortOrder,
        payload: entry.payload,
        updated_by: SENDER_TAB_ID,
      });
    }
  }

  const toDeleteIds: string[] = [];
  for (const oldId of prevPayloads.keys()) {
    if (!nextIds.has(oldId)) {
      toDeleteIds.push(oldId);
    }
  }

  if (toUpsert.length === 0 && toDeleteIds.length === 0) {
    dirtySections.delete(section);
    dirtySectionLatestData.delete(section);
    return true;
  }

  // Optimistically update in-memory snapshot so rapid sequential calls compute clean diffs
  recordLocalSnapshot(section, snapshotRows);

  try {
    for (let i = 0; i < toDeleteIds.length; i += CHUNK_SIZE) {
      const batch = toDeleteIds.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase
        .from('studio_records')
        .delete()
        .eq('section', section)
        .in('record_id', batch);
      if (error) throw error;
    }

    for (let i = 0; i < toUpsert.length; i += CHUNK_SIZE) {
      const batch = toUpsert.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase
        .from('studio_records')
        .upsert(batch, { onConflict: 'section,record_id' });
      if (error) throw error;
    }

    const { error: metaErr } = await supabase.from('studio_sync_meta').upsert(
      {
        section,
        data_version:
          dataVersion ||
          (section === 'expenses' || section === 'suppliers'
            ? EXPENSES_DATA_VERSION
            : OPR_DATA_VERSION),
      },
      { onConflict: 'section' }
    );
    if (metaErr) throw metaErr;

    dirtySections.delete(section);
    dirtySectionLatestData.delete(section);
    activeListeners.onCloudSaved?.();
    return true;
  } catch (err) {
    console.warn(`Cloud sync failed for section "${section}", queued for retry:`, err);
    dirtySections.add(section);
    dirtySectionLatestData.set(section, normalizeSectionData(section, data));
    activeListeners.onSyncDiagnostic?.({
      mode: 'error',
      sidebarTitle: 'Cloud Retry Queued',
      sidebarSubtitle: 'Saved locally · Will sync to Supabase automatically when reconnected.',
      settingsHeading: 'Cloud Sync Temporarily Unreachable — Retry Queued',
      settingsDetail:
        'Your latest edits are saved locally and queued to push automatically to Supabase as soon as the connection recovers.',
    });
    return false;
  }
}

/**
 * Persists a serialized Studio dataset to localStorage, broadcasts the key
 * across tabs in the same browser, AND syncs changed/deleted records to Supabase
 * in real time so all browsers and devices stay synchronized.
 */
export function persistStudioKey<T>(
  key: string,
  data: T,
  options?: { skipCloud?: boolean; dataVersion?: string }
): boolean {
  let savedLocal = false;
  try {
    const section = KEY_TO_SECTION[key];
    const normalized = section ? normalizeSectionData(section, data) : data;
    localStorage.setItem(key, JSON.stringify(normalized));
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(STUDIO_SYNC_CHANNEL);
      channel.postMessage({ key, senderTabId: SENDER_TAB_ID, timestamp: Date.now() });
      channel.close();
    }
    savedLocal = true;

    if (section && !options?.skipCloud && isSupabaseConfigured && supabase) {
      dirtySections.add(section);
      dirtySectionLatestData.set(section, normalized);
      void enqueueSectionTask(section, async () => {
        if (hydrationInFlight) {
          await hydrationInFlight.catch(() => undefined);
        }
        const latest = dirtySectionLatestData.has(section)
          ? dirtySectionLatestData.get(section)
          : normalized;
        await syncSectionToSupabase(section, latest, options?.dataVersion);
      });
    }
  } catch (err) {
    console.warn(`Unable to persist Studio key "${key}":`, err);
  }
  return savedLocal;
}

/**
 * Subscribes to real-time Studio updates made in other open tabs of the same browser
 * via both `storage` events and `BroadcastChannel`.
 */
export function subscribeStudioSync(onKeyChanged: (key: string) => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key) {
      onKeyChanged(event.key);
    }
  };
  window.addEventListener('storage', onStorage);

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(STUDIO_SYNC_CHANNEL);
    channel.onmessage = (event: MessageEvent<{ key?: string; senderTabId?: string }>) => {
      const payload = event.data;
      if (payload?.key && payload.senderTabId !== SENDER_TAB_ID) {
        onKeyChanged(payload.key);
      }
    };
  }

  return () => {
    window.removeEventListener('storage', onStorage);
    if (channel) {
      channel.close();
    }
  };
}

async function fetchAllCloudRecordsPaged(): Promise<CloudRecordRow[]> {
  if (!supabase) return [];
  const allRows: CloudRecordRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('studio_records')
      .select('section,record_id,sort_order,payload,updated_by,updated_at')
      .order('sort_order', { ascending: true })
      .order('record_id', { ascending: true })
      .range(from, from + 999);

    if (error) throw error;
    const rows = (data ?? []) as CloudRecordRow[];
    allRows.push(...rows);
    if (rows.length < 1000) break;
    from += 1000;
  }

  return allRows;
}

async function fetchCloudSignature(): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, count, error } = await supabase
    .from('studio_records')
    .select('updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) return null;
  const maxUpdated = data?.[0]?.updated_at || '';
  return `${count ?? 0}:${maxUpdated}`;
}

export interface SectionHydrationSpec {
  localCandidate: unknown;
  factoryDefault: unknown;
  dataVersion: string;
  shouldRescueLocal: boolean;
}

/**
 * Hydrates all 12 Studio sections against Supabase cloud storage:
 * - If cloud already initialized a section, loads authoritative cloud data and
 *   performs a one-time non-destructive rescue of any pre-cloud local edits/additions.
 * - If cloud has not yet seeded a section, uploads the local/seed baseline idempotently
 *   with `ON CONFLICT DO NOTHING` so concurrent browsers never create duplicate rows.
 */
export async function hydrateAllStudioSectionsFromCloud(
  specs: Record<StudioSectionKey, SectionHydrationSpec>
): Promise<Partial<Record<StudioSectionKey, unknown>> | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const runHydration = async (): Promise<Partial<Record<StudioSectionKey, unknown>> | null> => {
    try {
      const [{ data: metaRows, error: metaError }, cloudRows] = await Promise.all([
        supabase!.from('studio_sync_meta').select('section,data_version,reset_epoch'),
        fetchAllCloudRecordsPaged(),
      ]);

      if (metaError) throw metaError;

      const metaMap = new Map<StudioSectionKey, CloudMetaRow>();
      for (const m of (metaRows ?? []) as CloudMetaRow[]) {
        metaMap.set(m.section, m);
      }

      const rowsBySection = new Map<StudioSectionKey, CloudRecordRow[]>();
      for (const row of cloudRows) {
        const list = rowsBySection.get(row.section) ?? [];
        list.push(row);
        rowsBySection.set(row.section, list);
      }

      const alreadyMigratedLocal = readVersionFlag(STUDIO_CLOUD_MIGRATION_KEY) === '1';
      const resolved: Partial<Record<StudioSectionKey, unknown>> = {};

      for (const section of ALL_STUDIO_SECTIONS) {
        const spec = specs[section];
        const existingRows = rowsBySection.get(section) ?? [];
        const isSeededInCloud = metaMap.has(section);

        if (isSeededInCloud) {
          const cloudMap = new Map<string, CloudRecordRow>();
          for (const r of existingRows) {
            cloudMap.set(r.record_id, r);
          }

          // One-time pre-cloud rescue: preserve orders/expenses/records created locally before cloud sync
          const rescueUpserts: Array<{
            section: StudioSectionKey;
            record_id: string;
            sort_order: number;
            payload: Record<string, unknown>;
            updated_by: string;
          }> = [];

          if (!alreadyMigratedLocal && spec.shouldRescueLocal) {
            const localEntries = toCloudEntries(section, spec.localCandidate);
            const factoryMap = new Map<string, string>();
            for (const f of toCloudEntries(section, spec.factoryDefault)) {
              factoryMap.set(f.id, canonicalStringify(f.payload));
            }
            const existingSortMap = new Map<string, number>();
            for (const r of existingRows) {
              existingSortMap.set(r.record_id, r.sort_order);
            }
            const localSorts = assignSortOrders(section, localEntries, existingSortMap);

            for (let i = 0; i < localEntries.length; i++) {
              const loc = localEntries[i];
              const cloudRow = cloudMap.get(loc.id);
              const factoryJson = factoryMap.get(loc.id);
              const locJson = canonicalStringify(loc.payload);

              if (!cloudRow && !factoryJson) {
                // User-created local item that never reached Supabase
                const rowToInsert = {
                  section,
                  record_id: loc.id,
                  sort_order: localSorts[i],
                  payload: loc.payload,
                  updated_by: SENDER_TAB_ID,
                };
                rescueUpserts.push(rowToInsert);
                cloudMap.set(loc.id, rowToInsert);
              } else if (
                cloudRow &&
                factoryJson &&
                canonicalStringify(cloudRow.payload) === factoryJson &&
                locJson !== factoryJson
              ) {
                // Cloud still holds untouched factory seed while local user edited it
                const updatedRow = {
                  section,
                  record_id: loc.id,
                  sort_order: cloudRow.sort_order,
                  payload: loc.payload,
                  updated_by: SENDER_TAB_ID,
                };
                rescueUpserts.push(updatedRow);
                cloudMap.set(loc.id, updatedRow);
              }
            }
          }

          // Also flush if user interacted while hydration was still running
          const localDirty = dirtySections.has(section) && dirtySectionLatestData.has(section);
          if (rescueUpserts.length > 0) {
            for (let i = 0; i < rescueUpserts.length; i += CHUNK_SIZE) {
              const batch = rescueUpserts.slice(i, i + CHUNK_SIZE);
              await supabase!
                .from('studio_records')
                .upsert(batch, { onConflict: 'section,record_id' });
            }
          }

          if (localDirty) {
            const dirtyData = dirtySectionLatestData.get(section);
            resolved[section] = dirtyData;
            // Let follow-up queued sync push dirtyData directly cleanly
          } else {
            const finalRows = Array.from(cloudMap.values()).map((r) => ({
              id: r.record_id,
              sortOrder: r.sort_order,
              payload: r.payload,
            }));
            recordLocalSnapshot(section, finalRows);
            const data = fromCloudObjectMap(section);
            resolved[section] = data;
            try {
              localStorage.setItem(SECTION_TO_KEY[section], JSON.stringify(data));
            } catch {
              // ignore storage quota
            }
          }
        } else {
          // First time initializing this section on Supabase
          const seedEntries = toCloudEntries(section, spec.localCandidate);
          const mergedMap = new Map<
            string,
            { id: string; sortOrder: number; payload: Record<string, unknown> }
          >();

          for (let i = 0; i < seedEntries.length; i++) {
            mergedMap.set(seedEntries[i].id, {
              id: seedEntries[i].id,
              sortOrder: section === 'settings' ? 0 : i * 100,
              payload: seedEntries[i].payload,
            });
          }

          // Preserve any records already inserted before seeding (e.g., storefront inquiry)
          for (const existing of existingRows) {
            if (!mergedMap.has(existing.record_id)) {
              mergedMap.set(existing.record_id, {
                id: existing.record_id,
                sortOrder: existing.sort_order,
                payload: existing.payload,
              });
            }
          }

          const seedRows = Array.from(mergedMap.values()).map((r) => ({
            section,
            record_id: r.id,
            sort_order: r.sortOrder,
            payload: r.payload,
            updated_by: SENDER_TAB_ID,
          }));

          for (let i = 0; i < seedRows.length; i += CHUNK_SIZE) {
            const batch = seedRows.slice(i, i + CHUNK_SIZE);
            const { error } = await supabase!
              .from('studio_records')
              .upsert(batch, { onConflict: 'section,record_id', ignoreDuplicates: true });
            if (error) throw error;
          }

          const { error: metaSeedErr } = await supabase!
            .from('studio_sync_meta')
            .upsert(
              { section, data_version: spec.dataVersion, reset_epoch: 1 },
              { onConflict: 'section', ignoreDuplicates: true }
            );
          if (metaSeedErr) throw metaSeedErr;

          recordLocalSnapshot(
            section,
            Array.from(mergedMap.values()).map((r) => ({
              id: r.id,
              sortOrder: r.sortOrder,
              payload: r.payload,
            }))
          );
          const data = fromCloudObjectMap(section);
          resolved[section] = data;
          try {
            localStorage.setItem(SECTION_TO_KEY[section], JSON.stringify(data));
          } catch {
            // ignore storage quota
          }
        }
      }

      writeVersionFlag(STUDIO_CLOUD_MIGRATION_KEY, '1');
      writeVersionFlag('vedh_opr_version', OPR_DATA_VERSION);
      writeVersionFlag('vedh_expenses_version', EXPENSES_DATA_VERSION);
      hydrationComplete = true;
      lastCloudSignature = (await fetchCloudSignature()) || '';
      return resolved;
    } catch (err) {
      console.warn('Cloud hydration failed, continuing with local Studio cache:', err);
      return null;
    } finally {
      hydrationInFlight = null;
    }
  };

  hydrationInFlight = runHydration();
  return hydrationInFlight;
}

/**
 * Forces pending offline/queued local writes to push to Supabase, then checks
 * Supabase for any changes made by other browsers/devices and returns updated sections.
 */
async function reconcileWithCloud(
  onSectionData: (section: StudioSectionKey, data: unknown) => void,
  forceFullPull = false
): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !hydrationComplete) return;

  // Flush any sections that failed earlier while offline
  if (dirtySections.size > 0) {
    const queued = Array.from(dirtySections);
    for (const section of queued) {
      if (dirtySectionLatestData.has(section)) {
        const latest = dirtySectionLatestData.get(section);
        await enqueueSectionTask(section, async () => {
          await syncSectionToSupabase(section, latest);
        });
      }
    }
  }

  try {
    if (!forceFullPull) {
      const sig = await fetchCloudSignature();
      if (!sig || sig === lastCloudSignature) return;
      lastCloudSignature = sig;
    }

    const cloudRows = await fetchAllCloudRecordsPaged();
    const { data: metaRows } = await supabase.from('studio_sync_meta').select('section');
    const activeMetaSections = new Set(
      ((metaRows ?? []) as Array<{ section: StudioSectionKey }>).map((m) => m.section)
    );

    const rowsBySection = new Map<StudioSectionKey, CloudRecordRow[]>();
    for (const r of cloudRows) {
      const list = rowsBySection.get(r.section) ?? [];
      list.push(r);
      rowsBySection.set(r.section, list);
    }

    for (const section of ALL_STUDIO_SECTIONS) {
      if (dirtySections.has(section) || !activeMetaSections.has(section)) continue;

      const remoteList = (rowsBySection.get(section) ?? []).map((r) => ({
        id: r.record_id,
        sortOrder: r.sort_order,
        payload: r.payload,
      }));

      const prevPayloads = getPayloadMap(section);
      const prevSorts = getSortMap(section);
      let changed = remoteList.length !== prevPayloads.size;

      if (!changed) {
        for (const r of remoteList) {
          if (
            prevPayloads.get(r.id) !== canonicalStringify(r.payload) ||
            prevSorts.get(r.id) !== r.sortOrder
          ) {
            changed = true;
            break;
          }
        }
      }

      if (changed) {
        recordLocalSnapshot(section, remoteList);
        const nextValue = fromCloudObjectMap(section);
        try {
          localStorage.setItem(SECTION_TO_KEY[section], JSON.stringify(nextValue));
        } catch {
          // ignore
        }
        onSectionData(section, nextValue);
      }
    }

    lastCloudSignature = (await fetchCloudSignature()) || lastCloudSignature;
  } catch {
    // Reconcile errors are non-fatal; next interval/realtime event retries
  }
}

/**
 * Subscribes to Supabase Realtime postgres_changes on `public.studio_records`
 * plus reconnect/focus/visibility catch-up and lightweight fallback polling.
 */
export function subscribeSupabaseStudioRealtime(options: {
  onSectionData: (section: StudioSectionKey, data: unknown) => void;
  onStatusChange?: (diag: SupabaseSyncDiagnostic) => void;
}): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  let disposed = false;
  let lastCheckAt = 0;

  const triggerReconcile = (forceFull = false) => {
    if (disposed) return;
    const now = Date.now();
    if (!forceFull && now - lastCheckAt < 2000) return;
    lastCheckAt = now;
    void reconcileWithCloud(options.onSectionData, forceFull);
  };

  const applyRealtimeRowChange = (eventType: 'INSERT' | 'UPDATE' | 'DELETE', row?: Partial<CloudRecordRow>) => {
    if (disposed || !row?.section || !row?.record_id) return;
    const section = row.section;
    if (!ALL_STUDIO_SECTIONS.includes(section)) return;

    const payloadMap = getPayloadMap(section);
    const sortMap = getSortMap(section);
    const objMap = getObjectMap(section);

    if (eventType === 'DELETE') {
      if (!objMap.has(row.record_id)) return; // Already deleted optimistically in this tab
      payloadMap.delete(row.record_id);
      sortMap.delete(row.record_id);
      objMap.delete(row.record_id);
    } else if (row.payload && typeof row.sort_order === 'number') {
      // Never overwrite newer optimistic in-flight edits from this very tab with its own echo
      if (row.updated_by === SENDER_TAB_ID) {
        return;
      }
      const json = canonicalStringify(row.payload);
      if (payloadMap.get(row.record_id) === json && sortMap.get(row.record_id) === row.sort_order) {
        return;
      }
      payloadMap.set(row.record_id, json);
      sortMap.set(row.record_id, row.sort_order);
      objMap.set(row.record_id, { sortOrder: row.sort_order, item: row.payload });
    } else {
      triggerReconcile(true);
      return;
    }

    const nextValue = fromCloudObjectMap(section);
    try {
      localStorage.setItem(SECTION_TO_KEY[section], JSON.stringify(nextValue));
    } catch {
      // ignore storage quota
    }
    options.onSectionData(section, nextValue);
    void fetchCloudSignature().then((sig) => {
      if (sig) lastCloudSignature = sig;
    });
  };

  const channel = supabase
    .channel(`vedh-studio-live-${SENDER_TAB_ID.slice(0, 8)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'studio_records' },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          applyRealtimeRowChange('DELETE', payload.old as Partial<CloudRecordRow>);
        } else if (payload.eventType === 'INSERT') {
          applyRealtimeRowChange('INSERT', payload.new as Partial<CloudRecordRow>);
        } else if (payload.eventType === 'UPDATE') {
          applyRealtimeRowChange('UPDATE', payload.new as Partial<CloudRecordRow>);
        }
      }
    )
    .subscribe((status) => {
      if (disposed) return;
      if (status === 'SUBSCRIBED') {
        options.onStatusChange?.({
          mode: 'connected',
          sidebarTitle: 'Live Cloud Sync',
          sidebarSubtitle: 'Supabase real-time active across all browsers & systems.',
          settingsHeading: 'Live Cross-Device Cloud Sync Active',
          settingsDetail:
            'Orders, Products, Recipes, Inventory, Invoices, Expenses, Customers, Suppliers, Payments, Master Lists, Settings, History, and Purchase Media sync in real time across every browser and device.',
        });
        triggerReconcile(true);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        options.onStatusChange?.({
          mode: 'error',
          sidebarTitle: 'Cloud Reconnecting',
          sidebarSubtitle: 'Fallback sync active · Reconnecting live Supabase channel.',
          settingsHeading: 'Reconnecting Live Cloud Channel',
          settingsDetail:
            'Real-time WebSocket is reconnecting. Edits still save cleanly and fallback sync will keep devices updated.',
        });
      }
    });

  const onFocusOrVisible = () => {
    if (document.visibilityState === 'visible') {
      triggerReconcile(false);
    }
  };
  const onOnline = () => {
    triggerReconcile(true);
  };

  window.addEventListener('focus', onFocusOrVisible);
  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onFocusOrVisible);

  // Safety fallback check every 15s (single lightweight count+timestamp probe)
  const pollTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      triggerReconcile(false);
    }
  }, 15000);

  return () => {
    disposed = true;
    window.clearInterval(pollTimer);
    window.removeEventListener('focus', onFocusOrVisible);
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onFocusOrVisible);
    void supabase?.removeChannel(channel);
  };
}

/**
 * Persists a public Storefront bulk inquiry directly into Supabase `studio_records`
 * (`orders` section) alongside `localStorage` so Studio browsers receive it live.
 */
export async function persistStorefrontOrderInquiry(inquiry: Order): Promise<boolean> {
  const normName = (inquiry.customerName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const nowSort = -Date.now();
  const buildFallbackCustomer = (): Customer => ({
    id: `cust-${Date.now()}`,
    name: inquiry.customerName.trim(),
    phone: inquiry.customerPhone?.trim() || '—',
    whatsappNumber: inquiry.customerPhone?.trim() || undefined,
    email: inquiry.customerEmail?.trim() || undefined,
    city: inquiry.customerLocation?.trim() || undefined,
    acquisitionSource: 'Website / Storefront',
    preferredContact: inquiry.customerPhone ? 'WhatsApp' : undefined,
    occasionFocus: inquiry.occasion?.trim() || undefined,
    totalOrders: 1,
    totalSpent: inquiry.totalAmount || 0,
    type: 'Individual',
    lastOrderDate: inquiry.createdAt,
  });

  try {
    const existingRaw = localStorage.getItem('vedh_orders');
    const existing = existingRaw ? (JSON.parse(existingRaw) as Order[]) : [];
    const nextOrders = [inquiry, ...(Array.isArray(existing) ? existing : [])];
    localStorage.setItem('vedh_orders', JSON.stringify(nextOrders));

    const existingCustRaw = localStorage.getItem('vedh_customers');
    const existingCusts = existingCustRaw ? (JSON.parse(existingCustRaw) as Customer[]) : [];
    let custUpdated = existingCusts;
    if (normName) {
      const idx = existingCusts.findIndex(
        (c) => (c.name || '').trim().toLowerCase().replace(/\s+/g, ' ') === normName
      );
      if (idx >= 0) {
        const cur = existingCusts[idx];
        custUpdated = existingCusts.map((c, i) =>
          i === idx
            ? {
                ...cur,
                phone: cur.phone && cur.phone !== '—' ? cur.phone : inquiry.customerPhone?.trim() || cur.phone,
                totalOrders: (cur.totalOrders || 0) + 1,
                totalSpent: Math.round(((cur.totalSpent || 0) + (inquiry.totalAmount || 0)) * 100) / 100,
                lastOrderDate: inquiry.createdAt || cur.lastOrderDate,
              }
            : c
        );
      } else {
        custUpdated = [buildFallbackCustomer(), ...existingCusts];
      }
      localStorage.setItem('vedh_customers', JSON.stringify(custUpdated));
    }

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(STUDIO_SYNC_CHANNEL);
      channel.postMessage({
        key: 'vedh_orders',
        senderTabId: SENDER_TAB_ID,
        timestamp: Date.now(),
      });
      if (normName) {
        channel.postMessage({
          key: 'vedh_customers',
          senderTabId: SENDER_TAB_ID,
          timestamp: Date.now(),
        });
      }
      channel.close();
    }
  } catch {
    // ignore storage failures on strict private modes
  }

  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const cleanPayload = JSON.parse(JSON.stringify(inquiry)) as Record<string, unknown>;
    const { error } = await supabase.from('studio_records').upsert(
      {
        section: 'orders',
        record_id: inquiry.id,
        sort_order: nowSort,
        payload: cleanPayload,
        updated_by: 'storefront',
      },
      { onConflict: 'section,record_id' }
    );

    if (normName) {
      const { data: existingRows } = await supabase
        .from('studio_records')
        .select('record_id,sort_order,payload')
        .eq('section', 'customers');
      const matched = (existingRows || []).find((r) => {
        const p = r.payload as Customer | null;
        return (
          p?.name &&
          p.name.trim().toLowerCase().replace(/\s+/g, ' ') === normName
        );
      });
      const nextCustomer: Customer = matched
        ? {
            ...(matched.payload as Customer),
            phone:
              (matched.payload as Customer).phone && (matched.payload as Customer).phone !== '—'
                ? (matched.payload as Customer).phone
                : inquiry.customerPhone?.trim() || '—',
            totalOrders: ((matched.payload as Customer).totalOrders || 0) + 1,
            totalSpent:
              Math.round(
                (((matched.payload as Customer).totalSpent || 0) + (inquiry.totalAmount || 0)) * 100
              ) / 100,
            lastOrderDate: inquiry.createdAt || (matched.payload as Customer).lastOrderDate,
          }
        : buildFallbackCustomer();
      await supabase.from('studio_records').upsert(
        {
          section: 'customers',
          record_id: nextCustomer.id,
          sort_order: matched ? matched.sort_order : nowSort,
          payload: JSON.parse(JSON.stringify(nextCustomer)) as Record<string, unknown>,
          updated_by: 'storefront',
        },
        { onConflict: 'section,record_id' }
      );
    }

    return !error;
  } catch {
    return false;
  }
}

/**
 * Checks connectivity and permissions against Supabase `studio_records` & `studio_sync_meta`.
 */
export async function probeSupabaseSchemaStatus(): Promise<SupabaseSyncDiagnostic> {
  if (!isSupabaseConfigured || !supabase) {
    return DEFAULT_LOCAL_DIAGNOSTIC;
  }

  try {
    const [recordsProbe, metaProbe] = await Promise.all([
      supabase.from('studio_records').select('section,record_id').limit(1),
      supabase.from('studio_sync_meta').select('section').limit(1),
    ]);

    if (!recordsProbe.error && !metaProbe.error) {
      return {
        mode: 'connected',
        sidebarTitle: 'Live Cloud Sync',
        sidebarSubtitle: 'Supabase synced · Live updates active across browsers & devices.',
        settingsHeading: 'Live Cross-Device Cloud Sync Active',
        settingsDetail:
          'Orders, Products, Recipes, Inventory, Invoices, Expenses, Customers, Suppliers, Payments, Master Lists, Settings, History, and Purchase Media sync in real time across every browser and device.',
      };
    }

    const first = recordsProbe.error ?? metaProbe.error!;
    const msg = (first.message || '').toLowerCase();
    const code = first.code || '';

    if (
      code === '42501' ||
      msg.includes('permission denied') ||
      msg.includes('rls') ||
      msg.includes('row-level security')
    ) {
      return {
        mode: 'rls-blocked',
        sidebarTitle: 'RLS Restricted',
        sidebarSubtitle: 'Local cache active · Supabase policies blocking access.',
        settingsHeading: 'Supabase Reachable — RLS Access Restricted',
        settingsDetail:
          'Your Supabase policies currently block workspace requests. Edits save locally and sync across open tabs in this browser.',
      };
    }

    if (
      code === '42P01' ||
      code === 'PGRST205' ||
      msg.includes('does not exist') ||
      msg.includes('schema cache')
    ) {
      return {
        mode: 'schema-pending',
        sidebarTitle: 'Schema Pending',
        sidebarSubtitle: 'Supabase reachable · Apply supabase_schema.sql to sync devices.',
        settingsHeading: 'Supabase Host Connected — Sync Tables Pending',
        settingsDetail:
          'Run the latest supabase_schema.sql in Supabase SQL Editor to create studio_records & studio_sync_meta for cross-device live sync.',
      };
    }

    return {
      mode: 'error',
      sidebarTitle: 'Local + Tab Sync',
      sidebarSubtitle: 'Cloud check deferred · Cross-tab live sync active.',
      settingsHeading: 'Local Workspace Active (Cloud Check Deferred)',
      settingsDetail: `Could not verify remote Supabase sync tables (${first.message}). Edits continue saving locally with instant cross-tab sync.`,
    };
  } catch {
    return {
      mode: 'error',
      sidebarTitle: 'Local + Tab Sync',
      sidebarSubtitle: 'Network offline · Changes queued locally until reconnected.',
      settingsHeading: 'Local Workspace Active (Cloud Offline)',
      settingsDetail:
        'Could not reach Supabase right now. Edits save locally and will sync automatically when reconnected.',
    };
  }
}
