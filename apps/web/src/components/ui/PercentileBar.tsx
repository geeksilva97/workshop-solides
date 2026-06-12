import { cn } from '../../lib/cn'

interface PercentileBarProps {
  /** 0–100 */
  percentile: number
  /** "alta" = alert band (worse), anything else = healthy band. */
  status: string
  className?: string
}

/** Horizontal percentile track, colored by whether the KPI is in an alert band. */
export function PercentileBar({ percentile, status, className }: PercentileBarProps) {
  const clamped = Math.max(0, Math.min(100, percentile))
  const isAlert = status === 'alta' || status === 'critico'
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
        <div
          className={cn(
            'h-full rounded-full',
            isAlert ? 'bg-danger' : 'bg-success',
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span
        className={cn(
          'w-9 text-right text-xs font-semibold tabular-nums',
          isAlert ? 'text-danger' : 'text-success',
        )}
      >
        p{clamped}
      </span>
    </div>
  )
}
