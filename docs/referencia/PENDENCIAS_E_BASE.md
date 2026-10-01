# Estado das ferramentas e base ainda necessária

Legenda: “entregue localmente” significa código produzido e testes indicados na versão; não confirma instalação online. “Legado” significa recurso encontrado em sistema anterior, ainda não integrado na aplicação nova.

| Necessidade do documento | Estado e próximo trabalho |
|---|---|
| Acesso por pessoa e frente | Parcial; bloqueio real de colaboradores ainda aberto. Bootstrap de perfil e permissões é prioridade zero. |
| Atendimento consultável e observações para todos | Não atende ao requisito atual. Consulta está restrita; falta consulta comum e eventos de observação. |
| Cronograma mensal compartilhado | Entregue localmente: criar, editar, cancelar com motivo, reagendar, reativar, histórico, mês/semana/lista e exportar seleção. Faltam obras por ID, local/ponto, materiais e articulação virar atividade. |
| Relatos e fotos | Consulta entregue, anexos sob demanda. Preparação editorial 1.5 entregue localmente, com até duas fotos, texto, situação e versões. Não gera narrativa por IA. |
| Diagnóstico: dados, edição, exportação, síntese e Slides | Existe em módulos legados; falta integrar leitura/edição/versionamento/geradores ao Campo 4.0 e à aplicação. |
| Mapa, pontos e endereços de obra | Catálogos iniciais existem. Falta cadastro operacional de pontos e coordenadas confiáveis e mapa. Não inferir coordenadas de nomes semelhantes. |
| Matriz de contatos comum | Legado; falta repositório comum, editor por perfil, observações e uso em cronograma. |
| Recados entre frentes e notificações | Novo; criar destinatários, leitura, estado, vínculo com caso/obra/material e avisos internos. Não enviar e-mail/WhatsApp automaticamente. |
| Articulação, CAO, ações internas/externas e DDS | Preparação genérica de relato existe. Falta modelar classificações, sistematização mensal e vínculo direto com cronograma. |
| Pesquisa: 15 por semana e 60 por mês | Dados/fontes legados; falta painel de metas e regra explícita para semanas que cruzam meses. Tratar 60 mensal como meta independente, sem transformá-la em 75 em mês com cinco semanas. |
| Levantamento de traçado e imóveis comunicados | Falta formulário dentro do app, cadastro por imóvel/frente/visita, importação conferida e exportação no modelo oficial. |
| Editar, mesclar e auditar fichas oficiais | Legado operacional. No app novo, consulta e histórico importado; falta integração transacional com uma fonte oficial definida. |
| Pacote mensal de fichas | Existe no legado. Falta trazer para app, com seleção, competência e controle de geração. |
| Acompanhamento e comunicação de casos | Legado tem fluxo e mensagem diária. Falta integração com novos recados e observações sem duplicar envios. |
| Dashboard de atendimentos | Indicadores básicos no novo; painéis mais completos no legado. Adaptar métricas, prioridades, tempo, reabertura e casos incorporados. |
| Comercialização | Documento não pede ferramentas extras por enquanto. Falta perfil e acesso às ferramentas comuns. |
| Contatos de comunicação, catálogo e notas | Legado parcial; separar contato compartilhado de nota restrita quando necessário. |
| Galeria e importação/exportação de mídias | Galeria/extra/vídeo no legado Central. Falta integrar carregamento progressivo, lote com legenda e data e autorização. Extras são independentes do RDAS. |
| Lembretes de materiais entre Social e Comunicação | Novo; vincular a atividades e recados, com responsáveis e prazos. |
| Pasta de links e acompanhamento de materiais | Novo; cadastrar título, URL validada, observação, autor, prazo, situação e compartilhar por recado. |
| Gestão: visões por frente e do contrato | Parcial; consolidar indicadores explicados, contexto, pendências e resultados reais, sem fabricar impacto. |
| Programa Parceiros, máscara e anexos oficiais | Legado Gestão 3.2; falta integração com dados 4.0 e conferência de modelos. Não alterar Indicadores 2026. |
| Administrativo: todas as ferramentas | Requisito novo de perfil funcional; separar de privilégio de administração técnica. |
| Caderno/checklist pessoal | Legado de Victor/Cleber; falta adaptação multiusuário com isolamento real e histórico. |
| Mascotes e roupas semanais | Cleber legado. Regra nova permite escolher mascote ou roupa semanal; falta multiusuário, catálogo, inventário e lançamentos únicos de recompensa. |
| Recompensas por cinco dias e pontos | Legado tem parte da lógica; documento novo requer contabilizar caderno/checklist e pontos. Definir “dia preenchido”, uso de datas passadas, reabertura e prevenção de duplicação antes de implementar. |
| RDAS separado e alimentado por todos os relatos | Legado disponível. Falta ligação permanente comprovada a novos envios 4.0, com atualização incremental. |
| Planilha externa para cliente | Nova: Consultas de atendimento, Sistematização de relatos, Balanço de atividades socioambientais. Criar projeção conferida, sem notas privadas, mensagens internas ou acesso à base bruta. |
| Bairros/obras somente desde outubro | Regra decidida, ainda não implementada no pacote 1.5. Aplicar pelo dia de realização a partir de 01/10/2026. Histórico anterior mantém seus textos, sem reenquadramento automático. |

