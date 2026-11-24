import { CategoryRule, Transaction } from '../types/finance';

export const RULES_STORAGE_KEY = 'myfinance_rules_v1';

export const DEFAULT_CATEGORY_RULES: CategoryRule[] = [
  {
    id: 'rule_grocery',
    keyword: 'esselunga, conad, coop, carrefour, lidl, aldi, eurospin, rewe, edeka',
    category: 'Alimentari & Spesa',
    tags: ['supermercato'],
    type: 'EXPENSE',
    enabled: true,
  },
  {
    id: 'rule_fuel',
    keyword: 'eni, q8, tamoil, ip, esso, shell, benzina, diesel, tanken',
    category: 'Trasporti & Carburante',
    tags: ['auto', 'carburante'],
    type: 'EXPENSE',
    enabled: true,
  },
  {
    id: 'rule_subs',
    keyword: 'netflix, spotify, disney, amazon prime, icloud, apple, dazn',
    category: 'Abbonamenti & Servizi',
    tags: ['abbonamento'],
    type: 'EXPENSE',
    enabled: true,
  },
  {
    id: 'rule_utilities',
    keyword: 'enel, a2a, hera, tim, vodafone, wind, fastweb, iliad, telekom, strom',
    category: 'Casa & Utente',
    tags: ['utenze'],
    type: 'EXPENSE',
    enabled: true,
  },
  {
    id: 'rule_salary',
    keyword: 'stipendio, salario, gehalt, lohn, payroll',
    category: 'Stipendio / Reddito',
    tags: ['lavoro'],
    type: 'INCOME',
    enabled: true,
  },
];

export function normalizeTag(rawTag: string): string {
  return rawTag
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9àèéìòóùäöüß_-]/gi, '');
}

export function parseTagsInput(rawInput: string): string[] {
  const parts = rawInput
    .split(/[\s,;]+/)
    .map(normalizeTag)
    .filter((t) => t.length > 0);
  return Array.from(new Set(parts));
}

export function mergeUniqueTags(existing: string[] = [], extra: string[] = []): string[] {
  const normalized = [...existing, ...extra]
    .map(normalizeTag)
    .filter((t) => t.length > 0);
  return Array.from(new Set(normalized));
}

export function collectAllUsedTags(transactions: Transaction[], rules: CategoryRule[] = []): string[] {
  const set = new Set<string>();
  transactions.forEach((tx) => {
    (tx.tags || []).forEach((tag) => {
      const n = normalizeTag(tag);
      if (n) set.add(n);
    });
  });
  rules.forEach((r) => {
    (r.tags || []).forEach((tag) => {
      const n = normalizeTag(tag);
      if (n) set.add(n);
    });
  });
  return Array.from(set).sort();
}

export function matchCategorizationRule(
  description: string,
  notes: string | undefined,
  type: 'INCOME' | 'EXPENSE',
  rules: CategoryRule[],
  availableCategories: string[]
): { category?: string; tags: string[]; rule?: CategoryRule } | null {
  const haystack = `${description || ''} ${notes || ''}`.toLowerCase().trim();
  if (!haystack) return null;

  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (rule.type && rule.type !== 'ANY' && rule.type !== type) continue;

    const keywords = rule.keyword
      .split(/[,;]/)
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length >= 2);

    const matched = keywords.some((kw) => haystack.includes(kw));
    if (!matched) continue;

    const resolvedCat =
      availableCategories.find((c) => c.toLowerCase() === rule.category.toLowerCase()) ||
      rule.category;

    return {
      category: resolvedCat,
      tags: mergeUniqueTags([], rule.tags || []),
      rule,
    };
  }

  return null;
}

export function applyRulesToExistingTransactions(params: {
  transactions: Transaction[];
  rules: CategoryRule[];
  availableCategories: string[];
  overwriteCategory?: boolean;
}): { updatedTransactions: Transaction[]; updatedCount: number } {
  const { transactions, rules, availableCategories, overwriteCategory = true } = params;
  let updatedCount = 0;

  const updatedTransactions = transactions.map((tx) => {
    if (tx.type === 'TRANSFER') return tx;
    const match = matchCategorizationRule(
      tx.description,
      tx.notes,
      tx.type,
      rules,
      availableCategories
    );
    if (!match) return tx;

    const nextCategory =
      overwriteCategory && match.category ? match.category : tx.category;
    const nextTags = mergeUniqueTags(tx.tags || [], match.tags);

    const catChanged = nextCategory !== tx.category;
    const tagsChanged =
      nextTags.length !== (tx.tags || []).length ||
      nextTags.some((t, i) => (tx.tags || [])[i] !== t);

    if (!catChanged && !tagsChanged) return tx;

    updatedCount += 1;
    return {
      ...tx,
      category: nextCategory,
      tags: nextTags.length > 0 ? nextTags : undefined,
    };
  });

  return { updatedTransactions, updatedCount };
}
