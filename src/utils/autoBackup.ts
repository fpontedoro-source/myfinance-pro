/**
 * Daily Automatic Backup Utility for MyFinance Pro
 * Manages daily automated JSON backups, user-defined destination directories
 * (OneDrive, Google Drive, Local Device, or Custom Paths), File System Access API
 * directory handles, Web Share integration, and historical rolling snapshots.
 */

import { Language } from './translations';
import { exportFileToDevice, saveToIndexedDB, loadFromIndexedDB } from './deviceStorage';

export type AutoBackupDestinationType =
  | 'device_folder'   // Native folder picked via File System Access API (supports local OneDrive/GDrive synced folders)
  | 'manual_path'     // User manually typed path/address (e.g. OneDrive/MyFinance, Google Drive/Backup)
  | 'auto_download'   // Automatic direct browser download to device downloads folder
  | 'cloud_share';    // Direct Web Share sheet to Google Drive, OneDrive, or Dropbox mobile app

export type CloudProviderPreset = 'onedrive' | 'gdrive' | 'device' | 'custom';

export interface AutoBackupSettings {
  enabled: boolean;
  destinationType: AutoBackupDestinationType;
  providerPreset: CloudProviderPreset;
  customPath: string; // Manually defined folder path or destination name
  directoryName?: string; // Name of directory selected via File System Access API
  lastBackupDate?: string; // YYYY-MM-DD
  lastBackupTime?: string; // ISO string
  lastBackupFileName?: string;
  lastBackupStatus?: 'success' | 'error';
  lastBackupMessage?: string;
  autoDownloadFallback: boolean;
  maxStoredSnapshots: number;
}

export interface BackupSnapshot {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // ISO string
  fileName: string;
  accountsCount: number;
  transactionsCount: number;
  dataSize: number; // bytes
  destinationInfo: string;
  payloadJson: string;
}

const SETTINGS_KEY = 'myfinance_autobackup_settings_v2';
const SNAPSHOTS_KEY = 'myfinance_autobackup_snapshots_v2';
const DIR_HANDLE_IDB_KEY = 'myfinance_backup_dir_handle_v2';

export const DEFAULT_AUTO_BACKUP_SETTINGS: AutoBackupSettings = {
  enabled: true,
  destinationType: 'manual_path',
  providerPreset: 'onedrive',
  customPath: 'OneDrive/Documenti/MyFinance_Backups',
  directoryName: undefined,
  autoDownloadFallback: true,
  maxStoredSnapshots: 15,
};

export const PROVIDER_PRESETS: Record<
  CloudProviderPreset,
  { label: string; defaultPath: string; icon: string; desc: string }
> = {
  onedrive: {
    label: 'Microsoft OneDrive',
    defaultPath: 'OneDrive/Documenti/MyFinance_Backups',
    icon: 'cloud',
    desc: 'Salvataggio nella cartella sincronizzata Microsoft OneDrive per accesso da PC e Smartphone.',
  },
  gdrive: {
    label: 'Google Drive',
    defaultPath: 'Google Drive/MyFinance_Backups',
    icon: 'drive',
    desc: 'Salvataggio nella cartella sincronizzata Google Drive o tramite app mobile Google Drive.',
  },
  device: {
    label: 'Dispositivo (Memoria Locale)',
    defaultPath: 'Download/MyFinance_Backups',
    icon: 'device',
    desc: 'Salvataggio diretto nella memoria interna del dispositivo (cartella Download o Documenti).',
  },
  custom: {
    label: 'Percorso Personalizzato',
    defaultPath: 'Documenti/Finanza/Backup_Giornalieri',
    icon: 'folder',
    desc: 'Inserisci manualmente qualsiasi percorso di cartella locale, server o disco esterno.',
  },
};

/**
 * Load saved auto backup settings from localStorage
 */
export function getAutoBackupSettings(): AutoBackupSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_AUTO_BACKUP_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_AUTO_BACKUP_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_AUTO_BACKUP_SETTINGS, ...parsed };
  } catch (err) {
    console.warn('Errore lettura impostazioni backup automatico:', err);
    return DEFAULT_AUTO_BACKUP_SETTINGS;
  }
}

/**
 * Persist auto backup settings to localStorage
 */
export function saveAutoBackupSettings(settings: AutoBackupSettings): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Errore salvataggio impostazioni backup automatico:', err);
  }
}

