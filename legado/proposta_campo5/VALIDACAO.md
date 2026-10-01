# Validação do pacote Campo 5.0

Data: 28/09/2026. As verificações abaixo ocorreram localmente. Serviços Google foram simulados; não houve instalação, publicação ou envio de mensagens reais.

## Verificações aprovadas

1. Compilação dos seis módulos Apps Script juntos, sem funções globais duplicadas.
2. Leitura da planilha enviada: 187 respostas atuais e 328 registros consolidados.
3. Ingestão inicial e repetição sem duplicar registros; respostas originais e 141 históricos preservados.
4. Inclusão de resposta nova uma única vez, mantendo o ID estável.
5. Mudança da data de atividade enfileirando as datas anterior e nova; falha simulada de escrita mantendo a tarefa retomável.
6. Bloqueio de substituição do carimbo/posição de uma resposta.
7. Versão nova de tarefa não sendo apagada pela confirmação de uma execução anterior.
8. Retentativas com atraso crescente, estado de erro após cinco falhas e retomada manual.
9. Revisão concorrente de obra e rejeição de data inválida no cadastro.
10. Lote repetido sem duplicação; distinção de complementos e de evento de comunicação.
11. Correção preservando ID, bloqueio de revisão antiga e deduplicação do lote corrigido.
12. Data ausente não substituída por hoje; público ausente não convertido em zero; texto com prefixo de fórmula protegido.
13. Leitura de horário do RDAS e IDs únicos a partir de uma única fonte consolidada.
14. Resultado dos leitores de casos e finalizações do motor novo igual ao código de atendimento 4.9 enviado, sobre a mesma base.
15. Identidade vazia bloqueada na API da operação.
16. JavaScript da interface compilado; chamadas apontando para funções existentes no servidor.
17. Publicação dos quadros nos Anexos sem alterar Indicadores ou manifestações; bloqueio de aba manual, backup ao atualizar saída e token sem reutilização.
18. Publicação bloqueada quando fonte ou destino mudam depois da prévia.

## Limites e homologação pendente

Não foram executados no Google: cópias de backup, instalação de gatilhos, autorizações de contas, renderização completa do RDAS com fotos reais, processamento integral do atendimento, publicação de anexos ou medições de latência.

O teste visual automatizado da interface não rodou porque o navegador necessário não estava disponível e o download não pôde ser concluído. Não foram declarados resultados de viewport, captura visual ou uso real de celular. Há layout responsivo, foco, rótulos, estados de erro e redução de movimento no código; esses pontos devem ser verificados no ambiente final.

Foram mantidos os leitores e as regras de atendimento, mas equivalência dos leitores não prova equivalência de todos os efeitos de uma sincronização completa. Por isso o roteiro inclui conferir protocolo, histórico, retorno de execução e finalização na primeira rodada.

O ganho de desempenho ainda precisa ser medido. A redução do trabalho repetido, do tamanho de leitura da interface e dos gatilhos independentes é uma mudança estrutural; não foi convertida em uma promessa de percentual de velocidade.

## Escopo entregue e próxima etapa

**Entregue:** núcleo, fila, leitores/motores compatíveis, operação por janela, cadastro de obras/imóveis, correções, quadros para relatório/Anexos, medições, migração e prompt do aplicativo.

**Ainda não entregue como aplicativo publicado:** login Google com perfis isolados, cliente externo, agenda/checklist unificados, geração completa de diagnóstico/apresentação e uso móvel por URL. Esses recursos estão definidos no prompt para a próxima implementação, sem botões fictícios na operação atual.
