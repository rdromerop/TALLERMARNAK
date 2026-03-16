'use client';

import { useState, useEffect, useMemo } from 'react';
import { Download, Calendar as CalendarIcon, Loader2, FileText, Search, TrendingUp, Wallet, Package, BarChart3, Activity, FileSpreadsheet, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSalesByDateRange } from '@/supabase/functions';
import * as XLSX from 'xlsx';

// Utility for text search normalization
const normalizeText = (text: any) => {
  if (!text) return '';
  return String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Default to last 7 days
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Advanced Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting and Pagination
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  useEffect(() => {
    if (startDate && endDate) {
      if (startDate > endDate) {
        setEndDate(startDate); // Auto-correct
      } else {
        fetchSalesData();
      }
    }
  }, [startDate, endDate]);

  async function fetchSalesData() {
    try {
      setIsLoading(true);
      const data = await getSalesByDateRange(startDate, endDate);
      setSales(data);
    } catch (error) {
      console.error('Error fetching sales for range:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleExportPDF = () => {
    // Basic PDF export by triggering the print state of the browser
    // This will work well if the layout is clean.
    window.print();
  };

  const totalEarnings = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const totalItems = sales.reduce((sum, sale) => 
    sum + sale.sale_items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0
  );

  // Group sales by date for the Chart
  const dailyDataMap = sales.reduce((acc: Record<string, number>, sale) => {
    const d = sale.date.split('T')[0];
    acc[d] = (acc[d] || 0) + Number(sale.total_amount);
    return acc;
  }, {});

  // Generate an array of objects for the chart, sorted by date
  const chartData = Object.keys(dailyDataMap)
    .sort()
    .map(date => ({
      date,
      shortDate: new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
      amount: dailyDataMap[date]
    }));

  const maxChartVal = chartData.length > 0 ? Math.max(...chartData.map(d => d.amount)) : 0;
  
  // Filter sales based on advanced search (Client or Product)
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
       const term = normalizeText(searchTerm);
       if (!term) return true;
       
       const matchCustomer = normalizeText(s.customer_name).includes(term);
       const matchMotorcycle = normalizeText(s.motorcycle).includes(term);
       const matchProducts = s.sale_items && s.sale_items.some((item: any) => normalizeText(item.item_name).includes(term));
       
       return matchCustomer || matchMotorcycle || matchProducts;
    });
  }, [sales, searchTerm]);

  // Sort sales
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedSales = useMemo(() => {
    const sortable = [...filteredSales];
    sortable.sort((a, b) => {
      if (sortConfig.key === 'customer') {
         return sortConfig.direction === 'asc' ? (a.customer_name || '').localeCompare(b.customer_name || '') : (b.customer_name || '').localeCompare(a.customer_name || '');
      } else if (sortConfig.key === 'date') {
         return sortConfig.direction === 'asc' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortConfig.key === 'amount') {
         return sortConfig.direction === 'asc' ? Number(a.total_amount) - Number(b.total_amount) : Number(b.total_amount) - Number(a.total_amount);
      }
      return 0;
    });
    return sortable;
  }, [filteredSales, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const paginatedSales = sortedSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  const handleExportExcel = () => {
    if (filteredSales.length === 0) return;

    const dataToExport = filteredSales.map(sale => {
      const itemsStr = sale.sale_items
        ? sale.sale_items.map((i: any) => `${i.quantity}x ${i.item_name}`).join(', ')
        : '';
        
      return {
        'Fecha': new Date(sale.date).toLocaleDateString('es-CO'),
        'Hora': new Date(sale.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        'Cliente': sale.customer_name || 'Consumidor Final',
        'Motocicleta': sale.motorcycle || 'N/A',
        'Artículos': itemsStr,
        'Monto Total': Number(sale.total_amount),
        'Estado': sale.status
      };
    });

    // Create a new workbook and add the worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");

    // Adjust column widths roughly
    worksheet['!cols'] = [
      { wch: 12 }, // Fecha
      { wch: 10 }, // Hora
      { wch: 25 }, // Cliente
      { wch: 15 }, // Moto
      { wch: 40 }, // Artículos
      { wch: 15 }, // Monto
      { wch: 15 }  // Estado
    ];

    // Generate buffer and trigger download
    XLSX.writeFile(workbook, `Reporte_Ventas_Marnak_${startDate}_al_${endDate}.xlsx`);
  };
  
  // Calculate best-selling item
  const itemCounts = sales.reduce((acc: Record<string, number>, sale) => {
    sale.sale_items.forEach((item: any) => {
      acc[item.item_name] = (acc[item.item_name] || 0) + item.quantity;
    });
    return acc;
  }, {});
  
  const entries = Object.entries(itemCounts);
  const topProduct = entries.length > 0 
    ? entries.reduce((a, b) => a[1] > b[1] ? a : b) 
    : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header - Hidden in Print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reportes Financieros</h1>
          <p className="text-slate-500 mt-1">Exporta y analiza el rendimiento de tu negocio por fecha.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm text-sm print:hidden">
             <CalendarIcon className="w-4 h-4 text-slate-400" />
             <input 
               type="date"
               value={startDate}
               onChange={(e) => setStartDate(e.target.value)}
               className="bg-transparent border-none focus:outline-none w-28 text-slate-600"
             />
             <span className="text-slate-300">-</span>
             <input 
               type="date"
               value={endDate}
               onChange={(e) => setEndDate(e.target.value)}
               className="bg-transparent border-none focus:outline-none w-28 text-slate-600"
             />
          </div>
          <button 
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 w-full sm:w-auto justify-center bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-all shadow-sm active:scale-95 print:hidden"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 w-full sm:w-auto justify-center bg-slate-900 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-all shadow-sm active:scale-95 print:hidden"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Info for Print Only */}
      <div className="hidden print:block mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Reporte de Desempeño y Ventas - MARNAK</h1>
        <p className="text-slate-500 mt-1">Período: {startDate} al {endDate}</p>
        <div className="mt-4 border-b pb-4 flex justify-between">
          <span className="text-sm font-bold text-slate-700">MARNAK Dashboard</span>
          <span className="text-sm text-slate-500">{new Date().toLocaleString()}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-24 text-center shadow-sm">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">Consultando Base de Datos...</h3>
          <p className="text-slate-500">Generando reporte del {startDate} al {endDate}.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full opacity-20 blur-2xl group-hover:scale-150 transition-transform duration-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingresos Totales (Período)</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">$ {totalEarnings.toLocaleString('es-CO')}</div>
              <p className="text-xs text-slate-500 mt-1">{sales.length} transacciones exitosas</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full opacity-20 blur-2xl group-hover:scale-150 transition-transform duration-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Artículos Vendidos</span>
                <Package className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{totalItems} Unidades</div>
              <p className="text-xs text-slate-500 mt-1">Salida total de inventario</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full opacity-20 blur-2xl group-hover:scale-150 transition-transform duration-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Promedio</span>
                <Wallet className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                $ {sales.length > 0 ? (totalEarnings / sales.length).toLocaleString('es-CO') : 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Gasto por cliente</p>
            </div>
          </div>
          
          {/* Main Chart Section (Trend) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                     <BarChart3 className="w-5 h-5 text-slate-400" />
                     Ventas Diarias
                  </h3>
                  <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">Rango Activo</span>
                </div>
                
                {chartData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Activity className="w-8 h-8 mb-2 opacity-30" />
                    No hay datos de ingresos en este rango
                  </div>
                ) : (
                  <div className="h-64 flex items-end gap-2 sm:gap-4 relative pt-6">
                    {/* Y-axis rough guides */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 text-[10px] text-slate-300">
                       <div className="border-b border-slate-100 w-full relative"><span className="absolute -top-2 bg-white pr-2">${(maxChartVal/1000).toFixed(0)}k</span></div>
                       <div className="border-b border-slate-100 w-full relative"><span className="absolute -top-2 bg-white pr-2">${(maxChartVal/2000).toFixed(0)}k</span></div>
                       <div className="border-b border-slate-100 w-full relative"><span className="absolute -top-2 bg-white pr-2">0</span></div>
                    </div>
                    
                    {/* Bars */}
                    <div className="w-full flex justify-between items-end h-[calc(100%-2rem)] z-10 px-8">
                       {chartData.map((data, i) => {
                         const heightPct = Math.max((data.amount / maxChartVal) * 100, 2); // Min 2% height for visibility
                         return (
                           <div key={i} className="flex flex-col items-center group relative w-full h-full justify-end">
                              {/* Tooltip */}
                              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none">
                                ${data.amount.toLocaleString('es-CO')}
                              </div>
                              {/* Bar */}
                              <div 
                                className="w-full max-w-[40px] bg-blue-500 rounded-t-md hover:bg-blue-600 transition-all cursor-crosshair min-h-[4px]"
                                style={{ height: `${heightPct}%` }}
                              ></div>
                              {/* X-axis Label */}
                              <span className="absolute -bottom-6 text-[10px] text-slate-500 whitespace-nowrap rotate-45 origin-left sm:rotate-0 sm:origin-center">{data.shortDate}</span>
                           </div>
                         )
                       })}
                    </div>
                  </div>
                )}
             </div>

             <div className="bg-slate-900 rounded-2xl p-6 shadow-sm text-white relative overflow-hidden flex flex-col justify-between">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-rose-500 rounded-full opacity-20 blur-3xl" />
                
                <div>
                  <h3 className="font-bold text-slate-300 flex items-center gap-2 mb-6">
                     <Package className="w-5 h-5 text-rose-400" />
                     Producto Estrella
                  </h3>
                  
                  {topProduct ? (
                    <div className="space-y-4 relative z-10">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Más Vendido</p>
                        <p className="text-xl font-bold text-rose-50 truncate pb-1 border-b border-slate-700/50">{topProduct[0]}</p>
                      </div>
                      <div className="flex items-end justify-between">
                         <div>
                           <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Unidades</p>
                           <p className="text-3xl font-black text-rose-400">{topProduct[1]}</p>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">Sin ventas registradas en el período.</p>
                  )}
                </div>
                
                <div className="mt-8 pt-4 border-t border-slate-800 relative z-10">
                   <p className="text-xs text-slate-400 leading-relaxed">Este artículo es el que ha generado más volumen de salida del inventario en estas fechas.</p>
                </div>
             </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 print:bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-400 opacity-0 sm:opacity-100" />
                  Detalle de Ventas
                </h3>
                <span className="bg-white px-3 py-1 rounded-full border border-slate-200 text-xs font-medium text-slate-500 shadow-sm print:hidden">
                  Período: <strong>{startDate} al {endDate}</strong>
                </span>
              </div>
              <div className="relative max-w-xs w-full print:hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar cliente, moto o producto..." 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
                />
              </div>
            </div>

            {filteredSales.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No se encontraron ventas</p>
                <p className="text-sm">Vérifica los filtros de búsqueda y fechas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-50/30 print:bg-white border-b border-slate-100">
                    <tr>
                      <th 
                        className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors group select-none relative" 
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-1">Fecha <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" /></div>
                      </th>
                      <th 
                        className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors group select-none relative" 
                        onClick={() => handleSort('customer')}
                      >
                        <div className="flex items-center gap-1">Cliente <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" /></div>
                      </th>
                      <th className="px-6 py-4 font-semibold">Motocicleta</th>
                      <th className="px-6 py-4 font-semibold">Artículos</th>
                      <th 
                        className="px-6 py-4 font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none relative" 
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center justify-end gap-1"><ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" /> Monto Total</div>
                      </th>
                      <th className="px-6 py-4 font-semibold text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-500">
                          <div className="text-slate-900 font-medium">{new Date(sale.date).toLocaleDateString()}</div>
                          <div className="text-xs">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 uppercase">{sale.customer_name || 'Consumidor Final'}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {sale.motorcycle || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            {sale.sale_items?.map((item: any, idx: number) => (
                              <div key={idx} className="text-xs text-slate-600">
                                <span className="font-medium text-blue-600">{item.quantity}x</span> {item.item_name}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 text-right">
                          $ {Number(sale.total_amount).toLocaleString('es-CO')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                            {sale.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/50 print:bg-white border-t border-slate-100">
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-sm font-bold text-slate-900 text-right uppercase tracking-[2px]">TOTAL MOSTRADO (FILTRADO)</td>
                      <td className="px-6 py-4 text-lg font-black text-blue-600 text-right">
                        $ {filteredSales.reduce((sum, s) => sum + Number(s.total_amount), 0).toLocaleString('es-CO')}
                      </td>
                      <td></td>
                    </tr>
                    {searchTerm && (
                      <tr className="border-t border-slate-200">
                        <td colSpan={4} className="px-6 py-2 text-xs font-bold text-slate-400 text-right uppercase tracking-[1px]">TOTAL GENERAL DEL RANGO</td>
                        <td className="px-6 py-2 text-sm font-bold text-slate-500 text-right">
                          $ {totalEarnings.toLocaleString('es-CO')}
                        </td>
                        <td></td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-sm gap-4 print:hidden">
                <span className="text-slate-500">
                  Mostrando <span className="font-semibold text-slate-900 border border-slate-200 px-2 py-1 rounded bg-white">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredSales.length)}</span> de <span className="font-semibold text-slate-900">{filteredSales.length}</span> resultados
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      // Simple pagination shortener
                      if (totalPages > 7) {
                        if (page !== 1 && page !== totalPages && Math.abs(currentPage - page) > 1) {
                           if (page === 2 || page === totalPages - 1) return <span key={page} className="px-1 text-slate-400">...</span>;
                           return null;
                        }
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                            currentPage === page 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer / Notes for PDF */}
      <div className="hidden print:block mt-12 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-400 italic">
          Este reporte fue generado automáticamente por el Sistema Marnak. La información mostrada corresponde a las transacciones registradas y sincronizadas con la base de datos de Supabase.
        </p>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
          }
          aside, header {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .animate-in {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
