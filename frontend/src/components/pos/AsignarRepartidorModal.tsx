import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Bike, X, ScanLine, WifiOff } from 'lucide-react';
import { repartidoresCtlApi } from '../../api/endpoints';
import { hayConexion } from '../../api/conexion';
import { money } from '../../utils/money';
import { EVENTO_VENTA_COBRADA, VentaCobradaDetalle } from '../../utils/ventaCobrada';
import { useRepartidoresCtlStore } from '../../store/repartidoresCtl.store';

// Control de Repartidores: despues de un cobro normal, pregunta quien lleva el pedido.
// Solo existe si el superadmin lo habilito para la tienda (MainLayout lo monta).
// El cobro ya termino cuando esto aparece: saltarlo nunca afecta la venta.

const COLA_KEY = 'pos_rep_asig_pend';
const listaKey = (tiendaId: number) => `pos_rep_lista_${tiendaId}`;
const SIETE_DIAS = 7 * 24 * 3600 * 1000;

interface RepartidorLista { id: number; nombre: string; codigo: string; activo: boolean }

// Asignacion hecha sin internet (o de una venta que aun no sube): se manda sola despues.
interface PendienteEnvio {
  id: string;
  venta_id?: number;
  folio_offline?: string;
  codigo?: string;
  repartidor_id?: number;
  nombre?: string;
  folio?: string;
  tienda_id: number;
  ts: number;
}

const normalizar = (c: string) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

function leerCola(): PendienteEnvio[] {
  try {
    const r = JSON.parse(localStorage.getItem(COLA_KEY) || '[]');
    return Array.isArray(r) ? r : [];
  } catch { return []; }
}
function guardarCola(c: PendienteEnvio[]) {
  try { localStorage.setItem(COLA_KEY, JSON.stringify(c)); } catch { /* sin espacio: no se bloquea el POS */ }
}
function quitarDeCola(id: string) {
  guardarCola(leerCola().filter((x) => x.id !== id));
}

