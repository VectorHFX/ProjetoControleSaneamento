# CPT — Controle de Saneamento (Consórcio Performance Tamanduateí)

Aplicação central do time Socioambiental, Comunicação, Atendimento, Comercialização, Gestão e Administrativo. Ela é feita só com ferramentas Google: Apps Script, Sheets, Forms e Drive.

**Comece por aqui:**
1. [`docs/DIAGNOSTICO.md`](docs/DIAGNOSTICO.md): o que existe, o que está quebrado e por quê.
2. [`docs/PLANO_DE_RECOMECO.md`](docs/PLANO_DE_RECOMECO.md): arquitetura alvo, estrutura do Drive, fases e decisões pendentes.
3. [`docs/GUIA_DE_IMPLANTACAO.md`](docs/GUIA_DE_IMPLANTACAO.md): **passo a passo para colocar a versão no ar.**
4. [`docs/AUDITORIA.md`](docs/AUDITORIA.md): velocidade, correções e pendências técnicas priorizadas.
5. [`docs/ATUALIZACAO_AUTOMATICA.md`](docs/ATUALIZACAO_AUTOMATICA.md): **atualizar os projetos direto do GitHub, sem copiar e colar.**
6. [`docs/ANATOMIA_DO_RELATORIO.md`](docs/ANATOMIA_DO_RELATORIO.md): estrutura do relatório mensal elogiado (base para o gerador).
7. [`docs/LIMPEZA_E_BACKUP.md`](docs/LIMPEZA_E_BACKUP.md): o que arquivar, o que manter e como fazer backup antes de apagar.
8. [`docs/VISOES_POR_CARGO.md`](docs/VISOES_POR_CARGO.md): **o que cada cargo vê, a trava do período de testes e as pastas a compartilhar.**

## Estrutura

| Pasta | O que é | Instalar? |
|---|---|---|
| `app/` | **Aplicação CPT** (web app, versão 2.8.0). `src/` é o que vai para o Apps Script. `fontes/` é o JavaScript legível, compilado para `src/` por `testes/compilar.cjs`. | Sim, no projeto "CPT — Aplicação" |
| `campo40/` | **Procedimentos de Campo 4.0** (4.2.0): formulário → Base, abertura de casos com protocolo e ligação com o formulário de Execução da engenharia. `src/` é permanente; `migracao_executada/` já rodou e fica só para rastreio. | Sim, no projeto do Campo 4.0 |
| `atualizador/` | **CPT • Atualizador**: projeto pequeno que traz o código do GitHub para a Aplicação e o Campo 4.0, com versão de segurança | Sim, uma vez (ver ATUALIZACAO_AUTOMATICA.md) |
| `docs/` | Diagnóstico, plano, guia de implantação e, em `referencia/`, os requisitos originais e os modelos oficiais (Orientador, relato ilustrado, layout da ficha). | — |
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
node app/testes/cronograma.cjs        # acesso, perfis, agenda, observações (serviços Google simulados)
node app/testes/entregas.cjs          # preparação de relatos
node app/testes/obras_relatorio.cjs    # obras, fechamento, relatório, cache, ciclo do caso e ficha oficial
node app/testes/inventario.cjs        # inventário do Drive (não move nada)
node app/testes/socioambiental.cjs    # mesa do relatório, relato e diagnóstico
node app/testes/gestao.cjs            # Programa Parceiros, painel da gestão, auditoria, conectores e trava
node app/testes/comunicacao.cjs       # recados, contatos, lembretes, materiais, "Hoje" e galeria
node atualizador/testes/atualizador.cjs # atualização a partir do GitHub (simulada)
bash atualizador/testes/cloudshell.sh  # atualização pelo Cloud Shell (clasp simulado)
node campo40/testes/processamento.cjs # vigência de obras/bairros e retomada de envios
node campo40/testes/abertura.cjs      # ficha do formulário vira caso com protocolo
node campo40/testes/execucao.cjs      # retorno da engenharia, lista de protocolos, avisos e corte do Controle antigo
# Interface (precisa de Playwright e Chromium):
python3 app/testes/gerar_previa.py && node app/testes/acesso_ui.cjs && node app/testes/modulos_ui.cjs && node app/testes/inicio_ui.cjs && node app/testes/atendimentos_ui.cjs && node app/testes/socioambiental_ui.cjs && node app/testes/visoes_ui.cjs && node app/testes/comunicacao_ui.cjs
```
Ao editar `app/fontes/*.html`, recompile para `app/src/` com `node app/testes/compilar.cjs` (requer Babel; veja o cabeçalho do arquivo).
Teste local não substitui a validação com uma colaboradora real no Google.
