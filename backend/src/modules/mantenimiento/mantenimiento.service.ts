import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { spawn } from 'child_process';
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
}

@Injectable()
export class MantenimientoService {
  private readonly log = new Logger('Mantenimiento');
  private readonly trabajos = new Map<string, Trabajo>();

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

  estado() {
    const onPrem = this.esOnPremise();
    const versionJson = this.leerJson(path.join(this.installDir, 'version.json'));
    const base: any = {
      on_premise: onPrem,
      plataforma: process.platform,
      modo: process.env.INSTALL_MODE || 'nube',
      version: versionJson?.version || process.env.APP_VERSION || 'desconocida',
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
   * `desprendido` es para actualizar: ese script detiene este mismo backend,
   * asi que el proceso hijo no puede depender de nosotros. Se suelta con
   * stdio a archivo y unref(), para que siga vivo cuando el servicio muera y
   * pueda volverlo a levantar.
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

    const hijo = spawn(comando, args, {
      cwd: this.installDir,
      windowsHide: true,
      detached: !!opciones.desprendido,
      stdio: ['ignore', fd, fd],
    });

    if (opciones.desprendido) {
      hijo.unref();
      // El final no se va a poder observar: el backend se va a reiniciar.
      t.estado = 'desconocido';
      this.log.warn(`${tipo}: lanzado desprendido, este servicio se va a reiniciar`);
      try {
        fs.closeSync(fd);
      } catch {
        /* ya cerrado */
      }
      return t;
    }

    hijo.on('close', (codigo) => {
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
    let cola = '';
    try {
      const txt = fs.readFileSync(t.logPath, 'utf8');
      cola = txt.length > 20000 ? txt.slice(-20000) : txt;
    } catch {
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

  // ---------------------------------------------------------------- acciones

  respaldar(etiqueta = 'manual', opciones: { sinExcel?: boolean; sinImagenes?: boolean } = {}) {
    this.exigirOnPremise();
    const extra: string[] = ['-Etiqueta', this.limpiarEtiqueta(etiqueta), '-Silencioso'];
    if (opciones.sinExcel) extra.push('-SinExcel');
    if (opciones.sinImagenes) extra.push('-SinImagenes');
    const t = this.lanzar('respaldar', 'powershell.exe', this.psArgs('respaldar.ps1', extra));
    return {
      trabajo: t.id,
      mensaje:
        'Respaldando base de datos, imagenes, Excel y ajustes. El sistema se detiene unos segundos.',
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
    const carpeta = this.resolverRespaldo(nombreRespaldo);
    // revertir.ps1 vuelve a respaldar el estado de hoy antes de restaurar y se
    // niega a continuar si eso falla. Aqui no se le quita esa red.
    const t = this.lanzar(
      'revertir',
      'powershell.exe',
      this.psArgs('revertir.ps1', ['-Respaldo', carpeta, '-SiSinPreguntar']),
      { desprendido: true },
    );
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

  /** Consulta si hay version nueva. Solo contra el origen configurado. */
  async buscarActualizacion() {
    this.exigirOnPremise();
    const cfg = this.configuracionActualizacion();
    const actual = this.estado() as any;
    if (!cfg.automatica_disponible) {
      return { disponible: false, version_actual: actual.version, ...cfg };
    }
    try {
      const ctrl = new AbortController();
      const reloj = setTimeout(() => ctrl.abort(), 20000);
      const r = await fetch(cfg.origen as string, { signal: ctrl.signal });
      clearTimeout(reloj);
      if (!r.ok) throw new Error(`el servidor contesto ${r.status}`);
      const info: any = await r.json();
      const nueva = String(info?.version || '').trim();
      return {
        disponible: nueva !== '' && nueva !== actual.version,
        version_actual: actual.version,
        version_nueva: nueva || null,
        notas: info?.notas || null,
        url_paquete: info?.url || null,
        ...cfg,
      };
    } catch (e: any) {
      return {
        disponible: false,
        version_actual: actual.version,
        error: `No se pudo consultar si hay actualizacion: ${e.message}`,
        ...cfg,
      };
    }
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
    } else {
      paquete = await this.descargarPaquete();
    }

    const t = this.lanzar(
      'actualizar',
      'powershell.exe',
      this.psArgs('actualizar.ps1', ['-Paquete', paquete, '-SiSinPreguntar']),
      { desprendido: true },
    );
    return {
      trabajo: t.id,
      paquete,
      mensaje:
        'Actualizando. Primero se respalda todo (base, imagenes, Excel y ajustes). El sistema se reinicia solo; si no arranca, regresa por si mismo a la version anterior.',
      reinicia: true,
    };
  }

  private async descargarPaquete(): Promise<string> {
    const cfg = this.configuracionActualizacion();
    if (!cfg.automatica_disponible) {
      throw new BadRequestException(cfg.nota);
    }
    const info = (await this.buscarActualizacion()) as any;
    const url: string = info?.url_paquete;
    if (!url) {
      throw new BadRequestException('El origen de actualizaciones no indico un paquete para bajar.');
    }
    // El paquete solo puede venir del mismo host que el feed configurado.
    const hostFeed = new URL(cfg.origen as string).host;
    const destinoUrl = new URL(url);
    if (destinoUrl.host !== hostFeed || destinoUrl.protocol !== 'https:') {
      throw new BadRequestException(
        'El paquete no viene del origen configurado. No se descarga por seguridad.',
      );
    }

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-update-'));
    const zip = path.join(tmp, 'paquete.zip');

    const ctrl = new AbortController();
    const reloj = setTimeout(() => ctrl.abort(), 20 * 60 * 1000);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error(`el servidor contesto ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(zip, buf);
    } finally {
      clearTimeout(reloj);
    }

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
        c === 0 ? resolver() : rechazar(new Error('No se pudo descomprimir el paquete.')),
      );
      p.on('error', rechazar);
    });

    // Algunos zip traen todo dentro de una sola carpeta: se baja un nivel.
    let raiz = extraido;
    const hijos = fs.readdirSync(raiz, { withFileTypes: true });
    if (hijos.length === 1 && hijos[0].isDirectory()) {
      raiz = path.join(raiz, hijos[0].name);
    }
    if (
      !fs.existsSync(path.join(raiz, 'app', 'backend', 'dist')) &&
      !fs.existsSync(path.join(raiz, 'backend', 'dist'))
    ) {
      throw new BadRequestException(
        'El paquete descargado no trae backend\\dist compilado. No se aplica.',
      );
    }
    return raiz;
  }
}
