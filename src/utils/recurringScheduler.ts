import { RecurringFrequency, RecurringMovement, Transaction } from '../types/finance';
import { Language } from './translations';

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isValidIsoDate(val?: string): val is string {
  return Boolean(val && /^\d{4}-\d{2}-\d{2}$/.test(val));
}

export function advanceRecurringDate(
  currentDate: string,
  frequency: RecurringFrequency = 'MONTHLY'
): string {
  const base = isValidIsoDate(currentDate) ? currentDate : getTodayIsoDate();
  const [yStr, mStr, dStr] = base.split('-');
  let year = Number(yStr);
  let month = Number(mStr) - 1; // 0-indexed
  const day = Number(dStr);

  if (frequency === 'WEEKLY') {
    const dt = new Date(year, month, day);
    dt.setDate(dt.getDate() + 7);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
      dt.getDate()
    ).padStart(2, '0')}`;
  }

  if (frequency === 'YEARLY') {
    year += 1;
    const maxDay = new Date(year, month + 1, 0).getDate();
    const clampedDay = Math.min(day, maxDay);
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
  }

  // MONTHLY (default)
  month += 1;
  if (month > 11) {
    month = 0;
    year += 1;
  }
  const maxDay = new Date(year, month + 1, 0).getDate();
  const clampedDay = Math.min(day, maxDay);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

export function diffDaysBetweenIso(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  const fromUtc = Date.UTC(fy, fm - 1, fd);
  const toUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((toUtc - fromUtc) / (1000 * 60 * 60 * 24));
}

export function processAutoRecurringMovements(
  recurringList: RecurringMovement[],
  todayStr: string = getTodayIsoDate()
): {
  updatedRecurring: RecurringMovement[];
  generatedTransactions: Transaction[];
} {
  const generatedTransactions: Transaction[] = [];
  let changed = false;

  const updatedRecurring = recurringList.map((rule, ruleIdx) => {
    if (!rule.autoExecute || !isValidIsoDate(rule.nextDueDate)) {
      return rule;
    }

    let dueDate = rule.nextDueDate;
    let lastApplied = rule.lastAppliedDate;
    const freq: RecurringFrequency = rule.frequency || 'MONTHLY';
    let guard = 0;

    while (dueDate <= todayStr && guard < 12) {
      if (lastApplied !== dueDate) {
        generatedTransactions.push({
          id: `auto_${rule.id}_${dueDate}_${Date.now()}_${ruleIdx}_${guard}`,
          date: dueDate,
          type: rule.type,
          account: rule.account,
          category: rule.category,
          amount: rule.amount,
          description: rule.description,
          notes: `Auto (${freq.toLowerCase()})`,
        });
        lastApplied = dueDate;
        changed = true;
      }
      dueDate = advanceRecurringDate(dueDate, freq);
      changed = true;
      guard += 1;
    }

    if (dueDate === rule.nextDueDate && lastApplied === rule.lastAppliedDate) {
      return rule;
    }

    return {
      ...rule,
      nextDueDate: dueDate,
      lastAppliedDate: lastApplied,
    };
  });

  if (!changed) {
    return { updatedRecurring: recurringList, generatedTransactions: [] };
  }

  return { updatedRecurring, generatedTransactions };
}

export interface ScheduledRecurringView {
  rule: RecurringMovement;
  dueDate: string;
  diffDays: number;
}

export function getScheduledRecurringItems(
  recurringList: RecurringMovement[],
  todayStr: string = getTodayIsoDate(),
  lookaheadDays = 14
): ScheduledRecurringView[] {
  return recurringList
    .filter((r) => isValidIsoDate(r.nextDueDate))
    .map((rule) => {
      const dueDate = rule.nextDueDate as string;
      return {
        rule,
        dueDate,
        diffDays: diffDaysBetweenIso(todayStr, dueDate),
      };
    })
    .filter((item) => item.diffDays <= lookaheadDays)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function formatRecurringFrequencyLabel(
  frequency: RecurringFrequency | undefined,
  language: Language
): string {
  const f = frequency || 'MONTHLY';
  if (language === 'de') {
    if (f === 'WEEKLY') return 'Wöchentlich';
    if (f === 'YEARLY') return 'Jährlich';
    return 'Monatlich';
  }
  if (language === 'en') {
    if (f === 'WEEKLY') return 'Weekly';
    if (f === 'YEARLY') return 'Yearly';
    return 'Monthly';
  }
  if (f === 'WEEKLY') return 'Settimanale';
  if (f === 'YEARLY') return 'Annuale';
  return 'Mensile';
}

export function formatDueStatusLabel(diffDays: number, language: Language): string {
  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    if (language === 'de') return abs === 1 ? 'Seit 1 Tag fällig' : `Seit ${abs} Tagen fällig`;
    if (language === 'en') return abs === 1 ? '1 day overdue' : `${abs} days overdue`;
    return abs === 1 ? 'Scaduto da 1 giorno' : `Scaduto da ${abs} giorni`;
  }
  if (diffDays === 0) {
    return language === 'de' ? 'Heute fällig' : language === 'en' ? 'Due today' : 'In scadenza oggi';
  }
  if (diffDays === 1) {
    return language === 'de' ? 'Morgen' : language === 'en' ? 'Tomorrow' : 'Domani';
  }
  if (language === 'de') return `In ${diffDays} Tagen`;
  if (language === 'en') return `In ${diffDays} days`;
  return `Tra ${diffDays} giorni`;
}
