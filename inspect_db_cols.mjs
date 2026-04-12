import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('inventory').insert([{ name: 'Test Col', stock: 1, price: 1, purchase_price: 1 }]).select();
  if (error) console.log("Insert purchase_price error: ", error.message);
  
  const { data: data2, error: err2 } = await supabase.from('inventory').insert([{ name: 'Test Col 2', stock: 1, price: 1, cost_price: 1 }]).select();
  if (err2) console.log("Insert cost_price error: ", err2.message);
  else {
     console.log("Success with cost_price!", data2);
     await supabase.from('inventory').delete().eq('id', data2[0].id);
  }
}

run();
