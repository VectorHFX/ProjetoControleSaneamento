# Plano de recomeço — CPT

Objetivo: **tudo que é trabalho do dia acontece na Aplicação**. Planilhas e arquivos fora dela existem só quando há **rastreio obrigatório** ou **entrega oficial**.

## 1. Arquitetura alvo

```
                ┌───────────────────────────────┐
  Equipe ──────▶│  CPT — Aplicação (1 link)     │  Apps Script web app
                └──────────────┬────────────────┘
                               │ única que lê/escreve
   Formulário de campo ──▶ ┌───▼──────────────┐
   (Campo 4.0)             │  CPT • Base      │  1 planilha, acesso restrito
   Pesquisa satisfação ──▶ │                  │
                           └───┬──────────────┘
                               │ gera / publica (sob comando, com versão)
   ┌──────────┬───────────────┼──────────────┬──────────────┐
   ▼          ▼               ▼              ▼              ▼
  RDAS    Fichas oficiais   Anexos +      Relatório     Planilha da
 (planilha)  (PDF/mês)   Prog. Parceiros   mensal        cliente
                         (modelos oficiais)              (recorte)
```

### O que fica DENTRO da aplicação (abas da Base, nunca abertas pela equipe)

| Aba | Conteúdo |
|---|---|
| `Respostas` | Vinculada ao formulário de campo (já existe) |
| `Registros` | Um por envio, com data de realização, obra ID e bairro ID (já existe) |
| `Atendimentos` + `Movimentações` | Casos e histórico (já existem; viram **fonte oficial** na Fase 3) |
| `Observações` | Comentários da equipe sobre casos, como eventos (nunca sobrescrevem) |
| `Obras` / `Bairros` | Catálogos com ID estável e vigência (já existem) |
| `Pessoas` | E-mail, nome, frente, papéis, ativo, versão (sai das Script Properties) |
| `Agenda` | Cronograma (traz a planilha de agenda separada para dentro da Base) |
| `Contatos`, `Recados`, `Links` | Fases seguintes |
| `Entregas` | Revisões editoriais dos relatos (já existe, na planilha da agenda) |
| `Log` | Quem fez o quê e quando (auditoria) |

### O que fica FORA (arquivos de apoio e rastreio)

| Arquivo | Por que existe | Quem edita |
|---|---|---|
| **RDAS** (planilha) | Exigência: visível para pessoas internas da organização | Só a app escreve; os demais leem |
| **Pesquisa de satisfação** (Forms + respostas) | Ficha de satisfação é evidência e tem meta de 15/semana e 60/mês | O Forms recebe; a app lê |
| **Fichas oficiais** (PDF por competência) | Documento oficial em formato fixo | A app gera a partir do modelo |
| **Anexos do relatório** e **Programa Parceiros** | Modelos oficiais da cliente | A app preenche após conferência; Indicadores 2026 não são alterados |
| **Planilha da cliente** | Consulta pela Concrejato: atendimentos, sistematização, balanço | Só a app publica, com recorte conferido |
| Fotos e vídeos | Evidências | Upload pelo Forms ou pela app; ficam no Drive, nunca dentro de células |

## 2. Estrutura do Drive

Uma pasta raiz compartilhada **CPT** (de preferência num Drive compartilhado da conta institucional):

```
CPT/
├── 00_Sistema/            ← só administração técnica (Base, Formulários, script)
├── 01_Entregas/
│   └── 2026-10/           ← uma pasta por competência
│       ├── 2026-10_Relatorio_Socioambiental_Comunicacao.docx
│       ├── 2026-10_Anexos.xlsx
│       ├── 2026-10_Programa_Parceiros.xlsx
│       └── Fichas/2026-10_Ficha_<protocolo>.pdf
├── 02_Rastreio/           ← RDAS, Pesquisa de satisfação (respostas)
├── 03_Midias/
│   ├── Relatos/AAAA-MM/   ← uploads do formulário
│   └── Extras/AAAA-MM/    ← Comunicação (separado do RDAS)
├── 04_Modelos_Oficiais/   ← somente leitura
├── 05_Cliente/            ← planilha publicada para a Concrejato
└── 99_Legado_Somente_Leitura/
```

**Padrão de nome:** `AAAA-MM_Tipo_Descricao`. Sem "Cópia de", sem "v2 final", sem "Texto colado (3)". A versão fica no histórico do arquivo, não no nome.

## 3. Acesso (resolve o bloqueio C1)

