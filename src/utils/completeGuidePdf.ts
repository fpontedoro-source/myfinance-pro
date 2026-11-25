import { jsPDF } from 'jspdf';
import { Language } from './translations';

interface GuideSection {
  title: string;
  items: { label: string; desc: string }[];
}

interface GuideCopy {
  mainTitle: string;
  subtitle: string;
  badgeLine: string;
  editionLabel: string;
  introTitle: string;
  introBody: string;
  tabOverviewTitle: string;
  tabs: { name: string; summary: string }[];
  sections: GuideSection[];
  checklistTitle: string;
  checklist: string[];
  partBadge: string;
  fileName: string;
}

const GUIDE_CONTENT: Record<Language, GuideCopy> = {
  it: {
    mainTitle: 'MYFINANCE PRO',
    subtitle: 'Guida Completa alle Funzioni dell\'App (Edizione v3.3)',
    badgeLine: 'Finanza Personale · Privacy 100% Locale · Multilingua IT / DE / EN',
    editionLabel: 'Aggiornata il',
    introTitle: 'PANORAMICA GENERALE',
    introBody:
      'MyFinance Pro e un\'app completa per la gestione della finanza personale su Web, smartphone e Android APK. Integra controllo conti multi-valuta, spese preferite a un tocco, debiti/rate/crediti, previsione di fine mese, regole automatiche con #tag, analisi comparative mese su mese, importazione estratti conto bancari CSV/Excel e report PDF A4 con salvataggio 100% locale sul dispositivo.',
    tabOverviewTitle: 'ARCHITETTURA DELL\'APP: LE 5 SCHEDE PRINCIPALI',
    tabs: [
      {
        name: '1. Home (Cruscotto)',
        summary:
          'Patrimonio Netto Effettivo (Liquidita + Crediti - Debiti), carosello conti, barra azioni rapide, Spese Preferite 1-Tap, Previsione Fine Mese, Allarmi Budget, Scadenzario e ultimi movimenti.',
      },
      {
        name: '2. Movimenti',
        summary:
          'Storico completo con ricerca istantanea (anche per #tag), filtri combinati (periodo, tipo, conto, categoria, #tag), modifica, duplica ad oggi in 1 clic ed esportazione PDF filtrata.',
      },
      {
        name: '3. Budget & Debiti',
        summary:
          'Selettore doppio tra Budget Mensili + Obiettivi di Risparmio e la sezione Debiti, Rate & Crediti (Spese Condivise) con incassi/pagamenti rapidi.',
      },
      {
        name: '4. Analisi (6 Viste)',
        summary:
          'Andamento saldo nel tempo, Torta spese, Ripartizione conti, Flussi 6 mesi, Confronto Mese vs Mese per categoria e Riepilogo aggregato per #tag.',
      },
      {
        name: '5. Impostazioni & APK',
        summary:
          'Gestione conti, categorie, ricorrenti, regole automatiche, tassi FX, sicurezza PIN e impronta digitale, estratto conto email automatico, backup JSON/CSV e pacchetti Android APK.',
      },
    ],
    sections: [
      {
        title: '1. Primo Avvio, Sicurezza PIN & Modalita Discreta',
        items: [
          {
            label: 'Registrazione & Multilingua (IT / DE / EN)',
            desc: 'Al primo avvio selezioni la lingua desiderata (Italiano, Deutsch, English) e inserisci nome, cognome ed email (utilizzata per gli estratti conto PDF mensili). Puoi cambiare lingua in qualsiasi momento dall\'intestazione o dalle Impostazioni.',
          },
          {
            label: 'Blocco App con PIN & Auto-Lock',
            desc: 'Nelle Impostazioni di Sicurezza attivi un codice PIN a 4-6 cifre, configuri il timeout di blocco automatico quando cambi app o lasci il telefono inattivo, oppure blocchi l\'app all\'istante.',
          },
          {
            label: 'Modalita Discreta (Pulsante Occhio in Intestazione)',
            desc: 'Tocca l\'icona dell\'occhio nella barra superiore per oscurare immediatamente tutti i saldi e gli importi in **** EUR su Home, grafici, movimenti e debiti/crediti quando usi l\'app in treno o in pubblico.',
          },
          {
            label: 'Zoom Interfaccia & Persistenza su Dispositivo',
            desc: 'Regoli lo zoom globale dal 60% al 180% per adattare la leggibilita su ogni schermo. I dati sono salvati contemporaneamente in LocalStorage e IndexedDB per resistere alla pulizia della cache del browser.',
          },
        ],
      },
      {
        title: '2. Home, Patrimonio Netto Unificato & Multi-Valuta',
        items: [
          {
            label: 'Patrimonio Netto Effettivo (Liquidita + Crediti - Debiti)',
            desc: 'Il banner principale distingue in modo trasparente la Liquidita Reale (somma dei conti) dai Crediti da incassare (+) e dai Debiti/Rate residui (-). Toccando il riquadro accedi direttamente a Debiti & Crediti.',
          },
          {
            label: 'Gestione Multi-Valuta (EUR, USD, GBP, JPY, CHF)',
            desc: 'Ogni conto conserva il proprio saldo reale nella valuta nativa. I totali consolidati, i budget e i grafici vengono convertiti nella tua Valuta Base tramite tassi BCE aggiornati online o tassi manuali modificabili offline.',
          },
          {
            label: 'Spese Preferite (1-Tap) con Finestra di Controllo',
            desc: 'In Home puoi configurare pulsanti rapidi (es. Caffe 1,50 EUR, Spesa, Benzina 30 EUR) preimpostati su conto, categoria e #tag: al tocco si apre una finestra di controllo riepilogativa per accettare e registrare in sicurezza.',
          },
          {
            label: 'Barra Azioni Rapide & Carosello Conti',
            desc: 'Scorri i saldi individuali di ogni conto o usa i 3 tasti rapidi (Nuova, Giroconto, Importa CSV) per operare senza passaggi superflui.',
          },
        ],
      },
      {
        title: '3. Movimenti, Filtri, Duplicazione & Giroconti',
        items: [
          {
            label: 'Inserimento, Modifica & Duplicazione Rapida',
            desc: 'Registra Entrate e Uscite indicando importo, conto, categoria, data, descrizione, note e #tag. Dall\'elenco puoi duplicare un movimento esistente con data odierna in un clic.',
          },
          {
            label: 'Ricerca Istantanea & Filtri Combinati',
            desc: 'Filtra per intervallo temporale (Oggi, Settimana, Mese, Anno, Date personalizzate), Tipo (Entrate/Uscite/Giroconti), Conto, Categoria e #Tag, oppure cerca testo libero o #hashtag.',
          },
          {
            label: 'Giroconti tra Conti Multi-Valuta',
            desc: 'Trasferisci fondi da un conto all\'altro (con conversione automatica secondo i tassi FX tra valute diverse) tramite finestra dedicata con anteprima di accredito e riepilogo di conferma.',
          },
        ],
      },
      {
        title: '4. Regole Automatiche di Categorizzazione & Sistema #Tag',
        items: [
          {
            label: 'Regole per Parole Chiave',
            desc: 'In Impostazioni -> Regole Automatiche imposti parole chiave separate da virgola (es. "esselunga, coop, lidl" -> Alimentari + #supermercato).',
          },
          {
            label: 'Applicazione Automatica & Retroattiva',
            desc: 'Le regole suggeriscono e compilano automaticamente categoria e #tag mentre digiti un nuovo movimento, durante l\'importazione di file CSV/Excel e anche retroattivamente su tutto lo storico con un clic.',
          },
        ],
      },
      {
        title: '5. Budget Mensili, Allarmi & Obiettivi di Risparmio',
        items: [
          {
            label: 'Limiti Mensili & Allarmi Preventivi',
            desc: 'Imposta un massimale mensile per ciascuna categoria di spesa. L\'app calcola l\'avanzamento e genera avvisi in Home e in Budget quando superi l\'80%, mantieni un ritmo giornaliero eccessivo o superi il limite.',
          },
          {
            label: 'Obiettivi di Risparmio (Salvadanai)',
            desc: 'Crea obiettivi dedicati (es. Fondo Emergenze, Vacanza, Auto) con importo target e scadenza, aggiungi versamenti parziali con preset rapidi e visualizza la percentuale raggiunta.',
          },
        ],
      },
      {
        title: '6. Debiti, Rate & Crediti (Spese Condivise)',
        items: [
          {
            label: 'Tracciamento Crediti, Prestiti & Piani a Rate',
            desc: 'Nella scheda Budget -> Debiti & Crediti registri soldi anticipati ad amici/colleghi (Crediti), finanziamenti (Prestiti) o acquisti a rate (importo rata, rate pagate su totali, scadenza e valuta).',
          },
          {
            label: 'Incasso o Pagamento Rata in 1 Tocco',
            desc: 'Usa i tasti rapidi (1 Rata, 50%, Salda Tutto o importo libero) e scegli se registrare automaticamente il corrispondente movimento di Entrata o Uscita sul conto bancario selezionato.',
          },
        ],
      },
      {
        title: '7. Scadenzario Ricorrenti & Previsione di Fine Mese',
        items: [
          {
            label: 'Movimenti Ricorrenti Automatici & Notifiche Scadenzario',
            desc: 'Configura stipendi, affitti, bollette e abbonamenti (Settimanali, Mensili, Annuali). Quando lo scadenzario registra automaticamente alla scadenza invia una notifica ("Hai un movimento in uscita / in entrata") con banner in Home e Push opzionale sul dispositivo.',
          },
          {
            label: 'Cashflow Forecast (Previsione Fine Mese)',
            desc: 'La scheda previsionale in Home combina i movimenti gia registrati nel mese, le scadenze ricorrenti attese fino al 30/31 e il ritmo medio delle spese variabili giornaliere per stimare il saldo a fine mese.',
          },
        ],
      },
      {
        title: '8. Analisi Avanzate: Confronto Mese su Mese & Riepilogo #Tag',
        items: [
          {
            label: 'Grafici Storici & Torta Categorie',
            desc: 'Esplora l\'andamento del saldo nel tempo (con minimo, massimo e variazione %), la ripartizione percentuale per categoria, il peso dei singoli conti e il confronto Entrate/Uscite degli ultimi 6 mesi.',
          },
          {
            label: 'Confronto Mese vs Mese',
            desc: 'Confronta Questo Mese con il Mese Scorso categoria per categoria, evidenziando la differenza netta, il badge percentuale (+% / -%) e le doppie barre ordinate per maggior scarto o spesa attuale.',
          },
          {
            label: 'Riepilogo Strategico per #Tag',
            desc: 'Aggrega entrate, uscite e conteggio movimenti per ogni #tag (ottimo per calcolare subito il costo di una #vacanza o le spese #detrazioni dell\'anno), con ricerca ed espansione dei singoli movimenti.',
          },
        ],
      },
      {
        title: '9. Import CSV/Excel, Report PDF, Backup & Android APK',
        items: [
          {
            label: 'Importazione Estratti Conto Bancari (CSV / Excel)',
            desc: 'Carica file .csv o .xlsx esportati dalla tua banca con riconoscimento automatico delle colonne, filtro anti-duplicati intelligente e applicazione immediata delle regole di categorizzazione.',
          },
          {
            label: 'Report PDF & Estratto Conto Automatico (Testata Bianca)',
            desc: 'Genera e scarica Report Finanziari Mensili, Estratti Conto Movimenti filtrati e Riepiloghi Saldi con testata bianca ad alta leggibilita. Puoi anche attivare l\'Estratto Conto Automatico Mensile inviabile via email.',
          },
          {
            label: 'Backup JSON, Auto-Backup Giornaliero & Export CSV',
            desc: 'Esporta e ripristina l\'intero archivio in JSON (inclusi debiti/crediti, regole, scorciatoie e tassi FX), attiva il backup automatico giornaliero locale o scarica i movimenti in CSV per Excel.',
          },
          {
            label: 'PWA Offline & Pacchetto Android APK',
            desc: 'Installa MyFinance come app nativa da browser oppure scarica myfinance_app.html / myfinance_app.zip dalle Impostazioni per creare il tuo pacchetto APK Android autonomo.',
          },
        ],
      },
    ],
    checklistTitle: '4 PASSI CONSIGLIATI PER LA CONFIGURAZIONE INIZIALE',
    checklist: [
      '1. Verifica conti, valute native e Valuta Base in Impostazioni -> Tassi di Cambio FX.',
      '2. Crea 2-3 Spese Preferite 1-Tap in Home e imposta le prime Regole Automatiche con #tag.',
      '3. Inserisci stipendi/abbonamenti nello Scadenzario e eventuali rate o crediti condivisi in Budget -> Debiti & Crediti.',
      '4. Attiva il PIN di sicurezza, il Backup Automatico giornaliero e l\'Estratto Conto Mensile PDF.',
    ],
    partBadge: 'PARTE I · ITALIANO',
    fileName: 'MyFinance_Pro_Guida_Completa_IT.pdf',
  },

  de: {
    mainTitle: 'MYFINANCE PRO',
    subtitle: 'Vollstaendige Funktionsanleitung & Benutzerhandbuch (v3.3)',
    badgeLine: 'Persoenliche Finanzen · 100% Lokaler Datenschutz · IT / DE / EN',
    editionLabel: 'Stand',
    introTitle: 'GESAMTUEBERBLICK',
    introBody:
      'MyFinance Pro ist Ihre umfassende Finanz-App fuer Web, Smartphone und Android-APK. Sie vereint Multi-Waehrungskonten, 1-Klick-Favoriten, Schulden/Raten/Forderungen, Monatsend-Prognosen, automatische Regeln mit #Tags, Monatsvergleiche, Bank-CSV/Excel-Import und A4-PDF-Berichte mit 100% lokaler Datenspeicherung.',
    tabOverviewTitle: 'APP-STRUKTUR: DIE 5 HAUPTBEREICHE IM UEBERBLICK',
    tabs: [
      {
        name: '1. Home (Dashboard)',
        summary:
          'Effektives Nettovermoegen (Liquiditaet + Forderungen - Schulden), Konten-Karussell, Schnellaktionen, 1-Klick-Favoriten, Monatsend-Prognose, Budget-Warnungen und Faeelligkeiten.',
      },
      {
        name: '2. Buchungen',
        summary:
          'Vollstaendiger Verlauf mit Sofortsuche (inkl. #Tags), kombinierten Filtern (Zeitraum, Typ, Konto, Kategorie, #Tag), Duplizieren auf heute und gefiltertem PDF-Export.',
      },
      {
        name: '3. Budgets & Schulden',
        summary:
          'Umschaltbar zwischen Monatsbudgets + Sparzielen sowie dem Bereich Schulden, Raten & Forderungen (geteilte Ausgaben) mit direkter Tilgungsbuchung.',
      },
      {
        name: '4. Analysen (6 Ansichten)',
        summary:
          'Saldoverlauf, Ausgaben-Tortendiagramm, Kontenverteilung, 6-Monats-Balken, Monatsvergleich (Aktuell vs. Vormonat) und detaillierter #Tag-Report.',
      },
      {
        name: '5. Einstellungen & APK',
        summary:
          'Konten, Kategorien, Dauerbuchungen, Auto-Regeln, Wechselkurse, PIN-/Fingerabdruck-Schutz, automatischer E-Mail-Kontoauszug, JSON/CSV-Backup und Android-APK-Pakete.',
      },
    ],
    sections: [
      {
        title: '1. Erster Start, PIN-Schutz & Diskret-Modus',
        items: [
          {
            label: 'Ersteinrichtung & Mehrsprachigkeit (IT / DE / EN)',
            desc: 'Beim ersten Oeffnen waehlen Sie Ihre Sprache (Italiano, Deutsch, English) und hinterlegen Namen sowie E-Mail-Adresse fuer monatliche PDF-Kontoauszuege. Die Sprache ist jederzeit umschaltbar.',
          },
          {
            label: 'App-Sperre mit PIN & Auto-Lock',
            desc: 'Aktivieren Sie in den Sicherheitseinstellungen eine 4- bis 6-stellige PIN inklusive automatischer Sperre bei Inaktivitaet oder App-Wechsel sowie Sofortsperre.',
          },
          {
            label: 'Diskret-Modus (Augen-Symbol im Header)',
            desc: 'Ein Tippen auf das Augen-Symbol oben blendet alle Kontostaende und Betraege in **** EUR aus - ideal fuer oeffentliche Verkehrsmittel oder unterwegs.',
          },
          {
            label: 'Zoom & Isolierter Geratespeicher',
            desc: 'Passen Sie die Oberflaeche von 60% bis 180% Zoom an. Alle Daten werden doppelt in LocalStorage und IndexedDB gesichert und bleiben auch bei geloeschtem Browserverlauf erhalten.',
          },
        ],
      },
      {
        title: '2. Home, Nettovermoegen & Multi-Waehrungs-Konten',
        items: [
          {
            label: 'Effektives Nettovermoegen (Liquiditaet + Forderungen - Schulden)',
            desc: 'Das Hauptbanner trennt echte Kontoliquiditaet sauber von offenen Forderungen (+) und Restschulden/Raten (-). Ein Tippen auf die Aufschluesselung oeffnet direkt die Schuldenverwaltung.',
          },
          {
            label: '5 Waehrungen & Wechselkurse (EUR, USD, GBP, JPY, CHF)',
            desc: 'Jedes Konto fuehrt seinen echten Saldo in Originalwaehrung. Gesamtsummen, Budgets und Analysen werden ueber Live-EZB-Kurse oder eigene Offline-Kurse in Ihre Basiswaehrung umgerechnet.',
          },
          {
            label: 'Favoriten-Kurzwahl (1-Klick) mit Pruefdialog',
            desc: 'Legen Sie auf dem Home-Bildschirm Vorlagen fuer Alltagszahlungen an (z. B. Kaffee 1,50 EUR, Einkauf, Tanken 30 EUR) mit festem Konto, Kategorie und #Tag; beim Antippen erscheint ein Prueffenster zur Bestaetigung vor der Buchung.',
          },
          {
            label: 'Schnellaktionsleiste & Konten-Karussell',
            desc: 'Wischen Sie durch die Einzelkonten oder nutzen Sie die 3 Direkttasten (Neu, Umbuchen, CSV-Import) fuer schnelle Erfassung.',
          },
        ],
      },
      {
        title: '3. Buchungen, Filter, Duplizieren & Umbuchungen',
        items: [
          {
            label: 'Erfassen, Bearbeiten & auf Heute Duplizieren',
            desc: 'Erfassen Sie Einnahmen und Ausgaben mit Konto, Kategorie, Datum, Notizen und #Tags. Wiederkehrende Einkaeufe lassen sich aus der Liste mit einem Klick auf heute duplizieren.',
          },
          {
            label: 'Sofortsuche & Kombinierte Filter',
            desc: 'Filtern Sie nach Zeitraum (Heute, Woche, Monat, Jahr, Wunschdatum), Buchungstyp, Konto, Kategorie und #Tag oder suchen Sie direkt nach Text und #Hashtags.',
          },
          {
            label: 'Multi-Waehrungs-Umbuchungen',
            desc: 'Uebertragen Sie Gelder zwischen eigenen Konten (inkl. automatischer FX-Umrechnung zwischen verschiedenen Waehrungen) mit Vorschau des Gutschriftsbetrags und Bestaetigungsdialog.',
          },
        ],
      },
      {
        title: '4. Automatische Kategorisierungsregeln & #Tags',
        items: [
          {
            label: 'Schluesselwort-Regeln verwalten',
            desc: 'Definieren Sie unter Einstellungen -> Regeln Komma-getrennte Begriffe (z. B. "rewe, lidl, aldi" -> Lebensmittel + #supermarkt).',
          },
          {
            label: 'Live-, CSV- & Rueckwirkende Anwendung',
            desc: 'Regeln greifen automatisch waehrend der Eingabe, beim Import von Bankauszuegen und lassen sich per Knopfdruck rueckwirkend auf alle bestehenden Buchungen anwenden.',
          },
        ],
      },
      {
        title: '5. Monatsbudgets, Warnungen & Sparziele',
        items: [
          {
            label: 'Monatslimits & Intelligente Warnmeldungen',
            desc: 'Setzen Sie Ausgabenlimits pro Kategorie. Die App prueft Ihren Verbrauch laufend und warnt fruehzeitig ab 80%, bei zu hohem Tagesausgabentempo oder Limit-Ueberschreitung.',
          },
          {
            label: 'Sparziele mit Fortschrittsbalken',
            desc: 'Erstellen Sie Sparziele (z. B. Notgroschen, Urlaub, Fahrzeug) mit Zieldatum und Einzahlungen per Schnellauswahl direkt in der App.',
          },
        ],
      },
      {
        title: '6. Schulden, Ratenplaene & Forderungen',
        items: [
          {
            label: 'Auslagen, Darlehen & Ratenkaeufe erfassen',
            desc: 'Verfolgen Sie vorgestreckte Betraege fuer Freunde/Kollegen (Forderungen), Kredite sowie Ratenplaene inklusive Monatsrate, bezahlter Ratenanzahl und Faelligkeit.',
          },
          {
            label: '1-Klick-Zahlung mit optionaler Kontobuchung',
            desc: 'Begleichen Sie Teilbetraege, 1 Rate, 50% oder den Gesamtbetrag und verbuchen Sie auf Wunsch automatisch die passende Einnahme oder Ausgabe auf Ihrem Konto.',
          },
        ],
      },
      {
        title: '7. Dauerbuchungen & Monatsend-Prognose',
        items: [
          {
            label: 'Automatischer Faelligkeitsplaner & Benachrichtigungen',
            desc: 'Verwalten Sie Gehalt, Miete, Strom und Abos (woechentlich, monatlich, jaehrlich). Bei automatischer Faelligkeitsbuchung erhalten Sie eine Meldung ("Ausgangs-/Eingangsbuchung erfasst") als Home-Banner und optional per Geraete-Push.',
          },
          {
            label: 'Cashflow-Prognose zum Monatsende',
            desc: 'Die Prognosekarte kombiniert aktuelle Monatsumsaetze, noch offene Dauerbuchungen bis Monatsultimo sowie Ihr bisheriges variables Ausgabentempo fuer eine realistische Endsaldo-Schaetzung.',
          },
        ],
      },
      {
        title: '8. Erweiterte Analysen: Monatsvergleich & #Tag-Report',
        items: [
          {
            label: 'Verlaufs-, Torten-, Konten- & 6M-Diagramme',
            desc: 'Analysieren Sie Vermoegensentwicklung (Min/Max/Delta), Ausgabenanteile je Kategorie, Kontengewichtung und die 6-Monats-Entwicklung in Ihrer Basiswaehrung.',
          },
          {
            label: 'Monat-gegen-Monat-Vergleich (MoM)',
            desc: 'Vergleicht den aktuellen Monat direkt mit dem Vormonat je Kategorie inklusive Differenzbetrag, Prozent-Badge und Doppelbalken, sortierbar nach groesster Abweichung.',
          },
          {
            label: '#Tag-Auswertung mit Detailansicht',
            desc: 'Summiert Ausgaben, Einnahmen und Anzahl aller Buchungen pro #Tag (ideal fuer #urlaub oder #absetzbar) inklusive Suchfeld und aufklappbarer Einzelbuchungsliste.',
          },
        ],
      },
      {
        title: '9. Bank-Import (CSV/Excel), PDF-Berichte, Backup & APK',
        items: [
          {
            label: 'CSV- & Excel-Kontoauszug-Import',
            desc: 'Importieren Sie .csv- oder .xlsx-Dateien Ihrer Bank mit automatischer Spaltenzuordnung, Duplikaterkennung und direkter Regel-Kategorisierung.',
          },
          {
            label: 'PDF-Berichte & Automatischer Kontoauszug (Weisser Kopf)',
            desc: 'Erstellen Sie Monatsberichte, gefilterte Umsatzlisten und Saldenuebersichten mit klarem weissem Dokumentkopf sowie automatische monatliche PDF-Auszuege fuer den E-Mail-Versand.',
          },
          {
            label: 'JSON-Backup, Taegliches Auto-Backup & CSV-Export',
            desc: 'Sichern und wiederherstellen Sie alle Daten komplett im JSON-Format, aktivieren Sie das taegliche lokale Auto-Backup oder exportieren Sie Tabellen im CSV-Format.',
          },
          {
            label: 'Offline-PWA & Eigenstaendiges Android-APK-Paket',
            desc: 'Installieren Sie MyFinance direkt als App oder laden Sie myfinance_app.html bzw. myfinance_app.zip in den Einstellungen herunter, um Ihr eigenes Android-APK zu erstellen.',
          },
        ],
      },
    ],
    checklistTitle: '4 EMPFOHLENE SCHRITTE FUER DEN OPTIMALEN START',
    checklist: [
      '1. Konto-Waehrungen und Basiswaehrung unter Einstellungen -> Wechselkurse festlegen.',
      '2. 2-3 Favoriten auf Home erstellen und Schluesselwort-Regeln mit #Tags anlegen.',
      '3. Fixkosten im Dauerbuchungs-Planer sowie Raten/Forderungen unter Budgets -> Schulden & Forderungen pflegen.',
      '4. PIN-Schutz, taegliches Auto-Backup und monatlichen PDF-Kontoauszug aktivieren.',
    ],
    partBadge: 'TEIL II · DEUTSCH',
    fileName: 'MyFinance_Pro_Vollstaendige_Anleitung_DE.pdf',
  },

  en: {
    mainTitle: 'MYFINANCE PRO',
    subtitle: 'Complete App Feature Guide & User Manual (Edition v3.3)',
    badgeLine: 'Personal Finance · 100% Local Privacy · Multilingual IT / DE / EN',
    editionLabel: 'Edition',
    introTitle: 'OVERVIEW',
    introBody:
      'MyFinance Pro is your complete personal finance application for Web, mobile browsers, and Android APK. It brings together multi-currency accounts, 1-tap favorite shortcuts, debts/installments/shared credits, end-of-month cashflow forecasting, keyword #tag rules, month-over-month analytics, CSV/Excel bank statement import, and A4 PDF reports with 100% local privacy.',
    tabOverviewTitle: 'APP ARCHITECTURE: THE 5 CORE TABS',
    tabs: [
      {
        name: '1. Home Dashboard',
        summary:
          'Effective Net Worth (Liquid Cash + Credits - Debts), accounts carousel, quick actions bar, 1-tap Favorite Quick Log, End-of-Month Forecast, Budget Alerts, Upcoming Bills, and recent items.',
      },
      {
        name: '2. Transactions',
        summary:
          'Full ledger with instant search (including #tags), multi-filters (period, type, account, category, #tag), inline edit, 1-tap duplicate to today, and filtered PDF export.',
      },
      {
        name: '3. Budgets & Debts',
        summary:
          'Dual switcher between Monthly Budgets + Savings Goals and Debts, Installments & Credits (Shared Expenses) with 1-tap repayment or installment logging.',
      },
      {
        name: '4. Analytics (6 Views)',
        summary:
          'Balance history trend, category expense pie, account distribution, 6-month income/expense bars, Month-over-Month category diff, and #Tag summary breakdown.',
      },
      {
        name: '5. Settings & APK',
        summary:
          'Manage accounts, categories, recurring items, auto rules, FX rates, PIN/Fingerprint lock, automatic monthly email statements, JSON/CSV backups, and standalone Android APK bundles.',
      },
    ],
    sections: [
      {
        title: '1. First Launch, PIN Security & Privacy Mode',
        items: [
          {
            label: 'Onboarding & Multilingual Switcher (IT / DE / EN)',
            desc: 'On first launch, choose your preferred language (Italiano, Deutsch, English) and enter your name and email address (used for monthly PDF statements). Switch languages anytime.',
          },
          {
            label: 'PIN Lock & Auto-Lock Timeout',
            desc: 'Enable a 4-6 digit PIN lock in Security Settings with configurable auto-lock when switching apps or after inactivity, plus a 1-tap instant Lock action.',
          },
          {
            label: 'Privacy Mode (Eye Toggle in Header)',
            desc: 'Tap the eye icon in the top header to instantly mask all balances and amounts (**** EUR) across Home, charts, ledger, and debts/credits when using the app in public.',
          },
          {
            label: 'Global Zoom & Persistent Device Storage',
            desc: 'Adjust interface zoom from 60% to 180% for comfortable readability. Data is dual-saved to LocalStorage and IndexedDB so clearing browser cache does not wipe your records.',
          },
        ],
      },
      {
        title: '2. Home Dashboard, Unified Net Worth & Multi-Currency',
        items: [
          {
            label: 'Effective Net Worth (Liquid Cash + Credits - Debts)',
            desc: 'The main Net Worth card clearly separates Real Account Liquidity from Credits Receivable (+) and Remaining Debts/Installments (-). Tap the breakdown box to jump directly to Debts & Credits.',
          },
          {
            label: 'Multi-Currency Support (EUR, USD, GBP, JPY, CHF)',
            desc: 'Every account retains its true native currency balance. Consolidated Net Worth, budgets, and analytics convert automatically to your Base Currency using live ECB rates or custom offline overrides.',
          },
          {
            label: '1-Tap Favorite Quick Log with Confirmation Review',
            desc: 'Set up reusable home buttons (e.g. Coffee 1.50 EUR, Groceries, Fuel 30 EUR) pre-configured with account, category, and #tags; tapping opens a quick verification dialog so you can review and accept before recording.',
          },
          {
            label: 'Quick Actions Bar & Accounts Carousel',
            desc: 'Swipe through individual account cards or tap the 3 quick buttons (New, Transfer, Import CSV) to perform common workflows immediately.',
          },
        ],
      },
      {
        title: '3. Transactions, Filters, Duplication & Transfers',
        items: [
          {
            label: 'Add, Edit & 1-Tap Duplicate to Today',
            desc: 'Record Income and Expenses with amount, account, category, date, description, notes, and #tags. Repeat any existing ledger item with today\'s date in a single tap.',
          },
          {
            label: 'Instant Search & Combined Filters',
            desc: 'Filter transactions simultaneously by Period (Today, Week, Month, Year, Custom dates), Type, Account, Category, and #Tag, or search keywords and #hashtags.',
          },
          {
            label: 'Cross-Currency Account Transfers',
            desc: 'Move funds between accounts (with automatic FX conversion across different account currencies) displaying a live credited-amount preview and full confirmation dialog before execution.',
          },
        ],
      },
      {
        title: '4. Auto-Categorization Keyword Rules & #Tag System',
        items: [
          {
            label: 'Custom Keyword Rules',
            desc: 'Under Settings -> Auto Rules, create comma-separated keyword rules (e.g., "aldi, lidl, coop" -> Groceries + #supermarket).',
          },
          {
            label: 'Live, CSV Import & Retroactive Matching',
            desc: 'Rules auto-fill categories and #tags live as you type descriptions, automatically tag imported bank CSV/Excel rows, and can update your entire existing history in 1 tap.',
          },
        ],
      },
      {
        title: '5. Monthly Budgets, Smart Alerts & Savings Goals',
        items: [
          {
            label: 'Category Budgets & Pacing Warnings',
            desc: 'Set monthly spending limits per category. The app monitors current spend and triggers alerts on Home and Budgets at 80% used, high daily pacing risk, or limit exceeded.',
          },
          {
            label: 'Savings Goals (Virtual Jars)',
            desc: 'Track dedicated savings targets (Emergency Fund, Travel, Car) with optional deadlines, preset deposit buttons, and visual completion milestones.',
          },
        ],
      },
      {
        title: '6. Debts, Installments & Credits (Shared Expenses)',
        items: [
          {
            label: 'Track Shared Expenses, Loans & Installments',
            desc: 'In Budgets -> Debts & Credits, log money advanced to friends/colleagues (Credits), personal loans, and installment plans (monthly amount, paid/total installments, due date, currency).',
          },
          {
            label: '1-Tap Installment / Settlement Sync',
            desc: 'Record repayments or installments using presets (1 Rate, 50%, Full, or custom amount) with an optional toggle to automatically post the matching Income or Expense transaction to a chosen account.',
          },
        ],
      },
      {
        title: '7. Recurring Scheduler & End-of-Month Forecast',
        items: [
          {
            label: 'Automated Recurring Movements & Notifications',
            desc: 'Schedule salaries, rent, utilities, and subscriptions (Weekly, Monthly, Yearly). When due items auto-post, the scheduler displays an incoming/outgoing notification banner on Home and optional device push alerts.',
          },
          {
            label: 'End-of-Month Cashflow Forecast',
            desc: 'Combines actual month-to-date cashflow, pending scheduled recurring items until month-end, and your daily variable spending pace to project your closing balance.',
          },
        ],
      },
      {
        title: '8. Advanced Analytics: Month-over-Month & #Tag Summary',
        items: [
          {
            label: 'Balance Trend, Expense Pie, Accounts & 6M Bars',
            desc: 'Inspect balance history (min, max, delta %), category expense breakdown, per-account allocation, and 6-month income vs expense trends converted to your Base Currency.',
          },
          {
            label: 'Month-over-Month (MoM) Comparison',
            desc: 'Side-by-side comparison of This Month vs Last Month for every category, displaying net currency delta, percentage change badges (+% / -%), and dual progress bars.',
          },
          {
            label: '#Tag Summary & Drilldown',
            desc: 'Automatically totals expenses, income, and transaction counts per #tag (ideal for #vacation budgets or annual #deductible tracking) with instant search and expandable transaction lists.',
          },
        ],
      },
      {
        title: '9. CSV/Excel Bank Import, White-Header PDFs, Backup & APK',
        items: [
          {
            label: 'CSV / Excel Bank Statement Import',
            desc: 'Load .csv or .xlsx bank exports with smart column detection, duplicate transaction filtering, and automatic rule categorization prior to import.',
          },
          {
            label: 'White-Header PDF Reports & Monthly Auto-Statement',
            desc: 'Export Monthly Financial Reports, filtered Ledger Statements, and Account Summaries styled with clean white print-ready headers, plus automated monthly A4 PDF statement generation & email delivery.',
          },
          {
            label: 'Full JSON Backup, Daily Auto-Backup & CSV Export',
            desc: 'Export/restore everything in JSON (including debts/credits, rules, shortcuts, and FX rates), enable daily local auto-backups, or export spreadsheets in CSV format.',
          },
          {
            label: 'Offline PWA & Standalone Android APK Package',
            desc: 'Install as a Progressive Web App or download myfinance_app.html / myfinance_app.zip from Settings to wrap as a self-contained Android APK.',
          },
        ],
      },
    ],
    checklistTitle: '4 RECOMMENDED STEPS TO GET STARTED',
    checklist: [
      '1. Verify account currencies and set your preferred Base Currency under Settings -> FX Rates.',
      '2. Add 2-3 Favorite 1-Tap Shortcuts on Home and configure your top keyword #tag rules.',
      '3. Register salaries/bills in Recurring Scheduler and any loans or shared expenses in Budgets -> Debts & Credits.',
      '4. Enable PIN Security, Daily Auto-Backup, and Monthly PDF Statements.',
    ],
    partBadge: 'PART III · ENGLISH',
    fileName: 'MyFinance_Pro_Complete_Guide_EN.pdf',
  },
};

