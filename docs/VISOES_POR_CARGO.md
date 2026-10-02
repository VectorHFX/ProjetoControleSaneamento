# O que cada pessoa vê (Aplicação CPT 2.7)

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
| Visão do mês (com atalhos do cargo) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
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
- **Socioambiental:** mesa do relatório, pesquisas da semana (meta 15), fechamento, cronograma.
- **Comunicação:** mesa do relatório, relatos e fotos, fechamento, cronograma.
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
