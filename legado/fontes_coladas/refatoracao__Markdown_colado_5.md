/**

 * PROCEDIMENTOS DE CAMPO 3.0 -> RDAS | Sincronização 1.5

 * Gera as fichas nativas clássicas e mantém a atualização automática.

 * A Visão executiva foi transferida para o Apps Script da planilha RDAS.

 *

 * Instale este código no Apps Script da planilha de respostas do formulário.

 * A planilha de Procedimentos é usada somente como fonte.

 * As novas respostas são lidas diretamente do Forms e os registros históricos

 * validados são lidos da Base Consolidada, mesmo quando essa aba estiver oculta.

 *

 * No RDAS, o código cria uma aba para cada data. Cada aba contém:

 * 1. uma ficha diária consolidada;

 * 2. uma ficha individual para cada relato registrado naquele dia;

 * 3. até cinco fotos incorporadas automaticamente a partir do formulário.

 *

 * Não são usadas fórmulas, portanto o código não depende de "," ou ";".

 * Registros repetidos entre as fontes são removidos antes da criação das fichas.

 */

const CONFIG_RDAS = {

  PLANILHA_DESTINO_ID: '176BymNYBSfVt7iQrkNR-IyT_NXdB9GC999mX9C2WtK4',

  ABA_ORIGEM: 'Respostas ao formulário 1',

  ABA_HISTORICO: 'Base Consolidada',

  ABA_HISTORICO_RESERVA: 'Importação Histórica 2.0',

  CABECALHO_PROCEDIMENTO: 'Selecione o procedimento a ser executado',

  VALOR_PROCEDIMENTO: 'Relato de atividade',

  CABECALHO_ORIGEM_REGISTRO: 'Origem do registro',

  VALOR_ORIGEM_HISTORICO: 'Histórico 2.0',

  CABECALHO_ID_MIGRACAO: 'ID de migração',

  CABECALHO_FOTOS: 'Adicione até 5 fotos com timestamp da atividade',

  PREFIXO_ABA_DIA: 'RDAS ',

  EMPRESA: 'Consórcio Performance Tamanduateí',

  CONTRATO: 'RFP 00725/24 - Pacote 16',

  ABAS_LEGADAS: [

    'Consolidado por Dia',

    'Resumo Diário',

    'RDO da Execução',

    'RDO Diário',

    'Relatos por Execução',

    'Fotos dos Relatos'

  ]

};



const CAMPOS_RDAS = {

  registro: 'Carimbo de data/hora',

  data: 'Data de realização do procedimento',

  bairro: 'Bairro de realização do procedimento',

  area: 'Área responsável pelo procedimento',

  responsavel: 'Colaborador responsável pelo registro',

  atividade: 'Atividade realizada',

  complemento: 'Complemento da atividade',

  frente: 'Título da frente de serviço',

  endereco: 'Endereço da frente de serviço',

  classificacao: 'Classificação da atividade',

  publico: 'Público-alvo da atividade',

  participantes: 'Total de participantes',

  ferramentas: 'Ferramenta',

  apoio: 'Colaboradores de apoio na atividade',

  deslocamento: 'Como que você chegou na atividade?',

  pessoasVeiculo: 'Quantas pessoas estavam no veículo com você no inicio dessa atividade.',

  entrada: 'Horário de entrada na atividade',

  saida: 'Horário de saída na atividade',

  clima: 'Clima e tempo durante a atividade',

  panfletos: 'Quantidade de panfletos entregues',

  interrupcao: 'Houve interrupção da atividade?',

  motivoInterrupcao: ["Descreva qual foi a interrução", "Descreva qual foi a interrupção", "Qual foi a interrupção da atividade?"],

  horariosInterrupcao: [

    'Indique os horários de entrada e saída da atividade',

    'Indique os horários da interrupção da atividade',

    'Informe o horário de início e fim da interrupção'

  ],

  objetivo: 'Objetivo da atividade',

  relato: 'Relato da atividade',

  observacao: 'Observação final do procedimento',

  fotos: 'Adicione até 5 fotos com timestamp da atividade'

};



function instalarSistemaRDAS() {

  removerGatilhosRDAS_(false);

  const origem = SpreadsheetApp.getActiveSpreadsheet();

  if (!origem) throw new Error('Abra o Apps Script a partir da planilha de Procedimentos de Campo.');

  ScriptApp.newTrigger('aoEnviarFormularioRDAS').forSpreadsheet(origem).onFormSubmit().create();

  criarMenuRDAS_();

  atualizarTresDiasMaisRecentesRDAS();

  notificarRDAS_(origem, 'Sincronização RDAS 1.4 instalada. Os três dias mais recentes foram atualizados.');

}



function criarMenuRDAS_() {

  try {

    SpreadsheetApp.getUi()

      .createMenu('RDAS • Sincronização')

      .addItem('Atualizar os 3 dias mais recentes', 'atualizarTresDiasMaisRecentesRDAS')

      .addItem('Atualizar o dia mais recente', 'atualizarDiaMaisRecenteRDAS')

      .addItem('Atualizar todas as fichas', 'atualizarTodasAsFichasRDAS')

      .addItem('Diagnóstico das fotos', 'diagnosticarFotosRDAS')

      .addSeparator()

      .addItem('Instalar atualização automática', 'instalarSistemaRDAS')

      .addItem('Remover atualização automática', 'removerGatilhosRDAS')

      .addToUi();

    return true;

  } catch (erro) {

    return false;

  }

}



function aoEnviarFormularioRDAS(e) {

  const linhaOrigem = e && e.range ? e.range.getRow() : 0;

  atualizarDiaMaisRecenteRDAS(linhaOrigem);

}



function atualizarTodasAsFichasRDAS() {

  const bloqueio = LockService.getScriptLock();

  bloqueio.waitLock(30000);

  try {

    const origem = SpreadsheetApp.getActiveSpreadsheet();

    const destino = SpreadsheetApp.openById(CONFIG_RDAS.PLANILHA_DESTINO_ID);

    const fuso = origem.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || 'America/Sao_Paulo';

    const relatos = lerRelatosRDAS_(origem, fuso);

    if (!relatos.length) throw new Error('Nenhum registro classificado como "Relato de atividade" foi encontrado.');

    const dias = consolidarRelatosPorDiaRDAS_(relatos, fuso);

    const resultados = dias.map(function (dia) { return construirAbaDoDiaRDAS_(destino, dia, fuso); });

    removerAbasGeradasSemDadosRDAS_(destino, dias, fuso);

    removerAbasLegadasRDAS_(destino);

    ordenarAbasPorDataRDAS_(destino, dias, fuso);

    notificarRDAS_(origem, relatos.length + ' relato(s) organizados em ' + dias.length + ' ficha(s) diária(s).');

    return resultados;

  } finally {

    bloqueio.releaseLock();

  }

}



function atualizarDiaMaisRecenteRDAS(linhaOrigem) {

  const bloqueio = LockService.getScriptLock();

  bloqueio.waitLock(30000);

  try {

    const origem = SpreadsheetApp.getActiveSpreadsheet();

    const destino = SpreadsheetApp.openById(CONFIG_RDAS.PLANILHA_DESTINO_ID);

    const fuso = origem.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || 'America/Sao_Paulo';

    const relatos = lerRelatosRDAS_(origem, fuso);

    const dias = consolidarRelatosPorDiaRDAS_(relatos, fuso);

    if (!dias.length) throw new Error('Nenhum relato foi encontrado.');

    let diaAtualizado = dias[0];

    if (linhaOrigem) {

      const relatoEnviado = relatos.filter(function (relato) { return relato.linhaOrigem === Number(linhaOrigem); })[0];

      if (relatoEnviado) diaAtualizado = dias.filter(function (dia) { return dia.chave === relatoEnviado.chaveData; })[0] || diaAtualizado;

    }

    const resultado = construirAbaDoDiaRDAS_(destino, diaAtualizado, fuso);

    removerAbasLegadasRDAS_(destino);

    ordenarAbasPorDataRDAS_(destino, dias, fuso);

    notificarRDAS_(origem, 'Ficha de ' + formatarDataRDAS_(diaAtualizado.data, fuso) + ' atualizada.');

    return resultado;

  } finally {

    bloqueio.releaseLock();

  }

}



function removerGatilhosRDAS() {

  removerGatilhosRDAS_(true);

}



