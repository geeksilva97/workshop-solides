#!/usr/bin/env bash
#
# workshop-run.sh - orchestrates the Tom Ranks workshop build as a sequence of
# numbered git branches, one per step, each with a run-log capturing the work.
#
# It is designed to be driven from an INTERACTIVE Claude Code session (which is
# more reliable than headless `claude -p`: full supervision, and the Stitch /
# chrome-devtools MCP servers are available). The flow per step is:
#
#   1. ./scripts/workshop-run.sh begin <NN-slug>
#        -> checks out a new branch run/<NN-slug> off the PREVIOUS step's branch
#           (or main for the first step) and scaffolds run-log/<NN-slug>.md
#   2. (the agent implements the step, editing code + writing the run-log)
#   3. ./scripts/workshop-run.sh end <NN-slug> "one-line summary"
#        -> installs deps, runs typecheck + tests (captured into the log),
#           commits everything on the step branch
#
# `list` prints the ordered steps. `push` pushes all run/* branches.
#
set -uo pipefail

STEPS=(
  "00-foundation"
  "01-screens"
  "02-bm25"
  "03-rrf"
  "04-reranker"
  "05-percentis-k-anonimato"
  "06-llm-as-judge"
  "07-verificacao"
)

PREFIX="run/"
ROOT="$(git rev-parse --show-toplevel)"
LOGDIR="$ROOT/run-log"
now() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

index_of() {
  local target="$1" i
  for i in "${!STEPS[@]}"; do
    [ "${STEPS[$i]}" = "$target" ] && { echo "$i"; return 0; }
  done
  return 1
}

base_for() {
  # echo the branch the given step should be created from
  local idx="$1"
  if [ "$idx" -eq 0 ]; then
    echo "main"
  else
    echo "${PREFIX}${STEPS[$((idx - 1))]}"
  fi
}

cmd_list() {
  echo "Workshop steps (each builds on the previous branch):"
  local i
  for i in "${!STEPS[@]}"; do
    printf "  %s  ->  %s%s  (base: %s)\n" "${STEPS[$i]}" "$PREFIX" "${STEPS[$i]}" "$(base_for "$i")"
  done
}

cmd_begin() {
  local step="${1:?usage: begin <NN-slug>}" idx base log
  idx="$(index_of "$step")" || { echo "unknown step: $step (see 'list')"; exit 1; }
  base="$(base_for "$idx")"

  echo ">> begin $step (base: $base)"
  git rev-parse --verify "$base" >/dev/null 2>&1 || { echo "base branch '$base' missing - run the previous step first"; exit 1; }
  git checkout "$base"
  if git rev-parse --verify "${PREFIX}${step}" >/dev/null 2>&1; then
    git checkout "${PREFIX}${step}"
  else
    git checkout -b "${PREFIX}${step}"
  fi

  mkdir -p "$LOGDIR"
  log="$LOGDIR/${step}.md"
  if [ ! -f "$log" ]; then
    cat > "$log" <<EOF
# Run log - ${step}

- **Branch:** \`${PREFIX}${step}\`
- **Base branch:** \`${base}\`
- **Spec:** [\`docs/steps/${step}.md\`](../docs/steps/${step}.md)
- **Started:** $(now)

> Automated reference run, executed interactively. Captures the intent, the
> decisions, the files touched, and the verification output for this step.

## Intenção (o "prompt" da etapa)

_(o que se pediu pro agente fazer nesta etapa)_

## Decisões

## Arquivos

## Interações & notas
EOF
  fi
  echo ">> branch ${PREFIX}${step} ready; log: run-log/${step}.md"
}

cmd_end() {
  local step="${1:?usage: end <NN-slug> [summary]}"; shift || true
  local summary="${*:-implement step}" log="$LOGDIR/${step}.md"
  [ -f "$log" ] || { echo "no log for $step - run 'begin' first"; exit 1; }

  echo ">> end $step - installing + checking"
  {
    echo ""
    echo "## Verificação ($(now))"
    echo ""
    echo '```'
  } >> "$log"

  pnpm install --silent >>"$log" 2>&1 || echo "(pnpm install reported issues)" >>"$log"
  echo "\$ pnpm typecheck" >> "$log"
  pnpm typecheck >>"$log" 2>&1; local tc=$?
  echo "\$ pnpm test" >> "$log"
  pnpm test >>"$log" 2>&1; local tt=$?
  {
    echo '```'
    echo ""
    echo "- typecheck exit: ${tc} | test exit: ${tt}"
    echo "- **Resumo:** ${summary}"
    echo "- **Finished:** $(now)"
  } >> "$log"

  git add -A
  git commit -m "run(${step}): ${summary}" -q
  echo ">> committed run(${step}); typecheck=${tc} test=${tt}"
  [ "$tc" -eq 0 ] && [ "$tt" -eq 0 ] || echo ">> NOTE: checks non-zero - see run-log/${step}.md"
}

cmd_push() {
  local s
  for s in "${STEPS[@]}"; do
    git rev-parse --verify "${PREFIX}${s}" >/dev/null 2>&1 && git push -u origin "${PREFIX}${s}"
  done
}

case "${1:-}" in
  list)  cmd_list ;;
  begin) shift; cmd_begin "$@" ;;
  end)   shift; cmd_end "$@" ;;
  push)  cmd_push ;;
  *) echo "usage: $0 {list|begin <NN-slug>|end <NN-slug> [summary]|push}"; exit 1 ;;
esac
