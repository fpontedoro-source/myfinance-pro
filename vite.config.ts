import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [],
        manifest: {
          id: '/',
          name: 'MyFinance Pro - Android Edition',
          short_name: 'MyFinance',
          description: 'App di finanza personale mobile con tracciamento spese, gestione conti, budget e supporto offline completo.',
          lang: 'it-IT',
          dir: 'ltr',
          theme_color: '#020617',
          background_color: '#020617',
          display: 'standalone',
          display_override: ['standalone', 'fullscreen', 'window-controls-overlay'],
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          prefer_related_applications: false,
          categories: ['finance', 'productivity', 'utilities'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Nuova Spesa',
              short_name: 'Spesa',
              description: 'Registra velocemente una nuova spesa',
              url: '/?action=new-expense',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Giroconto Rapido',
              short_name: 'Giroconto',
              description: 'Trasferisci denaro tra i tuoi conti',
              url: '/?action=transfer',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
          screenshots: [
            {
              src: '/screenshots/01-home.jpg',
              sizes: '1080x2034',
              type: 'image/jpeg',
              form_factor: 'narrow',
              label: 'Home: Patrimonio Totale, Liquidita Reale e Conti',
            },
            {
              src: '/screenshots/02-movimenti.jpg',
              sizes: '1080x2041',
              type: 'image/jpeg',
              form_factor: 'narrow',
              label: 'Movimenti: Filtri per Data, Conto, Categoria e Tag',
            },
            {
              src: '/screenshots/03-budget.jpg',
              sizes: '1080x2055',
              type: 'image/jpeg',
              form_factor: 'narrow',
              label: 'Budget Mensili e Obiettivi di Risparmio',
            },
            {
              src: '/screenshots/04-analisi-andamento.jpg',
              sizes: '1080x2012',
              type: 'image/jpeg',
              form_factor: 'narrow',
              label: 'Analisi e Andamento Saldo nel Tempo',
            },
            {
              src: '/screenshots/05-analisi-categorie.jpg',
              sizes: '1080x2113',
              type: 'image/jpeg',
              form_factor: 'narrow',
              label: 'Grafico Spese per Categoria',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,jpg,jpeg,webmanifest,json}'],
          globIgnores: [
            '**/sw.js',
            '**/workbox-*.js',
            '**/myfinance_*.html',
            '**/standalone.html',
            '**/assets/aistudio/**',
            '**/screenshots/**',
            '**/google-play-banner-*.png',
            '**/.well-known/**',
          ],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api/, /^\/privacy/, /^\/\.well-known/],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
            {
              urlPattern: /\.(?:js|css)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-resources',
                expiration: {
                  maxEntries: 40,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
              },
            },
            {
              urlPattern: /^.*(?:\/@vite\/|\/@fs\/|\/src\/|\/node_modules\/|\.tsx|\.ts).*$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'vite-dev-cache',
                expiration: {
                  maxEntries: 300,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
      {
        name: 'dev-sw-server',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/sw.js' || req.url === '/service-worker.js') {
              res.setHeader('Content-Type', 'application/javascript');
              res.setHeader('Service-Worker-Allowed', '/');
            } else if (req.url && req.url.startsWith('/workbox-') && req.url.endsWith('.js')) {
              res.setHeader('Content-Type', 'application/javascript');
            } else if (req.url === '/myfinance_complete.html' || req.url === '/download-index-html' || req.url === '/myfinance_standalone.html') {
              const filePath = fs.existsSync(path.resolve('public', 'myfinance_standalone.html'))
                ? path.resolve('public', 'myfinance_standalone.html')
                : path.resolve('public', 'myfinance_complete.html');
              if (fs.existsSync(filePath)) {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader('Content-Disposition', 'attachment; filename="myfinance_app.html"');
                res.end(fs.readFileSync(filePath));
                return;
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      ws: process.env.DISABLE_HMR === 'true' ? (false as const) : undefined,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

