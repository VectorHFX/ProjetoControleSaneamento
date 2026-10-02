# Limpeza e backup — o que sai da pasta, o que fica

**Regra:** primeiro **arquivar**, depois **apagar**.
- **Arquivar** é mover para a pasta `99_Legado_Somente_Leitura`. Ninguém usa por engano e nada quebra.
- **Apagar** só depois de um ciclo completo sem ninguém sentir falta: o relatório nº 15 (outubro) entregue, no começo de novembro.

## Passo 1 — Inventário (5 min, não move nada)
1. No projeto da **Aplicação CPT**, execute **`inventariarDriveCPT`** e autorize.
2. Ele cria a planilha **CPT • Inventário do Drive AAAA-MM-DD** na raiz do seu Drive, com:
   - todas as planilhas, formulários, documentos e projetos de script que são seus;
   - uma sugestão para cada um: **EM USO**, **GERADO PELO SISTEMA**, **REVISAR** ou **LEGADO**.
3. Preencha a coluna **Sua decisão** e me mande a planilha, ou um print das linhas REVISAR e LEGADO. Eu confiro antes de você mover.

> Os scripts **dentro** de uma planilha (Extensões → Apps Script) não aparecem no inventário. Eles vão junto com a planilha.

## Passo 2 — Nunca apagar (rastreio e links do sistema)

| Item | Por quê |
|---|---|
| **Base Campo 4.0** e **Dados da aplicação** | Fonte única do sistema novo |
| **Controle de Atendimentos antigo** | Fica como consulta. As fichas e PDFs antigos são abertos pela aplicação a partir dele. Tire o acesso de edição da equipe, mas não apague. |
| **Formulário de Execução e a planilha da engenharia** | Em uso pela Concrejato |
| **Pesquisa de satisfação** (formulário e respostas) | Evidência e meta 15/60 |
| **Anexos do relatório** e **modelo da ficha oficial** | Entregas oficiais |
| **Pastas de upload de TODOS os formulários**, inclusive o antigo 3.0 | As fotos dos registros e das fichas são links para essas pastas. Apagou a pasta, as fotos somem da aplicação e das fichas. |
| Pastas **CPT • Fichas oficiais**, **CPT • Entregas mensais** e as pastas de PDFs das fichas antigas ("Documentos Atuais", "PDFs Atuais") | Entregas já feitas |
| **RDAS**, relatos sociais e diagnósticos de área | Ainda não estão na aplicação. Saem do uso só quando a função entrar nela. |

## Passo 3 — Pode arquivar agora (mover para `99_Legado_Somente_Leitura`)

| Item | Antes de mover |
|---|---|
| Cópias, testes, "Texto colado", "Sem título", "v2 final" | Nada |
| **Painel de atendimento** e **Painel Executivo** | Excluir os acionadores (veja a tabela no guia de instalação, Atualização 2.4) |
| **Painel de Gestão** (2.2.1 / 3.2) | Confirmar com Gestão que a Visão do mês da aplicação cobre o que usavam |
| Aplicações web antigas (outra "Central CPT" que não seja o projeto da Aplicação) | **Implantar → Gerenciar implantações → Arquivar.** Assim o link antigo para de abrir. |
| Formulário **Procedimentos de Campo 3.0** | Em Respostas, desligar "Aceitando respostas". **A planilha de respostas e a pasta de uploads ficam.** |
| Proposta "Campo 5" | Nunca foi instalada |

## Passo 4 — Limpar o projeto do Campo 4.0
O código de todos estes arquivos está no GitHub. Se precisar, eles voltam.

| Arquivo no editor | Pode remover? |
|---|---|
| `DadosIniciaisDoPAC16`, `InstalacaoDaBase`, `AplicarObrasDoRelatorio` | **Sim.** Eram só da instalação e da carga inicial das obras. |
| `ImportacaoDosAtendimentos`, `ImportacaoDosHistoricos`, `AuditoriaDaImportacao` (se estiverem lá) | **Sim.** A migração já rodou. |
| `CorteDoControleAntigo` | **Depois** do fechamento de outubro. O piso da numeração continua valendo sem ele. |
| `ConsultasDaBase` | Só depois de confirmar que nenhum outro projeto usa o Campo 4.0 como **biblioteca** (Editor → Bibliotecas, nos projetos antigos) |
| `ConfiguracaoDaBase`, `RepositorioDosRegistros`, `ProcessamentoDosEnvios`, `CatalogosDeObrasEBairros`, `AberturaDeAtendimentos`, `ExecucaoDaEngenharia`, `AuditoriaDoFormulario` | **Não.** Estão em uso. |

Para remover: ⋮ ao lado do arquivo → **Excluir**. Antes, veja se o arquivo é exatamente o do GitHub. Em caso de dúvida, me mande o print da lista de arquivos.

## Passo 5 — Backup antes de apagar (no começo de novembro)
1. **Código:** os projetos antigos estão em `legado/` no GitHub. Se o inventário mostrar algum projeto de script que não está lá, me mande o código antes de apagar.
2. **Planilhas antigas:**
   - abra cada uma → **Arquivo → Fazer download → Microsoft Excel (.xlsx)**;
   - guarde em `99_Legado_Somente_Leitura/Backup 2026-11`.
   - O .xlsx guarda os links das fotos, não as fotos (por isso as pastas de upload nunca são apagadas).
3. **Tudo de uma vez (opcional):** em takeout.google.com, escolha só **Drive** e a pasta `99_Legado_Somente_Leitura`. O Google gera um .zip.
4. **Apagar:** o que ficou 30 dias em `99_Legado_Somente_Leitura` sem ninguém pedir e **não** está no Passo 2. Depois de apagar, o item fica mais 30 dias na lixeira do Drive.

## Calendário sugerido

| Quando | O quê |
|---|---|
| Agora | Passos 1, 3 (cópias, testes, painéis) e 4 (arquivos de instalação) |
| Segunda, 05/10, com a equipe na aplicação | Formulário 3.0 sem respostas. Arquivar as implantações web antigas. |
| Início de novembro (relatório 15 e fichas de outubro entregues) | Passo 5. Remover `CorteDoControleAntigo`. |
