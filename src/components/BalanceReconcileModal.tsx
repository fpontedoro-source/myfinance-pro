import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Scale,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Wrench,
  PlusCircle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  FolderInput,
} from 'lucide-react';
import { Account, Transaction } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { AccountIcon } from './AccountIcon';
import { Language } from '../utils/translations';

interface BalanceReconcileModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  transactions: Transaction[];
  categories: string[];
  onReconcileData: (
    updatedTransactions: Transaction[],
    updatedAccounts?: Account[],
    updatedCategories?: string[]
  ) => void;
  onShowToast: (msg: string) => void;
  language?: Language;
}

interface AccountAuditInfo {
  account: Account;
  incomeSum: number;
  expenseSum: number;
  transfersIn: number;
  transfersOut: number;
  calculatedBalance: number;
  txCount: number;
}

interface OrphanedTx {
  tx: Transaction;
  missingAccountName: string;
  role: 'account' | 'fromAccount' | 'toAccount';
}

export const BalanceReconcileModal: React.FC<BalanceReconcileModalProps> = ({
  isOpen,
  onClose,
  accounts,
  transactions,
  categories,
  onReconcileData,
  onShowToast,
  language = 'it',
}) => {
  const isDe = language === 'de';
  const isEn = language === 'en';
  // Real balances entered by user for manual realignment: accountId -> realBalance string
  const [realBalancesInput, setRealBalancesInput] = useState<Record<string, string>>({});
  // Selected target account to batch reassign orphans
  const [selectedOrphanTarget, setSelectedOrphanTarget] = useState<string>(
    accounts[0]?.id || ''
  );
  // Active modal tab: 'audit' (Overview & Accounts) | 'orphans' (Orphaned TXs)
  const [activeTab, setActiveTab] = useState<'audit' | 'orphans'>('audit');
  // State indicating a recent recalculation action
  const [recalculateSuccess, setRecalculateSuccess] = useState(false);

  // 1. Audit all transactions and calculate exact mathematical balances
  const auditData = useMemo(() => {
    const accountMap = new Map<string, Account>();
    accounts.forEach((acc) => {
      accountMap.set(acc.id, acc);
      accountMap.set(acc.name, acc);
    });

    const auditPerAccount: Record<string, AccountAuditInfo> = {};
    accounts.forEach((acc) => {
      auditPerAccount[acc.id] = {
        account: acc,
        incomeSum: 0,
        expenseSum: 0,
        transfersIn: 0,
        transfersOut: 0,
        calculatedBalance: 0,
        txCount: 0,
      };
    });

    const orphans: OrphanedTx[] = [];
    let malformedCount = 0;
    const seenIds = new Set<string>();
    let duplicateIdsCount = 0;
    let floatingPointIssues = 0;

    transactions.forEach((tx) => {
      // Check ID duplicates
      if (seenIds.has(tx.id)) {
        duplicateIdsCount++;
      } else {
        seenIds.add(tx.id);
      }

      // Check amount validity & floating point drift
      const rawAmt = Number(tx.amount);
      if (isNaN(rawAmt) || rawAmt <= 0) {
        malformedCount++;
      } else {
        const rounded = Math.round(rawAmt * 100) / 100;
        if (Math.abs(rawAmt - rounded) > 0.000001) {
          floatingPointIssues++;
        }
      }

      const amt = isNaN(rawAmt) ? 0 : Math.round(rawAmt * 100) / 100;

      if (tx.type === 'INCOME') {
        const targetAcc = tx.account ? accountMap.get(tx.account) : undefined;
        if (targetAcc) {
          auditPerAccount[targetAcc.id].incomeSum += amt;
          auditPerAccount[targetAcc.id].txCount += 1;
        } else {
          orphans.push({
            tx,
            missingAccountName: tx.account || 'Conto Non Specificato',
            role: 'account',
          });
        }
      } else if (tx.type === 'EXPENSE') {
        const targetAcc = tx.account ? accountMap.get(tx.account) : undefined;
        if (targetAcc) {
          auditPerAccount[targetAcc.id].expenseSum += amt;
          auditPerAccount[targetAcc.id].txCount += 1;
        } else {
          orphans.push({
            tx,
            missingAccountName: tx.account || 'Conto Non Specificato',
            role: 'account',
          });
        }
      } else if (tx.type === 'TRANSFER') {
        const fromTarget = tx.fromAccount ? accountMap.get(tx.fromAccount) : undefined;
        const toTarget = tx.toAccount ? accountMap.get(tx.toAccount) : undefined;

        if (fromTarget) {
          auditPerAccount[fromTarget.id].transfersOut += amt;
          auditPerAccount[fromTarget.id].txCount += 1;
        } else if (tx.fromAccount) {
          orphans.push({
            tx,
            missingAccountName: tx.fromAccount,
            role: 'fromAccount',
          });
        }

        if (toTarget) {
          auditPerAccount[toTarget.id].transfersIn += amt;
          auditPerAccount[toTarget.id].txCount += 1;
        } else if (tx.toAccount) {
          orphans.push({
            tx,
            missingAccountName: tx.toAccount,
            role: 'toAccount',
          });
        }

        if (tx.fromAccount === tx.toAccount) {
          malformedCount++;
        }
      }
    });

    // Compute net calculated balance per account
    let totalLedgerBalance = 0;
    Object.values(auditPerAccount).forEach((info) => {
      const net =
        info.incomeSum -
        info.expenseSum +
        info.transfersIn -
        info.transfersOut;
      info.calculatedBalance = Math.round(net * 100) / 100;
      totalLedgerBalance += info.calculatedBalance;
    });

    const totalIssuesCount =
      orphans.length + malformedCount + duplicateIdsCount + floatingPointIssues;

    return {
      accountAudits: Object.values(auditPerAccount),
      totalLedgerBalance: Math.round(totalLedgerBalance * 100) / 100,
      orphans,
      malformedCount,
      duplicateIdsCount,
      floatingPointIssues,
      totalIssuesCount,
      totalTxAnalyzed: transactions.length,
    };
  }, [accounts, transactions]);

  if (!isOpen) return null;

  // Handler: Full Ledger Recalculation & Deep Clean
  const handleRecalculateAndNormalize = () => {
    const idMap = new Set<string>();
    const cleanedTransactions: Transaction[] = [];

    transactions.forEach((tx) => {
      // 1. Sanitize unique ID
      let cleanId = String(tx.id || '').trim();
      if (!cleanId || idMap.has(cleanId)) {
        cleanId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      }
      idMap.add(cleanId);

      // 2. Sanitize amount (strictly positive number with 2 decimals)
      let amt = Number(tx.amount);
      if (isNaN(amt) || amt <= 0) {
        amt = 0.01;
      }
      amt = Math.round(amt * 100) / 100;

      // 3. Sanitize date
      let date = String(tx.date || '').trim();
      if (!date || isNaN(Date.parse(date))) {
        date = new Date().toISOString().split('T')[0];
      }

      cleanedTransactions.push({
        ...tx,
        id: cleanId,
        date,
        amount: amt,
        description: (tx.description || '').trim() || 'Movimento',
        notes: tx.notes ? tx.notes.trim() : undefined,
      });
    });

    onReconcileData(cleanedTransactions);
    setRecalculateSuccess(true);
    setTimeout(() => setRecalculateSuccess(false), 4000);
    onShowToast(
      isDe
        ? 'Neuberechnung abgeschlossen: Alle Kontostände und Buchungen sind synchron!'
        : isEn
          ? 'Recalculation complete: all balances and transactions are synced!'
          : 'Ricalcolo completato: tutti i saldi e movimenti sono sincronizzati!'
    );
  };

  // Handler: Manual Balance Realignment via Adjustment Transaction
  const handleRealignAccountBalance = (accId: string, calculatedBalance: number) => {
    const rawVal = realBalancesInput[accId];
    if (rawVal === undefined || rawVal === '') {
      onShowToast(
        isDe
          ? 'Bitte den tatsächlichen Kontostand eingeben.'
          : isEn
            ? 'Please enter the desired actual balance for this account.'
            : 'Inserisci il saldo reale desiderato per questo conto.'
      );
      return;
    }

    const desiredBalance = parseFloat(rawVal.replace(',', '.'));
    if (isNaN(desiredBalance)) {
      onShowToast(
        isDe
          ? 'Ungültiger Kontostandswert.'
          : isEn
            ? 'Invalid actual balance value.'
            : 'Valore del saldo reale non valido.'
      );
      return;
    }

    const diff = Math.round((desiredBalance - calculatedBalance) * 100) / 100;
    if (Math.abs(diff) < 0.01) {
      onShowToast(
        isDe
          ? 'Der Kontostand stimmt bereits mit dem eingegebenen Wert überein.'
          : isEn
            ? 'Account balance already matches the entered value.'
            : 'Il saldo del conto coincide già con il valore indicato.'
      );
      return;
    }

    const account = accounts.find((a) => a.id === accId);
    const accountName = account ? account.name : accId;
    const isIncome = diff > 0;
    const absDiff = Math.abs(diff);

    // Ensure category "Rettifica Saldo" exists
    let updatedCategories = [...categories];
    const RECTIFY_CATEGORY = 'Rettifica Saldo';
    if (!updatedCategories.includes(RECTIFY_CATEGORY)) {
      updatedCategories = [...updatedCategories, RECTIFY_CATEGORY];
    }

    const adjustmentTx: Transaction = {
      id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
      type: isIncome ? 'INCOME' : 'EXPENSE',
      account: accId,
      category: RECTIFY_CATEGORY,
      amount: absDiff,
      description: `Rettifica Saldo: ${accountName}`,
      notes: `Aggiustamento di coerenza generato dal Ricalcolo Saldo per allineare il saldo storico (${formatCurrency(
        calculatedBalance
      )}) con quello reale (${formatCurrency(desiredBalance)}).`,
    };

    const newTransactions = [adjustmentTx, ...transactions];
    onReconcileData(newTransactions, undefined, updatedCategories);

    // Clear input
    setRealBalancesInput((prev) => {
      const copy = { ...prev };
      delete copy[accId];
      return copy;
    });

    onShowToast(
      isDe
        ? `Kontostand von "${accountName}" angepasst (${isIncome ? '+' : '-'}${formatCurrency(absDiff)})!`
        : isEn
          ? `Balance of "${accountName}" aligned (${isIncome ? '+' : '-'}${formatCurrency(absDiff)})!`
          : `Saldo di "${accountName}" allineato con successo (${isIncome ? '+' : '-'}${formatCurrency(absDiff)})!`
    );
  };

  // Handler: Batch Reassign Orphaned Transactions to an existing account
  const handleReassignAllOrphans = () => {
    if (!selectedOrphanTarget) {
      onShowToast(
        isDe
          ? 'Zielkonto für die Zuweisung wählen.'
          : isEn
            ? 'Select a target account to reassign transactions.'
            : 'Seleziona un conto di destinazione per riassegnare i movimenti.'
      );
      return;
    }

    const targetAccount = accounts.find((a) => a.id === selectedOrphanTarget);
    if (!targetAccount) return;

    const accountIds = new Set(accounts.map((a) => a.id));

    let reassignedCount = 0;
    const updated = transactions.map((tx) => {
      let changed = false;
      const copy = { ...tx };

      if (tx.type !== 'TRANSFER') {
        if (!copy.account || !accountIds.has(copy.account)) {
          copy.account = targetAccount.id;
          changed = true;
        }
      } else {
        if (!copy.fromAccount || !accountIds.has(copy.fromAccount)) {
          copy.fromAccount = targetAccount.id;
          changed = true;
        }
        if (!copy.toAccount || !accountIds.has(copy.toAccount)) {
          copy.toAccount = targetAccount.id;
          changed = true;
        }
      }

      if (changed) reassignedCount++;
      return copy;
    });

    onReconcileData(updated);
    onShowToast(
      isDe
        ? `${reassignedCount} verwaiste Buchungen "${targetAccount.name}" zugewiesen!`
        : isEn
          ? `${reassignedCount} orphaned transactions reassigned to "${targetAccount.name}"!`
          : `${reassignedCount} movimenti orfani riassegnati a "${targetAccount.name}"!`
    );
  };

  // Handler: Automatically recreate missing account for orphaned transactions
  const handleRecreateMissingAccount = (missingName: string) => {
    const trimmed = missingName.trim();
    if (!trimmed) return;

    if (accounts.some((a) => a.id.toLowerCase() === trimmed.toLowerCase())) {
      onShowToast(
        isDe
          ? `Konto "${trimmed}" existiert bereits.`
          : isEn
            ? `Account "${trimmed}" already exists.`
            : `Il conto "${trimmed}" esiste già.`
      );
      return;
    }

    const newAccount: Account = {
      id: trimmed,
      name: trimmed,
      icon: 'landmark',
      color: 'from-indigo-600 to-purple-600',
      badgeColor: 'bg-indigo-500/10 text-indigo-400',
    };

    const updatedAccounts = [...accounts, newAccount];
    onReconcileData(transactions, updatedAccounts);
    onShowToast(
      isDe
        ? `Fehlendes Konto "${trimmed}" wiederhergestellt!`
        : isEn
          ? `Missing account "${trimmed}" restored successfully!`
          : `Conto mancante "${trimmed}" ripristinato con successo nei conti!`
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
      <div className="bg-slate-900 border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl transition hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 pr-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>
                  {isDe
                    ? 'Salden prüfen & neu berechnen'
                    : isEn
                      ? 'Balance Audit & Reconciliation'
                      : 'Ricalcolo Saldo & Coerenza Dati'}
                </span>
                {auditData.totalIssuesCount === 0 ? (
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />{' '}
                    {isDe ? '100% Konsistent' : isEn ? '100% Consistent' : 'Coerente 100%'}
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/20 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {auditData.totalIssuesCount}{' '}
                    {isDe
                      ? auditData.totalIssuesCount === 1 ? 'Abweichung' : 'Abweichungen'
                      : isEn
                        ? auditData.totalIssuesCount === 1 ? 'discrepancy' : 'discrepancies'
                        : auditData.totalIssuesCount === 1 ? 'discrepanza' : 'discrepanze'}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isDe
                  ? 'Prüft die mathematische Übereinstimmung zwischen Buchungen und Kontoständen und behebt Unstimmigkeiten.'
                  : isEn
                    ? 'Verify mathematical consistency between transactions and balances and resolve discrepancies.'
                    : 'Verifica la corrispondenza matematica tra transazioni e saldi, correggendo anomalie da ripristini o modifiche manuali.'}
              </p>
            </div>
          </div>
        </div>

        {/* Global KPI Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">
              {isDe ? 'Geprüfte Buchungen' : isEn ? 'Transactions Checked' : 'Movimenti Esaminati'}
            </span>
            <span className="text-sm font-black text-white">{auditData.totalTxAnalyzed}</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">
              {isDe ? 'Berechneter Gesamtsaldo' : isEn ? 'Calculated Total' : 'Saldo Totale Calcolato'}
            </span>
            <span className="text-sm font-black text-indigo-400">
              {formatCurrency(auditData.totalLedgerBalance)}
            </span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">
              {isDe ? 'Geprüfte Konten' : isEn ? 'Accounts Verified' : 'Conti Verificati'}
            </span>
            <span className="text-sm font-black text-white">{accounts.length}</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">
              {isDe ? 'Verwaiste Buchungen' : isEn ? 'Orphaned Items' : 'Movimenti Orfani'}
            </span>
            <span
              className={`text-sm font-black ${
                auditData.orphans.length > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {auditData.orphans.length}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {isDe
                ? `Konten prüfen (${accounts.length})`
                : isEn
                  ? `Verify Accounts (${accounts.length})`
                  : `Verifica Singoli Conti (${accounts.length})`}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('orphans')}
            className={`flex-1 py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 relative ${
              activeTab === 'orphans'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderInput className="w-3.5 h-3.5" />
            <span>
              {isDe ? 'Verwaiste Buchungen' : isEn ? 'Orphaned Entries' : 'Movimenti Orfani'}
            </span>
            {auditData.orphans.length > 0 && (
              <span className="ml-1 text-[9px] px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black rounded-full">
                {auditData.orphans.length}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: ACCOUNTS AUDIT & REALIGNMENT */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              {auditData.accountAudits.map((info) => {
                const acc = info.account;
                const rawRealInput = realBalancesInput[acc.id] ?? '';
                const hasInput = rawRealInput.trim() !== '';
                const realVal = hasInput
                  ? parseFloat(rawRealInput.replace(',', '.'))
                  : info.calculatedBalance;
                const discrepancy = Math.round((realVal - info.calculatedBalance) * 100) / 100;
                const hasDiscrepancy = hasInput && !isNaN(realVal) && Math.abs(discrepancy) >= 0.01;

                return (
                  <div
                    key={acc.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3"
                  >
                    {/* Account Title Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr ${acc.color} text-white shadow-md`}
                        >
                          <AccountIcon iconName={acc.icon} className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            {acc.name}
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({info.txCount} {info.txCount === 1 ? 'movimento' : 'movimenti'})
                            </span>
                          </h4>
                          <span className="text-[10px] text-slate-400">ID: {acc.id}</span>
                        </div>
                      </div>

                      {/* Calculated Ledger Balance */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Saldo da Storico
                        </span>
                        <span className="text-sm font-black text-white">
                          {formatCurrency(info.calculatedBalance)}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Details Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                      <div className="flex items-center justify-between px-1.5 py-0.5">
                        <span className="text-slate-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-400" /> Entrate:
                        </span>
                        <span className="font-bold text-emerald-400">
                          +{formatCurrency(info.incomeSum)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-1.5 py-0.5">
                        <span className="text-slate-400 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 text-rose-400" /> Uscite:
                        </span>
                        <span className="font-bold text-rose-400">
                          -{formatCurrency(info.expenseSum)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-1.5 py-0.5">
                        <span className="text-slate-400 flex items-center gap-1">
                          <ArrowRightLeft className="w-3 h-3 text-indigo-400" /> Giroconti in:
                        </span>
                        <span className="font-bold text-indigo-300">
                          +{formatCurrency(info.transfersIn)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-1.5 py-0.5">
                        <span className="text-slate-400 flex items-center gap-1">
                          <ArrowRightLeft className="w-3 h-3 text-purple-400" /> Giroconti out:
                        </span>
                        <span className="font-bold text-purple-300">
                          -{formatCurrency(info.transfersOut)}
                        </span>
                      </div>
                    </div>

                    {/* Real Balance Comparison & Correction Input */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                      <div className="flex items-center gap-2 flex-1">
                        <label className="text-[11px] text-slate-300 font-medium whitespace-nowrap">
                          Saldo Reale Effettivo:
                        </label>
                        <div className="relative max-w-[130px]">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                            €
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={rawRealInput}
                            placeholder={info.calculatedBalance.toFixed(2)}
                            onChange={(e) =>
                              setRealBalancesInput((prev) => ({
                                ...prev,
                                [acc.id]: e.target.value,
                              }))
                            }
                            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-6 pr-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-indigo-500 transition"
                          />
                        </div>
                      </div>

                      {/* Discrepancy Action */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {hasDiscrepancy ? (
                          <>
                            <span
                              className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg border ${
                                discrepancy > 0
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              Discrepanza: {discrepancy > 0 ? '+' : ''}
                              {formatCurrency(discrepancy)}
                            </span>
                            <button
                              onClick={() =>
                                handleRealignAccountBalance(acc.id, info.calculatedBalance)
                              }
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-md transition active:scale-95"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>Allinea Saldo</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                            <CheckCircle2 className="w-3 h-3" /> Allineato
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: ORPHANED TRANSACTIONS */}
          {activeTab === 'orphans' && (
            <div className="space-y-4">
              {auditData.orphans.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-white">Nessun movimento orfano</p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Tutti i movimenti presenti nel registro storico sono correttamente collegati ai conti esistenti.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Alert banner with batch reassign */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-200">
                          Rilevati {auditData.orphans.length} movimenti non collegati a conti attivi
                        </h4>
                        <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                          Questi movimenti fanno riferimento a nomi o ID di conti non presenti (es. eliminati in precedenza o modificati a mano). Puoi riassegnarli o ricreare il conto mancante.
                        </p>
                      </div>
                    </div>

                    {/* Batch Reassign Form */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-amber-500/20">
                      <span className="text-[11px] font-semibold text-amber-200">
                        Riassegna tutti a:
                      </span>
                      <select
                        value={selectedOrphanTarget}
                        onChange={(e) => setSelectedOrphanTarget(e.target.value)}
                        className="bg-slate-900 border border-amber-500/40 text-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400"
                      >
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleReassignAllOrphans}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 transition shadow"
                      >
                        <FolderInput className="w-3.5 h-3.5" />
                        <span>Riassegna Tutti i Movimenti</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Orphaned Transactions */}
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {auditData.orphans.map(({ tx, missingAccountName }, idx) => (
                      <div
                        key={tx.id || idx}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white truncate">
                              {tx.description}
                            </span>
                            <span className="text-[10px] text-slate-500">{tx.date}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                            <span
                              className={`font-bold ${
                                tx.type === 'INCOME'
                                  ? 'text-emerald-400'
                                  : tx.type === 'EXPENSE'
                                  ? 'text-rose-400'
                                  : 'text-indigo-400'
                              }`}
                            >
                              {tx.type === 'EXPENSE' ? '-' : '+'}
                              {formatCurrency(tx.amount)}
                            </span>
                            <span>•</span>
                            <span className="text-amber-400 truncate">
                              Conto mancante: "{missingAccountName}"
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRecreateMissingAccount(missingAccountName)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0 transition"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>Ricrea Conto</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 mt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {isDe
                ? '2-Dezimal-Präzision & ID-Eindeutigkeitsprüfung'
                : isEn
                  ? '2-decimal precision normalization & unique ID check'
                  : 'Normalizzazione precisione a 2 decimali e verifica univocità ID'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              {isDe ? 'Schließen' : isEn ? 'Close' : 'Chiudi'}
            </button>
            <button
              onClick={handleRecalculateAndNormalize}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${recalculateSuccess ? 'animate-spin' : ''}`}
              />
              <span>
                {isDe
                  ? 'Alles neu berechnen'
                  : isEn
                    ? 'Recalculate & Normalize All'
                    : 'Ricalcola & Normalizza Tutto'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
