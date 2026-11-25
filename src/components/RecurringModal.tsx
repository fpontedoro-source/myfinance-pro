import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Repeat, Play, Pencil, Trash2, X, Search, AlertTriangle, CalendarClock, Zap, BellRing, BellOff } from 'lucide-react';
import { Account, RecurringFrequency, RecurringMovement } from '../types/finance';
import { formatCurrency, getAccountDisplayName, getCurrencySymbol, formatDateEuropean } from '../utils/formatters';
import { Language, Translations, getCategoryDisplayName } from '../utils/translations';
import { formatRecurringFrequencyLabel, getTodayIsoDate } from '../utils/recurringScheduler';
import { BrowserNotifPermissionState } from '../utils/recurringNotifications';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurring: RecurringMovement[];
  accounts: Account[];
  categories: string[];
  onSaveRecurring: (item: RecurringMovement) => void;
  onDeleteRecurring: (id: string) => void;
  onApplyRecurring: (id: string) => void;
  onApplyAll: () => void;
  notificationsEnabled?: boolean;
  onToggleNotifications?: () => void;
  browserNotifStatus?: BrowserNotifPermissionState;
  onEnableBrowserNotifications?: () => void;
  language?: Language;
  t?: Translations;
}

export const RecurringModal: React.FC<RecurringModalProps> = ({
  isOpen,
  onClose,
  recurring,
  accounts,
  categories,
  onSaveRecurring,
  onDeleteRecurring,
  onApplyRecurring,
  onApplyAll,
  notificationsEnabled = true,
  onToggleNotifications,
  browserNotifStatus = 'unsupported',
  onEnableBrowserNotifications,
  language = 'it',
  t,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [account, setAccount] = useState(accounts[0]?.name || accounts[0]?.id || '');
  const [category, setCategory] = useState(categories[0] || '');
  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [nextDueDate, setNextDueDate] = useState(getTodayIsoDate());
  const [autoExecute, setAutoExecute] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const descInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setType('EXPENSE');
    setAccount(accounts[0]?.name || accounts[0]?.id || '');
    setCategory(categories[0] || '');
    setFrequency('MONTHLY');
    setNextDueDate(getTodayIsoDate());
    setAutoExecute(true);
    setFormError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleStartEdit = (rec: RecurringMovement) => {
    setFormError(null);
    setEditingId(rec.id);
    setDescription(rec.description);
    setAmount(rec.amount.toString());
    setType(rec.type);
    setAccount(getAccountDisplayName(rec.account, accounts));
    setCategory(rec.category);
    setFrequency(rec.frequency || 'MONTHLY');
    setNextDueDate(rec.nextDueDate || getTodayIsoDate());
    setAutoExecute(Boolean(rec.autoExecute));

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setTimeout(() => {
      descInputRef.current?.focus();
      descInputRef.current?.select();
    }, 60);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError(
        language === 'de'
          ? 'Bitte einen gültigen Betrag (> 0) eingeben.'
          : language === 'en'
            ? 'Please enter a valid amount (> 0).'
            : 'Inserisci un importo valido.'
      );
      return;
    }

    const resolvedAccount = getAccountDisplayName(account, accounts);
    const defaultTitle =
      language === 'de'
        ? 'Wiederkehrende Buchung'
        : language === 'en'
          ? 'Recurring Transaction'
          : 'Movimento Ricorrente';

    const existingRule = editingId ? recurring.find((r) => r.id === editingId) : undefined;

    onSaveRecurring({
      id: editingId || Date.now().toString(),
      description: description.trim() || defaultTitle,
      amount: parsedAmount,
      type,
      account: resolvedAccount,
      category: category || categories[0] || '',
      frequency,
      autoExecute,
      nextDueDate: nextDueDate || getTodayIsoDate(),
      lastAppliedDate: existingRule?.lastAppliedDate,
    });

    resetForm();
  };

  // Filter models by name (description), category (raw or localized), or account
  const filteredRecurring = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return recurring;
    return recurring.filter(
      (rec) =>
        rec.description.toLowerCase().includes(q) ||
        rec.category.toLowerCase().includes(q) ||
        getCategoryDisplayName(rec.category, language).toLowerCase().includes(q) ||
        rec.account.toLowerCase().includes(q)
    );
  }, [recurring, searchQuery, language]);

  if (!isOpen) return null;

  const isDe = language === 'de';
  const isEn = language === 'en';
  const currencySym = getCurrencySymbol();

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center no-print">
      <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl relative animate-slide-up max-h-[92vh] flex flex-col">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition"
          aria-label={t?.close || 'Chiudi'}
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1 pr-10">
          <Repeat className="w-5 h-5 text-amber-400" />{' '}
          {t?.recurringTitle || 'Movimenti Ricorrenti'}
        </h3>
        <p className="text-[11px] text-slate-400 mb-3">
          {isDe
            ? 'Plane wiederkehrende Buchungen mit automatischer Fälligkeitsausführung oder manueller Vorlage.'
            : isEn
              ? 'Schedule recurring transactions with automatic due execution or manual 1-tap apply.'
              : 'Programma spese e entrate periodiche con registrazione automatica alla scadenza o avvio manuale.'}
        </p>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-1">

        {/* Auto-Execution Notification Settings Bar */}
        {onToggleNotifications && (
          <div className="mb-3 p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onToggleNotifications}
              className="flex items-center gap-2 min-w-0 flex-1 text-left"
            >
              <div
                className={`p-1.5 rounded-lg flex-shrink-0 ${
                  notificationsEnabled
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {notificationsEnabled ? (
                  <BellRing className="w-3.5 h-3.5" />
                ) : (
                  <BellOff className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-200 truncate">
                  {isDe
                    ? 'Benachrichtigung bei Fälligkeit'
                    : isEn
                      ? 'Notify on auto-record'
                      : 'Notifica alla registrazione'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {notificationsEnabled
                    ? isDe
                      ? 'Meldet automatisch Ausgaben & Einnahmen'
                      : isEn
                        ? 'Alerts for outgoing & incoming auto entries'
                        : 'Avvisa se hai movimenti in uscita o in entrata'
                    : isDe
                      ? 'Stumm (nur im Verlauf)'
                      : isEn
                        ? 'Muted (recorded silently)'
                        : 'Disattivata (registra senza avviso)'}
                </div>
              </div>
            </button>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {notificationsEnabled && browserNotifStatus === 'default' && onEnableBrowserNotifications && (
                <button
                  type="button"
                  onClick={onEnableBrowserNotifications}
                  className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold transition"
                >
                  {isDe ? 'Push aktivieren' : isEn ? 'Device Push' : 'Push Dispositivo'}
                </button>
              )}
              {notificationsEnabled && browserNotifStatus === 'granted' && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">
                  {isDe ? 'Push AN' : isEn ? 'Push ON' : 'Push ON'}
                </span>
              )}
              <button
                type="button"
                onClick={onToggleNotifications}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                  notificationsEnabled
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {notificationsEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        )}

        {recurring.length > 0 && (
          <div className="mb-3">
            <button
              type="button"
              onClick={onApplyAll}
              className="w-full min-h-[42px] bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />{' '}
              {isDe
                ? `Alle Vorlagen heute anwenden (${recurring.length})`
                : isEn
                  ? `Apply All Templates Today (${recurring.length})`
                  : `Applica Tutti i Modelli ad Oggi (${recurring.length})`}
            </button>
          </div>
        )}

        {/* Creation/Edit Form */}
        <form
          onSubmit={handleSubmit}
          className={`space-y-2.5 bg-slate-950 p-3 rounded-2xl border transition ${
            editingId ? 'border-amber-500/70 ring-1 ring-amber-500/30' : 'border-slate-800'
          }`}
        >
          {editingId && (
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 truncate">
                <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">
                  {isDe
                    ? `Vorlage bearbeiten: ${recurring.find((r) => r.id === editingId)?.description || ''}`
                    : isEn
                      ? `Editing template: ${recurring.find((r) => r.id === editingId)?.description || ''}`
                      : `Modifica modello: ${recurring.find((r) => r.id === editingId)?.description || ''}`}
                </span>
              </span>
              <button
                type="button"
                onClick={resetForm}
                className="text-[10px] text-slate-400 hover:text-white font-semibold flex-shrink-0"
              >
                {t?.cancel || 'Annulla'}
              </button>
            </div>
          )}

          {formError && (
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <input
              ref={descInputRef}
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder={
                isDe
                  ? 'Beschreibung (z. B. Miete)'
                  : isEn
                    ? 'Description (e.g. Bill)'
                    : 'Descrizione (es. Bolletta)'
              }
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-amber-500 select-text"
            />
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (formError) setFormError(null);
              }}
              required
              placeholder={
                isDe
                  ? `Betrag (${currencySym})`
                  : isEn
                    ? `Amount (${currencySym})`
                    : `Importo (${currencySym})`
              }
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-2.5 py-2 text-xs font-bold tabular-nums focus:outline-none focus:border-amber-500 select-text"
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'EXPENSE' | 'INCOME')}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-2 py-2 text-xs"
            >
              <option value="EXPENSE">{t?.expenseWord || 'Uscita'}</option>
              <option value="INCOME">{t?.incomeWord || 'Entrata'}</option>
            </select>
            <select
              value={getAccountDisplayName(account, accounts)}
              onChange={(e) => setAccount(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-2 py-2 text-xs"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.name}>
                  {acc.name}
                </option>
              ))}
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-2 py-2 text-xs"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryDisplayName(cat, language)}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule Row: Frequency + Next Due Date */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">
                {isDe ? 'Intervall' : isEn ? 'Frequency' : 'Frequenza'}
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-2.5 py-2 text-xs"
              >
                <option value="MONTHLY">{formatRecurringFrequencyLabel('MONTHLY', language)}</option>
                <option value="WEEKLY">{formatRecurringFrequencyLabel('WEEKLY', language)}</option>
                <option value="YEARLY">{formatRecurringFrequencyLabel('YEARLY', language)}</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">
                {isDe ? 'Nächste Fälligkeit' : isEn ? 'Next Due Date' : 'Prossima Scadenza'}
              </label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Auto-Execute Toggle */}
          <button
            type="button"
            onClick={() => setAutoExecute((v) => !v)}
            className={`w-full px-3 py-2 rounded-xl border text-xs flex items-center justify-between transition ${
              autoExecute
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <span className="flex items-center gap-2 font-semibold">
              <Zap className={`w-3.5 h-3.5 ${autoExecute ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>
                {isDe
                  ? 'Automatisch bei Fälligkeit buchen'
                  : isEn
                    ? 'Auto-record on due date'
                    : 'Registra automaticamente alla scadenza'}
              </span>
            </span>
            <span className="text-[11px] font-bold">
              {autoExecute ? 'ON' : 'OFF'}
            </span>
          </button>

          <div className="flex gap-2 pt-0.5">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 min-h-[40px] bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold transition"
              >
                {t?.cancel || 'Annulla'}
              </button>
            )}
            <button
              type="submit"
              className="flex-1 min-h-[40px] bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-xl text-xs font-semibold transition"
            >
              {editingId
                ? isDe
                  ? 'Vorlage aktualisieren'
                  : isEn
                    ? 'Update Template'
                    : 'Aggiorna Modello'
                : isDe
                  ? 'Vorlage speichern'
                  : isEn
                    ? 'Save Template'
                    : 'Salva Modello'}
            </button>
          </div>
        </form>

        {/* Search Filter for Models */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t?.searchRecurringPlaceholder || 'Cerca modello per nome o categoria...'}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition select-text"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtered Recurring Movements List */}
        <div className="space-y-2 pb-1">
          {recurring.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              {t?.noRecurringSaved || 'Nessun modello ricorrente salvato.'}
            </p>
          ) : filteredRecurring.length === 0 ? (
            <div className="p-5 text-center text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800">
              <Search className="w-5 h-5 mx-auto mb-1 text-slate-600" />
              <span>
                {isDe
                  ? `Keine Vorlage passend zu "${searchQuery}"`
                  : isEn
                    ? `No template matching "${searchQuery}"`
                    : `Nessun modello corrispondente a "${searchQuery}"`}
              </span>
            </div>
          ) : (
            filteredRecurring.map((rec) => {
              const isExpense = rec.type === 'EXPENSE';
              const colorClass = isExpense ? 'text-rose-400' : 'text-emerald-400';
              const freqLabel = formatRecurringFrequencyLabel(rec.frequency, language);
              const isBeingEdited = editingId === rec.id;

              return (
                <div
                  key={rec.id}
                  className={`flex justify-between items-center p-2.5 rounded-xl border text-xs transition ${
                    isBeingEdited
                      ? 'bg-amber-950/30 border-amber-500/70'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleStartEdit(rec)}
                    className="truncate mr-2 flex-1 min-w-0 text-left"
                  >
                    <div className="text-slate-200 font-semibold truncate flex items-center gap-1.5">
                      <span className="truncate">{rec.description}</span>
                      {rec.autoExecute && (
                        <Zap className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate tabular-nums">
                      <span className={`${colorClass} font-bold`}>
                        {isExpense ? '-' : '+'}
                        {formatCurrency(rec.amount)}
                      </span>
                      <span>·</span>
                      <span className="truncate">{getAccountDisplayName(rec.account, accounts)}</span>
                      <span>·</span>
                      <span className="truncate text-indigo-300 font-medium">
                        {getCategoryDisplayName(rec.category, language)}
                      </span>
                    </div>
                    {(rec.nextDueDate || rec.frequency) && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                        <CalendarClock className="w-3 h-3 text-amber-400/80 flex-shrink-0" />
                        <span>{freqLabel}</span>
                        {rec.nextDueDate && (
                          <>
                            <span>·</span>
                            <span>
                              {isDe ? 'Fällig' : isEn ? 'Due' : 'Scad.'}: {formatDateEuropean(rec.nextDueDate)}
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span className={rec.autoExecute ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                          {rec.autoExecute
                            ? isDe
                              ? 'Auto'
                              : isEn
                                ? 'Auto'
                                : 'Auto'
                            : isDe
                              ? 'Manuell'
                              : isEn
                                ? 'Manual'
                                : 'Manuale'}
                        </span>
                      </div>
                    )}
                  </button>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onApplyRecurring(rec.id)}
                      title={t?.applyRecurringBtn || 'Applica Oggi'}
                      className="min-h-[36px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      <Play className="w-3 h-3 fill-current" /> {t?.applyRecurringBtn || 'Applica'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(rec)}
                      title={t?.edit || 'Modifica'}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-indigo-400 rounded-lg transition hover:bg-slate-800"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRecurring(rec.id)}
                      title={t?.delete || 'Elimina'}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-rose-400 rounded-lg transition hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        </div>
      </div>
    </div>
  );
};