function removerGatilhosRDAS_(mostrarAviso) {

  const funcoes = [

    'aoEnviarFormularioRDAS',

    'aoAbrirMenuRDAS',

    'aoEnviarFormularioRelatoriosDiarios',

    'aoAbrirRelatoriosDiarios'

  ];

  ScriptApp.getProjectTriggers().forEach(function (gatilho) {

    if (funcoes.indexOf(gatilho.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(gatilho);

  });

  if (mostrarAviso) {

    notificarRDAS_(SpreadsheetApp.getActiveSpreadsheet(), 'Atualização automática do RDAS removida.');

  }

}



function lerRelatosRDAS_(arquivoOrigem, fuso) {

  const relatos = [];

  const chavesVistas = {};

  const abaForms = arquivoOrigem.getSheetByName(CONFIG_RDAS.ABA_ORIGEM);

  if (!abaForms) throw new Error('A aba "' + CONFIG_RDAS.ABA_ORIGEM + '" não foi encontrada.');



  const fontes = [{ aba: abaForms, historico: false }];

  const abaHistorica = arquivoOrigem.getSheetByName(CONFIG_RDAS.ABA_HISTORICO) ||

    arquivoOrigem.getSheetByName(CONFIG_RDAS.ABA_HISTORICO_RESERVA);

  if (abaHistorica) fontes.push({ aba: abaHistorica, historico: true });



  fontes.forEach(function (fonte) {

    lerRelatosFonteRDAS_(fonte, fuso, relatos, chavesVistas);

  });



  relatos.sort(function (a, b) {

    const dataA = a.data ? a.data.getTime() : 0;

    const dataB = b.data ? b.data.getTime() : 0;

    if (dataA !== dataB) return dataA - dataB;

    const horaA = minutosHorarioRDAS_(a.entrada);

    const horaB = minutosHorarioRDAS_(b.entrada);

    if (horaA !== horaB) return horaA - horaB;

    const registroA = a.registro ? a.registro.getTime() : 0;

    const registroB = b.registro ? b.registro.getTime() : 0;

    return registroA - registroB || a.id.localeCompare(b.id);

  });

  return relatos;

}



function lerRelatosFonteRDAS_(fonte, fuso, relatos, chavesVistas) {

  const intervalo = fonte.aba.getDataRange();

  const dados = intervalo.getValues();

  if (dados.length < 2) return;



  let ricos = [];

  try {

    ricos = intervalo.getRichTextValues();

  } catch (erro) {

    ricos = [];

  }



  const mapa = montarMapaCabecalhosRDAS_(dados[0]);

  validarCabecalhosRDAS_(mapa);

  const indiceProcedimento = mapa[normalizarTextoRDAS_(CONFIG_RDAS.CABECALHO_PROCEDIMENTO)];

  const indiceFotos = mapa[normalizarTextoRDAS_(CONFIG_RDAS.CABECALHO_FOTOS)];

  const indiceOrigem = mapa[normalizarTextoRDAS_(CONFIG_RDAS.CABECALHO_ORIGEM_REGISTRO)];

  const indiceIdMigracao = mapa[normalizarTextoRDAS_(CONFIG_RDAS.CABECALHO_ID_MIGRACAO)];



  for (let linha = 1; linha < dados.length; linha++) {

    const valores = dados[linha];

    if (fonte.historico && indiceOrigem !== undefined &&

        normalizarTextoRDAS_(valores[indiceOrigem]) !== normalizarTextoRDAS_(CONFIG_RDAS.VALOR_ORIGEM_HISTORICO)) {

      continue;

    }

    if (normalizarTextoRDAS_(valores[indiceProcedimento]) !== normalizarTextoRDAS_(CONFIG_RDAS.VALOR_PROCEDIMENTO)) {

      continue;

    }



    const idMigracao = indiceIdMigracao === undefined ? '' : String(valores[indiceIdMigracao] || '').trim();

    const relato = {

      linhaOrigem: fonte.historico ? 0 : linha + 1,

      origemRegistro: fonte.historico ? CONFIG_RDAS.VALOR_ORIGEM_HISTORICO : 'Forms 3.0',

      id: fonte.historico

        ? (idMigracao || 'HIST-2.0-' + String(linha + 1).padStart(4, '0'))

        : 'REL-' + String(linha + 1).padStart(3, '0')

    };

    Object.keys(CAMPOS_RDAS).forEach(function (chave) {

      relato[chave] = lerCampoRDAS_(valores, mapa, CAMPOS_RDAS[chave]);

    });



    relato.registro = converterParaDataRDAS_(relato.registro);

    // A ficha diária é definida exclusivamente pela data de realização informada.

    // O carimbo de preenchimento nunca é usado como substituto dessa data.

    relato.data = converterParaDataRDAS_(relato.data);

    if (!relato.data) {

      Logger.log(

        'Relato ignorado no RDAS por ausência de "Data de realização do procedimento". Fonte: ' +

        fonte.aba.getName() + ', linha: ' + (linha + 1)

      );

      continue;

    }



    const chaveUnica = construirChaveUnicaRDAS_(relato);

    if (chavesVistas[chaveUnica]) continue;

    chavesVistas[chaveUnica] = true;



    relato.chaveData = Utilities.formatDate(relato.data, fuso, 'yyyy-MM-dd');

    relato.participantes = extrairNumeroRDAS_(relato.participantes);

    relato.pessoasVeiculo = extrairNumeroRDAS_(relato.pessoasVeiculo);

    relato.panfletos = extrairNumeroRDAS_(relato.panfletos);

    relato.local = combinarLocalRDAS_(relato.frente, relato.endereco);

    relato.atividadeCompleta = combinarAtividadeRDAS_(relato.atividade, relato.complemento);

    relato.equipe = combinarEquipeRDAS_(relato.responsavel, relato.apoio);

    relato.periodo = determinarPeriodoRDAS_(relato.entrada);

    relato.duracao = calcularDuracaoRDAS_(relato.entrada, relato.saida);

    relato.status = normalizarTextoRDAS_(relato.interrupcao) === 'sim'

      ? 'Executado com interrupção'

      : 'Executado';

    relato.observacaoCompleta = construirObservacaoCompletaRDAS_(relato);

    relato.fotos = extrairFotosRDAS_(

      indiceFotos === undefined ? '' : valores[indiceFotos],

      ricos[linha] && indiceFotos !== undefined ? ricos[linha][indiceFotos] : null

    );

    relatos.push(relato);

  }

}



function construirChaveUnicaRDAS_(relato) {

  return [

    relato.registro ? String(relato.registro.getTime()) : '',

    relato.data ? String(relato.data.getTime()) : '',

    normalizarTextoRDAS_(relato.responsavel),

    normalizarTextoRDAS_(relato.atividade),

    normalizarTextoRDAS_(relato.complemento),

    normalizarTextoRDAS_(relato.endereco),

    normalizarTextoRDAS_(relato.relato)

  ].join('|');

}



function consolidarRelatosPorDiaRDAS_(relatos, fuso) {

  const mapa = {};

  relatos.forEach(function (relato) {

    if (!mapa[relato.chaveData]) mapa[relato.chaveData] = [];

    mapa[relato.chaveData].push(relato);

  });



  return Object.keys(mapa).sort().reverse().map(function (chave) {

    const itens = mapa[chave];

    const entradas = itens.map(function (item) { return minutosHorarioRDAS_(item.entrada); })

      .filter(function (valor) { return valor >= 0; });

    const saidas = itens.map(function (item) { return minutosHorarioRDAS_(item.saida); })

      .filter(function (valor) { return valor >= 0; });

    const classificacoes = itens.map(function (item) { return normalizarTextoRDAS_(item.classificacao); });



    const dia = {

      chave: chave,

      data: itens[0].data,

      relatos: itens,

      totalExecucoes: itens.length,

      participantes: somarCampoRDAS_(itens, 'participantes'),

      externas: classificacoes.filter(function (valor) { return valor.indexOf('externa') >= 0; }).length,

      internas: classificacoes.filter(function (valor) { return valor.indexOf('interna') >= 0; }).length,

      panfletos: somarCampoRDAS_(itens, 'panfletos'),

      interrupcoes: itens.filter(function (item) { return normalizarTextoRDAS_(item.interrupcao) === 'sim'; }).length,

      primeiraEntrada: entradas.length ? Math.min.apply(null, entradas) : -1,

      ultimaSaida: saidas.length ? Math.max.apply(null, saidas) : -1,

      execucoesComHorario: itens.filter(function (item) {

        return minutosHorarioRDAS_(item.entrada) >= 0 && minutosHorarioRDAS_(item.saida) >= 0;

      }).length,

      climas: valoresUnicosRDAS_(itens.map(function (item) { return item.clima; })),

      locais: valoresUnicosRDAS_(itens.map(function (item) { return item.local; })),

      atividades: valoresUnicosRDAS_(itens.map(function (item) { return item.atividadeCompleta; })),

      equipe: itensUnicosRDAS_(itens.map(function (item) { return item.equipe; })),

      publicos: itensUnicosRDAS_(itens.map(function (item) { return item.publico; })),

      recursos: itensUnicosRDAS_(itens.map(function (item) { return item.ferramentas; })),

      deslocamentos: valoresUnicosRDAS_(itens.map(function (item) { return item.deslocamento; }))

    };

    dia.sintese = construirSinteseDiariaRDAS_(dia, fuso);

    return dia;

  });

}



function construirAbaDoDiaRDAS_(arquivo, dia, fuso) {

  const nome = nomeAbaDiaRDAS_(dia.data, fuso);

  let aba = arquivo.getSheetByName(nome);

  if (!aba) aba = arquivo.insertSheet(nome);

  prepararAbaRDAS_(aba);

  garantirDimensoesRDAS_(aba, calcularLinhasNecessariasRDAS_(dia), 12);

  const larguras = [105, 105, 120, 120, 105, 105, 120, 120, 105, 105, 120, 120];

  larguras.forEach(function (largura, indice) { aba.setColumnWidth(indice + 1, largura); });

  aba.setRowHeights(1, aba.getMaxRows(), 24);

  aba.getRange(1, 1, aba.getMaxRows(), 12).setFontFamily('Arial').setFontSize(10).setBackground('#FFFFFF');

  aba.setTabColor('#0B8F87');

  aba.setHiddenGridlines(true);

  aba.setFrozenRows(3);

  aba.setFrozenColumns(0);



  escreverCabecalhoDiarioRDAS_(aba, dia, fuso);

  let linha = escreverResumoDiarioRDAS_(aba, dia, fuso);

  formatarTituloSecaoRDAS_(aba.getRange(linha, 1, 1, 12).merge().setValue('FICHAS INDIVIDUAIS DOS RELATOS DO DIA'), '#123B5D');

  linha += 2;

  const primeiraFicha = linha;

  const balanco = { midias: 0, inseridas: 0, falhas: 0 };

  RDAS_RENDER_ATUAL = balanco;

  try {

    dia.relatos.forEach(function (relato, indice) {

      linha = escreverFichaRelatoRDAS_(aba, relato, indice + 1, dia.relatos.length, linha, fuso);

    });

  } finally {

    RDAS_RENDER_ATUAL = null;

  }

  const resultado = {

    aba: nome,

    layout: 'Clássico compacto 1.4',

    relatos: dia.relatos.length,

    midias: balanco.midias,

    previasInseridas: balanco.inseridas,

    falhas: balanco.falhas,

    primeiraFicha: primeiraFicha,

    ultimaLinha: linha

  };

  Logger.log(JSON.stringify({ renderizacaoRDAS: resultado }));

  return resultado;

}



function escreverCabecalhoDiarioRDAS_(aba, dia, fuso) {

  aba.getRange('A1:L1').merge().setValue('RELATO DIÁRIO DE ATIVIDADES SOCIOAMBIENTAIS');

  aba.getRange('A2:L2').merge().setValue(CONFIG_RDAS.EMPRESA);

  aba.getRange('A3:L3').merge().setValue(

    'Ficha consolidada de ' + formatarDataRDAS_(dia.data, fuso) + ' e registros individuais produzidos a partir do Procedimento de Campo 3.0.'

  );

  aba.getRange('A1:L3')

    .setBackground('#123B5D').setFontColor('#FFFFFF').setFontFamily('Arial')

    .setVerticalAlignment('middle');

  aba.getRange('A1').setFontSize(20).setFontWeight('bold');

  aba.getRange('A2').setFontSize(11).setFontColor('#D8EAF5');

  aba.getRange('A3').setFontSize(9).setFontStyle('italic').setFontColor('#AFCBDB');

  aba.setRowHeight(1, 42);

  aba.setRowHeight(2, 26);

  aba.setRowHeight(3, 28);

}



function escreverResumoDiarioRDAS_(aba, dia, fuso) {

  escreverParRDAS_(aba, 'A5:B5', 'C5:D5', 'Data', dia.data);

  escreverParRDAS_(aba, 'E5:F5', 'G5:H5', 'Dia da semana', diaSemanaRDAS_(dia.data));

  escreverParRDAS_(aba, 'I5:J5', 'K5:L5', 'Contrato', CONFIG_RDAS.CONTRATO);

  escreverParRDAS_(aba, 'A6:B6', 'C6:F6', 'Condição climática', dia.climas.join(', ') || 'Não informado');

  escreverParRDAS_(aba, 'G6:H6', 'I6:L6', 'Faixa de atuação', formatarFaixaDiaRDAS_(dia));

  aba.getRange('C5:D5').setNumberFormat('dd/MM/yyyy');



  escreverCartoesRDAS_(aba, [

    ['A8:B8', 'A9:B10', 'EXECUÇÕES', dia.totalExecucoes, '#1976A3'],

    ['C8:D8', 'C9:D10', 'PESSOAS', dia.participantes, '#0B8F87'],

    ['E8:F8', 'E9:F10', 'EXTERNAS', dia.externas, '#2F6EB3'],

    ['G8:H8', 'G9:H10', 'INTERNAS', dia.internas, '#6C63A8'],

    ['I8:J8', 'I9:J10', 'PANFLETOS', dia.panfletos, '#D18336'],

    ['K8:L8', 'K9:L10', 'INTERRUPÇÕES', dia.interrupcoes, '#B44C43']

  ]);

  aba.getRange('C9').setNote('Soma dos participantes informados. A mesma pessoa pode aparecer em mais de um relato.');

  aba.getRange('K9').setNote('Relatos com resposta “Sim” no campo de interrupção.');



  formatarTituloSecaoRDAS_(aba.getRange('A12:L12').merge().setValue('LEITURA RÁPIDA DO DIA'), '#0B8F87');

  const sintese = dia.sintese || construirSinteseDiariaRDAS_(dia, fuso);

  const caixa = aba.getRange('A13:L17').merge().setValue(sintese);

  formatarCaixaTextoRDAS_(caixa, '#F3FAF8', '#244B48', 10);

  aplicarDestaquesSinteseRDAS_(caixa, sintese);

  aba.setRowHeights(13, 5, 25);



  formatarTituloSecaoRDAS_(aba.getRange('A19:L19').merge().setValue('EXECUÇÕES REGISTRADAS NO DIA'), '#123B5D');

  const cabecalhos = ['ID', 'Período', 'Horário', 'Local / obra', 'Responsáveis', 'Atividade', 'Público', 'Total', 'Clima', 'Classificação', 'Mídias', 'Situação'];

  aba.getRange(20, 1, 1, 12).setValues([cabecalhos])

    .setBackground('#111111').setFontColor('#FFFFFF').setFontWeight('bold')

    .setFontFamily('Arial').setFontSize(9).setHorizontalAlignment('center')

    .setVerticalAlignment('middle').setWrap(true);

  aba.setRowHeight(20, 40);

  const linhas = dia.relatos.map(function (relato) {

    return [relato.id, relato.periodo, formatarIntervaloRDAS_(relato.entrada, relato.saida), relato.local,

      relato.equipe, relato.atividadeCompleta, valorExibicaoRDAS_(relato.publico), relato.participantes,

      valorExibicaoRDAS_(relato.clima), valorExibicaoRDAS_(relato.classificacao), relato.fotos.length, relato.status];

  });

  if (linhas.length) {

    const corpo = aba.getRange(21, 1, linhas.length, 12).setValues(linhas);

    corpo.setFontFamily('Arial').setFontSize(9).setWrap(true).setVerticalAlignment('top')

      .setBorder(true, true, true, true, true, true, '#B8C4CE', SpreadsheetApp.BorderStyle.SOLID);

    aplicarAlternanciaRDAS_(aba, 21, linhas.length, 12);

    aba.getRange(21, 1, linhas.length, 3).setHorizontalAlignment('center');

    aba.getRange(21, 8, linhas.length, 1).setNumberFormat('0').setHorizontalAlignment('center');

    aba.getRange(21, 11, linhas.length, 2).setHorizontalAlignment('center');

    aba.setRowHeights(21, linhas.length, 78);

  }

  return 22 + linhas.length;

}



function escreverFichaRelatoRDAS_(aba, relato, numero, total, linha, fuso) {

  const inicio = linha;

  const titulo = 'FICHA ' + numero + ' DE ' + total + ' | ' + relato.id + ' | ' + relato.atividadeCompleta;

  formatarTituloSecaoRDAS_(aba.getRange(linha, 1, 1, 12).merge().setValue(titulo), '#2F6EB3');

  aba.setRowHeight(linha, 34);



  escreverParRDAS_(aba, 'A' + (linha + 1) + ':B' + (linha + 1), 'C' + (linha + 1) + ':D' + (linha + 1), 'Data', relato.data);

  escreverParRDAS_(aba, 'E' + (linha + 1) + ':F' + (linha + 1), 'G' + (linha + 1) + ':H' + (linha + 1), 'Horário / duração', formatarIntervaloRDAS_(relato.entrada, relato.saida) + ' | ' + relato.duracao);

  escreverParRDAS_(aba, 'I' + (linha + 1) + ':J' + (linha + 1), 'K' + (linha + 1) + ':L' + (linha + 1), 'Status', relato.status);

  aba.getRange('C' + (linha + 1) + ':D' + (linha + 1)).setNumberFormat('dd/MM/yyyy');



  escreverParRDAS_(aba, 'A' + (linha + 2) + ':B' + (linha + 2), 'C' + (linha + 2) + ':H' + (linha + 2), 'Atividade', relato.atividadeCompleta);

  escreverParRDAS_(aba, 'I' + (linha + 2) + ':J' + (linha + 2), 'K' + (linha + 2) + ':L' + (linha + 2), 'Classificação', relato.classificacao);

  escreverParRDAS_(aba, 'A' + (linha + 3) + ':B' + (linha + 3), 'C' + (linha + 3) + ':H' + (linha + 3), 'Frente / endereço', relato.local);

  escreverParRDAS_(aba, 'I' + (linha + 3) + ':J' + (linha + 3), 'K' + (linha + 3) + ':L' + (linha + 3), 'Bairro', relato.bairro);

  escreverParRDAS_(aba, 'A' + (linha + 4) + ':B' + (linha + 4), 'C' + (linha + 4) + ':H' + (linha + 4), 'Equipe responsável', relato.equipe);

  escreverParRDAS_(aba, 'I' + (linha + 4) + ':J' + (linha + 4), 'K' + (linha + 4) + ':L' + (linha + 4), 'Área', relato.area);

  escreverParRDAS_(aba, 'A' + (linha + 5) + ':B' + (linha + 5), 'C' + (linha + 5) + ':F' + (linha + 5), 'Público / participantes', valorExibicaoRDAS_(relato.publico) + ' | ' + relato.participantes);

  escreverParRDAS_(aba, 'G' + (linha + 5) + ':H' + (linha + 5), 'I' + (linha + 5) + ':L' + (linha + 5), 'Clima', relato.clima);

  escreverParRDAS_(aba, 'A' + (linha + 6) + ':B' + (linha + 6), 'C' + (linha + 6) + ':F' + (linha + 6), 'Deslocamento', relato.deslocamento);

  escreverParRDAS_(aba, 'G' + (linha + 6) + ':H' + (linha + 6), 'I' + (linha + 6) + ':L' + (linha + 6), 'Pessoas no veículo', relato.pessoasVeiculo);

  escreverParRDAS_(aba, 'A' + (linha + 7) + ':B' + (linha + 7), 'C' + (linha + 7) + ':H' + (linha + 7), 'Ferramentas / materiais', relato.ferramentas);

  escreverParRDAS_(aba, 'I' + (linha + 7) + ':J' + (linha + 7), 'K' + (linha + 7) + ':L' + (linha + 7), 'Panfletos', relato.panfletos);



  formatarTituloSecaoRDAS_(aba.getRange(linha + 9, 1, 1, 12).merge().setValue('OBJETIVO DA ATIVIDADE'), '#596AA0');

  aba.getRange(linha + 10, 1, 3, 12).merge().setValue(valorExibicaoRDAS_(relato.objetivo));

  formatarCaixaTextoRDAS_(aba.getRange(linha + 10, 1, 3, 12), '#F0F2F8', '#3F4C70', 10);

  aba.setRowHeights(linha + 10, 3, 30);



  formatarTituloSecaoRDAS_(aba.getRange(linha + 14, 1, 1, 12).merge().setValue('RELATO DA EXECUÇÃO'), '#304C6D');

  aba.getRange(linha + 15, 1, 7, 12).merge().setValue(valorExibicaoRDAS_(relato.relato));

  formatarCaixaTextoRDAS_(aba.getRange(linha + 15, 1, 7, 12), '#F5F8FB', '#233247', 10);

  aba.setRowHeights(linha + 15, 7, 30);



  formatarTituloSecaoRDAS_(aba.getRange(linha + 23, 1, 1, 12).merge().setValue('OBSERVAÇÕES E RESULTADOS COMPLEMENTARES'), '#B06B2D');

  aba.getRange(linha + 24, 1, 4, 12).merge().setValue(relato.observacaoCompleta);

  formatarCaixaTextoRDAS_(aba.getRange(linha + 24, 1, 4, 12), '#FFF8EE', '#6E4B27', 10);

  aba.setRowHeights(linha + 24, 4, Math.max(30,Math.ceil(String(relato.observacaoCompleta).split('\n').reduce(function(n,t){return n+Math.max(1,Math.ceil(t.length/135));},0)*15/4)+4));



  linha += 29;

  formatarTituloSecaoRDAS_(aba.getRange(linha, 1, 1, 12).merge().setValue('REGISTRO FOTOGRÁFICO AUTOMÁTICO'), '#111111');

  linha += 1;



  if (!relato.fotos.length) {

    aba.getRange(linha, 1, 3, 12).merge().setValue('Nenhuma foto foi enviada neste relato pelo formulário.');

    aba.getRange(linha, 1, 3, 12)

      .setBackground('#F4F7F9').setFontColor('#78909C').setFontFamily('Arial').setFontSize(10)

      .setFontStyle('italic').setHorizontalAlignment('center').setVerticalAlignment('middle')

      .setBorder(true, true, true, true, false, false, '#AFC6D8', SpreadsheetApp.BorderStyle.SOLID);

    aba.setRowHeights(linha, 3, 28);

    linha += 4;

  } else {

    relato.fotos.forEach(function (url, indice) {

      if (indice % 2 !== 0) return;

      const segunda = relato.fotos[indice + 1];

      const ultimaSozinha = !segunda;

      if (ultimaSozinha) {

        prepararFotoRDAS_(aba, relato, url, indice + 1, linha, 4, fuso);

      } else {

        prepararFotoRDAS_(aba, relato, url, indice + 1, linha, 1, fuso);

        prepararFotoRDAS_(aba, relato, segunda, indice + 2, linha, 7, fuso);

      }

      linha += 9;

    });

  }



  aba.getRange(linha, 1, 2, 12).merge().setValue('');

  aba.getRange(linha, 1, 2, 12).setBackground('#E9EEF3');

  linha += 2;

  aba.getRange(inicio, 1, linha - inicio, 12).setFontFamily('Arial');

  return linha;

}



function prepararFotoRDAS_(aba, relato, url, numero, linha, coluna, fuso) {

  garantirDimensoesRDAS_(aba, linha + 9, 12);

  aba.setRowHeights(linha, 6, 30);

  aba.setRowHeights(linha + 6, 2, 25);

  aba.setRowHeight(linha + 8, 10);

  const area = aba.getRange(linha, coluna, 6, 6).merge().setValue('');

  area.setBackground('#F5F7F9').setFontColor('#78909C').setFontFamily('Arial').setFontSize(9)

    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true)

    .setBorder(true, true, true, true, false, false, '#AFC6D8', SpreadsheetApp.BorderStyle.SOLID);

  const leitura = inserirImagemDoFormularioRDAS_(aba, area, url, linha, coluna);

  const tipo = leitura && leitura.tipoMidia === 'Vídeo' ? 'Prévia de vídeo' : leitura && leitura.tipoMidia === 'Foto' ? 'Foto' : 'Evidência';

  const texto = tipo + ' ' + numero + ' | ' + formatarDataRDAS_(relato.data, fuso) + ' | ' + relato.id + ' | ' + relato.atividadeCompleta + ' | ' + relato.local;

  const legenda = aba.getRange(linha + 6, coluna, 2, 6).merge();

  legenda.setBackground('#FFFFFF').setFontColor('#233247').setFontFamily('Arial').setFontSize(8)

    .setFontStyle('italic').setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true)

    .setBorder(true, true, true, true, false, false, '#AFC6D8', SpreadsheetApp.BorderStyle.SOLID);

  legenda.getCell(1, 1).setRichTextValue(SpreadsheetApp.newRichTextValue().setText(texto).setLinkUrl(url).build());

  if (RDAS_RENDER_ATUAL) {

    RDAS_RENDER_ATUAL.midias++;

    if (leitura) RDAS_RENDER_ATUAL.inseridas++; else RDAS_RENDER_ATUAL.falhas++;

  }

}



