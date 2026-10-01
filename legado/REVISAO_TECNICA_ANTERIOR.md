# Revisão dos códigos CPT

**Data:** 14/09/2026  
**Objetivo:** estabilizar o conjunto atual, reduzir a navegação e preparar uma entrega coordenada dos códigos finais.  
**Natureza desta entrega:** revisão técnica. Nenhum código em produção, dado, aba, gatilho, documento ou permissão foi alterado.

## 1. Conclusão para decisão

O sistema tem recursos suficientes para a operação. A prioridade agora é consolidar a forma de atualizá-los e acessá-los. Há trabalho repetido, menus antigos convivendo com o menu novo e rotinas que interferem na organização das abas.

A recomendação é aproveitar os módulos existentes, manter uma fonte definida para cada informação e fazer uma rodada coordenada de correções. Não há justificativa, nesta revisão, para reiniciar o Forms, apagar a base histórica ou reunir todos os códigos em um arquivo gigante.

Três distinções orientam a revisão:

- **Menús superiores:** podem ser concentrados em um menu principal por planilha.
- **Abas visíveis:** devem representar o trabalho diário; bases e registros técnicos podem continuar ocultos.
- **Arquivos `.gs`:** devem ter nomes e responsabilidades claros. A redução de leituras e reconstruções repetidas é mais relevante para desempenho do que apenas juntar arquivos.

## 2. Material efetivamente examinado

Foram recuperados os **13 anexos mais recentes**, totalizando **21.301 linhas**. O exame cobriu estrutura, funções de entrada, integração, instaladores, gatilhos, operações sobre abas, carregamento das janelas e fluxos de fila. Não equivale a testar cada regra de negócio no Google.

| Ref. | Anexo recebido | Módulo identificado | Projeto de destino |
|---|---|---|---|
| F01 | Código colado(20260914-185755).js | Painel Territorial 1.2 | Procedimentos |
| F02 | Código colado (2)(5).js | Relatos de Atividade | Procedimentos |
| F03 | Texto colado (3)(4).txt | Central de Atendimentos 4.6.0 | Procedimentos |
| F04 | Código colado (4)(2).js | Diagnósticos de Área e menu PROCEDIMENTOS | Procedimentos |
| F05 | Código colado (5)(2).js | Sincronização RDAS 1.5 | Procedimentos |
| F06 | Código colado (6).js | Relatório Mensal 2.0.0 | Procedimentos |
| F07 | Texto colado (7)(1).txt | Pesquisa de Satisfação e Programa Parceiros | Procedimentos |
| F08 | Código colado (8)(1).js | Integração 1.0, 2.0 e 3.0 | Procedimentos |
| F09 | Texto colado (9).txt | Gestão 2.2.1 | Gestão |
| F10 | Texto colado (10).txt | Fichas Oficiais SABESP 2.9.0 | Controle de Atendimentos |
| F11 | Texto colado (11)(1).txt | Painel de Trabalho e Cadastro de Histórico | Controle de Atendimentos |
| F12 | Texto colado (12).txt | Painel Executivo de Execução 1.0.0 | Execução de Atendimentos |
| F13 | Texto colado (13).txt | Visualizador RDAS e Banco de Imagens 1.2 | RDAS |

**Cobertura complementar:** foi consultado o Gerador Territorial 1.0.1, recebido anteriormente em `Código colado (5)(1).js`. Não foi tratado como confirmação da versão hoje instalada.

**Limites do conjunto:** o lote atual não contém o Gerador Territorial, o módulo completo de Relatos Sociais, os módulos de Cautelares, Matriz de Contatos e Indicadores dos Anexos, nem os manifestos `appsscript.json`. Alguns desses materiais existem em versões anteriores, mas precisam ser confirmados antes de uma substituição final do projeto completo. A mensagem trouxe o código do auditor, sem um inventário atual dos gatilhos instalados.

## 3. Achados prioritários

### A. A integração não encaminha todas as atualizações esperadas

**Evidência:** em F08, `atualizarProdutosAposIntegracao_()` chama somente `atualizarRelatosDeAtividade()` e `atualizarDiagnosticosDeArea()`.

Ao mesmo tempo:

- F07 deixa de instalar o envio próprio da satisfação quando encontra a função de integração.
- F03 também deixa de instalar o envio local próprio da Central nessa condição. A Central ainda conta com atualização agendada e gatilhos externos.
- F02 deixa de instalar o envio próprio dos relatos; porém a chamada à geração social está em `aoEnviarFormularioRelatos()`, não no atual encaminhamento da integração.

