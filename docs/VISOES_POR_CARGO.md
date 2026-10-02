# O que cada pessoa vê (Aplicação CPT 2.9)

A aplicação mostra a cada pessoa **a tela do seu trabalho**. A tela é escolhida pelo cargo cadastrado em **Equipe e acessos**.

## Como testar sem outra pessoa

Você tem todos os cargos, então pode ver a tela de qualquer colega:

1. Use o campo **Ver como**, na faixa colorida no topo de qualquer página. No computador, ele também está na lateral, em "Minha visão".
2. Escolha um cargo.

O que muda na hora:

- a cor da faixa;
- as páginas da lateral;
- os atalhos da Visão do mês.

**Trocar a visão muda só a tela:**

- a conta continua a mesma;
- as permissões continuam as mesmas;
- botões de ação dentro das fichas seguem a sua conta.

Quem tem **um cargo só** não vê a faixa nem a troca. Para essa pessoa, aparece apenas a tela do próprio cargo.

## Páginas por cargo

| Página | Atendimento | Comercialização | Socioambiental | Comunicação | Gestão | Administrativo |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| **Meu espaço** (mascote, checklist e caderno) | ✓ entrada | ✓ entrada | ✓ entrada | ✓ entrada | ✓ | ✓ |
| Visão do mês (com atalhos do cargo) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ← entrada da Gestão e do Administrativo
| **Recados** (avisar outra frente ou pessoa) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Contatos** (matriz comum, conversas registradas) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Comunicação** (Hoje, Lembretes, Materiais e links, Galeria) | | | | ✓ (página de entrada) | ✓ | ✓ |
| **Lembretes** (ações e materiais com a Comunicação) | | | ✓ | ✓ (dentro de Comunicação) | ✓ | ✓ |
| Cronograma | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Registros (relatos e fotos) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Atendimentos: consultar e anotar observação | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Atendimentos: conduzir, corrigir, incorporar, ficha oficial | ✓ | | | | ✓ | ✓ |
| Atendimentos: aba **Auditoria e números** | ✓ | | | | ✓ | ✓ |
| Obras (consulta) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Socioambiental (mesa do relatório, relatos, diagnósticos) | | | ✓ | ✓ | ✓ | ✓ |
| Fechamento do mês | | | ✓ | ✓ | ✓ | ✓ |
| **Painel da gestão** (contrato, frentes, relatos em resumo) | | | | | ✓ | ✓ |
| **Programa Parceiros** | | | | | ✓ | ✓ |
| Equipe e acessos · Conectores e pastas | | | | | só você | só você |

Atalhos da Visão do mês, por cargo:

- **Atendimento:** casos em aberto, auditoria das fichas, cronograma, obras.
- **Socioambiental:** mesa do relatório, lembretes, pesquisas da semana (meta 15), recados.
- **Comunicação:** abre direto em **Comunicação → Hoje**. Atalhos: meu dia, lembretes, materiais e links, galeria.
- **Comercialização:** obras e endereços, cronograma, atendimentos, registros.
- **Gestão e Administrativo:** painel da gestão, Programa Parceiros, auditoria de atendimentos, fechamento.

## Período de testes: só você altera a configuração

Enquanto a **trava de configuração** estiver ligada, só você (proprietário) pode:

- cadastrar pessoas e mudar cargos (isso vale sempre, mesmo depois dos testes);
- alterar o catálogo de obras;
- trocar conectores;
- publicar na máscara oficial do Programa Parceiros.

A trava já vem ligada. Gestão e Administrativo continuam podendo responder e salvar o Programa Parceiros. A publicação na máscara oficial fica com você.

Para liberar obras e publicações quando terminar os testes:

1. Abra o editor do Apps Script.
2. Execute **`liberarConfiguracaoCPT`**.

Para travar de novo, execute **`travarConfiguracaoCPT`**. Não há botão na tela para isso, de propósito.

## Pastas que a equipe precisa enxergar (para as fotos aparecerem)

As fotos e os documentos abrem com a conta de cada pessoa, não com a sua. Abra **Como usar → Conectores e pastas**: a aplicação lista as pastas reais, com o nome e o compartilhamento atual.

O que costuma aparecer:

1. **Pasta de fotos do formulário Campo 4.0.** São as pastas "(File responses)" que o Google Forms cria, uma por pergunta de foto, e a pasta de respostas acima delas. Sem isso, "Visualizar" mostra "Você precisa de acesso".
2. **CPT • Entregas mensais.** Relatórios, anexos, relatos ilustrados, fichas oficiais e planilhas do Programa Parceiros gerados pela aplicação.
3. **Pasta dos Anexos do relatório.** Indicadores 2026 e anexos oficiais. Só a Gestão e o Administrativo precisam.
4. **RDAS.** Continua uma planilha à parte, compartilhada com a equipe interna.

**Como compartilhar:**

