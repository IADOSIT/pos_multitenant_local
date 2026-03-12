import { useState, useRef } from 'react';
import { usePOSStore } from '../../store/pos.store';
import { offlineActions } from '../../store/offline.store';
import { ventasApi, ticketsApi } from '../../api/endpoints';
import { resolveUploadUrl } from '../../api/client';
import { printTicket } from '../../utils/printTicket';
import toast from 'react-hot-toast';
import { X, DollarSign, CreditCard, ArrowRightLeft, Banknote, Printer } from 'lucide-react';

interface Props {
  onClose: () => void;
  isOnline: boolean;
}

type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';

export default function PayModal({ onClose, isOnline }: Props) {
  const { cart, getSubtotal, getImpuestos, getTotal, clearCart, cajaActiva } = usePOSStore();
  const total = getTotal();
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
  const [pagoEfectivo, setPagoEfectivo] = useState('');
  const [pagoTarjeta, setPagoTarjeta] = useState('');
  const [pagoTransferencia, setPagoTransferencia] = useState('');
  const [loading, setLoading] = useState(false);
  const [ventaCompletada, setVentaCompletada] = useState<any>(null);
  const ticketRawRef = useRef<string>('');

  const cambio = metodo === 'efectivo' ? Math.max(0, Number(pagoEfectivo || 0) - total) : 0;

  const addDenom = (d: number) =>
    setPagoEfectivo((prev) => String(Math.round((Number(prev || 0) + d) * 100) / 100));

  const canPay = () => {
    if (metodo === 'efectivo') return Number(pagoEfectivo || 0) >= total;
    if (metodo === 'tarjeta' || metodo === 'transferencia') return true;
    if (metodo === 'mixto') {
      return (Number(pagoEfectivo || 0) + Number(pagoTarjeta || 0) + Number(pagoTransferencia || 0)) >= total;
    }
    return false;
  };

  const ticketConfigRef = useRef<any>(null);

  const generarEImprimir = async (ventaData: any) => {
    try {
      const { data: ticket } = await ticketsApi.preview(ventaData);
      ticketRawRef.current = ticket.raw;
      ticketConfigRef.current = ticket;
      printTicket(ticket.raw, ticket.ancho_papel, ticket.fuente_familia, ticket.fuente_tamano, resolveUploadUrl(ticket.logo_url), ticket.logo_posicion);
    } catch {
      toast.error('No se pudo generar el ticket');
    }
  };

  const handleReprint = () => {
    if (ticketRawRef.current) {
      const t = ticketConfigRef.current;
      printTicket(ticketRawRef.current, t?.ancho_papel, t?.fuente_familia, t?.fuente_tamano, resolveUploadUrl(t?.logo_url), t?.logo_posicion);
    }
  };

  const handlePay = async () => {
    if (!canPay()) return;
    setLoading(true);

    const ventaData = {
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
      metodo_pago: metodo,
      pago_efectivo: metodo === 'efectivo' || metodo === 'mixto' ? Number(pagoEfectivo || 0) : null,
      pago_tarjeta: metodo === 'tarjeta' || metodo === 'mixto' ? Number(pagoTarjeta || total) : null,
      pago_transferencia: metodo === 'transferencia' || metodo === 'mixto' ? Number(pagoTransferencia || total) : null,
      cambio,
      pagos: [],
    };

    try {
      if (isOnline) {
        const { data } = await ventasApi.crear(ventaData);
        setVentaCompletada(data);
        toast.success(`Venta ${data.folio} completada`);
        generarEImprimir(data);
      } else {
        const folio = await offlineActions.saveVentaOffline(ventaData);
        setVentaCompletada({ folio_offline: folio, total });
        toast.success(`Venta offline ${folio} guardada`);
      }
      clearCart();
    } catch (err: any) {
      const folio = await offlineActions.saveVentaOffline(ventaData);
      setVentaCompletada({ folio_offline: folio, total });
      toast('Guardada offline por error de red', { icon: '📡' });
      clearCart();
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
          <button onClick={onClose} className="btn-primary w-full text-lg">
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
          <h2 className="text-xl font-bold">Cobrar</h2>
          <button onClick={onClose} className="p-2 hover:bg-iados-card rounded-xl"><X size={24} /></button>
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-slate-400">Total a cobrar</p>
          <p className="text-4xl font-bold text-iados-accent">${total.toFixed(2)}</p>
        </div>

        {/* Métodos de pago */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {([
            { key: 'efectivo', label: 'Efectivo', icon: Banknote },
            { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
            { key: 'transferencia', label: 'Transfer.', icon: ArrowRightLeft },
            { key: 'mixto', label: 'Mixto', icon: DollarSign },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMetodo(key)}
              className={`btn-touch flex-col gap-1 text-sm ${
                metodo === key ? 'bg-iados-primary ring-2 ring-iados-secondary' : 'bg-iados-card'
              }`}
            >
              <Icon size={24} />
              {label}
            </button>
          ))}
        </div>

        {/* Campos de pago según método */}
        {(metodo === 'efectivo' || metodo === 'mixto') && (
          <div className="mb-4">
            {/* Monto recibido + botón limpiar */}
            <div className="flex gap-2 items-center mb-3">
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

            {/* Pad de denominaciones — toca cada billete/moneda recibido */}
            {metodo === 'efectivo' && (
              <>
                <p className="text-xs text-slate-500 mb-2 text-center">Toca cada billete / moneda que entrega el cliente</p>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {([1000, 500, 200, 100] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => addDenom(d)}
                      className="bg-iados-card border border-slate-700 hover:bg-iados-primary/30 hover:border-iados-primary text-white py-4 rounded-xl text-sm font-bold transition-colors active:scale-95"
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
                      className="bg-iados-card border border-slate-700 hover:bg-iados-primary/30 hover:border-iados-primary text-white py-4 rounded-xl text-sm font-bold transition-colors active:scale-95"
                    >
                      ${d}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPagoEfectivo(total.toFixed(2))}
                  className="btn-secondary w-full text-sm py-3"
                >
                  Exacto — ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </button>
              </>
            )}
          </div>
        )}

        {(metodo === 'tarjeta' || metodo === 'mixto') && (
          <div className="mb-4">
            <label className="text-sm text-slate-400 mb-1 block">Tarjeta</label>
            <input
              type="number"
              value={pagoTarjeta}
              onChange={(e) => setPagoTarjeta(e.target.value)}
              className="input-touch text-xl text-center"
              placeholder={metodo === 'tarjeta' ? total.toFixed(2) : '0.00'}
            />
          </div>
        )}

        {(metodo === 'transferencia' || metodo === 'mixto') && (
          <div className="mb-4">
            <label className="text-sm text-slate-400 mb-1 block">Transferencia</label>
            <input
              type="number"
              value={pagoTransferencia}
              onChange={(e) => setPagoTransferencia(e.target.value)}
              className="input-touch text-xl text-center"
              placeholder={metodo === 'transferencia' ? total.toFixed(2) : '0.00'}
            />
          </div>
        )}

        {/* Cambio */}
        {metodo === 'efectivo' && Number(pagoEfectivo) > 0 && (
          <div className="text-center mb-4 p-3 bg-green-900/30 rounded-xl">
            <span className="text-sm text-green-300">Cambio: </span>
            <span className="text-2xl font-bold text-green-400">${cambio.toFixed(2)}</span>
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={!canPay() || loading}
          className="btn-success w-full text-lg disabled:opacity-50"
        >
          {loading ? 'Procesando...' : `Completar Venta $${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
