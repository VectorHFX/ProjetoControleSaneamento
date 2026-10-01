/**

 * PROCEDIMENTOS DE CAMPO 3.0

 * Consolida os registros de "Relato de atividade" em uma aba visual.

 * Fonte exclusiva dos dados: Base Consolidada.

 *

 * Versão ajustada para os novos campos do formulário (linha 51):

 * - horário de entrada e de saída;

 * - clima e tempo;

 * - quantidade de panfletos;

 * - ocorrência de interrupção;

 * - horários relacionados à interrupção.

 *

 * A aba original de respostas não é alterada.

 * Os indicadores são calculados em JavaScript, sem fórmulas dependentes

 * dos separadores regionais "," ou ";".

 */

const CONFIG_RELATOS = {

  ABA_CONSOLIDADA: 'Base Consolidada',

  ABA_DESTINO: 'Relatos de Atividade',

  CABECALHO_PROCEDIMENTO: 'Selecione o procedimento a ser executado',

  VALOR_PROCEDIMENTO: 'Relato de atividade',

  CABECALHO_ID_MIGRACAO: 'ID de migração',

  ABAS_TECNICAS: [

    'Base Consolidada',

    'Importação Bruta 1.0',

    'Importação Histórica 1.0',

    'Importação Histórica 2.0',

    'Auditoria Migração 1.0',

    'Resumo Integração 1.0 e 3.0',

    'Resumo da Migração',

    'Auditoria Migração 2.0'

  ],

  PRIMEIRA_LINHA_DADOS: 12

};



const CAMPOS_RELATOS = [

  { saida: 'Data e hora do registro', origem: 'Carimbo de data/hora', tipo: 'data_hora' },

  { saida: 'Data da atividade', origem: 'Data de realização do procedimento', tipo: 'data' },

  { saida: 'Bairro', origem: 'Bairro de realização do procedimento' },

  { saida: 'Área responsável', origem: 'Área responsável pelo procedimento' },

  { saida: 'Responsável pelo registro', origem: 'Colaborador responsável pelo registro' },

  { saida: 'Atividade realizada', origem: 'Atividade realizada' },

  { saida: 'Complemento da atividade', origem: 'Complemento da atividade' },

  { saida: 'Frente de serviço', origem: 'Título da frente de serviço' },

  { saida: 'Endereço', origem: 'Endereço da frente de serviço' },

  { saida: 'Classificação', origem: 'Classificação da atividade' },

  { saida: 'Público-alvo', origem: 'Público-alvo da atividade' },

  { saida: 'Participantes', origem: 'Total de participantes', tipo: 'numero' },

  { saida: 'Ferramentas', origem: 'Ferramenta' },

  { saida: 'Colaboradores de apoio', origem: 'Colaboradores de apoio na atividade' },

  { saida: 'Deslocamento', origem: 'Como que você chegou na atividade?' },

  {

    saida: 'Pessoas no veículo',

    origem: 'Quantas pessoas estavam no veículo com você no inicio dessa atividade.',

    tipo: 'numero'

  },

  { saida: 'Horário de entrada', origem: 'Horário de entrada na atividade', tipo: 'hora' },

  { saida: 'Horário de saída', origem: 'Horário de saída na atividade', tipo: 'hora' },

  { saida: 'Clima e tempo', origem: 'Clima e tempo durante a atividade' },

  {

    saida: 'Panfletos entregues',

    origem: 'Quantidade de panfletos entregues',

    tipo: 'numero'

  },

  { saida: 'Houve interrupção?', origem: 'Houve interrupção da atividade?' },

  {

    saida: 'Horários da interrupção',

    origens: [

      'Indique os horários de entrada e saída da atividade',

      'Indique os horários da interrupção da atividade',

      'Informe o horário de início e fim da interrupção'

    ],

    obrigatorio: false

  },

  { saida: 'Objetivo da atividade', origem: 'Objetivo da atividade' },

  { saida: 'Relato da atividade', origem: 'Relato da atividade' },

  { saida: 'Observação final', origem: 'Observação final do procedimento' },

  { saida:'Descrição da interrupção', origens:["Descreva qual foi a interrução", "Descreva qual foi a interrupção", "Qual foi a interrupção da atividade?"], obrigatorio:false }

];



