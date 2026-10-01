/** REVISÃO 20/09/2026 · 02_Fichas_Oficiais_3_2_0.gs · SUBSTITUIÇÃO COMPLETA do módulo correspondente. */
/**
 * SISTEMA DE FICHAS OFICIAIS DE ATENDIMENTO SABESP, VERSÃO 3.2.0
 *
 * Este conjunto de arquivos deve ser instalado na planilha
 * Controle de Atendimentos.
 *
 * O código não altera a aba de respostas do Google Forms.
 */

const FO_CONFIG = Object.freeze({
  VERSAO: '3.2.1',
  VERSAO_MODELO: '2.8.0', // Esta atualização não modifica a apresentação do PDF.
  CENTRAL_ID: '1UHs_jFVD7jQRKgw7CVPCQ8R7sgvyhkJVv5rcj0v2K5g',
  PLANILHA_EXECUCAO_ID: '1Y5zioMOTaJDtp78OPBovXeHhvuns_ZEG6SMyHqng-Uk',
  ANEXOS_RELATORIO_ID: '1Et4M0nr4CxlRj7J6EDoru91aC4PJ-G2Y',
  MODELO_DOCUMENTO_ID: '11wGNtV2E0O-PhSv6XOnVo5KPCB6GPi18rRKEYG6HN54',
  EMPRESA: 'Consórcio Performance Tamanduateí',
  ABA_BASE_CENTRAL: 'Base de Atendimentos',
  ABA_DASHBOARD_CENTRAL: 'Dashboard',
  ABA_HISTORICO_CENTRAL: 'Histórico',
  ABA_CONTROLE_ANEXOS: 'Controle de manisfestações',
  ABA_BASE_OFICIAL: 'Base Fichas Oficiais',
  ABA_INDICE: 'Fichas Oficiais',
  ABA_REVISAO: 'Revisão de Migração',
  ABA_AVISOS_PROTOCOLO: 'Demandas do Atendimento',
  ABA_AVISOS_PROTOCOLO_LEGADA: 'Protocolos para Avisar',
  ABA_ENCERRAMENTO_ATENDIMENTO: 'Encerramento pelo Atendimento',
  ABA_CONFIGURACAO: 'Configuração Fichas',
  ABA_LOG: 'Log Fichas Oficiais',
  LINHA_CABECALHO_INDICE: 5,
  PRIMEIRA_LINHA_INDICE: 6,
  PROPRIEDADE_PASTA_RAIZ: 'FO_PASTA_RAIZ_ID',
  PROPRIEDADE_CONTROLE_ATIVO: 'FO_ATUALIZAR_CONTROLE_ATIVO',
  PROPRIEDADE_ULTIMA_ATUALIZACAO_CONTROLE: 'FO_ULTIMA_ATUALIZACAO_CONTROLE',
  PROPRIEDADE_ULTIMO_ERRO_CONTROLE: 'FO_ULTIMO_ERRO_CONTROLE',
  PROPRIEDADE_ASSINATURA_ULTIMA_BASE: 'FO_ASSINATURA_ULTIMA_BASE',
  PROPRIEDADE_FILA_MENSAL: 'FO_FILA_MENSAL',
  PROPRIEDADE_MES_FILA: 'FO_MES_FILA',
  PROPRIEDADE_FILA_ATUALIZACAO: 'FO_FILA_ATUALIZACAO_FICHAS',
  PROPRIEDADE_MANUTENCAO: 'FO_MANUTENCAO_ATIVA',
  TEMPO_ESPERA_TRAVA_MS: 30000,
  MANTER_VERSOES_ANTERIORES: false,
  DIAS_ENCERRAMENTO_SEM_RESPOSTA: 14,
  TENTATIVAS_ENCERRAMENTO_SEM_RESPOSTA: 3,
  DATA_INICIO_AUTOMACAO: new Date(2026, 8, 1),
  DATA_CORTE_HISTORICO_ENTREGUE: new Date(2026, 7, 31, 23, 59, 59),
  TAMANHO_LOTE_PDF: 3,
  LIMITE_FOTOS_ABERTURA: 12,
  LARGURA_FOTO_PX: 235,
  ALTURA_FOTO_PX: 185,
  COR_TEXTO_DOCUMENTO: '#000000',
  STATUS: Object.freeze(['Recebida', 'Em andamento', 'Concluída']),
  CORES: Object.freeze({
    AZUL_ESCURO: '#123B5D',
    AZUL: '#1976A3',
    AZUL_CLARO: '#DCEAF4',
    VERDE: '#2F8A66',
    VERDE_CLARO: '#E1F2E8',
    LARANJA: '#D18336',
    LARANJA_CLARO: '#FFF0D6',
    VERMELHO: '#C85C4A',
    VERMELHO_CLARO: '#FCE0DC',
    CINZA: '#667581',
    CINZA_CLARO: '#F3F7FA',
    BORDA: '#B8C7D3',
    TEXTO: '#233247',
    BRANCO: '#FFFFFF'
  })
});

const FO_MARCADOR_REMOCAO = '[[REMOVER]]';

const FO_CABECALHOS_BASE = Object.freeze([
  'Chave do registro',
  'Protocolo',
  'Origem',
  'Linha no Controle',
  'ID legado',
  'Data de abertura',
  'Horário',
  'Local do atendimento',
  'Responsável pelo atendimento',
  'Assunto',
  'Tipo de manifestação',
  'Nome',
  'Telefone',
  'E-mail',
  'Endereço',
  'Frente de obra',
  'Solicitação',
  'Solução',
  'Finalização',
  'Status',
  'Data de conclusão',
  'Fotos da abertura',
  'Fotos da solução',
  'ID do documento',
  'ID do PDF atual',
  'Hash oficial',
  'Última geração',
  'Situação do vínculo',
  'Campos faltantes',
  'Encerrado legado',
  'Assinatura do Controle',
  'Carimbo da fonte',
  'Histórico já entregue',
  'Revisão obrigatória',
  'Motivo da revisão',
  'Canal de recebimento',
  'Grau de urgência',
  'Área responsável pela próxima ação',
  'Próxima ação',
  'Última atualização operacional',
  'Descrição detalhada da reclamação',
  'Procedência'
]);

const FO_CABECALHOS_ENCERRAMENTO = Object.freeze([
  'Protocolo',
  'Data de abertura',
  'Nome',
  'Telefone',
  'Endereço',
  'Procedência',
  'Solicitação resumida',
  'Opção de reparo ou encaminhamento',
  'Tratativa e parecer final',
  'Devolutiva informada ao cliente',
  'Canal da devolutiva',
  'Data da devolutiva',
  'Responsável pelo encerramento',
  'Resultado do contato',
  'Observação adicional',
  '✓ Confirmar encerramento',
  'Situação',
  'Chave interna'
]);

const FO_OPCOES_REPARO = Object.freeze([
  'Reparo de calçada',
  'Reparo de pavimento',
  'Reparo de guia ou sarjeta',
  'Recomposição de piso ou revestimento',
  'Limpeza de via',
  'Limpeza de imóvel',
  'Limpeza de veículo',
  'Controle de poeira ou lama',
  'Remoção de resíduos',
  'Desentupimento ou limpeza de PV',
  'Correção de vazamento',
  'Correção de retorno de esgoto',
  'Bombeamento ou drenagem',
  'Recomposição de muro ou fachada',
  'Reparo em portão',
  'Reparo em acesso ao imóvel',
  'Restabelecimento de acesso provisório',
  'Recomposição de jardim',
  'Reparo de dano em veículo',
  'Sinalização ou isolamento da área',
  'Poda ou remoção de galhos',
  'Vistoria técnica',
  'Agendamento de serviço',
  'Monitoramento, sem ação imediata',
  'Encaminhamento para análise de sinistro',
  'Encaminhamento para a Engenharia',
  'Encaminhamento para a equipe operacional',
  'Encaminhamento para a equipe socioambiental',
  'Encaminhamento à Sabesp',
  'Encaminhamento a terceiro responsável',
  'Orientação ao morador',
  'Não procedente, sem reparo',
  'Não foi necessário reparo',
  'Outro'
]);

const FO_CABECALHOS_INDICE = Object.freeze([
  'Protocolo',
  'Data de abertura',
  'Nome',
  'Endereço',
  'Tipo',
  'Status',
  'Situação documental',
  'Abrir ficha',
  'Baixar PDF',
  'Última geração'
]);

const FO_CABECALHOS_REVISAO = Object.freeze([
  'Protocolo',
  'Origem',
  'Linha no Controle',
  'ID legado',
  'Data',
  'Nome',
  'Endereço',
  'Status',
  'Situação do vínculo',
  'Campos faltantes',
  'Observação da revisão'
]);

const FO_CABECALHOS_LOG = Object.freeze([
  'Data e hora',
  'Nível',
  'Função',
  'Protocolo',
  'Mensagem'
]);

const FO_CABECALHOS_AVISOS = Object.freeze([
  'Protocolo',
  'Prioridade',
  'Tarefa do Atendimento',
  'Prazo',
  'Data de abertura',
  'Nome',
  'Telefone',
  'Endereço',
  'Solicitação resumida',
  'Ação necessária',
  'Mensagem pronta',
  'WhatsApp',
  '✓ Tarefa realizada',
  'Data da realização',
  'Observação do Atendimento',
  'Próxima etapa',
  'Chave técnica',
  'Área atual',
  'Status atual'
]);

const FO_MESES_PT = Object.freeze([
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]);

function fo_texto_(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
}

function fo_normalizar_(valor) {
  return fo_texto_(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fo_mapaCabecalhos_(cabecalhos) {
  const mapa = {};
  (cabecalhos || []).forEach(function(cabecalho, indice) {
    const chave = fo_normalizar_(cabecalho);
    if (chave && mapa[chave] === undefined) mapa[chave] = indice;
  });
  return mapa;
}

function fo_valorCampo_(linha, mapa, nomes) {
  const lista = Array.isArray(nomes) ? nomes : [nomes];
  for (let i = 0; i < lista.length; i++) {
    const indice = mapa[fo_normalizar_(lista[i])];
    if (indice !== undefined && linha[indice] !== '' && linha[indice] !== null) {
      return linha[indice];
    }
  }
  return '';
}

function fo_data_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) return valor;
  const texto = fo_texto_(valor);
  if (!texto) return null;
  const numerica = texto.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/);
  if (numerica) {
    const primeiro = Number(numerica[1]);
    const segundo = Number(numerica[2]);
    const ano = Number(numerica[3]);
    const mes = segundo > 12 && primeiro <= 12 ? primeiro : segundo;
    const dia = segundo > 12 && primeiro <= 12 ? segundo : primeiro;
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
    const data = new Date(ano, mes - 1, dia);
    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 ||
        data.getDate() !== dia) return null;
    return data;
  }
  const data = new Date(texto);
  return isNaN(data.getTime()) ? null : data;
}

function fo_formatarData_(valor) {
  const data = fo_data_(valor);
  return fo_dataRelatorioValida_(data)
    ? Utilities.formatDate(data, Session.getScriptTimeZone(), 'dd/MM/yyyy')
    : '';
}

function fo_dataRelatorioValida_(valor) {
  const data = fo_data_(valor);
  if (!data) return false;
  const ano = data.getFullYear();
  return ano >= 2000 && ano <= new Date().getFullYear() + 1;
}

function fo_formatarHora_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'HH:mm');
  }
  const texto = fo_texto_(valor);
  const encontrado = texto.match(/(\d{1,2}):(\d{2})/);
  return encontrado ? String(encontrado[1]).padStart(2, '0') + ':' + encontrado[2] : texto;
}

function fo_hash_(valor) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    fo_texto_(valor),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(byte) {
    const numero = byte < 0 ? byte + 256 : byte;
    return ('0' + numero.toString(16)).slice(-2);
  }).join('');
}

function fo_juntarTextosUnicos_(valores) {
  const vistos = {};
  const blocos = [];
  (valores || []).map(fo_texto_).filter(Boolean).forEach(function(texto) {
    texto.split(/\n\s*\n+/).forEach(function(bloco) {
      const limpo = fo_texto_(bloco);
      if (limpo) blocos.push(limpo);
    });
  });
  return blocos.filter(function(texto) {
    if (!texto) return false;
    const normalizado = fo_normalizar_(texto);
    if (!normalizado || vistos[normalizado]) return false;
    if (normalizado === 'atendimento recebido pela central') return false;
    vistos[normalizado] = true;
    return true;
  }).join('\n\n');
}

function fo_statusInterno_(valor) {
  const texto = fo_normalizar_(valor);
  if (texto.indexOf('aguardando final') >= 0 ||
      texto.indexOf('aguarda final') >= 0) return 'Em andamento';
  if (texto.indexOf('conclu') >= 0 || texto.indexOf('finaliz') >= 0 ||
      texto.indexOf('encerr') >= 0 || texto.indexOf('resolvid') >= 0) return 'Concluída';
  if (texto.indexOf('andamento') >= 0 || texto.indexOf('acompanha') >= 0) return 'Em andamento';
  return 'Recebida';
}

function fo_statusRelatorio_(valor) {
  return fo_statusInterno_(valor) === 'Concluída' ? 'Concluído' : 'Em andamento';
}

function fo_statusFicha_(valor) {
  return fo_statusInterno_(valor) === 'Concluída'
    ? 'Atendimento encerrado.'
    : 'Atendimento em andamento.';
}

function fo_primeiroValor_(valores) {
  for (let i = 0; i < valores.length; i++) {
    if (fo_texto_(valores[i])) return valores[i];
  }
  return '';
}

function fo_mesmoMes_(data, referencia) {
  const a = fo_data_(data);
  const b = fo_data_(referencia);
  return Boolean(a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth());
}

function fo_inicioMes_(valor) {
  const data = fo_data_(valor) || new Date();
  return new Date(data.getFullYear(), data.getMonth(), 1);
}

function fo_fimMes_(valor) {
  const inicio = fo_inicioMes_(valor);
  return new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0, 23, 59, 59, 999);
}

function fo_nomeMesPasta_(valor) {
  const data = fo_inicioMes_(valor);
  return String(data.getMonth() + 1).padStart(2, '0') + ' ' + FO_MESES_PT[data.getMonth()];
}

function fo_ultimaData_(valores) {
  return (valores || []).reduce(function(ultima, valor) {
    const data = fo_data_(valor);
    return data && (!ultima || data.getTime() > ultima.getTime()) ? data : ultima;
  }, null);
}

function fo_extrairIdDrive_(valor) {
  const texto = fo_texto_(valor);
  if (!texto) return '';
  const padroes = [
    /\/d\/([a-zA-Z0-9_-]{20,})/,
    /[?&]id=([a-zA-Z0-9_-]{20,})/,
    /^([a-zA-Z0-9_-]{20,})$/
  ];
  for (let i = 0; i < padroes.length; i++) {
    const encontrado = texto.match(padroes[i]);
    if (encontrado) return encontrado[1];
  }
  return '';
}

function fo_separarLinks_(valor) {
  const texto = fo_texto_(valor);
  if (!texto) return [];
  const encontrados = texto.match(/https?:\/\/[^\s,;]+/g) || [];
  if (encontrados.length) return encontrados;
  return texto.split(/[\n,;]+/).map(fo_texto_).filter(Boolean);
}

function fo_linkPlanilha_(planilhaId, gid, texto) {
  const url = 'https://docs.google.com/spreadsheets/d/' + planilhaId +
    '/edit#gid=' + gid;
  return SpreadsheetApp.newRichTextValue().setText(texto || 'Abrir').setLinkUrl(url).build();
}

function fo_linkDrive_(arquivoId, texto) {
  if (!arquivoId) return SpreadsheetApp.newRichTextValue().setText('').build();
  const url = 'https://drive.google.com/open?id=' + arquivoId;
  return SpreadsheetApp.newRichTextValue().setText(texto || 'Abrir').setLinkUrl(url).build();
}

function fo_garantirDimensoes_(aba, linhas, colunas) {
  if (aba.getMaxRows() < linhas) {
    aba.insertRowsAfter(aba.getMaxRows(), linhas - aba.getMaxRows());
  }
  if (aba.getMaxColumns() < colunas) {
    aba.insertColumnsAfter(aba.getMaxColumns(), colunas - aba.getMaxColumns());
  }
}

function fo_obterOuCriarAba_(planilha, nome) {
  return planilha.getSheetByName(nome) || planilha.insertSheet(nome);
}

function fo_registrarLog_(nivel, funcao, protocolo, mensagem) {
  try {
    const planilha = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
    const aba = planilha.getSheetByName(FO_CONFIG.ABA_LOG);
    if (!aba) return;
    aba.appendRow([new Date(), nivel, funcao, protocolo || '', mensagem || '']);
  } catch (erro) {
    console.log(nivel + ' | ' + funcao + ' | ' + protocolo + ' | ' + mensagem);
  }
}

/**
 * Instala o gerador oficial na planilha Controle de Atendimentos.
 * Esta função não chama a interface do Google Sheets e pode ser executada
 * diretamente pelo editor do Apps Script.
 */
function instalarSistemaFichasOficiaisSabesp() {
  const ativa = SpreadsheetApp.getActiveSpreadsheet();
  if (!ativa || ativa.getId() !== FO_CONFIG.CENTRAL_ID) {
    throw new Error(
      'Abra o Apps Script da planilha Controle de Atendimentos e execute a instalação novamente.'
    );
  }

  if (typeof painelPrepararCadastro_ !== 'function') {
    throw new Error('Atualize também o arquivo Painel de Trabalho Atendimento.gs.');
  }
  painelPrepararCadastro_();
  painelInstalarAutomacao_();
  validarModeloFichaOficialSabesp();
  fo_garantirPastas_();
  fo_prepararEstruturaCentral_();
  fo_instalarGatilhos_();
  ativarAtualizacaoControleManifestacoes();
  atualizarControleManifestacoesPelaCentral(false);

  painelOrganizarAbas_();
  aoAbrirFichasOficiaisSabesp();
  console.log(
    'Sistema instalado. Reabra a planilha para visualizar o menu Fichas SABESP.'
  );
}

/** Menu criado apenas quando a planilha é aberta por uma pessoa. */
function aoAbrirFichasOficiaisSabesp() {
  const ui = SpreadsheetApp.getUi();
  const consultas = ui.createMenu('Consultas e acompanhamento')
    .addItem('Carteira de atendimentos', 'painelAbrirAtendimento')
    .addItem('Comunicação entre áreas', 'painelAbrirComunicacao')
    .addItem('Acompanhamento interno', 'painelAbrirDemandas')
    .addItem('Avisos e acompanhamento diário', 'abrirAcompanhamentoDiario');
  const saidas = ui.createMenu('Documentos para a Sabesp')
    .addItem('Revisar e gerar uma ficha', 'painelAbrirFicha')
    .addItem('Preparar pacote mensal', 'painelAbrirPacote');
  ui.createMenu('ATENDIMENTO').addItem('Abrir Painel de Trabalho', 'painelAbrirAtendimento')
    .addItem('Autorizar meu acesso', 'autorizarMeuAcessoAtendimento')
    .addSubMenu(consultas)
    .addSubMenu(saidas)
    .addSeparator()
    .addItem('Cadastro de histórico', 'painelAbrirCadastro')
    .addItem('Atualizar consultas e anexos', 'painelAbrirAtualizacao')
    .addToUi();
}

/** Valida se o documento indicado continua sendo o modelo oficial esperado. */
function validarModeloFichaOficialSabesp() {
  const documento = DocumentApp.openById(FO_CONFIG.MODELO_DOCUMENTO_ID);
  const corpo = fo_corpoDocumento_(documento);
  const tabelas = corpo.getTables();
  if (tabelas.length < 2) {
    throw new Error('O modelo precisa manter as duas tabelas oficiais da ficha.');
  }

  const texto = fo_normalizar_(corpo.getText());
  const obrigatorios = [
    'empresa contratada',
    'responsavel pelo atendimento',
    'dados do cliente',
    'solicitacao',
    'registro fotografico',
    'status'
  ];
  const ausentes = obrigatorios.filter(function(campo) {
    return texto.indexOf(campo) < 0;
  });
  if (ausentes.length) {
    throw new Error(
      'O documento informado não corresponde ao modelo esperado. Campos ausentes: ' +
      ausentes.join(', ')
    );
  }
  return true;
}

function fo_prepararEstruturaCentral_() {
  const planilha = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
  const base = fo_obterOuCriarAba_(planilha, FO_CONFIG.ABA_BASE_OFICIAL);
  const indice = fo_obterOuCriarAba_(planilha, FO_CONFIG.ABA_INDICE);
  const revisao = planilha.getSheetByName(FO_CONFIG.ABA_REVISAO);
  let avisos = planilha.getSheetByName(FO_CONFIG.ABA_AVISOS_PROTOCOLO);
  const avisosLegados = planilha.getSheetByName(FO_CONFIG.ABA_AVISOS_PROTOCOLO_LEGADA);
  if (!avisos && avisosLegados) {
    avisosLegados.setName(FO_CONFIG.ABA_AVISOS_PROTOCOLO);
    avisos = avisosLegados;
  }
  if (!avisos) avisos = planilha.insertSheet(FO_CONFIG.ABA_AVISOS_PROTOCOLO);
  const encerramento = planilha.getSheetByName(FO_CONFIG.ABA_ENCERRAMENTO_ATENDIMENTO);
  const configuracao = fo_obterOuCriarAba_(planilha, FO_CONFIG.ABA_CONFIGURACAO);
  const log = fo_obterOuCriarAba_(planilha, FO_CONFIG.ABA_LOG);

  fo_prepararBaseOficial_(base);
  fo_prepararIndice_(indice);
  if (revisao) fo_prepararRevisao_(revisao);
  fo_prepararAvisosProtocolo_(avisos);
  if (encerramento) fo_prepararEncerramentoAtendimento_(encerramento);
  fo_prepararConfiguracao_(configuracao);
  fo_prepararLog_(log);

  base.hideSheet();
  if (revisao) revisao.hideSheet();
  configuracao.hideSheet();
  log.hideSheet();
  planilha.getSheets().forEach(function(aba) {
    const nome = fo_normalizar_(aba.getName());
    if (nome === 'encerramento de procedimentos' ||
        nome === 'finalizacoes pendentes') {
      try { aba.hideSheet(); } catch (erro) {}
    }
  });
}

function fo_prepararBaseOficial_(aba) {
  fo_garantirDimensoes_(aba, 30, FO_CABECALHOS_BASE.length);
  aba.getRange(1, 1, 1, FO_CABECALHOS_BASE.length)
    .setValues([FO_CABECALHOS_BASE])
    .setBackground(FO_CONFIG.CORES.AZUL_ESCURO)
    .setFontColor(FO_CONFIG.CORES.BRANCO)
    .setFontWeight('bold');
  aba.setFrozenRows(1);
}

function fo_prepararIndice_(aba) {
  const c = FO_CONFIG.CORES;
  fo_garantirDimensoes_(aba, 40, FO_CABECALHOS_INDICE.length);
  aba.getRange('A1:J1').breakApart().merge()
    .setValue('FICHAS OFICIAIS DE ATENDIMENTO SABESP')
    .setBackground(c.AZUL_ESCURO).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(16).setFontWeight('bold')
    .setHorizontalAlignment('left').setVerticalAlignment('middle');
  aba.getRange('A2:J2').breakApart().merge()
    .setValue('Menu ATENDIMENTO > Gerar ou regerar ficha PDF | Preparar pacote mensal')
    .setBackground(c.AZUL_CLARO).setFontColor(c.AZUL_ESCURO)
    .setFontFamily('Arial').setFontSize(10).setFontWeight('bold');
  aba.getRange('A3').setValue('Último mês escolhido')
    .setBackground(c.CINZA_CLARO).setFontWeight('bold');
  if (!fo_data_(aba.getRange('B3').getValue())) {
    aba.getRange('B3').setValue(fo_inicioMes_(new Date()));
  }
  aba.getRange('B3').setNumberFormat('mmmm/yyyy')
    .setBackground('#EAF0F4').setFontWeight('bold')
    .setDataValidation(
      SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build()
    );
  aba.getRange(FO_CONFIG.LINHA_CABECALHO_INDICE, 1, 1, FO_CABECALHOS_INDICE.length)
    .setValues([FO_CABECALHOS_INDICE])
    .setBackground(c.AZUL).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(10).setFontWeight('bold')
    .setWrap(true).setHorizontalAlignment('center');
  aba.setFrozenRows(FO_CONFIG.LINHA_CABECALHO_INDICE);
  aba.setFrozenColumns(0);
  aba.setRowHeight(1, 38);
  aba.setRowHeight(2, 24);
  aba.setRowHeight(FO_CONFIG.LINHA_CABECALHO_INDICE, 38);
  [120, 100, 180, 260, 140, 120, 160, 90, 90, 130].forEach(function(largura, indice) {
    aba.setColumnWidth(indice + 1, largura);
  });
}

function fo_prepararRevisao_(aba) {
  fo_garantirDimensoes_(aba, 30, FO_CABECALHOS_REVISAO.length);
  aba.getRange(1, 1, 1, FO_CABECALHOS_REVISAO.length)
    .setValues([FO_CABECALHOS_REVISAO])
    .setBackground(FO_CONFIG.CORES.LARANJA)
    .setFontColor(FO_CONFIG.CORES.BRANCO)
    .setFontWeight('bold').setWrap(true);
  aba.setFrozenRows(1);
  aba.setFrozenColumns(0);
  [120, 120, 100, 100, 95, 180, 240, 110, 180, 260, 340]
    .forEach(function(largura, indice) { aba.setColumnWidth(indice + 1, largura); });
}

function fo_prepararAvisosProtocolo_(aba) {
  const c = FO_CONFIG.CORES;
  fo_garantirDimensoes_(aba, 35, FO_CABECALHOS_AVISOS.length);
  if (aba.getFilter()) aba.getFilter().remove();
  aba.getRange('A1:P1').breakApart().merge()
    .setValue('DEMANDAS DO ATENDIMENTO')
    .setBackground(c.AZUL_ESCURO).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(15).setFontWeight('bold')
    .setHorizontalAlignment('left').setVerticalAlignment('middle');
  aba.getRange('A2:P2').breakApart().merge()
    .setValue('Priorize as primeiras linhas. Conclua a ação indicada e marque a tarefa para registrar o avanço e encaminhar a próxima etapa.')
    .setBackground(c.AZUL_CLARO).setFontColor(c.AZUL_ESCURO)
    .setFontFamily('Arial').setFontSize(10).setFontWeight('bold');
  aba.getRange(4, 1, 1, FO_CABECALHOS_AVISOS.length)
    .setValues([FO_CABECALHOS_AVISOS])
    .setBackground(c.AZUL).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(10).setFontWeight('bold')
    .setWrap(true).setHorizontalAlignment('center');
  aba.setFrozenRows(4);
  aba.setFrozenColumns(0);
  aba.setHiddenGridlines(true);
  aba.setRowHeight(1, 36);
  aba.setRowHeight(2, 32);
  aba.setRowHeight(4, 42);
  [120, 100, 190, 105, 100, 180, 130, 240, 300, 270, 390, 105, 105, 125, 240, 190, 120, 120, 120]
    .forEach(function(largura, indice) { aba.setColumnWidth(indice + 1, largura); });
  try { aba.hideColumns(17, 3); } catch (erro) {}
}

