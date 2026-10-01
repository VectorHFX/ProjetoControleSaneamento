/**

 * RELATÓRIO MENSAL SOCIOAMBIENTAL E DE COMUNICAÇÃO

 *

 * Este arquivo deve ser adicionado ao mesmo projeto Apps Script da planilha

 * "Procedimentos de Campo 3.0". Ele não substitui os scripts de RDAS,

 * diagnósticos, atendimentos ou relatos já instalados.

 *

 * Função inicial: instalarRelatorioMensalSocioambiental()

 */



const CONFIG_RELATORIO_MENSAL = Object.freeze({

  VERSAO: '2.0.0',

  ABA_FONTE: 'Respostas ao formulário 1',

  ABA_HISTORICO: 'Base Consolidada',

  ABA_HISTORICO_RESERVA: 'Importação Histórica 2.0',

  CABECALHO_ORIGEM_REGISTRO: 'Origem do registro',

  VALOR_ORIGEM_HISTORICO: 'Histórico 2.0',

  CABECALHO_ID_MIGRACAO: 'ID de migração',

  PREFIXO_ABA: 'Relatório ',

  PROCEDIMENTO: 'Relato de atividade',

  ATIVIDADE_EXCLUIDA: 'Atividade logística interna',

  GATILHO_AGENDADO: 'sincronizarRelatorioMensalAgendado',

  PROPRIEDADE_PLANILHA_ID: 'RELATORIO_MENSAL_PLANILHA_ID',

  LINHA_CABECALHO: 5,

  PRIMEIRA_LINHA_DADOS: 6,

  COLUNAS: 8,

  CORES: Object.freeze({

    AZUL: '#17365D',

    AZUL_MEDIO: '#2F75B5',

    AZUL_CLARO: '#D9EAF7',

    CINZA_CABECALHO: '#B7B7B7',

    CINZA_LINHA: '#F2F2F2',

    CINZA_TEXTO: '#595959',

    BRANCO: '#FFFFFF',

    PRETO: '#1F1F1F',

    BORDA: '#595959'

  })

});



const CABECALHOS_RELATORIO_MENSAL = Object.freeze([

  'Bairro',

  'Título da Frente de Serviço',

  'Endereço da Frente de Serviço',

  'Data',

  'Atividade',

  'Ferramenta',

  'Público-alvo',

  'Total'

]);



const MESES_RELATORIO_MENSAL = Object.freeze([

  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',

  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'

]);



/**

 * Instala os gatilhos, cria as abas mensais já existentes e evita o uso de

 * SpreadsheetApp.getUi() durante a instalação.

 */

function instalarRelatorioMensalSocioambiental() {

  const planilha = SpreadsheetApp.getActiveSpreadsheet();

  if (!planilha) {

    throw new Error('Abra a planilha Procedimentos de Campo e execute novamente.');

  }



  PropertiesService.getScriptProperties().setProperty(

    CONFIG_RELATORIO_MENSAL.PROPRIEDADE_PLANILHA_ID,

    planilha.getId()

  );



  removerGatilhosRelatorioMensal_();

  ScriptApp.newTrigger('aoEnviarFormularioRelatorioMensal')

    .forSpreadsheet(planilha)

    .onFormSubmit()

    .create();

  ScriptApp.newTrigger('aoAbrirMenuRelatorioMensal')

    .forSpreadsheet(planilha)

    .onOpen()

    .create();

  ScriptApp.newTrigger(CONFIG_RELATORIO_MENSAL.GATILHO_AGENDADO)

    .timeBased()

    .everyMinutes(5)

    .create();



  atualizarRelatoriosMensaisSocioambientais();

  console.log('Sistema mensal instalado. Reabra a planilha para exibir o menu.');

}



/** Atualiza ou cria todas as abas mensais encontradas na base. */

