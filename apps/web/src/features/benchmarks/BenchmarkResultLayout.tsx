import { NavLink, Outlet, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { QueryState } from '../../components/QueryState'
import { cn } from '../../lib/cn'
import { useBenchmark } from './queries'

function tabClass({ isActive }: { isActive: boolean }) {
  return cn(
    'border-b-2 px-1 pb-3 text-sm font-semibold transition-colors',
    isActive
      ? 'border-primary text-primary'
      : 'border-transparent text-body hover:text-heading',
  )
}

export function BenchmarkResultLayout() {
  const { id = '' } = useParams()
  const { data, isLoading, isError } = useBenchmark(id)

  return (
    <QueryState isLoading={isLoading} isError={isError}>
      {data ? (
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Dashboard de resultados"
            subtitle={`${data.companyName} · ${data.cohort.filters.setor} · ${data.cohort.filters.porte} · ${data.cohort.filters.regiao} · ${data.cohort.size} empresas comparáveis`}
          />

          <nav className="flex gap-6 border-b border-line">
            <NavLink to={`/benchmarks/${id}`} end className={tabClass}>
              Resultados
            </NavLink>
            <NavLink to={`/benchmarks/${id}/cohort`} className={tabClass}>
              Cohort
            </NavLink>
            <NavLink to={`/benchmarks/${id}/diagnosis`} className={tabClass}>
              Diagnóstico
            </NavLink>
          </nav>

          <Outlet />
        </div>
      ) : null}
    </QueryState>
  )
}