function fo_prepararEncerramentoAtendimento_(aba) {
  const c = FO_CONFIG.CORES;
  const colunas = FO_CABECALHOS_ENCERRAMENTO.length;
  fo_garantirDimensoes_(aba, 35, colunas);
  if (aba.getFilter()) aba.getFilter().remove();
  aba.getRange(1, 1, 1, colunas).breakApart().merge()
    .setValue('ENCERRAMENTO PELO ATENDIMENTO')
    .setBackground(c.AZUL_ESCURO).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(15).setFontWeight('bold')
    .setHorizontalAlignment('left').setVerticalAlignment('middle');
  aba.getRange(2, 1, 1, colunas).breakApart().merge()
    .setValue(
      'Use esta página quando o Atendimento já puder documentar a solução e a devolutiva, mesmo sem retorno do formulário de execução. Preencha as células amarelas com o que foi confirmado e registre a data efetiva do contato. Confirme somente após informar o cliente.'
    )
    .setBackground(c.AZUL_CLARO).setFontColor(c.AZUL_ESCURO)
    .setFontFamily('Arial').setFontSize(10).setFontWeight('bold');
  aba.getRange(4, 1, 1, colunas)
    .setValues([FO_CABECALHOS_ENCERRAMENTO])
    .setBackground(c.AZUL).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(9).setFontWeight('bold')
    .setWrap(true).setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  aba.setFrozenRows(4);
  aba.setFrozenColumns(0);
  aba.setHiddenGridlines(true);
  aba.setRowHeight(1, 36);
  aba.setRowHeight(2, 38);
  aba.setRowHeight(4, 44);
  [120, 100, 180, 120, 230, 150, 260, 210, 300, 300, 150, 120, 190, 190, 230, 120, 230, 100]
    .forEach(function(largura, indice) { aba.setColumnWidth(indice + 1, largura); });
  try { aba.hideColumns(18); } catch (erro) {}
}

function fo_prepararConfiguracao_(aba) {
  fo_garantirDimensoes_(aba, 15, 3);
  const valores = [
    ['Configuração', 'Valor', 'Observação'],
    ['ID da planilha central', FO_CONFIG.CENTRAL_ID, 'Controle de Atendimentos'],
    ['ID do modelo oficial', FO_CONFIG.MODELO_DOCUMENTO_ID, 'Google Docs fornecido'],
    ['ID dos anexos do relatório', FO_CONFIG.ANEXOS_RELATORIO_ID, 'Controle de manifestações'],
    ['Corte do histórico entregue', FO_CONFIG.DATA_CORTE_HISTORICO_ENTREGUE,
      'Concluídos até esta data não geram novas fichas'],
    ['Marco das novas movimentações', FO_CONFIG.DATA_INICIO_AUTOMACAO,
      'Casos ativos entram independentemente da data de abertura'],
    ['Atualização externa ativa',
      PropertiesService.getScriptProperties().getProperty(FO_CONFIG.PROPRIEDADE_CONTROLE_ATIVO) === 'SIM'
        ? 'SIM' : 'NÃO',
      'Ative somente após a revisão inicial'],
    ['Versão', FO_CONFIG.VERSAO, 'Sistema de fichas oficiais'],
    ['Última atualização do Controle',
      PropertiesService.getScriptProperties()
        .getProperty(FO_CONFIG.PROPRIEDADE_ULTIMA_ATUALIZACAO_CONTROLE) || 'Ainda não executada',
      'Atualização automática dos anexos']
  ];
  aba.getRange(1, 1, valores.length, 3).setValues(valores);
  aba.getRange(5, 2, 2, 1).setNumberFormat('dd/MM/yyyy');
  aba.getRange(1, 1, 1, 3).setBackground(FO_CONFIG.CORES.AZUL_ESCURO)
    .setFontColor(FO_CONFIG.CORES.BRANCO).setFontWeight('bold');
  aba.autoResizeColumns(1, 3);
}

function fo_prepararLog_(aba) {
  fo_garantirDimensoes_(aba, 50, FO_CABECALHOS_LOG.length);
  aba.getRange(1, 1, 1, FO_CABECALHOS_LOG.length)
    .setValues([FO_CABECALHOS_LOG])
    .setBackground(FO_CONFIG.CORES.CINZA)
    .setFontColor(FO_CONFIG.CORES.BRANCO).setFontWeight('bold');
  aba.setFrozenRows(1);
  aba.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm:ss');
}

function fo_instalarGatilhos_() {
  const funcoes = {
    aoAbrirFichasOficiaisSabesp: true,
    aoEditarAvisosProtocolo: true,
    sincronizarFichasOficiaisAgendado: true,
    atualizarAnexosAtendimentosAgendado: true,
    continuarGeracaoPacoteMensal: true,
    continuarGeracaoFichasPendentes: true
  };
  ScriptApp.getProjectTriggers().forEach(function(gatilho) {
    if (funcoes[gatilho.getHandlerFunction()]) ScriptApp.deleteTrigger(gatilho);
  });
  ScriptApp.newTrigger('aoAbrirFichasOficiaisSabesp')
    .forSpreadsheet(FO_CONFIG.CENTRAL_ID).onOpen().create();
  ScriptApp.newTrigger('aoEditarAvisosProtocolo')
    .forSpreadsheet(FO_CONFIG.CENTRAL_ID).onEdit().create();
  ScriptApp.newTrigger('atualizarAnexosAtendimentosAgendado')
    .timeBased().everyMinutes(15).create();
  fo_garantirGatilhosComplementares_();
}

/**
 * Preserva e, quando o código da Central estiver no mesmo projeto, restaura
 * somente os gatilhos internos necessários para manter a base alimentada.
 * Gatilhos de formulários externos nunca são removidos por este sistema.
 */
function fo_garantirGatilhosComplementares_() {
  const existentes = {};
  ScriptApp.getProjectTriggers().forEach(function(gatilho) {
    existentes[gatilho.getHandlerFunction()] = true;
  });
  if (typeof sincronizarCentralAtendimentosAgendado === 'function' &&
      !existentes.sincronizarCentralAtendimentosAgendado) {
    ScriptApp.newTrigger('sincronizarCentralAtendimentosAgendado')
      .timeBased().everyMinutes(15).create();
  }
  if (typeof aoAbrirCentralAtendimentos === 'function' &&
      !existentes.aoAbrirCentralAtendimentos) {
    ScriptApp.newTrigger('aoAbrirCentralAtendimentos')
      .forSpreadsheet(FO_CONFIG.CENTRAL_ID).onOpen().create();
  }
  if (typeof aoEditarDashboardCentralAtendimentos === 'function' &&
      !existentes.aoEditarDashboardCentralAtendimentos) {
    ScriptApp.newTrigger('aoEditarDashboardCentralAtendimentos')
      .forSpreadsheet(FO_CONFIG.CENTRAL_ID).onEdit().create();
  }
  if (typeof aoEditarCorrecoesFichaFinalAtendimento === 'function' &&
      !existentes.aoEditarCorrecoesFichaFinalAtendimento) {
    ScriptApp.newTrigger('aoEditarCorrecoesFichaFinalAtendimento')
      .forSpreadsheet(FO_CONFIG.CENTRAL_ID).onEdit().create();
  }
}

function fo_garantirPastas_() {
  const propriedades = PropertiesService.getScriptProperties();
  const idExistente = propriedades.getProperty(FO_CONFIG.PROPRIEDADE_PASTA_RAIZ);
  if (idExistente) {
    try {
      const pasta = DriveApp.getFolderById(idExistente);
      pasta.getName();
      return pasta;
    } catch (erro) {
      propriedades.deleteProperty(FO_CONFIG.PROPRIEDADE_PASTA_RAIZ);
    }
  }

  const arquivoCentral = DriveApp.getFileById(FO_CONFIG.CENTRAL_ID);
  const pais = arquivoCentral.getParents();
  const pai = pais.hasNext() ? pais.next() : DriveApp.getRootFolder();
  const raiz = pai.createFolder('Fichas Oficiais de Atendimento');
  ['Documentos Atuais', 'PDFs Atuais', 'Versões Anteriores', 'Pacotes Mensais']
    .forEach(function(nome) { raiz.createFolder(nome); });
  propriedades.setProperty(FO_CONFIG.PROPRIEDADE_PASTA_RAIZ, raiz.getId());
  return raiz;
}

function fo_subpasta_(nome) {
  const raiz = fo_garantirPastas_();
  const encontradas = raiz.getFoldersByName(nome);
  return encontradas.hasNext() ? encontradas.next() : raiz.createFolder(nome);
}

/**
 * Remove apenas documentos e PDFs arquivados em Versões Anteriores.
 * Os arquivos são enviados à lixeira do Drive e podem ser recuperados.
 */
function limparVersoesAnterioresFichasOficiais() {
  const interfacePlanilha = SpreadsheetApp.getUi();
  const resposta = interfacePlanilha.alert(
    'Limpar versões anteriores',
    'Esta ação enviará à lixeira somente os arquivos da pasta Versões Anteriores. ' +
    'As fichas atuais, os PDFs atuais, os pacotes mensais e o modelo oficial serão preservados.',
    interfacePlanilha.ButtonSet.YES_NO
  );
  if (resposta !== interfacePlanilha.Button.YES) return;

  const propriedades = PropertiesService.getScriptProperties();
  propriedades.setProperty(FO_CONFIG.PROPRIEDADE_MANUTENCAO, 'SIM');
  let resultado;
  try {
    resultado = fo_executarComTravaDocumento_('a limpeza das versões anteriores', function() {
      return fo_enviarArquivosPastaParaLixeira_('Versões Anteriores');
    });
  } finally {
    propriedades.deleteProperty(FO_CONFIG.PROPRIEDADE_MANUTENCAO);
  }

  fo_registrarLog_(
    resultado.falhas ? 'AVISO' : 'OK',
    'limparVersoesAnterioresFichasOficiais',
    '',
    resultado.movidos + ' arquivo(s) enviado(s) à lixeira. Falhas: ' + resultado.falhas + '.'
  );
  interfacePlanilha.alert(
    'Limpeza concluída',
    resultado.movidos + ' arquivo(s) foram enviados à lixeira do Drive.' +
      (resultado.falhas ? ' Não foi possível mover ' + resultado.falhas + ' arquivo(s).' : ''),
    interfacePlanilha.ButtonSet.OK
  );
}

/**
 * Mantém somente os documentos e PDFs apontados pela Base Fichas Oficiais.
 * Arquivos órfãos e cópias antigas são enviados à lixeira e podem ser recuperados.
 */
function limparCopiasRedundantesFichasOficiais() {
  const interfacePlanilha = SpreadsheetApp.getUi();
  const resposta = interfacePlanilha.alert(
    'Remover cópias redundantes',
    'Esta ação manterá somente o documento e o PDF atualmente vinculados a cada protocolo. ' +
      'Versões anteriores, duplicadas e arquivos órfãos serão enviados à lixeira do Drive. ' +
      'O modelo oficial e os pacotes mensais serão preservados.',
    interfacePlanilha.ButtonSet.YES_NO
  );
  if (resposta !== interfacePlanilha.Button.YES) return;

  const propriedades = PropertiesService.getScriptProperties();
  propriedades.setProperty(FO_CONFIG.PROPRIEDADE_MANUTENCAO, 'SIM');
  let resultado;
  try {
    resultado = fo_executarComTravaDocumento_('a remoção das cópias redundantes', function() {
      const central = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
      const registros = fo_lerRegistrosBaseOficial_(central);
      const documentosAtuais = {};
      const pdfsAtuais = {};
      registros.forEach(function(registro) {
        if (registro.documentoId) documentosAtuais[registro.documentoId] = true;
        if (registro.pdfId) pdfsAtuais[registro.pdfId] = true;
      });
      const totais = {movidos: 0, falhas: 0};
      const docs = fo_enviarArquivosNaoReferenciadosParaLixeira_(
        'Documentos Atuais', documentosAtuais
      );
      const pdfs = fo_enviarArquivosNaoReferenciadosParaLixeira_(
        'PDFs Atuais', pdfsAtuais
      );
      const anteriores = fo_enviarArquivosPastaParaLixeira_('Versões Anteriores');
      [docs, pdfs, anteriores].forEach(function(parcial) {
        totais.movidos += parcial.movidos;
        totais.falhas += parcial.falhas;
      });
      return totais;
    });
  } finally {
    propriedades.deleteProperty(FO_CONFIG.PROPRIEDADE_MANUTENCAO);
  }

  fo_registrarLog_(
    resultado.falhas ? 'AVISO' : 'OK',
    'limparCopiasRedundantesFichasOficiais',
    '',
    resultado.movidos + ' cópia(s) redundante(s) enviada(s) à lixeira. Falhas: ' +
      resultado.falhas + '.'
  );
  interfacePlanilha.alert(
    'Limpeza concluída',
    resultado.movidos + ' arquivo(s) redundante(s) foram enviados à lixeira.' +
      (resultado.falhas ? ' Falhas: ' + resultado.falhas + '.' : ''),
    interfacePlanilha.ButtonSet.OK
  );
}

function fo_enviarArquivosNaoReferenciadosParaLixeira_(nomePasta, idsManter) {
  const pasta = fo_subpasta_(nomePasta);
  const arquivos = pasta.getFiles();
  let movidos = 0;
  let falhas = 0;
  while (arquivos.hasNext()) {
    const arquivo = arquivos.next();
    if (idsManter[arquivo.getId()]) continue;
    try {
      arquivo.setTrashed(true);
      movidos++;
    } catch (erro) {
      falhas++;
      fo_registrarLog_(
        'AVISO',
        'fo_enviarArquivosNaoReferenciadosParaLixeira_',
        '',
        'Não foi possível enviar à lixeira ' + arquivo.getName() + ': ' + erro.message
      );
    }
  }
  return {movidos: movidos, falhas: falhas};
}

/**
 * Reinicia os arquivos gerados e limpa seus vínculos internos.
 * O modelo oficial e os pacotes mensais permanecem intactos.
 */
function reiniciarFichasOficiaisGeradas() {
  const interfacePlanilha = SpreadsheetApp.getUi();
  const resposta = interfacePlanilha.alert(
    'Reiniciar fichas geradas',
    'Esta ação enviará à lixeira os documentos atuais, os PDFs atuais e as versões anteriores. ' +
    'Também removerá os links antigos da base. O modelo oficial, os dados dos atendimentos e ' +
    'os pacotes mensais serão preservados. Deseja continuar?',
    interfacePlanilha.ButtonSet.YES_NO
  );
  if (resposta !== interfacePlanilha.Button.YES) return;

  const propriedades = PropertiesService.getScriptProperties();
  propriedades.setProperty(FO_CONFIG.PROPRIEDADE_MANUTENCAO, 'SIM');
  let resultado;
  try {
    resultado = fo_executarComTravaDocumento_('a reinicialização das fichas geradas', function() {
      const totais = {movidos: 0, falhas: 0};
      ['Documentos Atuais', 'PDFs Atuais', 'Versões Anteriores'].forEach(function(nome) {
        const parcial = fo_enviarArquivosPastaParaLixeira_(nome);
        totais.movidos += parcial.movidos;
        totais.falhas += parcial.falhas;
      });

      fo_removerGatilhosAtualizacaoFichas_();
      propriedades.deleteProperty(FO_CONFIG.PROPRIEDADE_FILA_ATUALIZACAO);
      return fo_executarComTravaScript_('a limpeza dos vínculos das fichas', function() {
        const central = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
        const base = central.getSheetByName(FO_CONFIG.ABA_BASE_OFICIAL);
        if (base && base.getLastRow() >= 2) {
          base.getRange(2, 24, base.getLastRow() - 1, 4).clearContent();
        }
        fo_sincronizarBaseFichasOficiaisSemTrava_();
        return totais;
      });
    });
  } finally {
    propriedades.deleteProperty(FO_CONFIG.PROPRIEDADE_MANUTENCAO);
  }

  fo_registrarLog_(
    resultado.falhas ? 'AVISO' : 'OK',
    'reiniciarFichasOficiaisGeradas',
    '',
    resultado.movidos + ' arquivo(s) enviado(s) à lixeira e vínculos reiniciados. ' +
      'Falhas: ' + resultado.falhas + '.'
  );
  interfacePlanilha.alert(
    'Reinicialização concluída',
    resultado.movidos + ' arquivo(s) foram enviados à lixeira. ' +
      'As fichas necessárias aparecerão como Aguardando geração e serão recriadas pela automação.' +
      (resultado.falhas ? ' Não foi possível mover ' + resultado.falhas + ' arquivo(s).' : ''),
    interfacePlanilha.ButtonSet.OK
  );
}

function fo_enviarArquivosPastaParaLixeira_(nomePasta) {
  const pasta = fo_subpasta_(nomePasta);
  const arquivos = pasta.getFiles();
  let movidos = 0;
  let falhas = 0;
  while (arquivos.hasNext()) {
    const arquivo = arquivos.next();
    try {
      arquivo.setTrashed(true);
      movidos++;
    } catch (erro) {
      falhas++;
      fo_registrarLog_(
        'AVISO',
        'fo_enviarArquivosPastaParaLixeira_',
        '',
        'Não foi possível enviar à lixeira o arquivo ' + arquivo.getName() + ': ' + erro.message
      );
    }
  }
  return {movidos: movidos, falhas: falhas};
}

function fo_corpoDocumento_(documento) {
  if (typeof documento.getActiveTab === 'function') {
    return documento.getActiveTab().asDocumentTab().getBody();
  }
  return documento.getBody();
}

/**
 * Consolida o Controle de Manifestações, a Base de Atendimentos, o Dashboard
 * e o Histórico sem alterar as fontes.
 */
function fo_executarComTravaScript_(nomeOperacao, callback) {
  const trava = LockService.getScriptLock();
  const adquirida = trava.tryLock(FO_CONFIG.TEMPO_ESPERA_TRAVA_MS);
  if (!adquirida) {
    throw new Error(
      'Não foi possível concluir ' + nomeOperacao +
      ' porque outra atualização ainda está terminando. Nenhum dado foi alterado.'
    );
  }
  try {
    return callback();
  } finally {
    trava.releaseLock();
  }
}

function fo_executarComTravaDocumento_(nomeOperacao, callback) {
  const trava = LockService.getDocumentLock() || LockService.getUserLock();
  const adquirida = trava.tryLock(FO_CONFIG.TEMPO_ESPERA_TRAVA_MS);
  if (!adquirida) {
    throw new Error(
      'Não foi possível concluir ' + nomeOperacao +
      ' porque outra ficha ainda está sendo gerada. Nenhum documento foi substituído.'
    );
  }
  try {
    return callback();
  } finally {
    trava.releaseLock();
  }
}

function sincronizarBaseFichasOficiais() {
  return fo_executarComTravaScript_('a sincronização da base', function() {
    return fo_sincronizarBaseFichasOficiaisSemTrava_();
  });
}

function fo_sincronizarBaseFichasOficiaisSemTrava_() {
  fo_prepararEstruturaCentral_();
  const central = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
  const estrutura = fo_lerFontesAtendimento_(central);
  const existentes = fo_lerBaseOficialExistente_(central);
  let registros = fo_consolidarRegistros_(estrutura, existentes);
  af_reservarProtocolos_(registros);
  fo_atribuirProtocolos_(registros, existentes);
  registros = registros.filter(r => !af_incorporado_(r.protocolo));
  fo_escreverBaseOficial_(central, registros);
  fo_escreverIndice_(central, registros);
  fo_escreverRevisao_(central, registros);
  fo_escreverAvisosProtocolo_(central, registros);
  fo_escreverEncerramentosAtendimento_(central, registros);
  const assinatura = fo_hash_(JSON.stringify(registros.map(function(registro) {
    return [
      registro.chave, registro.protocolo, registro.status,
      registro.ultimaAtualizacao, registro.solucao,
      registro.finalizacao, registro.canalRecebimento, registro.procedencia
    ];
  })));
  const propriedades = PropertiesService.getScriptProperties();
  if (propriedades.getProperty(FO_CONFIG.PROPRIEDADE_ASSINATURA_ULTIMA_BASE) !== assinatura) {
    fo_registrarLog_('OK', 'sincronizarBaseFichasOficiais', '',
      registros.length + ' atendimentos consolidados.');
    propriedades.setProperty(FO_CONFIG.PROPRIEDADE_ASSINATURA_ULTIMA_BASE, assinatura);
  }
  if(typeof painelOrganizarAbas_==='function') painelOrganizarAbas_();
  return registros.length;
}

function fo_lerFontesAtendimento_(central) {
  const base = central.getSheetByName(FO_CONFIG.ABA_BASE_CENTRAL);
  if (!base) throw new Error('A aba Base de Atendimentos não foi encontrada na Central.');
  const dashboard = central.getSheetByName(FO_CONFIG.ABA_DASHBOARD_CENTRAL);
  const historico = central.getSheetByName(FO_CONFIG.ABA_HISTORICO_CENTRAL);
  const finalizacoesPendentes = central.getSheetByName('Finalizações pendentes');

  return {
    central: fo_lerBaseCentral_(base),
    dashboard: dashboard ? fo_lerDashboard_(dashboard) : {},
    historico: historico ? fo_lerHistorico_(historico) : {},
    finalizacoesPendentes: finalizacoesPendentes
      ? fo_lerFinalizacoesPendentesOficiais_(finalizacoesPendentes) : {},
    controle: [],
    abaControle: null
  };
}

function fo_chaveInstante_(valor) {
  const data = fo_data_(valor);
  return data ? String(data.getTime()) : fo_normalizar_(valor);
}

function fo_lerFinalizacoesPendentesOficiais_(aba) {
  const dados = aba.getDataRange().getValues();
  const cabecalho = fo_encontrarLinhaCabecalho_(dados, ['Chave', 'Situação']);
  if (cabecalho < 0) return {};
  const mapa = fo_mapaCabecalhos_(dados[cabecalho]);
  return dados.slice(cabecalho + 1).reduce(function(saida, linha) {
    const data = fo_valorCampo_(linha, mapa, ['Data e hora']);
    const chave = fo_chaveInstante_(data);
    if (!chave) return saida;
    saida[chave] = {
      idInformado: fo_valorCampo_(linha, mapa, ['ID informado']),
      situacao: fo_valorCampo_(linha, mapa, ['Situação'])
    };
    return saida;
  }, {});
}

function fo_localizarAbaControle_(planilha) {
  const exata = planilha.getSheetByName(FO_CONFIG.ABA_CONTROLE_ANEXOS);
  if (exata) return exata;
  const encontrada = planilha.getSheets().filter(function(aba) {
    const nome = fo_normalizar_(aba.getName());
    return nome.indexOf('controle') >= 0 && nome.indexOf('manifest') >= 0;
  })[0];
  if (!encontrada) throw new Error('A página Controle de Manifestações não foi encontrada.');
  return encontrada;
}

function fo_lerBaseCentral_(aba) {
  const dados = aba.getDataRange().getValues();
  if (dados.length < 2) return [];
  const mapa = fo_mapaCabecalhos_(dados[0]);
  return dados.slice(1).map(function(linha, indice) {
    const id = fo_texto_(fo_valorCampo_(linha, mapa, ['ID']));
    const chave = fo_texto_(fo_valorCampo_(linha, mapa, ['Chave de origem']));
    if (!id && !chave) return null;
    return {
      linha: indice + 2,
      chave: chave || 'BASE|' + (indice + 2),
      idLegado: id,
      carimbo: fo_valorCampo_(linha, mapa, ['Carimbo de data/hora']),
      data: fo_valorCampo_(linha, mapa, ['Data do atendimento']),
      horario: fo_valorCampo_(linha, mapa, ['Horário do recebimento']),
      local: fo_valorCampo_(linha, mapa, ['Local']),
      canal: fo_valorCampo_(linha, mapa, ['Canal de recebimento']),
      urgencia: fo_valorCampo_(linha, mapa, ['Grau de urgência']),
      responsavel: fo_valorCampo_(linha, mapa, ['Responsável pelo registro']),
      assunto: fo_valorCampo_(linha, mapa, ['Assunto']),
      tipo: fo_valorCampo_(linha, mapa, ['Tipo de manifestação']),
      nome: fo_valorCampo_(linha, mapa, ['Nome do solicitante']),
      telefone: fo_valorCampo_(linha, mapa, ['Telefones', 'Telefone']),
      email: fo_valorCampo_(linha, mapa, ['E-mail', 'Email']),
      endereco: fo_valorCampo_(linha, mapa, ['Endereço do solicitante', 'Endereço']),
      solicitacao: fo_valorCampo_(linha, mapa, ['Solicitação']),
      tratativa: fo_valorCampo_(linha, mapa, ['Tratativa inicial']),
      fotos: fo_valorCampo_(linha, mapa, ['Imagens/arquivos', 'Imagens', 'Arquivos']),
      frente: fo_valorCampo_(linha, mapa, ['Área responsável', 'Segmento para encaminhamento']),
      comentario: fo_valorCampo_(linha, mapa, ['Comentário final']),
      descricao: fo_valorCampo_(linha, mapa, ['Descrição detalhada da ocorrência'])
    };
  }).filter(Boolean);
}

function fo_encontrarLinhaCabecalho_(dados, nomesObrigatorios) {
  const limite = Math.min(dados.length, 20);
  for (let i = 0; i < limite; i++) {
    const mapa = fo_mapaCabecalhos_(dados[i]);
    const atende = nomesObrigatorios.every(function(nome) {
      return mapa[fo_normalizar_(nome)] !== undefined;
    });
    if (atende) return i;
  }
  return -1;
}

