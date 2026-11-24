/**
 * Monthly Email Statement Utility for MyFinance Pro
 * Prepares, schedules, and dispatches automatic monthly multi-currency account statements.
 */

import { Account, Goal, Transaction } from '../types/finance';
import { formatCurrency, getCurrencyCode } from './formatters';
import { buildMonthlyStatementPdfFile } from './pdfGenerator';
import { SecuritySettings } from './security';
import { Language, MONTH_NAMES, getCategoryDisplayName } from './translations';

export interface CurrencyPeriodSummary {
  income: number;
  expense: number;
  net: number;
  balance: number;
}

export interface MonthlyEmailSettings {
  enabled: boolean;
  recipientEmail: string;
  sendDayOfMonth: number; // 1..28
  autoDownloadPdf: boolean;
  webhookUrl?: string;
  lastProcessedMonthKey?: string; // YYYY-MM
  lastSentAt?: string; // ISO string
  lastStatus?: 'prepared' | 'sent_webhook' | 'error';
  lastMessage?: string;
}

export interface MonthlyStatementEntry {
  id: string;
  monthKey: string; // YYYY-MM
  monthLabel: string;
  createdAt: string; // ISO string
  recipientEmail: string;
  holderName: string;
  transactionsCount: number;
  totalsByCurrency: Record<string, CurrencyPeriodSummary>;
  subject: string;
  summaryText: string;
  mailtoUrl: string;
  pdfFileName: string;
  status: 'prepared' | 'sent_webhook' | 'error';
  statusNote?: string;
}

const SETTINGS_STORAGE_KEY = 'myfinance_monthly_email_settings_v1';
const HISTORY_STORAGE_KEY = 'myfinance_monthly_email_history_v1';

export const DEFAULT_MONTHLY_EMAIL_SETTINGS: MonthlyEmailSettings = {
  enabled: true,
  recipientEmail: '',
  sendDayOfMonth: 1,
  autoDownloadPdf: true,
  webhookUrl: '',
};

export function getMonthlyEmailSettings(): MonthlyEmailSettings {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_MONTHLY_EMAIL_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MONTHLY_EMAIL_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_MONTHLY_EMAIL_SETTINGS,
      ...parsed,
      sendDayOfMonth: Math.max(1, Math.min(28, Number(parsed.sendDayOfMonth) || 1)),
    };
  } catch {
    return { ...DEFAULT_MONTHLY_EMAIL_SETTINGS };
  }
}

export function saveMonthlyEmailSettings(settings: MonthlyEmailSettings): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const clean: MonthlyEmailSettings = {
      ...DEFAULT_MONTHLY_EMAIL_SETTINGS,
      ...settings,
      recipientEmail: (settings.recipientEmail || '').trim().toLowerCase(),
      sendDayOfMonth: Math.max(1, Math.min(28, Number(settings.sendDayOfMonth) || 1)),
      webhookUrl: (settings.webhookUrl || '').trim(),
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(clean));
  } catch (err) {
    console.error('Error saving monthly email settings:', err);
  }
}

export function syncRecipientEmailFromProfile(email: string): MonthlyEmailSettings {
  const cleanEmail = email.trim().toLowerCase();
  const current = getMonthlyEmailSettings();
  if (!cleanEmail) return current;
  const next: MonthlyEmailSettings = {
    ...current,
    recipientEmail: current.recipientEmail || cleanEmail,
  };
  saveMonthlyEmailSettings(next);
  return next;
}

export function getMonthlyStatementHistory(): MonthlyStatementEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordMonthlyStatementEntry(entry: MonthlyStatementEntry): MonthlyStatementEntry[] {
  if (typeof localStorage === 'undefined') return [entry];
  try {
    const current = getMonthlyStatementHistory();
    const filtered = current.filter((item) => item.id !== entry.id);
    const updated = [entry, ...filtered].slice(0, 24);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [entry];
  }
}

