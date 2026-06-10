# Etapa 3 - Reranker (cross-encoder)

> Live-build. Roteiro §6. A microdecisão-chave: **ler o paper COM a IA**, não copiar cego.
> ~12-15 min. É aqui que o sub-agent e o WebSearch aparecem.

## Objetivo

Reordenar o `top-30` do RRF olhando cada par `(descrição Solípse, descrição candidata)`
**junto**, com um modelo que dá um score de relevância muito mais preciso. Saída: `top-20` -
o cohort comparável de verdade.

## Depende de

- **RRF** (etapa 2) devolvendo o `top-30`.

## Onde mexer

| Camada | Arquivo (sugerido) | O quê |
|--------|--------------------|-------|
| `application` | port `Reranker.rerank(query, docs): Scored[]` | a abstração que o domínio/uso conhece |
| `application` | `application/retrieval/hybrid-search.ts` | pluga o rerank depois do RRF, corta top-20 |
| `infra` | `infra/reranker/<provider>.ts` | implementação concreta (ver decisão abaixo) |

> **Decisão antes de codar (expor no palco):** o reranker é um cross-encoder, e cross-encoder
> **não é Anthropic**. Opções:
> 1. **Cohere Rerank** (API gerenciada, `rerank-v3.5`) - mais fácil de plugar, 1 chamada.
> 2. **BGE Reranker v2** local via `transformers.js` (Node) ou um micro-serviço Python.
>
> Pra demo, **Cohere Rerank** é o caminho de menor atrito. O port `Reranker` deixa isso trocável
> - é o ponto da arquitetura: o `application` não sabe qual provider está atrás.

## Conceito essencial

A dense (bi-encoder) codifica query e doc **separados** e compara os vetores depois - o modelo
nunca vê os dois textos juntos. Rápido, mas perde nuance.

O cross-encoder recebe `[query] [SEP] [documento]` num **único input** e roda atenção entre
cada token de um contra cada token do outro. É a diferença entre julgar dois currículos sem ver
a vaga vs. ler o currículo com a vaga aberta do lado.

| Aspecto | Bi-encoder (dense) | Cross-encoder (reranker) |
|---------|--------------------|--------------------------|
| Codifica query e doc | separados | juntos |
| Pré-computa embedding | sim (cacheável) | não (depende da query) |
| Custo por query | 1 forward + N produtos | N forwards (caro) |
| Precisão | boa | excelente |

Daí o padrão: **bi-encoder recupera top-100, cross-encoder reordena pra top-10/20.**

**Exemplo concreto** (vaga "Senior Java + Spring, sistemas distribuídos"):

- Bi-encoder pode pôr o candidato "Senior JavaScript" em 1º (textualmente parecido com "senior
  dev").
- Cross-encoder lê junto e derruba: "JavaScript não é Java". Sobe o "8 anos Java/Spring,
  pagamentos" pra 1º (0.93), derruba o JS pra 0.12.

## Prompt pro Claude (ao vivo)

**Passo 1 - delegar a leitura (sub-agent + web):**

> Antes de eu codar isso: dispara um sub-agente pra ler o paper do Sentence-BERT (a parte que
> compara bi-encoder vs cross-encoder) e me devolver, em 5 bullets, a intuição do porquê o
> cross-encoder é mais preciso e por que ele não escala pra recuperação - só pra rerank. Quero
> entender antes de escrever, não depois.

**Passo 2 - implementar atrás do port:**

> Cria o port `Reranker` em `application` com `rerank(query: string, docs: {id, text}[]):
> {id, score}[]`. Implementa em `infra/reranker/cohere.ts` chamando a API de rerank da Cohere
> (`rerank-v3.5`), e pluga no `hybrid-search` depois do RRF, cortando o resultado em top-20.
> Mantém o `application` agnóstico do provider.

Beat de fala: *"Isso é delegar leitura, não delegar entendimento. Eu ainda leio o resumo e
checo antes de codar. Repara na assimetria: o RRF eu codei direto porque vi que era trivial; o
reranker eu parei pra ler porque era sutil."*

## Skill / MCP (cue)

- **Sub-agent (Agent tool)** + **WebSearch/WebFetch**: disparar a leitura do paper no passo 1.
  Fallback: ter a URL do Sentence-BERT à mão caso a busca ao vivo trave.
- **`claude-api`**: consultar a referência do SDK se for usar Anthropic em qualquer ponto da
  cola (ex.: gerar o texto do par). Para o rerank em si, é a API da Cohere.

## Critério de aceite

- `node:test` em `infra/reranker/*.test.ts` (com a chamada externa mockada): dado um par
  obviamente relevante e um obviamente irrelevante, o relevante recebe score maior.
- O `hybrid-search` retorna **20** empresas após o rerank, ordenadas pelo score do cross-encoder.
- Trocar o provider do reranker **não** muda nada no `application` (port respeitado).

```bash
pnpm --filter @workshop/backend test
```

## Gotchas

- **Custo escala linear com N** - por isso o filtro grosso (dense+BM25+RRF -> top-30) antes é
  essencial. Não jogue 1000 pares no cross-encoder.
- **Janela de ~512 tokens**: descrições longas precisam de truncamento/chunk.
- **Score não é probabilidade calibrada**: use pra **ranking**, não como "se > 0.7 está
  confirmado".
- **Domain shift**: reranker treinado em inglês geral pode degradar em pt-BR técnico - vale
  testar com dados reais do cohort.
- **Mesmo modelo pra todos os pares**: não misture dois rerankers com a mesma threshold.

## Referências

- [Sentence-BERT - Reimers & Gurevych, 2019](https://arxiv.org/abs/1908.10084) (bi vs cross - o paper pro sub-agent ler)
- [Passage Re-ranking with BERT - Nogueira & Cho, 2019](https://arxiv.org/abs/1901.04085) (cross-encoder pra ranking)
- [Cohere Rerank](https://docs.cohere.com/docs/rerank-overview) (provider sugerido)
- [BGE Reranker v2-m3 - Hugging Face](https://huggingface.co/BAAI/bge-reranker-v2-m3) (alternativa open source)
- [Optimizing RAG with Hybrid Search & Reranking - Superlinked](https://superlinked.com/vectorhub/articles/optimizing-rag-with-hybrid-search-reranking)
