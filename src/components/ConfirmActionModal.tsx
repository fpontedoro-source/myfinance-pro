import React from 'react';
import { AlertTriangle, X, ArrowRightLeft, Trash2 } from 'lucide-react';
import { Language } from '../utils/translations';

export interface ActionDetail {
  label: string;
  value: string;
}

export interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  warningNote?: string;
  actionType?: 'TRANSFER' | 'DELETE' | 'EXECUTE' | 'RESET' | 'DEFAULT';
  details?: ActionDetail[];
  confirmText?: string;
  cancelText?: string;
  language?: Language;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  warningNote,
  actionType = 'DEFAULT',
  details = [],
  confirmText,
  cancelText,
  language = 'it',
}) => {
  if (!isOpen) return null;

  const isDe = language === 'de';
  const isEn = language === 'en';

  const resolvedTitle =
    title || (isDe ? 'Vorgang bestätigen' : isEn ? 'Confirm Action' : 'Conferma Operazione');
  const resolvedWarning =
    warningNote !== undefined
      ? warningNote
      : isDe
        ? 'Bitte prüfen Sie die Details vor der Ausführung.'
        : isEn
          ? 'Verify the details before running this action.'
          : 'Verifica i dettagli prima di eseguire l\'azione.';
  const resolvedConfirm =
    confirmText || (isDe ? 'Bestätigen' : isEn ? 'Confirm' : 'Conferma ed Esegui');
  const resolvedCancel =
    cancelText || (isDe ? 'Abbrechen' : isEn ? 'Cancel' : 'Annulla');

  const isDestructive = actionType === 'DELETE' || actionType === 'RESET';
  const isTransfer = actionType === 'TRANSFER';

  const getIcon = () => {
    if (isDestructive) return <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />;
    if (isTransfer) return <ArrowRightLeft className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />;
    return <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
  };

  const getIconBg = () => {
    if (isDestructive) return 'bg-rose-500/20 border-rose-500/30';
    if (isTransfer) return 'bg-indigo-500/20 border-indigo-500/30';
    return 'bg-amber-500/20 border-amber-500/30';
  };

  const getConfirmButtonClasses = () => {
    if (isDestructive) {
      return 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-900/40';
    }
    if (isTransfer) {
      return 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-900/40';
    }
    return 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40';
  };

  return (
    <div className="fixed inset-0 bg-slate-100/90 dark:bg-slate-950/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 no-print animate-fade-in">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700/80 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label={isDe ? 'Hinweis schließen' : isEn ? 'Close dialog' : 'Chiudi avviso'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with warning icon and title */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className={`p-3 rounded-2xl border ${getIconBg()} flex items-center justify-center shadow-inner`}>
            {getIcon()}
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />{' '}
              {isDe ? 'Bestätigung erforderlich' : isEn ? 'Confirmation Required' : 'Richiesta Conferma'}
            </div>
            <h3 id="confirm-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {resolvedTitle}
            </h3>
          </div>
        </div>

        {/* Warning / Prompt text box */}
        <div className="bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4 space-y-2">
          <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
            {message}
          </p>

          {resolvedWarning && (
            <div className="text-xs text-amber-700 dark:text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{resolvedWarning}</span>
            </div>
          )}
        </div>

        {/* Action Details breakdown if provided */}
        {details.length > 0 && (
          <div className="bg-slate-100/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 mb-5 divide-y divide-slate-800/60">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center justify-between py-1.5 text-xs first:pt-0 last:pb-0">
                <span className="text-slate-500 dark:text-slate-400 font-medium">{detail.label}</span>
                <span className="text-slate-900 dark:text-white font-semibold">{detail.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Question: execute or cancel */}
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-4 font-medium">
          {isDe
            ? 'Möchten Sie diesen Vorgang jetzt ausführen?'
            : isEn
              ? 'Do you want to proceed with this operation?'
              : 'Vuoi eseguire questa operazione adesso?'}
        </p>

        {/* Action Buttons: Cancel vs Execute */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 active:bg-slate-200 dark:active:bg-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-2xl text-xs font-semibold border border-slate-300/60 dark:border-slate-700/60 transition shadow-sm"
          >
            {resolvedCancel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3 rounded-2xl text-xs font-bold shadow-lg transition active:scale-[0.98] ${getConfirmButtonClasses()}`}
          >
            {resolvedConfirm}
          </button>
        </div>
      </div>
    </div>
  );
};

