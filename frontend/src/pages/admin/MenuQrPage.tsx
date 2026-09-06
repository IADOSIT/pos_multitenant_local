import { useState, useEffect, useCallback, useRef } from 'react';
import { tiendasApi, menuDigitalApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/auth.store';
import { useAdminContextStore } from '../../store/adminContext.store';
import { usePageHeader } from '../../store/pageHeader.store';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import {
  QrCode, Globe, Save, RefreshCw, Loader2, AlertTriangle, Check, X,
  Clock, ExternalLink, Key, Printer, Store,
} from 'lucide-react';

// Pantalla propia del Menú Digital QR. Vivía como una sección plegada dentro de
// Configuración, donde competía con impresoras/pasarelas/báscula y se perdía; es
// un módulo de cara al cliente (publicar el menú, imprimir el QR, atender los
// pedidos que entran por él) y merece su propia entrada en el sidebar.

// Worker URL toma prioridad sobre cloud_url para el QR del menú.
function getMenuUrl(cloudUrl: string, slug: string, workerUrl?: string): string {
  if (workerUrl) return `${workerUrl.replace(/\/$/, '')}/menu/${slug}`;
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(cloudUrl || '');
  const base = isLocal ? window.location.origin : (cloudUrl || '').replace(/\/$/, '');
  return `${base}/menu/${slug}`;
}

const PLANTILLAS = [
  { key: 'oscuro', label: 'Oscuro', bg: '#0d0d0d', accent: '#f59e0b' },
  { key: 'claro',  label: 'Claro',  bg: '#f4f4f5', accent: '#ea580c' },
  { key: 'mar',    label: 'Mar',    bg: '#061628', accent: '#06b6d4' },
] as const;

export default function MenuQrPage() {
  const { user } = useAuthStore();
  const { viewAs } = useAdminContextStore();

  const [tiendas, setTiendas] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [mdStatus, setMdStatus]       = useState<any>(null);
  const [mdLogs, setMdLogs]           = useState<any[]>([]);
  const [mdPublishing, setMdPublishing] = useState(false);
  const [mdQr, setMdQr]               = useState<string>('');
  const [mdCfgForm, setMdCfgForm]     = useState<any>({});
  const [mdOrders, setMdOrders]       = useState<any[]>([]);
  const [mdOrdersLoading, setMdOrdersLoading] = useState(false);

  // El form vive en estado pero publish/auto-sync se disparan desde callbacks que
  // no deben re-crearse en cada tecla: se lee por ref para no arrastrar closures viejos.
  const cfgRef = useRef<any>({});
  cfgRef.current = mdCfgForm;

  usePageHeader({
    title: 'Menú Digital QR',
    subtitle: selected?.nombre ? `Menú público de ${selected.nombre}` : 'Menú público para clientes',
    icon: QrCode,
  });

  // ── Carga de tiendas ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await tiendasApi.list();
        setTiendas(data || []);
        const preferidaId = viewAs?.tienda_id ?? user?.tienda_id;
        const inicial = (data || []).find((t: any) => t.id === preferidaId) || (data || [])[0] || null;
        setSelected(inicial);
      } catch { toast.error('Error al cargar tiendas'); }
      finally { setLoading(false); }
    })();
  }, [viewAs?.tienda_id, user?.tienda_id]);

  // ── Estado del menú digital ───────────────────────────────────────────────
  const loadMdOrders = useCallback(async (tiendaId: number) => {
    setMdOrdersLoading(true);
    try {
      const { data } = await menuDigitalApi.getPendingOrders(tiendaId);
      setMdOrders(data || []);
    } catch {
      setMdOrders([]);
    } finally {
      setMdOrdersLoading(false);
    }
  }, []);

  const publicar = useCallback(async (tiendaId: number, silent = false) => {
    setMdPublishing(true);
    try {
      // Guardar config actual antes de publicar para asegurar worker_url/slug actualizados
      await menuDigitalApi.updateConfig(tiendaId, cfgRef.current);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        cantidades_enabled: status.config?.cantidades_enabled ?? false,
        cantidades_rapidas: status.config?.cantidades_rapidas ?? '10,25,50,100',
      });
      // Generate QR if has slug + any URL (worker or cloud)
      if (status.config?.slug && (status.config?.worker_url || status.config?.cloud_url)) {
        const menuUrl = getMenuUrl(status.config.cloud_url || '', status.config.slug, status.config.worker_url);
        setMdQr(await QRCode.toDataURL(menuUrl, { width: 200, margin: 2 }));
      } else {
        setMdQr('');
      }
      // Auto-sync check
      if (status.should_auto_sync) publicar(tiendaId, true);
      if (status.config?.modo_menu === 'pedidos') loadMdOrders(tiendaId);
      else setMdOrders([]);
    } catch {}
  }, [loadMdOrders, publicar]);

  useEffect(() => {
    if (selected?.id) loadMenuDigital(selected.id);
  }, [selected?.id, loadMenuDigital]);

  // ── Acciones ──────────────────────────────────────────────────────────────
  const guardarConfig = async () => {
    if (!selected?.id) return;
    try {
      await menuDigitalApi.updateConfig(selected.id, mdCfgForm);
      toast.success('Configuracion del menu guardada');
      loadMenuDigital(selected.id);
    } catch { toast.error('Error al guardar configuracion del menu'); }
  };

  const regenerarKey = async () => {
    if (!selected?.id) return;
    if (!confirm('¿Regenerar API key? Los enlaces activos dejarán de funcionar hasta publicar de nuevo.')) return;
    try {
      await menuDigitalApi.regenerateKey(selected.id);
      toast.success('API key regenerada');
      loadMenuDigital(selected.id);
    } catch { toast.error('Error al regenerar key'); }
  };

  const accionPedido = async (orderId: number, status: 'received' | 'cancelled') => {
    if (!selected?.id) return;
    try {
      await menuDigitalApi.updateOrder(orderId, status, selected.id);
      toast.success(status === 'received' ? 'Pedido confirmado' : 'Pedido rechazado');
      loadMdOrders(selected.id);
    } catch { toast.error('Error al actualizar el pedido'); }
  };

  const imprimirQr = () => {
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
  };

  if (loading) {
    return (
      <div className="p-6 text-slate-400 flex items-center gap-2">
        <Loader2 size={16} className="animate-spin" /> Cargando…
      </div>
    );
  }

  if (!selected) {
    return <div className="p-6 text-slate-400 text-sm">No hay tiendas disponibles para configurar el menú digital.</div>;
  }

  const menuUrl = getMenuUrl(mdCfgForm.cloud_url || '', mdCfgForm.slug || '', mdCfgForm.worker_url);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Selector de tienda (solo si hay más de una) */}
      {tiendas.length > 1 && (
        <div className="card flex items-center gap-3">
          <Store size={16} className="text-slate-400 shrink-0" />
          <label className="text-xs text-slate-400 shrink-0">Tienda</label>
          <select
            value={selected?.id ?? ''}
            onChange={(e) => setSelected(tiendas.find((t) => t.id === Number(e.target.value)) || null)}
            className="input-touch text-sm max-w-xs"
          >
            {tiendas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>
      )}

      {mdStatus?.over_limit && (
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl px-4 py-3 text-xs text-amber-300 flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>
            Se desactivó automáticamente: esta tienda tiene <strong>{mdStatus.productos_count}</strong> productos activos,
            arriba del límite de {mdStatus.productos_limit} de Menú Digital. Esta pantalla está pensada para menús tipo
            restaurante (decenas/cientos de productos), no para un catálogo/inventario completo — no la actives para esta tienda.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        {/* ── Columna izquierda: configuración ──────────────────────────── */}
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
              placeholder="https://pos-iados-relay.axel-muniz.workers.dev"
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
                {menuUrl.replace(/\/menu\/.*/, '')}/menu/<span className="text-iados-accent">{mdCfgForm.slug}</span>
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

          {/* Pedido por cantidades mayores — mismo gesto que el POS: dejar
              presionado un producto abre el selector con los atajos. */}
          {mdCfgForm.modo_menu === 'pedidos' && (
            <div className="rounded-xl border border-slate-700 p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-sm mb-1">Pedir por cantidades mayores</h4>
                  <p className="text-xs" style={{ color: 'rgb(var(--c-text-sub))' }}>
                    El cliente deja presionado un producto y elige cuantas piezas quiere, igual que en el POS. Sin esto solo puede sumar de uno en uno.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={mdCfgForm.cantidades_enabled ?? false}
                    onChange={e => setMdCfgForm({ ...mdCfgForm, cantidades_enabled: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-checked:bg-iados-secondary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>
              {mdCfgForm.cantidades_enabled && (
                <div className="mt-3">
                  <label className="text-xs text-slate-400 mb-1 block">Botones de cantidad rapida</label>
                  <input
                    type="text"
                    value={mdCfgForm.cantidades_rapidas ?? ''}
                    onChange={e => setMdCfgForm({ ...mdCfgForm, cantidades_rapidas: e.target.value })}
                    placeholder="10,25,50,100"
                    className="input-touch text-sm w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Valores separados por coma. Se aplican al publicar el menu.</p>
                </div>
              )}
            </div>
          )}

          {/* Plantilla visual del menu */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Plantilla visual del menu</label>
            <div className="grid grid-cols-3 gap-2">
              {PLANTILLAS.map(tpl => {
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
            <button onClick={guardarConfig} className="btn-secondary text-xs flex-1 flex items-center justify-center gap-1">
              <Save size={14} /> Guardar config
            </button>
            <button
              onClick={() => publicar(selected.id)}
              disabled={mdPublishing || (!mdCfgForm.cloud_url && !mdCfgForm.worker_url)}
              className="btn-primary text-xs flex-1 flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {mdPublishing
                ? <><Loader2 size={14} className="animate-spin" /> Publicando...</>
                : <><RefreshCw size={14} /> Publicar Menu</>}
            </button>
          </div>
        </div>

        {/* ── Columna derecha: QR, estado y pedidos ─────────────────────── */}
        <div className="space-y-4">
          {/* QR + enlace */}
          {mdQr && (
            <div className="card flex gap-4 items-center">
              <div className="bg-white p-2 rounded-xl flex-shrink-0">
                <img src={mdQr} alt="QR Menu" className="w-28 h-28" />
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <p className="text-xs text-slate-400">Comparte este QR con tus clientes</p>
                <code className="text-xs text-iados-accent break-all block">{menuUrl}</code>
                <a
                  href={menuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-iados-accent flex items-center gap-1 transition-colors"
                >
                  <ExternalLink size={11} /> Abrir menu en navegador
                </a>
                <button
                  onClick={imprimirQr}
                  className="text-xs px-2 py-1 rounded-lg bg-iados-primary text-white hover:opacity-80 flex items-center gap-1 transition-colors"
                >
                  <Printer size={11} /> Imprimir QR con pasos
                </button>
              </div>
            </div>
          )}

          {/* Estado actual */}
          {mdStatus?.config && (
            <div className="card space-y-2">
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

          {/* Pedidos pendientes (solo si modo_menu = pedidos) */}
          {mdCfgForm.modo_menu === 'pedidos' && (
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-bold text-slate-400">Pedidos pendientes</h5>
                <button
                  onClick={() => selected?.id && loadMdOrders(selected.id)}
                  className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1"
                >
                  <RefreshCw size={11} className={mdOrdersLoading ? 'animate-spin' : ''} /> Actualizar
                </button>
              </div>
              {mdOrders.length === 0 ? (
                <p className="text-xs text-slate-600">No hay pedidos esperando confirmación.</p>
              ) : (
                <div className="space-y-2">
                  {mdOrders.map((o: any) => (
                    <div key={o.id} className="p-3 rounded-xl border border-amber-700/30 bg-amber-900/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white">#{o.numero_orden}</span>
                        <span className="text-xs text-amber-300">${Number(o.total).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">
                        {o.cliente_nombre || 'Sin nombre'}{o.mesa_numero ? ` · Mesa/Ref: ${o.mesa_numero}` : ''} · {(o.items || []).length} producto{(o.items || []).length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => accionPedido(o.id, 'received')}
                          className="flex-1 text-xs py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold flex items-center justify-center gap-1"
                        >
                          <Check size={12} /> Confirmar
                        </button>
                        <button
                          onClick={() => accionPedido(o.id, 'cancelled')}
                          className="flex-1 text-xs py-1.5 rounded-lg bg-slate-700 hover:bg-red-900/50 text-slate-300 hover:text-red-300 font-semibold flex items-center justify-center gap-1"
                        >
                          <X size={12} /> Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* API Key */}
          {mdStatus?.config?.api_key && (
            <div className="card">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400 flex items-center gap-1"><Key size={11} /> API Key</label>
                <button onClick={regenerarKey} className="text-xs text-slate-500 hover:text-red-400 transition-colors">
                  Regenerar
                </button>
              </div>
              <code className="text-xs text-slate-600 break-all block">{mdStatus.config.api_key}</code>
            </div>
          )}

          {/* Historial de publicaciones */}
          {mdLogs.length > 0 && (
            <div className="card">
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
      </div>
    </div>
  );
}
