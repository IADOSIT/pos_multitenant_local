import { useState, useEffect, useCallback } from 'react';
import { backupApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import {
  HardDrive, FileSpreadsheet, RefreshCw, Download, Trash2,
  Clock, CheckCircle, XCircle, UploadCloud, Settings, Play,
  Database, Folder, AlertTriangle, Eraser, RotateCcw, Link2Off,
} from 'lucide-react';

const HORAS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const RETENCIONES = [3, 7, 14, 30, 60, 90];

function fmtSize(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function fmtDate(d: string | Date) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

export default function MantenimientoPage() {
  const [config, setConfig] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [tab, setTab] = useState<'respaldos' | 'configuracion' | 'limpiar' | 'restaurar'>('respaldos');

  // Restaurar state
  const [selectedSqlFile, setSelectedSqlFile] = useState<string | null>(null);
  const [restaurarConfirmText, setRestaurarConfirmText] = useState('');
  const [restaurando, setRestaurando] = useState(false);

  // Limpiar demo state
  const [limpiarOpts, setLimpiarOpts] = useState({
    ventas: true, pedidos: true, caja: false, inventario: false, productos: false, categorias: false,
  });
  const [confirmText, setConfirmText] = useState('');
  const [limpiando, setLimpiando] = useState(false);
  const [resultadoLimpieza, setResultadoLimpieza] = useState<Record<string, number> | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, logsRes, filesRes] = await Promise.all([
        backupApi.getConfig(),
        backupApi.getLogs(),
        backupApi.listFiles(),
      ]);
      setConfig(cfgRes.data);
      setLogs(logsRes.data);
      setFiles(filesRes.data);
    } catch {
      toast.error('Error al cargar datos de respaldo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleEjecutar = async (tipo: 'db' | 'excel' | 'completo') => {
    setRunning(tipo);
    try {
      const { data } = await backupApi.ejecutar(tipo);
      const errores = data.filter((l: any) => l.estado === 'error');
      if (errores.length > 0) {
        toast.error(`Respaldo con errores: ${errores.map((e: any) => e.error_msg).join(', ')}`);
      } else {
        toast.success(`Respaldo completado (${data.length} archivo${data.length > 1 ? 's' : ''})`);
      }
      loadAll();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al ejecutar respaldo');
    } finally {
      setRunning(null);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const { data } = await backupApi.download(filename);
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al descargar archivo');
    }
  };

  const handleDelete = async (id: number, archivo: string) => {
    if (!confirm(`Eliminar respaldo ${archivo}?`)) return;
    try {
      await backupApi.deleteLog(id);
      toast.success('Respaldo eliminado');
      loadAll();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleSaveConfig = async () => {
    try {
      await backupApi.updateConfig(config);
      toast.success('Configuracion guardada');
    } catch {
      toast.error('Error al guardar configuracion');
    }
  };

  const handleLimpiar = async () => {
    if (confirmText !== 'LIMPIAR') return;
    if (!Object.values(limpiarOpts).some(Boolean)) { toast.error('Selecciona al menos una opcion'); return; }
    setLimpiando(true);
    setResultadoLimpieza(null);
    try {
      const { data } = await backupApi.limpiarDemo(limpiarOpts);
      setResultadoLimpieza(data);
      setConfirmText('');
      toast.success('Datos eliminados correctamente');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al limpiar datos');
    } finally {
      setLimpiando(false);
    }
  };

  const handleRestaurar = async () => {
    if (!selectedSqlFile || restaurarConfirmText !== 'RESTAURAR') return;
    setRestaurando(true);
    try {
      const { data } = await backupApi.restaurar(selectedSqlFile);
      toast.success(data.mensaje || 'Base de datos restaurada correctamente');
      setRestaurarConfirmText('');
      setSelectedSqlFile(null);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al restaurar la base de datos');
    } finally {
      setRestaurando(false);
    }
  };

  const ultimoOk = logs.find((l) => l.estado === 'ok');

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HardDrive size={24} /> Mantenimiento
        </h1>
        <button onClick={loadAll} disabled={loading} className="btn-secondary text-sm">
          <RefreshCw size={16} className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {/* Estado rápido */}
      {config && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card text-center">
            <p className="text-xs text-slate-400 mb-1">Ultimo respaldo</p>
            <p className="text-sm font-semibold">{fmtDate(config.ultimo_backup_at)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-slate-400 mb-1">Estado</p>
            <div className="flex items-center justify-center gap-1">
              {config.ultimo_backup_estado === 'ok'
                ? <CheckCircle size={16} className="text-green-400" />
                : <XCircle size={16} className="text-red-400" />}
              <span className={`text-sm font-semibold ${config.ultimo_backup_estado === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                {config.ultimo_backup_estado || '—'}
              </span>
            </div>
          </div>
          <div className="card text-center">
            <p className="text-xs text-slate-400 mb-1">Auto respaldo</p>
            <p className="text-sm font-semibold">
              {config.auto_backup_enabled ? `${config.auto_backup_hora} hrs` : 'Desactivado'}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-slate-400 mb-1">Archivos guardados</p>
            <p className="text-sm font-semibold">{files.length} ({config.retencion_dias} dias)</p>
          </div>
        </div>
      )}

      {/* Acciones manuales */}
      <div className="card mb-6">
        <h2 className="text-base font-bold mb-3 flex items-center gap-2"><Play size={16} /> Respaldo Manual</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleEjecutar('db')}
            disabled={!!running}
            className="btn-secondary flex items-center justify-center gap-2 py-3"
          >
            {running === 'db' ? <RefreshCw size={18} className="animate-spin" /> : <Database size={18} />}
            <div className="text-left">
              <p className="font-semibold text-sm">Respaldo BD</p>
              <p className="text-xs text-slate-400">Exporta .sql completo</p>
            </div>
          </button>

          <button
            onClick={() => handleEjecutar('excel')}
            disabled={!!running}
            className="btn-secondary flex items-center justify-center gap-2 py-3"
          >
            {running === 'excel' ? <RefreshCw size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
            <div className="text-left">
              <p className="font-semibold text-sm">Respaldo Excel</p>
              <p className="text-xs text-slate-400">Ventas, productos, inv.</p>
            </div>
          </button>

          <button
            onClick={() => handleEjecutar('completo')}
            disabled={!!running}
            className="btn-primary flex items-center justify-center gap-2 py-3"
          >
            {running === 'completo' ? <RefreshCw size={18} className="animate-spin" /> : <HardDrive size={18} />}
            <div className="text-left">
              <p className="font-semibold text-sm">Respaldo Completo</p>
              <p className="text-xs text-blue-200">BD + Excel juntos</p>
            </div>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('respaldos')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'respaldos' ? 'bg-iados-primary text-white' : 'bg-iados-card text-slate-400'}`}
        >
          Archivos ({files.length})
        </button>
        <button
          onClick={() => setTab('configuracion')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'configuracion' ? 'bg-iados-primary text-white' : 'bg-iados-card text-slate-400'}`}
        >
          <Settings size={14} className="inline mr-1" />Configuracion
        </button>
        <button
          onClick={() => { setTab('limpiar'); setResultadoLimpieza(null); setConfirmText(''); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'limpiar' ? 'bg-red-600 text-white' : 'bg-iados-card text-slate-400'}`}
        >
          <Eraser size={14} className="inline mr-1" />Limpiar Demo
        </button>
        <button
          onClick={() => { setTab('restaurar'); setSelectedSqlFile(null); setRestaurarConfirmText(''); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'restaurar' ? 'bg-orange-600 text-white' : 'bg-iados-card text-slate-400'}`}
        >
          <RotateCcw size={14} className="inline mr-1" />Restaurar BD
        </button>
      </div>

      {/* Tab: Archivos */}
      {tab === 'respaldos' && (
        <div className="card">
          {files.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <HardDrive size={40} className="mx-auto mb-2 opacity-30" />
              <p>No hay respaldos. Genera uno con los botones de arriba.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700">
                    <th className="pb-2 pr-4">Archivo</th>
                    <th className="pb-2 pr-4">Tipo</th>
                    <th className="pb-2 pr-4">Fecha</th>
                    <th className="pb-2 pr-4">Tamano</th>
                    <th className="pb-2 pr-4">OneDrive</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f, i) => {
                    const log = logs.find((l) => l.archivo === f.archivo);
                    const isDb = f.archivo.includes('-db-');
                    return (
                      <tr key={i} className="border-b border-slate-800 hover:bg-iados-card/50">
                        <td className="py-2 pr-4 font-mono text-xs text-slate-300">{f.archivo}</td>
                        <td className="py-2 pr-4">
                          {isDb
                            ? <span className="px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 text-xs flex items-center gap-1 w-fit"><Database size={11} />BD</span>
                            : <span className="px-2 py-0.5 rounded bg-green-900/50 text-green-300 text-xs flex items-center gap-1 w-fit"><FileSpreadsheet size={11} />Excel</span>
                          }
                        </td>
                        <td className="py-2 pr-4 text-slate-400 text-xs">{fmtDate(f.fecha)}</td>
                        <td className="py-2 pr-4 text-slate-400 text-xs">{fmtSize(f.tamano)}</td>
                        <td className="py-2 pr-4">
                          {log?.onedrive_copiado
                            ? <UploadCloud size={14} className="text-blue-400" />
                            : <span className="text-slate-600 text-xs">—</span>}
                        </td>
                        <td className="py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownload(f.archivo)}
                              className="p-1.5 rounded-lg hover:bg-iados-primary/20 text-slate-400 hover:text-white"
                              title="Descargar"
                            >
                              <Download size={15} />
                            </button>
                            {log && (
                              <button
                                onClick={() => handleDelete(log.id, f.archivo)}
                                className="p-1.5 rounded-lg hover:bg-red-900/30 text-slate-500 hover:text-red-400"
                                title="Eliminar"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Limpiar Demo */}
      {tab === 'limpiar' && (
        <div className="space-y-4">
          {/* Aviso */}
          <div className="flex gap-3 p-4 bg-red-900/30 border border-red-700/50 rounded-xl">
            <AlertTriangle size={22} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-300 text-sm">Accion irreversible</p>
              <p className="text-xs text-red-200/80 mt-0.5">
                Esta funcion elimina permanentemente los datos de transacciones seleccionados.
                Se recomienda generar un respaldo completo antes de continuar.
                La configuracion (usuarios, productos, categorias, tiendas) NO se elimina.
              </p>
            </div>
          </div>

          {/* Seleccion de datos */}
          <div className="card space-y-3">
            <h3 className="font-bold text-sm mb-1">Selecciona que datos eliminar:</h3>

            {([
              {
                key: 'ventas', label: 'Ventas', desc: 'Todas las ventas, detalles y pagos registrados',
                tablas: 'ventas, venta_detalles, venta_pagos', warn: false,
              },
              {
                key: 'pedidos', label: 'Pedidos', desc: 'Todos los pedidos y sus detalles',
                tablas: 'pedidos, pedido_detalles', warn: false,
              },
              {
                key: 'caja', label: 'Movimientos de Caja', desc: 'Historial de movimientos (la caja queda abierta con saldo inicial)',
                tablas: 'movimientos_caja', warn: false,
              },
              {
                key: 'inventario', label: 'Movimientos de Inventario', desc: 'Historial de entradas/salidas (el stock actual no cambia)',
                tablas: 'movimientos_inventario', warn: false,
              },
              {
                key: 'productos', label: 'Productos', desc: 'Elimina todos los productos y su asignacion a tiendas. Categorias se conservan.',
                tablas: 'productos, producto_tienda', warn: true,
              },
              {
                key: 'categorias', label: 'Categorias', desc: 'Elimina todas las categorias. Si hay productos vinculados, eliminalos primero.',
                tablas: 'categorias', warn: true,
              },
            ] as const).map(({ key, label, desc, tablas, warn }) => (
              <label key={key} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer ${warn ? 'bg-red-900/20 hover:bg-red-900/30' : 'bg-iados-card hover:bg-iados-card/80'}`}>
                <input
                  type="checkbox"
                  checked={limpiarOpts[key]}
                  onChange={(e) => setLimpiarOpts({ ...limpiarOpts, [key]: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-red-500"
                />
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    {label}
                    {warn && <span className="text-[10px] bg-red-600/80 text-white px-1.5 py-0.5 rounded font-medium">DESTRUCTIVO</span>}
                  </p>
                  <p className="text-xs text-slate-400">{desc}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5 font-mono">{tablas}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Resultado previo */}
          {resultadoLimpieza && (
            <div className="p-4 bg-green-900/20 border border-green-700/40 rounded-xl">
              <p className="font-bold text-green-400 text-sm mb-2 flex items-center gap-1">
                <CheckCircle size={15} /> Limpieza completada
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(resultadoLimpieza).map(([tabla, count]) => (
                  <div key={tabla} className="text-xs bg-iados-card rounded-lg px-3 py-2">
                    <span className="text-slate-400">{tabla}</span>
                    <span className="ml-2 font-bold text-white">{count} filas</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmacion */}
          <div className="card space-y-3">
            <p className="text-sm text-slate-300">
              Para confirmar, escribe <span className="font-mono font-bold text-red-400">LIMPIAR</span> en el campo:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escribe LIMPIAR para confirmar"
              className="input-touch text-center font-mono tracking-widest"
            />
            <button
              onClick={handleLimpiar}
              disabled={confirmText !== 'LIMPIAR' || limpiando || !Object.values(limpiarOpts).some(Boolean)}
              className="w-full py-3 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {limpiando
                ? <><RefreshCw size={16} className="animate-spin" /> Eliminando...</>
                : <><Eraser size={16} /> Eliminar datos seleccionados</>}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Restaurar BD */}
      {tab === 'restaurar' && (() => {
        const sqlFiles = files.filter((f) => f.archivo.endsWith('.sql'));
        return (
          <div className="space-y-4">
            {/* Aviso */}
            <div className="flex gap-3 p-4 bg-orange-900/30 border border-orange-700/50 rounded-xl">
              <AlertTriangle size={22} className="text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-orange-300 text-sm">Accion destructiva e irreversible</p>
                <p className="text-xs text-orange-200/80 mt-0.5">
                  Restaurar reemplaza TODA la base de datos con el contenido del archivo seleccionado.
                  Todos los datos actuales (ventas, pedidos, usuarios, productos) seran sobreescritos.
                  Genera un respaldo completo antes de continuar.
                </p>
              </div>
            </div>

            {/* Lista de archivos SQL */}
            <div className="card">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Database size={15} /> Selecciona un archivo de respaldo (.sql)
              </h3>
              {sqlFiles.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Database size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay archivos .sql disponibles.</p>
                  <p className="text-xs mt-1">Genera un Respaldo BD desde los botones de arriba.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sqlFiles.map((f) => (
                    <label
                      key={f.archivo}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${
                        selectedSqlFile === f.archivo
                          ? 'border-orange-500 bg-orange-900/20'
                          : 'border-slate-700 bg-iados-card hover:border-slate-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="sql-file"
                        value={f.archivo}
                        checked={selectedSqlFile === f.archivo}
                        onChange={() => { setSelectedSqlFile(f.archivo); setRestaurarConfirmText(''); }}
                        className="accent-orange-500"
                      />
                      <Database size={15} className="text-blue-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono text-slate-200 truncate">{f.archivo}</p>
                        <p className="text-xs text-slate-400">{fmtDate(f.fecha)} — {fmtSize(f.tamano)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmacion */}
            {selectedSqlFile && (
              <div className="card space-y-3">
                <p className="text-sm text-slate-300">
                  Restaurando: <span className="font-mono text-orange-300">{selectedSqlFile}</span>
                </p>
                <p className="text-sm text-slate-300">
                  Para confirmar, escribe <span className="font-mono font-bold text-orange-400">RESTAURAR</span> en el campo:
                </p>
                <input
                  type="text"
                  value={restaurarConfirmText}
                  onChange={(e) => setRestaurarConfirmText(e.target.value)}
                  placeholder="Escribe RESTAURAR para confirmar"
                  className="input-touch text-center font-mono tracking-widest"
                />
                <button
                  onClick={handleRestaurar}
                  disabled={restaurarConfirmText !== 'RESTAURAR' || restaurando}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {restaurando
                    ? <><RefreshCw size={16} className="animate-spin" /> Restaurando base de datos...</>
                    : <><RotateCcw size={16} /> Restaurar base de datos</>}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Tab: Configuracion */}
      {tab === 'configuracion' && config && (
        <div className="space-y-4">
          {/* Auto respaldo */}
          <div className="card space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Clock size={16} /> Respaldo Automatico</h3>

            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Activar respaldo automatico diario</p>
                <p className="text-xs text-slate-400">Se ejecuta una vez al dia a la hora configurada</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, auto_backup_enabled: !config.auto_backup_enabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${config.auto_backup_enabled ? 'bg-iados-primary' : 'bg-slate-600'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.auto_backup_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Hora del respaldo automatico</label>
                <select
                  value={config.auto_backup_hora}
                  onChange={(e) => setConfig({ ...config, auto_backup_hora: e.target.value })}
                  className="input-touch text-sm"
                  disabled={!config.auto_backup_enabled}
                >
                  {HORAS.map((h) => <option key={h} value={h}>{h} hrs</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Historico a conservar</label>
                <select
                  value={config.retencion_dias}
                  onChange={(e) => setConfig({ ...config, retencion_dias: Number(e.target.value) })}
                  className="input-touch text-sm"
                >
                  {RETENCIONES.map((d) => <option key={d} value={d}>{d} dias</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.incluir_db}
                  onChange={(e) => setConfig({ ...config, incluir_db: e.target.checked })}
                  className="w-4 h-4 accent-iados-primary"
                />
                <div>
                  <p className="text-sm">Incluir BD (.sql)</p>
                  <p className="text-xs text-slate-400">Respaldo completo de la base de datos</p>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.incluir_excel}
                  onChange={(e) => setConfig({ ...config, incluir_excel: e.target.checked })}
                  className="w-4 h-4 accent-iados-primary"
                />
                <div>
                  <p className="text-sm">Incluir Excel (.xlsx)</p>
                  <p className="text-xs text-slate-400">Ventas, productos e inventario</p>
                </div>
              </label>
            </div>
          </div>

          {/* OneDrive */}
          <div className="card space-y-4">
            <h3 className="font-bold flex items-center gap-2"><UploadCloud size={16} /> OneDrive / Carpeta de sincronizacion</h3>
            <p className="text-xs text-slate-400">
              Los respaldos se copian automaticamente a la carpeta de OneDrive sincronizada en este equipo.
              No se requiere configuracion adicional — solo especifica la ruta local de tu carpeta OneDrive.
            </p>

            <label className="flex items-center justify-between">
              <p className="text-sm font-medium">Activar copia a OneDrive</p>
              <button
                onClick={() => setConfig({ ...config, onedrive_enabled: !config.onedrive_enabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${config.onedrive_enabled ? 'bg-iados-primary' : 'bg-slate-600'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.onedrive_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </label>

            {config.onedrive_enabled && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1">
                  <Folder size={12} /> Ruta de la carpeta OneDrive en este equipo
                </label>
                <input
                  type="text"
                  value={config.onedrive_carpeta || ''}
                  onChange={(e) => setConfig({ ...config, onedrive_carpeta: e.target.value })}
                  placeholder="Ej: C:\Users\TuUsuario\OneDrive\POS-Respaldos"
                  className="input-touch text-sm font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">
                  La carpeta debe existir y estar sincronizada con OneDrive. Los archivos se copian automaticamente despues de cada respaldo.
                </p>
              </div>
            )}
          </div>

          <button onClick={handleSaveConfig} className="btn-primary w-full py-3">
            Guardar Configuracion
          </button>

          {/* Desvincular dispositivo */}
          <div className="card border-slate-700 space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2 text-slate-300">
              <Link2Off size={15} /> Dispositivo
            </h3>
            <p className="text-xs text-slate-400">
              Este dispositivo está registrado a la tienda con ID <span className="font-mono text-white">{localStorage.getItem('pos_tienda_id') || '—'}</span>.
              Al desvincular, la próxima pantalla de login pedirá credenciales de administrador para volver a registrar el dispositivo a una tienda.
            </p>
            <button
              onClick={() => {
                if (!confirm('¿Desvincular este dispositivo de la tienda actual? Se cerrará la sesión.')) return;
                localStorage.removeItem('pos_tienda_id');
                window.location.href = '/login';
              }}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-700/50 px-4 py-2 rounded-xl transition-colors"
            >
              <Link2Off size={15} /> Desvincular dispositivo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
