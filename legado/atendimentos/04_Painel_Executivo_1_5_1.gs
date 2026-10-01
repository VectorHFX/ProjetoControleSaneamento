// Acabamento visual Água 1.0 • 22/09/2026 • regras operacionais preservadas.
/** REVISÃO 20/09/2026 · 04_Painel_Executivo_1_5_0.gs · SUBSTITUIÇÃO COMPLETA do módulo correspondente. */
/**
 * PAINEL EXECUTIVO DE ATENDIMENTOS — EXECUÇÃO, VERSÃO 1.5.0
 *
 * Instalar somente na planilha "Execução de Atendimentos (respostas)".
 *
 * Responsabilidades desta camada:
 * - manter cópias de consulta do Dashboard e das Fichas Oficiais;
 * - disponibilizar uma visão executiva para a Execução;
 * - registrar comentários e checklist na base compartilhada;
 * - gerar uma ficha de comunicação interna em PDF;
 * - preservar fora desta planilha os controles exclusivos do Atendimento.
 *
 * Função inicial: instalarPainelExecutivoExecucao()
 */

const PE_CONFIG = Object.freeze({
  VERSAO: '1.5.0',
  FUSO: 'America/Sao_Paulo',
  PLANILHA_ID: '1Y5zioMOTaJDtp78OPBovXeHhvuns_ZEG6SMyHqng-Uk',
  CONTROLE_ID: '1UHs_jFVD7jQRKgw7CVPCQ8R7sgvyhkJVv5rcj0v2K5g',
  ABA_BASE_ORIGEM: 'Base Fichas Oficiais',
  ABA_HISTORICO_ORIGEM: 'Histórico',
  ABA_DASHBOARD_ORIGEM: 'Dashboard',
  ABA_FICHAS_ORIGEM: 'Fichas Oficiais',
  ABA_DASHBOARD: 'Dashboard',
  ABA_FICHAS: 'Fichas Oficiais',
  ABA_BASE: 'Base Executiva',
  ABA_RASTRO: 'Rastreabilidade Executiva',
  ABA_COMUNICACAO: 'Comunicação entre Áreas',
  ABA_CONFIG: 'Configuração do Painel',
  FORMULARIO_UNIFICADO:
    'https://docs.google.com/forms/d/1TXAPh6z6Y6MX6JLVoY_KhO-u24Fi8TqnbDHUdrkeecE/viewform',
  TELEFONE_CENTRAL: '5511932324659',
  PASTA_PDF_PROP: 'PE_PASTA_FICHAS_COMUNICACAO',
  ULTIMA_ATUALIZACAO_PROP: 'PE_ULTIMA_ATUALIZACAO',
  ULTIMO_ERRO_PROP: 'PE_ULTIMO_ERRO',
  GATILHO: 'atualizarPainelExecutivoExecucaoAgendado',
  AREAS: Object.freeze(['Atendimento','Execução'])
});

const PE_CABECALHOS_BASE = Object.freeze([
  'Chave do registro', 'Protocolo', 'ID legado', 'Origem',
  'Data de abertura', 'Horário', 'Local do atendimento',
  'Responsável pelo atendimento', 'Assunto', 'Tipo de manifestação',
  'Nome', 'Telefone', 'E-mail', 'Endereço', 'Frente de obra',
  'Solicitação', 'Descrição detalhada', 'Solução', 'Finalização',
  'Status', 'Data de conclusão', 'Fotos da abertura', 'Fotos da execução',
  'Documento', 'PDF', 'Situação documental', 'Campos faltantes',
  'Revisão obrigatória', 'Motivo da revisão', 'Urgência',
  'Área responsável', 'Próxima ação', 'Última atualização', 'Procedência'
]);

const PE_CABECALHOS_RASTRO = Object.freeze([
  'Protocolo', 'Data e hora', 'Usuário', 'Status', 'Procedência',
  'Origem da atualização', 'Tipo de evento', 'Área responsável',
  'Próxima ação', 'Chave do evento', 'Data da execução',
  'Executado por', 'Evidências'
]);

const PE_CABECALHOS_COMUNICACAO = Object.freeze([
  'Chave do evento', 'Protocolo', 'Data e hora', 'Registrado por',
  'Área autora', 'Encaminhado para', 'Tipo de registro', 'Mensagem',
  'Título do item', 'Chave do item', 'Situação do item', 'Prioridade',
  'Prazo', 'Arquivos', 'Lido pelo Atendimento em',
  'Lido pela Execução em', 'Origem', 'Versão'
]);

const PE_CORES = Object.freeze({
  NAVY: '#10263A', PETROLEO: '#078C91', VERDE: '#278260',
  LARANJA: '#D7822E', VERMELHO: '#BD4B43', AZUL: '#3B75B6',
  CINZA: '#607487', GELO: '#EEF3F7', BRANCO: '#FFFFFF', BORDA: '#D7E1E8'
});

function onOpen(e) {
  pe_criarMenu_();
}

function instalarPainelExecutivoExecucao() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss || ss.getId() !== PE_CONFIG.PLANILHA_ID) {
    throw new Error(
      'Execute esta função no Apps Script da planilha Execução de Atendimentos (respostas).'
    );
  }

  pe_prepararConfiguracao_(ss);
  pe_prepararComunicacao_(ss);
  const resultado = atualizarPainelExecutivoExecucaoAgora();
  const gatilho = pe_instalarGatilhoUnico_(ss);
  pe_criarMenu_();

  SpreadsheetApp.getUi().alert(
    'Painel Executivo da Execução instalado',
    resultado.mensagem + '\n\n' + gatilho,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function pe_criarMenu_() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('EXECUÇÃO')
      .addItem('Abrir painel executivo', 'abrirPainelExecutivoExecucao')
      .addSeparator()
      .addItem('Abrir Dashboard', 'abrirDashboardExecucao')
      .addItem('Abrir Fichas Oficiais', 'abrirFichasOficiaisExecucao')
      .addItem('Atualizar cópias agora', 'atualizarPainelExecutivoExecucaoAgora')
      .addSeparator()
      .addItem('Diagnóstico da integração', 'diagnosticarPainelExecutivoExecucao')
      .addItem('Instalar ou renovar automação', 'instalarPainelExecutivoExecucao')
      .addToUi();
  } catch (erro) {
    console.log('Menu indisponível neste contexto: ' + erro.message);
  }
}

function abrirPainelExecutivoExecucao() {
  const html = HtmlService.createHtmlOutput(pe_html_())
    .setWidth(1440)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'CPT | Atendimento integrado');
}

function abrirDashboardExecucao() {
  pe_abrirAba_(PE_CONFIG.ABA_DASHBOARD);
}

function abrirFichasOficiaisExecucao() {
  pe_abrirAba_(PE_CONFIG.ABA_FICHAS);
}

function pe_abrirAba_(nome) {
  const aba = pe_planilha_().getSheetByName(nome);
  if (!aba) throw new Error('A aba ' + nome + ' ainda não foi criada. Execute a instalação.');
  aba.showSheet();
  pe_planilha_().setActiveSheet(aba);
}

function pe_planilha_() {
  const ativa = SpreadsheetApp.getActiveSpreadsheet();
  if (ativa && ativa.getId() === PE_CONFIG.PLANILHA_ID) return ativa;
  return SpreadsheetApp.openById(PE_CONFIG.PLANILHA_ID);
}

function atualizarPainelExecutivoExecucaoAgendado() {
  try {
    atualizarPainelExecutivoExecucaoAgora();
  } catch (erro) {
    PropertiesService.getScriptProperties().setProperty(
      PE_CONFIG.ULTIMO_ERRO_PROP,
      new Date().toISOString() + ' | ' + erro.message
    );
    console.error(erro.stack || erro.message);
  }
}

function atualizarPainelExecutivoExecucaoAgora() {
  const trava = LockService.getScriptLock();
  trava.waitLock(30000);
  try {
    const destino = pe_planilha_();
    const origem = SpreadsheetApp.openById(PE_CONFIG.CONTROLE_ID);
    const baseOrigem = origem.getSheetByName(PE_CONFIG.ABA_BASE_ORIGEM);
    const historicoOrigem = origem.getSheetByName(PE_CONFIG.ABA_HISTORICO_ORIGEM);
    const dashboardOrigem = origem.getSheetByName(PE_CONFIG.ABA_DASHBOARD_ORIGEM);
    const fichasOrigem = origem.getSheetByName(PE_CONFIG.ABA_FICHAS_ORIGEM);
    if (!baseOrigem || !historicoOrigem || !dashboardOrigem || !fichasOrigem) {
      throw new Error(
        'O Controle de Atendimentos ainda não contém todas as bases da versão atual.'
      );
    }

    pe_publicarVinculos_(destino);
    const indice = pe_atualizarBase_(destino, baseOrigem);
    pe_atualizarRastreabilidade_(destino, historicoOrigem, indice);
    const acompanhamentoOrigem = origem.getSheetByName('Acompanhamento diário');
    if(acompanhamentoOrigem)pe_atualizarEspelho_(destino, acompanhamentoOrigem, 'Acompanhamento diário');
    pe_atualizarEspelho_(destino, dashboardOrigem, PE_CONFIG.ABA_DASHBOARD);
    pe_atualizarEspelho_(destino, fichasOrigem, PE_CONFIG.ABA_FICHAS);
    pe_prepararComunicacao_(destino);
    pe_organizarAbas_(destino);

    const agora = new Date();
    const propriedades = PropertiesService.getScriptProperties();
    propriedades.setProperty(PE_CONFIG.ULTIMA_ATUALIZACAO_PROP, agora.toISOString());
    propriedades.deleteProperty(PE_CONFIG.ULTIMO_ERRO_PROP);
    destino.getSheetByName(PE_CONFIG.ABA_CONFIG).getRange('B5').setValue(agora);
    SpreadsheetApp.flush();
    const mensagem =
      indice.protocolos.length + ' ficha(s) copiadas com rastreabilidade segura.';
    try { destino.toast(mensagem, 'Painel da Execução', 6); } catch (erro) {}
    return {ok: true, total: indice.protocolos.length, mensagem: mensagem};
  } finally {
    trava.releaseLock();
  }
}

function pe_instalarGatilhoUnico_() {
  ScriptApp.getProjectTriggers().forEach(function(gatilho) {
    if (gatilho.getHandlerFunction() === PE_CONFIG.GATILHO) {
      ScriptApp.deleteTrigger(gatilho);
    }
  });
  if (ScriptApp.getProjectTriggers().length >= 20) {
    return 'A cópia automática não foi criada porque este projeto já atingiu o limite de gatilhos. O painel continua disponível e pode ser atualizado pelo menu EXECUÇÃO.';
  }
  ScriptApp.newTrigger(PE_CONFIG.GATILHO).timeBased().everyMinutes(15).create();
  return 'Foi criado somente 1 gatilho: atualização das cópias a cada 15 minutos.';
}

function pe_prepararConfiguracao_(ss) {
  let aba = ss.getSheetByName(PE_CONFIG.ABA_CONFIG);
  if (!aba) aba = ss.insertSheet(PE_CONFIG.ABA_CONFIG);
  pe_dimensoes_(aba, 12, 3);
  const atual = aba.getRange(1, 1, Math.max(1, aba.getLastRow()), 3).getValues();
  const principalAtual = atual.length > 2 ? pe_texto_(atual[2][1]) : '';
  const dados = [
    ['Configuração', 'Valor', 'Uso'],
    ['Formulário unificado de abertura e execução', PE_CONFIG.FORMULARIO_UNIFICADO,
      'Link fornecido para o formulário atualizado'],
    ['Formulário principal do Atendimento', principalAtual,
      'Opcional: cole aqui o link público quando quiser exibi-lo no painel'],
    ['WhatsApp da Central', PE_CONFIG.TELEFONE_CENTRAL,
      'Somente números, com DDI e DDD'],
    ['Última atualização das cópias', '', 'Preenchido automaticamente'],
    ['Versão', PE_CONFIG.VERSAO, 'Painel Executivo da Execução']
  ];
  aba.clear();
  aba.getRange(1, 1, dados.length, 3).setValues(dados);
  aba.getRange(1, 1, 1, 3).setBackground(PE_CORES.NAVY)
    .setFontColor(PE_CORES.BRANCO).setFontWeight('bold');
  aba.getRange(2, 1, dados.length - 1, 3).setWrap(true).setVerticalAlignment('middle');
  aba.getRange('B5').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  aba.setColumnWidth(1, 290); aba.setColumnWidth(2, 430); aba.setColumnWidth(3, 340);
  aba.setFrozenRows(1);
  aba.hideSheet();
}

function pe_prepararComunicacao_(ss) {
  let aba = ss.getSheetByName(PE_CONFIG.ABA_COMUNICACAO);
  if (!aba) aba = ss.insertSheet(PE_CONFIG.ABA_COMUNICACAO);
  pe_dimensoes_(aba, 50, PE_CABECALHOS_COMUNICACAO.length);
  if (aba.getLastRow() === 0 ||
      aba.getRange(1, 1, 1, PE_CABECALHOS_COMUNICACAO.length).getValues()[0]
        .every(function(valor) { return !pe_texto_(valor); })) {
    aba.getRange(1, 1, 1, PE_CABECALHOS_COMUNICACAO.length)
      .setValues([PE_CABECALHOS_COMUNICACAO]);
  }
  pe_validarCabecalho_(aba, PE_CABECALHOS_COMUNICACAO);
  aba.getRange(1, 1, 1, PE_CABECALHOS_COMUNICACAO.length)
    .setBackground(PE_CORES.NAVY).setFontColor(PE_CORES.BRANCO)
    .setFontWeight('bold').setWrap(true);
  aba.setFrozenRows(1);
  aba.getRange('C:C').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  aba.getRange('M:M').setNumberFormat('dd/MM/yyyy');
  aba.getRange('O:P').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  try { aba.hideSheet(); } catch (erro) {}
  return aba;
}

