# Diagnóstico do projeto CPT — 01/10/2026

Análise feita sobre o pacote `CPT_Trabalho_Completo_2026_10_01.zip`. Nada foi conferido no Google em si (planilhas vivas, gatilhos instalados, implantação publicada); o que está abaixo vem só do código e da documentação do pacote.

## 1. O que eu entendi

**Contexto.** Consórcio Performance Tamanduateí (Concrejato + Veolia/Seureca, cliente final Sabesp), obras de coleta e afastamento de esgoto em Santo André. O time (Social, Comunicação, Atendimento, Comercial, Gestão, Administrativo) precisa produzir todo mês: **relatório Socioambiental e de Comunicação, anexos do relatório, Programa Parceiros, fichas de atendimento oficiais e o RDAS**.

**Como está hoje.** São **cerca de 9 projetos Apps Script diferentes**, todos ligados a planilhas, criados em ondas sucessivas:

| Projeto | Papel | Situação |
|---|---|---|
| **Aplicação CPT 1.5** (`app/`) | Web app único: visão do mês, registros, atendimentos (consulta), cronograma, preparação de relatos, equipe | Núcleo novo. Não confirmado como publicado. Colaboradores não entram. |
| **Procedimentos de Campo 4.0** (`campo40/`) | Formulário (150 perguntas/23 seções) → base `Registros`/`Atendimentos`/`Movimentações`, catálogos de Obras/Bairros | Núcleo novo, código bom. Migração já executada. |
| Procedimentos 3.0 / Central de Atendimentos 4.9 | Formulário antigo + central de atendimentos | Legado, ainda operacional para atendimentos |
| Controle de Atendimentos (Fichas 3.2.1, Painel 3.5.1, Comunicação 4.0.2) | Fichas oficiais, mesclagem, mensagem diária | Legado, **é hoje a fonte oficial dos casos** |
| Execução de Atendimentos (Painel Executivo 1.5.1) | Painel gerencial de atendimentos | Legado |
| RDAS (Visualizador 1.2 + Sincronização 1.5) | Planilha RDAS + banco de imagens | Legado, **não alimentado pelo Campo 4.0** |
| Central CPT 4.0 | Socioambiental/Comunicação anterior | Legado |
| Gestão 3.2 | Programa Parceiros, anexos, diagnósticos | Legado |
| Administrador/Cleber | Caderno, checklist, mascote | Legado — **não veio no zip** |

O diagnóstico central: **o mesmo dado mora em vários lugares, sincronizado por gatilhos entre planilhas**, e cada pessoa precisa saber qual planilha/painel abrir. É isso que fez o time se perder.

## 2. Problemas encontrados

### Críticos (resolver antes de qualquer funcionalidade nova)

**C1. Modelo de acesso da aplicação — causa provável do "acesso negado".**
- A app executa como *"usuário que acessa"* (`app/src/AplicacaoCPT.gs:5-15`). Isso obriga **cada colaborador a ter acesso direto à planilha Base inteira** (com dados de munícipes) e a autorizar escopos amplos (Drive inteiro) com a própria conta.
- O código tem e-mails de **três domínios** (`@concrejato.com.br`, `@veolia.com`, `@cptamanduatei.com.br`). Se a colaboradora usa uma conta de domínio diferente do dono do script, a política do Google Workspace da empresa dela pode **bloquear o script antes mesmo do HTML carregar**. Nesse caso, nenhuma correção dentro do código aparece para ela.
- `AplicacaoCPT.contexto()` (`app/src/AplicacaoCPT.gs:16-23`) abre a Base **antes** de devolver o perfil. Se a leitura falha, o perfil nunca chega.
- O seletor "Minha visão" nasce com uma única opção **"Administrador"** (`app/src/Aplicacao.html:49`) e só é trocado se `carregarInicioCPT` der certo (`app/src/Interacoes.html:383`). Por isso a colaboradora **vê "Administrador" + erro**. É um rótulo provisório, não um privilégio.

**C2. Gatilhos demais, rodando o tempo todo.** No legado há pelo menos **3 gatilhos a cada 1 minuto** (`processarSolicitacoesPainelAtendimento`, `painelProcessarFila`, `pgAtualizarAutomaticamente`) e **5 a cada 15 minutos**, além dos `onFormSubmit`/`onEdit`. Se todos estiverem instalados, isso dá mais de 4.700 execuções por dia em contas pessoais, filas trocadas entre planilhas de projetos diferentes, risco de estourar a cota diária do Apps Script e falhas silenciosas. Isso explica boa parte da sensação de "saiu do controle".

**C3. Duas fontes de verdade para atendimentos.** O Controle de Atendimentos (legado) continua sendo onde os casos são alterados. A Base 4.0 tem uma **cópia importada** (33 protocolos), que fica desatualizada. Além disso, o formulário 4.0 **não tem a pergunta de protocolo**, então envios de atendimento não se ligam automaticamente a uma ficha.

**C4. Dados pessoais dentro do código.** `Painel_Gestao_3_2` e `Fichas_Oficiais_3_2_1` tinham embutidos **~38 nomes e endereços de munícipes**, e o texto do relatório de agosto tinha **RG de colaboradores**. Eu redigi os dois trechos no repositório e deixei o relatório de fora (veja a seção 4). Hoje a Base também é compartilhada diretamente com quem usa a app (veja C1).

