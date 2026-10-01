# Guia de implantação — CPT 2.3 (meta: segunda, 05/10/2026)

Tempo total estimado: **cerca de 1h30**, em três blocos. Faça tudo com a conta **victor-henrique.xavier@veolia.com**.
Quando um passo pedir "Executar", escolha a função no topo do editor do Apps Script, clique em **Executar** e confira o **Registro de execução**. Se algo sair diferente do esperado, pare e me mande o print do registro.

---

## Bloco 1 — Aplicação (≈ 40 min)

**O que muda:** a aplicação passa a rodar com a sua conta, e a equipe entra **só pelo link**, sem precisar de acesso às planilhas. Também chegam:
- os perfis Administrativo e Comercialização;
- a consulta de atendimentos para todos, com observações por caso;
- a tela **Obras**, onde Administrativo e Gestão atualizam as obras;
- a tela **Fechamento do mês**, que confere as pendências e gera a base do relatório mensal (o nº 15 vem sugerido para outubro) e uma planilha de apoio aos Anexos;
- a nova **Visão geral**, que abre mais rápido: o perfil vem embutido na página, os dados do mês e a agenda chegam juntos, e um cache é compartilhado pela equipe.

### 1.1 Conferir o dono
Abra o projeto: https://script.google.com/home/projects/1B2gVRbnDP9E4tdecW7lknY5Wq8QlRbmjXXenx-8cOPQX0wBmePmWUhML/edit
Em **Visão geral** (ícone ⓘ), o proprietário precisa ser a sua conta @veolia.com. Se for outra conta, pare e me avise.

### 1.2 Substituir arquivos
Os arquivos ficam em `app/src/` no GitHub. Para cada um: abra o arquivo no editor, selecione tudo (Ctrl+A), apague e cole o conteúdo novo.

| Arquivo no editor | Ação |
|---|---|
| `AplicacaoCPT.gs` | substituir |
| `CronogramaCPT.gs` | substituir |
| `DadosDaAplicacao.gs` | substituir |
| `DesempenhoCPT.gs` | substituir |
| `EntregasCPT.gs` | substituir |
| `Aplicacao.html` | substituir |
| `Interacoes.html` | substituir |
| `Agenda.html` | substituir |
| `Entregas.html` | substituir |
| `Estilos.html` | substituir |
| `PerfisCPT.gs` | **criar** (＋ → Script → nome `PerfisCPT`) |
| `ObservacoesCPT.gs` | **criar** (＋ → Script → nome `ObservacoesCPT`) |
| `ObrasCPT.gs` | **criar** (＋ → Script → nome `ObrasCPT`) |
| `RelatorioMensalCPT.gs` | **criar** (＋ → Script → nome `RelatorioMensalCPT`) |
| `Obras.html` | **criar** (＋ → HTML → nome `Obras`) |
| `Fechamento.html` | **criar** (＋ → HTML → nome `Fechamento`) |
| `CacheCPT.gs` | **criar** (＋ → Script → nome `CacheCPT`) |
| `Inicio.html` | **criar** (＋ → HTML → nome `Inicio`) |
| `CicloAtendimentoCPT.gs` | **criar** (＋ → Script → nome `CicloAtendimentoCPT`) |
| `Atendimentos.html` | **criar** (＋ → HTML → nome `Atendimentos`) |

Todos os arquivos mudaram nesta versão. Ao criar um arquivo, digite o nome **sem** a extensão (o editor acrescenta `.gs` ou `.html`). Clique em **Salvar** (💾).

### 1.3 Configurar
1. Execute **`instalarAplicacaoCPT`** e autorize. O Google vai pedir permissões novas (Documentos e Drive), porque a aplicação agora cria o relatório. Se você pular essa autorização, a tela de Fechamento dá erro de permissão. No registro deve aparecer `APLICAÇÃO CONFIGURADA`, `administrador: victor-henrique.xavier@veolia.com` e `dominio: veolia.com`.
2. Execute **`prepararDadosDaAplicacaoCPT`**. Deve aparecer `DADOS DA APLICAÇÃO PRONTOS`. A agenda atual é mantida e ganha a aba **Observações**.

