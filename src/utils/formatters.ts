import { PeriodFilter, CurrencyCode } from '../types/finance';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  names: {
    it: string;
    en: string;
    de: string;
  };
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro (€)',
    flag: '🇪🇺',
    names: {
      it: 'Euro (€)',
      en: 'Euro (€)',
      de: 'Euro (€)',
    },
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'Dollaro Statunitense ($)',
    flag: '🇺🇸',
    names: {
      it: 'Dollaro Statunitense ($)',
      en: 'US Dollar ($)',
      de: 'US-Dollar ($)',
    },
  },
  {
    code: 'JPY',
    symbol: '¥',
    name: 'Yen Giapponese (¥)',
    flag: '🇯🇵',
    names: {
      it: 'Yen Giapponese (¥)',
      en: 'Japanese Yen (¥)',
      de: 'Japanischer Yen (¥)',
    },
  },
  {
    code: 'GBP',
    symbol: '£',
    name: 'Sterlina Britannica (£)',
    flag: '🇬🇧',
    names: {
      it: 'Sterlina Britannica (£)',
      en: 'British Pound (£)',
      de: 'Britisches Pfund (£)',
    },
  },
  {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Franco Svizzero (CHF)',
    flag: '🇨🇭',
    names: {
      it: 'Franco Svizzero (CHF)',
      en: 'Swiss Franc (CHF)',
      de: 'Schweizer Franken (CHF)',
    },
  },
];

export function getCurrencySymbol(currOrCode?: string): string {
  if (!currOrCode) return '€';
  const c = currOrCode.trim().toUpperCase();
  if (c === 'USD' || c === '$') return '$';
  if (c === 'JPY' || c === '¥') return '¥';
  if (c === 'GBP' || c === '£') return '£';
  if (c === 'CHF' || c === 'FR') return 'CHF';
  return '€'; // Default EUR
}

export function getCurrencyCode(currOrCode?: string): CurrencyCode {
  if (!currOrCode) return 'EUR';
  const c = currOrCode.trim().toUpperCase();
  if (c === 'USD' || c === '$') return 'USD';
  if (c === 'JPY' || c === '¥') return 'JPY';
  if (c === 'GBP' || c === '£') return 'GBP';
  if (c === 'CHF' || c === 'FR') return 'CHF';
  return 'EUR';
}

let appActiveCurrency = '€';
let appPrivacyMode = false;
export const PRIVACY_STORAGE_KEY = 'myfinance_privacy_mode_v1';

export function setAppCurrency(symbolOrLang: string): void {
  if (symbolOrLang === 'en' || symbolOrLang === 'it' || symbolOrLang === 'de' || symbolOrLang === '€' || symbolOrLang === 'EUR') {
    appActiveCurrency = '€';
  } else {
    appActiveCurrency = symbolOrLang || '€';
  }
}

export function getAppCurrency(): string {
  return appActiveCurrency;
}

export function setAppPrivacyMode(enabled: boolean): void {
  appPrivacyMode = Boolean(enabled);
}

export function getAppPrivacyMode(): boolean {
  return appPrivacyMode;
}

export function formatCurrency(
  amount: number,
  withSymbol: boolean = true,
  currencyOverride?: string
): string {
  const sym = getCurrencySymbol(currencyOverride || appActiveCurrency);
  if (appPrivacyMode) {
    return withSymbol ? `•••• ${sym}` : '••••';
  }
  if (isNaN(amount) || amount === null || amount === undefined) {
    return withSymbol ? `0,00 ${sym}` : '0,00';
  }
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);

  const fixed = absVal.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  // Standard dot thousand separator (es. 1.000,00)
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const formattedNum = (isNegative ? '-' : '') + formattedInt + ',' + decPart;

  return withSymbol ? `${formattedNum} ${sym}` : formattedNum;
}

/**
 * Restituisce il nome leggibile di un conto dato il suo ID o nome
 */
export function getAccountDisplayName(
  accIdOrName?: string,
  accounts: { id: string; name: string }[] = []
): string {
  if (!accIdOrName) return '';
  const match = accounts.find(
    (a) => a.id === accIdOrName || a.name === accIdOrName
  );
  return match ? match.name : accIdOrName;
}

export function isDateInPeriod(
  dateStr: string,
  period: PeriodFilter,
  customStartDate?: string,
  customEndDate?: string
): boolean {
  // If period is CUSTOM or custom dates are specified
  if (period === 'CUSTOM' || customStartDate || customEndDate) {
    let from = customStartDate?.trim() || '';
    let to = customEndDate?.trim() || '';
    if (from && to && from > to) {
      [from, to] = [to, from];
    }
    if (from && dateStr < from) return false;
    if (to && dateStr > to) return false;
    if (period === 'CUSTOM') return true;
  }

  if (period === 'ALL') return true;
  const txDate = new Date(dateStr + 'T00:00:00');
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'TODAY') {
    return (
      txDate.getFullYear() === now.getFullYear() &&
      txDate.getMonth() === now.getMonth() &&
      txDate.getDate() === now.getDate()
    );
  }

  if (period === 'YESTERDAY') {
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      txDate.getFullYear() === yesterday.getFullYear() &&
      txDate.getMonth() === yesterday.getMonth() &&
      txDate.getDate() === yesterday.getDate()
    );
  }

  if (period === 'CURRENT_WEEK') {
    const dayOfWeek = todayStart.getDay() || 7;
    const monday = new Date(todayStart);
    monday.setDate(todayStart.getDate() - (dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return txDate >= monday && txDate <= sunday;
  }

  if (period === 'LAST_WEEK') {
    const dayOfWeek = todayStart.getDay() || 7;
    const lastMonday = new Date(todayStart);
    lastMonday.setDate(todayStart.getDate() - (dayOfWeek - 1) - 7);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);
    return txDate >= lastMonday && txDate <= lastSunday;
  }

  if (period === 'MONTH') {
    return (
      txDate.getFullYear() === now.getFullYear() &&
      txDate.getMonth() === now.getMonth()
    );
  }

  if (period === 'LAST_MONTH') {
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return (
      txDate.getFullYear() === lastMonthDate.getFullYear() &&
      txDate.getMonth() === lastMonthDate.getMonth()
    );
  }

  if (period === 'YEAR') {
    return txDate.getFullYear() === now.getFullYear();
  }

  if (period === 'LAST_YEAR') {
    return txDate.getFullYear() === now.getFullYear() - 1;
  }

  if (period === 'Q1') {
    return (
      txDate.getFullYear() === now.getFullYear() &&
      txDate.getMonth() >= 0 &&
      txDate.getMonth() <= 2
    );
  }

  if (period === 'Q2') {
    return (
      txDate.getFullYear() === now.getFullYear() &&
      txDate.getMonth() >= 3 &&
      txDate.getMonth() <= 5
    );
  }

  if (period === 'Q3') {
    return (
      txDate.getFullYear() === now.getFullYear() &&
      txDate.getMonth() >= 6 &&
      txDate.getMonth() <= 8
    );
  }

  if (period === 'Q4') {
    return (
      txDate.getFullYear() === now.getFullYear() &&
      txDate.getMonth() >= 9 &&
      txDate.getMonth() <= 11
    );
  }

  return true;
}

/**
 * Formats a date string 'YYYY-MM-DD' into European format 'DD.MM.YYYY' (e.g. 15.10.2026)
 */
export function formatDateEuropean(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}