function fo_lerDashboard_(aba) {
  const dados = aba.getDataRange().getValues();
  const cabecalho = fo_encontrarLinhaCabecalho_(dados, ['Status']);
  if (cabecalho < 0) return {};
  const mapa = fo_mapaCabecalhos_(dados[cabecalho]);
  return dados.slice(cabecalho + 1).reduce(function(saida, linha, indice) {
    const id = fo_texto_(fo_valorCampo_(linha, mapa, ['Protocolo', 'ID']));
    if (!id) return saida;
    saida[id] = {
      linha: cabecalho + indice + 2,
      status: fo_statusInterno_(fo_valorCampo_(linha, mapa, ['Status'])),
      procedencia: fo_valorCampo_(linha, mapa, ['Procedência']),
      responsavel: fo_valorCampo_(linha, mapa, [
        'Responsável atual', 'Responsável pela resolutiva'
      ]),
      observacao: fo_valorCampo_(linha, mapa, ['Observação / tratativa atual']),
      ultimaEdicao: fo_valorCampo_(linha, mapa, [
        'Última atualização', 'Última edição'
      ]),
      dataConclusao: fo_valorCampo_(linha, mapa, ['Data de conclusão']),
      bola: fo_valorCampo_(linha, mapa, ['Área responsável pela próxima ação']),
      proximaAcao: fo_valorCampo_(linha, mapa, ['Próxima ação']),
      urgencia: fo_valorCampo_(linha, mapa, ['Urgência'])
    };
    return saida;
  }, {});
}

function fo_lerHistorico_(aba) {
  const dados = aba.getDataRange().getValues();
  if (dados.length < 2) return {};
  const mapa = fo_mapaCabecalhos_(dados[0]);
  return dados.slice(1).reduce(function(saida, linha, indice) {
    const id = fo_texto_(fo_valorCampo_(linha, mapa, ['ID']));
    if (!id) return saida;
    if (!saida[id]) saida[id] = [];
    saida[id].push({
      linha: indice + 2,
      data: fo_valorCampo_(linha, mapa, ['Data e hora']),
      usuario: fo_valorCampo_(linha, mapa, ['Usuário']),
      status: fo_statusInterno_(fo_valorCampo_(linha, mapa, ['Status'])),
      procedencia: fo_valorCampo_(linha, mapa, ['Procedência']),
      responsavel: fo_valorCampo_(linha, mapa, ['Responsável pela resolutiva']),
      observacao: fo_valorCampo_(linha, mapa, ['Observação / tratativa']),
      origem: fo_valorCampo_(linha, mapa, ['Origem da atualização']),
      atendida: fo_valorCampo_(linha, mapa, ['Solicitação atendida?']),
      conclusaoConfirmada: fo_valorCampo_(linha, mapa, ['Conclusão confirmada?']),
      nota: fo_valorCampo_(linha, mapa, ['Nota final']),
      claras: fo_valorCampo_(linha, mapa, ['Informações claras?']),
      comentario: fo_valorCampo_(linha, mapa, ['Comentário final']),
      tipoEvento: fo_valorCampo_(linha, mapa, ['Tipo de evento']),
      area: fo_valorCampo_(linha, mapa, ['Área responsável pela próxima ação']),
      proximaAcao: fo_valorCampo_(linha, mapa, ['Próxima ação']),
      chaveEvento: fo_valorCampo_(linha, mapa, ['Chave do evento']),
      dataExecucao: fo_valorCampo_(linha, mapa, ['Data da execução']),
      executadoPor: fo_valorCampo_(linha, mapa, ['Executado por']),
      evidencias: fo_valorCampo_(linha, mapa, ['Evidências'])
    });
    return saida;
  }, {});
}

