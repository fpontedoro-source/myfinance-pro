import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, X, AlertCircle, Globe } from 'lucide-react';
import { Account, FxSettings } from '../types/finance';
import { Language, Translations } from '../utils/translations';
import { formatCurrency, getCurrencySymbol, getCurrencyCode } from '../utils/formatters';
import { DEFAULT_FX_SETTINGS, convertCurrencyAmount, getAccountCurrencyCode } from '../utils/currencyExchange';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  fxSettings?: FxSettings;
  initialFromAccount?: string;
  initialToAccount?: string;
  onTransfer: (data: {
    amount: number;
    fromAccount: string;
    toAccount: string;
    note: string;
    date: string;
  }) => void;
  language?: Language;
  t?: Translations;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  accounts,
  fxSettings = DEFAULT_FX_SETTINGS,
  initialFromAccount,
  initialToAccount,
  onTransfer,
  language = 'it',
  t,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [fromAccount, setFromAccount] = useState<string>(
    initialFromAccount || accounts[0]?.id || ''
  );
  const [toAccount, setToAccount] = useState<string>(
    initialToAccount || accounts[1]?.id || accounts[0]?.id || ''
  );
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFromAccount(initialFromAccount || accounts[0]?.id || '');
      setToAccount(initialToAccount || accounts[1]?.id || accounts[0]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setErrorMessage(null);
    } else {
      setAmount('');
      setNote('');
      setErrorMessage(null);
    }
  }, [isOpen, initialFromAccount, initialToAccount, accounts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage(
        t?.transferInvalidAmount ||
          (language === 'de'
            ? 'Bitte geben Sie einen gültigen Betrag größer als null ein.'
            : language === 'en'
              ? 'Please enter a valid amount greater than zero.'
              : 'Inserisci un importo valido maggiore di zero.')
      );
      return;
    }

    if (fromAccount === toAccount) {
      setErrorMessage(
        t?.transferSameAccountError ||
          (language === 'de'
            ? 'Bitte wählen Sie zwei unterschiedliche Konten aus (Quelle und Ziel).'
            : language === 'en'
              ? 'Please select two different accounts (source and destination).'
              : 'Seleziona due conti differenti (sorgente e destinazione).')
      );
      return;
    }

    setErrorMessage(null);
    onTransfer({
      amount: parsedAmount,
      fromAccount,
      toAccount,
      note: note.trim() || t?.transferDefaultNote || (language === 'de' ? 'Umbuchung' : language === 'en' ? 'Transfer' : 'Giroconto'),
      date: date || new Date().toISOString().split('T')[0],
    });
    setAmount('');
    setNote('');
    onClose();
  };

  const fromAccObj = accounts.find((a) => a.id === fromAccount || a.name === fromAccount);
  const toAccObj = accounts.find((a) => a.id === toAccount || a.name === toAccount);
  const fromSymbol = getCurrencySymbol(fromAccObj?.currency);
  const fromCode = getAccountCurrencyCode(fromAccount, accounts);
  const toCode = getAccountCurrencyCode(toAccount, accounts);
  const parsedPreviewAmount = parseFloat(amount.replace(',', '.'));
  const isCrossCurrency = fromCode !== toCode;
  const convertedPreview =
    isCrossCurrency && !isNaN(parsedPreviewAmount) && parsedPreviewAmount > 0
      ? convertCurrencyAmount(parsedPreviewAmount, fromCode, toCode, fxSettings.rates)
      : 0;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center no-print animate-fade-in">
      <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl relative animate-slide-up">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl transition hover:bg-slate-800"
          aria-label={t?.cancelBtn || 'Chiudi'}
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-indigo-400" /> {t?.transferModalTitle || 'Giroconto tra Conti'}
        </h3>

        {errorMessage && (
          <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-400">
                    {language === 'de' ? `Betrag (${fromSymbol})` : language === 'en' ? `Amount (${fromSymbol})` : `Importo (${fromSymbol})`}
                  </label>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {fromCode} ({fromSymbol})
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setErrorMessage(null);
                    }}
                    required
                    placeholder="0.00"
                    autoFocus
                    className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl pl-4 pr-10 py-2.5 font-bold text-lg focus:outline-none focus:border-indigo-500"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none">
                    {fromSymbol}
                  </div>
                </div>
                {isCrossCurrency && !isNaN(parsedPreviewAmount) && parsedPreviewAmount > 0 && (
                  <div className="mt-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-[11px] text-cyan-200 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 truncate">
                      <Globe className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span>
                        {language === 'de'
                          ? `Gutschrift (${toCode})`
                          : language === 'en'
                            ? `Credited (${toCode})`
                            : `Accredito (${toCode})`}
                      </span>
                    </span>
                    <strong className="tabular-nums text-cyan-300 flex-shrink-0">
                      ≈ {formatCurrency(convertedPreview, true, toCode)}
                    </strong>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t?.transferFromAccount || (language === 'de' ? 'Von Konto (Quelle)' : language === 'en' ? 'From Account (Source)' : 'Da Conto (Sorgente)')}
                </label>
                <select
                  value={fromAccount}
                  onChange={(e) => {
                    setFromAccount(e.target.value);
                    setErrorMessage(null);
                  }}
                  required
                  className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                >
                  {accounts.map((acc) => {
                    const sym = getCurrencySymbol(acc.currency);
                    const code = getCurrencyCode(acc.currency);
                    return (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({sym} {code})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t?.transferToAccount || (language === 'de' ? 'Auf Konto (Ziel)' : language === 'en' ? 'To Account (Destination)' : 'A Conto (Destinazione)')}
                </label>
                <select
                  value={toAccount}
                  onChange={(e) => {
                    setToAccount(e.target.value);
                    setErrorMessage(null);
                  }}
                  required
                  className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                >
                  {accounts.map((acc) => {
                    const sym = getCurrencySymbol(acc.currency);
                    const code = getCurrencyCode(acc.currency);
                    return (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({sym} {code})
                      </option>
                    );
                  })}
                </select>
              </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {t?.transferReasonLabel || (language === 'de' ? 'Verwendungszweck / Notiz' : language === 'en' ? 'Reason / Notes' : 'Causale / Note')}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                t?.transferReasonPlaceholder ||
                (language === 'de'
                  ? 'z. B. Monatliches Sparen, Übertrag...'
                  : language === 'en'
                    ? 'e.g. Monthly savings, top-up...'
                    : 'es. Risparmio mensile, ricarica...')
              }
              className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {t?.transferDateLabel || (language === 'de' ? 'Datum' : language === 'en' ? 'Date' : 'Data')}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-semibold transition hover:bg-slate-750"
            >
              {t?.cancelBtn || (language === 'de' ? 'Abbrechen' : language === 'en' ? 'Cancel' : 'Annulla')}
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 rounded-xl text-xs font-semibold shadow-lg transition"
            >
              {t?.transferVerifyBtn || (language === 'de' ? 'Prüfen & Ausführen' : language === 'en' ? 'Verify & Execute' : 'Verifica & Esegui')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
