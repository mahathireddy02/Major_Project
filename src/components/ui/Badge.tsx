import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'yellow' | 'red' | 'blue' | 'slate' | 'purple' | 'orange'
  size?: 'sm' | 'md'
  className?: string
}

const variants = {
  green:  'bg-green-50 text-green-700 border border-green-200',
  yellow: 'bg-amber-50 text-amber-700 border border-amber-200',
  red:    'bg-red-50 text-red-700 border border-red-200',
  blue:   'bg-primary-50 text-primary-700 border border-primary-200',
  slate:  'bg-slate-100 text-slate-600 border border-slate-200',
  purple: 'bg-violet-50 text-violet-700 border border-violet-200',
  orange: 'bg-orange-50 text-orange-700 border border-orange-200',
}

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
}

export default function Badge({
  children,
  variant = 'blue',
  size = 'md',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}
