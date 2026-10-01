/**

 * PROCEDIMENTOS DE CAMPO 3.0: VISTORIAS CAUTELARES

 *

 * Fonte exclusiva: Base Consolidada, sem filtro obrigatório de validação.

 * Cria o painel "Vistorias Cautelares" e a "Ficha da Cautelar".

 * A aba vinculada ao Google Forms não é alterada.

 *

 * O script não utiliza fórmulas. Portanto, não depende dos separadores

 * regionais da planilha.

 */

const CONFIG_CAUTELAR = {

  ABA_CONSOLIDADA: 'Base Consolidada',

  ABA_BASE: 'Vistorias Cautelares',

  ABA_FICHA: 'Ficha da Cautelar',

  CABECALHO_PROCEDIMENTO: 'Selecione o procedimento a ser executado',

  PROCEDIMENTOS_ACEITOS: [

    'Acompanhamento de Vistoria Cautelar',

    'Acompanhamento de Cautelar',

    'Vistoria Cautelar'

  ],

  CABECALHO_ID_MIGRACAO: 'ID de migração',

  CABECALHO_VALIDACAO: 'Validação',

  ABAS_CAUTELAR: ['Vistorias Cautelares', 'Ficha da Cautelar'],

  PRIMEIRA_LINHA_DADOS: 12

};



const CABECALHOS_CAUTELAR = [

  'ID da cautelar',

  'ID consolidado',

  'Data da vistoria',

  'Data e hora do registro',

  'Bairro',

  'Endereço',

  'Ponto de referência',

  'Status da visita',

  'Tipo de vistoria',

  'Situação registrada',

  'Morador presente',

  'Permissão de entrada',

  'Tipo de contato',

  'Pesquisa completa aplicada',

  'Momento da pesquisa',

  'Vínculo com pré-obra',

  'Nome do munícipe',

  'Telefone',

  'Nota sobre a chegada da obra',

  'Síntese do momento da pesquisa',

  'Satisfação com saneamento',

  'Aspectos ou depoimento sobre saneamento',

  'Mudança na qualidade de vida',

  'Nota de melhoria na qualidade de vida',

  'Nota do atendimento recebido',

  'Informações claras',

  'Interesse em contato posterior',

  'Interesse em grupo de comunicação',

  'Grau de atenção original',

  'Indicador visual de atenção',

  'Vulnerabilidades e características',

  'Comentário da cautelar',

  'Registro fotográfico',

  'Responsável técnico',

  'Responsável pelo registro',

  'Área responsável',

  'Observação final'

];



function instalarSistemaCautelares() {

  removerGatilhosCautelares_(false);

  const arquivo = SpreadsheetApp.getActiveSpreadsheet();



  ScriptApp.newTrigger('aoAbrirCautelares')

    .forSpreadsheet(arquivo)

    .onOpen()

    .create();



  if (typeof aoEnviarFormularioIntegracaoProcedimentos !== 'function') {

    ScriptApp.newTrigger('aoEnviarFormularioCautelares')

      .forSpreadsheet(arquivo)

      .onFormSubmit()

      .create();

  }



  atualizarVistoriasCautelares();

  criarMenuCautelares_();

  avisarCautelar_(

    'Sistema instalado. As cautelares serão lidas da Base Consolidada.',

    'Vistorias Cautelares'

  );

}



function aoAbrirCautelares(e) {

  criarMenuCautelares_();

}



function criarMenuCautelares_() {

  try {

    SpreadsheetApp.getUi()

      .createMenu('Cautelares')

      .addItem('Atualizar cautelares pelo consolidado', 'atualizarVistoriasCautelares')

      .addItem('Gerar ficha da linha selecionada', 'gerarFichaCautelarDaLinhaSelecionada')

      .addItem('Gerar ficha da cautelar mais recente', 'gerarFichaCautelarMaisRecente')

      .addSeparator()

      .addItem('Ocultar páginas de cautelares', 'ocultarPaginasCautelares')

      .addItem('Mostrar páginas de cautelares', 'mostrarPaginasCautelares')

      .addSeparator()

      .addItem('Instalar ou renovar automação', 'instalarSistemaCautelares')

      .addItem('Remover automação', 'removerAutomacaoCautelares')

      .addToUi();

    return true;

  } catch (erro) {

    return false;

  }

}



function atualizarVistoriasCautelares(opcoes) {

  opcoes = opcoes || {};

  if (!opcoes.baseJaSincronizada && typeof sincronizarBaseConsolidada1e3 === 'function') {

    sincronizarBaseConsolidada1e3({origem: 'cautelares'});

  }



  const bloqueio = LockService.getDocumentLock();

  bloqueio.waitLock(30000);



  try {

    const arquivo = SpreadsheetApp.getActiveSpreadsheet();

    const consolidada = arquivo.getSheetByName(CONFIG_CAUTELAR.ABA_CONSOLIDADA);

    if (!consolidada) {

      throw new Error('A aba "' + CONFIG_CAUTELAR.ABA_CONSOLIDADA + '" não foi encontrada.');

    }



    const dados = consolidada.getDataRange().getValues();

    if (!dados.length) throw new Error('A Base Consolidada está vazia.');



    const mapa = montarMapaCabecalhosCautelar_(dados[0]);

    validarCabecalhosCautelar_(mapa);

    const indiceValidacao = primeiroIndiceCautelar_(

      mapa,

      CONFIG_CAUTELAR.CABECALHO_VALIDACAO

    );

    const indiceIdMigracao = primeiroIndiceCautelar_(

      mapa,

      CONFIG_CAUTELAR.CABECALHO_ID_MIGRACAO

    );

    const registros = [];

    const chavesVistas = {};



    for (let i = 1; i < dados.length; i++) {

      const linha = dados[i];

      if (indiceValidacao >= 0 &&

          !validacaoConsolidadaCautelarAceita_(linha[indiceValidacao])) continue;



      const procedimento = pegarCampoCautelar_(linha, mapa, [

        CONFIG_CAUTELAR.CABECALHO_PROCEDIMENTO,

        'Qual procedimento será realizado:'

      ]);

      if (!procedimentoCautelarAceito_(procedimento)) continue;



      const chave = construirChaveRegistroCautelar_(linha, mapa);

      if (chavesVistas[chave]) continue;

      chavesVistas[chave] = true;



      const idConsolidado = indiceIdMigracao === -1 ? '' : linha[indiceIdMigracao];

      registros.push(construirRegistroCautelar_(

        linha,

        mapa,

        construirIdCautelar_(idConsolidado, i + 1),

        idConsolidado

      ));

    }



    registros.sort(compararCautelaresPorData_);

    let base = arquivo.getSheetByName(CONFIG_CAUTELAR.ABA_BASE);

    if (!base) {

      base = arquivo.insertSheet(CONFIG_CAUTELAR.ABA_BASE);

      base.setTabColor('#6B4E8A');

    }



    prepararAbaBaseCautelar_(base, registros.length);

    escreverBaseCautelar_(base, registros);

    formatarBaseCautelar_(base, registros);



    const fichaExistente = arquivo.getSheetByName(CONFIG_CAUTELAR.ABA_FICHA);

    const manterFichaOculta = fichaExistente && fichaExistente.isSheetHidden();

    if (registros.length) {

      gerarFichaCautelar_(

        registros[registros.length - 1],

        Boolean(opcoes.silencioso) || Boolean(manterFichaOculta)

      );

    } else {

      gerarFichaCautelarVazia_(Boolean(opcoes.silencioso) || Boolean(manterFichaOculta));

    }



    if (!opcoes.silencioso) {

      arquivo.toast(

        registros.length + ' vistoria(s) cautelar(es) lida(s) da Base Consolidada.',

        'Cautelares atualizadas',

        5

      );

    }

  } finally {

    bloqueio.releaseLock();

  }

}



