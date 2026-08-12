// Impresion directa a impresoras termicas ESC/POS via la app RawBT (Android),
// sin PC/driver de por medio — pensado para operar el POS desde tablet/celular.
// RawBT (paquete ru.a402d.rawbtprinter) recibe los bytes ESC/POS crudos, en base64,
// a traves de un Intent de Android y los manda a la impresora que el usuario haya
// configurado dentro de RawBT (WiFi/Bluetooth/USB) — nuestra app no necesita saber
// la IP de la impresora, RawBT ya la tiene guardada en ese dispositivo.
// Formato de intent segun la libreria oficial escpos-php (RawbtPrintConnector):
//   intent:base64,<BASE64>#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;

const ESC = 0x1b;
const GS = 0x1d;

export const RAWBT_PACKAGE = 'ru.a402d.rawbtprinter';

// El texto del ticket ya viene en ASCII puro (ver tickets.service.ts -> this.s()),
// asi que no hace falta tabla de codepage para acentos/enye.
export function buildEscPosBytes(text: string, opts: { copias?: number; cortar?: boolean } = {}): Uint8Array {
  const copias = Math.max(1, Math.min(opts.copias || 1, 5));
  const cortar = opts.cortar !== false;
  const encoder = new TextEncoder();
  const bytes: number[] = [ESC, 0x40]; // init impresora

  for (let i = 0; i < copias; i++) {
    bytes.push(...Array.from(encoder.encode(text)));
    bytes.push(0x0a, 0x0a, 0x0a, 0x0a); // feed antes de cortar
    if (cortar) bytes.push(GS, 0x56, 0x01); // corte parcial de papel
  }

  return new Uint8Array(bytes);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function printViaRawBT(text: string, opts: { copias?: number; cortar?: boolean } = {}): void {
  const bytes = buildEscPosBytes(text, opts);
  const b64 = bytesToBase64(bytes);
  window.location.href = `intent:base64,${b64}#Intent;scheme=rawbt;package=${RAWBT_PACKAGE};end;`;
}
