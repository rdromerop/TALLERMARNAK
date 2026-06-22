
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getInventoryLocal() {
  let allData = [];
  let from = 0;
  let to = 999;
  const chunkSize = 1000;
  let finished = false;

  console.log('Starting chunked fetch...');

  while (!finished) {
    console.log(`Fetching range ${from} to ${to}...`);
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name', { ascending: true })
      .range(from, to);

    if (error) {
       console.error('Error fetching chunk:', error);
       throw error;
    }
    
    if (data && data.length > 0) {
      console.log(`Received ${data.length} items.`);
      allData = [...allData, ...data];
      if (data.length < chunkSize) {
        console.log('No more items found.');
        finished = true;
      } else {
        from += chunkSize;
        to += chunkSize;
      }
    } else {
      console.log('No data received in this range.');
      finished = true;
    }
    
    if (allData.length >= 20000) {
      console.warn('Inventory fetch reached safety limit of 20,000 items.');
      finished = true;
    }
  }

  return allData;
}

getInventoryLocal().then(data => {
  console.log('Total items fetched:', data.length);
}).catch(err => {
  console.error('Failed:', err);
});