**Consequência:** existe uma lacuna no caminho automático. Instalação concluída não garante que cada produto foi conectado ao envio. Gatilhos antigos eventualmente instalados podem mascarar o problema.

**Correção recomendada:** um encaminhamento explícito por procedimento. Primeiro atualizar a fonte, depois chamar os produtos afetados e registrar tarefas de geração de documentos. O instalador deve conferir o gatilho e a ligação real, não apenas a existência de uma função.

**Verificação:** simulações locais confirmaram que a integração chama apenas os dois produtos e que os instaladores de Relatos e Satisfação omitem seus envios próprios nessa condição.

### B. O relatório mensal reconstrói todos os meses a cada cinco minutos

**Evidência:** F06 instala `sincronizarRelatorioMensalAgendado()` com `everyMinutes(5)`. Essa rotina chama `atualizarRelatoriosMensaisSocioambientais()`, percorre todos os meses e reconstrói cada aba, inclusive layout. Existe também gatilho de envio.

**Consequência:** o sistema repete trabalho mesmo sem novos dados. O código usa `clear()` na preparação da aba; ajustes manuais nessas saídas não constituem uma fonte preservada.

**Correção recomendada:** atualizar apenas meses alterados; manter reconstrução integral como manutenção. A rotina deve considerar também uma correção que transfira o registro de um mês para outro. Separar atualização de valores da reconstrução visual.

**Limite:** não foram medidos segundos de execução no Google. O trabalho repetido é confirmado pela sequência de chamadas.

### C. O RDAS é reconstruído mesmo para um envio que não seja relato

**Evidência:** F05 recebe qualquer envio e tenta localizar um relato pela linha. Se não encontra, mantém o dia mais recente como destino e o reconstrói.

**Consequência:** uma pesquisa ou outro procedimento pode provocar trabalho com fichas e fotografias sem alteração do RDAS.

**Correção recomendada:** validar a origem e o tipo do procedimento antes de gerar. Se nenhum relato foi afetado, concluir sem reconstrução. Reprocessamentos históricos devem continuar explícitos.

**Verificação:** simulação com uma linha sem relato correspondente confirmou a reconstrução do último dia.

### D. Algumas abas reaparecem por decisão do código

**Evidência:** F07, `prepararAbaPesquisa_()`, chama `showSheet()` sem considerar a visibilidade anterior. F03 pode exibir temporariamente Correções da Ficha Final durante a preparação e ocultá-la na organização final. F04 reúne apenas parte da navegação em PROCEDIMENTOS; outros arquivos mantêm seus menus independentes.

**Consequência:** ocultar manualmente uma aba pode não ser suficiente; os acessos também continuam espalhados.

**Correção recomendada:** uma política central de visibilidade por planilha, preservada nas atualizações. Exibir uma aba técnica apenas mediante uma ação explícita de consulta ou manutenção.

**Verificação:** a reexibição da Pesquisa de Satisfação foi reproduzida em simulação.

### E. Gestão e Banco de Imagens carregam dados antes de mostrar a janela

**Evidência:** F09, `pgAbrirVisaoGestao_()`, executa `obterDadosPainelExecutivo()` antes de `showModalDialog()`. F13 faz o mesmo no visualizador e no banco; o banco lê os dias do mês selecionado para montar o catálogo.

**Consequência:** o usuário aguarda sem ver a interface. O tempo aumenta conforme o volume consultado.

**Correção recomendada:** mostrar a estrutura da janela imediatamente, com estado de carregamento, e buscar primeiro a visão inicial. Carregar detalhes, fotografias e períodos adicionais sob demanda. Aproveitar dados já obtidos durante a mesma consulta.

F01, F11 e F12 já abrem a estrutura da janela antes do carregamento principal; esse comportamento deve ser preservado.

**Verificação:** a ordem “dados → janela” foi confirmada por simulações da Gestão e do Banco RDAS.

### F. Cada miniatura territorial provoca uma nova leitura da base

**Evidência:** F01, `carregarFotoTerritorial()`, chama `cptDtLer_()` para cada imagem. Essa leitura percorre a Base Consolidada.

