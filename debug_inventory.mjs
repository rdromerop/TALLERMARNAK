const SUPABASE_URL = 'https://zrcjftkorkhdeoernfwq.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyY2pmdGtvcmtoZGVvZXJuZndxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzMyOTU3NiwiZXhwIjoyMDg4OTA1NTc2fQ.atJ18I97JFww1aSr1csbRrdQe4yzqIKWlfIf40DLltM';

// Buscar items con cost_price mayor a 100,000
const r1 = await fetch(
  SUPABASE_URL + '/rest/v1/inventory?select=name,cost_price,stock&cost_price=gte.100000&order=cost_price.desc',
  { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY } }
);
const bigItems = await r1.json();
console.log('=== ITEMS CON PRECIO DE COMPRA > $100,000 ===\n');
bigItems.forEach((item, i) => {
  const cost = Number(item.cost_price || 0);
  const stock = Number(item.stock || 0);
  console.log(`${i+1}. "${item.name}" | cost: $${cost.toLocaleString('es-CO')} | stock: ${stock} | subtotal: $${(cost*stock).toLocaleString('es-CO')}`);
});

// También los últimos 5 items (offset 998)
const r2 = await fetch(
  SUPABASE_URL + '/rest/v1/inventory?select=name,cost_price,stock&order=name.asc&offset=998',
  { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY, 'Range-Unit': 'items', Range: '998-1002' } }
);
const lastItems = await r2.json();
console.log('\n=== ÚLTIMOS 5 ITEMS ALFABÉTICAMENTE ===\n');
lastItems.forEach((item, i) => {
  const cost = Number(item.cost_price || 0);
  const stock = Number(item.stock || 0);
  console.log(`${i+1}. "${item.name}" | cost: $${cost.toLocaleString('es-CO')} | stock: ${stock} | subtotal: $${(cost*stock).toLocaleString('es-CO')}`);
});
