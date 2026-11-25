import React from 'react';
import { Wallet, PlusCircle, Target } from 'lucide-react';
import { SafeToSpendSummary } from '../utils/cashflowForecast';
import { formatCurrency } from '../utils/formatters';
import { Language } from '../utils/translations';

interface SafeToSpendCardProps {
  summary: SafeToSpendSummary;
  onQuickAddExpense: () => void;
  onOpenBudgets: () => void;
  language: Language;
}

export const SafeToSpendCard: React.FC<SafeToSpendCardProps> = ({
  summary,
  onQuickAddExpense,
  onOpenBudgets,
  language,
}) => {
  const isDe = language === 'de';
  const isEn = language === 'en';
  const isOverToday = summary.remainingToday < -0.01;
  const isLow = !isOverToday && summary.dailyAllowance > 0 && summary.remainingToday < summary.dailyAllowance * 0.25;

  const title = isDe
    ? 'Heute verfügbar (Safe-to-Spend)'
    : isEn
      ? 'Safe-to-Spend Today'
      : 'Disponibile Oggi (Safe-to-Spend)';

  const modeLabel =
    summary.mode === 'budget'
      ? isDe
        ? 'Basis: Monatsbudgets & Fälligkeiten'
        : isEn
          ? 'Based on budgets & upcoming bills'
          : 'Basato su budget e scadenze'
      : isDe
        ? 'Basis: Liquidität nach Fälligkeiten'
        : isEn
          ? 'Based on cash after upcoming bills'
          : 'Basato su liquidità dopo scadenze';

  const statusText = isOverToday
    ? isDe
      ? `Tageslimit um ${formatCurrency(Math.abs(summary.remainingToday), true, summary.baseCurrency)} überschritten`
      : isEn
        ? `Over daily pace by ${formatCurrency(Math.abs(summary.remainingToday), true, summary.baseCurrency)}`
        : `Superato oggi di ${formatCurrency(Math.abs(summary.remainingToday), true, summary.baseCurrency)}`
    : isDe
      ? `Tagesbudget: ${formatCurrency(summary.dailyAllowance, true, summary.baseCurrency)}/Tag`
      : isEn
        ? `Daily pace: ${formatCurrency(summary.dailyAllowance, true, summary.baseCurrency)}/day`
        : `Quota giornaliera: ${formatCurrency(summary.dailyAllowance, true, summary.baseCurrency)}/gg`;

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 shadow-sm dark:shadow-none space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Wallet
              className={`w-4 h-4 flex-shrink-0 ${
                isOverToday
                  ? 'text-rose-600 dark:text-rose-400'
                  : isLow
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
              }`}
            />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">{title}</h3>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {modeLabel}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <div
            className={`text-xl font-black tabular-nums leading-none ${
              isOverToday
                ? 'text-rose-600 dark:text-rose-400'
                : isLow
                  ? 'text-amber-600 dark:text-amber-300'
                  : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {formatCurrency(Math.max(0, summary.remainingToday), true, summary.baseCurrency)}
          </div>
          <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tabular-nums mt-1">
            {statusText}
          </div>
        </div>
      </div>

      {/* Daily consumption progress bar */}
      <div className="space-y-1">
        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverToday
                ? 'bg-rose-500'
                : isLow
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${summary.todayProgressPct}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 tabular-nums">
            <span>
              {isDe ? 'Heute ausgegeben:' : isEn ? 'Spent today:' : 'Speso oggi:'}{' '}
              <strong className="text-slate-900 dark:text-slate-200">
                {formatCurrency(summary.spentToday, true, summary.baseCurrency)}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {isDe
                ? `${summary.daysRemainingIncludingToday} Tage inkl. heute`
                : isEn
                  ? `${summary.daysRemainingIncludingToday} days incl. today`
                  : `${summary.daysRemainingIncludingToday} gg incl. oggi`}
            </span>
            {summary.upcomingRecurringExpense > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  {isDe ? 'Fixkosten offen:' : isEn ? 'Bills reserved:' : 'Scadenze:'}{' '}
                  <strong className="text-rose-600 dark:text-rose-400">
                    -{formatCurrency(summary.upcomingRecurringExpense, true, summary.baseCurrency)}
                  </strong>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {summary.mode === 'liquidity' && (
              <button
                type="button"
                onClick={onOpenBudgets}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
              >
                <Target className="w-3 h-3" />
                <span>{isDe ? 'Budgets' : isEn ? 'Budgets' : 'Imposta Budget'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onQuickAddExpense}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <PlusCircle className="w-3 h-3" />
              <span>{isDe ? 'Ausgabe' : isEn ? 'Expense' : '+ Spesa'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
