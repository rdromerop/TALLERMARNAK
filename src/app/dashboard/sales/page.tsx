'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle2, Package, User, Bike, CreditCard, X, Loader2, Search, Filter, MoreHorizontal, Calendar, Ban, Receipt, Banknote, Clock, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getInventory, createSale, getSales, cancelSale, updateSaleStatus } from '@/supabase/functions';

interface CartItem {
  id: string; // This will be the inventory_id
  name: string;
  price: number;
  cost_price: number;
  quantity: number;
  stock: number;
}

export default function SalesPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSales, setIsLoadingSales] = useState(true);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sales History Filters
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  // Sorting and Pagination
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Checkout State
  const [customerName, setCustomerName] = useState('');
  const [motorcycle, setMotorcycle] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  
  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  useEffect(() => {
    fetchInventory();
    fetchSales();
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

  async function fetchSales() {
    try {
      setIsLoadingSales(true);
      const data = await getSales();
      setSalesData(data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setIsLoadingSales(false);
    }
  }

  const handleAddToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('No hay suficiente stock disponible.');
          return prev;
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: product.price,
        cost_price: product.cost_price || 0,
        quantity: 1,
        stock: product.stock
      }];
    });
    setIsModalOpen(false);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > item.stock && delta > 0) {
          alert('Stock máximo alcanzado.');
          return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (isProcessingSale) return;

    try {
      setIsProcessingSale(true);
      
      const sale = {
        customer_name: customerName,
        motorcycle: motorcycle,
        total_amount: total,
        status: paymentMethod === 'Crédito' ? 'Pendiente' : 'Pagado',
        payment_method: paymentMethod
      };

      const saleItems = cart.map(item => {
        const itemProfit = (item.price - item.cost_price) * item.quantity;
        return {
          item_name: item.name,
          quantity: item.quantity,
          price: item.price,
          unit_cost: item.cost_price,
          profit: itemProfit,
          subtotal: item.price * item.quantity,
          inventory_id: item.id // Used for stock decrement
        };
      });

      await createSale(sale, saleItems);
      
      // Success!
      alert('¡Venta realizada con éxito!');
      setCart([]);
      setCustomerName('');
      setMotorcycle('');
      setPaymentMethod('Efectivo');
      fetchInventory(); // Refresh stock
      fetchSales(); // Refresh history
    } catch (error) {
      console.error('Error in checkout:', error);
      alert('Hubo un error al procesar la venta.');
    } finally {
      setIsProcessingSale(false);
    }
  };

  const handleMarkAsPaid = async (saleId: string) => {
    try {
      setIsLoadingSales(true);
      await updateSaleStatus(saleId, 'Pagado');
      alert('Venta marcada como pagada.');
      fetchSales();
    } catch(error) {
       console.error('Error marking as paid:', error);
       alert('Hubo un error al actualizar el estado de la venta.');
       setIsLoadingSales(false);
    }
  };

  const handleCancelSale = async (saleId: string) => {
    if (!confirm('¿Estás seguro de que deseas anular esta venta? El stock será devuelto al inventario.')) return;
    
    try {
      setIsLoadingSales(true);
      await cancelSale(saleId);
      alert('Venta anulada con éxito. El stock ha sido restablecido.');
      fetchInventory();
      fetchSales();
    } catch (error) {
      console.error('Error canceling sale:', error);
      alert('Hubo un error al anular la venta.');
      setIsLoadingSales(false);
    }
  };

  const normalizeText = (text: string) => 
    text ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';

  const filteredInventory = inventory.filter(p => 
    normalizeText(p.name).includes(normalizeText(searchTerm)) ||
    (p.sku && normalizeText(p.sku).includes(normalizeText(searchTerm)))
  );

  const filteredSales = salesData.filter(s => {
    const sTerm = normalizeText(historySearchTerm);
    const matchesSearch = 
      normalizeText(s.customer_name).includes(sTerm) ||
      normalizeText(s.motorcycle).includes(sTerm) ||
      normalizeText(s.id).includes(sTerm) ||
      (s.sale_items && s.sale_items.some((item: any) => normalizeText(item.item_name).includes(sTerm)));
      
    const matchesStatus = filterStatus === 'Todos' || s.status === filterStatus;
    
    // Date Filtering Logic
    let matchesDate = true;
    const saleDateStr = new Date(s.date).toISOString().split('T')[0];
    
    if (filterDateFrom && filterDateTo) {
      matchesDate = saleDateStr >= filterDateFrom && saleDateStr <= filterDateTo;
    } else if (filterDateFrom) {
      matchesDate = saleDateStr >= filterDateFrom;
    } else if (filterDateTo) {
      matchesDate = saleDateStr <= filterDateTo;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate totals for filtered sales (only valid/paid ones usually, but let's decide how "Hoy" behaves)
  const isViewingTodayOnly = !filterDateFrom && !filterDateTo && filterStatus === 'Todos' && !historySearchTerm;
  const today = new Date().toISOString().split('T')[0];
  let displaySales = isViewingTodayOnly ? filteredSales.filter(s => s.date?.startsWith(today)) : filteredSales;

  // Sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  displaySales.sort((a, b) => {
    if (sortConfig.key === 'customer') {
       return sortConfig.direction === 'asc' ? (a.customer_name || '').localeCompare(b.customer_name || '') : (b.customer_name || '').localeCompare(a.customer_name || '');
    } else if (sortConfig.key === 'date') {
       return sortConfig.direction === 'asc' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortConfig.key === 'amount') {
       return sortConfig.direction === 'asc' ? Number(a.total_amount) - Number(b.total_amount) : Number(b.total_amount) - Number(a.total_amount);
    } else if (sortConfig.key === 'profit') {
       const profitA = a.sale_items?.reduce((sum: number, item: any) => sum + Number(item.profit || 0), 0) || 0;
       const profitB = b.sale_items?.reduce((sum: number, item: any) => sum + Number(item.profit || 0), 0) || 0;
       return sortConfig.direction === 'asc' ? profitA - profitB : profitB - profitA;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(displaySales.length / itemsPerPage);
  const paginatedSales = displaySales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [historySearchTerm, filterDateFrom, filterDateTo, filterStatus]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Punto de Venta</h1>
          <p className="text-slate-500 mt-1">Registra ventas de repuestos y servicios.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
           <Package className="w-4 h-4" />
           {isLoading ? 'Cargando inventario...' : `${inventory.length} productos disponibles`}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Carrito de Compra
              </h3>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Agregar Producto
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
                  <Package className="w-16 h-16 mb-4 opacity-10" />
                  <p className="text-lg">El carrito está vacío</p>
                  <p className="text-sm">Agrega productos del inventario para comenzar</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{item.name}</h4>
                        <p className="text-sm text-slate-500">$ {item.price.toLocaleString('es-CO')}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded-md transition-all"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-slate-700">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded-md transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="w-28 text-right font-bold text-slate-900">
                        $ {(item.price * item.quantity).toLocaleString('es-CO')}
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="text-xl font-bold text-slate-900">$ {total.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center text-2xl font-black text-blue-600">
                <span>TOTAL</span>
                <span>$ {total.toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6 sticky top-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Información del Cliente
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre completo" 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Moto / Modelo</label>
                <div className="relative">
                  <Bike className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={motorcycle}
                    onChange={(e) => setMotorcycle(e.target.value)}
                    placeholder="Ej. Yamaha MT-03" 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Método de Pago</label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none font-medium text-slate-700"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia (Nequi/Daviplata)</option>
                    <option value="Tarjeta">Tarjeta (Datafono)</option>
                    <option value="Crédito">Pendiente por Pagar (Crédito)</option>
                  </select>
                </div>
                {paymentMethod === 'Crédito' && (
                  <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" /> La venta quedará pendiente de cobro.
                  </p>
                )}
              </div>
            </div>

            <button 
              disabled={cart.length === 0 || isProcessingSale}
              onClick={handleCheckout}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {isProcessingSale ? <Loader2 className="w-6 h-6 animate-spin" /> : <CreditCard className="w-6 h-6" />}
              {isProcessingSale ? 'PROCESANDO...' : 'FINALIZAR VENTA'}
            </button>
            <p className="text-center text-xs text-slate-400">Al finalizar, se descontará automáticamente el stock del inventario.</p>
          </div>
        </div>
      </div>

      {/* Sales History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-200 flex flex-col gap-4 bg-slate-50/50">
          <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Receipt className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="font-bold text-slate-900">{isViewingTodayOnly ? 'Ventas de Hoy' : 'Historial de Ventas'}</h3>
                  <p className="text-xs text-slate-500">{isViewingTodayOnly ? 'Resumen de transacciones del día' : 'Mostrando resultados filtrados'}</p>
               </div>
            </div>
          </div>
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                placeholder="Buscar cliente, moto o ID..." 
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2">
               <input 
                 type="date" 
                 value={filterDateFrom}
                 onChange={(e) => setFilterDateFrom(e.target.value)}
                 className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm text-slate-600"
               />
               <span className="text-slate-400 text-sm">a</span>
               <input 
                 type="date" 
                 value={filterDateTo}
                 onChange={(e) => setFilterDateTo(e.target.value)}
                 className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm text-slate-600"
               />
            </div>
             <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm min-w-[140px] appearance-none cursor-pointer"
             >
                <option value="Todos">Todos los Estados</option>
                <option value="Pagado">Pagado</option>
                <option value="Pendiente">Pendiente (Crédito)</option>
                <option value="Anulada">Anulada</option>
             </select>
          </div>
        </div>
        
        <div className="overflow-x-auto flex-1 h-full min-h-[300px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th 
                  className="px-6 py-4 font-semibold tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => handleSort('customer')}
                >
                  <div className="flex items-center gap-1">Cliente <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" /></div>
                </th>
                <th className="px-6 py-4 font-semibold tracking-wider">Moto</th>
                <th 
                  className="px-6 py-4 font-semibold tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">Hora / Fecha <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" /></div>
                </th>
                <th 
                  className="px-6 py-4 font-semibold tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1"><ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" /> Monto (COP)</div>
                </th>
                <th 
                  className="px-6 py-4 font-semibold tracking-wider text-emerald-600 text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => handleSort('profit')}
                >
                  <div className="flex items-center justify-end gap-1"><ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" /> Ganancia</div>
                </th>
                <th className="px-6 py-4 font-semibold tracking-wider">Estado</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Artículos</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingSales ? (
                 <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                       <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                       Cargando historial...
                    </td>
                 </tr>
              ) : displaySales.length === 0 ? (
                 <tr>
                   <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                     No se han encontrado ventas con los filtros actuales.
                   </td>
                 </tr>
              ) : (
                paginatedSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={(e) => {
                     // don't open receipt if clicking on actions
                     const target = e.target as HTMLElement;
                     if (!target.closest('button')) {
                        setSelectedReceipt(sale);
                     }
                  }}>
                    <td className="px-6 py-4 font-bold text-slate-900 uppercase">{sale.customer_name || 'Sin nombre'}</td>
                    <td className="px-6 py-4 text-slate-600">{sale.motorcycle || '---'}</td>
                    <td className="px-6 py-4 text-slate-500">
                       <div className="flex flex-col">
                          <span className="font-medium">{new Date(sale.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[10px]">{new Date(sale.date).toLocaleDateString()}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 text-right">
                      $ {Number(sale.total_amount).toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 text-right">
                      $ {sale.sale_items?.reduce((sum: number, item: any) => sum + Number(item.profit || 0), 0).toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                        sale.status === 'Pagado' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : sale.status === 'Pendiente'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : sale.status === 'Anulada'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : 'bg-slate-50 text-slate-700 border border-slate-100'
                      }`}>
                        {sale.status}
                      </span>
                      {sale.payment_method && sale.status !== 'Anulada' && (
                         <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{sale.payment_method}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex flex-col items-end gap-1">
                          {sale.sale_items?.slice(0, 2).map((item: any, i: number) => (
                             <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium max-w-[120px] truncate">
                                {item.quantity}x {item.item_name}
                             </span>
                          ))}
                          {sale.sale_items?.length > 2 && (
                             <span className="text-[10px] text-slate-400 italic">+{sale.sale_items.length - 2} más...</span>
                          )}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {sale.status === 'Pendiente' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(sale.id); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                            title="Marcar como Pagada"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Pagar
                          </button>
                        )}
                        {sale.status !== 'Anulada' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCancelSale(sale.id); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                            title="Anular Venta"
                          >
                            <Ban className="w-3.5 h-3.5" /> Anular
                          </button>
                        )}
                        <button 
                           onClick={(e) => { e.stopPropagation(); setSelectedReceipt(sale); }}
                           className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                           title="Ver Ticket"
                        >
                           <Receipt className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Mostrando <span className="font-semibold text-slate-900 border border-slate-200 px-2 py-1 rounded bg-white">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, displaySales.length)}</span> de <span className="font-semibold text-slate-900">{displaySales.length}</span> resultados
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                ))}
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

        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-sm text-slate-500 font-medium">
           <span>Total Mostrado: <span className="text-slate-900 font-bold">{displaySales.filter(s => s.status !== 'Anulada').length} ventas válidas</span></span>
           <div className="flex items-center gap-6">
              <span className="flex flex-col items-end">
                <span className="text-xs uppercase tracking-wider">Ganancia</span>
                <span className="text-emerald-600 font-bold text-base">
                  $ {displaySales.filter(s => s.status !== 'Anulada').reduce((sum, s) => sum + (s.sale_items?.reduce((itemSum: number, item: any) => itemSum + Number(item.profit || 0), 0) || 0), 0).toLocaleString('es-CO')}
                </span>
              </span>
              <span className="flex flex-col items-end">
                <span className="text-xs uppercase tracking-wider">Monto Total</span>
                <span className="text-blue-600 font-black text-lg">
                  $ {displaySales.filter(s => s.status !== 'Anulada').reduce((sum, s) => sum + Number(s.total_amount), 0).toLocaleString('es-CO')}
                </span>
              </span>
           </div>
        </div>
      </div>

      {/* Product Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Seleccionar Producto</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                 <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 bg-slate-50/50">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                   type="text" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="Buscar por nombre o SKU..." 
                   className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                 />
               </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
              {isLoading ? (
                <div className="p-12 text-center text-slate-400">
                   <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
                   Cargando productos...
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="p-12 text-center text-slate-400">No hay productos que coincidan.</div>
              ) : (
                filteredInventory.map((product) => (
                  <button 
                    key={product.id}
                    disabled={product.stock <= 0}
                    onClick={() => handleAddToCart(product)}
                    className="w-full p-4 flex items-center justify-between hover:bg-blue-50/50 transition-all text-left group disabled:opacity-50 disabled:grayscale"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{product.name}</span>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{product.sku}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Stock disponible: <span className={product.stock <= 5 ? 'text-rose-500 font-bold' : 'text-emerald-600 font-bold'}>{product.stock}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-black text-slate-900">$ {Number(product.price).toLocaleString('es-CO')}</div>
                      </div>
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recibo / Ticket Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 print:hidden">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                 <Receipt className="w-5 h-5" /> Detalle de Venta
              </h3>
              <button 
                onClick={() => setSelectedReceipt(null)} 
                className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
              >
                 <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* TICKET TEMPLATE */}
            <div id="receipt-print" className="p-6 bg-white overflow-y-auto flex-1 text-sm font-mono text-slate-800">
               <div className="text-center mb-6 border-b-2 border-dashed border-slate-200 pb-4">
                  <h2 className="text-2xl font-black uppercase tracking-widest mb-1">Marnak</h2>
                  <p className="text-xs text-slate-500 uppercase">Taller & Repuestos</p>
                  <div className="mt-4 flex flex-col items-center text-xs gap-1">
                     <span>Recibo #: {selectedReceipt.id.split('-')[0].toUpperCase()}</span>
                     <span>Fecha: {new Date(selectedReceipt.date).toLocaleString('es-CO')}</span>
                  </div>
               </div>

               <div className="space-y-2 mb-6 border-b-2 border-dashed border-slate-200 pb-4 text-xs">
                  <div className="grid grid-cols-2">
                     <span className="font-bold">Cliente:</span>
                     <span className="text-right uppercase">{selectedReceipt.customer_name || 'Consumidor Final'}</span>
                  </div>
                  {selectedReceipt.motorcycle && (
                     <div className="grid grid-cols-2">
                        <span className="font-bold">Moto:</span>
                        <span className="text-right uppercase">{selectedReceipt.motorcycle}</span>
                     </div>
                  )}
                  <div className="grid grid-cols-2">
                     <span className="font-bold">Estado:</span>
                     <span className="text-right uppercase">{selectedReceipt.status}</span>
                  </div>
               </div>

               <table className="w-full mb-6">
                  <thead className="border-b border-slate-800 text-xs">
                     <tr>
                        <th className="text-left font-bold py-1">CANT</th>
                        <th className="text-left font-bold py-1">DESCRIPCIÓN</th>
                        <th className="text-right font-bold py-1">IMPORTE</th>
                     </tr>
                  </thead>
                  <tbody className="text-xs">
                     {selectedReceipt.sale_items?.map((item: any, i: number) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                           <td className="py-2 text-center align-top w-12">{item.quantity}</td>
                           <td className="py-2 align-top">{item.item_name}
                              <div className="text-[10px] text-slate-500">${Number(item.price).toLocaleString('es-CO')} c/u</div>
                           </td>
                           <td className="py-2 text-right align-top font-bold">${Number(item.subtotal).toLocaleString('es-CO')}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>

               <div className="border-t-2 border-dashed border-slate-200 pt-4 space-y-2">
                  <div className="flex justify-between items-center text-lg font-black">
                     <span>TOTAL</span>
                     <span>$ {Number(selectedReceipt.total_amount).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 uppercase">
                     <span>Método Pago</span>
                     <span>{selectedReceipt.payment_method || 'Efectivo'}</span>
                  </div>
               </div>

               <div className="mt-8 text-center text-xs text-slate-500 italic">
                  ¡Gracias por su compra!<br/>
                  Conserve este recibo para reclamos o garantías.
               </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 print:hidden">
               <button 
                  onClick={() => setSelectedReceipt(null)}
                  className="flex-1 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
               >
                  Cerrar
               </button>
               <button 
                  onClick={() => {
                     // Basic print trigger focusing on ticket structure using CSS (In a real app would use a print lib)
                     const printContent = document.getElementById('receipt-print');
                     const WinPrint = window.open('', '', 'width=900,height=650');
                     if (WinPrint && printContent) {
                        WinPrint.document.write(`
                          <html>
                            <head>
                              <title>Imprimir Ticket</title>
                              <style>
                                body { font-family: monospace; width: 300px; margin: 0 auto; color: #000; padding: 20px;}
                                table { width: 100%; border-collapse: collapse; }
                                th, td { padding: 4px 0; border-bottom: 1px dotted #ccc; }
                                .text-center { text-align: center; }
                                .text-right { text-align: right; }
                                .font-bold { font-weight: bold; }
                                .border-dashed { border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px;}
                              </style>
                            </head>
                            <body>
                              ${printContent.innerHTML}
                            </body>
                          </html>
                        `);
                        WinPrint.document.close();
                        WinPrint.focus();
                        setTimeout(() => {
                           WinPrint.print();
                           WinPrint.close();
                        }, 500);
                     } else {
                        window.print();
                     }
                  }}
                  className="flex-1 py-2 bg-blue-600 text-white border border-blue-600 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
               >
                  Imprimir Ticket
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
