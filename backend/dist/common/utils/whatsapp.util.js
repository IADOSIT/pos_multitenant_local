"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviarWhatsapp = enviarWhatsapp;
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('WhatsappUtil');
function toWhatsappAddress(numero) {
    const trimmed = (numero || '').trim();
    return trimmed.startsWith('whatsapp:') ? trimmed : `whatsapp:${trimmed}`;
}
async function enviarWhatsapp(params) {
    const { accountSid, authToken, from, to, mensaje } = params;
    if (!accountSid || !authToken || !from || !to) {
        return { success: false, error: 'Faltan credenciales de Twilio o teléfono del destinatario' };
    }
    try {
        const twilio = require('twilio');
        const client = twilio(accountSid, authToken);
        const msg = await client.messages.create({
            from: toWhatsappAddress(from),
            to: toWhatsappAddress(to),
            body: mensaje,
        });
        return { success: true, sid: msg.sid };
    }
    catch (err) {
        logger.warn(`Envío WhatsApp fallido a ${to}: ${err.message}`);
        return { success: false, error: err.message };
    }
}
//# sourceMappingURL=whatsapp.util.js.map