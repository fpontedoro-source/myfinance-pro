import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';

function resolvePort(): number {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const cliPort = Number(process.argv[portArgIdx + 1]);
    if (Number.isFinite(cliPort) && cliPort > 0) return cliPort;
  }
  const envPort = Number(process.env.PORT);
  return Number.isFinite(envPort) && envPort > 0 ? envPort : 3000;
}

const PORT = resolvePort();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.use('/api', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.get('/api/fx/rates', async (_req, res) => {
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
          return res.json({
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
        }
      }
    } catch {
      // Fallback safely to reference defaults when offline
    }
    return res.json({
      base: 'EUR',
      date: new Date().toISOString().slice(0, 10),
      source: 'default',
      rates: { EUR: 1, ...fallbackRates },
    });
  });

  // Android Digital Asset Links (Trusted Web Activity fullscreen verification)
  app.get('/.well-known/assetlinks.json', (_req, res, next) => {
    const publicPath = path.resolve('public', '.well-known', 'assetlinks.json');
    const distPath = path.resolve('dist', '.well-known', 'assetlinks.json');
    const filePath = fs.existsSync(publicPath) ? publicPath : distPath;
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(filePath);
      return;
    }
    next();
  });

  // Public standalone Privacy Policy routes (Google Play Store compliant, bypasses SPA auth gate)
  app.get(['/privacy', '/privacy-policy', '/privacy-policy.html'], (_req, res, next) => {
    const publicPath = path.resolve('public', 'privacy-policy.html');
    const distPath = path.resolve('dist', 'privacy-policy.html');
    const filePath = fs.existsSync(publicPath) ? publicPath : distPath;
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.sendFile(filePath);
      return;
    }
    next();
  });

  // Standalone HTML download endpoints (consistent in dev & prod)
  app.get(['/myfinance_complete.html', '/download-index-html', '/myfinance_standalone.html'], (_req, res, next) => {
    const filePath = fs.existsSync(path.resolve('public', 'myfinance_standalone.html'))
      ? path.resolve('public', 'myfinance_standalone.html')
      : path.resolve('public', 'myfinance_complete.html');
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="myfinance_app.html"');
      res.sendFile(filePath);
      return;
    }
    next();
  });

  if (process.env.NODE_ENV !== 'production') {
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vitePromise = import('vite')
      .then(({ createServer: createViteServer }) =>
        createViteServer({
          server: {
            middlewareMode: true,
            hmr: !disableHmr,
            ws: disableHmr ? (false as const) : undefined,
            watch: disableHmr ? null : {},
          },
          appType: 'spa',
        })
      )
      .catch((err) => {
        console.error('Failed to initialize Vite dev middleware:', err);
        process.exit(1);
      });

    app.use((req, res, next) => {
      vitePromise
        .then((vite) => {
          vite.middlewares(req, res, next);
        })
        .catch(next);
    });
  } else {
    const distDir = path.resolve('dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MyFinance Pro server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
