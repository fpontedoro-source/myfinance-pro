/**
 * Security, User Registration & App Lock Utilities (Password & Email OTP Recovery)
 * Fully offline, standalone and privacy-preserving.
 */

export interface SecuritySettings {
  enabled: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  passwordHash: string; // SHA-256 hex string
  salt: string;
  passwordHint?: string;
  recoveryEmail?: string; // Synced with registered email
  recoveryCodeHash?: string; // OTP hash for resetting password
  recoveryCodeExpires?: number; // Expiry timestamp of OTP
  useFingerprint?: boolean; // Biometric / Fingerprint unlock enabled
  credentialId?: string; // Base64URL WebAuthn platform credential ID
  autoLockMinutes: number; // 0 = immediate, 1 = 1 min, 5 = 5 min, etc.
  lastUnlockedTimestamp?: number;
  registeredAt?: string;
}

const SECURITY_STORAGE_KEY = 'myfinance_security_settings_v1';

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  enabled: false,
  firstName: '',
  lastName: '',
  email: '',
  passwordHash: '',
  salt: '',
  passwordHint: '',
  recoveryEmail: '',
  useFingerprint: false,
  credentialId: undefined,
  autoLockMinutes: 0,
};

/**
 * Generate a random salt hex string
 */
export function generateSalt(length: number = 16): string {
  const arr = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a password using SHA-256 with a salt
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const combined = password + '::' + salt + '::myfinance_secret_salt_2026';
  const enc = new TextEncoder();
  const data = enc.encode(combined);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const digest = await window.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (e) {
      console.warn('SubtleCrypto digest fallback:', e);
    }
  }

  // Pure JS fallback hash (FNV-1a 64-bit variant) if crypto.subtle is unavailable
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ (code + i), 0x5bd1e995);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

/**
 * Retrieve saved security & user registration settings
 */
export function getSecuritySettings(): SecuritySettings {
  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged: SecuritySettings = { ...DEFAULT_SECURITY_SETTINGS, ...parsed };
      if (!merged.email && merged.recoveryEmail) {
        merged.email = merged.recoveryEmail;
      }
      if (!merged.recoveryEmail && merged.email) {
        merged.recoveryEmail = merged.email;
      }
      return merged;
    }
  } catch (e) {
    console.error('Error reading security settings:', e);
  }
  return { ...DEFAULT_SECURITY_SETTINGS };
}

/**
 * Save security settings
 */
export function saveSecuritySettings(settings: SecuritySettings): void {
  try {
    const clean: SecuritySettings = {
      enabled: settings.enabled,
      firstName: settings.firstName || '',
      lastName: settings.lastName || '',
      email: (settings.email || settings.recoveryEmail || '').trim().toLowerCase(),
      passwordHash: settings.passwordHash,
      salt: settings.salt,
      passwordHint: settings.passwordHint || '',
      recoveryEmail: (settings.recoveryEmail || settings.email || '').trim().toLowerCase(),
      recoveryCodeHash: settings.recoveryCodeHash,
      recoveryCodeExpires: settings.recoveryCodeExpires,
      useFingerprint: Boolean(settings.useFingerprint && settings.credentialId),
      credentialId: settings.credentialId,
      autoLockMinutes: settings.autoLockMinutes ?? 0,
      lastUnlockedTimestamp: settings.lastUnlockedTimestamp,
      registeredAt: settings.registeredAt,
    };
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(clean));
  } catch (e) {
    console.error('Error saving security settings:', e);
  }
}

/**
 * Check if a full user account (Nome, Cognome, Email, Password) has been registered
 */
export function isUserRegistered(settings?: SecuritySettings): boolean {
  const s = settings || getSecuritySettings();
  return Boolean(
    s.firstName?.trim() &&
      s.lastName?.trim() &&
      (s.email?.trim() || s.recoveryEmail?.trim()) &&
      s.passwordHash
  );
}

/**
 * Register a user with First Name, Last Name, Email and Password
 */