function construirRegistroCautelar_(linha, mapa, idCautelar, idConsolidado) {

  const campo = function () {

    return pegarCampoCautelar_(linha, mapa, Array.prototype.slice.call(arguments));

  };



  const statusVisita = campo('Status da visita cautelar', 'Qual a visita');

  const situacaoOriginal = campo('Situação da Vistoria Cautelar');

  const moradorHistorico = campo('Morador Presente');

  const permissaoHistorica = campo('Houve permissão do morador');

  const moradorPresente = identificarPresencaMoradorCautelar_(

    situacaoOriginal,

    moradorHistorico,

    campo('Nome - Pesquisa de Satisfação', 'Nome do Munícipe para Pesquisa de Satisfação')

  );

  const permissaoEntrada = identificarPermissaoCautelar_(situacaoOriginal, permissaoHistorica);

  const tipoVistoria = identificarTipoVistoriaCautelar_(

    situacaoOriginal,

    permissaoHistorica,

    moradorHistorico

  );

  const situacao = valorPreenchidoCautelar_(situacaoOriginal)

    ? situacaoOriginal

    : construirSituacaoHistoricaCautelar_(moradorHistorico, permissaoHistorica);



  const momentoPesquisa = campo(

    'Perguntas finais direcionadas ao momento, indique se:',

    'Momento que ocorreu a pesquisa',

    'Sequencia, em que momento a pesquisa está sendo feita?'

  );

  const nomeMunicipe = campo(

    'Nome - Pesquisa de Satisfação',

    'Nome do Munícipe para Pesquisa de Satisfação'

  );

  const telefone = campo('Telefone - Pesquisa de Satisfação', 'Telefone');

  const notaChegada = extrairNotaCautelar_(campo(

    'De 0 a 10, o quanto está satisfeito com a chegada da obra?',

    'De 1 a 10 o quanto você está satisfeito com a chegada das obras?'

  ));

  const sinteseMomento = juntarInformacoesCautelar_([

    rotularInformacaoCautelar_(

      'Conhecimento prévio da obra',

      campo('Você já ouviu falar sobre a nova obra que está chegando?')

    ),

    rotularInformacaoCautelar_('Nota sobre a chegada da obra', notaChegada),

    rotularInformacaoCautelar_(

      'Sugestão para reduzir impactos',

      campo('Tem algum comentário ou sugestão que ajude a causar menos impactos com chegada da obra?')

    ),

    rotularInformacaoCautelar_(

      'Depoimento pré-obra',

      campo('Transcreva o depoimento sobre a satisfação com a chegada das obras:')

    ),

    rotularInformacaoCautelar_(

      'Expectativa',

      campo('Qual a sua expectativa sobre a obra:')

    ),

    rotularInformacaoCautelar_(

      'Relacionamento entre equipe e população',

      campo(

        'De 0 a 10, como avalia o relacionamento entre a equipe de obras e a população?',

        'Como você avalia o relacionamento da equipe do consórcio e a população?'

      )

    ),

    rotularInformacaoCautelar_(

      'Satisfação durante a obra',

      campo(

        'De 0 a 10, o quanto está satisfeito com a execução da obra?',

        'De 1 a 10 quanto você esta satisfeito durante essa obra:'

      )

    ),

    rotularInformacaoCautelar_(

      'Impactos no dia a dia',

      campo(

        'Deseja relatar como as obras vem afetando seu dia a dia?',

        'Como você soube da obra e como ela vem afetado o seu dia a dia? Transcreva e discorra o relato.'

      )

    ),

    rotularInformacaoCautelar_(

      'Expectativas atendidas',

      campo('As obras atenderam as expectativas?', 'A obra atendeu as suas expectativas?')

    ),

    rotularInformacaoCautelar_(

      'Satisfação com o resultado',

      campo(

        'De 0 a 10, o quanto está satisfeito com o resultado da obra?',

        'De 1 a 10 quanto você esta satisfeito com o resultado da obra:'

      )

    ),

    rotularInformacaoCautelar_(

      'Melhoria após as obras',

      campo('De 1 a 10 quanto você percebe de melhorias na qualidade de vida após as obras:')

    ),

    rotularInformacaoCautelar_(

      'Relato pós-obra',

      campo('Transcreva e desenvolva o relato do entrevistado em relação a satisfação com as obras e se houve melhoria na qualidade de vida das pessoas.')

    )

  ]);



  const satisfacaoSaneamento = extrairNotaCautelar_(campo(

    'De 0 a 10, quanto está satisfeito com os serviços de saneamento de forma geral?',

    'De 1 a 10, o quanto você está satisfeito com os serviços de saneamento?'

  ));

  const aspectosSaneamento = juntarInformacoesCautelar_([

    campo('De forma geral, quais aspectos observa sobre os serviços de saneamento?'),

    campo('Transcreva e desenvolva o depoimento do Entrevistado')

  ]);

  const mudancaQualidade = campo(

    'Tem notado mudanças na qualidade de vida em relação ao saneamento de forma geral?'

  );

  const notaMelhoria = extrairNotaCautelar_(campo(

    'Se sim: De 0 a 10, quanto percebeu melhorias na qualidade de vida relacionadas ao saneamento?',

    'De 1 a 10 quanto você percebe de melhorias na qualidade de vida após as obras:'

  ));

  const comentarioGeralPesquisa = campo(

    'Quer adicionar algum comentário ou sugestão para melhoria dos serviços?'

  );

  const informacoesClaras = campo('As informações ficaram claras?');

  const interesseContato = campo('Tem interesse em contato posterior sobre as Obras?');

  const interesseGrupo = campo(

    'Gostaria de fazer parte de um grupo de comunicação sobre as obras e ações do Consórcio?'

  );

  const notaAtendimento = extrairNotaCautelar_(campo(

    'De 0 a 10, qual nota o munícipe atribui ao atendimento recebido?',

    'Qual a nota o municipe deu ao seu atendimento'

  ));

  const ultimoComentario = campo('Algum último comentário ou sugestão?', 'Pontos de melhoria no atendimento');



  const pesquisaCompleta = pesquisaCompletaCautelarAplicada_({

    momento: momentoPesquisa,

    notaChegada: notaChegada,

    sinteseMomento: sinteseMomento,

    satisfacaoSaneamento: satisfacaoSaneamento,

    aspectosSaneamento: aspectosSaneamento,

    mudancaQualidade: mudancaQualidade,

    notaMelhoria: notaMelhoria,

    comentarioGeral: comentarioGeralPesquisa

  });

  const tipoContato = classificarContatoCautelar_(

    pesquisaCompleta,

    situacao,

    moradorPresente,

    nomeMunicipe,

    notaAtendimento

  );

  const vinculoPreObra = classificarVinculoPreObraCautelar_(pesquisaCompleta, momentoPesquisa);



  const grauAtencao = campo(

    'De 0 a 10 classifique um grau de atenção da cautelar',

    'Grau de Atenção'

  );

  const observacaoFinal = juntarInformacoesCautelar_([

    campo('Observação final do procedimento'),

    rotularInformacaoCautelar_('Comentário geral da pesquisa', comentarioGeralPesquisa),

    rotularInformacaoCautelar_('Último comentário do munícipe', ultimoComentario)

  ]);



  return {

    id: idCautelar,

    idConsolidado: idConsolidado,

    data: campo('Data de realização do procedimento', 'Column 1'),

    dataHora: campo('Carimbo de data/hora', 'Column 1'),

    bairro: campo('Bairro de realização do procedimento', 'Bairro do Morador', 'Bairro da atuação'),

    endereco: campo('Endereço completo', 'Endereço Completo da Cautelar'),

    referencia: campo('Ponto de referência'),

    statusVisita: statusVisita,

    tipoVistoria: tipoVistoria,

    situacao: situacao,

    moradorPresente: moradorPresente,

    permissaoEntrada: permissaoEntrada,

    tipoContato: tipoContato,

    pesquisaAplicada: pesquisaCompleta ? 'Sim' : 'Não',

    momentoPesquisa: momentoPesquisa,

    vinculoPreObra: vinculoPreObra,

    nomeMunicipe: nomeMunicipe,

    telefone: telefone,

    notaChegada: notaChegada,

    sinteseMomento: sinteseMomento,

    satisfacaoSaneamento: satisfacaoSaneamento,

    aspectosSaneamento: aspectosSaneamento,

    mudancaQualidade: mudancaQualidade,

    notaMelhoria: notaMelhoria,

    notaAtendimento: notaAtendimento,

    informacoesClaras: informacoesClaras,

    interesseContato: interesseContato,

    interesseGrupo: interesseGrupo,

    grauAtencao: grauAtencao,

    indicadorAtencao: classificarAtencaoCautelar_(grauAtencao),

    vulnerabilidades: campo(

      'Vulnerabilidades e características observadas na cautelar',

      'Possíveis Vulnerabilidades e Caracteristicas Observadas'

    ),

    comentario: campo('Comentário - Vistoria Cautelar', 'Observações da Cautelar'),

    fotos: campo('Foto de fachada e Registro relevante Cautelar', 'Foto da Fachada'),

    responsavelTecnico: campo('Responsável técnico pela cautelar', 'Responsável pela cautelar'),

    responsavelRegistro: campo('Colaborador responsável pelo registro', 'Colaborador responsável:'),

    area: campo('Área responsável pelo procedimento', 'Procedimento foi feito:'),

    observacaoFinal: observacaoFinal

  };

}



