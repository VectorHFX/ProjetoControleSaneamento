# CLAUDE.md

Comece pelo [`README.md`](README.md): estrutura, regras de ouro e testes locais.

## Agent skills

The engineering skills live in `.claude/skills/` (copied from mattpocock/skills).

### Issue tracker

Issues live in this repo's GitHub Issues (`VectorHFX/ProjetoControleSaneamento`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Combinados com o Victor

- **Trava de testes:** toda ação nova que altera dados começa liberada **só para o proprietário** (papel `administrador`) e travada para todos os outros, até `liberarConfiguracaoCPT` (`PerfisCPT.exigirConfiguracao`). Nunca travar a conta proprietária.
- **Revisão a cada duas entregas:** depois de duas entregas, auditar as duas (correção, funcionamento, desempenho) antes de seguir.
- Não gerar coisa demais de uma vez; uma entrega por bloco, com testes e prévia.
