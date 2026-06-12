import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { resetPasswordSchema, type ResetPasswordInput } from '@workshop/shared'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  AtSignIcon,
  CheckIcon,
} from '../../components/ui/icons'
import { useResetPassword } from './queries'

export function ResetPasswordPage() {
  const reset = useResetPassword()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) })

  const onSubmit = handleSubmit((data) => reset.mutate(data))

  if (reset.isSuccess) {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success-tint text-success">
          <CheckIcon />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-heading">
          Verifique seu e-mail
        </h1>
        <p className="mt-2 text-sm text-body">{reset.data.message}</p>
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeftIcon className="size-[18px]" />
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-heading">
          Recuperar senha
        </h1>
        <p className="mt-2 text-sm text-body">
          Insira seu e-mail para receber um link de redefinição.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5" noValidate>
        <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nome@empresa.com.br"
            icon={<AtSignIcon className="size-[18px]" />}
            invalid={!!errors.email}
            {...register('email')}
          />
        </Field>

        <Button type="submit" size="lg" disabled={reset.isPending}>
          {reset.isPending ? (
            <Spinner className="size-4 border-on-primary/40 border-t-on-primary" />
          ) : null}
          Enviar link
          <ArrowRightIcon className="size-[18px]" />
        </Button>
      </form>

      <Link
        to="/login"
        className="mt-8 inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeftIcon className="size-[18px]" />
        Voltar para o login
      </Link>
    </div>
  )
}