function aoAbrirMenuRelatos() {

  criarMenuRelatos_();

}



function criarMenuRelatos_() {

  try {

    SpreadsheetApp.getUi()

      .createMenu('Relatos')

      .addItem('Atualizar painel de relatos', 'atualizarRelatosDeAtividade').addItem('Relatos ilustrados das ações sociais','abrirRelatosSociais')

      .addItem('Ativar atualização automática', 'instalarGatilhoRelatos')

      .addSeparator()

      .addItem('Ocultar abas técnicas', 'ocultarAbasTecnicasRelatos')

      .addItem('Mostrar abas técnicas', 'mostrarAbasTecnicasRelatos')

      .addSeparator()

      .addItem('Remover atualização automática', 'removerGatilhoRelatos')

      .addToUi();

    return true;

  } catch (erro) {

    return false;

  }

}



function atualizarRelatosDeAtividade(opcoes) {

  opcoes = opcoes || {};

  if (!opcoes.baseJaSincronizada && typeof sincronizarBaseConsolidada1e3 === 'function') {

    sincronizarBaseConsolidada1e3({origem: 'relatos'});

  }



  const bloqueio = LockService.getDocumentLock();

  bloqueio.waitLock(30000);



  try {

    const arquivo = SpreadsheetApp.getActiveSpreadsheet();

    const registros = lerRegistrosConsolidadosRelatos_(arquivo);

    const linhasConsolidadas = registros.map(function (registro) {

      return [registro.id].concat(registro.valores);

    });



    const indicadores = calcularIndicadoresRelatos_(linhasConsolidadas);

    let destino = arquivo.getSheetByName(CONFIG_RELATOS.ABA_DESTINO);

    const novaAba = !destino;

    if (!destino) destino = arquivo.insertSheet(CONFIG_RELATOS.ABA_DESTINO, 1);



    prepararAba_(destino, linhasConsolidadas.length);

    escreverPainel_(destino, linhasConsolidadas, indicadores);

    formatarPainel_(destino, linhasConsolidadas.length);

    if (novaAba) destino.setTabColor('#123B5D');



    if (!opcoes.silencioso) {

      arquivo.toast(linhasConsolidadas.length + ' relato(s) consolidado(s).', 'Painel atualizado', 5);

    }

  } finally {

    bloqueio.releaseLock();

  }

}



