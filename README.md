# CPT — Controle de Saneamento (Consórcio Performance Tamanduateí)

Aplicação central do time Socioambiental, Comunicação, Atendimento, Comercialização, Gestão e Administrativo. Ela é feita só com ferramentas Google: Apps Script, Sheets, Forms e Drive.

**Comece por aqui:**
1. [`docs/DIAGNOSTICO.md`](docs/DIAGNOSTICO.md): o que existe, o que está quebrado e por quê.
2. [`docs/PLANO_DE_RECOMECO.md`](docs/PLANO_DE_RECOMECO.md): arquitetura alvo, estrutura do Drive, fases e decisões pendentes.

## Estrutura

| Pasta | O que é | Instalar? |
|---|---|---|
| `app/` | **Aplicação CPT** (web app, versão 1.5.0). `src/` é o que vai para o Apps Script. `fontes/` é o JavaScript legível, compilado para `src/` por `testes/compilar.cjs`. | Sim, no projeto "CPT — Aplicação" |
| `campo40/` | **Procedimentos de Campo 4.0**: formulário → Base. `src/` é permanente; `migracao_executada/` já rodou e fica só para rastreio. | Sim, no projeto do Campo 4.0 |
| `docs/` | Diagnóstico, plano e, em `referencia/`, os requisitos originais. | — |
| `legado/` | Código de projetos anteriores, **só para consulta**. | **Não** |

## Regras de ouro

- **Um lugar para cada dado.** Se a informação existe na Base, não se cria uma planilha paralela.
- **A equipe entra pela aplicação**, não pelas planilhas.
- **Nada do `legado/` é instalado.** Ele serve para copiar regras e funções para a app.
- **Nenhum dado pessoal no Git** (nomes, endereços, telefones de munícipes, RG/CPF).
- Os IDs de planilhas ficam na configuração (Script Properties), não espalhados pelo código.
- Toda mudança entra por commit, com mensagem clara. A versão publicada no Google precisa ser a mesma da `main`.

## Testes locais (Node 18+)

```bash
node app/testes/cronograma.cjs   # agenda, perfis, conflitos (serviços Google simulados)
node app/testes/entregas.cjs     # preparação de relatos
```
Teste local não substitui a validação com uma colaboradora real no Google.
