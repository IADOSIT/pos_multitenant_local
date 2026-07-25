import { Logger } from '@nestjs/common';

const logger = new Logger('WhatsappUtil');

export interface EnviarWhatsappParams {
  accountSid: string;
  authToken: string;
  from: string; // número de Twilio habilitado para WhatsApp, ej. "+14155238886"
  to: string;   // teléfono del cliente, ej. "+525512345678"
  mensaje: string;
}

export interface EnviarWhatsappResult {
  success: boolean;
  sid?: string;
  error?: string;
}

// Twilio requiere el prefijo "whatsapp:" en ambos números
function toWhatsappAddress(numero: string): string {
  const trimmed = (numero || '').trim();
  return trimmed.startsWith('whatsapp:') ? trimmed : `whatsapp:${trimmed}`;
}

// Envía un mensaje de WhatsApp vía Twilio con las credenciales de la empresa (no hay cuenta global).
export async function enviarWhatsapp(params: EnviarWhatsappParams): Promise<EnviarWhatsappResult> {
  const { accountSid, authToken, from, to, mensaje } = params;
  if (!accountSid || !authToken || !from || !to) {
    return { success: false, error: 'Faltan credenciales de Twilio o teléfono del destinatario' };
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);
    const msg = await client.messages.create({
      from: toWhatsappAddress(from),
      to: toWhatsappAddress(to),
      body: mensaje,
    });
    return { success: true, sid: msg.sid };
  } catch (err: any) {
    logger.warn(`Envío WhatsApp fallido a ${to}: ${err.message}`);
    return { success: false, error: err.message };
  }
}
