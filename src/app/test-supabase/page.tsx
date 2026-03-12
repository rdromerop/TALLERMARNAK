'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';
import { Database, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        // Just try to fetch some metadata or any simple query
        // PGRST116/42P01 means we connected but table doesn't exist, which is fine for a raw connection test
        const { error: supabaseError } = await supabase.from('_test_connection').select('*').limit(1);
        
        // If we get an error response from Supabase, but it's about the table not existing,
        // it means we ARE connected and authenticated successfully.
        if (supabaseError) {
          console.log('Supabase responded with code:', supabaseError.code, supabaseError.message);
          
          // Codes for 'table not found' or similar schema issues
          const isConnected = ['PGRST116', '42P01', 'PGRST104'].includes(supabaseError.code) || 
                             supabaseError.message?.includes('schema cache');

          if (!isConnected) {
            throw supabaseError;
          }
        }
        
        setStatus('success');
      } catch (err: any) {
        console.error('Connection error:', err);
        setError(err.message || 'Error desconocido al conectar');
        setStatus('error');
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`p-4 rounded-full ${
            status === 'loading' ? 'bg-blue-50 text-blue-500' :
            status === 'success' ? 'bg-emerald-50 text-emerald-500' :
            'bg-rose-50 text-rose-500'
          }`}>
            {status === 'loading' && <Loader2 className="w-12 h-12 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="w-12 h-12" />}
            {status === 'error' && <XCircle className="w-12 h-12" />}
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {status === 'loading' && 'Verificando Conexión...'}
              {status === 'success' && '¡Conectado a Supabase!'}
              {status === 'error' && 'Error de Conexión'}
            </h1>
            <p className="text-slate-500 mt-2">
              {status === 'loading' && 'Intentando comunicar con el servidor de Supabase...'}
              {status === 'success' && 'Las credenciales en .env.local son correctas y el cliente está inicializado.'}
              {status === 'error' && error}
            </p>
          </div>

          <div className="w-full pt-6 mt-6 border-t border-slate-100 flex flex-col space-y-3 font-mono text-xs text-left">
             <div className="flex flex-col gap-1">
                <span className="text-slate-500 uppercase tracking-wider font-bold">URL Detectada:</span>
                <span className={`p-2 rounded ${process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project') ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-800'} break-all`}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL || 'No encontrada'}
                </span>
                {process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project') && (
                  <span className="text-[10px] text-amber-600 font-sans italic">⚠ Parece que sigues usando el valor de ejemplo</span>
                )}
             </div>
             <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase tracking-wider font-bold">Anon Key:</span>
                <span className={`px-2 py-0.5 rounded ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('your-anon-key') || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
                    ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-anon-key') ? 'EJEMPLO ⚠' : 'CARGADA ✓')
                    : 'FALTANTE ⨯'}
                </span>
             </div>
          </div>

          <a 
            href="/dashboard"
            className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Ir al Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
