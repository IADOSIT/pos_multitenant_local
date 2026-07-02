export interface CampoConfig {
    activo: boolean;
    requerido: boolean;
    selforder: boolean;
    ecommerce: boolean;
    label: string;
}
export type CamposFormulario = Record<'nombre' | 'telefono' | 'email' | 'direccion' | 'empresa' | 'notas', CampoConfig>;
export declare function getDefaultCamposFormulario(): CamposFormulario;
export declare function resolveCamposFormulario(configEspecial: any): CamposFormulario;
