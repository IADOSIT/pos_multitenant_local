import { useState, useEffect } from 'react';
import { mesasApi, usersApi, pedidosApi, tiendasApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.store';
import { Grid3X3, Plus, Trash2, Edit2, QrCode, UserCheck, Link2, Unlink, Printer, User, ChevronDown, CreditCard } from 'lucide-react';
import PayModal from '../../components/pos/PayModal';
import QRCode from 'qrcode';

// Paleta de colores por mesero
const MESERO_COLORS = [
  'bg-blue-700 text-white', 'bg-emerald-700 text-white', 'bg-purple-700 text-white',
  'bg-orange-700 text-white', 'bg-rose-700 text-white', 'bg-cyan-700 text-white',
  'bg-yellow-600 text-white', 'bg-indigo-700 text-white',
];

export default function MesasAdmin() {
  const { user } = useAuthStore();
  const [mesas, setMesas] = useState<any[]>([]);
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [juntas, setJuntas] = useState<any[]>([]);
  const [meseros, setMeseros] = useState<any[]>([]);
  const [pedidosPendientes, setPedidosPendientes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [showJuntar, setShowJuntar] = useState(false);
  const [juntarA, setJuntarA] = useState('');
  const [juntarB, setJuntarB] = useState('');
  const [form, setForm] = useState({ numero: '', nombre: '', zona: '', capacidad: '4' });
  const [view, setView] = useState<'mesas' | 'meseros'>('mesas');
  const [dragMesaId, setDragMesaId] = useState<number | null>(null);
  const [pedidoACobrar, setPedidoACobrar] = useState<any>(null);
  const [qrModal, setQrModal] = useState<{ mesa: any; qrDataUrl: string; url: string } | null>(null);
  const [tiendaSlug, setTiendaSlug] = useState<string>('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [m, a, j, u, p] = await Promise.all([
        mesasApi.list(),
        mesasApi.getAsignaciones(),
        mesasApi.getJuntas(),
        usersApi ? usersApi.list() : Promise.resolve({ data: [] }),
        pedidosApi.pendientes(),
      ]);
      setMesas(m.data);
      setAsignaciones(a.data);
      setJuntas(j.data);
      setPedidosPendientes(p.data || []);
      const meserosList = (u.data || []).filter((u: any) => ['mesero', 'admin', 'superadmin'].includes(u.rol));
      setMeseros(meserosList);
      // Load tienda slug for QR generation
      if (user?.tienda_id) {
        try {
          const tiendaRes = await tiendasApi.get(user.tienda_id);
          setTiendaSlug(tiendaRes.data?.slug || '');
        } catch {}
      }
    } catch { toast.error('Error cargando mesas'); }
  };

  const getPedidoMesa = (numero: number) =>
    pedidosPendientes.find((p) => Number(p.mesa) === Number(numero));

  const handleSave = async () => {
    if (!form.numero) return toast.error('El número de mesa es obligatorio');
    try {
      if (editItem) {
        await mesasApi.update(editItem.id, { ...form, numero: Number(form.numero), capacidad: Number(form.capacidad) });
        toast.success('Mesa actualizada');
      } else {
        await mesasApi.create({ ...form, numero: Number(form.numero), capacidad: Number(form.capacidad) });
        toast.success('Mesa creada');
      }
      setShowForm(false); setEditItem(null);
      setForm({ numero: '', nombre: '', zona: '', capacidad: '4' });
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta mesa?')) return;
    try { await mesasApi.remove(id); toast.success('Mesa eliminada'); load(); }
    catch { toast.error('Error al eliminar'); }
  };

  const handleAsignar = async (mesa_id: number, user_id: string) => {
    try {
      if (!user_id) {
        await mesasApi.desasignar(mesa_id);
        toast.success('Mesero desasignado');
      } else {
        const mesero = meseros.find((m) => m.id === Number(user_id));
        await mesasApi.asignar(mesa_id, Number(user_id), mesero?.nombre || '');
        toast.success('Mesero asignado');
      }
      load();
    } catch { toast.error('Error al asignar'); }
  };

  const handleJuntar = async () => {
    if (!juntarA || !juntarB || juntarA === juntarB) return toast.error('Selecciona dos mesas distintas');
    try {
      await mesasApi.juntar(Number(juntarA), Number(juntarB));
      toast.success('Mesas unidas');
      setShowJuntar(false); setJuntarA(''); setJuntarB('');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleSeparar = async (mesa_principal_id: number, mesa_secundaria_id: number) => {
    try {
      await mesasApi.separar(mesa_principal_id, mesa_secundaria_id);
      toast.success('Mesas separadas');
      load();
    } catch { toast.error('Error al separar'); }
  };

  const handlePrintQR = async (mesa: any) => {
    const base = window.location.origin;
    const path = tiendaSlug
      ? `/s/${tiendaSlug}/${mesa.numero}`
      : `/self-order/${user?.tienda_id}/${mesa.numero}`;
    const url = `${base}${path}`;

    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300, margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
      });
      setQrModal({ mesa, qrDataUrl, url });
    } catch {
      toast.error('Error generando QR');
    }
  };

  const handlePrintReporte = () => {
    const fecha = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const rows = mesas.map((mesa) => {
      const asig = getAsignado(mesa.id);
      const junta = getJuntada(mesa.id);
      const juntaCon = junta
        ? (junta.mesa_principal_id === mesa.id
            ? mesas.find((m) => m.id === junta.mesa_secundaria_id)?.numero
            : mesas.find((m) => m.id === junta.mesa_principal_id)?.numero)
        : null;
      return `<tr>
        <td style="border:1px solid #ccc;padding:8px;font-weight:bold">${mesa.numero}</td>
        <td style="border:1px solid #ccc;padding:8px">${mesa.nombre || '-'}</td>
        <td style="border:1px solid #ccc;padding:8px">${mesa.zona || '-'}</td>
        <td style="border:1px solid #ccc;padding:8px">${mesa.capacidad}</td>
        <td style="border:1px solid #ccc;padding:8px;color:${asig ? '#1d4ed8' : '#64748b'}">${asig?.user_nombre || 'Sin asignar'}</td>
        <td style="border:1px solid #ccc;padding:8px">${juntaCon ? `Mesa ${juntaCon}` : '-'}</td>
      </tr>`;
    }).join('');

    const meseroSummary = meseros.map((m, i) => {
      const mis_mesas = mesas.filter((mesa) => getAsignado(mesa.id)?.user_id === m.id);
      if (!mis_mesas.length) return '';
      return `<div style="margin-bottom:12px"><strong style="color:#1d4ed8">${m.nombre}</strong>:
        Mesas ${mis_mesas.map((m) => m.numero).join(', ')} (${mis_mesas.length} mesa${mis_mesas.length !== 1 ? 's' : ''})</div>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Reporte de Mesas</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:20px;margin-bottom:4px}
      .fecha{color:#64748b;margin-bottom:20px}table{width:100%;border-collapse:collapse;margin-bottom:24px}
      th{background:#1e40af;color:white;padding:8px;border:1px solid #ccc;text-align:left}
      @media print{button{display:none}}</style></head>
      <body>
      <h1>Reporte de Mesas — ${user?.empresa_nombre || 'POS-iaDoS'}</h1>
      <div class="fecha">${fecha}</div>
      <table><thead><tr>
        <th>#</th><th>Nombre</th><th>Zona</th><th>Cap.</th><th>Mesero Asignado</th><th>Junta con</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <h2 style="font-size:16px;margin-bottom:12px">Resumen por Mesero</h2>
      ${meseroSummary || '<p style="color:#64748b">No hay asignaciones activas</p>'}
      <br><button onclick="window.print()" style="background:#1e40af;color:white;padding:10px 20px;border:none;border-radius:8px;cursor:pointer;font-size:14px">
        Imprimir / Guardar PDF
      </button></body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  const getAsignado = (mesa_id: number) => asignaciones.find((a) => a.mesa_id === mesa_id);
  const getJuntada = (mesa_id: number) =>
    juntas.find((j) => j.mesa_principal_id === mesa_id || j.mesa_secundaria_id === mesa_id);

  // Color por mesero (consistente por índice)
  const getMeseroColor = (user_id: number) => {
    const idx = meseros.findIndex((m) => m.id === user_id);
    return MESERO_COLORS[idx % MESERO_COLORS.length] || MESERO_COLORS[0];
  };

  // Vista por mesero: agrupa mesas por mesero asignado
  const meseroGroups = meseros.map((m) => ({
    mesero: m,
    mesas: mesas.filter((mesa) => getAsignado(mesa.id)?.user_id === m.id),
    color: getMeseroColor(m.id),
  })).filter((g) => g.mesas.length > 0);
  const sinAsignar = mesas.filter((mesa) => !getAsignado(mesa.id));

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <style>{`@media print { body > * { display: none; } #qr-print-area { display: block !important; position: fixed; top: 0; left: 0; width: 100%; background: white; } .fixed { background: transparent !important; } }`}</style>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Grid3X3 size={24} /> Gestión de Mesas</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handlePrintReporte} className="btn-secondary text-sm">
            <Printer size={15} className="mr-1" />Reporte
          </button>
          <button onClick={() => setShowJuntar(true)} className="btn-secondary text-sm">
            <Link2 size={15} className="mr-1" />Juntar
          </button>
          <button onClick={() => { setShowForm(true); setEditItem(null); setForm({ numero: '', nombre: '', zona: '', capacidad: '4' }); }} className="btn-primary text-sm">
            <Plus size={15} className="mr-1" />Nueva Mesa
          </button>
        </div>
      </div>

      {/* Tabs vista */}
      <div className="flex gap-1 border-b border-slate-700 mb-4">
        <button onClick={() => setView('mesas')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${view === 'mesas' ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white'}`}>
          <Grid3X3 size={14} className="inline mr-1" />Por Mesa
        </button>
        <button onClick={() => setView('meseros')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${view === 'meseros' ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white'}`}>
          <User size={14} className="inline mr-1" />Por Mesero
        </button>
      </div>

      {/* Vista: Por Mesa */}
      {view === 'mesas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mesas.map((mesa) => {
            const asig = getAsignado(mesa.id);
            const junta = getJuntada(mesa.id);
            const colorClass = asig ? getMeseroColor(asig.user_id) : '';
            const pedidoMesa = getPedidoMesa(mesa.numero);
            return (
              <div key={mesa.id} className={`card space-y-3 ${pedidoMesa ? 'ring-1 ring-orange-500/40' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl relative ${pedidoMesa ? 'bg-orange-600 text-white' : asig ? colorClass : 'bg-slate-700 text-slate-300'}`}>
                      {mesa.numero}
                      {pedidoMesa && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-iados-surface" />
                      )}
                    </div>
                    <div>
                      {mesa.nombre && <p className="text-xs text-slate-400">{mesa.nombre}</p>}
                      {mesa.zona && <p className="text-xs text-slate-500">{mesa.zona}</p>}
                      <p className="text-xs text-slate-600">{mesa.capacidad} pax</p>
                      {pedidoMesa && (
                        <p className="text-xs text-orange-400 font-medium">
                          💳 ${Number(pedidoMesa.total).toFixed(2)} · {pedidoMesa.detalles?.length || 0} items
                          {pedidoMesa.cuenta_abierta && ' · Parcial'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {pedidoMesa && (
                      <button
                        onClick={() => setPedidoACobrar(pedidoMesa)}
                        className="p-1.5 bg-green-700 hover:bg-green-600 rounded-lg text-white"
                        title="Cobrar"
                      >
                        <CreditCard size={15} />
                      </button>
                    )}
                    <button onClick={() => handlePrintQR(mesa)} className="p-1.5 hover:bg-iados-card rounded-lg text-iados-secondary" title="QR">
                      <QrCode size={15} />
                    </button>
                    <button onClick={() => { setEditItem(mesa); setForm({ numero: String(mesa.numero), nombre: mesa.nombre || '', zona: mesa.zona || '', capacidad: String(mesa.capacidad || 4) }); setShowForm(true); }} className="p-1.5 hover:bg-iados-card rounded-lg">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleDelete(mesa.id)} className="p-1.5 hover:bg-red-900/50 rounded-lg text-red-400">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <UserCheck size={13} className="text-slate-400 shrink-0" />
                  <select value={asig?.user_id || ''} onChange={(e) => handleAsignar(mesa.id, e.target.value)} className="input-touch text-sm flex-1 py-1">
                    <option value="">Sin mesero</option>
                    {meseros.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </div>

                {junta && (
                  <div className="flex items-center justify-between bg-yellow-900/20 rounded-lg px-2 py-1 text-xs">
                    <span className="text-yellow-400 flex items-center gap-1">
                      <Link2 size={12} /> Junta con Mesa {
                        junta.mesa_principal_id === mesa.id
                          ? mesas.find((m) => m.id === junta.mesa_secundaria_id)?.numero
                          : mesas.find((m) => m.id === junta.mesa_principal_id)?.numero
                      }
                    </span>
                    <button onClick={() => handleSeparar(junta.mesa_principal_id, junta.mesa_secundaria_id)} className="text-red-400 hover:text-red-300">
                      <Unlink size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {mesas.length === 0 && (
            <div className="col-span-3 text-center text-slate-500 py-12">No hay mesas configuradas.</div>
          )}
        </div>
      )}

      {/* Vista: Por Mesero */}
      {view === 'meseros' && (
        <div className="space-y-4">
          {meseroGroups.map(({ mesero, mesas: mm, color }) => (
            <div key={mesero.id} className="card">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold mb-3 ${color}`}>
                <User size={14} /> {mesero.nombre}
                <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">{mm.length} mesa{mm.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mm.map((mesa) => {
                  const junta = getJuntada(mesa.id);
                  return (
                    <div key={mesa.id} className="relative group">
                      <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center font-black text-lg cursor-default ${color}`}>
                        {mesa.numero}
                        {junta && <Link2 size={10} className="absolute top-1 right-1 opacity-70" />}
                      </div>
                      {mesa.nombre && <p className="text-xs text-center text-slate-400 mt-0.5 max-w-16 truncate">{mesa.nombre}</p>}
                      {/* Hover: quitar asignación */}
                      <button
                        onClick={() => handleAsignar(mesa.id, '')}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full text-xs items-center justify-center hidden group-hover:flex"
                        title="Desasignar"
                      >×</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Sin asignar */}
          {sinAsignar.length > 0 && (
            <div className="card border border-dashed border-slate-600">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-3">
                <User size={14} /> Sin mesero asignado
                <span className="bg-slate-700 rounded-full px-2 py-0.5 text-xs">{sinAsignar.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sinAsignar.map((mesa) => (
                  <div key={mesa.id} className="relative group">
                    <div className="w-16 h-16 rounded-xl flex flex-col items-center justify-center font-black text-lg bg-slate-700 text-slate-300">
                      {mesa.numero}
                    </div>
                    {mesa.nombre && <p className="text-xs text-center text-slate-500 mt-0.5 max-w-16 truncate">{mesa.nombre}</p>}
                    {/* Hover: asignar rápido */}
                    <div className="absolute inset-0 bg-black/60 rounded-xl items-center justify-center hidden group-hover:flex z-10">
                      <select
                        className="text-xs bg-slate-800 text-white rounded px-1 py-0.5 w-14"
                        defaultValue=""
                        onChange={(e) => { if (e.target.value) handleAsignar(mesa.id, e.target.value); }}
                      >
                        <option value="">Asignar</option>
                        {meseros.map((m) => <option key={m.id} value={m.id}>{m.nombre.split(' ')[0]}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meseroGroups.length === 0 && sinAsignar.length === 0 && (
            <div className="text-center text-slate-500 py-12">No hay mesas configuradas.</div>
          )}
        </div>
      )}

      {/* Modal Nueva/Editar Mesa */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full space-y-3">
            <h3 className="text-lg font-bold">{editItem ? 'Editar' : 'Nueva'} Mesa</h3>
            <input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="Número de mesa *" type="number" className="input-touch" />
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre (opcional, ej: Terraza)" className="input-touch" />
            <input value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })} placeholder="Zona (ej: Interior, Terraza)" className="input-touch" />
            <input value={form.capacidad} onChange={(e) => setForm({ ...form, capacidad: e.target.value })} placeholder="Capacidad" type="number" className="input-touch" />
            <div className="flex gap-2">
              <button onClick={() => { setShowForm(false); setEditItem(null); }} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Juntar Mesas */}
      {showJuntar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2"><Link2 size={18} />Juntar Mesas</h3>
            <p className="text-sm text-slate-400">Las mesas juntas comparten mesero y se consolidan en una cuenta.</p>
            <select value={juntarA} onChange={(e) => setJuntarA(e.target.value)} className="input-touch">
              <option value="">Mesa principal...</option>
              {mesas.map((m) => <option key={m.id} value={m.id}>Mesa {m.numero}{m.nombre ? ` - ${m.nombre}` : ''}</option>)}
            </select>
            <select value={juntarB} onChange={(e) => setJuntarB(e.target.value)} className="input-touch">
              <option value="">Mesa a unir...</option>
              {mesas.filter((m) => String(m.id) !== juntarA).map((m) => <option key={m.id} value={m.id}>Mesa {m.numero}{m.nombre ? ` - ${m.nombre}` : ''}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowJuntar(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleJuntar} className="btn-primary flex-1">Unir Mesas</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cobro desde Mesas */}
      {pedidoACobrar && (
        <PayModal
          onClose={() => { setPedidoACobrar(null); load(); }}
          isOnline={true}
          pedido={pedidoACobrar}
        />
      )}

      {/* Modal QR de Mesa */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 text-center" id="qr-print-area">
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              {user?.empresa_nombre || 'Restaurante'}
            </div>
            <div className="inline-block bg-slate-900 text-white text-2xl font-black px-6 py-2 rounded-full">
              Mesa {qrModal.mesa.numero}{qrModal.mesa.nombre ? ` · ${qrModal.mesa.nombre}` : ''}
            </div>
            <p className="text-sm font-bold text-slate-800">¡Haz tu pedido aquí!</p>
            <div className="flex justify-center">
              <img src={qrModal.qrDataUrl} alt="QR Mesa" className="w-52 h-52 rounded-xl border border-slate-200" />
            </div>
            <p className="text-xs text-slate-400">📱 Escanea con tu celular</p>
            <p className="text-xs text-slate-300 break-all">{qrModal.url}</p>
            <div className="flex gap-2 mt-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 text-white py-2 px-4 rounded-xl font-bold text-sm hover:bg-slate-700"
              >
                🖨️ Imprimir
              </button>
              <button
                onClick={() => setQrModal(null)}
                className="flex-1 border border-slate-300 text-slate-700 py-2 px-4 rounded-xl font-bold text-sm hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
