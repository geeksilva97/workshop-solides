import type { BenchmarkDetail, BenchmarkSummary } from './types.ts';

/**
 * Stubbed API client for the screens step. Returns mock data shaped like the
 * eventual Fastify endpoints, so the UI is fully navigable before the backend
 * pipeline is wired. Swap the bodies for `fetch('/api/...')` once the API lands.
 *
 * Numbers mirror the Solípse case from the workshop docs.
 */

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const SOLIPSE_DETAIL: BenchmarkDetail = {
  id: 'solipse',
  empresa: 'Solípse Tecnologia',
  setor: 'Tecnologia (B2B SaaS)',
  porte: 'Média',
  regiao: 'MG',
  cohort: [
    { id: '33333333000133', name: 'Cortex Dados', sector: 'Tecnologia', region: 'MG', size: 'Média', score: 0.94 },
    { id: '11111111000111', name: 'Nuvexa Cloud', sector: 'Tecnologia', region: 'SP', size: 'Média', score: 0.92 },
    { id: '77777777000177', name: 'Lumen Edtech', sector: 'Tecnologia', region: 'MG', size: 'Média', score: 0.9 },
    { id: '22222222000122', name: 'Fluxo Pagamentos', sector: 'Tecnologia', region: 'SP', size: 'Média', score: 0.88 },
    { id: '88888888000188', name: 'Órbita Devtools', sector: 'Tecnologia', region: 'RS', size: 'Média', score: 0.86 },
    { id: '55555555000155', name: 'Atlas HRTech', sector: 'Tecnologia', region: 'RJ', size: 'Média', score: 0.84 },
    { id: '44444444000144', name: 'Verde Logtech', sector: 'Tecnologia', region: 'PR', size: 'Média', score: 0.81 },
  ],
  kpis: [
    { kpi: 'turnover_voluntario', label: 'Turnover voluntário', valor: 28.4, unidade: '%', p25: 9, p50: 12, p75: 15, p90: 18, posicao: 'p95', sinal: 'bad' },
    { kpi: 'absenteismo', label: 'Absenteísmo', valor: 5.2, unidade: '%', p25: 2.1, p50: 3.0, p75: 3.8, p90: 4.6, posicao: 'p92', sinal: 'bad' },
    { kpi: 'time_to_hire', label: 'Time to hire', valor: 32, unidade: 'dias', p25: 28, p50: 38, p75: 48, p90: 56, posicao: 'p35', sinal: 'ok' },
    { kpi: 'enps', label: 'eNPS', valor: -5, unidade: '', p25: 12, p50: 25, p75: 35, p90: 45, posicao: 'p5', sinal: 'bad' },
  ],
  diagnostico: {
    diagnostico_principal:
      'Problema de retenção, não de atração - a empresa contrata em ritmo saudável mas perde gente em volume muito acima do cohort.',
    indicadores_criticos: [
      { kpi: 'turnover_voluntario', leitura: 'No p95 do cohort (28.4% vs mediana 12%). Quase 2.5x acima do que se vê em tech de mesmo porte.', severidade: 'alta' },
      { kpi: 'absenteismo', leitura: 'No p92 (5.2% vs mediana 3.0%). Funciona como leading indicator do turnover.', severidade: 'alta' },
      { kpi: 'enps', leitura: 'No p5 (-5 vs mediana +25). Colaboradores ativos não recomendariam a empresa.', severidade: 'alta' },
    ],
    hipoteses: [
      'Onboarding ou primeiros 6 meses (cruzar com tempo médio até desligamento)',
      'Carga de trabalho ou clareza de carreira',
      'Compensação vs mercado tech regional',
    ],
    proxima_acao:
      'Rodar pesquisa de saída qualitativa nos últimos 30 desligamentos voluntários e cruzar com pulse de engajamento por área.',
  },
};

const BENCHMARKS: BenchmarkSummary[] = [
  {
    id: 'solipse',
    empresa: 'Solípse Tecnologia',
    setor: 'Tecnologia (B2B SaaS)',
    criadoEm: '2026-06-09',
    status: 'pronto',
    destaque: 'Turnover no p95 do cohort',
  },
];

export const api = {
  async login(email: string, password: string): Promise<{ token: string; empresa: string }> {
    await wait(300);
    if (!email || !password) throw new Error('Informe e-mail e senha');
    return { token: 'demo-session', empresa: 'Solípse Tecnologia' };
  },

  async listBenchmarks(): Promise<BenchmarkSummary[]> {
    await wait(200);
    return BENCHMARKS;
  },

  async getBenchmark(id: string): Promise<BenchmarkDetail> {
    await wait(200);
    if (id !== SOLIPSE_DETAIL.id) throw new Error('Benchmark não encontrado');
    return SOLIPSE_DETAIL;
  },

  async createBenchmark(): Promise<{ id: string }> {
    await wait(400);
    return { id: 'solipse' };
  },
};
