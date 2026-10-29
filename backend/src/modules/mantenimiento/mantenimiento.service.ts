import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { spawn } from 'child_process';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Mantenimiento on-premise: respaldar, revertir, exportar a Excel, revisar
 * imagenes y actualizar, desde la propia pantalla de Configuracion.
 *
 * Solo existe en una instalacion local (INSTALL_MODE=local con las
 * herramientas en <InstallDir>\tools). En la nube cada endpoint responde 404:
 * ahi no hay un disco del cliente que respaldar y no se debe exponer nada que
 * ejecute scripts.
 *
 * La logica de verdad vive en los .ps1 del instalador, no aqui. Este servicio
 * solo los lanza y reporta. Asi el mismo codigo corre desde el .exe, desde un
 * .bat y desde este boton, y no hay dos versiones que se puedan desincronizar.
 */

type EstadoTrabajo = 'corriendo' | 'ok' | 'error' | 'desconocido';

interface Trabajo {
  id: string;
  tipo: string;
  inicio: number;
  fin?: number;
  estado: EstadoTrabajo;
  codigo?: number;
  logPath: string;
  salida?: string;
  /** Un trabajo desprendido reinicia el backend: nadie va a ver su final. */
  desprendido?: boolean;
  pid?: number;
  /** Donde escribe la copia que sigue fuera del servicio (sin .log/.err). */
  salidaFuera?: string;
}

/** La ultima consulta al origen de actualizaciones, para no preguntar a cada rato. */
interface ConsultaGuardada {
  cuando: number;
  resultado: any;
}

/** Una consulta buena se reusa una hora; una que fallo, diez minutos. */
const CONSULTA_VIGENCIA_MS = 60 * 60 * 1000;
const CONSULTA_FALLIDA_VIGENCIA_MS = 10 * 60 * 1000;

/** Un actualizar.ps1 tarda minutos, nunca horas: un candado mas viejo quedo huerfano. */
const CANDADO_VIGENCIA_MS = 3 * 60 * 60 * 1000;

@Injectable()
export class MantenimientoService {
  private readonly log = new Logger('Mantenimiento');
  private readonly trabajos = new Map<string, Trabajo>();
  private consulta: ConsultaGuardada | null = null;
  /** Mientras baja un paquete no se acepta otro clic. */
  private descargando = false;

  // ---------------------------------------------------------------- rutas

  /** <InstallDir> = el padre de backend/, porque NSSM corre con cwd=backend. */
  get installDir(): string {
    return path.resolve(process.cwd(), '..');
  }
  get toolsDir(): string {
    return path.join(this.installDir, 'tools');
  }
  get nodeToolsDir(): string {
    return path.join(this.toolsDir, 'node');
  }
  get backupsDir(): string {
    return path.join(this.installDir, 'backups');
  }
  get nodeExe(): string {
    const propio = path.join(this.installDir, 'node', 'node.exe');
    return fs.existsSync(propio) ? propio : process.execPath;
  }

  /**
   * On-premise de verdad: Windows, modo local y las herramientas presentes.
   * Si falta cualquiera de las tres cosas, no se habilita el panel: es mejor
   * que el boton no aparezca que un boton que falla a medias.
   */
  esOnPremise(): boolean {
    if (process.platform !== 'win32') return false;
    if ((process.env.INSTALL_MODE || '').toLowerCase() !== 'local') return false;
    return fs.existsSync(path.join(this.toolsDir, 'respaldar.ps1'));
  }

  private exigirOnPremise(): void {
    if (!this.esOnPremise()) {
      throw new NotFoundException(
        'El mantenimiento local solo esta disponible en una instalacion en sitio.',
      );
    }
  }

  // ---------------------------------------------------------------- utilidades

