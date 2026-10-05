# Guia de instalação: Aplicação CPT 2.18 e Campo 4.0 (4.6)

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

> **Novo:** depois de configurar o **CPT • Atualizador** ([ATUALIZACAO_AUTOMATICA.md](ATUALIZACAO_AUTOMATICA.md)), as tabelas "substituir/criar" abaixo são feitas por `atualizarTudoCPT`. Continue executando só as funções de cada passo.

## Atualização 2.28.0 — cronograma colorido, feriados, planilha Excel e impressão nova (≈ 3 min)

1. Rode a atualização pelo **Cloud Shell**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.28.0`) e publique uma **Nova versão**. Não há planilha nova nem permissão nova: tudo é feito no navegador.
2. **Calendário**: cartões menores e tingidos com a cor da frente (bolinhas com todas as frentes envolvidas), título em até 2 linhas e só os primeiros nomes ("Victor, Andreia, Carlos +5"; a lista completa aparece ao passar o mouse e no detalhe). Planejadas com contorno tracejado. Sábado e domingo mais estreitos; hoje em destaque.
3. **Feriados** aparecem sozinhos no calendário, na lista, na planilha e na impressão: nacionais (inclusive Sexta-feira Santa e Consciência Negra), 9/7 (estadual de SP), 8/4 Aniversário de Santo André (Lei municipal 4.148/1973) e Corpus Christi (Decreto municipal 16.465/2013). Carnaval aparece como ponto facultativo. São calculados pela aplicação — nada é lido de agenda externa.
4. **Exportar seleção → Baixar planilha (Excel)**: um arquivo `.xlsx` com duas abas. **Calendário** é o mês em grade, com a bolinha colorida de cada frente e os feriados em vermelho. **Atividades** tem uma linha por atividade, cabeçalho fixo, filtro e data de verdade. Abre no Excel; no Google Planilhas, use Arquivo → Importar (ou abra o arquivo pelo Drive). O CSV simples continua lá.
5. **Imprimir / salvar PDF**: a 1ª página é o calendário do mês, colorido; as seguintes trazem a descrição de cada atividade, dia a dia, com a coluna de data larga (data numa linha, dia da semana e horário embaixo). As cores saem na impressão mesmo sem marcar "Gráficos de plano de fundo".

## Atualização 2.27.1 — menos rolagem em Obras e no Meu espaço (≈ 3 min)

1. Rode a atualização pelo **Cloud Shell** como sempre, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.27.1`) e publique uma **Nova versão** (se a atualização não publicou). Não há planilha nova nem permissão nova.
2. **Obras**: **Bairros** virou uma aba própria, com campo para localizar o bairro (antes ficava no fim da página, depois de todas as obras). Quem só consulta vê as abas Catálogo e Bairros; a gerência vê também Obras de hoje e Para vincular.
3. O **Catálogo** mostra 12 obras por vez e o **Para vincular** 8 registros por vez, com o botão **"Mostrar mais"**. Buscar ou trocar o filtro volta para o começo da lista.
4. **Meu espaço**: abaixo do mascote, as abas **Meu dia** (agenda, checklist e caderno), **Quiz e saber** e **Jogos e placar**. A aba fica presa no alto ao rolar, e o navegador lembra a última escolhida. Um ponto laranja na aba do quiz avisa que a pergunta do dia ainda espera resposta. Quem ainda não vê quiz nem joguinhos continua sem abas.

## Atualização 2.27.0 — fechamento do relatório retirado da aplicação (≈ 5 min)

1. Rode a atualização pelo **Cloud Shell** como sempre. Desta vez a conferência mostra também **"Remover (aposentados)"**: `RelatorioMensalCPT`, `EntregasDoMesCPT`, `AnexosRelatorioCPT`, `ProgramaParceirosCPT`, `EntregasCPT`, `Fechamento`, `Socioambiental` e `Entregas`. Eles são **apagados do projeto no Google** de propósito — se ficassem lá, a base do relatório ainda poderia ser montada. Antes de mudar, a atualização cria a versão de segurança de sempre.
   - Se usar o projeto *CPT • Atualizador* (caminho antigo), cole antes o `atualizador/src/AtualizadorCPT.gs` novo nele; ou apague esses 8 arquivos à mão no editor (⋮ → Excluir).
2. Execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.27.0`) e publique uma **Nova versão** (se a atualização não publicou).
3. **O que saiu** (o grupo "Fechamento do mês" inteiro): Mesa do relatório (Socioambiental), preparo de relatos e diagnósticos, documentos socioambientais, Entregas do mês, base do relatório (Google Docs), Anexos do relatório (planilha oficial), pacote mensal de fichas (ANEXO 4) e Programa Parceiros. Também os botões "Preparar", o painel "Para o relatório" e a missão de relatos não preparados.
4. **O que continua**: a ficha oficial de cada caso em Atendimentos; o lembrete da planilha de controle (Visão do mês · Contrato); relatos em resumo com o guia e o comentário privado; a contagem de ações por eixo; e o **RDAS**, que é do Campo 4.0 e não depende de nada que saiu.
5. **Nada foi apagado das planilhas e do Drive**: os relatos já preparados, as entregas e os arquivos gerados continuam onde estavam. O código fica no histórico do GitHub para recomeçar o fechamento depois.

## Atualização 2.26.8 — "Para vincular" com busca e obras finalizadas (≈ 3 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.26.8`) e publique uma **Nova versão**.
2. **Obras → Para vincular**: no lugar da lista enorme, um campo para **digitar** o nome, apelido, nome oficial, bairro ou código da obra. As sugestões aparecem enquanto digita (sem precisar de acento); Enter escolhe a primeira, as setas mudam e Esc fecha. Vale também para **trocar** um vínculo em "Vinculados recentemente".
3. **Obras finalizadas** também aparecem (marcadas "Finalizada"), para ligar as atividades pós-obra. As em andamento vêm primeiro.
4. O registro original continua sem mudança; o vínculo vale nas telas, no painel e no relatório, como antes.

## Atualização 2.26.7 — liberar para a equipe numa função só (≈ 5 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.26.7`) e publique uma **Nova versão**.
2. **Antes de liberar**, confira em **Equipe e acessos** se cada pessoa está ativa e com o papel certo (cadastros e papéis continuam só com você depois da liberação).
3. No editor do Apps Script, escolha a função **`liberarParaEquipeCPT`** (arquivo `PerfisCPT.gs`) e clique em **Executar**, com a conta proprietária. Ela faz duas coisas:
   - **aprova de uma vez** todo o conteúdo do quiz que está "a revisar" (o que você tiver suspendido continua suspenso), com a observação "Aprovado em bloco pelo proprietário";
   - **desliga a trava de testes**: visual novo, mascotes novos, loja, quiz, Álbum, Mapa e Organograma para todos; e as ações da gerência (obras, obras do dia, Programa Parceiros, Anexos, Entregue, planilha de controle, organograma) passam para Gestão e Administrativo.
   O resultado mostra quantos itens foram aprovados. Pode executar de novo: o que já foi decidido não muda.
4. A equipe vê tudo ao **recarregar a página**.
5. Para voltar atrás na trava: **`travarConfiguracaoCPT`** (o conteúdo aprovado continua aprovado; dá para suspender item a item na Revisão do conteúdo).
6. Também existem separadas: `aprovarTodoConteudoCPT` (só o conteúdo) e `liberarConfiguracaoCPT` (só a trava).

## Atualização 2.26.6 — número curto do caso ("Caso 17") (≈ 3 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.26.6`) e publique uma **Nova versão**. Nenhum arquivo novo; o Campo 4.0 não muda.
2. **Como a equipe já fala**: cada caso aparece como **"Caso 17"** (os últimos números do protocolo `ATD20260017`) na lista de Atendimentos, no título da ficha, na Auditoria, nas Frentes de serviço e na busca (Ctrl K). O protocolo completo continua logo abaixo.
3. **Buscar**: digitar `17`, `caso 17` ou `#17` acha o caso direto (na página Atendimentos e no Ctrl K). O protocolo completo também continua funcionando.
4. **O protocolo oficial não mudou** (ATD + ano + sequência): ele está nas fichas no modelo Sabesp, nos nomes dos arquivos, nas notas da planilha oficial dos Anexos e no Painel da Execução; trocar quebraria esses vínculos. O número curto é só a forma de mostrar e de achar.
5. **Virada do ano**: a sequência do protocolo recomeça em janeiro. Se o mesmo número existir em dois anos, o caso aparece com o ano — **"Caso 17/26"** e **"Caso 17/27"** — e a busca aceita `17/26`.

## Atualização 2.26.5 — Galeria da Comunicação mostra as fotos sem depender da pasta (≈ 3 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.26.5`) e publique uma **Nova versão**. Nenhum arquivo novo, nenhuma autorização nova.
2. **Comunicação → Galeria**: a mesma solução do Álbum (2.26.3). O navegador tenta o Drive com a conta de quem vê; se ela não tiver leitura na pasta das fotos (era o caso da comunicadora), a aplicação entrega a miniatura com a conta proprietária. Ao ampliar uma foto assim, aparece a miniatura no lugar do visualizador do Drive (que também pediria acesso).
3. Segurança: só arquivos que estão na galeria do mês, para quem já pode ver a galeria (Comunicação, Socioambiental e Gestão).
4. **Ainda dependem de leitura na pasta**: baixar o pacote .zip é feito pela aplicação (funciona), mas **"Abrir no Drive"** e os **vídeos** abrem no próprio Drive — para isso a comunicadora precisa de acesso de leitura às pastas listadas em **Conectores e pastas**.