function lerRegistrosConsolidadosRelatos_(arquivo) {

  const abaConsolidada = arquivo.getSheetByName(CONFIG_RELATOS.ABA_CONSOLIDADA);

  if (!abaConsolidada) {

    throw new Error(

      'A aba "' + CONFIG_RELATOS.ABA_CONSOLIDADA + '" não foi encontrada. ' +

      'Execute primeiro a integração dos procedimentos.'

    );

  }



  const dados = abaConsolidada.getDataRange().getValues();

  if (dados.length < 2) return [];



  const indices = montarMapaDeCabecalhos_(dados[0]);

  validarCampos_(indices);

  const indiceProcedimento = indices[normalizarTexto_(CONFIG_RELATOS.CABECALHO_PROCEDIMENTO)];

  const indiceIdMigracao = indices[normalizarTexto_(CONFIG_RELATOS.CABECALHO_ID_MIGRACAO)];

  const registros = [];

  const chavesVistas = {};



  for (let i = 1; i < dados.length; i++) {

    const linha = dados[i];

    if (normalizarTexto_(linha[indiceProcedimento]) !== normalizarTexto_(CONFIG_RELATOS.VALOR_PROCEDIMENTO)) {

      continue;

    }



    const valores = CAMPOS_RELATOS.map(function (campo) {

      const indiceCampo = localizarIndiceCampo_(indices, campo);

      const valor = indiceCampo === undefined ? '' : linha[indiceCampo];

      return campo.tipo === 'numero' ? extrairNumero_(valor) : valor;

    });

    const idMigracao = indiceIdMigracao === undefined ? '' : String(linha[indiceIdMigracao] || '').trim();

    const chave = idMigracao

      ? 'id|' + normalizarTexto_(idMigracao)

      : 'dados|' + construirChaveRegistroRelatos_(valores);

    if (chavesVistas[chave]) continue;

    chavesVistas[chave] = true;



    registros.push({

      id: idMigracao || 'REL-BASE-' + String(i + 1).padStart(4, '0'),

      valores: valores

    });

  }



  const indiceData = CAMPOS_RELATOS.findIndex(function (campo) { return campo.saida === 'Data da atividade'; });

  const indiceRegistro = CAMPOS_RELATOS.findIndex(function (campo) { return campo.saida === 'Data e hora do registro'; });

  registros.sort(function (a, b) {

    const dataA = converterParaData_(a.valores[indiceData]);

    const dataB = converterParaData_(b.valores[indiceData]);

    const diferencaData = (dataA ? dataA.getTime() : 0) - (dataB ? dataB.getTime() : 0);

    if (diferencaData) return diferencaData;

    const registroA = converterParaData_(a.valores[indiceRegistro]);

    const registroB = converterParaData_(b.valores[indiceRegistro]);

    const diferencaRegistro = (registroA ? registroA.getTime() : 0) - (registroB ? registroB.getTime() : 0);

    return diferencaRegistro || a.id.localeCompare(b.id);

  });

  return registros;

}



function construirChaveRegistroRelatos_(valores) {

  const campos = [

    'Data e hora do registro',

    'Data da atividade',

    'Responsável pelo registro',

    'Atividade realizada',

    'Complemento da atividade',

    'Endereço',

    'Relato da atividade'

  ];

  return campos.map(function (nome) {

    const indice = CAMPOS_RELATOS.findIndex(function (campo) { return campo.saida === nome; });

    const valor = indice < 0 ? '' : valores[indice];

    const data = nome.indexOf('Data') === 0 ? converterParaData_(valor) : null;

    return data ? String(data.getTime()) : normalizarTexto_(valor);

  }).join('|');

}



function escreverPainel_(aba, linhas, indicadores) {

  aba.getRange('A1').setValue('RELATOS DE ATIVIDADE');

  aba.getRange('A2').setValue('Painel consolidado dos registros de campo: Consórcio Performance Tamanduateí');

  aba.getRange('A3').setValue(

    'Base composta pelos registros integrados dos Procedimentos 1.0, 2.0 e 3.0. ' +

    'A página de respostas do Forms permanece preservada e sem inserções manuais.'

  );



  const cartoes = [

    ['A5:E5', 'A6:E7', 'TOTAL DE RELATOS', indicadores.totalRelatos],

    ['F5:J5', 'F6:J7', 'PESSOAS ALCANÇADAS', indicadores.pessoasAlcancadas],

    ['K5:O5', 'K6:O7', 'AÇÕES EXTERNAS', indicadores.acoesExternas],

    ['P5:T5', 'P6:T7', 'AÇÕES INTERNAS', indicadores.acoesInternas],

    ['U5:Z5', 'U6:Z7', 'ÚLTIMO REGISTRO', indicadores.ultimoRegistro || '']

  ];

  cartoes.forEach(function (cartao) {

    aba.getRange(cartao[0]).merge().setValue(cartao[2]);

    aba.getRange(cartao[1]).merge().setValue(cartao[3]);

  });



  aba.getRange('A9:Z9').merge().setValue('BASE CONSOLIDADA DOS RELATOS');

  [

    ['A10:C10', 'REGISTRO'],

    ['D10:F10', 'RESPONSABILIDADE'],

    ['G10:J10', 'ATIVIDADE E LOCAL'],

    ['K10:M10', 'PÚBLICO E ALCANCE'],

    ['N10:Q10', 'RECURSOS E LOGÍSTICA'],

    ['R10:W10', 'TEMPO E EXECUÇÃO'],

    ['X10:Z10', 'CONTEÚDO TÉCNICO']

  ].forEach(function (grupo) {

    aba.getRange(grupo[0]).merge().setValue(grupo[1]);

  });



  const cabecalhos = ['ID'].concat(CAMPOS_RELATOS.map(function (campo) { return campo.saida; }));

  aba.getRange(11, 1, 1, cabecalhos.length).setValues([cabecalhos]);

  if (linhas.length) {

    aba.getRange(CONFIG_RELATOS.PRIMEIRA_LINHA_DADOS, 1, linhas.length, cabecalhos.length).setValues(linhas);

  }

}



