import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Bot,
  User,
  AlertCircle,
  RefreshCw,
  Server,
  Cloud,
  Cpu,
  Check,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Camera,
  Mic,
  MicOff,
  Loader2,
} from 'lucide-react';
import {
  Account,
  Goal,
  ProposedTransactionAction,
  RecurringMovement,
  Transaction,
} from '../types/finance';
import { formatCurrency, getCurrencyCode } from '../utils/formatters';
import { generateOfflineFinancialReply } from '../utils/offlineFinancialAssistant';
import { scanReceiptWithAi } from '../utils/receiptScanner';
import { Language, Translations, getCategoryDisplayName } from '../utils/translations';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: 'cloud' | 'offline';
  proposedTransaction?: ProposedTransactionAction;
  actionStatus?: 'pending' | 'saved' | 'dismissed';
  isError?: boolean;
}

interface AiChatTabProps {
  accounts: Account[];
  balances: Record<string, number>;
  transactions: Transaction[];
  budgets: Record<string, number>;
  goals: Goal[];
  recurring: RecurringMovement[];
  categories: string[];
  userName?: string;
  language: Language;
  t: Translations;
  onAddTransaction: (tx: ProposedTransactionAction) => void;
  onShowToast: (msg: string) => void;
}

const CHAT_STORAGE_KEY = 'myfinance_ai_chat_history_v1';
const REMOTE_SERVER_URL_KEY = 'myfinance_ai_server_url_v1';

function isLocalStandaloneRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const proto = window.location.protocol;
  return proto === 'file:' || proto === 'capacitor:' || proto === 'ionic:' || proto === 'app:';
}

function normalizeServerBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

function renderFormattedInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function FormattedMessageText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={i} className="h-1" />;
        }
        if (/^[-*•]\s+/.test(trimmed)) {
          const itemText = trimmed.replace(/^[-*•]\s+/, '');
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="text-indigo-400 mt-0.5 select-none">•</span>
              <span className="flex-1">{renderFormattedInline(itemText)}</span>
            </div>
          );
        }
        if (/^\d+\.\s+/.test(trimmed)) {
          return (
            <div key={i} className="pl-1">
              {renderFormattedInline(trimmed)}
            </div>
          );
        }
        return <p key={i}>{renderFormattedInline(line)}</p>;
      })}
    </div>
  );
}

