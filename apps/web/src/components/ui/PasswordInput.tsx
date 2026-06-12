import { useState, type ComponentPropsWithRef } from 'react'
import { Input } from './Input'
import { EyeIcon, EyeOffIcon, LockIcon } from './icons'

interface PasswordInputProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  invalid?: boolean
}

/** Password field with a lock icon and a show/hide toggle. */
export function PasswordInput({ invalid, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <Input
      type={visible ? 'text' : 'password'}
      invalid={invalid}
      icon={<LockIcon className="size-[18px]" />}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          className="flex size-7 items-center justify-center rounded-md text-body hover:text-heading"
        >
          {visible ? (
            <EyeOffIcon className="size-[18px]" />
          ) : (
            <EyeIcon className="size-[18px]" />
          )}
        </button>
      }
      {...props}
    />
  )
}
