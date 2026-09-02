// Detalle de un pedido de mostrador / QR mesa.
//
// Espejo de DetallePedidoWeb: la tabla unificada ya sabia abrir un modal para los
// pedidos web, pero los de mostrador solo mostraban una barra inferior con el folio en
// letra chica y sin la lista de productos. Aqui se muestra el pedido en grande (que es
// lo que se necesita en barra o cocina) y se conservan todas las acciones que vivian en
// esa barra.
//
// Es un componente de presentacion: no carga ni actualiza nada. Toda la logica de
// negocio (cobrar, cancelar, imprimir, asignar entrega) sigue en PedidosPage y llega
// aqui como callbacks, para no duplicarla.
import { X, CreditCard, Receipt, FileText, Truck, Check, Ban, AlertTriangle } from 'lucide-react';
import { PedidoUnificado, ESTADOS_UNIFICADOS, tiempoTranscurrido } from './pedidosUnificados';

interface Props {
  pedido: PedidoUnificado;
  mostrarPrecios: boolean;
  /** Acciones de cobro/cancelacion solo para quien opera la caja. */
  puedeOperar: boolean;
  precuentaEnabled: boolean;
  logisticaEnabled: boolean;
  entregaActual: any;
  cajaActiva: any;
  checkingCaja: boolean;
  onClose: () => void;
  onAvanzarEstado: (raw: any) => void;
  onCobrar: () => void;
  onCancelar: () => void;
  onConfirmarSO: (raw: any) => void;
  onRechazarSO: () => void;
  onPreCuenta: (raw: any) => void;
  onComanda: (raw: any) => void;
  onAsignarEntrega: () => void;
}

