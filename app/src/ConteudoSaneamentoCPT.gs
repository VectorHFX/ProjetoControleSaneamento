/**
 * ConteudoSaneamentoCPT 2.19.0. Curiosidades, perguntas do quiz e campanhas do mês, todas com fonte.
 * Só conteúdo (nada é lido nem gravado na base). O quiz e as pontuações ficam em QuizCPT.
 *
 * Revisão do Victor: o texto para revisar fica em docs/CONTEUDO_SANEAMENTO.md (gerado deste arquivo por
 * node app/testes/conteudo.cjs --atualizar). O proprietário vê tudo, com a marca "a revisar"; as demais
 * pessoas só veem o que estiver em ConteudoSaneamentoCPT.aprovadas (lista vazia = nada até a revisão).
 */
class ConteudoSaneamentoCPT {
  /** IDs aprovados na revisão (curiosidades C.. e perguntas Q..). '*' aprova tudo. */
  static get aprovadas() { return []; }
  static aprovada(id) { const a = ConteudoSaneamentoCPT.aprovadas; return a.includes('*') || a.includes(id); }
  static proprietario(perfil) { return !!perfil && perfil.papeis.includes('administrador'); }
  static get temas() { return {aguas: 'Águas', esgoto: 'Esgoto', tratamento: 'Tratamento', residuos: 'Resíduos sólidos', descarte: 'Descarte correto', saude: 'Saúde', leis: 'Leis e metas', territorio: 'Nosso território', seguranca: 'Segurança no trabalho'}; }

  static get fontes() {
    return {
      marco: ['Câmara dos Deputados — Marco legal do saneamento entra em vigor (Lei 14.026/2020)', 'https://www.camara.leg.br/noticias/676791-marco-legal-do-saneamento-entra-em-vigor-hoje-lei-teve-18-vetos-presidenciais/'],
      usp2033: ['Jornal da USP — Brasil estabelece meta para universalizar o saneamento até 2033', 'https://jornal.usp.br/campus-ribeirao-preto/brasil-estabelece-meta-ambiciosa-para-universalizar-saneamento-basico-ate-2033/'],
      ods6: ['ONU Brasil — Objetivo de Desenvolvimento Sustentável 6', 'https://brasil.un.org/pt-br/sdgs/6'],
      ipea6: ['Ipea — ODS 6: Água potável e saneamento', 'https://www.ipea.gov.br/ods/ods6.html'],
      tamanduatei: ['Wikipédia — Rio Tamanduateí', 'https://pt.wikipedia.org/wiki/Rio_Tamanduate%C3%AD'],
      sabespsa: ['Diário do Grande ABC — Sabesp chega a Santo André', 'https://www.dgabc.com.br/Noticia/3102857/sabesp-chega-a-sto-andre-com-desafio-de-findar-falta-d-agua-e-universalizar-esgoto'],
      abcreporter: ['ABC Repórter — Sabesp assume serviços do Semasa', 'https://abcreporter.com.br/2019/08/01/sabesp-assume-servicos-do-semasa-e-renova-contrato-com-sao-bernardo/'],
      billings: ['Wikipédia — Represa Billings', 'https://pt.wikipedia.org/wiki/Represa_Billings'],
      oleo: ['SAMAE Timbó — Óleo de cozinha (dado da Sabesp)', 'https://samaetimbo.com.br/detalhe/mostra/400'],
      esgoto: ['BRK Ambiental — Etapas do tratamento de esgoto', 'https://blog.brkambiental.com.br/etapas-tratamento-de-esgoto/'],
      ete: ['IFSP Caraguatatuba — Visita técnica à ETE da Sabesp', 'https://www.ifspcaraguatatuba.edu.br/noticias/estudantes-de-engenharia-civil-realizam-visita-tecnica-a-estacao-de-tratamento-de-esgoto-da-sabesp'],
      tratagua: ['Sabesp — Tratamento de água (folheto)', 'https://www.sabesp.com.br/assets/pdf/sabesp-tratamento-agua-1.pdf'],
      etapasagua: ['Tratamento de Água — Etapas do tratamento da água', 'https://tratamentodeagua.com.br/artigo/etapas-tratamento-agua/'],
      doencas: ['Revista Caminhos de Geografia (UFU) — Doenças de veiculação hídrica', 'https://seer.ufu.br/index.php/caminhosdegeografia/article/download/45545/26775/208144'],
      hepatite: ['Ministério da Saúde — Julho Amarelo e as hepatites virais', 'https://www.gov.br/saude/pt-br/assuntos/saude-com-ciencia/noticias/2024/julho/julho-amarelo-entenda-a-importancia-da-prevencao-e-controle-das-hepatites-virais'],
      dengue: ['Ministério da Saúde — Aedes aegypti: um perigo mesmo na seca', 'https://www.gov.br/saude/pt-br/assuntos/noticias/2024/outubro/mosquito-aedes-aegypti-um-perigo-mesmo-em-periodos-de-seca'],
      dengueovo: ['Estado de Minas — Ovo do Aedes sobrevive sem água (pesquisa do IOC/Fiocruz)', 'https://www.em.com.br/app/noticia/saude-e-bem-viver/2023/10/28/interna_bem_viver,1583493/aedes-aegypti-ovo-do-mosquito-sobrevive-sem-agua-comprova-pesquisa.shtml'],
      conama275: ['Resolução Conama 275/2001 (cópia da UFF)', 'https://www.uff.br/wp-content/uploads/2024/05/conama_275_2001_0.pdf'],
      pnrs: ['Câmara dos Deputados — Lei 12.305/2010 (Política Nacional de Resíduos Sólidos)', 'https://www2.camara.leg.br/legin/fed/lei/2010/lei-12305-2-agosto-2010-607598-publicacaooriginal-128609-pl.html'],
      latas: ['CicloVivo — Em 2024, Brasil reciclou 97,3% das latas de alumínio', 'https://ciclovivo.com.br/planeta/desenvolvimento/em-2024-brasil-reciclou-973-das-latas-de-aluminio/'],
      remedios: ['Gov.br — Descarte adequado de medicamentos em desuso', 'https://www.gov.br/pt-br/noticias/meio-ambiente-e-clima/2022/12/o-descarte-adequado-de-medicamentos-em-desuso-contribui-para-a-qualidade-do-meio-ambiente'],
      consumo: ['AMA — Brasileiros usam 51% a mais de água do que o recomendado', 'https://news.ama.eco/brasileiros-usam-51-a-mais-de-agua-do-que-a-quantidade-diaria-recomendada/'],
      economia: ['Boqnews — Dicas da Sabesp para economizar água', 'https://www.boqnews.com/cidades/dicas-da-sabesp-ensinam-como-economizar-agua/'],
      tratabrasil: ['Instituto Trata Brasil — Ranking do Saneamento 2026', 'https://tratabrasil.org.br/wp-content/uploads/2026/03/Release-Ranking-2026_vf.pdf'],
      diaagua: ['WWF-Brasil — 22 de março, Dia Mundial da Água', 'https://www.wwf.org.br/?51682%2F22-de-maro-Dia-Mundial-da-gua='],
      banheiro: ['Aesbe — 19 de novembro, Dia Mundial do Saneamento (do Banheiro)', 'https://aesbe.org.br/19-de-novembro-dia-mundial-do-saneamento-reforca-a-importancia-do-acesso-universal-ao-saneamento-basico/'],
      abrilverde: ['Câmara Municipal de São Paulo — Abril Verde', 'https://www.saopaulo.sp.leg.br/blog/abril-verde-mes-de-conscientizacao-sobre-seguranca-e-saude-no-trabalho/']
    };
  }

