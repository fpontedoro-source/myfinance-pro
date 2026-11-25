import React, { useState } from 'react';
import {
  Target,
  Trophy,
  Settings,
  Plus,
  PlusCircle,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  X,
  AlertTriangle,
  HandCoins,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Account, CurrencyCode, DebtCreditEntry, FxSettings, Goal } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { BudgetAlertItem } from '../utils/cashflowForecast';
import { CategoryIcon, getCategoryColorDetails } from './CategoryIcon';
import { Language, Translations, getCategoryDisplayName } from '../utils/translations';
import { DebtsCreditsSection } from './DebtsCreditsSection';

export type BudgetsSubTab = 'budgets' | 'debts';

interface BudgetsGoalsTabProps {
  budgets: Record<string, number>;
  monthlyExpenses: Record<string, number>;
  budgetAlerts?: BudgetAlertItem[];
  baseCurrency?: CurrencyCode;
  goals: Goal[];
  debtsCredits?: DebtCreditEntry[];
  accounts?: Account[];
  fxSettings?: FxSettings;
  activeSubTab?: BudgetsSubTab;
  onSubTabChange?: (subTab: BudgetsSubTab) => void;
  onOpenAddDebtCredit?: () => void;
  onEditDebtCredit?: (entry: DebtCreditEntry) => void;
  onDeleteDebtCredit?: (id: string) => void;
  onRecordDebtCreditPayment?: (params: {
    entry: DebtCreditEntry;
    amount: number;
    postToAccount: boolean;
    accountId?: string;
    incrementInstallment: boolean;
  }) => void;
  onReopenDebtCredit?: (id: string) => void;
  onOpenEditBudgets: () => void;
  onOpenAddGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onDepositToGoal: (goalId: string, amount: number) => void;
  onShowToast: (msg: string) => void;
  language?: Language;
  t?: Translations;
}

