# Solides Run — Benchmark de RH

Plataforma de benchmarking de RH: compara os indicadores de uma empresa contra um **cohort anonimizado de pares** (k-anonimato ≥ 5, LGPD), calcula percentis e gera um diagnóstico acionável.

A retrieval roda um pipeline híbrido de verdade — **BM25 + dense retrieval (embeddings Ollama) + RRF + reranker** — e tudo é persistido em **PostgreSQL**: usuários, sessões, empresas e o histórico de benchmarks (que alimenta as tendências período-a-período).

## A jornada

Login → criar benchmark → pipeline → resultados → cohort → diagnóstico → tendências:

![Solides Run — jornada completa](docs/journey.gif)

> Versão em vídeo (melhor qualidade): [`docs/journey.mp4`](docs/journey.mp4). Screencast contínuo gravado dirigindo o app real (Vite + Fastify + PostgreSQL + Ollama) com o `recordVideo` do Playwright — regenere com `pnpm record:journey` (precisa de `ffmpeg` e dos servidores no ar).

## Stack

Monorepo **pnpm workspaces + Turborepo**, tudo ESM e TypeScript.

- **`apps/web`** — React 19 + Vite. Proxy de `/api` → `:3000`.
- **`apps/api`** — Fastify 5, TypeScript nativo no Node (sem build). Persistência em PostgreSQL via `pg`, repositórios injetáveis.
- **`packages/engine`** — `@workshop/engine`: o pipeline de benchmark (BM25, dense, RRF, reranker, percentis, diagnóstico) + adapters Ollama.
- **`packages/shared`** — `@workshop/shared`: schemas zod + tipos compartilhados entre web e api.

## Pré-requisitos