  /** [id, tema, texto, fonte] */
  static get curiosidades() {
    return [
      ['C01', 'leis', 'O ODS 6 da ONU é "assegurar a disponibilidade e a gestão sustentável da água e saneamento para todas e todos".', 'ods6'],
      ['C02', 'leis', 'O novo marco legal do saneamento (Lei 14.026/2020) fixou a meta: até 31/12/2033, 99% da população com água potável e 90% com coleta e tratamento de esgoto.', 'marco'],
      ['C03', 'leis', 'A Lei 14.026/2020 atualizou a Lei 11.445/2007, que traz as diretrizes nacionais do saneamento básico.', 'usp2033'],
      ['C04', 'territorio', 'O Rio Tamanduateí tem cerca de 35 km e nasce no Parque Municipal da Gruta de Santa Luzia, em Mauá.', 'tamanduatei'],
      ['C05', 'territorio', 'O Tamanduateí passa por Mauá, Santo André e São Caetano do Sul e deságua no Rio Tietê, no bairro do Bom Retiro, em São Paulo.', 'tamanduatei'],
      ['C06', 'territorio', 'A bacia do Rio Tamanduateí tem cerca de 320 km².', 'tamanduatei'],
      ['C07', 'territorio', 'Cerca de 55% do território de Santo André fica em área de proteção aos mananciais.', 'billings'],
      ['C08', 'territorio', 'O Rio Grande, que nasce na região de Paranapiacaba, é o principal formador da Represa Billings.', 'billings'],
      ['C09', 'territorio', 'Em 2019 a Sabesp assumiu os serviços de água e esgoto de Santo André, que antes eram do Semasa, com contrato de 40 anos.', 'sabespsa'],
      ['C10', 'descarte', 'Segundo a Sabesp, 1 litro de óleo de cozinha pode poluir até 25 mil litros de água.', 'oleo'],
      ['C11', 'descarte', 'Óleo de cozinha usado não vai na pia: guarde frio numa garrafa PET fechada e leve a um ponto de coleta.', 'oleo'],
      ['C12', 'tratamento', 'No tratamento por lodo ativado, micro-organismos que precisam de oxigênio "comem" a matéria orgânica do esgoto.', 'esgoto'],
      ['C13', 'tratamento', 'A primeira etapa numa estação de esgoto é o gradeamento: grades seguram plásticos, panos e outros objetos grandes.', 'esgoto'],
      ['C14', 'tratamento', 'Na estação de água, a coagulação desestabiliza a sujeira, a floculação junta tudo em flocos e a decantação deixa os flocos irem para o fundo.', 'etapasagua'],
      ['C15', 'tratamento', 'Na filtração da água tratada, ela atravessa camadas de pedras, areia e carvão antracito.', 'etapasagua'],
      ['C16', 'tratamento', 'O flúor colocado na água tratada ajuda a proteger os dentes.', 'tratagua'],
      ['C17', 'saude', 'Cólera, hepatite A, diarreia, esquistossomose e leptospirose estão entre as doenças ligadas à falta de saneamento.', 'doencas'],
      ['C18', 'saude', 'A leptospirose é transmitida pela urina de animais infectados, como ratos — por isso enchentes e esgoto a céu aberto são um risco.', 'doencas'],
      ['C19', 'saude', 'A hepatite A passa por água e alimentos contaminados por fezes. Água tratada, saneamento, higiene das mãos e vacina previnem.', 'hepatite'],
      ['C20', 'saude', 'Os ovos do Aedes aegypti podem sobreviver até 1 ano no seco, esperando a água para eclodir.', 'dengue'],
      ['C21', 'saude', 'Pesquisa do Instituto Oswaldo Cruz: 15 horas depois de postos, os ovos do Aedes já têm uma camada que resiste à seca.', 'dengueovo'],
      ['C22', 'residuos', 'Cores da coleta seletiva (Conama 275/2001): azul papel, vermelho plástico, verde vidro e amarelo metal.', 'conama275'],
      ['C23', 'residuos', 'Mais cores da Conama 275/2001: preto madeira, laranja resíduos perigosos, marrom orgânicos e cinza o que não é reciclável.', 'conama275'],
      ['C24', 'residuos', 'A Política Nacional de Resíduos Sólidos põe uma ordem: não gerar, reduzir, reutilizar, reciclar, tratar e só então dispor o rejeito.', 'pnrs'],
      ['C25', 'residuos', 'O Brasil reciclou 97,3% das latas de alumínio de bebidas em 2024.', 'latas'],
      ['C26', 'descarte', 'Remédio vencido não vai na pia nem no vaso: leve a um ponto de coleta (farmácias e unidades de saúde). A regra é do Decreto 10.388/2020.', 'remedios'],
      ['C27', 'aguas', 'A ONU indica 110 litros de água por pessoa por dia; a média no Brasil é de 166,3 litros.', 'consumo'],
      ['C28', 'aguas', 'Um banho de 15 minutos com o registro meio aberto gasta cerca de 135 litros; em 5 minutos, 45 litros.', 'economia'],
      ['C29', 'aguas', 'Escovar os dentes com a torneira aberta pode gastar 12 litros; fechando a torneira, dá para economizar 11,5 litros.', 'economia'],
      ['C30', 'aguas', 'Uma torneira pingando pode desperdiçar 46 litros de água por dia.', 'economia'],
      ['C31', 'leis', 'Segundo o Ranking do Saneamento 2026 do Trata Brasil, 16,9% dos brasileiros ainda não têm água potável e 44,8% não têm coleta de esgoto.', 'tratabrasil'],
      ['C32', 'aguas', 'O Dia Mundial da Água, 22 de março, nasceu na Rio-92, a conferência da ONU no Rio de Janeiro.', 'diaagua'],
      ['C33', 'esgoto', 'O 19 de novembro é o Dia Mundial do Banheiro (ONU, 2013): cerca de 3,5 bilhões de pessoas vivem sem banheiro seguro.', 'banheiro'],
      ['C34', 'seguranca', 'O 28 de abril é o Dia Mundial da Segurança e Saúde no Trabalho (OIT, 2003); por isso abril é o Abril Verde.', 'abrilverde'],
      ['C35', 'seguranca', 'No Brasil, o 28 de abril também é o Dia Nacional em Memória das Vítimas de Acidentes e Doenças do Trabalho (Lei 11.121/2005).', 'abrilverde']
    ].map(([id, tema, texto, fonte]) => ({id, tema, texto, fonte}));
  }

