# Atendimento 3.5 — aplicação da revisão

Pacote com **cinco módulos completos**, para substituir os correspondentes existentes. Não cole como novos módulos ao lado dos antigos. A revisão parte da entrega 3.4 disponível nesta conversa; os projetos Google não foram alterados diretamente.

## 1. Onde colocar cada arquivo

| Arquivo | Projeto do Apps Script | Substituir |
|---|---|---|
| 01_Central_Atendimentos_4_9_0.gs | Procedimentos de Campo | Central de Atendimentos |
| 02_Fichas_Oficiais_3_2_0.gs | Controle de Atendimentos | Fichas Oficiais |
| 03_Painel_Atendimento_3_5_0.gs | Controle de Atendimentos | Painel de Trabalho |
| 04_Painel_Executivo_1_5_0.gs | Execução de Atendimentos | Painel Executivo |
| 05_Comunicacao_Atendimento_4_0_0.gs | Controle de Atendimentos | Comunicação/Acompanhamento |

Guarde os códigos atuais antes da substituição. Se você fez alterações locais depois da entrega 3.4, compare essas alterações antes de substituí-las. No Controle, salve os três módulos antes de executar qualquer função.

## 2. Aplicar pela conta que já mantém as automações

Siga a ordem, esperando cada execução terminar:

1. **Procedimentos de Campo:** execute `sincronizarCentralAtendimentos`. Atualiza o Dashboard, as responsabilidades e a exclusão operacional dos protocolos incorporados.
2. **Controle:** execute `sincronizarBaseFichasOficiais`. Atualiza a base oficial usada pelas janelas.
3. **Controle:** execute `gerarAcompanhamentoDiario` e depois `painelProcessarFila`. A primeira função registra o pedido; a segunda usa a rotina existente para atendê-lo. Se a fila estiver ocupada, o gatilho existente retomará o pedido. Em **Avisos e acompanhamento**, espere aparecer uma nova data em “Versão pronta”. Os downloads anteriores permanecem disponíveis nesse intervalo.
4. **Execução:** execute `atualizarPainelExecutivoExecucaoAgora`. Atualiza os vínculos, a Base Executiva, a rastreabilidade, o Dashboard e a cópia do acompanhamento.
5. Reabra a planilha do Controle. O Painel de Trabalho deve aparecer automaticamente. Abra a ficha **ATD20260009** na Execução para conferir o fluxo que apresentava erro.
6. **Controle:** execute `conferirConsistenciaAtendimento`. Depois das sincronizações, `sobrando`, `faltando` e `duplicados` devem estar vazios. Compare a data da consulta dos acompanhamentos; uma cópia com data anterior ainda aguarda seu ciclo.

**Não reinstale o sistema e não crie novos gatilhos.** Esta revisão reaproveita a Central, `painelProcessarFila` e `atualizarPainelExecutivoExecucaoAgendado`. O `onOpen` simples no Controle abre a interface; o gatilho já existente de menu pode permanecer. Não adicione outro `onOpen` no mesmo projeto.

