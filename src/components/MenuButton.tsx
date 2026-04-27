'use client';

import { Menu } from 'lucide-react';
import { useNav } from '@/context/NavContext';

export function MenuButton() {
  const { toggleSidebar } = useNav();

  return (
    <button
      onClick={toggleSidebar}
      className="p-2 -ml-2 text-slate-500 hover:text-brand-dark transition-colors rounded-md hover:bg-slate-100 md:hidden"
      aria-label="Abrir menú"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
}
