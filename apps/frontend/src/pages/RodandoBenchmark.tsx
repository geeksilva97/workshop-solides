import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout.tsx';
import { Button, Card } from '../ui/primitives.tsx';

const STAGES = [
  ['Dense retrieval', 'busca por significado no pgvector'],
  ['BM25', 'busca lexical sobre as descrições'],
  ['RRF', 'funde os dois rankings pela posição'],
  ['Reranker', 'cross-encoder reordena os finalistas'],
  ['Percentis + k-anonimato', 'posiciona cada KPI no cohort'],
  ['LLM-as-judge', 'números viram diagnóstico'],
];

export function RodandoBenchmark() {
  const { id = 'solipse' } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STAGES.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 700);
    return () => clearTimeout(t);
  }, [step]);

  const done = step >= STAGES.length;

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-navy">Rodando o benchmark</h1>
      <p className="mb-6 text-sm text-muted">Pipeline de busca híbrida e análise em execução.</p>

      <Card className="max-w-2xl">
        <ol className="flex flex-col gap-3">
          {STAGES.map(([name, desc], i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'idle';
            return (
              <li key={name} className="flex items-center gap-3">
                <span
                  className={
                    'grid size-6 place-items-center rounded-full text-xs font-bold ' +
                    (state === 'done'
                      ? 'bg-ok text-white'
                      : state === 'active'
                        ? 'bg-brand text-white'
                        : 'bg-black/5 text-muted')
                  }
                >
                  {state === 'done' ? '✓' : i + 1}
                </span>
                <span className="font-medium text-navy">{name}</span>
                <span className="text-sm text-muted">{desc}</span>
              </li>
            );
          })}
        </ol>

        {done && (
          <div className="mt-6 flex justify-end">
            <Button onClick={() => navigate(`/benchmark/${id}`)}>Ver resultado</Button>
          </div>
        )}
      </Card>
    </Layout>
  );
}
