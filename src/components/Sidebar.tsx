'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, ShoppingCart, Wrench, Package, Receipt, PieChart } from 'lucide-react';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Resumen', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Ventas', href: '/dashboard/sales', icon: ShoppingCart },
  { name: 'Mecánicos', href: '/dashboard/repairs', icon: Wrench },
  { name: 'Inventario', href: '/dashboard/inventory', icon: Package },
  { name: 'Gastos', href: '/dashboard/expenses', icon: Receipt },
  { name: 'Reportes', href: '/dashboard/reports', icon: PieChart },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-brand-dark text-white min-h-screen flex flex-col hidden md:flex border-r border-slate-800 shadow-xl relative z-20">
      <div className="py-6 flex flex-col items-center justify-center border-b border-slate-800/50 bg-brand-green/10">
        <div className="relative w-56 h-48 mb-2 filter drop-shadow-2xl hover:scale-105 transition-transform duration-300">
          <Image
            src="/marnak-logo-user-clean.png"
            alt="Marnak Logo"
            fill
            className="object-contain"
          />
        </div>
        <h1 className="text-4xl font-black tracking-[0.2em] text-brand-gold uppercase">
          MARNAK
        </h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-semibold group ${
                isActive 
                  ? 'bg-brand-gold text-brand-dark shadow-lg shadow-brand-gold/20 scale-[1.02]' 
                  : 'hover:bg-brand-green/20 text-slate-400 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${
                isActive ? 'text-brand-dark' : 'text-slate-500 group-hover:text-brand-gold'
              }`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-800/50 text-[10px] text-slate-500 text-center font-bold tracking-widest bg-brand-dark/50 italic">
        © 2026 TALLER MARNAK
      </div>
    </aside>
  );
}
