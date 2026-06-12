import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Logo } from '../../components/ui/Logo'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { PipelineSteps } from './PipelineSteps'
import { useBenchmark, useBenchmarkStatus } from './queries'

export function RunningBenchmarkPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const benchmark = useBenchmark(id)
  const { data: status } = useBenchmarkStatus(id)

  const done = status?.done ?? false

  useEffect(() => {
    if (done) {
      const timer = setTimeout(() => navigate(`/benchmarks/${id}`, { replace: true }), 600)
      return () => clearTimeout(timer)
    }
  }, [done, id, navigate])

  const company = benchmark.data?.companyName ?? 'sua empresa'

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-8 py-6">
      <Logo />

      <Card className="w-full p-8">
        <div className="text-center">
          <h1 className="text-xl font-bold text-heading">
            Rodando o benchmark da {company}…
          </h1>
          <p className="mt-1 text-sm text-body">
            {status?.message ?? 'iniciando…'}
          </p>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <ProgressBar value={status?.percent ?? 0} />
          <span className="w-12 text-right text-sm font-semibold text-heading tabular-nums">
            {status?.percent ?? 0}%
          </span>
        </div>

        <div className="mt-6">
          {status ? <PipelineSteps steps={status.steps} /> : null}
        </div>

        <p className="mt-6 border-t border-line pt-4 text-center text-xs text-body">
          k-anonimato validado · cohort ≥ 5 empresas
        </p>
      </Card>
    </div>
  )
}
