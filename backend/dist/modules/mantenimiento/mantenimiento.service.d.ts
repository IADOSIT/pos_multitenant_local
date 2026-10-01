type EstadoTrabajo = 'corriendo' | 'ok' | 'error' | 'desconocido';
export declare class MantenimientoService {
    private readonly log;
    private readonly trabajos;
    get installDir(): string;
    get toolsDir(): string;
    get nodeToolsDir(): string;
    get backupsDir(): string;
    get nodeExe(): string;
    esOnPremise(): boolean;
    private exigirOnPremise;
    private leerJson;
    private tamanoCarpeta;
    estado(): any;
    private ultimaActualizacion;
    private configuracionActualizacion;
    listarRespaldos(): {
        nombre: string;
        ruta: string;
        fecha: number;
        bytes: number;
        completo: boolean;
        version: any;
        etiqueta: any;
        tablas: any;
        imagenes: any;
        tiene_excel: boolean;
        revertir_con: any;
    }[];
    private nuevoTrabajo;
    private lanzar;
    private psArgs;
    trabajo(id: string): {
        id: string;
        tipo: string;
        estado: EstadoTrabajo;
        codigo: number | null;
        desprendido: boolean;
        segundos: number;
        log: string;
        error: string | null;
    };
    respaldar(etiqueta?: string, opciones?: {
        sinExcel?: boolean;
        sinImagenes?: boolean;
    }): {
        trabajo: string;
        mensaje: string;
    };
    private limpiarEtiqueta;
    exportarExcel(): {
        trabajo: string;
        carpeta: string;
        mensaje: string;
    };
    imagenes(arreglar: boolean): {
        trabajo: string;
        carpeta: string;
        mensaje: string;
    };
    ajustes(): {
        trabajo: string;
        carpeta: string;
        mensaje: string;
    };
    private sello;
    revertir(nombreRespaldo: string): {
        trabajo: string;
        respaldo: string;
        mensaje: string;
    };
    private resolverRespaldo;
    buscarActualizacion(): Promise<{
        automatica_disponible: boolean;
        origen: string | null;
        nota: string;
        disponible: boolean;
        version_actual: any;
    } | {
        automatica_disponible: boolean;
        origen: string | null;
        nota: string;
        disponible: boolean;
        version_actual: any;
        version_nueva: string | null;
        notas: any;
        url_paquete: any;
    } | {
        automatica_disponible: boolean;
        origen: string | null;
        nota: string;
        disponible: boolean;
        version_actual: any;
        error: string;
    }>;
    actualizar(cuerpo?: {
        paquete?: string;
    }): Promise<{
        trabajo: string;
        paquete: string;
        mensaje: string;
        reinicia: boolean;
    }>;
    private descargarPaquete;
}
export {};
