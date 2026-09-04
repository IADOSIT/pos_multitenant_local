import { ean13Svg } from './ean13';

export interface EtiquetaBascula {
  producto_nombre: string;
  peso_kg: number;
  precio_kg: number;
  precio_total: number;
  barcode: string;
  label_width_mm?: number;
  label_height_mm?: number;
}

// Etiqueta del kiosko impresa por el propio navegador (impresora predeterminada de
// Windows), mismo mecanismo que printTicket.ts: iframe oculto + window.print().
// Es la alternativa al modo 'red', donde el bridge local manda ZPL por TCP a la
// etiquetadora — ver bascula-bridge/main.js (construirZpl).
export function printEtiquetaBascula(data: EtiquetaBascula): void {
  // Etiqueta adherible estandar de 50 x 25 mm (2" x 1"), el rollo mas comun para
  // etiquetadoras de sobremesa. Siempre se imprime HORIZONTAL: el codigo EAN-13
  // necesita el lado largo, asi que el lado mayor de lo configurado se usa como
  // ancho aunque en la configuracion se hayan capturado los valores al reves.
  const w = data.label_width_mm || 50;
  const h = data.label_height_mm || 25;
  const anchoMm = Math.max(w, h);
  const altoMm = Math.min(w, h);

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;';
  document.body.appendChild(iframe);

  const esc = (s: string) => String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // El codigo de barras necesita casi todo el ancho para escanear bien; el resto de
  // la etiqueta se acomoda alrededor.
  const barrasAncho = Math.max(20, anchoMm - 5);
  const barrasAlto = Math.min(12, Math.max(6, Math.round(altoMm * 0.3)));
  const barras = ean13Svg(data.barcode, `${barrasAncho}mm`, `${barrasAlto}mm`);
  // La tipografia escala con la etiqueta: en una de 40 mm el importe ya no cabia
  // junto al peso y se salia del papel.
  const k = Math.min(1.2, Math.max(0.72, anchoMm / 50));
  const pt = (base: number) => `${(base * k).toFixed(1)}pt`;

  const html = `<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: ${anchoMm}mm ${altoMm}mm landscape; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 1.2mm 2mm;
    width: ${anchoMm}mm;
    height: ${altoMm}mm;
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
    overflow: hidden;
  }
  .nombre {
    font-size: ${pt(8)};
    font-weight: bold;
    line-height: 1.05;
    max-height: 2.1em;
    overflow: hidden;
  }
  /* Fila horizontal: a la izquierda el peso por precio, a la derecha el importe. */
  .fila {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1.5mm;
  }
  .detalle { font-size: ${pt(7)}; white-space: nowrap; overflow: hidden; }
  .total { font-size: ${pt(13)}; font-weight: bold; line-height: 1; white-space: nowrap; }
  .barras { flex-shrink: 0; margin-top: auto; }
  .codigo { font-size: ${pt(6)}; letter-spacing: 0.4px; line-height: 1.4; }
  svg { display: block; margin: 0 auto; }
</style>
</head>
<body>
  <div class="nombre">${esc(data.producto_nombre)}</div>
  <div class="fila">
    <div class="detalle">${data.peso_kg.toFixed(3)} kg x $${Number(data.precio_kg).toFixed(2)}/kg</div>
    <div class="total">$${Number(data.precio_total).toFixed(2)}</div>
  </div>
  <div class="barras">
    ${barras}
    <div class="codigo">${esc(data.barcode)}</div>
  </div>
</body>
</html>`;

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch {}
    }, 2000);
  }, 250);
}