export async function registerUserAccount(params: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordHint?: string;
  autoLockMinutes?: number;
  language?: 'it' | 'de' | 'en';
}): Promise<{ success: boolean; settings?: SecuritySettings; error?: string }> {
  const lang = params.language || 'it';
  const firstName = params.firstName.trim();
  const lastName = params.lastName.trim();
  const email = params.email.trim().toLowerCase();
  const password = params.password.trim();

  if (firstName.length < 2) {
    return {
      success: false,
      error:
        lang === 'de'
          ? 'Bitte geben Sie Ihren Vornamen ein (mind. 2 Zeichen).'
          : lang === 'en'
            ? 'Please enter your First Name (at least 2 characters).'
            : 'Inserisci il tuo Nome (almeno 2 caratteri).',
    };
  }
  if (lastName.length < 2) {
    return {
      success: false,
      error:
        lang === 'de'
          ? 'Bitte geben Sie Ihren Nachnamen ein (mind. 2 Zeichen).'
          : lang === 'en'
            ? 'Please enter your Last Name (at least 2 characters).'
            : 'Inserisci il tuo Cognome (almeno 2 caratteri).',
    };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      success: false,
      error:
        lang === 'de'
          ? 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
          : lang === 'en'
            ? 'Please enter a valid Email address.'
            : 'Inserisci un indirizzo Email valido.',
    };
  }
  if (password.length < 4) {
    return {
      success: false,
      error:
        lang === 'de'
          ? 'Das Passwort muss mindestens 4 Zeichen oder Ziffern enthalten.'
          : lang === 'en'
            ? 'Password must contain at least 4 characters or digits.'
            : 'La Password deve contenere almeno 4 caratteri o cifre.',
    };
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const current = getSecuritySettings();

  const updated: SecuritySettings = {
    ...current,
    enabled: true,
    firstName,
    lastName,
    email,
    recoveryEmail: email,
    passwordHash,
    salt,
    passwordHint: (params.passwordHint || '').trim(),
    autoLockMinutes: params.autoLockMinutes ?? current.autoLockMinutes ?? 0,
    lastUnlockedTimestamp: Date.now(),
    registeredAt: current.registeredAt || new Date().toISOString(),
    recoveryCodeHash: undefined,
    recoveryCodeExpires: undefined,
  };

  saveSecuritySettings(updated);
  return { success: true, settings: updated };
}

/**
 * Update existing registered user profile details (Nome, Cognome, Email)
 */
export function updateUserProfile(
  params: { firstName: string; lastName: string; email: string; language?: 'it' | 'de' | 'en' },
  settings?: SecuritySettings
): { success: boolean; settings?: SecuritySettings; error?: string } {
  const lang = params.language || 'it';
  const firstName = params.firstName.trim();
  const lastName = params.lastName.trim();
  const email = params.email.trim().toLowerCase();

  if (firstName.length < 2) {
    return {
      success: false,
      error:
        lang === 'de'
          ? 'Bitte geben Sie Ihren Vornamen ein (mind. 2 Zeichen).'
          : lang === 'en'
            ? 'Please enter your First Name (at least 2 characters).'
            : 'Inserisci il tuo Nome (almeno 2 caratteri).',
    };
  }
  if (lastName.length < 2) {
    return {
      success: false,
      error:
        lang === 'de'
          ? 'Bitte geben Sie Ihren Nachnamen ein (mind. 2 Zeichen).'
          : lang === 'en'
            ? 'Please enter your Last Name (at least 2 characters).'
            : 'Inserisci il tuo Cognome (almeno 2 caratteri).',
    };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      success: false,
      error:
        lang === 'de'
          ? 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
          : lang === 'en'
            ? 'Please enter a valid Email address.'
            : 'Inserisci un indirizzo Email valido.',
    };
  }

  const stored = getSecuritySettings();
  const current: SecuritySettings = { ...DEFAULT_SECURITY_SETTINGS, ...settings, ...stored };
  const updated: SecuritySettings = {
    ...current,
    firstName,
    lastName,
    email,
    recoveryEmail: email,
    registeredAt: current.registeredAt || new Date().toISOString(),
  };

  saveSecuritySettings(updated);
  return { success: true, settings: updated };
}

