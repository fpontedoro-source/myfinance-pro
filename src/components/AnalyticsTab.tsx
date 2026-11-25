import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Wallet,
  ArrowLeftRight,
  Hash,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Account, FxSettings, Transaction } from '../types/finance';
import { formatCurrency, getCurrencySymbol, getAppPrivacyMode } from '../utils/formatters';
import {
  DEFAULT_FX_SETTINGS,
  convertCurrencyAmount,
  getAccountCurrencyCode,
} from '../utils/currencyExchange';
import {
  Language,
  Translations,
  getCategoryDisplayName,
  formatLocalizedMonthYear,
} from '../utils/translations';

// Register all Chart.js controllers, scales, elements, and plugins
ChartJS.register(...registerables);

interface AnalyticsTabProps {
  accounts: Account[];
  balances: Record<string, number>;
  transactions: Transaction[];
  fxSettings?: FxSettings;
  privacyMode?: boolean;
  language?: Language;
  t?: Translations;
}

type TimeRange = '30D' | '90D' | '1Y' | 'ALL';
export type ExpensePeriod = 'MONTH' | '30D' | '90D' | 'YEAR' | 'ALL';
type ChartViewType = 'line' | 'pie' | 'doughnut' | 'bar' | 'mom' | 'tags';

interface BalancePoint {
  date: string;
  formattedDate: string;
  fullDate: string;
  balance: number;
  dailyChange: number;
}

const CATEGORY_COLORS = [
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
  '#e11d48', // red
  '#64748b', // slate
];

