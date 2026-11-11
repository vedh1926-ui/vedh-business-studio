import { isSupabaseConfigured, supabase } from './supabase';

export const OPR_DATA_VERSION = '4.0_clean';
export const EXPENSES_DATA_VERSION = '4.0_clean';
export const STUDIO_SYNC_CHANNEL = 'vedh_studio_sync';
const SENDER_TAB_ID =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tab-${Math.random().toString(36).slice(2)}`;

export type SyncStateKind =
  | 'local-only'
  | 'schema-pending'
  | 'auth-required'
  | 'cloud-unreachable'
  | 'cloud-ready';

export interface SupabaseSyncDiagnostic {
  state: SyncStateKind;
  sidebarTitle: string;
  sidebarSubtitle: string;
  settingsHeading: string;
  settingsDetail: string;
}

const DEFAULT_LOCAL_DIAGNOSTIC: SupabaseSyncDiagnostic = {
  state: 'local-only',
  sidebarTitle: 'Local + Tab Sync',
  sidebarSubtitle: 'Saved locally with instant cross-tab real-time updates.',
  settingsHeading: 'Operating in Local Browser Storage (Cross-Tab Live Sync)',
  settingsDetail:
    'Changes update immediately across open tabs in this browser. Connect and initialize Supabase tables to enable multi-device cloud sync.',
};

/**
 * Reads a version marker from localStorage, normalizing legacy values
 * that were accidentally stored via JSON.stringify (e.g. '"4.0_clean"').
 */
export function readVersionFlag(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    if (raw.startsWith('"') && raw.endsWith('"')) {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'string' ? parsed : raw;
    }
    return raw;
  } catch {
    return null;
  }
}

/**
 * Writes an unquoted version marker string to localStorage.
 */
export function writeVersionFlag(key: string, version: string): void {
  try {
    localStorage.setItem(key, version);
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

/**
 * Persists a serialized Studio dataset to localStorage and broadcasts the key
 * over BroadcastChannel so other open Studio tabs update in real time.
 */
export function persistStudioKey<T>(key: string, data: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(STUDIO_SYNC_CHANNEL);
      channel.postMessage({ key, senderTabId: SENDER_TAB_ID, timestamp: Date.now() });
      channel.close();
    }
    return true;
  } catch (err) {
    console.warn(`Unable to persist Studio key "${key}":`, err);
    return false;
  }
}

/**
 * Subscribes to real-time Studio state changes from other tabs/windows via
 * both BroadcastChannel and the native storage event.
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
      if (event.data?.key && event.data.senderTabId !== SENDER_TAB_ID) {
        onKeyChanged(event.data.key);
      }
    };
  }

  return () => {
    window.removeEventListener('storage', onStorage);
    channel?.close();
  };
}

/**
 * Performs a lightweight read-only check against Supabase REST endpoints to report
 * accurate sync readiness rather than relying solely on env-var presence.
 */
export async function probeSupabaseSchemaStatus(): Promise<SupabaseSyncDiagnostic> {
  if (!isSupabaseConfigured || !supabase) {
    return DEFAULT_LOCAL_DIAGNOSTIC;
  }

  try {
    const [expCheck, masterCheck] = await Promise.all([
      supabase.from('expenses').select('id,order_id').limit(1),
      supabase.from('master_lists').select('id').limit(1),
    ]);

    const errors = [expCheck.error, masterCheck.error].filter(Boolean);
    if (errors.length === 0) {
      return {
        state: 'cloud-ready',
        sidebarTitle: 'Cloud Schema Ready',
        sidebarSubtitle: 'Supabase verified · Cross-tab live sync active in workspace.',
        settingsHeading: 'Supabase Host & Schema Verified (Local Workspace Active)',
        settingsDetail:
          'Supabase PostgreSQL v4 tables are reachable. Studio currently persists workspace edits locally with live cross-tab sync.',
      };
    }

    const first = errors[0]!;
    const msg = `${first.code ?? ''} ${first.message ?? ''}`.toLowerCase();
    const isAuthError =
      expCheck.status === 401 ||
      expCheck.status === 403 ||
      msg.includes('42501') ||
      msg.includes('jwt') ||
      msg.includes('permission denied');

    if (isAuthError) {
      return {
        state: 'auth-required',
        sidebarTitle: 'Local + Tab Sync',
        sidebarSubtitle: 'Same-browser real-time sync active · Cloud requires auth.',
        settingsHeading: 'Supabase Reachable — RLS Authentication Not Configured in Studio',
        settingsDetail:
          'Your Supabase policies restrict unauthenticated requests. Edits save locally and sync live across open tabs on this browser.',
      };
    }

    const isSchemaGap =
      expCheck.status === 400 ||
      expCheck.status === 404 ||
      masterCheck.status === 404 ||
      msg.includes('42703') ||
      msg.includes('pgrst205') ||
      msg.includes('does not exist') ||
      msg.includes('schema cache');

    if (isSchemaGap) {
      return {
        state: 'schema-pending',
        sidebarTitle: 'Local + Tab Sync',
        sidebarSubtitle: 'Cross-tab sync active · Cloud SQL migration pending.',
        settingsHeading: 'Supabase Host Connected — Database Migration Pending',
        settingsDetail:
          'Supabase credentials exist, but your remote database still lacks the latest Studio tables/columns (run supabase_schema.sql in Supabase SQL Editor). Edits are saved locally and sync live across open tabs.',
      };
    }

    return {
      state: 'cloud-unreachable',
      sidebarTitle: 'Local + Tab Sync',
      sidebarSubtitle: 'Cross-tab real-time sync active (cloud offline).',
      settingsHeading: 'Operating in Local Browser Storage (Cloud Unreachable)',
      settingsDetail: `Could not verify remote Supabase tables (${first.message}). Edits continue saving locally with instant cross-tab sync.`,
    };
  } catch {
    return {
      state: 'cloud-unreachable',
      sidebarTitle: 'Local + Tab Sync',
      sidebarSubtitle: 'Cross-tab real-time sync active (cloud offline).',
      settingsHeading: 'Operating in Local Browser Storage (Cloud Unreachable)',
      settingsDetail:
        'Could not reach Supabase right now. Edits are saved locally and sync immediately across open tabs.',
    };
  }
}
