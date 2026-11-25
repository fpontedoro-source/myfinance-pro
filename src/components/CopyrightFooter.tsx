import React from 'react';
import { MyFinanceIcon } from './MyFinanceIcon';
import { ShieldCheck, Smartphone, Sparkles } from 'lucide-react';

interface CopyrightFooterProps {
  variant?: 'minimal' | 'card';
  className?: string;
  onOpenPrivacyPolicy?: () => void;
}

export const CopyrightFooter: React.FC<CopyrightFooterProps> = ({
  variant = 'card',
  className = '',
  onOpenPrivacyPolicy,
}) => {
  if (variant === 'minimal') {
    return (
      <footer className={`text-center py-3 px-4 text-slate-500 dark:text-slate-400 no-print select-none ${className}`}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <MyFinanceIcon size={18} />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-tight">
            My Finance Pro · Android Mobile Edition.
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] text-slate-500 font-medium tracking-wide">
          <span>© 2026 Federico Pontedoro. All rights reserved.</span>
          {onOpenPrivacyPolicy && (
            <>
              <span>·</span>
              <button
                type="button"
                onClick={onOpenPrivacyPolicy}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline font-semibold transition"
              >
                Privacy Policy
              </button>
            </>
          )}
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`p-4 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden text-center no-print ${className}`}
    >
      {/* Decorative gradient corner */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col items-center justify-center space-y-2.5 relative z-10">
        {/* App Icon */}
        <div className="relative group cursor-default">
          <MyFinanceIcon size={56} withGlow />
        </div>

        {/* Title and Edition */}
        <div>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Finance Pro
            </h3>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              Android Mobile Edition.
            </span>
          </div>
          
          {/* Copyright notice */}
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            © 2026 Federico Pontedoro. All rights reserved.
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center justify-center gap-2 pt-1 flex-wrap text-[10px]">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            100% Privacy Locale
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
            <Smartphone className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            WebAPK Nativo
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Zero Pubblicità
          </span>
          {onOpenPrivacyPolicy && (
            <button
              type="button"
              onClick={onOpenPrivacyPolicy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-semibold transition"
            >
              <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>Privacy Policy</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};
