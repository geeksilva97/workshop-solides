import { cn } from '../../lib/cn'

interface LogoProps {
  /** Show the "Solides Run" wordmark next to the monogram. */
  withWordmark?: boolean
  className?: string
}

export function Logo({ withWordmark = true, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-on-primary">
        SR
      </div>
      {withWordmark ? (
        <div className="leading-tight">
          <p className="font-bold text-heading">Solides Run</p>
          <p className="text-xs text-body">benchmark de RH</p>
        </div>
      ) : null}
    </div>
  )
}
