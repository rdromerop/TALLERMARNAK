import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSale() {
  console.log('Testing createSale error...');
  // Dummy sale
  const sale = {
    customer_name: 'Test Customer',
    motorcycle: 'Test Moto',
    total_amount: 100,
    status: 'Pagado',
    payment_method: 'Efectivo'
  };

  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .insert([sale])
    .select();
  
  if (saleError) {
    console.error('Error inserting sale:', saleError);
    return;
  }
  const newSale = saleData[0];
  console.log('Sale created successfully:', newSale.id);

  // We need an existing inventory item
  const { data: invData } = await supabase.from('inventory').select('id').limit(1);
  if (!invData || invData.length === 0) {
    console.log('No inventory items found to test sale items.');
    return;
  }

  const inventory_id = invData[0].id;

  const items = [{
    sale_id: newSale.id,
    item_name: 'Test Item',
    quantity: 1,
    price: 100,
    unit_cost: 50,
    profit: 50,
    subtotal: 100,
    inventory_id: inventory_id
  }];

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(items);
  
  if (itemsError) {
    console.error('Error inserting sale items:', itemsError);
    console.log('Attempting cleanup...');
    await supabase.from('sales').delete().eq('id', newSale.id);
    return;
  }
  console.log('Sale items created successfully.');

  console.log('Testing decrement_stock RPC...');
  const { error: rpcError } = await supabase.rpc('decrement_stock', { 
      row_id: inventory_id, 
      amount: 1 
  });
  
  if (rpcError) {
      console.error('RPC Error (decrement_stock):', rpcError);
      console.log('Attempting cleanup...');
      await supabase.from('sales').delete().eq('id', newSale.id);
      return;
  }
  console.log('decrement_stock ran successfully!');

  // cleanup
  await supabase.from('sales').delete().eq('id', newSale.id);
  console.log('Cleanup done. Everything works perfectly.');
}

testSale();
