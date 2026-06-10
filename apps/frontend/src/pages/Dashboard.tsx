import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout.tsx';
import { Badge, Card } from '../ui/primitives.tsx';
import { useBenchmark } from '../api/hooks.ts';
import type { KpiPosition } from '../api/types.ts';

function KpiCard({ k }: { k: KpiPosition }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <h3 className="font-medium text-navy">{k.label}</h3>
        <Badge tone={k.sinal}>{k.posicao}</Badge>
      </div>
      <p className="mt-2 text-3xl font-semibold text-navy">
        {k.valor}
        <span className="ml-1 text-base text-muted">{k.unidade}</span>
      </p>
      <p className="mt-1 text-sm text-muted">
        Cohort: p25 {k.p25} · p50 {k.p50} · p75 {k.p75} · p90 {k.p90}
      </p>
    </Card>
  );
}

export function Dashboard() {
  const { id = 'solipse' } = useParams();
  const { data, isLoading } = useBenchmark(id);

  if (isLoading || !data) {
    return (
      <Layout>
        <p className="text-muted">Carregando diagnóstico...</p>
      </Layout>
    );
  }

  const d = data.diagnostico;

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">{data.empresa}</h1>
          <p className="text-sm text-muted">
            {data.setor} · {data.porte} · {data.regiao}
          </p>
        </div>
        <Link
          to={`/benchmark/${id}/cohort`}
          className="text-sm font-medium text-brand hover:underline"
        >
          Ver cohort ({data.cohort.length})
        </Link>
      </div>

      {/* Verdict-first: the diagnosis leads */}
      <Card className="mb-6 border-l-4 border-l-brand">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand">Diagnóstico</span>
        <p className="mt-2 text-lg font-medium text-navy">{d.diagnostico_principal}</p>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.kpis.map((k) => (
          <KpiCard key={k.kpi} k={k} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-semibold text-navy">Indicadores críticos</h3>
          <ul className="flex flex-col gap-3">
            {d.indicadores_criticos.map((ic) => (
              <li key={ic.kpi} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-navy">{ic.kpi}</span>
                  <Badge tone={ic.severidade}>{ic.severidade}</Badge>
                </div>
                <p className="text-sm text-muted">{ic.leitura}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold text-navy">Hipóteses & próxima ação</h3>
          <ul className="mb-4 list-disc pl-5 text-sm text-muted">
            {d.hipoteses.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <div className="rounded-xl bg-brand/5 p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand">
              Próxima ação
            </span>
            <p className="mt-1 text-sm text-navy">{d.proxima_acao}</p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