function inserirImagemDoFormularioRDAS_(aba, intervalo, url, linha, coluna) {

  try {

    const leitura = cptfLer_(url, false);

    cptfInserirNaArea_(aba, leitura.blob, linha, coluna, 6, 6,

      leitura.tipoMidia === 'Vídeo' ? 'Prévia de vídeo de campo' : 'Registro fotográfico de campo', url);

    intervalo.setValue('').setNote('');

    return leitura;

  } catch (erro) {

    Logger.log(JSON.stringify({ contexto: 'Foto RDAS', url: url, erro: erro.message }));

    intervalo.setValue('Prévia indisponível nesta atualização.\nO original está na legenda.')

      .setFontColor('#9A5A18').setBackground('#FFF8EE').setWrap(true)

      .setNote('Diagnóstico da imagem: ' + erro.message);

    return null;

  }

}



function obterBlobImagemRDAS_(arquivo, id) {

  return cptfLer_('https\://drive.google.com/file/d/'+id+'/view',false).blob;

}



function extrairFotosRDAS_(valor, rico) {

  const links = [];

  coletarLinksEmTextoRDAS_(valor, links);



  if (rico) {

    try {

      const linkGeral = rico.getLinkUrl();

      if (linkGeral) links.push(linkGeral);

    } catch (erro) {

      // Continua tentando pelos trechos de texto rico.

    }

    try {

      rico.getRuns().forEach(function (trecho) {

        const link = trecho.getLinkUrl();

        if (link) links.push(link);

        coletarLinksEmTextoRDAS_(trecho.getText(), links);

      });

    } catch (erro) {

      // Algumas células não possuem trechos de texto rico.

    }

    try {

      coletarLinksEmTextoRDAS_(rico.getText(), links);

    } catch (erro) {

      // Sem texto rico legível.

    }

  }



  const unicos = [];

  const vistos = {};

  links.forEach(function (link) {

    const limpo = String(link || '').trim().replace(/[),.;]+$/, '');

    if (!limpo || vistos[limpo]) return;

    vistos[limpo] = true;

    unicos.push(limpo);

  });

  return unicos.slice(0, 5);

}



