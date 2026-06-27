'use client';

import { useState, useEffect } from 'react';
import { Wallet, Search, Plus, CreditCard, Clock, CheckCircle2, DollarSign, Trash2, Printer, FileText, X, Loader2 } from 'lucide-react';
import { getCredits, addCredit, getCreditPayments, addCreditPayment, deleteCredit } from '@/supabase/functions';

export default function CreditsPage() {
  const [credits, setCredits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  // Modals state
  const [isNewCreditModalOpen, setIsNewCreditModalOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  
  // New Credit Form
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTotalAmount, setNewTotalAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Payment Form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  useEffect(() => {
    fetchCredits();
  }, []);

  async function fetchCredits() {
    try {
      setIsLoading(true);
      const data = await getCredits();
      setCredits(data);
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreateCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newTotalAmount) return;

    try {
      setIsSubmitting(true);
      await addCredit({
        customer_name: newCustomerName,
        description: newDescription,
        total_amount: Number(newTotalAmount),
        paid_amount: 0,
        status: 'Pendiente'
      });
      alert('Crédito registrado con éxito');
      setIsNewCreditModalOpen(false);
      setNewCustomerName('');
      setNewDescription('');
      setNewTotalAmount('');
      fetchCredits();
    } catch (error) {
      console.error('Error creating credit:', error);
      alert('Error al registrar el crédito');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetails = async (credit: any) => {
    setSelectedCredit(credit);
    setIsPaymentModalOpen(true);
    await fetchPayments(credit.id);
  };

  const fetchPayments = async (creditId: string) => {
    try {
      setIsLoadingPayments(true);
      const data = await getCreditPayments(creditId);
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || !selectedCredit) return;

    const amountNum = Number(paymentAmount);
    const remaining = selectedCredit.total_amount - selectedCredit.paid_amount;
    
    if (amountNum <= 0) {
      alert('El abono debe ser mayor a 0');
      return;
    }
    if (amountNum > remaining) {
      alert('El abono no puede ser mayor al saldo restante');
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedCredit = await addCreditPayment(
        selectedCredit.id, 
        amountNum, 
        paymentMethod, 
        selectedCredit.paid_amount, 
        selectedCredit.total_amount
      );
      
      alert('Abono registrado con éxito');
      setPaymentAmount('');
      setPaymentMethod('Efectivo');
      
      setSelectedCredit(updatedCredit);
      fetchPayments(selectedCredit.id);
      fetchCredits();
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error al registrar el abono');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCredit = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este crédito? Se eliminará el historial de pagos asociados.')) return;
    try {
      await deleteCredit(id);
      alert('Crédito eliminado');
      fetchCredits();
    } catch (error) {
      console.error('Error deleting credit:', error);
      alert('Error al eliminar');
    }
  };

  const normalizeText = (text: string) => 
    text ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';

  const filteredCredits = credits.filter(c => {
    const matchesSearch = normalizeText(c.customer_name).includes(normalizeText(searchTerm)) || 
                          normalizeText(c.description).includes(normalizeText(searchTerm));
    const matchesStatus = filterStatus === 'Todos' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalDeuda = filteredCredits.reduce((sum, c) => sum + Number(c.total_amount), 0);
  const totalPagado = filteredCredits.reduce((sum, c) => sum + Number(c.paid_amount), 0);
  const totalPendiente = totalDeuda - totalPagado;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Créditos y Cuentas por Cobrar</h1>
          <p className="text-slate-500 mt-1">Gestiona los saldos pendientes y abonos de clientes.</p>
        </div>
        <button 
          onClick={() => setIsNewCreditModalOpen(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Registrar Crédito
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-slate-500 font-medium">Total Deuda Registrada</span>
          </div>
          <span className="text-2xl font-black text-slate-900">$ {totalDeuda.toLocaleString('es-CO')}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-slate-500 font-medium">Total Pagado</span>
          </div>
          <span className="text-2xl font-black text-emerald-600">$ {totalPagado.toLocaleString('es-CO')}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-slate-500 font-medium">Saldo Pendiente (Cartera)</span>
          </div>
          <span className="text-2xl font-black text-amber-600 relative z-10">$ {totalPendiente.toLocaleString('es-CO')}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 bg-slate-50/50 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente o descripción..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm appearance-none cursor-pointer"
          >
            <option value="Todos">Todos los Estados</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Pagado">Pagados</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Descripción</th>
                <th className="px-6 py-4 font-semibold text-right">Deuda Total</th>
                <th className="px-6 py-4 font-semibold text-right">Abonado</th>
                <th className="px-6 py-4 font-semibold text-right">Saldo Restante</th>
                <th className="px-6 py-4 font-semibold text-center">Estado</th>
                <th className="px-6 py-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Cargando créditos...
                  </td>
                </tr>
              ) : filteredCredits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No hay créditos registrados.
                  </td>
                </tr>
              ) : (
                filteredCredits.map((credit) => {
                  const remaining = credit.total_amount - credit.paid_amount;
                  return (
                    <tr key={credit.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 uppercase">
                        {credit.customer_name}
                        <div className="text-[10px] text-slate-400 font-normal">{new Date(credit.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{credit.description || '---'}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700">
                        $ {Number(credit.total_amount).toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-600">
                        $ {Number(credit.paid_amount).toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-rose-600">
                        $ {remaining.toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                          credit.status === 'Pagado' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {credit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleOpenDetails(credit)}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium text-xs flex items-center gap-1"
                          >
                            <DollarSign className="w-4 h-4" /> 
                            {credit.status === 'Pagado' ? 'Ver Detalles' : 'Abonar'}
                          </button>
                          {credit.status === 'Pagado' && (
                            <button 
                              onClick={() => { setSelectedCredit(credit); setIsReceiptModalOpen(true); }}
                              className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors font-medium text-xs flex items-center gap-1"
                              title="Paz y Salvo"
                            >
                              <FileText className="w-4 h-4" /> Paz y Salvo
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteCredit(credit.id)}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isNewCreditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" /> Nuevo Crédito
              </h3>
              <button onClick={() => setIsNewCreditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateCredit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</label>
                <input 
                  type="text" 
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Nombre del cliente" 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monto Total de la Deuda</label>
                <input 
                  type="number" 
                  value={newTotalAmount}
                  onChange={(e) => setNewTotalAmount(e.target.value)}
                  placeholder="Ej. 150000" 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                  required
                  min="1"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción (Opcional)</label>
                <textarea 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detalles de lo que se debe..." 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-24"
                />
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Registrar
              </button>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && selectedCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" /> Detalles de Cartera
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
              
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="font-black text-lg text-slate-800 uppercase">{selectedCredit.customer_name}</h4>
                  <p className="text-sm text-slate-500">{selectedCredit.description || 'Sin descripción'}</p>
                </div>
                <div className="text-right flex flex-col gap-1">
                  <div className="text-sm text-slate-500 font-medium">Deuda Total: $ {Number(selectedCredit.total_amount).toLocaleString('es-CO')}</div>
                  <div className="text-sm text-emerald-600 font-medium">Abonado: $ {Number(selectedCredit.paid_amount).toLocaleString('es-CO')}</div>
                  <div className="text-lg font-black text-rose-600">Saldo: $ {(selectedCredit.total_amount - selectedCredit.paid_amount).toLocaleString('es-CO')}</div>
                </div>
              </div>

              {selectedCredit.status === 'Pendiente' && (
                <form onSubmit={handleAddPayment} className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm bg-blue-50/30">
                  <h5 className="font-bold text-sm text-blue-800 mb-3">Registrar Nuevo Abono</h5>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <input 
                        type="number" 
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Monto a abonar..." 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                        required
                        min="1"
                      />
                    </div>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta</option>
                    </select>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Abonar'}
                    </button>
                  </div>
                </form>
              )}

              <div>
                <h5 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Historial de Abonos
                </h5>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  {isLoadingPayments ? (
                    <div className="p-8 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      No hay abonos registrados aún.
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                          <th className="px-4 py-3 text-left font-semibold">Método</th>
                          <th className="px-4 py-3 text-right font-semibold">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payments.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-700">
                              {new Date(p.created_at).toLocaleDateString()} {new Date(p.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs uppercase">{p.payment_method}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">
                              $ {Number(p.amount).toLocaleString('es-CO')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {isReceiptModalOpen && selectedCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 print:hidden">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" /> Imprimir Paz y Salvo
              </h3>
              <button onClick={() => setIsReceiptModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 text-center print:p-0 print:text-black" id="paz-y-salvo">
              <div className="mb-6">
                <h1 className="text-3xl font-black tracking-widest text-slate-900 print:text-black">TALLER MARNAK</h1>
                <p className="text-slate-500 text-sm mt-1 print:text-gray-600">Servicio Automotriz Especializado</p>
              </div>

              <div className="border-t-2 border-b-2 border-slate-200 py-4 my-6 print:border-black">
                <h2 className="text-xl font-bold uppercase tracking-widest mb-1 text-slate-800 print:text-black">Paz y Salvo</h2>
                <p className="text-xs text-slate-500 print:text-gray-600">Fecha de expedición: {new Date().toLocaleDateString()}</p>
              </div>

              <div className="text-left space-y-4 text-slate-700 text-sm print:text-black">
                <p>
                  Por medio del presente documento, <strong>TALLER MARNAK</strong> certifica que el/la señor(a) 
                  <strong className="uppercase ml-1 text-base">{selectedCredit.customer_name}</strong> se encuentra 
                  a paz y salvo por todo concepto relacionado con la deuda descrita a continuación:
                </p>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 print:border-0 print:p-0">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-slate-500 print:text-gray-600">Descripción:</div>
                    <div className="font-medium">{selectedCredit.description || 'Deuda General'}</div>
                    
                    <div className="text-slate-500 print:text-gray-600">Valor Total Cancelado:</div>
                    <div className="font-bold text-base">$ {Number(selectedCredit.total_amount).toLocaleString('es-CO')}</div>
                    
                    <div className="text-slate-500 print:text-gray-600">Fecha de Creación:</div>
                    <div className="font-medium">{new Date(selectedCredit.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <p className="pt-4 text-center italic text-slate-500 print:text-gray-600 text-xs">
                  Este documento se expide a solicitud del interesado y comprueba que la obligación ha sido saldada en su totalidad.
                </p>
              </div>

              <div className="pt-16 pb-4 flex flex-col items-center">
                <div className="w-48 border-t border-slate-400 print:border-black mb-2"></div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 print:text-black">Firma Autorizada</div>
                <div className="text-[10px] text-slate-400 print:text-gray-600 mt-1">Taller Marnak</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 print:hidden">
              <button 
                onClick={() => {
                  const printContent = document.getElementById('paz-y-salvo')?.innerHTML;
                  const originalContent = document.body.innerHTML;
                  document.body.innerHTML = printContent || '';
                  window.print();
                  document.body.innerHTML = originalContent;
                  window.location.reload();
                }}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Imprimir Documento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
