import { PageHeader } from '../../components/PageHeader'
import { QueryState } from '../../components/QueryState'
import { useBenchmarks } from '../benchmarks/queries'
import { TrendsView } from './TrendsView'

export function TrendsPage() {
  const { data, isLoading, isError } = useBenchmarks()
  const latest = data?.find((b) => b.status === 'done')

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Tendências"
        subtitle="Como seus indicadores se moveram dentro do cohort ao longo dos últimos períodos de benchmark."
      />

      <QueryState isLoading={isLoading} isError={isError}>
        {latest ? (
          <TrendsView benchmarkId={latest.id} />
        ) : (
          <p className="text-sm text-body">
            Rode um benchmark para acompanhar tendências.
          </p>
        )}
      </QueryState>
    </div>
  )
}