function calcularIndicadoresRelatos_(linhas) {

  const indiceRegistro = obterIndiceSaida_('Data e hora do registro');

  const indiceClassificacao = obterIndiceSaida_('Classificação');

  const indiceParticipantes = obterIndiceSaida_('Participantes');

  let pessoasAlcancadas = 0;

  let acoesExternas = 0;

  let acoesInternas = 0;

  let ultimoRegistro = null;



  linhas.forEach(function (linha) {

    pessoasAlcancadas += Number(linha[indiceParticipantes]) || 0;



    const classificacao = normalizarTexto_(linha[indiceClassificacao]);

    if (classificacao === 'externa') acoesExternas++;

    if (classificacao === 'interna') acoesInternas++;



    const data = converterParaData_(linha[indiceRegistro]);

    if (data && (!ultimoRegistro || data.getTime() > ultimoRegistro.getTime())) ultimoRegistro = data;

  });



  return {

    totalRelatos: linhas.length,

    pessoasAlcancadas: pessoasAlcancadas,

    acoesExternas: acoesExternas,

    acoesInternas: acoesInternas,

    ultimoRegistro: ultimoRegistro

  };

}



function obterIndiceSaida_(nomeDaSaida) {

  const indice = CAMPOS_RELATOS.findIndex(function (campo) {

    return campo.saida === nomeDaSaida;

  });

  if (indice < 0) throw new Error('Campo de saída não configurado: ' + nomeDaSaida);

  return indice + 1;

}



function converterParaData_(valor) {

  if (valor instanceof Date && !isNaN(valor.getTime())) return valor;



  if (typeof valor === 'number' && isFinite(valor)) {

    return new Date(Math.round((valor - 25569) * 86400000));

  }



  const texto = String(valor || '').trim();

  const brasileiro = texto.match(

    /^(\d{1,2})\\/(\d{1,2})\\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/

  );

  if (brasileiro) {

    return new Date(

      Number(brasileiro[3]),

      Number(brasileiro[2]) - 1,

      Number(brasileiro[1]),

      Number(brasileiro[4] || 0),

      Number(brasileiro[5] || 0),

      Number(brasileiro[6] || 0)

    );

  }



  const interpretada = new Date(texto);

  return isNaN(interpretada.getTime()) ? null : interpretada;

}