function fo_resumirAcompanhamentoSemResposta_(atualizacoes) {
  const eventos = (atualizacoes || []).slice().sort(function(a, b) {
    const da = fo_data_(a.data);
    const db = fo_data_(b.data);
    return (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
  });
  let indiceEnvio = -1;
  eventos.forEach(function(evento, indice) {
    const texto = fo_normalizar_([
      evento.observacao, evento.proximaAcao, evento.origem
    ].join(' '));
    if (/pesquisa.*satisfacao.*enviada/.test(texto) || (indiceEnvio < 0 && /aguardar.*resposta.*pesquisa/.test(texto) && !/tentativa.*contato.*sem resposta/.test(texto))) {
      indiceEnvio = indice;
    }
  });
  if (indiceEnvio < 0) {
    return {dataEnvioPesquisa: '', tentativas: 0, datas: []};
  }
  const datas = {};
  eventos.slice(indiceEnvio + 1).forEach(function(evento) {
    const texto = fo_normalizar_([
      evento.observacao, evento.origem, evento.chaveEvento
    ].join(' '));
    if (!/tentativa.*contato.*sem resposta/.test(texto) && !/^TAREFA_ATENDIMENTO\|REGISTRAR_TENTATIVA_SEM_RESPOSTA\|/.test(String(evento.chaveEvento || ''))) return;
    const data = fo_data_(evento.data);
    if (!data) return;
    const chaveData = Utilities.formatDate(
      data,
      Session.getScriptTimeZone(),
      'yyyy-MM-dd'
    );
    datas[chaveData] = true;
  });
  return {
    dataEnvioPesquisa: eventos[indiceEnvio].data,
    tentativas: Object.keys(datas).length,
    datas: Object.keys(datas).sort()
  };
}

function fo_lerControleManifestacoes_(aba) {
  const valores = aba.getDataRange().getValues();
  const cabecalho = fo_encontrarLinhaCabecalho_(valores, ['Data', 'Nome', 'Status']);
  if (cabecalho < 0) {
    throw new Error('O cabeçalho do Controle de Manifestações não foi localizado.');
  }
  const mapa = fo_mapaCabecalhos_(valores[cabecalho]);
  return valores.slice(cabecalho + 1).map(function(linha, indice) {
    const registro = {
      linha: cabecalho + indice + 2,
      data: fo_valorCampo_(linha, mapa, ['Data']),
      nome: fo_valorCampo_(linha, mapa, ['Nome']),
      endereco: fo_valorCampo_(linha, mapa, ['Endereço']),
      canal: fo_valorCampo_(linha, mapa, ['Canal']),
      tipo: fo_valorCampo_(linha, mapa, ['Tipo de Manifestação', 'Tipo']),
      frente: fo_valorCampo_(linha, mapa, ['Frente de obra']),
      historico: fo_valorCampo_(linha, mapa, ['Histórico']),
      providencia: fo_valorCampo_(linha, mapa, ['Providência']),
      status: fo_valorCampo_(linha, mapa, ['Status']),
      observacao: fo_valorCampo_(linha, mapa, ['Obs.', 'Obs', 'Observação'])
    };
    const temDado = [registro.data, registro.nome, registro.endereco, registro.historico]
      .some(function(valor) { return Boolean(fo_texto_(valor)); });
    return temDado ? registro : null;
  }).filter(Boolean);
}

function fo_consolidarRegistros_(fontes, existentes) {
  const chaves = {};
  const registros = fontes.central.map(function(caso) {
    const chave = fo_texto_(caso.idLegado || caso.chave);
    if (!chave || chaves[chave]) return null;
    chaves[chave] = true;
    return fo_montarRegistroOficial_(null, {
      caso: caso,
      situacao: 'Vinculado automaticamente',
      pontuacao: 0,
      ambiguo: false
    }, fontes, existentes);
  }).filter(Boolean);
  const centralManual = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
  if (typeof hec_registrosOficiais_ !== 'function') {
    throw new Error('Adicione também o arquivo Painel de Trabalho Atendimento.gs antes de sincronizar.');
  }
  const manuais = hec_registrosOficiais_(centralManual, existentes);
  Array.prototype.push.apply(registros, manuais);
  return registros.sort(function(a, b) {
    const da = fo_data_(a.dataAbertura);
    const db = fo_data_(b.dataAbertura);
    return (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
  });
}

function fo_localizarCasoCentral_(controle, casos, usadas) {
  const candidatos = casos.filter(function(caso) { return !usadas[caso.chave]; })
    .map(function(caso) {
      let pontos = 0;
      const nomeA = fo_normalizar_(controle.nome);
      const nomeB = fo_normalizar_(caso.nome);
      const endA = fo_normalizar_(controle.endereco);
      const endB = fo_normalizar_(caso.endereco || caso.local);
      if (nomeA && nomeB && nomeA === nomeB) pontos += 5;
      else if (nomeA && nomeB && (nomeA.indexOf(nomeB) >= 0 || nomeB.indexOf(nomeA) >= 0)) pontos += 3;
      if (endA && endB && endA === endB) pontos += 5;
      else if (endA && endB && (endA.indexOf(endB) >= 0 || endB.indexOf(endA) >= 0)) pontos += 3;
      const dataA = fo_data_(controle.data);
      const dataB = fo_data_(caso.data);
      if (dataA && dataB && fo_formatarData_(dataA) === fo_formatarData_(dataB)) pontos += 3;
      return {caso: caso, pontos: pontos};
    }).sort(function(a, b) { return b.pontos - a.pontos; });

  if (!candidatos.length || candidatos[0].pontos < 6) {
    return {caso: null, situacao: 'Somente no Controle', pontuacao: 0, ambiguo: false};
  }
  const ambiguo = Boolean(candidatos[1] && candidatos[1].pontos === candidatos[0].pontos);
  if (ambiguo) {
    return {caso: null, situacao: 'Vínculo ambíguo', pontuacao: candidatos[0].pontos, ambiguo: true};
  }
  return {
    caso: candidatos[0].caso,
    situacao: 'Vinculado automaticamente',
    pontuacao: candidatos[0].pontos,
    ambiguo: false
  };
}

function fo_montarRegistroOficial_(controle, vinculo, fontes, existentes) {
  const caso = vinculo.caso || {};
  const dashboard = fontes.dashboard[fo_texto_(caso.idLegado)] || {};
  const historico = (fontes.historico[fo_texto_(caso.idLegado)] || []).slice();
  af_vinculos_().filter(v=>af_resolver_(v.principal,true)===caso.idLegado).forEach(v=>{
    (fontes.historico[v.idOrigem]||[]).filter(e=>fo_normalizar_(e.tipoEvento)==='execucao').forEach(e=>{if(!historico.some(x=>x.chaveEvento&&x.chaveEvento===e.chaveEvento))historico.push(Object.assign({},e,{observacao:'['+v.origem+'] '+(e.observacao||'')}));});
  });
  const atualizacoes = historico.slice().sort(function(a, b) {
    const da = fo_data_(a.data);
    const db = fo_data_(b.data);
    return (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
  });
  const correcoesFicha = fo_extrairCorrecoesFicha_(atualizacoes);
  const concluidas = atualizacoes.filter(function(item) {
    const tipo = fo_normalizar_(item.tipoEvento);
    const origem = fo_normalizar_(item.origem);
    return item.status === 'Concluída' &&
      tipo !== 'correcao da ficha' && tipo !== 'ciencia administrativa' &&
      tipo !== 'comunicacao entre areas' && tipo !== 'checklist compartilhado' &&
      origem !== 'comunicacao entre atendimento e execucao';
  });
  const ultimaConclusao = fo_ultimaData_(concluidas.map(function(item) {
    // Neste evento, Data da execução recebe a data de devolutiva informada pelo Atendimento.
    return fo_normalizar_(item.origem) === 'encerramento pelo atendimento' && fo_data_(item.dataExecucao)
      ? item.dataExecucao : item.data;
  }));
  const ultimaFinalizacaoRegistrada = concluidas[concluidas.length - 1];
  const conclusaoComDataInformada = ultimaFinalizacaoRegistrada &&
    fo_normalizar_(ultimaFinalizacaoRegistrada.origem) === 'encerramento pelo atendimento' &&
    fo_data_(ultimaFinalizacaoRegistrada.dataExecucao) ? ultimaFinalizacaoRegistrada : null;
  const dataAbertura = fo_primeiroValor_([controle && controle.data, caso.data, caso.carimbo]);
  const status = fo_statusInterno_(
    dashboard.status || (controle && controle.status) || caso.status
  );
  const dataConclusao = fo_primeiroValor_([
    correcoesFicha[fo_normalizar_('Data de conclusão')],
    conclusaoComDataInformada && conclusaoComDataInformada.dataExecucao,
    dashboard.dataConclusao,
    ultimaConclusao
  ]);
  const encerradoLegado = status === 'Concluída' && !fo_data_(dataConclusao) &&
    (!fo_data_(dataAbertura) || fo_data_(dataAbertura) < FO_CONFIG.DATA_INICIO_AUTOMACAO);
  const pendenciaFinalizacao = fontes.finalizacoesPendentes[
    fo_chaveInstante_(caso.carimbo)
  ] || null;
  const acompanhamentoSemResposta = fo_resumirAcompanhamentoSemResposta_(
    atualizacoes
  );
  const encerramentoAutomaticoSemResposta = atualizacoes.some(function(item) {
    return /encerramento administrativo.*ausencia de resposta/.test(
      fo_normalizar_(item.origem)
    );
  });

  const chaveBase = controle
    ? 'CTRL|' + fo_hash_([
      fo_formatarData_(controle.data), fo_normalizar_(controle.nome),
      fo_normalizar_(controle.endereco), fo_normalizar_(controle.historico)
    ].join('|')).slice(0, 20) + '|L' + controle.linha
    : 'PROC|' + fo_hash_(caso.chave || caso.idLegado).slice(0, 20);
  const assinaturaControle = controle ? fo_hash_([
    fo_formatarData_(controle.data), controle.nome, controle.endereco,
    controle.historico, controle.status
  ].join('|')) : '';
  const anterior = existentes.porChave[chaveBase] ||
    (assinaturaControle ? existentes.porAssinatura[assinaturaControle] : null) ||
    (caso.idLegado ? existentes.porIdLegado[caso.idLegado] : null) || {};

  const procedenciaHistorico = atualizacoes.slice().reverse().map(function(item) {
    return item.procedencia;
  }).filter(function(valor) {
    const normal = fo_normalizar_(valor);
    return normal && normal !== 'em analise' && normal !== 'nao informada';
  })[0] || '';
  const procedencia = fo_primeiroValor_([
    correcoesFicha[fo_normalizar_('Procedência')],
    procedenciaHistorico,
    dashboard.procedencia,
    anterior.procedencia,
    'Em análise'
  ]);

  const solucoesHistorico = atualizacoes.filter(function(item) {
    const origem = fo_normalizar_(item.origem);
    return fo_texto_(item.observacao) &&
      (fo_normalizar_(item.tipoEvento) === 'execucao' ||
        origem === 'encerramento pelo atendimento');
  }).map(function(item) { return item.observacao; });
  const finaisHistorico = concluidas.filter(function(item) {
    const origem = fo_normalizar_(item.origem);
    const tipo = fo_normalizar_(item.tipoEvento);
    return !/^correcao da ficha final:|^tarefa do atendimento|^ciencia administrativa/.test(origem) &&
      origem !== 'comunicacao entre atendimento e execucao' &&
      tipo !== 'correcao da ficha' && tipo !== 'comunicacao entre areas' &&
      tipo !== 'checklist compartilhado';
  }).reduce(function(lista, item) {
    const origem = fo_normalizar_(item.origem);
    if (origem === 'encerramento pelo atendimento' ||
        origem === 'encerramento imediato pelo formulario') {
      lista.push(item.comentario);
    } else {
      lista.push(item.observacao, item.comentario);
    }
    return lista;
  }, []);
  const solicitacao = fo_primeiroValor_([
    caso.solicitacao,
    controle && controle.historico
  ]);
  let descricaoReclamacao = fo_primeiroValor_([
    caso.descricao
  ]);
  if (
    fo_normalizar_(descricaoReclamacao) === fo_normalizar_(solicitacao)
  ) {
    descricaoReclamacao = '';
  }
  const providenciaExecutadaCorrigida = correcoesFicha[
    fo_normalizar_('Providências executadas')
  ];
  const solucao = fo_juntarTextosUnicos_([
    controle && controle.providencia,
    caso.tratativa,
    providenciaExecutadaCorrigida || fo_juntarTextosUnicos_(solucoesHistorico)
  ]);
  const finalizacaoCorrigida = correcoesFicha[
    fo_normalizar_('Conclusão ou devolutiva final')
  ];
  const finalizacao = finalizacaoCorrigida || fo_juntarTextosUnicos_([
    controle && controle.observacao,
    caso.comentario
  ].concat(finaisHistorico));

  let areaProxima = dashboard.bola || anterior.areaProxima || '';
  let proximaAcao = dashboard.proximaAcao || anterior.proximaAcao || '';
  if (status === 'Concluída') {
    areaProxima = 'Atendimento concluído';
    proximaAcao = 'Nenhuma pendência';
  } else if (fo_ehNaoProcedenteOuPossivel_(procedencia)) {
    areaProxima = 'Atendimento';
    proximaAcao = 'Registrar a devolutiva ao cliente e encerrar o atendimento';
  }

  const origemCaso = /^EXEC_ABERTURA\|/i.test(fo_texto_(caso.chave))
    ? 'Execução de Atendimentos' : 'Procedimentos de Campo';
  const registro = {
    chave: anterior.chave || chaveBase,
    protocolo: anterior.protocolo || '',
    origem: controle && caso.chave ? 'Controle + ' + origemCaso :
      (controle ? 'Controle de Manifestações' : origemCaso),
    linhaControle: controle ? controle.linha : '',
    idLegado: caso.idLegado || anterior.idLegado || '',
    dataAbertura: dataAbertura,
    horario: caso.horario || '',
    localAtendimento: caso.local || anterior.localAtendimento || '',
    canalRecebimento: caso.canal || (controle && controle.canal) ||
      anterior.canalRecebimento || '',
    urgencia: caso.urgencia || anterior.urgencia || '',
    areaProxima: areaProxima,
    proximaAcao: proximaAcao,
    ultimaAtualizacao: dashboard.ultimaEdicao || anterior.ultimaAtualizacao || '',
    dataEnvioPesquisa: acompanhamentoSemResposta.dataEnvioPesquisa || '',
    tentativasSemResposta: acompanhamentoSemResposta.tentativas,
    datasTentativasSemResposta: acompanhamentoSemResposta.datas,
    responsavel: caso.responsavel || '',
    assunto: caso.assunto || (controle && controle.tipo) || '',
    tipo: (controle && controle.tipo) || caso.tipo || '',
    nome: (controle && controle.nome) || caso.nome || '',
    telefone: caso.telefone || '',
    email: caso.email || '',
    endereco: (controle && controle.endereco) || caso.endereco || '',
    frente: (controle && controle.frente) || caso.frente || '',
    solicitacao: solicitacao,
    descricaoReclamacao: descricaoReclamacao,
    solucao: fo_textoNarrativoLimpo_(solucao),
    finalizacao: fo_textoNarrativoLimpo_(finalizacao),
    status: status,
    dataConclusao: dataConclusao,
    fotosAbertura: caso.fotos || '',
    fotosSolucao: fo_valorCorrecaoOuPadrao_(
      correcoesFicha,
      'Fotos da execução',
      fo_juntarTextosUnicos_([
        anterior.fotosSolucao
      ].concat(atualizacoes.filter(function(item) {
        return fo_normalizar_(item.tipoEvento) === 'execucao';
      }).map(function(item) { return item.evidencias; })))
    ),
    documentoId: anterior.documentoId || '',
    pdfId: anterior.pdfId || '',
    hashOficial: anterior.hashOficial || '',
    ultimaGeracao: anterior.ultimaGeracao || '',
    situacaoVinculo: vinculo.situacao,
    camposFaltantes: '',
    encerradoLegado: encerradoLegado ? 'SIM' : '',
    assinaturaControle: assinaturaControle,
    carimboFonte: fo_ultimaData_([caso.carimbo, dashboard.ultimaEdicao].concat(
      atualizacoes.map(function(item) { return item.data; })
    )) || '',
    historicoEntregue: '',
    revisaoObrigatoria: '',
    motivoRevisao: '',
    procedencia: procedencia
  };
  registro.encerramentoAutomaticoSemResposta = encerramentoAutomaticoSemResposta
    ? 'SIM'
    : '';
  registro.historicoEntregue = fo_foiEntregueNoHistorico_(registro) ? 'SIM' : '';
  if (!registro.historicoEntregue && pendenciaFinalizacao) {
    registro.revisaoObrigatoria = 'SIM';
    registro.motivoRevisao =
      'Há uma finalização sem protocolo no mesmo envio. Confira antes de gerar a ficha definitiva.';
  } else if (!registro.historicoEntregue && registro.status === 'Concluída' &&
      !fo_data_(registro.dataConclusao)) {
    registro.revisaoObrigatoria = 'SIM';
    registro.motivoRevisao =
      'O atendimento aparece como concluído, mas não possui data de conclusão confirmada.';
  }
  registro.camposFaltantes = fo_camposFaltantes_(registro).join(', ');
  return registro;
}

function fo_extrairCorrecoesFicha_(atualizacoes) {
  const correcoes = {};
  (atualizacoes || []).forEach(function(evento) {
    const origem = fo_texto_(evento.origem);
    const encontrado = origem.match(/^Correção da Ficha Final:\s*(.+)$/i);
    if (!encontrado) return;
    const campo = fo_normalizar_(encontrado[1]);
    if (!campo) return;
    correcoes[campo] = evento.comentario;
  });
  return correcoes;
}

function fo_valorCorrecaoOuPadrao_(correcoes, campo, padrao) {
  const chave = fo_normalizar_(campo);
  if (!Object.prototype.hasOwnProperty.call(correcoes || {}, chave)) return padrao;
  const valor = correcoes[chave];
  return fo_texto_(valor) === FO_MARCADOR_REMOCAO ? '' : valor;
}

function fo_foiEntregueNoHistorico_(registro) {
  if (registro.status !== 'Concluída') return false;
  const ingressoNovoSistema = fo_data_(registro.carimboFonte);
  if (
    ingressoNovoSistema &&
    ingressoNovoSistema >= FO_CONFIG.DATA_INICIO_AUTOMACAO
  ) return false;
  const corte = FO_CONFIG.DATA_CORTE_HISTORICO_ENTREGUE;
  const conclusao = fo_data_(registro.dataConclusao);
  if (conclusao) return conclusao <= corte;
  const abertura = fo_data_(registro.dataAbertura);
  return Boolean(abertura && abertura <= corte);
}

function fo_ehNaoProcedenteOuPossivel_(valor) {
  const texto = fo_normalizar_(valor);
  return /nao procedente/.test(texto) ||
    /possivel.*nao procedente/.test(texto) ||
    /possivelmente.*nao procedente/.test(texto);
}

function fo_deveGerarFichaOficial_(registro) {
  return fo_texto_(registro.historicoEntregue) !== 'SIM' &&
    fo_texto_(registro.revisaoObrigatoria) !== 'SIM' &&
    Boolean(fo_texto_(registro.protocolo));
}

function fo_camposFaltantes_(registro) {
  if (fo_texto_(registro.historicoEntregue) === 'SIM') return [];
  const campos = [];
  if (fo_texto_(registro.revisaoObrigatoria) === 'SIM') {
    campos.push('Conferir finalização');
  }
  if (!fo_dataRelatorioValida_(registro.dataAbertura)) campos.push('Data inválida ou ausente');
  if (!fo_texto_(registro.responsavel)) campos.push('Responsável');
  if (!fo_texto_(registro.localAtendimento)) campos.push('Local do atendimento');
  if (!fo_texto_(registro.nome)) campos.push('Nome');
  if (!fo_texto_(registro.endereco)) campos.push('Endereço');
  if (!fo_texto_(registro.solicitacao)) campos.push('Solicitação');
  if (registro.status === 'Concluída' && !fo_texto_(registro.solucao)) {
    campos.push('Providências');
  }
  if (registro.status === 'Concluída' && !fo_texto_(registro.finalizacao)) {
    campos.push('Conclusão');
  }
  return campos;
}

function fo_lerBaseOficialExistente_(central) {
  const aba = central.getSheetByName(FO_CONFIG.ABA_BASE_OFICIAL);
  const saida = {porChave: {}, porAssinatura: {}, porIdLegado: {}, registros: []};
  if (!aba || aba.getLastRow() < 2) return saida;
  const dados = aba.getRange(1, 1, aba.getLastRow(), FO_CABECALHOS_BASE.length).getValues();
  const mapa = fo_mapaCabecalhos_(dados[0]);
  dados.slice(1).forEach(function(linha) {
    const registro = fo_linhaParaRegistro_(linha, mapa);
    if (!registro.chave) return;
    saida.registros.push(registro);
    saida.porChave[registro.chave] = registro;
    if (registro.assinaturaControle) saida.porAssinatura[registro.assinaturaControle] = registro;
    if (registro.idLegado) saida.porIdLegado[registro.idLegado] = registro;
  });
  return saida;
}

function fo_linhaParaRegistro_(linha, mapa) {
  function v(nome) { return fo_valorCampo_(linha, mapa, [nome]); }
  return {
    chave: fo_texto_(v('Chave do registro')),
    protocolo: fo_texto_(v('Protocolo')),
    idLegado: fo_texto_(v('ID legado')),
    localAtendimento: v('Local do atendimento'),
    canalRecebimento: v('Canal de recebimento'),
    urgencia: v('Grau de urgência'),
    areaProxima: v('Área responsável pela próxima ação'),
    proximaAcao: v('Próxima ação'),
    ultimaAtualizacao: v('Última atualização operacional'),
    fotosSolucao: v('Fotos da solução'),
    documentoId: fo_texto_(v('ID do documento')),
    pdfId: fo_texto_(v('ID do PDF atual')),
    hashOficial: fo_texto_(v('Hash oficial')),
    ultimaGeracao: v('Última geração'),
    assinaturaControle: fo_texto_(v('Assinatura do Controle')),
    historicoEntregue: fo_texto_(v('Histórico já entregue')),
    revisaoObrigatoria: fo_texto_(v('Revisão obrigatória')),
    motivoRevisao: fo_texto_(v('Motivo da revisão')),
    descricaoReclamacao: v('Descrição detalhada da reclamação'),
    procedencia: v('Procedência')
  };
}

function fo_atribuirProtocolos_(registros, existentes) {
  const atribuidos = {};
  const donosExatos = {};
  registros.forEach(function(registro) {
    // Arquivos históricos têm identificação própria; a sequência ATD não é consumida.
    if (/^HIST\d{4}-[A-F0-9]{12}$/.test(registro.chave)) {
      registro.protocolo = registro.chave;
      return;
    }
    if (fo_texto_(registro.historicoEntregue) === 'SIM') return;
    const protocoloAtual = fo_texto_(registro.protocolo)
      .toUpperCase().replace(/[^A-Z0-9]/g, '');
    const idLegadoExato = fo_texto_(registro.idLegado)
      .toUpperCase().replace(/[^A-Z0-9]/g, '');
    const protocolo = /^ATD\d{8}$/.test(protocoloAtual)
      ? protocoloAtual
      : (/^ATD\d{8}$/.test(idLegadoExato) ? idLegadoExato : '');
    if (/^ATD\d{8}$/.test(protocolo) && !donosExatos[protocolo]) {
      donosExatos[protocolo] = registro.chave;
      atribuidos[protocolo] = true;
    }
  });
  registros.forEach(function(registro) {
    // Arquivos históricos têm identificação própria; a sequência ATD não é consumida.
    if (/^HIST\d{4}-[A-F0-9]{12}$/.test(registro.chave)) {
      registro.protocolo = registro.chave;
      return;
    }
    if (fo_texto_(registro.historicoEntregue) === 'SIM') {
      registro.protocolo = '';
      return;
    }
    const protocoloAtual = fo_texto_(registro.protocolo)
      .toUpperCase().replace(/[^A-Z0-9]/g, '');
    const idLegadoExato = fo_texto_(registro.idLegado)
      .toUpperCase().replace(/[^A-Z0-9]/g, '');
    const candidatoExato = /^ATD\d{8}$/.test(protocoloAtual)
      ? protocoloAtual
      : (/^ATD\d{8}$/.test(idLegadoExato) ? idLegadoExato : '');
    if (candidatoExato && donosExatos[candidatoExato] === registro.chave) {
      registro.protocolo = candidatoExato;
      return;
    }
    registro.protocolo = '';
    const legado = fo_texto_(registro.idLegado).match(/^ATD-?(\d{1,4})$/i);
    const ano = (fo_data_(registro.dataAbertura) || new Date()).getFullYear();
    if (legado) {
      const convertido = 'ATD' + ano + String(Number(legado[1])).padStart(4, '0');
      if (!atribuidos[convertido]) {
        registro.protocolo = convertido;
        atribuidos[convertido] = true;
        return;
      }
    }
    let numero = 1;
    let protocolo = '';
    do {
      protocolo = 'ATD' + ano + String(numero).padStart(4, '0');
      numero++;
    } while (atribuidos[protocolo]);
    registro.protocolo = protocolo;
    atribuidos[protocolo] = true;
  });
}

function fo_registroParaLinha_(registro) {
  return [
    registro.chave, registro.protocolo, registro.origem, registro.linhaControle,
    registro.idLegado, registro.dataAbertura, registro.horario,
    registro.localAtendimento, registro.responsavel, registro.assunto,
    registro.tipo, registro.nome, registro.telefone, registro.email,
    registro.endereco, registro.frente, registro.solicitacao, registro.solucao,
    registro.finalizacao, registro.status, registro.dataConclusao,
    registro.fotosAbertura, registro.fotosSolucao, registro.documentoId,
    registro.pdfId, registro.hashOficial, registro.ultimaGeracao,
    registro.situacaoVinculo, registro.camposFaltantes, registro.encerradoLegado,
    registro.assinaturaControle, registro.carimboFonte,
    registro.historicoEntregue, registro.revisaoObrigatoria,
    registro.motivoRevisao, registro.canalRecebimento, registro.urgencia,
    registro.areaProxima, registro.proximaAcao, registro.ultimaAtualizacao,
    registro.descricaoReclamacao, registro.procedencia
  ];
}

function fo_escreverBaseOficial_(central, registros) {
  const aba = central.getSheetByName(FO_CONFIG.ABA_BASE_OFICIAL);
  fo_prepararBaseOficial_(aba);
  const ultima = Math.max(aba.getLastRow(), 2);
  if (ultima > 1) {
    aba.getRange(2, 1, ultima - 1, FO_CABECALHOS_BASE.length).clearContent();
  }
  if (!registros.length) return;
  fo_garantirDimensoes_(aba, registros.length + 5, FO_CABECALHOS_BASE.length);
  aba.getRange(2, 1, registros.length, FO_CABECALHOS_BASE.length)
    .setValues(registros.map(fo_registroParaLinha_));
  aba.getRange(2, 6, registros.length, 1).setNumberFormat('dd/MM/yyyy');
  aba.getRange(2, 7, registros.length, 1).setNumberFormat('HH:mm');
  aba.getRange(2, 21, registros.length, 1).setNumberFormat('dd/MM/yyyy');
  aba.getRange(2, 27, registros.length, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  aba.getRange(2, 32, registros.length, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
}

function fo_escreverIndice_(central, registros) {
  const aba = central.getSheetByName(FO_CONFIG.ABA_INDICE);
  fo_prepararIndice_(aba);
  registros = registros.filter(function(registro) {
    return fo_texto_(registro.historicoEntregue) !== 'SIM';
  });
  const inicio = FO_CONFIG.PRIMEIRA_LINHA_INDICE;
  const linhasCorpo = Math.max(0, aba.getMaxRows() - inicio + 1);
  if (linhasCorpo) {
    aba.getRange(inicio, 1, linhasCorpo, FO_CABECALHOS_INDICE.length)
      .clearContent().clearFormat().clearDataValidations();
    aba.setRowHeights(inicio, linhasCorpo, 21);
  }
  if (!registros.length) return;
  fo_garantirDimensoes_(aba, inicio + registros.length + 5, FO_CABECALHOS_INDICE.length);
  const linhas = registros.map(function(registro) {
    const situacao = registro.revisaoObrigatoria === 'SIM' ? 'Conferência necessária' :
      (registro.documentoId && registro.pdfId ? 'PDF disponível' :
        (registro.camposFaltantes ? 'Revisar dados' : 'Aguardando geração'));
    return [
      registro.protocolo, registro.dataAbertura, registro.nome, registro.endereco,
      registro.tipo, registro.status, situacao, '', '', registro.ultimaGeracao
    ];
  });
  aba.getRange(inicio, 1, linhas.length, FO_CABECALHOS_INDICE.length).setValues(linhas);
  registros.forEach(function(registro, indice) {
    const linha = inicio + indice;
    if (registro.documentoId) {
      aba.getRange(linha, 8).setRichTextValue(fo_linkDrive_(registro.documentoId, 'Abrir ficha'));
    }
    if (registro.pdfId) {
      aba.getRange(linha, 9).setRichTextValue(fo_linkDrive_(registro.pdfId, 'Baixar PDF'));
    }
  });
  aba.getRange(inicio, 2, linhas.length, 1).setNumberFormat('dd/MM/yyyy');
  aba.getRange(inicio, 10, linhas.length, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  aba.getRange(inicio, 1, linhas.length, FO_CABECALHOS_INDICE.length)
    .setFontFamily('Arial').setFontSize(10).setVerticalAlignment('middle').setWrap(true);
  aba.getBandings().forEach(function(faixa) { faixa.remove(); });
  aba.getRange(inicio, 1, linhas.length, FO_CABECALHOS_INDICE.length)
    .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
  aba.setRowHeights(inicio, linhas.length, 46);
  aba.getRange(inicio, 6, linhas.length, 1).setHorizontalAlignment('center').setFontWeight('bold');
  registros.forEach(function(registro, indice) {
    const celula = aba.getRange(inicio + indice, 6);
    if (registro.revisaoObrigatoria === 'SIM') {
      celula.setBackground(FO_CONFIG.CORES.VERMELHO_CLARO)
        .setFontColor(FO_CONFIG.CORES.VERMELHO);
    } else if (registro.status === 'Concluída') {
      celula.setBackground(FO_CONFIG.CORES.VERDE_CLARO).setFontColor(FO_CONFIG.CORES.VERDE);
    } else {
      celula.setBackground(FO_CONFIG.CORES.LARANJA_CLARO).setFontColor('#A3600B');
    }
  });
}

function fo_escreverRevisao_(central, registros) {
  const revisar = registros.filter(function(registro) {
    if (fo_texto_(registro.historicoEntregue) === 'SIM') return false;
    return registro.camposFaltantes || registro.encerradoLegado ||
      registro.revisaoObrigatoria === 'SIM' ||
      registro.situacaoVinculo !== 'Vinculado automaticamente';
  });
  /*
   * Página legada. Os mesmos sinais já constam na Base Fichas Oficiais,
   * na coluna de situação de Fichas Oficiais e no Painel de Trabalho.
   * Se a página antiga já foi removida, ela não deve ser recriada.
   */
  const aba = central.getSheetByName(FO_CONFIG.ABA_REVISAO);
  if (!aba) return;
  fo_prepararRevisao_(aba);
  const linhasAnteriores = Math.max(3, aba.getLastRow() - 1);
  aba.getRange(2, 1, linhasAnteriores, FO_CABECALHOS_REVISAO.length)
    .breakApart().clearContent();
  if (!revisar.length) {
    aba.getRange('A2:K4').breakApart().merge()
      .setValue('Tudo conferido. Nenhuma pendência de migração foi encontrada.')
      .setBackground(FO_CONFIG.CORES.VERDE_CLARO)
      .setFontColor(FO_CONFIG.CORES.VERDE).setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    return;
  }
  fo_garantirDimensoes_(aba, revisar.length + 5, FO_CABECALHOS_REVISAO.length);
  const linhas = revisar.map(function(registro) {
    const observacoes = [];
    if (registro.encerradoLegado) {
      observacoes.push('Encerrado antigo sem data de conclusão. Excluído dos pacotes mensais até conferência.');
    }
    if (registro.situacaoVinculo === 'Vínculo ambíguo') {
      observacoes.push('Há mais de um possível atendimento correspondente.');
    }
    if (registro.situacaoVinculo === 'Somente no Controle') {
      observacoes.push('Dados de telefone, e-mail, responsável e fotos podem não estar disponíveis.');
    }
    if (registro.revisaoObrigatoria === 'SIM') {
      observacoes.push(registro.motivoRevisao || 'Conferência obrigatória antes da geração.');
    }
    return [
      registro.protocolo, registro.origem, registro.linhaControle,
      registro.idLegado, registro.dataAbertura, registro.nome, registro.endereco,
      registro.status, registro.situacaoVinculo, registro.camposFaltantes,
      observacoes.join(' ')
    ];
  });
  aba.getRange(2, 1, linhas.length, FO_CABECALHOS_REVISAO.length).setValues(linhas);
  aba.getRange(2, 5, linhas.length, 1).setNumberFormat('dd/MM/yyyy');
  aba.getRange(2, 1, linhas.length, FO_CABECALHOS_REVISAO.length)
    .setFontFamily('Arial').setFontSize(10).setWrap(true).setVerticalAlignment('top');
  aba.setRowHeights(2, linhas.length, 58);
}

function fo_escreverAvisosProtocolo_(central, registros) {
  const aba = central.getSheetByName(FO_CONFIG.ABA_AVISOS_PROTOCOLO);
  fo_prepararAvisosProtocolo_(aba);
  const existentes = fo_lerEstadoDemandasAtendimento_(aba);
  const tarefas = fo_montarDemandasAtendimento_(registros, existentes);
  fo_reconciliarChecklist_(central, tarefas, existentes);
  const linhasCorpo = Math.max(0, aba.getMaxRows() - 4);
  if (linhasCorpo) {
    aba.getRange(5, 1, linhasCorpo, FO_CABECALHOS_AVISOS.length)
      .breakApart().clearContent().clearFormat().clearDataValidations();
    aba.setRowHeights(5, linhasCorpo, 21);
  }

  if (!tarefas.length) {
    aba.getRange('A5:P7').breakApart().merge()
      .setValue('Nenhuma ação do Atendimento está pendente neste momento.')
      .setBackground(FO_CONFIG.CORES.VERDE_CLARO)
      .setFontColor(FO_CONFIG.CORES.VERDE).setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    return;
  }

  fo_garantirDimensoes_(aba, tarefas.length + 8, FO_CABECALHOS_AVISOS.length);
  const linhas = tarefas.map(function(tarefa) {
    const anterior = existentes[tarefa.chave] || {};
    tarefa.realizada = anterior.realizada === true;
    tarefa.dataRealizacao = anterior.dataRealizacao || '';
    tarefa.observacao = anterior.observacao || '';
    return [
      tarefa.registro.protocolo,
      tarefa.prioridade,
      tarefa.tipo,
      tarefa.prazo,
      tarefa.registro.dataAbertura,
      tarefa.registro.nome,
      tarefa.registro.telefone,
      tarefa.registro.endereco,
      fo_resumirTextoTarefa_(tarefa.registro.solicitacao, 230),
      tarefa.acao,
      tarefa.mensagem,
      tarefa.mensagem && fo_texto_(tarefa.registro.telefone)
        ? 'Abrir conversa'
        : 'Não se aplica',
      tarefa.realizada,
      tarefa.dataRealizacao,
      tarefa.observacao,
      tarefa.proximaEtapa,
      tarefa.chave,
      tarefa.registro.areaProxima,
      tarefa.registro.status
    ];
  });

  aba.getRange(5, 13, linhas.length, 1).insertCheckboxes();
  aba.getRange(5, 1, linhas.length, FO_CABECALHOS_AVISOS.length).setValues(linhas);
  aba.getRange(5, 4, linhas.length, 2).setNumberFormat('dd/MM/yyyy');
  aba.getRange(5, 14, linhas.length, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  aba.getRange(5, 1, linhas.length, FO_CABECALHOS_AVISOS.length)
    .setFontFamily('Arial').setFontSize(9).setWrap(true)
    .setVerticalAlignment('middle')
    .setBorder(false, false, true, false, true, true, FO_CONFIG.CORES.BORDA,
      SpreadsheetApp.BorderStyle.SOLID);
  aba.setRowHeights(5, linhas.length, 74);
  tarefas.forEach(function(tarefa, indice) {
    const linha = 5 + indice;
    const url = fo_urlWhatsApp_(tarefa.registro.telefone, tarefa.mensagem);
    if (url) {
      aba.getRange(linha, 12).setRichTextValue(
        SpreadsheetApp.newRichTextValue()
          .setText('Abrir conversa')
          .setLinkUrl(url)
          .build()
      ).setFontColor(FO_CONFIG.CORES.AZUL).setFontWeight('bold');
    }
    fo_formatarLinhaDemandaAtendimento_(aba, linha, tarefa);
  });
  aba.getBandings().forEach(function(banda) { banda.remove(); });
  aba.getRange(4, 1, linhas.length + 1, 16).createFilter();
  try { aba.hideColumns(17, 3); } catch (erro) {}
}

function atualizarEncerramentosPeloAtendimento() {
  return sincronizarBaseFichasOficiais();
}

/** Abre a única página usada para encerramentos manuais pelo Atendimento. */
function abrirEncerramentoPeloAtendimento(){painelAbrirEncerramento();}

/** Mostra a página de correções somente quando ela for necessária. */
function abrirCorrecoesFichaFinalAtendimento(){painelAbrirCorrecao();}

function fo_escreverEncerramentosAtendimento_(central, registros) {
  const aba = central.getSheetByName(FO_CONFIG.ABA_ENCERRAMENTO_ATENDIMENTO);
  if (!aba) return; // O encerramento atual é preenchido na janela.
  fo_prepararEncerramentoAtendimento_(aba);
  const existentes = fo_lerEstadoEncerramentosAtendimento_(aba);
  const candidatos = registros.filter(function(registro) {
    return fo_texto_(registro.historicoEntregue) !== 'SIM' &&
      fo_statusInterno_(registro.status) !== 'Concluída' &&
      Boolean(fo_texto_(registro.protocolo)) &&
      fo_deveEncerrarPeloAtendimento_(registro);
  }).sort(function(a, b) {
    const prioridadeA = fo_numeroPrioridadeTarefa_(
      fo_prioridadeTarefa_(a.urgencia, 'Encerramento pelo Atendimento')
    );
    const prioridadeB = fo_numeroPrioridadeTarefa_(
      fo_prioridadeTarefa_(b.urgencia, 'Encerramento pelo Atendimento')
    );
    if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB;
    const dataA = fo_data_(a.dataAbertura);
    const dataB = fo_data_(b.dataAbertura);
    return (dataA ? dataA.getTime() : 0) - (dataB ? dataB.getTime() : 0);
  });
  const linhasCorpo = Math.max(0, aba.getMaxRows() - 4);
  if (linhasCorpo) {
    aba.getRange(5, 1, linhasCorpo, FO_CABECALHOS_ENCERRAMENTO.length)
      .breakApart().clearContent().clearFormat().clearDataValidations();
    aba.setRowHeights(5, linhasCorpo, 21);
  }
  if (!candidatos.length) {
    aba.getRange('A5:Q7').breakApart().merge()
      .setValue('Nenhum atendimento aguarda encerramento direto neste momento.')
      .setBackground(FO_CONFIG.CORES.VERDE_CLARO)
      .setFontColor(FO_CONFIG.CORES.VERDE).setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    return;
  }
  fo_garantirDimensoes_(
    aba,
    candidatos.length + 8,
    FO_CABECALHOS_ENCERRAMENTO.length
  );
  const linhas = candidatos.map(function(registro) {
    const chave = 'ENCERRAMENTO|' + registro.protocolo;
    const anterior = existentes[chave] || existentes[registro.protocolo] || {};
    return [
      registro.protocolo,
      registro.dataAbertura,
      registro.nome,
      registro.telefone,
      registro.endereco,
      registro.procedencia,
      fo_resumirTextoTarefa_(registro.solicitacao, 260),
      anterior.reparo || '',
      anterior.tratativa || '',
      anterior.devolutiva || '',
      anterior.canal || '',
      anterior.dataDevolutiva || '',
      anterior.responsavel || '',
      anterior.resultado || '',
      anterior.observacao || '',
      false,
      'Aguardando devolutiva do Atendimento',
      chave
    ];
  });
  aba.getRange(5, 1, linhas.length, FO_CABECALHOS_ENCERRAMENTO.length)
    .setValues(linhas)
    .setFontFamily('Arial').setFontSize(9).setWrap(true)
    .setVerticalAlignment('middle')
    .setBorder(
      false, false, true, false, true, true,
      FO_CONFIG.CORES.BORDA,
      SpreadsheetApp.BorderStyle.SOLID
    );
  aba.getRange(5, 2, linhas.length, 1).setNumberFormat('dd/MM/yyyy');
  aba.getRange(5, 12, linhas.length, 1).setNumberFormat('dd/MM/yyyy');
  aba.getRange(5, 16, linhas.length, 1).insertCheckboxes();
  aba.getRange(5, 1, linhas.length, 7)
    .setBackground(FO_CONFIG.CORES.CINZA_CLARO)
    .setFontColor(FO_CONFIG.CORES.TEXTO);
  aba.getRange(5, 8, linhas.length, 8)
    .setBackground('#FFF8D8')
    .setFontColor(FO_CONFIG.CORES.TEXTO);
  aba.getRange(5, 16, linhas.length, 1)
    .setBackground(FO_CONFIG.CORES.AZUL_CLARO)
    .setHorizontalAlignment('center');
  aba.getRange(5, 17, linhas.length, 1)
    .setBackground(FO_CONFIG.CORES.LARANJA_CLARO)
    .setFontColor('#98520F').setFontWeight('bold');
  aba.getRange(5, 8, linhas.length, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(FO_OPCOES_REPARO, true)
      .setAllowInvalid(false)
      .setHelpText('Escolha o reparo, encaminhamento ou orientação aplicada.')
      .build()
  );
  aba.getRange(5, 11, linhas.length, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList([
        'WhatsApp', 'Ligação telefônica', 'Atendimento presencial',
        'E-mail', 'Outro'
      ], true)
      .setAllowInvalid(false)
      .build()
  );
  aba.getRange(5, 12, linhas.length, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireDate()
      .setAllowInvalid(false)
      .setHelpText('Informe a data em que a devolutiva foi comunicada ao cliente.')
      .build()
  );
  aba.getRange(5, 14, linhas.length, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList([
        'Cliente informado e ciente',
        'Cliente informado, mas discordou',
        'Devolutiva enviada, aguardando retorno',
        'Não foi possível contato'
      ], true)
      .setAllowInvalid(false)
      .build()
  );
  aba.setRowHeights(5, linhas.length, 88);
  if (aba.getFilter()) aba.getFilter().remove();
  aba.getRange(4, 1, linhas.length + 1, 17).createFilter();
  try { aba.hideColumns(18); } catch (erro) {}
}

function fo_lerEstadoEncerramentosAtendimento_(aba) {
  const existentes = {};
  if (!aba || aba.getLastRow() < 5) return existentes;
  aba.getRange(
    5, 1, aba.getLastRow() - 4, FO_CABECALHOS_ENCERRAMENTO.length
  ).getValues().forEach(function(linha) {
    const protocolo = fo_texto_(linha[0]);
    if (!protocolo) return;
    const chave = fo_texto_(linha[17]) || protocolo;
    existentes[chave] = {
      reparo: linha[7],
      tratativa: linha[8],
      devolutiva: linha[9],
      canal: linha[10],
      dataDevolutiva: linha[11],
      responsavel: linha[12],
      resultado: linha[13],
      observacao: linha[14]
    };
  });
  return existentes;
}

function fo_deveEncerrarPeloAtendimento_(registro) {
  return fo_texto_(registro.historicoEntregue) !== 'SIM' &&
    fo_statusInterno_(registro.status) !== 'Concluída' &&
    Boolean(fo_texto_(registro.protocolo));
}

function fo_lerEstadoDemandasAtendimento_(aba) {
  const existentes = {};
  if (aba.getLastRow() < 5) return existentes;
  aba.getRange(5, 1, aba.getLastRow() - 4, FO_CABECALHOS_AVISOS.length)
    .getValues().forEach(function(linha) {
      const protocolo = fo_texto_(linha[0]);
      if (!protocolo) return;
      const chave = fo_texto_(linha[16]) || 'PROTOCOLO|' + protocolo;
      const legado = !fo_texto_(linha[16]);
      existentes[chave] = {
        realizada: legado ? linha[8] === true : (Boolean(fo_data_(linha[13])) || linha[12] === 'Registrada'),
        dataRealizacao: legado ? linha[9] : linha[13],
        observacao: legado ? linha[10] : linha[14]
      };
    });
  return existentes;
}

function fo_montarDemandasAtendimento_(registros, existentes) {
  const tarefas = [];
  registros.filter(function(registro) {
    return !/^HIST\d{4}-[A-F0-9]{12}$/.test(registro.chave) &&
      fo_texto_(registro.historicoEntregue) !== 'SIM' &&
      Boolean(fo_texto_(registro.protocolo));
  }).forEach(function(registro) {
    if (fo_texto_(registro.status) === 'Concluída') {
      if (fo_ehEncerramentoAutomaticoSemResposta_(registro)) {
        tarefas.push(fo_criarTarefaAtendimento_(
          registro,
          'Confirmar ciência do encerramento automático'
        ));
      }
      return;
    }
    tarefas.push(fo_criarTarefaAtendimento_(registro, 'Avisar protocolo'));
    if (fo_ehNaoProcedenteOuPossivel_(registro.procedencia)) {
      return;
    }
    const area = fo_normalizar_(registro.areaProxima);
    const acao = fo_normalizar_(registro.proximaAcao);
    if (area.indexOf('atendimento') >= 0 &&
        acao.indexOf('aguardar resposta') >= 0) {
      tarefas.push(fo_criarTarefaAtendimento_(registro, 'Registrar tentativa sem resposta'));
    } else if (area.indexOf('atendimento') >= 0) {
      let tipo = 'Complementar informações com o morador';
      if (/solucao imediata|encerramento imediato|registrar.*solucao/.test(acao)) {
        tipo = 'Registrar encerramento imediato';
      } else if (/pesquisa.*satisfacao|encerrar/.test(acao)) {
        tipo = 'Aplicar pesquisa de satisfação';
      }
      tarefas.push(fo_criarTarefaAtendimento_(registro, tipo));
    } else if (area.indexOf('execucao') >= 0) {
      tarefas.push(fo_criarTarefaAtendimento_(registro, 'Acompanhar retorno da execução'));
    }
  });
  tarefas.forEach(function(tarefa) {
    const anterior = existentes[tarefa.chave] || {};
    tarefa.realizada = anterior.realizada === true;
  });
  return tarefas.sort(function(a, b) {
    if (a.realizada !== b.realizada) return a.realizada ? 1 : -1;
    const pa = fo_numeroPrioridadeTarefa_(a.prioridade);
    const pb = fo_numeroPrioridadeTarefa_(b.prioridade);
    if (pa !== pb) return pa - pb;
    const da = fo_data_(a.prazo);
    const db = fo_data_(b.prazo);
    return (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
  });
}

function fo_criarTarefaAtendimento_(registro, tipo) {
  const ultima = fo_data_(registro.ultimaAtualizacao) ||
    fo_data_(registro.dataAbertura) || new Date();
  const protocolo = fo_texto_(registro.protocolo);
  const categoria = fo_normalizar_(tipo).replace(/\s+/g, '_').toUpperCase();
  let prazo = fo_data_(registro.dataAbertura) || new Date();
  let acao = '';
  let mensagem = '';
  let proximaEtapa = '';
  if (tipo === 'Avisar protocolo') {
    acao = 'Enviar o número de protocolo ao morador.';
    mensagem = fo_mensagemProtocolo_(registro);
    proximaEtapa = 'O acompanhamento continua conforme o status.';
  } else if (tipo === 'Registrar encerramento imediato') {
    prazo = fo_adicionarDiasUteis_(ultima, 1);
    acao = 'Abrir ATENDIMENTO > Encerrar atendimento e registrar a solução e a devolutiva.';
    proximaEtapa = 'O encerramento da ficha é confirmado na janela, com a tratativa documentada.';
  } else if (tipo === 'Complementar informações com o morador') {
    prazo = fo_adicionarDiasUteis_(ultima, 1);
    acao = registro.proximaAcao ||
      'Contatar o morador e registrar as informações necessárias.';
    mensagem = 'Olá, ' + (fo_texto_(registro.nome) || 'munícipe') +
      '. Estamos acompanhando o protocolo ' + protocolo +
      ' e precisamos confirmar algumas informações para continuar a tratativa.';
    proximaEtapa = 'Após a confirmação, a demanda retorna para a Execução.';
  } else if (tipo === 'Aplicar pesquisa de satisfação') {
    prazo = fo_adicionarDiasUteis_(ultima, 1);
    acao = 'Conferir a devolutiva e encerrar pelo painel. A pesquisa pode ser aplicada quando disponível.';
    mensagem = 'Olá, ' + (fo_texto_(registro.nome) || 'munícipe') +
      '. A providência do protocolo ' + protocolo +
      ' foi registrada. Gostaríamos de confirmar a conclusão e avaliar o atendimento.';
    proximaEtapa = 'Pode encerrar em ATENDIMENTO > Encerrar atendimento, registrando o motivo da ausência de pesquisa.';
  } else if (tipo === 'Registrar tentativa sem resposta') {
    const tentativas = Number(registro.tentativasSemResposta || 0);
    prazo = fo_adicionarDiasUteis_(ultima, 1);
    acao = 'Tentar contato com o morador e confirmar se houve resposta à pesquisa.';
    mensagem = 'Olá, ' + (fo_texto_(registro.nome) || 'munícipe') +
      '. Estamos finalizando o protocolo ' + protocolo +
      ' e ainda precisamos confirmar sua avaliação do atendimento.';
    proximaEtapa = 'Tentativas registradas em dias diferentes: ' + tentativas +
      ' de ' + FO_CONFIG.TENTATIVAS_ENCERRAMENTO_SEM_RESPOSTA +
      '. O encerramento exige também ' + FO_CONFIG.DIAS_ENCERRAMENTO_SEM_RESPOSTA +
      ' dias sem resposta.';
  } else if (tipo === 'Confirmar ciência do encerramento automático') {
    prazo = new Date();
    acao = 'Revisar o encerramento administrativo e marcar ciência.';
    proximaEtapa = 'O atendimento já está concluído. Este check registra a ciência da equipe.';
  } else {
    prazo = fo_adicionarDiasUteis_(ultima, fo_intervaloAcompanhamento_(registro.urgencia));
    acao = 'Cobrar a atualização da Execução e manter o morador acompanhado.';
    proximaEtapa = 'A Execução permanece responsável pela providência.';
  }
  return {
    registro: registro,
    tipo: tipo,
    prioridade: fo_prioridadeTarefa_(registro.urgencia, tipo),
    prazo: prazo,
    acao: acao,
    mensagem: mensagem,
    proximaEtapa: proximaEtapa,
    chave: categoria + '|' + protocolo + '|' +
      (tipo === 'Avisar protocolo'
        ? 'INICIAL'
        : (tipo === 'Confirmar ciência do encerramento automático'
          ? 'CIENCIA_AUTOMATICA'
          : String(ultima.getTime())))
  };
}

function fo_ehEncerramentoAutomaticoSemResposta_(registro) {
  return fo_texto_(registro.encerramentoAutomaticoSemResposta) === 'SIM' ||
    /encerrad[oa].*ausencia de resposta|encerramento administrativo.*ausencia de resposta/
    .test(fo_normalizar_(registro.finalizacao));
}

function fo_intervaloAcompanhamento_(urgencia) {
  const n = fo_normalizar_(urgencia);
  if (n.indexOf('urgente') >= 0) return 1;
  if (n.indexOf('alto') >= 0) return 2;
  if (n.indexOf('medio') >= 0) return 4;
  return 7;
}

function fo_prioridadeTarefa_(urgencia, tipo) {
  if (tipo === 'Avisar protocolo' || tipo === 'Registrar encerramento imediato' ||
      tipo === 'Confirmar ciência do encerramento automático') {
    return '1. Imediata';
  }
  const n = fo_normalizar_(urgencia);
  if (n.indexOf('urgente') >= 0) return '1. Urgente';
  if (n.indexOf('alto') >= 0) return '2. Alta';
  if (n.indexOf('medio') >= 0) return '3. Média';
  return '4. Regular';
}

function fo_numeroPrioridadeTarefa_(prioridade) {
  const encontrado = fo_texto_(prioridade).match(/^(\d+)/);
  return encontrado ? Number(encontrado[1]) : 9;
}

function fo_adicionarDiasUteis_(valor, quantidade) {
  const data = fo_data_(valor) || new Date();
  const saida = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  let adicionados = 0;
  while (adicionados < quantidade) {
    saida.setDate(saida.getDate() + 1);
    if (saida.getDay() !== 0 && saida.getDay() !== 6) adicionados++;
  }
  return saida;
}

function fo_resumirTextoTarefa_(valor, limite) {
  const texto = fo_texto_(valor).replace(/\s+/g, ' ');
  return texto.length > limite ? texto.slice(0, limite - 3).trim() + '...' : texto;
}

function fo_formatarLinhaDemandaAtendimento_(aba, linha, tarefa) {
  const c = FO_CONFIG.CORES;
  const intervalo = aba.getRange(linha, 1, 1, 16);
  if (tarefa.realizada) {
    intervalo.setBackground(c.VERDE_CLARO).setFontColor('#24734C');
    aba.getRange(linha, 13).setFontWeight('bold');
    return;
  }
  intervalo.setBackground(linha % 2 ? '#FFFFFF' : '#F7F9FB')
    .setFontColor(c.TEXTO);
  const prioridade = fo_numeroPrioridadeTarefa_(tarefa.prioridade);
  if (prioridade === 1) {
    aba.getRange(linha, 2, 1, 3).setBackground(c.VERMELHO_CLARO)
      .setFontColor('#A83E31').setFontWeight('bold');
  } else if (prioridade === 2) {
    aba.getRange(linha, 2, 1, 3).setBackground(c.LARANJA_CLARO)
      .setFontColor('#98520F').setFontWeight('bold');
  } else {
    aba.getRange(linha, 2, 1, 3).setBackground(c.AZUL_CLARO)
      .setFontColor(c.AZUL_ESCURO).setFontWeight('bold');
  }
  const prazo = fo_data_(tarefa.prazo);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (prazo && prazo < hoje) {
    aba.getRange(linha, 4).setBackground(c.VERMELHO)
      .setFontColor(c.BRANCO).setFontWeight('bold');
  }
}

function fo_mensagemProtocolo_(registro) {
  const nome = fo_texto_(registro.nome) || 'munícipe';
  return 'Olá, ' + nome + '. Seu atendimento foi registrado pelo ' +
    FO_CONFIG.EMPRESA + '. Protocolo: ' + registro.protocolo +
    '. Guarde este número para acompanhar a solicitação e informe o protocolo em qualquer retorno.';
}

function fo_urlWhatsApp_(telefone, mensagem) {
  let numero = fo_texto_(telefone).replace(/\D/g, '');
  if (numero.length === 10 || numero.length === 11) numero = '55' + numero;
  if (numero.length < 12) return '';
  return 'https://wa.me/' + numero + '?text=' + encodeURIComponent(mensagem);
}

function aoEditarAvisosProtocolo(e) {
  if (!e || !e.range || !e.source || e.source.getId() !== FO_CONFIG.CENTRAL_ID) return;
  const aba = e.range.getSheet();
  if (aba.getName() !== FO_CONFIG.ABA_AVISOS_PROTOCOLO || e.range.getLastRow() < 5) return;
  const primeiro = Math.max(5, e.range.getRow());
  const incluiCheck = e.range.getColumn() <= 13 && e.range.getLastColumn() >= 13;
  if (!incluiCheck) return;
  const linhas = aba.getRange(primeiro, 1, e.range.getLastRow() - primeiro + 1, 19).getValues();
  let novos = 0;
  const avisos = [];
  linhas.forEach(function(r) {
    if (!r[0] || !r[16]) return;
    try {
      const resultado = painelAplicarDemanda_({
        protocolo: r[0], chave: r[16], relato: r[14] || '',
        desmarcar: r[12] !== true, origemChecklist: true,
        autor: e.user ? e.user.getEmail() : ''
      });
      if (resultado.registradaAgora) novos++;
      else if (resultado.mensagem) avisos.push(r[0] + ': ' + resultado.mensagem);
    } catch (erro) {
      avisos.push(r[0] + ': ' + erro.message);
    }
  });
  if (novos) {
    try {
      painelRegistrarPedido_('ATUALIZAR', {origem: 'Checklist de demandas'});
      avisos.unshift(novos + ' tarefa(s) registrada(s). Os painéis serão atualizados pela automação.');
    } catch (erro) {
      avisos.unshift(novos + ' tarefa(s) JÁ SALVA(S). Para atualizar os painéis, use ATENDIMENTO > Atualizar dados e anexos. ' + erro.message);
    }
  }
  if (avisos.length) e.source.toast(avisos.slice(0, 4).join('\n'), 'Checklist do Atendimento', 10);
}

function fo_registrarTarefaAtendimentoNoHistorico_(aba, linha, chave, autor) {
  const central = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
  const historico = central.getSheetByName(FO_CONFIG.ABA_HISTORICO_CENTRAL);
  if (!historico) throw new Error('A página Histórico não foi encontrada na Central.');
  const existente = fo_eventoDemandaRegistrado_(central, chave);
  if (existente) return {data: existente.data, existia: true};
  const chaveEvento = 'TAREFA_ATENDIMENTO|' + chave;
  const protocolo = fo_texto_(aba.getRange(linha, 1).getValue());
  const tipo = fo_texto_(aba.getRange(linha, 3).getValue());
  const observacao = fo_texto_(aba.getRange(linha, 15).getValue());
  const estadoDashboard = fo_obterEstadoDashboard_(central, protocolo);
  const statusAtual = fo_texto_(aba.getRange(linha, 19).getValue()) ||
    estadoDashboard.status || 'Em andamento';
  let estado = fo_estadoAposTarefaAtendimento_(tipo, statusAtual);
  if (tipo === 'Registrar tentativa sem resposta') {
    const eventos = fo_lerHistorico_(historico)[protocolo] || [];
    const resumo = fo_resumirAcompanhamentoSemResposta_(eventos);
    const hoje = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (resumo.datas.indexOf(hoje) >= 0) {
      aba.getRange(linha, 13).setValue(false);
      aba.getRange(linha, 14).clearContent();
      try {
        central.toast(
          'Já existe uma tentativa registrada hoje para ' + protocolo + '.',
          'Tentativa não duplicada',
          6
        );
      } catch (erro) {}
      return;
    }
    const totalTentativas = resumo.tentativas + 1;
    const diasSemResposta = fo_diasCorridos_(resumo.dataEnvioPesquisa, new Date());
    const deveEncerrar = totalTentativas >=
        FO_CONFIG.TENTATIVAS_ENCERRAMENTO_SEM_RESPOSTA &&
      diasSemResposta >= FO_CONFIG.DIAS_ENCERRAMENTO_SEM_RESPOSTA;
    estado = deveEncerrar ? {
      status: 'Concluída',
      area: 'Atendimento concluído',
      proximaAcao: 'Nenhuma pendência',
      observacao: 'Atendimento encerrado por ausência de resposta após ' +
        totalTentativas + ' tentativa(s) em dias diferentes e ' +
        diasSemResposta + ' dia(s) desde o envio da pesquisa.',
      tipoEvento: 'Finalização'
    } : {
      status: 'Aguardando finalização',
      area: 'Atendimento',
      proximaAcao: 'Aguardar resposta da pesquisa de satisfação',
      observacao: 'Tentativa de contato sem resposta registrada. Tentativa ' +
        totalTentativas + ' de ' + FO_CONFIG.TENTATIVAS_ENCERRAMENTO_SEM_RESPOSTA + '.',
      tipoEvento: 'Tarefa do Atendimento'
    };
  }

  fo_garantirDimensoes_(historico, historico.getLastRow() + 2, 21);
  const usuario = fo_texto_(autor) || Session.getActiveUser().getEmail() || 'Equipe de atendimento';
  const dataRegistro = new Date();
  const novaLinha = Math.max(2, historico.getLastRow() + 1);
  const observacaoEvento = tipo === 'Confirmar ciência do encerramento automático'
    ? estado.observacao + (observacao ? ' Observação: ' + observacao : '')
    : ((tipo === 'Aplicar pesquisa de satisfação' || tipo === 'Registrar tentativa sem resposta') ? estado.observacao + (observacao ? '\n\n' + observacao : '') : (observacao || estado.observacao));
  historico.getRange(novaLinha, 1, 1, 21).setValues([[
    protocolo, dataRegistro, usuario, estado.status,
    estadoDashboard.procedencia || 'Em análise', usuario,
    observacaoEvento, 'Tarefa do Atendimento concluída', '',
    '', '', '', '', '', estado.tipoEvento, estado.area, estado.proximaAcao,
    chaveEvento, '', '', ''
  ]]);
  historico.getRange(novaLinha, 2).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  try { fo_refletirTarefaNoDashboard_(central, protocolo, estado); }
  catch (erro) { console.warn('Tarefa salva. Dashboard será atualizado pela fila: ' + erro.message); }
  return {data: dataRegistro, existia: false};
}

function fo_diasCorridos_(inicio, fim) {
  const dataInicio = fo_data_(inicio);
  const dataFim = fo_data_(fim);
  if (!dataInicio || !dataFim) return 0;
  const primeiro = new Date(
    dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate()
  );
  const ultimo = new Date(dataFim.getFullYear(), dataFim.getMonth(), dataFim.getDate());
  return Math.max(0, Math.floor((ultimo.getTime() - primeiro.getTime()) / 86400000));
}

function fo_estadoAposTarefaAtendimento_(tipo, statusAtual) {
  if (tipo === 'Confirmar ciência do encerramento automático') {
    return {
      status: 'Concluída',
      area: 'Atendimento concluído',
      proximaAcao: 'Nenhuma pendência',
      observacao: 'Atendimento tomou ciência do encerramento automático por ausência de resposta.',
      tipoEvento: 'Ciência administrativa'
    };
  }
  if (tipo === 'Registrar encerramento imediato') {
    return {
      status: 'Concluída',
      area: 'Atendimento concluído',
      proximaAcao: 'Nenhuma pendência',
      observacao: 'Solução imediata registrada e atendimento encerrado.',
      tipoEvento: 'Finalização'
    };
  }
  if (tipo === 'Complementar informações com o morador') {
    return {
      status: 'Em andamento',
      area: 'Execução',
      proximaAcao: 'Retomar a análise com as informações complementares',
      observacao: 'Informações complementares confirmadas pelo Atendimento.',
      tipoEvento: 'Tarefa do Atendimento'
    };
  }
  if (tipo === 'Aplicar pesquisa de satisfação') {
    return {
      status: 'Aguardando finalização',
      area: 'Atendimento',
      proximaAcao: 'Aguardar a resposta da pesquisa de satisfação',
      observacao: 'Pesquisa de satisfação enviada ou aplicada.',
      tipoEvento: 'Tarefa do Atendimento'
    };
  }
  if (tipo === 'Registrar tentativa sem resposta') {
    return {
      status: 'Aguardando finalização',
      area: 'Atendimento',
      proximaAcao: 'Aguardar resposta da pesquisa de satisfação',
      observacao: 'Tentativa de contato sem resposta registrada.',
      tipoEvento: 'Tarefa do Atendimento'
    };
  }
  if (tipo === 'Acompanhar retorno da execução') {
    return {
      status: 'Em andamento',
      area: 'Execução',
      proximaAcao: 'Concluir a providência e registrar novo retorno',
      observacao: 'Cobrança de acompanhamento realizada pelo Atendimento.',
      tipoEvento: 'Tarefa do Atendimento'
    };
  }
  return {
    status: statusAtual,
    area: fo_texto_(statusAtual) === 'Concluída' ? 'Atendimento concluído' : '',
    proximaAcao: '',
    observacao: 'Protocolo comunicado ao morador.',
    tipoEvento: 'Comunicação de protocolo'
  };
}

function fo_removerTarefaAtendimentoDoHistorico_(chave) {
  throw new Error('Uma tarefa já registrada não é apagada pelo checklist. Use as janelas de atendimento para documentar a correção.');
}

function fo_refletirTarefaNoDashboard_(central, protocolo, estado) {
  if (estado.tipoEvento === 'Comunicação de protocolo') return;
  const aba = central.getSheetByName(FO_CONFIG.ABA_DASHBOARD_CENTRAL);
  if (!aba) return;
  const dados = aba.getDataRange().getValues();
  const cabecalho = fo_encontrarLinhaCabecalho_(dados, ['Protocolo', 'Status']);
  if (cabecalho < 0) return;
  const mapa = fo_mapaCabecalhos_(dados[cabecalho]);
  const indiceProtocolo = mapa[fo_normalizar_('Protocolo')];
  const indiceArea = mapa[fo_normalizar_('Área responsável pela próxima ação')];
  const indiceAcao = mapa[fo_normalizar_('Próxima ação')];
  const indiceStatus = mapa[fo_normalizar_('Status')];
  for (let i = cabecalho + 1; i < dados.length; i++) {
    if (fo_texto_(dados[i][indiceProtocolo]) !== protocolo) continue;
    const numeroLinha = i + 1;
    if (indiceArea !== undefined) aba.getRange(numeroLinha, indiceArea + 1).setValue(estado.area);
    if (indiceAcao !== undefined) aba.getRange(numeroLinha, indiceAcao + 1).setValue(estado.proximaAcao);
    if (indiceStatus !== undefined) aba.getRange(numeroLinha, indiceStatus + 1).setValue(estado.status);
    break;
  }
}

function fo_processarEdicaoEncerramentoAtendimento_(e) {
  const aba = e.range.getSheet();
  const linha = e.range.getRow();
  if (linha < 5 || e.range.getColumn() !== 16 || e.range.getValue() !== true) return;
  const valores = aba.getRange(
    linha, 1, 1, FO_CABECALHOS_ENCERRAMENTO.length
  ).getValues()[0];
  const protocolo = fo_texto_(valores[0]);
  if (!protocolo) {
    aba.getRange(linha, 16).setValue(false);
    return;
  }
  const obrigatorios = [
    {indice: 7, nome: 'Opção de reparo ou encaminhamento'},
    {indice: 8, nome: 'Tratativa e parecer final'},
    {indice: 9, nome: 'Devolutiva informada ao cliente'},
    {indice: 10, nome: 'Canal da devolutiva'},
    {indice: 11, nome: 'Data da devolutiva', data: true},
    {indice: 12, nome: 'Responsável pelo encerramento'},
    {indice: 13, nome: 'Resultado do contato'}
  ];
  const faltantes = obrigatorios.filter(function(campo) {
    return campo.data
      ? !fo_data_(valores[campo.indice])
      : !fo_texto_(valores[campo.indice]);
  });
  const resultado = fo_texto_(valores[13]);
  const contatoConcluido = [
    'Cliente informado e ciente',
    'Cliente informado, mas discordou'
  ].indexOf(resultado) >= 0;
  if (faltantes.length || !contatoConcluido) {
    aba.getRange(linha, 16).setValue(false);
    obrigatorios.forEach(function(campo) {
      const invalido = campo.data
        ? !fo_data_(valores[campo.indice])
        : !fo_texto_(valores[campo.indice]);
      aba.getRange(linha, campo.indice + 1)
        .setBackground(invalido ? FO_CONFIG.CORES.VERMELHO_CLARO : '#FFF8D8');
    });
    const mensagem = faltantes.length
      ? 'Preencha: ' + faltantes.map(function(campo) { return campo.nome; }).join(', ') + '.'
      : 'O atendimento continua aberto enquanto a devolutiva aguarda retorno ou o contato não foi concluído.';
    aba.getRange(linha, 17).setValue(mensagem)
      .setBackground(FO_CONFIG.CORES.VERMELHO_CLARO)
      .setFontColor(FO_CONFIG.CORES.VERMELHO);
    try { e.source.toast(mensagem, 'Encerramento não confirmado', 8); } catch (erro) {}
    return;
  }
  fo_executarComTravaScript_('o encerramento do protocolo ' + protocolo, function() {
    const central = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
    const base = fo_lerRegistrosBaseOficial_(central);
    const registro = base.filter(function(item) {
      return fo_texto_(item.protocolo) === protocolo;
    })[0];
    if (!registro) throw new Error('O protocolo ' + protocolo + ' não foi encontrado na base oficial.');
    if (fo_statusInterno_(registro.status) === 'Concluída') {
      throw new Error('O protocolo ' + protocolo + ' já está concluído.');
    }
    if (!fo_deveEncerrarPeloAtendimento_(registro)) {
      throw new Error(
        'Este protocolo não possui uma etapa de encerramento direto pelo Atendimento.'
      );
    }
    const historico = central.getSheetByName(FO_CONFIG.ABA_HISTORICO_CENTRAL);
    if (!historico) throw new Error('A página Histórico não foi encontrada na Central.');
    const chaveEvento = 'ENCERRAMENTO_ATENDIMENTO|' + protocolo;
    fo_removerEventoHistoricoPorChave_(historico, chaveEvento);
    const reparo = fo_texto_(valores[7]);
    const tratativa = fo_texto_(valores[8]);
    const devolutiva = fo_texto_(valores[9]);
    const canal = fo_texto_(valores[10]);
    const dataDevolutiva = fo_data_(valores[11]);
    const responsavel = fo_texto_(valores[12]);
    const observacao = fo_texto_(valores[14]);
    const parecer = fo_juntarTextosUnicos_([
      'Reparo ou encaminhamento: ' + reparo + '.',
      tratativa,
      observacao
    ]);
    // A devolutiva é pública. Canal e resultado padronizado são controles
    // administrativos e permanecem somente na coluna interna "Nota final".
    const conclusao = devolutiva;
    const notaInterna = 'Canal interno: ' + canal +
      '. Resultado do contato: ' + resultado + '.';
    fo_garantirDimensoes_(historico, historico.getLastRow() + 2, 21);
    const novaLinha = Math.max(2, historico.getLastRow() + 1);
    historico.getRange(novaLinha, 1, 1, 21).setValues([[
      protocolo,
      new Date(),
      Session.getActiveUser().getEmail() || responsavel,
      'Concluída',
      valores[5] || registro.procedencia,
      responsavel,
      parecer,
      FO_CONFIG.ABA_ENCERRAMENTO_ATENDIMENTO,
      chaveEvento,
      'Não se aplica',
      'Sim',
      notaInterna,
      'Não se aplica',
      conclusao,
      'Finalização',
      'Atendimento concluído',
      'Nenhuma pendência',
      chaveEvento,
      dataDevolutiva,
      responsavel,
      ''
    ]]);
    historico.getRange(novaLinha, 2).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    historico.getRange(novaLinha, 19).setNumberFormat('dd/MM/yyyy');
    fo_refletirEncerramentoNoDashboard_(
      central,
      protocolo,
      valores[5] || registro.procedencia,
      responsavel,
      new Date()
    );
    fo_sincronizarBaseFichasOficiaisSemTrava_();
    if (PropertiesService.getScriptProperties().getProperty(
      FO_CONFIG.PROPRIEDADE_CONTROLE_ATIVO
    ) === 'SIM') {
      fo_atualizarControleManifestacoesSemTrava_();
    }
    fo_enfileirarAtualizacaoFicha_(protocolo);
  });
  try {
    e.source.toast(
      protocolo + ' encerrado. A ficha oficial foi colocada na fila de atualização.',
      'Atendimento concluído',
      8
    );
  } catch (erro) {}
}

function fo_removerEventoHistoricoPorChave_(historico, chaveEvento) {
  if (!historico || historico.getLastRow() < 2 || historico.getMaxColumns() < 18) return;
  const valores = historico.getRange(2, 18, historico.getLastRow() - 1, 1).getValues();
  for (let i = valores.length - 1; i >= 0; i--) {
    if (fo_texto_(valores[i][0]) === chaveEvento) historico.deleteRow(i + 2);
  }
}

function fo_refletirEncerramentoNoDashboard_(
  central, protocolo, procedencia, responsavel, instante
) {
  const aba = central.getSheetByName(FO_CONFIG.ABA_DASHBOARD_CENTRAL);
  if (!aba) return;
  const dados = aba.getDataRange().getValues();
  const cabecalho = fo_encontrarLinhaCabecalho_(dados, ['Protocolo', 'Status']);
  if (cabecalho < 0) return;
  const mapa = fo_mapaCabecalhos_(dados[cabecalho]);
  const indiceProtocolo = mapa[fo_normalizar_('Protocolo')];
  const atualizacoes = [
    {nome: 'Status', valor: 'Concluída'},
    {nome: 'Área responsável pela próxima ação', valor: 'Atendimento concluído'},
    {nome: 'Próxima ação', valor: 'Nenhuma pendência'},
    {nome: 'Responsável atual', valor: responsavel},
    {nome: 'Procedência', valor: procedencia},
    {nome: 'Última atualização', valor: instante},
    {nome: 'Data de conclusão', valor: instante}
  ];
  for (let i = cabecalho + 1; i < dados.length; i++) {
    if (fo_texto_(dados[i][indiceProtocolo]) !== protocolo) continue;
    atualizacoes.forEach(function(atualizacao) {
      const indice = mapa[fo_normalizar_(atualizacao.nome)];
      if (indice !== undefined) {
        aba.getRange(i + 1, indice + 1).setValue(atualizacao.valor);
      }
    });
    break;
  }
}

function fo_enfileirarAtualizacaoFicha_(protocolo) {
  const propriedades = PropertiesService.getScriptProperties();
  const fila = JSON.parse(
    propriedades.getProperty(FO_CONFIG.PROPRIEDADE_FILA_ATUALIZACAO) || '[]'
  );
  if (fila.indexOf(protocolo) < 0) fila.push(protocolo);
  propriedades.setProperty(
    FO_CONFIG.PROPRIEDADE_FILA_ATUALIZACAO,
    JSON.stringify(fila)
  );
  fo_agendarAtualizacaoFichas_();
}

function fo_obterEstadoDashboard_(central, protocolo) {
  const aba = central.getSheetByName(FO_CONFIG.ABA_DASHBOARD_CENTRAL);
  if (!aba) return {};
  const dados = aba.getDataRange().getValues();
  const cabecalho = fo_encontrarLinhaCabecalho_(dados, ['Protocolo', 'Status']);
  if (cabecalho < 0) return {};
  const mapa = fo_mapaCabecalhos_(dados[cabecalho]);
  for (let i = cabecalho + 1; i < dados.length; i++) {
    const id = fo_texto_(fo_valorCampo_(dados[i], mapa, ['Protocolo']));
    if (id !== protocolo) continue;
    return {
      status: fo_valorCampo_(dados[i], mapa, ['Status']),
      procedencia: fo_valorCampo_(dados[i], mapa, ['Procedência']),
      area: fo_valorCampo_(dados[i], mapa, ['Área responsável pela próxima ação']),
      proximaAcao: fo_valorCampo_(dados[i], mapa, ['Próxima ação'])
    };
  }
  return {};
}

/**
 * Ativa a escrita no Controle de Manifestações. Use somente depois da revisão
 * e da aprovação da primeira ficha em PDF.
 */
function ativarAtualizacaoControleManifestacoes() {
  PropertiesService.getScriptProperties().setProperty(
    FO_CONFIG.PROPRIEDADE_CONTROLE_ATIVO,
    'SIM'
  );
  const central = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
  const configuracao = fo_obterOuCriarAba_(central, FO_CONFIG.ABA_CONFIGURACAO);
  fo_prepararConfiguracao_(configuracao);
  try { configuracao.hideSheet(); } catch (erro) {}
  console.log('Atualização do Controle de Manifestações ativada.');
}

/**
 * Autoriza e executa a primeira atualização externa em uma única etapa.
 * A rotina de atualização reescreve os anexos diretamente pela Central.
 */
function ativarEAtualizarControleManifestacoes() {
  const propriedades = PropertiesService.getScriptProperties();
  propriedades.setProperty(FO_CONFIG.PROPRIEDADE_MANUTENCAO, 'SIM');
  try {
    return fo_executarComTravaScript_('a ativação do Controle de Manifestações', function() {
      const central = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
      const anexos = SpreadsheetApp.openById(FO_CONFIG.ANEXOS_RELATORIO_ID);
      if (!central.getSheetByName(FO_CONFIG.ABA_BASE_OFICIAL)) {
        throw new Error(
          'A Base Fichas Oficiais não foi encontrada. Execute primeiro Sincronizar e revisar.'
        );
      }
      fo_localizarAbaControle_(anexos);
      ativarAtualizacaoControleManifestacoes();
      fo_sincronizarBaseFichasOficiaisSemTrava_();
      const resultado = fo_atualizarControleManifestacoesSemTrava_();
      console.log(
        'Integração ativada e Controle de Manifestações atualizado pela Central.'
      );
      return resultado;
    });
  } finally {
    propriedades.deleteProperty(FO_CONFIG.PROPRIEDADE_MANUTENCAO);
  }
}

function atualizarControleManifestacoesPelaCentral(pularSincronizacao) {
  const propriedades = PropertiesService.getScriptProperties();
  if (propriedades.getProperty(FO_CONFIG.PROPRIEDADE_CONTROLE_ATIVO) !== 'SIM') {
    throw new Error(
      'Proteção externa ativa. Execute ativarEAtualizarControleManifestacoes uma vez. Depois disso, use Atualizar Controle já autorizado.'
    );
  }

  return fo_executarComTravaScript_('a atualização do Controle de Manifestações', function() {
    if (!pularSincronizacao) fo_sincronizarBaseFichasOficiaisSemTrava_();
    return fo_atualizarControleManifestacoesSemTrava_();
  });
}



function verificarAutomacaoAnexosAtendimentos() {
  const propriedades = PropertiesService.getScriptProperties();
  const central = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
  const anexos = SpreadsheetApp.openById(FO_CONFIG.ANEXOS_RELATORIO_ID);
  fo_localizarAbaControle_(anexos);

  let gatilhos = ScriptApp.getProjectTriggers().filter(function(gatilho) {
    return gatilho.getHandlerFunction() === 'atualizarAnexosAtendimentosAgendado';
  });
  if (gatilhos.length !== 1) {
    fo_instalarGatilhos_();
    gatilhos = ScriptApp.getProjectTriggers().filter(function(gatilho) {
      return gatilho.getHandlerFunction() === 'atualizarAnexosAtendimentosAgendado';
    });
  }

  if (propriedades.getProperty(FO_CONFIG.PROPRIEDADE_CONTROLE_ATIVO) !== 'SIM') {
    ativarAtualizacaoControleManifestacoes();
  }
  const resultado = atualizarControleManifestacoesPelaCentral(false);
  const ultima = propriedades.getProperty(
    FO_CONFIG.PROPRIEDADE_ULTIMA_ATUALIZACAO_CONTROLE
  ) || 'Ainda não executada';
  fo_prepararConfiguracao_(
    fo_obterOuCriarAba_(central, FO_CONFIG.ABA_CONFIGURACAO)
  );
  try {
    central.toast(
      'Automação ativa. ' + resultado.atualizados +
      ' registro(s) enviados. Última execução: ' + ultima,
      'Anexos do relatório',
      8
    );
  } catch (erro) {}
  return {
    ativa: true,
    gatilhos: gatilhos.length,
    ultimaAtualizacao: ultima,
    registros: resultado.atualizados
  };
}

/**
 * Inclui registros recebidos no novo sistema mesmo quando a ocorrência ou a
 * realização do procedimento é anterior a 01/09/2026.
 */
function fo_deveEntrarControleManifestacoes_(registro) {
  // O histórico manual alimenta os anexos mesmo quando a ficha já foi entregue.
  // A marca de entrega continua impedindo novas cópias na lista de fichas atuais.
  if (/^HIST\d{4}-[A-F0-9]{12}$/.test(registro.chave)) return true;
  if (fo_texto_(registro.historicoEntregue) === 'SIM') return false;
  if (fo_statusInterno_(registro.status) !== 'Concluída') return true;
  const movimento = fo_ultimaData_([
    registro.carimboFonte,
    registro.ultimaAtualizacao,
    registro.dataConclusao
  ]);
  return Boolean(movimento && movimento >= FO_CONFIG.DATA_INICIO_AUTOMACAO);
}

/** Organiza o controle sem alterar o conteúdo do modelo oficial. */
function organizarControleManifestacoes() {
  const propriedades = PropertiesService.getScriptProperties();
  if (propriedades.getProperty(FO_CONFIG.PROPRIEDADE_CONTROLE_ATIVO) !== 'SIM') {
    throw new Error(
      'A escrita externa está protegida. Use primeiro Fichas SABESP, Ativar e atualizar Controle.'
    );
  }
  propriedades.setProperty(FO_CONFIG.PROPRIEDADE_MANUTENCAO, 'SIM');
  try {
    return fo_executarComTravaScript_('a organização do Controle de Manifestações', function() {
      const anexos = SpreadsheetApp.openById(FO_CONFIG.ANEXOS_RELATORIO_ID);
      const controle = fo_localizarAbaControle_(anexos);
      const resultado = fo_organizarControleManifestacoes_(controle);
      fo_registrarLog_(
        resultado.datasInvalidas ? 'AVISO' : 'OK',
        'organizarControleManifestacoes',
        '',
        'Controle organizado. Datas inválidas: ' + resultado.datasInvalidas + '.'
      );
      console.log(
        'Controle de Manifestações organizado. Datas inválidas: ' +
        resultado.datasInvalidas + '.'
      );
      return resultado;
    });
  } finally {
    propriedades.deleteProperty(FO_CONFIG.PROPRIEDADE_MANUTENCAO);
  }
}

/** Converte a classificação interna para as categorias oficiais dos anexos. */
function fo_tipoManifestacaoRelatorio_(registro) {
  const texto = fo_normalizar_([
    registro.tipo,
    registro.assunto,
    registro.solicitacao
  ].map(fo_texto_).join(' '));
  if (/dano.*calcada|calcada.*dano|paviment|buraco/.test(texto)) {
    return 'Danos à calçada';
  }
  if (/ligacao.*esgoto|esgoto.*ligacao/.test(texto)) {
    return 'Ligações de Esgoto';
  }
  if (/limpeza.*via|sujeira.*via|residuo.*via/.test(texto)) {
    return 'Danos e limpeza da via';
  }
  if (/dano.*edific|rachadura|trinca|portao|muro|fachada|imovel|vidro/.test(texto)) {
    return 'Danos à edificação';
  }
  if (/dano.*veiculo|veiculo.*dano|carro.*danific|danific.*carro|moto.*danific/.test(texto)) {
    return 'Danos a veículos';
  }
  if (/transtorno|acesso|barulho|poeira|odor|cheiro|alag|vazamento|esgoto|tapume/.test(texto)) {
    return 'Transtornos causados pela obra';
  }
  if (/elogio/.test(texto)) return 'Elogio';
  if (/reclam/.test(texto)) return 'Reclamação';
  if (/solicit/.test(texto)) return 'Solicitação';
  if (/inform|duvida|neutra|nao qualific/.test(texto)) return 'Informação';
  return 'Outros';
}

function fo_organizarControleManifestacoes_(controle) {
  const ultimaLinha = Math.max(1, controle.getLastRow());
  const dados = controle.getRange(1, 1, ultimaLinha, 10).getValues();
  const indiceCabecalho = fo_encontrarLinhaCabecalho_(dados, ['Data', 'Nome', 'Status']);
  if (indiceCabecalho < 0) {
    throw new Error('O cabeçalho do Controle de Manifestações não foi localizado.');
  }

  const linhaCabecalho = indiceCabecalho + 1;
  const primeiraLinha = linhaCabecalho + 1;
  const notas = controle.getRange(1, 1, ultimaLinha, 10).getNotes();
  const registros = dados.slice(indiceCabecalho + 1).map(function(linha, indice) {
    const valores = linha.slice(0, 10);
    while (valores.length < 10) valores.push('');
    const temConteudo = valores.some(function(valor) {
      return Boolean(fo_texto_(valor));
    });
    if (!temConteudo) return null;
    const data = fo_data_(valores[0]);
    const dataValida = fo_dataRelatorioValida_(data) ? data : null;
    if (dataValida) valores[0] = dataValida;
    return {
      valores: valores,
      data: dataValida,
      indiceOriginal: indice,
      notas: notas[indiceCabecalho + 1 + indice]
    };
  }).filter(Boolean);

  registros.sort(function(a, b) {
    if (a.data && b.data) {
      const diferenca = a.data.getTime() - b.data.getTime();
      return diferenca || a.indiceOriginal - b.indiceOriginal;
    }
    if (a.data) return -1;
    if (b.data) return 1;
    return a.indiceOriginal - b.indiceOriginal;
  });

  const reordenado = registros.some(function(registro, indice) {
    return registro.indiceOriginal !== indice;
  });
  const quantidadeAntiga = Math.max(0, ultimaLinha - primeiraLinha + 1);
  if (registros.length) {
    controle.getRange(primeiraLinha, 1, registros.length, 10)
      .setValues(registros.map(r=>r.valores.map(fo321_valor_)))
      .setNotes(registros.map(r=>r.notas));
  }
  // Limpa só a sobra depois que os registros e seus vínculos foram escritos.
  if (quantidadeAntiga > registros.length) {
    controle.getRange(primeiraLinha + registros.length, 1, quantidadeAntiga-registros.length, 10).clearContent().clearNote();
  }

  const linhasInvalidas = [];
  registros.forEach(function(registro, indice) {
    if (!registro.data) linhasInvalidas.push(primeiraLinha + indice);
  });
  fo_formatarControleManifestacoes_(
    controle,
    linhaCabecalho,
    primeiraLinha,
    registros.length,
    linhasInvalidas
  );
  return {
    reordenado: reordenado,
    datasInvalidas: linhasInvalidas.length,
    registros: registros.length
  };
}

function fo_formatarControleManifestacoes_(
  controle,
  linhaCabecalho,
  primeiraLinha,
  quantidadeRegistros,
  linhasInvalidas
) {
  const c = FO_CONFIG.CORES;
  const totalLinhas = Math.max(controle.getMaxRows(), primeiraLinha + quantidadeRegistros);
  const primeiraVazia = primeiraLinha + quantidadeRegistros;
  if (primeiraVazia <= totalLinhas) {
    controle.getRange(primeiraVazia, 1, totalLinhas - primeiraVazia + 1, 10)
      .clearFormat().clearDataValidations();
  }

  controle.getBandings().forEach(function(banda) { banda.remove(); });
  const filtro = controle.getFilter();
  if (filtro) filtro.remove();
  controle.setConditionalFormatRules([]);
  controle.setHiddenGridlines(true);
  controle.setFrozenRows(linhaCabecalho);
  controle.setFrozenColumns(0);

  const cabecalho = controle.getRange(linhaCabecalho, 1, 1, 10);
  cabecalho
    .setBackground('#087EA4')
    .setFontColor(c.BRANCO)
    .setFontFamily('Arial')
    .setFontSize(10)
    .setFontWeight('bold')
    .setWrap(true)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#0B5F7A',
      SpreadsheetApp.BorderStyle.SOLID);
  controle.setRowHeight(linhaCabecalho, 42);

  [88, 165, 245, 120, 145, 165, 360, 360, 115, 360]
    .forEach(function(largura, indice) {
      controle.setColumnWidth(indice + 1, largura);
    });

  if (!quantidadeRegistros) return;
  const corpo = controle.getRange(primeiraLinha, 1, quantidadeRegistros, 10);
  const valores = corpo.getValues();
  const fundos = [];
  const coresTexto = [];
  valores.forEach(function(linha, indice) {
    const fundoBase = indice % 2 === 0 ? '#F5FAFD' : '#E2F0F6';
    const linhaFundos = new Array(10).fill(fundoBase);
    const linhaCores = new Array(10).fill(c.TEXTO);
    const status = fo_statusInterno_(linha[8]);
    if (status === 'Concluída') {
      linhaFundos[8] = c.VERDE_CLARO;
      linhaCores[8] = c.VERDE;
    } else {
      linhaFundos[8] = c.LARANJA_CLARO;
      linhaCores[8] = '#9A5708';
    }
    fundos.push(linhaFundos);
    coresTexto.push(linhaCores);
  });
  corpo
    .setBackgrounds(fundos)
    .setFontColors(coresTexto)
    .setFontFamily('Arial')
    .setFontSize(10)
    .setWrap(true)
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#CFD8E1',
      SpreadsheetApp.BorderStyle.SOLID);
  controle.setRowHeights(primeiraLinha, quantidadeRegistros, 66);
  controle.getRange(primeiraLinha, 1, quantidadeRegistros, 1)
    .setNumberFormat('dd/MM/yyyy')
    .setHorizontalAlignment('center')
    .clearNote();
  controle.getRange(primeiraLinha, 2, quantidadeRegistros, 2)
    .setHorizontalAlignment('left');
  controle.getRange(primeiraLinha, 4, quantidadeRegistros, 3)
    .setHorizontalAlignment('center');
  controle.getRange(primeiraLinha, 7, quantidadeRegistros, 2)
    .setHorizontalAlignment('left').setVerticalAlignment('top');
  controle.getRange(primeiraLinha, 9, quantidadeRegistros, 1)
    .setHorizontalAlignment('center').setFontWeight('bold');
  controle.getRange(primeiraLinha, 10, quantidadeRegistros, 1)
    .setHorizontalAlignment('left').setVerticalAlignment('top');

  linhasInvalidas.forEach(function(linha) {
    controle.getRange(linha, 1)
      .setBackground(c.VERMELHO_CLARO)
      .setFontColor(c.VERMELHO)
      .setFontWeight('bold')
      .setNote('Data inválida. Confira o ano antes do envio do relatório.');
  });

  const intervaloTipo = controle.getRange(primeiraLinha, 5, quantidadeRegistros, 1);
  intervaloTipo.clearDataValidations().setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList([
        'Danos à calçada',
        'Ligações de Esgoto',
        'Danos e limpeza da via',
        'Danos à edificação',
        'Danos a veículos',
        'Transtornos causados pela obra',
        'Informação',
        'Elogio',
        'Outros',
        'Reclamação',
        'Solicitação'
      ], true)
      .setAllowInvalid(false)
      .build()
  );
  const intervaloStatus = controle.getRange(primeiraLinha, 9, quantidadeRegistros, 1);
  intervaloStatus.clearDataValidations().setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Em andamento', 'Concluído'], true)
      .setAllowInvalid(true)
      .build()
  );
  const regras = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Concluído')
      .setBackground(c.VERDE_CLARO)
      .setFontColor(c.VERDE)
      .setRanges([intervaloStatus])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Em andamento')
      .setBackground(c.LARANJA_CLARO)
      .setFontColor('#9A5708')
      .setRanges([intervaloStatus])
      .build()
  ];
  controle.setConditionalFormatRules(regras);
  controle.getRange(linhaCabecalho, 1, quantidadeRegistros + 1, 10).createFilter();
}

function fo_criarBackupControle_() {
  return;
}

function fo_lerRegistrosBaseOficial_(central) {
  const aba = central.getSheetByName(FO_CONFIG.ABA_BASE_OFICIAL);
  if (!aba || aba.getLastRow() < 1)throw Error('Base oficial indisponível ou em atualização. Tente consultar novamente; nenhuma ficha foi removida.');
  const dados = aba.getRange(1, 1, aba.getLastRow(), FO_CABECALHOS_BASE.length).getValues();
  if(['Chave do registro','Protocolo','Status'].some(k=>dados[0].indexOf(k)<0))throw Error('Base oficial em atualização ou com cabeçalho alterado. A consulta anterior deve ser preservada.');
  const mapa = fo_mapaCabecalhos_(dados[0]);
  return dados.slice(1).map(function(linha, indice) {
    if (!fo_texto_(linha[0])) return null;
    const registro = {
      linhaBase: indice + 2,
      chave: fo_valorCampo_(linha, mapa, ['Chave do registro']),
      protocolo: fo_valorCampo_(linha, mapa, ['Protocolo']),
      origem: fo_valorCampo_(linha, mapa, ['Origem']),
      linhaControle: fo_valorCampo_(linha, mapa, ['Linha no Controle']),
      idLegado: fo_valorCampo_(linha, mapa, ['ID legado']),
      dataAbertura: fo_valorCampo_(linha, mapa, ['Data de abertura']),
      horario: fo_valorCampo_(linha, mapa, ['Horário']),
      localAtendimento: fo_valorCampo_(linha, mapa, ['Local do atendimento']),
      responsavel: fo_valorCampo_(linha, mapa, ['Responsável pelo atendimento']),
      assunto: fo_valorCampo_(linha, mapa, ['Assunto']),
      tipo: fo_valorCampo_(linha, mapa, ['Tipo de manifestação']),
      nome: fo_valorCampo_(linha, mapa, ['Nome']),
      telefone: fo_valorCampo_(linha, mapa, ['Telefone']),
      email: fo_valorCampo_(linha, mapa, ['E-mail']),
      endereco: fo_valorCampo_(linha, mapa, ['Endereço']),
      frente: fo_valorCampo_(linha, mapa, ['Frente de obra']),
      solicitacao: fo_valorCampo_(linha, mapa, ['Solicitação']),
      solucao: fo_valorCampo_(linha, mapa, ['Solução']),
      finalizacao: fo_valorCampo_(linha, mapa, ['Finalização']),
      status: fo_valorCampo_(linha, mapa, ['Status']),
      dataConclusao: fo_valorCampo_(linha, mapa, ['Data de conclusão']),
      fotosAbertura: fo_valorCampo_(linha, mapa, ['Fotos da abertura']),
      fotosSolucao: fo_valorCampo_(linha, mapa, ['Fotos da solução']),
      documentoId: fo_valorCampo_(linha, mapa, ['ID do documento']),
      pdfId: fo_valorCampo_(linha, mapa, ['ID do PDF atual']),
      hashOficial: fo_valorCampo_(linha, mapa, ['Hash oficial']),
      ultimaGeracao: fo_valorCampo_(linha, mapa, ['Última geração']),
      situacaoVinculo: fo_valorCampo_(linha, mapa, ['Situação do vínculo']),
      camposFaltantes: fo_valorCampo_(linha, mapa, ['Campos faltantes']),
      encerradoLegado: fo_valorCampo_(linha, mapa, ['Encerrado legado']),
      carimboFonte: fo_valorCampo_(linha, mapa, ['Carimbo da fonte']),
      historicoEntregue: fo_valorCampo_(linha, mapa, ['Histórico já entregue']),
      revisaoObrigatoria: fo_valorCampo_(linha, mapa, ['Revisão obrigatória']),
      motivoRevisao: fo_valorCampo_(linha, mapa, ['Motivo da revisão']),
      canalRecebimento: fo_valorCampo_(linha, mapa, ['Canal de recebimento']),
      urgencia: fo_valorCampo_(linha, mapa, ['Grau de urgência']),
      areaProxima: fo_valorCampo_(linha, mapa, ['Área responsável pela próxima ação']),
      proximaAcao: fo_valorCampo_(linha, mapa, ['Próxima ação']),
      ultimaAtualizacao: fo_valorCampo_(linha, mapa, ['Última atualização operacional']),
      descricaoReclamacao: fo_valorCampo_(linha, mapa, [
        'Descrição detalhada da reclamação'
      ]),
      procedencia: fo_valorCampo_(linha, mapa, ['Procedência'])
    };
    return registro;
  }).filter(r => r && !af_incorporado_(r.protocolo));
}

/** Gera a ficha correspondente à linha selecionada em Fichas Oficiais. */

function gerarFichaOficialDaLinhaSelecionada() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha && planilha.getActiveSheet();
  const selecao = planilha ? planilha.getActiveRange() : null;
  const linha = selecao ? selecao.getRow() : 0;
  if (!aba || aba.getName() !== FO_CONFIG.ABA_INDICE ||
      linha < FO_CONFIG.PRIMEIRA_LINHA_INDICE) {
    throw new Error('Selecione uma linha da página Fichas Oficiais.');
  }
  const protocolo = fo_texto_(aba.getRange(linha, 1).getValue());
  if (!protocolo) throw new Error('A linha selecionada não contém um protocolo.');
  sincronizarBaseFichasOficiais();
  return gerarFichaOficialPorProtocolo_(protocolo, true);
}

/** Gera uma única ficha para validar visualmente o modelo antes do lote. */
function gerarPrimeiraFichaOficialTeste() {
  sincronizarBaseFichasOficiais();
  const central = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
  const registros = fo_lerRegistrosBaseOficial_(central);
  const registro = registros.filter(function(item) {
    return fo_deveGerarFichaOficial_(item) &&
      fo_texto_(item.nome) && fo_texto_(item.solicitacao);
  })[0];
  if (!registro) throw new Error('Nenhuma ficha com dados mínimos foi encontrada.');
  return gerarFichaOficialPorProtocolo_(registro.protocolo, true);
}

/** Atualiza somente as fichas cujo conteúdo oficial mudou. */
function gerarFichasOficiaisPendentes() {
  sincronizarBaseFichasOficiais();
  const central = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
  const registros = fo_lerRegistrosBaseOficial_(central);
  const pendentes = registros.filter(function(registro) {
    if (!fo_deveGerarFichaOficial_(registro)) return false;
    const hash = fo_hashOficialRegistro_(registro);
    return hash !== registro.hashOficial || !registro.pdfId || !registro.documentoId;
  }).map(function(registro) {
    return registro.protocolo;
  });
  if (!pendentes.length) {
    console.log('Todas as fichas oficiais já estão atualizadas.');
    return 0;
  }
  PropertiesService.getScriptProperties().setProperty(
    FO_CONFIG.PROPRIEDADE_FILA_ATUALIZACAO,
    JSON.stringify(pendentes)
  );
  fo_removerGatilhosAtualizacaoFichas_();
  continuarGeracaoFichasPendentes();
  return pendentes.length;
}

/** Atualiza poucas fichas por execução para respeitar o limite do Apps Script. */
function continuarGeracaoFichasPendentes() {
  const propriedades = PropertiesService.getScriptProperties();
  const fila = JSON.parse(
    propriedades.getProperty(FO_CONFIG.PROPRIEDADE_FILA_ATUALIZACAO) || '[]'
  );
  if (!fila.length) {
    fo_removerGatilhosAtualizacaoFichas_();
    return;
  }
  const lote = fila.splice(0, FO_CONFIG.TAMANHO_LOTE_PDF);
  lote.forEach(function(protocolo) {
    try {
      gerarFichaOficialPorProtocolo_(protocolo, false);
    } catch (erro) {
      fo_registrarLog_('ERRO', 'continuarGeracaoFichasPendentes', protocolo, erro.message);
    }
  });
  propriedades.setProperty(
    FO_CONFIG.PROPRIEDADE_FILA_ATUALIZACAO,
    JSON.stringify(fila)
  );
  if (fila.length) {
    fo_agendarAtualizacaoFichas_();
  } else {
    propriedades.deleteProperty(FO_CONFIG.PROPRIEDADE_FILA_ATUALIZACAO);
    fo_removerGatilhosAtualizacaoFichas_();
    fo_registrarLog_('OK', 'continuarGeracaoFichasPendentes', '',
      'Todas as fichas alteradas foram atualizadas.');
  }
}

function fo_agendarAtualizacaoFichas_() {
  const existe = ScriptApp.getProjectTriggers().some(function(gatilho) {
    return gatilho.getHandlerFunction() === 'continuarGeracaoFichasPendentes';
  });
  if (!existe) {
    ScriptApp.newTrigger('continuarGeracaoFichasPendentes')
      .timeBased().after(60 * 1000).create();
  }
}

function fo_removerGatilhosAtualizacaoFichas_() {
  ScriptApp.getProjectTriggers().forEach(function(gatilho) {
    if (gatilho.getHandlerFunction() === 'continuarGeracaoFichasPendentes') {
      ScriptApp.deleteTrigger(gatilho);
    }
  });
}

function gerarFichaOficialPorProtocolo_(protocolo, forcar) {
  return fo_executarComTravaDocumento_('a geração da ficha ' + protocolo, function() {
    const central = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
    const registro = fo_lerRegistrosBaseOficial_(central).filter(function(item) {
      return item.protocolo === protocolo;
    })[0];
    if (!registro) throw new Error('Protocolo não encontrado: ' + protocolo);
    if (fo_texto_(registro.historicoEntregue) === 'SIM') {
      throw new Error('Esta ficha pertence ao histórico já entregue e não será recriada.');
    }
    if (fo_texto_(registro.revisaoObrigatoria) === 'SIM') {
      throw new Error(registro.motivoRevisao ||
        'A ficha precisa ser conferida antes da geração definitiva.');
    }
    if (!fo_texto_(registro.nome) || !fo_texto_(registro.solicitacao)) {
      throw new Error('A ficha precisa ter nome e solicitação antes da geração.');
    }

    const hash = fo_hashOficialRegistro_(registro);
    if (!forcar && hash === registro.hashOficial && registro.pdfId && registro.documentoId) {
      return {protocolo: protocolo, documentoId: registro.documentoId, pdfId: registro.pdfId};
    }

    validarModeloFichaOficialSabesp();
    const pastaDocs = fo_subpasta_('Documentos Atuais');
    const pastaPdfs = fo_subpasta_('PDFs Atuais');
    const nomeBase = registro.protocolo + ' Ficha de Atendimento';
    const copia = DriveApp.getFileById(FO_CONFIG.MODELO_DOCUMENTO_ID)
      .makeCopy(nomeBase, pastaDocs);
    const documento = DocumentApp.openById(copia.getId());
    fo_preencherDocumentoOficial_(documento, registro);
    documento.saveAndClose();

    const nomePdf = registro.protocolo + '_Ficha_Atendimento.pdf';
    const pdfBlob = DriveApp.getFileById(copia.getId())
      .getAs(MimeType.PDF)
      .setName(nomePdf);
    const pdf = pastaPdfs.createFile(pdfBlob);

    fo_arquivarArquivoAnterior_(registro.documentoId, copia.getId());
    fo_arquivarArquivoAnterior_(registro.pdfId, pdf.getId());
    fo_removerCopiasMesmoNome_(pastaDocs, nomeBase, copia.getId());
    fo_removerCopiasMesmoNome_(pastaPdfs, nomePdf, pdf.getId());
    fo_executarComTravaScript_('o registro da ficha ' + protocolo, function() {
      const registroAtual = fo_lerRegistrosBaseOficial_(central).filter(function(item) {
        return item.protocolo === protocolo;
      })[0];
      if (!registroAtual) {
        throw new Error('O protocolo deixou de existir durante a geração: ' + protocolo);
      }
      const geradoEm = new Date();
      fo_atualizarMetadadosDocumento_(central, registroAtual.linhaBase, {
        documentoId: copia.getId(),
        pdfId: pdf.getId(),
        hash: hash,
        geradoEm: geradoEm
      });
      fo_atualizarLinhaIndiceDocumento_(
        central,
        protocolo,
        copia.getId(),
        pdf.getId(),
        geradoEm
      );
    });
    fo_registrarLog_('OK', 'gerarFichaOficialPorProtocolo_', protocolo, 'Documento e PDF gerados.');
    return {protocolo: protocolo, documentoId: copia.getId(), pdfId: pdf.getId()};
  });
}

function fo_hashOficialRegistro_(registro) {
  return fo_hash_([
    FO_CONFIG.VERSAO_MODELO,
    FO_CONFIG.MODELO_DOCUMENTO_ID,
    FO_CONFIG.EMPRESA,
    fo_formatarData_(registro.dataAbertura),
    fo_formatarHora_(registro.horario),
    registro.localAtendimento,
    registro.responsavel,
    registro.assunto,
    registro.tipo,
    registro.nome,
    registro.telefone,
    registro.email,
    registro.endereco,
    registro.solicitacao,
    registro.descricaoReclamacao,
    registro.solucao,
    registro.finalizacao,
    fo_statusFicha_(registro.status),
    registro.fotosAbertura,
    registro.fotosSolucao
  ].map(fo_texto_).join('|'));
}

function fo_preencherDocumentoOficial_(documento, registro) {
  const corpo = fo_corpoDocumento_(documento);
  const tabelas = corpo.getTables();
  if (tabelas.length < 2) throw new Error('O modelo oficial perdeu suas duas tabelas principais.');

  const topo = tabelas[0].getCell(0, 0);
  const principal = tabelas[1].getCell(0, 0);
  fo_preencherCelulaTopo_(topo, registro);
  fo_preencherCelulaPrincipal_(principal, registro);
  fo_forcarTextoPreto_(corpo);
}

function fo_preencherCelulaTopo_(celula, registro) {
  celula.clear();
  fo_appendCampo_(celula, 'Empresa contratada: ', FO_CONFIG.EMPRESA);
  fo_appendCampo_(celula, 'Responsável pelo atendimento: ',
    fo_valorOuNaoInformado_(registro.responsavel));
  fo_appendDataHora_(celula, registro.dataAbertura, registro.horario);
  fo_appendCampo_(celula, 'Local: ', fo_valorOuNaoInformado_(registro.localAtendimento));
  fo_appendCampo_(celula, 'Assunto: ', fo_valorOuNaoInformado_(registro.assunto));
  fo_appendCampo_(celula, 'Tipo de manifestação: ', fo_valorOuNaoInformado_(registro.tipo));
}

function fo_preencherCelulaPrincipal_(celula, registro) {
  celula.clear();
  fo_appendTitulo_(celula, 'Dados do cliente', false, false);
  fo_appendCampo_(celula, 'Nome: ', fo_valorOuNaoFornecido_(registro.nome));
  fo_appendCampo_(celula, 'Telefones: ', fo_valorOuNaoFornecido_(registro.telefone));
  fo_appendEmail_(celula, registro.email);
  fo_appendCampo_(celula, 'Endereço: ', fo_valorOuNaoFornecido_(registro.endereco));
  fo_appendEspaco_(celula);
  fo_appendTitulo_(celula, 'Solicitação:', false, false);
  fo_appendTextoLongo_(celula, registro.solicitacao);
  const descricao = fo_textoPublico_(registro.descricaoReclamacao);
  if (descricao && fo_normalizar_(descricao) !== fo_normalizar_(registro.solicitacao)) {
    fo_appendTextoLongo_(celula, descricao);
  }
  fo_appendEspaco_(celula);
  fo_appendCampoNarrativo_(celula, 'Providências realizadas: ', fo_textoPublico_(registro.solucao));
  fo_appendEspaco_(celula);
  fo_appendCampoNarrativo_(celula, 'Conclusão: ', fo_textoPublico_(registro.finalizacao));
  fo_appendEspaco_(celula);
  fo_appendTitulo_(celula, 'Registro Fotográfico', true, true);
  const fotos = fo_carregarFotos_(registro.fotosAbertura, registro.protocolo)
    .concat(fo_carregarFotos_(registro.fotosSolucao, registro.protocolo));
  if (fotos.length) fo_appendGradeFotos_(celula, fotos.slice(0, FO_CONFIG.LIMITE_FOTOS_ABERTURA));
  else { console.log("Sem foto incorporada na ficha " + registro.protocolo); }
  fo_appendEspaco_(celula);
  const status = celula.appendParagraph('');
  fo_estilizarTexto_(status.appendText('Status: '), 12, true);
  fo_estilizarTexto_(status.appendText(fo_statusFicha_(registro.status)), 12, false);
  status.setSpacingAfter(0).setLineSpacing(1.0);
}

function fo_appendCampo_(celula, rotulo, valor) {
  const p = celula.appendParagraph('');
  fo_estilizarTexto_(p.appendText(rotulo), 12, true);
  fo_estilizarTexto_(p.appendText(fo_texto_(valor)), 12, false);
  p.setSpacingAfter(0).setLineSpacing(1.0);
  return p;
}

function fo_appendDataHora_(celula, data, hora) {
  const p = celula.appendParagraph('');
  fo_estilizarTexto_(p.appendText('Data: '), 12, true);
  fo_estilizarTexto_(p.appendText(fo_valorOuNaoInformado_(fo_formatarData_(data))), 12, false);
  fo_estilizarTexto_(p.appendText('      Horário: '), 12, true);
  fo_estilizarTexto_(p.appendText(fo_valorOuNaoInformado_(fo_formatarHora_(hora))), 12, false);
  p.setSpacingAfter(0).setLineSpacing(1.0);
}

function fo_appendEmail_(celula, email) {
  const p = celula.appendParagraph('');
  fo_estilizarTexto_(p.appendText('E-mail: '), 12, true);
  const valor = fo_valorOuNaoFornecido_(email);
  const texto = fo_estilizarTexto_(p.appendText(valor), 12, false);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fo_texto_(email))) {
    texto.setLinkUrl('mailto:' + fo_texto_(email));
    texto.setForegroundColor(FO_CONFIG.COR_TEXTO_DOCUMENTO).setUnderline(false);
  }
  p.setSpacingAfter(0).setLineSpacing(1.0);
}

