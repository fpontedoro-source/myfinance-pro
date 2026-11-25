export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type CurrencyCode = 'EUR' | 'USD' | 'JPY' | 'GBP' | 'CHF';

export interface Account {
  id: string;
  name: string;
  icon: string;
  color: string;
  badgeColor: string;
  type?: string;
  currency?: CurrencyCode | string;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  account?: string;
  fromAccount?: string;
  toAccount?: string;
  category: string;
  amount: number;
  convertedAmount?: number;
  description: string;
  notes?: string;
  tags?: string[];
}

export type RecurringFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringMovement {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  account: string;
  category: string;
  frequency?: RecurringFrequency;
  autoExecute?: boolean;
  nextDueDate?: string;
  lastAppliedDate?: string;
  tags?: string[];
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  targetDate?: string;
}

export interface CategoryRule {
  id: string;
  keyword: string;
  category: string;
  tags?: string[];
  type?: 'INCOME' | 'EXPENSE' | 'ANY';
  enabled: boolean;
}

export interface FxSettings {
  baseCurrency: CurrencyCode;
  rates: Record<CurrencyCode, number>; // Units of currency per 1 EUR
  lastUpdatedAt?: string;
  source?: 'live' | 'manual' | 'default';
}

export type PeriodFilter =
  | 'ALL'
  | 'TODAY'
  | 'YESTERDAY'
  | 'CURRENT_WEEK'
  | 'LAST_WEEK'
  | 'MONTH'
  | 'LAST_MONTH'
  | 'YEAR'
  | 'LAST_YEAR'
  | 'Q1'
  | 'Q2'
  | 'Q3'
  | 'Q4'
  | 'CUSTOM';

export type TabType = 'home' | 'transactions' | 'budgets' | 'analytics' | 'settings';

export interface QuickShortcut {
  id: string;
  label: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  account: string;
  category: string;
  description: string;
  tags?: string[];
}

export type DebtCreditDirection = 'CREDIT' | 'DEBT';
export type DebtCreditSubtype = 'SHARED_EXPENSE' | 'LOAN' | 'INSTALLMENT';
export type DebtCreditStatus = 'OPEN' | 'SETTLED';

export interface DebtCreditEntry {
  id: string;
  title: string;
  counterparty: string;
  direction: DebtCreditDirection;
  subtype: DebtCreditSubtype;
  totalAmount: number;
  remainingAmount: number;
  currency?: CurrencyCode | string;
  monthlyInstallment?: number;
  totalInstallments?: number;
  paidInstallments?: number;
  dueDate?: string;
  account?: string;
  notes?: string;
  status: DebtCreditStatus;
  createdAt: string;
  updatedAt?: string;
}


