import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Copy,
  ExternalLink,
  X,
  FileCode,
  Zap,
  Sparkles,
  CheckCircle2,
  Check,
  AlertCircle,
  HardDrive,
  ShieldCheck,
  Database,
  FolderDown,
  Info,
  Layers,
  FileText,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { MyFinanceIcon } from './MyFinanceIcon';
import {
  generateCompleteGuidePdf,
  generateTrilingualCompleteGuidePdf,
} from '../utils/pdfGenerator';
import { Language } from '../utils/translations';

interface ApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  storageStats?: {
    isPersisted: boolean;
    canPersist: boolean;
    usageBytes: number;
    quotaBytes: number;
    isStandalone: boolean;
  };
  onRequestPersistence?: () => Promise<void>;
  onExportJson?: () => void;
  language?: Language;
}

export const ApkModal: React.FC<ApkModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  storageStats,
  onRequestPersistence,
  onExportJson,
  language = 'it',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDescription, setCopiedDescription] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'storage' | 'guide' | 'package'>('install');

  if (!isOpen) return null;

  const isDe = language === 'de';
  const isEn = language === 'en';

  const currentUrl = window.location.href;
  const manifestDescription = "App di finanza personale mobile con tracciamento spese, gestione conti, budget e supporto offline completo.";
  
  const manifestData = {
    id: "/",
    name: "MyFinance Pro - Android Edition",
    short_name: "MyFinance",
    description: manifestDescription,
    lang: "it-IT",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#020617",
    theme_color: "#020617",
    categories: ["finance", "productivity", "utilities"],
    icons: [
      {
        src: `${window.location.origin}/pwa-192x192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: `${window.location.origin}/pwa-512x512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: `${window.location.origin}/pwa-maskable-512x512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    onShowToast(
      isDe
        ? 'Link in die Zwischenablage kopiert!'
        : isEn
          ? 'Link copied to clipboard!'
          : 'Link copiato negli appunti!'
    );
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(manifestDescription);
    setCopiedDescription(true);
    onShowToast(
      isDe
        ? 'Manifest-Beschreibung kopiert!'
        : isEn
          ? 'Manifest description copied!'
          : 'Descrizione manifest copiata negli appunti!'
    );
    setTimeout(() => setCopiedDescription(false), 2000);
  };

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(JSON.stringify(manifestData, null, 2));
    setCopiedManifest(true);
    onShowToast(
      isDe
        ? 'manifest.json kopiert!'
        : isEn
          ? 'manifest.json copied to clipboard!'
          : 'Codice manifest.json copiato negli appunti!'
    );
    setTimeout(() => setCopiedManifest(false), 2000);
  };

  const handleDownloadManifestJson = () => {
    const blob = new Blob([JSON.stringify(manifestData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    a.click();
    URL.revokeObjectURL(url);
    onShowToast(
      isDe
        ? 'manifest.json heruntergeladen!'
        : isEn
          ? 'manifest.json downloaded!'
          : 'File manifest.json scaricato!'
    );
  };

  const handleDirectInstall = async () => {
    if (isInstallable) {
      const res = await install();
      if (res) {
        onShowToast(
          isDe
            ? 'Installation erfolgreich gestartet!'
            : isEn
              ? 'Installation started successfully!'
              : 'Installazione avviata con successo!'
        );
        onClose();
      }
    } else {
      setActiveTab('guide');
    }
  };

  const handleDownloadAndroidBundle = () => {
    // Generate an APK readiness bundle containing manifest, instructions, and twa configuration
    const twaConfig = {
      packageId: "com.myfinance.pro.android",
      host: window.location.host,
      name: "MyFinance Pro",
      launcherName: "MyFinance",
      themeColor: "#020617",
      navigationColor: "#020617",
      backgroundColor: "#020617",
      startUrl: "/",
      iconUrl: `${window.location.origin}/pwa-512x512.png`,
      maskableIconUrl: `${window.location.origin}/pwa-maskable-512x512.png`,
      appVersion: "1.0.0",
      appVersionCode: 1,
      shortcuts: [],
      generatorNotice: "Configurazione generata automaticamente da MyFinance Pro per Android APK / WebAPK."
    };

    const readmeContent = `# Guida Creazione APK Nativo per Android - MyFinance Pro

Questo pacchetto contiene tutti i parametri pronti per generare un file .APK o .AAB installabile direttamente su qualsiasi dispositivo Android o pubblicabile su Google Play Store.

## Metodo 1: 1-Click con PWABuilder (Il più semplice, nessun software richiesto)
1. Vai su: https://www.pwabuilder.com
2. Inserisci l'URL della tua applicazione:
   ${window.location.origin}
3. Clicca su "Start" e poi su "Package for Stores".
4. Seleziona **Android** e scarica direttamente l'APK pronto da installare o firmare!

## Metodo 2: Google Bubblewrap CLI (Ufficiale Google Chrome / Android Team)
1. Installa Node.js e Bubblewrap:
   npm install -g @bubblewrap/cli
2. Inizializza il progetto Android TWA:
   bubblewrap init --manifest="${window.location.origin}/manifest.webmanifest"
3. Compila l'APK:
   bubblewrap build
4. Troverai il file 'app-release-signed.apk' pronto da installare con:
   adb install app-release-signed.apk

## Metodo 3: Installazione Diretta WebAPK su Android (Zero KB di download esterno)
- Apri questo URL sul tuo smartphone Android in Google Chrome:
  ${window.location.origin}
- Tocca i tre puntini in alto a destra e seleziona **"Aggiungi a schermata Home"** o **"Installa applicazione"**.
- Android installerà un WebAPK nativo con icona indipendente nell'App Drawer, splash screen e supporto offline completo.
`;

    const blob = new Blob([readmeContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MyFinance_Pro_Android_APK_Guide.md';
    a.click();
    URL.revokeObjectURL(url);

    // Also download JSON twa-manifest
    const jsonBlob = new Blob([JSON.stringify(twaConfig, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const b = document.createElement('a');
    b.href = jsonUrl;
    b.download = 'twa-manifest.json';
    b.click();
    URL.revokeObjectURL(jsonUrl);

    onShowToast(
      isDe
        ? 'APK-Paket und Anleitung heruntergeladen!'
        : isEn
          ? 'APK bundle & guide downloaded!'
          : 'Pacchetto e guida APK scaricati!'
    );
  };

  const handleDownloadApkSource = async (mode: 'index' | 'zip') => {
    try {
      const endpoint = mode === 'zip' ? '/myfinance_app.zip' : '/myfinance_standalone.html';
      const targetName = mode === 'zip' ? 'myfinance_app.zip' : 'index.html';
      if (window.location.protocol.startsWith('http')) {
        const res = await fetch(endpoint);
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = targetName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          onShowToast(
            mode === 'zip'
              ? 'Pacchetto ZIP (con index.html incluso) scaricato!'
              : 'File index.html (pronto per convertitore APK) scaricato!'
          );
          return;
        }
      }
      onShowToast('Apri Impostazioni → Scarica Codice HTML / ZIP per esportare offline.');
    } catch (err) {
      console.error('Download APK source error:', err);
      onShowToast('Errore durante il download. Riprova da Impostazioni → Scarica ZIP.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center no-print p-0 sm:p-4">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 shadow-2xl relative animate-slide-up max-h-[92vh] flex flex-col">
        {/* Drag handle for mobile */}
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4 pr-8">
          <MyFinanceIcon size={46} withGlow />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">
                {isDe ? 'APK / Android-App installieren' : isEn ? 'Install APK / Android App' : 'Installa APK / App Android'}
              </h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                PWA / WebAPK
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isDe
                ? 'Natives Android-Erlebnis: App-Symbol, Startbildschirm & Offline-Modus'
                : isEn
                  ? 'Native Android experience: launcher icon, splash screen & offline mode'
                  : 'Esperienza nativa Android: icona drawer, splash screen e offline'}
            </p>
          </div>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-4 bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-4 text-[11px] font-semibold">
          <button
            onClick={() => setActiveTab('install')}
            className={`py-2 px-1 text-center rounded-xl transition ${
              activeTab === 'install'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isDe ? 'Installieren' : isEn ? 'Install' : 'Installa'}
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`py-2 px-1 text-center rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'storage'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>{isDe ? 'Speicher' : isEn ? 'Storage' : 'Memoria'}</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-2 px-1 text-center rounded-xl transition ${
              activeTab === 'guide'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isDe ? 'Anleitung' : isEn ? 'Guide' : 'Guida'}
          </button>
          <button
            onClick={() => setActiveTab('package')}
            className={`py-2 px-1 text-center rounded-xl transition ${
              activeTab === 'package'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            APK
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
          {activeTab === 'storage' && (
            <div className="space-y-3.5">
              {/* Direct Reassurance Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-white">
                      I dati sono memorizzati sul tuo Smartphone
                    </h3>
                    <span className="text-[10px] text-emerald-300 font-medium">
                      Completamente separati dalla cronologia web di Chrome
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  I tuoi conti, spese, entrate e modelli <strong>non vengono inseriti nella cronologia di navigazione di Chrome</strong>. Vengono archiviati in un database locale sicuro (<strong>IndexedDB & Web Storage</strong>) situato nella memoria fisica protetta del tuo dispositivo.
                </p>
              </div>

              {/* Status and Persistence */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Stato Memoria Smartphone</span>
                  </div>
                  {storageStats?.isPersisted ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Permanente & Protetta
                    </span>
                  ) : (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                      Sandbox Locale Attiva
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Spazio Occupato:</span>
                    <span className="font-bold text-white text-xs">
                      {storageStats ? `${((storageStats.usageBytes || 24000) / 1024).toFixed(1)} KB` : 'Locale'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Isolamento:</span>
                    <span className="font-bold text-emerald-400 text-xs">
                      100% Locale / Nessun Cloud
                    </span>
                  </div>
                </div>

                {onRequestPersistence && !storageStats?.isPersisted && (
                  <button
                    type="button"
                    onClick={onRequestPersistence}
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 shadow-md"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-amber-300" />
                    <span>Attiva Protezione Memoria Permanente (Anti-Eliminazione)</span>
                  </button>
                )}
              </div>

              {/* Three Key Reassurances */}
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 flex-shrink-0 mt-0.5">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-slate-300">
                    <strong className="text-white block">1. Installazione come App Autonoma</strong>
                    Installando l'app sul telefono (tramite il pulsante <em>Installa</em> o <em>Aggiungi a Home</em>), Android le assegna una partizione dati riservata (<code>/data/user/0/...</code>). L'app non aprirà mai schede di navigazione.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-slate-300">
                    <strong className="text-white block">2. Se cancelli la cronologia di Chrome?</strong>
                    I tuoi movimenti finanziari <strong>non vengono cancellati</strong>. La cronologia di Chrome memorizza solo i link visitati, mentre MyFinance risiede nel database nativo IndexedDB.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 flex-shrink-0 mt-0.5">
                    <FolderDown className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-slate-300">
                    <strong className="text-white block">3. File Fisico di Sicurezza</strong>
                    Puoi salvare in qualsiasi momento un file fisico di backup sul tuo smartphone con il pulsante qui sotto.
                  </div>
                </div>
              </div>

              {/* Direct Backup Action */}
              {onExportJson && (
                <button
                  type="button"
                  onClick={onExportJson}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Scarica Copia di Backup File (.JSON) sul Telefono</span>
                </button>
              )}
            </div>
          )}

          {activeTab === 'install' && (
            <div className="space-y-4">
              {/* Status Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" /> Stato Installazione
                  </span>
                  {isInstalled ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Già Installata
                    </span>
                  ) : (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-500/30">
                      Pronta per l'installazione
                    </span>
                  )}
                </div>

                {/* App Icon Preview */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 my-2.5">
                  <MyFinanceIcon size={48} withGlow />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-white block truncate">MyFinance Pro</span>
                    <span className="text-[10px] text-emerald-400 font-medium block">
                      Icona Android HD integrata (Launcher & App Drawer)
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  L'applicazione supporta lo standard <strong>Android WebAPK</strong>. Quando installata sul tuo dispositivo, si comporta a tutti gli effetti come un'applicazione scaricata dal Play Store:
                </p>

                <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Nessuna barra del browser</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Icona nell'App Drawer</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Funziona al 100% Offline</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Salvataggio istantaneo dati</span>
                  </div>
                </div>
              </div>

              {/* Soluzione Errore Chrome 'Non può installare l'app' */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Chrome dice "Non può installare l'app"? Ecco la soluzione:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Nei 3 puntini (⋮) di Chrome in alto a destra, tocca <strong>"Aggiungi a schermata Home"</strong> anziché "Installa".
                  Questo installerà l'app con la sua icona MyFinance sul tuo smartphone istantaneamente e senza errori!
                </p>
              </div>

              {/* Install CTA Button */}
              {isInstallable ? (
                <button
                  onClick={handleDirectInstall}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 active:scale-98 transition-all"
                >
                  <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
                  Installa Ora come App Android (WebAPK)
                </button>
              ) : isInstalled ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-xs text-emerald-400 font-semibold">
                    Stai già utilizzando l'applicazione in modalità autonoma installata!
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('guide')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  Visualizza Istruzioni "Aggiungi a Home"
                </button>
              )}

              {/* Spiegazione Cronologia Chrome */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Come cancellare la cronologia senza cancellare i tuoi conti:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Quando vai su <em>Chrome &gt; Cancella dati di navigazione</em>:
                  lascia selezionata <strong>"Cronologia di navigazione"</strong> e <strong>togli la spunta da "Cookie e dati dei siti"</strong>.
                  In questo modo la cronologia web viene eliminata ma la memoria locale di MyFinance rimane intatta al 100%!
                </p>
              </div>

              {/* QR / Share section */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                    Apri sul tuo Smartphone Android
                  </span>
                  <span className="text-xs text-slate-300 truncate font-mono block">
                    {currentUrl}
                  </span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex-shrink-0 p-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copiato' : 'Copia'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Apri in Google Chrome su Android</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Naviga su questo URL utilizzando il browser Google Chrome o Samsung Internet sul tuo telefono Android.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Tocca il Menu con tre puntini ⋮</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Premi l'icona delle opzioni di Chrome posizionata nell'angolo in alto a destra dello schermo.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Tocca "Installa applicazione" o "Aggiungi a Home"</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Seleziona <em>"Installa applicazione"</em> oppure <em>"Aggiungi a schermata Home"</em>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Completato! App Drawer e Schermo Intero</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      L'app si aprirà a schermo intero senza barre del browser e con memorizzazione offline dei dati.
                    </p>
                  </div>
                </div>
              </div>

              {/* Troubleshooting Card for 'Non si può installare' */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Cosa fare se Chrome dice "Non si può installare"?</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                  <p>
                    Se Chrome su Android mostra l'avviso <em>"Non si può installare"</em>, significa che il server esterno di Google (WebAPK Minting Service) non riesce a raggiungere l'ambiente protetto di anteprima.
                  </p>
                  <div className="space-y-1 pt-1 font-medium">
                    <div className="flex items-start gap-1.5 text-emerald-300">
                      <span className="font-bold">✓ Soluzione 1:</span>
                      <span>Dal menu ⋮ di Chrome tocca <strong>"Aggiungi a schermata Home"</strong> invece di "Installa": installerà l'app istantaneamente sul telefono senza richiedere i server esterni di Google!</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-indigo-300">
                      <span className="font-bold">✓ Soluzione 2:</span>
                      <span>Usa il pulsante in-app <strong>"Installa Ora come App Android"</strong> nella scheda <em>Installazione Rapida</em>.</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-cyan-300">
                      <span className="font-bold">✓ Soluzione 3:</span>
                      <span>Se vuoi un file fisico <strong>.APK</strong> da scaricare e installare, apri la scheda <strong>Pacchetto APK</strong> qui sopra!</span>
                    </div>
                  </div>
                </div>
              </div>

              {isIOS && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  <strong>Nota per iPhone / iPad:</strong> In Safari, tocca il pulsante Condividi in basso e seleziona "Aggiungi a schermata Home".
                </div>
              )}

              {/* Download Complete App Feature Guide PDF */}
              <div className="p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const fileName = generateCompleteGuidePdf(language);
                    onShowToast(
                      isDe
                        ? `Vollständige Anleitung heruntergeladen: ${fileName}`
                        : isEn
                          ? `Complete Guide PDF downloaded: ${fileName}`
                          : `Guida Completa PDF scaricata: ${fileName}`
                    );
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-100 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <FileText className="w-4 h-4 text-indigo-300" />
                  <span>
                    {isDe
                      ? 'Vollständige Funktionsanleitung (PDF)'
                      : isEn
                        ? 'Download Complete Feature Guide (PDF)'
                        : 'Scarica Guida Completa Funzioni (PDF)'}
                  </span>
                </button>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['it', 'de', 'en'] as const).map((gLang) => (
                    <button
                      key={gLang}
                      type="button"
                      onClick={() => {
                        const fn = generateCompleteGuidePdf(gLang);
                        onShowToast(
                          isDe
                            ? `PDF (${gLang.toUpperCase()}) geladen: ${fn}`
                            : isEn
                              ? `PDF (${gLang.toUpperCase()}) downloaded: ${fn}`
                              : `Guida PDF (${gLang.toUpperCase()}) scaricata: ${fn}`
                        );
                      }}
                      className="py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-200 text-[11px] font-bold"
                    >
                      {gLang.toUpperCase()}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const fn = generateTrilingualCompleteGuidePdf();
                      onShowToast(
                        isDe
                          ? `Dreisprachige Anleitung geladen: ${fn}`
                          : isEn
                            ? `Trilingual guide downloaded: ${fn}`
                            : `Guida trilingue scaricata: ${fn}`
                      );
                    }}
                    className="py-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-cyan-200 text-[10px] font-bold truncate"
                  >
                    IT+DE+EN
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'package' && (
            <div className="space-y-3">
              {/* HTML-to-APK index.html Ready Box */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Convertitore HTML → APK chiede &quot;index.html&quot;?</span>
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    Risolto
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  I programmi che trasformano HTML/ZIP in APK cercano sempre un file chiamato esattamente <code className="bg-slate-900 text-emerald-300 px-1.5 py-0.5 rounded font-mono">index.html</code> nella radice. Ora il file <strong className="text-white">myfinance_app.zip</strong> contiene già <strong className="text-emerald-300">index.html</strong> (oltre a <code className="text-slate-200">myfinance_app.html</code> e all&apos;icona HD)!
                </p>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleDownloadApkSource('zip')}
                    className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-98"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Scarica ZIP (con index.html)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadApkSource('index')}
                    className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-98"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Scarica solo index.html</span>
                  </button>
                </div>
              </div>

              {/* Important Alert Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Perché l'installazione APK non partiva?</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  I telefoni Android <strong>non consentono a un sito web di installare direttamente file .APK senza compilazione esterna</strong>. Per questo motivo, scaricare file di configurazione (.json/.md) non installa l'app direttamente sul telefono.
                </p>
              </div>

              {/* The 2 Real Working Methods */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Due Soluzioni Funzionanti al 100%:</span>
                </h4>

                {/* Option 1: Direct WebAPK */}
                <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">
                      Metodo 1: Installazione WebAPK (Consigliato)
                    </span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                      Zero file da scaricare
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Apri questa pagina in <strong>Google Chrome su Android</strong>, tocca il menu <strong>⋮</strong> in alto a destra e premi <strong>"Installa applicazione"</strong>. Android installerà l'app istantaneamente con icona e avvio a schermo intero!
                  </p>
                </div>

                {/* Option 2: PWABuilder APK Generator */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300">
                      Metodo 2: Genera vero file .APK compilato (PWABuilder)
                    </span>
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-bold">
                      Per Play Store o file .APK
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Se ti serve un file fisico <strong>.APK</strong> da installare manualmente tramite file manager:
                  </p>

                  <a
                    href={`https://www.pwabuilder.com?url=${encodeURIComponent(window.location.origin)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Apri PWABuilder per scaricare il file .APK</span>
                  </a>

                  {/* Fix for "Your manifest description is missing" */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2 mt-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Risoluzione: "Your manifest description is missing"</span>
                    </div>

                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      Se PWABuilder mostra questo messaggio, accade perché l'indirizzo di anteprima di sviluppo è protetto da cookie di sessione e il bot di PWABuilder non riesce a leggerlo automaticamente. Puoi risolverlo in 2 secondi:
                    </p>

                    <div className="space-y-1.5 pt-1">
                      {/* Copy Description Button */}
                      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-slate-400 block font-semibold">Descrizione richiesta:</span>
                          <span className="text-[10px] text-slate-200 block truncate font-mono">
                            {manifestDescription}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyDescription}
                          className="flex-shrink-0 px-2.5 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-md text-[10px] font-bold flex items-center gap-1 transition"
                        >
                          {copiedDescription ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedDescription ? 'Copiata' : 'Copia'}</span>
                        </button>
                      </div>

                      {/* Copy Manifest & Download JSON */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyManifest}
                          className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition"
                        >
                          {copiedManifest ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-indigo-400" />}
                          <span>{copiedManifest ? 'Manifest Copiato' : 'Copia Manifest JSON'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadManifestJson}
                          className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition"
                          title="Scarica manifest.json"
                        >
                          <Download className="w-3 h-3 text-indigo-400" />
                          <span>.json</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Developer Configuration & Android Studio */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Compila APK con Android Studio &amp; Capacitor
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">com.myfinance.pro.android</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[10px] font-mono text-cyan-300 space-y-1">
                  <div>npm run build</div>
                  <div>npx @capacitor/cli add android</div>
                  <div>npx @capacitor/cli sync android &amp;&amp; npx @capacitor/cli open android</div>
                </div>
                <div className="text-[10px] text-slate-400">
                  Poi in Android Studio premi <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong> per generare <code>app-debug.apk</code> installabile su Android!
                </div>
                <button
                  type="button"
                  onClick={handleDownloadAndroidBundle}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Scarica Guida Completa APK (.md) & Configurazione</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 mt-2 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <MyFinanceIcon size={18} />
            <span className="text-[11px] text-slate-400">
              © 2026 Federico Pontedoro. All rights reserved. • My Finance Pro · Android Mobile Edition.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            {isDe ? 'Schließen' : isEn ? 'Close' : 'Chiudi'}
          </button>
        </div>
      </div>
    </div>
  );
};
