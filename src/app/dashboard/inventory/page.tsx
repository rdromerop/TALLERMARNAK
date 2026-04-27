'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, Package2, X, Tags, Loader2, Edit2, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, Settings2, History, Clock, PlusSquare } from 'lucide-react';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, adjustInventoryStock, getInventoryLogs } from '@/supabase/functions';
import { motion } from 'framer-motion';

const tableContainerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Filters & Sorting & Pagination
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Stock Adjustment State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<any>(null);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Ajuste Manual');

  // History State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  // Reinforce State
  const [isReinforceModalOpen, setIsReinforceModalOpen] = useState(false);
  const [reinforceSearch, setReinforceSearch] = useState('');
  const [selectedReinforceItem, setSelectedReinforceItem] = useState<any>(null);
  const [reinforceQuantity, setReinforceQuantity] = useState(1);

  useEffect(() => {
    fetchInventory();
  }, []);

  const resetForm = () => {
    setItemName('');
    setSku('');
    setCategory('');
    setPrice('');
    setCostPrice('');
    setQuantity(1);
    setEditingItem(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    
    let maxSku = 0;
    inventory.forEach(item => {
      if (item.sku) {
        const numericPart = item.sku.replace(/\D/g, '');
        if (numericPart) {
          const num = parseInt(numericPart, 10);
          if (!isNaN(num)) {
            maxSku = Math.max(maxSku, num);
          }
        }
      }
    });
    const nextSku = String(maxSku + 1).padStart(6, '0');
    setSku(nextSku);

    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setItemName(item.name);
    setSku(item.sku || '');
    setCategory(item.category);
    setPrice(item.price.toString());
    setCostPrice(item.cost_price?.toString() || '');
    setQuantity(item.stock);
    setIsModalOpen(true);
  };

  async function fetchInventory() {
    try {
      setIsLoading(true);
      const data = await getInventory();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const itemData = {
        name: itemName,
        sku,
        category,
        price: Number(price),
        cost_price: costPrice === '' ? null : Number(costPrice),
        stock: Number(quantity)
      };

      if (editingItem) {
        await updateInventoryItem(editingItem.id, itemData);
      } else {
        await addInventoryItem(itemData);
      }
      
      resetForm();
      setIsModalOpen(false);
      fetchInventory();
    } catch (error: any) {
      console.error('Error in save:', error);
      if (error.code === '23505') {
        alert('Este SKU ya existe. Por favor usa un código diferente.');
      } else {
        alert('Error guardando: ' + (error.message || JSON.stringify(error)));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReinforceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedReinforceItem) return;

    try {
      setIsSubmitting(true);
      const newStock = selectedReinforceItem.stock + Number(reinforceQuantity);
      
      await adjustInventoryStock(
        selectedReinforceItem.id, 
        newStock, 
        'Ingreso de Proveedor', 
        selectedReinforceItem.name, 
        Number(reinforceQuantity)
      );
      
      setIsReinforceModalOpen(false);
      setSelectedReinforceItem(null);
      setReinforceSearch('');
      setReinforceQuantity(1);
      fetchInventory();
    } catch (error) {
      console.error('Error reinforcing stock:', error);
      alert('Hubo un error al reforzar el inventario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este artículo?')) return;
    try {
      setIsSubmitting(true);
      await deleteInventoryItem(id);
      fetchInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Hubo un error al eliminar el artículo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !adjustItem) return;

    try {
      setIsSubmitting(true);
      const newStock = adjustItem.stock + adjustQuantity;
      if (newStock < 0) {
         alert('El stock no puede ser negativo.');
         return;
      }
      
      await adjustInventoryStock(adjustItem.id, newStock, adjustReason, adjustItem.name, adjustQuantity);
      
      setIsAdjustModalOpen(false);
      setAdjustItem(null);
      setAdjustQuantity(0);
      setAdjustReason('Ajuste Manual');
      fetchInventory();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Hubo un error al ajustar el inventario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAdjustModal = (item: any) => {
    setAdjustItem(item);
    setAdjustQuantity(0);
    setAdjustReason('Ajuste Manual');
    setIsAdjustModalOpen(true);
  };

  const openHistoryModal = async () => {
    setIsHistoryModalOpen(true);
    setIsLogsLoading(true);
    try {
      const logs = await getInventoryLogs();
      setInventoryLogs(logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLogsLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const normalizeText = (text: string) => 
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  let filteredInventory = inventory.filter(item => {
    const matchesSearch = normalizeText(item.name).includes(normalizeText(searchTerm)) ||
          (item.sku && normalizeText(item.sku).includes(normalizeText(searchTerm)));
    
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    
    const isOutOfStock = Number(item.stock) <= 0;
    const isLowStock = Number(item.stock) <= 2 && !isOutOfStock;
    let matchesStatus = true;
    if (filterStatus === 'Agotado') matchesStatus = isOutOfStock;
    if (filterStatus === 'Stock Bajo') matchesStatus = isLowStock;
    if (filterStatus === 'En Stock') matchesStatus = !isOutOfStock && !isLowStock;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sorting
  filteredInventory = filteredInventory.sort((a, b) => {
    if (sortConfig.key === 'name') {
       return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    } else if (sortConfig.key === 'price') {
       return sortConfig.direction === 'asc' ? a.price - b.price : b.price - a.price;
    } else if (sortConfig.key === 'stock') {
       return sortConfig.direction === 'asc' ? a.stock - b.stock : b.stock - a.stock;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus]);

  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(item => item.stock <= 2 && item.stock > 0).length;
  const outOfStockItems = inventory.filter(item => item.stock <= 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestión de Inventario</h1>
          <p className="text-slate-500 mt-1">Gestiona repuestos, aceites y accesorios.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <button 
            onClick={openHistoryModal}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-all shadow-sm flex-1 sm:flex-none justify-center"
          >
            <History className="w-4 h-4" />
            Ver Historial
          </button>
          <button 
            onClick={() => setIsReinforceModalOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-all shadow-sm flex-1 sm:flex-none justify-center"
          >
            <PlusSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Reforzar Inventario</span>
            <span className="sm:hidden">Reforzar</span>
          </button>
          <button 
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-sm flex-1 sm:flex-none justify-center"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Agregar Artículo</span>
            <span className="sm:hidden">Agregar</span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <button 
          onClick={() => setFilterStatus('All')}
          className={`bg-white rounded-xl border p-5 shadow-sm flex items-center gap-4 transition-all text-left ${filterStatus === 'All' ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md scale-[1.02]' : 'border-slate-200 hover:border-blue-300 hover:shadow-md hover:scale-[1.01]'}`}
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Package2 className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Artículos</p>
            <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : totalItems}</p>
          </div>
        </button>
        <button 
          onClick={() => setFilterStatus('Stock Bajo')}
          className={`bg-white rounded-xl border p-5 shadow-sm flex items-center gap-4 transition-all text-left ${filterStatus === 'Stock Bajo' ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md scale-[1.02]' : 'border-amber-200 hover:border-amber-400 hover:shadow-md hover:scale-[1.01]'}`}
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-amber-600">Stock Bajo</p>
            <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : lowStockItems}</p>
          </div>
        </button>
        <button 
          onClick={() => setFilterStatus('Agotado')}
          className={`bg-white rounded-xl border p-5 shadow-sm flex items-center gap-4 transition-all text-left ${filterStatus === 'Agotado' ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md scale-[1.02]' : 'border-rose-200 hover:border-rose-400 hover:shadow-md hover:scale-[1.01]'}`}
        >
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-rose-600">Agotados</p>
            <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : outOfStockItems}</p>
          </div>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row gap-4 xl:items-center justify-between bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar (nombre o SKU)..." 
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm min-w-[140px]"
            >
              <option value="All">Todas las Categorías</option>
              {Array.from(new Set(inventory.map(i => i.category))).filter(Boolean).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm min-w-[140px]"
            >
              <option value="All">Todos los Estados</option>
              <option value="En Stock">En Stock</option>
              <option value="Stock Bajo">Stock Bajo</option>
              <option value="Agotado">Agotado</option>
            </select>
          </div>
          {isLoading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin self-end xl:self-auto" />}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th 
                  className="px-6 py-4 font-semibold tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">Nombre del Producto <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" /></div>
                </th>
                <th className="px-6 py-4 font-semibold tracking-wider">SKU</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Categoría</th>
                <th 
                  className="px-6 py-4 font-semibold tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center justify-end gap-1"><ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" /> Precio (COP)</div>
                </th>
                <th 
                  className="px-6 py-4 font-semibold tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center justify-end gap-1"><ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" /> Cantidad</div>
                </th>
                <th className="px-6 py-4 font-semibold tracking-wider">Estado</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <motion.tbody variants={tableContainerVariants} initial="hidden" animate="show" className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                     <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-20" />
                     Cargando inventario...
                   </td>
                </tr>
              ) : paginatedInventory.length === 0 ? (
                 <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                     {searchTerm || filterCategory !== 'All' || filterStatus !== 'All' ? 'No se encontraron productos con estos filtros.' : 'No hay artículos registrados en el inventario.'}
                   </td>
                 </tr>
              ) : (
                paginatedInventory.map((item) => {
                  const isOutOfStock = Number(item.stock) <= 0;
                  const isLowStock = Number(item.stock) <= 2 && !isOutOfStock;
                  return (
                    <motion.tr variants={rowVariants} key={item.id} className={`hover:bg-slate-50/50 transition-colors group ${isOutOfStock ? 'bg-rose-50/20' : isLowStock ? 'bg-amber-50/20' : ''}`}>
                      <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs font-mono">{item.sku || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-600"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs border border-slate-200">{item.category}</span></td>
                      <td className="px-6 py-4 font-medium text-slate-900 text-right">
                        $ {Number(item.price).toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-semibold ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-700'}`}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                            <AlertTriangle className="w-3 h-3" /> Agotado
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                            <AlertTriangle className="w-3 h-3" /> Stock Bajo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            En Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openAdjustModal(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Ajuste Rápido de Stock"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar Detalles"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </motion.tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Mostrando <span className="font-semibold text-slate-900 border border-slate-200 px-2 py-1 rounded bg-white">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredInventory.length)}</span> de <span className="font-semibold text-slate-900">{filteredInventory.length}</span> resultados
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 px-2">
                Página {currentPage} de {totalPages}
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

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  {editingItem ? <Edit2 className="w-5 h-5" /> : <Package2 className="w-5 h-5" />}
                </div>
                <h2 className="text-xl font-bold text-slate-900">{editingItem ? 'Editar Artículo' : 'Agregar Nuevo Artículo'}</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="itemName" className="block text-sm font-medium text-slate-700">Nombre del Producto</label>
                  <input 
                    id="itemName"
                    type="text" 
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Ej. Llanta Pirelli Diablo Rosso"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="sku" className="block text-sm font-medium text-slate-700">SKU / Código</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Tags className="w-4 h-4" /></span>
                    <input 
                      id="sku"
                      type="text" 
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="Ej. 000001"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className="block text-sm font-medium text-slate-700">Categoría</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all appearance-none"
                    required
                  >
                    <option value="" disabled>Selecciona una categoría</option>
                    <option value="Repuestos">Repuestos</option>
                    <option value="Consumibles">Consumibles (Aceite, etc)</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Herramientas">Herramientas</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="costPrice" className="block text-sm font-medium text-slate-700">Precio de Compra (COP)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                    <input 
                      id="costPrice"
                      type="number" 
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="Opcional"
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="price" className="block text-sm font-medium text-slate-700">Precio de Venta (COP)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                    <input 
                      id="price"
                      type="number" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">Cantidad Inicial</label>
                  <input 
                    id="quantity"
                    type="number" 
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    required
                  />
                  {quantity <= 0 && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Se registrará como Agotado
                    </p>
                  )}
                </div>
              </div>

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
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
                 >
                   {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingItem ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                   {isSubmitting ? 'Guardando...' : (editingItem ? 'Actualizar Artículo' : 'Guardar Artículo')}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Ajustar Stock</h2>
                </div>
              </div>
              <button 
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAdjustStock} className="p-5 space-y-5">
              <div className="text-sm bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="font-semibold text-slate-700">{adjustItem.name}</span>
                <span className="text-slate-500">Stock Actual: <strong className="text-slate-900">{adjustItem.stock}</strong></span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Ajuste de Cantidad <span className="text-xs font-normal text-slate-400">(Ej. +5 para ingreso, -2 para merma)</span></label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setAdjustQuantity(q => q - 1)} className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">-</button>
                    <input 
                      type="number" 
                      value={adjustQuantity}
                      onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                      className="w-full text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                      required
                    />
                     <button type="button" onClick={() => setAdjustQuantity(q => q + 1)} className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">+</button>
                  </div>
                  <div className="text-center text-xs text-slate-500 mt-1">
                    Nuevo stock resultante: <strong className={`text-base ${(adjustItem.stock + adjustQuantity) < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{adjustItem.stock + adjustQuantity}</strong>
                  </div>
                </div>

                <div className="col-span-2 space-y-2 mt-2">
                  <label className="block text-sm font-medium text-slate-700">Razón del Ajuste</label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all appearance-none"
                    required
                  >
                    <option value="Ajuste Manual">Ajuste Manual</option>
                    <option value="Inventario Físico">Inventario Físico</option>
                    <option value="Ingreso de Proveedor">Ingreso Proveedor (+)</option>
                    <option value="Merma / Daño">Merma / Producto Dañado (-)</option>
                    <option value="Devolución">Devolución de Cliente</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center gap-3">
                 <button 
                  type="submit"
                  disabled={isSubmitting || adjustQuantity === 0 || (adjustItem.stock + adjustQuantity) < 0}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                 >
                   {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Settings2 className="w-5 h-5" />}
                   Aplicar Ajuste de Stock
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reinforce Inventory Modal */}
      {isReinforceModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                  <PlusSquare className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Reforzar Inventario</h2>
              </div>
              <button 
                onClick={() => {
                  setIsReinforceModalOpen(false);
                  setSelectedReinforceItem(null);
                  setReinforceSearch('');
                }}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleReinforceSubmit} className="p-6 space-y-6">
              {!selectedReinforceItem ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Buscar Producto</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={reinforceSearch}
                        onChange={(e) => setReinforceSearch(e.target.value)}
                        placeholder="Nombre o SKU..." 
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50 bg-slate-50/30">
                    {reinforceSearch.length > 0 ? (
                      inventory
                        .filter(item => 
                          normalizeText(item.name).includes(normalizeText(reinforceSearch)) || 
                          (item.sku && normalizeText(item.sku).includes(normalizeText(reinforceSearch)))
                        )
                        .slice(0, 10)
                        .map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedReinforceItem(item)}
                            className="w-full p-3 text-left hover:bg-white transition-colors flex justify-between items-center group"
                          >
                            <div>
                              <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">{item.name}</p>
                              <p className="text-xs text-slate-500 font-mono">{item.sku || 'Sin SKU'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Stock Actual</p>
                              <p className="font-bold text-slate-700">{item.stock}</p>
                            </div>
                          </button>
                        ))
                    ) : (
                      <div className="p-8 text-center text-slate-400">
                        <Package2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Escribe para buscar productos</p>
                      </div>
                    )}
                    {reinforceSearch.length > 0 && inventory.filter(item => normalizeText(item.name).includes(normalizeText(reinforceSearch))).length === 0 && (
                      <div className="p-8 text-center text-slate-400">
                        <p className="text-sm">No se encontraron productos</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
                    <button 
                      type="button"
                      onClick={() => setSelectedReinforceItem(null)}
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Cambiar producto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Producto Seleccionado</p>
                    <p className="text-lg font-bold text-slate-900">{selectedReinforceItem.name}</p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                       <div>
                          <p className="text-xs text-slate-500 uppercase">Stock Actual</p>
                          <p className="text-xl font-black text-slate-700">{selectedReinforceItem.stock}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-xs text-slate-500 uppercase font-bold">Categoría</p>
                          <span className="inline-block bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">{selectedReinforceItem.category}</span>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">¿Cuántas unidades ingresan?</label>
                    <div className="flex items-center gap-4">
                      <button 
                        type="button" 
                        onClick={() => setReinforceQuantity(q => Math.max(1, q - 1))}
                        className="w-12 h-12 rounded-xl border-2 border-slate-200 flex items-center justify-center text-2xl font-bold text-slate-400 hover:border-emerald-500 hover:text-emerald-600 transition-all"
                      >-</button>
                      <input 
                        type="number" 
                        min="1"
                        value={reinforceQuantity}
                        onChange={(e) => setReinforceQuantity(Number(e.target.value))}
                        className="flex-1 text-center py-3 bg-white border-2 border-slate-200 rounded-xl font-black text-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner"
                        required
                        autoFocus
                      />
                      <button 
                        type="button" 
                        onClick={() => setReinforceQuantity(q => q + 1)}
                        className="w-12 h-12 rounded-xl border-2 border-slate-200 flex items-center justify-center text-2xl font-bold text-slate-400 hover:border-emerald-500 hover:text-emerald-600 transition-all"
                      >+</button>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex justify-between items-center">
                    <span className="text-emerald-700 font-medium">Nuevo Stock Total:</span>
                    <span className="text-2xl font-black text-emerald-700">{selectedReinforceItem.stock + reinforceQuantity}</span>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setSelectedReinforceItem(null)}
                      className="flex-1 py-3 px-4 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Atrás
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting || reinforceQuantity <= 0}
                      className="flex-[2] py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusSquare className="w-5 h-5" />}
                      {isSubmitting ? 'Guardando...' : 'Reforzar Stock'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Histórico de Movimientos</h2>
                </div>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto bg-slate-50 relative flex-1">
              {isLogsLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                  <p className="text-sm font-medium">Cargando historial...</p>
                </div>
              ) : inventoryLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 h-full">
                  <Clock className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-600 mb-1">Sin movimientos recientes</p>
                  <p className="text-sm text-center max-w-xs">Los ajustes manuales de stock aparecerán aquí una vez que crees la tabla inventory_logs.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 font-semibold tracking-wider">Fecha / Hora</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Producto</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Razón</th>
                      <th className="px-6 py-4 font-semibold tracking-wider text-right">Variación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventoryLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-100/50 transition-colors bg-white">
                        <td className="px-6 py-4 text-slate-500 font-medium font-mono text-xs whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('es-CO')}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900 uppercase">
                          {log.product_name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium">
                            {log.reason}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold font-mono">
                          <span className={log.change_amount > 0 ? 'text-emerald-600' : 'text-rose-500'}>
                            {log.change_amount > 0 ? '+' : ''}{log.change_amount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