function formatarPainel_(aba, quantidadeDeRelatos) {

  aba.getRange('AA10').setValue('INTERRUPÇÃO').setBackground('#B06B2D').setFontColor('#FFFFFF').setFontWeight('bold');

  const primeiraLinha = CONFIG_RELATOS.PRIMEIRA_LINHA_DADOS;

  const ultimaLinha = Math.max(primeiraLinha, primeiraLinha + quantidadeDeRelatos - 1);



  aba.setHiddenGridlines(true);

  aba.setFrozenRows(11);

  aba.setFrozenColumns(0);

  aba.getRange('A1:Z' + ultimaLinha)

    .setFontFamily('Arial').setFontSize(10).setFontColor('#233247').setVerticalAlignment('top');



  aba.getRange('A1:Z3').setBackground('#123B5D');

  aba.getRange('A1:Z1').setFontSize(22).setFontWeight('bold').setFontColor('#FFFFFF').setVerticalAlignment('middle');

  aba.getRange('A2:Z2').setFontSize(12).setFontColor('#D8EAF5').setVerticalAlignment('middle');

  aba.getRange('A3:Z3').setFontSize(9).setFontStyle('italic').setFontColor('#AFCBDB').setVerticalAlignment('middle');

  aba.setRowHeight(1, 42);

  aba.setRowHeight(2, 25);

  aba.setRowHeight(3, 24);

  aba.setRowHeight(4, 12);



  const cartoes = [

    ['A5:E5', 'A6:E7', '#1976A3'],

    ['F5:J5', 'F6:J7', '#0B8F87'],

    ['K5:O5', 'K6:O7', '#2F6EB3'],

    ['P5:T5', 'P6:T7', '#6C63A8'],

    ['U5:Z5', 'U6:Z7', '#D18336']

  ];

  cartoes.forEach(function (cartao) {

    aba.getRange(cartao[0])

      .setBackground(cartao[2]).setFontColor('#FFFFFF').setFontSize(9).setFontWeight('bold')

      .setHorizontalAlignment('center').setVerticalAlignment('middle');

    aba.getRange(cartao[1])

      .setBackground('#FFFFFF').setFontColor(cartao[2]).setFontSize(20).setFontWeight('bold')

      .setHorizontalAlignment('center').setVerticalAlignment('middle')

      .setBorder(true, true, true, true, false, false, '#CDD8E3', SpreadsheetApp.BorderStyle.SOLID);

  });

  aba.getRange('U6:Z7').setNumberFormat('dd/MM/yyyy HH:mm');

  aba.setRowHeights(5, 1, 24);

  aba.setRowHeights(6, 2, 28);

  aba.setRowHeight(8, 12);



  aba.getRange('A9:Z9')

    .setBackground('#DCEAF4').setFontColor('#123B5D').setFontSize(11).setFontWeight('bold')

    .setVerticalAlignment('middle')

    .setBorder(true, true, true, true, false, false, '#AFC6D8', SpreadsheetApp.BorderStyle.SOLID);

  aba.setRowHeight(9, 28);



  const grupos = [

    ['A10:C10', 'A11:C11', '#4B6584', '#E9EEF5'],

    ['D10:F10', 'D11:F11', '#24757D', '#E5F1F1'],

    ['G10:J10', 'G11:J11', '#196FA5', '#E4F0F8'],

    ['K10:M10', 'K11:M11', '#178594', '#E3F2F3'],

    ['N10:Q10', 'N11:Q11', '#596AA0', '#EAECF5'],

    ['R10:W10', 'R11:W11', '#B06B2D', '#F8EEE5'],

    ['X10:Z10', 'X11:Z11', '#304C6D', '#E7EBF0']

  ];

  grupos.forEach(function (grupo) {

    aba.getRange(grupo[0])

      .setBackground(grupo[2]).setFontColor('#FFFFFF').setFontSize(9).setFontWeight('bold')

      .setHorizontalAlignment('center').setVerticalAlignment('middle');

    aba.getRange(grupo[1])

      .setBackground(grupo[3]).setFontColor(grupo[2]).setFontSize(9).setFontWeight('bold')

      .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true)

      .setBorder(false, false, true, false, true, true, grupo[2], SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  });

  aba.setRowHeight(10, 24);

  aba.setRowHeight(11, 48);



  if (quantidadeDeRelatos) {

    const totalColunas = 1 + CAMPOS_RELATOS.length;

    const corpo = aba.getRange(primeiraLinha, 1, quantidadeDeRelatos, totalColunas);

    corpo.setFontSize(9).setWrap(true).setVerticalAlignment('top');

    const fundos = [];

    for (let i = 0; i < quantidadeDeRelatos; i++) {

      fundos.push(new Array(totalColunas).fill(i % 2 === 0 ? '#FFFFFF' : '#F3F7FA'));

    }

    corpo.setBackgrounds(fundos);

    aba.setRowHeights(primeiraLinha, quantidadeDeRelatos, 72);



    aba.getRange('A' + primeiraLinha + ':A' + ultimaLinha)

      .setHorizontalAlignment('center').setVerticalAlignment('middle').setFontWeight('bold').setFontColor('#36566F');

    aba.getRange('B' + primeiraLinha + ':B' + ultimaLinha)

      .setNumberFormat('dd/MM/yyyy HH:mm').setHorizontalAlignment('center').setVerticalAlignment('middle');

    aba.getRange('C' + primeiraLinha + ':C' + ultimaLinha)

      .setNumberFormat('dd/MM/yyyy').setHorizontalAlignment('center').setVerticalAlignment('middle');

    aba.getRange('K' + primeiraLinha + ':K' + ultimaLinha)

      .setHorizontalAlignment('center').setVerticalAlignment('middle').setFontWeight('bold');

    aba.getRange('M' + primeiraLinha + ':M' + ultimaLinha)

      .setNumberFormat('0').setHorizontalAlignment('center').setVerticalAlignment('middle')

      .setFontSize(11).setFontWeight('bold').setFontColor('#0D6474');

    aba.getRange('Q' + primeiraLinha + ':Q' + ultimaLinha)

      .setNumberFormat('0').setHorizontalAlignment('center').setVerticalAlignment('middle');

    aba.getRange('R' + primeiraLinha + ':S' + ultimaLinha)

      .setNumberFormat('HH:mm').setHorizontalAlignment('center').setVerticalAlignment('middle');

    aba.getRange('T' + primeiraLinha + ':T' + ultimaLinha)

      .setHorizontalAlignment('center').setVerticalAlignment('middle');

    aba.getRange('U' + primeiraLinha + ':U' + ultimaLinha)

      .setNumberFormat('0').setHorizontalAlignment('center').setVerticalAlignment('middle')

      .setFontWeight('bold').setFontColor('#A35B13');

    aba.getRange('V' + primeiraLinha + ':V' + ultimaLinha)

      .setHorizontalAlignment('center').setVerticalAlignment('middle').setFontWeight('bold');

    aba.getRange('Y' + primeiraLinha + ':Y' + ultimaLinha).setBackground('#FFFDF4');

    aba.getRange('Z' + primeiraLinha + ':Z' + ultimaLinha)

      .setBackground('#F9F7FC').setFontStyle('italic').setFontColor('#4D4A60');



    aplicarFormatacaoCondicional_(aba, primeiraLinha, ultimaLinha);

    aba.getRange(11, 1, quantidadeDeRelatos + 1, totalColunas).createFilter();

  }



  const larguras = [

    88, 132, 105, 120, 115, 190, 205, 245, 210, 220,

    118, 205, 92, 220, 270, 215, 105, 100, 100, 130,

    115, 118, 240, 285, 410, 300, 360

  ];

  larguras.forEach(function (largura, indice) { aba.setColumnWidth(indice + 1, largura); });

}