function identificarPresencaMoradorCautelar_(situacao, historico, nomeMunicipe) {

  if (valorPreenchidoCautelar_(historico)) return resumirSimNaoCautelar_(historico);

  const texto = normalizarTextoCautelar_(situacao);

  if (/morador ausente/.test(texto)) return 'Não';

  if (/morador presente|permitiu entrada|nao permitiu entrada|procura contato/.test(texto)) return 'Sim';

  return valorPreenchidoCautelar_(nomeMunicipe) ? 'Sim' : 'Não informado';

}



function identificarPermissaoCautelar_(situacao, historico) {

  if (valorPreenchidoCautelar_(historico)) return resumirSimNaoCautelar_(historico);

  const texto = normalizarTextoCautelar_(situacao);

  if (/nao permitiu entrada/.test(texto)) return 'Não';

  if (/permitiu entrada/.test(texto)) return 'Sim';

  if (/vistoria de fachada/.test(texto)) return 'Não se aplica';

  return 'Não informado';

}



function identificarTipoVistoriaCautelar_(situacao, permissaoHistorica, moradorHistorico) {

  const texto = normalizarTextoCautelar_(situacao);

  if (/vistoria detalhada/.test(texto)) return 'Detalhada';

  if (/vistoria de fachada/.test(texto)) return 'Fachada';

  if (valorPreenchidoCautelar_(permissaoHistorica)) {

    return respostaPositivaCautelar_(permissaoHistorica) ? 'Detalhada' : 'Não informado';

  }

  return 'Não informado';

}



function construirSituacaoHistoricaCautelar_(morador, permissao) {

  if (valorPreenchidoCautelar_(morador) && !respostaPositivaCautelar_(morador)) {

    return 'Registro histórico: morador ausente';

  }

  if (valorPreenchidoCautelar_(permissao)) {

    return respostaPositivaCautelar_(permissao)

      ? 'Registro histórico: entrada autorizada'

      : 'Registro histórico: entrada não autorizada';

  }

  return 'Não informado';

}



function pesquisaCompletaCautelarAplicada_(respostas) {

  return [

    respostas.momento,

    respostas.notaChegada,

    respostas.sinteseMomento,

    respostas.satisfacaoSaneamento,

    respostas.aspectosSaneamento,

    respostas.mudancaQualidade,

    respostas.notaMelhoria,

    respostas.comentarioGeral

  ].some(valorPreenchidoCautelar_);

}



function classificarContatoCautelar_(pesquisaCompleta, situacao, moradorPresente, nome, notaAtendimento) {

  if (pesquisaCompleta) return 'Pesquisa completa';

  const texto = normalizarTextoCautelar_(situacao);

  if (/procura contato/.test(texto) || valorPreenchidoCautelar_(notaAtendimento)) return 'Contato breve';

  if (normalizarTextoCautelar_(moradorPresente) === 'sim' || valorPreenchidoCautelar_(nome)) {

    return 'Presença sem pesquisa completa';

  }

  if (normalizarTextoCautelar_(moradorPresente) === 'nao') return 'Sem contato';

  return 'Não informado';

}



function classificarVinculoPreObraCautelar_(pesquisaCompleta, momento) {

  if (!pesquisaCompleta) return 'Sem pesquisa completa';

  const texto = normalizarTextoCautelar_(momento);

  if (/pre obra/.test(texto)) return 'Pesquisa pré-obra vinculada';

  if (texto) return 'Pesquisa em outro momento';

  return 'Momento da pesquisa não informado';

}



function classificarAtencaoCautelar_(valor) {

  if (!valorPreenchidoCautelar_(valor)) return 'Não classificada';

  if (typeof valor === 'number' && isFinite(valor)) {

    if (valor >= 7) return 'Atenção elevada';

    if (valor >= 4) return 'Atenção moderada';

    return 'Atenção reduzida';

  }

  const texto = normalizarTextoCautelar_(valor);

  const numero = texto.match(/\d+(?:[.,]\d+)?/);

  if (numero) return classificarAtencaoCautelar_(Number(numero[0].replace(',', '.')));

  if (/alto|alta|muita|elevad|urgente/.test(texto)) return 'Atenção elevada';

  if (/medio|media|moderad/.test(texto)) return 'Atenção moderada';

  if (/baixo|baixa|pouca|reduzid/.test(texto)) return 'Atenção reduzida';

  return 'Não classificada';

}



function cautelarParaLinha_(registro) {

  return [

    registro.id,

    registro.idConsolidado,

    registro.data,

    registro.dataHora,

    registro.bairro,

    registro.endereco,

    registro.referencia,

    registro.statusVisita,

    registro.tipoVistoria,

    registro.situacao,

    registro.moradorPresente,

    registro.permissaoEntrada,

    registro.tipoContato,

    registro.pesquisaAplicada,

    registro.momentoPesquisa,

    registro.vinculoPreObra,

    registro.nomeMunicipe,

    registro.telefone,

    registro.notaChegada,

    registro.sinteseMomento,

    registro.satisfacaoSaneamento,

    registro.aspectosSaneamento,

    registro.mudancaQualidade,

    registro.notaMelhoria,

    registro.notaAtendimento,

    registro.informacoesClaras,

    registro.interesseContato,

    registro.interesseGrupo,

    registro.grauAtencao,

    registro.indicadorAtencao,

    registro.vulnerabilidades,

    registro.comentario,

    registro.fotos,

    registro.responsavelTecnico,

    registro.responsavelRegistro,

    registro.area,

    registro.observacaoFinal

  ];

}



function escreverBaseCautelar_(aba, registros) {

  const primeiraLinha = CONFIG_CAUTELAR.PRIMEIRA_LINHA_DADOS;

  const linhas = registros.map(cautelarParaLinha_);

  const totalDetalhadas = registros.filter(function (registro) {

    return normalizarTextoCautelar_(registro.tipoVistoria) === 'detalhada';

  }).length;

  const totalContato = registros.filter(function (registro) {

    return ['pesquisa completa', 'contato breve'].indexOf(

      normalizarTextoCautelar_(registro.tipoContato)

    ) !== -1;

  }).length;

  const totalPreObra = registros.filter(function (registro) {

    return normalizarTextoCautelar_(registro.vinculoPreObra) === 'pesquisa pre obra vinculada';

  }).length;

  const totalAtencaoElevada = registros.filter(function (registro) {

    return normalizarTextoCautelar_(registro.indicadorAtencao) === 'atencao elevada';

  }).length;



  aba.getRange('A1').setValue('VISTORIAS CAUTELARES');

  aba.getRange('A2').setValue(

    'Painel de acompanhamento da cautelar e do vínculo com a pesquisa de satisfação'

  );

  aba.getRange('A3').setValue(

    'Fluxo: fachada sem contato finaliza; contato breve registra o atendimento; entrada autorizada permite pesquisa completa, preferencialmente pré-obra.'

  );



  const cartoes = [

    ['A5:G5', 'A6:G7', 'TOTAL DE CAUTELARES', registros.length],

    ['H5:N5', 'H6:N7', 'VISTORIAS DETALHADAS', totalDetalhadas],

    ['O5:U5', 'O6:U7', 'COM CONTATO', totalContato],

    ['V5:AB5', 'V6:AB7', 'PESQUISAS PRÉ-OBRA', totalPreObra],

    ['AC5:AK5', 'AC6:AK7', 'ATENÇÃO ELEVADA', totalAtencaoElevada]

  ];

  cartoes.forEach(function (cartao) {

    aba.getRange(cartao[0]).merge().setValue(cartao[2]);

    aba.getRange(cartao[1]).merge().setValue(cartao[3]);

  });



  aba.getRange('A9:AK9').merge().setValue('REGISTROS FILTRADOS DA BASE CONSOLIDADA');

  [

    ['A10:D10', 'IDENTIFICAÇÃO'],

    ['E10:H10', 'LOCAL E VISITA'],

    ['I10:M10', 'SITUAÇÃO E CONTATO'],

    ['N10:R10', 'PESQUISA VINCULADA'],

    ['S10:AB10', 'INDICADORES DA PESQUISA'],

    ['AC10:AF10', 'ATENÇÃO E CARACTERÍSTICAS'],

    ['AG10:AK10', 'EVIDÊNCIAS E RESPONSABILIDADE']

  ].forEach(function (grupo) {

    aba.getRange(grupo[0]).merge().setValue(grupo[1]);

  });



  aba.getRange(11, 1, 1, CABECALHOS_CAUTELAR.length).setValues([CABECALHOS_CAUTELAR]);

  if (linhas.length) {

    aba.getRange(primeiraLinha, 1, linhas.length, CABECALHOS_CAUTELAR.length).setValues(linhas);

  }

}



