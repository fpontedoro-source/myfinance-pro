import React, { useState, useEffect, useRef } from 'react';
import { Settings2, Pencil, Trash2, X, Check } from 'lucide-react';
import { Account, CurrencyCode } from '../types/finance';
import { AccountIcon, ACCOUNT_ICON_OPTIONS } from './AccountIcon';
import { SUPPORTED_CURRENCIES, getCurrencySymbol, getCurrencyCode } from '../utils/formatters';

import { Language, Translations } from '../utils/translations';

interface AccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSaveAccount: (
    account: Account,
    previousInfo?: { oldId: string; oldName: string }
  ) => void;
  onDeleteAccount: (id: string) => void;
  language?: Language;
  t?: Translations;
}

const COLOR_OPTIONS = [
  { id: 'blue', label: 'Blu', color: 'from-blue-600 to-indigo-600', badgeColor: 'bg-blue-500/10 text-blue-400', preview: 'bg-blue-500' },
  { id: 'emerald', label: 'Smeraldo', color: 'from-emerald-600 to-teal-600', badgeColor: 'bg-emerald-500/10 text-emerald-400', preview: 'bg-emerald-500' },
  { id: 'amber', label: 'Ambra', color: 'from-amber-500 to-yellow-600', badgeColor: 'bg-amber-500/10 text-amber-400', preview: 'bg-amber-500' },
  { id: 'purple', label: 'Viola', color: 'from-purple-600 to-pink-600', badgeColor: 'bg-purple-500/10 text-purple-400', preview: 'bg-purple-500' },
  { id: 'rose', label: 'Rosa / Rosso', color: 'from-rose-600 to-red-600', badgeColor: 'bg-rose-500/10 text-rose-400', preview: 'bg-rose-500' },
  { id: 'cyan', label: 'Ciano', color: 'from-cyan-600 to-blue-700', badgeColor: 'bg-cyan-500/10 text-cyan-400', preview: 'bg-cyan-500' },
  { id: 'orange', label: 'Arancione', color: 'from-orange-500 to-amber-600', badgeColor: 'bg-orange-500/10 text-orange-400', preview: 'bg-orange-500' },
  { id: 'indigo', label: 'Indaco / Violetto', color: 'from-indigo-600 to-violet-700', badgeColor: 'bg-indigo-500/10 text-indigo-400', preview: 'bg-indigo-500' },
];

