import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileDown,
  FileText,
  PieChart,
  Wallet,
  CheckCircle2,
  Copy,
  Sparkles,
  Info,
  Calendar,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';
import { Account, Goal, Transaction } from '../types/finance';
import { formatCurrency, formatDateEuropean } from '../utils/formatters';
import { MyFinanceIcon } from './MyFinanceIcon';
import {
  Language,
  Translations,
  formatLocalizedMonthYear,
  getCategoryDisplayName,
} from '../utils/translations';
import {
  generateMonthlyReportPdf,
  generateTransactionsStatementPdf,
  generateAccountsBalancePdf,
} from '../utils/pdfGenerator';
import {
  printHtmlDocument,
  triggerDirectWindowPrint,
} from '../utils/printHelper';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  balances: Record<string, number>;
  transactions: Transaction[];
  goals: Goal[];
  onShowToast: (message: string) => void;
  language: Language;
  t: Translations;
}

type PrintTab = 'statement' | 'monthly' | 'accounts' | 'screen';

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  accounts,
  balances,
  transactions,
  goals,
  onShowToast,
  language,
  t,
}) => {
  const [activeTab, setActiveTab] = useState<PrintTab>('statement');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Calcolo transazioni filtrate per l'estratto conto
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Filtro conto
      if (selectedAccountId !== 'ALL') {
        const matchesAccount =
          tx.account === selectedAccountId ||
          tx.fromAccount === selectedAccountId ||
          tx.toAccount === selectedAccountId;
        if (!matchesAccount) return false;
      }

      // Filtro periodo
      if (selectedPeriod === 'CUSTOM') {
        let from = dateFrom?.trim() || '';
        let to = dateTo?.trim() || '';
        if (from && to && from > to) [from, to] = [to, from];
        if (from && tx.date < from) return false;
        if (to && tx.date > to) return false;
        return true;
      }

      if (selectedPeriod === 'ALL') return true;

      const now = new Date();
      const txDate = new Date(tx.date);

      if (selectedPeriod === 'CURRENT_MONTH') {
        return (
          txDate.getFullYear() === now.getFullYear() &&
          txDate.getMonth() === now.getMonth()
        );
      }
      if (selectedPeriod === 'LAST_MONTH') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return (
          txDate.getFullYear() === lastMonth.getFullYear() &&
          txDate.getMonth() === lastMonth.getMonth()
        );
      }
      if (selectedPeriod === 'CURRENT_YEAR') {
        return txDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, selectedAccountId, selectedPeriod, dateFrom, dateTo]);

  // Totali dell'estratto conto filtrato
  const statementTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'INCOME') income += amt;
      else if (tx.type === 'EXPENSE') expense += amt;
    });
    return {
      income,
      expense,
      net: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Totali patrimonio per tutti i conti
  const totalBalance = useMemo(() => {
    return Object.values(balances).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0
    );
  }, [balances]);

  // Dati report mensile corrente
  const currentMonthData = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const localizedMonth = formatLocalizedMonthYear(now, language);

    const monthTx = transactions.filter((tx) => tx.date.startsWith(monthKey));
    let income = 0;
    let expense = 0;
    const catMap: Record<string, number> = {};

    monthTx.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'INCOME') {
        income += amt;
      } else if (tx.type === 'EXPENSE') {
        expense += amt;
        const c = tx.category || 'Altro';
        catMap[c] = (catMap[c] || 0) + amt;
      }
    });

    const net = income - expense;
    const rate = income > 0 ? Math.max(0, Math.min(100, Math.round((net / income) * 100))) : 0;

    return {
      name: localizedMonth,
      income,
      expense,
      net,
      rate,
      txCount: monthTx.length,
      categories: Object.entries(catMap).sort((a, b) => b[1] - a[1]),
    };
  }, [transactions, language]);

  if (!isOpen) return null;

  const getAccountLabel = () => {
    if (selectedAccountId === 'ALL') return t?.allAccountsOption || 'Tutti i conti';
    const acc = accounts.find((a) => a.id === selectedAccountId);
    return acc ? acc.name : selectedAccountId;
  };

  const getPeriodLabel = () => {
    if (selectedPeriod === 'CURRENT_MONTH') return t?.currentMonthOption || 'Mese corrente';
    if (selectedPeriod === 'LAST_MONTH') return t?.lastMonthOption || 'Mese scorso';
    if (selectedPeriod === 'CURRENT_YEAR') return t?.currentYearOption || 'Anno corrente';
    if (selectedPeriod === 'CUSTOM') {
      const fromStr = dateFrom ? formatDateEuropean(dateFrom) : '';
      const toStr = dateTo ? formatDateEuropean(dateTo) : '';
      if (fromStr && toStr) {
        return `${t?.dateFromLabel || 'Dal'} ${fromStr} ${t?.dateToLabel || 'al'} ${toStr}`;
      } else if (fromStr) {
        return `${t?.dateFromLabel || 'Dal'} ${fromStr}`;
      } else if (toStr) {
        return `${t?.dateToLabel || 'Fino al'} ${toStr}`;
      }
      return t?.periodCustom || 'Intervallo date';
    }
    return t?.allTransactionsOption || 'Tutti i movimenti';
  };

  // 1. Azione: Stampa Diretta Estratto Conto (tramite iframe sicuro)
  const handlePrintStatement = async () => {
    const isDe = language === 'de';
    const isEn = language === 'en';

    setIsProcessing(true);
    try {
      const rowsHtml = filteredTransactions
        .map((tx) => {
          const isExpense = tx.type === 'EXPENSE';
          const isTransfer = tx.type === 'TRANSFER';
          const colorClass = isExpense ? 'text-rose' : isTransfer ? 'text-indigo' : 'text-emerald';
          const sign = isExpense ? '-' : isTransfer ? '↺ ' : '+';
          const accName = isTransfer
            ? `${tx.fromAccount || ''} &rarr; ${tx.toAccount || ''}`
            : tx.account || '-';
          const categoryDisplay = tx.category ? getCategoryDisplayName(tx.category, language) : '-';

          return `
            <tr>
              <td>${tx.date}</td>
              <td class="font-bold">${tx.description} ${tx.notes ? `<div style="font-size:8pt;color:#64748b;font-style:italic;">${tx.notes}</div>` : ''}</td>
              <td><span class="badge">${accName}</span></td>
              <td><span class="badge">${categoryDisplay}</span></td>
              <td class="text-right font-bold ${colorClass}">${sign}${formatCurrency(tx.amount)}</td>
            </tr>
          `;
        })
        .join('');

      const titleIncome = isDe ? 'Gesamteinnahmen (+)' : isEn ? 'Total Income (+)' : 'Totale Entrate (+)';
      const titleExpense = isDe ? 'Gesamtausgaben (-)' : isEn ? 'Total Expenses (-)' : 'Totale Uscite (-)';
      const titleNet = isDe ? 'Nettosaldo Zeitraum' : isEn ? 'Period Net Balance' : 'Saldo Netto Periodo';
      const filterLabel = isDe ? 'Filter' : isEn ? 'Filter' : 'Filtro';
      const periodLabel = isDe ? 'Zeitraum' : isEn ? 'Period' : 'Periodo';
      const totalTxLabel = isDe ? 'Buchungen gesamt' : isEn ? 'Total transactions' : 'Totale transazioni';
      const thDate = isDe ? 'Datum' : isEn ? 'Date' : 'Data';
      const thDesc = isDe ? 'Beschreibung' : isEn ? 'Description' : 'Descrizione';
      const thAcc = isDe ? 'Konto' : isEn ? 'Account' : 'Conto';
      const thCat = isDe ? 'Kategorie' : isEn ? 'Category' : 'Categoria';
      const thAmt = isDe ? 'Betrag' : isEn ? 'Amount' : 'Importo';
      const noTxFound = isDe ? 'Keine Buchungen gefunden' : isEn ? 'No transactions found' : 'Nessuna transazione trovata';

      const contentHtml = `
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-title">${titleIncome}</div>
            <div class="summary-value text-emerald">+${formatCurrency(statementTotals.income)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">${titleExpense}</div>
            <div class="summary-value text-rose">-${formatCurrency(statementTotals.expense)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">${titleNet}</div>
            <div class="summary-value ${statementTotals.net >= 0 ? 'text-emerald' : 'text-rose'}">
              ${statementTotals.net >= 0 ? '+' : ''}${formatCurrency(statementTotals.net)}
            </div>
          </div>
        </div>

        <div style="margin-bottom: 8px; font-size: 9pt; color: #475569; font-weight: 600;">
          ${filterLabel}: ${getAccountLabel()} • ${periodLabel}: ${getPeriodLabel()} • ${totalTxLabel}: ${statementTotals.count}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 85px;">${thDate}</th>
              <th>${thDesc}</th>
              <th style="width: 140px;">${thAcc}</th>
              <th style="width: 120px;">${thCat}</th>
              <th style="width: 100px; text-align: right;">${thAmt}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="5" class="text-center" style="padding: 20px; color: #94a3b8;">${noTxFound}</td></tr>`}
          </tbody>
        </table>
      `;

      const docTitle = isDe ? 'Kontoauszug - MyFinance Pro' : isEn ? 'Account Statement - MyFinance Pro' : 'Estratto Conto - MyFinance Pro';
      const docSubtitle = `${isDe ? 'Kontoauszug Buchungen' : isEn ? 'Transactions Statement' : 'Estratto Conto Movimenti'}: ${getAccountLabel()} (${getPeriodLabel()})`;

      const result = await printHtmlDocument({
        title: docTitle,
        subtitle: docSubtitle,
        contentHtml,
        language,
        onFallback: () => {
          handleDownloadStatementPdf();
          onShowToast(
            isDe
              ? 'Direktdruck vom Browser nicht unterstützt: PDF generiert und heruntergeladen.'
              : isEn
              ? 'Direct printing not allowed by browser: PDF generated and downloaded.'
              : 'Stampa diretta non consentita dal browser: PDF generato e scaricato.'
          );
        },
      });

      if (result.success) {
        onShowToast(t?.printWindowOpenedToast || 'Finestra di stampa aperta con successo!');
      }
    } catch (err) {
      console.error(err);
      onShowToast(
        isDe
          ? 'Fehler beim Vorbereiten des Druckens.'
          : isEn
          ? 'Error preparing print document.'
          : 'Errore durante la preparazione della stampa.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Azione: Scarica PDF Estratto Conto (jsPDF)
  const handleDownloadStatementPdf = () => {
    try {
      generateTransactionsStatementPdf({
        transactions: filteredTransactions,
        accounts,
        accountLabel: getAccountLabel(),
        periodLabel: getPeriodLabel(),
        language,
      });
      onShowToast(t?.statementPdfDownloadedToast || 'Estratto Conto PDF scaricato con successo!');
    } catch (err) {
      console.error(err);
      onShowToast(
        language === 'de'
          ? 'Fehler beim Erstellen der PDF-Datei.'
          : language === 'en'
          ? 'Error generating PDF.'
          : 'Errore nella generazione del PDF.'
      );
    }
  };

  // 3. Azione: Stampa Diretta Report Mensile
  const handlePrintMonthly = async () => {
    const isDe = language === 'de';
    const isEn = language === 'en';

    setIsProcessing(true);
    try {
      const catRows = currentMonthData.categories
        .map(([cat, total]) => {
          const pct = currentMonthData.expense > 0 ? (total / currentMonthData.expense) * 100 : 0;
          const catDisplay = getCategoryDisplayName(cat, language);
          return `
            <tr>
              <td class="font-bold">${catDisplay}</td>
              <td class="text-center">${pct.toFixed(1)}%</td>
              <td class="text-right font-bold text-rose">-${formatCurrency(total)}</td>
            </tr>
          `;
        })
        .join('');

      const defaultAccType = isDe ? 'Standardkonto' : isEn ? 'Standard' : 'Standard';
      const accountsRows = accounts
        .map((acc) => {
          const bal = balances[acc.id] || 0;
          return `
            <tr>
              <td class="font-bold">${acc.name}</td>
              <td>${acc.type || defaultAccType}</td>
              <td class="text-right font-bold ${bal >= 0 ? 'text-emerald' : 'text-rose'}">${formatCurrency(bal)}</td>
            </tr>
          `;
        })
        .join('');

      const titleIncome = isDe ? `Einnahmen (${currentMonthData.name})` : isEn ? `Income (${currentMonthData.name})` : `Entrate (${currentMonthData.name})`;
      const titleExpense = isDe ? `Ausgaben (${currentMonthData.name})` : isEn ? `Expenses (${currentMonthData.name})` : `Uscite (${currentMonthData.name})`;
      const titleSavings = isDe ? `Nettoersparnis (${currentMonthData.rate}%)` : isEn ? `Net Savings (${currentMonthData.rate}%)` : `Risparmio Netto (${currentMonthData.rate}%)`;
      const sec1Title = isDe ? `1. Ausgaben nach Kategorie (${currentMonthData.name})` : isEn ? `1. Expenses by Category (${currentMonthData.name})` : `1. Spese per Categoria (${currentMonthData.name})`;
      const sec2Title = isDe ? '2. Saldo nach Einzelkonto' : isEn ? '2. Balances by Account' : '2. Saldo per Singolo Conto';
      const thCat = isDe ? 'Kategorie' : isEn ? 'Category' : 'Categoria';
      const thPct = isDe ? '% vom Gesamt' : isEn ? '% of Total' : '% sul Totale';
      const thAmt = isDe ? 'Betrag' : isEn ? 'Amount' : 'Importo';
      const thAcc = isDe ? 'Konto' : isEn ? 'Account' : 'Conto';
      const thType = isDe ? 'Typ' : isEn ? 'Type' : 'Tipologia';
      const thAvailable = isDe ? 'Verfügbarer Saldo' : isEn ? 'Available Balance' : 'Saldo Disponibile';
      const noExpenses = isDe ? 'Keine Ausgaben in diesem Monat' : isEn ? 'No expenses recorded this month' : 'Nessuna spesa nel mese';

      const contentHtml = `
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-title">${titleIncome}</div>
            <div class="summary-value text-emerald">+${formatCurrency(currentMonthData.income)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">${titleExpense}</div>
            <div class="summary-value text-rose">-${formatCurrency(currentMonthData.expense)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">${titleSavings}</div>
            <div class="summary-value ${currentMonthData.net >= 0 ? 'text-emerald' : 'text-rose'}">
              ${currentMonthData.net >= 0 ? '+' : ''}${formatCurrency(currentMonthData.net)}
            </div>
          </div>
        </div>

        <h3 style="margin-top: 20px; font-size: 11pt; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
          ${sec1Title}
        </h3>
        <table>
          <thead>
            <tr>
              <th>${thCat}</th>
              <th style="width: 100px; text-align: center;">${thPct}</th>
              <th style="width: 120px; text-align: right;">${thAmt}</th>
            </tr>
          </thead>
          <tbody>
            ${catRows || `<tr><td colspan="3" class="text-center">${noExpenses}</td></tr>`}
          </tbody>
        </table>

        <h3 style="margin-top: 25px; font-size: 11pt; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
          ${sec2Title}
        </h3>
        <table>
          <thead>
            <tr>
              <th>${thAcc}</th>
              <th style="width: 140px;">${thType}</th>
              <th style="width: 120px; text-align: right;">${thAvailable}</th>
            </tr>
          </thead>
          <tbody>
            ${accountsRows}
          </tbody>
        </table>
      `;

      const repTitle = isDe ? `Monatsbericht - ${currentMonthData.name}` : isEn ? `Monthly Report - ${currentMonthData.name}` : `Report Mensile - ${currentMonthData.name}`;
      const repSubtitle = isDe
        ? `Konsolidierter Finanzbericht: ${currentMonthData.name}`
        : isEn
        ? `Consolidated Financial Summary: ${currentMonthData.name}`
        : `Riepilogo Finanziario Consolidato: ${currentMonthData.name}`;

      const result = await printHtmlDocument({
        title: repTitle,
        subtitle: repSubtitle,
        contentHtml,
        language,
        onFallback: () => {
          handleDownloadMonthlyPdf();
          onShowToast(
            isDe
              ? 'Direktdruck nicht unterstützt: PDF heruntergeladen.'
              : isEn
              ? 'Direct printing not allowed: PDF downloaded.'
              : 'Stampa diretta non consentita: PDF scaricato.'
          );
        },
      });

      if (result.success) {
        onShowToast(t?.printWindowOpenedToast || 'Finestra di stampa aperta con successo!');
      }
    } catch (err) {
      console.error(err);
      onShowToast(
        isDe
          ? 'Fehler beim Vorbereiten des Berichts.'
          : isEn
          ? 'Error preparing monthly report.'
          : 'Errore durante la preparazione del report.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Azione: Scarica PDF Report Mensile (jsPDF)
  const handleDownloadMonthlyPdf = () => {
    try {
      generateMonthlyReportPdf({
        accounts,
        balances,
        transactions,
        goals,
        language,
      });
      onShowToast(
        t?.monthlyPdfDownloadedToast
          ? `${t.monthlyPdfDownloadedToast} (${currentMonthData.name})`
          : `Report PDF (${currentMonthData.name}) scaricato con successo!`
      );
    } catch (err) {
      console.error(err);
      onShowToast(
        language === 'de'
          ? 'Fehler beim Erstellen des PDF-Berichts.'
          : language === 'en'
          ? 'Error generating monthly PDF report.'
          : 'Errore nella generazione del report PDF.'
      );
    }
  };

  // 5. Azione: Stampa / Scarica Situazione Patrimoniale
  const handlePrintAccounts = async () => {
    const isDe = language === 'de';
    const isEn = language === 'en';

    setIsProcessing(true);
    try {
      const defaultAccType = isDe ? 'Standardkonto' : isEn ? 'Standard' : 'Standard';
      const accountsRows = accounts
        .map((acc) => {
          const bal = balances[acc.id] || 0;
          return `
            <tr>
              <td class="font-bold">${acc.name}</td>
              <td>${acc.type || defaultAccType}</td>
              <td class="text-right font-bold ${bal >= 0 ? 'text-emerald' : 'text-rose'}">${formatCurrency(bal)}</td>
            </tr>
          `;
        })
        .join('');

      const titleNetWorth = isDe ? 'Konsolidiertes Gesamtvermögen' : isEn ? 'Total Consolidated Net Worth' : 'Patrimonio Totale Consolidato';
      const subNetWorth = isDe
        ? `Berechnet über alle ${accounts.length} aktiven Konten`
        : isEn
        ? `Calculated across all ${accounts.length} active accounts`
        : `Calcolato su tutti i ${accounts.length} conti attivi`;
      const thAcc = isDe ? 'Kontoname' : isEn ? 'Account Name' : 'Nome Conto';
      const thType = isDe ? 'Typ' : isEn ? 'Type' : 'Tipologia';
      const thAvailable = isDe ? 'Verfügbarer Saldo' : isEn ? 'Available Balance' : 'Saldo Disponibile';

      const contentHtml = `
        <div class="summary-card" style="margin-bottom: 20px;">
          <div class="summary-title">${titleNetWorth}</div>
          <div class="summary-value ${totalBalance >= 0 ? 'text-emerald' : 'text-rose'}" style="font-size: 18pt;">
            ${formatCurrency(totalBalance)}
          </div>
          <div style="font-size: 9pt; color: #64748b; margin-top: 4px;">
            ${subNetWorth}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>${thAcc}</th>
              <th style="width: 140px;">${thType}</th>
              <th style="width: 130px; text-align: right;">${thAvailable}</th>
            </tr>
          </thead>
          <tbody>
            ${accountsRows}
          </tbody>
        </table>
      `;

      const accountsDocTitle = isDe ? 'Kontostände - MyFinance Pro' : isEn ? 'Accounts Balance - MyFinance Pro' : 'Situazione Conti - MyFinance Pro';
      const accountsDocSubtitle = isDe
        ? 'Konsolidierte Übersicht der Salden und Verfügbarkeiten'
        : isEn
        ? 'Consolidated Summary of Balances and Funds'
        : 'Riepilogo Consolidato Saldi e Disponibilità';

      await printHtmlDocument({
        title: accountsDocTitle,
        subtitle: accountsDocSubtitle,
        contentHtml,
        language,
        onFallback: () => {
          generateAccountsBalancePdf(accounts, balances, language);
          onShowToast(
            isDe
              ? 'Drucken nicht möglich: Salden-PDF heruntergeladen.'
              : isEn
              ? 'Printing not allowed: Balances PDF downloaded.'
              : 'Stampa non consentita: PDF Saldi scaricato.'
          );
        },
      });
      onShowToast(t?.printWindowOpenedToast || 'Finestra di stampa aperta con successo!');
    } catch (err) {
      console.error(err);
      onShowToast(
        isDe
          ? 'Fehler bei der Vorbereitung des Drucks.'
          : isEn
          ? 'Error preparing print.'
          : 'Errore nella preparazione della stampa.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAccountsPdf = () => {
    try {
      generateAccountsBalancePdf(accounts, balances, language);
      onShowToast(t?.balancesPdfDownloadedToast || 'PDF Situazione Patrimoniale scaricato!');
    } catch (err) {
      console.error(err);
      onShowToast(
        language === 'de'
          ? 'Fehler bei der PDF-Erstellung.'
          : language === 'en'
          ? 'Error generating PDF.'
          : 'Errore nella generazione del PDF.'
      );
    }
  };

  // Stampa diretta browser per schermata corrente
  const handlePrintCurrentScreen = () => {
    onClose();
    setTimeout(() => {
      const ok = triggerDirectWindowPrint();
      if (!ok) {
        onShowToast(
          language === 'de'
            ? 'Der Browser hat das Drucken eingeschränkt: Nutzen Sie das Druckzentrum, um das PDF herunterzuladen.'
            : language === 'en'
            ? 'Browser restricted printing: Use Print Center to download PDF.'
            : 'Il browser ha limitato la stampa: usa il Centro Stampa per scaricare il PDF.'
        );
      }
    }, 150);
  };

  // Copia negli appunti
  const handleCopyTextSummary = () => {
    const isDe = language === 'de';
    const isEn = language === 'en';
    const locale = isDe ? 'de-DE' : isEn ? 'en-US' : 'it-IT';

    const headerLine = isDe ? '📊 KONTOAUSZUG MYFINANCE PRO' : isEn ? '📊 ACCOUNT STATEMENT MYFINANCE PRO' : '📊 ESTRATTO CONTO MYFINANCE PRO';
    const dateLabel = isDe ? 'Datum' : isEn ? 'Date' : 'Data';
    const filterLabel = isDe ? 'Filter' : isEn ? 'Filter' : 'Filtro';
    const incomeLabel = isDe ? 'Gesamteinnahmen' : isEn ? 'Total Income' : 'Totale Entrate';
    const expenseLabel = isDe ? 'Gesamtausgaben' : isEn ? 'Total Expenses' : 'Totale Uscite';
    const netLabel = isDe ? 'Nettosaldo' : isEn ? 'Net Balance' : 'Saldo Netto';
    const txLabel = isDe ? 'Buchungen gesamt' : isEn ? 'Total Transactions' : 'Movimenti Totali';
    const netWorthLabel = isDe ? 'Gesamtvermögen' : isEn ? 'Total Net Worth' : 'Patrimonio Complessivo';

    const text = `${headerLine}\n${dateLabel}: ${new Date().toLocaleDateString(locale)}\n${filterLabel}: ${getAccountLabel()} (${getPeriodLabel()})\n\n${incomeLabel}: +${formatCurrency(statementTotals.income)}\n${expenseLabel}: -${formatCurrency(statementTotals.expense)}\n${netLabel}: ${formatCurrency(statementTotals.net)}\n${txLabel}: ${statementTotals.count}\n\n${netWorthLabel}: ${formatCurrency(totalBalance)}`;
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    onShowToast(t?.summaryCopiedToast || 'Riepilogo copiato negli appunti!');
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-100/90 dark:bg-slate-950/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 no-print animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header Modal */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-white/90 dark:bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <MyFinanceIcon size={38} withGlow />
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
                {t?.printCenterTitle || 'Centro Stampa & PDF'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t?.printCenterSubtitle || 'Stampa diretta formattata A4 o esportazione PDF ufficiale'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/50 px-3 pt-2 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('statement')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 whitespace-nowrap ${
              activeTab === 'statement'
                ? 'border-cyan-400 text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {t?.tabStatement || 'Estratto Conto'}
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 whitespace-nowrap ${
              activeTab === 'monthly'
                ? 'border-indigo-400 text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            {t?.tabMonthlyReport || 'Report Mensile'}
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'border-emerald-400 text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            {t?.tabAccountsBalance || 'Saldi Conti'}
          </button>

          <button
            onClick={() => setActiveTab('screen')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 whitespace-nowrap ${
              activeTab === 'screen'
                ? 'border-amber-400 text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            {t?.tabScreenPrint || 'Schermata'}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: ESTRATTO CONTO */}
          {activeTab === 'statement' && (
            <div className="space-y-4">
              {/* Filtri veloci */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100/90 dark:bg-slate-950/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> {t?.filterAccountLabel || 'Conto'}
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ALL">{t?.allAccountsOption || 'Tutti i conti'}</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> {t?.filterPeriodLabel || 'Periodo'}
                  </label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ALL">{t?.allTransactionsOption || 'Tutti i movimenti'}</option>
                    <option value="CUSTOM">{t?.periodCustom || 'Intervallo date'}</option>
                    <option value="CURRENT_MONTH">{t?.currentMonthOption || 'Mese corrente'}</option>
                    <option value="LAST_MONTH">{t?.lastMonthOption || 'Mese scorso'}</option>
                    <option value="CURRENT_YEAR">{t?.currentYearOption || 'Anno corrente'}</option>
                  </select>
                </div>

                {selectedPeriod === 'CUSTOM' && (
                  <div className="col-span-2 grid grid-cols-2 gap-2 bg-slate-100/90 dark:bg-slate-950/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-1">
                        {t?.dateFromLabel || 'Dal'} {dateFrom ? `(${formatDateEuropean(dateFrom)})` : ''}
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-1">
                        {t?.dateToLabel || 'Al'} {dateTo ? `(${formatDateEuropean(dateTo)})` : ''}
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Anteprima Riepilogo Totali */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-100/90 dark:bg-slate-950/70 border border-emerald-500/20 p-2.5 rounded-2xl">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t?.summaryIncome || 'Entrate'}</div>
                  <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                    +{formatCurrency(statementTotals.income)}
                  </div>
                </div>
                <div className="bg-slate-100/90 dark:bg-slate-950/70 border border-rose-500/20 p-2.5 rounded-2xl">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t?.summaryExpenses || 'Uscite'}</div>
                  <div className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                    -{formatCurrency(statementTotals.expense)}
                  </div>
                </div>
                <div className="bg-slate-100/90 dark:bg-slate-950/70 border border-indigo-500/20 p-2.5 rounded-2xl">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t?.summaryNetBalance || 'Saldo Netto'}</div>
                  <div
                    className={`text-xs sm:text-sm font-black mt-0.5 truncate ${
                      statementTotals.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {statementTotals.net >= 0 ? '+' : ''}
                    {formatCurrency(statementTotals.net)}
                  </div>
                </div>
              </div>

              {/* Anteprima Lista Movimenti (max 4 per anteprima) */}
              <div className="bg-slate-100/90 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {t?.documentPreview || 'Anteprima Documento'} ({filteredTransactions.length} {t?.rowsWord || 'righe'})
                  </span>
                  <span className="text-[10px]">{t?.bankingA4Format || 'Formato A4 bancario'}</span>
                </div>

                <div className="divide-y divide-slate-800/80 text-xs">
                  {filteredTransactions.slice(0, 4).map((tx) => (
                    <div key={tx.id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-900 dark:text-white truncate text-[11px]">
                          {tx.description}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span>{tx.date}</span>
                          <span>•</span>
                          <span className="text-slate-600 dark:text-slate-300">{tx.account || tx.fromAccount}</span>
                          <span>•</span>
                          <span className="text-slate-500">{tx.category ? getCategoryDisplayName(tx.category, language) : ''}</span>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold flex-shrink-0 ${
                          tx.type === 'EXPENSE'
                            ? 'text-rose-600 dark:text-rose-400'
                            : tx.type === 'TRANSFER'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {tx.type === 'EXPENSE' ? '-' : tx.type === 'TRANSFER' ? '↺ ' : '+'}
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                  {filteredTransactions.length > 4 && (
                    <div className="pt-2 text-center text-[10px] text-slate-500 italic">
                      + {t?.andOtherTransactions ? t.andOtherTransactions.replace('{count}', (filteredTransactions.length - 4).toString()) : `altri ${filteredTransactions.length - 4} movimenti stampati nel documento finale...`}
                    </div>
                  )}
                  {filteredTransactions.length === 0 && (
                    <div className="py-4 text-center text-xs text-slate-500">
                      {t?.noTransactionsFilter || 'Nessun movimento trovato per i filtri selezionati.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Azioni Principali */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handlePrintStatement}
                  disabled={isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs transition active:scale-95 disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t?.directPrintA4Btn || 'Stampa Diretta A4'}</span>
                </button>

                <button
                  onClick={handleDownloadStatementPdf}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-indigo-700 dark:text-indigo-300 border border-slate-300/80 dark:border-slate-700/80 font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 text-xs transition active:scale-95"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{t?.downloadPdfA4Btn || 'Scarica PDF (A4)'}</span>
                </button>
              </div>

              <button
                onClick={handleCopyTextSummary}
                className="w-full py-2 bg-slate-100/90 dark:bg-slate-950/60 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t?.copiedBadge || 'Copiato!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>{t?.copySummaryBtn || 'Copia Riepilogo per WhatsApp / Email'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: REPORT MENSILE */}
          {activeTab === 'monthly' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-50/60 dark:from-indigo-950/60 to-white dark:to-slate-900 border border-indigo-500/20 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider">
                      {t?.officialReportBadge || 'Report Ufficiale'}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {t?.monthOf || 'Mese di'} {currentMonthData.name}
                    </h3>
                  </div>
                  <span className="text-xs bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-lg border border-indigo-500/30">
                    {currentMonthData.txCount} {t?.transactionsCount || 'Movimenti'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-semibold">{t?.summaryIncome || 'Entrate'}</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(currentMonthData.income)}
                    </span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-semibold">{t?.summaryExpenses || 'Uscite'}</span>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                      -{formatCurrency(currentMonthData.expense)}
                    </span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-semibold">{t?.summarySavings || 'Risparmio'}</span>
                    <span
                      className={`text-xs font-black ${
                        currentMonthData.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {currentMonthData.net >= 0 ? '+' : ''}
                      {formatCurrency(currentMonthData.net)}
                    </span>
                  </div>
                </div>

                {currentMonthData.categories.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                      {t?.topSpendingCategories || 'Principali categorie di spesa:'}
                    </span>
                    <div className="space-y-1">
                      {currentMonthData.categories.slice(0, 3).map(([cat, amt]) => (
                        <div key={cat} className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300">{getCategoryDisplayName(cat, language)}</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400">-{formatCurrency(amt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottoni Report Mensile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handlePrintMonthly}
                  disabled={isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs transition active:scale-95 disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t?.printMonthlyReportBtn || 'Stampa Report Mensile'}</span>
                </button>

                <button
                  onClick={handleDownloadMonthlyPdf}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-indigo-700 dark:text-indigo-300 border border-slate-300/80 dark:border-slate-700/80 font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 text-xs transition active:scale-95"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{t?.downloadMonthlyPdfBtn || 'Scarica PDF Mensile'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SALDI CONTI */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                    {t?.consolidatedNetWorth || 'Patrimonio Totale Consolidato'}
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    {accounts.length} {t?.accountsCount || 'Conti'}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(totalBalance)}
                </div>

                <div className="divide-y divide-slate-800/80 pt-2 text-xs">
                  {accounts.map((acc) => {
                    const bal = balances[acc.id] || 0;
                    return (
                      <div key={acc.id} className="py-2 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{acc.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{acc.type || (t?.standardAccount || 'Conto Standard')}</div>
                        </div>
                        <div
                          className={`font-black text-xs ${
                            bal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatCurrency(bal)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handlePrintAccounts}
                  disabled={isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs transition active:scale-95 disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t?.printAccountBalancesBtn || 'Stampa Saldi Conti'}</span>
                </button>

                <button
                  onClick={handleDownloadAccountsPdf}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-emerald-700 dark:text-emerald-300 border border-slate-300/80 dark:border-slate-700/80 font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 text-xs transition active:scale-95"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{t?.downloadAccountBalancesPdfBtn || 'Scarica PDF Saldi'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: STAMPA SCHERMATA ATTIVA */}
          {activeTab === 'screen' && (
            <div className="space-y-3 bg-slate-100/90 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-slate-600 dark:text-slate-300">
                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                    {t?.directBrowserPrintTitle || 'Stampa Diretta Finestra Browser'}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t?.directBrowserPrintDesc || 'Questa opzione attiva il comando di stampa standard del tuo dispositivo (Ctrl + P su PC o Condividi > Stampa su Android/iOS).'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t?.directBrowserPrintTip || "💡 Consiglio: Se sei all'interno dell'anteprima web di AI Studio e il browser non apre la finestra, usa i tab sopra (Estratto Conto o Report Mensile) con il tasto Scarica PDF per un risultato perfetto al 100%!"}
                  </p>
                </div>
              </div>

              <button
                onClick={handlePrintCurrentScreen}
                className="w-full mt-2 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>{t?.printCurrentScreenBtn || 'Avvia Stampa Schermata Attuale'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-slate-100/90 dark:bg-slate-950/80 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 px-4 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <MyFinanceIcon size={16} />
            <span className="text-slate-500 dark:text-slate-400">
              © 2026 Federico Pontedoro. All rights reserved. • My Finance Pro · Android Mobile Edition.
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold"
          >
            {t?.close || 'Chiudi'}
          </button>
        </div>
      </div>
    </div>
  );
};
