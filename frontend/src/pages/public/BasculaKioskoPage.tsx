import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { basculaApi } from '../../api/endpoints';
import { resolveUploadUrl } from '../../api/client';
import { printEtiquetaBascula } from '../../utils/printEtiquetaBascula';
import { useAuthStore } from '../../store/auth.store';
import { ShoppingBasket, Scale, Printer, ArrowLeft, Loader2, CheckCircle, Search, X, Delete } from 'lucide-react';

interface ProductoKg {
  id: number;
  nombre: string;
  precio: number;
  imagen_url: string | null;
}

type Step = 'grid' | 'weighing' | 'printing' | 'done';

// Teclado en pantalla (QWERTY en español) para buscar sin teclado fisico.
const FILAS_TECLADO = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

function TecladoEnPantalla({ onKey, onBackspace, onSpace, onClose }: {
  onKey: (k: string) => void; onBackspace: () => void; onSpace: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 border-t border-slate-700 p-3">
      {/* Las teclas se reparten el ancho disponible (hasta 96 px c/u) para que el
          teclado se vea grande a lo horizontal; el alto se mantiene igual. */}
      <div className="mx-auto w-full max-w-[1100px] space-y-2">
        {FILAS_TECLADO.map((fila, i) => (
          <div key={i} className="flex justify-center gap-1.5 md:gap-2">
            {fila.map((k) => (
              <button
                key={k}
                onClick={() => onKey(k)}
                className="flex-1 basis-0 min-w-0 max-w-[96px] h-11 md:h-12 rounded-lg bg-slate-800 hover:bg-slate-700 text-base md:text-lg font-bold active:scale-95 transition-transform"
              >
                {k}
              </button>
            ))}
          </div>
        ))}
        <div className="flex justify-center gap-1.5 md:gap-2">
          <button onClick={onSpace} className="flex-1 basis-0 min-w-0 max-w-[600px] h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-base font-bold">Espacio</button>
          <button onClick={onBackspace} className="flex-1 basis-0 min-w-0 max-w-[150px] h-11 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center">
            <Delete size={20} />
          </button>
          <button onClick={onClose} className="flex-1 basis-0 min-w-0 max-w-[200px] h-11 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-base font-bold">Listo</button>
        </div>
      </div>
    </div>
  );
}

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
  const [busqueda, setBusqueda] = useState('');
  const [teclado, setTeclado] = useState(false);
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

  const productosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return productos;
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [productos, busqueda]);

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
      // En modo 'navegador' el backend no manda la etiqueta al bridge: la imprime este
      // kiosko en la impresora predeterminada de Windows, igual que los tickets del POS.
      if (data.printer_modo === 'navegador') {
        printEtiquetaBascula({
          producto_nombre: data.producto_nombre ?? seleccionado.nombre,
          peso_kg: Number(data.peso_kg ?? pesoKg),
          precio_kg: Number(data.precio_kg ?? seleccionado.precio),
          precio_total: Number(data.precio_total),
          barcode: data.barcode,
          label_width_mm: data.label_width_mm,
          label_height_mm: data.label_height_mm,
        });
      }
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
        <div className={`p-6 ${teclado ? 'pb-64' : ''}`}>
          {/* Buscador */}
          <div className="relative max-w-md mx-auto mb-6">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={busqueda}
              onFocus={() => setTeclado(true)}
              onChange={(e) => setBusqueda(e.target.value)}
              readOnly
              placeholder="Buscar producto..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-11 py-3 text-base outline-none cursor-pointer"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
              >
                <X size={18} />
              </button>
            )}
          </div>

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
          ) : productosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
              <Search size={40} className="opacity-30" />
              <p>Sin resultados para "{busqueda}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {productosFiltrados.map((p) => (
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

          {teclado && (
            <TecladoEnPantalla
              onKey={(k) => setBusqueda((b) => b + k)}
              onBackspace={() => setBusqueda((b) => b.slice(0, -1))}
              onSpace={() => setBusqueda((b) => b + ' ')}
              onClose={() => setTeclado(false)}
            />
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