function fo_appendTitulo_(celula, texto, centralizado, sublinhado) {
  const p = celula.appendParagraph('');
  const t = fo_estilizarTexto_(p.appendText(texto), 12, true)
    .setUnderline(Boolean(sublinhado));
  if (centralizado) p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  p.setSpacingAfter(0).setLineSpacing(1.0);
  return t;
}

function fo_appendTextoLongo_(celula, valor) {
  const blocos = fo_texto_(valor).split(/\n\s*\n/).filter(Boolean);
  (blocos.length ? blocos : ['Não informado.']).forEach(function(bloco) {
    const p = celula.appendParagraph(bloco);
    fo_estilizarParagrafo_(p, 12, false, DocumentApp.HorizontalAlignment.JUSTIFY);
    p.setSpacingAfter(8).setLineSpacing(1.15);
  });
}

function fo_appendCampoNarrativo_(celula, rotulo, valor) {
  const blocos = fo_blocosNarrativos_(valor);
  const primeiro = celula.appendParagraph('');
  fo_estilizarTexto_(primeiro.appendText(rotulo), 12, true);
  const primeiroTemRotulo = blocos.length &&
    /^(?:\d+\.\s*)?[^:\n]{2,80}:\s*/.test(blocos[0]);
  if (blocos.length && !primeiroTemRotulo) {
    fo_estilizarTexto_(primeiro.appendText(blocos.shift()), 12, false);
  } else if (!blocos.length) {
    fo_estilizarTexto_(primeiro.appendText('Não informado.'), 12, false);
  }
  primeiro.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY)
    .setSpacingAfter(8).setLineSpacing(1.15);

  blocos.forEach(function(bloco) {
    fo_appendParagrafoComRotulo_(celula, bloco);
  });
}

