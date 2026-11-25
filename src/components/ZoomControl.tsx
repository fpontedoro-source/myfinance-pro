import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, X, Check } from 'lucide-react';
import { Language, Translations } from '../utils/translations';

interface ZoomControlProps {
  zoomLevel: number;
  onZoomChange: (newLevel: number) => void;
  language: Language;
  t: Translations;
}

const ZOOM_PRESETS = [80, 90, 100, 110, 125, 140];

export const ZoomControl: React.FC<ZoomControlProps> = ({
  zoomLevel,
  onZoomChange,
  language,
  t,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleZoomIn = () => {
    const next = Math.min(150, zoomLevel + 10);
    onZoomChange(next);
  };

  const handleZoomOut = () => {
    const next = Math.max(70, zoomLevel - 10);
    onZoomChange(next);
  };

  const handleReset = () => {
    onZoomChange(100);
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Button in Header */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        title={t.zoomTitle || 'Zoom Pagine'}
        aria-label={t.zoomTitle || 'Zoom Pagine'}
        className={`p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 active:bg-slate-200 dark:active:bg-slate-700 rounded-xl border text-xs font-bold flex items-center gap-1 transition active:scale-95 shadow-sm ${
          zoomLevel !== 100
            ? 'border-indigo-500/60 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
            : 'border-slate-300/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300'
        }`}
      >
        <ZoomIn className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span className="text-[10px] font-extrabold text-slate-900 dark:text-white">{zoomLevel}%</span>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-300/90 dark:border-slate-700/90 rounded-2xl p-3.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <ZoomIn className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">{t.zoomTitle || 'Zoom Pagine'}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 mb-3">
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 70}
              title={t.zoomOut || 'Riduci'}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 dark:text-white active:scale-95 transition"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="text-center">
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{zoomLevel}%</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 block leading-tight">
                {zoomLevel === 100 ? (language === 'de' ? 'Standard' : language === 'en' ? 'Default' : 'Normale') : (language === 'de' ? 'Aktiv' : language === 'en' ? 'Active' : 'Personalizzato')}
              </span>
            </div>
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 150}
              title={t.zoomIn || 'Ingrandisci'}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 dark:text-white active:scale-95 transition"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1 mb-2.5">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block px-0.5">
              {language === 'de' ? 'Voreinstellungen' : language === 'en' ? 'Quick Presets' : 'Preimpostazioni'}
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {ZOOM_PRESETS.map((preset) => {
                const isCurrent = zoomLevel === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => onZoomChange(preset)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-sm font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {isCurrent && <Check className="w-3 h-3" />}
                    <span>{preset}%</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset Action */}
          <button
            onClick={handleReset}
            className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-slate-300/60 dark:border-slate-700/60 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.zoomReset || 'Ripristina (100%)'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
