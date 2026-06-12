import { useParams } from 'react-router-dom'
import { QueryState } from '../../components/QueryState'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ArrowRightIcon, SparklesIcon } from '../../components/ui/icons'
import { useDiagnostic } from './queries'

export function DiagnosisPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError } = useDiagnostic(id)

  return (
    <QueryState isLoading={isLoading} isError={isError}>
      {data ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge tone="primary">
              <SparklesIcon className="size-3.5" />
              LLM-as-judge
            </Badge>
            <span className="text-xs text-body">{data.updatedAt}</span>
          </div>

          <Card className="border-l-4 border-l-primary p-6">
            <h2 className="text-xl font-bold text-heading">{data.headline}</h2>
            <p className="mt-2 text-sm leading-relaxed text-body">{data.summary}</p>
          </Card>

          <div className="grid gap-5 sm:grid-cols-3">
            {data.indicators.map((indicator) => (
              <Card key={indicator.label} className="flex flex-col gap-2 p-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-heading">
                    {indicator.label}
                  </span>
                  <Badge tone={indicator.status === 'saudavel' ? 'success' : 'danger'}>
                    p{indicator.percentile}
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-heading tabular-nums">
                  {indicator.value}
                  {indicator.unit}
                </p>
                <p className="text-sm text-body">
                  vs mediana {indicator.median}
                  {indicator.unit}
                </p>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <h3 className="text-base font-semibold text-heading">
              Hipóteses de investigação
            </h3>
            <ol className="mt-4 flex flex-col gap-5">
              {data.hypotheses.map((h) => (
                <li key={h.order} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-bold text-primary">
                    {h.order}
                  </span>
                  <div>
                    <p className="font-semibold text-heading">{h.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-body">
                      {h.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="flex flex-col items-start gap-4 bg-primary-tint p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-heading">
                {data.nextAction.title}
              </h3>
              <p className="mt-1 max-w-xl text-sm text-body">
                {data.nextAction.description}
              </p>
            </div>
            <Button className="shrink-0">
              {data.nextAction.ctaLabel}
              <ArrowRightIcon className="size-[18px]" />
            </Button>
          </Card>
        </div>
      ) : null}
    </QueryState>
  )
}
