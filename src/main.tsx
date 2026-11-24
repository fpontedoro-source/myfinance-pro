import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { ErrorBoundary } from './components/ErrorBoundary';

// Purge any legacy manual service worker caches to ensure fresh bundles load
if (typeof caches !== 'undefined') {
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      if (key.startsWith('myfinance-pro-v')) {
        caches.delete(key);
      }
    });
  }).catch(() => {});
}

// Auto-recover on stale Vite module preloads across days/deployments
window.addEventListener('vite:preloadError', () => {
  const retryKey = 'vite_preload_retry';
  const lastRetry = sessionStorage.getItem(retryKey);
  if (!lastRetry) {
    sessionStorage.setItem(retryKey, String(Date.now()));
    window.location.reload();
  }
});

// Register Service Worker for offline capability (production builds)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  try {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('Nuova versione disponibile, aggiornamento automatico...');
      },
      onRegistered(r) {
        if (r) {
          console.log('PWA Service Worker registrato tramite virtual:pwa-register:', r.scope);
        }
      },
      onRegisterError(error) {
        console.warn('virtual:pwa-register non attivo, tentativo fallback nativo:', error);
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((reg) => console.log('Service Worker registrato con fallback nativo:', reg.scope))
          .catch((err) => console.warn('Fallback Service Worker non riuscito:', err));
      },
    });
  } catch {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => console.log('Service Worker registrato (catch fallback):', reg.scope))
      .catch((err) => console.warn('Registrazione SW non riuscita:', err));
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