function coletarLinksEmTextoRDAS_(valor, saida) {

  const texto = String(valor || '');

  const encontrados = texto.match(/https?:\\/\\/[^\s,;]+/gi) || [];

  encontrados.forEach(function (link) { saida.push(link); });

}



function extrairIdDriveRDAS_(url) {

  const texto = String(url || '').trim();

  const padroes = [

    /\\/d\\/([A-Za-z0-9_-]{20,})/,

    /[?&]id=([A-Za-z0-9_-]{20,})/,

    /^([A-Za-z0-9_-]{20,})$/

  ];

  for (let i = 0; i < padroes.length; i++) {

    const encontrado = texto.match(padroes[i]);

    if (encontrado) return encontrado[1];

  }

  return '';

}



function calcularLinhasNecessariasRDAS_(dia) {

  let linhas = 34 + dia.relatos.length * 36;

  dia.relatos.forEach(function (relato) { linhas += Math.ceil(relato.fotos.length / 2) * 9; });

  return Math.max(90, linhas);

}



function removerAbasGeradasSemDadosRDAS_(arquivo, dias, fuso) {

  const validas = {};

  dias.forEach(function (dia) { validas[nomeAbaDiaRDAS_(dia.data, fuso)] = true; });

  arquivo.getSheets().slice().forEach(function (aba) {

    const nome = aba.getName();

    if (nome.indexOf(CONFIG_RDAS.PREFIXO_ABA_DIA) === 0 && !validas[nome] && arquivo.getSheets().length > 1) {

      arquivo.deleteSheet(aba);

    }

  });

}