function pe_atualizarBase_(destino, origem, somenteLeitura) {
  const dados = origem.getDataRange().getValues();
  if (!dados.length) throw new Error('A Base Fichas Oficiais está vazia.');
  const mapa = pe_mapaCabecalho_(dados[0]);
  ['Chave do registro', 'Protocolo', 'Data de abertura', 'Status']
    .forEach(function(campo) { pe_exigirCampo_(mapa, campo, PE_CONFIG.ABA_BASE_ORIGEM); });

  const protocolos = [], porAlias = Object.create(null), linhas = [];
  dados.slice(1).forEach(function(linha) {
    const protocolo = pe_valor_(linha, mapa, 'Protocolo');
    if (!af_os_(protocolo,pe_valor_(linha,mapa,'Histórico já entregue'))) return;
    const legado = pe_valor_(linha, mapa, 'ID legado');
    const docId = pe_valor_(linha, mapa, 'ID do documento');
    const pdfId = pe_valor_(linha, mapa, 'ID do PDF atual');
    protocolos.push(protocolo);
    porAlias[pe_chave_(protocolo)] = protocolo;
    if (legado) porAlias[pe_chave_(legado)] = protocolo;
    linhas.push([
      pe_valor_(linha, mapa, 'Chave do registro'), protocolo, legado,
      pe_valor_(linha, mapa, 'Origem'), pe_valorBruto_(linha, mapa, 'Data de abertura'),
      pe_valorBruto_(linha, mapa, 'Horário'), pe_valor_(linha, mapa, 'Local do atendimento'),
      pe_valor_(linha, mapa, 'Responsável pelo atendimento'),
      pe_valor_(linha, mapa, 'Assunto'), pe_valor_(linha, mapa, 'Tipo de manifestação'),
      pe_valor_(linha, mapa, 'Nome'), pe_valor_(linha, mapa, 'Telefone'),
      pe_valor_(linha, mapa, 'E-mail'), pe_valor_(linha, mapa, 'Endereço'),
      pe_valor_(linha, mapa, 'Frente de obra'), pe_valor_(linha, mapa, 'Solicitação'),
      pe_valor_(linha, mapa, 'Descrição detalhada da reclamação'),
      pe_valor_(linha, mapa, 'Solução'), pe_valor_(linha, mapa, 'Finalização'),
      pe_valor_(linha, mapa, 'Status'), pe_valorBruto_(linha, mapa, 'Data de conclusão'),
      pe_valor_(linha, mapa, 'Fotos da abertura'), pe_valor_(linha, mapa, 'Fotos da solução'),
      docId ? 'https://docs.google.com/document/d/' + docId + '/edit' : '',
      pdfId ? 'https://drive.google.com/file/d/' + pdfId + '/view' : '',
      pe_valor_(linha, mapa, 'Situação do vínculo'), pe_valor_(linha, mapa, 'Campos faltantes'),
      pe_valorBruto_(linha, mapa, 'Revisão obrigatória'),
      pe_valor_(linha, mapa, 'Motivo da revisão'),
      pe_valor_(linha, mapa, 'Grau de urgência') || 'Não informada',
      pe_valor_(linha, mapa, 'Área responsável pela próxima ação') || 'Atendimento',
      pe_valor_(linha, mapa, 'Próxima ação'),
      pe_valorBruto_(linha, mapa, 'Última atualização operacional'),
      pe_valor_(linha, mapa, 'Procedência') || 'Em análise'
    ]);
  });

  if(somenteLeitura)return linhas.map(linha=>{const r={};PE_CABECALHOS_BASE.forEach((k,i)=>r[k]=linha[i]);return r;});
  pe_gravarBase_(destino, PE_CONFIG.ABA_BASE, PE_CABECALHOS_BASE, linhas);
  af_vinculos_().forEach(v=>{const p=af_resolver_(v.principal);if(protocolos.includes(p)){porAlias[pe_chave_(v.origem)]=p;porAlias[pe_chave_(v.idOrigem)]=p;}});
  return {protocolos: protocolos, porAlias: porAlias};
}

function pe_atualizarRastreabilidade_(destino, origem, indice, somenteLeitura) {
  const dados = origem.getDataRange().getValues();
  if (!dados.length) throw new Error('A página Histórico está vazia.');
  const mapa = pe_mapaCabecalho_(dados[0]);
  ['ID', 'Data e hora', 'Usuário', 'Status', 'Procedência']
    .forEach(function(campo) { pe_exigirCampo_(mapa, campo, PE_CONFIG.ABA_HISTORICO_ORIGEM); });
  const linhas = [];
  dados.slice(1).forEach(function(linha) {
    const protocolo = indice.porAlias[pe_chave_(pe_valor_(linha, mapa, 'ID'))];
    if (!af_os_(protocolo,pe_valor_(linha,mapa,'Histórico já entregue'))) return;
    linhas.push([
      protocolo, pe_valorBruto_(linha, mapa, 'Data e hora'),
      pe_valor_(linha, mapa, 'Usuário'), pe_valor_(linha, mapa, 'Status'),
      pe_valor_(linha, mapa, 'Procedência'),
      (af_incorporado_(pe_valor_(linha,mapa,'ID'))?'['+pe_valor_(linha,mapa,'ID')+'] ':'')+pe_valor_(linha, mapa, 'Origem da atualização'),
      pe_valor_(linha, mapa, 'Tipo de evento'),
      pe_valor_(linha, mapa, 'Área responsável pela próxima ação'),
      pe_valor_(linha, mapa, 'Próxima ação'), pe_valor_(linha, mapa, 'Chave do evento'),
      pe_valorBruto_(linha, mapa, 'Data da execução'),
      pe_valor_(linha, mapa, 'Executado por'), pe_valor_(linha, mapa, 'Evidências')
    ]);
  });
  if(somenteLeitura)return linhas.map(linha=>{const r={};PE_CABECALHOS_RASTRO.forEach((k,i)=>r[k]=linha[i]);return r;});
  pe_gravarBase_(destino, PE_CONFIG.ABA_RASTRO, PE_CABECALHOS_RASTRO, linhas);
}

function pe_gravarBase_(ss, nome, cabecalhos, linhas) {
  let aba = ss.getSheetByName(nome);
  if (!aba) aba = ss.insertSheet(nome);
  pe_dimensoes_(aba, Math.max(20, linhas.length + 3), cabecalhos.length);
  aba.clearContents();
  aba.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos])
    .setBackground(PE_CORES.NAVY).setFontColor(PE_CORES.BRANCO)
    .setFontWeight('bold').setWrap(true);
  if (linhas.length) aba.getRange(2, 1, linhas.length, cabecalhos.length).setValues(linhas);
  aba.setFrozenRows(1);
  if (nome === PE_CONFIG.ABA_BASE) {
    aba.getRange(2, 5, Math.max(1, linhas.length), 1).setNumberFormat('dd/MM/yyyy');
    aba.getRange(2, 21, Math.max(1, linhas.length), 1).setNumberFormat('dd/MM/yyyy');
    aba.getRange(2, 33, Math.max(1, linhas.length), 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  } else {
    aba.getRange(2, 2, Math.max(1, linhas.length), 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    aba.getRange(2, 11, Math.max(1, linhas.length), 1).setNumberFormat('dd/MM/yyyy');
  }
  aba.hideSheet();
}

function pe_atualizarEspelho_(destino, origem, nome) {
  let aba = destino.getSheetByName(nome);
  if (!aba) {
    aba = origem.copyTo(destino);
    aba.setName(nome);
  }
  const fonte = origem.getDataRange();
  const valoresFonte = fonte.getValues();
  if(!valoresFonte.some(r=>r.some(v=>v!==''&&v!=null)))throw Error('Fonte '+nome+' está vazia ou em atualização. Cópia anterior preservada.');
  const mirrorKey='PE_ESPELHO_14_'+nome, mirrorProps=PropertiesService.getScriptProperties();
  const mirrorHash=Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(valoresFonte)));
  if(mirrorProps.getProperty(mirrorKey)===mirrorHash&&JSON.stringify(aba.getDataRange().getValues())===JSON.stringify(valoresFonte))return;
  const faixaAnterior = aba.getDataRange();
  // Desfaz primeiro as mesclagens da versão anterior. Se o conteúdo fosse
  // limpo antes, uma mesclagem vazia fora da nova área poderia sobreviver.
  try { faixaAnterior.breakApart(); } catch (erro) {}
  faixaAnterior.clearContent();

  const linhas = fonte.getNumRows(), colunas = fonte.getNumColumns();
  pe_dimensoes_(aba, linhas + 5, colunas + 2);
  const alvo = aba.getRange(1, 1, linhas, colunas);
  alvo.setValues(valoresFonte);
  alvo.setBackgrounds(fonte.getBackgrounds())
    .setFontColors(fonte.getFontColors())
    .setFontFamilies(fonte.getFontFamilies())
    .setFontSizes(fonte.getFontSizes())
    .setFontWeights(fonte.getFontWeights())
    .setFontStyles(fonte.getFontStyles())
    .setHorizontalAlignments(fonte.getHorizontalAlignments())
    .setVerticalAlignments(fonte.getVerticalAlignments())
    .setWrapStrategies(fonte.getWrapStrategies())
    .setNumberFormats(fonte.getNumberFormats());

  fonte.getMergedRanges().forEach(function(mesclado) {
    const linha = mesclado.getRow(), coluna = mesclado.getColumn();
    if (linha <= linhas && coluna <= colunas) {
      aba.getRange(linha, coluna, mesclado.getNumRows(), mesclado.getNumColumns()).merge();
    }
  });
  for (let coluna = 1; coluna <= colunas; coluna++) {
    aba.setColumnWidth(coluna, origem.getColumnWidth(coluna));
  }
  aba.setRowHeights(1,linhas,32);
  if(linhas>6)aba.autoResizeRows(7,linhas-6);
  for(let linha=1;linha<=Math.min(linhas,6);linha++)aba.setRowHeight(linha,origem.getRowHeight(linha));
  aba.setFrozenRows(origem.getFrozenRows());
  aba.setFrozenColumns(origem.getFrozenColumns());
  aba.setHiddenGridlines(true);
  pe_reporLinks_(fonte, alvo);
  pe_protegerConsulta_(aba);
  mirrorProps.setProperty(mirrorKey,mirrorHash);
}

function pe_reporLinks_(fonte, alvo) {
  const ricos = fonte.getRichTextValues();
  const formulas = fonte.getFormulas();
  for (let r = 0; r < ricos.length; r++) {
    for (let c = 0; c < ricos[r].length; c++) {
      const rico = ricos[r][c];
      const formula = formulas[r][c];
      if (formula && /^=HYPERLINK\(/i.test(formula)) {
        alvo.getCell(r + 1, c + 1).setFormula(formula);
      } else if (rico && (rico.getLinkUrl() || rico.getRuns().some(function(run) {
        return Boolean(run.getLinkUrl());
      }))) {
        alvo.getCell(r + 1, c + 1).setRichTextValue(rico);
      }
    }
  }
}

function pe_protegerConsulta_(aba) {
  const descricao = 'Painel Executivo da Execução — consulta automática';
  let protecao = aba.getProtections(SpreadsheetApp.ProtectionType.SHEET)
    .find(function(item) { return item.getDescription() === descricao; });
  if (!protecao) protecao = aba.protect().setDescription(descricao);
  protecao.setWarningOnly(false);
  const usuario = Session.getEffectiveUser();
  try {
    protecao.addEditor(usuario);
    const email = usuario.getEmail();
    const outros = protecao.getEditors().filter(function(editor) {
      return editor.getEmail() !== email;
    });
    if (outros.length) protecao.removeEditors(outros);
    if (protecao.canDomainEdit()) protecao.setDomainEdit(false);
  } catch (erro) {
    console.warn('Proteção mantida com os editores já configurados: ' + erro.message);
  }
}

function pe_organizarAbas_(ss) {
  [PE_CONFIG.ABA_DASHBOARD, PE_CONFIG.ABA_FICHAS].forEach(function(nome) {
    const aba = ss.getSheetByName(nome); if (aba) aba.showSheet();
  });
  [PE_CONFIG.ABA_BASE, PE_CONFIG.ABA_RASTRO, PE_CONFIG.ABA_COMUNICACAO,
    PE_CONFIG.ABA_CONFIG].forEach(function(nome) {
    const aba = ss.getSheetByName(nome); if (aba) try { aba.hideSheet(); } catch (erro) {}
  });
}

function pe_dimensoes_(aba, linhas, colunas) {
  if (aba.getMaxRows() < linhas) aba.insertRowsAfter(aba.getMaxRows(), linhas - aba.getMaxRows());
  if (aba.getMaxColumns() < colunas) {
    aba.insertColumnsAfter(aba.getMaxColumns(), colunas - aba.getMaxColumns());
  }
}

function pe_mapaCabecalho_(cabecalhos) {
  const mapa = Object.create(null);
  cabecalhos.forEach(function(valor, indice) {
    const chave = pe_chave_(valor); if (chave && mapa[chave] == null) mapa[chave] = indice;
  });
  return mapa;
}

function pe_exigirCampo_(mapa, campo, origem) {
  if (mapa[pe_chave_(campo)] == null) {
    throw new Error('Campo obrigatório ausente em ' + origem + ': ' + campo + '.');
  }
}

function pe_valor_(linha, mapa, campo) {
  return pe_texto_(pe_valorBruto_(linha, mapa, campo));
}

function pe_valorBruto_(linha, mapa, campo) {
  const indice = mapa[pe_chave_(campo)];
  return indice == null ? '' : linha[indice];
}

function pe_texto_(valor) {
  return valor == null ? '' : String(valor).trim();
}

function pe_chave_(valor) {
  return pe_texto_(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function pe_validarCabecalho_(aba, esperado) {
  const atual = aba.getRange(1, 1, 1, esperado.length).getValues()[0];
  if (JSON.stringify(atual) !== JSON.stringify(Array.from(esperado))) {
    throw new Error(
      'A estrutura da aba ' + aba.getName() + ' foi alterada. Nenhum registro foi gravado.'
    );
  }
}

function pe_lerObjetos_(nome, cabecalhos) {
  try { return pe_lerObjetosFonte_(nome,cabecalhos); } catch(e) {
    if(nome!==PE_CONFIG.ABA_BASE&&nome!==PE_CONFIG.ABA_RASTRO)throw e;
    PE_LEITURA_LOCAL=true;
    const aba=pe_planilha_().getSheetByName(nome);if(!aba)throw e;
    pe_validarCabecalho_(aba,cabecalhos);
    const rows=aba.getDataRange().getValues().slice(1),result=rows.filter(r=>r.some(v=>v!==''&&v!=null)).map(row=>{const r={};cabecalhos.forEach((k,i)=>r[k]=row[i]);return r;});
    if(nome===PE_CONFIG.ABA_RASTRO)return result.map(r=>{if(af_incorporado_(r.Protocolo)){const old=r.Protocolo;r.Protocolo=af_resolver_(old);r['Origem da atualização']='['+old+'] '+(r['Origem da atualização']||'');}return r;}).filter(r=>af_os_(r.Protocolo));
    return result.filter(r=>af_os_(r.Protocolo));
  }
}

function pe_lerObjetosFonte_(nome, cabecalhos) {
  if(nome===PE_CONFIG.ABA_RASTRO){const origem=SpreadsheetApp.openById(PE_CONFIG.CONTROLE_ID),bs=pe_lerObjetos_(PE_CONFIG.ABA_BASE,PE_CABECALHOS_BASE),indice={porAlias:{}};bs.forEach(r=>{indice.porAlias[pe_chave_(r.Protocolo)]=r.Protocolo;if(r['ID legado'])indice.porAlias[pe_chave_(r['ID legado'])]=r.Protocolo;});af_vinculos_().forEach(v=>{indice.porAlias[pe_chave_(v.origem)]=af_resolver_(v.principal);indice.porAlias[pe_chave_(v.idOrigem)]=af_resolver_(v.principal);});const hist=origem.getSheetByName(PE_CONFIG.ABA_HISTORICO_ORIGEM);if(!hist)throw Error('Histórico de origem indisponível.');return pe_atualizarRastreabilidade_(null,hist,indice,true);}
  if(nome===PE_CONFIG.ABA_BASE){const origem=SpreadsheetApp.openById(PE_CONFIG.CONTROLE_ID).getSheetByName(PE_CONFIG.ABA_BASE_ORIGEM);if(!origem)throw Error('Base oficial indisponível. Nenhuma cópia antiga será apresentada como atual.');return pe_atualizarBase_(null,origem,true);}
  const aba = pe_planilha_().getSheetByName(nome);
  if (!aba) throw new Error('A base ' + nome + ' não existe. Execute a instalação.');
  pe_validarCabecalho_(aba, cabecalhos);
  if (aba.getLastRow() < 2) return [];
  const valores = aba.getRange(2, 1, aba.getLastRow() - 1, cabecalhos.length).getValues();
  return valores.filter(function(linha) {
    return linha.some(function(valor) { return valor !== '' && valor != null; });
  }).map(function(linha) {
    const item = {};
    cabecalhos.forEach(function(campo, i) { item[campo] = linha[i]; });
    return item;
  });
}

function pe_formatarData_(valor, comHora) {
  if (!valor) return '';
  const data = valor instanceof Date ? valor : new Date(valor);
  if (isNaN(data.getTime())) return pe_texto_(valor);
  return Utilities.formatDate(data, PE_CONFIG.FUSO,
    comHora ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy');
}

function pe_data_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) return valor;
  if (!valor) return null;
  const texto = pe_texto_(valor);
  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (br) return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]),
    Number(br[4] || 0), Number(br[5] || 0));
  const data = new Date(valor);
  return isNaN(data.getTime()) ? null : data;
}

