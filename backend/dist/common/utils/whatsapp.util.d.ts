export interface EnviarWhatsappParams {
    accountSid: string;
    authToken: string;
    from: string;
    to: string;
    mensaje: string;
}
export interface EnviarWhatsappResult {
    success: boolean;
    sid?: string;
    error?: string;
}
export declare function enviarWhatsapp(params: EnviarWhatsappParams): Promise<EnviarWhatsappResult>;
