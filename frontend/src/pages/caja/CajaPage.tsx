import { useState, useEffect } from 'react';
import { usePOSStore } from '../../store/pos.store';
import { useAuthStore } from '../../store/auth.store';
import { cajaApi, tiendasApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, FileText, Lock } from 'lucide-react';
import PinConfirmModal from '../../components/ui/PinConfirmModal';

/** Hora actual en CDMX (America/Mexico_City) como objeto {h, m, s, diaNatural} */
function getCDMX() {
  const now = new Date();
  const cdmx = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  return {
    h: cdmx.getHours(),
    m: cdmx.getMinutes(),
    diaNatural: cdmx.toLocaleDateString('es-MX'),
  };
}

export default function CajaPage() {
  const { cajaActiva, setCajaActiva } = usePOSStore();
  const { user } = useAuthStore();
  const [fondo, setFondo] = useState('0');
  const [totalReal, setTotalReal] = useState('');
  const [movTipo, setMovTipo] = useState<'entrada' | 'salida'>('entrada');
  const [movMonto, setMovMonto] = useState('');
  const [movConcepto, setMovConcepto] = useState('');
  const [corteX, setCorteX] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPinCerrar, setShowPinCerrar] = useState(false);
  const [cajaAutoEnabled, setCajaAutoEnabled] = useState(false);
  const [cajaOcultarUi, setCajaOcultarUi] = useState(false);

  useEffect(() => {
    loadCaja();
    loadConfig();
  }, []);

  const loadConfig = async () => {
    if (!user?.tienda_id) return;
    try {
      const { data } = await tiendasApi.get(user.tienda_id);
      const cp = data?.config_pos || {};
      setCajaAutoEnabled(cp.caja_auto_enabled || false);
      setCajaOcultarUi(cp.caja_ocultar_ui || false);
    } catch {}
  };

  const loadCaja = async () => {
    try {
      const { data } = await cajaApi.activa();
      setCajaActiva(data);
    } catch { setCajaActiva(null); }
  };

  /** Abre la caja automáticamente con fondo $0 para el día natural CDMX */
  const abrirCajaAuto = async () => {
    const { diaNatural } = getCDMX();
    setLoading(true);
    try {
      const { data } = await cajaApi.abrir({ fondo: 0, nombre: `Caja-${diaNatural}` });
      setCajaActiva(data);
      toast.success('Caja abierta automáticamente');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al abrir caja');
    } finally { setLoading(false); }
  };

  const handleAbrir = async () => {
    if (cajaAutoEnabled) { await abrirCajaAuto(); return; }
    setLoading(true);
    try {
      const { data } = await cajaApi.abrir({ fondo: Number(fondo), nombre: `Caja-${new Date().toLocaleDateString('es-MX')}` });
      setCajaActiva(data);
      toast.success('Caja abierta');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al abrir caja');
    } finally { setLoading(false); }
  };

  const handleCerrar = async () => {
    if (!cajaActiva) return;
    setLoading(true);
    try {
      await cajaApi.cerrar(cajaActiva.id, { total_real: cajaAutoEnabled ? Number(cajaActiva.total_ventas) : Number(totalReal) });
      setCajaActiva(null);
      toast.success('Caja cerrada');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error');
    } finally { setLoading(false); }
  };

  const handleCerrarConPin = (_authUser: any) => {
    setShowPinCerrar(false);
    handleCerrar();
  };

  const handleMovimiento = async () => {
    if (!cajaActiva || !movMonto || !movConcepto) return;
    try {
      await cajaApi.movimiento(cajaActiva.id, { tipo: movTipo, monto: Number(movMonto), concepto: movConcepto });
      toast.success(`${movTipo === 'entrada' ? 'Entrada' : 'Salida'} registrada`);
      setMovMonto(''); setMovConcepto('');
      loadCaja();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleCorteX = async () => {
    if (!cajaActiva) return;
    try {
      const { data } = await cajaApi.corteX(cajaActiva.id);
      setCorteX(data);
    } catch { toast.error('Error al generar corte'); }
  };

  // Si caja_ocultar_ui está activo y hay caja activa, mostrar solo info mínima
  // Si no hay caja activa, mostrar botón de abrir (con o sin fondo)
  if (!cajaActiva) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="card max-w-md w-full text-center space-y-4">
          <Lock size={48} className="mx-auto text-slate-500" />
          <h2 className="text-2xl font-bold">Abrir Caja</h2>
          {cajaAutoEnabled ? (
            <>
              <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-3 text-sm text-blue-300">
                <p className="font-medium">Caja automática activa</p>
                <p className="text-xs text-slate-400 mt-1">Se abrirá con fondo $0.00 — hora CDMX: {getCDMX().diaNatural}</p>
              </div>
              <button onClick={handleAbrir} disabled={loading} className="btn-success w-full text-lg">
                {loading ? 'Abriendo...' : 'Abrir Caja del Día'}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Fondo de apertura</label>
                <input type="number" value={fondo} onChange={(e) => setFondo(e.target.value)} className="input-touch text-center text-2xl" />
              </div>
              <button onClick={handleAbrir} disabled={loading} className="btn-success w-full text-lg">
                {loading ? 'Abriendo...' : 'Abrir Caja'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Si está configurado para ocultar UI, mostrar vista compacta
  if (cajaOcultarUi) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="card max-w-md w-full text-center space-y-4">
          <DollarSign size={40} className="mx-auto text-green-400" />
          <h2 className="font-bold text-lg">{cajaActiva.nombre}</h2>
          <span className="text-xs bg-green-600 px-2 py-1 rounded-lg">ABIERTA</span>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-iados-card p-3 rounded-xl text-center">
              <p className="text-xs text-slate-400">Ventas del día</p>
              <p className="text-xl font-bold text-green-400">${Number(cajaActiva.total_ventas).toFixed(2)}</p>
            </div>
            <div className="bg-iados-card p-3 rounded-xl text-center">
              <p className="text-xs text-slate-400">Apertura</p>
              <p className="text-sm">{new Date(cajaActiva.fecha_apertura).toLocaleTimeString('es-MX')}</p>
            </div>
          </div>
          <button onClick={handleCorteX} className="btn-secondary w-full text-sm"><FileText size={16} className="inline mr-1" />Corte X</button>
        </div>
        {corteX && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setCorteX(null)}>
            <div className="card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4 text-center">Corte X</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(corteX.resumen).map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-400">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold">{typeof val === 'number' ? `$${val.toFixed(2)}` : String(val)}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setCorteX(null)} className="btn-secondary w-full mt-4">Cerrar</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <div className="card">
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <DollarSign className="text-green-400" /> {cajaActiva.nombre}
          <span className="text-sm bg-green-600 px-2 py-1 rounded-lg ml-auto">ABIERTA</span>
          {cajaAutoEnabled && <span className="text-xs bg-blue-700/50 text-blue-300 px-2 py-1 rounded-lg">AUTO</span>}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-iados-card p-3 rounded-xl text-center">
            <p className="text-xs text-slate-400">Fondo</p>
            <p className="text-lg font-bold">${Number(cajaActiva.fondo_apertura).toFixed(2)}</p>
          </div>
          <div className="bg-iados-card p-3 rounded-xl text-center">
            <p className="text-xs text-slate-400">Ventas</p>
            <p className="text-lg font-bold text-green-400">${Number(cajaActiva.total_ventas).toFixed(2)}</p>
          </div>
          <div className="bg-iados-card p-3 rounded-xl text-center">
            <p className="text-xs text-slate-400">Apertura</p>
            <p className="text-sm">{new Date(cajaActiva.fecha_apertura).toLocaleTimeString('es-MX')}</p>
          </div>
          <div>
            <button onClick={handleCorteX} className="btn-secondary w-full mb-1 text-sm"><FileText size={16} className="inline mr-1" />Corte X</button>
          </div>
        </div>
      </div>

      {/* Movimientos */}
      <div className="card">
        <h3 className="font-bold mb-3">Registrar Movimiento</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => setMovTipo('entrada')} className={`btn-touch text-sm ${movTipo === 'entrada' ? 'bg-green-600' : 'bg-iados-card'}`}>
            <ArrowUpCircle size={18} className="mr-1" /> Entrada
          </button>
          <button onClick={() => setMovTipo('salida')} className={`btn-touch text-sm ${movTipo === 'salida' ? 'bg-red-600' : 'bg-iados-card'}`}>
            <ArrowDownCircle size={18} className="mr-1" /> Salida
          </button>
        </div>
        <input type="number" value={movMonto} onChange={(e) => setMovMonto(e.target.value)} placeholder="Monto" className="input-touch mb-2" />
        <input type="text" value={movConcepto} onChange={(e) => setMovConcepto(e.target.value)} placeholder="Concepto" className="input-touch mb-2" />
        <button onClick={handleMovimiento} className="btn-primary w-full">Registrar</button>
      </div>

      {/* Cerrar caja */}
      <div className="card border-red-900/50">
        <h3 className="font-bold mb-3 text-red-400">Cerrar Caja</h3>
        {cajaAutoEnabled ? (
          <p className="text-xs text-slate-400 mb-3">Caja automática — el total real se toma de las ventas del sistema (${Number(cajaActiva.total_ventas).toFixed(2)})</p>
        ) : (
          <input type="number" value={totalReal} onChange={(e) => setTotalReal(e.target.value)} placeholder="Total real en caja" className="input-touch mb-3 text-center text-xl" />
        )}
        <button onClick={() => setShowPinCerrar(true)} disabled={loading} className="btn-danger w-full">
          {loading ? 'Cerrando...' : 'Cerrar Caja'}
        </button>
      </div>

      <PinConfirmModal
        open={showPinCerrar}
        title="Confirmar cierre de caja"
        description="Esta acción cerrará la caja del día. Ingresa tu PIN para continuar."
        onConfirm={handleCerrarConPin}
        onCancel={() => setShowPinCerrar(false)}
      />

      {/* Corte X Modal */}
      {corteX && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setCorteX(null)}>
          <div className="card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-center">Corte X</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(corteX.resumen).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-slate-400">{key.replace(/_/g, ' ')}</span>
                  <span className="font-bold">{typeof val === 'number' ? `$${val.toFixed(2)}` : String(val)}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setCorteX(null)} className="btn-secondary w-full mt-4">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
