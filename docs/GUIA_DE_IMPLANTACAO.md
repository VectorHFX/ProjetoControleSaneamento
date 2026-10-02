# Guia de instalação: Aplicação CPT 2.3.1 e Campo 4.0 (4.2)

**Meta:** tudo no ar até segunda, 05/10/2026, antes de a equipe começar.
**Tempo total:** cerca de 2h, em quatro blocos. Os **Blocos 2 e 3 devem ser feitos na mesma sentada** (domingo à noite ou segunda cedo). Assim o sistema antigo e o novo não abrem casos ao mesmo tempo.
**Conta:** faça tudo com **victor-henrique.xavier@veolia.com**.

**Como executar uma função:**
1. No editor do Apps Script, escolha a função na lista do topo.
2. Clique em **Executar**.
3. Leia o **Registro de execução**.

Cada passo diz o que deve aparecer. Se aparecer outra coisa, pare e me mande o print do registro.

**Como copiar um arquivo do GitHub:**
1. Abra o arquivo no repositório (branch `claude/keen-hamilton-pvmxi2`).
2. Clique no ícone **Copiar** (⧉), acima do código.
3. No editor do Apps Script, abra o arquivo de mesmo nome, faça Ctrl+A, apague e cole com Ctrl+V.
4. Salve com 💾.

Ao **criar** um arquivo, digite o nome **sem** extensão. O editor acrescenta `.gs` ou `.html`.

---

## Como fica depois da instalação

| Peça | Quem usa | Papel |
|---|---|---|
| **Aplicação CPT** (link `/exec`) | Equipe Veolia | Tudo do dia: visão do mês, agenda, registros, atendimentos (atualizar, finalizar, reabrir), obras, fechamento do mês |
| **Formulário Campo 4.0** | Equipe em campo | Captação. Uma *Ficha de Atendimento* enviada vira um caso com protocolo sozinha. **O formulário não muda.** |
| **Formulário de Execução + planilha da engenharia** | Concrejato | **Continua separado e compartilhado com eles.** A lista de protocolos passa a vir da Base. As respostas entram no caso como "Execução". |
| **Base Campo 4.0** (planilha) | Ninguém abre no dia a dia | Fonte única dos casos (abas Atendimentos e Movimentações) |
| **Controle de Atendimentos antigo** | Consulta | Para de ser atualizado no corte (Bloco 3). Fica como histórico e para os PDFs das fichas antigas. |
| **Anexos do relatório** | Administrativo | "Indicadores 2026" não é tocado. O "Controle de manifestações" sai pronto do Fechamento do mês. |

**O caminho de um caso:**
1. A ficha chega pelo formulário Campo 4.0 e o caso nasce como **Recebida**, com a próxima ação "Triagem do Atendimento".
2. O Atendimento faz a triagem na aplicação. Em **Atualizar caso**, escolhe **Área responsável: Execução** e escreve a próxima ação. A engenharia recebe um e-mail.
3. A engenharia responde o formulário de Execução, escolhendo o protocolo na lista. A resposta aparece na linha do tempo do caso:
   - se foi resolvida ou não procedente, o caso volta ao Atendimento com "Conferir execução e finalizar ficha";
   - se ainda há pendência, o caso continua com a Execução.
4. O Atendimento confere a execução e clica em **Finalizar ficha**.

---

## Bloco 1 — Aplicação (≈ 40 min)

### 1.1 Conferir o dono
1. Abra o projeto: https://script.google.com/home/projects/1B2gVRbnDP9E4tdecW7lknY5Wq8QlRbmjXXenx-8cOPQX0wBmePmWUhML/edit
2. Em **Visão geral** (ⓘ), o proprietário precisa ser a sua conta @veolia.com. Se for outra conta, pare e me avise.

### 1.2 Copiar os arquivos (pasta `app/src/`)

| Arquivo no editor | Ação |
|---|---|
| `AplicacaoCPT.gs`, `CronogramaCPT.gs`, `DadosDaAplicacao.gs`, `DesempenhoCPT.gs`, `EntregasCPT.gs` | substituir |
| `Aplicacao.html`, `Interacoes.html`, `Agenda.html`, `Entregas.html`, `Estilos.html` | substituir |
| `PerfisCPT`, `ObservacoesCPT`, `ObrasCPT`, `RelatorioMensalCPT`, `CacheCPT`, `CicloAtendimentoCPT` | **criar** (＋ → Script) |
| `Obras`, `Fechamento`, `Inicio`, `Atendimentos` | **criar** (＋ → HTML) |

No fim, o projeto tem **20 arquivos** além do `appsscript.json`. Salve.