- Compartilhe como **Leitor** com as pessoas da equipe, ou com um grupo do Google da equipe. Assim, quem sair do grupo perde o acesso.
- Evite "Qualquer pessoa com o link".
- Evite compartilhar com a empresa toda: as fotos têm moradores e endereços.
- Na página de conectores, a bolinha fica verde quando a pasta já está compartilhada.

**A máscara do Programa Parceiros precisa ser uma Planilha Google.** Se o arquivo for um .xlsx no Drive, a página de conectores avisa. Nesse caso:

1. Abra o .xlsx no Drive e use Arquivo → Salvar como Planilhas Google.
2. Na página de conectores, cole o link da nova planilha em "Máscara do Programa Parceiros".

## Comunicação: como usar (para explicar à comunicadora)

A Comunicação abre direto na página **Hoje**. Ela é lida de cima para baixo, um bloco de cada vez:

1. **Recados para você:** o que alguém da equipe pediu. Clique em **Ler**.
2. **Lembretes de hoje:** o que é para hoje e o que ficou para trás. Fez? Clique em **Feito ✓**.
3. **Ações da equipe nos próximos 7 dias:** vem do cronograma. Se a ação precisa de panfleto, banner ou foto, clique em **Precisa de material?** e o lembrete já sai ligado à ação.
4. **Materiais com prazo:** peças a fazer ou em produção. Quando publicar ou entregar, clique em **Concluir** e informe a data e, se for publicação, quantas pessoas alcançou.
5. **Guardado para o fechamento do mês:** publicações, pessoas alcançadas, impressos e vídeos já concluídos. Esses números aparecem como sugestão no Programa Parceiros (linhas 32 a 34).

As outras abas:

- **Lembretes:** tudo o que foi combinado com o Social, separado em atrasados, hoje, próximos 7 dias e mais adiante.
- **Materiais e links:** a pasta de links. Cada item tem título, link, observação, responsável, prazo e situação (A fazer, Em produção, Concluído). "Enviar por recado" manda o link para alguém da equipe.
- **Galeria:** as fotos do mês que vieram dos registros, mais as fotos extras enviadas por aqui.
  - **Enviar fotos:** do computador ou do celular, ou por link do Drive. Use a data em que a atividade aconteceu; a legenda sai no padrão do relatório.
  - **Escolher e baixar:** até 15 fotos em um .zip, com a lista de legendas.

As fotos extras ficam na pasta **CPT • Comunicação – Fotos extras**, criada no primeiro envio. Compartilhe essa pasta como Leitor com a equipe; ela aparece em Conectores e pastas.

## Meu espaço: a página de entrada (mascote, checklist e caderno)

Atendimento, Socioambiental, Comunicação e Comercialização abrem a aplicação no **Meu espaço**. Gestão e Administrativo continuam abrindo na Visão do mês. A Visão do mês segue na lateral para todos.

No Meu espaço:

- **Mascote.** No primeiro acesso, a pessoa escolhe entre gato, águia, pato, dinossauro, abelha e cachorro, e dá um nome. O pato já sugere "Cleber". O nome pode ser mudado a qualquer hora.
- **Guarda-roupa:**
  - EPI: capacetes, colete refletivo, óculos de proteção, protetor auricular, botina;
  - camisas de futebol de São Paulo, só nas cores, sem escudos: alvinegra listrada, verde, tricolor e branca do Peixe;
  - camiseta CPT;
  - acessórios: boné, laço, óculos escuros, cachecol, crachá, fone;
  - ferramentas na mão: prancheta, trena, câmera, megafone, muda de planta, chave inglesa;
  - exclusivas por pontos: capacete dourado, coroa de folhas, capa de herói da obra, medalha, troféu, colete de mestre de obras.
- **Checklist do dia.** Também serve para planejar outros dias com as setas.
- **Caderno pessoal.** Salva sozinho enquanto a pessoa escreve. Se a conexão cair, o texto fica guardado no navegador e é salvo depois.
- **Atalho para o trabalho do dia**, conforme o cargo (por exemplo, "Ver casos em aberto" ou "Abrir meu dia na Comunicação"), e o aviso de recados.

**Regras dos presentes.** O servidor confere todas; nada é ganho duas vezes.

| Como ganha | O quê |
|---|---|
| Toda semana (segunda a domingo) | 1 presente: escolher **um mascote novo** ou **uma peça** |
| A cada 5 dias com anotação no caderno (pelo menos 20 letras no dia) | 1 peça à escolha |
| Cada tarefa própria marcada como feita no checklist | 10 pontos, uma única vez por tarefa; até 8 tarefas por dia; tarefa de dia futuro só pontua no dia |
| Pontos | Compram as peças exclusivas (200 a 400 pontos) |

Desmarcar e marcar de novo não soma pontos. Apagar uma tarefa que já pontuou não tira os pontos.

**Privacidade.** Caderno, checklist, pontos e mascote são de cada conta. Ninguém vê o espaço de outra pessoa pela aplicação, nem a Gestão. Os dados ficam nas abas "Meu espaço", "Caderno" e "Checklist" da planilha "CPT • Dados da aplicação". Ela é sua e não deve ser compartilhada com a equipe.