function aplicarFormatacaoCondicional_(aba, primeiraLinha, ultimaLinha) {

  const classificacao = aba.getRange('K' + primeiraLinha + ':K' + ultimaLinha);

  const participantes = aba.getRange('M' + primeiraLinha + ':M' + ultimaLinha);

  const interrupcao = aba.getRange('V' + primeiraLinha + ':V' + ultimaLinha);

  const regras = [

    SpreadsheetApp.newConditionalFormatRule()

      .whenTextEqualTo('Externa').setBackground('#DCECF8').setFontColor('#175A88').setBold(true)

      .setRanges([classificacao]).build(),

    SpreadsheetApp.newConditionalFormatRule()

      .whenTextEqualTo('Interna').setBackground('#DFF2E8').setFontColor('#24734C').setBold(true)

      .setRanges([classificacao]).build(),

    SpreadsheetApp.newConditionalFormatRule()

      .whenTextEqualTo('Interna e Externa').setBackground('#FCE9D6').setFontColor('#A35B13').setBold(true)

      .setRanges([classificacao]).build(),

    SpreadsheetApp.newConditionalFormatRule()

      .setGradientMinpoint('#FFFFFF').setGradientMaxpoint('#70D6E0')

      .setRanges([participantes]).build(),

    SpreadsheetApp.newConditionalFormatRule()

      .whenTextEqualTo('Sim').setBackground('#FDE4E1').setFontColor('#A33A2B').setBold(true)

      .setRanges([interrupcao]).build(),

    SpreadsheetApp.newConditionalFormatRule()

      .whenTextEqualTo('Não').setBackground('#E3F2E9').setFontColor('#24734C').setBold(true)

      .setRanges([interrupcao]).build()

  ];

  aba.setConditionalFormatRules(regras);

}



