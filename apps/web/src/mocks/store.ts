import {
  PIPELINE_STAGE_LABELS,
  pipelineStageEnum,
  type Benchmark,
  type NewBenchmarkInput,
  type PipelineStatus,
  type PipelineStep,
} from '@workshop/shared'
import {
  buildBenchmark,
  canonicalCohort,
  canonicalKpis,
  companies,
  seedBenchmarks,
} from './data'

const STAGES = pipelineStageEnum.options

/** Percent at which each stage becomes active. */
const STAGE_START: Record<(typeof STAGES)[number], number> = {
  ingestao: 0,
  dense_retrieval: 12,
  bm25: 26,
  rrf: 40,
  reranker: 54,
  percentis: 80,
  diagnostico: 92,
}

const STAGE_DETAIL: Record<(typeof STAGES)[number], string> = {
  ingestao: 'perfil + KPIs · embedding gerado',
  dense_retrieval: 'top-50 por similaridade no pgvector',
  bm25: 'top-50 por match lexical (setor, região, porte)',
  rrf: 'fusão dos dois rankings · top-30',
  reranker: 'cross-encoder pontuando 30 pares',
  percentis: 'percentis por KPI no recorte',
  diagnostico: 'convertendo métricas em narrativa acionável',
}

interface RunState {
  benchmark: Benchmark
  polls: number
}

const benchmarks = new Map<string, Benchmark>()
const runs = new Map<string, RunState>()
let nextId = 100

/** (Re)seed the store — also used to reset state between tests. */
export function resetStore(): void {
  benchmarks.clear()
  runs.clear()
  nextId = 100
  for (const b of seedBenchmarks) benchmarks.set(b.id, { ...b })
}

resetStore()

export function listBenchmarks(): Benchmark[] {
  return [...benchmarks.values()]
}

export function getBenchmark(id: string): Benchmark | undefined {
  return benchmarks.get(id)
}

export function createBenchmark(input: NewBenchmarkInput): Benchmark {
  const id = `bm-${nextId++}`
  const company = companies.find((c) => c.id === input.companyId)
  const companyName = company?.name ?? 'Empresa cliente'

  // Start from the canonical template, override company + chosen cohort filters.
  const done = buildBenchmark(id, companyName, 'agora mesmo')
  const benchmark: Benchmark = {
    ...done,
    status: 'running',
    cohort: { ...canonicalCohort, filters: input.filters },
    kpis: canonicalKpis,
  }
  benchmarks.set(id, benchmark)
  runs.set(id, { benchmark, polls: 0 })
  return benchmark
}

function buildSteps(percent: number): PipelineStep[] {
  return STAGES.map((stage, i) => {
    const start = STAGE_START[stage]
    const nextStart = i + 1 < STAGES.length ? STAGE_START[STAGES[i + 1]] : 100
    let status: PipelineStep['status'] = 'pending'
    if (percent >= 100 || percent >= nextStart) status = 'done'
    else if (percent >= start) status = 'active'
    return {
      stage,
      label: PIPELINE_STAGE_LABELS[stage],
      status,
      detail: STAGE_DETAIL[stage],
    }
  })
}

function activeMessage(percent: number, steps: PipelineStep[]): string {
  if (percent >= 100) return 'Diagnóstico pronto'
  const active = steps.find((s) => s.status === 'active')
  if (active?.stage === 'reranker') {
    const pairs = Math.min(30, Math.round(((percent - 54) / (80 - 54)) * 30))
    return `reranqueando candidatos… ${pairs}/30`
  }
  return active ? active.detail : 'iniciando…'
}

/** Advance and return the pipeline status for a running benchmark. */
export function advanceStatus(id: string): PipelineStatus | undefined {
  const run = runs.get(id)
  if (!run) return undefined

  run.polls += 1
  const percent = Math.min(100, run.polls * 14)
  const steps = buildSteps(percent)
  const done = percent >= 100

  if (done) {
    run.benchmark.status = 'done'
    benchmarks.set(id, { ...run.benchmark, status: 'done' })
  }

  return {
    benchmarkId: id,
    percent,
    message: activeMessage(percent, steps),
    done,
    steps,
  }
}
