import { useState, useEffect, useCallback } from 'react';
import { ecommerceApi, empresasApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/auth.store';
import { usePageHeader } from '../../store/pageHeader.store';
import toast from 'react-hot-toast';
import {
  Globe, Store, Palette, Check, X, Copy, ExternalLink, Loader2,
  ShoppingBag, TrendingUp, Package, ToggleLeft, ToggleRight,
  Megaphone, Truck, ClipboardList, FileText, RefreshCw, Phone,
  Image as Images, Upload, Trash2, ArrowUp, ArrowDown, FileSignature,
} from 'lucide-react';
import TablaPedidos from '../pedidos/TablaPedidos';
import DetallePedidoWeb from '../pedidos/DetallePedidoWeb';
import {
  PedidoUnificado, ESTADOS_UNIFICADOS, estadoUnificadoDe, siguienteEstadoRaw,
  normalizarPedidoWeb, ordenarPorFecha,
} from '../pedidos/pedidosUnificados';

// Los pedidos web de una empresa no suelen pasar de unos cientos activos/recientes;
// esta pestaña es para "buscar el folio que le dieron a un cliente", no un historial
// completo paginado en servidor — con este límite alcanza y se evita esa complejidad.
const LIMITE_PEDIDOS = 300;

const DOMINIOBASE = 'iados.store';

const TEMAS_PREVIEW: Record<string, { bg: string; primary: string; secondary: string; text: string; border: string; nombre: string; desc: string }> = {
  lumina:   { bg: '#f8fafc', primary: '#1e40af', secondary: '#0f172a', text: '#0f172a', border: '#e2e8f0', nombre: 'Lumina',   desc: 'Blanco · Azul corporativo' },
  obsidian: { bg: '#0a0a0a', primary: '#f59e0b', secondary: '#0a0a0a', text: '#f4f4f5', border: '#1f1f1f', nombre: 'Obsidian', desc: 'Negro · Dorado premium' },
  zest:     { bg: '#fffbf5', primary: '#f97316', secondary: '#1c1917', text: '#1c1917', border: '#fed7aa', nombre: 'Zest',     desc: 'Cálido · Naranja vibrante' },
  'iados-electronica': { bg: '#ffffff', primary: '#ff8717', secondary: '#121416', text: '#121416', border: '#e5e5e5', nombre: 'iaDoS Electrónica', desc: 'Tech · Naranja + Dosis' },
  'iados-market':      { bg: '#ffffff', primary: '#629d23', secondary: '#2c3c28', text: '#1f1f25', border: '#e2e2e2', nombre: 'iaDoS Market',      desc: 'Grocery · Verde + Barlow' },
  'iados-herramientas': { bg: '#f4f6f9', primary: '#2559c7', secondary: '#16233b', text: '#16233b', border: '#e2e6ec', nombre: 'iaDoS Herramientas', desc: 'Ferretería · Azul + Oswald' },
  'iados-abarrotes': { bg: '#f6faf1', primary: '#2f9e44', secondary: '#1b2b1e', text: '#1b2b1e', border: '#dfeed0', nombre: 'iaDoS Abarrotes', desc: 'Abarrotes · Verde fresco + vista rápida' },
  'iados-albercas':     { bg: '#f2f8f9', primary: '#017a86', secondary: '#0a2a33', text: '#0a2a33', border: '#d3e3e6', nombre: 'iaDoS Albercas',     desc: 'Albercas · Teal + Archivo' },
  'iados-movilidad':    { bg: '#12151a', primary: '#ffb020', secondary: '#0b0d11', text: '#e9edf2', border: '#242a33', nombre: 'iaDoS Movilidad',    desc: 'Autopartes · Ámbar + Rajdhani' },
};

type CampoKey = 'nombre' | 'telefono' | 'email' | 'direccion' | 'empresa' | 'notas';
interface CampoConfig { activo: boolean; requerido: boolean; selforder: boolean; ecommerce: boolean; label: string; }
type Campos = Record<CampoKey, CampoConfig>;

const DEFAULT_CAMPOS: Campos = {
  nombre:    { activo: true,  requerido: true,  selforder: true,  ecommerce: true,  label: 'Nombre' },
  telefono:  { activo: false, requerido: false, selforder: true,  ecommerce: true,  label: 'Teléfono' },
  email:     { activo: false, requerido: false, selforder: false, ecommerce: true,  label: 'Correo electrónico' },
  direccion: { activo: false, requerido: false, selforder: false, ecommerce: false, label: 'Dirección' },
  empresa:   { activo: false, requerido: false, selforder: false, ecommerce: false, label: 'Empresa / Razón Social' },
  notas:     { activo: true,  requerido: false, selforder: true,  ecommerce: true,  label: 'Notas / Comentarios' },
};
const CAMPO_ORDEN: CampoKey[] = ['nombre', 'telefono', 'email', 'direccion', 'empresa', 'notas'];

function mergeCampos(saved: any): Campos {
  const out: Campos = { ...DEFAULT_CAMPOS };
  for (const k of CAMPO_ORDEN) {
    if (saved?.[k]) out[k] = { ...DEFAULT_CAMPOS[k], ...saved[k] };
  }
  out.nombre = { ...out.nombre, activo: true, requerido: true };
  return out;
}

const TABS = [
  { id: 'general',     label: 'General',     icon: Store },
  { id: 'pedidos',     label: 'Pedidos',     icon: Package },
  { id: 'diseno',      label: 'Diseño',      icon: Palette },
  { id: 'banners',     label: 'Banners',     icon: Images },
  { id: 'contacto',    label: 'Contacto',    icon: Phone },
  { id: 'promociones', label: 'Promociones', icon: Megaphone },
  { id: 'envio',       label: 'Envío',       icon: Truck },
  { id: 'checkout',    label: 'Checkout',    icon: ClipboardList },
  { id: 'mayoreo',     label: 'Mayoreo',     icon: TrendingUp },
  { id: 'legal',       label: 'Legal',       icon: FileText },
] as const;

const DEFAULT_CONTACTO = {
  activo: false,
  telefono: '', mostrar_telefono: true,
  whatsapp: '', mostrar_whatsapp: true, whatsapp_mensaje: 'Hola, tengo una duda sobre un producto',
  nombre_contacto: '', mostrar_nombre: true,
  redes: { facebook: '', instagram: '', tiktok: '', x: '' },
};

// Banners/flyers de la tienda. Si `activo` es false (o no hay imagenes) la tienda
// no pinta absolutamente nada: es una capa opcional sobre cualquier plantilla.
const DEFAULT_BANNERS = {
  activo: false,
  animacion: 'fade' as 'fade' | 'slide' | 'zoom' | 'flash',
  intervalo: 6,          // segundos entre imagenes
  altura: 'media' as 'baja' | 'media' | 'alta',
  posicion: 'arriba' as 'arriba' | 'abajo',   // antes o despues del hero de la plantilla
  imagenes: [] as { url: string; titulo?: string; subtitulo?: string; enlace?: string }[],
};

const ANIMACIONES = [
  { id: 'fade',  label: 'Fundido',  desc: 'Transición suave, la más sobria' },
  { id: 'slide', label: 'Deslizar', desc: 'Entra desde un costado' },
  { id: 'zoom',  label: 'Zoom',     desc: 'Acercamiento lento tipo Ken Burns' },
  { id: 'flash', label: 'Flash',    desc: 'Destello de entrada, para ofertas' },
] as const;

// Modo cotizacion de la tienda: oculta TODOS los precios y el checkout deja de ser
// una compra — se convierte en solicitud que el admin cotiza y cobra en el POS.
const DEFAULT_COTIZACIONES = {
  activo: false,
  texto_boton: 'Solicitar cotización',
  mensaje: 'Recibimos tu solicitud. Te enviaremos la cotización con los precios y disponibilidad.',
};

function Toggle({ on, onClick, color = 'text-green-400' }: { on: boolean; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} className={`transition-colors ${on ? color : 'text-slate-500'}`}>
      {on ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
    </button>
  );
}

export default function TiendaEnLineaPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<typeof TABS[number]['id']>('general');
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    activo: false, subdominio: '', nombre_tienda: '', descripcion: '',
    color_primario: '#1e40af', color_secundario: '#0f172a',
    modo_mayoreo: false, qty_min_mayoreo: 10, mensaje_mayoreo: '',
    politica_envio: '', terminos: '', tema_id: 'lumina',
    preferencias: {
      promociones: { activo: false, texto: '⚡ Oferta del día — termina en' },
      envio_gratis: { activo: false, umbral: 500 },
      contacto: DEFAULT_CONTACTO,
      banners: DEFAULT_BANNERS,
      cotizaciones: DEFAULT_COTIZACIONES,
    },
  });
  const [subiendoBanner, setSubiendoBanner] = useState(false);
  const [campos, setCampos] = useState<Campos>(DEFAULT_CAMPOS);
  const [autoCancel, setAutoCancel] = useState<number>(0);
  const [subdCheck, setSubdCheck] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const [subdTimer, setSubdTimer] = useState<any>(null);
  const [stats, setStats] = useState({ pedidos: 0 });
  const [copied, setCopied] = useState(false);

  // Consulta de folios (Punto 2 posv2): un listado buscable de los pedidos que
  // nacieron en la tienda en línea, para que el admin pueda ubicar el avance de
  // un folio sin tener que ir a la pestaña general de Pedidos del POS.
  const [pedidosWeb, setPedidosWeb] = useState<any[]>([]);
  const [pedidosLoading, setPedidosLoading] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<PedidoUnificado | null>(null);
  const [avanzandoKey, setAvanzandoKey] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const loadPedidos = useCallback(async () => {
    setPedidosLoading(true);
    try {
      const { data } = await ecommerceApi.listPedidos({ page: 1, limit: LIMITE_PEDIDOS });
      setPedidosWeb(data?.data || []);
    } catch { toast.error('Error al cargar pedidos'); }
    setPedidosLoading(false);
  }, []);

  useEffect(() => { if (tab === 'pedidos') loadPedidos(); }, [tab, loadPedidos]);

  const listadoPedidos = ordenarPorFecha(pedidosWeb.map(normalizarPedidoWeb));

  const handleAvanzarPedido = async (pedido: PedidoUnificado, estadoRaw: string) => {
    setAvanzandoKey(pedido.key);
    try {
      const { data } = await ecommerceApi.updateEstado(pedido.id, estadoRaw);
      setPedidosWeb(ps => ps.map(x => (x.id === pedido.id ? { ...x, estado: data.estado } : x)));
      toast.success(`Pedido ${pedido.numero} → ${ESTADOS_UNIFICADOS[estadoUnificadoDe('web', data.estado)].label}`);
    } catch { toast.error('Error al actualizar estado'); }
    finally { setAvanzandoKey(null); }
  };

  function setPref(path: 'promociones' | 'envio_gratis' | 'contacto' | 'banners' | 'cotizaciones', patch: any) {
    setForm((f: any) => ({ ...f, preferencias: { ...f.preferencias, [path]: { ...f.preferencias?.[path], ...patch } } }));
  }

  // ── Banners ───────────────────────────────────────────────────────────────
  const bannerImgs = (): any[] => form.preferencias?.banners?.imagenes || [];

  function setBannerImgs(imagenes: any[]) { setPref('banners', { imagenes }); }

  function editarBanner(i: number, patch: any) {
    setBannerImgs(bannerImgs().map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  function quitarBanner(i: number) {
    setBannerImgs(bannerImgs().filter((_, idx) => idx !== i));
  }

  function moverBanner(i: number, delta: number) {
    const arr = [...bannerImgs()];
    const j = i + delta;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setBannerImgs(arr);
  }

  async function subirBanners(files: FileList | null) {
    if (!files?.length) return;
    setSubiendoBanner(true);
    const nuevos: any[] = [];
    try {
      for (const file of Array.from(files)) {
        const { data } = await ecommerceApi.uploadBanner(file);
        const url = typeof data === 'string' ? data : data?.url;
        if (url) nuevos.push({ url, titulo: '', subtitulo: '', enlace: '' });
      }
      if (nuevos.length) {
        setBannerImgs([...bannerImgs(), ...nuevos]);
        toast.success(`${nuevos.length} imagen(es) lista(s) — guarda los cambios`);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al subir la imagen');
    }
    setSubiendoBanner(false);
  }

  function setContactoRed(red: keyof typeof DEFAULT_CONTACTO.redes, valor: string) {
    setForm((f: any) => ({
      ...f,
      preferencias: {
        ...f.preferencias,
        contacto: {
          ...DEFAULT_CONTACTO, ...f.preferencias?.contacto,
          redes: { ...DEFAULT_CONTACTO.redes, ...f.preferencias?.contacto?.redes, [red]: valor },
        },
      },
    }));
  }

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
          preferencias: {
            promociones: { activo: false, texto: '⚡ Oferta del día — termina en', ...(data.preferencias?.promociones || {}) },
            envio_gratis: { activo: false, umbral: 500, ...(data.preferencias?.envio_gratis || {}) },
            contacto: {
              ...DEFAULT_CONTACTO, ...(data.preferencias?.contacto || {}),
              redes: { ...DEFAULT_CONTACTO.redes, ...(data.preferencias?.contacto?.redes || {}) },
            },
            banners: {
              ...DEFAULT_BANNERS, ...(data.preferencias?.banners || {}),
              imagenes: data.preferencias?.banners?.imagenes || [],
            },
            cotizaciones: { ...DEFAULT_COTIZACIONES, ...(data.preferencias?.cotizaciones || {}) },
          },
        });
      }
      const pedRes = await ecommerceApi.listPedidos({ limit: 1 });
      setStats({ pedidos: pedRes.data?.meta?.total || 0 });
      if (user?.empresa_id) {
        const { data: emp } = await empresasApi.get(user.empresa_id);
        const cfg = emp?.config_especial || {};
        setCampos(mergeCampos(cfg.campos_formulario));
        setAutoCancel(Number(cfg.auto_cancel_horas) || 0);
      }
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
      if (user?.empresa_id) {
        await empresasApi.setConfigEspecial(user.empresa_id, { campos_formulario: campos, auto_cancel_horas: autoCancel });
      }
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

  function toggleCampo(k: CampoKey, field: 'mostrar' | 'requerido') {
    if (k === 'nombre') return; // siempre requerido/visible
    setCampos((c) => {
      const cur = c[k];
      if (field === 'mostrar') {
        const v = !(cur.activo && cur.ecommerce);
        return { ...c, [k]: { ...cur, activo: v, ecommerce: v, requerido: v ? cur.requerido : false } };
      }
      return { ...c, [k]: { ...cur, requerido: !cur.requerido } };
    });
  }

  const storeUrl = form.subdominio ? `https://${form.subdominio}.${DOMINIOBASE}` : null;
  const inputCls = 'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500';

  usePageHeader({
    title: 'Tienda en Línea',
    subtitle: 'Configura tu catálogo digital y cómo se ve para tus clientes',
    icon: Store,
    actions: (
      <>
        {storeUrl && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${form.activo ? 'bg-green-900/50 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
            {form.activo ? 'Activa' : 'Inactiva'}
          </span>
        )}
        <button onClick={guardar} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Guardar cambios
        </button>
      </>
    ),
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 className="animate-spin mr-2" size={20} /> Cargando...
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === id ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── GENERAL ── */}
      {tab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Estado de la tienda</p>
                <p className="text-xs text-slate-400 mt-0.5">{form.activo ? 'Visible al público' : 'No pública aún'}</p>
              </div>
              <Toggle on={form.activo} onClick={() => setForm((f: any) => ({ ...f, activo: !f.activo }))} />
            </div>

            <div className="bg-slate-800 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-white flex items-center gap-2"><Globe size={14} /> Subdominio</p>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-slate-700 border border-slate-600 rounded-lg overflow-hidden">
                  <input value={form.subdominio}
                    onChange={e => { setForm((f: any) => ({ ...f, subdominio: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })); checkSubdominio(e.target.value); }}
                    placeholder="mi-tienda"
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-white focus:outline-none" />
                  <span className="px-3 text-slate-400 text-xs whitespace-nowrap">.{DOMINIOBASE}</span>
                </div>
                <button onClick={generarSubdominio} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors">Auto</button>
              </div>
              {subdCheck === 'ok' && <p className="text-xs text-green-400 flex items-center gap-1"><Check size={12} /> Disponible</p>}
              {subdCheck === 'taken' && <p className="text-xs text-red-400 flex items-center gap-1"><X size={12} /> No disponible</p>}
              {subdCheck === 'checking' && <p className="text-xs text-slate-400">Verificando...</p>}
            </div>

            <div className="bg-slate-800 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-white flex items-center gap-2"><Store size={14} /> Información de la tienda</p>
              <input value={form.nombre_tienda} onChange={e => setForm((f: any) => ({ ...f, nombre_tienda: e.target.value }))}
                placeholder="Nombre de la tienda (usa el de la empresa si se deja vacío)" className={inputCls} />
              <textarea value={form.descripcion} onChange={e => setForm((f: any) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Descripción de la tienda" rows={2} className={`${inputCls} resize-none`} />
            </div>
          </div>

          {/* Preview + Stats */}
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-white">Vista previa</p>
              {storeUrl ? (
                <>
                  <div className="bg-slate-700 rounded-lg px-3 py-2 text-xs text-blue-400 break-all">{storeUrl}</div>
                  <div className="flex gap-2">
                    <button onClick={copyLink} className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors">
                      {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copiado' : 'Copiar'}
                    </button>
                    <a href={storeUrl} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors">
                      <ExternalLink size={12} /> Abrir
                    </a>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-slate-500 text-xs">
                  <Globe size={24} className="mx-auto mb-2 opacity-30" /> Define el subdominio para ver la URL
                </div>
              )}
            </div>
            <div className="bg-slate-800 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-white">Estadísticas</p>
              <button onClick={() => setTab('pedidos')} className="flex items-center justify-between py-2 w-full hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-2 text-xs text-slate-400"><Package size={12} /> Pedidos web</div>
                <span className="text-sm font-semibold text-white">{stats.pedidos}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PEDIDOS (consulta de folios) ── */}
      {tab === 'pedidos' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Busca por folio, cliente o correo para ver el avance de un pedido de la tienda en línea.
            </p>
            <button onClick={loadPedidos} disabled={pedidosLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors disabled:opacity-50">
              {pedidosLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Actualizar
            </button>
          </div>
          {pedidosLoading && pedidosWeb.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="animate-spin mr-2" size={20} /> Cargando pedidos...
            </div>
          ) : (
            <TablaPedidos
              pedidos={listadoPedidos}
              mostrarPrecios
              mostrarFiltroOrigen={false}
              seleccionadoKey={selectedPedido?.key || null}
              avanzandoKey={avanzandoKey}
              vacioTexto="Aún no hay pedidos de la tienda en línea"
              tieneDetalle={() => true}
              onSelect={setSelectedPedido}
              onAvanzar={p => { const s = siguienteEstadoRaw(p); if (s) handleAvanzarPedido(p, s); }}
            />
          )}

          {selectedPedido && (
            <DetallePedidoWeb
              pedido={selectedPedido}
              mostrarPrecios
              onClose={() => setSelectedPedido(null)}
              onAvanzar={handleAvanzarPedido}
              onCotizado={loadPedidos}
            />
          )}
        </div>
      )}

      {/* ── DISEÑO ── */}
      {tab === 'diseno' && (
        <div className="bg-slate-800 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-white flex items-center gap-2"><Palette size={14} /> Diseño de la tienda</p>
          <p className="text-xs text-slate-400">Elige la plantilla; define la paleta y tipografía de tu tienda.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(TEMAS_PREVIEW).map(([id, t]) => (
              <button key={id} onClick={() => setForm((f: any) => ({ ...f, tema_id: id, color_primario: t.primary, color_secundario: t.secondary }))}
                className={`relative rounded-xl overflow-hidden border-2 transition-all ${form.tema_id === id ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-600 hover:border-slate-400'}`}>
                <div style={{ background: t.bg, padding: 8 }}>
                  <div style={{ background: t.primary, borderRadius: 4, padding: '3px 6px', marginBottom: 4 }}>
                    <div style={{ height: 2, background: 'rgba(255,255,255,0.5)', borderRadius: 2, width: '60%' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 3 }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ background: t.border, borderRadius: 3, height: 24 }} />)}
                  </div>
                </div>
                <div style={{ background: t.bg, padding: '4px 8px', borderTop: `1px solid ${t.border}` }}>
                  <p style={{ color: t.text, fontSize: 10, fontWeight: 700 }}>{t.nombre}</p>
                  <p style={{ color: t.primary, fontSize: 9 }}>{t.desc}</p>
                </div>
                {form.tema_id === id && <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5"><Check size={8} className="text-white" /></div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── BANNERS / FLYERS ── */}
      {tab === 'banners' && (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white flex items-center gap-2"><Images size={14} /> Banner o flyer personalizado</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Si está apagado la tienda no muestra nada: la plantilla queda tal cual.
              </p>
            </div>
            <Toggle on={!!form.preferencias?.banners?.activo} color="text-fuchsia-400"
              onClick={() => setPref('banners', { activo: !form.preferencias?.banners?.activo })} />
          </div>

          {form.preferencias?.banners?.activo && (
            <>
              <div className="bg-slate-800 rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Animación</label>
                    <select value={form.preferencias?.banners?.animacion || 'fade'}
                      onChange={e => setPref('banners', { animacion: e.target.value })} className={inputCls}>
                      {ANIMACIONES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {ANIMACIONES.find(a => a.id === (form.preferencias?.banners?.animacion || 'fade'))?.desc}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Segundos por imagen</label>
                    <input type="number" min={2} max={30}
                      value={form.preferencias?.banners?.intervalo ?? 6}
                      onChange={e => setPref('banners', { intervalo: Math.min(30, Math.max(2, +e.target.value || 6)) })}
                      className={inputCls} />
                    <p className="text-[11px] text-slate-500 mt-1">Con una sola imagen no rota.</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Altura</label>
                    <select value={form.preferencias?.banners?.altura || 'media'}
                      onChange={e => setPref('banners', { altura: e.target.value })} className={inputCls}>
                      <option value="baja">Baja (franja, ~150 px)</option>
                      <option value="media">Media (~205 px)</option>
                      <option value="alta">Alta (~275 px)</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">La altura la eliges tú; el ancho se ajusta solo a la forma de tu imagen, así que nunca se recorta (sirve tanto un flyer vertical como una franja 1600×400). Se muestra dentro del ancho de la tienda, no a pantalla completa.</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Posición en la portada</label>
                  <div className="flex gap-2">
                    {[{ id: 'arriba', label: 'Arriba del hero' }, { id: 'abajo', label: 'Debajo del hero' }].map(p => (
                      <button key={p.id} onClick={() => setPref('banners', { posicion: p.id })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          (form.preferencias?.banners?.posicion || 'arriba') === p.id
                            ? 'bg-fuchsia-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}>{p.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Imágenes ({bannerImgs().length})</p>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    subiendoBanner ? 'bg-slate-700 text-slate-400' : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}>
                    {subiendoBanner ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Subir imágenes
                    <input type="file" accept="image/*" multiple hidden disabled={subiendoBanner}
                      onChange={e => { subirBanners(e.target.files); e.target.value = ''; }} />
                  </label>
                </div>
                <p className="text-xs text-slate-400">
                  Recomendado 1600×600 px (horizontal). Se recortan al ancho de la tienda sin deformarse.
                </p>

                {bannerImgs().length === 0 && (
                  <div className="border border-dashed border-slate-600 rounded-lg py-8 text-center text-slate-500 text-sm">
                    Aún no hay imágenes — la tienda no mostrará banner.
                  </div>
                )}

                {bannerImgs().map((b: any, i: number) => (
                  <div key={`${b.url}-${i}`} className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 rounded-lg p-3">
                    <img src={b.url} alt="" className="w-full sm:w-40 h-24 object-cover rounded-lg bg-slate-700 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <input value={b.titulo || ''} onChange={e => editarBanner(i, { titulo: e.target.value })}
                        placeholder="Título (opcional, se sobrepone a la imagen)" className={inputCls} />
                      <input value={b.subtitulo || ''} onChange={e => editarBanner(i, { subtitulo: e.target.value })}
                        placeholder="Subtítulo (opcional)" className={inputCls} />
                      <input value={b.enlace || ''} onChange={e => editarBanner(i, { enlace: e.target.value })}
                        placeholder="Enlace al hacer clic (opcional). Ej: /productos?categoria=3" className={inputCls} />
                    </div>
                    <div className="flex sm:flex-col gap-1 justify-end">
                      <button onClick={() => moverBanner(i, -1)} disabled={i === 0}
                        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-30" title="Subir">
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => moverBanner(i, 1)} disabled={i === bannerImgs().length - 1}
                        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-30" title="Bajar">
                        <ArrowDown size={14} />
                      </button>
                      <button onClick={() => quitarBanner(i)}
                        className="p-2 rounded-lg bg-red-900/50 hover:bg-red-800 text-red-300" title="Quitar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── CONTACTO ── */}
      {tab === 'contacto' && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white flex items-center gap-2"><Phone size={14} /> Mostrar contacto en la tienda</p>
              <p className="text-xs text-slate-400 mt-0.5">Para que tus clientes puedan escribirte antes o después de comprar.</p>
            </div>
            <Toggle on={!!form.preferencias?.contacto?.activo} color="text-sky-400"
              onClick={() => setPref('contacto', { activo: !form.preferencias?.contacto?.activo })} />
          </div>

          {form.preferencias?.contacto?.activo && (
            <>
              <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-white">Teléfono</p>
                <div className="flex items-center gap-2">
                  <input value={form.preferencias?.contacto?.telefono || ''}
                    onChange={e => setPref('contacto', { telefono: e.target.value })}
                    placeholder="10 dígitos" className={inputCls} />
                  <label className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap">
                    <button onClick={() => setPref('contacto', { mostrar_telefono: !form.preferencias?.contacto?.mostrar_telefono })}
                      className={`transition-colors ${form.preferencias?.contacto?.mostrar_telefono ? 'text-blue-400' : 'text-slate-500'}`}>
                      {form.preferencias?.contacto?.mostrar_telefono ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                    Mostrar
                  </label>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-white">WhatsApp</p>
                <div className="flex items-center gap-2">
                  <input value={form.preferencias?.contacto?.whatsapp || ''}
                    onChange={e => setPref('contacto', { whatsapp: e.target.value })}
                    placeholder="Ej: 5215512345678 (con código de país)" className={inputCls} />
                  <label className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap">
                    <button onClick={() => setPref('contacto', { mostrar_whatsapp: !form.preferencias?.contacto?.mostrar_whatsapp })}
                      className={`transition-colors ${form.preferencias?.contacto?.mostrar_whatsapp ? 'text-green-400' : 'text-slate-500'}`}>
                      {form.preferencias?.contacto?.mostrar_whatsapp ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                    Mostrar
                  </label>
                </div>
                <input value={form.preferencias?.contacto?.whatsapp_mensaje || ''}
                  onChange={e => setPref('contacto', { whatsapp_mensaje: e.target.value })}
                  placeholder="Mensaje inicial del botón de WhatsApp" className={inputCls} />
              </div>

              <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-white">Nombre para mostrar</p>
                <div className="flex items-center gap-2">
                  <input value={form.preferencias?.contacto?.nombre_contacto || ''}
                    onChange={e => setPref('contacto', { nombre_contacto: e.target.value })}
                    placeholder="Ej: Atención a clientes Jessovi" className={inputCls} />
                  <label className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap">
                    <button onClick={() => setPref('contacto', { mostrar_nombre: !form.preferencias?.contacto?.mostrar_nombre })}
                      className={`transition-colors ${form.preferencias?.contacto?.mostrar_nombre ? 'text-blue-400' : 'text-slate-500'}`}>
                      {form.preferencias?.contacto?.mostrar_nombre ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                    Mostrar
                  </label>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-white">Redes sociales</p>
                <p className="text-xs text-slate-400">Pega el link completo de cada red. Deja vacío para ocultarla.</p>
                {([
                  ['facebook', 'https://facebook.com/tu-tienda'],
                  ['instagram', 'https://instagram.com/tu-tienda'],
                  ['tiktok', 'https://tiktok.com/@tu-tienda'],
                  ['x', 'https://x.com/tu-tienda'],
                ] as const).map(([red, placeholder]) => (
                  <div key={red} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-16 capitalize">{red}</span>
                    <input value={form.preferencias?.contacto?.redes?.[red] || ''}
                      onChange={e => setContactoRed(red, e.target.value)}
                      placeholder={placeholder} className={inputCls} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── PROMOCIONES ── */}
      {tab === 'promociones' && (
        <div className="bg-slate-800 rounded-xl p-4 space-y-3 max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white flex items-center gap-2"><Megaphone size={14} /> Barra de promoción</p>
              <p className="text-xs text-slate-400 mt-0.5">Muestra una barra superior con una oferta y cuenta regresiva del día.</p>
            </div>
            <Toggle on={!!form.preferencias?.promociones?.activo} color="text-amber-400"
              onClick={() => setPref('promociones', { activo: !form.preferencias?.promociones?.activo })} />
          </div>
          {form.preferencias?.promociones?.activo && (
            <div className="pt-2 border-t border-slate-700 space-y-2">
              <label className="text-xs text-slate-400">Texto de la promoción</label>
              <input value={form.preferencias?.promociones?.texto || ''} onChange={e => setPref('promociones', { texto: e.target.value })}
                placeholder="⚡ Oferta del día — termina en" className={inputCls} />
              <p className="text-xs text-slate-500">La cuenta regresiva al final del día se agrega automáticamente.</p>
            </div>
          )}
        </div>
      )}

      {/* ── ENVÍO ── */}
      {tab === 'envio' && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-2"><Truck size={14} /> Envío gratis</p>
                <p className="text-xs text-slate-400 mt-0.5">Muestra una barra de progreso hacia el envío gratis en el carrito.</p>
              </div>
              <Toggle on={!!form.preferencias?.envio_gratis?.activo} color="text-emerald-400"
                onClick={() => setPref('envio_gratis', { activo: !form.preferencias?.envio_gratis?.activo })} />
            </div>
            {form.preferencias?.envio_gratis?.activo && (
              <div className="pt-2 border-t border-slate-700 flex items-center gap-2">
                <label className="text-xs text-slate-400 whitespace-nowrap">Monto mínimo para envío gratis: $</label>
                <input type="number" min={0} value={form.preferencias?.envio_gratis?.umbral ?? 0}
                  onChange={e => setPref('envio_gratis', { umbral: +e.target.value })}
                  className="w-28 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none" />
              </div>
            )}
          </div>
          <div className="bg-slate-800 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-white">Política de envío</p>
            <textarea value={form.politica_envio} onChange={e => setForm((f: any) => ({ ...f, politica_envio: e.target.value }))}
              placeholder="Ej: Preparamos y despachamos tu pedido tras la confirmación..." rows={3} className={`${inputCls} resize-none`} />
          </div>
        </div>
      )}

      {/* ── CHECKOUT ── */}
      {tab === 'checkout' && (
        <div className="space-y-4 max-w-3xl">
          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white flex items-center gap-2"><FileSignature size={14} /> Vender por cotización</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Oculta todos los precios: el cliente ve “Cotizar” y al finalizar envía una solicitud, no una compra.
                </p>
              </div>
              <Toggle on={!!form.preferencias?.cotizaciones?.activo} color="text-indigo-400"
                onClick={() => setPref('cotizaciones', { activo: !form.preferencias?.cotizaciones?.activo })} />
            </div>
            {form.preferencias?.cotizaciones?.activo && (
              <div className="space-y-3 pt-1 border-t border-slate-700">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 mt-3">Texto del botón de finalizar</label>
                  <input value={form.preferencias?.cotizaciones?.texto_boton || ''}
                    onChange={e => setPref('cotizaciones', { texto_boton: e.target.value })}
                    placeholder="Solicitar cotización" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Mensaje al terminar</label>
                  <textarea value={form.preferencias?.cotizaciones?.mensaje || ''}
                    onChange={e => setPref('cotizaciones', { mensaje: e.target.value })}
                    rows={2} placeholder="Recibimos tu solicitud..." className={`${inputCls} resize-none`} />
                </div>
                <p className="text-xs text-indigo-300 bg-indigo-950/40 border border-indigo-900 rounded-lg p-3">
                  Las solicitudes llegan a <b>Pedidos</b> marcadas como <b>Cotización</b>. Cuando captures los precios,
                  el pedido pasa a <b>Por cobrar</b> y aparece en el POS listo para cobrarse en caja como cualquier venta.
                </p>
              </div>
            )}
          </div>

          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-white flex items-center gap-2"><ClipboardList size={14} /> Datos a pedir en el checkout</p>
            <p className="text-xs text-slate-400">Elige qué datos pedir al cliente. Correo y teléfono se muestran siempre (se pide al menos uno para confirmar el pedido).</p>
            <div className="divide-y divide-slate-700">
              {CAMPO_ORDEN.map((k) => {
                const c = campos[k];
                const mostrar = c.activo && c.ecommerce;
                return (
                  <div key={k} className="flex items-center justify-between py-2.5 gap-3">
                    <span className="text-sm text-white">{c.label}{k === 'nombre' && <span className="text-slate-500 text-xs ml-2">(siempre)</span>}</span>
                    <div className="flex items-center gap-5">
                      <label className="flex items-center gap-2 text-xs text-slate-400">
                        <button onClick={() => toggleCampo(k, 'mostrar')} disabled={k === 'nombre'} className={`transition-colors ${mostrar ? 'text-blue-400' : 'text-slate-500'} disabled:opacity-40`}>
                          {mostrar ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                        </button>
                        Mostrar
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-400">
                        <button onClick={() => toggleCampo(k, 'requerido')} disabled={k === 'nombre' || !mostrar} className={`transition-colors ${c.requerido ? 'text-red-400' : 'text-slate-500'} disabled:opacity-40`}>
                          {c.requerido ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                        </button>
                        Obligatorio
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-white">Auto-cancelación de pedidos</p>
            <p className="text-xs text-slate-400">Cancela automáticamente los pedidos que el cliente no confirme (modelo de pago diferido). 0 = desactivado.</p>
            <div className="flex items-center gap-2">
              <input type="number" min={0} value={autoCancel} onChange={e => setAutoCancel(+e.target.value)}
                className="w-24 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none" />
              <span className="text-xs text-slate-400">horas sin confirmar → cancelar</span>
            </div>
          </div>
        </div>
      )}

      {/* ── MAYOREO ── */}
      {tab === 'mayoreo' && (
        <div className="bg-slate-800 rounded-xl p-4 space-y-3 max-w-2xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white flex items-center gap-2"><TrendingUp size={14} /> Venta por Mayoreo</p>
            <Toggle on={form.modo_mayoreo} color="text-purple-400" onClick={() => setForm((f: any) => ({ ...f, modo_mayoreo: !f.modo_mayoreo }))} />
          </div>
          {form.modo_mayoreo && (
            <div className="space-y-2 pt-2 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 whitespace-nowrap">Cantidad mínima global:</label>
                <input type="number" min={1} value={form.qty_min_mayoreo} onChange={e => setForm((f: any) => ({ ...f, qty_min_mayoreo: +e.target.value }))}
                  className="w-20 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none" />
                <span className="text-xs text-slate-400">piezas</span>
              </div>
              <textarea value={form.mensaje_mayoreo} onChange={e => setForm((f: any) => ({ ...f, mensaje_mayoreo: e.target.value }))}
                placeholder="Mensaje para compradores mayoreo (aparece en la tienda)" rows={2} className={`${inputCls} resize-none`} />
            </div>
          )}
        </div>
      )}

      {/* ── LEGAL ── */}
      {tab === 'legal' && (
        <div className="bg-slate-800 rounded-xl p-4 space-y-2 max-w-2xl">
          <p className="text-sm font-semibold text-white flex items-center gap-2"><FileText size={14} /> Términos y condiciones</p>
          <p className="text-xs text-slate-400">Se muestran en la página de Términos y en el detalle de producto.</p>
          <textarea value={form.terminos} onChange={e => setForm((f: any) => ({ ...f, terminos: e.target.value }))}
            placeholder="Términos del servicio, condiciones de compra..." rows={6} className={`${inputCls} resize-none`} />
        </div>
      )}
    </div>
  );
}
