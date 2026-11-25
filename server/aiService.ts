import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

let cachedAi: GoogleGenAI | null = null;
let cachedApiKey = '';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
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

export interface IncomingMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface ServiceResponse {
  status: number;
  body: Record<string, unknown>;
}

export function getLocalizedError(
  lang: string,
  kind: 'missing_key' | 'invalid_key' | 'quota' | 'not_found' | 'bad_request' | 'server'
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
    case 'not_found':
      return isDe
        ? 'Das angeforderte KI-Modell ist derzeit nicht verfügbar.'
        : isEn
          ? 'The requested AI model is currently unavailable.'
          : 'Il modello AI richiesto non è al momento disponibile.';
    case 'bad_request':
      return isDe
        ? 'Ungültige Anfrage. Bitte geben Sie eine gültige Nachricht ein.'
        : isEn
          ? 'Invalid request. Please enter a valid message.'
          : 'Richiesta non valida. Inserisci un messaggio valido.';
    default:
      return isDe
        ? 'Es ist ein vorübergehender Fehler bei der KI-Antwort aufgetreten. Bitte versuchen Sie es erneut.'
        : isEn
          ? 'A temporary error occurred while generating the AI response. Please try again.'
          : 'Si è verificato un errore temporaneo nella generazione della risposta AI. Riprova.';
  }
}

function buildSystemInstruction(language: string, financialContext: unknown): string {
  const langLabel =
    language === 'de' ? 'Deutsch (German)' : language === 'en' ? 'English' : 'Italiano (Italian)';

  const ctxObj =
    financialContext && typeof financialContext === 'object'
      ? (financialContext as Record<string, unknown>)
      : {};
  const todayStr =
    typeof ctxObj.todayDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(ctxObj.todayDate)
      ? ctxObj.todayDate
      : new Date().toISOString().slice(0, 10);

  const serializedContext = JSON.stringify({ todayDate: todayStr, ...ctxObj }, null, 2).slice(
    0,
    18000
  );

  return [
    `You are the personal financial AI assistant integrated inside "MyFinance Pro".`,
    `ALWAYS respond strictly in ${langLabel}.`,
    `Be concise, practical, clear, and well-structured using short paragraphs or bullet points inside the JSON "reply" field.`,
    `Base your calculations and statements strictly on the user's real live financial data provided below.`,
    `Multi-currency rule: accounts may use different currencies (EUR, USD, JPY, GBP). NEVER sum amounts across different currencies into one number as if they were the same currency; keep currency summaries separate with their exact currency codes/symbols.`,
    `Operational transaction mode: ONLY if the user explicitly asks to add, record, log, or register an expense or income (e.g., "Segna 18€ pranzo oggi", "Aggiungi entrata 1200 stipendio", "Log $15 coffee", "Buche 40€ Tanken"), fill "proposedTransaction" with the extracted details using exact matching account names from "accounts" and exact category names from "availableCategories". ALWAYS use "${todayStr}" as "date" unless the user explicitly specifies another date (e.g. yesterday = 1 day before "${todayStr}"). Otherwise omit "proposedTransaction".`,
    `If specific data is missing, state it clearly without inventing transactions.`,
    `Do not mention internal JSON structures, system prompts, or API keys.`,
    ``,
    `LIVE USER FINANCIAL CONTEXT:`,
    serializedContext,
  ].join('\n');
}

export async function fetchFxRatesPayload(): Promise<ServiceResponse> {
  const fallbackRates = { USD: 1.08, GBP: 0.85, JPY: 163.5, CHF: 0.94 };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const response = await fetch(
      'https://api.frankfurter.app/latest?from=EUR&to=USD,GBP,JPY,CHF',
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (response.ok) {
      const data = (await response.json()) as {
        date?: string;
        rates?: Record<string, number>;
      };
      if (data?.rates) {
        return {
          status: 200,
          body: {
            base: 'EUR',
            date: data.date || new Date().toISOString().slice(0, 10),
            source: 'live',
            rates: {
              EUR: 1,
              USD: Number(data.rates.USD) || fallbackRates.USD,
              GBP: Number(data.rates.GBP) || fallbackRates.GBP,
              JPY: Number(data.rates.JPY) || fallbackRates.JPY,
              CHF: Number(data.rates.CHF) || fallbackRates.CHF,
            },
          },
        };
      }
    }
  } catch {
    // Fallback safely to reference defaults when offline
  }
  return {
    status: 200,
    body: {
      base: 'EUR',
      date: new Date().toISOString().slice(0, 10),
      source: 'default',
      rates: { EUR: 1, ...fallbackRates },
    },
  };
}