export function deleteMonthlyStatementEntry(id: string): MonthlyStatementEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const current = getMonthlyStatementHistory();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function getCurrentMonthKey(refDate: Date = new Date()): string {
  const y = refDate.getFullYear();
  const m = String(refDate.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getPreviousMonthKey(refDate: Date = new Date()): string {
  const prev = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
  const y = prev.getFullYear();
  const m = String(prev.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatMonthKeyLabel(monthKey: string, language: Language = 'it'): string {
  const [yStr, mStr] = monthKey.split('-');
  const year = parseInt(yStr || String(new Date().getFullYear()), 10);
  const monthIndex = Math.max(0, Math.min(11, parseInt(mStr || '1', 10) - 1));
  const names = MONTH_NAMES[language] || MONTH_NAMES.it;
  return `${names[monthIndex]} ${year}`;
}

export function getAvailableMonthKeys(transactions: Transaction[]): string[] {
  const keys = new Set<string>();
  keys.add(getCurrentMonthKey());
  keys.add(getPreviousMonthKey());
  transactions.forEach((tx) => {
    if (tx.date && /^\d{4}-\d{2}/.test(tx.date)) {
      keys.add(tx.date.slice(0, 7));
    }
  });
  return Array.from(keys).sort((a, b) => b.localeCompare(a));
}

export function computeMonthlyCurrencyTotals(
  monthKey: string,
  accounts: Account[],
  balances: Record<string, number>,
  transactions: Transaction[]
): {
  totalsByCurrency: Record<string, CurrencyPeriodSummary>;
  monthTransactions: Transaction[];
  topCategoriesByCurrency: Record<string, { category: string; amount: number }[]>;
} {
  const monthTransactions = transactions
    .filter((tx) => tx.date.startsWith(monthKey))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalsByCurrency: Record<string, CurrencyPeriodSummary> = {};
  const catBuckets: Record<string, Record<string, number>> = {};

  const ensureBucket = (code: string) => {
    if (!totalsByCurrency[code]) {
      totalsByCurrency[code] = { income: 0, expense: 0, net: 0, balance: 0 };
    }
    return totalsByCurrency[code];
  };

  accounts.forEach((acc) => {
    const code = getCurrencyCode(acc.currency);
    const bucket = ensureBucket(code);
    bucket.balance += Number(balances[acc.id] ?? 0);
  });

  monthTransactions.forEach((tx) => {
    const accKey = tx.type === 'TRANSFER' ? tx.fromAccount : tx.account;
    const matched = accounts.find((a) => a.id === accKey || a.name === accKey);
    const code = getCurrencyCode(matched?.currency);
    const bucket = ensureBucket(code);
    const amt = Number(tx.amount) || 0;

    if (tx.type === 'INCOME') {
      bucket.income += amt;
      bucket.net += amt;
    } else if (tx.type === 'EXPENSE') {
      bucket.expense += amt;
      bucket.net -= amt;
      if (!catBuckets[code]) catBuckets[code] = {};
      const cat = tx.category || 'Altro';
      catBuckets[code][cat] = (catBuckets[code][cat] || 0) + amt;
    }
  });

  if (Object.keys(totalsByCurrency).length === 0) {
    ensureBucket('EUR');
  }

  const topCategoriesByCurrency: Record<string, { category: string; amount: number }[]> = {};
  Object.entries(catBuckets).forEach(([code, map]) => {
    topCategoriesByCurrency[code] = Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  });

  return { totalsByCurrency, monthTransactions, topCategoriesByCurrency };
}

export async function buildMonthlyStatementPackage(params: {
  monthKey: string;
  accounts: Account[];
  balances: Record<string, number>;
  transactions: Transaction[];
  goals?: Goal[];
  recipientEmail: string;
  holderName?: string;
  language?: Language;
}): Promise<{
  monthLabel: string;
  totalsByCurrency: Record<string, CurrencyPeriodSummary>;
  monthTransactions: Transaction[];
  subject: string;
  summaryText: string;
  mailtoUrl: string;
  pdfFile: File;
  pdfFileName: string;
  pdfBlob: Blob;
  pdfBase64: string;
}> {
  const lang: Language = params.language || 'it';
  const monthLabel = formatMonthKeyLabel(params.monthKey, lang);
  const { totalsByCurrency, monthTransactions, topCategoriesByCurrency } =
    computeMonthlyCurrencyTotals(
      params.monthKey,
      params.accounts,
      params.balances,
      params.transactions
    );

  const holderDisplay = (params.holderName || '').trim() || (lang === 'de' ? 'Kontoinhaber' : lang === 'en' ? 'Account Holder' : 'Cliente');
  const recipient = params.recipientEmail.trim().toLowerCase();

  const subject =
    lang === 'de'
      ? `MyFinance Pro - Monatlicher Kontoauszug ${monthLabel}`
      : lang === 'en'
        ? `MyFinance Pro - Monthly Account Statement (${monthLabel})`
        : `MyFinance Pro - Estratto Conto Mensile (${monthLabel})`;

  const lines: string[] = [];
  if (lang === 'de') {
    lines.push(`Sehr geehrte(r) ${holderDisplay},`);
    lines.push('');
    lines.push(`hier ist Ihr monatlicher Kontoauszug von MyFinance Pro für ${monthLabel}:`);
  } else if (lang === 'en') {
    lines.push(`Dear ${holderDisplay},`);
    lines.push('');
    lines.push(`Here is your MyFinance Pro Monthly Account Statement for ${monthLabel}:`);
  } else {
    lines.push(`Gentile ${holderDisplay},`);
    lines.push('');
    lines.push(`Ecco il tuo Estratto Conto Mensile MyFinance Pro per il periodo ${monthLabel}:`);
  }

  lines.push('');
  lines.push(lang === 'de' ? '--- ZUSAMMENFASSUNG NACH WÄHRUNG ---' : lang === 'en' ? '--- SUMMARY BY CURRENCY ---' : '--- RIEPILOGO PER VALUTA ---');
  Object.entries(totalsByCurrency).forEach(([code, stats]) => {
    const inc = formatCurrency(stats.income, true, code);
    const exp = formatCurrency(stats.expense, true, code);
    const net = `${stats.net >= 0 ? '+' : ''}${formatCurrency(stats.net, true, code)}`;
    const bal = formatCurrency(stats.balance, true, code);
    if (lang === 'de') {
      lines.push(`[${code}] Einnahmen: ${inc} | Ausgaben: ${exp} | Netto: ${net} | Aktueller Saldo: ${bal}`);
    } else if (lang === 'en') {
      lines.push(`[${code}] Income: ${inc} | Expenses: ${exp} | Net: ${net} | Current Balance: ${bal}`);
    } else {
      lines.push(`[${code}] Entrate: ${inc} | Uscite: ${exp} | Netto mese: ${net} | Saldo conti: ${bal}`);
    }
  });

  lines.push('');
  lines.push(lang === 'de' ? '--- KONTENÜBERSICHT ---' : lang === 'en' ? '--- ACCOUNTS OVERVIEW ---' : '--- SALDO CONTI ---');
  params.accounts.forEach((acc) => {
    const bal = Number(params.balances[acc.id] ?? 0);
    const code = getCurrencyCode(acc.currency);
    lines.push(`• ${acc.name} (${code}): ${formatCurrency(bal, true, code)}`);
  });

  const topCatEntries = Object.entries(topCategoriesByCurrency);
  if (topCatEntries.length > 0) {
    lines.push('');
    lines.push(lang === 'de' ? '--- WICHTIGSTE AUSGABEN ---' : lang === 'en' ? '--- TOP EXPENSE CATEGORIES ---' : '--- PRINCIPALI CATEGORIE DI SPESA ---');
    topCatEntries.forEach(([code, list]) => {
      list.forEach((item) => {
        lines.push(`• ${getCategoryDisplayName(item.category, lang)}: ${formatCurrency(item.amount, true, code)}`);
      });
    });
  }

  lines.push('');
  lines.push(
    lang === 'de'
      ? `Buchungen im Zeitraum: ${monthTransactions.length}`
      : lang === 'en'
        ? `Transactions recorded in period: ${monthTransactions.length}`
        : `Totale movimenti nel mese: ${monthTransactions.length}`
  );

  monthTransactions.slice(0, 15).forEach((tx) => {
    const accKey = tx.type === 'TRANSFER' ? tx.fromAccount : tx.account;
    const matched = params.accounts.find((a) => a.id === accKey || a.name === accKey);
    const code = getCurrencyCode(matched?.currency);
    const sign = tx.type === 'EXPENSE' ? '-' : tx.type === 'TRANSFER' ? '↺ ' : '+';
    lines.push(`  ${tx.date} | ${tx.description} | ${sign}${formatCurrency(tx.amount, true, code)}`);
  });

  if (monthTransactions.length > 15) {
    lines.push(`  ... (+${monthTransactions.length - 15} altri movimenti nel PDF allegato)`);
  }

  lines.push('');
  lines.push('---');
  lines.push('MyFinance Pro');

  const summaryText = lines.join('\n');
  const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summaryText)}`;

  const pdfResult = await buildMonthlyStatementPdfFile({
    monthKey: params.monthKey,
    accounts: params.accounts,
    balances: params.balances,
    transactions: params.transactions,
    goals: params.goals,
    holderName: holderDisplay,
    holderEmail: recipient,
    language: lang,
  });

  return {
    monthLabel,
    totalsByCurrency,
    monthTransactions,
    subject,
    summaryText,
    mailtoUrl,
    pdfFile: pdfResult.file,
    pdfFileName: pdfResult.fileName,
    pdfBlob: pdfResult.blob,
    pdfBase64: pdfResult.base64,
  };
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  } catch (err) {
    console.error('Download PDF blob error:', err);
  }
}

export async function sendMonthlyStatementViaWebhook(
  webhookUrl: string,
  payload: {
    recipientEmail: string;
    holderName: string;
    monthKey: string;
    monthLabel: string;
    subject: string;
    textBody: string;
    totalsByCurrency: Record<string, CurrencyPeriodSummary>;
    transactionsCount: number;
    pdfFileName: string;
    pdfBase64: string;
  }
): Promise<{ ok: boolean; message: string }> {
  const url = webhookUrl.trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return { ok: false, message: 'URL Webhook non valido (deve iniziare con https:// o http://).' };
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, message: `Webhook HTTP ${res.status}` };
    }
    return { ok: true, message: 'Estratto conto inviato automaticamente al Webhook configurato!' };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Errore di rete durante la chiamata Webhook.',
    };
  }
}

export async function runMonthlyStatementDispatch(params: {
  monthKey: string;
  accounts: Account[];
  balances: Record<string, number>;
  transactions: Transaction[];
  goals?: Goal[];
  settings?: MonthlyEmailSettings;
  securitySettings?: SecuritySettings;
  language?: Language;
  downloadPdfNow?: boolean;
  updateScheduleMarker?: boolean;
}): Promise<{
  entry: MonthlyStatementEntry;
  pdfFile: File;
  pdfBlob: Blob;
  mailtoUrl: string;
  downloadedPdf: boolean;
  webhookSent: boolean;
  updatedSettings: MonthlyEmailSettings;
}> {
  const lang = params.language || 'it';
  const settings = params.settings || getMonthlyEmailSettings();
  const holderName = [params.securitySettings?.firstName, params.securitySettings?.lastName]
    .filter(Boolean)
    .join(' ');
  const recipientEmail = (
    settings.recipientEmail ||
    params.securitySettings?.email ||
    params.securitySettings?.recoveryEmail ||
    ''
  )
    .trim()
    .toLowerCase();

  const pkg = await buildMonthlyStatementPackage({
    monthKey: params.monthKey,
    accounts: params.accounts,
    balances: params.balances,
    transactions: params.transactions,
    goals: params.goals,
    recipientEmail,
    holderName,
    language: lang,
  });

  let webhookSent = false;
  let status: MonthlyStatementEntry['status'] = 'prepared';
  let statusNote = 'Pronto per invio email e PDF generato';

  if (settings.webhookUrl && /^https?:\/\//i.test(settings.webhookUrl.trim()) && recipientEmail) {
    const hookRes = await sendMonthlyStatementViaWebhook(settings.webhookUrl, {
      recipientEmail,
      holderName,
      monthKey: params.monthKey,
      monthLabel: pkg.monthLabel,
      subject: pkg.subject,
      textBody: pkg.summaryText,
      totalsByCurrency: pkg.totalsByCurrency,
      transactionsCount: pkg.monthTransactions.length,
      pdfFileName: pkg.pdfFileName,
      pdfBase64: pkg.pdfBase64,
    });
    if (hookRes.ok) {
      webhookSent = true;
      status = 'sent_webhook';
      statusNote = hookRes.message;
    } else {
      statusNote = `PDF ed email pronti (Webhook: ${hookRes.message})`;
    }
  }

  let downloadedPdf = false;
  if (params.downloadPdfNow || settings.autoDownloadPdf) {
    triggerBlobDownload(pkg.pdfBlob, pkg.pdfFileName);
    downloadedPdf = true;
  }

  const entry: MonthlyStatementEntry = {
    id: `${params.monthKey}_${Date.now()}`,
    monthKey: params.monthKey,
    monthLabel: pkg.monthLabel,
    createdAt: new Date().toISOString(),
    recipientEmail,
    holderName,
    transactionsCount: pkg.monthTransactions.length,
    totalsByCurrency: pkg.totalsByCurrency,
    subject: pkg.subject,
    summaryText: pkg.summaryText,
    mailtoUrl: pkg.mailtoUrl,
    pdfFileName: pkg.pdfFileName,
    status,
    statusNote,
  };

  recordMonthlyStatementEntry(entry);

  const updatedSettings: MonthlyEmailSettings = {
    ...settings,
    recipientEmail: recipientEmail || settings.recipientEmail,
    lastProcessedMonthKey:
      params.updateScheduleMarker === false ? settings.lastProcessedMonthKey : params.monthKey,
    lastSentAt: new Date().toISOString(),
    lastStatus: status,
    lastMessage: statusNote,
  };
  saveMonthlyEmailSettings(updatedSettings);

  return {
    entry,
    pdfFile: pkg.pdfFile,
    pdfBlob: pkg.pdfBlob,
    mailtoUrl: pkg.mailtoUrl,
    downloadedPdf,
    webhookSent,
    updatedSettings,
  };
}

export async function checkAndRunAutomaticMonthlyStatement(params: {
  accounts: Account[];
  balances: Record<string, number>;
  transactions: Transaction[];
  goals?: Goal[];
  securitySettings?: SecuritySettings;
  language?: Language;
}): Promise<{
  triggered: boolean;
  entry?: MonthlyStatementEntry;
  webhookSent?: boolean;
}> {
  const current = getMonthlyEmailSettings();
  if (!current.enabled) return { triggered: false };

  const effectiveEmail = (
    current.recipientEmail ||
    params.securitySettings?.email ||
    params.securitySettings?.recoveryEmail ||
    ''
  )
    .trim()
    .toLowerCase();

  if (!effectiveEmail) return { triggered: false };

  const now = new Date();
  const prevMonthKey = getPreviousMonthKey(now);

  if (now.getDate() < (current.sendDayOfMonth || 1)) {
    return { triggered: false };
  }

  if (current.lastProcessedMonthKey === prevMonthKey) {
    return { triggered: false };
  }

  try {
    const res = await runMonthlyStatementDispatch({
      monthKey: prevMonthKey,
      accounts: params.accounts,
      balances: params.balances,
      transactions: params.transactions,
      goals: params.goals,
      settings: { ...current, recipientEmail: effectiveEmail },
      securitySettings: params.securitySettings,
      language: params.language || 'it',
      downloadPdfNow: current.autoDownloadPdf,
      updateScheduleMarker: true,
    });

    return {
      triggered: true,
      entry: res.entry,
      webhookSent: res.webhookSent,
    };
  } catch (err) {
    console.error('Automatic monthly statement error:', err);
    return { triggered: false };
  }
}

export function triggerMailtoDraft(mailtoUrl: string): void {
  try {
    const a = document.createElement('a');
    a.href = mailtoUrl;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Mailto launch error:', err);
  }
}

/**
 * One-click PDF-via-Email dispatcher:
 * 1. If Webhook HTTPS URL is configured -> POSTs full JSON + Base64 PDF directly for silent background email.
 * 2. Else if Web Share with files is supported (Android/iOS/mobile browsers) -> attaches the PDF file directly via share sheet.
 * 3. Else -> downloads the A4 PDF file and opens the pre-filled Email client (mailto:).
 */
export async function sendMonthlyStatementPdfByEmail(params: {
  monthKey: string;
  accounts: Account[];
  balances: Record<string, number>;
  transactions: Transaction[];
  goals?: Goal[];
  settings?: MonthlyEmailSettings;
  securitySettings?: SecuritySettings;
  language?: Language;
}): Promise<{
  mode: 'webhook' | 'native_share_pdf' | 'download_and_mailto';
  entry: MonthlyStatementEntry;
  pdfFileName: string;
  mailtoUrl: string;
  updatedSettings: MonthlyEmailSettings;
  message: string;
}> {
  const res = await runMonthlyStatementDispatch({
    ...params,
    downloadPdfNow: false,
    updateScheduleMarker: params.monthKey === getPreviousMonthKey(),
  });

  if (res.webhookSent) {
    return {
      mode: 'webhook',
      entry: res.entry,
      pdfFileName: res.pdfFile.name,
      mailtoUrl: res.mailtoUrl,
      updatedSettings: res.updatedSettings,
      message: `PDF "${res.pdfFile.name}" inviato automaticamente via email tramite Webhook a ${res.entry.recipientEmail}!`,
    };
  }

  // Try native Share Sheet with PDF file attached (supported on Android/iOS/Safari/Edge/Chrome OS)
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [res.pdfFile] })
  ) {
    try {
      await navigator.share({
        title: res.entry.subject,
        text: res.entry.summaryText,
        files: [res.pdfFile],
      });
      return {
        mode: 'native_share_pdf',
        entry: res.entry,
        pdfFileName: res.pdfFile.name,
        mailtoUrl: res.mailtoUrl,
        updatedSettings: res.updatedSettings,
        message: `PDF "${res.pdfFile.name}" condiviso per l'invio via Email!`,
      };
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        // User cancelled share sheet; still save PDF locally
      }
    }
  }

  // Fallback for desktop browsers: download the PDF and open mail client
  triggerBlobDownload(res.pdfBlob, res.pdfFile.name);
  triggerMailtoDraft(res.mailtoUrl);

  return {
    mode: 'download_and_mailto',
    entry: res.entry,
    pdfFileName: res.pdfFile.name,
    mailtoUrl: res.mailtoUrl,
    updatedSettings: res.updatedSettings,
    message: `PDF "${res.pdfFile.name}" scaricato e bozza email aperta per ${res.entry.recipientEmail}. Allega il PDF appena scaricato e premi Invia!`,
  };
}

export const GOOGLE_APPS_SCRIPT_PDF_EMAIL_TEMPLATE = `function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var pdfBlob = Utilities.newBlob(
    Utilities.base64Decode(data.pdfBase64),
    'application/pdf',
    data.pdfFileName
  );
  MailApp.sendEmail({
    to: data.recipientEmail,
    subject: data.subject,
    body: data.textBody,
    attachments: [pdfBlob]
  });
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}`;
