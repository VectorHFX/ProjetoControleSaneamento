# Atualização automática — sem copiar e colar

**Como funciona daqui em diante:**
1. Eu altero o código e envio para o GitHub.
2. Você executa **uma função**, `atualizarTudoCPT`, num projeto pequeno chamado **CPT • Atualizador**.
3. Ele:
   - busca os arquivos no GitHub;
   - cria uma versão de segurança dos projetos;
   - substitui o código da Aplicação e do Campo 4.0;
   - publica a Aplicação no **mesmo link**.

Seu papel passa a ser **auditar**: ler o que mudou e testar. Para isso, rode antes `conferirAtualizacaoCPT`, que mostra o que mudaria sem alterar nada.

> **Por que não "biblioteca"?** Biblioteca do Apps Script serve para compartilhar funções entre projetos, não para instalar código vindo do GitHub. Ela não resolve o seu problema.

---

## Configuração (uma vez, ≈ 15 min)

### 1. Ligar a API do Apps Script na sua conta (1 min)
1. Abra https://script.google.com/home/usersettings.
2. Ligue **"API do Google Apps Script"**.

> Se a opção estiver bloqueada, a Veolia desativou essa API para contas corporativas. Nesse caso, me avise: a alternativa é pedir ao TI que libere só essa opção para você. Até lá, seguimos com o copiar e colar.

### 2. Criar um token de leitura no GitHub (3 min)
1. Abra https://github.com/settings/personal-access-tokens/new (token *fine-grained*).
2. Preencha:
   - **Token name:** `CPT Atualizador`. **Expiration:** 1 ano.
   - **Repository access:** *Only select repositories* → `ProjetoControleSaneamento`.
   - **Permissions → Repository permissions → Contents:** *Read-only*. Nada mais.
3. **Generate token** e copie. Ele começa com `github_pat_`.

O token só **lê** o repositório. Não consegue alterar nada nem ver seus outros repositórios.

### 3. Criar o projeto CPT • Atualizador (5 min)
1. Em https://script.google.com, clique em **Novo projeto** e renomeie para **CPT • Atualizador**.
2. **Configurações do projeto (⚙️)** → marque **"Mostrar o arquivo de manifesto appsscript.json"**.
3. No editor:
   - substitua o `appsscript.json` pelo conteúdo de `atualizador/src/appsscript.json`;
   - substitua o `Código.gs` pelo conteúdo de `atualizador/src/AtualizadorCPT.gs`.
4. Salve.

Este é o **último** copiar e colar.

### 4. Configurar (2 min)
1. No Campo 4.0, copie o ID do projeto: **Configurações do projeto → IDs → ID do script**.
2. No Atualizador, na função `configurarAtualizadorCPT`, preencha `TOKEN_GITHUB` e `ID_PROJETO_CAMPO40`.
3. Execute **`configurarAtualizadorCPT`** e autorize. O Google pede para "gerenciar seus projetos do Apps Script" e "conectar a serviço externo"; é isso mesmo.
4. **Apague o token do código** (deixe `''`) e salve. Ele fica guardado nas propriedades do projeto, não no código.

### 5. Testar sem mudar nada
Execute **`conferirAtualizacaoCPT`**. O registro mostra:
- as últimas mudanças no GitHub;
- para cada projeto, o que seria **alterado**, **criado** e o que fica **só no Google** (nada é apagado).

---

## Uso no dia a dia
1. Quando eu avisar que há atualização, execute **`conferirAtualizacaoCPT`** e leia a lista.
2. Execute **`atualizarTudoCPT`**. O registro mostra:
   - a **versão de segurança** criada antes da mudança;
   - os arquivos alterados;
   - `Link /exec atualizado para a versão N`.
3. Se o guia pedir uma função de instalação (por exemplo, `instalarAplicacaoCPT`), execute-a no projeto indicado. Eu sempre aviso quando precisa.

Para atualizar só um projeto: `atualizarSoAplicacaoCPT` ou `atualizarSoCampo40CPT`.

## Voltar atrás
Na Aplicação: **Implantar → Gerenciar implantações → ✏️ → Versão**. Escolha a **versão de segurança** que o registro mostrou.

O código no editor só volta com uma nova atualização. Para isso, me peça para reverter no GitHub e rode `atualizarTudoCPT` de novo.

## Por que é seguro
- **Quem faz a atualização:** só você, com a sua conta. O token só lê o GitHub.
- **Antes de cada mudança:** uma versão de segurança fica registrada no projeto.
- **O que não é mexido:**
  - arquivos que existem só no Google ficam;
  - o `appsscript.json` do Campo 4.0 é mantido;
  - só a implantação de aplicativo da Web é republicada; a de teste não.
- **Se algo falhar no meio:** o erro aparece no registro e a versão de segurança permanece.