## Atualização 2.26.4 — tela de notebook (ThinkPad) mais folgada (≈ 3 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.26.4`) e publique uma **Nova versão**. Só estilos; nada muda nos dados.
2. **Computador**: o nome da página no topo não quebra mais em três linhas; a busca encolhe para caber; as etiquetas dos cartões das Entregas ("A fazer") ficam numa linha.
3. **Telas baixas** (até 820 px de altura útil — notebook com zoom do Windows em 125–150%): menu lateral mais compacto (todos os itens do dia a dia aparecem), jardim do menu numa faixa fina, topo mais baixo, menos espaço em cima da página e entre os blocos; na Visão do mês os botões vão para a direita do cabeçalho, como na tela grande.
4. Tela grande, tablet e celular: sem mudança.

## Atualização 2.26.3 — miniaturas do Álbum sempre aparecem (≈ 3 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.26.3`) e publique uma **Nova versão**. Nenhum arquivo novo, nenhuma autorização nova.
2. **Causa**: as miniaturas eram abertas pelo navegador direto no Drive, com a conta logada nele (ex.: a @veolia.com). Quando essa conta não tem leitura na pasta das fotos, o Drive recusa e aparecia o ícone de câmera — enquanto a aplicação roda com a sua conta proprietária, que vê tudo.
3. **Agora**: o navegador tenta o Drive primeiro (rápido, como antes); a foto que falhar é pedida à aplicação, que lê com a conta proprietária, em lotes de 12, guardando por 6 horas. Vale para o Álbum (grade e foto ampliada) e para o quadro do Meu espaço. A miniatura que vem pela aplicação é um pouco menor (a do próprio Drive).
4. Segurança: a aplicação só entrega miniatura de foto que o Álbum mostra (do período ou favorita); qualquer outro arquivo é recusado.
5. Para a equipe, quando liberar: não é preciso compartilhar as pastas de fotos para o Álbum funcionar (compartilhar só deixa mais rápido e nítido).

## Atualização 2.26.2 — Álbum com as fotos dos meses anteriores (≈ 3 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.26.2`) e publique uma **Nova versão**. Nenhum arquivo novo.
2. **Álbum da equipe → Escolha suas favoritas** mostra as fotos dos relatos do mês escolhido **e dos dois meses anteriores**, separadas por mês (mais novas primeiro). No começo do mês o álbum não fica mais vazio.
3. Uma foto antiga favoritada agora entra no **Álbum do mês** em que foi escolhida (e continua no álbum do mês da foto).
4. Custo: a primeira abertura da hora lê três meses da base (numa leitura só); depois fica guardado por 1 hora, renovado sozinho quando entra registro novo.

## Atualização 2.26.1 — mascote do tamanho certo e páginas do fechamento mais leves (≈ 3 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.26.1`) e publique uma **Nova versão**. Nenhum arquivo novo.
2. **Meu espaço**: o mascote não encolhe mais sozinho. A causa: quando as missões chegavam (logo depois da página), o humor do mascote era redesenhado no tamanho antigo; agora todo redesenho usa o mesmo tamanho.
3. **Check-up de carregamento** (todas as páginas pedem uma única consulta ao servidor ao abrir; nenhuma repetida):
   - **Entregas do mês**: o cartão dos Anexos chega junto com as entregas (um pedido a menos); a conferência lê a aba "Entregas mensais" uma vez (antes, duas) e só abre a ficha detalhada dos atendimentos do período (antes, lia três vezes cada caso de todo o histórico).
   - **Socioambiental**: os documentos gerados são lidos de uma vez (antes, uma leitura por relato — com muitos relatos no mês, era o que mais pesava).
   - **Programa Parceiros**: a linha dos meses da máscara oficial é lida uma vez por abertura.
   - **Voltar para Entregas do mês ou Socioambiental** no mesmo mês mostra a tela **na hora**, com o que já estava aberto, e confere em segundo plano; só redesenha se algo mudou (sem esqueleto e sem piscar; não troca a tela durante uma geração ou digitação).
   - Nada muda nos dados nem nas planilhas; números e conferências continuam calculados na hora (sem guardar resultado antigo no servidor).

## Atualização 2.26.0 — banco revisto, revisão do conteúdo, loja, Meu espaço, Anexos, planilha de controle e organograma (≈ 10 min + revisão do conteúdo)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.26.0`) e publique uma **Nova versão**. Chegam os arquivos novos `RevisaoConteudoCPT.gs`, `OrganogramaCPT.gs`, `ControleContratoCPT.gs`, `AnexosRelatorioCPT.gs` e `Organograma.html`.
2. **Correções pedidas**: a página não "pisca" mais ao carregar — a causa era uma animação antiga que fazia o título e os cartões reaparecerem a cada redesenho (esqueleto → dados → Atualizar → salvar); agora a entrada anima uma vez só, quando o conteúdo chega, e o título não sobe de novo (vale para todos); o **"i" de informação** abre por cima do conteúdo; a barra **2 / 4.1 / 4.2 … / 3** saiu da página Socioambiental. O botão da Mesa virou **"Gerar relatos do mês (Docs)"**, para não confundir com a planilha dos Anexos.
3. **Banco de saneamento (150 itens)**: 50 curiosidades no formato *fato + por que importa* e 100 perguntas, com eixo em cada item (Na prática 59%, Para entender 26%, Fato curioso 15%). Itens apontados na revisão corrigidos ou trocados (C27, C31, C33, Q039, Q049, Q050, Q057, Q058, Q059 e os de precisão); sem as 8 perguntas de cores, números de lei e datas soltas; fontes primárias (Planalto, Câmara, OMS/UNICEF, Trata Brasil, Semasa, Prefeitura, Fiocruz, Recicla Latas, Ministério das Cidades) ou **"Prática da equipe"** (sem link). Temas novos: coleta × afastamento × tratamento, esgoto × drenagem, obra concluída × sistema operando, falar do benefício sem prometer, registrar uma reclamação útil, ouvir quem não vê benefício, diagnóstico, comunicação prévia e acompanhamento. O texto para conferir fora da aplicação está em `docs/CONTEUDO_SANEAMENTO.md`.
4. **Revisão do conteúdo** (Consultas e cadastros, só você): cada item com Aprovar, Suspender ou Voltar para revisão, com observação. Não há aprovação em lote. Suspenso some para todos (até para você no quiz); a equipe só verá o que você aprovar, quando o quiz for liberado.
5. **Loja do bloco D** (elenco novo; nos testes, só você): capacetes azul, verde e laranja; coletes amarelo-limão e azul; luvas amarelas e azuis; galocha amarela e bota branca; moletom verde, camisa xadrez e jaqueta jeans; e as **cores especiais** menta, coral, dourado e azul-noite (120 pontos cada, compra uma vez e depois trocar é livre).
6. **Meu espaço** (visual novo): o mascote ficou maior, em frente a um **quadro na parede** — a foto mais favoritada da semana no Álbum (ou uma paisagem, se ainda não houver foto); tocar no quadro abre o Álbum. O **caderno** virou um caderninho de capa marrom, folha pautada com margem e marcador; a capa abre na primeira vez e trocar de dia vira a página. Ele **guarda cada dia** numa página (as anotações de dias anteriores ficam em "Dias anteriores" ou voltando o dia no checklist).
7. **Anexos do relatório = a planilha oficial** (`1Et4…`). Em **Entregas do mês → Anexos do relatório (planilha oficial)**:
   - **Conferir o que muda** (nada é gravado): quantos casos do mês entram, quais atualizam e quais já estão iguais;
   - **Atualizar o Controle de manifestações**: os casos do mês (os mesmos das fichas do ANEXO 4) entram nas 10 colunas oficiais pela regra da 3.2.1 — protocolo na nota da data, atualiza no lugar, acrescenta no fim, **nunca apaga nem reordena**, não reabre caso concluído, não troca Providência/Obs. escritas à mão por vazio e não mexe em fórmulas;
   - **Matriz de Contatos e Indicadores 2026 não são alterados**; links para **baixar Excel e PDF** da planilha inteira.
   - Gravar na planilha oficial: Gestão e Administrativo; **nos testes, só você**. A conta proprietária precisa ter edição na planilha (confira em **Conectores e pastas**, que agora trata Anexos e a planilha de controle como planilhas).
   - O acionador antigo `atualizarAnexosAtendimentosAgendado` continua **excluído** (ele escreveria dados parados na mesma aba).
8. **Planilha de controle do contrato** (`1pQJ5…`, preenchida 100% à mão): a aplicação **nunca escreve nela**. Em **Visão do mês → Contrato** aparece o cartão do mês a responder (o anterior, prazo dia 10), com o link direto na aba, a última alteração do arquivo e os **indicadores do mês para conferir** (ações, pessoas, frentes, bairros, diagnósticos, pesquisas, atendimentos recebidos/concluídos/em aberto, relatos prontos). Gestão e Administrativo recebem a **missão mensal** no checklist até alguém marcar **"Já respondi este mês"** (a marca fica na aplicação, não na planilha).
9. **Organograma** (Consultas e cadastros; nos testes, só você — depois de liberar, todos veem): desenho por área, com título, legenda e a quem cada pessoa responde. Baixe em **imagem PNG**, **SVG** ou **PDF** (imprimir → Salvar como PDF, A4 deitado). Para montar: **Trazer da equipe** (cria um cartão para cada pessoa de Equipe e acessos) e depois ajuste cargo, área e "Responde a" tocando em cada cartão. Os nomes ficam só na planilha de dados (nada no GitHub). Editar: Gestão e Administrativo; nos testes, só você.

