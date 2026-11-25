import { jsPDF } from 'jspdf';
import { Account, Goal, Transaction } from '../types/finance';
import { Language, MONTH_NAMES, getCategoryDisplayName } from './translations';
import { getCurrencyCode } from './formatters';

export interface MonthlyReportData {
  accounts: Account[];
  balances: Record<string, number>;
  transactions: Transaction[];
  goals: Goal[];
  monthDate?: Date;
  language?: Language;
}

export function formatPdfCurrency(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${formatted} EUR`;
}

export function generateMonthlyReportPdf(data: MonthlyReportData): void {
  const lang: Language = data.language || 'it';
  const isDe = lang === 'de';
  const isEn = lang === 'en';
  const locale = isDe ? 'de-DE' : isEn ? 'en-US' : 'it-IT';

  const targetDate = data.monthDate || new Date();
  const year = targetDate.getFullYear();
  const monthIndex = targetDate.getMonth();
  const monthNames = MONTH_NAMES[lang] || MONTH_NAMES.it;
  const monthName = monthNames[monthIndex];
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

  // 1. Calcolo transazioni del mese
  const monthTransactions = data.transactions.filter((tx) =>
    tx.date.startsWith(monthKey)
  );

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryExpenses: Record<string, { total: number; count: number }> = {};

  monthTransactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'INCOME') {
      totalIncome += amt;
    } else if (tx.type === 'EXPENSE') {
      totalExpense += amt;
      const cat = tx.category || 'Altro';
      if (!categoryExpenses[cat]) {
        categoryExpenses[cat] = { total: 0, count: 0 };
      }
      categoryExpenses[cat].total += amt;
      categoryExpenses[cat].count += 1;
    }
  });

  const sortedCategories = Object.entries(categoryExpenses)
    .map(([category, info]) => ({
      category,
      total: info.total,
      count: info.count,
      percentage: totalExpense > 0 ? (info.total / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // 2. Calcolo Saldo Totale e saldi per conto
  const totalBalance = Object.values(data.balances).reduce(
    (acc, curr) => acc + (Number(curr) || 0),
    0
  );
  const netMonthlySavings = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0
      ? Math.max(0, Math.min(100, Math.round((netMonthlySavings / totalIncome) * 100)))
      : 0;

  // 3. Creazione Documento PDF (A4: 210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  // Helper per footer
  const drawFooter = (pageNumber: number, totalPages: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 283, pageWidth - margin, 283);

    doc.text(
      '© 2026 Federico Pontedoro. All rights reserved. • My Finance Pro · Android Mobile Edition.',
      margin,
      288
    );
    const pageText = isDe
      ? `Seite ${pageNumber} von ${totalPages}`
      : isEn
      ? `Page ${pageNumber} of ${totalPages}`
      : `Pagina ${pageNumber} di ${totalPages}`;
    doc.text(pageText, pageWidth - margin, 288, { align: 'right' });
  };

  // --- HEADER (Testata Bianca) ---
  doc.setFillColor(255, 255, 255); // Pure White Header
  doc.setDrawColor(226, 232, 240); // Slate 200 border
  doc.roundedRect(margin, cursorY, contentWidth, 26, 2.5, 2.5, 'FD');

  // Thin Indigo Accent Stripe + Bottom Divider
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(margin, cursorY, 2.5, 26, 'F');
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.6);
  doc.line(margin, cursorY + 26, pageWidth - margin, cursorY + 26);
  doc.setLineWidth(0.2);

  // Titolo App e Documento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Dark Slate 900
  doc.text('MYFINANCE PRO', margin + 6.5, cursorY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229); // Indigo 600
  const headerSubtitle = isDe
    ? `Monatlicher Finanzbericht: ${monthName.toUpperCase()} ${year}`
    : isEn
    ? `Monthly Financial Report: ${monthName.toUpperCase()} ${year}`
    : `Report Finanziario Mensile: ${monthName.toUpperCase()} ${year}`;
  doc.text(headerSubtitle, margin + 6.5, cursorY + 16.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); // Slate 600
  const now = new Date();
  const dateFormatted = now.toLocaleDateString(locale) + ' ' + now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const generatedText = isDe ? `Erstellt: ${dateFormatted}` : isEn ? `Generated: ${dateFormatted}` : `Generato: ${dateFormatted}`;
  const statusText = isDe ? 'Status: Lokal konsolidiert' : isEn ? 'Status: Locally consolidated' : 'Stato: Consolidato locale';
  doc.text(generatedText, pageWidth - margin - 4, cursorY + 9, {
    align: 'right',
  });
  doc.text(statusText, pageWidth - margin - 4, cursorY + 16.5, {
    align: 'right',
  });

  cursorY += 31;

  // --- SECTION 1: EXECUTIVE SUMMARY (4 Cards) ---
  const cardWidth = (contentWidth - 6) / 2;
  const cardHeight = 18;

  // Card 1: Saldo Totale Attuale
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(margin, cursorY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const card1Title = isDe ? 'GESAMTSALDO KONTEN' : isEn ? 'TOTAL ACCOUNTS BALANCE' : 'SALDO TOTALE CONTI';
  doc.text(card1Title, margin + 4, cursorY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(totalBalance >= 0 ? 15 : 225, totalBalance >= 0 ? 23 : 29, totalBalance >= 0 ? 42 : 72);
  doc.text(formatPdfCurrency(totalBalance), margin + 4, cursorY + 13.5);

  // Card 2: Risparmio Netto del Mese
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + cardWidth + 6, cursorY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const card2Title = isDe
    ? `NETTOERSPARNIS (${monthName.toUpperCase()})`
    : isEn
    ? `NET SAVINGS (${monthName.toUpperCase()})`
    : `RISPARMIO NETTO (${monthName.toUpperCase()})`;
  doc.text(card2Title, margin + cardWidth + 10, cursorY + 5.5);
  doc.setFontSize(11);
  if (netMonthlySavings >= 0) {
    doc.setTextColor(16, 185, 129); // Emerald 500
  } else {
    doc.setTextColor(239, 68, 68); // Red 500
  }
  doc.text(`${netMonthlySavings >= 0 ? '+' : ''}${formatPdfCurrency(netMonthlySavings)} (${savingsRate}%)`, margin + cardWidth + 10, cursorY + 13.5);

  cursorY += cardHeight + 3;

  // Card 3: Entrate del Mese
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, cursorY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const card3Title = isDe ? 'EINNAHMEN DES MONATS' : isEn ? 'MONTHLY INCOME' : 'ENTRATE DEL MESE';
  doc.text(card3Title, margin + 4, cursorY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text(`+${formatPdfCurrency(totalIncome)}`, margin + 4, cursorY + 13.5);

  // Card 4: Uscite del Mese
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + cardWidth + 6, cursorY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const card4Title = isDe ? 'AUSGABEN DES MONATS' : isEn ? 'MONTHLY EXPENSES' : 'USCITE DEL MESE';
  doc.text(card4Title, margin + cardWidth + 10, cursorY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(239, 68, 68);
  doc.text(`-${formatPdfCurrency(totalExpense)}`, margin + cardWidth + 10, cursorY + 13.5);

  cursorY += cardHeight + 6;

  // --- SUB-SECTION: RIPARTIZIONE SALDI PER CONTO ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59); // Slate 800
  const sec1Heading = isDe ? '1. Saldenübersicht nach Konto' : isEn ? '1. Account Balance Breakdown' : '1. Dettaglio Saldo per Conto';
  doc.text(sec1Heading, margin, cursorY);
  cursorY += 3.5;

  // Table header for Accounts
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, cursorY, contentWidth, 6, 1, 1, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(isDe ? 'Konto' : isEn ? 'Account' : 'Conto', margin + 3, cursorY + 4.2);
  doc.text(isDe ? 'Verfügbarer Saldo' : isEn ? 'Available Balance' : 'Saldo Disponibile', pageWidth - margin - 3, cursorY + 4.2, { align: 'right' });
  cursorY += 7.5;

  data.accounts.forEach((acc) => {
    const bal = data.balances[acc.id] || 0;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(acc.name, margin + 3, cursorY);
    doc.setFont('helvetica', 'bold');
    doc.text(formatPdfCurrency(bal), pageWidth - margin - 3, cursorY, { align: 'right' });
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, cursorY + 1.8, pageWidth - margin, cursorY + 1.8);
    cursorY += 5;
  });

  cursorY += 4;

  // --- SECTION 2: SPESE PRINCIPALI PER CATEGORIA ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const sec2Heading = isDe
    ? `2. Hauptausgaben nach Kategorie (${monthName} ${year})`
    : isEn
    ? `2. Top Expenses by Category (${monthName} ${year})`
    : `2. Spese Principali per Categoria (${monthName} ${year})`;
  doc.text(sec2Heading, margin, cursorY);
  cursorY += 3.5;

  // Table header for Categories
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, cursorY, contentWidth, 6, 1, 1, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('#', margin + 3, cursorY + 4.2);
  doc.text(isDe ? 'Kategorie' : isEn ? 'Category' : 'Categoria', margin + 10, cursorY + 4.2);
  doc.text(isDe ? 'Buchungen' : isEn ? 'Transactions' : 'Movimenti', margin + 85, cursorY + 4.2);
  doc.text(isDe ? '% vom Gesamtbetrag' : isEn ? '% of Total' : '% sul Totale', margin + 120, cursorY + 4.2);
  doc.text(isDe ? 'Ausgegebener Betrag' : isEn ? 'Amount Spent' : 'Importo Speso', pageWidth - margin - 3, cursorY + 4.2, { align: 'right' });
  cursorY += 7.5;

  if (sortedCategories.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const noExpMsg = isDe
      ? `Keine Ausgaben im Monat ${monthName} ${year} erfasst.`
      : isEn
      ? `No expenses recorded in the month of ${monthName} ${year}.`
      : `Nessuna spesa registrata nel mese di ${monthName} ${year}.`;
    doc.text(noExpMsg, margin + 3, cursorY);
    cursorY += 6;
  } else {
    // Show top 8 categories or all
    const displayedCategories = sortedCategories.slice(0, 8);
    displayedCategories.forEach((item, index) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${index + 1}`, margin + 3, cursorY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      const translatedCat = getCategoryDisplayName(item.category, lang);
      doc.text(translatedCat, margin + 10, cursorY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const txUnit = isDe ? 'Buch.' : isEn ? 'tx' : 'mov.';
      doc.text(`${item.count} ${txUnit}`, margin + 85, cursorY);
      doc.text(`${item.percentage.toFixed(1)}%`, margin + 120, cursorY);

      // Mini progress bar in table
      const barX = margin + 135;
      const barW = 20;
      const progressW = Math.max(1, (barW * item.percentage) / 100);
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(barX, cursorY - 2.8, barW, 2.5, 0.5, 0.5, 'F');
      doc.setFillColor(99, 102, 241);
      doc.roundedRect(barX, cursorY - 2.8, progressW, 2.5, 0.5, 0.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text(`-${formatPdfCurrency(item.total)}`, pageWidth - margin - 3, cursorY, {
        align: 'right',
      });

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, cursorY + 1.8, pageWidth - margin, cursorY + 1.8);
      cursorY += 5.2;
    });

    if (sortedCategories.length > 8) {
      const remainingTotal = sortedCategories
        .slice(8)
        .reduce((sum, c) => sum + c.total, 0);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const remainingText = isDe
        ? `...weitere ${sortedCategories.length - 8} kleinere Kategorien: -${formatPdfCurrency(remainingTotal)}`
        : isEn
        ? `...${sortedCategories.length - 8} more minor categories: -${formatPdfCurrency(remainingTotal)}`
        : `...altre ${sortedCategories.length - 8} categorie minori: -${formatPdfCurrency(remainingTotal)}`;
      doc.text(remainingText, margin + 10, cursorY);
      cursorY += 5;
    }
  }

  cursorY += 4;

  // --- SECTION 3: AVANZAMENTO OBIETTIVI DI RISPARMIO ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const sec3Heading = isDe
    ? '3. Fortschritt der Sparziele'
    : isEn
    ? '3. Savings Goals Progress'
    : '3. Stato di Avanzamento Obiettivi di Risparmio';
  doc.text(sec3Heading, margin, cursorY);
  cursorY += 3.5;

  // Table header for Goals
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, cursorY, contentWidth, 6, 1, 1, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(isDe ? 'Sparziel' : isEn ? 'Goal' : 'Obiettivo', margin + 3, cursorY + 4.2);
  doc.text(isDe ? 'Erreicht / Ziel' : isEn ? 'Reached / Target' : 'Raggiunto / Target', margin + 65, cursorY + 4.2);
  doc.text(isDe ? 'Fortschritt' : isEn ? 'Progress' : 'Avanzamento', margin + 115, cursorY + 4.2);
  doc.text(isDe ? 'Verbleibend' : isEn ? 'Remaining' : 'Rimanente', pageWidth - margin - 3, cursorY + 4.2, { align: 'right' });
  cursorY += 7.5;

  if (!data.goals || data.goals.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const noGoalsMsg = isDe ? 'Keine Sparziele eingerichtet.' : isEn ? 'No savings goals configured.' : 'Nessun obiettivo di risparmio impostato.';
    doc.text(noGoalsMsg, margin + 3, cursorY);
    cursorY += 6;
  } else {
    data.goals.forEach((goal) => {
      const cur = Math.max(0, goal.current || 0);
      const tar = Math.max(1, goal.target || 1);
      const pct = Math.min(100, Math.round((cur / tar) * 100));
      const remaining = Math.max(0, tar - cur);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(goal.title, margin + 3, cursorY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${formatPdfCurrency(cur)} / ${formatPdfCurrency(tar)}`, margin + 65, cursorY);

      // Progress bar
      const pBarX = margin + 115;
      const pBarW = 32;
      const pBarFilled = Math.max(1, (pBarW * pct) / 100);
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(pBarX, cursorY - 2.8, pBarW, 3, 0.7, 0.7, 'F');

      // Color progress based on completion
      if (pct >= 100) {
        doc.setFillColor(16, 185, 129); // Emerald
      } else if (pct >= 50) {
        doc.setFillColor(99, 102, 241); // Indigo
      } else {
        doc.setFillColor(245, 158, 11); // Amber
      }
      doc.roundedRect(pBarX, cursorY - 2.8, pBarFilled, 3, 0.7, 0.7, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`${pct}%`, pBarX + pBarW + 3, cursorY);

      // Remaining
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(remaining === 0 ? 16 : 100, remaining === 0 ? 185 : 116, remaining === 0 ? 129 : 139);
      const completedWord = isDe ? 'ERFÜLLT' : isEn ? 'COMPLETED' : 'COMPLETATO';
      doc.text(
        remaining === 0 ? completedWord : `${formatPdfCurrency(remaining)}`,
        pageWidth - margin - 3,
        cursorY,
        { align: 'right' }
      );

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, cursorY + 1.8, pageWidth - margin, cursorY + 1.8);
      cursorY += 5.4;
    });
  }

  // --- FOOTER ON PAGE 1 ---
  drawFooter(1, 1);

  // 4. Download file
  const fileName = `Report_MyFinance_${monthName}_${year}.pdf`;
  doc.save(fileName);
}

export interface StatementPdfOptions {
  transactions: Transaction[];
  accounts: Account[];
  accountLabel?: string;
  periodLabel?: string;
  searchLabel?: string;
  language?: Language;
}

export function generateTransactionsStatementPdf({
  transactions,
  accounts,
  accountLabel = 'Tutti i conti',
  periodLabel = 'Tutti i movimenti',
  searchLabel,
  language = 'it',
}: StatementPdfOptions): void {
  const isDe = language === 'de';
  const isEn = language === 'en';
  const locale = isDe ? 'de-DE' : isEn ? 'en-US' : 'it-IT';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;
  let currentPage = 1;

  // Calcolo totali
  let totalIncome = 0;
  let totalExpense = 0;
  let txCount = 0;

  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'INCOME') totalIncome += amt;
    else if (tx.type === 'EXPENSE') totalExpense += amt;
    txCount++;
  });

  const netBalance = totalIncome - totalExpense;

  const drawHeaderBanner = () => {
    // White Header Banner (Testata Bianca)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, cursorY, contentWidth, 24, 2.5, 2.5, 'FD');
    doc.setFillColor(79, 70, 229);
    doc.rect(margin, cursorY, 2.5, 24, 'F');
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.6);
    doc.line(margin, cursorY + 24, pageWidth - margin, cursorY + 24);
    doc.setLineWidth(0.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    const mainTitle = isDe
      ? 'MYFINANCE PRO - KONTOAUSZUG'
      : isEn
      ? 'MYFINANCE PRO - ACCOUNT STATEMENT'
      : 'MYFINANCE PRO - ESTRATTO CONTO';
    doc.text(mainTitle, margin + 6.5, cursorY + 8.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(79, 70, 229);
    const filterPrefix = isDe ? 'Filter' : isEn ? 'Filter' : 'Filtro';
    const periodPrefix = isDe ? 'Zeitraum' : isEn ? 'Period' : 'Periodo';
    const searchPrefix = isDe ? 'Suche' : isEn ? 'Search' : 'Ricerca';
    const filterInfo = `${filterPrefix}: ${accountLabel} • ${periodPrefix}: ${periodLabel}${
      searchLabel ? ` • ${searchPrefix}: "${searchLabel}"` : ''
    }`;
    doc.text(filterInfo, margin + 6.5, cursorY + 15.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const now = new Date();
    const dateFormatted = now.toLocaleDateString(locale) + ' ' + now.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
    const generatedPrefix = isDe ? 'Erstellt' : isEn ? 'Generated' : 'Generato';
    const txCountPrefix = isDe ? 'Buchungen gesamt' : isEn ? 'Total Transactions' : 'Totale Movimenti';
    doc.text(
      `${generatedPrefix}: ${dateFormatted}`,
      pageWidth - margin - 4,
      cursorY + 8.5,
      { align: 'right' }
    );
    doc.text(`${txCountPrefix}: ${txCount}`, pageWidth - margin - 4, cursorY + 15.5, {
      align: 'right',
    });

    cursorY += 29;
  };

  const drawSummaryCards = () => {
    const cardW = (contentWidth - 6) / 3;
    const cardH = 14;

    // Card 1: Entrate
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, cursorY, cardW, cardH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(isDe ? 'GESAMTEINNAHMEN (+)' : isEn ? 'TOTAL INCOME (+)' : 'TOTALE ENTRATE (+)', margin + 3, cursorY + 4.5);
    doc.setFontSize(9.5);
    doc.setTextColor(16, 185, 129);
    doc.text(`+${formatPdfCurrency(totalIncome)}`, margin + 3, cursorY + 11);

    // Card 2: Uscite
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin + cardW + 3, cursorY, cardW, cardH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(isDe ? 'GESAMTAUSGABEN (-)' : isEn ? 'TOTAL EXPENSES (-)' : 'TOTALE USCITE (-)', margin + cardW + 6, cursorY + 4.5);
    doc.setFontSize(9.5);
    doc.setTextColor(239, 68, 68);
    doc.text(`-${formatPdfCurrency(totalExpense)}`, margin + cardW + 6, cursorY + 11);

    // Card 3: Saldo Netto
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin + (cardW + 3) * 2, cursorY, cardW, cardH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(isDe ? 'NETTOSALDO ZEITRAUM' : isEn ? 'PERIOD NET BALANCE' : 'SALDO NETTO PERIODO', margin + (cardW + 3) * 2 + 3, cursorY + 4.5);
    doc.setFontSize(9.5);
    if (netBalance >= 0) {
      doc.setTextColor(16, 185, 129);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(
      `${netBalance >= 0 ? '+' : ''}${formatPdfCurrency(netBalance)}`,
      margin + (cardW + 3) * 2 + 3,
      cursorY + 11
    );

    cursorY += cardH + 5;
  };

  const drawTableHeader = () => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, cursorY, contentWidth, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(isDe ? 'Datum' : isEn ? 'Date' : 'Data', margin + 3, cursorY + 4.2);
    doc.text(isDe ? 'Beschreibung / Notizen' : isEn ? 'Description / Notes' : 'Descrizione / Note', margin + 25, cursorY + 4.2);
    doc.text(isDe ? 'Konto' : isEn ? 'Account' : 'Conto', margin + 95, cursorY + 4.2);
    doc.text(isDe ? 'Kategorie' : isEn ? 'Category' : 'Categoria', margin + 130, cursorY + 4.2);
    doc.text(isDe ? 'Betrag' : isEn ? 'Amount' : 'Importo', pageWidth - margin - 3, cursorY + 4.2, { align: 'right' });
    cursorY += 7.5;
  };

  // Helper Footer
  const drawPageFooter = (pNum: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.text('© 2026 Federico Pontedoro. All rights reserved. • My Finance Pro · Android Mobile Edition.', margin, pageHeight - 9);
    const pText = isDe ? `Seite ${pNum}` : isEn ? `Page ${pNum}` : `Pagina ${pNum}`;
    doc.text(pText, pageWidth - margin, pageHeight - 9, { align: 'right' });
  };

  // Disegna prima pagina
  drawHeaderBanner();
  drawSummaryCards();
  drawTableHeader();

  if (transactions.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const noTx = isDe
      ? 'Keine Buchungen für die ausgewählten Filter gefunden.'
      : isEn
      ? 'No transactions match the selected filters.'
      : 'Nessun movimento corrisponde ai filtri selezionati.';
    doc.text(noTx, margin + 3, cursorY + 5);
  } else {
    transactions.forEach((tx) => {
      // Controllo salto pagina
      if (cursorY > pageHeight - 22) {
        drawPageFooter(currentPage);
        doc.addPage();
        currentPage++;
        cursorY = margin;
        drawTableHeader();
      }

      const isExpense = tx.type === 'EXPENSE';
      const isTransfer = tx.type === 'TRANSFER';

      // Data
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(tx.date, margin + 3, cursorY);

      // Descrizione (troncata se troppo lunga)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      let desc = tx.description;
      if (desc.length > 36) desc = desc.substring(0, 34) + '...';
      doc.text(desc, margin + 25, cursorY);

      // Conto
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const accText = isTransfer
        ? `${tx.fromAccount || ''} -> ${tx.toAccount || ''}`
        : tx.account || '-';
      let accTrunc = accText;
      if (accTrunc.length > 18) accTrunc = accTrunc.substring(0, 16) + '..';
      doc.text(accTrunc, margin + 95, cursorY);

      // Categoria (localizzata)
      doc.setTextColor(100, 116, 139);
      const rawCat = tx.category || '-';
      let catText = rawCat !== '-' ? getCategoryDisplayName(rawCat, language) : '-';
      if (catText.length > 18) catText = catText.substring(0, 16) + '..';
      doc.text(catText, margin + 130, cursorY);

      // Importo
      doc.setFont('helvetica', 'bold');
      if (isExpense) {
        doc.setTextColor(239, 68, 68);
      } else if (isTransfer) {
        doc.setTextColor(99, 102, 241);
      } else {
        doc.setTextColor(16, 185, 129);
      }
      const sign = isExpense ? '-' : isTransfer ? '↺ ' : '+';
      doc.text(
        `${sign}${formatPdfCurrency(tx.amount)}`,
        pageWidth - margin - 3,
        cursorY,
        { align: 'right' }
      );

      // Linea divisoria leggera
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, cursorY + 1.8, pageWidth - margin, cursorY + 1.8);
      cursorY += 5.2;
    });
  }

  // Footer sull'ultima pagina
  drawPageFooter(currentPage);

  const cleanDate = new Date().toISOString().split('T')[0];
  const filePrefix = isDe ? 'Kontoauszug_MyFinance' : isEn ? 'Account_Statement_MyFinance' : 'Estratto_Conto_MyFinance';
  doc.save(`${filePrefix}_${cleanDate}.pdf`);
}

export function generateAccountsBalancePdf(
  accounts: Account[],
  balances: Record<string, number>,
  language: Language = 'it'
): void {
  const isDe = language === 'de';
  const isEn = language === 'en';
  const locale = isDe ? 'de-DE' : isEn ? 'en-US' : 'it-IT';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  // White Header Banner (Testata Bianca)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 24, 2.5, 2.5, 'FD');
  doc.setFillColor(79, 70, 229);
  doc.rect(margin, cursorY, 2.5, 24, 'F');
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.6);
  doc.line(margin, cursorY + 24, pageWidth - margin, cursorY + 24);
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const bannerTitle = isDe
    ? 'MYFINANCE PRO - KONTOSTÄNDE & VERMÖGENSÜBERSICHT'
    : isEn
    ? 'MYFINANCE PRO - NET WORTH & ACCOUNT BALANCES'
    : 'MYFINANCE PRO - SITUAZIONE PATRIMONIALE CONTI';
  doc.text(bannerTitle, margin + 6.5, cursorY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(79, 70, 229);
  const subBanner = isDe
    ? 'Konsolidierte Übersicht der Salden und Verfügbarkeiten'
    : isEn
    ? 'Consolidated Summary of Balances and Funds'
    : 'Riepilogo Consolidato Saldi e Disponibilità';
  doc.text(subBanner, margin + 6.5, cursorY + 16.5);

  const totalBalance = Object.values(balances).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const now = new Date();
  const dateFormatted = now.toLocaleDateString(locale) + ' ' + now.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const datePrefix = isDe ? 'Datum' : isEn ? 'Date' : 'Data';
  const totalAccPrefix = isDe ? 'Konten gesamt' : isEn ? 'Total Accounts' : 'Totale Conti';
  doc.text(
    `${datePrefix}: ${dateFormatted}`,
    pageWidth - margin - 4,
    cursorY + 9,
    { align: 'right' }
  );
  doc.text(`${totalAccPrefix}: ${accounts.length}`, pageWidth - margin - 4, cursorY + 16.5, {
    align: 'right',
  });

  cursorY += 29;

  // Banner Saldo Complessivo
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const netWorthTitle = isDe
    ? 'KONSOLIDIERTES GESAMTVERMÖGEN'
    : isEn
    ? 'TOTAL CONSOLIDATED NET WORTH'
    : 'PATRIMONIO TOTALE CONSOLIDATO';
  doc.text(netWorthTitle, margin + 5, cursorY + 6);
  doc.setFontSize(14);
  doc.setTextColor(totalBalance >= 0 ? 15 : 225, totalBalance >= 0 ? 23 : 29, totalBalance >= 0 ? 42 : 72);
  doc.text(formatPdfCurrency(totalBalance), margin + 5, cursorY + 15);

  cursorY += 26;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, cursorY, contentWidth, 7, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(isDe ? 'Kontoname' : isEn ? 'Account Name' : 'Nome Conto', margin + 4, cursorY + 4.8);
  doc.text(isDe ? 'Typ' : isEn ? 'Type' : 'Tipologia', margin + 85, cursorY + 4.8);
  doc.text(isDe ? 'Verfügbarer Saldo' : isEn ? 'Available Balance' : 'Saldo Disponibile', pageWidth - margin - 4, cursorY + 4.8, { align: 'right' });
  cursorY += 9;

  accounts.forEach((acc) => {
    const bal = balances[acc.id] || 0;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(acc.name, margin + 4, cursorY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const defaultAccType = isDe ? 'Standardkonto' : isEn ? 'Standard Account' : 'Conto Standard';
    doc.text(acc.type || defaultAccType, margin + 85, cursorY);

    doc.setFont('helvetica', 'bold');
    if (bal >= 0) {
      doc.setTextColor(16, 185, 129);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(formatPdfCurrency(bal), pageWidth - margin - 4, cursorY, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, cursorY + 2.2, pageWidth - margin, cursorY + 2.2);
    cursorY += 6.5;
  });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 283, pageWidth - margin, 283);
  doc.text('© 2026 Federico Pontedoro. All rights reserved. • My Finance Pro · Android Mobile Edition.', margin, 288);
  doc.text(isDe ? 'Seite 1 von 1' : isEn ? 'Page 1 of 1' : 'Pagina 1 di 1', pageWidth - margin, 288, { align: 'right' });

  const cleanDate = new Date().toISOString().split('T')[0];
  const filePrefix = isDe ? 'Kontostaende_MyFinance' : isEn ? 'Accounts_Balance_MyFinance' : 'Situazione_Conti_MyFinance';
  doc.save(`${filePrefix}_${cleanDate}.pdf`);
}

export function formatPdfCurrencyWithCode(amount: number, currencyOrCode?: string): string {
  const code = getCurrencyCode(currencyOrCode);
  const isNegative = amount < 0;
  const abs = Math.abs(Number(amount) || 0);
  const formatted = abs.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${formatted} ${code}`;
}

export interface MonthlyStatementPdfInput {
  monthKey: string; // YYYY-MM
  accounts: Account[];
  balances: Record<string, number>;
  transactions: Transaction[];
  goals?: Goal[];
  holderName?: string;
  holderEmail?: string;
  language?: Language;
}

export async function buildMonthlyStatementPdfFile(
  input: MonthlyStatementPdfInput
): Promise<{
  file: File;
  fileName: string;
  blob: Blob;
  base64: string;
}> {
  const lang: Language = input.language || 'it';
  const isDe = lang === 'de';
  const isEn = lang === 'en';
  const locale = isDe ? 'de-DE' : isEn ? 'en-US' : 'it-IT';

  const [yearStr, monthStr] = input.monthKey.split('-');
  const year = parseInt(yearStr || String(new Date().getFullYear()), 10);
  const monthIdx = Math.max(0, Math.min(11, parseInt(monthStr || '1', 10) - 1));
  const monthNames = MONTH_NAMES[lang] || MONTH_NAMES.it;
  const monthName = monthNames[monthIdx];
  const monthLabel = `${monthName} ${year}`;

  const getTxCurrency = (tx: Transaction): string => {
    const accKey = tx.type === 'TRANSFER' ? tx.fromAccount : tx.account;
    const matched = input.accounts.find((a) => a.id === accKey || a.name === accKey);
    return getCurrencyCode(matched?.currency);
  };

  const monthTransactions = input.transactions
    .filter((tx) => tx.date.startsWith(input.monthKey))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Multi-currency totals for the selected month + current account balances
  const currencyMap: Record<
    string,
    { income: number; expense: number; net: number; balance: number }
  > = {};

  const ensureCurrencyBucket = (code: string) => {
    if (!currencyMap[code]) {
      currencyMap[code] = { income: 0, expense: 0, net: 0, balance: 0 };
    }
    return currencyMap[code];
  };

  input.accounts.forEach((acc) => {
    const code = getCurrencyCode(acc.currency);
    const bucket = ensureCurrencyBucket(code);
    bucket.balance += Number(input.balances[acc.id] ?? 0);
  });

  monthTransactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    const code = getTxCurrency(tx);
    const bucket = ensureCurrencyBucket(code);
    if (tx.type === 'INCOME') {
      bucket.income += amt;
      bucket.net += amt;
    } else if (tx.type === 'EXPENSE') {
      bucket.expense += amt;
      bucket.net -= amt;
    }
  });

  const activeCurrencies = Object.keys(currencyMap);
  if (activeCurrencies.length === 0) {
    ensureCurrencyBucket('EUR');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;
  let currentPage = 1;

  const drawFooter = (pageNum: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 283, pageWidth - margin, 283);
    doc.text(
      '© 2026 Federico Pontedoro. All rights reserved. • My Finance Pro · Estratto Conto Mensile',
      margin,
      288
    );
    const pgLabel = isDe ? `Seite ${pageNum}` : isEn ? `Page ${pageNum}` : `Pagina ${pageNum}`;
    doc.text(pgLabel, pageWidth - margin, 288, { align: 'right' });
  };

  const ensureSpace = (neededMm: number) => {
    if (cursorY + neededMm > 274) {
      drawFooter(currentPage);
      doc.addPage();
      currentPage += 1;
      cursorY = margin;
    }
  };

  // White Header Banner (Testata Bianca)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 28, 2.5, 2.5, 'FD');
  doc.setFillColor(79, 70, 229);
  doc.rect(margin, cursorY, 2.5, 28, 'F');
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.6);
  doc.line(margin, cursorY + 28, pageWidth - margin, cursorY + 28);
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const titleText = isDe
    ? 'MONATLICHER KONTOAUSZUG'
    : isEn
      ? 'MONTHLY ACCOUNT STATEMENT'
      : 'ESTRATTO CONTO MENSILE';
  doc.text(`MYFINANCE PRO - ${titleText}`, margin + 6.5, cursorY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text(
    `${isDe ? 'Zeitraum' : isEn ? 'Period' : 'Periodo di riferimento'}: ${monthLabel}`,
    margin + 6.5,
    cursorY + 15.5
  );

  if (input.holderName || input.holderEmail) {
    const holderStr = [input.holderName, input.holderEmail].filter(Boolean).join(' • ');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `${isDe ? 'Kontoinhaber' : isEn ? 'Account Holder' : 'Titolare'}: ${holderStr}`,
      margin + 6.5,
      cursorY + 22.5
    );
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${isDe ? 'Erstellt am' : isEn ? 'Issued' : 'Emesso'}: ${new Date().toLocaleDateString(locale)}`,
    pageWidth - margin - 4,
    cursorY + 9,
    { align: 'right' }
  );
  doc.text(
    `${monthTransactions.length} ${isDe ? 'Buchungen' : isEn ? 'transactions' : 'movimenti'}`,
    pageWidth - margin - 4,
    cursorY + 15.5,
    { align: 'right' }
  );

  cursorY += 34;

  // Section 1: Summary by Currency
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    isDe
      ? '1. MONATLICHE ZUSAMMENFASSUNG NACH WÄHRUNG'
      : isEn
        ? '1. MONTHLY SUMMARY BY CURRENCY'
        : '1. RIEPILOGO MENSILE PER VALUTA',
    margin,
    cursorY
  );
  cursorY += 4;

  Object.entries(currencyMap).forEach(([currCode, stats]) => {
    ensureSpace(18);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, cursorY, contentWidth, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(79, 70, 229);
    doc.text(currCode, margin + 4, cursorY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${isDe ? 'Einnahmen' : isEn ? 'Income' : 'Entrate'}: ${formatPdfCurrencyWithCode(stats.income, currCode)}`,
      margin + 22,
      cursorY + 5.5
    );
    doc.text(
      `${isDe ? 'Ausgaben' : isEn ? 'Expenses' : 'Uscite'}: ${formatPdfCurrencyWithCode(stats.expense, currCode)}`,
      margin + 75,
      cursorY + 5.5
    );

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(stats.net >= 0 ? 16 : 225, stats.net >= 0 ? 185 : 29, stats.net >= 0 ? 129 : 72);
    doc.text(
      `${isDe ? 'Netto' : isEn ? 'Net' : 'Saldo Mese'}: ${stats.net >= 0 ? '+' : ''}${formatPdfCurrencyWithCode(stats.net, currCode)}`,
      margin + 22,
      cursorY + 11
    );

    doc.setTextColor(15, 23, 42);
    doc.text(
      `${isDe ? 'Aktueller Kontostand' : isEn ? 'Current Balance' : 'Saldo Conti Attuale'}: ${formatPdfCurrencyWithCode(stats.balance, currCode)}`,
      pageWidth - margin - 4,
      cursorY + 11,
      { align: 'right' }
    );

    cursorY += 16.5;
  });

  cursorY += 3;

  // Section 2: Accounts Overview
  ensureSpace(22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    isDe
      ? '2. SALDEN DER KONTEN'
      : isEn
        ? '2. ACCOUNT BALANCES'
        : '2. SITUAZIONE CONTI',
    margin,
    cursorY
  );
  cursorY += 4;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, cursorY, contentWidth, 6.5, 1, 1, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(isDe ? 'Konto' : isEn ? 'Account' : 'Conto', margin + 3, cursorY + 4.5);
  doc.text(isDe ? 'Typ' : isEn ? 'Type' : 'Tipologia', margin + 78, cursorY + 4.5);
  doc.text(isDe ? 'Währung' : isEn ? 'Currency' : 'Valuta', margin + 122, cursorY + 4.5);
  doc.text(isDe ? 'Saldo' : isEn ? 'Balance' : 'Saldo', pageWidth - margin - 3, cursorY + 4.5, { align: 'right' });
  cursorY += 8.5;

  input.accounts.forEach((acc) => {
    ensureSpace(8);
    const bal = Number(input.balances[acc.id] ?? 0);
    const code = getCurrencyCode(acc.currency);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(acc.name.slice(0, 32), margin + 3, cursorY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text((acc.type || '-').slice(0, 20), margin + 78, cursorY);
    doc.text(code, margin + 122, cursorY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(bal >= 0 ? 16 : 225, bal >= 0 ? 185 : 29, bal >= 0 ? 129 : 72);
    doc.text(formatPdfCurrencyWithCode(bal, code), pageWidth - margin - 3, cursorY, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, cursorY + 1.8, pageWidth - margin, cursorY + 1.8);
    cursorY += 5.5;
  });

  cursorY += 5;

  // Section 3: Monthly Transactions
  ensureSpace(22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    isDe
      ? `3. BUCHUNGEN IM MONAT (${monthTransactions.length})`
      : isEn
        ? `3. MONTHLY TRANSACTIONS (${monthTransactions.length})`
        : `3. DETTAGLIO MOVIMENTI DEL MESE (${monthTransactions.length})`,
    margin,
    cursorY
  );
  cursorY += 4;

  const drawTxHeader = () => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, cursorY, contentWidth, 6.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(isDe ? 'Datum' : isEn ? 'Date' : 'Data', margin + 3, cursorY + 4.5);
    doc.text(isDe ? 'Beschreibung' : isEn ? 'Description' : 'Descrizione', margin + 25, cursorY + 4.5);
    doc.text(isDe ? 'Konto' : isEn ? 'Account' : 'Conto', margin + 92, cursorY + 4.5);
    doc.text(isDe ? 'Kategorie' : isEn ? 'Category' : 'Categoria', margin + 125, cursorY + 4.5);
    doc.text(isDe ? 'Betrag' : isEn ? 'Amount' : 'Importo', pageWidth - margin - 3, cursorY + 4.5, { align: 'right' });
    cursorY += 8.5;
  };

  if (monthTransactions.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      isDe
        ? 'Keine Buchungen für diesen Monat gefunden.'
        : isEn
          ? 'No transactions recorded for this month.'
          : 'Nessun movimento registrato per questo mese.',
      margin + 3,
      cursorY + 4
    );
    cursorY += 10;
  } else {
    drawTxHeader();
    monthTransactions.forEach((tx) => {
      if (cursorY > 272) {
        drawFooter(currentPage);
        doc.addPage();
        currentPage += 1;
        cursorY = margin;
        drawTxHeader();
      }

      const isExpense = tx.type === 'EXPENSE';
      const isTransfer = tx.type === 'TRANSFER';
      const code = getTxCurrency(tx);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(tx.date, margin + 3, cursorY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      let desc = tx.description || '-';
      if (desc.length > 34) desc = desc.slice(0, 32) + '..';
      doc.text(desc, margin + 25, cursorY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const accLabel = isTransfer
        ? `${tx.fromAccount || ''}->${tx.toAccount || ''}`
        : tx.account || '-';
      doc.text(accLabel.length > 16 ? accLabel.slice(0, 14) + '..' : accLabel, margin + 92, cursorY);

      doc.setTextColor(100, 116, 139);
      const catLabel = tx.category ? getCategoryDisplayName(tx.category, lang) : '-';
      doc.text(catLabel.length > 16 ? catLabel.slice(0, 14) + '..' : catLabel, margin + 125, cursorY);

      doc.setFont('helvetica', 'bold');
      if (isExpense) doc.setTextColor(225, 29, 72);
      else if (isTransfer) doc.setTextColor(99, 102, 241);
      else doc.setTextColor(16, 185, 129);

      const sign = isExpense ? '-' : isTransfer ? '~ ' : '+';
      doc.text(
        `${sign}${formatPdfCurrencyWithCode(tx.amount, code)}`,
        pageWidth - margin - 3,
        cursorY,
        { align: 'right' }
      );

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, cursorY + 1.8, pageWidth - margin, cursorY + 1.8);
      cursorY += 5.2;
    });
  }

  drawFooter(currentPage);

  const safePrefix = isDe
    ? 'Kontoauszug_MyFinance'
    : isEn
      ? 'Monthly_Statement_MyFinance'
      : 'Estratto_Conto_MyFinance';
  const fileName = `${safePrefix}_${input.monthKey}.pdf`;
  const blob = doc.output('blob');
  const dataUri = doc.output('datauristring');
  const base64 = dataUri.includes(',') ? dataUri.split(',')[1] : '';
  const file = new File([blob], fileName, { type: 'application/pdf' });

  return { file, fileName, blob, base64 };
}

