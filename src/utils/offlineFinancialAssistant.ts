/**
 * 100% Offline Local Financial Assistant Engine
 * Runs directly on-device inside standalone myfinance_app.html / Android APKs
 * when no backend /api/ai/chat server is reachable, and also parses operational quick-add commands.
 */

import {
  Account,
  Goal,
  ProposedTransactionAction,
  RecurringMovement,
  Transaction,
} from '../types/finance';
import { matchCategoryForText, normalizeDateValue } from './bankStatementImport';
import { formatCurrency, getCurrencyCode } from './formatters';
import { Language, MONTH_NAMES, getCategoryDisplayName } from './translations';

interface OfflineAssistantParams {
  question: string;
  accounts: Account[];
  balances: Record<string, number>;
  transactions: Transaction[];
  budgets: Record<string, number>;
  goals: Goal[];
  recurring: RecurringMovement[];
  categories: string[];
  userName?: string;
  language: Language;
}

export interface OfflineAssistantResponse {
  text: string;
  proposedTransaction?: ProposedTransactionAction;
}

function getPreviousMonthKey(refDate: Date): string {
  const d = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function tryParseOperationalTransaction(params: {
  question: string;
  accounts: Account[];
  categories: string[];
  language: Language;
}): ProposedTransactionAction | undefined {
  const { question, accounts, categories, language } = params;
  const trimmed = question.trim();
  const q = trimmed.toLowerCase();

  // Must express intent to add/log/insert OR contain an explicit amount + short expense phrasing
  const hasActionVerb =
    /\b(aggiungi|segna|registra|inserisci|speso|pagato|pagata|ho speso|ricevuto|incassato|accreditato|add|log|record|spent|paid|received|earned|buche|eintragen|hinzufügen|ausgegeben|bezahlt|erhalten)\b/i.test(
      q
    );

  // Extract amount: e.g. "18,50", "18.50 €", "€ 25", "$12.50", "1200"
  const amountMatch = trimmed.match(
    /(?:[€$£¥]\s*)?(\d{1,7}(?:[.,]\d{1,2})?)\s*(?:€|eur|euro|\$|usd|£|gbp|¥|jpy)?/i
  );
  if (!amountMatch) return undefined;

  // Avoid catching queries like "come posso risparmiare 500€" or "quanto ho speso"
  if (/^(quanto|quanti|come|dove|perché|analizza|riepilogo|what|how|why|show|summary|wie|was|warum|zeige)\b/i.test(q)) {
    return undefined;
  }

  if (!hasActionVerb) return undefined;

  const amountVal = parseFloat(amountMatch[1].replace(',', '.'));
  if (isNaN(amountVal) || amountVal <= 0) return undefined;

  const isIncome =
    /\b(entrat[ae]|stipendio|guadagno|incass|ricevut|accredit|rimborso|income|salary|earned|received|refund|einnahme|gehalt|erhalten|rückerstattung)\b/i.test(
      q
    );
  const type: 'INCOME' | 'EXPENSE' = isIncome ? 'INCOME' : 'EXPENSE';

  // Date detection
  const now = new Date();
  let date = now.toISOString().slice(0, 10);
  if (/\b(ieri|yesterday|gestern)\b/i.test(q)) {
    const yest = new Date(now.getTime() - 86400 * 1000);
    date = yest.toISOString().slice(0, 10);
  } else {
    const explicitDateMatch = trimmed.match(/\b(\d{4}-\d{2}-\d{2}|\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b/);
    if (explicitDateMatch) {
      const normalized = normalizeDateValue(explicitDateMatch[1]);
      if (normalized) date = normalized;
    }
  }

  // Account matching
  let matchedAccount = accounts[0]?.name || 'Conto';
  for (const acc of accounts) {
    if (acc.name && q.includes(acc.name.toLowerCase())) {
      matchedAccount = acc.name;
      break;
    }
  }

  // Build clean description by stripping action verbs, amount, dates, account prepositions
  let desc = trimmed
    .replace(amountMatch[0], ' ')
    .replace(
      /\b(aggiungi|segna|registra|inserisci|ho speso|speso|pagato|pagata|ricevuto|incassato|add|log|record|spent|paid|received|buche|eintragen|hinzufügen|ausgegeben|bezahlt|una spesa|una entrata|entrata|spesa|ausgabe|einnahme|expense|income|oggi|ieri|today|yesterday|heute|gestern)\b/gi,
      ' '
    )
    .replace(/\b(di|da|su|sul|sulla|con|per|al|alla|allo|il|la|lo|in|on|from|for|to|at|auf|für|mit|von|am|im)\b/gi, ' ');

  accounts.forEach((acc) => {
    if (acc.name) {
      const escaped = acc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      desc = desc.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), ' ');
    }
  });

  desc = desc.replace(/\s+/g, ' ').trim();
  if (!desc || desc.length < 2) {
    desc =
      language === 'de'
        ? type === 'INCOME'
          ? 'Einnahme'
          : 'Ausgabe'
        : language === 'en'
          ? type === 'INCOME'
            ? 'Income'
            : 'Expense'
          : type === 'INCOME'
            ? 'Entrata'
            : 'Spesa';
  } else {
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  }

  const category = matchCategoryForText(`${trimmed} ${desc}`, type, categories);

  return {
    type,
    amount: Number(amountVal.toFixed(2)),
    description: desc,
    category,
    account: matchedAccount,
    date,
  };
}