function formatarBaseCautelar_(aba, registros) {

  const primeiraLinha = CONFIG_CAUTELAR.PRIMEIRA_LINHA_DADOS;

  const quantidade = registros.length;

  const ultimaLinha = Math.max(primeiraLinha, primeiraLinha + quantidade - 1);



  aba.setHiddenGridlines(true);

  aba.setFrozenRows(11);

  aba.setFrozenColumns(0);

  aba.getRange('A1:AK' + ultimaLinha)

    .setFontFamily('Arial')

    .setFontSize(9)

    .setFontColor('#253246')

    .setVerticalAlignment('top');



  aba.getRange('A1:AK3').setBackground('#3E2D59');

  aba.getRange('A1:AK1')

    .setFontSize(22).setFontWeight('bold').setFontColor('#FFFFFF')

    .setVerticalAlignment('middle');

  aba.getRange('A2:AK2')

    .setFontSize(12).setFontColor('#E9E0F2').setVerticalAlignment('middle');

  aba.getRange('A3:AK3')

    .setFontSize(9).setFontStyle('italic').setFontColor('#F8E6A6')

    .setVerticalAlignment('middle');

  aba.setRowHeight(1, 42);

  aba.setRowHeight(2, 25);

  aba.setRowHeight(3, 34);

  aba.setRowHeight(4, 12);



  const coresCartoes = ['#6B4E8A', '#4C6FA8', '#177F86', '#28875D', '#C26B3B'];

  const faixasCartoes = [

    ['A5:G5', 'A6:G7'],

    ['H5:N5', 'H6:N7'],

    ['O5:U5', 'O6:U7'],

    ['V5:AB5', 'V6:AB7'],

    ['AC5:AK5', 'AC6:AK7']

  ];

  faixasCartoes.forEach(function (faixa, indice) {

    aba.getRange(faixa[0])

      .setBackground(coresCartoes[indice]).setFontColor('#FFFFFF').setFontWeight('bold')

      .setHorizontalAlignment('center').setVerticalAlignment('middle');

    aba.getRange(faixa[1])

      .setBackground('#FFFFFF').setFontColor(coresCartoes[indice]).setFontSize(20)

      .setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle')

      .setBorder(true, true, true, true, false, false, '#D2C9DD', SpreadsheetApp.BorderStyle.SOLID);

  });

  aba.setRowHeight(5, 24);

  aba.setRowHeights(6, 2, 28);

  aba.setRowHeight(8, 12);



  aba.getRange('A9:AK9')

    .setBackground('#E8E0F0').setFontColor('#3E2D59').setFontSize(11).setFontWeight('bold')

    .setHorizontalAlignment('center').setVerticalAlignment('middle')

    .setBorder(true, true, true, true, false, false, '#C7B7D6', SpreadsheetApp.BorderStyle.SOLID);

  aba.setRowHeight(9, 28);



  const grupos = [

    ['A10:D10', 'A11:D11', '#4D5E78', '#E9EDF3'],

    ['E10:H10', 'E11:H11', '#5D6F8C', '#EDF0F5'],

    ['I10:M10', 'I11:M11', '#6B4E8A', '#EFE8F5'],

    ['N10:R10', 'N11:R11', '#177F86', '#E3F2F2'],

    ['S10:AB10', 'S11:AB11', '#2E6E82', '#E5F0F3'],

    ['AC10:AF10', 'AC11:AF11', '#A35D39', '#F7EAE2'],

    ['AG10:AK10', 'AG11:AK11', '#3E2D59', '#ECE7F1']

  ];

  grupos.forEach(function (grupo) {

    aba.getRange(grupo[0])

      .setBackground(grupo[2]).setFontColor('#FFFFFF').setFontWeight('bold')

      .setHorizontalAlignment('center').setVerticalAlignment('middle');

    aba.getRange(grupo[1])

      .setBackground(grupo[3]).setFontColor(grupo[2]).setFontWeight('bold')

      .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true)

      .setBorder(false, false, true, false, true, true, grupo[2], SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  });

  aba.setRowHeight(10, 24);

  aba.setRowHeight(11, 58);



  if (quantidade) {

    const corpo = aba.getRange(primeiraLinha, 1, quantidade, CABECALHOS_CAUTELAR.length);

    corpo.setFontSize(9).setWrap(true).setVerticalAlignment('top');

    const fundos = [];

    for (let i = 0; i < quantidade; i++) {

      fundos.push(new Array(CABECALHOS_CAUTELAR.length).fill(i % 2 === 0 ? '#FFFFFF' : '#F7F5FA'));

    }

    corpo.setBackgrounds(fundos);

    aba.setRowHeights(primeiraLinha, quantidade, 125);



    aba.getRange('A' + primeiraLinha + ':B' + ultimaLinha)

      .setHorizontalAlignment('center').setVerticalAlignment('middle')

      .setFontWeight('bold').setFontColor('#4E3A68');

    aba.getRange('C' + primeiraLinha + ':C' + ultimaLinha)

      .setNumberFormat('dd/MM/yyyy').setHorizontalAlignment('center').setVerticalAlignment('middle');

    aba.getRange('D' + primeiraLinha + ':D' + ultimaLinha)

      .setNumberFormat('dd/MM/yyyy HH:mm').setHorizontalAlignment('center').setVerticalAlignment('middle');

    aba.getRange('S' + primeiraLinha + ':S' + ultimaLinha).setNumberFormat('0');

    aba.getRange('U' + primeiraLinha + ':U' + ultimaLinha).setNumberFormat('0');

    aba.getRange('X' + primeiraLinha + ':Y' + ultimaLinha).setNumberFormat('0');



    aplicarRegrasVisuaisCautelar_(aba, primeiraLinha, ultimaLinha);

    aba.getRange(11, 1, quantidade + 1, CABECALHOS_CAUTELAR.length).createFilter();

  }



  const larguras = [

    105, 145, 105, 135, 120, 240, 150, 125, 110, 270,

    110, 120, 165, 125, 130, 180, 170, 125,

    110, 280, 115, 280, 140, 125, 120, 120, 140, 150,

    130, 150, 290, 300, 250, 170, 175, 135, 300

  ];

  larguras.forEach(function (largura, indice) {

    aba.setColumnWidth(indice + 1, largura);

  });

}