### 1.3 Configurar
1. Execute **`instalarAplicacaoCPT`** e autorize. O Google pede permissões novas (Documentos e Drive) para o relatório do mês.
   - No registro deve aparecer `APLICAÇÃO CONFIGURADA`, `administrador: victor-henrique.xavier@veolia.com` e `dominio: veolia.com`.
2. Execute **`prepararDadosDaAplicacaoCPT`**. Deve aparecer `DADOS DA APLICAÇÃO PRONTOS`.

### 1.4 Publicar mantendo o mesmo link
1. Vá em **Implantar → Gerenciar implantações →** ✏️ na implantação atual.
2. Preencha:
   - **Versão:** Nova versão
   - **Executar como:** *Eu (victor-henrique.xavier@veolia.com)*
   - **Quem pode acessar:** *Qualquer pessoa em Veolia*
3. Clique em **Implantar**. O link `/exec` continua o mesmo.

> Se o Google não deixar mudar "Executar como", crie uma **Nova implantação** (Aplicativo da Web) com essas opções e use o novo link.

### 1.5 Testar com uma colega
1. Abra o `/exec`. Seu nome deve aparecer no rodapé da lateral.
2. Em **Equipe e acessos**, cadastre uma colega e peça para ela abrir o link.
3. Se ela não entrar, peça um print da tela **Conferir meu acesso**.

### 1.6 Cadastrar a equipe

| Função | Para quem |
|---|---|
| Administração técnica | Você e mais uma pessoa de confiança |
| Administrativo | Todas as ferramentas de trabalho, inclusive Obras e Fechamento do mês |
| Atendimento | Conduz os casos: atualiza, encaminha à Execução, finaliza e reabre |
| Execução | Pessoa **da Veolia** que registra uma execução em nome da engenharia, quando ela não usar o formulário. A Concrejato **não** entra na aplicação: ela continua no formulário de Execução. |
| Gestão, Socioambiental, Comunicação, Comercialização | Consultam os casos e registram observações |

### 1.7 Fechar o acesso direto (depois do teste 1.5)
1. Remova da **Base Campo 4.0** e da planilha **Dados da aplicação** quem não precisa editá-las direto.
2. Compartilhe como **Leitor**, com a equipe, a pasta de uploads do formulário (no Forms: Respostas → ⋮ → pasta de uploads). Sem isso, as fotos não abrem.
3. **Não mexa** no compartilhamento da planilha da engenharia.

---

## Bloco 2 — Campo 4.0 (≈ 25 min)

### 2.1 Copiar os arquivos (pasta `campo40/src/`)
Abra o projeto do **Procedimentos de Campo 4.0**.

| Arquivo | Ação |
|---|---|
| `ConfiguracaoDaBase.gs`, `ProcessamentoDosEnvios.gs` | substituir |
| `AberturaDeAtendimentos`, `ExecucaoDaEngenharia`, `CorteDoControleAntigo` | **criar** (＋ → Script) |

Salve.

### 2.2 Conferir
Execute **`conferirProcessamentoCampo40`**. Deve aparecer `CONFIGURAÇÃO CONFERIDA`.

### 2.3 Proteger a numeração dos protocolos
Execute **`compararComControleAntigoCampo40`** e autorize (ele lê o Controle antigo, sem alterar nada lá). Deve aparecer:
- `COMPARAÇÃO FEITA`;
- `numeracaoContinuaDepoisDe: {"2026": 32}` (o último protocolo do Controle antigo). A partir daqui, a numeração nunca repete um protocolo que só existe lá;
- `faltandoNaBase`: deve vir **vazio** ou só com códigos `HIST…`. **Se aparecer algum `ATD…`, pare e me mande o print.**

Os itens `aAjustar` ficam para o Bloco 3.

### 2.4 Ativar a abertura automática
1. Execute **`instalarRetomadaAutomaticaCampo40`**. Deve aparecer `RETOMADA AUTOMÁTICA ATIVA`.
2. Execute **`processarEnviosPendentesCampo40`** para colocar em dia o que estiver pendente.
3. Execute **`abrirFichasSemProtocoloCampo40`**. Ele abre os casos das fichas enviadas desde a migração e lista registro → protocolo. Pode repetir: não duplica.

Obras editadas na tela Obras chegam ao formulário sozinhas, de hora em hora. Para levar na hora, execute `atualizarFormularioComObrasDaAplicacaoCampo40`.

---

## Bloco 3 — Corte do atendimento (≈ 30 min, logo depois do Bloco 2)

O objetivo é ter **uma fonte só de casos**. A partir daqui a Base manda, e o Controle antigo vira consulta.

### 3.1 Ligar o formulário de Execução à Base
No projeto do Campo 4.0, execute **`instalarExecucaoDaEngenhariaCampo40`** e autorize. Desta vez ele pede acesso a Formulários e envio de e-mail.

