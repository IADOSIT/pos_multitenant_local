import { useState, useEffect, useCallback, useMemo } from 'react';
import { pedidosApi, ventasApi, ticketsApi, selfOrderApi, logisticaApi, empresasApi, cajaApi } from '../../api/endpoints';
import { usePOSStore } from '../../store/pos.store';
import { useAuthStore } from '../../store/auth.store';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { printTicket, printComanda } from '../../utils/printTicket';
import { resolveUploadUrl } from '../../api/client';
import toast from 'react-hot-toast';
import { ClipboardList, CreditCard, XCircle, RefreshCw, Check, Ban, Receipt, FileText, Truck, AlertTriangle } from 'lucide-react';
import { ecommerceApi, tiendasApi } from '../../api/endpoints';
import PinConfirmModal from '../../components/ui/PinConfirmModal';
import TablaPedidos from './TablaPedidos';
import DetallePedidoWeb from './DetallePedidoWeb';
import {
  PedidoUnificado, ESTADOS_UNIFICADOS, estadoUnificadoDe, siguienteEstadoRaw,
  normalizarPedidoPOS, normalizarPedidoWeb, ordenarPorFecha, esCerrado,
} from './pedidosUnificados';

// Los pedidos web se paginan en servidor, pero aqui hay que mezclarlos con los de
// mostrador antes de paginar, asi que se traen los mas recientes de un jalon.
// Si una tienda supera este numero de pedidos web habria que volver a paginar en servidor.
const LIMITE_WEB = 100;

const nextEstado: Record<string, string> = {
  recibido: 'en_elaboracion',
  en_elaboracion: 'listo_para_entrega',
  listo_para_entrega: 'entregado',
};

import { usePageHeader } from '../../store/pageHeader.store';

