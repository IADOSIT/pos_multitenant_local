import { useState, useEffect, useCallback, useRef } from 'react';
import { mantenimientoApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import {
  HardDrive, Database, Image as ImageIcon, FileSpreadsheet, RotateCcw,
  RefreshCw, Rocket, ShieldCheck, AlertTriangle, Clock, CheckCircle,
  XCircle, Sliders, Terminal,
} from 'lucide-react';

/**
 * Mantenimiento de la instalación en sitio (on-premise).
 *
 * Esta pestaña sólo aparece cuando el POS está instalado en la computadora del
 * negocio. En la nube el backend responde 404 y nunca se monta, así que ningún
 * cliente en línea ve ni ejecuta nada de aquí.
 *
 * Todo lo que hace este panel es lanzar los mismos scripts que trae el
 * instalador (respaldar.ps1, revertir.ps1, actualizar.ps1), con la misma red de
 * seguridad: antes de actualizar se respalda la base, las imágenes, un Excel y
 * los ajustes; si la actualización no arranca, el sistema regresa solo.
 */

type Estado = {
  on_premise: boolean;
  version: string;
  version_previa?: string | null;
  fecha_version?: string | null;
  install_dir?: string;
  imagenes?: { archivos: number; bytes: number };
  base_datos_bytes?: number;
  disco_libre_bytes?: number | null;
  respaldos_total?: number;
  ultimo_respaldo?: Respaldo | null;
  ultima_actualizacion?: string | null;
  actualizacion?: { automatica_disponible: boolean; origen: string | null; nota: string };
  herramientas?: Record<string, boolean>;
};

type Respaldo = {
  nombre: string;
  ruta: string;
  fecha: number;
  bytes: number;
  completo: boolean;
  version: string | null;
  etiqueta: string | null;
  tablas: number | null;
  imagenes: number | null;
  tiene_excel: boolean;
  revertir_con: string | null;
};

type Trabajo = {
  id: string;
  tipo: string;
  estado: 'corriendo' | 'ok' | 'error' | 'desconocido';
  codigo: number | null;
  desprendido: boolean;
  segundos: number;
  log: string;
  error: string | null;
};

function tam(bytes?: number | null) {
  if (!bytes) return '—';
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

function cuando(ms?: number | null) {
  if (!ms) return '—';
  return new Date(ms).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

const TITULOS: Record<string, string> = {
  respaldar: 'Respaldando todo',
  excel: 'Exportando a Excel',
  'imagenes-revisar': 'Revisando imágenes',
  'imagenes-arreglar': 'Ajustando imágenes',
  ajustes: 'Leyendo ajustes',
  revertir: 'Regresando al respaldo',
  actualizar: 'Actualizando el sistema',
};

export default function MantenimientoLocal() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [respaldos, setRespaldos] = useState<Respaldo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
  const [verLog, setVerLog] = useState(false);
  const [aRevertir, setARevertir] = useState<Respaldo | null>(null);
  const [frase, setFrase] = useState('');
  const [actu, setActu] = useState<any>(null);
  const [buscandoActu, setBuscandoActu] = useState(false);
  const [confirmarActu, setConfirmarActu] = useState(false);
  const reloj = useRef<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [e, r] = await Promise.all([mantenimientoApi.estado(), mantenimientoApi.respaldos()]);
      setEstado(e.data);
      setRespaldos(r.data?.respaldos || []);
    } catch {
      // En la nube esto responde 404 y la pestaña ni se muestra; aquí sólo
      // significa que el backend se está reiniciando.
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Seguimiento del trabajo en curso.
  useEffect(() => {
    if (!trabajo || trabajo.estado !== 'corriendo') return;
    const id = trabajo.id;
    reloj.current = window.setInterval(async () => {
      try {
        const { data } = await mantenimientoApi.trabajo(id);
        setTrabajo(data);
        if (data.estado !== 'corriendo') {
          if (data.estado === 'ok') toast.success(`${TITULOS[data.tipo] || data.tipo}: listo`);
          else toast.error(`${TITULOS[data.tipo] || data.tipo}: revisa la bitácora`);
          cargar();
        }
      } catch {
        // Si el backend se reinició (revertir / actualizar), dejamos de
        // preguntar: el resultado queda en la bitácora del equipo.
        setTrabajo((t) => (t ? { ...t, estado: 'desconocido' } : t));
      }
    }, 3000);
    return () => { if (reloj.current) window.clearInterval(reloj.current); };
  }, [trabajo, cargar]);

  const lanzar = async (fn: () => Promise<any>, aviso?: string) => {
    try {
      const { data } = await fn();
      setTrabajo({
        id: data.trabajo, tipo: data.trabajo.split('-')[0], estado: 'corriendo',
        codigo: null, desprendido: !!data.reinicia, segundos: 0, log: '', error: null,
      });
      setVerLog(true);
      toast.success(aviso || data.mensaje || 'En marcha');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'No se pudo iniciar');
    }
  };

  const buscarActualizacion = async () => {
    setBuscandoActu(true);
    try {
      const { data } = await mantenimientoApi.actualizacion();
      setActu(data);
      if (data.disponible) toast.success(`Hay una versión nueva: ${data.version_nueva}`);
      else if (data.error) toast.error(data.error);
      else toast.success('Ya está en la versión más reciente');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'No se pudo consultar');
    } finally {
      setBuscandoActu(false);
    }
  };

  if (cargando) {
    return <div className="card text-sm text-slate-400">Leyendo el estado del equipo…</div>;
  }
  if (!estado?.on_premise) {
    return (
      <div className="card text-sm text-slate-400">
        Esta sección sólo está disponible cuando el POS está instalado en la computadora del negocio.
      </div>
    );
  }

  const corriendo = trabajo?.estado === 'corriendo';
  const pocoDisco = (estado.disco_libre_bytes ?? Infinity) < 2 * 1073741824;
  const sinRespaldos = (estado.respaldos_total || 0) === 0;

  return (
    <div className="space-y-4">

      {/* ---------------------------------------------------------- Versión */}
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2 text-slate-300">
              <HardDrive size={15} /> Este equipo
            </h3>
            <p className="text-3xl font-bold text-white mt-2 tabular-nums">v{estado.version}</p>
            <p className="text-xs text-slate-500">
              {estado.version_previa ? `Antes: v${estado.version_previa} · ` : ''}
              {estado.fecha_version ? `Instalada el ${estado.fecha_version}` : ''}
            </p>
            <p className="text-[11px] text-slate-600 font-mono mt-1">{estado.install_dir}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-right">
            <div>
              <p className="text-[11px] text-slate-500">Base de datos</p>
              <p className="text-sm font-semibold text-white tabular-nums">{tam(estado.base_datos_bytes)}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Imágenes</p>
              <p className="text-sm font-semibold text-white tabular-nums">
                {estado.imagenes?.archivos ?? 0} <span className="text-slate-500 font-normal">({tam(estado.imagenes?.bytes)})</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Respaldos</p>
              <p className="text-sm font-semibold text-white tabular-nums">{estado.respaldos_total ?? 0}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Disco libre</p>
              <p className={`text-sm font-semibold tabular-nums ${pocoDisco ? 'text-amber-400' : 'text-white'}`}>
                {tam(estado.disco_libre_bytes)}
              </p>
            </div>
          </div>
        </div>

        {sinRespaldos && (
          <div className="mt-4 flex items-start gap-2 bg-amber-900/20 border border-amber-700/40 rounded-xl p-3">
            <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-200">
              Todavía no hay ningún respaldo en este equipo. Haz uno antes de cualquier otra cosa:
              es lo que permite regresar si algo sale mal.
            </p>
          </div>
        )}
        {pocoDisco && (
          <div className="mt-3 flex items-start gap-2 bg-amber-900/20 border border-amber-700/40 rounded-xl p-3">
            <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-200">
              Queda poco espacio libre en el disco. Un respaldo necesita al menos el doble de lo que
              pesan la base y las imágenes.
            </p>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------- Respaldar */}
      <div className="card">
        <h3 className="font-bold text-sm flex items-center gap-2 text-slate-300 mb-1">
          <ShieldCheck size={15} /> Respaldar todo
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Guarda la base de datos completa, todas las imágenes, un Excel con todas las tablas y la
          lista de ajustes activos. El punto de venta se detiene unos segundos.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={corriendo}
            onClick={() => lanzar(() => mantenimientoApi.respaldar({ etiqueta: 'manual' }))}
            className="flex items-center gap-2 bg-iados-primary text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-40"
          >
            <Database size={15} /> Respaldo completo
          </button>
          <button
            disabled={corriendo}
            onClick={() => lanzar(() => mantenimientoApi.respaldar({ etiqueta: 'rapido', sin_excel: true }))}
            className="flex items-center gap-2 bg-iados-card text-slate-300 text-sm px-4 py-2 rounded-xl disabled:opacity-40"
          >
            <Clock size={15} /> Rápido (sin Excel)
          </button>
          <button
            disabled={corriendo}
            onClick={() => lanzar(() => mantenimientoApi.excel())}
            className="flex items-center gap-2 bg-iados-card text-slate-300 text-sm px-4 py-2 rounded-xl disabled:opacity-40"
          >
            <FileSpreadsheet size={15} /> Sólo Excel
          </button>
          <button
            disabled={corriendo}
            onClick={() => lanzar(() => mantenimientoApi.ajustes())}
            className="flex items-center gap-2 bg-iados-card text-slate-300 text-sm px-4 py-2 rounded-xl disabled:opacity-40"
          >
            <Sliders size={15} /> Ver ajustes activos
          </button>
        </div>
        {estado.ultimo_respaldo && (
          <p className="text-[11px] text-slate-500 mt-3">
            Último respaldo: <span className="text-slate-300">{estado.ultimo_respaldo.nombre}</span> ·{' '}
            {cuando(estado.ultimo_respaldo.fecha)} · {tam(estado.ultimo_respaldo.bytes)}
          </p>
        )}
      </div>

      {/* --------------------------------------------------------- Imágenes */}
      <div className="card">
        <h3 className="font-bold text-sm flex items-center gap-2 text-slate-300 mb-1">
          <ImageIcon size={15} /> Imágenes y sus direcciones
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Revisa las direcciones de todas las imágenes del sistema (productos, categorías, logos,
          tickets, banners). «Ajustar» corrige las que apuntan a una ruta vieja y descarga las que
          viven en internet para dejarlas en este equipo.
          <span className="text-slate-300"> Ninguna dirección se borra nunca:</span> lo que no se
          pueda recuperar se deja igual y sale listado en el reporte.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={corriendo}
            onClick={() => lanzar(() => mantenimientoApi.imagenes(false))}
            className="flex items-center gap-2 bg-iados-card text-slate-300 text-sm px-4 py-2 rounded-xl disabled:opacity-40"
          >
            <ImageIcon size={15} /> Revisar (no cambia nada)
          </button>
          <button
            disabled={corriendo}
            onClick={() => {
              if (!confirm('Se van a ajustar las direcciones de las imágenes. Ninguna se borra. ¿Continuar?')) return;
              lanzar(() => mantenimientoApi.imagenes(true));
            }}
            className="flex items-center gap-2 bg-amber-600/90 text-white text-sm px-4 py-2 rounded-xl disabled:opacity-40"
          >
            <RefreshCw size={15} /> Ajustar direcciones
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------- Actualizar */}
      <div className="card">
        <h3 className="font-bold text-sm flex items-center gap-2 text-slate-300 mb-1">
          <Rocket size={15} /> Actualizar el sistema
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Antes de tocar nada se respalda todo. No se borra ningún dato, ninguna imagen y ningún
          ajuste. Si la versión nueva no arranca, el equipo regresa solo a la v{estado.version} y
          sigue vendiendo.
        </p>

        {estado.actualizacion?.automatica_disponible ? (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                disabled={corriendo || buscandoActu}
                onClick={buscarActualizacion}
                className="flex items-center gap-2 bg-iados-card text-slate-300 text-sm px-4 py-2 rounded-xl disabled:opacity-40"
              >
                <RefreshCw size={15} className={buscandoActu ? 'animate-spin' : ''} /> Buscar actualización
              </button>
              {actu?.disponible && !confirmarActu && (
                <button
                  disabled={corriendo}
                  onClick={() => setConfirmarActu(true)}
                  className="flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-40"
                >
                  <Rocket size={15} /> Actualizar a v{actu.version_nueva}
                </button>
              )}
            </div>

            {actu && !actu.disponible && !actu.error && (
              <p className="text-xs text-emerald-400 mt-3 flex items-center gap-1.5">
                <CheckCircle size={14} /> Está en la versión más reciente (v{actu.version_actual}).
              </p>
            )}
            {actu?.error && (
              <p className="text-xs text-amber-300 mt-3">{actu.error}</p>
            )}
            {actu?.notas && (
              <div className="mt-3 bg-iados-card rounded-xl p-3 text-xs text-slate-300 whitespace-pre-wrap">{actu.notas}</div>
            )}

            {confirmarActu && (
              <div className="mt-4 border border-emerald-700/50 bg-emerald-900/15 rounded-xl p-4 space-y-3">
                <p className="text-sm text-emerald-200 font-medium">
                  Va a actualizar de la v{estado.version} a la v{actu?.version_nueva}.
                </p>
                <ul className="text-xs text-slate-300 space-y-1 list-disc pl-5">
                  <li>Primero se respalda base de datos, imágenes, Excel y ajustes.</li>
                  <li>
                    <strong>Después se ensaya contra una copia de su base, con el sistema todavía
                    trabajando.</strong> Si la versión nueva perdiera un solo dato, la actualización se
                    cancela sola ahí mismo y nada se detiene.
                  </li>
                  <li>El punto de venta se detiene unos minutos y vuelve solo.</li>
                  <li>Si algo falla, regresa por sí mismo a la versión de hoy.</li>
                  <li>Después queda un reporte con todo lo que cambió.</li>
                </ul>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setConfirmarActu(false);
                      lanzar(() => mantenimientoApi.actualizar());
                    }}
                    className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-xl"
                  >
                    Sí, actualizar ahora
                  </button>
                  <button
                    onClick={() => setConfirmarActu(false)}
                    className="bg-iados-card text-slate-400 text-sm px-4 py-2 rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-iados-card rounded-xl p-3 text-xs text-slate-300">
            {estado.actualizacion?.nota}
          </div>
        )}

        {estado.ultima_actualizacion && (
          <details className="mt-4">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-200">
              Ver el reporte de la última actualización
            </summary>
            <pre className="mt-2 bg-black/40 rounded-xl p-3 text-[11px] text-slate-300 overflow-x-auto max-h-80">
              {estado.ultima_actualizacion}
            </pre>
          </details>
        )}
      </div>

      {/* --------------------------------------------------------- Respaldos */}
      <div className="card">
        <h3 className="font-bold text-sm flex items-center gap-2 text-slate-300 mb-1">
          <RotateCcw size={15} /> Regresar a un respaldo
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Devuelve el equipo exactamente al estado que tenía en ese momento. Antes de restaurar se
          guarda el estado de hoy, así que esto también se puede deshacer.
        </p>

        {respaldos.length === 0 ? (
          <p className="text-xs text-slate-500">Todavía no hay respaldos.</p>
        ) : (
          <div className="space-y-2">
            {respaldos.map((r) => (
              <div key={r.nombre} className="flex flex-wrap items-center justify-between gap-3 bg-iados-card rounded-xl px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{r.nombre}</p>
                  <p className="text-[11px] text-slate-500">
                    {cuando(r.fecha)} · {tam(r.bytes)}
                    {r.version ? ` · v${r.version}` : ''}
                    {r.tablas != null ? ` · ${r.tablas} tablas` : ''}
                    {r.imagenes != null ? ` · ${r.imagenes} imágenes` : ''}
                    {r.tiene_excel ? ' · con Excel' : ''}
                  </p>
                  {!r.completo && (
                    <p className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
                      <AlertTriangle size={11} /> Incompleto: no se puede restaurar
                    </p>
                  )}
                </div>
                <button
                  disabled={corriendo || !r.completo}
                  onClick={() => { setARevertir(r); setFrase(''); }}
                  className="flex items-center gap-1.5 text-xs text-orange-300 border border-orange-700/50 hover:bg-orange-900/25 px-3 py-1.5 rounded-lg disabled:opacity-30"
                >
                  <RotateCcw size={13} /> Regresar aquí
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------ Confirmar revertir */}
      {aRevertir && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-iados-dark border border-orange-700/50 rounded-2xl p-6 max-w-lg w-full space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-400" /> Regresar al respaldo
            </h3>
            <p className="text-sm text-slate-300">
              Se va a restaurar <span className="font-mono text-white">{aRevertir.nombre}</span>{' '}
              ({cuando(aRevertir.fecha)}). Todo lo que se haya capturado después de ese momento
              dejará de estar en el sistema.
            </p>
            <p className="text-xs text-slate-400">
              Antes de restaurar se guarda automáticamente el estado de hoy, para que esto también
              se pueda deshacer. El sistema se reinicia: vuelve a entrar en un par de minutos.
            </p>
            <div>
              <label className="text-xs text-slate-400">Escribe <span className="font-mono text-orange-300">REGRESAR</span> para confirmar</label>
              <input
                value={frase}
                onChange={(e) => setFrase(e.target.value)}
                className="input w-full mt-1 font-mono"
                placeholder="REGRESAR"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setARevertir(null)} className="text-sm text-slate-400 px-4 py-2">Cancelar</button>
              <button
                disabled={frase.trim().toUpperCase() !== 'REGRESAR'}
                onClick={() => {
                  const r = aRevertir;
                  setARevertir(null);
                  lanzar(() => mantenimientoApi.revertir(r.nombre));
                }}
                className="bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-30"
              >
                Regresar a ese respaldo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------- Trabajo / log */}
      {trabajo && (
        <div className="card border border-iados-primary/40">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-sm flex items-center gap-2 text-slate-200">
              {trabajo.estado === 'corriendo' && <RefreshCw size={15} className="animate-spin text-iados-primary" />}
              {trabajo.estado === 'ok' && <CheckCircle size={15} className="text-emerald-400" />}
              {trabajo.estado === 'error' && <XCircle size={15} className="text-red-400" />}
              {trabajo.estado === 'desconocido' && <Clock size={15} className="text-amber-400" />}
              {TITULOS[trabajo.tipo] || trabajo.tipo}
              <span className="text-xs text-slate-500 font-normal tabular-nums">{trabajo.segundos}s</span>
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setVerLog((v) => !v)} className="text-xs text-slate-400 flex items-center gap-1">
                <Terminal size={13} /> {verLog ? 'Ocultar' : 'Ver'} bitácora
              </button>
              {trabajo.estado !== 'corriendo' && (
                <button onClick={() => setTrabajo(null)} className="text-xs text-slate-500">Cerrar</button>
              )}
            </div>
          </div>

          {trabajo.desprendido && trabajo.estado !== 'ok' && (
            <p className="text-xs text-amber-200 mt-2">
              El sistema se va a reiniciar para terminar. Esta pantalla puede quedarse sin conexión
              un rato: espera un par de minutos y vuelve a entrar. El resultado completo queda en el
              reporte del equipo.
            </p>
          )}
          {trabajo.estado === 'desconocido' && !trabajo.desprendido && (
            <p className="text-xs text-amber-200 mt-2">
              Se perdió el contacto con el servicio. Revisa el reporte en el equipo.
            </p>
          )}
          {trabajo.error && <p className="text-xs text-red-300 mt-2">{trabajo.error}</p>}

          {verLog && (
            <pre className="mt-3 bg-black/50 rounded-xl p-3 text-[11px] text-slate-300 overflow-auto max-h-96 whitespace-pre-wrap">
              {trabajo.log || 'Sin salida todavía…'}
            </pre>
          )}
        </div>
      )}

      <p className="text-[11px] text-slate-600">
        Todo esto también se puede hacer sin entrar al sistema, desde los accesos que quedaron en la
        carpeta de instalación: RESPALDAR.bat, REVERTIR.bat, ACTUALIZAR.bat y MANTENIMIENTO.bat.
      </p>
    </div>
  );
}
