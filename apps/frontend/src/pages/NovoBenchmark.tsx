import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout.tsx';
import { Button, Card } from '../ui/primitives.tsx';
import { useCreateBenchmark } from '../api/hooks.ts';

const PERFIL = [
  ['Empresa', 'Solípse Tecnologia'],
  ['Setor', 'Tecnologia (B2B SaaS)'],
  ['Porte', 'Média (120 colaboradores)'],
  ['Região', 'MG'],
];

export function NovoBenchmark() {
  const navigate = useNavigate();
  const create = useCreateBenchmark();

  function run() {
    create.mutate(undefined, {
      onSuccess: ({ id }) => navigate(`/benchmark/${id}/run`),
    });
  }

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-navy">Novo benchmark</h1>
      <p className="mb-6 text-sm text-muted">
        Confirme o perfil da empresa. O Tom Ranks busca um cohort comparável e analisa cada KPI.
      </p>

      <Card className="max-w-xl">
        <dl className="grid grid-cols-2 gap-4">
          {PERFIL.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs uppercase tracking-wide text-muted">{k}</dt>
              <dd className="font-medium text-navy">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex justify-end">
          <Button onClick={run} disabled={create.isPending}>
            {create.isPending ? 'Iniciando...' : 'Rodar benchmark'}
          </Button>
        </div>
      </Card>
    </Layout>
  );
}
