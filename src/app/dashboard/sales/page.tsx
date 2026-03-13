'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle2, Package, User, Bike, CreditCard, X, Loader2, Search, Filter, MoreHorizontal, Calendar } from 'lucide-react';
import { getInventory, createSale, getSales } from '@/supabase/functions';

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
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [motorcycle, setMotorcycle] = useState('');

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
        status: 'Pagado'
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
      fetchInventory(); // Refresh stock
      fetchSales(); // Refresh history
    } catch (error) {
      console.error('Error in checkout:', error);
      alert('Hubo un error al procesar la venta.');
    } finally {
      setIsProcessingSale(false);
    }
  };

  const filteredInventory = inventory.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSales = salesData.filter(s => 
    s.customer_name?.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    s.motorcycle?.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    s.id?.toLowerCase().includes(historySearchTerm.toLowerCase())
  );

  // Get only today's sales
  const today = new Date().toISOString().split('T')[0];
  const todaySales = filteredSales.filter(s => s.date?.startsWith(today));

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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Calendar className="w-5 h-5" />
             </div>
             <div>
                <h3 className="font-bold text-slate-900">Ventas de Hoy</h3>
                <p className="text-xs text-slate-500">Resumen de transacciones del día</p>
             </div>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={historySearchTerm}
              onChange={(e) => setHistorySearchTerm(e.target.value)}
              placeholder="Buscar venta..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Cliente</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Moto</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Hora / Fecha</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Monto (COP)</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-emerald-600 text-right">Ganancia</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Estado</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Artículos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingSales ? (
                 <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                       <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                       Cargando historial...
                    </td>
                 </tr>
              ) : todaySales.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                     No se han registrado ventas hoy.
                   </td>
                 </tr>
              ) : (
                todaySales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
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
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex flex-col items-end gap-1">
                          {sale.sale_items?.map((item: any, i: number) => (
                             <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded font-medium">
                                {item.quantity} x {item.item_name}
                             </span>
                          ))}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-sm text-slate-500 font-medium">
           <span>Total Hoy: <span className="text-slate-900 font-bold">{todaySales.length} ventas</span></span>
           <div className="flex items-center gap-6">
              <span className="flex flex-col items-end">
                <span className="text-xs uppercase tracking-wider">Ganancia</span>
                <span className="text-emerald-600 font-bold text-base">
                  $ {todaySales.reduce((sum, s) => sum + (s.sale_items?.reduce((itemSum: number, item: any) => itemSum + Number(item.profit || 0), 0) || 0), 0).toLocaleString('es-CO')}
                </span>
              </span>
              <span className="flex flex-col items-end">
                <span className="text-xs uppercase tracking-wider">Monto Total</span>
                <span className="text-blue-600 font-black text-lg">
                  $ {todaySales.reduce((sum, s) => sum + Number(s.total_amount), 0).toLocaleString('es-CO')}
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
    </div>
  );
}
