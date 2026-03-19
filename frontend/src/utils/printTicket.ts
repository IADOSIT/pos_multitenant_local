export function printTicket(
  rawText: string,
  paperWidth: number = 80,
  fontFamily: string = 'Consolas',
  fontSize: number = 11,
  logoUrl?: string | null,
  logoPosition: string = 'centro',
  copias: number = 1,
): void {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;';
  document.body.appendChild(iframe);

  const widthMm = paperWidth === 58 ? '58mm' : '80mm';
  const safeFontFamily = fontFamily || 'Consolas';
  const safeFontSize = fontSize || 11;
  const logoAlign = logoPosition === 'izquierda' ? 'left' : 'center';
  const safeText = rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const logoHtml = logoUrl
    ? `<div style="text-align:${logoAlign};margin-bottom:4px;">
        <img src="${logoUrl}" style="max-height:30mm;max-width:100%;object-fit:contain;" />
       </div>`
    : '';

  // Build body: repeat content for each copy
  const copies = Math.max(1, Math.min(copias || 1, 5));
  let bodyContent = '';
  for (let i = 0; i < copies; i++) {
    bodyContent += `${logoHtml}<pre>${safeText}</pre>`;
    if (i < copies - 1) {
      // Thin separator between copies (works on thermal printers)
      bodyContent += '<div style="border-top:1px dashed #999;margin:4mm 0;"></div>';
    }
  }

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
<body>${bodyContent}</body>
</html>`;

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }

  doc.open();
  doc.write(html);
  doc.close();

  // Use a flag to prevent double-print (img.onload + setTimeout fallback both firing)
  let printed = false;
  const doprint = () => {
    if (printed) return;
    printed = true;
    iframe.contentWindow?.print();
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch {}
    }, 2000);
  };

  if (logoUrl) {
    const img = doc.querySelector('img');
    if (img) {
      img.onload = () => setTimeout(doprint, 100);
      img.onerror = () => setTimeout(doprint, 100);
      setTimeout(doprint, 1500); // fallback - the printed flag prevents double-print
    } else {
      setTimeout(doprint, 250);
    }
  } else {
    setTimeout(doprint, 250);
  }
}

export function printComanda(
  pedido: {
    mesa?: string | number;
    folio?: string;
    usuario_nombre?: string;
    items: { cantidad: number; nombre: string; precio?: number; notas?: string }[];
    notas?: string;
    tipo_servicio?: string;
  },
  config: {
    comanda_header?: string;
    comanda_ancho?: number;
    fuente_familia?: string;
    fuente_tamano?: number;
    comanda_mostrar_precio?: boolean;
    comanda_copias?: number;
  },
): void {
  const ancho = config.comanda_ancho || 80;
  const w = ancho === 58 ? 32 : 42;
  const header = (config.comanda_header || 'ORDEN').toUpperCase();

  const center = (s: string) => {
    const pad = Math.max(0, Math.floor((w - s.length) / 2));
    return ' '.repeat(pad) + s;
  };
  const sep = '='.repeat(w);
  const dash = '-'.repeat(w);

  const lines: string[] = [];
  lines.push(sep);
  lines.push(center(header));
  const now = new Date().toLocaleString('es-MX', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: '2-digit',
  });
  lines.push(center(now));
  lines.push(sep);

  if (pedido.mesa) lines.push(`Mesa: ${pedido.mesa}`);
  if (pedido.usuario_nombre) lines.push(`Mesero: ${pedido.usuario_nombre}`);
  if (pedido.tipo_servicio === 'para_llevar') lines.push('*** PARA LLEVAR ***');
  if (pedido.folio) lines.push(`Folio: ${pedido.folio}`);
  lines.push(dash);

  for (const item of pedido.items) {
    const qty = String(item.cantidad).padStart(2);
    const mostrarPrecio = config.comanda_mostrar_precio && item.precio != null;
    const maxNombre = mostrarPrecio ? w - 10 : w - 4;
    const nombre = (item.nombre || '').substring(0, maxNombre);
    if (mostrarPrecio) {
      const precio = `$${((item.precio ?? 0) * item.cantidad).toFixed(0)}`;
      const spaceLen = Math.max(1, w - qty.length - 1 - nombre.length - precio.length);
      lines.push(`${qty} ${nombre}${' '.repeat(spaceLen)}${precio}`);
    } else {
      lines.push(`${qty} ${nombre}`);
    }
    if (item.notas) lines.push(`   > ${item.notas}`);
  }

  lines.push(sep);
  if (pedido.notas) lines.push(`NOTAS: ${pedido.notas}`);

  printTicket(
    lines.join('\n'),
    ancho,
    config.fuente_familia || 'Consolas',
    config.fuente_tamano || 11,
    null,
    'centro',
    config.comanda_copias || 1,
  );
}
