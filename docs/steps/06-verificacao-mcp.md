# Etapa 6 - Verificação: a IA vê a tela (MCP)

> Live-build. Roteiro §8 (final). Não é código novo - é **verificar** o que foi construído.
> ~5-7 min. É o momento de destaque do MCP.

## Objetivo

Fechar o loop: a IA abre o **dashboard renderizado** no navegador, lê a tela de verdade, e
compara o diagnóstico mostrado com o JSON que o LLM-as-judge produziu. Verificar, não confiar.
Encerra com o callback de uma linha sobre o Stitch.

## Depende de

- **LLM-as-judge** (etapa 5) com o diagnóstico já fluindo pra tela.
- App rodando local (`pnpm dev`) com o dashboard da Solípse acessível.

## Onde mexer

Nada de código de produção. É operação de verificação via MCP do Chrome.

## Conceito essencial

O **MCP** (Model Context Protocol) dá "olhos e mãos" pro modelo no mundo - ele deixa de viver
só no texto e passa a operar ferramentas externas. Aqui, o MCP do **chrome-devtools** deixa o
Claude navegar até a tela, tirar um snapshot do DOM renderizado, e confrontar com o JSON.

É o contraste com alucinação: o modelo **vê** o número que está na tela, não adivinha o que
"deveria" estar.

Callback (uma linha, sem demo): as telas que a audiência viu prontas no começo foram desenhadas
no **Stitch** e puxadas via MCP também - mesma ideia, olhos e mãos no mundo.

## Prompt pro Claude (ao vivo)

> Usa o MCP do Chrome: navega até `http://localhost:5173/benchmark/<id-solipse>`, tira um
> snapshot da tela e me diz se o diagnóstico principal e os indicadores críticos que aparecem
> renderizados batem com o JSON que o judge devolveu na etapa anterior. Aponta qualquer número
> na tela que não exista no JSON.

Beat de fala: *"Esse é o MCP que eu falei lá no começo - ele tá vendo a tela renderizada e
comparando com o JSON, não adivinhando. Olhos e mãos no mundo. Esse é o trabalho real:
verificar, não confiar."*

Callback (uma frase, sem demo): *"E aquelas telas que vocês viram prontas? Eu desenhei no
Stitch e puxei o design via MCP também - mesma ideia."*

## Skill / MCP (cue)

- **MCP chrome-devtools** (o destaque): `navigate_page` -> `take_snapshot` (ou
  `take_screenshot`) -> ler o conteúdo e comparar. **Pré-flight antes da sessão:** testar
  `navigate_page` + `take_snapshot` uma vez, com o app no ar, pra não falhar ao vivo.
- **`verify`** (skill): se quiser formalizar "rodar o app e confirmar o comportamento" em vez de
  só o snapshot manual.
- **Stitch** (MCP): só **menção** no callback. Projeto canônico `11048422501635958897`. Ter
  autenticado caso alguém peça pra ver.

## Critério de aceite

- O snapshot da tela é capturado e o Claude consegue **citar** o texto do diagnóstico que está
  renderizado.
- A comparação tela vs JSON fecha: os números na tela existem no JSON do judge (nenhum número
  órfão).
- Se algo não bater, isso vira conteúdo - mostrar como se debuga ao vivo, não esconder.

## Gotchas

- **Pré-flight é obrigatório**: MCP do Chrome travando ao vivo é o pior momento. Teste a cadeia
  `navigate -> snapshot` antes.
- **Servidores MCP autenticados** (claude.ai etc.) podem não estar disponíveis em sessão
  headless/cron - aqui é interativo, então ok, mas confirme o login do Stitch antes.
- **A porta**: o frontend sobe em `5173` (Vite) por default - confira a rota real do dashboard
  da Solípse no app.
- Snapshot do DOM (`take_snapshot`) é melhor que screenshot pra **ler texto**; screenshot é
  melhor pra mostrar o visual. Escolha conforme o que você quer provar.

## Referências

- [Model Context Protocol](https://modelcontextprotocol.io/) (o que é MCP)
- [chrome-devtools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) (o servidor usado)
- [Google Stitch](https://stitch.withgoogle.com/) (design das telas, puxado via MCP)
