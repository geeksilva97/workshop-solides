import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  INDICATOR_LABELS,
  indicatorEnum,
  newBenchmarkSchema,
  type NewBenchmarkInput,
} from '@workshop/shared'
import { PageHeader } from '../../components/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Checkbox } from '../../components/ui/Checkbox'
import { Field } from '../../components/ui/Field'
import { Select } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import { ArrowRightIcon } from '../../components/ui/icons'
import { useCompanies, useCreateBenchmark } from './queries'

const SETORES = [
  'Tecnologia / Software (J-62)',
  'Serviços financeiros (K-64)',
  'Saúde (Q-86)',
  'Indústria (C)',
]
const PORTES = [
  '100–500 colaboradores',
  '50–100 colaboradores',
  '500–1000 colaboradores',
]
const REGIOES = ['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte']

const DEFAULT_INDICATORS: NewBenchmarkInput['indicators'] = [
  'turnover_voluntario',
  'turnover_involuntario',
  'absenteismo',
  'time_to_hire',
]

export function NewBenchmarkPage() {
  const companies = useCompanies()
  const create = useCreateBenchmark()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NewBenchmarkInput>({
    resolver: zodResolver(newBenchmarkSchema),
    defaultValues: {
      companyId: '',
      filters: { setor: SETORES[0], porte: PORTES[0], regiao: REGIOES[0] },
      indicators: DEFAULT_INDICATORS,
    },
  })

  // Default to the first company once the list loads, so the selected option
  // and the submitted companyId always agree (works for real API and mocks).
  const firstCompanyId = companies.data?.[0]?.id
  useEffect(() => {
    if (firstCompanyId) setValue('companyId', firstCompanyId)
  }, [firstCompanyId, setValue])

  const onSubmit = handleSubmit((data) => {
    create.mutate(data, {
      onSuccess: ({ id }) => navigate(`/benchmarks/${id}/running`),
    })
  })

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title="Novo benchmark"
        subtitle="Escolha a empresa cliente e defina o cohort de comparáveis. O Solides Run busca os pares, calcula os percentis e gera o diagnóstico."
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <Card className="flex flex-col gap-5 p-6">
          <Field label="Empresa cliente" htmlFor="companyId" error={errors.companyId?.message}>
            <Select id="companyId" invalid={!!errors.companyId} {...register('companyId')}>
              {companies.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.description}
                </option>
              ))}
            </Select>
          </Field>
        </Card>

        <Card className="flex flex-col gap-5 p-6">
          <div>
            <h2 className="text-base font-semibold text-heading">
              Cohort comparável
            </h2>
            <p className="mt-1 text-sm text-body">
              Recorte de empresas pares usado na comparação.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Setor (CNAE)" htmlFor="setor">
              <Select id="setor" {...register('filters.setor')}>
                {SETORES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Porte (headcount)" htmlFor="porte">
              <Select id="porte" {...register('filters.porte')}>
                {PORTES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Região" htmlFor="regiao">
              <Select id="regiao" {...register('filters.regiao')}>
                {REGIOES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <Field
            label="Indicadores no recorte"
            error={errors.indicators?.message}
            hint="k-anonimato: mínimo de 5 empresas no cohort pra evitar identificação reversa. Cohort menor é bloqueado por padrão (LGPD)."
          >
            <div className="grid gap-2.5 sm:grid-cols-2">
              {indicatorEnum.options.map((indicator) => (
                <Checkbox
                  key={indicator}
                  id={`ind-${indicator}`}
                  value={indicator}
                  label={INDICATOR_LABELS[indicator]}
                  {...register('indicators')}
                />
              ))}
            </div>
          </Field>
        </Card>

        {create.isError ? (
          <p role="alert" className="text-sm font-medium text-danger">
            Não foi possível iniciar o benchmark. Tente novamente.
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={create.isPending}>
            {create.isPending ? (
              <Spinner className="size-4 border-on-primary/40 border-t-on-primary" />
            ) : null}
            Rodar benchmark
            <ArrowRightIcon className="size-[18px]" />
          </Button>
        </div>
      </form>
    </div>
  )
}
