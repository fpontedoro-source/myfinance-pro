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

export interface SafeToSpendSummary {
  dailyAllowance: number;
  remainingToday: number;
  spentToday: number;
  availablePool: number;
  upcomingRecurringExpense: number;
  upcomingRecurringIncome: number;
  daysRemainingIncludingToday: number;
  mode: 'budget' | 'liquidity';
  todayProgressPct: number;
  baseCurrency: CurrencyCode;
}

export function computeSafeToSpend(params: {
  accounts: Account[];
  currentUnifiedBalance: number;
  transactions: Transaction[];
  recurring: RecurringMovement[];
  budgets: Record<string, number>;
  fxSettings: FxSettings;
  todayStr?: string;
}): SafeToSpendSummary {
  const {
    accounts,
    currentUnifiedBalance,
    transactions,
    recurring,
    budgets,
    fxSettings,
    todayStr = getTodayIsoDate(),
  } = params;

  const [yStr, mStr, dStr] = todayStr.split('-');
  const year = Number(yStr);
  const monthIdx = Number(mStr) - 1;
  const dayOfMonth = Math.max(1, Number(dStr));
  const totalDaysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const daysRemainingIncludingToday = Math.max(1, totalDaysInMonth - dayOfMonth + 1);
  const monthKey = `${yStr}-${mStr}`;
  const endOfMonthIso = `${yStr}-${mStr}-${String(totalDaysInMonth).padStart(2, '0')}`;
  const baseCurrency = fxSettings.baseCurrency;

  let spentToday = 0;
  const spentByCategory: Record<string, number> = {};

  transactions.forEach((tx) => {
    if (tx.type !== 'EXPENSE' || !tx.date?.startsWith(monthKey)) return;
    const accCurr = getAccountCurrencyCode(tx.account, accounts);
    const converted = convertCurrencyAmount(
      Number(tx.amount) || 0,
      accCurr,
      baseCurrency,
      fxSettings.rates
    );
    spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + converted;
    if (tx.date === todayStr) {
      spentToday += converted;
    }
  });

  // Upcoming recurring from today (if not yet applied today) through end of month
  let upcomingRecurringIncome = 0;
  let upcomingRecurringExpense = 0;
  recurring.forEach((rule) => {
    if (!isValidIsoDate(rule.nextDueDate)) return;
    let cursor = rule.nextDueDate;
    const freq = rule.frequency || 'MONTHLY';
    const accCurr = getAccountCurrencyCode(rule.account, accounts);
    const convertedAmt = convertCurrencyAmount(
      Number(rule.amount) || 0,
      accCurr,
      baseCurrency,
      fxSettings.rates
    );

    let guard = 0;
    while (cursor <= endOfMonthIso && guard < 10) {
      if (cursor > todayStr || (cursor === todayStr && rule.lastAppliedDate !== todayStr)) {
        if (rule.type === 'INCOME') {
          upcomingRecurringIncome += convertedAmt;
        } else {
          upcomingRecurringExpense += convertedAmt;
        }
      }
      cursor = advanceRecurringDate(cursor, freq);
      guard += 1;
    }
  });

  const activeBudgetEntries = Object.entries(budgets).filter(([, limit]) => Number(limit) > 0);
  const liquidAfterBills = currentUnifiedBalance - upcomingRecurringExpense;

  let availablePool = liquidAfterBills;
  let mode: 'budget' | 'liquidity' = 'liquidity';

  if (activeBudgetEntries.length > 0) {
    mode = 'budget';
    let remainingBudget = 0;
    activeBudgetEntries.forEach(([cat, limit]) => {
      const spent = spentByCategory[cat] || 0;
      remainingBudget += Math.max(0, Number(limit) - spent);
    });
    availablePool = Math.max(0, Math.min(remainingBudget, Math.max(0, liquidAfterBills)));
  } else {
    availablePool = Math.max(0, liquidAfterBills);
  }

  // Add back today's discretionary spend when computing the start-of-today daily allowance
  // so remainingToday cleanly reflects dailyAllowance - spentToday
  const startOfDayPool = availablePool + spentToday;
  const dailyAllowance = startOfDayPool / daysRemainingIncludingToday;
  const remainingToday = dailyAllowance - spentToday;
  const todayProgressPct =
    dailyAllowance > 0 ? Math.min(100, Math.max(0, (spentToday / dailyAllowance) * 100)) : spentToday > 0 ? 100 : 0;

  return {
    dailyAllowance,
    remainingToday,
    spentToday,
    availablePool,
    upcomingRecurringExpense,
    upcomingRecurringIncome,
    daysRemainingIncludingToday,
    mode,
    todayProgressPct,
    baseCurrency,
  };
}

export interface CalendarDueEvent {
  id: string;
  date: string;
  kind: 'RECURRING' | 'DEBT' | 'CREDIT';
  direction: 'INCOME' | 'EXPENSE';
  title: string;
  subtitle: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  ruleId?: string;
  frequency?: string;
  autoExecute?: boolean;
  isAppliedToday?: boolean;
  isOverdue?: boolean;
}