function removerAbasLegadasRDAS_(arquivo) {

  CONFIG_RDAS.ABAS_LEGADAS.forEach(function (nome) {

    const aba = arquivo.getSheetByName(nome);

    if (aba && arquivo.getSheets().length > 1) arquivo.deleteSheet(aba);

  });

}



function ordenarAbasPorDataRDAS_(arquivo, dias, fuso) {

  dias.forEach(function (dia, indice) {

    const aba = arquivo.getSheetByName(nomeAbaDiaRDAS_(dia.data, fuso));

    if (!aba) return;

    try {

      arquivo.setActiveSheet(aba);

      arquivo.moveActiveSheet(indice + 1);

    } catch (erro) {

      // A ordem visual é conveniente, mas não interfere nos dados.

    }

  });

}



function nomeAbaDiaRDAS_(data, fuso) {

  return CONFIG_RDAS.PREFIXO_ABA_DIA + Utilities.formatDate(data, fuso, 'dd-MM-yyyy');

}



function prepararAbaRDAS_(aba) {

  if (aba.getFilter()) aba.getFilter().remove();

  try {

    aba.getImages().forEach(function (imagem) { imagem.remove(); });

  } catch (erro) {

    // A aba pode não possuir imagens.

  }

  // Usa toda a grade da aba para garantir que nenhuma mesclagem seja

  // selecionada apenas parcialmente durante a reconstrução da ficha.

  aba.getRange(1, 1, aba.getMaxRows(), aba.getMaxColumns()).breakApart();

  aba.clear();

  aba.setConditionalFormatRules([]);

}



function garantirDimensoesRDAS_(aba, linhas, colunas) {

  if (aba.getMaxRows() < linhas) aba.insertRowsAfter(aba.getMaxRows(), linhas - aba.getMaxRows());

  if (aba.getMaxColumns() < colunas) aba.insertColumnsAfter(aba.getMaxColumns(), colunas - aba.getMaxColumns());

}



function escreverParRDAS_(aba, intervaloRotulo, intervaloValor, rotulo, valor) {

  aba.getRange(intervaloRotulo).merge().setValue(rotulo)

    .setBackground('#E5EEF5').setFontColor('#123B5D').setFontFamily('Arial').setFontSize(9)

    .setFontWeight('bold').setHorizontalAlignment('left').setVerticalAlignment('middle').setWrap(true)

    .setBorder(true, true, true, true, false, false, '#AFC6D8', SpreadsheetApp.BorderStyle.SOLID);

  aba.getRange(intervaloValor).merge().setValue(valorExibicaoRDAS_(valor))

    .setBackground('#FFFFFF').setFontColor('#233247').setFontFamily('Arial').setFontSize(9)

    .setHorizontalAlignment('left').setVerticalAlignment('middle').setWrap(true)

    .setBorder(true, true, true, true, false, false, '#AFC6D8', SpreadsheetApp.BorderStyle.SOLID);

}



function escreverCartoesRDAS_(aba, cartoes) {

  cartoes.forEach(function (cartao) {

    aba.getRange(cartao[0]).merge().setValue(cartao[2]);

    aba.getRange(cartao[1]).merge().setValue(cartao[3]);

    aba.getRange(cartao[0])

      .setBackground(cartao[4]).setFontColor('#FFFFFF').setFontFamily('Arial').setFontSize(9)

      .setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');

    aba.getRange(cartao[1])

      .setBackground('#FFFFFF').setFontColor(cartao[4]).setFontFamily('Arial').setFontSize(19)

      .setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle')

      .setBorder(true, true, true, true, false, false, '#CDD8E3', SpreadsheetApp.BorderStyle.SOLID);

  });

}



function formatarTituloSecaoRDAS_(intervalo, cor) {

  intervalo

    .setBackground(cor).setFontColor('#FFFFFF').setFontFamily('Arial').setFontSize(10)

    .setFontWeight('bold').setHorizontalAlignment('left').setVerticalAlignment('middle').setWrap(true)

    .setBorder(true, true, true, true, false, false, cor, SpreadsheetApp.BorderStyle.SOLID);

  return intervalo;

}