function atualizarRelatoriosMensaisSocioambientais(silencioso) {

  const trava = LockService.getUserLock();

  const adquiriu = trava.tryLock(silencioso ? 1000 : 30000);

  if (!adquiriu) {

    if (silencioso) return;

    throw new Error(

      'Outra atualização do relatório mensal ainda está terminando. Aguarde alguns segundos e tente novamente.'

    );

  }



  try {

    const planilha = abrirPlanilhaRelatorioMensal_();

    const fuso = planilha.getSpreadsheetTimeZone() || Session.getScriptTimeZone();

    const relatos = lerRelatosMensaisUnificados_(planilha, fuso);

    const grupos = agruparRelatosPorMes_(relatos, fuso);

    planilha.getSheets().forEach(function(aba) {

      const nome = aba.getName();

      if (nome.indexOf(CONFIG_RELATORIO_MENSAL.PREFIXO_ABA) !== 0) return;

      const chave = nome.slice(CONFIG_RELATORIO_MENSAL.PREFIXO_ABA.length);

      if (/^\d{4}-\d{2}$/.test(chave) && !grupos[chave]) grupos[chave] = [];

    });

    const chaves = Object.keys(grupos).sort();



    chaves.forEach(function(chave) {

      construirAbaRelatorioMensal_(planilha, chave, grupos[chave], fuso);

    });



    console.log(

      'Relatórios mensais atualizados: ' + chaves.length +

      ' mês(es), ' + relatos.length + ' atividade(s) socioambiental(is).'

    );

  } finally {

    trava.releaseLock();

  }

}



/**

 * Gatilho de envio do formulário. Atualiza as páginas mensais sem depender da

 * ordem de execução dos demais scripts do projeto.

 */

function aoEnviarFormularioRelatorioMensal(e) {

  try {

    atualizarRelatoriosMensaisSocioambientais(true);

  } catch (erro) {

    console.error('Falha no envio do formulário para o relatório mensal: ' + erro.message);

  }

}



function sincronizarRelatorioMensalAgendado() {

  try {

    atualizarRelatoriosMensaisSocioambientais(true);

  } catch (erro) {

    console.error('Falha na atualização agendada do relatório mensal: ' + erro.message);

  }

}



/** Gatilho instalável de abertura. O menu só é solicitado em contexto de UI. */

function aoAbrirMenuRelatorioMensal() {

  try {

    SpreadsheetApp.getUi()

      .createMenu('Relatório Mensal')

      .addItem('Atualizar todos os meses', 'atualizarRelatoriosMensaisSocioambientais')

      .addItem('Atualizar mês da linha selecionada', 'atualizarMesDaLinhaSelecionada')

      .addToUi();

  } catch (erro) {

    // Em execuções sem interface (gatilho de formulário/editor), não faz nada.

  }

}



/** Atualiza o mês da resposta atualmente selecionada na aba fonte. */

function atualizarMesDaLinhaSelecionada() {

  const planilha = abrirPlanilhaRelatorioMensal_();

  const fonte = obterAbaFonteRelatorioMensal_(planilha);

  const abaAtiva = planilha.getActiveSheet();

  const intervalo = abaAtiva ? abaAtiva.getActiveRange() : null;



  if (!intervalo || abaAtiva.getName() !== fonte.getName() || intervalo.getRow() < 2) {

    atualizarRelatoriosMensaisSocioambientais();

    return;

  }



  const fuso = planilha.getSpreadsheetTimeZone() || Session.getScriptTimeZone();

  const relatos = lerRelatosMensaisUnificados_(planilha, fuso);

  const linha = intervalo.getRow();

  const relato = relatos.filter(function(item) {

    return item.linhaOrigem === linha;

  })[0];



  if (!relato) {

    throw new Error('A linha selecionada não contém um Relato de atividade com data de realização.');

  }



  construirAbaRelatorioMensal_(

    planilha,

    relato.mes,

    relatos.filter(function(item) { return item.mes === relato.mes; }),

    fuso

  );

}



