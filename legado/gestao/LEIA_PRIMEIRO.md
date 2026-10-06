# Gestão CPT 3.2 — fechamento

> **06/10/2026 — e-mails a cada foto do RDAS.** A rotina "acesso às mídias" deste painel compartilhava cada foto com os gestores (`addViewer`), e o Google manda um e-mail "compartilhado com você" a cada compartilhamento. Para parar **no Google**: abra a planilha da Gestão → **Extensões → Apps Script** → escolha **`pausarAcessoMidiasGestao`** → **Executar** (com a conta que mantém o gatilho). Neste repositório a rotina ficou desligada de vez (`pgSincronizarAcessosMidias_` não faz nada).

## Instalar no painel que você já usa

1. Abra **Extensões → Apps Script** na planilha da Gestão.
2. Substitua o código anterior da Gestão pelo conteúdo de **Painel_Gestao_3_2_Completo.gs**. É o código completo; não cole junto com a versão anterior, para não duplicar as funções.
3. Salve e execute **atualizarGestao32**. Use uma conta com permissão de edição nas duas planilhas oficiais.
4. Reabra **GESTÃO → Visão executiva Veolia**.

A execução organiza a Matriz de Contatos e a Máscara de lançamento e inclui os casos concluídos ausentes. Se executada novamente, reconhece os casos já incluídos. Não cria novas abas visíveis nem novos gatilhos.

As alterações nos arquivos anexos já estão prontas. **As planilhas online ainda não foram alteradas por esta entrega**: a aplicação ocorre ao executar a função acima. Os XLSX são cópias prontas para consulta; não é necessário importá-los nem substituir os arquivos do Google, cujos IDs são usados pelas integrações.

## O que foi entregue

- Matriz de Contatos: mesmas cores e estrutura, com colunas dimensionadas, textos com quebra, linhas ajustadas e cabeçalhos congelados. Dados e contatos preservados.
- Manifestações: 38 casos concluídos de agosto acrescentados aos 27 existentes; 65 casos no arquivo, sendo 41 concluídos. Duas duplicidades na origem foram consolidadas, preservando informações complementares. As ocorrências atuais de Samara e Gilmar não foram encerradas: são casos diferentes dos registros de agosto.
- A data incompleta `10/07/202` foi preservada como texto, sem inventar o ano. As demais datas adicionadas usam apresentação `dd/mm/aaaa`.
- Máscara Programa Parceiros: colunas, alturas, quebras de texto, alinhamentos e cabeçalhos ajustados. Fórmulas, preenchimentos, respostas e mesclagens existentes preservados. Na planilha Google, a localidade da máscara é definida como Brasil.
- **Indicadores 2026: preservado.** A aba no XLSX é idêntica à original, incluindo seu conteúdo XML; os estilos originais também são mantidos.

## Uso das entregas no painel

**Programa Parceiros:** confira os campos → marque os conferidos → salve o rascunho → clique em **Atualizar máscara oficial e gerar arquivos**. A gravação é feita na máscara oficial informada, na competência selecionada. Campos não conferidos não são apagados. Campos com fórmulas não são sobrescritos; desmarque-os antes de publicar. A criação de um novo mês respeita o bloco completo e as subdivisões da máscara. Se outra pessoa alterar a competência desde a consulta, reabra a entrega para revisar antes de publicar.

**Anexos do relatório:** a rotina **Aplicar organização e casos de agosto** atualiza a matriz e inclui os concluídos diretamente na planilha oficial, além de organizar a máscara. **Baixar anexos oficiais** gera Excel/PDF da planilha oficial. Para respeitar a instrução de não mexer em Indicadores 2026, o painel mantém essa aba somente para consulta: não publica os antigos rascunhos de indicadores nela.

Os downloads Excel/PDF refletem a planilha oficial inteira, incluindo suas competências. O mês selecionado define o destino do lançamento no Programa Parceiros; não é um filtro de páginas dos arquivos exportados. Os arquivos gerados ficam na pasta **Gestão CPT • Entregas** da conta executora.

Se a exportação falhar depois de gravar a máscara, o painel informa que a planilha foi atualizada e identifica o arquivo que não pôde ser gerado. Assim, uma falha no download não aparece como se a gravação também tivesse falhado.

## Destinos oficiais

- Anexos: https://docs.google.com/spreadsheets/d/1Et4M0nr4CxlRj7J6EDoru91aC4PJ-G2Y/edit
- Máscara: https://docs.google.com/spreadsheets/d/1ekpoNrPSdIbc18YxWp5ncQsTiWluS--m/edit

## Conferência realizada

Comparação automática de valores, fórmulas, mesclagens, validações e estilos originais; verificação dos 38 acréscimos e da preservação dos atendimentos existentes; revisão visual da matriz e dos textos longos na máscara. O código passou por verificação de sintaxe e testes locais de gravação seletiva, preservação de fórmulas, recuperação de falha, conflito de edição e criação de mês. Os testes da síntese, organograma e consultas da versão 3.1 também passaram. A execução com as permissões e os dados atuais do Google será feita na instalação.