A abertura automática cria a janela sem consultar outros arquivos. Os dados são carregados depois, com a autorização da pessoa. Na primeira utilização, pode ser necessário usar **ATENDIMENTO → Autorizar meu acesso**. A abertura por gatilho simples ocorre para quem pode editar a planilha, conforme as [regras do Google para gatilhos simples](https://developers.google.com/apps-script/guides/triggers).

## 3. O que estava errado e o que foi corrigido

**Ficha na Execução:** `pe_carregarFicha` usava a variável `prioridade` fora do seu escopo. A função agora usa a prioridade já calculada no resumo da ficha. Esse erro podia afetar qualquer ficha, não apenas uma mesclada. Falhar ao marcar mensagens como lidas também deixa de impedir a consulta da ficha; a interface informa essa falha separadamente.

**Mesclagem e contagem:** a Base Executiva enviada ainda continha **ATD20260011**, incorporada à **ATD20260017**. Os quatro vínculos encontrados foram:

| Incorporada | Principal |
|---|---|
| ATD20260027 | ATD20260016 |
| ATD20260008 | ATD20260009 |
| ATD20260006 | ATD20260029 |
| ATD20260011 | ATD20260017 |

Não refaça essas mesclagens e não apague as respostas originais. Os vínculos redirecionam consultas e retiram a incorporada da carteira operacional. Mesclar não equivale a encerrar uma demanda, portanto não aumenta a contagem de encerradas.

No recorte dos XLSX enviados, a conferência encontrou **27 protocolos válidos: 24 abertos e três concluídos**. Com Engenharia agrupada em Execução, os 24 abertos ficam com Execução. Dois encerramentos tinham evento de finalização na semana da consulta; o terceiro era anterior. Esses são resultados do arquivo enviado, não uma leitura ao vivo de hoje.

**Responsável atual:** a coluna do Dashboard passa a indicar **Atendimento ou Execução**. Pessoas e e-mails continuam preservados nos registros de autoria. Engenharia, operação e equipes de obra pertencem a Execução. As demais categorias antigas e valores vazios ficam com Atendimento para triagem. Novos encaminhamentos só oferecem as duas opções. As mensagens históricas mantêm o texto original.

**Finalização:** uma conclusão informada pela Execução fica como “Aguardando revisão e finalização do Atendimento”. Continua aberta, sob responsabilidade do Atendimento, até a finalização efetiva. Os fluxos de encerramento sem pesquisa e de mesclagem foram mantidos e verificados em testes locais.

## 4. Como ficam arquivos e downloads

São mantidas **duas versões completas do acompanhamento**:

- **Versão pronta:** Excel + PDF disponíveis para baixar.
- **Backup:** Excel + PDF da versão imediatamente anterior.

Portanto, depois da limpeza, são quatro arquivos de acompanhamento: dois formatos por versão. Durante uma preparação pode existir um conjunto temporário adicional. Ele só se torna a versão pronta após os dois formatos serem gerados. Se ocorrer falha, as versões prontas são preservadas e os arquivos parciais são removidos ou retomados na próxima rotina.

Quando uma nova versão fica pronta, a atual vira backup. As versões mais antigas são movidas à lixeira. A limpeza cobre arquivos com o nome e tipo dos acompanhamentos gerados pelo sistema, dentro da pasta de comunicação configurada e de suas subpastas mensais. Não percorre todo o Drive, não apaga originais, históricos ou documentos mensais Sabesp. Arquivos que alguém tenha movido para outra pasta não entram nessa limpeza automática. Arquivos de outras pessoas podem exigir permissão para a conta da automação; isso aparece como aviso de limpeza, sem invalidar a versão nova.

A exclusão usa a [lixeira do Drive](https://developers.google.com/apps-script/reference/drive/file#setTrashed(Boolean)), sem exclusão permanente pelo script. Documentos já enviados por WhatsApp ou anexados ao e-mail permanecem nos respectivos envios. Links de versões antigas podem deixar de funcionar quando o arquivo antigo for para a lixeira; para circulação diária, envie o arquivo baixado.

O **caderno completo de fichas** continua separado, solicitado sob demanda e com data própria. Ele não é uma terceira versão do acompanhamento. Anexos de avisos e cadernos existentes não são incluídos na limpeza automática dos acompanhamentos.

A tela consulta diretamente os arquivos publicados, sem reconstruir as bases nem esperar o bloqueio da exportação. A opção **Abrir no Drive** acompanha cada download. Em caso de falta de acesso à pasta, use a ferramenta de revisão de acessos já existente no painel; a atualização de código não modifica compartilhamentos.

## 5. Atualização e mensagem

A rotina existente verifica a base. Havendo alterações, prepara um acompanhamento a cada **15 minutos**; “Preparar versão atualizada” antecipa o pedido. Se a base não mudou, reaproveita os arquivos. As notificações por novos eventos podem antecipar uma preparação para anexar informações atualizadas ao e-mail. A agenda depende da execução dos gatilhos Google; não há promessa de atualização simultânea entre três projetos.

A aba diária é atualizada pela rotina. As janelas calculam a carteira na consulta. Os arquivos e a mensagem representam a **última versão preparada**, cuja data fica visível. Isso evita apresentar números novos com anexos antigos. A Execução atualiza sua cópia pelo gatilho que já possui; até completar esse ciclo, uma cópia pode ter data anterior.

A mensagem tem apenas quatro números, além da identificação e das datas:

> Consórcio Performance Tamanduateí  
> Execução: 24 em aberto.  
> Atendimento: 0 em aberto.  
> Encerradas no período: 0.  
> Encerradas nesta semana: 2.

Exemplo baseado no recorte analisado. Saudação e texto de abertura continuam editáveis e salvos para cada pessoa. O período operacional vai de **12h a 12h em São Paulo**; a semana começa na segunda-feira à 0h. Encerramentos exigem evento registrado de finalização, sem inventar datas ausentes. A revisão pelo Atendimento é parte das abertas de Atendimento, não uma categoria somada novamente.

Os e-mails automáticos mantêm os destinatários e a configuração ativa/pausada existentes. Esta revisão não os ativa sozinha. A opção “Ativar avisos” continua disponível para a conta responsável. O WhatsApp prepara a mensagem; a pessoa escolhe o contato/grupo e anexa o arquivo.

## 6. Verificação realizada e limite

Foram executados **41 cenários locais**, além da verificação de sintaxe dos cinco módulos e do JavaScript gerado pelas janelas. Incluem abertura efetiva das 27 fichas do recorte, abertura dos quatro protocolos incorporados, coerência entre os dois painéis e o acompanhamento, prioridade, encerramento, permissões da fila, falha de exportação, retenção de dois pacotes, consulta durante atualização e recuperação de rotina interrompida.

Os serviços Google foram simulados nos testes. Não houve execução nos seus projetos, envio de e-mails, alteração de permissões ou teste de download autenticado no Drive. A conferência da seção 2 é a etapa final de implementação na sua conta. O arquivo `VALIDACAO.json` detalha as verificações.