function formatarCaixaTextoRDAS_(intervalo, fundo, corTexto, tamanho) {

  intervalo

    .setBackground(fundo).setFontColor(corTexto).setFontFamily('Arial').setFontSize(tamanho || 10)

    .setHorizontalAlignment('left').setVerticalAlignment('top').setWrap(true)

    .setBorder(true, true, true, true, false, false, '#AFC6D8', SpreadsheetApp.BorderStyle.SOLID);

}



/** Destaca os rótulos internos sem alterar o conteúdo consolidado. */

function aplicarDestaquesSinteseRDAS_(intervalo, texto) {

  const conteudo = String(texto || '');

  if (!conteudo) return;

  const base = SpreadsheetApp.newTextStyle().setFontFamily('Arial').setFontSize(10).setBold(false).setForegroundColor('#244B48').build();

  const titulo = SpreadsheetApp.newTextStyle().setBold(true).setForegroundColor('#08756F').build();

  const construtor = SpreadsheetApp.newRichTextValue().setText(conteudo).setTextStyle(base);

  const rotulos = /^(?:EXECUÇÃO|ALCANCE|TERRITÓRIO|OPERAÇÃO|EQUIPE E EVIDÊNCIAS):/gm;

  let encontrado;

  while ((encontrado = rotulos.exec(conteudo)) !== null) construtor.setTextStyle(encontrado.index, encontrado.index + encontrado[0].length, titulo);

  intervalo.getCell(1, 1).setRichTextValue(construtor.build());

}



function aplicarAlternanciaRDAS_(aba, linhaInicial, quantidade, colunas) {

  const fundos = [];

  for (let i = 0; i < quantidade; i++) {

    fundos.push(new Array(colunas).fill(i % 2 === 0 ? '#FFFFFF' : '#F3F7FA'));

  }

  aba.getRange(linhaInicial, 1, quantidade, colunas).setBackgrounds(fundos);

}



function construirSinteseDiariaRDAS_(dia, fuso) {

  const midias = dia.relatos.reduce(function (total, relato) { return total + relato.fotos.length; }, 0);

  const bairros = valoresUnicosRDAS_(dia.relatos.map(function (relato) { return relato.bairro; }));

  const naoClassificadas = Math.max(0, dia.totalExecucoes - dia.externas - dia.internas);

  const classes = dia.externas + ' externa' + (dia.externas === 1 ? '' : 's') + ' e ' + dia.internas + ' interna' + (dia.internas === 1 ? '' : 's') +

    (naoClassificadas ? '; ' + naoClassificadas + ' sem classificação' : '');

  return [

    'EXECUÇÃO: ' + dia.totalExecucoes + ' atividade' + (dia.totalExecucoes === 1 ? '' : 's') + ' — ' + classes + '.',

    'ALCANCE: ' + dia.participantes + ' participante' + (dia.participantes === 1 ? '' : 's') + ' informado' + (dia.participantes === 1 ? '' : 's') + '; públicos: ' + (dia.publicos.join(', ') || 'não informado') + '.',

    'TERRITÓRIO: ' + (bairros.join(' · ') || 'Não informado') + '.',

    'OPERAÇÃO: ' + formatarFaixaDiaRDAS_(dia) + '; clima: ' + (dia.climas.join(', ') || 'não informado') + '; ' + dia.interrupcoes + ' relato' + (dia.interrupcoes === 1 ? '' : 's') + ' com interrupção.',

    'EQUIPE E EVIDÊNCIAS: ' + dia.equipe.length + ' colaborador' + (dia.equipe.length === 1 ? '' : 'es') + ' citado' + (dia.equipe.length === 1 ? '' : 's') + '; ' + midias + ' mídia' + (midias === 1 ? '' : 's') + ' vinculada' + (midias === 1 ? '' : 's') + '.'

  ].join('\n');

}



function construirObservacaoCompletaRDAS_(relato) {

  const partes = [];

  const observacao = String(relato.observacao || '').trim();

  if (observacao && normalizarTextoRDAS_(observacao) !== 'sem observacoes') partes.push('Observação final: ' + observacao);

  partes.push('Público alcançado: ' + valorExibicaoRDAS_(relato.publico) + ' | Participantes: ' + relato.participantes);

  partes.push('Recursos utilizados: ' + valorExibicaoRDAS_(relato.ferramentas));

  partes.push('Deslocamento: ' + valorExibicaoRDAS_(relato.deslocamento) + ' | Pessoas no veículo: ' + relato.pessoasVeiculo);

  partes.push('Interrupção: ' + valorExibicaoRDAS_(relato.interrupcao));

  if (String(relato.horariosInterrupcao || '').trim()) partes.push('Detalhes da interrupção: ' + relato.horariosInterrupcao);

  if(String(relato.motivoInterrupcao||'').trim())partes.push('Motivo da interrupção: '+relato.motivoInterrupcao);

  return partes.join('\n');

}



function montarMapaCabecalhosRDAS_(cabecalhos) {

  const mapa = {};

  cabecalhos.forEach(function (cabecalho, indice) {

    const normalizado = normalizarTextoRDAS_(cabecalho);

    if (normalizado) mapa[normalizado] = indice;

  });

  return mapa;

}



function validarCabecalhosRDAS_(mapa) {

  const obrigatorios = [

    CONFIG_RDAS.CABECALHO_PROCEDIMENTO,

    CAMPOS_RDAS.data,

    CAMPOS_RDAS.atividade,

    CAMPOS_RDAS.relato,

    CONFIG_RDAS.CABECALHO_FOTOS

  ];

  const ausentes = obrigatorios.filter(function (titulo) {

    return mapa[normalizarTextoRDAS_(titulo)] === undefined;

  });

  if (ausentes.length) throw new Error('Pergunta(s) não encontrada(s) no formulário: ' + ausentes.join(' | '));

}



function lerCampoRDAS_(linha, mapa, titulo) {

  const titulos = Array.isArray(titulo) ? titulo : [titulo];

  for (let i = 0; i < titulos.length; i++) {

    const indice = mapa[normalizarTextoRDAS_(titulos[i])];

    if (indice !== undefined) return linha[indice];

  }

  return '';

}



function normalizarTextoRDAS_(valor) {

  return String(valor || '')

    .normalize('NFD')

    .replace(/[\u0300-\u036f]/g, '')

    .toLowerCase()

    .replace(/[^a-z0-9]+/g, ' ')

    .replace(/\s+/g, ' ')

    .trim();

}



function converterParaDataRDAS_(valor) {

  if (valor instanceof Date && !isNaN(valor.getTime())) return valor;

  if (typeof valor === 'number' && isFinite(valor)) {

    const dias = Math.floor(valor);

    const fracao = valor - dias;

    const utc = new Date((dias - 25569) * 86400000);

    return new Date(

      utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate(),

      0, 0, 0, Math.round(fracao * 86400000)

    );

  }

  const texto = String(valor || '').trim();

  const brasileiro = texto.match(/^(\d{1,2})\\/(\d{1,2})\\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);

  if (brasileiro) {

    return new Date(

      Number(brasileiro[3]), Number(brasileiro[2]) - 1, Number(brasileiro[1]),

      Number(brasileiro[4] || 0), Number(brasileiro[5] || 0), Number(brasileiro[6] || 0)

    );

  }

  const interpretada = new Date(texto);

  return isNaN(interpretada.getTime()) ? null : interpretada;

}



function extrairNumeroRDAS_(valor) {

  if (typeof valor === 'number') return isFinite(valor) ? valor : 0;

  const encontrado = String(valor || '').replace(',', '.').match(/-?\d+(?:\\.\d+)?/);

  return encontrado ? Number(encontrado[0]) : 0;

}



function minutosHorarioRDAS_(valor) {

  if (valor instanceof Date && !isNaN(valor.getTime())) return valor.getHours() * 60 + valor.getMinutes();

  if (typeof valor === 'number' && isFinite(valor)) {

    const fracao = valor - Math.floor(valor);

    return Math.round(fracao * 24 * 60) % 1440;

  }

  const encontrado = String(valor || '').match(/(\d{1,2})[:h]\(\d{2})/i);

  return encontrado ? Number(encontrado[1]) * 60 + Number(encontrado[2]) : -1;

}



function formatarMinutosRDAS_(minutos) {

  if (minutos < 0) return 'Não informado';

  return String(Math.floor(minutos / 60) % 24).padStart(2, '0') + ':' + String(minutos % 60).padStart(2, '0');

}



function formatarIntervaloRDAS_(entrada, saida) {

  const inicio = minutosHorarioRDAS_(entrada);

  const fim = minutosHorarioRDAS_(saida);

  if (inicio < 0 && fim < 0) return 'Não informado';

  return formatarMinutosRDAS_(inicio) + ' - ' + formatarMinutosRDAS_(fim);

}