function removerGatilhosRelatorioMensal_() {

  const funcoes = {

    aoEnviarFormularioRelatorioMensal: true,

    aoAbrirMenuRelatorioMensal: true,

    sincronizarRelatorioMensalAgendado: true

  };

  ScriptApp.getProjectTriggers().forEach(function(gatilho) {

    if (funcoes[gatilho.getHandlerFunction()]) {

      ScriptApp.deleteTrigger(gatilho);

    }

  });

}



function abrirPlanilhaRelatorioMensal_() {

  const ativa = SpreadsheetApp.getActiveSpreadsheet();

  if (ativa && ativa.getSheetByName(CONFIG_RELATORIO_MENSAL.ABA_FONTE)) {

    return ativa;

  }

  const id = PropertiesService.getScriptProperties().getProperty(

    CONFIG_RELATORIO_MENSAL.PROPRIEDADE_PLANILHA_ID

  );

  if (!id) {

    throw new Error(

      'A planilha do relatório mensal ainda não foi registrada. Execute instalarRelatorioMensalSocioambiental uma vez.'

    );

  }

  return SpreadsheetApp.openById(id);

}



function obterAbaFonteRelatorioMensal_(planilha) {

  const fonte = planilha.getSheetByName(CONFIG_RELATORIO_MENSAL.ABA_FONTE);

  if (!fonte) {

    throw new Error(

      'A aba fonte "' + CONFIG_RELATORIO_MENSAL.ABA_FONTE + '" não foi encontrada.'

    );

  }

  return fonte;

}



/**

 * Consolida somente Relatos de atividade. O campo Data usa exclusivamente

 * "Data de realização do procedimento", nunca o carimbo do formulário.

 */

function lerRelatosMensaisUnificados_(planilha, fuso) {

  const fonteForms = obterAbaFonteRelatorioMensal_(planilha);

  const fontes = [{ aba: fonteForms, historico: false }];

  const abaHistorica = planilha.getSheetByName(CONFIG_RELATORIO_MENSAL.ABA_HISTORICO) ||

    planilha.getSheetByName(CONFIG_RELATORIO_MENSAL.ABA_HISTORICO_RESERVA);

  if (abaHistorica) fontes.push({ aba: abaHistorica, historico: true });



  const relatos = [];

  const chavesVistas = {};

  fontes.forEach(function(fonte) {

    lerRelatosMensais_(fonte.aba.getDataRange().getValues(), fuso, fonte.historico)

      .forEach(function(relato) {

        const chave = construirChaveRelatorioMensal_(relato);

        if (chavesVistas[chave]) return;

        chavesVistas[chave] = true;

        relatos.push(relato);

      });

  });



  return relatos.sort(function(a, b) {

    return a.data - b.data ||

      a.bairro.localeCompare(b.bairro) ||

      a.titulo.localeCompare(b.titulo) ||

      a.id.localeCompare(b.id);

  });

}



