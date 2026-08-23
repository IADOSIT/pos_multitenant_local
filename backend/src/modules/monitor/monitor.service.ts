import { Injectable } from '@nestjs/common';
import {
  SesionPresencia, IdentidadSesion, DispositivoInfo,
  SnapshotPresencia, GrupoTienda, UsuarioEnLinea, DeltaPantalla,
} from './monitor.types';

/** Cuantas rutas recuerda cada sesion, incluyendo la actual. */
const RASTRO_MAX = 5;

// Estado de presencia, EN MEMORIA. No toca MySQL: cambiar de pantalla no debe
// costar una escritura. Al reiniciar el backend se pierde y se repuebla solo
// conforme los clientes reconectan.
//
// Sin dependencias de constructor a proposito: asi se puede instanciar en
// scripts/check-monitor.ts sin levantar Nest.
@Injectable()
export class MonitorService {
  private sesiones = new Map<string, SesionPresencia>();

  alta(
    socketId: string,
    identidad: IdentidadSesion,
    dispositivo: DispositivoInfo,
    rutaInicial: string,
  ): SesionPresencia {
    const ahora = Date.now();
    const sesion: SesionPresencia = {
      socket_id: socketId,
      ...identidad,
      dispositivo,
      pantalla_actual: rutaInicial,
      pantalla_desde: ahora,
      conectado_desde: ahora,
      rastro: [rutaInicial],
    };
    this.sesiones.set(socketId, sesion);
    return sesion;
  }

  baja(socketId: string): SesionPresencia | null {
    const sesion = this.sesiones.get(socketId);
    if (!sesion) return null;
    this.sesiones.delete(socketId);
    return sesion;
  }

  /**
   * Devuelve el delta a difundir, o null si no hay nada que difundir: socket
   * desconocido, o el usuario "navego" a la pantalla en la que ya estaba (pasa
   * al re-renderizar el router). Devolver null evita ruido en el monitor.
   */
  cambiarPantalla(socketId: string, ruta: string): DeltaPantalla | null {
    const sesion = this.sesiones.get(socketId);
    if (!sesion) return null;
    if (sesion.pantalla_actual === ruta) return null;

    sesion.pantalla_actual = ruta;
    sesion.pantalla_desde = Date.now();
    sesion.rastro = [...sesion.rastro, ruta].slice(-RASTRO_MAX);

    return { socket_id: socketId, ruta, desde: sesion.pantalla_desde };
  }

  getSesion(socketId: string): SesionPresencia | undefined {
    return this.sesiones.get(socketId);
  }

  /**
   * Foto completa, agrupada por tienda y dentro de cada tienda por usuario.
   * Las sesiones sin tienda (superadmin, o admin que aun no elige tienda) van
   * en su propio grupo al final: se muestran, pero no cuentan como tienda, o
   * el total del encabezado no cuadraria con la suma de los bloques.
   */
  snapshot(): SnapshotPresencia {
    const porTienda = new Map<number | null, Map<number, UsuarioEnLinea>>();

    for (const sesion of this.sesiones.values()) {
      if (!porTienda.has(sesion.tienda_id)) porTienda.set(sesion.tienda_id, new Map());
      const usuarios = porTienda.get(sesion.tienda_id)!;

      if (!usuarios.has(sesion.usuario_id)) {
        usuarios.set(sesion.usuario_id, {
          usuario_id: sesion.usuario_id,
          nombre: sesion.nombre,
          rol: sesion.rol,
          sesiones: [],
        });
      }
      usuarios.get(sesion.usuario_id)!.sesiones.push(sesion);
    }

    const grupos: GrupoTienda[] = [...porTienda.entries()]
      .map(([tienda_id, usuarios]) => ({
        tienda_id,
        usuarios: [...usuarios.values()].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      }))
      .sort((a, b) => {
        if (a.tienda_id === null) return 1;   // 'sin tienda' siempre al final
        if (b.tienda_id === null) return -1;
        return a.tienda_id - b.tienda_id;
      });

    const usuariosUnicos = new Set([...this.sesiones.values()].map(s => s.usuario_id));

    return {
      grupos,
      total_usuarios: usuariosUnicos.size,
      total_sesiones: this.sesiones.size,
      total_tiendas: grupos.filter(g => g.tienda_id !== null).length,
    };
  }
}