**C5. A regra "obras e bairros padronizados só a partir de 01/10/2026" começa hoje e não está implementada.** Hoje o processamento aplica o catálogo a qualquer data.

### Altos

| # | Problema | Onde |
|---|---|---|
| A1 | Uma resposta editada no Forms **trava a retomada manual inteira**. `receber` lança erro, e `retomar` processa as falhas antigas primeiro e relança o erro, então nenhum envio posterior é recuperado até alguém intervir. Não existe retomada automática: falhas do gatilho só são reprocessadas se alguém rodar a função. | `campo40/src/ProcessamentoDosEnvios.gs:188, 245, 253` |
| A2 | Perfis **e o histórico de cada alteração** ficam em Script Properties (limite de 500 KB no total). O histórico cresce sem parar (`CPT_PESSOA_HIST:*`). | `app/src/CronogramaCPT.gs:9` |
| A3 | Dependência de uma pessoa só: o administrador é um único e-mail, o nome "Victor Xavier" está fixo no código, e todos os scripts e gatilhos estão na conta do Victor. Se a conta mudar, tudo para. | `app/src/CronogramaCPT.gs:5`, `AplicacaoCPT.gs:35` |
| A4 | A consulta de atendimentos é restrita a Atendimento/Gestão, mas o requisito diz que **todos** consultam e comentam. | `app/src/AplicacaoCPT.gs:64-65`, `DadosDaAplicacao.gs:18` |
| A5 | Agenda e Entregas releem **todas as revisões** a cada abertura. A Visão do mês lê a aba `Registros` inteira, e cada detalhe lê a coluna de IDs inteira. Vai ficar lento com o volume. | `CronogramaCPT.gs:17`, `EntregasCPT.gs:17`, `DadosDaAplicacao.gs:42,74` |
| A6 | IDs de planilhas fixos no código: cerca de 15 IDs diferentes, espalhados em mais de 10 arquivos. Trocar uma planilha quebra vários projetos sem aviso. | todo o `legado/` |

### Médios

- **Pacote incompleto:** as pastas `07_Administrador_Cleber_legado` (12 arquivos) e `90_Arquivo_historico` (621 arquivos) estão no inventário, mas **não vieram no zip**.
- **Duplicatas:** 6 pares de arquivos idênticos e 20 arquivos "Texto colado (n)" sem nome que diga o que são.
- **Duas cópias do HTML** (`fontes_edicao` × `codigo`): é fácil editar a errada. O script de compilação apontava para uma pasta `fontes` inexistente e os testes de navegador dependem de caminhos em `/tmp`. Os caminhos foram corrigidos no repositório.
- **O manifesto da app (`appsscript.json`) não está versionado**, então a configuração de implantação (executar como / quem acessa) é desconhecida.
- A lateral mostra **"CPT 4.0"** numa app 1.5. A versão está repetida em 6 lugares.
- A classe `PerfisCPT` está dentro de `CronogramaCPT.gs` (nome de arquivo enganoso).
- O legado tem **49 operações destrutivas** (`setTrashed`, `deleteSheet`, `clear`). **Nunca reexecutar instaladores antigos.**

### O que está bom e vale manter

- **Campo 4.0**: idempotente por ID, trava de concorrência, histórico preservado, catálogos com IDs estáveis (`OBR-xxxx`) e sem aproximação por nome. É a melhor parte do projeto.
- **App 1.5**: validação no servidor, conflito de versão, operação idempotente, histórico de revisões. Os testes de servidor (`app/testes/cronograma.cjs`, `entregas.cjs`) passam.
- Os documentos de requisitos e pendências estão muito bem escritos (`docs/referencia/`).

## 3. Recomendação: recomeçar a organização, não o código bom

Recomeçar **do zero o código** jogaria fora o Campo 4.0 (formulário validado, dados migrados) e as regras da app, que estão corretas. O problema não está nesses dois. Está em **quantos lugares existem**. A proposta está em [`PLANO_DE_RECOMECO.md`](PLANO_DE_RECOMECO.md):

1. **Uma aplicação, uma base.** Tudo que é trabalho do dia acontece na app.
2. **Arquivos de apoio só onde há rastreio ou entrega oficial**: RDAS, Pesquisa de satisfação, Fichas oficiais (PDF), Anexos/Programa Parceiros, planilha da cliente.
3. **Congelar o legado** (somente leitura) e desligar os gatilhos à medida que cada função for absorvida.

## 4. O que foi feito neste repositório

- Reorganizado em `app/`, `campo40/`, `docs/` e `legado/`, sem duplicatas e com nomes legíveis.
- **Redigidos dados pessoais** em `legado/gestao/Painel_Gestao_3_2_Completo.gs` (`PG32_AJUSTES.added`) e `legado/atendimentos/02_Fichas_Oficiais_3_2_1.gs` (`FO321_HISTORICO_AGOSTO`). Essas restaurações já foram executadas no Google; o original continua no zip.
- **Não incluído**: o texto do relatório de agosto/2026 (tem RG de colaboradores) e as cópias duplicadas.
- Ajustados os caminhos de `app/testes/*` para a nova estrutura. Nenhuma lógica foi alterada.
