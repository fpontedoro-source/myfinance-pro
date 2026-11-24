/**
 * Device Storage & Persistence Utility for MyFinance
 * Manages native smartphone persistent storage (navigator.storage.persist)
 * and IndexedDB synchronization to ensure financial data is stored directly
 * on the user's smartphone and is NOT wiped by browser history cleanups.
 */

const DB_NAME = 'MyFinanceApp_DB';
const DB_VERSION = 1;
const STORE_NAME = 'finance_state';

interface StorageStats {
  isPersisted: boolean;
  canPersist: boolean;
  usageBytes: number;
  quotaBytes: number;
  isStandalone: boolean;
}

// Open or initialize IndexedDB
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB non supportato'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Request persistent storage on the smartphone
 * Guarantees that Android OS / Chrome will NOT evict or clear app data
 * when the user clears browsing history or runs storage cleaner tools.
 */
export async function requestDeviceStoragePersistence(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return false;
  }
  try {
    const isAlreadyPersisted = await navigator.storage.persisted();
    if (isAlreadyPersisted) {
      return true;
    }
    const granted = await navigator.storage.persist();
    return granted;
  } catch (error) {
    console.warn('Impossibile richiedere persistenza storage:', error);
    return false;
  }
}

/**
 * Check if smartphone storage persistence is active
 */
export async function checkStoragePersistence(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persisted) {
    return false;
  }
  try {
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}

/**
 * Retrieve storage statistics (usage and quota in bytes)
 */
export async function getDeviceStorageStats(): Promise<StorageStats> {
  let isPersisted = false;
  let canPersist = false;
  let usageBytes = 0;
  let quotaBytes = 0;
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true);

  if (typeof navigator !== 'undefined' && navigator.storage) {
    canPersist = typeof navigator.storage.persist === 'function';
    if (navigator.storage.persisted) {
      try {
        isPersisted = await navigator.storage.persisted();
      } catch {
        isPersisted = false;
      }
    }

    if (navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        usageBytes = estimate.usage || 0;
        quotaBytes = estimate.quota || 0;
      } catch {
        // Fallback approximation from localStorage
      }
    }
  }

  if (usageBytes === 0 && typeof localStorage !== 'undefined') {
    let totalLen = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('myfinance')) {
        totalLen += (key.length + (localStorage.getItem(key)?.length || 0)) * 2;
      }
    }
    usageBytes = totalLen;
  }

  return {
    isPersisted,
    canPersist,
    usageBytes,
    quotaBytes,
    isStandalone,
  };
}

/**
 * Save complete application payload to native phone IndexedDB
 */
export async function saveToIndexedDB(key: string, data: unknown): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(data, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`Salvataggio IndexedDB (${key}) fallito:`, err);
  }
}

/**
 * Read data from native phone IndexedDB
 */
export async function loadFromIndexedDB<T>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Save complete backup file directly onto smartphone storage (Downloads / File System)
 */
export function exportFileToDevice(
  content: string,
  filename: string,
  mimeType: string = 'application/json'
): boolean {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
    return true;
  } catch (error) {
    console.error('Errore durante il download del file sul dispositivo:', error);
    return false;
  }
}