function aplicarRegrasVisuaisCautelar_(aba, primeiraLinha, ultimaLinha) {

  const regras = [

    SpreadsheetApp.newConditionalFormatRule()

      .whenTextEqualTo('Atenção elevada')

      .setBackground('#F8D8D2').setFontColor('#9B3328').setBold(true)

      .setRanges([aba.getRange('AD' + primeiraLinha + ':AD' + ultimaLinha)]).build(),

    SpreadsheetApp.newConditionalFormatRule()

      .whenTextEqualTo('Atenção moderada')

      .setBackground('#FDECCB').setFontColor('#9B610C').setBold(true)

      .setRanges([aba.getRange('AD' + primeiraLinha + ':AD' + ultimaLinha)]).build(),

    SpreadsheetApp.newConditionalFormatRule()

      .whenTextEqualTo('Atenção reduzida')

      .setBackground('#DFF0E6').setFontColor('#256B48').setBold(true)

      .setRanges([aba.getRange('AD' + primeiraLinha + ':AD' + ultimaLinha)]).build(),

    SpreadsheetApp.newConditionalFormatRule()

      .whenTextEqualTo('Sim')

      .setBackground('#DFF0E6').setFontColor('#256B48').setBold(true)

      .setRanges([aba.getRange('N' + primeiraLinha + ':N' + ultimaLinha)]).build(),

    SpreadsheetApp.newConditionalFormatRule()

      .whenTextEqualTo('Não')

      .setBackground('#EEF0F3').setFontColor('#626B78')

      .setRanges([aba.getRange('N' + primeiraLinha + ':N' + ultimaLinha)]).build(),

    SpreadsheetApp.newConditionalFormatRule()

      .whenTextEqualTo('Pesquisa pré-obra vinculada')

      .setBackground('#D9F1E5').setFontColor('#1E704A').setBold(true)

      .setRanges([aba.getRange('P' + primeiraLinha + ':P' + ultimaLinha)]).build(),

    SpreadsheetApp.newConditionalFormatRule()

      .whenTextEqualTo('Pesquisa em outro momento')

      .setBackground('#FFF0D6').setFontColor('#A3600B').setBold(true)

      .setRanges([aba.getRange('P' + primeiraLinha + ':P' + ultimaLinha)]).build(),

    SpreadsheetApp.newConditionalFormatRule()

      .whenTextEqualTo('Pesquisa completa')

      .setBackground('#DCEFF0').setFontColor('#17656B').setBold(true)

      .setRanges([aba.getRange('M' + primeiraLinha + ':M' + ultimaLinha)]).build(),

    SpreadsheetApp.newConditionalFormatRule()

      .whenTextEqualTo('Sem contato')

      .setBackground('#EEF0F3').setFontColor('#626B78')

      .setRanges([aba.getRange('M' + primeiraLinha + ':M' + ultimaLinha)]).build()

  ];

  aba.setConditionalFormatRules(regras);

}



function prepararAbaBaseCautelar_(aba, quantidade) {

  if (aba.getFilter()) aba.getFilter().remove();

  separarTodasCelulasCautelar_(aba);

  aba.clear();

  aba.setConditionalFormatRules([]);



  const linhasNecessarias = Math.max(32, CONFIG_CAUTELAR.PRIMEIRA_LINHA_DADOS + quantidade);

  const colunasNecessarias = CABECALHOS_CAUTELAR.length;

  if (aba.getMaxRows() < linhasNecessarias) {

    aba.insertRowsAfter(aba.getMaxRows(), linhasNecessarias - aba.getMaxRows());

  }

  if (aba.getMaxColumns() < colunasNecessarias) {

    aba.insertColumnsAfter(aba.getMaxColumns(), colunasNecessarias - aba.getMaxColumns());

  }



  aba.getRange('A1:AK1').merge();

  aba.getRange('A2:AK2').merge();

  aba.getRange('A3:AK3').merge();

}



function gerarFichaCautelarDaLinhaSelecionada() {

  const arquivo = SpreadsheetApp.getActiveSpreadsheet();

  const aba = arquivo.getActiveSheet();

  const intervalo = aba.getActiveRange();

  const linha = intervalo ? intervalo.getRow() : 0;



  if (aba.getName() !== CONFIG_CAUTELAR.ABA_BASE || linha < CONFIG_CAUTELAR.PRIMEIRA_LINHA_DADOS) {

    avisarCautelar_(

      'Selecione uma célula na linha da cautelar desejada, dentro da aba "' +

      CONFIG_CAUTELAR.ABA_BASE + '".',

      'Cautelares'

    );

    return;

  }



  const valores = aba.getRange(linha, 1, 1, CABECALHOS_CAUTELAR.length).getValues()[0];

  gerarFichaCautelar_(linhaParaCautelar_(valores), false);

}



function gerarFichaCautelarMaisRecente() {

  const arquivo = SpreadsheetApp.getActiveSpreadsheet();

  const aba = arquivo.getSheetByName(CONFIG_CAUTELAR.ABA_BASE);

  if (!aba || aba.getLastRow() < CONFIG_CAUTELAR.PRIMEIRA_LINHA_DADOS) {

    avisarCautelar_('Não há cautelares consolidadas. Atualize a base primeiro.', 'Cautelares');

    return;

  }

  const valores = aba.getRange(

    aba.getLastRow(),

    1,

    1,

    CABECALHOS_CAUTELAR.length

  ).getValues()[0];

  gerarFichaCautelar_(linhaParaCautelar_(valores), false);

}



function linhaParaCautelar_(linha) {

  const indice = {};

  CABECALHOS_CAUTELAR.forEach(function (cabecalho, posicao) {

    indice[cabecalho] = posicao;

  });

  const valor = function (cabecalho) { return linha[indice[cabecalho]]; };

  return {

    id: valor('ID da cautelar'),

    idConsolidado: valor('ID consolidado'),

    data: valor('Data da vistoria'),

    dataHora: valor('Data e hora do registro'),

    bairro: valor('Bairro'),

    endereco: valor('Endereço'),

    referencia: valor('Ponto de referência'),

    statusVisita: valor('Status da visita'),

    tipoVistoria: valor('Tipo de vistoria'),

    situacao: valor('Situação registrada'),

    moradorPresente: valor('Morador presente'),

    permissaoEntrada: valor('Permissão de entrada'),

    tipoContato: valor('Tipo de contato'),

    pesquisaAplicada: valor('Pesquisa completa aplicada'),

    momentoPesquisa: valor('Momento da pesquisa'),

    vinculoPreObra: valor('Vínculo com pré-obra'),

    nomeMunicipe: valor('Nome do munícipe'),

    telefone: valor('Telefone'),

    notaChegada: valor('Nota sobre a chegada da obra'),

    sinteseMomento: valor('Síntese do momento da pesquisa'),

    satisfacaoSaneamento: valor('Satisfação com saneamento'),

    aspectosSaneamento: valor('Aspectos ou depoimento sobre saneamento'),

    mudancaQualidade: valor('Mudança na qualidade de vida'),

    notaMelhoria: valor('Nota de melhoria na qualidade de vida'),

    notaAtendimento: valor('Nota do atendimento recebido'),

    informacoesClaras: valor('Informações claras'),

    interesseContato: valor('Interesse em contato posterior'),

    interesseGrupo: valor('Interesse em grupo de comunicação'),

    grauAtencao: valor('Grau de atenção original'),

    indicadorAtencao: valor('Indicador visual de atenção'),

    vulnerabilidades: valor('Vulnerabilidades e características'),

    comentario: valor('Comentário da cautelar'),

    fotos: valor('Registro fotográfico'),

    responsavelTecnico: valor('Responsável técnico'),

    responsavelRegistro: valor('Responsável pelo registro'),

    area: valor('Área responsável'),

    observacaoFinal: valor('Observação final')

  };

}



