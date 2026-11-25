import React, { useRef, useState, useEffect } from 'react';
import { CreditCard, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Account } from '../types/finance';
import { AccountIcon } from './AccountIcon';
import { formatCurrency } from '../utils/formatters';
import { Translations } from '../utils/translations';

interface AccountsCarouselProps {
  accounts: Account[];
  balances: Record<string, number>;
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
  onManageAccounts: () => void;
  t?: Translations;
}

export const AccountsCarousel: React.FC<AccountsCarouselProps> = ({
  accounts,
  balances,
  selectedAccountId,
  onSelectAccount,
  onManageAccounts,
  t,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(accounts.length > 1);

  // Update carousel scroll position and arrow availability
  const updateScrollStatus = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Approximate active card index
    const cardWidth = 175; // Approx card width + gap
    const index = Math.min(
      accounts.length - 1,
      Math.max(0, Math.round(scrollLeft / cardWidth))
    );
    setActiveIndex(index);
  };

  useEffect(() => {
    updateScrollStatus();
    window.addEventListener('resize', updateScrollStatus);
    return () => window.removeEventListener('resize', updateScrollStatus);
  }, [accounts.length]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 185; // Card width + gap
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

  return (
    <section className="no-print space-y-2">
      {/* Header with Title, Counter and Smooth Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t?.financialAccounts || 'Conti Finanziari'}</span>
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800">
            {activeIndex + 1}/{accounts.length}
          </span>
          <button
            type="button"
            onClick={onManageAccounts}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold cursor-pointer transition hover:underline"
          >
            {t?.manageEdit || 'Gestisci'}
          </button>
        </div>

        {/* Carousel Prev / Next Navigation Arrows */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollCarousel('left')}
            disabled={!canScrollLeft}
            aria-label={t?.prevAccountLabel || 'Previous account'}
            title={t?.prevAccountLabel || 'Previous account'}
            className={`p-1.5 rounded-xl border transition ${
              canScrollLeft
                ? 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 active:scale-95'
                : 'bg-slate-100/90 dark:bg-slate-950/40 text-slate-600 border-slate-200 dark:border-slate-900 cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => scrollCarousel('right')}
            disabled={!canScrollRight}
            aria-label={t?.nextAccountLabel || 'Next account'}
            title={t?.nextAccountLabel || 'Next account'}
            className={`p-1.5 rounded-xl border transition ${
              canScrollRight
                ? 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 active:scale-95'
                : 'bg-slate-100/90 dark:bg-slate-950/40 text-slate-600 border-slate-200 dark:border-slate-900 cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Touch-Friendly Horizontal Carousel with Snap Scrolling */}
      <div
        ref={carouselRef}
        onScroll={updateScrollStatus}
        className="flex space-x-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 px-0.5 -mx-1"
      >
        {accounts.map((acc, idx) => {
          const balance = balances[acc.id] || 0;
          const isSelected = selectedAccountId === acc.id;

            const accCurr = acc.currency || 'EUR';
            return (
              <div
                key={acc.id}
                onClick={() => onSelectAccount(isSelected ? 'ALL' : acc.id)}
                className={`flex-shrink-0 w-44 snap-start rounded-2xl bg-white dark:bg-slate-900 border ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-slate-100 dark:bg-slate-850 shadow-lg shadow-indigo-500/15'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                } p-3.5 active:scale-95 transition-all cursor-pointer select-none`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded-xl bg-gradient-to-tr ${
                      acc.color || 'from-indigo-600 to-purple-600'
                    } text-slate-900 dark:text-white shadow-sm flex items-center justify-center`}
                  >
                    <AccountIcon iconName={acc.icon || 'wallet'} className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      {accCurr}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">{acc.name}</div>
                <div
                  className={`text-base font-extrabold mt-0.5 truncate tracking-tight ${
                    balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {formatCurrency(balance, true, accCurr)}
                </div>
              </div>
            );
          })}
        </div>

      {/* Pagination Indicator Dots */}
      {accounts.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {accounts.map((acc, index) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => scrollToIndex(index)}
              aria-label={`Vai al conto ${acc.name}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? 'w-6 bg-indigo-500'
                  : 'w-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};
