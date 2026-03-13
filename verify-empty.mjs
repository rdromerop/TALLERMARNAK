
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, './.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key. Check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('--- Verifying Marnak Dashboard Status (Should be empty) ---');
  
  const tables = [
    'inventory',
    'expenses',
    'sales',
    'mechanics'
  ];

  for (const table of tables) {
    try {
      console.log(`Checking ${table}...`);
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) throw error;
      
      if (count === 0) {
        console.log(`✅ ${table} table is EMPTY (Count: 0)`);
      } else {
        console.log(`⚠️ ${table} table still has ${count} records!`);
      }
    } catch (e) {
      console.log(`❌ ${table} table error:`, e.message);
    }
  }

  // Check RPC
  try {
    console.log('Checking decrement_stock RPC...');
    const { error } = await supabase.rpc('decrement_stock', { row_id: '00000000-0000-0000-0000-000000000000', amount: 0 });
    if (error && error.message.includes('function') && error.message.includes('not found')) {
       console.log('❌ decrement_stock RPC NOT found');
    } else {
       console.log('✅ decrement_stock RPC exists');
    }
  } catch (e) {
    console.log('❌ RPC check failed:', e.message);
  }
}

checkSchema();
