# Campo 4.0 — operação permanente 1.0.0

Victor, a importação terminou. Agora a base passa a receber os novos envios sem refazer o histórico. Este pacote acrescenta três arquivos permanentes ao mesmo projeto Apps Script em que você instalou o Campo 4.0.

## Instalação curta

1. No **projeto novo do Campo 4.0**, crie três arquivos de script com os nomes abaixo. Cole o conteúdo completo de cada arquivo correspondente do pacote.
2. Execute **`instalarProcessamentoCampo40`** pela sua conta. Autorize os acessos solicitados pelo próprio Google.
3. Execute **`processarEnviosPendentesCampo40`**. Ela incorpora somente respostas reais que já existam no formulário novo. Se não houver nenhuma, não cria linha alguma.

Não execute `aoReceberEnvioCampo40` pelo botão Executar: ela recebe o evento automaticamente do Google Forms.

| Arquivo novo | Para que serve |
| --- | --- |
| `RepositorioDosRegistros.gs` | Define os campos, os IDs e a escrita de novos registros, com proteção contra duplicações e alterações locais. |
| `ProcessamentoDosEnvios.gs` | Instala um gatilho de envio, interpreta as respostas, registra falhas e permite retomar envios pendentes. |
| `ConsultasDaBase.gs` | Prepara buscas paginadas, resumo mensal e abertura de um registro ou ficha para a aplicação. |

Os arquivos precisam estar no **mesmo projeto**: as classes se enxergam entre os arquivos `.gs`, como módulos com responsabilidades diferentes. Não cole tudo em um arquivo que já contenha essas mesmas classes.

## O que deve aparecer

A instalação deve registrar `PROCESSAMENTO INSTALADO`, `gatilhosDeEnvio: 1` e `novasAbas: 0`. A retomada deve registrar `ENVIOS REAIS CONFERIDOS`, ou pedir outra execução se houver mais de 40 envios pendentes.

Se o formulário novo ainda não recebeu respostas, `novos: 0` está correto. Os **335 registros importados** que você conferiu permanecem na tabela. Não é necessário criar preenchimento fictício. O fluxo completo, inclusive acesso aos arquivos enviados, ficará confirmado com a primeira resposta operacional real.

Para consultar o estado sem escrever dados, execute **`conferirProcessamentoCampo40`**. Ela informa o último processamento, falhas pendentes e tempo de execução. **`conferirConsultasCampo40`** verifica as consultas sem mostrar nomes de moradores no log.

## O que acontece com os dados

- A aba **Respostas** continua sendo escrita pelo próprio Google Forms. Este código não a edita.
- Cada resposta nova recebe um ID estável em **Registros**, calculado a partir da base, do formulário e do ID da resposta. Repetir uma execução não soma o mesmo envio novamente.
- Perguntas são identificadas pelo **ID do item**, evitando confundir perguntas com títulos iguais. Texto, escolhas múltiplas, grades e outras respostas ficam preservados nos detalhes.
- A obra é vinculada pelo ID entre colchetes da opção escolhida. Nomes parecidos não são unidos automaticamente. Bairros sem identificação e possíveis divergências entre obra e bairro são sinalizados na coluna **Conferência dos campos**.
- A competência vem da **data de realização do procedimento**, não do dia de envio. Datas não reconhecidas são sinalizadas e preservadas no original. A formatação de texto é aplicada antes da escrita para impedir a conversão indesejada de `2026-10` em uma data.
- Fotos e outros uploads são guardados como referências de arquivo. Nenhuma imagem é baixada durante uma busca. As permissões de acesso aos arquivos continuam sendo as do Drive.
- Detalhes grandes são armazenados completos na pasta existente, com o vínculo na célula. Não são cortados para caber no Sheets.
- Registros novos são acrescentados. Não há rotina que limpe a tabela a cada 15 minutos.