function gerarFichaCautelar_(registro, silencioso) {

  const arquivo = SpreadsheetApp.getActiveSpreadsheet();

  let aba = arquivo.getSheetByName(CONFIG_CAUTELAR.ABA_FICHA);

  if (!aba) {

    aba = arquivo.insertSheet(CONFIG_CAUTELAR.ABA_FICHA);

    aba.setTabColor('#3E2D59');

  }



  prepararFichaCautelar_(aba, 50);

  aba.getRange('A1:H50')

    .setFontFamily('Arial').setFontSize(10).setFontColor('#253246')

    .setVerticalAlignment('top').setWrap(true).setBackground('#F8F7FA');



  aba.getRange('A1:H1').merge().setValue('FICHA DE VISTORIA CAUTELAR');

  aba.getRange('A2:H2').merge().setValue(

    valorFichaCautelar_(registro.id, 'Sem identificação') + ' | ' +

    valorFichaCautelar_(registro.bairro, 'Bairro não informado')

  );

  aba.getRange('A1:H2').setBackground('#3E2D59');

  aba.getRange('A1:H1')

    .setFontSize(20).setFontWeight('bold').setFontColor('#FFFFFF')

    .setHorizontalAlignment('center').setVerticalAlignment('middle');

  aba.getRange('A2:H2')

    .setFontSize(11).setFontColor('#E9E0F2')

    .setHorizontalAlignment('center').setVerticalAlignment('middle');

  aba.setRowHeight(1, 42);

  aba.setRowHeight(2, 26);

  aba.setRowHeight(3, 10);



  escreverSecaoFichaCautelar_(aba, 'A4:H4', 'IDENTIFICAÇÃO E LOCAL');

  escreverParFichaCautelar_(aba, 'A5:B5', 'C5:D5', 'DATA DA VISTORIA', valorFichaCautelar_(registro.data, 'Não informada'));

  aba.getRange('C5:D5').setNumberFormat('dd/MM/yyyy');

  escreverParFichaCautelar_(aba, 'E5:F5', 'G5:H5', 'STATUS DA VISITA', valorFichaCautelar_(registro.statusVisita, 'Não informado'));

  escreverParFichaCautelar_(aba, 'A6:B6', 'C6:H6', 'ENDEREÇO', valorFichaCautelar_(registro.endereco, 'Não informado'));

  escreverParFichaCautelar_(aba, 'A7:B7', 'C7:D7', 'BAIRRO', valorFichaCautelar_(registro.bairro, 'Não informado'));

  escreverParFichaCautelar_(aba, 'E7:F7', 'G7:H7', 'PONTO DE REFERÊNCIA', valorFichaCautelar_(registro.referencia, 'Não informado'));

  escreverParFichaCautelar_(aba, 'A8:B8', 'C8:D8', 'RESPONSÁVEL TÉCNICO', valorFichaCautelar_(registro.responsavelTecnico, 'Não informado'));

  escreverParFichaCautelar_(aba, 'E8:F8', 'G8:H8', 'RESPONSÁVEL PELO REGISTRO', valorFichaCautelar_(registro.responsavelRegistro, 'Não informado'));



  escreverSecaoFichaCautelar_(aba, 'A10:H10', 'FLUXO DA VISTORIA E CONTATO');

  escreverParFichaCautelar_(aba, 'A11:B11', 'C11:D11', 'TIPO DE VISTORIA', valorFichaCautelar_(registro.tipoVistoria, 'Não informado'));

  escreverParFichaCautelar_(aba, 'E11:F11', 'G11:H11', 'MORADOR PRESENTE', valorFichaCautelar_(registro.moradorPresente, 'Não informado'));

  escreverParFichaCautelar_(aba, 'A12:B12', 'C12:D12', 'PERMISSÃO DE ENTRADA', valorFichaCautelar_(registro.permissaoEntrada, 'Não informado'));

  escreverParFichaCautelar_(aba, 'E12:F12', 'G12:H12', 'TIPO DE CONTATO', valorFichaCautelar_(registro.tipoContato, 'Não informado'));

  escreverBlocoFichaCautelar_(aba, 'A13:B15', 'C13:H15', 'SITUAÇÃO REGISTRADA', valorFichaCautelar_(registro.situacao, 'Não informada'));



  escreverSecaoFichaCautelar_(aba, 'A17:H17', 'ATENÇÃO, CARACTERÍSTICAS E EVIDÊNCIAS');

  escreverParFichaCautelar_(aba, 'A18:B18', 'C18:D18', 'GRAU DE ATENÇÃO ORIGINAL', valorFichaCautelar_(registro.grauAtencao, 'Não informado'));

  escreverParFichaCautelar_(aba, 'E18:F18', 'G18:H18', 'LEITURA VISUAL', valorFichaCautelar_(registro.indicadorAtencao, 'Não classificada'));

  escreverBlocoFichaCautelar_(aba, 'A19:B21', 'C19:H21', 'VULNERABILIDADES E CARACTERÍSTICAS', valorFichaCautelar_(registro.vulnerabilidades, 'Não informadas'));

  escreverBlocoFichaCautelar_(aba, 'A22:B24', 'C22:H24', 'COMENTÁRIO DA CAUTELAR', valorFichaCautelar_(registro.comentario, 'Não informado'));

  escreverBlocoFichaCautelar_(aba, 'A25:B27', 'C25:H27', 'REGISTRO FOTOGRÁFICO', '');

  definirLinksFotosCautelar_(aba.getRange('C25:H27'), registro.fotos);



  escreverSecaoFichaCautelar_(aba, 'A29:H29', 'PESQUISA DE SATISFAÇÃO VINCULADA');

  escreverParFichaCautelar_(aba, 'A30:B30', 'C30:D30', 'PESQUISA COMPLETA', valorFichaCautelar_(registro.pesquisaAplicada, 'Não'));

  escreverParFichaCautelar_(aba, 'E30:F30', 'G30:H30', 'MOMENTO', valorFichaCautelar_(registro.momentoPesquisa, 'Não informado'));

  escreverParFichaCautelar_(aba, 'A31:B31', 'C31:H31', 'VÍNCULO COM PRÉ-OBRA', valorFichaCautelar_(registro.vinculoPreObra, 'Sem pesquisa completa'));

  escreverParFichaCautelar_(aba, 'A32:B32', 'C32:D32', 'NOME DO MUNÍCIPE', valorFichaCautelar_(registro.nomeMunicipe, 'Não informado'));

  escreverParFichaCautelar_(aba, 'E32:F32', 'G32:H32', 'TELEFONE', valorFichaCautelar_(registro.telefone, 'Não informado'));

  escreverParFichaCautelar_(aba, 'A33:B33', 'C33:D33', 'SATISFAÇÃO COM SANEAMENTO', valorFichaCautelar_(registro.satisfacaoSaneamento, 'Não respondida'));

  escreverParFichaCautelar_(aba, 'E33:F33', 'G33:H33', 'NOTA SOBRE A CHEGADA DA OBRA', valorFichaCautelar_(registro.notaChegada, 'Não respondida'));

  escreverParFichaCautelar_(aba, 'A34:B34', 'C34:D34', 'MUDANÇA NA QUALIDADE DE VIDA', valorFichaCautelar_(registro.mudancaQualidade, 'Não respondida'));

  escreverParFichaCautelar_(aba, 'E34:F34', 'G34:H34', 'NOTA DE MELHORIA', valorFichaCautelar_(registro.notaMelhoria, 'Não respondida'));

  escreverBlocoFichaCautelar_(aba, 'A35:B38', 'C35:H38', 'ASPECTOS OU DEPOIMENTO SOBRE SANEAMENTO', valorFichaCautelar_(registro.aspectosSaneamento, 'Não respondido'));

  escreverBlocoFichaCautelar_(aba, 'A39:B42', 'C39:H42', 'SÍNTESE DO MOMENTO DA PESQUISA', valorFichaCautelar_(registro.sinteseMomento, 'Não respondida'));

  escreverParFichaCautelar_(aba, 'A43:B43', 'C43:D43', 'NOTA DO ATENDIMENTO', valorFichaCautelar_(registro.notaAtendimento, 'Não respondida'));

  escreverParFichaCautelar_(aba, 'E43:F43', 'G43:H43', 'INFORMAÇÕES CLARAS', valorFichaCautelar_(registro.informacoesClaras, 'Não respondida'));

  escreverParFichaCautelar_(aba, 'A44:B44', 'C44:D44', 'INTERESSE EM CONTATO', valorFichaCautelar_(registro.interesseContato, 'Não respondido'));

  escreverParFichaCautelar_(aba, 'E44:F44', 'G44:H44', 'INTERESSE EM GRUPO', valorFichaCautelar_(registro.interesseGrupo, 'Não respondido'));



  escreverSecaoFichaCautelar_(aba, 'A46:H46', 'OBSERVAÇÕES FINAIS');

  escreverBlocoFichaCautelar_(aba, 'A47:B50', 'C47:H50', 'INFORMAÇÕES COMPLEMENTARES', valorFichaCautelar_(registro.observacaoFinal, 'Não há observações adicionais'));



  for (let coluna = 1; coluna <= 8; coluna++) aba.setColumnWidth(coluna, 125);

  aba.setRowHeights(5, 4, 38);

  aba.setRowHeights(11, 2, 38);

  aba.setRowHeights(13, 3, 42);

  aba.setRowHeights(18, 1, 40);

  aba.setRowHeights(19, 9, 44);

  aba.setRowHeights(30, 5, 40);

  aba.setRowHeights(35, 8, 48);

  aba.setRowHeights(43, 2, 40);

  aba.setRowHeights(47, 4, 52);



  if (!silencioso) {

    if (aba.isSheetHidden()) aba.showSheet();

    arquivo.setActiveSheet(aba);

    arquivo.toast('Ficha gerada para ' + registro.id + '.', 'Ficha atualizada', 4);

  }

}



