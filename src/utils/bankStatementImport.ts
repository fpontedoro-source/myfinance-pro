/**
 * Bank Statement Importer (CSV, TSV, Excel .xlsx / .xls)
 * Parses bank & card exports, normalizes dates and European/US amounts,
 * auto-categorizes rows, and detects duplicates against existing transactions.
 */

import * as XLSX from 'xlsx';
import { CategoryRule, Transaction } from '../types/finance';
import { matchCategorizationRule } from './categorizationRules';

export interface ParsedSheetData {
  headers: string[];
  rows: string[][];
  fileName?: string;
}

export interface ColumnMapping {
  dateCol: number;
  descriptionCol: number;
  amountCol: number; // -1 if using separate credit/debit
  creditCol: number; // Entrate / Avere (-1 if unused)
  debitCol: number; // Uscite / Dare (-1 if unused)
  categoryCol: number; // -1 if unused
  notesCol: number; // -1 if unused
}

export interface ImportedTransactionCandidate {
  rowIndex: number;
  date: string; // YYYY-MM-DD
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  category: string;
  notes?: string;
  tags?: string[];
  isDuplicate: boolean;
  selected: boolean;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function detectDelimiter(sampleLines: string[]): string {
  const candidates = [';', ',', '\t', '|'];
  let best = ';';
  let bestScore = -1;

  for (const delim of candidates) {
    const counts = sampleLines.map((l) => splitCsvLine(l, delim).length);
    const avg = counts.reduce((a, b) => a + b, 0) / Math.max(1, counts.length);
    if (avg > 1 && avg > bestScore) {
      bestScore = avg;
      best = delim;
    }
  }
  return best;
}

export function parseCsvText(rawText: string, fileName?: string): ParsedSheetData {
  const cleaned = rawText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [], fileName };
  }

  // Skip initial bank metadata banner lines if a header-like line sits in first 8 rows
  const delim = detectDelimiter(lines.slice(0, 10));
  const parsedRows = lines.map((line) => splitCsvLine(line, delim));

  let headerIdx = 0;
  let maxCols = parsedRows[0].length;
  for (let i = 0; i < Math.min(8, parsedRows.length); i++) {
    const row = parsedRows[i];
    const joined = row.join(' ').toLowerCase();
    if (
      row.length >= maxCols &&
      /(data|date|datum|importo|amount|betrag|descri|causale|entrat|uscit|debit|credit|dare|avere)/i.test(
        joined
      )
    ) {
      headerIdx = i;
      maxCols = row.length;
      break;
    }
    if (row.length > maxCols) {
      maxCols = row.length;
      headerIdx = i;
    }
  }

  const headers = parsedRows[headerIdx].map((h, idx) => h || `Col ${idx + 1}`);
  const rows = parsedRows
    .slice(headerIdx + 1)
    .filter((r) => r.some((cell) => cell.trim().length > 0));

  return { headers, rows, fileName };
}

export async function parseStatementFile(file: File): Promise<ParsedSheetData> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.txt')) {
    const text = await file.text();
    return parseCsvText(text, file.name);
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { headers: [], rows: [], fileName: file.name };
  }
  const sheet = workbook.Sheets[firstSheetName];
  const rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: '',
  });

  const cleanMatrix = rawMatrix
    .map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? '').trim()) : []))
    .filter((r) => r.some((c) => c.length > 0));

  if (cleanMatrix.length === 0) {
    return { headers: [], rows: [], fileName: file.name };
  }

  let headerIdx = 0;
  for (let i = 0; i < Math.min(10, cleanMatrix.length); i++) {
    const joined = cleanMatrix[i].join(' ').toLowerCase();
    if (
      cleanMatrix[i].length >= 2 &&
      /(data|date|datum|importo|amount|betrag|descri|causale|entrat|uscit|debit|credit|dare|avere)/i.test(
        joined
      )
    ) {
      headerIdx = i;
      break;
    }
  }

  const headers = cleanMatrix[headerIdx].map((h, idx) => h || `Col ${idx + 1}`);
  const rows = cleanMatrix.slice(headerIdx + 1);
  return { headers, rows, fileName: file.name };
}

