import React, { useState, useEffect } from 'react';
import { X, Globe, RefreshCw, RotateCcw, Check, Loader2 } from 'lucide-react';
import { CurrencyCode, FxSettings } from '../types/finance';
import { SUPPORTED_CURRENCIES } from '../utils/formatters';
import { DEFAULT_FX_RATES, fetchLiveFxRates } from '../utils/currencyExchange';
import { Language } from '../utils/translations';

interface FxRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  fxSettings: FxSettings;
  onSaveFxSettings: (next: FxSettings) => void;
  onShowToast?: (msg: string) => void;
  language?: Language;
}

const EDITABLE_CODES: CurrencyCode[] = ['USD', 'GBP', 'JPY', 'CHF'];

export const FxRatesModal: React.FC<FxRatesModalProps> = ({
  isOpen,
  onClose,
  fxSettings,
  onSaveFxSettings,
  onShowToast,
  language = 'it',
}) => {
  const isDe = language === 'de';
  const isEn = language === 'en';

  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(fxSettings.baseCurrency);
  const [rateDrafts, setRateDrafts] = useState<Record<CurrencyCode, string>>({
    EUR: '1',
    USD: String(fxSettings.rates.USD),
    GBP: String(fxSettings.rates.GBP),
    JPY: String(fxSettings.rates.JPY),
    CHF: String(fxSettings.rates.CHF),
  });
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | undefined>(fxSettings.lastUpdatedAt);
  const [source, setSource] = useState<'live' | 'manual' | 'default'>(fxSettings.source || 'default');
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setBaseCurrency(fxSettings.baseCurrency);
    setRateDrafts({
      EUR: '1',
      USD: String(fxSettings.rates.USD),
      GBP: String(fxSettings.rates.GBP),
      JPY: String(fxSettings.rates.JPY),
      CHF: String(fxSettings.rates.CHF),
    });
    setLastUpdatedAt(fxSettings.lastUpdatedAt);
    setSource(fxSettings.source || 'default');
  }, [isOpen, fxSettings]);

  if (!isOpen) return null;

  const handleRefreshLive = async () => {
    setIsFetching(true);
    try {
      const result = await fetchLiveFxRates();
      setRateDrafts({
        EUR: '1',
        USD: String(result.rates.USD),
        GBP: String(result.rates.GBP),
        JPY: String(result.rates.JPY),
        CHF: String(result.rates.CHF),
      });
      setLastUpdatedAt(result.lastUpdatedAt);
      setSource(result.source);
      if (onShowToast) {
        onShowToast(
          result.source === 'live'
            ? isDe
              ? 'Live-Wechselkurse (EZB) aktualisiert!'
              : isEn
                ? 'Live ECB exchange rates updated!'
                : 'Tassi di cambio live (BCE) aggiornati!'
            : isDe
              ? 'Offline-Referenzkurse geladen'
              : isEn
                ? 'Loaded offline reference rates'
                : 'Tassi di riferimento offline caricati'
        );
      }
    } finally {
      setIsFetching(false);
    }
  };

  const handleResetDefaults = () => {
    setBaseCurrency('EUR');
    setRateDrafts({
      EUR: '1',
      USD: String(DEFAULT_FX_RATES.USD),
      GBP: String(DEFAULT_FX_RATES.GBP),
      JPY: String(DEFAULT_FX_RATES.JPY),
      CHF: String(DEFAULT_FX_RATES.CHF),
    });
    setSource('default');
    setLastUpdatedAt(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRates: Record<CurrencyCode, number> = {
      EUR: 1,
      USD: Math.max(0.0001, parseFloat(rateDrafts.USD.replace(',', '.')) || DEFAULT_FX_RATES.USD),
      GBP: Math.max(0.0001, parseFloat(rateDrafts.GBP.replace(',', '.')) || DEFAULT_FX_RATES.GBP),
      JPY: Math.max(0.0001, parseFloat(rateDrafts.JPY.replace(',', '.')) || DEFAULT_FX_RATES.JPY),
      CHF: Math.max(0.0001, parseFloat(rateDrafts.CHF.replace(',', '.')) || DEFAULT_FX_RATES.CHF),
    };

    onSaveFxSettings({
      baseCurrency,
      rates: parsedRates,
      lastUpdatedAt: lastUpdatedAt || new Date().toISOString().slice(0, 10),
      source,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-100/90 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center no-print">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-300 dark:border-slate-700 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-3 pr-10">
          <div className="p-2 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 rounded-xl border border-cyan-500/30">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {isDe
                ? 'Basiswährung & Wechselkurse'
                : isEn
                  ? 'Base Currency & FX Rates'
                  : 'Valuta Base & Tassi di Cambio'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isDe
                ? 'Vereintes Gesamtvermögen in deiner Hauptwährung'
                : isEn
                  ? 'Unified net worth converted to your primary currency'
                  : 'Patrimonio netto unificato nella tua valuta principale'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Base Currency Selection */}
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1.5">
              {isDe
                ? 'Hauptwährung für Gesamtvermögen'
                : isEn
                  ? 'Unified Net Worth Currency'
                  : 'Valuta Principale (Patrimonio Unificato)'}
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {SUPPORTED_CURRENCIES.map((curr) => {
                const selected = baseCurrency === curr.code;
                return (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => setBaseCurrency(curr.code)}
                    className={`min-h-[48px] p-1.5 rounded-xl border flex flex-col items-center justify-center transition active:scale-95 ${
                      selected
                        ? 'bg-indigo-600/25 border-indigo-500 text-white'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="text-sm leading-none">{curr.flag}</span>
                    <span className="text-[11px] font-bold mt-1">{curr.code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exchange Rates Editor */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {isDe
                    ? 'Kurse pro 1 EUR'
                    : isEn
                      ? 'Rates per 1 EUR'
                      : 'Tassi riferiti a 1 EUR'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {source === 'live'
                    ? isDe
                      ? `Live-Kurs · ${lastUpdatedAt || ''}`
                      : isEn
                        ? `Live ECB · ${lastUpdatedAt || ''}`
                        : `Live BCE · ${lastUpdatedAt || ''}`
                    : source === 'manual'
                      ? isDe
                        ? 'Manuell angepasst'
                        : isEn
                          ? 'Manual override'
                          : 'Modificati manualmente'
                      : isDe
                        ? 'Offline-Standard'
                        : isEn
                          ? 'Offline defaults'
                          : 'Valori predefiniti offline'}
                </div>
              </div>

              <button
                type="button"
                disabled={isFetching}
                onClick={handleRefreshLive}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                {isFetching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>
                  {isDe ? 'Live aktualisieren' : isEn ? 'Update Live' : 'Aggiorna Live'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {EDITABLE_CODES.map((code) => {
                const info = SUPPORTED_CURRENCIES.find((c) => c.code === code);
                return (
                  <div key={code}>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                      {info?.flag} 1 EUR = {code}
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={rateDrafts[code]}
                      onChange={(e) => {
                        setRateDrafts((prev) => ({ ...prev, [code]: e.target.value }));
                        setSource('manual');
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-bold tabular-nums focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="min-h-[44px] px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isDe ? 'Reset' : isEn ? 'Reset' : 'Ripristina'}</span>
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition"
            >
              <Check className="w-4 h-4" />
              <span>
                {isDe ? 'Einstellungen speichern' : isEn ? 'Save FX Settings' : 'Salva Valuta & Tassi'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
