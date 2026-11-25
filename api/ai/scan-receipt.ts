import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

interface VercelRequestLike {
  method?: string;
  body?: unknown;
}

interface VercelResponseLike {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => VercelResponseLike;
  json: (data: unknown) => void;
  end: () => void;
}

let cachedAi: GoogleGenAI | null = null;
let cachedApiKey = '';

function readGeminiApiKey(): string {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return (proc?.env?.GEMINI_API_KEY || '').trim();
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = readGeminiApiKey();
  if (!apiKey) return null;
  if (!cachedAi || cachedApiKey !== apiKey) {
    cachedAi = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    cachedApiKey = apiKey;
  }
  return cachedAi;
}

function getLocalizedError(
  lang: string,
  kind: 'missing_key' | 'invalid_key' | 'quota' | 'bad_request' | 'server'
): string {
  const isDe = lang === 'de';
  const isEn = lang === 'en';

  switch (kind) {
    case 'missing_key':
      return isDe
        ? 'API-Schlüssel nicht konfiguriert. Bitte überprüfen Sie Ihren Schlüssel im Bereich Settings > Secrets.'
        : isEn
          ? 'API key not configured. Please check your key in the Settings > Secrets panel.'
          : 'Chiave API non configurata. Controlla la chiave nel pannello Settings > Secrets.';
    case 'invalid_key':
      return isDe
        ? 'Zugriff vom KI-Dienst verweigert (API-Schlüssel ungültig oder fehlt). Bitte im Bereich Settings > Secrets prüfen.'
        : isEn
          ? 'Permission denied or invalid API key. Please check your API key in Settings > Secrets.'
          : 'Accesso negato o chiave API non valida. Controlla la chiave nel pannello Settings > Secrets.';
    case 'quota':
      return isDe
        ? 'Anfragelimit erreicht. Bitte warten Sie einen Moment oder prüfen Sie Ihr Kontingent im Bereich Settings > Secrets.'
        : isEn
          ? 'Rate limit or quota reached. Please wait a moment or check your quota in Settings > Secrets.'
          : 'Limite di richieste raggiunto. Attendi qualche istante o verifica la quota nel pannello Settings > Secrets.';
    case 'bad_request':
      return isDe
        ? 'Ungültige Anfrage. Bitte senden Sie ein gültiges Bild oder PDF.'
        : isEn
          ? 'Invalid request. Please upload a valid image or PDF.'
          : 'Richiesta non valida. Carica un immagine o PDF valido.';
    default:
      return isDe
        ? 'Es ist ein vorübergehender Fehler bei der KI-Antwort aufgetreten. Bitte versuchen Sie es erneut.'
        : isEn
          ? 'A temporary error occurred while generating the AI response. Please try again.'
          : 'Si è verificato un errore temporaneo nella generazione della risposta AI. Riprova.';
  }
}