function lerRelatosMensais_(dados, fuso, apenasHistorico) {

  if (!dados || dados.length < 2) return [];



  const cabecalhos = dados[0].map(normalizarTextoRelatorioMensal_);

  const colunas = {

    procedimento: localizarColunaRelatorioMensal_(cabecalhos, 'Selecione o procedimento a ser executado'),

    atividadeRealizada: localizarColunaRelatorioMensal_(cabecalhos, 'Atividade realizada'),

    complemento: localizarColunaRelatorioMensal_(cabecalhos, 'Complemento da atividade'),

    endereco: localizarColunaRelatorioMensal_(cabecalhos, 'Endereço da frente de serviço'),

    data: localizarColunaRelatorioMensal_(cabecalhos, 'Data de realização do procedimento'),

    bairro: localizarColunaRelatorioMensal_(cabecalhos, 'Bairro de realização do procedimento'),

    objetivo: localizarColunaRelatorioMensal_(cabecalhos, 'Objetivo da atividade'),

    ferramenta: localizarColunaRelatorioMensal_(cabecalhos, 'Ferramenta'),

    publico: localizarColunaRelatorioMensal_(cabecalhos, 'Público-alvo da atividade'),

    total: localizarColunaRelatorioMensal_(cabecalhos, 'Total de participantes'),

    registro: localizarColunaOpcionalRelatorioMensal_(cabecalhos, 'Carimbo de data/hora'),

    responsavel: localizarColunaOpcionalRelatorioMensal_(cabecalhos, 'Colaborador responsável pelo registro'),

    relato: localizarColunaOpcionalRelatorioMensal_(cabecalhos, 'Relato da atividade'),

    origemRegistro: localizarColunaOpcionalRelatorioMensal_(cabecalhos, CONFIG_RELATORIO_MENSAL.CABECALHO_ORIGEM_REGISTRO),

    idMigracao: localizarColunaOpcionalRelatorioMensal_(cabecalhos, CONFIG_RELATORIO_MENSAL.CABECALHO_ID_MIGRACAO)

  };



  return dados.slice(1).map(function(linha, indice) {

    if (apenasHistorico && colunas.origemRegistro !== -1 &&

        normalizarTextoRelatorioMensal_(linha[colunas.origemRegistro]) !==

        normalizarTextoRelatorioMensal_(CONFIG_RELATORIO_MENSAL.VALOR_ORIGEM_HISTORICO)) {

      return null;

    }

    if (!textoRelatorioMensal_(linha[colunas.procedimento])) return null;

    if (

      normalizarTextoRelatorioMensal_(linha[colunas.procedimento]) !==

      normalizarTextoRelatorioMensal_(CONFIG_RELATORIO_MENSAL.PROCEDIMENTO)

    ) return null;



    const data = normalizarDataRelatorioMensal_(linha[colunas.data], fuso);

    if (!data) return null;



    const atividade = textoRelatorioMensal_(linha[colunas.atividadeRealizada]);

    if (atividadeExcluidaRelatorioMensal_(atividade)) return null;

    const complemento = textoRelatorioMensal_(linha[colunas.complemento]);

    const titulo = montarTituloFrenteRelatorioMensal_(atividade, complemento);

    const mes = Utilities.formatDate(data, fuso, 'yyyy-MM');

    const idMigracao = colunas.idMigracao === -1

      ? ''

      : textoRelatorioMensal_(linha[colunas.idMigracao]);



    return {

      id: apenasHistorico

        ? (idMigracao || 'HIST-2.0-' + String(indice + 2).padStart(4, '0'))

        : 'REL-' + String(indice + 2).padStart(3, '0'),

      linhaOrigem: apenasHistorico ? 0 : indice + 2,

      historico: Boolean(apenasHistorico),

      mes: mes,

      data: data,

      registro: colunas.registro === -1 ? null : normalizarDataHoraRelatorioMensal_(linha[colunas.registro]),

      responsavel: colunas.responsavel === -1 ? '' : textoRelatorioMensal_(linha[colunas.responsavel]),

      relatoOriginal: colunas.relato === -1 ? '' : textoRelatorioMensal_(linha[colunas.relato]),

      bairro: textoRelatorioMensal_(linha[colunas.bairro]) || 'Não informado',

      titulo: titulo || 'Atividade não informada',

      endereco: textoRelatorioMensal_(linha[colunas.endereco]) || 'Não informado',

      atividade: textoRelatorioMensal_(linha[colunas.objetivo]) || 'Não informado',

      ferramenta: textoRelatorioMensal_(linha[colunas.ferramenta]) || 'Não informado',

      publico: textoRelatorioMensal_(linha[colunas.publico]) || 'Não informado',

      total: numeroRelatorioMensal_(linha[colunas.total])

    };

  }).filter(Boolean);

}



function construirChaveRelatorioMensal_(relato) {

  return [

    relato.registro instanceof Date ? relato.registro.getTime() : '',

    relato.data instanceof Date ? relato.data.getTime() : '',

    normalizarTextoRelatorioMensal_(relato.responsavel),

    normalizarTextoRelatorioMensal_(relato.titulo),

    normalizarTextoRelatorioMensal_(relato.endereco),

    normalizarTextoRelatorioMensal_(relato.relatoOriginal)

  ].join('|');

}



