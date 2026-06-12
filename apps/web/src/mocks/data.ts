import type {
  Benchmark,
  BenchmarkSummary,
  Cohort,
  CohortCompany,
  CompanyOption,
  Diagnostic,
  KpiResult,
  Trends,
} from '@workshop/shared'

export const companies: CompanyOption[] = [
  {
    id: 'solipse',
    name: 'Solípse Tecnologia',
    description: 'SaaS B2B · 240 colaboradores · SP',
  },
  {
    id: 'novamed',
    name: 'NovaMed Saúde',
    description: 'Healthtech · 180 colaboradores · MG',
  },
  {
    id: 'cargobit',
    name: 'CargoBit Logística',
    description: 'Logtech · 420 colaboradores · PR',
  },
]

const cohortCompanies: CohortCompany[] = [
  { rank: 1, anonymizedName: 'Empresa A11', setor: 'Tecnologia', porte: '250–500', uf: 'SP', origem: 'ambos', similaridade: 0.98 },
  { rank: 2, anonymizedName: 'Empresa C03', setor: 'SaaS / Fintech', porte: '100–250', uf: 'MG', origem: 'dense', similaridade: 0.96 },
  { rank: 3, anonymizedName: 'Empresa F92', setor: 'Educação Tech', porte: '100–250', uf: 'RJ', origem: 'bm25', similaridade: 0.94 },
  { rank: 4, anonymizedName: 'Empresa B27', setor: 'Tecnologia', porte: '250–500', uf: 'SP', origem: 'ambos', similaridade: 0.93 },
  { rank: 5, anonymizedName: 'Empresa D54', setor: 'SaaS B2B', porte: '100–250', uf: 'SC', origem: 'dense', similaridade: 0.91 },
  { rank: 6, anonymizedName: 'Empresa G18', setor: 'Tecnologia', porte: '100–250', uf: 'RS', origem: 'bm25', similaridade: 0.9 },
  { rank: 7, anonymizedName: 'Empresa H73', setor: 'Fintech', porte: '250–500', uf: 'SP', origem: 'ambos', similaridade: 0.89 },
  { rank: 8, anonymizedName: 'Empresa E40', setor: 'SaaS B2B', porte: '100–250', uf: 'MG', origem: 'dense', similaridade: 0.87 },
  { rank: 9, anonymizedName: 'Empresa J61', setor: 'Educação Tech', porte: '250–500', uf: 'RJ', origem: 'bm25', similaridade: 0.85 },
  { rank: 10, anonymizedName: 'Empresa K09', setor: 'Tecnologia', porte: '100–250', uf: 'PR', origem: 'ambos', similaridade: 0.84 },
  { rank: 11, anonymizedName: 'Empresa L22', setor: 'SaaS / Fintech', porte: '250–500', uf: 'SP', origem: 'dense', similaridade: 0.83 },
  { rank: 12, anonymizedName: 'Empresa M88', setor: 'Tecnologia', porte: '100–250', uf: 'SC', origem: 'bm25', similaridade: 0.82 },
  { rank: 13, anonymizedName: 'Empresa N15', setor: 'Healthtech', porte: '250–500', uf: 'MG', origem: 'ambos', similaridade: 0.81 },
  { rank: 14, anonymizedName: 'Empresa P47', setor: 'SaaS B2B', porte: '100–250', uf: 'RS', origem: 'dense', similaridade: 0.8 },
  { rank: 15, anonymizedName: 'Empresa Q92', setor: 'Tecnologia', porte: '250–500', uf: 'SP', origem: 'bm25', similaridade: 0.79 },
  { rank: 16, anonymizedName: 'Empresa R33', setor: 'Educação Tech', porte: '100–250', uf: 'RJ', origem: 'ambos', similaridade: 0.78 },
  { rank: 17, anonymizedName: 'Empresa S60', setor: 'Fintech', porte: '250–500', uf: 'SP', origem: 'dense', similaridade: 0.77 },
  { rank: 18, anonymizedName: 'Empresa T05', setor: 'SaaS B2B', porte: '100–250', uf: 'PR', origem: 'bm25', similaridade: 0.76 },
  { rank: 19, anonymizedName: 'Empresa U81', setor: 'Tecnologia', porte: '250–500', uf: 'SC', origem: 'ambos', similaridade: 0.75 },
  { rank: 20, anonymizedName: 'Empresa V19', setor: 'Healthtech', porte: '100–250', uf: 'MG', origem: 'dense', similaridade: 0.74 },
]

export const canonicalCohort: Cohort = {
  filters: { setor: 'Tecnologia', porte: '100–500', regiao: 'Sudeste' },
  size: 20,
  scoreMedio: 0.86,
  kAnonimato: 5,
  companies: cohortCompanies,
}

