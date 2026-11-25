import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Mail,
  Calendar,
  Download,
  Send,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Sparkles,
  Globe,
  Clock,
} from 'lucide-react';
import { Account, Goal, Transaction } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { SecuritySettings } from '../utils/security';
import { Language } from '../utils/translations';
import {
  MonthlyEmailSettings,
  MonthlyStatementEntry,
  getMonthlyEmailSettings,
  saveMonthlyEmailSettings,
  getMonthlyStatementHistory,
  deleteMonthlyStatementEntry,
  getAvailableMonthKeys,
  getPreviousMonthKey,
  getCurrentMonthKey,
  formatMonthKeyLabel,
  computeMonthlyCurrencyTotals,
  buildMonthlyStatementPackage,
  sendMonthlyStatementPdfByEmail,
  triggerBlobDownload,
  GOOGLE_APPS_SCRIPT_PDF_EMAIL_TEMPLATE,
} from '../utils/monthlyEmailStatement';

interface MonthlyStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  balances: Record<string, number>;
  transactions: Transaction[];
  goals: Goal[];
  securitySettings?: SecuritySettings;
  onShowToast: (msg: string) => void;
  onSettingsUpdated?: (newSettings: MonthlyEmailSettings) => void;
  language?: Language;
  initialMonthKey?: string;
}

