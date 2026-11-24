import { DebtCreditEntry, DebtCreditSubtype, FxSettings } from '../types/finance';
import { convertCurrencyAmount, DEFAULT_FX_SETTINGS } from './currencyExchange';
import { Language } from './translations';

export const DEBTS_CREDITS_STORAGE_KEY = 'myfinance_debts_credits_v1';

const getRelativeDateStr = (daysAhead: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const DEFAULT_DEBTS_CREDITS: DebtCreditEntry[] = [
  {
    id: 'dc_demo_1',
    title: 'Anticipo Cena Condivisa',
    counterparty: 'Marco R.',
    direction: 'CREDIT',
    subtype: 'SHARED_EXPENSE',
    totalAmount: 65,
    remainingAmount: 65,
    currency: 'EUR',
    dueDate: getRelativeDateStr(7),
    account: 'Girokonto',
    notes: 'Quota ristorante anticipata',
    status: 'OPEN',
    createdAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'dc_demo_2',
    title: 'Piano Rate Smartphone',
    counterparty: 'Store Elettronica',
    direction: 'DEBT',
    subtype: 'INSTALLMENT',
    totalAmount: 420,
    remainingAmount: 210,
    currency: 'EUR',
    monthlyInstallment: 35,
    totalInstallments: 12,
    paidInstallments: 6,
    dueDate: getRelativeDateStr(12),
    account: 'Postepay',
    notes: 'Tasso 0% · 6 rate residue',
    status: 'OPEN',
    createdAt: new Date().toISOString().split('T')[0],
  },
];

export function getDebtsCredits(): DebtCreditEntry[] {
  if (typeof localStorage === 'undefined') return [...DEFAULT_DEBTS_CREDITS];
  try {
    const raw = localStorage.getItem(DEBTS_CREDITS_STORAGE_KEY);
    if (raw === null) return [...DEFAULT_DEBTS_CREDITS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [...DEFAULT_DEBTS_CREDITS];
  }
}

export function saveDebtsCredits(items: DebtCreditEntry[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(DEBTS_CREDITS_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage quota errors
  }
}

export interface DebtCreditSummary {
  totalCredits: number;
  totalDebts: number;
  netAdjustment: number; // totalCredits - totalDebts
  monthlyInstallmentsCommitment: number;
  openCreditsCount: number;
  openDebtsCount: number;
  openCount: number;
  settledCount: number;
}

export function computeDebtCreditSummary(
  items: DebtCreditEntry[],
  fxSettings: FxSettings = DEFAULT_FX_SETTINGS
): DebtCreditSummary {
  let totalCredits = 0;
  let totalDebts = 0;
  let monthlyInstallmentsCommitment = 0;
  let openCreditsCount = 0;
  let openDebtsCount = 0;
  let settledCount = 0;

  items.forEach((item) => {
    const remaining = Math.max(0, Number(item.remainingAmount) || 0);
    const isSettled = item.status === 'SETTLED' || remaining <= 0.005;
    if (isSettled) {
      settledCount += 1;
      return;
    }

    const convertedRemaining = convertCurrencyAmount(
      remaining,
      item.currency || 'EUR',
      fxSettings.baseCurrency,
      fxSettings.rates
    );

    if (item.direction === 'CREDIT') {
      totalCredits += convertedRemaining;
      openCreditsCount += 1;
    } else {
      totalDebts += convertedRemaining;
      openDebtsCount += 1;
      if (item.monthlyInstallment && item.monthlyInstallment > 0) {
        const convertedInst = convertCurrencyAmount(
          item.monthlyInstallment,
          item.currency || 'EUR',
          fxSettings.baseCurrency,
          fxSettings.rates
        );
        monthlyInstallmentsCommitment += Math.min(convertedRemaining, convertedInst);
      }
    }
  });

  return {
    totalCredits: Math.round(totalCredits * 100) / 100,
    totalDebts: Math.round(totalDebts * 100) / 100,
    netAdjustment: Math.round((totalCredits - totalDebts) * 100) / 100,
    monthlyInstallmentsCommitment: Math.round(monthlyInstallmentsCommitment * 100) / 100,
    openCreditsCount,
    openDebtsCount,
    openCount: openCreditsCount + openDebtsCount,
    settledCount,
  };
}

export function recordDebtCreditPayment(
  entry: DebtCreditEntry,
  payAmount: number,
  incrementInstallment: boolean = true
): DebtCreditEntry {
  const safePay = Math.max(0, Number(payAmount) || 0);
  const nextRemaining = Math.max(0, Math.round((entry.remainingAmount - safePay) * 100) / 100);
  const isSettled = nextRemaining <= 0.005;

  let nextPaidInst = entry.paidInstallments;
  if (
    incrementInstallment &&
    entry.totalInstallments &&
    entry.totalInstallments > 0
  ) {
    const currentPaid = entry.paidInstallments || 0;
    nextPaidInst = isSettled
      ? entry.totalInstallments
      : Math.min(entry.totalInstallments, currentPaid + 1);
  }

  return {
    ...entry,
    remainingAmount: isSettled ? 0 : nextRemaining,
    paidInstallments: nextPaidInst,
    status: isSettled ? 'SETTLED' : 'OPEN',
    updatedAt: new Date().toISOString(),
  };
}

export function getDebtCreditSubtypeLabel(
  subtype: DebtCreditSubtype,
  language: Language = 'it'
): string {
  const isDe = language === 'de';
  const isEn = language === 'en';
  if (subtype === 'SHARED_EXPENSE') {
    return isDe ? 'Geteilte Ausgabe' : isEn ? 'Shared Expense' : 'Spesa Condivisa';
  }
  if (subtype === 'INSTALLMENT') {
    return isDe ? 'Ratenzahlung' : isEn ? 'Installments' : 'Piano a Rate';
  }
  return isDe ? 'Darlehen / Kredit' : isEn ? 'Loan' : 'Prestito';
}
