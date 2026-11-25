import { Account, CurrencyCode, FxSettings, RecurringMovement, Transaction } from '../types/finance';
import { convertCurrencyAmount, getAccountCurrencyCode } from './currencyExchange';
import { advanceRecurringDate, getTodayIsoDate, isValidIsoDate } from './recurringScheduler';

export interface MonthlyCashflowForecast {
  monthKey: string;
  endOfMonthIso: string;
  dayOfMonth: number;
  totalDaysInMonth: number;
  remainingDays: number;
  baseCurrency: CurrencyCode;
  currentUnifiedBalance: number;
  actualIncome: number;
  actualExpense: number;
  netActual: number;
  upcomingRecurringIncome: number;
  upcomingRecurringExpense: number;
  upcomingRecurringCount: number;
  dailyVariablePace: number;
  estimatedRemainingVariableExpense: number;
  projectedMonthIncome: number;
  projectedMonthExpense: number;
  projectedNetCashflow: number;
  projectedEndBalance: number;
}

export type BudgetAlertStatus = 'EXCEEDED' | 'WARNING' | 'PACING_RISK' | 'OK';

export interface BudgetAlertItem {
  category: string;
  spent: number;
  limit: number;
  pctUsed: number;
  projectedSpend: number;
  projectedPct: number;
  remainingDailyAllowance: number;
  status: BudgetAlertStatus;
}

export function computeMonthlyCashflowForecast(params: {
  accounts: Account[];
  currentUnifiedBalance: number;
  transactions: Transaction[];
  recurring: RecurringMovement[];
  fxSettings: FxSettings;
  todayStr?: string;
}): MonthlyCashflowForecast {
  const {
    accounts,
    currentUnifiedBalance,
    transactions,
    recurring,
    fxSettings,
    todayStr = getTodayIsoDate(),
  } = params;

  const [yStr, mStr, dStr] = todayStr.split('-');
  const year = Number(yStr);
  const monthIdx = Number(mStr) - 1;
  const dayOfMonth = Math.max(1, Number(dStr));
  const totalDaysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const remainingDays = Math.max(0, totalDaysInMonth - dayOfMonth);
  const monthKey = `${yStr}-${mStr}`;
  const endOfMonthIso = `${yStr}-${mStr}-${String(totalDaysInMonth).padStart(2, '0')}`;
  const baseCurrency = fxSettings.baseCurrency;

  let actualIncome = 0;
  let actualExpense = 0;
  let nonAutoExpense = 0;

  transactions.forEach((tx) => {
    if (!tx.date || !tx.date.startsWith(monthKey)) return;
    if (tx.type === 'TRANSFER') return;
    const accCurr = getAccountCurrencyCode(tx.account, accounts);
    const converted = convertCurrencyAmount(Number(tx.amount) || 0, accCurr, baseCurrency, fxSettings.rates);

    if (tx.type === 'INCOME') {
      actualIncome += converted;
    } else if (tx.type === 'EXPENSE') {
      actualExpense += converted;
      if (!tx.notes || !tx.notes.startsWith('Auto (')) {
        nonAutoExpense += converted;
      }
    }
  });

  // Project upcoming recurring items from tomorrow through end of current month
  let upcomingRecurringIncome = 0;
  let upcomingRecurringExpense = 0;
  let upcomingRecurringCount = 0;

  recurring.forEach((rule) => {
    if (!isValidIsoDate(rule.nextDueDate)) return;
    let cursor = rule.nextDueDate;
    const freq = rule.frequency || 'MONTHLY';
    const accCurr = getAccountCurrencyCode(rule.account, accounts);
    const convertedAmt = convertCurrencyAmount(Number(rule.amount) || 0, accCurr, baseCurrency, fxSettings.rates);

    let guard = 0;
    while (cursor <= endOfMonthIso && guard < 6) {
      if (cursor > todayStr || (cursor === todayStr && rule.lastAppliedDate !== todayStr)) {
        if (rule.type === 'INCOME') {
          upcomingRecurringIncome += convertedAmt;
        } else {
          upcomingRecurringExpense += convertedAmt;
        }
        upcomingRecurringCount += 1;
      }
      cursor = advanceRecurringDate(cursor, freq);
      guard += 1;
    }
  });

  // Estimate remaining variable spending pace based on current month non-recurring pace
  const dailyVariablePace = dayOfMonth > 0 ? nonAutoExpense / dayOfMonth : 0;
  const estimatedRemainingVariableExpense = dailyVariablePace * remainingDays;

  const projectedMonthIncome = actualIncome + upcomingRecurringIncome;
  const projectedMonthExpense =
    actualExpense + upcomingRecurringExpense + estimatedRemainingVariableExpense;
  const projectedNetCashflow = projectedMonthIncome - projectedMonthExpense;
  const projectedEndBalance =
    currentUnifiedBalance +
    upcomingRecurringIncome -
    upcomingRecurringExpense -
    estimatedRemainingVariableExpense;

  return {
    monthKey,
    endOfMonthIso,
    dayOfMonth,
    totalDaysInMonth,
    remainingDays,
    baseCurrency,
    currentUnifiedBalance,
    actualIncome,
    actualExpense,
    netActual: actualIncome - actualExpense,
    upcomingRecurringIncome,
    upcomingRecurringExpense,
    upcomingRecurringCount,
    dailyVariablePace,
    estimatedRemainingVariableExpense,
    projectedMonthIncome,
    projectedMonthExpense,
    projectedNetCashflow,
    projectedEndBalance,
  };
}