function localizarColunaRelatorioMensal_(cabecalhosNormalizados, nome) {

  const procurado = normalizarTextoRelatorioMensal_(nome);

  const indice = cabecalhosNormalizados.indexOf(procurado);

  if (indice === -1) {

    throw new Error('Coluna obrigatória não encontrada: "' + nome + '".');

  }

  return indice;

}



function localizarColunaOpcionalRelatorioMensal_(cabecalhosNormalizados, nome) {

  return cabecalhosNormalizados.indexOf(normalizarTextoRelatorioMensal_(nome));

}



function agruparRelatosPorMes_(relatos) {

  return relatos.reduce(function(grupos, relato) {

    if (!grupos[relato.mes]) grupos[relato.mes] = [];

    grupos[relato.mes].push(relato);

    return grupos;

  }, {});

}



function montarTituloFrenteRelatorioMensal_(atividade, complemento) {

  const principal = textoRelatorioMensal_(atividade);

  let detalhe = textoRelatorioMensal_(complemento);

  if (/^sem\s+(complemento|complemento\s+da\s+atividade)$/i.test(detalhe)) detalhe = '';

  if (principal && detalhe) return principal + ': ' + detalhe;

  return principal || detalhe;

}



function atividadeExcluidaRelatorioMensal_(atividade) {

  return normalizarTextoRelatorioMensal_(atividade) ===

    normalizarTextoRelatorioMensal_(CONFIG_RELATORIO_MENSAL.ATIVIDADE_EXCLUIDA);

}



function construirAbaRelatorioMensal_(planilha, chaveMes, relatos, fuso) {

  const nomeAba = CONFIG_RELATORIO_MENSAL.PREFIXO_ABA + chaveMes;

  let aba = planilha.getSheetByName(nomeAba);

  if (!aba) aba = planilha.insertSheet(nomeAba);



  prepararAbaRelatorioMensal_(aba, relatos.length);



  const partes = chaveMes.split('-');

  const ano = Number(partes[0]);

  const mes = Number(partes[1]);

  const titulo = 'RELATÓRIO SOCIOAMBIENTAL E DE COMUNICAÇÃO: ' +

    MESES_RELATORIO_MENSAL[mes - 1] + ' DE ' + ano;

  const totalParticipantes = relatos.reduce(function(soma, item) {

    return soma + item.total;

  }, 0);

  const periodo = relatos.length

    ? Utilities.formatDate(relatos[0].data, fuso, 'dd/MM/yyyy') + ' a ' +

      Utilities.formatDate(relatos[relatos.length - 1].data, fuso, 'dd/MM/yyyy')

    : 'Sem registros';



  aba.getRange('A1:H1').merge().setValue(titulo);

  aba.getRange('A2:H2').merge().setValue(

    'Procedimentos de Campo 3.0 • Relatos consolidados pela data de realização'

  );

  aba.getRange('A3:H3').merge().setValue(

    'Registros: ' + relatos.length +

    '   |   Total de participantes: ' + totalParticipantes +

    '   |   Período: ' + periodo

  );

  aba.getRange(5, 1, 1, CONFIG_RELATORIO_MENSAL.COLUNAS)

    .setValues([CABECALHOS_RELATORIO_MENSAL]);



  if (relatos.length) {

    const linhas = relatos.map(function(item) {

      return [

        item.bairro,

        item.titulo,

        item.endereco,

        item.data,

        item.atividade,

        item.ferramenta,

        item.publico,

        item.total

      ];

    });

    aba.getRange(

      CONFIG_RELATORIO_MENSAL.PRIMEIRA_LINHA_DADOS,

      1,

      linhas.length,

      CONFIG_RELATORIO_MENSAL.COLUNAS

    ).setValues(linhas);

  }



  formatarAbaRelatorioMensal_(aba, relatos.length);

}



