import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: missing Supabase URL or Anon Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAddRepair() {
  // Let's get a mechanic first.
  const { data: mechanics, error: mechErr } = await supabase.from('mechanics').select('id').limit(1);
  if (mechErr || !mechanics || mechanics.length === 0) {
      console.error('Could not fetch mechanic to test with', mechErr);
      return;
  }
  
  const mechanicId = mechanics[0].id;
  console.log(`Testing adding repair for mechanic: ${mechanicId}`);

  const testRepair = {
    mechanic_id: mechanicId,
    time: '12:00',
    task: 'Test Job for Debugging',
    cost: 1000,
    status: 'Pendiente',
    commission_percentage: 50,
    commission_amount: 500
  };

  const { data, error } = await supabase
    .from('repairs')
    .insert([testRepair])
    .select();

  if (error) {
    console.error('SUPABASE DB ERROR:', JSON.stringify(error, null, 2));
  } else {
    console.log('SUCCESS:', data);
    
    // delete it to keep db clean
    await supabase.from('repairs').delete().eq('id', data[0].id);
    console.log('Cleaned up test row.');
  }
}

testAddRepair();
