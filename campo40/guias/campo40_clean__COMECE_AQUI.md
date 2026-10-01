# Procedimentos de Campo 4.0 — versão 4.0.4

**Instalação já conferida?** Leia primeiro `ATUALIZAR_OBRAS_E_SALVAR.md`: substitua ConfiguracaoDaBase e CatalogosDeObrasEBairros, acrescente AplicarObrasDoRelatorio e execute aplicarObrasDoRelatorioCampo40. O recorte deixa cinco frentes em andamento e três paralisadas no formulário, com controle Salvar nas duas abas e histórico de revisões.

O novo arquivo AplicarObrasDoRelatorio é removível após aplicar e conferir. Não remova os arquivos permanentes.

Este pacote reúne as correções das versões anteriores até a 4.0.4. As instruções abaixo tratam da instalação inicial e dos erros antigos; a atualização das obras tem instruções próprias no arquivo acima. Use **o mesmo projeto independente de Apps Script em que apareceu o erro**. Os IDs salvos nesse projeto permitem retomar a instalação.

## Se você já colocou os cinco arquivos e recebeu um dos erros

Substitua **todo o conteúdo** dos arquivos **ConfiguracaoDaBase.gs**, **InstalacaoDaBase.gs** e **AuditoriaDoFormulario.gs** pelas versões deste pacote. CatalogosDeObrasEBairros.gs também ganhou uma nova versão; use o arquivo deste pacote. DadosIniciaisDoPAC16.gs continua igual. Depois da instalação, aplique o recorte conforme ATUALIZAR_OBRAS_E_SALVAR.md.

Salve e execute **instalarCampo40** no mesmo projeto. A execução retoma os IDs já registrados. Se a instalação já terminou, identifica e organiza a mesma aba de respostas. Se ainda falta o vínculo, liga o formulário à base existente e prossegue. Depois execute **verificarCampo40** e confira o envio real de uma resposta com foto.

## Corrigir e continuar

1. Abra esse projeto. No arquivo `Código.gs` que contém o instalador anterior, substitua **todo o conteúdo** pelo conteúdo de `codigo/ConfiguracaoDaBase.gs`. Renomeie esse arquivo para **ConfiguracaoDaBase**.
2. Crie quatro arquivos de **Script**: **CatalogosDeObrasEBairros**, **AuditoriaDoFormulario**, **InstalacaoDaBase** e **DadosIniciaisDoPAC16**. Cole o conteúdo completo do arquivo correspondente da pasta `codigo` em cada um.
3. Salve todos os arquivos. Selecione **instalarCampo40** na lista de funções e execute.
4. A execução reaproveita a cópia do formulário, a base, os cadastros e a pergunta de obra já criados. Ao concluir, mostra os links no Registro de execução. Para o seu formulário, a expectativa é **150 perguntas: 149 originais + 1 de obra; 23 seções**.
5. Execute **verificarCampo40**. O resultado deve ser **CONFERIDO**. Faça um preenchimento real, incluindo foto, antes de distribuir o link à equipe. O formulário novo fica inicialmente fechado: use **Publicar / Aceitar respostas** no Google Forms para habilitar seus testes.
6. Depois da conclusão e do teste de envio, você pode excluir do projeto **somente os dois arquivos de código** `InstalacaoDaBase.gs` e `DadosIniciaisDoPAC16.gs`. Os outros três continuam funcionando.

Não crie outro projeto para retomar. Substitua o conteúdo antigo por completo: manter as duas versões juntas causaria declarações duplicadas. Mantenha as propriedades salvas do projeto, que guardam os IDs da base e do formulário. Os arquivos de documentação e catálogo do pacote não precisam ser colados no Apps Script.

## Responsabilidade de cada classe

| Arquivo / classe | Para que serve | Uso |
|---|---|---|
| **ConfiguracaoDaBase.gs** | Versão, identidade da base, IDs salvos, trava de execução e consulta de links. | Permanente |
| **CatalogosDeObrasEBairros.gs** | Lê e valida os cadastros e atualiza suas opções no formulário. | Permanente |
| **AuditoriaDoFormulario.gs** | Confere a estrutura, os caminhos de finalização e o destino de respostas; exporta perguntas e seções. | Permanente |
| **InstalacaoDaBase.gs** | Cria ou retoma a configuração inicial, formata as abas e compara a cópia com a estrutura original. | Removível após concluir e testar |
| **DadosIniciaisDoPAC16.gs** | Fornece as 142 frentes iniciais, a referência do formulário 3.0 e as correções de português. | Removível junto com o instalador |

A organização segue uma responsabilidade principal por classe. No Apps Script, são **classes JavaScript no ambiente V8**, com métodos estáticos. Os arquivos compartilham o escopo do projeto; não são pacotes Java e não usam `import`/`export`. As pequenas funções globais abaixo são os pontos de execução visíveis no editor. As classes não fazem chamadas ao Google durante o carregamento dos arquivos, evitando dependência da ordem em que aparecem.

## Funções que você executa

| Função | Quando usar |
|---|---|
| **instalarCampo40** | Agora, para retomar. Disponível enquanto o arquivo de instalação existir. Depois da conclusão, organiza a aba de respostas e mostra os links. |
| **atualizarCatalogosCampo40** | Depois de editar nomes, bairros ou a seleção “No formulário?” nas abas Obras e Bairros. |
| **verificarCampo40** | Para conferir contagens, finalização obrigatória, vínculo da base e validade dos cadastros. |
| **exportarEstruturaCampo40** | Para gerar a definição do formulário que servirá à aplicação futura. |
| **verLinksCampo40** | Para consultar rapidamente os links registrados. |

