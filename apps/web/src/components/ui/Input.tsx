import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface InputProps extends ComponentPropsWithRef<'input'> {
  invalid?: boolean
  /** Leading adornment (e.g. an icon). */
  icon?: ReactNode
  /** Trailing adornment (e.g. a password visibility toggle). */
  trailing?: ReactNode
}

const baseInput =
  'h-11 w-full rounded-btn border bg-card px-3.5 text-sm text-heading placeholder:text-body/60 transition-colors focus:outline-2 focus:outline-offset-0 focus:outline-primary'

export function Input({
  className,
  invalid,
  icon,
  trailing,
  ...props
}: InputProps) {
  const borderClass = invalid ? 'border-danger' : 'border-line'

  if (icon || trailing) {
    return (
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-body">
            {icon}
          </span>
        ) : null}
        <input
          className={cn(
            baseInput,
            borderClass,
            icon ? 'pl-10' : '',
            trailing ? 'pr-10' : '',
            className,
          )}
          {...props}
        />
        {trailing ? (
          <span className="absolute inset-y-0 right-2 flex items-center">
            {trailing}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <input className={cn(baseInput, borderClass, className)} {...props} />
  )
}