## Atualização 2.25.0 — acabamento do visual novo, página por página (≈ 3 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.25.0`) e publique uma **Nova versão**.
2. No visual novo (nos testes, só você):
   - **Ícones de traço** no lugar dos emojis em todas as telas (Meu espaço, Saber mais, Joguinhos, Placar, Álbum, Comunicação, Recados, Gestão, Socioambiental e Entregas). Para a equipe, até liberar, continua tudo como está.
   - **Cartão de boas-vindas**: selos neutros com o ícone colorido (recado em vermelho, pontos em âmbar, caderno em madeira); a etiqueta "a revisar" ficou discreta; o presente da semana virou um cartão quente, sem tracejado laranja nem brilho piscando.
   - Saber mais, Joguinhos e Placar no mesmo padrão; o coração do Álbum fica cheio quando a foto é sua; gotinhas da forca e cadeado em traço.
   - **Como usar** e **Entregas**: os ícones dos cartões seguem a cor do visual (antes tinham azul e laranja fixos). Links de texto no verde de destaque.

## Atualização 2.24.1 — gota d'água azul no visual novo (≈ 3 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.24.1`) e publique uma **Nova versão**.
2. No visual novo, a gota do logo e a plaquinha do Meu espaço passam a ser uma gota d'água azul com brilho (a vermelha parecia sangue).

## Atualização 2.24.0 — Visual novo "Veolia acolhedor" (≈ 5 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.24.0`) e publique uma **Nova versão**. Chega o arquivo novo `Visual.html`.
2. **Só você vê o visual novo** durante os testes; a equipe continua com o visual atual até `liberarConfiguracaoCPT`. Inspirado na recepção e no escritório da Veolia:
   - **Menu lateral** como a parede verde ripada, com a luz da sanca em cima e um jardim de plantas embaixo; a página ativa parece uma placa de madeira clara. Só a lista de páginas rola: o jardim e a conta ficam fixos.
   - **Fundo** em tom de madeira clara, com a luz quente das luminárias; **cartões** brancos como o balcão, com uma luz quente embaixo.
   - **Visão do mês**: o cabeçalho vira a parede de plantas da recepção.
   - **Meu espaço**: o mascote fica na recepção — parede ripada, parede de plantas atrás do cartão, duas luminárias pendentes, a placa vermelha da marca e piso de madeira.
   - **Títulos das páginas** com uma folhinha verde; **vermelho Veolia** só nos destaques (marca, avisos, número de recados).
   - **Fonte** Plus Jakarta Sans (Google Fonts), carregada só para quem usa o visual novo.
   - **Escuro**: a recepção à noite. **Mês**: a parede ganha o tom da campanha e as plantas continuam verdes.
3. **Movimento com significado**: a página nova sobe suave e os cartões chegam em cascata; os pontos contam até o valor novo e folhas comemoram quando você ganha pontos ou vence um jogo; as plantas balançam devagar e as luminárias oscilam; o cenário do Meu espaço acompanha o mouse (parallax). Quem marca **"Reduzir movimentos"** (em Como usar) ou usa essa preferência no sistema não vê nada se mexendo.
4. Contraste conferido por teste (texto, destaques, botões, menu sobre a parede verde), no claro e no escuro.

## Atualização 2.23.1 — revisão do tema do mês e do placar (≈ 3 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.23.1`) e publique uma **Nova versão**.
2. No tema do mês, os fundos suaves (quadrinhos do placar, cartões travados) agora seguem a cor da campanha, em vez de ficarem verde-menta.

## Atualização 2.23.0 — Placar da equipe (≈ 3 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.23.0`) e publique uma **Nova versão**.
2. No **Meu espaço** aparece o **Placar da equipe** (nos testes, só para você): os pontos que a equipe toda somou na semana (segunda a domingo), a **meta coletiva de 400 pontos**, os totais de tarefas feitas, acertos no quiz, vitórias nos joguinhos e fotos favoritadas, e as últimas 4 semanas.
3. Só números da equipe: o placar não mostra nomes, mascotes, pontos de alguém nem quantas pessoas participaram. É o mesmo para todo mundo.
4. A meta de 400 pontos é um valor inicial: me diga se quer outro.

## Atualização 2.22.0 — Tema do mês na aparência (≈ 3 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.22.0`) e publique uma **Nova versão**.
2. No seletor de aparência (topo, à direita) aparece **Mês**, ao lado de Claro e Escuro (nos testes, só para você). É o tema Claro com as cores da campanha de saúde do mês (a mesma do laço do mascote): Outubro Rosa, Novembro Azul… e troca sozinho na virada do mês.
3. Todas as 12 paletas foram conferidas: o texto e os botões continuam legíveis (contraste de pelo menos 4,5:1).
4. A escolha fica salva no navegador de cada pessoa. Quem não pode usar ainda e tinha "Mês" salvo volta para o Claro.

## Atualização 2.21.1 — revisão do Álbum e dos Joguinhos (≈ 5 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.21.1`) e publique uma **Nova versão**.
2. O que mudou: o Meu espaço lê cada aba uma vez só por abertura (antes, Checklist e Álbum eram lidos duas vezes); o selo de versão do menu lateral voltou a acompanhar a versão (estava parado em 2.18).

## Atualização 2.21.0 — Joguinhos: forca do saneamento e quebra-cabeça (≈ 5 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.21.0`) e publique uma **Nova versão**. Chegam `JogosCPT.gs` e `Jogos.html`.
2. No **Meu espaço** aparece o painel **Joguinhos** (nos testes, só para você):
   - **Forca do saneamento**: libera com **5 dias de checklist pontuado**. 40 palavras do nosso trabalho, cada uma com dica; até 6 erros (cada erro seca uma gotinha). Funciona também com o teclado.
   - **Quebra-cabeça**: libera com **10 fotos favoritas** (ativas) no Álbum. Usa uma foto do álbum da equipe; sem foto (ou sem acesso a ela), usa o seu mascote. Toque em duas peças para trocar.
   - **Limite**: 3 partidas por dia de cada jogo. A **primeira vitória do dia** em cada jogo vale **5 pontos**, que somam aos do checklist e do quiz na loja.
   - O servidor refaz a partida (letras da forca, trocas do quebra-cabeça) antes de dar os pontos.
3. As partidas ficam na aba nova **Jogos** da planilha de dados da aplicação.

## Atualização 2.20.0 — Álbum da equipe: favoritas e Fotos da semana (≈ 5 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.20.0`) e publique uma **Nova versão**. Chegam `AlbumCPT.gs` e `Album.html`.
2. No menu **Dia a dia** aparece **Álbum da equipe** (nos testes, só para você):
   - **Fotos da semana**: as mais favoritadas pela equipe de segunda a domingo (até 6), com o número de corações.
   - **Álbum do mês**: todas as fotos do mês que alguém favoritou.
   - **Escolha suas favoritas**: as fotos dos relatos do mês (as mesmas da galeria, sem vídeos). Cada pessoa escolhe **até 2 por dia**; desmarcar uma de hoje libera a vaga.
   - Ninguém vê quem favoritou: é um destaque de fotos, não de pessoas.
3. As favoritas ficam na aba nova **Álbum** da planilha de dados da aplicação.
4. **Antes de liberar para a equipe** (`liberarConfiguracaoCPT`): as miniaturas vêm do Drive e só aparecem para quem tem leitura na pasta das fotos dos relatos. Hoje, Atendimento e Comercialização podem não ter esse acesso; sem ele, a foto aparece como um quadro com 📷. Decida se a pasta deve ser compartilhada com a equipe (a aplicação não muda compartilhamentos sozinha).

## Atualização 2.19.1 — revisão dos mascotes: como as peças vestem cada personagem (≈ 5 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.19.1`) e publique uma **Nova versão**.
2. O que mudou no desenho (só no elenco novo, que nos testes é só seu):
   - **Capacetes** (branco, amarelo, dourado), boné e coroa agora assentam na cabeça de cada bicho, em vez de ficarem pequenos no alto.
   - **Fone e protetor auricular** ficam nas laterais da cabeça (no sapinho não cobrem mais os olhos).
   - **Laço do mês** subiu para o alto do peito, longe das patinhas; com as camisetas Veolia e CPT, o nome desce um pouco para não ficar embaixo do laço.
   - **Ferramentas na mão** ficaram maiores (troféu, trena e muda quase sumiam).
   - **Pensativo** com ferramenta: quem vai ao queixo é a outra mão, e a ferramenta não cobre mais o rosto.
3. Novo teste automático: desenha as 10 espécies com todas as peças em todas as expressões (1.980 desenhos) e confere as posições.

## Atualização 2.19.0 — Saber mais: curiosidades, campanha do mês e quiz (≈ 5 min + revisão do conteúdo)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.19.0`) e publique uma **Nova versão**. Chegam os arquivos novos `ConteudoSaneamentoCPT.gs`, `QuizCPT.gs` e `Saber.html`.
2. Abra o **Meu espaço** com a sua conta (proprietário). Aparecem:
   - o balão **"Você sabia?"** ao lado do mascote, com uma curiosidade por dia e o link da fonte;
   - o painel **Saber mais**, com a campanha de saúde do mês (a mesma do laço) e as datas do saneamento do mês;
   - a **pergunta do dia** (2 pontos se acertar, uma por dia) e o **quiz da semana** (5 perguntas, 10 pontos por acerto, de segunda a domingo).
   Os pontos do quiz somam aos do checklist e valem na loja. O mascote fica **pensativo** enquanto a pergunta do dia espera resposta.
