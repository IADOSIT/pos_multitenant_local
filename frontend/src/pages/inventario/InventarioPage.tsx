import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createColumnHelper, ColumnDef } from '@tanstack/react-table';
import { inventarioApi, transferenciasApi, tiendasApi, empresasApi } from '../../api/endpoints';
import { resolveUploadUrl } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { formatMonto, MonedaConfig } from '../../utils/moneda';
import toast from 'react-hot-toast';
import DataGrid from '../../components/ui/DataGrid';
import {
  Warehouse, Search, Plus, ArrowDownToLine, ArrowUpFromLine, RefreshCw,
  Download, Upload, FileSpreadsheet, AlertTriangle, X, ChevronDown, Printer,
  Send, Inbox, CheckCircle2, XCircle, Building2, Clock, Layers, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Producto = {
  id: number; sku: string; nombre: string; stock_actual: number;
  stock_minimo: number; controla_stock: boolean; unidad: string;
  costo: number; precio: number; imagen_url?: string;
};

type Movimiento = {
  id: number; producto_nombre: string; producto_sku: string;
  tipo: string; cantidad: number; stock_anterior: number;
  stock_nuevo: number; concepto: string; usuario_nombre: string;
  created_at: string;
};

type Transferencia = {
  id: number; folio: string;
  tienda_origen_id: number; tienda_origen_nombre: string;
  tienda_destino_id: number; tienda_destino_nombre: string;
  producto_id: number; producto_nombre: string; producto_sku: string;
  cantidad: number; notas: string; estado: 'pendiente' | 'recibido' | 'cancelado';
  usuario_envio_nombre: string; usuario_recibio_nombre: string;
  created_at: string; recibido_at: string;
};

type VistaGeneralTienda = { id: number; nombre: string };
type VistaGeneralItem = {
  id: number; sku: string; nombre: string; stock_minimo: number; unidad: string; precio: number;
  stock_total: number; por_tienda: { tienda_id: number; tienda_nombre: string; stock: number; precio: number }[];
  categoria_id: number; categoria_nombre: string;
};
type VistaGeneralOrden = 'nombre' | 'stock_desc' | 'stock_asc';

const TRANSF_ESTADO_LABEL: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-yellow-400' },
  recibido: { label: 'Recibido', color: 'text-green-400' },
  cancelado: { label: 'Cancelado', color: 'text-red-400' },
};

const TIPOS = [
  { value: 'entrada', label: 'Entrada', icon: ArrowDownToLine, color: 'text-green-400' },
  { value: 'salida', label: 'Salida', icon: ArrowUpFromLine, color: 'text-red-400' },
  { value: 'ajuste', label: 'Ajuste', icon: RefreshCw, color: 'text-yellow-400' },
];

import { usePageHeader } from '../../store/pageHeader.store';

