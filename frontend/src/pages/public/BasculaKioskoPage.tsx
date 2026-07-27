import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { basculaApi } from '../../api/endpoints';
import { resolveUploadUrl } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { ShoppingBasket, Scale, Printer, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

interface ProductoKg {
  id: number;
  nombre: string;
  precio: number;
  imagen_url: string | null;
}

type Step = 'grid' | 'weighing' | 'printing' | 'done';

export default function BasculaKioskoPage() {
  const { user } = useAuthStore();
  const tiendaId = user?.tienda_id;

  const [step, setStep] = useState<Step>('grid');
  const [productos, setProductos] = useState<ProductoKg[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [seleccionado, setSeleccionado] = useState<ProductoKg | null>(null);
  const [pesoKg, setPesoKg] = useState(0);
  const [resultado, setResultado] = useState<{ barcode: string; precio_total: number } | null>(null);
  const sockRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!tiendaId) return;
    basculaApi.getProductos(tiendaId)
      .then(({ data }) => setProductos(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tiendaId]);

  useEffect(() => {
    if (!tiendaId) return;
    const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://posapi.iados.online';
    const sock = io(`${base}/bascula`, { transports: ['websocket'] });
    sockRef.current = sock;
    sock.on('connect', () => {
      setConnected(true);
      sock.emit('kiosk-join', { tienda_id: tiendaId });
    });
    sock.on('disconnect', () => setConnected(false));
    sock.on('weight-update', (data: { peso_kg: number }) => setPesoKg(data.peso_kg || 0));
    return () => { sock.disconnect(); };
  }, [tiendaId]);

  const total = seleccionado ? pesoKg * Number(seleccionado.precio) : 0;

  const seleccionarProducto = (p: ProductoKg) => {
    setSeleccionado(p);
    setPesoKg(0);
    setStep('weighing');
  };

  const volverAlGrid = () => {
    setStep('grid');
    setSeleccionado(null);
    setResultado(null);
    setPesoKg(0);
  };

  const confirmarPesaje = async () => {
    if (!seleccionado || !tiendaId || pesoKg <= 0) return;
    setStep('printing');
    try {
      const { data } = await basculaApi.registrarPesaje({
        tienda_id: tiendaId,
        producto_id: seleccionado.id,
        peso_kg: pesoKg,
      });
      setResultado({ barcode: data.barcode, precio_total: data.precio_total });
      setStep('done');
      setTimeout(volverAlGrid, 6000);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error al registrar el pesaje. Intenta de nuevo.');
      setStep('weighing');
    }
  };

  if (!tiendaId) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
      Debes iniciar sesión en el POS antes de abrir la báscula.
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white select-none" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Scale size={24} className="text-amber-400" />
          <h1 className="text-xl font-bold">Báscula — Frutas y Verduras</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
          <span className="text-xs text-slate-500">{connected ? 'Báscula conectada' : 'Conectando...'}</span>
        </div>
      </div>

      {/* Grid de productos */}
      {step === 'grid' && (
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-500">
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : productos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
              <ShoppingBasket size={48} className="opacity-30" />
              <p>No hay productos configurados como "vendido por kg" en esta tienda.</p>
              <p className="text-xs">Configúralos en Catálogos → Productos, unidad "kg".</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {productos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => seleccionarProducto(p)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95"
                >
                  {p.imagen_url ? (
                    <img src={resolveUploadUrl(p.imagen_url)} alt={p.nombre} className="w-20 h-20 object-cover rounded-xl" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center text-3xl">🥬</div>
                  )}
                  <p className="text-sm font-semibold text-center">{p.nombre}</p>
                  <p className="text-xs text-amber-400 font-bold">${Number(p.precio).toFixed(2)} / kg</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pesando */}
      {(step === 'weighing' || step === 'printing') && seleccionado && (
        <div className="flex flex-col items-center justify-center py-16 px-6 gap-6">
          <button onClick={volverAlGrid} className="absolute top-24 left-6 text-slate-500 flex items-center gap-1 text-sm">
            <ArrowLeft size={16} /> Volver
          </button>

          <p className="text-2xl font-bold">{seleccionado.nombre}</p>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl px-12 py-10 flex flex-col items-center gap-2">
            <p className="text-xs text-slate-500 uppercase tracking-widest">Peso</p>
            <p className="text-6xl font-black tabular-nums">{pesoKg.toFixed(3)} <span className="text-2xl text-slate-500">kg</span></p>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest">Total a pagar</p>
            <p className="text-5xl font-black text-amber-400">${total.toFixed(2)}</p>
          </div>

          <button
            onClick={confirmarPesaje}
            disabled={pesoKg <= 0 || step === 'printing'}
            className="w-full max-w-xs py-4 rounded-2xl font-bold text-lg bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {step === 'printing'
              ? <><Loader2 size={20} className="animate-spin" /> Imprimiendo...</>
              : <><Printer size={20} /> Imprimir etiqueta</>}
          </button>

          {pesoKg <= 0 && step === 'weighing' && (
            <p className="text-xs text-slate-500">Coloca el producto en la báscula...</p>
          )}
        </div>
      )}

      {/* Confirmado */}
      {step === 'done' && resultado && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <CheckCircle size={64} className="text-green-400" />
          <p className="text-2xl font-bold">¡Etiqueta impresa!</p>
          <p className="text-slate-400">Pega la etiqueta en tu producto y pasa a caja a pagar.</p>
          <p className="text-4xl font-black text-amber-400 mt-2">${Number(resultado.precio_total).toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