function fo_blocosNarrativos_(valor) {
  return fo_texto_(valor)
    .split(/\n\s*\n|\n(?=(?:\d+\.|[A-ZÁÉÍÓÚÂÊÔÃÕÇ][^:\n]{1,70}:))/)
    .map(fo_texto_)
    .filter(Boolean);
}

function fo_appendParagrafoComRotulo_(celula, bloco) {
  const p = celula.appendParagraph('');
  const encontrado = fo_texto_(bloco).match(/^((?:\d+\.\s*)?[^:\n]{2,80}:)\s*(.*)$/s);
  if (encontrado) {
    fo_estilizarTexto_(p.appendText(encontrado[1] + ' '), 12, true);
    fo_estilizarTexto_(p.appendText(encontrado[2]), 12, false);
  } else {
    fo_estilizarTexto_(p.appendText(fo_texto_(bloco)), 12, false);
  }
  p.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY)
    .setSpacingAfter(8).setLineSpacing(1.15);
  return p;
}

function fo_appendEspaco_(celula) {
  const p = celula.appendParagraph('');
  p.setSpacingAfter(4);
}

function fo_estilizarTexto_(texto, tamanho, negrito) {
  texto.setFontFamily('Arial')
    .setFontSize(tamanho)
    .setBold(Boolean(negrito))
    .setForegroundColor(FO_CONFIG.COR_TEXTO_DOCUMENTO)
    .setUnderline(false);
  try {
    texto.setLinkUrl(null);
  } catch (erro) {
    // O texto recém-criado já fica preto mesmo em versões sem remoção de link.
  }
  return texto;
}

