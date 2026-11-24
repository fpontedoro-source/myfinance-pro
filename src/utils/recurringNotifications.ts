import { Account, Transaction } from '../types/finance';
import { formatCurrency, formatDateEuropean, getAccountDisplayName } from './formatters';
import { Language } from './translations';

export interface AutoRecurringNotification {
  id: string;
  transactionId: string;
  type: 'EXPENSE' | 'INCOME';
  description: string;
  amount: number;
  account: string;
  currency?: string;
  category: string;
  dueDate: string;
  createdAt: string;
}

const PENDING_AUTO_NOTIFS_KEY = 'myfinance_auto_recurring_notifs_v1';
const AUTO_NOTIFS_ENABLED_KEY = 'myfinance_auto_recurring_notif_enabled_v1';

export type BrowserNotifPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getPendingAutoRecurringNotifications(): AutoRecurringNotification[] {
  try {
    const raw = localStorage.getItem(PENDING_AUTO_NOTIFS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePendingAutoRecurringNotifications(
  items: AutoRecurringNotification[]
): void {
  try {
    localStorage.setItem(PENDING_AUTO_NOTIFS_KEY, JSON.stringify(items.slice(0, 20)));
  } catch {
    // ignore storage quota errors
  }
}

export function getRecurringNotificationsEnabled(): boolean {
  try {
    const val = localStorage.getItem(AUTO_NOTIFS_ENABLED_KEY);
    if (val === null) return true;
    return val === 'true';
  } catch {
    return true;
  }
}

export function setRecurringNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_NOTIFS_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export function getBrowserNotificationStatus(): BrowserNotifPermissionState {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission as BrowserNotifPermissionState;
}

export async function requestBrowserNotificationPermission(
  language: Language = 'it'
): Promise<BrowserNotifPermissionState> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const title = 'MyFinance Pro';
      const body =
        language === 'de'
          ? 'Benachrichtigungen für automatische Dauerbuchungen aktiviert.'
          : language === 'en'
            ? 'Notifications for automatic scheduled bills enabled.'
            : 'Notifiche attive per le registrazioni automatiche dello scadenzario.';
      try {
        new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          tag: 'myfinance-notif-enabled',
        });
      } catch {
        // Ignore in restricted webviews where Notification constructor throws
      }
    }
    return permission as BrowserNotifPermissionState;
  } catch {
    return 'unsupported';
  }
}

export function buildAutoRecurringNotificationsFromTransactions(
  generatedTransactions: Transaction[],
  accounts: Account[]
): AutoRecurringNotification[] {
  const nowIso = new Date().toISOString();
  return generatedTransactions
    .filter((tx): tx is Transaction & { type: 'EXPENSE' | 'INCOME' } =>
      tx.type === 'EXPENSE' || tx.type === 'INCOME'
    )
    .map((tx) => {
      const matchedAcc = accounts.find(
        (a) => a.id === tx.account || a.name === tx.account
      );
      return {
        id: `notif_${tx.id}`,
        transactionId: tx.id,
        type: tx.type,
        description: tx.description,
        amount: tx.amount,
        account: matchedAcc?.name || tx.account || '',
        currency: matchedAcc?.currency,
        category: tx.category,
        dueDate: tx.date,
        createdAt: nowIso,
      };
    });
}

