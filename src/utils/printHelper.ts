/**
 * Utility per la stampa sicura e compatibile con iFrame, mobile e browser desktop.
 * Gestisce l'apertura tramite iframe nascosto, popup window e fallback a PDF.
 */

export interface PrintDocumentOptions {
  title: string;
  subtitle?: string;
  contentHtml: string;
  language?: 'it' | 'de' | 'en';
  onFallback?: (reason: string) => void;
}

/**
 * Avvia la stampa di un documento HTML formattato in modo sicuro.
 * Prima tenta un iframe temporaneo nascosto (non disturba la navigazione),
 * poi un popup window con Blob URL, con gestione trasparente degli errori.
 */
export function printHtmlDocument({
  title,
  subtitle,
  contentHtml,
  language = 'it',
  onFallback,
}: PrintDocumentOptions): Promise<{ success: boolean; method: string }> {
  const isDe = language === 'de';
  const isEn = language === 'en';
  const locale = isDe ? 'de-DE' : isEn ? 'en-US' : 'it-IT';
  const dateLabel = isDe ? 'Datum' : isEn ? 'Date' : 'Data';
  const timeLabel = isDe ? 'Uhrzeit' : isEn ? 'Time' : 'Ora';
  const statusLabel = isDe ? 'Status: Lokal konsolidiert' : isEn ? 'Status: Locally consolidated' : 'Stato: Consolidato locale';
  const complianceLabel = isDe
    ? 'Dokument zur persönlichen Verwendung'
    : isEn
    ? 'Document for personal use'
    : 'Documento ad uso personale conforme';

  return new Promise((resolve) => {
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #0f172a;
            margin: 0;
            padding: 15px;
            font-size: 11pt;
            line-height: 1.4;
          }
          .header-banner {
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .brand {
            font-size: 20pt;
            font-weight: 800;
            color: #1e1b4b;
            letter-spacing: -0.5px;
          }
          .brand span {
            color: #4f46e5;
            font-size: 11pt;
            background: #e0e7ff;
            padding: 2px 6px;
            border-radius: 4px;
            margin-left: 6px;
            font-weight: 700;
          }
          .subtitle {
            font-size: 11pt;
            color: #475569;
            margin-top: 3px;
          }
          .meta-info {
            text-align: right;
            font-size: 9pt;
            color: #64748b;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 22px;
          }
          .summary-card {
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            border-radius: 8px;
            padding: 10px 14px;
          }
          .summary-title {
            font-size: 8pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .summary-value {
            font-size: 14pt;
            font-weight: 800;
            color: #0f172a;
          }
          .text-emerald { color: #059669 !important; }
          .text-rose { color: #dc2626 !important; }
          .text-indigo { color: #4f46e5 !important; }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 9.5pt;
          }
          th {
            background-color: #f1f5f9;
            color: #334155;
            text-align: left;
            padding: 8px 10px;
            font-weight: 700;
            border-bottom: 2px solid #cbd5e1;
            font-size: 8.5pt;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          td {
            padding: 7px 10px;
            border-bottom: 1px solid #e2e8f0;
            color: #1e293b;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-bold { font-weight: 700; }
          .badge {
            display: inline-block;
            font-size: 7.5pt;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 4px;
            background: #f1f5f9;
            color: #475569;
          }
          .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 8pt;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header-banner">
          <div>
            <div class="brand">MyFinance <span>PRO</span></div>
            <div class="subtitle">${subtitle || title}</div>
          </div>
          <div class="meta-info">
            <div>${dateLabel}: <strong>${new Date().toLocaleDateString(locale)}</strong></div>
            <div>${timeLabel}: ${new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</div>
            <div>${statusLabel}</div>
          </div>
        </div>

        ${contentHtml}

        <div class="footer">
          <span>© 2026 Federico Pontedoro. All rights reserved. • My Finance Pro · Android Mobile Edition.</span>
          <span>${complianceLabel}</span>
        </div>
      </body>
      </html>
    `;

    // 1. Tenta stampa tramite iframe nascosto (perfetto per sandboxed apps)
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('title', 'Stampa Documento');
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (frameDoc && iframe.contentWindow) {
        frameDoc.open();
        frameDoc.write(fullHtml);
        frameDoc.close();

        // Ritardo per permettere al browser di applicare stili e font
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            resolve({ success: true, method: 'iframe' });
          } catch (printErr) {
            console.warn('Iframe print failed, falling back to popup:', printErr);
            fallbackToPopup(fullHtml, resolve, onFallback);
          } finally {
            // Rimuovi iframe dopo il trigger
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 3000);
          }
        }, 300);
        return;
      }
    } catch (err) {
      console.warn('Iframe creation error:', err);
    }

    // Fallback se iframe non disponibile
    fallbackToPopup(fullHtml, resolve, onFallback);
  });
}

function fallbackToPopup(
  fullHtml: string,
  resolve: (res: { success: boolean; method: string }) => void,
  onFallback?: (reason: string) => void
) {
  try {
    if (triggerDirectWindowPrint()) {
      resolve({ success: true, method: 'window_print' });
      return;
    }

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `myfinance_report_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

    onFallback?.('downloaded_html');
    resolve({ success: true, method: 'download' });
  } catch (err) {
    console.error('Safe print fallback failed:', err);
    onFallback?.('error');
    resolve({ success: false, method: 'error' });
  }
}

/**
 * Tentativo sicuro di triggerare la stampa diretta della finestra corrente,
 * gestendo l'eccezione iFrame se presente.
 */
export function triggerDirectWindowPrint(): boolean {
  try {
    window.focus();
    window.print();
    return true;
  } catch (err) {
    console.warn('Direct window.print() failed or blocked by iframe sandbox:', err);
    return false;
  }
}
