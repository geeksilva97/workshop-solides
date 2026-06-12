import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface InputProps extends ComponentPropsWithRef<'input'> {
  invalid?: boolean
  icon?: ReactNode
}

const baseInput =
  'h-11 w-full rounded-btn border bg-card px-3.5 text-sm text-heading placeholder:text-body/60 transition-colors focus:outline-2 focus:outline-offset-0 focus:outline-primary'

export function Input({ className, invalid, icon, ...props }: InputProps) {
  if (icon) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-body">
          {icon}
        </span>
        <input
          className={cn(
            baseInput,
            'pl-10',
            invalid ? 'border-danger' : 'border-line',
            className,
          )}
          {...props}
        />
      </div>
    )
  }

  return (
    <input
      className={cn(
        baseInput,
        invalid ? 'border-danger' : 'border-line',
        className,
      )}
      {...props}
    />
  )
}
