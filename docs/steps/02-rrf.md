# Etapa 2 - RRF (Reciprocal Rank Fusion)

> Live-build. Roteiro §6. O beat de **desmistificar o paper**: são 4 linhas. ~5-7 min.

## Objetivo

Fundir o ranking da **dense** (significado) com o ranking do **BM25** (literal) num único
ranking. O truque: **ignorar os scores e olhar só a posição** de cada empresa em cada lista.
Quem aparece bem nos dois sobe.

Saída: um ranking único, `top-30`, que alimenta o reranker (etapa 3).

## Depende de

- **Dense** (pré-build) e **BM25** (etapa 1) devolvendo rankings no mesmo shape
  `{ companyId, score, rank }[]`.

## Onde mexer

| Camada | Arquivo (sugerido) | O quê |
|--------|--------------------|-------|
| `application` | `application/retrieval/rrf.ts` | função **pura** `rrf(rankings, k=60): Ranking` |
| `application` | `application/retrieval/hybrid-search.ts` | chama dense + bm25 em paralelo e passa pro `rrf` |

> RRF não toca banco nem rede - é aritmética sobre posições. Por isso vive em `application` como
> função pura, fácil de testar e sem mock nenhum.

## Conceito essencial

Duas tentações ruins de fundir rankings:

1. **Somar os scores** - não dá: cosine (0-1) e BM25 (absoluto) vivem em escalas diferentes.
2. **Normalizar e somar** - frágil; um outlier no BM25 estraga tudo.

RRF resolve esquecendo o score. Pontua cada item pelo **inverso da posição**, soma entre os
rankings:

```
RRF_score(item) = Σ  1 / (k + rank_i(item))      # k = 60 (do paper), rank 1-indexed
                 i ∈ rankings
```

Por que `k=60`: atenua a diferença entre os primeiros lugares. O 1º vale `1/61 ≈ 0.0164`, o 2º
`1/62 ≈ 0.0161` - quase igual. Estar no top-10 é o que importa; a ordem exata dentro dele,
menos. É deliberado.

**Exemplo numérico** (mesmo conjunto, dois rankings, `k=60`):

| Cand | rank dense | rank bm25 | RRF total | final |
|------|-----------|-----------|-----------|-------|
| A | 1 | 2 | 0.03252 | **1º** |
| C | 4 | 1 | 0.03202 | 2º |
| B | 2 | 4 | 0.03176 | 3º |

A ganha por estar bem nos **dois**. C é 1º no BM25 mas só 4º na dense, então perde pra A.

## Prompt pro Claude (ao vivo)

> Cria em `application/retrieval/rrf.ts` uma função pura `rrf(rankings: Ranking[], k = 60)` que
> recebe N rankings (cada um `{ companyId, rank }[]`), soma `1/(k + rank)` por empresa em todos
> os rankings em que ela aparece, e devolve um ranking único ordenado desc pelo score somado.
> Empresa ausente de um ranking não pontua por ele. Escreve junto um teste `node:test` com o
> exemplo de dois rankings.

Beat de fala: *"Os scores não são comparáveis - cosine e BM25 vivem em escalas diferentes. O
RRF ignora o score e olha só a posição. E olha que engraçado: são quatro linhas. Às vezes 'tem
um paper' não quer dizer 'é complicado'."*

## Skill / MCP (cue)

- Nenhum. Esta etapa é **de propósito** o contraste: codar direto, sem ler paper, sem skill.
  É o par do reranker (etapa 3), onde aí sim eu paro pra ler.

## Critério de aceite

- `node:test` em `application/retrieval/rrf.test.ts` reproduz o exemplo: A em 1º, C em 2º.
- Empresa que aparece só num ranking ainda entra, com score menor.
- Função é **determinística** e **pura** (sem I/O, sem `Date`/`Math.random`).

```bash
pnpm --filter @workshop/backend test
```

## Gotchas

- **`k=60` quase nunca precisa de tuning.** Resista a varrer hyperparam.
- **Pesos por ranking**: RRF original não tem peso. Se quiser "dense vale 2x", multiplique a
  contribuição daquele ranking - mas cuidado pra não recriar o problema de escala.
- **Cobertura consistente**: se um ranking vai até 100 e o outro até 50, garanta que ambos vão
  pelo menos até onde você corta (top-30), senão o fundo fica enviesado.
- RRF dá **ranking**, não probabilidade calibrada. Não use o score somado como "confiança".

## Referências

- [Reciprocal Rank Fusion outperforms Condorcet... - Cormack et al., SIGIR 2009](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) (paper original, curto e direto)
- [Elasticsearch: RRF](https://www.elastic.co/guide/en/elasticsearch/reference/current/rrf.html)
- [Azure AI Search: Hybrid search + RRF](https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview)
