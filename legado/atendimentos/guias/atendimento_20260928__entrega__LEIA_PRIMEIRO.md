# Atendimento — histórico acumulativo e mensagem diária

Atualização de 28/09/2026. Mantém o visual Água e o restante dos fluxos de atendimento.

## Aplicar no sistema

1. Na planilha **Controle de Atendimentos**, abra **Extensões → Apps Script**.
2. No módulo **Fichas Oficiais**, substitua o conteúdo anterior (3.2.0) pelo arquivo **02_Fichas_Oficiais_3_2_1.gs** deste pacote.
3. No módulo **Comunicação do Atendimento**, substitua o conteúdo anterior (4.0.1) pelo arquivo **05_Comunicacao_Atendimento_4_0_2.gs**. São substituições completas dos dois módulos, não códigos para acrescentar em arquivos extras.
4. Salve e execute **corrigirHistoricoManifestacoesEAtualizarMensagem** uma vez, usando a conta que já mantém a automação e tem edição nos anexos.
5. Reabra o painel. A nova mensagem será preparada no próximo ciclo da automação existente. Você também pode solicitar **Preparar versão atualizada** em Avisos e acompanhamento.

Os outros módulos permanecem como estão. Esta correção não cria novos gatilhos, não altera destinatários e não envia mensagens ao executar a função de correção. Não é necessário reinstalar nem reiniciar as bases do sistema.

**As planilhas Google ainda não foram alteradas por esta entrega.** A execução acima recupera os históricos diretamente no arquivo oficial e aplica a rotina corrigida. O XLSX já está restaurado e serve para consulta/conferência. Instalar os códigos é o que evita nova perda nas atualizações periódicas.

## Causa encontrada e correção

A rotina anterior `fo_atualizarControleManifestacoesSemTrava_` limpava todo o corpo do controle e escrevia apenas os registros presentes na Central. Os casos acrescentados manualmente aos anexos não faziam parte dessa fonte e eram removidos no ciclo seguinte.

A nova rotina atualiza os registros identificados, acrescenta casos novos e preserva os demais. Ela não limpa o controle para reconstruí-lo. Um vínculo técnico discreto na nota da célula de data mantém a associação pelo protocolo mesmo após correções de endereço. Não há novas abas nem colunas.

No primeiro vínculo, são comparados data, nome, endereço e relato. Casos diferentes da mesma pessoa permanecem separados. Se houver correspondência ambígua ou conflito entre concluído nos anexos e aberto na Central, a sincronização informa a divergência para conferência, sem apagar o histórico. Campos com fórmula são preservados na atualização periódica. Uma providência/observação manual não é apagada por um valor vazio da Central.

A função de recuperação inclui somente os históricos ausentes. Repetir a instalação não duplica os 38 casos. Eles permanecem nos anexos, sem entrar como novas ordens de serviço, conclusões do dia ou novos avisos aos executores.

## Planilha restaurada

- 29 casos da planilha enviada, mantidos com os valores atuais.
- 38 históricos concluídos recuperados do anexo de agosto já conferido anteriormente.
- Total: **67 casos, sendo 43 concluídos e 24 em andamento**.
- **Indicadores 2026 e Matriz de Contatos preservados integralmente.**
- A data incompleta `10/07/202` foi mantida como consta na origem, sem presumir o ano.

O número online pode ser maior se novos atendimentos forem registrados depois do envio desta planilha.

## Mensagem diária

A mensagem mantém os quantitativos e acrescenta:

```text
Concluídos em DD/MM/AAAA: quantidade
• PROTOCOLO | Nome do solicitante | Assunto
```

A lista considera o dia civil no horário de São Paulo, até a geração do acompanhamento. O resumo operacional de meio-dia a meio-dia permanece separado e identificado. Portanto, a quantidade do período operacional pode ser diferente da quantidade concluída na data.

A conclusão é conferida pelo histórico de finalização/encerramento e pelo status atual. Na ausência desse evento, usa-se a data explícita de conclusão da ficha. Sem data comprovada, o caso não é atribuído ao dia atual. Casos reabertos, aguardando revisão, apenas executados ou com conclusão futura não entram como concluídos de hoje. Eventos repetidos não duplicam a ficha na lista.

## Validações

Testes locais com a planilha atual: recuperação única dos 38 históricos, oito sincronizações sucessivas sem exclusão ou duplicação, correções de endereço/status, inclusão de nova ocorrência e preservação com fonte vazia. Testes da mensagem cobriram mudança de dia em São Paulo, janela operacional, eventos repetidos, reabertura e data explícita de conclusão. Foram verificadas a sintaxe dos módulos, as contagens e a preservação das outras abas. A execução com as permissões reais do Google ocorre na instalação.
