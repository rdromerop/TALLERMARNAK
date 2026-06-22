
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCount() {
  const { count, error } = await supabase
    .from('inventory')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total items in database:', count);

  const { data, error: dataError } = await supabase
    .from('inventory')
    .select('id')
    .limit(2000);

  if (dataError) {
     console.error('Data Error:', dataError);
  } else {
     console.log('Fetched items with limit(2000):', data.length);
  }
}

checkCount();
