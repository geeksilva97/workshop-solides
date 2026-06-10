# Run log - 06-llm-as-judge

- **Branch:** `run/06-llm-as-judge`
- **Base branch:** `run/05-percentis-k-anonimato`
- **Spec:** [`docs/steps/05-llm-as-judge.md`](../docs/steps/05-llm-as-judge.md)
- **Started:** 2026-06-10T19:24:53Z

> Automated reference run, executed interactively. Captures the intent, the
> decisions, the files touched, and the verification output for this step.

## Intenção (o "prompt" da etapa)

> Transformar os percentis num diagnóstico acionável via LLM-as-judge com structured output
> (tool use forçado), e re-validar o retorno contra o contrato de domínio. Anti-alucinação no
> system prompt.

## Decisões

- **Consultei a skill `claude-api`** antes de escrever o adapter Anthropic (guidance do repo:
  ler a referência antes de codar contra o SDK). Dali tirei: `tool_choice: {type:'tool', name}`
  pra forçar o schema, model id `claude-opus-4-8`, e a shape do `messages.create` + `tools` no
  `@anthropic-ai/sdk`.
- **Schema é contrato de domínio:** `DIAGNOSTICO_TOOL_SCHEMA` + `validateDiagnostico` vivem em
  `domain/diagnostico.ts`. Tool use força a forma; o use case `gerarDiagnostico` **re-valida** a
  sanidade (enums, campos não-vazios). "Controle, não fé."
- **Dois adapters atrás do port `Judge`:** `AnthropicJudge` (produção, tool use forçado, system
  prompt "use só os números do JSON, não invente") e `LocalJudge` (determinístico, sem API key,
  usado nos testes do reference run). Trocar um pelo outro não toca `application`.
- Testes do `AnthropicJudge` usam um client **mockado** - sem rede, sem key.

## Arquivos

- `domain/diagnostico.ts` (tipo, schema, `validateDiagnostico`)
- `application/ports.ts` (+ `Judge`, `DiagnosisInput`), `application/gerar-diagnostico.ts`
- `infra/judge/anthropic-judge.ts` (SDK + tool_choice), `infra/judge/local-judge.ts`
- `apps/backend/package.json` (+ `@anthropic-ai/sdk`)
- Testes: `application/gerar-diagnostico.test.ts`, `infra/judge/anthropic-judge.test.ts`

## Interações & notas

- `AnthropicJudge forces the tool` confirma `tool_choice: {type:'tool', name:'emitir_diagnostico'}`.
- `gerarDiagnostico rejects an off-schema payload` confirma a re-validação no use case.
- 20 testes verdes no backend (eram 16; +4 do judge).

## Verificação (2026-06-10T19:29:08Z)

