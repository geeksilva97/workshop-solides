/**
 * Synthetic HR benchmark dataset.
 *
 * No production dump exists, so the peer corpus is generated deterministically
 * from sector baselines + a seeded PRNG. Each company carries a text profile
 * (for BM25 + embeddings) and the seven tracked indicators. A small set of
 * fixed client companies are the benchmark targets the UI lets you pick.
 */
import type { Catalog, CompanyOption, Indicator } from "@workshop/shared";

export interface CompanyRecord {
  readonly id: string;
  readonly name: string;
  readonly anonymizedName: string;
  readonly setor: string;
  readonly porte: string;
  readonly uf: string;
  readonly regiao: string;
  readonly modelo: string;
  readonly description: string;
  readonly indicators: Readonly<Record<Indicator, number>>;
}

/** Default seed for the shipped corpus — fixed so the dataset is reproducible. */
export const CORPUS_SEED = 0x50_11_de_5; // "solides"
/** Default number of peer companies in the corpus. */
export const CORPUS_SIZE = 120;

// Stryker disable all: static reference data, exercised via structural tests.
const SECTORS = [
  "Tecnologia",
  "Serviços financeiros",
  "Saúde",
  "Indústria",
  "Varejo",
  "Logística",
  "Educação",
] as const;

const PORTES = ["50–100", "100–500", "500–1000"] as const;
const MODELOS = ["B2B", "B2C", "B2B2C"] as const;

const REGIONS: ReadonlyArray<{ regiao: string; ufs: readonly string[] }> = [
  { regiao: "Sudeste", ufs: ["SP", "RJ", "MG", "ES"] },
  { regiao: "Sul", ufs: ["PR", "SC", "RS"] },
  { regiao: "Nordeste", ufs: ["BA", "PE", "CE"] },
  { regiao: "Centro-Oeste", ufs: ["GO", "MT", "DF"] },
  { regiao: "Norte", ufs: ["AM", "PA"] },
];

/** Center value per indicator for each sector (the realistic "typical" peer). */
const SECTOR_BASELINES: Record<string, Record<Indicator, number>> = {
  Tecnologia: t(14, 6, 2.5, 35, 30, 8000, 28),
  "Serviços financeiros": t(12, 7, 3, 40, 25, 9000, 34),
  Saúde: t(28, 10, 5, 30, 10, 5000, 22),
  Indústria: t(18, 9, 4, 45, 15, 6000, 40),
  Varejo: t(35, 12, 4.5, 20, 5, 3000, 16),
  Logística: t(32, 11, 5.5, 25, 8, 4000, 18),
  Educação: t(10, 5, 3, 50, 28, 4500, 48),
};

function t(
  turnover_voluntario: number,
  turnover_involuntario: number,
  absenteismo: number,
  time_to_hire: number,
  enps: number,
  cost_per_hire: number,
  tenure_medio: number,
): Record<Indicator, number> {
  return {
    turnover_voluntario,
    turnover_involuntario,
    absenteismo,
    time_to_hire,
    enps,
    cost_per_hire,
    tenure_medio,
  };
}
// Stryker restore all

/** Mulberry32 — a small, fast, deterministic PRNG returning [0, 1). */
// Stryker disable all: PRNG internals; determinism is covered by tests.
const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d_2b_79_f5) | 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4_294_967_296;
  };
};
// Stryker restore all

const round1 = (value: number): number => Math.round(value * 10) / 10;

/** Apply ±25% jitter around a baseline, drawn from the PRNG. */
const jitter = (base: number, rng: () => number): number => {
  const factor = 0.75 + rng() * 0.5;
  return base * factor;
};

const buildIndicators = (
  sector: string,
  rng: () => number,
): Record<Indicator, number> => {
  const base = SECTOR_BASELINES[sector]!;
  return {
    turnover_voluntario: round1(jitter(base.turnover_voluntario, rng)),
    turnover_involuntario: round1(jitter(base.turnover_involuntario, rng)),
    absenteismo: round1(jitter(base.absenteismo, rng)),
    time_to_hire: Math.round(jitter(base.time_to_hire, rng)),
    enps: Math.round(jitter(base.enps, rng)),
    cost_per_hire: Math.round(jitter(base.cost_per_hire, rng) / 100) * 100,
    tenure_medio: Math.round(jitter(base.tenure_medio, rng)),
  };
};

