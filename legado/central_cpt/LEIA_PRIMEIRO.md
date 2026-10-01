# Central CPT 4.5.1 | Comunicação e Socioambiental

## Atualizar a Central já instalada

1. Abra a Central CPT > Extensões > Apps Script e guarde o código anterior.
2. Substitua o conteúdo do arquivo principal por `Central_CPT_4_0_Completa.gs`. Não cole no final nem crie funções duplicadas.
3. Salve e recarregue a planilha. Abra o menu COMUNICAÇÃO.
4. Não execute novamente o instalador para esta atualização. O manifesto está incluído como referência; a instalação 4.3.1 já possui os escopos necessários.
5. Faça o primeiro envio de foto extra com a conta responsável pela Central. Abra o link da pasta mostrado na ferramenta e confira o compartilhamento: edição para quem envia; leitura para quem apenas consulta.

Não substitua arquivos do RDAS. Esta atualização não modifica suas fichas, visualizador, gatilhos ou dados. O antigo menu de upload do RDAS, se já instalado, permanece lá; use “Adicionar fotos extras” na Central para o novo fluxo.

Nenhuma aba ou gatilho é acrescentado. O tema compartilhado foi aplicado às duas visões, Comunicação e Socioambiental.

## Onde ficam as fotos

- RDAS: a galeria continua lendo as fotos já existentes, com os acessos originais do Drive.
- Extras: novas imagens são salvas em `CPT Comunicação - Fotos extras`, criada junto à Central quando há pasta-mãe. Os metadados ficam na estrutura interna já existente da Central.
- Fotos antigas complementares do RDAS continuam consultáveis como RDAS. Elas não são movidas nem apagadas automaticamente.
- Se o RDAS estiver sem permissão, aparece um aviso e os extras da Central continuam disponíveis.
- Arquivos vinculados por URL continuam no local original, com as permissões originais.

Acesso de editor à Central não concede automaticamente acesso de edição à pasta de fotos. O link da pasta fica na ferramenta de envio. Não há compartilhamento público automático.

## Enviar fotos extras

A data é obrigatória, escolhida no calendário e armazenada em AAAA-MM-DD. Tema é texto livre e opcional. Sem tema, o cartão recebe o título “Foto extra”. Bairro, local e legendas também são livres e opcionais.

Escolha até 30 fotos (JPG, PNG ou WEBP, até 8 MB cada). Escreva a legenda de cada imagem e clique Enviar fotos pendentes. Cada linha informa o resultado. Repita somente as pendentes; pedidos reaproveitam o arquivo quando a resposta anterior falha. Não feche a janela durante o lote. Caso feche, confira a galeria antes de selecionar novamente os mesmos arquivos.

Vídeos e arquivos maiores podem ser vinculados pelo link do Drive. O player depende do processamento do vídeo e das permissões do arquivo.

## Galeria e bairros

A galeria tem filtro de origem (RDAS / Extras), data, bairro, tipo e busca por texto. Troque o mês no topo para navegar entre competências. As prévias carregam em grupos e têm espaço fixo, separado do título e da legenda; a imagem inteira é preservada, sem corte. Se não houver miniatura, Abrir e Original continuam disponíveis.

O botão de download aceita até 15 imagens, totalizando no máximo 20 MB, sem criar um ZIP permanente no Drive. Vídeos são baixados pelo original.

Bairros mostra apenas bairros preenchidos nos procedimentos do mês selecionado no topo. Não usa a lista de todo o histórico. O acesso ao Google Maps é uma busca pelo nome em Santo André, não um mapa georreferenciado das obras.

## Acabamento visual 4.5.1

Logos gráficos foram retirados das janelas e do cabeçalho dos relatos gerados pela Central. Documentos já existentes não são modificados nesta atualização.

Somente os inícios de Comunicação e Socioambiental possuem imagem decorativa: a foto do escritório enviada nesta rodada. As demais ferramentas ficam sem fotos decorativas, mantendo os campos, filtros e cartões. Fotografias de evidência nos registros, diagnósticos e galeria continuam disponíveis.

