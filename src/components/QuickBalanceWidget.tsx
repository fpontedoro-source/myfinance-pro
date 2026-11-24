import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowRightLeft,
  Coins,
  Zap,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Account } from '../types/finance';
import { AccountIcon } from './AccountIcon';
import { formatCurrency } from '../utils/formatters';

interface QuickBalanceWidgetProps {
  accounts: Account[];
  balances: Record<string, number>;
  onInitiateTransfer: (transferData: {
    fromAccount: string;
    toAccount: string;
    amount: number;
    note: string;
  }) => void;
  onSelectAccount?: (accountId: string) => void;
  selectedAccountId?: string;
  onManageAccounts?: () => void;
}

export const QuickBalanceWidget: React.FC<QuickBalanceWidgetProps> = ({
  accounts,
  balances,
  onInitiateTransfer,
  onSelectAccount,
  selectedAccountId,
  onManageAccounts,
}) => {
  // Transfer drawer state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState<string>(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(accounts[1]?.id || accounts[0]?.id || '');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('Giroconto Rapido');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Carousel state & ref
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(accounts.length > 1);

  // Calculate total positive balance for percentage share
  const totalPositiveBalance = Object.values(balances).reduce(
    (sum, val) => sum + (val > 0 ? val : 0),
    0
  );

  // Update carousel scroll position status
  const updateScrollStatus = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 15);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);

    // Calculate approximate active card index
    const cardWidth = 240; // Approx card width + gap
    const index = Math.min(
      accounts.length - 1,
      Math.max(0, Math.round(scrollLeft / cardWidth))
    );
    setActiveIndex(index);
  };

  useEffect(() => {
    updateScrollStatus();
    // Add window resize listener to adjust carousel bounds
    window.addEventListener('resize', updateScrollStatus);
    return () => window.removeEventListener('resize', updateScrollStatus);
  }, [accounts.length]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 260; // Card width + gap
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const scrollToIndex = (index: number) => {
    if (!carouselRef.current) return;
    const cardElements = carouselRef.current.children;
    if (cardElements[index]) {
      (cardElements[index] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      });
      setActiveIndex(index);
    }
  };

  // Quick preset amount buttons
  const presetAmounts = [10, 25, 50, 100, 200];

  const handleOpenTransferForAccount = (sourceAccId: string) => {
    setFromAccountId(sourceAccId);
    // Pick another account as target if available
    const otherAccount = accounts.find((a) => a.id !== sourceAccId);
    if (otherAccount) {
      setToAccountId(otherAccount.id);
    }
    setValidationError(null);
    setIsTransferOpen(true);
  };

  const handleSwapAccounts = () => {
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
    setValidationError(null);
  };

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(transferAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setValidationError('Inserisci un importo valido maggiore di zero.');
      return;
    }

    if (fromAccountId === toAccountId) {
      setValidationError('Il conto di origine e destinazione devono essere diversi.');
      return;
    }

    setValidationError(null);

    // Call onInitiateTransfer which will trigger the warning confirmation modal
    onInitiateTransfer({
      fromAccount: fromAccountId,
      toAccount: toAccountId,
      amount: amountNum,
      note: transferNote.trim() || 'Giroconto Rapido',
    });

    // Reset fields
    setTransferAmount('');
    setIsTransferOpen(false);
  };

  const fromAccObj = accounts.find((a) => a.id === fromAccountId);
  const toAccObj = accounts.find((a) => a.id === toAccountId);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3.5 no-print relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header with Title and Carousel Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex-shrink-0">
            <Coins className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Widget Saldo Rapido
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                {activeIndex + 1}/{accounts.length}
              </span>
              {onManageAccounts && (
                <button
                  type="button"
                  onClick={onManageAccounts}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold transition hover:underline"
                >
                  Gestisci
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              Scorri i saldi in tempo reale o effettua un giroconto
            </p>
          </div>
        </div>

        {/* Carousel Arrow Controls & Giroconto Drawer Toggle */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => scrollCarousel('left')}
            disabled={!canScrollLeft}
            aria-label="Conto precedente"
            className={`p-1.5 rounded-xl border transition ${
              canScrollLeft
                ? 'bg-slate-800 hover:bg-slate-750 text-white border-slate-700 hover:border-slate-600 active:scale-95'
                : 'bg-slate-950/40 text-slate-600 border-slate-850 cursor-not-allowed opacity-50'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => scrollCarousel('right')}
            disabled={!canScrollRight}
            aria-label="Conto successivo"
            className={`p-1.5 rounded-xl border transition ${
              canScrollRight
                ? 'bg-slate-800 hover:bg-slate-750 text-white border-slate-700 hover:border-slate-600 active:scale-95'
                : 'bg-slate-950/40 text-slate-600 border-slate-850 cursor-not-allowed opacity-50'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Giroconto action button */}
          <button
            type="button"
            onClick={() => {
              setIsTransferOpen((prev) => !prev);
              setValidationError(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
              isTransferOpen
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-indigo-500/20'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isTransferOpen ? 'Chiudi' : 'Giroconto'}</span>
            <span className="sm:hidden">{isTransferOpen ? 'Chiudi' : 'Trasferisci'}</span>
            {isTransferOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Touch-Friendly Horizontal Carousel with Snap */}
      <div
        ref={carouselRef}
        onScroll={updateScrollStatus}
        className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 px-0.5 -mx-1"
      >
        {accounts.map((acc, idx) => {
          const balance = balances[acc.id] || 0;
          const isSelected = selectedAccountId === acc.id;
          const sharePercent =
            totalPositiveBalance > 0 && balance > 0
              ? Math.round((balance / totalPositiveBalance) * 100)
              : 0;

          return (
            <div
              key={acc.id}
              className={`snap-start flex-shrink-0 w-[240px] sm:w-[260px] p-3.5 rounded-2xl bg-slate-950/80 border transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-500 bg-slate-900/90 shadow-lg ring-1 ring-indigo-500/40'
                  : 'border-slate-800 hover:border-slate-700/80 hover:bg-slate-950'
              }`}
            >
              {/* Account Header: Icon + Name + Badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${
                      acc.color || 'from-indigo-600 to-purple-600'
                    } flex items-center justify-center text-white flex-shrink-0 shadow-md`}
                  >
                    <AccountIcon iconName={acc.icon || 'wallet'} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-100 truncate block">
                      {acc.name}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize block truncate">
                      Conto Attivo
                    </span>
                  </div>
                </div>

                {sharePercent > 0 && (
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {sharePercent}%
                  </span>
                )}
              </div>

              {/* Balance display */}
              <div className="my-2 p-2 bg-slate-900/90 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mb-0.5">
                  <span>Saldo disponibile</span>
                  <span
                    className={`font-semibold ${
                      balance < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {balance < 0 ? 'In passivo' : 'Attivo'}
                  </span>
                </div>
                <div
                  className={`text-base sm:text-lg font-black tracking-tight truncate ${
                    balance < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatCurrency(balance, true, acc.currency)}
                </div>
              </div>

              {/* Action buttons for this specific card */}
              <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between gap-1.5">
                {onSelectAccount && (
                  <button
                    type="button"
                    onClick={() => onSelectAccount(isSelected ? 'ALL' : acc.id)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 transition font-medium px-2 py-1 rounded-lg hover:bg-slate-850"
                  >
                    {isSelected ? 'Deseleziona' : 'Filtra'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenTransferForAccount(acc.id)}
                  title={`Giroconto rapido da ${acc.name}`}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 px-2.5 py-1 rounded-xl transition ml-auto active:scale-95 shadow-sm"
                >
                  <ArrowRightLeft className="w-3 h-3 text-indigo-400 hover:text-white" />
                  <span>Giroconto</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Carousel Pagination Dots */}
      {accounts.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {accounts.map((acc, idx) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => scrollToIndex(idx)}
              aria-label={`Vai al conto ${acc.name}`}
              className={`transition-all duration-300 rounded-full ${
                activeIndex === idx
                  ? 'w-5 h-1.5 bg-indigo-500 shadow-sm shadow-indigo-500/50'
                  : 'w-1.5 h-1.5 bg-slate-750 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>
      )}

      {/* Quick Funds Transfer Panel (Compact & Responsive) */}
      {isTransferOpen && (
        <form
          onSubmit={handleSubmitTransfer}
          className="bg-slate-950/90 border border-indigo-500/30 rounded-2xl p-3.5 space-y-3 animate-fade-in"
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Trasferimento Fondi Rapido
            </span>
            <span className="text-[10px] text-slate-400">
              Conferma richiesta prima dell'invio
            </span>
          </div>

          {validationError && (
            <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Accounts Selector (From -> To with swap button) */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 font-medium">
                Da Conto (Origine)
              </label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(balances[acc.id] || 0)})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSwapAccounts}
              title="Inverti conti"
              className="mt-4 p-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl transition active:rotate-180"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1 font-medium">
                A Conto (Destinazione)
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(balances[acc.id] || 0)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount input and fast presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-slate-400 font-medium">
                Importo da Trasferire (€)
              </label>
              {fromAccObj && (
                <span className="text-[10px] text-slate-400">
                  Disp. {fromAccObj.name}:{' '}
                  <strong className="text-white">{formatCurrency(balances[fromAccountId] || 0)}</strong>
                </span>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={transferAmount}
              onChange={(e) => {
                setTransferAmount(e.target.value);
                setValidationError(null);
              }}
              placeholder="0.00 €"
              className="w-full bg-slate-900 border border-slate-700 text-white font-bold text-base rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500"
            />

            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTransferAmount(preset.toString())}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition active:scale-95"
                >
                  +{preset} €
                </button>
              ))}
              {fromAccObj && balances[fromAccountId] > 0 && (
                <button
                  type="button"
                  onClick={() => setTransferAmount(balances[fromAccountId].toFixed(2))}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/30 transition active:scale-95"
                >
                  Tutto ({formatCurrency(balances[fromAccountId])})
                </button>
              )}
            </div>
          </div>

          {/* Note / Causale */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-1 font-medium">
              Causale / Nota (opzionale)
            </label>
            <input
              type="text"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              placeholder="Giroconto Rapido"
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsTransferOpen(false)}
              className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-400 py-2.5 rounded-xl text-xs font-semibold transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Verifica & Esegui</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
