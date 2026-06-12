import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { signUpSchema, type SignUpInput } from '@workshop/shared'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import {
  ArrowRightIcon,
  LockIcon,
  MailIcon,
  UserIcon,
} from '../../components/ui/icons'
import { useAuth } from '../../lib/useAuth'
import { useSignup } from './queries'

export function SignUpPage() {
  const signup = useSignup()
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) })

  const onSubmit = handleSubmit((data) => {
    signup.mutate(data, {
      onSuccess: (session) => {
        signIn(session)
        navigate('/benchmarks', { replace: true })
      },
    })
  })

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-heading">
        Criar conta
      </h1>
      <p className="mt-2 text-sm text-body">
        Plataforma de benchmark de RH.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5" noValidate>
        <Field label="Nome completo" htmlFor="name" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Seu nome"
            icon={<UserIcon className="size-[18px]" />}
            invalid={!!errors.name}
            {...register('name')}
          />
        </Field>

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
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            icon={<LockIcon className="size-[18px]" />}
            invalid={!!errors.password}
            {...register('password')}
          />
        </Field>

        {signup.isError ? (
          <p role="alert" className="text-sm font-medium text-danger">
            Não foi possível criar a conta. Tente novamente.
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={signup.isPending}>
          {signup.isPending ? <Spinner className="size-4 border-on-primary/40 border-t-on-primary" /> : null}
          Criar minha conta
          <ArrowRightIcon className="size-[18px]" />
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-body">
        Já tem conta?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
