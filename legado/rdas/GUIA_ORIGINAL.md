# Atualização de fotos e relatos sociais

## O que esta entrega faz

As fotos antigas e novas dos diagnósticos passam a ser lidas em conjunto. Campos opcionais vazios não geram erro. Arquivos repetidos em perguntas diferentes são contados uma vez pelo ID do Drive. O orientador Sabesp permanece com a tabela oficial; a galeria territorial e a seleção de fotos para a apresentação recebem o conjunto ampliado.

A pergunta **Descreva qual foi a interrução**, com a grafia exata do formulário enviado, alimenta a descrição da interrupção nos relatos, nas fichas RDAS, no visualizador RDAS e na memória diária da gestão. Também foram aceitas as grafias corrigidas “Descreva qual foi a interrupção” e “Qual foi a interrupção da atividade?”. O total de interrupções continua usando a resposta à pergunta “Houve interrupção da atividade?”. Clima não determina automaticamente uma interrupção.

O documento social extra é gerado apenas para **Articulação Institucional, Realização de CAO, Ação Social Externa, Ação Social Interna e DDS**, quando o procedimento é Relato de atividade. Todas as atividades continuam no RDAS. A classificação interna ou externa não exclui nenhuma dessas cinco opções do documento extra.

## Como instalar em Procedimentos de Campo

1. Abra **Procedimentos de Campo → Extensões → Apps Script**.
2. Guarde uma cópia dos códigos atuais fora do projeto. Substitua o conteúdo dos quatro arquivos correspondentes abaixo. Os arquivos entregues são completos; não deixe duas versões do mesmo código no projeto.

| Código atual identificado pelo conteúdo | Arquivo desta entrega |
|---|---|
| Painel Territorial 1.1, enviado como Código colado(20260914-003151).js | Procedimentos/Painel_Territorial_v1_2.gs |
| Relatos de atividade, enviado como Código colado (2)(4).js | Procedimentos/Relatos_de_Atividade_atualizado.gs |
| Diagnóstico de área, enviado como Código colado (3)(1).js | Procedimentos/Diagnosticos_de_Area_atualizado.gs |
| Sincronização dos Relatos para RDAS 1.4, enviado como Código colado (4)(1).js | Procedimentos/Sincronizacao_RDAS_v1_5.gs |

3. Crie **um arquivo novo**, chamado `Relatos Sociais Ilustrados`, e cole o conteúdo de **Procedimentos/Relatos_Sociais_Ilustrados_v1_0.gs**.
4. Salve todos os arquivos.
5. Execute **`atualizarRelatosDeAtividade()`**. Ela chama a integração existente e atualiza a tabela de relatos.
6. Execute **`atualizarDiagnosticosDeArea()`**.
7. Execute **`atualizarTresDiasMaisRecentesRDAS()`**. Essa função atualiza as fichas recentes sem instalar gatilhos. Caso complete a descrição de uma interrupção em um dia antigo, use depois o menu **RDAS • Sincronização → Atualizar todas as fichas**, considerando o tempo necessário ao histórico.
8. Execute **`instalarRelatosSociais()`** e autorize, se solicitado. Ela cria o modelo Google Docs e o histórico técnico próprio. Não cria gatilhos e não gera documentos de todo o passado.
9. Reabra a planilha. O acesso será **Relatos → Relatos ilustrados das ações sociais**.

**Mantenha o Gerador Territorial 1.0.1**, enviado como Código colado (5)(1).js. Ele usa as fotos recebidas do painel, e por isso não precisa de troca. A seleção de até 12 fotos por apresentação continua. Também não é necessário substituir o código de integração da Base Consolidada: a exportação enviada já contém as novas colunas consolidadas.

Se uma execução indicar que a planilha está sendo atualizada, aguarde o término e repita somente a função interrompida. Não apague gatilhos, propriedades ou abas para resolver esse aviso.

## Como instalar no RDAS

1. Abra **RDAS → Extensões → Apps Script**.
2. No arquivo que contém **RDAS | VISÃO EXECUTIVA E BANCO DE IMAGENS 1.1**, substitua todo o conteúdo por **RDAS/Visualizador_RDAS_v1_2.gs**.
3. Salve e reabra o RDAS. Não execute novamente a instalação da sincronização: ela pertence a Procedimentos de Campo.

O layout clássico das fichas e a galeria existente foram preservados. A área de informações complementares pode ganhar altura quando a descrição da interrupção for longa, para evitar corte do texto. O visualizador prioriza essa descrição na apresentação da ocorrência.

## Como instalar no Painel de Gestão

1. Abra **Painel de Gestão → Extensões → Apps Script**.
2. Substitua o conteúdo da versão 2.2.0 por **Gestao/Painel_Gestao_v2_2_1.gs**.
3. Salve e execute **`atualizarVersaoPainelGestao()`**.
4. Reabra a planilha. As anotações e os gatilhos existentes são preservados.

## Como usar os relatos sociais

1. Em Procedimentos de Campo, abra **Relatos → Relatos ilustrados das ações sociais**.
2. Escolha o mês e a atividade. Os registros antigos não são gerados em lote pela instalação.
3. Confira título, local, endereço, mediação, público, participantes, objetivo e relato. Resultados e encaminhamentos podem ser acrescentados na revisão quando houver informação confirmada.
4. Confira a visualização da ficha e marque as fotos que devem integrar o documento.
5. Clique em **Gerar documento e PDF**.
6. Use **Abrir documento editável** para copiar o conteúdo para o relatório mensal, ou **Abrir PDF** para baixar e imprimir. A lista de presença digitalizada continua como anexo separado.