export const AiChatTab: React.FC<AiChatTabProps> = ({
  accounts,
  balances,
  transactions,
  budgets,
  goals,
  recurring,
  categories,
  userName,
  language,
  onAddTransaction,
  onShowToast,
}) => {
  const isDe = language === 'de';
  const isEn = language === 'en';

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(-40);
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  const [remoteServerUrl, setRemoteServerUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(REMOTE_SERVER_URL_KEY) || '';
    } catch {
      return '';
    }
  });
  const [serverUrlDraft, setServerUrlDraft] = useState<string>(remoteServerUrl);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverSavedBadge, setServerSavedBadge] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [cloudReachable, setCloudReachable] = useState<boolean>(
    () => !isLocalStandaloneRuntime() || Boolean(remoteServerUrl.trim())
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const receiptInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // ignore storage errors
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const financialContext = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const accountSummaries = accounts.map((acc) => ({
      name: acc.name,
      currency: getCurrencyCode(acc.currency),
      balance: Number((balances[acc.id] ?? 0).toFixed(2)),
    }));

    const currencyTotals: Record<
      string,
      { balance: number; monthIncome: number; monthExpense: number; monthNet: number }
    > = {};

    const ensureCurrency = (code: string) => {
      if (!currencyTotals[code]) {
        currencyTotals[code] = { balance: 0, monthIncome: 0, monthExpense: 0, monthNet: 0 };
      }
      return currencyTotals[code];
    };

    accountSummaries.forEach((acc) => {
      ensureCurrency(acc.currency).balance += acc.balance;
    });

    const categorySpendThisMonth: Record<string, Record<string, number>> = {};
    const overallCategorySpendThisMonth: Record<string, number> = {};

    const monthTransactions = transactions.filter((tx) => tx.date.startsWith(currentMonthKey));
    monthTransactions.forEach((tx) => {
      const accKey = tx.type === 'TRANSFER' ? tx.fromAccount : tx.account;
      const matched = accounts.find((a) => a.id === accKey || a.name === accKey);
      const code = getCurrencyCode(matched?.currency);
      const bucket = ensureCurrency(code);
      const amt = Number(tx.amount) || 0;

      if (tx.type === 'INCOME') {
        bucket.monthIncome += amt;
        bucket.monthNet += amt;
      } else if (tx.type === 'EXPENSE') {
        bucket.monthExpense += amt;
        bucket.monthNet -= amt;
        const catName = getCategoryDisplayName(tx.category || 'Altro', language);
        if (!categorySpendThisMonth[code]) categorySpendThisMonth[code] = {};
        categorySpendThisMonth[code][catName] =
          (categorySpendThisMonth[code][catName] || 0) + amt;
        overallCategorySpendThisMonth[tx.category] =
          (overallCategorySpendThisMonth[tx.category] || 0) + amt;
      }
    });

    const budgetSummary = Object.entries(budgets).map(([cat, limit]) => {
      const spent = overallCategorySpendThisMonth[cat] || 0;
      return {
        category: getCategoryDisplayName(cat, language),
        limit,
        spentThisMonth: Number(spent.toFixed(2)),
        percentUsed: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      };
    });

    const goalSummary = goals.map((g) => ({
      title: g.title,
      current: g.current,
      target: g.target,
      percent: g.target > 0 ? Math.round((g.current / g.target) * 100) : 0,
      targetDate: g.targetDate || null,
    }));

    const recurringSummary = recurring.map((r) => {
      const matched = accounts.find((a) => a.id === r.account || a.name === r.account);
      return {
        description: r.description,
        type: r.type,
        amount: r.amount,
        currency: getCurrencyCode(matched?.currency),
        category: getCategoryDisplayName(r.category, language),
        account: matched?.name || r.account,
      };
    });

    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 35)
      .map((tx) => {
        const accKey = tx.type === 'TRANSFER' ? tx.fromAccount : tx.account;
        const matched = accounts.find((a) => a.id === accKey || a.name === accKey);
        return {
          date: tx.date,
          type: tx.type,
          amount: tx.amount,
          currency: getCurrencyCode(matched?.currency),
          category: getCategoryDisplayName(tx.category || '', language),
          description: tx.description,
          account: matched?.name || tx.account || tx.fromAccount || '',
        };
      });

    return {
      userName: userName || undefined,
      todayDate: now.toISOString().slice(0, 10),
      currentMonth: currentMonthKey,
      availableCategories: categories,
      accounts: accountSummaries,
      totalsByCurrency: currencyTotals,
      monthTransactionsCount: monthTransactions.length,
      totalTransactionsCount: transactions.length,
      categorySpendThisMonth,
      budgets: budgetSummary,
      goals: goalSummary,
      recurringMovements: recurringSummary,
      recentTransactions,
    };
  }, [accounts, balances, transactions, budgets, goals, recurring, categories, userName, language]);

  const suggestedPrompts = useMemo(() => {
    if (isDe) {
      return [
        'Buche 18,50€ Mittagessen heute',
        'Analysiere meine Ausgaben in diesem Monat',
        'Wie kann ich mehr Geld sparen?',
        'Übersicht meiner Konten und Währungen',
      ];
    }
    if (isEn) {
      return [
        'Log $18.50 lunch expense today',
        'Analyze my expenses this month',
        'How can I save more based on my spending?',
        'Summary of my accounts and currencies',
      ];
    }
    return [
      'Segna 18,50 € di pranzo oggi',
      'Analizza le mie spese di questo mese',
      'Dove posso risparmiare in base ai miei movimenti?',
      'Riepilogo dei miei conti e valute',
    ];
  }, [isDe, isEn]);

  const normalizeProposedTx = (raw: ProposedTransactionAction): ProposedTransactionAction => {
    const matchedAcc =
      accounts.find((a) => a.name.toLowerCase() === (raw.account || '').toLowerCase()) ||
      accounts[0];
    const matchedCat =
      categories.find((c) => c.toLowerCase() === (raw.category || '').toLowerCase()) ||
      categories[0] ||
      raw.category ||
      'Altro';
    return {
      type: raw.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
      amount: Math.abs(Number(raw.amount) || 0),
      description: (raw.description || '').trim() || (raw.type === 'INCOME' ? 'Entrata' : 'Spesa'),
      category: matchedCat,
      account: matchedAcc?.name || raw.account || '',
      date: /^\d{4}-\d{2}-\d{2}$/.test(raw.date || '')
        ? raw.date
        : new Date().toISOString().slice(0, 10),
      notes: raw.notes,
    };
  };

  const handleSaveServerUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = normalizeServerBaseUrl(serverUrlDraft);
    setRemoteServerUrl(cleaned);
    setServerUrlDraft(cleaned);
    try {
      if (cleaned) {
        localStorage.setItem(REMOTE_SERVER_URL_KEY, cleaned);
      } else {
        localStorage.removeItem(REMOTE_SERVER_URL_KEY);
      }
    } catch {
      // ignore
    }
    setCloudReachable(!isLocalStandaloneRuntime() || Boolean(cleaned));
    setServerSavedBadge(true);
    setTimeout(() => setServerSavedBadge(false), 2000);
  };

  const updateDraftField = <K extends keyof ProposedTransactionAction>(
    msgId: string,
    field: K,
    value: ProposedTransactionAction[K]
  ) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.proposedTransaction
          ? {
              ...m,
              proposedTransaction: {
                ...m.proposedTransaction,
                [field]: value,
              },
            }
          : m
      )
    );
  };

  const handleConfirmProposal = (msgId: string) => {
    const target = messages.find((m) => m.id === msgId);
    if (!target?.proposedTransaction || target.actionStatus === 'saved') return;

    const cleanTx = normalizeProposedTx(target.proposedTransaction);
    onAddTransaction(cleanTx);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, proposedTransaction: cleanTx, actionStatus: 'saved' } : m
      )
    );
    onShowToast(
      isDe
        ? `Buchung "${cleanTx.description}" gespeichert!`
        : isEn
          ? `Transaction "${cleanTx.description}" saved!`
          : `Movimento "${cleanTx.description}" salvato!`
    );
  };

  const handleDismissProposal = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, actionStatus: 'dismissed' } : m))
    );
  };

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputValue('');
    setIsLoading(true);

    const cleanedRemote = normalizeServerBaseUrl(remoteServerUrl);
    const shouldSkipCloudFetch =
      !isOnline || (isLocalStandaloneRuntime() && !cleanedRemote);

    if (!shouldSkipCloudFetch) {
      const endpoint = cleanedRemote ? `${cleanedRemote}/api/ai/chat` : '/api/ai/chat';
      try {
        const apiMessages = nextMessages
          .filter((m) => !m.isError)
          .slice(-18)
          .map((m) => ({ role: m.role, text: m.text }));

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            messages: apiMessages,
            financialContext,
            language,
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');
        const data = isJson ? await res.json() : null;

        if (res.ok && isJson && data?.reply) {
          setCloudReachable(true);
          const proposedTx = data.proposedTransaction
            ? normalizeProposedTx(data.proposedTransaction)
            : undefined;
          setMessages((prev) => [
            ...prev,
            {
              id: `ai_${Date.now()}`,
              role: 'assistant',
              text: String(data.reply).trim(),
              timestamp: new Date().toISOString(),
              source: 'cloud',
              proposedTransaction: proposedTx,
              actionStatus: proposedTx ? 'pending' : undefined,
            },
          ]);
          setIsLoading(false);
          return;
        }

        if (isJson && data?.error && res.status !== 404) {
          setMessages((prev) => [
            ...prev,
            {
              id: `err_${Date.now()}`,
              role: 'assistant',
              text: data.error,
              timestamp: new Date().toISOString(),
              isError: true,
            },
          ]);
          setIsLoading(false);
          return;
        }
      } catch {
        // Fallback seamlessly to local analyzer
      }
    }

    setCloudReachable(false);
    const offlineResult = generateOfflineFinancialReply({
      question: trimmed,
      accounts,
      balances,
      transactions,
      budgets,
      goals,
      recurring,
      categories,
      userName,
      language,
    });

    const proposedTx = offlineResult.proposedTransaction
      ? normalizeProposedTx(offlineResult.proposedTransaction)
      : undefined;

    setMessages((prev) => [
      ...prev,
      {
        id: `local_${Date.now()}`,
        role: 'assistant',
        text: offlineResult.text,
        timestamp: new Date().toISOString(),
        source: 'offline',
        proposedTransaction: proposedTx,
        actionStatus: proposedTx ? 'pending' : undefined,
      },
    ]);
    setIsLoading(false);
  };

  const handleClearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleRetryLast = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg || isLoading) return;
    setMessages((prev) => {
      const cleaned = prev.filter((m, idx) => !(idx === prev.length - 1 && m.isError));
      return cleaned.slice(0, -1);
    });
    sendMessage(lastUserMsg.text);
  };

  const handleToggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
    };

    const SpeechCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechCtor) {
      onShowToast(
        isDe
          ? 'Spracheingabe wird von diesem Browser/WebView nicht unterstützt.'
          : isEn
            ? 'Voice input is not supported in this browser/WebView.'
            : 'Dettatura vocale non supportata su questo browser o WebView.'
      );
      return;
    }

    try {
      const rec = new SpeechCtor();
      rec.lang = isDe ? 'de-DE' : isEn ? 'en-US' : 'it-IT';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript.trim()) {
          setInputValue((prev) => (prev.trim() ? `${prev.trim()} ${transcript.trim()}` : transcript.trim()));
        }
      };
      rec.onerror = () => {
        setIsListening(false);
      };
      rec.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = rec;
      setIsListening(true);
      rec.start();
    } catch {
      setIsListening(false);
      onShowToast(
        isDe
          ? 'Mikrofon konnte nicht gestartet werden.'
          : isEn
            ? 'Could not start microphone.'
            : 'Impossibile avviare il microfono.'
      );
    }
  };

  const handleScanReceiptFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_receipt_${Date.now()}`,
      role: 'user',
      text: isDe
        ? `Beleg-Scan: ${file.name}`
        : isEn
          ? `Receipt scan: ${file.name}`
          : `Scansione scontrino: ${file.name}`,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const scanRes = await scanReceiptWithAi({
        file,
        accounts,
        categories,
        language,
      });
      setCloudReachable(true);
      const cleanProposal = normalizeProposedTx(scanRes.proposedTransaction);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_receipt_${Date.now()}`,
          role: 'assistant',
          text:
            scanRes.reply ||
            (isDe
              ? 'Beleg erkannt! Prüfe die Felder und speichere.'
              : isEn
                ? 'Receipt scanned! Review and save below.'
                : 'Scontrino analizzato! Controlla i dati qui sotto e conferma.'),
          timestamp: new Date().toISOString(),
          source: 'cloud',
          proposedTransaction: cleanProposal,
          actionStatus: 'pending',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_receipt_${Date.now()}`,
          role: 'assistant',
          text:
            err instanceof Error
              ? err.message
              : isDe
                ? 'Fehler beim Scannen des Belegs.'
                : isEn
                  ? 'Receipt scanning failed.'
                  : 'Impossibile leggere lo scontrino.',
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-3 pb-6">
      {/* Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm font-bold text-white truncate">
                  {isDe
                    ? 'KI-Finanzassistent'
                    : isEn
                      ? 'AI Financial Assistant'
                      : 'Assistente Finanziario AI'}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${
                    cloudReachable && isOnline
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  {cloudReachable && isOnline ? (
                    <>
                      <Cloud className="w-2.5 h-2.5" />
                      <span>Cloud</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-2.5 h-2.5" />
                      <span>{isDe ? 'Lokal APK' : isEn ? 'Local APK' : 'Locale APK'}</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {isDe
                  ? `${accounts.length} Konten • ${transactions.length} Buchungen • Schnellerfassung aktiv`
                  : isEn
                    ? `${accounts.length} accounts • ${transactions.length} transactions • Quick-add enabled`
                    : `${accounts.length} conti • ${transactions.length} movimenti • Inserimento rapido attivo`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowServerConfig((v) => !v)}
              className={`p-2 rounded-xl border text-xs transition-colors ${
                showServerConfig
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={
                isDe
                  ? 'Server-URL für APK konfigurieren'
                  : isEn
                    ? 'Configure Server URL for APK'
                    : 'Configura URL Server per APK'
              }
            >
              <Server className="w-3.5 h-3.5" />
            </button>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearChat}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                title={isDe ? 'Chat löschen' : isEn ? 'Clear chat' : 'Nuova chat'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDe ? 'Neu' : isEn ? 'New' : 'Nuova'}</span>
              </button>
            )}
          </div>
        </div>

        {showServerConfig && (
          <form
            onSubmit={handleSaveServerUrl}
            className="pt-2.5 border-t border-slate-800 space-y-2"
          >
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isDe
                ? 'In der Offline-APK arbeitet der Assistent automatisch lokal auf dem Gerät. Optional: Trage hier die URL deines veröffentlichten MyFinance-Servers ein, um auch die Cloud-KI in der APK zu nutzen.'
                : isEn
                  ? 'Inside an offline HTML/APK, the assistant automatically works locally on-device. Optionally enter your deployed MyFinance server URL to also enable Cloud AI inside the APK.'
                  : 'Nell’APK offline da file HTML l’assistente lavora automaticamente in locale sul dispositivo. Facoltativo: inserisci l’URL del tuo server MyFinance pubblicato per collegare anche l’AI Cloud nell’APK.'}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={serverUrlDraft}
                onChange={(e) => setServerUrlDraft(e.target.value)}
                placeholder="https://tuo-server-myfinance.run.app"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1"
              >
                {serverSavedBadge ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{isDe ? 'Gespeichert' : isEn ? 'Saved' : 'Salvato'}</span>
                  </>
                ) : (
                  <span>{isDe ? 'Speichern' : isEn ? 'Save' : 'Salva'}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Mode info when running in local standalone/APK mode */}
      {!cloudReachable && (
        <div className="bg-cyan-950/35 border border-cyan-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-cyan-200 text-xs">
          <Cpu className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
          <p>
            {isDe
              ? 'Lokaler APK-/Offline-Modus aktiv: Analysen und schnelle Buchungserfassung laufen direkt auf deinem Gerät.'
              : isEn
                ? 'Local APK / offline mode active: financial insights and quick expense entry run directly on your device.'
                : 'Modalità APK / Offline locale attiva: analisi e inserimento rapido movimenti funzionano direttamente sul dispositivo.'}
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 min-h-[340px] max-h-[54vh] overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="py-4 space-y-4">
            <div className="text-center space-y-1.5 px-2">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">
                {userName
                  ? isDe
                    ? `Hallo ${userName}, wie kann ich dir helfen?`
                    : isEn
                      ? `Hi ${userName}, how can I help with your finances?`
                      : `Ciao ${userName}, come posso aiutarti oggi?`
                  : isDe
                    ? 'Wie kann ich dir bei deinen Finanzen helfen?'
                    : isEn
                      ? 'How can I help with your finances today?'
                      : 'Come posso aiutarti con le tue finanze oggi?'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isDe
                  ? 'Frage nach Analysen oder schreibe z.B. "Buche 18,50€ Mittagessen heute", um sofort eine Buchung anzulegen.'
                  : isEn
                    ? 'Ask for financial insights or write e.g. "Log $18.50 lunch today" to quickly create a transaction.'
                    : 'Chiedi analisi o scrivi es. "Segna 18,50 € di pranzo oggi" per registrare un movimento al volo.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={isLoading}
                  className="text-left px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 text-xs text-slate-200 transition-colors flex items-center justify-between gap-2"
                >
                  <span>{prompt}</span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const draft = msg.proposedTransaction;
            const matchedAcc = draft
              ? accounts.find((a) => a.name === draft.account) || accounts[0]
              : undefined;
            const draftCurr = getCurrencyCode(matchedAcc?.currency);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      msg.isError
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}
                  >
                    {msg.isError ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : msg.isError
                        ? 'bg-rose-950/50 border border-rose-500/40 text-rose-200 rounded-tl-sm'
                        : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-sm'
                  }`}
                >
                  {isUser ? (
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <>
                      <FormattedMessageText text={msg.text} />

                      {/* Operational Proposed Transaction Card */}
                      {draft && msg.actionStatus !== 'dismissed' && (
                        <div className="mt-2.5 p-3 rounded-xl bg-slate-950/90 border border-indigo-500/40 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                                draft.type === 'INCOME'
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {draft.type === 'INCOME' ? (
                                <ArrowDownLeft className="w-3 h-3" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3" />
                              )}
                              <span>
                                {draft.type === 'INCOME'
                                  ? isDe
                                    ? 'Einnahme'
                                    : isEn
                                      ? 'Income'
                                      : 'Entrata'
                                  : isDe
                                    ? 'Ausgabe'
                                    : isEn
                                      ? 'Expense'
                                      : 'Uscita'}
                              </span>
                            </span>
                            <span className="text-sm font-black text-white">
                              {draft.type === 'INCOME' ? '+' : '-'}
                              {formatCurrency(draft.amount, true, draftCurr)}
                            </span>
                          </div>

                          {msg.actionStatus === 'saved' ? (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-2.5 py-2">
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                              <span>
                                {isDe
                                  ? 'Buchung gespeichert!'
                                  : isEn
                                    ? 'Transaction saved!'
                                    : 'Movimento salvato!'}
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                <input
                                  type="text"
                                  value={draft.description}
                                  onChange={(e) =>
                                    updateDraftField(msg.id, 'description', e.target.value)
                                  }
                                  className="col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none focus:border-indigo-500"
                                />
                                <select
                                  value={draft.account}
                                  onChange={(e) =>
                                    updateDraftField(msg.id, 'account', e.target.value)
                                  }
                                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200"
                                >
                                  {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.name}>
                                      {acc.name} ({getCurrencyCode(acc.currency)})
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={draft.category}
                                  onChange={(e) =>
                                    updateDraftField(msg.id, 'category', e.target.value)
                                  }
                                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-indigo-300"
                                >
                                  {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                      {getCategoryDisplayName(cat, language)}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={draft.amount}
                                  onChange={(e) =>
                                    updateDraftField(
                                      msg.id,
                                      'amount',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-bold"
                                />
                                <input
                                  type="date"
                                  value={draft.date}
                                  onChange={(e) =>
                                    updateDraftField(msg.id, 'date', e.target.value)
                                  }
                                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300"
                                />
                              </div>

                              <div className="flex gap-1.5 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleDismissProposal(msg.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                                >
                                  {isDe ? 'Verwerfen' : isEn ? 'Dismiss' : 'Annulla'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmProposal(msg.id)}
                                  disabled={!draft.amount || draft.amount <= 0}
                                  className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[11px] font-bold inline-flex items-center justify-center gap-1 shadow-md"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>
                                    {isDe
                                      ? 'Bestätigen & Speichern'
                                      : isEn
                                        ? 'Confirm & Save'
                                        : 'Conferma e Salva'}
                                  </span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {msg.source === 'offline' && (
                        <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center gap-1 text-[10px] text-cyan-300/90">
                          <Cpu className="w-3 h-3" />
                          <span>
                            {isDe
                              ? 'Lokale Analyse auf dem Gerät'
                              : isEn
                                ? 'On-device offline analysis'
                                : 'Analisi locale sul dispositivo'}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {msg.isError && (
                    <button
                      type="button"
                      onClick={handleRetryLast}
                      className="mt-2 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 text-[11px] font-semibold inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{isDe ? 'Erneut versuchen' : isEn ? 'Retry' : 'Riprova'}</span>
                    </button>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
              <span
                className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(inputValue);
        }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-end gap-1.5 shadow-lg"
      >
        <input
          ref={receiptInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleScanReceiptFile}
        />
        <button
          type="button"
          disabled={isLoading}
          onClick={() => receiptInputRef.current?.click()}
          title={
            isDe
              ? 'Beleg oder Rechnung scannen (Foto/PDF)'
              : isEn
                ? 'Scan receipt or invoice (Photo/PDF)'
                : 'Scansiona scontrino o fattura (Foto/PDF)'
          }
          className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-40 border border-slate-700 text-cyan-300 flex items-center justify-center transition active:scale-95 flex-shrink-0"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={handleToggleVoice}
          title={
            isDe
              ? 'Spracheingabe'
              : isEn
                ? 'Voice input'
                : 'Dettatura vocale'
          }
          className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition active:scale-95 flex-shrink-0 ${
            isListening
              ? 'bg-rose-600/25 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
              : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <textarea
          rows={1}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(inputValue);
            }
          }}
          placeholder={
            isListening
              ? isDe
                ? 'Ich höre zu...'
                : isEn
                  ? 'Listening...'
                  : 'Sto ascoltando...'
              : isDe
                ? 'Frage etwas oder z.B. "20€ Einkauf"...'
                : isEn
                  ? 'Ask or log e.g. "$20 groceries today"...'
                  : 'Scrivi, detta o scansiona scontrino...'
          }
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 px-2 py-2.5 resize-none focus:outline-none max-h-28 min-w-0"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors flex-shrink-0"
          aria-label={isDe ? 'Senden' : isEn ? 'Send' : 'Invia'}
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">{isDe ? 'Senden' : isEn ? 'Send' : 'Invia'}</span>
        </button>
      </form>
    </div>
  );
};