function pe_dias_(valor) {
  const data = pe_data_(valor);
  if (!data) return '';
  const hoje = new Date();
  return Math.max(0, Math.floor((new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()) -
    new Date(data.getFullYear(), data.getMonth(), data.getDate())) / 86400000));
}

function pe_configuracao_() {
  const aba = pe_planilha_().getSheetByName(PE_CONFIG.ABA_CONFIG);
  const formularioPrincipal = aba ? pe_texto_(aba.getRange('B3').getValue()) : '';
  const telefone = aba ? pe_texto_(aba.getRange('B4').getValue()) : PE_CONFIG.TELEFONE_CENTRAL;
  return {
    formularioUnificado: PE_CONFIG.FORMULARIO_UNIFICADO,
    formularioPrincipal: formularioPrincipal,
    telefone: telefone || PE_CONFIG.TELEFONE_CENTRAL,
    whatsapp: 'https://wa.me/' + (telefone || PE_CONFIG.TELEFONE_CENTRAL)
  };
}

function pe_iniciar() {
  const bases = pe_lerObjetos_(PE_CONFIG.ABA_BASE, PE_CABECALHOS_BASE);
  const comunicacoes = pe_lerComunicacoes_('');
  const porProtocolo = comunicacoes.porProtocolo;
  const casos = bases.map(function(registro) {
    return pe_resumirCaso_(registro, porProtocolo[registro.Protocolo]);
  }).sort(pe_ordenarCasos_);
  const abertos = casos.filter(function(caso) { return af_aberto_(caso.status); });
  const diagnostico = pe_diagnosticoFormulario_();
  const propriedades = PropertiesService.getScriptProperties();
  return {
    versao: PE_CONFIG.VERSAO,
    ultimaAtualizacao: PE_LEITURA_LOCAL ? (pe_formatarData_(propriedades.getProperty(PE_CONFIG.ULTIMA_ATUALIZACAO_PROP),true)||'data indisponível')+' · cópia segura; aguardando próxima sincronização' : pe_formatarData_(new Date(),true)+' · leitura da base oficial',
    ultimoErro: propriedades.getProperty(PE_CONFIG.ULTIMO_ERRO_PROP) || '',
    casos: casos,
    indicadores: {
      abertos: abertos.length,
      execucao: abertos.filter(function(c) { return /execu/i.test(c.area); }).length,
      atendimento: abertos.filter(function(c) { return /atend/i.test(c.area); }).length,
      urgentes: abertos.filter(function(c) { return /alto|urgente/i.test(c.urgencia); }).length,
      naoLidas: abertos.reduce(function(total, c) { return total + c.naoLidas; }, 0),
      revisao: casos.filter(function(c) { return c.revisao; }).length
    },
    bi: pe_montarBi_(abertos),
    areas: PE_CONFIG.AREAS,
    configuracao: pe_configuracao_(),
    diagnostico: diagnostico
  };
}

function pe_resumirCaso_(registro, comunicacao) {
  comunicacao = comunicacao || {eventos: [], checklist: [], areaAtual: ''};
  const status = pe_texto_(registro.Status) || 'Em andamento';
  const concluido = af_fechado_(status);
  const prioridade = af_prioridade_(registro.Urgência,registro['Data de abertura'],status);
  const area = concluido ? 'Atendimento' :
    af_area_(status,registro['Área responsável'],registro['Última atualização'],comunicacao.areaAtual,comunicacao.dataArea);
  const eventosOutraArea = comunicacao.eventos.filter(function(evento) {
    return af_responsavel_(evento.area)!=='Execução';
  });
  const ultimoOutro = eventosOutraArea.length ? eventosOutraArea[eventosOutraArea.length - 1] : null;
  const naoLidas = comunicacao.eventos.filter(function(evento) {
    return af_responsavel_(evento.area)!=='Execução' && af_responsavel_(evento.destino)==='Execução' && !evento.lidoExecucao;
  }).length;
  return {
    id: pe_texto_(registro.Protocolo),
    nome: pe_texto_(registro.Nome),
    endereco: pe_texto_(registro.Endereço),
    assunto: pe_texto_(registro.Assunto),
    resumoDemanda: pe_texto_(registro.Solicitação || registro['Descrição detalhada'] || registro.Assunto).slice(0,240),
    tipo: pe_texto_(registro['Tipo de manifestação']),
    abertura: pe_formatarData_(registro['Data de abertura'], false),
    dias: prioridade.dias,
    status: status,
    area: area,
    proxima: af_revisao_(status)?af_rotulo_(status):pe_texto_(registro['Próxima ação']) || 'Analisar encaminhamento',
    urgencia: prioridade.rotulo, pontos:prioridade.pontos, prioridadeOriginal:registro.Urgência, motivoPrioridade:prioridade.motivo,
    procedencia: pe_texto_(registro.Procedência) || 'Em análise',
    ultima: pe_formatarData_(registro['Última atualização'], true),
    ultimaOutraArea: ultimoOutro ?
      ultimoOutro.data + ' · ' + ultimoOutro.area + ': ' +
        (ultimoOutro.mensagem || ultimoOutro.titulo) : '',
    naoLidas: naoLidas,
    revisao: registro['Revisão obrigatória'] === true ||
      /sim|revis/i.test(pe_texto_(registro['Revisão obrigatória'])),
    pdf: pe_texto_(registro.PDF),
    documento: pe_texto_(registro.Documento)
  };
}

function pe_ordenarCasos_(a,b){return af_ordenar_(a,b);}

function pe_montarBi_(casos) {
  function contar(chave) {
    const mapa = Object.create(null);
    casos.forEach(function(caso) {
      const valor = pe_texto_(caso[chave]) || 'Não informado';
      mapa[valor] = (mapa[valor] || 0) + 1;
    });
    return Object.keys(mapa).map(function(rotulo) {
      return {rotulo: rotulo, valor: mapa[rotulo]};
    }).sort(function(a, b) { return b.valor - a.valor || a.rotulo.localeCompare(b.rotulo); });
  }
  const faixas = [
    {rotulo: '0 a 3 dias', valor: 0}, {rotulo: '4 a 7 dias', valor: 0},
    {rotulo: '8 a 14 dias', valor: 0}, {rotulo: 'Acima de 14 dias', valor: 0}
  ];
  casos.forEach(function(caso) {
    const dias = Number(caso.dias || 0);
    faixas[dias <= 3 ? 0 : dias <= 7 ? 1 : dias <= 14 ? 2 : 3].valor++;
  });
  return {
    areas: contar('area'), status: contar('status'),
    procedencias: contar('procedencia'), urgencias: contar('urgencia'),
    faixas: faixas
  };
}

function pe_carregarFicha(protocolo) {
  protocolo = af_resolver_(pe_texto_(protocolo));
  if (!protocolo) throw new Error('Selecione uma ficha.');
  const registro = pe_lerObjetos_(PE_CONFIG.ABA_BASE, PE_CABECALHOS_BASE)
    .find(function(item) { return pe_texto_(item.Protocolo) === protocolo; });
  if (!registro) throw new Error('Protocolo não encontrado na cópia executiva.');
  let avisoLeitura='';try{pe_marcarLidoExecucao_(protocolo);}catch(e){avisoLeitura='Ficha disponível. Não foi possível marcar as mensagens como lidas: '+e.message;}
  const comunicacao = pe_lerComunicacoes_(protocolo).porProtocolo[protocolo] ||
    {eventos: [], checklist: [], areaAtual: ''};
  const rastro = pe_lerObjetos_(PE_CONFIG.ABA_RASTRO, PE_CABECALHOS_RASTRO)
    .filter(function(item) { return pe_texto_(item.Protocolo) === protocolo; })
    .sort(function(a, b) { return (pe_data_(a['Data e hora']) || 0) - (pe_data_(b['Data e hora']) || 0); })
    .map(function(item) {
      return {
        data: pe_formatarData_(item['Data e hora'], true),
        usuario: pe_texto_(item.Usuário) || 'Registro do sistema',
        status: pe_texto_(item.Status), procedencia: pe_texto_(item.Procedência),
        origem: pe_texto_(item['Origem da atualização']),
        tipo: pe_texto_(item['Tipo de evento']) || 'Atualização',
        area: pe_texto_(item['Área responsável']),
        proxima: pe_texto_(item['Próxima ação']),
        execucao: pe_formatarData_(item['Data da execução'], false),
        executadoPor: pe_texto_(item['Executado por']),
        evidencias: pe_texto_(item.Evidências)
      };
    });
  const naoProcedente = rastro.slice().reverse().find(function(item) {
    return /nao procedente/i.test(pe_chave_(item.procedencia));
  });
  const caso = pe_resumirCaso_(registro, comunicacao);
  const fotosAbertura = pe_fotos_(registro['Fotos da abertura'], 'abertura', 6);
  const fotosExecucao = pe_fotos_(registro['Fotos da execução'], 'execução', 8);
  return {
    id: protocolo, resumo: caso, avisoLeitura:avisoLeitura,
    nome: pe_texto_(registro.Nome), telefone: pe_texto_(registro.Telefone),
    email: pe_texto_(registro['E-mail']), endereco: pe_texto_(registro.Endereço),
    abertura: pe_formatarData_(registro['Data de abertura'], false),
    horario: pe_formatarHora_(registro.Horário),
    local: pe_texto_(registro['Local do atendimento']),
    responsavelAtendimento: pe_texto_(registro['Responsável pelo atendimento']),
    assunto: pe_texto_(registro.Assunto), tipo: pe_texto_(registro['Tipo de manifestação']),
    frente: pe_texto_(registro['Frente de obra']),
    solicitacao: pe_texto_(registro.Solicitação),
    descricao: pe_texto_(registro['Descrição detalhada']),
    solucao: pe_texto_(registro.Solução), finalizacao: pe_texto_(registro.Finalização),
    status: pe_texto_(registro.Status),
    dataConclusao: pe_formatarData_(registro['Data de conclusão'], false),
    procedencia: pe_texto_(registro.Procedência) || 'Em análise',
    urgencia: caso.urgencia, pontos:caso.pontos, prioridadeOriginal:caso.prioridadeOriginal, motivoPrioridade:caso.motivoPrioridade,
    area: caso.area, proxima: caso.proxima,
    documento: pe_texto_(registro.Documento), pdf: pe_texto_(registro.PDF),
    situacaoDocumental: pe_texto_(registro['Situação documental']),
    camposFaltantes: pe_texto_(registro['Campos faltantes']),
    revisao: caso.revisao, motivoRevisao: pe_texto_(registro['Motivo da revisão']),
    comunicacao: comunicacao, rastreabilidade: rastro,
    naoProcedencia: naoProcedente ? {
      data: naoProcedente.data, usuario: naoProcedente.usuario,
      origem: naoProcedente.origem, tipo: naoProcedente.tipo
    } : null,
    fotos: fotosAbertura.concat(fotosExecucao)
  };
}

function pe_formatarHora_(valor) {
  if (!valor) return '';
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return Utilities.formatDate(valor, PE_CONFIG.FUSO, 'HH:mm');
  }
  return pe_texto_(valor);
}

function pe_lerComunicacoes_(protocolo) {
  const aba = pe_prepararComunicacao_(pe_planilha_());
  const porProtocolo = Object.create(null);
  
  const linhas = aba.getLastRow()>1?aba.getRange(2,1,aba.getLastRow()-1,PE_CABECALHOS_COMUNICACAO.length).getValues():[];
  af_eventosCompartilhados_().forEach(e=>linhas.push([e.chave,e.protocolo,e.dataHora,e.usuario,e.areaAutora,'',e.tipo,e.mensagem,'','','','','',e.arquivos,e.lidoAtendimento,e.lidoExecucao,e.origem]));
  linhas.forEach(function(linha) {
    const original=pe_texto_(linha[1]), id = af_resolver_(original);
    if (!id || (protocolo && id !== protocolo)) return;
    if (!porProtocolo[id]) porProtocolo[id] = {eventos: [], checklist: [], areaAtual: ''};
    porProtocolo[id].eventos.push({
      chave: pe_texto_(linha[0]), protocolo: id, protocoloOrigem: original!==id ? original : '',
      dataValor: pe_data_(linha[2])?pe_data_(linha[2]).toISOString():null, data: pe_formatarData_(linha[2], true),
      usuario: pe_texto_(linha[3]) || 'Usuário identificado na planilha',
      area: pe_texto_(linha[4]), destino: pe_texto_(linha[5]),
      tipo: pe_texto_(linha[6]), mensagem: (original!==id?'['+original+'] ':'')+pe_texto_(linha[7]),
      titulo: pe_texto_(linha[8]), chaveItem: pe_texto_(linha[9]),
      situacao: pe_texto_(linha[10]), prioridade: pe_texto_(linha[11]),
      prazo: pe_formatarData_(linha[12], false), arquivos: pe_texto_(linha[13]),
      lidoAtendimento: Boolean(linha[14]), lidoExecucao: Boolean(linha[15]),
      origem: pe_texto_(linha[16])
    });
  });

  Object.keys(porProtocolo).forEach(function(id) {
    const grupo = porProtocolo[id];
    grupo.eventos.sort(function(a, b) {
      return (pe_data_(a.dataValor) || 0) - (pe_data_(b.dataValor) || 0);
    });
    const itens = Object.create(null);
    grupo.eventos.forEach(function(evento) {
      if (!evento.protocoloOrigem && /encaminhamento|comentario|comentário|checklist/i.test(evento.tipo) && evento.destino) {
        grupo.areaAtual = evento.destino;grupo.dataArea=evento.dataValor;
      }
      if (!evento.chaveItem) return;
      if (!itens[evento.chaveItem]) itens[evento.chaveItem] = {
        chave: evento.chaveItem, titulo: evento.titulo,
        destino: evento.destino, prioridade: evento.prioridade || 'Média',
        prazo: evento.prazo, situacao: evento.situacao || 'Pendente',
        criadoEm: evento.data
      };
      const item = itens[evento.chaveItem];
      if (evento.titulo) item.titulo = evento.titulo;
      if (evento.destino) item.destino = evento.destino;
      if (evento.prioridade) item.prioridade = evento.prioridade;
      if (evento.prazo) item.prazo = evento.prazo;
      if (evento.situacao) item.situacao = evento.situacao;
    });
    grupo.checklist = Object.keys(itens).map(function(chave) { return itens[chave]; });
  });
  return {porProtocolo: porProtocolo};
}

function pe_marcarLidoExecucao_(protocolo) {
  const aba = pe_prepararComunicacao_(pe_planilha_());
  if (aba.getLastRow() < 2) return;
  const dados = aba.getRange(2, 1, aba.getLastRow() - 1,
    PE_CABECALHOS_COMUNICACAO.length).getValues();
  const agora = new Date();
  dados.forEach(function(linha, indice) {
    if (af_resolver_(pe_texto_(linha[1])) === protocolo && af_responsavel_(linha[4])!=='Execução' &&
        af_responsavel_(linha[5])==='Execução' && !linha[15]) {
      // Atualiza somente a célula de leitura. Assim uma mensagem adicionada
      // pela outra planilha no mesmo instante nunca é sobrescrita.
      aba.getRange(indice + 2, 16).setValue(agora)
        .setNumberFormat('dd/MM/yyyy HH:mm:ss');
    }
  });
}

function pe_salvarComunicacao(p) {
  p = p || {};
  const protocolo = pe_texto_(p.protocolo), destino = pe_texto_(p.destino);
  const mensagem = pe_texto_(p.mensagem), arquivos = pe_texto_(p.arquivos);
  if (!protocolo) throw new Error('Selecione uma ficha.');
  if (PE_CONFIG.AREAS.indexOf(destino) < 0) throw new Error('Selecione a área de destino.');
  if (!mensagem || mensagem.length < 8) throw new Error('Registre o contexto da atualização.');
  if (mensagem.length > 5000 || arquivos.length > 5000) throw new Error('O registro está muito extenso.');
  pe_confirmarProtocolo_(protocolo);
  pe_adicionarEvento_({
    chave: pe_uuid_(p.pedidoId), protocolo: protocolo, area: 'Execução', destino: destino,
    tipo: 'Encaminhamento entre áreas', mensagem: mensagem, arquivos: arquivos,
    origem: 'Painel Executivo da Execução'
  });
  return {
    mensagem: 'Atualização compartilhada. O Atendimento verá o novo sinal na ficha.',
    comunicacao: pe_lerComunicacoes_(protocolo).porProtocolo[protocolo]
  };
}

