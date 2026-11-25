import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Folder,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Download,
  Copy,
  Trash2,
  ExternalLink,
  ShieldCheck,
  FolderOpen,
  Calendar,
  Sparkles,
  Share2,
  Clock,
  ChevronRight,
  Database,
} from 'lucide-react';
import {
  AutoBackupSettings,
  BackupSnapshot,
  CloudProviderPreset,
  PROVIDER_PRESETS,
  getAutoBackupSettings,
  saveAutoBackupSettings,
  getStoredSnapshots,
  recordSnapshot,
  deleteStoredSnapshot,
  isDirectoryPickerSupported,
  isWebShareFilesSupported,
  pickDirectoryHandle,
  clearSavedDirectoryHandle,
  executeAutoBackup,
  shareBackupFile,
} from '../utils/autoBackup';
import { formatCurrency } from '../utils/formatters';
import { Language, Translations } from '../utils/translations';

interface AutoBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  getBackupPayload: () => Record<string, unknown>;
  onRestoreJson: (jsonData: unknown) => boolean;
  onShowToast: (msg: string) => void;
  language: Language;
  t: Translations;
}

export const AutoBackupModal: React.FC<AutoBackupModalProps> = ({
  isOpen,
  onClose,
  getBackupPayload,
  onRestoreJson,
  onShowToast,
  language,
  t,
}) => {
  const [settings, setSettings] = useState<AutoBackupSettings>(getAutoBackupSettings);
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasPicker, setHasPicker] = useState(false);
  const [hasShare, setHasShare] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getAutoBackupSettings());
      setSnapshots(getStoredSnapshots());
      setHasPicker(isDirectoryPickerSupported());
      setHasShare(isWebShareFilesSupported());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDe = language === 'de';
  const isEn = language === 'en';

  const handleToggleEnabled = () => {
    const next = { ...settings, enabled: !settings.enabled };
    setSettings(next);
    saveAutoBackupSettings(next);
    onShowToast(
      next.enabled
        ? isDe
          ? 'Automatisches tägliches Backup aktiviert!'
          : isEn
            ? 'Daily automatic backup activated!'
            : 'Backup automatico giornaliero attivato!'
        : isDe
          ? 'Automatisches tägliches Backup deaktiviert.'
          : isEn
            ? 'Daily automatic backup disabled.'
            : 'Backup automatico giornaliero disattivato.'
    );
  };

  const handleSelectPreset = (preset: CloudProviderPreset) => {
    const config = PROVIDER_PRESETS[preset];
    const next: AutoBackupSettings = {
      ...settings,
      providerPreset: preset,
      customPath: config.defaultPath,
    };
    setSettings(next);
    saveAutoBackupSettings(next);
  };

  const handleCustomPathChange = (val: string) => {
    const next = { ...settings, customPath: val };
    setSettings(next);
    saveAutoBackupSettings(next);
  };

  const handlePickFolder = async () => {
    try {
      const picked = await pickDirectoryHandle();
      if (picked) {
        const next: AutoBackupSettings = {
          ...settings,
          destinationType: 'device_folder',
          directoryName: picked.name,
          customPath: picked.name,
        };
        setSettings(next);
        saveAutoBackupSettings(next);
        onShowToast(
          isDe
            ? `Ordner "${picked.name}" erfolgreich verbunden!`
            : isEn
              ? `Folder "${picked.name}" connected successfully!`
              : `Cartella "${picked.name}" collegata con successo!`
        );
      }
    } catch (err) {
      console.error(err);
      onShowToast(
        isDe
          ? 'Fehler beim Verbinden des Ordners.'
          : isEn
            ? 'Error connecting folder.'
            : 'Impossibile collegare la cartella.'
      );
    }
  };

  const handleDisconnectFolder = async () => {
    await clearSavedDirectoryHandle();
    const next: AutoBackupSettings = {
      ...settings,
      destinationType: 'manual_path',
      directoryName: undefined,
    };
    setSettings(next);
    saveAutoBackupSettings(next);
    onShowToast(
      isDe
        ? 'Verbindung zum Ordner getrennt.'
        : isEn
          ? 'Folder disconnected.'
          : 'Cartella scollegata.'
    );
  };

  const handleRunBackupNow = async () => {
    try {
      setIsExecuting(true);
      const payload = getBackupPayload();
      const result = await executeAutoBackup(payload, settings, true);
      setSettings(getAutoBackupSettings());
      setSnapshots(getStoredSnapshots());

      if (result.success) {
        onShowToast(
          isDe
            ? `Backup gespeichert (${result.fileName})!`
            : isEn
              ? `Backup saved (${result.fileName})!`
              : `Backup salvato (${result.fileName})!`
        );
      } else {
        onShowToast(result.message || 'Errore salvataggio backup.');
      }
    } catch (err) {
      console.error(err);
      onShowToast(
        isDe
          ? 'Fehler beim Erstellen des Backups.'
          : isEn
            ? 'Error creating backup.'
            : 'Errore durante la creazione del backup.'
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const handleShareNow = async () => {
    try {
      const payload = getBackupPayload();
      const today = new Date().toISOString().split('T')[0];
      const fileName = `myfinance_backup_${today}.json`;
      const jsonStr = JSON.stringify(payload, null, 2);
      const shared = await shareBackupFile(fileName, jsonStr);
      if (shared) {
        onShowToast(
          isDe
            ? 'Backup geteilt!'
            : isEn
              ? 'Backup shared!'
              : 'Backup condiviso con successo!'
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadSnapshot = (snap: BackupSnapshot) => {
    try {
      const blob = new Blob([snap.payloadJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = snap.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      onShowToast(
        isDe
          ? `Datei ${snap.fileName} heruntergeladen!`
          : isEn
            ? `File ${snap.fileName} downloaded!`
            : `File ${snap.fileName} scaricato!`
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopySnapshotJson = async (snap: BackupSnapshot) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(snap.payloadJson);
        setCopiedId(snap.id);
        setTimeout(() => setCopiedId(null), 2000);
        onShowToast(
          isDe
            ? 'JSON in die Zwischenablage kopiert!'
            : isEn
              ? 'JSON copied to clipboard!'
              : 'JSON copiato negli appunti!'
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreSnapshot = (snap: BackupSnapshot) => {
    try {
      const parsed = JSON.parse(snap.payloadJson);
      const ok = onRestoreJson(parsed);
      if (ok) {
        onShowToast(
          isDe
            ? `Backup vom ${snap.date} erfolgreich wiederhergestellt!`
            : isEn
              ? `Backup from ${snap.date} restored successfully!`
              : `Backup del ${snap.date} ripristinato con successo!`
        );
        onClose();
      }
    } catch (err) {
      console.error(err);
      onShowToast(
        isDe
          ? 'Wiederherstellung fehlgeschlagen.'
          : isEn
            ? 'Failed to restore backup.'
            : 'Impossibile ripristinare il backup.'
      );
    }
  };

  const handleDeleteSnapshot = (id: string) => {
    const updated = deleteStoredSnapshot(id);
    setSnapshots(updated);
    onShowToast(
      isDe
        ? 'Snapshot gelöscht.'
        : isEn
          ? 'Snapshot deleted.'
          : 'Snapshot eliminato.'
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-100/90 dark:bg-slate-950/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-xl w-full p-5 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl transition hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label={t?.cancelBtn || 'Chiudi'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/30">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              {isDe
                ? 'Automatisches tägliches Backup (.JSON)'
                : isEn
                  ? 'Daily Automatic Backup (.JSON)'
                  : 'Backup Automatico Giornaliero (.JSON)'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isDe
                ? 'Tägliche Sicherung auf OneDrive, Google Drive oder Gerät'
                : isEn
                  ? 'Daily automated save to OneDrive, Google Drive, or Device'
                  : 'Salvataggio giornaliero su OneDrive, Google Drive o Dispositivo'}
            </p>
          </div>
        </div>

        {/* Main Body */}
        <div className="mt-3 space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
          {/* Main Activation Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                  settings.enabled
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                }`}
              >
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  {isDe
                    ? 'Tägliches automatisches Backup'
                    : isEn
                      ? 'Daily Automatic Backup'
                      : 'Backup Automatico Ogni Giorno'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                  {isDe
                    ? 'Erstellt jeden Tag automatisch eine vollständige .JSON-Sicherung'
                    : isEn
                      ? 'Automatically creates a full .JSON backup every day'
                      : 'Crea automaticamente un file .JSON completo ogni giorno'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleEnabled}
              className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center flex-shrink-0 ${
                settings.enabled ? 'bg-indigo-600 justify-end' : 'bg-slate-100 dark:bg-slate-800 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Destination Provider Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isDe
                  ? 'Ziel-Speicherort auswählen'
                  : isEn
                    ? 'Select Destination'
                    : 'Seleziona Destinazione'}
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                {isDe ? 'OneDrive · Google Drive · Gerät' : isEn ? 'OneDrive · Google Drive · Device' : 'OneDrive · Google Drive · Dispositivo'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* OneDrive */}
              <button
                type="button"
                onClick={() => handleSelectPreset('onedrive')}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                  settings.providerPreset === 'onedrive'
                    ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-md shadow-indigo-500/10'
                    : 'bg-slate-100/90 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-750'
                }`}
              >
                <Cloud className={`w-5 h-5 flex-shrink-0 mt-0.5 ${settings.providerPreset === 'onedrive' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Microsoft OneDrive</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Cloud Microsoft</div>
                </div>
              </button>

              {/* Google Drive */}
              <button
                type="button"
                onClick={() => handleSelectPreset('gdrive')}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                  settings.providerPreset === 'gdrive'
                    ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-md shadow-indigo-500/10'
                    : 'bg-slate-100/90 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-750'
                }`}
              >
                <Folder className={`w-5 h-5 flex-shrink-0 mt-0.5 ${settings.providerPreset === 'gdrive' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Google Drive</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Cloud Google</div>
                </div>
              </button>

              {/* Dispositivo Locale */}
              <button
                type="button"
                onClick={() => handleSelectPreset('device')}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                  settings.providerPreset === 'device'
                    ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-md shadow-indigo-500/10'
                    : 'bg-slate-100/90 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-750'
                }`}
              >
                <HardDrive className={`w-5 h-5 flex-shrink-0 mt-0.5 ${settings.providerPreset === 'device' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`} />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {isDe ? 'Gerätespeicher' : isEn ? 'Device Storage' : 'Dispositivo Locale'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isDe ? 'Downloads / Dokumente' : isEn ? 'Downloads / Documents' : 'Download / Memoria'}
                  </div>
                </div>
              </button>

              {/* Percorso Personalizzato */}
              <button
                type="button"
                onClick={() => handleSelectPreset('custom')}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                  settings.providerPreset === 'custom'
                    ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-md shadow-indigo-500/10'
                    : 'bg-slate-100/90 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-750'
                }`}
              >
                <FolderOpen className={`w-5 h-5 flex-shrink-0 mt-0.5 ${settings.providerPreset === 'custom' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`} />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {isDe ? 'Benutzerdefiniert' : isEn ? 'Custom Path' : 'Personalizzato'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isDe ? 'Eigener Pfad' : isEn ? 'Custom Directory' : 'Percorso / Indirizzo'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Manual Destination Path Input ("dargli l'indirizzo manualmente dove salvare i dati") */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>
                  {isDe
                    ? 'Zielpfad / Manuelle Adresse'
                    : isEn
                      ? 'Destination Path / Manual Address'
                      : 'Indirizzo / Percorso Manuale di Salvataggio'}
                </span>
              </label>
              <span className="text-[9px] text-slate-500 font-mono">
                {isDe ? 'Ordnername' : isEn ? 'Folder Name' : 'Cartella'}
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={settings.customPath}
                onChange={(e) => handleCustomPathChange(e.target.value)}
                placeholder="es. OneDrive/Documenti/MyFinance_Backups o Google Drive/Backup"
                className="w-full bg-white dark:bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-mono"
              />
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              💡 <strong>
                {isDe ? 'Tipp:' : isEn ? 'Tip:' : 'Come funziona la sincronizzazione:'}
              </strong>{' '}
              {isDe
                ? 'Wenn Sie Microsoft OneDrive oder Google Drive auf Ihrem PC oder Smartphone installiert haben, speichert die App das Backup in diesem Ordner und synchronisiert es sofort in Ihre Cloud!'
                : isEn
                  ? 'If Microsoft OneDrive or Google Drive is installed on your PC or smartphone, the app will target this folder and automatically sync across all your devices!'
                  : 'Se hai Microsoft OneDrive o Google Drive installato sul tuo computer o smartphone, salvando in questa cartella i dati vengono automaticamente sincronizzati in tempo reale nel tuo Cloud!'}
            </p>

            {/* Direct Folder Connection (File System Access API) if available */}
            {hasPicker && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 block truncate">
                    {settings.directoryName
                      ? `Cartella collegata: ${settings.directoryName}`
                      : 'Collega cartella reale del PC o Smartphone'}
                  </span>
                  <span className="text-[9px] text-slate-500 block truncate">
                    {settings.directoryName
                      ? 'Salvataggio trasparente 100% automatico'
                      : 'Scegli la cartella OneDrive o Google Drive sincronizzata'}
                  </span>
                </div>

                {settings.directoryName ? (
                  <button
                    type="button"
                    onClick={handleDisconnectFolder}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/20 text-[10px] font-semibold transition flex-shrink-0"
                  >
                    {isDe ? 'Trennen' : isEn ? 'Disconnect' : 'Scollega'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePickFolder}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition flex items-center gap-1 flex-shrink-0 shadow-sm"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{isDe ? 'Ordner wählen' : isEn ? 'Select Folder' : 'Seleziona Cartella'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Manual Trigger & Mobile Share Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleRunBackupNow}
              disabled={isExecuting}
              className="p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {isExecuting
                  ? isDe ? 'Wird gespeichert...' : isEn ? 'Saving...' : 'Salvataggio...'
                  : isDe ? 'Jetzt sichern' : isEn ? 'Back Up Now' : 'Esegui Backup Ora'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleShareNow}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>
                {isDe ? 'In Cloud teilen' : isEn ? 'Share to Cloud' : 'Condividi su Cloud'}
              </span>
            </button>
          </div>

          {/* Last Execution Status Banner */}
          {settings.lastBackupTime && (
            <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div className="truncate">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold block truncate">
                    {isDe ? 'Letzte Sicherung:' : isEn ? 'Last backup:' : 'Ultimo backup eseguito:'}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {new Date(settings.lastBackupTime).toLocaleString()} ({settings.lastBackupFileName})
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20 flex-shrink-0">
                OK
              </span>
            </div>
          )}

          {/* Rolling Snapshots Archive */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>
                  {isDe
                    ? 'Verlauf der täglichen Sicherungen'
                    : isEn
                      ? 'Daily Backups History'
                      : 'Storico Backup Giornalieri Salvati'}
                </span>
              </span>
              <span className="text-[10px] text-slate-500">
                {snapshots.length}{' '}
                {isDe ? 'gespeichert' : isEn ? 'stored' : 'archiviati'}
              </span>
            </div>

            {snapshots.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs">
                {isDe
                  ? 'Noch keine täglichen Sicherungen gespeichert. Klicken Sie oben auf "Jetzt sichern".'
                  : isEn
                    ? 'No daily backups stored yet. Click "Back Up Now" above to create your first one.'
                    : 'Nessun backup automatico registrato finora. Clicca su "Esegui Backup Ora" per creare il primo.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar pr-0.5">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-750 transition flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 truncate">
                        <span>{snap.date}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {new Date(snap.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                        <span>{snap.accountsCount} {isDe ? 'Konten' : isEn ? 'acc.' : 'conti'}</span>
                        <span>•</span>
                        <span>{snap.transactionsCount} {isDe ? 'Buchungen' : isEn ? 'mov.' : 'movimenti'}</span>
                        <span>•</span>
                        <span className="truncate text-indigo-700 dark:text-indigo-300 font-mono">
                          {snap.destinationInfo || 'Auto'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Download */}
                      <button
                        type="button"
                        onClick={() => handleDownloadSnapshot(snap)}
                        title={isDe ? 'Herunterladen' : isEn ? 'Download' : 'Scarica'}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-800 transition active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy JSON */}
                      <button
                        type="button"
                        onClick={() => handleCopySnapshotJson(snap)}
                        title={isDe ? 'Kopieren' : isEn ? 'Copy' : 'Copia'}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 transition active:scale-95"
                      >
                        {copiedId === snap.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Restore */}
                      <button
                        type="button"
                        onClick={() => handleRestoreSnapshot(snap)}
                        title={isDe ? 'Wiederherstellen' : isEn ? 'Restore' : 'Ripristina'}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-800 transition active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSnapshot(snap.id)}
                        title={isDe ? 'Löschen' : isEn ? 'Delete' : 'Elimina'}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-800 transition active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition active:scale-98"
          >
            {t?.cancelBtn || (isDe ? 'Schließen' : isEn ? 'Close' : 'Chiudi')}
          </button>
        </div>
      </div>
    </div>
  );
};
