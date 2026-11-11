import { Expense } from './types';

const DB_NAME = 'vedh_purchase_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media';

export interface StoredMediaRecord {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  kind: 'bill' | 'product';
  blob: Blob;
  updatedAt: number;
}

export interface EffectiveReceiptInfo {
  fileName?: string;
  url?: string;
  mediaId?: string;
  inheritedFromOrder: boolean;
}

export interface FolderFileMatch {
  file: File;
  targetKind: 'bill' | 'product';
  matchedExpenseIds: string[];
  matchReason: string;
}

function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this environment'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open media database'));
  });
}

/**
 * Persists a binary Bill/Invoice PDF or Product Image in IndexedDB so large files
 * never overflow browser localStorage quotas.
 */
export async function savePurchaseMedia(
  file: File | Blob,
  fileName: string,
  kind: 'bill' | 'product',
  existingId?: string
): Promise<StoredMediaRecord> {
  const db = await openMediaDb();
  const id =
    existingId ||
    `media-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record: StoredMediaRecord = {
    id,
    fileName,
    mimeType: file.type || (fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
    size: file.size,
    kind,
    blob: file,
    updatedAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to write media record'));
  });
  db.close();
  return record;
}

/**
 * Retrieves an uploaded Bill or Product Image record from IndexedDB.
 */
export async function getPurchaseMedia(mediaId: string): Promise<StoredMediaRecord | null> {
  if (!mediaId) return null;
  try {
    const db = await openMediaDb();
    const record = await new Promise<StoredMediaRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(mediaId);
      req.onsuccess = () => resolve((req.result as StoredMediaRecord) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return record;
  } catch {
    return null;
  }
}

/**
 * Deletes a stored Bill or Product Image record from IndexedDB.
 */
export async function deletePurchaseMedia(mediaId: string): Promise<void> {
  if (!mediaId) return;
  try {
    const db = await openMediaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(mediaId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore missing/blocked IndexedDB cleanup errors
  }
}

/**
 * Normalizes order references like "Order Number 14290", "Order #14290", or
 * "Order Number: 406-5934114-4928314" into a canonical lookup key.
 */
export function normalizeOrderNumberKey(orderId?: string): string {
  if (!orderId) return '';
  return orderId
    .toLowerCase()
    .replace(/order\s*(number|no|#)?\s*[:#-]*/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function normalizeFileStem(fileName?: string): { exactLower: string; stemAlnum: string } {
  if (!fileName) return { exactLower: '', stemAlnum: '' };
  const base = fileName.split(/[\\/]/).pop() ?? fileName;
  const exactLower = base.trim().toLowerCase();
  const withoutExt = exactLower.replace(/\.[a-z0-9]{2,5}$/, '');
  return {
    exactLower,
    stemAlnum: withoutExt.replace(/[^a-z0-9]/g, ''),
  };
}

/**
 * Resolves the active Bill / Invoice attachment for a purchase row, automatically
 * sharing uploaded/hosted order bills across all line items belonging to the same order.
 */
export function resolveEffectiveReceipt(
  exp: Expense,
  allExpenses: Expense[]
): EffectiveReceiptInfo {
  if (exp.receiptUrl || exp.receiptMediaId) {
    return {
      fileName: exp.receiptFile,
      url: exp.receiptUrl,
      mediaId: exp.receiptMediaId,
      inheritedFromOrder: false,
    };
  }

  const orderKey = normalizeOrderNumberKey(exp.orderId);
  if (orderKey) {
    const siblingWithAttachment = allExpenses.find(
      (other) =>
        other.id !== exp.id &&
        normalizeOrderNumberKey(other.orderId) === orderKey &&
        Boolean(other.receiptUrl || other.receiptMediaId)
    );
    if (siblingWithAttachment) {
      return {
        fileName: siblingWithAttachment.receiptFile || exp.receiptFile,
        url: siblingWithAttachment.receiptUrl,
        mediaId: siblingWithAttachment.receiptMediaId,
        inheritedFromOrder: true,
      };
    }
  }

  return {
    fileName: exp.receiptFile,
    inheritedFromOrder: false,
  };
}

function detectFileRoleHint(file: File, forcedMode: 'auto' | 'bill' | 'product'): 'bill' | 'product' | 'either' {
  if (forcedMode !== 'auto') return forcedMode;
  const rel = `${(file as File & { webkitRelativePath?: string }).webkitRelativePath || ''} ${file.name}`.toLowerCase();
  if (file.type === 'application/pdf' || rel.endsWith('.pdf')) return 'bill';
  if (/(\bbill\b|\bbills\b|\binvoice\b|\binvoices\b|\breceipt\b|^inv|\bordluxury|\border)/i.test(rel)) {
    return 'bill';
  }
  if (/(\bproduct\b|\bimages?\b|^img|^image)/i.test(rel)) {
    return 'product';
  }
  return 'either';
}

/**
 * Matches uploaded files from local folders or multi-select dialogs against purchase
 * rows by exact filename, normalized filename stem, or Order Number.
 */
export function matchFolderFilesToExpenses(
  files: File[],
  expenses: Expense[],
  mode: 'auto' | 'bill' | 'product' = 'auto'
): { matches: FolderFileMatch[]; unmatched: File[] } {
  const matches: FolderFileMatch[] = [];
  const unmatched: File[] = [];

  for (const file of files) {
    const fileNorm = normalizeFileStem(file.name);
    const roleHint = detectFileRoleHint(file, mode);

    const billByName: string[] = [];
    const prodByName: string[] = [];
    const prodByTitleExact: string[] = [];
    const prodByTitleFuzzy: string[] = [];
    const billByOrder: string[] = [];

    for (const exp of expenses) {
      if (roleHint !== 'product' && exp.receiptFile) {
        const refNorm = normalizeFileStem(exp.receiptFile);
        if (
          (refNorm.exactLower && refNorm.exactLower === fileNorm.exactLower) ||
          (refNorm.stemAlnum && refNorm.stemAlnum === fileNorm.stemAlnum)
        ) {
          billByName.push(exp.id);
          continue;
        }
      }

      if (roleHint !== 'bill' && exp.imageRef) {
        const imgNorm = normalizeFileStem(exp.imageRef);
        if (
          (imgNorm.exactLower && imgNorm.exactLower === fileNorm.exactLower) ||
          (imgNorm.stemAlnum && imgNorm.stemAlnum === fileNorm.stemAlnum)
        ) {
          prodByName.push(exp.id);
        }
      }

      if (roleHint !== 'product' && exp.orderId) {
        const orderKey = normalizeOrderNumberKey(exp.orderId);
        if (orderKey.length >= 4 && fileNorm.stemAlnum.includes(orderKey)) {
          billByOrder.push(exp.id);
        }
      }

      if (roleHint !== 'bill' && exp.title && fileNorm.stemAlnum.length >= 5) {
        const titleAlnum = exp.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (titleAlnum.length >= 5) {
          if (titleAlnum === fileNorm.stemAlnum) {
            prodByTitleExact.push(exp.id);
          } else if (
            titleAlnum.length >= 6 &&
            (fileNorm.stemAlnum.includes(titleAlnum) ||
              (fileNorm.stemAlnum.length >= 6 && titleAlnum.includes(fileNorm.stemAlnum)))
          ) {
            prodByTitleFuzzy.push(exp.id);
          }
        }
      }
    }

    if (billByName.length > 0 && (roleHint === 'bill' || prodByName.length === 0)) {
      matches.push({
        file,
        targetKind: 'bill',
        matchedExpenseIds: billByName,
        matchReason: `Matched bill filename (${billByName.length} row${billByName.length > 1 ? 's' : ''})`,
      });
    } else if (prodByName.length > 0 && roleHint !== 'bill') {
      matches.push({
        file,
        targetKind: 'product',
        matchedExpenseIds: prodByName,
        matchReason: `Matched product image filename (${prodByName.length} row${prodByName.length > 1 ? 's' : ''})`,
      });
    } else if (billByOrder.length > 0) {
      matches.push({
        file,
        targetKind: 'bill',
        matchedExpenseIds: billByOrder,
        matchReason: `Matched Order ID across ${billByOrder.length} row${billByOrder.length > 1 ? 's' : ''}`,
      });
    } else if (prodByTitleExact.length > 0 && roleHint !== 'bill') {
      matches.push({
        file,
        targetKind: 'product',
        matchedExpenseIds: prodByTitleExact,
        matchReason: `Matched product title (${prodByTitleExact.length} row${prodByTitleExact.length > 1 ? 's' : ''})`,
      });
    } else if (prodByTitleFuzzy.length === 1 && roleHint !== 'bill') {
      matches.push({
        file,
        targetKind: 'product',
        matchedExpenseIds: prodByTitleFuzzy,
        matchReason: 'Matched product name',
      });
    } else {
      unmatched.push(file);
    }
  }

  return { matches, unmatched };
}