Recomendado:
- **Dono de tudo: uma conta institucional** (ex.: do domínio `cptamanduatei.com.br`), não a conta pessoal de ninguém.
- Implantação: **executar como o proprietário**, com acesso para **qualquer pessoa do domínio**.
- A app identifica quem está acessando pelo e-mail (`Session.getActiveUser()`) e **autoriza pelo cadastro em `Pessoas`**.
- A equipe **não recebe compartilhamento da Base**. Ela entra só pela app. Isso protege os dados de munícipes e acaba com o erro de permissão por planilha.

Isso exige que **toda a equipe use conta do mesmo domínio** do proprietário. Contas de outros domínios não informam o e-mail ao script nesse modo. Se não for possível, a alternativa é manter "executar como usuário", mas aí cada pessoa precisa ser leitora da Base, e esse é o problema atual.

Perfis: `administracao_tecnica` (só concede acessos e mexe na configuração), `administrativo` (todas as ferramentas de trabalho), `gestao`, `atendimento`, `socioambiental`, `comunicacao`, `comercializacao`.

## 4. Fases

| Fase | Entrega | Critério de pronto |
|---|---|---|
| **0. Congelar** (esta semana) | Lista de gatilhos instalados por projeto. Legado em somente leitura. Pasta Drive nova. Decisão sobre a conta proprietária. | Nenhuma planilha nova fora da estrutura. Ninguém instala código antigo. |
| **1. Acesso** ✅ código pronto (2.0.0) | Perfil carregado antes dos dados, sem "Administrador" provisório. Pessoas na Base. Novos perfis. Implantação nova. | Uma colaboradora real entra com o próprio papel. |
| **2. Campo 4.0 firme** ✅ código pronto (4.1.0); pergunta de protocolo é passo manual | Regra de obras desde 01/10/2026. Retomada que não trava em resposta editada. Retomada automática diária. Pergunta de protocolo no formulário. | Envios de outubro com obra ID. Zero falhas pendentes. |
| **3. Atendimentos na app** | Consulta e observações para todos. Edição, mesclagem e conclusão na app. Mensagem diária. **Corte do Controle de Atendimentos.** Gatilhos de 1 minuto desligados. | Uma fonte só de casos. |
| **4. RDAS e satisfação** | RDAS alimentado pela Base (incremental). Painel de metas 15/60. | RDAS de outubro sem cópia manual. |
| **5. Entregas mensais** 🟡 base do relatório e manifestações prontas (2.1); fichas em PDF, Anexos e Parceiros a seguir | Fichas em PDF, Anexos, Programa Parceiros e relatos preparados, por competência. | Pacote de outubro gerado pela app. |
| **6. Comum a todos** | Contatos, recados, links e materiais, galeria. | — |
| **7. Pessoal** | Caderno, checklist e mascote. | — |
| **8. Cliente** | Planilha publicada com recorte. | — |

**Regra de corte:** um projeto legado só é desligado quando a função dele está na app **e** foi usada de verdade por uma competência. Até lá ele fica em somente leitura, sem novos gatilhos.

## 5. Decisões que dependem do Victor

1. ~~Conta proprietária~~ → victor-henrique.xavier@veolia.com; toda a equipe usa @veolia.com (decidido em 01/10).
2. **Quando o Controle de Atendimentos deixa de ser oficial**: data de corte para a app virar a fonte única.
3. Quem mais, além do Victor, terá **administração técnica**, para o projeto não depender de uma pessoa só.
4. Se a pasta `07_Administrador_Cleber` e o `90_Arquivo_historico` precisam entrar no repositório (não vieram no zip).

## 6. Situação por ferramenta (atualizado em 01/10/2026)

| Ferramenta | Situação |
|---|---|
| Acesso por domínio, perfis (incl. Administrativo e Comercialização) | ✅ 2.0 |
| Consulta de atendimentos e observações para todos | ✅ 2.0 |
| Obras: cadastro, revisão diária, envio ao formulário | ✅ 2.1 |
| Fechamento do mês + base do relatório (Orientador, itens 1–13) + planilha de manifestações | ✅ 2.1 |
| Relato ilustrado (modelo `{{TITULO}}`…`{{FOTOS}}`) gerado a partir do relato preparado | Próximo |
| Ficha oficial em PDF no layout Sabesp + pacote mensal (ANEXO 4) | Próximo; depende da data de corte do Controle de Atendimentos |
| Edição oficial, mesclagem e conclusão de casos na aplicação | Próximo; mesma dependência |
| RDAS alimentado pelo Campo 4.0 | A fazer |
| Matriz de contatos (ANEXO 1), recados, links e materiais | A fazer |
| Diagnósticos de área (item 2) e Slides | A fazer |
| Programa Parceiros e Anexos oficiais | A fazer |
| Galeria, caderno, checklist e mascote | A fazer |
| Planilha da cliente | A fazer |
