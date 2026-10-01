# CPT Campo 5.0 — base para a próxima aplicação

Esta entrega refatora o projeto Apps Script de **Procedimentos de Campo**. Inclui uma operação simples de cadastro, uma fila de automações e os motores necessários de RDAS e atendimento. **Não é ainda o aplicativo definitivo com login e acesso pelo celular.** A especificação desse aplicativo está em `PROMPT_UNICO_CPT.md`.

Nenhuma alteração deste pacote foi executada nas planilhas online. Os testes foram locais, com os arquivos enviados e simulações das APIs do Google. Faça a troca após fechar o relatório em andamento e confira a primeira execução no seu ambiente.

## O que muda

| Parte | Comportamento desta versão |
|---|---|
| Navegação da planilha | Três abas visíveis: Operação, Relatório e a aba original do formulário. |
| Respostas e históricos | Preservados. A Base Consolidada mantém os IDs e os 328 registros enviados. |
| Novas respostas | Ingestão em lotes de até 100 linhas, com cursor e retomada. |
| Consulta do mês | Índice de 21 colunas; resumo em cache por até 120 segundos, invalidado ao reindexar. |
| RDAS | Reprocessa as datas afetadas; conserva o layout clássico e as fotos. Monta uma ficha temporária antes de substituir a anterior. |
| Atendimento | Mantém as regras 4.9 de casos, execução e finalização. Processa a fila existente do painel; revisa prazos uma vez por dia e atualiza por eventos externos. |
| Traçado e comunicados | Cadastro e correção pela janela, com obra, imóvel, complemento, classificação e data; lotes de até 100 imóveis. |
| Entregas | Quadro separado por obra; publicação mensal, com prévia, das duas saídas nos Anexos oficiais. |
| Indicadores 2026 | Não são alterados por este pacote. |
| Velocidade | Medições no servidor, tempo de ida e volta na janela, mediana, P95 e falhas. |

Poucas abas **visíveis** não significa guardar tudo em três tabelas. Os controles técnicos e os históricos continuam ocultos. A janela não carrega fotos nem a base completa para mostrar a página inicial.

## Instalação, na ordem

### 1. Preserve o código anterior e faça o backup

1. Abra **Procedimentos de Campo → Extensões → Apps Script**. O ID esperado é `1_6BKqeVbjzKm_hYdRsneU3YqEmd1rOWaVGCiV0LXtgQ`.
2. Antes de apagar qualquer código, guarde uma cópia de **todos** os arquivos do projeto e anote os gatilhos. Os oito códigos enviados estão incluídos em `referencia_original.zip`, mas podem existir outros módulos no projeto online.
3. Acrescente somente `01_Campo_Base.gs` ao projeto antigo. Ele usa nomes próprios e não instala gatilhos sozinho.
4. Execute `auditarCampo5()` e depois `criarBackupCampo5()`.
5. Autorize o acesso às planilhas. A função copia Procedimentos, RDAS, Controle de Atendimentos, Execução, Pesquisa final, Anexos, Máscara e Central CPT. Confira a pasta indicada no registro de execução.
6. Se o tempo de execução terminar no meio do backup, execute a mesma função novamente. Ela retoma os arquivos restantes. Não prossiga enquanto não aparecer **Backup concluído**.

As cópias verificam nomes e dimensões das abas. Isso não é uma verificação criptográfica de todas as células. A pasta também contém inventários por arquivo. Documentos, vídeos e fotos já vinculados continuam em suas pastas originais; não são duplicados pelo backup. Guarde os códigos separadamente para viabilizar o retorno completo.

### 2. Substitua o projeto de Procedimentos

1. Mantenha `01_Campo_Base.gs` e remova os arquivos antigos **desse projeto**, após o backup.
2. Adicione os outros cinco arquivos `.gs`: `02` a `06`.
3. Crie um arquivo HTML chamado **Campo** e cole o conteúdo de `Campo.html`.
4. Nas configurações do projeto, use o fuso **America/Sao_Paulo** e o runtime V8.
5. Salve e execute `instalarCampo5()` pela mesma conta que administrava os gatilhos anteriores. O backup deve ter menos de 24 horas.
6. Reabra a planilha e acesse **CPT Campo → Abrir operação**.

Não cole os motores novos ao lado dos antigos: existem nomes de funções compartilhados. Não execute os instaladores antigos depois da troca.