function formatarFaixaDiaRDAS_(dia) {

  if (!dia.execucoesComHorario) return 'Horários não informados';

  return formatarMinutosRDAS_(dia.primeiraEntrada) + ' - ' + formatarMinutosRDAS_(dia.ultimaSaida) +

    ' | horários informados em ' + dia.execucoesComHorario + ' de ' + dia.totalExecucoes + ' execução(ões)';

}



function determinarPeriodoRDAS_(entrada) {

  const minutos = minutosHorarioRDAS_(entrada);

  if (minutos < 0) return 'Não informado';

  if (minutos < 720) return 'Manhã';

  if (minutos < 1080) return 'Tarde';

  return 'Noite';

}



function calcularDuracaoRDAS_(entrada, saida) {

  const inicio = minutosHorarioRDAS_(entrada);

  let fim = minutosHorarioRDAS_(saida);

  if (inicio < 0 || fim < 0) return 'Duração não informada';

  if (fim < inicio) fim += 1440;

  const total = fim - inicio;

  return String(Math.floor(total / 60)).padStart(2, '0') + 'h' + String(total % 60).padStart(2, '0');

}



function formatarDataRDAS_(data, fuso) {

  return data ? Utilities.formatDate(data, fuso, 'dd/MM/yyyy') : 'Não informada';

}



function diaSemanaRDAS_(data) {

  if (!data) return 'Não informado';

  return ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][data.getDay()];

}



function combinarLocalRDAS_(frente, endereco) {

  const titulo = String(frente || '').trim();

  const local = String(endereco || '').trim();

  if (titulo && local && normalizarTextoRDAS_(titulo) !== normalizarTextoRDAS_(local)) return titulo + ' | ' + local;

  return titulo || local || 'Não informado';

}



function combinarAtividadeRDAS_(atividade, complemento) {

  const principal = String(atividade || '').trim();

  const detalhe = String(complemento || '').trim();

  if (!detalhe || normalizarTextoRDAS_(detalhe) === 'sem complemento') return principal || 'Não informado';

  return principal ? principal + ' - ' + detalhe : detalhe;

}



function combinarEquipeRDAS_(responsavel, apoio) {

  const principal = String(responsavel || '').trim();

  const complementar = String(apoio || '').trim();

  if (!complementar || normalizarTextoRDAS_(complementar).indexOf('nao houve') >= 0) return principal || 'Não informado';

  return itensUnicosRDAS_([principal, complementar]).join(', ') || 'Não informado';

}



function somarCampoRDAS_(itens, campo) {

  return itens.reduce(function (total, item) { return total + (Number(item[campo]) || 0); }, 0);

}



function valoresUnicosRDAS_(valores) {

  const vistos = {};

  const saida = [];

  valores.forEach(function (valor) {

    const texto = String(valor || '').replace(/\s+/g, ' ').trim();

    const normalizado = normalizarTextoRDAS_(texto);

    if (!texto || normalizado === 'nao informado' || normalizado === 'sem observacoes') return;

    if (!vistos[normalizado]) {

      vistos[normalizado] = true;

      saida.push(texto);

    }

  });

  return saida;

}



function itensUnicosRDAS_(valores) {

  const itens = [];

  valores.forEach(function (valor) {

    String(valor || '').split(/[,;\n]+/).forEach(function (parte) {

      const texto = parte.replace(/\s+/g, ' ').trim();

      if (texto) itens.push(texto);

    });

  });

  return valoresUnicosRDAS_(itens);

}



function valorExibicaoRDAS_(valor) {

  if (valor instanceof Date && !isNaN(valor.getTime())) return valor;

  if (typeof valor === 'number') return isFinite(valor) ? valor : 'Não informado';

  const texto = String(valor === null || valor === undefined ? '' : valor).trim();

  return texto || 'Não informado';

}



function notificarRDAS_(arquivo, mensagem) {

  try {

    if (arquivo) arquivo.toast(mensagem, 'RDAS', 6);

  } catch (erro) {

    // Notificações visuais não são obrigatórias para a sincronização.

  }

}



/** Leitura de fotos privadas. Nenhuma alteração de compartilhamento. */

/** Fotos 1.2: valida bytes E pixels antes de inserir na grade. */

const CPTF_CACHE = {};

