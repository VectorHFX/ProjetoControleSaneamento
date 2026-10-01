# Obras e Bairros — atualização 4.0.4

## Correção do aviso showNotification

Se o registro já informou **Salvo e sincronizado; revisão registrada**, com oito obras e 31 bairros, e depois apareceu **Cannot call SpreadsheetApp.showNotification() from this context**, a atualização dos dados foi concluída. A versão anterior tentou mostrar um popup num projeto independente.

Substitua somente o conteúdo completo de **CatalogosDeObrasEBairros.gs** pela correção de avisos 4.0.5 deste pacote. Salve e execute **aplicarObrasDoRelatorioCampo40** mais uma vez. A conclusão foi registrada antes do erro; a execução confere as listas atuais e mantém suas edições. Depois confira o controle Salvar na planilha.

O feedback agora usa as células e o Registro de execução. Não chama toast, showNotification ou getUi. Se apenas o aviso de uma aba não puder ser exibido, fica um alerta no log; falhas reais de publicação ou registro continuam sendo reportadas. Os outros arquivos de código permanecem iguais e a versão da base continua 4.0.4.

Use o mesmo projeto Apps Script em que a instalação 4.0.3 ficou CONFERIDA. Estes arquivos são para você colar e executar; a alteração ainda não foi aplicada na sua conta pelo chat.

1. Substitua o conteúdo inteiro de **ConfiguracaoDaBase.gs** e **CatalogosDeObrasEBairros.gs** pelas versões deste pacote. Mantenha os nomes desses arquivos.
2. Crie um arquivo de Script chamado **AplicarObrasDoRelatorio** e cole **AplicarObrasDoRelatorio.gs**.
3. Salve o projeto e execute **aplicarObrasDoRelatorioCampo40**. Autorize os serviços Google solicitados, se aparecer essa solicitação. Não precisa executar o instalador original de novo.
4. O log deve indicar **CONCLUÍDO**, **8 obras no formulário** e **2 opções especiais**. Abra o formulário e confira a pergunta de obra. A aba Bairros deve ter Jardim Cipreste e manter Vila Eldízia sem duplicação.
5. Na planilha, vá a Obras ou Bairros e marque a caixinha ao lado de **Salvar e atualizar formulário**. Aguarde a confirmação **Salvo!**, com horário, nas duas abas. A caixinha é desmarcada automaticamente para o próximo uso.
6. Depois da conferência, pode remover somente o novo arquivo **AplicarObrasDoRelatorio.gs**. As listas, o salvamento e as revisões continuam funcionando. Não remova os três arquivos permanentes: ConfiguracaoDaBase, CatalogosDeObrasEBairros e AuditoriaDoFormulario.

## O que aparece no formulário

| Situação atual | Disponível quando “No formulário?” está marcada? |
|---|---|
| Em andamento | Sim |
| Paralisada | Sim |
| Finalizada | Não; continua no cadastro |
| A confirmar ou situação vazia | Não; uma seleção sem situação gera aviso para corrigir |

O recorte inicial usa a tabela fornecida por Victor: **5 em andamento, 3 paralisadas e 7 finalizadas**. As demais frentes do PAC16 ficam desmarcadas, disponíveis para consulta. A atualização não reduz a lista de bairros às obras atuais: mantém seus bairros e opções anteriores e acrescenta Jardim Cipreste.

Mantém as opções especiais **Não se aplica — atividade sem obra específica** e **Obra ainda não cadastrada — identificar na observação final**. Não acrescenta perguntas nem altera o número de seções.

## Onde editar

**Obras:** A = ID permanente; B = nome; C = bairros, separados por ponto e vírgula; D = No formulário?; T = Situação atual. A seleção exige a combinação de D marcada e T em andamento/paralisada. A coluna F é apenas o status histórico do PAC16 de abril: não é a situação atual.

Os campos de início da obra/comunicação, público, impacto, observação e atualização ficam em **U:Z**, num grupo recolhido. Expanda pelo sinal **+**. As datas iniciais da tabela são gravadas como datas de planilha, com apresentação brasileira; comunicação pausada conserva o texto **Pausada**.

**Bairros:** A = ID permanente; B = nome; C = No formulário?. As demais colunas guardam município, tipo e fonte.

O controle fica em **AB3 em Obras** e **H3 em Bairros**, fora das tabelas. Com os grupos técnicos recolhidos, fica ao lado dos dados principais. Ele é uma caixinha acionável com texto de salvar, evitando desenho com macro e outro projeto de código. Use também no aplicativo Google Planilhas; a atualização depende de conexão e da execução do gatilho Google.

