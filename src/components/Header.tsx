import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowRightLeft,
  Printer,
  WifiOff,
  Globe,
  User,
  UserPlus,
  Eye,
  EyeOff,
  MoreVertical,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { MyFinanceIcon } from './MyFinanceIcon';
import { Language, Translations } from '../utils/translations';
import { SecuritySettings, isUserRegistered } from '../utils/security';

interface HeaderProps {
  onOpenTransfer: () => void;
  onApplyAllRecurring?: () => void;
  onOpenApkModal?: () => void;
  onPrint: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  t: Translations;
  zoomLevel: number;
  onZoomChange: (newLevel: number) => void;
  securitySettings?: SecuritySettings;
  onOpenAuthModal?: () => void;
  privacyMode?: boolean;
  onTogglePrivacyMode?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

const LANGUAGE_OPTIONS: { id: Language; label: string }[] = [
  { id: 'it', label: 'IT' },
  { id: 'de', label: 'DE' },
  { id: 'en', label: 'EN' },
];

export const Header: React.FC<HeaderProps> = ({
  onOpenTransfer,
  onPrint,
  language,
  onLanguageChange,
  t,
  zoomLevel,
  onZoomChange,
  securitySettings,
  onOpenAuthModal,
  privacyMode = false,
  onTogglePrivacyMode,
  theme = 'dark',
  onToggleTheme,
}) => {
  const isOnline = useOnlineStatus();
  const registered = isUserRegistered(securitySettings);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDe = language === 'de';
  const isEn = language === 'en';

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  const handleZoomOut = () => onZoomChange(Math.max(70, zoomLevel - 10));
  const handleZoomIn = () => onZoomChange(Math.min(150, zoomLevel + 10));
  const handleZoomReset = () => onZoomChange(100);

  return (
    <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 pt-safe px-3.5 sm:px-4 py-2.5 sm:py-3 no-print flex items-center justify-between gap-2">
      {/* Logo & App Name (Protected Visibility) */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <MyFinanceIcon size={38} shape="square" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="font-extrabold text-base leading-none text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
              MyFinance
            </h1>
            <span className="text-[9px] bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded-md border border-indigo-500/30 flex-shrink-0">
              PRO
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate mt-0.5">
            {registered && securitySettings?.firstName
              ? `${securitySettings.firstName} ${securitySettings.lastName || ''}`.trim()
              : t.appSubtitle}
          </span>
        </div>
      </div>

      {/* Compact Top Actions: Offline Badge (optional) + Eye + Profile + Menu */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!isOnline && (
          <div
            title={t.offlineBadge}
            className="flex items-center gap-1 px-2 py-1.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl text-[10px] font-semibold"
          >
            <WifiOff className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">{t.offlineBadge}</span>
          </div>
        )}

        {/* Privacy Eye Mode Toggle */}
        {onTogglePrivacyMode && (
          <button
            type="button"
            onClick={onTogglePrivacyMode}
            aria-label={
              privacyMode
                ? isDe
                  ? 'Beträge einblenden'
                  : isEn
                    ? 'Show amounts'
                    : 'Mostra importi e saldi'
                : isDe
                  ? 'Beträge ausblenden (Diskret-Modus)'
                  : isEn
                    ? 'Hide amounts (Privacy mode)'
                    : 'Nascondi saldi e importi (Modalità Discreta)'
            }
            title={
              privacyMode
                ? isDe
                  ? 'Beträge einblenden'
                  : isEn
                    ? 'Show balances'
                    : 'Mostra saldi'
                : isDe
                  ? 'Diskret-Modus (Salden verbergen)'
                  : isEn
                    ? 'Privacy mode (Hide balances)'
                    : 'Modalità Discreta (Nascondi saldi)'
            }
            className={`min-w-[36px] min-h-[36px] p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition active:scale-95 ${
              privacyMode
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 active:bg-slate-200 dark:active:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300/80 dark:border-slate-700/80'
            }`}
          >
            {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        {/* Light / Dark Theme 1-Tap Toggle */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === 'dark'
                ? isDe
                  ? 'Helles Design aktivieren'
                  : isEn
                    ? 'Switch to Light Mode'
                    : 'Attiva Tema Chiaro'
                : isDe
                  ? 'Dunkles Design aktivieren'
                  : isEn
                    ? 'Switch to Dark Mode'
                    : 'Attiva Tema Scuro'
            }
            title={
              theme === 'dark'
                ? isDe
                  ? 'Helles Design (Light Mode)'
                  : isEn
                    ? 'Light Mode'
                    : 'Tema Chiaro'
                : isDe
                  ? 'Dunkles Design (Dark Mode)'
                  : isEn
                    ? 'Dark Mode'
                    : 'Tema Scuro'
            }
            className={`min-w-[36px] min-h-[36px] p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition active:scale-95 ${
              theme === 'light'
                ? 'bg-amber-500/15 text-amber-700 border-amber-500/35 hover:bg-amber-500/25'
                : 'bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-amber-300 border-slate-700/80'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        {/* User Registration / Profile Button */}
        {onOpenAuthModal && (
          <button
            type="button"
            onClick={onOpenAuthModal}
            aria-label={
              registered
                ? isDe
                  ? 'Profil & Sicherheit'
                  : isEn
                    ? 'Profile & Security'
                    : 'Profilo & Sicurezza'
                : isDe
                  ? 'Konto registrieren'
                  : isEn
                    ? 'Register account'
                    : 'Registrati'
            }
            title={
              registered
                ? isDe
                  ? 'Profil & Sicherheit'
                  : isEn
                    ? 'Profile & Security'
                    : 'Profilo & Sicurezza'
                : isDe
                  ? 'Konto registrieren'
                  : isEn
                    ? 'Register account'
                    : 'Registrati (Nome, Cognome, Email, Password)'
            }
            className={`min-w-[36px] min-h-[36px] p-2 sm:px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 ${
              registered
                ? 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border-cyan-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/50 shadow-sm'
            }`}
          >
            {registered ? (
              <>
                <User className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px] max-w-[75px] truncate">
                  {securitySettings?.firstName}
                </span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline text-[10px]">
                  {isDe ? 'Konto' : isEn ? 'Sign Up' : 'Registrati'}
                </span>
              </>
            )}
          </button>
        )}

        {/* Quick Menu Dropdown (⋮) for Language, Zoom, Transfer & Print/PDF */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-label={
              isDe
                ? 'Schnellmenü (Sprache, Zoom, Umbuchung, PDF)'
                : isEn
                  ? 'Quick menu (Language, Zoom, Transfer, PDF)'
                  : 'Menu rapido (Lingua, Zoom, Giroconto, PDF)'
            }
            title={
              isDe
                ? 'Weitere Optionen'
                : isEn
                  ? 'More options'
                  : 'Altre azioni (Lingua, Zoom, Giroconto, Stampa)'
            }
            className={`relative min-w-[36px] min-h-[36px] p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition active:scale-95 ${
              isMenuOpen
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 active:bg-slate-200 dark:active:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300/80 dark:border-slate-700/80'
            }`}
          >
            <MoreVertical className="w-4 h-4" />
            {zoomLevel !== 100 && !isMenuOpen && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-400 border-2 border-slate-200 dark:border-slate-900" />
            )}
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-300/90 dark:border-slate-700/90 rounded-2xl p-3 shadow-2xl z-50 space-y-3">
              {/* Menu Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {isDe ? 'Schnellaktionen' : isEn ? 'Quick Actions' : 'Menu Rapido'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg transition"
                  aria-label={t.close || 'Chiudi'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Primary Quick Tools: Giroconto & Stampa PDF */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenTransfer();
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left flex flex-col gap-1 transition active:scale-98"
                >
                  <ArrowRightLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                    {t.quickTransferBtn || 'Giroconto'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onPrint();
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left flex flex-col gap-1 transition active:scale-98"
                >
                  <Printer className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                    {t.printStatementBtn || 'Stampa / PDF'}
                  </span>
                </button>
              </div>

              {/* Language Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>{t.languageSelect || 'Lingua'}</span>
                  </span>
                  <span className="uppercase text-indigo-700 dark:text-indigo-300 font-bold">{language}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  {LANGUAGE_OPTIONS.map((opt) => {
                    const active = language === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onLanguageChange(opt.id)}
                        className={`py-1.5 rounded-lg text-[11px] font-extrabold transition ${
                          active
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <ZoomIn className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>{t.zoomTitle || 'Zoom Pagine'}</span>
                  </span>
                  {zoomLevel !== 100 && (
                    <button
                      type="button"
                      onClick={handleZoomReset}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-0.5 font-bold"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>100%</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 70}
                    title={t.zoomOut || 'Riduci'}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-slate-900 dark:text-white transition active:scale-95"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 tabular-nums">
                    {zoomLevel}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 150}
                    title={t.zoomIn || 'Ingrandisci'}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-slate-900 dark:text-white transition active:scale-95"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {[90, 100, 115].map((preset) => {
                    const isCurrent = zoomLevel === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => onZoomChange(preset)}
                        className={`py-1 rounded-lg text-[10px] font-bold border transition ${
                          isCurrent
                            ? 'bg-indigo-600/25 border-indigo-500/50 text-indigo-700 dark:text-indigo-300'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {preset}%
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