const EXPENSE_PERIOD_OPTIONS: { id: ExpensePeriod; label: string }[] = [
  { id: 'MONTH', label: 'Questo Mese' },
  { id: '30D', label: '30 Giorni' },
  { id: '90D', label: '90 Giorni' },
  { id: 'YEAR', label: "Quest'Anno" },
  { id: 'ALL', label: 'Tutto' },
];

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  accounts,
  balances,
  transactions,
  fxSettings = DEFAULT_FX_SETTINGS,
  privacyMode = false,
  language = 'it',
  t,
}) => {
  const [chartType, setChartType] = useState<ChartViewType>('line');
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [expensePeriod, setExpensePeriod] = useState<ExpensePeriod>('MONTH');
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [momSortMode, setMomSortMode] = useState<'impact' | 'current'>('impact');
  const [tagPeriod, setTagPeriod] = useState<ExpensePeriod>('ALL');
  const [tagSearchQuery, setTagSearchQuery] = useState<string>('');
  const [expandedTag, setExpandedTag] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);
  const baseCurrency = fxSettings.baseCurrency;

  // 1. Current unified total balance converted across all accounts
  const currentTotalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      const native = balances[acc.id] ?? balances[acc.name] ?? 0;
      return sum + convertCurrencyAmount(native, acc.currency, baseCurrency, fxSettings.rates);
    }, 0);
  }, [accounts, balances, baseCurrency, fxSettings.rates]);

  const isDe = language === 'de';
  const isEn = language === 'en';
  const dateLocale = isDe ? 'de-DE' : isEn ? 'en-US' : 'it-IT';
  const todayWord = isDe ? 'Heute' : isEn ? 'Today' : 'Oggi';

  // 2. Build chronological balance history over time using Recharts
  const balanceHistory = useMemo<BalancePoint[]>(() => {
    if (transactions.length === 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      return [
        {
          date: todayStr,
          formattedDate: todayWord,
          fullDate: new Date().toLocaleDateString(dateLocale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          balance: currentTotalBalance,
          dailyChange: 0,
        },
      ];
    }

    // Sort transactions chronologically (oldest to newest)
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate total net change across all transactions in baseCurrency
    let totalNetChange = 0;
    const dailyChanges: Record<string, number> = {};

    sorted.forEach((tx) => {
      let delta = 0;
      const accCurr = getAccountCurrencyCode(tx.account, accounts);
      const converted = convertCurrencyAmount(tx.amount, accCurr, baseCurrency, fxSettings.rates);
      if (tx.type === 'INCOME') delta = converted;
      else if (tx.type === 'EXPENSE') delta = -converted;
      // Transfers don't change the overall total balance

      totalNetChange += delta;
      dailyChanges[tx.date] = (dailyChanges[tx.date] || 0) + delta;
    });

    // The starting base balance before the recorded transactions
    const initialBase = currentTotalBalance - totalNetChange;

    // Get unique dates in ascending order
    const uniqueDates = Array.from(new Set(sorted.map((t) => t.date))).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    let runningBalance = initialBase;
    const points: BalancePoint[] = [];

    // Add an initial baseline point if there's only one date or starting point
    if (uniqueDates.length > 0) {
      const firstDate = new Date(uniqueDates[0]);
      const prevDate = new Date(firstDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().split('T')[0];

      points.push({
        date: prevDateStr,
        formattedDate: prevDate.toLocaleDateString(dateLocale, {
          day: 'numeric',
          month: 'short',
        }),
        fullDate: prevDate.toLocaleDateString(dateLocale, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        balance: Math.round(initialBase * 100) / 100,
        dailyChange: 0,
      });
    }

    uniqueDates.forEach((dateStr) => {
      const change = dailyChanges[dateStr] || 0;
      runningBalance += change;
      const d = new Date(dateStr + 'T00:00:00');

      points.push({
        date: dateStr,
        formattedDate: d.toLocaleDateString(dateLocale, {
          day: 'numeric',
          month: 'short',
        }),
        fullDate: d.toLocaleDateString(dateLocale, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        balance: Math.round(runningBalance * 100) / 100,
        dailyChange: Math.round(change * 100) / 100,
      });
    });

    // Ensure today's date point is included if latest transaction was earlier
    const todayStr = new Date().toISOString().split('T')[0];
    const lastPoint = points[points.length - 1];
    if (lastPoint && lastPoint.date !== todayStr) {
      const todayDate = new Date();
      points.push({
        date: todayStr,
        formattedDate: todayWord,
        fullDate: todayDate.toLocaleDateString(dateLocale, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        balance: Math.round(currentTotalBalance * 100) / 100,
        dailyChange: 0,
      });
    }

    // Filter points based on selected timeRange
    if (timeRange === 'ALL') {
      return points;
    }

    const nowTime = new Date().getTime();
    let daysToSubtract = 30;
    if (timeRange === '90D') daysToSubtract = 90;
    if (timeRange === '1Y') daysToSubtract = 365;

    const cutoffTime = nowTime - daysToSubtract * 24 * 60 * 60 * 1000;
    const filtered = points.filter((p) => new Date(p.date).getTime() >= cutoffTime);

    // If filtered has fewer than 2 points, ensure at least 2 points for smooth line rendering
    if (filtered.length < 2 && points.length >= 2) {
      return points.slice(-Math.min(points.length, 5));
    }

    return filtered;
  }, [transactions, currentTotalBalance, timeRange, dateLocale, todayWord]);

  // Balance stats in the selected range
  const { minBalance, maxBalance, startBalance, endBalance, balanceDelta, balanceDeltaPercent } =
    useMemo(() => {
      if (balanceHistory.length === 0) {
        return {
          minBalance: 0,
          maxBalance: 0,
          startBalance: 0,
          endBalance: 0,
          balanceDelta: 0,
          balanceDeltaPercent: 0,
        };
      }

      let min = balanceHistory[0].balance;
      let max = balanceHistory[0].balance;
      balanceHistory.forEach((p) => {
        if (p.balance < min) min = p.balance;
        if (p.balance > max) max = p.balance;
      });

      const start = balanceHistory[0].balance;
      const end = balanceHistory[balanceHistory.length - 1].balance;
      const delta = end - start;
      const pct = start !== 0 ? (delta / Math.abs(start)) * 100 : 0;

      return {
        minBalance: min,
        maxBalance: max,
        startBalance: start,
        endBalance: end,
        balanceDelta: delta,
        balanceDeltaPercent: pct,
      };
    }, [balanceHistory]);

  // 3. Category Expenses Breakdown for Selected Period (Recharts Pie Chart)
  const categoryExpenses = useMemo(() => {
    const now = new Date();
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const filteredExpenses = transactions.filter((tx) => {
      if (tx.type !== 'EXPENSE') return false;
      const txDate = new Date(tx.date + 'T00:00:00');

      switch (expensePeriod) {
        case 'MONTH':
          return (
            txDate.getFullYear() === now.getFullYear() &&
            txDate.getMonth() === now.getMonth()
          );
        case '30D': {
          const limitDate = new Date(todayZero);
          limitDate.setDate(limitDate.getDate() - 30);
          return txDate >= limitDate;
        }
        case '90D': {
          const limitDate = new Date(todayZero);
          limitDate.setDate(limitDate.getDate() - 90);
          return txDate >= limitDate;
        }
        case 'YEAR':
          return txDate.getFullYear() === now.getFullYear();
        case 'ALL':
        default:
          return true;
      }
    });

    const categoryTotals: Record<string, number> = {};
    let totalExpense = 0;

    filteredExpenses.forEach((tx) => {
      const accCurr = getAccountCurrencyCode(tx.account, accounts);
      const converted = convertCurrencyAmount(tx.amount, accCurr, baseCurrency, fxSettings.rates);
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + converted;
      totalExpense += converted;
    });

    const sorted = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => b.amount - a.amount);

    const chartData = sorted.map((item, index) => {
      const percentage = totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0;
      return {
        name: getCategoryDisplayName(item.category, language),
        rawCategory: item.category,
        value: item.amount,
        percentage,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      };
    });

    return {
      totalExpense,
      sortedCategories: sorted,
      chartData,
      count: filteredExpenses.length,
      hasData: chartData.length > 0 && totalExpense > 0,
    };
  }, [transactions, expensePeriod, accounts, baseCurrency, fxSettings.rates, language]);

  // 4. Month-over-Month Category Comparison (Questo mese vs Mese scorso)
  const momComparison = useMemo(() => {
    const now = new Date();
    const curDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const curKey = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, '0')}`;
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const curLabel = formatLocalizedMonthYear(curDate, language);
    const prevLabel = formatLocalizedMonthYear(prevDate, language);

    const curByCat: Record<string, number> = {};
    const prevByCat: Record<string, number> = {};
    let curTotal = 0;
    let prevTotal = 0;

    transactions.forEach((tx) => {
      if (tx.type !== 'EXPENSE' || !tx.date) return;
      const monthPrefix = tx.date.slice(0, 7);
      if (monthPrefix !== curKey && monthPrefix !== prevKey) return;

      const accCurr = getAccountCurrencyCode(tx.account, accounts);
      const conv = convertCurrencyAmount(tx.amount, accCurr, baseCurrency, fxSettings.rates);
      const cat = tx.category || 'Altro';

      if (monthPrefix === curKey) {
        curByCat[cat] = (curByCat[cat] || 0) + conv;
        curTotal += conv;
      } else {
        prevByCat[cat] = (prevByCat[cat] || 0) + conv;
        prevTotal += conv;
      }
    });

    const allCats = Array.from(
      new Set([...Object.keys(curByCat), ...Object.keys(prevByCat)])
    );

    const rows = allCats
      .map((category) => {
        const currentSpend = Math.round((curByCat[category] || 0) * 100) / 100;
        const prevSpend = Math.round((prevByCat[category] || 0) * 100) / 100;
        const diff = Math.round((currentSpend - prevSpend) * 100) / 100;
        const isNew = prevSpend === 0 && currentSpend > 0;
        const pctChange =
          prevSpend > 0 ? ((currentSpend - prevSpend) / prevSpend) * 100 : isNew ? 100 : 0;

        return {
          category,
          displayName: getCategoryDisplayName(category, language),
          currentSpend,
          prevSpend,
          diff,
          pctChange,
          isNew,
        };
      })
      .filter((r) => r.currentSpend > 0 || r.prevSpend > 0)
      .sort((a, b) =>
        momSortMode === 'impact'
          ? Math.abs(b.diff) - Math.abs(a.diff)
          : b.currentSpend - a.currentSpend
      );

    const totalDiff = Math.round((curTotal - prevTotal) * 100) / 100;
    const totalPct =
      prevTotal > 0 ? ((curTotal - prevTotal) / prevTotal) * 100 : curTotal > 0 ? 100 : 0;
    const maxCatAmount = rows.reduce(
      (m, r) => Math.max(m, r.currentSpend, r.prevSpend),
      0
    );

    return {
      curLabel,
      prevLabel,
      curTotal,
      prevTotal,
      totalDiff,
      totalPct,
      maxCatAmount,
      rows,
    };
  }, [transactions, accounts, baseCurrency, fxSettings.rates, language, momSortMode]);

  // 5. #Tag Summary Aggregation
  const tagSummary = useMemo(() => {
    const now = new Date();
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const inPeriod = transactions.filter((tx) => {
      if (!tx.tags || tx.tags.length === 0) return false;
      if (tx.type === 'TRANSFER') return false;
      const txDate = new Date(tx.date + 'T00:00:00');
      switch (tagPeriod) {
        case 'MONTH':
          return (
            txDate.getFullYear() === now.getFullYear() &&
            txDate.getMonth() === now.getMonth()
          );
        case '30D': {
          const limitDate = new Date(todayZero);
          limitDate.setDate(limitDate.getDate() - 30);
          return txDate >= limitDate;
        }
        case '90D': {
          const limitDate = new Date(todayZero);
          limitDate.setDate(limitDate.getDate() - 90);
          return txDate >= limitDate;
        }
        case 'YEAR':
          return txDate.getFullYear() === now.getFullYear();
        case 'ALL':
        default:
          return true;
      }
    });

    const buckets = new Map<
      string,
      {
        tag: string;
        expenseTotal: number;
        incomeTotal: number;
        netTotal: number;
        txCount: number;
        transactions: Transaction[];
      }
    >();

    let grandExpense = 0;
    let grandIncome = 0;

    inPeriod.forEach((tx) => {
      const accCurr = getAccountCurrencyCode(tx.account, accounts);
      const conv = convertCurrencyAmount(tx.amount, accCurr, baseCurrency, fxSettings.rates);
      if (tx.type === 'EXPENSE') grandExpense += conv;
      else if (tx.type === 'INCOME') grandIncome += conv;

      const uniqueTags = Array.from(
        new Set(
          (tx.tags || [])
            .map((raw) => raw.trim().replace(/^#+/, '').toLowerCase())
            .filter(Boolean)
        )
      );

      uniqueTags.forEach((tag) => {
        const entry = buckets.get(tag) || {
          tag,
          expenseTotal: 0,
          incomeTotal: 0,
          netTotal: 0,
          txCount: 0,
          transactions: [],
        };
        if (tx.type === 'EXPENSE') {
          entry.expenseTotal += conv;
          entry.netTotal -= conv;
        } else if (tx.type === 'INCOME') {
          entry.incomeTotal += conv;
          entry.netTotal += conv;
        }
        entry.txCount += 1;
        entry.transactions.push(tx);
        buckets.set(tag, entry);
      });
    });

    const q = tagSearchQuery.trim().replace(/^#+/, '').toLowerCase();
    const list = Array.from(buckets.values())
      .filter((item) => !q || item.tag.includes(q))
      .map((item) => ({
        ...item,
        transactions: [...item.transactions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      }))
      .sort((a, b) => b.expenseTotal - a.expenseTotal || b.txCount - a.txCount);

    const maxTagSpend = list.reduce(
      (m, r) => Math.max(m, r.expenseTotal, r.incomeTotal),
      0
    );

    return {
      tags: list,
      totalTagsCount: buckets.size,
      grandExpense,
      grandIncome,
      maxTagSpend,
    };
  }, [transactions, tagPeriod, tagSearchQuery, accounts, baseCurrency, fxSettings.rates]);

  // Chart.js render for Doughnut (accounts) and Bar charts (months)
  useEffect(() => {
    if (chartType !== 'doughnut' && chartType !== 'bar') {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartType === 'doughnut') {
      const labels = accounts.map((a) => `${a.name} (${a.currency || 'EUR'})`);
      const data = accounts.map((a) =>
        Math.max(
          0,
          convertCurrencyAmount(balances[a.id] || 0, a.currency, baseCurrency, fxSettings.rates)
        )
      );
      const chartColors = [
        '#6366f1',
        '#10b981',
        '#f59e0b',
        '#06b6d4',
        '#a855f7',
        '#ec4899',
        '#3b82f6',
      ];

      chartInstanceRef.current = new ChartJS(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: chartColors.slice(0, accounts.length),
              borderWidth: 2,
              borderColor: '#020617',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#94a3b8',
                font: { size: 10, family: 'Plus Jakarta Sans' },
                boxWidth: 8,
                padding: 10,
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const val = context.parsed;
                  return ` ${context.label}: ${formatCurrency(val, true, baseCurrency)}`;
                },
              },
            },
          },
          cutout: '65%',
        },
      });
    } else if (chartType === 'bar') {
      // 6-month historical Bar Chart
      const months: string[] = [];
      const incomes: number[] = [];
      const expenses: number[] = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleString(dateLocale, { month: 'short' });
        months.push(monthLabel);

        let inc = 0;
        let exp = 0;

        transactions.forEach((tx) => {
          const txDate = new Date(tx.date);
          if (
            txDate.getFullYear() === d.getFullYear() &&
            txDate.getMonth() === d.getMonth()
          ) {
            const accCurr = getAccountCurrencyCode(tx.account, accounts);
            const conv = convertCurrencyAmount(tx.amount, accCurr, baseCurrency, fxSettings.rates);
            if (tx.type === 'INCOME') inc += conv;
            else if (tx.type === 'EXPENSE') exp += conv;
          }
        });

        incomes.push(inc);
        expenses.push(exp);
      }

      chartInstanceRef.current = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [
            {
              label: t?.incomeWord || (isDe ? 'Einnahmen' : isEn ? 'Income' : 'Entrate'),
              data: incomes,
              backgroundColor: '#10b981',
              borderRadius: 6,
            },
            {
              label: t?.expenseWord || (isDe ? 'Ausgaben' : isEn ? 'Expenses' : 'Uscite'),
              data: expenses,
              backgroundColor: '#f43f5e',
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#94a3b8',
                font: { size: 10 },
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const val = context.parsed.y ?? 0;
                  return ` ${context.dataset.label}: ${formatCurrency(val, true, baseCurrency)}`;
                },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: '#64748b', font: { size: 9 } },
              grid: { display: false },
            },
            y: {
              ticks: {
                color: '#64748b',
                font: { size: 9 },
                callback: (val) => (privacyMode || getAppPrivacyMode() ? '••••' : val),
              },
              grid: { color: '#1e293b' },
            },
          },
        },
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [chartType, accounts, balances, transactions, baseCurrency, fxSettings.rates, dateLocale, language, t, privacyMode]);

  // Custom Dark Recharts Tooltip for Balance Area Chart
  const renderBalanceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: BalancePoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-indigo-500/40 p-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs z-50">
          <p className="text-[10px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            {data.fullDate}
          </p>
          <div className="flex items-center gap-1.5 text-white font-extrabold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
            <span>{formatCurrency(data.balance, true, baseCurrency)}</span>
          </div>
          {data.dailyChange !== 0 && (
            <div
              className={`text-[10px] font-bold mt-1.5 flex items-center gap-1 ${
                data.dailyChange > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {data.dailyChange > 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              <span>
                {data.dailyChange > 0 ? '+' : ''}
                {formatCurrency(data.dailyChange, true, baseCurrency)}{' '}
                ({isDe ? 'Tagesbewegung' : isEn ? 'daily net' : 'movimenti del giorno'})
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom Dark Recharts Tooltip for Expenses Pie Chart
  const renderPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs z-50 min-w-[150px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-bold text-white text-xs truncate">{data.name}</span>
          </div>
          <div className="text-base font-black text-rose-400">
            {formatCurrency(data.value, true, baseCurrency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
            {data.percentage.toFixed(1)}% {isDe ? 'der Gesamtausgaben' : isEn ? 'of period total' : 'del totale periodo'}
          </div>
        </div>
      );
    }
    return null;
  };

  // Render the interactive Recharts Pie Chart component
  const renderInteractivePieChart = (isHeroView = false) => {
    const { chartData, totalExpense, hasData } = categoryExpenses;

    if (!hasData) {
      return (
        <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <PieChartIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-300">
            {isDe ? 'Keine Ausgaben im Zeitraum' : isEn ? 'No expenses in period' : 'Nessuna spesa nel periodo'}
          </p>
          <p className="text-xs text-slate-500 max-w-xs">
            {isDe
              ? 'Keine Ausgaben für den gewählten Zeitraum gefunden. Bitte anderen Zeitraum wählen.'
              : isEn
                ? 'No expenses recorded for the selected period. Try selecting another range.'
                : 'Non risultano uscite registrate per il filtro selezionato. Prova a cambiare periodo.'}
          </p>
        </div>
      );
    }

    const activeItem = activePieIndex !== null ? chartData[activePieIndex] : null;

    return (
      <div className="space-y-4">
        {/* Donut Chart with Centered Metric Info */}
        <div className="relative h-64 sm:h-72 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <RechartsTooltip content={renderPieTooltip} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={isHeroView ? 65 : 60}
                outerRadius={isHeroView ? 95 : 88}
                paddingAngle={3}
                dataKey="value"
                onMouseEnter={(_: any, index: number) => setActivePieIndex(index)}
                onMouseLeave={() => setActivePieIndex(null)}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`pie-slice-${entry.name}`}
                    fill={entry.color}
                    stroke="#020617"
                    strokeWidth={2}
                    className="cursor-pointer transition-all duration-200 outline-none hover:opacity-100"
                    opacity={activePieIndex === null || activePieIndex === index ? 1 : 0.45}
                  />
                ))}
              </Pie>
            </RechartsPieChart>
          </ResponsiveContainer>

          {/* Centered Donut Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            {activeItem ? (
              <>
                <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px] uppercase tracking-wide">
                  {activeItem.name}
                </span>
                <span className="text-base sm:text-lg font-black text-rose-400">
                  {formatCurrency(activeItem.value, true, baseCurrency)}
                </span>
                <span className="text-[10px] font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full mt-0.5">
                  {activeItem.percentage.toFixed(1)}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                  {t?.totalExpenseLabel || (isDe ? 'Gesamtausgaben' : isEn ? 'Total Expenses' : 'Totale Uscite')}
                </span>
                <span className="text-base sm:text-lg font-black text-white">
                  {formatCurrency(totalExpense, true, baseCurrency)}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {chartData.length}{' '}
                  {isDe
                    ? chartData.length === 1 ? 'Kategorie' : 'Kategorien'
                    : isEn
                      ? chartData.length === 1 ? 'category' : 'categories'
                      : chartData.length === 1 ? 'categoria' : 'categorie'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Categories Chips / Legend */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          {chartData.map((item, index) => {
            const isSelected = activePieIndex === index;
            return (
              <button
                key={item.name}
                onClick={() =>
                  setActivePieIndex(activePieIndex === index ? null : index)
                }
                onMouseEnter={() => setActivePieIndex(index)}
                onMouseLeave={() => setActivePieIndex(null)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                  isSelected
                    ? 'bg-slate-800 text-white ring-1 ring-slate-600 shadow-md scale-105'
                    : 'bg-slate-950/70 text-slate-300 hover:bg-slate-800/70 hover:text-white border border-slate-800/80'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate max-w-[90px]">{item.name}</span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {item.percentage.toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header and Chart Switcher */}
      <div className="flex flex-col gap-2.5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" /> {t?.analyticsTitle || 'Analisi Grafica'}
        </h2>
        <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setChartType('line')}
            className={`min-h-[38px] flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl transition-all ${
              chartType === 'line'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{t?.chartTrend || 'Andamento'}</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('pie')}
            className={`min-h-[38px] flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl transition-all ${
              chartType === 'pie'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{t?.chartExpensesPie || 'Torta Spese'}</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('doughnut')}
            className={`min-h-[38px] flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl transition-all ${
              chartType === 'doughnut'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{t?.chartAccounts || 'Conti'}</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`min-h-[38px] flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl transition-all ${
              chartType === 'bar'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{t?.chartMonthly6M || 'Mesi (6M)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('mom')}
            className={`min-h-[38px] flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl transition-all ${
              chartType === 'mom'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {isDe ? 'Monatsvergl.' : isEn ? 'MoM Diff' : 'Mese vs Mese'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('tags')}
            className={`min-h-[38px] flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl transition-all ${
              chartType === 'tags'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Hash className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {isDe ? '#Tag-Report' : isEn ? '#Tag Summary' : 'Riepilogo #tag'}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW A: Interactive Line Chart with Recharts (Andamento Saldo nel Tempo) */}
      {chartType === 'line' && (
        <div className="space-y-3">
          {/* Key Trend Highlights Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                  {t?.balanceHistoryTitle || 'Andamento Saldo nel Tempo'}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-white tabular-nums">
                    {formatCurrency(currentTotalBalance, true, baseCurrency)}
                  </span>
                  <span
                    className={`text-xs font-bold flex items-center tabular-nums ${
                      balanceDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {balanceDelta >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {balanceDelta >= 0 ? '+' : ''}
                      {formatCurrency(balanceDelta, true, baseCurrency)}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      ({balanceDeltaPercent >= 0 ? '+' : ''}
                      {balanceDeltaPercent.toFixed(1)}%)
                    </span>
                  </span>
                </div>
              </div>

              {/* Time Range Filter Buttons */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                {(['30D', '90D', '1Y', 'ALL'] as TimeRange[]).map((range) => {
                  const labels: Record<TimeRange, string> = {
                    '30D': t?.period30D || '30G',
                    '90D': t?.period90D || '90G',
                    '1Y': t?.period1Y || '1 Anno',
                    ALL: t?.periodAllTime || 'Tutto',
                  };
                  const active = timeRange === range;
                  return (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        active
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {labels[range]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recharts Area / Line Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={balanceHistory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                      <stop offset="60%" stopColor="#6366f1" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="formattedDate"
                    stroke="#64748b"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    dy={5}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val: number) => {
                      const sym = getCurrencySymbol(baseCurrency);
                      if (privacyMode || getAppPrivacyMode()) {
                        return `${sym}••••`;
                      }
                      if (Math.abs(val) >= 1000) {
                        return `${sym}${(val / 1000).toFixed(1)}k`;
                      }
                      return `${sym}${val}`;
                    }}
                  />
                  <RechartsTooltip content={renderBalanceTooltip} />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#balanceGradient)"
                    activeDot={{
                      r: 6,
                      fill: '#818cf8',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Min / Max Range Footprint */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px]">
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">{t?.minBalanceLabel || 'Minimo nel periodo'}</span>
                <span className="font-bold text-slate-200 tabular-nums">{formatCurrency(minBalance, true, baseCurrency)}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">{t?.maxBalanceLabel || 'Massimo nel periodo'}</span>
                <span className="font-bold text-emerald-400 tabular-nums">{formatCurrency(maxBalance, true, baseCurrency)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: Dedicated Recharts Pie Chart in Top View */}
      {chartType === 'pie' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                {t?.expensesByCategory || (isDe ? 'Ausgaben-Diagramm' : isEn ? 'Expenses Breakdown' : 'Grafico a Torta Spese')} ({baseCurrency})
              </span>
              <div className="text-xl font-black text-white mt-0.5 tabular-nums">
                {formatCurrency(categoryExpenses.totalExpense, true, baseCurrency)}
              </div>
            </div>

            {/* Expense Period Selector */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {EXPENSE_PERIOD_OPTIONS.map((opt) => {
                const active = expensePeriod === opt.id;
                const periodLabels: Record<string, string> = {
                  MONTH: t?.periodMonth || 'Questo Mese',
                  '30D': t?.period30D || '30 Giorni',
                  '90D': t?.period90D || '90 Giorni',
                  YEAR: t?.periodYear || "Quest'Anno",
                  ALL: t?.periodAll || 'Tutto',
                };
                return (
                  <button
                    key={opt.id}
                    onClick={() => setExpensePeriod(opt.id)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {periodLabels[opt.id] || opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Donut Chart */}
          {renderInteractivePieChart(true)}
        </div>
      )}

      {/* VIEW C & D: Chart.js Canvas (Doughnut Conti o Bar Chart Mesi) */}
      {(chartType === 'doughnut' || chartType === 'bar') && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 flex flex-col items-center justify-center">
          <div className="relative h-64 w-full flex items-center justify-center">
            <canvas ref={canvasRef} />
          </div>
          <p className="mt-3 text-xs text-slate-400 text-center">
            {chartType === 'doughnut'
              ? t?.accountsBreakdown || (isDe ? 'Vermögensaufteilung nach Konten' : isEn ? 'Net worth breakdown by account' : 'Distribuzione dei fondi disponibili sui conti')
              : t?.monthlyExpensesIncomes || (isDe ? 'Einnahmen vs. Ausgaben (Letzte 6 Monate)' : isEn ? 'Income vs. Expenses (Last 6 Months)' : 'Entrate vs Uscite negli ultimi 6 mesi')}
          </p>
        </div>
      )}

      {/* VIEW E: Month-over-Month Category Comparison (Questo mese vs Mese scorso) */}
      {chartType === 'mom' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold block">
                {isDe
                  ? 'MONATSVERGLEICH NACH KATEGORIE'
                  : isEn
                    ? 'MONTH-OVER-MONTH COMPARISON'
                    : 'CONFRONTO MESE SU MESE PER CATEGORIA'}
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {momComparison.curLabel} vs {momComparison.prevLabel}
              </h3>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setMomSortMode('impact')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  momSortMode === 'impact'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isDe ? 'Größte Diff.' : isEn ? 'Top Delta' : 'Maggior Scarto'}
              </button>
              <button
                type="button"
                onClick={() => setMomSortMode('current')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  momSortMode === 'current'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isDe ? 'Aktuell' : isEn ? 'Current Spend' : 'Spesa Attuale'}
              </button>
            </div>
          </div>

          {/* MoM Totals Strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-2xl bg-slate-950/75 border border-slate-800">
              <div className="text-[10px] text-slate-400 truncate">
                {isDe ? 'Dieser Monat' : isEn ? 'This Month' : 'Questo Mese'}
              </div>
              <div className="text-xs sm:text-sm font-black text-white tabular-nums mt-0.5 truncate">
                {formatCurrency(momComparison.curTotal, true, baseCurrency)}
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950/75 border border-slate-800">
              <div className="text-[10px] text-slate-400 truncate">
                {isDe ? 'Letzter Monat' : isEn ? 'Last Month' : 'Mese Scorso'}
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-300 tabular-nums mt-0.5 truncate">
                {formatCurrency(momComparison.prevTotal, true, baseCurrency)}
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950/75 border border-slate-800">
              <div className="text-[10px] text-slate-400 truncate">
                {isDe ? 'Veränderung' : isEn ? 'Change' : 'Variazione'}
              </div>
              <div
                className={`text-xs sm:text-sm font-black tabular-nums mt-0.5 truncate ${
                  momComparison.totalDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {momComparison.totalDiff > 0 ? '+' : ''}
                {momComparison.totalPct.toFixed(0)}%
              </div>
            </div>
          </div>

          {momComparison.rows.length === 0 ? (
            <div className="p-6 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400">
              {isDe
                ? 'Noch keine Ausgaben in diesem oder dem letzten Monat vorhanden.'
                : isEn
                  ? 'No expenses recorded in the current or previous month yet.'
                  : 'Nessuna spesa registrata nel mese corrente o in quello precedente.'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {momComparison.rows.map((row) => {
                const isIncrease = row.diff > 0.005;
                const isDecrease = row.diff < -0.005;
                const curBarW =
                  momComparison.maxCatAmount > 0
                    ? Math.round((row.currentSpend / momComparison.maxCatAmount) * 100)
                    : 0;
                const prevBarW =
                  momComparison.maxCatAmount > 0
                    ? Math.round((row.prevSpend / momComparison.maxCatAmount) * 100)
                    : 0;

                const deltaBadgeText = row.isNew
                  ? isDe
                    ? 'Neu'
                    : isEn
                      ? 'New'
                      : 'Nuova'
                  : `${row.pctChange > 0 ? '+' : ''}${Math.round(row.pctChange)}%`;

                return (
                  <div
                    key={row.category}
                    className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-white truncate">{row.displayName}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span
                          className={`text-[11px] font-bold tabular-nums ${
                            isIncrease
                              ? 'text-rose-400'
                              : isDecrease
                                ? 'text-emerald-400'
                                : 'text-slate-400'
                          }`}
                        >
                          {row.diff > 0 ? '+' : ''}
                          {formatCurrency(row.diff, true, baseCurrency)}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-lg tabular-nums border ${
                            isIncrease
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : isDecrease
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {deltaBadgeText}
                        </span>
                      </div>
                    </div>

                    {/* Dual visual comparison bars */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="w-16 text-indigo-300 font-semibold truncate">
                          {isDe ? 'Aktuell' : isEn ? 'Current' : 'Attuale'}
                        </span>
                        <div className="flex-1 bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isIncrease ? 'bg-rose-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${curBarW}%` }}
                          />
                        </div>
                        <span className="w-20 text-right font-bold text-white tabular-nums">
                          {formatCurrency(row.currentSpend, true, baseCurrency)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="w-16 text-slate-400 truncate">
                          {isDe ? 'Vormonat' : isEn ? 'Previous' : 'Scorso'}
                        </span>
                        <div className="flex-1 bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-slate-500"
                            style={{ width: `${prevBarW}%` }}
                          />
                        </div>
                        <span className="w-20 text-right text-slate-400 tabular-nums">
                          {formatCurrency(row.prevSpend, true, baseCurrency)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW F: #Tag Summary View (Riepilogo per #tag) */}
      {chartType === 'tags' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold block">
                {isDe
                  ? 'AUSWERTUNG NACH #TAG'
                  : isEn
                    ? '#TAG EXPENSE & INCOME SUMMARY'
                    : 'RIEPILOGO SPESE & ENTRATE PER #TAG'}
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {isDe
                  ? `${tagSummary.totalTagsCount} aktive #Tags`
                  : isEn
                    ? `${tagSummary.totalTagsCount} active #tags`
                    : `${tagSummary.totalTagsCount} #tag rilevati`}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {EXPENSE_PERIOD_OPTIONS.map((opt) => {
                const active = tagPeriod === opt.id;
                const periodLabels: Record<string, string> = {
                  MONTH: t?.periodMonth || 'Questo Mese',
                  '30D': t?.period30D || '30 Giorni',
                  '90D': t?.period90D || '90 Giorni',
                  YEAR: t?.periodYear || "Quest'Anno",
                  ALL: t?.periodAll || 'Tutto',
                };
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTagPeriod(opt.id)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      active
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {periodLabels[opt.id] || opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search input for #tags */}
          <div className="relative">
            <input
              type="text"
              value={tagSearchQuery}
              onChange={(e) => setTagSearchQuery(e.target.value)}
              placeholder={
                isDe
                  ? '#Tag suchen (z. B. #urlaub, #steuer)...'
                  : isEn
                    ? 'Search #tag (e.g. #vacation, #tax)...'
                    : 'Cerca un #tag (es. #vacanza, #detrazioni)...'
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-2xl bg-slate-950/75 border border-slate-800">
              <div className="text-[10px] text-slate-400">
                {isDe ? 'Ausgaben mit #Tag' : isEn ? 'Tagged Expenses' : 'Totale Uscite con #Tag'}
              </div>
              <div className="text-sm font-black text-rose-400 tabular-nums mt-0.5">
                -{formatCurrency(tagSummary.grandExpense, true, baseCurrency)}
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950/75 border border-slate-800">
              <div className="text-[10px] text-slate-400">
                {isDe ? 'Einnahmen mit #Tag' : isEn ? 'Tagged Income' : 'Totale Entrate con #Tag'}
              </div>
              <div className="text-sm font-black text-emerald-400 tabular-nums mt-0.5">
                +{formatCurrency(tagSummary.grandIncome, true, baseCurrency)}
              </div>
            </div>
          </div>

          {tagSummary.tags.length === 0 ? (
            <div className="p-6 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 space-y-1.5">
              <Hash className="w-7 h-7 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">
                {isDe
                  ? 'Keine Buchungen mit #Tags im gewählten Zeitraum.'
                  : isEn
                    ? 'No #tagged transactions in the selected period.'
                    : 'Nessun movimento con #tag nel periodo selezionato.'}
              </p>
              <p className="text-[11px] text-slate-500">
                {isDe
                  ? 'Fügen Sie Buchungen #Tags wie #urlaub oder #absetzbar hinzu, um Summen direkt hier zu sehen.'
                  : isEn
                    ? 'Add #tags like #vacation or #deductible to your transactions to compute totals instantly.'
                    : 'Aggiungi #tag come #vacanza o #detrazioni alle spese per calcolare subito il totale.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tagSummary.tags.map((item) => {
                const isExpanded = expandedTag === item.tag;
                const barPct =
                  tagSummary.maxTagSpend > 0
                    ? Math.min(100, Math.round((item.expenseTotal / tagSummary.maxTagSpend) * 100))
                    : 0;
                const sharePct =
                  tagSummary.grandExpense > 0
                    ? Math.round((item.expenseTotal / tagSummary.grandExpense) * 100)
                    : 0;

                return (
                  <div
                    key={item.tag}
                    className="rounded-2xl bg-slate-950/70 border border-slate-800/80 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedTag(isExpanded ? null : item.tag)}
                      className="w-full p-3.5 text-left space-y-2 hover:bg-slate-900/60 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-extrabold text-cyan-300 truncate">
                            #{item.tag}
                          </span>
                          <span className="text-[10px] text-slate-400 tabular-nums flex-shrink-0">
                            {item.txCount}{' '}
                            {isDe ? 'Buch.' : isEn ? 'tx' : item.txCount === 1 ? 'mov.' : 'mov.'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.expenseTotal > 0 && (
                            <span className="text-xs font-black text-rose-400 tabular-nums">
                              -{formatCurrency(item.expenseTotal, true, baseCurrency)}
                            </span>
                          )}
                          {item.incomeTotal > 0 && (
                            <span className="text-xs font-black text-emerald-400 tabular-nums">
                              +{formatCurrency(item.incomeTotal, true, baseCurrency)}
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {item.expenseTotal > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold tabular-nums w-8 text-right">
                            {sharePct}%
                          </span>
                        </div>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-3.5 pb-3 pt-1 border-t border-slate-800/70 space-y-1.5 bg-slate-900/40">
                        {item.transactions.map((tx) => {
                          const acc = accounts.find(
                            (a) => a.id === tx.account || a.name === tx.account
                          );
                          const isExp = tx.type === 'EXPENSE';
                          return (
                            <div
                              key={`${item.tag}_${tx.id}`}
                              className="flex items-center justify-between gap-2 text-[11px] py-1 border-b border-slate-800/40 last:border-b-0"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-slate-200 font-medium truncate">
                                  {tx.description}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {tx.date} · {acc?.name || tx.account} ·{' '}
                                  {getCategoryDisplayName(tx.category, language)}
                                </div>
                              </div>
                              <span
                                className={`font-bold tabular-nums flex-shrink-0 ${
                                  isExp ? 'text-rose-400' : 'text-emerald-400'
                                }`}
                              >
                                {isExp ? '-' : '+'}
                                {formatCurrency(tx.amount, true, acc?.currency)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Category Breakdown Card with Recharts Pie Chart & Progress Breakdown */}
      {chartType !== 'mom' && chartType !== 'tags' && (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-rose-400" />
              <span>{t?.expensesByCategory || 'Ripartizione Spese per Categoria'}</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t?.totalExpensesCount || 'Totale spese'}:{' '}
              <span className="font-bold text-rose-400 tabular-nums">
                {formatCurrency(categoryExpenses.totalExpense, true, baseCurrency)}
              </span>
            </p>
          </div>

          {/* Period selector for Category Breakdown */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            {EXPENSE_PERIOD_OPTIONS.map((opt) => {
              const active = expensePeriod === opt.id;
              const periodLabels: Record<string, string> = {
                MONTH: t?.periodMonth || 'Questo Mese',
                '30D': t?.period30D || '30 Giorni',
                '90D': t?.period90D || '90 Giorni',
                YEAR: t?.periodYear || "Quest'Anno",
                ALL: t?.periodAll || 'Tutto',
              };
              return (
                <button
                  key={opt.id}
                  onClick={() => setExpensePeriod(opt.id)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    active
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {periodLabels[opt.id] || opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recharts Pie Chart (if not already shown in hero view above) */}
        {chartType !== 'pie' && renderInteractivePieChart(false)}

        {/* Detailed Category List with matching colors */}
        <div className="space-y-2 pt-1">
          {categoryExpenses.sortedCategories.length === 0 ? (
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 text-center text-xs text-slate-500">
              {t?.noTransactionsFound || 'Nessuna uscita registrata per il periodo selezionato.'}
            </div>
          ) : (
            categoryExpenses.sortedCategories.map(({ category, amount }, idx) => {
              const pct =
                categoryExpenses.totalExpense > 0
                  ? Math.round((amount / categoryExpenses.totalExpense) * 100)
                  : 0;
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              const isHighlighted = activePieIndex === idx;
              const displayName = getCategoryDisplayName(category, language);

              return (
                <div
                  key={category}
                  onMouseEnter={() => setActivePieIndex(idx)}
                  onMouseLeave={() => setActivePieIndex(null)}
                  onClick={() =>
                    setActivePieIndex(activePieIndex === idx ? null : idx)
                  }
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isHighlighted
                      ? 'bg-slate-800/90 border-slate-600 shadow-md scale-[1.01]'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-semibold text-white truncate">{displayName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-rose-400 tabular-nums">
                        {formatCurrency(amount, true, baseCurrency)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold w-8 text-right tabular-nums">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      )}
    </div>
  );
};

