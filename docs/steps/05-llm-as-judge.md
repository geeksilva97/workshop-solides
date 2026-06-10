# Etapa 5 - LLM-as-judge (structured output)

> Live-build. Roteiro §8. Os números frios viram diagnóstico - controlado. ~10-12 min.

## Objetivo

Transformar os percentis (números) num **diagnóstico acionável** que um gestor de RH entende -
"você tem problema de retenção, não de atração" em vez de "turnover no p85". O LLM volta, mas
**forçado** a um schema e instruído a não inventar número.

## Depende de

- **Percentis** (etapa 4): por KPI, `{ valor, p25, p50, p75, p90, posicao }`.

## Onde mexer

| Camada | Arquivo (sugerido) | O quê |
|--------|--------------------|-------|
| `domain` | `domain/diagnostico.ts` | o tipo/validação do `Diagnostico` (a forma da saída é regra) |
| `application` | port `Judge.diagnose(percentis): Diagnostico` | a abstração |
| `application` | `application/gerar-diagnostico.ts` | monta contexto, chama o port, valida o retorno |
| `infra` | `infra/judge/anthropic.ts` | Anthropic SDK + **tool use** pra forçar o schema |

## Conceito essencial

Em vez de "escreve um relatório" e rezar, você **estrutura a tarefa**: contexto + schema de
saída + papel claro. O modelo opera como **juiz/avaliador**, não gerador livre - você controla
o que sai.

Três peças:

1. **Contexto montado**: KPIs da Solípse + distribuição do cohort + posição em cada KPI (o JSON
   da etapa 4).
2. **Schema forçado** (via tool use no Anthropic SDK):

```json
{
  "diagnostico_principal": "string (1 frase, conclusão central)",
  "indicadores_criticos": [
    { "kpi": "string", "leitura": "string", "severidade": "alta | media | baixa" }
  ],
  "hipoteses": ["string (até 3)"],
  "proxima_acao": "string (recomendação concreta)"
}
```

3. **Instrução de papel + anti-alucinação**: "Você é um analista sênior de People Analytics...
   use **só** os números do JSON, não invente."

**Exemplo** - input (Solípse, resumido):

```json
{ "turnover_voluntario": { "valor": 28.4, "p50": 12, "posicao": "p95" },
  "enps": { "valor": -5, "p50": 25, "posicao": "p5" } }
```

Output esperado (resumido):

```json
{ "diagnostico_principal": "Problema de retenção, não de atração - contrata em ritmo saudável mas perde gente muito acima do cohort.",
  "indicadores_criticos": [
    { "kpi": "turnover_voluntario", "leitura": "No p95 (28.4% vs mediana 12%), ~2.5x o cohort.", "severidade": "alta" }
  ],
  "proxima_acao": "Pesquisa de saída nos últimos 30 desligamentos voluntários, cruzada com pulse de engajamento." }
```

## Prompt pro Claude (ao vivo)

> Implementa o port `Judge` em `infra/judge/anthropic.ts` usando o Anthropic SDK. Em vez de
> texto livre, força o schema via **tool use**: define uma tool `emitir_diagnostico` com o
> input schema acima e instrui o modelo a chamá-la. No system prompt: papel de analista sênior
> de People Analytics + "use só os números do JSON, não invente nenhum valor". No `application`,
> valida o JSON que volta (enums de severidade, tamanhos de array) antes de devolver um
> `Diagnostico` de domínio. Mostra o schema antes de rodar.

Beat de fala: *"Repara que eu não deixo ele escrever solto. Eu forço o formato e mando ele não
inventar número. Controle, não fé."*

## Skill / MCP (cue)

- **`claude-api`** (obrigatório aqui): é a referência pra tool use / structured output do
  Anthropic SDK - model id, formato da tool, `tool_choice` pra forçar a chamada. Não responder
  de memória.
- Sem MCP nesta etapa (o MCP do Chrome entra na verificação, etapa 6).

## Critério de aceite

- `node:test` (chamada Anthropic mockada): dado o JSON da Solípse, o `Diagnostico` validado tem
  `diagnostico_principal` não-vazio, 1-3 `indicadores_criticos` com `severidade` em
  `{alta,media,baixa}`, e a validação **rejeita** um payload fora do schema.
- O `application` não confia cegamente: valida tipos/enums/ranges do que o LLM devolve.
- Nenhum número no output que não venha do JSON de entrada (checagem manual no exemplo da
  Solípse).

```bash
pnpm --filter @workshop/backend test
```

## Gotchas

- **"Não invente números"** - o LLM **vai** inventar se você não der o dado explícito e não
  instruir contra. Sempre passe a fonte e diga "use só o JSON".
- **Determinismo**: LLM-as-judge não é determinístico por default. Pra consistência, `temperature
  = 0`; pra avaliação séria, rode N vezes e tire mediana.
- **Valide mesmo com structured output**: tool use força a forma, não a sanidade. Cheque enums,
  ranges, tamanhos de array no `application`.
- **Viés de comprimento/posição**: o juiz tende a achar resposta longa "melhor" e a favorecer o
  1º item em comparações A/B - relevante se você expandir pra comparar empresas.
- **Calibre com humano**: tenha alguns exemplos avaliados por gente pra checar que o juiz
  concorda. Sem isso, é chute.

## Referências

- [Tool use (structured output) - Anthropic docs](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) (forçar schema via tool)
- [Increase output consistency / JSON - Anthropic docs](https://docs.anthropic.com/en/docs/build-with-claude/define-success)
- [Judging LLM-as-a-Judge with MT-Bench - Zheng et al., 2023](https://arxiv.org/abs/2306.05685) (paper-foundation, discute vieses)
- A skill `claude-api` deste ambiente para model ids, `tool_choice` e exemplos do SDK.