  private leerJson(ruta: string): any {
    try {
      let texto = fs.readFileSync(ruta, 'utf8');
      // Se quita la marca de orden de bytes si viene.
      //
      // Los .json del equipo en sitio los escribe PowerShell, y
      // "Set-Content -Encoding UTF8" en el PowerShell que trae Windows mete
      // tres bytes invisibles al principio del archivo. JSON.parse truena con
      // ellos, y como este catch devuelve null sin avisar, el efecto era que
      // un respaldo perfectamente bueno se mostraba en la pantalla de
      // mantenimiento con completo:false y revertir_con:null, es decir, como
      // si estuviera roto y sin forma de volver atras. Ya se corrigio en los
      // scripts que los escriben, pero los respaldos que el cliente hizo con
      // una version anterior siguen teniendo la marca y tienen que poder
      // restaurarse igual.
      if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1);
      return JSON.parse(texto);
    } catch {
      return null;
    }
  }

  private tamanoCarpeta(dir: string): { archivos: number; bytes: number } {
    let archivos = 0;
    let bytes = 0;
    const recorrer = (d: string, prof: number) => {
      if (prof > 12) return;
      let entradas: fs.Dirent[];
      try {
        entradas = fs.readdirSync(d, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entradas) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) recorrer(p, prof + 1);
        else {
          archivos++;
          try {
            bytes += fs.statSync(p).size;
          } catch {
            /* un archivo en uso no invalida el conteo */
          }
        }
      }
    };
    if (fs.existsSync(dir)) recorrer(dir, 0);
    return { archivos, bytes };
  }

  // ---------------------------------------------------------------- estado

  /** La version que esta corriendo, sin recorrer carpetas: se consulta seguido. */
  private versionInstalada(): string {
    const versionJson = this.leerJson(path.join(this.installDir, 'version.json'));
    return versionJson?.version || process.env.APP_VERSION || 'desconocida';
  }

  estado() {
    const onPrem = this.esOnPremise();
    const versionJson = this.leerJson(path.join(this.installDir, 'version.json'));
    const base: any = {
      on_premise: onPrem,
      plataforma: process.platform,
      modo: process.env.INSTALL_MODE || 'nube',
      version: this.versionInstalada(),
      version_previa: versionJson?.version_previa || null,
      fecha_version: versionJson?.build_date || null,
    };
    if (!onPrem) return base;

    const up = this.tamanoCarpeta(path.join(this.installDir, 'backend', 'uploads'));
    const datos = this.tamanoCarpeta(path.join(this.installDir, 'mariadb', 'data'));
    const respaldos = this.listarRespaldos();

    let libreBytes: number | null = null;
    try {
      // statfs no esta en todas las versiones; si no esta, se omite el dato en
      // vez de fallar el estado completo.
      const sf = (fs as any).statfsSync?.(this.installDir);
      if (sf) libreBytes = Number(sf.bavail) * Number(sf.bsize);
    } catch {
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

  private ultimaActualizacion(): string | null {
    const p = path.join(this.installDir, 'ULTIMA-ACTUALIZACION.txt');
    try {
      return fs.readFileSync(p, 'utf8').slice(0, 8000);
    } catch {
      return null;
    }
  }

  private configuracionActualizacion() {
    const url = (process.env.UPDATE_FEED_URL || '').trim();
    return {
      // Sin un origen configurado no se inventa uno: se dice que la via es el
      // instalador, que es la verdad.
      automatica_disponible: url !== '',
      origen: url || null,
      nota: url
        ? 'Se puede buscar e instalar la actualizacion desde aqui.'
        : 'Para actualizar, ejecuta el instalador nuevo (.exe) en este equipo: detecta la instalacion, respalda todo y actualiza sin borrar datos.',
    };
  }

  // ---------------------------------------------------------------- respaldos

  listarRespaldos() {
    if (!fs.existsSync(this.backupsDir)) return [];
    let entradas: fs.Dirent[];
    try {
      entradas = fs.readdirSync(this.backupsDir, { withFileTypes: true });
    } catch {
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
        } catch {
          /* carpeta recien borrada */
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
          // Lo que hay que escribir para regresar a este punto.
          revertir_con: manifest?.revertir_con || null,
        };
      })
      .sort((a, b) => b.fecha - a.fecha);
    return lista;
  }

  // ---------------------------------------------------------------- trabajos

  private nuevoTrabajo(tipo: string): Trabajo {
    const id = `${tipo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const dir = path.join(this.installDir, 'logs');
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      /* ya existe */
    }
    const t: Trabajo = {
      id,
      tipo,
      inicio: Date.now(),
      estado: 'corriendo',
      logPath: path.join(dir, `mantenimiento-${id}.log`),
    };
    this.trabajos.set(id, t);
    // No se acumulan trabajos para siempre en memoria.
    if (this.trabajos.size > 40) {
      const viejos = [...this.trabajos.values()].sort((a, b) => a.inicio - b.inicio);
      for (const v of viejos.slice(0, 10)) this.trabajos.delete(v.id);
    }
    return t;
  }

  /**
   * Lanza un script y acumula su salida en un archivo.
   *
   * `desprendido` es para los scripts que detienen este mismo backend
   * (respaldar, revertir, actualizar): tienen que seguir vivos cuando el
   * servicio muera, para volverlo a levantar. Ni detached ni unref() lo logran
   * en este equipo, probado el 28-oct: el nssm 2.24 del instalador mata a todos
   * los descendientes vivos del node al detener el servicio, y un PowerShell
   * lanzado con detached:true sale en el acto sin correr el script. Por eso se
   * lanza normal con POS_RELANZAR_FUERA=1, y el script se pasa a una copia de
   * si mismo con su propia consola y sale. Esa copia ya no desciende de nadie,
   * escribe en `salidaFuera` y se queda con el candado.
   */
  private lanzar(
    tipo: string,
    comando: string,
    args: string[],
    opciones: { desprendido?: boolean } = {},
  ): Trabajo {
    const t = this.nuevoTrabajo(tipo);
    t.desprendido = !!opciones.desprendido;

    const fd = fs.openSync(t.logPath, 'a');
    fs.writeSync(
      fd,
      `=== ${tipo} === ${new Date().toISOString()}\r\n${comando} ${args.join(' ')}\r\n\r\n`,
    );

    let env: NodeJS.ProcessEnv = process.env;
    if (t.desprendido) {
      t.salidaFuera = t.logPath.replace(/\.log$/, '-fuera');
      env = { ...process.env, POS_RELANZAR_FUERA: '1', POS_SALIDA_RELEVO: t.salidaFuera };
      this.log.warn(`${tipo}: sigue fuera del servicio, este backend se va a reiniciar`);
    }

    const hijo = spawn(comando, args, {
      cwd: this.installDir,
      windowsHide: true,
      env,
      stdio: ['ignore', fd, fd],
    });
    t.pid = hijo.pid;

    hijo.on('close', (codigo) => {
      if (t.desprendido) {
        try {
          fs.closeSync(fd);
        } catch {
          /* ya cerrado */
        }
        // Este primer proceso solo le pasa el trabajo a la copia de fuera y
        // sale: 0 es que la copia ya va corriendo, y su final lo sigue
        // trabajo() por el candado. Otro codigo es que no se pudo pasar y no
        // se toco nada.
        if (codigo !== 0) {
          t.fin = Date.now();
          t.codigo = codigo ?? -1;
          t.estado = 'error';
          this.soltarCandado(hijo.pid);
          this.log.error(`${tipo} no pudo seguir fuera del servicio (codigo ${codigo})`);
        }
        return;
      }
      t.fin = Date.now();
      t.codigo = codigo ?? -1;
      // ajustes.js y actualizar.ps1 usan 3 para "termino, pero hay diferencias
      // que revisar": no es un fallo.
      t.estado = codigo === 0 || codigo === 3 ? 'ok' : 'error';
      try {
        fs.closeSync(fd);
      } catch {
        /* ya cerrado */
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
      } catch {
        /* ya cerrado */
      }
      this.log.error(`${tipo} no se pudo lanzar: ${e.message}`);
    });

    return t;
  }

  // ---------------------------------------------------------------- candado

  /**
   * Un solo trabajo pesado a la vez (actualizar, revertir, respaldar, arreglar
   * imagenes). El candado vive en un archivo y no en memoria a proposito: el
   * respaldo y la actualizacion reinician este mismo backend, y con el mapa en
   * memoria vacio un segundo clic lanzaria otra actualizacion encima de la que
   * va corriendo. actualizar.ps1 lee y respeta el mismo archivo.
   */
  get candadoPath(): string {
    return path.join(this.installDir, 'logs', 'mantenimiento-en-curso.json');
  }

  private procesoVivo(pid: number): boolean {
    if (!Number.isInteger(pid) || pid <= 0) return false;
    try {
      process.kill(pid, 0);
      return true;
    } catch (e: any) {
      // EPERM: existe pero es de otro usuario. Sigue vivo.
      return e?.code === 'EPERM';
    }
  }

  /** El trabajo que tiene el candado, o null si no hay ninguno vigente. */
  private mantenimientoEnCurso(): { tipo: string; inicio: number; pid: number } | null {
    const c = this.leerJson(this.candadoPath);
    if (!c) return null;
    const inicio = Number(c.inicio) || 0;
    if (Date.now() - inicio > CANDADO_VIGENCIA_MS) return null;
    if (!this.procesoVivo(Number(c.pid))) return null;
    return { tipo: String(c.tipo || 'mantenimiento'), inicio, pid: Number(c.pid) };
  }

  private exigirSinMantenimientoEnCurso(): void {
    if (this.descargando) {
      throw new ConflictException(
        'Ya se esta descargando la actualizacion. Espera a que termine; no hace falta volver a darle clic.',
      );
    }
    const c = this.mantenimientoEnCurso();
    if (c) {
      const minutos = Math.max(1, Math.round((Date.now() - c.inicio) / 60000));
      throw new ConflictException(
        `Hay un ${c.tipo} en curso desde hace ${minutos} min. Espera a que termine antes de lanzar otro.`,
      );
    }
  }

  private tomarCandado(tipo: string, pid: number | undefined): void {
    if (!pid) return;
    try {
      fs.mkdirSync(path.dirname(this.candadoPath), { recursive: true });
      fs.writeFileSync(
        this.candadoPath,
        JSON.stringify({ tipo, pid, inicio: Date.now() }),
        'utf8',
      );
    } catch (e: any) {
      this.log.warn(`No se pudo escribir el candado de mantenimiento: ${e.message}`);
    }
  }

  /** Solo se suelta el candado propio: nunca el de un trabajo que no es este. */
  private soltarCandado(pid: number | undefined): void {
    const c = this.leerJson(this.candadoPath);
    if (!c || !pid || Number(c.pid) !== pid) return;
    try {
      fs.unlinkSync(this.candadoPath);
    } catch {
      /* ya no estaba */
    }
  }

  private psArgs(script: string, extra: string[]): string[] {
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

  trabajo(id: string) {
    const t = this.trabajos.get(id);
    if (!t) throw new NotFoundException('No se encontro ese trabajo.');

    // Un trabajo desprendido sigue en marcha mientras su copia de fuera tenga
    // el candado. Si el candado ya no esta y este backend sigue vivo, no hubo
    // reinicio: el script se detuvo antes de tocar el sistema, y el motivo
    // esta en la bitacora.
    if (t.desprendido && t.estado === 'corriendo' && !this.mantenimientoEnCurso()) {
      t.fin = Date.now();
      t.estado = 'desconocido';
    }

    const leer = (ruta: string) => {
      try {
        return fs.readFileSync(ruta, 'utf8');
      } catch {
        return '';
      }
    };
    let txt = leer(t.logPath);
    if (t.salidaFuera) txt += leer(`${t.salidaFuera}.log`) + leer(`${t.salidaFuera}.err`);
    const cola = txt.length > 20000 ? txt.slice(-20000) : txt;
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

  // ---------------------------------------------------------------- acciones

  respaldar(etiqueta = 'manual', opciones: { sinExcel?: boolean; sinImagenes?: boolean } = {}) {
    this.exigirOnPremise();
    this.exigirSinMantenimientoEnCurso();
    const extra: string[] = ['-Etiqueta', this.limpiarEtiqueta(etiqueta), '-Silencioso'];
    if (opciones.sinExcel) extra.push('-SinExcel');
    if (opciones.sinImagenes) extra.push('-SinImagenes');
    // Desprendido: el respaldo detiene este backend mientras vuelca la base.
    // Como hijo normal moria ahi mismo y dejaba el POS detenido.
    const t = this.lanzar('respaldar', 'powershell.exe', this.psArgs('respaldar.ps1', extra), {
      desprendido: true,
    });
    this.tomarCandado('respaldo', t.pid);
    return {
      trabajo: t.id,
      mensaje:
        'Respaldando base de datos, imagenes, Excel y ajustes. El sistema se detiene unos segundos.',
      reinicia: true,
    };
  }

  /** Solo letras, numeros y guiones: la etiqueta termina en un nombre de carpeta. */
  private limpiarEtiqueta(e: string): string {
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

  imagenes(arreglar: boolean) {
    this.exigirOnPremise();
    // Revisar solo lee; arreglar escribe en la base y no debe cruzarse con una
    // actualizacion o un revert.
    if (arreglar) this.exigirSinMantenimientoEnCurso();
    const salida = path.join(this.backupsDir, `imagenes-${this.sello()}`);
    fs.mkdirSync(salida, { recursive: true });
    const args = [
      path.join(this.nodeToolsDir, 'imagenes.js'),
      '--install-dir',
      this.installDir,
      '--salida',
      salida,
    ];
    if (arreglar) args.push('--arreglar');
    const t = this.lanzar(arreglar ? 'imagenes-arreglar' : 'imagenes-revisar', this.nodeExe, args);
    if (arreglar) this.tomarCandado('ajuste de imagenes', t.pid);
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

  private sello(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(
      d.getMinutes(),
    )}${p(d.getSeconds())}`;
  }

  // ---------------------------------------------------------------- revertir

  revertir(nombreRespaldo: string) {
    this.exigirOnPremise();
    this.exigirSinMantenimientoEnCurso();
    const carpeta = this.resolverRespaldo(nombreRespaldo);
    // revertir.ps1 vuelve a respaldar el estado de hoy antes de restaurar y se
    // niega a continuar si eso falla. Aqui no se le quita esa red.
    const t = this.lanzar(
      'revertir',
      'powershell.exe',
      this.psArgs('revertir.ps1', ['-Respaldo', carpeta, '-SiSinPreguntar']),
      { desprendido: true },
    );
    this.tomarCandado('revert', t.pid);
    return {
      trabajo: t.id,
      respaldo: carpeta,
      mensaje:
        'Regresando a ese respaldo. Primero se guarda el estado de hoy. El sistema se reinicia: vuelve a entrar en un par de minutos.',
    };
  }

  /** El nombre viene del navegador: se exige que sea una carpeta real dentro de backups. */
  private resolverRespaldo(nombre: string): string {
    const limpio = String(nombre || '').trim();
    if (!limpio) throw new BadRequestException('Falta indicar el respaldo.');
    const candidato = path.resolve(this.backupsDir, limpio);
    const raiz = path.resolve(this.backupsDir);
    if (candidato !== raiz && !candidato.startsWith(raiz + path.sep)) {
      throw new BadRequestException('Ese respaldo no esta en la carpeta de respaldos.');
    }
    if (!fs.existsSync(path.join(candidato, 'manifest.json'))) {
      throw new BadRequestException(
        'Ese respaldo no trae manifest.json: esta incompleto y no se puede restaurar con seguridad.',
      );
    }
    return candidato;
  }

  // ---------------------------------------------------------------- actualizar

  /**
   * "2.4.10" contra "2.4.9" numero por numero, no como texto (como texto 2.4.10
   * saldria menor). Devuelve 1, 0 o -1, y null si alguna no parece version.
   */
  private compararVersiones(a: string, b: string): number | null {
    const partes = (v: string) => {
      const m = String(v || '')
        .trim()
        .replace(/^v/i, '')
        .match(/^\d+(\.\d+)*/);
      return m ? m[0].split('.').map(Number) : null;
    };
    const pa = partes(a);
    const pb = partes(b);
    if (!pa || !pb) return null;
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = (pa[i] || 0) - (pb[i] || 0);
      if (d !== 0) return d > 0 ? 1 : -1;
    }
    return 0;
  }

  /**
   * Consulta si hay version nueva. Solo contra el origen configurado.
   *
   * La respuesta se guarda una hora: el aviso de la barra superior pregunta
   * cada vez que alguien abre el sistema y no tiene caso salir a internet en
   * cada pantalla. `forzar` es el boton "Buscar ahora", y la descarga siempre
   * fuerza, para no instalar con datos viejos.
   */
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

  private async consultarOrigen(cfg: ReturnType<MantenimientoService['configuracionActualizacion']>, versionActual: string) {
    const origen = cfg.origen as string;
    try {
      const ctrl = new AbortController();
      const reloj = setTimeout(() => ctrl.abort(), 20000);
      let r: Response;
      try {
        // El sello en la URL es para que ningun cache intermedio conteste con
        // el aviso de la semana pasada.
        const sep = origen.includes('?') ? '&' : '?';
        r = await fetch(`${origen}${sep}_=${Date.now()}`, {
          signal: ctrl.signal,
          headers: { 'Cache-Control': 'no-cache' },
        });
      } finally {
        clearTimeout(reloj);
      }
      if (!r.ok) throw new Error(`el servidor contesto ${r.status}`);
      const info: any = await r.json();

      const nueva = String(info?.version || '').trim();
      const base = {
        version_actual: versionActual,
        version_nueva: nueva || null,
        notas: info?.notas || null,
        fecha_publicacion: info?.fecha || null,
        bytes: Number(info?.bytes) || null,
        ...cfg,
      };

      // Un aviso incompleto no se ofrece: sin huella no hay como saber si lo
      // que se baja es lo que se publico.
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
        // Version instalada desconocida: no hay contra que comparar y la
        // actualizacion deja version.json, asi que se ofrece una vez.
        disponible: cmp === 1 || (cmp === null && this.compararVersiones(nueva, '0') !== null),
        url_paquete: info.url,
        sha256: String(info.sha256).toLowerCase(),
      };
    } catch (e: any) {
      const motivo = e?.name === 'AbortError' ? 'no contesto en 20 segundos' : e.message;
      return {
        disponible: false,
        version_actual: versionActual,
        error: `No se pudo consultar si hay actualizacion (${motivo}). Revisa la conexion a internet; el sistema sigue funcionando igual.`,
        ...cfg,
      };
    }
  }

  /** Lo que le falte al aviso publicado para poder confiar en el paquete. */
  private problemaDelAviso(info: any, origen: string): string | null {
    if (!info || typeof info !== 'object') return 'El aviso de actualizacion no es valido.';
    if (this.compararVersiones(String(info.version || ''), '0') === null) {
      return 'El aviso de actualizacion no trae un numero de version valido.';
    }
    if (!info.url) return 'El aviso de actualizacion no indica que paquete bajar.';
    if (!/^[a-f0-9]{64}$/i.test(String(info.sha256 || ''))) {
      return 'El aviso de actualizacion no trae la huella del paquete (sha256). No se ofrece por seguridad.';
    }
    if (!Number.isInteger(Number(info.bytes)) || Number(info.bytes) <= 0) {
      return 'El aviso de actualizacion no trae el tamano del paquete. No se ofrece por seguridad.';
    }
    try {
      // El paquete solo puede venir del mismo host que el aviso, y por https.
      const hostAviso = new URL(origen).host;
      const destino = new URL(String(info.url));
      if (destino.host !== hostAviso || destino.protocol !== 'https:') {
        return 'El paquete no viene del origen configurado. No se ofrece por seguridad.';
      }
    } catch {
      return 'La direccion del paquete no es valida.';
    }
    return null;
  }

  /**
   * Actualiza. Dos formas de darle el paquete:
   *   - `paquete`: una carpeta ya en el disco de este equipo.
   *   - sin nada: se descarga del origen configurado en UPDATE_FEED_URL.
   *
   * Nunca se acepta una URL arbitraria desde el navegador: eso convertiria
   * este boton en una via para ejecutar codigo de donde sea.
   */
  async actualizar(cuerpo: { paquete?: string } = {}) {
    this.exigirOnPremise();
    this.exigirSinMantenimientoEnCurso();

    if (!fs.existsSync(path.join(this.toolsDir, 'actualizar.ps1'))) {
      throw new BadRequestException(
        'Este equipo no tiene actualizar.ps1. Ejecuta el instalador nuevo (.exe) una vez y queda instalado.',
      );
    }

    let paquete: string;
    if (cuerpo?.paquete) {
      paquete = path.resolve(String(cuerpo.paquete));
      if (!fs.existsSync(path.join(paquete, 'app', 'backend', 'dist')) &&
          !fs.existsSync(path.join(paquete, 'backend', 'dist'))) {
        throw new BadRequestException(
          'Esa carpeta no parece un paquete de actualizacion (no trae backend\\dist compilado).',
        );
      }
      this.verificarPaquete(paquete);
    } else {
      this.descargando = true;
      try {
        paquete = await this.descargarPaquete();
      } finally {
        this.descargando = false;
      }
    }

    // Se revisa otra vez: la descarga tarda y en ese rato alguien pudo haber
    // lanzado un respaldo desde otra pantalla.
    this.exigirSinMantenimientoEnCurso();

    const t = this.lanzar(
      'actualizar',
      'powershell.exe',
      this.psArgs('actualizar.ps1', ['-Paquete', paquete, '-SiSinPreguntar']),
      { desprendido: true },
    );
    this.tomarCandado('actualizacion', t.pid);
    this.consulta = null;
    return {
      trabajo: t.id,
      paquete,
      mensaje:
        'Sincronizando. Primero se respalda todo (base, imagenes, Excel y ajustes) y se prueba la version nueva contra una copia. El sistema se reinicia solo; si no arranca, regresa por si mismo a la version anterior.',
      reinicia: true,
    };
  }

  /** La raiz del backend dentro de un paquete: <pkg>\app\backend o <pkg>\backend. */
  private backendDelPaquete(raiz: string): string {
    const conApp = path.join(raiz, 'app', 'backend');
    return fs.existsSync(conApp) ? conApp : path.join(raiz, 'backend');
  }

  /**
   * Lo que se revisa del paquete antes de dejar que actualizar.ps1 detenga
   * nada. Todo lo que aqui falle deja el sistema exactamente como estaba.
   */
  private verificarPaquete(raiz: string): void {
    const backend = this.backendDelPaquete(raiz);
    if (!fs.existsSync(path.join(backend, 'dist', 'main.js'))) {
      throw new BadRequestException('El paquete no trae el programa compilado (dist\\main.js). No se aplica.');
    }

    // Un paquete sin pantallas dejaria el sistema en blanco: ya paso una vez
    // con un instalador que salio con la carpeta public vacia.
    const conPantallas = [
      path.join(backend, 'public', 'index.html'),
      path.join(raiz, 'app', 'frontend', 'dist-prod', 'index.html'),
      path.join(raiz, 'frontend', 'dist-prod', 'index.html'),
    ].some((p) => fs.existsSync(p));
    if (!conPantallas) {
      throw new BadRequestException('El paquete no trae las pantallas (index.html). No se aplica.');
    }

    this.verificarLibrerias(backend);
  }

  /**
   * El paquete que baja el boton no trae node_modules (pesaria cientos de MB).
   * Solo sirve si cada libreria que la version nueva usa ya esta instalada aqui
   * en la misma version. Si no, se dice que se use el .exe en vez de instalar
   * un programa que no va a arrancar.
   */
  private verificarLibrerias(backendPaquete: string): void {
    if (fs.existsSync(path.join(backendPaquete, 'node_modules'))) return; // trae las suyas

    const nmInstalado = path.join(this.installDir, 'backend', 'node_modules');
    const versionInstalada = (rel: string): string | null => {
      const j = this.leerJson(path.join(nmInstalado, ...rel.split('/'), 'package.json'));
      return j?.version || null;
    };

    const faltan: string[] = [];
    const lock = this.leerJson(path.join(backendPaquete, 'package-lock.json'));
    if (lock?.packages && typeof lock.packages === 'object') {
      for (const [clave, info] of Object.entries<any>(lock.packages)) {
        if (!clave || !clave.startsWith('node_modules/')) continue;
        if (info?.dev || info?.link) continue;
        const rel = clave.slice('node_modules/'.length);
        const v = versionInstalada(rel);
        if (v === null) {
          // Las opcionales son de otra plataforma (fsevents y similares).
          if (info?.optional || info?.devOptional) continue;
          faltan.push(`${rel}@${info?.version}`);
        } else if (info?.version && v !== info.version) {
          faltan.push(`${rel}@${info.version} (aqui ${v})`);
        }
      }
    } else {
      const pj = this.leerJson(path.join(backendPaquete, 'package.json'));
      if (!pj) {
        throw new BadRequestException('El paquete no trae package.json. No se aplica.');
      }
      for (const dep of Object.keys(pj.dependencies || {})) {
        if (versionInstalada(dep) === null) faltan.push(dep);
      }
    }

    if (faltan.length) {
      this.log.warn(`Paquete incompatible, librerias: ${faltan.slice(0, 20).join(', ')}`);
      throw new BadRequestException(
        `Esta version necesita librerias que este equipo no tiene (${faltan.length}: ${faltan
          .slice(0, 4)
          .join(', ')}${faltan.length > 4 ? ', ...' : ''}). Para esta actualizacion usa el instalador .exe: tambien respalda todo y no borra datos. No se toco nada.`,
      );
    }
  }

  /** Las descargas de hace mas de un dia ya se aplicaron o fallaron: estorban. */
  private limpiarDescargasViejas(): void {
    let entradas: fs.Dirent[];
    try {
      entradas = fs.readdirSync(os.tmpdir(), { withFileTypes: true });
    } catch {
      return;
    }
    const limite = Date.now() - 24 * 60 * 60 * 1000;
    for (const e of entradas) {
      if (!e.isDirectory() || !e.name.startsWith('pos-update-')) continue;
      const p = path.join(os.tmpdir(), e.name);
      try {
        if (fs.statSync(p).mtimeMs < limite) fs.rmSync(p, { recursive: true, force: true });
      } catch {
        /* en uso: se intenta la proxima vez */
      }
    }
  }

  private async descargarPaquete(): Promise<string> {
    const cfg = this.configuracionActualizacion();
    if (!cfg.automatica_disponible) {
      throw new BadRequestException(cfg.nota);
    }
    const info = (await this.buscarActualizacion(true)) as any;
    if (info?.error) throw new BadRequestException(info.error);
    if (!info?.disponible) {
      throw new BadRequestException(
        info?.nota_version || `No hay una version mas nueva que la instalada (${info?.version_actual}).`,
      );
    }
    const url: string = info.url_paquete;

    this.limpiarDescargasViejas();
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-update-'));
    try {
      const zip = path.join(tmp, 'paquete.zip');

      const ctrl = new AbortController();
      const reloj = setTimeout(() => ctrl.abort(), 20 * 60 * 1000);
      let buf: Buffer;
      try {
        const r = await fetch(url, { signal: ctrl.signal });
        if (!r.ok) throw new Error(`el servidor contesto ${r.status}`);
        buf = Buffer.from(await r.arrayBuffer());
      } catch (e: any) {
        const motivo = e?.name === 'AbortError' ? 'tardo mas de 20 minutos' : e.message;
        throw new BadRequestException(`No se pudo descargar el paquete (${motivo}). No se toco nada.`);
      } finally {
        clearTimeout(reloj);
      }

      // Tamano y huella antes de descomprimir nada: un paquete cortado o
      // cambiado en el camino no llega a tocar el disco de la instalacion.
      if (buf.length !== info.bytes) {
        throw new BadRequestException(
          `El paquete llego incompleto (${buf.length} de ${info.bytes} bytes). No se toco nada; vuelve a intentar.`,
        );
      }
      const huella = createHash('sha256').update(buf).digest('hex');
      if (huella !== info.sha256) {
        throw new BadRequestException(
          'La huella del paquete no coincide con la publicada. No se aplica por seguridad y no se toco nada.',
        );
      }
      fs.writeFileSync(zip, buf);

      const extraido = path.join(tmp, 'paquete');
      await new Promise<void>((resolver, rechazar) => {
        const p = spawn(
          'powershell.exe',
          [
            '-NoProfile',
            '-NonInteractive',
            '-Command',
            `Expand-Archive -LiteralPath "${zip}" -DestinationPath "${extraido}" -Force`,
          ],
          { windowsHide: true, stdio: 'ignore' },
        );
        p.on('close', (c) =>
          c === 0 ? resolver() : rechazar(new BadRequestException('No se pudo descomprimir el paquete.')),
        );
        p.on('error', rechazar);
      });
      try {
        fs.unlinkSync(zip);
      } catch {
        /* se borra con la carpeta mas adelante */
      }

      // Algunos zip traen todo dentro de una sola carpeta: se baja un nivel.
      let raiz = extraido;
      const hijos = fs.readdirSync(raiz, { withFileTypes: true });
      if (hijos.length === 1 && hijos[0].isDirectory()) {
        raiz = path.join(raiz, hijos[0].name);
      }
      this.verificarPaquete(raiz);

      const vPaquete = this.leerJson(path.join(raiz, 'version.json'))?.version;
      if (vPaquete && vPaquete !== info.version_nueva) {
        throw new BadRequestException(
          `El paquete dice ser la ${vPaquete} y el aviso publicado la ${info.version_nueva}. No se aplica.`,
        );
      }
      return raiz;
    } catch (e) {
      // Lo que no se va a aplicar no se deja ocupando disco.
      try {
        fs.rmSync(tmp, { recursive: true, force: true });
      } catch {
        /* lo limpia la siguiente descarga */
      }
      throw e;
    }
  }
}
