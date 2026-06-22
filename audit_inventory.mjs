const SUPABASE_URL = 'https://zrcjftkorkhdeoernfwq.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyY2pmdGtvcmtoZGVvZXJuZndxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzMyOTU3NiwiZXhwIjoyMDg4OTA1NTc2fQ.atJ18I97JFww1aSr1csbRrdQe4yzqIKWlfIf40DLltM';

const r = await fetch(
  SUPABASE_URL + '/rest/v1/inventory?select=id,name,cost_price,price,stock&order=cost_price.desc&limit=10000',
  { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY } }
);
const items = await r.json();

console.log(`Total items: ${items.length}\n`);

// Show top 30 most expensive by cost_price
console.log('=== TOP 30 ITEMS POR PRECIO DE COMPRA (cost_price) ===\n');
items.slice(0, 30).forEach((item, i) => {
  const cost = Number(item.cost_price || 0);
  const price = Number(item.price || 0);
  const stock = Number(item.stock || 0);
  const subtotal = cost * stock;
  const ratio = price > 0 ? (cost / price).toFixed(2) : 'N/A';
  console.log(`${String(i+1).padStart(2)}. "${item.name}"`);
  console.log(`    cost_price: $${cost.toLocaleString('es-CO')} | precio_venta: $${price.toLocaleString('es-CO')} | stock: ${stock} | subtotal: $${subtotal.toLocaleString('es-CO')} | ratio costo/venta: ${ratio}`);
});

// Flag items where cost_price > price (compra más cara que venta = sospechoso)
console.log('\n=== ITEMS DONDE COSTO > PRECIO VENTA (posible error) ===\n');
let flagCount = 0;
items.forEach((item, i) => {
  const cost = Number(item.cost_price || 0);
  const price = Number(item.price || 0);
  if (cost > 0 && price > 0 && cost > price) {
    flagCount++;
    console.log(`⚠️  "${item.name}" | costo: $${cost.toLocaleString('es-CO')} > venta: $${price.toLocaleString('es-CO')} | stock: ${item.stock}`);
  }
});
if (flagCount === 0) console.log('✅ Ninguno encontrado.');

// Flag items where cost_price seems way too high (> $500,000)
console.log('\n=== ITEMS CON COSTO > $500,000 ===\n');
let highCount = 0;
items.forEach(item => {
  const cost = Number(item.cost_price || 0);
  if (cost > 500000) {
    highCount++;
    const stock = Number(item.stock || 0);
    console.log(`⚠️  "${item.name}" | costo: $${cost.toLocaleString('es-CO')} | stock: ${stock} | subtotal: $${(cost*stock).toLocaleString('es-CO')}`);
  }
});
if (highCount === 0) console.log('✅ Ninguno encontrado.');

// Grand total
let total = 0;
items.forEach(item => {
  total += Number(item.cost_price || 0) * Number(item.stock || 0);
});
console.log(`\n=== TOTAL COSTO DE INVENTARIO: $${total.toLocaleString('es-CO')} ===`);
