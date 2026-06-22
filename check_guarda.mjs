const SUPABASE_URL = 'https://zrcjftkorkhdeoernfwq.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyY2pmdGtvcmtoZGVvZXJuZndxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzMyOTU3NiwiZXhwIjoyMDg4OTA1NTc2fQ.atJ18I97JFww1aSr1csbRrdQe4yzqIKWlfIf40DLltM';

const r = await fetch(
  SUPABASE_URL + '/rest/v1/inventory?select=*&name=like.*Guard*Barro*',
  { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY } }
);
const items = await r.json();

console.log('=== DETALLE COMPLETO DE "Guarda Barro" ===\n');
items.forEach((item, i) => {
  console.log(`--- Item ${i+1} ---`);
  Object.entries(item).forEach(([key, val]) => {
    console.log(`  ${key}: ${JSON.stringify(val)}`);
  });
  console.log('');
});
