# Importar para o Procedimentos de Campo 4.0

A conferência apresentada em 30/09/2026 encontrou 335 registros consolidados e 194 respostas atuais cobertas, sem pendências preliminares. O link do Controle de Atendimentos já está configurado no importador. Não é preciso preencher IDs nem trocar trechos de código.

## Faça agora

No **mesmo projeto Apps Script onde instalou o Campo 4.0**:

1. Adicione um arquivo de Script chamado **ImportacaoDosHistoricos** e cole o conteúdo completo de `ImportacaoDosHistoricos.gs`.
2. Adicione outro chamado **ImportacaoDosAtendimentos** e cole o conteúdo completo de `ImportacaoDosAtendimentos.gs`.
3. Salve e execute **importarHistoricosCampo40**. Autorize o acesso às suas planilhas e à pasta já usada pelo Campo 4.0, se o Google solicitar.
4. O resultado esperado no Registro de execução é **IMPORTAÇÃO CONCLUÍDA E CONFERIDA**. Se aparecer **IMPORTAÇÃO PARCIAL**, execute a mesma função novamente. Se houver erro de tempo, execute novamente: os IDs já escritos permitem retomar.

Mantenha `ConfiguracaoDaBase`, `CatalogosDeObrasEBairros` e `AuditoriaDaImportacao`, que já estão no projeto. O ZIP inclui uma cópia da auditoria apenas como referência; não crie uma segunda classe com o mesmo nome. Não execute o instalador de novo.

## O que vai aparecer na base nova

| Aba | Para que serve |
| --- | --- |
| Registros | Os procedimentos de 1.0, 2.0 e 3.0, com ID estável, origem, data, bairro, responsável e campos para pesquisa. |
| Atendimentos | Um registro por protocolo, incluindo casos concluídos e protocolos incorporados, com acesso às fichas e PDFs existentes. |
| Movimentações | Histórico dos atendimentos, correções de ficha, cadastro manual de encerrados e vínculos entre protocolos. |

As quatro abas já instaladas continuam: Início, Obras, Bairros e Respostas. A migração não escreve na aba Respostas. Não recria os painéis e tabelas antigas nem instala gatilhos.

Os dados completos ficam na última coluna de cada tabela, **Detalhes JSON**, junto dos textos originais, URLs das fotos e documentos, campos das fontes e referências às linhas antigas. Essa coluna e a coluna Hash ficam ocultas para simplificar a leitura; podem ser reexibidas. As consultas da futura aplicação deverão ler só as colunas necessárias e buscar o detalhe pelo ID quando solicitado.

## Contagens para conferir

Pelo registro de execução recebido, esperamos **335 registros**, sendo 99 de 1.0, 42 de 2.0 e 194 de 3.0. As 194 respostas já fazem parte dos 335: não são somadas novamente. O importador lê a planilha atual na primeira execução; se houver novos envios antes da captura, as contagens podem aumentar.

O Controle enviado contém:

- **33 protocolos preservados**: 29 principais e 4 incorporados a outros casos.
- **24 casos principais ativos e 5 concluídos**.
- **29 documentos e 29 PDFs** referenciados na base de fichas oficiais.
- **80 movimentações**: 65 eventos do histórico, 10 correções, 1 cadastro manual de encerrado e 4 vínculos.

Existem 191 linhas-modelo de correção sem protocolo nem conteúdo de correção. Elas ficam conservadas no arquivo da fonte, mas não viram eventos de atendimento.

Os 55 preenchimentos de Ficha de Atendimento presentes no consolidado são **registros de procedimento**. Não representam necessariamente 55 casos distintos. Casos e estados finais usam o Controle de Atendimentos completo.

## Como a conferência funciona

O consolidado é a referência dos registros históricos. O importador compara os campos compartilhados com as respostas 3.0 e conserva ambas as versões. Identifica separadamente mudanças de conteúdo e diferenças de formato numérico, como `02` e `2`, apenas em campos de quantidade conhecidos. Na cópia de procedimentos de 28/09 usada nos testes, houve 30 registros com diferenças desse formato e nenhuma diferença de conteúdo nos campos compartilhados. O resultado da sua fonte atual será informado no log.

Correspondências ambíguas ou campos diferentes ficam identificados na coluna Conferência dos campos e nos detalhes; não são descartados. Obras e bairros só recebem ID quando há um nome exato e único no catálogo, desconsiderando apenas acentos, maiúsculas e espaços. Não se associa uma obra por semelhança de rua. Fotos são preservadas por URL; não são baixadas nem têm suas permissões alteradas.

A primeira execução guarda as fontes e o plano em arquivos JSON na pasta existente. Uma retomada usa essa mesma captura, mesmo que a origem tenha mudado. O log informa quando ela foi feita. Isso é uma **migração de histórico**, não uma sincronização contínua. Filas, mensagens e pedidos antigos do painel ficam arquivados sem serem executados.

Novas execuções não duplicam linhas nem apagam casos ausentes na origem. Se um registro importado tiver sido alterado na base nova, o processo para e informa o ID, preservando a alteração. Não há rotina de limpeza periódica neste importador.

Os arquivos de fonte contêm dados pessoais e seguem o acesso da pasta existente. Para rever o resultado, execute **verResultadoImportacaoCampo40**.

## Depois da importação

Envie o Registro de execução final. Com as contagens conferidas, o próximo passo é o processamento dos novos envios 4.0 e a aplicação, usando essas tabelas como base. Antes de liberar o formulário à equipe, faça o envio real com fotos que ficou pendente na instalação.

Estes dois arquivos são módulos de migração: poderão ser retirados do projeto depois de confirmarmos a entrega e conectarmos os serviços permanentes da aplicação. Os dados e arquivos de conferência continuam preservados.

Validação realizada: fontes fornecidas, IDs únicos, preservação das cinco conclusões, fichas/PDFs, incorporação de protocolos, comparação dos campos, retomada após interrupção, repetição sem duplicação e bloqueio de alterações conflitantes. As chamadas a Sheets/Drive foram simuladas nos testes locais; a execução real no Google será confirmada pelo seu registro. A contagem 194/335 também foi ensaiada com sete registros adicionais simulados, sem apresentá-los como dados reais.

Referências técnicas: [operações em lote](https://developers.google.com/apps-script/guides/support/best-practices), [links de células](https://developers.google.com/apps-script/reference/spreadsheet/rich-text-value) e [filtros](https://developers.google.com/apps-script/reference/spreadsheet/filter).
