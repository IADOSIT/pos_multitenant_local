// Quita el fondo de una imagen de producto y la deja sobre fondo blanco solido,
// para que las fotos (de stock, subidas, o por URL) queden con apariencia de catalogo.
// Corre 100% en el navegador (WASM) — sin API externa de pago, sin cambios de backend.
//
// La libreria (@imgly/background-removal) trae consigo un runtime ONNX de ~24MB. Se carga
// por import() dinamico desde un CDN publico en vez de instalarse como dependencia npm:
// si se importa localmente, Vite la empaqueta como asset estatico dentro de dist-prod/dist-vps,
// que este repo commitea a git en cada build (ver CLAUDE.md) — 24MB de binario en cada commit
// de frontend es inaceptable. Cargarla via CDN hace que solo se descargue (en el navegador,
// no en el build) la primera vez que alguien de verdad usa el boton "Quitar fondo".
const CDN_URL = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/dist/index.js';

export async function removeBackgroundToWhite(source: string | File | Blob): Promise<File> {
  const mod: any = await import(/* @vite-ignore */ CDN_URL);
  const cutout: Blob = await mod.removeBackground(source);

  const bitmap = await createImageBitmap(cutout);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), 'image/jpeg', 0.92)
  );
  return new File([blob], 'producto-fondo-blanco.jpg', { type: 'image/jpeg' });
}