function pe_criarChecklist(p) {
  p = p || {};
  const protocolo = pe_texto_(p.protocolo), destino = pe_texto_(p.destino);
  const titulo = pe_texto_(p.titulo), prioridade = pe_texto_(p.prioridade) || 'Média';
  if (!protocolo) throw new Error('Selecione uma ficha.');
  if (!titulo || titulo.length < 5) throw new Error('Informe o resultado esperado.');
  if (PE_CONFIG.AREAS.indexOf(destino) < 0) throw new Error('Selecione o responsável pelo item.');
  if (['Baixa', 'Média', 'Alta', 'Urgente'].indexOf(prioridade) < 0) {
    throw new Error('Prioridade inválida.');
  }
  pe_confirmarProtocolo_(protocolo);
  const chaveItem = Utilities.getUuid();
  pe_adicionarEvento_({
    chave: pe_uuid_(p.pedidoId), protocolo: protocolo, area: 'Execução', destino: destino,
    tipo: 'Checklist compartilhado', mensagem: pe_texto_(p.mensagem), titulo: titulo,
    chaveItem: chaveItem, situacao: 'Pendente', prioridade: prioridade,
    prazo: pe_dataObrigatoriaOpcional_(p.prazo), origem: 'Painel Executivo da Execução'
  });
  return {
    mensagem: 'Item criado com responsável e rastreabilidade.',
    comunicacao: pe_lerComunicacoes_(protocolo).porProtocolo[protocolo]
  };
}

function pe_alterarChecklist(p) {
  p = p || {};
  const protocolo = pe_texto_(p.protocolo), chave = pe_texto_(p.chaveItem);
  const situacao = pe_texto_(p.situacao);
  if (!protocolo || !chave) throw new Error('Item de checklist não identificado.');
  if (['Pendente', 'Concluído'].indexOf(situacao) < 0) throw new Error('Situação inválida.');
  const atual = pe_lerComunicacoes_(protocolo).porProtocolo[protocolo];
  const item = atual && atual.checklist.find(function(i) { return i.chave === chave; });
  if (!item) throw new Error('O item não foi localizado. Reabra a ficha.');
  const destino = situacao === 'Concluído' ? 'Atendimento' : 'Execução';
  pe_adicionarEvento_({
    chave: pe_uuid_(p.pedidoId), protocolo: protocolo, area: 'Execução', destino: destino,
    tipo: 'Atualização de checklist',
    mensagem: pe_texto_(p.mensagem) ||
      (situacao === 'Concluído' ? 'Item concluído pela Execução e encaminhado para conferência.' :
        'Item reaberto para nova análise da Execução.'),
    titulo: item.titulo, chaveItem: chave, situacao: situacao,
    prioridade: item.prioridade, prazo: pe_data_(item.prazo),
    origem: 'Painel Executivo da Execução'
  });
  return {
    mensagem: situacao === 'Concluído' ?
      'Item concluído e devolvido ao Atendimento para conferência.' : 'Item reaberto.',
    comunicacao: pe_lerComunicacoes_(protocolo).porProtocolo[protocolo]
  };
}

function pe_adicionarEvento_(evento) {
  const aba = pe_prepararComunicacao_(pe_planilha_());
  const trava = LockService.getScriptLock();
  trava.waitLock(30000);
  try {
    if (aba.getLastRow() >= 2) {
      const chaves = aba.getRange(2, 1, aba.getLastRow() - 1, 1).getDisplayValues()
        .map(function(linha) { return linha[0]; });
      if (chaves.indexOf(evento.chave) >= 0) return;
    }
    const agora = new Date();
    const usuario = Session.getActiveUser().getEmail() ||
      Session.getEffectiveUser().getEmail() || 'Usuário com edição na planilha';
    aba.appendRow([
      evento.chave, evento.protocolo, agora, usuario,
      evento.area, evento.destino, evento.tipo, evento.mensagem || '',
      evento.titulo || '', evento.chaveItem || '', evento.situacao || '',
      evento.prioridade || '', evento.prazo || '', evento.arquivos || '',
      '', agora, evento.origem || 'Painel Executivo da Execução', PE_CONFIG.VERSAO
    ]);
  } finally {
    trava.releaseLock();
  }
}

function pe_uuid_(valor) {
  valor = pe_texto_(valor);
  return /^[a-f0-9-]{36}$/i.test(valor) ? valor : Utilities.getUuid();
}

function pe_dataObrigatoriaOpcional_(valor) {
  if (!pe_texto_(valor)) return '';
  const data = pe_data_(valor);
  if (!data) throw new Error('Informe o prazo no formato dd/mm/aaaa.');
  return data;
}

function pe_confirmarProtocolo_(protocolo) {
  const existe = pe_lerObjetos_(PE_CONFIG.ABA_BASE, PE_CABECALHOS_BASE)
    .some(function(item) { return pe_texto_(item.Protocolo) === protocolo; });
  if (!existe) throw new Error('Protocolo não localizado na cópia executiva. Atualize o painel.');
}

function pe_fotos_(texto, grupo, limite) {
  const vistos = Object.create(null), fotos = [];
  pe_texto_(texto).split(/[\n,;]+/).map(function(link) { return link.trim(); })
    .filter(Boolean).forEach(function(link) {
      if (vistos[link] || fotos.length >= limite) return;
      vistos[link] = true;
      fotos.push({
        link: link, grupo: grupo,
        nome: grupo === 'abertura' ? 'Evidência da abertura' : 'Evidência da execução',
        preview: pe_previewDrive_(link)
      });
    });
  return fotos;
}

function pe_idDrive_(link) {
  const texto = pe_texto_(link);
  const padroes = [/[?&]id=([a-zA-Z0-9_-]{20,})/, /\/d\/([a-zA-Z0-9_-]{20,})/,
    /^([a-zA-Z0-9_-]{20,})$/];
  for (let i = 0; i < padroes.length; i++) {
    const match = texto.match(padroes[i]); if (match) return match[1];
  }
  return '';
}

