import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Snowflake, AlertTriangle, Plus, Minus, RefreshCw, X, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.store';
import { perfilesApi } from '../../api/endpoints';
import { inventarioApi } from '../../api/endpoints';

interface StockItem {
  id: number;
  sku: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  controla_stock: boolean;
  unidad: string;
  costo: number;
  precio: number;
  modulo?: string;
}

interface MovimientoForm {
  producto_id: number;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  concepto: string;
  modulo: string;
}

const MODULOS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  carbon: { label: 'Carbón', color: '#374151', bg: 'bg-gray-700', border: 'border-gray-600', icon: Flame },
  hielo:  { label: 'Hielo',  color: '#0ea5e9', bg: 'bg-sky-900',  border: 'border-sky-600',  icon: Snowflake },
};

function getStockStatus(item: StockItem): 'ok' | 'bajo' | 'critico' {
  if (!item.controla_stock) return 'ok';
  const actual = Number(item.stock_actual);
  const minimo = Number(item.stock_minimo);
  if (!minimo || minimo <= 0) return 'ok';
  if (actual <= minimo) return 'critico';
  if (actual <= minimo * 2) return 'bajo';
  return 'ok';
}

const STATUS_CLASSES = {
  ok:      'bg-green-900/30 text-green-400 border-green-700',
  bajo:    'bg-yellow-900/30 text-yellow-400 border-yellow-600',
  critico: 'bg-red-900/40 text-red-400 border-red-600',
};

