import React, { useState, useEffect } from 'react';
import { Target, X } from 'lucide-react';
import { Language, Translations, getCategoryDisplayName } from '../utils/translations';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  budgets: Record<string, number>;
  onSaveBudgets: (newBudgets: Record<string, number>) => void;
  language?: Language;
  t?: Translations;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  categories,
  budgets,
  onSaveBudgets,
  language = 'it',
  t,
}) => {
  const [budgetMap, setBudgetMap] = useState<Record<string, number>>({});

  useEffect(() => {
    setBudgetMap({ ...budgets });
  }, [budgets, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (cat: string, val: string) => {
    const num = parseFloat(val);
    setBudgetMap((prev) => {
      const next = { ...prev };
      if (!isNaN(num) && num > 0) {
        next[cat] = num;
      } else {
        delete next[cat];
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBudgets(budgetMap);
    onClose();
  };

  const modalTitle = t?.monthlySpendingBudgets || 'Budget Mensili per Categoria';
  const modalDesc =
    language === 'de'
      ? 'Legen Sie die maximale monatliche Ausgabengrenze für jede Kategorie fest. Leer lassen für kein Limit.'
      : language === 'en'
      ? 'Set maximum monthly spending limit for each category. Leave empty for no limit.'
      : 'Imposta la soglia massima di spesa per ciascuna categoria. Lascia vuoto per non fissare un limite.';

  const saveBtnText =
    language === 'de' ? 'Budget speichern' : language === 'en' ? 'Save Budgets' : 'Salva Budget';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center no-print">
      <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl relative animate-slide-up max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-400" /> {modalTitle}
        </h3>
        <p className="text-[11px] text-slate-400 mb-3">
          {modalDesc}
        </p>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
            {categories.map((cat) => {
              const currentVal = budgetMap[cat] !== undefined ? budgetMap[cat] : '';

              return (
                <div
                  key={cat}
                  className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <span className="text-slate-300 font-medium truncate flex-1">
                    {getCategoryDisplayName(cat, language)}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-slate-500 text-xs">€</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={currentVal}
                      onChange={(e) => handleInputChange(cat, e.target.value)}
                      placeholder="0"
                      className="bg-slate-800 border border-slate-700 text-white text-right rounded-xl px-3 py-1.5 w-24 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-800 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-semibold transition"
            >
              {t?.cancel || 'Annulla'}
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-semibold shadow-lg transition"
            >
              {saveBtnText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
