# Bloqueio prioritário: colaboradores

## Evidências disponíveis

Victor entra. Colaboradores relatam rótulo Administrativo/Administrador, acesso negado e impossibilidade de mudar a visão. Não recebemos a mensagem integral exibida pela conta afetada, a URL /exec utilizada, nem a configuração da versão publicada.

No código local 1.5, Aplicacao.html inicia roleView com uma única opção Administrador. Interacoes.html chama configureProfile somente depois de carregarInicioCPT ter sucesso. AplicacaoCPT.contexto tenta abrir a base antes de devolver o perfil. Logo, uma falha de leitura pode deixar o seletor inicial parado em Administrador. O código local diz Administrador, não Administrativo; se o texto visto for diferente, conferir a versão implantada. Isso é um defeito de apresentação confirmado no código, não prova de elevação de privilégios nem diagnóstico definitivo da permissão.

## Verificação para concluir a causa

1. Confirmar que a colaboradora abre o link publicado /exec, da implantação existente e versão pretendida, na conta corporativa cadastrada.
2. Conferir e-mail exato, ativo e papéis no projeto que atende esse link. Cadastro em outro projeto não se transfere automaticamente.
3. Conferir público da implantação e execução como usuário que acessa, conforme o modelo atual; não trocar silenciosamente para proprietário nem público anônimo.
4. Rodar Conferir meu acesso no erro da tela com a conta da colaboradora. O diagnóstico de Victor só comprova o acesso de Victor.
5. Identificar a etapa: login/consentimento Google, cadastro da aplicação, leitura da base, leitura da agenda, edição da agenda ou arquivos de mídia. O teste atual de agenda é só de leitura.
6. Se não abrir o HTML, a investigação começa pela implantação, conta, autorização e política corporativa. O código de diagnóstico interno ainda não está executando nesse cenário.

## Correção de arquitetura a fazer

Separar bootstrap de identidade/perfil da carga dos dados. Mostrar “Verificando acesso” com seletor desabilitado até obter perfil real. Se houver falha, mostrar etapa e instrução específica; não presumir papel administrador. Só depois carregar os módulos permitidos, cada um com erro isolado. A falha de uma galeria não deve bloquear cadastro ou cronograma.

Tratar administrador técnico e administrativo como conceitos distintos. O documento novo pede Administrativo com acesso funcional completo; isso não significa automaticamente permissão para conceder privilégios administrativos ou alterar configuração técnica. A matriz precisa registrar essa distinção.

A nova regra de negócio pede consulta e observações de atendimentos para toda a equipe. O backend atual restringe a consulta a Atendimento/Gestão/Administração técnica. É necessário implementar consulta comum com campos e ações adequados, mantendo edição oficial/mesclagem/finalização no Atendimento e gestão autorizada. Observação da equipe deve ser um evento, não uma sobrescrita do relato original.

## Limite da segurança atual

Executar como usuário exige as permissões correspondentes nos recursos Google. Dar leitura na base inteira permite ler dados diretamente fora do app; ocultar uma tela não protege a planilha. Não ampliar compartilhamentos de dados sensíveis apenas para fazer o erro desaparecer. Definir recortes de consulta ou uma camada de dados autorizada compatível com as ferramentas Google liberadas pela empresa. A decisão exige teste com a identidade real de uma colaboradora.

## Critérios de aceite

- Colaboradora vê sua identidade e papel reais, nunca o placeholder administrativo.
- Acesso permitido funciona e o negado explica a etapa, sem ciclo infinito.
- Visão escolhida não altera identidade nem amplia os papéis.
- Conta não cadastrada permanece bloqueada.
- Consultas comuns e ações exclusivas obedecem à matriz definida no servidor.
- Cadastro de pessoa não exige nova implantação por pessoa.

Este documento registra o bloqueio e o caminho de correção. O acesso online não foi corrigido nesta consolidação.
