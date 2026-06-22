import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testNullable() {
  // 1. Create sale
  const { data: sale, error } = await supabase.from('sales').insert([{
    customer_name: 'Test Venta Rapida',
    total_amount: 1000,
    status: 'Pagado',
    payment_method: 'Efectivo'
  }]).select();
  if (error) return console.log(error);

  const saleId = sale[0].id;
  // 2. Create item
  const { error: err2 } = await supabase.from('sale_items').insert([{
     sale_id: saleId,
     item_name: 'Ingreso Extra',
     quantity: 1,
     price: 1000,
     unit_cost: 0,
     profit: 1000,
     subtotal: 1000,
     inventory_id: null
  }]);
  if (err2) {
    console.log("Error inserting null inventory_id", err2);
  } else {
    console.log("Success inserting null inventory_id!");
    await supabase.from('sales').delete().eq('id', saleId);
  }
}
testNullable();
