import React from 'react';
import {
  List,
  Search,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Pencil,
  Trash2,
  Inbox,
  FileText,
  Printer,
  Calendar,
  FileSpreadsheet,
  CopyPlus,
} from 'lucide-react';
import { Transaction, PeriodFilter, TransactionType } from '../types/finance';
import { formatCurrency, getAccountDisplayName, formatDateEuropean } from '../utils/formatters';
import { CategoryIcon, getCategoryColorDetails } from './CategoryIcon';
import { Language, Translations, getCategoryDisplayName } from '../utils/translations';

interface TransactionsTabProps {
  transactions: Transaction[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPeriod: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
  startDate?: string;
  onStartDateChange?: (date: string) => void;
  endDate?: string;
  onEndDateChange?: (date: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedAccount: string;
  onAccountChange: (account: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedTag?: string;
  onTagChange?: (tag: string) => void;
  availableTags?: string[];
  accounts: { id: string; name: string; currency?: string }[];
  categories: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onDuplicateTransaction?: (tx: Transaction) => void;
  onOpenPrintModal?: () => void;
  onOpenCsvImport?: () => void;
  language?: Language;
  t?: Translations;
}

const PERIOD_CHIPS: { id: PeriodFilter; label: string }[] = [
  { id: 'ALL', label: 'Tutto' },
  { id: 'TODAY', label: 'Oggi' },
  { id: 'YESTERDAY', label: 'Ieri' },
  { id: 'CURRENT_WEEK', label: 'Settimana corrente' },
  { id: 'LAST_WEEK', label: 'Settimana scorsa' },
  { id: 'MONTH', label: 'Mese corrente' },
  { id: 'LAST_MONTH', label: 'Mese scorso' },
  { id: 'YEAR', label: 'Anno corrente' },
  { id: 'LAST_YEAR', label: 'Anno scorso' },
  { id: 'Q1', label: 'Q1' },
  { id: 'Q2', label: 'Q2' },
  { id: 'Q3', label: 'Q3' },
  { id: 'Q4', label: 'Q4' },
  { id: 'CUSTOM', label: 'Intervallo date' },
];

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  searchQuery,
  onSearchChange,
  selectedPeriod,
  onPeriodChange,
  startDate = '',
  onStartDateChange,
  endDate = '',
  onEndDateChange,
  selectedType,
  onTypeChange,
  selectedAccount,
  onAccountChange,
  selectedCategory,
  onCategoryChange,
  selectedTag = 'ALL',
  onTagChange,
  availableTags = [],
  accounts,
  categories,
  hasActiveFilters,
  onClearFilters,
  onEditTransaction,
  onDeleteTransaction,
  onDuplicateTransaction,
  onOpenPrintModal,
  onOpenCsvImport,
  language = 'it',
  t,
}) => {
  const periodChips: { id: PeriodFilter; label: string }[] = [
    { id: 'ALL', label: t?.periodAll || 'Tutto' },
    { id: 'TODAY', label: t?.periodToday || 'Oggi' },
    { id: 'YESTERDAY', label: t?.periodYesterday || 'Ieri' },
    { id: 'CURRENT_WEEK', label: t?.periodCurrentWeek || 'Settimana corrente' },
    { id: 'LAST_WEEK', label: t?.periodLastWeek || 'Settimana scorsa' },
    { id: 'MONTH', label: t?.periodMonth || 'Mese corrente' },
    { id: 'LAST_MONTH', label: t?.periodLastMonth || 'Mese scorso' },
    { id: 'YEAR', label: t?.periodYear || 'Anno corrente' },
    { id: 'LAST_YEAR', label: t?.periodLastYear || 'Anno scorso' },
    { id: 'Q1', label: 'Q1' },
    { id: 'Q2', label: 'Q2' },
    { id: 'Q3', label: 'Q3' },
    { id: 'Q4', label: 'Q4' },
    { id: 'CUSTOM', label: t?.periodCustom || 'Intervallo date' },
  ];

  const handlePeriodSelect = (period: PeriodFilter) => {
    onPeriodChange(period);
    if (period !== 'CUSTOM') {
      if (onStartDateChange) onStartDateChange('');
      if (onEndDateChange) onEndDateChange('');
    }
  };

  const handleClearCustomDates = () => {
    if (onStartDateChange) onStartDateChange('');
    if (onEndDateChange) onEndDateChange('');
    if (selectedPeriod === 'CUSTOM') {
      onPeriodChange('ALL');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <List className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> {t?.transactionsTitle || 'Movimenti'} (
          <span>{transactions.length}</span>)
        </h2>
        <div className="flex items-center gap-1.5 no-print">
          {onOpenCsvImport && (
            <button
              onClick={onOpenCsvImport}
              title={
                language === 'de'
                  ? 'Kontoauszug importieren (CSV / Excel)'
                  : language === 'en'
                    ? 'Import Bank Statement (CSV / Excel)'
                    : 'Importa Estratto Conto (CSV / Excel)'
              }
              className="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 font-semibold active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV / XLS</span>
            </button>
          )}
          {onOpenPrintModal && (
            <button
              onClick={onOpenPrintModal}
              title={t?.printStatementBtn || 'Stampa / Esporta'}
              className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-cyan-600 dark:text-cyan-400 border border-slate-300/80 dark:border-slate-700/80 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 font-semibold active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t?.printStatementBtn || 'Stampa'}</span>
            </button>
          )}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> {t?.resetFiltersBtn || 'Azzeramento'}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="relative w-full no-print">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t?.searchPlaceholder || 'Cerca descrizione, conto, categoria, importo...'}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Quick Horizontal Period Filter Chips */}
      <div className="no-print overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1.5 min-w-max">
          {periodChips.map((chip) => {
            const isSelected = selectedPeriod === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => handlePeriodSelect(chip.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md font-semibold'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Range Filter Card (es. dal 15.10.2026 al 10.11.2026) */}
      <div className="no-print bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {t?.dateRangeFilterTitle || 'Filtra per Data (Dal ... Al ...)'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                es. dal 15.10.2026 al 10.11.2026
              </span>
            </div>
          </div>
          {(startDate || endDate) && (
            <button
              onClick={handleClearCustomDates}
              className="text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 transition"
            >
              <X className="w-3 h-3" />
              <span>{t?.clearDateRange || 'Azzera date'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Da data (Dal) */}
          <div>
            <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center justify-between">
              <span>{t?.dateFromLabel || 'Dal'}</span>
              {startDate && (
                <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px]">
                  {formatDateEuropean(startDate)}
                </span>
              )}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                if (onStartDateChange) onStartDateChange(e.target.value);
                onPeriodChange('CUSTOM');
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-xs text-slate-900 dark:text-white rounded-xl px-2.5 py-1.5 focus:outline-none transition"
            />
          </div>

          {/* A data (Al) */}
          <div>
            <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center justify-between">
              <span>{t?.dateToLabel || 'Al'}</span>
              {endDate && (
                <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px]">
                  {formatDateEuropean(endDate)}
                </span>
              )}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                if (onEndDateChange) onEndDateChange(e.target.value);
                onPeriodChange('CUSTOM');
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-xs text-slate-900 dark:text-white rounded-xl px-2.5 py-1.5 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Quick shortcut chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider flex-shrink-0">
            Rapidi:
          </span>
          <button
            onClick={() => {
              const now = new Date();
              const todayStr = now.toISOString().split('T')[0];
              if (onStartDateChange) onStartDateChange(todayStr);
              if (onEndDateChange) onEndDateChange(todayStr);
              onPeriodChange('CUSTOM');
            }}
            className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700/60 whitespace-nowrap transition active:scale-95"
          >
            {t?.periodToday || 'Oggi'}
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const past7 = new Date();
              past7.setDate(now.getDate() - 6);
              if (onStartDateChange) onStartDateChange(past7.toISOString().split('T')[0]);
              if (onEndDateChange) onEndDateChange(now.toISOString().split('T')[0]);
              onPeriodChange('CUSTOM');
            }}
            className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700/60 whitespace-nowrap transition active:scale-95"
          >
            {t?.quickDays7 || 'Ultimi 7 gg'}
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const past30 = new Date();
              past30.setDate(now.getDate() - 29);
              if (onStartDateChange) onStartDateChange(past30.toISOString().split('T')[0]);
              if (onEndDateChange) onEndDateChange(now.toISOString().split('T')[0]);
              onPeriodChange('CUSTOM');
            }}
            className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700/60 whitespace-nowrap transition active:scale-95"
          >
            {t?.quickDays30 || 'Ultimi 30 gg'}
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
              const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              if (onStartDateChange) onStartDateChange(firstDay.toISOString().split('T')[0]);
              if (onEndDateChange) onEndDateChange(lastDay.toISOString().split('T')[0]);
              onPeriodChange('CUSTOM');
            }}
            className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700/60 whitespace-nowrap transition active:scale-95"
          >
            {t?.periodMonth || 'Questo Mese'}
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
              if (onStartDateChange) onStartDateChange(firstDay.toISOString().split('T')[0]);
              if (onEndDateChange) onEndDateChange(lastDay.toISOString().split('T')[0]);
              onPeriodChange('CUSTOM');
            }}
            className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700/60 whitespace-nowrap transition active:scale-95"
          >
            {t?.periodLastMonth || 'Mese Scorso'}
          </button>
        </div>

        {/* Active Range Summary indicator */}
        {(startDate || endDate) && (
          <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-500/30 rounded-xl px-2.5 py-1.5 text-[11px] text-indigo-800 dark:text-indigo-200">
            <span className="flex items-center gap-1.5 truncate">
              <span className="font-semibold">{t?.dateRangeActiveLabel || 'Intervallo attivo'}:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {startDate ? `${t?.dateFromLabel || 'Dal'} ${formatDateEuropean(startDate)}` : ''}{' '}
                {endDate ? `${t?.dateToLabel || 'al'} ${formatDateEuropean(endDate)}` : ''}
              </span>
            </span>
            <span className="bg-indigo-600/30 px-2 py-0.5 rounded-md text-[10px] font-bold text-indigo-700 dark:text-indigo-300 flex-shrink-0">
              {transactions.length} {t?.rowsWord || 'movimenti'}
            </span>
          </div>
        )}
      </div>

      {/* Filters Selects Grid */}
      <div className="grid grid-cols-2 gap-2 no-print bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
        <div>
          <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{t?.periodFilterLabel || 'Periodo'}</label>
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodSelect(e.target.value as PeriodFilter)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl px-2 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">{t?.periodAll || 'Tutto'}</option>
            <option value="CUSTOM">{t?.periodCustom || 'Intervallo date'}</option>
            <option value="TODAY">{t?.periodToday || 'Oggi'}</option>
            <option value="YESTERDAY">{t?.periodYesterday || 'Ieri'}</option>
            <option value="CURRENT_WEEK">{t?.periodCurrentWeek || 'Settimana corrente'}</option>
            <option value="LAST_WEEK">{t?.periodLastWeek || 'Settimana scorsa'}</option>
            <option value="MONTH">{t?.periodMonth || 'Mese corrente'}</option>
            <option value="LAST_MONTH">{t?.periodLastMonth || 'Mese scorso'}</option>
            <option value="YEAR">{t?.periodYear || 'Anno corrente'}</option>
            <option value="LAST_YEAR">{t?.periodLastYear || 'Anno scorso'}</option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{t?.typeFilterLabel || 'Tipo'}</label>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl px-2 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">{t?.allTypes || 'Tutti i tipi'}</option>
            <option value="INCOME">{t?.incomeType || 'Entrate'}</option>
            <option value="EXPENSE">{t?.expenseType || 'Uscite'}</option>
            <option value="TRANSFER">{t?.transferType || 'Giroconti'}</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{t?.accountFilterLabel || 'Conto'}</label>
          <select
            value={selectedAccount}
            onChange={(e) => onAccountChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl px-2 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">{t?.allAccountsOption || 'Tutti i conti'}</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{t?.categoryFilterLabel || 'Categoria'}</label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl px-2 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">{t?.allCategoriesOption || 'Tutte le categorie'}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {getCategoryDisplayName(cat, language)}
              </option>
            ))}
          </select>
        </div>

        {availableTags.length > 0 && onTagChange && (
          <div className="col-span-2">
            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
              {language === 'de' ? 'Tag-Filter' : language === 'en' ? 'Tag filter' : 'Filtra per #Tag'}
            </label>
            <select
              value={selectedTag}
              onChange={(e) => onTagChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl px-2 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">
                {language === 'de' ? 'Alle Tags' : language === 'en' ? 'All tags' : 'Tutti i tag'}
              </option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-2 pt-1">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 print-text-dark bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-slate-200/60 dark:border-slate-800/60">
            <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40 no-print" />
            <p className="text-xs font-semibold">{t?.noTransactionsFound || 'Nessun movimento trovato.'}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{t?.noTransactionsFoundSub || 'Prova a modificare i filtri o premi + per aggiungerne uno.'}</p>
          </div>
        ) : (
          transactions.map((tx) => {
            const isExpense = tx.type === 'EXPENSE';
            const isTransfer = tx.type === 'TRANSFER';
            const catColor = getCategoryColorDetails(tx.category);
            const catDisplayName = getCategoryDisplayName(tx.category, language);
            const accDisplayName = getAccountDisplayName(tx.account, accounts);
            const fromDisplayName = getAccountDisplayName(tx.fromAccount, accounts);
            const toDisplayName = getAccountDisplayName(tx.toAccount, accounts);

            // Lookup account currency
            const txAccId = isTransfer ? tx.fromAccount : tx.account;
            const matchedAcc = accounts.find((a) => a.id === txAccId || a.name === txAccId);
            const txCurrency = matchedAcc?.currency;

            let amountPrefix = '+';
            let amountColor = 'text-emerald-400';
            let subtext = `${accDisplayName} • ${catDisplayName}`;

            if (isExpense) {
              amountPrefix = '-';
              amountColor = 'text-rose-400';
            } else if (isTransfer) {
              amountPrefix = '↺ ';
              amountColor = 'text-indigo-300';
              subtext = `${fromDisplayName} ➔ ${toDisplayName}`;
            }

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 active:bg-slate-100 dark:active:bg-slate-800 transition-all print-card"
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  {isTransfer ? (
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 no-print flex-shrink-0 flex items-center justify-center">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div
                      className={`p-2 rounded-xl ${catColor.bgLight} ${catColor.textColor} border ${catColor.borderColor} no-print flex-shrink-0 flex items-center justify-center`}
                    >
                      <CategoryIcon categoryName={tx.category} className="w-4 h-4" />
                    </div>
                  )}
                  <div className="truncate flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate print-text-dark flex items-center gap-1.5">
                      <span className="truncate">{tx.description}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 print-text-dark flex items-center gap-1.5 mt-0.5 truncate">
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                        {isTransfer ? subtext : accDisplayName}
                      </span>
                      {!isTransfer && tx.category && (
                        <>
                          <span>•</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-md ${catColor.bgLight} ${catColor.textColor} font-semibold truncate border ${catColor.borderColor}`}
                          >
                            {catDisplayName}
                          </span>
                        </>
                      )}
                    </div>
                    {tx.tags && tx.tags.length > 0 && (
                      <div className="text-[10px] text-cyan-700 dark:text-cyan-300/90 mt-0.5 truncate">
                        {tx.tags.map((tg) => `#${tg}`).join(' · ')}
                      </div>
                    )}
                    {tx.notes && (
                      <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-500/20 px-2.5 py-1 rounded-xl max-w-full">
                        <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span className="break-words line-clamp-2 italic font-normal text-slate-600 dark:text-slate-300">{tx.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0 pl-2">
                  <div className="text-right mr-1">
                    <span className={`text-xs font-bold tabular-nums ${amountColor} print-text-dark block`}>
                      {amountPrefix}
                      {formatCurrency(tx.amount, true, txCurrency)}
                    </span>
                    {isTransfer && typeof tx.convertedAmount === 'number' && (() => {
                      const toAcc = accounts.find((a) => a.id === tx.toAccount || a.name === tx.toAccount);
                      const toCurr = toAcc?.currency;
                      if (!toCurr || toCurr === txCurrency) return null;
                      return (
                        <span className="text-[10px] font-semibold tabular-nums text-cyan-700 dark:text-cyan-300 block">
                          → {formatCurrency(tx.convertedAmount, true, toCurr)}
                        </span>
                      );
                    })()}
                  </div>
                  {!isTransfer && onDuplicateTransaction && (
                    <button
                      onClick={() => onDuplicateTransaction(tx)}
                      title={
                        language === 'de'
                          ? 'Heute duplizieren'
                          : language === 'en'
                            ? 'Duplicate today'
                            : 'Duplica ad oggi'
                      }
                      className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg no-print hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <CopyPlus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!isTransfer && (
                    <button
                      onClick={() => onEditTransaction(tx)}
                      title={t?.edit || 'Modifica'}
                      className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg no-print hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    title={t?.delete || 'Elimina'}
                    className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg no-print hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
  );
};