O registro deve mostrar:
- `EXECUÇÃO DA ENGENHARIA LIGADA À BASE`;
- `lista: N protocolo(s) na lista`;
- `ordens: N caso(s)`;
- `avisos: … envio desligado`.

Confira:
- **Formulário de Execução** (botão 👁 de visualizar): a lista "Qual o número de protocolo?" mostra os casos em aberto da Base, no formato `ATD… | Nome`.
- **Planilha da engenharia:** apareceu a aba **CPT • Ordens em aberto**, com os casos da Execução primeiro. Essa aba é refeita sozinha: ninguém precisa editar.

Só entram respostas enviadas **a partir deste momento**. As anteriores já estão no Controle antigo.

### 3.2 Desligar o Controle antigo
1. Abra a planilha **Controle de Atendimentos** → **Extensões → Apps Script → ⏰ Acionadores**.
2. **Tire um print da lista e me mande.**
3. Exclua cada acionador (⋮ → Excluir acionador). Os dados não são apagados.
4. Se o **Painel de Atendimento** ou o **Painel Executivo** forem projetos separados e tiverem acionadores, faça o mesmo neles.

Isso para a importação da Central 4.9, a lista e os e-mails da Comunicação 4.0.2 e a atualização automática dos painéis antigos. **Não instale nem rode nada do legado depois disso.**

### 3.3 Trazer o estado atual dos casos
Agora o Controle antigo está parado.
1. Execute de novo **`compararComControleAntigoCampo40`**.
   - `aAjustar` lista, caso a caso, o que mudou no Controle antigo desde a migração (situação, com quem está, próxima ação, conclusão, procedência).
2. Se a lista fizer sentido, execute **`trazerEstadoDoControleAntigoCampo40`**. Cada caso ajustado ganha a movimentação "Ajuste do corte", com o "de → para".
3. Se aparecer algo em `conferirNaAplicacao`, o Atendimento resolve à mão na aplicação, com **Atualizar caso**. São casos que já foram movimentados na Base, então não são sobrescritos.

### 3.4 Ligar os avisos à engenharia
Execute **`ativarAvisosEngenhariaCampo40`**.

A partir daí, quando o Atendimento encaminha um caso à Execução, os três contatos da Concrejato recebem um e-mail. O e-mail traz protocolo, nome, endereço, telefone, assunto, próxima ação e os links do formulário e da aba de ordens. Os casos que já estavam com a Execução no corte não geram e-mail.

- Para pausar: execute `pausarAvisosEngenhariaCampo40`.
- O e-mail substitui o pacote em PDF do sistema antigo. O "Acompanhamento diário" agora é a aba **CPT • Ordens em aberto**, sempre atual.

### 3.5 Mensagem para a engenharia (pronta para colar)
> Olá, pessoal! A partir de hoje o controle das fichas de atendimento do CPT mudou de sistema. Para vocês, quase nada muda:
> • Continuem respondendo o **mesmo formulário de Execução**, escolhendo o protocolo na lista.
> • A lista agora mostra só as fichas em aberto do sistema novo.
> • Na planilha de vocês há uma aba nova, **CPT • Ordens em aberto**, com tudo o que está em aberto e com quem está. Ela se atualiza sozinha.
> • Quando o Atendimento encaminhar uma ficha para vocês, chega um e-mail com os dados do caso.
> • Não achou o protocolo na lista? Falem com o Atendimento antes de responder.

---

## Bloco 4 — Segunda de manhã (≈ 20 min)

### 4.1 Conferir na aplicação
- A **Visão do mês** de outubro.
- A lista **Em aberto** em Atendimentos: os mesmos casos da aba de ordens da engenharia.
- A **ficha** de um caso que estava com a Execução: veja a linha do tempo.
- **Obras**: clique em **Continua igual** numa obra ativa.
- **Fechamento do mês** de setembro: **Gerar base**. O documento fica em **CPT • Entregas mensais / 2026-09** no seu Drive.

### 4.2 Mensagem para a equipe (pronta para colar)
> Bom dia, pessoal! A partir de hoje a central do CPT é este link: **[link /exec]**
> • Entre com sua conta **@veolia.com**. Não precisa pedir acesso a planilhas.
> • Lá estão a visão do mês, o cronograma, os registros com fotos e os atendimentos.
> • Os registros de campo continuam no formulário (botão "Registrar procedimento"). Uma Ficha de Atendimento enviada já vira caso com protocolo.
> • **Atendimento:** para mandar um caso à engenharia, use **Atualizar caso → Área responsável: Execução** e escreva a próxima ação. O retorno deles aparece na ficha e o caso volta para vocês com "Conferir execução e finalizar ficha".
> • O Controle de Atendimentos antigo agora é só consulta. Não atualizem nada lá.
> • Não conseguiu entrar? Clique em **Conferir meu acesso** e me mande o print.

