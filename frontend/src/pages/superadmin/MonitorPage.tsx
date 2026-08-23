import { useState, useEffect, useMemo, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { Activity, Users, Store, Smartphone, MonitorSmartphone } from 'lucide-react';
import { alTenerPresencia } from '../../api/presencia';
import { etiquetaDeRuta } from '../../components/layout/navItems';
import { tiendasApi } from '../../api/endpoints';
import { usePageHeader } from '../../store/pageHeader.store';

interface Dispositivo { navegador: string; sistema: string; movil: boolean }
interface Sesion {
  socket_id: string; usuario_id: number; nombre: string; rol: string;
  tienda_id: number | null; dispositivo: Dispositivo;
  pantalla_actual: string; pantalla_desde: number; conectado_desde: number; rastro: string[];
}
interface UsuarioEnLinea { usuario_id: number; nombre: string; rol: string; sesiones: Sesion[] }
interface GrupoTienda { tienda_id: number | null; usuarios: UsuarioEnLinea[] }
interface Snapshot {
  grupos: GrupoTienda[]; total_usuarios: number; total_sesiones: number; total_tiendas: number;
}

const VACIO: Snapshot = { grupos: [], total_usuarios: 0, total_sesiones: 0, total_tiendas: 0 };

/** Cuanto dura el resaltado de una fila que acaba de cambiar de pantalla. */
const FLASH_MS = 2500;

/**
 * Ventana para agrupar altas/bajas antes de volver a pedir la foto completa.
 * Tras un redeploy, N usuarios reconectan a la vez: sin esto serian N snapshots
 * completos serializados por cada monitor abierto.
 */
const RESYNC_MS = 500;

function hace(desde: number, ahora: number): string {
  const min = Math.floor((ahora - desde) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

export default function MonitorPage() {
  usePageHeader({ title: 'Monitor', subtitle: 'Usuarios en linea en tiempo real' });

  const [snapshot, setSnapshot] = useState<Snapshot>(VACIO);
  const [conectado, setConectado] = useState(false);
  const [tiendas, setTiendas] = useState<Record<number, string>>({});
  const [flash, setFlash] = useState<Record<string, number>>({});
  // Fuerza el recalculo de los "hace 4m" sin pedir nada al servidor.
  const [ahora, setAhora] = useState(Date.now());
  const flashTimers = useRef<Record<string, any>>({});

  // El nombre de la tienda no viaja en el JWT ni en la sesion: se resuelve aqui.
  // Para un superadmin, /tiendas devuelve todas, sin filtro de tenant.
  useEffect(() => {
    tiendasApi.list()
      .then(r => {
        const mapa: Record<number, string> = {};
        (r.data || []).forEach((t: any) => { mapa[t.id] = t.nombre; });
        setTiendas(mapa);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Un solo temporizador de resync para toda la pantalla, vivo aunque el socket
  // se reemplace; se limpia al desmontar.
  const resyncTimer = useRef<any>(null);

  // El socket lo crea usePresencia() en MainLayout, que es ANCESTRO de esta
  // pantalla, y React corre los efectos de hijo a padre: con un F5 directo sobre
  // /superadmin/monitor, aqui todavia no existe. Por eso no se lee el singleton
  // sino que se pide que avisen cuando exista (y otra vez si se reemplaza).
  useEffect(() => {
    let vivo = true;
    let soltarSocket: (() => void) | null = null;

    const engancharse = (socket: Socket) => {
      const marcarFlash = (socketId: string) => {
        setFlash(f => ({ ...f, [socketId]: Date.now() }));
        clearTimeout(flashTimers.current[socketId]);
        flashTimers.current[socketId] = setTimeout(() => {
          setFlash(f => { const { [socketId]: _, ...resto } = f; return resto; });
        }, FLASH_MS);
      };

      // La foto completa sigue siendo la verdad — reconciliar altas y bajas a
      // mano contra la estructura anidada seria mas codigo y mas bugs. Lo que se
      // arregla es el volumen: el primer evento de una rafaga agenda UNA foto y
      // los demas se suben a esa; nunca mas de una peticion por RESYNC_MS.
      const resincronizar = () => {
        if (resyncTimer.current) return;
        resyncTimer.current = setTimeout(() => {
          resyncTimer.current = null;
          socket.emit('monitor-join');
        }, RESYNC_MS);
      };

      const onSnapshot = (s: Snapshot) => { setSnapshot(s); setConectado(true); };
      const onAlta = resincronizar;
      const onBaja = resincronizar;
      const onPantalla = (d: { socket_id: string; ruta: string; desde: number }) => {
        setSnapshot(prev => ({
          ...prev,
          grupos: prev.grupos.map(g => ({
            ...g,
            usuarios: g.usuarios.map(u => ({
              ...u,
              sesiones: u.sesiones.map(s =>
                s.socket_id === d.socket_id
                  ? { ...s, pantalla_actual: d.ruta, pantalla_desde: d.desde, rastro: [...s.rastro, d.ruta].slice(-5) }
                  : s,
              ),
            })),
          })),
        }));
        marcarFlash(d.socket_id);
      };

      // Con nombre, no anonimos: hay que poder quitarlos al desmontar. El socket
      // sobrevive a esta pantalla (lo abrio MainLayout), asi que un listener que
      // no se quita se acumula cada vez que se entra al monitor.
      const onDesconectado = () => setConectado(false);
      const onConectado = () => socket.emit('monitor-join');

      socket.on('presencia:snapshot', onSnapshot);
      socket.on('presencia:alta', onAlta);
      socket.on('presencia:baja', onBaja);
      socket.on('presencia:pantalla', onPantalla);
      socket.on('disconnect', onDesconectado);
      socket.on('connect', onConectado);

      // Entrar a la room es inmediato, nunca diferido: es lo que hace que
      // lleguen los deltas. Si el socket ya estaba conectado, 'connect' no
      // vuelve a dispararse y hay que unirse aqui; si aun no lo esta, se une
      // onConectado (emitir antes solo lo dejaria en el buffer y produciria dos
      // snapshots al arrancar).
      if (socket.connected) {
        socket.emit('monitor-join');
        setConectado(true);
      }

      return () => {
        socket.off('presencia:snapshot', onSnapshot);
        socket.off('presencia:alta', onAlta);
        socket.off('presencia:baja', onBaja);
        socket.off('presencia:pantalla', onPantalla);
        socket.off('disconnect', onDesconectado);
        socket.off('connect', onConectado);
        clearTimeout(resyncTimer.current);
        resyncTimer.current = null;
        // El socket sobrevive a esta pantalla: hay que salirse de la room o el
        // backend seguiria difundiendo deltas a un monitor que ya no existe.
        try { if (socket.connected) socket.emit('monitor-leave'); } catch { /* ignorado */ }
      };
    };

    const desuscribir = alTenerPresencia(socket => {
      if (!vivo) return;
      soltarSocket?.();
      soltarSocket = engancharse(socket);
    });

    return () => {
      vivo = false;
      desuscribir();
      soltarSocket?.();
      Object.values(flashTimers.current).forEach(clearTimeout);
    };
  }, []);

  const nombreTienda = (id: number | null) =>
    id === null ? 'Sin tienda asignada' : tiendas[id] || `Tienda ${id}`;

  const hayGente = useMemo(() => snapshot.total_sesiones > 0, [snapshot.total_sesiones]);

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      {/* El titulo lo pone usePageHeader, como en el resto de pantallas de
          superadmin; aqui solo va la fila de estado y contadores. */}
      <div className="flex items-center justify-end flex-wrap gap-2">
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className={`flex items-center gap-1.5 ${conectado ? 'text-green-400' : 'text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${conectado ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {conectado ? 'En vivo' : 'Sin conexion'}
          </span>
          <span className="flex items-center gap-1"><Users size={14} /> {snapshot.total_usuarios} usuarios</span>
          <span>{snapshot.total_sesiones} sesiones</span>
          <span className="flex items-center gap-1"><Store size={14} /> {snapshot.total_tiendas} tiendas</span>
        </div>
      </div>

      {!hayGente && (
        <div className="text-center text-slate-500 py-16">
          <Activity size={40} className="mx-auto mb-3 opacity-50" />
          <p>No hay usuarios en linea en este momento</p>
        </div>
      )}

      {snapshot.grupos.map(grupo => (
        <div key={String(grupo.tienda_id)} className="bg-iados-surface rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Store size={15} className="text-slate-400" /> {nombreTienda(grupo.tienda_id)}
            </h2>
            <span className="text-xs text-slate-400">{grupo.usuarios.length} en linea</span>
          </div>

          <div className="divide-y divide-slate-700/50">
            {grupo.usuarios.map(u => {
              const reciente = u.sesiones.some(s => flash[s.socket_id]);
              return (
                <div
                  key={u.usuario_id}
                  className={`px-4 py-3 transition-colors duration-700 ${reciente ? 'bg-iados-primary/15' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <span className="text-white font-medium">{u.nombre}</span>
                      <span className="ml-2 text-xs text-slate-500">{u.rol}</span>
                      {u.sesiones.length > 1 && (
                        <span className="ml-2 text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">
                          {u.sesiones.length} pestanas
                        </span>
                      )}
                    </div>
                  </div>

                  {u.sesiones.map(s => (
                    <div key={s.socket_id} className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
                      <span className="inline-flex items-center gap-1 bg-iados-primary/20 text-iados-primary px-2 py-0.5 rounded-full font-medium">
                        {etiquetaDeRuta(s.pantalla_actual)}
                      </span>
                      <span className="text-slate-500">{hace(s.pantalla_desde, ahora)}</span>
                      <span className="text-slate-500 flex items-center gap-1">
                        {s.dispositivo.movil ? <Smartphone size={11} /> : <MonitorSmartphone size={11} />}
                        {s.dispositivo.navegador} / {s.dispositivo.sistema}
                      </span>
                      {s.rastro.length > 1 && (
                        <span className="text-slate-600">
                          {s.rastro.map(r => etiquetaDeRuta(r)).join(' → ')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