export function buildAppIntroPdfDocument(language: Language = 'it'): {
  doc: jsPDF;
  fileName: string;
} {
  const lang: Language = language || 'it';
  const isDe = lang === 'de';
  const isEn = lang === 'en';
  const locale = isDe ? 'de-DE' : isEn ? 'en-US' : 'it-IT';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.text(
      '© 2026 Federico Pontedoro. All rights reserved. - MyFinance Pro · Mobile & APK Edition',
      margin,
      pageHeight - 9
    );
    const pgLabel = isDe
      ? `Seite ${pageNum} von ${totalPages}`
      : isEn
        ? `Page ${pageNum} of ${totalPages}`
        : `Pagina ${pageNum} di ${totalPages}`;
    doc.text(pgLabel, pageWidth - margin, pageHeight - 9, { align: 'right' });
  };

  const drawSectionHeader = (title: string) => {
    doc.setFillColor(238, 242, 255); // Indigo 50
    doc.roundedRect(margin, cursorY, contentWidth, 7.5, 1.5, 1.5, 'F');
    doc.setFillColor(79, 70, 229); // Indigo 600 accent bar
    doc.rect(margin, cursorY, 2.5, 7.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(title, margin + 5.5, cursorY + 5.2);
    cursorY += 11;
  };

  const drawParagraph = (text: string, fontSize = 8.5, color: [number, number, number] = [51, 65, 85]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, contentWidth - 2);
    doc.text(lines, margin + 1, cursorY);
    cursorY += lines.length * (fontSize * 0.45) + 2;
  };

  // ==================== PAGE 1 ====================
  // White Header Banner (Testata Bianca)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 32, 2.5, 2.5, 'FD');
  doc.setFillColor(79, 70, 229);
  doc.rect(margin, cursorY, 3, 32, 'F');
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.6);
  doc.line(margin, cursorY + 32, pageWidth - margin, cursorY + 32);
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('MYFINANCE PRO', margin + 7, cursorY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229);
  doc.text(
    isDe
      ? 'Einführung & Kurzanleitung (Web, Mobile & Android APK)'
      : isEn
        ? 'Introduction & Quick Start Guide (Web, Mobile & Android APK)'
        : 'Introduzione & Guida Rapida (Web, Smartphone & Android APK)',
    margin + 7,
    cursorY + 18.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    isDe
      ? 'Persönliche Finanzverwaltung · 100% Lokal & Mehrsprachig (IT / DE / EN)'
      : isEn
        ? 'Personal Finance App · 100% Local Privacy & Multilingual (IT / DE / EN)'
        : 'Finanza Personale · Privacy 100% Locale & Multilingua (IT / DE / EN)',
    margin + 7,
    cursorY + 25.5
  );

  doc.setFontSize(7.5);
  doc.text(
    `${isDe ? 'Stand' : isEn ? 'Edition' : 'Edizione'}: ${new Date().toLocaleDateString(locale)}`,
    pageWidth - margin - 4,
    cursorY + 11,
    { align: 'right' }
  );
  doc.text('v3.2 Pro', pageWidth - margin - 4, cursorY + 18, { align: 'right' });

  cursorY += 37;

  // Welcome Intro Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  const welcomeText = isDe
    ? 'MyFinance Pro ist Ihre umfassende App für persönliche Finanzen: Kontostände in mehreren Währungen, Monatsend-Prognosen, Budget-Warnungen, automatische Kategorisierungsregeln, CSV/Excel-Import und A4-PDF-Berichte. Alle Daten bleiben geschützt im lokalen Speicher Ihres Geräts und funktionieren auch komplett offline.'
    : isEn
      ? 'MyFinance Pro is your all-in-one personal finance companion: multi-currency net worth tracking, end-of-month cashflow forecasts, smart budget alerts, automatic keyword rules & #tags, bank CSV/Excel import, and A4 PDF reports. All your records stay privately stored on your device and work completely offline.'
      : 'MyFinance Pro è la tua app completa per la finanza personale: patrimonio netto unificato multi-valuta, previsione di fine mese, allarmi budget, regole automatiche con #tag, importazione estratti conto CSV/Excel e report PDF A4. Tutti i dati restano salvati in sicurezza sul tuo dispositivo e funzionano anche offline.';
  const welcomeLines = doc.splitTextToSize(welcomeText, contentWidth - 10);
  const welcomeBoxH = welcomeLines.length * 4.1 + 10;
  doc.roundedRect(margin, cursorY, contentWidth, welcomeBoxH, 2.5, 2.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text(
    isDe ? 'WARUM MYFINANCE PRO?' : isEn ? 'WHY MYFINANCE PRO?' : 'COSA OFFRE MYFINANCE PRO',
    margin + 5,
    cursorY + 5.5
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(welcomeLines, margin + 5, cursorY + 10.5);
  cursorY += welcomeBoxH + 6;

  // Section 1: First Launch & Security
  drawSectionHeader(
    isDe
      ? '1. Erster Start, Registrierung & Datenschutz'
      : isEn
        ? '1. First Launch, Registration & Privacy'
        : '1. Primo Avvio, Registrazione & Sicurezza Locale'
  );
  drawParagraph(
    isDe
      ? '- Schnelle Ersteinrichtung: Beim ersten Öffnen wählen Sie Ihre bevorzugte Sprache (Italiano, Deutsch, English) und hinterlegen Ihren Namen sowie Ihre E-Mail-Adresse (für monatliche PDF-Kontoauszüge).'
      : isEn
        ? '- Guided onboarding: On first launch, select your preferred language (Italiano, Deutsch, English) and enter your name and email address (used for monthly PDF statements).'
        : '- Schermata iniziale dedicata: al primo avvio scegli la lingua preferita (Italiano, Deutsch, English) e inserisci nome, cognome ed email (utilizzata per gli estratti conto PDF mensili).'
  );
  drawParagraph(
    isDe
      ? '- PIN-Sperre & lokaler Speicher: Sie können jederzeit eine 4- bis 6-stellige PIN mit automatischer Sperre aktivieren. Ihre Finanzdaten liegen isoliert in IndexedDB & LocalStorage und gehen beim Löschen des Browser-Verlaufs nicht verloren.'
      : isEn
        ? '- Optional PIN & Isolated Storage: Enable a 4-6 digit PIN lock with auto-timeout. All accounts and transactions are saved locally in IndexedDB & LocalStorage, independent from browser history.'
        : '- Protezione PIN & Memoria Isolata: puoi attivare un PIN di sicurezza con blocco automatico al cambio app. Conti e movimenti risiedono in IndexedDB e LocalStorage, separati dalla cronologia del browser.'
  );
  cursorY += 2;

  // Section 2: The 5 Main Tabs (2-column cards)
  drawSectionHeader(
    isDe
      ? '2. Aufbau der App: Die 5 Bereiche im Überblick'
      : isEn
        ? '2. App Navigation: The 5 Core Tabs'
        : '2. Struttura dell\'App: Le 5 Schede Principali'
  );

  const tabCards = isDe
    ? [
        {
          title: 'Home (Dashboard)',
          desc: 'Konsolidiertes Gesamtvermögen in Basiswährung, Konten-Karussell, Schnellaktionen (Neu, Umbuchung, CSV), Favoriten, Monatsend-Prognose, Budget-Warnungen und Fälligkeiten.',
        },
        {
          title: 'Buchungen (Movimenti)',
          desc: 'Sofortsuche und kombinierte Filter nach Zeitraum, Typ, Konto, Kategorie und #Tag. Bearbeiten, auf heute duplizieren oder gefilterten Kontoauszug als PDF drucken.',
        },
        {
          title: 'Budgets & Sparziele',
          desc: 'Monatliche Ausgabenlimits pro Kategorie mit Status-Ampel (Überschritten, Warnung, Tempo-Risiko), Tagesbudget, Sparzielen sowie Schulden & Raten.',
        },
        {
          title: 'Analysen & Diagramme',
          desc: 'Vermögensverlauf über die Zeit, Ausgabenverteilung nach Kategorie, Monatsvergleich (MoM) und #Tag-Auswertung in Ihrer Basiswährung.',
        },
        {
          title: 'Einstellungen & Backup',
          desc: 'Konten, Kategorien, automatische Regeln, Wechselkurse, PIN-/Fingerabdruck-Sperre, tägliches Auto-Backup (.JSON), E-Mail-Kontoauszug sowie Android APK.',
        },
      ]
    : isEn
      ? [
          {
            title: 'Home Dashboard',
            desc: 'Unified net worth in base currency, accounts carousel, 1-tap quick actions (New, Transfer, CSV), Favorites, End-of-Month Forecast, Budget Alerts, and Upcoming Bills.',
          },
          {
            title: 'Transactions',
            desc: 'Instant search and multi-filters by period, type, account, category, and #tag. Edit, duplicate to today in 1 tap, or export filtered PDF statements.',
          },
          {
            title: 'Budgets, Goals & Debts',
            desc: 'Category monthly budgets with status alerts (Exceeded, Warning, Pacing Risk) and daily allowance, savings jars, plus Debts & Installments.',
          },
          {
            title: 'Analytics',
            desc: 'Interactive balance history trend, category expense breakdown, Month-over-Month diff, and #Tag summary - all converted into your base currency.',
          },
          {
            title: 'Settings & APK Tools',
            desc: 'Manage accounts, categories, keyword rules, FX rates, PIN/Biometric lock, daily auto-backup (.JSON), monthly PDF email statements, and Android APK export.',
          },
        ]
      : [
          {
            title: 'Home (Cruscotto)',
            desc: 'Patrimonio netto unificato in valuta base, carosello conti, azioni rapide (Nuova, Giroconto, CSV), Spese Preferite, Previsione Fine Mese, Allarmi Budget e Scadenzario.',
          },
          {
            title: 'Movimenti',
            desc: 'Ricerca istantanea e filtri per periodo, tipo, conto, categoria e #tag. Modifica rapida, duplica movimento ad oggi e stampa/esportazione PDF filtrata.',
          },
          {
            title: 'Budget, Obiettivi & Debiti',
            desc: 'Limiti mensili per categoria con allarmi chiari e margine giornaliero residuo, salvadanai obiettivi e gestione Debiti, Rate & Crediti.',
          },
          {
            title: 'Analisi & Grafici',
            desc: 'Andamento storico del patrimonio, ripartizione spese, confronto Mese vs Mese e riepilogo per #tag convertiti nella tua valuta base.',
          },
          {
            title: 'Impostazioni & APK',
            desc: 'Gestione conti, categorie, regole automatiche, tassi di cambio, PIN e impronta digitale, backup automatico (.JSON), estratto conto PDF e pacchetto APK.',
          },
        ];

  const colW = (contentWidth - 4) / 2;
  for (let i = 0; i < tabCards.length; i += 2) {
    const rowItems = [tabCards[i], tabCards[i + 1]].filter(Boolean);
    const linesList = rowItems.map((item) => doc.splitTextToSize(item.desc, colW - 8));
    const maxLines = Math.max(...linesList.map((l) => l.length));
    const cardH = Math.max(24, maxLines * 3.7 + 11);

    rowItems.forEach((item, colIdx) => {
      const x = margin + colIdx * (colW + 4);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, cursorY, colW, cardH, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(79, 70, 229);
      doc.text(item.title, x + 4, cursorY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(71, 85, 105);
      doc.text(linesList[colIdx], x + 4, cursorY + 10.5);
    });

    cursorY += cardH + 3.5;
  }

  drawFooter(1, 2);

  // ==================== PAGE 2 ====================
  doc.addPage();
  cursorY = margin;

  // Mini White Header on Page 2
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 14, 2, 2, 'FD');
  doc.setFillColor(79, 70, 229);
  doc.rect(margin, cursorY, 2.5, 14, 'F');
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY + 14, pageWidth - margin, cursorY + 14);
  doc.setLineWidth(0.2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(
    isDe
      ? 'MYFINANCE PRO - ERWEITERTE FUNKTIONEN & PRAXISTIPPS'
      : isEn
        ? 'MYFINANCE PRO - ADVANCED FEATURES & DAILY WORKFLOW'
        : 'MYFINANCE PRO - FUNZIONI AVANZATE & USO QUOTIDIANO',
    margin + 6.5,
    cursorY + 9
  );
  cursorY += 20;

  // Section 3: Multi-Currency & Forecast
  drawSectionHeader(
    isDe
      ? '3. Multi-Währungs-Vermögen & Monatsend-Prognose'
      : isEn
        ? '3. Multi-Currency Net Worth & Cashflow Forecast'
        : '3. Patrimonio Multi-Valuta & Previsione di Fine Mese'
  );
  drawParagraph(
    isDe
      ? '- 5 Währungen (EUR, USD, GBP, JPY, CHF): Jedes Konto behält seinen echten Originalsaldo. Im Home-Banner und in den Analysen werden alle Beträge anhand aktueller EZB-Kurse (oder eigener manueller Kurse) in Ihre gewählte Basiswährung umgerechnet.'
      : isEn
        ? '- 5 Currencies (EUR, USD, GBP, JPY, CHF): Each account keeps its exact native balance, while Home Net Worth, Budgets, and Analytics automatically convert totals into your selected base currency using live ECB rates or custom offline overrides.'
        : '- 5 Valute Supportate (EUR, USD, GBP, JPY, CHF): ogni conto mantiene il saldo reale nella propria valuta nativa; Patrimonio Netto, Budget e Analisi convertono automaticamente tutto nella tua Valuta Base con tassi BCE live o modificabili manualmente offline.'
  );
  drawParagraph(
    isDe
      ? '- Monatsend-Prognose & Budget-Warnungen: Die App kombiniert bereits gebuchte Umsätze, noch ausstehende Dauerbuchungen bis Monatsende und Ihr tägliches Ausgabentempo, um den voraussichtlichen Kontostand am Monatsende sowie Risiko-Kategorien frühzeitig anzuzeigen.'
      : isEn
        ? '- Cashflow Forecast & Budget Alerts: The forecast card combines month-to-date activity, remaining scheduled recurring items, and your variable daily spending pace to project your end-of-month balance and flag categories at pacing risk.'
        : '- Previsione Fine Mese & Allarmi Budget: la scheda previsionale unisce entrate/uscite reali del mese, scadenze ricorrenti attese e ritmo medio giornaliero delle spese variabili per stimare il saldo finale del mese e segnalare in anticipo eventuali budget a rischio.'
  );
  cursorY += 2;

  // Section 4: Rules, Tags & CSV/Excel Import
  drawSectionHeader(
    isDe
      ? '4. Automatische Regeln, #Tags & Kontoauszug-Import'
      : isEn
        ? '4. Auto-Categorization Rules, #Tags & Statement Import'
        : '4. Regole Automatiche, #Tag & Importazione Bancaria'
  );
  drawParagraph(
    isDe
      ? '- Schlüsselwort-Regeln: Legen Sie unter Einstellungen -> Regeln Regeln wie "rewe, lidl -> Lebensmittel + #supermarkt" an. Sie greifen live bei neuen Buchungen, beim CSV-Import sowie rückwirkend auf Knopfdruck für den gesamten Verlauf.'
      : isEn
        ? '- Keyword Rules: Define rules under Settings -> Auto Rules (e.g. "lidl, coop -> Groceries + #supermarket"). Rules trigger live while typing, during CSV import, or retroactively across existing history.'
        : '- Regole per Parole Chiave: in Impostazioni -> Regole Automatiche imposti parole chiave (es. "esselunga, coop -> Alimentari + #supermercato") che assegnano automaticamente categoria e #tag ai nuovi movimenti, alle importazioni CSV o allo storico con un clic.'
  );
  drawParagraph(
    isDe
      ? '- CSV- & Excel-Import: Importieren Sie Bankauszüge (.csv, .xlsx) mit automatischer Spaltenerkennung, Duplikat-Prüfung und sofortiger Regelanwendung.'
      : isEn
        ? '- CSV / Excel Statement Import: Load bank exports (.csv, .xlsx) with smart column detection, automatic duplicate prevention, and rule matching before saving.'
        : '- Importazione Estratti Conto CSV / Excel: carica file bancari con riconoscimento automatico delle colonne, filtro anti-duplicati intelligente e applicazione immediata delle regole.'
  );
  cursorY += 2;

  // Section 5: Recurring & Monthly PDF Email
  drawSectionHeader(
    isDe
      ? '5. Dauerbuchungen & Monatlicher PDF-Kontoauszug'
      : isEn
        ? '5. Recurring Schedules & Monthly Email PDF'
        : '5. Scadenzario Ricorrenti & Estratto Conto Email'
  );
  drawParagraph(
    isDe
      ? '- Dauerbuchungen & Monatsauszug: Planen Sie Miete, Gehalt oder Abos (manuell oder vollautomatisch bei Fälligkeit) und erstellen oder versenden Sie den monatlichen PDF-Kontoauszug direkt an Ihre registrierte E-Mail.'
      : isEn
        ? '- Recurring Bills & Monthly Statement: Automate salaries, rent, and subscriptions on schedule, and generate or send your A4 monthly PDF statement directly to your registered email.'
        : '- Movimenti Ricorrenti & Estratto Conto PDF: gestisci stipendi, affitti e abbonamenti nello Scadenzario e genera o invia via email il riepilogo mensile PDF A4.'
  );
  cursorY += 2;

  // Section 6: Standalone APK & Biometric Lock
  drawSectionHeader(
    isDe
      ? '6. Android APK Paket & Biometrische Sperre'
      : isEn
        ? '6. Standalone APK Package & Biometric Lock'
        : '6. Versione Standalone, APK Android & Impronta'
  );
  drawParagraph(
    isDe
      ? '- Offline APK / HTML-Paket: Unter Einstellungen können Sie myfinance_app.html oder myfinance_app.zip herunterladen, um die App als eigenständige Android-APK zu verpacken. Aktivieren Sie zudem PIN & Fingerabdruck-Entsperrung für maximalen Schutz.'
      : isEn
        ? '- Standalone HTML / APK Ready: Export myfinance_app.html or myfinance_app.zip from Settings to wrap as an Android APK. Enable PIN & Fingerprint biometric unlock for fast local security.'
        : '- Pacchetto Offline & APK Android: dalle Impostazioni puoi scaricare myfinance_app.html o myfinance_app.zip per convertirli in APK Android. Attiva anche lo sblocco con PIN e Impronta Digitale.'
  );
  cursorY += 3;

  // Quick Checklist Box
  const checklistItems = isDe
    ? [
        '1. Konto-Währungen und Basiswährung unter Einstellungen -> Wechselkurse festlegen.',
        '2. 2-3 Monatsbudgets und häufige Schlüsselwort-Regeln (#Tags) anlegen.',
        '3. Wiederkehrende Fixkosten im Fälligkeitsplaner (Scadenzario) eintragen.',
        '4. Tägliches Auto-Backup und monatlichen PDF-Kontoauszug aktivieren.',
      ]
    : isEn
      ? [
          '1. Set your account currencies and preferred Base Currency in Settings.',
          '2. Configure 2-3 monthly category budgets and your top keyword #tag rules.',
          '3. Add fixed recurring bills & income in the Recurring Scheduler.',
          '4. Enable Daily Auto-Backup and Monthly PDF Email Statements.',
        ]
      : [
          '1. Verifica le valute dei conti e scegli la Valuta Base nelle Impostazioni.',
          '2. Imposta 2-3 budget mensili e crea le regole automatiche con i tuoi #tag.',
          '3. Inserisci stipendi, affitti e abbonamenti nello Scadenzario ricorrenti.',
          '4. Attiva il Backup Automatico e l\'Estratto Conto Mensile in PDF.',
        ];

  const boxH = checklistItems.length * 5.2 + 12;
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(167, 243, 208); // Emerald 200
  doc.roundedRect(margin, cursorY, contentWidth, boxH, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70);
  doc.text(
    isDe
      ? '4 SCHRITTE FÜR DEN OPTIMALEN START'
      : isEn
        ? '4 QUICK STEPS TO GET STARTED'
        : '4 PASSI CONSIGLIATI PER INIZIARE SUBITO',
    margin + 5,
    cursorY + 6
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.3);
  doc.setTextColor(30, 41, 59);
  let checkY = cursorY + 12;
  checklistItems.forEach((line) => {
    doc.text(line, margin + 5, checkY);
    checkY += 5.2;
  });

  drawFooter(2, 2);

  const fileName = isDe
    ? 'MyFinance_Pro_Einfuehrung.pdf'
    : isEn
      ? 'MyFinance_Pro_Introduction.pdf'
      : 'MyFinance_Pro_Introduzione.pdf';

  return { doc, fileName };
}

export function generateAppIntroPdf(language: Language = 'it'): string {
  const { doc, fileName } = buildAppIntroPdfDocument(language);
  doc.save(fileName);
  return fileName;
}

export {
  buildCompleteGuidePdfDocument,
  generateCompleteGuidePdf,
  buildTrilingualCompleteGuidePdfDocument,
  generateTrilingualCompleteGuidePdf,
} from './completeGuidePdf';



