import { cn, getSeatColor } from '../../lib/utils'

interface SeatProgressProps {
  filled: number
  total: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animated?: boolean
}

const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-2.5' }

export default function SeatProgress({
  filled,
  total,
  showLabel = true,
  size = 'md',
  className,
  animated = true,
}: SeatProgressProps) {
  const pct = Math.min(100, (filled / total) * 100)
  const barColor = getSeatColor(filled, total)

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-600">
            {filled} / {total} seats
          </span>
          {filled >= total && (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              FULL
            </span>
          )}
          {filled < total && filled / total >= 0.8 && (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Almost Full
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            barColor,
            animated && 'transition-[width]'
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={filled}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
      {showLabel && (
        <div className="flex gap-1 mt-2">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 h-1 rounded-full transition-colors duration-300',
                i < filled ? barColor : 'bg-slate-100'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