## Fontes que já existem

Campo 4.0: Registros, Atendimentos e Movimentações importados; Respostas vinculada ao formulário; Obras e Bairros; parâmetros em propriedades. Agenda: Eventos e Entregas (esta última criada ao salvar). Perfis em propriedades. Confirmar nomes e cabeçalhos na base viva antes de escrever.

O formulário foi conferido com 150 perguntas e 23 seções. Não reconstruir esse roteiro conversacional, nem criar respostas fictícias para testar. Catálogos são editáveis; a atualização de escolhas do formulário precisa respeitar o salvamento/sincronização já existente.

## Estrutura proposta, ainda não criada

Essas são entidades lógicas, não uma ordem para criar uma aba por tela. Reaproveitar tabelas adequadas, manter poucas páginas visíveis e separar arquivos apenas quando houver necessidade real de permissão ou volume.

| Entidade | Campos e regra essenciais |
|---|---|
| Pessoas e papéis | ID, e-mail normalizado, nome, frente, ativo, papéis, versão e autor da alteração. Bootstrap independente de leitura de indicadores. |
| Obras e pontos | Obra ID estável, nomes/aliases, status, vigência, bairros associados, endereço, coordenadas verificadas, fonte, revisão diária e autor. Não fundir obras apenas por nome parecido. |
| Relação atividade/território | Registro ID, obra ID, bairro ID, data de realização, validade da referência, texto original preservado e estado de conferência. |
| Atendimentos | Um caso principal e protocolos associados; estado corrente, responsável, prioridade, versão. Fonte oficial única antes de habilitar edição no novo app. |
| Eventos de caso | ID/operação, protocolo, ação, autor, instante, antes/depois ou versão, motivo; distinguir observação de alteração oficial. |
| Contatos | ID, nome/organização, tipo interno/externo, canais, território, responsável, ativo, visibilidade e versões. |
| Recados | ID, remetente, destinatários/frentes, texto, vínculos, criado em, leitura por usuário, situação e prazo. |
| Materiais e links | ID, tipo, título, URL validada, observação, responsável, prazo, conclusão, revisões, vínculo com atividade/recado. |
| Mídias | ID, Drive ID, origem RDAS/extra, data padronizada, tema livre, legenda, atividade/obra se aplicável, autor, MIME e visibilidade. Arquivos no Drive, sem base64 gigante em célula. |
| Traçado e comunicados | Imóvel ID, frente, rua/número/complemento, visita, abordagem real ou simulada explicitamente identificada, autor, evidência e versão. Não contar simulações como campo realizado. |
| Caderno/checklist | Proprietário autenticado, data, notas, itens com IDs, conclusão/reabertura e revisão. Não confiar em e-mail enviado pelo navegador para definir proprietário. |
| Recompensas | Lançamento único por usuário/regra/período, pontos, desbloqueios, inventário e item equipado. Alterar uma marcação não deve gerar pontos repetidos. |
| Fila de entregas | Pedido ID, origem/versão, competência, produto, tentativa, situação, arquivo resultante e erro legível. Repetir pedido não duplica documentos ou mensagens. |
| Publicação para cliente | Competência, versão publicada, campos permitidos, origem, conferente e data. Sem copiar segredos ou comentários internos. |

## Ordem de execução

1. Resolver acesso real e fechar matriz de permissões com os novos perfis. Testar uma colaboradora, sem conceder acesso administrativo para contornar falhas.
2. Implementar vigência de referências em outubro e comprovar processamento incremental dos novos envios; conferir vínculo de atendimento ausente.
3. Consolidar cronograma/obras/pontos e contatos, formando a base compartilhada de trabalho.
4. Integrar consulta/observações de casos para todos; depois edição oficial, mesclagem e exportação com fonte única.
5. Integrar RDAS, diagnósticos, entregas mensais, máscara e anexos com rastreabilidade e versões.
6. Comunicação: galeria extras/vídeo, materiais, links, lembretes e recados.
7. Caderno/checklist pessoal e mascotes multiusuário.
8. Publicação controlada da planilha destinada à cliente e indicadores explicados.

## Desempenho e aceite

- Medir abertura, consulta, digitação, salvamento e geração separadamente; informar volume, rede/aparelho e tempo de servidor quando disponível. Não prometer redução sem comparar.
- Digitar não deve consultar o servidor nem reconstruir o formulário. Buscas com atraso curto, paginação e resposta antiga descartada.
- Dados por mês/obra com índices quando volume justificar; leituras e escritas em lote, arquivos/fotos sob demanda, miniaturas progressivas e cache com escopo/expiração/invalidação seguros.
- Bloqueio de concorrência, operação idempotente, histórico e autorização no servidor para qualquer gravação.
- Formulários e documentos oficiais mantêm formato. Evitar reconstrução total por gatilhos de 5/15 minutos.
- Verificar nomes semelhantes, mudança de competência, mês vazio, erro de permissão, conexão perdida, envio repetido, duas edições simultâneas e acesso no celular.