**Correção recomendada:** reduzir releituras usando um índice temporário dos arquivos vinculados ao diagnóstico, com validade curta e escopo adequado ao usuário. Manter a conferência de vínculo e as permissões do Drive. Ao salvar ou gerar documentos, validar novamente a versão da fonte.

A orientação de reduzir chamadas a serviços, agrupar leituras/escritas e usar cache é consistente com as [boas práticas do Google Apps Script](https://developers.google.com/apps-script/guides/support/best-practices). Não foi estimado um percentual de ganho sem medição real.

### G. Um pedido esperando a Central segura os pedidos seguintes

**Evidência:** F11, `painelProcessarFila()`, escolhe o primeiro pedido não concluído e retorna se ele estiver em `AGUARDANDO CENTRAL`. Não procura depois outro pedido independente que já possa ser processado.

**Consequência:** um caso demorado pode atrasar ações de outras fichas.

**Correção recomendada:** selecionar o próximo pedido executável, mantendo ordem e exclusão de concorrência por ficha. Processar um lote limitado pelo tempo disponível. Não permitir que duas alterações conflitantes na mesma ficha sejam executadas juntas.

**Verificação:** uma fila com primeiro pedido aguardando e segundo recebido deixou o segundo sem processamento na simulação.

### H. A fila pode avançar sem confirmação de que a Central terminou

**Evidência:** F03, `sincronizarCentralAtendimentos(true)`, pode retornar sem executar quando não consegue a trava. `processarSolicitacoesPainelAtendimento()` chama essa função e, para pedidos como atualização ou encerramento, avança para `CENTRAL ATUALIZADA` se não houver exceção. O retorno não distingue “ocupado” de “concluído”. Correções possuem uma conferência adicional, mas ela não resolve todos os tipos de pedido.

**Correção recomendada:** retornar resultado explícito, com estado e identificação da atualização. Somente avançar a fila após confirmação da conclusão. Um resultado “ocupado” deve manter o pedido pendente.

**Verificação:** a ponte avançou com retorno vazio em simulação; o caminho real de saída silenciosa foi identificado no código. Isso confirma o risco lógico, não uma ocorrência comprovada nos seus registros.

## 4. Organização recomendada das abas

A primeira redução deve acontecer nas **abas visíveis**. Exclusão exige verificar a função da aba e o conteúdo existente.

### Procedimentos de Campo

| Aba ou grupo | Tratamento recomendado | Motivo |
|---|---|---|
| Relatos de Atividade | Manter visível | Consulta principal das ações e acesso ao fluxo social. |
| Programa Parceiros | Manter visível | Indicadores e acompanhamento do programa. |
| BI Satisfação | Manter visível | Exploração mensal; pode futuramente ser reunida à navegação do programa. |
| Relatório do mês em uso | Manter visível | Produção mensal. Meses anteriores acessíveis por menu. |
| Diagnósticos de Área | Manter acessível enquanto houver complementos manuais | A tabela preserva PV, método, extensão, condição do pavimento e impacto final. Não é apenas uma cópia descartável. |
| Ficha do Diagnóstico | Ocultar quando fora de uso; abrir pelo menu | Saída de consulta gerada pelo sistema. |
| Pesquisa de Satisfação | Candidata a ficar oculta após corrigir `showSheet()` | A base detalhada continua necessária para conferências; BI e Parceiros podem ser os acessos usuais. |
| Atendimentos, na planilha Procedimentos | Candidata a ficar oculta | É um resumo; a operação ocorre no Controle de Atendimentos. Preservar acesso pelo menu. |
| Respostas ao formulário e Base Consolidada | Preservar; acesso técnico restrito à operação responsável | Fontes essenciais e integração. |
| Importação Bruta 1.0, Importação Histórica 1.0 e 2.0 | Preservar ocultas | A integração ainda lê essas fontes. Apagar uma delas pode retirar registros da próxima consolidação. |
| Auditorias e resumos de importação | Manter ocultos | Conferência e rastreabilidade; não precisam ocupar a navegação diária. |
| CPT Análises Territoriais | Preservar oculta | Guarda texto e notas da gestão por revisão. |
| CPT Documentos Territoriais e CPT Relatos Sociais | Preservar ocultas, conforme os módulos anteriores | Histórico das entregas, versões e controle de geração. Confirmar os módulos atuais antes da consolidação final. |
| Cautelares e Matriz de Contatos | Definir após revisão dos respectivos módulos atuais | Não estão no lote de 13 arquivos. |

**Alvo inicial:** quatro ou cinco abas usuais em Procedimentos, mais os acessos de Cautelares/Matriz que a operação realmente precisar. É uma proposta de navegação, não uma contagem já aplicada. Nenhuma nova aba de início é necessária para começar essa simplificação.

### Controle de Atendimentos

Manter as quatro telas já escolhidas: **Indicadores, Dashboard, Fichas Oficiais e Demandas do Atendimento**. O preenchimento principal permanece no Painel de Trabalho.

O código atual libera, em Demandas, a coluna **M** para marcar a tarefa e a coluna **O** para acompanhamento. Marcar uma tarefa não deve ser confundido com encerrar o atendimento.

| Aba | Conclusão desta revisão |
|---|---|
| Revisão de Migração | **Candidata a exclusão.** F10 tolera sua ausência e não a recria. A rotina a trata como demonstrativo legado. Conferir antes se não há anotações manuais exclusivas nem dependências em outros módulos instalados. |
| Finalizações pendentes | **Não excluir automaticamente.** F03/F10 toleram ausência, mas ainda leem vínculos e correções dessa aba. Antes de removê-la, conferir os registros, especialmente ID correto e confirmação de vínculo. A Auditoria Central registra exceções, mas isso não prova a migração dos vínculos manuais. |
| Correções da Ficha Final de Atendimento | **Preservar oculta.** A fila ainda grava e consulta correções ali. |
| Base de Atendimentos, Histórico e Base Fichas Oficiais | **Preservar ocultas.** Mantêm a operação e os documentos. |
| Base Encerrados Manuais | **Preservar oculta.** É a fonte dos históricos cadastrados, com revisões. |
| Solicitações do Painel | **Preservar oculta.** É uma fila ativa; apagá-la interrompe pedidos. |
| Configuração Fichas, logs e Auditoria Central | **Preservar ocultos.** Fazem parte da configuração e conferência. |
| Encerramento pelo Atendimento, Cadastrar encerrado e Encerrados cadastrados | Manter ocultas nesta etapa; avaliar aposentadoria após mapear todos os caminhos legados. |

### Demais planilhas

- **Execução:** Dashboard e Fichas Oficiais para consulta. Base Executiva, Rastreabilidade Executiva, Comunicação entre Áreas e Configuração do Painel permanecem técnicas. Ocultar não restringe acesso a dados; a separação de informações internas deve continuar no código e nas permissões.
- **Gestão:** preservar as seis abas acordadas. A área de notas `Início!B26:M45` é dado manual e precisa continuar sendo preservada.
- **RDAS:** preservar as fichas diárias nativas e a galeria. A redução de abas em Procedimentos não exige retirar essas fichas nem alterar seu layout.

## 5. Gatilhos e quantidade de arquivos

### O que consolidar

1. Um responsável pela criação do menu principal em cada projeto. Os criadores antigos passam a contribuir com submenus.
2. Uma entrada bem definida para envios de Procedimentos, com encaminhamento por tipo.
3. Os dois envios externos de Atendimento permanecem identificados por planilha: Execução e Pesquisa final são fontes distintas.
4. Agendamentos de manutenção agrupados quando tiverem escopo, permissões e duração compatíveis.
5. Filas com finalidade documentada, execução limitada e tratamento de falhas por pedido.

Os menus que apenas montam a interface são candidatos a um `onOpen(e)` simples, depois de conferir conflitos e dependências. Isso não se aplica automaticamente a rotinas que leem Drive, geram documentos ou acessam outras planilhas.

### O que não remover apenas pela aparência

- Dois gatilhos com o mesmo nome podem apontar para planilhas diferentes. O instalador da Central realmente cria esse par.
- O gatilho de um minuto da Gestão tem uma condição que evita reconstrução a cada minuto: atende pedidos e atualiza normalmente a cada 15 minutos. Não é equivalente ao relatório mensal, que reconstrói tudo a cada cinco minutos.
- As filas de Atendimento estão em projetos diferentes e participam da escrita nas abas protegidas. Retirar um gatilho sem redesenhar essa passagem pode impedir o trabalho das atendentes.
- Uma conta não inventaria automaticamente os gatilhos instalados por outras contas. Os gatilhos instaláveis executam com a autorização de quem os criou. [Referência Google](https://developers.google.com/apps-script/guides/triggers/installable).

**Não há contagem final de gatilhos validada nesta etapa:** faltam o inventário atual com planilha de origem e a confirmação dos módulos fora do lote. A quantidade de chamadas `newTrigger()` no código não é a quantidade instalada.

### Organização dos arquivos finais

Manter módulos por responsabilidade, com nome legível e projeto de destino. Centralizar instaladores, navegação e funções realmente compartilhadas dentro do projeto apropriado. Remover versões antigas apenas quando não houver referências, menus ou gatilhos apontando para suas funções. A próxima entrega deve trazer uma tabela única: **projeto → arquivo atual → arquivo final → função de instalação**.

## 6. Apresentações de diagnóstico por colegas

A revisão do **Gerador Territorial 1.0.1 anteriormente fornecido** permite restringir a investigação:

- O caminho de slides usa `SlidesApp.create()`, depois `file.moveTo(folder)` e grava o histórico em `CPT Documentos Territoriais`.
- A leitura e a cópia do modelo SABESP acontecem no caminho da ficha. A geração de slides não usa esse modelo diretamente. Já o instalador do gerador verifica o modelo para ambos os usos.
- Falhas de imagens são capturadas na renderização e geram avisos. Nessa versão, falta de acesso a uma fotografia não é, isoladamente, a explicação principal para impedir toda a apresentação.
- O diagnóstico do instalador usa `getName()` da pasta. Isso confirma leitura, mas não confirma a capacidade de colocar arquivos nela.
- A geração mantém uma trava de documento durante a criação. Uma execução concorrente pode impedir o início após a espera prevista; isso também deve aparecer na mensagem de erro.

**Ordem de investigação recomendada:** mensagem exata do colega → autorização de Slides/Drive → permissão de adicionar arquivos na pasta → permissão de escrita no histórico → concorrência → versão instalada.

A execução manual depende das autorizações do usuário, conforme a [documentação de autorização](https://developers.google.com/apps-script/guides/services/authorization). Mover o arquivo envolve permissões adicionais na pasta de destino, conforme a [referência de `File.moveTo`](https://developers.google.com/apps-script/reference/drive/file#movetodestination).

**Causa ainda não confirmada:** falta o erro da execução de um colega e a confirmação da versão instalada. Não há recomendação de tornar pastas públicas ou transferir silenciosamente a geração para a sua conta. A versão final deve informar a etapa que falhou com uma mensagem clara.

## 7. Verificações realizadas e limites

- Sintaxe JavaScript verificada nos 13 arquivos e nos cinco agrupamentos de projeto. Todos passaram no parser local.
- Dez verificações adicionais, com serviços Google simulados, confirmaram os caminhos descritos: encaminhamento da integração; instalação dos gatilhos de Relatos/Satisfação; reexibição da aba; atualização desnecessária do RDAS; carregamento antes da abertura das janelas; bloqueio da fila; avanço sem confirmação; tolerância à ausência de abas legadas.
- As simulações reproduzem decisões de código. Não medem latência, não validam permissões reais e não representam aprovação de todas as regras de negócio.
- Não foram usados dados inventados no sistema, feitas mudanças no Forms ou executadas rotinas de exclusão.
- Não foram alteradas fichas SABESP, layouts RDAS, fotografias, observações da gestão ou estados dos atendimentos.

## 8. Sequência para chegar aos códigos finais

1. **Fechar o inventário:** confirmar módulos fora do lote, manifestos e gatilhos atuais com a planilha de origem. Manter os 13 arquivos recuperados como referência desta revisão.
2. **Corrigir o fluxo:** completar o encaminhamento por procedimento e a confirmação das filas. Garantir que correções, encerramentos e documentos só avancem após sucesso real.
3. **Simplificar a navegação:** um menu principal, visibilidade estável das abas e manutenção técnica separada dos acessos da equipe.
4. **Otimizar consultas e geração:** janelas com carregamento progressivo, menos releituras, imagens sob demanda e atualização apenas dos dias/meses afetados.
5. **Validar a entrega coordenada:** comparar registros, protocolos, revisões manuais e saídas antes/depois; testar com uma conta editora; confirmar que repetir a instalação não multiplica gatilhos nem altera dados.

**Como usar esta revisão:** não exige instalação. Ela define as correções e a organização a aplicar na próxima entrega. O pacote final deve substituir arquivos identificados, com passo a passo no corpo da resposta, sem exigir uma sequência de remendos avulsos.
