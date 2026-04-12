import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/inventory?select=*`;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function check() {
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  const data = await res.json();
  console.log(data);
  fs.writeFileSync('inventory_dump.json', JSON.stringify(data, null, 2));
}

check();
