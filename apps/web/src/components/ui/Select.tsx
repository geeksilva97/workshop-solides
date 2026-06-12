import type { ComponentPropsWithRef } from 'react'
import { cn } from '../../lib/cn'
import { ChevronDownIcon } from './icons'

interface SelectProps extends ComponentPropsWithRef<'select'> {
  invalid?: boolean
}

export function Select({ className, invalid, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          'h-11 w-full appearance-none rounded-btn border bg-card px-3.5 pr-10 text-sm text-heading transition-colors focus:outline-2 focus:outline-primary',
          invalid ? 'border-danger' : 'border-line',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute inset-y-0 right-3 my-auto text-body" />
    </div>
  )
}
