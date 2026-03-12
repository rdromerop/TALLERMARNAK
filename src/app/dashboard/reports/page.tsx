'use client';

import { useState, useEffect } from 'react';
import { PieChart, Download, Calendar as CalendarIcon, Loader2, FileText, Search, TrendingUp, Wallet, Package } from 'lucide-react';
import { getSalesByDate } from '@/supabase/functions';

export default function ReportsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchDailySales();
  }, [selectedDate]);

  async function fetchDailySales() {
    try {
      setIsLoading(true);
      const data = await getSalesByDate(selectedDate);
      setSales(data);
    } catch (error) {
      console.error('Error fetching sales for date:', error);
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header - Hidden in Print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reportes Financieros</h1>
          <p className="text-slate-500 mt-1">Exporta y analiza el rendimiento de tu negocio por fecha.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500">
              <CalendarIcon className="w-4 h-4" />
            </span>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm outline-none"
            />
          </div>
          <button 
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-medium hover:bg-slate-800 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Info for Print Only */}
      <div className="hidden print:block mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Reporte de Ventas Diarias - MARNAK</h1>
        <p className="text-slate-500 mt-1">Fecha del reporte: {selectedDate}</p>
        <div className="mt-4 border-b pb-4 flex justify-between">
          <span className="text-sm font-bold text-slate-700">MARNAK Dashboard</span>
          <span className="text-sm text-slate-500">{new Date().toLocaleString()}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-24 text-center shadow-sm">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">Consultando Base de Datos...</h3>
          <p className="text-slate-500">Estamos recuperando las ventas del {selectedDate}.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full opacity-20 blur-2xl group-hover:scale-150 transition-transform duration-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas de Hoy</span>
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
              <p className="text-xs text-slate-500 mt-1">Valor por cliente</p>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:bg-white">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                Detalle de Ventas
              </h3>
              <span className="bg-white px-3 py-1 rounded-full border border-slate-200 text-xs font-medium text-slate-500 shadow-sm print:hidden">
                Fecha Seleccionada: <strong>{selectedDate}</strong>
              </span>
            </div>

            {sales.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No se encontraron ventas este día</p>
                <p className="text-sm">Prueba seleccionando otra fecha en el calendario superior.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-50/30 print:bg-white border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Cliente</th>
                      <th className="px-6 py-4 font-semibold">Hora</th>
                      <th className="px-6 py-4 font-semibold">Artículos</th>
                      <th className="px-6 py-4 font-semibold text-right">Monto Total</th>
                      <th className="px-6 py-4 font-semibold text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 uppercase">{sale.customer_name || 'Consumidor Final'}</div>
                          <div className="text-xs text-slate-400">{sale.motorcycle || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                      <td colSpan={3} className="px-6 py-4 text-sm font-bold text-slate-900 text-right uppercase tracking-[2px]">TOTAL DEL DÍA</td>
                      <td className="px-6 py-4 text-lg font-black text-blue-600 text-right">
                        $ {totalEarnings.toLocaleString('es-CO')}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
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
