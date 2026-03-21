import { createClient } from '@/utils/supabase/client';

// --- Inventory Functions ---
export async function getInventory() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addInventoryItem(item) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('inventory')
    .insert([item])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateInventoryItem(id, updates) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('inventory')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function adjustInventoryStock(id, newStock, reason, productName, changeAmount) {
  const supabase = createClient();
  // 1. Update stock
  const { data, error } = await supabase
    .from('inventory')
    .update({ stock: newStock })
    .eq('id', id)
    .select();
  if (error) throw error;

  // 2. Log the adjustment (silently fail if table doesn't exist yet so it doesn't break)
  try {
     await supabase.from('inventory_logs').insert([{
       inventory_id: id,
       product_name: productName,
       change_amount: changeAmount,
       reason: reason
     }]);
  } catch(e) {
     console.warn('Could not log inventory adjust (table might not exist yet)', e);
  }

  return data[0];
}

export async function getInventoryLogs() {
  const supabase = createClient();
  try {
     const { data, error } = await supabase
       .from('inventory_logs')
       .select('*')
       .order('created_at', { ascending: false })
       .limit(100);
     if (error) throw error;
     return data || [];
  } catch(e) {
     console.warn('Could not fetch inventory logs (table might not exist yet)', e);
     return [];
  }
}

export async function deleteInventoryItem(id) {
  const supabase = createClient();
  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// --- Expenses Functions ---
export async function getExpenses() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addExpense(expense) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateExpense(id, updates) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteExpense(id) {
  const supabase = createClient();
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// --- Sales Functions ---
export async function getSales() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createSale(sale, items) {
  const supabase = createClient();
  // 1. Create the sale record
  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .insert([sale])
    .select();
  
  if (saleError) throw saleError;
  const newSale = saleData[0];

  // 2. Create the sale items
  const itemsWithSaleId = items.map(item => ({
    ...item,
    sale_id: newSale.id
  }));

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(itemsWithSaleId);
  
  if (itemsError) throw itemsError;

  // 3. Update inventory stock
  for (const item of items) {
     if (item.inventory_id && item.quantity > 0) {
        console.log(`Decrementing stock for ${item.inventory_id} by ${item.quantity}...`);
        const { error: rpcError } = await supabase.rpc('decrement_stock', { 
           row_id: item.inventory_id, 
           amount: item.quantity 
        });
        
        if (rpcError) {
           console.error('RPC Error (decrement_stock):', rpcError);
           throw rpcError;
        }
     }
  }

  return newSale;
}

export async function getSalesByDate(dateStr) {
  const supabase = createClient();
  // dateStr is 'YYYY-MM-DD'
  const startDate = `${dateStr}T00:00:00.000Z`;
  const endDate = `${dateStr}T23:59:59.999Z`;
  
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });
    
  if (error) throw error;
  return data;
}

export async function getSalesByDateRange(startStr, endStr) {
  const supabase = createClient();
  const startDate = `${startStr}T00:00:00.000Z`;
  const endDate = `${endStr}T23:59:59.999Z`;
  
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
    
  if (error) throw error;
  return data;
}

export async function cancelSale(saleId) {
  const supabase = createClient();
  // 1. Get the sale and its items
  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('id', saleId)
    .single();
    
  if (saleError) throw saleError;
  
  if (saleData.status === 'Anulada') {
     throw new Error('La venta ya está anulada.');
  }

  // 2. Update inventory stock (Revert)
  for (const item of saleData.sale_items) {
     if (item.inventory_id && item.quantity > 0) {
        const { error: rpcError } = await supabase.rpc('decrement_stock', { 
           row_id: item.inventory_id, 
           amount: -item.quantity // Revert stock
        });
        
        if (rpcError) {
           console.error('RPC Error reverting stock, falling back to manual update:', rpcError);
           const { data: invItem } = await supabase.from('inventory').select('stock').eq('id', item.inventory_id).single();
           if (invItem) {
               await supabase.from('inventory').update({ stock: invItem.stock + item.quantity }).eq('id', item.inventory_id);
           }
        }
     }
  }

  // 3. Mark sale as Anulada
  const { error: updateError } = await supabase
    .from('sales')
    .update({ status: 'Anulada' })
    .eq('id', saleId);
    
  if (updateError) throw updateError;
}

export async function updateSaleStatus(saleId, status) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sales')
    .update({ status: status })
    .eq('id', saleId)
    .select();
    
  if (error) throw error;
  return data[0];
}

// --- Mechanics & Repairs Functions ---
export async function getMechanics() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('mechanics')
    .select('*, repairs(*)')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addMechanic(name) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('mechanics')
    .insert([{ name }])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateMechanic(id, name) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('mechanics')
    .update({ name })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function addRepair(repair) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('repairs')
    .insert([repair])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateRepairStatus(id, status) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('repairs')
    .update({ status })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteMechanic(id) {
  const supabase = createClient();
  const { error } = await supabase
    .from('mechanics')
    .delete()
    .eq('id', id);
  if (error) throw error;
}