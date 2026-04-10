'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { BadgeDollarSign, CreditCard, TrendingUp, Wallet, Wrench, AlertTriangle, Loader2, Package, Coins } from 'lucide-react';
import { getSales, getExpenses, getInventory, getMechanics } from '@/supabase/functions';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    salesToday: 0,
    salesMonth: 0,
    netProfitMonth: 0,
    profitToday: 0,
    expensesMonth: 0,
    activeRepairs: 0,
    stockAlerts: 0,
    inventoryValue: 0,
    lowStockItems: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    try {
      setIsLoading(true);
      const [sales, expenses, inventory, mechanics] = await Promise.all([
        getSales(),
        getExpenses(),
        getInventory(),
        getMechanics()
      ]);

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Sales Calculations
      let salesToday = 0;
      let salesMonth = 0;
      let profitMonth = 0;
      let profitToday = 0;
      sales.forEach((sale: any) => {
        const saleDate = new Date(sale.date);
        const saleDateStr = saleDate.toISOString().split('T')[0];
        const saleProfit = sale.sale_items?.reduce((sum: number, item: any) => sum + Number(item.profit || 0), 0) || 0;
        
        if (saleDateStr === todayStr) {
          salesToday += Number(sale.total_amount);
          profitToday += saleProfit;
        }
        
        if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
          salesMonth += Number(sale.total_amount);
          profitMonth += saleProfit;
        }
      });

      // Expenses Calculations
      let expensesMonth = 0;
      expenses.forEach((expense: any) => {
        const expDate = new Date(expense.date); // expense.date is 'YYYY-MM-DD'
        if (expDate.getUTCMonth() === currentMonth && expDate.getUTCFullYear() === currentYear) {
          expensesMonth += Number(expense.amount);
        }
      });

      // Inventory Alerts y Valor
      const lowStockItems = inventory.filter((item: any) => item.stock <= 2);
      const stockAlerts = lowStockItems.length;

      let inventoryValue = 0;
      inventory.forEach((item: any) => {
        inventoryValue += Number(item.stock || 0) * Number(item.purchase_price || 0);
      });

      // Mechanics / Repairs Today
      let repairsCountToday = 0;
      mechanics.forEach((mech: any) => {
        const todayRepairs = (mech.repairs || []).filter((r: any) => {
          if (!r.created_at) return false;
          const rDateStr = new Date(r.created_at).toISOString().split('T')[0];
          return rDateStr === todayStr;
        });
        repairsCountToday += todayRepairs.length;
      });

      setMetrics({
        salesToday,
        salesMonth,
        expensesMonth,
        netProfitMonth: profitMonth,
        profitToday,
        activeRepairs: repairsCountToday,
        stockAlerts,
        inventoryValue,
        lowStockItems
      });

    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-slate-400">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-lg font-medium">Actualizando resumen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Resumen General</h1>
          <p className="text-slate-500 mt-1">Así está la situación en el Taller Marnak hoy.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchMetrics}
            className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
          >
            Actualizar Datos
          </button>
          <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            Moneda: <span className="font-bold text-slate-800">COP</span>
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Ventas de Hoy"
          value={`$ ${metrics.salesToday.toLocaleString('es-CO')}`}
          icon={BadgeDollarSign}
          iconBg="bg-brand-green/10"
          iconColor="text-brand-green"
        />
        <MetricCard
          title="Ventas del Mes"
          value={`$ ${metrics.salesMonth.toLocaleString('es-CO')}`}
          icon={TrendingUp}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <MetricCard
          title="Ganancias (Mes)"
          value={`$ ${metrics.netProfitMonth.toLocaleString('es-CO')}`}
          icon={Wallet}
          iconBg="bg-brand-gold/10"
          iconColor="text-brand-gold"
        />
        <MetricCard
          title="Ganancias de Hoy"
          value={`$ ${metrics.profitToday.toLocaleString('es-CO')}`}
          icon={Coins}
          iconBg="bg-teal-100"
          iconColor="text-teal-600"
        />
        <MetricCard
          title="Gastos del Mes"
          value={`$ ${metrics.expensesMonth.toLocaleString('es-CO')}`}
          icon={CreditCard}
          iconBg="bg-rose-100"
          iconColor="text-rose-600"
        />
        <MetricCard
          title="Trabajos de Hoy"
          value={`${metrics.activeRepairs} Servicios`}
          icon={Wrench}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <MetricCard
          title="Valor del Inventario"
          value={`$ ${metrics.inventoryValue.toLocaleString('es-CO')}`}
          icon={Package}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <MetricCard
          title="Alertas de Stock"
          value={`${metrics.stockAlerts} Artículos`}
          icon={AlertTriangle}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          tooltip={
            metrics.lowStockItems.length > 0 ? (
              <div className="flex flex-col gap-1.5 py-1 min-w-[180px]">
                <span className="font-bold text-slate-300 border-b border-slate-700 pb-1 mb-1">
                  Artículos bajos/agotados:
                </span>
                <ul className="max-h-[200px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {metrics.lowStockItems.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center text-xs">
                      <span className="truncate max-w-[120px]" title={item.name}>{item.name}</span>
                      <span className={`font-mono font-bold ml-2 ${item.stock === 0 ? 'text-red-400' : 'text-orange-400'}`}>
                        {item.stock}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : undefined
          }
        />
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none" />
          <h3 className="text-lg font-semibold text-slate-900 mb-4 relative z-10">Estado del Sistema</h3>
          <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 relative z-10">
            <div className="flex items-center gap-3 text-emerald-600 text-sm font-medium">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Sincronización con Supabase: Activa
            </div>
            <p className="mt-2 text-slate-500 text-sm">
              Toda la información de inventario, ventas y gastos se está guardando automáticamente en la nube.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
