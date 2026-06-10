# Tom Ranks - Roteiro de build (docs por etapa)

Estas docs são o **plano de trabalho** do workshop. Cada arquivo em [`steps/`](./steps) é
uma tarefa autocontida: o conceito, onde mexer no código, o prompt que eu dou pro Claude
ao vivo, o gatilho de skill/MCP, o critério de aceite e os links. Dá pra abrir uma etapa,
ler de cima a baixo, e construir.

> O **Tom Ranks** é um agente de benchmark de RH: recebe os indicadores de uma empresa
> cliente fictícia (**Solípse**), acha um cohort de empresas comparáveis, posiciona cada KPI
> na distribuição do cohort e gera um diagnóstico acionável. A arquitetura por baixo é a de um
> sistema de busca sério: **busca híbrida (dense + BM25) -> RRF -> reranker -> LLM-as-judge**.

## O que já está pronto (pré-build - não nasce ao vivo)

A casca é commodity e fica pronta antes do palco. No workshop ela só é mostrada e nomeada
como a decisão de delegar o trivial.

| Item | Estado |
|------|--------|
| Monorepo (pnpm + Turborepo), frontend React/Vite, backend Fastify 4 camadas | pronto (este repo) |
| Login + sessão (scrypt + cookie assinado), telas (Sign In, home, 4 de benchmark) | pré-build |
| Banco Postgres + pgvector populado: ~107 empresas + embeddings + Solípse + 2 contas | pré-build (dump) |
| **Fluxo 0** (gera + indexa a base) e **Fluxo 1** (ingestão da empresa cliente) | pré-build |
| **Etapa 1 - Dense retrieval** (cosine no pgvector) | pré-build |
| Loop do agente / orquestrador + **scaffolding das tools como stubs** | pré-build |

**Convenção de live-build:** um stub continua stub até a etapa dele. As telas já chamam a API,
mas o que vem atrás sai de stub só quando a etapa é construída ao vivo. Não implementar
adiantado.

## O que vamos construir ao vivo (a worklist)

A ordem é a do [roteiro](https://github.com/geeksilva97/blog) (seções 6 a 8). Cada etapa
linka a doc-tarefa correspondente.

| # | Etapa | Camadas que toca | Skill / MCP | Doc |
|---|-------|------------------|-------------|-----|
| 1 | **BM25** - busca lexical | infra (Postgres FTS) + application | `code-review` depois | [01-bm25.md](./steps/01-bm25.md) |
| 2 | **RRF** - fusão de rankings | application (função pura) | - | [02-rrf.md](./steps/02-rrf.md) |
| 3 | **Reranker** - cross-encoder reordena | infra (adapter) + application (port) | **sub-agent** + **WebSearch** + `claude-api` | [03-reranker.md](./steps/03-reranker.md) |
| 4 | **Percentis + k-anonimato** | domain (invariante do `Cohort`) + application | - | [04-percentis-k-anonimato.md](./steps/04-percentis-k-anonimato.md) |
| 5 | **LLM-as-judge** - structured output | infra (Anthropic) + application + domain | **`claude-api`** | [05-llm-as-judge.md](./steps/05-llm-as-judge.md) |
| 6 | **Verificação** - a IA vê a tela | - (verificação) | **chrome-devtools** + `verify` + **Stitch** (callback) | [06-verificacao-mcp.md](./steps/06-verificacao-mcp.md) |

## Como ler uma doc-tarefa

Cada `steps/NN-*.md` segue o mesmo esqueleto:

1. **Objetivo** - o que essa etapa entrega.
2. **Depende de** - o que precisa estar pronto antes.
3. **Onde mexer** - arquivos/camadas, na arquitetura de 4 camadas do backend.
4. **Conceito essencial** - intuição + fórmula + exemplo numérico (o mínimo pra não ser mágica).
5. **Prompt pro Claude** - o que eu digito ao vivo.
6. **Skill / MCP (cue)** - o gatilho exato e a fala-âncora.
7. **Critério de aceite** - como sei que funcionou (teste `node:test`).
8. **Gotchas** - as armadilhas.
9. **Referências** - papers e docs.

## Arquitetura do backend (lembrete)

```
apps/backend/src/
  domain/        invariantes dos objetos (Company, Indicator, Cohort com k-anonimato, Diagnostico)
  application/   casos de uso + ports (CompanyRepository, Reranker, Judge) + funções puras (RRF, percentis)
  interface/     adapters HTTP (Fastify em interface/http)
  infra/         implementações dos ports (Postgres/pgvector, reranker, Anthropic SDK)
```

Dependências apontam pra dentro. O `domain` não depende de nada.