export interface MonthlyDueCalendarData {
  year: number;
  monthIndex: number;
  monthKey: string;
  daysInMonth: number;
  firstWeekdayMon0: number;
  eventsByDate: Record<string, CalendarDueEvent[]>;
  totalExpectedIncome: number;
  totalExpectedExpense: number;
  eventCount: number;
}

export function buildMonthlyDueCalendar(params: {
  year: number;
  monthIndex: number;
  recurring: RecurringMovement[];
  debtsCredits: Array<{
    id: string;
    title: string;
    counterparty: string;
    direction: 'CREDIT' | 'DEBT';
    remainingAmount: number;
    monthlyInstallment?: number;
    currency?: string;
    dueDate?: string;
    account?: string;
    status: 'OPEN' | 'SETTLED';
  }>;
  accounts: Account[];
  fxSettings: FxSettings;
  todayStr?: string;
}): MonthlyDueCalendarData {
  const {
    year,
    monthIndex,
    recurring,
    debtsCredits,
    accounts,
    fxSettings,
    todayStr = getTodayIsoDate(),
  } = params;

  const mStr = String(monthIndex + 1).padStart(2, '0');
  const monthKey = `${year}-${mStr}`;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthStartIso = `${monthKey}-01`;
  const monthEndIso = `${monthKey}-${String(daysInMonth).padStart(2, '0')}`;
  // Convert JS Sunday=0..Saturday=6 to Monday=0..Sunday=6
  const jsDay = new Date(year, monthIndex, 1).getDay();
  const firstWeekdayMon0 = (jsDay + 6) % 7;

  const eventsByDate: Record<string, CalendarDueEvent[]> = {};
  let totalExpectedIncome = 0;
  let totalExpectedExpense = 0;
  let eventCount = 0;

  const pushEvent = (ev: CalendarDueEvent) => {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push(ev);
    eventCount += 1;
    if (ev.direction === 'INCOME') {
      totalExpectedIncome += ev.convertedAmount;
    } else {
      totalExpectedExpense += ev.convertedAmount;
    }
  };

  recurring.forEach((rule) => {
    if (!isValidIsoDate(rule.nextDueDate)) return;
    let cursor = rule.nextDueDate;
    const freq = rule.frequency || 'MONTHLY';
    const accObj = accounts.find((a) => a.id === rule.account || a.name === rule.account);
    const curr = accObj?.currency || fxSettings.baseCurrency;
    const convertedAmt = convertCurrencyAmount(
      Number(rule.amount) || 0,
      curr,
      fxSettings.baseCurrency,
      fxSettings.rates
    );

    let guard = 0;
    while (cursor <= monthEndIso && guard < 60) {
      if (cursor >= monthStartIso) {
        pushEvent({
          id: `rec_${rule.id}_${cursor}`,
          date: cursor,
          kind: 'RECURRING',
          direction: rule.type,
          title: rule.description,
          subtitle: accObj?.name || rule.category,
          amount: Number(rule.amount) || 0,
          currency: curr,
          convertedAmount: convertedAmt,
          ruleId: rule.id,
          frequency: freq,
          autoExecute: rule.autoExecute,
          isAppliedToday: cursor === todayStr && rule.lastAppliedDate === todayStr,
          isOverdue: cursor < todayStr && cursor === rule.nextDueDate,
        });
      }
      cursor = advanceRecurringDate(cursor, freq);
      guard += 1;
    }
  });

  debtsCredits.forEach((entry) => {
    if (entry.status === 'SETTLED' || entry.remainingAmount <= 0.005) return;
    if (!isValidIsoDate(entry.dueDate)) return;
    if (entry.dueDate < monthStartIso || entry.dueDate > monthEndIso) return;

    const amt =
      entry.monthlyInstallment && entry.monthlyInstallment > 0
        ? Math.min(entry.remainingAmount, entry.monthlyInstallment)
        : entry.remainingAmount;
    const curr = entry.currency || getAccountCurrencyCode(entry.account, accounts);
    const convertedAmt = convertCurrencyAmount(
      amt,
      curr,
      fxSettings.baseCurrency,
      fxSettings.rates
    );

    pushEvent({
      id: `dc_${entry.id}_${entry.dueDate}`,
      date: entry.dueDate,
      kind: entry.direction === 'CREDIT' ? 'CREDIT' : 'DEBT',
      direction: entry.direction === 'CREDIT' ? 'INCOME' : 'EXPENSE',
      title: entry.title,
      subtitle: entry.counterparty,
      amount: amt,
      currency: curr,
      convertedAmount: convertedAmt,
      isOverdue: entry.dueDate < todayStr,
    });
  });

  return {
    year,
    monthIndex,
    monthKey,
    daysInMonth,
    firstWeekdayMon0,
    eventsByDate,
    totalExpectedIncome,
    totalExpectedExpense,
    eventCount,
  };
}

