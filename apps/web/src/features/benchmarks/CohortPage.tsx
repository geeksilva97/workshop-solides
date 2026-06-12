import { useParams } from 'react-router-dom'
import type { CohortCompany, CohortOrigin } from '@workshop/shared'
import { QueryState } from '../../components/QueryState'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { useCohort } from './queries'

const ORIGIN_TONE: Record<CohortOrigin, BadgeTone> = {
  dense: 'info',
  bm25: 'warning',
  ambos: 'primary',
}

const columns: Column<CohortCompany>[] = [
  { header: '#', cell: (c) => c.rank, className: 'text-body tabular-nums', align: 'left' },
  { header: 'Empresa (anonimizada)', cell: (c) => <span className="font-semibold">{c.anonymizedName}</span> },
  { header: 'Setor', cell: (c) => c.setor },
  { header: 'Porte', cell: (c) => c.porte },
  { header: 'UF', cell: (c) => c.uf },
  { header: 'Origem', cell: (c) => <Badge tone={ORIGIN_TONE[c.origem]}>{c.origem}</Badge> },
  {
    header: 'Similaridade',
    align: 'right',
    className: 'tabular-nums font-semibold',
    cell: (c) => c.similaridade.toFixed(2),
  },
]

export function CohortPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError } = useCohort(id)

  return (
    <QueryState isLoading={isLoading} isError={isError}>
      {data ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">setor: {data.filters.setor}</Badge>
            <Badge tone="neutral">porte: {data.filters.porte}</Badge>
            <Badge tone="neutral">região: {data.filters.regiao}</Badge>
            <Badge tone="info">
              agregado e anonimizado · k-anonimato ≥ {data.kAnonimato}
            </Badge>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <Card className="overflow-hidden">
              <DataTable
                columns={columns}
                rows={data.companies}
                getRowKey={(c) => c.anonymizedName}
              />
              <p className="border-t border-line px-4 py-3 text-xs text-body">
                {data.companies.length} de {data.size} empresas · ordenado pelo score do reranker
              </p>
            </Card>

            <Card className="flex flex-col justify-center gap-1 p-6 text-center">
              <p className="text-sm font-semibold text-heading">Score médio</p>
              <p className="text-5xl font-bold text-primary tabular-nums">
                {data.scoreMedio.toFixed(2)}
              </p>
              <p className="text-xs text-body">Fidelidade alta do cohort</p>
            </Card>
          </div>
        </div>
      ) : null}
    </QueryState>
  )
}
