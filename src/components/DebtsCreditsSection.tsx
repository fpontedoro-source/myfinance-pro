import React, { useMemo, useState } from 'react';
import {
  Users,
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Calendar,
  HandCoins,
  X,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';
import { Account, DebtCreditEntry, FxSettings } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import {
  computeDebtCreditSummary,
  getDebtCreditSubtypeLabel,
} from '../utils/debtsCredits';
import { Language } from '../utils/translations';

interface DebtsCreditsSectionProps {
  items: DebtCreditEntry[];
  accounts: Account[];
  fxSettings: FxSettings;
  onOpenAdd: () => void;
  onEdit: (entry: DebtCreditEntry) => void;
  onDelete: (id: string) => void;
  onRecordPayment: (params: {
    entry: DebtCreditEntry;
    amount: number;
    postToAccount: boolean;
    accountId?: string;
    incrementInstallment: boolean;
  }) => void;
  onReopenEntry: (id: string) => void;
  language?: Language;
}

type FilterMode = 'ALL' | 'CREDIT' | 'DEBT' | 'SETTLED';

export const DebtsCreditsSection: React.FC<DebtsCreditsSectionProps> = ({
  items,
  accounts,
  fxSettings,
  onOpenAdd,
  onEdit,
  onDelete,
  onRecordPayment,
  onReopenEntry,
  language = 'it',
}) => {
  const isDe = language === 'de';
  const isEn = language === 'en';

  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const [payModalEntry, setPayModalEntry] = useState<DebtCreditEntry | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [postToAccount, setPostToAccount] = useState(true);
  const [payAccountId, setPayAccountId] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

  const summary = useMemo(
    () => computeDebtCreditSummary(items, fxSettings),
    [items, fxSettings]
  );

  const filteredItems = useMemo(() => {
    const list = items.filter((item) => {
      const isSettled = item.status === 'SETTLED' || item.remainingAmount <= 0.005;
      if (filterMode === 'SETTLED') return isSettled;
      if (filterMode === 'CREDIT') return !isSettled && item.direction === 'CREDIT';
      if (filterMode === 'DEBT') return !isSettled && item.direction === 'DEBT';
      return true;
    });

    return [...list].sort((a, b) => {
      const aSettled = a.status === 'SETTLED' || a.remainingAmount <= 0.005;
      const bSettled = b.status === 'SETTLED' || b.remainingAmount <= 0.005;
      if (aSettled !== bSettled) return aSettled ? 1 : -1;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [items, filterMode]);

  const openPaymentModal = (entry: DebtCreditEntry) => {
    const defaultPay =
      entry.monthlyInstallment && entry.monthlyInstallment > 0
        ? Math.min(entry.remainingAmount, entry.monthlyInstallment)
        : entry.remainingAmount;
    setPayModalEntry(entry);
    setPayAmount(defaultPay.toFixed(2).replace(/\.00$/, ''));
    setPostToAccount(true);
    setPayAccountId(entry.account || accounts[0]?.id || '');
    setPayError(null);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalEntry) return;
    const val = parseFloat(payAmount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      setPayError(
        isDe
          ? 'Bitte einen gültigen Betrag (> 0) eingeben.'
          : isEn
            ? 'Please enter a valid amount (> 0).'
            : 'Inserisci un importo valido maggiore di zero.'
      );
      return;
    }

    onRecordPayment({
      entry: payModalEntry,
      amount: val,
      postToAccount,
      accountId: payAccountId || accounts[0]?.id,
      incrementInstallment: Boolean(
        payModalEntry.totalInstallments && payModalEntry.totalInstallments > 0
      ),
    });
    setPayModalEntry(null);
    setPayError(null);
  };

  const baseCurr = fxSettings.baseCurrency;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HandCoins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>
              {isDe
                ? 'Schulden, Raten & Forderungen'
                : isEn
                  ? 'Debts, Installments & Credits'
                  : 'Debiti, Rate & Crediti'}
            </span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isDe
              ? 'Geteilte Ausgaben, Ratenpläne und Darlehen im Nettovermögen'
              : isEn
                ? 'Shared expenses, installment plans & loans factored into Net Worth'
                : 'Spese condivise, rate e prestiti integrati nel Patrimonio Netto'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAdd}
          className="min-h-[40px] text-xs text-indigo-700 dark:text-indigo-300 hover:text-white font-bold flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 px-3 py-1.5 rounded-xl transition flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isDe ? 'Neu' : isEn ? 'Add' : 'Nuovo'}</span>
        </button>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3">
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3" />
            <span>
              {isDe
                ? `Forderungen (${summary.openCreditsCount})`
                : isEn
                  ? `Credits Due (${summary.openCreditsCount})`
                  : `Crediti da incassare (${summary.openCreditsCount})`}
            </span>
          </div>
          <div className="text-base font-black text-emerald-700 dark:text-emerald-300 tabular-nums mt-1">
            +{formatCurrency(summary.totalCredits, true, baseCurr)}
          </div>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-3">
          <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>
              {isDe
                ? `Restschulden (${summary.openDebtsCount})`
                : isEn
                  ? `Debts Remaining (${summary.openDebtsCount})`
                  : `Debiti & Rate (${summary.openDebtsCount})`}
            </span>
          </div>
          <div className="text-base font-black text-rose-700 dark:text-rose-300 tabular-nums mt-1">
            -{formatCurrency(summary.totalDebts, true, baseCurr)}
          </div>
        </div>
      </div>

      {summary.monthlyInstallmentsCommitment > 0 && (
        <div className="px-3.5 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            {isDe
              ? 'Monatliche Ratenbelastung'
              : isEn
                ? 'Monthly Installment Commitment'
                : 'Impegno mensile rate attive'}
          </span>
          <span className="font-bold text-amber-700 dark:text-amber-300 tabular-nums">
            {formatCurrency(summary.monthlyInstallmentsCommitment, true, baseCurr)}/
            {isDe ? 'Mon' : isEn ? 'mo' : 'mese'}
          </span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
        {(
          [
            {
              id: 'ALL',
              label: isDe ? 'Alle' : isEn ? 'All' : 'Tutti',
            },
            {
              id: 'CREDIT',
              label: isDe ? 'Forder.' : isEn ? 'Credits' : 'Crediti',
            },
            {
              id: 'DEBT',
              label: isDe ? 'Schulden' : isEn ? 'Debts' : 'Debiti',
            },
            {
              id: 'SETTLED',
              label: isDe ? 'Erledigt' : isEn ? 'Settled' : 'Saldati',
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterMode(tab.id)}
            className={`min-h-[38px] rounded-xl transition ${
              filterMode === tab.id
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-8 px-4 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <HandCoins className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {isDe
              ? 'Keine Einträge in dieser Ansicht.'
              : isEn
                ? 'No items in this view.'
                : 'Nessun debito o credito in questa vista.'}
          </p>
          <p className="text-[11px] text-slate-500">
            {isDe
              ? 'Erfassen Sie Darlehen, Ratenkäufe oder ausgelegte Beträge für Freunde.'
              : isEn
                ? 'Add loans, installment plans, or money advanced to friends/colleagues.'
                : 'Aggiungi finanziamenti, acquisti a rate o spese anticipate ad amici e colleghi.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((entry) => {
            const isCredit = entry.direction === 'CREDIT';
            const isSettled =
              entry.status === 'SETTLED' || entry.remainingAmount <= 0.005;
            const totalAmt = Math.max(0.01, Number(entry.totalAmount) || 0.01);
            const paidAmt = Math.max(0, totalAmt - entry.remainingAmount);
            const pct = Math.min(100, Math.round((paidAmt / totalAmt) * 100));
            const curr = entry.currency || 'EUR';

            return (
              <div
                key={entry.id}
                className={`p-3.5 rounded-2xl border space-y-2.5 transition ${
                  isSettled
                    ? 'bg-white/40 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/70 opacity-80'
                    : 'bg-white/85 dark:bg-slate-900/85 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-xl border flex-shrink-0 ${
                        isCredit
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {isCredit ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {entry.title}
                        </span>
                        {isSettled && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              {isDe ? 'Erledigt' : isEn ? 'Settled' : 'Saldato'}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {entry.counterparty}
                        </span>
                        {' · '}
                        <span>{getDebtCreditSubtypeLabel(entry.subtype, language)}</span>
                        {entry.dueDate && (
                          <>
                            {' · '}
                            <span className="inline-flex items-center gap-0.5 text-cyan-700 dark:text-cyan-300">
                              <Calendar className="w-3 h-3 inline" />
                              {entry.dueDate}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-sm font-black tabular-nums ${
                        isSettled
                          ? 'text-slate-500 dark:text-slate-400'
                          : isCredit
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isSettled
                        ? formatCurrency(0, true, curr)
                        : `${isCredit ? '+' : '-'}${formatCurrency(entry.remainingAmount, true, curr)}`}
                    </div>
                    <div className="text-[10px] text-slate-500 tabular-nums">
                      {isDe ? 'von' : isEn ? 'of' : 'su'}{' '}
                      {formatCurrency(entry.totalAmount, true, curr)}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isSettled
                          ? 'bg-emerald-500'
                          : isCredit
                            ? 'bg-emerald-400'
                            : 'bg-indigo-500'
                      }`}
                      style={{ width: `${isSettled ? 100 : pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="truncate">
                      {entry.totalInstallments && entry.totalInstallments > 0 ? (
                        <span className="tabular-nums text-indigo-700 dark:text-indigo-300 font-semibold">
                          {entry.paidInstallments || 0}/{entry.totalInstallments}{' '}
                          {isDe ? 'Raten' : isEn ? 'installments' : 'rate'}
                          {entry.monthlyInstallment
                            ? ` · ${formatCurrency(entry.monthlyInstallment, true, curr)}/${
                                isDe ? 'Mon' : isEn ? 'mo' : 'mese'
                              }`
                            : ''}
                        </span>
                      ) : entry.notes ? (
                        <span className="italic">{entry.notes}</span>
                      ) : (
                        <span>
                          {isDe
                            ? 'Abzahlungsfortschritt'
                            : isEn
                              ? 'Repayment progress'
                              : 'Stato rientro'}
                        </span>
                      )}
                    </span>
                    <span className="tabular-nums font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                      {isSettled ? 100 : pct}%
                    </span>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70 dark:border-slate-800/70">
                  {!isSettled ? (
                    <button
                      type="button"
                      onClick={() => openPaymentModal(entry)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition active:scale-95 ${
                        isCredit
                          ? 'bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
                          : 'bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-700 dark:text-indigo-300 border-indigo-500/35'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {isCredit
                          ? isDe
                            ? 'Rückzahlung erfassen'
                            : isEn
                              ? 'Record Repayment'
                              : 'Incassa Quota / Salda'
                          : entry.monthlyInstallment
                            ? isDe
                              ? 'Rate zahlen'
                              : isEn
                                ? 'Pay Installment'
                                : 'Paga Rata / Quota'
                            : isDe
                              ? 'Abbezahlen / Tilgen'
                              : isEn
                                ? 'Record Payment'
                                : 'Paga Quota / Salda'}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onReopenEntry(entry.id)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>
                        {isDe ? 'Wieder öffnen' : isEn ? 'Reopen' : 'Riapri'}
                      </span>
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(entry)}
                      title={isDe ? 'Bearbeiten' : isEn ? 'Edit' : 'Modifica'}
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(entry.id)}
                      title={isDe ? 'Löschen' : isEn ? 'Delete' : 'Elimina'}
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment / Settlement Modal */}
      {payModalEntry && (
        <div className="fixed inset-0 bg-slate-100/90 dark:bg-slate-950/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 no-print">
          <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-300 dark:border-slate-700 rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 shadow-2xl relative animate-slide-up">
            <button
              type="button"
              onClick={() => setPayModalEntry(null)}
              className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white pr-10 mb-1">
              {payModalEntry.direction === 'CREDIT'
                ? isDe
                  ? 'Rückzahlung erfassen'
                  : isEn
                    ? 'Record Credit Repayment'
                    : 'Registra Incasso Credito'
                : isDe
                  ? 'Zahlung / Rate erfassen'
                  : isEn
                    ? 'Record Debt Payment'
                    : 'Registra Pagamento / Rata'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 truncate">
              {payModalEntry.title} · {payModalEntry.counterparty} (
              {isDe ? 'Offen' : isEn ? 'Remaining' : 'Residuo'}:{' '}
              <strong className="text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(
                  payModalEntry.remainingAmount,
                  true,
                  payModalEntry.currency || 'EUR'
                )}
              </strong>
              )
            </p>

            <form onSubmit={handleConfirmPayment} className="space-y-3 text-xs">
              {/* Quick preset pills */}
              <div className="flex gap-1.5">
                {payModalEntry.monthlyInstallment &&
                  payModalEntry.monthlyInstallment > 0 &&
                  payModalEntry.monthlyInstallment < payModalEntry.remainingAmount && (
                    <button
                      type="button"
                      onClick={() => {
                        setPayAmount(String(payModalEntry.monthlyInstallment));
                        setPayError(null);
                      }}
                      className="flex-1 min-h-[38px] px-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-bold"
                    >
                      {isDe ? '1 Rate' : isEn ? '1 Rate' : '1 Rata'} (
                      {payModalEntry.monthlyInstallment})
                    </button>
                  )}
                {payModalEntry.remainingAmount > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPayAmount((payModalEntry.remainingAmount / 2).toFixed(2));
                      setPayError(null);
                    }}
                    className="flex-1 min-h-[38px] px-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    50%
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPayAmount(String(payModalEntry.remainingAmount));
                    setPayError(null);
                  }}
                  className="flex-1 min-h-[38px] px-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold"
                >
                  {isDe ? 'Alles' : isEn ? 'Full' : 'Salda Tutto'}
                </button>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  {isDe
                    ? `Betrag (${payModalEntry.currency || 'EUR'})`
                    : isEn
                      ? `Amount (${payModalEntry.currency || 'EUR'})`
                      : `Importo (${payModalEntry.currency || 'EUR'})`}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={payAmount}
                  onChange={(e) => {
                    setPayAmount(e.target.value);
                    if (payError) setPayError(null);
                  }}
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-base font-bold tabular-nums focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Optional account transaction sync */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="flex items-center justify-between gap-2 cursor-pointer">
                  <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                    {payModalEntry.direction === 'CREDIT'
                      ? isDe
                        ? 'Als Einnahme auf Konto buchen'
                        : isEn
                          ? 'Also record as Income on account'
                          : 'Registra entrata sul conto'
                      : isDe
                        ? 'Als Ausgabe auf Konto buchen'
                        : isEn
                          ? 'Also record as Expense on account'
                          : 'Registra uscita sul conto'}
                  </span>
                  <input
                    type="checkbox"
                    checked={postToAccount}
                    onChange={(e) => setPostToAccount(e.target.checked)}
                    className="accent-indigo-500 w-4 h-4"
                  />
                </label>

                {postToAccount && accounts.length > 0 && (
                  <select
                    value={payAccountId}
                    onChange={(e) => setPayAccountId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency || 'EUR'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {payError && (
                <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{payError}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPayModalEntry(null)}
                  className="flex-1 min-h-[44px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold transition"
                >
                  {isDe ? 'Abbrechen' : isEn ? 'Cancel' : 'Annulla'}
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition"
                >
                  {isDe ? 'Bestätigen' : isEn ? 'Confirm' : 'Conferma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
