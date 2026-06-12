import type { ComponentPropsWithRef } from 'react'

interface CheckboxProps extends ComponentPropsWithRef<'input'> {
  label: string
}

export function Checkbox({ label, id, ...props }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2.5 rounded-btn border border-line bg-card px-3.5 py-2.5 text-sm text-heading has-checked:border-primary has-checked:bg-primary-tint"
    >
      <input
        id={id}
        type="checkbox"
        className="size-4 accent-primary"
        {...props}
      />
      {label}
    </label>
  )
}