3. **Revisão do conteúdo:** tudo está em `docs/CONTEUDO_SANEAMENTO.md` (35 curiosidades e 65 perguntas, cada uma com fonte). Enquanto um item não for aprovado, só você o vê, com a marca **A REVISAR**. Mande os IDs aprovados (ex.: `C01`, `Q001`) e as correções; eles entram em `ConteudoSaneamentoCPT.aprovadas`.
4. **Período de testes:** a equipe não vê nada disso e não consegue responder (o servidor recusa). Depois de `liberarConfiguracaoCPT`, as outras pessoas veem **só o conteúdo aprovado**.
5. As respostas ficam na aba nova **Quiz** da planilha de dados da aplicação (cada pessoa só lê as próprias; sem ranking).

## Atualização 2.18.2 — mascotes novos (elenco chibi), kit EPI, camiseta Veolia e laço do mês (≈ 5 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.18.2`) e publique uma **Nova versão**. O atualizador traz o arquivo novo `Mascotes.html`.

**O que muda no Meu espaço:**
- **Elenco chibi:** urso, águia, gato, cachorro, pato, capivara, sapinho e gota d'água. Cada um tem o seu corpo (urso gordinho, águia fortinha, gato esguio…).
- **Clássicos:** dinossauro e abelha saem da escolha inicial e vão para a loja do guarda-roupa por **150 pontos**. Quem já tem continua com eles, no desenho novo.
- **Kit EPI inicial:** capacete **branco**, colete, luvas e bota preta são de todo mundo (não precisa ganhar). Todo mascote novo já chega vestido com eles. Os mascotes que já existem continuam com a roupa que têm, e o kit fica disponível no guarda-roupa.
- As **peças que as pessoas já ganharam ou compraram** continuam valendo, redesenhadas no estilo novo e sob medida para cada bicho: chapéus, óculos, cachecol, crachá, medalha, capa, camisas (com manguinha), ferramentas seguradas pela patinha e botas com sola.
- **Camiseta Veolia** (vermelha, com VEOLIA em branco): peça comum de roupa, ganha no presente da semana ou do caderno.
- **Olhos maiores e mais fofos** (a águia continua decidida, a capivara tranquila).
- **Laço do mês** (novo encaixe **Broche**): o lacinho da campanha de saúde do mês no peito, que muda de cor sozinho (Outubro Rosa, Novembro Azul, Dezembro Vermelho, Janeiro Branco…). Faz parte do kit: é de todo mundo e já vem nos mascotes novos.
- **Humor do mascote:** dorme depois das 21h, comemora quando uma tarefa do checklist vale pontos, fica surpreso quando chega comentário da gestão e feliz com o checklist completo.

**Durante os testes, só você vê o elenco novo.** As demais pessoas continuam com os mascotes e a escolha de antes até `liberarConfiguracaoCPT`. Ao liberar, todos passam a ver o elenco novo, e quem tinha o mascote antigo vê o mesmo bicho no desenho novo.

---

## Atualização 2.17.1 — Mapa de Santo André (≈ 10 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.17.1`) e publique uma **Nova versão**.
2. Abra a aplicação → **Mapa** (em Consultas e cadastros). **Durante os testes, só você vê esta página.**
3. Em **Posicionar no mapa**, clique em **Sugerir pontos dos bairros (pesquisa do Google)**. Ele usa a pesquisa de endereços do Google, que já vem com o Apps Script, sem custo e sem chave.
   - Na primeira vez, o Google pode pedir autorização de novo. Aceite com a sua conta.
   - Até 40 bairros por clique. Repita até não sobrar bairro sem ponto.
   - Bairro que a pesquisa não acha dentro de Santo André fica para o clique.
4. Confira os pontos no mapa. Para corrigir um bairro ou posicionar uma obra, escolha na lista (○ = sem ponto, ● = já posicionado) e **clique no mapa**.

**O que o mapa mostra:**
- **Obras** (azul): as **confirmadas hoje** (Obras → Obras de hoje) ficam em laranja e pulsando.
- **Ações socioambientais** (bolhas verdes por bairro, maiores com mais ações) e **atendimentos** (bolhas vermelhas por obra ou bairro).
- **Bairros** (pontos cinza).
- Período: **Hoje**, **7 dias** ou **Mês da competência**. As camadas ligam e desligam.

**Privacidade:** só contagens por obra e por bairro saem do servidor. Nenhum endereço, nome ou protocolo de munícipe vai para a tela. O atendimento entra na obra pela "Frente de obra". Sem obra, entra no bairro cujo nome aparece no endereço. Sem nenhum dos dois, conta como "sem local".

**Onde ficam os pontos:** obras nas colunas **J:K** da aba Obras (Latitude e Longitude, as mesmas do PAC16). Bairros nas novas colunas **M:N** da aba Bairros. Toda mudança entra no **Histórico de obras**.

**Fundo do mapa:** as imagens oficiais do OpenStreetMap, livres também para uso por empresa, com o crédito "colaboradores do OpenStreetMap" no canto. Elas são carregadas pelo navegador de cada pessoa. No tema escuro, recebem um filtro de cor. A biblioteca é o Leaflet, também gratuita. Sem internet para a biblioteca, a página mostra as mesmas contagens em lista.

---

## Atualização 2.16.1 — qualidade dos relatos, comentário da gestão e missões por área (≈ 5 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.16.1`) e publique uma **Nova versão**.

**Qualidade dos relatos (sem nota e sem ranking):** cada relato de atividade é conferido em 6 pontos: **O quê, Onde, Público, Resultado, Encaminhamento e Tamanho** (ao menos 5 linhas). Aparece como selinhos ✓/○ em Visão do mês → **Relatos em resumo**; passando o mouse, aparece a dica. A conferência usa palavras-chave simples, é uma ajuda para escrever e não avalia pessoas.

**Guia "Como escrever um bom relato":** na Mesa do relatório, em Relatos em resumo e nas dicas. Traz os 6 pontos com exemplos e um relato completo de exemplo.

**Comentário privado da gestão:** em Relatos em resumo, **Comentar** abre um texto já com as dicas do que faltou. Só quem escreveu e a gestão veem. A pessoa recebe como missão no Meu espaço, lê, pode responder e marca como visto. A gestão vê "Comentário enviado/visto" e a resposta no cartão. Quem escreveu é achado pelo nome do formulário. Sem nome igual na Equipe, o comentário fica guardado e o aviso pede para combinar pessoalmente.

**Missões novas** (no checklist do Meu espaço):
- **Quem escreveu um relato** nos últimos 7 dias com algo faltando recebe as dicas daquele relato ("Entendi" tira a missão).
- **Atendimento:** casos abertos há 30 dias ou mais.
- **Socioambiental:** relatos do mês ainda não preparados, a partir de 5 dias antes do prazo do relatório (o prazo do cartão Relatório em Entregas do mês).

**Diagnóstico:** quem prepara manda para **Em revisão**; **aprovar (Pronto)** agora é só com Gestão ou Administrativo. Um diagnóstico aprovado só muda voltando para Em revisão.

**Durante os testes, tudo isso fica só com você:** só você recebe missões e só você comenta relatos. Os selinhos de qualidade e o guia já aparecem para quem tem acesso. Depois de `liberarConfiguracaoCPT`, as missões chegam a cada pessoa e Gestão e Administrativo podem comentar.

---

## Atualização 2.15 — Entregas do mês (≈ 5 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.15.0`) e publique uma **Nova versão**.

**A página "Fechamento do mês" agora se chama "Entregas do mês"** (no menu, no mesmo lugar; a busca ainda acha por "fechamento"). No topo, 4 cartões:

| Cartão | O arquivo vem de |
|---|---|
| Relatório mensal | "Gerar base do relatório", na mesma página |
| Anexos do relatório | "Gerar anexos do mês", na Mesa Socioambiental |
| Programa Parceiros | A última publicação na máscara oficial |
| Atendimentos | A pasta das fichas do mês e o **.zip** (botão "Montar .zip") |

- Cada cartão tem **situação** (A fazer → Em preparo → Em revisão → Entregue), **responsável**, **prazo** (sugerido: dia 5 do mês seguinte) e **versão**. Se já existe arquivo e ninguém mexeu, o cartão aparece "Em preparo".
- **Ao marcar Entregue**, uma cópia do arquivo fica guardada na pasta do mês, em **Entregues/<entrega> · vN**. Gerar de novo depois não muda o que foi entregue; entregar de novo vira a versão seguinte. Do Programa Parceiros fica só o link (a máscara é oficial e compartilhada).
- O **.zip das fichas** junta os PDFs da pasta Fichas do mês. Acima de 45 MB o Google não monta o .zip; aí use o link da pasta.
- **Durante os testes, só você altera.** Socioambiental, Comunicação, Gestão e Administrativo veem os cartões. Depois de `liberarConfiguracaoCPT`, eles mudam situação, responsável e prazo; **Entregue** fica com Gestão e Administrativo.
- Os dados ficam na aba **Entregas do mês** da planilha de dados da aplicação.

---