function gerarFichaCautelarVazia_(silencioso) {

  const arquivo = SpreadsheetApp.getActiveSpreadsheet();

  gerarFichaCautelar_({

    id: 'Nenhuma cautelar consolidada',

    bairro: 'Base pronta para receber registros',

    pesquisaAplicada: 'Não',

    vinculoPreObra: 'Sem pesquisa completa',

    indicadorAtencao: 'Não classificada'

  }, true);



  const aba = arquivo.getSheetByName(CONFIG_CAUTELAR.ABA_FICHA);

  if (aba) {

    aba.getRange('A2:H2').setValue(

      'A ficha será preenchida quando houver uma vistoria cautelar válida na Base Consolidada.'

    );

  }



  if (!silencioso && aba) {

    if (aba.isSheetHidden()) aba.showSheet();

    arquivo.setActiveSheet(aba);

    arquivo.toast('A estrutura foi criada e ainda não há cautelares consolidadas.', 'Cautelares', 5);

  }

}



function prepararFichaCautelar_(aba, quantidadeLinhas) {

  separarTodasCelulasCautelar_(aba);

  aba.clear();

  aba.setConditionalFormatRules([]);



  if (aba.getMaxRows() < quantidadeLinhas) {

    aba.insertRowsAfter(aba.getMaxRows(), quantidadeLinhas - aba.getMaxRows());

  }

  if (aba.getMaxColumns() < 8) {

    aba.insertColumnsAfter(aba.getMaxColumns(), 8 - aba.getMaxColumns());

  }



  aba.setHiddenGridlines(true);

  aba.setFrozenRows(2);

  aba.setFrozenColumns(0);

}



function escreverSecaoFichaCautelar_(aba, endereco, titulo) {

  aba.getRange(endereco).merge().setValue(titulo)

    .setBackground('#6B4E8A').setFontColor('#FFFFFF').setFontWeight('bold')

    .setFontSize(11).setHorizontalAlignment('left').setVerticalAlignment('middle')

    .setBorder(true, true, true, true, false, false, '#4D3968', SpreadsheetApp.BorderStyle.SOLID);

}



function escreverParFichaCautelar_(aba, enderecoRotulo, enderecoValor, rotulo, valor) {

  const faixaRotulo = aba.getRange(enderecoRotulo).merge().setValue(rotulo);

  const faixaValor = aba.getRange(enderecoValor).merge().setValue(valor);

  faixaRotulo

    .setBackground('#E9E2F0').setFontColor('#3E2D59').setFontWeight('bold')

    .setHorizontalAlignment('left').setVerticalAlignment('middle')

    .setBorder(true, true, true, true, false, false, '#C9BDD5', SpreadsheetApp.BorderStyle.SOLID);

  faixaValor

    .setBackground('#FFFFFF').setFontColor('#253246')

    .setHorizontalAlignment('left').setVerticalAlignment('middle').setWrap(true)

    .setBorder(true, true, true, true, false, false, '#C9BDD5', SpreadsheetApp.BorderStyle.SOLID);

}



function escreverBlocoFichaCautelar_(aba, enderecoRotulo, enderecoValor, rotulo, valor) {

  const faixaRotulo = aba.getRange(enderecoRotulo).merge().setValue(rotulo);

  const faixaValor = aba.getRange(enderecoValor).merge().setValue(valor);

  faixaRotulo

    .setBackground('#E9E2F0').setFontColor('#3E2D59').setFontWeight('bold')

    .setHorizontalAlignment('left').setVerticalAlignment('top').setWrap(true)

    .setBorder(true, true, true, true, false, false, '#C9BDD5', SpreadsheetApp.BorderStyle.SOLID);

  faixaValor

    .setBackground('#FFFFFF').setFontColor('#253246')

    .setHorizontalAlignment('left').setVerticalAlignment('top').setWrap(true)

    .setBorder(true, true, true, true, false, false, '#C9BDD5', SpreadsheetApp.BorderStyle.SOLID);

}



function definirLinksFotosCautelar_(intervalo, valor) {

  const urls = extrairUrlsCautelar_(valor);

  if (!urls.length) {

    intervalo.setValue(valorPreenchidoCautelar_(valor) ? valor : 'Não há registro fotográfico vinculado.');

    return;

  }



  const partes = urls.map(function (_, indice) { return 'Abrir foto ' + (indice + 1); });

  const texto = partes.join('\n');

  const construtor = SpreadsheetApp.newRichTextValue().setText(texto);

  let inicio = 0;

  partes.forEach(function (parte, indice) {

    const fim = inicio + parte.length;

    construtor.setLinkUrl(inicio, fim, urls[indice]);

    inicio = fim + 1;

  });

  intervalo.setRichTextValue(construtor.build()).setFontColor('#315F9B').setFontWeight('bold');

}



function extrairUrlsCautelar_(valor) {

  const texto = String(valor === null || valor === undefined ? '' : valor);

  const encontrados = texto.match(/https?:\\/\\/[^\s,;]+/g) || [];

  const vistos = {};

  return encontrados.map(function (url) {

    return url.replace(/[.)\]}]+$/, '');

  }).filter(function (url) {

    if (vistos[url]) return false;

    vistos[url] = true;

    return true;

  });

}



function separarTodasCelulasCautelar_(aba) {

  const linhas = Math.max(1, aba.getMaxRows());

  const colunas = Math.max(1, aba.getMaxColumns());

  aba.getRange(1, 1, linhas, colunas).breakApart();

}



function validarCabecalhosCautelar_(mapa) {

  const obrigatorios = [

    [CONFIG_CAUTELAR.CABECALHO_PROCEDIMENTO, 'Qual procedimento será realizado:'],

    [CONFIG_CAUTELAR.CABECALHO_ID_MIGRACAO]

  ];

  const ausentes = obrigatorios.filter(function (alternativas) {

    return !alternativas.some(function (cabecalho) {

      const indices = mapa[normalizarTextoCautelar_(cabecalho)];

      return Array.isArray(indices) && indices.length > 0;

    });

  }).map(function (alternativas) {

    return alternativas.join(' ou ');

  });



  if (ausentes.length) {

    throw new Error(

      'Campos obrigatórios não encontrados na Base Consolidada:\n' +

      ausentes.map(function (campo) { return '* ' + campo; }).join('\n')

    );

  }

}



function montarMapaCabecalhosCautelar_(cabecalhos) {

  const mapa = {};

  cabecalhos.forEach(function (cabecalho, indice) {

    const chave = normalizarTextoCautelar_(cabecalho);

    if (!chave) return;

    if (!mapa[chave]) mapa[chave] = [];

    mapa[chave].push(indice);

  });

  return mapa;

}



function primeiroIndiceCautelar_(mapa, cabecalho) {

  const indices = mapa[normalizarTextoCautelar_(cabecalho)];

  return Array.isArray(indices) && indices.length ? indices[0] : -1;

}



function pegarCampoCautelar_(linha, mapa, alternativas) {

  for (let i = 0; i < alternativas.length; i++) {

    const indices = mapa[normalizarTextoCautelar_(alternativas[i])] || [];

    for (let j = 0; j < indices.length; j++) {

      const valor = linha[indices[j]];

      if (valorPreenchidoCautelar_(valor)) return valor;

    }

  }

  return '';

}



function validacaoConsolidadaCautelarAceita_(valor) {

  const texto = normalizarTextoCautelar_(valor);

  return texto === 'valido para consolidacao' ||

    texto === 'registro atual preservado' ||

    texto === 'validado' ||

    texto === 'aprovado';

}



function procedimentoCautelarAceito_(valor) {

  const procedimento = normalizarTextoCautelar_(valor);

  return CONFIG_CAUTELAR.PROCEDIMENTOS_ACEITOS.some(function (aceito) {

    return procedimento === normalizarTextoCautelar_(aceito);

  });

}



