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
const crypto_1 = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");
const CONSULTA_VIGENCIA_MS = 60 * 60 * 1000;
const CONSULTA_FALLIDA_VIGENCIA_MS = 10 * 60 * 1000;
const CANDADO_VIGENCIA_MS = 3 * 60 * 60 * 1000;
let MantenimientoService = class MantenimientoService {
    constructor() {
        this.log = new common_1.Logger('Mantenimiento');
        this.trabajos = new Map();
        this.consulta = null;
        this.descargando = false;
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
    versionInstalada() {
        const versionJson = this.leerJson(path.join(this.installDir, 'version.json'));
        return versionJson?.version || process.env.APP_VERSION || 'desconocida';
    }
    estado() {
        const onPrem = this.esOnPremise();
        const versionJson = this.leerJson(path.join(this.installDir, 'version.json'));
        const base = {
            on_premise: onPrem,
            plataforma: process.platform,
            modo: process.env.INSTALL_MODE || 'nube',
            version: this.versionInstalada(),
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
        t.pid = hijo.pid;
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
            this.soltarCandado(hijo.pid);
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
    get candadoPath() {
        return path.join(this.installDir, 'logs', 'mantenimiento-en-curso.json');
    }
    procesoVivo(pid) {
        if (!Number.isInteger(pid) || pid <= 0)
            return false;
        try {
            process.kill(pid, 0);
            return true;
        }
        catch (e) {
            return e?.code === 'EPERM';
        }
    }
    mantenimientoEnCurso() {
        const c = this.leerJson(this.candadoPath);
        if (!c)
            return null;
        const inicio = Number(c.inicio) || 0;
        if (Date.now() - inicio > CANDADO_VIGENCIA_MS)
            return null;
        if (!this.procesoVivo(Number(c.pid)))
            return null;
        return { tipo: String(c.tipo || 'mantenimiento'), inicio, pid: Number(c.pid) };
    }
    exigirSinMantenimientoEnCurso() {
        if (this.descargando) {
            throw new common_1.ConflictException('Ya se esta descargando la actualizacion. Espera a que termine; no hace falta volver a darle clic.');
        }
        const c = this.mantenimientoEnCurso();
        if (c) {
            const minutos = Math.max(1, Math.round((Date.now() - c.inicio) / 60000));
            throw new common_1.ConflictException(`Hay un ${c.tipo} en curso desde hace ${minutos} min. Espera a que termine antes de lanzar otro.`);
        }
    }
    tomarCandado(tipo, pid) {
        if (!pid)
            return;
        try {
            fs.mkdirSync(path.dirname(this.candadoPath), { recursive: true });
            fs.writeFileSync(this.candadoPath, JSON.stringify({ tipo, pid, inicio: Date.now() }), 'utf8');
        }
        catch (e) {
            this.log.warn(`No se pudo escribir el candado de mantenimiento: ${e.message}`);
        }
    }
    soltarCandado(pid) {
        const c = this.leerJson(this.candadoPath);
        if (!c || !pid || Number(c.pid) !== pid)
            return;
        try {
            fs.unlinkSync(this.candadoPath);
        }
        catch {
        }
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
        this.exigirSinMantenimientoEnCurso();
        const extra = ['-Etiqueta', this.limpiarEtiqueta(etiqueta), '-Silencioso'];
        if (opciones.sinExcel)
            extra.push('-SinExcel');
        if (opciones.sinImagenes)
            extra.push('-SinImagenes');
        const t = this.lanzar('respaldar', 'powershell.exe', this.psArgs('respaldar.ps1', extra));
        this.tomarCandado('respaldo', t.pid);
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
        if (arreglar)
            this.exigirSinMantenimientoEnCurso();
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
        if (arreglar)
            this.tomarCandado('ajuste de imagenes', t.pid);
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
        this.exigirSinMantenimientoEnCurso();
        const carpeta = this.resolverRespaldo(nombreRespaldo);
        const t = this.lanzar('revertir', 'powershell.exe', this.psArgs('revertir.ps1', ['-Respaldo', carpeta, '-SiSinPreguntar']), { desprendido: true });
        this.tomarCandado('revert', t.pid);
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
    compararVersiones(a, b) {
        const partes = (v) => {
            const m = String(v || '')
                .trim()
                .replace(/^v/i, '')
                .match(/^\d+(\.\d+)*/);
            return m ? m[0].split('.').map(Number) : null;
        };
        const pa = partes(a);
        const pb = partes(b);
        if (!pa || !pb)
            return null;
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const d = (pa[i] || 0) - (pb[i] || 0);
            if (d !== 0)
                return d > 0 ? 1 : -1;
        }
        return 0;
    }
    async buscarActualizacion(forzar = false) {
        this.exigirOnPremise();
        const cfg = this.configuracionActualizacion();
        const versionActual = this.versionInstalada();
        if (!cfg.automatica_disponible) {
            return { disponible: false, version_actual: versionActual, ...cfg };
        }
        const g = this.consulta;
        if (!forzar && g && g.resultado.version_actual === versionActual) {
            const vigencia = g.resultado.error ? CONSULTA_FALLIDA_VIGENCIA_MS : CONSULTA_VIGENCIA_MS;
            if (Date.now() - g.cuando < vigencia) {
                return { ...g.resultado, consultado: new Date(g.cuando).toISOString() };
            }
        }
        const resultado = await this.consultarOrigen(cfg, versionActual);
        this.consulta = { cuando: Date.now(), resultado };
        return { ...resultado, consultado: new Date().toISOString() };
    }
    async consultarOrigen(cfg, versionActual) {
        const origen = cfg.origen;
        try {
            const ctrl = new AbortController();
            const reloj = setTimeout(() => ctrl.abort(), 20000);
            let r;
            try {
                const sep = origen.includes('?') ? '&' : '?';
                r = await fetch(`${origen}${sep}_=${Date.now()}`, {
                    signal: ctrl.signal,
                    headers: { 'Cache-Control': 'no-cache' },
                });
            }
            finally {
                clearTimeout(reloj);
            }
            if (!r.ok)
                throw new Error(`el servidor contesto ${r.status}`);
            const info = await r.json();
            const nueva = String(info?.version || '').trim();
            const base = {
                version_actual: versionActual,
                version_nueva: nueva || null,
                notas: info?.notas || null,
                fecha_publicacion: info?.fecha || null,
                bytes: Number(info?.bytes) || null,
                ...cfg,
            };
            const problema = this.problemaDelAviso(info, origen);
            if (problema) {
                return { ...base, disponible: false, error: problema };
            }
            const cmp = this.compararVersiones(nueva, versionActual);
            if (cmp === -1) {
                return {
                    ...base,
                    disponible: false,
                    nota_version: `Este equipo ya tiene la ${versionActual}, mas nueva que la publicada (${nueva}). No se ofrece regresar de version por aqui.`,
                };
            }
            return {
                ...base,
                disponible: cmp === 1 || (cmp === null && this.compararVersiones(nueva, '0') !== null),
                url_paquete: info.url,
                sha256: String(info.sha256).toLowerCase(),
            };
        }
        catch (e) {
            const motivo = e?.name === 'AbortError' ? 'no contesto en 20 segundos' : e.message;
            return {
                disponible: false,
                version_actual: versionActual,
                error: `No se pudo consultar si hay actualizacion (${motivo}). Revisa la conexion a internet; el sistema sigue funcionando igual.`,
                ...cfg,
            };
        }
    }
    problemaDelAviso(info, origen) {
        if (!info || typeof info !== 'object')
            return 'El aviso de actualizacion no es valido.';
        if (this.compararVersiones(String(info.version || ''), '0') === null) {
            return 'El aviso de actualizacion no trae un numero de version valido.';
        }
        if (!info.url)
            return 'El aviso de actualizacion no indica que paquete bajar.';
        if (!/^[a-f0-9]{64}$/i.test(String(info.sha256 || ''))) {
            return 'El aviso de actualizacion no trae la huella del paquete (sha256). No se ofrece por seguridad.';
        }
        if (!Number.isInteger(Number(info.bytes)) || Number(info.bytes) <= 0) {
            return 'El aviso de actualizacion no trae el tamano del paquete. No se ofrece por seguridad.';
        }
        try {
            const hostAviso = new URL(origen).host;
            const destino = new URL(String(info.url));
            if (destino.host !== hostAviso || destino.protocol !== 'https:') {
                return 'El paquete no viene del origen configurado. No se ofrece por seguridad.';
            }
        }
        catch {
            return 'La direccion del paquete no es valida.';
        }
        return null;
    }
    async actualizar(cuerpo = {}) {
        this.exigirOnPremise();
        this.exigirSinMantenimientoEnCurso();
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
            this.verificarPaquete(paquete);
        }
        else {
            this.descargando = true;
            try {
                paquete = await this.descargarPaquete();
            }
            finally {
                this.descargando = false;
            }
        }
        this.exigirSinMantenimientoEnCurso();
        const t = this.lanzar('actualizar', 'powershell.exe', this.psArgs('actualizar.ps1', ['-Paquete', paquete, '-SiSinPreguntar']), { desprendido: true });
        this.tomarCandado('actualizacion', t.pid);
        this.consulta = null;
        return {
            trabajo: t.id,
            paquete,
            mensaje: 'Sincronizando. Primero se respalda todo (base, imagenes, Excel y ajustes) y se prueba la version nueva contra una copia. El sistema se reinicia solo; si no arranca, regresa por si mismo a la version anterior.',
            reinicia: true,
        };
    }
    backendDelPaquete(raiz) {
        const conApp = path.join(raiz, 'app', 'backend');
        return fs.existsSync(conApp) ? conApp : path.join(raiz, 'backend');
    }
    verificarPaquete(raiz) {
        const backend = this.backendDelPaquete(raiz);
        if (!fs.existsSync(path.join(backend, 'dist', 'main.js'))) {
            throw new common_1.BadRequestException('El paquete no trae el programa compilado (dist\\main.js). No se aplica.');
        }
        const conPantallas = [
            path.join(backend, 'public', 'index.html'),
            path.join(raiz, 'app', 'frontend', 'dist-prod', 'index.html'),
            path.join(raiz, 'frontend', 'dist-prod', 'index.html'),
        ].some((p) => fs.existsSync(p));
        if (!conPantallas) {
            throw new common_1.BadRequestException('El paquete no trae las pantallas (index.html). No se aplica.');
        }
        this.verificarLibrerias(backend);
    }
    verificarLibrerias(backendPaquete) {
        if (fs.existsSync(path.join(backendPaquete, 'node_modules')))
            return;
        const nmInstalado = path.join(this.installDir, 'backend', 'node_modules');
        const versionInstalada = (rel) => {
            const j = this.leerJson(path.join(nmInstalado, ...rel.split('/'), 'package.json'));
            return j?.version || null;
        };
        const faltan = [];
        const lock = this.leerJson(path.join(backendPaquete, 'package-lock.json'));
        if (lock?.packages && typeof lock.packages === 'object') {
            for (const [clave, info] of Object.entries(lock.packages)) {
                if (!clave || !clave.startsWith('node_modules/'))
                    continue;
                if (info?.dev || info?.link)
                    continue;
                const rel = clave.slice('node_modules/'.length);
                const v = versionInstalada(rel);
                if (v === null) {
                    if (info?.optional || info?.devOptional)
                        continue;
                    faltan.push(`${rel}@${info?.version}`);
                }
                else if (info?.version && v !== info.version) {
                    faltan.push(`${rel}@${info.version} (aqui ${v})`);
                }
            }
        }
        else {
            const pj = this.leerJson(path.join(backendPaquete, 'package.json'));
            if (!pj) {
                throw new common_1.BadRequestException('El paquete no trae package.json. No se aplica.');
            }
            for (const dep of Object.keys(pj.dependencies || {})) {
                if (versionInstalada(dep) === null)
                    faltan.push(dep);
            }
        }
        if (faltan.length) {
            this.log.warn(`Paquete incompatible, librerias: ${faltan.slice(0, 20).join(', ')}`);
            throw new common_1.BadRequestException(`Esta version necesita librerias que este equipo no tiene (${faltan.length}: ${faltan
                .slice(0, 4)
                .join(', ')}${faltan.length > 4 ? ', ...' : ''}). Para esta actualizacion usa el instalador .exe: tambien respalda todo y no borra datos. No se toco nada.`);
        }
    }
    limpiarDescargasViejas() {
        let entradas;
        try {
            entradas = fs.readdirSync(os.tmpdir(), { withFileTypes: true });
        }
        catch {
            return;
        }
        const limite = Date.now() - 24 * 60 * 60 * 1000;
        for (const e of entradas) {
            if (!e.isDirectory() || !e.name.startsWith('pos-update-'))
                continue;
            const p = path.join(os.tmpdir(), e.name);
            try {
                if (fs.statSync(p).mtimeMs < limite)
                    fs.rmSync(p, { recursive: true, force: true });
            }
            catch {
            }
        }
    }
    async descargarPaquete() {
        const cfg = this.configuracionActualizacion();
        if (!cfg.automatica_disponible) {
            throw new common_1.BadRequestException(cfg.nota);
        }
        const info = (await this.buscarActualizacion(true));
        if (info?.error)
            throw new common_1.BadRequestException(info.error);
        if (!info?.disponible) {
            throw new common_1.BadRequestException(info?.nota_version || `No hay una version mas nueva que la instalada (${info?.version_actual}).`);
        }
        const url = info.url_paquete;
        this.limpiarDescargasViejas();
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-update-'));
        try {
            const zip = path.join(tmp, 'paquete.zip');
            const ctrl = new AbortController();
            const reloj = setTimeout(() => ctrl.abort(), 20 * 60 * 1000);
            let buf;
            try {
                const r = await fetch(url, { signal: ctrl.signal });
                if (!r.ok)
                    throw new Error(`el servidor contesto ${r.status}`);
                buf = Buffer.from(await r.arrayBuffer());
            }
            catch (e) {
                const motivo = e?.name === 'AbortError' ? 'tardo mas de 20 minutos' : e.message;
                throw new common_1.BadRequestException(`No se pudo descargar el paquete (${motivo}). No se toco nada.`);
            }
            finally {
                clearTimeout(reloj);
            }
            if (buf.length !== info.bytes) {
                throw new common_1.BadRequestException(`El paquete llego incompleto (${buf.length} de ${info.bytes} bytes). No se toco nada; vuelve a intentar.`);
            }
            const huella = (0, crypto_1.createHash)('sha256').update(buf).digest('hex');
            if (huella !== info.sha256) {
                throw new common_1.BadRequestException('La huella del paquete no coincide con la publicada. No se aplica por seguridad y no se toco nada.');
            }
            fs.writeFileSync(zip, buf);
            const extraido = path.join(tmp, 'paquete');
            await new Promise((resolver, rechazar) => {
                const p = (0, child_process_1.spawn)('powershell.exe', [
                    '-NoProfile',
                    '-NonInteractive',
                    '-Command',
                    `Expand-Archive -LiteralPath "${zip}" -DestinationPath "${extraido}" -Force`,
                ], { windowsHide: true, stdio: 'ignore' });
                p.on('close', (c) => c === 0 ? resolver() : rechazar(new common_1.BadRequestException('No se pudo descomprimir el paquete.')));
                p.on('error', rechazar);
            });
            try {
                fs.unlinkSync(zip);
            }
            catch {
            }
            let raiz = extraido;
            const hijos = fs.readdirSync(raiz, { withFileTypes: true });
            if (hijos.length === 1 && hijos[0].isDirectory()) {
                raiz = path.join(raiz, hijos[0].name);
            }
            this.verificarPaquete(raiz);
            const vPaquete = this.leerJson(path.join(raiz, 'version.json'))?.version;
            if (vPaquete && vPaquete !== info.version_nueva) {
                throw new common_1.BadRequestException(`El paquete dice ser la ${vPaquete} y el aviso publicado la ${info.version_nueva}. No se aplica.`);
            }
            return raiz;
        }
        catch (e) {
            try {
                fs.rmSync(tmp, { recursive: true, force: true });
            }
            catch {
            }
            throw e;
        }
    }
};
exports.MantenimientoService = MantenimientoService;
exports.MantenimientoService = MantenimientoService = __decorate([
    (0, common_1.Injectable)()
], MantenimientoService);
//# sourceMappingURL=mantenimiento.service.js.map