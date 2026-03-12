'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, Package2, X, Tags, Loader2 } from 'lucide-react';
import { getInventory, addInventoryItem } from '@/supabase/functions';

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
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchInventory();
  }, []);

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

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newItem = {
        name: itemName,
        sku,
        category,
        price: Number(price),
        stock: Number(quantity)
      };

      await addInventoryItem(newItem);
      
      setItemName('');
      setSku('');
      setCategory('');
      setPrice('');
      setQuantity(1);
      setIsModalOpen(false);
      fetchInventory();
    } catch (error: any) {
      console.error('Error adding item:', error);
      if (error.code === '23505') {
        alert('Este SKU ya existe. Por favor usa un código diferente.');
      } else {
        alert('Hubo un error al agregar el artículo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(item => item.stock <= 5 && item.stock > 0).length;
  const outOfStockItems = inventory.filter(item => item.stock <= 0).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestión de Inventario</h1>
          <p className="text-slate-500 mt-1">Gestiona repuestos, aceites y accesorios.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Agregar Artículo
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Package2 className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Artículos</p>
            <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : totalItems}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-sm flex items-center gap-4 hover:border-amber-300 transition-colors">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-amber-600">Stock Bajo</p>
            <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : lowStockItems}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-rose-200 p-5 shadow-sm flex items-center gap-4 hover:border-rose-300 transition-colors">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-rose-600">Agotados</p>
            <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : outOfStockItems}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar productos por nombre o SKU..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          {isLoading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Nombre del Producto</th>
                <th className="px-6 py-4 font-semibold tracking-wider">SKU</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Categoría</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Precio (COP)</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Cantidad</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                     <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-20" />
                     Cargando inventario...
                   </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                     {searchTerm ? 'No se encontraron productos coincidentes.' : 'No hay artículos registrados en el inventario.'}
                   </td>
                 </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isOutOfStock = Number(item.stock) <= 0;
                  const isLowStock = Number(item.stock) <= 5 && !isOutOfStock;
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors group ${isOutOfStock ? 'bg-rose-50/20' : isLowStock ? 'bg-amber-50/20' : ''}`}>
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Package2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Agregar Nuevo Artículo</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddItem} className="p-6 space-y-5">
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
                      placeholder="SKU-001"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                      required
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
                  <label htmlFor="price" className="block text-sm font-medium text-slate-700">Precio (COP)</label>
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
                   {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                   {isSubmitting ? 'Guardando...' : 'Guardar Artículo'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