function renderLanguageGuideIntoDoc(
  doc: jsPDF,
  lang: Language,
  options: {
    startOnNewPage: boolean;
    showPartBadge: boolean;
    onPageCreated?: (pageNum: number, lang: Language) => void;
  }
): void {
  const copy = GUIDE_CONTENT[lang] || GUIDE_CONTENT.it;
  const locale = lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-US' : 'it-IT';

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const maxContentY = pageHeight - 20;

  let cursorY = margin;

  const notifyCurrentPage = () => {
    const pageNum = doc.getNumberOfPages();
    if (options.onPageCreated) {
      options.onPageCreated(pageNum, lang);
    }
  };

  if (options.startOnNewPage) {
    doc.addPage();
  }
  notifyCurrentPage();

  const drawContinuationHeader = () => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, margin, contentWidth, 12, 2, 2, 'FD');
    doc.setFillColor(79, 70, 229);
    doc.rect(margin, margin, 2.5, 12, 'F');
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.45);
    doc.line(margin, margin + 12, pageWidth - margin, margin + 12);
    doc.setLineWidth(0.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.2);
    doc.setTextColor(15, 23, 42);
    doc.text(`${copy.mainTitle} - ${copy.subtitle}`, margin + 5.5, margin + 7.7);

    if (options.showPartBadge) {
      doc.setFontSize(7.5);
      doc.setTextColor(79, 70, 229);
      doc.text(copy.partBadge, pageWidth - margin - 4, margin + 7.7, { align: 'right' });
    }
    cursorY = margin + 17;
  };

  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight > maxContentY) {
      doc.addPage();
      notifyCurrentPage();
      drawContinuationHeader();
    }
  };

  const drawSectionBar = (title: string) => {
    ensureSpace(14);
    doc.setFillColor(238, 242, 255); // Indigo 50
    doc.roundedRect(margin, cursorY, contentWidth, 7.5, 1.5, 1.5, 'F');
    doc.setFillColor(79, 70, 229);
    doc.rect(margin, cursorY, 2.5, 7.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.3);
    doc.setTextColor(30, 41, 59);
    doc.text(title, margin + 5.5, cursorY + 5.2);
    cursorY += 10.5;
  };

  // --- WHITE HEADER BANNER (Testata Bianca) ---
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 30, 2.5, 2.5, 'FD');
  doc.setFillColor(79, 70, 229);
  doc.rect(margin, cursorY, 3, 30, 'F');
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.6);
  doc.line(margin, cursorY + 30, pageWidth - margin, cursorY + 30);
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15.5);
  doc.setTextColor(15, 23, 42);
  doc.text(copy.mainTitle, margin + 7, cursorY + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(79, 70, 229);
  doc.text(copy.subtitle, margin + 7, cursorY + 17.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);
  doc.text(copy.badgeLine, margin + 7, cursorY + 24.5);

  doc.setFontSize(7.5);
  doc.text(
    `${copy.editionLabel}: ${new Date().toLocaleDateString(locale)}`,
    pageWidth - margin - 4,
    cursorY + 10.5,
    { align: 'right' }
  );
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text(options.showPartBadge ? copy.partBadge : 'v3.3 Pro', pageWidth - margin - 4, cursorY + 17.5, {
    align: 'right',
  });

  cursorY += 35;

  // --- OVERVIEW BOX ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.3);
  const introLines = doc.splitTextToSize(copy.introBody, contentWidth - 10);
  const introBoxH = introLines.length * 4 + 10;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, contentWidth, introBoxH, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(79, 70, 229);
  doc.text(copy.introTitle, margin + 5, cursorY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.3);
  doc.setTextColor(51, 65, 85);
  doc.text(introLines, margin + 5, cursorY + 10.5);
  cursorY += introBoxH + 5;

  // --- 6 CORE TABS GRID ---
  drawSectionBar(copy.tabOverviewTitle);
  const colW = (contentWidth - 4) / 2;
  for (let i = 0; i < copy.tabs.length; i += 2) {
    const rowItems = [copy.tabs[i], copy.tabs[i + 1]].filter(Boolean);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.7);
    const wrapped = rowItems.map((t) => doc.splitTextToSize(t.summary, colW - 8));
    const maxLines = Math.max(...wrapped.map((w) => w.length));
    const cardH = Math.max(21, maxLines * 3.6 + 10.5);

    ensureSpace(cardH + 3.5);

    rowItems.forEach((item, colIdx) => {
      const x = margin + colIdx * (colW + 4);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, cursorY, colW, cardH, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.3);
      doc.setTextColor(79, 70, 229);
      doc.text(item.name, x + 4, cursorY + 5.3);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.7);
      doc.setTextColor(71, 85, 105);
      doc.text(wrapped[colIdx], x + 4, cursorY + 9.8);
    });

    cursorY += cardH + 3;
  }

  cursorY += 2;

  // --- ALL 10 FEATURE SECTIONS ---
  copy.sections.forEach((section) => {
    drawSectionBar(section.title);

    section.items.forEach((item) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      const descLines = doc.splitTextToSize(item.desc, contentWidth - 9);
      const itemHeight = 5.5 + descLines.length * 3.75 + 2.5;

      ensureSpace(itemHeight);

      // Subtle vertical accent dot/bar
      doc.setFillColor(99, 102, 241);
      doc.circle(margin + 2.5, cursorY + 2.2, 1.0, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.6);
      doc.setTextColor(15, 23, 42);
      doc.text(item.label, margin + 5.5, cursorY + 3.1);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.1);
      doc.setTextColor(71, 85, 105);
      doc.text(descLines, margin + 5.5, cursorY + 7.2);

      cursorY += itemHeight;
    });

    cursorY += 1.5;
  });

  // --- CHECKLIST BOX ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.1);
  const checkWrapped = copy.checklist.map((line) => doc.splitTextToSize(line, contentWidth - 10));
  const totalCheckLines = checkWrapped.reduce((acc, lines) => acc + lines.length, 0);
  const boxH = totalCheckLines * 4.2 + copy.checklist.length * 1.2 + 12;

  ensureSpace(boxH + 2);
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(167, 243, 208); // Emerald 200
  doc.roundedRect(margin, cursorY, contentWidth, boxH, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(6, 95, 70);
  doc.text(copy.checklistTitle, margin + 5, cursorY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.1);
  doc.setTextColor(30, 41, 59);
  let checkY = cursorY + 11.5;
  checkWrapped.forEach((lines) => {
    doc.text(lines, margin + 5, checkY);
    checkY += lines.length * 4.2 + 1.2;
  });
}

