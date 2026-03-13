'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { BadgeDollarSign, CreditCard, TrendingUp, Wallet, Wrench, AlertTriangle, Loader2 } from 'lucide-react';
import { getSales, getExpenses, getInventory, getMechanics } from '@/supabase/functions';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    salesToday: 0,
    salesMonth: 0,
    netProfitMonth: 0,
    expensesMonth: 0,
    activeRepairs: 0,
    stockAlerts: 0
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
      sales.forEach((sale: any) => {
        const saleDate = new Date(sale.date);
        const saleDateStr = saleDate.toISOString().split('T')[0];
        
        if (saleDateStr === todayStr) {
          salesToday += Number(sale.total_amount);
        }
        
        if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
          salesMonth += Number(sale.total_amount);
          const saleProfit = sale.sale_items?.reduce((sum: number, item: any) => sum + Number(item.profit || 0), 0) || 0;
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

      // Inventory Alerts
      const stockAlerts = inventory.filter((item: any) => item.stock <= 5).length;

      // Mechanics / Repairs Today
      let repairsCountToday = 0;
      mechanics.forEach((mech: any) => {
        const todayRepairs = (mech.repairs || []).filter((r: any) => r.date === todayStr);
        repairsCountToday += todayRepairs.length;
      });

      setMetrics({
        salesToday,
        salesMonth,
        expensesMonth,
        netProfitMonth: profitMonth - expensesMonth,
        activeRepairs: repairsCountToday,
        stockAlerts
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
          title="Ganancia Neta (Mes)"
          value={`$ ${metrics.netProfitMonth.toLocaleString('es-CO')}`}
          icon={Wallet}
          iconBg="bg-brand-gold/10"
          iconColor="text-brand-gold"
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
          title="Alertas de Stock"
          value={`${metrics.stockAlerts} Artículos`}
          icon={AlertTriangle}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
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
