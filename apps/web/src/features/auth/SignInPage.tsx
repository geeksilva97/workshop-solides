import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signInSchema, type SignInInput } from '@workshop/shared'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { ArrowRightIcon, LockIcon, MailIcon } from '../../components/ui/icons'
import { useAuth } from '../../lib/useAuth'
import { useLogin } from './queries'

export function SignInPage() {
  const login = useLogin()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? '/benchmarks'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) })

  const onSubmit = handleSubmit((data) => {
    login.mutate(data, {
      onSuccess: (session) => {
        signIn(session)
        navigate(from, { replace: true })
      },
    })
  })

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-heading">
        Bem-vindo
      </h1>
      <p className="mt-2 text-sm text-body">
        Acesse para comparar seus indicadores de RH.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5" noValidate>
        <Field label="E-mail corporativo" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.com"
            icon={<MailIcon className="size-[18px]" />}
            invalid={!!errors.email}
            {...register('email')}
          />
        </Field>

        <Field label="Senha" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            icon={<LockIcon className="size-[18px]" />}
            invalid={!!errors.password}
            {...register('password')}
          />
        </Field>

        <div className="text-right">
          <Link
            to="/reset-password"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>

        {login.isError ? (
          <p role="alert" className="text-sm font-medium text-danger">
            Não foi possível entrar. Tente novamente.
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={login.isPending}>
          {login.isPending ? <Spinner className="size-4 border-on-primary/40 border-t-on-primary" /> : null}
          Entrar
          <ArrowRightIcon className="size-[18px]" />
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-body">
        Não tem conta?{' '}
        <Link to="/signup" className="font-semibold text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  )
}
