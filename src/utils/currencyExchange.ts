import { Account, CurrencyCode, FxSettings } from '../types/finance';
import { getCurrencyCode } from './formatters';

export const FX_STORAGE_KEY = 'myfinance_fx_settings_v1';

export const DEFAULT_FX_RATES: Record<CurrencyCode, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.85,
  JPY: 163.5,
  CHF: 0.94,
};

export const DEFAULT_FX_SETTINGS: FxSettings = {
  baseCurrency: 'EUR',
  rates: { ...DEFAULT_FX_RATES },
  source: 'default',
};

export function getFxSettings(): FxSettings {
  try {
    const raw = localStorage.getItem(FX_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_FX_SETTINGS, rates: { ...DEFAULT_FX_RATES } };
    const parsed = JSON.parse(raw) as Partial<FxSettings>;
    const baseCurrency = getCurrencyCode(parsed.baseCurrency || 'EUR');
    const rates: Record<CurrencyCode, number> = {
      EUR: 1,
      USD: Number(parsed.rates?.USD) > 0 ? Number(parsed.rates?.USD) : DEFAULT_FX_RATES.USD,
      GBP: Number(parsed.rates?.GBP) > 0 ? Number(parsed.rates?.GBP) : DEFAULT_FX_RATES.GBP,
      JPY: Number(parsed.rates?.JPY) > 0 ? Number(parsed.rates?.JPY) : DEFAULT_FX_RATES.JPY,
      CHF: Number(parsed.rates?.CHF) > 0 ? Number(parsed.rates?.CHF) : DEFAULT_FX_RATES.CHF,
    };
    return {
      baseCurrency,
      rates,
      lastUpdatedAt: parsed.lastUpdatedAt,
      source: parsed.source || 'default',
    };
  } catch {
    return { ...DEFAULT_FX_SETTINGS, rates: { ...DEFAULT_FX_RATES } };
  }
}

export function saveFxSettings(settings: FxSettings): void {
  try {
    localStorage.setItem(FX_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage quota errors
  }
}

export function getAccountCurrencyCode(
  accountIdOrName: string | undefined,
  accounts: Account[]
): CurrencyCode {
  if (!accountIdOrName) return 'EUR';
  const match = accounts.find((a) => a.id === accountIdOrName || a.name === accountIdOrName);
  return getCurrencyCode(match?.currency || 'EUR');
}

export function convertCurrencyAmount(
  amount: number,
  fromCurrency: CurrencyCode | string | undefined,
  toCurrency: CurrencyCode | string | undefined,
  rates: Record<CurrencyCode, number> = DEFAULT_FX_RATES
): number {
  const fromCode = getCurrencyCode(fromCurrency);
  const toCode = getCurrencyCode(toCurrency);
  if (fromCode === toCode || !amount) return amount;

  const fromRate = rates[fromCode] > 0 ? rates[fromCode] : DEFAULT_FX_RATES[fromCode] || 1;
  const toRate = rates[toCode] > 0 ? rates[toCode] : DEFAULT_FX_RATES[toCode] || 1;
  const amountInEur = amount / fromRate;
  return amountInEur * toRate;
}

export interface CurrencyBreakdownItem {
  currency: CurrencyCode;
  nativeTotal: number;
  convertedTotal: number;
  accountCount: number;
  sharePct: number;
}

export interface UnifiedNetWorthSummary {
  totalUnified: number;
  baseCurrency: CurrencyCode;
  hasMultipleCurrencies: boolean;
  currenciesUsed: CurrencyCode[];
  breakdown: CurrencyBreakdownItem[];
}

export function computeUnifiedNetWorth(
  accounts: Account[],
  balances: Record<string, number>,
  fxSettings: FxSettings
): UnifiedNetWorthSummary {
  const baseCurrency = getCurrencyCode(fxSettings.baseCurrency);
  const byCurr = new Map<
    CurrencyCode,
    { nativeTotal: number; convertedTotal: number; accountCount: number }
  >();

  accounts.forEach((acc) => {
    const nativeBal = balances[acc.id] ?? balances[acc.name] ?? 0;
    const curr = getCurrencyCode(acc.currency);
    const converted = convertCurrencyAmount(nativeBal, curr, baseCurrency, fxSettings.rates);

    const existing = byCurr.get(curr) || { nativeTotal: 0, convertedTotal: 0, accountCount: 0 };
    existing.nativeTotal += nativeBal;
    existing.convertedTotal += converted;
    existing.accountCount += 1;
    byCurr.set(curr, existing);
  });

  const entries = Array.from(byCurr.entries());
  const totalUnified = entries.reduce((sum, [, v]) => sum + v.convertedTotal, 0);
  const absTotal = entries.reduce((sum, [, v]) => sum + Math.abs(v.convertedTotal), 0);

  const breakdown: CurrencyBreakdownItem[] = entries
    .map(([currency, v]) => ({
      currency,
      nativeTotal: v.nativeTotal,
      convertedTotal: v.convertedTotal,
      accountCount: v.accountCount,
      sharePct: absTotal > 0 ? (Math.abs(v.convertedTotal) / absTotal) * 100 : 0,
    }))
    .sort((a, b) => Math.abs(b.convertedTotal) - Math.abs(a.convertedTotal));

  const currenciesUsed = breakdown.map((b) => b.currency);
  const hasMultipleCurrencies =
    currenciesUsed.length > 1 || (currenciesUsed.length === 1 && currenciesUsed[0] !== baseCurrency);

  return {
    totalUnified,
    baseCurrency,
    hasMultipleCurrencies,
    currenciesUsed,
    breakdown,
  };
}

export async function fetchLiveFxRates(): Promise<{
  rates: Record<CurrencyCode, number>;
  lastUpdatedAt: string;
  source: 'live' | 'default';
}> {
  const isLocalStandalone =
    typeof window !== 'undefined' &&
    ['file:', 'capacitor:', 'ionic:', 'app:'].includes(window.location.protocol);

  const urls: string[] = [];
  if (!isLocalStandalone) {
    urls.push('/api/fx/rates');
  }
  urls.push('https://api.frankfurter.app/latest?from=EUR&to=USD,GBP,JPY,CHF');

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      const rawRates = data?.rates;
      if (rawRates && typeof rawRates === 'object') {
        const rates: Record<CurrencyCode, number> = {
          EUR: 1,
          USD: Number(rawRates.USD) > 0 ? Number(rawRates.USD) : DEFAULT_FX_RATES.USD,
          GBP: Number(rawRates.GBP) > 0 ? Number(rawRates.GBP) : DEFAULT_FX_RATES.GBP,
          JPY: Number(rawRates.JPY) > 0 ? Number(rawRates.JPY) : DEFAULT_FX_RATES.JPY,
          CHF: Number(rawRates.CHF) > 0 ? Number(rawRates.CHF) : DEFAULT_FX_RATES.CHF,
        };
        return {
          rates,
          lastUpdatedAt: typeof data.date === 'string' ? data.date : new Date().toISOString().slice(0, 10),
          source: data.source === 'default' ? 'default' : 'live',
        };
      }
    } catch {
      // try next endpoint
    }
  }

  return {
    rates: { ...DEFAULT_FX_RATES },
    lastUpdatedAt: new Date().toISOString().slice(0, 10),
    source: 'default',
  };
}