function prepararAba_(aba, quantidadeDeRelatos) {

  if (aba.getFilter()) aba.getFilter().remove();

  aba.setFrozenRows(0);

  aba.setFrozenColumns(0);

  aba.getRange(1, 1, aba.getMaxRows(), aba.getMaxColumns()).breakApart();

  aba.clear();

  aba.setConditionalFormatRules([]);



  const totalColunas = 1 + CAMPOS_RELATOS.length;

  const linhasNecessarias = Math.max(33, CONFIG_RELATOS.PRIMEIRA_LINHA_DADOS + quantidadeDeRelatos);

  if (aba.getMaxRows() < linhasNecessarias) {

    aba.insertRowsAfter(aba.getMaxRows(), linhasNecessarias - aba.getMaxRows());

  }

  if (aba.getMaxColumns() < totalColunas) {

    aba.insertColumnsAfter(aba.getMaxColumns(), totalColunas - aba.getMaxColumns());

  }

  aba.getRange('A1:Z1').merge();

  aba.getRange('A2:Z2').merge();

  aba.getRange('A3:Z3').merge();

}



function montarMapaDeCabecalhos_(cabecalhos) {

  const mapa = {};

  cabecalhos.forEach(function (cabecalho, indice) {

    mapa[normalizarTexto_(cabecalho)] = indice;

  });

  return mapa;

}



function validarCampos_(indices) {

  const ausentes = [];



  if (indices[normalizarTexto_(CONFIG_RELATOS.CABECALHO_PROCEDIMENTO)] === undefined) {

    ausentes.push(CONFIG_RELATOS.CABECALHO_PROCEDIMENTO);

  }



  CAMPOS_RELATOS.forEach(function (campo) {

    if (campo.obrigatorio === false) return;

    if (localizarIndiceCampo_(indices, campo) === undefined) {

      ausentes.push(obterOrigensCampo_(campo)[0]);

    }

  });



  if (ausentes.length) {

    throw new Error('Campos não encontrados na aba de respostas:\n- ' + ausentes.join('\n- '));

  }

}



function localizarIndiceCampo_(indices, campo) {

  const origens = obterOrigensCampo_(campo);

  for (let i = 0; i < origens.length; i++) {

    const indice = indices[normalizarTexto_(origens[i])];

    if (indice !== undefined) return indice;

  }

  return undefined;

}



function obterOrigensCampo_(campo) {

  if (Array.isArray(campo.origens) && campo.origens.length) {

    return campo.origens;

  }

  return [campo.origem];

}



