import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  trend?: { value: string; isPositive: boolean };
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export function MetricCard({ title, value, trend, icon: Icon, iconBg, iconColor }: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 relative overflow-hidden group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 blur-2xl group-hover:scale-150 transition-transform duration-500 ${iconBg}`} />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
        <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor} shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="flex items-end gap-3 relative z-10">
        <div className="text-3xl font-bold tracking-tight text-slate-900">{value}</div>
        {trend && (
          <div className={`text-sm font-medium mb-1 px-2 py-0.5 rounded-md ${trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </div>
        )}
      </div>
    </div>
  );
}
