'use client';

import { useState, useEffect } from 'react';
import { Plus, Receipt, TrendingDown, X, DollarSign, Calendar, Tag, FileText, Loader2, Trash2, Edit2, Search, CheckCircle2, Filter, AlertTriangle } from 'lucide-react';
import { getExpenses, addExpense, deleteExpense, updateExpense } from '@/supabase/functions';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('Pagado'); // 'Pagado' or 'Pendiente'
  const [repeatMonths, setRepeatMonths] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Advanced Filters
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState('Todos');

  const [editingExpense, setEditingExpense] = useState<any>(null);

  const resetForm = () => {
    setDesc('');
    setCategory('');
    setAmount('');
    setDate('');
    setStatus('Pagado');
    setRepeatMonths(1);
    setEditingExpense(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (expense: any) => {
    setEditingExpense(expense);
    setDesc(expense.description);
    setCategory(expense.category);
    setAmount(expense.amount.toString());
    setDate(expense.date);
    setStatus(expense.status || 'Pagado');
    setRepeatMonths(1);
    setIsModalOpen(true);
  };

  // Fetch expenses on load
  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    try {
      setIsLoading(true);
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const baseDateStr = date || new Date().toISOString().split('T')[0];

      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          description: desc,
          category,
          amount: Number(amount),
          date: baseDateStr,
          status: status
        });
      } else {
        const repeats = Math.max(1, Number(repeatMonths));
        for (let i = 0; i < repeats; i++) {
           const eDate = new Date(baseDateStr + 'T12:00:00Z'); // force midday to avoid timezone shift loops
           eDate.setUTCMonth(eDate.getUTCMonth() + i);
           const isoDateStr = eDate.toISOString().split('T')[0];

           await addExpense({
             description: repeats > 1 ? `${desc} (${i + 1}/${repeats})` : desc,
             category,
             amount: Number(amount),
             date: isoDateStr,
             status: status
           });
        }
      }
      
      resetForm();
      setIsModalOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Hubo un error al guardar el gasto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string, description: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el gasto: "${description}"?`)) return;

    try {
      await deleteExpense(id);
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Error al eliminar el gasto.');
    }
  };

  const handleMarkAsPaid = async (expense: any) => {
    try {
      // Optimistic UI update
      setExpenses(prev => prev.map(e => e.id === expense.id ? { ...e, status: 'Pagado' } : e));
      await updateExpense(expense.id, { ...expense, status: 'Pagado' });
    } catch (error) {
      console.error('Error marking as paid', error);
      fetchExpenses(); // Revert
    }
  };

  const normalizeText = (text: string) => 
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredExpenses = expenses.filter(item => {
    const matchSearch = normalizeText(item.description).includes(normalizeText(searchTerm)) ||
                        normalizeText(item.category).includes(normalizeText(searchTerm));
    
    let matchDate = true;
    if (filterDateFrom && filterDateTo) {
      matchDate = item.date >= filterDateFrom && item.date <= filterDateTo;
    } else if (filterDateFrom) {
      matchDate = item.date >= filterDateFrom;
    } else if (filterDateTo) {
      matchDate = item.date <= filterDateTo;
    }

    const matchCategory = filterCategory === 'Todas' || item.category === filterCategory;
    const matchStatus = filterStatus === 'Todos' || item.status === filterStatus;

    return matchSearch && matchDate && matchCategory && matchStatus;
  });

  const totalFiltered = filteredExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Seguimiento de Gastos</h1>
          <p className="text-slate-500 mt-1">Gestiona costos operativos y pagos salientes.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Registrar Gasto
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl border border-rose-600 p-6 shadow-lg shadow-rose-200 text-white relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"><TrendingDown className="w-6 h-6" /></div>
            <h3 className="text-rose-50 font-medium">Total Gastos (Filtrados)</h3>
          </div>
          <p className="text-4xl font-bold tracking-tight relative z-10">$ {totalFiltered.toLocaleString('es-CO')}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
        {/* FILTERS HEADER */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            Gastos y Cuentas por Pagar
            {isLoading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin ml-2" />}
          </h3>
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
             <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input 
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="bg-transparent border-none focus:outline-none w-28 text-slate-600"
                />
                <span className="text-slate-300">-</span>
                <input 
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="bg-transparent border-none focus:outline-none w-28 text-slate-600"
                />
             </div>
             <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none shadow-sm cursor-pointer"
             >
                <option value="Todas">Todas las Categorías</option>
                <option value="Servicios">Servicios</option>
                <option value="Arriendo">Arriendo</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Repuestos">Repuestos</option>
                <option value="Insumos">Insumos</option>
                <option value="Nomina">Nómina</option>
                <option value="Otros">Otros</option>
             </select>
             <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none shadow-sm cursor-pointer"
             >
                <option value="Todos">Cualquier Estado</option>
                <option value="Pagado">Solo Pagados</option>
                <option value="Pendiente">Solo Pendientes</option>
             </select>
             <div className="relative flex-1 min-w-[150px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar descripción..." 
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Descripción</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Categoría</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Fecha</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Monto (COP)</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Estado</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                     <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-20" />
                     Cargando gastos...
                   </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                     {searchTerm ? 'No se encontraron gastos que coincidan con la búsqueda.' : 'No hay gastos registrados.'}
                   </td>
                 </tr>
              ) : (
                filteredExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.description}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs border border-slate-200">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(item.date).toLocaleDateString('es-CO')}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 text-right">
                      $ {Number(item.amount).toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'Pendiente' ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Pendiente
                          </span>
                          <button 
                             onClick={() => handleMarkAsPaid(item)}
                             className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-500 hover:text-white px-2 py-1 rounded transition-all flex items-center gap-1"
                             title="Marcar como pagado (Liquidar Gasto)"
                          >
                             <CheckCircle2 className="w-3 h-3" /> Pagar
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-500">
                          {item.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar gasto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(item.id, item.description)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar gasto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{editingExpense ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}</h2>
                  <p className="text-sm text-slate-500">{editingExpense ? 'Actualiza los detalles del gasto' : 'Ingresa los detalles del pago saliente'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Descripción del Gasto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FileText className="w-4 h-4" /></span>
                  <input 
                    type="text" 
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Ej. Pago de arriendo local, Compra de lubricantes..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Categoría</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Tag className="w-4 h-4" /></span>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all appearance-none"
                      required
                    >
                      <option value="" disabled>Seleccionar...</option>
                      <optgroup label="Operativos">
                        <option value="Servicios">Servicios (Agua, Luz)</option>
                        <option value="Arriendo">Arriendo</option>
                        <option value="Mantenimiento">Mantenimiento Taller</option>
                      </optgroup>
                      <optgroup label="Inventario">
                        <option value="Repuestos">Compra Repuestos</option>
                        <option value="Insumos">Insumos (Aceites, Lijas)</option>
                      </optgroup>
                      <optgroup label="Personal">
                        <option value="Nomina">Nómina / Salarios</option>
                        <option value="Otros">Otros</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Monto (COP)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                    <input 
                      type="number" 
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Fecha del Gasto</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Calendar className="w-4 h-4" /></span>
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="block text-sm font-medium text-slate-700">Estado</label>
                   <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                      <option value="Pagado">Liquidado / Pagado</option>
                      <option value="Pendiente">Cuentas por Pagar (Pendiente)</option>
                    </select>
                </div>

                {!editingExpense && (
                  <div className="space-y-2 flex flex-col">
                    <label className="block text-sm font-medium text-slate-700">Automatizar Repetición</label>
                    <div className="relative flex-1">
                      <input 
                        type="number"
                        min="1"
                        max="24"
                        value={repeatMonths}
                        onChange={(e) => setRepeatMonths(Number(e.target.value))}
                        className="w-full px-4 py-2.5 h-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {!editingExpense && repeatMonths > 1 && (
                 <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-xl border border-amber-200 flex gap-2 w-full mt-2">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                    <p>
                      <strong>Atención:</strong> Se generarán <strong>{repeatMonths} registros</strong> idénticos de "{desc}" en tu historial, espaciados mensualmente, manteniendo el estado {status}. Usa esto como proyección a futuro.
                    </p>
                 </div>
              )}

              <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                 <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                 >
                   Cancelar
                 </button>
                 <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium shadow-sm transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
                 >
                   {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingExpense ? <Edit2 className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />)}
                   {isSubmitting ? 'Guardando...' : (editingExpense ? 'Actualizar Gasto' : 'Registrar Gasto')}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
