import React, { useMemo, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Play,
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Account, DebtCreditEntry, FxSettings, RecurringMovement } from '../types/finance';
import { buildMonthlyDueCalendar, CalendarDueEvent } from '../utils/cashflowForecast';
import { formatCurrency, formatDateEuropean } from '../utils/formatters';
import { formatRecurringFrequencyLabel, getTodayIsoDate } from '../utils/recurringScheduler';
import { Language } from '../utils/translations';

interface DueCalendarSectionProps {
  recurring: RecurringMovement[];
  debtsCredits: DebtCreditEntry[];
  accounts: Account[];
  fxSettings: FxSettings;
  onApplyRecurring: (ruleId: string) => void;
  onOpenRecurringModal: () => void;
  onOpenDebtsCredits?: () => void;
  language: Language;
}

export const DueCalendarSection: React.FC<DueCalendarSectionProps> = ({
  recurring,
  debtsCredits,
  accounts,
  fxSettings,
  onApplyRecurring,
  onOpenRecurringModal,
  onOpenDebtsCredits,
  language,
}) => {
  const isDe = language === 'de';
  const isEn = language === 'en';
  const todayStr = getTodayIsoDate();
  const [todayYear, todayMonth] = todayStr.split('-').map(Number);

  const [viewYear, setViewYear] = useState<number>(todayYear);
  const [viewMonthIndex, setViewMonthIndex] = useState<number>(todayMonth - 1);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const calendarData = useMemo(
    () =>
      buildMonthlyDueCalendar({
        year: viewYear,
        monthIndex: viewMonthIndex,
        recurring,
        debtsCredits,
        accounts,
        fxSettings,
        todayStr,
      }),
    [viewYear, viewMonthIndex, recurring, debtsCredits, accounts, fxSettings, todayStr]
  );

  const locale = isDe ? 'de-DE' : isEn ? 'en-US' : 'it-IT';
  const monthLabel = useMemo(() => {
    const raw = new Date(viewYear, viewMonthIndex, 1).toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric',
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [viewYear, viewMonthIndex, locale]);

  const weekdays = isDe
    ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
    : isEn
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  const handlePrevMonth = () => {
    if (viewMonthIndex === 0) {
      setViewYear((y) => y - 1);
      setViewMonthIndex(11);
      setSelectedDate(`${viewYear - 1}-12-01`);
    } else {
      const nextM = viewMonthIndex - 1;
      setViewMonthIndex(nextM);
      setSelectedDate(`${viewYear}-${String(nextM + 1).padStart(2, '0')}-01`);
    }
  };

  const handleNextMonth = () => {
    if (viewMonthIndex === 11) {
      setViewYear((y) => y + 1);
      setViewMonthIndex(0);
      setSelectedDate(`${viewYear + 1}-01-01`);
    } else {
      const nextM = viewMonthIndex + 1;
      setViewMonthIndex(nextM);
      setSelectedDate(`${viewYear}-${String(nextM + 1).padStart(2, '0')}-01`);
    }
  };

  const handleGoToday = () => {
    setViewYear(todayYear);
    setViewMonthIndex(todayMonth - 1);
    setSelectedDate(todayStr);
  };

  const isViewingCurrentMonth = viewYear === todayYear && viewMonthIndex === todayMonth - 1;
  const selectedEvents: CalendarDueEvent[] = calendarData.eventsByDate[selectedDate] || [];

  const cells: Array<{ day: number | null; iso?: string }> = [];
  for (let i = 0; i < calendarData.firstWeekdayMon0; i += 1) {
    cells.push({ day: null });
  }
  for (let day = 1; day <= calendarData.daysInMonth; day += 1) {
    const iso = `${calendarData.monthKey}-${String(day).padStart(2, '0')}`;
    cells.push({ day, iso });
  }

  return (
    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-3">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
            {monthLabel}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {!isViewingCurrentMonth && (
            <button
              type="button"
              onClick={handleGoToday}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-[10px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/25 transition"
            >
              {isDe ? 'Heute' : isEn ? 'Today' : 'Oggi'}
            </button>
          )}
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label={isDe ? 'Vorheriger Monat' : isEn ? 'Previous month' : 'Mese precedente'}
            className="min-w-[36px] min-h-[36px] p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label={isDe ? 'Nächster Monat' : isEn ? 'Next month' : 'Mese successivo'}
            className="min-w-[36px] min-h-[36px] p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month Summary Strip */}
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {isDe ? 'Einnahmen' : isEn ? 'Inflows' : 'Entrate mese'}
          </div>
          <div className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums truncate mt-0.5">
            +{formatCurrency(calendarData.totalExpectedIncome, true, fxSettings.baseCurrency)}
          </div>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {isDe ? 'Ausgaben' : isEn ? 'Outflows' : 'Uscite mese'}
          </div>
          <div className="font-bold text-rose-600 dark:text-rose-400 tabular-nums truncate mt-0.5">
            -{formatCurrency(calendarData.totalExpectedExpense, true, fxSettings.baseCurrency)}
          </div>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {isDe ? 'Termine' : isEn ? 'Events' : 'Scadenze'}
          </div>
          <div className="font-bold text-slate-900 dark:text-white tabular-nums truncate mt-0.5">
            {calendarData.eventCount}
          </div>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((wd) => (
          <div
            key={wd}
            className="text-[10px] font-bold text-slate-500 dark:text-slate-400 py-1"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell.day || !cell.iso) {
            return <div key={`empty_${idx}`} className="min-h-[44px]" />;
          }
          const events = calendarData.eventsByDate[cell.iso] || [];
          const isToday = cell.iso === todayStr;
          const isSelected = cell.iso === selectedDate;
          const hasIncome = events.some((e) => e.direction === 'INCOME');
          const hasExpense = events.some((e) => e.direction === 'EXPENSE');
          const hasDebtCredit = events.some((e) => e.kind !== 'RECURRING');
          const hasOverdue = events.some((e) => e.isOverdue);

          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => setSelectedDate(cell.iso!)}
              className={`min-h-[44px] rounded-xl border flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : isToday
                    ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 border-indigo-300 dark:border-indigo-500/40'
                    : events.length > 0
                      ? 'bg-slate-50 dark:bg-slate-950/70 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/40'
                      : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className={`text-xs tabular-nums ${isToday || isSelected ? 'font-extrabold' : 'font-semibold'}`}>
                {cell.day}
              </span>
              {events.length > 0 ? (
                <span className="flex items-center justify-center gap-0.5">
                  {hasExpense && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-rose-200' : hasOverdue ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                    />
                  )}
                  {hasIncome && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-emerald-200' : 'bg-emerald-500'
                      }`}
                    />
                  )}
                  {hasDebtCredit && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-cyan-200' : 'bg-cyan-500'
                      }`}
                    />
                  )}
                </span>
              ) : (
                <span className="h-1.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{isDe ? 'Ausgabe' : isEn ? 'Expense' : 'Uscita'}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{isDe ? 'Einnahme' : isEn ? 'Income' : 'Entrata'}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>{isDe ? 'Rate / Schuld' : isEn ? 'Debt / Credit' : 'Rata / Debito'}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenRecurringModal}
          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          {isDe ? '+ Termin planen' : isEn ? '+ Schedule' : '+ Nuova scadenza'}
        </button>
      </div>

      {/* Selected Day Agenda */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900 dark:text-white">
            {formatDateEuropean(selectedDate)}
            {selectedDate === todayStr && (
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                {' '}· {isDe ? 'Heute' : isEn ? 'Today' : 'Oggi'}
              </span>
            )}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {selectedEvents.length}{' '}
            {selectedEvents.length === 1
              ? isDe
                ? 'Eintrag'
                : isEn
                  ? 'item'
                  : 'scadenza'
              : isDe
                ? 'Einträge'
                : isEn
                  ? 'items'
                  : 'scadenze'}
          </span>
        </div>

        {selectedEvents.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-1.5">
            {isDe
              ? 'Keine geplanten Fälligkeiten an diesem Tag.'
              : isEn
                ? 'No bills or due dates on this day.'
                : 'Nessuna scadenza prevista per questo giorno.'}
          </p>
        ) : (
          <div className="space-y-1.5">
            {selectedEvents.map((ev) => {
              const isIncome = ev.direction === 'INCOME';
              const isDebtCredit = ev.kind !== 'RECURRING';
              return (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`p-1.5 rounded-lg border flex-shrink-0 ${
                        isDebtCredit
                          ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30'
                          : isIncome
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                      }`}
                    >
                      {isDebtCredit ? (
                        <HandCoins className="w-3.5 h-3.5" />
                      ) : isIncome ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                        <span className="truncate">{ev.title}</span>
                        {ev.isOverdue && (
                          <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {ev.subtitle}
                        {ev.frequency && (
                          <>
                            {' · '}
                            {formatRecurringFrequencyLabel(ev.frequency as any, language)}
                          </>
                        )}
                        {ev.kind !== 'RECURRING' && (
                          <>
                            {' · '}
                            {ev.kind === 'CREDIT'
                              ? isDe
                                ? 'Forderung'
                                : isEn
                                  ? 'Receivable'
                                  : 'Credito'
                              : isDe
                                ? 'Schuld / Rate'
                                : isEn
                                  ? 'Debt / Installment'
                                  : 'Debito / Rata'}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-xs font-extrabold tabular-nums ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(ev.amount, true, ev.currency)}
                    </span>

                    {ev.kind === 'RECURRING' && ev.ruleId && (
                      ev.isAppliedToday ? (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onApplyRecurring(ev.ruleId!)}
                          title={isDe ? 'Jetzt buchen' : isEn ? 'Log now' : 'Registra ora'}
                          className="min-h-[32px] px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold inline-flex items-center gap-1 transition active:scale-95"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>{isDe ? 'Buchen' : isEn ? 'Log' : 'Registra'}</span>
                        </button>
                      )
                    )}

                    {ev.kind !== 'RECURRING' && onOpenDebtsCredits && (
                      <button
                        type="button"
                        onClick={onOpenDebtsCredits}
                        className="min-h-[32px] px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold transition"
                      >
                        {isDe ? 'Öffnen' : isEn ? 'Open' : 'Apri'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