export function getAutoRecurringToastMessage(
  items: AutoRecurringNotification[],
  accounts: Account[],
  language: Language
): string {
  if (items.length === 0) return '';

  if (items.length === 1) {
    const item = items[0];
    const accName = getAccountDisplayName(item.account, accounts);
    const sign = item.type === 'EXPENSE' ? '-' : '+';
    const amountFormatted = `${sign}${formatCurrency(item.amount, true, item.currency)}`;

    if (language === 'de') {
      return item.type === 'EXPENSE'
        ? `Du hast eine Ausgabe: "${item.description}" (${amountFormatted}) · ${accName}`
        : `Du hast eine Einnahme: "${item.description}" (${amountFormatted}) · ${accName}`;
    }
    if (language === 'en') {
      return item.type === 'EXPENSE'
        ? `You have an outgoing expense: "${item.description}" (${amountFormatted}) · ${accName}`
        : `You have an incoming entry: "${item.description}" (${amountFormatted}) · ${accName}`;
    }
    return item.type === 'EXPENSE'
      ? `Hai un movimento in uscita: "${item.description}" (${amountFormatted}) · ${accName}`
      : `Hai un movimento in entrata: "${item.description}" (${amountFormatted}) · ${accName}`;
  }

  const expensesCount = items.filter((i) => i.type === 'EXPENSE').length;
  const incomesCount = items.filter((i) => i.type === 'INCOME').length;

  if (language === 'de') {
    if (expensesCount > 0 && incomesCount > 0) {
      return `Terminplaner: ${expensesCount} Ausgabe(n) & ${incomesCount} Einnahme(n) automatisch gebucht`;
    }
    if (expensesCount > 0) {
      return `Terminplaner: ${expensesCount} Ausgaben automatisch gebucht`;
    }
    return `Terminplaner: ${incomesCount} Einnahmen automatisch gebucht`;
  }

  if (language === 'en') {
    if (expensesCount > 0 && incomesCount > 0) {
      return `Scheduler: ${expensesCount} outgoing & ${incomesCount} incoming entries auto-recorded`;
    }
    if (expensesCount > 0) {
      return `Scheduler: ${expensesCount} outgoing expenses auto-recorded`;
    }
    return `Scheduler: ${incomesCount} incoming entries auto-recorded`;
  }

  if (expensesCount > 0 && incomesCount > 0) {
    return `Scadenzario: ${expensesCount} in uscita e ${incomesCount} in entrata registrati`;
  }
  if (expensesCount > 0) {
    return `Scadenzario: ${expensesCount} movimenti in uscita registrati`;
  }
  return `Scadenzario: ${incomesCount} movimenti in entrata registrati`;
}

export async function dispatchBrowserRecurringNotifications(
  items: AutoRecurringNotification[],
  accounts: Account[],
  language: Language
): Promise<void> {
  if (items.length === 0) return;

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([120, 60, 120]);
    }
  } catch {
    // ignore vibration errors
  }

  if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;

  for (const item of items.slice(0, 3)) {
    const accName = getAccountDisplayName(item.account, accounts);
    const sign = item.type === 'EXPENSE' ? '-' : '+';
    const amountFormatted = `${sign}${formatCurrency(item.amount, true, item.currency)}`;
    const formattedDate = formatDateEuropean(item.dueDate);

    const title =
      language === 'de'
        ? item.type === 'EXPENSE'
          ? 'Scadenzario: Ausgabe erfasst'
          : 'Scadenzario: Einnahme erfasst'
        : language === 'en'
          ? item.type === 'EXPENSE'
            ? 'Scheduler: Outgoing Expense Recorded'
            : 'Scheduler: Incoming Income Recorded'
          : item.type === 'EXPENSE'
            ? 'Scadenzario: Movimento in uscita registrato'
            : 'Scadenzario: Movimento in entrata registrato';

    const body =
      language === 'de'
        ? item.type === 'EXPENSE'
          ? `Du hast eine Ausgabe: ${item.description} (${amountFormatted}) auf ${accName} · ${formattedDate}`
          : `Du hast eine Einnahme: ${item.description} (${amountFormatted}) auf ${accName} · ${formattedDate}`
        : language === 'en'
          ? item.type === 'EXPENSE'
            ? `You have an outgoing expense: ${item.description} (${amountFormatted}) on ${accName} · ${formattedDate}`
            : `You have an incoming entry: ${item.description} (${amountFormatted}) on ${accName} · ${formattedDate}`
          : item.type === 'EXPENSE'
            ? `Hai un movimento in uscita: ${item.description} (${amountFormatted}) su ${accName} · ${formattedDate}`
            : `Hai un movimento in entrata: ${item.description} (${amountFormatted}) su ${accName} · ${formattedDate}`;

    const options: NotificationOptions = {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: item.id,
    };

    try {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, options);
      } else {
        new Notification(title, options);
      }
    } catch {
      try {
        new Notification(title, options);
      } catch {
        // ignore restricted environments (e.g. file:// standalone Android WebView)
      }
    }
  }
}
