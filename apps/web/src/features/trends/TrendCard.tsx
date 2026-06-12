import type { TrendIndicator } from '@workshop/shared'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import {
  MinusIcon,
  TrendDownIcon,
  TrendUpIcon,
} from '../../components/ui/icons'

const DIRECTION_ICON = {
  up: TrendUpIcon,
  down: TrendDownIcon,
  stable: MinusIcon,
}

export function TrendCard({ trend }: { trend: TrendIndicator }) {
  const isAlert = trend.severity === 'alta'
  const Icon = DIRECTION_ICON[trend.direction]

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-heading">{trend.label}</span>
        <Badge tone={isAlert ? 'danger' : 'success'}>
          {isAlert ? 'Alta severidade' : 'Saudável'}
        </Badge>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-4xl font-bold text-heading tabular-nums">
            p{trend.currentPercentile}
          </p>
          <p className="mt-1 text-sm capitalize text-body">{trend.statusText}</p>
        </div>
        <span
          className={isAlert ? 'text-danger' : 'text-success'}
          aria-label={trend.direction}
        >
          <Icon className="size-7" />
        </span>
      </div>

      <p className="border-t border-line pt-3 text-xs text-body tabular-nums">
        p{trend.priorPercentile} → p{trend.currentPercentile}
      </p>
    </Card>
  )
}
