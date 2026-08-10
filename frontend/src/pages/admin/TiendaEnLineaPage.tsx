import { useState, useEffect, useCallback } from 'react';
import { ecommerceApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';
import {
  Globe, Store, Palette, Check, X, Copy, ExternalLink, Loader2,
  ShoppingBag, TrendingUp, Package, ToggleLeft, ToggleRight, Eye
} from 'lucide-react';

const DOMINIOBASE = 'pos.iados.online';

const TEMAS_PREVIEW: Record<string, { bg: string; primary: string; secondary: string; text: string; border: string; nombre: string; desc: string }> = {
  lumina:   { bg: '#f8fafc', primary: '#1e40af', secondary: '#0f172a', text: '#0f172a', border: '#e2e8f0', nombre: 'Lumina',   desc: 'Blanco · Azul corporativo' },
  obsidian: { bg: '#0a0a0a', primary: '#f59e0b', secondary: '#0a0a0a', text: '#f4f4f5', border: '#1f1f1f', nombre: 'Obsidian', desc: 'Negro · Dorado premium' },
  zest:     { bg: '#fffbf5', primary: '#f97316', secondary: '#1c1917', text: '#1c1917', border: '#fed7aa', nombre: 'Zest',     desc: 'Cálido · Naranja vibrante' },
  'iados-electronica': { bg: '#ffffff', primary: '#ff8717', secondary: '#121416', text: '#121416', border: '#e5e5e5', nombre: 'iaDoS Electrónica', desc: 'Tech · Naranja + Dosis' },
  'iados-market':      { bg: '#ffffff', primary: '#629d23', secondary: '#2c3c28', text: '#1f1f25', border: '#e2e2e2', nombre: 'iaDoS Market',      desc: 'Grocery · Verde + Barlow' },
};

export default function TiendaEnLineaPage() {
  const { user } = useAuthStore();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    activo: false, subdominio: '', nombre_tienda: '', descripcion: '',
    color_primario: '#1e40af', color_secundario: '#0f172a',
    modo_mayoreo: false, qty_min_mayoreo: 10, mensaje_mayoreo: '',
    politica_envio: '', terminos: '', tema_id: 'lumina',
  });
  const [subdCheck, setSubdCheck] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const [subdTimer, setSubdTimer] = useState<any>(null);
  const [stats, setStats] = useState({ productos: 0, pedidos: 0, semana: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await ecommerceApi.getConfig();
      if (data) {
        setConfig(data);
        setForm({
          activo: data.activo,
          subdominio: data.subdominio || '',
          nombre_tienda: data.nombre_tienda || '',
          descripcion: data.descripcion || '',
          color_primario: data.color_primario || '#1e40af',
          color_secundario: data.color_secundario || '#0f172a',
          modo_mayoreo: data.modo_mayoreo,
          qty_min_mayoreo: data.qty_min_mayoreo || 10,
          mensaje_mayoreo: data.mensaje_mayoreo || '',
          politica_envio: data.politica_envio || '',
          terminos: data.terminos || '',
          tema_id: data.tema_id || 'lumina',
        });
      }
      // Stats básicas
      const pedRes = await ecommerceApi.listPedidos({ limit: 1 });
      setStats(s => ({ ...s, pedidos: pedRes.data?.meta?.total || 0 }));
    } catch { /* config vacía */ }
    setLoading(false);
  }

  const checkSubdominio = useCallback((val: string) => {
    if (subdTimer) clearTimeout(subdTimer);
    if (!val) { setSubdCheck('idle'); return; }
    setSubdCheck('checking');
    const t = setTimeout(async () => {
      try {
        const { data } = await ecommerceApi.verificarSubdominio(val);
        setSubdCheck(data.disponible ? 'ok' : 'taken');
      } catch { setSubdCheck('idle'); }
    }, 600);
    setSubdTimer(t);
  }, [subdTimer]);

  async function generarSubdominio() {
    if (!form.nombre_tienda) { toast.error('Escribe el nombre de la tienda primero'); return; }
    const { data } = await ecommerceApi.generarSubdominio(form.nombre_tienda);
    const sub = typeof data === 'string' ? data : data.subdominio;
    setForm((f: any) => ({ ...f, subdominio: sub }));
    setSubdCheck('ok');
  }

  async function guardar() {
    if (form.activo && !form.subdominio) { toast.error('Define el subdominio primero'); return; }
    if (subdCheck === 'taken') { toast.error('El subdominio no está disponible'); return; }
    setSaving(true);
    try {
      const { data } = await ecommerceApi.saveConfig(form);
      setConfig(data);
      toast.success('Tienda en línea actualizada');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al guardar');
    }
    setSaving(false);
  }

  function copyLink() {
    if (!form.subdominio) return;
    navigator.clipboard.writeText(`https://${form.subdominio}.${DOMINIOBASE}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const storeUrl = form.subdominio ? `https://${form.subdominio}.${DOMINIOBASE}` : null;

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 className="animate-spin mr-2" size={20} /> Cargando...
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-900/40 rounded-lg"><Store size={20} className="text-blue-400" /></div>
          <div>
            <h2 className="text-lg font-semibold text-white">Tienda en Línea</h2>
            <p className="text-xs text-slate-400">Activa tu catálogo digital con pedidos en línea</p>
          </div>
        </div>
        <button onClick={guardar} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Guardar cambios
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda — Form */}
        <div className="lg:col-span-2 space-y-4">

          {/* Toggle activo */}
          <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Estado de la tienda</p>
              <p className="text-xs text-slate-400 mt-0.5">{form.activo ? 'Visible al público' : 'No pública aún'}</p>
            </div>
            <button onClick={() => setForm((f: any) => ({ ...f, activo: !f.activo }))}
              className={`transition-colors ${form.activo ? 'text-green-400' : 'text-slate-500'}`}>
              {form.activo ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
            </button>
          </div>

          {/* Subdominio */}
          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-white flex items-center gap-2"><Globe size={14} /> Subdominio</p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-slate-700 border border-slate-600 rounded-lg overflow-hidden">
                <input
                  value={form.subdominio}
                  onChange={e => { setForm((f: any) => ({ ...f, subdominio: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })); checkSubdominio(e.target.value); }}
                  placeholder="mi-tienda"
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-white focus:outline-none"
                />
                <span className="px-3 text-slate-400 text-xs whitespace-nowrap">.{DOMINIOBASE}</span>
              </div>
              <button onClick={generarSubdominio} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors">
                Auto
              </button>
            </div>
            {subdCheck === 'ok' && <p className="text-xs text-green-400 flex items-center gap-1"><Check size={12} /> Disponible</p>}
            {subdCheck === 'taken' && <p className="text-xs text-red-400 flex items-center gap-1"><X size={12} /> No disponible</p>}
            {subdCheck === 'checking' && <p className="text-xs text-slate-400">Verificando...</p>}
          </div>

          {/* Información */}
          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-white flex items-center gap-2"><Store size={14} /> Información de la tienda</p>
            <div className="space-y-2">
              <input value={form.nombre_tienda} onChange={e => setForm((f: any) => ({ ...f, nombre_tienda: e.target.value }))}
                placeholder="Nombre de la tienda (opcional, usa nombre de empresa si está vacío)"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              <textarea value={form.descripcion} onChange={e => setForm((f: any) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Descripción de la tienda"
                rows={2}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
            </div>
          </div>

          {/* Mayoreo */}
          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white flex items-center gap-2"><TrendingUp size={14} /> Venta por Mayoreo</p>
              <button onClick={() => setForm((f: any) => ({ ...f, modo_mayoreo: !f.modo_mayoreo }))}
                className={`transition-colors ${form.modo_mayoreo ? 'text-purple-400' : 'text-slate-500'}`}>
                {form.modo_mayoreo ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>
            {form.modo_mayoreo && (
              <div className="space-y-2 pt-2 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400 whitespace-nowrap">Cantidad mínima global:</label>
                  <input type="number" min={1} value={form.qty_min_mayoreo}
                    onChange={e => setForm((f: any) => ({ ...f, qty_min_mayoreo: +e.target.value }))}
                    className="w-20 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none" />
                  <span className="text-xs text-slate-400">piezas</span>
                </div>
                <textarea value={form.mensaje_mayoreo} onChange={e => setForm((f: any) => ({ ...f, mensaje_mayoreo: e.target.value }))}
                  placeholder="Mensaje para compradores mayoreo (aparece en la tienda)"
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
              </div>
            )}
          </div>

          {/* Selector de tema */}
          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-white flex items-center gap-2"><Palette size={14} /> Diseño de la tienda</p>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(TEMAS_PREVIEW).map(([id, t]) => (
                <button key={id} onClick={() => setForm((f: any) => ({ ...f, tema_id: id, color_primario: t.primary, color_secundario: t.secondary }))}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all ${form.tema_id === id ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-600 hover:border-slate-400'}`}>
                  {/* Mini preview */}
                  <div style={{ background: t.bg, padding: 8 }}>
                    <div style={{ background: t.primary, borderRadius: 4, padding: '3px 6px', marginBottom: 4 }}>
                      <div style={{ height: 2, background: 'rgba(255,255,255,0.5)', borderRadius: 2, width: '60%' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 3 }}>
                      {[1,2,3].map(i => (
                        <div key={i} style={{ background: t.border, borderRadius: 3, height: 24 }} />
                      ))}
                    </div>
                  </div>
                  {/* Label */}
                  <div style={{ background: t.bg, padding: '4px 8px', borderTop: `1px solid ${t.border}` }}>
                    <p style={{ color: t.text, fontSize: 10, fontWeight: 700 }}>{t.nombre}</p>
                    <p style={{ color: t.primary, fontSize: 9 }}>{t.desc}</p>
                  </div>
                  {form.tema_id === id && (
                    <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
                      <Check size={8} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Columna derecha — Preview + Stats */}
        <div className="space-y-4">
          {/* Preview URL */}
          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-white">Vista previa</p>
            {storeUrl ? (
              <>
                <div className="bg-slate-700 rounded-lg px-3 py-2 text-xs text-blue-400 break-all">{storeUrl}</div>
                <div className="flex gap-2">
                  <button onClick={copyLink}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors">
                    {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copiado' : 'Copiar'}
                  </button>
                  <a href={storeUrl} target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors">
                    <ExternalLink size={12} /> Abrir
                  </a>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-slate-500 text-xs">
                <Globe size={24} className="mx-auto mb-2 opacity-30" />
                Define el subdominio para ver la URL
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-white">Estadísticas</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-slate-700">
                <div className="flex items-center gap-2 text-xs text-slate-400"><Package size={12} /> Pedidos web</div>
                <span className="text-sm font-semibold text-white">{stats.pedidos}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-xs text-slate-400"><ShoppingBag size={12} /> Estado</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${form.activo ? 'bg-green-900/50 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                  {form.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          </div>

          {/* Instrucciones */}
          {!config?.activo && (
            <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-4 text-xs text-blue-300 space-y-2">
              <p className="font-semibold">Para activar tu tienda:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Define tu subdominio</li>
                <li>Configura nombre y descripción</li>
                <li>Activa el toggle "Estado"</li>
                <li>Guarda los cambios</li>
                <li>Configura precios en Productos → Config Ecommerce</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
