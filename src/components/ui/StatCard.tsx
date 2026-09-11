import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  trend?: { value: string; positive: boolean }
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'rose' | 'slate'
  className?: string
}

const colors = {
  blue:   'bg-primary-50 text-primary-600',
  green:  'bg-green-50 text-green-600',
  amber:  'bg-amber-50 text-amber-600',
  purple: 'bg-violet-50 text-violet-600',
  rose:   'bg-rose-50 text-rose-600',
  slate:  'bg-slate-100 text-slate-500',
}

export default function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  color = 'blue',
  className,
}: StatCardProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-slate-200 shadow-card p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">{label}</p>
          <p className="mt-1.5 text-2xl font-heading font-bold text-slate-900">{value}</p>
          {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-semibold',
                  trend.positive ? 'text-green-600' : 'text-red-500'
                )}
              >
                {trend.positive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-slate-400">vs yesterday</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3', colors[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
