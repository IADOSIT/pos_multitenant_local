"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MantenimientoService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
let MantenimientoService = class MantenimientoService {
    constructor() {
        this.log = new common_1.Logger('Mantenimiento');
        this.trabajos = new Map();
    }
    get installDir() {
        return path.resolve(process.cwd(), '..');
    }
    get toolsDir() {
        return path.join(this.installDir, 'tools');
    }
    get nodeToolsDir() {
        return path.join(this.toolsDir, 'node');
    }
    get backupsDir() {
        return path.join(this.installDir, 'backups');
    }
    get nodeExe() {
        const propio = path.join(this.installDir, 'node', 'node.exe');
        return fs.existsSync(propio) ? propio : process.execPath;
    }
    esOnPremise() {
        if (process.platform !== 'win32')
            return false;
        if ((process.env.INSTALL_MODE || '').toLowerCase() !== 'local')
            return false;
        return fs.existsSync(path.join(this.toolsDir, 'respaldar.ps1'));
    }
    exigirOnPremise() {
        if (!this.esOnPremise()) {
            throw new common_1.NotFoundException('El mantenimiento local solo esta disponible en una instalacion en sitio.');
        }
    }
    leerJson(ruta) {
        try {
            let texto = fs.readFileSync(ruta, 'utf8');
            if (texto.charCodeAt(0) === 0xfeff)
                texto = texto.slice(1);
            return JSON.parse(texto);
        }
        catch {
            return null;
        }
    }
    tamanoCarpeta(dir) {
        let archivos = 0;
        let bytes = 0;
        const recorrer = (d, prof) => {
            if (prof > 12)
                return;
            let entradas;
            try {
                entradas = fs.readdirSync(d, { withFileTypes: true });
            }
            catch {
                return;
            }
            for (const e of entradas) {
                const p = path.join(d, e.name);
                if (e.isDirectory())
                    recorrer(p, prof + 1);
                else {
                    archivos++;
                    try {
                        bytes += fs.statSync(p).size;
                    }
                    catch {
                    }
                }
            }
        };
        if (fs.existsSync(dir))
            recorrer(dir, 0);
        return { archivos, bytes };
    }
    estado() {
        const onPrem = this.esOnPremise();
        const versionJson = this.leerJson(path.join(this.installDir, 'version.json'));
        const base = {
            on_premise: onPrem,
            plataforma: process.platform,
            modo: process.env.INSTALL_MODE || 'nube',
            version: versionJson?.version || process.env.APP_VERSION || 'desconocida',
            version_previa: versionJson?.version_previa || null,
            fecha_version: versionJson?.build_date || null,
        };
        if (!onPrem)
            return base;
        const up = this.tamanoCarpeta(path.join(this.installDir, 'backend', 'uploads'));
        const datos = this.tamanoCarpeta(path.join(this.installDir, 'mariadb', 'data'));
        const respaldos = this.listarRespaldos();
        let libreBytes = null;
        try {
            const sf = fs.statfsSync?.(this.installDir);
            if (sf)
                libreBytes = Number(sf.bavail) * Number(sf.bsize);
        }
        catch {
            libreBytes = null;
        }
        return {
            ...base,
            install_dir: this.installDir,
            imagenes: up,
            base_datos_bytes: datos.bytes,
            disco_libre_bytes: libreBytes,
            respaldos_total: respaldos.length,
            ultimo_respaldo: respaldos[0] || null,
            ultima_actualizacion: this.ultimaActualizacion(),
            actualizacion: this.configuracionActualizacion(),
            herramientas: {
                respaldar: fs.existsSync(path.join(this.toolsDir, 'respaldar.ps1')),
                revertir: fs.existsSync(path.join(this.toolsDir, 'revertir.ps1')),
                actualizar: fs.existsSync(path.join(this.toolsDir, 'actualizar.ps1')),
                imagenes: fs.existsSync(path.join(this.nodeToolsDir, 'imagenes.js')),
                excel: fs.existsSync(path.join(this.nodeToolsDir, 'exportar-excel.js')),
                ajustes: fs.existsSync(path.join(this.nodeToolsDir, 'ajustes.js')),
            },
        };
    }
    ultimaActualizacion() {
        const p = path.join(this.installDir, 'ULTIMA-ACTUALIZACION.txt');
        try {
            return fs.readFileSync(p, 'utf8').slice(0, 8000);
        }
        catch {
            return null;
        }
    }
    configuracionActualizacion() {
        const url = (process.env.UPDATE_FEED_URL || '').trim();
        return {
            automatica_disponible: url !== '',
            origen: url || null,
            nota: url
                ? 'Se puede buscar e instalar la actualizacion desde aqui.'
                : 'Para actualizar, ejecuta el instalador nuevo (.exe) en este equipo: detecta la instalacion, respalda todo y actualiza sin borrar datos.',
        };
    }
    listarRespaldos() {
        if (!fs.existsSync(this.backupsDir))
            return [];
        let entradas;
        try {
            entradas = fs.readdirSync(this.backupsDir, { withFileTypes: true });
        }
        catch {
            return [];
        }
        const lista = entradas
            .filter((e) => e.isDirectory())
            .map((e) => {
            const carpeta = path.join(this.backupsDir, e.name);
            const manifest = this.leerJson(path.join(carpeta, 'manifest.json'));
            let fecha = 0;
            try {
                fecha = fs.statSync(carpeta).mtimeMs;
            }
            catch {
            }
            const resumen = this.tamanoCarpeta(carpeta);
            return {
                nombre: e.name,
                ruta: carpeta,
                fecha,
                bytes: resumen.bytes,
                completo: !!manifest,
                version: manifest?.version || null,
                etiqueta: manifest?.etiqueta || null,
                tablas: manifest?.base_sql?.tablas ?? null,
                imagenes: manifest?.uploads?.archivos ?? null,
                tiene_excel: !!manifest?.excel?.archivo,
                revertir_con: manifest?.revertir_con || null,
            };
        })
            .sort((a, b) => b.fecha - a.fecha);
        return lista;
    }
    nuevoTrabajo(tipo) {
        const id = `${tipo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const dir = path.join(this.installDir, 'logs');
        try {
            fs.mkdirSync(dir, { recursive: true });
        }
        catch {
        }
        const t = {
            id,
            tipo,
            inicio: Date.now(),
            estado: 'corriendo',
            logPath: path.join(dir, `mantenimiento-${id}.log`),
        };
        this.trabajos.set(id, t);
        if (this.trabajos.size > 40) {
            const viejos = [...this.trabajos.values()].sort((a, b) => a.inicio - b.inicio);
            for (const v of viejos.slice(0, 10))
                this.trabajos.delete(v.id);
        }
        return t;
    }
    lanzar(tipo, comando, args, opciones = {}) {
        const t = this.nuevoTrabajo(tipo);
        t.desprendido = !!opciones.desprendido;
        const fd = fs.openSync(t.logPath, 'a');
        fs.writeSync(fd, `=== ${tipo} === ${new Date().toISOString()}\r\n${comando} ${args.join(' ')}\r\n\r\n`);
        const hijo = (0, child_process_1.spawn)(comando, args, {
            cwd: this.installDir,
            windowsHide: true,
            detached: !!opciones.desprendido,
            stdio: ['ignore', fd, fd],
        });
        if (opciones.desprendido) {
            hijo.unref();
            t.estado = 'desconocido';
            this.log.warn(`${tipo}: lanzado desprendido, este servicio se va a reiniciar`);
            try {
                fs.closeSync(fd);
            }
            catch {
            }
            return t;
        }
        hijo.on('close', (codigo) => {
            t.fin = Date.now();
            t.codigo = codigo ?? -1;
            t.estado = codigo === 0 || codigo === 3 ? 'ok' : 'error';
            try {
                fs.closeSync(fd);
            }
            catch {
            }
            this.log.log(`${tipo} termino con codigo ${codigo}`);
        });
        hijo.on('error', (e) => {
            t.fin = Date.now();
            t.estado = 'error';
            t.salida = e.message;
            try {
                fs.closeSync(fd);
            }
            catch {
            }
            this.log.error(`${tipo} no se pudo lanzar: ${e.message}`);
        });
        return t;
    }
    psArgs(script, extra) {
        return [
            '-NoProfile',
            '-NonInteractive',
            '-ExecutionPolicy',
            'Bypass',
            '-File',
            path.join(this.toolsDir, script),
            '-InstallDir',
            this.installDir,
            ...extra,
        ];
    }
    trabajo(id) {
        const t = this.trabajos.get(id);
        if (!t)
            throw new common_1.NotFoundException('No se encontro ese trabajo.');
        let cola = '';
        try {
            const txt = fs.readFileSync(t.logPath, 'utf8');
            cola = txt.length > 20000 ? txt.slice(-20000) : txt;
        }
        catch {
            cola = '';
        }
        return {
            id: t.id,
            tipo: t.tipo,
            estado: t.estado,
            codigo: t.codigo ?? null,
            desprendido: !!t.desprendido,
            segundos: Math.round(((t.fin || Date.now()) - t.inicio) / 1000),
            log: cola,
            error: t.salida || null,
        };
    }
    respaldar(etiqueta = 'manual', opciones = {}) {
        this.exigirOnPremise();
        const extra = ['-Etiqueta', this.limpiarEtiqueta(etiqueta), '-Silencioso'];
        if (opciones.sinExcel)
            extra.push('-SinExcel');
        if (opciones.sinImagenes)
            extra.push('-SinImagenes');
        const t = this.lanzar('respaldar', 'powershell.exe', this.psArgs('respaldar.ps1', extra));
        return {
            trabajo: t.id,
            mensaje: 'Respaldando base de datos, imagenes, Excel y ajustes. El sistema se detiene unos segundos.',
        };
    }
    limpiarEtiqueta(e) {
        const limpia = String(e || '')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^A-Za-z0-9_-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 40);
        return limpia || 'manual';
    }
    exportarExcel() {
        this.exigirOnPremise();
        const salida = path.join(this.backupsDir, `excel-${this.sello()}`);
        fs.mkdirSync(salida, { recursive: true });
        const t = this.lanzar('excel', this.nodeExe, [
            path.join(this.nodeToolsDir, 'exportar-excel.js'),
            '--install-dir',
            this.installDir,
            '--salida',
            salida,
        ]);
        return { trabajo: t.id, carpeta: salida, mensaje: 'Exportando toda la base a Excel.' };
    }
    imagenes(arreglar) {
        this.exigirOnPremise();
        const salida = path.join(this.backupsDir, `imagenes-${this.sello()}`);
        fs.mkdirSync(salida, { recursive: true });
        const args = [
            path.join(this.nodeToolsDir, 'imagenes.js'),
            '--install-dir',
            this.installDir,
            '--salida',
            salida,
        ];
        if (arreglar)
            args.push('--arreglar');
        const t = this.lanzar(arreglar ? 'imagenes-arreglar' : 'imagenes-revisar', this.nodeExe, args);
        return {
            trabajo: t.id,
            carpeta: salida,
            mensaje: arreglar
                ? 'Ajustando las URL de las imagenes. Ninguna URL se borra: lo que no se pueda recuperar se deja igual y sale en el reporte.'
                : 'Revisando las imagenes. No se cambia nada.',
        };
    }
    ajustes() {
        this.exigirOnPremise();
        const salida = path.join(this.backupsDir, `ajustes-${this.sello()}`);
        fs.mkdirSync(salida, { recursive: true });
        const t = this.lanzar('ajustes', this.nodeExe, [
            path.join(this.nodeToolsDir, 'ajustes.js'),
            '--install-dir',
            this.installDir,
            '--salida',
            salida,
        ]);
        return { trabajo: t.id, carpeta: salida, mensaje: 'Leyendo los ajustes activos.' };
    }
    sello() {
        const d = new Date();
        const p = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
    }
    revertir(nombreRespaldo) {
        this.exigirOnPremise();
        const carpeta = this.resolverRespaldo(nombreRespaldo);
        const t = this.lanzar('revertir', 'powershell.exe', this.psArgs('revertir.ps1', ['-Respaldo', carpeta, '-SiSinPreguntar']), { desprendido: true });
        return {
            trabajo: t.id,
            respaldo: carpeta,
            mensaje: 'Regresando a ese respaldo. Primero se guarda el estado de hoy. El sistema se reinicia: vuelve a entrar en un par de minutos.',
        };
    }
    resolverRespaldo(nombre) {
        const limpio = String(nombre || '').trim();
        if (!limpio)
            throw new common_1.BadRequestException('Falta indicar el respaldo.');
        const candidato = path.resolve(this.backupsDir, limpio);
        const raiz = path.resolve(this.backupsDir);
        if (candidato !== raiz && !candidato.startsWith(raiz + path.sep)) {
            throw new common_1.BadRequestException('Ese respaldo no esta en la carpeta de respaldos.');
        }
        if (!fs.existsSync(path.join(candidato, 'manifest.json'))) {
            throw new common_1.BadRequestException('Ese respaldo no trae manifest.json: esta incompleto y no se puede restaurar con seguridad.');
        }
        return candidato;
    }
    async buscarActualizacion() {
        this.exigirOnPremise();
        const cfg = this.configuracionActualizacion();
        const actual = this.estado();
        if (!cfg.automatica_disponible) {
            return { disponible: false, version_actual: actual.version, ...cfg };
        }
        try {
            const ctrl = new AbortController();
            const reloj = setTimeout(() => ctrl.abort(), 20000);
            const r = await fetch(cfg.origen, { signal: ctrl.signal });
            clearTimeout(reloj);
            if (!r.ok)
                throw new Error(`el servidor contesto ${r.status}`);
            const info = await r.json();
            const nueva = String(info?.version || '').trim();
            return {
                disponible: nueva !== '' && nueva !== actual.version,
                version_actual: actual.version,
                version_nueva: nueva || null,
                notas: info?.notas || null,
                url_paquete: info?.url || null,
                ...cfg,
            };
        }
        catch (e) {
            return {
                disponible: false,
                version_actual: actual.version,
                error: `No se pudo consultar si hay actualizacion: ${e.message}`,
                ...cfg,
            };
        }
    }
    async actualizar(cuerpo = {}) {
        this.exigirOnPremise();
        if (!fs.existsSync(path.join(this.toolsDir, 'actualizar.ps1'))) {
            throw new common_1.BadRequestException('Este equipo no tiene actualizar.ps1. Ejecuta el instalador nuevo (.exe) una vez y queda instalado.');
        }
        let paquete;
        if (cuerpo?.paquete) {
            paquete = path.resolve(String(cuerpo.paquete));
            if (!fs.existsSync(path.join(paquete, 'app', 'backend', 'dist')) &&
                !fs.existsSync(path.join(paquete, 'backend', 'dist'))) {
                throw new common_1.BadRequestException('Esa carpeta no parece un paquete de actualizacion (no trae backend\\dist compilado).');
            }
        }
        else {
            paquete = await this.descargarPaquete();
        }
        const t = this.lanzar('actualizar', 'powershell.exe', this.psArgs('actualizar.ps1', ['-Paquete', paquete, '-SiSinPreguntar']), { desprendido: true });
        return {
            trabajo: t.id,
            paquete,
            mensaje: 'Actualizando. Primero se respalda todo (base, imagenes, Excel y ajustes). El sistema se reinicia solo; si no arranca, regresa por si mismo a la version anterior.',
            reinicia: true,
        };
    }
    async descargarPaquete() {
        const cfg = this.configuracionActualizacion();
        if (!cfg.automatica_disponible) {
            throw new common_1.BadRequestException(cfg.nota);
        }
        const info = (await this.buscarActualizacion());
        const url = info?.url_paquete;
        if (!url) {
            throw new common_1.BadRequestException('El origen de actualizaciones no indico un paquete para bajar.');
        }
        const hostFeed = new URL(cfg.origen).host;
        const destinoUrl = new URL(url);
        if (destinoUrl.host !== hostFeed || destinoUrl.protocol !== 'https:') {
            throw new common_1.BadRequestException('El paquete no viene del origen configurado. No se descarga por seguridad.');
        }
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-update-'));
        const zip = path.join(tmp, 'paquete.zip');
        const ctrl = new AbortController();
        const reloj = setTimeout(() => ctrl.abort(), 20 * 60 * 1000);
        try {
            const r = await fetch(url, { signal: ctrl.signal });
            if (!r.ok)
                throw new Error(`el servidor contesto ${r.status}`);
            const buf = Buffer.from(await r.arrayBuffer());
            fs.writeFileSync(zip, buf);
        }
        finally {
            clearTimeout(reloj);
        }
        const extraido = path.join(tmp, 'paquete');
        await new Promise((resolver, rechazar) => {
            const p = (0, child_process_1.spawn)('powershell.exe', [
                '-NoProfile',
                '-NonInteractive',
                '-Command',
                `Expand-Archive -LiteralPath "${zip}" -DestinationPath "${extraido}" -Force`,
            ], { windowsHide: true, stdio: 'ignore' });
            p.on('close', (c) => c === 0 ? resolver() : rechazar(new Error('No se pudo descomprimir el paquete.')));
            p.on('error', rechazar);
        });
        let raiz = extraido;
        const hijos = fs.readdirSync(raiz, { withFileTypes: true });
        if (hijos.length === 1 && hijos[0].isDirectory()) {
            raiz = path.join(raiz, hijos[0].name);
        }
        if (!fs.existsSync(path.join(raiz, 'app', 'backend', 'dist')) &&
            !fs.existsSync(path.join(raiz, 'backend', 'dist'))) {
            throw new common_1.BadRequestException('El paquete descargado no trae backend\\dist compilado. No se aplica.');
        }
        return raiz;
    }
};
exports.MantenimientoService = MantenimientoService;
exports.MantenimientoService = MantenimientoService = __decorate([
    (0, common_1.Injectable)()
], MantenimientoService);
//# sourceMappingURL=mantenimiento.service.js.map