```
$ pnpm typecheck
$ turbo run typecheck
• turbo 2.9.17

   • Packages in scope: @repo/tsconfig, @workshop/backend, @workshop/frontend
   • Running typecheck in 3 packages
   • Remote caching disabled

@workshop/backend:typecheck: cache miss, executing 0e9f0a7176ef6880
@workshop/frontend:typecheck: cache hit, replaying logs 80896e657f4ffacf
@workshop/frontend:typecheck: $ tsc --noEmit
@workshop/backend:typecheck: $ tsc --noEmit

 Tasks:    2 successful, 2 total
Cached:    1 cached, 2 total
  Time:    722ms 

$ pnpm test
$ turbo run test
• turbo 2.9.17

   • Packages in scope: @repo/tsconfig, @workshop/backend, @workshop/frontend
   • Running test in 3 packages
   • Remote caching disabled

@workshop/backend:test: cache miss, executing 8b1b275a02fb85a8
@workshop/frontend:test: cache hit, replaying logs 2cc3f17a647ef974
@workshop/frontend:test: $ vitest run
@workshop/frontend:test: 
@workshop/frontend:test:  RUN  v2.1.9 /Users/edy/projects/workshop-solides/apps/frontend
@workshop/frontend:test: 
@workshop/frontend:test:  ✓ src/pages/SignIn.test.tsx (1 test) 34ms
@workshop/frontend:test:  ✓ src/pages/SeusBenchmarks.test.tsx (1 test) 36ms
@workshop/frontend:test: 
@workshop/frontend:test:  Test Files  2 passed (2)
@workshop/frontend:test:       Tests  2 passed (2)
@workshop/frontend:test:    Start at  16:16:17
@workshop/frontend:test:    Duration  513ms (transform 43ms, setup 55ms, collect 163ms, tests 70ms, environment 291ms, prepare 49ms)
@workshop/frontend:test: 
@workshop/backend:test: $ node --test 'src/**/*.test.ts'
@workshop/backend:test: ✔ gerarDiagnostico produces a valid diagnosis from the local judge (0.479875ms)
@workshop/backend:test: ✔ gerarDiagnostico rejects a judge that returns an off-schema payload (0.205375ms)
@workshop/backend:test: ✔ positions Solípse at the extremes its bad KPIs deserve (0.484334ms)
@workshop/backend:test: ✔ percentis does not re-check cohort size - that lives in the Cohort (0.118625ms)
@workshop/backend:test: ✔ hybridSearch fuses dense + lexical via RRF (no longer a stub) (1.042666ms)
@workshop/backend:test: ✔ with a reranker, hybridSearch reorders and trims to finalSize (0.341625ms)
@workshop/backend:test: ✔ rrf reproduces the doc example - A wins by being good in both (0.677084ms)
@workshop/backend:test: ✔ an item present in only one ranking still scores, but lower (0.091875ms)
@workshop/backend:test: ✔ Cohort enforces k-anonymity at construction (0.418917ms)
@workshop/backend:test: ✔ rate accepts a percentage in [0,100] and rejects out-of-range (0.450209ms)
@workshop/backend:test: ✔ enps accepts [-100,100], days must be positive (0.090917ms)
@workshop/backend:test: ✔ makeKpis enforces every indicator invariant (0.085042ms)
@workshop/backend:test: ✔ dense search ranks the SaaS cluster above off-domain companies (2.180208ms)
@workshop/backend:test: ✔ lexical search (BM25) matches companies that share literal terms (0.407333ms)
@workshop/backend:test: ✔ AnthropicJudge forces the tool and returns its input (client mocked) (0.591709ms)
@workshop/backend:test: ✔ AnthropicJudge throws if the model returns no tool_use block (0.140208ms)
@workshop/backend:test: ✔ tokenize lowercases, strips accents and drops stopwords (0.694541ms)
@workshop/backend:test: ✔ bm25 reproduces the doc example: TF saturates, rare terms win (0.239542ms)
@workshop/backend:test: ✔ reranker scores the relevant pair higher than the irrelevant one (0.477167ms)
@workshop/backend:test: {"level":30,"time":1781119750529,"pid":70142,"hostname":"Edys-MacBook-Pro.local","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
@workshop/backend:test: ✔ GET /health returns ok (40.817208ms)
@workshop/backend:test: {"level":30,"time":1781119750531,"pid":70142,"hostname":"Edys-MacBook-Pro.local","reqId":"req-1","res":{"statusCode":200},"responseTime":1.7627501487731934,"msg":"request completed"}
@workshop/backend:test: ℹ tests 20
@workshop/backend:test: ℹ suites 0
@workshop/backend:test: ℹ pass 20
@workshop/backend:test: ℹ fail 0
@workshop/backend:test: ℹ cancelled 0
@workshop/backend:test: ℹ skipped 0
@workshop/backend:test: ℹ todo 0
@workshop/backend:test: ℹ duration_ms 236.041209

 Tasks:    2 successful, 2 total
Cached:    1 cached, 2 total
  Time:    555ms 

```

- typecheck exit: 0 | test exit: 0
- **Resumo:** LLM-as-judge: Judge port + Anthropic tool-use adapter + domain validation (LocalJudge for the run)
- **Finished:** 2026-06-10T19:29:10Z
