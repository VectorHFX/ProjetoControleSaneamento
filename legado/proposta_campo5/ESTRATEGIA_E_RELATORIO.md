# Estratégia para a nova CPT

## Parecer

É viável construir uma aplicação web responsiva com ferramentas Google já liberadas, sem contratar uma plataforma adicional. Para esta escala, a primeira escolha é Apps Script + HTML/CSS/JavaScript, com Sheets como persistência e Drive para documentos e mídia. A viabilidade depende das permissões do domínio, das cotas da conta e dos tempos medidos no uso real. Um aplicativo nativo não resolveria por si só a demora das automações.

Recomendo **Procedimentos como origem operacional** e **CPT como identidade e porta de entrada**. A aplicação deve ter um projeto Apps Script próprio e uma URL única. Assim, o aplicativo não herda a navegação nem as dezenas de funções públicas dos motores atuais. Os jobs de integração continuam executando em segundo plano; abrir uma página não deve disparar reconstruções.

Não é preciso escolher entre colocar toda a aplicação dentro de Procedimentos ou dentro da Central. A interface pode ser independente e consumir serviços pequenos, com contratos definidos, enquanto os arquivos mantêm seus papéis.

## O que os arquivos mostram

O Procedimentos enviado contém 28 abas, 187 respostas atuais e 328 registros na Base Consolidada: 99 do histórico 1.0, 42 do histórico 2.0 e 187 atuais. Os registros são 162 relatos, 63 pesquisas de satisfação, 55 fichas de atendimento, 40 cautelares, cinco diagnósticos e três registros de contatos/oportunidades. Contagens de linhas não representam pessoas únicas ou casos ativos na carteira.

A base possui 177 colunas; o formulário atual possui 168. Há nomes e posições diferentes, principalmente em fotos e metadados de migração. Portanto, copiar colunas por posição seria arriscado. A refatoração relaciona cabeçalhos pelo nome e preserva os IDs atuais.

O levantamento de traçado enviado é um **modelo**, sem lista preenchida de imóveis. Tem uma folha de traçado e uma de imóveis comunicados, ambas com logradouro, número, tipo/abordagem e data; frente/CT aparece no cabeçalho. Não há dados de imóveis a migrar desse arquivo.

Nos códigos enviados, há várias reconstruções de abas e gatilhos independentes. O relatório mensal, por exemplo, instala um agendamento de cinco minutos; atendimento possui sincronização de quinze minutos e fila de um minuto. Remover esse trabalho repetido é mais relevante que trocar `for` por `map`. `Map` como índice de busca pode eliminar pesquisas aninhadas; `map()` como operação sobre um array não é automaticamente mais rápido que um loop.

## Organização dos dados

| Entidade | Identidade e vínculo | Uso |
|---|---|---|
| Obra | `obra_id` estável; título, CT, bairro, endereço e fase revisáveis | Referência comum para todo o território. |
| Trecho e imóvel | Obra + logradouro + número + complemento; futuro ID próprio de imóvel | Traçado, visitas e evolução da comunicação. |
| Comunicação ao imóvel | Evento com data, abordagem, responsável e imóvel | Evita confundir imóvel levantado com imóvel efetivamente comunicado. |
| Procedimento | ID preservado da fonte + data realizada + obra confirmada | Relatos, diagnóstico, cautelar, pesquisa e oportunidades. |
| Atividade planejada | Um ID visto na agenda, cronograma e checklist | Responsável, prazo, situação, checklist e participação das frentes. |
| Evidência | ID/link Drive, legenda, data, tipo e vínculo ao registro | Foto, vídeo, documento e lista de presença. |
| Atendimento | Protocolo e eventos acumulados | Abertura, execução, comunicação, encerramento, ficha e mensagem diária. |
| Entrega mensal | Mês, versão, fontes, revisões e publicação | Evita alterar silenciosamente um relatório já fechado. |

A etapa entregue mantém a Base Consolidada larga por compatibilidade. O índice reduz a carga das consultas, mas não transforma Sheets em banco transacional. A próxima etapa deve introduzir entidades normalizadas onde houver ganho concreto, com migração explícita. Não se deve dividir cada pequena informação em uma nova planilha visível.

O vínculo retroativo dos registros com obras precisa de confirmação. Títulos e endereços semelhantes podem sugerir candidatos; não devem fundir obras automaticamente. Os novos cadastros de imóveis já exigem obra. O ID do imóvel ainda representa o registro de levantamento/comunicação desta etapa, não um cadastro imobiliário universal com todas as visitas agrupadas.

## Como responder ao relatório