/**
 * Retrieve list of stored daily backup snapshots
 */
export function getStoredSnapshots(): BackupSnapshot[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    if (!raw) return [];
    const list: BackupSnapshot[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.warn('Errore lettura snapshot backup:', err);
    return [];
  }
}

/**
 * Save a new daily backup snapshot (keeps rolling limit)
 */
export function recordSnapshot(snapshot: BackupSnapshot, maxLimit: number = 15): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const current = getStoredSnapshots();
    // Exclude duplicates from same day or id
    const filtered = current.filter((s) => s.id !== snapshot.id && s.date !== snapshot.date);
    const updated = [snapshot, ...filtered].slice(0, maxLimit);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Errore registrazione snapshot backup:', err);
  }
}

/**
 * Delete a specific snapshot by ID
 */
export function deleteStoredSnapshot(id: string): BackupSnapshot[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const current = getStoredSnapshots();
    const updated = current.filter((s) => s.id !== id);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Check if the browser supports File System Access API Directory Picker
 */
export function isDirectoryPickerSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function'
  );
}

/**
 * Check if Web Share API with files is supported
 */
export function isWebShareFilesSupported(): boolean {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  if (typeof navigator.canShare !== 'function') return true;
  try {
    const testFile = new File(['{}'], 'test.json', { type: 'application/json' });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

/**
 * Pick a directory on the device/cloud using showDirectoryPicker
 */
export async function pickDirectoryHandle(): Promise<{
  handle: FileSystemDirectoryHandle;
  name: string;
} | null> {
  if (!isDirectoryPickerSupported()) {
    throw new Error('Directory picker non supportato da questo browser.');
  }
  try {
    const windowWithPicker = window as unknown as {
      showDirectoryPicker: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
    };
    const handle = await windowWithPicker.showDirectoryPicker({ mode: 'readwrite' });
    if (handle) {
      await saveToIndexedDB(DIR_HANDLE_IDB_KEY, handle);
      return { handle, name: handle.name };
    }
    return null;
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      return null; // User cancelled
    }
    throw err;
  }
}

/**
 * Retrieve saved directory handle from IndexedDB
 */
export async function getSavedDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await loadFromIndexedDB<FileSystemDirectoryHandle>(DIR_HANDLE_IDB_KEY);
    if (!handle) return null;

    // Verify permission
    const opts = { mode: 'readwrite' as const };
    const query = await (handle as unknown as { queryPermission: (opt: { mode: string }) => Promise<string> }).queryPermission(opts);
    if (query === 'granted') {
      return handle;
    }
    const request = await (handle as unknown as { requestPermission: (opt: { mode: string }) => Promise<string> }).requestPermission(opts);
    if (request === 'granted') {
      return handle;
    }
    return null;
  } catch (err) {
    console.warn('Impossibile recuperare directory handle:', err);
    return null;
  }
}

/**
 * Clear saved directory handle
 */
export async function clearSavedDirectoryHandle(): Promise<void> {
  await saveToIndexedDB(DIR_HANDLE_IDB_KEY, null);
}

/**
 * Write a file directly into a FileSystemDirectoryHandle
 */
export async function writeToFileSystemDirectory(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string,
  content: string
): Promise<boolean> {
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await (fileHandle as unknown as { createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }> }).createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (err) {
    console.error('Scrittura su cartella FileSystem fallita:', err);
    return false;
  }
}

/**
 * Share backup file via Web Share API directly to OneDrive, Google Drive, or other apps
 */
export async function shareBackupFile(
  fileName: string,
  jsonContent: string,
  title: string = 'MyFinance Pro Backup'
): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return false;
  }
  try {
    const file = new File([jsonContent], fileName, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text: `Backup automatico MyFinance Pro (${fileName})`,
        files: [file],
      });
      return true;
    } else {
      await navigator.share({
        title,
        text: jsonContent,
      });
      return true;
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      return false; // User cancelled
    }
    console.warn('Condivisione backup fallita:', err);
    return false;
  }
}

/**
 * Executes a full backup with the configured destination and saves snapshot
 */
