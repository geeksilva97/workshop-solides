import { QueryState } from '../../components/QueryState'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ArrowRightIcon } from '../../components/ui/icons'
import { useTrends } from '../benchmarks/queries'
import { TrendCard } from './TrendCard'

export function TrendsView({ benchmarkId }: { benchmarkId: string }) {
  const { data, isLoading, isError } = useTrends(benchmarkId)

  return (
    <QueryState isLoading={isLoading} isError={isError}>
      {data ? (
        <div className="flex flex-col gap-6">
          <p className="text-xs font-medium text-body">
            Períodos comparados: {data.periods.join(' → ')}
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {data.indicators.map((trend) => (
              <TrendCard key={trend.label} trend={trend} />
            ))}
          </div>

          <Card className="flex flex-col items-start gap-4 bg-primary-tint p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-heading">
                Precisa de um plano de ação?
              </h3>
              <p className="mt-1 text-sm text-body">
                Gere um relatório de estratégia com as recomendações priorizadas.
              </p>
            </div>
            <Button className="shrink-0">
              Baixar relatório de estratégia
              <ArrowRightIcon className="size-[18px]" />
            </Button>
          </Card>
        </div>
      ) : null}
    </QueryState>
  )
}
