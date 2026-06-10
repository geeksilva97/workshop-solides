export type Severity = 'alta' | 'media' | 'baixa';

export type KpiKey = 'turnover_voluntario' | 'absenteismo' | 'time_to_hire' | 'enps';

export type KpiPosition = {
  kpi: KpiKey;
  label: string;
  valor: number;
  unidade: string;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  posicao: string; // e.g. "p95"
  sinal: 'ok' | 'warn' | 'bad';
};

export type CohortCompany = {
  id: string;
  name: string;
  sector: string;
  region: string;
  size: string;
  score: number; // rerank score
};

export type Diagnostico = {
  diagnostico_principal: string;
  indicadores_criticos: { kpi: KpiKey; leitura: string; severidade: Severity }[];
  hipoteses: string[];
  proxima_acao: string;
};

export type BenchmarkSummary = {
  id: string;
  empresa: string;
  setor: string;
  criadoEm: string;
  status: 'pronto' | 'rodando';
  destaque: string;
};

export type BenchmarkDetail = {
  id: string;
  empresa: string;
  setor: string;
  porte: string;
  regiao: string;
  cohort: CohortCompany[];
  kpis: KpiPosition[];
  diagnostico: Diagnostico;
};
