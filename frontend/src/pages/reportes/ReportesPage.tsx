import { useState, useEffect, useRef } from 'react';
import { cajaApi, dashboardApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';
import {
  FileText, FileSpreadsheet, Download, Calendar, TrendingUp,
  DollarSign, Receipt, ShoppingBag, Ban, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportesPage() {
  const { user } = useAuthStore();
  const [cajas, setCajas] = useState<any[]>([]);
  const [selectedCaja, setSelectedCaja] = useState<any>(null);
  const [reporte, setReporte] = useState<any>(null);
  const [kpi, setKpi] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'caja' | 'kpi'>('caja');
  const [rango, setRango] = useState('hoy');
  const [expandedVentas, setExpandedVentas] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const kpiChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadCajas(); }, []);
  useEffect(() => { if (tab === 'kpi') loadKPI(); }, [tab, rango]);

  const loadCajas = async () => {
    try {
      const { data } = await cajaApi.list();
      setCajas(data || []);
    } catch { toast.error('Error cargando cajas'); }
  };

  const loadReporte = async (cajaId: number) => {
    setLoading(true);
    try {
      const { data } = await cajaApi.reporte(cajaId);
      setReporte(data);
      setSelectedCaja(data.caja);
    } catch { toast.error('Error cargando reporte'); }
    finally { setLoading(false); }
  };

  const getRangoFechas = () => {
    const now = new Date();
    const hasta = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let desde = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    if (rango === 'semana') desde.setDate(desde.getDate() - 7);
    if (rango === 'mes') desde.setMonth(desde.getMonth() - 1);
    return { desde: desde.toISOString(), hasta: hasta.toISOString() };
  };

  const loadKPI = async () => {
    setLoading(true);
    try {
      const { desde, hasta } = getRangoFechas();
      const { data } = await dashboardApi.kpi(desde, hasta);
      setKpi(data);
    } catch { toast.error('Error cargando KPI'); }
    finally { setLoading(false); }
  };

  // ---- PDF Reporte Caja ----
  const exportCajaPDF = async () => {
    if (!reporte) return;
    const { caja, resumen, ventas, top_productos } = reporte;
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text('Reporte de Caja', pw / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`${caja.nombre} | ${caja.estado.toUpperCase()}`, pw / 2, 28, { align: 'center' });
    doc.text(`Apertura: ${new Date(caja.fecha_apertura).toLocaleString('es-MX')}${caja.fecha_cierre ? ' | Cierre: ' + new Date(caja.fecha_cierre).toLocaleString('es-MX') : ''}`, pw / 2, 34, { align: 'center' });

    // Resumen
    doc.setFontSize(12);
    doc.text('Resumen', 14, 46);
    autoTable(doc, {
      startY: 50,
      head: [['Concepto', 'Valor']],
      body: [
        ['Ventas completadas', String(resumen.num_ventas)],
        ['Ventas canceladas', String(resumen.num_canceladas)],
        ['Total Ventas', `$${Number(resumen.total_ventas).toFixed(2)}`],
        ['Efectivo', `$${Number(resumen.total_efectivo).toFixed(2)}`],
        ['Tarjeta', `$${Number(resumen.total_tarjeta).toFixed(2)}`],
        ['Transferencia', `$${Number(resumen.total_transferencia).toFixed(2)}`],
        ['Entradas', `$${Number(resumen.total_entradas).toFixed(2)}`],
        ['Salidas', `$${Number(resumen.total_salidas).toFixed(2)}`],
        ['Fondo Apertura', `$${Number(resumen.fondo_apertura).toFixed(2)}`],
        ['Esperado en Caja', `$${Number(resumen.esperado_en_caja).toFixed(2)}`],
        ['Total Real', `$${Number(resumen.total_real).toFixed(2)}`],
        ['Diferencia', `$${Number(resumen.diferencia).toFixed(2)}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
    });

    // Top productos
    if (top_productos?.length) {
      const y = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Top Productos', 14, y);
      autoTable(doc, {
        startY: y + 4,
        head: [['#', 'Producto', 'Cantidad', 'Total']],
        body: top_productos.map((p: any, i: number) => [
          i + 1, p.nombre, p.cantidad, `$${Number(p.total).toFixed(2)}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 },
      });
    }

    // Chart image
    if (chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current, { backgroundColor: '#0f172a', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        doc.addPage();
        doc.setFontSize(12);
        doc.text('Desglose Visual', 14, 20);
        const imgW = pw - 28;
        const imgH = (canvas.height / canvas.width) * imgW;
        doc.addImage(imgData, 'PNG', 14, 26, imgW, Math.min(imgH, 200));
      } catch {}
    }

    // Detalle ventas
    if (ventas?.length) {
      doc.addPage();
      doc.setFontSize(12);
      doc.text('Detalle de Ventas', 14, 20);
      autoTable(doc, {
        startY: 24,
        head: [['Folio', 'Fecha', 'Estado', 'Subtotal', 'Desc.', 'IVA', 'Total', 'Efectivo', 'Tarjeta', 'Transf.']],
        body: ventas.map((v: any) => [
          v.folio,
          new Date(v.created_at).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          v.estado,
          `$${Number(v.subtotal).toFixed(2)}`,
          `$${Number(v.descuento_total || 0).toFixed(2)}`,
          `$${Number(v.impuestos || 0).toFixed(2)}`,
          `$${Number(v.total).toFixed(2)}`,
          `$${Number(v.pago_efectivo || 0).toFixed(2)}`,
          `$${Number(v.pago_tarjeta || 0).toFixed(2)}`,
          `$${Number(v.pago_transferencia || 0).toFixed(2)}`,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], fontSize: 7 },
        styles: { fontSize: 7 },
      });
    }

    doc.setFontSize(8);
    doc.text(`Generado: ${new Date().toLocaleString('es-MX')} | POS-iaDoS`, pw / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    doc.save(`Reporte_Caja_${caja.nombre}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('PDF generado');
  };

  // ---- Excel Reporte Caja ----
  const exportCajaExcel = () => {
    if (!reporte) return;
    const { caja, resumen, ventas, top_productos } = reporte;
    const wb = XLSX.utils.book_new();

    // Resumen sheet
    const resumenData = [
      ['Reporte de Caja', caja.nombre],
      ['Estado', caja.estado],
      ['Apertura', new Date(caja.fecha_apertura).toLocaleString('es-MX')],
      ['Cierre', caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleString('es-MX') : 'Abierta'],
      [],
      ['Concepto', 'Valor'],
      ['Ventas completadas', resumen.num_ventas],
      ['Ventas canceladas', resumen.num_canceladas],
      ['Total Ventas', resumen.total_ventas],
      ['Efectivo', resumen.total_efectivo],
      ['Tarjeta', resumen.total_tarjeta],
      ['Transferencia', resumen.total_transferencia],
      ['Entradas', resumen.total_entradas],
      ['Salidas', resumen.total_salidas],
      ['Fondo Apertura', resumen.fondo_apertura],
      ['Esperado en Caja', resumen.esperado_en_caja],
      ['Total Real', resumen.total_real],
      ['Diferencia', resumen.diferencia],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumenData), 'Resumen');

    // Ventas sheet
    if (ventas?.length) {
      const ventasData = [
        ['Folio', 'Fecha', 'Estado', 'Subtotal', 'Descuento', 'IVA', 'Total', 'Efectivo', 'Tarjeta', 'Transferencia'],
        ...ventas.map((v: any) => [
          v.folio,
          new Date(v.created_at).toLocaleString('es-MX'),
          v.estado,
          Number(v.subtotal),
          Number(v.descuento_total || 0),
          Number(v.impuestos || 0),
          Number(v.total),
          Number(v.pago_efectivo || 0),
          Number(v.pago_tarjeta || 0),
          Number(v.pago_transferencia || 0),
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ventasData), 'Ventas');
    }

    // Top productos sheet
    if (top_productos?.length) {
      const topData = [
        ['#', 'Producto', 'Cantidad', 'Total'],
        ...top_productos.map((p: any, i: number) => [i + 1, p.nombre, p.cantidad, p.total]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topData), 'Top Productos');
    }

    XLSX.writeFile(wb, `Reporte_Caja_${caja.nombre}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Excel generado');
  };

  // ---- PDF KPI ----
  const exportKpiPDF = async () => {
    if (!kpi) return;
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const rangoLabel = rango === 'hoy' ? 'Hoy' : rango === 'semana' ? 'Ultima Semana' : 'Ultimo Mes';

    doc.setFontSize(18);
    doc.text('Reporte KPI', pw / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Periodo: ${rangoLabel} | ${new Date().toLocaleDateString('es-MX')}`, pw / 2, 28, { align: 'center' });

    autoTable(doc, {
      startY: 36,
      head: [['Indicador', 'Valor']],
      body: [
        ['Total Ventas', `$${Number(kpi.total_ventas).toFixed(2)}`],
        ['Num. Tickets', String(kpi.num_tickets)],
        ['Ticket Promedio', `$${Number(kpi.ticket_promedio).toFixed(2)}`],
        ['Cancelaciones', String(kpi.cancelaciones)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Metodos de pago
    if (kpi.metodos_pago) {
      const y = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Metodos de Pago', 14, y);
      autoTable(doc, {
        startY: y + 4,
        head: [['Metodo', 'Monto']],
        body: Object.entries(kpi.metodos_pago).map(([k, v]) => [k, `$${Number(v).toFixed(2)}`]),
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11] },
        styles: { fontSize: 9 },
      });
    }

    // Top productos
    if (kpi.top_productos?.length) {
      const y = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Top 10 Productos', 14, y);
      autoTable(doc, {
        startY: y + 4,
        head: [['#', 'Producto', 'Cantidad', 'Total']],
        body: kpi.top_productos.slice(0, 10).map((p: any, i: number) => [
          i + 1, p.nombre, p.cantidad, `$${Number(p.total).toFixed(2)}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9 },
      });
    }

    // Chart image
    if (kpiChartRef.current) {
      try {
        const canvas = await html2canvas(kpiChartRef.current, { backgroundColor: '#0f172a', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        doc.addPage();
        doc.setFontSize(12);
        doc.text('Graficas', 14, 20);
        const imgW = pw - 28;
        const imgH = (canvas.height / canvas.width) * imgW;
        doc.addImage(imgData, 'PNG', 14, 26, imgW, Math.min(imgH, 240));
      } catch {}
    }

    doc.setFontSize(8);
    doc.text(`Generado: ${new Date().toLocaleString('es-MX')} | POS-iaDoS`, pw / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    doc.save(`Reporte_KPI_${rango}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('PDF KPI generado');
  };

  // ---- Helpers ----
  const pagosData = reporte?.resumen ? [
    { name: 'Efectivo', value: Number(reporte.resumen.total_efectivo) },
    { name: 'Tarjeta', value: Number(reporte.resumen.total_tarjeta) },
    { name: 'Transferencia', value: Number(reporte.resumen.total_transferencia) },
  ].filter(d => d.value > 0) : [];

  const kpiHorasData = kpi?.ventas_por_hora?.map((v: number, i: number) => ({ hora: `${i}:00`, ventas: v })) || [];
  const kpiPagosData = kpi ? Object.entries(kpi.metodos_pago || {}).filter(([, v]) => (v as number) > 0).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab('caja')} className={`btn-touch text-sm px-4 py-2 ${tab === 'caja' ? 'bg-iados-primary' : 'bg-iados-card'}`}>
            <Receipt size={16} className="inline mr-1" /> Cierre de Caja
          </button>
          <button onClick={() => setTab('kpi')} className={`btn-touch text-sm px-4 py-2 ${tab === 'kpi' ? 'bg-iados-primary' : 'bg-iados-card'}`}>
            <TrendingUp size={16} className="inline mr-1" /> KPI
          </button>
        </div>
      </div>

      {/* ============ TAB: CIERRE DE CAJA ============ */}
      {tab === 'caja' && (
        <div className="space-y-4">
          {/* Selector de caja */}
          <div className="card">
            <h3 className="font-bold mb-3">Seleccionar Caja</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {cajas.map((c) => (
                <button
                  key={c.id}
                  onClick={() => loadReporte(c.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selectedCaja?.id === c.id
                      ? 'border-iados-primary bg-iados-primary/20'
                      : 'border-slate-700 bg-iados-card hover:border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">{c.nombre}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${c.estado === 'abierta' ? 'bg-green-600' : 'bg-slate-600'}`}>
                      {c.estado}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(c.fecha_apertura).toLocaleDateString('es-MX')} {new Date(c.fecha_apertura).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
              ))}
              {cajas.length === 0 && <p className="text-slate-500 text-sm col-span-full">No hay cajas registradas</p>}
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-iados-primary" size={36} />
            </div>
          )}

          {reporte && !loading && (
            <>
              {/* Botones exportar */}
              <div className="flex gap-2 flex-wrap">
                <button onClick={exportCajaPDF} className="btn-primary flex items-center gap-2">
                  <FileText size={18} /> Exportar PDF
                </button>
                <button onClick={exportCajaExcel} className="btn-secondary flex items-center gap-2">
                  <FileSpreadsheet size={18} /> Exportar Excel
                </button>
              </div>

              {/* Resumen */}
              <div className="card">
                <h3 className="font-bold mb-3">Resumen - {selectedCaja?.nombre}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Ventas', value: reporte.resumen.total_ventas, icon: DollarSign, color: 'text-green-400', prefix: '$' },
                    { label: 'Tickets', value: reporte.resumen.num_ventas, icon: Receipt, color: 'text-blue-400' },
                    { label: 'Canceladas', value: reporte.resumen.num_canceladas, icon: Ban, color: 'text-red-400' },
                    { label: 'Esperado', value: reporte.resumen.esperado_en_caja, icon: ShoppingBag, color: 'text-amber-400', prefix: '$' },
                  ].map((card, i) => (
                    <div key={i} className="bg-iados-card p-3 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <card.icon size={16} className={card.color} />
                        <span className="text-xs text-slate-400">{card.label}</span>
                      </div>
                      <p className={`text-lg font-bold ${card.color}`}>
                        {card.prefix || ''}{Number(card.value || 0).toFixed(card.prefix ? 2 : 0)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Detalle numerico */}
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  {[
                    ['Fondo Apertura', reporte.resumen.fondo_apertura],
                    ['Total Efectivo', reporte.resumen.total_efectivo],
                    ['Total Tarjeta', reporte.resumen.total_tarjeta],
                    ['Total Transferencia', reporte.resumen.total_transferencia],
                    ['Entradas', reporte.resumen.total_entradas],
                    ['Salidas', reporte.resumen.total_salidas],
                    ['Total Real', reporte.resumen.total_real],
                    ['Diferencia', reporte.resumen.diferencia],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between py-1 border-b border-slate-700/50">
                      <span className="text-slate-400">{label}</span>
                      <span className={`font-medium ${label === 'Diferencia' && Number(val) < 0 ? 'text-red-400' : ''}`}>
                        ${Number(val || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graficas (para captura PDF) */}
              <div ref={chartRef} className="grid md:grid-cols-2 gap-4">
                {pagosData.length > 0 && (
                  <div className="card">
                    <h3 className="font-bold mb-3">Metodos de Pago</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pagosData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: $${Number(value).toFixed(0)}`}>
                          {pagosData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {reporte.top_productos?.length > 0 && (
                  <div className="card">
                    <h3 className="font-bold mb-3">Top Productos</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={reporte.top_productos.slice(0, 8)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                        <YAxis type="category" dataKey="nombre" stroke="#94a3b8" fontSize={9} width={100} />
                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
                        <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Detalle ventas colapsable */}
              {reporte.ventas?.length > 0 && (
                <div className="card">
                  <button onClick={() => setExpandedVentas(!expandedVentas)} className="flex items-center justify-between w-full">
                    <h3 className="font-bold">Detalle de Ventas ({reporte.ventas.length})</h3>
                    {expandedVentas ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedVentas && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-400 border-b border-slate-700">
                            <th className="pb-2 pr-3">Folio</th>
                            <th className="pb-2 pr-3">Hora</th>
                            <th className="pb-2 pr-3">Estado</th>
                            <th className="pb-2 pr-3 text-right">Total</th>
                            <th className="pb-2 pr-3 text-right">Efectivo</th>
                            <th className="pb-2 pr-3 text-right">Tarjeta</th>
                            <th className="pb-2 text-right">Transf.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reporte.ventas.map((v: any) => (
                            <tr key={v.id} className="border-b border-slate-700/50 hover:bg-iados-card/50">
                              <td className="py-2 pr-3 font-mono text-xs">{v.folio}</td>
                              <td className="py-2 pr-3 text-xs">{new Date(v.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td>
                              <td className="py-2 pr-3">
                                <span className={`text-xs px-2 py-0.5 rounded ${v.estado === 'completada' ? 'bg-green-600/30 text-green-400' : 'bg-red-600/30 text-red-400'}`}>
                                  {v.estado}
                                </span>
                              </td>
                              <td className="py-2 pr-3 text-right font-bold">${Number(v.total).toFixed(2)}</td>
                              <td className="py-2 pr-3 text-right">${Number(v.pago_efectivo || 0).toFixed(2)}</td>
                              <td className="py-2 pr-3 text-right">${Number(v.pago_tarjeta || 0).toFixed(2)}</td>
                              <td className="py-2 text-right">${Number(v.pago_transferencia || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============ TAB: KPI ============ */}
      {tab === 'kpi' && (
        <div className="space-y-4">
          {/* Rango */}
          <div className="flex gap-2">
            {['hoy', 'semana', 'mes'].map((r) => (
              <button key={r} onClick={() => setRango(r)} className={`btn-touch text-sm px-4 py-2 ${rango === r ? 'bg-iados-primary' : 'bg-iados-card'}`}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
            <button onClick={exportKpiPDF} disabled={!kpi} className="btn-primary flex items-center gap-2 ml-auto">
              <Download size={16} /> PDF KPI
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-iados-primary" size={36} />
            </div>
          )}

          {kpi && !loading && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Total Ventas', value: kpi.total_ventas, icon: DollarSign, color: 'text-green-400', prefix: '$' },
                  { label: 'Tickets', value: kpi.num_tickets, icon: Receipt, color: 'text-blue-400' },
                  { label: 'Ticket Promedio', value: kpi.ticket_promedio, icon: ShoppingBag, color: 'text-amber-400', prefix: '$' },
                  { label: 'Cancelaciones', value: kpi.cancelaciones, icon: Ban, color: 'text-red-400' },
                ].map((card, i) => (
                  <div key={i} className="card">
                    <div className="flex items-center gap-2 mb-1">
                      <card.icon size={18} className={card.color} />
                      <span className="text-xs text-slate-400">{card.label}</span>
                    </div>
                    <p className={`text-xl font-bold ${card.color}`}>
                      {card.prefix || ''}{Number(card.value || 0).toFixed(card.prefix ? 2 : 0)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div ref={kpiChartRef} className="grid md:grid-cols-2 gap-4">
                <div className="card">
                  <h3 className="font-bold mb-3">Ventas por Hora</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={kpiHorasData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="hora" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
                      <Bar dataKey="ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <h3 className="font-bold mb-3">Metodos de Pago</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={kpiPagosData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: $${Number(value).toFixed(0)}`}>
                        {kpiPagosData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Top productos */}
                {kpi.top_productos?.length > 0 && (
                  <div className="card md:col-span-2">
                    <h3 className="font-bold mb-3">Top 10 Productos</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {kpi.top_productos.slice(0, 10).map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 bg-iados-card p-2 rounded-lg">
                          <span className="w-6 h-6 rounded-full bg-iados-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                          <span className="flex-1 text-sm truncate">{p.nombre}</span>
                          <span className="text-xs text-slate-400">{p.cantidad}u</span>
                          <span className="text-sm font-bold text-green-400">${Number(p.total).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