const describe = (c: {
  setor: string;
  porte: string;
  uf: string;
  regiao: string;
  modelo: string;
}): string =>
  `Empresa de ${c.setor.toLowerCase()} com modelo ${c.modelo}, porte ${c.porte} ` +
  `funcionários, sediada em ${c.uf} na região ${c.regiao}.`;

/**
 * Generate a reproducible peer corpus. The same (size, seed) always produces
 * the same companies.
 */
export const generateCorpus = (
  size: number = CORPUS_SIZE,
  seed: number = CORPUS_SEED,
): CompanyRecord[] => {
  const rng = mulberry32(seed);
  const companies: CompanyRecord[] = [];

  for (let i = 0; i < size; i++) {
    const setor = SECTORS[i % SECTORS.length]!;
    const porte = PORTES[i % PORTES.length]!;
    const modelo = MODELOS[i % MODELOS.length]!;
    const region = REGIONS[i % REGIONS.length]!;
    const uf = region.ufs[i % region.ufs.length]!;
    const anonymizedName = `Empresa ${String(i + 1).padStart(3, "0")}`;

    companies.push({
      id: `peer-${String(i + 1).padStart(3, "0")}`,
      name: `${setor} ${uf} ${i + 1}`,
      anonymizedName,
      setor,
      porte,
      uf,
      regiao: region.regiao,
      modelo,
      description: describe({ setor, porte, uf, regiao: region.regiao, modelo }),
      indicators: buildIndicators(setor, rng),
    });
  }

  return companies;
};

// Stryker disable all: hand-authored client fixtures (content, not logic).
/** Fixed client companies the UI offers as benchmark targets. */
export const CLIENT_COMPANIES: readonly CompanyRecord[] = [
  {
    id: "client-solipse",
    name: "Solípse Tecnologia",
    anonymizedName: "Cliente Solípse",
    setor: "Tecnologia",
    porte: "100–500",
    uf: "SP",
    regiao: "Sudeste",
    modelo: "B2B",
    description:
      "Empresa de tecnologia com modelo B2B, porte 100–500 funcionários, sediada em SP na região Sudeste.",
    indicators: t(28.4, 8.1, 5.2, 32, -5, 9500, 18),
  },
  {
    id: "client-norvik",
    name: "Norvik Saúde",
    anonymizedName: "Cliente Norvik",
    setor: "Saúde",
    porte: "500–1000",
    uf: "MG",
    regiao: "Sudeste",
    modelo: "B2C",
    description:
      "Empresa de saúde com modelo B2C, porte 500–1000 funcionários, sediada em MG na região Sudeste.",
    indicators: t(31.0, 12.0, 6.1, 28, 6, 5200, 20),
  },
  {
    id: "client-atlas",
    name: "Atlas Indústria",
    anonymizedName: "Cliente Atlas",
    setor: "Indústria",
    porte: "500–1000",
    uf: "PR",
    regiao: "Sul",
    modelo: "B2B",
    description:
      "Empresa de indústria com modelo B2B, porte 500–1000 funcionários, sediada em PR na região Sul.",
    indicators: t(16.5, 8.0, 3.6, 47, 18, 5800, 42),
  },
];
// Stryker restore all

/** The shipped peer corpus (default size + seed). */
export const CORPUS: readonly CompanyRecord[] = generateCorpus();

/** Look up a client company by id. */
export const findClientCompany = (id: string): CompanyRecord | undefined =>
  CLIENT_COMPANIES.find((c) => c.id === id);

/** The client companies as the `CompanyOption` contract the UI consumes. */
export const companyOptions = (): CompanyOption[] =>
  CLIENT_COMPANIES.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
  }));

const sortedUnique = (values: readonly string[]): string[] =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b, "pt-BR"));

/**
 * Distinct cohort-filter options drawn from a corpus. Using the corpus values
 * (rather than hand-written labels) guarantees the pipeline's sector filter
 * always matches what the form offers.
 */
export const catalogFromCorpus = (
  corpus: readonly CompanyRecord[] = CORPUS,
): Catalog => ({
  setores: sortedUnique(corpus.map((c) => c.setor)),
  portes: sortedUnique(corpus.map((c) => c.porte)),
  regioes: sortedUnique(corpus.map((c) => c.regiao)),
});