function fo_estilizarParagrafo_(paragrafo, tamanho, negrito, alinhamento) {
  const texto = paragrafo.editAsText();
  if (texto.getText()) fo_estilizarTexto_(texto, tamanho, negrito);
  if (alinhamento) paragrafo.setAlignment(alinhamento);
  return paragrafo;
}

function fo_appendGradeFotos_(celula, fotos) {
  const linhas = [];
  for (let i = 0; i < fotos.length; i += 2) {
    linhas.push(['', '']);
    linhas.push(['', '']);
  }
  const grade = celula.appendTable(linhas);
  grade.setBorderWidth(1).setBorderColor('#000000');
  for (let i = 0; i < fotos.length; i++) {
    const bloco = Math.floor(i / 2) * 2;
    const coluna = i % 2;
    const destino = grade.getCell(bloco, coluna);
    destino.clear();
    destino.setVerticalAlignment(DocumentApp.VerticalAlignment.CENTER);
    const p = destino.appendParagraph('');
    p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    const imagem = p.appendInlineImage(fotos[i]);
    fo_dimensionarImagem_(imagem);
    const legenda = grade.getCell(bloco + 1, coluna);
    legenda.clear();
    legenda.appendParagraph('');
  }
  return grade;
}

function fo_dimensionarImagem_(imagem) {
  const larguraOriginal = imagem.getWidth();
  const alturaOriginal = imagem.getHeight();
  if (!larguraOriginal || !alturaOriginal) return;
  const escala = Math.min(
    FO_CONFIG.LARGURA_FOTO_PX / larguraOriginal,
    FO_CONFIG.ALTURA_FOTO_PX / alturaOriginal,
    1
  );
  imagem.setWidth(Math.round(larguraOriginal * escala));
  imagem.setHeight(Math.round(alturaOriginal * escala));
}

function fo_carregarFotos_(valor, protocolo) {
  return fo_separarLinks_(valor).reduce(function(blobs, link) {
    const id = fo_extrairIdDrive_(link);
    if (!id) return blobs;
    try {
      const blob = DriveApp.getFileById(id).getBlob();
      if (fo_texto_(blob.getContentType()).indexOf('image/') !== 0) {
        fo_registrarLog_('AVISO', 'fo_carregarFotos_', protocolo,
          'Arquivo ignorado porque não é uma imagem: ' + id);
        return blobs;
      }
      blobs.push(blob);
    } catch (erro) {
      fo_registrarLog_('AVISO', 'fo_carregarFotos_', protocolo,
        'Imagem sem acesso ou indisponível: ' + id + '. ' + erro.message);
    }
    return blobs;
  }, []);
}

function fo_forcarTextoPreto_(corpo) {
  try {
    const texto = corpo.editAsText();
    if (texto.getText()) {
      texto.setForegroundColor(FO_CONFIG.COR_TEXTO_DOCUMENTO);
    }
  } catch (erro) {
    fo_registrarLog_('AVISO', 'fo_forcarTextoPreto_', '',
      'Não foi possível normalizar a cor global: ' + erro.message);
  }
}

function fo_valorOuNaoFornecido_(valor) {
  return fo_texto_(valor) || 'Não fornecido';
}

function fo_valorOuNaoInformado_(valor) {
  return fo_texto_(valor) || 'Não informado';
}

function fo_arquivarArquivoAnterior_(arquivoId, novoId) {
  if (!arquivoId || arquivoId === novoId) return;
  try {
    const arquivo = DriveApp.getFileById(arquivoId);
    if (FO_CONFIG.MANTER_VERSOES_ANTERIORES) {
      arquivo.moveTo(fo_subpasta_('Versões Anteriores'));
    } else {
      arquivo.setTrashed(true);
    }
  } catch (erro) {
    fo_registrarLog_('AVISO', 'fo_arquivarArquivoAnterior_', '',
      'Não foi possível remover o arquivo anterior ' + arquivoId + ': ' + erro.message);
  }
}

function fo_removerCopiasMesmoNome_(pasta, nome, idManter) {
  const arquivos = pasta.getFilesByName(nome);
  while (arquivos.hasNext()) {
    const arquivo = arquivos.next();
    if (arquivo.getId() === idManter) continue;
    try {
      arquivo.setTrashed(true);
    } catch (erro) {
      fo_registrarLog_(
        'AVISO',
        'fo_removerCopiasMesmoNome_',
        '',
        'Não foi possível remover uma cópia de ' + nome + ': ' + erro.message
      );
    }
  }
}

function fo_atualizarMetadadosDocumento_(central, linhaBase, dados) {
  const aba = central.getSheetByName(FO_CONFIG.ABA_BASE_OFICIAL);
  aba.getRange(linhaBase, 24, 1, 4).setValues([[
    dados.documentoId, dados.pdfId, dados.hash, dados.geradoEm
  ]]);
  aba.getRange(linhaBase, 27).setNumberFormat('dd/MM/yyyy HH:mm:ss');
}

function fo_atualizarLinhaIndiceDocumento_(central, protocolo, documentoId, pdfId, data) {
  const aba = central.getSheetByName(FO_CONFIG.ABA_INDICE);
  const inicio = FO_CONFIG.PRIMEIRA_LINHA_INDICE;
  if (aba.getLastRow() < inicio) return;
  const protocolos = aba.getRange(inicio, 1, aba.getLastRow() - inicio + 1, 1).getValues();
  for (let i = 0; i < protocolos.length; i++) {
    if (fo_texto_(protocolos[i][0]) !== protocolo) continue;
    const linha = inicio + i;
    aba.getRange(linha, 7).setValue('PDF disponível')
      .setBackground(FO_CONFIG.CORES.VERDE_CLARO).setFontColor(FO_CONFIG.CORES.VERDE);
    aba.getRange(linha, 8).setRichTextValue(fo_linkDrive_(documentoId, 'Abrir ficha'));
    aba.getRange(linha, 9).setRichTextValue(fo_linkDrive_(pdfId, 'Baixar PDF'));
    aba.getRange(linha, 10).setValue(data).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    return;
  }
}

/** Prepara a fila do pacote referente ao mês escolhido em Fichas Oficiais!B3. */
function gerarPacoteMensalSelecionado(){painelAbrirPacote();}

function fo_pertenceAoPacoteMensal_(registro, mes) {
  if (!fo_deveGerarFichaOficial_(registro)) return false;
  const inicio = fo_inicioMes_(mes);
  const fim = fo_fimMes_(mes);
  const abertura = fo_data_(registro.dataAbertura);
  if (!fo_dataRelatorioValida_(abertura) || abertura > fim) return false;
  if (registro.status !== 'Concluída') return true;
  const conclusao = fo_data_(registro.dataConclusao);
  if (!conclusao || fo_texto_(registro.encerradoLegado) === 'SIM') return false;
  return conclusao >= inicio && conclusao <= fim;
}

/** Processa poucos PDFs por execução para evitar o limite de tempo do Apps Script. */
function continuarGeracaoPacoteMensal() {
  const propriedades = PropertiesService.getScriptProperties();
  const fila = JSON.parse(
    propriedades.getProperty(FO_CONFIG.PROPRIEDADE_FILA_MENSAL) || '[]'
  );
  const mesTexto = propriedades.getProperty(FO_CONFIG.PROPRIEDADE_MES_FILA);
  if (!fila.length || !mesTexto) {
    fo_removerGatilhosContinuacao_();
    return;
  }
  const mes = fo_data_(mesTexto);
  const lote = fila.splice(0, FO_CONFIG.TAMANHO_LOTE_PDF);
  lote.forEach(function(protocolo) {
    try {
      const gerado = gerarFichaOficialPorProtocolo_(protocolo, false);
      fo_copiarPdfParaPacote_(protocolo, gerado.pdfId, mes);
    } catch (erro) {
      fo_registrarLog_('ERRO', 'continuarGeracaoPacoteMensal', protocolo, erro.message);
    }
  });
  propriedades.setProperty(FO_CONFIG.PROPRIEDADE_FILA_MENSAL, JSON.stringify(fila));
  if (fila.length) {
    fo_agendarContinuacao_();
  } else {
    propriedades.deleteProperty(FO_CONFIG.PROPRIEDADE_FILA_MENSAL);
    propriedades.deleteProperty(FO_CONFIG.PROPRIEDADE_MES_FILA);
    fo_removerGatilhosContinuacao_();
    fo_registrarLog_('OK', 'continuarGeracaoPacoteMensal', '',
      'Pacote de ' + fo_nomeMesPasta_(mes) + '/' + mes.getFullYear() + ' concluído.');
  }
}

function fo_copiarPdfParaPacote_(protocolo, pdfId, mes) {
  if (!pdfId) throw new Error('PDF atual não encontrado para ' + protocolo);
  const pacotes = fo_subpasta_('Pacotes Mensais');
  const pastaAno = fo_obterOuCriarSubpasta_(pacotes, String(mes.getFullYear()));
  const pastaMes = fo_obterOuCriarSubpasta_(pastaAno, fo_nomeMesPasta_(mes));
  const nome = protocolo + '_Ficha_Atendimento.pdf';
  const anteriores = pastaMes.getFilesByName(nome);
  while (anteriores.hasNext()) {
    const anterior = anteriores.next();
    if (FO_CONFIG.MANTER_VERSOES_ANTERIORES) {
      anterior.moveTo(fo_obterOuCriarSubpasta_(pastaMes, 'Substituídos'));
    } else {
      anterior.setTrashed(true);
    }
  }
  DriveApp.getFileById(pdfId).makeCopy(nome, pastaMes);
}

function fo_obterOuCriarSubpasta_(pai, nome) {
  const pastas = pai.getFoldersByName(nome);
  return pastas.hasNext() ? pastas.next() : pai.createFolder(nome);
}

function fo_agendarContinuacao_() {
  const existe = ScriptApp.getProjectTriggers().some(function(gatilho) {
    return gatilho.getHandlerFunction() === 'continuarGeracaoPacoteMensal';
  });
  if (!existe) {
    ScriptApp.newTrigger('continuarGeracaoPacoteMensal').timeBased().after(60 * 1000).create();
  }
}

function fo_removerGatilhosContinuacao_() {
  ScriptApp.getProjectTriggers().forEach(function(gatilho) {
    if (gatilho.getHandlerFunction() === 'continuarGeracaoPacoteMensal') {
      ScriptApp.deleteTrigger(gatilho);
    }
  });
}

/**
 * Rotina automática principal. A base e o Controle de Manifestações são
 * atualizados sob uma única trava. A geração documental só começa depois da
 * liberação da trava, para que PDFs nunca bloqueiem a alimentação dos anexos.
 */
function atualizarAnexosAtendimentosAgendado() {
  const sinal = fo_lerSinalReinicio_();
  if (sinal.estado === 'EM ANDAMENTO') return;
  if (sinal.estado === 'RECRIAR FICHAS' &&
      PropertiesService.getScriptProperties().getProperty('FO_REINICIO_PROCESSADO') !== sinal.token) {
    try {
      const reinicio = fo_executarAgendadoComTrava_(function() {
        fo_processarReinicioSolicitadoSemTrava_(sinal);
      });
      if (!reinicio.executado) {
        fo_registrarLog_('AVISO', 'atualizarAnexosAtendimentosAgendado', '',
          'Reinício adiado porque outra rotina estava em execução.');
      }
    } catch (erro) {
      fo_registrarLog_('ERRO', 'atualizarAnexosAtendimentosAgendado', '', erro.message);
    }
    return;
  }
  if (PropertiesService.getScriptProperties()
    .getProperty(FO_CONFIG.PROPRIEDADE_MANUTENCAO) === 'SIM') {
    return;
  }
  try {
    const atualizacao = fo_executarAgendadoComTrava_(function() {
      const registros = fo_sincronizarBaseFichasOficiaisSemTrava_();
      let controle = null;
      if (PropertiesService.getScriptProperties()
        .getProperty(FO_CONFIG.PROPRIEDADE_CONTROLE_ATIVO) === 'SIM') {
        controle = fo_atualizarControleManifestacoesSemTrava_();
      }
      return {registros: registros, controle: controle};
    });
    if (!atualizacao.executado) {
      fo_registrarLog_('AVISO', 'atualizarAnexosAtendimentosAgendado', '',
        'Execução adiada porque outra rotina estava em andamento.');
      return;
    }

    const central = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
    const pendentes = fo_lerRegistrosBaseOficial_(central).filter(function(registro) {
      if (!fo_deveGerarFichaOficial_(registro)) return false;
      return fo_hashOficialRegistro_(registro) !== registro.hashOficial ||
        !registro.documentoId || !registro.pdfId;
    }).slice(0, FO_CONFIG.TAMANHO_LOTE_PDF);
    pendentes.forEach(function(registro) {
      try {
        gerarFichaOficialPorProtocolo_(registro.protocolo, false);
      } catch (erro) {
        fo_registrarLog_('ERRO', 'atualizarAnexosAtendimentosAgendado',
          registro.protocolo, erro.message);
      }
    });
  } catch (erro) {
    PropertiesService.getScriptProperties().setProperty(
      FO_CONFIG.PROPRIEDADE_ULTIMO_ERRO_CONTROLE,
      new Date().toISOString() + ' | ' + erro.message
    );
    fo_registrarLog_('ERRO', 'atualizarAnexosAtendimentosAgendado', '', erro.message);
  }
}

/** Compatibilidade com gatilhos antigos. */
function sincronizarFichasOficiaisAgendado() {
  return atualizarAnexosAtendimentosAgendado();
}

function fo_executarAgendadoComTrava_(callback) {
  const trava = LockService.getScriptLock();
  if (!trava.tryLock(5000)) return {executado: false, valor: null};
  try {
    return {executado: true, valor: callback()};
  } finally {
    trava.releaseLock();
  }
}

/* ========================================================================== *
 * REINÍCIO E FORMATAÇÃO DO SISTEMA 2.0
 * ========================================================================== */

/** Reaplica o visual e atualiza os produtos sem apagar dados. */
function formatarSistemaFichasOficiais() {
  sincronizarBaseFichasOficiais();
  const anexos = SpreadsheetApp.openById(FO_CONFIG.ANEXOS_RELATORIO_ID);
  const controle = fo_localizarAbaControle_(anexos);
  fo_organizarControleManifestacoes_(controle);
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Fichas, demandas e Controle de Manifestações formatados.',
      'Fichas SABESP',
      6
    );
  } catch (erro) {}
}

