# Auditoria técnica — 01/10/2026 (versão 2.2)

Revisão do código da aplicação e do Campo 4.0 depois das versões 2.0 a 2.2. Os testes locais usam serviços Google simulados; os números de tempo vêm da prévia com latência simulada de 1 s por chamada, que é a ordem de grandeza de uma chamada `google.script.run`.

## Velocidade: o que foi feito na 2.2

| Antes | Depois |
|---|---|
| Abertura com **3 chamadas em fila** (perfil → mês → agenda): cerca de **3,1 s** só de rede na prévia | Perfil embutido na página pelo `doGet`; mês e agenda pedidos **em paralelo**: cerca de **1,1 s** (−65%) |
| Sem dados até a primeira resposta | Se o cache já tem o mês, a Visão geral **aparece na hora**, sem nenhuma chamada, e se atualiza em segundo plano |
| Cache por usuário, de 30 s | **Cache compartilhado** (ScriptCache) de 10 min, invalidado sozinho quando chega um registro novo; o botão Atualizar força a releitura |
| JavaScript compilado sem minificação: 176 KB | Minificado: 161 KB, já com duas telas novas |
| Detalhe de atividade na Visão geral pedia nova consulta | Reaproveita a agenda já carregada |

## Corrigido nesta rodada

- **Segurança (XSS):** quando uma data vinda da planilha não estava no formato AAAA-MM-DD, `date()` devolvia o texto sem escapar para dentro do HTML. Agora sempre escapa.
- **Instalação:** a conferência de arquivos do `doGet` passou a funcionar com classes, que não ficam em `globalThis`.
- **Código morto:** a tela inicial antiga (`homeMarkup`, `homeLoad`, ilustrações, `kpi`, `bars`, `chart`) foi removida, e a Visão geral ficou num componente próprio (`Inicio.html`).
- **Manifestações:** as colunas seguem a ordem da planilha oficial de Anexos (Canal antes de Tipo). Tipo e canal vêm do registro original da ficha quando existem.

## Pendências priorizadas

| # | Item | Impacto | Proposta |
|---|---|---|---|
| 1 | `Estilos.html` tem **três camadas de tokens** sobrepostas por tema (1.2 → 1.5 → 2.x). Funciona, mas cada ajuste de cor briga com regras antigas | Manutenção e o design futuro | Reescrever num único arquivo de tokens claro/escuro na rodada de design. Reduz o CSS de 51 KB para cerca de 25 KB |
| 2 | `Interacoes.html` ainda concentra Registros, Atendimentos, Ajuda e navegação | Manutenção | Separar Registros e Atendimentos em componentes, como já foi feito com Inicio, Obras e Fechamento |
| 3 | Barra inferior do celular com 7 itens | Toque apertado | Na rodada de design: 4 itens fixos + "Mais" |
| 4 | O Fechamento lê `Registros` inteiro (com JSON) a cada conferência | Fica lento acima de alguns milhares de linhas | Índice por mês ou cache do resumo mensal (mesma técnica da Visão geral) |
| 5 | Observações e histórico de obras são lidos inteiros a cada abertura | Cresce com o tempo | Cache por protocolo ou por obra, invalidado na gravação |
| 6 | Cadastros de pessoas em Script Properties | Limite de 500 KB, mas folgado para a equipe | Migrar para a planilha de dados quando houver Recados/Contatos |
| 7 | Prévia de indicadores: regras por palavra-chave | Pode contar errado se o texto do relato for vago | Mantido como "prévia com regra explicada". Ganha precisão quando o formulário tiver campos de classificação (eixo, tema de treinamento) |
| 8 | Pergunta de protocolo ainda não existe no formulário | Envios de atendimento sem vínculo | Passo manual 2.3 do guia |

## O que não foi alterado de propósito

- **Indicadores 2026** (planilha oficial): a aplicação gera só uma **prévia** numa planilha de apoio, com a regra de cada número. A transcrição continua humana.
- **Formatos oficiais** (ficha Sabesp, Orientador): a aplicação preenche, não redesenha.
- Arquivos com dados pessoais (exemplos de ficha, Anexos de setembro): usados só como referência, fora do Git.