function applyFootersToAllPages(
  doc: jsPDF,
  pageLanguages: Map<number, Language>,
  fallbackLang: Language
): void {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const lang = pageLanguages.get(p) || fallbackLang;
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
    const pgLabel =
      lang === 'de'
        ? `Seite ${p} von ${totalPages}`
        : lang === 'en'
          ? `Page ${p} of ${totalPages}`
          : `Pagina ${p} di ${totalPages}`;
    doc.text(pgLabel, pageWidth - margin, pageHeight - 9, { align: 'right' });
  }
}

export function buildCompleteGuidePdfDocument(language: Language = 'it'): {
  doc: jsPDF;
  fileName: string;
} {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageLanguages = new Map<number, Language>();
  renderLanguageGuideIntoDoc(doc, language, {
    startOnNewPage: false,
    showPartBadge: false,
    onPageCreated: (pageNum, pgLang) => pageLanguages.set(pageNum, pgLang),
  });

  applyFootersToAllPages(doc, pageLanguages, language);

  const fileName = GUIDE_CONTENT[language]?.fileName || GUIDE_CONTENT.it.fileName;
  return { doc, fileName };
}

export function buildTrilingualCompleteGuidePdfDocument(): {
  doc: jsPDF;
  fileName: string;
} {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageLanguages = new Map<number, Language>();
  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  pageLanguages.set(1, 'it');

  // --- TRILINGUAL WHITE COVER / INDEX HEADER ---
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 42, 3, 3, 'FD');
  doc.setFillColor(79, 70, 229);
  doc.rect(margin, cursorY, 3.5, 42, 'F');
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.7);
  doc.line(margin, cursorY + 42, pageWidth - margin, cursorY + 42);
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('MYFINANCE PRO - v3.3', margin + 8, cursorY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(79, 70, 229);
  doc.text('GUIDA COMPLETA · VOLLSTAENDIGE ANLEITUNG · COMPLETE GUIDE', margin + 8, cursorY + 20.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Italiano (IT) · Deutsch (DE) · English (EN) | Web, Mobile PWA & Android APK', margin + 8, cursorY + 28.5);
  doc.text(
    `Edizione / Ausgabe / Edition: ${new Date().toLocaleDateString('it-IT')}`,
    margin + 8,
    cursorY + 35.5
  );

  cursorY += 50;

  // 3 Language Index Cards on Cover Page
  const langCards: { badge: string; title: string; subtitle: string; desc: string }[] = [
    {
      badge: 'PARTE I · ITALIANO',
      title: 'Guida Completa alle Funzioni',
      subtitle: 'Tutte le 9 aree funzionali e i 5 pannelli dell\'app',
      desc: 'Primo avvio, sicurezza PIN & impronta, Modalita Discreta (occhio), Patrimonio Netto Effettivo (Liquidita + Crediti - Debiti), Spese Preferite 1-Tap, Regole #tag, Budget e Allarmi, Rate/Crediti, Previsione Fine Mese, Analisi Mese vs Mese, Import CSV/Excel, Report PDF con testata bianca, Backup & Android APK.',
    },
    {
      badge: 'TEIL II · DEUTSCH',
      title: 'Vollstaendige Funktionsanleitung',
      subtitle: 'Alle 9 Funktionsbereiche und 5 Hauptansichten im Detail',
      desc: 'Ersteinrichtung, PIN- & Fingerabdruck-Schutz, Diskret-Modus, Effektives Nettovermoegen (Liquiditaet + Forderungen - Schulden), 1-Klick-Favoriten, Schluesselwort-Regeln & #Tags, Budgets & Warnungen, Schulden/Raten, Monatsend-Prognose, Monatsvergleich, CSV/Excel-Import, PDF-Berichte mit weissem Kopf & Android-APK.',
    },
    {
      badge: 'PART III · ENGLISH',
      title: 'Complete App Feature Guide',
      subtitle: 'All 9 feature modules and 5 core tabs explained step-by-step',
      desc: 'Onboarding, PIN & fingerprint lock, Privacy Mode, Effective Net Worth (Liquid Cash + Credits - Debts), 1-Tap Favorite Shortcuts, Keyword Rules & #Tags, Budgets & Pacing Alerts, Installments & Shared Expenses, End-of-Month Forecast, MoM & #Tag Analytics, CSV/Excel Import, White-Header PDFs & Android APK.',
    },
  ];

  langCards.forEach((card) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    const lines = doc.splitTextToSize(card.desc, contentWidth - 12);
    const cardH = 19 + lines.length * 4;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, cursorY, contentWidth, cardH, 2.5, 2.5, 'FD');
    doc.setFillColor(79, 70, 229);
    doc.rect(margin, cursorY, 2.5, cardH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(79, 70, 229);
    doc.text(card.badge, margin + 6, cursorY + 6.5);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(card.title, margin + 6, cursorY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(card.subtitle, margin + 6, cursorY + 16.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(51, 65, 85);
    doc.text(lines, margin + 6, cursorY + 22);

    cursorY += cardH + 6;
  });

  // Render IT, DE, EN sections sequentially starting on fresh pages
  (['it', 'de', 'en'] as Language[]).forEach((lang) => {
    renderLanguageGuideIntoDoc(doc, lang, {
      startOnNewPage: true,
      showPartBadge: true,
      onPageCreated: (pageNum, pgLang) => pageLanguages.set(pageNum, pgLang),
    });
  });

  applyFootersToAllPages(doc, pageLanguages, 'it');

  return {
    doc,
    fileName: 'MyFinance_Pro_Guida_Completa_IT_DE_EN.pdf',
  };
}

export function generateCompleteGuidePdf(language: Language = 'it'): string {
  const { doc, fileName } = buildCompleteGuidePdfDocument(language);
  doc.save(fileName);
  return fileName;
}

export function generateTrilingualCompleteGuidePdf(): string {
  const { doc, fileName } = buildTrilingualCompleteGuidePdfDocument();
  doc.save(fileName);
  return fileName;
}
