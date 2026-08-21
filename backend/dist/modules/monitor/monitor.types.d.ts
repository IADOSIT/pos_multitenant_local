export interface DispositivoInfo {
    navegador: string;
    sistema: string;
    movil: boolean;
}
export interface IdentidadSesion {
    usuario_id: number;
    nombre: string;
    rol: string;
    tenant_id: number;
    empresa_id: number;
    tienda_id: number | null;
}
export interface SesionPresencia {
    socket_id: string;
    usuario_id: number;
    nombre: string;
    rol: string;
    tenant_id: number;
    empresa_id: number;
    tienda_id: number | null;
    dispositivo: DispositivoInfo;
    pantalla_actual: string;
    pantalla_desde: number;
    conectado_desde: number;
    rastro: string[];
}
export interface UsuarioEnLinea {
    usuario_id: number;
    nombre: string;
    rol: string;
    sesiones: SesionPresencia[];
}
export interface GrupoTienda {
    tienda_id: number | null;
    usuarios: UsuarioEnLinea[];
}
export interface SnapshotPresencia {
    grupos: GrupoTienda[];
    total_usuarios: number;
    total_sesiones: number;
    total_tiendas: number;
}
export interface DeltaPantalla {
    socket_id: string;
    ruta: string;
    desde: number;
}
