import pkg from './src/supabase/client.js';
const { supabase } = pkg;

async function check() {
    console.log('Verifying Supabase Schema...');
    const { data: cols, error: colError } = await supabase.from('sale_items').select('inventory_id').limit(1);
    console.log('Has inventory_id column?', colError ? colError.message : 'Yes');

    const { error: rpcError } = await supabase.rpc('decrement_stock', { row_id: '00000000-0000-0000-0000-000000000000', amount: 0 });
    console.log('decrement_stock RPC exists?', rpcError && rpcError.code === 'PGRST104' ? 'No' : 'Yes (' + (rpcError?.message || 'OK') + ')');
}
check();
