import { useState, useEffect } from 'react';
import { devolucionesApi, ventasApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { X, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  ventaId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DevolucionModal({ ventaId, onClose, onSuccess }: Props) {
  const [venta, setVenta] = useState<any>(null);
  const [devsExistentes, setDevsExistentes] = useState<any[]>([]);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  useEffect(() => { cargar(); }, [ventaId]);

  const cargar = async () => {
    setLoading(true);
    try {
      const [vRes, dRes] = await Promise.all([
        ventasApi.get(ventaId),
        devolucionesApi.porVenta(ventaId),
      ]);
      setVenta(vRes.data);
      setDevsExistentes(dRes.data || []);
    } catch { toast.error('Error cargando venta'); onClose(); }
    finally { setLoading(false); }
  };

  // Cantidad ya devuelta por producto_id
  const yaDevuelto = (productoId: number): number => {
    return devsExistentes.reduce((sum: number, dev: any) => {
      const item = dev.items?.find((i: any) => i.producto_id === productoId);
      return sum + (item ? Number(item.cantidad) : 0);
    }, 0);
  };

  const maxDevolvible = (detalle: any): number => {
    return Number(detalle.cantidad) - yaDevuelto(detalle.producto_id);
  };

  const setCantidad = (productoId: number, val: number, max: number) => {
    const v = Math.max(0, Math.min(val, max));
    setCantidades(prev => ({ ...prev, [productoId]: v }));
  };

  const totalDevolver = venta?.detalles?.reduce((sum: number, d: any) => {
    const cant = cantidades[d.producto_id] || 0;
    return sum + cant * Number(d.precio_unitario);
  }, 0) || 0;

  const itemsSeleccionados = venta?.detalles?.filter((d: any) => (cantidades[d.producto_id] || 0) > 0) || [];

  const handleConfirmar = async () => {
    if (!itemsSeleccionados.length) return toast.error('Selecciona al menos un ítem a devolver');
    setSaving(true);
    try {
      const items = itemsSeleccionados.map((d: any) => ({
        producto_id: d.producto_id,
        cantidad: cantidades[d.producto_id],
      }));
      const { data } = await devolucionesApi.crear({ venta_id: ventaId, motivo, items });
      setResultado(data);
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al procesar devolución');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card max-w-lg w-full max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <RotateCcw size={18} className="text-amber-400" />
            Devolución
            {venta && <span className="text-slate-400 text-sm font-normal">· {venta.folio}</span>}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-iados-card rounded-lg"><X size={18} /></button>
        </div>

        {loading && <div className="text-center py-8 text-slate-400">Cargando...</div>}

        {/* Resultado exitoso */}
        {resultado && (
          <div className="text-center py-6 space-y-3">
            <CheckCircle size={48} className="mx-auto text-green-400" />
            <p className="font-bold text-lg">Devolución registrada</p>
            <div className="bg-iados-card rounded-xl p-4 space-y-1">
              <p className="text-xs text-slate-400">Folio</p>
              <p className="text-2xl font-black text-amber-400">{resultado.folio}</p>
              <p className="text-green-400 font-bold text-lg">${Number(resultado.monto_total).toFixed(2)} en efectivo</p>
            </div>
            <p className="text-xs text-slate-500">Entrega el efectivo al cliente y guarda este folio.</p>
            <button onClick={onClose} className="btn-primary w-full">Cerrar</button>
          </div>
        )}

        {/* Form */}
        {!loading && !resultado && venta && (
          <>
            <div className="overflow-y-auto flex-1 space-y-2 mb-4">
              {/* Aviso devoluciones anteriores */}
              {devsExistentes.length > 0 && (
                <div className="flex items-start gap-2 bg-amber-900/30 border border-amber-700/50 rounded-lg p-3 text-xs text-amber-300">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>Esta venta ya tiene {devsExistentes.length} devolución(es) previas. Las cantidades máximas se ajustaron automáticamente.</span>
                </div>
              )}

              {/* Tabla de ítems */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs border-b border-slate-700">
                    <th className="pb-2">Producto</th>
                    <th className="pb-2 text-center">Comprado</th>
                    <th className="pb-2 text-center">Devuelto</th>
                    <th className="pb-2 text-center w-24">Devolver</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.detalles?.map((d: any) => {
                    const max = maxDevolvible(d);
                    const ya = yaDevuelto(d.producto_id);
                    const cant = cantidades[d.producto_id] || 0;
                    return (
                      <tr key={d.producto_id} className={`border-b border-slate-800 ${max === 0 ? 'opacity-40' : ''}`}>
                        <td className="py-2 pr-2">
                          <div className="font-medium text-xs leading-tight">{d.producto_nombre}</div>
                          <div className="text-slate-500 text-xs">${Number(d.precio_unitario).toFixed(2)} c/u</div>
                        </td>
                        <td className="py-2 text-center text-xs">{Number(d.cantidad)}</td>
                        <td className="py-2 text-center text-xs text-amber-400">{ya > 0 ? ya : '—'}</td>
                        <td className="py-2">
                          {max > 0 ? (
                            <div className="flex items-center gap-1 justify-center">
                              <button
                                onClick={() => setCantidad(d.producto_id, cant - 1, max)}
                                className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-sm font-bold flex items-center justify-center"
                              >−</button>
                              <span className="w-6 text-center font-bold text-sm">{cant}</span>
                              <button
                                onClick={() => setCantidad(d.producto_id, cant + 1, max)}
                                className="w-6 h-6 rounded bg-iados-primary hover:bg-iados-primary/80 text-sm font-bold flex items-center justify-center"
                              >+</button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600 block text-center">Devuelto</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Motivo */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Motivo (opcional)</label>
                <input
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder="Producto defectuoso, error en cobro..."
                  className="input-touch text-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-slate-700 pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">{itemsSeleccionados.length} ítem(s) · Reembolso en efectivo</span>
                <span className="text-green-400 font-black text-xl">${totalDevolver.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
                <button
                  onClick={handleConfirmar}
                  disabled={saving || !itemsSeleccionados.length}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {saving ? 'Procesando...' : 'Confirmar devolución'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
