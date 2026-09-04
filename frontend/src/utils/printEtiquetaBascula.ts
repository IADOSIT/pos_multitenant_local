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
  const anchoMm = data.label_width_mm || 40;
  const altoMm = data.label_height_mm || 30;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;';
  document.body.appendChild(iframe);

  const esc = (s: string) => String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // El codigo de barras necesita casi todo el ancho para escanear bien; el resto de
  // la etiqueta se acomoda alrededor.
  const barrasAncho = Math.max(20, anchoMm - 6);
  const barrasAlto = Math.max(8, Math.round(altoMm * 0.32));
  const barras = ean13Svg(data.barcode, `${barrasAncho}mm`, `${barrasAlto}mm`);

  const html = `<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: ${anchoMm}mm ${altoMm}mm; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 1.5mm;
    width: ${anchoMm}mm;
    height: ${altoMm}mm;
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
  }
  .nombre {
    font-size: 8pt;
    font-weight: bold;
    line-height: 1.1;
    max-height: 2.4em;
    overflow: hidden;
  }
  .detalle { font-size: 7pt; }
  .total { font-size: 14pt; font-weight: bold; line-height: 1; }
  .codigo { font-size: 6.5pt; letter-spacing: 0.5px; margin-top: 0.5mm; }
  svg { display: block; margin: 0 auto; }
</style>
</head>
<body>
  <div class="nombre">${esc(data.producto_nombre)}</div>
  <div class="detalle">${data.peso_kg.toFixed(3)} kg x $${Number(data.precio_kg).toFixed(2)}/kg</div>
  <div class="total">$${Number(data.precio_total).toFixed(2)}</div>
  <div>
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
