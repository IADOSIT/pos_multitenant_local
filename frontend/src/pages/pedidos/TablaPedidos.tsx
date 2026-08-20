// Tabla unica de pedidos: mostrador, QR mesa y web en un solo listado,
// distinguidos por el badge de la columna Origen.
//
// Filtra y pagina en cliente sobre lo que le pasa el padre. Es tonta a proposito:
// no sabe cargar ni actualizar nada, solo avisa que se selecciono o se avanzo una fila.
import { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Eye, Check, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  PedidoUnificado, Origen, EstadoUnificado,
  ORIGENES, ESTADOS_UNIFICADOS, estadoUnificadoDe, siguienteEstadoRaw, tiempoTranscurrido,
} from './pedidosUnificados';

const POR_PAGINA = 20;

interface Props {
  pedidos: PedidoUnificado[];
  mostrarPrecios: boolean;
  /** Con un solo origen a la vista (p.ej. el cajero) el filtro de origen sobra. */
  mostrarFiltroOrigen: boolean;
  seleccionadoKey?: string | null;
  avanzandoKey?: string | null;
  vacioTexto: string;
  /** Un pedido de mostrador ya entregado no tiene panel de detalle: no se ofrece abrirlo. */
  tieneDetalle: (p: PedidoUnificado) => boolean;
  onSelect: (p: PedidoUnificado) => void;
  onAvanzar: (p: PedidoUnificado) => void;
}

export default function TablaPedidos({
  pedidos, mostrarPrecios, mostrarFiltroOrigen, seleccionadoKey, avanzandoKey,
  vacioTexto, tieneDetalle, onSelect, onAvanzar,
}: Props) {
  const [buscar, setBuscar] = useState('');
  const [filtroOrigen, setFiltroOrigen] = useState<Origen | ''>('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoUnificado | ''>('');
  const [page, setPage] = useState(1);

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return pedidos.filter(p => {
      if (filtroOrigen && p.origen !== filtroOrigen) return false;
      if (filtroEstado && p.estado !== filtroEstado) return false;
      if (!q) return true;
      return [p.numero, p.referencia, p.subtitulo]
        .some(campo => (campo || '').toLowerCase().includes(q));
    });
  }, [pedidos, buscar, filtroOrigen, filtroEstado]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));

  // Al filtrar o al cambiar de pestaña la pagina actual puede quedar fuera de rango.
  useEffect(() => { if (page > totalPaginas) setPage(1); }, [page, totalPaginas]);

  const visibles = filtrados.slice((page - 1) * POR_PAGINA, page * POR_PAGINA);
  const columnas = mostrarPrecios ? 7 : 6;

  // Solo se ofrecen los estados presentes, para no listar 'Enviado' en una tienda sin web.
  const estadosPresentes = useMemo(() => {
    const set = new Set(pedidos.map(p => p.estado));
    return (Object.keys(ESTADOS_UNIFICADOS) as EstadoUnificado[]).filter(e => set.has(e));
  }, [pedidos]);

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <input
          value={buscar}
          onChange={e => { setBuscar(e.target.value); setPage(1); }}
          placeholder="Buscar pedido, mesa o cliente..."
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-iados-primary w-60"
        />
        {mostrarFiltroOrigen && (
          <select
            value={filtroOrigen}
            onChange={e => { setFiltroOrigen(e.target.value as Origen | ''); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
          >
            <option value="">Todos los origenes</option>
            {(Object.keys(ORIGENES) as Origen[]).map(o => (
              <option key={o} value={o}>{ORIGENES[o].label}</option>
            ))}
          </select>
        )}
        <select
          value={filtroEstado}
          onChange={e => { setFiltroEstado(e.target.value as EstadoUnificado | ''); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
        >
          <option value="">Todos los estados</option>
          {estadosPresentes.map(e => (
            <option key={e} value={e}>{ESTADOS_UNIFICADOS[e].label}</option>
          ))}
        </select>
        {filtrados.length !== pedidos.length && (
          <span className="self-center text-xs text-slate-500">
            {filtrados.length} de {pedidos.length}
          </span>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-iados-surface rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="border-b border-slate-700 text-xs text-slate-400">
              <th className="text-left px-4 py-3">Origen</th>
              <th className="text-left px-4 py-3"># Pedido</th>
              <th className="text-left px-4 py-3">Cliente / Mesa</th>
              {mostrarPrecios && <th className="text-right px-4 py-3">Total</th>}
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Hace</th>
              <th className="text-center px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <tr>
                <td colSpan={columnas} className="text-center py-16 text-slate-500">
                  <ClipboardList size={40} className="mx-auto mb-3 opacity-50" />
                  {pedidos.length === 0 ? vacioTexto : 'Ningun pedido coincide con el filtro'}
                </td>
              </tr>
            )}
            {visibles.map(p => {
              const org = ORIGENES[p.origen];
              const OrgIcon = org.icon;
              const est = ESTADOS_UNIFICADOS[p.estado];
              const EstIcon = est.icon;
              const siguiente = siguienteEstadoRaw(p);
              // El boton de avanzar nombra el estado destino: con solo una palomita
              // no se sabia a donde iba a mover el pedido.
              const destino = siguiente ? ESTADOS_UNIFICADOS[estadoUnificadoDe(p.origen, siguiente)] : null;
              const DestinoIcon = destino?.icon ?? Check;
              const abrible = tieneDetalle(p);
              return (
                <tr
                  key={p.key}
                  onClick={() => { if (abrible) onSelect(p); }}
                  className={`border-b border-slate-700/50 transition-colors ${
                    abrible ? 'cursor-pointer hover:bg-slate-700/30' : ''
                  } ${
                    seleccionadoKey === p.key ? 'bg-iados-primary/15' : ''
                  } ${p.requiereAtencion ? 'bg-orange-900/20' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${org.bg} ${org.color}`}>
                      <OrgIcon size={12} /> {org.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">
                    {p.numero}
                    {p.requiereAtencion && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-orange-300">
                        <AlertTriangle size={10} /> POR CONFIRMAR
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white">
                    {p.referencia}
                    {p.subtitulo && <><br /><span className="text-xs text-slate-400">{p.subtitulo}</span></>}
                  </td>
                  {mostrarPrecios && (
                    <td className="px-4 py-3 text-right text-green-400 font-semibold whitespace-nowrap">
                      ${p.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${est.bg} ${est.color}`}>
                      <EstIcon size={10} /> {est.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500 whitespace-nowrap">
                    {tiempoTranscurrido(p.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {abrible && (
                        <button
                          onClick={e => { e.stopPropagation(); onSelect(p); }}
                          className="p-1.5 text-slate-400 hover:text-white transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      {siguiente && destino && (
                        <button
                          onClick={e => { e.stopPropagation(); onAvanzar(p); }}
                          disabled={avanzandoKey === p.key}
                          className={`inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium px-2.5 py-1 rounded-full transition-all hover:brightness-125 disabled:opacity-50 ${destino.bg} ${destino.color}`}
                          title={`Avanzar este pedido a ${destino.label}`}
                        >
                          {avanzandoKey === p.key
                            ? <Loader2 size={11} className="animate-spin" />
                            : <><ArrowRight size={11} /><DestinoIcon size={11} /></>}
                          {destino.label}
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

      {/* Paginacion */}
      {totalPaginas > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`px-3 py-1 rounded text-xs ${
                page === n ? 'bg-iados-primary text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
