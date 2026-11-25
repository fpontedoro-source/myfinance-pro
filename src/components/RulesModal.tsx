import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Wand2,
  Plus,
  Trash2,
  Power,
  Sparkles,
  Pencil,
  Check,
} from 'lucide-react';
import { CategoryRule } from '../types/finance';
import { parseTagsInput } from '../utils/categorizationRules';
import { Language, getCategoryDisplayName } from '../utils/translations';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: CategoryRule[];
  categories: string[];
  onSaveRule: (rule: CategoryRule) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string) => void;
  onApplyToHistory: () => void;
  language?: Language;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose,
  rules,
  categories,
  onSaveRule,
  onDeleteRule,
  onToggleRule,
  onApplyToHistory,
  language = 'it',
}) => {
  const isDe = language === 'de';
  const isEn = language === 'en';

  const [editingRule, setEditingRule] = useState<CategoryRule | null>(null);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Altro');
  const [tagsInput, setTagsInput] = useState('');
  const [ruleType, setRuleType] = useState<'ANY' | 'EXPENSE' | 'INCOME'>('EXPENSE');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const keywordInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEditingRule(null);
      setKeyword('');
      setCategory(categories[0] || 'Altro');
      setTagsInput('');
      setRuleType('EXPENSE');
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingRule(null);
    setKeyword('');
    setCategory(categories[0] || 'Altro');
    setTagsInput('');
    setRuleType('EXPENSE');
  };

  const handleStartEdit = (rule: CategoryRule) => {
    setEditingRule(rule);
    setKeyword(rule.keyword);
    setCategory(rule.category || categories[0] || 'Altro');
    setTagsInput(rule.tags && rule.tags.length > 0 ? rule.tags.map((t) => `#${t}`).join(', ') : '');
    setRuleType(rule.type || 'ANY');

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setTimeout(() => {
      keywordInputRef.current?.focus();
    }, 50);
  };

  const handleSubmitRule = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedKeyword = keyword.trim();
    if (!cleanedKeyword) return;

    const tags = parseTagsInput(tagsInput);
    onSaveRule({
      id: editingRule ? editingRule.id : `rule_${Date.now()}`,
      keyword: cleanedKeyword,
      category: category || categories[0] || 'Altro',
      tags: tags.length > 0 ? tags : undefined,
      type: ruleType,
      enabled: editingRule ? editingRule.enabled : true,
    });

    resetForm();
  };

  const selectableCategories =
    category && !categories.includes(category) ? [category, ...categories] : categories;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center no-print">
      <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl relative animate-slide-up max-h-[90vh] flex flex-col">
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-3 pr-10">
          <div className="p-2 bg-purple-500/15 text-purple-300 rounded-xl border border-purple-500/30">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">
              {isDe
                ? 'Auto-Regeln & Tags'
                : isEn
                  ? 'Auto-Categorization & Tags'
                  : 'Regole Automatiche & Tag'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isDe
                ? 'Ordnet Buchungen & CSV automatisch Kategorie und Tags zu'
                : isEn
                  ? 'Auto-assign categories and tags to new entries & CSV imports'
                  : 'Assegna in automatico categoria e #tag a nuovi movimenti e CSV'}
            </p>
          </div>
        </div>

        <div ref={scrollContainerRef} className="overflow-y-auto no-scrollbar flex-1 space-y-4">
          <form
            onSubmit={handleSubmitRule}
            className={`bg-slate-950 p-3.5 rounded-2xl border space-y-2.5 transition ${
              editingRule ? 'border-indigo-500/60 ring-1 ring-indigo-500/30' : 'border-slate-800'
            }`}
          >
            {editingRule && (
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-800">
                <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5" />
                  <span>
                    {isDe
                      ? 'Regel wird bearbeitet'
                      : isEn
                        ? 'Editing existing rule'
                        : 'Modifica regola esistente'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[11px] text-slate-400 hover:text-white font-semibold"
                >
                  {isDe ? 'Abbrechen' : isEn ? 'Cancel' : 'Annulla'}
                </button>
              </div>
            )}

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                {isDe
                  ? 'Schlüsselwörter (kommagetrennt)'
                  : isEn
                    ? 'Keywords (comma-separated)'
                    : 'Parole chiave nella descrizione (separate da virgola)'}
              </label>
              <input
                ref={keywordInputRef}
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                required
                placeholder={
                  isDe
                    ? 'z.B. rewe, aldi, lidl'
                    : isEn
                      ? 'e.g. uber, starbucks, amazon'
                      : 'es. esselunga, coop, lidl'
                }
                className="w-full select-text bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {isDe ? 'Kategorie' : isEn ? 'Category' : 'Categoria'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-purple-500"
                >
                  {selectableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryDisplayName(cat, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {isDe ? 'Typ' : isEn ? 'Type' : 'Tipo'}
                </label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as 'ANY' | 'EXPENSE' | 'INCOME')}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="EXPENSE">{isDe ? 'Ausgaben' : isEn ? 'Expenses' : 'Uscite'}</option>
                  <option value="INCOME">{isDe ? 'Einnahmen' : isEn ? 'Income' : 'Entrate'}</option>
                  <option value="ANY">{isDe ? 'Alle' : isEn ? 'Any' : 'Tutti'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                {isDe
                  ? 'Automatische Tags (optional)'
                  : isEn
                    ? 'Auto tags (optional)'
                    : 'Tag automatici (opzionale, es. #spesa, #lavoro)'}
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="#supermercato, #casa"
                className="w-full select-text bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex gap-2">
              {editingRule && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-[42px] px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  {isDe ? 'Abbrechen' : isEn ? 'Cancel' : 'Annulla'}
                </button>
              )}
              <button
                type="submit"
                className={`flex-1 min-h-[42px] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  editingRule
                    ? 'bg-indigo-600 hover:bg-indigo-500'
                    : 'bg-purple-600 hover:bg-purple-500'
                }`}
              >
                {editingRule ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>
                  {editingRule
                    ? isDe
                      ? 'Änderungen speichern'
                      : isEn
                        ? 'Save Changes'
                        : 'Salva Modifiche'
                    : isDe
                      ? 'Regel hinzufügen'
                      : isEn
                        ? 'Add Rule'
                        : 'Aggiungi Regola'}
                </span>
              </button>
            </div>
          </form>

          {/* Apply Rules Retroactively */}
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-[11px] font-semibold text-slate-400">
              {isDe
                ? `Aktive Regeln (${rules.filter((r) => r.enabled).length}/${rules.length})`
                : isEn
                  ? `Active rules (${rules.filter((r) => r.enabled).length}/${rules.length})`
                  : `Regole attive (${rules.filter((r) => r.enabled).length}/${rules.length})`}
            </span>
            <button
              type="button"
              onClick={onApplyToHistory}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isDe
                  ? 'Auf Verlauf anwenden'
                  : isEn
                    ? 'Apply to History'
                    : 'Applica allo storico'}
              </span>
            </button>
          </div>

          <div className="space-y-2">
            {rules.map((rule) => {
              const isBeingEdited = editingRule?.id === rule.id;
              return (
                <div
                  key={rule.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition ${
                    isBeingEdited
                      ? 'bg-indigo-950/40 border-indigo-500/60'
                      : rule.enabled
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-950/50 border-slate-800/40 opacity-60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleStartEdit(rule)}
                    className="min-w-0 flex-1 text-left group"
                    title={isDe ? 'Klicken zum Bearbeiten' : isEn ? 'Tap to edit' : 'Tocca per modificare'}
                  >
                    <div className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition">
                      {rule.keyword}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      <span className="text-purple-300 font-medium">
                        {getCategoryDisplayName(rule.category, language)}
                      </span>
                      {rule.tags && rule.tags.length > 0 && (
                        <>
                          {' · '}
                          <span className="text-cyan-300">
                            {rule.tags.map((t) => `#${t}`).join(' ')}
                          </span>
                        </>
                      )}
                      {rule.type && rule.type !== 'ANY' && (
                        <>
                          {' · '}
                          <span>
                            {rule.type === 'INCOME'
                              ? isDe
                                ? 'Einnahmen'
                                : isEn
                                  ? 'Income'
                                  : 'Entrate'
                              : isDe
                                ? 'Ausgaben'
                                : isEn
                                  ? 'Expenses'
                                  : 'Uscite'}
                          </span>
                        </>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(rule)}
                      title={isDe ? 'Bearbeiten' : isEn ? 'Edit' : 'Modifica'}
                      className={`min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center transition ${
                        isBeingEdited
                          ? 'text-indigo-300 bg-indigo-500/20'
                          : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800'
                      }`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleRule(rule.id)}
                      title={
                        rule.enabled
                          ? isDe ? 'Deaktivieren' : isEn ? 'Disable' : 'Disattiva'
                          : isDe ? 'Aktivieren' : isEn ? 'Enable' : 'Attiva'
                      }
                      className={`min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center transition ${
                        rule.enabled
                          ? 'text-emerald-400 hover:bg-slate-800'
                          : 'text-slate-500 hover:bg-slate-800'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingRule?.id === rule.id) resetForm();
                        onDeleteRule(rule.id);
                      }}
                      title={isDe ? 'Löschen' : isEn ? 'Delete' : 'Elimina'}
                      className="min-w-[36px] min-h-[36px] rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 flex items-center justify-center transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 font-semibold"
          >
            {isDe ? 'Schließen' : isEn ? 'Close' : 'Chiudi'}
          </button>
        </div>
      </div>
    </div>
  );
};
