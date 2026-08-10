export declare class ConfigIaImagenes {
    id: number;
    empresa_id: number;
    tenant_id: number;
    provider: 'pollinations' | 'openai';
    openai_api_key: string | null;
    created_at: Date;
    updated_at: Date;
}