const money = (v: any) =>
  `$${Number(v || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

/** 2 -> "2", 1.5 -> "1.5" (los productos por peso llegan con decimales). */
const cantidad = (v: any) => {
  const n = Number(v || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
};

/** `modificadores` es JSON libre; se muestra solo si trae algo legible. */
function textoModificadores(mods: any): string | null {
  if (!mods) return null;
  const lista = Array.isArray(mods) ? mods : [mods];
  const nombres = lista
    .map((m: any) => (typeof m === 'string' ? m : m?.nombre ?? m?.name ?? null))
    .filter(Boolean);
  return nombres.length ? nombres.join(', ') : null;
}

export default function DetallePedidoPOS({
  pedido, mostrarPrecios, puedeOperar, precuentaEnabled, logisticaEnabled, entregaActual,
  cajaActiva, checkingCaja, onClose, onAvanzarEstado, onCobrar, onCancelar,
  onConfirmarSO, onRechazarSO, onPreCuenta, onComanda, onAsignarEntrega,
}: Props) {
  const p = pedido.raw;
  const est = ESTADOS_UNIFICADOS[pedido.estado];
  const EstIcon = est.icon;
  const detalles: any[] = p.detalles || [];

  const esSelfOrderPorConfirmar = p.self_order && p.estado === 'recibido' && !p.mesero_confirmado;
  const puedeAvanzar = p.estado === 'recibido' || p.estado === 'en_elaboracion';
  const puedeCobrar = ['recibido', 'en_elaboracion', 'listo_para_entrega'].includes(p.estado);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Encabezado: el numero de orden es lo mas grande de la pantalla */}
        <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-slate-700">
          <div className="min-w-0">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-4xl font-bold text-white tabular-nums">
                {pedido.numeroCorto !== null ? `#${pedido.numeroCorto}` : pedido.numero}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full ${est.bg} ${est.color}`}>
                <EstIcon size={14} /> {est.label}
              </span>
            </div>
            <p className="text-xl text-white mt-1">{pedido.referencia}</p>
            <p className="text-sm text-slate-400 mt-0.5">
              {pedido.subtitulo}
              <span className="mx-2">·</span>
              hace {tiempoTranscurrido(pedido.created_at)}
              {pedido.numeroCorto !== null && (
                <>
                  <span className="mx-2">·</span>
                  <span className="font-mono text-xs">{pedido.numero}</span>
                </>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white shrink-0 p-1" title="Cerrar">
            <X size={22} />
          </button>
        </div>

        {esSelfOrderPorConfirmar && (
          <div className="mx-6 mt-4 flex items-center gap-2 text-sm text-orange-300 bg-orange-900/30 border border-orange-800 rounded-xl px-3 py-2">
            <AlertTriangle size={16} className="shrink-0" />
            El cliente pidio desde su celular y todavia no se le confirma.
          </div>
        )}

        {p.notas && (
          <div className="mx-6 mt-4 text-base text-amber-300/90 bg-amber-900/20 border border-amber-800/50 rounded-xl px-3 py-2">
            💬 {p.notas}
          </div>
        )}

        {/* Productos: cantidad y nombre en grande, que es la queja original */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {detalles.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Este pedido no tiene productos capturados.</p>
          ) : (
            <div className="divide-y divide-slate-700">
              {detalles.map((d: any, i: number) => {
                const mods = textoModificadores(d.modificadores);
                return (
                  <div key={d.id ?? i} className="flex items-start gap-4 py-3">
                    <span className="text-2xl font-bold text-iados-primary tabular-nums shrink-0 min-w-[2.5rem] text-right">
                      {cantidad(d.cantidad)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg text-white leading-snug">{d.producto_nombre}</p>
                      {mods && <p className="text-sm text-slate-400 mt-0.5">{mods}</p>}
                      {d.notas && <p className="text-base text-amber-300/90 mt-0.5">↳ {d.notas}</p>}
                    </div>
                    {mostrarPrecios && (
                      <span className="text-lg text-white font-medium tabular-nums shrink-0">
                        {money(d.subtotal)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Total + acciones */}
        <div className="border-t border-slate-700 p-6 pt-4 space-y-4">
          {mostrarPrecios && (
            <div className="flex justify-between items-baseline">
              <span className="text-lg text-slate-300">Total</span>
              <span className="text-3xl font-bold text-green-400 tabular-nums">{money(p.total)}</span>
            </div>
          )}

          {logisticaEnabled && entregaActual && (
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <Truck size={15} /> {entregaActual.repartidor_nombre} — {entregaActual.estado}
            </p>
          )}

          {puedeOperar && (
            <>
              {!checkingCaja && !cajaActiva && puedeCobrar && (
                <p className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-900/30 border border-yellow-800 rounded-xl px-3 py-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  No puedes cobrar: no hay caja abierta. Abrela en POS o Caja.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {esSelfOrderPorConfirmar && (
                  <>
                    <button
                      onClick={() => onConfirmarSO(p)}
                      className="bg-green-700 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5"
                    >
                      <Check size={16} /> Confirmar al cliente
                    </button>
                    <button
                      onClick={onRechazarSO}
                      className="bg-red-800 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5"
                    >
                      <Ban size={16} /> Rechazar
                    </button>
                  </>
                )}

                {puedeAvanzar && (
                  <button onClick={() => onAvanzarEstado(p)} className="btn-secondary text-sm">
                    {p.estado === 'recibido' ? 'Iniciar Preparacion' : 'Marcar Listo'}
                  </button>
                )}

                {puedeCobrar && (
                  <button
                    onClick={onCobrar}
                    disabled={!cajaActiva || checkingCaja}
                    title={!checkingCaja && !cajaActiva ? 'No hay caja abierta — abrela en POS o Caja para poder cobrar' : undefined}
                    className="btn-primary text-sm"
                  >
                    <CreditCard size={16} className="mr-1" />Cobrar
                  </button>
                )}

                {precuentaEnabled && (
                  <button onClick={() => onPreCuenta(p)} className="btn-secondary text-sm flex items-center gap-1.5" title="Imprimir Pre-cuenta">
                    <FileText size={15} /> Pre-cuenta
                  </button>
                )}

                <button onClick={() => onComanda(p)} className="btn-secondary text-sm flex items-center gap-1.5" title="Imprimir Comanda">
                  <Receipt size={15} /> Comanda
                </button>

                {logisticaEnabled && !entregaActual && (
                  <button onClick={onAsignarEntrega} className="btn-secondary text-sm flex items-center gap-1.5" title="Asignar a repartidor">
                    <Truck size={15} /> Asignar entrega
                  </button>
                )}

                <button
                  onClick={onCancelar}
                  className="text-red-400 hover:bg-red-900/50 px-4 py-2.5 rounded-xl text-sm ml-auto"
                >
                  Cancelar pedido
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
