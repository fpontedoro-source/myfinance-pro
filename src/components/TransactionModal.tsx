import React, { useEffect, useState } from 'react';
import {
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Account, CategoryRule, Transaction } from '../types/finance';
import { CategoryIcon, getCategoryColorDetails } from './CategoryIcon';
import { Language, Translations, getCategoryDisplayName } from '../utils/translations';
import { getCurrencySymbol, getCurrencyCode } from '../utils/formatters';
import {
  matchCategorizationRule,
  mergeUniqueTags,
  normalizeTag,
  parseTagsInput,
} from '../utils/categorizationRules';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: string[];
  categoryRules?: CategoryRule[];
  availableTags?: string[];
  editingTransaction: Transaction | null;
  onSave: (txData: {
    id?: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    account: string;
    category: string;
    description: string;
    notes?: string;
    tags?: string[];
    date: string;
  }) => void;
  language?: Language;
  t?: Translations;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  categoryRules = [],
  availableTags = [],
  editingTransaction,
  onSave,
  language = 'it',
  t,
}) => {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [account, setAccount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState<string>('');
  const [manualCategoryPicked, setManualCategoryPicked] = useState(false);
  const [matchedRuleName, setMatchedRuleName] = useState<string | null>(null);
  const [date, setDate] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormError(null);
    setTagDraft('');
    setMatchedRuleName(null);
    if (editingTransaction) {
      setManualCategoryPicked(true);
      setType(editingTransaction.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
      setAmount(editingTransaction.amount.toString());
      const matched = accounts.find(
        (a) => a.id === editingTransaction.account || a.name === editingTransaction.account
      );
      setAccount(matched ? matched.id : editingTransaction.account || accounts[0]?.id || '');
      setCategory(editingTransaction.category || categories[0] || '');
      setDescription(editingTransaction.description || '');
      setNotes(editingTransaction.notes || '');
      setTags(editingTransaction.tags || []);
      setDate(editingTransaction.date);
    } else {
      setManualCategoryPicked(false);
      setType('EXPENSE');
      setAmount('');
      setAccount(accounts[0]?.id || '');
      setCategory(categories[0] || '');
      setDescription('');
      setNotes('');
      setTags([]);
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [editingTransaction, accounts, categories, isOpen]);

  useEffect(() => {
    if (!isOpen || editingTransaction || categoryRules.length === 0) return;
    if (!description.trim() && !notes.trim()) {
      setMatchedRuleName(null);
      return;
    }
    const matched = matchCategorizationRule(description, notes, type, categoryRules, categories);
    if (matched) {
      if (!manualCategoryPicked && matched.category) {
        setCategory(matched.category);
      }
      if (matched.tags.length > 0) {
        setTags((prev) => mergeUniqueTags(prev, matched.tags));
      }
      setMatchedRuleName(matched.rule?.keyword || null);
    } else {
      setMatchedRuleName(null);
    }
  }, [description, notes, type, isOpen, editingTransaction, categoryRules, categories, manualCategoryPicked]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError(
        language === 'de'
          ? 'Bitte einen gültigen Betrag größer als 0 eingeben.'
          : language === 'en'
            ? 'Please enter a valid amount greater than 0.'
            : 'Inserisci un importo valido maggiore di zero.'
      );
      return;
    }

    const selectedAcc = accounts.find((a) => a.id === account || a.name === account);
    const resolvedAccountName = selectedAcc ? selectedAcc.name : account || accounts[0]?.name || '';
    const defaultDesc =
      type === 'INCOME'
        ? language === 'de'
          ? 'Einnahme'
          : language === 'en'
            ? 'Income'
            : 'Entrata'
        : language === 'de'
          ? 'Ausgabe'
          : language === 'en'
            ? 'Expense'
            : 'Spesa';

    const pendingDraftTags = parseTagsInput(tagDraft);
    const finalTags = mergeUniqueTags(tags, pendingDraftTags);

    onSave({
      id: editingTransaction?.id,
      type,
      amount: parsedAmount,
      account: resolvedAccountName,
      category: category || categories[0] || '',
      description: description.trim() || defaultDesc,
      notes: notes.trim() || undefined,
      tags: finalTags.length > 0 ? finalTags : undefined,
      date: date || new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-100/90 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center no-print">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-300 dark:border-slate-700 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 pr-10">
          <PlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>
            {editingTransaction
              ? language === 'de'
                ? 'Buchung bearbeiten'
                : language === 'en'
                ? 'Edit Transaction'
                : 'Modifica Movimento'
              : language === 'de'
              ? 'Buchung erfassen'
              : language === 'en'
              ? 'Add Transaction'
              : 'Registra Movimento'}
          </span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {formError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          {/* Expense / Income Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`py-2.5 text-xs font-semibold rounded-lg transition-all shadow ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 inline mr-1" /> {t?.expenseWord || 'Uscita'}
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`py-2.5 text-xs font-semibold rounded-lg transition-all shadow ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 inline mr-1" /> {t?.incomeWord || 'Entrata'}
            </button>
          </div>

          {(() => {
            const selectedAccObj = accounts.find((a) => a.id === account || a.name === account);
            const activeSymbol = getCurrencySymbol(selectedAccObj?.currency);
            const activeCode = getCurrencyCode(selectedAccObj?.currency);

            return (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      {language === 'de' ? `Betrag (${activeSymbol})` : language === 'en' ? `Amount (${activeSymbol})` : `Importo (${activeSymbol})`}
                    </label>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      {activeCode} ({activeSymbol})
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      placeholder="0.00"
                      autoFocus
                      className="w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-4 pr-12 py-3 font-bold text-xl focus:outline-none focus:border-indigo-500"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold text-base pointer-events-none">
                      {activeSymbol}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {[5, 10, 20, 50].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          const cur = parseFloat(amount.replace(',', '.')) || 0;
                          setAmount((cur + preset).toFixed(2));
                          if (formError) setFormError(null);
                        }}
                        className="min-h-[34px] rounded-lg bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold tabular-nums transition active:scale-95"
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'de' ? 'Konto auswählen' : language === 'en' ? 'Select Account' : 'Seleziona Conto'}
                  </label>
                  <select
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    required
                    className="w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {accounts.map((acc) => {
                      const sym = getCurrencySymbol(acc.currency);
                      const code = getCurrencyCode(acc.currency);
                      return (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({sym} {code})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </>
            );
          })()}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-slate-500 dark:text-slate-400">
                {t?.categoryFilterLabel || 'Categoria'}
                {matchedRuleName && (
                  <span className="ml-1.5 text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                    · Auto
                  </span>
                )}
              </label>
              {category && (() => {
                const catColor = getCategoryColorDetails(category);
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${catColor.bgLight} ${catColor.textColor} ${catColor.borderColor}`}
                  >
                    <CategoryIcon categoryName={category} className="w-3 h-3" />
                    <span>{getCategoryDisplayName(category, language)}</span>
                  </span>
                );
              })()}
            </div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setManualCategoryPicked(true);
              }}
              required
              className="w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryDisplayName(cat, language)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
              {language === 'de' ? 'Beschreibung' : language === 'en' ? 'Description' : 'Descrizione'}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder={
                language === 'de'
                  ? 'z.B. Supermarkteinkauf, Gehalt, Abonnement...'
                  : language === 'en'
                  ? 'e.g. Grocery shopping, salary, subscription...'
                  : 'es. Spesa supermercato, stipendio, abbonamento...'
              }
              className="w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-slate-500 dark:text-slate-400">
                {language === 'de' ? 'Detaillierte Notizen' : language === 'en' ? 'Detailed Notes' : 'Note Dettagliate'}
              </label>
              <span className="text-[10px] text-slate-500 font-medium">
                {language === 'de' ? 'Optional' : language === 'en' ? 'Optional' : 'Opzionale'}
              </span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={
                language === 'de'
                  ? 'Zusätzliche Notizen, Belegnummer oder Erinnerung...'
                  : language === 'en'
                  ? 'Add extra details, receipt #, notes or reminders...'
                  : 'Aggiungi dettagli aggiuntivi, scontrino #, note o promemoria...'
              }
              className="w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500 resize-none placeholder-slate-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-slate-500 dark:text-slate-400">
                {language === 'de' ? 'Tags' : language === 'en' ? 'Tags' : 'Tag (#)'}
              </label>
              <span className="text-[10px] text-slate-500">
                {language === 'de' ? 'Optional' : language === 'en' ? 'Optional' : 'Opzionale'}
              </span>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tg) => (
                  <button
                    key={tg}
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((item) => item !== tg))}
                    className="px-2 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-800 dark:text-cyan-200 text-[11px] font-medium flex items-center gap-1 hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-800 dark:hover:text-rose-200 transition"
                  >
                    <span>#{tg}</span>
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-1.5">
              <input
                type="text"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const parsed = parseTagsInput(tagDraft);
                    if (parsed.length > 0) {
                      setTags((prev) => mergeUniqueTags(prev, parsed));
                      setTagDraft('');
                    }
                  }
                }}
                placeholder={
                  language === 'de'
                    ? 'z.B. urlaub, arbeit...'
                    : language === 'en'
                      ? 'e.g. vacation, work...'
                      : 'es. viaggio, casa, lavoro...'
                }
                className="flex-1 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => {
                  const parsed = parseTagsInput(tagDraft);
                  if (parsed.length > 0) {
                    setTags((prev) => mergeUniqueTags(prev, parsed));
                    setTagDraft('');
                  }
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-cyan-700 dark:text-cyan-300 text-xs font-semibold transition"
              >
                + Tag
              </button>
            </div>

            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {availableTags
                  .filter((sug) => !tags.includes(normalizeTag(sug)))
                  .slice(0, 6)
                  .map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setTags((prev) => mergeUniqueTags(prev, [sug]))}
                      className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition"
                    >
                      +#{sug}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
              {language === 'de' ? 'Datum' : language === 'en' ? 'Date' : 'Data'}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
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
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
            >
              {editingTransaction
                ? language === 'de'
                  ? 'Buchung aktualisieren'
                  : language === 'en'
                  ? 'Update Transaction'
                  : 'Aggiorna Movimento'
                : language === 'de'
                ? 'Buchung speichern'
                : language === 'en'
                ? 'Save Transaction'
                : 'Salva Movimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
