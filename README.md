# Solides Run

Plataforma de **benchmark de RH**: compara os indicadores de uma empresa com um
cohort de pares anonimizado, usando um pipeline de retrieval híbrido + reranking
e gerando um diagnóstico.

Monorepo fullstack TypeScript (pnpm workspaces + Turborepo).

## 📸 Walkthrough

Veja a jornada completa rodando **ponta a ponta com o backend real** (capturas de
cada tela): **[docs/walkthrough.md](docs/walkthrough.md)**.

| | | |
|---|---|---|
| ![Login](docs/screenshots/01-signin.png) | ![Novo benchmark](docs/screenshots/05-new-benchmark.png) | ![Pipeline](docs/screenshots/06-running.png) |
| Login (scrypt) | Novo benchmark | Pipeline (7 etapas) |
| ![Resultados](docs/screenshots/07-results.png) | ![Cohort](docs/screenshots/08-cohort.png) | ![Diagnóstico](docs/screenshots/09-diagnosis.png) |
| Resultados | Cohort anonimizado | Diagnóstico |

## Arquitetura

```
apps/
  web/        # React 19 + Vite. Telas do Solides Run. Proxy /api -> :3000
  api/        # Fastify. Orquestra o pipeline e serve os endpoints. TS nativo.
packages/
  shared/     # @workshop/shared — contratos zod compartilhados
  engine/     # @workshop/engine — o motor do benchmark (pipeline + adapters Ollama)
```

### O pipeline (`@workshop/engine`)

```
ingestão → dense retrieval (Ollama qwen) + BM25 → RRF → reranker (Qwen3-Reranker-4B)
         → cohort (top-K, k-anonimato ≥ 5) → percentis (p25/p50/p75/p90) → diagnóstico
```

- **BM25** (`k1=1.2`, `b=0.75`) · **RRF** (`k=60`) · cosseno para o retrieval denso
- **k-anonimato ≥ 5** (regra LGPD) imposto no cohort
- Direção por indicador: eNPS/tenure são "maior é melhor", o resto "maior é pior"
- Ollama via *ports* (`Embedder`/`Reranker`) — com fakes determinísticos nos testes

## Stack

- **TypeScript nativo** no backend (type stripping do Node 25, sem tsx/build no `api`)
- **`node:test`** no `api`/`engine`; **Vitest** no `web`
- **Mutation testing** com **Stryker** no `engine` (~98%)

## Comandos

| Comando | O quê |
|---|---|
| `pnpm dev` | web (:5173) + api (:3000) |
| `pnpm build` | builda os pacotes que emitem `dist/` (`shared`, `engine`) |
| `pnpm test` | `node:test` (api/engine) + Vitest (web) |
| `pnpm typecheck` | type-check de todos os pacotes |
| `pnpm --filter @workshop/engine test:mutation` | Stryker no engine |

## Rodando localmente

```bash
ollama pull qwen3-embedding:0.6b
ollama pull awenleven/Qwen3-Reranker-4B:Q4_K_M

pnpm install
pnpm build
pnpm dev
```

http://localhost:5173 — login demo: `ana@solides.com` / `solides123`.

**Flags:**
- `VITE_ENABLE_MSW=true` (web) — roda a UI sobre mocks MSW, sem backend.
- `PIPELINE_STAGE_DELAY_MS=1300` (api) — espaça as etapas do pipeline para a tela
  de progresso ficar visível em máquinas rápidas (não altera o resultado).