export function computeBudgetAlerts(params: {
  budgets: Record<string, number>;
  transactions: Transaction[];
  accounts: Account[];
  fxSettings: FxSettings;
  todayStr?: string;
}): BudgetAlertItem[] {
  const { budgets, transactions, accounts, fxSettings, todayStr = getTodayIsoDate() } = params;
  const [yStr, mStr, dStr] = todayStr.split('-');
  const year = Number(yStr);
  const monthIdx = Number(mStr) - 1;
  const dayOfMonth = Math.max(1, Number(dStr));
  const totalDaysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const remainingDays = Math.max(1, totalDaysInMonth - dayOfMonth);
  const monthKey = `${yStr}-${mStr}`;

  const spentByCategory: Record<string, number> = {};
  transactions.forEach((tx) => {
    if (tx.type !== 'EXPENSE' || !tx.date?.startsWith(monthKey)) return;
    const accCurr = getAccountCurrencyCode(tx.account, accounts);
    const converted = convertCurrencyAmount(
      Number(tx.amount) || 0,
      accCurr,
      fxSettings.baseCurrency,
      fxSettings.rates
    );
    spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + converted;
  });

  const items: BudgetAlertItem[] = Object.entries(budgets)
    .filter(([, limit]) => Number(limit) > 0)
    .map(([category, limit]) => {
      const spent = spentByCategory[category] || 0;
      const pctUsed = (spent / limit) * 100;
      const projectedSpend = (spent / dayOfMonth) * totalDaysInMonth;
      const projectedPct = (projectedSpend / limit) * 100;
      const remainingDailyAllowance = Math.max(0, (limit - spent) / remainingDays);

      let status: BudgetAlertStatus = 'OK';
      if (pctUsed >= 100) {
        status = 'EXCEEDED';
      } else if (pctUsed >= 80) {
        status = 'WARNING';
      } else if (projectedPct > 105 && spent > 0) {
        status = 'PACING_RISK';
      }

      return {
        category,
        spent,
        limit,
        pctUsed,
        projectedSpend,
        projectedPct,
        remainingDailyAllowance,
        status,
      };
    });

  const priority: Record<BudgetAlertStatus, number> = {
    EXCEEDED: 0,
    WARNING: 1,
    PACING_RISK: 2,
    OK: 3,
  };

  return items.sort((a, b) => {
    if (priority[a.status] !== priority[b.status]) {
      return priority[a.status] - priority[b.status];
    }
    return b.pctUsed - a.pctUsed;
  });
}

