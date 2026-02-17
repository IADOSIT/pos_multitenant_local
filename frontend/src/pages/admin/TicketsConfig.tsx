import { useState, useEffect } from 'react';
import { ticketsApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { Receipt } from 'lucide-react';

export default function TicketsConfig() {
  const [config, setConfig] = useState<any>(null);
  const [preview, setPreview] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const { data } = await ticketsApi.getConfig(); setConfig(data); } catch {}
  };

  const handleSave = async () => {
    try {
      if (config.id) { await ticketsApi.updateConfig(config.id, config); }
      else { await ticketsApi.saveConfig(config); }
      toast.success('Configuración guardada');
    } catch { toast.error('Error'); }
  };

  const handlePreview = async () => {
    try {
      const ventaDemo = {
        folio: 'V-DEMO', created_at: new Date(), usuario_nombre: 'Cajero Demo',
        subtotal: 189, descuento: 0, impuestos: 30.24, total: 219.24,
        pago_efectivo: 250, cambio: 30.76,
        detalles: [
          { producto_nombre: 'Hamburguesa Clásica', cantidad: 2, precio_unitario: 89, subtotal: 178 },
          { producto_nombre: 'Refresco 600ml', cantidad: 1, precio_unitario: 25, subtotal: 25 },
        ],
      };
      const { data } = await ticketsApi.preview(ventaDemo);
      setPreview(data.raw);
    } catch { toast.error('Error en preview'); }
  };

  if (!config) return <div className="p-4 text-center text-slate-400">Cargando...</div>;

  const update = (field: string, value: any) => setConfig({ ...config, [field]: value });

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-4"><Receipt size={24} /> Config. Ticket</h1>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <h3 className="font-bold">Encabezado</h3>
          <input value={config.encabezado_linea1 || ''} onChange={(e) => update('encabezado_linea1', e.target.value)} placeholder="Línea 1" className="input-touch" />
          <input value={config.encabezado_linea2 || ''} onChange={(e) => update('encabezado_linea2', e.target.value)} placeholder="Línea 2" className="input-touch" />
          <input value={config.encabezado_linea3 || ''} onChange={(e) => update('encabezado_linea3', e.target.value)} placeholder="Línea 3" className="input-touch" />

          <h3 className="font-bold pt-2">Pie</h3>
          <input value={config.pie_linea1 || ''} onChange={(e) => update('pie_linea1', e.target.value)} placeholder="Pie línea 1" className="input-touch" />
          <input value={config.pie_linea2 || ''} onChange={(e) => update('pie_linea2', e.target.value)} placeholder="Pie línea 2" className="input-touch" />

          <h3 className="font-bold pt-2">Papel</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400">Ancho (mm)</label>
              <select value={config.ancho_papel} onChange={(e) => update('ancho_papel', Number(e.target.value))} className="input-touch">
                <option value={58}>58mm</option><option value={80}>80mm</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Columnas</label>
              <input type="number" value={config.columnas} onChange={(e) => update('columnas', Number(e.target.value))} className="input-touch" />
            </div>
          </div>

          <h3 className="font-bold pt-2">Opciones</h3>
          {[
            ['mostrar_logo', 'Mostrar logo'],
            ['mostrar_fecha', 'Mostrar fecha'],
            ['mostrar_cajero', 'Mostrar cajero'],
            ['mostrar_folio', 'Mostrar folio'],
            ['mostrar_marca_iados', 'Mostrar "Desarrollado por iaDoS"'],
          ].map(([field, label]) => (
            <label key={field} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={config[field]} onChange={(e) => update(field, e.target.checked)} className="w-5 h-5 rounded" />
              <span className="text-sm">{label}</span>
            </label>
          ))}

          <div className="flex gap-2 pt-2">
            <button onClick={handlePreview} className="btn-secondary flex-1">Preview</button>
            <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
          </div>
        </div>

        {/* Preview */}
        <div className="card">
          <h3 className="font-bold mb-3">Vista Previa</h3>
          <div className="bg-white text-black p-4 rounded-xl font-mono text-xs whitespace-pre-wrap min-h-[300px]">
            {preview || 'Haz clic en "Preview" para ver el ticket'}
          </div>
        </div>
      </div>
    </div>
  );
}