  /** [id, tema, pergunta, opções (4), índice da certa, explicação, fonte] */
  static get perguntas() {
    return [
      ['Q001', 'leis', 'Qual é o número do Objetivo de Desenvolvimento Sustentável da ONU sobre água potável e saneamento?', ['ODS 3', 'ODS 6', 'ODS 11', 'ODS 14'], 1, 'O ODS 6 trata de assegurar água e saneamento para todas e todos.', 'ods6'],
      ['Q002', 'leis', 'Até quando o novo marco legal quer 99% da população com água potável?', ['2025', '2030', '2033', '2040'], 2, 'A meta da Lei 14.026/2020 vence em 31/12/2033.', 'marco'],
      ['Q003', 'leis', 'Pelo novo marco legal, qual a meta de coleta e tratamento de esgoto até 2033?', ['50% da população', '75% da população', '90% da população', '100% da população'], 2, 'A meta é 90% com coleta e tratamento de esgoto (e 99% com água potável).', 'marco'],
      ['Q004', 'leis', 'Qual lei é o novo marco legal do saneamento?', ['Lei 14.026/2020', 'Lei 12.305/2010', 'Lei 9.433/1997', 'Lei 8.080/1990'], 0, 'A Lei 14.026/2020 atualizou o marco do saneamento.', 'marco'],
      ['Q005', 'leis', 'O novo marco do saneamento atualizou qual lei de diretrizes nacionais?', ['Lei 11.445/2007', 'Lei 12.305/2010', 'Lei 6.938/1981', 'Lei 10.257/2001'], 0, 'A Lei 11.445/2007 traz as diretrizes nacionais do saneamento básico.', 'usp2033'],
      ['Q006', 'residuos', 'Qual lei criou a Política Nacional de Resíduos Sólidos?', ['Lei 14.026/2020', 'Lei 12.305/2010', 'Lei 11.445/2007', 'Lei 9.605/1998'], 1, 'A PNRS é a Lei 12.305/2010.', 'pnrs'],
      ['Q007', 'residuos', 'Pela PNRS, qual vem PRIMEIRO na ordem de prioridade?', ['Reciclar', 'Reutilizar', 'Não gerar', 'Tratar'], 2, 'A ordem é: não gerar, reduzir, reutilizar, reciclar, tratar e dispor o rejeito.', 'pnrs'],
      ['Q008', 'residuos', 'Pela PNRS, o que vem logo depois de "reutilizar"?', ['Reciclar', 'Reduzir', 'Não gerar', 'Disposição final'], 0, 'Não gerar → reduzir → reutilizar → reciclar → tratar → disposição final.', 'pnrs'],
      ['Q009', 'residuos', 'Na coleta seletiva, qual cor é a do PAPEL?', ['Verde', 'Vermelho', 'Amarelo', 'Azul'], 3, 'Conama 275: azul papel, vermelho plástico, verde vidro, amarelo metal.', 'conama275'],
      ['Q010', 'residuos', 'Na coleta seletiva, qual cor é a do PLÁSTICO?', ['Vermelho', 'Azul', 'Marrom', 'Verde'], 0, 'Vermelho é plástico (Conama 275/2001).', 'conama275'],
      ['Q011', 'residuos', 'Na coleta seletiva, qual cor é a do VIDRO?', ['Amarelo', 'Laranja', 'Verde', 'Preto'], 2, 'Verde é vidro (Conama 275/2001).', 'conama275'],
      ['Q012', 'residuos', 'Na coleta seletiva, qual cor é a do METAL?', ['Amarelo', 'Azul', 'Cinza', 'Vermelho'], 0, 'Amarelo é metal (Conama 275/2001).', 'conama275'],
      ['Q013', 'residuos', 'Na coleta seletiva, o marrom é para:', ['Madeira', 'Papel', 'Resíduos perigosos', 'Resíduos orgânicos'], 3, 'Marrom é orgânico; preto é madeira (Conama 275/2001).', 'conama275'],
      ['Q014', 'residuos', 'Na coleta seletiva, o laranja é para:', ['Plástico', 'Madeira', 'Resíduos perigosos', 'Vidro'], 2, 'Laranja é resíduo perigoso (Conama 275/2001).', 'conama275'],
      ['Q015', 'residuos', 'Na coleta seletiva, o preto é para:', ['Madeira', 'Metal', 'Orgânicos', 'Não recicláveis'], 0, 'Preto é madeira; cinza é o que não é reciclável.', 'conama275'],
      ['Q016', 'residuos', 'Na coleta seletiva, o cinza é para:', ['Vidro', 'Madeira', 'Papel', 'Resíduo não reciclável'], 3, 'Cinza é resíduo geral não reciclável (Conama 275/2001).', 'conama275'],
      ['Q017', 'residuos', 'Quanto das latas de alumínio de bebidas o Brasil reciclou em 2024?', ['Cerca de 30%', 'Cerca de 55%', 'Cerca de 75%', 'Cerca de 97%'], 3, 'Foram 97,3% em 2024 — o Brasil é referência mundial.', 'latas'],
      ['Q018', 'descarte', 'Segundo a Sabesp, 1 litro de óleo de cozinha pode poluir até quantos litros de água?', ['250 litros', '2,5 mil litros', '25 mil litros', '250 mil litros'], 2, 'Até 25 mil litros de água.', 'oleo'],
      ['Q019', 'descarte', 'Qual o jeito certo de descartar óleo de cozinha usado?', ['Na pia, com água quente', 'No vaso sanitário', 'Frio, numa garrafa PET fechada, num ponto de coleta', 'No ralo do quintal'], 2, 'Guardado numa garrafa fechada e levado a um ponto de coleta, ele vira sabão ou biodiesel.', 'oleo'],
      ['Q020', 'descarte', 'Onde descartar remédio vencido?', ['No vaso sanitário', 'Na pia', 'No lixo comum', 'Num ponto de coleta, como farmácias e unidades de saúde'], 3, 'O Decreto 10.388/2020 criou a logística reversa de medicamentos domiciliares.', 'remedios'],
      ['Q021', 'descarte', 'Qual decreto regulamenta a logística reversa de remédios domiciliares vencidos?', ['Decreto 10.388/2020', 'Decreto 7.404/2010', 'Decreto 5.440/2005', 'Decreto 9.854/2019'], 0, 'O Decreto 10.388/2020 trata dos medicamentos domiciliares e suas embalagens.', 'remedios'],
      ['Q022', 'territorio', 'Onde nasce o Rio Tamanduateí?', ['Em Paranapiacaba', 'No Parque do Ibirapuera', 'Na Represa Billings', 'No Parque da Gruta de Santa Luzia, em Mauá'], 3, 'As nascentes ficam no Parque Municipal da Gruta de Santa Luzia, em Mauá.', 'tamanduatei'],
      ['Q023', 'territorio', 'Em qual rio o Tamanduateí deságua?', ['Pinheiros', 'Rio Grande', 'Paraíba do Sul', 'Tietê'], 3, 'Ele deságua no Tietê, no Bom Retiro, em São Paulo.', 'tamanduatei'],
      ['Q024', 'territorio', 'Qual o comprimento aproximado do Rio Tamanduateí?', ['Cerca de 8 km', 'Cerca de 35 km', 'Cerca de 120 km', 'Cerca de 300 km'], 1, 'São cerca de 35 km de Mauá até o Tietê.', 'tamanduatei'],
      ['Q025', 'territorio', 'Por quais cidades o Tamanduateí passa?', ['Mauá, Santo André, São Caetano e São Paulo', 'Santos, Cubatão e São Vicente', 'Diadema, Guarulhos e Osasco', 'Ribeirão Pires e Rio Grande da Serra'], 0, 'Mauá, Santo André, São Caetano do Sul e São Paulo.', 'tamanduatei'],
      ['Q026', 'territorio', 'Qual a área aproximada da bacia do Rio Tamanduateí?', ['32 km²', '320 km²', '3.200 km²', '32.000 km²'], 1, 'Cerca de 320 km².', 'tamanduatei'],
      ['Q027', 'territorio', 'Quanto do território de Santo André está em área de proteção aos mananciais?', ['Cerca de 10%', 'Cerca de 25%', 'Cerca de 55%', 'Cerca de 90%'], 2, 'Cerca de 55% — a maior parte rumo a Paranapiacaba e à Billings.', 'billings'],
      ['Q028', 'territorio', 'Qual rio, que nasce na região de Paranapiacaba, é o principal formador da Billings?', ['Rio Tamanduateí', 'Rio Pinheiros', 'Rio Grande', 'Rio Tietê'], 2, 'O Rio Grande é o principal formador da Represa Billings.', 'billings'],
      ['Q029', 'territorio', 'Em que ano a Sabesp assumiu a água e o esgoto de Santo André?', ['2009', '2015', '2019', '2023'], 2, 'O convênio foi assinado em julho de 2019.', 'sabespsa'],
      ['Q030', 'territorio', 'Antes da Sabesp, quem cuidava da água e do esgoto de Santo André?', ['Semasa', 'Cetesb', 'Daee', 'Emae'], 0, 'O Semasa, autarquia municipal.', 'abcreporter'],
      ['Q031', 'territorio', 'Qual o prazo do contrato da Sabesp com Santo André, assinado em 2019?', ['10 anos', '20 anos', '30 anos', '40 anos'], 3, 'O contrato é de 40 anos.', 'sabespsa'],
      ['Q032', 'tratamento', 'Qual costuma ser a PRIMEIRA etapa numa estação de tratamento de esgoto?', ['Lodo ativado', 'Desinfecção', 'Decantação secundária', 'Gradeamento'], 3, 'O gradeamento retém objetos grandes antes das outras etapas.', 'esgoto'],
      ['Q033', 'tratamento', 'No lodo ativado, quem limpa o esgoto?', ['Peixes', 'Produtos de limpeza', 'Plantas aquáticas', 'Micro-organismos que usam oxigênio'], 3, 'Bactérias aeróbias consomem a matéria orgânica.', 'esgoto'],
      ['Q034', 'tratamento', 'Para que serve a desarenação no tratamento de esgoto?', ['Tirar a areia', 'Colocar cloro', 'Separar o óleo do sabão', 'Aquecer o esgoto'], 0, 'A caixa de areia deixa a areia assentar e protege as bombas e tubulações.', 'esgoto'],
      ['Q035', 'tratamento', 'No tratamento de água, o que acontece na floculação?', ['A água é aquecida', 'A água é bombeada para casa', 'A água recebe flúor', 'A sujeira se junta em flocos'], 3, 'Na mistura lenta, as partículas se juntam em flocos.', 'etapasagua'],
      ['Q036', 'tratamento', 'No tratamento de água, para que servem os tanques de decantação?', ['Para os flocos de sujeira irem para o fundo', 'Para adicionar flúor', 'Para medir o consumo', 'Para guardar a água da chuva'], 0, 'Os flocos pesados assentam no fundo dos tanques.', 'etapasagua'],
      ['Q037', 'tratamento', 'O que fica nos filtros da estação de água?', ['Algodão e papel', 'Telas de plástico', 'Só cloro', 'Pedras, areia e carvão antracito'], 3, 'Camadas de pedras, areia e carvão antracito retêm a sujeira que sobrou.', 'etapasagua'],
      ['Q038', 'tratamento', 'Por que se coloca flúor na água tratada?', ['Para dar cor', 'Para ajudar a proteger os dentes', 'Para tirar o cheiro', 'Para economizar energia'], 1, 'A fluoretação ajuda na prevenção de cáries.', 'tratagua'],
      ['Q039', 'tratamento', 'Qual etapa do tratamento de água garante que não sobrem micro-organismos?', ['Floculação', 'Desinfecção', 'Decantação', 'Captação'], 1, 'Na desinfecção, o cloro elimina os micro-organismos.', 'etapasagua'],
      ['Q040', 'tratamento', 'Na coagulação, a estação de água coloca na água:', ['Um coagulante, como sulfato de alumínio', 'Açúcar', 'Areia', 'Óleo'], 0, 'O coagulante (sulfato de alumínio ou cloreto férrico) desestabiliza a sujeira.', 'etapasagua'],
      ['Q041', 'saude', 'Qual destas doenças é ligada à falta de saneamento?', ['Catapora', 'Diabetes', 'Rinite', 'Hepatite A'], 3, 'A hepatite A passa por água e alimentos contaminados.', 'hepatite'],
      ['Q042', 'saude', 'Como a leptospirose é transmitida?', ['Picada de mosquito', 'Aperto de mão', 'Pelo ar', 'Urina de animais infectados, como ratos'], 3, 'Enchentes e esgoto a céu aberto espalham a urina contaminada.', 'doencas'],
      ['Q043', 'saude', 'A hepatite A é transmitida principalmente por:', ['Água e alimentos contaminados', 'Picada de inseto', 'Transfusão de sangue', 'Tosse'], 0, 'É a via fecal-oral; saneamento e higiene previnem.', 'hepatite'],
      ['Q044', 'saude', 'Qual campanha de julho trata das hepatites virais?', ['Julho Verde', 'Julho Amarelo', 'Julho Azul', 'Julho Lilás'], 1, 'Julho Amarelo — o dia 28 de julho é o Dia Mundial contra as Hepatites Virais.', 'hepatite'],
      ['Q045', 'saude', 'Por quanto tempo os ovos do Aedes aegypti podem sobreviver no seco?', ['1 dia', '1 semana', '1 mês', 'Até 1 ano'], 3, 'Até 1 ano — por isso é preciso esfregar as bordas dos recipientes.', 'dengue'],
      ['Q046', 'saude', 'Onde as larvas do Aedes aegypti se desenvolvem?', ['Em água parada', 'Em rios correntes', 'Na terra seca', 'Na areia da praia'], 0, 'Pratinhos, pneus, baldes e caixas d\'água destampadas são criadouros.', 'dengue'],
      ['Q047', 'saude', 'Qual destas NÃO é uma doença de veiculação hídrica?', ['Cólera', 'Esquistossomose', 'Leptospirose', 'Sarampo'], 3, 'O sarampo passa pelo ar; as outras estão ligadas à água contaminada.', 'doencas'],
      ['Q048', 'saude', 'O que ajuda a prevenir a hepatite A?', ['Água tratada, saneamento e lavar as mãos', 'Usar protetor solar', 'Tomar sol', 'Beber água da torneira sem tratamento'], 0, 'Água tratada, saneamento, higiene e vacina previnem.', 'hepatite'],
      ['Q049', 'aguas', 'Quantos litros de água por pessoa por dia a ONU indica?', ['50 litros', '110 litros', '200 litros', '500 litros'], 1, 'São 110 litros; a média no Brasil é de 166,3 litros.', 'consumo'],
      ['Q050', 'aguas', 'Qual a média de consumo de água por pessoa por dia no Brasil?', ['Cerca de 60 litros', 'Cerca de 110 litros', 'Cerca de 166 litros', 'Cerca de 400 litros'], 2, 'Cerca de 166,3 litros — 51% acima do indicado pela ONU.', 'consumo'],
      ['Q051', 'aguas', 'Quanto gasta um banho de 15 minutos com o registro meio aberto?', ['Cerca de 15 litros', 'Cerca de 45 litros', 'Cerca de 135 litros', 'Cerca de 500 litros'], 2, 'Cerca de 135 litros; em 5 minutos, 45 litros.', 'economia'],
      ['Q052', 'aguas', 'Quanto uma torneira pingando pode desperdiçar por dia?', ['1 litro', '46 litros', '460 litros', '4.600 litros'], 1, 'Cerca de 46 litros por dia.', 'economia'],
      ['Q053', 'aguas', 'Quanto dá para economizar fechando a torneira ao escovar os dentes?', ['0,5 litro', '3 litros', '11,5 litros', '50 litros'], 2, 'Cerca de 11,5 litros por escovação.', 'economia'],
      ['Q054', 'aguas', 'Em que dia é o Dia Mundial da Água?', ['5 de junho', '22 de março', '21 de setembro', '19 de novembro'], 1, '22 de março, criado a partir da Rio-92.', 'diaagua'],
      ['Q055', 'aguas', 'Em qual conferência da ONU nasceu o Dia Mundial da Água?', ['Rio-92', 'Estocolmo-72', 'Kyoto-97', 'Paris-2015'], 0, 'Na Rio-92, no Rio de Janeiro.', 'diaagua'],
      ['Q056', 'esgoto', 'Em que dia é o Dia Mundial do Banheiro?', ['22 de março', '28 de abril', '5 de junho', '19 de novembro'], 3, '19 de novembro, data da ONU desde 2013.', 'banheiro'],
      ['Q057', 'esgoto', 'Quantas pessoas no mundo vivem sem banheiro seguro, segundo as campanhas do Dia Mundial do Banheiro?', ['Cerca de 35 milhões', 'Cerca de 350 milhões', 'Cerca de 3,5 bilhões', 'Ninguém'], 2, 'Cerca de 3,5 bilhões de pessoas.', 'banheiro'],
      ['Q058', 'esgoto', 'Segundo o Trata Brasil (Ranking 2026), quantos brasileiros não têm coleta de esgoto?', ['Cerca de 5%', 'Cerca de 20%', 'Cerca de 45%', 'Cerca de 80%'], 2, 'São 44,8% sem coleta de esgoto.', 'tratabrasil'],
      ['Q059', 'aguas', 'Segundo o Trata Brasil (Ranking 2026), quantos brasileiros não têm água potável?', ['Cerca de 2%', 'Cerca de 17%', 'Cerca de 45%', 'Cerca de 70%'], 1, 'São 16,9% sem água potável.', 'tratabrasil'],
      ['Q060', 'seguranca', 'Qual é o Dia Mundial da Segurança e Saúde no Trabalho?', ['1º de maio', '28 de abril', '15 de outubro', '10 de dezembro'], 1, '28 de abril, instituído pela OIT em 2003 — por isso existe o Abril Verde.', 'abrilverde'],
      ['Q061', 'seguranca', 'Qual a cor da campanha de abril sobre segurança e saúde no trabalho?', ['Abril Azul', 'Abril Verde', 'Abril Laranja', 'Abril Branco'], 1, 'Abril Verde, com o laço verde.', 'abrilverde'],
      ['Q062', 'esgoto', 'Por que o óleo de cozinha na pia é um problema para o esgoto?', ['Ele entope as tubulações e polui a água', 'Ele limpa os canos', 'Ele evapora sem deixar nada', 'Ele vira água tratada'], 0, 'O óleo gruda nos canos, causa entupimentos e polui muita água.', 'oleo'],
      ['Q063', 'saude', 'Quanto tempo depois de postos os ovos do Aedes já resistem à seca, segundo o IOC/Fiocruz?', ['15 minutos', '15 horas', '15 dias', '15 semanas'], 1, 'Cerca de 15 horas depois da postura.', 'dengueovo'],
      ['Q064', 'leis', 'A meta 6.1 do ODS 6 pede acesso universal e equitativo a quê, até 2030?', ['Internet', 'Transporte público', 'Energia elétrica', 'Água potável e segura'], 3, 'A meta 6.1 é água potável e segura para todos até 2030.', 'ipea6'],
      ['Q065', 'tratamento', 'Numa estação de esgoto com lodo ativado, o que vem logo depois do tanque de aeração?', ['Gradeamento', 'Captação', 'Desarenação', 'Decantação secundária'], 3, 'No decantador secundário, o lodo com os micro-organismos se separa do esgoto já tratado.', 'ete']
    ].map(([id, tema, pergunta, opcoes, certa, explica, fonte]) => ({id, tema, pergunta, opcoes, certa, explica, fonte}));
  }