### 4.3 Acompanhar a primeira semana
- Uma vez por dia, execute **`sincronizarExecucaoDaEngenhariaCampo40`**. O registro mostra o que entrou e o que precisa de conferência:
  - `conferir`: resposta com protocolo que não existe na Base;
  - `aposConclusao`: resposta para um caso já finalizado. Ela fica registrada na ficha, mas o caso não é reaberto: o Atendimento decide se reabre.
- O retorno da engenharia entra no caso na hora do envio. Se o sistema estiver ocupado, entra na retomada de hora em hora.

---

## O que o sistema antigo fazia e onde ficou

| Antes (legado) | Agora |
|---|---|
| Central 4.9: importar respostas da Execução | `ExecucaoDaEngenharia`, no Campo 4.0 (regra igual: resolvida ou não procedente volta ao Atendimento) |
| Central 4.9: aberturas feitas pela engenharia ("Abrindo") | Viram caso com protocolo da mesma sequência |
| Comunicação 4.0.2: lista de protocolos do formulário | `ExecucaoDaEngenharia` (a cada resposta e de hora em hora) |
| Comunicação 4.0.2: e-mail com PDF para a Concrejato | E-mail com tabela, quando o caso é encaminhado à Execução, e a aba **CPT • Ordens em aberto** |
| Comunicação entre Áreas (mensagens da Execução) | Entram na ficha como "Comunicação" |
| Painel de Atendimento / Demandas do Atendimento | Aplicação → Atendimentos (Em aberto, com quem está, próxima ação) |
| Fichas Oficiais 3.2.1 (PDF Sabesp) | Casos antigos: os PDFs continuam no Controle antigo e abrem pelo botão da ficha. Casos novos: **próxima etapa**, pronta antes do fechamento de outubro |
| Controle de manifestações nos Anexos | Fechamento do mês gera a planilha no formato oficial |
| Vínculos de protocolos (mesclagem) | Os antigos foram migrados. Mesclar casos novos: próxima etapa |
| Pesquisa de satisfação encerrando a ficha | Depois (decisão de 01/10) |

---

## Se algo der errado

| Sintoma | O que fazer |
|---|---|
| "Não foi possível identificar sua conta" | A pessoa está com outra conta ativa. Peça para abrir numa janela anônima só com a @veolia.com. |
| "Sua conta ainda não está cadastrada" | Cadastre em Equipe e acessos, com o e-mail exato. |
| "Esta aplicação é exclusiva para contas @veolia.com" | Ela entrou com uma conta pessoal. |
| "A base de dados não está disponível" | Rode `diagnosticarConexaoCPT` e me mande o registro. |
| Erro do Google antes de a tela abrir | Confira o passo 1.4: "Quem pode acessar" = domínio Veolia. |
| Foto não abre | Passo 1.7, item 2. |
| `Lista do formulário: … precisa ser Lista suspensa` | No formulário de Execução, a pergunta "Qual o número de protocolo?" precisa ser do tipo Lista suspensa, com esse mesmo título. |
| `Comunicação entre Áreas: cabeçalhos diferentes` | Alguém mexeu na primeira linha dessa aba na planilha da engenharia. Me mande um print. |
| A lista do formulário "volta" para a antiga | Ainda há um acionador do legado ligado (passo 3.2). |
| `You do not have permission to call MailApp.sendEmail` (ou FormApp) | O `appsscript.json` do Campo 4.0 tem uma lista fixa de permissões. Em Configurações do projeto, marque "Mostrar appsscript.json", acrescente `https://www.googleapis.com/auth/script.send_mail` e `https://www.googleapis.com/auth/forms` em `oauthScopes`, salve e execute de novo. |
| `Cota de e-mail do dia esgotada` | Os avisos ficam pendentes e saem no dia seguinte. |

## Voltar atrás
Nenhum dado é apagado por esta instalação.
- **Aplicação:** em Gerenciar implantações, volte à versão anterior com "Executar como: Usuário que acessa".
- **Engenharia:**
  1. Execute `pausarAvisosEngenhariaCampo40`.
  2. No Campo 4.0 → ⏰ Acionadores, exclua o `aoReceberExecucaoCampo40`.
  3. No Controle antigo, rode `instalarCentralAtendimentos` e `instalarComunicacaoAtendimento`.
- **O que foi criado:**
  - abas Observações, Histórico de acessos, Histórico de obras e Entregas mensais nos Dados da aplicação;
  - colunas AF:AI em Obras;
  - aba Avisos à engenharia na Base;
  - aba CPT • Ordens em aberto na planilha da engenharia;
  - um acionador de hora em hora e um do formulário de Execução, no Campo 4.0.