### 1.4 Publicar mantendo o mesmo link
**Implantar → Gerenciar implantações →** ✏️ na implantação atual:
- **Versão:** Nova versão
- **Executar como:** *Eu (victor-henrique.xavier@veolia.com)*
- **Quem pode acessar:** *Qualquer pessoa em Veolia* (a opção do domínio)
- **Implantar.** O link `/exec` continua o mesmo.

> Se o Google não deixar mudar "Executar como" na implantação existente, crie uma **Nova implantação** (Aplicativo da Web) com essas opções e use o novo link. Os cadastros e a agenda continuam valendo.

### 1.5 Testar
1. Abra o link `/exec`. Seu nome deve aparecer no rodapé da lateral, e em "Minha visão" devem aparecer as frentes (não "Administrador").
2. Em **Equipe e acessos**, cadastre **uma colega** (conta @veolia.com, com as funções dela) e peça para ela abrir o link.
3. Se ela não entrar, peça para clicar em **Conferir meu acesso** e mandar o print. A tela mostra em que etapa parou.

### 1.6 Cadastrar a equipe
Em **Equipe e acessos**, cadastre cada pessoa com a conta @veolia.com.

| Função | Para quem |
|---|---|
| Administração técnica | Só quem vai cadastrar acessos (você e, idealmente, mais uma pessoa de confiança) |
| Administrativo | Todas as ferramentas de trabalho |
| Atendimento | Conduz os casos: atualiza, finaliza e reabre fichas |
| Execução | Registra o que foi feito em cada protocolo (vê endereço e telefone do morador) |
| Gestão, Socioambiental, Comunicação, Comercialização | Conforme a frente (consultam casos e registram observações) |

Uma pessoa pode ter mais de uma função.

### 1.7 Fechar o acesso direto às planilhas
Faça isso **depois** do teste 1.5. Remova da **Base Campo 4.0** e da planilha **CPT • Agenda compartilhada / Dados da aplicação** quem não precisa editá-las direto. A equipe continua enviando o formulário normalmente.
- **Fotos:** para a "Visualizar" funcionar, compartilhe como **Leitor** com a equipe a pasta onde o formulário guarda os uploads (no Forms: Respostas → ⋮ → pasta de uploads).

---

## Bloco 2 — Campo 4.0 (≈ 30 min)

**O que muda:**
- Obras e bairros recebem ID **só para atividades realizadas a partir de 01/10/2026**. As anteriores mantêm o texto original.
- Uma resposta editada **não trava mais** a fila.
- Cada **Ficha de Atendimento** enviada vira, sozinha, um caso com protocolo sequencial (ATD + ano + número), continuando a numeração atual. O formulário não muda.
- As falhas passam a ser **retomadas sozinhas de hora em hora**.

### 2.1 Substituir arquivos
No projeto do **Procedimentos de Campo 4.0**, substitua `ConfiguracaoDaBase.gs` e `ProcessamentoDosEnvios.gs` pelos arquivos de `campo40/src/` e **crie** o script `AberturaDeAtendimentos` (＋ → Script) com o conteúdo de `campo40/src/AberturaDeAtendimentos.gs`. Salve.

### 2.2 Ativar
1. Execute **`conferirProcessamentoCampo40`**. O registro deve mostrar `CONFIGURAÇÃO CONFERIDA`.
2. Execute **`instalarRetomadaAutomaticaCampo40`**. Deve aparecer `RETOMADA AUTOMÁTICA ATIVA`.
3. Execute **`processarEnviosPendentesCampo40`** para colocar em dia o que estiver pendente.
4. Execute **`abrirFichasSemProtocoloCampo40`**. Ele abre os casos das fichas de atendimento enviadas desde a migração que ainda não têm protocolo e mostra a lista (registro → protocolo). Pode repetir sem medo: não duplica.