O menu Azul simplificado agora usa fundo azul e texto branco nos itens comuns, fundo branco e texto azul no item selecionado. O destaque de foco e de passagem do mouse também foi ajustado. Nesse modo as imagens decorativas permanecem ocultas.

## Galeria progressiva

A versão anterior buscava automaticamente apenas as primeiras 12 prévias. Agora todas as fotos do filtro entram na fila, em lotes de até três chamadas simultâneas. Cada resultado aparece assim que chega.

O primeiro contador informa as mídias encontradas e se ainda há datas sendo consultadas. O contador Prévias informa quantas miniaturas foram carregadas e quantas ficaram indisponíveis. Uma falha não impede o restante da fila. Use Abrir ou Original para tentar uma imagem indisponível.

Mudar o filtro direciona o próximo lote à seleção atual. Ao sair da galeria, novas chamadas de prévia deixam de ser iniciadas; as chamadas já enviadas podem terminar. Fotos que usam o mesmo arquivo reutilizam a prévia. Vídeos continuam abrindo pelo player ao clicar, sem reprodução automática.

## Abertura e tempo de resposta

O código anterior aplicava o tema natural somente depois que a consulta inicial terminava. Por isso aparecia o azul antigo durante a espera. Agora o modo e o tema salvo são aplicados antes de desenhar o conteúdo. Cada comando de abertura contém uma chamada de criação de janela; não há chamada dupla nesse fluxo. Dois cliques independentes no menu continuam sendo dois comandos do usuário.

- A Comunicação abre sem carregar a lista completa de procedimentos.
- O início do Socioambiental e a consulta de registros vêm juntos em uma chamada, com uma leitura da base.
- Consultas idênticas simultâneas na mesma janela compartilham a requisição; após terminar, a próxima consulta vai ao servidor normalmente. Não há cache persistente de dados pessoais ou gravações agrupadas.
- Editar um contato já listado reutiliza a lista atual; o salvamento mantém a conferência de revisão.
- A imagem decorativa dos inícios é buscada separadamente e reaproveitada enquanto a janela permanece aberta.
- Pré-carregamentos decorativos e miniaturas não acionam a barra de espera principal.

Não foi medida a latência no ambiente Google. O ganho verificado é a redução de trabalho e chamadas nesses fluxos, não um tempo de abertura garantido.

## Responsividade

As duas janelas reorganizam os controles, cartões, campos e colunas em larguras menores. O menu fica recolhido em telas estreitas; use o botão de menu no topo para abri-lo. Letras maiores, Notebook e Ampla continuam disponíveis. As ferramentas não têm mais fotografias nos cabeçalhos secundários.

As prévias HTML podem ser abertas no navegador antes de instalar. Elas usam dados ilustrativos/agregados e não salvam no Google. Não substituem a conferência do modal real no Sheets.

## Diagnóstico mais vivo

Na ferramenta Diagnósticos de área, abra um registro:

1. Leia o registro original e os fatos organizados por tema, à esquerda.
2. Edite a síntese consolidada, os próximos passos e a situação da análise. Qualquer editor com acesso pode contribuir; não existe uma função exclusiva da gestão nesta versão.
3. Se quiser começar pelo levantamento completo, use Montar síntese com o texto-base. O botão pede confirmação antes de substituir sua síntese.
4. As análises antigas de CPT Análises Territoriais são importadas na atualização administrativa, com data, autoria, texto e notas preservados. Elas aparecem em Revisões anteriores. Use o botão para aproveitar o texto escolhido; nenhuma análise antiga substitui automaticamente sua edição atual.
5. Use Selecionar até seis fotos disponíveis ou selecione manualmente até doze. Confira as legendas. Vídeos não são incorporados à apresentação; ficam na galeria.
6. Salve a edição. Depois gere a ficha Sabesp ou a apresentação.

