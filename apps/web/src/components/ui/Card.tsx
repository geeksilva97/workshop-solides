import type { ComponentPropsWithRef } from 'react'
import { cn } from '../../lib/cn'

export function Card({
  className,
  ...props
}: ComponentPropsWithRef<'div'>) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-card shadow-card',
        className,
      )}
      {...props}
    />
  )
}
