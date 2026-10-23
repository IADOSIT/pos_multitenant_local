type EstadoTrabajo = 'corriendo' | 'ok' | 'error' | 'desconocido';
export declare class MantenimientoService {
    private readonly log;
    private readonly trabajos;
    private consulta;
    private descargando;
    get installDir(): string;
    get toolsDir(): string;
    get nodeToolsDir(): string;
    get backupsDir(): string;
    get nodeExe(): string;
    esOnPremise(): boolean;
    private exigirOnPremise;
    private leerJson;
    private tamanoCarpeta;
    private versionInstalada;
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
    get candadoPath(): string;
    private procesoVivo;
    private mantenimientoEnCurso;
    private exigirSinMantenimientoEnCurso;
    private tomarCandado;
    private soltarCandado;
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
    private compararVersiones;
    buscarActualizacion(forzar?: boolean): Promise<any>;
    private consultarOrigen;
    private problemaDelAviso;
    actualizar(cuerpo?: {
        paquete?: string;
    }): Promise<{
        trabajo: string;
        paquete: string;
        mensaje: string;
        reinicia: boolean;
    }>;
    private backendDelPaquete;
    private verificarPaquete;
    private verificarLibrerias;
    private limpiarDescargasViejas;
    private descargarPaquete;
}
export {};