function cptfReferencia_(valor) {

  const url=String(valor||'').trim().replace(/[),.;]+$/,'');

  if(!/^https:\\/\\/(?:drive|docs)\\.google\\.com\\//i.test(url))throw new Error('LINK: endereço de arquivo do Google Drive não reconhecido.');

  const m=url.match(/(?:\\/d\\/|[?&]id=)([A-Za-z0-9_-]{10,})/);

  if(!m)throw new Error('LINK: o endereço precisa identificar um arquivo, não uma pasta.');

  const key=url.match(/[?&]resourcekey=([^&#]+)/i);

  return {id:m[1],key:key?decodeURIComponent(key[1]):'',url:url};

}

function cptfArquivo_(ref) {

  let f;try{f=ref.key?DriveApp.getFileByIdAndResourceKey(ref.id,ref.key):DriveApp.getFileById(ref.id);}

  catch(e){throw new Error('ACESSO: a conta executora não conseguiu ler o arquivo. '+e.message);}

  const vistos={};

  for(let i=0;f.getMimeType()==='application/vnd.google-apps.shortcut';i++){

    if(i>=3||vistos[f.getId()])throw new Error('ATALHO: destino não resolvido.');

    vistos[f.getId()]=true;const id=f.getTargetId(),key=f.getTargetResourceKey();

    try{f=key?DriveApp.getFileByIdAndResourceKey(id,key):DriveApp.getFileById(id);}catch(e){throw new Error('ACESSO: destino do atalho indisponível. '+e.message);}

  }return f;

}

function cptfDimensoes_(bytes) {

  const n=bytes.length,u=function(i){return (bytes[i]||0)&255;};

  const be=function(i){return u(i)*256+u(i+1);},be32=function(i){return u(i)*16777216+u(i+1)*65536+u(i+2)*256+u(i+3);};

  if(n>=24&&u(0)===137&&u(1)===80&&u(2)===78&&u(3)===71&&u(12)===73&&u(13)===72&&u(14)===68&&u(15)===82)return {largura:be32(16),altura:be32(20),mime:'image/png'};

  if(n>=10&&u(0)===71&&u(1)===73&&u(2)===70)return {largura:u(6)+256*u(7),altura:u(8)+256*u(9),mime:'image/gif'};

  if(n>=4&&u(0)===255&&u(1)===216){

    let i=2;

    while(i+3\<n){if(u(i)!==255){i++;continue;}while(i\<n&&u(i)===255)i++;const marker=u(i++);

      if(marker===217||marker===218)break;if(marker===0||marker===1||(marker>=208&&marker<=215))continue;

      const len=be(i);if(len<2||i+len>n)break;

      if([192,193,194,195,197,198,199,201,202,203,205,206,207].indexOf(marker)>=0&&len>=7)return {altura:be(i+3),largura:be(i+5),mime:'image/jpeg'};

      i+=len;

    }

  }return null;

}

function cptfValidarBlob_(blob) {

  if(!blob)return {ok:false,motivo:'Miniatura não disponível.'};

  const bytes=blob.getBytes(),dim=cptfDimensoes_(bytes);

  if(bytes.length>2000000)return {ok:false,motivo:'TAMANHO: '+bytes.length+' bytes excedem 2 MB.'};

  if(!dim||!dim.largura||!dim.altura)return {ok:false,motivo:'FORMATO: cabeçalho JPEG, PNG ou GIF válido não localizado.'};

  if(dim.largura*dim.altura>1000000)return {ok:false,motivo:'PIXELS: '+dim.largura+' × '+dim.altura+' excedem 1 milhão de pixels.',dim:dim};

  // Normaliza somente o tipo do blob; nenhum byte ou arquivo original é alterado.

  if(blob.getContentType()!==dim.mime)blob.setContentType(dim.mime);

  return {ok:true,blob:blob,bytes:bytes.length,dim:dim};

}

function cptfMiniaturaMenor_(arquivo,ref,diagnosticos) {

  const id=arquivo.getId?arquivo.getId():ref.id,key=arquivo.getResourceKey?arquivo.getResourceKey():(id===ref.id?ref.key:'');

  const headers={Authorization:'Bearer '+ScriptApp.getOAuthToken()};if(key)headers['X-Goog-Drive-Resource-Keys']=id+'/'+key;

  const receber=function(url){const resp=UrlFetchApp.fetch(url,{headers:headers,muteHttpExceptions:true,followRedirects:true});if(resp.getResponseCode()!==200)throw new Error('HTTP '+resp.getResponseCode());const check=cptfValidarBlob_(resp.getBlob());if(!check.ok)throw new Error(check.motivo);return check;};

  // thumbnailLink é obtido com credenciais e nunca é enviado ao navegador.

  try{

    const endpoint='https\://www\.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?fields=thumbnailLink&supportsAllDrives=true';

    const meta=UrlFetchApp.fetch(endpoint,{headers:headers,muteHttpExceptions:true});

    if(meta.getResponseCode()!==200)throw new Error('Metadados HTTP '+meta.getResponseCode());

    const link=JSON.parse(meta.getContentText()).thumbnailLink;

    if(!/^https:\\/\\/(?:[a-z0-9-]+\\.)*googleusercontent\\.com\\//i.test(String(link||'')))throw new Error('Link de miniatura não disponível.');

    // O sufixo de tamanho pode variar no serviço. A resposta sempre é medida.

    const menor=link.replace(/=s\d+(?:-[A-Za-z0-9]+)*(?=$|[?&])/,'=s800');

    const result=receber(menor);result.metodo='Miniatura do Drive validada';return result;

  }catch(e){diagnosticos.push('Miniatura autenticada: '+e.message);}

  // Compatibilidade com projetos em que a consulta REST de metadados não está disponível.

  for(const largura of [800,480]){

    try{const url='https\://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w'+largura+(key?'&resourcekey='+encodeURIComponent(key):'');const result=receber(url);result.metodo='Miniatura reduzida e validada ('+largura+' px solicitados)';return result;}

    catch(e){diagnosticos.push('Prévia '+largura+': '+e.message);}

  }return null;

}

function cptfLer_(url,preferirMiniatura) {

  const ref=cptfReferencia_(url),cacheKey=ref.id+'|'+ref.key+'|'+Boolean(preferirMiniatura);

  if(CPTF_CACHE[cacheKey])return CPTF_CACHE[cacheKey];

  const f=cptfArquivo_(ref),mime=f.getMimeType(),size=f.getSize(),erros=[];let ok=null,metodo='';

  const avaliar=function(blob,nome){const r=cptfValidarBlob_(blob);if(r.ok){ok=r;metodo=nome;return true;}erros.push(nome+': '+r.motivo);return false;};

  const miniatura=function(){try{return avaliar(f.getThumbnail(),'Miniatura do Drive');}catch(e){erros.push('Miniatura: '+e.message);return false;}};

  if(preferirMiniatura)miniatura();

  if(!ok&&/^image\\/(png|jpeg|jpg|gif)$/i.test(mime)&&size<=2000000){try{avaliar(f.getBlob(),'Imagem original');}catch(e){erros.push('Original: '+e.message);}}

  if(!ok&&!preferirMiniatura)miniatura();

  if(!ok){try{ok=cptfMiniaturaMenor_(f,ref,erros);if(ok)metodo=ok.metodo;}catch(e){erros.push('Miniatura reduzida: '+e.message);}}

  if(!ok)throw new Error('IMAGEM: nenhuma prévia compatível com 2 MB e 1 milhão de pixels. Original: '+mime+', '+size+' bytes. '+erros.join(' | '));

  const r={id:ref.id,url:ref.url,blob:ok.blob,metodo:metodo,mimeOriginal:mime,bytesOriginais:size,bytesImagem:ok.bytes,largura:ok.dim.largura,altura:ok.dim.altura,pixels:ok.dim.largura*ok.dim.altura,tipoMidia:/^video\\//.test(mime)?'Vídeo':/^image\\//.test(mime)?'Foto':'Arquivo'};

  CPTF_CACHE[cacheKey]=r;return r;

}

function cptfEncaixar_(largura,altura,areaLargura,areaAltura,margem) {

  if(!(largura>0&&altura>0&&areaLargura>0&&areaAltura>0))throw new Error('Dimensões inválidas para encaixe da imagem.');

  const pad=margem===undefined?12:margem,k=Math.min(1,(areaLargura-2*pad)/largura,(areaAltura-2*pad)/altura);

  const w=Math.max(1,Math.floor(largura*k)),h=Math.max(1,Math.floor(altura*k));

  return {largura:w,altura:h,x:Math.max(pad,Math.floor((areaLargura-w)/2)),y:Math.max(pad,Math.floor((areaAltura-h)/2))};

}

function cptfInserirNaArea_(s,blob,linha,coluna,linhas,colunas,titulo,descricao){

  let w=0,h=0,img=null;for(let c=coluna;c\<coluna+colunas;c++)w+=s.getColumnWidth(c);for(let r=linha;r\<linha+linhas;r++)h+=s.getRowHeight(r);

  try{

    img=s.insertImage(blob,coluna,linha);const fit=cptfEncaixar_(img.getWidth(),img.getHeight(),w,h,12);

    let col=coluna,row=linha,x=fit.x,y=fit.y;

    while(col\<coluna+colunas-1&&x>=s.getColumnWidth(col)){x-=s.getColumnWidth(col);col++;}

    while(row\<linha+linhas-1&&y>=s.getRowHeight(row)){y-=s.getRowHeight(row);row++;}

    img.setWidth(fit.largura).setHeight(fit.altura).setAnchorCell(s.getRange(row,col)).setAnchorCellXOffset(x).setAnchorCellYOffset(y).setAltTextTitle(titulo).setAltTextDescription(descricao||'');

    return fit;

  }catch(e){if(img){try{img.remove();}catch(ignore){}}throw e;}

}



/** Somente leitura. Consulta até oito fotos dos três dias mais recentes. */

function diagnosticarFotosRDAS() {

  const origem = SpreadsheetApp.getActiveSpreadsheet();

  const fuso = origem.getSpreadsheetTimeZone() || 'America/Sao_Paulo';

  const dias = consolidarRelatosPorDiaRDAS_(lerRelatosRDAS_(origem, fuso), fuso).slice(0, 3);

  const urls = [];

  const vistos = {};

  dias.forEach(function (dia) {

    dia.relatos.forEach(function (relato) {

      relato.fotos.forEach(function (url) { if (!vistos[url]) { vistos[url] = true; urls.push(url); } });

    });

  });

  const resultados = urls.slice(0, 8).map(function (url) {

    try {

      const leitura = cptfLer_(url, false);

      return { url: url, status: 'LEITURA OK', metodo: leitura.metodo, tipoOriginal: leitura.mimeOriginal,

        bytesOriginais: leitura.bytesOriginais, bytesImagem: leitura.bytesImagem,

        dimensoes: leitura.largura + ' x ' + leitura.altura };

    } catch (erro) {

      return { url: url, status: 'FALHA', motivo: erro.message };

    }

  });

  const resultado = {

    versao: 'Fotos 1.4', executadoEm: new Date().toISOString(), somenteLeitura: true,

    fotosLocalizadas: urls.length, fotosConsultadas: resultados.length, resultados: resultados,

    nota: 'LEITURA OK confirma a miniatura compatível. A atualização do dia confirma a inserção na ficha.'

  };

  Logger.log(JSON.stringify(resultado, null, 2));

  return resultado;

}





function onOpen(e) {

  criarMenuRDAS_();

}



function atualizarTresDiasMaisRecentesRDAS() {

  const bloqueio = LockService.getScriptLock();

  bloqueio.waitLock(30000);

  try {

    const origem = SpreadsheetApp.getActiveSpreadsheet();

    const destino = SpreadsheetApp.openById(CONFIG_RDAS.PLANILHA_DESTINO_ID);

    const fuso = origem.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || 'America/Sao_Paulo';

    const relatos = lerRelatosRDAS_(origem, fuso);

    const dias = consolidarRelatosPorDiaRDAS_(relatos, fuso);

    if (!dias.length) throw new Error('Nenhum relato foi encontrado.');

    const selecionados = dias.slice(0, 3);

    const resultados = selecionados.map(function (dia) { return construirAbaDoDiaRDAS_(destino, dia, fuso); });

    removerAbasLegadasRDAS_(destino);

    ordenarAbasPorDataRDAS_(destino, dias, fuso);

    notificarRDAS_(origem, selecionados.length + ' dia(s) mais recente(s) atualizado(s).');

    return resultados;

  } finally {

    bloqueio.releaseLock();

  }

}
