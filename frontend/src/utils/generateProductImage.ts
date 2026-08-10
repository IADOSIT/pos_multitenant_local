// Genera una imagen de producto gratis, sin API key, vía Pollinations.ai (corre desde el
// navegador, tiempo real). Es el modo por defecto de "Generar con IA" — si la empresa
// configura su propia key de OpenAI en Configuracion > Modulos, se usa esa en su lugar
// (mejor calidad, de paga, ver productosApi.generateImage que llama al backend).
export async function generateProductImageFree(prompt: string): Promise<Blob> {
  const fullPrompt = `${prompt}, fotografia de catalogo de producto, fondo blanco liso, iluminacion de estudio, un solo producto centrado, sin texto`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=768&height=768&nologo=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('No se pudo generar la imagen');
  return await res.blob();
}

export function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