export default function InventarioDualPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [stockCarbon, setStockCarbon] = useState<StockItem[]>([]);
  const [stockHielo, setStockHielo] = useState<StockItem[]>([]);
  const [alertas, setAlertas] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlertasModal, setShowAlertasModal] = useState(false);
  const [showMovModal, setShowMovModal] = useState(false);
  const [movForm, setMovForm] = useState<MovimientoForm>({
    producto_id: 0,
    tipo: 'entrada',
    cantidad: 1,
    concepto: '',
    modulo: 'carbon',
  });
  const [saving, setSaving] = useState(false);

  const isAdmin = ['superadmin', 'admin', 'manager'].includes(user?.rol || '');
  const userModulo = user?.modulo;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resCarbon, resHielo, resAlertas] = await Promise.allSettled([
        perfilesApi.stockPorModulo('carbon'),
        perfilesApi.stockPorModulo('hielo'),
        perfilesApi.alertasStock(),
      ]);
      if (resCarbon.status === 'fulfilled') setStockCarbon(resCarbon.value.data || []);
      if (resHielo.status === 'fulfilled') setStockHielo(resHielo.value.data || []);
      if (resAlertas.status === 'fulfilled') setAlertas(resAlertas.value.data || []);
    } catch {
      toast.error('Error cargando inventario');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openMovModal = (modulo: string, producto?: StockItem) => {
    setMovForm({
      producto_id: producto?.id || 0,
      tipo: 'entrada',
      cantidad: 1,
      concepto: '',
      modulo,
    });
    setShowMovModal(true);
  };

  const handleSaveMovimiento = async () => {
    if (!movForm.producto_id || movForm.cantidad <= 0) {
      toast.error('Selecciona un producto y una cantidad válida');
      return;
    }
    setSaving(true);
    try {
      await inventarioApi.registrarMovimiento({
        producto_id: movForm.producto_id,
        tipo: movForm.tipo,
        cantidad: movForm.cantidad,
        concepto: movForm.concepto || undefined,
      });
      toast.success('Movimiento registrado');
      setShowMovModal(false);
      loadData();
    } catch {
      toast.error('Error al registrar movimiento');
    } finally {
      setSaving(false);
    }
  };

  const criticalCount = alertas.length;
  const productsForModulo = movForm.modulo === 'carbon' ? stockCarbon : stockHielo;

  const renderModuloColumn = (modulo: string, items: StockItem[]) => {
    const cfg = MODULOS_CONFIG[modulo];
    const Icon = cfg.icon;
    const criticos = items.filter((i) => getStockStatus(i) === 'critico');
    const canEdit = isAdmin;

    if (!isAdmin && userModulo && userModulo !== modulo) return null;

    return (
      <div className={`flex-1 rounded-xl border ${cfg.border} bg-iados-card overflow-hidden`}>
        {/* Header del módulo */}
        <div className={`px-4 py-3 flex items-center justify-between ${cfg.bg}`}>
          <div className="flex items-center gap-2">
            <Icon size={20} style={{ color: cfg.color }} />
            <span className="font-bold text-sm">{cfg.label}</span>
            <span className="text-slate-400 text-xs">({items.length} productos)</span>
          </div>
          <div className="flex items-center gap-2">
            {criticos.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse font-bold">
                ⚠ {criticos.length}
              </span>
            )}
            {canEdit && (
              <button
                onClick={() => openMovModal(modulo)}
                className="bg-iados-primary text-white text-xs px-2 py-1 rounded-lg hover:opacity-80 flex items-center gap-1"
              >
                <Plus size={12} /> Movimiento
              </button>
            )}
          </div>
        </div>

        {/* Lista de productos */}
        <div className="overflow-y-auto max-h-[420px]">
          {items.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">Sin productos en este módulo</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-iados-surface">
                <tr className="text-slate-400 text-xs">
                  <th className="px-3 py-2 text-left">Producto</th>
                  <th className="px-3 py-2 text-right">Stock</th>
                  <th className="px-3 py-2 text-right">Mín.</th>
                  <th className="px-3 py-2 text-center">Estado</th>
                  {canEdit && <th className="px-3 py-2 text-center">Acc.</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id} className="border-t border-slate-700/40 hover:bg-iados-surface/50">
                      <td className="px-3 py-2">
                        <div className="font-medium text-xs">{item.nombre}</div>
                        <div className="text-slate-500 text-[10px]">{item.sku}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm font-bold">
                        {Number(item.stock_actual).toFixed(0)} <span className="text-slate-500 text-xs">{item.unidad}</span>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-400 text-xs">
                        {Number(item.stock_minimo).toFixed(0)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {item.controla_stock ? (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_CLASSES[status]}`}>
                            {status === 'ok' ? 'OK' : status === 'bajo' ? 'Bajo' : 'Crítico'}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px]">—</span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => { setMovForm({ producto_id: item.id, tipo: 'entrada', cantidad: 1, concepto: '', modulo }); setShowMovModal(true); }}
                              className="w-6 h-6 rounded bg-green-700/30 text-green-400 hover:bg-green-700/60 flex items-center justify-center"
                              title="Entrada"
                            >
                              <Plus size={12} />
                            </button>
                            <button
                              onClick={() => { setMovForm({ producto_id: item.id, tipo: 'salida', cantidad: 1, concepto: '', modulo }); setShowMovModal(true); }}
                              className="w-6 h-6 rounded bg-red-700/30 text-red-400 hover:bg-red-700/60 flex items-center justify-center"
                              title="Salida"
                            >
                              <Minus size={12} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Inventario Carbón + Hielo</h1>
          <span className="bg-iados-primary/20 text-iados-primary text-xs px-2 py-0.5 rounded-full border border-iados-primary/30">
            Perfil Activo
          </span>
        </div>
        <button onClick={loadData} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-iados-card">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Banner alerta global */}
      {criticalCount > 0 && (
        <button
          onClick={() => setShowAlertasModal(true)}
          className="w-full flex items-center gap-3 bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-left hover:bg-red-900/50 transition-colors"
        >
          <AlertTriangle size={18} className="text-red-400 animate-pulse shrink-0" />
          <span className="text-red-300 font-medium text-sm">
            ⚠ {criticalCount} producto{criticalCount !== 1 ? 's' : ''} con stock crítico
          </span>
          <span className="ml-auto text-red-400 text-xs underline">Ver detalle</span>
        </button>
      )}

      {/* Columnas duales */}
      <div className="flex gap-4 flex-col md:flex-row">
        {renderModuloColumn('carbon', stockCarbon)}
        {renderModuloColumn('hielo', stockHielo)}
      </div>

      {/* Modal alertas */}
      {showAlertasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-iados-surface rounded-2xl w-full max-w-lg border border-slate-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <TrendingDown size={18} className="text-red-400" />
                <h2 className="font-bold">Productos con Stock Crítico</h2>
              </div>
              <button onClick={() => setShowAlertasModal(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {alertas.map((a) => {
                const cfg = MODULOS_CONFIG[a.modulo || 'carbon'];
                const Icon = cfg?.icon || Flame;
                return (
                  <div key={a.id} className="flex items-center gap-3 bg-iados-card rounded-lg px-3 py-2">
                    <Icon size={16} style={{ color: cfg?.color }} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{a.nombre}</div>
                      <div className="text-xs text-slate-500">{a.sku}</div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-red-400 font-bold">{Number(a.stock_actual).toFixed(0)} {a.unidad}</div>
                      <div className="text-slate-500">mín: {Number(a.stock_minimo).toFixed(0)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-3 border-t border-slate-700 flex justify-end">
              <button onClick={() => setShowAlertasModal(false)} className="bg-iados-primary text-white px-4 py-2 rounded-lg text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal movimiento */}
      {showMovModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-iados-surface rounded-2xl w-full max-w-md border border-slate-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="font-bold">Registrar Movimiento</h2>
              <button onClick={() => setShowMovModal(false)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Módulo */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Módulo</label>
                <div className="flex gap-2">
                  {['carbon', 'hielo'].map((m) => {
                    const cfg = MODULOS_CONFIG[m];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={m}
                        onClick={() => setMovForm((f) => ({ ...f, modulo: m, producto_id: 0 }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          movForm.modulo === m ? `${cfg.bg} ${cfg.border} text-white` : 'border-slate-600 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <Icon size={14} /> {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Producto */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Producto</label>
                <select
                  value={movForm.producto_id}
                  onChange={(e) => setMovForm((f) => ({ ...f, producto_id: Number(e.target.value) }))}
                  className="w-full bg-iados-card border border-slate-600 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={0}>— Seleccionar —</option>
                  {productsForModulo.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} (Stock: {Number(p.stock_actual).toFixed(0)} {p.unidad})</option>
                  ))}
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Tipo</label>
                <div className="flex gap-2">
                  {(['entrada', 'salida', 'ajuste'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setMovForm((f) => ({ ...f, tipo: t }))}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium capitalize transition-colors ${
                        movForm.tipo === t
                          ? t === 'entrada' ? 'bg-green-700 border-green-600 text-white'
                          : t === 'salida' ? 'bg-red-700 border-red-600 text-white'
                          : 'bg-amber-700 border-amber-600 text-white'
                          : 'border-slate-600 text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cantidad */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Cantidad</label>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={movForm.cantidad}
                  onChange={(e) => setMovForm((f) => ({ ...f, cantidad: Number(e.target.value) }))}
                  className="w-full bg-iados-card border border-slate-600 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Concepto */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Concepto (opcional)</label>
                <input
                  type="text"
                  value={movForm.concepto}
                  onChange={(e) => setMovForm((f) => ({ ...f, concepto: e.target.value }))}
                  placeholder="Ej: Compra, Merma, Ajuste..."
                  className="w-full bg-iados-card border border-slate-600 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-700 flex gap-2 justify-end">
              <button onClick={() => setShowMovModal(false)} className="px-4 py-2 rounded-lg border border-slate-600 text-sm text-slate-300">Cancelar</button>
              <button onClick={handleSaveMovimiento} disabled={saving} className="px-4 py-2 rounded-lg bg-iados-primary text-white text-sm disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
