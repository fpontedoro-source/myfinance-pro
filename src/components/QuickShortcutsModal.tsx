import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, Plus, Trash2, RotateCcw, ArrowDownLeft, ArrowUpRight, Pencil, Check } from 'lucide-react';
import { Account, QuickShortcut } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { parseTagsInput } from '../utils/categorizationRules';
import { DEFAULT_QUICK_SHORTCUTS } from '../utils/quickShortcuts';
import { Language, getCategoryDisplayName } from '../utils/translations';

interface QuickShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: QuickShortcut[];
  accounts: Account[];
  categories: string[];
  onSaveShortcuts: (next: QuickShortcut[]) => void;
  onShowToast?: (msg: string) => void;
  language?: Language;
}

export const QuickShortcutsModal: React.FC<QuickShortcutsModalProps> = ({
  isOpen,
  onClose,
  shortcuts,
  accounts,
  categories,
  onSaveShortcuts,
  onShowToast,
  language = 'it',
}) => {
  const isDe = language === 'de';
  const isEn = language === 'en';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState(accounts[0]?.id || '');
  const [category, setCategory] = useState(categories[0] || 'Altro');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const labelInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEditingId(null);
      setLabel('');
      setType('EXPENSE');
      setAmount('');
      setAccount(accounts[0]?.id || '');
      setCategory(categories[0] || 'Altro');
      setDescription('');
      setTagsInput('');
      setFormError(null);
    }
  }, [isOpen, accounts, categories]);

  if (!isOpen) return null;

  const startEdit = (sc: QuickShortcut) => {
    setEditingId(sc.id);
    setLabel(sc.label);
    setType(sc.type);
    setAmount(String(sc.amount));
    const matchedAcc = accounts.find((a) => a.id === sc.account || a.name === sc.account);
    setAccount(matchedAcc?.id || accounts[0]?.id || sc.account);
    setCategory(sc.category || categories[0] || 'Altro');
    setDescription(sc.description || sc.label);
    setTagsInput((sc.tags || []).map((t) => `#${t}`).join(' '));
    setFormError(null);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      labelInputRef.current?.focus();
      labelInputRef.current?.select();
    }, 60);
  };

  const resetForm = () => {
    setEditingId(null);
    setLabel('');
    setType('EXPENSE');
    setAmount('');
    setAccount(accounts[0]?.id || '');
    setCategory(categories[0] || 'Altro');
    setDescription('');
    setTagsInput('');
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedLabel = label.trim();
    const parsedAmt = parseFloat(amount.replace(',', '.'));
    if (!trimmedLabel) {
      setFormError(
        isDe
          ? 'Bitte Namen der Verknüpfung eingeben.'
          : isEn
            ? 'Please enter a shortcut label.'
            : 'Inserisci un nome breve per la scorciatoia.'
      );
      return;
    }
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setFormError(
        isDe
          ? 'Bitte einen gültigen Betrag > 0 eingeben.'
          : isEn
            ? 'Please enter a valid amount > 0.'
            : 'Inserisci un importo valido maggiore di 0.'
      );
      return;
    }

    const tags = parseTagsInput(tagsInput);
    const nextItem: QuickShortcut = {
      id: editingId || `sc_${Date.now()}`,
      label: trimmedLabel,
      type,
      amount: parsedAmt,
      account: account || accounts[0]?.id || 'Girokonto',
      category: category || 'Altro',
      description: description.trim() || trimmedLabel,
      tags: tags.length > 0 ? tags : undefined,
    };

    const nextList = editingId
      ? shortcuts.map((s) => (s.id === editingId ? nextItem : s))
      : [...shortcuts, nextItem];

    onSaveShortcuts(nextList);
    if (onShowToast) {
      onShowToast(
        isDe
          ? 'Favorit gespeichert!'
          : isEn
            ? 'Favorite shortcut saved!'
            : 'Scorciatoia salvata!'
      );
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    onSaveShortcuts(shortcuts.filter((s) => s.id !== id));
    if (editingId === id) resetForm();
    if (onShowToast) {
      onShowToast(
        isDe ? 'Favorit gelöscht' : isEn ? 'Shortcut deleted' : 'Scorciatoia eliminata'
      );
    }
  };

  const handleRestoreDefaults = () => {
    onSaveShortcuts(DEFAULT_QUICK_SHORTCUTS);
    resetForm();
    if (onShowToast) {
      onShowToast(
        isDe
          ? 'Standard-Favoriten wiederhergestellt'
          : isEn
            ? 'Default shortcuts restored'
            : 'Scorciatoie predefinite ripristinate'
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-100/90 dark:bg-slate-950/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 shadow-2xl relative max-h-[92vh] flex flex-col">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label={isDe ? 'Schließen' : isEn ? 'Close' : 'Chiudi'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pr-8 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/35 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isDe
                ? 'Favoriten-Verknüpfungen (1-Klick)'
                : isEn
                  ? 'Favorite Quick Actions (1-Tap)'
                  : 'Spese Preferite (1-Tap)'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isDe
                ? 'Voreingestellte Tasten für tägliche Zahlungen in der Home-Ansicht'
                : isEn
                  ? 'Preset buttons in Home to log everyday purchases with one tap'
                  : 'Pulsanti rapidi in Home per registrare spese quotidiane con un tocco'}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Existing Shortcuts List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isDe
                  ? `Aktive Favoriten (${shortcuts.length})`
                  : isEn
                    ? `Active Shortcuts (${shortcuts.length})`
                    : `Scorciatoie Attive (${shortcuts.length})`}
              </span>
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>
                  {isDe ? 'Standard' : isEn ? 'Reset defaults' : 'Predefinite'}
                </span>
              </button>
            </div>

            {shortcuts.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400">
                {isDe
                  ? 'Keine Favoriten gespeichert. Füge unten einen neuen hinzu.'
                  : isEn
                    ? 'No shortcuts saved yet. Add one below.'
                    : 'Nessuna scorciatoia salvata. Aggiungine una qui sotto.'}
              </div>
            ) : (
              <div className="space-y-2">
                {shortcuts.map((sc) => {
                  const accObj = accounts.find((a) => a.id === sc.account || a.name === sc.account);
                  const isExp = sc.type === 'EXPENSE';
                  const isBeingEdited = editingId === sc.id;
                  return (
                    <div
                      key={sc.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition ${
                        isBeingEdited
                          ? 'bg-indigo-50 dark:bg-indigo-950/35 border-indigo-500/70'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => startEdit(sc)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white truncate">{sc.label}</span>
                          <span
                            className={`text-xs font-extrabold tabular-nums ${
                              isExp ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {isExp ? '-' : '+'}
                            {formatCurrency(sc.amount, true, accObj?.currency)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          <span>{accObj?.name || sc.account}</span>
                          <span> · </span>
                          <span>{getCategoryDisplayName(sc.category, language)}</span>
                          {sc.tags && sc.tags.length > 0 && (
                            <>
                              <span> · </span>
                              <span className="text-cyan-700 dark:text-cyan-300">
                                {sc.tags.map((t) => `#${t}`).join(' ')}
                              </span>
                            </>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(sc)}
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition"
                          aria-label={isDe ? 'Bearbeiten' : isEn ? 'Edit' : 'Modifica'}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(sc.id)}
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-800 transition"
                          aria-label={isDe ? 'Löschen' : isEn ? 'Delete' : 'Elimina'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add / Edit Form */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border space-y-3 transition ${
              editingId ? 'border-amber-500/70 ring-1 ring-amber-500/25' : 'border-indigo-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                {editingId ? <Pencil className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> : <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                <span>
                  {editingId
                    ? isDe
                      ? 'Favorit bearbeiten'
                      : isEn
                        ? 'Edit Shortcut'
                        : 'Modifica Scorciatoia'
                    : isDe
                      ? 'Neuen Favoriten erstellen'
                      : isEn
                        ? 'New Favorite Shortcut'
                        : 'Nuova Scorciatoia Rapida'}
                </span>
              </span>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  {isDe ? 'Abbrechen' : isEn ? 'Cancel edit' : 'Annulla modifica'}
                </button>
              )}
            </div>

            {/* Type Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  type === 'EXPENSE'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-700 dark:text-rose-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{isDe ? 'Ausgabe' : isEn ? 'Expense' : 'Uscita'}</span>
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  type === 'INCOME'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>{isDe ? 'Einnahme' : isEn ? 'Income' : 'Entrata'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  {isDe ? 'Tastenname' : isEn ? 'Button Label' : 'Nome Pulsante'}
                </label>
                <input
                  ref={labelInputRef}
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={isDe ? 'z. B. Kaffee' : isEn ? 'e.g. Coffee' : 'es. Caffè'}
                  maxLength={22}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 select-text"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  {isDe ? 'Betrag' : isEn ? 'Amount' : 'Importo'}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1.50"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white tabular-nums focus:outline-none focus:border-indigo-500 select-text"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  {isDe ? 'Konto' : isEn ? 'Account' : 'Conto'}
                </label>
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency || 'EUR'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  {isDe ? 'Kategorie' : isEn ? 'Category' : 'Categoria'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryDisplayName(cat, language)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  {isDe ? 'Beschreibung (optional)' : isEn ? 'Description (optional)' : 'Descrizione (opzionale)'}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isDe ? 'z. B. Kaffee Bar' : isEn ? 'e.g. Morning coffee' : 'es. Caffè al bar'}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  {isDe ? '#Tags (optional)' : isEn ? '#Tags (optional)' : '#Tag (opzionali)'}
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="#caffe #bar"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {formError && (
              <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px]">
                {formError}
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[42px] py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.99]"
            >
              {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>
                {editingId
                  ? isDe
                    ? 'Änderungen speichern'
                    : isEn
                      ? 'Save Changes'
                      : 'Salva Modifiche'
                  : isDe
                    ? 'Favorit hinzufügen'
                    : isEn
                      ? 'Add Shortcut'
                      : 'Aggiungi Scorciatoia'}
              </span>
            </button>
          </form>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
          >
            {isDe ? 'Schließen' : isEn ? 'Close' : 'Chiudi'}
          </button>
        </div>
      </div>
    </div>
  );
};