- Node 25+ e pnpm 11+
- Docker (para o PostgreSQL)
- [Ollama](https://ollama.com) rodando com os modelos:
  ```bash
  ollama pull qwen3-embedding:0.6b
  ollama pull awenleven/Qwen3-Reranker-4B:Q4_K_M
  ```

## Como rodar

```bash
docker compose up -d          # PostgreSQL (:5432)
cp .env.example .env          # DATABASE_URL
pnpm install
pnpm dev                      # web :5173 + api :3000
```

No primeiro boot a API cria o schema e semeia as empresas-cliente e as contas demo.

**Conta demo:** `ana@solides.com` / `solides123`

## Comandos

| Comando | O que faz |
|---|---|
| `pnpm dev` | Sobe web (:5173) e api (:3000) juntos |
| `pnpm build` | Builda os pacotes que emitem `dist/` (`shared`, `engine`) |
| `pnpm test` | Roda todas as suítes (api/engine via `node:test`, web via Vitest) — **sem banco**, com repositórios in-memory |
| `pnpm typecheck` | Type-check de todos os pacotes |

## Arquitetura — persistência sem mocks

Os serviços dependem de **interfaces de repositório** (mesma ideia das ports `Embedder`/`Reranker` do engine):

- **Produção** injeta os repositórios PostgreSQL (`apps/api/src/repositories/postgres.ts`).
- **Testes** injetam os in-memory (`memory.ts`) — por isso `pnpm test` não precisa de banco.

Cada rota protegida valida o token de sessão (`Authorization: Bearer …`, 401 sem/ inválido) e os benchmarks são escopados por usuário. As **tendências são reais**: comparam o benchmark atual com o anterior da mesma empresa, lido do histórico.

---

## Workshop

Este repositório é o material de um workshop. Ele foi construído em **fatias verticais pequenas e versionadas** — uma branch `run/NN` por etapa, cada uma entregando algo testável de ponta a ponta. As seções abaixo reúnem o roteiro, os conceitos e o jeito de trabalhar.

### Rodar o workshop com seu agente

O ponto de partida é a branch **`workshop/scaffold`**: estrutura, contratos, frontend, API e persistência prontos; os **algoritmos do `@workshop/engine` ficam como `TODO`** e os testes começam vermelhos. Você implementa o cérebro — de preferência dirigindo um agente (Claude Code).

**1. Clone e entre no scaffold**

```bash
git clone <repo> && cd workshop-solides
git checkout workshop/scaffold
docker compose up -d     # Postgres já sobe populado pelo db/dump.sql
cp .env.example .env
pnpm install
```

Tenha o [Ollama](https://ollama.com) rodando (`qwen3-embedding:0.6b` + `awenleven/Qwen3-Reranker-4B:Q4_K_M`). O roteiro detalhado dos passos vive em `docs/WORKSHOP.md` na branch.

**2. Deixe o agente entender o terreno**

Aponte-o para `docs/WORKSHOP.md` e para a suíte vermelha. Um primeiro prompt que funciona bem:

> "Leia o `docs/WORKSHOP.md` e rode `pnpm --filter @workshop/engine test`. Liste os `TODO` do engine na ordem do worklist e me diga por onde começar."

**3. Trabalhe um `TODO` por vez (loop)**

> "Implemente o próximo `TODO` (`buildBm25Index` + `searchBm25` em `packages/engine/src/bm25.ts`) seguindo a fórmula no cabeçalho do arquivo. Rode os testes do engine até ficarem verdes. **Não altere os testes** — eles são o contrato."

Repita descendo a tabela do worklist. Quando o engine inteiro fechar verde, os testes de pipeline da **api** passam junto (rodam o pipeline real sobre fakes).

**4. Verifique de ponta a ponta**

> "Suba `pnpm dev`, faça login com `ana@solides.com` / `solides123`, rode um benchmark e confirme que resultados, cohort, diagnóstico e tendências aparecem."

**Dicas ao dirigir o agente**

- Use **plan mode** para tarefas com várias etapas; deixe o agente explorar antes de editar.
- Peça para ele **ler o cabeçalho de cada arquivo** (a fórmula/contrato está lá) antes de implementar.
- Exija `pnpm test` + `pnpm typecheck` verdes **antes de cada commit** — e que ele **não toque nos testes** para "passar".
- Uma fatia por commit/PR, como nas branches `run/NN`.

### Roteiro (como foi construído)

| Etapa | Branch | Entrega |
|---|---|---|
| 00 | `run/00-foundation` | Monorepo (pnpm + Turborepo), TS nativo no Node, zod compartilhado |
| 01 | `run/01-screens` | As 10 telas do frontend (design gerado via **Stitch**) |
| 02 | `run/02-bm25` | Busca léxica BM25 |
| 03 | `run/03-rrf` | Reciprocal Rank Fusion |
| 04 | `run/04-reranker` | Reranker (Qwen3 via Ollama) |
| 05 | `run/05-percentis-k-anonimato` | Percentis + k-anonimato (LGPD) |
| 06 | `run/06-llm-as-judge` | Diagnóstico / LLM-as-judge |
| 07 | `run/07-verificacao` | Testes + mutation testing |
| 08 | `run/08-postgres` | Persistência real em PostgreSQL |

### Conceitos envolvidos

**Monorepo & runtime**

- pnpm workspaces + Turborepo: grafo de tasks, dependência `^build`, cache.
- TypeScript **nativo no Node** (type stripping): api e engine rodam `.ts` direto, sem build. `erasableSyntaxOnly` proíbe `enum`/`namespace`/parameter properties.
- ESM em tudo. As extensões de import diferem por pacote (`.ts` onde o código roda direto, `.js` onde só é compilado) — detalhado no `CLAUDE.md`.

**Contratos**

- **Zod** como fonte única da verdade: schema + `z.infer` em `@workshop/shared`, consumido por web e api. Validação em runtime nas bordas (request/response), nos dois lados.

**Arquitetura — ports & adapters (hexagonal)**

- O mesmo padrão em dois níveis: as ports `Embedder`/`Reranker` (engine) e `Repository` (api).
- A injeção de dependência escolhe o adapter: **produção** usa Ollama / PostgreSQL; **testes** usam fakes / in-memory. É isso que mantém a suíte determinística, sem rede e sem banco.

**Pipeline de retrieval (RAG / Information Retrieval)**

- **BM25** — ranking léxico (k1=1.2, b=0.75).
- **Dense retrieval** — embeddings (Ollama) + similaridade de cosseno.
- **RRF** — Reciprocal Rank Fusion (k=60) para fundir os dois rankings.
- **Reranker** — cross-encoder Qwen3-Reranker; pontua relevância via P(yes).
- **Percentis / ECDF** — onde a empresa cai dentro do cohort.
- **k-anonimato** — cohort com mínimo de 5 empresas (LGPD, evita reidentificação).
- **Diagnóstico** — determinístico e templado; a etapa *LLM-as-judge* mostra como plugar um juiz LLM por trás de uma port.
- **Tendências** — período-a-período, a partir do histórico real.

**Persistência**

- PostgreSQL com schema idempotente, migrate + seed no boot e recovery de runs órfãos (um restart no meio de um run o marca como `failed`).
- Sessões com scrypt + `timingSafeEqual`, validadas por Bearer token. Artefatos aninhados (benchmark/cohort/diagnóstico) em JSONB.

**Testes & qualidade**

- `node:test` + `app.inject()` (api e engine, sem subir porta); Vitest + Testing Library + MSW (web).
- **Mutation testing** com Stryker no engine (break threshold 70).
- Determinismo via injeção de relógio, `idFactory` e fakes de Ollama.
- Regra de ouro: `pnpm test` + `pnpm typecheck` verdes **antes de qualquer commit**.

### MCPs usados

Três servidores MCP (Model Context Protocol) entraram no fluxo, cada um numa fase diferente:

- **Stitch** — geração do design das telas. Ponto de partida visual das 10 telas do frontend, antes de virarem componentes React.
- **Chrome DevTools (Google)** — inspeção do app rodando no navegador real: requisições `/api`, console, performance e auditorias Lighthouse. Útil para depurar a integração front↔back.
- **Playwright** — dirigir o app de ponta a ponta (snapshots de acessibilidade, cliques, formulários) e **gravar a jornada** em vídeo via `recordVideo` (ver `scripts/record-journey.mjs` / `pnpm record:journey`).

### Dicas de workflow (com Claude Code)

- **Explore antes de planejar.** Dispare agentes de exploração em paralelo para mapear o código; só então escreva o plano. Plan mode existe pra isso.
- **Transforme dúvidas em perguntas objetivas.** Decisões do usuário (qual banco, o que fazer com os mocks) viram perguntas curtas *antes* de codar — não suposições enterradas no código.
- **Trabalhe em fatias verticais pequenas** (as branches `run/NN`): cada passo é testável e revisável isoladamente, e o diff fica legível.
- **Ports/repos para testabilidade.** Injetar dependências mantém a suíte rápida e sem serviços externos — e o mesmo padrão troca Ollama/Postgres por fakes sem tocar na lógica.
- **Verifique no app real, não só nos testes.** `docker compose up` + Ollama + a jornada de ponta a ponta pega o que o teste unitário não pega.
- **Higiene de PR.** Um PR por fatia; cuidado com PRs sobrepostos (aprendemos fechando um duplicado).
- **Documente a jornada.** O vídeo/walkthrough vira material de workshop e prova viva de que funciona.
