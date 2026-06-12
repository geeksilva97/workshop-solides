import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: ReactNode
  /** Optional element rendered on the right of the label row (e.g. a link). */
  labelTrailing?: ReactNode
  children: ReactNode
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  labelTrailing,
  children,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-heading">
          {label}
        </label>
        {labelTrailing}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-body">{hint}</p>
      ) : null}
    </div>
  )
}
