import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { selfOrderApi } from '../../api/endpoints';
import { resolveUploadUrl } from '../../api/client';
import toast from 'react-hot-toast';
import { ShoppingCart, Plus, Minus, X, Send, CheckCircle, Clock, XCircle, Star } from 'lucide-react';

type Step = 'loading' | 'menu' | 'sending' | 'waiting' | 'confirmed' | 'listo' | 'rejected' | 'encuesta' | 'done' | 'error';

interface CartItem { producto_id: number; nombre: string; precio: number; cantidad: number; sku: string; imagen_url?: string; }

export default function SelfOrderPage() {
  const { tienda_id, mesa_numero, slug } = useParams<{ tienda_id?: string; mesa_numero: string; slug?: string }>();
  const [step, setStep] = useState<Step>('loading');
  const [tienda, setTienda] = useState<any>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  // Formulario dinámico — campos cargados desde config_especial.campos_formulario
  const [camposFormulario, setCamposFormulario] = useState<Record<string, any> | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const setCampo = (key: string, val: string) => setCampos((prev) => ({ ...prev, [key]: val }));
  const [errorMsg, setErrorMsg] = useState('');
  const [encuestaToken, setEncuestaToken] = useState('');
  const [pedidoFolio, setPedidoFolio] = useState('');
  // Encuesta
  const [calServicio, setCalServicio] = useState(0);
  const [calComida, setCalComida] = useState(0);
  const [comentario, setComentario] = useState('');
  const [encuestaEnviada, setEncuestaEnviada] = useState(false);
  const [mostrarPrecios, setMostrarPrecios] = useState(true);
  const [notifEstados, setNotifEstados] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifEstadosRef = useRef(false);
  useEffect(() => { notifEstadosRef.current = notifEstados; }, [notifEstados]);

  const tiendaId = tienda_id ? Number(tienda_id) : null;
  const mesaNumero = Number(mesa_numero);

  useEffect(() => {
    loadTienda();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const loadTienda = async () => {
    try {
      let t, m;
      if (slug) {
        [t, m] = await Promise.all([
          selfOrderApi.getTiendaBySlug(slug, mesaNumero),
          selfOrderApi.getMenuBySlug(slug),
        ]);
      } else {
        [t, m] = await Promise.all([
          selfOrderApi.getTienda(tiendaId!, mesaNumero),
          selfOrderApi.getMenu(tiendaId!),
        ]);
      }
      setTienda(t.data);
      setCategorias(m.data.categorias || []);
      setProductos(m.data.productos || []);
      if (m.data.categorias?.length) setCategoriaActiva(m.data.categorias[0].id);
      if (m.data.config_especial) {
        setMostrarPrecios(m.data.config_especial.mostrar_precios !== false);
        setNotifEstados(m.data.config_especial.notif_cliente_estados === true);
        // Inicializar formulario vacío con los campos del selforder activos
        if (m.data.config_especial.campos_formulario) {
          setCamposFormulario(m.data.config_especial.campos_formulario);
          const cfInit: Record<string, string> = {};
          Object.entries(m.data.config_especial.campos_formulario).forEach(([k, v]: [string, any]) => {
            if (v.activo && v.selforder) cfInit[k] = '';
          });
          setCampos(cfInit);
        }
      }
      setStep('menu');
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'No disponible en este momento');
      setStep('error');
    }
  };

  const addToCart = (prod: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.producto_id === prod.id);
      if (existing) return prev.map((i) => i.producto_id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { producto_id: prod.id, nombre: prod.nombre, precio: prod.precio ?? 0, cantidad: 1, sku: prod.id.toString(), imagen_url: prod.imagen_url }];
    });
  };

  const removeFromCart = (producto_id: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.producto_id === producto_id);
      if (existing && existing.cantidad > 1) return prev.map((i) => i.producto_id === producto_id ? { ...i, cantidad: i.cantidad - 1 } : i);
      return prev.filter((i) => i.producto_id !== producto_id);
    });
  };

  const getQty = (producto_id: number) => cart.find((i) => i.producto_id === producto_id)?.cantidad || 0;
  const total = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const itemCount = cart.reduce((s, i) => s + i.cantidad, 0);

  const CAMPO_A_BACKEND: Record<string, string> = {
    nombre: 'cliente_nombre',
    telefono: 'cliente_telefono',
    email: 'cliente_email',
    direccion: 'cliente_direccion',
    empresa: 'cliente_empresa',
    notas: 'notas',
  };

  const handleConfirmar = async () => {
    if (camposFormulario) {
      for (const [key, cfg] of Object.entries(camposFormulario) as any[]) {
        if (cfg.activo && cfg.selforder && cfg.requerido && !campos[key]?.trim()) {
          return toast.error(`El campo "${cfg.label}" es obligatorio`);
        }
      }
    } else if (!campos['nombre']?.trim()) {
      return toast.error('Ingresa tu nombre para continuar');
    }
    if (!cart.length) return toast.error('Agrega al menos un producto');
    setStep('sending');
    try {
      const subtotal = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);
      const camposBody: Record<string, string> = {};
      Object.entries(campos).forEach(([key, val]) => {
        if (CAMPO_A_BACKEND[key] && val?.trim()) camposBody[CAMPO_A_BACKEND[key]] = val.trim();
      });
      const pedidoBody = {
        ...camposBody,
        items: cart.map((i) => ({ producto_id: i.producto_id, nombre: i.nombre, sku: i.sku, precio: i.precio, cantidad: i.cantidad })),
        subtotal,
        total: subtotal,
      };
      const { data } = slug
        ? await selfOrderApi.crearPedidoBySlug(slug, mesaNumero, pedidoBody)
        : await selfOrderApi.crearPedido(tiendaId!, mesaNumero, pedidoBody);
      setEncuestaToken(data.encuesta_token);
      setPedidoFolio(data.folio);
      setStep('waiting');
      startPolling(data.encuesta_token);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al enviar pedido');
      setStep('menu');
    }
  };

  const startPolling = (token: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await selfOrderApi.getStatus(token);

        if (data.encuesta_lista) {
          clearInterval(pollRef.current!);
          try { new Audio('/notification.mp3').play(); } catch {}
          setStep('encuesta');
          return;
        }

        if (data.estado === 'cancelado') {
          clearInterval(pollRef.current!);
          setStep('rejected');
          return;
        }

        // Si notif_cliente_estados está activo: mostrar pasos individuales y SEGUIR polling
        if (notifEstadosRef.current) {
          if (data.estado === 'listo_para_entrega') {
            setStep('listo');
            // polling continúa para detectar encuesta/cobro
            return;
          }
          if (data.mesero_confirmado || data.estado === 'en_elaboracion') {
            setStep('confirmed');
            // polling continúa para detectar listo_para_entrega y encuesta
            return;
          }
        } else {
          // Comportamiento por defecto: colapsar todo en 'confirmed' y detener polling
          if (data.mesero_confirmado || data.estado === 'en_elaboracion' || data.estado === 'listo_para_entrega' || data.estado === 'entregado') {
            clearInterval(pollRef.current!);
            setStep('confirmed');
            // Reanudar polling solo para detectar encuesta
            pollRef.current = setInterval(async () => {
              try {
                const { data: d2 } = await selfOrderApi.getStatus(token);
                if (d2.encuesta_lista) {
                  clearInterval(pollRef.current!);
                  try { new Audio('/notification.mp3').play(); } catch {}
                  setStep('encuesta');
                }
              } catch {}
            }, 5000);
          }
        }
      } catch {}
    }, 3000);
  };

  const handleEncuesta = async () => {
    if (!calServicio || !calComida) return toast.error('Califica ambos aspectos');
    try {
      await selfOrderApi.responderEncuesta(encuestaToken, { calificacion_servicio: calServicio, calificacion_comida: calComida, comentario });
      setEncuestaEnviada(true);
      setStep('done');
    } catch { toast.error('Error al enviar encuesta'); }
  };

  const prodsFiltrados = categoriaActiva ? productos.filter((p) => p.categoria_id === categoriaActiva) : productos;

  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} onClick={() => onChange(s)} className={`text-2xl transition-all ${s <= value ? 'text-yellow-400' : 'text-slate-600'}`}>★</button>
      ))}
    </div>
  );

  if (step === 'loading') return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center text-white"><div className="animate-spin text-4xl mb-4">⟳</div><p>Cargando menú...</p></div>
    </div>
  );

  if (step === 'error') return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-sm">
        <XCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">No disponible</h2>
        <p className="text-slate-400">{errorMsg}</p>
      </div>
    </div>
  );

  if (step === 'sending') return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center text-white"><div className="text-4xl animate-bounce mb-4">📤</div><p>Enviando tu pedido...</p></div>
    </div>
  );

  if (step === 'waiting' || step === 'confirmed') return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-sm">
        {step === 'waiting'
          ? <><Clock size={56} className="text-yellow-400 mx-auto mb-4 animate-pulse" /><h2 className="text-xl font-bold mb-2">¡Pedido enviado!</h2><p className="text-slate-400 mb-2">Tu mesero está revisando tu pedido <strong className="text-white">{pedidoFolio}</strong>.</p><p className="text-slate-500 text-sm">En breve recibirás confirmación. Mantén esta pantalla abierta.</p></>
          : <><CheckCircle size={56} className="text-green-400 mx-auto mb-4" /><h2 className="text-xl font-bold mb-2">¡Pedido confirmado!</h2><p className="text-slate-400 mb-2">Tu mesero confirmó el pedido. En preparación 🍳</p><p className="text-slate-500 text-sm">Recibirás una encuesta al finalizar tu pago.</p></>
        }
      </div>
    </div>
  );

  if (step === 'listo') return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-sm">
        <CheckCircle size={56} className="text-green-400 mx-auto mb-4 animate-pulse" />
        <h2 className="text-xl font-bold mb-2">¡Tu pedido está listo!</h2>
        <p className="text-slate-400 mb-2">Acércate al mostrador a recogerlo 🎉</p>
        {pedidoFolio && <p className="text-slate-500 text-sm">Folio: <strong className="text-white">{pedidoFolio}</strong></p>}
      </div>
    </div>
  );

  if (step === 'rejected') return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-sm">
        <XCircle size={56} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Pedido no disponible</h2>
        <p className="text-slate-400 mb-4">El mesero no pudo procesar tu pedido. Por favor acércate a solicitar atención.</p>
        <button onClick={() => { setCart([]); setStep('menu'); }} className="btn-primary">Volver al menú</button>
      </div>
    </div>
  );

  if (step === 'encuesta') return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="card max-w-sm w-full space-y-5">
        <div className="text-center">
          <Star size={40} className="text-yellow-400 mx-auto mb-2" />
          <h2 className="text-xl font-bold">¿Cómo fue tu experiencia?</h2>
          <p className="text-slate-400 text-sm mt-1">Tu opinión nos ayuda a mejorar</p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-sm">Calidad del servicio</p>
          <StarRating value={calServicio} onChange={setCalServicio} />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-sm">Calidad de la comida</p>
          <StarRating value={calComida} onChange={setCalComida} />
        </div>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Comentario (opcional)"
          className="input-touch resize-none"
          rows={3}
        />
        <button onClick={handleEncuesta} className="btn-primary w-full">Enviar encuesta</button>
        <button onClick={() => setStep('done')} className="text-xs text-slate-500 w-full text-center">Omitir</button>
      </div>
    </div>
  );

  if (step === 'done') return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-sm">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold mb-2">{encuestaEnviada ? '¡Gracias por tu opinión!' : '¡Hasta pronto!'}</h2>
        <p className="text-slate-400">Esperamos verte de nuevo pronto.</p>
      </div>
    </div>
  );

  // step === 'menu'
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-2 min-w-0">
          {tienda?.empresa_logo && (
            <img
              src={tienda.empresa_logo}
              alt="Logo"
              className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-600"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{tienda?.empresa_nombre || tienda?.tienda_nombre}</p>
            <p className="text-xs text-iados-secondary font-semibold">Mesa {mesaNumero}{tienda?.mesa_nombre ? ` · ${tienda.mesa_nombre}` : ''}</p>
          </div>
        </div>
        <button onClick={() => setShowCart(true)} className="relative p-2 shrink-0">
          <ShoppingCart size={22} />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-iados-secondary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{itemCount}</span>
          )}
        </button>
      </div>

      {/* Categorías */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide bg-slate-800/50">
        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoriaActiva(cat.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${categoriaActiva === cat.id ? 'bg-iados-secondary text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Productos */}
      <div className="flex-1 p-4 grid grid-cols-2 gap-3 pb-32">
        {prodsFiltrados.map((prod) => {
          const qty = getQty(prod.id);
          return (
            <div key={prod.id} className="bg-slate-800 rounded-xl overflow-hidden flex flex-col">
              {prod.imagen_url
                ? <img src={resolveUploadUrl(prod.imagen_url)} alt={prod.nombre} className="w-full h-28 object-cover" />
                : <div className="w-full h-28 bg-slate-700 flex items-center justify-center text-3xl">🍽️</div>
              }
              <div className="p-2 flex flex-col flex-1">
                <p className="font-semibold text-sm leading-tight mb-1">{prod.nombre}</p>
                {prod.descripcion && <p className="text-xs text-slate-400 mb-1 line-clamp-2">{prod.descripcion}</p>}
                {mostrarPrecios && prod.precio !== null && prod.precio !== undefined && Number(prod.precio) > 0 && (
                  <p className="text-iados-secondary font-bold text-sm mt-auto">${Number(prod.precio).toFixed(2)}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  {qty === 0
                    ? <button onClick={() => addToCart(prod)} className="btn-primary text-xs py-1 px-3 w-full"><Plus size={14} className="inline mr-1" />Agregar</button>
                    : (
                      <div className="flex items-center gap-2 w-full justify-center">
                        <button onClick={() => removeFromCart(prod.id)} className="p-1 bg-slate-700 rounded-lg"><Minus size={14} /></button>
                        <span className="font-bold text-sm w-5 text-center">{qty}</span>
                        <button onClick={() => addToCart(prod)} className="p-1 bg-iados-secondary rounded-lg"><Plus size={14} /></button>
                      </div>
                    )
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón flotante de carrito */}
      {itemCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900">
          <button onClick={() => setShowCart(true)} className="btn-primary w-full py-3 text-base flex items-center justify-between">
            <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm">{itemCount}</span>
            <span>Ver pedido</span>
            {mostrarPrecios && (
              <span className="font-bold">${total.toFixed(2)}</span>
            )}
          </button>
        </div>
      )}

      {/* Panel de carrito */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-slate-800 w-full rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="font-bold text-lg">Tu pedido · Mesa {mesaNumero}</h3>
              <button onClick={() => setShowCart(false)}><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.producto_id} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(item.producto_id)} className="p-1 bg-slate-700 rounded-lg"><Minus size={14} /></button>
                    <span className="font-bold w-5 text-center">{item.cantidad}</span>
                    <button onClick={() => addToCart(item as any)} className="p-1 bg-iados-secondary rounded-lg"><Plus size={14} /></button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.nombre}</p>
                    {mostrarPrecios && (
                      <p className="text-xs text-slate-400">${Number(item.precio).toFixed(2)} c/u</p>
                    )}
                  </div>
                  {mostrarPrecios && (
                    <p className="font-bold text-sm">${(Number(item.precio) * item.cantidad).toFixed(2)}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-700 space-y-3">
              {mostrarPrecios && (
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span><span className="text-iados-secondary">${total.toFixed(2)}</span>
                </div>
              )}
              {/* Formulario dinámico — campos configurados por la empresa */}
              {Object.entries(camposFormulario || {
                nombre: { activo: true, requerido: true, selforder: true, label: 'Nombre', ecommerce: true },
              }).map(([key, cfg]: [string, any]) => {
                if (!cfg.activo || !cfg.selforder) return null;
                const isTextarea = key === 'notas' || key === 'direccion';
                return (
                  <div key={key}>
                    {isTextarea ? (
                      <textarea
                        value={campos[key] || ''}
                        onChange={(e) => setCampo(key, e.target.value)}
                        placeholder={`${cfg.label}${cfg.requerido ? ' *' : ' (opcional)'}`}
                        className="input-touch resize-none"
                        rows={2}
                      />
                    ) : (
                      <input
                        value={campos[key] || ''}
                        onChange={(e) => setCampo(key, e.target.value)}
                        placeholder={`${cfg.label}${cfg.requerido ? ' *' : ' (opcional)'}`}
                        type={key === 'email' ? 'email' : key === 'telefono' ? 'tel' : 'text'}
                        className="input-touch"
                      />
                    )}
                  </div>
                );
              })}
              <p className="text-xs text-slate-400 text-center">Al confirmar, recibirás una encuesta al finalizar tu pago.</p>
              <button
                onClick={() => { setShowCart(false); handleConfirmar(); }}
                disabled={Object.entries(camposFormulario || { nombre: { activo: true, requerido: true, selforder: true } })
                  .some(([key, cfg]: [string, any]) => cfg.activo && cfg.selforder && cfg.requerido && !campos[key]?.trim())}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                <Send size={18} /> Confirmar pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