### Como acrescentar uma obra

1. Cadastre primeiro qualquer bairro novo na aba Bairros. Use um novo ID BAI, sem repetir um existente.
2. Na próxima linha livre de Obras, preencha um novo ID OBR, nome e bairros cadastrados. Para encontrar o próximo ID, use o maior número já existente + 1; nunca recicle o ID de uma finalizada. Numa base original sem inclusões anteriores, este recorte chega até OBR-0146 e BAI-031.
3. Escolha a situação atual na coluna T e marque No formulário? na coluna D.
4. Marque **Salvar e atualizar formulário**. Depois de **Salvo!**, a obra estará na lista. Se o formulário já estiver aberto para preenchimento, recarregue-o para consultar a lista nova.

As duas listas são salvas juntas. Não é necessário entrar no Apps Script a cada edição. A função **atualizarCatalogosCampo40** continua disponível como alternativa. **instalarControlesDosCatalogosCampo40** repõe os controles sem reaplicar o recorte inicial.

## Trechos, IDs e localização

Há 11 correspondências de nome/trecho com o PAC16. As outras quatro frentes recebem IDs próprios, sem escolher um ponto parecido por aproximação: Cata Preta x Caminho dos Vianas – VCA, Estrada Cata Preta – VCA, Rua Aníbal Freire e Rua André Magine. Isso mantém, por exemplo, Rua André Magine separada da frente Caminho dos Vianas x Ciprestes x André Magine.

Os IDs PAC16 reaproveitados mantêm EAP, status de abril, trecho original, origem e eventuais coordenadas. O nome exibido e a descrição do ponto seguem a tabela atual. Latitude/longitude não são inferidas a partir de ruas. Esses campos continuam reservados ao mapa futuro.

## Revisão diária e registro

Você já pode salvar mesmo quando nada mudou: esse uso confirma a revisão, com dia em horário de Brasília, horário, listas disponíveis e alterações por ID, com antes/depois. O responsável é registrado quando o Google disponibiliza a identidade; caso contrário fica escrito **Não disponibilizado pelo Google**, sem presumir que o editor é o dono do gatilho.

Na pasta existente ficam o recorte de origem com o pareamento e o cadastro anterior, o retrato atual de todos os cadastros e um arquivo de revisões por mês. Nenhuma aba adicional é criada. Este histórico começa nesta atualização e registra salvamentos; não captura alterações que nunca foram salvas.

A tarefa de Victor dentro da aplicação final está especificada em **REVISAO_DIARIA_NA_APLICACAO.md**. Não foi criada uma agenda ou notificação de aplicativo nesta etapa.

## Rapidez e repetição

Só existe um novo gatilho **de edição**, instalado pelo administrador. Edições comuns apenas mostram que há mudanças pendentes; não consultam o Drive ou o formulário. A leitura dos cadastros é feita em lote. As listas do Forms só são regravadas quando suas opções mudam. Não há atualização de 15 em 15 minutos e não há leitura/reescrita da aba Respostas.

Depois de uma aplicação bem-sucedida, executar novamente **aplicarObrasDoRelatorioCampo40** mantém suas edições atuais, reinstala os controles e confere a publicação; não volta às oito obras iniciais. Se ocorrer falha antes de concluir, a repetição retoma o recorte inicial, reutilizando os IDs já criados. Por isso termine e confira a primeira aplicação antes de fazer suas próprias alterações.

Se uma lista do Forms falhar depois de outra ter sido atualizada, o código tenta restaurar a primeira. O Google não oferece uma transação entre Sheets, Forms e Drive; qualquer falha na publicação ou no registro gera mensagem de erro. Corrija e salve novamente. A mensagem de sucesso só aparece depois de concluir as listas e o registro.

## Conferência

Passaram 16 verificações específicas do recorte e do salvamento, 15 verificações da estrutura/cadastros, 8 de identificação de respostas e uma simulação completa de instalação, atualização e operação com somente os arquivos permanentes. Foram verificados os oito ativos, os sete finalizados, os trechos próximos distintos, a repetição sem duplicação, o registro sem mudanças, a restauração de lista em falha parcial e a preservação de respostas.

São testes locais com simulação dos serviços. A primeira execução e um clique em Salvar na sua conta confirmam as permissões e o comportamento real do Google Workspace.
