import { useState, useEffect, useRef } from 'react';
import { tiendasApi, empresasApi } from '../../api/endpoints';
import { resolveUploadUrl } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore, ThemeName, PaletteName } from '../../store/theme.store';
import toast from 'react-hot-toast';
import { Settings, Store, Monitor, Printer, Save, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Upload, Building2, Palette, LayoutGrid } from 'lucide-react';

const THEMES: { key: ThemeName; name: string; desc: string; previewStyle: React.CSSProperties }[] = [
  { key: 'default', name: 'Default', desc: 'Redondeado clasico', previewStyle: { borderRadius: '1rem', border: '1px solid rgba(100,116,139,0.4)' } },
  { key: 'moderno', name: 'Moderno', desc: 'Cristal, blur, gradientes', previewStyle: { borderRadius: '1.25rem', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' } },
  { key: 'elegante', name: 'Elegante', desc: 'Recto, premium, refinado', previewStyle: { borderRadius: '0.375rem', borderTop: '2px solid rgba(59,130,246,0.5)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' } },
  { key: 'neon', name: 'Neon', desc: 'Glow, cyberpunk, futurista', previewStyle: { borderRadius: '0.75rem', border: '1px solid rgba(59,130,246,0.4)', boxShadow: '0 0 20px rgba(59,130,246,0.15), 0 0 40px rgba(59,130,246,0.05)' } },
  { key: 'compacto', name: 'Compacto', desc: 'Denso, eficiente, menos espacio', previewStyle: { borderRadius: '0.4rem', padding: '0.3rem', fontSize: '0.75rem', border: '1px solid rgba(100,116,139,0.25)' } },
];

const PALETTES: { key: PaletteName; name: string; colors: [string, string, string] }[] = [
  { key: 'default', name: 'Azul (Default)', colors: ['#1e40af', '#3b82f6', '#f59e0b'] },
  { key: 'esmeralda', name: 'Esmeralda', colors: ['#047857', '#10b981', '#fbbf24'] },
  { key: 'purpura', name: 'Purpura', colors: ['#6d28d9', '#8b5cf6', '#f472b6'] },
  { key: 'rubi', name: 'Rubi', colors: ['#b91c1c', '#ef4444', '#fb923c'] },
  { key: 'oceano', name: 'Oceano', colors: ['#0e7490', '#06b6d4', '#a3e635'] },
];

export default function ConfiguracionPage() {
  const { user } = useAuthStore();
  const { theme, palette, setTheme, setPalette } = useThemeStore();
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingNew, setEditingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [expandedSection, setExpandedSection] = useState<string>('pos');
  const [empresaLogo, setEmpresaLogo] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    zona_horaria: 'America/Mexico_City',
    // IVA config
    iva_enabled: false,
    iva_porcentaje: 16,
    iva_incluido: true, // true = precio incluye IVA, false = IVA se suma
    // POS config
    modo_servicio: 'autoservicio' as 'autoservicio' | 'mesa',
    tipo_cobro_mesa: 'post_pago' as 'pago_inmediato' | 'post_pago',
    num_mesas: 20,
    // Impresora config
    impresora_modelo: '',
    impresora_ancho: 80,
    impresora_auto_print: false,
    impresora_copias: 1,
  });

  useEffect(() => { load(); loadEmpresa(); }, []);

  const loadEmpresa = async () => {
    if (!user?.empresa_id) return;
    try {
      const { data } = await empresasApi.get(user.empresa_id);
      setEmpresaLogo(data?.logo_url || '');
      // Sync apariencia from backend
      if (data?.config_apariencia) {
        setTheme((data.config_apariencia.tema as ThemeName) || 'default');
        setPalette((data.config_apariencia.paleta as PaletteName) || 'default');
      }
    } catch {}
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.empresa_id) return;
    setUploadingLogo(true);
    try {
      const { data } = await empresasApi.uploadLogo(user.empresa_id, file);
      setEmpresaLogo(data.logo_url);
      toast.success('Logo actualizado. Reinicia sesion para ver el cambio en el menu.');
    } catch { toast.error('Error al subir logo'); }
    finally { setUploadingLogo(false); if (logoRef.current) logoRef.current.value = ''; }
  };

  const load = async () => {
    try {
      const { data } = await tiendasApi.list();
      setTiendas(data);
      // Auto-select user's tienda
      if (data.length > 0 && !selected) {
        const userTienda = data.find((t: any) => t.id === user?.tienda_id) || data[0];
        selectTienda(userTienda);
      }
    } catch {}
  };

  const selectTienda = (tienda: any) => {
    setSelected(tienda);
    const cp = tienda.config_pos || {};
    const ci = tienda.config_impresora || {};
    setForm({
      nombre: tienda.nombre || '',
      direccion: tienda.direccion || '',
      telefono: tienda.telefono || '',
      email: tienda.email || '',
      zona_horaria: tienda.zona_horaria || 'America/Mexico_City',
      iva_enabled: cp.iva_enabled || false,
      iva_porcentaje: cp.iva_porcentaje ?? 16,
      iva_incluido: cp.iva_incluido ?? true,
      modo_servicio: cp.modo_servicio || 'autoservicio',
      tipo_cobro_mesa: cp.tipo_cobro_mesa || 'post_pago',
      num_mesas: cp.num_mesas || 20,
      impresora_modelo: ci.modelo || '',
      impresora_ancho: ci.ancho || 80,
      impresora_auto_print: ci.auto_print || false,
      impresora_copias: ci.copias || 1,
    });
  };

  const handleSave = async () => {
    if (!selected && !editingNew) return;
    setLoading(true);
    try {
      const payload: any = {
        nombre: form.nombre,
        direccion: form.direccion,
        telefono: form.telefono,
        email: form.email,
        zona_horaria: form.zona_horaria,
        config_pos: {
          modo_servicio: form.modo_servicio,
          tipo_cobro_mesa: form.tipo_cobro_mesa,
          num_mesas: form.num_mesas,
          iva_enabled: form.iva_enabled,
          iva_porcentaje: form.iva_porcentaje,
          iva_incluido: form.iva_incluido,
        },
        config_impresora: {
          modelo: form.impresora_modelo,
          ancho: form.impresora_ancho,
          auto_print: form.impresora_auto_print,
          copias: form.impresora_copias,
        },
      };

      if (editingNew) {
        payload.tenant_id = user?.tenant_id;
        payload.empresa_id = user?.empresa_id;
        const { data } = await tiendasApi.create(payload);
        toast.success('Tienda creada');
        setEditingNew(false);
        setShowForm(false);
        await load();
        selectTienda(data);
      } else {
        await tiendasApi.update(selected.id, payload);
        toast.success('Configuracion guardada');
        await load();
        // Re-select to refresh
        const { data } = await tiendasApi.get(selected.id);
        selectTienda(data);
      }
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al guardar'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (tienda: any) => {
    try {
      await tiendasApi.delete(tienda.id);
      toast.success('Tienda eliminada');
      setDeleteConfirm(null);
      if (selected?.id === tienda.id) setSelected(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al eliminar'); }
  };

  const handleNew = () => {
    setEditingNew(true);
    setSelected(null);
    setShowForm(true);
    setForm({
      nombre: '', direccion: '', telefono: '', email: '',
      zona_horaria: 'America/Mexico_City',
      iva_enabled: false, iva_porcentaje: 16, iva_incluido: true,
      modo_servicio: 'autoservicio', tipo_cobro_mesa: 'post_pago', num_mesas: 20,
      impresora_modelo: '', impresora_ancho: 80, impresora_auto_print: false, impresora_copias: 1,
    });
  };

  const handleAparienciaChange = async (newTheme: ThemeName, newPalette: PaletteName) => {
    if (!user?.empresa_id) return;
    // Apply immediately to UI
    setTheme(newTheme);
    setPalette(newPalette);
    // Save to empresa in backend
    try {
      await empresasApi.update(user.empresa_id, {
        config_apariencia: { tema: newTheme, paleta: newPalette },
      });
      // Update local user storage so reload keeps it
      const stored = localStorage.getItem('pos_user');
      if (stored) {
        const u = JSON.parse(stored);
        u.config_apariencia = { tema: newTheme, paleta: newPalette };
        localStorage.setItem('pos_user', JSON.stringify(u));
      }
      toast.success('Apariencia guardada');
    } catch {
      toast.error('Error al guardar apariencia');
    }
  };

  const toggleSection = (s: string) => setExpandedSection(expandedSection === s ? '' : s);

  const SectionHeader = ({ id, icon: Icon, title }: { id: string; icon: any; title: string }) => (
    <button onClick={() => toggleSection(id)} className="w-full flex items-center justify-between p-3 bg-iados-card/50 rounded-xl mb-2 hover:bg-iados-card transition-colors">
      <div className="flex items-center gap-2 font-bold text-sm">
        <Icon size={18} className="text-iados-accent" /> {title}
      </div>
      {expandedSection === id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </button>
  );

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings size={24} /> Configuracion</h1>
        <button onClick={handleNew} className="btn-primary text-sm"><Plus size={16} className="mr-1" />Nueva Tienda</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Lista de tiendas */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-400 mb-2">Tiendas</h3>
          {tiendas.map((t) => (
            <div
              key={t.id}
              onClick={() => { selectTienda(t); setEditingNew(false); setShowForm(false); }}
              className={`card flex items-center gap-3 cursor-pointer transition-all ${selected?.id === t.id ? 'ring-2 ring-iados-primary' : 'hover:ring-1 hover:ring-slate-600'}`}
            >
              <div className="w-10 h-10 bg-iados-primary rounded-xl flex items-center justify-center font-bold">
                <Store size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{t.nombre}</p>
                <p className="text-xs text-slate-500 truncate">{t.direccion || 'Sin direccion'}</p>
                <div className="flex gap-1 mt-1">
                  {t.config_pos?.modo_servicio === 'mesa' ? (
                    <span className="text-xs px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded">Mesa</span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 bg-green-900/50 text-green-300 rounded">Autoservicio</span>
                  )}
                  {t.id === user?.tienda_id && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-900/50 text-amber-300 rounded">Mi tienda</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={(e) => { e.stopPropagation(); selectTienda(t); setEditingNew(false); }} className="p-1.5 hover:bg-iados-card rounded-lg"><Edit2 size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(t); }} className="p-1.5 hover:bg-red-900/50 rounded-lg text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {tiendas.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No hay tiendas</p>}
        </div>

        {/* Config panel */}
        <div className="lg:col-span-2 space-y-2">
          {/* Logo empresa - siempre visible */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm flex items-center gap-2"><Building2 size={16} className="text-iados-accent" /> Logo de Empresa</h3>
            </div>
            <div className="flex items-center gap-4">
              {empresaLogo ? (
                <img src={resolveUploadUrl(empresaLogo)} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-slate-700" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-iados-card flex items-center justify-center text-slate-500 border border-slate-700">
                  <Building2 size={24} />
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400 mb-2">Aparece en el menu lateral, POS y tickets</p>
                <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo} className="btn-secondary text-xs flex items-center gap-1">
                  <Upload size={14} /> {uploadingLogo ? 'Subiendo...' : 'Subir Logo'}
                </button>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
            </div>
          </div>

          {/* Apariencia - Temas y Paletas (por empresa) */}
          <SectionHeader id="apariencia" icon={Palette} title="Apariencia" />
          {expandedSection === 'apariencia' && (
            <div className="card space-y-5">
              <p className="text-xs" style={{ color: 'rgb(var(--c-text-sub))' }}>
                Aplica a todos los usuarios de la empresa <strong>{user?.empresa_nombre}</strong> (Empresa ID: {user?.empresa_id}, Tenant: {user?.tenant_id})
              </p>
              {/* Temas */}
              <div>
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <LayoutGrid size={16} /> Plantilla / Tema
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {THEMES.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => handleAparienciaChange(t.key, palette)}
                      className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                        theme === t.key
                          ? 'border-iados-secondary bg-iados-secondary/10 ring-1 ring-iados-secondary/50'
                          : 'border-iados-card/60 hover:border-iados-card'
                      }`}
                    >
                      {/* Mini preview */}
                      <div
                        className="w-full h-16 mb-2 flex flex-col items-center justify-center gap-1"
                        style={{ backgroundColor: 'rgb(var(--c-card) / 0.6)', ...t.previewStyle }}
                      >
                        <div className="w-10 h-2 rounded-sm" style={{ backgroundColor: 'rgb(var(--c-primary))' }} />
                        <div className="flex gap-1">
                          <div className="w-6 h-1.5 rounded-sm" style={{ backgroundColor: 'rgb(var(--c-accent))' }} />
                          <div className="w-6 h-1.5 rounded-sm" style={{ backgroundColor: 'rgb(var(--c-secondary))', opacity: 0.5 }} />
                        </div>
                        <div className="w-12 h-1 rounded-sm" style={{ backgroundColor: 'rgb(var(--c-text-sub))', opacity: 0.3 }} />
                      </div>
                      <p className="font-bold text-xs">{t.name}</p>
                      <p className="text-[10px]" style={{ color: 'rgb(var(--c-text-sub))' }}>{t.desc}</p>
                      {theme === t.key && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-iados-secondary flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paletas */}
              <div className="border-t border-iados-card pt-4">
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Palette size={16} /> Paleta de Colores
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {PALETTES.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => handleAparienciaChange(theme, p.key)}
                      className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                        palette === p.key
                          ? 'border-iados-secondary bg-iados-secondary/10 ring-1 ring-iados-secondary/50'
                          : 'border-iados-card/60 hover:border-iados-card'
                      }`}
                    >
                      {/* Color swatches */}
                      <div className="flex gap-1.5 mb-2">
                        {p.colors.map((c, i) => (
                          <div key={i} className="flex-1 h-8 rounded-lg first:rounded-l-xl last:rounded-r-xl" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      {/* Mini dark bg preview */}
                      <div className="w-full h-6 rounded-lg mb-2 flex items-center gap-1 px-2" style={{ backgroundColor: p.key === 'default' ? '#0f172a' : p.key === 'esmeralda' ? '#022c22' : p.key === 'purpura' ? '#1a0a2e' : p.key === 'rubi' ? '#1a0505' : '#042f2e' }}>
                        <div className="w-4 h-2 rounded" style={{ backgroundColor: p.colors[0] }} />
                        <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: p.colors[1], opacity: 0.5 }} />
                        <div className="w-3 h-2 rounded" style={{ backgroundColor: p.colors[2] }} />
                      </div>
                      <p className="font-bold text-xs">{p.name}</p>
                      {palette === p.key && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: p.colors[1] }}>
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(selected || editingNew) ? (
            <>
              <div className="card">
                <h3 className="font-bold text-lg mb-1">{editingNew ? 'Nueva Tienda' : selected.nombre}</h3>
                {!editingNew && <p className="text-xs text-slate-500 mb-3">ID: {selected.id} | Tenant: {selected.tenant_id} | Empresa: {selected.empresa_id}</p>}
              </div>

              {/* Seccion: Datos generales */}
              <SectionHeader id="general" icon={Store} title="Datos Generales" />
              {expandedSection === 'general' && (
                <div className="card space-y-3">
                  <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre de la tienda" className="input-touch" />
                  <input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="Direccion" className="input-touch" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Telefono" className="input-touch" />
                    <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="input-touch" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Zona Horaria</label>
                    <select value={form.zona_horaria} onChange={(e) => setForm({ ...form, zona_horaria: e.target.value })} className="input-touch">
                      <option value="America/Mexico_City">Ciudad de Mexico (CST)</option>
                      <option value="America/Tijuana">Tijuana (PST)</option>
                      <option value="America/Monterrey">Monterrey (CST)</option>
                      <option value="America/Cancun">Cancun (EST)</option>
                      <option value="America/Hermosillo">Hermosillo (MST)</option>
                    </select>
                  </div>

                  {/* IVA */}
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <label className="flex items-center gap-3 cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={form.iva_enabled}
                        onChange={(e) => setForm({ ...form, iva_enabled: e.target.checked })}
                        className="w-5 h-5 accent-iados-primary rounded"
                      />
                      <div>
                        <span className="text-sm font-medium">Manejar IVA</span>
                        <p className="text-xs text-slate-500">Activa para aplicar impuesto a los productos</p>
                      </div>
                    </label>

                    {form.iva_enabled && (
                      <div className="space-y-3 pl-8">
                        <div>
                          <label className="text-xs text-slate-400">Porcentaje de IVA</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number" min="0" max="100" step="1"
                              value={form.iva_porcentaje}
                              onChange={(e) => setForm({ ...form, iva_porcentaje: Number(e.target.value) })}
                              className="input-touch w-24"
                            />
                            <span className="text-sm text-slate-400">%</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 mb-2 block">Modo de aplicacion</label>
                          <div className="grid grid-cols-1 gap-2">
                            <button
                              onClick={() => setForm({ ...form, iva_incluido: true })}
                              className={`p-3 rounded-xl border-2 text-left transition-all ${form.iva_incluido ? 'border-green-500 bg-green-900/20' : 'border-slate-700 bg-iados-card'}`}
                            >
                              <p className="font-bold text-sm">Precio ya incluye IVA</p>
                              <p className="text-xs text-slate-400">El precio del producto ya tiene el IVA incluido. Se desglosa en el ticket.</p>
                            </button>
                            <button
                              onClick={() => setForm({ ...form, iva_incluido: false })}
                              className={`p-3 rounded-xl border-2 text-left transition-all ${!form.iva_incluido ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 bg-iados-card'}`}
                            >
                              <p className="font-bold text-sm">IVA se suma al precio</p>
                              <p className="text-xs text-slate-400">El precio del producto es sin IVA. El impuesto se agrega al total.</p>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Seccion: Modo POS */}
              <SectionHeader id="pos" icon={Monitor} title="Modo de Servicio POS" />
              {expandedSection === 'pos' && (
                <div className="card space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Modalidad de servicio</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setForm({ ...form, modo_servicio: 'autoservicio' })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${form.modo_servicio === 'autoservicio' ? 'border-green-500 bg-green-900/20' : 'border-slate-700 bg-iados-card'}`}
                      >
                        <p className="font-bold text-sm">Autoservicio / Caja</p>
                        <p className="text-xs text-slate-400 mt-1">El cajero toma el pedido y cobra de inmediato. Flujo clasico.</p>
                      </button>
                      <button
                        onClick={() => setForm({ ...form, modo_servicio: 'mesa' })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${form.modo_servicio === 'mesa' ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 bg-iados-card'}`}
                      >
                        <p className="font-bold text-sm">Servicio a Mesa</p>
                        <p className="text-xs text-slate-400 mt-1">El mesero levanta pedidos asignados a una mesa.</p>
                      </button>
                    </div>
                  </div>

                  {form.modo_servicio === 'mesa' && (
                    <>
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">Tipo de cobro en mesa</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setForm({ ...form, tipo_cobro_mesa: 'post_pago' })}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${form.tipo_cobro_mesa === 'post_pago' ? 'border-amber-500 bg-amber-900/20' : 'border-slate-700 bg-iados-card'}`}
                          >
                            <p className="font-bold text-sm">Post Pago</p>
                            <p className="text-xs text-slate-400 mt-1">El mesero envia el pedido. El cajero cobra despues. Se notifica al cajero.</p>
                          </button>
                          <button
                            onClick={() => setForm({ ...form, tipo_cobro_mesa: 'pago_inmediato' })}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${form.tipo_cobro_mesa === 'pago_inmediato' ? 'border-purple-500 bg-purple-900/20' : 'border-slate-700 bg-iados-card'}`}
                          >
                            <p className="font-bold text-sm">Pago Inmediato</p>
                            <p className="text-xs text-slate-400 mt-1">El mesero cobra en la mesa al momento de levantar el pedido.</p>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-slate-400 mb-1 block">Numero de mesas</label>
                        <input type="number" min="1" max="200" value={form.num_mesas} onChange={(e) => setForm({ ...form, num_mesas: Number(e.target.value) })} className="input-touch w-32" />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Seccion: Impresora */}
              <SectionHeader id="impresora" icon={Printer} title="Impresora" />
              {expandedSection === 'impresora' && (
                <div className="card space-y-3">
                  <input value={form.impresora_modelo} onChange={(e) => setForm({ ...form, impresora_modelo: e.target.value })} placeholder="Modelo de impresora (ej: Epson TM-T20)" className="input-touch" />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-400">Ancho papel (mm)</label>
                      <select value={form.impresora_ancho} onChange={(e) => setForm({ ...form, impresora_ancho: Number(e.target.value) })} className="input-touch">
                        <option value={58}>58mm</option>
                        <option value={80}>80mm</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Copias</label>
                      <input type="number" min="1" max="5" value={form.impresora_copias} onChange={(e) => setForm({ ...form, impresora_copias: Number(e.target.value) })} className="input-touch" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.impresora_auto_print} onChange={(e) => setForm({ ...form, impresora_auto_print: e.target.checked })} className="w-5 h-5 rounded" />
                    <span className="text-sm">Imprimir automaticamente al completar venta</span>
                  </label>
                </div>
              )}

              {/* Boton guardar */}
              <button onClick={handleSave} disabled={loading || !form.nombre} className="btn-primary w-full text-lg mt-4 disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={20} /> {loading ? 'Guardando...' : 'Guardar Configuracion'}
              </button>
            </>
          ) : (
            <div className="card text-center text-slate-500 py-16">
              <Settings size={48} className="mx-auto mb-3 opacity-30" />
              <p>Selecciona una tienda para configurar</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal confirmar eliminacion */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full text-center space-y-4">
            <Trash2 size={40} className="mx-auto text-red-400" />
            <h3 className="text-lg font-bold">Eliminar Tienda</h3>
            <p className="text-slate-400">Seguro que deseas eliminar <strong>{deleteConfirm.nombre}</strong>?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex-1">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