Uma resposta editada depois do processamento é arquivada como versão para revisão e sinalizada como pendente, mantendo o registro original. Uma alteração manual na linha consolidada também é preservada e interrompe o reprocessamento daquela resposta. A resolução dessas diferenças precisa de revisão explícita; este módulo não substitui silenciosamente um texto já usado no relatório.

## Atendimentos: limite desta etapa

Os **33 protocolos**, as incorporações, os estados dos casos e as fichas importadas continuam em **Atendimentos** e **Movimentações**. Uma consulta por protocolo incorporado encontra a ficha principal.

Os novos envios de Ficha de Atendimento são registrados em **Registros**, incluindo perguntas e anexos. **Este pacote ainda não cria uma nova ficha operacional, não gera protocolo/PDF e não conclui ou reabre um caso.** Essas ações entrarão no módulo de atendimento da aplicação, com os controles de responsabilidade e confirmação. Portanto, não substitua ainda o fluxo operacional de atendimento em uso por este pacote de ingestão.

Também não há escrita nos anexos do relatório, na máscara do Programa Parceiros ou na central antiga nesta etapa. A publicação dessas entregas será ligada aos módulos próprios da aplicação. Isso evita que uma leitura ou um envio incompleto altere o relatório oficial.

## Retomada e manutenção

Se algum envio falhar, o original permanece no Forms. Corrija a causa mostrada no log e execute **`processarEnviosPendentesCampo40`**. O processamento é retomado pelo ID; não precisa importar o histórico novamente.

Se adicionar/remover perguntas ou mudar seus tipos, execute **`instalarProcessamentoCampo40`** novamente para conferir e atualizar o mapa. Mudar apenas as opções de obras e bairros continua usando os controles de salvar que já instalamos.

**`conferirTodosOsEnviosCampo40`** é uma auditoria extraordinária: reinicia somente a posição de leitura do formulário novo e verifica os envios reais novamente. Não apaga tabelas. Se ela informar retomada parcial, continue com `processarEnviosPendentesCampo40`.

O gatilho é criado na conta que executa a instalação. Use sua conta, Victor. O Google só lista os gatilhos da conta atual; a proteção contra duplicação da instalação não inspeciona gatilhos pertencentes a outras pessoas. Os outros gatilhos deste projeto, inclusive salvar catálogos, não são removidos.

## Código com intenção: o que fica e o que pode sair

Depois de instalar e obter `CONFIGURAÇÃO CONFERIDA`, o projeto **novo** pode ficar com este núcleo de seis arquivos:

| Permanece | Responsabilidade |
| --- | --- |
| `ConfiguracaoDaBase.gs` | Identidade da base, estado instalado, travas e links. |
| `CatalogosDeObrasEBairros.gs` | Cadastro, seleção de opções, salvar e revisões. |
| `AuditoriaDoFormulario.gs` | Conferência de estrutura e rotas; exportação das perguntas. |
| `RepositorioDosRegistros.gs` | Persistência incremental. |
| `ProcessamentoDosEnvios.gs` | Entrada dos envios e recuperação. |
| `ConsultasDaBase.gs` | Leitura para a aplicação. |

Os novos módulos não dependem de `InstalacaoDaBase.gs`, `DadosIniciaisDoPAC16.gs`, `AplicarObrasDoRelatorio.gs`, `AuditoriaDaImportacao.gs`, `ImportacaoDosHistoricos.gs` ou `ImportacaoDosAtendimentos.gs`. Você pode guardar esses seis arquivos junto do material que já possui e retirá-los do **projeto novo**, pois instalação inicial, carga das obras do relatório e migração já foram concluídas. Não execute a migração antiga de novo depois que os novos registros começarem a entrar.

Não remova `CAMPO40_INSTALACAO` das propriedades do projeto: ali estão os vínculos com a base e o formulário. Este pacote usa um estado operacional separado e não apaga os estados da instalação ou da migração.

O aviso antigo de `verificarCampo40` sobre envio de teste é uma recomendação de conferência de ponta a ponta. **A instalação deste pacote não o exige.** Mantemos sua decisão de conferir com a primeira resposta real.

