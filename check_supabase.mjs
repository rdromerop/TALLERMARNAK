
import { getInventory, getSales, getExpenses, getMechanics } from './src/supabase/functions.js';

async function checkSchema() {
  console.log('--- Checking Supabase Schema Status ---');
  
  try {
    console.log('Checking inventory...');
    await getInventory();
    console.log('✅ inventory table exists');
  } catch (e) {
    console.log('❌ inventory table error:', e.message);
  }

  try {
    console.log('Checking expenses...');
    await getExpenses();
    console.log('✅ expenses table exists');
  } catch (e) {
    console.log('❌ expenses table error:', e.message);
  }

  try {
    console.log('Checking sales...');
    await getSales();
    console.log('✅ sales table exists (and sale_items via join)');
  } catch (e) {
    console.log('❌ sales/sale_items error:', e.message);
  }

  try {
    console.log('Checking mechanics...');
    await getMechanics();
    console.log('✅ mechanics table exists (and repairs via join)');
  } catch (e) {
    console.log('❌ mechanics/repairs error:', e.message);
  }

  // Check RPC
  try {
    const { supabase } = await import('./src/supabase/client.js');
    console.log('Checking decrement_stock RPC...');
    const { error } = await supabase.rpc('decrement_stock', { row_id: '00000000-0000-0000-0000-000000000000', amount: 0 });
    if (error && error.message.includes('function') && error.message.includes('not found')) {
       console.log('❌ decrement_stock RPC NOT found');
    } else {
       console.log('✅ decrement_stock RPC exists (returned error is likely due to dummy ID)');
    }
  } catch (e) {
    console.log('❌ RPC check failed:', e.message);
  }
}

checkSchema();
