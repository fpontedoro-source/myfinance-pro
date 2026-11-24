import React from 'react';
import { BellRing, ArrowUpRight, ArrowDownLeft, X, ArrowRight, CheckCheck } from 'lucide-react';
import { Account } from '../types/finance';
import {
  AutoRecurringNotification,
  BrowserNotifPermissionState,
} from '../utils/recurringNotifications';
import { formatCurrency, formatDateEuropean, getAccountDisplayName } from '../utils/formatters';
import { Language, getCategoryDisplayName } from '../utils/translations';

interface RecurringNotificationsBannerProps {
  notifications: AutoRecurringNotification[];
  accounts: Account[];
  language: Language;
  browserNotifStatus: BrowserNotifPermissionState;
  onEnableBrowserNotifications: () => void;
  onDismissOne: (id: string) => void;
  onDismissAll: () => void;
  onViewTransactions: () => void;
}

export const RecurringNotificationsBanner: React.FC<RecurringNotificationsBannerProps> = ({
  notifications,
  accounts,
  language,
  browserNotifStatus,
  onEnableBrowserNotifications,
  onDismissOne,
  onDismissAll,
  onViewTransactions,
}) => {
  if (notifications.length === 0) return null;

  const isDe = language === 'de';
  const isEn = language === 'en';

  return (
    <section
      aria-label={
        isDe
          ? 'Automatische Terminbuchungen'
          : isEn
            ? 'Automatic Scheduler Notifications'
            : 'Notifiche Scadenzario'
      }
      className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/40 shadow-lg space-y-2.5 animate-slide-up"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0">
            <BellRing className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">
              {isDe
                ? 'Terminplaner · Automatische Buchung'
                : isEn
                  ? 'Scheduler · Auto-Recorded Entry'
                  : 'Scadenzario · Registrazione Automatica'}
            </h4>
            <p className="text-[10px] text-amber-200/80 truncate">
              {isDe
                ? `${notifications.length} Benachrichtigung(en) bei Fälligkeit`
                : isEn
                  ? `${notifications.length} notification(s) on due date`
                  : `${notifications.length} notific${notifications.length === 1 ? 'a ricevuta' : 'he ricevute'} alla scadenza`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismissAll}
          className="text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 flex-shrink-0 transition"
          title={isDe ? 'Alle schließen' : isEn ? 'Mark all as read' : 'Segna tutte come lette'}
        >
          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isDe ? 'Alle lesen' : isEn ? 'Dismiss all' : 'Chiudi tutte'}</span>
        </button>
      </div>

      {/* Recorded Movements List */}
      <div className="space-y-1.5">
        {notifications.slice(0, 4).map((item) => {
          const isExpense = item.type === 'EXPENSE';
          const accName = getAccountDisplayName(item.account, accounts);
          const catLabel = getCategoryDisplayName(item.category, language);

          const directionHeadline = isExpense
            ? isDe
              ? 'Du hast eine Ausgabe'
              : isEn
                ? 'You have an outgoing expense'
                : 'Hai un movimento in uscita'
            : isDe
              ? 'Du hast eine Einnahme'
              : isEn
                ? 'You have an incoming entry'
                : 'Hai un movimento in entrata';

          return (
            <div
              key={item.id}
              className={`p-2.5 rounded-xl border flex items-start justify-between gap-2.5 ${
                isExpense
                  ? 'bg-rose-950/30 border-rose-500/30'
                  : 'bg-emerald-950/30 border-emerald-500/30'
              }`}
            >
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <div
                  className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                    isExpense
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {isExpense ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide ${
                        isExpense ? 'text-rose-300' : 'text-emerald-300'
                      }`}
                    >
                      {directionHeadline}
                    </span>
                    <span
                      className={`text-xs font-extrabold tabular-nums flex-shrink-0 ${
                        isExpense ? 'text-rose-300' : 'text-emerald-300'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {formatCurrency(item.amount, true, item.currency)}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-white truncate mt-0.5">
                    {item.description}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {accName} · {catLabel} · {formatDateEuropean(item.dueDate)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDismissOne(item.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/70 transition flex-shrink-0"
                aria-label={isDe ? 'Benachrichtigung schließen' : isEn ? 'Dismiss' : 'Chiudi notifica'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {notifications.length > 4 && (
          <p className="text-[10px] text-slate-400 text-center">
            {isDe
              ? `+ ${notifications.length - 4} weitere automatische Buchungen`
              : isEn
                ? `+ ${notifications.length - 4} more auto-recorded entries`
                : `+ altri ${notifications.length - 4} movimenti registrati automaticamente`}
          </p>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <button
          type="button"
          onClick={onViewTransactions}
          className="text-[11px] font-bold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 transition"
        >
          <span>
            {isDe
              ? 'Buchungen ansehen'
              : isEn
                ? 'View Transactions'
                : 'Vedi Movimenti'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {browserNotifStatus === 'default' && (
          <button
            type="button"
            onClick={onEnableBrowserNotifications}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/35 text-amber-200 text-[10px] font-bold inline-flex items-center gap-1 transition"
          >
            <BellRing className="w-3 h-3" />
            <span>
              {isDe
                ? 'Geräte-Benachrichtigungen aktivieren'
                : isEn
                  ? 'Enable Device Alerts'
                  : 'Attiva Notifiche Dispositivo'}
            </span>
          </button>
        )}
      </div>
    </section>
  );
};
