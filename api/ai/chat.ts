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

interface IncomingMessage {
  role: 'user' | 'assistant';
  text: string;
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

    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      res.status(400).json({ error: getLocalizedError(language, 'bad_request') });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: getLocalizedError(language, 'missing_key') });
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const priorMessages = messages.slice(0, -1).slice(-16);
    const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    for (const msg of priorMessages) {
      const mappedRole: 'user' | 'model' = msg.role === 'assistant' ? 'model' : 'user';
      if (history.length === 0 && mappedRole === 'model') continue;
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
                    type: { type: Type.STRING, description: 'Must be INCOME or EXPENSE.' },
                    amount: { type: Type.NUMBER, description: 'Positive numeric amount.' },
                    description: { type: Type.STRING, description: 'Clean transaction title or merchant.' },
                    category: { type: Type.STRING, description: 'Matching category from availableCategories.' },
                    account: { type: Type.STRING, description: 'Matching account name from accounts list.' },
                    date: { type: Type.STRING, description: 'YYYY-MM-DD date.' },
                    notes: { type: Type.STRING, description: 'Optional extra note.' },
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
          // Return plain text reply if JSON parsing failed
        }

        res.status(200).json({
          reply: reply || getLocalizedError(language, 'server'),
          proposedTransaction,
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

    console.error('[Vercel AI Chat Error]:', errStatus, errMsg);

    if (
      errStatus === 400 ||
      errStatus === 403 ||
      /PERMISSION_DENIED|API_KEY_INVALID|API key not valid/i.test(errMsg)
    ) {
      res.status(errStatus || 403).json({ error: getLocalizedError(language, 'invalid_key') });
      return;
    }
    if (errStatus === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(errMsg)) {
      res.status(429).json({ error: getLocalizedError(language, 'quota') });
      return;
    }
    if (errStatus === 404 || /NOT_FOUND/i.test(errMsg)) {
      res.status(404).json({ error: getLocalizedError(language, 'not_found') });
      return;
    }

    res.status(500).json({ error: getLocalizedError(language, 'server') });
  } catch (fatalErr) {
    console.error('[Vercel AI Chat Fatal]:', fatalErr);
    res.status(500).json({ error: getLocalizedError(language, 'server') });
  }
}
