import { LogOut } from 'lucide-react';
import { redirect } from 'next/navigation';

export async function Header() {
  const mockUser = { email: 'admin@marnak.com' }

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* Placeholder for breadcrumbs or mobile menu toggle */}
        <h2 className="text-lg font-semibold text-slate-800 md:hidden">Marnak</h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-700 hidden sm:block">
          {mockUser.email}
        </span>
        <form action={async () => {
          'use server'
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
