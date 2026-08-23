// Tipos del monitor de presencia. Nada aqui se persiste: viven solo en memoria
// mientras el backend esta arriba.

export interface DispositivoInfo {
  navegador: string;
  sistema: string;
  movil: boolean;
}

/** Identidad que sale del JWT verificado. El cliente no puede falsearla. */
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
  /** Ruta cruda, p.ej. '/admin/configuracion'. La etiqueta legible la resuelve el frontend. */
  pantalla_actual: string;
  pantalla_desde: number;
  conectado_desde: number;
  /** Ultimas RASTRO_MAX rutas INCLUYENDO la actual, la mas reciente al final. */
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
  /** Solo tiendas reales: el grupo 'sin tienda' no cuenta. */
  total_tiendas: number;
}

export interface DeltaPantalla {
  socket_id: string;
  ruta: string;
  desde: number;
}
