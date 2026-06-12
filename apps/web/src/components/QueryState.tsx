import type { ReactNode } from 'react'
import { Spinner } from './ui/Spinner'

interface QueryStateProps {
  isLoading: boolean
  isError: boolean
  children: ReactNode
  errorMessage?: string
}

/** Renders a centered spinner / error message, or the children when ready. */
export function QueryState({
  isLoading,
  isError,
  children,
  errorMessage = 'Não foi possível carregar os dados.',
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-8" />
      </div>
    )
  }
  if (isError) {
    return (
      <div className="rounded-card border border-danger/30 bg-danger-tint/50 p-6 text-sm font-medium text-danger">
        {errorMessage}
      </div>
    )
  }
  return <>{children}</>
}