export default function AsignarRepartidorModal({ tiendaId }: { tiendaId: number | null | undefined }) {
  const [cola, setCola] = useState<VentaCobradaDetalle[]>([]);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [lista, setLista] = useState<RepartidorLista[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const drenando = useRef(false);
  const actual = cola[0] || null;

  // ── Ventas cobradas (aviso de PayModal / Pedidos) ──────────────────
  useEffect(() => {
    const h = (e: Event) => {
      const d: VentaCobradaDetalle = (e as CustomEvent).detail || {};
      const { habilitado, preguntar } = useRepartidoresCtlStore.getState();
      if (!habilitado) return;
      if (preguntar === 'para_llevar' && d.tipo_servicio !== 'para_llevar') return;
      if (!d.venta_id && !d.folio_offline) return;
      setCola((c) => (c.some((x) => (d.venta_id && x.venta_id === d.venta_id) || (d.folio_offline && x.folio_offline === d.folio_offline))
        ? c
        : [...c, d]));
    };
    window.addEventListener(EVENTO_VENTA_COBRADA, h);
    return () => window.removeEventListener(EVENTO_VENTA_COBRADA, h);
  }, []);

  // ── Lista de repartidores (para los botones y para validar sin internet) ──
  const cargarLista = useCallback(async () => {
    if (!tiendaId) return;
    try {
      const { data } = await repartidoresCtlApi.repartidores();
      const activos = (data || []).filter((r: RepartidorLista) => r.activo);
      setLista(activos);
      try { localStorage.setItem(listaKey(tiendaId), JSON.stringify(activos)); } catch { /* */ }
    } catch {
      try { setLista(JSON.parse(localStorage.getItem(listaKey(tiendaId)) || '[]')); } catch { setLista([]); }
    }
  }, [tiendaId]);

  useEffect(() => { cargarLista(); }, [cargarLista]);
  // Al abrirse para una venta nueva se refresca (altas/bajas recientes).
  const hayActual = !!actual;
  useEffect(() => { if (hayActual) cargarLista(); }, [hayActual, cargarLista]);

  // ── Envio de lo pendiente (sin internet / venta aun no sincronizada) ──
  const drenar = useCallback(async () => {
    if (drenando.current || !tiendaId || !hayConexion()) return;
    if (!useRepartidoresCtlStore.getState().habilitado) return;
    const pendientes = leerCola().filter((p) => p.tienda_id === tiendaId);
    if (!pendientes.length) return;
    drenando.current = true;
    try {
      for (const p of pendientes) {
        try {
          await repartidoresCtlApi.asignar({
            venta_id: p.venta_id, folio_offline: p.folio_offline,
            codigo: p.codigo, repartidor_id: p.repartidor_id, origen: 'sin_internet',
          });
          quitarDeCola(p.id);
        } catch (err: any) {
          const st = err?.response?.status;
          if (!err?.response || st === 401 || st >= 500) break;      // sin red o sesion: despues
          if (st === 404) {                                           // la venta aun no sube
            if (Date.now() - p.ts > SIETE_DIAS) quitarDeCola(p.id);
            continue;
          }
          quitarDeCola(p.id);                                        // 400/403/409: no se puede
          toast.error(`Pedido ${p.folio || ''}${p.nombre ? ` (${p.nombre})` : ''}: ${err.response?.data?.message || 'no se pudo asignar'}`, { duration: 7000 });
        }
      }
    } finally {
      drenando.current = false;
    }
  }, [tiendaId]);

  useEffect(() => {
    drenar();
    const t = setInterval(drenar, 30000);
    const alVolver = () => setTimeout(drenar, 3000);
    window.addEventListener('online', alVolver);
    window.addEventListener('conexion:cambio', alVolver);
    return () => {
      clearInterval(t);
      window.removeEventListener('online', alVolver);
      window.removeEventListener('conexion:cambio', alVolver);
    };
  }, [drenar]);

  // ── Foco: el POS reenfoca su buscador al cerrar el cobro; aqui se recupera ──
  useEffect(() => {
    if (!hayActual) return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    const h = (e: FocusEvent) => {
      if (e.target === inputRef.current) return;
      setTimeout(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) inputRef.current.focus();
      }, 0);
    };
    document.addEventListener('focusin', h, true);
    return () => { clearTimeout(t); document.removeEventListener('focusin', h, true); };
  }, [hayActual]);

  const siguiente = () => {
    setCola((c) => c.slice(1));
    setCodigo('');
    setError('');
  };

  const asignar = async (sel: { codigo?: string; repartidor_id?: number }, origen: 'escaner' | 'lista') => {
    if (!actual || enviando || !tiendaId) return;
    const cod = sel.codigo !== undefined ? normalizar(sel.codigo) : undefined;
    if (sel.codigo !== undefined && !cod) return;
    const local = cod ? lista.find((r) => r.codigo === cod) : lista.find((r) => r.id === sel.repartidor_id);
    const folio = actual.folio || actual.folio_offline || '';

    const guardarParaDespues = (porque: string) => {
      guardarCola([...leerCola(), {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        venta_id: actual.venta_id || undefined,
        folio_offline: actual.folio_offline || undefined,
        codigo: cod,
        repartidor_id: sel.repartidor_id,
        nombre: local?.nombre,
        folio,
        tienda_id: tiendaId,
        ts: Date.now(),
      }]);
      toast(`${folio} → ${local?.nombre || 'repartidor'} (${porque}). Se registra solo al volver la conexión.`, { icon: '📡', duration: 5000 });
      siguiente();
    };

    // Sin internet o venta guardada sin internet: se valida con la ultima lista conocida.
    if (!actual.venta_id || !hayConexion()) {
      if (cod && lista.length && !local) {
        setError('Ese código no es de un repartidor activo. Revisa el gafete.');
        setCodigo('');
        return;
      }
      guardarParaDespues(actual.venta_id ? 'sin internet' : 'venta sin internet');
      return;
    }

    setEnviando(true);
    setError('');
    try {
      const { data } = await repartidoresCtlApi.asignar({ codigo: cod, repartidor_id: sel.repartidor_id, venta_id: actual.venta_id, origen });
      const r = data?.resumen || {};
      toast.success(`${folio} → ${data?.repartidor?.nombre}. Lleva ${r.pedidos} pedido(s), $${money(r.efectivo)} en efectivo por entregar`, { duration: 4000 });
      siguiente();
    } catch (err: any) {
      if (!err?.response) guardarParaDespues('sin conexión');
      else {
        setError(err.response?.data?.message || 'No se pudo asignar');
        setCodigo('');
      }
    } finally {
      setEnviando(false);
    }
  };

  if (!actual) return null;

  const sinRed = !actual.venta_id || !hayConexion();

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Nada de lo que se teclee aqui debe llegar a los atajos del POS (F12, Enter de la tarjeta...).
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); siguiente(); return; }
    if ((e.key === 'Enter' || e.key === 'Tab') && e.target === inputRef.current) {
      e.preventDefault();
      if (codigo.trim()) asignar({ codigo }, 'escaner');
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/70 flex items-center justify-center p-4" onKeyDown={onKeyDown}>
      <div className="card w-full max-w-md space-y-4" role="dialog" aria-modal="true" aria-labelledby="rep-asig-titulo">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-iados-primary/20 flex items-center justify-center shrink-0">
            <Bike size={24} className="text-iados-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="rep-asig-titulo" className="text-lg font-bold leading-tight">¿Quién lleva este pedido?</h2>
            <p className="text-sm text-slate-400 truncate">
              {actual.folio || actual.folio_offline} · ${money(actual.total)}
              {cola.length > 1 && <span className="ml-2 text-amber-400">(1 de {cola.length})</span>}
            </p>
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={siguiente}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-iados-card"
            aria-label="Cerrar sin asignar"
            title="Sin repartidor (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative">
          <ScanLine size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            ref={inputRef}
            value={codigo}
            onChange={(e) => { setCodigo(e.target.value); setError(''); }}
            onBlur={() => setTimeout(() => {
              if (inputRef.current && document.activeElement !== inputRef.current) inputRef.current.focus();
            }, 0)}
            placeholder="Escanea el QR del gafete"
            className="input-touch w-full pl-10 text-lg tracking-widest uppercase"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            readOnly={enviando}
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
        )}

        {sinRed && (
          <p className="text-xs text-amber-300 flex items-center gap-2">
            <WifiOff size={14} /> Sin conexión: se guarda y se registra solo cuando vuelva.
          </p>
        )}

        {lista.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">O tócalo en la lista:</p>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {lista.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => asignar({ repartidor_id: r.id }, 'lista')}
                  disabled={enviando}
                  className="px-3 py-2 rounded-lg bg-iados-card border border-slate-600 hover:border-iados-accent text-sm"
                >
                  {r.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={siguiente}
            className="btn-secondary flex-1"
          >
            Sin repartidor <span className="text-xs opacity-60">(Esc)</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => codigo.trim() && asignar({ codigo }, 'escaner')}
            disabled={enviando || !codigo.trim()}
            className="btn-primary flex-1"
          >
            {enviando ? 'Asignando…' : <>Asignar <span className="text-xs opacity-60">(Enter)</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}
