import { SesionPresencia, IdentidadSesion, DispositivoInfo, SnapshotPresencia, DeltaPantalla } from './monitor.types';
export declare class MonitorService {
    private sesiones;
    alta(socketId: string, identidad: IdentidadSesion, dispositivo: DispositivoInfo, rutaInicial: string): SesionPresencia;
    baja(socketId: string): SesionPresencia | null;
    cambiarPantalla(socketId: string, ruta: string): DeltaPantalla | null;
    getSesion(socketId: string): SesionPresencia | undefined;
    snapshot(): SnapshotPresencia;
}
