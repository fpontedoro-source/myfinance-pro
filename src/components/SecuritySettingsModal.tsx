import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Clock,
  AlertCircle,
  CheckCircle2,
  Mail,
  Check,
  User,
  UserPlus,
  Edit3,
  Fingerprint,
} from 'lucide-react';
import {
  SecuritySettings,
  getSecuritySettings,
  saveSecuritySettings,
  hashPassword,
  generateSalt,
  verifyPassword,
  isUserRegistered,
  registerUserAccount,
  updateUserProfile,
  checkBiometricSupport,
  registerFingerprintCredential,
  disableFingerprint,
} from '../utils/security';
import { syncRecipientEmailFromProfile } from '../utils/monthlyEmailStatement';
import { Language, Translations } from '../utils/translations';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated: (newSettings: SecuritySettings) => void;
  onLockNow: () => void;
  onShowToast: (msg: string) => void;
  language?: Language;
  t?: Translations;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated,
  onLockNow,
  onShowToast,
  language = 'it',
  t,
}) => {
  const isDe = language === 'de';
  const isEn = language === 'en';

  const [settings, setSettings] = useState<SecuritySettings>(getSecuritySettings);
  const registered = isUserRegistered(settings);

  // Registration form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regHint, setRegHint] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Password change form state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(null);
  const [fingerprintBusy, setFingerprintBusy] = useState(false);
  const [fingerprintMsg, setFingerprintMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getSecuritySettings();
      setSettings(current);
      setFirstName(current.firstName || '');
      setLastName(current.lastName || '');
      setEmail(current.email || current.recoveryEmail || '');
      setPasswordHint(current.passwordHint || '');
      setRecoveryEmail(current.email || current.recoveryEmail || '');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegHint(current.passwordHint || '');
      setIsEditingProfile(false);
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFormError(null);
      setFingerprintMsg(null);
      checkBiometricSupport().then((res) => setBiometricAvailable(res.available));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (regPassword !== regConfirmPassword) {
      setFormError(t?.passwordsMismatchError || 'Le password non coincidono.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await registerUserAccount({
        firstName,
        lastName,
        email,
        password: regPassword,
        passwordHint: regHint,
      });

      if (res.success && res.settings) {
        setSettings(res.settings);
        syncRecipientEmailFromProfile(email);
        onSettingsUpdated(res.settings);
        setRegPassword('');
        setRegConfirmPassword('');
        onShowToast(
          isDe
            ? `Willkommen ${res.settings.firstName}! Konto registriert.`
            : isEn
              ? `Welcome ${res.settings.firstName}! Account registered.`
              : `Benvenuto ${res.settings.firstName}! Registrazione completata.`
        );
      } else {
        setFormError(
          res.error ||
            (isDe
              ? 'Fehler bei der Registrierung.'
              : isEn
                ? 'Registration failed.'
                : 'Errore durante la registrazione.')
        );
      }
    } catch (err) {
      console.error(err);
      setFormError(
        isDe
          ? 'Unerwarteter Registrierungsfehler.'
          : isEn
            ? 'Unexpected error during registration.'
            : 'Errore imprevisto durante la registrazione.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfileEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const res = updateUserProfile({ firstName, lastName, email }, settings);
    if (res.success && res.settings) {
      setSettings(res.settings);
      setRecoveryEmail(res.settings.email || '');
      syncRecipientEmailFromProfile(email);
      onSettingsUpdated(res.settings);
      setIsEditingProfile(false);
      onShowToast(
        isDe
          ? 'Profil aktualisiert!'
          : isEn
            ? 'Profile updated!'
            : 'Dati profilo aggiornati!'
      );
    } else {
      setFormError(
        res.error ||
          (isDe ? 'Ungültige Daten.' : isEn ? 'Invalid data.' : 'Dati non validi.')
      );
    }
  };

  const handleToggleRequirePassword = () => {
    if (settings.enabled) {
      const next: SecuritySettings = {
        ...settings,
        enabled: false,
      };
      setSettings(next);
      saveSecuritySettings(next);
      onSettingsUpdated(next);
      onShowToast(t?.securityDisabledToast || 'Blocco con password disattivato.');
    } else {
      if (settings.passwordHash) {
        const next: SecuritySettings = {
          ...settings,
          enabled: true,
        };
        setSettings(next);
        saveSecuritySettings(next);
        onSettingsUpdated(next);
        onShowToast(t?.passwordSetToast || 'Protezione con password attivata!');
      } else {
        setIsChangingPassword(true);
      }
    }
  };

  const handleSaveRecoveryEmailOnly = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = recoveryEmail.trim().toLowerCase();
    if (cleaned && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      onShowToast(
        isDe
          ? 'Bitte gültige E-Mail-Adresse eingeben.'
          : isEn
            ? 'Please enter a valid email address.'
            : 'Inserisci un indirizzo email valido.'
      );
      return;
    }
    const next: SecuritySettings = {
      ...settings,
      email: cleaned,
      recoveryEmail: cleaned,
    };
    setSettings(next);
    saveSecuritySettings(next);
    syncRecipientEmailFromProfile(cleaned);
    onSettingsUpdated(next);
    onShowToast(
      cleaned
        ? isDe
          ? 'E-Mail gespeichert!'
          : isEn
            ? 'Email saved!'
            : 'Email salvata e sincronizzata per recupero ed estratto conto!'
        : isDe
          ? 'E-Mail entfernt.'
          : isEn
            ? 'Email removed.'
            : 'Email rimossa.'
    );
  };

  const handleAutoLockDelayChange = (minutes: number) => {
    const next: SecuritySettings = {
      ...settings,
      autoLockMinutes: minutes,
    };
    setSettings(next);
    saveSecuritySettings(next);
    onSettingsUpdated(next);
  };

  const handleToggleFingerprint = async () => {
    setFingerprintMsg(null);
    const isCurrentlyActive = Boolean(settings.useFingerprint && settings.credentialId);

    if (isCurrentlyActive) {
      const next = disableFingerprint(settings);
      setSettings(next);
      onSettingsUpdated(next);
      onShowToast(
        isDe
          ? 'Fingerabdruck-Entsperrung deaktiviert.'
          : isEn
            ? 'Fingerprint unlock disabled.'
            : 'Sblocco con impronta digitale disattivato.'
      );
      return;
    }

    setFingerprintBusy(true);
    try {
      const res = await registerFingerprintCredential(settings, language);
      if (res.success && res.settings) {
        setSettings(res.settings);
        onSettingsUpdated(res.settings);
        onShowToast(
          isDe
            ? 'Fingerabdruck erfolgreich registriert!'
            : isEn
              ? 'Fingerprint registered successfully!'
              : 'Impronta digitale registrata con successo!'
        );
      } else {
        setFingerprintMsg(
          res.error ||
            (isDe
              ? 'Fingerabdruck konnte nicht aktiviert werden.'
              : isEn
                ? 'Could not register fingerprint.'
                : 'Impossibile attivare l\'impronta digitale.')
        );
      }
    } finally {
      setFingerprintBusy(false);
    }
  };

  const handleReRegisterFingerprint = async () => {
    setFingerprintMsg(null);
    setFingerprintBusy(true);
    try {
      const res = await registerFingerprintCredential(settings, language);
      if (res.success && res.settings) {
        setSettings(res.settings);
        onSettingsUpdated(res.settings);
        onShowToast(
          isDe
            ? 'Fingerabdruck aktualisiert!'
            : isEn
              ? 'Fingerprint updated!'
              : 'Impronta digitale aggiornata!'
        );
      } else if (res.error) {
        setFingerprintMsg(res.error);
      }
    } finally {
      setFingerprintBusy(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newPassword || newPassword.length < 4) {
      setFormError(t?.passwordEmptyError || 'La password deve contenere almeno 4 caratteri o cifre.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError(t?.passwordsMismatchError || 'Le password non coincidono.');
      return;
    }

    if (settings.enabled && settings.passwordHash) {
      const ok = await verifyPassword(currentPassword, settings);
      if (!ok) {
        setFormError(t?.wrongCurrentPasswordError || 'Password attuale non corretta.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const salt = generateSalt();
      const hash = await hashPassword(newPassword, salt);
      const cleanedEmail = recoveryEmail.trim().toLowerCase();

      const next: SecuritySettings = {
        ...settings,
        enabled: true,
        passwordHash: hash,
        salt,
        passwordHint: passwordHint.trim(),
        email: cleanedEmail || settings.email,
        recoveryEmail: cleanedEmail || settings.recoveryEmail,
        lastUnlockedTimestamp: Date.now(),
      };

      setSettings(next);
      saveSecuritySettings(next);
      if (cleanedEmail) syncRecipientEmailFromProfile(cleanedEmail);
      onSettingsUpdated(next);
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onShowToast(t?.passwordSetToast || 'Password salvata con successo!');
    } catch (err) {
      console.error(err);
      setFormError(
        isDe
          ? 'Fehler beim Speichern des Passworts.'
          : isEn
            ? 'Error saving password.'
            : 'Errore salvataggio password.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl transition hover:bg-slate-800"
          aria-label={t?.cancel || 'Chiudi'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-2 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/30">
            {registered ? <ShieldCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {registered
                ? isDe
                  ? 'Benutzerprofil & Sicherheit'
                  : isEn
                    ? 'User Profile & Security'
                    : 'Profilo Utente & Sicurezza'
                : isDe
                  ? 'Konto registrieren'
                  : isEn
                    ? 'Register Your Account'
                    : 'Registrazione Account Utente'}
            </h3>
            <p className="text-xs text-slate-400">
              {registered
                ? isDe
                  ? 'Kontodaten, Passwortschutz & E-Mail-Wiederherstellung'
                  : isEn
                    ? 'Profile details, password lock & email recovery'
                    : 'Dati personali, blocco con Password e recupero Email OTP'
                : isDe
                  ? 'Vorname, Nachname, E-Mail & Passwort einrichten'
                  : isEn
                    ? 'Enter First Name, Last Name, Email and Password'
                    : 'Inserisci Nome, Cognome, Email e Password di accesso'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mt-3 space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
          {/* Registration Form when NOT registered */}
          {!registered && (
            <form
              onSubmit={handleRegisterSubmit}
              className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-indigo-500/30"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <span>
                    {isDe
                      ? 'Neues Profil erstellen'
                      : isEn
                        ? 'Create Personal Account'
                        : 'Crea il tuo Account Personale'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPasswords ? 'Nascondi' : 'Mostra'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                    {isDe ? 'Vorname *' : isEn ? 'First Name *' : 'Nome *'}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="es. Mario"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                    {isDe ? 'Nachname *' : isEn ? 'Last Name *' : 'Cognome *'}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="es. Rossi"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                  {isDe ? 'E-Mail-Adresse *' : isEn ? 'Email Address *' : 'Email *'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="es. nome@gmail.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Utilizzata sia per il recupero password OTP sia per l&apos;estratto conto mensile automatico.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                    {isDe ? 'Passwort *' : isEn ? 'Password *' : 'Password *'}
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder="Min. 4 caratteri"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                    {isDe ? 'Bestätigen *' : isEn ? 'Confirm *' : 'Conferma *'}
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    placeholder="Ripeti password"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                  {t?.passwordHintLabel || 'Suggerimento Password (opzionale)'}
                </label>
                <input
                  type="text"
                  value={regHint}
                  onChange={(e) => setRegHint(e.target.value)}
                  placeholder="es. Anno di nascita, promemoria personale..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {formError && (
                <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-1.5 transition active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSaving
                    ? 'Registrazione...'
                    : isDe
                      ? 'Registrieren & Schützen'
                      : isEn
                        ? 'Register & Protect App'
                        : 'Completa Registrazione'}
                </span>
              </button>
            </form>
          )}

          {/* Registered Profile Summary Card */}
          {registered && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              {!isEditingProfile ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-cyan-500/30 border border-indigo-500/40 text-cyan-300 font-black text-sm flex items-center justify-center flex-shrink-0 uppercase">
                      {(settings.firstName?.[0] || '') + (settings.lastName?.[0] || '') || <User className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-white block truncate">
                        {settings.firstName} {settings.lastName}
                      </span>
                      <span className="text-[11px] text-cyan-300 block truncate">
                        {settings.email || settings.recoveryEmail}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-slate-700 font-semibold text-[11px] flex items-center gap-1 flex-shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isDe ? 'Ändern' : isEn ? 'Edit' : 'Modifica'}</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveProfileEdit} className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {isDe ? 'Vorname' : isEn ? 'First Name' : 'Nome'}
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {isDe ? 'Nachname' : isEn ? 'Last Name' : 'Cognome'}
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      {isDe ? 'E-Mail' : isEn ? 'Email' : 'Email'}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {formError && (
                    <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px]">
                      {formError}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setFormError(null);
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                    >
                      {isDe ? 'Abbrechen' : isEn ? 'Cancel' : 'Annulla'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {isDe ? 'Profil speichern' : isEn ? 'Save Profile' : 'Salva Profilo'}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Main Password Toggle Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                  settings.enabled
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {settings.enabled ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              </div>
              <div>
                <span className="font-bold text-sm text-white block">
                  {t?.requirePasswordLabel || 'Richiedi Password all\'Avvio'}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 leading-snug">
                  {isDe
                    ? 'Sperrt die App beim Beenden und verlangt das Passwort beim Öffnen'
                    : isEn
                      ? 'Locks the app on exit and requires your password to open'
                      : 'Blocca l\'app alla chiusura e richiede la password per entrare'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleRequirePassword}
              className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center flex-shrink-0 ${
                settings.enabled ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Fingerprint / Biometric Unlock Card */}
          {(registered || settings.passwordHash) && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                      settings.useFingerprint && settings.credentialId
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-white">
                        {isDe
                          ? 'Fingerabdruck / Biometrie'
                          : isEn
                            ? 'Fingerprint / Biometrics'
                            : 'Sblocco con Impronta (Fingerprint)'}
                      </span>
                      {settings.useFingerprint && settings.credentialId && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          {isDe ? 'Aktiv' : isEn ? 'Active' : 'Attivo'}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5 leading-snug">
                      {biometricAvailable === false
                        ? isDe
                          ? 'Sensor in diesem Browser/Kontext nicht verfügbar'
                          : isEn
                            ? 'Biometric sensor unavailable in this browser context'
                            : 'Sensore non disponibile o bloccato in questo contesto'
                        : isDe
                          ? 'Schnelles Entsperren per Fingerabdruck oder Face ID'
                          : isEn
                            ? 'Fast device unlock via Fingerprint or Face ID'
                            : 'Sblocca l\'app all\'istante con impronta digitale o biometria'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={fingerprintBusy}
                  onClick={handleToggleFingerprint}
                  className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center flex-shrink-0 disabled:opacity-50 ${
                    settings.useFingerprint && settings.credentialId
                      ? 'bg-cyan-500 justify-end'
                      : 'bg-slate-800 justify-start'
                  }`}
                  aria-label="Toggle Fingerprint"
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {settings.useFingerprint && settings.credentialId && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {isDe
                        ? 'Biometrische ID lokal verknüpft'
                        : isEn
                          ? 'Biometric credential linked locally'
                          : 'Impronta associata al dispositivo'}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={fingerprintBusy}
                    onClick={handleReRegisterFingerprint}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold underline disabled:opacity-50"
                  >
                    {isDe ? 'Neu verknüpfen' : isEn ? 'Re-link' : 'Aggiorna impronta'}
                  </button>
                </div>
              )}

              {fingerprintMsg && (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] flex items-start gap-1.5 leading-snug">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400 mt-0.5" />
                  <span>{fingerprintMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Auto-Lock Delay Options */}
          {settings.enabled && (
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-200">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t?.autoLockDelayLabel || 'Blocco Automatico:'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { val: 0, label: t?.autoLockImmediate || 'Subito (alla chiusura)' },
                  { val: 1, label: t?.autoLock1Min || 'Dopo 1 minuto' },
                  { val: 5, label: t?.autoLock5Min || 'Dopo 5 minuti' },
                  { val: 15, label: t?.autoLock15Min || 'Dopo 15 minuti' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => handleAutoLockDelayChange(opt.val)}
                    className={`py-2 px-2.5 rounded-xl border text-left text-[11px] transition ${
                      settings.autoLockMinutes === opt.val
                        ? 'bg-indigo-600/15 border-indigo-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Change Password Form */}
          {isChangingPassword ? (
            <form onSubmit={handleSavePassword} className="space-y-3 p-3.5 rounded-2xl bg-slate-950 border border-indigo-500/30">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <span>{settings.passwordHash ? t?.changePasswordBtn || 'Modifica Password' : t?.setPasswordBtn || 'Imposta Password'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>
                    {showPasswords
                      ? isDe
                        ? 'Verbergen'
                        : isEn
                          ? 'Hide'
                          : 'Nascondi'
                      : isDe
                        ? 'Anzeigen'
                        : isEn
                          ? 'Show'
                          : 'Mostra'}
                  </span>
                </button>
              </div>

              {settings.passwordHash && (
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">
                    {t?.currentPasswordLabel || 'Password Attuale'}
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1">
                  {t?.newPasswordLabel || 'Nuova Password o PIN (min 4 caratteri)'}
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder={isDe ? 'Mind. 4 Zeichen oder Ziffern' : isEn ? 'Min. 4 chars or digits' : 'Min. 4 caratteri o cifre'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1">
                  {t?.confirmPasswordLabel || 'Conferma Nuova Password'}
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder={isDe ? 'Passwort wiederholen' : isEn ? 'Repeat password' : 'Ripeti la password'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1">
                  {t?.passwordHintLabel || 'Suggerimento Password (opzionale)'}
                </label>
                <input
                  type="text"
                  value={passwordHint}
                  onChange={(e) => setPasswordHint(e.target.value)}
                  placeholder={isDe ? 'z. B. Geburtsjahr...' : isEn ? 'e.g. Birth year...' : 'es. Anno di nascita...'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {formError && (
                <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setFormError(null);
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  {t?.cancel || (isDe ? 'Abbrechen' : isEn ? 'Cancel' : 'Annulla')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md transition active:scale-98"
                >
                  {isSaving
                    ? isDe
                      ? 'Speichern...'
                      : isEn
                        ? 'Saving...'
                        : 'Salvataggio...'
                    : isDe
                      ? 'Passwort speichern'
                      : isEn
                        ? 'Save Password'
                        : 'Salva Password'}
                </button>
              </div>
            </form>
          ) : (
            (registered || settings.passwordHash) && (
              <div className="space-y-3">
                {/* Recovery Email Quick Card */}
                <form
                  onSubmit={handleSaveRecoveryEmailOnly}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      <span>
                        {isDe
                          ? 'Wiederherstellungs-E-Mail (OTP)'
                          : isEn
                            ? 'Recovery & Statement Email'
                            : 'Email Recupero Password (OTP)'}
                      </span>
                    </span>
                    {(settings.email || settings.recoveryEmail) && (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded">
                        {isDe ? 'Gespeichert' : isEn ? 'Saved' : 'Configurata'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="es. nome@gmail.com"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isDe ? 'Speichern' : isEn ? 'Save' : 'Salva'}</span>
                    </button>
                  </div>
                </form>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(true)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-98"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{t?.changePasswordBtn || 'Modifica Password'}</span>
                  </button>
                  {settings.enabled && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLockNow();
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-98"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t?.lockNowBtn || 'Blocca App Ora'}</span>
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 mt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            {t?.close || 'Chiudi'}
          </button>
        </div>
      </div>
    </div>
  );
};