  /** Campanhas de saúde do mês (as mesmas do laço do mascote) e datas do saneamento ligadas a cada mês. */
  static get campanhas() {
    return [['Janeiro Branco', 'saúde mental'], ['Fevereiro Roxo', 'lúpus, fibromialgia e Alzheimer'], ['Março Lilás', 'câncer do colo do útero'], ['Abril Azul', 'autismo'],
      ['Maio Amarelo', 'segurança no trânsito'], ['Junho Vermelho', 'doação de sangue'], ['Julho Amarelo', 'hepatites virais'], ['Agosto Dourado', 'aleitamento materno'],
      ['Setembro Amarelo', 'prevenção do suicídio'], ['Outubro Rosa', 'câncer de mama'], ['Novembro Azul', 'câncer de próstata'], ['Dezembro Vermelho', 'prevenção ao HIV/aids']];
  }
  /** [mês (1-12), dia, título, ID da curiosidade que explica] */
  static get datas() {
    return [[3, 22, 'Dia Mundial da Água', 'C32'], [4, 28, 'Dia Mundial da Segurança e Saúde no Trabalho (Abril Verde)', 'C34'], [7, 28, 'Dia Mundial contra as Hepatites Virais (Julho Amarelo)', 'C19'], [11, 19, 'Dia Mundial do Banheiro', 'C33']];
  }

