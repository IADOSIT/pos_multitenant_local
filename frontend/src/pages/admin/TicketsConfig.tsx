import { useState, useEffect, useRef } from 'react';
import { ticketsApi } from '../../api/endpoints';
import { resolveUploadUrl } from '../../api/client';
import toast from 'react-hot-toast';
import { Receipt, Upload, Image, X } from 'lucide-react';

const FUENTES = [
  'Courier New',
  'Consolas',
  'Lucida Console',
  'Courier',
  'monospace',
];

const TAMANOS = [7, 8, 9, 10, 11, 12];

export default function TicketsConfig() {
  const [config, setConfig] = useState<any>(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const { data } = await ticketsApi.getConfig(); setConfig(data); } catch {}
  };

  const update = (field: string, value: any) => setConfig((c: any) => ({ ...c, [field]: value }));

  const handleSave = async () => {
    try {
      if (config.id) { await ticketsApi.updateConfig(config.id, config); }
      else { await ticketsApi.saveConfig(config); }
      toast.success('Configuracion guardada');
    } catch { toast.error('Error'); }
  };

  const handlePreview = async () => {
    try {
      const ventaDemo = {
        folio: 'V-DEMO', created_at: new Date(), usuario_nombre: 'Cajero Demo',
        subtotal: 189, descuento: 0, impuestos: 30.24, total: 219.24,
        pago_efectivo: 250, cambio: 30.76,
        detalles: [
          { producto_nombre: 'Hamburguesa Clasica', cantidad: 2, precio_unitario: 89, subtotal: 178 },
          { producto_nombre: 'Refresco 600ml', cantidad: 1, precio_unitario: 25, subtotal: 25 },
        ],
      };
      const { data } = await ticketsApi.preview(ventaDemo);
      setPreview(data.raw);
    } catch { toast.error('Error en preview'); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await ticketsApi.uploadLogo(file);
      update('logo_url', data.logo_url);
      toast.success('Logo subido');
    } catch { toast.error('Error al subir logo'); }
    finally { setUploading(false); if (logoRef.current) logoRef.current.value = ''; }
  };

  if (!config) return <div className="p-4 text-center text-slate-400">Cargando...</div>;

  const logoUrl = config.logo_url ? resolveUploadUrl(config.logo_url) : null;
  const showLogo = config.mostrar_logo && logoUrl;
  const logoCentrado = (config.logo_posicion || 'centro') === 'centro';
  const fontStyle = {
    fontFamily: config.fuente_familia || 'Courier New',
    fontSize: `${config.fuente_tamano || 9}pt`,
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-4"><Receipt size={24} /> Config. Ticket</h1>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* ── Formulario ── */}
        <div className="card space-y-3">

          {/* Logo */}
          <h3 className="font-bold">Logo del Ticket</h3>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="relative">
                <img src={logoUrl} alt="Logo" className="w-20 h-20 rounded-xl object-contain border border-slate-700 bg-white p-1" />
                <button onClick={() => update('logo_url', null)} className="absolute -top-2 -right-2 bg-red-600 rounded-full p-0.5"><X size={12} /></button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl bg-iados-card flex items-center justify-center text-slate-500 border border-slate-700">
                <Image size={24} />
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400 mb-2">Se imprime en la parte superior del ticket</p>
              <button onClick={() => logoRef.current?.click()} disabled={uploading} className="btn-secondary text-xs flex items-center gap-1">
                <Upload size={14} /> {uploading ? 'Subiendo...' : 'Subir Logo'}
              </button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>

          {/* Posición del logo */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Posición del logo</label>
            <div className="flex gap-3">
              {[
                { value: 'centro', label: 'Centrado (sin justificar)' },
                { value: 'izquierda', label: 'Izquierda (con el texto)' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="logo_posicion"
                    value={opt.value}
                    checked={(config.logo_posicion || 'centro') === opt.value}
                    onChange={() => update('logo_posicion', opt.value)}
                    className="accent-iados-accent"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Tipografía */}
          <h3 className="font-bold pt-2">Tipografía</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400">Fuente</label>
              <select value={config.fuente_familia || 'Courier New'} onChange={(e) => update('fuente_familia', e.target.value)} className="input-touch">
                {FUENTES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Tamaño (pt)</label>
              <select value={config.fuente_tamano || 9} onChange={(e) => update('fuente_tamano', Number(e.target.value))} className="input-touch">
                {TAMANOS.map(t => <option key={t} value={t}>{t} pt</option>)}
              </select>
            </div>
          </div>

          {/* Encabezado */}
          <h3 className="font-bold pt-2">Encabezado</h3>
          <input value={config.encabezado_linea1 || ''} onChange={(e) => update('encabezado_linea1', e.target.value)} placeholder="Linea 1 (ej: nombre negocio)" className="input-touch" />
          <input value={config.encabezado_linea2 || ''} onChange={(e) => update('encabezado_linea2', e.target.value)} placeholder="Linea 2 (ej: direccion)" className="input-touch" />
          <input value={config.encabezado_linea3 || ''} onChange={(e) => update('encabezado_linea3', e.target.value)} placeholder="Linea 3 (ej: telefono)" className="input-touch" />

          {/* Pie */}
          <h3 className="font-bold pt-2">Pie</h3>
          <input value={config.pie_linea1 || ''} onChange={(e) => update('pie_linea1', e.target.value)} placeholder="Pie linea 1" className="input-touch" />
          <input value={config.pie_linea2 || ''} onChange={(e) => update('pie_linea2', e.target.value)} placeholder="Pie linea 2" className="input-touch" />

          {/* Papel */}
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

          {/* Opciones */}
          <h3 className="font-bold pt-2">Opciones</h3>
          {[
            ['mostrar_logo',        'Imprimir logo en ticket'],
            ['mostrar_fecha',       'Mostrar fecha'],
            ['mostrar_cajero',      'Mostrar cajero'],
            ['mostrar_folio',       'Mostrar folio'],
            ['mostrar_marca_iados', 'Mostrar "Desarrollado por iaDoS"'],
          ].map(([field, label]) => (
            <label key={field} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!config[field]} onChange={(e) => update(field, e.target.checked)} className="w-5 h-5 rounded" />
              <span className="text-sm">{label}</span>
            </label>
          ))}

          <div className="flex gap-2 pt-2">
            <button onClick={handlePreview} className="btn-secondary flex-1">Preview</button>
            <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="card">
          <h3 className="font-bold mb-3">Vista Previa</h3>
          <div className="bg-white text-black p-4 rounded-xl min-h-[300px]">
            {showLogo && (
              <div className={`mb-1 ${logoCentrado ? 'text-center' : 'text-left'}`}>
                <img
                  src={logoUrl!}
                  alt="Logo"
                  className={`h-12 object-contain ${logoCentrado ? 'mx-auto' : ''}`}
                />
              </div>
            )}
            <pre style={fontStyle} className="whitespace-pre-wrap leading-tight">{preview || 'Haz clic en "Preview" para ver el ticket'}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
