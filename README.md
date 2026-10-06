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
| `app/` | **Aplicação CPT** (web app, versão 2.32.1). `src/` é o que vai para o Apps Script. `fontes/` é o JavaScript legível, compilado para `src/` por `testes/compilar.cjs`. | Sim, no projeto "CPT — Aplicação" |
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

Um comando roda tudo (servidor, atualizador, Campo 4.0 e telas) e mostra um resumo:

```bash
bash app/testes/rodar_tudo.sh          # tudo
bash app/testes/rodar_tudo.sh rapido   # sem as telas (não precisa de navegador)
```

Os testes de tela usam o Chromium em `/tmp/cpt-chromium` e a prévia gerada por `app/testes/gerar_previa.py`. Para rodar um só: `node app/testes/<nome>.cjs`. O teste do mapa usa o Leaflet real se ele estiver em `/tmp/cpt-leaflet` (`npm pack leaflet@1.9.4` e copie `dist/leaflet.js` e `dist/leaflet.css`); sem ele, testa só a lista.

Ao editar `app/fontes/*.html`, recompile para `app/src/` com `node app/testes/compilar.cjs` (requer Babel; veja o cabeçalho do arquivo).

### Como criar, mudar ou tirar uma página da aplicação

Tudo sai do registro **`ROTAS`**, em `app/fontes/Interacoes.html`. Cada página tem:

- título, ícone e grupo do menu;
- quem acessa (`acesso`) e em que telas de cargo aparece (`visoes`);
- o que fazer ao abrir, no botão Atualizar e ao trocar o mês.

O menu lateral, os títulos, as permissões da tela, a barra do celular e a busca se ajustam sozinhos. O servidor continua conferindo as permissões de cada ação.
