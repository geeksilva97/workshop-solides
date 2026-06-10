import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout.tsx';
import { Card } from '../ui/primitives.tsx';
import { useBenchmark } from '../api/hooks.ts';

export function ListaCohort() {
  const { id = 'solipse' } = useParams();
  const { data, isLoading } = useBenchmark(id);

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Cohort comparável</h1>
          <p className="text-sm text-muted">
            Empresas mais parecidas com {data?.empresa ?? '...'}, após reranking.
          </p>
        </div>
        <Link to={`/benchmark/${id}`} className="text-sm font-medium text-brand hover:underline">
          Ver dashboard
        </Link>
      </div>

      {isLoading && <p className="text-muted">Carregando...</p>}

      {data && (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">Empresa</th>
                <th className="px-5 py-3">Setor</th>
                <th className="px-5 py-3">Região</th>
                <th className="px-5 py-3">Porte</th>
                <th className="px-5 py-3 text-right">Similaridade</th>
              </tr>
            </thead>
            <tbody>
              {data.cohort.map((c) => (
                <tr key={c.id} className="border-t border-black/5">
                  <td className="px-5 py-3 font-medium text-navy">{c.name}</td>
                  <td className="px-5 py-3 text-muted">{c.sector}</td>
                  <td className="px-5 py-3 text-muted">{c.region}</td>
                  <td className="px-5 py-3 text-muted">{c.size}</td>
                  <td className="px-5 py-3 text-right font-semibold text-brand">
                    {c.score.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </Layout>
  );
}
