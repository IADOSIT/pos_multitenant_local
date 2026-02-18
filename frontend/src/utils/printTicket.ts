export function printTicket(rawText: string, paperWidth: number = 80): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  document.body.appendChild(iframe);

  const widthMm = paperWidth === 58 ? '58mm' : '80mm';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @page {
          size: ${widthMm} auto;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 2mm;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.3;
          width: ${widthMm};
        }
        pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
          font-family: inherit;
          font-size: inherit;
        }
      </style>
    </head>
    <body>
      <pre>${rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </body>
    </html>
  `;

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
}
