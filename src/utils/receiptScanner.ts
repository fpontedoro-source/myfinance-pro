import { Account, ProposedTransactionAction } from '../types/finance';
import { getCurrencyCode } from './formatters';
import { Language } from './translations';

const REMOTE_SERVER_URL_KEY = 'myfinance_ai_server_url_v1';

export interface ReceiptScanResult {
  reply: string;
  proposedTransaction: ProposedTransactionAction;
  merchant?: string;
  previewDataUrl?: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

async function compressImageToJpegBase64(
  file: File,
  maxDimension = 1400,
  quality = 0.85
): Promise<{ base64: string; mimeType: string; previewDataUrl: string }> {
  const rawDataUrl = await fileToDataUrl(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const base64Only = rawDataUrl.split(',')[1] || '';
          resolve({ base64: base64Only, mimeType: file.type || 'image/jpeg', previewDataUrl: rawDataUrl });
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Only = jpegDataUrl.split(',')[1] || '';
        resolve({ base64: base64Only, mimeType: 'image/jpeg', previewDataUrl: jpegDataUrl });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      // Fallback if image decode fails (e.g. HEIC on some browsers)
      const base64Only = rawDataUrl.split(',')[1] || '';
      resolve({
        base64: base64Only,
        mimeType: file.type || 'image/jpeg',
        previewDataUrl: rawDataUrl,
      });
    };
    img.src = rawDataUrl;
  });
}

export async function prepareReceiptPayload(file: File): Promise<{
  base64: string;
  mimeType: string;
  previewDataUrl?: string;
}> {
  const mime = (file.type || '').toLowerCase();
  if (mime === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const dataUrl = await fileToDataUrl(file);
    const base64 = dataUrl.split(',')[1] || '';
    return { base64, mimeType: 'application/pdf' };
  }
  return compressImageToJpegBase64(file);
}

function getScanEndpoint(): string | null {
  let remoteUrl = '';
  try {
    remoteUrl = (localStorage.getItem(REMOTE_SERVER_URL_KEY) || '').trim().replace(/\/+$/, '');
  } catch {
    // ignore
  }

  if (remoteUrl) {
    return `${remoteUrl}/api/ai/scan-receipt`;
  }

  if (typeof window !== 'undefined') {
    const proto = window.location.protocol;
    if (proto === 'file:' || proto === 'capacitor:' || proto === 'ionic:' || proto === 'app:') {
      return null;
    }
  }

  return '/api/ai/scan-receipt';
}

export async function scanReceiptWithAi(params: {
  file: File;
  accounts: Account[];
  categories: string[];
  language: Language;
}): Promise<ReceiptScanResult> {
  const { file, accounts, categories, language } = params;
  const isDe = language === 'de';
  const isEn = language === 'en';

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error(
      isDe
        ? 'Keine Internetverbindung: Für den Beleg-Scan (AI Vision) wird eine Online-Verbindung benötigt.'
        : isEn
          ? 'No internet connection: Receipt scanning (AI Vision) requires an online connection.'
          : 'Connessione assente: la scansione scontrini (AI Vision) richiede una connessione internet.'
    );
  }

  const endpoint = getScanEndpoint();
  if (!endpoint) {
    throw new Error(
      isDe
        ? 'In der Offline-APK bitte zuerst unter "AI Chat > Server" die URL deines MyFinance-Servers eintragen.'
        : isEn
          ? 'In the offline APK, configure your MyFinance server URL under "AI Chat > Server" first.'
          : "Nell'APK offline configura prima l'URL del server MyFinance dalla scheda AI Chat (icona Server)."
    );
  }

  const prepared = await prepareReceiptPayload(file);
  if (!prepared.base64) {
    throw new Error(
      isDe
        ? 'Datei konnte nicht gelesen werden.'
        : isEn
          ? 'Could not read the selected file.'
          : 'Impossibile leggere il file selezionato.'
    );
  }

  const todayDate = new Date().toISOString().slice(0, 10);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      imageBase64: prepared.base64,
      mimeType: prepared.mimeType,
      language,
      todayDate,
      accounts: accounts.map((a) => ({
        name: a.name,
        currency: getCurrencyCode(a.currency),
      })),
      availableCategories: categories,
    }),
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok || !data?.proposedTransaction) {
    throw new Error(
      data?.error ||
        (isDe
          ? 'Beleg konnte nicht analysiert werden. Bitte versuche ein schärferes Foto.'
          : isEn
            ? 'Could not analyze the receipt. Please try a clearer photo.'
            : 'Impossibile analizzare lo scontrino. Prova con una foto più nitida.')
    );
  }

  return {
    reply: String(data.reply || ''),
    proposedTransaction: data.proposedTransaction,
    merchant: data.merchant,
    previewDataUrl: prepared.previewDataUrl,
  };
}
