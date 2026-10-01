# Ficha SABESP e apresentação territorial

## Arquivos desta atualização

| Arquivo | Onde entra |
|---|---|
| `Painel_Territorial_Diagnosticos_v1_1.gs` | Substitui todo o conteúdo do arquivo atual `Painel Territorial.gs`. |
| `Gerador_Territorial_Sabesp_e_Slides_v1_0.gs` | Novo arquivo no mesmo projeto Apps Script de Procedimentos de Campo. |

O código antigo do diagnóstico continua como está. A chamada de menu que você já adicionou em `aoAbrirDiagnosticos(e)` permanece válida. Não crie um segundo arquivo contendo outra cópia do painel, pois os nomes das funções seriam repetidos.

## Como instalar

1. Abra **Procedimentos de Campo → Extensões → Apps Script**.
2. Entre em **Painel Territorial.gs**.
3. Substitua somente o conteúdo desse arquivo pelo conteúdo completo de `Painel_Territorial_Diagnosticos_v1_1.gs`.
4. Clique em **+ → Script**. Nomeie o novo arquivo `Gerador Territorial`.
5. Cole nele todo o conteúdo de `Gerador_Territorial_Sabesp_e_Slides_v1_0.gs`.
6. Salve os dois arquivos.
7. Selecione e execute **`instalarGeradorTerritorial()`**.
8. Autorize o acesso solicitado. A função valida o modelo e a pasta, sem abrir janelas nem criar gatilhos.
9. O registro de execução deve informar **“Modelo e pasta acessíveis. Estrutura reconhecida.”**
10. Atualize a página da planilha e abra **TERRITÓRIOS → Visão territorial • diagnósticos**.

Se a validação indicar diferença na estrutura, execute `diagnosticarModeloTerritorial()` e envie o resultado. A geração é interrompida antes do preenchimento quando as mesclagens ou os rótulos diferem do modelo. Não reinstale o sistema de diagnóstico nem altere gatilhos para corrigir esse caso.

## Primeira geração: Aníbal Freire

1. Selecione o bairro **Vila Alzira**.
2. Selecione o diagnóstico **Rua Aníbal Freire**, de **19/08/2026**, ID **ATUAL-3.0-0014**.
3. Abra a seção **Documentos e slides**.
4. Confira **Frente/CT**. O endereço aparece inicialmente como sugestão editável.
5. Complete PV, método e extensão apenas quando houver informação confirmada. Campos vazios usam `-`, como no modelo. Condição do pavimento, nível de impacto e padrão construtivo possuem seleção própria. Não são classificados por palavras encontradas no relato.
6. Confira **Observações consolidadas**. A análise revisada pela gestão é usada quando corresponde à versão atual da fonte. Nos demais casos, aparece o texto-base das respostas.
7. Clique em **Gerar ficha SABESP e PDF**. Os links aparecem na própria janela.
8. Para os slides, confira o mês das pesquisas no topo do painel e selecione até 12 fotos. Clique em **Gerar apresentação**.

As seleções técnicas usadas numa entrega são recuperadas do histórico nas próximas aberturas, para conferência. Alterações que ainda não participaram de uma geração ficam somente na janela. As observações desta tela são registradas com a entrega; elas não substituem a análise principal da gestão. Para atualizar essa análise, use a seção **Análise da gestão** e salve a revisão.

## Ficha oficial

O gerador copia o documento de referência informado, preenche seus campos e exporta um PDF. Não reconstrói a tabela nem muda suas larguras, cores ou bordas. O original de Aníbal Freire permanece intacto.

O conteúdo de observações é substituído integralmente pelo texto escolhido. Os valores do exemplo também são substituídos, incluindo valores ausentes no novo diagnóstico. Zero informado continua sendo zero; ausência de resposta não vira zero.

A correspondência entre pergunta e campo merece atenção: a descrição de **Condição da via** não equivale à avaliação **Ruim/Regular/Bom do pavimento**. Da mesma forma, “Casas” não equivale a padrão construtivo “Baixo/Médio/Alto”. Essas classificações permanecem na conferência de geração.

