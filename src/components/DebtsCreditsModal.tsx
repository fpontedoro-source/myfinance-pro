import React, { useEffect, useState } from 'react';
import {
  X,
  Users,
  CreditCard,
  HandCoins,
  AlertTriangle,
  Calendar,
  FileText,
  Layers,
} from 'lucide-react';
import {
  Account,
  CurrencyCode,
  DebtCreditDirection,
  DebtCreditEntry,
  DebtCreditSubtype,
} from '../types/finance';
import { SUPPORTED_CURRENCIES } from '../utils/formatters';
import { Language } from '../utils/translations';

interface DebtsCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEntry: DebtCreditEntry | null;
  accounts: Account[];
  defaultCurrency?: CurrencyCode;
  onSave: (entry: DebtCreditEntry) => void;
  language?: Language;
}

export const DebtsCreditsModal: React.FC<DebtsCreditsModalProps> = ({
  isOpen,
  onClose,
  editingEntry,
  accounts,
  defaultCurrency = 'EUR',
  onSave,
  language = 'it',
}) => {
  const isDe = language === 'de';
  const isEn = language === 'en';

  const [direction, setDirection] = useState<DebtCreditDirection>('CREDIT');
  const [subtype, setSubtype] = useState<DebtCreditSubtype>('SHARED_EXPENSE');
  const [title, setTitle] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [remainingTouched, setRemainingTouched] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [paidInstallments, setPaidInstallments] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [account, setAccount] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    if (editingEntry) {
      setDirection(editingEntry.direction);
      setSubtype(editingEntry.subtype);
      setTitle(editingEntry.title);
      setCounterparty(editingEntry.counterparty);
      setTotalAmount(String(editingEntry.totalAmount));
      setRemainingAmount(String(editingEntry.remainingAmount));
      setRemainingTouched(true);
      setCurrency((editingEntry.currency as CurrencyCode) || defaultCurrency);
      setMonthlyInstallment(
        editingEntry.monthlyInstallment ? String(editingEntry.monthlyInstallment) : ''
      );
      setTotalInstallments(
        editingEntry.totalInstallments ? String(editingEntry.totalInstallments) : ''
      );
      setPaidInstallments(
        editingEntry.paidInstallments !== undefined ? String(editingEntry.paidInstallments) : ''
      );
      setDueDate(editingEntry.dueDate || '');
      setAccount(editingEntry.account || accounts[0]?.id || '');
      setNotes(editingEntry.notes || '');
    } else {
      setDirection('CREDIT');
      setSubtype('SHARED_EXPENSE');
      setTitle('');
      setCounterparty('');
      setTotalAmount('');
      setRemainingAmount('');
      setRemainingTouched(false);
      setCurrency(defaultCurrency);
      setMonthlyInstallment('');
      setTotalInstallments('');
      setPaidInstallments('');
      setDueDate('');
      setAccount(accounts[0]?.id || '');
      setNotes('');
    }
  }, [isOpen, editingEntry, accounts, defaultCurrency]);

  if (!isOpen) return null;

  const handleTotalChange = (val: string) => {
    setTotalAmount(val);
    if (!remainingTouched && !editingEntry) {
      setRemainingAmount(val);
    }
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTotal = parseFloat(totalAmount.replace(',', '.'));
    const parsedRemaining =
      remainingAmount.trim() === ''
        ? parsedTotal
        : parseFloat(remainingAmount.replace(',', '.'));

    if (!title.trim()) {
      setErrorMsg(
        isDe
          ? 'Bitte einen Titel eingeben.'
          : isEn
            ? 'Please enter a title.'
            : 'Inserisci una descrizione o titolo.'
      );
      return;
    }

    if (!counterparty.trim()) {
      setErrorMsg(
        isDe
          ? 'Bitte Name der Person / Bank eingeben.'
          : isEn
            ? 'Please enter person or institution name.'
            : 'Inserisci il nome della persona, collega o istituto.'
      );
      return;
    }

    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      setErrorMsg(
        isDe
          ? 'Gesamtbetrag muss größer als 0 sein.'
          : isEn
            ? 'Total amount must be greater than 0.'
            : 'L’importo totale deve essere maggiore di zero.'
      );
      return;
    }

    if (isNaN(parsedRemaining) || parsedRemaining < 0) {
      setErrorMsg(
        isDe
          ? 'Restbetrag darf nicht negativ sein.'
          : isEn
            ? 'Remaining amount cannot be negative.'
            : 'L’importo residuo non può essere negativo.'
      );
      return;
    }

    const parsedInstAmount = monthlyInstallment
      ? parseFloat(monthlyInstallment.replace(',', '.'))
      : undefined;
    const parsedTotalInst = totalInstallments ? parseInt(totalInstallments, 10) : undefined;
    const parsedPaidInst = paidInstallments ? parseInt(paidInstallments, 10) : undefined;

    const cleanRemaining = Math.round(Math.min(parsedRemaining, parsedTotal * 2) * 100) / 100;

    const entry: DebtCreditEntry = {
      id: editingEntry?.id || `dc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      counterparty: counterparty.trim(),
      direction,
      subtype,
      totalAmount: Math.round(parsedTotal * 100) / 100,
      remainingAmount: cleanRemaining,
      currency,
      monthlyInstallment:
        parsedInstAmount && !isNaN(parsedInstAmount) && parsedInstAmount > 0
          ? Math.round(parsedInstAmount * 100) / 100
          : undefined,
      totalInstallments:
        parsedTotalInst && !isNaN(parsedTotalInst) && parsedTotalInst > 0
          ? parsedTotalInst
          : undefined,
      paidInstallments:
        parsedPaidInst !== undefined && !isNaN(parsedPaidInst) && parsedPaidInst >= 0
          ? parsedPaidInst
          : undefined,
      dueDate: dueDate || undefined,
      account: account || undefined,
      notes: notes.trim() || undefined,
      status: cleanRemaining <= 0.005 ? 'SETTLED' : 'OPEN',
      createdAt: editingEntry?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    onSave(entry);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-100/90 dark:bg-slate-950/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 no-print">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto no-scrollbar animate-slide-up">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label={isDe ? 'Schließen' : isEn ? 'Close' : 'Chiudi'}
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-slate-900 dark:text-white pr-10 mb-1 flex items-center gap-2">
          <HandCoins className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <span>
            {editingEntry
              ? isDe
                ? 'Eintrag bearbeiten'
                : isEn
                  ? 'Edit Debt / Credit'
                  : 'Modifica Debito / Credito'
              : isDe
                ? 'Neuer Kredit / Schuld / Rate'
                : isEn
                  ? 'New Debt, Rate or Credit'
                  : 'Nuovo Debito, Rata o Credito'}
          </span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {isDe
            ? 'Erfasst offene Forderungen, Ratenpläne oder Auslagen für Freunde.'
            : isEn
              ? 'Track loans, monthly installments, or shared expenses owed to you.'
              : 'Traccia prestiti, piani a rate o soldi anticipati ad amici e colleghi.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Direction Selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setDirection('CREDIT');
                if (subtype === 'INSTALLMENT') setSubtype('SHARED_EXPENSE');
              }}
              className={`min-h-[44px] rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                direction === 'CREDIT'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>
                {isDe ? 'Forderung (+)' : isEn ? 'Receivable (+)' : 'Credito da incassare'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDirection('DEBT');
                if (subtype === 'SHARED_EXPENSE') setSubtype('INSTALLMENT');
              }}
              className={`min-h-[44px] rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                direction === 'DEBT'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>
                {isDe ? 'Schuld / Rate (-)' : isEn ? 'Debt / Rate (-)' : 'Debito / Rata'}
              </span>
            </button>
          </div>

          {/* Subtype Switcher */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              {isDe ? 'Kategorie' : isEn ? 'Category Type' : 'Tipologia'}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  {
                    id: 'SHARED_EXPENSE',
                    label: isDe ? 'Geteilt' : isEn ? 'Shared' : 'Condivisa',
                  },
                  {
                    id: 'INSTALLMENT',
                    label: isDe ? 'Ratenplan' : isEn ? 'Installments' : 'A Rate',
                  },
                  {
                    id: 'LOAN',
                    label: isDe ? 'Darlehen' : isEn ? 'Loan' : 'Prestito',
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSubtype(item.id)}
                  className={`min-h-[40px] px-2 rounded-xl border font-semibold transition ${
                    subtype === item.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Counterparty */}
          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {isDe ? 'Bezeichnung *' : isEn ? 'Title / Description *' : 'Descrizione *'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder={
                  direction === 'CREDIT'
                    ? isDe
                      ? 'z. B. Abendessen / Urlaubsauslage'
                      : isEn
                        ? 'e.g. Dinner split / Concert tickets'
                        : 'es. Cena anticipata / Biglietti concerto'
                    : isDe
                      ? 'z. B. Autokredit / Smartphone-Rate'
                      : isEn
                        ? 'e.g. Car loan / Laptop 12x'
                        : 'es. Finanziamento auto / Rate TV'
                }
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {direction === 'CREDIT'
                  ? isDe
                    ? 'Schuldet mir (Name) *'
                    : isEn
                      ? 'Owed by (Friend / Colleague) *'
                      : 'Chi ti deve i soldi (Amico / Collega) *'
                  : isDe
                    ? 'Gläubiger (Person / Bank) *'
                    : isEn
                      ? 'Owed to (Person / Lender) *'
                      : 'Verso chi (Persona / Finanziaria) *'}
              </label>
              <input
                type="text"
                value={counterparty}
                onChange={(e) => {
                  setCounterparty(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder={
                  direction === 'CREDIT' ? 'Marco Rossi' : 'Findomestic / Luca B.'
                }
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Amounts & Currency */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {isDe ? 'Gesamt *' : isEn ? 'Total *' : 'Totale *'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={totalAmount}
                onChange={(e) => handleTotalChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-bold tabular-nums focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {isDe ? 'Offen *' : isEn ? 'Remaining *' : 'Residuo *'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={remainingAmount}
                onChange={(e) => {
                  setRemainingAmount(e.target.value);
                  setRemainingTouched(true);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-bold tabular-nums focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {isDe ? 'Währung' : isEn ? 'Currency' : 'Valuta'}
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2.5 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Installments Details (shown when subtype is INSTALLMENT or values exist) */}
          {(subtype === 'INSTALLMENT' || monthlyInstallment || totalInstallments) && (
            <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {isDe
                    ? 'Ratenplan (optional)'
                    : isEn
                      ? 'Installment Schedule (optional)'
                      : 'Dettaglio Rate (opzionale)'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                    {isDe ? 'Rate/Monat' : isEn ? 'Monthly' : 'Importo Rata'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={monthlyInstallment}
                    onChange={(e) => setMonthlyInstallment(e.target.value)}
                    placeholder="35"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white tabular-nums focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                    {isDe ? 'Bezahlt' : isEn ? 'Paid #' : 'Rate pagate'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={paidInstallments}
                    onChange={(e) => setPaidInstallments(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white tabular-nums focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                    {isDe ? 'Gesamt #' : isEn ? 'Total #' : 'Rate totali'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    placeholder="12"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white tabular-nums focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Due Date & Linked Account */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{isDe ? 'Fälligkeit' : isEn ? 'Due Date' : 'Scadenza'}</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {isDe ? 'Standardkonto' : isEn ? 'Default Account' : 'Conto collegato'}
              </label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency || 'EUR'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>{isDe ? 'Notizen' : isEn ? 'Notes' : 'Note'}</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isDe
                  ? 'Optionale Hinweise...'
                  : isEn
                    ? 'Optional details...'
                    : 'Dettagli aggiuntivi opzionali...'
              }
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-semibold transition"
            >
              {isDe ? 'Abbrechen' : isEn ? 'Cancel' : 'Annulla'}
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/25 transition"
            >
              {editingEntry
                ? isDe
                  ? 'Aktualisieren'
                  : isEn
                    ? 'Update'
                    : 'Aggiorna'
                : isDe
                  ? 'Speichern'
                  : isEn
                    ? 'Save'
                    : 'Salva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
