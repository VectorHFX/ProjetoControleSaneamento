# Painel territorial de diagnósticos • 1.0

Esta entrega acrescenta um painel ao **Procedimentos de Campo 3.0**. O arquivo oficial SABESP, a ficha atual, as respostas e os formulários permanecem como estão. O painel não envia documentos nem cria gatilhos.

## Como instalar

1. Abra **Procedimentos de Campo 3.0 → Extensões → Apps Script**.
2. Clique em **+ → Script** e nomeie o novo arquivo `Painel_Territorial_Diagnosticos_v1_0`.
3. Cole nele todo o conteúdo do arquivo `.gs` entregue e salve.
4. No arquivo atual do sistema de diagnóstico, procure `function aoAbrirDiagnosticos(e)`. Substitua **somente essa função**, que atualmente chama `criarMenuDiagnosticos_()`, por:

```javascript
function aoAbrirDiagnosticos(e) {
  criarMenuDiagnosticos_();
  criarMenuPainelTerritorial();
}
```

5. Salve. No seletor de funções, escolha `instalarPainelTerritorial` e clique em **Executar**.
6. Autorize o acesso, se solicitado. O painel abrirá na planilha.
7. Nas próximas aberturas, acesse **TERRITÓRIOS → Visão territorial • diagnósticos**.

Não execute novamente `instalarSistemaDiagnosticos()` para instalar este painel: não é necessário. A chamada acima aproveita o evento de abertura existente. Se não houver esse evento, `abrirPainelTerritorial` continua disponível para execução manual; informe essa situação antes de alterar os demais gatilhos.

## Como usar

- **Visão do território:** selecione bairro e diagnóstico. O mês filtra somente as pesquisas. A contagem de diagnósticos considera todos os períodos.
- **Diagnóstico de campo:** confira as respostas originais por tema. Campo vazio aparece como “Não informado”.
- **Análise da gestão:** consulte o texto-base, use-o como ponto de partida, edite e salve uma revisão. O texto-base é uma organização por regras, sem serviço de IA externo. As respostas citadas não recebem conclusões novas.
- **Galeria de evidências:** as imagens vinculadas são carregadas progressivamente; cada miniatura conserva o link para o original. Vídeos podem ter prévia estática.
- **Rastreabilidade:** consulte a linha de origem e as pesquisas usadas na leitura do bairro.

**Salvar nova revisão** preserva a versão anterior. “Revisado pela gestão” é um estado atribuído pela pessoa que salva; não é uma aprovação técnica automática. Se as respostas de campo mudarem, o painel sinaliza que a análise precisa ser conferida. Se outra pessoa salvar antes, sua gravação é interrompida e o texto em edição permanece na janela para cópia e comparação.

**Baixar texto consolidado** exporta o texto em edição, com identificação do diagnóstico e link de origem, sem as notas internas. Se ainda não foi salvo, o arquivo é identificado dessa forma. Salve antes de fechar a janela: o botão de fechamento do Google pode não exibir o aviso de edição pendente.

## Onde ficam as análises

O primeiro salvamento cria a aba oculta **CPT Análises Territoriais**. Ela contém o histórico, o estado da revisão, a assinatura da origem e o autor quando o Google fornece a identidade. Não apague essa aba.

As permissões são as da planilha. Ocultar uma aba não torna suas notas privadas para outros editores. Este módulo deve permanecer no ambiente restrito de Procedimentos de Campo, e não ser publicado como aplicativo aberto.

## Critérios dos dados

- Leitura direta da **Base Consolidada**, com as validações “Válido para consolidação” ou “Registro atual preservado”.
- ID de migração é obrigatório; IDs repetidos interrompem a leitura em vez de duplicar indicadores.
- A data usada é a realização do procedimento. Carimbo não substitui data ausente.
- O painel consulta a base disponível; **Atualizar visão** não executa novamente a integração inteira. Para respostas ainda não consolidadas, use primeiro a sincronização que já existe no sistema.
- Bairro é comparado por nome, com normalização de acentos, caixa e espaços. Não há associação aproximada por endereço.
- A média territorial usa exclusivamente a pergunta “De 0 a 10, quanto está satisfeito com os serviços de saneamento de forma geral?”. Apresenta o número de notas válidas. Outras perguntas e pesquisas de atendimento não são misturadas.
- Não há atribuição automática de impacto, vulnerabilidade ou prioridade. IPVS é exibido como informação declarada, sem certificação ou consulta externa.
- Diferentes visitas ao mesmo trecho permanecem registros distintos. Imóveis, pessoas e equipamentos não são somados entre diagnósticos, pois pode haver sobreposição.
- A ficha oficial antiga continua usando o gerador antigo. Esta entrega não corrige nem substitui classificações já gravadas nela; a consulta do novo painel usa as respostas originais.

## Integração seguinte: atendimentos, ficha e apresentação

O cruzamento com pesquisas já usa o bairro declarado na Base Consolidada. Para **atendimentos**, o arquivo enviado não apresenta um campo explícito de bairro na Base de Atendimentos. A contagem territorial fica identificada como pendente, não como zero.

Para habilitá-la, envie uma relação simples com **protocolo | bairro confirmado**. Caso o sistema já grave bairro em outra aba, envie o nome da aba e o cabeçalho exato. Atendimentos sem vínculo permanecerão fora da contagem territorial e identificados para conferência. A associação será ao bairro, não automaticamente a uma frente ou a um diagnóstico específico.

Para gerar depois a **ficha oficial**, será necessário o link de uma cópia do modelo no Google Docs e a pasta de destino, preservando o layout SABESP. O DOCX enviado já serve como referência estrutural; não precisa ser redesenhado.

Para a **apresentação**, a estrutura recomendada é uma seção por bairro e blocos por diagnóstico: contexto, leitura territorial, relato da equipe, fotos e análise revisada. A apresentação deve atualizar blocos pelo ID, preservando edições da gestão em áreas separadas, em vez de acrescentar slides duplicados. Será necessário o modelo Google Slides e a pasta de destino quando entrarmos nessa etapa.

## Verificações realizadas

Com os arquivos enviados: 4 diagnósticos válidos, 63 pesquisas de satisfação territoriais na base e 8 links de evidências dos diagnósticos. Esses números descrevem a cópia analisada, não a planilha ao vivo.

Testados localmente: sintaxe Apps Script e JavaScript da janela; leitura da base real; ausência de valores; datas inválidas; ID duplicado; salvamento com versões; edição concorrente; mudança da origem; preservação do histórico; URLs repetidas. A execução autenticada no Google, o acesso às fotos e o evento de abertura precisam ser conferidos após instalação.

## Referências técnicas

- [Janelas do Apps Script](https://developers.google.com/apps-script/guides/dialogs)
- [Miniaturas e arquivos do Drive](https://developers.google.com/apps-script/reference/drive/file)

O carregamento usa a conta de quem abre o painel. Não modifica compartilhamento nem torna imagens públicas.
