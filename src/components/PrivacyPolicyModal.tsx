import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Globe,
  Smartphone,
  Database,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Printer,
  Trash2,
  Ban,
} from 'lucide-react';
import { Language } from '../utils/translations';
import { printHtmlDocument } from '../utils/printHelper';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onShowToast?: (msg: string) => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  language,
  onShowToast,
}) => {
  const [viewLang, setViewLang] = useState<Language>(language);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    setViewLang(language);
  }, [language, isOpen]);

  if (!isOpen) return null;

  const isDe = viewLang === 'de';
  const isEn = viewLang === 'en';

  const isHttpOrigin =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'http:' || window.location.protocol === 'https:');

  const publicPolicyUrl = isHttpOrigin
    ? `${window.location.origin}/privacy-policy.html`
    : 'https://<il-tuo-dominio-app>/privacy-policy.html';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicPolicyUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2200);
      if (onShowToast) {
        onShowToast(
          isDe
            ? 'Privacy-Policy-URL kopiert!'
            : isEn
              ? 'Privacy Policy URL copied!'
              : 'URL Privacy Policy copiato negli appunti!'
        );
      }
    } catch {
      if (onShowToast) {
        onShowToast(
          isDe
            ? 'Kopieren nicht möglich. URL manuell markieren.'
            : isEn
              ? 'Could not copy automatically. Select URL manually.'
              : 'Copia automatica non riuscita. Copia il link manualmente.'
        );
      }
    }
  };

  const handlePrintPolicy = () => {
    const title = isDe
      ? 'Datenschutzerklärung — MyFinance Pro'
      : isEn
        ? 'Privacy Policy — MyFinance Pro'
        : 'Privacy Policy — MyFinance Pro';

    const sectionsHtml = isDe
      ? `
        <div class="policy-meta">
          <strong>Verantwortlicher / Entwickler:</strong> Federico Pontedoro (<a href="mailto:fpontedoro@gmail.com">fpontedoro@gmail.com</a>) · <strong>Stand:</strong> 23.11.2026
        </div>
        <div class="policy-section">
          <h2>1. Verantwortlicher &amp; Kontakt</h2>
          <p>MyFinance Pro wird von Federico Pontedoro entwickelt. Für Datenschutzfragen wenden Sie sich jederzeit an <a href="mailto:fpontedoro@gmail.com">fpontedoro@gmail.com</a>.</p>
        </div>
        <div class="policy-section">
          <h2>2. 100% Lokale Datenspeicherung (Kein Cloud-Server)</h2>
          <p>Alle Konten, Buchungen, Kategorien, Budgets, Sparziele, Dauerbuchungen, Schulden/Forderungen sowie Ihr optionales lokales Profil werden ausschließlich lokal im Gerätespeicher (LocalStorage &amp; IndexedDB) gespeichert. Ihr Passwort wird nur als gesalzener SHA-256-Hash abgelegt.</p>
        </div>
        <div class="policy-section">
          <h2>3. Optionale Online-Funktionen (Nur auf Klick)</h2>
          <ul>
            <li><strong>Wechselkurse:</strong> Anonyme Leseabfrage öffentlicher Referenzkurse (EZB / Frankfurter API) ohne personenbezogene Daten.</li>
            <li><strong>E-Mail / Wiederherstellung:</strong> Nutzt Ihre lokale E-Mail-App (mailto:) oder einen selbst hinterlegten Webhook.</li>
          </ul>
        </div>
        <div class="policy-section">
          <h2>4. Geräteberechtigungen</h2>
          <p>Dateizugriff und lokale Benachrichtigungen werden ausschließlich genutzt, wenn Sie CSV/Excel/JSON importieren/exportieren oder Zahlungserinnerungen aktivieren.</p>
        </div>
        <div class="policy-section">
          <h2>5. Keine Werbung, kein Tracking &amp; Finanzhinweis</h2>
          <p>Keine Werbebanner, keine Drittanbieter-Tracker, kein Datenverkauf. MyFinance Pro ist ein reines persönliches Budget-Werkzeug und bietet keine Kredite oder regulierte Finanzberatung an.</p>
        </div>
        <div class="policy-section">
          <h2>6. Ihre 6 DSGVO-Rechte &amp; Datenlöschung</h2>
          <p>Gemäß DSGVO behalten Sie die volle Kontrolle über Ihre lokal gespeicherten Daten. Sie haben folgende 6 Rechte:</p>
          <ul>
            <li><strong>1. Auskunftsrecht (Art. 15):</strong> Alle gespeicherten Konten, Buchungen und Profildaten jederzeit direkt in der App einsehen.</li>
            <li><strong>2. Recht auf Berichtigung (Art. 16):</strong> Jede Buchung, Kategorie oder Profilangabe direkt bearbeiten.</li>
            <li><strong>3. Recht auf Löschung (Art. 17):</strong> Einzelne Einträge oder sämtliche App-Daten unwiderruflich über die Geräteeinstellungen bzw. Deinstallation löschen.</li>
            <li><strong>4. Recht auf Einschränkung (Art. 18):</strong> Online-Abrufe (z. B. Wechselkurse) oder Erinnerungen jederzeit deaktiviert lassen; die App läuft 100% offline.</li>
            <li><strong>5. Recht auf Datenübertragbarkeit (Art. 20):</strong> Vollständigen Datenexport jederzeit als <strong>.JSON, .CSV oder .PDF</strong> durchführen.</li>
            <li><strong>6. Widerspruchsrecht (Art. 21):</strong> Keine Profilbildung, kein Tracking und keine Werbung; Beschwerden oder Anfragen an <a href="mailto:fpontedoro@gmail.com">fpontedoro@gmail.com</a>.</li>
          </ul>
        </div>
      `
      : isEn
        ? `
        <div class="policy-meta">
          <strong>Developer / Data Controller:</strong> Federico Pontedoro (<a href="mailto:fpontedoro@gmail.com">fpontedoro@gmail.com</a>) · <strong>Updated:</strong> Nov 23, 2026
        </div>
        <div class="policy-section">
          <h2>1. Developer &amp; Contact</h2>
          <p>MyFinance Pro is developed by Federico Pontedoro. For any privacy inquiry, contact <a href="mailto:fpontedoro@gmail.com">fpontedoro@gmail.com</a>.</p>
        </div>
        <div class="policy-section">
          <h2>2. 100% Local Device Storage (Zero Cloud DB)</h2>
          <p>All accounts, transactions, categories, budgets, goals, recurring schedules, debts/credits, and your optional local profile stay exclusively inside your device LocalStorage &amp; IndexedDB. Your unlock password is stored solely as a salted SHA-256 cryptographic hash.</p>
        </div>
        <div class="policy-section">
          <h2>3. Optional Online Features (User-Initiated Only)</h2>
          <ul>
            <li><strong>FX Rates:</strong> Anonymous read-only lookup of public ECB/Frankfurter exchange rates with zero personal data transmitted.</li>
            <li><strong>Email / Recovery:</strong> Uses your local device email app (mailto:) or a user-configured webhook.</li>
          </ul>
        </div>
        <div class="policy-section">
          <h2>4. Device Permissions</h2>
          <p>File picker and local notifications are accessed only when you choose to import/export CSV, Excel, or JSON backups or enable reminders.</p>
        </div>
        <div class="policy-section">
          <h2>5. No Ads, No Tracking &amp; Finance Disclosure</h2>
          <p>No advertisements, no third-party tracking SDKs, and no data selling. MyFinance Pro is purely a personal expense tracker and does not provide loans or regulated financial advice.</p>
        </div>
        <div class="policy-section">
          <h2>6. Your 6 GDPR Rights &amp; Data Deletion</h2>
          <p>Under the GDPR, you retain full ownership of your locally stored records. Your 6 rights include:</p>
          <ul>
            <li><strong>1. Right of Access (Art. 15):</strong> Inspect all stored accounts, transactions, and profile info directly inside the app anytime.</li>
            <li><strong>2. Right to Rectification (Art. 16):</strong> Edit or correct any transaction, account, category, or profile entry directly.</li>
            <li><strong>3. Right to Erasure (Art. 17):</strong> Delete individual entries or permanently wipe all data by clearing app storage or uninstalling.</li>
            <li><strong>4. Right to Restriction (Art. 18):</strong> Keep optional online FX lookups or notifications disabled; the app works 100% offline.</li>
            <li><strong>5. Right to Data Portability (Art. 20):</strong> Export all your data anytime in <strong>.JSON, .CSV, or .PDF</strong> format.</li>
            <li><strong>6. Right to Object (Art. 21):</strong> Zero profiling, tracking, or ads; direct any request or objection to <a href="mailto:fpontedoro@gmail.com">fpontedoro@gmail.com</a>.</li>
          </ul>
        </div>
      `
        : `
        <div class="policy-meta">
          <strong>Titolare / Sviluppatore:</strong> Federico Pontedoro (<a href="mailto:fpontedoro@gmail.com">fpontedoro@gmail.com</a>) · <strong>Aggiornato:</strong> 23/11/2026
        </div>
        <div class="policy-section">
          <h2>1. Titolare &amp; Contatti</h2>
          <p>Sviluppatore e Titolare del trattamento: Federico Pontedoro. Per qualsiasi richiesta sulla privacy scrivi a <a href="mailto:fpontedoro@gmail.com">fpontedoro@gmail.com</a>.</p>
        </div>
        <div class="policy-section">
          <h2>2. Archiviazione 100% Locale sul Dispositivo</h2>
          <p>Tutti i conti, movimenti, categorie, budget, obiettivi, scadenze, debiti/crediti e il profilo locale (Nome, Cognome, Email) restano esclusivamente nella memoria del tuo dispositivo (LocalStorage e IndexedDB). La password è salvata solo come hash crittografico SHA-256 con salt casuale.</p>
        </div>
        <div class="policy-section">
          <h2>3. Servizi Online Facoltativi (Solo su Tua Azione)</h2>
          <ul>
            <li><strong>Tassi di Cambio:</strong> Chiamata anonima di sola lettura alle API pubbliche BCE/Frankfurter (nessun dato personale inviato).</li>
            <li><strong>Email &amp; Estratto Conto:</strong> Utilizza l'app email del dispositivo (mailto:) o eventuale webhook configurato dall'utente.</li>
          </ul>
        </div>
        <div class="policy-section">
          <h2>4. Permessi Dispositivo</h2>
          <p>Accesso ai file e notifiche locali sono richiesti solo quando scegli di importare/esportare CSV, Excel o JSON oppure attivare i promemoria.</p>
        </div>
        <div class="policy-section">
          <h2>5. Zero Pubblicità, Tracker e Nota Finanziaria</h2>
          <p>Nessun banner pubblicitario, nessun tracker di terze parti, nessuna vendita di dati. MyFinance Pro è uno strumento personale di gestione spese e budget: non eroga prestiti né consulenza finanziaria regolamentata.</p>
        </div>
        <div class="policy-section">
          <h2>6. I 6 Diritti GDPR &amp; Cancellazione Totale</h2>
          <p>In conformità con il GDPR, mantieni in ogni momento il controllo esclusivo dei tuoi dati locali. Ecco i tuoi 6 diritti:</p>
          <ul>
            <li><strong>1. Diritto di Accesso (Art. 15):</strong> Visualizzare in ogni momento tutti i conti, movimenti e dati del profilo salvati sul dispositivo.</li>
            <li><strong>2. Diritto di Rettifica (Art. 16):</strong> Modificare o correggere liberamente qualsiasi movimento, conto, categoria o dato personale.</li>
            <li><strong>3. Diritto alla Cancellazione / Oblio (Art. 17):</strong> Eliminare singoli elementi o cancellare definitivamente tutti i dati dalle impostazioni del dispositivo o disinstallando l'app.</li>
            <li><strong>4. Diritto di Limitazione (Art. 18):</strong> Disattivare o non utilizzare funzioni online opzionali (tassi FX, promemoria); l'app opera al 100% offline.</li>
            <li><strong>5. Diritto alla Portabilità (Art. 20):</strong> Esportare tutti i propri dati in qualsiasi momento nei formati <strong>.JSON, .CSV o .PDF</strong>.</li>
            <li><strong>6. Diritto di Opposizione (Art. 21):</strong> Nessuna profilazione, pubblicità o tracciamento; per segnalazioni o reclami scrivi a <a href="mailto:fpontedoro@gmail.com">fpontedoro@gmail.com</a>.</li>
          </ul>
        </div>
      `;

    printHtmlDocument({
      title,
      subtitle: 'Privacy Policy · Google Play Store & GDPR Compliance',
      contentHtml: sectionsHtml,
      language: viewLang,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[10050] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 shadow-2xl relative max-h-[92vh] flex flex-col">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 pr-8 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-white truncate">
              {isDe
                ? 'Datenschutzerklärung'
                : isEn
                  ? 'Privacy Policy'
                  : 'Privacy Policy & Sicurezza Dati'}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              MyFinance Pro · Google Play Store Ready
            </p>
          </div>
        </div>

        {/* Language Quick Switcher */}
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800 mb-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1">
            <Globe className="w-3 h-3 text-indigo-400" />
            <span>{isDe ? 'Sprache' : isEn ? 'Language' : 'Lingua'}</span>
          </span>
          <div className="flex items-center gap-1">
            {([
              { id: 'it', label: '🇮🇹 IT' },
              { id: 'en', label: '🇬🇧 EN' },
              { id: 'de', label: '🇩🇪 DE' },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setViewLang(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  viewLang === opt.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-1 space-y-3 flex-1 text-xs">
          {/* Google Play Console Public URL Card */}
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {isDe
                    ? 'Öffentliche URL für Google Play Console'
                    : isEn
                      ? 'Public URL for Google Play Console'
                      : 'Link Pubblico per Google Play Console'}
                </span>
              </span>
              {isHttpOrigin && (
                <a
                  href={`/privacy-policy.html?lang=${viewLang}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1 underline"
                >
                  <span>{isDe ? 'Öffnen' : isEn ? 'Open' : 'Apri Pagina'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 rounded-xl p-2">
              <code className="text-[10px] font-mono text-slate-200 truncate flex-1 select-all">
                {publicPolicyUrl}
              </code>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 flex-shrink-0 transition active:scale-95"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                <span>
                  {copiedUrl
                    ? isDe
                      ? 'Kopiert'
                      : isEn
                        ? 'Copied'
                        : 'Copiato'
                    : isDe
                      ? 'Kopieren'
                      : isEn
                        ? 'Copy URL'
                        : 'Copia Link'}
                </span>
              </button>
            </div>
            <p className="text-[10px] text-indigo-200/80 leading-snug">
              {isDe
                ? 'Diese öffentliche Seite ist ohne Login erreichbar und erfüllt die Anforderungen von Google Play.'
                : isEn
                  ? 'This standalone page is accessible without app sign-in, ready for Play Console verification.'
                  : 'Questa pagina è accessibile pubblicamente anche senza login nell\'app, pronta per la verifica di Google Play Console.'}
            </p>
          </div>

          {/* 1. Titolare & Contatti */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {isDe
                  ? '1. Verantwortlicher & Kontakt'
                  : isEn
                    ? '1. Developer & Contact'
                    : '1. Titolare & Contatti'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isDe
                ? 'Entwickler: Federico Pontedoro · E-Mail: fpontedoro@gmail.com · Aktualisiert: 23.11.2026.'
                : isEn
                  ? 'Developer: Federico Pontedoro · Email: fpontedoro@gmail.com · Last updated: Nov 23, 2026.'
                  : 'Sviluppatore e Titolare: Federico Pontedoro · Email: fpontedoro@gmail.com · Aggiornato: 23/11/2026.'}
            </p>
          </div>

          {/* 2. Dati Salvati Localmente */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {isDe
                  ? '2. 100% Lokale Speicherung (Kein Cloud-Server)'
                  : isEn
                    ? '2. 100% Local Device Storage (Zero Cloud DB)'
                    : '2. Archiviazione 100% Locale sul Dispositivo'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isDe
                ? 'Konten, Buchungen, Kategorien, Budgets, Sparziele, Dauerbuchungen, Debit/Kredit-Einträge und Ihr optionales lokales Profil bleiben ausschließlich in LocalStorage & IndexedDB auf Ihrem Gerät. Ihr Passwort wird nur als gesalzener SHA-256-Hash gespeichert.'
                : isEn
                  ? 'All accounts, transactions, categories, budgets, goals, recurring schedules, debts/credits, and your optional local profile stay exclusively inside your device LocalStorage & IndexedDB. Your unlock password is stored solely as a salted SHA-256 hash.'
                  : 'Tutti i conti, movimenti, categorie, budget, obiettivi, scadenze, debiti/crediti e il profilo locale (Nome, Cognome, Email) restano esclusivamente nella memoria del tuo dispositivo (LocalStorage e IndexedDB). La password è salvata solo come hash crittografico SHA-256 con salt casuale.'}
            </p>
          </div>

          {/* 3. Servizi Online Opzionali */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {isDe
                  ? '3. Optionale Online-Funktionen (Nur auf Klick)'
                  : isEn
                    ? '3. Optional Online Features (User-Initiated Only)'
                    : '3. Servizi Online Facoltativi (Solo su Tua Azione)'}
              </span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside leading-relaxed">
              <li>
                <strong className="text-white">
                  {isDe ? 'Wechselkurse:' : isEn ? 'FX Rates:' : 'Tassi di Cambio:'}
                </strong>{' '}
                {isDe
                  ? 'Anonyme Abfrage öffentlicher Kurse (EZB / Frankfurter API) ohne personenbezogene Daten.'
                  : isEn
                    ? 'Anonymous read-only lookup of public ECB/Frankfurter exchange rates with zero personal data.'
                    : 'Chiamata anonima di sola lettura alle API pubbliche BCE/Frankfurter (nessun dato personale inviato).'}
              </li>
              <li>
                <strong className="text-white">
                  {isDe ? 'E-Mail / OTP:' : isEn ? 'Email / Recovery:' : 'Email & Estratto Conto:'}
                </strong>{' '}
                {isDe
                  ? 'Nutzt Ihre lokale E-Mail-App (mailto:) oder einen selbst hinterlegten Webhook.'
                  : isEn
                    ? 'Uses your local device email app (mailto:) or a user-configured webhook.'
                    : 'Utilizza l\'app email del dispositivo (mailto:) o eventuale webhook configurato dall\'utente.'}
              </li>
            </ul>
          </div>

          {/* 4. Permessi Dispositivo */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isDe
                  ? '4. Geräteberechtigungen'
                  : isEn
                    ? '4. Device Permissions'
                    : '4. Permessi Dispositivo'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isDe
                ? 'Dateizugriff und lokale Benachrichtigungen werden ausschließlich verwendet, wenn Sie CSV/JSON importieren/exportieren oder Erinnerungen aktivieren.'
                : isEn
                  ? 'File picker and local notifications are accessed only when you choose to import/export CSV/JSON backups or enable reminders.'
                  : 'Accesso ai file e notifiche locali sono richiesti solo quando scegli di importare/esportare CSV o JSON oppure attivare i promemoria.'}
            </p>
          </div>

          {/* 5. Zero Pubblicità & Dichiarazione Finanziaria */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {isDe
                  ? '5. Keine Werbung, kein Tracking, keine Kreditvergabe'
                  : isEn
                    ? '5. No Ads, No Tracking & Finance Disclosure'
                    : '5. Zero Pubblicità, Tracker e Nota Finanziaria'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isDe
                ? 'Keine Werbebanner, kein Weiterverkauf von Daten. MyFinance Pro ist ein reines Budget-Werkzeug und bietet keine Kredite oder regulierte Finanzberatung an.'
                : isEn
                  ? 'No advertisements, no third-party tracking SDKs, and no data selling. MyFinance Pro is purely a personal expense tracker and does not provide loans or regulated financial advice.'
                  : 'Nessun banner pubblicitario, nessun tracker di terze parti, nessuna vendita di dati. MyFinance Pro è uno strumento personale di gestione spese e budget: non eroga prestiti né consulenza finanziaria regolamentata.'}
            </p>
          </div>

          {/* 6. I 6 Diritti GDPR & Cancellazione */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 text-slate-300" />
              <span>
                {isDe
                  ? '6. Ihre 6 DSGVO-Rechte & Datenlöschung'
                  : isEn
                    ? '6. Your 6 GDPR Rights & Data Deletion'
                    : '6. I 6 Diritti GDPR & Cancellazione Totale'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isDe
                ? 'Gemäß DSGVO behalten Sie die volle Kontrolle über Ihre Daten:'
                : isEn
                  ? 'Under GDPR, you maintain full control over your local records:'
                  : 'In conformità al GDPR, mantieni sempre i tuoi 6 diritti sui dati locali:'}
            </p>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside leading-relaxed">
              <li>
                <strong className="text-white">
                  {isDe ? '1. Auskunft (Art. 15):' : isEn ? '1. Access (Art. 15):' : '1. Accesso (Art. 15):'}
                </strong>{' '}
                {isDe
                  ? 'Alle gespeicherten Daten jederzeit in der App einsehen.'
                  : isEn
                    ? 'View all stored accounts and records anytime.'
                    : 'Consultare in ogni momento tutti i dati salvati sul dispositivo.'}
              </li>
              <li>
                <strong className="text-white">
                  {isDe ? '2. Berichtigung (Art. 16):' : isEn ? '2. Rectification (Art. 16):' : '2. Rettifica (Art. 16):'}
                </strong>{' '}
                {isDe
                  ? 'Konten, Buchungen und Profilangaben direkt bearbeiten.'
                  : isEn
                    ? 'Edit accounts, transactions, and profile entries anytime.'
                    : 'Modificare conti, movimenti e dati del profilo in qualsiasi momento.'}
              </li>
              <li>
                <strong className="text-white">
                  {isDe ? '3. Löschung (Art. 17):' : isEn ? '3. Erasure (Art. 17):' : '3. Cancellazione / Oblio (Art. 17):'}
                </strong>{' '}
                {isDe
                  ? 'Alles dauerhaft über App-Daten löschen oder Deinstallation entfernen.'
                  : isEn
                    ? 'Permanently wipe everything by clearing app data or uninstalling.'
                    : 'Eliminare tutto definitivamente cancellando i dati app o disinstallando.'}
              </li>
              <li>
                <strong className="text-white">
                  {isDe ? '4. Einschränkung (Art. 18):' : isEn ? '4. Restriction (Art. 18):' : '4. Limitazione (Art. 18):'}
                </strong>{' '}
                {isDe
                  ? 'Optionale Online-Funktionen jederzeit deaktiviert lassen.'
                  : isEn
                    ? 'Keep optional online FX lookups or alerts disabled.'
                    : 'Disattivare in ogni momento funzioni online facoltative e promemoria.'}
              </li>
              <li>
                <strong className="text-white">
                  {isDe ? '5. Datenübertragbarkeit (Art. 20):' : isEn ? '5. Portability (Art. 20):' : '5. Portabilità (Art. 20):'}
                </strong>{' '}
                {isDe
                  ? 'Vollständiger Export als .JSON, .CSV oder .PDF.'
                  : isEn
                    ? 'Export all records anytime in .JSON, .CSV, or .PDF.'
                    : 'Esportare tutti i dati in formato .JSON, .CSV o .PDF.'}
              </li>
              <li>
                <strong className="text-white">
                  {isDe ? '6. Widerspruch (Art. 21):' : isEn ? '6. Objection (Art. 21):' : '6. Opposizione (Art. 21):'}
                </strong>{' '}
                {isDe
                  ? 'Kein Tracking/Werbung; Kontakt via fpontedoro@gmail.com.'
                  : isEn
                    ? 'Zero tracking/ads; contact fpontedoro@gmail.com.'
                    : 'Zero profilazione/pubblicità; contatta fpontedoro@gmail.com.'}
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintPolicy}
            className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isDe ? 'Drucken / PDF' : isEn ? 'Print / PDF' : 'Stampa / PDF'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/25"
          >
            {isDe ? 'Schließen' : isEn ? 'Close' : 'Ho Capito / Chiudi'}
          </button>
        </div>
      </div>
    </div>
  );
};