export function generateOfflineFinancialReply(
  params: OfflineAssistantParams
): OfflineAssistantResponse {
  const {
    question,
    accounts,
    balances,
    transactions,
    budgets,
    goals,
    recurring,
    categories,
    userName,
    language,
  } = params;

  const isDe = language === 'de';
  const isEn = language === 'en';

  // 0. Check for operational quick transaction creation command
  const proposed = tryParseOperationalTransaction({
    question,
    accounts,
    categories,
    language,
  });

  if (proposed) {
    const matchedAcc = accounts.find((a) => a.name === proposed.account);
    const code = getCurrencyCode(matchedAcc?.currency);
    const amountFmt = formatCurrency(proposed.amount, true, code);
    const catLabel = getCategoryDisplayName(proposed.category, language);

    const text = isDe
      ? `Ich habe den Buchungsentwurf vorbereitet (**${proposed.description}**, **${amountFmt}** auf **${proposed.account}** in **${catLabel}**). Prüfe die Karte unten und bestätige mit einem Klick.`
      : isEn
        ? `I prepared the transaction draft (**${proposed.description}**, **${amountFmt}** on **${proposed.account}** under **${catLabel}**). Review the card below and confirm to save.`
        : `Ho preparato la bozza del movimento (**${proposed.description}**, **${amountFmt}** su **${proposed.account}** nella categoria **${catLabel}**). Controlla la scheda qui sotto e premi Conferma per salvarlo.`;

    return { text, proposedTransaction: proposed };
  }

  const q = question.toLowerCase().trim();
  const now = new Date();
  const curMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthKey = getPreviousMonthKey(now);
  const monthNames = MONTH_NAMES[language] || MONTH_NAMES.it;
  const curMonthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  const balanceByCurrency: Record<string, number> = {};
  accounts.forEach((acc) => {
    const code = getCurrencyCode(acc.currency);
    balanceByCurrency[code] = (balanceByCurrency[code] || 0) + Number(balances[acc.id] ?? 0);
  });
  if (Object.keys(balanceByCurrency).length === 0) {
    balanceByCurrency.EUR = 0;
  }

  const computeMonthStats = (monthKey: string) => {
    const byCurrency: Record<string, { income: number; expense: number; net: number }> = {};
    const expByCategoryAndCurrency: Record<string, Record<string, number>> = {};
    const expByRawCategory: Record<string, number> = {};
    const txs = transactions.filter((tx) => tx.date.startsWith(monthKey));

    txs.forEach((tx) => {
      const accKey = tx.type === 'TRANSFER' ? tx.fromAccount : tx.account;
      const matched = accounts.find((a) => a.id === accKey || a.name === accKey);
      const code = getCurrencyCode(matched?.currency);
      if (!byCurrency[code]) byCurrency[code] = { income: 0, expense: 0, net: 0 };
      const amt = Number(tx.amount) || 0;

      if (tx.type === 'INCOME') {
        byCurrency[code].income += amt;
        byCurrency[code].net += amt;
      } else if (tx.type === 'EXPENSE') {
        byCurrency[code].expense += amt;
        byCurrency[code].net -= amt;
        const cat = tx.category || 'Altro';
        if (!expByCategoryAndCurrency[code]) expByCategoryAndCurrency[code] = {};
        expByCategoryAndCurrency[code][cat] = (expByCategoryAndCurrency[code][cat] || 0) + amt;
        expByRawCategory[cat] = (expByRawCategory[cat] || 0) + amt;
      }
    });

    return { txs, byCurrency, expByCategoryAndCurrency, expByRawCategory };
  };

  const targetMonthKey = /scors|precedent|last month|letzter monat|vormonat/.test(q)
    ? prevMonthKey
    : curMonthKey;
  const targetStats = computeMonthStats(targetMonthKey);
  const curStats = computeMonthStats(curMonthKey);

  const asksSavingsTips =
    /risparmiare|consigli|tagli|ridurr|spendere meno|save more|tips|cut|reduce|sparen|tipp|weniger ausgeben/.test(
      q
    );
  const asksBudgets =
    /budget|sfor|limite|limiti|spesa mensil|kategorie|category|categorie/.test(q);
  const asksGoals = /obiettiv|traguard|goal|goals|ziel|ziele|spar/.test(q) && !asksSavingsTips;
  const asksRecurring =
    /ricorrent|fiss|abbonament|stipend|affitt|recurring|subscription|wiederkehrend|fixkosten/.test(q);
  const asksAccounts =
    /cont[oi]|sald[oi]|patrimoni|valut|eur|usd|jpy|gbp|account|balance|net worth|currenc|konto|konten|guthaben|vermögen|währung/.test(
      q
    );
  const asksExpensesOrMonth =
    /spes|uscit|entrat|guadagn|mese|questo mese|scors|andamento|riepilog|expense|income|month|summary|ausgabe|einnahme|monat|übersicht/.test(
      q
    );

  const lines: string[] = [];

  if (asksSavingsTips) {
    lines.push(
      isDe
        ? `**Spartipps basierend auf deinen aktuellen Daten (${curMonthLabel}):**`
        : isEn
          ? `**Personalized saving insights from your data (${curMonthLabel}):**`
          : `**Consigli pratici basati sui tuoi dati (${curMonthLabel}):**`
    );

    const hasExpenses = Object.keys(curStats.expByCategoryAndCurrency).length > 0;
    if (hasExpenses) {
      Object.entries(curStats.expByCategoryAndCurrency).forEach(([code, catMap]) => {
        const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
        const top = sorted[0];
        if (top) {
          const catLabel = getCategoryDisplayName(top[0], language);
          const totalExp = curStats.byCurrency[code]?.expense || top[1];
          const share = totalExp > 0 ? Math.round((top[1] / totalExp) * 100) : 0;
          lines.push(
            isDe
              ? `- **Größter Ausgabenposten (${code})**: **${catLabel}** mit **${formatCurrency(top[1], true, code)}** (${share}% der Monatsausgaben). Eine Reduktion um 15% spart ca. **${formatCurrency(top[1] * 0.15, true, code)}/Monat**.`
              : isEn
                ? `- **Highest expense (${code})**: **${catLabel}** at **${formatCurrency(top[1], true, code)}** (${share}% of monthly expenses). Trimming 15% saves about **${formatCurrency(top[1] * 0.15, true, code)}/month**.`
                : `- **Voce di spesa principale (${code})**: **${catLabel}** con **${formatCurrency(top[1], true, code)}** (${share}% delle uscite del mese). Ridurla del 15% libera circa **${formatCurrency(top[1] * 0.15, true, code)}/mese**.`
          );
        }
      });
    } else {
      lines.push(
        isDe
          ? `- In diesem Monat wurden noch keine Ausgaben erfasst.`
          : isEn
            ? `- No expenses recorded yet this month.`
            : `- Non risultano ancora uscite registrate in questo mese.`
      );
    }

    const overBudgets = Object.entries(budgets).filter(
      ([cat, limit]) => limit > 0 && (curStats.expByRawCategory[cat] || 0) >= limit * 0.8
    );
    if (overBudgets.length > 0) {
      overBudgets.forEach(([cat, limit]) => {
        const spent = curStats.expByRawCategory[cat] || 0;
        const pct = Math.round((spent / limit) * 100);
        const catLabel = getCategoryDisplayName(cat, language);
        lines.push(
          isDe
            ? `- **Budget-Hinweis**: **${catLabel}** liegt bei **${pct}%** (${formatCurrency(spent, true, 'EUR')} / ${formatCurrency(limit, true, 'EUR')}).`
            : isEn
              ? `- **Budget alert**: **${catLabel}** is at **${pct}%** (${formatCurrency(spent, true, 'EUR')} / ${formatCurrency(limit, true, 'EUR')}).`
              : `- **Attenzione budget**: **${catLabel}** è già al **${pct}%** (${formatCurrency(spent, true, 'EUR')} / ${formatCurrency(limit, true, 'EUR')}).`
        );
      });
    }

    return { text: lines.join('\n') };
  }

  if (asksRecurring && !asksAccounts && !asksExpensesOrMonth) {
    lines.push(
      isDe
        ? `**Wiederkehrende Bewegungen (${recurring.length}):**`
        : isEn
          ? `**Recurring Movements (${recurring.length}):**`
          : `**Movimenti Ricorrenti configurati (${recurring.length}):**`
    );
    if (recurring.length === 0) {
      lines.push(
        isDe
          ? 'Keine wiederkehrenden Bewegungen gespeichert.'
          : isEn
            ? 'No recurring movements saved yet.'
            : 'Non hai ancora configurato movimenti ricorrenti.'
      );
    } else {
      recurring.forEach((r) => {
        const acc = accounts.find((a) => a.id === r.account || a.name === r.account);
        const code = getCurrencyCode(acc?.currency);
        const sign = r.type === 'EXPENSE' ? '-' : '+';
        lines.push(
          `- **${r.description}** (${getCategoryDisplayName(r.category, language)} • ${acc?.name || r.account}): **${sign}${formatCurrency(r.amount, true, code)}**`
        );
      });
    }
    return { text: lines.join('\n') };
  }

  if (asksBudgets || asksGoals) {
    if (asksBudgets || Object.keys(budgets).length > 0) {
      lines.push(
        isDe
          ? `**Budgets im Monat (${curMonthLabel}):**`
          : isEn
            ? `**Monthly Budgets (${curMonthLabel}):**`
            : `**Stato Budget mensili (${curMonthLabel}):**`
      );
      const budgetEntries = Object.entries(budgets);
      if (budgetEntries.length === 0) {
        lines.push(
          isDe
            ? '- Noch keine Budgets festgelegt.'
            : isEn
              ? '- No spending budgets set yet.'
              : '- Nessun budget impostato al momento.'
        );
      } else {
        budgetEntries.forEach(([cat, limit]) => {
          const spent = curStats.expByRawCategory[cat] || 0;
          const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
          lines.push(
            `- **${getCategoryDisplayName(cat, language)}**: ${formatCurrency(spent, true, 'EUR')} / ${formatCurrency(limit, true, 'EUR')} (**${pct}%**)`
          );
        });
      }
    }

    if (asksGoals || goals.length > 0) {
      lines.push('');
      lines.push(
        isDe ? '**Sparziele:**' : isEn ? '**Savings Goals:**' : '**Obiettivi di Risparmio:**'
      );
      if (goals.length === 0) {
        lines.push(
          isDe
            ? '- Noch keine Sparziele erstellt.'
            : isEn
              ? '- No savings goals created yet.'
              : '- Nessun obiettivo di risparmio creato.'
        );
      } else {
        goals.forEach((g) => {
          const pct = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0;
          const missing = Math.max(0, g.target - g.current);
          lines.push(
            isDe
              ? `- **${g.title}**: ${formatCurrency(g.current, true, 'EUR')} / ${formatCurrency(g.target, true, 'EUR')} (**${pct}%**, offen: ${formatCurrency(missing, true, 'EUR')})`
              : isEn
                ? `- **${g.title}**: ${formatCurrency(g.current, true, 'EUR')} / ${formatCurrency(g.target, true, 'EUR')} (**${pct}%**, remaining: ${formatCurrency(missing, true, 'EUR')})`
                : `- **${g.title}**: ${formatCurrency(g.current, true, 'EUR')} / ${formatCurrency(g.target, true, 'EUR')} (**${pct}%**, mancano ${formatCurrency(missing, true, 'EUR')})`
          );
        });
      }
    }
    return { text: lines.join('\n') };
  }

  const stopWords = new Set([
    'quanto', 'quanti', 'speso', 'spese', 'spesa', 'questo', 'mese', 'anno', 'tutti', 'tutte',
    'miei', 'mie', 'conti', 'conto', 'saldo', 'saldi', 'come', 'sono', 'ciao', 'salve',
    'mostra', 'dimmi', 'riepilogo', 'analizza', 'analisi', 'per', 'con', 'del', 'della',
    'delle', 'degli', 'nel', 'nella', 'what', 'how', 'much', 'spent', 'expenses', 'this',
    'month', 'show', 'summary', 'accounts', 'balance', 'wie', 'viel', 'ausgaben', 'diesem',
    'monat', 'konten', 'übersicht',
  ]);
  const queryKeywords = q
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  if (queryKeywords.length > 0 && !asksAccounts && !asksExpensesOrMonth) {
    const matchedTxs = transactions
      .filter((tx) => {
        const hay = `${tx.description} ${tx.category} ${tx.notes || ''} ${tx.account || ''}`.toLowerCase();
        return queryKeywords.some((kw) => hay.includes(kw));
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (matchedTxs.length > 0) {
      lines.push(
        isDe
          ? `**Gefundene Buchungen (${matchedTxs.length}) für "${queryKeywords.join(', ')}":**`
          : isEn
            ? `**Matching transactions (${matchedTxs.length}) for "${queryKeywords.join(', ')}":**`
            : `**Movimenti trovati (${matchedTxs.length}) per "${queryKeywords.join(', ')}":**`
      );
      matchedTxs.slice(0, 8).forEach((tx) => {
        const accKey = tx.type === 'TRANSFER' ? tx.fromAccount : tx.account;
        const acc = accounts.find((a) => a.id === accKey || a.name === accKey);
        const code = getCurrencyCode(acc?.currency);
        const sign = tx.type === 'EXPENSE' ? '-' : tx.type === 'TRANSFER' ? '↺ ' : '+';
        lines.push(
          `- ${tx.date} | **${tx.description}** (${getCategoryDisplayName(tx.category, language)}): **${sign}${formatCurrency(tx.amount, true, code)}**`
        );
      });
      return { text: lines.join('\n') };
    }
  }

  const greeting = userName
    ? isDe
      ? `Hallo **${userName}**! Hier ist deine aktuelle Finanzübersicht:`
      : isEn
        ? `Hi **${userName}**! Here is your current financial overview:`
        : `Ciao **${userName}**! Ecco il riepilogo aggiornato delle tue finanze:`
    : isDe
      ? 'Hier ist deine aktuelle Finanzübersicht:'
      : isEn
        ? 'Here is your current financial overview:'
        : 'Ecco il riepilogo aggiornato delle tue finanze:';

  lines.push(greeting);
  lines.push('');

  if (asksAccounts || !asksExpensesOrMonth) {
    lines.push(
      isDe
        ? '**Salden nach Konto & Währung:**'
        : isEn
          ? '**Accounts & Balances by Currency:**'
          : '**Conti e Saldi per Valuta:**'
    );
    accounts.forEach((acc) => {
      const code = getCurrencyCode(acc.currency);
      const bal = Number(balances[acc.id] ?? 0);
      lines.push(`- **${acc.name}** (${code}): **${formatCurrency(bal, true, code)}**`);
    });
    if (Object.keys(balanceByCurrency).length > 1 || accounts.length > 1) {
      const totalParts = Object.entries(balanceByCurrency).map(
        ([code, amt]) => `**${formatCurrency(amt, true, code)}** (${code})`
      );
      lines.push(
        isDe
          ? `- Gesamtsumme pro Währung: ${totalParts.join(' • ')}`
          : isEn
            ? `- Total by currency: ${totalParts.join(' • ')}`
            : `- Totale per valuta: ${totalParts.join(' • ')}`
      );
    }
    lines.push('');
  }

  const targetMonthParts = targetMonthKey.split('-');
  const tYear = targetMonthParts[0];
  const tMonthIdx = Math.max(0, Math.min(11, parseInt(targetMonthParts[1] || '1', 10) - 1));
  const targetLabel = `${monthNames[tMonthIdx]} ${tYear}`;

  lines.push(
    isDe
      ? `**Bewegungen (${targetLabel}):** ${targetStats.txs.length} Buchungen`
      : isEn
        ? `**Activity (${targetLabel}):** ${targetStats.txs.length} transactions`
        : `**Andamento (${targetLabel}):** ${targetStats.txs.length} movimenti`
  );

  const curEntries = Object.entries(targetStats.byCurrency);
  if (curEntries.length === 0) {
    lines.push(
      isDe
        ? '- Noch keine Einnahmen oder Ausgaben in diesem Zeitraum.'
        : isEn
          ? '- No income or expenses recorded in this period yet.'
          : '- Nessuna entrata o uscita registrata in questo mese.'
    );
  } else {
    curEntries.forEach(([code, s]) => {
      const netPrefix = s.net >= 0 ? '+' : '';
      lines.push(
        isDe
          ? `- [${code}] Einnahmen: **${formatCurrency(s.income, true, code)}** | Ausgaben: **${formatCurrency(s.expense, true, code)}** | Netto: **${netPrefix}${formatCurrency(s.net, true, code)}**`
          : isEn
            ? `- [${code}] Income: **${formatCurrency(s.income, true, code)}** | Expenses: **${formatCurrency(s.expense, true, code)}** | Net: **${netPrefix}${formatCurrency(s.net, true, code)}**`
            : `- [${code}] Entrate: **${formatCurrency(s.income, true, code)}** | Uscite: **${formatCurrency(s.expense, true, code)}** | Netto: **${netPrefix}${formatCurrency(s.net, true, code)}**`
      );
    });
  }

  const topCatRows: string[] = [];
  Object.entries(targetStats.expByCategoryAndCurrency).forEach(([code, catMap]) => {
    Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([cat, amt]) => {
        topCatRows.push(
          `- **${getCategoryDisplayName(cat, language)}**: **${formatCurrency(amt, true, code)}** (${code})`
        );
      });
  });

  if (topCatRows.length > 0) {
    lines.push('');
    lines.push(
      isDe
        ? '**Top-Ausgabenkategorien:**'
        : isEn
          ? '**Top Spending Categories:**'
          : '**Principali categorie di spesa:**'
    );
    lines.push(...topCatRows);
  }

  return { text: lines.join('\n') };
}
