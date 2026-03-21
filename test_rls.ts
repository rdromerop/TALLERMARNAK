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

async function testRLS() {
  console.log('Testing RLS policies for inventory...');

  // 1. Try to read as ANONYMOUS
  console.log('--- ANONYMOUS TEST ---');
  const { data: anonData, error: anonError } = await supabase.from('inventory').select('*').limit(1);
  console.log('Anon Read Rows:', anonData?.length || 0);
  console.log('Anon Read Error:', anonError?.message || 'None');

  // 2. Sign up a temp user to get an AUTHENTICATED session
  console.log('\n--- AUTHENTICATED TEST ---');
  const testEmail = `test_${Date.now()}@marnak.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'securepassword123'
  });

  if (authError) {
    console.error('Failed to create test user:', authError.message);
    // If signups are disabled, let's try to login as a known user if the user provided one, but we don't have it.
    // We will just return.
    return;
  }
  console.log('Test user created and logged in:', testEmail);

  // 3. Try to read as AUTHENTICATED
  const { data: authReadData, error: authReadError } = await supabase.from('inventory').select('*').limit(1);
  console.log('Auth Read Rows:', authReadData?.length || 0);
  console.log('Auth Read Error:', authReadError?.message || 'None');

  // 4. Try to insert as AUTHENTICATED
  const testItem = {
    name: 'Test RLS Item',
    sku: 'TEST-' + Date.now(),
    category: 'Test',
    price: 100,
    cost_price: 50,
    stock: 10
  };
  
  const { data: authInsertData, error: authInsertError } = await supabase.from('inventory').insert([testItem]).select();
  
  if (authInsertError) {
    console.error('Auth Insert FAIL:', authInsertError.message);
    console.error(authInsertError);
  } else {
    console.log('Auth Insert SUCCESS! Item ID:', authInsertData[0].id);
    // Clean up
    await supabase.from('inventory').delete().eq('id', authInsertData[0].id);
    console.log('Cleanup successful.');
  }

  console.log('\nDone testing RLS.');
}

testRLS();
