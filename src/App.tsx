import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Plus,
  History,
  ArrowRight,
  FileText,
  Mail,
  X,
  CalendarClock,
  Camera,
  ArrowLeftRight,
  Upload,
  Zap,
  Check,
  PlusCircle,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  Account,
  Transaction,
  RecurringMovement,
  Goal,
  PeriodFilter,
  TabType,
  CategoryRule,
  FxSettings,
  QuickShortcut,
  DebtCreditEntry,
} from './types/finance';
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  DEFAULT_TRANSACTIONS,
  DEFAULT_RECURRING,
  DEFAULT_BUDGETS,
  DEFAULT_GOALS,
} from './utils/constants';
import {
  isDateInPeriod,
  formatCurrency,
  formatDateEuropean,
  getAccountDisplayName,
  setAppCurrency,
  PRIVACY_STORAGE_KEY,
  setAppPrivacyMode,
} from './utils/formatters';
import {
  DEFAULT_QUICK_SHORTCUTS,
  SHORTCUTS_STORAGE_KEY,
  getQuickShortcuts,
  saveQuickShortcuts,
} from './utils/quickShortcuts';
import { Language, TRANSLATIONS, getCategoryDisplayName } from './utils/translations';

import { Header } from './components/Header';
import { MetricsBanner } from './components/MetricsBanner';
import { AccountsCarousel } from './components/AccountsCarousel';
import { TransactionsTab } from './components/TransactionsTab';
import { BudgetsGoalsTab, BudgetsSubTab } from './components/BudgetsGoalsTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { AiChatTab } from './components/AiChatTab';
import { SettingsTab } from './components/SettingsTab';
import { BottomNav } from './components/BottomNav';
import { TransactionModal } from './components/TransactionModal';
import { TransferModal } from './components/TransferModal';
import { AccountsModal } from './components/AccountsModal';
import { CategoriesModal } from './components/CategoriesModal';
import { RecurringModal } from './components/RecurringModal';
import { BudgetModal } from './components/BudgetModal';
import { GoalModal } from './components/GoalModal';
import { ApkModal } from './components/ApkModal';
import { Toast } from './components/Toast';
import { ConfirmActionModal, ActionDetail } from './components/ConfirmActionModal';
import { PrintReportModal } from './components/PrintReportModal';
import { CsvImportModal } from './components/CsvImportModal';
import { FxRatesModal } from './components/FxRatesModal';
import { RulesModal } from './components/RulesModal';
import { QuickShortcutsModal } from './components/QuickShortcutsModal';
import { DebtsCreditsModal } from './components/DebtsCreditsModal';
import {
  CategoryIcon,
  getCategoryColorDetails,
  getSavedCategoryIcons,
  getSavedCategoryColors,
} from './components/CategoryIcon';
import { CopyrightFooter } from './components/CopyrightFooter';
import { MyFinanceIcon } from './components/MyFinanceIcon';
import {
  saveToIndexedDB,
  loadFromIndexedDB,
  requestDeviceStoragePersistence,
  getDeviceStorageStats,
} from './utils/deviceStorage';
import { checkAndRunDailyBackup } from './utils/autoBackup';
import { LockScreen } from './components/LockScreen';
import { SecuritySettingsModal } from './components/SecuritySettingsModal';
import { MonthlyStatementModal } from './components/MonthlyStatementModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { RecurringNotificationsBanner } from './components/RecurringNotificationsBanner';
import {
  getSecuritySettings,
  shouldAppBeLocked,
  isUserRegistered,
  SecuritySettings,
  saveSecuritySettings,
} from './utils/security';
import {
  checkAndRunAutomaticMonthlyStatement,
  getMonthlyEmailSettings,
  sendMonthlyStatementPdfByEmail,
  MonthlyEmailSettings,
  MonthlyStatementEntry,
} from './utils/monthlyEmailStatement';
import {
  processAutoRecurringMovements,
  getScheduledRecurringItems,
  advanceRecurringDate,
  getTodayIsoDate,
  formatDueStatusLabel,
} from './utils/recurringScheduler';
import {
  AutoRecurringNotification,
  BrowserNotifPermissionState,
  getPendingAutoRecurringNotifications,
  savePendingAutoRecurringNotifications,
  getRecurringNotificationsEnabled,
  setRecurringNotificationsEnabled,
  getBrowserNotificationStatus,
  requestBrowserNotificationPermission,
  buildAutoRecurringNotificationsFromTransactions,
  getAutoRecurringToastMessage,
  dispatchBrowserRecurringNotifications,
} from './utils/recurringNotifications';
import {
  getFxSettings,
  saveFxSettings,
  DEFAULT_FX_SETTINGS,
  FX_STORAGE_KEY,
  computeUnifiedNetWorth,
  convertCurrencyAmount,
  getAccountCurrencyCode,
} from './utils/currencyExchange';
import {
  computeMonthlyCashflowForecast,
  computeBudgetAlerts,
} from './utils/cashflowForecast';
import {
  DEFAULT_CATEGORY_RULES,
  RULES_STORAGE_KEY,
  collectAllUsedTags,
  applyRulesToExistingTransactions,
  matchCategorizationRule,
  mergeUniqueTags,
} from './utils/categorizationRules';
import {
  DEBTS_CREDITS_STORAGE_KEY,
  DEFAULT_DEBTS_CREDITS,
  getDebtsCredits,
  saveDebtsCredits,
  computeDebtCreditSummary,
  recordDebtCreditPayment,
} from './utils/debtsCredits';

