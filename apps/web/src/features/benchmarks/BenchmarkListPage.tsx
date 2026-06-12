import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { QueryState } from '../../components/QueryState'
import { buttonClasses } from '../../components/ui/buttonClasses'
import { ArrowRightIcon } from '../../components/ui/icons'
import { BenchmarkCard } from './BenchmarkCard'
import { useBenchmarks } from './queries'

export function BenchmarkListPage() {
  const { data, isLoading, isError } = useBenchmarks()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Seus benchmarks"
        subtitle="Cada benchmark compara seus indicadores com um cohort de empresas pares, anonimizado."
        actions={
          <Link to="/benchmarks/new" className={buttonClasses()}>
            Novo benchmark
            <ArrowRightIcon className="size-[18px]" />
          </Link>
        }
      />

      <QueryState isLoading={isLoading} isError={isError}>
        {data && data.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((benchmark) => (
              <BenchmarkCard key={benchmark.id} benchmark={benchmark} />
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-line bg-card p-10 text-center">
            <p className="text-sm text-body">
              Você ainda não rodou nenhum benchmark.
            </p>
            <Link to="/benchmarks/new" className={buttonClasses({ className: 'mt-4' })}>
              Iniciar nova análise
            </Link>
          </div>
        )}
      </QueryState>
    </div>
  )
}
