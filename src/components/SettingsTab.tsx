import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  Sliders,
  Settings2,
  Tags,
  Repeat,
  Download,
  FileSpreadsheet,
  Upload,
  ChevronRight,
  ShieldCheck,
  Shield,
  Lock,
  Mail,
  Copy,
  FileText,
  AlertTriangle,
  X,
  Search,
  Play,
  Plus,
  CheckCircle2,
  FileDown,
  Target,
  TrendingUp,
  TrendingDown,
  Wallet,
  Scale,
  Wrench,
  Sparkles,
  Printer,
  Code,
  FileCode,
  Check,
  Cloud,
  Archive,
  Globe,
  Wand2,
  Fingerprint,
} from 'lucide-react';
import JSZip from 'jszip';
import { Account, FxSettings, Goal, RecurringMovement, Transaction } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { ReminderSettings } from '../utils/notifications';
import {
  generateMonthlyReportPdf,
  generateCompleteGuidePdf,
  generateTrilingualCompleteGuidePdf,
} from '../utils/pdfGenerator';
import { printHtmlDocument } from '../utils/printHelper';
import { BalanceReconcileModal } from './BalanceReconcileModal';
import { CopyrightFooter } from './CopyrightFooter';
import { Language, Translations, getCategoryDisplayName, formatLocalizedMonthYear } from '../utils/translations';
import { AutoBackupModal } from './AutoBackupModal';
import { getAutoBackupSettings, AutoBackupSettings } from '../utils/autoBackup';
import { SecuritySettingsModal } from './SecuritySettingsModal';
import { SecuritySettings, isUserRegistered } from '../utils/security';
import { getMonthlyEmailSettings, MonthlyEmailSettings } from '../utils/monthlyEmailStatement';

interface SettingsTabProps {
  accounts: Account[];
  balances: Record<string, number>;
  transactions: Transaction[];
  categories: string[];
  goals: Goal[];
  getBackupPayload?: () => Record<string, unknown>;

  // Security & App Lock props
  securitySettings?: SecuritySettings;
  onUpdateSecuritySettings?: (newSettings: SecuritySettings) => void;
  onLockNow?: () => void;
  onOpenSecurityModal?: () => void;
  onOpenMonthlyStatement?: () => void;
  onOpenPrivacyPolicy?: () => void;
  monthlyEmailSettings?: MonthlyEmailSettings;

  onOpenAccounts: () => void;
  onOpenCategories: () => void;
  onOpenRecurring: () => void;
  onOpenFxSettings?: () => void;
  fxSettings?: FxSettings;
  onOpenRules?: () => void;
  rulesCount?: number;
  onReconcileData: (
    updatedTransactions: Transaction[],
    updatedAccounts?: Account[],
    updatedCategories?: string[]
  ) => void;
  recurring: RecurringMovement[];
  onApplyRecurring: (id: string) => void;
  onOpenApkModal: () => void;
  onExportJson: () => void;
  onCopyBackupJson: () => void;
  onExportCsv: () => void;
  onOpenCsvImport?: () => void;
  onImportJson: (jsonData: unknown) => boolean;
  onShowToast: (msg: string) => void;
  // Daily reminder props (optional)
  reminderSettings?: ReminderSettings;
  notificationPermission?: NotificationPermission | 'unsupported';
  isNotificationSupported?: boolean;
  onToggleReminder?: (enabled: boolean) => void;
  onUpdateReminderTime?: (time: string) => void;
  onRequestNotificationPermission?: () => Promise<boolean>;
  onSendTestNotification?: () => Promise<boolean>;
  // Smartphone storage & persistence
  storageStats?: {
    isPersisted: boolean;
    canPersist: boolean;
    usageBytes: number;
    quotaBytes: number;
    isStandalone: boolean;
  };
  onRequestPersistence?: () => Promise<void>;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  t: Translations;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  accounts,
  balances,
  transactions,
  categories,
  goals,
  securitySettings,
  onUpdateSecuritySettings,
  onLockNow,
  onOpenSecurityModal,
  onOpenMonthlyStatement,
  onOpenPrivacyPolicy,
  monthlyEmailSettings: monthlyEmailSettingsProp,
  onOpenAccounts,
  onOpenCategories,
  onOpenRecurring,
  onOpenFxSettings,
  fxSettings,
  onOpenRules,
  rulesCount = 0,
  onReconcileData,
  recurring,
  onApplyRecurring,
  onOpenApkModal,
  onExportJson,
  onCopyBackupJson,
  onExportCsv,
  onOpenCsvImport,
  onImportJson,
  onShowToast,
  language,
  onLanguageChange,
  t,
  getBackupPayload,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [isAutoBackupModalOpen, setIsAutoBackupModalOpen] = useState(false);
  const [autoBackupSettings, setAutoBackupSettings] = useState<AutoBackupSettings>(getAutoBackupSettings);
  const activeMonthlySettings = monthlyEmailSettingsProp || getMonthlyEmailSettings();
  const isRegisteredUser = isUserRegistered(securitySettings);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [recurringSearchQuery, setRecurringSearchQuery] = useState('');
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [hasCopiedHtml, setHasCopiedHtml] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const resolveBackupPayload = () => {
    if (getBackupPayload) return getBackupPayload();
    return {
      accounts,
      transactions,
      categories,
      recurring,
      goals,
      exportDate: new Date().toISOString(),
      version: '3.0.0',
    };
  };

  const indexHtmlCode = `<!doctype html>
<!-- 
  MyFinance Pro - Standalone Single-File Application
  Tutti i componenti React, fogli di stile Tailwind e icone sono inclusi 
  in questo unico file autonomo (myfinance_app.html).
  Funziona al 100% offline da qualsiasi computer o smartphone:
  basta fare doppio clic sul file per aprirlo in Chrome, Safari, Edge o Firefox.
-->
<html lang="it" class="h-full bg-slate-950 text-slate-100 antialiased select-none">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>MyFinance Pro - Android & Web Edition</title>
    <meta name="author" content="Federico Pontedoro" />
    <meta name="copyright" content="© 2026 Federico Pontedoro. All rights reserved. My Finance Pro." />
    <!-- Stili Tailwind CSS compilati incorporati -->
    <style>/* [Tailwind CSS compilato integrato nel file] */</style>
  </head>
  <body class="h-full bg-slate-950 text-slate-100 overflow-x-hidden">
    <div id="root"></div>
    <!-- Codice dell'applicazione MyFinance Pro incorporato (IIFE) -->
    <script>/* [Bundle React completo MyFinance Pro integrato] */</script>
  </body>
</html>`;