function construirIdCautelar_(idConsolidado, numeroLinha) {

  if (valorPreenchidoCautelar_(idConsolidado)) {

    const id = String(idConsolidado).trim().replace(/\s+/g, '-');

    return /^CAU-/i.test(id) ? id : 'CAU-' + id;

  }

  return 'CAU-L' + String(numeroLinha).padStart(5, '0');

}



function construirChaveRegistroCautelar_(linha, mapa) {

  const id = pegarCampoCautelar_(linha, mapa, [CONFIG_CAUTELAR.CABECALHO_ID_MIGRACAO]);

  if (valorPreenchidoCautelar_(id)) return 'id|' + normalizarTextoCautelar_(id);

  return [

    pegarCampoCautelar_(linha, mapa, ['Carimbo de data/hora', 'Column 1']),

    pegarCampoCautelar_(linha, mapa, ['Data de realização do procedimento']),

    pegarCampoCautelar_(linha, mapa, ['Endereço completo', 'Endereço Completo da Cautelar']),

    pegarCampoCautelar_(linha, mapa, ['Status da visita cautelar', 'Qual a visita'])

  ].map(normalizarTextoCautelar_).join('|');

}



function compararCautelaresPorData_(a, b) {

  const dataA = converterParaDataCautelar_(a.data) || converterParaDataCautelar_(a.dataHora);

  const dataB = converterParaDataCautelar_(b.data) || converterParaDataCautelar_(b.dataHora);

  const tempoA = dataA ? dataA.getTime() : 0;

  const tempoB = dataB ? dataB.getTime() : 0;

  if (tempoA !== tempoB) return tempoA - tempoB;

  return normalizarTextoCautelar_(a.id).localeCompare(normalizarTextoCautelar_(b.id));

}



function converterParaDataCautelar_(valor) {

  if (valor instanceof Date && !isNaN(valor.getTime())) return new Date(valor.getTime());

  if (typeof valor === 'number' && isFinite(valor)) {

    if (valor > 20000 && valor < 80000) {

      return new Date(Math.round((valor - 25569) * 86400000));

    }

    if (valor > 100000000000) return new Date(valor);

  }

  const texto = String(valor === null || valor === undefined ? '' : valor).trim();

  if (!texto) return null;

  const brasileira = texto.match(/^(\d{1,2})\\/(\d{1,2})\\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);

  if (brasileira) {

    let ano = Number(brasileira[3]);

    if (ano < 100) ano += 2000;

    const data = new Date(

      ano,

      Number(brasileira[2]) - 1,

      Number(brasileira[1]),

      Number(brasileira[4] || 0),

      Number(brasileira[5] || 0),

      Number(brasileira[6] || 0)

    );

    return isNaN(data.getTime()) ? null : data;

  }

  const data = new Date(texto);

  return isNaN(data.getTime()) ? null : data;

}



function extrairNotaCautelar_(valor) {

  if (!valorPreenchidoCautelar_(valor)) return '';

  if (typeof valor === 'number' && isFinite(valor)) return valor;

  const texto = String(valor).trim();

  if (/^\d+(?:[.,]\d+)?$/.test(texto)) return Number(texto.replace(',', '.'));

  const encontrada = texto.match(/(?:^|\s)(10|[0-9])(?:\s|$)/);

  return encontrada ? Number(encontrada[1]) : valor;

}



function rotularInformacaoCautelar_(rotulo, valor) {

  return valorPreenchidoCautelar_(valor) ? rotulo + ': ' + valor : '';

}



function juntarInformacoesCautelar_(valores) {

  const vistos = {};

  return valores.filter(valorPreenchidoCautelar_).map(function (valor) {

    return String(valor).trim();

  }).filter(function (valor) {

    const chave = normalizarTextoCautelar_(valor);

    if (vistos[chave]) return false;

    vistos[chave] = true;

    return true;

  }).join('\n');

}



function valorPreenchidoCautelar_(valor) {

  if (valor === null || valor === undefined) return false;

  if (valor instanceof Date) return !isNaN(valor.getTime());

  if (Array.isArray(valor)) return valor.some(valorPreenchidoCautelar_);

  return String(valor).trim() !== '';

}



function valorFichaCautelar_(valor, alternativa) {

  return valorPreenchidoCautelar_(valor) ? valor : alternativa;

}



function resumirSimNaoCautelar_(valor) {

  const texto = normalizarTextoCautelar_(valor);

  if (/^(nao|n|false)$/.test(texto) || /nao permit|ausente|sem autorizacao/.test(texto)) return 'Não';

  if (/^(sim|s|true)$/.test(texto) || /permitiu|presente|autoriz/.test(texto)) return 'Sim';

  return valor;

}



function respostaPositivaCautelar_(valor) {

  const texto = normalizarTextoCautelar_(valor);

  if (!texto || /^(nao|n|false)$/.test(texto) || /nao permit|ausente|sem autorizacao/.test(texto)) {

    return false;

  }

  return /^(sim|s|true)$/.test(texto) || /permitiu|presente|autoriz/.test(texto);

}



function normalizarTextoCautelar_(valor) {

  return String(valor === null || valor === undefined ? '' : valor)

    .normalize('NFD')

    .replace(/[\u0300-\u036f]/g, '')

    .toLowerCase()

    .replace(/[^a-z0-9]+/g, ' ')

    .replace(/\s+/g, ' ')

    .trim();

}



function ocultarPaginasCautelares() {

  const arquivo = SpreadsheetApp.getActiveSpreadsheet();

  const consolidada = arquivo.getSheetByName(CONFIG_CAUTELAR.ABA_CONSOLIDADA);

  const outrasVisiveis = arquivo.getSheets().filter(function (aba) {

    return CONFIG_CAUTELAR.ABAS_CAUTELAR.indexOf(aba.getName()) === -1 && !aba.isSheetHidden();

  });

  if (!outrasVisiveis.length && consolidada && consolidada.isSheetHidden()) consolidada.showSheet();

  CONFIG_CAUTELAR.ABAS_CAUTELAR.forEach(function (nome) {

    const aba = arquivo.getSheetByName(nome);

    if (aba && !aba.isSheetHidden()) aba.hideSheet();

  });

  avisarCautelar_('As páginas de cautelares foram ocultadas. Os dados foram preservados.', 'Cautelares');

}



function mostrarPaginasCautelares() {

  const arquivo = SpreadsheetApp.getActiveSpreadsheet();

  CONFIG_CAUTELAR.ABAS_CAUTELAR.forEach(function (nome) {

    const aba = arquivo.getSheetByName(nome);

    if (aba && aba.isSheetHidden()) aba.showSheet();

  });

  avisarCautelar_('As páginas de cautelares estão visíveis.', 'Cautelares');

}



function aoEnviarFormularioCautelares(e) {

  if (typeof sincronizarBaseConsolidada1e3 === 'function') {

    sincronizarBaseConsolidada1e3(e || {origem: 'gatilho de cautelares'});

    atualizarVistoriasCautelares({baseJaSincronizada: true, silencioso: true});

    return;

  }

  atualizarVistoriasCautelares({silencioso: true});

}



function removerAutomacaoCautelares() {

  const removidos = removerGatilhosCautelares_(true);

  avisarCautelar_(removidos + ' gatilho(s) de cautelares removido(s).', 'Cautelares');

}



function removerGatilhosCautelares_(mostrarAviso) {

  const funcoes = ['aoAbrirCautelares', 'aoEnviarFormularioCautelares'];

  let removidos = 0;

  ScriptApp.getProjectTriggers().forEach(function (gatilho) {

    if (funcoes.indexOf(gatilho.getHandlerFunction()) !== -1) {

      ScriptApp.deleteTrigger(gatilho);

      removidos++;

    }

  });

  if (mostrarAviso && !removidos) {

    avisarCautelar_('Não havia gatilhos de cautelares instalados.', 'Cautelares');

  }

  return removidos;

}



function avisarCautelar_(mensagem, titulo) {

  try {

    SpreadsheetApp.getActiveSpreadsheet().toast(mensagem, titulo || 'Cautelares', 6);

  } catch (erro) {

    console.log((titulo || 'Cautelares') + ': ' + mensagem);

  }

}
