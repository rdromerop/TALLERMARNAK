const SUPABASE_URL = 'https://zrcjftkorkhdeoernfwq.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyY2pmdGtvcmtoZGVvZXJuZndxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzMyOTU3NiwiZXhwIjoyMDg4OTA1NTc2fQ.atJ18I97JFww1aSr1csbRrdQe4yzqIKWlfIf40DLltM';

// 1. Buscar el item "Cortaviento universal"
const r1 = await fetch(
  SUPABASE_URL + '/rest/v1/inventory?select=id,name,cost_price,price,stock&name=like.*Cortaviento*',
  { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY } }
);
const items = await r1.json();
console.log('=== CORTAVIENTO UNIVERSAL - DETALLE ===');
console.log(JSON.stringify(items, null, 2));

// 2. Calcular el total real excluyendo el cortaviento mal cargado
const r2 = await fetch(
  SUPABASE_URL + '/rest/v1/inventory?select=name,cost_price,stock&order=name.asc&limit=10000',
  { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY } }
);
const allItems = await r2.json();

let totalWithBug = 0;
let totalWithout = 0;
let problemItems = [];

allItems.forEach(item => {
  const cost = Number(item.cost_price || 0);
  const qty = Number(item.stock || 0);
  const sub = cost * qty;
  totalWithBug += sub;
  
  // Detectar items con cost_price sospechosamente alto (> 1 millón)
  if (cost > 1000000) {
    problemItems.push({ name: item.name, cost_price: cost, stock: qty, subtotal: sub });
  } else {
    totalWithout += sub;
  }
});

console.log('\n=== ITEMS CON PRECIO SOSPECHOSO (> $1,000,000) ===');
problemItems.forEach((item, i) => {
  console.log(`${i+1}. "${item.name}" | cost: $${item.cost_price.toLocaleString('es-CO')} | stock: ${item.stock} | subtotal: $${item.subtotal.toLocaleString('es-CO')}`);
});

console.log(`\n=== TOTALES ===`);
console.log(`Total CON items problemáticos: $${totalWithBug.toLocaleString('es-CO')}`);
console.log(`Total SIN items problemáticos: $${totalWithout.toLocaleString('es-CO')}`);
console.log(`Total items en inventario: ${allItems.length}`);