  static fonte(id) { const f = ConteudoSaneamentoCPT.fontes[id]; return f ? {nome: f[0], url: f[1]} : null; }
  static revisar(perfil, x) { return ConteudoSaneamentoCPT.proprietario(perfil) && !ConteudoSaneamentoCPT.aprovada(x.id); }
  static visiveis(lista, perfil) { return ConteudoSaneamentoCPT.proprietario(perfil) ? lista : lista.filter(x => ConteudoSaneamentoCPT.aprovada(x.id)); }
  /** Número estável de um texto (FNV-1a): a mesma pessoa no mesmo dia recebe sempre o mesmo sorteio. */
  static hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  static embaralhar(lista, semente) { return lista.map(x => [ConteudoSaneamentoCPT.hash(semente + ':' + x.id), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]); }

  /** Curiosidade do dia para a pessoa (muda a cada dia; vazio se nada visível). */
  static curiosidadeDoDia(perfil, email, dia) {
    const lista = ConteudoSaneamentoCPT.visiveis(ConteudoSaneamentoCPT.curiosidades, perfil); if (!lista.length) return null;
    const c = ConteudoSaneamentoCPT.embaralhar(lista, email + ':' + dia)[0];
    return {id: c.id, tema: ConteudoSaneamentoCPT.temas[c.tema], texto: c.texto, fonte: ConteudoSaneamentoCPT.fonte(c.fonte), revisar: ConteudoSaneamentoCPT.revisar(perfil, c)};
  }
  /** Campanha do mês e datas do saneamento do mês (dia = AAAA-MM-DD). */
  static doMes(perfil, dia) {
    const mes = Number(dia.slice(5, 7)), [nome, tema] = ConteudoSaneamentoCPT.campanhas[mes - 1], curs = ConteudoSaneamentoCPT.visiveis(ConteudoSaneamentoCPT.curiosidades, perfil);
    const datas = ConteudoSaneamentoCPT.datas.filter(d => d[0] === mes).map(([, d, titulo, cid]) => { const c = curs.find(x => x.id === cid); return c ? {dia: d, titulo, texto: c.texto, fonte: ConteudoSaneamentoCPT.fonte(c.fonte)} : null; }).filter(Boolean);
    return {campanha: nome, tema, datas};
  }
  /** Pergunta sem a resposta (o que vai para a tela antes de responder). */
  static semResposta(q, perfil) { return {id: q.id, tema: ConteudoSaneamentoCPT.temas[q.tema], pergunta: q.pergunta, opcoes: q.opcoes, revisar: ConteudoSaneamentoCPT.revisar(perfil, q)}; }
  static pergunta(id) { return ConteudoSaneamentoCPT.perguntas.find(q => q.id === id) || null; }
}
