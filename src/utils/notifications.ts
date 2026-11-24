/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ReminderSettings {
  enabled: boolean;
  time: string; // "HH:mm" (24h)
  lastNotifiedDate: string; // "YYYY-MM-DD"
  message?: string;
}

export interface AppNotificationOptions extends NotificationOptions {
  renotify?: boolean;
  vibrate?: number[];
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  time: '20:30',
  lastNotifiedDate: '',
  message: 'Hai registrato le spese di oggi? Tieni aggiornato il tuo bilancio in pochi secondi.',
};

const STORAGE_KEY = 'myfinance_reminder_settings_v1';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Errore durante la richiesta permessi notifiche:', err);
    return Notification.permission;
  }
}

export function getStoredReminderSettings(): ReminderSettings {
  if (typeof window === 'undefined') return DEFAULT_REMINDER_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_REMINDER_SETTINGS;
    return { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Errore lettura impostazioni notifiche:', err);
    return DEFAULT_REMINDER_SETTINGS;
  }
}

export function saveStoredReminderSettings(settings: ReminderSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Errore salvataggio impostazioni notifiche:', err);
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateMsUntilTime(timeStr: string): number {
  const [hoursStr, minutesStr] = timeStr.split(':');
  const targetHour = parseInt(hoursStr, 10) || 20;
  const targetMinute = parseInt(minutesStr, 10) || 30;

  const now = new Date();
  const target = new Date();
  target.setHours(targetHour, targetMinute, 0, 0);

  // If time has already passed today, schedule for tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

/**
 * Triggers a notification via Service Worker registration if available,
 * with standard Notification constructor fallback.
 */
export async function sendLocalPushNotification(
  title: string,
  options?: AppNotificationOptions
): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }

  // Ensure permission
  let permission: NotificationPermission | 'unsupported' = Notification.permission;
  if (permission === 'default') {
    permission = await requestNotificationPermission();
  }

  if (permission !== 'granted') {
    return false;
  }

  const notificationOptions: AppNotificationOptions = {
    icon: '/pwa-192x192.png',
    badge: '/icon.svg',
    tag: 'daily-expense-reminder',
    renotify: true,
    requireInteraction: false,
    ...options,
  };

  // Try Service Worker registration first (standard for PWAs on Android & Desktop)
  if (isServiceWorkerSupported()) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions as NotificationOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('Service Worker showNotification non riuscito, fallback a new Notification:', swErr);
    }
  }

  // Fallback to Window Notification API
  try {
    new Notification(title, notificationOptions as NotificationOptions);
    return true;
  } catch (notifErr) {
    console.warn('new Notification() fallback error:', notifErr);
    return false;
  }
}

/**
 * Sends the daily expense reminder
 */
export async function sendDailyExpenseReminder(customMessage?: string): Promise<boolean> {
  const body =
    customMessage ||
    'Hai registrato tutte le spese di oggi? Bastano 30 secondi per mantenere il tuo budget sempre in ordine!';

  return sendLocalPushNotification('MyFinance Pro 💸 Promemoria Spese', {
    body,
    icon: '/pwa-192x192.png',
    badge: '/icon.svg',
    tag: 'myfinance-daily-reminder',
    renotify: true,
  });
}
