import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

function mountStandaloneApp() {
  let root = document.getElementById('root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'root';
    document.body.prepend(root);
  }

  // Remove loading screen
  const loader = document.getElementById('app-loader');
  if (loader && loader.parentNode) {
    loader.parentNode.removeChild(loader);
  }

  try {
    createRoot(root).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (err) {
    console.error('Errore durante il montaggio di MyFinance Standalone:', err);
    root.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #020617; color: #f8fafc; font-family: system-ui, sans-serif; padding: 24px; text-align: center;">
        <h2 style="font-size: 20px; font-weight: bold; color: #f43f5e; margin-bottom: 8px;">Errore di Avvio</h2>
        <p style="font-size: 13px; color: #94a3b8; max-width: 360px; margin-bottom: 16px;">Non è stato possibile avviare l'applicazione. Ricarica la pagina per riprovare.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer;">Ricarica</button>
      </div>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountStandaloneApp);
} else {
  mountStandaloneApp();
}
