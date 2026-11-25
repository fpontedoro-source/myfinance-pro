const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function buildStandalone() {
  console.log('[standalone] Starting single-file bundle build...');

  // Ensure dist exists with compiled css
  let cssFiles = [];
  if (fs.existsSync('dist/assets')) {
    cssFiles = fs.readdirSync('dist/assets').filter((f) => f.endsWith('.css'));
  }

  if (cssFiles.length === 0) {
    console.log('[standalone] Compiling Tailwind CSS with npm run build...');
    execSync('npm run build', { stdio: 'inherit' });
    if (fs.existsSync('dist/assets')) {
      cssFiles = fs.readdirSync('dist/assets').filter((f) => f.endsWith('.css'));
    }
  }

  let cssContent = '';
  if (cssFiles.length > 0) {
    const cssPath = path.join('dist/assets', cssFiles[0]);
    cssContent = fs.readFileSync(cssPath, 'utf8');
    console.log('[standalone] Read CSS file:', cssFiles[0], `(${cssContent.length} bytes)`);
  }

  console.log('[standalone] Bundling application with esbuild into IIFE...');
  const result = await esbuild.build({
    entryPoints: ['src/standalone-entry.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    minify: true,
    globalName: 'MyFinanceApp',
    define: {
      'process.env.NODE_ENV': '"production"',
      'import.meta.env': JSON.stringify({ MODE: 'production', PROD: true, DEV: false }),
    },
    loader: {
      '.png': 'dataurl',
      '.svg': 'dataurl',
      '.jpg': 'dataurl',
      '.jpeg': 'dataurl',
      '.ico': 'dataurl',
    },
  });

  const jsContent = result.outputFiles[0].text;
  console.log('[standalone] Bundled JS output size:', jsContent.length, 'bytes');

  // Verify there are no unclosed backticks or corrupt string injections
  // IMPORTANT: We use array join concatenation so NO regex or string .replace($) can ever corrupt the content!
  const htmlParts = [
    `<!doctype html>
<html lang="it" class="dark h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased select-none">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>MyFinance Pro - Android & Web Edition</title>
    <meta name="description" content="App di finanza personale offline e standalone per gestione spese, conti, budget e obiettivi." />
    
    <!-- Open Graph / Social -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="MyFinance Pro" />
    <meta property="og:description" content="App completa di finanza personale mobile e desktop, 100% offline e locale." />

    <!-- Author & Copyright -->
    <meta name="author" content="Federico Pontedoro" />
    <meta name="copyright" content="© 2026 Federico Pontedoro. All rights reserved. My Finance Pro." />

    <meta name="theme-color" content="#020617" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

    <!-- Google Fonts Plus Jakarta Sans -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    <script>
      (function () {
        try {
          var saved = localStorage.getItem('myfinance_theme_v1');
          var isDark = saved !== 'light';
          document.documentElement.classList.toggle('dark', isDark);
          var meta = document.querySelector('meta[name="theme-color"]');
          if (meta) meta.setAttribute('content', isDark ? '#020617' : '#f8fafc');
        } catch (e) {}
      })();
    </script>

    <style>
`,
    cssContent,
    `
      /* Standalone base styling */
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #root {
        min-height: 100%;
      }
    </style>
  </head>
  <body class="h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-indigo-500/30 selection:text-slate-900 dark:selection:text-white">
    <div id="root">
      <div id="app-loader" style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #020617; color: #f8fafc; text-align: center; padding: 20px;">
        <div style="width: 54px; height: 54px; border-radius: 16px; background: linear-gradient(135deg, #4f46e5, #9333ea); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-weight: 900; font-size: 22px; color: white; box-shadow: 0 10px 25px rgba(79, 70, 229, 0.4);">
          MF
        </div>
        <div style="font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; margin-bottom: 6px;">MyFinance Pro</div>
        <div style="font-size: 13px; color: #94a3b8; margin-bottom: 20px;">Avvio dell'applicazione in corso...</div>
        <div style="width: 32px; height: 32px; border: 3px solid rgba(99, 102, 241, 0.2); border-top-color: #6366f1; border-radius: 50%; animation: mf-spin 1s linear infinite;"></div>
        <style>@keyframes mf-spin{to{transform:rotate(360deg)}}</style>
      </div>
    </div>
    <script>
`,
    jsContent,
    `
    </script>
  </body>
</html>`,
  ];

  const fullHtml = htmlParts.join('');

  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const targets = [
    path.join(publicDir, 'myfinance_standalone.html'),
    path.join(publicDir, 'myfinance_complete.html'),
    path.join(publicDir, 'standalone.html'),
    path.join(publicDir, 'myfinance_app.html'),
  ];

  for (const t of targets) {
    fs.writeFileSync(t, fullHtml, 'utf8');
    console.log('[standalone] Written cleanly to:', t, `(${fullHtml.length} bytes)`);
  }

  // Generate ZIP Archive (myfinance_app.zip) with BOTH index.html (required by APK builders) and myfinance_app.html
  console.log('[standalone] Creating ZIP package (myfinance_app.zip)...');
  const JSZip = require('jszip');
  const zip = new JSZip();
  zip.file('index.html', fullHtml);
  zip.file('myfinance_app.html', fullHtml);

  const extraAssets = [
    'privacy-policy.html',
    'pwa-192x192.png',
    'pwa-512x512.png',
    'apple-touch-icon.png',
  ];
  for (const assetName of extraAssets) {
    const assetPath = path.join(publicDir, assetName);
    if (fs.existsSync(assetPath)) {
      zip.file(assetName, fs.readFileSync(assetPath));
    }
  }

  zip.file(
    'ISTRUZIONI_AVVIO.txt',
    `=====================================================
MYFINANCE PRO - APPLICAZIONE AUTONOMA OFFLINE (.HTML)
=====================================================

ISTRUZIONI DI AVVIO (PC / MAC / ANDROID):
1. Estrai i file da questo archivio ZIP.
2. Fai doppio clic su "index.html" o "myfinance_app.html" per avviare l'app
   in qualsiasi browser (Chrome, Edge, Firefox, Safari) al 100% offline.

CONVERSIONE IN APK (ANDROID):
- Se il convertitore HTML -> APK chiede un archivio .ZIP oppure "index.html":
  * Carica direttamente questo file "myfinance_app.zip", OPPURE
  * Estrai lo ZIP in una cartella e seleziona "index.html" (incluso nella root)
    e l'icona "pwa-512x512.png".

=====================================================
ANLEITUNG (DEUTSCH):
1. Entpacken Sie dieses ZIP-Archiv.
2. Öffnen Sie "index.html" oder "myfinance_app.html" im Browser (100% offline).
3. Für HTML-zu-APK-Konverter ist "index.html" direkt im ZIP-Stammverzeichnis enthalten.

=====================================================
INSTRUCTIONS (ENGLISH):
1. Extract this ZIP archive.
2. Open "index.html" or "myfinance_app.html" offline in any web browser.
3. For HTML-to-APK converters, "index.html" and "pwa-512x512.png" are included at root level.
=====================================================
`
  );

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const zipTargets = [
    path.join(publicDir, 'myfinance_app.zip'),
    path.join(publicDir, 'myfinance_standalone.zip'),
  ];
  for (const z of zipTargets) {
    fs.writeFileSync(z, zipBuffer);
    console.log('[standalone] Written ZIP cleanly to:', z, `(${zipBuffer.length} bytes)`);
  }

  const distDir = path.resolve('dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'myfinance_standalone.html'), fullHtml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'myfinance_complete.html'), fullHtml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'myfinance_app.html'), fullHtml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'myfinance_app.zip'), zipBuffer);
    fs.writeFileSync(path.join(distDir, 'myfinance_standalone.zip'), zipBuffer);
    console.log('[standalone] Written HTML and ZIP to dist directory as well.');
  }

  console.log('[standalone] Build finished successfully!');
}

buildStandalone().catch((err) => {
  console.error('[standalone] Build failed:', err);
  process.exit(1);
});
