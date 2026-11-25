export type Language = 'it' | 'de' | 'en';

export interface Translations {
  // Common & Header
  appTitle: string;
  appSubtitle: string;
  offlineBadge: string;
  quickTransfer: string;
  printExportPdf: string;
  languageSelect: string;

  // Bottom Nav
  navHome: string;
  navTransactions: string;
  navBudgets: string;
  navAnalytics: string;
  navSettings: string;

  // Banner & Overall Metrics
  totalNetWorth: string;
  totalIncomeLabel: string;
  totalExpenseLabel: string;
  totalLabel: string;
  incomeWord: string;
  expenseWord: string;
  savingsRateLabel: string;
  dailyAvgLabel: string;
  subtextRealtime: string;

  // Financial Accounts
  financialAccounts: string;
  manageEdit: string;
  quickTransferBtn: string;
  allAccounts: string;
  fromAccountLabel: string;
  toAccountLabel: string;
  amountLabel: string;
  noteLabel: string;
  confirmTransferBtn: string;
  cancelBtn: string;
  activeAccount: string;
  accountLabel: string;
  prevAccountLabel: string;
  nextAccountLabel: string;

  // Recent Transactions on Home
  recentTransactions: string;
  viewAll: string;
  noRecentTransactions: string;

  // Transactions Tab
  transactionsTitle: string;
  searchPlaceholder: string;
  periodFilterLabel: string;
  typeFilterLabel: string;
  accountFilterLabel: string;
  categoryFilterLabel: string;
  allTypes: string;
  incomeType: string;
  expenseType: string;
  transferType: string;
  allAccountsOption: string;
  allCategoriesOption: string;
  noTransactionsFound: string;
  noTransactionsFoundSub: string;
  printStatementBtn: string;
  resetFiltersBtn: string;
  newTransactionBtn: string;

  // Period Chips
  periodAll: string;
  periodToday: string;
  periodYesterday: string;
  periodCurrentWeek: string;
  periodLastWeek: string;
  periodMonth: string;
  periodLastMonth: string;
  periodYear: string;
  periodLastYear: string;
  periodCustom: string;
  dateRangeFilterTitle: string;
  dateFromLabel: string;
  dateToLabel: string;
  clearDateRange: string;
  dateRangeActiveLabel: string;
  quickDays7: string;
  quickDays30: string;
  filtersResetToast: string;

  // Budgets & Goals
  budgetsGoalsTitle: string;
  monthlySpendingBudgets: string;
  setBudgetBtn: string;
  savingsGoalsTitle: string;
  newGoalBtn: string;
  editBudgetsBtn: string;
  addGoalBtn: string;
  spentOf: string;
  savedOf: string;
  targetDateLabel: string;
  noBudgetsSet: string;
  noBudgetsSetSub: string;
  noGoalsSet: string;
  noGoalsSetSub: string;
  currentMonth: string;
  percentUsed: string;
  goalCompleted: string;
  goalDeadline: string;
  goalProgress: string;
  addFundsBtn: string;

  // Analytics Tab
  analyticsTitle: string;
  chartTrend: string;
  chartExpensesPie: string;
  chartAccounts: string;
  chartMonthly6M: string;
  balanceHistoryTitle: string;
  balanceTrend: string;
  expensesByCategory: string;
  monthlyComparison: string;
  averageDailyExpense: string;
  totalSavings: string;
  totalExpensesCount: string;
  period30D: string;
  period90D: string;
  period1Y: string;
  periodAllTime: string;
  currentBalanceLabel: string;
  minBalanceLabel: string;
  maxBalanceLabel: string;
  dailyAverageExpenseTitle: string;
  totalPeriodExpenses: string;
  accountsBreakdown: string;
  monthlyExpensesIncomes: string;
  savingsRateTrend: string;

  // Settings Tab
  settingsTitle: string;
  configSectionTitle: string;
  manageAccountsBtn: string;
  manageCategoriesBtn: string;
  reconcileBalancesBtn: string;
  reconcileBalancesDesc: string;
  verifyBadge: string;
  recurringTitle: string;
  recurringConfigured: string;
  manageAllRecurringBtn: string;
  searchRecurringPlaceholder: string;
  noRecurringFound: string;
  noRecurringSaved: string;
  applyRecurringBtn: string;
  languageSection: string;
  languageDesc: string;
  italian: string;
  german: string;
  english: string;
  otherSmartphones: string;
  otherSmartphonesTitle: string;
  otherSmartphonesDesc: string;
  shareAppDesc: string;
  copyLinkBtn: string;
  shareTip: string;
  exportBackupSection: string;
  exportJsonBtn: string;
  exportCsvBtn: string;
  downloadHtmlBtn: string;
  downloadHtmlBadge: string;
  downloadZipBtn: string;
  downloadZipBadge: string;
  downloadZipToast: string;
  copyBackupBtn: string;
  restoreSection: string;
  importJsonBtn: string;
  pasteJsonBtn: string;
  monthlyReportBtn: string;
  monthlyReportDesc: string;
  resetDemoBtn: string;
  resetDemoDesc: string;
  localStorageSecurityInfo: string;
  accountsModalTitle: string;
  accountsModalSubtitle: string;
  activeAccountsTitle: string;
  accountNameLabel: string;
  chooseIconLabel: string;
  themeColorLabel: string;
  saveAccountBtn: string;
  updateAccountBtn: string;

  // Common Actions
  edit: string;
  delete: string;
  close: string;
  save: string;
  cancel: string;

  // Currency & Formatting
  currencySymbol: string;
  currencyName: string;

  // Zoom Controls
  zoomTitle: string;
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;

  // Toasts & Dialogs
  languageChangedToast: string;
  backupDownloadedToast: string;
  backupCopiedToast: string;
  htmlDownloadedToast: string;
  resetConfirmMessage: string;
  demoRestoredToast: string;
  appliedRecurringToast: string;
  linkCopiedToast: string;

  // Print & PDF Center
  printCenterTitle: string;
  printCenterSubtitle: string;
  tabStatement: string;
  tabMonthlyReport: string;
  tabAccountsBalance: string;
  tabScreenPrint: string;
  filterAccountLabel: string;
  filterPeriodLabel: string;
  allTransactionsOption: string;
  currentMonthOption: string;
  lastMonthOption: string;
  currentYearOption: string;
  summaryIncome: string;
  summaryExpenses: string;
  summaryNetBalance: string;
  summarySavings: string;
  documentPreview: string;
  bankingA4Format: string;
  andOtherTransactions: string;
  noTransactionsFilter: string;
  directPrintA4Btn: string;
  downloadPdfA4Btn: string;
  copySummaryBtn: string;
  copiedBadge: string;
  officialReportBadge: string;
  monthOf: string;
  transactionsCount: string;
  topSpendingCategories: string;
  printMonthlyReportBtn: string;
  downloadMonthlyPdfBtn: string;
  consolidatedNetWorth: string;
  accountsCount: string;
  standardAccount: string;
  printAccountBalancesBtn: string;
  downloadAccountBalancesPdfBtn: string;
  directBrowserPrintTitle: string;
  directBrowserPrintDesc: string;
  directBrowserPrintTip: string;
  printCurrentScreenBtn: string;
  printWindowOpenedToast: string;
  statementPdfDownloadedToast: string;
  monthlyPdfDownloadedToast: string;
  balancesPdfDownloadedToast: string;
  summaryCopiedToast: string;
  rowsWord: string;

  // Monthly Report Modal in SettingsTab
  monthlyReportModalTitle: string;
  monthlyReportModalSubtitle: string;
  totalAccountsBalanceLabel: string;
  activeAccountsCount: string;
  monthlyNetSavingsLabel: string;
  savingsRatePercent: string;
  monthlyIncomeLabel: string;
  monthlyExpensesLabel: string;
  topExpensesByCategory: string;
  categoriesCount: string;
  noExpensesThisMonth: string;
  savingsGoals: string;
  activeCount: string;
  noGoalsConfigured: string;
  printBtn: string;
  downloadPdfA4: string;
  generatingPdf: string;
  monthlyPdfGeneratedToast: string;
  monthlyPdfErrorToast: string;

  // Transfer Between Accounts (Giroconto tra Conti)
  transferModalTitle: string;
  transferInvalidAmount: string;
  transferSameAccountError: string;
  transferFromAccount: string;
  transferToAccount: string;
  transferReasonLabel: string;
  transferReasonPlaceholder: string;
  transferDateLabel: string;
  transferVerifyBtn: string;
  transferDefaultNote: string;
  transferSuccessToast: string;
  transferConfirmTitle: string;
  transferConfirmMessage: string;
  transferConfirmWarning: string;
  transferConfirmBtn: string;