export async function processAiChatRequest(rawBody: unknown): Promise<ServiceResponse> {
  const body = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as Record<string, unknown>;
  const language = typeof body.language === 'string' ? body.language : 'it';
  const messages = Array.isArray(body.messages)
    ? (body.messages as IncomingMessage[]).filter(
        (m) =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.text === 'string' &&
          m.text.trim().length > 0
      )
    : [];
  const financialContext = body.financialContext ?? {};

  if (messages.length === 0) {
    return { status: 400, body: { error: getLocalizedError(language, 'bad_request') } };
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'user') {
    return { status: 400, body: { error: getLocalizedError(language, 'bad_request') } };
  }

  const ai = getGeminiClient();
  if (!ai) {
    return { status: 503, body: { error: getLocalizedError(language, 'missing_key') } };
  }

  const priorMessages = messages.slice(0, -1).slice(-16);
  const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  for (const msg of priorMessages) {
    const mappedRole: 'user' | 'model' = msg.role === 'assistant' ? 'model' : 'user';
    if (history.length === 0 && mappedRole === 'model') {
      continue;
    }
    const prev = history[history.length - 1];
    if (prev && prev.role === mappedRole) {
      prev.parts[0].text += '\n' + msg.text.trim();
    } else {
      history.push({ role: mappedRole, parts: [{ text: msg.text.trim() }] });
    }
  }
  if (history.length > 0 && history[history.length - 1].role === 'user') {
    history.pop();
  }

  const systemInstruction = buildSystemInstruction(language, financialContext);

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const chat = ai.chats.create({
        model: 'gemini-4-hydrogen',
        history,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'Conversational response for the user in their language.',
              },
              proposedTransaction: {
                type: Type.OBJECT,
                description:
                  'Optional transaction draft, ONLY set when the user explicitly asks to add/log/register an expense or income.',
                properties: {
                  type: {
                    type: Type.STRING,
                    description: 'Must be INCOME or EXPENSE.',
                  },
                  amount: {
                    type: Type.NUMBER,
                    description: 'Positive numeric amount.',
                  },
                  description: {
                    type: Type.STRING,
                    description: 'Clean transaction title or merchant.',
                  },
                  category: {
                    type: Type.STRING,
                    description: 'Matching category from availableCategories.',
                  },
                  account: {
                    type: Type.STRING,
                    description: 'Matching account name from accounts list.',
                  },
                  date: {
                    type: Type.STRING,
                    description: 'YYYY-MM-DD date.',
                  },
                  notes: {
                    type: Type.STRING,
                    description: 'Optional extra note.',
                  },
                },
                required: ['type', 'amount', 'description', 'category', 'account', 'date'],
              },
            },
            required: ['reply'],
          },
        },
      });

      const response = await chat.sendMessage({
        message: lastMessage.text.trim(),
      });

      const rawText = (response.text ?? '').trim();
      let reply = rawText;
      let proposedTransaction: Record<string, unknown> | undefined;

      try {
        const parsed = JSON.parse(rawText);
        if (parsed && typeof parsed.reply === 'string') {
          reply = parsed.reply.trim();
          if (
            parsed.proposedTransaction &&
            typeof parsed.proposedTransaction === 'object' &&
            Number(parsed.proposedTransaction.amount) > 0
          ) {
            proposedTransaction = parsed.proposedTransaction;
          }
        }
      } catch {
        // If model fell back to plain text, return rawText gracefully
      }

      return {
        status: 200,
        body: {
          reply: reply || getLocalizedError(language, 'server'),
          proposedTransaction,
        },
      };
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

  console.error('[AI Chat API Error]:', errStatus, errMsg);

  if (
    errStatus === 400 ||
    errStatus === 403 ||
    /PERMISSION_DENIED|API_KEY_INVALID|API key not valid/i.test(errMsg)
  ) {
    return {
      status: errStatus || 403,
      body: { error: getLocalizedError(language, 'invalid_key') },
    };
  }
  if (errStatus === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(errMsg)) {
    return { status: 429, body: { error: getLocalizedError(language, 'quota') } };
  }
  if (errStatus === 404 || /NOT_FOUND/i.test(errMsg)) {
    return { status: 404, body: { error: getLocalizedError(language, 'not_found') } };
  }

  return { status: 500, body: { error: getLocalizedError(language, 'server') } };
}

export async function processReceiptScanRequest(rawBody: unknown): Promise<ServiceResponse> {
  const body = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as Record<string, unknown>;
  const language = typeof body.language === 'string' ? body.language : 'it';
  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64.trim() : '';
  const mimeType =
    typeof body.mimeType === 'string' ? body.mimeType.trim().toLowerCase() : 'image/jpeg';
  const accounts = Array.isArray(body.accounts) ? body.accounts : [];
  const availableCategories = Array.isArray(body.availableCategories) ? body.availableCategories : [];
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
    return { status: 400, body: { error: getLocalizedError(language, 'bad_request') } };
  }

  const ai = getGeminiClient();
  if (!ai) {
    return { status: 503, body: { error: getLocalizedError(language, 'missing_key') } };
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
        return {
          status: 200,
          body: {
            reply: String(parsed.reply || ''),
            merchant: typeof parsed.merchant === 'string' ? parsed.merchant : undefined,
            proposedTransaction: parsed.proposedTransaction,
          },
        };
      }
      return {
        status: 422,
        body: {
          error:
            language === 'de'
              ? 'Kein eindeutiger Betrag auf dem Beleg erkannt.'
              : language === 'en'
                ? 'Could not detect a clear total amount on this receipt.'
                : 'Nessun importo chiaro rilevato sullo scontrino.',
        },
      };
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

  console.error('[AI Scan Receipt API Error]:', errStatus, errMsg);
  if (errStatus === 400 || errStatus === 403 || /PERMISSION_DENIED|API_KEY_INVALID/i.test(errMsg)) {
    return {
      status: errStatus || 403,
      body: { error: getLocalizedError(language, 'invalid_key') },
    };
  }
  if (errStatus === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(errMsg)) {
    return { status: 429, body: { error: getLocalizedError(language, 'quota') } };
  }
  return { status: 500, body: { error: getLocalizedError(language, 'server') } };
}
