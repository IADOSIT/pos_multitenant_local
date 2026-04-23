import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tiendasApi, empresasApi, tenantsApi, menuDigitalApi, pagosGatewayApi, mesasApi } from '../../api/endpoints';
import api, { resolveUploadUrl } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import TicketsConfig from './TicketsConfig';
import { useThemeStore, ThemeName, PaletteName } from '../../store/theme.store';
import toast from 'react-hot-toast';
import { Settings, Store, Monitor, Printer, Save, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Upload, Building2, Palette, LayoutGrid, Wifi, Copy, Check, QrCode, RefreshCw, Globe, Clock, AlertTriangle, Loader2, ExternalLink, Key, CreditCard, Smartphone, Eye, EyeOff, Layers, TrendingUp, DollarSign } from 'lucide-react';
import PerfilNegocioPage from './PerfilNegocioPage';
import InventarioDualPage from '../inventario/InventarioDualPage';
import QRCode from 'qrcode';

const THEMES: { key: ThemeName; name: string; desc: string; previewStyle: React.CSSProperties }[] = [
  { key: 'default', name: 'Default', desc: 'Redondeado clasico', previewStyle: { borderRadius: '1rem', border: '1px solid rgba(100,116,139,0.4)' } },
  { key: 'moderno', name: 'Moderno', desc: 'Cristal, blur, gradientes', previewStyle: { borderRadius: '1.25rem', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' } },
  { key: 'elegante', name: 'Elegante', desc: 'Recto, premium, refinado', previewStyle: { borderRadius: '0.375rem', borderTop: '2px solid rgba(59,130,246,0.5)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' } },
  { key: 'neon', name: 'Neon', desc: 'Glow, cyberpunk, futurista', previewStyle: { borderRadius: '0.75rem', border: '1px solid rgba(59,130,246,0.4)', boxShadow: '0 0 20px rgba(59,130,246,0.15), 0 0 40px rgba(59,130,246,0.05)' } },
  { key: 'compacto', name: 'Compacto', desc: 'Denso, eficiente, menos espacio', previewStyle: { borderRadius: '0.4rem', padding: '0.3rem', fontSize: '0.75rem', border: '1px solid rgba(100,116,139,0.25)' } },
  { key: 'claro', name: 'Claro', desc: 'Blanco, luminoso, alto contraste', previewStyle: { borderRadius: '1rem', background: 'white', border: '1px solid rgb(203 213 225)', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' } },
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
  const navigate = useNavigate();
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingNew, setEditingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [expandedSection, setExpandedSection] = useState<string>('pos');
  const [configTab, setConfigTab] = useState<'tienda' | 'tickets' | 'modulos' | 'especial'>('tienda');
  const [empresaLogo, setEmpresaLogo] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState<string>('');
  const [meseroQrs, setMeseroQrs] = useState<{ label: string; url: string; qrDataUrl: string; tipo: 'internet' | 'local' | 'hostname' }[]>([]);
  const [loadingQrs, setLoadingQrs] = useState(false);
  // Pagos Gateway
  const [gwConfig, setGwConfig]           = useState<any>(null);
  const [gwForm, setGwForm]               = useState<any>({});
  const [gwSaving, setGwSaving]           = useState(false);
  const [gwShowMpToken, setGwShowMpToken] = useState(false);
  const [gwShowStripeKey, setGwShowStripeKey] = useState(false);
  // Mesas QR
  const [mesaQrSelected, setMesaQrSelected] = useState<string>('');
  const [mesaQrDataUrl, setMesaQrDataUrl] = useState<string>('');
  const [allMesas, setAllMesas] = useState<any[]>([]);

  // Conf. Especial — selector cascada Tenant → Empresa → Tienda
  const [especTenants, setEspecTenants] = useState<any[]>([]);
  const [especEmpresas, setEspecEmpresas] = useState<any[]>([]);
  const [especSelTenantId, setEspecSelTenantId] = useState<number | null>(null);
  const [especSelEmpresaId, setEspecSelEmpresaId] = useState<number | null>(null);
  const [especLoadingSelector, setEspecLoadingSelector] = useState(false);

  // Menu Digital
  const [mdStatus, setMdStatus]       = useState<any>(null);
  const [mdLogs, setMdLogs]           = useState<any[]>([]);
  const [mdPublishing, setMdPublishing] = useState(false);
  const [mdQr, setMdQr]               = useState<string>('');
  const [mdCfgForm, setMdCfgForm]     = useState<any>({});

  // Worker URL toma prioridad sobre cloud_url para el QR del menú.
  const getMenuUrl = (cloudUrl: string, slug: string, workerUrl?: string): string => {
    if (workerUrl) return `${workerUrl.replace(/\/$/, '')}/menu/${slug}`;
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(cloudUrl || '');
    const base = isLocal ? window.location.origin : (cloudUrl || '').replace(/\/$/, '');
    return `${base}/menu/${slug}`;
  };

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
    self_order_enabled: false,
    self_order_url: '',
    habilitar_cuenta_abierta: false,
    mostrar_so_pendiente_en_pos: false,
    devoluciones_enabled: false,
    devoluciones_rol: 'admin',
    notas_por_item: false,
    notas_rapidas: '',
    notas_pedido_enabled: false,
    datos_envio_enabled: false,
    en_sitio_visible: true,
    para_llevar_visible: true,
    pos_stock_badge_enabled: false,
    cajero_dashboard_enabled: false,
    cantidades_rapidas: '10,25,50,100',
    whatsapp_enabled: false,
    whatsapp_phone: '',
    whatsapp_token: '',
    // Impresora config
    impresora_modelo: '',
    impresora_ancho: 80,
    impresora_auto_print: false,
    impresora_copias: 1,
    // Conf. Especial (solo superadmin)
    caja_auto_enabled: false,
    caja_ocultar_ui: false,
    dashboard_ventas_enabled: true,
    dashboard_selforder_enabled: true,
    dashboard_categorias_enabled: false,
    dashboard_drill_down_enabled: false,
    dashboard_unidad_enabled: false,
    dashboard_top_productos_enabled: false,
    dashboard_top_n: 10,
    dashboard_mostrar_margen: false,
    mesa_numero_oculto: false,
    sidebar_permisos: {} as Record<string, string[]>,
    whatsapp_eventos: { stock_bajo: true, resumen_diario: false } as Record<string, boolean>,
    reportes_tabs_config: [
      { key: 'caja',     label: 'Cierre de Caja', enabled: true },
      { key: 'kpi',      label: 'KPI',            enabled: true },
      { key: 'clientes', label: 'Clientes',        enabled: true },
    ] as { key: string; label: string; enabled: boolean }[],
  });

  useEffect(() => { load(); loadEmpresa(); fetchSystemInfo(); }, []);

  // Sincronizar selector cascada cuando hay una tienda ya seleccionada
  useEffect(() => {
    if (configTab === 'especial' && selected && especEmpresas.length > 0) {
      const empresa = especEmpresas.find((e) => e.id === selected.empresa_id);
      if (empresa) {
        setEspecSelTenantId(empresa.tenant_id);
        setEspecSelEmpresaId(empresa.id);
      }
    }
  }, [configTab, selected?.id, especEmpresas.length]);

  // Cargar tenants + empresas cuando se entra al tab especial (solo superadmin)
  useEffect(() => {
    if (configTab === 'especial' && user?.rol === 'superadmin' && especTenants.length === 0) {
      setEspecLoadingSelector(true);
      Promise.all([tenantsApi.list(), empresasApi.list()])
        .then(([tRes, eRes]) => {
          setEspecTenants(tRes.data || []);
          setEspecEmpresas(eRes.data || []);
          // Auto-seleccionar el primero si solo hay uno
          if ((tRes.data || []).length === 1) {
            setEspecSelTenantId(tRes.data[0].id);
            const emps = (eRes.data || []).filter((e: any) => e.tenant_id === tRes.data[0].id);
            if (emps.length === 1) setEspecSelEmpresaId(emps[0].id);
          }
        })
        .catch(() => {})
        .finally(() => setEspecLoadingSelector(false));
    }
  }, [configTab]);

  // Load menu digital status when a tienda is selected
  useEffect(() => {
    if (selected?.id) loadMenuDigital(selected.id);
  }, [selected?.id]);

  // Load mesas when selected tienda changes
  useEffect(() => {
    if (selected?.id) {
      mesasApi.list().then(r => setAllMesas(r.data || [])).catch(() => {});
    } else {
      setAllMesas([]);
    }
  }, [selected?.id]);

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
      self_order_enabled: cp.self_order_enabled || false,
      self_order_url: cp.self_order_url || '',
      habilitar_cuenta_abierta: cp.habilitar_cuenta_abierta || false,
      mostrar_so_pendiente_en_pos: cp.mostrar_so_pendiente_en_pos || false,
      devoluciones_enabled: cp.devoluciones_enabled || false,
      devoluciones_rol: cp.devoluciones_rol || 'admin',
      notas_por_item: cp.notas_por_item || false,
      notas_rapidas: cp.notas_rapidas || '',
      notas_pedido_enabled: cp.notas_pedido_enabled || false,
      datos_envio_enabled: cp.datos_envio_enabled || false,
      en_sitio_visible: cp.en_sitio_visible !== false,
      para_llevar_visible: cp.para_llevar_visible !== false,
      pos_stock_badge_enabled: cp.pos_stock_badge_enabled || false,
      cajero_dashboard_enabled: cp.cajero_dashboard_enabled || false,
      cantidades_rapidas: cp.cantidades_rapidas || '10,25,50,100',
      whatsapp_enabled: cp.whatsapp_enabled || false,
      whatsapp_phone: cp.whatsapp_phone || '',
      whatsapp_token: cp.whatsapp_token || '',
      impresora_modelo: ci.modelo || '',
      impresora_ancho: ci.ancho || 80,
      impresora_auto_print: ci.auto_print || false,
      impresora_copias: ci.copias || 1,
      caja_auto_enabled: cp.caja_auto_enabled || false,
      caja_ocultar_ui: cp.caja_ocultar_ui || false,
      dashboard_ventas_enabled: cp.dashboard_ventas_enabled !== false,
      dashboard_selforder_enabled: cp.dashboard_selforder_enabled !== false,
      dashboard_categorias_enabled: cp.dashboard_categorias_enabled || false,
      dashboard_drill_down_enabled: cp.dashboard_drill_down_enabled || false,
      dashboard_unidad_enabled: cp.dashboard_unidad_enabled || false,
      dashboard_top_productos_enabled: cp.dashboard_top_productos_enabled || false,
      dashboard_top_n: cp.dashboard_top_n || 10,
      dashboard_mostrar_margen: cp.dashboard_mostrar_margen || false,
      mesa_numero_oculto: cp.mesa_numero_oculto || false,
      sidebar_permisos: cp.sidebar_permisos || {},
      whatsapp_eventos: cp.whatsapp_eventos || { stock_bajo: true, resumen_diario: false },
      reportes_tabs_config: cp.reportes_tabs_config || [
        { key: 'caja',     label: 'Cierre de Caja', enabled: true },
        { key: 'kpi',      label: 'KPI',            enabled: true },
        { key: 'clientes', label: 'Clientes',        enabled: true },
      ],
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
          self_order_enabled: form.self_order_enabled,
          self_order_url: form.self_order_url || undefined,
          habilitar_cuenta_abierta: form.habilitar_cuenta_abierta,
          mostrar_so_pendiente_en_pos: form.mostrar_so_pendiente_en_pos,
          devoluciones_enabled: form.devoluciones_enabled,
          devoluciones_rol: form.devoluciones_rol,
          notas_por_item: form.notas_por_item,
          notas_rapidas: form.notas_rapidas || '',
          notas_pedido_enabled: form.notas_pedido_enabled,
          datos_envio_enabled: form.datos_envio_enabled,
          en_sitio_visible: form.en_sitio_visible,
          para_llevar_visible: form.para_llevar_visible,
          pos_stock_badge_enabled: form.pos_stock_badge_enabled,
          cajero_dashboard_enabled: form.cajero_dashboard_enabled,
          cantidades_rapidas: form.cantidades_rapidas || '',
          whatsapp_enabled: form.whatsapp_enabled,
          whatsapp_phone: form.whatsapp_phone || '',
          whatsapp_token: form.whatsapp_token || '',
          iva_enabled: form.iva_enabled,
          iva_porcentaje: form.iva_porcentaje,
          iva_incluido: form.iva_incluido,
          caja_auto_enabled: form.caja_auto_enabled,
          caja_ocultar_ui: form.caja_ocultar_ui,
          dashboard_ventas_enabled: form.dashboard_ventas_enabled,
          dashboard_selforder_enabled: form.dashboard_selforder_enabled,
          dashboard_categorias_enabled: form.dashboard_categorias_enabled,
          dashboard_drill_down_enabled: form.dashboard_drill_down_enabled,
          dashboard_unidad_enabled: form.dashboard_unidad_enabled,
          dashboard_top_productos_enabled: form.dashboard_top_productos_enabled,
          dashboard_top_n: form.dashboard_top_n,
          dashboard_mostrar_margen: form.dashboard_mostrar_margen,
          mesa_numero_oculto: form.mesa_numero_oculto,
          sidebar_permisos: form.sidebar_permisos,
          whatsapp_eventos: form.whatsapp_eventos,
          reportes_tabs_config: form.reportes_tabs_config,
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
    setExpandedSection('general');
    setForm({
      nombre: '', direccion: '', telefono: '', email: '',
      zona_horaria: 'America/Mexico_City',
      iva_enabled: false, iva_porcentaje: 16, iva_incluido: true,
      modo_servicio: 'autoservicio', tipo_cobro_mesa: 'post_pago', num_mesas: 20, self_order_enabled: false, self_order_url: '', habilitar_cuenta_abierta: false, mostrar_so_pendiente_en_pos: false, notas_por_item: false, notas_rapidas: '', notas_pedido_enabled: false, datos_envio_enabled: false, en_sitio_visible: true, para_llevar_visible: true, pos_stock_badge_enabled: false, cajero_dashboard_enabled: false, cantidades_rapidas: '10,25,50,100', whatsapp_enabled: false, whatsapp_phone: '', whatsapp_token: '',
      impresora_modelo: '', impresora_ancho: 80, impresora_auto_print: false, impresora_copias: 1,
      caja_auto_enabled: false, caja_ocultar_ui: false,
      dashboard_ventas_enabled: true, dashboard_selforder_enabled: true,
      dashboard_categorias_enabled: false, dashboard_drill_down_enabled: false,
      dashboard_unidad_enabled: false, dashboard_top_productos_enabled: false,
      dashboard_top_n: 10, dashboard_mostrar_margen: false,
      mesa_numero_oculto: false, sidebar_permisos: {}, whatsapp_eventos: { stock_bajo: true, resumen_diario: false },
      reportes_tabs_config: [
        { key: 'caja',     label: 'Cierre de Caja', enabled: true },
        { key: 'kpi',      label: 'KPI',            enabled: true },
        { key: 'clientes', label: 'Clientes',        enabled: true },
      ],
    });
  };

  const handleAparienciaChange = async (newTheme: ThemeName, newPalette: PaletteName) => {
    // Aplicar al DOM inmediatamente, sin importar si hay empresa_id
    setTheme(newTheme);
    setPalette(newPalette);
    // Guardar en localStorage para persistir entre recargas
    const stored = localStorage.getItem('pos_user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        u.config_apariencia = { tema: newTheme, paleta: newPalette };
        localStorage.setItem('pos_user', JSON.stringify(u));
      } catch {}
    }
    // Guardar en backend solo si hay empresa_id
    if (!user?.empresa_id) {
      toast.success('Apariencia aplicada');
      return;
    }
    try {
      await empresasApi.update(user.empresa_id, {
        config_apariencia: { tema: newTheme, paleta: newPalette },
      });
      toast.success('Apariencia guardada');
    } catch {
      toast.error('Error al guardar apariencia en servidor');
    }
  };

  const loadMenuDigital = useCallback(async (tiendaId: number) => {
    try {
      const [statusRes, logsRes] = await Promise.all([
        menuDigitalApi.getStatus(tiendaId),
        menuDigitalApi.getLogs(tiendaId),
      ]);
      const status = statusRes.data;
      setMdStatus(status);
      setMdLogs(logsRes.data || []);
      setMdCfgForm({
        is_active:     status.config?.is_active    ?? false,
        modo_menu:     status.config?.modo_menu    ?? 'consulta',
        sync_mode:     status.config?.sync_mode    ?? 'manual',
        sync_interval: status.config?.sync_interval ?? 30,
        cloud_url:     status.config?.cloud_url    ?? '',
        worker_url:    status.config?.worker_url   ?? '',
        slug:          status.config?.slug         ?? '',
        plantilla:     status.config?.plantilla    ?? 'oscuro',
      });
      // Generate QR if has slug + any URL (worker or cloud)
      if (status.config?.slug && (status.config?.worker_url || status.config?.cloud_url)) {
        const menuUrl = getMenuUrl(status.config.cloud_url || '', status.config.slug, status.config.worker_url);
        const qr = await QRCode.toDataURL(menuUrl, { width: 200, margin: 2 });
        setMdQr(qr);
      } else {
        setMdQr('');
      }
      // Auto-sync check
      if (status.should_auto_sync) {
        handleMdPublish(tiendaId, true);
      }
    } catch {}
  }, []);

  const loadGwConfig = useCallback(async () => {
    try {
      const { data } = await pagosGatewayApi.getConfig();
      setGwConfig(data);
      setGwForm({
        mp_access_token: data.mp_access_token || '',
        mp_public_key: data.mp_public_key || '',
        mp_user_id: data.mp_user_id || '',
        mp_point_device_id: data.mp_point_device_id || '',
        stripe_secret_key: data.stripe_secret_key || '',
        stripe_publishable_key: data.stripe_publishable_key || '',
        stripe_webhook_secret: data.stripe_webhook_secret || '',
        mp_qr_habilitado: data.opciones?.mp_qr_habilitado ?? false,
        mp_point_habilitado: data.opciones?.mp_point_habilitado ?? false,
        stripe_habilitado: data.opciones?.stripe_habilitado ?? false,
        confirmacion_automatica: data.opciones?.confirmacion_automatica ?? true,
        comision_mp_porcentaje: data.opciones?.comision_mp_porcentaje ?? 3.49,
        comision_stripe_porcentaje: data.opciones?.comision_stripe_porcentaje ?? 3.6,
      });
    } catch {}
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadGwConfig(); }, []);

  const saveGwConfig = async () => {
    setGwSaving(true);
    try {
      await pagosGatewayApi.saveConfig({
        mp_access_token: gwForm.mp_access_token,
        mp_public_key: gwForm.mp_public_key,
        mp_user_id: gwForm.mp_user_id,
        mp_point_device_id: gwForm.mp_point_device_id,
        stripe_secret_key: gwForm.stripe_secret_key,
        stripe_publishable_key: gwForm.stripe_publishable_key,
        stripe_webhook_secret: gwForm.stripe_webhook_secret,
        opciones: {
          mp_qr_habilitado: gwForm.mp_qr_habilitado,
          mp_point_habilitado: gwForm.mp_point_habilitado,
          stripe_habilitado: gwForm.stripe_habilitado,
          confirmacion_automatica: gwForm.confirmacion_automatica,
          comision_mp_porcentaje: Number(gwForm.comision_mp_porcentaje),
          comision_stripe_porcentaje: Number(gwForm.comision_stripe_porcentaje),
        },
      });
      toast.success('Configuración de pagos guardada');
      loadGwConfig();
    } catch { toast.error('Error al guardar configuración de pagos'); }
    finally { setGwSaving(false); }
  };

  const saveMdConfig = async () => {
    if (!selected?.id) return;
    try {
      await menuDigitalApi.updateConfig(selected.id, mdCfgForm);
      toast.success('Configuracion del menu guardada');
      loadMenuDigital(selected.id);
    } catch { toast.error('Error al guardar configuracion del menu'); }
  };

  const handleMdPublish = async (tiendaId: number, silent = false) => {
    setMdPublishing(true);
    try {
      // Guardar config actual antes de publicar para asegurar worker_url/slug actualizados
      await menuDigitalApi.updateConfig(tiendaId, mdCfgForm);
      const { data } = await menuDigitalApi.publish(tiendaId);
      if (data.success) {
        if (!silent) toast.success(`Menu publicado: ${data.productos} productos${data.worker_synced ? ' · Worker OK' : ''}`);
        loadMenuDigital(tiendaId);
      } else {
        if (!silent) toast.error(data.error || 'Error al publicar');
      }
    } catch (e: any) {
      if (!silent) toast.error(e.response?.data?.message || 'Error al publicar menu');
    } finally {
      setMdPublishing(false);
    }
  };

  const handleMdRegenKey = async () => {
    if (!selected?.id) return;
    if (!confirm('¿Regenerar API key? Los enlaces activos dejarán de funcionar hasta publicar de nuevo.')) return;
    try {
      const { data } = await menuDigitalApi.regenerateKey(selected.id);
      toast.success('API key regenerada');
      loadMenuDigital(selected.id);
    } catch { toast.error('Error al regenerar key'); }
  };

  const fetchSystemInfo = async () => {
    try {
      const { data } = await api.get('/health/info');
      setSystemInfo(data);
      // Always use the current browser origin for the QR — works correctly on VPS and local
      const qrUrl = window.location.origin;
      const dataUrl = await QRCode.toDataURL(qrUrl, { width: 200, margin: 2 });
      setQrDataUrl(dataUrl);
    } catch {}
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(''), 2000);
    }).catch(() => toast.error('No se pudo copiar'));
  };

  const buildMeseroQrs = useCallback(async () => {
    setLoadingQrs(true);
    try {
      const origin = window.location.origin;
      const isLocal = /localhost|127\.0\.0\.1/.test(origin);
      const entries: { label: string; url: string; tipo: 'internet' | 'local' | 'hostname' }[] = [];

      // Always: current browser origin
      entries.push({
        label: isLocal ? 'Este equipo (localhost)' : 'Acceso por Internet',
        url: origin,
        tipo: isLocal ? 'local' : 'internet',
      });

      if (isLocal && systemInfo) {
        // Hostname
        if (systemInfo.hostname && systemInfo.hostname !== 'localhost') {
          const u = new URL(origin);
          u.hostname = systemInfo.hostname;
          entries.push({ label: `Por nombre de equipo (${systemInfo.hostname})`, url: u.toString(), tipo: 'hostname' });
        }
        // Network IPs
        for (const ip of (systemInfo.ips || [])) {
          const u = new URL(origin);
          u.hostname = ip;
          entries.push({ label: `Red WiFi local (${ip})`, url: u.toString(), tipo: 'local' });
        }
      }

      // Generate QR for each
      const withQr = await Promise.all(
        entries.map(async (e) => ({
          ...e,
          qrDataUrl: await QRCode.toDataURL(e.url, { width: 200, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } }),
        }))
      );
      setMeseroQrs(withQr);
    } finally {
      setLoadingQrs(false);
    }
  }, [systemInfo]);

  useEffect(() => {
    if (expandedSection === 'red') buildMeseroQrs();
  }, [expandedSection, buildMeseroQrs]);

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
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings size={24} /> Configuracion</h1>
        {configTab === 'tienda' && (
          <button onClick={handleNew} className="btn-primary text-sm"><Plus size={16} className="mr-1" />Nueva Tienda</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700 mb-4">
        {[
          { id: 'tienda',   label: 'Tienda' },
          { id: 'tickets',  label: 'Tickets' },
          ...(['superadmin', 'admin'].includes(user?.rol || '') ? [{ id: 'modulos', label: 'Modulos' }] : []),
          ...(user?.rol === 'superadmin' ? [{ id: 'especial', label: '⚙️ Conf. Especial' }] : []),
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setConfigTab(id as any)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              configTab === id ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white hover:bg-iados-card'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {configTab === 'tickets' && <TicketsConfig />}

      {configTab === 'modulos' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2 mb-3"><Layers size={18} className="text-iados-accent" /> Perfil de Negocio</h2>
            <PerfilNegocioPage />
          </div>
          <hr className="border-slate-700" />
          <div>
            <h2 className="text-base font-bold flex items-center gap-2 mb-3"><Layers size={18} className="text-iados-accent" /> Inventario Dual</h2>
            <InventarioDualPage />
          </div>
        </div>
      )}

      {/* ── TAB CONF. ESPECIAL (solo superadmin) ──────────────────────── */}
      {configTab === 'especial' && (
        <div className="space-y-4">
          {/* Selector cascada Tenant → Empresa → Tienda */}
          <div className="card space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Building2 size={16} className="text-iados-accent" /> Aplicar configuración a
            </h3>
            {especLoadingSelector ? (
              <div className="text-slate-400 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Cargando...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tenant */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Tenant</label>
                  <select
                    value={especSelTenantId ?? ''}
                    onChange={(e) => {
                      const tid = e.target.value ? Number(e.target.value) : null;
                      setEspecSelTenantId(tid);
                      setEspecSelEmpresaId(null);
                      setSelected(null);
                    }}
                    className="input-touch text-sm"
                  >
                    <option value="">— Selecciona tenant —</option>
                    {especTenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
                {/* Empresa */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Empresa</label>
                  <select
                    value={especSelEmpresaId ?? ''}
                    disabled={!especSelTenantId}
                    onChange={(e) => {
                      const eid = e.target.value ? Number(e.target.value) : null;
                      setEspecSelEmpresaId(eid);
                      setSelected(null);
                    }}
                    className="input-touch text-sm disabled:opacity-50"
                  >
                    <option value="">— Selecciona empresa —</option>
                    {especEmpresas
                      .filter((e) => e.tenant_id === especSelTenantId)
                      .map((e) => (
                        <option key={e.id} value={e.id}>{e.nombre}</option>
                      ))}
                  </select>
                </div>
                {/* Tienda */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Tienda</label>
                  <select
                    value={selected?.id ?? ''}
                    disabled={!especSelEmpresaId}
                    onChange={(e) => {
                      if (!e.target.value) { setSelected(null); return; }
                      const empresa = especEmpresas.find((emp) => emp.id === especSelEmpresaId);
                      const tienda = (empresa?.tiendas || []).find((t: any) => t.id === Number(e.target.value));
                      if (tienda) {
                        // tiendas del relation pueden no tener config_pos completo → recargar via API
                        tiendasApi.get(tienda.id).then(({ data }) => selectTienda(data)).catch(() => {});
                      }
                    }}
                    className="input-touch text-sm disabled:opacity-50"
                  >
                    <option value="">— Selecciona tienda —</option>
                    {(especEmpresas.find((e) => e.id === especSelEmpresaId)?.tiendas || []).map((t: any) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {!selected ? (
            <div className="card text-center text-slate-500 py-6 text-sm">Selecciona Tenant → Empresa → Tienda para configurar</div>
          ) : (
            <>
              <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl px-4 py-2 text-xs text-amber-300 flex items-center gap-2">
                <AlertTriangle size={14} /> Configurando: <span className="font-bold">{selected.nombre}</span> — solo visible para superadmin
              </div>

              {/* ── Sección Caja ── */}
              <div className="card space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2"><DollarSign size={16} className="text-green-400" /> Caja Automática (CDMX)</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.caja_auto_enabled}
                    onChange={(e) => setForm({ ...form, caja_auto_enabled: e.target.checked })}
                    className="w-5 h-5 accent-iados-primary" />
                  <div>
                    <span className="text-sm font-medium">Caja automática por día natural</span>
                    <p className="text-xs text-slate-500">Se abre sola a las 00:00 y se cierra a las 23:59 hora CDMX, sin fondo de apertura</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.caja_ocultar_ui}
                    onChange={(e) => setForm({ ...form, caja_ocultar_ui: e.target.checked })}
                    className="w-5 h-5 accent-iados-primary" />
                  <div>
                    <span className="text-sm font-medium">Ocultar sección Caja del menú</span>
                    <p className="text-xs text-slate-500">Los cajeros/meseros no ven la opción Caja en el sidebar</p>
                  </div>
                </label>
              </div>

              {/* ── Sección Dashboard ── */}
              <div className="card space-y-4">
                <h3 className="font-bold text-sm flex items-center gap-2"><TrendingUp size={16} className="text-blue-400" /> Dashboard — Tabs visibles</h3>
                <p className="text-xs text-slate-500">Selecciona qué pestañas aparecen en el Dashboard para esta tienda.</p>

                {/* Grid de tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'dashboard_ventas_enabled',        label: 'Ventas',          desc: 'KPIs generales, tendencia y métodos de pago', defaultOn: true },
                    { key: 'dashboard_selforder_enabled',     label: 'Self Order',      desc: 'Pedidos QR, encuestas y métricas de autoservicio', defaultOn: true },
                    { key: 'dashboard_categorias_enabled',    label: 'Por Categoría',   desc: 'Ventas agrupadas por categoría de producto', defaultOn: false },
                    { key: 'dashboard_unidad_enabled',        label: 'Por Presentación',desc: 'Agrupa por campo Unidad del producto (pza, 1L, Grande…)', defaultOn: false },
                    { key: 'dashboard_top_productos_enabled', label: 'Top Productos',   desc: 'Ranking de productos con filtro por categoría', defaultOn: false },
                  ].map(({ key, label, desc }) => {
                    const checked = (form as any)[key] as boolean;
                    return (
                      <label key={key} className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${checked ? 'border-iados-primary/60 bg-iados-primary/10' : 'border-slate-700 hover:border-slate-600'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                          className="mt-0.5 w-4 h-4 accent-iados-primary shrink-0"
                        />
                        <div>
                          <span className="text-sm font-medium block">{label}</span>
                          <p className="text-xs text-slate-500">{desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Sub-opción drill-down (sólo si categorias está activo) */}
                {form.dashboard_categorias_enabled && (
                  <label className="flex items-center gap-3 cursor-pointer pl-4 border-l-2 border-iados-primary/40">
                    <input type="checkbox" checked={form.dashboard_drill_down_enabled || false}
                      onChange={(e) => setForm({ ...form, dashboard_drill_down_enabled: e.target.checked })}
                      className="w-4 h-4 accent-iados-primary" />
                    <div>
                      <span className="text-sm font-medium">Drill-down categoría → productos</span>
                      <p className="text-xs text-slate-500">Al expandir una categoría se ven los productos vendidos dentro de ella</p>
                    </div>
                  </label>
                )}

                {/* Opciones de tabla */}
                <div className="border-t border-slate-700 pt-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-300 flex-1">Número de ítems en tablas/gráficas</label>
                    <select
                      value={form.dashboard_top_n || 10}
                      onChange={(e) => setForm({ ...form, dashboard_top_n: Number(e.target.value) })}
                      className="input-touch text-sm w-24"
                    >
                      {[5, 10, 15, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.dashboard_mostrar_margen || false}
                      onChange={(e) => setForm({ ...form, dashboard_mostrar_margen: e.target.checked })}
                      className="w-4 h-4 accent-iados-primary" />
                    <div>
                      <span className="text-sm font-medium">Mostrar precio promedio</span>
                      <p className="text-xs text-slate-500">Columna adicional en tablas de productos/presentación</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* ── Sección Mesas ── */}
              <div className="card space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2"><Monitor size={16} className="text-purple-400" /> Modo Mesa</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.mesa_numero_oculto}
                    onChange={(e) => setForm({ ...form, mesa_numero_oculto: e.target.checked })}
                    className="w-5 h-5 accent-iados-primary" />
                  <div>
                    <span className="text-sm font-medium">Ocultar campo de número de mesa</span>
                    <p className="text-xs text-slate-500">En modo mesa el cajero no escribe el número — ideal si las mesas se asignan por QR</p>
                  </div>
                </label>
              </div>

              {/* ── Sección Sidebar por rol ── */}
              <div className="card space-y-4">
                <h3 className="font-bold text-sm flex items-center gap-2"><Eye size={16} className="text-amber-400" /> Menú lateral por rol</h3>
                <p className="text-xs text-slate-500">Marca qué opciones puede ver cada rol. Si dejas todo sin marcar, el rol ve su configuración por defecto.</p>
                {[
                  { rol: 'cajero',  label: 'Cajero',  color: 'text-blue-400' },
                  { rol: 'mesero',  label: 'Mesero',  color: 'text-green-400' },
                  { rol: 'manager', label: 'Manager', color: 'text-purple-400' },
                  { rol: 'admin',   label: 'Admin',   color: 'text-amber-400' },
                ].map(({ rol, label, color }) => {
                  const todosItems = [
                    { to: '/pos',                 label: 'POS' },
                    { to: '/dashboard',           label: 'Dashboard' },
                    { to: '/pedidos',             label: 'Pedidos' },
                    { to: '/caja',                label: 'Caja' },
                    { to: '/reportes',            label: 'Reportes' },
                    { to: '/inventario',          label: 'Inventario' },
                    { to: '/catalogos',           label: 'Catálogos' },
                    { to: '/admin/mesas',         label: 'Mesas' },
                    { to: '/admin/usuarios',      label: 'Usuarios' },
                    { to: '/admin/configuracion', label: 'Configuración' },
                    { to: '/admin/mantenimiento', label: 'Mantenimiento' },
                  ];
                  const permisos: string[] = form.sidebar_permisos[rol] || [];
                  const allChecked = permisos.length === 0;
                  return (
                    <div key={rol} className="border border-slate-700 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium text-sm ${color}`}>{label}</span>
                        <button
                          className="text-xs text-slate-400 hover:text-white"
                          onClick={() => setForm({ ...form, sidebar_permisos: { ...form.sidebar_permisos, [rol]: [] } })}
                        >
                          Reset (default)
                        </button>
                      </div>
                      {allChecked && <p className="text-xs text-slate-500 italic">Usando configuración por defecto del sistema</p>}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {todosItems.map(({ to, label: itemLabel }) => {
                          const checked = permisos.includes(to);
                          return (
                            <label key={to} className="flex items-center gap-2 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const newPermisos = e.target.checked
                                    ? [...permisos, to]
                                    : permisos.filter((p) => p !== to);
                                  setForm({ ...form, sidebar_permisos: { ...form.sidebar_permisos, [rol]: newPermisos } });
                                }}
                                className="accent-iados-primary"
                              />
                              {itemLabel}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Sección WhatsApp eventos ── */}
              <div className="card space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2"><Smartphone size={16} className="text-green-400" /> Notificaciones WhatsApp</h3>
                <p className="text-xs text-slate-500">Configura qué eventos disparan una notificación (requiere Fonnte habilitado en POS)</p>
                {[
                  { key: 'stock_bajo',      label: 'Stock bajo al hacer venta',     desc: 'Cuando un producto cae bajo el mínimo' },
                  { key: 'resumen_diario',  label: 'Resumen diario de ventas',       desc: 'Resumen a las 23:00 con total del día' },
                  { key: 'nueva_venta',     label: 'Cada nueva venta',               desc: 'Un mensaje por cada venta registrada' },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.whatsapp_eventos[key] ?? false}
                      onChange={(e) => setForm({ ...form, whatsapp_eventos: { ...form.whatsapp_eventos, [key]: e.target.checked } })}
                      className="w-5 h-5 accent-iados-primary"
                    />
                    <div>
                      <span className="text-sm font-medium">{label}</span>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* ── Sección Tabs de Reportes ── */}
              <div className="card space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2"><TrendingUp size={16} className="text-blue-400" /> Tabs de Reportes</h3>
                <p className="text-xs text-slate-500">Activa o desactiva cada pestaña y ajusta el orden en que aparecen. Aplica solo a esta tienda.</p>
                <div className="space-y-2">
                  {form.reportes_tabs_config.map((tab, idx) => (
                    <div key={tab.key} className="flex items-center gap-3 bg-iados-surface rounded-xl px-3 py-2 border border-slate-700">
                      <input
                        type="checkbox"
                        checked={tab.enabled}
                        onChange={(e) => {
                          const updated = form.reportes_tabs_config.map((t, i) =>
                            i === idx ? { ...t, enabled: e.target.checked } : t
                          );
                          setForm({ ...form, reportes_tabs_config: updated });
                        }}
                        className="w-5 h-5 accent-iados-primary shrink-0"
                      />
                      <span className={`text-sm flex-1 ${tab.enabled ? '' : 'text-slate-500 line-through'}`}>{tab.label}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            const updated = [...form.reportes_tabs_config];
                            [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
                            setForm({ ...form, reportes_tabs_config: updated });
                          }}
                          className="p-1 rounded hover:bg-iados-card disabled:opacity-20 text-slate-400 hover:text-white"
                        ><ChevronUp size={16} /></button>
                        <button
                          type="button"
                          disabled={idx === form.reportes_tabs_config.length - 1}
                          onClick={() => {
                            const updated = [...form.reportes_tabs_config];
                            [updated[idx + 1], updated[idx]] = [updated[idx], updated[idx + 1]];
                            setForm({ ...form, reportes_tabs_config: updated });
                          }}
                          className="p-1 rounded hover:bg-iados-card disabled:opacity-20 text-slate-400 hover:text-white"
                        ><ChevronDown size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón guardar */}
              <button onClick={handleSave} disabled={loading} className="btn-success w-full text-base">
                {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : <><Save size={18} className="mr-2" />Guardar Configuración Especial</>}
              </button>
            </>
          )}
        </div>
      )}

      {configTab === 'tienda' && <div className="grid lg:grid-cols-3 gap-4">
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
                <button onClick={(e) => { e.stopPropagation(); selectTienda(t); setEditingNew(false); setExpandedSection('general'); }} className="p-1.5 hover:bg-iados-card rounded-lg"><Edit2 size={14} /></button>
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
                <input ref={logoRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.heic,.heif" className="hidden" onChange={handleLogoUpload} />
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

          {/* Seccion: Conexion y Red */}
          <SectionHeader id="red" icon={Wifi} title="Conexion y Red" />
          {expandedSection === 'red' && (
            <div className="card space-y-5">
              <div>
                <h4 className="font-semibold text-sm mb-1">QR de Acceso para Meseros / Cajeros</h4>
                <p className="text-xs" style={{ color: 'rgb(var(--c-text-sub))' }}>
                  El mesero escanea el QR con su celular y abre el sistema directamente. Cada QR usa un método de conexión diferente — imprime el que aplique a tu instalación.
                </p>
              </div>

              {loadingQrs ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Wifi size={16} className="animate-pulse" /> Generando QR...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {meseroQrs.map((q, i) => (
                    <div key={i} className="rounded-xl border border-iados-card p-4 space-y-2 text-center">
                      {/* Badge tipo */}
                      <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        q.tipo === 'internet' ? 'bg-blue-900/40 text-blue-300' :
                        q.tipo === 'hostname' ? 'bg-purple-900/40 text-purple-300' :
                        'bg-amber-900/40 text-amber-300'
                      }`}>
                        {q.tipo === 'internet' ? <Globe size={10} /> : q.tipo === 'hostname' ? <Monitor size={10} /> : <Wifi size={10} />}
                        {q.tipo === 'internet' ? 'Internet / VPS' : q.tipo === 'hostname' ? 'Nombre Equipo' : 'Red Local'}
                      </div>

                      <p className="text-xs font-medium" style={{ color: 'rgb(var(--c-text-sub))' }}>{q.label}</p>

                      <div className="bg-white p-2 rounded-xl inline-block mx-auto">
                        <img src={q.qrDataUrl} alt={q.label} className="w-36 h-36" />
                      </div>

                      <code className="text-xs text-slate-400 break-all block">{q.url}</code>

                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleCopyUrl(q.url)}
                          className="text-xs px-2 py-1 rounded-lg bg-iados-card hover:opacity-80 flex items-center gap-1"
                        >
                          {copiedUrl === q.url ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                          Copiar
                        </button>
                        <button
                          onClick={() => {
                            const w = window.open('', '_blank');
                            if (!w) return;
                            w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>QR Acceso — ${q.label}</title>
                              <style>
                                body{font-family:Arial,sans-serif;text-align:center;padding:32px;background:#fff;color:#1e293b}
                                .card{display:inline-block;border:2px solid #e2e8f0;border-radius:20px;padding:28px 24px;max-width:320px}
                                .badge{display:inline-block;background:#0f172a;color:#fff;font-size:13px;font-weight:700;padding:6px 18px;border-radius:50px;margin:10px 0}
                                .url{font-size:11px;color:#94a3b8;margin-top:8px;word-break:break-all}
                                .steps{text-align:left;background:#f8fafc;border-radius:12px;padding:14px 16px;margin-top:12px;font-size:12px}
                                .steps h4{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:8px}
                                .step{margin-bottom:6px;color:#334155}
                                button{background:#0f172a;color:#fff;padding:10px 24px;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-top:16px}
                                @media print{button{display:none}}
                              </style></head>
                              <body><div class="card">
                                <div style="font-size:22px;font-weight:800">POS-iaDoS</div>
                                <div class="badge">${q.label}</div>
                                <br/>
                                <img src="${q.qrDataUrl}" width="200" height="200" style="border-radius:12px;border:1px solid #e2e8f0"/>
                                <div class="url">${q.url}</div>
                                <div class="steps">
                                  <h4>Cómo conectarse</h4>
                                  <div class="step">📱 <strong>1.</strong> Abre la cámara de tu celular</div>
                                  <div class="step">🔍 <strong>2.</strong> Apunta al código QR</div>
                                  <div class="step">🔑 <strong>3.</strong> Inicia sesión con tu usuario y PIN</div>
                                </div>
                                <button onclick="window.print()">🖨️ Imprimir</button>
                              </div></body></html>`);
                            w.document.close();
                          }}
                          className="text-xs px-2 py-1 rounded-lg bg-iados-primary text-white hover:opacity-80 flex items-center gap-1"
                        >
                          <Printer size={11} /> Imprimir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Info additional */}
              {systemInfo && (
                <p className="text-xs text-slate-600">
                  Servidor: <span className="text-slate-400">{systemInfo.hostname}</span>
                  {' · '}Modo: <span className={systemInfo.mode === 'online' ? 'text-blue-400' : 'text-green-400'}>{systemInfo.mode || 'local'}</span>
                </p>
              )}

              {/* QR de Mesa (Self Order) */}
              {selected && (
                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-2">QR de Mesa (Self Order)</p>
                  <select
                    value={mesaQrSelected}
                    onChange={async (e) => {
                      setMesaQrSelected(e.target.value);
                      if (e.target.value) {
                        const mesa = allMesas.find((m: any) => String(m.id) === e.target.value);
                        if (mesa) {
                          const slug = selected?.slug;
                          const path = slug
                            ? `/s/${slug}/${mesa.numero}`
                            : `/self-order/${selected.id}/${mesa.numero}`;
                          const url = `${window.location.origin}${path}`;
                          const qr = await QRCode.toDataURL(url, { width: 200, margin: 2 });
                          setMesaQrDataUrl(qr);
                        }
                      } else {
                        setMesaQrDataUrl('');
                      }
                    }}
                    className="input-touch text-sm mb-2 w-full"
                  >
                    <option value="">Seleccionar mesa...</option>
                    {allMesas.map((m: any) => (
                      <option key={m.id} value={m.id}>Mesa {m.numero}{m.nombre ? ` - ${m.nombre}` : ''}</option>
                    ))}
                  </select>
                  {mesaQrDataUrl && (
                    <div className="space-y-2">
                      <div className="bg-white p-2 rounded-xl inline-block">
                        <img src={mesaQrDataUrl} alt="QR Mesa" className="w-36 h-36" />
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            const mesa = allMesas.find((m: any) => String(m.id) === mesaQrSelected);
                            if (mesa) {
                              const slug = selected?.slug;
                              const path = slug ? `/s/${slug}/${mesa.numero}` : `/self-order/${selected.id}/${mesa.numero}`;
                              const w = window.open('', '_blank');
                              if (w) {
                                w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>QR Mesa ${mesa.numero}</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:20px;background:white}.card{display:inline-block;border:2px solid #e2e8f0;border-radius:20px;padding:24px;margin:20px auto}@media print{button{display:none}}</style></head><body><div class="card"><div style="font-size:13px;color:#64748b">${selected.nombre || ''}</div><div style="font-size:24px;font-weight:800;background:#0f172a;color:white;padding:6px 20px;border-radius:50px;display:inline-block;margin:8px 0">Mesa ${mesa.numero}${mesa.nombre ? ' · ' + mesa.nombre : ''}</div><br/><img src="${mesaQrDataUrl}" width="200" height="200" style="border-radius:12px"/><br/><p style="font-size:12px;color:#94a3b8">📱 Escanea para hacer tu pedido</p><p style="font-size:10px;color:#cbd5e1">${window.location.origin}${path}</p><br/><button onclick="window.print()" style="background:#0f172a;color:white;padding:10px 24px;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">🖨️ Imprimir</button></div></body></html>`);
                                w.document.close();
                              }
                            }
                          }}
                          className="text-xs bg-iados-primary text-white px-3 py-1.5 rounded-lg hover:opacity-90"
                        >
                          <Printer size={12} className="inline mr-1" />Imprimir QR Mesa
                        </button>
                      </div>
                    </div>
                  )}
                  {allMesas.length === 0 && (
                    <p className="text-xs text-slate-500">No hay mesas configuradas para esta tienda.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Seccion: Menu Digital QR */}
          {selected && (
            <>
              <SectionHeader id="menu-digital" icon={QrCode} title="Menu Digital QR" />
              {expandedSection === 'menu-digital' && (
                <div className="card space-y-5">
                  {/* Estado y toggle */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-sm mb-1">Menu publico para clientes</h4>
                      <p className="text-xs" style={{ color: 'rgb(var(--c-text-sub))' }}>
                        El cliente escanea el QR con su celular y ve el menu desde internet, sin necesitar estar en tu red.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={mdCfgForm.is_active ?? false}
                        onChange={async e => {
                          const updated = { ...mdCfgForm, is_active: e.target.checked };
                          setMdCfgForm(updated);
                          try {
                            await menuDigitalApi.updateConfig(selected.id, updated);
                            loadMenuDigital(selected.id);
                          } catch { toast.error('Error al guardar'); }
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-checked:bg-iados-secondary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                    </label>
                  </div>

                  {/* Worker URL (Cloudflare Relay) */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Globe size={12} /> Worker URL (internet)</label>
                    <input
                      value={mdCfgForm.worker_url ?? ''}
                      onChange={e => setMdCfgForm({ ...mdCfgForm, worker_url: e.target.value.trim() })}
                      placeholder="https://pos-iados-relay.workers.dev"
                      className="input-touch text-sm font-mono"
                    />
                    {mdCfgForm.worker_url ? (
                      <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        ✓ Menú y pedidos via internet. QR usará esta URL.
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">
                        Opcional — Cloudflare Worker para acceso desde cualquier red. Ver <code>cloudflare-worker/README.md</code>
                      </p>
                    )}
                  </div>

                  {/* Cloud URL */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Globe size={12} /> URL del servidor (local/VPS)</label>
                    <div className="flex gap-2">
                      <input
                        value={mdCfgForm.cloud_url ?? ''}
                        onChange={e => setMdCfgForm({ ...mdCfgForm, cloud_url: e.target.value })}
                        placeholder="http://localhost:3000"
                        className="input-touch text-sm font-mono flex-1"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const { data } = await menuDigitalApi.getServerInfo();
                            setMdCfgForm((f: any) => ({ ...f, cloud_url: data.backendUrl }));
                          } catch { toast.error('No se pudo obtener la URL del servidor'); }
                        }}
                        className="btn-secondary text-xs px-2 whitespace-nowrap"
                        title="Usar la URL de este servidor"
                      >
                        Este servidor
                      </button>
                    </div>
                    {!mdCfgForm.cloud_url && (
                      <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                        <AlertTriangle size={11} /> Requerida para publicar. Usa "Este servidor" si publicas en LOCAL.
                      </p>
                    )}
                    {mdCfgForm.cloud_url && !/^https?:\/\/(\d{1,3}\.){3}\d{1,3}|localhost|127\.0\.0\.1/.test(mdCfgForm.cloud_url) && (
                      <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                        <AlertTriangle size={11} /> La URL parece un hostname interno. Usa IP o "Este servidor".
                      </p>
                    )}
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Enlace del menu (slug)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        value={mdCfgForm.slug ?? ''}
                        onChange={e => setMdCfgForm({ ...mdCfgForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        placeholder="mi-restaurante"
                        className="input-touch text-sm font-mono flex-1"
                      />
                    </div>
                    {mdCfgForm.slug && (
                      <p className="text-xs mt-1 text-slate-500 font-mono break-all">
                        {getMenuUrl(mdCfgForm.cloud_url || '', mdCfgForm.slug, mdCfgForm.worker_url).replace(/\/menu\/.*/, '')}/menu/<span className="text-iados-accent">{mdCfgForm.slug}</span>
                      </p>
                    )}
                  </div>

                  {/* Modo y Sync - 2 columnas */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Modo del menu</label>
                      <select
                        value={mdCfgForm.modo_menu ?? 'consulta'}
                        onChange={e => setMdCfgForm({ ...mdCfgForm, modo_menu: e.target.value })}
                        className="input-touch text-sm"
                      >
                        <option value="consulta">Solo consulta</option>
                        <option value="pedidos">Permite pedidos</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Sincronizacion</label>
                      <select
                        value={mdCfgForm.sync_mode ?? 'manual'}
                        onChange={e => setMdCfgForm({ ...mdCfgForm, sync_mode: e.target.value })}
                        className="input-touch text-sm"
                      >
                        <option value="manual">Manual</option>
                        <option value="auto">Automatica</option>
                      </select>
                    </div>
                  </div>

                  {mdCfgForm.sync_mode === 'auto' && (
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Intervalo de auto-publicacion</label>
                      <select
                        value={mdCfgForm.sync_interval ?? 30}
                        onChange={e => setMdCfgForm({ ...mdCfgForm, sync_interval: Number(e.target.value) })}
                        className="input-touch text-sm"
                      >
                        <option value={15}>Cada 15 minutos</option>
                        <option value={30}>Cada 30 minutos</option>
                        <option value={60}>Cada hora</option>
                        <option value={120}>Cada 2 horas</option>
                      </select>
                    </div>
                  )}

                  {/* Plantilla visual del menu */}
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">Plantilla visual del menu</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { key: 'oscuro', label: 'Oscuro', bg: '#0d0d0d', accent: '#f59e0b' },
                        { key: 'claro',  label: 'Claro',  bg: '#f4f4f5', accent: '#ea580c' },
                        { key: 'mar',    label: 'Mar',    bg: '#061628', accent: '#06b6d4' },
                      ] as const).map(tpl => {
                        const isSelected = (mdCfgForm.plantilla ?? 'oscuro') === tpl.key;
                        return (
                          <button
                            key={tpl.key}
                            type="button"
                            onClick={() => setMdCfgForm({ ...mdCfgForm, plantilla: tpl.key })}
                            className="relative rounded-xl overflow-hidden transition-all"
                            style={{
                              border: isSelected ? `2px solid var(--c-accent, #6366f1)` : '2px solid rgba(255,255,255,0.08)',
                              transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                              opacity: isSelected ? 1 : 0.65,
                            }}
                          >
                            {/* Mini preview */}
                            <div style={{ background: tpl.bg, padding: '10px 6px 6px' }}>
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-10 h-2 rounded-full" style={{ background: tpl.accent }} />
                                <div className="w-6 h-1 rounded-full" style={{ background: tpl.accent, opacity: 0.4 }} />
                                <div className="w-8 h-1 rounded-full mt-1" style={{ background: tpl.accent, opacity: 0.2 }} />
                              </div>
                            </div>
                            <div className="py-1.5 text-center" style={{ background: tpl.bg }}>
                              <span className="text-xs font-semibold" style={{ color: tpl.accent }}>{tpl.label}</span>
                            </div>
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ background: tpl.accent }}>
                                <Check size={9} style={{ color: tpl.bg }} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">El diseño se aplica al publicar.</p>
                  </div>

                  {/* Botones guardar config + publicar */}
                  <div className="flex gap-2">
                    <button onClick={saveMdConfig} className="btn-secondary text-xs flex-1 flex items-center justify-center gap-1">
                      <Save size={14} /> Guardar config
                    </button>
                    <button
                      onClick={() => handleMdPublish(selected.id)}
                      disabled={mdPublishing || (!mdCfgForm.cloud_url && !mdCfgForm.worker_url)}
                      className="btn-primary text-xs flex-1 flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {mdPublishing
                        ? <><Loader2 size={14} className="animate-spin" /> Publicando...</>
                        : <><RefreshCw size={14} /> Publicar Menu</>}
                    </button>
                  </div>

                  {/* Estado actual */}
                  {mdStatus?.config && (
                    <div className="p-3 rounded-xl border border-iados-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Estado</span>
                        {mdStatus.config.last_publish_status === 'success' ? (
                          <span className="text-xs text-green-400 flex items-center gap-1"><Check size={11} /> Publicado</span>
                        ) : mdStatus.config.last_publish_status === 'error' ? (
                          <span className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle size={11} /> Error</span>
                        ) : (
                          <span className="text-xs text-slate-500">Sin publicar</span>
                        )}
                      </div>
                      {mdStatus.config.last_published_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Ultima publicacion</span>
                          <span className="text-xs text-slate-300 flex items-center gap-1">
                            <Clock size={11} />
                            {new Date(mdStatus.config.last_published_at).toLocaleString('es-MX')}
                          </span>
                        </div>
                      )}
                      {mdStatus.pending_changes > 0 && (
                        <div className="flex items-center gap-2 mt-1 p-2 rounded-lg bg-amber-900/20 border border-amber-700/30">
                          <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
                          <p className="text-xs text-amber-300">
                            {mdStatus.pending_changes === -1
                              ? 'Menu nunca publicado'
                              : `${mdStatus.pending_changes} cambio${mdStatus.pending_changes !== 1 ? 's' : ''} sin publicar`}
                          </p>
                        </div>
                      )}
                      {mdStatus.config.last_publish_error && (
                        <p className="text-xs text-red-400 break-all">{mdStatus.config.last_publish_error}</p>
                      )}
                    </div>
                  )}

                  {/* QR + enlace */}
                  {mdQr && (
                    <div className="flex gap-4 items-center">
                      <div className="bg-white p-2 rounded-xl flex-shrink-0">
                        <img src={mdQr} alt="QR Menu" className="w-28 h-28" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-xs text-slate-400">Comparte este QR con tus clientes</p>
                        <code className="text-xs text-iados-accent break-all block">
                          {getMenuUrl(mdCfgForm.cloud_url || '', mdCfgForm.slug || '', mdCfgForm.worker_url)}
                        </code>
                        <a
                          href={getMenuUrl(mdCfgForm.cloud_url || '', mdCfgForm.slug || '', mdCfgForm.worker_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-400 hover:text-iados-accent flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink size={11} /> Abrir menu en navegador
                        </a>
                        <button
                            onClick={() => {
                              const w = window.open('', '_blank');
                              if (!w) return;
                              const menuUrl = getMenuUrl(mdCfgForm.cloud_url || '', mdCfgForm.slug || '', mdCfgForm.worker_url);
                              w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>QR Menú — ${selected?.nombre || 'Tienda'}</title>
                                <style>
                                  body{font-family:Arial,sans-serif;text-align:center;padding:32px;background:#fff;color:#1e293b}
                                  .card{display:inline-block;border:2px solid #e2e8f0;border-radius:20px;padding:28px 24px;max-width:320px}
                                  .badge{display:inline-block;background:#0f172a;color:#fff;font-size:13px;font-weight:700;padding:6px 18px;border-radius:50px;margin:10px 0}
                                  .url{font-size:11px;color:#94a3b8;margin-top:8px;word-break:break-all}
                                  .steps{text-align:left;background:#f8fafc;border-radius:12px;padding:14px 16px;margin-top:12px;font-size:12px}
                                  .steps h4{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:8px}
                                  .step{margin-bottom:6px;color:#334155}
                                  button{background:#0f172a;color:#fff;padding:10px 24px;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-top:16px}
                                  @media print{button{display:none}}
                                </style></head>
                                <body><div class="card">
                                  <div style="font-size:22px;font-weight:800">${selected?.nombre || 'Menú Digital'}</div>
                                  <div class="badge">Ordena desde tu celular</div>
                                  <br/>
                                  <img src="${mdQr}" width="200" height="200" style="border-radius:12px;border:1px solid #e2e8f0"/>
                                  <div class="url">${menuUrl}</div>
                                  <div class="steps">
                                    <h4>¿Cómo ordenar?</h4>
                                    <div class="step">📱 <strong>1.</strong> Abre la cámara de tu celular</div>
                                    <div class="step">🔍 <strong>2.</strong> Apunta al código QR</div>
                                    <div class="step">🛒 <strong>3.</strong> Elige tus productos del menú</div>
                                    <div class="step">✅ <strong>4.</strong> Envía tu pedido</div>
                                    <div class="step">⏳ <strong>5.</strong> Espera en tu lugar, ¡nosotros te atendemos!</div>
                                  </div>
                                  <button onclick="window.print()">🖨️ Imprimir</button>
                                </div></body></html>`);
                              w.document.close();
                            }}
                            className="text-xs px-2 py-1 rounded-lg bg-iados-primary text-white hover:opacity-80 flex items-center gap-1 transition-colors"
                          >
                            <Printer size={11} /> Imprimir QR con pasos
                          </button>
                      </div>
                    </div>
                  )}

                  {/* API Key */}
                  {mdStatus?.config?.api_key && (
                    <div className="border-t border-iados-card pt-4">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-400 flex items-center gap-1"><Key size={11} /> API Key</label>
                        <button onClick={handleMdRegenKey} className="text-xs text-slate-500 hover:text-red-400 transition-colors">
                          Regenerar
                        </button>
                      </div>
                      <code className="text-xs text-slate-600 break-all block">{mdStatus.config.api_key}</code>
                    </div>
                  )}

                  {/* Historial de publicaciones */}
                  {mdLogs.length > 0 && (
                    <div className="border-t border-iados-card pt-4">
                      <h5 className="text-xs font-bold text-slate-400 mb-2">Historial de publicaciones</h5>
                      <div className="space-y-1.5">
                        {mdLogs.map((log, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {log.status === 'success'
                                ? <Check size={12} className="text-green-400" />
                                : <AlertTriangle size={12} className="text-red-400" />}
                              <span className="text-slate-400">
                                {new Date(log.created_at).toLocaleDateString('es-MX')}
                              </span>
                              {log.status === 'success' && (
                                <span className="text-slate-500">{log.productos_count} prod · {log.images_uploaded} img</span>
                              )}
                            </div>
                            <span className="text-slate-600">{(log.duration_ms / 1000).toFixed(1)}s</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
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

                  {/* Cuentas Abiertas */}
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.habilitar_cuenta_abierta}
                        onChange={(e) => setForm({ ...form, habilitar_cuenta_abierta: e.target.checked })}
                        className="w-5 h-5 accent-iados-primary rounded"
                      />
                      <div>
                        <span className="text-sm font-medium">Habilitar Cuentas Abiertas</span>
                        <p className="text-xs text-slate-500">Muestra botón "Cuenta" en el carrito para abrir una cuenta sin cobrar</p>
                      </div>
                    </label>
                  </div>

                  {/* Dashboard para cajero */}
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.cajero_dashboard_enabled}
                        onChange={(e) => setForm({ ...form, cajero_dashboard_enabled: e.target.checked })}
                        className="w-5 h-5 accent-iados-primary rounded"
                      />
                      <div>
                        <span className="text-sm font-medium">Cajero puede ver Dashboard</span>
                        <p className="text-xs text-slate-500">Muestra el menú Dashboard al rol cajero</p>
                      </div>
                    </label>
                  </div>

                  {/* Alerta Self Order en POS */}
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.mostrar_so_pendiente_en_pos}
                        onChange={(e) => setForm({ ...form, mostrar_so_pendiente_en_pos: e.target.checked })}
                        className="w-5 h-5 accent-iados-primary rounded"
                      />
                      <div>
                        <span className="text-sm font-medium">Mostrar alerta Self Order en POS</span>
                        <p className="text-xs text-slate-500">Muestra en el POS los pedidos de mesa pendientes de confirmar al cliente</p>
                      </div>
                    </label>
                  </div>

                  {/* Notas por ítem */}
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <label className="flex items-center gap-3 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={form.notas_por_item}
                        onChange={(e) => setForm({ ...form, notas_por_item: e.target.checked })}
                        className="w-5 h-5 accent-iados-primary rounded"
                      />
                      <div>
                        <span className="text-sm font-medium">Notas por ítem en carrito</span>
                        <p className="text-xs text-slate-500">Permite agregar nota/modificación a cada producto (toca el ítem para editarla)</p>
                      </div>
                    </label>
                    {form.notas_por_item && (
                      <div className="ml-8">
                        <label className="text-xs text-slate-400 block mb-1">Chips de notas rápidas (separados por coma)</label>
                        <input
                          type="text"
                          value={form.notas_rapidas || ''}
                          onChange={(e) => setForm({ ...form, notas_rapidas: e.target.value })}
                          placeholder="Sin cebolla, Extra picante, Sin sal, Bien cocido, Extra queso"
                          className="input-touch text-xs w-full"
                        />
                        <p className="text-xs text-slate-600 mt-1">Aparecen como botones de un toque al editar la nota de un ítem</p>
                      </div>
                    )}
                  </div>

                  {/* Nota general del pedido */}
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.notas_pedido_enabled}
                        onChange={(e) => setForm({ ...form, notas_pedido_enabled: e.target.checked })}
                        className="w-5 h-5 accent-iados-primary rounded"
                      />
                      <div>
                        <span className="text-sm font-medium">Nota general del pedido</span>
                        <p className="text-xs text-slate-500">Campo de texto libre en el carrito para instrucciones generales (sin cebolla, alergia, etc.)</p>
                      </div>
                    </label>
                  </div>

                  {/* Devoluciones */}
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <label className="flex items-center gap-3 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={form.devoluciones_enabled ?? false}
                        onChange={(e) => setForm({ ...form, devoluciones_enabled: e.target.checked })}
                        className="w-5 h-5 accent-iados-primary rounded"
                      />
                      <div>
                        <span className="text-sm font-medium">Devoluciones / Reembolsos</span>
                        <p className="text-xs text-slate-500">Habilita el botón de devolución en el historial de ventas (Reportes)</p>
                      </div>
                    </label>
                    {form.devoluciones_enabled && (
                      <div className="ml-8 mt-2">
                        <label className="text-xs text-slate-400 mb-1 block">¿Quién puede hacer devoluciones?</label>
                        <select
                          value={form.devoluciones_rol ?? 'admin'}
                          onChange={(e) => setForm({ ...form, devoluciones_rol: e.target.value })}
                          className="input-touch text-sm"
                        >
                          <option value="admin">Solo Admin / Gerente</option>
                          <option value="cajero">También Cajero</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Datos de entrega (para llevar) */}
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <label className="flex items-center gap-3 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={form.datos_envio_enabled}
                        onChange={(e) => setForm({ ...form, datos_envio_enabled: e.target.checked })}
                        className="w-5 h-5 accent-iados-primary rounded"
                      />
                      <div>
                        <span className="text-sm font-medium">Datos de entrega (para llevar)</span>
                        <p className="text-xs text-slate-500">Muestra campos de nombre, teléfono y dirección cuando el pedido es para llevar</p>
                      </div>
                    </label>
                  </div>

                  {/* Visibilidad EN SITIO / PARA LLEVAR en carrito */}
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <p className="text-sm font-medium mb-2">Botones de tipo de servicio en carrito</p>
                    <p className="text-xs text-slate-500 mb-3">Controla cuáles opciones aparecen en el POS (🍽️ En sitio / 🥡 Para llevar). Desactiva los que no apliquen para esta tienda.</p>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.en_sitio_visible}
                          onChange={(e) => setForm({ ...form, en_sitio_visible: e.target.checked })}
                          className="w-5 h-5 accent-iados-primary rounded"
                        />
                        <span className="text-sm">🍽️ Mostrar <strong>En sitio</strong></span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.para_llevar_visible}
                          onChange={(e) => setForm({ ...form, para_llevar_visible: e.target.checked })}
                          className="w-5 h-5 accent-iados-primary rounded"
                        />
                        <span className="text-sm">🥡 Mostrar <strong>Para llevar</strong></span>
                      </label>
                    </div>
                  </div>

                  {/* Etiqueta stock bajo en tarjetas de producto */}
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.pos_stock_badge_enabled}
                        onChange={(e) => setForm({ ...form, pos_stock_badge_enabled: e.target.checked })}
                        className="w-5 h-5 accent-iados-primary rounded"
                      />
                      <div>
                        <span className="text-sm font-medium">Mostrar alerta de stock en tarjetas de producto</span>
                        <p className="text-xs text-slate-500">Muestra una etiqueta en cada producto del POS con la cantidad restante cuando está bajo o en el mínimo de stock</p>
                      </div>
                    </label>
                  </div>

                  {/* Cantidades rápidas */}
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <label className="text-sm font-medium block mb-1">Botones de cantidad rápida</label>
                    <input
                      type="text"
                      value={form.cantidades_rapidas || ''}
                      onChange={(e) => setForm({ ...form, cantidades_rapidas: e.target.value })}
                      placeholder="10,25,50,100"
                      className="input-touch text-sm w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">Valores separados por coma. Aparecen en el selector de cantidad al mantener presionado un producto.</p>
                  </div>

                  {/* WhatsApp Fonnte */}
                  <div className="border-t border-slate-700 pt-3 mt-3 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.whatsapp_enabled}
                        onChange={(e) => setForm({ ...form, whatsapp_enabled: e.target.checked })}
                        className="w-5 h-5 accent-iados-primary rounded"
                      />
                      <div>
                        <span className="text-sm font-medium">Alertas WhatsApp (Fonnte)</span>
                        <p className="text-xs text-slate-500">Envía alerta cuando algún producto baje del stock mínimo al hacer una venta</p>
                      </div>
                    </label>
                    {form.whatsapp_enabled && (
                      <div className="ml-8 space-y-2">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Teléfono destino (con código de país)</label>
                          <input
                            type="text"
                            value={form.whatsapp_phone}
                            onChange={(e) => setForm({ ...form, whatsapp_phone: e.target.value })}
                            placeholder="521XXXXXXXXXX"
                            className="input-touch text-sm w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Token de Fonnte</label>
                          <input
                            type="text"
                            value={form.whatsapp_token}
                            onChange={(e) => setForm({ ...form, whatsapp_token: e.target.value })}
                            placeholder="Pega aquí tu token de Fonnte"
                            className="input-touch text-sm w-full"
                          />
                        </div>
                        <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400 space-y-1">
                          <p className="font-medium text-slate-300">Cómo configurar Fonnte (gratis, 3 min):</p>
                          <p>1. Regístrate en <span className="text-white font-mono">fonnte.com</span></p>
                          <p>2. Ve a <span className="text-white">Device → Add Device</span> y escanea el QR con tu WhatsApp</p>
                          <p>3. Ve a <span className="text-white">Token</span> en el menú y copia tu token</p>
                          <p>4. Pégalo aquí arriba. Gratis hasta 100 mensajes/día</p>
                        </div>
                      </div>
                    )}
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

                      {/* Self Order QR */}
                      <div className="border-t border-slate-700 pt-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.self_order_enabled}
                            onChange={(e) => setForm({ ...form, self_order_enabled: e.target.checked })}
                            className="w-5 h-5 accent-iados-primary rounded mt-0.5"
                          />
                          <div>
                            <span className="text-sm font-medium flex items-center gap-1">
                              <QrCode size={14} className="text-iados-secondary" /> Self Order (Pedido por QR)
                            </span>
                            <p className="text-xs text-slate-500 mt-0.5">
                              El cliente escanea el QR de su mesa y hace su pedido desde el celular. El mesero confirma.
                            </p>
                            {form.self_order_enabled && (
                              <div className="mt-3 space-y-1">
                                <label className="text-xs font-medium text-slate-400">URL base para QR de mesas</label>
                                <input
                                  type="url"
                                  value={form.self_order_url}
                                  onChange={(e) => setForm({ ...form, self_order_url: e.target.value })}
                                  placeholder={`${window.location.origin} (dejar vacío = usar URL actual)`}
                                  className="input-touch text-xs"
                                />
                                <p className="text-xs text-slate-500">
                                  WiFi local: <code>http://192.168.X.X:3000</code> &nbsp;|&nbsp;
                                  Internet (Worker): <code>https://pos-iados-relay.workers.dev</code>
                                </p>
                                {mdCfgForm.worker_url && !form.self_order_url && (
                                  <button
                                    type="button"
                                    onClick={() => setForm({ ...form, self_order_url: mdCfgForm.worker_url })}
                                    className="text-xs text-green-400 hover:underline mt-1 block"
                                  >
                                    ↑ Usar Worker URL del Menú Digital
                                  </button>
                                )}
                                {selected && (
                                  <button onClick={() => navigate('/admin/mesas')} className="text-xs text-iados-secondary hover:underline mt-1 block text-left">
                                    Ir a Gestión de Mesas para imprimir QR →
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </label>
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

              {/* Seccion: Pasarelas de Pago */}
              <SectionHeader id="pagos" icon={CreditCard} title="Pasarelas de Pago" />
              {expandedSection === 'pagos' && (
                <div className="card space-y-4">
                  <p className="text-xs text-slate-400">Conecta MercadoPago o Stripe para cobrar con QR o terminal físico. Las claves se almacenan cifradas por tienda.</p>

                  {/* MercadoPago */}
                  <div className="border border-blue-600/30 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm flex items-center gap-2 text-blue-300"><Wifi size={15} /> MercadoPago</h4>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input type="checkbox" checked={gwForm.mp_qr_habilitado || false} onChange={e => setGwForm({ ...gwForm, mp_qr_habilitado: e.target.checked })} className="w-4 h-4 rounded" />
                          QR
                        </label>
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input type="checkbox" checked={gwForm.mp_point_habilitado || false} onChange={e => setGwForm({ ...gwForm, mp_point_habilitado: e.target.checked })} className="w-4 h-4 rounded" />
                          Point
                        </label>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <div>
                        <label className="text-xs text-slate-400">Access Token</label>
                        <div className="relative">
                          <input
                            type={gwShowMpToken ? 'text' : 'password'}
                            value={gwForm.mp_access_token || ''}
                            onChange={e => setGwForm({ ...gwForm, mp_access_token: e.target.value })}
                            placeholder="APP_USR-xxxxx..."
                            className="input-touch pr-10 text-xs"
                          />
                          <button onClick={() => setGwShowMpToken(!gwShowMpToken)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400">
                            {gwShowMpToken ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">Public Key</label>
                        <input type="text" value={gwForm.mp_public_key || ''} onChange={e => setGwForm({ ...gwForm, mp_public_key: e.target.value })} placeholder="APP_USR-xxxxx..." className="input-touch text-xs" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-400">User ID (Collector)</label>
                          <input type="text" value={gwForm.mp_user_id || ''} onChange={e => setGwForm({ ...gwForm, mp_user_id: e.target.value })} placeholder="123456789" className="input-touch text-xs" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">Point Device ID</label>
                          <input type="text" value={gwForm.mp_point_device_id || ''} onChange={e => setGwForm({ ...gwForm, mp_point_device_id: e.target.value })} placeholder="PAX_A910__..." className="input-touch text-xs" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">Comisión MP % (info, no se descuenta automáticamente)</label>
                        <input type="number" step="0.01" value={gwForm.comision_mp_porcentaje ?? 3.49} onChange={e => setGwForm({ ...gwForm, comision_mp_porcentaje: e.target.value })} className="input-touch text-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Stripe */}
                  <div className="border border-purple-600/30 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm flex items-center gap-2 text-purple-300"><CreditCard size={15} /> Stripe</h4>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input type="checkbox" checked={gwForm.stripe_habilitado || false} onChange={e => setGwForm({ ...gwForm, stripe_habilitado: e.target.checked })} className="w-4 h-4 rounded" />
                        Habilitado
                      </label>
                    </div>
                    <div className="grid gap-2">
                      <div>
                        <label className="text-xs text-slate-400">Secret Key</label>
                        <div className="relative">
                          <input
                            type={gwShowStripeKey ? 'text' : 'password'}
                            value={gwForm.stripe_secret_key || ''}
                            onChange={e => setGwForm({ ...gwForm, stripe_secret_key: e.target.value })}
                            placeholder="sk_live_xxxx... o sk_test_xxxx..."
                            className="input-touch pr-10 text-xs"
                          />
                          <button onClick={() => setGwShowStripeKey(!gwShowStripeKey)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400">
                            {gwShowStripeKey ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">Publishable Key</label>
                        <input type="text" value={gwForm.stripe_publishable_key || ''} onChange={e => setGwForm({ ...gwForm, stripe_publishable_key: e.target.value })} placeholder="pk_live_xxxx..." className="input-touch text-xs" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">Comisión Stripe % (info)</label>
                        <input type="number" step="0.01" value={gwForm.comision_stripe_porcentaje ?? 3.6} onChange={e => setGwForm({ ...gwForm, comision_stripe_porcentaje: e.target.value })} className="input-touch text-xs" />
                      </div>
                    </div>
                  </div>

                  {/* General options */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={gwForm.confirmacion_automatica ?? true} onChange={e => setGwForm({ ...gwForm, confirmacion_automatica: e.target.checked })} className="w-5 h-5 rounded" />
                    <span className="text-sm">Confirmación automática (polling cada 3s)</span>
                  </label>
                  <p className="text-xs text-slate-500">Si se desactiva, el cajero confirmará manualmente el pago del gateway.</p>

                  <button onClick={saveGwConfig} disabled={gwSaving} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                    <Save size={16} /> {gwSaving ? 'Guardando...' : 'Guardar Configuración de Pagos'}
                  </button>
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
      </div>}

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