  const getFullStandaloneHtml = async (): Promise<string> => {
    // 1. Se siamo su server HTTP/HTTPS (anteprima web o dev), prova a leggere il file compilato pulito
    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/myfinance_standalone.html');
        if (res.ok) {
          const text = await res.text();
          if (text && text.includes('<!doctype html>')) {
            return text;
          }
        }
      } catch (e) {
        console.warn('HTTP fetch failed, extracting live DOM:', e);
      }
    }

    // 2. Se siamo offline o aperti come file locale (file:///), estrai l'intero codice dal DOM corrente
    try {
      const clone = document.documentElement.cloneNode(true) as HTMLElement;
      // Ripristina l'interno di #root con la schermata di caricamento iniziale pulita
      const root = clone.querySelector('#root');
      if (root) {
        root.innerHTML = `
      <div id="app-loader" style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #020617; color: #f8fafc; text-align: center; padding: 20px;">
        <div style="width: 54px; height: 54px; border-radius: 16px; background: linear-gradient(135deg, #4f46e5, #9333ea); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-weight: 900; font-size: 22px; color: white; box-shadow: 0 10px 25px rgba(79, 70, 229, 0.4);">
          MF
        </div>
        <div style="font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; margin-bottom: 6px;">MyFinance Pro</div>
        <div style="font-size: 13px; color: #94a3b8; margin-bottom: 20px;">Avvio dell'applicazione in corso...</div>
        <div style="width: 32px; height: 32px; border: 3px solid rgba(99, 102, 241, 0.2); border-top-color: #6366f1; border-radius: 50%; animation: mf-spin 1s linear infinite;"></div>
        <style>@keyframes mf-spin{to{transform:rotate(360deg)}}</style>
      </div>`;
      }
      return '<!doctype html>\n' + clone.outerHTML;
    } catch (err) {
      console.error('Failed to clone live DOM:', err);
      return indexHtmlCode;
    }
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      let zipBlob: Blob | null = null;

      // 1. Se siamo su server HTTP, prova prima il file pre-compilato
      if (window.location.protocol.startsWith('http')) {
        try {
          const res = await fetch('/myfinance_app.zip');
          if (res.ok) {
            zipBlob = await res.blob();
          }
        } catch (e) {
          console.warn('Pre-built zip fetch skipped in local mode:', e);
        }
      }

      // 2. Se non c'è zipBlob (es. siamo in file:/// o offline), genera lo ZIP al volo con JSZip in memoria!
      if (!zipBlob) {
        const htmlContent = await getFullStandaloneHtml();
        const zip = new JSZip();
        zip.file('index.html', htmlContent);
        zip.file('myfinance_app.html', htmlContent);
        zip.file(
          'ISTRUZIONI_AVVIO.txt',
          `=====================================================
MYFINANCE PRO - APPLICAZIONE AUTONOMA OFFLINE (.HTML)
=====================================================

ISTRUZIONI DI AVVIO:
1. Estrai i file da questo archivio ZIP.
2. Fai doppio clic su "index.html" o "myfinance_app.html" per aprirlo con qualsiasi browser:
   Google Chrome, Microsoft Edge, Mozilla Firefox, Safari o Opera.
3. Per convertitori HTML -> APK che richiedono "index.html", il file è già pronto nella root dello ZIP!
4. Funziona al 100% offline su Windows, Mac, Linux, Android e iOS.

=====================================================
ANLEITUNG (DEUTSCH):
1. Entpacken Sie dieses ZIP-Archiv.
2. Öffnen Sie "index.html" oder "myfinance_app.html" im Browser (100% offline).
3. "index.html" für APK-Konverter ist direkt enthalten.

=====================================================
INSTRUCTIONS (ENGLISH):
1. Extract this ZIP file.
2. Double-click "index.html" or "myfinance_app.html" to open offline in any browser.
3. "index.html" for HTML-to-APK builders is already included at root level.
=====================================================
`
        );

        zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 9 },
        });
      }

      // Scarica SEMPRE tramite Blob URL nativo, mai con navigazione a radice /
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'myfinance_app.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      onShowToast(t?.downloadZipToast || 'File ZIP (myfinance_app.zip con index.html) scaricato con successo!');
    } catch (err) {
      console.error('Error generating zip:', err);
      onShowToast(
        language === 'de'
          ? 'Fehler beim Erstellen der ZIP-Datei.'
          : language === 'en'
            ? 'Error creating ZIP file.'
            : 'Errore durante la creazione del file ZIP.'
      );
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadHtml = async (fileName: string = 'myfinance_app.html') => {
    try {
      const htmlContent = await getFullStandaloneHtml();
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      onShowToast(
        fileName === 'index.html'
          ? language === 'de'
            ? 'index.html (für APK-Konverter) heruntergeladen!'
            : language === 'en'
              ? 'index.html (for APK converter) downloaded!'
              : 'File index.html (pronto per convertitore APK) scaricato!'
          : t?.htmlDownloadedToast || 'Download applicazione HTML avviato!'
      );
    } catch (err) {
      console.error('Download HTML error:', err);
      onShowToast(
        language === 'de'
          ? 'Fehler beim Herunterladen der HTML-Datei.'
          : language === 'en'
            ? 'Error downloading HTML file.'
            : 'Errore durante il download del file HTML.'
      );
    }
  };

  const handleCopyHtml = async () => {
    try {
      const codeToCopy = await getFullStandaloneHtml();
      await navigator.clipboard.writeText(codeToCopy);
      setHasCopiedHtml(true);
      setTimeout(() => setHasCopiedHtml(false), 2500);
      onShowToast(
        language === 'de'
          ? 'HTML-Code in die Zwischenablage kopiert!'
          : language === 'en'
            ? 'Complete HTML code copied!'
            : 'Codice HTML completo copiato negli appunti!'
      );
    } catch (e) {
      console.error('Copy HTML error:', e);
      onShowToast(
        language === 'de'
          ? 'Fehler beim Kopieren des Codes.'
          : language === 'en'
            ? 'Error copying code.'
            : 'Errore durante la copia del codice.'
      );
    }
  };

  // Calcolo riassunto del mese corrente per preview e PDF
  const currentMonthData = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const capitalizedMonth = formatLocalizedMonthYear(now, language);

    const monthTx = transactions.filter((tx) => tx.date.startsWith(currentMonthKey));

    let income = 0;
    let expense = 0;
    const catMap: Record<string, { total: number; count: number }> = {};

    monthTx.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'INCOME') {
        income += amt;
      } else if (tx.type === 'EXPENSE') {
        expense += amt;
        const cat = tx.category || 'Altro';
        if (!catMap[cat]) {
          catMap[cat] = { total: 0, count: 0 };
        }
        catMap[cat].total += amt;
        catMap[cat].count += 1;
      }
    });

    const topCategories = Object.entries(catMap)
      .map(([cat, info]) => ({
        category: cat,
        total: info.total,
        count: info.count,
        percentage: expense > 0 ? (info.total / expense) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const totalBalance = Object.values(balances).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0
    );

    return {
      monthName: capitalizedMonth,
      totalBalance,
      income,
      expense,
      netSavings: income - expense,
      savingsRate:
        income > 0
          ? Math.max(0, Math.min(100, Math.round(((income - expense) / income) * 100)))
          : 0,
      topCategories,
      txCount: monthTx.length,
      goalsCount: goals.length,
    };
  }, [transactions, balances, goals, language]);

  const handleGeneratePdfReport = () => {
    try {
      setIsGeneratingPdf(true);
      generateMonthlyReportPdf({
        accounts,
        balances,
        transactions,
        goals,
        language,
      });
      onShowToast(
        t?.monthlyPdfGeneratedToast
          ? `${t.monthlyPdfGeneratedToast} (${currentMonthData.monthName})`
          : `Report PDF (${currentMonthData.monthName}) generato con successo!`
      );
      setIsReportModalOpen(false);
    } catch (err) {
      console.error('Error generating PDF report:', err);
      onShowToast(t?.monthlyPdfErrorToast || 'Errore durante la generazione del report PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintMonthlyReport = async () => {
    try {
      const isDe = language === 'de';
      const isEn = language === 'en';

      const movLabel = isDe ? 'Buchungen' : isEn ? 'mov.' : 'mov.';
      const emptyCatLabel = isDe
        ? 'Keine Ausgaben in diesem Monat'
        : isEn
          ? 'No expenses this month'
          : 'Nessuna spesa nel mese';

      const topCatRows = currentMonthData.topCategories
        .map(
          (c) => `
          <tr>
            <td class="font-bold">${getCategoryDisplayName(c.category, language)}</td>
            <td class="text-center">${c.count} ${movLabel}</td>
            <td class="text-center">${c.percentage.toFixed(1)}%</td>
            <td class="text-right font-bold text-rose">-${formatCurrency(c.total)}</td>
          </tr>
        `
        )
        .join('');

      const accountsRows = accounts
        .map((acc) => {
          const bal = balances[acc.id] || 0;
          return `
            <tr>
              <td class="font-bold">${acc.name}</td>
              <td>${acc.type || 'Standard'}</td>
              <td class="text-right font-bold ${bal >= 0 ? 'text-emerald' : 'text-rose'}">${formatCurrency(bal)}</td>
            </tr>
          `;
        })
        .join('');

      const titleIncome = isDe
        ? `Einnahmen (${currentMonthData.monthName})`
        : isEn
          ? `Income (${currentMonthData.monthName})`
          : `Entrate (${currentMonthData.monthName})`;
      const titleExpense = isDe
        ? `Ausgaben (${currentMonthData.monthName})`
        : isEn
          ? `Expenses (${currentMonthData.monthName})`
          : `Uscite (${currentMonthData.monthName})`;
      const titleSavings = isDe
        ? `Netto-Ersparnis (${currentMonthData.savingsRate}%)`
        : isEn
          ? `Net Savings (${currentMonthData.savingsRate}%)`
          : `Risparmio Netto (${currentMonthData.savingsRate}%)`;
      const section1Title = isDe
        ? `1. Ausgaben nach Kategorie (${currentMonthData.monthName})`
        : isEn
          ? `1. Expenses by Category (${currentMonthData.monthName})`
          : `1. Spese per Categoria (${currentMonthData.monthName})`;
      const section2Title = isDe
        ? '2. Salden nach Konto'
        : isEn
          ? '2. Balances by Account'
          : '2. Saldi per Conto';

      const colCategory = isDe ? 'Kategorie' : isEn ? 'Category' : 'Categoria';
      const colMovements = isDe ? 'Buchungen' : isEn ? 'Movements' : 'Movimenti';
      const colPercent = isDe ? '% vom Gesamten' : isEn ? '% of Total' : '% sul Totale';
      const colAmount = isDe ? 'Betrag' : isEn ? 'Amount' : 'Importo';

      const colAccount = isDe ? 'Konto' : isEn ? 'Account' : 'Conto';
      const colType = isDe ? 'Typ' : isEn ? 'Type' : 'Tipologia';
      const colAvailableBal = isDe ? 'Verfügbarer Saldo' : isEn ? 'Available Balance' : 'Saldo Disponibile';

      const html = `
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-title">${titleIncome}</div>
            <div class="summary-value text-emerald">+${formatCurrency(currentMonthData.income)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">${titleExpense}</div>
            <div class="summary-value text-rose">-${formatCurrency(currentMonthData.expense)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">${titleSavings}</div>
            <div class="summary-value ${currentMonthData.netSavings >= 0 ? 'text-emerald' : 'text-rose'}">
              ${currentMonthData.netSavings >= 0 ? '+' : ''}${formatCurrency(currentMonthData.netSavings)}
            </div>
          </div>
        </div>

        <h3 style="margin-top: 18px; font-size: 11pt; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
          ${section1Title}
        </h3>
        <table>
          <thead>
            <tr>
              <th>${colCategory}</th>
              <th style="width: 90px; text-align: center;">${colMovements}</th>
              <th style="width: 100px; text-align: center;">${colPercent}</th>
              <th style="width: 120px; text-align: right;">${colAmount}</th>
            </tr>
          </thead>
          <tbody>
            ${topCatRows || `<tr><td colspan="4" class="text-center">${emptyCatLabel}</td></tr>`}
          </tbody>
        </table>

        <h3 style="margin-top: 22px; font-size: 11pt; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
          ${section2Title}
        </h3>
        <table>
          <thead>
            <tr>
              <th>${colAccount}</th>
              <th style="width: 140px;">${colType}</th>
              <th style="width: 130px; text-align: right;">${colAvailableBal}</th>
            </tr>
          </thead>
          <tbody>
            ${accountsRows}
          </tbody>
        </table>
      `;

      await printHtmlDocument({
        title: isDe
          ? `Monatsbericht - ${currentMonthData.monthName}`
          : isEn
            ? `Monthly Report - ${currentMonthData.monthName}`
            : `Report Mensile - ${currentMonthData.monthName}`,
        subtitle: isDe
          ? `Konsolidierte Finanzübersicht: ${currentMonthData.monthName}`
          : isEn
            ? `Consolidated Financial Overview: ${currentMonthData.monthName}`
            : `Riepilogo Finanziario Consolidato: ${currentMonthData.monthName}`,
        contentHtml: html,
        language: language,
        onFallback: () => {
          handleGeneratePdfReport();
        },
      });
      onShowToast(t?.printWindowOpenedToast || 'Finestra di stampa aperta con successo!');
    } catch (err) {
      console.error(err);
      handleGeneratePdfReport();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || !text.trim()) {
          onShowToast(
            language === 'de'
              ? 'Die ausgewählte Datei ist leer.'
              : language === 'en'
                ? 'The selected file is empty.'
                : 'Il file selezionato è vuoto.'
          );
          return;
        }

        const parsed = JSON.parse(text);
        const success = onImportJson(parsed);
        if (success) {
          onShowToast(
            language === 'de'
              ? 'Backup erfolgreich wiederhergestellt!'
              : language === 'en'
                ? 'Backup restored successfully!'
                : 'Backup ripristinato con successo!'
          );
        }
      } catch (err) {
        console.error('JSON parse error:', err);
        onShowToast(
          language === 'de'
            ? 'Syntaxfehler in der JSON-Datei. Bitte Format prüfen.'
            : language === 'en'
              ? 'JSON syntax error. Please verify file format.'
              : 'Errore di sintassi nel file JSON. Verifica il formato.'
        );
      }
    };

    reader.onerror = () => {
      onShowToast(
        language === 'de'
          ? 'Ausgewählte Datei konnte nicht gelesen werden.'
          : language === 'en'
            ? 'Unable to read the selected file.'
            : 'Impossibile leggere il file selezionato.'
      );
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasteError(null);

    const trimmed = pasteText.trim();
    if (!trimmed) {
      setPasteError(
        language === 'de'
          ? 'Fügen Sie den JSON-Inhalt unten ein.'
          : language === 'en'
            ? 'Paste the JSON backup content below.'
            : 'Incolla il contenuto del file JSON nel campo sottostante.'
      );
      return;
    }

    try {
      const parsed = JSON.parse(trimmed);
      const success = onImportJson(parsed);
      if (success) {
        setIsPasteModalOpen(false);
        setPasteText('');
      } else {
        setPasteError(
          language === 'de'
            ? 'Keine gültigen Daten (Konten, Buchungen, Kategorien) gefunden.'
            : language === 'en'
              ? 'No valid data (accounts, transactions, or categories) found.'
              : 'Nessun dato valido (conti, transazioni o categorie) trovato nel testo.'
        );
      }
    } catch (err) {
      console.error(err);
      setPasteError(
        language === 'de'
          ? 'Ungültiger JSON-Text. Bitte vollständigen Backup-Inhalt kopieren.'
          : language === 'en'
            ? 'Invalid JSON text. Make sure you copied the full backup content.'
            : "Testo JSON non valido. Assicurati di aver copiato l'intero contenuto del backup."
      );
    }
  };

  // Filter recurring models by name (description) or category
  const filteredRecurringSettings = useMemo(() => {
    const q = recurringSearchQuery.toLowerCase().trim();
    if (!q) return recurring;
    return recurring.filter(
      (rec) =>
        rec.description.toLowerCase().includes(q) ||
        rec.category.toLowerCase().includes(q) ||
        rec.account.toLowerCase().includes(q)
    );
  }, [recurring, recurringSearchQuery]);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
        <Sliders className="w-4 h-4 text-indigo-400" /> {t?.settingsTitle || 'Opzioni & Gestione Dati'}
      </h2>

      {/* 1. SEZIONE CONFIGURAZIONE */}
      <div className="space-y-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
          {t?.configSectionTitle || 'Configurazione Dati'}
        </span>

        {/* Basic options: Conti & Categorie */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
          <button
            onClick={onOpenAccounts}
            className="w-full px-4 py-3.5 text-left text-xs font-medium text-slate-200 flex items-center justify-between active:bg-slate-800 transition"
          >
            <span className="flex items-center gap-2.5">
              <Settings2 className="w-4 h-4 text-indigo-400" /> {t?.manageAccountsBtn || 'Gestisci & Modifica Conti'}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          <button
            onClick={onOpenCategories}
            className="w-full px-4 py-3.5 text-left text-xs font-medium text-slate-200 flex items-center justify-between active:bg-slate-800 transition"
          >
            <span className="flex items-center gap-2.5">
              <Tags className="w-4 h-4 text-purple-400" /> {t?.manageCategoriesBtn || 'Gestione Categorie'}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          {onOpenFxSettings && (
            <button
              type="button"
              onClick={onOpenFxSettings}
              className="w-full px-4 py-3.5 text-left text-xs font-medium text-slate-200 flex items-center justify-between active:bg-slate-800 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Globe className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium text-slate-200 block truncate">
                    {language === 'de'
                      ? 'Basiswährung & Wechselkurse'
                      : language === 'en'
                        ? 'Base Currency & FX Rates'
                        : 'Valuta Base & Tassi di Cambio'}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {fxSettings?.baseCurrency || 'EUR'} · USD {fxSettings?.rates?.USD ?? 1.08} · GBP {fxSettings?.rates?.GBP ?? 0.85}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
            </button>
          )}

          {onOpenRules && (
            <button
              type="button"
              onClick={onOpenRules}
              className="w-full px-4 py-3.5 text-left text-xs font-medium text-slate-200 flex items-center justify-between active:bg-slate-800 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Wand2 className="w-4 h-4 text-purple-300 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium text-slate-200 block truncate">
                    {language === 'de'
                      ? 'Auto-Regeln & Tags'
                      : language === 'en'
                        ? 'Auto-Categorization & Tags'
                        : 'Regole Automatiche & Tag'}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {rulesCount}{' '}
                    {language === 'de'
                      ? 'Regeln konfiguriert'
                      : language === 'en'
                        ? 'rules configured'
                        : 'regole configurate'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
            </button>
          )}

          <button
            onClick={() => setIsReconcileModalOpen(true)}
            className="w-full px-4 py-3.5 text-left text-xs font-medium text-slate-200 flex items-center justify-between active:bg-slate-800 transition hover:bg-slate-850 group"
          >
            <div className="flex items-center gap-2.5">
              <Scale className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-medium text-slate-200 block">
                  {t?.reconcileBalancesBtn || 'Ricalcolo Saldo & Verifica Coerenza'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {t?.reconcileBalancesDesc || 'Verifica congruenza transazioni e correggi discrepanze'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                {t?.verifyBadge || 'Verifica'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          </button>

          <button
            onClick={() => {
              if (onOpenSecurityModal) {
                onOpenSecurityModal();
              } else {
                setIsSecurityModalOpen(true);
              }
            }}
            className="w-full px-4 py-3.5 text-left text-xs font-medium text-slate-200 flex items-center justify-between active:bg-slate-800 transition hover:bg-slate-850 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="font-medium text-slate-200 block truncate">
                  {t?.securitySectionTitle || 'Profilo Utente & Sicurezza Accesso'}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {isRegisteredUser
                    ? `${securitySettings?.firstName} ${securitySettings?.lastName} • ${securitySettings?.email || securitySettings?.recoveryEmail}`
                    : securitySettings?.enabled
                      ? (securitySettings.recoveryEmail
                        ? `${language === 'de' ? 'Passwort aktiv • E-Mail' : language === 'en' ? 'Password active • Email' : 'Password attiva • Email'}: ${securitySettings.recoveryEmail}`
                        : language === 'de'
                          ? 'Passwortschutz aktiv'
                          : language === 'en'
                            ? 'Password protection active'
                            : 'Password di protezione attiva')
                      : language === 'de'
                        ? 'Registrieren (Vorname, Nachname, E-Mail, Passwort) & App schützen'
                        : language === 'en'
                          ? 'Register (First Name, Last Name, Email, Password) & protect app'
                          : "Registrati (Nome, Cognome, Email, Password) e proteggi l'app"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {securitySettings?.useFingerprint && securitySettings?.credentialId && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-cyan-500/10 text-cyan-300 border-cyan-500/25 inline-flex items-center gap-1"
                  title="Fingerprint attivo"
                >
                  <Fingerprint className="w-3 h-3" />
                  <span className="hidden sm:inline">Fingerprint</span>
                </span>
              )}
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isRegisteredUser || securitySettings?.enabled
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                }`}
              >
                {isRegisteredUser
                  ? (language === 'de' ? 'Registriert' : language === 'en' ? 'Registered' : 'Registrato')
                  : securitySettings?.enabled
                    ? (language === 'de' ? 'Aktiv' : language === 'en' ? 'Active' : 'Attivo')
                    : (language === 'de' ? 'Registrieren' : language === 'en' ? 'Register' : 'Registrati')}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          </button>
        </div>

        {/* Card dedicata per Ricerca e Gestione Movimenti Ricorrenti */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Repeat className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">{t?.recurringTitle || 'Movimenti Ricorrenti'}</h3>
                <p className="text-[10px] text-slate-400">{recurring.length} {t?.recurringConfigured || 'modelli configurati'}</p>
              </div>
            </div>
            <button
              onClick={onOpenRecurring}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2.5 py-1.5 rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t?.manageAllRecurringBtn || 'Gestisci Tutti'}</span>
            </button>
          </div>

          {/* Filtro di Ricerca Modelli per Nome o Categoria */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={recurringSearchQuery}
              onChange={(e) => setRecurringSearchQuery(e.target.value)}
              placeholder={t?.searchRecurringPlaceholder || 'Cerca modello per nome o categoria...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-7 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
            {recurringSearchQuery && (
              <button
                onClick={() => setRecurringSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Risultati filtrati dei modelli ricorrenti */}
          <div className="space-y-1.5 max-h-52 overflow-y-auto no-scrollbar pt-0.5">
            {filteredRecurringSettings.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <Search className="w-4 h-4 mx-auto mb-1 text-slate-500" />
                <span>
                  {recurringSearchQuery
                    ? t?.noRecurringFound || `Nessun modello corrispondente a "${recurringSearchQuery}"`
                    : t?.noRecurringSaved || 'Nessun modello ricorrente salvato.'}
                </span>
              </div>
            ) : (
              filteredRecurringSettings.map((rec) => {
                const isExpense = rec.type === 'EXPENSE';
                const colorClass = isExpense ? 'text-rose-400' : 'text-emerald-400';
                const categoryDisplay = getCategoryDisplayName(rec.category, language);

                return (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 text-xs transition"
                  >
                    <div className="truncate mr-2 flex-1 min-w-0">
                      <div className="font-semibold text-slate-200 truncate">{rec.description}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                        <span className={`font-bold ${colorClass}`}>
                          {isExpense ? '-' : '+'}{formatCurrency(rec.amount)}
                        </span>
                        <span>•</span>
                        <span className="truncate text-indigo-300 font-medium">{categoryDisplay}</span>
                        <span>•</span>
                        <span className="truncate">{rec.account}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onApplyRecurring(rec.id)}
                      title={t?.applyRecurringBtn || 'Registra movimento ad oggi'}
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 flex-shrink-0 transition active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{t?.applyRecurringBtn || 'Applica'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* SEZIONE LINGUA DELL'APPLICAZIONE (ITALIANO, TEDESCO, INGLESE) */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
          <span>{t.languageSection}</span>
          <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Italiano · Deutsch · English
          </span>
        </span>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {t.languageDesc}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'it' as const, label: 'Italiano', flag: '🇮🇹', sub: 'Standard' },
              { id: 'de' as const, label: 'Deutsch', flag: '🇩🇪', sub: 'Tedesco' },
              { id: 'en' as const, label: 'English', flag: '🇬🇧', sub: 'Inglese' },
            ].map((item) => {
              const isSelected = language === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onLanguageChange(item.id)}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-md shadow-indigo-500/10'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="text-lg leading-none">{item.flag}</span>
                  <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                    {item.label}
                  </span>
                  <span className="text-[9px] text-slate-500 leading-none">
                    {item.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SEZIONE BACKUP AUTOMATICO GIORNALIERO (ONE DRIVE, GOOGLE DRIVE, DISPOSITIVO) */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
          <span>
            {language === 'de'
              ? 'Tägliches automatisches Backup (.JSON)'
              : language === 'en'
                ? 'Daily Automatic Backup (.JSON)'
                : 'Backup Automatico Giornaliero (.JSON)'}
          </span>
          <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
            <Cloud className="w-3 h-3" /> OneDrive · Google Drive · Dispositivo
          </span>
        </span>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white truncate">
                    {language === 'de'
                      ? 'Automatisches Backup'
                      : language === 'en'
                        ? 'Automatic Daily Backup'
                        : 'Backup Automatico Giornaliero'}
                  </h4>
                  {autoBackupSettings.enabled ? (
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-300 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/25">
                      {language === 'de' ? 'Aktiv' : language === 'en' ? 'Active' : 'Attivo'}
                    </span>
                  ) : (
                    <span className="text-[9px] bg-slate-800 text-slate-400 font-bold px-1.5 py-0.2 rounded-full border border-slate-700">
                      OFF
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate font-mono">
                  {autoBackupSettings.customPath || 'OneDrive/Documenti/MyFinance_Backups'}
                </p>
                {autoBackupSettings.lastBackupDate && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {language === 'de' ? 'Letzte Sicherung:' : language === 'en' ? 'Last backup:' : 'Ultimo salvataggio:'}{' '}
                    {autoBackupSettings.lastBackupDate}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAutoBackupModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm active:scale-95 flex-shrink-0"
            >
              <span>{language === 'de' ? 'Konfigurieren' : language === 'en' ? 'Configure' : 'Configura'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SEZIONE ESTRATTO CONTO MENSILE AUTOMATICO PER EMAIL */}
      {onOpenMonthlyStatement && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
            <span>
              {language === 'de'
                ? 'Monatlicher E-Mail-Kontoauszug'
                : language === 'en'
                  ? 'Automatic Monthly Email Statement'
                  : 'Estratto Conto Mensile per Email'}
            </span>
            <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
              <Mail className="w-3 h-3" /> PDF A4 · Multi-Valuta
            </span>
          </span>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600/20 to-cyan-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white truncate">
                      {language === 'de'
                        ? 'Automatischer Kontoauszug'
                        : language === 'en'
                          ? 'Monthly Statement Dispatch'
                          : 'Estratto Conto Automatico'}
                    </h4>
                    {activeMonthlySettings.enabled && activeMonthlySettings.recipientEmail ? (
                      <span className="text-[9px] bg-emerald-500/15 text-emerald-300 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/25">
                        {language === 'de' ? 'Aktiv' : language === 'en' ? 'Active' : 'Attivo'}
                      </span>
                    ) : (
                      <span className="text-[9px] bg-amber-500/15 text-amber-300 font-bold px-1.5 py-0.2 rounded-full border border-amber-500/25">
                        {activeMonthlySettings.recipientEmail
                          ? 'OFF'
                          : language === 'de'
                            ? 'E-Mail fehlt'
                            : language === 'en'
                              ? 'Email missing'
                              : 'Email mancante'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {activeMonthlySettings.recipientEmail
                      ? `${activeMonthlySettings.recipientEmail} • ${language === 'de' ? 'Tag' : language === 'en' ? 'Day' : 'Giorno'} ${activeMonthlySettings.sendDayOfMonth}`
                      : language === 'de'
                        ? 'E-Mail-Adresse festlegen, um die monatliche Übersicht zu erhalten'
                        : language === 'en'
                          ? 'Set email address to receive the monthly statement'
                          : 'Imposta indirizzo email per ricevere il riepilogo mensile'}
                  </p>
                  {activeMonthlySettings.lastProcessedMonthKey && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {language === 'de'
                        ? 'Letzter Auszug'
                        : language === 'en'
                          ? 'Last statement'
                          : 'Ultimo estratto'}
                      : {activeMonthlySettings.lastProcessedMonthKey}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenMonthlyStatement}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm active:scale-95 flex-shrink-0"
              >
                <span>{language === 'de' ? 'Öffnen' : language === 'en' ? 'Manage' : 'Gestisci'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SEZIONE ESPORTAZIONE & BACKUP */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
          {t?.exportBackupSection || 'Esportazione & Salva Dati'}
        </span>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
          {/* Guida Completa App (PDF) - IT / DE / EN & Trilingue */}
          <div className="px-4 py-3.5 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                const fn = generateCompleteGuidePdf(language);
                onShowToast(
                  language === 'de'
                    ? `Vollständige Anleitung heruntergeladen: ${fn}`
                    : language === 'en'
                      ? `Complete guide PDF downloaded: ${fn}`
                      : `Guida completa PDF scaricata: ${fn}`
                );
              }}
              className="w-full text-left text-xs font-medium text-slate-200 flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/25 transition">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-white block truncate">
                    {language === 'de'
                      ? 'Vollständige Funktionsanleitung (PDF)'
                      : language === 'en'
                        ? 'Complete App Feature Guide (PDF)'
                        : 'Guida Completa Funzioni App (PDF)'}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {language === 'de'
                      ? 'Alle 10 Module · IT, DE, EN oder dreisprachige Gesamtausgabe'
                      : language === 'en'
                        ? 'All 10 modules · Download in IT, DE, EN or combined trilingual PDF'
                        : 'Tutte le 10 aree · Scarica in IT, DE, EN o edizione trilingue'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-indigo-500/15 text-indigo-300 font-semibold px-2.5 py-1 rounded-lg border border-indigo-500/25 flex-shrink-0">
                PDF A4
              </span>
            </button>

            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              {(['it', 'de', 'en'] as const).map((gLang) => (
                <button
                  key={gLang}
                  type="button"
                  onClick={() => {
                    const fn = generateCompleteGuidePdf(gLang);
                    onShowToast(
                      language === 'de'
                        ? `PDF (${gLang.toUpperCase()}) geladen: ${fn}`
                        : language === 'en'
                          ? `PDF (${gLang.toUpperCase()}) downloaded: ${fn}`
                          : `Guida PDF (${gLang.toUpperCase()}) scaricata: ${fn}`
                    );
                  }}
                  className={`min-h-[34px] px-2 rounded-xl text-[11px] font-bold border transition active:scale-95 ${
                    language === gLang
                      ? 'bg-indigo-600/25 border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {gLang.toUpperCase()}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  const fn = generateTrilingualCompleteGuidePdf();
                  onShowToast(
                    language === 'de'
                      ? `Dreisprachige Anleitung geladen: ${fn}`
                      : language === 'en'
                        ? `Trilingual guide downloaded: ${fn}`
                        : `Guida trilingue scaricata: ${fn}`
                  );
                }}
                className="min-h-[34px] px-2 rounded-xl text-[10px] font-bold bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-200 transition active:scale-95 truncate"
                title="IT + DE + EN"
              >
                IT+DE+EN
              </button>
            </div>
          </div>

          {/* Report PDF Mensile */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="w-full px-4 py-3.5 text-left text-xs font-medium text-slate-200 flex items-center justify-between active:bg-slate-800 transition hover:bg-slate-850 group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500/20 transition">
                <FileDown className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white flex items-center gap-1.5">
                  {t?.monthlyReportBtn || 'Report PDF Mensile Riassuntivo'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {t?.monthlyReportDesc || 'Saldo totale, spese principali e avanzamento obiettivi'}
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-rose-500/15 text-rose-300 font-semibold px-2 py-0.5 rounded-full border border-rose-500/25 flex items-center gap-1">
              {currentMonthData.monthName}
            </span>
          </button>

          <button
            onClick={onExportJson}
            className="w-full px-4 py-3.5 text-left text-xs font-medium text-slate-200 flex items-center justify-between active:bg-slate-800 transition hover:bg-slate-850"
          >
            <span className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-emerald-400" /> {t?.exportJsonBtn || 'Esporta File Backup (.JSON)'}
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
              Download File
            </span>
          </button>

          <button
            onClick={onCopyBackupJson}
            className="w-full px-4 py-3.5 text-left text-xs font-medium text-slate-200 flex items-center justify-between active:bg-slate-800 transition hover:bg-slate-850"
          >
            <span className="flex items-center gap-2.5">
              <Copy className="w-4 h-4 text-indigo-400" /> {t?.copyBackupBtn || 'Copia Backup negli Appunti'}
            </span>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/20">
              1-Click
            </span>
          </button>

          <button
            onClick={onExportCsv}
            className="w-full px-4 py-3.5 text-left text-xs font-medium text-slate-200 flex items-center justify-between active:bg-slate-800 transition hover:bg-slate-850"
          >
            <span className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-teal-400" /> {t?.exportCsvBtn || 'Esporta Movimenti in Excel (.CSV)'}
            </span>
            <span className="text-[10px] text-slate-500">Excel / Sheets</span>
          </button>

          {/* Download File ZIP (myfinance_app.zip) - Soluzione anti-blocco */}
          <button
            onClick={handleDownloadZip}
            className="w-full px-4 py-3.5 text-left text-xs font-semibold text-white flex items-center justify-between active:bg-slate-800 transition hover:bg-slate-850 bg-gradient-to-r from-indigo-950/40 to-transparent"
          >
            <span className="flex items-center gap-2.5">
              <Archive className="w-4 h-4 text-indigo-400" /> {t?.downloadZipBtn || 'Scarica File ZIP (myfinance_app.zip)'}
            </span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
              {isZipping ? 'Download...' : t?.downloadZipBadge || 'Consigliato · 100% Offline'}
            </span>
          </button>

          <button
            onClick={() => {
              handleDownloadHtml();
              setIsHtmlModalOpen(true);
            }}
            className="w-full px-4 py-3.5 text-left text-xs font-medium text-slate-200 flex items-center justify-between active:bg-slate-800 transition hover:bg-slate-850"
          >
            <span className="flex items-center gap-2.5">
              <Code className="w-4 h-4 text-cyan-400" /> {t?.downloadHtmlBtn || 'Scarica Codice HTML (myfinance_app.html)'}
            </span>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-300 font-semibold px-2 py-0.5 rounded-full border border-cyan-500/20">
              {t?.downloadHtmlBadge || 'Download & Guida'}
            </span>
          </button>
        </div>
      </div>

      {/* 4. SEZIONE IMPORTAZIONE & RIPRISTINO BACKUP */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
          {t?.restoreSection || 'Ripristino Dati'}
        </span>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
          {onOpenCsvImport && (
            <button
              onClick={onOpenCsvImport}
              className="w-full px-4 py-3.5 text-left text-xs font-medium text-slate-200 flex items-center justify-between active:bg-slate-800 transition hover:bg-slate-850 bg-gradient-to-r from-emerald-950/35 to-transparent"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-white block truncate">
                    {language === 'de'
                      ? 'Kontoauszug importieren (CSV / Excel)'
                      : language === 'en'
                        ? 'Import Bank Statement (CSV / Excel)'
                        : 'Importa Estratto Conto (CSV / Excel)'}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {language === 'de'
                      ? 'Spaltenerkennung, Duplikat-Filter & Auto-Kategorien'
                      : language === 'en'
                        ? 'Column mapping, duplicate detection & auto-categories'
                        : 'Mappatura colonne, anti-duplicati e categorie automatiche'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/25 flex-shrink-0">
                CSV · XLS
              </span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-3.5 text-left text-xs font-medium text-slate-200 flex items-center justify-between active:bg-slate-800 transition hover:bg-slate-850"
          >
            <span className="flex items-center gap-2.5">
              <Upload className="w-4 h-4 text-amber-400" /> {t?.importJsonBtn || 'Ripristina da File Backup (.JSON)'}
            </span>
            <Upload className="w-4 h-4 text-slate-500" />
          </button>

          <button
            onClick={() => {
              setPasteError(null);
              setPasteText('');
              setIsPasteModalOpen(true);
            }}
            className="w-full px-4 py-3.5 text-left text-xs font-medium text-slate-200 flex items-center justify-between active:bg-slate-800 transition hover:bg-slate-850"
          >
            <span className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-cyan-400" /> {t?.pasteJsonBtn || 'Incolla Testo Backup JSON'}
            </span>
            <span className="text-[10px] text-slate-500">
              {language === 'de' ? 'Kopieren & Einfügen' : language === 'en' ? 'Copy & Paste' : 'Copia & Incolla'}
            </span>
          </button>
        </div>
      </div>


      {/* Hidden File Input with broad accept to work properly on Android / iOS */}
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*,.json,application/json,text/plain"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Info card */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <span>
          {t?.localStorageSecurityInfo || 'Tutti i dati sono salvati in sicurezza localmente sul tuo dispositivo tramite LocalStorage. I file di backup esportati contengono tutti i tuoi conti, movimenti, note, categorie e budget.'}
        </span>
      </div>

      {/* Privacy Policy (Google Play Store & GDPR) */}
      {onOpenPrivacyPolicy && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
            <span>
              {language === 'de'
                ? 'Rechtliches & Datenschutz'
                : language === 'en'
                  ? 'Legal & Privacy'
                  : 'Note Legali & Privacy'}
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              Google Play Ready
            </span>
          </span>
          <button
            type="button"
            onClick={onOpenPrivacyPolicy}
            className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 active:bg-slate-850 transition flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {language === 'de'
                    ? 'Datenschutzerklärung (Privacy Policy)'
                    : language === 'en'
                      ? 'Privacy Policy & Data Protection'
                      : 'Privacy Policy (Informativa Privacy)'}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {language === 'de'
                    ? 'Lokale Speicherung, volle Offline-Kontrolle & Play-Store-Link'
                    : language === 'en'
                      ? 'Local storage, offline privacy, permissions & Play Store URL'
                      : 'Dati locali, zero AI, permessi dispositivo e link per Play Store'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Copyright & Branding Footer */}
      <CopyrightFooter
        variant="card"
        className="mt-2"
        onOpenPrivacyPolicy={onOpenPrivacyPolicy}
      />

      {/* MODAL: Incolla Testo Backup JSON */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setIsPasteModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-cyan-400" /> {t?.pasteJsonBtn || 'Incolla Testo Backup JSON'}
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              {language === 'de'
                ? 'Fügen Sie hier den zuvor exportierten JSON-Code ein, um alle Buchungen und Konten sofort wiederherzustellen.'
                : language === 'en'
                  ? 'Paste your previously exported JSON backup here to restore all your transactions and accounts immediately.'
                  : "Incolla qui il codice JSON esportato in precedenza per ripristinare all'istante tutte le tue transazioni e conti."}
            </p>

            <form onSubmit={handlePasteSubmit} className="space-y-3 flex-1 flex flex-col">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder='{ "accounts": [...], "transactions": [...] }'
                rows={7}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-cyan-500 resize-none"
              />

              {pasteError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{pasteError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
                >
                  {t?.cancel || 'Annulla'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30"
                >
                  {language === 'de' ? 'Daten wiederherstellen' : language === 'en' ? 'Restore Data' : 'Ripristina Dati'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* MODAL: Report PDF Mensile Riassuntivo */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 shadow-2xl relative max-h-[92vh] flex flex-col">
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                <FileDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  {t?.monthlyReportModalTitle || 'Report PDF •'} {currentMonthData.monthName}
                </h3>
                <p className="text-xs text-slate-400">
                  {t?.monthlyReportModalSubtitle || 'Riepilogo saldo, spese principali e avanzamento obiettivi'}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* Saldo & Metriche Mese */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                    {t?.totalAccountsBalanceLabel || 'Saldo Totale Conti'}
                  </div>
                  <div className="text-sm font-bold text-white">
                    {formatCurrency(currentMonthData.totalBalance)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {accounts.length} {t?.activeAccountsCount || 'conti attivi'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                    {t?.monthlyNetSavingsLabel || 'Risparmio Netto Mese'}
                  </div>
                  <div
                    className={`text-sm font-bold ${
                      currentMonthData.netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {currentMonthData.netSavings >= 0 ? '+' : ''}
                    {formatCurrency(currentMonthData.netSavings)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {t?.savingsRatePercent || 'Tasso risparmio'}: {currentMonthData.savingsRate}%
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                  <div className="text-[10px] text-emerald-300 font-medium">
                    {t?.monthlyIncomeLabel || 'Entrate Mese'}
                  </div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">
                    +{formatCurrency(currentMonthData.income)}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/15">
                  <div className="text-[10px] text-rose-300 font-medium">
                    {t?.monthlyExpensesLabel || 'Uscite Mese'}
                  </div>
                  <div className="text-xs font-bold text-rose-400 mt-0.5">
                    -{formatCurrency(currentMonthData.expense)}
                  </div>
                </div>
              </div>

              {/* Spese Principali per Categoria */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> {t?.topExpensesByCategory || 'Spese Principali per Categoria'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {currentMonthData.topCategories.length} {t?.categoriesCount || 'categorie'}
                  </span>
                </div>

                {currentMonthData.topCategories.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-slate-500 text-xs">
                    {t?.noExpensesThisMonth || 'Nessuna spesa registrata per questo mese.'}
                  </div>
                ) : (
                  <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
                    {currentMonthData.topCategories.slice(0, 5).map((cat, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium truncate max-w-[170px]">
                            {idx + 1}. {getCategoryDisplayName(cat.category, language)}
                          </span>
                          <span className="font-semibold text-rose-300">
                            -{formatCurrency(cat.total)} ({cat.percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stato di Avanzamento Obiettivi di Risparmio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-400" /> {t?.savingsGoals || 'Obiettivi di Risparmio'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {goals.length} {t?.activeCount || 'attivi'}
                  </span>
                </div>

                {goals.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-slate-500 text-xs">
                    {t?.noGoalsConfigured || 'Nessun obiettivo di risparmio impostato.'}
                  </div>
                ) : (
                  <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
                    {goals.map((g) => {
                      const cur = Math.max(0, g.current || 0);
                      const tar = Math.max(1, g.target || 1);
                      const pct = Math.min(100, Math.round((cur / tar) * 100));
                      return (
                        <div key={g.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-200 font-medium truncate max-w-[180px]">
                              {g.title}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {formatCurrency(cur)} / {formatCurrency(tar)} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct >= 100 ? 'bg-emerald-400' : pct >= 50 ? 'bg-indigo-500' : 'bg-amber-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                {t?.cancel || 'Annulla'}
              </button>
              <button
                type="button"
                onClick={handlePrintMonthlyReport}
                className="py-3 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98"
              >
                <Printer className="w-4 h-4" />
                <span>{t?.printBtn || 'Stampa'}</span>
              </button>
              <button
                type="button"
                onClick={handleGeneratePdfReport}
                disabled={isGeneratingPdf}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
              >
                <FileDown className="w-4 h-4" />
                <span>{isGeneratingPdf ? (t?.generatingPdf || 'Generazione...') : (t?.downloadPdfA4 || 'Scarica PDF A4')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Come Scaricare il Codice HTML */}
      {isHtmlModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 shadow-2xl relative max-h-[92vh] flex flex-col">
            <button
              onClick={() => setIsHtmlModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  {language === 'de'
                    ? 'HTML-Code herunterladen'
                    : language === 'en'
                      ? 'How to Download Standalone HTML'
                      : 'Come Scaricare il Codice HTML'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'de'
                    ? 'Eigenständige HTML-Datei und Offline-Exportmethoden'
                    : language === 'en'
                      ? 'Standalone index.html source and browser export methods'
                      : 'File sorgente index.html e metodi di esportazione da browser'}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-3.5 overflow-y-auto pr-1 flex-1 text-xs">
              {/* Banner Successo Download / Suggerimento ZIP */}
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-2.5">
                <Archive className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-indigo-300">
                    {language === 'de'
                      ? 'ZIP-Paket empfohlen (verhindert Browser-Blockaden)'
                      : language === 'en'
                        ? 'ZIP Package Recommended (Prevents browser blocks)'
                        : 'Pacchetto ZIP Consigliato (evita blocchi del browser)'}
                  </div>
                  <div className="text-[11px] text-indigo-200/90 mt-0.5 leading-relaxed">
                    {language === 'de'
                      ? 'Laden Sie die ZIP-Datei "myfinance_app.zip" herunter. Einige Browser blockieren den direkten Download von .html-Dateien oder zeigen nur Text. Im ZIP ist "myfinance_app.html" sicher verpackt und startet sofort!'
                      : language === 'en'
                        ? 'Download "myfinance_app.zip". Some mobile browsers block direct .html downloads or show plain text. Inside the ZIP, "myfinance_app.html" is safely packaged and runs immediately!'
                        : 'Scarica il file "myfinance_app.zip". Molti browser bloccano il download diretto dei file .html o visualizzano solo testo. Nel file ZIP, "myfinance_app.html" è pronto e si apre all\'istante!'}
                  </div>
                </div>
              </div>

              {/* Istruzioni Dettagliate */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-0.5">
                  Come Usare il File HTML Standalone
                </span>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-mono">1</span>
                    <span>Download e Apertura con 1 Clic</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
                    Tocca <strong className="text-white">"Scarica File HTML"</strong> qui sotto per salvare <strong className="text-white">myfinance_app.html</strong>. Fai doppio clic sul file scaricato per avviarlo subito in Chrome, Edge, Safari o Firefox con tutti i grafici, i conti e i budget attivi.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-mono">2</span>
                    <span>Visualizza Sorgente dal Browser (PC & Smartphone)</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 pl-6 space-y-1 list-disc list-inside">
                    <li>
                      <strong className="text-slate-300">Da Computer (Chrome, Edge, Firefox, Safari):</strong> Fai clic con il tasto destro sulla pagina e seleziona <strong className="text-white">"Visualizza sorgente pagina"</strong>, oppure premi la combinazione rapida <kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700 font-mono text-[10px]">Ctrl + U</kbd> (su Mac: <kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700 font-mono text-[10px]">Cmd + Option + U</kbd>).
                    </li>
                    <li>
                      <strong className="text-slate-300">Da Smartphone Android (Chrome):</strong> Tocca la barra degli indirizzi in alto, inserisci il prefisso <code className="bg-slate-800 text-cyan-300 px-1 rounded font-mono text-[10px]">view-source:</code> davanti all'URL corrente e premi Invio.
                    </li>
                  </ul>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-mono">3</span>
                    <span>Salva Pagina Web Completa da Browser</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
                    Dal menu del browser (<strong className="text-slate-300">File &gt; Salva con nome</strong> o scorciatoia <kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700 font-mono text-[10px]">Ctrl + S</kbd>), scegli <strong className="text-white">"Solo HTML"</strong> o "Pagina web completa" per salvare l'HTML su disco.
                  </p>
                </div>
              </div>

              {/* Finestra Anteprima Codice */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-0.5">
                  <span className="flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-cyan-400" /> Anteprima Codice Sorgente (index.html)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyHtml}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20 transition active:scale-95"
                  >
                    {hasCopiedHtml ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-300">Copiato!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copia negli Appunti</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-[10px] text-slate-300 max-h-40 overflow-y-auto overflow-x-auto no-scrollbar selection:bg-cyan-500/30">
                  {indexHtmlCode}
                </pre>
              </div>
            </div>

            {/* Footer Azioni */}
            <div className="pt-3 border-t border-slate-800 mt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setIsHtmlModalOpen(false)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition order-last sm:order-first"
              >
                {t?.close || 'Chiudi'}
              </button>
              <button
                type="button"
                onClick={handleCopyHtml}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>
                  {hasCopiedHtml
                    ? language === 'de'
                      ? 'Kopiert!'
                      : language === 'en'
                        ? 'Copied!'
                        : 'Codice Copiato!'
                    : language === 'de'
                      ? 'Code kopieren'
                      : language === 'en'
                        ? 'Copy Code'
                        : 'Copia Codice'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadHtml('myfinance_app.html')}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-98"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>{language === 'de' ? '.HTML laden' : language === 'en' ? 'Download .HTML' : 'Scarica .HTML'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadHtml('index.html')}
                className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98"
                title="Scarica come index.html per convertitori HTML-to-APK"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>index.html (APK)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-98"
              >
                <Archive className="w-4 h-4 text-white" />
                <span>
                  {isZipping
                    ? language === 'de'
                      ? 'ZIP wird erstellt...'
                      : language === 'en'
                        ? 'Creating ZIP...'
                        : 'Creazione ZIP...'
                    : language === 'de'
                      ? 'ZIP herunterladen (Empfohlen)'
                      : language === 'en'
                        ? 'Download ZIP (Recommended)'
                        : 'Scarica File ZIP (Consigliato)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ricalcolo Saldo & Verifica Coerenza */}
      <BalanceReconcileModal
        isOpen={isReconcileModalOpen}
        onClose={() => setIsReconcileModalOpen(false)}
        accounts={accounts}
        transactions={transactions}
        categories={categories}
        onReconcileData={onReconcileData}
        onShowToast={onShowToast}
        language={language}
      />

      {/* MODAL: Backup Automatico Giornaliero */}
      <AutoBackupModal
        isOpen={isAutoBackupModalOpen}
        onClose={() => {
          setIsAutoBackupModalOpen(false);
          setAutoBackupSettings(getAutoBackupSettings());
        }}
        getBackupPayload={resolveBackupPayload}
        onRestoreJson={onImportJson}
        onShowToast={onShowToast}
        language={language}
        t={t}
      />

      {/* MODAL: Sicurezza & Blocco Accesso */}
      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onSettingsUpdated={(newSettings) => {
          if (onUpdateSecuritySettings) onUpdateSecuritySettings(newSettings);
        }}
        onLockNow={() => {
          setIsSecurityModalOpen(false);
          if (onLockNow) onLockNow();
        }}
        onShowToast={onShowToast}
        language={language}
        t={t}
      />

    </div>
  );
};
