import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import {
  fetchFxRatesPayload,
  processAiChatRequest,
  processReceiptScanRequest,
} from './server/aiService.ts';

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
    const result = await fetchFxRatesPayload();
    return res.status(result.status).json(result.body);
  });

  app.post('/api/ai/chat', async (req, res) => {
    const result = await processAiChatRequest(req.body);
    return res.status(result.status).json(result.body);
  });

  app.post('/api/ai/scan-receipt', async (req, res) => {
    const result = await processReceiptScanRequest(req.body);
    return res.status(result.status).json(result.body);
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
