interface VercelRequestLike {
  method?: string;
}

interface VercelResponseLike {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => VercelResponseLike;
  json: (data: unknown) => void;
  end: () => void;
}

export default async function handler(req: VercelRequestLike, res: VercelResponseLike) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

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
        res.status(200).json({
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
        });
        return;
      }
    }
  } catch {
    // Fallback safely to reference defaults when offline
  }

  res.status(200).json({
    base: 'EUR',
    date: new Date().toISOString().slice(0, 10),
    source: 'default',
    rates: { EUR: 1, ...fallbackRates },
  });
}