Textos longos podem aumentar a quantidade de páginas mantendo a estrutura do documento. O código não encurta automaticamente a análise nem diminui a fonte para forçar uma página. A primeira ficha deve ser conferida no Google Docs e no PDF antes do uso externo.

O PDF corresponde ao momento da geração. Se você editar diretamente o Google Docs depois, aquele PDF não se atualiza sozinho. Nesse caso, baixe um novo PDF pelo próprio Google Docs. Para incorporar a alteração ao sistema, registre o texto no painel e gere uma nova versão.

## Apresentação nova

A apresentação é criada nativamente no Google Slides e fica editável. Usa azul profundo `#083952`, ciano `#009FE3`, petróleo `#008A98` e fundos claros.

O roteiro reúne capa, imóveis e IPVS informado, perfil social, circulação, infraestrutura, equipamentos, mobilização, ocorrências, relato da equipe e satisfação do bairro. A primeira foto selecionada aparece na capa; as demais compõem a galeria, preservando a proporção e o link do original.

Quando as observações são uma redação própria, diferente do texto-base, a apresentação inclui a leitura consolidada em slides próprios. O texto-base automático não é repetido integralmente porque os campos já aparecem no roteiro. Textos extensos são distribuídos em mais slides, sem truncamento silencioso.

As pesquisas usam exclusivamente o mês selecionado, o bairro declarado e a pergunta de satisfação geral com saneamento. A apresentação mostra quantas pesquisas existem, quantas notas são válidas e a média na escala 0–10. Não inclui atendimentos nem atribui causalidade ou representatividade estatística à amostra.

As imagens dependem das permissões da conta que gera a apresentação. Quando uma prévia não está disponível, permanece um link para o original e o painel informa quais imagens falharam. Vídeos usam miniatura estática quando disponível. Nenhum arquivo é tornado público pelo código.

## Histórico e novas versões

Os arquivos são criados na pasta **Diagnósticos** informada. O histórico fica na aba oculta **CPT Documentos Territoriais**, com o ID do diagnóstico, conteúdo da geração, data, estado e links. Essa aba deve ser mantida.

Quando os mesmos dados e opções já produziram uma entrega, o painel retorna os links existentes. Para uma cópia nova, marque **Criar uma nova versão mesmo quando o conteúdo for igual**. Edições feitas diretamente em documentos anteriores não são sobrescritas.

Uma imagem substituída no Drive mantendo o mesmo link pode exigir a opção de nova versão. Se a execução perder a conexão ou demorar além do retorno da janela, confira o histórico antes de solicitar outra geração. Em caso de erro registrado, ajuste a causa e reabra a janela para iniciar um novo pedido.

A falha de uma geração descarta somente os arquivos parciais criados naquela tentativa e registra o erro quando a planilha permite gravar. Se não for possível descartar algum arquivo parcial, seu link fica indicado para conferência.

## Verificações e limites desta entrega

Os testes locais cobriram o preenchimento a partir do Word enviado, a preservação do modelo, a ausência de dados de Aníbal em outro diagnóstico, zeros e campos ausentes, mudanças na fonte, tentativas repetidas, versões explícitas e falhas de PDF. Foram renderizadas cópias locais para revisar a disposição da ficha e os layouts dos slides.

O Google Docs convertido não pôde ser acessado diretamente nesta sessão. A validação de sua estrutura ocorre na instalação, usando sua conta. As permissões, a inserção efetiva das fotos, a paginação no Google Docs e a renderização no Google Slides ainda precisam ser conferidas no ambiente Google. Os testes locais não substituem essa conferência.

## Referências técnicas

- [Tabelas no Google Docs](https://developers.google.com/apps-script/reference/document/table)
- [Texto e preservação de atributos](https://developers.google.com/apps-script/reference/document/text)
- [Imagens e caixas de texto em slides](https://developers.google.com/apps-script/reference/slides/slide)
- [Apresentações no Apps Script](https://developers.google.com/apps-script/reference/slides/presentation)
