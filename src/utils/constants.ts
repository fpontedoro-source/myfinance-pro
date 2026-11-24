import { Account, RecurringMovement, Goal } from '../types/finance';

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'Girokonto',
    name: 'Girokonto',
    icon: 'landmark',
    color: 'from-blue-600 to-indigo-600',
    badgeColor: 'bg-blue-500/10 text-blue-400',
    currency: 'EUR',
  },
  {
    id: 'Sparbuch',
    name: 'Sparbuch',
    icon: 'piggy-bank',
    color: 'from-emerald-600 to-teal-600',
    badgeColor: 'bg-emerald-500/10 text-emerald-400',
    currency: 'EUR',
  },
  {
    id: 'Postepay',
    name: 'Postepay',
    icon: 'credit-card',
    color: 'from-amber-500 to-yellow-600',
    badgeColor: 'bg-amber-500/10 text-amber-400',
    currency: 'EUR',
  },
  {
    id: 'Credit Agricole',
    name: 'Credit Agricole',
    icon: 'building-2',
    color: 'from-cyan-600 to-blue-700',
    badgeColor: 'bg-cyan-500/10 text-cyan-400',
    currency: 'EUR',
  },
  {
    id: 'Geldbörse',
    name: 'Geldbörse',
    icon: 'wallet',
    color: 'from-purple-600 to-pink-600',
    badgeColor: 'bg-purple-500/10 text-purple-400',
    currency: 'EUR',
  },
];

export const DEFAULT_CATEGORIES: string[] = [
  'Stipendio / Reddito',
  'Alimentari & Spesa',
  'Casa & Utente',
  'Canone & Commissione',
  'Imposta di Bollo',
  'Ricarica Telefonica',
  'Viale Alpi 35',
  'Sali & Tabacchi',
  'Ristoranti & Svago',
  'Trasporti & Carburante',
  'Salute & Cura',
  'Shopping & Vestiti',
  'Abbonamenti & Servizi',
  'Risparmi & Investimenti',
  'Altro',
];

export const DEFAULT_TRANSACTIONS = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    type: 'INCOME' as const,
    account: 'Girokonto',
    category: 'Stipendio / Reddito',
    amount: 2100.0,
    description: 'Stipendio mensile',
  },
  {
    id: '2',
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE' as const,
    account: 'Credit Agricole',
    category: 'Casa & Utente',
    amount: 450.0,
    description: 'Affitto / Mutuo',
  },
  {
    id: '3',
    date: new Date().toISOString().split('T')[0],
    type: 'INCOME' as const,
    account: 'Sparbuch',
    category: 'Risparmi & Investimenti',
    amount: 3500.0,
    description: 'Fondo Risparmio Iniziale',
  },
  {
    id: '4',
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE' as const,
    account: 'Postepay',
    category: 'Sali & Tabacchi',
    amount: 12.0,
    description: 'Acquisto Sali & Tabacchi',
  },
  {
    id: '5',
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE' as const,
    account: 'Postepay',
    category: 'Canone & Commissione',
    amount: 2.5,
    description: 'Canone mensile carta',
  },
  {
    id: '6',
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE' as const,
    account: 'Girokonto',
    category: 'Imposta di Bollo',
    amount: 8.55,
    description: 'Imposta di bollo',
  },
  {
    id: '7',
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE' as const,
    account: 'Credit Agricole',
    category: 'Ricarica Telefonica',
    amount: 15.0,
    description: 'Ricarica cellulare',
  },
  {
    id: '8',
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE' as const,
    account: 'Girokonto',
    category: 'Viale Alpi 35',
    amount: 120.0,
    description: 'Spesa Viale Alpi 35',
  },
  {
    id: '9',
    date: new Date().toISOString().split('T')[0],
    type: 'INCOME' as const,
    account: 'Geldbörse',
    category: 'Altro',
    amount: 120.0,
    description: 'Contanti Disponibili',
  },
];

const getUpcomingDefaultDate = (daysAhead: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const DEFAULT_RECURRING: RecurringMovement[] = [
  {
    id: 'r1',
    description: 'Canone Carta Postepay',
    amount: 2.5,
    type: 'EXPENSE',
    account: 'Postepay',
    category: 'Canone & Commissione',
    frequency: 'MONTHLY',
    autoExecute: false,
    nextDueDate: getUpcomingDefaultDate(2),
  },
  {
    id: 'r2',
    description: 'Affitto Viale Alpi 35',
    amount: 120.0,
    type: 'EXPENSE',
    account: 'Girokonto',
    category: 'Viale Alpi 35',
    frequency: 'MONTHLY',
    autoExecute: false,
    nextDueDate: getUpcomingDefaultDate(5),
  },
];

export const DEFAULT_BUDGETS: Record<string, number> = {
  'Alimentari & Spesa': 300,
  'Sali & Tabacchi': 50,
  'Ristoranti & Svago': 150,
};

export const DEFAULT_GOALS: Goal[] = [
  {
    id: 'g1',
    title: 'Fondo Emergenze',
    target: 5000,
    current: 2400,
    targetDate: '2026-12-31',
  },
  {
    id: 'g2',
    title: 'Viaggio Estivo',
    target: 1200,
    current: 850,
    targetDate: '2026-08-15',
  },
];