function prepararAbaRelatorioMensal_(aba, quantidadeRelatos) {

  const linhasNecessarias = Math.max(100, quantidadeRelatos + 15);

  if (aba.getMaxRows() < linhasNecessarias) {

    aba.insertRowsAfter(aba.getMaxRows(), linhasNecessarias - aba.getMaxRows());

  }

  if (aba.getMaxColumns() < CONFIG_RELATORIO_MENSAL.COLUNAS) {

    aba.insertColumnsAfter(

      aba.getMaxColumns(),

      CONFIG_RELATORIO_MENSAL.COLUNAS - aba.getMaxColumns()

    );

  }



  const filtro = aba.getFilter();

  if (filtro) filtro.remove();

  aba.getBandings().forEach(function(banda) { banda.remove(); });

  aba.setConditionalFormatRules([]);



  // Separa todas as mesclagens da aba inteira antes de recriar o layout.

  aba.getRange(1, 1, aba.getMaxRows(), aba.getMaxColumns()).breakApart();

  aba.clear();

  aba.setFrozenRows(0);

  aba.setFrozenColumns(0);

}



function formatarAbaRelatorioMensal_(aba, quantidadeRelatos) {

  const cores = CONFIG_RELATORIO_MENSAL.CORES;

  const ultimaLinha = Math.max(5, quantidadeRelatos + 5);



  aba.setHiddenGridlines(true);

  aba.setTabColor(cores.AZUL_MEDIO);

  aba.setFrozenRows(CONFIG_RELATORIO_MENSAL.LINHA_CABECALHO);

  aba.setFrozenColumns(0);



  aba.getRange('A1:H1')

    .setBackground(cores.AZUL)

    .setFontColor(cores.BRANCO)

    .setFontFamily('Arial')

    .setFontSize(16)

    .setFontWeight('bold')

    .setHorizontalAlignment('center')

    .setVerticalAlignment('middle');

  aba.setRowHeight(1, 46);



  aba.getRange('A2:H2')

    .setBackground(cores.AZUL_MEDIO)

    .setFontColor(cores.BRANCO)

    .setFontFamily('Arial')

    .setFontSize(10)

    .setHorizontalAlignment('center')

    .setVerticalAlignment('middle');

  aba.setRowHeight(2, 28);



  aba.getRange('A3:H3')

    .setBackground(cores.AZUL_CLARO)

    .setFontColor(cores.AZUL)

    .setFontFamily('Arial')

    .setFontSize(10)

    .setFontWeight('bold')

    .setHorizontalAlignment('center')

    .setVerticalAlignment('middle');

  aba.setRowHeight(3, 30);

  aba.setRowHeight(4, 12);



  aba.getRange(5, 1, 1, CONFIG_RELATORIO_MENSAL.COLUNAS)

    .setBackground(cores.CINZA_CABECALHO)

    .setFontColor(cores.PRETO)

    .setFontFamily('Arial')

    .setFontSize(10)

    .setFontWeight('bold')

    .setWrap(true)

    .setHorizontalAlignment('center')

    .setVerticalAlignment('middle')

    .setBorder(true, true, true, true, true, true, cores.BORDA, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  aba.setRowHeight(5, 68);



  aba.getRange(5, 2).setNote(

    'Montado automaticamente por: Atividade realizada + ": " + Complemento da atividade.'

  );

  aba.getRange(5, 4).setNote(

    'Usa exclusivamente a Data de realização do procedimento.'

  );

  aba.getRange(5, 5).setNote(

    'Alimentado pelo campo Objetivo da atividade.'

  );



  if (quantidadeRelatos) {

    const corpo = aba.getRange(6, 1, quantidadeRelatos, CONFIG_RELATORIO_MENSAL.COLUNAS);

    const fundos = [];

    for (let i = 0; i < quantidadeRelatos; i++) {

      fundos.push(new Array(CONFIG_RELATORIO_MENSAL.COLUNAS).fill(

        i % 2 === 0 ? cores.BRANCO : cores.CINZA_LINHA

      ));

    }

    corpo

      .setBackgrounds(fundos)

      .setFontFamily('Arial')

      .setFontSize(10)

      .setFontColor(cores.PRETO)

      .setWrap(true)

      .setVerticalAlignment('middle')

      .setBorder(true, true, true, true, true, true, cores.BORDA, SpreadsheetApp.BorderStyle.SOLID);



    aba.getRange(6, 1, quantidadeRelatos, 3).setHorizontalAlignment('left');

    aba.getRange(6, 4, quantidadeRelatos, 1)

      .setHorizontalAlignment('center')

      .setNumberFormat('dd/MM/yyyy');

    aba.getRange(6, 5, quantidadeRelatos, 3).setHorizontalAlignment('left');

    aba.getRange(6, 8, quantidadeRelatos, 1)

      .setHorizontalAlignment('center')

      .setFontWeight('bold')

      .setNumberFormat('0');

    aba.setRowHeights(6, quantidadeRelatos, 108);

    aba.getRange(5, 1, quantidadeRelatos + 1, CONFIG_RELATORIO_MENSAL.COLUNAS)

      .createFilter();

  }



  const larguras = [145, 280, 215, 105, 285, 210, 175, 85];

  larguras.forEach(function(largura, indice) {

    aba.setColumnWidth(indice + 1, largura);

  });



  // Limpa somente a área excedente visível desta aba gerada.

  if (ultimaLinha < aba.getMaxRows()) {

    aba.getRange(ultimaLinha + 1, 1, aba.getMaxRows() - ultimaLinha, 8)

      .setBackground(cores.BRANCO);

  }

}



function normalizarDataRelatorioMensal_(valor, fuso) {

  if (valor instanceof Date && !isNaN(valor.getTime())) {

    const iso = Utilities.formatDate(valor, fuso, 'yyyy-MM-dd').split('-');

    return new Date(Number(iso[0]), Number(iso[1]) - 1, Number(iso[2]), 12, 0, 0);

  }



  if (typeof valor === 'number' && isFinite(valor)) {

    const milissegundos = Math.round((valor - 25569) * 86400000);

    const dataUtc = new Date(milissegundos);

    return new Date(

      dataUtc.getUTCFullYear(),

      dataUtc.getUTCMonth(),

      dataUtc.getUTCDate(),

      12, 0, 0

    );

  }



  const texto = textoRelatorioMensal_(valor);

  let partes = texto.match(/^(\d{1,2})[\\/-]\(\d{1,2})[\\/-]\(\d{4})/);

  if (partes) {

    const dataBr = new Date(Number(partes[3]), Number(partes[2]) - 1, Number(partes[1]), 12, 0, 0);

    return isNaN(dataBr.getTime()) ? null : dataBr;

  }

  partes = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (partes) {

    const dataIso = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]), 12, 0, 0);

    return isNaN(dataIso.getTime()) ? null : dataIso;

  }

  return null;

}



function normalizarDataHoraRelatorioMensal_(valor) {

  if (valor instanceof Date && !isNaN(valor.getTime())) return valor;

  if (typeof valor === 'number' && isFinite(valor)) {

    return new Date(Math.round((valor - 25569) * 86400000));

  }

  const texto = textoRelatorioMensal_(valor);

  const brasileiro = texto.match(

    /^(\d{1,2})[\\/-]\(\d{1,2})[\\/-]\(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/

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



function numeroRelatorioMensal_(valor) {

  if (typeof valor === 'number' && isFinite(valor)) return valor;

  const texto = textoRelatorioMensal_(valor).replace(/\\./g, '').replace(',', '.');

  const numero = Number(texto);

  return isFinite(numero) ? numero : 0;

}



function textoRelatorioMensal_(valor) {

  if (valor === null || valor === undefined) return '';

  return String(valor).replace(/\s+/g, ' ').trim();

}



function normalizarTextoRelatorioMensal_(valor) {

  return textoRelatorioMensal_(valor)

    .normalize('NFD')

    .replace(/[\u0300-\u036f]/g, '')

    .toLowerCase();

}