function pe_blobImagem_(link) {
  const id = pe_idDrive_(link);
  if (!id) return null;
  try {
    const arquivo = DriveApp.getFileById(id);
    const miniatura = arquivo.getThumbnail();
    if (miniatura) return miniatura;
    const tipo = arquivo.getMimeType();
    if (/^image\//i.test(tipo) && arquivo.getSize() <= 2500000) return arquivo.getBlob();
  } catch (erro) {
    console.warn('Evidência sem prévia: ' + erro.message);
  }
  return null;
}

function pe_previewDrive_(link) {
  const blob = pe_blobImagem_(link);
  if (!blob) return '';
  return 'data:' + (blob.getContentType() || 'image/jpeg') + ';base64,' +
    Utilities.base64Encode(blob.getBytes());
}

function pe_gerarFichaComunicacaoPdf(protocolo) {
  const ficha = pe_carregarFicha(protocolo);
  const nome = 'Ficha de Comunicação ' + ficha.id + ' ' +
    Utilities.formatDate(new Date(), PE_CONFIG.FUSO,
      'yyyyMMdd-HHmmss');
  const documento = DocumentApp.create(nome);
  const corpo = documento.getBody();
  corpo.clear();
  corpo.setMarginTop(32).setMarginBottom(32).setMarginLeft(38).setMarginRight(38);

  const titulo = corpo.appendParagraph('FICHA DE COMUNICAÇÃO ENTRE ÁREAS');
  titulo.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  titulo.editAsText().setForegroundColor(PE_CORES.NAVY).setBold(true);
  const subtitulo = corpo.appendParagraph('Consórcio Performance Tamanduateí · ' + ficha.id);
  subtitulo.editAsText().setForegroundColor(PE_CORES.PETROLEO).setBold(true);
  const aviso = corpo.appendParagraph(
    'Documento operacional para alinhamento interno. Não substitui a ficha oficial enviada à Sabesp.'
  );
  aviso.editAsText().setItalic(true).setForegroundColor(PE_CORES.CINZA);

  pe_secaoDocumento_(corpo, 'SITUAÇÃO ATUAL');
  pe_tabelaDocumento_(corpo, [
    ['Status', ficha.status], ['Com quem está', ficha.area],
    ['Prioridade', ficha.urgencia], ['Próximo movimento', ficha.proxima],
    ['Procedência', ficha.procedencia], ['Abertura', ficha.abertura]
  ]);

  pe_secaoDocumento_(corpo, 'IDENTIFICAÇÃO');
  pe_tabelaDocumento_(corpo, [
    ['Solicitante', ficha.nome], ['Telefone', ficha.telefone],
    ['E-mail', ficha.email], ['Endereço', ficha.endereco],
    ['Assunto', ficha.assunto], ['Tipo', ficha.tipo], ['Frente', ficha.frente]
  ]);

  pe_blocoDocumento_(corpo, 'SOLICITAÇÃO', ficha.solicitacao);
  if (ficha.descricao) pe_blocoDocumento_(corpo, 'CONTEXTO DA OCORRÊNCIA', ficha.descricao);
  pe_blocoDocumento_(corpo, 'PROVIDÊNCIAS REGISTRADAS', ficha.solucao || 'Em atualização.');
  pe_blocoDocumento_(corpo, 'RESULTADO ATUAL', ficha.finalizacao || 'Em acompanhamento.');

  pe_secaoDocumento_(corpo, 'RASTREABILIDADE DA PROCEDÊNCIA');
  if (ficha.naoProcedencia) {
    corpo.appendParagraph(
      'Registro de não procedência: ' + ficha.naoProcedencia.data + ' · ' +
      ficha.naoProcedencia.usuario + ' · ' +
      (ficha.naoProcedencia.origem || ficha.naoProcedencia.tipo)
    );
  } else {
    corpo.appendParagraph('Procedência atual: ' + ficha.procedencia + '.');
  }

  pe_secaoDocumento_(corpo, 'COMPROMISSOS COMPARTILHADOS');
  const checklist = ficha.comunicacao.checklist || [];
  if (!checklist.length) corpo.appendParagraph('Nenhum item compartilhado registrado.');
  checklist.forEach(function(item) {
    corpo.appendListItem(
      '[' + item.situacao + '] ' + item.titulo + ' · ' + item.destino +
      ' · prioridade ' + item.prioridade + (item.prazo ? ' · prazo ' + item.prazo : '')
    );
  });

  pe_secaoDocumento_(corpo, 'COMUNICAÇÃO ENTRE ÁREAS');
  const eventos = ficha.comunicacao.eventos || [];
  if (!eventos.length) corpo.appendParagraph('Ainda não há mensagens compartilhadas.');
  eventos.forEach(function(evento) {
    const cabecalho = corpo.appendParagraph(
      evento.data + ' · ' + evento.area + ' → ' + (evento.destino || 'registro')
    );
    cabecalho.editAsText().setBold(true).setForegroundColor(PE_CORES.PETROLEO);
    corpo.appendParagraph(evento.mensagem || evento.titulo || evento.tipo);
    if (evento.arquivos) {
      const arquivos = corpo.appendParagraph('Arquivos: ' + evento.arquivos);
      arquivos.editAsText().setForegroundColor(PE_CORES.AZUL);
    }
  });

  if (ficha.fotos.length) {
    pe_secaoDocumento_(corpo, 'EVIDÊNCIAS DISPONÍVEIS');
    ficha.fotos.slice(0, 8).forEach(function(foto, indice) {
      const blob = pe_blobImagem_(foto.link);
      if (blob) {
        try {
          const imagem = corpo.appendImage(blob);
          const largura = imagem.getWidth(), altura = imagem.getHeight();
          const escala = Math.min(1, 470 / largura, 290 / altura);
          imagem.setWidth(Math.max(1, Math.round(largura * escala)))
            .setHeight(Math.max(1, Math.round(altura * escala)));
        } catch (erro) {
          corpo.appendParagraph('Evidência ' + (indice + 1) + ': ' + foto.link);
        }
      } else {
        corpo.appendParagraph('Evidência ' + (indice + 1) + ': ' + foto.link);
      }
    });
  }

  const rodape = corpo.appendParagraph('\nGerado em ' + pe_formatarData_(new Date(), true) +
    ' pelo Painel Executivo da Execução ' + PE_CONFIG.VERSAO);
  rodape.editAsText().setFontSize(8).setForegroundColor(PE_CORES.CINZA);
  documento.saveAndClose();

  const pasta = pe_pastaPdf_();
  const arquivoDocumento = DriveApp.getFileById(documento.getId());
  const pdf = pasta.createFile(arquivoDocumento.getAs(MimeType.PDF).setName(nome + '.pdf'));
  arquivoDocumento.setTrashed(true);
  return {
    protocolo: ficha.id,
    url: pdf.getUrl(),
    download: 'https://drive.google.com/uc?export=download&id=' + pdf.getId(),
    nome: pdf.getName(),
    mensagem: 'Ficha de comunicação gerada. O arquivo mantém as permissões do Drive.'
  };
}

function pe_secaoDocumento_(corpo, titulo) {
  const p = corpo.appendParagraph(titulo);
  p.setSpacingBefore(12).setSpacingAfter(5);
  p.editAsText().setBold(true).setForegroundColor(PE_CORES.NAVY);
}

function pe_blocoDocumento_(corpo, titulo, texto) {
  pe_secaoDocumento_(corpo, titulo);
  corpo.appendParagraph(pe_texto_(texto) || 'Não informado.');
}

function pe_tabelaDocumento_(corpo, pares) {
  const linhas = pares.filter(function(par) { return pe_texto_(par[1]); })
    .map(function(par) { return [par[0], pe_texto_(par[1])]; });
  if (!linhas.length) return;
  const tabela = corpo.appendTable(linhas);
  for (let i = 0; i < tabela.getNumRows(); i++) {
    tabela.getRow(i).getCell(0).setBackgroundColor('#E8F1F5');
    tabela.getRow(i).getCell(0).editAsText().setBold(true);
  }
}

function pe_pastaPdf_() {
  const propriedades = PropertiesService.getScriptProperties();
  const existente = propriedades.getProperty(PE_CONFIG.PASTA_PDF_PROP);
  if (existente) {
    try { return DriveApp.getFolderById(existente); } catch (erro) {
      propriedades.deleteProperty(PE_CONFIG.PASTA_PDF_PROP);
    }
  }
  const arquivo = DriveApp.getFileById(PE_CONFIG.PLANILHA_ID);
  const pais = arquivo.getParents();
  const pai = pais.hasNext() ? pais.next() : DriveApp.getRootFolder();
  const localizadas = pai.getFoldersByName('Fichas de Comunicação — Atendimento e Execução');
  const pasta = localizadas.hasNext() ? localizadas.next() :
    pai.createFolder('Fichas de Comunicação — Atendimento e Execução');
  propriedades.setProperty(PE_CONFIG.PASTA_PDF_PROP, pasta.getId());
  return pasta;
}

function pe_diagnosticoFormulario_() {
  const ss = pe_planilha_();
  const cabecalhos = [];
  ss.getSheets().filter(function(aba) {
    return /^Respostas ao formulário/i.test(aba.getName());
  }).forEach(function(aba) {
    if (aba.getLastColumn()) cabecalhos.push.apply(cabecalhos,
      aba.getRange(1, 1, 1, aba.getLastColumn()).getDisplayValues()[0]);
  });
  const chaves = cabecalhos.map(pe_chave_);
  const perguntaSegmento = pe_chave_(
    'A demanda deve ser encaminhada para qual segmento do Consórcio?'
  );
  const temSegmento = chaves.indexOf(perguntaSegmento) >= 0;
  const temDataAbertura = chaves.some(function(campo) {
    return /data (de|da) abertura|data da ficha|data do atendimento/.test(campo);
  });
  return {
    temSegmento: temSegmento,
    temDataAbertura: temDataAbertura,
    avisos: [
      temSegmento ? '' :
        'O formulário ainda não possui a pergunta de segmento. Novas aberturas ficam com o Atendimento para triagem.',
      temDataAbertura ? '' :
        'O formulário ainda não possui uma data própria de abertura. O carimbo é usado provisoriamente e fica sinalizado na auditoria.'
    ].filter(Boolean)
  };
}

function diagnosticarPainelExecutivoExecucao() {
  const resultado = {
    versao: PE_CONFIG.VERSAO,
    executadoEm: new Date().toISOString(),
    somenteLeitura: true,
    planilha: pe_planilha_().getName(),
    gatilhos: ScriptApp.getProjectTriggers().map(function(gatilho) {
      return {funcao: gatilho.getHandlerFunction(), evento: String(gatilho.getEventType())};
    }),
    formulario: pe_diagnosticoFormulario_(),
    abas: [PE_CONFIG.ABA_DASHBOARD, PE_CONFIG.ABA_FICHAS, PE_CONFIG.ABA_BASE,
      PE_CONFIG.ABA_RASTRO, PE_CONFIG.ABA_COMUNICACAO].map(function(nome) {
        const aba = pe_planilha_().getSheetByName(nome);
        return {nome: nome, existe: Boolean(aba), linhas: aba ? aba.getLastRow() : 0};
      })
  };
  console.log(JSON.stringify(resultado, null, 2));
  SpreadsheetApp.getUi().alert(
    'Diagnóstico concluído',
    'O resultado completo foi registrado no histórico de execução.\n\n' +
      resultado.formulario.avisos.join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
  return resultado;
}

function pe_html_() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    :root{--navy:#10263a;--navy2:#173f59;--petrol:#078c91;--lime:#b7f34a;--orange:#d7822e;--red:#bd4b43;--blue:#3b75b6;--ink:#17283a;--muted:#607487;--line:#d7e1e8;--bg:#eef3f7;--white:#fff;--shadow:0 14px 45px rgba(20,45,65,.12)}
    *{box-sizing:border-box}html,body{height:100%;margin:0}body{font:14px Arial,sans-serif;color:var(--ink);background:var(--bg);overflow:hidden}button,input,select,textarea{font:inherit}button{cursor:pointer}.app{display:grid;grid-template-columns:224px minmax(0,1fr);height:100vh}.side{background:var(--navy);color:#fff;padding:22px 14px;display:flex;flex-direction:column;min-height:0}.brand{padding:4px 12px 23px}.brand b{display:block;color:var(--lime);font-size:25px;letter-spacing:3px}.brand span{display:block;color:#c9d9e5;font-size:12px;margin-top:4px}.nav{display:grid;gap:5px}.nav button{border:0;border-radius:9px;padding:12px;background:transparent;color:#dce8ef;text-align:left;font-weight:700}.nav button:hover,.nav button.active{background:#284b61}.nav button.active{box-shadow:inset 3px 0 var(--lime)}.nav small{display:block;margin:17px 12px 4px;color:#7f9bad;text-transform:uppercase;letter-spacing:1.2px;font-size:10px;font-weight:800}.version{margin-top:auto;padding:12px;color:#8da7b7;font-size:11px}.work{display:grid;grid-template-rows:auto 1fr;min-width:0;min-height:0}.top{background:#fff;border-bottom:1px solid var(--line);display:grid;grid-template-columns:minmax(230px,1fr) minmax(330px,560px) auto;gap:16px;align-items:center;padding:14px 24px}.title h1{margin:0;font-size:20px}.title p{margin:4px 0 0;color:var(--muted);font-size:12px}.picker label{display:block;font-size:11px;color:var(--muted);font-weight:700;margin-bottom:5px}.picker select{width:100%;border:1px solid #bfd0db;border-radius:8px;padding:10px;background:#fff}.sync{font-size:11px;color:var(--muted);white-space:nowrap}.sync i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#278260;margin-right:6px}.main{overflow:auto;padding:22px 24px 42px}.page{display:none}.page.active{display:block}.hero{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;margin-bottom:16px}.hero h2{margin:0 0 5px;font-size:23px}.hero p{margin:0;color:var(--muted);line-height:1.45}.cards{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:11px;margin-bottom:17px}.metric{background:#fff;border:1px solid var(--line);border-top:4px solid var(--petrol);border-radius:12px;padding:15px;box-shadow:0 3px 14px rgba(28,54,72,.04)}.metric small{display:block;color:#557087;text-transform:uppercase;letter-spacing:.65px;font-size:9px;font-weight:800}.metric strong{display:block;font-size:27px;margin:7px 0 2px}.metric span{font-size:10px;color:var(--muted)}.metric.orange{border-top-color:var(--orange)}.metric.blue{border-top-color:var(--blue)}.metric.red{border-top-color:var(--red)}.metric.lime{border-top-color:#7eae2e}.metric.navy{border-top-color:var(--navy)}.panel{background:#fff;border:1px solid var(--line);border-radius:13px;margin-bottom:16px;box-shadow:0 5px 20px rgba(21,49,69,.05)}.panel-head{padding:15px 18px;border-bottom:1px solid #e3ebf0;display:flex;justify-content:space-between;align-items:center;gap:10px}.panel-head h3{font-size:16px;margin:0}.panel-body{padding:18px}.filters{display:grid;grid-template-columns:minmax(260px,1fr) 180px 180px;gap:10px}.input,input,select,textarea{width:100%;border:1px solid #bccdd8;border-radius:8px;padding:10px 11px;color:var(--ink);background:#fff}textarea{min-height:90px;resize:vertical;line-height:1.47}label{display:block;font-size:12px;font-weight:700;margin:0 0 6px}.hint{color:var(--muted);font-size:12px;line-height:1.5}.btn{display:inline-block;border:1px solid #b8cad5;border-radius:8px;padding:10px 14px;background:#fff;color:#234459;font-weight:700;text-decoration:none}.btn.primary{background:var(--petrol);border-color:var(--petrol);color:#fff}.btn.dark{background:var(--navy);border-color:var(--navy);color:#fff}.btn.small{padding:7px 10px;font-size:12px}.btn:disabled{opacity:.5;cursor:wait}.actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.table-wrap{overflow:auto;max-height:490px}.cases{width:100%;border-collapse:collapse;min-width:980px}.cases th{position:sticky;top:0;background:#f2f7fa;color:#536e80;text-transform:uppercase;font-size:10px;letter-spacing:.55px;text-align:left;padding:10px;border-bottom:1px solid var(--line);z-index:1}.cases td{padding:11px 10px;border-bottom:1px solid #e8eef2;vertical-align:top}.cases tbody tr{cursor:pointer}.cases tbody tr:hover,.cases tbody tr.selected{background:#edfafa}.protocol{font-weight:800;color:#08757a}.badge{display:inline-flex;border-radius:999px;padding:5px 8px;background:#edf2f5;color:#405b6c;font-size:10px;font-weight:800;white-space:nowrap}.badge.exec{background:#fff0dc;color:#925919}.badge.atd{background:#e2f4ee;color:#216f55}.badge.alert{background:#fde9e7;color:#9f3c36}.unread{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:var(--red);color:#fff;font-size:10px;font-weight:800}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:11px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-bottom:16px}.summary div{background:#fff;padding:12px}.summary small{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;font-weight:800}.summary b{display:block;margin-top:5px}.charts{display:grid;grid-template-columns:1fr 1fr;gap:16px}.chart{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px}.chart h3{margin:0 0 4px;font-size:15px}.bar-row{display:grid;grid-template-columns:145px 1fr 32px;gap:10px;align-items:center;margin-top:12px}.bar-row label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0;color:#40596a}.track{height:13px;border-radius:999px;background:#e9eff3;overflow:hidden}.bar{height:100%;min-width:3px;border-radius:999px;background:var(--petrol)}.bar.orange{background:var(--orange)}.bar.blue{background:var(--blue)}.bar.red{background:var(--red)}.bar.lime{background:#82b232}.paper-wrap{display:flex;justify-content:center}.paper{width:min(100%,900px);background:#fff;border:1px solid #cbd7df;box-shadow:var(--shadow);padding:28px 32px;color:#17212b}.paper-title{background:var(--navy2);color:#fff;margin:-28px -32px 18px;padding:18px 24px}.paper-title h3{margin:0;font-size:21px}.paper-title p{margin:5px 0 0;color:#d9e6ef}.info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.info{border:1px solid var(--line);border-radius:7px;padding:10px}.info small{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;font-weight:800}.info b{display:block;margin-top:4px}.section{border-top:2px solid var(--navy2);margin-top:18px;padding-top:12px}.section h4{margin:0 0 9px;text-transform:uppercase;font-size:11px;letter-spacing:.7px}.narrative{white-space:pre-wrap;line-height:1.58}.photo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.photo{border:1px solid var(--line);border-radius:8px;overflow:hidden;background:#f1f5f7}.photo img{display:block;width:100%;height:155px;object-fit:contain;background:#e9eef1}.photo a{display:block;padding:7px;color:#08757a;font-size:10px;font-weight:700;text-decoration:none}.timeline{display:grid;gap:10px}.event{border-left:3px solid #9db7c7;padding:2px 0 2px 13px}.event.exec{border-color:var(--orange)}.event.atd{border-color:var(--petrol)}.event b{font-size:12px}.event small{display:block;color:var(--muted);margin:3px 0 5px}.event p{white-space:pre-wrap;margin:0;line-height:1.48}.checklist{display:grid;gap:9px}.check{display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:start;border:1px solid var(--line);border-radius:9px;padding:10px}.check.done{opacity:.65;background:#f3f7f5}.check input{width:18px;height:18px;margin:1px 0}.check small{color:var(--muted)}.notice{padding:11px 13px;border-radius:9px;margin-bottom:13px;line-height:1.45}.notice:empty{display:none}.notice.ok{background:#e4f4ed;color:#225f4d}.notice.warn{background:#fff1dc;color:#875313}.notice.error{background:#fde9e7;color:#8f3833}.notice.loading{background:#e8f1f8;color:#2b5877}.empty{padding:26px;text-align:center;color:var(--muted)}.quick{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.quick-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px}.quick-card h3{margin:0 0 8px}.quick-card p{color:var(--muted);min-height:54px}.loader{display:inline-block;width:13px;height:13px;border:2px solid #b5c8d4;border-top-color:var(--petrol);border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:1040px){.app{grid-template-columns:78px minmax(0,1fr)}.brand span,.nav button span,.nav small,.version{display:none}.brand b{font-size:18px}.nav button{text-align:center}.top{grid-template-columns:1fr}.cards{grid-template-columns:repeat(3,1fr)}.grid2,.charts{grid-template-columns:1fr}.filters{grid-template-columns:1fr}.quick{grid-template-columns:1fr}.photo-grid{grid-template-columns:repeat(2,1fr)}}
    @media print{body{overflow:visible;background:#fff}.side,.top,#message,.page:not(#ficha),#ficha>.hero,#ficha>.summary,#ficha>.grid2,#ficha>.actions,.screen-only{display:none!important}.app,.work{display:block;height:auto}.main{padding:0;overflow:visible}.paper{width:100%;border:0;box-shadow:none}.page#ficha{display:block}.paper-wrap{display:block}}
  
:root{--ui-font:16px;--lime:#47c8f5;--navy:#08364c;--petrol:#007e94}
body{font-size:var(--ui-font);line-height:1.45}.topbar{grid-template-columns:minmax(190px,1fr) minmax(230px,1.2fr);gap:10px}.access-controls{display:flex;gap:12px;grid-column:1/-1;align-items:center;flex-wrap:wrap}.access-controls label{display:flex;align-items:center;gap:8px;font-size:13px;margin:0}.access-controls select{width:auto;padding:6px 10px;min-height:36px}.sidebar{border-top:4px solid #ed1b2f}.brand b{letter-spacing:0}.nav button{font-size:var(--ui-font);min-height:44px}.metric strong{text-align:center}.badge{white-space:normal}.case-table{font-size:var(--ui-font)}.case-table small,.hint,.event b,.event small{font-size:.88rem}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #009ee2;outline-offset:3px}.case-table td{line-height:1.4}.nav button span{display:inline}.case-table th{font-size:12px}
@media(max-width:1100px){.app{grid-template-columns:190px minmax(0,1fr)}.nav button span{display:inline}.nav button{text-align:left}.topbar{grid-template-columns:1fr}.filters{grid-template-columns:1fr 1fr}.main{padding:16px}.cards{grid-template-columns:repeat(2,1fr)}}
@media(max-width:720px){.app{display:flex;flex-direction:column}.sidebar{padding:8px;max-height:180px;flex:none}.brand,.version,.nav .group{display:none}.nav{display:flex;flex-wrap:wrap;gap:4px}.nav button{padding:8px}.workspace{flex:1;min-height:0}.grid2,.grid3,.selected-summary{grid-template-columns:1fr}.filters{grid-template-columns:1fr}.topbar{padding:10px}.access-controls{gap:8px}}


/* Ajuste exclusivamente visual: mais área útil e uma rolagem vertical por página. */
@media screen{
.app{grid-template-columns:206px minmax(0,1fr)}
.sidebar,.side{padding:14px 10px;min-height:0;border-top:4px solid #ed1b2f}
.brand{padding:3px 10px 12px}.brand b{font-size:23px}.brand span{margin-top:2px}
.nav{gap:3px;overflow:auto;min-height:0}.nav button{padding:9px 10px;min-height:40px;line-height:1.25;flex-shrink:0}
.nav .group,.nav small{margin:12px 10px 4px}.version{padding:8px 10px 0;font-size:11px}
.topbar,.top{display:grid;grid-template-columns:minmax(170px,.8fr) minmax(250px,1.35fr) auto;gap:6px 16px;padding:10px 18px;align-items:center}
.title{grid-column:1;grid-row:1}.title h1{font-size:20px;line-height:1.15}.title p{margin-top:3px;line-height:1.25;font-size:12px}
.case-picker,.picker{grid-column:2;grid-row:1}.case-picker select,.picker select{padding:8px 10px;min-height:39px}
.access-controls{grid-column:3;grid-row:1;display:flex;flex-wrap:nowrap;gap:10px;align-items:end}
.access-controls label{display:flex;flex-direction:column;align-items:flex-start;gap:4px;font-size:11px;margin:0}
.access-controls select{min-height:36px;padding:7px 9px;max-width:165px;font-size:13px}
.status-dot,.sync{grid-column:1/-1;grid-row:2;font-size:11px;line-height:1.2;margin:0;white-space:normal}
.main{padding:16px 18px 24px;min-height:0}.hero{margin-bottom:12px}.hero h2{font-size:22px}.hero p{font-size:.9rem}
.cards{gap:10px;margin-bottom:14px}.metric{padding:12px}.metric strong{margin:5px 0;font-size:29px}.metric small{line-height:1.3}
.panel-head{padding:12px 15px}.panel-body{padding:14px 15px}.table-wrap{max-height:none;overflow-x:auto}
.case-table,.cases{table-layout:fixed;min-width:1000px;width:100%}
.case-table th:nth-child(1),.cases th:nth-child(1){width:25%}
.case-table th:nth-child(2),.cases th:nth-child(2){width:12%}
.case-table th:nth-child(3),.cases th:nth-child(3){width:10%}
.case-table th:nth-child(4),.cases th:nth-child(4){width:20%}
.case-table th:nth-child(5),.cases th:nth-child(5){width:20%}
.case-table th:nth-child(6),.cases th:nth-child(6){width:13%}
.case-table td,.cases td{padding:12px;overflow-wrap:anywhere}.case-table th,.cases th{padding:11px 12px;font-size:11px}
@media(max-width:1100px){.app{grid-template-columns:185px minmax(0,1fr)}.topbar,.top{grid-template-columns:1fr 1.25fr;gap:8px 12px}.access-controls{grid-column:2;grid-row:2}.status-dot,.sync{grid-column:1;grid-row:2}.cards{grid-template-columns:repeat(3,minmax(0,1fr))}.nav button span{display:inline}}
@media(max-width:720px){.app{display:flex;flex-direction:column}.sidebar,.side{max-height:135px;padding:7px;flex:none}.brand,.version,.nav .group,.nav small{display:none}.nav{display:flex;flex-wrap:wrap;gap:3px}.nav button{padding:7px;font-size:13px}.workspace,.work{flex:1;min-height:0}.topbar,.top{padding:8px;grid-template-columns:1fr}.title{display:none}.case-picker,.picker{grid-row:1;grid-column:1}.access-controls{grid-row:2;grid-column:1}.status-dot,.sync{display:none}.main{padding:12px}.cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
}


@media screen{.extra-filters{display:flex;gap:12px;align-items:end;flex-wrap:wrap;padding:0 16px 16px}.extra-filters label{flex:1;min-width:175px;font-size:12px;color:#32526a}.extra-filters select{display:block;width:100%;margin-top:5px}.priority-help{margin:0 16px 14px;padding:10px 14px;background:#eef7fb;border-left:3px solid #00a1df;border-radius:8px;color:#164660;font-size:13px}.priority-help summary{cursor:pointer;font-weight:600}.priority-help p{max-width:85ch;line-height:1.5}.priority-note{display:block;font-size:11px;color:#546778;margin-top:6px;line-height:1.4}}
/* Acabamento Água 1.0: somente interface; impressão preservada. */
@media screen {
:root{--navy:#064778;--navy2:#07588f;--petrol:#007ca8;--lime:#42c9ed;--cyan:#eaf9ff;--ink:#163c55;--muted:#526f81;--line:#d5e6ee;--bg:#f5fafd;--blue:#008dce;--orange:#e28b23;--warn:#b86b13;--red:#bd3e48;--danger:#bd3e48;--shadow:0 12px 36px #06477812}
body{background:var(--bg);font-family:Arial,sans-serif}
.app{grid-template-columns:232px minmax(0,1fr);height:100vh;height:100dvh}
.sidebar,.side{background:linear-gradient(160deg,#fff 60%,#edfaff);color:var(--ink);border-top:4px solid #009ee0;border-right:1px solid var(--line);padding:20px 12px;overflow:hidden}
.brand{padding:4px 14px 24px}.brand b{font-size:24px;letter-spacing:-.6px;color:#006eb1}.brand span{color:var(--muted);font-size:12px}
.nav{display:grid;gap:5px;overflow:auto;min-height:0;scrollbar-width:thin}.nav button{position:relative;text-align:left;background:transparent;color:#31536a;border:1px solid transparent;border-radius:12px;padding:12px;min-height:44px;line-height:1.35;font-size:var(--ui-font);transition:background .15s,color .15s}.nav button span{display:inline}.nav button:hover{background:#eaf7fd;color:#00578b}.nav button.active{background:#007cba;color:#fff;border-color:#007cba;box-shadow:0 5px 12px #007cba20,inset 4px 0 #48dbeb}.nav .group,.nav small{display:block;color:#526f81;font-size:10px;letter-spacing:1.2px;margin:20px 12px 5px}.version{color:#526f81;padding:16px 12px 0}
.topbar,.top{background:#fff;padding:16px 24px;gap:10px 18px;border-bottom:1px solid var(--line)}.title h1{color:#084c77;font-size:21px}.title p{line-height:1.45}.main{padding:24px;scrollbar-width:thin;scrollbar-color:#aecfdf transparent}
.hero{position:relative;isolation:isolate;overflow:hidden;align-items:center;background:#fff;border:1px solid var(--line);border-radius:22px 22px 32px 8px;padding:24px;margin-bottom:20px;min-height:114px}.hero:after{content:'';position:absolute;z-index:-1;pointer-events:none;width:260px;height:190px;border:24px solid #e6f7fd;border-radius:48% 52% 66% 34%;right:-110px;top:-120px;transform:rotate(-18deg)}.hero h2{font-size:clamp(22px,2.2vw,30px);letter-spacing:-.6px;color:#005e97}.hero p{max-width:78ch;line-height:1.55}.hero .actions{flex-shrink:0}
.cards{gap:14px;margin-bottom:22px;grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}.metric{position:relative;border-radius:17px;padding:18px;background:#fff;box-shadow:0 4px 15px #07588f06;border-top-width:4px}.metric strong{text-align:left;font-size:34px;color:#074b78;font-variant-numeric:tabular-nums;margin:8px 0}.metric small{font-size:11px;letter-spacing:.6px}.metric span{font-size:12px}.metric.petrol{border-top-color:#00a6c3}.metric.blue{border-top-color:#008dce}.metric.orange{border-top-color:#f3ad35}.metric.lime{border-top-color:#51aa73}.metric.red{border-top-color:#de6263}
.panel,.chart,.quick-card,.history-group{border-radius:18px;border-color:var(--line);box-shadow:0 4px 18px #06477805}.panel-head{padding:18px 20px;flex-wrap:wrap}.panel-head h3{color:#09577f}.panel-body{padding:20px}.filters{grid-template-columns:minmax(200px,2fr) repeat(3,minmax(120px,1fr))}.input,input,select,textarea{border-color:#bfd7e4;border-radius:10px;min-width:0;max-width:100%;accent-color:#007cba}input:not([type=checkbox]):not([type=radio]),select{min-height:44px}input[type=checkbox],input[type=radio]{min-height:0;width:auto}textarea{line-height:1.6}.btn{border-radius:11px;min-height:44px;padding:11px 16px;color:#07588f;border-color:#bfd7e4;background:#fff}.btn.primary{background:#007cba;border-color:#007cba;color:#fff}.btn.dark{background:#085485;border-color:#085485;color:#fff}.btn:hover{border-color:#008dce;box-shadow:0 3px 10px #007cba14}.btn:disabled{opacity:.55;cursor:wait}.btn.danger{color:#a73340;border-color:#e3b8bd}.sticky-actions{background:#f5fafd;backdrop-filter:none;border-top:1px solid var(--line)}
.table-wrap{max-height:none;overflow-x:auto;overscroll-behavior-x:contain;border-radius:0 0 18px 18px}.case-table th,.cases th{background:#edf7fc;color:#365e77;letter-spacing:.5px;padding:14px 12px}.case-table td,.cases td{padding:16px 12px;line-height:1.55;word-break:normal;overflow-wrap:break-word}.case-table tbody tr:nth-child(even),.cases tbody tr:nth-child(even){background:#fbfdff}.case-table tbody tr:hover,.cases tbody tr:hover{background:#eef9ff}.case-table tbody tr.selected,.cases tbody tr.selected{background:#e4f4fd;box-shadow:inset 4px 0 #008dce}.protocol{color:#0079b5}.badge{padding:6px 10px;line-height:1.4;white-space:normal}.badge.atd{background:#e2f4ff;color:#075c8b}.badge.exec{background:#fff2d8;color:#875311}.priority-help{background:#eff9fe;border-color:#00a4d5;border-radius:12px}.event{border-left-color:#86cfe6}.selected-summary,.summary{border-radius:14px}.selected-summary div,.summary div{padding:16px}.chart{padding:22px}.track{height:15px;background:#edf5fa}.bar{background:#00a4c7}.bar.blue{background:#008dce}.bar.orange{background:#edab32}.bar.lime{background:#51aa73}.notice.loading{background:#eaf8ff;color:#07588f}.notice{border-radius:12px}
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid #0085c2;outline-offset:3px}
@media(min-width:1500px){.main{padding:28px 32px}.app{grid-template-columns:248px minmax(0,1fr)}}
@media(max-width:1200px){.app{grid-template-columns:202px minmax(0,1fr)}.topbar,.top{grid-template-columns:1fr 1.25fr;padding:14px 18px}.access-controls{grid-column:2;grid-row:2;flex-wrap:wrap}.status-dot,.sync{grid-column:1;grid-row:2}.main{padding:18px}.filters{grid-template-columns:1fr 1fr}.grid2,.charts{grid-template-columns:1fr}.brand span,.version{display:block}.hero{padding:20px}}
@media(max-width:760px){.app{display:flex;flex-direction:column}.sidebar,.side{flex:none;max-height:166px;padding:8px;border-right:0;border-bottom:1px solid var(--line)}.brand,.version{display:none}.nav{display:flex;flex-wrap:nowrap;overflow-x:auto;gap:6px;padding:3px 2px 8px}.nav .group,.nav small{display:none}.nav button{flex:0 0 auto;max-width:190px;white-space:normal;padding:10px 13px;font-size:14px}.nav button span{display:inline}.workspace,.work{flex:1;min-height:0}.topbar,.top{padding:10px 12px;grid-template-columns:1fr;gap:8px}.title,.status-dot,.sync{display:none}.case-picker,.picker{grid-column:1;grid-row:1}.access-controls{grid-column:1;grid-row:2;gap:12px;flex-wrap:wrap}.access-controls label{flex-direction:row;align-items:center}.access-controls select{max-width:150px}.main{padding:14px}.hero{padding:19px;border-radius:18px;align-items:flex-start;flex-direction:column;gap:14px}.hero h2{font-size:24px}.cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.metric{padding:14px}.metric strong{font-size:29px}.filters,.grid2,.grid3,.charts,.quick,.paper-grid,.history-fields,.info-grid{grid-template-columns:1fr}.selected-summary,.summary{grid-template-columns:repeat(2,minmax(0,1fr))}.panel-head,.panel-body{padding:16px}.extra-filters{padding:0 16px 16px}.extra-filters label{min-width:0;flex-basis:100%}.paper{padding:20px 16px}.paper-title{margin:-20px -16px 18px;padding:18px 16px}.bar-row{grid-template-columns:minmax(90px,1fr) 1fr 32px}.photo-add{grid-template-columns:1fr}.actions{gap:8px}.actions .btn{white-space:normal}.case-table,.cases{min-width:900px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
}

</style>
</head>
<body>
<div class="app">
  <aside class="side">
    <div class="brand"><b>Atendimento</b><span>Integração de atendimentos</span></div>
    <nav class="nav">
      <small>Visão executiva</small>
      <button data-page="dashboard"><span>◫ &nbsp; Dashboard</span></button>
      <button data-page="bi"><span>◒ &nbsp; Análise BI</span></button>
      <button data-page="ficha"><span>▤ &nbsp; Ficha de comunicação</span></button>
      <small>Conexões</small>
      <button data-page="acessos"><span>↗ &nbsp; Acessos úteis</span></button>
    </nav>
    <div class="version" id="version">Versão 1.0</div>
  </aside>
  <div class="work">
    <header class="top">
      <div class="title"><h1>Atendimento integrado</h1><p>Visão segura para alinhamento entre Execução e Atendimento</p></div>
      <div class="picker"><label for="caseSelect">Ficha em foco</label><select id="caseSelect"><option value="">Selecione uma ficha</option></select></div>
      <div class="sync"><i></i><span id="syncText">Carregando cópia segura</span></div>
    <div class="access-controls"><label>Janela<select id="uiSize"><option value="notebook">Notebook</option><option value="compact">Compacta</option><option value="wide">Ampla</option><option value="auto">Ajustar à tela</option></select></label><label>Letras<select id="uiFont"><option value="14">Padrão</option><option value="16" selected>Confortável</option><option value="18">Grande</option><option value="20">Muito grande</option></select></label></div></header>
    <main class="main">
      <div id="message" class="notice" role="status" aria-live="polite"></div>
      <div id="auditNotice" class="notice warn" hidden></div>

      <section class="page" id="dashboard">
        <div class="hero"><div><h2>Carteira em movimento</h2><p>Prioridades, responsabilidade atual e sinais recebidos de outras áreas.</p></div><button class="btn" id="refreshView">Recarregar visão</button></div>
        <div class="cards" id="metrics"></div>
        <div class="panel"><div class="panel-head"><h3>Fichas em acompanhamento</h3><span class="hint" id="caseCount"></span></div><div class="panel-body"><div class="filters"><input id="search" placeholder="Buscar protocolo, pessoa, endereço ou assunto"><select id="areaFilter"><option value="">Todas as áreas</option></select><select id="execPriority" aria-label="Prioridade"><option value="">Todas as prioridades</option><option>Urgente</option><option>Alto</option><option>Médio</option><option>Baixo</option></select><select id="stateFilter"><option value="abertas">Somente em aberto</option><option value="">Todos os status</option><option value="Concluída">Concluídas</option></select></div></div><details class="priority-help"><summary>Mais filtros, ordenação e regra de prioridade</summary><div class="extra-filters"><label>Tempo em aberto<select id="ageFilter"><option value="">Qualquer idade</option><option value="7">7 dias ou mais</option><option value="15">15 dias ou mais</option><option value="30">30 dias ou mais</option><option value="90">90 dias ou mais</option></select></label><label>Necessidade<select id="needFilter"><option value="">Todas</option><option value="review">Aguardando finalizar</option><option value="unread">Mensagens não lidas</option><option value="document">Revisão documental</option></select></label><label>Ordem<select id="orderFilter"><option value="priority">Prioridade e antiguidade</option><option value="oldest">Mais antigas primeiro</option><option value="signals">Mais mensagens não lidas</option></select></label><button class="btn" id="clearFilters" type="button">Limpar filtros</button></div><p>Prioridade informada + um nível a cada 7 dias corridos, até Urgente. Desempate pela antiguidade. Regra interna de organização.</p></details><div class="table-wrap"><table class="cases"><thead><tr><th>Ficha</th><th>Com quem está</th><th>Prioridade</th><th>Próximo movimento</th><th>Último sinal da outra área</th><th>Status</th></tr></thead><tbody id="caseRows"></tbody></table></div></div>
      </section>

      <section class="page" id="bi">
        <div class="hero"><div><h2>Análise da carteira</h2><p>Distribuição das fichas abertas para orientar capacidade, prioridade e alinhamento.</p></div></div>
        <div class="charts" id="charts"></div>
      </section>

      <section class="page" id="ficha">
        <div class="hero"><div><h2>Ficha de comunicação</h2><p>Leitura ampliada para trabalho entre áreas. Este documento não substitui a ficha SABESP.</p></div><div class="actions"><button class="btn" id="print">Imprimir visualização</button><button class="btn primary" id="makePdf">Gerar PDF para compartilhar</button></div></div>
        <div class="summary" id="summary"></div>
        <div class="paper-wrap"><article class="paper" id="paper"><div class="empty">Selecione uma ficha no topo da janela.</div></article></div>
        <div class="panel screen-only"><div class="panel-head"><h3>Documentos e compartilhamento</h3></div><div class="panel-body"><p class="hint">A ficha SABESP é controlada pelo Atendimento. Para a comunicação entre setores, gere o PDF interno abaixo; o envio não é automático e o arquivo mantém as permissões do Drive.</p><div class="actions"><a class="btn" id="officialDoc" target="_blank" hidden>Abrir documento SABESP</a><a class="btn" id="officialPdf" target="_blank" hidden>Abrir PDF SABESP</a><a class="btn dark" id="downloadPdf" target="_blank" hidden>Baixar ficha de comunicação</a><a class="btn" id="viewPdf" target="_blank" hidden>Abrir PDF interno no Drive</a><button class="btn" id="shareWhats" disabled>Preparar WhatsApp</button><button class="btn" id="shareEmail" disabled>Preparar e-mail</button></div></div></div>
        <div class="grid2 screen-only"><div>
          <div class="panel"><div class="panel-head"><h3>Passar a ficha adiante</h3></div><div class="panel-body"><label for="destination">Encaminhar para</label><select id="destination"></select><label for="comment">Contexto e necessidade</label><textarea id="comment" placeholder="O que foi feito e o que a outra área precisa analisar?"></textarea><label for="files">Links de apoio</label><textarea id="files" placeholder="Um link do Drive por linha"></textarea><button class="btn primary" id="saveComment">Registrar e sinalizar</button></div></div>
          <div class="panel"><div class="panel-head"><h3>Novo compromisso</h3></div><div class="panel-body"><label for="checkTitle">Resultado esperado</label><input id="checkTitle" placeholder="Ex.: Validar a recomposição com o morador"><div class="grid3"><div><label for="checkArea">Responsável</label><select id="checkArea"></select></div><div><label for="checkPriority">Prioridade</label><select id="checkPriority"><option>Baixa</option><option selected>Média</option><option>Alta</option><option>Urgente</option></select></div><div><label for="checkDate">Prazo</label><input id="checkDate" placeholder="dd/mm/aaaa"></div></div><label for="checkContext">Contexto</label><textarea id="checkContext"></textarea><button class="btn primary" id="createCheck">Criar compromisso</button></div></div>
        </div><div><div class="panel"><div class="panel-head"><h3>Compromissos compartilhados</h3></div><div class="panel-body"><div class="checklist" id="checklist"></div></div></div><div class="panel"><div class="panel-head"><h3>Mensagens entre áreas</h3></div><div class="panel-body"><div class="timeline" id="timeline"></div></div></div></div></div>
      </section>

      <section class="page" id="acessos">
        <div class="hero"><div><h2>Acessos de trabalho</h2><p>Atalhos para registrar movimentações e falar com a Central de Atendimento.</p></div></div>
        <div class="quick" id="quickLinks"></div>
        <div class="panel"><div class="panel-head"><h3>Como a informação circula</h3></div><div class="panel-body"><p class="narrative"><b>Abertura ou execução:</b> o formulário registra a informação na fonte original.\n\n<b>Integração:</b> a Central consolida o caso, gera ou mantém o protocolo e atualiza a responsabilidade.\n\n<b>Comunicação:</b> comentários e compromissos ficam disponíveis para as duas áreas.\n\n<b>Documento oficial:</b> somente o Atendimento valida o texto e as fotos da ficha final enviada à Sabesp.</p></div></div>
      </section>
    </main>
  </div>
</div>
<script>

function statusLabel(s){return s==='Aguardando finalização'?'Aguardando revisão e finalização do Atendimento':s}
(function(){var key='atd-access-v3',size=document.getElementById('uiSize'),font=document.getElementById('uiFont');size.value='wide';try{var saved=JSON.parse(localStorage.getItem(key)||'{}');if(saved.size)size.value=saved.size;if(saved.font)font.value=saved.font}catch(e){}
function apply(){var px=Number(font.value)||16;document.documentElement.style.fontSize=px+'px';document.documentElement.style.setProperty('--ui-font',px+'px');
// Mais altura no Amplo; a interface do Google pode limitar o tamanho final.
var sw=screen.availWidth||1440,sh=screen.availHeight||900,ow=window.outerWidth,oh=window.outerHeight;
var bw=ow>600?Math.min(sw,ow):sw,bh=oh>450?Math.min(sh,oh):sh;
var maxW=Math.max(480,bw-64),maxH=Math.max(340,bh-110);
var dims={compact:[Math.min(980,maxW),Math.min(540,maxH*.78)],notebook:[Math.min(1180,maxW*.87),Math.min(660,maxH*.85)],wide:[maxW,maxH],auto:[maxW,maxH]},d=dims[size.value]||dims.wide;
google.script.host.setWidth(Math.round(d[0]));google.script.host.setHeight(Math.round(d[1]));try{localStorage.setItem(key,JSON.stringify({size:size.value,font:font.value}))}catch(e){}}
size.onchange=apply;font.onchange=apply;apply();})();

  var state={data:null,cases:[],current:null,busy:false,token:0,pdf:null,page:'dashboard'};
  function el(id){return document.getElementById(id)}
  function esc(value){return String(value==null?'':value).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]})}
  function uid(){return self.crypto&&crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)})}
  function call(name){var args=[].slice.call(arguments,1);return new Promise(function(resolve,reject){var runner=google.script.run.withSuccessHandler(resolve).withFailureHandler(reject);runner[name](...args)})}
  function message(text,type){el('message').textContent=text||'';el('message').className='notice '+(type||'ok')}
  function busy(on){state.busy=on;document.querySelectorAll('button').forEach(function(b){b.disabled=(on&&!b.hasAttribute('data-page'))||b.dataset.permanent==='true'});el('syncText').innerHTML=on?'<span class="loader"></span> Processando':'Dados consultados: '+(state.data?state.data.ultimaAtualizacao:'—')}
  async function action(fn){if(state.busy)return;busy(true);message('Conferindo informações…','loading');try{await fn()}catch(error){message(error&&error.message?error.message:String(error),'error')}finally{busy(false);updateShareButtons()}}
  function show(page){state.page=page;document.querySelectorAll('.page').forEach(function(s){s.classList.toggle('active',s.id===page)});document.querySelectorAll('[data-page]').forEach(function(b){b.classList.toggle('active',b.dataset.page===page)});message('')}
  document.querySelectorAll('[data-page]').forEach(function(b){b.onclick=function(){show(b.dataset.page)}});
  function fillSelect(select,values,label){select.replaceChildren(new Option(label||'Selecione',''));(values||[]).forEach(function(v){select.add(new Option(v,v))})}
  function renderMetrics(){var i=state.data.indicadores,items=[['Fichas abertas',i.abertos,'carteira atual',''],['Com Execução',i.execucao,'providência em campo','orange'],['Com Atendimento',i.atendimento,'validação ou retorno','blue'],['Alta prioridade',i.urgentes,'alto ou urgente','red'],['Novos sinais',i.naoLidas,'para a Execução','lime'],['Revisão documental',i.revisao,'fichas sinalizadas','navy']];el('metrics').innerHTML=items.map(function(m){return '<div class="metric '+m[3]+'"><small>'+m[0]+'</small><strong>'+m[1]+'</strong><span>'+m[2]+'</span></div>'}).join('')}
  function matches(c){var q=el('search').value.toLowerCase(),hay=[c.id,c.nome,c.endereco,c.assunto,c.resumoDemanda,c.proxima].join(' ').toLowerCase(),status=el('stateFilter').value;return(!el('execPriority').value||c.urgencia===el('execPriority').value)&&(!q||hay.indexOf(q)>=0)&&(!el('areaFilter').value||c.area===el('areaFilter').value)&&(status!=='abertas'||!/conclu|encerrad/i.test(c.status))&&(status!=='Concluída'||/conclu|encerrad/i.test(c.status))}
  function areaClass(area){return /execu/i.test(area)?'exec':'atd'}

  el('clearFilters').onclick=function(){["search", "areaFilter", "stateFilter", "execPriority", "ageFilter", "needFilter"].forEach(function(id){el(id).value=''});el('orderFilter').value='priority';el('stateFilter').value='abertas';renderCases()};
  function extraMatches(c){var age=el('ageFilter').value,need=el('needFilter').value;return (!age||(c.dias!==''&&Number(c.dias)>=Number(age)))&&(!need||(need==='review'&&/aguardando.*finaliza/i.test(c.status))||(need==='unread'&&c.naoLidas>0)||(need==='document'&&c.revisao));}
  function orderRows(rows){var mode=el('orderFilter').value;return rows.sort(function(a,b){if(mode==='oldest')return (Number(b.dias)||0)-(Number(a.dias)||0);if(mode==='signals')return (Number(b.naoLidas)||0)-(Number(a.naoLidas)||0)||(Number(b.pontos)||0)-(Number(a.pontos)||0);return (Number(b.pontos)||0)-(Number(a.pontos)||0)||(Number(b.dias)||0)-(Number(a.dias)||0)});}
  ['ageFilter','needFilter','orderFilter','execPriority'].forEach(function(id){el(id).onchange=renderCases});
  function renderCases(){var rows=orderRows(state.cases.filter(matches).filter(extraMatches));el('caseCount').textContent=rows.length+' ficha(s) com estes filtros · cartões acima: carteira total';el('caseRows').innerHTML=rows.map(function(c){return '<tr data-id="'+esc(c.id)+'" class="'+(state.current&&state.current.id===c.id?'selected':'')+'"><td><span class="protocol">'+esc(c.id)+'</span><br><b>'+esc(c.nome||'Nome em conferência')+'</b><br><small>'+esc(c.endereco||'Endereço em conferência')+'</small><div style="margin-top:8px;color:#234e66;font-size:13px;max-width:360px;white-space:normal"><b>'+esc(c.assunto||'Demanda')+'</b><br>'+esc(c.resumoDemanda||'Resumo não informado')+'</div></td><td><span class="badge '+areaClass(c.area)+'">'+esc(c.area)+'</span> '+(c.naoLidas?'<span class="unread">'+c.naoLidas+'</span>':'')+'</td><td><span class="badge '+(/alto|urgente/i.test(c.urgencia)?'alert':'')+'">'+esc(c.urgencia)+'</span><small class="priority-note" title="'+esc(c.motivoPrioridade||'')+'">'+esc(c.prioridadeOriginal?'Informada: '+c.prioridadeOriginal:'')+'</small><br><small>'+(c.dias===''?'Encerrada':c.dias+' dias em aberto')+'</small></td><td>'+esc(c.proxima)+'</td><td>'+esc(c.ultimaOutraArea||'Sem atualização compartilhada')+'</td><td><span class="badge">'+esc(statusLabel(c.status))+'</span>'+(c.revisao?'<br><span class="badge alert">Revisão necessária</span>':'')+'</td></tr>'}).join('')||'<tr><td colspan="6" class="empty">Nenhuma ficha corresponde aos filtros.</td></tr>';el('caseRows').querySelectorAll('tr[data-id]').forEach(function(row){row.onclick=function(){selectCase(row.dataset.id,true)}})}
  var caseSearchTimer;function scheduleCaseSearch(){clearTimeout(caseSearchTimer);caseSearchTimer=setTimeout(renderCases,140)}function applyCaseFilters(){clearTimeout(caseSearchTimer);renderCases()}el('search').oninput=scheduleCaseSearch;el('search').onchange=applyCaseFilters;["areaFilter", "stateFilter"].forEach(function(id){el(id).onchange=applyCaseFilters});
  function renderChart(title,subtitle,values,color){var max=Math.max.apply(null,(values||[]).map(function(v){return v.valor}).concat([1]));return '<div class="chart"><h3>'+esc(title)+'</h3><span class="hint">'+esc(subtitle)+'</span>'+((values||[]).map(function(v){return '<div class="bar-row"><label title="'+esc(v.rotulo)+'">'+esc(v.rotulo)+'</label><div class="track"><div class="bar '+color+'" style="width:'+Math.max(2,Math.round(v.valor/max*100))+'%"></div></div><b>'+v.valor+'</b></div>'}).join('')||'<div class="empty">Sem dados.</div>')+'</div>'}
  function renderBi(){var bi=state.data.bi;el('charts').innerHTML=renderChart('Responsabilidade atual','Fichas abertas por área',bi.areas,'orange')+renderChart('Tempo em aberto','Faixa desde a data oficial de abertura',bi.faixas,'red')+renderChart('Procedência','Classificação atual da carteira',bi.procedencias,'blue')+renderChart('Prioridade','Urgência informada ou consolidada',bi.urgencias,'lime')}
  function renderSummary(){var c=state.current;if(!c){el('summary').innerHTML='<div class="empty">Selecione uma ficha.</div>';return}el('summary').innerHTML='<div><small>Protocolo</small><b>'+esc(c.id)+'</b></div><div><small>Status</small><b>'+esc(statusLabel(c.status))+'</b></div><div><small>Com quem está</small><b>'+esc(c.area)+'</b></div><div><small>Próximo movimento</small><b>'+esc(c.proxima)+'</b></div>'}
  function info(label,value){return value?'<div class="info"><small>'+esc(label)+'</small><b>'+esc(value)+'</b></div>':''}
  function section(title,text){return '<div class="section"><h4>'+esc(title)+'</h4><div class="narrative">'+esc(text||'Em atualização.')+'</div></div>'}
  function renderPaper(){var f=state.current;if(!f){el('paper').innerHTML='<div class="empty">Selecione uma ficha no topo da janela.</div>';return}var trace=f.naoProcedencia?'Não procedência registrada em '+f.naoProcedencia.data+' por '+f.naoProcedencia.usuario+' ('+(f.naoProcedencia.origem||f.naoProcedencia.tipo)+').':'Procedência atual: '+f.procedencia+'.';var photos=(f.fotos||[]).map(function(p,i){return '<div class="photo">'+(p.preview?'<img src="'+p.preview+'" alt="Evidência '+(i+1)+'">':'<div class="empty">Prévia indisponível</div>')+'<a href="'+esc(p.link)+'" target="_blank" rel="noopener">'+esc(p.grupo)+' · abrir original</a></div>'}).join('');el('paper').innerHTML='<div class="paper-title"><h3>FICHA DE COMUNICAÇÃO ENTRE ÁREAS</h3><p>Consórcio Performance Tamanduateí · '+esc(f.id)+'</p></div><div class="info-grid">'+info('Status',f.status)+info('Com quem está',f.area)+info('Prioridade',f.urgencia)+info('Procedência',f.procedencia)+info('Abertura',f.abertura)+info('Próximo movimento',f.proxima)+'</div><div class="section"><h4>Identificação</h4><div class="info-grid">'+info('Solicitante',f.nome)+info('Telefone',f.telefone)+info('E-mail',f.email)+info('Endereço',f.endereco)+info('Assunto',f.assunto)+info('Frente',f.frente)+'</div></div>'+section('Solicitação',f.solicitacao)+(f.descricao?section('Contexto da ocorrência',f.descricao):'')+section('Providências registradas',f.solucao)+section('Resultado atual',f.finalizacao)+section('Rastreabilidade da procedência',trace)+(photos?'<div class="section"><h4>Evidências disponíveis</h4><div class="photo-grid">'+photos+'</div></div>':'')+'<div class="section"><h4>Situação documental</h4><div class="narrative">'+esc(f.situacaoDocumental||'Em conferência')+(f.camposFaltantes?' · Pendências documentais: '+esc(f.camposFaltantes):'')+'</div></div>'}
  function renderCommunication(){var c=state.current&&state.current.comunicacao||{checklist:[],eventos:[]};el('checklist').innerHTML=(c.checklist||[]).map(function(item){var done=item.situacao==='Concluído';return '<label class="check '+(done?'done':'')+'"><input type="checkbox" data-key="'+esc(item.chave)+'" '+(done?'checked':'')+'><span><b>'+esc(item.titulo)+'</b><small>'+esc(item.destino)+' · '+esc(item.prioridade)+(item.prazo?' · até '+esc(item.prazo):'')+'</small></span><span class="badge">'+esc(item.situacao)+'</span></label>'}).join('')||'<div class="empty">Nenhum compromisso compartilhado.</div>';el('checklist').querySelectorAll('[data-key]').forEach(function(box){box.onchange=function(){toggleCheck(box.dataset.key,box.checked)}});el('timeline').innerHTML=(c.eventos||[]).slice().reverse().map(function(e){return '<div class="event '+(/execu/i.test(e.area)?'exec':'atd')+'"><b>'+esc(e.tipo)+' · '+esc(e.area)+' → '+esc(e.destino||'registro')+'</b><small>'+esc(e.data)+' · '+esc(e.usuario)+'</small><p>'+esc(e.mensagem||e.titulo)+'</p>'+(e.arquivos?'<small>'+esc(e.arquivos)+'</small>':'')+'</div>'}).join('')||'<div class="empty">Ainda não há mensagens compartilhadas.</div>'}
  function renderTrace(){var f=state.current;if(!f)return;var trace=(f.rastreabilidade||[]).slice().reverse().slice(0,10).map(function(e){return '<div class="event"><b>'+esc(e.tipo)+' · '+esc(e.status)+' · '+esc(e.procedencia)+'</b><small>'+esc(e.data)+' · '+esc(e.usuario)+'</small><p>'+esc([e.area,e.proxima,e.executadoPor].filter(Boolean).join(' · '))+'</p></div>'}).join('');if(trace)el('timeline').insertAdjacentHTML('beforeend','<div class="section"><h4>Movimentações consolidadas</h4>'+trace+'</div>')}
  async function loadCaseRaw(id,next){var token=++state.token;state.pdf=null;el('downloadPdf').hidden=true;el('viewPdf').hidden=true;var f=await call('pe_carregarFicha',id);if(token!==state.token)return;state.current=f;el('caseSelect').value=id;el('officialDoc').hidden=!f.documento;el('officialDoc').href=f.documento||'#';el('officialPdf').hidden=!f.pdf;el('officialPdf').href=f.pdf||'#';renderSummary();renderPaper();renderCommunication();renderTrace();renderCases();updateShareButtons();if(next)show('ficha');message(f.avisoLeitura||('Ficha '+f.id+' carregada.'),f.avisoLeitura?'warn':'ok')}
  function selectCase(id,next){action(async function(){await loadCaseRaw(id,next)})}
  el('caseSelect').onchange=function(){if(this.value)selectCase(this.value,false);else{state.current=null;state.pdf=null;['officialDoc','officialPdf','downloadPdf','viewPdf'].forEach(function(id){el(id).hidden=true});renderSummary();renderPaper();renderCommunication();updateShareButtons()}};
  async function reload(selected){var data=await call('pe_iniciar');state.data=data;state.cases=data.casos||[];renderMetrics();renderBi();fillSelect(el('areaFilter'),data.areas,'Todas as áreas');fillSelect(el('destination'),data.areas,'Selecione a área');fillSelect(el('checkArea'),data.areas,'Selecione a área');var selector=el('caseSelect');selector.replaceChildren(new Option('Selecione uma ficha',''));state.cases.forEach(function(c){selector.add(new Option(c.id+' · '+(c.nome||'Nome em conferência'),c.id))});el('version').textContent='Versão '+data.versao;el('syncText').textContent='Dados consultados: '+data.ultimaAtualizacao;renderCases();renderQuickLinks();var avisos=(data.diagnostico&&data.diagnostico.avisos)||[];el('auditNotice').hidden=!avisos.length;el('auditNotice').textContent=avisos.join('\\n');if(selected)await loadCaseRaw(selected,false)}
  function renderQuickLinks(){var c=state.data.configuracao,items=[['Formulário unificado','Abrir uma ficha nova ou registrar a sequência de uma execução.',c.formularioUnificado,'Abrir formulário'],['Central de Atendimento','Conversa direta pelo WhatsApp: (11) 93232-4659.',c.whatsapp,'Abrir WhatsApp']];if(c.formularioPrincipal)items.push(['Abertura pelo Atendimento','Acesso ao formulário principal configurado pela gestão.',c.formularioPrincipal,'Abrir formulário']);else items.push(['Abertura pelo Atendimento','O link principal ainda não foi configurado na aba oculta Configuração do Painel.','','Aguardando configuração']);el('quickLinks').innerHTML=items.map(function(i){return '<div class="quick-card"><h3>'+esc(i[0])+'</h3><p>'+esc(i[1])+'</p>'+(i[2]?'<a class="btn primary" href="'+esc(i[2])+'" target="_blank" rel="noopener">'+esc(i[3])+'</a>':'<span class="badge">'+esc(i[3])+'</span>')+'</div>'}).join('')}
  el('refreshView').onclick=function(){action(async function(){await reload(state.current&&state.current.id);message('Visão recarregada a partir da base oficial do Atendimento.','ok')})};
  el('saveComment').onclick=function(){action(async function(){if(!state.current)throw Error('Selecione uma ficha.');await call('pe_salvarComunicacao',{protocolo:state.current.id,destino:el('destination').value,mensagem:el('comment').value,arquivos:el('files').value,pedidoId:uid()});el('comment').value='';el('files').value='';await loadCaseRaw(state.current.id,false);message('Atualização registrada e sinalizada para a área escolhida.','ok')})};
  el('createCheck').onclick=function(){action(async function(){if(!state.current)throw Error('Selecione uma ficha.');await call('pe_criarChecklist',{protocolo:state.current.id,titulo:el('checkTitle').value,destino:el('checkArea').value,prioridade:el('checkPriority').value,prazo:el('checkDate').value,mensagem:el('checkContext').value,pedidoId:uid()});['checkTitle','checkDate','checkContext'].forEach(function(id){el(id).value=''});await loadCaseRaw(state.current.id,false);message('Compromisso compartilhado criado.','ok')})};
  function toggleCheck(key,done){action(async function(){await call('pe_alterarChecklist',{protocolo:state.current.id,chaveItem:key,situacao:done?'Concluído':'Pendente',pedidoId:uid()});await loadCaseRaw(state.current.id,false);message(done?'Item concluído e devolvido ao Atendimento para validação.':'Item reaberto para a Execução.','ok')})}
  el('print').onclick=function(){if(!state.current)return message('Selecione uma ficha.','error');window.print()};
  el('makePdf').onclick=function(){action(async function(){if(!state.current)throw Error('Selecione uma ficha.');state.pdf=await call('pe_gerarFichaComunicacaoPdf',state.current.id);el('downloadPdf').href=state.pdf.download;el('downloadPdf').hidden=false;el('viewPdf').href=state.pdf.url;el('viewPdf').hidden=false;message(state.pdf.mensagem,'ok')})};
  function updateShareButtons(){var enabled=Boolean(state.pdf&&state.current);el('shareWhats').disabled=state.busy||!enabled;el('shareEmail').disabled=state.busy||!enabled}
  function shareText(){var c=state.current;return 'Ficha de comunicação '+c.id+' — '+c.status+'\\nCom quem está: '+c.area+'\\nPróximo movimento: '+c.proxima+'\\nPDF: '+state.pdf.url}
  el('shareWhats').onclick=function(){if(!state.pdf)return message('Gere primeiro o PDF para compartilhar.','warn');window.open('https://wa.me/?text='+encodeURIComponent(shareText()),'_blank','noopener')};
  el('shareEmail').onclick=function(){if(!state.pdf)return message('Gere primeiro o PDF para compartilhar.','warn');window.open('mailto:?subject='+encodeURIComponent('Ficha de comunicação '+state.current.id)+'&body='+encodeURIComponent(shareText()),'_blank')};
  show('dashboard');action(async function(){await reload('');message('Visão executiva carregada.','ok')});

  var refreshingPortfolio=false;
  setInterval(async function(){
    if(refreshingPortfolio||state.busy||document.hidden||!el('dashboard').classList.contains('active'))return;
    refreshingPortfolio=true;
    try{var data=await call('pe_iniciar');state.data=data;state.cases=data.casos||[];renderMetrics();renderCases();var picker=el('caseSelect'),selected=picker.value;picker.replaceChildren(new Option('Selecione uma ficha',''));state.cases.forEach(function(c){picker.add(new Option(c.id+' · '+(c.nome||'Nome em conferência'),c.id))});picker.value=selected;renderBi();}
    catch(e){message('A atualização automática não terminou. A última consulta foi mantida. '+(e.message||''),'warn')}
    finally{refreshingPortfolio=false;}
  },60000);
</script>
</body>
</html>`;
}

/** Vínculos são persistentes no Controle. Respostas e eventos de origem nunca são apagados. */
const AF_CENTRAL_ID='1UHs_jFVD7jQRKgw7CVPCQ8R7sgvyhkJVv5rcj0v2K5g';
const AF_ABA='Vínculos de protocolos';
const AF_CAB=['Protocolo incorporado','Protocolo principal','ID origem','ID principal','Chave origem','Chave principal','Estado','Data','Autor','Motivo','Arquivo de preservação','Dados públicos de origem'];
let AF_CACHE=null;
function af_vinculos_(){if(AF_CACHE)return AF_CACHE;const v=pe_lerVinculosSeguros_();if(JSON.stringify(v[0])!==JSON.stringify(AF_CAB))throw Error('Cabeçalhos dos vínculos alterados. Confira antes de continuar.');return AF_CACHE=v.slice(1).filter(r=>r[6]==='ATIVA').map(r=>({origem:String(r[0]),principal:String(r[1]),idOrigem:String(r[2]),idPrincipal:String(r[3]),chaveOrigem:r[4],chavePrincipal:r[5],data:r[7],autor:r[8],motivo:r[9],arquivo:r[10],publico:r[11]?JSON.parse(r[11]):{}}));}
function af_resolver_(id,central){id=String(id||'').trim();const vistos=new Set();for(let i=0;i<100;i++){const v=af_vinculos_().find(v=>v.origem===id||v.idOrigem===id);if(!v)return id;if(vistos.has(id))throw Error('Ciclo nos protocolos incorporados.');vistos.add(id);id=central?v.idPrincipal:v.principal;}throw Error('Limite de vínculos excedido.');}
function af_incorporado_(id){return af_vinculos_().some(v=>v.origem===id||v.idOrigem===id);}
function af_norm_(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function af_revisao_(status){return /^(aguardando finalizacao|aguardando revisao e finalizacao do atendimento)$/.test(af_norm_(status));}
function af_rotulo_(status){return af_revisao_(status)?'Aguardando revisão e finalização do Atendimento':status;}
function af_area_(status,areaBase,atualizacao,areaMensagem,dataMensagem){
 if(af_revisao_(status)||af_fechado_(status))return 'Atendimento';
 const base=atualizacao instanceof Date?atualizacao.getTime():Date.parse(atualizacao)||0,msg=dataMensagem instanceof Date?dataMensagem.getTime():Date.parse(dataMensagem)||0;
 return af_responsavel_(areaMensagem&&msg>base?areaMensagem:(areaBase||areaMensagem));
 }

function af_eventosCompartilhados_(){return af_vinculos_().map(v=>({linha:0,chave:'MESCLA|'+v.origem,protocolo:af_resolver_(v.principal),protocoloOrigem:v.origem,dataHora:v.data,usuario:v.autor,areaAutora:'Atendimento',destino:'',tipo:'Ficha incorporada',mensagem:'Protocolo '+v.origem+' incorporado. Motivo: '+v.motivo+'\nSolicitação original: '+(v.publico.solicitacao||v.publico.assunto||'')+'\nProvidências originalmente registradas: '+(v.publico.solucao||'Não informadas.'),arquivos:v.publico.fotos||'',lidoAtendimento:v.data,lidoExecucao:v.data,origem:'Mesclagem rastreável'}));}

/** Regras únicas de carteira v3.4. Dias corridos no fuso de São Paulo.
 * A progressão é regra interna de ordenação, não prazo contratual Sabesp.
 * Nunca persiste a prioridade calculada sobre a prioridade informada.
 */
function af_fechado_(status){return /^(concluida|concluido|encerrada|encerrado|atendimento concluido)$/.test(af_norm_(status));}
function af_os_(id,historico){return /^ATD(?:\d{8}|-\d{4,8})$/i.test(String(id||'').trim())&&af_norm_(historico)!=='sim'&&!af_incorporado_(id);}
function af_aberto_(status){return ['recebida','em andamento','aguardando finalizacao','aguardando revisao e finalizacao do atendimento'].includes(af_norm_(status));}
function af_dias_(abertura,agora){
 if(!abertura)return '';const a=abertura instanceof Date?abertura:new Date(abertura),b=agora||new Date();if(isNaN(a.getTime()))return '';
 const dia=d=>Date.parse(Utilities.formatDate(d,'America/Sao_Paulo','yyyy-MM-dd')+'T12:00:00Z');return Math.max(0,Math.round((dia(b)-dia(a))/86400000));
}
function af_prioridade_(original,abertura,status,agora){
 const dias=af_dias_(abertura,agora),n=af_norm_(original),base=/urgente/.test(n)?4:/alt[oa]/.test(n)?3:/medi[oa]/.test(n)?2:/baix[oa]/.test(n)?1:2;
 if(af_fechado_(status))return {rotulo:'Atendimento concluído',original:String(original||''),nivel:0,pontos:0,dias:'',motivo:'Ficha concluída pelo Atendimento.'};
 const acrescimo=dias===''?0:Math.floor(dias/7),nivel=Math.min(4,base+acrescimo),rotulos=['','Baixo','Médio','Alto','Urgente'];
 return {rotulo:rotulos[nivel],original:String(original||'Não informada'),nivel,pontos:nivel*1000+Math.min(Number(dias)||0,999),dias,motivo:'Informada: '+(original||'não informada (base média)')+' · '+(dias===''?'abertura não informada':dias+' dias corridos')+' · +1 nível a cada 7 dias, até Urgente.'};
}
function af_ordenar_(a,b){return Number(af_fechado_(a.status))-Number(af_fechado_(b.status))||(Number(b.pontos)||0)-(Number(a.pontos)||0)||(Number(b.dias||b.diasAberto)||0)-(Number(a.dias||a.diasAberto)||0)||String(a.id).localeCompare(String(b.id));}

var PE_LEITURA_LOCAL=false;
function pe_lerVinculosSeguros_(){
 try{const sh=SpreadsheetApp.openById(AF_CENTRAL_ID).getSheetByName(AF_ABA);return sh?sh.getDataRange().getValues():[AF_CAB];}
 catch(e){
  PE_LEITURA_LOCAL=true;const sh=pe_planilha_().getSheetByName(PE_CONFIG.ABA_CONFIG);
  if(!sh)throw Error('Peça à conta da automação para atualizar o Painel Executivo.');
  const rows=sh.getRange(1,4,Math.max(1,sh.getLastRow()),AF_CAB.length).getValues();
  if(JSON.stringify(rows[0])!==JSON.stringify(AF_CAB))throw Error('A cópia segura dos vínculos ainda não foi preparada. A conta da automação deve executar atualizarPainelExecutivoExecucaoAgora. Não é necessário liberar a base privada do Atendimento.');
  return rows.filter((r,i)=>i===0||r[0]);
 }
}
function pe_publicarVinculos_(destino){
 const sh=destino.getSheetByName(PE_CONFIG.ABA_CONFIG);if(!sh)throw Error('Configuração do Painel não localizada.');
 const rows=[AF_CAB].concat(af_vinculos_().map(v=>[v.origem,v.principal,v.idOrigem,v.idPrincipal,v.chaveOrigem,v.chavePrincipal,'ATIVA',v.data,v.autor,v.motivo,'',JSON.stringify(v.publico||{})]));
 pe_dimensoes_(sh,Math.max(rows.length,sh.getLastRow()),15);
 const cab=sh.getRange(1,4,1,12).getValues()[0];if(cab.some(v=>v!==''&&v!=null)&&JSON.stringify(cab)!==JSON.stringify(AF_CAB))throw Error('A configuração D:O já contém outros dados. Nenhum vínculo foi sobrescrito.');
 sh.getRange(1,4,rows.length,12).setValues(rows);
 if(sh.getLastRow()>rows.length)sh.getRange(rows.length+1,4,sh.getLastRow()-rows.length,12).clearContent();
}

function af_responsavel_(valor){
 const n=af_norm_(valor);
 if(/execu|engenharia|concrejato|catui|obra|producao|operacao|operacional|manutencao|equipe de campo/.test(n))return 'Execução';
 return 'Atendimento';
}
function af_destino_(valor){if(!['Atendimento','Execução'].includes(String(valor||'').trim()))throw Error('Escolha Atendimento ou Execução.');return String(valor).trim();}