export default function App() {
  const [storageStats, setStorageStats] = useState<{
    isPersisted: boolean;
    canPersist: boolean;
    usageBytes: number;
    quotaBytes: number;
    isStandalone: boolean;
  }>({
    isPersisted: false,
    canPersist: false,
    usageBytes: 0,
    quotaBytes: 0,
    isStandalone: false,
  });

  // State Initialization from LocalStorage
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem('myfinance_accounts_v3');
      return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('myfinance_transactions_v3');
      return saved ? JSON.parse(saved) : DEFAULT_TRANSACTIONS;
    } catch {
      return DEFAULT_TRANSACTIONS;
    }
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('myfinance_categories_v3');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  const [recurring, setRecurring] = useState<RecurringMovement[]>(() => {
    try {
      const saved = localStorage.getItem('myfinance_recurring_v3');
      return saved ? JSON.parse(saved) : DEFAULT_RECURRING;
    } catch {
      return DEFAULT_RECURRING;
    }
  });

  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('myfinance_budgets_v3');
      return saved ? JSON.parse(saved) : DEFAULT_BUDGETS;
    } catch {
      return DEFAULT_BUDGETS;
    }
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem('myfinance_goals_v3');
      return saved ? JSON.parse(saved) : DEFAULT_GOALS;
    } catch {
      return DEFAULT_GOALS;
    }
  });

  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>(() => {
    try {
      const saved = localStorage.getItem(RULES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return DEFAULT_CATEGORY_RULES;
    } catch {
      return DEFAULT_CATEGORY_RULES;
    }
  });

  const [fxSettings, setFxSettings] = useState<FxSettings>(() => getFxSettings());
  const [quickShortcuts, setQuickShortcuts] = useState<QuickShortcut[]>(() => getQuickShortcuts());
  const [debtsCredits, setDebtsCredits] = useState<DebtCreditEntry[]>(() => getDebtsCredits());
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PRIVACY_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  // Keep global formatter synchronized immediately during render so child components mask consistently
  setAppPrivacyMode(privacyMode);

  // Active language state (default: Italian 'it', also 'de' and 'en')
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('myfinance_lang') || localStorage.getItem('myfinance_lang_v3');
      if (saved === 'it' || saved === 'de' || saved === 'en') {
        return saved;
      }
      return 'it';
    } catch {
      return 'it';
    }
  });

  const t = useMemo(() => TRANSLATIONS[language] || TRANSLATIONS.it, [language]);

  const handleTogglePrivacyMode = () => {
    const next = !privacyMode;
    setAppPrivacyMode(next);
    setPrivacyMode(next);
    try {
      localStorage.setItem(PRIVACY_STORAGE_KEY, String(next));
    } catch {}
    showToast(
      next
        ? language === 'de'
          ? 'Diskret-Modus aktiviert: Beträge ausgeblendet'
          : language === 'en'
            ? 'Privacy mode enabled: balances hidden'
            : 'Modalità discreta attivata: saldi e importi oscurati'
        : language === 'de'
          ? 'Beträge wieder sichtbar'
          : language === 'en'
            ? 'Balances visible again'
            : 'Saldi e importi nuovamente visibili'
    );
  };

  // Global Page Zoom State (persisted across sessions and pages)
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('myfinance_zoom_level');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 60 && parsed <= 180) {
          return parsed;
        }
      }
      return 100;
    } catch {
      return 100;
    }
  });

  const handleZoomChange = (newLevel: number) => {
    setZoomLevel(newLevel);
    try {
      localStorage.setItem('myfinance_zoom_level', newLevel.toString());
    } catch {}
  };

  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement) {
      (document.documentElement.style as any).zoom = `${zoomLevel}%`;
    }
  }, [zoomLevel]);

  // Synchronize active currency (Euro € for all languages including English)
  useEffect(() => {
    setAppCurrency('€');
  }, [language]);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    setAppCurrency('€');
    try {
      localStorage.setItem('myfinance_lang', newLang);
      localStorage.setItem('myfinance_lang_v3', newLang);
      document.documentElement.lang = newLang;
    } catch {
      // storage unavailable
    }
    showToast(TRANSLATIONS[newLang]?.languageChangedToast || 'Lingua aggiornata');
  };

  // Active view tab
  const [currentTab, setCurrentTab] = useState<TabType>('home');

  // Filter state
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [highlightTxScanner, setHighlightTxScanner] = useState(false);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isMonthlyStatementModalOpen, setIsMonthlyStatementModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isFxModalOpen, setIsFxModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [budgetsSubTab, setBudgetsSubTab] = useState<BudgetsSubTab>('budgets');
  const [isDebtCreditModalOpen, setIsDebtCreditModalOpen] = useState(false);
  const [editingDebtCredit, setEditingDebtCredit] = useState<DebtCreditEntry | null>(null);
  const [monthlyEmailSettings, setMonthlyEmailSettings] = useState<MonthlyEmailSettings>(getMonthlyEmailSettings);
  const [pendingStatementBanner, setPendingStatementBanner] = useState<MonthlyStatementEntry | null>(null);
  const [isStorageHydrated, setIsStorageHydrated] = useState(false);
  const [categoryVisualVersion, setCategoryVisualVersion] = useState(0);
  const [autoRecurringNotifications, setAutoRecurringNotifications] = useState<
    AutoRecurringNotification[]
  >(() => getPendingAutoRecurringNotifications());
  const [recurringNotifEnabled, setRecurringNotifEnabled] = useState<boolean>(() =>
    getRecurringNotificationsEnabled()
  );
  const [browserNotifStatus, setBrowserNotifStatus] = useState<BrowserNotifPermissionState>(() =>
    getBrowserNotificationStatus()
  );
  const recurringRef = useRef<RecurringMovement[]>(recurring);
  recurringRef.current = recurring;
  const accountsRef = useRef<Account[]>(accounts);
  accountsRef.current = accounts;
  const recurringNotifEnabledRef = useRef<boolean>(recurringNotifEnabled);
  recurringNotifEnabledRef.current = recurringNotifEnabled;
  
  // Confirmation Modal State (Avviso prima di eseguire)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    warningNote?: string;
    actionType?: 'TRANSFER' | 'DELETE' | 'EXECUTE' | 'RESET' | 'DEFAULT';
    details?: ActionDetail[];
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const requestActionConfirmation = (config: {
    title?: string;
    message: string;
    warningNote?: string;
    actionType?: 'TRANSFER' | 'DELETE' | 'EXECUTE' | 'RESET' | 'DEFAULT';
    details?: ActionDetail[];
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }) => {
    setConfirmModal({
      isOpen: true,
      ...config,
    });
  };

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2500);
  };

  // Security & App Lock State
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(getSecuritySettings);
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    const current = getSecuritySettings();
    return shouldAppBeLocked(current) || !isUserRegistered(current);
  });

  const isRegistered = isUserRegistered(securitySettings);
  const showAuthGate = !isRegistered || (isAppLocked && securitySettings.enabled);

  // Auto-lock when switching apps or returning after inactivity timeout
  useEffect(() => {
    let lastHiddenTime = 0;

    const handleVisibilityChange = () => {
      const current = getSecuritySettings();
      if (!isUserRegistered(current) || !current.enabled) return;

      if (document.visibilityState === 'hidden') {
        lastHiddenTime = Date.now();
      } else if (document.visibilityState === 'visible') {
        if (current.autoLockMinutes === 0) {
          setIsAppLocked(true);
        } else if (lastHiddenTime > 0) {
          const elapsedMinutes = (Date.now() - lastHiddenTime) / (1000 * 60);
          if (elapsedMinutes >= current.autoLockMinutes) {
            setIsAppLocked(true);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleUnlockSuccess = (updatedSettings?: SecuritySettings) => {
    const base = updatedSettings || securitySettings;
    const updated: SecuritySettings = {
      ...base,
      lastUnlockedTimestamp: Date.now(),
    };
    setSecuritySettings(updated);
    saveSecuritySettings(updated);
    setMonthlyEmailSettings(getMonthlyEmailSettings());
    setIsAppLocked(false);
  };

  const handleLockNow = () => {
    setIsAppLocked(true);
  };

  // Initialize native smartphone persistent storage and IndexedDB backup hydration
  useEffect(() => {
    requestDeviceStoragePersistence().then(() => {
      getDeviceStorageStats().then(setStorageStats);
    });

    const hydrateFromIndexedDB = async () => {
      try {
        const idbTx = await loadFromIndexedDB<Transaction[]>('transactions');
        const idbAcc = await loadFromIndexedDB<Account[]>('accounts');
        const idbCat = await loadFromIndexedDB<string[]>('categories');
        const idbRec = await loadFromIndexedDB<RecurringMovement[]>('recurring');
        const idbBud = await loadFromIndexedDB<Record<string, number>>('budgets');
        const idbGoals = await loadFromIndexedDB<Goal[]>('goals');
        const idbRules = await loadFromIndexedDB<CategoryRule[]>('rules');
        const idbFx = await loadFromIndexedDB<FxSettings>('fxSettings');
        const idbShortcuts = await loadFromIndexedDB<QuickShortcut[]>('quickShortcuts');
        const idbDebtsCredits = await loadFromIndexedDB<DebtCreditEntry[]>('debtsCredits');

        if (idbTx && idbTx.length > 0 && !localStorage.getItem('myfinance_transactions_v3')) {
          setTransactions(idbTx);
        }
        if (idbAcc && idbAcc.length > 0 && !localStorage.getItem('myfinance_accounts_v3')) {
          setAccounts(idbAcc);
        }
        if (idbCat && idbCat.length > 0 && !localStorage.getItem('myfinance_categories_v3')) {
          setCategories(idbCat);
        }
        if (idbRec && idbRec.length > 0 && !localStorage.getItem('myfinance_recurring_v3')) {
          setRecurring(idbRec);
        }
        if (idbBud && Object.keys(idbBud).length > 0 && !localStorage.getItem('myfinance_budgets_v3')) {
          setBudgets(idbBud);
        }
        if (idbGoals && idbGoals.length > 0 && !localStorage.getItem('myfinance_goals_v3')) {
          setGoals(idbGoals);
        }
        if (idbRules && Array.isArray(idbRules) && !localStorage.getItem(RULES_STORAGE_KEY)) {
          setCategoryRules(idbRules);
        }
        if (idbFx && idbFx.baseCurrency && !localStorage.getItem(FX_STORAGE_KEY)) {
          setFxSettings(idbFx);
        }
        if (idbShortcuts && Array.isArray(idbShortcuts) && !localStorage.getItem(SHORTCUTS_STORAGE_KEY)) {
          setQuickShortcuts(idbShortcuts);
        }
        if (idbDebtsCredits && Array.isArray(idbDebtsCredits) && !localStorage.getItem(DEBTS_CREDITS_STORAGE_KEY)) {
          setDebtsCredits(idbDebtsCredits);
        }
      } catch (err) {
        console.warn('Hydration IndexedDB:', err);
      } finally {
        setIsStorageHydrated(true);
      }
    };
    hydrateFromIndexedDB();
  }, []);

  const handleRequestPersistence = async () => {
    const granted = await requestDeviceStoragePersistence();
    const stats = await getDeviceStorageStats();
    setStorageStats(stats);
    if (granted || stats.isPersisted) {
      showToast(
        language === 'de'
          ? 'Gerätespeicher dauerhaft geschützt!'
          : language === 'en'
            ? 'Device storage set to persistent and protected!'
            : 'Memoria smartphone resa permanente e protetta!'
      );
    } else {
      showToast(
        language === 'de'
          ? 'Speicherstatus aktualisiert: lokal geschützt.'
          : language === 'en'
            ? 'Storage status updated: protected locally.'
            : 'Stato memoria aggiornato: protetto nello storage locale.'
      );
    }
  };

  // Sync to localStorage & IndexedDB (Smartphone Internal Storage)
  useEffect(() => {
    localStorage.setItem('myfinance_accounts_v3', JSON.stringify(accounts));
    saveToIndexedDB('accounts', accounts);
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('myfinance_transactions_v3', JSON.stringify(transactions));
    saveToIndexedDB('transactions', transactions);
    getDeviceStorageStats().then(setStorageStats);
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('myfinance_categories_v3', JSON.stringify(categories));
    saveToIndexedDB('categories', categories);
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('myfinance_recurring_v3', JSON.stringify(recurring));
    saveToIndexedDB('recurring', recurring);
  }, [recurring]);

  useEffect(() => {
    localStorage.setItem('myfinance_budgets_v3', JSON.stringify(budgets));
    saveToIndexedDB('budgets', budgets);
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('myfinance_goals_v3', JSON.stringify(goals));
    saveToIndexedDB('goals', goals);
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(categoryRules));
    saveToIndexedDB('rules', categoryRules);
  }, [categoryRules]);

  useEffect(() => {
    saveFxSettings(fxSettings);
    saveToIndexedDB('fxSettings', fxSettings);
  }, [fxSettings]);

  useEffect(() => {
    saveQuickShortcuts(quickShortcuts);
    saveToIndexedDB('quickShortcuts', quickShortcuts);
  }, [quickShortcuts]);

  useEffect(() => {
    saveDebtsCredits(debtsCredits);
    saveToIndexedDB('debtsCredits', debtsCredits);
  }, [debtsCredits]);

  // Check and execute daily automatic backup on startup (only after registration/unlock)
  useEffect(() => {
    if (showAuthGate) return;
    const timer = setTimeout(() => {
      checkAndRunDailyBackup(getBackupData, showToast, language);
    }, 1500);
    return () => clearTimeout(timer);
  }, [language, showAuthGate]);

  useEffect(() => {
    savePendingAutoRecurringNotifications(autoRecurringNotifications);
  }, [autoRecurringNotifications]);

  const handleToggleRecurringNotifications = () => {
    const next = !recurringNotifEnabled;
    setRecurringNotifEnabled(next);
    setRecurringNotificationsEnabled(next);
    showToast(
      language === 'de'
        ? next
          ? 'Benachrichtigungen für Dauerbuchungen aktiviert'
          : 'Benachrichtigungen für Dauerbuchungen deaktiviert'
        : language === 'en'
          ? next
            ? 'Scheduler notifications enabled'
            : 'Scheduler notifications disabled'
          : next
            ? 'Notifiche scadenzario attivate!'
            : 'Notifiche scadenzario disattivate'
    );
  };

  const handleEnableBrowserNotifications = async () => {
    const res = await requestBrowserNotificationPermission(language);
    setBrowserNotifStatus(res);
    if (res === 'granted') {
      showToast(
        language === 'de'
          ? 'Push-Benachrichtigungen aktiviert!'
          : language === 'en'
            ? 'Device notifications enabled!'
            : 'Notifiche sul dispositivo attivate!'
      );
    } else if (res === 'denied') {
      showToast(
        language === 'de'
          ? 'Benachrichtigungen im Browser blockiert'
          : language === 'en'
            ? 'Notifications blocked in browser settings'
            : 'Notifiche bloccate dalle impostazioni del browser'
      );
    } else {
      showToast(
        language === 'de'
          ? 'Push wird in dieser Ansicht nicht unterstützt (In-App-Banner aktiv)'
          : language === 'en'
            ? 'Device push unavailable here (in-app alert banner active)'
            : 'Push browser non supportato qui (resta attivo il banner in-app)'
      );
    }
  };

  // Execute due automatic recurring movements safely after storage hydration & auth unlock
  const runScheduledAutoRecurring = useCallback(() => {
    if (!isStorageHydrated || showAuthGate) return;
    const todayStr = getTodayIsoDate();
    const { updatedRecurring, generatedTransactions } = processAutoRecurringMovements(
      recurringRef.current,
      todayStr
    );
    if (generatedTransactions.length > 0) {
      setRecurring(updatedRecurring);
      setTransactions((prev) => [...generatedTransactions, ...prev]);

      const newNotifs = buildAutoRecurringNotificationsFromTransactions(
        generatedTransactions,
        accountsRef.current
      );

      if (recurringNotifEnabledRef.current && newNotifs.length > 0) {
        setAutoRecurringNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.transactionId));
          const uniqueNew = newNotifs.filter((n) => !existingIds.has(n.transactionId));
          return [...uniqueNew, ...prev].slice(0, 20);
        });
        const msg = getAutoRecurringToastMessage(newNotifs, accountsRef.current, language);
        if (msg) {
          showToast(msg);
        }
        dispatchBrowserRecurringNotifications(newNotifs, accountsRef.current, language);
      } else {
        const msg =
          language === 'de'
            ? `${generatedTransactions.length} fällige Dauerbuchung(en) automatisch erfasst`
            : language === 'en'
              ? `${generatedTransactions.length} recurring transaction(s) auto-posted`
              : `${generatedTransactions.length} moviment${generatedTransactions.length === 1 ? 'o ricorrente registrato' : 'i ricorrenti registrati'} in automatico`;
        showToast(msg);
      }
    } else if (updatedRecurring !== recurringRef.current) {
      setRecurring(updatedRecurring);
    }
  }, [isStorageHydrated, showAuthGate, language]);

  useEffect(() => {
    runScheduledAutoRecurring();
  }, [runScheduledAutoRecurring, recurring]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        runScheduledAutoRecurring();
      }
    };
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        runScheduledAutoRecurring();
      }
    }, 60000);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [runScheduledAutoRecurring]);

  // Allineamento automatico dei movimenti e modelli se un conto è stato rinominato in precedenza
  useEffect(() => {
    const idToNameMap = new Map<string, string>();
    accounts.forEach((acc) => {
      if (acc.id && acc.name && acc.id !== acc.name) {
        idToNameMap.set(acc.id, acc.name);
      }
    });

    if (idToNameMap.size > 0) {
      setTransactions((prev) => {
        let changed = false;
        const updated = prev.map((t) => {
          let tChanged = false;
          let newAcc = t.account;
          let newFrom = t.fromAccount;
          let newTo = t.toAccount;

          if (t.account && idToNameMap.has(t.account)) {
            newAcc = idToNameMap.get(t.account)!;
            tChanged = true;
          }
          if (t.fromAccount && idToNameMap.has(t.fromAccount)) {
            newFrom = idToNameMap.get(t.fromAccount)!;
            tChanged = true;
          }
          if (t.toAccount && idToNameMap.has(t.toAccount)) {
            newTo = idToNameMap.get(t.toAccount)!;
            tChanged = true;
          }

          if (tChanged) {
            changed = true;
            return {
              ...t,
              account: newAcc,
              fromAccount: newFrom,
              toAccount: newTo,
            };
          }
          return t;
        });

        return changed ? updated : prev;
      });

      setRecurring((prev) => {
        let changed = false;
        const updated = prev.map((r) => {
          if (r.account && idToNameMap.has(r.account)) {
            changed = true;
            return { ...r, account: idToNameMap.get(r.account)! };
          }
          return r;
        });
        return changed ? updated : prev;
      });
    }
  }, [accounts]);

  // Compute Balances and Metrics (Multi-Currency Unified Net Worth + Filtered Metrics)
  const {
    overallBalances,
    unifiedNetWorth,
    displayedTotalBalance,
    totalIncome,
    totalExpense,
    hasActiveFilters,
    savingsRate,
    dailyAvg,
    monthlyExpenses,
  } = useMemo(() => {
    const balances: Record<string, number> = {};
    const accountLookup = new Map<string, string>();
    accounts.forEach((acc) => {
      balances[acc.id] = 0;
      accountLookup.set(acc.id, acc.id);
      if (acc.name) {
        accountLookup.set(acc.name, acc.id);
      }
    });
    const resolveAccId = (key?: string): string | undefined => {
      if (!key) return undefined;
      return accountLookup.get(key) ?? (balances[key] !== undefined ? key : undefined);
    };
    const resolvedSelectedAccId =
      selectedAccount === 'ALL' ? 'ALL' : resolveAccId(selectedAccount) || selectedAccount;

    let incomeSum = 0;
    let expenseSum = 0;
    let transfersSum = 0;
    let earliestDate = new Date();

    const currentNow = new Date();
    const curMonthExp: Record<string, number> = {};
    const useUnifiedBase = selectedAccount === 'ALL';
    const targetCurrency = useUnifiedBase
      ? fxSettings.baseCurrency
      : getAccountCurrencyCode(selectedAccount, accounts);

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      const inPeriod = isDateInPeriod(tx.date, selectedPeriod, startDate, endDate);
      const matchCategory =
        selectedCategory === 'ALL' || tx.category === selectedCategory;
      const matchTag =
        selectedTag === 'ALL' || (tx.tags || []).includes(selectedTag);

      // Track current calendar month expenses converted to base currency for budget calculations
      if (tx.type === 'EXPENSE') {
        const d = new Date(tx.date);
        if (
          d.getFullYear() === currentNow.getFullYear() &&
          d.getMonth() === currentNow.getMonth()
        ) {
          const txCurr = getAccountCurrencyCode(tx.account, accounts);
          const convertedForBudget = convertCurrencyAmount(
            amt,
            txCurr,
            fxSettings.baseCurrency,
            fxSettings.rates
          );
          curMonthExp[tx.category] = (curMonthExp[tx.category] || 0) + convertedForBudget;
        }
      }

      // Update absolute account balance in each account's native currency
      if (tx.type === 'INCOME') {
        const targetId = resolveAccId(tx.account);
        if (targetId && balances[targetId] !== undefined) {
          balances[targetId] += amt;
        }
      } else if (tx.type === 'EXPENSE') {
        const targetId = resolveAccId(tx.account);
        if (targetId && balances[targetId] !== undefined) {
          balances[targetId] -= amt;
        }
      } else if (tx.type === 'TRANSFER') {
        const fromId = resolveAccId(tx.fromAccount);
        const toId = resolveAccId(tx.toAccount);
        if (fromId && balances[fromId] !== undefined) {
          balances[fromId] -= amt;
        }
        if (toId && balances[toId] !== undefined) {
          const fromCurr = getAccountCurrencyCode(fromId || tx.fromAccount, accounts);
          const toCurr = getAccountCurrencyCode(toId || tx.toAccount, accounts);
          const creditAmt =
            typeof tx.convertedAmount === 'number' && !isNaN(tx.convertedAmount)
              ? tx.convertedAmount
              : fromCurr !== toCurr
                ? convertCurrencyAmount(amt, fromCurr, toCurr, fxSettings.rates)
                : amt;
          balances[toId] += creditAmt;
        }
      }

      // Update filtered metrics (converted into baseCurrency when viewing all accounts)
      if (inPeriod && matchCategory && matchTag) {
        const txAccId = resolveAccId(tx.account) || tx.account;
        const txFromId = resolveAccId(tx.fromAccount) || tx.fromAccount;
        const txToId = resolveAccId(tx.toAccount) || tx.toAccount;
        const matchAccount =
          selectedAccount === 'ALL' ||
          txAccId === resolvedSelectedAccId ||
          txFromId === resolvedSelectedAccId ||
          txToId === resolvedSelectedAccId;

        if (matchAccount) {
          const txAccKey = tx.type === 'TRANSFER' ? tx.fromAccount : tx.account;
          const txCurr = getAccountCurrencyCode(txAccKey, accounts);
          const metricAmt = convertCurrencyAmount(
            amt,
            txCurr,
            targetCurrency,
            fxSettings.rates
          );

          if (tx.type === 'INCOME') {
            incomeSum += metricAmt;
          } else if (tx.type === 'EXPENSE') {
            expenseSum += metricAmt;
            const d = new Date(tx.date);
            if (d < earliestDate) earliestDate = d;
          } else if (tx.type === 'TRANSFER') {
            transfersSum += metricAmt;
          }
        }
      }
    });

    const netWorthSummary = computeUnifiedNetWorth(accounts, balances, fxSettings);

    const activeFilter =
      selectedPeriod !== 'ALL' ||
      startDate !== '' ||
      endDate !== '' ||
      selectedCategory !== 'ALL' ||
      selectedAccount !== 'ALL' ||
      selectedTag !== 'ALL' ||
      selectedType !== 'ALL' ||
      searchQuery.trim() !== '';

    let displayedBalance = 0;
    if (selectedType === 'INCOME') {
      displayedBalance = incomeSum;
    } else if (selectedType === 'EXPENSE') {
      displayedBalance = expenseSum;
    } else if (selectedType === 'TRANSFER') {
      displayedBalance = transfersSum;
    } else if (selectedAccount !== 'ALL') {
      displayedBalance = balances[resolvedSelectedAccId] || 0;
    } else if (activeFilter) {
      displayedBalance = incomeSum - expenseSum;
    } else {
      displayedBalance = netWorthSummary.totalUnified;
    }

    let saveRate = 0;
    if (incomeSum > 0) {
      saveRate = Math.max(0, ((incomeSum - expenseSum) / incomeSum) * 100);
    }

    let daysDiff = Math.max(
      1,
      Math.ceil((new Date().getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    if (selectedPeriod === 'TODAY' || selectedPeriod === 'YESTERDAY') {
      daysDiff = 1;
    } else if (selectedPeriod === 'MONTH') {
      daysDiff = new Date().getDate();
    }

    const dAvg = expenseSum / daysDiff;

    return {
      overallBalances: balances,
      unifiedNetWorth: netWorthSummary,
      displayedTotalBalance: displayedBalance,
      totalIncome: incomeSum,
      totalExpense: expenseSum,
      hasActiveFilters: activeFilter,
      savingsRate: saveRate,
      dailyAvg: dAvg,
      monthlyExpenses: curMonthExp,
    };
  }, [
    accounts,
    transactions,
    selectedPeriod,
    startDate,
    endDate,
    selectedCategory,
    selectedAccount,
    selectedTag,
    selectedType,
    searchQuery,
    fxSettings,
  ]);

  const debtCreditSummary = useMemo(
    () => computeDebtCreditSummary(debtsCredits, fxSettings),
    [debtsCredits, fxSettings]
  );

  const isShowingNetWorthBreakdown =
    selectedAccount === 'ALL' && !hasActiveFilters && selectedType === 'ALL';

  const effectiveNetWorth = unifiedNetWorth.totalUnified + debtCreditSummary.netAdjustment;

  const availableTags = useMemo(
    () => collectAllUsedTags(transactions, categoryRules),
    [transactions, categoryRules]
  );

  const monthlyForecast = useMemo(
    () =>
      computeMonthlyCashflowForecast({
        accounts,
        currentUnifiedBalance: unifiedNetWorth.totalUnified,
        transactions,
        recurring,
        fxSettings,
      }),
    [accounts, unifiedNetWorth.totalUnified, transactions, recurring, fxSettings]
  );

  const budgetAlerts = useMemo(
    () =>
      computeBudgetAlerts({
        budgets,
        transactions,
        accounts,
        fxSettings,
      }),
    [budgets, transactions, accounts, fxSettings]
  );

  // Automatic monthly account statement check when app is registered and unlocked
  useEffect(() => {
    if (showAuthGate) return;
    const timer = setTimeout(async () => {
      const res = await checkAndRunAutomaticMonthlyStatement({
        accounts,
        balances: overallBalances,
        transactions,
        goals,
        securitySettings,
        language,
      });
      if (res.triggered && res.entry) {
        setMonthlyEmailSettings(getMonthlyEmailSettings());
        setPendingStatementBanner(res.entry);
        showToast(
          res.webhookSent
            ? language === 'de'
              ? `PDF-Kontoauszug ${res.entry.monthLabel} per E-Mail gesendet!`
              : language === 'en'
                ? `PDF statement ${res.entry.monthLabel} sent by email!`
                : `Estratto conto PDF ${res.entry.monthLabel} inviato via email!`
            : language === 'de'
              ? `PDF-Kontoauszug ${res.entry.monthLabel} zum Senden bereit!`
              : language === 'en'
                ? `PDF statement ${res.entry.monthLabel} ready to send!`
                : `Estratto conto PDF ${res.entry.monthLabel} pronto per l'invio email!`
        );
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [showAuthGate, securitySettings.email, language]);

  // Filtered transactions for Transactions Tab
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const qTag = q.replace(/^#+/, '');
    const selectedAccObj =
      selectedAccount === 'ALL'
        ? undefined
        : accounts.find((a) => a.id === selectedAccount || a.name === selectedAccount);
    const matchAccValue = (val?: string) => {
      if (!val) return false;
      if (selectedAccObj) {
        return val === selectedAccObj.id || val === selectedAccObj.name;
      }
      return val === selectedAccount;
    };

    return transactions
      .filter((tx) => {
        const matchAccount =
          selectedAccount === 'ALL' ||
          matchAccValue(tx.account) ||
          matchAccValue(tx.fromAccount) ||
          matchAccValue(tx.toAccount);
        const matchType = selectedType === 'ALL' || tx.type === selectedType;
        const matchCategory =
          selectedCategory === 'ALL' || tx.category === selectedCategory;
        const matchTag =
          selectedTag === 'ALL' || (tx.tags || []).includes(selectedTag);
        const matchPeriod = isDateInPeriod(tx.date, selectedPeriod, startDate, endDate);

        const matchQuery =
          q === '' ||
          (tx.description && tx.description.toLowerCase().includes(q)) ||
          (tx.notes && tx.notes.toLowerCase().includes(q)) ||
          (tx.category && tx.category.toLowerCase().includes(q)) ||
          (tx.account && tx.account.toLowerCase().includes(q)) ||
          (tx.tags && tx.tags.some((tg) => tg.toLowerCase().includes(qTag))) ||
          (tx.amount && tx.amount.toString().includes(q));

        return matchAccount && matchType && matchCategory && matchTag && matchPeriod && matchQuery;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    transactions,
    accounts,
    selectedAccount,
    selectedType,
    selectedCategory,
    selectedTag,
    selectedPeriod,
    startDate,
    endDate,
    searchQuery,
  ]);

  // Recent 5 transactions for Home Tab
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Transaction Actions
  const handleSaveTransaction = (txData: {
    id?: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    account: string;
    category: string;
    description: string;
    notes?: string;
    tags?: string[];
    date: string;
  }) => {
    let finalCategory = txData.category;
    let finalTags = txData.tags ? mergeUniqueTags([], txData.tags) : undefined;

    // Auto-apply matching rule tags (and category if missing) when coming from quick-add flows without explicit tags
    if (finalTags === undefined) {
      const ruleMatch = matchCategorizationRule(
        txData.description,
        txData.notes,
        txData.type,
        categoryRules,
        categories
      );
      if (ruleMatch) {
        if (!finalCategory && ruleMatch.category) {
          finalCategory = ruleMatch.category;
        }
        if (ruleMatch.tags.length > 0) {
          finalTags = ruleMatch.tags;
        }
      }
    }

    if (txData.id) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === txData.id
            ? {
                ...t,
                ...txData,
                category: finalCategory,
                tags: finalTags && finalTags.length > 0 ? finalTags : undefined,
              }
            : t
        )
      );
      showToast(
        language === 'de'
          ? 'Buchung aktualisiert!'
          : language === 'en'
            ? 'Transaction updated!'
            : 'Movimento aggiornato!'
      );
    } else {
      const newTx: Transaction = {
        id: Date.now().toString(),
        type: txData.type,
        amount: txData.amount,
        account: txData.account,
        category: finalCategory,
        description: txData.description,
        notes: txData.notes,
        tags: finalTags && finalTags.length > 0 ? finalTags : undefined,
        date: txData.date,
      };
      setTransactions((prev) => [newTx, ...prev]);
      showToast(
        language === 'de'
          ? 'Buchung gespeichert!'
          : language === 'en'
            ? 'Transaction saved!'
            : 'Movimento registrato!'
      );
    }
  };

  const handleExecuteQuickShortcut = (sc: QuickShortcut) => {
    const matchedAcc = accounts.find((a) => a.id === sc.account || a.name === sc.account) || accounts[0];
    const targetAccId = matchedAcc?.id || sc.account;
    const accName = matchedAcc?.name || getAccountDisplayName(sc.account, accounts) || sc.account;
    const resolvedCategory = sc.category || categories[0] || 'Altro';
    const catLabel = getCategoryDisplayName(resolvedCategory, language);
    const today = getTodayIsoDate();
    const todayLabel = formatDateEuropean(today);
    const isExpense = sc.type === 'EXPENSE';
    const sign = isExpense ? '-' : '+';
    const amtText = `${sign}${formatCurrency(sc.amount, true, matchedAcc?.currency)}`;
    const isDe = language === 'de';
    const isEn = language === 'en';

    const details: ActionDetail[] = [
      {
        label: isDe ? 'Typ' : isEn ? 'Type' : 'Tipo',
        value: isExpense ? t?.expenseWord || 'Uscita' : t?.incomeWord || 'Entrata',
      },
      {
        label: isDe ? 'Beschreibung' : isEn ? 'Description' : 'Descrizione',
        value: sc.description || sc.label,
      },
      {
        label: isDe ? 'Betrag' : isEn ? 'Amount' : 'Importo',
        value: amtText,
      },
      {
        label: isDe ? 'Konto' : isEn ? 'Account' : 'Conto',
        value: accName,
      },
      {
        label: isDe ? 'Kategorie' : isEn ? 'Category' : 'Categoria',
        value: catLabel,
      },
    ];

    if (sc.tags && sc.tags.length > 0) {
      details.push({
        label: 'Tag',
        value: sc.tags.map((tag) => `#${tag}`).join(', '),
      });
    }

    requestActionConfirmation({
      title: isDe
        ? isExpense
          ? 'Schnellbuchung prüfen (Ausgabe)'
          : 'Schnellbuchung prüfen (Einnahme)'
        : isEn
          ? isExpense
            ? 'Review Quick Expense'
            : 'Review Quick Income'
          : isExpense
            ? 'Controllo Spesa Preferita'
            : 'Controllo Entrata Preferita',
      message: isDe
        ? `Möchten Sie "${sc.description || sc.label}" (${amtText}) auf Konto "${accName}" erfassen?`
        : isEn
          ? `Do you want to record "${sc.description || sc.label}" (${amtText}) on account "${accName}"?`
          : `Vuoi registrare "${sc.description || sc.label}" (${amtText}) sul conto "${accName}"?`,
      warningNote: isDe
        ? `Bitte prüfen Sie die Angaben vor der heutigen Buchung (${todayLabel}).`
        : isEn
          ? `Verify the details before accepting today's entry (${todayLabel}).`
          : `Controlla i dettagli prima di accettare la registrazione ad oggi (${todayLabel}).`,
      actionType: 'EXECUTE',
      confirmText: isDe
        ? 'Akzeptieren & Buchen'
        : isEn
          ? 'Accept & Record'
          : 'Accetta e Registra',
      cancelText: t.cancelBtn,
      details,
      onConfirm: () => {
        const execToday = getTodayIsoDate();
        const newTx: Transaction = {
          id: `qsc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          date: execToday,
          type: sc.type,
          amount: sc.amount,
          account: targetAccId,
          category: resolvedCategory,
          description: sc.description || sc.label,
          tags: sc.tags && sc.tags.length > 0 ? sc.tags : undefined,
        };
        setTransactions((prev) => [newTx, ...prev]);
        showToast(
          isDe
            ? `${sc.label} (${amtText}) erfasst!`
            : isEn
              ? `${sc.label} (${amtText}) logged!`
              : `${sc.label} (${amtText}) registrato!`
        );
      },
    });
  };

  // Auto-Categorization Rules Handlers
  const handleSaveRule = (rule: CategoryRule) => {
    const exists = categoryRules.some((r) => r.id === rule.id);
    setCategoryRules((prev) =>
      exists ? prev.map((r) => (r.id === rule.id ? rule : r)) : [rule, ...prev]
    );
    showToast(
      exists
        ? language === 'de'
          ? 'Regel aktualisiert!'
          : language === 'en'
            ? 'Rule updated!'
            : 'Regola aggiornata!'
        : language === 'de'
          ? 'Regel hinzugefügt!'
          : language === 'en'
            ? 'Rule added!'
            : 'Regola aggiunta!'
    );
  };

  const handleDeleteRule = (id: string) => {
    setCategoryRules((prev) => prev.filter((r) => r.id !== id));
    showToast(
      language === 'de'
        ? 'Regel gelöscht'
        : language === 'en'
          ? 'Rule deleted'
          : 'Regola eliminata'
    );
  };

  const handleToggleRule = (id: string) => {
    setCategoryRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleApplyRulesToHistory = () => {
    const { updatedTransactions, updatedCount } = applyRulesToExistingTransactions({
      transactions,
      rules: categoryRules,
      availableCategories: categories,
      overwriteCategory: true,
    });
    if (updatedCount === 0) {
      showToast(
        language === 'de'
          ? 'Alle Buchungen entsprechen bereits den Regeln.'
          : language === 'en'
            ? 'All transactions already match the rules.'
            : 'Tutti i movimenti sono già allineati alle regole.'
      );
      return;
    }
    setTransactions(updatedTransactions);
    showToast(
      language === 'de'
        ? `${updatedCount} Buchungen aktualisiert!`
        : language === 'en'
          ? `${updatedCount} transactions updated!`
          : `${updatedCount} movimenti aggiornati con le regole!`
    );
  };

  const handleImportTransactions = (newTxs: Transaction[]) => {
    if (!newTxs || newTxs.length === 0) return;
    setTransactions((prev) => [...newTxs, ...prev]);
  };

  const handleDuplicateTransaction = (tx: Transaction) => {
    if (tx.type === 'TRANSFER') return;
    const today = getTodayIsoDate();
    const copyTx: Transaction = {
      ...tx,
      id: `dup_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: today,
    };
    setTransactions((prev) => [copyTx, ...prev]);
    showToast(
      language === 'de'
        ? `Buchung auf heute dupliziert: ${tx.description}`
        : language === 'en'
          ? `Duplicated to today: ${tx.description}`
          : `Duplicato ad oggi: ${tx.description}`
    );
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    const isDe = language === 'de';
    const isEn = language === 'en';
    const desc = tx
      ? `"${tx.description}" (${formatCurrency(tx.amount)})`
      : isDe
        ? 'diese Buchung'
        : isEn
          ? 'this transaction'
          : 'questo movimento';

    requestActionConfirmation({
      title: isDe
        ? 'Buchung löschen bestätigen'
        : isEn
          ? 'Confirm Transaction Deletion'
          : 'Avviso Eliminazione Movimento',
      message: isDe
        ? `Möchten Sie ${desc} wirklich endgültig löschen?`
        : isEn
          ? `Are you sure you want to permanently delete ${desc}?`
          : `Sei sicuro di voler eliminare definitivamente ${desc}?`,
      warningNote: isDe
        ? 'Die Buchung wird aus dem Verlauf entfernt und Kontostände werden neu berechnet.'
        : isEn
          ? 'This transaction will be removed from history and account balances will be recalculated.'
          : 'Il movimento verrà rimosso dallo storico e i saldi dei conti associati verranno ricalcolati.',
      actionType: 'DELETE',
      confirmText: isDe ? 'Buchung löschen' : isEn ? 'Delete Transaction' : 'Elimina Movimento',
      cancelText: t.cancelBtn,
      details: tx
        ? [
            { label: isDe ? 'Beschreibung' : isEn ? 'Description' : 'Descrizione', value: tx.description },
            { label: isDe ? 'Betrag' : isEn ? 'Amount' : 'Importo', value: formatCurrency(tx.amount) },
            { label: isDe ? 'Datum' : isEn ? 'Date' : 'Data', value: tx.date },
          ]
        : [],
      onConfirm: () => {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        showToast(
          isDe ? 'Buchung gelöscht' : isEn ? 'Transaction deleted' : 'Movimento eliminato'
        );
      },
    });
  };

  const executeTransfer = (data: {
    amount: number;
    fromAccount: string;
    toAccount: string;
    note: string;
    date: string;
    convertedAmount?: number;
  }) => {
    const resolvedFrom = getAccountDisplayName(data.fromAccount, accounts);
    const resolvedTo = getAccountDisplayName(data.toAccount, accounts);
    const fromCode = getAccountCurrencyCode(data.fromAccount, accounts);
    const toCode = getAccountCurrencyCode(data.toAccount, accounts);
    const computedConverted =
      data.convertedAmount !== undefined
        ? data.convertedAmount
        : fromCode !== toCode
          ? Math.round(convertCurrencyAmount(data.amount, fromCode, toCode, fxSettings.rates) * 100) / 100
          : undefined;
    const defaultTransferNote = t?.transferDefaultNote || (language === 'de' ? 'Umbuchung' : language === 'en' ? 'Transfer' : 'Giroconto');
    const noteText = data.note ? data.note : defaultTransferNote;

    const newTx: Transaction = {
      id: Date.now().toString(),
      type: 'TRANSFER',
      amount: data.amount,
      ...(computedConverted !== undefined ? { convertedAmount: computedConverted } : {}),
      fromAccount: resolvedFrom,
      toAccount: resolvedTo,
      description: `${defaultTransferNote}: ${noteText}`,
      category: 'Giroconto',
      date: data.date,
    };
    setTransactions((prev) => [newTx, ...prev]);
    showToast(
      t?.transferSuccessToast ||
        (language === 'de'
          ? 'Umbuchung erfolgreich durchgeführt!'
          : language === 'en'
            ? 'Transfer executed successfully!'
            : 'Giroconto eseguito con successo!')
    );
  };

  const handleInitiateTransfer = (data: {
    amount: number;
    fromAccount: string;
    toAccount: string;
    note: string;
    date?: string;
  }) => {
    const fromAcc = accounts.find((a) => a.id === data.fromAccount || a.name === data.fromAccount);
    const toAcc = accounts.find((a) => a.id === data.toAccount || a.name === data.toAccount);
    const fromAccName = fromAcc?.name || data.fromAccount;
    const toAccName = toAcc?.name || data.toAccount;
    const fromCode = getAccountCurrencyCode(data.fromAccount, accounts);
    const toCode = getAccountCurrencyCode(data.toAccount, accounts);
    const isCrossCurrency = fromCode !== toCode;
    const convertedAmount = isCrossCurrency
      ? Math.round(convertCurrencyAmount(data.amount, fromCode, toCode, fxSettings.rates) * 100) / 100
      : undefined;

    const formattedAmount = formatCurrency(data.amount, true, fromAcc?.currency);
    const formattedConverted =
      convertedAmount !== undefined ? formatCurrency(convertedAmount, true, toAcc?.currency) : null;
    const transferDate = data.date || new Date().toISOString().split('T')[0];

    const isDe = language === 'de';
    const isEn = language === 'en';
    const defaultTransferNote = t?.transferDefaultNote || (isDe ? 'Umbuchung' : isEn ? 'Transfer' : 'Giroconto');

    const transferTitle = t?.transferConfirmTitle || (isDe ? 'Bestätigung Umbuchung' : isEn ? 'Confirm Funds Transfer' : 'Avviso Trasferimento Fondi');
    const transferMsg = t?.transferConfirmMessage
      ? t.transferConfirmMessage.replace('{amount}', formattedAmount).replace('{from}', fromAccName).replace('{to}', toAccName)
      : (isDe
        ? `Möchten Sie die Umbuchung von ${formattedAmount} von "${fromAccName}" auf "${toAccName}" ausführen?`
        : isEn
          ? `Do you want to proceed with the transfer of ${formattedAmount} from "${fromAccName}" to "${toAccName}"?`
          : `Vuoi procedere con il trasferimento di ${formattedAmount} da "${fromAccName}" a "${toAccName}"?`);
    const transferWarn = formattedConverted
      ? isDe
        ? `${formattedAmount} wird von "${fromAccName}" abgebucht und umgerechnet (≈ ${formattedConverted}) auf "${toAccName}" gutgeschrieben.`
        : isEn
          ? `${formattedAmount} will be deducted from "${fromAccName}" and credited as ≈ ${formattedConverted} to "${toAccName}".`
          : `L'importo di ${formattedAmount} verrà detratto da "${fromAccName}" e convertito in ≈ ${formattedConverted} su "${toAccName}".`
      : t?.transferConfirmWarning
        ? t.transferConfirmWarning.replace('{amount}', formattedAmount).replace('{from}', fromAccName).replace('{to}', toAccName)
        : (isDe
          ? `Der Betrag von ${formattedAmount} wird von "${fromAccName}" abgebucht und "${toAccName}" gutgeschrieben.`
          : isEn
            ? `The amount of ${formattedAmount} will be deducted from "${fromAccName}" and credited to "${toAccName}".`
            : `L'importo di ${formattedAmount} verrà detratto da "${fromAccName}" e accreditato su "${toAccName}".`);

    const details: ActionDetail[] = [
      { label: isDe ? 'Betrag (Quelle)' : isEn ? 'Amount (Source)' : 'Importo (Origine)', value: formattedAmount },
      ...(formattedConverted
        ? [{ label: isDe ? `Gutschrift (${toCode})` : isEn ? `Credited (${toCode})` : `Accredito (${toCode})`, value: `≈ ${formattedConverted}` }]
        : []),
      { label: isDe ? 'Von Konto (Quelle)' : isEn ? 'From Account (Source)' : 'Da Conto (Origine)', value: fromAccName },
      { label: isDe ? 'Auf Konto (Ziel)' : isEn ? 'To Account (Destination)' : 'A Conto (Destinazione)', value: toAccName },
      { label: isDe ? 'Verwendungszweck' : isEn ? 'Reason / Notes' : 'Causale', value: data.note || defaultTransferNote },
      { label: isDe ? 'Ausführungsdatum' : isEn ? 'Execution Date' : 'Data Esecuzione', value: transferDate },
    ];

    requestActionConfirmation({
      title: transferTitle,
      message: transferMsg,
      warningNote: transferWarn,
      actionType: 'TRANSFER',
      confirmText: t?.transferConfirmBtn || (isDe ? 'Umbuchung ausführen' : isEn ? 'Execute Transfer' : 'Esegui Trasferimento'),
      cancelText: t?.cancelBtn || (isDe ? 'Abbrechen' : isEn ? 'Cancel' : 'Annulla'),
      details,
      onConfirm: () => {
        executeTransfer({
          amount: data.amount,
          fromAccount: data.fromAccount,
          toAccount: data.toAccount,
          note: data.note,
          date: transferDate,
          convertedAmount,
        });
      },
    });
  };

  // Accounts Actions
  const handleSaveAccount = (
    account: Account,
    previousInfo?: { oldId: string; oldName: string }
  ) => {
    const oldId = previousInfo?.oldId;
    const oldName = previousInfo?.oldName;
    const newName = account.name.trim();
    const newId = account.id;

    const hasNameChanged = Boolean(
      (oldName && oldName !== newName) ||
      (oldId && oldId !== newName && oldId !== newId)
    );

    setAccounts((prev) => {
      if (oldId) {
        return prev.map((a) => (a.id === oldId ? account : a));
      }
      const exists = prev.some((a) => a.id === account.id);
      if (exists) {
        return prev.map((a) => (a.id === account.id ? account : a));
      }
      return [...prev, account];
    });

    if (hasNameChanged && (oldName || oldId)) {
      const matchOld = (val?: string) =>
        Boolean(val && (val === oldName || val === oldId));

      // 1. Aggiorna tutti i movimenti esistenti associati a questo conto
      setTransactions((prev) =>
        prev.map((t) => {
          let changed = false;
          let newAcc = t.account;
          let newFrom = t.fromAccount;
          let newTo = t.toAccount;

          if (matchOld(t.account)) {
            newAcc = newName;
            changed = true;
          }
          if (matchOld(t.fromAccount)) {
            newFrom = newName;
            changed = true;
          }
          if (matchOld(t.toAccount)) {
            newTo = newName;
            changed = true;
          }

          if (changed) {
            return {
              ...t,
              account: newAcc,
              fromAccount: newFrom,
              toAccount: newTo,
            };
          }
          return t;
        })
      );

      // 2. Aggiorna tutti i modelli di movimenti ricorrenti
      setRecurring((prev) =>
        prev.map((r) => {
          if (matchOld(r.account)) {
            return { ...r, account: newName };
          }
          return r;
        })
      );

      // 3. Aggiorna scorciatoie preferite e debiti/crediti collegati
      setQuickShortcuts((prev) =>
        prev.map((s) => (matchOld(s.account) ? { ...s, account: newId } : s))
      );
      setDebtsCredits((prev) =>
        prev.map((d) => (matchOld(d.account) ? { ...d, account: newId } : d))
      );

      // 4. Aggiorna il filtro conto attivo se era impostato sul vecchio conto
      if (matchOld(selectedAccount)) {
        setSelectedAccount(newId);
      }

      showToast(
        language === 'de'
          ? `Konto "${newName}" und alle verknüpften Buchungen aktualisiert!`
          : language === 'en'
            ? `Account "${newName}" and all linked transactions updated!`
            : `Conto "${newName}" e tutti i movimenti collegati aggiornati!`
      );
    } else {
      showToast(
        language === 'de'
          ? 'Konto gespeichert!'
          : language === 'en'
            ? 'Account saved!'
            : 'Conto salvato!'
      );
    }
  };

  const handleDeleteAccount = (accId: string) => {
    const isDe = language === 'de';
    const isEn = language === 'en';
    if (accounts.length <= 1) {
      showToast(
        isDe
          ? 'Mindestens ein Konto muss erhalten bleiben.'
          : isEn
            ? 'You must keep at least one account.'
            : 'Devi mantenere almeno un conto.'
      );
      return;
    }
    const acc = accounts.find((a) => a.id === accId);
    const accName = acc?.name || accId;

    requestActionConfirmation({
      title: isDe
        ? 'Konto löschen bestätigen'
        : isEn
          ? 'Confirm Account Deletion'
          : 'Avviso Eliminazione Conto',
      message: isDe
        ? `Möchten Sie das Konto "${accName}" wirklich löschen?`
        : isEn
          ? `Are you sure you want to delete account "${accName}"?`
          : `Sei sicuro di voler eliminare il conto "${accName}"?`,
      warningNote: isDe
        ? 'Hinweis: Vorhandene Buchungen dieses Kontos werden nicht automatisch gelöscht.'
        : isEn
          ? 'Warning: existing transactions linked to this account will not be deleted automatically.'
          : 'Attenzione: i movimenti esistenti associati a questo conto non verranno cancellati automaticamente.',
      actionType: 'DELETE',
      confirmText: isDe ? 'Konto löschen' : isEn ? 'Delete Account' : 'Elimina Conto',
      cancelText: t.cancelBtn,
      onConfirm: () => {
        setAccounts((prev) => prev.filter((a) => a.id !== accId));
        if (selectedAccount === accId) {
          setSelectedAccount('ALL');
        }
        showToast(isDe ? 'Konto gelöscht' : isEn ? 'Account deleted' : 'Conto eliminato');
      },
    });
  };

  // Categories Actions
  const handleAddCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategories((prev) => [...prev, trimmed]);
      setCategoryVisualVersion((v) => v + 1);
      showToast(
        language === 'de'
          ? 'Kategorie hinzugefügt!'
          : language === 'en'
            ? 'Category added!'
            : 'Categoria aggiunta!'
      );
    }
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCategories((prev) =>
      Array.from(new Set(prev.map((c) => (c === oldName ? trimmed : c))))
    );
    // Also update existing transactions, budgets, recurring templates, auto-rules, and shortcuts
    setTransactions((prev) =>
      prev.map((t) => (t.category === oldName ? { ...t, category: trimmed } : t))
    );
    setBudgets((prev) => {
      const next = { ...prev };
      if (next[oldName] !== undefined) {
        if (next[trimmed] === undefined) {
          next[trimmed] = next[oldName];
        }
        delete next[oldName];
      }
      return next;
    });
    setRecurring((prev) =>
      prev.map((r) => (r.category === oldName ? { ...r, category: trimmed } : r))
    );
    setCategoryRules((prev) =>
      prev.map((r) => (r.category === oldName ? { ...r, category: trimmed } : r))
    );
    setQuickShortcuts((prev) =>
      prev.map((s) => (s.category === oldName ? { ...s, category: trimmed } : s))
    );
    setCategoryVisualVersion((v) => v + 1);
    showToast(
      language === 'de'
        ? 'Kategorie umbenannt!'
        : language === 'en'
          ? 'Category renamed!'
          : 'Categoria rinominata!'
    );
  };

  const handleDeleteCategory = (name: string) => {
    setCategories((prev) => prev.filter((c) => c !== name));
    setBudgets((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setCategoryVisualVersion((v) => v + 1);
    showToast(
      language === 'de'
        ? 'Kategorie entfernt'
        : language === 'en'
          ? 'Category removed'
          : 'Categoria rimossa'
    );
  };

  // Recurring Movements Actions
  const handleSaveRecurring = (item: RecurringMovement) => {
    setRecurring((prev) => {
      const exists = prev.some((r) => r.id === item.id);
      if (exists) {
        return prev.map((r) => (r.id === item.id ? item : r));
      }
      return [item, ...prev];
    });
    showToast(
      language === 'de'
        ? 'Vorlage gespeichert!'
        : language === 'en'
          ? 'Template saved!'
          : 'Modello salvato!'
    );
  };

  const handleDeleteRecurring = (id: string) => {
    setRecurring((prev) => prev.filter((r) => r.id !== id));
    showToast(
      language === 'de'
        ? 'Vorlage gelöscht'
        : language === 'en'
          ? 'Template deleted'
          : 'Modello eliminato'
    );
  };

  const handleApplyRecurring = (id: string) => {
    const item = recurring.find((r) => r.id === id);
    if (!item) return;
    const isDe = language === 'de';
    const isEn = language === 'en';
    const catLabel = getCategoryDisplayName(item.category, language);

    requestActionConfirmation({
      title: isDe
        ? 'Dauerbuchung eintragen'
        : isEn
          ? 'Post Recurring Transaction'
          : 'Avviso Applicazione Movimento',
      message: isDe
        ? `Möchten Sie "${item.description}" über ${formatCurrency(item.amount)} mit heutigem Datum buchen?`
        : isEn
          ? `Do you want to post "${item.description}" for ${formatCurrency(item.amount)} with today's date?`
          : `Vuoi inserire a bilancio il movimento "${item.description}" per un importo di ${formatCurrency(item.amount)} con data di oggi?`,
      warningNote: isDe
        ? `Es wird eine Buchung auf Konto "${item.account}" unter Kategorie "${catLabel}" erstellt.`
        : isEn
          ? `A transaction will be recorded on account "${item.account}" under category "${catLabel}".`
          : `Verrà registrata una transazione sul conto "${item.account}" nella categoria "${catLabel}".`,
      actionType: 'EXECUTE',
      confirmText: isDe ? 'Jetzt buchen' : isEn ? 'Post Transaction' : 'Registra Movimento',
      cancelText: t.cancelBtn,
      details: [
        { label: isDe ? 'Beschreibung' : isEn ? 'Description' : 'Descrizione', value: item.description },
        { label: isDe ? 'Betrag' : isEn ? 'Amount' : 'Importo', value: formatCurrency(item.amount) },
        { label: isDe ? 'Konto' : isEn ? 'Account' : 'Conto', value: item.account },
        { label: isDe ? 'Kategorie' : isEn ? 'Category' : 'Categoria', value: catLabel },
      ],
      onConfirm: () => {
        const today = getTodayIsoDate();
        const newTx: Transaction = {
          id: Date.now().toString(),
          date: today,
          type: item.type,
          account: item.account,
          category: item.category,
          amount: item.amount,
          description: item.description,
        };

        setTransactions((prev) => [newTx, ...prev]);
        setRecurring((prev) =>
          prev.map((r) =>
            r.id === item.id
              ? {
                  ...r,
                  lastAppliedDate: today,
                  nextDueDate: r.nextDueDate
                    ? advanceRecurringDate(
                        r.nextDueDate <= today ? today : r.nextDueDate,
                        r.frequency || 'MONTHLY'
                      )
                    : advanceRecurringDate(today, r.frequency || 'MONTHLY'),
                }
              : r
          )
        );
        showToast(
          isDe
            ? `Gebucht: ${item.description}`
            : isEn
              ? `Posted: ${item.description}`
              : `Applicato: ${item.description}`
        );
      },
    });
  };

  const handleApplyAllRecurring = () => {
    const isDe = language === 'de';
    const isEn = language === 'en';
    if (recurring.length === 0) {
      showToast(
        isDe
          ? 'Keine Dauerbuchungen gespeichert'
          : isEn
            ? 'No recurring templates saved'
            : 'Nessun movimento ricorrente salvato'
      );
      return;
    }

    requestActionConfirmation({
      title: isDe
        ? 'Alle Dauerbuchungen anwenden'
        : isEn
          ? 'Apply All Recurring Items'
          : 'Avviso Applicazione Ricorrenti',
      message: isDe
        ? `Möchten Sie alle ${recurring.length} gespeicherten Dauerbuchungen mit dem heutigen Datum eintragen?`
        : isEn
          ? `Do you want to post all ${recurring.length} saved recurring items with today's date?`
          : `Vuoi inserire contemporaneamente tutti i ${recurring.length} movimenti ricorrenti registrati con la data odierna?`,
      warningNote: isDe
        ? 'Für jede gespeicherte Vorlage wird eine neue Buchung erstellt.'
        : isEn
          ? 'New transactions will be created for each saved template.'
          : 'Verranno create nuove transazioni corrispondenti a ciascun modello salvato.',
      actionType: 'EXECUTE',
      confirmText: isDe
        ? `${recurring.length} buchen`
        : isEn
          ? `Post ${recurring.length} Items`
          : `Applica ${recurring.length} Movimenti`,
      cancelText: t.cancelBtn,
      details: [
        { label: isDe ? 'Anzahl' : isEn ? 'Count' : 'Numero Movimenti', value: recurring.length.toString() },
        { label: isDe ? 'Ausführungsdatum' : isEn ? 'Execution Date' : 'Data Esecuzione', value: getTodayIsoDate() },
      ],
      onConfirm: () => {
        const today = getTodayIsoDate();
        const newItems: Transaction[] = recurring.map((r, i) => ({
          id: (Date.now() + i).toString(),
          date: today,
          type: r.type,
          account: r.account,
          category: r.category,
          amount: r.amount,
          description: r.description,
        }));

        setTransactions((prev) => [...newItems, ...prev]);
        setRecurring((prev) =>
          prev.map((r) => ({
            ...r,
            lastAppliedDate: today,
            nextDueDate: r.nextDueDate
              ? advanceRecurringDate(
                  r.nextDueDate <= today ? today : r.nextDueDate,
                  r.frequency || 'MONTHLY'
                )
              : advanceRecurringDate(today, r.frequency || 'MONTHLY'),
          }))
        );
        showToast(
          isDe
            ? `${recurring.length} Dauerbuchungen für heute eingetragen!`
            : isEn
              ? `${recurring.length} recurring transactions posted for today!`
              : `${recurring.length} movimenti ricorrenti applicati ad oggi!`
        );
      },
    });
  };

  // Goals Actions
  const handleSaveGoal = (goal: Goal) => {
    setGoals((prev) => {
      const exists = prev.some((g) => g.id === goal.id);
      if (exists) {
        return prev.map((g) => (g.id === goal.id ? goal : g));
      }
      return [...prev, goal];
    });
    showToast(
      language === 'de'
        ? 'Sparziel gespeichert!'
        : language === 'en'
          ? 'Savings goal saved!'
          : 'Obiettivo salvato!'
    );
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    showToast(
      language === 'de'
        ? 'Sparziel gelöscht'
        : language === 'en'
          ? 'Savings goal deleted'
          : 'Obiettivo eliminato'
    );
  };

  const handleDepositToGoal = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, current: (g.current || 0) + amount } : g))
    );
  };

  // Debts, Installments & Credits Actions
  const handleSaveDebtCredit = (entry: DebtCreditEntry) => {
    setDebtsCredits((prev) => {
      const exists = prev.some((d) => d.id === entry.id);
      if (exists) {
        return prev.map((d) => (d.id === entry.id ? entry : d));
      }
      return [entry, ...prev];
    });
    showToast(
      language === 'de'
        ? 'Eintrag gespeichert!'
        : language === 'en'
          ? 'Debt/Credit entry saved!'
          : 'Voce debito/credito salvata!'
    );
  };

  const handleDeleteDebtCredit = (id: string) => {
    const target = debtsCredits.find((d) => d.id === id);
    const isDe = language === 'de';
    const isEn = language === 'en';
    requestActionConfirmation({
      title: isDe
        ? 'Eintrag löschen'
        : isEn
          ? 'Delete Debt / Credit'
          : 'Elimina Debito / Credito',
      message: target
        ? isDe
          ? `Möchten Sie "${target.title}" (${target.counterparty}) wirklich löschen?`
          : isEn
            ? `Are you sure you want to delete "${target.title}" (${target.counterparty})?`
            : `Sei sicuro di voler eliminare "${target.title}" (${target.counterparty})?`
        : isDe
          ? 'Diesen Eintrag wirklich löschen?'
          : isEn
            ? 'Delete this entry?'
            : 'Eliminare questa voce?',
      actionType: 'DELETE',
      confirmText: isDe ? 'Löschen' : isEn ? 'Delete' : 'Elimina',
      cancelText: t.cancelBtn,
      onConfirm: () => {
        setDebtsCredits((prev) => prev.filter((d) => d.id !== id));
        showToast(
          isDe
            ? 'Eintrag gelöscht'
            : isEn
              ? 'Entry deleted'
              : 'Voce eliminata'
        );
      },
    });
  };

  const handleRecordDebtCreditPayment = ({
    entry,
    amount,
    postToAccount,
    accountId,
    incrementInstallment,
  }: {
    entry: DebtCreditEntry;
    amount: number;
    postToAccount: boolean;
    accountId?: string;
    incrementInstallment: boolean;
  }) => {
    const updatedEntry = recordDebtCreditPayment(entry, amount, incrementInstallment);
    setDebtsCredits((prev) => prev.map((d) => (d.id === entry.id ? updatedEntry : d)));

    if (postToAccount && accounts.length > 0) {
      const targetAcc =
        accounts.find((a) => a.id === accountId || a.name === accountId) || accounts[0];
      const today = getTodayIsoDate();
      const isCredit = entry.direction === 'CREDIT';
      const defaultCat = isCredit
        ? categories.find((c) => /altro|rimbors|entrata/i.test(c)) || categories[0] || 'Altro'
        : categories.find((c) => /rate|prestit|abbonament|canone|altro/i.test(c)) || categories[0] || 'Altro';
      const txDescPrefix = isCredit
        ? language === 'de'
          ? 'Rückzahlung'
          : language === 'en'
            ? 'Repayment'
            : 'Incasso quota'
        : language === 'de'
          ? 'Rate / Zahlung'
          : language === 'en'
            ? 'Payment'
            : 'Rata / Quota';
      const txAmount = convertCurrencyAmount(
        amount,
        entry.currency || 'EUR',
        targetAcc.currency || 'EUR',
        fxSettings.rates
      );
      const newTx: Transaction = {
        id: `dctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        date: today,
        type: isCredit ? 'INCOME' : 'EXPENSE',
        amount: Math.round(txAmount * 100) / 100,
        account: targetAcc.id,
        category: defaultCat,
        description: `${txDescPrefix}: ${entry.title} (${entry.counterparty})`,
        tags: isCredit ? ['crediti'] : ['rate'],
      };
      setTransactions((prev) => [newTx, ...prev]);
    }

    const curr = entry.currency || 'EUR';
    showToast(
      updatedEntry.status === 'SETTLED'
        ? language === 'de'
          ? `"${entry.title}" vollständig beglichen!`
          : language === 'en'
            ? `"${entry.title}" settled in full!`
            : `"${entry.title}" saldato completamente!`
        : language === 'de'
          ? `Zahlung von ${formatCurrency(amount, true, curr)} erfasst!`
          : language === 'en'
            ? `Recorded payment of ${formatCurrency(amount, true, curr)}!`
            : `Registrata quota di ${formatCurrency(amount, true, curr)}!`
    );
  };

  const handleReopenDebtCredit = (id: string) => {
    setDebtsCredits((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: 'OPEN',
              remainingAmount: d.remainingAmount > 0 ? d.remainingAmount : d.totalAmount,
              updatedAt: new Date().toISOString(),
            }
          : d
      )
    );
    showToast(
      language === 'de'
        ? 'Eintrag wieder geöffnet'
        : language === 'en'
          ? 'Entry reopened'
          : 'Voce riaperta'
    );
  };

  // Clear filters
  const handleClearFilters = () => {
    setSelectedPeriod('ALL');
    setSelectedType('ALL');
    setSelectedAccount('ALL');
    setSelectedCategory('ALL');
    setSelectedTag('ALL');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    showToast(t?.filtersResetToast || 'Filtri azzerati');
  };

  // Backup & Restore
  const getBackupData = () => ({
    accounts,
    transactions,
    categories,
    recurring,
    budgets,
    goals,
    categoryRules,
    fxSettings,
    quickShortcuts,
    debtsCredits,
    categoryIcons: getSavedCategoryIcons(),
    categoryColors: getSavedCategoryColors(),
    recurringNotificationsEnabled: recurringNotifEnabled,
    exportDate: new Date().toISOString(),
    version: '3.3.0',
  });

  const handleExportJson = () => {
    try {
      const backupData = getBackupData();
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `myfinance_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(t.backupDownloadedToast);
    } catch (err) {
      console.error(err);
      showToast(
        language === 'de'
          ? 'Fehler beim Exportieren des Backups.'
          : language === 'en'
            ? 'Error exporting backup.'
            : "Errore durante l'esportazione del backup."
      );
    }
  };

  const handleCopyBackupJson = async () => {
    try {
      const jsonStr = JSON.stringify(getBackupData(), null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonStr);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = jsonStr;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast(t.backupCopiedToast);
    } catch (err) {
      console.error(err);
      showToast(
        language === 'de'
          ? 'Kopieren in Zwischenablage fehlgeschlagen.'
          : language === 'en'
            ? 'Could not copy to clipboard.'
            : 'Impossibile copiare negli appunti.'
      );
    }
  };

  const handleExportCsv = () => {
    try {
      let csv = '\uFEFFData,Tipo,Conto,Categoria,Descrizione,Note,Importo\n';
      transactions.forEach((tx) => {
        csv += `"${tx.date}","${tx.type}","${tx.account || tx.fromAccount || ''}","${
          tx.category || ''
        }","${(tx.description || '').replace(/"/g, '""')}","${(tx.notes || '').replace(/"/g, '""')}","${tx.amount}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `myfinance_movimenti_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(
        language === 'de'
          ? 'CSV-Datei erfolgreich exportiert!'
          : language === 'en'
            ? 'CSV transactions exported!'
            : 'Movimenti CSV esportati!'
      );
    } catch (err) {
      console.error(err);
      showToast(
        language === 'de'
          ? 'Fehler beim CSV-Export.'
          : language === 'en'
            ? 'Error during CSV export.'
            : "Errore durante l'esportazione CSV."
      );
    }
  };

  const handleImportJson = (jsonData: any): boolean => {
    try {
      if (!jsonData) {
        showToast(
          language === 'de'
            ? 'Keine Daten angegeben.'
            : language === 'en'
              ? 'No data provided.'
              : 'Nessun dato fornito.'
        );
        return false;
      }

      // Unwrap if wrapped in { state: ... } or root object
      const data =
        jsonData.state && typeof jsonData.state === 'object'
          ? jsonData.state
          : jsonData;

      const newAccounts = data.accounts || data.conti;
      const newTransactions =
        data.transactions ||
        data.movimenti ||
        (Array.isArray(data) ? data : null);
      const newCategories = data.categories || data.categorie;
      const newRecurring = data.recurring || data.ricorrenti;
      const newBudgets = data.budgets;
      const newGoals = data.goals || data.obiettivi;

      let importedCount = 0;

      if (Array.isArray(newAccounts) && newAccounts.length > 0) {
        setAccounts(newAccounts);
        localStorage.setItem('myfinance_accounts_v3', JSON.stringify(newAccounts));
        saveToIndexedDB('accounts', newAccounts);
        importedCount++;
      }
      if (Array.isArray(newTransactions)) {
        setTransactions(newTransactions);
        localStorage.setItem('myfinance_transactions_v3', JSON.stringify(newTransactions));
        saveToIndexedDB('transactions', newTransactions);
        importedCount++;
      }
      if (Array.isArray(newCategories) && newCategories.length > 0) {
        setCategories(newCategories);
        localStorage.setItem('myfinance_categories_v3', JSON.stringify(newCategories));
        saveToIndexedDB('categories', newCategories);
        importedCount++;
      }
      if (Array.isArray(newRecurring)) {
        setRecurring(newRecurring);
        localStorage.setItem('myfinance_recurring_v3', JSON.stringify(newRecurring));
        saveToIndexedDB('recurring', newRecurring);
        importedCount++;
      }
      if (newBudgets && typeof newBudgets === 'object') {
        setBudgets(newBudgets);
        localStorage.setItem('myfinance_budgets_v3', JSON.stringify(newBudgets));
        saveToIndexedDB('budgets', newBudgets);
        importedCount++;
      }
      if (Array.isArray(newGoals)) {
        setGoals(newGoals);
        localStorage.setItem('myfinance_goals_v3', JSON.stringify(newGoals));
        saveToIndexedDB('goals', newGoals);
        importedCount++;
      }
      if (Array.isArray(data.categoryRules)) {
        setCategoryRules(data.categoryRules);
        localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(data.categoryRules));
        saveToIndexedDB('rules', data.categoryRules);
        importedCount++;
      }
      if (data.fxSettings && typeof data.fxSettings === 'object' && data.fxSettings.baseCurrency) {
        setFxSettings(data.fxSettings);
        saveFxSettings(data.fxSettings);
        saveToIndexedDB('fxSettings', data.fxSettings);
        importedCount++;
      }
      if (Array.isArray(data.quickShortcuts)) {
        setQuickShortcuts(data.quickShortcuts);
        saveQuickShortcuts(data.quickShortcuts);
        saveToIndexedDB('quickShortcuts', data.quickShortcuts);
        importedCount++;
      }
      if (Array.isArray(data.debtsCredits)) {
        setDebtsCredits(data.debtsCredits);
        saveDebtsCredits(data.debtsCredits);
        saveToIndexedDB('debtsCredits', data.debtsCredits);
        importedCount++;
      }
      if (data.categoryIcons && typeof data.categoryIcons === 'object') {
        localStorage.setItem('myfinance_category_icons_v3', JSON.stringify(data.categoryIcons));
        setCategoryVisualVersion((v) => v + 1);
        importedCount++;
      }
      if (data.categoryColors && typeof data.categoryColors === 'object') {
        localStorage.setItem('myfinance_category_colors_v3', JSON.stringify(data.categoryColors));
        setCategoryVisualVersion((v) => v + 1);
        importedCount++;
      }
      if (typeof data.recurringNotificationsEnabled === 'boolean') {
        setRecurringNotificationsEnabled(data.recurringNotificationsEnabled);
        setRecurringNotifEnabled(data.recurringNotificationsEnabled);
        importedCount++;
      }

      if (importedCount > 0) {
        showToast(
          language === 'de'
            ? 'Backup erfolgreich wiederhergestellt!'
            : language === 'en'
              ? 'Backup restored successfully!'
              : 'Backup ripristinato con successo!'
        );
        return true;
      } else {
        showToast(
          language === 'de'
            ? 'Keine gültigen Daten in der Datei gefunden.'
            : language === 'en'
              ? 'No valid data found in the file.'
              : 'Nessun dato valido riconosciuto nel file.'
        );
        return false;
      }
    } catch (err) {
      console.error('Import error:', err);
      showToast(
        language === 'de'
          ? 'Fehler beim Laden der JSON-Datei.'
          : language === 'en'
            ? 'Error loading JSON file.'
            : 'Errore nel caricamento del file JSON.'
      );
      return false;
    }
  };

  const handleResetDemo = () => {
    const isDe = language === 'de';
    const isEn = language === 'en';
    requestActionConfirmation({
      title: isDe
        ? 'Demo-Daten wiederherstellen'
        : isEn
          ? 'Reset Initial Demo Data'
          : 'Avviso Ripristino Dati Demo',
      message: isDe
        ? 'Alle Standard-Beispieldaten wiederherstellen? Alle lokalen Änderungen gehen verloren.'
        : isEn
          ? 'Restore initial demo data? All local changes will be lost.'
          : 'Ripristinare tutti i dati di esempio iniziali? Tutte le modifiche locali andranno perse.',
      warningNote: isDe
        ? 'Achtung: Dieser Vorgang überschreibt alle bestehenden Buchungen, Konten, Kategorien und Vorlagen.'
        : isEn
          ? 'Warning: this action completely overwrites existing transactions, accounts, categories, and templates.'
          : 'Attenzione: questa operazione sovrascrive completamente transazioni, conti, categorie e modelli esistenti.',
      actionType: 'RESET',
      confirmText: isDe
        ? 'Demo-Daten laden'
        : isEn
          ? 'Restore Demo Data'
          : 'Ripristina Dati Iniziali',
      cancelText: t.cancelBtn,
      onConfirm: () => {
        setAccounts(DEFAULT_ACCOUNTS);
        setTransactions(DEFAULT_TRANSACTIONS);
        setCategories(DEFAULT_CATEGORIES);
        setRecurring(DEFAULT_RECURRING);
        setBudgets(DEFAULT_BUDGETS);
        setGoals(DEFAULT_GOALS);
        setCategoryRules(DEFAULT_CATEGORY_RULES);
        setFxSettings(DEFAULT_FX_SETTINGS);
        setQuickShortcuts(DEFAULT_QUICK_SHORTCUTS);
        setDebtsCredits(DEFAULT_DEBTS_CREDITS);
        showToast(t.demoRestoredToast);
      },
    });
  };

  // Reconcile and clean transactions / accounts
  const handleReconcileData = (
    updatedTransactions: Transaction[],
    updatedAccounts?: Account[],
    updatedCategories?: string[]
  ) => {
    setTransactions(updatedTransactions);
    localStorage.setItem('myfinance_transactions_v3', JSON.stringify(updatedTransactions));

    if (updatedAccounts && Array.isArray(updatedAccounts)) {
      setAccounts(updatedAccounts);
      localStorage.setItem('myfinance_accounts_v3', JSON.stringify(updatedAccounts));
    }

    if (updatedCategories && Array.isArray(updatedCategories)) {
      setCategories(updatedCategories);
      localStorage.setItem('myfinance_categories_v3', JSON.stringify(updatedCategories));
    }
  };

  // Header Title Label logic
  const bannerTitle = useMemo(() => {
    if (selectedType === 'INCOME') return t.totalIncomeLabel;
    if (selectedType === 'EXPENSE') return t.totalExpenseLabel;
    if (selectedAccount !== 'ALL') return `${t.totalNetWorth} (${selectedAccount})`;
    return t.totalNetWorth;
  }, [selectedType, selectedAccount, t]);

  return (
    <div className="min-h-full flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden selection:bg-indigo-500/30">
      {/* Toast Alert */}
      <Toast message={toastMessage} />

      {/* Header */}
      <Header
        onOpenTransfer={() => setIsTransferModalOpen(true)}
        onApplyAllRecurring={handleApplyAllRecurring}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onPrint={() => setIsPrintModalOpen(true)}
        language={language}
        onLanguageChange={handleLanguageChange}
        t={t}
        zoomLevel={zoomLevel}
        onZoomChange={handleZoomChange}
        securitySettings={securitySettings}
        onOpenAuthModal={() => setIsSecurityModalOpen(true)}
        privacyMode={privacyMode}
        onTogglePrivacyMode={handleTogglePrivacyMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-4 space-y-5 pb-28">
        <RecurringNotificationsBanner
          notifications={autoRecurringNotifications}
          accounts={accounts}
          language={language}
          browserNotifStatus={browserNotifStatus}
          onEnableBrowserNotifications={handleEnableBrowserNotifications}
          onDismissOne={(id) =>
            setAutoRecurringNotifications((prev) => prev.filter((n) => n.id !== id))
          }
          onDismissAll={() => setAutoRecurringNotifications([])}
          onViewTransactions={() => setCurrentTab('transactions')}
        />

        {pendingStatementBanner && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-cyan-950/80 border border-indigo-500/40 shadow-lg flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">
                  {language === 'de'
                    ? `Kontoauszug ${pendingStatementBanner.monthLabel} bereit`
                    : language === 'en'
                      ? `Statement ${pendingStatementBanner.monthLabel} ready`
                      : `Estratto Conto ${pendingStatementBanner.monthLabel} pronto`}
                </p>
                <p className="text-[11px] text-slate-300 truncate">
                  {language === 'de' ? 'Empfänger' : language === 'en' ? 'Recipient' : 'Destinatario'}:{' '}
                  {pendingStatementBanner.recipientEmail}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await sendMonthlyStatementPdfByEmail({
                        monthKey: pendingStatementBanner.monthKey,
                        accounts,
                        balances: overallBalances,
                        transactions,
                        goals,
                        settings: monthlyEmailSettings,
                        securitySettings,
                        language,
                      });
                      setMonthlyEmailSettings(result.updatedSettings);
                      showToast(result.message);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold inline-flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    <span>
                      {language === 'de'
                        ? 'PDF per E-Mail senden'
                        : language === 'en'
                          ? 'Send PDF by Email'
                          : 'Invia PDF via Email'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMonthlyStatementModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 text-[11px] font-semibold"
                  >
                    {language === 'de'
                      ? 'Übersicht / PDF öffnen'
                      : language === 'en'
                        ? 'Open Summary / PDF'
                        : 'Apri Riepilogo / PDF'}
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPendingStatementBanner(null)}
              className="text-slate-400 hover:text-white p-1"
              aria-label={language === 'de' ? 'Hinweis schließen' : language === 'en' ? 'Close notice' : 'Chiudi avviso'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* VIEW 1: Home Tab */}
        {currentTab === 'home' && (
          <div className="space-y-4">
            {/* Overall Balance Banner */}
            <MetricsBanner
              titleLabel={bannerTitle}
              totalBalance={isShowingNetWorthBreakdown ? effectiveNetWorth : displayedTotalBalance}
              realLiquidity={unifiedNetWorth.totalUnified}
              creditsReceivable={debtCreditSummary.totalCredits}
              debtsPayable={debtCreditSummary.totalDebts}
              showNetWorthBreakdown={isShowingNetWorthBreakdown}
              onOpenDebtsCredits={() => {
                setBudgetsSubTab('debts');
                setCurrentTab('budgets');
              }}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              savingsRate={savingsRate}
              dailyAvg={dailyAvg}
              subtext={t.subtextRealtime}
              currencyOverride={
                selectedAccount !== 'ALL'
                  ? accounts.find((a) => a.id === selectedAccount || a.name === selectedAccount)?.currency
                  : undefined
              }
              baseCurrencyCode={fxSettings.baseCurrency}
              hasMultipleCurrencies={selectedAccount === 'ALL' && unifiedNetWorth.hasMultipleCurrencies}
              currencyBreakdown={selectedAccount === 'ALL' ? unifiedNetWorth.breakdown : []}
              onOpenFxSettings={() => setIsFxModalOpen(true)}
              language={language}
              t={t}
            />

            {/* Horizontal Accounts Carousel */}
            <AccountsCarousel
              accounts={accounts}
              balances={overallBalances}
              selectedAccountId={selectedAccount}
              onSelectAccount={(accId) => {
                setSelectedAccount(accId);
                if (accId !== 'ALL') {
                  setCurrentTab('transactions');
                }
              }}
              onManageAccounts={() => setIsAccountsModalOpen(true)}
              t={t}
            />

            {/* Quick Mobile Actions Bar */}
            <section className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingTx(null);
                  setHighlightTxScanner(false);
                  setIsTxModalOpen(true);
                }}
                className="min-h-[60px] p-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850 active:scale-95 transition flex flex-col items-center justify-center gap-1 text-center"
              >
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-semibold text-slate-200 leading-tight">
                  {language === 'de' ? 'Neu' : language === 'en' ? 'New' : 'Nuova'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingTx(null);
                  setHighlightTxScanner(true);
                  setIsTxModalOpen(true);
                }}
                className="min-h-[60px] p-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-850 active:scale-95 transition flex flex-col items-center justify-center gap-1 text-center"
              >
                <Camera className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-semibold text-slate-200 leading-tight">
                  {language === 'de' ? 'Scannen' : language === 'en' ? 'Scan' : 'Scansiona'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsTransferModalOpen(true)}
                className="min-h-[60px] p-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-850 active:scale-95 transition flex flex-col items-center justify-center gap-1 text-center"
              >
                <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-semibold text-slate-200 leading-tight">
                  {language === 'de' ? 'Umbuchen' : language === 'en' ? 'Transfer' : 'Giroconto'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsCsvImportModalOpen(true)}
                className="min-h-[60px] p-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-850 active:scale-95 transition flex flex-col items-center justify-center gap-1 text-center"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-semibold text-slate-200 leading-tight">
                  {language === 'de' ? 'CSV' : language === 'en' ? 'Import' : 'Importa CSV'}
                </span>
              </button>
            </section>

            {/* Quick Favorite 1-Tap Shortcuts (Spese Preferite) */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {language === 'de'
                      ? 'Favoriten (1-Klick)'
                      : language === 'en'
                        ? 'Favorite Quick Log'
                        : 'Spese Preferite (1-Tap)'}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsShortcutsModalOpen(true)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold transition"
                >
                  {language === 'de' ? 'Verwalten' : language === 'en' ? 'Manage' : 'Gestisci'}
                </button>
              </div>

              {quickShortcuts.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setIsShortcutsModalOpen(true)}
                  className="w-full p-3 rounded-2xl bg-slate-900/70 border border-dashed border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition text-center"
                >
                  {language === 'de'
                    ? '+ Favoriten für schnelle Zahlungen hinzufügen'
                    : language === 'en'
                      ? '+ Add 1-tap favorite shortcuts'
                      : '+ Aggiungi scorciatoie rapide per spese quotidiane'}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {quickShortcuts.map((sc) => {
                    const matchedAcc = accounts.find((a) => a.id === sc.account || a.name === sc.account);
                    const isExpense = sc.type === 'EXPENSE';
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => handleExecuteQuickShortcut(sc)}
                        className="min-h-[54px] px-3 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 active:scale-95 transition text-left flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate">
                            {sc.label}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {getCategoryDisplayName(sc.category, language)}
                            {sc.tags && sc.tags.length > 0 ? ` · #${sc.tags[0]}` : ''}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-extrabold tabular-nums flex-shrink-0 ${
                            isExpense ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {isExpense ? '-' : '+'}
                          {formatCurrency(sc.amount, true, matchedAcc?.currency)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Monthly Cashflow Forecast & Budget Alerts */}
            <section className="space-y-2.5">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/90 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <TrendingUp className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <h3 className="text-xs font-bold text-white truncate">
                      {language === 'de'
                        ? 'Monatsend-Prognose'
                        : language === 'en'
                          ? 'End-of-Month Forecast'
                          : 'Previsione Fine Mese'}
                    </h3>
                  </div>
                  <span
                    className={`text-sm font-extrabold tabular-nums flex-shrink-0 ${
                      monthlyForecast.projectedEndBalance >= monthlyForecast.currentUnifiedBalance
                        ? 'text-emerald-400'
                        : 'text-amber-300'
                    }`}
                  >
                    {formatCurrency(
                      monthlyForecast.projectedEndBalance,
                      true,
                      monthlyForecast.baseCurrency
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-slate-400">
                      {language === 'de'
                        ? 'Erwartete Einnahmen'
                        : language === 'en'
                          ? 'Projected Income'
                          : 'Entrate stimate'}
                    </div>
                    <div className="text-emerald-400 font-bold tabular-nums mt-0.5">
                      +{formatCurrency(monthlyForecast.projectedMonthIncome, true, monthlyForecast.baseCurrency)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-slate-400">
                      {language === 'de'
                        ? 'Erwartete Ausgaben'
                        : language === 'en'
                          ? 'Projected Expenses'
                          : 'Spese stimate'}
                    </div>
                    <div className="text-rose-400 font-bold tabular-nums mt-0.5">
                      -{formatCurrency(monthlyForecast.projectedMonthExpense, true, monthlyForecast.baseCurrency)}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  <span>
                    {language === 'de'
                      ? `${monthlyForecast.remainingDays} Tage übrig`
                      : language === 'en'
                        ? `${monthlyForecast.remainingDays} days left`
                        : `${monthlyForecast.remainingDays} gg a fine mese`}
                  </span>
                  <span>·</span>
                  <span>
                    {language === 'de'
                      ? `${monthlyForecast.upcomingRecurringCount} offene Dauerbuchungen`
                      : language === 'en'
                        ? `${monthlyForecast.upcomingRecurringCount} scheduled items`
                        : `${monthlyForecast.upcomingRecurringCount} scadenze attese`}
                  </span>
                  <span>·</span>
                  <span className="tabular-nums text-slate-300">
                    {formatCurrency(monthlyForecast.dailyVariablePace, true, monthlyForecast.baseCurrency)}/
                    {language === 'de' ? 'Tag' : language === 'en' ? 'day' : 'gg'}
                  </span>
                </div>
              </div>

              {(() => {
                const activeAlerts = budgetAlerts.filter((a) => a.status !== 'OK');
                if (activeAlerts.length === 0) return null;
                const exceededCount = activeAlerts.filter((a) => a.status === 'EXCEEDED').length;
                return (
                  <button
                    type="button"
                    onClick={() => setCurrentTab('budgets')}
                    className={`w-full min-h-[48px] p-3.5 rounded-2xl border text-left flex items-center justify-between gap-2.5 transition active:scale-[0.99] ${
                      exceededCount > 0
                        ? 'bg-rose-950/35 border-rose-500/40 text-rose-200 hover:bg-rose-950/50'
                        : 'bg-amber-950/30 border-amber-500/35 text-amber-200 hover:bg-amber-950/45'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <AlertTriangle
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          exceededCount > 0 ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white">
                          {language === 'de'
                            ? `${activeAlerts.length} Budget-Warnung(en)`
                            : language === 'en'
                              ? `${activeAlerts.length} Budget Alert(s)`
                              : `${activeAlerts.length} Allarme Budget`}
                        </div>
                        <div className="text-[11px] opacity-90 truncate mt-0.5">
                          {activeAlerts
                            .slice(0, 2)
                            .map(
                              (a) =>
                                `${getCategoryDisplayName(a.category, language)} (${a.pctUsed.toFixed(0)}%)`
                            )
                            .join(' · ')}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-80" />
                  </button>
                );
              })()}
            </section>

            {/* Scadenzario / Prossime Scadenze */}
            {(() => {
              const scheduledItems = getScheduledRecurringItems(recurring);
              return (
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <CalendarClock className="w-4 h-4 text-amber-400" />
                      <span>
                        {language === 'de'
                          ? 'Fälligkeiten & Termine'
                          : language === 'en'
                            ? 'Upcoming Bills'
                            : 'Scadenzario'}
                      </span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsRecurringModalOpen(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition py-1"
                    >
                      <span>
                        {language === 'de' ? 'Verwalten' : language === 'en' ? 'Manage' : 'Gestisci'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {scheduledItems.length === 0 ? (
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-400">
                        {language === 'de'
                          ? 'Keine fälligen Dauerbuchungen in den nächsten 14 Tagen.'
                          : language === 'en'
                            ? 'No scheduled bills in the next 14 days.'
                            : 'Nessuna scadenza nei prossimi 14 giorni.'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsRecurringModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-indigo-300 flex-shrink-0"
                      >
                        {language === 'de' ? 'Planen' : language === 'en' ? 'Schedule' : 'Pianifica'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {scheduledItems.slice(0, 4).map(({ rule, dueDate, diffDays }) => {
                        const isExpense = rule.type === 'EXPENSE';
                        const isUrgent = diffDays <= 0;
                        return (
                          <div
                            key={rule.id}
                            className="p-3 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-2.5"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className={`p-2 rounded-xl border flex-shrink-0 ${
                                  isUrgent
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                    : 'bg-slate-800 text-indigo-300 border-slate-700'
                                }`}
                              >
                                <CategoryIcon categoryName={rule.category} className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-xs font-semibold text-white truncate">
                                    {rule.description}
                                  </span>
                                  {rule.autoExecute && (
                                    <span
                                      title="Automatico"
                                      className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400 flex-shrink-0"
                                    >
                                      <Zap className="w-3 h-3" />
                                      <span>Auto</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                  <span className={isUrgent ? 'text-amber-300 font-semibold' : 'text-cyan-300'}>
                                    {formatDueStatusLabel(diffDays, language)}
                                  </span>
                                  {' · '}
                                  <span>{dueDate}</span>
                                  {' · '}
                                  <span>{getAccountDisplayName(rule.account, accounts)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span
                                className={`text-xs font-bold tabular-nums ${
                                  isExpense ? 'text-rose-400' : 'text-emerald-400'
                                }`}
                              >
                                {isExpense ? '-' : '+'}
                                {formatCurrency(rule.amount)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleApplyRecurring(rule.id)}
                                className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold flex items-center gap-1 transition active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>
                                  {language === 'de' ? 'Buchen' : language === 'en' ? 'Post' : 'Registra'}
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })()}

            {/* Quick Recent Transactions Section */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <History className="w-4 h-4 text-indigo-400" />
                  {t.recentTransactions}
                </h3>
                <button
                  onClick={() => setCurrentTab('transactions')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
                >
                  <span>{t.viewAll}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {recentTransactions.length === 0 ? (
                  <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 text-center text-xs text-slate-500">
                    {t.noRecentTransactions}
                  </div>
                ) : (
                  recentTransactions.map((tx) => {
                    const isExpense = tx.type === 'EXPENSE';
                    const isTransfer = tx.type === 'TRANSFER';
                    const amountColor = isExpense
                      ? 'text-rose-400'
                      : isTransfer
                      ? 'text-indigo-300'
                      : 'text-emerald-400';
                    const prefix = isExpense ? '-' : isTransfer ? '↺ ' : '+';

                    const catColor = getCategoryColorDetails(tx.category);
                    const catDisplayName = getCategoryDisplayName(tx.category, language);
                    const accLabel = isTransfer
                      ? `${getAccountDisplayName(tx.fromAccount, accounts)} ➔ ${getAccountDisplayName(tx.toAccount, accounts)}`
                      : getAccountDisplayName(tx.account, accounts);

                    return (
                      <div
                        key={tx.id}
                        onClick={() => {
                          setEditingTx(tx);
                          setIsTxModalOpen(true);
                        }}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800/80 hover:bg-slate-850 active:bg-slate-800 transition-all cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden flex-1 min-w-0 mr-2">
                          <div
                            className={`p-2 rounded-xl ${catColor.bgLight} ${catColor.textColor} border ${catColor.borderColor} flex-shrink-0 flex items-center justify-center`}
                          >
                            <CategoryIcon categoryName={tx.category} className="w-4 h-4" />
                          </div>
                          <div className="truncate flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white truncate">
                              {tx.description}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                              <span>{tx.date}</span>
                              <span>•</span>
                              <span className="truncate">{accLabel}</span>
                              {tx.category && (
                                <>
                                  <span>•</span>
                                  <span className={`px-1.5 py-0.2 rounded-md ${catColor.bgLight} ${catColor.textColor} font-semibold truncate border ${catColor.borderColor}`}>
                                    {catDisplayName}
                                  </span>
                                </>
                              )}
                            </div>
                            {tx.tags && tx.tags.length > 0 && (
                              <div className="text-[10px] text-cyan-300/90 mt-0.5 truncate">
                                {tx.tags.map((tg) => `#${tg}`).join(' · ')}
                              </div>
                            )}
                            {tx.notes && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-300 bg-indigo-950/40 border border-indigo-500/20 px-2 py-0.5 rounded-lg truncate max-w-full">
                                <FileText className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                <span className="truncate italic text-slate-300">{tx.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {(() => {
                          const txAccId = isTransfer ? tx.fromAccount : tx.account;
                          const matchedAcc = accounts.find((a) => a.id === txAccId || a.name === txAccId);
                          const txCurr = matchedAcc?.currency;

                          return (
                            <span className={`text-xs font-bold ${amountColor} flex-shrink-0`}>
                              {prefix}
                              {formatCurrency(tx.amount, true, txCurr)}
                            </span>
                          );
                        })()}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: Transactions Tab */}
        {currentTab === 'transactions' && (
          <TransactionsTab
            transactions={filteredTransactions}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            selectedAccount={selectedAccount}
            onAccountChange={setSelectedAccount}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
            availableTags={availableTags}
            accounts={accounts}
            categories={categories}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            onEditTransaction={(tx) => {
              setEditingTx(tx);
              setHighlightTxScanner(false);
              setIsTxModalOpen(true);
            }}
            onDuplicateTransaction={handleDuplicateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
            onOpenCsvImport={() => setIsCsvImportModalOpen(true)}
            language={language}
            t={t}
          />
        )}

        {/* VIEW 3: Budgets, Goals & Debts Tab */}
        {currentTab === 'budgets' && (
          <BudgetsGoalsTab
            budgets={budgets}
            monthlyExpenses={monthlyExpenses}
            budgetAlerts={budgetAlerts}
            baseCurrency={fxSettings.baseCurrency}
            goals={goals}
            debtsCredits={debtsCredits}
            accounts={accounts}
            fxSettings={fxSettings}
            activeSubTab={budgetsSubTab}
            onSubTabChange={setBudgetsSubTab}
            onOpenAddDebtCredit={() => {
              setEditingDebtCredit(null);
              setIsDebtCreditModalOpen(true);
            }}
            onEditDebtCredit={(entry) => {
              setEditingDebtCredit(entry);
              setIsDebtCreditModalOpen(true);
            }}
            onDeleteDebtCredit={handleDeleteDebtCredit}
            onRecordDebtCreditPayment={handleRecordDebtCreditPayment}
            onReopenDebtCredit={handleReopenDebtCredit}
            onOpenEditBudgets={() => setIsBudgetModalOpen(true)}
            onOpenAddGoal={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
            onEditGoal={(goal) => {
              setEditingGoal(goal);
              setIsGoalModalOpen(true);
            }}
            onDeleteGoal={handleDeleteGoal}
            onDepositToGoal={handleDepositToGoal}
            onShowToast={showToast}
            language={language}
            t={t}
          />
        )}

        {/* VIEW 4: Analytics Tab */}
        {currentTab === 'analytics' && (
          <AnalyticsTab
            accounts={accounts}
            balances={overallBalances}
            transactions={transactions}
            fxSettings={fxSettings}
            privacyMode={privacyMode}
            language={language}
            t={t}
          />
        )}

        {/* VIEW 5: AI Chat Tab */}
        {currentTab === 'ai' && (
          <AiChatTab
            accounts={accounts}
            balances={overallBalances}
            transactions={transactions}
            categories={categories}
            budgets={budgets}
            goals={goals}
            recurring={recurring}
            userName={[securitySettings.firstName, securitySettings.lastName]
              .filter(Boolean)
              .join(' ')}
            onAddTransaction={handleSaveTransaction}
            onShowToast={showToast}
            language={language}
            t={t}
          />
        )}

        {/* VIEW 6: Settings Tab */}
        {currentTab === 'settings' && (
          <SettingsTab
            accounts={accounts}
            balances={overallBalances}
            transactions={transactions}
            categories={categories}
            goals={goals}
            onOpenAccounts={() => setIsAccountsModalOpen(true)}
            onOpenCategories={() => setIsCategoriesModalOpen(true)}
            onOpenRecurring={() => setIsRecurringModalOpen(true)}
            onOpenFxSettings={() => setIsFxModalOpen(true)}
            fxSettings={fxSettings}
            onOpenRules={() => setIsRulesModalOpen(true)}
            rulesCount={categoryRules.filter((r) => r.enabled).length}
            onReconcileData={handleReconcileData}
            recurring={recurring}
            onApplyRecurring={handleApplyRecurring}
            onOpenApkModal={() => setIsApkModalOpen(true)}
            onExportJson={handleExportJson}
            onCopyBackupJson={handleCopyBackupJson}
            onExportCsv={handleExportCsv}
            onOpenCsvImport={() => setIsCsvImportModalOpen(true)}
            onImportJson={handleImportJson}
            onShowToast={showToast}
            storageStats={storageStats}
            onRequestPersistence={handleRequestPersistence}
            language={language}
            onLanguageChange={handleLanguageChange}
            t={t}
            getBackupPayload={getBackupData}
            securitySettings={securitySettings}
            onUpdateSecuritySettings={(newSec) => {
              setSecuritySettings(newSec);
            }}
            onLockNow={handleLockNow}
            onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
            onOpenMonthlyStatement={() => setIsMonthlyStatementModalOpen(true)}
            onOpenPrivacyPolicy={() => setIsPrivacyModalOpen(true)}
            monthlyEmailSettings={monthlyEmailSettings}
          />
        )}

        {/* Footer Copyright */}
        {currentTab !== 'settings' && currentTab !== 'ai' && (
          <CopyrightFooter
            variant="minimal"
            className="pt-2"
            onOpenPrivacyPolicy={() => setIsPrivacyModalOpen(true)}
          />
        )}
      </main>

      {/* Floating Action Button (FAB) */}
      {currentTab !== 'ai' && (
        <button
          onClick={() => {
            setEditingTx(null);
            setHighlightTxScanner(false);
            setIsTxModalOpen(true);
          }}
          title={t.newTransactionBtn}
          className="fixed right-5 bottom-20 z-40 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full shadow-2xl text-white flex items-center justify-center active:scale-90 transition-transform no-print hover:brightness-110"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Bottom Navigation Bar */}
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} t={t} />

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
          setHighlightTxScanner(false);
        }}
        accounts={accounts}
        categories={categories}
        categoryRules={categoryRules}
        availableTags={availableTags}
        editingTransaction={editingTx}
        onSave={handleSaveTransaction}
        language={language}
        t={t}
        highlightScanner={highlightTxScanner}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={accounts}
        fxSettings={fxSettings}
        onTransfer={handleInitiateTransfer}
        language={language}
        t={t}
      />

      <AccountsModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
        accounts={accounts}
        onSaveAccount={handleSaveAccount}
        onDeleteAccount={handleDeleteAccount}
        language={language}
        t={t}
      />

      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
        onCategoryIconChange={() => {
          setCategoryVisualVersion((v) => v + 1);
          showToast(
            language === 'de'
              ? 'Kategorie aktualisiert!'
              : language === 'en'
                ? 'Category updated!'
                : 'Categoria aggiornata!'
          );
        }}
        language={language}
        t={t}
      />

      <RecurringModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        recurring={recurring}
        accounts={accounts}
        categories={categories}
        onSaveRecurring={handleSaveRecurring}
        onDeleteRecurring={handleDeleteRecurring}
        onApplyRecurring={handleApplyRecurring}
        onApplyAll={handleApplyAllRecurring}
        notificationsEnabled={recurringNotifEnabled}
        onToggleNotifications={handleToggleRecurringNotifications}
        browserNotifStatus={browserNotifStatus}
        onEnableBrowserNotifications={handleEnableBrowserNotifications}
        language={language}
        t={t}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        categories={categories}
        budgets={budgets}
        onSaveBudgets={(newBudgets) => {
          setBudgets(newBudgets);
          showToast(
            language === 'de'
              ? 'Monatsbudgets gespeichert!'
              : language === 'en'
              ? 'Monthly budgets saved!'
              : 'Budget mensili salvati!'
          );
        }}
        language={language}
        t={t}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        editingGoal={editingGoal}
        onSaveGoal={handleSaveGoal}
        language={language}
        t={t}
      />

      <ApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        onShowToast={showToast}
        storageStats={storageStats}
        onRequestPersistence={handleRequestPersistence}
        onExportJson={handleExportJson}
        language={language}
      />

      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        accounts={accounts}
        balances={overallBalances}
        transactions={transactions}
        goals={goals}
        onShowToast={showToast}
        language={language}
        t={t}
      />

      <CsvImportModal
        isOpen={isCsvImportModalOpen}
        onClose={() => setIsCsvImportModalOpen(false)}
        accounts={accounts}
        categories={categories}
        categoryRules={categoryRules}
        existingTransactions={transactions}
        onImportTransactions={handleImportTransactions}
        onShowToast={showToast}
        language={language}
      />

      <FxRatesModal
        isOpen={isFxModalOpen}
        onClose={() => setIsFxModalOpen(false)}
        fxSettings={fxSettings}
        onSaveFxSettings={(next) => {
          setFxSettings(next);
          showToast(
            language === 'de'
              ? `Basiswährung ${next.baseCurrency} gespeichert!`
              : language === 'en'
                ? `Base currency ${next.baseCurrency} saved!`
                : `Valuta base ${next.baseCurrency} e tassi salvati!`
          );
        }}
        onShowToast={showToast}
        language={language}
      />

      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        rules={categoryRules}
        categories={categories}
        onSaveRule={handleSaveRule}
        onDeleteRule={handleDeleteRule}
        onToggleRule={handleToggleRule}
        onApplyToHistory={handleApplyRulesToHistory}
        language={language}
      />

      <QuickShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        shortcuts={quickShortcuts}
        accounts={accounts}
        categories={categories}
        onSaveShortcuts={setQuickShortcuts}
        onShowToast={showToast}
        language={language}
      />

      <DebtsCreditsModal
        isOpen={isDebtCreditModalOpen}
        onClose={() => {
          setIsDebtCreditModalOpen(false);
          setEditingDebtCredit(null);
        }}
        editingEntry={editingDebtCredit}
        accounts={accounts}
        defaultCurrency={fxSettings.baseCurrency}
        onSave={handleSaveDebtCredit}
        language={language}
      />

      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onSettingsUpdated={(newSettings) => {
          setSecuritySettings(newSettings);
          setMonthlyEmailSettings(getMonthlyEmailSettings());
        }}
        onLockNow={() => {
          setIsSecurityModalOpen(false);
          handleLockNow();
        }}
        onShowToast={showToast}
        language={language}
        t={t}
      />

      <MonthlyStatementModal
        isOpen={isMonthlyStatementModalOpen}
        onClose={() => {
          setIsMonthlyStatementModalOpen(false);
          setMonthlyEmailSettings(getMonthlyEmailSettings());
        }}
        accounts={accounts}
        balances={overallBalances}
        transactions={transactions}
        goals={goals}
        securitySettings={securitySettings}
        onShowToast={showToast}
        onSettingsUpdated={(next) => setMonthlyEmailSettings(next)}
        language={language}
        initialMonthKey={pendingStatementBanner?.monthKey}
      />

      {/* Confirmation Warning Dialog Before Executing Actions */}
      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        warningNote={confirmModal.warningNote}
        actionType={confirmModal.actionType}
        details={confirmModal.details}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        language={language}
      />

      {/* Full-Screen First-Launch Registration & Security Lock Screen */}
      {showAuthGate && (
        <LockScreen
          settings={securitySettings}
          onUnlockSuccess={handleUnlockSuccess}
          onOpenPrivacyPolicy={() => setIsPrivacyModalOpen(true)}
          language={language}
          onLanguageChange={handleLanguageChange}
          t={t}
        />
      )}

      {/* Privacy Policy Modal (accessible both in-app and from LockScreen) */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        language={language}
        onShowToast={showToast}
      />
    </div>
  );
}
