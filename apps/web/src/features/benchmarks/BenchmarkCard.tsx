import { Link } from 'react-router-dom'
import type { BenchmarkSummary } from '@workshop/shared'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import {
  ChevronRightIcon,
  TrendUpIcon,
} from '../../components/ui/icons'

export function BenchmarkCard({ benchmark }: { benchmark: BenchmarkSummary }) {
  const target =
    benchmark.status === 'running'
      ? `/benchmarks/${benchmark.id}/running`
      : `/benchmarks/${benchmark.id}`

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-body">{benchmark.createdAt}</span>
        {benchmark.criticalKpiCount > 0 ? (
          <Badge tone="danger">
            <TrendUpIcon className="size-3.5" />
            {benchmark.criticalKpiCount} KPIs críticos
          </Badge>
        ) : (
          <Badge tone="success">0 críticos · saudável</Badge>
        )}
      </div>

      <h3 className="text-lg font-semibold leading-snug text-heading">
        {benchmark.headline}
      </h3>

      <p className="text-sm text-body">{benchmark.cohortLabel}</p>

      <Link
        to={target}
        className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        {benchmark.status === 'running' ? 'Acompanhar execução' : 'Ver relatório completo'}
        <ChevronRightIcon className="size-4" />
      </Link>
    </Card>
  )
}
