# Mapa dos projetos e dependências

## Aplicação web CPT

Última entrega local: 1.5.0. Projeto separado. Arquivos instaláveis em `01_Aplicacao_CPT_1_5/codigo`: AplicacaoCPT.gs, DadosDaAplicacao.gs, CronogramaCPT.gs, DesempenhoCPT.gs, EntregasCPT.gs, Aplicacao.html, Estilos.html, Agenda.html, Interacoes.html, Entregas.html.

- Entrada: doGet; interface HTML; consultas autenticadas por google.script.run.
- Configuração: propriedade `CPT_APLICACAO_1` com baseId, administrador, agendaId e versão. Cadastros `CPT_PESSOA:<email>`. Não divulgar a propriedade inteira em logs de atendimento ao usuário.
- Lê Registros e Atendimentos do Campo 4.0; lê Movimentações ao consultar o histórico da ficha.
- Agenda separada: Eventos, com versões; Entregas, criada no primeiro salvamento de texto editorial. Precisa preservar agendaId existente, não criar outra planilha só por atualização de código.
- Cadastro atual aceita administrador, gestao, atendimento, socioambiental e comunicacao. Administrativo e comercialização ainda não são perfis independentes.
- Backend usa identidade de quem acessa. Os cadastros controlam a aplicação; as permissões de Drive são independentes.
- A troca de visão é personalização da tela, não troca de identidade e não concessão de permissão.
- Cronograma tem criação, edição, cancelamento, reagendamento, reativação, revisões e exportação selecionada. Não tem recorrência de home office.
- Fichas são importadas e consultáveis; alterações operacionais ainda acontecem no controle anterior.

## Procedimentos de Campo 4.0

Base limpa, diferente do Procedimentos 3.0 e da proposta Campo 5.

- ConfiguracaoDaBase: identidade/configuração/trava.
- CatalogosDeObrasEBairros: manutenção e sincronização dos catálogos.
- DadosIniciaisDoPAC16: catálogo inicial, não estado operacional vivo.
- InstalacaoDaBase e AuditoriaDoFormulario: instalação/checagem do formulário; não executar de novo por rotina.
- AplicarObrasDoRelatorio: recorte aplicado para o relatório de setembro, não repetir como atualização diária permanente.
- ProcessamentoDosEnvios 1.0.1, RepositorioDosRegistros, ConsultasDaBase: operação permanente do novo Forms.
- AuditoriaDaImportacao, ImportacaoDosHistoricos e ImportacaoDosAtendimentos: migração concluída, mantida separadamente para rastreabilidade.

Últimos logs compartilhados: 335 registros históricos, 194 respostas 3.0 conferidas; 33 protocolos, 29 casos principais, 4 incorporados, 24 ativos, 5 concluídos e 80 movimentações. São contagens da importação, não consulta de hoje. Processamento instalado com um gatilho; não houve envio fictício de teste. Pergunta de protocolo não localizada no formulário: vínculo automático de protocolo continua pendente, respostas originais preservadas.

## Atendimentos: cada arquivo tem um destino

| Módulo reunido | Projeto legado de destino |
|---|---|
| 01_Central_Atendimentos_4_9_0.gs | Procedimentos de Campo 3.0 |
| 02_Fichas_Oficiais_3_2_1.gs | Controle de Atendimentos |
| 03_Painel_Atendimento_3_5_1.gs | Controle de Atendimentos |
| 04_Painel_Executivo_1_5_1.gs | Execução de Atendimentos |
| 05_Comunicacao_Atendimento_4_0_2.gs | Controle de Atendimentos |

Não colar os cinco no novo Campo 4.0 nem no web app. A combinação resulta das entregas Água e correção de 28/09. A correção preserva históricos de manifestações e lista protocolo/nome/assunto dos casos concluídos no dia. Não reexecutar envios de mensagens durante a migração. Os 38 casos históricos restaurados nos anexos são um conjunto distinto das cinco conclusões reconhecidas na importação da carteira: não confundir essas contagens.

## RDAS

Permanece uma planilha separada, acessível internamente. O visualizador 1.2 lê fichas nativas. O produtor/sincronizador 1.5 é legado do Procedimentos 3.0. A existência dos códigos não prova que novos envios do Campo 4.0 estão alimentando o RDAS: adaptar e validar essa ligação é uma pendência explícita. Versões anteriores 1.0/1.1 e módulos de fotos estão no arquivo histórico.

## Central anterior, Gestão e Administrador

São referências funcionais para integrar ao web app sem abrir várias janelas: galeria progressiva e extras, contatos, cronograma, Programa Parceiros, anexos, sínteses, diagnósticos e Cleber. Não instalar seus motores inteiros junto com os novos por nomes semelhantes. O administrador legado incluía rotação de home office: requisito revogado; não reintroduzir.

## Recursos externos conhecidos

- Apps Script da aplicação: https://script.google.com/home/projects/1B2gVRbnDP9E4tdecW7lknY5Wq8QlRbmjXXenx-8cOPQX0wBmePmWUhML/edit
- Base Campo 4.0: https://docs.google.com/spreadsheets/d/1vmFipKi9UKvnhuD4Jpfu10rJiBrmI-FnmqMs-yr4jA0/edit
- Forms 4.0 (edição): https://docs.google.com/forms/d/1Kn4UHCkfs-tYKFrhfz7scyq8voKyLt-UoM79Oo8sZ24/edit
- Pasta Campo 4.0: https://drive.google.com/drive/folders/1CCILSeDxSsHyMiKcf5CGIEmqHlP18cqv
- Central CPT anterior: https://docs.google.com/spreadsheets/d/18Hzcw0amILZBUcy8D952YwJarM6mj16Q8Vg_pei6UmU/edit
- Anexos oficiais: https://docs.google.com/spreadsheets/d/1Et4M0nr4CxlRj7J6EDoru91aC4PJ-G2Y/edit
- Máscara Programa Parceiros: https://docs.google.com/spreadsheets/d/1ekpoNrPSdIbc18YxWp5ncQsTiWluS--m/edit
- Controle Contrato Santo André: https://docs.google.com/spreadsheets/d/1pQJ5B8wRzsdlU8udlh9ZzcWXozT3BOh4/edit

IDs de RDAS, Controle/Execução, pastas de fotos, modelos oficiais, agenda e URL /exec publicada devem ser conferidos nos códigos/configurações e na implantação existente. Não deduzir a URL publicada a partir do ID do projeto.