export const MonthlyStatementModal: React.FC<MonthlyStatementModalProps> = ({
  isOpen,
  onClose,
  accounts,
  balances,
  transactions,
  goals,
  securitySettings,
  onShowToast,
  onSettingsUpdated,
  language = 'it',
  initialMonthKey,
}) => {
  const isDe = language === 'de';
  const isEn = language === 'en';

  const [settings, setSettings] = useState<MonthlyEmailSettings>(getMonthlyEmailSettings);
  const [history, setHistory] = useState<MonthlyStatementEntry[]>(getMonthlyStatementHistory);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => initialMonthKey || getCurrentMonthKey());
  const [isBusy, setIsBusy] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'config' | 'history'>('preview');
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const availableMonths = useMemo(() => getAvailableMonthKeys(transactions), [transactions]);

  useEffect(() => {
    if (isOpen) {
      const loaded = getMonthlyEmailSettings();
      const profileEmail = (securitySettings?.email || securitySettings?.recoveryEmail || '').trim().toLowerCase();
      const merged: MonthlyEmailSettings = {
        ...loaded,
        recipientEmail: loaded.recipientEmail || profileEmail,
      };
      setSettings(merged);
      setHistory(getMonthlyStatementHistory());
      setStatusFeedback(null);
      if (initialMonthKey) {
        setSelectedMonthKey(initialMonthKey);
      }
    }
  }, [isOpen, securitySettings?.email, securitySettings?.recoveryEmail, initialMonthKey]);

  const holderName = useMemo(
    () => [securitySettings?.firstName, securitySettings?.lastName].filter(Boolean).join(' '),
    [securitySettings?.firstName, securitySettings?.lastName]
  );

  const previewSummary = useMemo(
    () => computeMonthlyCurrencyTotals(selectedMonthKey, accounts, balances, transactions),
    [selectedMonthKey, accounts, balances, transactions]
  );

  const [preparedMailto, setPreparedMailto] = useState<string>('');
  const [preparedText, setPreparedText] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    buildMonthlyStatementPackage({
      monthKey: selectedMonthKey,
      accounts,
      balances,
      transactions,
      goals,
      recipientEmail: settings.recipientEmail,
      holderName,
      language,
    })
      .then((pkg) => {
        if (!cancelled) {
          setPreparedMailto(pkg.mailtoUrl);
          setPreparedText(pkg.summaryText);
        }
      })
      .catch((err) => console.warn('Preview statement error:', err));
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedMonthKey, accounts, balances, transactions, goals, settings.recipientEmail, holderName, language]);

  if (!isOpen) return null;

  const persistSettings = (next: MonthlyEmailSettings) => {
    setSettings(next);
    saveMonthlyEmailSettings(next);
    if (onSettingsUpdated) onSettingsUpdated(next);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedEmail = settings.recipientEmail.trim().toLowerCase();
    if (settings.enabled && (!cleanedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail))) {
      setStatusFeedback({
        type: 'err',
        text: isDe
          ? 'Bitte eine gültige Empfänger-E-Mail-Adresse eingeben.'
          : isEn
            ? 'Please enter a valid recipient email address.'
            : 'Inserisci un indirizzo email destinatario valido.',
      });
      return;
    }

    const updated: MonthlyEmailSettings = {
      ...settings,
      recipientEmail: cleanedEmail,
    };
    persistSettings(updated);
    setStatusFeedback({
      type: 'ok',
      text: isDe
        ? 'Einstellungen für den monatlichen Kontoauszug gespeichert!'
        : isEn
          ? 'Monthly email statement settings saved!'
          : 'Impostazioni estratto conto mensile salvate con successo!',
    });
    onShowToast(
      isDe
        ? 'Einstellungen gespeichert!'
        : isEn
          ? 'Settings saved!'
          : 'Impostazioni estratto conto salvate!'
    );
  };

  const handleDownloadPdfOnly = async () => {
    setIsBusy(true);
    setStatusFeedback(null);
    try {
      const pkg = await buildMonthlyStatementPackage({
        monthKey: selectedMonthKey,
        accounts,
        balances,
        transactions,
        goals,
        recipientEmail: settings.recipientEmail,
        holderName,
        language,
      });
      triggerBlobDownload(pkg.pdfBlob, pkg.pdfFileName);
      onShowToast(
        isDe
          ? `PDF ${pkg.pdfFileName} heruntergeladen!`
          : isEn
            ? `PDF ${pkg.pdfFileName} downloaded!`
            : `PDF ${pkg.pdfFileName} scaricato!`
      );
    } catch (err) {
      console.error(err);
      onShowToast(
        isDe ? 'Fehler bei der PDF-Erstellung.' : isEn ? 'Error generating PDF.' : 'Errore generazione PDF.'
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleShareWithPdf = async () => {
    setIsBusy(true);
    setStatusFeedback(null);
    try {
      const pkg = await buildMonthlyStatementPackage({
        monthKey: selectedMonthKey,
        accounts,
        balances,
        transactions,
        goals,
        recipientEmail: settings.recipientEmail,
        holderName,
        language,
      });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pkg.pdfFile] })) {
        await navigator.share({
          title: pkg.subject,
          text: pkg.summaryText,
          files: [pkg.pdfFile],
        });
        onShowToast(
          isDe
            ? 'PDF-Kontoauszug geteilt!'
            : isEn
              ? 'PDF statement shared!'
              : 'Estratto conto PDF condiviso!'
        );
      } else {
        triggerBlobDownload(pkg.pdfBlob, pkg.pdfFileName);
        setStatusFeedback({
          type: 'ok',
          text: isDe
            ? `PDF (${pkg.pdfFileName}) heruntergeladen. Nutzen Sie „Per E-Mail senden“, um Ihre Mail-App zu öffnen.`
            : isEn
              ? `PDF (${pkg.pdfFileName}) downloaded. Use "Send via Email" to open your mail app.`
              : `PDF (${pkg.pdfFileName}) scaricato! Usa "Invia via Email" qui sotto per aprire la tua app mail e allegarlo.`,
        });
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('Share failed:', err);
        onShowToast(
          isDe
            ? 'Teilen in diesem Browser nicht verfügbar.'
            : isEn
              ? 'Sharing not supported on this browser.'
              : 'Condivisione non completata su questo browser.'
        );
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopyText = async () => {
    if (!preparedText) return;
    try {
      await navigator.clipboard.writeText(preparedText);
      setCopiedText(true);
      onShowToast(
        isDe
          ? 'Kontoauszugstext kopiert!'
          : isEn
            ? 'Statement summary copied!'
            : 'Testo estratto conto copiato!'
      );
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      onShowToast(
        isDe
          ? 'Kopieren in Zwischenablage fehlgeschlagen.'
          : isEn
            ? 'Unable to copy to clipboard.'
            : 'Impossibile copiare negli appunti.'
      );
    }
  };

  const handleDispatchNow = async () => {
    const email = settings.recipientEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setActiveTab('config');
      setStatusFeedback({
        type: 'err',
        text: isDe
          ? 'Bitte geben Sie zuerst Ihre E-Mail-Adresse ein.'
          : isEn
            ? 'Please enter your recipient email address first.'
            : 'Inserisci prima un indirizzo email valido nella configurazione.',
      });
      return;
    }

    setIsBusy(true);
    setStatusFeedback(null);
    try {
      const res = await sendMonthlyStatementPdfByEmail({
        monthKey: selectedMonthKey,
        accounts,
        balances,
        transactions,
        goals,
        settings,
        securitySettings,
        language,
      });
      setSettings(res.updatedSettings);
      if (onSettingsUpdated) onSettingsUpdated(res.updatedSettings);
      setHistory(getMonthlyStatementHistory());
      setStatusFeedback({
        type: 'ok',
        text: res.message,
      });
      onShowToast(
        res.mode === 'webhook'
          ? isDe
            ? 'PDF automatisch per E-Mail gesendet!'
            : isEn
              ? 'PDF sent automatically via email!'
              : 'PDF inviato automaticamente via Email!'
          : res.mode === 'native_share_pdf'
            ? isDe
              ? 'PDF-Versand per E-Mail gestartet!'
              : isEn
                ? 'PDF email share started!'
                : 'Condivisione PDF via Email avviata!'
            : isDe
              ? `PDF "${res.pdfFileName}" bereit & E-Mail geöffnet!`
              : isEn
                ? `PDF "${res.pdfFileName}" ready & email opened!`
                : `PDF "${res.pdfFileName}" pronto e Email aperta!`
      );
    } catch (err) {
      console.error(err);
      setStatusFeedback({
        type: 'err',
        text: isDe
          ? 'Fehler beim Erstellen oder Senden des PDFs.'
          : isEn
            ? 'Error generating or sending PDF.'
            : 'Errore durante la generazione o l\'invio del PDF.',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopyAppsScript = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_PDF_EMAIL_TEMPLATE);
      setCopiedScript(true);
      onShowToast(
        isDe
          ? 'Gmail-Skript in die Zwischenablage kopiert!'
          : isEn
            ? 'Gmail script copied to clipboard!'
            : 'Script Gmail copiato negli appunti!'
      );
      setTimeout(() => setCopiedScript(false), 2000);
    } catch {
      onShowToast(
        isDe
          ? 'Skript konnte nicht kopiert werden.'
          : isEn
            ? 'Unable to copy script.'
            : 'Impossibile copiare lo script.'
      );
    }
  };

  const handleDeleteEntry = (id: string) => {
    const next = deleteMonthlyStatementEntry(id);
    setHistory(next);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl transition hover:bg-slate-800"
          aria-label={isDe ? 'Schließen' : isEn ? 'Close' : 'Chiudi'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-3 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/30">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              {isDe
                ? 'Monatlicher E-Mail-Kontoauszug'
                : isEn
                  ? 'Automatic Monthly Email Statement'
                  : 'Estratto Conto Mensile per Email'}
            </h3>
            <p className="text-xs text-slate-400">
              {isDe
                ? 'Automatischer PDF- & Multi-Währungsbericht'
                : isEn
                  ? 'Automatic PDF & multi-currency monthly report'
                  : 'Invio e preparazione automatica PDF mensile multi-valuta'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-3 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'preview' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isDe ? 'Vorschau' : isEn ? 'Statement' : 'Estratto'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'config' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isDe ? 'Planung' : isEn ? 'Schedule' : 'Automatico'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'history' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isDe ? 'Verlauf' : isEn ? 'History' : 'Storico'} ({history.length})
            </span>
          </button>
        </div>

        {/* Feedback banner */}
        {statusFeedback && (
          <div
            className={`mb-3 p-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${
              statusFeedback.type === 'ok'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
            }`}
          >
            {statusFeedback.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <span className="leading-snug">{statusFeedback.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-0.5 text-xs">
          {activeTab === 'preview' && (
            <div className="space-y-3">
              {/* Month selector & Recipient info */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isDe ? 'Monat auswählen:' : isEn ? 'Select month:' : 'Mese di riferimento:'}</span>
                  </label>
                  <select
                    value={selectedMonthKey}
                    onChange={(e) => setSelectedMonthKey(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    {availableMonths.map((mk) => (
                      <option key={mk} value={mk}>
                        {formatMonthKeyLabel(mk, language)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">
                    {isDe ? 'Empfänger:' : isEn ? 'Recipient:' : 'Destinatario:'}
                  </span>
                  <span className="font-semibold text-cyan-300 truncate max-w-[230px]">
                    {settings.recipientEmail || (
                      <button
                        type="button"
                        onClick={() => setActiveTab('config')}
                        className="text-amber-300 underline"
                      >
                        Imposta email
                      </button>
                    )}
                  </span>
                </div>
              </div>

              {/* Multi-currency summary cards */}
              <div className="space-y-2">
                {Object.entries(previewSummary.totalsByCurrency).map(([code, stats]) => (
                  <div
                    key={code}
                    className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider">
                        {isDe ? 'Währung' : isEn ? 'Currency' : 'Valuta'}: {code}
                      </span>
                      <span className="text-[11px] font-bold text-slate-300">
                        {isDe ? 'Aktueller Saldo' : isEn ? 'Balance' : 'Saldo Conti'}:{' '}
                        <span className={stats.balance >= 0 ? 'text-white' : 'text-rose-400'}>
                          {formatCurrency(stats.balance, true, code)}
                        </span>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">
                          {isDe ? 'Einnahmen' : isEn ? 'Income' : 'Entrate'}
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          +{formatCurrency(stats.income, true, code)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">
                          {isDe ? 'Ausgaben' : isEn ? 'Expenses' : 'Uscite'}
                        </span>
                        <span className="text-xs font-bold text-rose-400">
                          -{formatCurrency(stats.expense, true, code)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">
                          {isDe ? 'Netto' : isEn ? 'Net' : 'Netto'}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            stats.net >= 0 ? 'text-cyan-300' : 'text-rose-400'
                          }`}
                        >
                          {stats.net >= 0 ? '+' : ''}
                          {formatCurrency(stats.net, true, code)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleDispatchNow}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-98 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isBusy
                      ? isDe
                        ? 'PDF wird erstellt...'
                        : isEn
                          ? 'Preparing PDF...'
                          : 'Generazione PDF...'
                      : isDe
                        ? 'Kontoauszug als PDF per E-Mail senden'
                        : isEn
                          ? 'Send Monthly Statement PDF via Email'
                          : 'Invia Estratto Conto PDF via Email'}
                  </span>
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={handleDownloadPdfOnly}
                    className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-400" />
                    <span>Scarica PDF</span>
                  </button>
                  {settings.recipientEmail && preparedMailto ? (
                    <a
                      href={preparedMailto}
                      className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition"
                    >
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isDe ? 'Mail-App' : isEn ? 'Email App' : 'App Email'}</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={handleShareWithPdf}
                      className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition"
                    >
                      <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isDe ? 'Teilen' : isEn ? 'Share PDF' : 'Condividi'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>{copiedText ? 'Copiato' : isDe ? 'Text' : isEn ? 'Copy' : 'Copia'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <form onSubmit={handleSaveConfig} className="space-y-3">
              {/* Auto Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">
                      {isDe
                        ? 'Automatischer Monatsauszug aktiv'
                        : isEn
                          ? 'Automatic Monthly Statement'
                          : 'Invio Automatico Mensile'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {isDe
                        ? 'Erstellt am Monatsanfang automatisch den Auszug für den Vormonat'
                        : isEn
                          ? 'Prepares the previous month statement automatically each month'
                          : 'Prepara automaticamente all\'avvio ogni mese l\'estratto del mese precedente'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, enabled: !s.enabled }))}
                  className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center flex-shrink-0 ${
                    settings.enabled ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Recipient Email */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {isDe ? 'Empfänger-E-Mail-Adresse' : isEn ? 'Recipient Email Address' : 'Email Destinatario Estratto Conto'}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={settings.recipientEmail}
                      onChange={(e) => setSettings((s) => ({ ...s, recipientEmail: e.target.value }))}
                      placeholder="es. nome@gmail.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {isDe ? 'Tag des Monats' : isEn ? 'Day of Month (1-28)' : 'Giorno invio mensile (1-28)'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={settings.sendDayOfMonth}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          sendDayOfMonth: Math.max(1, Math.min(28, Number(e.target.value) || 1)),
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                      <span className="text-[11px] font-medium text-slate-200">
                        {isDe ? 'Auto-PDF Download' : isEn ? 'Auto-download PDF' : 'Scarica PDF auto'}
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.autoDownloadPdf}
                        onChange={(e) => setSettings((s) => ({ ...s, autoDownloadPdf: e.target.checked }))}
                        className="accent-indigo-500 w-4 h-4"
                      />
                    </label>
                  </div>
                </div>

                {/* Optional HTTPS Webhook */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-cyan-400" />
                    <span>
                      {isDe
                        ? 'HTTPS Webhook URL (optional für automatischen Mail-Versand)'
                        : isEn
                          ? 'HTTPS Webhook URL (optional background email)'
                          : 'Webhook Email HTTPS (Opzionale per invio automatico silenzioso)'}
                    </span>
                  </label>
                  <input
                    type="url"
                    value={settings.webhookUrl || ''}
                    onChange={(e) => setSettings((s) => ({ ...s, webhookUrl: e.target.value }))}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1 leading-snug">
                    Senza webhook, l&apos;app genera il PDF A4 ogni mese e lo condivide/allega direttamente tramite la tua app Email. Con un Webhook Google Apps Script gratuito, il PDF viene spedito automaticamente nella tua Gmail in background!
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowWebhookGuide(!showWebhookGuide)}
                    className="mt-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold underline"
                  >
                    {showWebhookGuide ? 'Nascondi guida Gmail automatica' : 'Mostra codice Google Apps Script gratuito (invio PDF automatico Gmail)'}
                  </button>
                  {showWebhookGuide && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-300">script.google.com → Distribuisci App Web</span>
                        <button
                          type="button"
                          onClick={handleCopyAppsScript}
                          className="px-2 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1"
                        >
                          {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedScript ? 'Copiato' : 'Copia Codice'}</span>
                        </button>
                      </div>
                      <pre className="text-[9px] text-slate-300 font-mono overflow-x-auto leading-snug">
                        {GOOGLE_APPS_SCRIPT_PDF_EMAIL_TEMPLATE}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition"
              >
                {isDe ? 'Konfiguration speichern' : isEn ? 'Save Schedule Settings' : 'Salva Programmazione Mensile'}
              </button>
            </form>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-xs space-y-1.5">
                  <Mail className="w-6 h-6 mx-auto text-slate-600" />
                  <p>
                    {isDe
                      ? 'Noch kein monatlicher Kontoauszug erstellt.'
                      : isEn
                        ? 'No monthly statements generated yet.'
                        : 'Nessun estratto conto mensile ancora generato.'}
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{item.monthLabel}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              item.status === 'sent_webhook'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                            }`}
                          >
                            {item.status === 'sent_webhook' ? 'Inviato Webhook' : 'Preparato'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {item.recipientEmail} • {item.transactionsCount} movimenti
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {item.mailtoUrl && (
                          <a
                            href={item.mailtoUrl}
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30"
                            title="Invia via Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(item.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800"
                          title="Elimina voce"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {Object.entries(item.totalsByCurrency).map(([code, st]) => (
                        <span
                          key={code}
                          className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono"
                        >
                          {code}: {st.net >= 0 ? '+' : ''}
                          {formatCurrency(st.net, true, code)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 mt-3 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            {settings.lastProcessedMonthKey
              ? `Ultimo mese elaborato: ${settings.lastProcessedMonthKey}`
              : 'Pronto per programmazione mensile'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            {isDe ? 'Schließen' : isEn ? 'Close' : 'Chiudi'}
          </button>
        </div>
      </div>
    </div>
  );
};
