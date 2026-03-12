import { supabase } from './client';

// --- Inventory Functions ---
export async function getInventory() {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addInventoryItem(item) {
  const { data, error } = await supabase
    .from('inventory')
    .insert([item])
    .select();
  if (error) throw error;
  return data[0];
}

// --- Expenses Functions ---
export async function getExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addExpense(expense) {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteExpense(id) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// --- Sales Functions ---
export async function getSales() {
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createSale(sale, items) {
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
  // dateStr is 'YYYY-MM-DD'
  // Correctly handle UTC start and end for that day
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

// --- Mechanics & Repairs Functions ---
export async function getMechanics() {
  const { data, error } = await supabase
    .from('mechanics')
    .select('*, repairs(*)')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addMechanic(name) {
  const { data, error } = await supabase
    .from('mechanics')
    .insert([{ name }])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateMechanic(id, name) {
  const { data, error } = await supabase
    .from('mechanics')
    .update({ name })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function addRepair(repair) {
  const { data, error } = await supabase
    .from('repairs')
    .insert([repair])
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteMechanic(id) {
  const { error } = await supabase
    .from('mechanics')
    .delete()
    .eq('id', id);
  if (error) throw error;
}