function extrairNumero_(valor) {

  if (typeof valor === 'number') return isFinite(valor) ? valor : 0;

  const texto = String(valor || '').trim();

  if (!texto) return 0;

  const encontrado = texto.replace(',', '.').match(/-?\d+(?:\\.\d+)?/);

  return encontrado ? Number(encontrado[0]) : 0;

}



function normalizarTexto_(texto) {

  return String(texto || '')

    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    .replace(/\s+/g, ' ').trim().toLowerCase();

}



function aoEnviarFormularioRelatos(e) {

  if (typeof sincronizarBaseConsolidada1e3 === 'function') {

    sincronizarBaseConsolidada1e3(e || {origem:'gatilho de relatos'});

    atualizarRelatosDeAtividade({baseJaSincronizada:true,silencioso:true});

  } else atualizarRelatosDeAtividade({silencioso:true});

  if(typeof gerarRelatoSocialDoEnvio==='function')gerarRelatoSocialDoEnvio(e);

}



function ocultarAbasTecnicasRelatos() {

  alterarVisibilidadeAbasTecnicasRelatos_(true);

}



function mostrarAbasTecnicasRelatos() {

  alterarVisibilidadeAbasTecnicasRelatos_(false);

}



function alterarVisibilidadeAbasTecnicasRelatos_(ocultar) {

  const arquivo = SpreadsheetApp.getActiveSpreadsheet();

  let alteradas = 0;

  CONFIG_RELATOS.ABAS_TECNICAS.forEach(function (nome) {

    const aba = arquivo.getSheetByName(nome);

    if (!aba) return;

    try {

      if (ocultar && !aba.isSheetHidden()) {

        aba.hideSheet();

        alteradas++;

      }

      if (!ocultar && aba.isSheetHidden()) {

        aba.showSheet();

        alteradas++;

      }

    } catch (erro) {

      Logger.log('Não foi possível alterar a visibilidade da aba "' + nome + '": ' + erro.message);

    }

  });

  notificarRelatos_(

    arquivo,

    alteradas

      ? alteradas + ' aba(s) técnica(s) ' + (ocultar ? 'ocultada(s).' : 'exibida(s).')

      : 'Nenhuma alteração de visibilidade foi necessária.'

  );

}



function instalarGatilhoRelatos() {

  removerGatilhoRelatos_(false);

  const arquivo = SpreadsheetApp.getActiveSpreadsheet();

  ScriptApp.newTrigger('aoAbrirMenuRelatos')

    .forSpreadsheet(arquivo).onOpen().create();



  if (typeof aoEnviarFormularioIntegracaoProcedimentos !== 'function') {

    ScriptApp.newTrigger('aoEnviarFormularioRelatos')

      .forSpreadsheet(arquivo).onFormSubmit().create();

  }



  atualizarRelatosDeAtividade();

  notificarRelatos_(

    arquivo,

    typeof aoEnviarFormularioIntegracaoProcedimentos === 'function'

      ? 'Relatos vinculados à integração central e atualizados.'

      : 'Atualização automática dos relatos ativada.'

  );

}



function removerGatilhoRelatos() {

  removerGatilhoRelatos_(true);

}



function removerGatilhoRelatos_(mostrarAviso) {

  ScriptApp.getProjectTriggers().forEach(function (gatilho) {

    const funcao = gatilho.getHandlerFunction();

    if (funcao === 'aoEnviarFormularioRelatos' || funcao === 'aoAbrirMenuRelatos') {

      ScriptApp.deleteTrigger(gatilho);

    }

  });

  if (mostrarAviso) {

    notificarRelatos_(SpreadsheetApp.getActiveSpreadsheet(), 'Atualização automática removida.');

  }

}



function notificarRelatos_(arquivo, mensagem) {

  try {

    if (arquivo) arquivo.toast(mensagem, 'Relatos', 6);

  } catch (erro) {

    Logger.log(mensagem);

  }

}
