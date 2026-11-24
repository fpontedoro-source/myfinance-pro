import React from 'react';
import {
  Calculator,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  TrendingDown,
  Globe,
  HandCoins,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { CurrencyBreakdownItem } from '../utils/currencyExchange';
import { Language, Translations } from '../utils/translations';

interface MetricsBannerProps {
  titleLabel: string;
  totalBalance: number;
  realLiquidity?: number;
  creditsReceivable?: number;
  debtsPayable?: number;
  showNetWorthBreakdown?: boolean;
  onOpenDebtsCredits?: () => void;
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
  dailyAvg: number;
  subtext: string;
  currencyOverride?: string;
  baseCurrencyCode?: string;
  hasMultipleCurrencies?: boolean;
  currencyBreakdown?: CurrencyBreakdownItem[];
  onOpenFxSettings?: () => void;
  language?: Language;
  t?: Translations;
}

export const MetricsBanner: React.FC<MetricsBannerProps> = ({
  titleLabel,
  totalBalance,
  realLiquidity,
  creditsReceivable = 0,
  debtsPayable = 0,
  showNetWorthBreakdown = false,
  onOpenDebtsCredits,
  totalIncome,
  totalExpense,
  savingsRate,
  dailyAvg,
  subtext,
  currencyOverride,
  baseCurrencyCode = 'EUR',
  hasMultipleCurrencies = false,
  currencyBreakdown = [],
  onOpenFxSettings,
  language = 'it',
  t,
}) => {
  const effectiveCurrency = currencyOverride || baseCurrencyCode;
  const isDe = language === 'de';
  const isEn = language === 'en';
  const hasDebtsOrCredits = creditsReceivable > 0.005 || debtsPayable > 0.005;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/20 p-5 shadow-xl print-card">
      <div className="flex items-center justify-between gap-2 text-indigo-400 font-medium text-xs mb-1">
        <span className="flex items-center gap-1.5 truncate">
          <Calculator className="w-3.5 h-3.5 no-print flex-shrink-0" />
          <span className="truncate">{titleLabel}</span>
        </span>
        {onOpenFxSettings ? (
          <button
            type="button"
            onClick={onOpenFxSettings}
            className="text-[11px] bg-indigo-500/15 hover:bg-indigo-500/30 px-2.5 py-1 rounded-xl text-indigo-200 font-semibold border border-indigo-500/30 flex items-center gap-1 flex-shrink-0 transition active:scale-95 no-print"
            title={
              isDe
                ? 'Basiswährung & Wechselkurse'
                : isEn
                  ? 'Base Currency & FX Rates'
                  : 'Valuta Base & Tassi di Cambio'
            }
          >
            <Globe className="w-3 h-3 text-cyan-300" />
            <span>{effectiveCurrency}</span>
          </button>
        ) : (
          <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-300 font-bold border border-indigo-500/30">
            {t?.totalLabel || 'Totale'}
          </span>
        )}
      </div>

      <div className="text-3xl font-black tracking-tight tabular-nums text-white print-text-dark my-1">
        {formatCurrency(totalBalance, true, effectiveCurrency)}
      </div>

      {/* Distinct Real Liquidity / Credits / Debts breakdown */}
      {showNetWorthBreakdown && hasDebtsOrCredits && realLiquidity !== undefined && (
        <button
          type="button"
          onClick={onOpenDebtsCredits}
          className="w-full text-left mt-1.5 mb-2 p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 transition no-print"
        >
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <div className="min-w-0">
              <div className="text-slate-400 truncate">
                {isDe ? 'Liquidität' : isEn ? 'Liquid Cash' : 'Liquidità Reale'}
              </div>
              <div className="font-bold text-white tabular-nums truncate mt-0.5">
                {formatCurrency(realLiquidity, true, effectiveCurrency)}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-emerald-400 truncate">
                {isDe ? 'Forderungen' : isEn ? 'Credits (+)' : 'Crediti (+)'}
              </div>
              <div className="font-bold text-emerald-300 tabular-nums truncate mt-0.5">
                +{formatCurrency(creditsReceivable, true, effectiveCurrency)}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-rose-400 truncate">
                {isDe ? 'Schulden' : isEn ? 'Debts (-)' : 'Debiti (-)'}
              </div>
              <div className="font-bold text-rose-300 tabular-nums truncate mt-0.5">
                -{formatCurrency(debtsPayable, true, effectiveCurrency)}
              </div>
            </div>
          </div>
        </button>
      )}

      {!currencyOverride && hasMultipleCurrencies && currencyBreakdown.length > 0 && (
        <div className="text-[11px] text-cyan-300/90 font-medium tabular-nums truncate mb-0.5">
          {currencyBreakdown
            .map((item) => `${item.currency} ${formatCurrency(item.nativeTotal, true, item.currency)}`)
            .join(' · ')}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-slate-400 print-text-dark truncate">{subtext}</p>
        {showNetWorthBreakdown && onOpenDebtsCredits && !hasDebtsOrCredits && (
          <button
            type="button"
            onClick={onOpenDebtsCredits}
            className="text-[10px] font-semibold text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1 flex-shrink-0 no-print"
          >
            <HandCoins className="w-3 h-3" />
            <span>
              {isDe ? 'Schulden/Forder.' : isEn ? 'Debts & Credits' : 'Debiti & Crediti'}
            </span>
          </button>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-slate-800/80">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-2.5">
          <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mb-0.5">
            <ArrowDownLeft className="w-3 h-3" /> {t?.incomeWord || 'Entrate'}
          </div>
          <div className="text-sm font-bold tabular-nums text-emerald-300 truncate">
            {formatCurrency(totalIncome, true, effectiveCurrency)}
          </div>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-2.5">
          <div className="text-[10px] text-rose-400 font-semibold flex items-center gap-1 mb-0.5">
            <ArrowUpRight className="w-3 h-3" /> {t?.expenseWord || 'Uscite'}
          </div>
          <div className="text-sm font-bold tabular-nums text-rose-300 truncate">
            {formatCurrency(totalExpense, true, effectiveCurrency)}
          </div>
        </div>

        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-2.5">
          <div className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1 mb-0.5">
            <PiggyBank className="w-3 h-3" /> {t?.savingsRateLabel || 'Tasso Risparmio'}
          </div>
          <div className="text-sm font-bold tabular-nums text-indigo-300">
            {savingsRate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-2.5">
          <div className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mb-0.5">
            <TrendingDown className="w-3 h-3" /> {t?.dailyAvgLabel || 'Spesa Media/Giorno'}
          </div>
          <div className="text-sm font-bold tabular-nums text-amber-300 truncate">
            {formatCurrency(dailyAvg, true, effectiveCurrency)}
          </div>
        </div>
      </div>
    </div>
  );
};

