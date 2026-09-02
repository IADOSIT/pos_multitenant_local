// Tabla unica de pedidos: mostrador, QR mesa y web en un solo listado,
// distinguidos por el badge de la columna Origen.
//
// Filtra y pagina en cliente sobre lo que le pasa el padre. Es tonta a proposito:
// no sabe cargar ni actualizar nada, solo avisa que se selecciono o se avanzo una fila.
import { useState, useMemo } from 'react';
import { createColumnHelper, ColumnDef } from '@tanstack/react-table';
import { ClipboardList, Eye, Check, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import DataGrid from '../../components/ui/DataGrid';
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

  // Solo se ofrecen los estados presentes, para no listar 'Enviado' en una tienda sin web.
  const estadosPresentes = useMemo(() => {
    const set = new Set(pedidos.map(p => p.estado));
    return (Object.keys(ESTADOS_UNIFICADOS) as EstadoUnificado[]).filter(e => set.has(e));
  }, [pedidos]);

  const columnHelper = createColumnHelper<PedidoUnificado>();
  const columns = useMemo<ColumnDef<PedidoUnificado, any>[]>(() => {
    const cols: ColumnDef<PedidoUnificado, any>[] = [
      columnHelper.accessor('origen', {
        header: 'Origen',
        cell: ({ getValue }) => {
          const org = ORIGENES[getValue() as Origen];
          const OrgIcon = org.icon;
          return (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${org.bg} ${org.color}`}>
              <OrgIcon size={12} /> {org.label}
            </span>
          );
        },
      }),
      // El consecutivo va grande y el folio completo debajo en chico: el personal
      // compara ordenes por el numero ("la 70 entro antes que la 90"), pero el folio
      // sigue a la vista porque es lo que aparece en el ticket.
      columnHelper.accessor('numero', {
        header: '# Pedido',
        cell: ({ row }) => (
          <div className="leading-tight">
            <span className="text-lg font-bold text-white tabular-nums">
              {row.original.numeroCorto !== null ? `#${row.original.numeroCorto}` : row.original.numero}
            </span>
            {row.original.requiereAtencion && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-orange-300 align-middle">
                <AlertTriangle size={10} /> POR CONFIRMAR
              </span>
            )}
            {row.original.numeroCorto !== null && (
              <div className="font-mono text-[10px] text-slate-500">{row.original.numero}</div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('referencia', {
        header: 'Cliente / Mesa',
        cell: ({ row }) => (
          <span className="text-white">
            {row.original.referencia}
            {row.original.subtitulo && <><br /><span className="text-xs text-slate-400">{row.original.subtitulo}</span></>}
          </span>
        ),
      }),
    ];
    if (mostrarPrecios) {
      cols.push(columnHelper.accessor('total', {
        header: 'Total',
        cell: ({ getValue }) => (
          <div className="text-right text-green-400 font-semibold whitespace-nowrap">
            ${getValue().toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
        ),
      }));
    }
    cols.push(
      columnHelper.accessor('estado', {
        header: 'Estado',
        cell: ({ row }) => {
          const est = ESTADOS_UNIFICADOS[row.original.estado];
          const EstIcon = est.icon;
          return (
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${est.bg} ${est.color}`}>
              <EstIcon size={10} /> {est.label}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'hace',
        header: 'Hace',
        cell: ({ row }) => (
          <div className="text-right text-xs text-slate-500 whitespace-nowrap">{tiempoTranscurrido(row.original.created_at)}</div>
        ),
      }),
      columnHelper.display({
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          const siguiente = siguienteEstadoRaw(p);
          const destino = siguiente ? ESTADOS_UNIFICADOS[estadoUnificadoDe(p.origen, siguiente)] : null;
          const DestinoIcon = destino?.icon ?? Check;
          const abrible = tieneDetalle(p);
          return (
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
          );
        },
      }),
    );
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarPrecios, avanzandoKey]);

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <input
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          placeholder="Buscar pedido, mesa o cliente..."
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-iados-primary w-60"
        />
        {mostrarFiltroOrigen && (
          <select
            value={filtroOrigen}
            onChange={e => setFiltroOrigen(e.target.value as Origen | '')}
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
          onChange={e => setFiltroEstado(e.target.value as EstadoUnificado | '')}
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
      <div className="bg-iados-surface rounded-xl p-2">
        {filtrados.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-50" />
            {pedidos.length === 0 ? vacioTexto : 'Ningun pedido coincide con el filtro'}
          </div>
        ) : (
          <DataGrid
            key={`${filtroOrigen}-${filtroEstado}-${buscar}`}
            data={filtrados}
            columns={columns}
            pageSize={POR_PAGINA}
            onRowClick={p => { if (tieneDetalle(p)) onSelect(p); }}
            rowClassName={p => `${seleccionadoKey === p.key ? 'bg-iados-primary/15' : ''} ${p.requiereAtencion ? 'bg-orange-900/20' : ''}`}
          />
        )}
      </div>
    </div>
  );
}