export default async function handler(req: VercelRequestLike, res: VercelResponseLike) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let language = 'it';
  try {
    let parsedBody = req.body;
    if (typeof parsedBody === 'string') {
      try {
        parsedBody = JSON.parse(parsedBody);
      } catch {
        parsedBody = {};
      }
    }

    const body = (
      parsedBody && typeof parsedBody === 'object' ? parsedBody : {}
    ) as Record<string, unknown>;
    language = typeof body.language === 'string' ? body.language : 'it';
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64.trim() : '';
    const mimeType =
      typeof body.mimeType === 'string' ? body.mimeType.trim().toLowerCase() : 'image/jpeg';
    const accounts = Array.isArray(body.accounts) ? body.accounts : [];
    const availableCategories = Array.isArray(body.availableCategories)
      ? body.availableCategories
      : [];
    const todayDate =
      typeof body.todayDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.todayDate)
        ? body.todayDate
        : new Date().toISOString().slice(0, 10);

    const allowedMimeTypes = new Set([
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'application/pdf',
    ]);

    if (!imageBase64 || imageBase64.length < 40 || !allowedMimeTypes.has(mimeType)) {
      res.status(400).json({ error: getLocalizedError(language, 'bad_request') });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: getLocalizedError(language, 'missing_key') });
      return;
    }

    const langLabel =
      language === 'de' ? 'Deutsch (German)' : language === 'en' ? 'English' : 'Italiano (Italian)';
    const normalizedMime = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;

    const systemInstruction = [
      `You are the receipt and invoice OCR extraction assistant for "MyFinance Pro".`,
      `ALWAYS write the "reply" field in ${langLabel}.`,
      `Extract the merchant name, final total amount paid (prefer TOTAL / TOTALE / SUMME / AMOUNT DUE over subtotals), transaction type (EXPENSE for purchases/bills, INCOME only if clearly a refund or credit note / salary slip), transaction date in YYYY-MM-DD (default "${todayDate}" if unreadable), best matching category strictly from availableCategories: ${JSON.stringify(availableCategories)}, and default account name strictly from accounts: ${JSON.stringify(accounts)}.`,
      `Keep "notes" concise with key receipt details (e.g., detected currency if different, top items, or invoice/receipt #).`,
    ].join('\n');

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: normalizedMime,
                  data: imageBase64,
                },
              },
              {
                text: `Analyze this receipt or invoice image/PDF and extract the transaction fields as JSON. Today is ${todayDate}.`,
              },
            ],
          },
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description:
                    'Short, friendly confirmation summary of what was read from the receipt in the user language.',
                },
                merchant: {
                  type: Type.STRING,
                  description: 'Detected store or merchant name.',
                },
                proposedTransaction: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: 'EXPENSE or INCOME' },
                    amount: { type: Type.NUMBER, description: 'Total numeric amount (> 0)' },
                    description: { type: Type.STRING, description: 'Clean description / merchant name' },
                    category: {
                      type: Type.STRING,
                      description: 'Best matching category from availableCategories',
                    },
                    account: {
                      type: Type.STRING,
                      description: 'Matching account name from accounts',
                    },
                    date: { type: Type.STRING, description: 'YYYY-MM-DD' },
                    notes: { type: Type.STRING, description: 'Concise item summary or receipt number' },
                  },
                  required: ['type', 'amount', 'description', 'category', 'account', 'date'],
                },
              },
              required: ['reply', 'proposedTransaction'],
            },
          },
        });

        const parsed = JSON.parse((response.text ?? '{}').trim());
        if (parsed && parsed.proposedTransaction && Number(parsed.proposedTransaction.amount) > 0) {
          res.status(200).json({
            reply: String(parsed.reply || ''),
            merchant: typeof parsed.merchant === 'string' ? parsed.merchant : undefined,
            proposedTransaction: parsed.proposedTransaction,
          });
          return;
        }
        res.status(422).json({
          error:
            language === 'de'
              ? 'Kein eindeutiger Betrag auf dem Beleg erkannt.'
              : language === 'en'
                ? 'Could not detect a clear total amount on this receipt.'
                : 'Nessun importo chiaro rilevato sullo scontrino.',
        });
        return;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const status =
          typeof err === 'object' && err !== null && 'status' in err
            ? Number((err as { status?: number }).status)
            : 0;
        const isRetryable = status >= 500 || /timeout|network|ECONNRESET|temporarily/i.test(msg);
        if (isRetryable && attempt < 2) {
          await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
          continue;
        }
        break;
      }
    }

    const errMsg = lastError instanceof Error ? lastError.message : String(lastError || '');
    const errStatus =
      typeof lastError === 'object' && lastError !== null && 'status' in lastError
        ? Number((lastError as { status?: number }).status)
        : 0;

    console.error('[Vercel AI Scan Receipt Error]:', errStatus, errMsg);
    if (errStatus === 400 || errStatus === 403 || /PERMISSION_DENIED|API_KEY_INVALID/i.test(errMsg)) {
      res.status(errStatus || 403).json({ error: getLocalizedError(language, 'invalid_key') });
      return;
    }
    if (errStatus === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(errMsg)) {
      res.status(429).json({ error: getLocalizedError(language, 'quota') });
      return;
    }
    res.status(500).json({ error: getLocalizedError(language, 'server') });
  } catch (fatalErr) {
    console.error('[Vercel AI Scan Receipt Fatal]:', fatalErr);
    res.status(500).json({ error: getLocalizedError(language, 'server') });
  }
}