export function autoDetectColumns(headers: string[]): ColumnMapping {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  const findCol = (patterns: RegExp[]): number => {
    for (const p of patterns) {
      const idx = lowerHeaders.findIndex((h) => p.test(h));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const dateCol = findCol([
    /^data$/,
    /data\s*(operazione|contabile|valuta|movimento)?/,
    /date|datum|booking\s*date|valuta/,
  ]);
  const descriptionCol = findCol([
    /descri|causale|dettagl|beneficiario|esercente|oggetto/,
    /description|memo|merchant|payee|narrative/,
    /verwendungszweck|empfänger|text|buchungstext/,
  ]);
  const creditCol = findCol([
    /entrat|accredit|avere|credit|inflow|habensaldo|haben|eingang/,
  ]);
  const debitCol = findCol([
    /uscit|addebit|dare|debit|outflow|soll|ausgang/,
  ]);
  const amountCol = findCol([
    /^importo/,
    /importo|amount|betrag|valore|summe|value/,
  ]);
  const categoryCol = findCol([/categori|kategorie|category|tipo\s*spesa/]);
  const notesCol = findCol([/not[ea]|comment|note|bemerkung/]);

  return {
    dateCol: dateCol !== -1 ? dateCol : 0,
    descriptionCol:
      descriptionCol !== -1 ? descriptionCol : headers.length > 1 ? 1 : 0,
    amountCol:
      amountCol !== -1
        ? amountCol
        : creditCol === -1 && debitCol === -1 && headers.length > 2
          ? 2
          : -1,
    creditCol,
    debitCol,
    categoryCol,
    notesCol,
  };
}

export function normalizeNumberValue(raw: string): number | null {
  if (!raw) return null;
  let cleaned = raw
    .replace(/[€$£¥\s\u00A0]/g, '')
    .replace(/EUR|USD|JPY|GBP|CHF/gi, '')
    .trim();

  if (!cleaned) return null;

  // Accounting negative "(123.45)"
  let negative = false;
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    negative = true;
    cleaned = cleaned.slice(1, -1);
  }
  if (cleaned.startsWith('-')) {
    negative = true;
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // Handle European vs US thousands/decimal separators
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      // 1.234,56 -> 1234.56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,234.56 -> 1234.56
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    const parts = cleaned.split(',');
    if (parts[parts.length - 1].length <= 2) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return null;
  return negative ? -Math.abs(parsed) : parsed;
}

export function normalizeDateValue(raw: string): string | null {
  const s = (raw || '').trim();
  if (!s) return null;

  // Excel serial date number (e.g. 45678)
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const serial = parseFloat(s);
    if (serial > 25000 && serial < 70000) {
      const utcDays = Math.floor(serial - 25569);
      const dateObj = new Date(utcDays * 86400 * 1000);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString().slice(0, 10);
      }
    }
  }

  // YYYY-MM-DD or YYYY/MM/DD (optionally with timestamp)
  const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY
  const euMatch = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (euMatch) {
    let [, d, m, y] = euMatch;
    if (y.length === 2) {
      y = Number(y) > 50 ? `19${y}` : `20${y}`;
    }
    const dayNum = parseInt(d, 10);
    const monNum = parseInt(m, 10);
    if (monNum >= 1 && monNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  const fallback = new Date(s);
  if (!isNaN(fallback.getTime())) {
    return fallback.toISOString().slice(0, 10);
  }
  return null;
}

export function matchCategoryForText(
  text: string,
  type: 'INCOME' | 'EXPENSE',
  categories: string[],
  rawCategory?: string
): string {
  if (rawCategory) {
    const cleanRaw = rawCategory.trim().toLowerCase();
    const direct = categories.find((c) => c.toLowerCase() === cleanRaw);
    if (direct) return direct;
  }

  const hay = `${text} ${rawCategory || ''}`.toLowerCase();

  const findBestInUserCategories = (keywords: string[]): string | undefined =>
    categories.find((c) => keywords.some((kw) => c.toLowerCase().includes(kw)));

  if (type === 'INCOME') {
    if (/stipend|salary|gehalt|lohn|paga|bonifico.*datore|payroll/.test(hay)) {
      return findBestInUserCategories(['stipend', 'salary', 'gehalt', 'lavoro']) || categories[0] || 'Stipendio';
    }
    if (/affitt|rent|miete|divid|rimbors|refund|cashback/.test(hay)) {
      return findBestInUserCategories(['entr', 'invest', 'rendit', 'altro', 'other']) || categories[0] || 'Entrate';
    }
    return findBestInUserCategories(['stipend', 'entr', 'altro']) || categories[0] || 'Entrate';
  }

  const rules: Array<{ test: RegExp; catKeywords: string[] }> = [
    {
      test: /supermercat|esselunga|coop|conad|carrefour|lidl|aldi|eurospin|rewe|edeka|spesa|aliment|grocery|panificio|macelleria/,
      catKeywords: ['aliment', 'spesa', 'cibo', 'food', 'grocer', 'lebensmittel'],
    },
    {
      test: /ristorant|pizzer|bar|caff|caffe|pub|trattoria|mcdonald|burger|sushi|deliveroo|glovo|just eat|starbucks/,
      catKeywords: ['ristorant', 'mangiare', 'bar', 'cibo', 'food', 'dining', 'svago'],
    },
    {
      test: /benzin|carburant|eni|q8|tamoil|esso|ip |shell|tanken|autostrad|telepass|trenitalia|italo|atm|metro|bus|uber|taxi|volo|ryanair|parchegg/,
      catKeywords: ['trasport', 'auto', 'benzina', 'carburant', 'transport', 'verkehr', 'viagg'],
    },
    {
      test: /affitt|mutuo|enel|eni gas|a2a|hera|acea|acqua|luce|gas|bollett|condomini|internet|fibra|vodafone|tim|wind|iliad|telekom|strom|miete|utilities/,
      catKeywords: ['casa', 'utenz', 'bollett', 'affitt', 'home', 'house', 'wohnung', 'nebencosten'],
    },
    {
      test: /farmaci|medic|dottor|dentist|ospedal|sanit|clinica|apotheke|arzt|health|pharmacy/,
      catKeywords: ['salut', 'medic', 'farmac', 'health', 'gesundheit'],
    },
    {
      test: /amazon|zalando|zara|h&m|ikea|mediaworld|unieuro|apple|abbigliamento|negozio|shopping/,
      catKeywords: ['shopping', 'acquist', 'abbigliament', 'svago'],
    },
    {
      test: /netflix|spotify|disney|prime|dazn|cinema|teatro|palestra|gym|fitness|hotel|airbnb|booking|vacanz/,
      catKeywords: ['svago', 'intratteniment', 'abbonament', 'sport', 'viagg', 'leisure', 'freizeit'],
    },
  ];

  for (const rule of rules) {
    if (rule.test.test(hay)) {
      const matched = findBestInUserCategories(rule.catKeywords);
      if (matched) return matched;
    }
  }

  return (
    findBestInUserCategories(['altro', 'varie', 'other', 'sonstig']) ||
    categories[0] ||
    'Altro'
  );
}

export function buildImportCandidates(params: {
  sheet: ParsedSheetData;
  mapping: ColumnMapping;
  existingTransactions: Transaction[];
  categories: string[];
  categoryRules?: CategoryRule[];
}): ImportedTransactionCandidate[] {
  const { sheet, mapping, existingTransactions, categories, categoryRules = [] } = params;

  const existingSignatures = new Set(
    existingTransactions.map((tx) => {
      const descKey = (tx.description || '').toLowerCase().trim().slice(0, 32);
      return `${tx.date}|${Number(tx.amount).toFixed(2)}|${descKey}`;
    })
  );

  const candidates: ImportedTransactionCandidate[] = [];

  sheet.rows.forEach((row, rowIndex) => {
    const rawDate = row[mapping.dateCol] || '';
    const date = normalizeDateValue(rawDate);
    if (!date) return;

    let type: 'INCOME' | 'EXPENSE' = 'EXPENSE';
    let amount = 0;

    if (mapping.creditCol !== -1 || mapping.debitCol !== -1) {
      const creditVal =
        mapping.creditCol !== -1 ? normalizeNumberValue(row[mapping.creditCol] || '') : null;
      const debitVal =
        mapping.debitCol !== -1 ? normalizeNumberValue(row[mapping.debitCol] || '') : null;

      if (creditVal !== null && Math.abs(creditVal) > 0) {
        type = 'INCOME';
        amount = Math.abs(creditVal);
      } else if (debitVal !== null && Math.abs(debitVal) > 0) {
        type = 'EXPENSE';
        amount = Math.abs(debitVal);
      } else if (mapping.amountCol !== -1) {
        const signed = normalizeNumberValue(row[mapping.amountCol] || '');
        if (signed === null || signed === 0) return;
        type = signed > 0 ? 'INCOME' : 'EXPENSE';
        amount = Math.abs(signed);
      } else {
        return;
      }
    } else if (mapping.amountCol !== -1) {
      const signed = normalizeNumberValue(row[mapping.amountCol] || '');
      if (signed === null || signed === 0) return;
      type = signed > 0 ? 'INCOME' : 'EXPENSE';
      amount = Math.abs(signed);
    } else {
      return;
    }

    const description =
      (mapping.descriptionCol !== -1 ? row[mapping.descriptionCol] : '')?.trim() ||
      (type === 'INCOME' ? 'Accredito bancario' : 'Addebito bancario');

    const rawCategory =
      mapping.categoryCol !== -1 ? row[mapping.categoryCol] : undefined;
    const notes =
      mapping.notesCol !== -1 && row[mapping.notesCol]?.trim()
        ? row[mapping.notesCol].trim()
        : undefined;

    const customRuleMatch = matchCategorizationRule(
      description,
      notes,
      type,
      categoryRules,
      categories
    );

    let category = matchCategoryForText(description, type, categories, rawCategory);
    if (!rawCategory && customRuleMatch?.category) {
      category = customRuleMatch.category;
    } else if (rawCategory) {
      const cleanRaw = rawCategory.trim().toLowerCase();
      const explicitMatch = categories.find((c) => c.toLowerCase() === cleanRaw);
      if (!explicitMatch && customRuleMatch?.category) {
        category = customRuleMatch.category;
      }
    }

    const sig = `${date}|${amount.toFixed(2)}|${description.toLowerCase().trim().slice(0, 32)}`;
    const isDuplicate = existingSignatures.has(sig);

    candidates.push({
      rowIndex,
      date,
      type,
      amount: Number(amount.toFixed(2)),
      description,
      category,
      notes,
      tags: customRuleMatch?.tags?.length ? customRuleMatch.tags : undefined,
      isDuplicate,
      selected: !isDuplicate,
    });
  });

  return candidates;
}