As alterações da janela compõem a versão do documento; não mudam as respostas do formulário nem o RDAS. Se a correção também precisa aparecer no RDAS, ela deve ocorrer no fluxo de correção da origem.

O documento editável mantém parágrafos e imagens nativos, facilitando copiar e colar no relatório. Se você editar diretamente o Google Docs depois de gerar, o PDF já criado não muda sozinho. Nesse caso, baixe um novo PDF pelo menu Arquivo do próprio documento.

### Automação

Depois de instalar o novo módulo, **o gatilho de envio já existente de `aoEnviarFormularioRelatos`** passa a gerar o documento social para novas respostas elegíveis, depois da integração. A entrega reaproveita esse gatilho; não cria um novo. Se esse gatilho não estiver ativo na sua conta/projeto, o fluxo manual pela janela continua disponível, mas a geração no envio não ocorrerá.

O histórico distingue **Gerado automaticamente**, **Revisado na geração** e **Falha na geração**. Esses estados descrevem a produção do arquivo, não aprovação pela Sabesp. Os textos automáticos reproduzem as respostas disponíveis. Objetivo ou relato vazio interrompem a geração e precisam ser completados. Falhas de foto não produzem um PDF silenciosamente incompleto: a mensagem identifica a falha e o histórico conserva o arquivo parcial para conferência. Na janela, a imagem pode ser desmarcada antes de gerar novamente.

Repetir a geração com o mesmo conteúdo e o mesmo modo reutiliza os links registrados. Uma revisão diferente cria outra versão e preserva a anterior. As gerações não modificam o compartilhamento das fotos nem enviam documentos por e-mail ou WhatsApp.

### Organização dos arquivos

A pasta indicada recebe subpastas **2026-08**, **2026-09** e assim por diante, conforme a **data de realização da atividade**, nunca pelo carimbo do formulário. Cada arquivo tem data, tipo de atividade, tema ou local, ID de origem e versão.

Padrão: `AAAA-MM-DD - Atividade - Tema ou local - ID - v001`.

A instalação cria o Google Docs **MODELO - Relato ilustrado da atividade social** na pasta principal. O ID fica guardado no projeto. O DOCX entregue é uma base editável para consulta ou uso manual; não é necessário importá-lo para a automação. O modelo nativo criado pelo script possui os mesmos blocos de conteúdo e gera as linhas da galeria conforme as fotos selecionadas. Não substitua o modelo nativo pelo DOCX manual: eles usam marcadores de galeria diferentes.

O modelo nativo pode receber ajustes de fonte e espaçamento, mantendo seus marcadores `{{...}}`. Os campos Resultados e Interrupção são retirados da versão gerada quando não há conteúdo. A tabela do documento social não altera qualquer modelo oficial do diagnóstico Sabesp.

## Como enriquecer o preenchimento sem inventar conteúdo

Os campos atuais já alimentam atividade, tema, endereço, data, horário, equipe, público, objetivo e narrativa. **Colaboradores de apoio não são automaticamente mediadores**. A janela permite confirmar a mediação antes da entrega.

Se quiser registrar isso já no Forms, o módulo está preparado para estas perguntas opcionais, com os nomes exatos:

| Pergunta opcional | Finalidade |
|---|---|
| Local da ação social | Identificar escola, associação, canteiro ou outro equipamento, separado do endereço. |
| Mediadores da atividade | Registrar quem conduziu efetivamente a ação. |
| Resultados e encaminhamentos da ação | Registrar dúvidas tratadas, resultados observados e próximos passos confirmados. |

Uma orientação útil para a pergunta Relato da atividade é: “Descreva como a ação aconteceu, os temas discutidos, a participação do público, as dúvidas e os encaminhamentos. Registre somente o que ocorreu.” O sistema formata esse texto; não acrescenta conclusões presumidas.

## Conferência dos dados enviados

O PDF da CAO de 02/09/2026 informa **33 participantes** e horário **10h**. O registro consolidado **ATUAL-3.0-0074** informa **32 participantes** e faixa **09:20 às 12:00**. Esses horários podem representar momentos diferentes, mas isso não pode ser decidido automaticamente. O relato do formulário também é mais curto que o PDF. A geração começa com os dados do formulário, e a janela permite a revisão da entrega. O conteúdo do PDF não foi replicado em outras atividades.

Foram encontrados quatro registros elegíveis na base enviada: um DDS, duas articulações institucionais e uma realização de CAO. A inclusão futura de Ação Social Interna e Ação Social Externa já está contemplada no filtro.

## Validação e limites

Foram verificadas a sintaxe dos sete módulos e dos scripts das janelas, as novas fotos opcionais, a deduplicação por ID do Drive, a descrição de interrupção no RDAS, o filtro das cinco atividades, o versionamento e a repetição de pedidos em simulação. Os 112 relatos lidos pelo código anterior foram preservados na comparação. O modelo DOCX foi renderizado e as duas páginas foram conferidas visualmente.

Não houve execução na sua conta Google. As permissões da pasta, a montagem final pelo Google Docs e a exportação de PDF com imagens privadas precisam ser conferidas na primeira geração. Os testes locais de campos novos utilizam casos simulados isolados; nenhum dado de teste foi colocado nos arquivos entregues ou nas suas planilhas.

Referências técnicas utilizadas: [serviço DocumentApp Body](https://developers.google.com/apps-script/reference/document/body) para montagem do documento e [Drive File](https://developers.google.com/apps-script/reference/drive/file) para cópia e conversão em PDF.