export const BudgetsGoalsTab: React.FC<BudgetsGoalsTabProps> = ({
  budgets,
  monthlyExpenses,
  budgetAlerts = [],
  baseCurrency = 'EUR',
  goals,
  debtsCredits = [],
  accounts = [],
  fxSettings,
  activeSubTab: controlledSubTab,
  onSubTabChange,
  onOpenAddDebtCredit,
  onEditDebtCredit,
  onDeleteDebtCredit,
  onRecordDebtCreditPayment,
  onReopenDebtCredit,
  onOpenEditBudgets,
  onOpenAddGoal,
  onEditGoal,
  onDeleteGoal,
  onDepositToGoal,
  onShowToast,
  language = 'it',
  t,
}) => {
  const [localSubTab, setLocalSubTab] = useState<BudgetsSubTab>('budgets');
  const activeSubTab = controlledSubTab ?? localSubTab;
  const setSubTab = (next: BudgetsSubTab) => {
    setLocalSubTab(next);
    if (onSubTabChange) onSubTabChange(next);
  };

  const openDebtsCreditsCount = debtsCredits.filter(
    (d) => d.status !== 'SETTLED' && d.remainingAmount > 0.005
  ).length;

  const categoriesWithBudgets = Object.keys(budgets).filter((c) => budgets[c] > 0);
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('50');
  const [depositError, setDepositError] = useState<string | null>(null);

  const openDepositModal = (goal: Goal) => {
    setDepositGoal(goal);
    setDepositAmount('50');
    setDepositError(null);
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    const val = parseFloat(depositAmount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      setDepositError(
        language === 'de'
          ? 'Bitte einen gültigen Betrag (> 0) eingeben.'
          : language === 'en'
            ? 'Please enter a valid amount (> 0).'
            : 'Inserisci un importo valido maggiore di zero.'
      );
      return;
    }

    const newTotal = (depositGoal.current || 0) + val;
    onDepositToGoal(depositGoal.id, val);
    if (newTotal >= depositGoal.target && depositGoal.current < depositGoal.target) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      onShowToast(
        language === 'de'
          ? `Glückwunsch! Ziel "${depositGoal.title}" erreicht!`
          : language === 'en'
            ? `Congratulations! Goal "${depositGoal.title}" completed!`
            : `Congratulazioni! Obiettivo "${depositGoal.title}" completato!`
      );
    } else {
      onShowToast(
        language === 'de'
          ? `${formatCurrency(val)} zu "${depositGoal.title}" hinzugefügt`
          : language === 'en'
            ? `Added ${formatCurrency(val)} to "${depositGoal.title}"`
            : `Aggiunti ${formatCurrency(val)} a "${depositGoal.title}"`
      );
    }
    setDepositGoal(null);
    setDepositError(null);
  };

  return (
    <div className="space-y-5">
      {/* Segmented View Switcher: Budgets & Goals vs Debts, Installments & Credits */}
      <div className="grid grid-cols-2 gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setSubTab('budgets')}
          className={`min-h-[42px] px-3 rounded-xl flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'budgets'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span className="truncate">
            {language === 'de'
              ? 'Budgets & Ziele'
              : language === 'en'
                ? 'Budgets & Goals'
                : 'Budget & Obiettivi'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('debts')}
          className={`min-h-[42px] px-3 rounded-xl flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'debts'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HandCoins className="w-3.5 h-3.5" />
          <span className="truncate">
            {language === 'de'
              ? 'Schulden & Forder.'
              : language === 'en'
                ? 'Debts & Credits'
                : 'Debiti & Crediti'}
          </span>
          {openDebtsCreditsCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                activeSubTab === 'debts'
                  ? 'bg-white/20 text-slate-900 dark:text-white'
                  : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              {openDebtsCreditsCount}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'debts' && fxSettings && onOpenAddDebtCredit && onEditDebtCredit && onDeleteDebtCredit && onRecordDebtCreditPayment && onReopenDebtCredit ? (
        <DebtsCreditsSection
          items={debtsCredits}
          accounts={accounts}
          fxSettings={fxSettings}
          onOpenAdd={onOpenAddDebtCredit}
          onEdit={onEditDebtCredit}
          onDelete={onDeleteDebtCredit}
          onRecordPayment={onRecordDebtCreditPayment}
          onReopenEntry={onReopenDebtCredit}
          language={language}
        />
      ) : (
        <>
      {/* SECTION 1: Monthly Budgets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> {t?.monthlySpendingBudgets || 'Budget Mensili'}
          </h2>
          <button
            onClick={onOpenEditBudgets}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl transition"
          >
            <Settings className="w-3.5 h-3.5" /> {t?.setBudgetBtn || 'Imposta Budget'}
          </button>
        </div>

        {(() => {
          const activeAlerts = budgetAlerts.filter((a) => a.status !== 'OK');
          if (activeAlerts.length === 0) return null;
          return (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/35 border border-amber-500/35 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {language === 'de'
                    ? `Budget-Warnungen (${activeAlerts.length})`
                    : language === 'en'
                      ? `Budget Alerts (${activeAlerts.length})`
                      : `Allarmi Budget (${activeAlerts.length})`}
                </span>
              </div>
              <div className="space-y-1">
                {activeAlerts.slice(0, 3).map((al) => (
                  <div key={al.category} className="text-[11px] text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2">
                    <span className="truncate">
                      {getCategoryDisplayName(al.category, language)} ·{' '}
                      <span className={al.status === 'EXCEEDED' ? 'text-rose-400 font-semibold' : 'text-amber-300 font-semibold'}>
                        {al.status === 'EXCEEDED'
                          ? language === 'de'
                            ? 'Limit überschritten'
                            : language === 'en'
                              ? 'Limit exceeded'
                              : 'Budget superato'
                          : al.status === 'WARNING'
                            ? language === 'de'
                              ? 'Über 80% verbraucht'
                              : language === 'en'
                                ? 'Over 80% used'
                                : 'Oltre l’80% usato'
                            : language === 'de'
                              ? 'Hohes Tempo'
                              : language === 'en'
                                ? 'High pacing risk'
                                : 'Ritmo oltre soglia'}
                      </span>
                    </span>
                    <span className="text-[11px] font-bold tabular-nums text-slate-600 dark:text-slate-300 flex-shrink-0">
                      {Math.round(al.pctUsed)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {categoriesWithBudgets.length === 0 ? (
          <div className="text-center py-8 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Target className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">{t?.noBudgetsSet || 'Nessun budget configurato.'}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {t?.noBudgetsSetSub || 'Clicca su Imposta Budget in alto per definire i tuoi limiti di spesa.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {categoriesWithBudgets.map((cat) => {
              const alertInfo = budgetAlerts.find((a) => a.category === cat);
              const limit = budgets[cat];
              const spent = alertInfo ? alertInfo.spent : monthlyExpenses[cat] || 0;
              const percentage = Math.min(100, Math.round((spent / limit) * 100));
              const status = alertInfo?.status || (percentage >= 100 ? 'EXCEEDED' : percentage >= 80 ? 'WARNING' : 'OK');

              let barColor = 'bg-indigo-500';
              let textColor = 'text-slate-300';
              if (status === 'EXCEEDED') {
                barColor = 'bg-rose-500';
                textColor = 'text-rose-400 font-bold';
              } else if (status === 'WARNING' || status === 'PACING_RISK') {
                barColor = 'bg-amber-500';
                textColor = 'text-amber-400 font-semibold';
              }

              const catColor = getCategoryColorDetails(cat);
              const displayName = getCategoryDisplayName(cat, language);
              const statusLabel =
                status === 'EXCEEDED'
                  ? language === 'de'
                    ? 'Überschritten'
                    : language === 'en'
                      ? 'Exceeded'
                      : 'Superato'
                  : status === 'WARNING'
                    ? language === 'de'
                      ? 'Warnung 80%+'
                      : language === 'en'
                        ? 'Alert 80%+'
                        : 'Attenzione 80%+'
                    : status === 'PACING_RISK'
                      ? language === 'de'
                        ? 'Tempo-Risiko'
                        : language === 'en'
                          ? 'High pace'
                          : 'Ritmo elevato'
                      : language === 'de'
                        ? 'Im Plan'
                        : language === 'en'
                          ? 'On track'
                          : 'In linea';

              return (
                <div
                  key={cat}
                  className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5"
                >
                  <div className="flex justify-between items-center text-xs gap-2">
                    <div className="flex items-center gap-2 truncate max-w-[200px]">
                      <div
                        className={`p-1.5 rounded-lg ${catColor.bgLight} ${catColor.textColor} border ${catColor.borderColor} flex items-center justify-center flex-shrink-0`}
                      >
                        <CategoryIcon categoryName={cat} className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white truncate">{displayName}</span>
                    </div>
                    <span className={`${textColor} text-[11px] tabular-nums flex-shrink-0`}>
                      {formatCurrency(spent, true, baseCurrency)} / {formatCurrency(limit, true, baseCurrency)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`${barColor} h-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 gap-2">
                    <span className="truncate">
                      <span className={status === 'EXCEEDED' ? 'text-rose-400 font-semibold' : status !== 'OK' ? 'text-amber-300 font-semibold' : 'text-emerald-400'}>
                        {statusLabel}
                      </span>
                      {alertInfo && (
                        <>
                          {' · '}
                          <span className="tabular-nums">
                            {language === 'de' ? 'Prognose' : language === 'en' ? 'Forecast' : 'Stima'}:{' '}
                            {formatCurrency(alertInfo.projectedSpend, true, baseCurrency)}
                          </span>
                        </>
                      )}
                    </span>
                    <span className="tabular-nums flex-shrink-0">
                      {percentage}% {t?.percentUsed || 'Utilizzato'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Savings Goals */}
      <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {t?.savingsGoalsTitle || 'Obiettivi di Risparmio'}
          </h2>
          <button
            onClick={onOpenAddGoal}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl transition"
          >
            <Plus className="w-3.5 h-3.5" /> {t?.newGoalBtn || 'Nuovo Obiettivo'}
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-8 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">{t?.noGoalsSet || 'Nessun obiettivo di risparmio impostato.'}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {t?.noGoalsSetSub || 'Clicca su Nuovo Obiettivo per fissare un traguardo finanziario.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const target = goal.target || 0;
              const current = goal.current || 0;
              const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
              const isCompleted = current >= target;

              return (
                <div
                  key={goal.id}
                  className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 relative"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{goal.title}</span>
                        {isCompleted && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-extrabold border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> {t?.goalCompleted || 'Raggiunto!'}
                          </span>
                        )}
                      </div>
                      {goal.targetDate && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" /> {t?.goalDeadline || 'Scadenza'}: {goal.targetDate}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openDepositModal(goal)}
                        title={t?.addFundsBtn || 'Aggiungi Risparmio'}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditGoal(goal)}
                        title={t?.edit || 'Modifica'}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        title={t?.delete || 'Elimina'}
                        className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t?.savedOf || 'Risparmiato'}:{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatCurrency(current)}
                      </strong>
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                      {language === 'de' ? 'Ziel' : language === 'en' ? 'Target' : 'Target'}:{' '}
                      <strong className="font-bold">{formatCurrency(target)}</strong>
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>{t?.goalProgress || 'Avanzamento'}</span>
                    <span className="font-bold text-slate-600 dark:text-slate-300">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      )}

      {/* IN-APP DEPOSIT MODAL (No native browser prompt() — APK/WebView safe) */}
      {depositGoal && (
        <div className="fixed inset-0 bg-slate-100/90 dark:bg-slate-950/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 no-print">
          <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-300 dark:border-slate-700 rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 shadow-2xl relative animate-slide-up">
            <button
              type="button"
              onClick={() => setDepositGoal(null)}
              className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1 pr-8">
              <PlusCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="truncate">
                {language === 'de'
                  ? 'Betrag einzahlen'
                  : language === 'en'
                    ? 'Add Savings'
                    : 'Aggiungi Risparmio'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 truncate">
              {depositGoal.title} ({formatCurrency(depositGoal.current)} / {formatCurrency(depositGoal.target)})
            </p>

            <form onSubmit={handleConfirmDeposit} className="space-y-3">
              <div className="flex gap-1.5">
                {[20, 50, 100, 250].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setDepositAmount(preset.toString());
                      setDepositError(null);
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                      depositAmount === preset.toString()
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  {language === 'de'
                    ? 'Einzahlungsbetrag'
                    : language === 'en'
                      ? 'Deposit amount'
                      : 'Importo da aggiungere'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={depositAmount}
                  onChange={(e) => {
                    setDepositAmount(e.target.value);
                    if (depositError) setDepositError(null);
                  }}
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-base font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {depositError && (
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{depositError}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl text-xs font-semibold transition"
                >
                  {t?.cancel || 'Annulla'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition"
                >
                  {language === 'de'
                    ? 'Hinzufügen'
                    : language === 'en'
                      ? 'Add Funds'
                      : 'Conferma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
