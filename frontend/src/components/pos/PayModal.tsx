import { useState, useRef, useEffect, useCallback } from 'react';
import { usePOSStore } from '../../store/pos.store';
import { offlineActions } from '../../store/offline.store';
import { ventasApi, ticketsApi, pedidosApi, pagosGatewayApi } from '../../api/endpoints';
import { resolveUploadUrl } from '../../api/client';
import { printTicket } from '../../utils/printTicket';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { X, DollarSign, CreditCard, ArrowRightLeft, Banknote, Printer, ShoppingBag, Wifi, Smartphone, RotateCw, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  onClose: (mantenerAbierta?: boolean) => void;
  isOnline: boolean;
  pedido?: any; // si se pasa, cobrar este pedido en lugar del carrito
}

type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto' | 'mp_qr' | 'mp_point' | 'stripe';

export default function PayModal({ onClose, isOnline, pedido }: Props) {
  const { cart, getSubtotal, getImpuestos, getTotal, clearCart, cajaActiva, tipoServicio } = usePOSStore();
  const total = pedido ? Number(pedido.total) : getTotal();
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
  const [pagoEfectivo, setPagoEfectivo] = useState('');
  const [pagoTarjeta, setPagoTarjeta] = useState('');
  const [pagoTransferencia, setPagoTransferencia] = useState('');
  const [loading, setLoading] = useState(false);
  const [ventaCompletada, setVentaCompletada] = useState<any>(null);
  const ticketRawRef = useRef<string>('');

  // Gateway state
  const [gwConfig, setGwConfig] = useState<any>(null);
  const [gwQrDataUrl, setGwQrDataUrl] = useState<string>('');
  const [gwExternalId, setGwExternalId] = useState<string>('');
  const [gwIntentId, setGwIntentId] = useState<string>('');
  const [gwEstado, setGwEstado] = useState<'idle' | 'pending' | 'processing' | 'approved' | 'rejected' | 'cancelled'>('idle');
  const gwPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gwTransaccionIdRef = useRef<number>(0);

  const stopGwPoll = useCallback(() => {
    if (gwPollRef.current) { clearInterval(gwPollRef.current); gwPollRef.current = null; }
  }, []);

  useEffect(() => {
    if (isOnline) {
      pagosGatewayApi.getConfig().then(r => setGwConfig(r.data)).catch(() => {});
    }
    return () => stopGwPoll();
  }, [isOnline, stopGwPoll]);

  const folio = pedido?.folio || `POS-${Date.now()}`;

  const cambio = metodo === 'efectivo' ? Math.max(0, Number(pagoEfectivo || 0) - total) : 0;

  const addDenom = (d: number) => {
    if (metodo === 'tarjeta') {
      setPagoTarjeta((prev) => String(Math.round((Number(prev || 0) + d) * 100) / 100));
    } else if (metodo === 'transferencia') {
      setPagoTransferencia((prev) => String(Math.round((Number(prev || 0) + d) * 100) / 100));
    } else {
      setPagoEfectivo((prev) => String(Math.round((Number(prev || 0) + d) * 100) / 100));
    }
  };

  const canPay = () => {
    if (metodo === 'efectivo') return Number(pagoEfectivo || 0) >= total;
    if (metodo === 'tarjeta' || metodo === 'transferencia') return true;
    if (metodo === 'mixto') {
      return (Number(pagoEfectivo || 0) + Number(pagoTarjeta || 0) + Number(pagoTransferencia || 0)) >= total;
    }
    if (metodo === 'mp_qr' || metodo === 'mp_point' || metodo === 'stripe') {
      return gwEstado === 'approved'; // only allow confirm when gateway approved
    }
    return false;
  };

  // ── Gateway helpers ──────────────────────────────────────────────────────────

  const iniciarQrMP = async () => {
    setLoading(true);
    setGwEstado('pending');
    setGwQrDataUrl('');
    setGwExternalId('');
    stopGwPoll();
    try {
      const items = pedido ? pedido.detalles?.map((d: any) => ({ sku: d.sku, nombre: d.nombre, precio: Number(d.precio), cantidad: Number(d.cantidad) })) : cart.map(i => ({ sku: i.sku, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad }));
      const { data } = await pagosGatewayApi.crearQrMP({ total, folio, items });
      setGwExternalId(data.external_id);
      gwTransaccionIdRef.current = data.transaccion_id;
      // Generate QR code image from qr_data string
      const dataUrl = await QRCode.toDataURL(data.qr_data, { width: 250, margin: 2 });
      setGwQrDataUrl(dataUrl);
      // Start polling
      gwPollRef.current = setInterval(async () => {
        try {
          const { data: st } = await pagosGatewayApi.getEstadoMP(data.external_id);
          if (st.estado === 'approved') {
            setGwEstado('approved');
            stopGwPoll();
            toast.success('¡Pago aprobado por MercadoPago!');
          } else if (st.estado === 'rejected' || st.estado === 'cancelled') {
            setGwEstado('rejected');
            stopGwPoll();
            toast.error('Pago rechazado / cancelado');
          }
        } catch {}
      }, 3000);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al crear QR MP');
      setGwEstado('idle');
    } finally {
      setLoading(false);
    }
  };

  const iniciarPointMP = async () => {
    setLoading(true);
    setGwEstado('pending');
    setGwIntentId('');
    stopGwPoll();
    try {
      const { data } = await pagosGatewayApi.crearPointMP({ total, folio });
      setGwIntentId(data.intent_id);
      gwTransaccionIdRef.current = data.transaccion_id;
      toast.success('Solicitud enviada al terminal Point');
      gwPollRef.current = setInterval(async () => {
        try {
          const { data: st } = await pagosGatewayApi.getEstadoPoint(data.intent_id);
          if (st.estado === 'approved') {
            setGwEstado('approved');
            stopGwPoll();
            toast.success('¡Pago aprobado en terminal!');
          } else if (st.estado === 'cancelled' || st.estado === 'rejected') {
            setGwEstado('rejected');
            stopGwPoll();
            toast.error('Pago cancelado en terminal');
          } else if (st.estado === 'processing') {
            setGwEstado('processing');
          }
        } catch {}
      }, 3000);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al enviar a terminal MP Point');
      setGwEstado('idle');
    } finally {
      setLoading(false);
    }
  };

  const iniciarStripe = async () => {
    setLoading(true);
    setGwEstado('pending');
    setGwIntentId('');
    stopGwPoll();
    try {
      const { data } = await pagosGatewayApi.crearStripeIntent({ total, folio });
      setGwIntentId(data.intent_id);
      gwTransaccionIdRef.current = data.transaccion_id;
      toast('Esperando confirmación de pago Stripe...', { icon: '💳' });
      gwPollRef.current = setInterval(async () => {
        try {
          const { data: st } = await pagosGatewayApi.getEstadoStripe(data.intent_id);
          if (st.estado === 'approved') {
            setGwEstado('approved');
            stopGwPoll();
            toast.success('¡Pago Stripe aprobado!');
          } else if (st.estado === 'cancelled') {
            setGwEstado('rejected');
            stopGwPoll();
            toast.error('Pago Stripe cancelado');
          }
        } catch {}
      }, 4000);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error Stripe');
      setGwEstado('idle');
    } finally {
      setLoading(false);
    }
  };

  const cancelarGw = () => {
    stopGwPoll();
    setGwEstado('idle');
    setGwQrDataUrl('');
    setGwExternalId('');
    setGwIntentId('');
  };

  const ticketConfigRef = useRef<any>(null);

  const generarEImprimir = async (ventaData: any) => {
    try {
      const { data: ticket } = await ticketsApi.preview(ventaData);
      ticketRawRef.current = ticket.raw;
      ticketConfigRef.current = ticket;
      printTicket(ticket.raw, ticket.ancho_papel, ticket.fuente_familia, ticket.fuente_tamano, resolveUploadUrl(ticket.logo_url), ticket.logo_posicion, ticket.copias || 1);
    } catch {
      toast.error('No se pudo generar el ticket');
    }
  };

  const handleReprint = () => {
    if (ticketRawRef.current) {
      const t = ticketConfigRef.current;
      printTicket(ticketRawRef.current, t?.ancho_papel, t?.fuente_familia, t?.fuente_tamano, resolveUploadUrl(t?.logo_url), t?.logo_posicion, t?.copias || 1);
    }
  };

  const isGatewayMethod = (m: MetodoPago) => m === 'mp_qr' || m === 'mp_point' || m === 'stripe';

  const buildVentaData = () => ({
    caja_id: cajaActiva?.id,
    items: cart.map((i) => ({
      producto_id: i.producto_id,
      sku: i.sku,
      nombre: i.nombre,
      precio: i.precio,
      cantidad: i.cantidad,
      descuento: i.descuento,
      impuesto: i.impuesto,
      modificadores: i.modificadores,
      notas: i.notas,
    })),
    subtotal: getSubtotal(),
    descuento: 0,
    impuestos: getImpuestos(),
    total,
    metodo_pago: isGatewayMethod(metodo) ? 'tarjeta' : metodo,
    pago_efectivo: metodo === 'efectivo' || metodo === 'mixto' ? Number(pagoEfectivo || 0) : null,
    pago_tarjeta: (metodo === 'tarjeta' || metodo === 'mixto' || isGatewayMethod(metodo)) ? Number(pagoTarjeta || total) : null,
    pago_transferencia: metodo === 'transferencia' || metodo === 'mixto' ? Number(pagoTransferencia || total) : null,
    cambio,
    tipo_servicio: tipoServicio,
    gateway: isGatewayMethod(metodo) ? metodo : undefined,
    gateway_transaccion_id: isGatewayMethod(metodo) ? gwTransaccionIdRef.current : undefined,
    pagos: [],
  });

  const buildPagoData = () => ({
    caja_id: cajaActiva?.id,
    metodo_pago: isGatewayMethod(metodo) ? 'tarjeta' : metodo,
    pago_efectivo: metodo === 'efectivo' || metodo === 'mixto' ? Number(pagoEfectivo || 0) : null,
    pago_tarjeta: (metodo === 'tarjeta' || metodo === 'mixto' || isGatewayMethod(metodo)) ? Number(pagoTarjeta || total) : null,
    pago_transferencia: metodo === 'transferencia' || metodo === 'mixto' ? Number(pagoTransferencia || total) : null,
    cambio,
    gateway: isGatewayMethod(metodo) ? metodo : undefined,
    gateway_transaccion_id: isGatewayMethod(metodo) ? gwTransaccionIdRef.current : undefined,
    pagos: [],
  });

  const handlePay = async (mantenerAbierta = false) => {
    if (!canPay()) return;
    setLoading(true);

    try {
      if (pedido) {
        // ── Modo pedido: cobrar pedido existente ──
        const pagoData = buildPagoData();
        if (mantenerAbierta) {
          const { data } = await pedidosApi.cobrarParcial(pedido.id, pagoData);
          generarEImprimir(data.venta);
          toast.success(`Pago Mesa ${pedido.mesa} registrado — cuenta sigue abierta`);
          onClose(true);
        } else {
          const { data } = await pedidosApi.cobrar(pedido.id, pagoData);
          generarEImprimir(data.venta);
          setVentaCompletada(data.venta);
          toast.success(`Mesa ${pedido.mesa} cobrada`);
        }
      } else {
        // ── Modo carrito: venta directa ──
        const ventaData = buildVentaData();
        if (isOnline) {
          const { data } = await ventasApi.crear(ventaData);
          generarEImprimir(data);
          if (mantenerAbierta) {
            toast.success(`Pago $${data.total} registrado — puedes agregar más items`);
            onClose();
          } else {
            setVentaCompletada(data);
            toast.success(`Venta ${data.folio} completada`);
            clearCart();
          }
        } else {
          const folio = await offlineActions.saveVentaOffline(ventaData);
          if (mantenerAbierta) {
            toast.success(`Pago offline ${folio} guardado — puedes agregar más items`);
            onClose();
          } else {
            setVentaCompletada({ folio_offline: folio, total });
            toast.success(`Venta offline ${folio} guardada`);
            clearCart();
          }
        }
      }
    } catch (err: any) {
      if (!pedido) {
        const ventaData = buildVentaData();
        const folio = await offlineActions.saveVentaOffline(ventaData);
        if (mantenerAbierta) {
          toast(`Pago offline ${folio} — puedes agregar más items`, { icon: '📡' });
          onClose();
        } else {
          setVentaCompletada({ folio_offline: folio, total });
          toast('Guardada offline por error de red', { icon: '📡' });
          clearCart();
        }
      } else {
        toast.error(err.response?.data?.message || 'Error al procesar pago');
      }
    } finally {
      setLoading(false);
    }
  };

  if (ventaCompletada) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="card max-w-md w-full text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h2 className="text-2xl font-bold">Venta Completada</h2>
          <p className="text-lg text-iados-accent font-bold">
            {ventaCompletada.folio || ventaCompletada.folio_offline}
          </p>
          <p className="text-3xl font-bold">${Number(ventaCompletada.total).toFixed(2)}</p>
          {cambio > 0 && (
            <p className="text-xl text-green-400">Cambio: ${cambio.toFixed(2)}</p>
          )}
          {ticketRawRef.current && (
            <button onClick={handleReprint} className="btn-secondary w-full text-lg flex items-center justify-center gap-2">
              <Printer size={20} />
              Reimprimir Ticket
            </button>
          )}
          <button onClick={() => onClose()} className="btn-primary w-full text-lg">
            Nueva Venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Cobrar</h2>
            {pedido && (
              <p className="text-sm text-slate-400">
                Mesa {pedido.mesa} · {pedido.folio} · {pedido.detalles?.length || 0} items
                {pedido.cuenta_abierta && <span className="ml-2 text-orange-400">· Cuenta abierta</span>}
              </p>
            )}
          </div>
          <button onClick={() => onClose()} className="p-2 hover:bg-iados-card rounded-xl"><X size={24} /></button>
        </div>

        <div className="text-center mb-6">
          {(pedido?.tipo_servicio === 'para_llevar' || (!pedido && tipoServicio === 'para_llevar')) && (
            <div className="inline-flex items-center gap-1 bg-orange-600/20 border border-orange-500/40 text-orange-300 text-sm font-medium px-3 py-1 rounded-full mb-3">
              <ShoppingBag size={14} /> Para llevar
            </div>
          )}
          <p className="text-sm text-slate-400">Total a cobrar</p>
          <p className="text-4xl font-bold text-iados-accent">${total.toFixed(2)}</p>
        </div>

        {/* Métodos de pago */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          {([
            { key: 'efectivo', label: 'Efectivo', icon: Banknote },
            { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
            { key: 'transferencia', label: 'Transfer.', icon: ArrowRightLeft },
            { key: 'mixto', label: 'Mixto', icon: DollarSign },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setMetodo(key); cancelarGw(); }}
              className={`btn-touch flex-col gap-1 text-sm ${
                metodo === key ? 'bg-iados-primary ring-2 ring-iados-secondary' : 'bg-iados-card'
              }`}
            >
              <Icon size={24} />
              {label}
            </button>
          ))}
        </div>

        {/* Gateway buttons (only when online and configured) */}
        {isOnline && gwConfig && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {gwConfig.opciones?.mp_qr_habilitado && (
              <button
                onClick={() => { setMetodo('mp_qr'); cancelarGw(); }}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  metodo === 'mp_qr' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-iados-card border-slate-600 text-slate-300 hover:border-blue-500'
                }`}
              >
                <Wifi size={14} /> MP QR
              </button>
            )}
            {gwConfig.opciones?.mp_point_habilitado && (
              <button
                onClick={() => { setMetodo('mp_point'); cancelarGw(); }}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  metodo === 'mp_point' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-iados-card border-slate-600 text-slate-300 hover:border-blue-500'
                }`}
              >
                <Smartphone size={14} /> MP Point
              </button>
            )}
            {gwConfig.opciones?.stripe_habilitado && (
              <button
                onClick={() => { setMetodo('stripe'); cancelarGw(); }}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  metodo === 'stripe' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-iados-card border-slate-600 text-slate-300 hover:border-purple-500'
                }`}
              >
                <CreditCard size={14} /> Stripe
              </button>
            )}
          </div>
        )}

        {/* Campos de pago según método */}
        {(metodo === 'efectivo' || metodo === 'mixto') && (
          <div className="mb-4">
            <div className="flex gap-2 items-center mb-3">
              {metodo === 'mixto' && <label className="text-sm text-slate-400 shrink-0">Efectivo</label>}
              <input
                type="number"
                value={pagoEfectivo}
                onChange={(e) => setPagoEfectivo(e.target.value)}
                className="input-touch text-2xl text-center flex-1"
                placeholder="0.00"
                autoFocus
              />
              {Number(pagoEfectivo) > 0 && (
                <button
                  onClick={() => setPagoEfectivo('')}
                  className="p-3 rounded-xl bg-iados-card text-slate-400 hover:text-red-400 transition-colors"
                  title="Limpiar"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        )}

        {(metodo === 'tarjeta' || metodo === 'mixto') && (
          <div className="mb-4">
            <div className="flex gap-2 items-center mb-3">
              <label className="text-sm text-slate-400 shrink-0">Tarjeta</label>
              <input
                type="number"
                value={pagoTarjeta}
                onChange={(e) => setPagoTarjeta(e.target.value)}
                className="input-touch text-xl text-center flex-1"
                placeholder={metodo === 'tarjeta' ? total.toFixed(2) : '0.00'}
              />
              {Number(pagoTarjeta) > 0 && (
                <button onClick={() => setPagoTarjeta('')} className="p-3 rounded-xl bg-iados-card text-slate-400 hover:text-red-400 transition-colors"><X size={20} /></button>
              )}
            </div>
          </div>
        )}

        {(metodo === 'transferencia' || metodo === 'mixto') && (
          <div className="mb-4">
            <div className="flex gap-2 items-center mb-3">
              <label className="text-sm text-slate-400 shrink-0">Transferencia</label>
              <input
                type="number"
                value={pagoTransferencia}
                onChange={(e) => setPagoTransferencia(e.target.value)}
                className="input-touch text-xl text-center flex-1"
                placeholder={metodo === 'transferencia' ? total.toFixed(2) : '0.00'}
              />
              {Number(pagoTransferencia) > 0 && (
                <button onClick={() => setPagoTransferencia('')} className="p-3 rounded-xl bg-iados-card text-slate-400 hover:text-red-400 transition-colors"><X size={20} /></button>
              )}
            </div>
          </div>
        )}

        {/* Pad de denominaciones — aplica para todos los métodos excepto mixto */}
        {metodo !== 'mixto' && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2 text-center">Toca cada billete / moneda que entrega el cliente</p>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {([1000, 500, 200, 100] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => addDenom(d)}
                  className="bg-iados-card border border-slate-700 hover:bg-iados-primary/30 hover:border-iados-primary py-4 rounded-xl text-sm font-bold transition-colors active:scale-95"
                >
                  ${d >= 1000 ? `${d / 1000}k` : d}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {([50, 20, 10, 5] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => addDenom(d)}
                  className="bg-iados-card border border-slate-700 hover:bg-iados-primary/30 hover:border-iados-primary py-4 rounded-xl text-sm font-bold transition-colors active:scale-95"
                >
                  ${d}
                </button>
              ))}
            </div>
            <button
              onClick={() => addDenom(total - (metodo === 'tarjeta' ? Number(pagoTarjeta || 0) : metodo === 'transferencia' ? Number(pagoTransferencia || 0) : Number(pagoEfectivo || 0)))}
              className="btn-secondary w-full text-sm py-3"
            >
              Exacto — ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </button>
          </div>
        )}

        {/* Cambio */}
        {metodo === 'efectivo' && Number(pagoEfectivo) > 0 && (
          <div className="text-center mb-4 p-3 bg-green-900/30 rounded-xl">
            <span className="text-sm text-green-300">Cambio: </span>
            <span className="text-2xl font-bold text-green-400">${cambio.toFixed(2)}</span>
          </div>
        )}

        {/* ── Gateway panels ────────────────────────────────────────────── */}
        {metodo === 'mp_qr' && (
          <div className="mb-4 p-4 bg-iados-card/50 rounded-xl border border-blue-600/30 text-center space-y-3">
            <p className="text-sm font-bold text-blue-300">MercadoPago — Código QR</p>
            {gwEstado === 'idle' && (
              <button onClick={iniciarQrMP} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                <Wifi size={16} /> {loading ? 'Generando...' : 'Generar QR de cobro'}
              </button>
            )}
            {gwEstado === 'pending' && gwQrDataUrl && (
              <>
                <img src={gwQrDataUrl} alt="QR MP" className="mx-auto rounded-xl w-52 h-52" />
                <p className="text-xs text-slate-400">Muestra este QR al cliente para que pague con la app MP</p>
                <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm animate-pulse">
                  <RotateCw size={14} className="animate-spin" /> Esperando pago...
                </div>
                <button onClick={cancelarGw} className="text-xs text-red-400 hover:text-red-300">Cancelar</button>
              </>
            )}
            {gwEstado === 'approved' && (
              <div className="flex flex-col items-center gap-2 text-green-400">
                <CheckCircle2 size={48} />
                <p className="font-bold">¡Pago aprobado!</p>
                <p className="text-xs text-slate-400">Confirma la venta para registrarla</p>
              </div>
            )}
            {(gwEstado === 'rejected' || gwEstado === 'cancelled') && (
              <div className="flex flex-col items-center gap-2 text-red-400">
                <XCircle size={40} />
                <p className="font-bold">Pago rechazado</p>
                <button onClick={cancelarGw} className="text-xs text-slate-400 hover:text-white">Reintentar</button>
              </div>
            )}
          </div>
        )}

        {metodo === 'mp_point' && (
          <div className="mb-4 p-4 bg-iados-card/50 rounded-xl border border-blue-600/30 text-center space-y-3">
            <p className="text-sm font-bold text-blue-300">MercadoPago Point — Terminal físico</p>
            {gwEstado === 'idle' && (
              <button onClick={iniciarPointMP} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                <Smartphone size={16} /> {loading ? 'Enviando...' : 'Enviar cobro al terminal'}
              </button>
            )}
            {gwEstado === 'pending' && (
              <div className="space-y-2">
                <div className="text-5xl">📱</div>
                <p className="text-sm text-slate-300">Solicitud enviada al terminal</p>
                <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm animate-pulse">
                  <RotateCw size={14} className="animate-spin" /> Esperando respuesta del cliente...
                </div>
                <button onClick={cancelarGw} className="text-xs text-red-400">Cancelar</button>
              </div>
            )}
            {gwEstado === 'processing' && (
              <div className="flex flex-col items-center gap-2 text-blue-400">
                <RotateCw size={36} className="animate-spin" />
                <p>Procesando pago en terminal...</p>
              </div>
            )}
            {gwEstado === 'approved' && (
              <div className="flex flex-col items-center gap-2 text-green-400">
                <CheckCircle2 size={48} />
                <p className="font-bold">¡Pago aprobado en terminal!</p>
              </div>
            )}
            {(gwEstado === 'rejected' || gwEstado === 'cancelled') && (
              <div className="flex flex-col items-center gap-2 text-red-400">
                <XCircle size={40} />
                <p className="font-bold">Cancelado en terminal</p>
                <button onClick={cancelarGw} className="text-xs text-slate-400 hover:text-white">Reintentar</button>
              </div>
            )}
          </div>
        )}

        {metodo === 'stripe' && (
          <div className="mb-4 p-4 bg-iados-card/50 rounded-xl border border-purple-600/30 text-center space-y-3">
            <p className="text-sm font-bold text-purple-300">Stripe — Tarjeta</p>
            {gwEstado === 'idle' && (
              <button onClick={iniciarStripe} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                <CreditCard size={16} /> {loading ? 'Procesando...' : 'Iniciar cobro Stripe'}
              </button>
            )}
            {gwEstado === 'pending' && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-yellow-400 animate-pulse">
                  <RotateCw size={14} className="animate-spin" /> Esperando pago...
                </div>
                <p className="text-xs text-slate-400">Intent ID: {gwIntentId.substring(0, 20)}...</p>
                <button onClick={cancelarGw} className="text-xs text-red-400">Cancelar</button>
              </div>
            )}
            {gwEstado === 'approved' && (
              <div className="flex flex-col items-center gap-2 text-green-400">
                <CheckCircle2 size={48} />
                <p className="font-bold">¡Pago Stripe confirmado!</p>
              </div>
            )}
            {(gwEstado === 'rejected' || gwEstado === 'cancelled') && (
              <div className="flex flex-col items-center gap-2 text-red-400">
                <XCircle size={40} />
                <p className="font-bold">Pago cancelado</p>
                <button onClick={cancelarGw} className="text-xs text-slate-400 hover:text-white">Reintentar</button>
              </div>
            )}
          </div>
        )}

        {/* ── Confirm / pay buttons ─────────────────────────────────────────── */}
        <button
          onClick={() => handlePay(false)}
          disabled={!canPay() || loading}
          className="btn-success w-full text-lg disabled:opacity-50"
        >
          {loading ? 'Procesando...' : pedido ? `Cobrar Mesa ${pedido.mesa} — $${total.toFixed(2)}` : `Completar Venta $${total.toFixed(2)}`}
        </button>

      </div>
    </div>
  );
}