### 2.3 Obras editadas na aplicação
Não há passo extra: o mesmo `ProcessamentoDosEnvios.gs` passa a levar ao formulário, de hora em hora, as obras alteradas na tela Obras. A revisão fica registrada, como no botão da planilha. Para aplicar na hora, execute **`atualizarFormularioComObrasDaAplicacaoCampo40`**. Se a atualização falhar, a mensagem aparece no topo da tela Obras.

---

## Bloco 3 — Segunda-feira (≈ 20 min)

### 3.1 Antes de mandar o link
Abra a aplicação e confira:
- a **Visão do mês** de outubro;
- a abertura de **uma ficha**;
- o registro de **uma observação** de teste num caso real (é um registro legítimo; escreva algo útil);
- a tela **Obras**: clique em **Continua igual** numa obra ativa e veja a mensagem do formulário no topo;
- a tela **Fechamento do mês** de setembro. Clique em **Gerar base** e abra o documento, que fica na pasta **CPT • Entregas mensais / 2026-09** do seu Drive. Mova a pasta para onde preferir: o vínculo continua.

### 3.2 Mensagem para a equipe (pronta para colar)

> Bom dia, pessoal! A partir de hoje a central do CPT é este link: **[link /exec]**
> • Entre com sua conta **@veolia.com**. Não precisa pedir acesso a planilhas.
> • Lá você encontra a visão do mês, o cronograma, os registros com fotos e a consulta de atendimentos.
> • Se alguém te procurar sobre um caso, abra o atendimento e use **Registrar observação**.
> • Os registros de campo continuam no formulário (botão "Registrar procedimento").
> • Não conseguiu entrar? Clique em **Conferir meu acesso** e me mande o print.

### 3.3 Atendimentos passam a ser conduzidos na aplicação
O ciclo fica todo aqui: **abertura automática pelo formulário → atualização pelo Atendimento → execução registrada → finalização pelo Atendimento**. O encerramento pela pesquisa de satisfação fica para depois.
1. **Antes de finalizar o primeiro caso na aplicação**, o Atendimento confere a lista **Em aberto** com o Controle de Atendimentos antigo. Os casos importados refletem o estado do dia da migração. Para cada caso que mudou desde então, use **Atualizar caso** (ou **Finalizar ficha**) para deixar igual.
2. Daí em diante, **não atualize mais casos no Controle de Atendimentos antigo**: ele vira só consulta do histórico. Duas fontes de verdade foi o problema que nos trouxe até aqui.
3. A mesclagem de protocolos e o PDF da ficha oficial chegam na próxima etapa. Os PDFs já gerados continuam acessíveis pelo botão da ficha.
- **Não desligue nem reinstale nada do legado** por enquanto. Na **Fase 3** eu preciso da lista de acionadores (⏰ no menu lateral) de cada projeto legado: mande prints quando puder.

---

## Se algo der errado

| Sintoma | O que fazer |
|---|---|
| "Não foi possível identificar sua conta" | A pessoa está com outra conta ativa no navegador. Peça para abrir numa janela anônima e entrar só com a @veolia.com. |
| "Sua conta ainda não está cadastrada" | Cadastre-a em Equipe e acessos (com o e-mail exato). |
| "Esta aplicação é exclusiva para contas @veolia.com" | Ela entrou com uma conta pessoal. |
| "A base de dados não está disponível" | Rode `diagnosticarConexaoCPT` no editor e me mande o registro. |
| Erro do Google antes de a tela abrir | Confira o passo 1.4: "Quem pode acessar" precisa ser o domínio Veolia. |
| Foto não abre | Compartilhe a pasta de uploads do formulário como Leitor (passo 1.7). |

## Voltar atrás
Em **Gerenciar implantações**, edite a implantação, escolha a **versão anterior** e volte "Executar como" para **Usuário que acessa o app da Web** (a versão antiga depende disso). Nenhum dado é apagado por esta atualização. O que ela cria:
- as abas Observações, Histórico de acessos, Histórico de obras e Entregas mensais na planilha de dados da aplicação;
- as colunas AF:AI na aba Obras (tipo, término, endereço e autor);
- um gatilho de hora em hora no Campo 4.0.
