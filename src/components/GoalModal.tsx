import React, { useState, useEffect } from 'react';
import { Trophy, X, AlertTriangle } from 'lucide-react';
import { Goal } from '../types/finance';
import { Language, Translations } from '../utils/translations';
import { getCurrencySymbol } from '../utils/formatters';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal: Goal | null;
  onSaveGoal: (goal: Goal) => void;
  language?: Language;
  t?: Translations;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  editingGoal,
  onSaveGoal,
  language = 'it',
  t,
}) => {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const currencySym = getCurrencySymbol();

  useEffect(() => {
    setFormError(null);
    if (editingGoal) {
      setTitle(editingGoal.title);
      setTarget(editingGoal.target.toString());
      setCurrent(editingGoal.current?.toString() || '0');
      setTargetDate(editingGoal.targetDate || '');
    } else {
      setTitle('');
      setTarget('');
      setCurrent('0');
      setTargetDate('');
    }
  }, [editingGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(target.replace(',', '.'));
    const parsedCurrent = parseFloat(current.replace(',', '.')) || 0;

    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setFormError(
        language === 'de'
          ? 'Bitte einen gültigen Zielbetrag (> 0) eingeben.'
          : language === 'en'
            ? 'Please enter a valid target amount (> 0).'
            : 'Inserisci un importo target valido.'
      );
      return;
    }

    const defaultGoalTitle =
      language === 'de'
        ? 'Sparziel'
        : language === 'en'
          ? 'Savings Goal'
          : 'Obiettivo di Risparmio';

    onSaveGoal({
      id: editingGoal ? editingGoal.id : Date.now().toString(),
      title: title.trim() || defaultGoalTitle,
      target: parsedTarget,
      current: parsedCurrent,
      targetDate: targetDate || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-100/90 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center no-print">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-300 dark:border-slate-700 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>
            {editingGoal
              ? language === 'de'
                ? 'Sparziel bearbeiten'
                : language === 'en'
                  ? 'Edit Goal'
                  : 'Modifica Obiettivo'
              : language === 'de'
                ? 'Neues Sparziel'
                : language === 'en'
                  ? 'New Savings Goal'
                  : 'Nuovo Obiettivo di Risparmio'}
          </span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {formError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
              {language === 'de'
                ? 'Zielname'
                : language === 'en'
                  ? 'Goal Name'
                  : 'Nome Obiettivo'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={
                language === 'de'
                  ? 'z. B. Notgroschen, Sommerurlaub...'
                  : language === 'en'
                    ? 'e.g. Emergency Fund, Summer Vacation...'
                    : 'es. Fondo di Emergenza, Vacanze Estive...'
              }
              className="w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
              {language === 'de'
                ? `Zielbetrag (${currencySym})`
                : language === 'en'
                  ? `Target Amount (${currencySym})`
                  : `Importo Target (${currencySym})`}
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                if (formError) setFormError(null);
              }}
              required
              placeholder="1000.00"
              className="w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-base font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
              {language === 'de'
                ? `Aktuell gesparter Betrag (${currencySym})`
                : language === 'en'
                  ? `Currently Saved Amount (${currencySym})`
                  : `Importo Attualmente Risparmiato (${currencySym})`}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
              {language === 'de'
                ? 'Zieldatum (Optional)'
                : language === 'en'
                  ? 'Target Date (Optional)'
                  : 'Data Obiettivo (Opzionale)'}
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl text-xs font-semibold transition"
            >
              {t?.cancel || 'Annulla'}
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 transition"
            >
              {editingGoal
                ? language === 'de'
                  ? 'Ziel aktualisieren'
                  : language === 'en'
                    ? 'Update Goal'
                    : 'Aggiorna Obiettivo'
                : language === 'de'
                  ? 'Ziel speichern'
                  : language === 'en'
                    ? 'Save Goal'
                    : 'Salva Obiettivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