export default function PedidosPage() {
  usePageHeader({ title: 'Pedidos', subtitle: 'Pedidos web y de mostrador', icon: ClipboardList });
  const { user } = useAuthStore();
  const { cajaActiva, setCajaActiva } = usePOSStore();
  const [checkingCaja, setCheckingCaja] = useState(true);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [pedidosWeb, setPedidosWeb] = useState<any[]>([]);
  const [tab, setTab] = useState<'pendientes' | 'completados'>('pendientes');
  const [selected, setSelected] = useState<any>(null);
  const [selectedWeb, setSelectedWeb] = useState<PedidoUnificado | null>(null);
  const [avanzandoKey, setAvanzandoKey] = useState<string | null>(null);
  const [showCobrar, setShowCobrar] = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPinCancelar, setShowPinCancelar] = useState(false);
  const [showRechazarSO, setShowRechazarSO] = useState(false);
  const [rechazarMotivo, setRechazarMotivo] = useState('');
  const [precuentaEnabled, setPrecuentaEnabled] = useState(false);
  const [logisticaEnabled, setLogisticaEnabled] = useState(false);
  const [entregaActual, setEntregaActual] = useState<any>(null);
  const [repartidores, setRepartidores] = useState<any[]>([]);
  const [showAsignarEntrega, setShowAsignarEntrega] = useState(false);
  const [asignandoRep, setAsignandoRep] = useState<number | null>(null);
  const [cfgEspecial, setCfgEspecial] = useState<{ precio_manual: boolean; mostrar_precios: boolean }>({ precio_manual: false, mostrar_precios: true });
  const [preciosManual, setPreciosManual] = useState<Record<number, string>>({});

  // Payment state for cobrar
  const [metodo, setMetodo] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [pagado, setPagado] = useState('');

  // Los pedidos web solo los ve quien ya tenia acceso a la tienda en linea; al cajero
  // ni siquiera se le pide el endpoint.
  const puedeVerWeb = ['superadmin', 'admin', 'manager'].includes(user?.rol || '');

  const load = useCallback(async () => {
    try {
      if (tab === 'pendientes') {
        const { data } = await pedidosApi.pendientes();
        setPedidos(data);
      } else {
        const [{ data: entregados }, { data: cancelados }] = await Promise.all([
          pedidosApi.list('entregado'),
          pedidosApi.list('cancelado'),
        ]);
        setPedidos([...entregados, ...cancelados]);
      }
    } catch {}

    if (!puedeVerWeb) { setPedidosWeb([]); return; }
    try {
      const { data } = await ecommerceApi.listPedidos({ page: 1, limit: LIMITE_WEB });
      setPedidosWeb(data.data || []);
    } catch {}
  }, [tab, puedeVerWeb]);

  // Un solo listado: mostrador, QR y web mezclados y ordenados por fecha. Los de
  // mostrador ya vienen filtrados por pestaña desde el backend; los web se reparten aqui.
  const listado = useMemo(() => {
    const dePOS = pedidos.map(normalizarPedidoPOS);
    const deWeb = pedidosWeb
      .map(normalizarPedidoWeb)
      .filter(p => esCerrado(p.estado) === (tab === 'completados'));
    return ordenarPorFecha([...dePOS, ...deWeb]);
  }, [pedidos, pedidosWeb, tab]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (user?.tienda_id) {
      tiendasApi.get(user.tienda_id).then(r => {
        setPrecuentaEnabled(r.data?.config_pos?.precuenta_enabled || false);
      }).catch(() => {});
    }
    // Cargar config_especial para precio_manual y mostrar_precios
    if (user?.empresa_id) {
      empresasApi.get(user.empresa_id)
        .then(r => {
          const cfgEsp = r.data?.config_especial || {};
          setCfgEspecial({ precio_manual: cfgEsp.precio_manual === true, mostrar_precios: cfgEsp.mostrar_precios !== false });
        })
        .catch(() => {});
    }
    // Si se entra directo a Pedidos sin pasar por POS, el store puede no tener la caja activa
    // aunque sí haya una abierta en el turno. Se refresca aquí para que "Cobrar" funcione igual.
    if (!cajaActiva) {
      cajaApi.activa()
        .then(r => { if (r.data) setCajaActiva(r.data); })
        .catch(() => {})
        .finally(() => setCheckingCaja(false));
    } else {
      setCheckingCaja(false);
    }
  }, [user?.tienda_id, user?.empresa_id]);

  useEffect(() => {
    if (['admin', 'superadmin', 'manager', 'cajero'].includes(user?.rol || '')) {
      logisticaApi.getConfig().then(r => {
        setLogisticaEnabled(r.data?.modulo_habilitado || false);
      }).catch(() => {});
    }
  }, [user?.rol]);

  // SSE: auto-refresh on new pedido events
  useNotificaciones({
    onNuevoPedido: () => { if (tab === 'pendientes') load(); },
    onPedidoActualizado: () => load(),
    onPedidoCobrado: () => load(),
    enabled: ['cajero', 'admin', 'manager', 'superadmin'].includes(user?.rol || ''),
  });

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const handleAvanzarEstado = async (pedido: any) => {
    const next = nextEstado[pedido.estado];
    if (!next) return;
    try {
      await pedidosApi.updateEstado(pedido.id, next);
      toast.success(`Pedido ${pedido.folio} → ${ESTADOS_UNIFICADOS[estadoUnificadoDe('mostrador', next)].label}`);
      load();
      setSelected(null);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleAvanzarWeb = async (pedido: PedidoUnificado, estadoRaw: string) => {
    setAvanzandoKey(pedido.key);
    try {
      const { data } = await ecommerceApi.updateEstado(pedido.id, estadoRaw);
      setPedidosWeb(ps => ps.map(x => (x.id === pedido.id ? { ...x, estado: data.estado } : x)));
      toast.success(`Pedido ${pedido.numero} → ${ESTADOS_UNIFICADOS[estadoUnificadoDe('web', data.estado)].label}`);
    } catch { toast.error('Error al actualizar estado'); }
    finally { setAvanzandoKey(null); }
  };

  // Al cambiar de pestaña se suelta lo seleccionado: si no, al volver reaparece el
  // panel de acciones de un pedido que ya no esta en el listado visible.
  const cambiarTab = (nuevo: 'pendientes' | 'completados') => {
    setTab(nuevo);
    setSelected(null);
    setSelectedWeb(null);
  };

  // La tabla es la misma para los dos flujos; aqui se decide a cual pertenece la fila.
  const handleSelect = (p: PedidoUnificado) => {
    if (p.origen === 'web') { setSelectedWeb(p); setSelected(null); }
    else { setSelected(p.raw); setSelectedWeb(null); }
  };

  const handleAvanzarFila = async (p: PedidoUnificado) => {
    const siguiente = siguienteEstadoRaw(p);
    if (!siguiente) return;
    if (p.origen === 'web') { await handleAvanzarWeb(p, siguiente); return; }
    setAvanzandoKey(p.key);
    try { await handleAvanzarEstado(p.raw); }
    finally { setAvanzandoKey(null); }
  };

  const handleCobrar = async () => {
    if (!selected || !cajaActiva) return;
    setLoading(true);
    try {
      const pagoData: any = {
        caja_id: cajaActiva.id,
        metodo_pago: metodo,
        cambio: 0,
        pagos: [],
      };
      const total = totalConOverride;

      if (cfgEspecial.precio_manual && selected?.detalles) {
        pagoData.precios_override = selected.detalles.map((d: any) => ({
          detalle_id: d.id,
          precio_unitario: parseFloat(preciosManual[d.id] || '0') || 0,
        }));
      }

      if (metodo === 'efectivo') {
        const pag = Number(pagado) || 0;
        if (pag < total) { toast.error('Monto insuficiente'); setLoading(false); return; }
        pagoData.pago_efectivo = pag;
        pagoData.cambio = pag - total;
      } else if (metodo === 'tarjeta') {
        pagoData.pago_tarjeta = total;
      } else {
        pagoData.pago_transferencia = total;
      }

      const { data } = await pedidosApi.cobrar(selected.id, pagoData);
      toast.success(`Pedido ${selected.folio} cobrado - Venta ${data.venta.folio}`);

      // Print ticket
      try {
        const { data: ticketData } = await ticketsApi.preview(data.venta);
        if (ticketData.raw) printTicket(ticketData.raw, ticketData.ancho_papel, ticketData.fuente_familia, ticketData.fuente_tamano, resolveUploadUrl(ticketData.logo_url), ticketData.logo_posicion, ticketData.copias || 1, ticketData.modo_impresion);
      } catch {}

      setShowCobrar(false);
      setSelected(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al cobrar'); }
    finally { setLoading(false); }
  };

  const handleCancelar = async () => {
    if (!selected || !cancelMotivo) return;
    try {
      await pedidosApi.cancelar(selected.id, cancelMotivo);
      toast.success('Pedido cancelado');
      setShowCancelar(false);
      setCancelMotivo('');
      setSelected(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleConfirmarSO = async (pedido: any) => {
    try {
      await selfOrderApi.confirmar(pedido.id);
      toast.success(`Pedido ${pedido.folio} confirmado al cliente`);
      load();
      setSelected(null);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleRechazarSO = async () => {
    if (!selected) return;
    try {
      await selfOrderApi.rechazar(selected.id, rechazarMotivo || 'Sin motivo');
      toast.success(`Pedido ${selected.folio} rechazado`);
      setShowRechazarSO(false);
      setRechazarMotivo('');
      setSelected(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const loadEntregaActual = async (pedido: any) => {
    if (!pedido || !logisticaEnabled) { setEntregaActual(null); return; }
    try {
      const { data } = await logisticaApi.getEntregaByPedido(pedido.id);
      setEntregaActual(data);
    } catch { setEntregaActual(null); }
  };

  const handleAsignarEntrega = async (repartidor_id: number) => {
    if (!selected) return;
    setAsignandoRep(repartidor_id);
    try {
      await logisticaApi.asignar(selected.id, repartidor_id);
      toast.success('Pedido asignado al repartidor');
      setShowAsignarEntrega(false);
      loadEntregaActual(selected);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al asignar');
    } finally { setAsignandoRep(null); }
  };

  const handlePreCuenta = async (pedido: any) => {
    try {
      const items = pedido.detalles?.map((d: any) => ({
        nombre: d.producto_nombre,
        cantidad: Number(d.cantidad),
        precio: Number(d.precio_unitario),
        descuento: Number(d.descuento || 0),
        notas: d.notas,
      })) || [];
      const { data: ticket } = await ticketsApi.precuenta({
        items,
        subtotal: Number(pedido.subtotal),
        impuestos: Number(pedido.impuestos || 0),
        total: Number(pedido.total),
        mesa: pedido.mesa,
        cliente_nombre: pedido.cliente_nombre || undefined,
        notas: pedido.notas || undefined,
      });
      printTicket(ticket.raw, ticket.ancho_papel, ticket.fuente_familia, ticket.fuente_tamano, null, ticket.logo_posicion, 1, ticket.modo_impresion);
      toast.success('Pre-cuenta impresa');
    } catch { toast.error('Error al generar pre-cuenta'); }
  };

  useEffect(() => {
    if (selected && logisticaEnabled) {
      loadEntregaActual(selected);
      logisticaApi.getRepartidores().then(r => setRepartidores(r.data || [])).catch(() => {});
    } else {
      setEntregaActual(null);
    }
  }, [selected?.id, logisticaEnabled]);

  const canManage = ['cajero', 'admin', 'manager', 'superadmin'].includes(user?.rol || '');

  const totalConOverride = cfgEspecial.precio_manual && selected?.detalles
    ? selected.detalles.reduce((sum: number, d: any) => {
        const precio = parseFloat(preciosManual[d.id] || '0') || 0;
        return sum + precio * Number(d.cantidad);
      }, 0)
    : Number(selected?.total || 0);

  const todosIngresados = !cfgEspecial.precio_manual || !selected?.detalles
    || selected.detalles.every((d: any) => {
        const v = preciosManual[d.id];
        return v !== undefined && v !== '' && !isNaN(parseFloat(v)) && parseFloat(v) >= 0;
      });

  const handlePrintComanda = async (pedido: any) => {
    try {
      const { data: ticketConfig } = await ticketsApi.getConfig();
      if (!ticketConfig.comanda_enabled) {
        toast.error('Comandera no está activada en Config → Tickets');
        return;
      }
      printComanda(
        {
          mesa: pedido.mesa,
          folio: pedido.folio,
          usuario_nombre: pedido.usuario_nombre,
          tipo_servicio: pedido.tipo_servicio,
          items: (pedido.detalles || []).map((d: any) => ({
            cantidad: d.cantidad,
            nombre: d.producto_nombre,
            precio: d.precio_unitario,
            notas: d.notas,
          })),
        },
        ticketConfig,
      );
    } catch { toast.error('Error al imprimir comanda'); }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-end mb-4">
        <button onClick={load} className="btn-secondary text-sm"><RefreshCw size={16} className="mr-1" />Actualizar</button>
      </div>

      {/* Tabs — el origen ya no separa listados, solo la etapa del pedido */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => cambiarTab('pendientes')} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'pendientes' ? 'bg-iados-primary text-white' : 'bg-iados-card text-slate-400'}`}>
          Pendientes {tab === 'pendientes' ? `(${listado.length})` : ''}
        </button>
        <button onClick={() => cambiarTab('completados')} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'completados' ? 'bg-iados-primary text-white' : 'bg-iados-card text-slate-400'}`}>
          Completados {tab === 'completados' ? `(${listado.length})` : ''}
        </button>
      </div>

      <TablaPedidos
        pedidos={listado}
        mostrarPrecios={cfgEspecial.mostrar_precios}
        mostrarFiltroOrigen={puedeVerWeb}
        seleccionadoKey={selectedWeb?.key || (selected ? `pos-${selected.id}` : null)}
        avanzandoKey={avanzandoKey}
        vacioTexto={tab === 'pendientes' ? 'No hay pedidos pendientes' : 'No hay pedidos completados'}
        tieneDetalle={p => p.origen === 'web' || (tab === 'pendientes' && canManage)}
        onSelect={handleSelect}
        onAvanzar={handleAvanzarFila}
      />

      {selectedWeb && (
        <DetallePedidoWeb
          pedido={selectedWeb}
          mostrarPrecios={cfgEspecial.mostrar_precios}
          onClose={() => setSelectedWeb(null)}
          onAvanzar={handleAvanzarWeb}
        />
      )}

      {/* Detail + Actions Panel */}
      {selected && tab === 'pendientes' && canManage && (
        <div className="fixed bottom-0 left-0 right-0 md:left-20 lg:left-56 bg-iados-surface border-t border-slate-700 p-4 z-40">
          <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-bold">Mesa {selected.mesa}</span>
              <span className="text-slate-400 mx-2">|</span>
              <span className="font-mono text-sm">{selected.folio}</span>
              {cfgEspecial.mostrar_precios && (
                <>
                  <span className="text-slate-400 mx-2">|</span>
                  <span className="text-green-400 font-bold">${Number(selected.total).toFixed(2)}</span>
                </>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Self-order: confirm/reject when received and not yet confirmed by mesero */}
              {selected.self_order && selected.estado === 'recibido' && !selected.mesero_confirmado && (
                <>
                  <button
                    onClick={() => handleConfirmarSO(selected)}
                    className="bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-xl text-sm flex items-center gap-1"
                  >
                    <Check size={15} /> Confirmar al cliente
                  </button>
                  <button
                    onClick={() => { setShowRechazarSO(true); setRechazarMotivo(''); }}
                    className="bg-red-800 hover:bg-red-700 text-white px-3 py-2 rounded-xl text-sm flex items-center gap-1"
                  >
                    <Ban size={15} /> Rechazar
                  </button>
                </>
              )}
              {nextEstado[selected.estado] && selected.estado !== 'listo_para_entrega' && (
                <button onClick={() => handleAvanzarEstado(selected)} className="btn-secondary text-sm">
                  {selected.estado === 'recibido' ? 'Iniciar Preparacion' : 'Marcar Listo'}
                </button>
              )}
              {(selected.estado === 'listo_para_entrega' || selected.estado === 'recibido' || selected.estado === 'en_elaboracion') && (
                <div className="flex flex-col items-start gap-1">
                  <button
                    onClick={() => {
                      setShowCobrar(true);
                      setMetodo('efectivo');
                      setPagado('');
                      if (cfgEspecial.precio_manual && selected?.detalles) {
                        const init: Record<number, string> = {};
                        selected.detalles.forEach((d: any) => { init[d.id] = ''; });
                        setPreciosManual(init);
                      }
                    }}
                    disabled={!cajaActiva || checkingCaja}
                    title={!checkingCaja && !cajaActiva ? 'No hay caja abierta — ábrela en POS o Caja para poder cobrar' : undefined}
                    className="btn-primary text-sm"
                  >
                    <CreditCard size={16} className="mr-1" />Cobrar
                  </button>
                  {!checkingCaja && !cajaActiva && (
                    <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-900/30 border border-yellow-800 rounded-lg px-2 py-1">
                      <AlertTriangle size={12} /> No puedes cobrar: no hay caja abierta. Ábrela en POS o Caja.
                    </span>
                  )}
                </div>
              )}
              {precuentaEnabled && (
                <button
                  onClick={() => handlePreCuenta(selected)}
                  className="btn-secondary text-xs flex items-center gap-1"
                  title="Imprimir Pre-cuenta"
                >
                  <FileText size={14} /> Pre-cuenta
                </button>
              )}
              <button
                onClick={() => handlePrintComanda(selected)}
                className="btn-secondary text-xs flex items-center gap-1"
                title="Imprimir Comanda"
              >
                <Receipt size={14} /> Comanda
              </button>
              {/* Asignar entrega — visible para cualquier pedido pendiente si logística está habilitada.
                  Antes solo aparecía si tipo_servicio/self_order/cliente_direccion ya traían datos de
                  entrega, lo que lo hacía aparecer inconsistente (ej. pedidos tomados manualmente en
                  POS sin esos campos). El cajero decide si aplica o no. */}
              {logisticaEnabled && (
                entregaActual ? (
                  <span className="text-xs text-slate-400 flex items-center gap-1 px-2 py-2">
                    <Truck size={13} />
                    {entregaActual.repartidor_nombre} — {entregaActual.estado}
                  </span>
                ) : (
                  <button
                    onClick={() => setShowAsignarEntrega(true)}
                    className="btn-secondary text-xs flex items-center gap-1"
                    title="Asignar a repartidor"
                  >
                    <Truck size={14} /> Asignar entrega
                  </button>
                )
              )}
              <button onClick={() => { setShowCancelar(true); setCancelMotivo(''); }} className="text-red-400 hover:bg-red-900/50 px-3 py-2 rounded-xl text-sm">
                Cancelar
              </button>
              <button onClick={() => setSelected(null)} className="btn-secondary text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cobrar */}
      {showCobrar && selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold">Cobrar Pedido - Mesa {selected.mesa}</h3>
            <p className="text-sm text-slate-400">{selected.folio} | {selected.detalles?.length} productos</p>

            {/* MODO PRECIO MANUAL */}
            {cfgEspecial.precio_manual && selected.detalles ? (
              <div>
                <p className="text-xs text-yellow-400 uppercase tracking-wider font-medium mb-2">
                  Ingresa precio por unidad
                </p>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {selected.detalles.map((d: any) => (
                    <div key={d.id} className="flex items-center gap-3 bg-iados-card rounded-xl p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.producto_nombre}</p>
                        <p className="text-xs text-slate-400">{Number(d.cantidad)} pza</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-slate-400 text-xs">$/u</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={preciosManual[d.id] ?? ''}
                          onChange={e => {
                            const v = e.target.value.replace(/[^0-9.]/g, '');
                            setPreciosManual(prev => ({ ...prev, [d.id]: v }));
                          }}
                          onFocus={e => e.target.select()}
                          className="w-24 bg-iados-bg border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:border-iados-primary"
                        />
                        <span className="text-xs text-slate-500 w-16 text-right">
                          = ${((parseFloat(preciosManual[d.id] || '0') || 0) * Number(d.cantidad)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700">
                  <span className="font-medium text-sm">Total</span>
                  <span className="text-xl font-bold text-green-400">${totalConOverride.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-2xl font-bold text-green-400">${totalConOverride.toFixed(2)}</p>
            )}

            {/* Metodo */}
            <div className="flex gap-2">
              {(['efectivo', 'tarjeta', 'transferencia'] as const).map((m) => (
                <button key={m} onClick={() => setMetodo(m)} className={`flex-1 py-2 rounded-xl text-sm font-medium ${metodo === m ? 'bg-iados-primary text-white' : 'bg-iados-card text-slate-400'}`}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            {metodo === 'efectivo' && (
              <>
                <input
                  value={pagado}
                  onChange={(e) => setPagado(e.target.value.replace(/[^0-9.]/g, ''))}
                  onFocus={e => e.target.select()}
                  placeholder="Monto recibido"
                  type="text"
                  inputMode="decimal"
                  className="input-touch text-center text-2xl"
                  autoFocus
                />
                <div className="flex gap-2 flex-wrap">
                  {[50, 100, 200, 500, 1000].map((q) => (
                    <button key={q} onClick={() => setPagado(String(q))} className="bg-iados-card px-3 py-2 rounded-xl text-sm">${q}</button>
                  ))}
                </div>
                {Number(pagado) > totalConOverride && totalConOverride > 0 && (
                  <p className="text-center text-yellow-400 font-bold">Cambio: ${(Number(pagado) - totalConOverride).toFixed(2)}</p>
                )}
              </>
            )}

            {cfgEspecial.precio_manual && !todosIngresados && (
              <p className="text-xs text-yellow-400 text-center">
                ⚠ Ingresa el precio de todos los productos
              </p>
            )}

            <div className="flex gap-2">
              <button onClick={() => setShowCobrar(false)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={handleCobrar}
                disabled={
                  loading ||
                  !todosIngresados ||
                  (cfgEspecial.precio_manual && totalConOverride <= 0) ||
                  (metodo === 'efectivo' && Number(pagado) < totalConOverride && totalConOverride > 0)
                }
                className="btn-primary flex-1"
              >
                {loading ? 'Procesando...' : 'Confirmar Cobro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancelar */}
      {showCancelar && selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full space-y-4 text-center">
            <XCircle size={40} className="mx-auto text-red-400" />
            <h3 className="text-lg font-bold">Cancelar Pedido {selected.folio}</h3>
            <input value={cancelMotivo} onChange={(e) => setCancelMotivo(e.target.value)} placeholder="Motivo de cancelacion" className="input-touch" />
            <div className="flex gap-2">
              <button onClick={() => setShowCancelar(false)} className="btn-secondary flex-1">Volver</button>
              <button onClick={() => setShowPinCancelar(true)} disabled={!cancelMotivo} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex-1">Cancelar Pedido</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rechazar Self Order */}
      {showRechazarSO && selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full space-y-4 text-center">
            <Ban size={40} className="mx-auto text-red-400" />
            <h3 className="text-lg font-bold">Rechazar Pedido Self Order</h3>
            <p className="text-sm text-slate-400">{selected.folio} — el cliente será notificado</p>
            <input
              value={rechazarMotivo}
              onChange={(e) => setRechazarMotivo(e.target.value)}
              placeholder="Motivo (opcional)"
              className="input-touch"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowRechazarSO(false)} className="btn-secondary flex-1">Volver</button>
              <button onClick={handleRechazarSO} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex-1">
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      <PinConfirmModal
        open={showPinCancelar}
        title="Confirmar cancelación"
        description={`Cancelar pedido ${selected?.folio || ''} — motivo: "${cancelMotivo}"`}
        onConfirm={() => { setShowPinCancelar(false); handleCancelar(); }}
        onCancel={() => setShowPinCancelar(false)}
      />

      {/* Modal Asignar Repartidor */}
      {showAsignarEntrega && selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-iados-surface rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
              <Truck size={18} /> Asignar repartidor
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {selected.folio} — {selected.cliente_nombre || 'Sin nombre'}
            </p>
            {repartidores.filter(r => r.activo).length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                No hay repartidores activos. Crea uno en Logística → Repartidores.
              </p>
            ) : (
              <div className="space-y-2 mb-4">
                {repartidores.filter(r => r.activo).map(rep => (
                  <button
                    key={rep.id}
                    onClick={() => handleAsignarEntrega(rep.id)}
                    disabled={asignandoRep !== null}
                    className="w-full text-left bg-iados-card hover:bg-iados-primary/20 border border-slate-700 rounded-xl p-3 transition-colors disabled:opacity-50"
                  >
                    <span className="font-medium">{rep.nombre}</span>
                    {rep.telefono && <span className="text-slate-400 text-sm ml-2">{rep.telefono}</span>}
                    {asignandoRep === rep.id && <span className="ml-2 text-xs text-blue-400">Asignando...</span>}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowAsignarEntrega(false)}
              className="w-full text-slate-400 hover:text-white text-sm py-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
