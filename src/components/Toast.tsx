import React from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none no-print w-11/12 max-w-xs animate-slide-up">
      <div className="bg-slate-900/95 border border-indigo-500/40 text-white px-3.5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 backdrop-blur-md">
        <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium text-slate-100 truncate">{message}</span>
      </div>
    </div>
  );
};
