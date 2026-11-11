import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import {
  Bike, RefreshCw, ArrowLeft, Printer, Plus, Save, Power, KeyRound, QrCode, History, LayoutGrid,
  AlertTriangle, CheckCircle2, Repeat, Trash2, X,
} from 'lucide-react';
import { repartidoresCtlApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/auth.store';
import { usePageHeader } from '../../store/pageHeader.store';
import { printTicket } from '../../utils/printTicket';
import { configTicketCache } from '../../utils/ticketOffline';
import { money } from '../../utils/money';

type Tab = 'tablero' | 'historial' | 'catalogo';

interface FilaTablero {
  id: number; nombre: string; telefono: string | null; activo: boolean;
  pedidos: number; efectivo: number; total: number; canceladas: number;
  desde: string | null; ultima_liquidacion: string | null;
}
interface RepCatalogo { id: number; nombre: string; telefono: string | null; activo: boolean; codigo: string }

// ── Fechas: dia local del navegador (no toISOString para el dia, ver LogisticaPage) ──
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function rangoLocal(desde: string, hasta: string) {
  const [y1, m1, d1] = desde.split('-').map(Number);
  const [y2, m2, d2] = hasta.split('-').map(Number);
  return {
    desde: new Date(y1, m1 - 1, d1, 0, 0, 0, 0).toISOString(),
    hasta: new Date(y2, m2 - 1, d2, 23, 59, 59, 999).toISOString(),
  };
}
const fechaHora = (v: any) => (v ? new Date(v).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const hora = (v: any) => (v ? new Date(v).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '');
function hace(v: any): string {
  if (!v) return '';
  const min = Math.max(0, Math.round((Date.now() - new Date(v).getTime()) / 60000));
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h ${min % 60} min`;
  return `hace ${Math.floor(h / 24)} día(s)`;
}
const esc = (s: any) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const ESTADO_PILL: Record<string, string> = {
  pendiente: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  liquidada: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  reasignada: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  cancelada: 'bg-slate-500/15 text-slate-300 border-slate-500/40',
};
const ORIGEN: Record<string, string> = { escaner: 'QR', lista: 'Lista', sin_internet: 'Sin internet', reasignacion: 'Reasignación' };

// ── Comprobante de liquidacion (impresora de tickets) ──────────────────
function imprimirLiquidacion(liq: any) {
  const cfg = configTicketCache() || {};
  const w = cfg.columnas || (Number(cfg.ancho_papel) === 58 ? 32 : 42);
  const lr = (a: string, b: string) => a + ' '.repeat(Math.max(1, w - a.length - b.length)) + b;
  const centro = (t: string) => ' '.repeat(Math.max(0, Math.floor((w - t.length) / 2))) + t;
  const raya = '-'.repeat(w);
  const l: string[] = [];
  l.push(centro('LIQUIDACION DE REPARTIDOR'));
  if (liq.tienda_nombre) l.push(centro(String(liq.tienda_nombre).slice(0, w)));
  l.push(raya);
  l.push(lr(`Liquidacion #${liq.id}`, liq.tipo === 'parcial' ? 'PARCIAL' : 'TOTAL'));
  l.push(`Fecha: ${fechaHora(liq.created_at)}`);
  l.push(`Repartidor: ${liq.repartidor_nombre}`);
  l.push(`Recibio: ${liq.usuario_nombre || ''}`);
  l.push(raya);
  l.push(lr('Folio / hora', 'Efectivo'));
  for (const p of liq.pedidos || []) {
    const izq = `${p.folio} ${hora(p.fecha_venta || p.created_at)}`;
    const der = p.venta_cancelada ? 'CANCELADA' : `$${money(p.efectivo)}`;
    l.push(lr(izq.slice(0, w - der.length - 1), der));
  }
  l.push(raya);
  l.push(lr('Pedidos:', String(liq.num_pedidos)));
  l.push(lr('Total vendido:', `$${money(liq.total_vendido)}`));
  l.push(lr('Efectivo esperado:', `$${money(liq.efectivo_esperado)}`));
  l.push(lr('Efectivo recibido:', `$${money(liq.efectivo_recibido)}`));
  const dif = Number(liq.diferencia || 0);
  if (Math.abs(dif) >= 0.005) l.push(lr(dif < 0 ? 'FALTANTE:' : 'SOBRANTE:', `$${money(Math.abs(dif))}`));
  else l.push(lr('Diferencia:', '$0.00'));
  if (liq.notas) { l.push(''); l.push(`Notas: ${liq.notas}`); }
  l.push('', '', 'Firma repartidor: ____________', '', 'Firma caja:       ____________', '');
  printTicket(l.join('\n'), cfg.ancho_papel, cfg.fuente_familia, cfg.fuente_tamano, null, cfg.logo_posicion, 1, cfg.modo_impresion);
}

// ── Gafetes QR (hoja carta, recortables) ───────────────────────────────
async function imprimirGafetes(reps: RepCatalogo[], empresa: string) {
  if (!reps.length) return;
  const ventana = window.open('', '_blank');
  if (!ventana) { toast.error('El navegador bloqueó la ventana de impresión: permite ventanas emergentes'); return; }
  const tarjetas: string[] = [];
  for (const r of reps) {
    const qr = await QRCode.toDataURL(r.codigo, { width: 360, margin: 1, errorCorrectionLevel: 'M' });
    tarjetas.push(`<div class="g"><div class="e">${esc(empresa)}</div><div class="t">REPARTIDOR</div>
      <img src="${qr}" alt=""><div class="n">${esc(r.nombre)}</div><div class="c">${esc(r.codigo)}</div></div>`);
  }
  ventana.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Gafetes de repartidores</title>
    <style>
      *{box-sizing:border-box} body{font-family:Arial,sans-serif;margin:0;padding:12mm;color:#0f172a}
      .hoja{display:flex;flex-wrap:wrap;gap:6mm}
      .g{width:54mm;height:86mm;border:1px dashed #94a3b8;border-radius:3mm;padding:4mm;display:flex;flex-direction:column;align-items:center;text-align:center;break-inside:avoid}
      .e{font-size:9pt;font-weight:bold;line-height:1.1;max-height:2.3em;overflow:hidden}
      .t{font-size:7pt;letter-spacing:.15em;color:#475569;margin:1mm 0 2mm}
      img{width:40mm;height:40mm}
      .n{font-size:12pt;font-weight:bold;margin-top:3mm;line-height:1.15;word-break:break-word}
      .c{font-family:Consolas,monospace;font-size:10pt;letter-spacing:.12em;margin-top:auto}
      .b{margin-bottom:8mm} @media print{.b{display:none} body{padding:6mm}}
    </style></head><body>
    <div class="b"><button onclick="window.print()" style="background:#1e40af;color:#fff;padding:10px 18px;border:0;border-radius:8px;font-size:14px;cursor:pointer">Imprimir</button>
    <span style="margin-left:12px;color:#475569;font-size:13px">Recorta por la línea punteada. El código de abajo sirve si el QR no lee.</span></div>
    <div class="hoja">${tarjetas.join('')}</div></body></html>`);
  ventana.document.close();
}

export default function RepartidoresPage() {
  usePageHeader({ title: 'Repartidores', subtitle: 'Pedidos en ruta, efectivo pendiente y liquidaciones' });
  const { user } = useAuthStore();
  const puedeCatalogo = ['superadmin', 'admin', 'manager'].includes(user?.rol || '');

  const [habilitado, setHabilitado] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('tablero');
  const [detalleId, setDetalleId] = useState<number | null>(null);

  useEffect(() => {
    repartidoresCtlApi.estado()
      .then(({ data }) => setHabilitado(!!data?.habilitado))
      .catch(() => setHabilitado(false));
  }, []);

  if (habilitado === null) {
    return <div className="p-6 text-slate-400">Cargando…</div>;
  }
  if (!habilitado) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-3">
        <Bike size={40} className="text-slate-500" />
        <h2 className="text-lg font-bold">El control de repartidores no está habilitado en esta tienda</h2>
        <p className="text-sm text-slate-400 max-w-md">
          Lo enciende el superadministrador en <strong>Configuración → Conf. Especial → Control de Repartidores</strong>,
          eligiendo la tienda.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {detalleId == null && (
        <div className="flex flex-wrap gap-2">
          {([
            ['tablero', 'Tablero', LayoutGrid],
            ['historial', 'Historial', History],
            ['catalogo', 'Repartidores y QR', QrCode],
          ] as [Tab, string, any][]).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${tab === k
                ? 'bg-iados-primary text-white border-iados-primary'
                : 'bg-iados-surface text-slate-300 border-slate-700 hover:bg-iados-card'}`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      )}

      {detalleId != null
        ? <DetalleRepartidor id={detalleId} onVolver={() => setDetalleId(null)} />
        : tab === 'tablero'
          ? <Tablero onAbrir={setDetalleId} irACatalogo={() => setTab('catalogo')} />
          : tab === 'historial'
            ? <Historial />
            : <Catalogo puedeEditar={puedeCatalogo} empresa={user?.empresa_nombre || ''} />}
    </div>
  );
}

// ════════════════════════ Tablero ════════════════════════
function Tablero({ onAbrir, irACatalogo }: { onAbrir: (id: number) => void; irACatalogo: () => void }) {
  const [datos, setDatos] = useState<{ repartidores: FilaTablero[]; totales: any } | null>(null);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await repartidoresCtlApi.tablero();
      setDatos(data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'No se pudo cargar el tablero');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 30000);
    return () => clearInterval(t);
  }, [cargar]);

  if (!datos) return <div className="text-slate-400">Cargando…</div>;
  const filas = [...datos.repartidores].sort((a, b) => b.efectivo - a.efectivo || b.pedidos - a.pedidos || a.nombre.localeCompare(b.nombre));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card">
          <p className="text-xs uppercase tracking-wider text-slate-500">Pedidos en ruta sin liquidar</p>
          <p className="text-3xl font-bold tabular-nums">{datos.totales.pedidos}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wider text-slate-500">Efectivo por recibir</p>
          <p className="text-3xl font-bold tabular-nums text-amber-300">${money(datos.totales.efectivo)}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wider text-slate-500">Vendido en esos pedidos</p>
          <p className="text-3xl font-bold tabular-nums">${money(datos.totales.total)}</p>
          <p className="text-[11px] text-slate-500">incluye tarjeta y transferencia</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-200">Por repartidor</h3>
        <button onClick={cargar} className="btn-secondary flex items-center gap-2 text-sm" disabled={cargando}>
          <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {filas.length === 0 ? (
        <div className="card text-center space-y-2 py-8">
          <p className="text-slate-300">Aún no hay repartidores dados de alta.</p>
          <button onClick={irACatalogo} className="btn-primary inline-flex items-center gap-2"><Plus size={16} /> Dar de alta repartidores</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filas.map((f) => {
            const debe = f.pedidos > 0;
            return (
              <button
                key={f.id}
                onClick={() => onAbrir(f.id)}
                className={`card text-left space-y-2 border transition hover:border-iados-accent ${debe ? 'border-amber-500/40' : 'border-transparent opacity-80'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-lg truncate">{f.nombre}</span>
                  {debe
                    ? <span className="text-[11px] px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/40 shrink-0">Por liquidar</span>
                    : <span className="text-[11px] px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shrink-0">Al corriente</span>}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Pedidos</p>
                    <p className="text-2xl font-bold tabular-nums">{f.pedidos}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Efectivo que debe entregar</p>
                    <p className={`text-2xl font-bold tabular-nums ${debe ? 'text-amber-300' : ''}`}>${money(f.efectivo)}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 space-y-0.5">
                  {f.desde && <p>Pedido más antiguo sin liquidar: {hace(f.desde)}</p>}
                  {f.canceladas > 0 && (
                    <p className="text-red-300 flex items-center gap-1"><AlertTriangle size={12} /> {f.canceladas} venta(s) cancelada(s): no cuentan, quítalas al liquidar</p>
                  )}
                  <p>Última liquidación: {f.ultima_liquidacion ? fechaHora(f.ultima_liquidacion) : 'ninguna'}</p>
                  {!f.activo && <p className="text-slate-400">Dado de baja (aún debe pedidos)</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════ Detalle + liquidacion ════════════════════════
function DetalleRepartidor({ id, onVolver }: { id: number; onVolver: () => void }) {
  const [info, setInfo] = useState<{ repartidor: any; pedidos: any[] } | null>(null);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [recibido, setRecibido] = useState('');
  const [recibidoTocado, setRecibidoTocado] = useState(false);
  const [notas, setNotas] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<any | null>(null);
  const [accion, setAccion] = useState<{ tipo: 'reasignar' | 'quitar'; pedido: any } | null>(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await repartidoresCtlApi.pendientes(id);
      setInfo(data);
      setSel(new Set((data.pedidos || []).map((p: any) => p.id)));
      setRecibidoTocado(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'No se pudo cargar el detalle');
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const seleccionados = useMemo(() => (info?.pedidos || []).filter((p) => sel.has(p.id)), [info, sel]);
  const esperado = useMemo(() => Math.round(seleccionados.reduce((s, p) => s + Number(p.efectivo || 0), 0) * 100) / 100, [seleccionados]);
  const vendido = useMemo(() => seleccionados.reduce((s, p) => s + (p.venta_cancelada ? 0 : Number(p.total || 0)), 0), [seleccionados]);

  // El recibido se propone igual al esperado mientras el cajero no lo cambie.
  useEffect(() => { if (!recibidoTocado) setRecibido(esperado.toFixed(2)); }, [esperado, recibidoTocado]);

  const recibidoNum = Number(recibido);
  const recibidoValido = recibido.trim() !== '' && Number.isFinite(recibidoNum) && recibidoNum >= 0;
  const diferencia = recibidoValido ? Math.round((recibidoNum - esperado) * 100) / 100 : 0;
  const total = info?.pedidos.length || 0;
  const esParcial = seleccionados.length > 0 && seleccionados.length < total;

  const alternar = (pid: number) => setSel((s) => {
    const n = new Set(s);
    if (n.has(pid)) n.delete(pid); else n.add(pid);
    return n;
  });

  const liquidar = async () => {
    if (!info || !seleccionados.length || !recibidoValido) return;
    setGuardando(true);
    try {
      const { data } = await repartidoresCtlApi.liquidar({
        repartidor_id: info.repartidor.id,
        asignacion_ids: seleccionados.map((p) => p.id),
        efectivo_recibido: recibidoNum,
        notas: notas.trim() || undefined,
      });
      setResultado(data);
      setConfirmando(false);
      setNotas('');
      toast.success(`Liquidación #${data.id} registrada`);
      try { imprimirLiquidacion(data); } catch { /* sin impresora: queda la reimpresion */ }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'No se pudo liquidar');
      if (e.response?.status === 409) cargar();
    } finally {
      setGuardando(false);
    }
  };

  if (resultado) {
    const dif = Number(resultado.diferencia || 0);
    return (
      <div className="max-w-lg mx-auto card space-y-4 text-center">
        <CheckCircle2 size={44} className="mx-auto text-emerald-400" />
        <div>
          <h2 className="text-xl font-bold">Liquidación #{resultado.id} registrada</h2>
          <p className="text-sm text-slate-400">{resultado.repartidor_nombre} · {resultado.num_pedidos} pedido(s) · {resultado.tipo === 'parcial' ? 'parcial' : 'total'}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-left text-sm">
          <span className="text-slate-400">Efectivo esperado</span><span className="text-right tabular-nums">${money(resultado.efectivo_esperado)}</span>
          <span className="text-slate-400">Efectivo recibido</span><span className="text-right tabular-nums">${money(resultado.efectivo_recibido)}</span>
          <span className="text-slate-400">Diferencia</span>
          <span className={`text-right tabular-nums font-bold ${dif < 0 ? 'text-red-400' : dif > 0 ? 'text-sky-300' : 'text-emerald-400'}`}>
            {Math.abs(dif) < 0.005 ? 'Cuadra' : `${dif < 0 ? 'Faltan' : 'Sobran'} $${money(Math.abs(dif))}`}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => imprimirLiquidacion(resultado)} className="btn-secondary flex-1 flex items-center justify-center gap-2"><Printer size={16} /> Reimprimir</button>
          <button onClick={() => { setResultado(null); cargar(); }} className="btn-secondary flex-1">Ver pendientes</button>
          <button onClick={onVolver} className="btn-primary flex-1">Volver al tablero</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onVolver} className="btn-secondary flex items-center gap-2"><ArrowLeft size={16} /> Tablero</button>
        <div className="min-w-0">
          <h2 className="text-xl font-bold truncate">{info?.repartidor?.nombre || '…'}</h2>
          <p className="text-sm text-slate-400">{total} pedido(s) sin liquidar</p>
        </div>
        <button onClick={cargar} className="ml-auto btn-secondary flex items-center gap-2 text-sm"><RefreshCw size={14} /> Actualizar</button>
      </div>

      {info && total === 0 ? (
        <div className="card text-center py-8 text-slate-300">No tiene pedidos pendientes. Está al corriente.</div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500 border-b border-slate-700">
              <tr>
                <th className="p-3 text-left w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-iados-primary"
                    checked={!!info && sel.size === total && total > 0}
                    onChange={(e) => setSel(e.target.checked ? new Set((info?.pedidos || []).map((p) => p.id)) : new Set())}
                    aria-label="Seleccionar todos"
                  />
                </th>
                <th className="p-3 text-left">Folio</th>
                <th className="p-3 text-left">Hora</th>
                <th className="p-3 text-left">Productos</th>
                <th className="p-3 text-left">Pago</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-right">Efectivo</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(info?.pedidos || []).map((p) => (
                <tr key={p.id} className={`border-b border-slate-800 ${sel.has(p.id) ? '' : 'opacity-50'}`}>
                  <td className="p-3">
                    <input type="checkbox" className="w-4 h-4 accent-iados-primary" checked={sel.has(p.id)} onChange={() => alternar(p.id)} aria-label={`Seleccionar ${p.folio}`} />
                  </td>
                  <td className="p-3 font-mono whitespace-nowrap">
                    {p.folio}
                    {p.venta_cancelada && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">VENTA CANCELADA</span>}
                  </td>
                  <td className="p-3 whitespace-nowrap text-slate-400" title={fechaHora(p.fecha_venta || p.created_at)}>{hora(p.fecha_venta || p.created_at)}</td>
                  <td className="p-3 text-slate-300 max-w-xs">
                    <span className="line-clamp-2">{p.productos || '—'}</span>
                    {(p.cliente_nombre || p.cliente_direccion) && (
                      <span className="block text-xs text-slate-500 truncate">{[p.cliente_nombre, p.cliente_direccion].filter(Boolean).join(' · ')}</span>
                    )}
                  </td>
                  <td className="p-3 capitalize text-slate-400">{p.metodo_pago || '—'}</td>
                  <td className="p-3 text-right tabular-nums">${money(p.total)}</td>
                  <td className="p-3 text-right tabular-nums font-semibold">${money(p.efectivo)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setAccion({ tipo: 'reasignar', pedido: p })} className="p-2 rounded-lg hover:bg-iados-card text-slate-300" title="Pasar a otro repartidor"><Repeat size={16} /></button>
                      <button onClick={() => setAccion({ tipo: 'quitar', pedido: p })} className="p-2 rounded-lg hover:bg-iados-card text-red-300" title="Quitar (no lo llevó)"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <div className="card space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-slate-500">Pedidos a liquidar</p>
              <p className="text-xl font-bold tabular-nums">{seleccionados.length} de {total} {esParcial && <span className="text-xs font-normal text-amber-300">(parcial)</span>}</p>
              <p className="text-xs text-slate-500">Vendido: ${money(vendido)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Efectivo esperado</p>
              <p className="text-xl font-bold tabular-nums text-amber-300">${money(esperado)}</p>
              <p className="text-xs text-slate-500">pagado en efectivo menos el cambio</p>
            </div>
            <div>
              <label className="text-xs text-slate-500" htmlFor="rep-recibido">Efectivo que entrega</label>
              <input
                id="rep-recibido"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={recibido}
                onChange={(e) => { setRecibido(e.target.value); setRecibidoTocado(true); }}
                className="input-touch w-full text-xl font-bold tabular-nums"
              />
              {recibidoValido && Math.abs(diferencia) >= 0.005 && (
                <p className={`text-sm font-semibold ${diferencia < 0 ? 'text-red-400' : 'text-sky-300'}`}>
                  {diferencia < 0 ? 'Faltan' : 'Sobran'} ${money(Math.abs(diferencia))}
                </p>
              )}
              {recibidoValido && Math.abs(diferencia) < 0.005 && <p className="text-sm text-emerald-400">Cuadra exacto</p>}
            </div>
          </div>
          <input
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            maxLength={255}
            placeholder="Notas (opcional): p. ej. faltante a descontar, billete dañado…"
            className="input-touch w-full"
          />
          {!confirmando ? (
            <button
              onClick={() => setConfirmando(true)}
              disabled={!seleccionados.length || !recibidoValido}
              className="btn-success w-full py-3 text-lg"
            >
              Liquidar {seleccionados.length} pedido(s)
            </button>
          ) : (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-3">
              <p className="text-sm">
                ¿Confirmas que <strong>{info?.repartidor?.nombre}</strong> entrega <strong>${money(recibidoNum)}</strong> por {seleccionados.length} pedido(s)?
                {Math.abs(diferencia) >= 0.005 && <> Queda registrado un <strong>{diferencia < 0 ? 'faltante' : 'sobrante'} de ${money(Math.abs(diferencia))}</strong>.</>}
                {' '}No se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmando(false)} className="btn-secondary flex-1" disabled={guardando}>Revisar</button>
                <button onClick={liquidar} className="btn-success flex-1" disabled={guardando}>{guardando ? 'Guardando…' : 'Sí, liquidar'}</button>
              </div>
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            La liquidación es un control interno: no crea movimientos de caja. El efectivo de estas ventas ya está contado en el corte desde que se cobraron.
          </p>
        </div>
      )}

      {accion && (
        <AccionPedido
          accion={accion}
          repartidorActualId={info?.repartidor?.id}
          onCerrar={() => setAccion(null)}
          onHecho={() => { setAccion(null); cargar(); }}
        />
      )}
    </div>
  );
}

function AccionPedido({ accion, repartidorActualId, onCerrar, onHecho }: {
  accion: { tipo: 'reasignar' | 'quitar'; pedido: any };
  repartidorActualId?: number;
  onCerrar: () => void;
  onHecho: () => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [destino, setDestino] = useState<number | null>(null);
  const [lista, setLista] = useState<RepCatalogo[]>([]);
  const [guardando, setGuardando] = useState(false);
  const esReasignar = accion.tipo === 'reasignar';

  useEffect(() => {
    if (!esReasignar) return;
    repartidoresCtlApi.repartidores()
      .then(({ data }) => setLista((data || []).filter((r: RepCatalogo) => r.activo && r.id !== repartidorActualId)))
      .catch(() => setLista([]));
  }, [esReasignar, repartidorActualId]);

  const guardar = async () => {
    setGuardando(true);
    try {
      if (esReasignar) {
        if (!destino) return;
        await repartidoresCtlApi.reasignar(accion.pedido.id, { repartidor_id: destino, motivo: motivo.trim() || undefined });
        toast.success(`${accion.pedido.folio} reasignado`);
      } else {
        await repartidoresCtlApi.quitar(accion.pedido.id, motivo.trim());
        toast.success(`${accion.pedido.folio} quitado del repartidor`);
      }
      onHecho();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  const listo = esReasignar ? !!destino : motivo.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="card w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{esReasignar ? 'Pasar a otro repartidor' : 'Quitar pedido al repartidor'}</h3>
          <button onClick={onCerrar} className="p-2 rounded-lg hover:bg-iados-card" aria-label="Cerrar"><X size={18} /></button>
        </div>
        <p className="text-sm text-slate-400">Pedido <span className="font-mono text-slate-200">{accion.pedido.folio}</span> · ${money(accion.pedido.total)}</p>
        {esReasignar ? (
          lista.length ? (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {lista.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setDestino(r.id)}
                  className={`px-3 py-2 rounded-lg border text-sm ${destino === r.id ? 'bg-iados-primary border-iados-primary text-white' : 'bg-iados-card border-slate-600'}`}
                >
                  {r.nombre}
                </button>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No hay otro repartidor activo.</p>
        ) : (
          <p className="text-sm text-slate-400">Úsalo si el pedido al final no salió o se asignó por error. La venta no se toca; solo deja de contar para este repartidor.</p>
        )}
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={200}
          placeholder={esReasignar ? 'Motivo (opcional)' : 'Motivo (obligatorio)'}
          className="input-touch w-full"
          autoFocus={!esReasignar}
        />
        <div className="flex gap-2">
          <button onClick={onCerrar} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={guardar} disabled={!listo || guardando} className={`${esReasignar ? 'btn-primary' : 'btn-danger'} flex-1`}>
            {guardando ? 'Guardando…' : esReasignar ? 'Reasignar' : 'Quitar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════ Historial ════════════════════════
function Historial() {
  const hoy = localDateStr(new Date());
  const [vista, setVista] = useState<'liquidaciones' | 'asignaciones'>('liquidaciones');
  const [desde, setDesde] = useState(localDateStr(new Date(Date.now() - 6 * 86400000)));
  const [hasta, setHasta] = useState(hoy);
  const [repId, setRepId] = useState('');
  const [estado, setEstado] = useState('');
  const [folio, setFolio] = useState('');
  const [reps, setReps] = useState<RepCatalogo[]>([]);
  const [filas, setFilas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    repartidoresCtlApi.repartidores().then(({ data }) => setReps(data || [])).catch(() => setReps([]));
  }, []);

  const buscar = useCallback(async () => {
    if (!desde || !hasta) return;
    setCargando(true);
    try {
      const params: any = { ...rangoLocal(desde, hasta) };
      if (repId) params.repartidor_id = repId;
      if (vista === 'asignaciones') {
        if (estado) params.estado = estado;
        if (folio.trim()) params.folio = folio.trim();
        const { data } = await repartidoresCtlApi.historial(params);
        setFilas(data || []);
      } else {
        const { data } = await repartidoresCtlApi.liquidaciones(params);
        setFilas(data || []);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'No se pudo consultar');
    } finally {
      setCargando(false);
    }
  }, [desde, hasta, repId, estado, folio, vista]);

  useEffect(() => { buscar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [vista]);

  const reimprimir = async (liqId: number) => {
    try {
      const { data } = await repartidoresCtlApi.liquidacion(liqId);
      imprimirLiquidacion(data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'No se pudo reimprimir');
    }
  };

  const sumaRecibido = vista === 'liquidaciones' ? filas.reduce((s, f) => s + Number(f.efectivo_recibido || 0), 0) : 0;
  const sumaDif = vista === 'liquidaciones' ? filas.reduce((s, f) => s + Number(f.diferencia || 0), 0) : 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['liquidaciones', 'asignaciones'] as const).map((v) => (
          <button
            key={v}
            onClick={() => { setFilas([]); setVista(v); }}
            className={`px-3 py-1.5 rounded-lg text-sm border ${vista === v ? 'bg-iados-card border-iados-accent text-white' : 'border-slate-700 text-slate-400'}`}
          >
            {v === 'liquidaciones' ? 'Liquidaciones' : 'Pedidos asignados'}
          </button>
        ))}
      </div>

      <div className="card flex flex-wrap items-end gap-3">
        <label className="text-xs text-slate-500 space-y-1">
          <span className="block">Desde</span>
          <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} className="input-touch" />
        </label>
        <label className="text-xs text-slate-500 space-y-1">
          <span className="block">Hasta</span>
          <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} className="input-touch" />
        </label>
        <label className="text-xs text-slate-500 space-y-1">
          <span className="block">Repartidor</span>
          <select value={repId} onChange={(e) => setRepId(e.target.value)} className="input-touch">
            <option value="">Todos</option>
            {reps.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
        </label>
        {vista === 'asignaciones' && (
          <>
            <label className="text-xs text-slate-500 space-y-1">
              <span className="block">Estado</span>
              <select value={estado} onChange={(e) => setEstado(e.target.value)} className="input-touch">
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="liquidada">Liquidada</option>
                <option value="reasignada">Reasignada</option>
                <option value="cancelada">Quitada</option>
              </select>
            </label>
            <label className="text-xs text-slate-500 space-y-1">
              <span className="block">Folio</span>
              <input value={folio} onChange={(e) => setFolio(e.target.value)} placeholder="Buscar folio" className="input-touch w-36" />
            </label>
          </>
        )}
        <button onClick={buscar} className="btn-primary flex items-center gap-2" disabled={cargando}>
          <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} /> Consultar
        </button>
      </div>

      {vista === 'liquidaciones' ? (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500 border-b border-slate-700">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Repartidor</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-right">Pedidos</th>
                <th className="p-3 text-right">Esperado</th>
                <th className="p-3 text-right">Recibido</th>
                <th className="p-3 text-right">Diferencia</th>
                <th className="p-3 text-left">Recibió</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 && (
                <tr><td colSpan={10} className="p-6 text-center text-slate-500">{cargando ? 'Consultando…' : 'Sin liquidaciones en el periodo'}</td></tr>
              )}
              {filas.map((f) => (
                <tr key={f.id} className="border-b border-slate-800">
                  <td className="p-3 font-mono">{f.id}</td>
                  <td className="p-3 whitespace-nowrap">{fechaHora(f.created_at)}</td>
                  <td className="p-3">{f.repartidor_nombre}</td>
                  <td className="p-3 capitalize">{f.tipo}</td>
                  <td className="p-3 text-right tabular-nums">{f.num_pedidos}</td>
                  <td className="p-3 text-right tabular-nums">${money(f.efectivo_esperado)}</td>
                  <td className="p-3 text-right tabular-nums">${money(f.efectivo_recibido)}</td>
                  <td className={`p-3 text-right tabular-nums ${f.diferencia < 0 ? 'text-red-400' : f.diferencia > 0 ? 'text-sky-300' : 'text-slate-400'}`}>
                    {Math.abs(f.diferencia) < 0.005 ? '—' : `${f.diferencia < 0 ? '−' : '+'}$${money(Math.abs(f.diferencia))}`}
                  </td>
                  <td className="p-3 text-slate-400">{f.usuario_nombre || ''}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => reimprimir(f.id)} className="p-2 rounded-lg hover:bg-iados-card" title="Reimprimir comprobante"><Printer size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            {filas.length > 0 && (
              <tfoot className="text-sm font-semibold">
                <tr>
                  <td colSpan={6} className="p-3 text-right text-slate-400">Totales</td>
                  <td className="p-3 text-right tabular-nums">${money(sumaRecibido)}</td>
                  <td className={`p-3 text-right tabular-nums ${sumaDif < 0 ? 'text-red-400' : sumaDif > 0 ? 'text-sky-300' : ''}`}>
                    {Math.abs(sumaDif) < 0.005 ? '—' : `${sumaDif < 0 ? '−' : '+'}$${money(Math.abs(sumaDif))}`}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500 border-b border-slate-700">
              <tr>
                <th className="p-3 text-left">Asignado</th>
                <th className="p-3 text-left">Folio</th>
                <th className="p-3 text-left">Repartidor</th>
                <th className="p-3 text-left">Estado</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-right">Efectivo</th>
                <th className="p-3 text-left">Asignó</th>
                <th className="p-3 text-left">Cerró / motivo</th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-slate-500">{cargando ? 'Consultando…' : 'Sin pedidos asignados en el periodo'}</td></tr>
              )}
              {filas.map((f) => (
                <tr key={f.id} className="border-b border-slate-800 align-top">
                  <td className="p-3 whitespace-nowrap">{fechaHora(f.created_at)}<span className="block text-[11px] text-slate-500">{ORIGEN[f.origen] || f.origen}</span></td>
                  <td className="p-3 font-mono whitespace-nowrap">
                    {f.folio}
                    {f.venta_cancelada && <span className="block text-[10px] text-red-300">venta cancelada</span>}
                  </td>
                  <td className="p-3">{f.repartidor_nombre}</td>
                  <td className="p-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${ESTADO_PILL[f.estado] || ''}`}>{f.estado === 'cancelada' ? 'quitada' : f.estado}</span>
                    {f.liquidacion_id && <span className="block text-[11px] text-slate-500 mt-1">Liq. #{f.liquidacion_id}</span>}
                  </td>
                  <td className="p-3 text-right tabular-nums">${money(f.total)}</td>
                  <td className="p-3 text-right tabular-nums">${money(f.efectivo)}</td>
                  <td className="p-3 text-slate-400">{f.asignado_por_nombre || ''}</td>
                  <td className="p-3 text-slate-400">
                    {f.cerrado_por_nombre && <span className="block">{f.cerrado_por_nombre} · {fechaHora(f.cerrado_at)}</span>}
                    {f.motivo && <span className="block text-xs">{f.motivo}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ════════════════════════ Catalogo + gafetes ════════════════════════
function Catalogo({ puedeEditar, empresa }: { puedeEditar: boolean; empresa: string }) {
  const [reps, setReps] = useState<RepCatalogo[]>([]);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [editando, setEditando] = useState<{ id: number; nombre: string; telefono: string } | null>(null);
  const [regenerar, setRegenerar] = useState<RepCatalogo | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await repartidoresCtlApi.repartidores();
      setReps(data || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'No se pudo cargar la lista');
    }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const alta = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    try {
      const { data } = await repartidoresCtlApi.crearRepartidor({ nombre: nombre.trim(), telefono: telefono.trim() || undefined });
      toast.success(`${data.nombre} dado de alta (código ${data.codigo})`);
      setNombre(''); setTelefono('');
      cargar();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'No se pudo dar de alta');
    } finally {
      setGuardando(false);
    }
  };

  const guardarEdicion = async () => {
    if (!editando || !editando.nombre.trim()) return;
    try {
      await repartidoresCtlApi.actualizarRepartidor(editando.id, { nombre: editando.nombre.trim(), telefono: editando.telefono.trim() });
      setEditando(null);
      cargar();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'No se pudo guardar');
    }
  };

  const alternarActivo = async (r: RepCatalogo) => {
    try {
      await repartidoresCtlApi.actualizarRepartidor(r.id, { activo: !r.activo });
      toast.success(r.activo ? `${r.nombre} dado de baja` : `${r.nombre} activado`);
      cargar();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'No se pudo cambiar');
    }
  };

  const confirmarRegenerar = async () => {
    if (!regenerar) return;
    try {
      const { data } = await repartidoresCtlApi.regenerarCodigo(regenerar.id);
      toast.success(`Nuevo código de ${data.nombre}: ${data.codigo}. Imprime su gafete nuevo.`);
      setRegenerar(null);
      cargar();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'No se pudo generar');
    }
  };

  const activos = reps.filter((r) => r.activo);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 max-w-3xl">
        Son los mismos repartidores de la empresa (si usas Logística, ahí también aparecen). Cada uno tiene un gafete con un
        código QR único: en caja, después de cobrar, se escanea con la pistola lectora para asignarle el pedido.
      </p>

      {puedeEditar && (
        <div className="card flex flex-wrap items-end gap-3">
          <label className="text-xs text-slate-500 space-y-1 flex-1 min-w-[180px]">
            <span className="block">Nombre</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} className="input-touch w-full" placeholder="Nombre del repartidor"
              onKeyDown={(e) => { if (e.key === 'Enter') alta(); }} />
          </label>
          <label className="text-xs text-slate-500 space-y-1">
            <span className="block">Teléfono (opcional)</span>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={20} className="input-touch w-44" inputMode="tel" />
          </label>
          <button onClick={alta} disabled={!nombre.trim() || guardando} className="btn-primary flex items-center gap-2"><Plus size={16} /> Dar de alta</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-200">{reps.length} repartidor(es)</h3>
        <button onClick={() => imprimirGafetes(activos, empresa)} disabled={!activos.length} className="btn-secondary flex items-center gap-2 text-sm">
          <Printer size={14} /> Imprimir gafetes de todos los activos
        </button>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-slate-500 border-b border-slate-700">
            <tr>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Teléfono</th>
              <th className="p-3 text-left">Código del gafete</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reps.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">Sin repartidores</td></tr>}
            {reps.map((r) => (
              <tr key={r.id} className={`border-b border-slate-800 ${r.activo ? '' : 'opacity-60'}`}>
                <td className="p-3">
                  {editando?.id === r.id
                    ? <input value={editando.nombre} onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} maxLength={100} className="input-touch w-full" autoFocus />
                    : <span className="font-medium">{r.nombre}</span>}
                </td>
                <td className="p-3">
                  {editando?.id === r.id
                    ? <input value={editando.telefono} onChange={(e) => setEditando({ ...editando, telefono: e.target.value })} maxLength={20} className="input-touch w-36" />
                    : <span className="text-slate-400">{r.telefono || '—'}</span>}
                </td>
                <td className="p-3 font-mono tracking-widest">{r.codigo}</td>
                <td className="p-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border ${r.activo ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' : 'bg-slate-500/15 text-slate-300 border-slate-500/40'}`}>
                    {r.activo ? 'Activo' : 'De baja'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    {editando?.id === r.id ? (
                      <>
                        <button onClick={guardarEdicion} className="p-2 rounded-lg hover:bg-iados-card text-emerald-300" title="Guardar"><Save size={16} /></button>
                        <button onClick={() => setEditando(null)} className="p-2 rounded-lg hover:bg-iados-card" title="Cancelar"><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => imprimirGafetes([r], empresa)} className="p-2 rounded-lg hover:bg-iados-card" title="Imprimir gafete"><QrCode size={16} /></button>
                        {puedeEditar && (
                          <>
                            <button onClick={() => setEditando({ id: r.id, nombre: r.nombre, telefono: r.telefono || '' })} className="p-2 rounded-lg hover:bg-iados-card text-xs" title="Editar">Editar</button>
                            <button onClick={() => setRegenerar(r)} className="p-2 rounded-lg hover:bg-iados-card" title="Gafete perdido: nuevo código"><KeyRound size={16} /></button>
                            <button onClick={() => alternarActivo(r)} className={`p-2 rounded-lg hover:bg-iados-card ${r.activo ? 'text-red-300' : 'text-emerald-300'}`} title={r.activo ? 'Dar de baja' : 'Activar'}><Power size={16} /></button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {regenerar && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setRegenerar(null)}>
          <div className="card w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3 className="text-lg font-bold">¿Nuevo código para {regenerar.nombre}?</h3>
            <p className="text-sm text-slate-400">
              Úsalo si perdió el gafete. El código actual (<span className="font-mono">{regenerar.codigo}</span>) deja de funcionar
              de inmediato y hay que imprimirle uno nuevo. Sus pedidos y liquidaciones no cambian.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setRegenerar(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={confirmarRegenerar} className="btn-primary flex-1">Generar código nuevo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
