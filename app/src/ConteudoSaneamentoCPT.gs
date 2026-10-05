/**
 * ConteudoSaneamentoCPT 2.26.0. Curiosidades, perguntas do quiz e campanhas do mês, todas com fonte.
 * Só conteúdo (nada é lido nem gravado aqui). O quiz e as pontuações ficam em QuizCPT; as decisões da revisão,
 * em RevisaoConteudoCPT (coleção "Revisão do conteúdo", só o proprietário decide).
 *
 * 2.26: banco revisto (~150 itens), com eixo pedagógico em cada item:
 * - pratica (≈60%): o que a equipe faz e orienta no bairro; curiosidade (≈15%): fato interessante + por que importa;
 *   entender (≈25%): o porquê das coisas (coleta × afastamento × tratamento, esgoto × drenagem, obra × sistema operando).
 * - Fonte pública primária sempre que possível. "equipe" = prática da equipe (sem link), vale só depois da revisão.
 * - Nas perguntas, a alternativa certa vem PRIMEIRO no código; a posição na tela sai de um sorteio fixo pelo ID
 *   (sempre a mesma para o mesmo item), para não concentrar as certas numa letra.
 * Quem vê: o proprietário vê tudo que não foi suspenso, com a marca "a revisar"; as demais pessoas, só o aprovado.
 * O texto para conferir fora da aplicação fica em docs/CONTEUDO_SANEAMENTO.md (node app/testes/quiz.cjs --atualizar).
 */
class ConteudoSaneamentoCPT {
  static proprietario(perfil) { return !!perfil && perfil.papeis.includes('administrador'); }
  static get eixos() { return {pratica: 'Na prática', entender: 'Para entender', curiosidade: 'Fato curioso'}; }
  static get temas() {
    return {aguas: 'Água no dia a dia', esgoto: 'Esgoto', tratamento: 'Tratamento', drenagem: 'Chuva e drenagem', residuos: 'Resíduos',
      descarte: 'Descarte correto', saude: 'Saúde', leis: 'Leis e metas', territorio: 'Nosso território', obra: 'Obra e comunidade',
      atendimento: 'Atendimento ao morador', social: 'Trabalho social', seguranca: 'Segurança'};
  }