/**
 * Verify an entered password against stored security settings
 */
export async function verifyPassword(password: string, settings?: SecuritySettings): Promise<boolean> {
  const stored = getSecuritySettings();
  const current: SecuritySettings = { ...DEFAULT_SECURITY_SETTINGS, ...settings, ...stored };
  if (!current.enabled || !current.passwordHash || !current.salt) {
    return true; // No password required
  }
  const computedHash = await hashPassword(password, current.salt);
  return computedHash === current.passwordHash;
}

/**
 * Generate a 6-digit numeric recovery verification code
 */
export function generateRecoveryCode(): string {
  const digits = '0123456789';
  let code = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(6);
    window.crypto.getRandomValues(arr);
    for (let i = 0; i < 6; i++) {
      code += digits[arr[i] % 10];
    }
    return code;
  }
  for (let i = 0; i < 6; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

/**
 * Prepare password recovery: generates OTP, stores hash & expiry (15 mins), and prepares email draft
 */
export async function requestPasswordRecovery(
  email: string,
  settings?: SecuritySettings
): Promise<{
  success: boolean;
  code?: string;
  mailtoUrl?: string;
  updatedSettings?: SecuritySettings;
  error?: string;
}> {
  const stored = getSecuritySettings();
  const current: SecuritySettings = { ...DEFAULT_SECURITY_SETTINGS, ...settings, ...stored };
  const normalizedEmail = email.trim().toLowerCase();
  const savedEmail = (current.recoveryEmail || current.email || '').trim().toLowerCase();

  // If a recovery/account email was previously set, verify it matches
  if (savedEmail && savedEmail.length > 3 && savedEmail !== normalizedEmail) {
    return {
      success: false,
      error: `L'email inserita non corrisponde all'email registrata (${savedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')}).`,
    };
  }

  const code = generateRecoveryCode();
  const salt = generateSalt(8);
  const codeHash = await hashPassword(code, salt);
  const expires = Date.now() + 15 * 60 * 1000; // 15 minutes validity

  // Save active OTP in sessionStorage as well as salted hash in localStorage
  try {
    sessionStorage.setItem('myfinance_active_recovery_otp', code);
    sessionStorage.setItem('myfinance_active_recovery_expires', String(expires));
  } catch {
    // Ignore storage quota / privacy mode errors
  }

  const updatedSettings: SecuritySettings = {
    ...current,
    email: current.email || normalizedEmail,
    recoveryEmail: savedEmail || normalizedEmail,
    recoveryCodeHash: `${salt}:${codeHash}`,
    recoveryCodeExpires: expires,
  };
  saveSecuritySettings(updatedSettings);

  const fullName = [current.firstName, current.lastName].filter(Boolean).join(' ') || 'utente';

  // Subject and body for recovery email
  const subject = encodeURIComponent('MyFinance Pro - Codice di Recupero Password');
  const body = encodeURIComponent(
    `Gentile ${fullName},\n\nEcco il tuo codice di sicurezza (OTP) per reimpostare la password di accesso a MyFinance Pro:\n\n` +
      `  CODICE DI RECUPERO: ${code}\n\n` +
      `Questo codice scade tra 15 minuti.\n\n` +
      `Inserisci questo codice a 6 cifre nella schermata di recupero dell'applicazione per sbloccare i tuoi dati e salvare una nuova password.\n\n` +
      `Cordiali saluti,\nMyFinance Pro`
  );
  const mailtoUrl = `mailto:${encodeURIComponent(normalizedEmail)}?subject=${subject}&body=${body}`;

  return {
    success: true,
    code,
    mailtoUrl,
    updatedSettings,
  };
}

/**
 * Reset password using the 6-digit recovery OTP code
 */
export async function resetPasswordWithRecoveryCode(
  recoveryCode: string,
  newPassword: string,
  settings?: SecuritySettings
): Promise<{ success: boolean; error?: string; updatedSettings?: SecuritySettings }> {
  const stored = getSecuritySettings();
  const current: SecuritySettings = { ...DEFAULT_SECURITY_SETTINGS, ...settings, ...stored };
  const cleanCode = recoveryCode.trim().replace(/\D/g, '');

  if (!cleanCode || cleanCode.length !== 6) {
    return { success: false, error: 'Inserisci il codice di sicurezza completo a 6 cifre.' };
  }

  let codeMatches = false;

  // 1. Check against active session OTP if available
  try {
    const sessionOtp = sessionStorage.getItem('myfinance_active_recovery_otp');
    const sessionExpires = Number(sessionStorage.getItem('myfinance_active_recovery_expires') || '0');
    if (sessionOtp && cleanCode === sessionOtp) {
      if (sessionExpires && Date.now() > sessionExpires) {
        return { success: false, error: 'Il codice di recupero è scaduto (validità 15 minuti). Richiedine uno nuovo.' };
      }
      codeMatches = true;
    }
  } catch {
    // Ignore sessionStorage read errors
  }

  // 2. Check against hashed OTP in localStorage security settings
  if (!codeMatches && current.recoveryCodeHash && current.recoveryCodeExpires) {
    if (Date.now() > current.recoveryCodeExpires) {
      return { success: false, error: 'Il codice di recupero è scaduto (validità 15 minuti). Richiedine uno nuovo.' };
    }
    const parts = current.recoveryCodeHash.split(':');
    if (parts.length === 2) {
      const [salt, expectedHash] = parts;
      const inputHash = await hashPassword(cleanCode, salt);
      if (inputHash === expectedHash) {
        codeMatches = true;
      }
    }
  }

  if (!codeMatches) {
    return { success: false, error: 'Codice OTP non corretto o scaduto. Verifica le 6 cifre generate e riprova.' };
  }

  if (!newPassword || newPassword.trim().length < 4) {
    return { success: false, error: 'La nuova password deve contenere almeno 4 caratteri o cifre.' };
  }

  // Clear session OTP after use
  try {
    sessionStorage.removeItem('myfinance_active_recovery_otp');
    sessionStorage.removeItem('myfinance_active_recovery_expires');
  } catch {
    // Ignore sessionStorage errors
  }

  // Create new password hash
  const newSalt = generateSalt();
  const newHash = await hashPassword(newPassword.trim(), newSalt);

  const updated: SecuritySettings = {
    ...current,
    enabled: true,
    passwordHash: newHash,
    salt: newSalt,
    recoveryCodeHash: undefined,
    recoveryCodeExpires: undefined,
    lastUnlockedTimestamp: Date.now(),
  };

  saveSecuritySettings(updated);
  return { success: true, updatedSettings: updated };
}

/**
 * Helper to check if app should be locked based on elapsed time
 */
export function shouldAppBeLocked(settings: SecuritySettings): boolean {
  if (!settings.enabled || !settings.passwordHash) {
    return false;
  }
  if (settings.autoLockMinutes === 0) {
    return true;
  }
  if (!settings.lastUnlockedTimestamp) {
    return true;
  }
  const now = Date.now();
  const elapsedMinutes = (now - settings.lastUnlockedTimestamp) / (1000 * 60);
  return elapsedMinutes >= settings.autoLockMinutes;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check whether the current device & context support platform biometrics (Fingerprint / Face ID / Windows Hello)
 */
export async function checkBiometricSupport(): Promise<{
  available: boolean;
  reason?: 'insecure_context' | 'no_webauthn' | 'no_sensor';
}> {
  if (typeof window === 'undefined') {
    return { available: false, reason: 'no_webauthn' };
  }
  if (!window.isSecureContext) {
    return { available: false, reason: 'insecure_context' };
  }
  if (
    typeof window.PublicKeyCredential !== 'function' ||
    !navigator.credentials ||
    typeof navigator.credentials.create !== 'function'
  ) {
    return { available: false, reason: 'no_webauthn' };
  }

  try {
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const ok = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!ok) {
        return { available: false, reason: 'no_sensor' };
      }
    }
    return { available: true };
  } catch {
    return { available: false, reason: 'no_sensor' };
  }
}

