import { MantenimientoService } from './mantenimiento.service';
export declare class MantenimientoController {
    private svc;
    constructor(svc: MantenimientoService);
    estado(): any;
    respaldos(): {
        respaldos: {
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
    };
    trabajo(id: string): {
        id: string;
        tipo: string;
        estado: "error" | "ok" | "corriendo" | "desconocido";
        codigo: number | null;
        desprendido: boolean;
        segundos: number;
        log: string;
        error: string | null;
    };
    respaldar(body: {
        etiqueta?: string;
        sin_excel?: boolean;
        sin_imagenes?: boolean;
    }): {
        trabajo: string;
        mensaje: string;
    };
    excel(): {
        trabajo: string;
        carpeta: string;
        mensaje: string;
    };
    imagenes(body: {
        arreglar?: boolean;
    }): {
        trabajo: string;
        carpeta: string;
        mensaje: string;
    };
    ajustes(): {
        trabajo: string;
        carpeta: string;
        mensaje: string;
    };
    revertir(body: {
        respaldo: string;
    }): {
        trabajo: string;
        respaldo: string;
        mensaje: string;
    };
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
    actualizar(body: {
        paquete?: string;
    }): Promise<{
        trabajo: string;
        paquete: string;
        mensaje: string;
        reinicia: boolean;
    }>;
}
