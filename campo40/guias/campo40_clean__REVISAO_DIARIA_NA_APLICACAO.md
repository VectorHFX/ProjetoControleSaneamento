# Tarefa diária de Victor: revisar as obras

Requisito confirmado para a aplicação final do CPT / Procedimentos de Campo 4.0. O responsável inicial é Victor Xavier, administrador. A revisão usa o cadastro compartilhado de obras e alimenta o formulário, o relatório e a futura visão de mapa.

Ao abrir o caderno/checklist do dia, mostrar **Revisar obras de hoje**, com data brasileira e situação **A revisar** ou **Revisado às HH:mm**. Mostrar primeiro obras em andamento e paralisadas, identificando nome/trecho, bairro e última atualização. Histórico e finalizadas ficam em consulta separada dentro da mesma ferramenta.

Ações:

- **Manter como está:** confirmação explícita sem alterações. Marca a tarefa do dia e registra revisão.
- **Alterar situação:** em andamento, paralisada ou finalizada. Finalizada sai das opções do formulário e permanece no histórico; paralisada continua disponível.
- **Retomar obra:** conserva o ID, registra mudança e volta a permitir seleção.
- **Cadastrar nova frente:** nome próximo ao usado pela equipe, trecho/ponto descritivo, bairros do cadastro e situação. O sistema fornece ID permanente. Latitude/longitude ou pin do mapa são opcionais até a localização ser confirmada.
- **Salvar revisão:** mostrar resumo das alterações, salvar e sincronizar opções; confirmar sucesso e horário. Falha não marca a tarefa como concluída.

Os bairros também têm salvamento explícito e confirmação. Frente e bairro são entidades separadas; uma frente pode abranger mais de um bairro. Nunca unir ruas/vielas próximas apenas por nome semelhante. Não excluir ou reciclar IDs, nem usar o status PAC16 de abril como situação atual.

Cada revisão guarda ID de evento, data/hora, dia local, administrador autenticado, confirmação sem mudanças ou alterações com valores anteriores/novos. A aplicação deve deduplicar o mesmo envio em repetição de rede e associar a tarefa concluída à revisão daquele dia. O usuário pode rever a lista várias vezes; todos os eventos ficam no histórico, com uma única tarefa diária.

A data não deve representar um encerramento retroativo inventado: registrar a data informada e separadamente quando a alteração foi lançada. Relatórios já fechados usam o retrato do período; revisar hoje não reescreve entregas anteriores. Registros de campo conservam o ID da obra e sua identificação no momento do registro.

Celular: cartões compactos e botões grandes; pesquisa local e filtro por bairro/status; sem carregar fotos junto ao cadastro. Feedback de carregamento, sucesso e erro em texto acessível. Permissão de edição administrativa; equipe consulta/preenche. Não usar senha compartilhada.

Nesta etapa já existem situação atual, IDs, sincronização por salvar e revisões datadas na pasta da base. O caderno, a autenticação da aplicação, o mapa, a tarefa automática no painel e os retratos de relatório serão integrados na etapa de construção da aplicação; este documento não é código para colar no Apps Script.
