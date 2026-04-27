import { LogOut } from 'lucide-react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { MenuButton } from './MenuButton';

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <MenuButton />
        <h2 className="text-lg font-bold text-brand-dark md:hidden">MARNAK</h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-700 hidden sm:block">
          {user?.email || 'Usuario'}
        </span>
        <form action={async () => {
          'use server'
          const supabase = await createClient();
          await supabase.auth.signOut();
          redirect('/login')
        }}>
          <button type="submit" className="p-2 text-slate-500 hover:text-red-600 transition-colors rounded-md hover:bg-red-50" title="Cerrar sesión">
            <LogOut className="w-5 h-5" />
          </button>
        </form>
      </div>
    </header>
  );
}