A instalação substitui os gatilhos deste projeto, visíveis à conta instaladora, por oito gatilhos: abertura, três envios de formulário, três edições e um worker por minuto. Gatilhos de outros projetos permanecem. Se outra conta também instalou automações neste projeto, ela precisa remover suas cópias para não haver duas rotinas concorrentes.

**Não remova nem substitua os códigos das planilhas RDAS, Controle de Atendimentos, Gestão ou Central CPT com estes seis arquivos.** Eles pertencem somente à origem Procedimentos. A consulta executiva do RDAS e o Painel de Atendimento continuam nos próprios projetos.

### 3. Habilite os colaboradores da janela

A conta instaladora fica em `C5_OWNER`. Para outros editores autorizados, crie a propriedade de script `C5_EDITORES` com uma lista JSON, por exemplo:

```json
["colaboradora@empresa.com.br", "colaborador@empresa.com.br"]
```

Use os e-mails reais e mantenha as permissões do Google Drive necessárias. A janela exige e-mail identificável; não aceita uma identidade vazia como administrador. Essa lista não substitui permissões dos arquivos nem transforma a planilha em um sistema com isolamento por funcionário.

### 4. Confira a primeira execução

- A origem enviada tinha 187 respostas e 328 registros consolidados. Se recebeu novas respostas depois do envio, a contagem poderá ser maior.
- Aguarde o cursor alcançar a última linha do formulário. A primeira leitura ocorre em lotes, sem apagar os registros existentes.
- Verifique a fila na janela. Use **Processar pendências agora** para uma rodada manual.
- Confira uma ficha de atendimento conhecida, sua situação, histórico e protocolo; confira também um retorno de execução e uma finalização.
- Faça um registro real de atividade e confira o RDAS da **data de realização**, inclusive quando o envio é retroativo.
- Cadastre uma obra, dois imóveis, repita o lote e confirme que aparecem como já existentes.
- Abra o quadro exportado, confira os campos e só depois confirme a publicação mensal nos Anexos.

Não crie atendimentos fictícios de teste na base oficial.

## Como fechar e iniciar períodos

Escolha o mês na janela e use **Atualizar página Relatório**. Essa página é uma visão derivada do mês selecionado; não é o documento narrativo completo. As antigas páginas `Relatório AAAA-MM` ficam ocultas, preservadas para referência.

Para entrar em um novo período, faça backup e mude o mês. Não é necessário apagar as respostas ou reiniciar a numeração. **Não ordene, remova ou mova linhas da aba ligada ao Forms.** Os IDs atuais dependem da linha original; alterações na posição são bloqueadas quando o carimbo não confere. Filtre pela aplicação ou crie cópias para análise.

Se quiser remover páginas antigas, a função opcional `removerPaginasAntigasCampo5()` apaga somente uma lista fechada de páginas derivadas. Exige backup recente. Ela preserva Respostas, Base Consolidada, importações históricas, ficha histórica de atendimento, base de contatos e registros de documentos. Ocultar já é suficiente para simplificar o uso; apagar abas não é a principal otimização.

## RDAS e atendimento

O renderizador clássico do RDAS foi reduzido às rotinas de leitura e geração. A fonte única passa a ser a Base Consolidada, incluindo os históricos 1.0, 2.0 e os registros atuais, com identidade por ID. A instalação não manda reconstruir todo o RDAS passado.

Datas cujo conteúdo mudou entram na fila. Se uma edição retirar o último relato de uma data, a tarefa é marcada para revisão: a ficha antiga não é apagada silenciosamente. Se houver falhas em miniaturas, os links permanecem e o registro da execução informa a quantidade; confira essas fichas. Dias com muitas fotos ainda podem ser lentos. O limite de três tarefas por rodada não garante que uma única ficha muito grande caiba no tempo do Apps Script.

Em **Saúde da base → Regerar uma ficha do RDAS**, é possível solicitar nova tentativa para uma data. A promoção da ficha temporária muda o identificador interno da aba diária: links antigos com `gid` específico podem precisar ser atualizados. O ID do arquivo RDAS e o nome da ficha diária permanecem; integrações devem localizar a aba pelo nome/data.

O motor de atendimento preserva as regras de negócio existentes e continua materializando as páginas do Controle de Atendimentos. Isso ainda tem custo; foi reduzida a frequência de reconstruções, não reescrita toda a regra operacional do fluxo. A mensagem diária e as fichas oficiais continuam a cargo do projeto **Controle de Atendimentos**.

