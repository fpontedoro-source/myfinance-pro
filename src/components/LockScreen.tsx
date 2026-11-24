import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Delete,
  CheckCircle2,
  X,
  Mail,
  Key,
  Send,
  Check,
  RotateCcw,
  User,
  UserPlus,
  Globe,
  Fingerprint,
} from 'lucide-react';
import {
  SecuritySettings,
  getSecuritySettings,
  verifyPassword,
  requestPasswordRecovery,
  resetPasswordWithRecoveryCode,
  isUserRegistered,
  registerUserAccount,
  authenticateWithFingerprint,
} from '../utils/security';
import { syncRecipientEmailFromProfile } from '../utils/monthlyEmailStatement';
import { Language, Translations } from '../utils/translations';

interface LockScreenProps {
  settings: SecuritySettings;
  onUnlockSuccess: (updatedSettings?: SecuritySettings) => void;
  onOpenPrivacyPolicy?: () => void;
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
  t?: Translations;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  settings,
  onUnlockSuccess,
  onOpenPrivacyPolicy,
  language = 'it',
  onLanguageChange,
  t,
}) => {
  const registered = isUserRegistered(settings);
  const isDe = language === 'de';
  const isEn = language === 'en';

  // Login states
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isBiometricVerifying, setIsBiometricVerifying] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [shake, setShake] = useState(false);
  const fingerprintEnabled = Boolean(settings.useFingerprint && settings.credentialId);

  // Registration states (shown on first launch when user is not yet registered)
  const [firstName, setFirstName] = useState(settings.firstName || '');
  const [lastName, setLastName] = useState(settings.lastName || '');
  const [email, setEmail] = useState(settings.email || settings.recoveryEmail || '');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regHint, setRegHint] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Password recovery states
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmailInput, setRecoveryEmailInput] = useState(
    settings.email || settings.recoveryEmail || ''
  );
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showNewRecoveryPassword, setShowNewRecoveryPassword] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'REQUEST' | 'ENTER_CODE'>('REQUEST');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState<string | null>(null);
  const [sentOtpCode, setSentOtpCode] = useState<string | null>(null);
  const [recoveryMailtoUrl, setRecoveryMailtoUrl] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const firstNameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (registered) {
      inputRef.current?.focus();
    } else {
      firstNameInputRef.current?.focus();
    }
  }, [registered]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const fullName = [settings.firstName, settings.lastName].filter(Boolean).join(' ').trim();
  const accountEmail = (settings.email || settings.recoveryEmail || '').trim();

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (regPassword !== regConfirmPassword) {
      setRegError(
        isDe
          ? 'Die Passwörter stimmen nicht überein.'
          : isEn
            ? 'Passwords do not match.'
            : 'Le due password non coincidono.'
      );
      triggerShake();
      return;
    }

    setIsRegistering(true);
    try {
      const res = await registerUserAccount({
        firstName,
        lastName,
        email,
        password: regPassword,
        passwordHint: regHint,
        language,
      });

      if (res.success && res.settings) {
        syncRecipientEmailFromProfile(email);
        onUnlockSuccess(res.settings);
      } else {
        setRegError(
          res.error ||
            (isDe
              ? 'Registrierungsfehler.'
              : isEn
                ? 'Registration error.'
                : 'Errore durante la registrazione.')
        );
        triggerShake();
      }
    } catch (err) {
      console.error('Register error:', err);
      setRegError('Errore imprevisto durante la registrazione.');
      triggerShake();
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRequestRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoverySuccessMsg(null);

    const trimmedEmail = recoveryEmailInput.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setRecoveryError(
        isDe
          ? 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
          : isEn
            ? 'Please enter a valid email address.'
            : 'Inserisci un indirizzo email valido.'
      );
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await requestPasswordRecovery(trimmedEmail, settings);
      if (res.success && res.code) {
        setSentOtpCode(res.code);
        setRecoveryMailtoUrl(res.mailtoUrl || null);
        setRecoveryCodeInput(res.code);
        setRecoveryStep('ENTER_CODE');
        setRecoverySuccessMsg(
          isDe
            ? `6-stelliger OTP-Code für ${trimmedEmail} generiert.`
            : isEn
              ? `6-digit OTP code generated for ${trimmedEmail}.`
              : `Codice OTP a 6 cifre generato per ${trimmedEmail}.`
        );
      } else {
        setRecoveryError(res.error || 'Impossibile generare il codice di recupero.');
      }
    } catch (err) {
      console.error('Recovery request error:', err);
      setRecoveryError('Errore durante la generazione del codice OTP.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    const cleanedCode = recoveryCodeInput.trim().replace(/\D/g, '');
    if (!cleanedCode || cleanedCode.length !== 6) {
      setRecoveryError(
        isDe
          ? 'Bitte den 6-stelligen OTP-Code eingeben.'
          : isEn
            ? 'Please enter the 6-digit OTP code.'
            : 'Inserisci il codice OTP a 6 cifre.'
      );
      return;
    }

    if (!newPasswordInput || newPasswordInput.trim().length < 4) {
      setRecoveryError(
        isDe
          ? 'Das neue Passwort muss mindestens 4 Zeichen oder Ziffern haben.'
          : isEn
            ? 'New password must be at least 4 characters or digits.'
            : 'La nuova password deve contenere almeno 4 caratteri o cifre.'
      );
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await resetPasswordWithRecoveryCode(cleanedCode, newPasswordInput);
      if (res.success) {
        setShowRecoveryModal(false);
        setPassword('');
        setRecoveryCodeInput('');
        setNewPasswordInput('');
        setSentOtpCode(null);
        setRecoveryMailtoUrl(null);
        onUnlockSuccess(res.updatedSettings);
      } else {
        setRecoveryError(res.error || 'Codice OTP non valido o scaduto.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setRecoveryError('Errore durante il ripristino della password.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handlePasswordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password) {
      setErrorMsg(t?.wrongPasswordError || 'Inserisci la password');
      triggerShake();
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const latestSettings = { ...settings, ...getSecuritySettings() };
      const ok = await verifyPassword(password, latestSettings);
      if (ok) {
        setPassword('');
        onUnlockSuccess(latestSettings);
      } else {
        setErrorMsg(t?.wrongPasswordError || 'Password non corretta. Riprova.');
        triggerShake();
        setPassword('');
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error('Verify error:', err);
      setErrorMsg('Errore verifica password.');
      triggerShake();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFingerprintUnlock = async () => {
    setErrorMsg(null);
    setIsBiometricVerifying(true);
    try {
      const latestSettings = { ...settings, ...getSecuritySettings() };
      const res = await authenticateWithFingerprint(latestSettings, language);
      if (res.success) {
        setPassword('');
        onUnlockSuccess(latestSettings);
      } else {
        setErrorMsg(
          res.error ||
            (isDe
              ? 'Fingerabdruck nicht erkannt.'
              : isEn
                ? 'Fingerprint not recognized.'
                : 'Impronta digitale non riconosciuta.')
        );
        triggerShake();
      }
    } finally {
      setIsBiometricVerifying(false);
    }
  };

  const handleKeypadPress = async (val: string) => {
    if (val === 'CLEAR') {
      setPassword('');
      setErrorMsg(null);
    } else if (val === 'BACK') {
      setPassword((prev) => prev.slice(0, -1));
      setErrorMsg(null);
    } else {
      const next = password + val;
      setPassword(next);
      setErrorMsg(null);

      if (next.length >= 4) {
        try {
          const latestSettings = { ...settings, ...getSecuritySettings() };
          const ok = await verifyPassword(next, latestSettings);
          if (ok) {
            setPassword('');
            onUnlockSuccess(latestSettings);
          }
        } catch {
          // Keep input for manual submit
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center p-4 overflow-y-auto select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center my-auto py-2">
        {/* Language Switcher Bar at Top */}
        {onLanguageChange && (
          <div className="w-full mb-4 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-1.5 shadow-lg">
            <span className="text-[10px] font-bold text-slate-400 pl-2 flex items-center gap-1 flex-shrink-0">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isDe ? 'Sprache' : isEn ? 'Language' : 'Lingua'}</span>
            </span>
            <div className="flex items-center gap-1">
              {[
                { id: 'it' as const, flag: '🇮🇹', label: 'IT' },
                { id: 'de' as const, flag: '🇩🇪', label: 'DE' },
                { id: 'en' as const, flag: '🇬🇧', label: 'EN' },
              ].map((langOpt) => {
                const active = language === langOpt.id;
                return (
                  <button
                    key={langOpt.id}
                    type="button"
                    onClick={() => onLanguageChange(langOpt.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition active:scale-95 ${
                      active
                        ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30'
                        : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{langOpt.flag}</span>
                    <span>{langOpt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* App Logo / Shield */}
        <div className="relative mb-3">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-2xl shadow-indigo-600/40 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
              {registered ? (
                <ShieldCheck className="w-7 h-7 text-cyan-400" />
              ) : (
                <UserPlus className="w-7 h-7 text-cyan-400" />
              )}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 border-2 border-slate-950 flex items-center justify-center text-white shadow-md">
            <Lock className="w-3 h-3" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-black text-white tracking-tight text-center">
          {t?.lockScreenTitle || 'MyFinance Pro'}
        </h1>

        {!registered ? (
          <>
            {/* First-Launch Mandatory Registration View */}
            <p className="text-xs text-slate-300 mt-1 text-center max-w-[310px] leading-relaxed">
              {isDe
                ? 'Registrieren Sie sich mit Vorname, Nachname, E-Mail und Passwort, um die App zu öffnen.'
                : isEn
                  ? 'Register with your First Name, Last Name, Email and Password to open the app.'
                  : 'Registrati con Nome, Cognome, Email e Password per accedere all\'applicazione.'}
            </p>

            <form
              onSubmit={handleRegisterSubmit}
              className={`w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-2xl mt-4 space-y-2.5 transition-transform ${
                shake ? 'animate-shake' : ''
              }`}
            >
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <span>
                    {isDe ? 'Konto erstellen' : isEn ? 'Create Account' : 'Registrazione Utente'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>
                    {showRegPassword
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    {isDe ? 'Vorname *' : isEn ? 'First Name *' : 'Nome *'}
                  </label>
                  <input
                    ref={firstNameInputRef}
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (regError) setRegError(null);
                    }}
                    required
                    placeholder={isDe ? 'z.B. Max' : isEn ? 'e.g. John' : 'es. Mario'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    {isDe ? 'Nachname *' : isEn ? 'Last Name *' : 'Cognome *'}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (regError) setRegError(null);
                    }}
                    required
                    placeholder={isDe ? 'z.B. Mustermann' : isEn ? 'e.g. Smith' : 'es. Rossi'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  {isDe ? 'E-Mail-Adresse *' : isEn ? 'Email Address *' : 'Email *'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (regError) setRegError(null);
                    }}
                    required
                    placeholder="es. nome@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1 leading-snug">
                  {isDe
                    ? 'Für Passwort-Wiederherstellung & monatlichen PDF-Kontoauszug.'
                    : isEn
                      ? 'Used for Password recovery & monthly PDF email statements.'
                      : 'Usata per recupero password e invio estratto conto mensile in PDF.'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    {isDe ? 'Passwort *' : isEn ? 'Password *' : 'Password *'}
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (regError) setRegError(null);
                    }}
                    required
                    placeholder={isDe ? 'Min. 4 Zeichen' : isEn ? 'Min. 4 chars' : 'Min. 4 caratteri'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    {isDe ? 'Bestätigen *' : isEn ? 'Confirm *' : 'Conferma *'}
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => {
                      setRegConfirmPassword(e.target.value);
                      if (regError) setRegError(null);
                    }}
                    required
                    placeholder={isDe ? 'Wiederholen' : isEn ? 'Repeat password' : 'Ripeti password'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  {isDe
                    ? 'Passwort-Hinweis (optional)'
                    : isEn
                      ? 'Password Hint (optional)'
                      : 'Suggerimento Password (opzionale)'}
                </label>
                <input
                  type="text"
                  value={regHint}
                  onChange={(e) => setRegHint(e.target.value)}
                  placeholder={
                    isDe
                      ? 'z.B. Geburtsjahr...'
                      : isEn
                        ? 'e.g. Birth year...'
                        : 'es. Anno di nascita...'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {regError && (
                <div className="px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-snug font-medium">{regError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isRegistering
                    ? isDe
                      ? 'Wird gespeichert...'
                      : isEn
                        ? 'Registering...'
                        : 'Registrazione...'
                    : isDe
                      ? 'Registrieren & App öffnen'
                      : isEn
                        ? 'Register & Open App'
                        : 'Registrati e Apri l\'App'}
                </span>
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Registered User Login View */}
            {fullName ? (
              <div className="mt-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <div className="text-left">
                  <span className="text-xs font-bold text-white block leading-tight">{fullName}</span>
                  {accountEmail && (
                    <span className="text-[10px] text-slate-400 block leading-tight">{accountEmail}</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-1 text-center max-w-[280px]">
                {t?.lockScreenSubtitle || 'Inserisci la password per sbloccare i tuoi dati'}
              </p>
            )}

            <form
              onSubmit={handlePasswordSubmit}
              className={`w-full bg-slate-900/80 border border-slate-800/90 rounded-3xl p-4 shadow-xl transition-transform mt-4 ${
                shake ? 'animate-shake' : ''
              }`}
            >
              <div className="relative mb-2">
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={t?.passwordPlaceholder || 'Inserisci la Password...'}
                  className="w-full bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 rounded-2xl pl-4 pr-11 py-3 focus:outline-none focus:border-indigo-500 transition tracking-widest text-center font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {errorMsg && (
                <div className="mb-2.5 px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-1.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-snug text-[11px] font-medium">{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying || isBiometricVerifying}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-60"
              >
                <Unlock className="w-4 h-4" />
                <span>{isVerifying ? '...' : t?.unlockBtn || 'Sblocca con Password'}</span>
              </button>

              {fingerprintEnabled && (
                <button
                  type="button"
                  onClick={handleFingerprintUnlock}
                  disabled={isBiometricVerifying || isVerifying}
                  className="w-full mt-2 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 shadow-md shadow-cyan-500/10 disabled:opacity-60"
                >
                  <Fingerprint className={`w-4 h-4 text-cyan-400 ${isBiometricVerifying ? 'animate-pulse' : ''}`} />
                  <span>
                    {isBiometricVerifying
                      ? isDe
                        ? 'Fingerabdruck prüfen...'
                        : isEn
                          ? 'Scanning fingerprint...'
                          : 'Verifica impronta...'
                      : isDe
                        ? 'Mit Fingerabdruck entsperren'
                        : isEn
                          ? 'Unlock with Fingerprint'
                          : 'Sblocca con Impronta (Fingerprint)'}
                  </span>
                </button>
              )}

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 px-1">
                <button
                  type="button"
                  onClick={() => setShowKeypad(!showKeypad)}
                  className="text-indigo-400 hover:text-indigo-300 transition"
                >
                  {showKeypad
                    ? isDe
                      ? 'Ziffernblock ausblenden'
                      : isEn
                        ? 'Hide Keypad'
                        : 'Nascondi Tastierino'
                    : t?.numericKeypadBtn || 'Tastierino Numerico (PIN)'}
                </button>

                {settings.passwordHint && (
                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    className="text-slate-400 hover:text-slate-300 flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>{t?.passwordHintLabel || 'Suggerimento'}</span>
                  </button>
                )}
              </div>

              {showHint && settings.passwordHint && (
                <div className="mt-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 italic text-center">
                  {settings.passwordHint}
                </div>
              )}

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const latest = getSecuritySettings();
                    setRecoveryEmailInput(latest.email || latest.recoveryEmail || accountEmail || '');
                    setShowRecoveryModal(true);
                    setRecoveryStep('REQUEST');
                    setRecoveryError(null);
                    setRecoverySuccessMsg(null);
                  }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 transition hover:underline py-1"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {isDe
                      ? 'Passwort vergessen? Per OTP-Code entsperren'
                      : isEn
                        ? 'Forgot password? Recover with OTP code'
                        : 'Password dimenticata? Recupera con codice OTP'}
                  </span>
                </button>
              </div>
            </form>

            {showKeypad && (
              <div className="w-full mt-3 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-3 grid grid-cols-3 gap-2 animate-fade-in">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="py-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-base font-bold text-white transition active:scale-95"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleKeypadPress('CLEAR')}
                  className="py-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-rose-400 transition active:scale-95"
                >
                  C
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-base font-bold text-white transition active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('BACK')}
                  className="py-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center justify-center transition active:scale-95"
                >
                  <Delete className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            )}
          </>
        )}

        {onOpenPrivacyPolicy && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onOpenPrivacyPolicy}
              className="text-[11px] text-slate-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/70 border border-slate-800 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {isDe ? 'Datenschutzerklärung' : 'Privacy Policy'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Modal Recupero Password tramite Email / OTP */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {isDe
                      ? 'Passwort wiederherstellen'
                      : isEn
                        ? 'Password Recovery'
                        : 'Recupero Password (OTP)'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {recoveryStep === 'REQUEST'
                      ? isDe
                        ? '6-stelligen OTP-Code generieren'
                        : isEn
                          ? 'Generate 6-digit OTP code'
                          : 'Genera codice OTP a 6 cifre'
                      : isDe
                        ? 'OTP-Code & neues Passwort'
                        : isEn
                          ? 'OTP code & new password'
                          : 'Verifica OTP & nuova password'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecoveryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {recoveryError && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="leading-snug text-[11px] font-medium">{recoveryError}</span>
              </div>
            )}

            {recoverySuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="leading-snug text-[11px] font-medium">{recoverySuccessMsg}</span>
              </div>
            )}

            {recoveryStep === 'REQUEST' ? (
              <form onSubmit={handleRequestRecoveryEmail} className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isDe
                    ? 'Geben Sie Ihre registrierte E-Mail-Adresse ein. Ein 6-stelliger OTP-Sicherheitscode wird sofort erstellt.'
                    : isEn
                      ? 'Enter your registered email address. A 6-digit OTP security code will be generated immediately.'
                      : 'Inserisci il tuo indirizzo email registrato. Verrà generato subito il codice OTP numerico a 6 cifre per reimpostare la password.'}
                </p>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {isDe ? 'E-Mail-Adresse' : isEn ? 'Email Address' : 'Email Registrata'}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={recoveryEmailInput}
                      onChange={(e) => setRecoveryEmailInput(e.target.value)}
                      placeholder="es. nome@gmail.com"
                      required
                      autoFocus
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition"
                  >
                    {isDe ? 'Abbrechen' : isEn ? 'Cancel' : 'Annulla'}
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition active:scale-98"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {recoveryLoading
                        ? '...'
                        : isDe
                          ? 'OTP generieren'
                          : isEn
                            ? 'Generate OTP'
                            : 'Genera Codice OTP'}
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                {sentOtpCode && (
                  <div className="p-3.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-center space-y-2">
                    <span className="text-[11px] text-slate-300 block font-medium">
                      {isDe
                        ? 'Ihr 6-stelliger OTP-Code:'
                        : isEn
                          ? 'Your 6-digit OTP code:'
                          : 'Il tuo codice OTP a 6 cifre:'}
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-mono font-black tracking-widest text-indigo-300 bg-slate-950 px-4 py-1.5 rounded-xl border border-indigo-500/40 select-all">
                        {sentOtpCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRecoveryCodeInput(sentOtpCode)}
                        className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1"
                        title="Copia codice nel campo"
                      >
                        <Check className="w-3.5 h-3.5 text-indigo-300" />
                        <span>{isDe ? 'Einfügen' : isEn ? 'Fill' : 'Inserisci'}</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-0.5">
                      <span className="text-[10px] text-slate-400">
                        {isDe ? 'Gültig für 15 Min.' : isEn ? 'Valid for 15 min.' : 'Valido per 15 min.'}
                      </span>
                      {recoveryMailtoUrl && (
                        <a
                          href={recoveryMailtoUrl}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-semibold inline-flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          <span>
                            {isDe
                              ? 'Per E-Mail-App senden'
                              : isEn
                                ? 'Send via Email App'
                                : 'Invia via App Email'}
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {isDe ? '6-stelliger OTP-Code' : isEn ? '6-digit OTP Code' : 'Codice OTP a 6 cifre'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={recoveryCodeInput}
                    onChange={(e) => setRecoveryCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-center font-mono text-xl tracking-widest text-indigo-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {isDe ? 'Neues Passwort / Neue PIN' : isEn ? 'New Password / PIN' : 'Nuova Password o PIN'}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewRecoveryPassword ? 'text' : 'password'}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Min. 4 caratteri o cifre"
                      required
                      autoFocus
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                    <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowNewRecoveryPassword(!showNewRecoveryPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    >
                      {showNewRecoveryPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryStep('REQUEST');
                      setRecoveryError(null);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isDe ? 'Zurück' : isEn ? 'Back' : 'Indietro'}</span>
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition active:scale-98"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {recoveryLoading
                        ? '...'
                        : isDe
                          ? 'Freischalten & Speichern'
                          : isEn
                            ? 'Unlock & Save'
                            : 'Sblocca & Salva'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