A revisão anterior da Central é preservada antes de uma nova gravação. Alterações simultâneas continuam sendo verificadas para evitar sobrescrita silenciosa. Notas internas ficam na Central, sem aparecer na ficha ou nos slides. Elas são internas ao sistema, mas não privadas entre os editores da Central.

A apresentação reúne temas, indicadores de moradia, narrativa, atenção sanitária, rede local e próximos passos. Fotos acompanham os blocos compatíveis e as restantes recebem páginas de evidência. Não existe mais um slide obrigatório para cada campo. Textos longos são paginados sem descarte; o número de slides depende do conteúdo e da quantidade de fotos selecionadas.

Frente/CT continua usando a informação existente. Os campos técnicos vazios não bloqueiam a geração. O modelo oficial e as permissões continuam necessários para emitir a ficha Sabesp. Os links de apresentação e PDF são reutilizados.

## Desempenho

A janela inclui cartões, evolução dos últimos seis meses, tipos de ação, presença nos bairros, perfil interno/externo, públicos declarados, distribuição dos procedimentos e pendências de texto, público e fotos. A aba Desempenho inclui seis gráficos nativos, cartões e uma tabela de conferência.

Todos os totais de ações usam o mesmo recorte das sugestões mensais: relatos do mês, excluindo logística interna. A distinção interna/externa respeita o que foi registrado. Não é inferida a partir do título DDS ou do nome da ação.

Participações são presenças somadas. Mídias são vínculos nos relatos elegíveis, incluindo eventual repetição do mesmo arquivo em registros distintos. Satisfação é média de notas válidas, não NPS. As combinações de público aparecem como declaradas. Não há avaliação individual de produtividade nem metas inventadas.

## Cronograma compartilhado e exportação

Cada compromisso tem Frente (Socioambiental, Comunicação ou Compartilhada) e Uso na exportação (Interno ou Compartilhável). Compromissos existentes sem classificação começam como Socioambiental e Interno para você revisar. A filtragem muda a visão, não cria outro cronograma.

Use Preparar exportação:

1. Escolha a entrega: Socioambiental, Comunicação ou Compartilhada. Nesta última, todos os compromissos podem ser selecionados.
2. Confira e marque exatamente as atividades necessárias. É possível retirar um DDS, por exemplo, sem excluí-lo do calendário.
3. Controles internos vêm desmarcados e bloqueados. Só entram quando você habilita sua inclusão e marca o item.
4. Gere Excel e PDF. A exportação inclui data, atividade, frente, responsável, situação e tema. Notas internas e checklist não entram.

Uma alteração no compromisso após abrir a seleção pede nova conferência. Cada combinação de competência e entrega reutiliza sua própria planilha, Excel e PDF. A geração não cria uma nova cópia a cada clique. Os arquivos exportados são uma fotografia da seleção feita naquele momento.

## Verificação

Verificados localmente: fila com mais de 12 fotos, limite de três prévias simultâneas, continuação após falha, novas fotos entrando na fila, troca de filtro e saída da galeria; HTML final das duas janelas, aplicação antecipada do tema, abertura leve da Comunicação, uma leitura da base na abertura do Socioambiental, compartilhamento de consultas simultâneas, repetição após erro, fotos sob demanda, preservação das gravações, extras independentes do RDAS, filtro mensal de bairros e regras existentes da Central.

Não houve execução na sua conta Google, upload real para seu Drive ou inspeção visual em navegador nesta revisão. Confira o primeiro envio com a conta administradora e depois com uma colaboradora autorizada na pasta.

## Arquivos

- Central_CPT_4_0_Completa.gs: código completo para substituir na Central.
- appsscript.json: referência de escopos da Central.
- Previa_Comunicacao_CPT.html: prévia do novo tema e das ferramentas.
- Previa_Central_CPT_4_0.html: prévia do Socioambiental com o novo tema.
- VALIDACAO.txt: resultados locais.
- LEIA_PRIMEIRO.md e LEIA_PRIMEIRO.txt: estas instruções.
