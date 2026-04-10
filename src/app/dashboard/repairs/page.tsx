'use client';

import { useState, useEffect } from 'react';
import { Plus, Clock, Wrench, UserPlus, FileText, CheckCircle2, User, X, Briefcase, Edit2, Trash2, AlertTriangle, Loader2, Search, Percent, Filter, Activity } from 'lucide-react';
import { getMechanics, addMechanic, updateMechanic, deleteMechanic, addRepair, updateRepairStatus } from '@/supabase/functions';

// Interfaces for our state
interface MechanicJob {
  id: string;
  time: string;
  task: string;
  cost: number;
  status: string;
  commission_percentage?: number;
  commission_amount?: number;
}

interface Mechanic {
  id: string;
  name: string;
  jobs: MechanicJob[];
}

export default function RepairsPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos'); // 'Todos', 'Pendiente', 'Completado'
  
  // Modal states
  const [isAddMechanicOpen, setIsAddMechanicOpen] = useState(false);
  const [isLogJobOpen, setIsLogJobOpen] = useState(false);
  const [isEditMechanicOpen, setIsEditMechanicOpen] = useState(false);
  const [isDeleteMechanicOpen, setIsDeleteMechanicOpen] = useState(false);
  
  // Form states - Mechanic
  const [mechanicName, setMechanicName] = useState('');
  const [mechanicToEdit, setMechanicToEdit] = useState<Mechanic | null>(null);
  const [mechanicToDelete, setMechanicToDelete] = useState<Mechanic | null>(null);
  
  // Form states - Job
  const [selectedMechanicId, setSelectedMechanicId] = useState('');
  const [jobTime, setJobTime] = useState('');
  const [jobTask, setJobTask] = useState('');
  const [jobCost, setJobCost] = useState('');
  const [jobCommissionStr, setJobCommissionStr] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setIsLoading(true);
      const data = await getMechanics();
      
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Map repairs to jobs
      const formattedData = data.map((m: any) => {
        // Filter only today's repairs
        const todayRepairs = (m.repairs || []).filter((r: any) => {
          if (!r.created_at) return true; // keep if no date just in case
          const rDate = new Date(r.created_at);
          const rDateStr = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}-${String(rDate.getDate()).padStart(2, '0')}`;
          return rDateStr === todayStr;
        });

        return {
          id: m.id,
          name: m.name,
          jobs: todayRepairs.map((r: any) => ({
            id: r.id,
            time: r.time,
            task: r.task,
            cost: Number(r.cost),
            status: r.status || 'Completado', // Default to completed for old data
            commission_percentage: r.commission_percentage ? Number(r.commission_percentage) : undefined,
            commission_amount: r.commission_amount ? Number(r.commission_amount) : undefined
          }))
        };
      });
      
      setMechanics(formattedData);
    } catch (error) {
      console.error('Error fetching mechanics:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddMechanic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mechanicName.trim()) return;
    
    try {
      setIsActionLoading(true);
      await addMechanic(mechanicName);
      setMechanicName('');
      setIsAddMechanicOpen(false);
      fetchData();
    } catch (error) {
       console.error('Error adding mechanic:', error);
       alert('Error al agregar el mecánico');
    } finally {
       setIsActionLoading(false);
    }
  };

  const handleEditMechanic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mechanicToEdit || !mechanicName.trim()) return;

    try {
      setIsActionLoading(true);
      await updateMechanic(mechanicToEdit.id, mechanicName);
      setMechanicToEdit(null);
      setMechanicName('');
      setIsEditMechanicOpen(false);
      fetchData();
    } catch (error) {
       console.error('Error editing mechanic:', error);
       alert('Error al editar el nombre');
    } finally {
       setIsActionLoading(false);
    }
  };

  const handleDeleteMechanic = async () => {
    if (!mechanicToDelete) return;
    
    try {
      setIsActionLoading(true);
      await deleteMechanic(mechanicToDelete.id);
      setMechanicToDelete(null);
      setIsDeleteMechanicOpen(false);
      fetchData();
    } catch (error) {
       console.error('Error deleting mechanic:', error);
       alert('Error al eliminar el mecánico');
    } finally {
       setIsActionLoading(false);
    }
  };

  const openEditMechanicModal = (mechanic: Mechanic) => {
    setMechanicToEdit(mechanic);
    setMechanicName(mechanic.name);
    setIsEditMechanicOpen(true);
  };

  const openDeleteMechanicModal = (mechanic: Mechanic) => {
    setMechanicToDelete(mechanic);
    setIsDeleteMechanicOpen(true);
  };

  const handleLogJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMechanicId || !jobTime || !jobTask || !jobCost) return;

    try {
      setIsActionLoading(true);
      
      const costNum = Number(jobCost);
      const commPct = jobCommissionStr ? Number(jobCommissionStr) : 0;
      const commAmt = commPct > 0 ? (costNum * (commPct / 100)) : 0;

      const newJob = {
        mechanic_id: selectedMechanicId,
        time: jobTime,
        task: jobTask,
        cost: costNum,
        status: 'Pendiente', // Always starts as pending
        commission_percentage: commPct || null,
        commission_amount: commAmt || 0
      };

      await addRepair(newJob);

      setJobTime('');
      setJobTask('');
      setJobCost('');
      setJobCommissionStr('');
      setSelectedMechanicId('');
      setIsLogJobOpen(false);
      fetchData();
    } catch (error) {
       console.error('Error adding job:', error);
       alert('Error al registrar el trabajo');
    } finally {
       setIsActionLoading(false);
    }
  };

  const openLogJobModal = (mechanicId: string) => {
    setSelectedMechanicId(mechanicId);
    // Set default time to now
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setJobTime(timeString);
    setIsLogJobOpen(true);
  };

  const navigateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      // Opt UI
      setMechanics(prev => prev.map(m => ({
        ...m,
        jobs: m.jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j)
      })));
      await updateRepairStatus(jobId, newStatus);
    } catch (error) {
       console.error('Error updating status:', error);
       fetchData(); // Rollback
    }
  };

  const normalizeText = (text: string) => 
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredMechanics = mechanics.map(mechanic => {
    const filteredJobs = mechanic.jobs.filter(job => {
      const matchSearch = normalizeText(job.task).includes(normalizeText(searchTerm));
      const matchStatus = statusFilter === 'Todos' || job.status === statusFilter;
      return matchSearch && matchStatus;
    });
    
    const nameMatches = normalizeText(mechanic.name).includes(normalizeText(searchTerm));
    
    return {
      ...mechanic,
      jobs: (searchTerm && !nameMatches) || statusFilter !== 'Todos' ? filteredJobs : mechanic.jobs,
      isMatch: nameMatches || filteredJobs.length > 0
    };
  }).filter(m => (!searchTerm && statusFilter === 'Todos') ? true : m.isMatch);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-slate-400">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-lg font-medium">Cargando mecánicos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Registro de Mecánicos</h1>
          <p className="text-slate-500 mt-1">Supervisa los trabajos diarios y el rendimiento del personal.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar mecánico o trabajo..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all appearance-none cursor-pointer"
          >
            <option value="Todos">Todos los Estados</option>
            <option value="Pendiente">Solo Pendientes</option>
            <option value="Completado">Terminados</option>
          </select>
          <button 
            onClick={() => {
              setMechanicName('');
              setIsAddMechanicOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 w-full sm:w-auto px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Mecánico
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredMechanics.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
               {searchTerm ? <Search className="w-8 h-8" /> : <User className="w-8 h-8" />}
             </div>
             <h3 className="text-lg font-semibold text-slate-900 mb-1">{searchTerm ? 'No hay resultados' : 'No hay mecánicos registrados'}</h3>
             <p className="text-slate-500 max-w-sm mx-auto mb-6">
               {searchTerm ? 'Intenta buscar con otros términos.' : 'Agrega personal a tu equipo para empezar a registrar sus trabajos del día.'}
             </p>
             {!searchTerm && (
               <button 
                onClick={() => {
                  setMechanicName('');
                  setIsAddMechanicOpen(true);
                }}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-sm"
               >
                 <Plus className="w-4 h-4" /> Agregar Primer Mecánico
               </button>
             )}
          </div>
        ) : (
          filteredMechanics.map(mechanic => {
            // Filter today's jobs for the total cost calculation
            // In a real app we would restrict the query to today's date
            const totalDailyCost = mechanic.jobs.reduce((sum, job) => sum + job.cost, 0); 
            const totalCommissions = mechanic.jobs.reduce((sum, job) => sum + (job.commission_amount || 0), 0); 
            const activeJobsCount = mechanic.jobs.filter(j => j.status === 'Pendiente').length;
            
            return (
              <div key={mechanic.id} className="bg-white border border-slate-200 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col w-full group">
                {/* Mechanic Header */}
                <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 text-blue-700 p-3 rounded-xl">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-800">{mechanic.name}</h2>
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-2">
                          <button 
                            onClick={() => openEditMechanicModal(mechanic)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar nombre"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => openDeleteMechanicModal(mechanic)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar mecánico"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 font-medium">
                        {mechanic.jobs.length} trabajos hoy ({activeJobsCount} Activos)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-right flex-1 sm:flex-none">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Comisión Ganada</p>
                      <p className="text-lg font-black text-emerald-700">$ {totalCommissions.toLocaleString('es-CO')}</p>
                    </div>
                    <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-right flex-1 sm:flex-none">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Producido Taller</p>
                      <p className="text-sm font-bold text-slate-700">$ {totalDailyCost.toLocaleString('es-CO')}</p>
                    </div>
                    <button 
                      onClick={() => openLogJobModal(mechanic.id)}
                      className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-sm shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Registrar Trabajo</span>
                    </button>
                  </div>
                </div>

                {/* Mechanic Jobs Log */}
                <div className="p-0 overflow-x-auto">
                  {mechanic.jobs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      Aún no hay trabajos registrados para este mecánico hoy.
                    </div>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 font-semibold tracking-wider w-24">Hora</th>
                          <th className="px-6 py-4 font-semibold tracking-wider">Tarea Realizada</th>
                          <th className="px-6 py-4 font-semibold tracking-wider text-right">Comisión</th>
                          <th className="px-6 py-4 font-semibold tracking-wider text-right">Costo Total</th>
                          <th className="px-6 py-4 font-semibold tracking-wider text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {mechanic.jobs.map(job => (
                          <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group/row">
                            <td className="px-6 py-4 text-slate-500 font-medium">
                              <span className="flex items-center gap-1.5 bg-slate-100 w-fit px-2 py-1 rounded text-xs">
                                <Clock className="w-3 h-3" /> {job.time}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900 uppercase">
                              {job.task}
                            </td>
                            <td className="px-6 py-4 font-bold text-emerald-600 text-right">
                              {job.commission_amount && job.commission_amount > 0 ? (
                                <div className="flex flex-col">
                                   <span>$ {job.commission_amount.toLocaleString('es-CO')}</span>
                                   <span className="text-[10px] text-emerald-600/70 font-semibold">({job.commission_percentage}%)</span>
                                </div>
                              ) : '---'}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900 text-right">
                              $ {job.cost.toLocaleString('es-CO')}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {job.status === 'Pendiente' ? (
                                 <button 
                                    onClick={() => navigateJobStatus(job.id, 'Completado')}
                                    title="Marcar como Completado"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded shadow-sm transition-all bg-amber-100 text-amber-700 border border-amber-200 hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-200"
                                 >
                                    <Activity className="w-3.5 h-3.5" /> Pendiente
                                 </button>
                              ) : (
                                 <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded bg-slate-100 text-slate-500">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Completado
                                 </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Add Mechanic Modal */}
      {isAddMechanicOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Nuevo Mecánico</h2>
              </div>
              <button 
                onClick={() => setIsAddMechanicOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddMechanic} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Nombre Completo</label>
                <input 
                  type="text" 
                  value={mechanicName}
                  onChange={(e) => setMechanicName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all uppercase"
                  autoFocus
                  required
                />
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                 <button 
                  type="button"
                  onClick={() => setIsAddMechanicOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                  disabled={isActionLoading}
                 >
                   Cancelar
                 </button>
                 <button 
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-all flex items-center gap-2"
                 >
                   {isActionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                   Guardar Mecánico
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Mechanic Modal */}
      {isEditMechanicOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Editar Mecánico</h2>
              </div>
              <button 
                onClick={() => setIsEditMechanicOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
                disabled={isActionLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditMechanic} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Nombre Completo</label>
                <input 
                  type="text" 
                  value={mechanicName}
                  onChange={(e) => setMechanicName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all uppercase"
                  autoFocus
                  required
                />
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                 <button 
                  type="button"
                  onClick={() => setIsEditMechanicOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                  disabled={isActionLoading}
                 >
                   Cancelar
                 </button>
                 <button 
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-all flex items-center gap-2"
                 >
                   {isActionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                   Guardar Cambios
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Mechanic Confirmation Modal */}
      {isDeleteMechanicOpen && mechanicToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 text-rose-600 mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar a {mechanicToDelete.name}?</h2>
              <p className="text-slate-500 mb-6">
                Esta acción eliminará al mecánico y todo su registro de trabajos del día. Esta acción no se puede deshacer.
              </p>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsDeleteMechanicOpen(false)}
                  className="flex-1 px-4 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                  disabled={isActionLoading}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteMechanic}
                  disabled={isActionLoading}
                  className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium shadow-sm shadow-rose-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isActionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Job Modal */}
      {isLogJobOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Registrar Trabajo</h2>
                  <p className="text-xs font-medium text-slate-500 uppercase">
                    {mechanics.find(m => m.id === selectedMechanicId)?.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsLogJobOpen(false)}
                className="p-2 text-slate-400 hover:bg-white rounded-xl transition-colors shadow-sm bg-slate-100 border border-slate-200"
                disabled={isActionLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleLogJob} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Tarea Realizada</label>
                  <textarea 
                    value={jobTask}
                    onChange={(e) => setJobTask(e.target.value)}
                    placeholder="Ej. Cambio de bujías y limpieza de carburador"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all resize-none h-24 uppercase"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Hora de finalización</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Clock className="w-4 h-4" /></span>
                    <input 
                      type="time" 
                      value={jobTime}
                      onChange={(e) => setJobTime(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Costo / Valor Facturado (COP)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                    <input 
                      type="number" 
                      min="0"
                      value={jobCost}
                      onChange={(e) => setJobCost(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Comisión del Mecánico (%) <span className="text-xs text-slate-400 font-normal">(Opcional)</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm"><Percent className="w-3.5 h-3.5" /></span>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={jobCommissionStr}
                      onChange={(e) => setJobCommissionStr(e.target.value)}
                      placeholder="Ej. 10"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-xl border border-blue-100 flex gap-2">
                 <AlertTriangle className="w-4 h-4 shrink-0 text-blue-600" />
                 <p>El trabajo quedará por defecto en estado <strong>Pendiente</strong> y podrá ser marcado como completado directamente en el panel principal una vez finalice.</p>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex items-center gap-3">
                 <button 
                  type="submit"
                  disabled={isActionLoading}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
                 >
                   {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                   Guardar Registro
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
