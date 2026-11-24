import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle, Download, ShieldCheck, Trash2 } from 'lucide-react';
import { MyFinanceIcon } from './MyFinanceIcon';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  exportError: string | null;
}

function detectSavedLanguage(): 'it' | 'de' | 'en' {
  try {
    const saved = localStorage.getItem('myfinance_lang_v3');
    if (saved === 'de' || saved === 'en' || saved === 'it') return saved;
  } catch {
    // Ignore storage read error
  }
  return 'it';
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      exportError: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      exportError: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MyFinance ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearCacheAndReload = async () => {
    try {
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
    } catch (e) {
      console.warn('Cache cleanup warning:', e);
    }
    // Force reload bypassing HTTP cache
    window.location.href = window.location.pathname + '?nocache=' + Date.now();
  };

  handleEmergencyExport = () => {
    const lang = detectSavedLanguage();
    try {
      const data: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('myfinance')) {
          try {
            data[key] = JSON.parse(localStorage.getItem(key) || 'null');
          } catch {
            data[key] = localStorage.getItem(key);
          }
        }
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `myfinance_emergency_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.setState({ exportError: null });
    } catch {
      this.setState({
        exportError:
          lang === 'de'
            ? 'Notfall-Backup konnte nicht exportiert werden.'
            : lang === 'en'
              ? 'Unable to export emergency backup data.'
              : 'Impossibile esportare i dati di emergenza.',
      });
    }
  };

  render() {
    if (this.state.hasError) {
      const lang = detectSavedLanguage();
      const isDe = lang === 'de';
      const isEn = lang === 'en';

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="flex justify-center">
              <MyFinanceIcon size={56} shape="square" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {isDe ? 'Startfehler' : isEn ? 'Startup error' : "Errore durante l'avvio"}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {isDe ? 'MyFinance Wiederherstellung' : isEn ? 'MyFinance Recovery' : 'Ripristino di MyFinance'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isDe
                  ? 'Beim Laden der App ist ein Problem aufgetreten. Ihre lokal auf dem Gerät gespeicherten Daten sind weiterhin sicher.'
                  : isEn
                    ? 'The app encountered a loading issue. Your locally stored device data remains intact.'
                    : "L'applicazione ha riscontrato un problema durante il caricamento. I tuoi dati salvati nella memoria del dispositivo sono comunque intatti."}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isDe ? 'Ihre Daten sind sicher' : isEn ? 'Your data is safe' : 'I tuoi dati sono al sicuro'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isDe
                  ? 'Sie können die App neu laden oder eine Cache-Bereinigung erzwingen, um veraltete Dateien zu aktualisieren.'
                  : isEn
                    ? 'You can reload the app or force a cache refresh to clear outdated assets.'
                    : "Puoi ricaricare l'app oppure forzare l'aggiornamento della cache per risolvere eventuali file scaduti."}
              </p>
            </div>

            {this.state.exportError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{this.state.exportError}</span>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-98"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isDe ? 'App neu laden' : isEn ? 'Reload App' : 'Ricarica Applicazione'}</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isDe
                    ? 'Cache leeren & neu starten'
                    : isEn
                      ? 'Clear Cache & Restart'
                      : 'Pulisci Cache e Riavvia'}
                </span>
              </button>

              <button
                type="button"
                onClick={this.handleEmergencyExport}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isDe
                    ? 'Notfall-Backup herunterladen (.JSON)'
                    : isEn
                      ? 'Download Emergency Backup (.JSON)'
                      : 'Scarica Backup Dati di Emergenza (.JSON)'}
                </span>
              </button>
            </div>

            {this.state.error && (
              <details className="text-left text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
                <summary className="cursor-pointer hover:text-slate-400 font-mono">
                  {isDe ? 'Technische Fehlerdetails' : isEn ? 'Technical error details' : 'Dettagli tecnici errore'}
                </summary>
                <pre className="mt-2 p-2 bg-slate-950 rounded-lg overflow-x-auto text-rose-300 font-mono text-[9px] leading-tight">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