export const canonicalKpis: KpiResult[] = [
  { indicator: 'turnover_voluntario', label: 'Turnover voluntário', value: 28.4, median: 12, unit: '%', percentile: 95, status: 'alta' },
  { indicator: 'absenteismo', label: 'Absenteísmo', value: 5.2, median: 3, unit: '%', percentile: 92, status: 'alta' },
  { indicator: 'time_to_hire', label: 'Time-to-hire', value: 32, median: 38, unit: ' dias', percentile: 35, status: 'saudavel' },
  { indicator: 'enps', label: 'eNPS', value: -5, median: 25, unit: '', percentile: 5, status: 'alta' },
]

export const canonicalDiagnostic: Omit<Diagnostic, 'benchmarkId'> = {
  headline: 'Problema de retenção, não de atração.',
  summary:
    'A empresa contrata em ritmo saudável, mas perde gente em volume muito acima do cohort de pares. O gargalo está na permanência, não na captação de talentos.',
  indicators: [
    { label: 'Turnover voluntário', value: 28.4, median: 12, unit: '%', percentile: 95, status: 'alta' },
    { label: 'Absenteísmo', value: 5.2, median: 3, unit: '%', percentile: 92, status: 'alta' },
    { label: 'eNPS', value: -5, median: 25, unit: '', percentile: 5, status: 'critico' },
  ],
  hypotheses: [
    {
      order: 1,
      title: 'Onboarding e primeiros 6 meses',
      description:
        'Concentração de saídas no início do ciclo sugere ruído no onboarding ou descompasso entre expectativa e realidade da vaga.',
    },
    {
      order: 2,
      title: 'Carga de trabalho e clareza de carreira',
      description:
        'Absenteísmo alto somado a eNPS negativo aponta para sobrecarga e ausência de trilha de crescimento visível.',
    },
    {
      order: 3,
      title: 'Competitividade de remuneração',
      description:
        'Benchmarking salarial pode estar desalinhado com o mercado regional de tecnologia, pressionando a saída voluntária.',
    },
  ],
  nextAction: {
    title: 'Próxima ação',
    description:
      'Conduza entrevistas de desligamento qualitativas nas saídas voluntárias recentes e cruze com o pulso de engajamento por área.',
    ctaLabel: 'Agendar Reunião de Ação',
  },
  updatedAt: 'Atualizado há 2h',
}

export const canonicalTrends: Omit<Trends, 'benchmarkId'> = {
  periods: ['Dez 2025', 'Mar 2026', 'Jun 2026'],
  indicators: [
    { label: 'Turnover voluntário', currentPercentile: 95, priorPercentile: 60, severity: 'alta', statusText: 'piorando', direction: 'up' },
    { label: 'Absenteísmo', currentPercentile: 92, priorPercentile: 55, severity: 'alta', statusText: 'piorando', direction: 'up' },
    { label: 'eNPS', currentPercentile: 5, priorPercentile: 40, severity: 'alta', statusText: 'piorando', direction: 'down' },
    { label: 'Time-to-hire', currentPercentile: 35, priorPercentile: 45, severity: 'saudavel', statusText: 'estável', direction: 'stable' },
  ],
}

/** A fully-processed benchmark used as the canonical example + template for new runs. */
function buildBenchmark(
  id: string,
  companyName: string,
  createdAt: string,
): Benchmark {
  return {
    id,
    companyName,
    status: 'done',
    createdAt,
    headline: canonicalDiagnostic.headline,
    summary: canonicalDiagnostic.summary,
    cohort: canonicalCohort,
    kpis: canonicalKpis,
  }
}

/** Seed of finished benchmarks shown on "Seus benchmarks". */
export const seedBenchmarks: Benchmark[] = [
  buildBenchmark('bm-001', 'Solípse Tecnologia', 'Jun 8, 2026 • há 2 dias'),
  buildBenchmark('bm-002', 'NovaMed Saúde', 'Mai 2, 2026 • há 1 mês'),
]

// The second seed reads as a healthier company.
seedBenchmarks[1] = {
  ...seedBenchmarks[1],
  headline: 'Operação saudável, sem KPIs críticos.',
  summary:
    'Indicadores dentro ou abaixo da mediana do cohort. Nenhum alerta crítico no trimestre.',
  kpis: canonicalKpis.map((k) => ({ ...k, status: 'saudavel', percentile: 40 })),
}

export function summarize(b: Benchmark): BenchmarkSummary {
  const critical = b.kpis.filter((k) => k.status === 'alta').length
  const { setor, porte, regiao } = b.cohort.filters
  return {
    id: b.id,
    companyName: b.companyName,
    status: b.status,
    createdAt: b.createdAt,
    headline: b.headline,
    criticalKpiCount: critical,
    trendingWorse: critical > 0,
    cohortLabel: `${setor} · ${porte} · ${regiao} · ${b.cohort.size} empresas`,
  }
}

export { buildBenchmark }