/**
 * Register a local WebAuthn platform biometric credential (Fingerprint / Face ID / Biometrics)
 */
export async function registerFingerprintCredential(
  settings?: SecuritySettings,
  language: 'it' | 'de' | 'en' = 'it'
): Promise<{ success: boolean; credentialId?: string; settings?: SecuritySettings; error?: string }> {
  const isDe = language === 'de';
  const isEn = language === 'en';

  const support = await checkBiometricSupport();
  if (!support.available) {
    if (support.reason === 'insecure_context') {
      return {
        success: false,
        error: isDe
          ? 'Fingerabdruck erfordert HTTPS oder eine installierte App/PWA.'
          : isEn
            ? 'Fingerprint unlock requires HTTPS or an installed App/PWA.'
            : 'Lo sblocco con impronta richiede HTTPS oppure l\'App/PWA installata.',
      };
    }
    return {
      success: false,
      error: isDe
        ? 'Auf diesem Gerät wurde kein biometrischer Sensor erkannt.'
        : isEn
          ? 'No biometric platform authenticator was detected on this device.'
          : 'Nessun sensore biometrico rilevato su questo dispositivo o browser.',
    };
  }

  const stored = getSecuritySettings();
  const current: SecuritySettings = { ...DEFAULT_SECURITY_SETTINGS, ...settings, ...stored };

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const emailSeed = (current.email || current.recoveryEmail || 'myfinance-user').trim();
    const userIdSource = new TextEncoder().encode(emailSeed.slice(0, 64) || 'myfinance-user');
    const userId = userIdSource.length >= 8 ? userIdSource : window.crypto.getRandomValues(new Uint8Array(16));
    const displayName =
      [current.firstName, current.lastName].filter(Boolean).join(' ').trim() ||
      emailSeed ||
      'MyFinance Pro';

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'MyFinance Pro',
        },
        user: {
          id: userId,
          name: emailSeed || 'myfinance-user',
          displayName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;

    if (!credential || !credential.rawId) {
      return {
        success: false,
        error: isDe
          ? 'Biometrische Registrierung abgebrochen.'
          : isEn
            ? 'Biometric registration cancelled.'
            : 'Registrazione biometrica annullata.',
      };
    }

    const credentialId = bufferToBase64Url(credential.rawId);
    const updated: SecuritySettings = {
      ...current,
      useFingerprint: true,
      credentialId,
      enabled: current.passwordHash ? true : current.enabled,
      lastUnlockedTimestamp: Date.now(),
    };
    saveSecuritySettings(updated);
    return { success: true, credentialId, settings: updated };
  } catch (err: unknown) {
    const errName = err instanceof Error ? err.name : '';
    const errMsg = err instanceof Error ? err.message : '';
    console.warn('WebAuthn registerFingerprintCredential error:', errName, errMsg);

    const isIframeBlocked =
      errName === 'SecurityError' ||
      /Permissions-Policy|publickey-credentials|cross-origin|iframe/i.test(errMsg);

    if (isIframeBlocked) {
      return {
        success: false,
        error: isDe
          ? 'In dieser eingebetteten Vorschau blockiert der Browser Biometrie. Öffnen Sie die App im Vollbild-Tab oder als installierte PWA/APK.'
          : isEn
            ? 'Browser blocks WebAuthn inside embedded preview frames. Open the app in its own tab or installed PWA/APK.'
            : 'Il sensore biometrico è bloccato dal browser in anteprima iFrame: apri l\'app in una scheda autonoma o installala come PWA/App Android.',
      };
    }

    if (errName === 'NotAllowedError') {
      return {
        success: false,
        error: isDe
          ? 'Fingerabdruck-Abfrage abgebrochen oder Zeitüberschreitung.'
          : isEn
            ? 'Fingerprint prompt was cancelled or timed out.'
            : 'Verifica dell\'impronta annullata o scaduta. Riprova oppure verifica di aver aperto l\'app fuori dal riquadro iFrame.',
      };
    }

    return {
      success: false,
      error: isDe
        ? 'Fehler beim Aktivieren des Fingerabdrucks.'
        : isEn
          ? 'Could not enable fingerprint unlock on this browser.'
          : 'Impossibile attivare lo sblocco con impronta su questo browser.',
    };
  }
}