export const AccountsModal: React.FC<AccountsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSaveAccount,
  onDeleteAccount,
  language = 'it',
  t,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('landmark');
  const [selectedColorKey, setSelectedColorKey] = useState('blue');
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');
  const [searchIcon, setSearchIcon] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setIcon('landmark');
    setSelectedColorKey('blue');
    setCurrency('EUR');
    setSearchIcon('');
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartEdit = (acc: Account) => {
    setEditingId(acc.id);
    setName(acc.name);
    setIcon(acc.icon || 'landmark');
    setCurrency(getCurrencyCode(acc.currency));
    const matchedColor = COLOR_OPTIONS.find((c) => c.color === acc.color);
    setSelectedColorKey(matchedColor ? matchedColor.id : 'blue');

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 60);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const colorConfig =
      COLOR_OPTIONS.find((c) => c.id === selectedColorKey) || COLOR_OPTIONS[0];

    const prevAcc = editingId ? accounts.find((a) => a.id === editingId) : undefined;
    const duplicateExists = !editingId && accounts.some((a) => a.id === trimmed || a.name.toLowerCase() === trimmed.toLowerCase());
    const nextId = editingId
      ? editingId === prevAcc?.name
        ? accounts.some((a) => a.id === trimmed && a.id !== editingId)
          ? editingId
          : trimmed
        : editingId
      : duplicateExists
        ? `acc_${Date.now()}`
        : trimmed;

    onSaveAccount(
      {
        id: nextId,
        name: trimmed,
        icon,
        currency,
        color: colorConfig.color,
        badgeColor: colorConfig.badgeColor,
      },
      prevAcc ? { oldId: prevAcc.id, oldName: prevAcc.name } : undefined
    );

    resetForm();
  };

  const currentColor = COLOR_OPTIONS.find((c) => c.id === selectedColorKey) || COLOR_OPTIONS[0];
  const currentIconObj = ACCOUNT_ICON_OPTIONS.find((o) => o.id === icon);
  const currentCurrencyObj = SUPPORTED_CURRENCIES.find((c) => c.code === currency) || SUPPORTED_CURRENCIES[0];

  const filteredIcons = ACCOUNT_ICON_OPTIONS.filter((o) =>
    o.label.toLowerCase().includes(searchIcon.toLowerCase()) ||
    o.id.toLowerCase().includes(searchIcon.toLowerCase()) ||
    o.category.toLowerCase().includes(searchIcon.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-100/90 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center no-print">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-300 dark:border-slate-700 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl relative animate-slide-up max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {t?.accountsModalTitle || 'Gestione Conti & Icone'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t?.accountsModalSubtitle || 'Personalizza icone e colori per ogni conto'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={scrollContainerRef} className="overflow-y-auto no-scrollbar py-3 space-y-4 flex-1">
          {/* Form Creazione / Modifica */}
          <form
            onSubmit={handleSubmit}
            className={`space-y-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border transition ${
              editingId ? 'border-indigo-500/70 ring-1 ring-indigo-500/30' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {editingId && (
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 truncate">
                  <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">
                    {language === 'de'
                      ? `Konto bearbeiten: ${accounts.find((a) => a.id === editingId)?.name || ''}`
                      : language === 'en'
                        ? `Editing account: ${accounts.find((a) => a.id === editingId)?.name || ''}`
                        : `Modifica conto: ${accounts.find((a) => a.id === editingId)?.name || ''}`}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold flex-shrink-0"
                >
                  {t?.cancel || (language === 'de' ? 'Abbrechen' : language === 'en' ? 'Cancel' : 'Annulla')}
                </button>
              </div>
            )}

            {/* Live Card Preview */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${currentColor.color} text-slate-900 dark:text-white shadow-md flex items-center justify-center`}>
                  <AccountIcon iconName={icon} className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                    {name.trim() || (language === 'de' ? 'Kontoname' : language === 'en' ? 'Account Name' : 'Nome del Conto')}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>{language === 'de' ? 'Symbol' : language === 'en' ? 'Icon' : 'Icona'}: <strong className="text-indigo-700 dark:text-indigo-300">{currentIconObj?.label || icon}</strong></span>
                    <span>•</span>
                    <span className="text-amber-700 dark:text-amber-300 font-semibold">{currentCurrencyObj.flag} {currentCurrencyObj.code} ({currentCurrencyObj.symbol})</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 ${currentColor.badgeColor}`}>
                  {language === 'de' ? 'Vorschau' : language === 'en' ? 'Preview' : 'Anteprima'}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                  {currentCurrencyObj.symbol} {currentCurrencyObj.code}
                </span>
              </div>
            </div>

            {/* Input Nome */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                {t?.accountNameLabel || 'Nome Conto'}
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={language === 'de' ? 'z. B. Sparkasse, Girokonto, Bargeld...' : language === 'en' ? 'e.g. Checking Account, Cash, Savings...' : 'es. Revolut, Fineco, Portafoglio Contanti...'}
                className="w-full select-text bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Selezione Valuta Conto (Euro, Dollaro Statunitense, Yen Giapponese, Sterlina Britannica) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {language === 'de' ? 'Währung des Kontos' : language === 'en' ? 'Account Currency' : 'Valuta del Conto'}
                </label>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                  {currentCurrencyObj.flag} {currentCurrencyObj.code} ({currentCurrencyObj.symbol})
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {SUPPORTED_CURRENCIES.map((curr) => {
                  const isSelected = currency === curr.code;
                  const label = curr.names[language] || curr.name;
                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => setCurrency(curr.code)}
                      className={`p-2 rounded-xl flex items-center justify-between border text-left transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm ring-1 ring-amber-400/50'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm">{curr.flag}</span>
                        <div className="truncate">
                          <span className="text-xs font-bold block leading-tight text-slate-900 dark:text-white">{curr.code}</span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate block leading-tight">{label.split('(')[0].trim()}</span>
                        </div>
                      </div>
                      <span className={`text-xs font-black ml-1 ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                        {curr.symbol}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selezione Icona - Grid Visuale */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t?.chooseIconLabel || 'Scegli Icona'} ({ACCOUNT_ICON_OPTIONS.length} {language === 'de' ? 'verfügbar' : language === 'en' ? 'available' : 'disponibili'})
                </label>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[150px]">
                  {currentIconObj?.label}
                </span>
              </div>

              {/* Griglia Icone */}
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 p-2 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 max-h-36 overflow-y-auto no-scrollbar">
                {filteredIcons.map((opt) => {
                  const isSelected = icon === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setIcon(opt.id)}
                      title={opt.label}
                      className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? `bg-gradient-to-tr ${currentColor.color} text-white shadow-md ring-2 ring-indigo-400 scale-105`
                          : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/60'
                      }`}
                    >
                      <AccountIcon iconName={opt.id} className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selezione Colore Brand */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {t?.themeColorLabel || 'Colore Grafico'}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {COLOR_OPTIONS.map((c) => {
                  const isSelected = selectedColorKey === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColorKey(c.id)}
                      title={c.label}
                      className={`h-7 rounded-xl bg-gradient-to-r ${c.color} flex items-center justify-center transition ${
                        isSelected ? 'ring-2 ring-white scale-105 shadow-md' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pulsanti Azione Form */}
            <div className="flex gap-2 pt-1">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl text-xs font-semibold transition"
                >
                  {t?.cancel || 'Annulla'}
                </button>
              )}
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30 active:scale-98"
              >
                {editingId
                  ? (t?.updateAccountBtn || 'Salva Modifiche')
                  : (t?.saveAccountBtn ? `+ ${t.saveAccountBtn}` : '+ Aggiungi Nuovo Conto')}
              </button>
            </div>
          </form>

          {/* Elenco Conti Esistenti */}
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 px-1">
              {t?.activeAccountsTitle || 'Conti Attivi'} ({accounts.length})
            </span>
            <div className="space-y-1.5">
              {accounts.map((acc) => {
                const accCurr = getCurrencyCode(acc.currency);
                const accSymbol = getCurrencySymbol(acc.currency);
                const currInfo = SUPPORTED_CURRENCIES.find((c) => c.code === accCurr);
                const isBeingEdited = editingId === acc.id;
                return (
                  <div
                    key={acc.id}
                    className={`flex justify-between items-center p-2.5 rounded-xl border text-xs transition ${
                      isBeingEdited
                        ? 'bg-indigo-50 dark:bg-indigo-950/35 border-indigo-500/70'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleStartEdit(acc)}
                      className="flex items-center space-x-2.5 flex-1 min-w-0 text-left mr-2"
                    >
                      <div className={`p-2 rounded-xl bg-gradient-to-tr ${acc.color} text-slate-900 dark:text-white shadow-sm flex items-center justify-center flex-shrink-0`}>
                        <AccountIcon iconName={acc.icon} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-slate-900 dark:text-slate-100 font-bold truncate">{acc.name}</span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex-shrink-0">
                            {currInfo?.flag} {accSymbol} {accCurr}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {language === 'de' ? 'Symbol' : language === 'en' ? 'Icon' : 'Icona'}: {acc.icon || 'landmark'}
                        </span>
                      </div>
                    </button>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(acc)}
                        className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-900 transition"
                        title={t?.edit || 'Modifica'}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAccount(acc.id)}
                        className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-900 transition"
                        title={t?.delete || 'Elimina'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-right">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1 font-semibold"
          >
            {t?.close || 'Chiudi'}
          </button>
        </div>
      </div>
    </div>
  );
};