/** Conclui imediatamente o reinício solicitado pela Central de Atendimentos. */
function concluirReinicioSistemaFichasOficiais() {
  const sinal = fo_lerSinalReinicio_();
  if (sinal.estado !== 'RECRIAR FICHAS') {
    throw new Error(
      'Nenhum reinício está pendente. Execute primeiro REINICIAR SISTEMA DO ZERO ' +
      'na planilha Procedimentos de Campo.'
    );
  }
  const resultado = fo_executarComTravaScript_('a conclusão do reinício', function() {
    return fo_processarReinicioSolicitadoSemTrava_(sinal);
  });
  gerarFichasOficiaisPendentes();
  try {
    SpreadsheetApp.getUi().alert(
      'Reinício concluído',
      'A base oficial, o índice, as demandas e os anexos foram reconstruídos. ' +
        resultado.arquivosExcluidos + ' arquivo(s) antigo(s) foram enviados à lixeira. ' +
        'As fichas novas serão geradas em lotes de ' + FO_CONFIG.TAMANHO_LOTE_PDF + '.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (erro) {}
  return resultado;
}

function fo_lerSinalReinicio_() {
  try {
    const central = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
    const aba = central.getSheetByName(FO_CONFIG.ABA_CONFIGURACAO);
    if (!aba || aba.getMaxRows() < 10 || aba.getMaxColumns() < 3) {
      return {token: '', estado: ''};
    }
    const linha = aba.getRange('A10:C10').getValues()[0];
    if (fo_texto_(linha[0]) !== 'REINICIO_SISTEMA') return {token: '', estado: ''};
    return {
      token: fo_texto_(linha[1]),
      estado: fo_texto_(linha[2]).toUpperCase()
    };
  } catch (erro) {
    return {token: '', estado: ''};
  }
}

function fo_processarReinicioSolicitadoSemTrava_(sinal) {
  validarModeloFichaOficialSabesp();
  const central = SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
  const base = central.getSheetByName(FO_CONFIG.ABA_BASE_CENTRAL);
  if (!base || base.getLastRow() < 2) {
    throw new Error(
      'A Base de Atendimentos ainda não foi reconstruída. Nenhuma ficha foi apagada.'
    );
  }

  const propriedades = PropertiesService.getScriptProperties();
  propriedades.setProperty(FO_CONFIG.PROPRIEDADE_MANUTENCAO, 'SIM');
  try {
    fo_removerGatilhosAtualizacaoFichas_();
    fo_removerGatilhosContinuacao_();
    propriedades.deleteProperty(FO_CONFIG.PROPRIEDADE_FILA_ATUALIZACAO);
    propriedades.deleteProperty(FO_CONFIG.PROPRIEDADE_FILA_MENSAL);
    propriedades.deleteProperty(FO_CONFIG.PROPRIEDADE_MES_FILA);
    propriedades.deleteProperty('FO_ULTIMO_BACKUP_CONTROLE');

    const arquivos = fo_esvaziarArquivosGeradosDoSistema_();
    const paginas = fo_limparPaginasOficiaisDoSistema_(central);
    fo_prepararEstruturaCentral_();
    propriedades.setProperty(FO_CONFIG.PROPRIEDADE_CONTROLE_ATIVO, 'SIM');
    const registros = fo_sincronizarBaseFichasOficiaisSemTrava_();
    const controle = fo_atualizarControleManifestacoesSemTrava_();
    propriedades.setProperty('FO_REINICIO_PROCESSADO', sinal.token);
    const configuracao = central.getSheetByName(FO_CONFIG.ABA_CONFIGURACAO);
    configuracao.getRange('A10:C10').setValues([
      ['REINICIO_SISTEMA', sinal.token, 'CONCLUÍDO']
    ]);
    fo_registrarLog_(
      'OK',
      'fo_processarReinicioSolicitadoSemTrava_',
      '',
      'Reinício processado com ' + registros + ' registro(s) e ' +
        controle.atualizados + ' linha(s) nos anexos.'
    );
    return {
      arquivosExcluidos: arquivos.excluidos,
      falhasArquivos: arquivos.falhas,
      paginasExcluidas: paginas,
      registros: registros
    };
  } finally {
    propriedades.deleteProperty(FO_CONFIG.PROPRIEDADE_MANUTENCAO);
  }
}

function fo_limparPaginasOficiaisDoSistema_(central) {
  const nomes = {};
  [
    FO_CONFIG.ABA_BASE_OFICIAL,
    FO_CONFIG.ABA_INDICE,
    FO_CONFIG.ABA_REVISAO,
    FO_CONFIG.ABA_AVISOS_PROTOCOLO,
    FO_CONFIG.ABA_AVISOS_PROTOCOLO_LEGADA,
    FO_CONFIG.ABA_LOG
  ].forEach(function(nome) { nomes[nome] = true; });
  let total = 0;
  central.getSheets().slice().forEach(function(aba) {
    const nome = aba.getName();
    if (!nomes[nome] && !/^ATD(?:\d{8}|-\d{4})$/i.test(nome)) return;
    if (central.getSheets().length <= 1) return;
    central.deleteSheet(aba);
    total++;
  });
  return total;
}

function fo_esvaziarArquivosGeradosDoSistema_() {
  const raiz = fo_garantirPastas_();
  const total = {excluidos: 0, falhas: 0};
  fo_esvaziarPastaRecursiva_(raiz, total);
  return total;
}

function fo_esvaziarPastaRecursiva_(pasta, total) {
  const arquivos = pasta.getFiles();
  while (arquivos.hasNext()) {
    try {
      arquivos.next().setTrashed(true);
      total.excluidos++;
    } catch (erro) {
      total.falhas++;
    }
  }
  const filhas = pasta.getFolders();
  while (filhas.hasNext()) fo_esvaziarPastaRecursiva_(filhas.next(), total);
}

/** Limpeza de apresentação, sem modificar o texto original do Histórico.
 * Só remove linhas inteiras conhecidas como ausência de observação.
 * Não remove relatos de pendências, discordância ou reparos não realizados.
 */
function fo_textoNarrativoLimpo_(valor) {
  const vazios = new Set(['nenhuma observacao','nenhuma observacao extra',
    'sem observacao','sem observacoes','nenhuma observacao adicional',
    'nao informado','nao informada','nao ha observacoes','nao houve observacoes',
    'reparo ou encaminhamento outro','pendencias registradas nao servico finalizado']);
  return fo_texto_(valor).split(/\r?\n/).filter(function(linha) {
    return !vazios.has(fo_normalizar_(linha));
  }).join('\n').replace(/\n[ \t]*\n(?:[ \t]*\n)+/g,'\n\n').trim();
}

function fo_textoPublico_(valor) {
 return fo_textoNarrativoLimpo_(valor).split(/\n/).map(function(l){
 if (/^(ni|n\/i)$/i.test(l.trim())) return '';
 l=l.trim().replace(/^Canal(?:\s+interno)?:\s*.*?(?=Resultado:|$)/gi,'').trim();
 l=l.replace(/^(Devolutiva ao cliente|Resultado|Comentário|Observação|Observações):\s*/i,'');
 if (/^(Outro[.!]?|Reparo ou encaminhamento: Outro[.!]?|Nenhuma observa[çc][ãa]o(?: extra| adicional)?[.!]?|N[ãa]o houve observa[çc][õo]es[.!]?|N[ãa]o informado[.!]?|Cliente informado e ciente[.!]?|Cliente informado,? mas discordou[.!]?)$/i.test(l)) return '';
 return l;
 }).filter(Boolean).join('\n\n');
}


function fo_eventoDemandaRegistrado_(central, chave) {
  const h = central.getSheetByName(FO_CONFIG.ABA_HISTORICO_CENTRAL);
  if (!h || h.getLastRow() < 2) return null;
  const evento = 'TAREFA_ATENDIMENTO|' + chave;
  const linhas = h.getRange(2, 1, h.getLastRow() - 1, 21).getValues();
  const r = linhas.find(function(r) { return r[17] === evento; });
  return r ? {data: r[1], observacao: r[6], autor: r[2]} : null;
}

function fo_reconciliarChecklist_(central, tarefas, existentes) {
  const h = central.getSheetByName(FO_CONFIG.ABA_HISTORICO_CENTRAL);
  if (!h || h.getLastRow() < 2) return;
  const linhas = h.getRange(2, 1, h.getLastRow() - 1, 21).getValues();
  const porChave = {}, ultimo = {};
  linhas.forEach(function(r) {
    const chave = fo_texto_(r[17]), data = fo_data_(r[1]);
    if (!data) return;
    if (chave.indexOf('TAREFA_ATENDIMENTO|') === 0) porChave[chave.slice('TAREFA_ATENDIMENTO|'.length)] = r;
    // Uma comunicação do protocolo não gera, sozinha, outra cobrança da Execução.
    if (r[14] === 'Comunicação de protocolo' || r[14] === 'Ciência administrativa') return;
    if (!ultimo[r[0]] || data > fo_data_(ultimo[r[0]][1])) ultimo[r[0]] = r;
  });
  tarefas.forEach(function(tarefa) {
    const r = tarefa.registro, u = ultimo[r.protocolo];
    const prefixo = 'TAREFA_ATENDIMENTO|ACOMPANHAR_RETORNO_DA_EXECUCAO|' + r.protocolo + '|';
    if (tarefa.tipo === 'Acompanhar retorno da execução' && u && fo_texto_(u[17]).indexOf(prefixo) === 0) {
      const proximaCobranca = fo_adicionarDiasUteis_(fo_data_(u[1]), fo_intervaloAcompanhamento_(r.urgencia));
      proximaCobranca.setHours(0, 0, 0, 0);
      if (new Date() < proximaCobranca) {
        tarefa.chave = u[17].slice('TAREFA_ATENDIMENTO|'.length);
      } else {
        tarefa.chave = prefixo.slice('TAREFA_ATENDIMENTO|'.length) + String(fo_data_(u[1]).getTime());
        tarefa.prazo = proximaCobranca;
      }
    }
    const salvo = porChave[tarefa.chave], anterior = existentes[tarefa.chave] || {};
    if (salvo) existentes[tarefa.chave] = {
      realizada: true, dataRealizacao: anterior.dataRealizacao || salvo[1],
      observacao: anterior.observacao || salvo[6] || ''
    };
    tarefa.realizada = Boolean(existentes[tarefa.chave] && existentes[tarefa.chave].realizada);
  });
  tarefas.sort(function(a, b) { return Number(a.realizada) - Number(b.realizada); });
}

/** Vínculos são persistentes no Controle. Respostas e eventos de origem nunca são apagados. */
const AF_CENTRAL_ID='1UHs_jFVD7jQRKgw7CVPCQ8R7sgvyhkJVv5rcj0v2K5g';
const AF_ABA='Vínculos de protocolos';
const AF_CAB=['Protocolo incorporado','Protocolo principal','ID origem','ID principal','Chave origem','Chave principal','Estado','Data','Autor','Motivo','Arquivo de preservação','Dados públicos de origem'];
let AF_CACHE=null;
function af_vinculos_(){if(AF_CACHE)return AF_CACHE;const sh=SpreadsheetApp.openById(AF_CENTRAL_ID).getSheetByName(AF_ABA);if(!sh)return AF_CACHE=[];const v=sh.getDataRange().getValues();if(JSON.stringify(v[0])!==JSON.stringify(AF_CAB))throw Error('Cabeçalhos dos vínculos alterados. Confira antes de continuar.');return AF_CACHE=v.slice(1).filter(r=>r[6]==='ATIVA').map(r=>({origem:String(r[0]),principal:String(r[1]),idOrigem:String(r[2]),idPrincipal:String(r[3]),chaveOrigem:r[4],chavePrincipal:r[5],data:r[7],autor:r[8],motivo:r[9],arquivo:r[10],publico:r[11]?JSON.parse(r[11]):{}}));}
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

function painelPreviaMescla(p){
 if(!p||!p.origem||!p.principal||p.origem===p.principal)throw Error('Escolha duas fichas diferentes: a incorporada e a principal.');
 if(af_incorporado_(p.origem)||af_incorporado_(p.principal))throw Error('Uma das fichas já foi incorporada. Atualize a carteira.');
 const ss=hec_central_(),rs=fo_lerRegistrosBaseOficial_(ss),origem=rs.find(r=>r.protocolo===p.origem),principal=rs.find(r=>r.protocolo===p.principal);
 if(!origem||!principal)throw Error('As duas fichas precisam existir na carteira atual.');
 if([origem,principal].some(r=>r.status==='Concluída'||r.historicoEntregue==='SIM'||/^HIST/.test(r.chave)))throw Error('Esta mesclagem é para fichas ainda abertas. Documentos históricos ou encerrados exigem revisão específica.');
 const h=ss.getSheetByName(FO_CONFIG.ABA_HISTORICO_CENTRAL).getDataRange().getValues(),ids=[origem.idLegado,origem.protocolo,principal.idLegado,principal.protocolo];
 const historicos=h.filter((r,i)=>i===0||ids.includes(String(r[0]))),comunicacoes=painelLerComunicacao_('').filter(e=>[p.origem,p.principal].includes(e.protocolo));
 const fila=ss.getSheetByName('Solicitações do Painel');if(fila&&fila.getLastRow()>1){const pendentes=fila.getDataRange().getValues().slice(1).filter(r=>r[3]&&r[3]!=='CONCLUÍDA'&&r[3]!=='ERRO');if(pendentes.some(r=>{let d;try{d=JSON.parse(r[2]);}catch(e){return true;}return !d.protocolo||[origem.protocolo,principal.protocolo].includes(d.protocolo);}))throw Error('Há solicitações pendentes para estas fichas ou uma atualização geral. Aguarde a conclusão antes de mesclar.');}
 const assinatura=fo_hash_(JSON.stringify([origem,principal,historicos,comunicacoes]));
 return {origem:{id:origem.protocolo,nome:origem.nome,endereco:origem.endereco,demanda:origem.solicitacao,status:origem.status},principal:{id:principal.protocolo,nome:principal.nome,endereco:principal.endereco,demanda:principal.solicitacao,status:principal.status},assinatura,eventos:historicos.length-1,mensagens:comunicacoes.length};
}
function painelConfirmarMescla(p){
 if(!p||p.confirmado!==true||!fo_texto_(p.motivo)||p.motivo.length>1500)throw Error('Registre o motivo e confirme que as duas fichas tratam da mesma demanda.');
 let resultado;const lock=LockService.getScriptLock();if(!lock.tryLock(1500))throw Error('Há outra alteração em andamento. Sua conferência foi preservada; tente novamente.');
 try{
  AF_CACHE=null;const prev=painelPreviaMescla(p);if(prev.assinatura!==p.assinatura)throw Error('As fichas foram atualizadas. Confira novamente antes de mesclar.');
  const ss=hec_central_(),rs=fo_lerRegistrosBaseOficial_(ss),o=rs.find(r=>r.protocolo===p.origem),d=rs.find(r=>r.protocolo===p.principal),autor=Session.getActiveUser().getEmail();if(!autor)throw Error('Não foi possível identificar quem está confirmando a mesclagem.');
  let sh=ss.getSheetByName(AF_ABA);if(!sh){sh=ss.insertSheet(AF_ABA);sh.getRange(1,1,1,AF_CAB.length).setValues([AF_CAB]);sh.hideSheet();}af_vinculos_();
  const historico=ss.getSheetByName(FO_CONFIG.ABA_HISTORICO_CENTRAL).getDataRange().getValues(),ids=[o.idLegado,o.protocolo,d.idLegado,d.protocolo];const preservado={versao:1,data:new Date().toISOString(),autor,motivo:p.motivo,origem:o,principal:d,historico:historico.filter((r,i)=>i===0||ids.includes(String(r[0]))),comunicacoes:painelLerComunicacao_('').filter(e=>[o.protocolo,d.protocolo].includes(e.protocolo))};
  const file=DriveApp.createFile(Utilities.newBlob(JSON.stringify(preservado,null,2),'application/json','Preservacao_'+o.protocolo+'_em_'+d.protocolo+'_'+Utilities.getUuid()+'.json'));
  const publico={nome:o.nome,assunto:o.assunto,solicitacao:o.solicitacao,solucao:o.solucao,fotos:[o.fotosAbertura,o.fotosSolucao].filter(Boolean).join('\n')};const texto=JSON.stringify(publico);if(texto.length>45000)throw Error('Ficha muito extensa para mesclagem automática. A cópia de preservação foi salva; nenhuma ficha foi incorporada.');
  sh.appendRow([o.protocolo,d.protocolo,o.idLegado||o.protocolo,d.idLegado||d.protocolo,o.chave,d.chave,'ATIVA',new Date(),autor,/^[=+@-]/.test(p.motivo)?"'"+p.motivo:p.motivo,file.getId(),texto]);SpreadsheetApp.flush();AF_CACHE=null;
  // Apenas o vínculo foi gravado. A sincronização normal refaz a base pública e os índices.
  resultado = {ok:true,principal:d.protocolo,mensagem:o.protocolo+' foi incorporado a '+d.protocolo+'. Históricos e evidências preservados. As cópias serão atualizadas pela sincronização.'};
 }finally{lock.releaseLock();}
 try{painelRegistrarPedido_('ATUALIZAR',{});}catch(e){resultado.mensagem+=' Solicite Atualizar dados: '+e.message;}
 return resultado;
}
function af_eventosCompartilhados_(){return af_vinculos_().map(v=>({linha:0,chave:'MESCLA|'+v.origem,protocolo:af_resolver_(v.principal),protocoloOrigem:v.origem,dataHora:v.data,usuario:v.autor,areaAutora:'Atendimento',destino:'',tipo:'Ficha incorporada',mensagem:'Protocolo '+v.origem+' incorporado. Motivo: '+v.motivo+'\nSolicitação original: '+(v.publico.solicitacao||v.publico.assunto||'')+'\nProvidências originalmente registradas: '+(v.publico.solucao||'Não informadas.'),arquivos:v.publico.fotos||'',lidoAtendimento:v.data,lidoExecucao:v.data,origem:'Mesclagem rastreável'}));}
function af_reservarProtocolos_(registros){const vs=af_vinculos_();registros.forEach(r=>{const v=vs.find(x=>x.chaveOrigem===r.chave);if(v)r.protocolo=v.origem;});}

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

function af_responsavel_(valor){
 const n=af_norm_(valor);
 if(/execu|engenharia|concrejato|catui|obra|producao|operacao|operacional|manutencao|equipe de campo/.test(n))return 'Execução';
 return 'Atendimento';
}
function af_destino_(valor){if(!['Atendimento','Execução'].includes(String(valor||'').trim()))throw Error('Escolha Atendimento ou Execução.');return String(valor).trim();}

/** Simple bound-sheet opening: only creates UI; data loads later in the user's authorized RPC. */
function onOpen(e){
 aoAbrirFichasOficiaisSabesp();
 try{const html=HtmlService.createHtmlOutput(painelHtml_('carteira')).setWidth(1440).setHeight(800);SpreadsheetApp.getUi().showModalDialog(html,'Atendimento | Painel de Trabalho 3.5.0');}
 catch(erro){console.warn('Abertura automática: '+erro.message+'. Use ATENDIMENTO > Abrir Painel de Trabalho.');}
}

/** Reconciliação acumulativa 3.2.1. Nunca limpa o controle para reconstruí-lo. */
function fo321_dia_(v) {
  if(v instanceof Date&&!isNaN(v))return Utilities.formatDate(v,'America/Sao_Paulo','yyyy-MM-dd');
  if(typeof v==='number'&&v>30000&&v<80000)return new Date(Math.floor(v-25569)*86400000).toISOString().slice(0,10);
  const s=fo_texto_(v),m=s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})(?:\s|$)/);
  if(m){let day=+m[1],month=+m[2];if(month>12&&day<=12){const x=month;month=day;day=x;}const d=new Date(Date.UTC(+m[3],month-1,day));if(d.getUTCFullYear()===+m[3]&&d.getUTCMonth()===month-1&&d.getUTCDate()===day)return d.toISOString().slice(0,10);}
  if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
  return 'texto:'+s;
}
function fo321_identidade_(r){return JSON.stringify([fo321_dia_(r[0]),r[1],r[2],r[6]].map((x,i)=>i?fo_normalizar_(x):x));}
function fo321_idNota_(nota){const m=String(nota||'').match(/(?:^|\n)CPT_ATD_ID=([^\n]+)/);return m?decodeURIComponent(m[1]):'';}
function fo321_nota_(nota,id){return String(nota||'').replace(/(?:^|\n)CPT_ATD_ID=[^\n]*/g,'').trim()+ '\nCPT_ATD_ID='+encodeURIComponent(id);}
function fo321_valor_(v){return typeof v==='string'&&/^\s*=/.test(v)?"'"+v:v;}
function fo321_igual_(a,b){return a instanceof Date&&b instanceof Date?a.getTime()===b.getTime():a===b;}
function fo321_corStatus_(s,row,status){const done=fo_statusInterno_(status)==='Concluída';s.getRange(row,9).setBackground(done?'#E3F3E9':'#FFF0D5').setFontColor(done?'#23835D':'#9A5708').setFontWeight('bold').setHorizontalAlignment('center');}
function fo321_linha_(r){return [r.dataAbertura,r.nome,r.endereco,r.canalRecebimento||'Não informado',fo_tipoManifestacaoRelatorio_(r),r.frente,r.solicitacao,fo_textoPublico_(r.solucao),fo_statusRelatorio_(r.status),fo_textoPublico_(r.finalizacao)].map(v=>v==null?'':v);}
function fo321_planejar_(rows,notes,registros){
  const byId=new Map(),byContent=new Map(),claimed=new Set(),updates=[],adds=[],seen=new Set();
  rows.forEach((r,i)=>{if(!r.some(v=>v!==''&&v!=null))return;const id=fo321_idNota_((notes[i]||[])[0]);if(id){if(byId.has(id))throw Error('Vínculo duplicado no controle: '+id+'. Confira as linhas antes de sincronizar.');byId.set(id,i);}const key=fo321_identidade_(r);if(!byContent.has(key))byContent.set(key,[]);byContent.get(key).push(i);});
  registros.forEach(r=>{
    const values=fo321_linha_(r),id=fo_texto_(r.protocolo||r.chave||r.idLegado);
    if(!id)throw Error('Registro da Central sem identificador. Nenhum dado foi apagado.');if(seen.has(id))throw Error('Identificador duplicado na Central: '+id);seen.add(id);
    let i=byId.get(id);
    if(i===undefined){
      const candidates=(byContent.get(fo321_identidade_(values))||[]).filter(k=>!claimed.has(k)&&!fo321_idNota_((notes[k]||[])[0]));
      if(candidates.length>1)throw Error('Mais de uma linha corresponde a '+id+'. Confira a duplicidade; o histórico foi preservado.');
      if(candidates.length===1){const k=candidates[0];if(fo_statusInterno_(rows[k][8])==='Concluída'&&fo_statusInterno_(values[8])!=='Concluída')throw Error('O caso '+id+' consta concluído nos anexos e aberto na Central. Confira a divergência; nenhum histórico foi reaberto.');i=k;}
    }
    if(i===undefined){adds.push({values,id});return;}
    claimed.add(i);
    // Uma resposta vazia da Central não apaga uma providência/observação manual.
    [7,9].forEach(k=>{if(!fo_texto_(values[k])&&fo_texto_(rows[i][k]))values[k]=rows[i][k];});
    updates.push({index:i,values,id,note:fo321_nota_((notes[i]||[])[0],id)});
  });
  return {updates,adds};
}
function fo_atualizarControleManifestacoesSemTrava_(){
  const central=SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID),registros=fo_lerRegistrosBaseOficial_(central).filter(fo_deveEntrarControleManifestacoes_);
  const anexos=SpreadsheetApp.openById(FO_CONFIG.ANEXOS_RELATORIO_ID),s=fo_localizarAbaControle_(anexos),range=s.getRange(1,1,Math.max(1,s.getLastRow()),10),data=range.getValues(),notes=range.getNotes(),formulas=range.getFormulas();
  const header=fo_encontrarLinhaCabecalho_(data,['Data','Nome','Status']);if(header<0)throw Error('Cabeçalho do Controle não localizado. Nada foi alterado.');
  const first=header+2,body=data.slice(header+1),plan=fo321_planejar_(body,notes.slice(header+1),registros);
  let last=header+1;data.forEach((r,i)=>{if(i>header&&r.some(v=>v!==''&&v!=null))last=i+1;});
  let changed=0;
  // Sem clearContent: mesmo uma falha de serviço mantém as linhas anteriores.
  plan.updates.forEach(u=>{const row=first+u.index,old=body[u.index],fs=formulas[row-1],v=u.values.map((x,j)=>fs[j]||fo321_valor_(x));
    if(u.values.some((x,j)=>!fs[j]&&!fo321_igual_(x,old[j]))){s.getRange(row,1,1,10).setValues([v]);fo321_corStatus_(s,row,u.values[8]);changed++;}
    if(u.note!==notes[row-1][0])s.getRange(row,1).setNote(u.note);
  });
  if(plan.adds.length){fo_garantirDimensoes_(s,last+plan.adds.length,10);const dest=s.getRange(last+1,1,plan.adds.length,10);
    if(last>=first)s.getRange(first,1,1,10).copyFormatToRange(s,1,10,last+1,last+plan.adds.length);
    dest.setValues(plan.adds.map(x=>x.values.map(fo321_valor_))).setWrap(true).setVerticalAlignment('top');
    s.getRange(last+1,1,plan.adds.length,1).setNumberFormat('dd/MM/yyyy').setNotes(plan.adds.map(x=>[fo321_nota_('',x.id)]));s.setRowHeights(last+1,plan.adds.length,90);
    plan.adds.forEach((x,i)=>fo321_corStatus_(s,last+1+i,x.values[8]));
  }
  SpreadsheetApp.flush();const props=PropertiesService.getScriptProperties();props.setProperty(FO_CONFIG.PROPRIEDADE_ULTIMA_ATUALIZACAO_CONTROLE,new Date().toISOString());props.deleteProperty(FO_CONFIG.PROPRIEDADE_ULTIMO_ERRO_CONTROLE);
  const result={atualizados:changed,inseridos:plan.adds.length,preservados:body.filter(r=>r.some(v=>v!==''&&v!=null)).length,reordenado:false,datasInvalidas:body.filter(r=>r.some(v=>v!==''&&v!=null)&&fo321_dia_(r[0]).startsWith('texto:')).length};console.log(JSON.stringify(result));return result;
}
function fo321_restaurarHistorico_(){
  const s=fo_localizarAbaControle_(SpreadsheetApp.openById(FO_CONFIG.ANEXOS_RELATORIO_ID)),data=s.getRange(1,1,Math.max(1,s.getLastRow()),10).getValues(),header=fo_encontrarLinhaCabecalho_(data,['Data','Nome','Status']);
  if(header<0)throw Error('Cabeçalho do controle não localizado.');
  const seen=new Set(data.slice(header+1).filter(r=>r[1]).map(fo321_identidade_));let last=header+1;data.forEach((r,i)=>{if(i>header&&r.some(v=>v!==''&&v!=null))last=i+1;});
  const add=[];FO321_HISTORICO_AGOSTO.forEach(x=>{const v=x.values.slice();v[0]=/^\d{4}-\d{2}-\d{2}$/.test(x.dateIso)?new Date(x.dateIso+'T12:00:00-03:00'):x.dateIso;const key=fo321_identidade_(v);if(!seen.has(key)){seen.add(key);add.push(v);}});
  if(add.length){fo_garantirDimensoes_(s,last+add.length,10);if(last>header+1)s.getRange(header+2,1,1,10).copyFormatToRange(s,1,10,last+1,last+add.length);
    s.getRange(last+1,1,add.length,10).setValues(add.map(r=>r.map(fo321_valor_))).setWrap(true).setVerticalAlignment('top');s.getRange(last+1,1,add.length,1).setNumberFormat('dd/MM/yyyy');s.setRowHeights(last+1,add.length,120);add.forEach((x,i)=>fo321_corStatus_(s,last+1+i,x[8]));SpreadsheetApp.flush();}
  return add.length;
}
function corrigirHistoricoManifestacoesEAtualizarMensagem(){
  const active=SpreadsheetApp.getActiveSpreadsheet();if(!active||active.getId()!==FO_CONFIG.CENTRAL_ID)throw Error('Execute no Apps Script do Controle de Atendimentos.');
  const result=fo_executarComTravaScript_('a recuperação do histórico',function(){const recuperados=fo321_restaurarHistorico_();return {recuperados,sincronizacao:fo_atualizarControleManifestacoesSemTrava_()};});
  if(typeof gerarAcompanhamentoDiario==='function'&&typeof ad_cfg_==='function'&&ad_cfg_()){gerarAcompanhamentoDiario();result.mensagem='Histórico preservado. Nova mensagem solicitada para o próximo ciclo da automação.';}else result.mensagem='Histórico preservado. O módulo de comunicação ainda não está instalado.';
  console.log(JSON.stringify(result));active.toast(result.recuperados+' históricos recuperados. '+result.mensagem,'Atendimento',10);return result;
}

// REDIGIDO no repositório: 38 casos de agosto/2025 com nomes e endereços de munícipes. Restauração já executada; original fora do Git.
const FO321_HISTORICO_AGOSTO=[];