  // Daily Automatic Backup
  autoBackupSectionTitle: string;
  autoBackupBadge: string;
  autoBackupConfigBtn: string;
  autoBackupActive: string;
  autoBackupDestinationLabel: string;
  autoBackupLastLabel: string;

  // App Lock & Security (Password & Profile)
  securitySectionTitle: string;
  securitySectionSubtitle: string;
  appLockStatusActive: string;
  appLockStatusInactive: string;
  securityConfigBtn: string;
  lockNowBtn: string;
  appLockedToast: string;
  lockScreenTitle: string;
  lockScreenSubtitle: string;
  passwordPlaceholder: string;
  unlockBtn: string;
  wrongPasswordError: string;
  passwordHintLabel: string;
  securityModalTitle: string;
  securityModalSubtitle: string;
  requirePasswordLabel: string;
  requirePasswordDesc: string;
  changePasswordBtn: string;
  setPasswordBtn: string;
  removePasswordBtn: string;
  autoLockDelayLabel: string;
  autoLockImmediate: string;
  autoLock1Min: string;
  autoLock5Min: string;
  autoLock15Min: string;
  currentPasswordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  passwordsMismatchError: string;
  passwordEmptyError: string;
  wrongCurrentPasswordError: string;
  passwordChangedToast: string;
  passwordSetToast: string;
  securityDisabledToast: string;
  numericKeypadBtn: string;
}

export const MONTH_NAMES: Record<Language, string[]> = {
  it: [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ],
  de: [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ],
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
};