/**
 * Verify identity via registered platform biometric authenticator (Fingerprint / Face ID)
 */
export async function authenticateWithFingerprint(
  settings?: SecuritySettings,
  language: 'it' | 'de' | 'en' = 'it'
): Promise<{ success: boolean; error?: string }> {
  const isDe = language === 'de';
  const isEn = language === 'en';
  const stored = getSecuritySettings();
  const current: SecuritySettings = { ...DEFAULT_SECURITY_SETTINGS, ...settings, ...stored };

  if (!current.useFingerprint || !current.credentialId) {
    return {
      success: false,
      error: isDe
        ? 'Fingerabdruck nicht konfiguriert.'
        : isEn
          ? 'Fingerprint is not configured.'
          : 'Impronta digitale non ancora configurata.',
    };
  }

  const support = await checkBiometricSupport();
  if (!support.available) {
    return {
      success: false,
      error: isDe
        ? 'Biometrie ist in dieser Umgebung nicht verfügbar. Bitte Passwort verwenden.'
        : isEn
          ? 'Biometrics unavailable in this environment. Please use your password.'
          : 'Biometria non disponibile in questo contesto. Accedi con la password.',
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const credIdBytes = base64UrlToUint8Array(current.credentialId);
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: credIdBytes as unknown as BufferSource,
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (assertion && assertion.rawId) {
      return { success: true };
    }

    return {
      success: false,
      error: isDe
        ? 'Fingerabdruck nicht bestätigt.'
        : isEn
          ? 'Fingerprint verification cancelled.'
          : 'Verifica dell\'impronta non completata.',
    };
  } catch (err: unknown) {
    const errName = err instanceof Error ? err.name : '';
    const errMsg = err instanceof Error ? err.message : '';
    console.warn('WebAuthn authenticateWithFingerprint error:', errName, errMsg);

    const isIframeBlocked =
      errName === 'SecurityError' ||
      /Permissions-Policy|publickey-credentials|cross-origin|iframe/i.test(errMsg);

    if (isIframeBlocked) {
      return {
        success: false,
        error: isDe
          ? 'Biometrie im Vorschau-Frame blockiert. Verwenden Sie das Passwort oder öffnen Sie die App direkt.'
          : isEn
            ? 'Biometrics blocked inside preview frame. Use password or open the standalone app.'
            : 'Sensore bloccato nel riquadro iFrame: usa la password o apri l\'app in una scheda dedicata.',
      };
    }

    if (errName === 'NotAllowedError') {
      return {
        success: false,
        error: isDe
          ? 'Fingerabdruck nicht erkannt oder abgebrochen.'
          : isEn
            ? 'Fingerprint not recognized or cancelled.'
            : 'Impronta non riconosciuta o annullata. Riprova o inserisci la password.',
      };
    }

    return {
      success: false,
      error: isDe
        ? 'Biometrische Anmeldung fehlgeschlagen. Bitte Passwort eingeben.'
        : isEn
          ? 'Biometric unlock failed. Please enter your password.'
          : 'Errore sensore biometrico. Usa la password di accesso.',
    };
  }
}

/**
 * Disable biometric / fingerprint unlock and remove saved credential ID
 */
export function disableFingerprint(settings?: SecuritySettings): SecuritySettings {
  const stored = getSecuritySettings();
  const current: SecuritySettings = { ...DEFAULT_SECURITY_SETTINGS, ...settings, ...stored };
  const updated: SecuritySettings = {
    ...current,
    useFingerprint: false,
    credentialId: undefined,
  };
  saveSecuritySettings(updated);
  return updated;
}
