const SUPABASE_URL = 'https://zrcjftkorkhdeoernfwq.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyY2pmdGtvcmtoZGVvZXJuZndxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzMyOTU3NiwiZXhwIjoyMDg4OTA1NTc2fQ.atJ18I97JFww1aSr1csbRrdQe4yzqIKWlfIf40DLltM';

const r = await fetch(
  SUPABASE_URL + '/rest/v1/inventory?select=name,cost_price,price,stock&order=name.asc&limit=10000',
  { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY } }
);
const items = await r.json();

let total = 0;
let itemsConCosto = 0;
let itemsSinCosto = 0;

console.log('# | NOMBRE | COSTO COMPRA | PRECIO VENTA | STOCK | SUBTOTAL (costo*stock)');
console.log('-'.repeat(120));

items.forEach((item, i) => {
  const cost = Number(item.cost_price || 0);
  const price = Number(item.price || 0);
  const stock = Number(item.stock || 0);
  const subtotal = cost * stock;
  total += subtotal;
  
  if (cost > 0) itemsConCosto++;
  else itemsSinCosto++;

  console.log(
    `${String(i+1).padStart(4)} | ${item.name.padEnd(50).substring(0,50)} | $${String(cost).padStart(10)} | $${String(price).padStart(10)} | ${String(stock).padStart(5)} | $${String(subtotal).padStart(12)}`
  );
});

console.log('-'.repeat(120));
console.log(`\nTOTAL ITEMS: ${items.length}`);
console.log(`Items CON cost_price: ${itemsConCosto}`);
console.log(`Items SIN cost_price (= $0): ${itemsSinCosto}`);
console.log(`\nTOTAL COSTO INVENTARIO: $${total.toLocaleString('es-CO')}`);