| Exigência dos documentos enviados | Base necessária | Saída desejada no aplicativo |
|---|---|---|
| 1. Áreas de trabalho | Cadastro de obras, datas oficiais, fase, impacto e início da comunicação | Quadro mensal com mudanças e fonte da atualização. |
| 2. Diagnóstico das áreas | Diagnósticos, contexto do território e versão anterior | Texto base + síntese editável; referência ao mês do diagnóstico anterior. |
| 2.1. Matriz de contatos | Contatos institucionais, lideranças e atualização | Lista geral organizada e indicação do anexo. |
| 3. Atividades do período | Relatos com obra, data, ferramenta, público e participantes | Tabela conciliada com indicadores e Programa Parceiros. |
| 3.1. Descrição por frente | Relatos e evidências ligados à obra | Narrativa revisável, fotos selecionadas e listas de presença vinculadas. |
| 4. Ações socioambientais | Eixos: reuniões/CAO, resíduos, saúde hídrica, educação e governança | Conteúdo por eixo, resultados observados e limites da evidência. |
| 5. Material audiovisual | Mídias, legendas, data, atividade e autorização de uso quando aplicável | Galeria para seleção; carregamento progressivo e vídeo sob demanda. |
| 6. Imprensa regional | Veículos, contatos, oportunidades e registros | Quadro de articulação da Comunicação. |
| 7. UMS | Atividades e evidências de uso da unidade móvel | Seção específica sem inferir uso apenas pela presença de uma tenda. |
| 8. Obras concluídas | Conclusão informada pela engenharia, data e fonte | Quadro de encerramento e acompanhamento socioambiental. |
| 9. Atividades complementares | Registros classificados e justificativa | Texto e tabela próprios, sem inflar as ações de campo. |
| 10. Manifestações | Protocolos acumulados, situação, providência e datas | Quadro e fichas; concluídos do mês com protocolo, nome e assunto. |
| 11. Equipe | Pessoas, funções, vínculo e vigência | Equipe do período e organograma configurável. |
| 12. Próximo período | Cronograma, agenda e checklist compartilhados | Plano com responsáveis e recortes de exportação. |
| 13. Anexos | Registro de documentos publicados e versões | Relação ordenada, capas e verificação de anexos ausentes. |

O orientador exige coerência entre o total de ações/participantes do texto, da planilha de resultados e do Programa Parceiros. Isso pede um catálogo de indicadores com regra explícita e rastreabilidade. Não se deve preencher zero quando a fonte está incompleta. Média de notas de saneamento não deve ser chamada de NPS.

Os PDFs pedem síntese e evidência, além de tabelas. O sistema deve ajudar a redigir a partir dos registros, mas a avaliação da gestão precisa continuar editável e identificada. Sem contratar IA, é possível gerar um texto base determinístico e organizar os relatos; não prometer análise generativa automática sem serviço autorizado.

## Login e celular

Use conta Google corporativa, não senhas próprias distribuídas por e-mail. O servidor deve verificar identidade e permissão em cada operação. Os perfis podem ser administração, gestão, atendimento, socioambiental, comunicação e cliente, com direitos explícitos.

Existem duas configurações principais no Apps Script:

- **Executar como usuário:** facilita identificar o usuário, mas as ações dependem das permissões desse usuário nas fontes. Não resolve isolamento de dados se todos forem editores da base inteira.
- **Executar como implantador:** centraliza permissões, mas a disponibilidade do e-mail do usuário depende do contexto e do domínio. Deve ser validada com uma conta real de colaborador. E-mail vazio deve bloquear acesso. Não usar o e-mail do implantador como se fosse o visitante.

Para cliente externo, separar uma base/publicação somente de leitura, com campos aprovados, costuma ser mais simples de controlar. Não basta ocultar dados pessoais na interface: eles não devem ser enviados ao navegador desse perfil.

O web app abre pelo navegador do celular, com uma URL. A janela modal do Sheets não deve ser a porta de entrada móvel. Funcionamento offline, sincronização posterior e instalação como PWA são etapas adicionais, não garantias automáticas do Apps Script. A primeira versão deve funcionar bem online em Chrome/Android e Safari/iPhone.

## Medir desempenho

O pacote registra ingestão, reindexação, RDAS, atendimento, relatório e falhas. A janela mostra tempo do servidor e ida/volta; a página Saúde da base calcula mediana e P95. O log conserva as 2.000 medições mais recentes. Dados brutos de moradores não são gravados nos logs de desempenho.

Compare uma semana antes/depois, separando primeira abertura, retorno à mesma tela, mês com muitos registros e dia com muitas fotos. Metas para homologar, não promessas: tela inicial utilizável em até três segundos no desktop e cinco no celular em conexão estável; buscas usuais até dois segundos; gravação simples até três segundos; exportações pesadas em segundo plano com estado visível. Registre quantas amostras sustentam cada avaliação.

Cache acelera repetição; não deve ser a única cópia de fila, alterações ou permissões. A fila nova é persistente e tem versões, tentativa, erro e retomada. Ainda existem limites: renderização de dias grandes no RDAS e reconstrução da carteira no motor preservado devem ser medidos antes de uma refatoração mais profunda.

## Fontes técnicas verificadas

- Boas práticas, lotes e cache: https://developers.google.com/apps-script/guides/support/best-practices
- Comunicação assíncrona do HTML: https://developers.google.com/apps-script/guides/html/communication
- Aplicações web e identidade de execução: https://developers.google.com/apps-script/guides/web
- Disponibilidade do e-mail de sessão: https://developers.google.com/apps-script/reference/base/session
- Cotas: https://developers.google.com/apps-script/guides/services/quotas

Revisão: 28/09/2026. O projeto não exige Firebase, banco pago, AppSheet contratado, hospedagem externa ou API de IA. A aprovação administrativa dos serviços e a homologação das permissões continuam sendo necessárias.
