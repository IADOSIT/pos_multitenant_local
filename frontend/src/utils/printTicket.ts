export function printTicket(
  rawText: string,
  paperWidth: number = 80,
  fontFamily: string = 'Courier New',
  fontSize: number = 9,
  logoUrl?: string | null,
  logoPosition: string = 'centro',
): void {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;';
  document.body.appendChild(iframe);

  const widthMm = paperWidth === 58 ? '58mm' : '80mm';
  const safeFontFamily = fontFamily || 'Courier New';
  const safeFontSize = fontSize || 9;
  const logoAlign = logoPosition === 'izquierda' ? 'left' : 'center';

  const logoHtml = logoUrl
    ? `<div style="text-align:${logoAlign};margin-bottom:4px;">
        <img src="${logoUrl}" style="max-height:30mm;max-width:100%;object-fit:contain;" />
       </div>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: ${widthMm} auto; margin: 0; }
  body {
    margin: 0;
    padding: 2mm;
    font-family: '${safeFontFamily}', monospace;
    font-size: ${safeFontSize}pt;
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
<body>${logoHtml}<pre>${rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body>
</html>`;

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }

  doc.open();
  doc.write(html);
  doc.close();

  // Si hay logo, esperar a que cargue antes de imprimir
  const doprint = () => {
    iframe.contentWindow?.print();
    setTimeout(() => { document.body.removeChild(iframe); }, 1000);
  };

  if (logoUrl) {
    const img = doc.querySelector('img');
    if (img) {
      img.onload = () => setTimeout(doprint, 100);
      img.onerror = () => setTimeout(doprint, 100);
      setTimeout(doprint, 1500); // fallback si la imagen tarda
    } else {
      setTimeout(doprint, 250);
    }
  } else {
    setTimeout(doprint, 250);
  }
}