## Atualização 2.14.1 — nome de uso das obras, apelidos e bairros na aplicação (≈ 5 min)

1. Rode **`atualizarTudoCPT`**. Ele troca o código da Aplicação **e do Campo 4.0** (4.6.0).
2. Execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.14.1`) e publique uma **Nova versão**.

**Novo em Obras:**
- **Nome de uso.** Cada obra pode ter um nome curto, o que a equipe usa no dia a dia. Ele aparece nas telas, no relatório e na lista do formulário de campo. O nome oficial continua guardado e aparece embaixo, em cinza. Sem nome de uso, vale o oficial.
  - Dois nomes iguais não passam: o nome de uso não pode repetir o nome (oficial ou de uso) de outra obra.
  - Envios antigos continuam ligados à obra certa, porque a ligação é pelo código `[OBR-…]`, que segue no fim de cada opção do formulário.
- **Também chamada de.** Outros nomes da obra, separados por vírgula. Servem só para a busca (na página Obras e no Ctrl+K).
- **Bairros.** No fim da página Obras, abra **Bairros** para cadastrar um bairro novo, tirá-lo ou devolvê-lo ao formulário e anotar outros nomes. O nome de um bairro existente não muda pela aplicação, porque as obras e os registros guardam o bairro pelo nome.
- Tudo entra no **Histórico de obras** e chega ao formulário em até 1 hora, como já acontecia com as obras.
- Durante os testes, só você edita. Gestão e Administrativo passam a editar depois de `liberarConfiguracaoCPT`.

**Missões (novo, no checklist do Meu espaço):** tarefas automáticas que levam direto ao lugar certo e somem quando o trabalho é feito. Por enquanto, só para Gestão e Administrativo:
- **Confirmar as obras de hoje** (a partir das 7h). Em Obras → **Obras de hoje**, marque as obras com frente de serviço no dia. A tela já sugere as do cronograma do dia e as confirmadas ontem. Há a opção **Nenhuma obra neste dia**, e dá para corrigir um dia anterior.
- **Vincular registros de "outra obra"**. Em Obras → **Para vincular**, escolha a obra de cada registro enviado como "Obra ainda não cadastrada" (a observação final aparece no cartão) ou cadastre a obra nova. **O registro original não muda.** O vínculo fica na planilha de dados da aplicação, aba **Vínculos de obra**, e vale nas telas, no painel e no relatório.

**Painel da gestão → Frentes de serviço → Obras ativas × ações:** cada dia do mês com obras confirmadas, ações registradas, obras ativas sem ação e ações em obra não ativa. Dia sem confirmação aparece como **não informado**. As confirmações ficam na aba **Obras do dia** da planilha de dados da aplicação.

**Durante os testes, tudo isso fica só com você:** catálogo de obras e bairros, obras de hoje, vínculos e as missões. Gestão e Administrativo não veem as abas nem as missões até você executar `liberarConfiguracaoCPT`. Sua conta (proprietária) nunca é travada.

Vinculou errado? Em Obras → Para vincular → **Vinculados recentemente**, troque a obra do registro.

**Na planilha da Base:** a aba Obras ganha as colunas **AJ (Nome de uso)** e **AK (Também chamada de)**. A aba Bairros ganha a coluna **L (Também chamado de)**. Elas são criadas no primeiro salvamento pela aplicação. Não edite essas colunas à mão.

---

## Atualização 2.13.1 — correções: galeria, fotos do relato, ícone do mascote (≈ 5 min)

1. Rode **`atualizarTudoCPT`**, execute **`instalarAplicacaoCPT`** (deve mostrar `versao: 2.13.1`) e publique uma **Nova versão**.

**Corrigido:**
- **Galeria da Comunicação sem fotos.**
  - Causa: a galeria só reconhecia fotos gravadas como link. O Formulário 4.0 grava o código do arquivo puro e às vezes guarda os detalhes num arquivo à parte.
  - Agora a galeria e o detalhe do registro usam a mesma leitura de fotos.
- **Seleção de fotos do relato embaralhada.** A galeria usava o mesmo nome de estilo que o relato. Cada um agora tem o seu.
- **"Minha visão" saiu da lateral.** A troca de tela fica no **Ver como**. No topo aparece o **ícone do seu mascote**, que leva ao Meu espaço.
- **Socioambiental e Comunicação:** os grupos do menu começam abertos. Só Gestão e Administrativo começam com eles fechados.

---

## Atualização 2.13 — listas em linhas com painel ao lado (≈ 5 min)

1. Rode **`atualizarTudoCPT`**.
2. Execute **`instalarAplicacaoCPT`**. Deve mostrar `versao: 2.13.0`.
3. Publique uma **Nova versão**.

**O que muda:**
- **Atendimentos** em linhas: Protocolo · Nome · Assunto · Situação · Com quem está · **Dias** · Próxima ação.
  - Os dias têm cor: até 29 verde, de 30 a 59 amarelo, 60 ou mais vermelho.
- **Registros** em linhas: Data · etiqueta do procedimento (Relato, Pesquisa, Vistoria, Diagnóstico) · Atividade · Bairro · Responsável.
- **Contatos** em linhas: Nome · Instituição · Tipo · Bairro, com **Ligar** e **WhatsApp** na própria linha.
- As listas trazem **50 por vez**, com "Mostrar mais".
- **No computador, o detalhe abre num painel à direita**, e a lista continua visível e clicável:
  - **↑ ↓** ou **J/K** passam ao item anterior ou ao próximo;
  - **Esc** ou ✕ fecha;
  - o painel tem as mesmas ações e permissões de antes.
- **Em telas médias e no celular**, o detalhe abre como janela por cima. No celular, cada linha vira duas faixas.

---

## Atualização 2.12 — Visão do mês e Painel numa página só (≈ 5 min)

1. Rode **`atualizarTudoCPT`**.
2. Execute **`instalarAplicacaoCPT`**. Deve mostrar `versao: 2.12.0`.
3. Publique uma **Nova versão**.

**O que muda:**
- Para Gestão e Administrativo, a **Visão do mês** ganha abas: **Resumo do mês · Contrato · Frentes de serviço · Relatos em resumo**. O "Painel da gestão" saiu do menu e virou essas abas.
- A busca (Ctrl+K) leva direto a cada aba: digite "contrato", "frentes" ou "relatos".
- As outras frentes continuam vendo a Visão do mês como antes, sem abas.

---

## Atualização 2.11 — achar tudo mais fácil: menu em grupos e busca (≈ 5 min)

1. Rode **`atualizarTudoCPT`**.
2. Execute **`instalarAplicacaoCPT`**. Deve mostrar `versao: 2.11.0`.
3. Publique uma **Nova versão**.

**O que muda:**
- **Menu em grupos:**
  - *Dia a dia* fica sempre aberto;
  - *Fechamento do mês* e *Consultas e cadastros* abrem e fecham com um clique;
  - para quem vê muitas páginas (Gestão, Administrativo), esses dois grupos começam fechados;
  - cada pessoa decide, e a aplicação lembra a escolha;
  - ao entrar numa página de um grupo fechado, ele se abre sozinho.
- **Busca geral:** campo **Buscar** no topo, ou **Ctrl+K**. Ela acha:
  - páginas;
  - atendimentos, pelo protocolo, nome ou assunto;
  - obras;
  - contatos;
  - ações: *Novo recado*, *Nova atividade*, *Novo contato*.
  Use ↑ ↓ para escolher, Enter para abrir e Esc para fechar.
- **Cabeçalho compacto:** o título fica numa linha e a explicação da página aparece no **ⓘ**.
- **"Ver como":** agora é uma barra fina, sem o texto longo.

---

## Atualização 2.10 — visual novo, página inicial com mascote e menu ☰ (≈ 5 min)

1. Rode **`atualizarTudoCPT`**. Ele troca todos os arquivos juntos, inclusive o `PessoalCPT.gs`, que passa a aceitar a capivara e a cor do mascote.
2. Execute **`instalarAplicacaoCPT`**. Deve mostrar `versao: 2.10.0`.
3. Publique uma **Nova versão**.

**O que muda:**
- **Cores:** paleta calma, verde-água e areia, no lugar do ameixa e rosa. O modo escuro acompanha.
- **Página inicial (Meu espaço):**
  - cenário com o mascote, saudação e avisos;
  - **Hoje na agenda**, com as atividades de hoje e dos próximos dias;
  - checklist e caderno logo abaixo.
- **Mascotes:**
  - desenho novo, com volume, olhos com brilho e bochechas, que respiram e piscam;
  - a **capivara** chega como mascote novo;
  - **cor** à escolha, livre.
- **Menu ☰:**
  - no computador, recolhe a lateral;
  - no celular, há uma barra com 4 atalhos e um Menu, que abre a gaveta com todas as páginas.
- **Páginas:** cabeçalho com ilustração própria e mais espaço entre os blocos.

Nada muda nos dados nem nas permissões.

---

## Atualização 2.9.1 — aplicação mais rápida e sem "pulos" na tela (≈ 5 min)

Nada muda no jeito de usar. A tela abre sem saltar, as buscas não travam enquanto se digita e o servidor responde mais rápido.

1. Rode **`atualizarTudoCPT`**. Ele troca todos os arquivos de uma vez. Isso importa: vários `.gs` agora usam uma função nova do `AplicacaoCPT.gs`, e trocar só parte deles quebra a aplicação.
   - Se for copiar à mão: substitua **todos** os `.gs` e `.html` da pasta `app/src/`.
2. Execute **`instalarAplicacaoCPT`**. Deve mostrar `versao: 2.9.1`.
3. Publique uma **Nova versão** (Implantar → Gerenciar implantações → editar → Nova versão).

**O que muda:**
- **Tela sem pulos:** o aviso e a faixa de visão aparecem antes dos dados, não depois.
- **Esqueletos** (blocos cinza animados) enquanto cada página carrega.
- **Buscas** de contatos, materiais, galeria e painel da gestão esperam a pessoa parar de digitar.
- **Contatos** aparecem de 60 em 60, com "Mostrar mais".
- **Miniaturas** da galeria só baixam quando aparecem na tela.
- **Servidor:** cada planilha é aberta uma vez por consulta, e os resultados grandes vão comprimidos para o cache. Antes, o que passava de 95 KB não era guardado.
- **Avisos de recados** são pedidos logo depois da primeira tela, e não de novo a cada troca de aba do navegador.

---

## Gatilhos: limpar os antigos e deixar só os que importam (≈ 20 min)

O atualizador (`atualizarTudoCPT`) troca o código, mas **não cria nem apaga gatilhos**. Os gatilhos são de cada projeto: apagar num projeto não afeta os outros.

**Antes de apagar qualquer coisa:** abra ⏰ **Acionadores** em cada projeto abaixo e tire um print.

| Projeto | O que fazer |
|---|---|
| **Campo 4.0** | Pode apagar tudo. Depois execute **`reinstalarGatilhosCampo40`**: ele recria só os 4 necessários (formulário Campo 4.0, formulário de Execução, retomada de hora em hora e caixa de salvar Obras/Bairros). `conferirGatilhosCampo40` mostra a situação sem mudar nada. |
| **Aplicação CPT** | Não usa gatilho. Se houver algum, mande o print. |
| **Controle de Atendimentos antigo, Fichas Oficiais 3.2.1, Painel de Atendimento, Painel Executivo, Comunicação do Atendimento** | Pode apagar tudo. Já foram substituídos pela Base 4.0 e pela aplicação. |
| **Sincronização dos Relatos (RDAS 3.0)** | **Só depois de 05/10**, quando o formulário 3.0 parar de receber relatos. Até lá, ele ainda alimenta os dias antigos. |
| **Relato de Atividade / Relatos sociais ilustrados / Painel RDAS** | Não apague ainda: mande o print. Menus de "ao abrir" são inofensivos. |
| **Painel de Gestão 3.2** | Tem um gatilho de **1 em 1 minuto** que, além de atualizar o painel a cada 15 min, **libera o acesso às fotos** para a equipe. Se ninguém mais usa essa planilha, pode apagar. Se usa, deixe por enquanto e me avise. |
| **Indicadores 2026 (motor arquivado)** | Só olhe e mande o print. Se o motor ainda escreve na planilha, alguém pode depender disso; decidimos juntos. |

---

## Campo 4.0 — 4.5: fichas oficiais em PDF na planilha da Execução (≈ 10 min)

A Concrejato passa a ver e baixar o PDF de cada ficha oficial na própria planilha da Execução.

**O que muda na planilha da engenharia:**
- **CPT • Painel da Execução** ganha a última coluna, **Ficha oficial**, com dois links: **Ver** abre o PDF e **Baixar** salva o arquivo.
- Nova aba **CPT • Fichas oficiais**, a segunda, com **todos** os casos (abertos e concluídos, os mais novos primeiro) e o mesmo Ver · Baixar. Ela substitui a aba antiga "Fichas Oficiais", que está oculta e não atualiza mais.
- Entram as fichas geradas pela aplicação e as das fichas antigas migradas. Caso sem PDF aparece como "não gerada": o Atendimento gera pela aplicação (**Gerar ficha oficial**) e o link aparece na próxima sincronização (até 1 hora, ou na hora pelo passo 2).

**Passos:**
1. Projeto Campo 4.0: substitua `PainelDaExecucao.gs`, `ExecucaoDaEngenharia.gs` e `ConfiguracaoDaBase.gs` (ou rode `atualizarTudoCPT`).
2. Execute **`sincronizarExecucaoDaEngenhariaCampo40`**. Em `ordens` deve aparecer **"fichas oficiais: X de Y com PDF"**.
3. **Compartilhe as pastas de PDF com a engenharia, como Leitor** (sem isso, o link abre "Você precisa de acesso"):
   - **CPT • Fichas oficiais → PDFs** (fichas geradas pela aplicação);
   - **PDFs Atuais** (fichas antigas, da pasta das Fichas Oficiais 3.2.1).
   Compartilhe **só as pastas de PDF**, não a pasta-mãe: "Documentos" e "Versões anteriores" ficam só com o CPT. Use os e-mails da Concrejato que já recebem a planilha (André, Gustavo e Erinaldo).
4. Abra a planilha da engenharia com uma conta que não seja a sua (ou peça a um deles) e clique em **Ver** de uma ficha.

---

## Campo 4.0 — 4.4: o RDAS passa a ser alimentado pelo Campo 4.0 (≈ 10 min, antes de ligar o formulário novo)

**Por que:** a planilha **RDAS** (a que a cliente acessa) era montada só a partir do **Procedimentos 3.0**. Quando a equipe passar a usar o formulário do Campo 4.0, os relatos novos não chegariam ao RDAS. Agora o próprio Campo 4.0 monta as fichas, na **mesma planilha, com as mesmas abas e o mesmo layout**. A cliente não percebe a troca.

**O que melhora no visual**, sem mudar a estrutura que o Painel do RDAS e o painel da gestão leem:

- fotos maiores, numa moldura mais alta e com menos margem;
- legenda curta: "Foto 1 de 5 | data | ID · abrir original ↗", com o link para o original;
- uma linha acima das fotos dizendo quantas são e que a legenda abre o original;
- na tabela "Execuções registradas no dia", o **ID leva direto à ficha** do relato.

**Passos (no projeto do Campo 4.0):**

1. Atualize pelo Cloud Shell (`atualizar.sh conferir` e `aplicar`). Entra o arquivo novo `SincronizacaoDoRDAS.gs`.
2. No editor do Campo 4.0, execute **`conferirRDASCampo40`** e autorize. A autorização nova é para ler as fotos do Drive e buscar a miniatura. O resultado mostra quantos relatos do Campo 4.0 existem por dia e não altera nada.
3. Depois do primeiro relato real enviado pelo formulário novo, a aba do dia aparece sozinha no RDAS. Para refazer na mão os dias mais recentes, execute **`atualizarRDASRecentesCampo40`**.
4. **No dia em que o formulário 3.0 for desligado** (previsto para segunda, 05/10), abra a planilha do **Procedimentos 3.0** e use o menu **RDAS • Sincronização → Remover atualização automática**. Assim só o Campo 4.0 escreve no RDAS.
   - Se a troca acontecer em outra data, informe a data na propriedade do script `RDAS_SO_CAMPO40` (formato `2026-10-05`).

**Regras:**

- Relato enviado depois com data antiga (por exemplo, um relato de 03/10 enviado em 06/10): o dia é refeito juntando o que veio do 3.0 com o do 4.0. Os IDs antigos (REL-…) continuam iguais.
- Dia sem nenhum relato: a aba existente nunca é apagada.
- As abas antigas (até setembro) **não são tocadas**.
- Se as fotos demorarem ou a planilha estiver ocupada, o dia fica marcado e é refeito na retomada automática de hora em hora. O envio do formulário nunca é prejudicado.
- Os relatos do Campo 4.0 aparecem com ID curto (`R4-ABC123`).

---

## Atualização 2.9 — Meu espaço: mascote, checklist e caderno (≈ 5 min)

**Como atualizar:** no Cloud Shell, `bash ~/atualizar.sh conferir` e depois `bash ~/atualizar.sh aplicar`. Só a Aplicação muda.

**Arquivos novos:**

- `PessoalCPT.gs`
- `MeuEspaco.html`

**Passos:**

1. No editor, execute **`instalarAplicacaoCPT`** uma vez. Deve mostrar `versao: 2.9.0`.
2. Abra a aplicação com **Ver como → Atendimento** (ou outra frente): ela abre no **Meu espaço**.

As abas "Meu espaço", "Caderno" e "Checklist" são criadas sozinhas no primeiro uso.

**O que muda para a equipe:**

- Quem não é da Gestão ou do Administrativo entra pelo **Meu espaço**, e não mais pela Visão do mês (que continua na lateral).
- No Meu espaço:
  - mascote com nome e guarda-roupa;
  - presente semanal;
  - checklist com pontos;
  - caderno pessoal com salvamento automático;
  - atalho para o trabalho do dia.
- Regras completas em [VISOES_POR_CARGO.md](VISOES_POR_CARGO.md).

---

## Atualização 2.8 — Comunicação, Recados, Contatos e Lembretes (≈ 10 min)

**Como atualizar:** no Cloud Shell, `bash ~/atualizar.sh conferir` e depois `bash ~/atualizar.sh aplicar`. Só a Aplicação muda.

**Arquivos novos:**

- `ColecaoCPT.gs`
- `RecadosCPT.gs`
- `ContatosCPT.gs`
- `ComunicacaoCPT.gs`
- `GaleriaCPT.gs`
- `Comunicacao.html`
- `Recados.html`

**Passos:**

1. No editor, execute **`instalarAplicacaoCPT`** uma vez. Deve mostrar `versao: 2.8.0`.
2. Abra a aplicação com **Ver como → Comunicação** e confira a página **Hoje**.
3. Depois do primeiro envio de foto pela galeria, compartilhe a pasta **CPT • Comunicação – Fotos extras** como Leitor com a equipe (ela aparece em Conectores e pastas).

As abas novas (Recados, Contatos, Lembretes, Materiais, Mídias extras) são criadas sozinhas na planilha **CPT • Dados da aplicação** no primeiro uso. Não é preciso criar nada nem rodar outra função.

**O que muda para a equipe:**

- **Recados** (todos):
  - para uma frente ou para pessoas;
  - aviso com número na lateral e ao abrir a aplicação;
  - leitura registrada por pessoa, resposta e "resolvido";
  - pode levar um link, protocolo, registro ou lembrete;
  - não envia e-mail nem WhatsApp.
- **Contatos** (todos):
  - matriz comum com tipo, telefone (botões Ligar e WhatsApp), e-mail, bairro, frente, etiquetas, sinalizador por cor e observação interna;
  - cada conversa fica registrada no contato;
  - edita o cadastro quem criou, a Comunicação e a Gestão.
- **Comunicação** (Comunicação, Gestão e Administrativo). A Comunicação **abre direto nela**, na aba **Hoje**: cinco blocos numerados com só o que pede ação.
  - **Lembretes:** compartilhados com o Social. O Social os vê na página **Lembretes**.
  - **Materiais e links:** com prazo e situação. O que é concluído entra no mês e vira sugestão no Programa Parceiros (linhas 32 a 34).
  - **Galeria:** fotos do mês, envio, pacote .zip e legendas no padrão do relatório.

---

## Atualização 2.7 — Visões por cargo, Painel da gestão, Programa Parceiros e auditoria (≈ 15 min)

**Como atualizar:** no Cloud Shell, `bash ~/atualizar.sh conferir` e depois `bash ~/atualizar.sh aplicar`. Só a Aplicação muda.

**Arquivos novos:**

- `ConectoresCPT.gs`
- `ProgramaParceirosCPT.gs`
- `PaineisGestaoCPT.gs`
- `AuditoriaAtendimentosCPT.gs`
- `Gestao.html`

**Passos:**

1. No editor, execute **`instalarAplicacaoCPT`** uma vez. Deve mostrar `versao: 2.7.0`.
2. Abra a aplicação e vá em **Como usar → Conectores e pastas**.
3. Confira se cada conector está verde.
   - Se a **Máscara do Programa Parceiros** estiver amarela por ser .xlsx, salve-a como Planilha Google e cole o novo link ali.
4. Na mesma página, compartilhe como **Leitor**, com a equipe, as pastas marcadas em amarelo (fotos do formulário e Entregas mensais).
   - Detalhes em [VISOES_POR_CARGO.md](VISOES_POR_CARGO.md).
5. Use **Ver como** (faixa no topo) para conferir a tela de cada cargo antes de liberar a equipe.

**Correção que vem junto:** na 2.6, a página não carregava o componente Socioambiental no Google (`incluirCPT_` não o aceitava e a abertura parava com "Componente desconhecido"). Na 2.7 ele está liberado.

**O que muda para a equipe:**

- **Visão por cargo.** Cada pessoa vê só as páginas do seu trabalho, com atalhos próprios na Visão do mês. Quem tem vários cargos troca em **Ver como**: a faixa, a cor e a lateral mudam na hora. A troca é só de tela: a conta e as permissões não mudam.
- **Trava de testes (ligada).** Só você muda cargos, obras e conectores e publica na máscara oficial. Para liberar obras e publicações, execute `liberarConfiguracaoCPT`; para travar de novo, `travarConfiguracaoCPT`.
- **Painel da gestão** (Gestão e Administrativo), em três abas:
  - **Contrato:**
    - o que pede atenção: casos com mais de 30 dias, meta semanal de pesquisas, frentes paradas há mais de 14 dias, relatos sem público, Programa Parceiros pendente;
    - os números do mês;
    - seis meses em gráfico;
    - itens do relatório, tipos de atividade e quem registrou.
  - **Frentes de serviço:**
    - cada obra com ações, pessoas, diagnósticos, casos abertos e o último registro;
    - em vermelho, as frentes em andamento sem registro há mais de 14 dias;
    - "Ver a frente" abre as atividades e os casos.
  - **Relatos em resumo:** os relatos do mês por dia, com trecho do texto, público, fotos e situação.
- **Programa Parceiros** (Gestão e Administrativo):
  - as 90 perguntas da máscara de lançamento, na ordem e com a linha (L3 a L92);
  - os dados da engenharia ficam recolhidos;
  - cada pergunta mostra o mês anterior e uma **sugestão** com a regra de cálculo, que só entra com "Usar":
    - reuniões abertas à comunidade e público;
    - temas;
    - satisfação e depoimentos;
    - manifestações por tipo;
    - não procedentes;
    - prazo médio;
    - cartas de vistoria cautelar.
  - **Salvar** cria versão.
  - **Publicar** grava **só os campos conferidos** na coluna do mês da máscara (cria a coluna se faltar), preserva fórmulas e desfaz tudo se algo falhar.
  - **Planilha para conferência** gera um Excel/PDF novo, sem tocar na máscara.
  - O texto digitado fica salvo no navegador se a conexão cair.
- **Atendimentos → Auditoria e números** (Atendimento, Gestão e Administrativo):
  - o que conferir: recebidos parados há mais de 3 dias, abertos há mais de 30, sem próxima ação ou área, dados faltando, datas inconsistentes, possíveis duplicados pelo endereço e casos sem PDF;
  - cada caso abre a ficha com um clique;
  - gráficos: recebidos × concluídos, idade dos casos, áreas, tipos e canais.

---

## Atualização 2.6 — Socioambiental: mesa do relatório, relatos, diagnósticos e anexos (≈ 10 min)

**Como atualizar:** no Cloud Shell, `bash ~/atualizar.sh conferir` e depois `bash ~/atualizar.sh aplicar`. Só a Aplicação muda (o Campo 4.0 fica igual). Arquivos novos: `SocioambientalCPT.gs` e `Socioambiental.html`.
1. Depois de aplicar, abra a aplicação: no menu aparece **Socioambiental**.
2. No editor da Aplicação, execute **`instalarAplicacaoCPT`** uma vez e aceite a nova permissão de **Apresentações (Slides)**, usada na apresentação do diagnóstico. Deve mostrar `versao: 2.6.0`. Sem isso, a geração de documentos dá erro de autorização, porque a aplicação roda com a sua conta.
3. (Opcional) **Cabeçalho e rodapé dos Anexos.** Converta o seu arquivo de Anexos para Google Docs e deixe só o cabeçalho e o rodapé (logos, endereço). Guarde o ID em `modeloAnexosId` na configuração da aplicação (eu faço isso por você se me mandar o link). Sem o modelo, os anexos saem sem cabeçalho.

**O que muda para a equipe:**
- **Visão do mês** mostra o que o relatório usa:
  - a frase do item 3 ("Foram contabilizadas N ações socioambientais, totalizando N pessoas alcançadas");
  - ações, pessoas alcançadas, frentes e diagnósticos;
  - manifestações em tratativa, recebidas e concluídas no mês;
  - **Para o relatório:** cada item (2, 4.1 a 4.5, 7, 9) com quantas ações tem e quantas estão prontas.
  - A contagem bruta de "registros" e o gráfico por tipo de procedimento saíram: misturavam pesquisa, abertura de atendimento e ações.
- **Socioambiental → Mesa do relatório:** cada atividade do mês já aparece no item em que entra, com a situação (A preparar, Rascunho, Pronto).
  - Ação Social Externa vai para o eixo pelo tema (óleo e pilhas → 4.2; saúde e dengue → 4.3; demais → 4.4). CAO → 4.1 (com lideranças ou comerciantes → 4.5). Articulação → 4.5. DDS, treinamentos e campanhas internas → 9. Tenda → 7. Diagnóstico → 2.
  - É uma **sugestão**: no preparo, a equipe muda o item se precisar.
  - Eixo sem ação mostra o parágrafo padrão, pronto para copiar.
  - Tabela de frentes do mês (item 3 e 3.1).
- **Preparar relato:** quadro do anexo (atividade, local, endereço, data e horário, mediação, público, objetivo) já preenchido pelo formulário; texto-base; até 8 imagens com legenda no padrão do relatório; marcar o que é **lista de presença**. **Gerar relato** cria Docs + PDF na pasta do mês (Entregas mensais/AAAA-MM/Relatos).
- **Preparar diagnóstico** (Gestão e equipe):
  - síntese com as próprias palavras (botão **Montar texto-base** organiza as respostas por tema);
  - próximos passos;
  - os 24 campos da ficha **DIAGNÓSTICO LOCAL** já preenchidos;
  - até 12 fotos.
  - **Gerar ficha Sabesp** preenche uma cópia do modelo oficial (o modelo é conferido antes e nunca é redesenhado).
  - **Gerar apresentação** cria um Slides em madeira, verde e vermelho.
- **Gerar anexos do mês** (na mesa):
  - ANEXO 1 (item 4), ANEXO 2 (DDS e complementares) e ANEXO 3 (audiovisual, para a Comunicação completar);
  - **cada relato começa em página própria, com a faixa de título contornada**: era a separação que faltou em setembro.
  - Só entram relatos marcados como **Pronto**.
- Documentos antigos nunca são apagados: uma nova geração leva os anteriores para "Versões anteriores".

## Atualização 2.5 — casos encerrados, painel da Concrejato e perfis (≈ 15 min)

> **Gestão (revisado em 02/10):** a Gestão tem os mesmos poderes do Administrativo. Ela vê e faz tudo, para acompanhar, cobrar e ensinar a equipe. A administração técnica (cadastro de acessos) continua só sua.

**1. Campo 4.0** (pasta `campo40/src/`)

| Arquivo | Ação |
|---|---|
| `CorteDoControleAntigo.gs`, `ExecucaoDaEngenharia.gs`, `ConfiguracaoDaBase.gs` | substituir |
| `PainelDaExecucao` | **criar** (＋ → Script) |

Depois, nesta ordem:
1. Execute **`compararComControleAntigoCampo40`**. Em `aAjustar` devem aparecer **ATD20260003** e **ATD20260007** indo para **Concluída**, com a data de conclusão de setembro.
   - Motivo: no Controle antigo, a aba de fichas ficou "Recebida", mas o Histórico registra a finalização em 18/09.
   - Se aparecerem em `conferirNaAplicacao`, finalize os dois pela aplicação (**Finalizar ficha**, com a data de setembro).
2. Execute **`trazerEstadoDoControleAntigoCampo40`**.
3. Execute **`sincronizarExecucaoDaEngenhariaCampo40`**. Na planilha da engenharia:
   - a aba **CPT • Ordens em aberto** vira **CPT • Painel da Execução**, a primeira aba, com indicadores, cores e três quadros;
   - as abas antigas que pararam de atualizar (Dashboard, Fichas Oficiais, Acompanhamento diário, Base Executiva…) ficam **ocultas**. Nada é apagado.

**2. Aplicação** (pasta `app/src/`): substitua `AplicacaoCPT.gs`, `PerfisCPT.gs`, `CicloAtendimentoCPT.gs`, `ObrasCPT.gs`, `RelatorioMensalCPT.gs`, `EntregasCPT.gs`, `Estilos.html`, `Agenda.html` e `Atendimentos.html`. Depois:
1. Execute `instalarAplicacaoCPT`. Deve mostrar `versao: 2.5.0`.
2. Publique uma **Nova versão**.

**O que muda para a equipe:**
- **Situação com cor:** Recebida em vermelho, Em andamento em amarelo, Concluída em verde.
- **Equipe e acessos** oferece só: Administrativo, Gestão, Atendimento, Socioambiental, Comunicação e Comercialização.
  - **Administração técnica** é só sua.
  - **Execução** saiu: a Concrejato usa o formulário e a planilha compartilhada.
  - Quem estava cadastrado com Execução perde esse papel sozinho, sem recadastro.

---

## Atualização 2.4 — para quem já instalou a 2.3 (≈ 20 min)

Os Blocos 1 a 4 abaixo já foram feitos. Faça só isto:

**1. Aplicação** (projeto da Aplicação CPT, pasta `app/src/`)

| Arquivo | Ação |
|---|---|
| `AplicacaoCPT.gs`, `CicloAtendimentoCPT.gs`, `DadosDaAplicacao.gs` | substituir |
| `Atendimentos.html`, `Fechamento.html`, `Interacoes.html` | substituir |
| `FichaOficialCPT`, `InventarioDriveCPT` | **criar** (＋ → Script) |

Depois:
1. Salve e execute **`instalarAplicacaoCPT`**. Deve mostrar `versao: 2.4.0`.
2. Vá em **Implantar → Gerenciar implantações → ✏️ → Nova versão → Implantar**.

**2. Campo 4.0** (projeto do Campo 4.0, pasta `campo40/src/`)
1. Substitua `ExecucaoDaEngenharia.gs`. Agora o retorno da engenharia guarda o relato completo e as fotos, para a ficha oficial usar.
2. Salve. Não precisa executar nada.

**3. Testar na aplicação**
1. Abra um caso **antigo**, por exemplo um de março. Telefone, solicitação, tipo e as providências do Controle antigo devem aparecer. Antes da 2.4, esses campos apareciam como "Não informado".
2. No mesmo caso, clique em **Gerar ficha oficial (PDF)** e abra o PDF.
   - Compare com o PDF antigo: o modelo e a diagramação são os mesmos.
   - O PDF antigo vai para **CPT • Fichas oficiais / Versões anteriores**. Nada é apagado.
3. Em Atendimentos, use o filtro **Com quem está → Execução**. Aparece a fila da engenharia, dos casos mais antigos para os mais novos, com os dias em aberto.

**O que entrou na 2.4:**

| Onde | O quê |
|---|---|
| Ficha do caso | **Corrigir dados da ficha** (nome, telefone, endereço, assunto, solicitação…). A correção fica com motivo no histórico. Telefone, e-mail e solicitação aparecem lá só como "alterado". |
| Ficha do caso | **Incorporar protocolo duplicado**. O outro protocolo aponta para este caso e sai da lista da engenharia. |
| Ficha do caso | **Gerar ficha oficial (PDF)** no modelo Sabesp. Só é refeita quando algo muda. |
| Fechamento do mês | **Fichas oficiais do mês (ANEXO 4)**: gera e junta na pasta do mês os PDFs dos casos em aberto no fim do mês e dos concluídos no mês. Se demorar, aparece **Continuar**. |
| Atendimentos | Filtro **Com quem está** e dias em aberto em cada cartão |
| Editor | **`inventariarDriveCPT`**: lista seus arquivos do Drive e sugere o que arquivar. Veja [LIMPEZA_E_BACKUP.md](LIMPEZA_E_BACKUP.md). |

**Acionadores do Controle antigo** (nos seus prints):

| Projeto | Acionador | O que fazer |
|---|---|---|
| CAC Controle de Atendimentos | `painelProcessarFila` (horário) | **Excluir.** Ele processa pedidos do painel antigo no Controle. |
| CAC Controle de Atendimentos | `atualizarAnexosAtendimentosAgendado` (horário) | **Excluir.** Ele reescreveria o Controle de manifestações dos Anexos com dados parados. Desde a 2.26, a aplicação atualiza essa aba em Entregas do mês (acumulativo, sem apagar). |
| CAC Controle de Atendimentos | `aoEditarAvisosProtocolo` (ao editar) | **Excluir.** Só serve às abas antigas de avisos. |
| CAC Controle de Atendimentos | `aoAbrirFichasOficiaisSabesp` (ao abrir) | **Pode manter.** Só cria o menu para consultar e baixar os PDFs antigos. |
| Painel de atendimento | `atualizarPainelExecutivoExecucaoAgendado` (horário) | **Excluir.** O painel antigo deixa de ter dados novos. A fila da engenharia agora está na aplicação (filtro Com quem está) e na aba CPT • Ordens em aberto. |

---

## Como fica depois da instalação

| Peça | Quem usa | Papel |
|---|---|---|
| **Aplicação CPT** (link `/exec`) | Equipe Veolia | Tudo do dia: visão do mês, agenda, registros, atendimentos (atualizar, finalizar, reabrir), obras, fechamento do mês |
| **Formulário Campo 4.0** | Equipe em campo | Captação. Uma *Ficha de Atendimento* enviada vira um caso com protocolo sozinha. **O formulário não muda.** |
| **Formulário de Execução + planilha da engenharia** | Concrejato | **Continua separado e compartilhado com eles.** A lista de protocolos passa a vir da Base. As respostas entram no caso como "Execução". |
| **Base Campo 4.0** (planilha) | Ninguém abre no dia a dia | Fonte única dos casos (abas Atendimentos e Movimentações) |
| **Controle de Atendimentos antigo** | Consulta | Para de ser atualizado no corte (Bloco 3). Fica como histórico e para os PDFs das fichas antigas. |
| **Anexos do relatório** | Administrativo | "Indicadores 2026" e a Matriz de Contatos não são tocados. O "Controle de manifestações" é atualizado em Entregas do mês (2.26: acumulativo, sem apagar). |

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
| `PerfisCPT`, `ObservacoesCPT`, `ObrasCPT`, `RelatorioMensalCPT`, `CacheCPT`, `CicloAtendimentoCPT`, `FichaOficialCPT`, `InventarioDriveCPT` | **criar** (＋ → Script) |
| `Obras`, `Fechamento`, `Inicio`, `Atendimentos` | **criar** (＋ → HTML) |

No fim, o projeto tem **22 arquivos** além do `appsscript.json`. Salve.

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
| `AberturaDeAtendimentos`, `ExecucaoDaEngenharia`, `PainelDaExecucao`, `CorteDoControleAntigo` | **criar** (＋ → Script) |

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
| Painel de Atendimento / Demandas do Atendimento / Painel Executivo | Aplicação → Atendimentos (filtro Com quem está, dias em aberto, próxima ação) |
| Correções da Ficha Final | **Corrigir dados da ficha**, com motivo e histórico (2.4) |
| Fichas Oficiais 3.2.1 (PDF Sabesp) | Botão **Gerar ficha oficial** na ficha do caso, e o pacote do mês no Fechamento (2.4). Mesmo modelo. |
| Controle de manifestações nos Anexos | Entregas do mês atualiza a aba oficial com a regra acumulativa da 3.2.1 (2.26) |
| Vínculos de protocolos (mesclagem) | Os antigos foram migrados. Os novos: **Incorporar protocolo duplicado** na ficha (2.4) |
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