Na pasta `complementos_controle_atendimentos` estão as versões já corrigidas `02_Fichas_Oficiais_3_2_1.gs` e `05_Comunicacao_Atendimento_4_0_2.gs`. **Se já estão instaladas, mantenha como está.** Elas preservam os casos antigos nos Anexos e detalham os concluídos do dia. Se ainda não foram instaladas, substitua somente os módulos correspondentes no projeto do Controle e execute `corrigirHistoricoManifestacoesEAtualizarMensagem()`, conforme a entrega anterior. Não execute reset da carteira.

## Traçado, comunicados e Anexos

1. Cadastre a obra uma vez, com título, bairro e endereço; CT é opcional até haver informação oficial.
2. Em **Adicionar imóveis em lote**, escolha traçado ou comunicado, obra, data e tipo/abordagem.
3. Cole do Excel três colunas: logradouro, número e complemento. Também pode usar `Rua Exemplo;25;Casa A`.
4. Confira a prévia. Cada linha permite ajustar seus campos antes de salvar.
5. Em **Preparar entregas**, consulte os registros salvos para corrigir um imóvel. A revisão impede que uma gravação antiga sobreponha uma correção recente.

Traçado e comunicação são entidades diferentes: cadastrar uma casa no traçado **não prova que ela foi comunicada**. O sistema não inventa a comunicação. Número e complemento diferenciam, por exemplo, as casas 19A, 19B e uma casa sem número.

**Gerar quadro de imóveis** cria uma planilha separada, no padrão das quatro colunas enviadas, para a obra selecionada. **Publicar nos Anexos** prepara todas as obras daquele mês em blocos, apresenta a prévia e só grava após a confirmação. A atualização é limitada às abas `Levantamento de Traçado` e `Relação de imóveis comunicados`, marcadas como saídas desta automação. Não substitui uma aba manual com o mesmo nome. Antes de atualizar uma saída existente, faz uma cópia do arquivo Anexos. A rotina não toca Indicadores, Matriz de Contatos nem Controle de manifestações.

A Máscara do Programa Parceiros permanece no fluxo atual da Gestão. Não foi recriado um publicador genérico de células nesta base: isso duplicaria a responsabilidade de publicação e poderia conflitar com campos revisados pela gestão.

## Limites desta etapa

- A janela incluída abre pelo Sheets no computador. O layout é responsivo, mas **não é um aplicativo móvel publicado**. Não adicione `doGet()` aos motores atuais sem preparar autorização e restringir as funções acessíveis.
- O futuro app terá login Google, perfis, agenda, checklist e telas de diagnóstico. O prompt especifica esses recursos, que não devem ser confundidos com funções já implementadas aqui.
- Edições manuais na Base Consolidada não são o fluxo recomendado. Se uma correção administrativa autorizada ocorrer nela, rode `reconstruirIndiceCampo5()` e enfileire as entregas afetadas. Edições na aba de respostas são detectadas pelo gatilho instalado, sem permitir troca de identidade.
- Escritas feitas por outros scripts nas respostas não disparam o gatilho de edição. Novas linhas serão captadas pelo cursor; correções antigas feitas por script exigem sinalização/reprocessamento administrativo.
- A conta que instala a fila precisa conservar acesso às fontes. Consulte falhas em **Execuções** no Apps Script e em **Saúde da base**.
- A sintaxe da interface e seus endpoints foram verificados, mas a renderização visual em navegador não pôde ser executada neste ambiente. Confira os tamanhos de janela e o fluxo com um colaborador antes de distribuir. A responsividade implementada em CSS não substitui essa homologação.
- Backups criados durante edição simultânea podem capturar momentos diferentes das planilhas. Faça a troca em uma pausa operacional curta, depois do fechamento do relatório.

## Retorno à versão anterior

Remova os gatilhos Campo 5 da conta instaladora, restaure os arquivos `.gs` anteriores e reinstale somente o orquestrador antigo necessário. Não limpe as fichas nem as fontes. Se precisar restaurar células de um backup, faça isso na planilha original para conservar IDs de arquivos e vínculos; trocar todos os arquivos por cópias exige remapear os IDs. Os backups não restauram automaticamente gatilhos ou permissões.