Não é preciso executar métodos de classe diretamente. A atualização das listas e a exportação da estrutura atualizam seus respectivos arquivos JSON na pasta da base, sem gerar um novo arquivo a cada execução.

## Os erros corrigidos

A versão anterior chamou `form.moveItem(obra, destino)` passando uma `ListItem`. A correção chama **`form.moveItem(indiceAtual, indiceDestino)`**, com dois inteiros. O cálculo também considera uma pergunta eventualmente deslocada para antes do bairro. Se já está no lugar certo, ela não é movida.

A versão 4.0.1 consultava `getDestinationId()` antes de vincular a nova planilha. Nessa situação, o Google lançou **“The form currently has no response destination”**. A versão 4.0.2 trata especificamente essa condição como destino ainda ausente e cria o vínculo com a base já registrada. Se já está ligada à mesma base, preserva esse vínculo. Erros de permissão ou outras falhas continuam sendo informados.

A versão 4.0.2 podia terminar a instalação sem confirmar que a aba de respostas tinha sido renomeada. A conferência seguinte exigia o nome Respostas e falhava. Na versão 4.0.3, a identificação usa o vínculo do Google Forms e aceita a URL pública ou a de edição. Quando esse vínculo não aparece na consulta da aba, usa a combinação dos cabeçalhos Carimbo de data/hora, obra e bairro. Havendo mais de um candidato, interrompe com uma mensagem clara, sem escolher arbitrariamente.

A função instalarCampo40 também organiza a aba quando o estado já está concluído. Reaproveita seu ID, preserva as linhas e renomeia apenas a aba identificada. Se houver outra aba chamada Respostas, informa o conflito. A função verificarCampo40 aceita o nome original da aba vinculada e informa seu nome e ID no resultado, sem renomeá-la. Confere a base antes de fazer a leitura completa do formulário.

A conferência permanente usa a mesma leitura protegida; um formulário sem destino produz uma mensagem clara de vínculo ausente, sem modificá-lo durante a auditoria.

A retomada usa a chave de estado existente **CAMPO40_INSTALACAO**, incluindo `formId`, `baseId`, `snapshotId`, `cadastrosProntos` e `obraItemId`. Não é necessário editar os IDs manualmente. O código só marca a nova instalação como concluída depois de identificar a aba de respostas, auditar o formulário e escrever a aba Início.

## Quatro abas na base

| Aba | Conteúdo |
|---|---|
| **Início** | Links e instruções de administração. |
| **Obras** | Frentes, IDs permanentes, bairros confirmados e campos reservados para localização. |
| **Bairros** | Nomes e opções especiais que a equipe poderá selecionar. |
| **Respostas** | Registros gravados diretamente pelo Google Forms. |

Os nomes de obras podem ser editados; os IDs são permanentes. Para vincular vários bairros à frente, separe os nomes por **ponto e vírgula**, usando nomes da aba Bairros. Para ocultar uma opção, desmarque **No formulário?**. Depois execute **atualizarCatalogosCampo40**.

Para novas linhas, use IDs ainda não utilizados, conforme o maior ID já existente; depois deste recorte inicial, em uma base sem inclusões prévias, o próximo é **OBR-0147** ou **BAI-032**. Mantenha os cabeçalhos e a ordem das colunas. Os detalhes técnicos de Obras ficam recolhidos; expanda o grupo para acessar latitude, longitude e GeoJSON.

Após aplicar o recorte, a coluna T e a seleção D controlam as opções atuais; as finalizadas continuam guardadas. As frentes e o status histórico inicial vêm do **PAC16 de 26/04/2026**. Os bairros por frente e as coordenadas aguardam confirmação. A leitura está documentada em `LEITURA_PAC16.md`; esse retrato não informa a situação atual das obras.

## Conferência e limites

Os testes locais reproduziram o erro antigo com uma assinatura estrita de `moveItem`, retomaram a instalação usando o mesmo estado, preservaram edições manuais feitas após a falha e verificaram o funcionamento dos três arquivos permanentes depois de retirar os dois iniciais. Também passaram 15 verificações de rotas, cadastros, correções de texto e repetição da instalação.

Foi reproduzida também a interrupção da versão 4.0.1 por falta de destino. A correção retomou os mesmos IDs, vinculou a base uma vez e passou nas novas execuções. O teste confirma ainda que falhas de permissão não são ocultadas.

Também foi reproduzida a instalação da versão 4.0.2 concluída sem renomear a aba. A correção conferiu o nome original, retomou a organização com o mesmo ID e preservou uma resposta já gravada. Passaram ainda 8 verificações de identificação por URL/cabeçalhos, ambiguidades, conflitos de nomes e permissões.

São testes simulados. Esta revisão não foi executada na sua conta Google. O teste real de upload continua necessário porque o FormApp não expõe todos os limites e configurações das perguntas de arquivo. Confira os caminhos de cada procedimento antes de trocar o link usado pela equipe.

Esta etapa entrega o formulário e a base para a próxima aplicação. A importação dos registros, as entregas do relatório e a interface centralizada serão construídas sobre ela. As tabelas de registros serão a fonte; tabelas dinâmicas serão visões para análise.

Referências técnicas: [Form.moveItem](https://developers.google.com/apps-script/reference/forms/form#moveitemfrom,-to) e [classes e limitações do V8](https://developers.google.com/apps-script/guides/v8-runtime).
