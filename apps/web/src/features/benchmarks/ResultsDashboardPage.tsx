import { useParams } from 'react-router-dom'
import { QueryState } from '../../components/QueryState'
import { Card } from '../../components/ui/Card'
import { KpiCard } from './KpiCard'
import { useBenchmark } from './queries'

export function ResultsDashboardPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError } = useBenchmark(id)

  return (
    <QueryState isLoading={isLoading} isError={isError}>
      {data ? (
        <div className="flex flex-col gap-6">
          <Card className="border-l-4 border-l-primary p-6">
            <h2 className="text-lg font-semibold text-heading">{data.headline}</h2>
            <p className="mt-2 text-sm leading-relaxed text-body">{data.summary}</p>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {data.kpis.map((kpi) => (
              <KpiCard key={kpi.indicator} kpi={kpi} />
            ))}
          </div>
        </div>
      ) : null}
    </QueryState>
  )
}