export default function InventarioPage() {
  usePageHeader({ title: 'Inventario', subtitle: 'Existencias y movimientos de stock' });
  const { user } = useAuthStore();
  const isAdmin = user && ['superadmin', 'admin', 'manager'].includes(user.rol);
  const [tab, setTab] = useState<'stock' | 'movimientos' | 'transferencias' | 'general' | 'grafica'>('stock');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState<Producto | null>(null);
  const [movForm, setMovForm] = useState({ producto_id: 0, tipo: 'entrada', cantidad: '', concepto: '' });
  const [importResult, setImportResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Inventario compartido / transferencias — config de la empresa
  const [inventarioCompartido, setInventarioCompartido] = useState(false);
  const [transferenciasActivo, setTransferenciasActivo] = useState(false);
  const [moneda, setMoneda] = useState<MonedaConfig | undefined>(undefined);
  const [tiendasEmpresa, setTiendasEmpresa] = useState<{ id: number; nombre: string }[]>([]);
  // Todas las tiendas de la empresa (incluye la propia) para el selector de la pestana Stock:
  // admin/manager/superadmin pueden ver/operar el stock de cualquier sucursal de su empresa
  // desde la misma cuenta, ya que su tienda_id de usuario es fija.
  const [tiendasEmpresaTodas, setTiendasEmpresaTodas] = useState<{ id: number; nombre: string }[]>([]);
  const [tiendaStockId, setTiendaStockId] = useState<number | undefined>(undefined);

  // Transferencias directas entre tiendas
  const [pendientesRecibir, setPendientesRecibir] = useState<Transferencia[]>([]);
  const [enviadas, setEnviadas] = useState<Transferencia[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({ tienda_destino_id: 0, producto_id: 0, cantidad: '', notas: '' });
  const [transferSaving, setTransferSaving] = useState(false);

  // Vista general (total empresa + desglose por tienda)
  const [vistaGeneral, setVistaGeneral] = useState<VistaGeneralItem[]>([]);
  const [vistaGeneralTiendas, setVistaGeneralTiendas] = useState<VistaGeneralTienda[]>([]);
  const [searchGeneral, setSearchGeneral] = useState('');
  const [ordenGeneral, setOrdenGeneral] = useState<VistaGeneralOrden>('nombre');

  // Agregado por tienda para la pestaña Grafica: cuantos SKUs distintos tienen
  // stock > 0 y cuantas unidades totales suma cada tienda, a partir de la misma
  // data de vistaGeneral (evita pedirle otro endpoint al backend).
  const graficaData = (() => {
    const map = new Map<number, { tienda_id: number; nombre: string; skus: number; unidades: number }>();
    for (const item of vistaGeneral) {
      for (const pt of item.por_tienda) {
        const entry = map.get(pt.tienda_id) || { tienda_id: pt.tienda_id, nombre: pt.tienda_nombre, skus: 0, unidades: 0 };
        if (pt.stock > 0) entry.skus += 1;
        entry.unidades += pt.stock;
        map.set(pt.tienda_id, entry);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  })();

  useEffect(() => {
    if (!user?.empresa_id) return;
    empresasApi.get(user.empresa_id).then(({ data }) => {
      const cfg = data?.config_especial || {};
      setInventarioCompartido(cfg.inventario_compartido === true);
      setTransferenciasActivo(cfg.transferencias_activo === true);
      setMoneda(cfg.moneda?.activa ? cfg.moneda : undefined);
    }).catch(() => {});
    tiendasApi.list().then(({ data }) => {
      const propias = (data || []).filter((t: any) => t.empresa_id === user.empresa_id);
      setTiendasEmpresa(propias.filter((t: any) => t.id !== user.tienda_id));
      setTiendasEmpresaTodas(propias);
    }).catch(() => {});
    setTiendaStockId(user.tienda_id);
  }, [user?.empresa_id]);

  useEffect(() => { load(); }, [tab]);

  // Recargar el stock cuando el admin cambia la tienda seleccionada en el selector.
  useEffect(() => {
    if (tab === 'stock') load();
  }, [tiendaStockId]);

  // Precargar el conteo de pendientes por recibir para el badge de la pestaña, sin esperar a que se abra.
  useEffect(() => {
    if (transferenciasActivo && tab !== 'transferencias') {
      transferenciasApi.pendientesRecibir().then(({ data }) => setPendientesRecibir(data || [])).catch(() => {});
    }
  }, [transferenciasActivo]);

  const loadTransferencias = async () => {
    setLoading(true);
    try {
      const [pend, env] = await Promise.all([transferenciasApi.pendientesRecibir(), transferenciasApi.enviadas()]);
      setPendientesRecibir(pend.data || []);
      setEnviadas(env.data || []);
    } catch { toast.error('Error al cargar transferencias'); }
    setLoading(false);
  };

  const loadVistaGeneral = async () => {
    setLoading(true);
    try {
      const { data } = await inventarioApi.vistaGeneral();
      setVistaGeneral(data?.productos || []);
      setVistaGeneralTiendas(data?.tiendas || []);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al cargar vista general'); }
    setLoading(false);
  };

  const filteredGeneral = vistaGeneral
    .filter(item => item.nombre.toLowerCase().includes(searchGeneral.toLowerCase()) || item.sku?.toLowerCase().includes(searchGeneral.toLowerCase()))
    .sort((a, b) => {
      if (ordenGeneral === 'stock_desc') return b.stock_total - a.stock_total;
      if (ordenGeneral === 'stock_asc') return a.stock_total - b.stock_total;
      return 0; // 'nombre': ya viene ordenado del backend (orden de catalogo + nombre)
    });

  const abrirTransferModal = (producto_id?: number) => {
    setTransferForm({ tienda_destino_id: tiendasEmpresa[0]?.id || 0, producto_id: producto_id || 0, cantidad: '', notas: '' });
    setShowTransferModal(true);
  };

  const handleCrearTransferencia = async () => {
    if (!transferForm.tienda_destino_id || !transferForm.producto_id || !transferForm.cantidad) {
      toast.error('Completa los campos'); return;
    }
    setTransferSaving(true);
    try {
      const { data } = await transferenciasApi.crear({
        tienda_destino_id: transferForm.tienda_destino_id,
        producto_id: transferForm.producto_id,
        cantidad: parseFloat(transferForm.cantidad),
        notas: transferForm.notas || undefined,
      });
      toast.success(`Transferencia ${data.folio} creada`);
      setShowTransferModal(false);
      loadTransferencias();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al crear transferencia');
    } finally {
      setTransferSaving(false);
    }
  };

  const handleRecibirTransferencia = async (id: number) => {
    try {
      await transferenciasApi.recibir(id);
      toast.success('Transferencia recibida — stock actualizado');
      loadTransferencias();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al recibir'); }
  };

  const handleCancelarTransferencia = async (id: number) => {
    const motivo = prompt('Motivo de la cancelacion:');
    if (!motivo) return;
    try {
      await transferenciasApi.cancelar(id, motivo);
      toast.success('Transferencia cancelada — stock devuelto');
      loadTransferencias();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al cancelar'); }
  };

  const load = async () => {
    if (tab === 'transferencias') { loadTransferencias(); return; }
    if (tab === 'general' || tab === 'grafica') { loadVistaGeneral(); return; }
    setLoading(true);
    try {
      if (tab === 'stock') {
        const { data } = await inventarioApi.listStock(isAdmin ? tiendaStockId : undefined);
        setProductos(data);
      } else {
        const { data } = await inventarioApi.listMovimientos();
        setMovimientos(data);
      }
    } catch { toast.error('Error al cargar datos'); }
    setLoading(false);
  };

  const filtered = tab === 'stock'
    ? productos.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
    : movimientos.filter(m => m.producto_nombre.toLowerCase().includes(search.toLowerCase()) || m.producto_sku?.toLowerCase().includes(search.toLowerCase()));

  const handleMovimiento = async () => {
    if (!movForm.producto_id || !movForm.cantidad) { toast.error('Completa los campos'); return; }
    try {
      const { data } = await inventarioApi.registrarMovimiento({
        producto_id: movForm.producto_id,
        tipo: movForm.tipo,
        cantidad: parseFloat(movForm.cantidad),
        concepto: movForm.concepto || undefined,
        tienda_id: isAdmin ? tiendaStockId : undefined,
      });
      toast.success(`Stock actualizado: ${data.stock_actual}`);
      setShowModal(false);
      setMovForm({ producto_id: 0, tipo: 'entrada', cantidad: '', concepto: '' });
      window.dispatchEvent(new Event('inventario:changed'));
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error');
    }
  };

  const handleSettings = async (prod: Producto, data: { controla_stock?: boolean; stock_minimo?: number }) => {
    try {
      await inventarioApi.updateProducto(prod.id, data);
      toast.success('Configuracion actualizada');
      setShowSettingsModal(null);
      load();
    } catch { toast.error('Error al actualizar'); }
  };

  const handleCSVTemplate = async () => {
    try {
      const { data } = await inventarioApi.csvTemplate();
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a'); a.href = url; a.download = 'inventario_template.csv'; a.click();
    } catch { toast.error('Error al descargar plantilla'); }
  };

  const handleCSVExport = async () => {
    try {
      const { data } = await inventarioApi.csvExport(isAdmin ? tiendaStockId : undefined);
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a'); a.href = url; a.download = 'inventario_export.csv'; a.click();
      toast.success('Exportado');
    } catch { toast.error('Error al exportar'); }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data } = await inventarioApi.csvImport(file, isAdmin ? tiendaStockId : undefined);
      setImportResult(data);
      toast.success(`${data.success} de ${data.total} productos actualizados`);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al importar');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const openMovModal = (prod?: Producto) => {
    setMovForm({ producto_id: prod?.id || 0, tipo: 'entrada', cantidad: '', concepto: '' });
    setShowModal(true);
  };

  const stockColumnHelper = createColumnHelper<Producto>();
  const stockColumns = useMemo<ColumnDef<Producto, any>[]>(() => [
    stockColumnHelper.accessor('nombre', {
      header: 'Producto',
      cell: ({ row }) => {
        const p = row.original;
        const lowStock = p.controla_stock && p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo;
        return (
          <div className="flex items-center gap-2">
            {p.imagen_url ? (
              <img src={resolveUploadUrl(p.imagen_url)} alt="" className="w-8 h-8 rounded object-cover" />
            ) : (
              <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center text-xs text-slate-400">
                {p.nombre.charAt(0)}
              </div>
            )}
            <span className="font-medium">{p.nombre}</span>
            {lowStock && <AlertTriangle size={14} className="text-red-400" />}
          </div>
        );
      },
    }),
    stockColumnHelper.accessor('sku', { header: 'SKU', cell: ({ getValue }) => <span className="text-slate-400">{getValue()}</span> }),
    stockColumnHelper.accessor('stock_actual', {
      header: 'Stock',
      cell: ({ row }) => {
        const p = row.original;
        const lowStock = p.controla_stock && p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo;
        return <div className={`text-right font-bold ${lowStock ? 'text-red-400' : 'text-white'}`}>{p.stock_actual ?? 0} {p.unidad || 'pza'}</div>;
      },
    }),
    stockColumnHelper.accessor('stock_minimo', {
      header: 'Minimo',
      cell: ({ getValue }) => <div className="text-right text-slate-400">{getValue() ?? 0}</div>,
    }),
    stockColumnHelper.accessor('controla_stock', {
      header: 'Controla',
      cell: ({ getValue }) => (
        <div className="text-center">
          <span className={`text-xs px-2 py-0.5 rounded-full ${getValue() ? 'bg-green-900/30 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
            {getValue() ? 'Si' : 'No'}
          </span>
        </div>
      ),
    }),
    stockColumnHelper.accessor('costo', {
      header: 'Costo',
      cell: ({ getValue }) => <div className="text-right text-slate-400 whitespace-nowrap">{formatMonto(Number(getValue() || 0), moneda)}</div>,
    }),
    stockColumnHelper.accessor('precio', {
      header: 'Precio',
      cell: ({ getValue }) => <div className="text-right whitespace-nowrap">{formatMonto(Number(getValue() || 0), moneda)}</div>,
    }),
    stockColumnHelper.display({
      id: 'acciones',
      header: 'Acciones',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => openMovModal(row.original)} className="p-1.5 hover:bg-iados-primary/20 rounded-lg text-iados-primary" title="Registrar movimiento">
            <Plus size={16} />
          </button>
          <button onClick={() => setShowSettingsModal(row.original)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400" title="Config stock">
            <ChevronDown size={16} />
          </button>
        </div>
      ),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [moneda]);

  const generalColumnHelper = createColumnHelper<VistaGeneralItem>();
  const generalColumns = useMemo<ColumnDef<VistaGeneralItem, any>[]>(() => {
    const cols: ColumnDef<VistaGeneralItem, any>[] = [
      generalColumnHelper.accessor('nombre', { header: 'Producto' }),
      generalColumnHelper.accessor('sku', { header: 'SKU', cell: ({ getValue }) => <span className="text-slate-400">{getValue()}</span> }),
      generalColumnHelper.accessor('categoria_nombre', { header: 'Categoria' }),
      generalColumnHelper.accessor('stock_total', {
        header: 'Total',
        cell: ({ row }) => (
          <div className={`text-right font-bold whitespace-nowrap ${row.original.stock_total <= row.original.stock_minimo ? 'text-red-400' : ''}`}>
            {row.original.stock_total} {row.original.unidad}
          </div>
        ),
      }),
    ];
    vistaGeneralTiendas.forEach(t => {
      cols.push(
        generalColumnHelper.display({
          id: `tienda_${t.id}`,
          header: t.nombre,
          enableSorting: false,
          cell: ({ row }) => {
            const pt = row.original.por_tienda.find(x => x.tienda_id === t.id);
            return (
              <div className="text-right whitespace-nowrap">
                <span className="font-semibold">{pt?.stock ?? 0}</span>
                <span className="text-xs text-slate-400 ml-1.5">{formatMonto(pt?.precio ?? 0, moneda)}</span>
              </div>
            );
          },
        }),
      );
    });
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vistaGeneralTiendas, moneda]);

  const handlePrintReport = () => {
    const now = new Date();
    const fecha = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const w = 32; // chars for 58mm paper

    const line = '-'.repeat(w);
    const center = (s: string) => s.padStart(Math.floor((w + s.length) / 2)).padEnd(w);

    let txt = '';
    txt += center('REPORTE INVENTARIO') + '\n';
    txt += center(`${fecha}  ${hora}`) + '\n';
    txt += line + '\n';

    if (tab === 'stock') {
      const list = filtered as Producto[];
      const lowItems = list.filter(p => p.controla_stock && p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo);

      if (lowItems.length > 0) {
        txt += center('!! STOCK BAJO !!') + '\n';
        txt += line + '\n';
        lowItems.forEach(p => {
          const nombre = p.nombre.substring(0, 20).padEnd(20);
          const stk = `${p.stock_actual}/${p.stock_minimo}`.padStart(w - 21);
          txt += `${nombre} ${stk}\n`;
        });
        txt += line + '\n';
      }

      txt += center('TODOS LOS PRODUCTOS') + '\n';
      txt += line + '\n';
      list.forEach(p => {
        const nombre = p.nombre.substring(0, 18).padEnd(18);
        const stk = String(p.stock_actual ?? 0).padStart(5);
        const min = p.stock_minimo > 0 ? `/${p.stock_minimo}` : '    ';
        const alerta = p.controla_stock && p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo ? '*' : ' ';
        txt += `${alerta}${nombre} ${stk}${min}\n`;
      });
      txt += line + '\n';
      txt += `Total productos: ${list.length}\n`;
      if (lowItems.length > 0) txt += `Stock bajo: ${lowItems.length}\n`;
    } else {
      const list = filtered as Movimiento[];
      txt += center('MOVIMIENTOS') + '\n';
      txt += line + '\n';
      list.slice(0, 30).forEach(m => {
        const signo = m.tipo === 'entrada' || m.tipo === 'devolucion' ? '+' : m.tipo === 'salida' ? '-' : '=';
        const nombre = m.producto_nombre.substring(0, 16).padEnd(16);
        const cant = `${signo}${m.cantidad}`.padStart(6);
        const stk = `${m.stock_anterior}→${m.stock_nuevo}`.padStart(w - 23);
        txt += `${nombre}${cant} ${stk}\n`;
      });
      if (list.length > 30) txt += `  ... y ${list.length - 30} mas\n`;
      txt += line + '\n';
      txt += `Total: ${list.length} movimientos\n`;
    }

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;';
    document.body.appendChild(iframe);
    const html = `<!DOCTYPE html><html><head>
<style>
  @page { size: 58mm auto; margin: 0; }
  body { margin: 0; padding: 2mm; font-family: 'Courier New', monospace; font-size: 9pt; line-height: 1.25; width: 58mm; }
  pre { margin: 0; white-space: pre-wrap; word-break: break-all; font-family: inherit; font-size: inherit; }
</style></head><body><pre>${txt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`;
    iframe.contentDocument!.open();
    iframe.contentDocument!.write(html);
    iframe.contentDocument!.close();
    setTimeout(() => {
      iframe.contentWindow!.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {(tab === 'stock' || tab === 'movimientos') && (
            <>
              {isAdmin && (
                <>
                  <button onClick={handleCSVTemplate} className="btn-secondary text-sm flex items-center gap-1">
                    <FileSpreadsheet size={16} /> Plantilla CSV
                  </button>
                  <button onClick={handleCSVExport} className="btn-secondary text-sm flex items-center gap-1">
                    <Download size={16} /> Exportar
                  </button>
                  <label className="btn-secondary text-sm flex items-center gap-1 cursor-pointer">
                    <Upload size={16} /> Importar
                    <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
                  </label>
                </>
              )}
              <button onClick={handlePrintReport} className="btn-secondary text-sm flex items-center gap-1">
                <Printer size={16} /> Imprimir
              </button>
              <button onClick={() => openMovModal()} className="btn-primary text-sm flex items-center gap-1">
                <Plus size={16} /> Movimiento
              </button>
            </>
          )}
          {tab === 'transferencias' && (
            <button onClick={() => abrirTransferModal()} className="btn-primary text-sm flex items-center gap-1">
              <Send size={16} /> Nueva transferencia
            </button>
          )}
        </div>
      </div>

      {/* Import result */}
      {importResult && (
        <div className="bg-iados-card rounded-xl p-4 mb-4 border border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Resultado importacion</span>
            <button onClick={() => setImportResult(null)}><X size={16} /></button>
          </div>
          <p className="text-sm text-slate-300">
            Exitosos: <span className="text-green-400 font-bold">{importResult.success}</span> / {importResult.total}
          </p>
          {importResult.errors?.length > 0 && (
            <div className="mt-2 max-h-32 overflow-y-auto text-xs text-red-400">
              {importResult.errors.map((e: any, i: number) => (
                <div key={i}>Fila {e.fila}: {e.error}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex bg-iados-card rounded-xl p-1">
          <button onClick={() => setTab('stock')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'stock' ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white'}`}>
            Stock
          </button>
          <button onClick={() => setTab('movimientos')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'movimientos' ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white'}`}>
            Movimientos
          </button>
          {transferenciasActivo && (
            <button onClick={() => setTab('transferencias')} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${tab === 'transferencias' ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white'}`}>
              <Send size={14} /> Transferencias
              {pendientesRecibir.length > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendientesRecibir.length}</span>
              )}
            </button>
          )}
          {inventarioCompartido && isAdmin && (
            <button onClick={() => setTab('general')} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${tab === 'general' ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white'}`}>
              <Layers size={14} /> General
            </button>
          )}
          {inventarioCompartido && isAdmin && (
            <button onClick={() => setTab('grafica')} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${tab === 'grafica' ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white'}`}>
              <BarChart3 size={14} /> Grafica
            </button>
          )}
        </div>
        {tab === 'stock' && isAdmin && inventarioCompartido && tiendasEmpresaTodas.length > 1 && (
          <select
            value={tiendaStockId ?? ''} onChange={e => setTiendaStockId(parseInt(e.target.value, 10))}
            className="px-3 py-2 bg-iados-card rounded-xl border border-slate-700 focus:border-iados-primary outline-none text-sm text-slate-300"
          >
            {tiendasEmpresaTodas.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}{t.id === user?.tienda_id ? ' (tu tienda)' : ''}</option>
            ))}
          </select>
        )}
        {(tab === 'stock' || tab === 'movimientos') && (
          <div className="relative flex-1 w-full sm:w-auto">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full pl-10 pr-4 py-2 bg-iados-card rounded-xl border border-slate-700 focus:border-iados-primary outline-none text-sm"
            />
          </div>
        )}
        {tab === 'general' && (
          <>
            <div className="relative flex-1 w-full sm:w-auto">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchGeneral} onChange={e => setSearchGeneral(e.target.value)}
                placeholder="Buscar producto o SKU..."
                className="w-full pl-10 pr-4 py-2 bg-iados-card rounded-xl border border-slate-700 focus:border-iados-primary outline-none text-sm"
              />
            </div>
            <select
              value={ordenGeneral} onChange={e => setOrdenGeneral(e.target.value as VistaGeneralOrden)}
              className="px-3 py-2 bg-iados-card rounded-xl border border-slate-700 focus:border-iados-primary outline-none text-sm text-slate-300"
            >
              <option value="nombre">Ordenar: catalogo</option>
              <option value="stock_desc">Ordenar: stock total (mayor a menor)</option>
              <option value="stock_asc">Ordenar: stock total (menor a mayor)</option>
            </select>
          </>
        )}
        <button onClick={load} className="p-2 text-slate-400 hover:text-white"><RefreshCw size={18} /></button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Cargando...</div>
      ) : tab === 'stock' ? (
        <div className="overflow-x-auto">
          {inventarioCompartido && (
            <div className="mb-3 inline-flex items-center gap-1.5 text-xs text-slate-400 bg-iados-card px-3 py-1.5 rounded-lg border border-slate-700">
              <Layers size={12} />
              Mostrando stock de: <span className="text-white font-semibold">
                {tiendasEmpresaTodas.find(t => t.id === (isAdmin ? tiendaStockId : user?.tienda_id))?.nombre || 'tu tienda'}
              </span>
            </div>
          )}
          <DataGrid
            key={search}
            data={filtered as Producto[]}
            columns={stockColumns}
            rowClassName={p => (p.controla_stock && p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo ? 'bg-red-900/10' : '')}
            emptyMessage="No se encontraron productos"
          />
        </div>
      ) : tab === 'movimientos' ? (
        <div className="space-y-2">
          {(filtered as Movimiento[]).map(m => (
            <div key={m.id} className="bg-iados-card rounded-xl p-4 flex items-center gap-4">
              <div className={`p-2 rounded-lg ${
                m.tipo === 'entrada' ? 'bg-green-900/30' : m.tipo === 'salida' ? 'bg-red-900/30' : m.tipo === 'devolucion' ? 'bg-blue-900/30' : 'bg-yellow-900/30'
              }`}>
                {m.tipo === 'entrada' ? <ArrowDownToLine size={20} className="text-green-400" /> :
                 m.tipo === 'salida' ? <ArrowUpFromLine size={20} className="text-red-400" /> :
                 <RefreshCw size={20} className="text-yellow-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{m.producto_nombre}</div>
                <div className="text-xs text-slate-400">{m.producto_sku} - {m.concepto || m.tipo}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${m.tipo === 'entrada' || m.tipo === 'devolucion' ? 'text-green-400' : m.tipo === 'salida' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {m.tipo === 'entrada' || m.tipo === 'devolucion' ? '+' : m.tipo === 'salida' ? '-' : '='}{m.cantidad}
                </div>
                <div className="text-xs text-slate-500">{m.stock_anterior} → {m.stock_nuevo}</div>
              </div>
              <div className="text-right text-xs text-slate-500 hidden sm:block">
                <div>{m.usuario_nombre}</div>
                <div>{new Date(m.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
          {(filtered as Movimiento[]).length === 0 && (
            <div className="text-center py-12 text-slate-500">No hay movimientos registrados</div>
          )}
        </div>
      ) : tab === 'transferencias' ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Inbox size={16} /> Pendientes por recibir
            </h3>
            <div className="space-y-2">
              {pendientesRecibir.map(t => (
                <div key={t.id} className="bg-iados-card rounded-xl p-4 flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-yellow-900/30">
                    <Clock size={20} className="text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{t.producto_nombre} <span className="text-slate-500 text-xs">x{t.cantidad}</span></div>
                    <div className="text-xs text-slate-400">Folio {t.folio} · Desde {t.tienda_origen_nombre}</div>
                    {t.notas && <div className="text-xs text-slate-500 mt-0.5">{t.notas}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleRecibirTransferencia(t.id)} className="btn-primary text-xs flex items-center gap-1 px-3 py-1.5">
                      <CheckCircle2 size={14} /> Recibir
                    </button>
                  </div>
                </div>
              ))}
              {pendientesRecibir.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">No hay transferencias pendientes por recibir</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Send size={16} /> Enviadas
            </h3>
            <div className="space-y-2">
              {enviadas.map(t => (
                <div key={t.id} className="bg-iados-card rounded-xl p-4 flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-slate-700/50">
                    <Building2 size={20} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{t.producto_nombre} <span className="text-slate-500 text-xs">x{t.cantidad}</span></div>
                    <div className="text-xs text-slate-400">Folio {t.folio} · A {t.tienda_destino_nombre}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-semibold ${TRANSF_ESTADO_LABEL[t.estado]?.color}`}>
                      {TRANSF_ESTADO_LABEL[t.estado]?.label}
                    </div>
                    <div className="text-xs text-slate-500">{new Date(t.created_at).toLocaleString()}</div>
                  </div>
                  {t.estado === 'pendiente' && (
                    <button onClick={() => handleCancelarTransferencia(t.id)} className="text-red-400 hover:text-red-300 p-1.5" title="Cancelar">
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
              ))}
              {enviadas.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">No has enviado transferencias</div>
              )}
            </div>
          </div>
        </div>
      ) : tab === 'general' ? (
        <DataGrid
          key={`${searchGeneral}-${ordenGeneral}-${vistaGeneralTiendas.length}`}
          data={filteredGeneral}
          columns={generalColumns}
          emptyMessage={vistaGeneral.length === 0 ? 'No hay productos con inventario compartido' : 'Sin resultados para tu busqueda'}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-iados-card rounded-2xl border border-slate-700 p-5">
              <h3 className="font-semibold text-sm mb-1">Productos con stock por tienda</h3>
              <p className="text-xs text-slate-400 mb-4">Cuantos SKUs distintos tienen existencia mayor a 0 en cada tienda.</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={graficaData} margin={{ top: 4, right: 8, left: -12, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="nombre" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#e2e8f0' }} />
                  <Bar dataKey="skus" name="Productos con stock" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-iados-card rounded-2xl border border-slate-700 p-5">
              <h3 className="font-semibold text-sm mb-1">Unidades totales en stock por tienda</h3>
              <p className="text-xs text-slate-400 mb-4">Suma de existencias de todos los productos (todas las unidades) en cada tienda.</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={graficaData} margin={{ top: 4, right: 8, left: -12, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="nombre" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#e2e8f0' }} />
                  <Bar dataKey="unidades" name="Unidades en stock" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {graficaData.length === 0 && (
            <div className="text-center py-12 text-slate-500">No hay productos con inventario compartido para graficar</div>
          )}
        </div>
      )}

      {/* Modal: Nueva Transferencia */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowTransferModal(false)}>
          <div className="bg-iados-surface rounded-2xl p-6 w-full max-w-md mx-4 border border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Nueva transferencia</h3>
              <button onClick={() => setShowTransferModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Tienda destino</label>
                <select
                  value={transferForm.tienda_destino_id}
                  onChange={e => setTransferForm({ ...transferForm, tienda_destino_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-iados-card rounded-lg border border-slate-700 outline-none focus:border-iados-primary"
                >
                  <option value={0}>Selecciona una tienda</option>
                  {tiendasEmpresa.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Producto</label>
                <select
                  value={transferForm.producto_id}
                  onChange={e => setTransferForm({ ...transferForm, producto_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-iados-card rounded-lg border border-slate-700 outline-none focus:border-iados-primary"
                >
                  <option value={0}>Selecciona un producto</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Cantidad</label>
                <input
                  type="number" min="0" step="0.01"
                  value={transferForm.cantidad}
                  onChange={e => setTransferForm({ ...transferForm, cantidad: e.target.value })}
                  className="w-full px-3 py-2 bg-iados-card rounded-lg border border-slate-700 outline-none focus:border-iados-primary"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Notas (opcional)</label>
                <input
                  value={transferForm.notas}
                  onChange={e => setTransferForm({ ...transferForm, notas: e.target.value })}
                  className="w-full px-3 py-2 bg-iados-card rounded-lg border border-slate-700 outline-none focus:border-iados-primary"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowTransferModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleCrearTransferencia} disabled={transferSaving} className="btn-primary flex-1 disabled:opacity-50">
                {transferSaving ? 'Enviando...' : 'Crear transferencia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Movimiento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowModal(false)}>
          <div className="bg-iados-surface rounded-2xl p-6 w-full max-w-md mx-4 border border-slate-700" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Registrar Movimiento</h3>

            <label className="block text-sm text-slate-400 mb-1">Producto</label>
            <select
              value={movForm.producto_id}
              onChange={e => setMovForm({ ...movForm, producto_id: Number(e.target.value) })}
              className="w-full mb-3 p-2.5 bg-iados-card rounded-xl border border-slate-700 outline-none text-sm"
            >
              <option value={0}>Seleccionar producto...</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>
              ))}
            </select>

            <label className="block text-sm text-slate-400 mb-1">Tipo</label>
            <div className="flex gap-2 mb-3">
              {TIPOS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setMovForm({ ...movForm, tipo: t.value })}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-medium transition ${
                    movForm.tipo === t.value ? 'bg-iados-primary text-white' : 'bg-iados-card border border-slate-700 text-slate-400'
                  }`}
                >
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>

            <label className="block text-sm text-slate-400 mb-1">
              {movForm.tipo === 'ajuste' ? 'Stock final' : 'Cantidad'}
            </label>
            <input
              type="number" min="0" step="0.01"
              value={movForm.cantidad}
              onChange={e => setMovForm({ ...movForm, cantidad: e.target.value })}
              className="w-full mb-3 p-2.5 bg-iados-card rounded-xl border border-slate-700 outline-none text-sm"
              placeholder={movForm.tipo === 'ajuste' ? 'Nuevo stock total' : 'Cantidad'}
            />

            <label className="block text-sm text-slate-400 mb-1">Concepto (opcional)</label>
            <input
              value={movForm.concepto}
              onChange={e => setMovForm({ ...movForm, concepto: e.target.value })}
              className="w-full mb-4 p-2.5 bg-iados-card rounded-xl border border-slate-700 outline-none text-sm"
              placeholder="Ej: Compra proveedor, merma, etc."
            />

            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-iados-card rounded-xl text-slate-400 hover:text-white">
                Cancelar
              </button>
              <button onClick={handleMovimiento} className="flex-1 py-2.5 bg-iados-primary rounded-xl text-white font-medium hover:bg-iados-primary/80">
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Settings stock */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowSettingsModal(null)}>
          <div className="bg-iados-surface rounded-2xl p-6 w-full max-w-sm mx-4 border border-slate-700" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Config: {showSettingsModal.nombre}</h3>

            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={showSettingsModal.controla_stock}
                onChange={e => setShowSettingsModal({ ...showSettingsModal, controla_stock: e.target.checked })}
                className="w-5 h-5 accent-iados-primary"
              />
              <span className="text-sm">Controla stock</span>
            </label>

            <label className="block text-sm text-slate-400 mb-1">Stock minimo (alerta)</label>
            <input
              type="number" min="0"
              value={showSettingsModal.stock_minimo ?? 0}
              onChange={e => setShowSettingsModal({ ...showSettingsModal, stock_minimo: Number(e.target.value) })}
              className="w-full mb-4 p-2.5 bg-iados-card rounded-xl border border-slate-700 outline-none text-sm"
            />

            <div className="flex gap-2">
              <button onClick={() => setShowSettingsModal(null)} className="flex-1 py-2.5 bg-iados-card rounded-xl text-slate-400">
                Cancelar
              </button>
              <button
                onClick={() => handleSettings(showSettingsModal, {
                  controla_stock: showSettingsModal.controla_stock,
                  stock_minimo: showSettingsModal.stock_minimo,
                })}
                className="flex-1 py-2.5 bg-iados-primary rounded-xl text-white font-medium"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
