import { QuickShortcut } from '../types/finance';

export const SHORTCUTS_STORAGE_KEY = 'myfinance_quick_shortcuts_v1';

export const DEFAULT_QUICK_SHORTCUTS: QuickShortcut[] = [
  {
    id: 'sc_coffee',
    label: 'Caffè',
    type: 'EXPENSE',
    amount: 1.5,
    account: 'Geldbörse',
    category: 'Ristoranti & Svago',
    description: 'Caffè al bar',
    tags: ['caffe'],
  },
  {
    id: 'sc_lunch',
    label: 'Pranzo',
    type: 'EXPENSE',
    amount: 12.0,
    account: 'Postepay',
    category: 'Ristoranti & Svago',
    description: 'Pranzo veloce',
    tags: ['pranzo'],
  },
  {
    id: 'sc_groceries',
    label: 'Spesa',
    type: 'EXPENSE',
    amount: 25.0,
    account: 'Girokonto',
    category: 'Alimentari & Spesa',
    description: 'Spesa supermercato',
    tags: ['supermercato'],
  },
  {
    id: 'sc_fuel',
    label: 'Benzina',
    type: 'EXPENSE',
    amount: 30.0,
    account: 'Postepay',
    category: 'Trasporti & Carburante',
    description: 'Rifornimento carburante',
    tags: ['carburante'],
  },
];

export function getQuickShortcuts(): QuickShortcut[] {
  try {
    const raw = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (!raw) return DEFAULT_QUICK_SHORTCUTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return DEFAULT_QUICK_SHORTCUTS;
  } catch {
    return DEFAULT_QUICK_SHORTCUTS;
  }
}

export function saveQuickShortcuts(shortcuts: QuickShortcut[]): void {
  try {
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcuts));
  } catch {
    // ignore storage errors
  }
}
