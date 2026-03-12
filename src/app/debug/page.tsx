'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { Info, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function DebugPage() {
  const [status, setStatus] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEverything();
  }, []);

  async function checkEverything() {
    setLoading(true);
    const results: any = {};

    // 1. Check Tables
    const tables = ['inventory', 'expenses', 'sales', 'sale_items', 'mechanics', 'repairs'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      results[table] = {
        exists: !error || (error && error.code !== '42P01'),
        error: error ? error.message : null,
        code: error ? error.code : 'OK'
      };
    }

    // 2. Check sale_items columns specifically
    const { data: cols, error: colError } = await supabase.from('sale_items').select('*').limit(1);
    const hasInventoryId = cols && (cols.length === 0 || 'inventory_id' in cols[0]);
    
    // Fallback check if table is empty: try to fetch column names from metadata or just report it
    results['sale_items_column_check'] = {
      exists: hasInventoryId,
      error: !hasInventoryId ? 'Column "inventory_id" is missing in sale_items table' : null,
      code: !hasInventoryId ? 'MISSING_COLUMN' : 'OK'
    };

    // 3. Check RPC
    const { error: rpcError } = await supabase.rpc('decrement_stock', { 
      row_id: '00000000-0000-0000-0000-000000000000', 
      amount: 0 
    });
    
    results['rpc_decrement_stock'] = {
      exists: !rpcError || (rpcError && rpcError.code !== 'PGRST104'),
      error: rpcError ? rpcError.message : null,
      code: rpcError ? rpcError.code : 'OK'
    };

    setStatus(results);
    setLoading(false);
  }

  if (loading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Info className="text-blue-600" /> Supabase Diagnostic
      </h1>
      
      <div className="grid gap-4">
        {Object.entries(status).map(([key, value]: any) => (
          <div key={key} className={`p-4 rounded-xl border ${value.exists ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold">{key}</span>
              {value.exists ? <CheckCircle2 className="text-emerald-600 w-5 h-5" /> : <XCircle className="text-rose-600 w-5 h-5" />}
            </div>
            {value.error && (
              <p className="mt-2 text-xs text-rose-700 font-mono bg-white/50 p-2 rounded">
                [{value.code}] {value.error}
              </p>
            )}
          </div>
        ))}
      </div>

      <button 
        onClick={checkEverything}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold"
      >
        REINTENTAR DIAGNÓSTICO
      </button>
    </div>
  );
}
