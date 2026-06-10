import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout.tsx';
import { Button, Card } from '../ui/primitives.tsx';
import { useBenchmarks } from '../api/hooks.ts';

export function SeusBenchmarks() {
  const navigate = useNavigate();
  const { data, isLoading } = useBenchmarks();

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Seus benchmarks</h1>
          <p className="text-sm text-muted">Compare seus indicadores de RH com empresas similares.</p>
        </div>
        <Button onClick={() => navigate('/benchmark/novo')}>Novo benchmark</Button>
      </div>

      {isLoading && <p className="text-muted">Carregando...</p>}

      <div className="grid gap-4">
        {data?.map((b) => (
          <Link key={b.id} to={`/benchmark/${b.id}`}>
            <Card className="transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-navy">{b.empresa}</h2>
                  <p className="text-sm text-muted">
                    {b.setor} · {b.criadoEm}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-brand">{b.destaque}</span>
                  <p className="text-xs text-muted">{b.status}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
