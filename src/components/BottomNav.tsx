import React from 'react';
import { Home, List, Target, PieChart, Sliders } from 'lucide-react';
import { TabType } from '../types/finance';
import { Translations } from '../utils/translations';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  t: Translations;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, t }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: t.navHome, icon: <Home className="w-5 h-5" /> },
    { id: 'transactions', label: t.navTransactions, icon: <List className="w-5 h-5" /> },
    { id: 'budgets', label: t.navBudgets, icon: <Target className="w-5 h-5" /> },
    { id: 'analytics', label: t.navAnalytics, icon: <PieChart className="w-5 h-5" /> },
    { id: 'settings', label: t.navSettings, icon: <Sliders className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-800/80 backdrop-blur-lg pb-safe no-print">
      <div className="max-w-lg mx-auto flex justify-around items-center min-h-[64px] px-1.5">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full min-h-[48px] py-1.5 px-0.5 rounded-xl transition-colors active:scale-95 ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className={`${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                {tab.icon}
              </div>
              <span className="text-[10px] mt-1 font-medium truncate max-w-full">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