  static get fontes() {
    return {
      equipe: ['Prática da equipe socioambiental (revisada pelo proprietário)', ''],
      marco: ['Planalto — Lei 14.026/2020 (marco legal do saneamento)', 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14026.htm'],
      lei11445: ['Câmara dos Deputados — Lei 11.445/2007, texto atualizado', 'https://www2.camara.leg.br/legin/fed/lei/2007/lei-11445-5-janeiro-2007-549031-normaatualizada-pl.html'],
      ods6: ['ONU Brasil — Objetivo de Desenvolvimento Sustentável 6', 'https://brasil.un.org/pt-br/sdgs/6'],
      onuagua: ['ONU (UNRIC) — Água e o direito humano à água', 'https://unric.org/pt/agua/'],
      jmp: ['OMS/UNICEF — Relatório JMP 2025 (dados de 2024)', 'https://data.unicef.org/resources/jmp-report-2025/'],
      tratabrasil: ['Instituto Trata Brasil — Ranking do Saneamento 2026', 'https://tratabrasil.org.br/wp-content/uploads/2026/03/Release-Ranking-2026_vf.pdf'],
      semasa25: ['Semasa — 25 anos da Gestão Ambiental em Santo André (2024)', 'https://portais.santoandre.sp.gov.br/semasa/wp-content/uploads/sites/13/2024/12/Livro-25-Anos-da-Gestao-Ambiental-DGA-2024.pdf'],
      sabespsa: ['Prefeitura de Santo André — Sabesp assume o saneamento da cidade', 'https://web.santoandre.sp.gov.br/portal/noticias/0/3/13038/sabesp-assume-saneamento-de-santo-andre-e-anuncia-novo-pacote-de-obras-para-acabar-com-a-falta-dagua'],
      sabespcanais: ['Sabesp — Canais de atendimento (folheto)', 'https://www.sabesp.com.br/assets/images/folhetos/sabesp-canais-atendimento.pdf'],
      tamanduatei: ['Wikipédia — Rio Tamanduateí', 'https://pt.wikipedia.org/wiki/Rio_Tamanduate%C3%AD'],
      billings: ['Wikipédia — Represa Billings', 'https://pt.wikipedia.org/wiki/Represa_Billings'],
      oleo: ['SAMAE Timbó — Óleo de cozinha (estimativa da Sabesp)', 'https://samaetimbo.com.br/detalhe/mostra/400'],
      esgoto: ['BRK Ambiental — Etapas do tratamento de esgoto', 'https://blog.brkambiental.com.br/etapas-tratamento-de-esgoto/'],
      tratagua: ['Sabesp — Tratamento de água (folheto)', 'https://www.sabesp.com.br/assets/pdf/sabesp-tratamento-agua-1.pdf'],
      etapasagua: ['Tratamento de Água — Etapas do tratamento da água', 'https://tratamentodeagua.com.br/artigo/etapas-tratamento-agua/'],
      doencas: ['Revista Caminhos de Geografia (UFU) — Doenças de veiculação hídrica', 'https://seer.ufu.br/index.php/caminhosdegeografia/article/download/45545/26775/208144'],
      leptospirose: ['Ministério da Saúde — Leptospirose', 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/l/leptospirose'],
      hepatite: ['Ministério da Saúde — Julho Amarelo e as hepatites virais', 'https://www.gov.br/saude/pt-br/assuntos/saude-com-ciencia/noticias/2024/julho/julho-amarelo-entenda-a-importancia-da-prevencao-e-controle-das-hepatites-virais'],
      dengue: ['Ministério da Saúde — Aedes aegypti: um perigo mesmo na seca', 'https://www.gov.br/saude/pt-br/assuntos/noticias/2024/outubro/mosquito-aedes-aegypti-um-perigo-mesmo-em-periodos-de-seca'],
      ioc: ['IOC/Fiocruz — Mecanismos da impermeabilidade dos ovos do Aedes aegypti', 'https://www.ioc.fiocruz.br/noticias/descobertos-mecanismos-ligados-impermeabilidade-de-ovos-do-aegypti'],
      conama275: ['Resolução Conama 275/2001 (cópia da UFF)', 'https://www.uff.br/wp-content/uploads/2024/05/conama_275_2001_0.pdf'],
      pnrs: ['Câmara dos Deputados — Lei 12.305/2010 (Política Nacional de Resíduos Sólidos)', 'https://www2.camara.leg.br/legin/fed/lei/2010/lei-12305-2-agosto-2010-607598-publicacaooriginal-128609-pl.html'],
      reciclalatas: ['Recicla Latas — Brasil recicla 97,3% das latas de alumínio (2024)', 'https://reciclalatas.com.br/em-ano-de-cop30-brasil-reforca-sustentabilidade-ao-reciclar-973-das-latas-de-aluminio/'],
      decreto10388: ['Planalto — Decreto 10.388/2020 (logística reversa de medicamentos)', 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/decreto/d10388.htm'],
      economia: ['Boqnews — Dicas da Sabesp para economizar água (estimativas)', 'https://www.boqnews.com/cidades/dicas-da-sabesp-ensinam-como-economizar-agua/'],
      diaagua: ['WWF-Brasil — 22 de março, Dia Mundial da Água', 'https://www.wwf.org.br/?51682%2F22-de-maro-Dia-Mundial-da-gua='],
      abrilverde: ['Câmara Municipal de São Paulo — Abril Verde', 'https://www.saopaulo.sp.leg.br/blog/abril-verde-mes-de-conscientizacao-sobre-seguranca-e-saude-no-trabalho/'],
      portaria75: ['Ministério das Cidades — Portaria MCID 75/2025 (Trabalho Social)', 'https://www.gov.br/cidades/pt-br/acesso-a-informacao/institucional/base-juridica/portarias/PORTARIAMCIDN75DE28DEJANEIRODE2025.pdf']
    };
  }

  /** O que mudou nos itens que já existiam (aparece na tela de revisão). */
  static get correcoes() {
    return {
      C03: 'Sai o número da lei; entram os 4 serviços do saneamento.', C05: 'Novo: linguagem simples com o morador.', C06: 'Novo: o lixo da rua chega aos rios (sai a área da bacia).',
      C07: 'Fonte trocada para o Semasa (55% mantido).', C09: 'Contrato em julho/2019, operação desde 11/09/2019, 40 anos previstos no contrato.',
      C15: 'Novo: caixa d’água limpa e tampada.', C18: 'Contato com água ou lama contaminadas por urina de rato.', C21: 'Fonte original do IOC/Fiocruz.',
      C22: 'As 8 cores viraram uma dica prática.', C23: 'Novo: embalagem limpa na reciclagem.', C25: 'Fonte original: Recicla Latas.',
      C26: 'Ponto de coleta habilitado, como uma farmácia participante.', C27: 'ONU: 50 a 100 litros (saem o 110 e a média de 166,3).',
      C28: 'Estimativa, com as condições.', C29: 'Estimativa, com as condições.', C30: 'Estimativa, com as condições.', C31: 'Números do Ranking 2026 corrigidos.',
      C33: 'Dado do relatório OMS/UNICEF 2025.', C35: 'Novo: EPI perto da obra (sai o número da lei).',
      Q002: 'Metas de água e esgoto numa pergunta só.', Q020: 'Ponto de coleta habilitado.', Q027: 'Fonte do Semasa.',
      Q029: 'Pergunta sobre o início da operação; contrato e prazo na explicação.', Q030: 'Agora prática: o que ficou com o Semasa.',
      Q037: 'Materiais que PODEM compor os filtros.', Q039: 'Desinfecção inativa micro-organismos que causam doenças.', Q041: 'Nova: criança no córrego com esgoto.',
      Q042: 'Água ou lama contaminadas por urina de rato.', Q045: 'Nova: o que mais previne a dengue em casa.', Q049: 'ONU: 50 a 100 litros.',
      Q050: 'Nova: como achar vazamento escondido.', Q051: 'Estimativa, com as condições.', Q052: 'Estimativa, com as condições.', Q053: 'Agora prática: o hábito que economiza.',
      Q057: 'Dado OMS/UNICEF 2025, sem a alternativa "ninguém".', Q058: 'Números do Ranking 2026.', Q059: 'Números do Ranking 2026.',
      Q062: 'Sem a alternativa "vira água tratada".', Q063: 'Fonte original do IOC/Fiocruz.'
    };
  }

  /** [id, tema, eixo, fato, por que importa, fonte] */
  static get curiosidades() {
    if (ConteudoSaneamentoCPT.memoC) return ConteudoSaneamentoCPT.memoC;
    return (ConteudoSaneamentoCPT.memoC = [
      ['C01', 'leis', 'entender', 'O ODS 6 da ONU é garantir água e saneamento para todas e todos, com gestão sustentável, até 2030.', 'É a meta global que dá sentido ao trabalho no bairro: cada casa ligada à rede conta.', 'ods6'],
      ['C02', 'leis', 'entender', 'O marco legal do saneamento (Lei 14.026/2020) fixou a meta: até 31/12/2033, 99% da população com água potável e 90% com coleta e tratamento de esgoto.', 'As obras que acompanhamos são parte do caminho até essa meta.', 'marco'],
      ['C03', 'leis', 'entender', 'Pela Lei 11.445, saneamento básico é mais que água e esgoto: inclui limpeza urbana e resíduos sólidos e a drenagem da água da chuva.', 'Ajuda a explicar ao morador quem cuida de cada problema: nem tudo é da obra de esgoto.', 'lei11445'],
      ['C04', 'territorio', 'curiosidade', 'O Rio Tamanduateí nasce no Parque Municipal da Gruta de Santa Luzia, em Mauá, e corre cerca de 35 km até o Rio Tietê.', 'O esgoto que deixa de ir para os córregos de Santo André deixa de chegar a ele.', 'tamanduatei'],
      ['C05', 'social', 'pratica', 'Linguagem simples aproxima: em vez de "PV" e "interceptor", diga "tampa de inspeção da rede" e "cano grande que leva o esgoto para o tratamento".', 'Morador que entende a obra confia mais, colabora e reclama com informação útil.', 'equipe'],
      ['C06', 'drenagem', 'pratica', 'O lixo jogado na rua desce com a chuva pelas bocas de lobo e vai parar nos córregos e rios da cidade.', 'Descarte na rua vira enchente e rio sujo: é um bom gancho para conversar com o bairro.', 'equipe'],
      ['C07', 'territorio', 'entender', 'Cerca de 55% do território de Santo André fica em área de proteção aos mananciais, na região da Represa Billings.', 'Cuidar do esgoto e do lixo nessas áreas é proteger a água que depois é tratada para beber.', 'semasa25'],
      ['C08', 'territorio', 'curiosidade', 'O Rio Grande, que nasce na região de Paranapiacaba, é o principal formador da Represa Billings.', 'Liga a serra de Santo André à água da região: o que acontece lá em cima chega à represa.', 'billings'],
      ['C09', 'territorio', 'entender', 'Santo André e a Sabesp assinaram o contrato em julho de 2019; a Sabesp opera a água e o esgoto da cidade desde 11/09/2019, num contrato previsto para 40 anos.', 'Orienta o atendimento: problemas de água e de esgoto vão para a Sabesp.', 'sabespsa'],
      ['C10', 'descarte', 'curiosidade', 'Segundo estimativa divulgada pela Sabesp, 1 litro de óleo de cozinha pode poluir até 25 mil litros de água.', 'Uma garrafa PET de óleo levada ao ponto de coleta evita esse estrago e entupimentos na rua.', 'oleo'],
      ['C11', 'descarte', 'pratica', 'Óleo usado não vai na pia: espere esfriar, guarde numa garrafa PET fechada e leve a um ponto de coleta.', 'Na rede, o óleo gruda nos canos, entope e faz o esgoto voltar nas casas.', 'oleo'],
      ['C12', 'tratamento', 'entender', 'No tratamento por lodo ativado, micro-organismos que precisam de oxigênio consomem a matéria orgânica do esgoto.', 'É a natureza trabalhando dentro da estação, só que acelerada e controlada.', 'esgoto'],
      ['C13', 'tratamento', 'entender', 'A primeira etapa numa estação de esgoto costuma ser o gradeamento: grades seguram plásticos, panos e outros objetos.', 'Tudo o que vai pelo vaso e não é esgoto chega até lá, ou entope a rede no caminho.', 'esgoto'],
      ['C14', 'tratamento', 'entender', 'Na estação de água, a coagulação desestabiliza a sujeira, a floculação junta tudo em flocos e a decantação deixa os flocos assentarem.', 'A água do manancial sai limpa porque passa por várias etapas, não por um filtro só.', 'etapasagua'],
      ['C15', 'aguas', 'pratica', 'A água sai tratada da estação, mas uma caixa d’água suja ou destampada pode contaminá-la de novo dentro de casa.', 'Vale lembrar o morador: caixa tampada e limpa (a orientação mais comum é a cada 6 meses).', 'equipe'],
      ['C16', 'tratamento', 'curiosidade', 'O flúor colocado na água tratada ajuda a prevenir cáries.', 'É saúde pública que chega pela torneira, sem ninguém precisar lembrar.', 'tratagua'],
      ['C17', 'saude', 'entender', 'Cólera, hepatite A, diarreias, esquistossomose e leptospirose estão entre as doenças ligadas à falta de saneamento.', 'Coletar e tratar esgoto é também prevenir doença: um argumento forte para a ligação.', 'doencas'],
      ['C18', 'saude', 'pratica', 'A leptospirose é pega no contato com água ou lama de enchente contaminadas pela urina de ratos, sobretudo com feridas na pele ou muito tempo na água.', 'Na limpeza depois da enchente: luvas e botas de borracha, e crianças longe da água e da lama.', 'leptospirose'],
      ['C19', 'saude', 'pratica', 'A hepatite A passa por água e alimentos contaminados por fezes. Água tratada, saneamento, mãos lavadas e vacina previnem.', 'Julho Amarelo é um bom mês para levar o tema às ações com o bairro.', 'hepatite'],
      ['C20', 'saude', 'pratica', 'Os ovos do Aedes aegypti podem sobreviver até 1 ano no seco, grudados na parede dos recipientes.', 'Não basta esvaziar: é preciso esfregar as bordas de vasos, baldes e pratinhos.', 'dengue'],
      ['C21', 'saude', 'pratica', 'Pesquisa do IOC/Fiocruz: cerca de 15 horas depois de postos, os ovos do Aedes já ficam resistentes à seca.', 'Por isso a eliminação de criadouros precisa ser toda semana, não só quando chove.', 'ioc'],
      ['C22', 'residuos', 'pratica', 'As cores das lixeiras seguem a Resolução Conama 275: azul papel, vermelho plástico, verde vidro e amarelo metal.', 'Em casa não precisa de quatro lixeiras: separar recicláveis limpos e secos do resto já ajuda muito.', 'conama275'],
      ['C23', 'residuos', 'pratica', 'Embalagem com resto de comida suja o saco de recicláveis e pode acabar descartada na triagem.', 'Uma passada rápida de água (pode ser de reuso) faz a separação valer.', 'equipe'],
      ['C24', 'residuos', 'entender', 'A Política Nacional de Resíduos Sólidos põe uma ordem: não gerar, reduzir, reutilizar, reciclar, tratar e só então dispor o rejeito.', 'Reciclar é bom, mas o melhor resíduo é o que nem chega a existir.', 'pnrs'],
      ['C25', 'residuos', 'curiosidade', 'Em 2024 o Brasil reciclou 97,3% das latas de alumínio de bebidas, o 16º ano seguido acima de 95%.', 'Mostra que, com valor de mercado e coleta organizada, a reciclagem funciona.', 'reciclalatas'],
      ['C26', 'descarte', 'pratica', 'Remédio vencido ou que sobrou não vai na pia, no vaso nem no lixo comum: leve a um ponto de coleta habilitado, como uma farmácia participante.', 'Remédio no esgoto contamina a água; a coleta tem regra própria (Decreto 10.388/2020).', 'decreto10388'],
      ['C27', 'aguas', 'entender', 'A ONU estima que cada pessoa precisa de 50 a 100 litros de água por dia para beber, cozinhar e a higiene básica.', 'Ajuda a dimensionar o desperdício: um vazamento pode gastar o que uma pessoa usa no dia.', 'onuagua'],
      ['C28', 'aguas', 'pratica', 'Estimativa divulgada pela Sabesp: banho de 15 minutos com o registro meio aberto pode gastar cerca de 135 litros; em 5 minutos, cerca de 45. Varia com o chuveiro e a pressão.', 'É um exemplo concreto para falar de consumo, sem prometer número exato.', 'economia'],
      ['C29', 'aguas', 'pratica', 'Estimativa divulgada pela Sabesp: escovar os dentes com a torneira aberta pode gastar cerca de 12 litros; fechando enquanto escova, cerca de meio litro.', 'Hábito simples, fácil de ensinar às crianças nas ações.', 'economia'],
      ['C30', 'aguas', 'pratica', 'Estimativa divulgada pela Sabesp: uma torneira pingando pode desperdiçar cerca de 46 litros por dia, conforme o ritmo das gotas.', 'Trocar a vedação custa pouco e o morador sente na conta.', 'economia'],
      ['C31', 'leis', 'entender', 'Ranking do Saneamento 2026 (Trata Brasil): mais de 30 milhões de brasileiros sem água potável e cerca de 90 milhões (43,3%) sem coleta de esgoto.', 'O desafio é grande, e a obra no bairro é parte da resposta.', 'tratabrasil'],
      ['C32', 'aguas', 'curiosidade', 'O Dia Mundial da Água, 22 de março, foi proposto na Rio-92, a conferência da ONU no Rio de Janeiro.', 'É uma data boa para ações com escolas e lideranças do bairro.', 'diaagua'],
      ['C33', 'esgoto', 'curiosidade', 'Segundo OMS e UNICEF (2025), em 2024 3,4 bilhões de pessoas ainda não tinham saneamento gerido com segurança, e 354 milhões faziam as necessidades a céu aberto.', 'Banheiro ligado à rede, com esgoto tratado, ainda é privilégio no mundo.', 'jmp'],
      ['C34', 'seguranca', 'curiosidade', 'O 28 de abril é o Dia Mundial da Segurança e Saúde no Trabalho; por isso abril virou o Abril Verde.', 'Bom momento para revisar com a equipe os cuidados perto das frentes de obra.', 'abrilverde'],
      ['C35', 'seguranca', 'pratica', 'Perto da obra, a equipe socioambiental também segue a sinalização e usa o EPI exigido no local, como capacete, colete e botina.', 'Dá o exemplo ao morador e evita acidentes com valas e máquinas.', 'equipe'],
      ['C36', 'atendimento', 'pratica', 'Em Santo André, a Sabesp cuida da água e do esgoto; o Semasa continua com a gestão ambiental, a drenagem urbana e os resíduos sólidos.', 'Vazamento de esgoto é com a Sabesp; boca de lobo entupida e coleta de lixo, com o Semasa.', 'sabespsa'],
      ['C37', 'esgoto', 'entender', 'Coletar, afastar e tratar são etapas diferentes: o esgoto pode ser coletado na rua e ainda não chegar a uma estação de tratamento.', 'Rede nova não significa córrego limpo no dia seguinte: o sistema precisa estar completo.', 'lei11445'],
      ['C38', 'drenagem', 'pratica', 'Rede de esgoto e galeria de águas da chuva são sistemas separados: uma leva o esgoto para tratamento, a outra leva a chuva para os córregos.', 'Calha no esgoto faz a rede transbordar na chuva; esgoto na galeria polui o córrego.', 'lei11445'],
      ['C39', 'obra', 'pratica', 'Obra concluída não é o mesmo que sistema operando: depois da rede pronta ainda vêm as ligações dos imóveis, os testes e a conexão com coletores e estação.', 'Evita prometer ao morador um benefício com data que não depende da equipe.', 'equipe'],
      ['C40', 'social', 'pratica', 'Pela Portaria MCID 75/2025, o trabalho social em saneamento acontece antes, durante e depois da obra.', 'Diagnóstico e comunicação prévia preparam o bairro; o acompanhamento depois mostra se a mudança chegou.', 'portaria75'],
      ['C41', 'social', 'pratica', 'O diagnóstico do território é feito com a comunidade: quem mora ali, o que já existe, o que preocupa e quem são as lideranças.', 'Ação planejada a partir do que o bairro vive tem mais adesão e menos conflito.', 'portaria75'],
      ['C42', 'atendimento', 'pratica', 'Uma reclamação bem registrada responde: o quê, onde (rua, número e referência), desde quando, quem é afetado e como dar retorno.', 'Sem endereço exato e contato, a Execução não acha o problema e o caso volta.', 'equipe'],
      ['C43', 'atendimento', 'pratica', 'A central da Sabesp atende 24 horas no 0800 055 0195; pessoas com deficiência auditiva ou de fala usam o 0800 016 0195.', 'Com o canal certo, o morador não fica sem resposta fora do horário da equipe.', 'sabespcanais'],
      ['C44', 'esgoto', 'pratica', 'Onde há rede pública de esgoto disponível, a ligação do imóvel é obrigatória (Lei 11.445, art. 45).', 'Rede pronta sem ligação não tira o esgoto do córrego: por isso a mobilização importa.', 'lei11445'],
      ['C45', 'esgoto', 'pratica', 'A caixa de gordura segura a gordura da pia antes da rede e precisa ser limpa de tempos em tempos.', 'Caixa cheia deixa a gordura passar para a rede, entupir e causar mau cheiro.', 'equipe'],
      ['C46', 'obra', 'pratica', 'Aviso de obra bom diz o que vai acontecer, quando, por quanto tempo e a quem recorrer, e chega antes da máquina.', 'Comunicação prévia reduz conflito e reclamação depois.', 'equipe'],
      ['C47', 'atendimento', 'pratica', 'Quando o morador diz que a obra "só trouxe transtorno", ouvir até o fim e reconhecer o incômodo vem antes de explicar o benefício.', 'Quem se sente ouvido aceita melhor a informação e conta o que realmente precisa ser resolvido.', 'equipe'],
      ['C48', 'residuos', 'curiosidade', 'Uma lata de alumínio reciclada pode voltar às prateleiras em cerca de 60 dias.', 'Material que volta rápido para a indústria é material que não vai para o aterro.', 'reciclalatas'],
      ['C49', 'esgoto', 'curiosidade', 'Entre 2015 e 2024, 1,2 bilhão de pessoas passaram a ter saneamento gerido com segurança; no mundo, a cobertura foi de 48% para 58%.', 'Avançar é possível; o ritmo depende das obras e de cada casa ligada à rede.', 'jmp'],
      ['C50', 'leis', 'entender', 'Segundo o Ranking do Saneamento 2026, só 11 dos 100 municípios mais populosos do Brasil universalizaram água e esgoto.', 'Mostra o tamanho do desafio até 2033 e por que cada bairro atendido conta.', 'tratabrasil']
    ].map(([id, tema, eixo, texto, importa, fonte]) => ({id, tema, eixo, texto, importa, fonte})));
  }

  /** [id, tema, eixo, pergunta, [certa, errada, errada, errada], explicação, fonte] — a certa vem primeiro (ver posicao). */
  static get perguntas() {
    if (ConteudoSaneamentoCPT.memoQ) return ConteudoSaneamentoCPT.memoQ;
    return (ConteudoSaneamentoCPT.memoQ = [
      // ---------- Atendimento ao morador ----------
      ['Q066', 'atendimento', 'pratica', 'Um morador liga dizendo que o esgoto está voltando pelo ralo. O que é mais importante anotar primeiro?', ['Endereço completo, ponto de referência e telefone para retorno', 'O nome dos vizinhos que também reclamaram', 'A opinião dele sobre a empresa da obra', 'Só o bairro, para agilizar o registro'], 'Sem endereço exato e um contato, a Execução não localiza o problema e o caso não fecha.', 'equipe'],
      ['Q067', 'atendimento', 'pratica', 'Qual destes registros de reclamação ajuda mais a resolver o caso?', ['"Desde segunda, água suja sai da calçada em frente ao nº 120; uma idosa não consegue passar"', '"Morador muito bravo com a obra"', '"Problema de esgoto na rua"', '"Urgente!!! Resolver hoje"'], 'Registro útil diz o quê, onde, desde quando e quem é afetado, sem adjetivos.', 'equipe'],
      ['Q068', 'atendimento', 'pratica', 'O morador pede um prazo exato para o conserto, mas você não tem essa informação. O melhor é:', ['Registrar, dizer quem dará o retorno e combinar como avisá-lo', 'Dar um prazo curto para acalmar', 'Dizer que não é problema da sua equipe', 'Pedir que ele ligue de novo em outro dia'], 'Prazo que não depende de você vira nova reclamação. Registre e combine o retorno.', 'equipe'],
      ['Q069', 'atendimento', 'pratica', 'Fora do horário da equipe, para onde orientar um morador com vazamento de esgoto na rua?', ['Para a central da Sabesp, 0800 055 0195, que atende 24 horas', 'Para esperar a equipe no dia seguinte', 'Para o Corpo de Bombeiros', 'Para a Defesa Civil, em qualquer caso'], 'A central da Sabesp atende 24 h. Peça ao morador para anotar o protocolo.', 'sabespcanais'],
      ['Q070', 'atendimento', 'pratica', 'Uma moradora com deficiência auditiva precisa falar com a Sabesp. Qual canal indicar?', ['0800 016 0195, para pessoas com deficiência auditiva ou de fala', '0800 055 0195, só por voz', 'Ir pessoalmente à estação de tratamento', 'O telefone da prefeitura'], 'Há canal próprio, além da agência virtual e do chat.', 'sabespcanais'],
      ['Q071', 'atendimento', 'pratica', 'O que fazer com o número de protocolo que o morador recebeu da Sabesp?', ['Anotar no registro do atendimento, para acompanhar e cobrar o retorno', 'Descartar: ele só serve para a Sabesp', 'Pedir que o morador não repasse a ninguém', 'Abrir outro protocolo igual, por garantia'], 'O protocolo liga o caso da equipe ao da Sabesp e evita duplicidade.', 'equipe'],
      ['Q072', 'atendimento', 'pratica', 'Um morador mostra uma rachadura que apareceu na parede depois da obra. Qual a primeira atitude?', ['Registrar com fotos, endereço e data em que notou, e encaminhar para análise', 'Dizer que a obra não causou', 'Prometer que a empresa vai pagar o conserto', 'Esperar a engenharia passar para registrar'], 'Quem conclui a causa é a análise técnica. O papel da equipe é registrar bem e encaminhar.', 'equipe'],
      ['Q073', 'atendimento', 'pratica', 'Um morador chega muito irritado. O que ajuda mais no começo da conversa?', ['Ouvir até o fim e repetir o que entendeu', 'Explicar logo o cronograma da obra', 'Pedir que ele se acalme primeiro', 'Dizer que os vizinhos não reclamaram'], 'Mostrar que entendeu baixa a tensão e evita registrar o problema errado.', 'equipe'],
      ['Q074', 'atendimento', 'pratica', 'Em Santo André, boca de lobo entupida na rua é assunto de quem?', ['Do Semasa, que cuida da drenagem urbana', 'Da Sabesp, que cuida da água e do esgoto', 'Do morador da casa em frente', 'Da Cetesb'], 'Desde 2019 a Sabesp opera água e esgoto; o Semasa seguiu com drenagem, resíduos e gestão ambiental.', 'sabespsa'],
      ['Q075', 'atendimento', 'pratica', 'Esgoto saindo pela tampa de um poço de visita na rua deve ser comunicado a quem?', ['À Sabesp, responsável pela rede de esgoto', 'Ao Semasa, responsável pela drenagem', 'À Defesa Civil', 'Ao síndico do prédio mais próximo'], 'O poço de visita faz parte da rede de esgoto, operada pela Sabesp na cidade.', 'sabespsa'],
      ['Q076', 'atendimento', 'pratica', 'Entupimento no encanamento dentro do terreno, antes da caixa de inspeção, normalmente é responsabilidade de quem?', ['Do morador ou proprietário do imóvel', 'Da Sabesp', 'Da construtora da obra', 'Da prefeitura'], 'Em geral, a parte interna do imóvel é do morador; da caixa de inspeção para a rua, da Sabesp. Na dúvida, oriente a ligar na central.', 'equipe'],
      // ---------- Obra e comunidade ----------
      ['Q077', 'obra', 'pratica', 'Uma rua vai ser interditada para a obra. Quando o morador deve ser avisado?', ['Antes da interdição, com data, duração e um canal para dúvidas', 'No dia, quando as máquinas chegarem', 'Só se ele perguntar', 'Depois, no balanço da obra'], 'Comunicação prévia é parte do trabalho social e reduz conflito.', 'equipe'],
      ['Q078', 'obra', 'pratica', 'O que um bom aviso de obra precisa dizer?', ['O que vai acontecer, quando, por quanto tempo e a quem recorrer', 'Só o nome da empresa', 'Os detalhes técnicos da tubulação', 'O valor do contrato'], 'Com essas quatro respostas o morador se organiza e sabe onde perguntar.', 'equipe'],
      ['Q079', 'obra', 'pratica', 'A rede foi concluída na rua, mas o morador diz que nada mudou. Qual explicação é correta?', ['Obra concluída não é sistema operando: faltam ligações, testes e a conexão com os coletores', 'A rede nova não funciona', 'O benefício é só para os vizinhos', 'O esgoto já está tratado desde o primeiro dia'], 'Rede pronta é uma etapa; o benefício vem quando o sistema todo opera.', 'equipe'],
      ['Q080', 'obra', 'pratica', 'Como falar do benefício da obra sem prometer o que não depende da equipe?', ['"Quando o sistema estiver operando, o esgoto deixa de ir para o córrego; ainda há etapas"', '"Mês que vem o rio fica limpo"', '"Amanhã acaba o mau cheiro"', '"Não posso falar nada sobre isso"'], 'Benefício com condição é honesto; data que a equipe não controla vira cobrança.', 'equipe'],
      ['Q081', 'obra', 'pratica', 'Um morador diz: "essa obra só me trouxe poeira, não vejo benefício nenhum". Boa resposta inicial:', ['Reconhecer o incômodo e perguntar o que mais o afeta no dia a dia', 'Dizer que ele está enganado', 'Listar os números do contrato', 'Encerrar a conversa com educação'], 'Ouvir primeiro abre espaço para explicar depois, e às vezes revela um problema a resolver.', 'equipe'],
      ['Q082', 'obra', 'pratica', 'Qual informação NÃO deve ser passada ao morador como certa?', ['Data de fim de obra que ainda não foi confirmada', 'O canal de atendimento da Sabesp', 'O horário da frente de obra informado no aviso', 'Como registrar uma reclamação'], 'Data não confirmada vira promessa quebrada. Diga o que está confirmado e quando haverá novidade.', 'equipe'],
      ['Q083', 'obra', 'pratica', 'A calçada em frente a uma casa ficou sem passagem segura por causa da obra. O que fazer?', ['Registrar e acionar a frente de obra para garantir a passagem', 'Orientar o morador a pular a vala', 'Esperar o fim da obra', 'Tirar uma foto e seguir o roteiro'], 'Passagem segura é prioridade, sobretudo para idosos, crianças e pessoas com deficiência.', 'equipe'],
      ['Q084', 'obra', 'pratica', 'Por que a ligação do imóvel à rede de esgoto é tão importante?', ['Sem ela, o esgoto da casa continua indo para fossa ou córrego', 'Ela serve só para a cobrança', 'Ela substitui a caixa de gordura', 'Ela aumenta a pressão da água'], 'A rede só cumpre o papel quando as casas estão ligadas a ela.', 'lei11445'],
      ['Q085', 'obra', 'pratica', 'Uma família diz que não vai ligar a casa na rede porque "a fossa funciona". O melhor argumento:', ['A ligação leva o esgoto para tratamento, e a lei a exige onde há rede', 'A fossa é proibida em qualquer lugar', 'Sem a ligação a água é cortada no dia seguinte', 'A ligação só vale para quem tem escritura'], 'Lei 11.445, art. 45: onde a rede está disponível, a ligação é obrigatória. Use o argumento com calma e informação.', 'lei11445'],
      // ---------- Trabalho social ----------
      ['Q086', 'social', 'entender', 'Em obras de saneamento, o trabalho social acontece em quais fases?', ['Antes, durante e depois da obra', 'Só na inauguração', 'Só quando há reclamação', 'Só antes de a obra começar'], 'A Portaria MCID 75/2025 prevê pré-obra, obra e pós-obra.', 'portaria75'],
      ['Q087', 'social', 'pratica', 'Para que serve o diagnóstico participativo antes das ações?', ['Conhecer o território e o que a comunidade vive, para planejar com ela', 'Escolher fotos para o relatório', 'Substituir a comunicação da obra', 'Avaliar cada pessoa da equipe'], 'O trabalho social parte de estudos do território feitos com participação.', 'portaria75'],
      ['Q088', 'social', 'pratica', 'Qual destas é uma forma de acompanhamento socioambiental depois da obra?', ['Voltar ao bairro para ouvir se a mudança chegou e orientar sobre a ligação', 'Encerrar o contato com a comunidade', 'Divulgar só os números do contrato', 'Esperar novas reclamações'], 'O pós-obra avalia se a intervenção trouxe o resultado esperado.', 'portaria75'],
      ['Q089', 'social', 'entender', 'Mobilização, comunicação e participação social são:', ['Um dos eixos do trabalho social do Ministério das Cidades', 'Tarefas só da assessoria de imprensa', 'Etapas da estação de tratamento', 'Exigências só de obras de habitação'], 'Os outros eixos tratam da sustentabilidade da intervenção e de meio ambiente e saúde.', 'portaria75'],
      ['Q090', 'social', 'pratica', 'Numa reunião com moradores, qual atitude fortalece a participação?', ['Anotar as dúvidas e combinar quando e como virá a resposta', 'Falar a reunião inteira sem abrir para perguntas', 'Prometer tudo o que for pedido', 'Evitar anotar as críticas'], 'Participação de verdade tem escuta, registro e devolutiva.', 'equipe'],
      ['Q091', 'social', 'pratica', 'Ao convidar a comunidade para uma ação, o que aumenta a presença?', ['Convite com antecedência, em local conhecido e horário que combine com a rotina do bairro', 'Aviso no mesmo dia', 'Convite só por e-mail', 'Local distante, mas mais bonito'], 'Quem conhece a rotina do bairro escolhe a hora e o lugar em que as pessoas podem ir.', 'equipe'],
      ['Q092', 'social', 'pratica', 'Lideranças locais (associação, igreja, escola) ajudam o trabalho social porque:', ['Conhecem o bairro e têm a confiança dos moradores', 'Decidem a obra no lugar da Sabesp', 'Substituem o atendimento', 'Autorizam as ligações de esgoto'], 'Elas abrem portas e ajudam a informação chegar a quem precisa.', 'equipe'],
      ['Q093', 'social', 'pratica', 'Num relato de atividade, o que é mais útil para o relatório?', ['O que foi feito, com quem, quantas pessoas e o que a comunidade trouxe', 'Adjetivos como "maravilhosa" e "excelente"', 'Só a foto', 'O nome de quem faltou'], 'Fatos e números deixam o relato pronto para o relatório mensal.', 'equipe'],
      ['Q094', 'social', 'pratica', 'Ao fotografar uma ação com crianças, qual é o cuidado certo?', ['Ter autorização dos responsáveis e evitar rostos quando não houver', 'Fotografar tudo e pedir depois', 'Publicar com o nome completo das crianças', 'Nenhum cuidado extra, por ser ação pública'], 'Imagem de criança pede autorização e cuidado redobrado.', 'equipe'],
      // ---------- Esgoto ----------
      ['Q095', 'esgoto', 'pratica', 'Lenço umedecido vendido como "descartável", jogado no vaso sanitário:', ['Não se desfaz como papel e ajuda a entupir a rede', 'Se desfaz em poucos minutos', 'Ajuda a limpar a tubulação', 'Fica retido na caixa de gordura'], 'Lenço, fio dental e cotonete vão para o lixo; no esgoto, viram bolos que entopem a rede.', 'equipe'],
      ['Q096', 'esgoto', 'pratica', 'Antes de chegar à rede, a gordura da pia da cozinha deve passar por:', ['Caixa de gordura, limpa de tempos em tempos', 'Caixa d’água', 'Calha de chuva', 'Lugar nenhum: vai direto para a estação'], 'A caixa de gordura segura a gordura e evita entupimento e mau cheiro.', 'equipe'],
      ['Q097', 'esgoto', 'pratica', 'Um morador ligou a calha do telhado na rede de esgoto. Qual o problema?', ['Na chuva a rede enche, o esgoto pode voltar nas casas e transbordar na rua', 'Nenhum: a chuva lava a rede', 'Só aumenta a conta de água', 'A água da chuva estraga o asfalto'], 'Esgoto e chuva têm sistemas separados; a rede de esgoto não é feita para o volume da chuva.', 'lei11445'],
      ['Q098', 'esgoto', 'pratica', 'E o contrário: esgoto da casa ligado na galeria de água da chuva?', ['O esgoto vai sem tratamento para córregos e rios', 'O esgoto é tratado dentro da galeria', 'Não faz diferença', 'Melhora a drenagem da rua'], 'A galeria leva a chuva direto aos córregos: o esgoto ali não passa por tratamento.', 'lei11445'],
      ['Q099', 'esgoto', 'pratica', 'Retorno de esgoto em várias casas da mesma rua logo depois de chuva forte pode indicar:', ['Água de chuva entrando na rede de esgoto por ligações irregulares', 'Falta de água na região', 'Cloro demais na rede', 'Defeito no hidrômetro'], 'É um sinal comum de ligação irregular. Registre e encaminhe para a Sabesp verificar.', 'equipe'],
      ['Q019', 'descarte', 'pratica', 'Qual o jeito certo de descartar óleo de cozinha usado?', ['Frio, numa garrafa PET fechada, levado a um ponto de coleta', 'Na pia, com água quente e detergente', 'No vaso sanitário, com a descarga', 'No ralo do quintal'], 'No ponto de coleta, ele pode virar sabão ou biodiesel.', 'oleo'],
      ['Q062', 'esgoto', 'pratica', 'Por que o óleo de cozinha na pia é um problema para o esgoto?', ['Gruda nos canos, entope e faz o esgoto voltar', 'Corrói a caixa d’água', 'Evapora e deixa cheiro de gás', 'Aumenta o consumo de água da casa'], 'Com o tempo, o óleo endurece nas tubulações e forma entupimentos.', 'oleo'],
      // ---------- Água no dia a dia ----------
      ['Q051', 'aguas', 'pratica', 'Estimativa divulgada pela Sabesp: banho de 15 minutos com o registro meio aberto pode gastar cerca de:', ['135 litros', '15 litros', '40 litros', '600 litros'], 'É estimativa: muda com o chuveiro e a pressão. Em 5 minutos, cerca de 45 litros.', 'economia'],
      ['Q052', 'aguas', 'pratica', 'Estimativa divulgada pela Sabesp: quanto uma torneira pingando pode desperdiçar por dia?', ['Cerca de 46 litros', 'Menos de 1 litro', 'Cerca de 5 mil litros', 'Cerca de 500 litros'], 'Depende do ritmo das gotas; trocar a vedação costuma resolver.', 'economia'],
      ['Q053', 'aguas', 'pratica', 'Ao escovar os dentes, qual hábito economiza mais água?', ['Fechar a torneira enquanto escova', 'Deixar a torneira aberta num fio fino', 'Usar água morna', 'Escovar mais rápido com a torneira aberta'], 'Estimativa da Sabesp: cerca de 12 litros com a torneira aberta e meio litro fechando.', 'economia'],
      ['Q050', 'aguas', 'pratica', 'Como o morador confere se há um vazamento escondido em casa?', ['Fecha todas as torneiras e vê se o hidrômetro continua girando', 'Olha a cor da água da torneira', 'Mede a temperatura da água', 'Liga o chuveiro no máximo'], 'Com tudo fechado, o hidrômetro parado indica que não há vazamento.', 'equipe'],
      ['Q100', 'aguas', 'pratica', 'Caixa d’água destampada é um risco porque:', ['Vira criadouro do Aedes e a água pode ser contaminada', 'Esquenta demais a água', 'Aumenta a pressão nas torneiras', 'Gasta mais energia'], 'Caixa tampada protege a água tratada e evita o mosquito.', 'dengue'],
      ['Q101', 'aguas', 'pratica', 'Qual é a orientação mais comum para limpar a caixa d’água?', ['A cada 6 meses', 'A cada 5 anos', 'Só quando a água ficar marrom', 'Nunca, se tiver tampa'], 'Mesmo tampada, ela acumula sujeira no fundo com o tempo.', 'equipe'],
      ['Q049', 'aguas', 'entender', 'Segundo a ONU, quanto de água por pessoa por dia é preciso para beber, cozinhar e a higiene básica?', ['Entre 50 e 100 litros', 'Entre 5 e 10 litros', 'Entre 500 e 1.000 litros', 'Cerca de 2 litros'], 'É a referência usada no reconhecimento da água como direito humano.', 'onuagua'],
      // ---------- Descarte correto ----------
      ['Q020', 'descarte', 'pratica', 'Onde descartar remédio vencido ou que sobrou?', ['Num ponto de coleta habilitado, como uma farmácia participante', 'No vaso sanitário', 'Na pia', 'No saco de recicláveis'], 'O Decreto 10.388/2020 criou a coleta de medicamentos domiciliares e embalagens.', 'decreto10388'],
      ['Q102', 'descarte', 'pratica', 'Pilhas e baterias usadas devem ir para:', ['Pontos de coleta específicos (logística reversa)', 'O lixo orgânico', 'O vaso sanitário', 'O saco de recicláveis comuns'], 'A PNRS prevê retorno de pilhas e baterias a quem fabrica e vende.', 'pnrs'],
      ['Q103', 'descarte', 'pratica', 'Lâmpada fluorescente queimada deve:', ['Voltar por logística reversa, num ponto de coleta', 'Ir quebrada no lixo comum', 'Ir junto com o vidro reciclável', 'Ser enterrada no quintal'], 'Ela tem mercúrio; por isso a PNRS a inclui na logística reversa.', 'pnrs'],
      ['Q104', 'descarte', 'pratica', 'Entulho e móveis velhos largados na calçada ou no córrego:', ['Viram abrigo de rato e escorpião e entopem a drenagem', 'São recolhidos pela Sabesp', 'Não causam problema', 'Ajudam a segurar a terra da margem'], 'Oriente o morador a usar o serviço de entulho e volumosos da prefeitura.', 'equipe'],
      ['Q105', 'descarte', 'pratica', 'Qual a melhor forma de separar o lixo em casa para a coleta seletiva?', ['Recicláveis limpos e secos separados do orgânico e do rejeito', 'Tudo junto, porque a triagem separa', 'Separar só o vidro', 'Lavar também o lixo orgânico'], 'Separação simples na origem é a que mais ajuda a triagem.', 'equipe'],
      ['Q106', 'descarte', 'pratica', 'Seringas e agulhas usadas em casa (de insulina, por exemplo):', ['Em recipiente rígido fechado, entregue na unidade de saúde ou ponto indicado', 'No saco de recicláveis', 'No vaso sanitário', 'Soltas no lixo comum'], 'Evita acidentes com quem coleta e separa o lixo.', 'equipe'],
      ['Q107', 'descarte', 'curiosidade', 'O óleo de cozinha entregue num ponto de coleta pode virar:', ['Sabão ou biodiesel', 'Água potável', 'Adubo, jogado direto na terra', 'Gás de cozinha'], 'Por que importa: o resíduo vira produto e deixa de poluir a água.', 'oleo'],
      ['Q007', 'residuos', 'entender', 'Pela Política Nacional de Resíduos Sólidos, o que vem PRIMEIRO na ordem de prioridade?', ['Não gerar', 'Reciclar', 'Tratar', 'Dispor em aterro'], 'A ordem é: não gerar, reduzir, reutilizar, reciclar, tratar e dispor o rejeito.', 'pnrs'],
      // ---------- Saúde ----------
      ['Q042', 'saude', 'pratica', 'Como se pega leptospirose numa enchente?', ['Contato com água ou lama contaminadas por urina de ratos, sobretudo com feridas na pele', 'Picada de mosquito', 'Pelo ar, perto de quem está doente', 'Bebendo água tratada da torneira'], 'Também por muito tempo dentro da água ou pelas mucosas. Evite a água e a lama da enchente.', 'leptospirose'],
      ['Q108', 'saude', 'pratica', 'Depois de uma enchente, qual cuidado na limpeza da casa?', ['Usar luvas e botas de borracha e desinfetar com água sanitária', 'Limpar descalço para não escorregar', 'Só varrer a lama quando secar', 'Deixar a lama secar por semanas'], 'A lama da enchente pode estar contaminada; proteção e desinfecção previnem doenças.', 'leptospirose'],
      ['Q045', 'saude', 'pratica', 'Qual atitude mais previne a dengue em casa?', ['Eliminar água parada e esfregar as bordas dos recipientes', 'Deixar a caixa d’água aberta para ventilar', 'Usar repelente e manter os vasos com água', 'Trocar a água dos vasos uma vez por mês'], 'Os ovos ficam grudados nas paredes dos recipientes e resistem ao seco.', 'dengue'],
      ['Q063', 'saude', 'curiosidade', 'Segundo o IOC/Fiocruz, quanto tempo depois de postos os ovos do Aedes já resistem à seca?', ['Cerca de 15 horas', 'Cerca de 15 minutos', 'Cerca de 15 dias', 'Cerca de 15 semanas'], 'Por que importa: é rápido, por isso eliminar criadouros precisa ser rotina semanal.', 'ioc'],
      ['Q043', 'saude', 'entender', 'A hepatite A passa principalmente por:', ['Água e alimentos contaminados', 'Picada de inseto', 'Exposição ao sol', 'Tosse e espirro'], 'É transmitida pela via fecal-oral; saneamento e higiene previnem.', 'hepatite'],
      ['Q048', 'saude', 'pratica', 'O que ajuda a prevenir a hepatite A?', ['Água tratada, saneamento, mãos lavadas e vacina', 'Protetor solar', 'Tomar sol pela manhã', 'Água de poço sem tratamento'], 'Saneamento e higiene cortam o caminho do vírus; a vacina protege.', 'hepatite'],
      ['Q047', 'saude', 'entender', 'Qual destas doenças NÃO está ligada à água contaminada ou à falta de saneamento?', ['Sarampo', 'Cólera', 'Esquistossomose', 'Hepatite A'], 'O sarampo passa pelo ar; as outras se ligam à água e ao esgoto.', 'doencas'],
      ['Q109', 'saude', 'pratica', 'Por que lavar as mãos depois de usar o banheiro reduz doenças?', ['Corta o caminho dos micróbios das fezes para a boca e os alimentos', 'Deixa a pele mais hidratada', 'Evita picadas de mosquito', 'Substitui a vacina'], 'É a mesma lógica do saneamento, em escala de casa.', 'hepatite'],
      ['Q041', 'saude', 'pratica', 'Criança brincando num córrego que recebe esgoto corre risco de:', ['Diarreias, hepatite A e outras doenças', 'Só um resfriado', 'Nenhum, se a água estiver correndo', 'Só alergia de pele'], 'Água com esgoto transmite várias doenças; oriente a evitar o contato.', 'doencas'],
      // ---------- Segurança ----------
      ['Q110', 'seguranca', 'pratica', 'Ao visitar uma frente de obra, o que fazer primeiro?', ['Se apresentar ao responsável e usar o EPI exigido no local', 'Entrar direto para tirar fotos', 'Atravessar a vala pelo caminho mais curto', 'Ficar perto das máquinas para ouvir melhor'], 'O responsável conhece os riscos do dia e indica por onde circular.', 'equipe'],
      ['Q111', 'seguranca', 'pratica', 'Um morador quer espiar dentro de uma vala aberta. O que orientar?', ['Manter distância e passar só pelos caminhos sinalizados', 'Pode chegar perto se for de dia', 'Pode descer se for rápido', 'Pode, se a máquina estiver desligada'], 'Vala pode desmoronar; a sinalização existe para isso.', 'equipe'],
      ['Q112', 'seguranca', 'pratica', 'Poço de visita da rede de esgoto é espaço confinado. Isso quer dizer que:', ['Só entra trabalhador treinado, com medição de gases e equipamento', 'Qualquer pessoa pode entrar para olhar', 'É seguro se a tampa ficar aberta 5 minutos', 'Só é perigoso quando chove'], 'Pode ter gases tóxicos e falta de oxigênio. Ninguém da equipe socioambiental entra.', 'equipe'],
      ['Q113', 'seguranca', 'pratica', 'Você viu uma situação de risco na obra, como vala sem proteção. O que fazer?', ['Avisar na hora o responsável da frente e registrar', 'Comentar só no fim do dia', 'Postar nas redes sociais', 'Ignorar, porque não é da sua área'], 'Avisar rápido evita acidentes; registrar deixa o histórico.', 'equipe'],
      ['Q060', 'seguranca', 'curiosidade', 'Por que abril é o Abril Verde?', ['Por causa do 28 de abril, Dia Mundial da Segurança e Saúde no Trabalho', 'Por causa do Dia da Árvore', 'Por causa do Dia Mundial da Água', 'Por ser o mês de plantio'], 'Por que importa: é a data para lembrar que ninguém deve se ferir trabalhando.', 'abrilverde'],
      // ---------- Chuva e drenagem ----------
      ['Q114', 'drenagem', 'entender', 'Bocas de lobo e galerias de águas pluviais servem para:', ['Escoar a água da chuva', 'Levar o esgoto das casas', 'Abastecer as caixas d’água', 'Tratar a água do rio'], 'Drenagem e esgoto são serviços diferentes do saneamento.', 'lei11445'],
      ['Q115', 'drenagem', 'pratica', 'Lixo jogado na rua num dia de chuva:', ['Entope bocas de lobo e chega aos córregos e rios', 'É recolhido pela estação de esgoto', 'Some com a enxurrada', 'Ajuda a segurar a água'], 'Muita enchente começa com boca de lobo entupida.', 'equipe'],
      ['Q116', 'drenagem', 'entender', 'Por que a rede de esgoto e a drenagem precisam ser separadas?', ['São sistemas diferentes: misturar sobrecarrega a rede na chuva e polui os córregos', 'É só exigência de papel', 'Porque a drenagem trata o esgoto', 'Porque a rede de esgoto aguenta qualquer volume'], 'A lei define esgotamento e drenagem como serviços distintos.', 'lei11445'],
      ['Q117', 'drenagem', 'pratica', 'Quintal todo cimentado, com a calha jogando tudo na rua:', ['Aumenta a enxurrada; terra e plantas ajudam a água a infiltrar', 'Não faz diferença na chuva', 'Diminui as enchentes', 'Melhora o tratamento de esgoto'], 'Cada pedaço de chão que absorve água alivia a drenagem da rua.', 'equipe'],
      // ---------- Nosso território ----------
      ['Q022', 'territorio', 'curiosidade', 'Onde nasce o Rio Tamanduateí?', ['No Parque da Gruta de Santa Luzia, em Mauá', 'Em Paranapiacaba', 'Na Represa Billings', 'No Parque do Pedroso'], 'Por que importa: ele cruza Santo André e recebe o que os córregos da cidade levam.', 'tamanduatei'],
      ['Q027', 'territorio', 'entender', 'Quanto do território de Santo André está em área de proteção aos mananciais?', ['Cerca de 55%', 'Cerca de 10%', 'Cerca de 25%', 'Cerca de 90%'], 'Grande parte rumo a Paranapiacaba e à Billings: cuidar dela é cuidar da água.', 'semasa25'],
      ['Q028', 'territorio', 'curiosidade', 'Qual rio é o principal formador da Represa Billings?', ['Rio Grande', 'Rio Tamanduateí', 'Rio Pinheiros', 'Rio Tietê'], 'Por que importa: ele nasce na região de Paranapiacaba, em Santo André.', 'billings'],
      ['Q029', 'territorio', 'curiosidade', 'Desde quando a Sabesp opera a água e o esgoto de Santo André?', ['Setembro de 2019', 'Janeiro de 2009', 'Março de 2015', 'Dezembro de 2023'], 'Contrato assinado em julho de 2019; operação desde 11/09/2019; 40 anos previstos no contrato.', 'sabespsa'],
      ['Q030', 'territorio', 'pratica', 'Depois de 2019, o que o Semasa continuou fazendo em Santo André?', ['Gestão ambiental, drenagem urbana e resíduos sólidos', 'Tratamento de esgoto', 'Abastecimento de água', 'Cobrança da conta de água'], 'Saber quem faz o quê ajuda a encaminhar o morador ao lugar certo.', 'sabespsa'],
      ['Q118', 'territorio', 'entender', 'Por que proteger os mananciais importa até para quem mora longe deles?', ['Deles vem a água que, tratada, abastece a região', 'Só importam para quem mora ao lado', 'Servem apenas para lazer', 'Recebem o esgoto tratado de todas as casas'], 'Manancial poluído encarece e dificulta o tratamento da água.', 'semasa25'],
      // ---------- Resíduos ----------
      ['Q017', 'residuos', 'curiosidade', 'Quanto das latas de alumínio de bebidas o Brasil reciclou em 2024?', ['Cerca de 97%', 'Cerca de 30%', 'Cerca de 55%', 'Cerca de 75%'], 'Por que importa: foram 97,3%, mostrando que coleta organizada funciona.', 'reciclalatas'],
      ['Q119', 'residuos', 'entender', 'Por que a reciclagem de latas funciona tão bem no Brasil?', ['O alumínio tem valor, e há coleta e indústria para reciclar', 'É obrigatória para cada morador', 'A lata é biodegradável', 'Não existe lata descartável'], 'Valor de mercado e logística fazem a lata voltar rápido para a indústria.', 'reciclalatas'],
      ['Q120', 'residuos', 'pratica', 'Uma embalagem com restos de comida no saco de recicláveis:', ['Pode sujar outros materiais e ser descartada na triagem', 'É limpa sozinha na reciclagem', 'Vale mais na venda', 'Vira adubo junto'], 'Uma passada de água resolve e salva o resto do saco.', 'equipe'],
      ['Q121', 'residuos', 'entender', 'As cores das lixeiras (azul, vermelho, verde, amarelo) servem para:', ['Padronizar a separação de papel, plástico, vidro e metal', 'Indicar o dia da coleta', 'Mostrar o bairro de origem', 'Separar o lixo por peso'], 'É a Resolução Conama 275/2001. Em casa, o essencial é separar seco de úmido.', 'conama275'],
      ['Q122', 'residuos', 'pratica', 'Cascas de frutas e restos de verduras podem virar:', ['Adubo, pela compostagem', 'Plástico reciclado', 'Água de reuso', 'Vidro'], 'A compostagem é uma forma de tratar o resíduo orgânico prevista na PNRS.', 'pnrs'],
      ['Q123', 'residuos', 'pratica', 'Numa ação de limpeza de um ponto de descarte irregular, o que faz o resultado durar?', ['Conversar com quem descarta ali e indicar o destino certo', 'Só retirar o lixo e ir embora', 'Colocar uma placa de proibido e nada mais', 'Fazer a limpeza à noite'], 'Sem mudar o hábito e oferecer alternativa, o ponto volta a encher.', 'equipe'],
      // ---------- Tratamento ----------
      ['Q032', 'tratamento', 'entender', 'Qual costuma ser a PRIMEIRA etapa numa estação de tratamento de esgoto?', ['Gradeamento', 'Lodo ativado', 'Desinfecção', 'Decantação secundária'], 'As grades retêm objetos grandes antes das outras etapas.', 'esgoto'],
      ['Q033', 'tratamento', 'entender', 'No lodo ativado, quem faz o trabalho de limpar o esgoto?', ['Micro-organismos que usam oxigênio', 'Produtos de limpeza', 'Filtros de areia', 'Plantas aquáticas'], 'Bactérias aeróbias consomem a matéria orgânica.', 'esgoto'],
      ['Q035', 'tratamento', 'entender', 'No tratamento de água, o que acontece na floculação?', ['A sujeira se junta em flocos', 'A água é aquecida', 'A água recebe flúor', 'A água é bombeada para as casas'], 'Na mistura lenta, as partículas se agrupam em flocos que depois assentam.', 'etapasagua'],
      ['Q037', 'tratamento', 'entender', 'Quais materiais podem compor os filtros de uma estação de tratamento de água?', ['Camadas como areia, cascalho e carvão antracito', 'Algodão e papel', 'Só telas de plástico', 'Sal e cal'], 'O arranjo varia de estação para estação; as camadas retêm a sujeira que sobrou.', 'etapasagua'],
      ['Q038', 'tratamento', 'entender', 'Por que se coloca flúor na água tratada?', ['Para ajudar a prevenir cáries', 'Para dar cor à água', 'Para tirar o cheiro', 'Para economizar energia'], 'A fluoretação é uma medida de saúde bucal.', 'tratagua'],
      ['Q039', 'tratamento', 'entender', 'Qual é o objetivo da desinfecção na estação de água?', ['Inativar micro-organismos que causam doenças', 'Deixar a água mais gelada', 'Tirar a areia', 'Juntar a sujeira em flocos'], 'Em geral é feita com cloro, que também protege a água no caminho até as casas.', 'tratagua'],
      ['Q124', 'tratamento', 'entender', 'Entre coletar, afastar e tratar o esgoto, qual etapa tira a poluição antes de devolver a água ao rio?', ['Tratar', 'Coletar', 'Afastar', 'Ligar o imóvel'], 'Coletar e afastar levam o esgoto embora; só o tratamento remove a poluição.', 'lei11445'],
      ['Q125', 'tratamento', 'entender', 'O que é o "afastamento" do esgoto?', ['Levar o esgoto coletado, por coletores e interceptores, até o tratamento', 'Desligar a casa da rede', 'Tratar o esgoto dentro de casa', 'Separar o lixo reciclável'], 'A lei fala em coleta, transporte, tratamento e disposição final.', 'lei11445'],
      ['Q126', 'tratamento', 'entender', 'Rede coletora pronta, mas ainda não conectada a um coletor tronco. Nesse período, o esgoto:', ['Ainda pode acabar no córrego até o sistema ser conectado', 'Já está tratado', 'Fica parado na rede para sempre', 'Volta para a caixa d’água'], 'Por isso o benefício completo depende do sistema inteiro, não de um trecho.', 'equipe'],
      // ---------- Leis e metas ----------
      ['Q001', 'leis', 'entender', 'Qual Objetivo de Desenvolvimento Sustentável da ONU trata de água potável e saneamento?', ['ODS 6', 'ODS 3', 'ODS 11', 'ODS 14'], 'O ODS 6 trata de assegurar água e saneamento para todas e todos.', 'ods6'],
      ['Q002', 'leis', 'entender', 'Pelo marco legal do saneamento, qual é a meta até o fim de 2033?', ['99% com água potável e 90% com coleta e tratamento de esgoto', '100% com água e esgoto até 2025', '50% com esgoto tratado', 'Só ampliar a rede de água'], 'A Lei 14.026/2020 fixou as metas para 31/12/2033.', 'marco'],
      ['Q127', 'leis', 'entender', 'Pela Lei 11.445, o saneamento básico reúne:', ['Água, esgoto, limpeza urbana e resíduos, e drenagem da chuva', 'Só água e esgoto', 'Água, energia e gás', 'Só esgoto e coleta de lixo'], 'São quatro serviços, com responsáveis que podem ser diferentes na mesma cidade.', 'lei11445'],
      ['Q128', 'leis', 'entender', 'Em 2010, a Assembleia Geral da ONU reconheceu a água e o saneamento como:', ['Direitos humanos', 'Bens de luxo', 'Serviços opcionais', 'Responsabilidade só de cada família'], 'O reconhecimento reforça que ninguém pode ficar para trás.', 'onuagua'],
      ['Q058', 'leis', 'curiosidade', 'Segundo o Ranking do Saneamento 2026, cerca de quantos brasileiros não têm coleta de esgoto?', ['Cerca de 90 milhões (43,3%)', 'Cerca de 9 milhões (4%)', 'Cerca de 30 milhões (14%)', 'Cerca de 180 milhões (85%)'], 'Por que importa: quase metade do país ainda espera o que a obra leva ao bairro.', 'tratabrasil'],
      ['Q059', 'leis', 'curiosidade', 'Segundo o mesmo ranking, quantos brasileiros ainda não têm água potável?', ['Mais de 30 milhões', 'Menos de 1 milhão', 'Cerca de 100 milhões', 'Cerca de 150 milhões'], 'Por que importa: água tratada na torneira ainda não é realidade para todos.', 'tratabrasil'],
      ['Q057', 'leis', 'curiosidade', 'Segundo OMS e UNICEF (2025), quantas pessoas no mundo não tinham saneamento gerido com segurança em 2024?', ['Cerca de 3,4 bilhões', 'Cerca de 34 milhões', 'Cerca de 340 milhões', 'Cerca de 7 bilhões'], 'Por que importa: é quase metade da humanidade, e 354 milhões ainda fazem as necessidades a céu aberto.', 'jmp'],
      // ---------- Fatos curiosos ----------
      ['Q055', 'aguas', 'curiosidade', 'O Dia Mundial da Água (22 de março) foi proposto em qual conferência da ONU?', ['Rio-92', 'Estocolmo-72', 'Kyoto-97', 'Paris-2015'], 'Por que importa: o Brasil sediou o encontro que pôs a água na agenda mundial.', 'diaagua'],
      ['Q018', 'descarte', 'curiosidade', 'Segundo estimativa divulgada pela Sabesp, 1 litro de óleo de cozinha pode poluir até quantos litros de água?', ['Até 25 mil litros', 'Até 25 litros', 'Até 250 litros', 'Até 2,5 milhões de litros'], 'Por que importa: um gesto pequeno na pia tem efeito grande na água.', 'oleo'],
      ['Q129', 'esgoto', 'curiosidade', 'Entre 2015 e 2024, a parcela da população mundial com saneamento gerido com segurança foi de 48% para:', ['58%', '28%', '68%', '98%'], 'Por que importa: 1,2 bilhão de pessoas ganhou acesso; dá para avançar.', 'jmp']
    ].map(([id, tema, eixo, pergunta, alternativas, explica, fonte]) => {
      const certa = ConteudoSaneamentoCPT.posicao(id), opcoes = alternativas.slice(1); opcoes.splice(certa, 0, alternativas[0]);
      return {id, tema, eixo, pergunta, opcoes, certa, explica, fonte};
    }));
  }
  /** Lugar da certa (0 a 3): sorteio fixo pelo ID. */
  static posicao(id) { return ConteudoSaneamentoCPT.hash('posicao:' + id) % 4; }

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

  static fonte(id) { const f = ConteudoSaneamentoCPT.fontes[id]; return f ? {nome: f[0], url: f[1], equipe: id === 'equipe'} : null; }
  static item(id) { return ConteudoSaneamentoCPT.pergunta(id) || ConteudoSaneamentoCPT.curiosidades.find(c => c.id === id) || null; }
  /** Decisões da revisão (uma leitura por pedido). */
  static decisoes(ctx) { return ctx.decisoesConteudoCPT || (ctx.decisoesConteudoCPT = RevisaoConteudoCPT.decisoes(ctx)); }
  /** 'aprovado', 'suspenso' ou 'pendente'. */
  static situacao(ctx, id) { const d = ConteudoSaneamentoCPT.decisoes(ctx)[id]; return d ? d.situacao : 'pendente'; }
  /** Suspenso some para todos; pendente só o proprietário vê (com a marca); aprovado, todos. */
  static disponivel(ctx, id) { const s = ConteudoSaneamentoCPT.situacao(ctx, id); return s === 'aprovado' || (s === 'pendente' && ConteudoSaneamentoCPT.proprietario(ctx.perfil)); }
  static visiveis(lista, ctx) { return lista.filter(x => ConteudoSaneamentoCPT.disponivel(ctx, x.id)); }
  static revisar(ctx, x) { return ConteudoSaneamentoCPT.proprietario(ctx.perfil) && ConteudoSaneamentoCPT.situacao(ctx, x.id) !== 'aprovado'; }
  /** Número estável de um texto (FNV-1a): a mesma pessoa no mesmo dia recebe sempre o mesmo sorteio. */
  static hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  static embaralhar(lista, semente) { return lista.map(x => [ConteudoSaneamentoCPT.hash(semente + ':' + x.id), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]); }
  static publica(c, ctx) {
    const T = ConteudoSaneamentoCPT;
    return {id: c.id, tema: T.temas[c.tema], eixo: T.eixos[c.eixo], texto: c.texto, importa: c.importa, fonte: T.fonte(c.fonte), revisar: T.revisar(ctx, c)};
  }

  /** Curiosidade do dia para a pessoa (muda a cada dia; vazio se nada visível). */
  static curiosidadeDoDia(ctx, email, dia) {
    const lista = ConteudoSaneamentoCPT.visiveis(ConteudoSaneamentoCPT.curiosidades, ctx); if (!lista.length) return null;
    return ConteudoSaneamentoCPT.publica(ConteudoSaneamentoCPT.embaralhar(lista, email + ':' + dia)[0], ctx);
  }
  /** Campanha do mês e datas do saneamento do mês (dia = AAAA-MM-DD). */
  static doMes(ctx, dia) {
    const T = ConteudoSaneamentoCPT, mes = Number(dia.slice(5, 7)), [nome, tema] = T.campanhas[mes - 1];
    const datas = T.datas.filter(d => d[0] === mes).map(([, d, titulo, cid]) => { const c = T.curiosidades.find(x => x.id === cid); return c && T.disponivel(ctx, cid) ? {dia: d, titulo, texto: c.texto, fonte: T.fonte(c.fonte)} : null; }).filter(Boolean);
    return {campanha: nome, tema, datas};
  }
  /** Pergunta sem a resposta (o que vai para a tela antes de responder). */
  static semResposta(q, ctx) { const T = ConteudoSaneamentoCPT; return {id: q.id, tema: T.temas[q.tema], eixo: T.eixos[q.eixo], pergunta: q.pergunta, opcoes: q.opcoes, revisar: T.revisar(ctx, q)}; }
  static pergunta(id) {
    const T = ConteudoSaneamentoCPT; if (!T.memoMapaQ) T.memoMapaQ = new Map(T.perguntas.map(q => [q.id, q]));
    return T.memoMapaQ.get(id) || null;
  }
}