## Consultas preparadas para a aplicação

| Função | Uso |
| --- | --- |
| `consultarRegistrosCampo40({mes: '2026-10', limite: 24})` | Lista até 24 registros leves e devolve um cursor para continuar. Aceita procedimento, obra ID, bairro ID, responsável e busca. |
| `consultarDetalheCampo40('REG-...')` | Abre somente o texto e os anexos do registro escolhido, incluindo detalhes históricos. |
| `consultarFichaCampo40('ATD20260009')` | Consulta a ficha pelo protocolo exato, respeitando incorporações. |
| `consultarResumoCampo40('2026-10')` | Devolve contagens do mês, participações informadas, distribuição por procedimento/obra e a carteira operacional atual. |

A lista começa com 24 itens, permite até 50 e usa blocos de leitura de 200 linhas. Se houver uma busca muito seletiva, uma chamada pode devolver poucos itens e um cursor para continuar: ela não precisa bloquear até varrer toda a base. Novas linhas acrescentadas durante a paginação ficam para a próxima atualização da busca. Ordenar, apagar ou reorganizar linhas manualmente durante a paginação exige reiniciar a busca.

Resumos usam cache de até **30 segundos**. Um novo registro muda a chave do resumo; uma edição manual numa linha existente aparece após o cache expirar. O mapa das perguntas usa cache separado, de até 10 minutos, invalidado ao reinstalar um mapa diferente. Cache é uma aceleração, não uma fonte permanente dos dados.

Os retornos usam texto, números e objetos JSON, sem objetos `Date`, para poderem ser consumidos por `google.script.run`. **Não há aplicação web publicada nem autorização por perfil neste pacote.** A futura interface precisa aplicar seus perfis de acesso antes de expor consultas de fichas e dados pessoais. Os tempos registrados são medições da sua execução, não uma promessa de tempo de resposta da aplicação inteira.

## Preferências levadas para a próxima interface

A próxima camada será a aplicação acessível pelo celular, com poucas páginas e nomes claros. Mantemos azul e branco, acentos vivos, inspiração na água, movimentos leves e opção de reduzir animações. Sem logos; imagens decorativas concentradas nos inícios. Consultas e ferramentas terão funções próprias, textos de ajuda curtos e feedback visível ao salvar.

Ela terá cronograma compartilhado com filtros de exportação, identificação por obra/bairro, diagnóstico com texto base e síntese editável, atendimentos com histórico acumulado, relatório e Programa Parceiros. Para você, permanecem o caderno diário, checklists, Cleber e a revisão das obras; o mascote não deve atrasar nem bloquear o trabalho. Fotos extras continuam separadas do RDAS, com galeria e player carregados quando solicitados.

## Verificação realizada

Testes locais passaram com a cópia histórica disponível de **328 registros e 33 protocolos**, incluindo os **5 casos concluídos**, e com **54 novos envios simulados**. Foram verificados duplicações, perguntas com títulos iguais, mudança de título, interrupção depois da escrita, falhas concorrentes, retomada em lotes, edição de resposta, alteração local, anexos, detalhes extensos, paginação, cache e protocolos incorporados.

Seu log ao vivo já confirmou **335 registros importados**; a fixture local utilizada nos testes é anterior aos últimos sete. Nenhuma resposta real foi criada, nenhuma planilha Google foi alterada por estes testes e o pacote ainda precisa ser instalado por você. O primeiro envio operacional confirmará o comportamento no ambiente Google e o acesso aos uploads restaurados.

Referências técnicas: [eventos do Apps Script](https://developers.google.com/apps-script/guides/triggers/events), [gatilhos instaláveis](https://developers.google.com/apps-script/guides/triggers/installable), [respostas do formulário](https://developers.google.com/apps-script/reference/forms/form-response) e [consulta de respostas por data](https://developers.google.com/apps-script/reference/forms/form).
