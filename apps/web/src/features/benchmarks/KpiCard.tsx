import type { KpiResult } from '@workshop/shared'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { PercentileBar } from '../../components/ui/PercentileBar'

export function KpiCard({ kpi }: { kpi: KpiResult }) {
  const isAlert = kpi.status === 'alta'
  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-heading">{kpi.label}</span>
        <Badge tone={isAlert ? 'danger' : 'success'}>
          p{kpi.percentile} {isAlert ? 'alta' : 'saudável'}
        </Badge>
      </div>

      <div>
        <p className="text-4xl font-bold text-heading tabular-nums">
          {kpi.value}
          {kpi.unit}
        </p>
        <p className="mt-1 text-sm text-body">
          vs mediana {kpi.median}
          {kpi.unit}
        </p>
      </div>

      <PercentileBar percentile={kpi.percentile} status={kpi.status} />
    </Card>
  )
}