export async function executeAutoBackup(
  payload: Record<string, unknown>,
  settings: AutoBackupSettings,
  isManualTrigger: boolean = false
): Promise<{
  success: boolean;
  message: string;
  fileName: string;
  methodUsed: string;
}> {
  const today = new Date().toISOString().split('T')[0];
  const nowIso = new Date().toISOString();
  const fileName = `myfinance_backup_${today}.json`;
  const jsonContent = JSON.stringify(payload, null, 2);

  const accountsCount = Array.isArray(payload.accounts) ? payload.accounts.length : 0;
  const transactionsCount = Array.isArray(payload.transactions) ? payload.transactions.length : 0;
  const dataSize = new Blob([jsonContent]).size;

  let methodUsed = 'download';
  let success = false;
  let message = '';

  const destinationDesc =
    settings.destinationType === 'device_folder' && settings.directoryName
      ? `Cartella collegata: ${settings.directoryName}`
      : settings.customPath
        ? `${settings.customPath}`
        : settings.providerPreset === 'onedrive'
          ? 'OneDrive'
          : settings.providerPreset === 'gdrive'
            ? 'Google Drive'
            : 'Dispositivo Locale';

  // 1. Try File System Access API if configured
  if (settings.destinationType === 'device_folder') {
    try {
      const dirHandle = await getSavedDirectoryHandle();
      if (dirHandle) {
        const wrote = await writeToFileSystemDirectory(dirHandle, fileName, jsonContent);
        if (wrote) {
          success = true;
          methodUsed = `cartella (${dirHandle.name})`;
          message = `File salvato direttamente nella cartella "${dirHandle.name}"!`;
        }
      }
    } catch (err) {
      console.warn('Scrittura cartella fallita, procedo con fallback:', err);
    }
  }

  // 2. If destination is cloud share and triggered manually
  if (!success && settings.destinationType === 'cloud_share' && isManualTrigger) {
    try {
      const shared = await shareBackupFile(fileName, jsonContent);
      if (shared) {
        success = true;
        methodUsed = 'condivisione cloud';
        message = 'Backup inviato a Google Drive / OneDrive con successo!';
      }
    } catch (err) {
      console.warn('Condivisione non completata:', err);
    }
  }

  // 3. Fallback / standard method: Direct device download / auto-download
  if (!success) {
    try {
      // Trigger browser download directly onto the device
      exportFileToDevice(jsonContent, fileName, 'application/json');
      success = true;
      methodUsed = 'download su dispositivo';
      message = `Backup salvato sul dispositivo (Destinazione indicata: ${destinationDesc})!`;
    } catch (err) {
      console.error('Download fallito:', err);
      success = false;
      message = 'Impossibile salvare il file di backup.';
    }
  }

  // Always record the snapshot into local history
  recordSnapshot(
    {
      id: `${today}_${Date.now()}`,
      date: today,
      time: nowIso,
      fileName,
      accountsCount,
      transactionsCount,
      dataSize,
      destinationInfo: destinationDesc,
      payloadJson: jsonContent,
    },
    settings.maxStoredSnapshots
  );

  // Update settings metadata
  const updatedSettings: AutoBackupSettings = {
    ...settings,
    lastBackupDate: today,
    lastBackupTime: nowIso,
    lastBackupFileName: fileName,
    lastBackupStatus: success ? 'success' : 'error',
    lastBackupMessage: message,
  };
  saveAutoBackupSettings(updatedSettings);

  return { success, message, fileName, methodUsed };
}

/**
 * Checks if daily automatic backup is due and runs it if enabled
 */
export async function checkAndRunDailyBackup(
  getPayload: () => Record<string, unknown>,
  onToast?: (msg: string) => void,
  lang: Language = 'it'
): Promise<boolean> {
  const settings = getAutoBackupSettings();
  if (!settings.enabled) {
    return false;
  }

  const today = new Date().toISOString().split('T')[0];
  if (settings.lastBackupDate === today) {
    // Already executed today
    return false;
  }

  try {
    const payload = getPayload();
    const result = await executeAutoBackup(payload, settings, false);

    if (result.success && onToast) {
      const toastMsg =
        lang === 'de'
          ? `Tägliches Backup gespeichert (${result.fileName})`
          : lang === 'en'
            ? `Daily backup saved (${result.fileName})`
            : `Backup automatico giornaliero eseguito (${result.fileName})`;
      onToast(toastMsg);
    }
    return result.success;
  } catch (err) {
    console.error('Errore esecuzione backup giornaliero automatico:', err);
    return false;
  }
}