export function formatLocalizedMonthYear(date: Date, lang: Language): string {
  const locale = lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-US' : 'it-IT';
  const name = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Complete category translations dictionary (Italian -> German & English)
export const CATEGORY_TRANSLATIONS: Record<string, { de: string; en: string }> = {
  'Stipendio / Reddito': { de: 'Gehalt / Einkommen', en: 'Salary / Income' },
  'Stipendio': { de: 'Gehalt', en: 'Salary' },
  'Reddito': { de: 'Einkommen', en: 'Income' },
  'Alimentari & Spesa': { de: 'Lebensmittel & Einkauf', en: 'Groceries & Food' },
  'Alimentari': { de: 'Lebensmittel', en: 'Groceries' },
  'Spesa': { de: 'Einkauf', en: 'Shopping' },
  'Casa & Utente': { de: 'Wohnung & Haushalt', en: 'Home & Utilities' },
  'Casa & Utenze': { de: 'Wohnung & Haushalt', en: 'Home & Utilities' },
  'Casa': { de: 'Wohnung', en: 'Home' },
  'Utenze': { de: 'Nebenkosten', en: 'Utilities' },
  'Canone & Commissione': { de: 'Gebühren & Provision', en: 'Fees & Commission' },
  'Imposta di Bollo': { de: 'Stempelsteuer', en: 'Stamp Duty / Tax' },
  'Ricarica Telefonica': { de: 'Handyguthaben', en: 'Phone Recharge' },
  'Viale Alpi 35': { de: 'Viale Alpi 35 (Miete)', en: 'Viale Alpi 35 (Rent)' },
  'Sali & Tabacchi': { de: 'Tabak & Kiosk', en: 'Tobacco & Newsstand' },
  'Ristoranti & Svago': { de: 'Restaurants & Freizeit', en: 'Restaurants & Leisure' },
  'Ristoranti': { de: 'Restaurants', en: 'Restaurants' },
  'Svago': { de: 'Freizeit', en: 'Leisure' },
  'Trasporti & Carburante': { de: 'Verkehr & Kraftstoff', en: 'Transport & Fuel' },
  'Trasporti': { de: 'Transport', en: 'Transport' },
  'Carburante': { de: 'Kraftstoff', en: 'Fuel' },
  'Salute & Cura': { de: 'Gesundheit & Pflege', en: 'Health & Personal Care' },
  'Salute': { de: 'Gesundheit', en: 'Health' },
  'Shopping & Vestiti': { de: 'Shopping & Kleidung', en: 'Shopping & Clothing' },
  'Shopping': { de: 'Shopping', en: 'Shopping' },
  'Vestiti': { de: 'Kleidung', en: 'Clothing' },
  'Abbonamenti & Servizi': { de: 'Abos & Dienste', en: 'Subscriptions & Services' },
  'Abbonamenti': { de: 'Abonnements', en: 'Subscriptions' },
  'Risparmi & Investimenti': { de: 'Sparen & Investitionen', en: 'Savings & Investments' },
  'Risparmi': { de: 'Ersparnisse', en: 'Savings' },
  'Investimenti': { de: 'Investitionen', en: 'Investments' },
  'Giroconto': { de: 'Umbuchung', en: 'Transfer' },
  'Altro': { de: 'Sonstiges', en: 'Other' },
};

export function getCategoryDisplayName(cat: string, lang: Language): string {
  if (!cat) return '';
  if (lang === 'it') return cat;
  const match = CATEGORY_TRANSLATIONS[cat];
  if (match && match[lang]) {
    return match[lang];
  }
  return cat;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  it: {
    appTitle: 'MyFinance',
    appSubtitle: 'Android Mobile Edition',
    offlineBadge: 'Offline',
    quickTransfer: 'Nuovo Giroconto tra Conti',
    printExportPdf: 'Stampa / Esporta PDF',
    languageSelect: 'Lingua / Sprache / Language',

    navHome: 'Home',
    navTransactions: 'Movimenti',
    navBudgets: 'Budget',
    navAnalytics: 'Analisi',
    navSettings: 'Opzioni',

    totalNetWorth: 'Patrimonio Totale',
    totalIncomeLabel: 'Totale Entrate',
    totalExpenseLabel: 'Totale Uscite',
    totalLabel: 'Totale',
    incomeWord: 'Entrate',
    expenseWord: 'Uscite',
    savingsRateLabel: 'Tasso di Risparmio',
    dailyAvgLabel: 'Spesa Media/Giorno',
    subtextRealtime: 'Calcolato in tempo reale su tutti i conti',

    financialAccounts: 'Conti Finanziari',
    manageEdit: 'Gestisci / Modifica',
    quickTransferBtn: 'Giroconto Rapido',
    allAccounts: 'Tutti i conti',
    fromAccountLabel: 'Dal conto',
    toAccountLabel: 'Al conto',
    amountLabel: 'Importo (€)',
    noteLabel: 'Causale / Nota',
    confirmTransferBtn: 'Esegui Giroconto',
    cancelBtn: 'Annulla',
    activeAccount: 'Attivo',
    accountLabel: 'Conto',
    prevAccountLabel: 'Conto precedente',
    nextAccountLabel: 'Conto successivo',

    recentTransactions: 'Ultimi Movimenti',
    viewAll: 'Vedi Tutti',
    noRecentTransactions: 'Nessun movimento registrato. Premi + per iniziare.',

    transactionsTitle: 'Movimenti',
    searchPlaceholder: 'Cerca descrizione, conto, categoria, importo...',
    periodFilterLabel: 'Periodo',
    typeFilterLabel: 'Tipo',
    accountFilterLabel: 'Conto',
    categoryFilterLabel: 'Categoria',
    allTypes: 'Tutti i tipi',
    incomeType: 'Entrate',
    expenseType: 'Uscite',
    transferType: 'Giroconti',
    allAccountsOption: 'Tutti i conti',
    allCategoriesOption: 'Tutte le categorie',
    noTransactionsFound: 'Nessun movimento trovato.',
    noTransactionsFoundSub: 'Prova a modificare i filtri o premi + per aggiungerne uno.',
    printStatementBtn: 'Stampa',
    resetFiltersBtn: 'Azzeramento',
    newTransactionBtn: 'Nuovo Movimento',

    periodAll: 'Tutto',
    periodToday: 'Oggi',
    periodYesterday: 'Ieri',
    periodCurrentWeek: 'Settimana corrente',
    periodLastWeek: 'Settimana scorsa',
    periodMonth: 'Mese corrente',
    periodLastMonth: 'Mese scorso',
    periodYear: 'Anno corrente',
    periodLastYear: 'Anno scorso',
    periodCustom: 'Intervallo date',
    dateRangeFilterTitle: 'Filtra per Data (Dal ... Al ...)',
    dateFromLabel: 'Dal',
    dateToLabel: 'Al',
    clearDateRange: 'Azzera date',
    dateRangeActiveLabel: 'Intervallo attivo',
    quickDays7: 'Ultimi 7 gg',
    quickDays30: 'Ultimi 30 gg',
    filtersResetToast: 'Filtri azzerati',

    budgetsGoalsTitle: 'Budget & Obiettivi',
    monthlySpendingBudgets: 'Budget Mensili',
    setBudgetBtn: 'Imposta Budget',
    savingsGoalsTitle: 'Obiettivi di Risparmio',
    newGoalBtn: 'Nuovo Obiettivo',
    editBudgetsBtn: 'Modifica Budget',
    addGoalBtn: 'Nuovo Obiettivo',
    spentOf: 'Spesi di',
    savedOf: 'Accumulati di',
    targetDateLabel: 'Scadenza',
    noBudgetsSet: 'Nessun budget configurato.',
    noBudgetsSetSub: 'Clicca su Imposta Budget in alto per definire i tuoi limiti di spesa.',
    noGoalsSet: 'Nessun obiettivo di risparmio impostato.',
    noGoalsSetSub: 'Clicca su Nuovo Obiettivo per fissare un traguardo finanziario.',
    currentMonth: 'Mese Corrente',
    percentUsed: 'Utilizzato',
    goalCompleted: 'Raggiunto!',
    goalDeadline: 'Scadenza',
    goalProgress: 'Avanzamento',
    addFundsBtn: '+ Deposita',

    analyticsTitle: 'Analisi & Statistiche',
    chartTrend: 'Andamento',
    chartExpensesPie: 'Torta Spese',
    chartAccounts: 'Conti',
    chartMonthly6M: 'Mesi (6M)',
    balanceHistoryTitle: 'Andamento Saldo nel Tempo',
    balanceTrend: 'Andamento del Saldo',
    expensesByCategory: 'Spese per Categoria',
    monthlyComparison: 'Confronto Mensile',
    averageDailyExpense: 'Spesa Media Giornaliera',
    totalSavings: 'Risparmio Netto',
    totalExpensesCount: 'Totale Uscite',
    period30D: '30 Giorni',
    period90D: '90 Giorni',
    period1Y: '1 Anno',
    periodAllTime: 'Tutto',
    currentBalanceLabel: 'Saldo Attuale',
    minBalanceLabel: 'Minimo',
    maxBalanceLabel: 'Massimo',
    dailyAverageExpenseTitle: 'Spesa Media Giornaliera',
    totalPeriodExpenses: 'Totale Spese Periodo',
    accountsBreakdown: 'Ripartizione Patrimonio tra Conti',
    monthlyExpensesIncomes: 'Entrate vs Uscite Ultimi 6 Mesi',
    savingsRateTrend: 'Tasso di Risparmio Mensile',

    settingsTitle: 'Opzioni, Backup & Ripristino',
    configSectionTitle: 'Configurazione Dati',
    manageAccountsBtn: 'Gestione & Modifica Conti',
    manageCategoriesBtn: 'Gestione Categorie',
    reconcileBalancesBtn: 'Ricalcolo Saldo & Verifica Coerenza',
    reconcileBalancesDesc: 'Verifica congruenza transazioni e correggi discrepanze',
    verifyBadge: 'Verifica',
    recurringTitle: 'Movimenti Ricorrenti',
    recurringConfigured: 'modelli configurati',
    manageAllRecurringBtn: 'Gestisci Tutti',
    searchRecurringPlaceholder: 'Cerca modello per nome o categoria...',
    noRecurringFound: 'Nessun modello corrispondente alla ricerca.',
    noRecurringSaved: 'Nessun modello ricorrente salvato.',
    applyRecurringBtn: 'Applica',
    languageSection: 'Lingua Applicazione',
    languageDesc: 'Scegli la lingua predefinita tra Italiano, Tedesco e Inglese.',
    italian: 'Italiano (Standard)',
    german: 'Deutsch (Tedesco)',
    english: 'English (Inglese)',
    otherSmartphones: 'Altri Smartphone Android',
    otherSmartphonesTitle: "Come aprire l'app su un altro telefono",
    otherSmartphonesDesc: 'Invia questo link al secondo smartphone per aprirla direttamente in Google Chrome.',
    shareAppDesc: 'Invia questo link al secondo smartphone per aprirla direttamente in Google Chrome.',
    copyLinkBtn: 'Copia Link',
    shareTip: "Sull'altro smartphone, apri il link in Chrome, tocca i 3 puntini (⋮) e premi 'Aggiungi a schermata Home'.",
    exportBackupSection: 'Esportazione & Salva Dati',
    exportJsonBtn: 'Esporta File Backup (.JSON)',
    exportCsvBtn: 'Esporta Movimenti in Excel (.CSV)',
    downloadHtmlBtn: 'Scarica Codice HTML (myfinance_app.html)',
    downloadHtmlBadge: 'Versione Autonoma Offline',
    downloadZipBtn: 'Scarica File ZIP (myfinance_app.zip)',
    downloadZipBadge: 'Consigliato · 100% Offline',
    downloadZipToast: 'File ZIP (myfinance_app.zip) scaricato con successo!',
    copyBackupBtn: 'Copia Backup negli Appunti',
    restoreSection: 'Ripristino Dati',
    importJsonBtn: 'Ripristina da File Backup (.JSON)',
    pasteJsonBtn: 'Incolla Testo Backup (.JSON)',
    monthlyReportBtn: 'Report PDF Mensile Riassuntivo',
    monthlyReportDesc: 'Saldo totale, spese principali e avanzamento obiettivi',
    resetDemoBtn: 'Ripristina Dati Demo Iniziali',
    resetDemoDesc: 'Ricarica i conti e le categorie predefinite',
    localStorageSecurityInfo: 'Tutti i dati sono salvati in sicurezza localmente sul tuo dispositivo tramite LocalStorage. I file di backup esportati contengono tutti i tuoi conti, movimenti, note, categorie e budget.',
    accountsModalTitle: 'Gestione Conti & Icone',
    accountsModalSubtitle: 'Personalizza icone e colori per ogni conto',
    activeAccountsTitle: 'Conti Attivi',
    accountNameLabel: 'Nome Conto',
    chooseIconLabel: 'Scegli Icona Grafica',
    themeColorLabel: 'Colore Tema',
    saveAccountBtn: 'Salva Conto',
    updateAccountBtn: 'Aggiorna Conto',

    edit: 'Modifica',
    delete: 'Elimina',
    close: 'Chiudi',
    save: 'Salva',
    cancel: 'Annulla',

    currencySymbol: '€',
    currencyName: 'Euro (€)',

    zoomTitle: 'Zoom Pagine',
    zoomIn: 'Ingrandisci',
    zoomOut: 'Riduci',
    zoomReset: 'Ripristina (100%)',

    languageChangedToast: 'Lingua impostata su Italiano!',
    backupDownloadedToast: 'Backup JSON scaricato con successo!',
    backupCopiedToast: 'Backup copiato negli appunti!',
    htmlDownloadedToast: 'Download applicazione HTML avviato!',
    resetConfirmMessage: 'Sei sicuro di voler ripristinare i dati demo?',
    demoRestoredToast: 'Dati demo ripristinati con successo.',
    appliedRecurringToast: 'Movimento registrato a bilancio!',
    linkCopiedToast: "Link copiato! Invialo su WhatsApp o Email all'altro telefono",

    // Print & PDF Center
    printCenterTitle: 'Centro Stampa & PDF',
    printCenterSubtitle: 'Stampa diretta formattata A4 o esportazione PDF ufficiale',
    tabStatement: 'Estratto Conto',
    tabMonthlyReport: 'Report Mensile',
    tabAccountsBalance: 'Saldi Conti',
    tabScreenPrint: 'Schermata',
    filterAccountLabel: 'Conto',
    filterPeriodLabel: 'Periodo',
    allTransactionsOption: 'Tutti i movimenti',
    currentMonthOption: 'Mese corrente',
    lastMonthOption: 'Mese scorso',
    currentYearOption: 'Anno corrente',
    summaryIncome: 'Entrate',
    summaryExpenses: 'Uscite',
    summaryNetBalance: 'Saldo Netto',
    summarySavings: 'Risparmio',
    documentPreview: 'Anteprima Documento',
    bankingA4Format: 'Formato A4 bancario',
    andOtherTransactions: '+ altri {count} movimenti stampati nel documento finale...',
    noTransactionsFilter: 'Nessun movimento trovato per i filtri selezionati.',
    directPrintA4Btn: 'Stampa Diretta A4',
    downloadPdfA4Btn: 'Scarica PDF (A4)',
    copySummaryBtn: 'Copia Riepilogo per WhatsApp / Email',
    copiedBadge: 'Copiato!',
    officialReportBadge: 'Report Ufficiale',
    monthOf: 'Mese di',
    transactionsCount: 'Movimenti',
    topSpendingCategories: 'Principali categorie di spesa:',
    printMonthlyReportBtn: 'Stampa Report Mensile',
    downloadMonthlyPdfBtn: 'Scarica PDF Mensile',
    consolidatedNetWorth: 'Patrimonio Totale Consolidato',
    accountsCount: 'Conti',
    standardAccount: 'Conto Standard',
    printAccountBalancesBtn: 'Stampa Saldi Conti',
    downloadAccountBalancesPdfBtn: 'Scarica PDF Saldi',
    directBrowserPrintTitle: 'Stampa Diretta Finestra Browser',
    directBrowserPrintDesc: 'Questa opzione attiva il comando di stampa standard del tuo dispositivo (Ctrl + P su PC o Condividi > Stampa su Android/iOS).',
    directBrowserPrintTip: "💡 Consiglio: Se sei all'interno dell'anteprima web di AI Studio e il browser non apre la finestra, usa i tab sopra (Estratto Conto o Report Mensile) con il tasto Scarica PDF per un risultato perfetto al 100%!",
    printCurrentScreenBtn: 'Avvia Stampa Schermata Attuale',
    printWindowOpenedToast: 'Finestra di stampa aperta con successo!',
    statementPdfDownloadedToast: 'Estratto Conto PDF scaricato con successo!',
    monthlyPdfDownloadedToast: 'Report PDF scaricato con successo!',
    balancesPdfDownloadedToast: 'PDF Situazione Patrimoniale scaricato!',
    summaryCopiedToast: 'Riepilogo copiato negli appunti!',
    rowsWord: 'righe',

    // Monthly Report Modal in SettingsTab
    monthlyReportModalTitle: 'Report PDF',
    monthlyReportModalSubtitle: 'Riepilogo saldo, spese principali e avanzamento obiettivi',
    totalAccountsBalanceLabel: 'Saldo Totale Conti',
    activeAccountsCount: '{count} conti attivi',
    monthlyNetSavingsLabel: 'Risparmio Netto Mese',
    savingsRatePercent: 'Tasso risparmio: {rate}%',
    monthlyIncomeLabel: 'Entrate Mese',
    monthlyExpensesLabel: 'Uscite Mese',
    topExpensesByCategory: 'Spese Principali per Categoria',
    categoriesCount: '{count} categorie',
    noExpensesThisMonth: 'Nessuna spesa registrata per questo mese.',
    savingsGoals: 'Obiettivi di Risparmio',
    activeCount: '{count} attivi',
    noGoalsConfigured: 'Nessun obiettivo di risparmio impostato.',
    printBtn: 'Stampa',
    downloadPdfA4: 'Scarica PDF A4',
    generatingPdf: 'Generazione...',
    monthlyPdfGeneratedToast: 'Report PDF generato con successo!',
    monthlyPdfErrorToast: 'Errore durante la generazione del report PDF.',

    // Transfer Between Accounts (Giroconto tra Conti)
    transferModalTitle: 'Giroconto tra Conti',
    transferInvalidAmount: 'Inserisci un importo valido maggiore di zero.',
    transferSameAccountError: 'Seleziona due conti differenti (sorgente e destinazione).',
    transferFromAccount: 'Da Conto (Sorgente)',
    transferToAccount: 'A Conto (Destinazione)',
    transferReasonLabel: 'Causale / Note',
    transferReasonPlaceholder: 'es. Risparmio mensile, ricarica...',
    transferDateLabel: 'Data',
    transferVerifyBtn: 'Verifica & Esegui',
    transferDefaultNote: 'Giroconto',
    transferSuccessToast: 'Giroconto eseguito con successo!',
    transferConfirmTitle: 'Avviso Trasferimento Fondi',
    transferConfirmMessage: 'Vuoi procedere con il trasferimento di {amount} da "{from}" a "{to}"?',
    transferConfirmWarning: 'L\'importo di {amount} verrà detratto da "{from}" e accreditato su "{to}".',
    transferConfirmBtn: 'Esegui Trasferimento',

    // Daily Automatic Backup
    autoBackupSectionTitle: 'Backup Automatico Giornaliero (.JSON)',
    autoBackupBadge: 'OneDrive · Google Drive · Dispositivo',
    autoBackupConfigBtn: 'Configura',
    autoBackupActive: 'Attivo',
    autoBackupDestinationLabel: 'Destinazione:',
    autoBackupLastLabel: 'Ultimo salvataggio:',

    // App Lock & Security (Password & Profile)
    securitySectionTitle: 'Profilo & Sicurezza Accesso',
    securitySectionSubtitle: 'Registrazione account, Password ed Email di recupero',
    appLockStatusActive: 'Protetto (Password attiva)',
    appLockStatusInactive: 'Accesso libero (Nessuna password)',
    securityConfigBtn: 'Configura',
    lockNowBtn: 'Blocca App Ora',
    appLockedToast: 'Applicazione bloccata!',
    lockScreenTitle: 'MyFinance Pro',
    lockScreenSubtitle: 'Inserisci la password per sbloccare i tuoi dati',
    passwordPlaceholder: 'Password o PIN numerico...',
    unlockBtn: 'Sblocca',
    wrongPasswordError: 'Password non corretta. Riprova.',
    passwordHintLabel: 'Suggerimento:',
    securityModalTitle: 'Profilo Utente & Sicurezza Accesso',
    securityModalSubtitle: 'Registrazione Nome, Cognome, Email e protezione con Password',
    requirePasswordLabel: 'Richiedi Password all\'Avvio',
    requirePasswordDesc: 'Blocca l\'app alla chiusura e richiede la password per entrare',
    changePasswordBtn: 'Modifica Password',
    setPasswordBtn: 'Imposta Nuova Password',
    removePasswordBtn: 'Rimuovi Password',
    autoLockDelayLabel: 'Blocco Automatico:',
    autoLockImmediate: 'Immediato (alla chiusura)',
    autoLock1Min: 'Dopo 1 minuto di inattività',
    autoLock5Min: 'Dopo 5 minuti di inattività',
    autoLock15Min: 'Dopo 15 minuti di inattività',
    currentPasswordLabel: 'Password Attuale',
    newPasswordLabel: 'Nuova Password o PIN',
    confirmPasswordLabel: 'Conferma Nuova Password',
    passwordsMismatchError: 'Le due password non corrispondono.',
    passwordEmptyError: 'Inserisci una password valida (almeno 4 caratteri o cifre).',
    wrongCurrentPasswordError: 'La password attuale inserita non è corretta.',
    passwordChangedToast: 'Password aggiornata con successo!',
    passwordSetToast: 'Password di protezione impostata con successo!',
    securityDisabledToast: 'Blocco con password disattivato.',
    numericKeypadBtn: 'Tastierino',
  },
  de: {
    appTitle: 'MyFinance',
    appSubtitle: 'Android Mobile Edition',
    offlineBadge: 'Offline',
    quickTransfer: 'Schnelle Umbuchung zwischen Konten',
    printExportPdf: 'Drucken / PDF exportieren',
    languageSelect: 'Sprache / Lingua / Language',

    navHome: 'Übersicht',
    navTransactions: 'Buchungen',
    navBudgets: 'Budgets',
    navAnalytics: 'Analysen',
    navSettings: 'Optionen',

    totalNetWorth: 'Gesamtvermögen',
    totalIncomeLabel: 'Gesamteinnahmen',
    totalExpenseLabel: 'Gesamtausgaben',
    totalLabel: 'Gesamt',
    incomeWord: 'Einnahmen',
    expenseWord: 'Ausgaben',
    savingsRateLabel: 'Sparquote',
    dailyAvgLabel: 'Tagesdurchschnitt',
    subtextRealtime: 'In Echtzeit über alle Konten berechnet',

    financialAccounts: 'Finanzkonten',
    manageEdit: 'Verwalten / Bearbeiten',
    quickTransferBtn: 'Schnelle Umbuchung',
    allAccounts: 'Alle Konten',
    fromAccountLabel: 'Von Konto',
    toAccountLabel: 'Auf Konto',
    amountLabel: 'Betrag (€)',
    noteLabel: 'Verwendungszweck / Notiz',
    confirmTransferBtn: 'Umbuchung ausführen',
    cancelBtn: 'Abbrechen',
    activeAccount: 'Aktiv',
    accountLabel: 'Konto',
    prevAccountLabel: 'Vorheriges Konto',
    nextAccountLabel: 'Nächstes Konto',

    recentTransactions: 'Letzte Buchungen',
    viewAll: 'Alle anzeigen',
    noRecentTransactions: 'Keine Buchungen vorhanden. Tippen Sie auf +, um zu beginnen.',

    transactionsTitle: 'Buchungen',
    searchPlaceholder: 'Beschreibung, Konto, Kategorie, Betrag suchen...',
    periodFilterLabel: 'Zeitraum',
    typeFilterLabel: 'Typ',
    accountFilterLabel: 'Konto',
    categoryFilterLabel: 'Kategorie',
    allTypes: 'Alle Typen',
    incomeType: 'Einnahmen',
    expenseType: 'Ausgaben',
    transferType: 'Umbuchungen',
    allAccountsOption: 'Alle Konten',
    allCategoriesOption: 'Alle Kategorien',
    noTransactionsFound: 'Keine Buchungen gefunden.',
    noTransactionsFoundSub: 'Passen Sie die Filter an oder tippen Sie auf +, um eine Buchung hinzuzufügen.',
    printStatementBtn: 'Drucken',
    resetFiltersBtn: 'Zurücksetzen',
    newTransactionBtn: 'Neue Buchung',

    periodAll: 'Alle',
    periodToday: 'Heute',
    periodYesterday: 'Gestern',
    periodCurrentWeek: 'Diese Woche',
    periodLastWeek: 'Letzte Woche',
    periodMonth: 'Dieser Monat',
    periodLastMonth: 'Letzter Monat',
    periodYear: 'Dieses Jahr',
    periodLastYear: 'Letztes Jahr',
    periodCustom: 'Zeitraum (Datum)',
    dateRangeFilterTitle: 'Nach Datum filtern (Von ... Bis ...)',
    dateFromLabel: 'Von',
    dateToLabel: 'Bis',
    clearDateRange: 'Daten zurücksetzen',
    dateRangeActiveLabel: 'Aktiver Zeitraum',
    quickDays7: 'Letzte 7 Tage',
    quickDays30: 'Letzte 30 Tage',
    filtersResetToast: 'Filter zurückgesetzt',

    budgetsGoalsTitle: 'Budgets & Sparziele',
    monthlySpendingBudgets: 'Monatliche Budgets',
    setBudgetBtn: 'Budget festlegen',
    savingsGoalsTitle: 'Sparziele',
    newGoalBtn: 'Neues Sparziel',
    editBudgetsBtn: 'Budgets bearbeiten',
    addGoalBtn: 'Neues Sparziel',
    spentOf: 'Ausgegeben von',
    savedOf: 'Gespart von',
    targetDateLabel: 'Zieldatum',
    noBudgetsSet: 'Keine Budgets festgelegt.',
    noBudgetsSetSub: 'Tippen Sie oben auf Budget festlegen, um Ihre Ausgabenlimits zu bestimmen.',
    noGoalsSet: 'Keine Sparziele eingerichtet.',
    noGoalsSetSub: 'Tippen Sie auf Neues Sparziel, um ein finanzielles Ziel zu setzen.',
    currentMonth: 'Aktueller Monat',
    percentUsed: 'Verbraucht',
    goalCompleted: 'Erreicht!',
    goalDeadline: 'Fälligkeit',
    goalProgress: 'Fortschritt',
    addFundsBtn: '+ Einzahlen',

    analyticsTitle: 'Analysen & Statistiken',
    chartTrend: 'Verlauf',
    chartExpensesPie: 'Ausgaben-Diagramm',
    chartAccounts: 'Konten',
    chartMonthly6M: 'Monate (6M)',
    balanceHistoryTitle: 'Saldo-Entwicklung im Zeitverlauf',
    balanceTrend: 'Saldo-Verlauf',
    expensesByCategory: 'Ausgaben nach Kategorie',
    monthlyComparison: 'Monatsvergleich',
    averageDailyExpense: 'Durchschnittliche Tagesausgaben',
    totalSavings: 'Netto-Ersparnis',
    totalExpensesCount: 'Gesamtausgaben',
    period30D: '30 Tage',
    period90D: '90 Tage',
    period1Y: '1 Jahr',
    periodAllTime: 'Alle',
    currentBalanceLabel: 'Aktueller Saldo',
    minBalanceLabel: 'Tiefststand',
    maxBalanceLabel: 'Höchststand',
    dailyAverageExpenseTitle: 'Durchschnittliche Tagesausgaben',
    totalPeriodExpenses: 'Gesamtausgaben im Zeitraum',
    accountsBreakdown: 'Vermögensaufteilung nach Konten',
    monthlyExpensesIncomes: 'Einnahmen vs. Ausgaben (Letzte 6 Monate)',
    savingsRateTrend: 'Monatliche Sparquote',

    settingsTitle: 'Optionen, Backup & Wiederherstellung',
    configSectionTitle: 'Datenkonfiguration',
    manageAccountsBtn: 'Konten verwalten & anpassen',
    manageCategoriesBtn: 'Kategorien verwalten',
    reconcileBalancesBtn: 'Salden prüfen & neu berechnen',
    reconcileBalancesDesc: 'Buchungskonsistenz prüfen und Unstimmigkeiten korrigieren',
    verifyBadge: 'Prüfen',
    recurringTitle: 'Daueraufträge & Fixkosten',
    recurringConfigured: 'Vorlagen eingerichtet',
    manageAllRecurringBtn: 'Alle verwalten',
    searchRecurringPlaceholder: 'Vorlage nach Name oder Kategorie suchen...',
    noRecurringFound: 'Keine passende Vorlage gefunden.',
    noRecurringSaved: 'Keine Daueraufträge gespeichert.',
    applyRecurringBtn: 'Buchen',
    languageSection: 'App-Sprache',
    languageDesc: 'Wählen Sie die Standardsprache: Italienisch, Deutsch oder Englisch.',
    italian: 'Italiano (Italienisch)',
    german: 'Deutsch (Standard)',
    english: 'English (Englisch)',
    otherSmartphones: 'Andere Android-Smartphones',
    otherSmartphonesTitle: 'App auf einem anderen Smartphone öffnen',
    otherSmartphonesDesc: 'Senden Sie diesen Link an das andere Smartphone, um die App in Google Chrome zu öffnen.',
    shareAppDesc: 'Senden Sie diesen Link an das andere Smartphone, um die App in Google Chrome zu öffnen.',
    copyLinkBtn: 'Link kopieren',
    shareTip: "Öffnen Sie den Link auf dem anderen Smartphone in Chrome, tippen Sie auf die 3 Punkte (⋮) und wählen Sie 'Zum Startbildschirm hinzufügen'.",
    exportBackupSection: 'Export & Datensicherung',
    exportJsonBtn: 'Backup-Datei exportieren (.JSON)',
    exportCsvBtn: 'Buchungen nach Excel exportieren (.CSV)',
    downloadHtmlBtn: 'HTML-Code herunterladen (myfinance_app.html)',
    downloadHtmlBadge: 'Eigenständige Offline-App',
    downloadZipBtn: 'ZIP-Datei herunterladen (myfinance_app.zip)',
    downloadZipBadge: 'Empfohlen · 100% Offline',
    downloadZipToast: 'ZIP-Datei (myfinance_app.zip) erfolgreich heruntergeladen!',
    copyBackupBtn: 'Backup in Zwischenablage kopieren',
    restoreSection: 'Datenwiederherstellung',
    importJsonBtn: 'Aus Backup-Datei wiederherstellen (.JSON)',
    pasteJsonBtn: 'Backup-Text einfügen (.JSON)',
    monthlyReportBtn: 'Monatlicher PDF-Zusammenfassungsbericht',
    monthlyReportDesc: 'Gesamtsaldo, Hauptausgaben und Fortschritt der Sparziele',
    resetDemoBtn: 'Demo-Daten wiederherstellen',
    resetDemoDesc: 'Standardkonten und -kategorien neu laden',
    localStorageSecurityInfo: 'Alle Daten werden über den lokalen Speicher (LocalStorage) sicher auf Ihrem Gerät gespeichert. Exportierte Backup-Dateien enthalten alle Ihre Konten, Buchungen, Notizen, Kategorien und Budgets.',
    accountsModalTitle: 'Konten- & Symbolverwaltung',
    accountsModalSubtitle: 'Symbole und Farben für jedes Konto anpassen',
    activeAccountsTitle: 'Aktive Konten',
    accountNameLabel: 'Kontoname',
    chooseIconLabel: 'Grafiksymbol auswählen',
    themeColorLabel: 'Designfarbe',
    saveAccountBtn: 'Konto speichern',
    updateAccountBtn: 'Konto aktualisieren',

    edit: 'Bearbeiten',
    delete: 'Löschen',
    close: 'Schließen',
    save: 'Speichern',
    cancel: 'Abbrechen',

    currencySymbol: '€',
    currencyName: 'Euro (€)',

    zoomTitle: 'Seiten-Zoom',
    zoomIn: 'Vergrößern',
    zoomOut: 'Verkleinern',
    zoomReset: 'Zurücksetzen (100%)',

    languageChangedToast: 'Sprache auf Deutsch eingestellt!',
    backupDownloadedToast: 'JSON-Backup erfolgreich heruntergeladen!',
    backupCopiedToast: 'Backup in die Zwischenablage kopiert!',
    htmlDownloadedToast: 'HTML-App-Download gestartet!',
    resetConfirmMessage: 'Möchten Sie die Demo-Daten wirklich zurücksetzen?',
    demoRestoredToast: 'Demo-Daten erfolgreich wiederhergestellt.',
    appliedRecurringToast: 'Buchung erfolgreich eingetragen!',
    linkCopiedToast: 'Link kopiert! Per WhatsApp oder E-Mail an das andere Smartphone senden',

    // Print & PDF Center
    printCenterTitle: 'Druck- & PDF-Zentrum',
    printCenterSubtitle: 'Direkter formatierter A4-Druck oder offizieller PDF-Export',
    tabStatement: 'Kontoauszug',
    tabMonthlyReport: 'Monatsbericht',
    tabAccountsBalance: 'Kontostände',
    tabScreenPrint: 'Bildschirm',
    filterAccountLabel: 'Konto',
    filterPeriodLabel: 'Zeitraum',
    allTransactionsOption: 'Alle Buchungen',
    currentMonthOption: 'Aktueller Monat',
    lastMonthOption: 'Letzter Monat',
    currentYearOption: 'Aktuelles Jahr',
    summaryIncome: 'Einnahmen',
    summaryExpenses: 'Ausgaben',
    summaryNetBalance: 'Nettosaldo',
    summarySavings: 'Ersparnis',
    documentPreview: 'Dokumentenvorschau',
    bankingA4Format: 'Bankübliches A4-Format',
    andOtherTransactions: '+ weitere {count} Buchungen im endgültigen Dokument gedruckt...',
    noTransactionsFilter: 'Keine Buchungen für die ausgewählten Filter gefunden.',
    directPrintA4Btn: 'Direktdruck A4',
    downloadPdfA4Btn: 'PDF herunterladen (A4)',
    copySummaryBtn: 'Zusammenfassung für WhatsApp / E-Mail kopieren',
    copiedBadge: 'Kopiert!',
    officialReportBadge: 'Offizieller Bericht',
    monthOf: 'Monat',
    transactionsCount: 'Buchungen',
    topSpendingCategories: 'Hauptausgabenkategorien:',
    printMonthlyReportBtn: 'Monatsbericht drucken',
    downloadMonthlyPdfBtn: 'Monats-PDF herunterladen',
    consolidatedNetWorth: 'Konsolidiertes Gesamtvermögen',
    accountsCount: 'Konten',
    standardAccount: 'Standardkonto',
    printAccountBalancesBtn: 'Kontostände drucken',
    downloadAccountBalancesPdfBtn: 'Salden-PDF herunterladen',
    directBrowserPrintTitle: 'Direkter Druck aus dem Browserfenster',
    directBrowserPrintDesc: 'Diese Option startet den Standard-Druckbefehl Ihres Geräts (Strg + P auf dem PC oder Teilen > Drucken auf Android/iOS).',
    directBrowserPrintTip: '💡 Tipp: Wenn Sie die Webvorschau von AI Studio verwenden und das Druckfenster blockiert ist, nutzen Sie die Reiter oben (Kontoauszug oder Monatsbericht) mit der Schaltfläche PDF herunterladen für ein perfektes Ergebnis!',
    printCurrentScreenBtn: 'Aktuellen Bildschirm drucken',
    printWindowOpenedToast: 'Druckfenster erfolgreich geöffnet!',
    statementPdfDownloadedToast: 'Kontoauszug-PDF erfolgreich heruntergeladen!',
    monthlyPdfDownloadedToast: 'PDF-Monatsbericht erfolgreich heruntergeladen!',
    balancesPdfDownloadedToast: 'Vermögensübersicht-PDF heruntergeladen!',
    summaryCopiedToast: 'Zusammenfassung in die Zwischenablage kopiert!',
    rowsWord: 'Zeilen',

    // Monthly Report Modal in SettingsTab
    monthlyReportModalTitle: 'PDF-Monatsbericht',
    monthlyReportModalSubtitle: 'Übersicht über Saldo, Hauptausgaben und Sparzielfortschritt',
    totalAccountsBalanceLabel: 'Gesamtsaldo aller Konten',
    activeAccountsCount: '{count} aktive Konten',
    monthlyNetSavingsLabel: 'Monatliche Nettoersparnis',
    savingsRatePercent: 'Sparquote: {rate}%',
    monthlyIncomeLabel: 'Monatseinnahmen',
    monthlyExpensesLabel: 'Monatsausgaben',
    topExpensesByCategory: 'Hauptausgaben nach Kategorie',
    categoriesCount: '{count} Kategorien',
    noExpensesThisMonth: 'Keine Ausgaben in diesem Monat erfasst.',
    savingsGoals: 'Sparziele',
    activeCount: '{count} aktiv',
    noGoalsConfigured: 'Keine Sparziele eingerichtet.',
    printBtn: 'Drucken',
    downloadPdfA4: 'PDF herunterladen (A4)',
    generatingPdf: 'Wird erstellt...',
    monthlyPdfGeneratedToast: 'PDF-Bericht erfolgreich erstellt!',
    monthlyPdfErrorToast: 'Fehler beim Erstellen des PDF-Berichts.',

    // Transfer Between Accounts (Giroconto tra Conti)
    transferModalTitle: 'Umbuchung zwischen Konten',
    transferInvalidAmount: 'Bitte geben Sie einen gültigen Betrag größer als null ein.',
    transferSameAccountError: 'Bitte wählen Sie zwei unterschiedliche Konten aus (Quelle und Ziel).',
    transferFromAccount: 'Von Konto (Quelle)',
    transferToAccount: 'Auf Konto (Ziel)',
    transferReasonLabel: 'Verwendungszweck / Notiz',
    transferReasonPlaceholder: 'z. B. Monatliches Sparen, Übertrag...',
    transferDateLabel: 'Datum',
    transferVerifyBtn: 'Prüfen & Ausführen',
    transferDefaultNote: 'Umbuchung',
    transferSuccessToast: 'Umbuchung erfolgreich durchgeführt!',
    transferConfirmTitle: 'Bestätigung Umbuchung',
    transferConfirmMessage: 'Möchten Sie die Umbuchung von {amount} von "{from}" auf "{to}" ausführen?',
    transferConfirmWarning: 'Der Betrag von {amount} wird von "{from}" abgebucht und "{to}" gutgeschrieben.',
    transferConfirmBtn: 'Umbuchung ausführen',

    // Daily Automatic Backup
    autoBackupSectionTitle: 'Tägliches automatisches Backup (.JSON)',
    autoBackupBadge: 'OneDrive · Google Drive · Gerät',
    autoBackupConfigBtn: 'Konfigurieren',
    autoBackupActive: 'Aktiv',
    autoBackupDestinationLabel: 'Ziel:',
    autoBackupLastLabel: 'Letzte Sicherung:',

    // App Lock & Security (Password & Profile)
    securitySectionTitle: 'Profil & App-Sicherheit',
    securitySectionSubtitle: 'Konto-Registrierung, Passwort & E-Mail-Wiederherstellung',
    appLockStatusActive: 'Geschützt (Passwort aktiv)',
    appLockStatusInactive: 'Offener Zugriff (Kein Passwort)',
    securityConfigBtn: 'Konfigurieren',
    lockNowBtn: 'App jetzt sperren',
    appLockedToast: 'App erfolgreich gesperrt!',
    lockScreenTitle: 'MyFinance Pro',
    lockScreenSubtitle: 'Passwort eingeben, um Ihre Daten zu entsperren',
    passwordPlaceholder: 'Passwort oder PIN eingeben...',
    unlockBtn: 'Entsperren',
    wrongPasswordError: 'Falsches Passwort. Bitte erneut versuchen.',
    passwordHintLabel: 'Hinweis:',
    securityModalTitle: 'Benutzerprofil & Sicherheit',
    securityModalSubtitle: 'Vorname, Nachname, E-Mail-Registrierung und Passwortschutz',
    requirePasswordLabel: 'Passwort beim Start anfordern',
    requirePasswordDesc: 'Sperrt die App beim Schließen und verlangt das Passwort',
    changePasswordBtn: 'Passwort ändern',
    setPasswordBtn: 'Neues Passwort festlegen',
    removePasswordBtn: 'Passwort entfernen',
    autoLockDelayLabel: 'Automatische Sperre:',
    autoLockImmediate: 'Sofort (beim Verlassen)',
    autoLock1Min: 'Nach 1 Minute Inaktivität',
    autoLock5Min: 'Nach 5 Minuten Inaktivität',
    autoLock15Min: 'Nach 15 Minuten Inaktivität',
    currentPasswordLabel: 'Aktuelles Passwort',
    newPasswordLabel: 'Neues Passwort oder PIN',
    confirmPasswordLabel: 'Neues Passwort bestätigen',
    passwordsMismatchError: 'Die Passwörter stimmen nicht überein.',
    passwordEmptyError: 'Bitte geben Sie ein gültiges Passwort ein (mindestens 4 Zeichen/Ziffern).',
    wrongCurrentPasswordError: 'Das eingegebene aktuelle Passwort ist falsch.',
    passwordChangedToast: 'Passwort erfolgreich aktualisiert!',
    passwordSetToast: 'Schutz-Passwort erfolgreich eingerichtet!',
    securityDisabledToast: 'Passwortsperre deaktiviert.',
    numericKeypadBtn: 'Ziffernblock',
  },
  en: {
    appTitle: 'MyFinance',
    appSubtitle: 'Android Mobile Edition',
    offlineBadge: 'Offline',
    quickTransfer: 'Quick Transfer between Accounts',
    printExportPdf: 'Print / Export PDF',
    languageSelect: 'Language / Lingua / Sprache',

    navHome: 'Home',
    navTransactions: 'Transactions',
    navBudgets: 'Budgets',
    navAnalytics: 'Analytics',
    navSettings: 'Settings',

    totalNetWorth: 'Total Net Worth',
    totalIncomeLabel: 'Total Income',
    totalExpenseLabel: 'Total Expenses',
    totalLabel: 'Total',
    incomeWord: 'Income',
    expenseWord: 'Expenses',
    savingsRateLabel: 'Savings Rate',
    dailyAvgLabel: 'Daily Average',
    subtextRealtime: 'Calculated in real-time across all accounts',

    financialAccounts: 'Financial Accounts',
    manageEdit: 'Manage / Edit',
    quickTransferBtn: 'Quick Transfer',
    allAccounts: 'All accounts',
    fromAccountLabel: 'From Account',
    toAccountLabel: 'To Account',
    amountLabel: 'Amount (€)',
    noteLabel: 'Reason / Note',
    confirmTransferBtn: 'Execute Transfer',
    cancelBtn: 'Cancel',
    activeAccount: 'Active',
    accountLabel: 'Account',
    prevAccountLabel: 'Previous account',
    nextAccountLabel: 'Next account',

    recentTransactions: 'Recent Transactions',
    viewAll: 'View All',
    noRecentTransactions: 'No transactions recorded. Press + to start.',

    transactionsTitle: 'Transactions',
    searchPlaceholder: 'Search description, account, category, amount...',
    periodFilterLabel: 'Period',
    typeFilterLabel: 'Type',
    accountFilterLabel: 'Account',
    categoryFilterLabel: 'Category',
    allTypes: 'All types',
    incomeType: 'Income',
    expenseType: 'Expenses',
    transferType: 'Transfers',
    allAccountsOption: 'All accounts',
    allCategoriesOption: 'All categories',
    noTransactionsFound: 'No transactions found.',
    noTransactionsFoundSub: 'Try adjusting filters or press + to add a transaction.',
    printStatementBtn: 'Print',
    resetFiltersBtn: 'Reset',
    newTransactionBtn: 'New Transaction',

    periodAll: 'All',
    periodToday: 'Today',
    periodYesterday: 'Yesterday',
    periodCurrentWeek: 'Current week',
    periodLastWeek: 'Last week',
    periodMonth: 'Current month',
    periodLastMonth: 'Last month',
    periodYear: 'Current year',
    periodLastYear: 'Last year',
    periodCustom: 'Date Range',
    dateRangeFilterTitle: 'Filter by Date (From ... To ...)',
    dateFromLabel: 'From',
    dateToLabel: 'To',
    clearDateRange: 'Clear dates',
    dateRangeActiveLabel: 'Active range',
    quickDays7: 'Last 7 days',
    quickDays30: 'Last 30 days',
    filtersResetToast: 'Filters reset',

    budgetsGoalsTitle: 'Budgets & Goals',
    monthlySpendingBudgets: 'Monthly Budgets',
    setBudgetBtn: 'Set Budget',
    savingsGoalsTitle: 'Savings Goals',
    newGoalBtn: 'New Goal',
    editBudgetsBtn: 'Edit Budgets',
    addGoalBtn: 'New Goal',
    spentOf: 'Spent of',
    savedOf: 'Saved of',
    targetDateLabel: 'Deadline',
    noBudgetsSet: 'No budgets configured.',
    noBudgetsSetSub: 'Click Set Budget above to define your spending limits.',
    noGoalsSet: 'No savings goals configured.',
    noGoalsSetSub: 'Click New Goal to set a financial milestone.',
    currentMonth: 'Current Month',
    percentUsed: 'Used',
    goalCompleted: 'Completed!',
    goalDeadline: 'Deadline',
    goalProgress: 'Progress',
    addFundsBtn: '+ Deposit',

    analyticsTitle: 'Analytics & Insights',
    chartTrend: 'Trend',
    chartExpensesPie: 'Expenses Pie',
    chartAccounts: 'Accounts',
    chartMonthly6M: 'Months (6M)',
    balanceHistoryTitle: 'Balance Trend Over Time',
    balanceTrend: 'Balance Trend',
    expensesByCategory: 'Expenses by Category',
    monthlyComparison: 'Monthly Comparison',
    averageDailyExpense: 'Daily Average Expense',
    totalSavings: 'Net Savings',
    totalExpensesCount: 'Total Expenses',
    period30D: '30 Days',
    period90D: '90 Days',
    period1Y: '1 Year',
    periodAllTime: 'All',
    currentBalanceLabel: 'Current Balance',
    minBalanceLabel: 'Minimum',
    maxBalanceLabel: 'Maximum',
    dailyAverageExpenseTitle: 'Daily Average Expense',
    totalPeriodExpenses: 'Period Total Expenses',
    accountsBreakdown: 'Net Worth Breakdown by Account',
    monthlyExpensesIncomes: 'Income vs. Expenses (Last 6 Months)',
    savingsRateTrend: 'Monthly Savings Rate',

    settingsTitle: 'Settings, Backup & Restore',
    configSectionTitle: 'Data Configuration',
    manageAccountsBtn: 'Manage & Edit Accounts',
    manageCategoriesBtn: 'Manage Categories',
    reconcileBalancesBtn: 'Verify & Reconcile Balances',
    reconcileBalancesDesc: 'Check transaction consistency and fix discrepancies',
    verifyBadge: 'Verify',
    recurringTitle: 'Recurring Transactions',
    recurringConfigured: 'configured templates',
    manageAllRecurringBtn: 'Manage All',
    searchRecurringPlaceholder: 'Search template by name or category...',
    noRecurringFound: 'No template matching search.',
    noRecurringSaved: 'No recurring templates saved.',
    applyRecurringBtn: 'Post',
    languageSection: 'App Language',
    languageDesc: 'Choose your default language: Italian, German, or English.',
    italian: 'Italiano (Italian)',
    german: 'Deutsch (German)',
    english: 'English (Default)',
    otherSmartphones: 'Other Android Smartphones',
    otherSmartphonesTitle: 'How to open the app on another phone',
    otherSmartphonesDesc: 'Send this link to another smartphone to open directly in Google Chrome.',
    shareAppDesc: 'Send this link to another smartphone to open directly in Google Chrome.',
    copyLinkBtn: 'Copy Link',
    shareTip: "On the other phone, open the link in Chrome, tap the 3 dots (⋮) and tap 'Add to Home screen'.",
    exportBackupSection: 'Export & Backup Data',
    exportJsonBtn: 'Export Backup File (.JSON)',
    exportCsvBtn: 'Export Transactions to Excel (.CSV)',
    downloadHtmlBtn: 'Download HTML Code (myfinance_app.html)',
    downloadHtmlBadge: 'Standalone Offline App',
    downloadZipBtn: 'Download ZIP File (myfinance_app.zip)',
    downloadZipBadge: 'Recommended · 100% Offline',
    downloadZipToast: 'ZIP file (myfinance_app.zip) downloaded successfully!',
    copyBackupBtn: 'Copy Backup to Clipboard',
    restoreSection: 'Data Restore',
    importJsonBtn: 'Restore from Backup File (.JSON)',
    pasteJsonBtn: 'Paste Backup Text (.JSON)',
    monthlyReportBtn: 'Monthly Summary PDF Report',
    monthlyReportDesc: 'Total balance, major expenses, and goal progress',
    resetDemoBtn: 'Reset Initial Demo Data',
    resetDemoDesc: 'Reload default accounts and categories',
    localStorageSecurityInfo: 'All data is securely saved locally on your device via LocalStorage. Exported backup files contain all your accounts, transactions, notes, categories, and budgets.',
    accountsModalTitle: 'Manage Accounts & Icons',
    accountsModalSubtitle: 'Customize icons and colors for each account',
    activeAccountsTitle: 'Active Accounts',
    accountNameLabel: 'Account Name',
    chooseIconLabel: 'Choose Graphic Icon',
    themeColorLabel: 'Theme Color',
    saveAccountBtn: 'Save Account',
    updateAccountBtn: 'Update Account',

    edit: 'Edit',
    delete: 'Delete',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',

    currencySymbol: '€',
    currencyName: 'Euro (€)',

    zoomTitle: 'Page Zoom',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    zoomReset: 'Reset (100%)',

    languageChangedToast: 'Language set to English!',
    backupDownloadedToast: 'JSON Backup downloaded successfully!',
    backupCopiedToast: 'Backup copied to clipboard!',
    htmlDownloadedToast: 'HTML application download started!',
    resetConfirmMessage: 'Are you sure you want to reset to demo data?',
    demoRestoredToast: 'Demo data restored successfully.',
    appliedRecurringToast: 'Transaction posted to balance!',
    linkCopiedToast: 'Link copied! Send it via WhatsApp or Email to the other phone',

    // Print & PDF Center
    printCenterTitle: 'Print & PDF Center',
    printCenterSubtitle: 'Direct formatted A4 print or official PDF export',
    tabStatement: 'Account Statement',
    tabMonthlyReport: 'Monthly Report',
    tabAccountsBalance: 'Account Balances',
    tabScreenPrint: 'Screen Print',
    filterAccountLabel: 'Account',
    filterPeriodLabel: 'Period',
    allTransactionsOption: 'All transactions',
    currentMonthOption: 'Current month',
    lastMonthOption: 'Last month',
    currentYearOption: 'Current year',
    summaryIncome: 'Income',
    summaryExpenses: 'Expenses',
    summaryNetBalance: 'Net Balance',
    summarySavings: 'Savings',
    documentPreview: 'Document Preview',
    bankingA4Format: 'Banking A4 format',
    andOtherTransactions: '+ {count} more transactions printed in final document...',
    noTransactionsFilter: 'No transactions found for the selected filters.',
    directPrintA4Btn: 'Direct Print A4',
    downloadPdfA4Btn: 'Download PDF (A4)',
    copySummaryBtn: 'Copy Summary for WhatsApp / Email',
    copiedBadge: 'Copied!',
    officialReportBadge: 'Official Report',
    monthOf: 'Month of',
    transactionsCount: 'Transactions',
    topSpendingCategories: 'Top spending categories:',
    printMonthlyReportBtn: 'Print Monthly Report',
    downloadMonthlyPdfBtn: 'Download Monthly PDF',
    consolidatedNetWorth: 'Total Consolidated Net Worth',
    accountsCount: 'Accounts',
    standardAccount: 'Standard Account',
    printAccountBalancesBtn: 'Print Account Balances',
    downloadAccountBalancesPdfBtn: 'Download Balances PDF',
    directBrowserPrintTitle: 'Direct Browser Window Print',
    directBrowserPrintDesc: 'This option triggers the standard print command on your device (Ctrl + P on PC or Share > Print on Android/iOS).',
    directBrowserPrintTip: '💡 Tip: If you are in the AI Studio web preview and the browser prevents opening the window, use the tabs above (Account Statement or Monthly Report) with the Download PDF button for a 100% flawless result!',
    printCurrentScreenBtn: 'Print Current Screen',
    printWindowOpenedToast: 'Print window opened successfully!',
    statementPdfDownloadedToast: 'Account Statement PDF downloaded successfully!',
    monthlyPdfDownloadedToast: 'Monthly PDF report downloaded successfully!',
    balancesPdfDownloadedToast: 'Net Worth Statement PDF downloaded!',
    summaryCopiedToast: 'Summary copied to clipboard!',
    rowsWord: 'rows',

    // Monthly Report Modal in SettingsTab
    monthlyReportModalTitle: 'Monthly PDF Report',
    monthlyReportModalSubtitle: 'Overview of balance, top expenses, and goal progress',
    totalAccountsBalanceLabel: 'Total Accounts Balance',
    activeAccountsCount: '{count} active accounts',
    monthlyNetSavingsLabel: 'Monthly Net Savings',
    savingsRatePercent: 'Savings rate: {rate}%',
    monthlyIncomeLabel: 'Monthly Income',
    monthlyExpensesLabel: 'Monthly Expenses',
    topExpensesByCategory: 'Top Expenses by Category',
    categoriesCount: '{count} categories',
    noExpensesThisMonth: 'No expenses recorded for this month.',
    savingsGoals: 'Savings Goals',
    activeCount: '{count} active',
    noGoalsConfigured: 'No savings goals configured.',
    printBtn: 'Print',
    downloadPdfA4: 'Download PDF (A4)',
    generatingPdf: 'Generating...',
    monthlyPdfGeneratedToast: 'PDF Report generated successfully!',
    monthlyPdfErrorToast: 'Error generating PDF report.',

    // Transfer Between Accounts (Giroconto tra Conti)
    transferModalTitle: 'Transfer Between Accounts',
    transferInvalidAmount: 'Please enter a valid amount greater than zero.',
    transferSameAccountError: 'Please select two different accounts (source and destination).',
    transferFromAccount: 'From Account (Source)',
    transferToAccount: 'To Account (Destination)',
    transferReasonLabel: 'Reason / Notes',
    transferReasonPlaceholder: 'e.g. Monthly savings, top-up...',
    transferDateLabel: 'Date',
    transferVerifyBtn: 'Verify & Execute',
    transferDefaultNote: 'Transfer',
    transferSuccessToast: 'Transfer executed successfully!',
    transferConfirmTitle: 'Confirm Funds Transfer',
    transferConfirmMessage: 'Do you want to proceed with the transfer of {amount} from "{from}" to "{to}"?',
    transferConfirmWarning: 'The amount of {amount} will be deducted from "{from}" and credited to "{to}".',
    transferConfirmBtn: 'Execute Transfer',

    // Daily Automatic Backup
    autoBackupSectionTitle: 'Daily Automatic Backup (.JSON)',
    autoBackupBadge: 'OneDrive · Google Drive · Device',
    autoBackupConfigBtn: 'Configure',
    autoBackupActive: 'Active',
    autoBackupDestinationLabel: 'Target:',
    autoBackupLastLabel: 'Last backup:',

    // App Lock & Security (Password & Profile)
    securitySectionTitle: 'User Profile & Security',
    securitySectionSubtitle: 'Account registration, Password & Email recovery',
    appLockStatusActive: 'Protected (Password active)',
    appLockStatusInactive: 'Open access (No password set)',
    securityConfigBtn: 'Configure',
    lockNowBtn: 'Lock App Now',
    appLockedToast: 'App locked successfully!',
    lockScreenTitle: 'MyFinance Pro',
    lockScreenSubtitle: 'Enter your password to unlock your finances',
    passwordPlaceholder: 'Enter password or PIN...',
    unlockBtn: 'Unlock',
    wrongPasswordError: 'Incorrect password. Please try again.',
    passwordHintLabel: 'Password hint:',
    securityModalTitle: 'User Profile & Security',
    securityModalSubtitle: 'Register First Name, Last Name, Email & Password lock',
    requirePasswordLabel: 'Require Password at Startup',
    requirePasswordDesc: 'Locks the app upon closing and requires your password to open',
    changePasswordBtn: 'Change Password',
    setPasswordBtn: 'Set New Password',
    removePasswordBtn: 'Remove Password',
    autoLockDelayLabel: 'Auto-Lock Timeout:',
    autoLockImmediate: 'Immediately (on exit)',
    autoLock1Min: 'After 1 minute of inactivity',
    autoLock5Min: 'After 5 minutes of inactivity',
    autoLock15Min: 'After 15 minutes of inactivity',
    currentPasswordLabel: 'Current Password',
    newPasswordLabel: 'New Password or PIN',
    confirmPasswordLabel: 'Confirm New Password',
    passwordsMismatchError: 'Passwords do not match.',
    passwordEmptyError: 'Please enter a valid password (at least 4 characters or digits).',
    wrongCurrentPasswordError: 'The current password entered is incorrect.',
    passwordChangedToast: 'Password updated successfully!',
    passwordSetToast: 'Protection password set successfully!',
    securityDisabledToast: 'Password protection disabled.',
    numericKeypadBtn: 'Keypad',
  },
};
