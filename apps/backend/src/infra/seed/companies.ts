import type { Company } from '../../domain/company.ts';
import { makeKpis } from '../../domain/kpis.ts';

/**
 * Synthetic comparison pool + the client company (Solípse). In production this
 * comes from the Postgres pool seeded in Flow 0; here it is in-memory so the
 * reference run needs no database. Solípse has intentionally bad turnover and
 * eNPS so the percentile + judge steps have something to say.
 */

function company(c: Omit<Company, 'kpis'> & { kpis: Company['kpis'] }): Company {
  return { ...c, kpis: makeKpis(c.kpis) };
}

/** The client company being benchmarked. */
export const SOLIPSE: Company = company({
  id: '00000000000191',
  name: 'Solípse Tecnologia',
  sector: 'tecnologia',
  region: 'MG',
  size: 'media',
  description:
    'Empresa de tecnologia B2B SaaS de médio porte em Belo Horizonte. Plataforma de gestão para PMEs, time de produto e engenharia enxuto.',
  tags: ['tecnologia', 'saas', 'b2b', 'produto', 'media', 'sudeste'],
  kpis: { turnover_voluntario: 28.4, absenteismo: 5.2, time_to_hire: 32, enps: -5 },
});

/** The comparison pool. Tech/SaaS cluster (natural cohort) + off-domain noise. */
export const POOL: Company[] = [
  company({
    id: '11111111000111',
    name: 'Nuvexa Cloud',
    sector: 'tecnologia',
    region: 'SP',
    size: 'media',
    description: 'SaaS B2B de infraestrutura cloud para PMEs, time de engenharia e produto.',
    tags: ['tecnologia', 'saas', 'b2b', 'produto', 'media', 'sudeste'],
    kpis: { turnover_voluntario: 11.2, absenteismo: 2.8, time_to_hire: 41, enps: 28 },
  }),
  company({
    id: '22222222000122',
    name: 'Fluxo Pagamentos',
    sector: 'tecnologia',
    region: 'SP',
    size: 'media',
    description: 'Fintech B2B SaaS de pagamentos, plataforma para PMEs e engenharia de produto.',
    tags: ['tecnologia', 'saas', 'b2b', 'fintech', 'media', 'sudeste'],
    kpis: { turnover_voluntario: 13.5, absenteismo: 3.1, time_to_hire: 38, enps: 22 },
  }),
  company({
    id: '33333333000133',
    name: 'Cortex Dados',
    sector: 'tecnologia',
    region: 'MG',
    size: 'media',
    description: 'Plataforma SaaS B2B de analytics e dados para empresas de médio porte.',
    tags: ['tecnologia', 'saas', 'b2b', 'dados', 'media', 'sudeste'],
    kpis: { turnover_voluntario: 12.0, absenteismo: 3.0, time_to_hire: 45, enps: 31 },
  }),
  company({
    id: '44444444000144',
    name: 'Verde Logtech',
    sector: 'tecnologia',
    region: 'PR',
    size: 'media',
    description: 'SaaS B2B de logística para PMEs, roteirização e produto.',
    tags: ['tecnologia', 'saas', 'b2b', 'logistica', 'media', 'sul'],
    kpis: { turnover_voluntario: 9.8, absenteismo: 2.5, time_to_hire: 52, enps: 35 },
  }),
  company({
    id: '55555555000155',
    name: 'Atlas HRTech',
    sector: 'tecnologia',
    region: 'RJ',
    size: 'media',
    description: 'SaaS B2B de people analytics e gestão de RH para PMEs.',
    tags: ['tecnologia', 'saas', 'b2b', 'rh', 'media', 'sudeste'],
    kpis: { turnover_voluntario: 14.1, absenteismo: 3.4, time_to_hire: 36, enps: 19 },
  }),
  company({
    id: '66666666000166',
    name: 'Pixel Commerce',
    sector: 'tecnologia',
    region: 'SP',
    size: 'pequena',
    description: 'SaaS B2B de e-commerce e marketplace para pequenas empresas.',
    tags: ['tecnologia', 'saas', 'b2b', 'ecommerce', 'pequena', 'sudeste'],
    kpis: { turnover_voluntario: 16.7, absenteismo: 3.6, time_to_hire: 29, enps: 14 },
  }),
  company({
    id: '77777777000177',
    name: 'Lumen Edtech',
    sector: 'tecnologia',
    region: 'MG',
    size: 'media',
    description: 'Plataforma SaaS B2B de educação corporativa, produto e engenharia.',
    tags: ['tecnologia', 'saas', 'b2b', 'edtech', 'media', 'sudeste'],
    kpis: { turnover_voluntario: 10.5, absenteismo: 2.9, time_to_hire: 47, enps: 27 },
  }),
  company({
    id: '88888888000188',
    name: 'Órbita Devtools',
    sector: 'tecnologia',
    region: 'RS',
    size: 'media',
    description: 'SaaS B2B de ferramentas de desenvolvimento para times de engenharia.',
    tags: ['tecnologia', 'saas', 'b2b', 'devtools', 'media', 'sul'],
    kpis: { turnover_voluntario: 12.9, absenteismo: 3.2, time_to_hire: 44, enps: 24 },
  }),
  // Off-domain noise: dense should rank these lower than the SaaS cluster.
  company({
    id: '99999999000199',
    name: 'Boa Safra Alimentos',
    sector: 'industria',
    region: 'GO',
    size: 'grande',
    description: 'Indústria de alimentos de grande porte, produção e distribuição.',
    tags: ['industria', 'alimentos', 'producao', 'grande', 'centro-oeste'],
    kpis: { turnover_voluntario: 7.4, absenteismo: 4.1, time_to_hire: 60, enps: 12 },
  }),
  company({
    id: '10101010000110',
    name: 'Rede Varejomais',
    sector: 'varejo',
    region: 'BA',
    size: 'grande',
    description: 'Rede varejista de grande porte com lojas físicas e centros de distribuição.',
    tags: ['varejo', 'lojas', 'distribuicao', 'grande', 'nordeste'],
    kpis: { turnover_voluntario: 22.3, absenteismo: 6.0, time_to_hire: 25, enps: 5 },
  }),
  company({
    id: '12121212000112',
    name: 'TransLog Cargas',
    sector: 'logistica',
    region: 'SP',
    size: 'grande',
    description: 'Transportadora e operadora logística de grande porte.',
    tags: ['logistica', 'transporte', 'frota', 'grande', 'sudeste'],
    kpis: { turnover_voluntario: 19.8, absenteismo: 5.5, time_to_hire: 30, enps: 8 },
  }),
  company({
    id: '13131313000113',
    name: 'Saúde Plena Clínicas',
    sector: 'saude',
    region: 'PE',
    size: 'media',
    description: 'Rede de clínicas de saúde de médio porte, atendimento e diagnóstico.',
    tags: ['saude', 'clinicas', 'atendimento', 'media', 'nordeste'],
    kpis: { turnover_voluntario: 15.0, absenteismo: 4.8, time_to_hire: 42, enps: 16 },
  }),
];

export const ALL_COMPANIES: Company[] = [SOLIPSE, ...POOL];
