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

- **Trava de testes — PAUSADA (06/10/2026):** enquanto a equipe ainda não usa a aplicação, ações novas já nascem abertas a todos. Volta a valer quando o Victor disser. Regra (quando ativa): toda ação nova que altera dados começa liberada **só para o proprietário** (papel `administrador`) até `liberarConfiguracaoCPT` (`PerfisCPT.exigirConfiguracao`). Nunca travar a conta proprietária.
- **Simples e direta:** poucos campos, bem definidos; o opcional fica em "Mais detalhes"; nada de passos a mais. Vale para toda tela nova ou alterada (e ajuda no desempenho).
- **Ficha de atendimento:** completa para todo o time (inclusive contato do morador) e todos podem fazer observação; finalizar e mesclar fichas só Atendimento, Comunicação, Gestão e Administrativo.
- **Revisão a cada duas entregas:** depois de duas entregas, auditar as duas (correção, funcionamento, desempenho) antes de seguir.
- Não gerar coisa demais de uma vez; uma entrega por bloco, com testes e prévia.
