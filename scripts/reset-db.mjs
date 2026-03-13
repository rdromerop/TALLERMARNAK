
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key. Check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetDatabase() {
  console.log('--- Reseting Marnak Dashboard Database ---');
  
  const tables = [
    'sale_items',
    'sales',
    'repairs',
    'mechanics',
    'expenses',
    'inventory'
  ];

  for (const table of tables) {
    console.log(`Clearing table: ${table}...`);
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything (neq dummy id)

    if (error) {
      console.error(`Error clearing ${table}:`, error.message);
    } else {
      console.log(`✅ Table ${table} cleared.`);
    }
  }

  console.log('--- Reset Complete ---');
}

resetDatabase();
