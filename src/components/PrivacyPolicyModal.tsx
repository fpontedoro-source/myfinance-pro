import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Globe,
  Camera,
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
        <p><strong>Entwickler:</strong> Federico Pontedoro (<a href="mailto:fpontedoro@gmail.com">fpontedoro@gmail.com</a>) · Stand: 23.11.2026</p>
        <h2>1. Lokale Datenspeicherung (Privacy-First)</h2>
        <p>Alle Konten, Transaktionen, Kategorien, Budgets, Sparziele, Dauerbuchungen und Ihr optionales lokales Profil werden ausschließlich lokal im Gerätespeicher (LocalStorage &amp; IndexedDB) gespeichert. Ihr Zugriffspasswort wird ausschließlich als gesalzener SHA-256-Hash abgelegt.</p>
        <h2>2. Optionale Online-Dienste</h2>
        <p>Die App funktioniert offline. KI-Assistent/Beleg-Scanner (Google Gemini API), öffentliche Wechselkurse (EZB/Frankfurter API) oder E-Mail-Entwürfe (mailto:) werden nur auf ausdrückliche Nutzeraktion ausgelöst.</p>
        <h2>3. Berechtigungen, Werbung &amp; Löschung</h2>
        <p>Keine Werbung, kein Tracking, keine Kreditvermittlung. Kamera/Dateien/Mikrofon/Benachrichtigungen werden nur auf Wunsch genutzt. Alle Daten können jederzeit exportiert oder durch Löschen der App-Daten vollständig entfernt werden.</p>
      `
      : isEn
        ? `
        <p><strong>Developer:</strong> Federico Pontedoro (<a href="mailto:fpontedoro@gmail.com">fpontedoro@gmail.com</a>) · Updated: Nov 23, 2026</p>
        <h2>1. 100% Local Storage (Privacy-First)</h2>
        <p>All accounts, transactions, categories, budgets, goals, recurring entries, and optional profile info remain strictly on your device (LocalStorage &amp; IndexedDB). Passwords are stored exclusively as a salted SHA-256 cryptographic hash.</p>
        <h2>2. Optional User-Initiated Online Features</h2>
        <p>The app works offline. AI Assistant / Receipt Scanner (Google Gemini API), anonymous reference FX rate lookup (ECB/Frankfurter), and email statement drafts (mailto:) are executed only when explicitly triggered by you.</p>
        <h2>3. Permissions, Zero Ads &amp; Data Deletion</h2>
        <p>No ads, no third-party tracking SDKs, and no lending/credit services. Camera/files/microphone/notifications are optional and user-triggered. Export (.JSON/.CSV/.PDF) or delete all data anytime from device settings.</p>
      `
        : `
        <p><strong>Titolare / Sviluppatore:</strong> Federico Pontedoro (<a href="mailto:fpontedoro@gmail.com">fpontedoro@gmail.com</a>) · Aggiornato: 23/11/2026</p>
        <h2>1. Archiviazione 100% Locale (Privacy-First)</h2>
        <p>Tutti i conti, movimenti, categorie, budget, obiettivi, scadenze e il profilo locale facoltativo restano esclusivamente sul tuo dispositivo (LocalStorage e IndexedDB). La password di sblocco è salvata solo come hash crittografico SHA-256 con salt casuale.</p>
        <h2>2. Servizi Online Opzionali (Solo su Richiesta)</h2>
        <p>L'app funziona interamente offline. Assistente AI / Scanner Scontrini (Google Gemini API), aggiornamento tassi di cambio (BCE/Frankfurter API) e bozze email (mailto:) vengono attivati solo su tua esplicita richiesta.</p>
        <h2>3. Permessi, Zero Pubblicità e Cancellazione Dati</h2>
        <p>Nessuna pubblicità, nessun tracker di terze parti e nessun servizio di prestito/credito. Fotocamera, file, microfono e notifiche sono opzionali. Puoi esportare (.JSON/.CSV/.PDF) o cancellare tutti i dati in qualsiasi momento dal dispositivo.</p>
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
                  {isDe ? 'KI-Assistent & Beleg-Scanner:' : isEn ? 'AI Assistant & Receipt Scanner:' : 'Assistente AI & Scanner Scontrini:'}
                </strong>{' '}
                {isDe
                  ? 'Texte oder Belegfotos werden nur bei aktivem Senden per HTTPS an Google Gemini API verarbeitet, ohne dauerhafte Speicherung.'
                  : isEn
                    ? 'Prompts or receipt files you explicitly submit are sent over HTTPS to Google Gemini API only to generate your draft/reply, with no persistent developer storage.'
                    : 'Messaggi o foto/PDF degli scontrini inviati volontariamente transitano in HTTPS verso Google Gemini API al solo scopo di generare risposta o bozza movimento, senza archiviazione permanente.'}
              </li>
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
              <Camera className="w-3.5 h-3.5 text-amber-400" />
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
                ? 'Kamera, Dateien, Mikrofon und lokale Benachrichtigungen werden ausschließlich verwendet, wenn Sie einen Beleg scannen, CSV/JSON importieren/exportieren, Sprachdiktat starten oder Erinnerungen aktivieren.'
                : isEn
                  ? 'Camera, file picker, microphone, and local notifications are accessed only when you choose to scan a receipt, import/export CSV/JSON, dictate voice notes, or enable reminders.'
                  : 'Fotocamera, file/galleria, microfono e notifiche locali sono richiesti solo quando scegli di scansionare scontrini, importare/esportare CSV o JSON, usare la dettatura vocale o attivare i promemoria.'}
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

          {/* 6. Esportazione & Cancellazione */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 text-slate-300" />
              <span>
                {isDe
                  ? '6. Ihre Rechte & Datenlöschung (DSGVO)'
                  : isEn
                    ? '6. Your Rights & Data Deletion (GDPR)'
                    : '6. Diritti GDPR & Cancellazione Totale'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isDe
                ? 'Sie können alle Daten jederzeit als .JSON/.CSV/.PDF exportieren oder durch Löschen der App-Daten bzw. Deinstallation unwiderruflich entfernen.'
                : isEn
                  ? 'You can export all data anytime (.JSON/.CSV/.PDF) or permanently wipe everything by clearing app data or uninstalling.'
                  : 'Puoi esportare i tuoi dati in .JSON, .CSV o .PDF in ogni momento, oppure eliminarli definitivamente cancellando i dati dell\'app dalle impostazioni del dispositivo o disinstallandola.'}
            </p>
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
