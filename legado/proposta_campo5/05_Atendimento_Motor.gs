/** CPT 5 · regras do atendimento 4.9 preservadas. Sem reset, instaladores ou painéis redundantes. */
const CONFIG_CENTRAL_ATENDIMENTOS = Object.freeze({
  VERSAO: '4.9.0',
  DESTINO_ID: '1UHs_jFVD7jQRKgw7CVPCQ8R7sgvyhkJVv5rcj0v2K5g',
  ANEXOS_RELATORIO_ID: '1Et4M0nr4CxlRj7J6EDoru91aC4PJ-G2Y',
  PLANILHA_EXECUCAO_ID: '1Y5zioMOTaJDtp78OPBovXeHhvuns_ZEG6SMyHqng-Uk',
  PLANILHA_SATISFACAO_ATENDIMENTO_ID: '1QlNjWWIHhQYEVvw5fWrKGQmGVqGYmH5B2237ajwmedI',
  ABA_COMUNICACAO_EXECUCAO: 'Comunicação entre Áreas',
  ABA_CONSOLIDADA: 'Base Consolidada',
  ABA_RESUMO_ORIGEM: 'Atendimentos',
  ABA_FICHA_LEGADA: 'Ficha de Atendimento',
  ABA_DASHBOARD: 'Dashboard',
  ABA_INDICADORES: 'Indicadores',
  ABA_BASE: 'Base de Atendimentos',
  ABA_HISTORICO: 'Histórico',
  ABA_FINALIZACOES_PENDENTES: 'Finalizações pendentes',
  ABA_CORRECOES_FICHA: 'Correções da Ficha Final de Atendimento',
  PROCEDIMENTO: 'Ficha de Atendimento',
  PROCEDIMENTO_FINALIZACAO: 'Finalização de Atendimento',
  DATA_INICIO_PROTOCOLO_NOVO: new Date(2026, 8, 1),
  EMPRESA: 'Consórcio Performance Tamanduateí',
  LINHA_CABECALHO_DASHBOARD: 9,
  PRIMEIRA_LINHA_DASHBOARD: 10,
  LINHA_CABECALHO_RESUMO: 9,
  PRIMEIRA_LINHA_RESUMO: 10,
  STATUS: Object.freeze(['Recebida', 'Em andamento', 'Concluída']),
  PROCEDENCIAS: Object.freeze(['Em análise', 'Procedente', 'Não procedente']),
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
    ROXO: '#6B5FA7',
    ROXO_CLARO: '#ECE8F7',
    AMARELO_EDITAVEL: '#FFF8D9',
    CINZA: '#667581',
    CINZA_CLARO: '#F3F7FA',
    BORDA: '#B8C7D3',
    TEXTO: '#233247',
    BRANCO: '#FFFFFF'
  })
});
const CABECALHOS_DASHBOARD_CENTRAL = Object.freeze([
  'ID',
  'Data de abertura',
  'Urgência',
  'Nome do solicitante',
  'Telefone',
  'Endereço',
  'Solicitação',
  'Abrir ficha',
  'Status',
  'Procedência',
  'Responsável pela resolutiva',
  'Observação / tratativa atual',
  'Última edição',
  'Data de conclusão',
  '✓ Confirmar atualização'
]);
const CABECALHOS_BASE_CENTRAL = Object.freeze([
  'Chave de origem', 'ID', 'Linha de origem', 'Carimbo de data/hora',
  'Data do atendimento', 'Horário do recebimento', 'Momento da ficha',
  'Status no registro', 'Empresa contratada', 'Responsável pelo registro',
  'Local', 'Assunto', 'Tipo de manifestação', 'Nome do solicitante',
  'Telefones', 'E-mail', 'Endereço do solicitante', 'Solicitação',
  'Tratativa inicial', 'Grau de urgência', 'Segmento para encaminhamento',
  'Possível sinistro/reparo?', 'Responsável inicial pelo acompanhamento',
  'Imagens/arquivos', 'Informações ficaram claras?',
  'Interesse em grupo de comunicação?', 'Nota do atendimento',
  'Ponto de referência', 'Tipo do local', 'Descrição detalhada da ocorrência',
  'Área responsável', 'Procedimento executado', 'Já abordado na pesquisa?',
  'Comentário final', 'Canal de recebimento'
]);
const CABECALHOS_HISTORICO_CENTRAL = Object.freeze([
  'ID', 'Data e hora', 'Usuário', 'Status', 'Procedência',
  'Responsável pela resolutiva', 'Observação / tratativa',
  'Origem da atualização', 'Chave da finalização',
  'Solicitação atendida?', 'Conclusão confirmada?',
  'Nota final', 'Informações claras?', 'Comentário final'
]);
const CABECALHOS_FINALIZACOES_PENDENTES_CENTRAL = Object.freeze([
  'Chave', 'Data e hora', 'Responsável pelo registro', 'ID informado',
  'Solicitação atendida?', 'Considera concluída?', 'Nota',
  'Informações claras?', 'Comentário', 'ID correto',
  '✓ Confirmar vínculo', 'Situação'
]);
const CABECALHOS_RESUMO_ORIGEM_CENTRAL = Object.freeze([
  'ID', 'Status atual', 'Procedência', 'Última atualização',
  'Nome do solicitante', 'Telefone', 'Endereço', 'Solicitação',
  'Urgência', 'Abrir ficha'
]);
/** Instala todos os gatilhos e faz a primeira sincronização. */
/** Menu mostrado somente na planilha Procedimentos de Campo. */
/** Gatilho do formulário: incorpora o novo caso e cria sua ficha. */
const CENTRAL_V3 = Object.freeze({
  VERSAO: '4.9.0',
  DATA_CORTE: new Date(2026, 8, 1),
  PLANILHA_EXECUCAO_ID: CONFIG_CENTRAL_ATENDIMENTOS.PLANILHA_EXECUCAO_ID,
  PLANILHA_SATISFACAO_ID: CONFIG_CENTRAL_ATENDIMENTOS.PLANILHA_SATISFACAO_ATENDIMENTO_ID,
  LINHA_CABECALHO: 6,
  PRIMEIRA_LINHA: 7,
  ABA_BASE_OFICIAL: 'Base Fichas Oficiais',
  ABA_FICHAS_OFICIAIS: 'Fichas Oficiais',
  ABA_AUDITORIA: 'Auditoria Central',
  ABA_COMUNICACAO_EXECUCAO: CONFIG_CENTRAL_ATENDIMENTOS.ABA_COMUNICACAO_EXECUCAO,
  GATILHO_AGENDADO: 'sincronizarCentralAtendimentosAgendado',
  DIAS_ENCERRAMENTO_SEM_RESPOSTA: 14,
  TENTATIVAS_ENCERRAMENTO_SEM_RESPOSTA: 3,
  STATUS: Object.freeze([
    'Recebida',
    'Em andamento',
    'Aguardando finalização',
    'Concluída'
  ]),
  RESPONSABILIDADES: Object.freeze({
    EXECUCAO: 'Execução',
    ATENDIMENTO: 'Atendimento',
    CONCLUIDO: 'Atendimento concluído'
  })
});
const CENTRAL_V3_CABECALHOS_DASHBOARD = Object.freeze([
  'Protocolo',
  'Data de abertura',
  'Dias em aberto',
  'Área responsável pela próxima ação',
  'Próxima ação',
  'Status',
  'Urgência',
  'Nome do solicitante',
  'Telefone',
  'Endereço',
  'Solicitação resumida',
  'Responsável atual',
  'Procedência',
  'Última atualização',
  'Abrir ficha'
]);
const CENTRAL_V3_CABECALHOS_HISTORICO = Object.freeze([
  'ID', 'Data e hora', 'Usuário', 'Status', 'Procedência',
  'Responsável pela resolutiva', 'Observação / tratativa',
  'Origem da atualização', 'Chave da finalização',
  'Solicitação atendida?', 'Conclusão confirmada?',
  'Nota final', 'Informações claras?', 'Comentário final',
  'Tipo de evento', 'Área responsável pela próxima ação', 'Próxima ação',
  'Chave do evento', 'Data da execução', 'Executado por', 'Evidências'
]);
const CENTRAL_V3_CABECALHOS_RESUMO = Object.freeze([
  'Protocolo', 'Status', 'Área responsável pela próxima ação', 'Próxima ação',
  'Última atualização', 'Nome do solicitante', 'Telefone', 'Endereço',
  'Solicitação resumida', 'Urgência', 'Abrir ficha'
]);
const CENTRAL_V4_CABECALHOS_CORRECOES = Object.freeze([
  'Protocolo',
  'Data de abertura',
  'Solicitante atual',
  'Campo a corrigir',
  'Valor atual antes da correção',
  'Novo valor',
  'Motivo da correção',
  'Confirmar aplicação',
  'Situação',
  'Aplicada em',
  'Aplicada por',
  'Chave de auditoria',
  'Abrir ficha',
  'Campo aplicado',
  'Valor aplicado',
  'Motivo aplicado'
]);
const CENTRAL_V4_CAMPOS_CORRECAO = Object.freeze([
  'Data de abertura',
  'Horário do atendimento',
  'Local do atendimento',
  'Responsável pelo atendimento',
  'Nome do solicitante',
  'Telefone',
  'E-mail',
  'Endereço',
  'Canal de recebimento',
  'Frente de obra',
  'Tipo de manifestação',
  'Assunto principal',
  'Texto da solicitação',
  'Descrição detalhada da ocorrência',
  'Grau de urgência',
  'Providências iniciais',
  'Procedência',
  'Responsável atual',
  'Responsável pela execução',
  'Data da execução',
  'Providências executadas',
  'Conclusão ou devolutiva final',
  'Fotos da abertura',
  'Fotos da execução',
  'Status do atendimento',
  'Data de conclusão'
]);
const CENTRAL_V4_PROCEDENCIAS_CORRECAO = Object.freeze([
  'Em análise',
  'Procedente',
  'Possivelmente não procedente',
  'Não procedente'
]);
const CENTRAL_V4_STATUS_CORRECAO = Object.freeze([
  'Recebida',
  'Em andamento',
  'Aguardando finalização'
]);
const CENTRAL_V4_CAMPOS_OPERACIONAIS_CORRECAO = Object.freeze([
  'Procedência',
  'Responsável atual',
  'Responsável pela execução',
  'Data da execução',
  'Providências executadas',
  'Conclusão ou devolutiva final',
  'Fotos da execução',
  'Status do atendimento',
  'Data de conclusão'
]);
const CENTRAL_V4_CANAIS = Object.freeze([
  'Atendimento itinerante',
  'Central de atendimento ao cliente',
  'Operacional do consórcio',
  'Comunicado Sabesp',
  'Mídia'
]);
const CENTRAL_V4_TIPOS_MANIFESTACAO = Object.freeze([
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
]);
const CENTRAL_V46_CABECALHOS_COMUNICACAO = Object.freeze([
  'Chave do evento',
  'Protocolo',
  'Data e hora',
  'Registrado por',
  'Área autora',
  'Encaminhado para',
  'Tipo de registro',
  'Mensagem',
  'Título do item',
  'Chave do item',
  'Situação do item',
  'Prioridade',
  'Prazo',
  'Arquivos',
  'Lido pelo Atendimento em',
  'Lido pela Execução em',
  'Origem',
  'Versão'
]);
const CENTRAL_V46_MARCADOR_REMOCAO = '[[REMOVER]]';
/** Instala o fluxo profissional sem gatilho de edição no Dashboard. */
const AF_CENTRAL_ID='1UHs_jFVD7jQRKgw7CVPCQ8R7sgvyhkJVv5rcj0v2K5g';
const AF_ABA='Vínculos de protocolos';
const AF_CAB=['Protocolo incorporado','Protocolo principal','ID origem','ID principal','Chave origem','Chave principal','Estado','Data','Autor','Motivo','Arquivo de preservação','Dados públicos de origem'];
let AF_CACHE=null;
function abrirOrigemCentralAtendimentos_() {
  const id = PropertiesService.getScriptProperties()
    .getProperty('CENTRAL_ATENDIMENTOS_ORIGEM_ID');
  if (id) return SpreadsheetApp.openById(id);
  const ativa = SpreadsheetApp.getActiveSpreadsheet();
  if (ativa && ativa.getSheetByName(CONFIG_CENTRAL_ATENDIMENTOS.ABA_CONSOLIDADA)) {
    PropertiesService.getScriptProperties().setProperty(
      'CENTRAL_ATENDIMENTOS_ORIGEM_ID',
      ativa.getId()
    );
    return ativa;
  }
  throw new Error('A planilha de origem ainda não foi registrada. Execute instalarCampo5().');
}
function garantirEstruturaDestinoCentral_(destino) {
  let dashboard = destino.getSheetByName(CONFIG_CENTRAL_ATENDIMENTOS.ABA_DASHBOARD);
  if (!dashboard) {
    const candidatas = destino.getSheets().filter(function(aba) {
      const nome = normalizarTextoCentral_(aba.getName());
      return (nome === 'pagina1' || nome === 'planilha1' || nome === 'sheet1') &&
        aba.getLastRow() <= 1 && aba.getLastColumn() <= 1;
    });
    if (candidatas.length) {
      dashboard = candidatas[0];
      dashboard.setName(CONFIG_CENTRAL_ATENDIMENTOS.ABA_DASHBOARD);
    } else {
      dashboard = destino.insertSheet(CONFIG_CENTRAL_ATENDIMENTOS.ABA_DASHBOARD, 0);
    }
  }
  let base = destino.getSheetByName(CONFIG_CENTRAL_ATENDIMENTOS.ABA_BASE);
  if (!base) base = destino.insertSheet(CONFIG_CENTRAL_ATENDIMENTOS.ABA_BASE);
  let historico = destino.getSheetByName(CONFIG_CENTRAL_ATENDIMENTOS.ABA_HISTORICO);
  if (!historico) historico = destino.insertSheet(CONFIG_CENTRAL_ATENDIMENTOS.ABA_HISTORICO);
  let indicadores = destino.getSheetByName(CONFIG_CENTRAL_ATENDIMENTOS.ABA_INDICADORES);
  if (!indicadores) indicadores = destino.insertSheet(CONFIG_CENTRAL_ATENDIMENTOS.ABA_INDICADORES, 0);
  let finalizacoesPendentes = destino.getSheetByName(
    CONFIG_CENTRAL_ATENDIMENTOS.ABA_FINALIZACOES_PENDENTES
  );
  // Aba de exceção: será criada somente se houver finalização sem vínculo.
  let correcoesFicha = destino.getSheetByName(
    CONFIG_CENTRAL_ATENDIMENTOS.ABA_CORRECOES_FICHA
  );
  if (!correcoesFicha) {
    correcoesFicha = destino.insertSheet(
      CONFIG_CENTRAL_ATENDIMENTOS.ABA_CORRECOES_FICHA,
      Math.min(2, destino.getSheets().length)
    );
  }
  prepararAbaBaseCentral_(base);
  prepararAbaHistoricoCentral_(historico);
  dashboard.showSheet();
  indicadores.showSheet();
  try { finalizacoesPendentes.hideSheet(); } catch (erro) {}
  if (temCorrecaoFichaEmUsoCentralV43_(correcoesFicha)) {
    correcoesFicha.showSheet();
  } else {
    try { correcoesFicha.hideSheet(); } catch (erro) {}
  }
  return {
    dashboard: dashboard,
    indicadores: indicadores,
    base: base,
    historico: historico,
    finalizacoesPendentes: finalizacoesPendentes,
    correcoesFicha: correcoesFicha
  };
}
function lerCasosFonteCentral_(dados) {
  if (!dados || dados.length < 2) return [];
  const mapa = montarMapaCentral_(dados[0]);
  const obrigatorios = [
    'Selecione o procedimento a ser executado',
    'Carimbo de data/hora',
    'Momento da Ficha de Atendimento',
    'Nome - Atendimento',
    'Breve relato do solicitante',
    'Data de realização do procedimento',
    'Colaborador responsável pelo registro'
  ];
  validarCamposCentral_(mapa, obrigatorios);
  const casos = [];
  dados.slice(1).forEach(function(linha, indice) {
    const campo = function(nome) { return pegarCampoCentral_(linha, mapa, nome); };
    if (
      normalizarTextoCentral_(campo('Selecione o procedimento a ser executado')) !==
      normalizarTextoCentral_(CONFIG_CENTRAL_ATENDIMENTOS.PROCEDIMENTO)
    ) return;
    const carimbo = campo('Carimbo de data/hora');
    const numeroLinha = indice + 2;
    const idConsolidado = campo('ID de migração');
    casos.push({
      chaveOrigem: montarChaveOrigemConsolidadaCentral_(idConsolidado, carimbo, numeroLinha),
      id: '',
      linhaOrigem: numeroLinha,
      carimbo: carimbo,
      data: campo('Data de realização do procedimento'),
      horario: campo('Horário do recebimento do pedido'),
      momento: campo('Momento da Ficha de Atendimento'),
      statusRegistro: determinarStatusRegistroCentral_(campo('Momento da Ficha de Atendimento')),
      empresa: CONFIG_CENTRAL_ATENDIMENTOS.EMPRESA,
      responsavelRegistro: campo('Colaborador responsável pelo registro'),
      local: valorPreferencialCentral_([
        campo('Endereço completo'),
        campo('Endereço Completo do Solicitante do Atendimento')
      ]),
      assunto: campo('Assunto Principal'),
      tipoManifestacao: resumirClassificacaoCentral_(
        campo('Classificação principal da manifestação')
      ),
      nome: campo('Nome - Atendimento'),
      telefones: campo('Telefone ou Telefones - Atendimento'),
      email: campo('Email - Atendimento'),
      endereco: campo('Endereço Completo do Solicitante do Atendimento'),
      solicitacao: campo('Breve relato do solicitante'),
      tratativaInicial: campo('Providências já realizadas no atendimento'),
      urgencia: campo('Grau de urgência'),
      canalRecebimento: campo('Canal de recebimento da demanda'),
      segmento: campo('A demanda deve ser encaminhada para qual segmento do Consórcio?'),
      possivelSinistro: campo('Incluí possível sinistro ou valor de reparo?'),
      responsavelInicial: campo(
        'Nome do responsável do consórcio que está acompanhando o procedimento'
      ),
      arquivos: campo('Imagens ou arquivos do acontecimento'),
      informacoesClaras: campo('As informações ficaram claras?'),
      solicitacaoAtendida: campo('A solicitação foi atendida?'),
      conclusaoDeclarada: campo('Você considera sua solicitação como concluída'),
      notaEncerramento: numeroOuVazioCentral_(
        campo('De 0 a 10, qual a satisfação com atendimento prestado?')
      ),
      clarezaEncerramento: campo('As informações e providências ficaram claras?'),
      grupoComunicacao: campo(
        'Gostaria de fazer parte de um grupo de comunicação sobre as obras e ações do Consórcio?'
      ),
      nota: numeroOuVazioCentral_(
        campo('De 0 a 10, qual nota o munícipe atribui ao atendimento recebido?')
      ),
      pontoReferencia: campo('Ponto de referência'),
      tipoLocal: campo('Tipo do local'),
      descricaoDetalhada: campo('Descrição detalhada da ocorrência'),
      area: campo('Área responsável pelo procedimento'),
      procedimentoExecutado: limparProcedimentoExecutadoCentral_(
        campo('Procedimento executado:')
      ),
      jaAbordadoPesquisa: campo('Já foi abordado anteriormente na pesquisa sobre as obras?'),
      comentarioFinal: valorPreferencialCentral_([
        campo('Observação final do procedimento'),
        campo('Algum último comentário ou sugestão?')
      ])
    });
  });
  return casos.sort(function(a, b) {
    return valorDataOrdenacaoCentral_(a.carimbo) - valorDataOrdenacaoCentral_(b.carimbo);
  });
}
/** Lê apenas as respostas da seção Finalização de Atendimento. */
function lerFinalizacoesFonteCentral_(dados) {
  if (!dados || dados.length < 2) return [];
  const mapa = montarMapaCentral_(dados[0]);
  const camposFinalizacao = [
    'Informe o ID do atendimento',
    'A solicitação foi atendida?',
    'Você considera sua solicitação como concluída',
    'De 0 a 10, qual a satisfação com atendimento prestado?',
    'As informações e providências ficaram claras?',
    'Deseja deixar um comentário adicional?'
  ];
  const possuiCamposLegados = camposFinalizacao.some(function(campo) {
    return mapa[normalizarTextoCentral_(campo)] !== undefined;
  });
  if (!possuiCamposLegados) return [];
  const finalizacoes = [];
  dados.slice(1).forEach(function(linha, indice) {
    const campo = function(nome) { return pegarCampoCentral_(linha, mapa, nome); };
    const procedimento = normalizarTextoCentral_(
      campo('Selecione o procedimento a ser executado')
    );
    const idInformado = campo('Informe o ID do atendimento');
    const atendida = campo('A solicitação foi atendida?');
    const concluida = campo('Você considera sua solicitação como concluída');
    const nota = campo('De 0 a 10, qual a satisfação com atendimento prestado?');
    const clareza = campo('As informações e providências ficaram claras?');
    const comentario = campo('Deseja deixar um comentário adicional?');
    const possuiResposta = [idInformado, atendida, concluida, nota, clareza, comentario]
      .some(function(valor) { return textoCentral_(valor); });
    const procedimentoCorreto = procedimento === normalizarTextoCentral_(
      CONFIG_CENTRAL_ATENDIMENTOS.PROCEDIMENTO_FINALIZACAO
    );
    if (!procedimentoCorreto && !possuiResposta) return;
    const carimbo = campo('Carimbo de data/hora');
    const numeroLinha = indice + 2;
    const idConsolidado = campo('ID de migração');
    const numeroLinhaOriginal = numeroLinhaOriginalCentral_(idConsolidado, numeroLinha);
    finalizacoes.push({
      chave: montarChaveFinalizacaoCentral_(carimbo, numeroLinhaOriginal),
      chaveCaso: montarChaveOrigemConsolidadaCentral_(
        idConsolidado,
        carimbo,
        numeroLinha
      ),
      linhaOrigem: numeroLinha,
      carimbo: carimbo,
      responsavelRegistro: campo('Colaborador responsável pelo registro'),
      procedimento: procedimento,
      idInformado: idInformado,
      atendida: atendida,
      concluida: concluida,
      nota: numeroOuVazioCentral_(nota),
      clareza: clareza,
      comentario: comentario
    });
  });
  return finalizacoes.sort(function(a, b) {
    return valorDataOrdenacaoCentral_(a.carimbo) - valorDataOrdenacaoCentral_(b.carimbo);
  });
}
function montarChaveFinalizacaoCentral_(carimbo, numeroLinha) {
  if (carimbo instanceof Date && !isNaN(carimbo.getTime())) {
    return 'FINAL|' + carimbo.getTime() + '|L' + numeroLinha;
  }
  const texto = textoCentral_(carimbo);
  return 'FINAL|' + (texto || 'SEM-DATA') + '|L' + numeroLinha;
}
function montarChaveOrigemConsolidadaCentral_(idConsolidado, carimbo, numeroLinhaBase) {
  const id = textoCentral_(idConsolidado);
  const numeroLinhaOriginal = numeroLinhaOriginalCentral_(id, numeroLinhaBase);
  if (/^ATUAL-3\.0-/i.test(id)) {
    return montarChaveOrigemCentral_(carimbo, numeroLinhaOriginal);
  }
  if (id) return 'BASE|' + normalizarTextoCentral_(id);
  return montarChaveOrigemCentral_(carimbo, numeroLinhaBase);
}
function numeroLinhaOriginalCentral_(idConsolidado, numeroLinhaBase) {
  const encontrado = textoCentral_(idConsolidado).match(/^ATUAL-3\.0-(\d+)$/i);
  return encontrado ? Number(encontrado[1]) : numeroLinhaBase;
}
function normalizarIdAtendimentoCentral_(valor) {
  const texto = textoCentral_(valor).split('|')[0].trim().toUpperCase();
  if (!texto || normalizarTextoCentral_(texto) === 'pendente') return '';
  const protocoloNovo = texto.replace(/[^A-Z0-9]/g, '');
  if (/^ATD\d{8}$/.test(protocoloNovo)) return protocoloNovo;
  const encontrado = texto.match(/ATD\s*[-.]?\s*(\d{1,8})/i);
  if (!encontrado) return '';
  return 'ATD-' + String(Number(encontrado[1])).padStart(4, '0');
}
function processarFinalizacoesCentral_(
  finalizacoes,
  casosPorId,
  historico,
  correcoesPendentes
) {
  const historicoPorId = lerHistoricoPorIdCentral_(historico);
  const chavesProcessadas = {};
  Object.keys(historicoPorId).forEach(function(id) {
    (historicoPorId[id] || []).forEach(function(item) {
      const chave = textoCentral_(item.chaveFinalizacao);
      if (chave) chavesProcessadas[chave] = true;
    });
  });
  const pendentes = [];
  const idsAtualizados = {};
  let processadas = 0;
  finalizacoes.forEach(function(finalizacao) {
    if (chavesProcessadas[finalizacao.chave]) return;
    const correcao = correcoesPendentes[finalizacao.chave] || {};
    const veioJuntoDaAbertura = finalizacao.procedimento === normalizarTextoCentral_(
      CONFIG_CENTRAL_ATENDIMENTOS.PROCEDIMENTO
    );
    const casoMesmoRegistro = veioJuntoDaAbertura
      ? localizarCasoDaMesmaRespostaCentral_(finalizacao, casosPorId)
      : null;
    /*
     * Uma abertura pode conter respostas da seção de encerramento. Quando a
     * pessoa informou que a demanda ainda não foi concluída, isso descreve o
     * estado inicial e não é uma finalização pendente.
     */
    if (veioJuntoDaAbertura &&
        normalizarTextoCentral_(finalizacao.concluida) !== 'sim') {
      return;
    }
    const idOriginal = af_resolver_(normalizarIdAtendimentoCentral_(finalizacao.idInformado), true);
    const idCorrigido = correcao.confirmar
      ? af_resolver_(normalizarIdAtendimentoCentral_(correcao.idCorreto), true)
      : '';
    const id = casoMesmoRegistro
      ? casoMesmoRegistro.id
      : (idCorrigido || idOriginal);
    let situacao = '';
    if (!id) {
      situacao = correcao.confirmar
        ? 'O ID corrigido não está no formato ATD20260001 ou ATD-0000.'
        : 'Informe o protocolo correto e marque Confirmar vínculo.';
    } else if (!casosPorId[id]) {
      situacao = 'O ID ' + id + ' não foi encontrado na Base de Atendimentos.';
    } else if (veioJuntoDaAbertura) {
      const faltantes = [];
      if (finalizacao.nota === '') faltantes.push('nota');
      if (!textoCentral_(finalizacao.clareza)) faltantes.push('clareza');
      if (faltantes.length) {
        situacao = 'Encerramento imediato incompleto. Confira: ' +
          faltantes.join(', ') + '.';
      }
    } else if (!textoCentral_(finalizacao.atendida) ||
        !textoCentral_(finalizacao.concluida) ||
        finalizacao.nota === '' ||
        !textoCentral_(finalizacao.clareza)) {
      situacao = 'A resposta está incompleta e precisa ser conferida na planilha de origem.';
    }
    const encerradaDepois = id && (historicoPorId[id] || []).some(function(evento) {
      return normalizarStatusCentralV3_(evento.status) === 'Concluída' &&
        valorDataOrdenacaoCentral_(evento.dataHora) >=
          valorDataOrdenacaoCentral_(finalizacao.carimbo) &&
        textoCentral_(evento.chaveFinalizacao) !== finalizacao.chave;
    });
    if (situacao && veioJuntoDaAbertura && encerradaDepois) return;
    if (situacao) {
      pendentes.push({
        finalizacao: finalizacao,
        idCorreto: correcao.idCorreto || '',
        situacao: situacao
      });
      return;
    }
    const eventos = historicoPorId[id] || [];
    const ultimo = eventos.length ? eventos[eventos.length - 1] : {};
    const caso = casosPorId[id];
    const status = normalizarTextoCentral_(finalizacao.concluida) === 'sim'
      ? 'Concluída'
      : 'Em andamento';
    const item = {
      id: id,
      dataHora: finalizacao.carimbo || new Date(),
      usuario: finalizacao.responsavelRegistro || 'Finalização pelo formulário',
      status: status,
      procedencia: ultimo.procedencia || 'Em análise',
      responsavel: ultimo.responsavel || caso.responsavelInicial ||
        finalizacao.responsavelRegistro || '',
      observacao: montarObservacaoFinalizacaoCentral_(
        finalizacao,
        veioJuntoDaAbertura,
        caso
      ),
      origemAtualizacao: veioJuntoDaAbertura
        ? 'Encerramento imediato pelo formulário'
        : 'Finalização pelo formulário',
      chaveFinalizacao: finalizacao.chave,
      solicitacaoAtendida: textoCentral_(finalizacao.atendida) ||
        (veioJuntoDaAbertura ? 'Sim' : ''),
      conclusaoConfirmada: finalizacao.concluida,
      notaFinal: finalizacao.nota,
      informacoesClarasFinal: finalizacao.clareza,
      comentarioFinalizacao: finalizacao.comentario || 'Nada a declarar'
    };
    appendHistoricoCentral_(historico, item);
    if (!historicoPorId[id]) historicoPorId[id] = [];
    historicoPorId[id].push(item);
    chavesProcessadas[finalizacao.chave] = true;
    idsAtualizados[id] = true;
    processadas++;
  });
  return {
    pendentes: pendentes,
    idsAtualizados: idsAtualizados,
    processadas: processadas
  };
}
function localizarCasoDaMesmaRespostaCentral_(finalizacao, casosPorId) {
  const ids = Object.keys(casosPorId || {});
  for (let i = 0; i < ids.length; i++) {
    const caso = casosPorId[ids[i]];
    if (caso.chaveOrigem === finalizacao.chaveCaso) return caso;
  }
  return null;
}
function evidenciaEncerramentoImediatoCentral_(finalizacao, caso) {
  const candidatos = [
    caso && caso.tratativaInicial,
    caso && caso.procedimentoExecutado
  ];
  for (let i = 0; i < candidatos.length; i++) {
    const valor = textoCentral_(candidatos[i]);
    const normalizado = normalizarTextoCentral_(valor);
    if (!valor || valor.length < 10) continue;
    if (/^(ficha de atendimento|finalizacao de atendimento|nenhuma observacao|nada a declarar|nao se aplica)$/.test(normalizado)) {
      continue;
    }
    return valor;
  }
  return '';
}
function montarObservacaoFinalizacaoCentral_(finalizacao, encerramentoImediato, caso) {
  const atendida = textoCentral_(finalizacao.atendida) ||
    (encerramentoImediato ? 'Sim' : 'Não informado');
  const resolutiva = evidenciaEncerramentoImediatoCentral_(finalizacao, caso);
  const partes = [
    encerramentoImediato
      ? 'Encerramento imediato registrado no mesmo contato.'
      : 'Finalização registrada pelo formulário.',
    encerramentoImediato && !resolutiva
      ? 'A resolutiva foi confirmada pelo solicitante no próprio registro, sem detalhamento operacional adicional.'
      : (resolutiva ? 'Resolutiva registrada: ' + resolutiva + '.' : ''),
    'Solicitação atendida: ' + atendida + '.',
    'Conclusão confirmada: ' + textoCentral_(finalizacao.concluida) + '.',
    'Nota final: ' + textoCentral_(finalizacao.nota) + '/10.',
    'Informações claras: ' + textoCentral_(finalizacao.clareza) + '.'
  ];
  const comentario = textoCentral_(finalizacao.comentario) ||
    textoCentral_(caso && caso.tratativaInicial) ||
    textoCentral_(caso && caso.procedimentoExecutado) ||
    textoCentral_(caso && caso.comentarioFinal);
  partes.push('Comentário: ' + (comentario || 'Nada a declarar') + '.');
  return partes.filter(Boolean).join(' ');
}
function lerCorrecoesPendentesCentral_(aba) {
  const mapa = {};
  if (!aba || aba.getLastRow() < 5) return mapa;
  aba.getRange(5, 1, aba.getLastRow() - 4, 11).getValues()
    .forEach(function(linha) {
      const chave = textoCentral_(linha[0]);
      if (!chave) return;
      mapa[chave] = {
        idCorreto: linha[9],
        confirmar: linha[10] === true
      };
    });
  return mapa;
}
function escreverFinalizacoesPendentesCentral_(aba, pendentes, correcoes) {
  const c = CONFIG_CENTRAL_ATENDIMENTOS.CORES;
  const quantidade = pendentes.length;
  /*
   * Compatibilidade exclusiva com instalações antigas. A versão 4.6 não
   * recria esta página: ocorrências sem vínculo passam a ser registradas na
   * Auditoria Central, e os casos vinculados continuam disponíveis no painel.
   */
  if (!aba) return;
  garantirDimensoesCentral_(aba, Math.max(30, quantidade + 10), 12);
  if (aba.getFilter()) aba.getFilter().remove();
  aba.getBandings().forEach(function(banda) { banda.remove(); });
  aba.setConditionalFormatRules([]);
  aba.getRange(1, 1, aba.getMaxRows(), aba.getMaxColumns()).breakApart();
  aba.clear();
  aba.setHiddenGridlines(true);
  aba.setFrozenRows(4);
  aba.setFrozenColumns(0);
  aba.setTabColor(quantidade ? c.LARANJA : c.VERDE);
  aba.getRange('A1:L1').merge().setValue('FINALIZAÇÕES AGUARDANDO VÍNCULO');
  aba.getRange('A2:L2').merge().setValue(
    'Use esta página somente quando o formulário receber Pendente ou um ID que não existe.'
  );
  aba.getRange('A3:L3').merge().setValue(
    quantidade
      ? 'Digite o ID correto na coluna amarela e marque Confirmar vínculo.'
      : '✓ Nenhuma finalização aguarda conferência.'
  );
  aba.getRange('A1:L1').setBackground(c.AZUL_ESCURO).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(17).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  aba.getRange('A2:L2').setBackground(c.AZUL).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(9)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  aba.getRange('A3:L3').setBackground(quantidade ? c.LARANJA_CLARO : c.VERDE_CLARO)
    .setFontColor(quantidade ? '#A3600B' : '#24734C')
    .setFontFamily('Arial').setFontSize(9).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  aba.getRange(4, 1, 1, 12).setValues([
    CABECALHOS_FINALIZACOES_PENDENTES_CENTRAL
  ]).setBackground(c.AZUL_ESCURO).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(8).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setWrap(true)
    .setBorder(true, true, true, true, true, true, c.AZUL_ESCURO,
      SpreadsheetApp.BorderStyle.SOLID);
  if (quantidade) {
    const valores = pendentes.map(function(item) {
      const finalizacao = item.finalizacao;
      const correcao = correcoes[finalizacao.chave] || {};
      return [
        finalizacao.chave,
        finalizacao.carimbo,
        finalizacao.responsavelRegistro,
        finalizacao.idInformado,
        finalizacao.atendida,
        finalizacao.concluida,
        finalizacao.nota,
        finalizacao.clareza,
        finalizacao.comentario || 'Nada a declarar',
        item.idCorreto || correcao.idCorreto || '',
        false,
        item.situacao
      ];
    });
    aba.getRange(5, 1, quantidade, 12).setValues(valores)
      .setFontFamily('Arial').setFontSize(9).setFontColor(c.TEXTO)
      .setVerticalAlignment('top').setWrap(true)
      .setBorder(false, false, true, false, true, true, c.BORDA,
        SpreadsheetApp.BorderStyle.SOLID);
    aba.getRange(5, 2, quantidade, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    aba.getRange(5, 1, quantidade, 9).setBackground(c.CINZA_CLARO);
    aba.getRange(5, 10, quantidade, 1).setBackground(c.AMARELO_EDITAVEL)
      .setFontWeight('bold').setHorizontalAlignment('center');
    aba.getRange(5, 11, quantidade, 1).setBackground(c.VERDE_CLARO)
      .insertCheckboxes().setHorizontalAlignment('center');
    aba.getRange(5, 12, quantidade, 1).setBackground(c.LARANJA_CLARO)
      .setFontColor('#A3600B').setFontWeight('bold');
    aba.setRowHeights(5, quantidade, 78);
    aba.getRange(4, 1, quantidade + 1, 12).createFilter();
  } else {
    aba.getRange('A5:L7').merge().setValue(
      '✓ Tudo certo. As finalizações com ID válido são incorporadas automaticamente.'
    ).setBackground(c.VERDE_CLARO).setFontColor('#24734C')
      .setFontFamily('Arial').setFontSize(12).setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle')
      .setWrap(true)
      .setBorder(true, true, true, true, false, false, c.BORDA,
        SpreadsheetApp.BorderStyle.SOLID);
  }
  aba.hideColumns(1);
  aba.setRowHeight(1, 40);
  aba.setRowHeight(2, 26);
  aba.setRowHeight(3, 28);
  aba.setRowHeight(4, 52);
  [1, 95, 180, 120, 125, 125, 70, 125, 280, 120, 120, 260]
    .forEach(function(largura, indice) {
      aba.setColumnWidth(indice + 1, largura);
    });
}
function auditarFinalizacoesPendentesCentralV46_(pendentes) {
  return (pendentes || []).map(function(item) {
    const registro = item.finalizacao || {};
    return {
      tipo: normalizarTextoCentral_(registro.procedimento).indexOf('pesquisa') >= 0
        ? 'Pesquisa final para conferir'
        : 'Finalização para conferir',
      chave: textoCentral_(registro.chave),
      id: textoCentral_(registro.idInformado),
      detalhe: textoCentral_(item.situacao) ||
        'O registro não pôde ser vinculado automaticamente a um atendimento.'
    };
  });
}
function atribuirIdsCentral_(casos, idsExistentes) {
  const proximosNovos = {};
  casos.forEach(function(caso) {
    if (idsExistentes[caso.chaveOrigem]) {
      caso.id = idsExistentes[caso.chaveOrigem];
    } else {
      const dataCaso = dataValidaCentral_(caso.data) || dataValidaCentral_(caso.carimbo);
      const ano = dataCaso ? dataCaso.getUTCFullYear() : new Date().getFullYear();
      if (!proximosNovos[ano]) {
        proximosNovos[ano] = maiorNumeroProtocoloNovoCentral_(idsExistentes, ano) + 1;
      }
      caso.id = 'ATD' + ano + String(proximosNovos[ano]).padStart(4, '0');
      proximosNovos[ano]++;
      idsExistentes[caso.chaveOrigem] = caso.id;
    }
  });
}
function maiorNumeroProtocoloNovoCentral_(mapa, ano) {
  const padrao = new RegExp('^ATD' + ano + '(\\d{4})$', 'i');
  return Object.keys(mapa).reduce(function(maior, chave) {
    const encontrado = textoCentral_(mapa[chave]).match(padrao);
    return encontrado ? Math.max(maior, Number(encontrado[1])) : maior;
  }, 0);
}
function lerIdsBaseCentral_(base) {
  const mapa = {};
  if (base.getLastRow() < 2) return mapa;
  base.getRange(2, 1, base.getLastRow() - 1, 2).getValues().forEach(function(linha) {
    const chave = textoCentral_(linha[0]);
    const id = textoCentral_(linha[1]);
    if (chave && id) mapa[chave] = id;
  });
  return mapa;
}
function escreverBaseCentral_(base, casos) {
  prepararAbaBaseCentral_(base);
  const linhas = casos.map(casoParaLinhaBaseCentral_);
  if (base.getLastRow() > 1) {
    base.getRange(2, 1, base.getLastRow() - 1, CABECALHOS_BASE_CENTRAL.length)
      .clearContent();
  }
  if (linhas.length) {
    garantirDimensoesCentral_(base, linhas.length + 5, CABECALHOS_BASE_CENTRAL.length);
    base.getRange(2, 1, linhas.length, CABECALHOS_BASE_CENTRAL.length).setValues(linhas);
    base.getRange(2, 4, linhas.length, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    base.getRange(2, 5, linhas.length, 1).setNumberFormat('dd/MM/yyyy');
    base.getRange(2, 6, linhas.length, 1).setNumberFormat('HH:mm');
  }
  base.hideSheet();
}
function prepararAbaBaseCentral_(base) {
  garantirDimensoesCentral_(base, 20, CABECALHOS_BASE_CENTRAL.length);
  base.getRange(1, 1, 1, CABECALHOS_BASE_CENTRAL.length)
    .setValues([CABECALHOS_BASE_CENTRAL])
    .setBackground(CONFIG_CENTRAL_ATENDIMENTOS.CORES.AZUL_ESCURO)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  base.setFrozenRows(1);
}
function casoParaLinhaBaseCentral_(caso) {
  return [
    caso.chaveOrigem, caso.id, caso.linhaOrigem, caso.carimbo, caso.data,
    caso.horario, caso.momento, caso.statusRegistro, caso.empresa,
    caso.responsavelRegistro, caso.local, caso.assunto, caso.tipoManifestacao,
    caso.nome, caso.telefones, caso.email, caso.endereco, caso.solicitacao,
    caso.tratativaInicial, caso.urgencia, caso.segmento, caso.possivelSinistro,
    caso.responsavelInicial, caso.arquivos, caso.informacoesClaras,
    caso.grupoComunicacao, caso.nota, caso.pontoReferencia, caso.tipoLocal,
    caso.descricaoDetalhada, caso.area, caso.procedimentoExecutado,
    caso.jaAbordadoPesquisa, caso.comentarioFinal, caso.canalRecebimento
  ];
}
function indexarCasosPorIdCentral_(casos) {
  return casos.reduce(function(mapa, caso) {
    mapa[caso.id] = caso;
    return mapa;
  }, {});
}
function prepararAbaHistoricoCentral_(historico) {
  garantirDimensoesCentral_(historico, 50, CABECALHOS_HISTORICO_CENTRAL.length);
  historico.getRange(1, 1, 1, CABECALHOS_HISTORICO_CENTRAL.length)
    .setValues([CABECALHOS_HISTORICO_CENTRAL])
    .setBackground(CONFIG_CENTRAL_ATENDIMENTOS.CORES.AZUL_ESCURO)
    .setFontColor('#FFFFFF').setFontWeight('bold');
  historico.setFrozenRows(1);
  historico.hideSheet();
}
function appendHistoricoCentral_(historico, item) {
  const linha = Math.max(2, historico.getLastRow() + 1);
  historico.getRange(linha, 1, 1, CABECALHOS_HISTORICO_CENTRAL.length).setValues([[
    item.id, item.dataHora, item.usuario, item.status, item.procedencia,
    item.responsavel, item.observacao, item.origemAtualizacao || 'Dashboard',
    item.chaveFinalizacao || '', item.solicitacaoAtendida || '',
    item.conclusaoConfirmada || '',
    item.notaFinal === 0 ? 0 : (item.notaFinal || ''),
    item.informacoesClarasFinal || '', item.comentarioFinalizacao || ''
  ]]);
  historico.getRange(linha, 2).setNumberFormat('dd/MM/yyyy HH:mm:ss');
}
function lerHistoricoPorIdCentral_(historico) {
  const mapa = {};
  if (historico.getLastRow() < 2) return mapa;
  historico.getRange(
    2,
    1,
    historico.getLastRow() - 1,
    CABECALHOS_HISTORICO_CENTRAL.length
  ).getValues()
    .filter(function(linha) { return textoCentral_(linha[0]); })
    .forEach(function(linha) {
      const id = textoCentral_(linha[0]);
      if (!mapa[id]) mapa[id] = [];
      mapa[id].push({
        id: id, dataHora: linha[1], usuario: linha[2], status: linha[3],
        procedencia: linha[4], responsavel: linha[5], observacao: linha[6],
        origemAtualizacao: linha[7], chaveFinalizacao: linha[8],
        solicitacaoAtendida: linha[9], conclusaoConfirmada: linha[10],
        notaFinal: linha[11], informacoesClarasFinal: linha[12],
        comentarioFinalizacao: linha[13]
      });
    });
  return mapa;
}
/**
 * Retorna somente o estado efetivamente confirmado. Alterações ainda não
 * confirmadas continuam visíveis no dashboard, mas não chegam à ficha nem ao
 * resumo da planilha de origem.
 */
function escreverCartaoIndicadorCentral_(aba, faixaRotulo, faixaValor, rotulo, valor, cor) {
  const c = CONFIG_CENTRAL_ATENDIMENTOS.CORES;
  aba.getRange(faixaRotulo).merge().setValue(rotulo)
    .setBackground(cor).setFontColor(c.BRANCO).setFontFamily('Arial')
    .setFontSize(8).setFontWeight('bold').setHorizontalAlignment('center')
    .setVerticalAlignment('middle').setWrap(true);
  aba.getRange(faixaValor).merge().setNumberFormat('@').setValue(String(valor))
    .setBackground(c.BRANCO).setFontColor(cor).setFontFamily('Arial')
    .setFontSize(19).setFontWeight('bold').setHorizontalAlignment('center')
    .setVerticalAlignment('middle').setWrap(true)
    .setBorder(true, true, true, true, false, false, c.BORDA, SpreadsheetApp.BorderStyle.SOLID);
}
function formatarFaixaTituloIndicadorCentral_(intervalo, titulo, cor) {
  intervalo.merge().setValue(titulo).setBackground(cor).setFontColor('#FFFFFF')
    .setFontFamily('Arial').setFontSize(10).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
}
function dataValidaCentral_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) return new Date(valor.getTime());
  if (typeof valor === 'number' && isFinite(valor)) {
    if (valor > 100000000000) return new Date(valor);
    return new Date(Math.round((valor - 25569) * 86400000));
  }
  const texto = textoCentral_(valor);
  const numerica = texto.match(
    /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/
  );
  if (numerica) {
    const primeiro = Number(numerica[1]);
    const segundo = Number(numerica[2]);
    const ano = Number(numerica[3]);
    const mes = segundo > 12 && primeiro <= 12 ? primeiro : segundo;
    const dia = segundo > 12 && primeiro <= 12 ? segundo : primeiro;
    const hora = Number(numerica[4] || 0);
    const minuto = Number(numerica[5] || 0);
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31 ||
        hora < 0 || hora > 23 || minuto < 0 || minuto > 59) return null;
    const data = new Date(ano, mes - 1, dia, hora, minuto);
    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 ||
        data.getDate() !== dia) return null;
    return data;
  }
  const data = new Date(texto);
  return isNaN(data.getTime()) ? null : data;
}
function diferencaHorasCentral_(inicio, fim) {
  if (!inicio || !fim) return null;
  return Math.max(0, (fim.getTime() - inicio.getTime()) / 3600000);
}
function mediaCentral_(valores) {
  if (!valores.length) return null;
  return valores.reduce(function(total, valor) { return total + valor; }, 0) / valores.length;
}
function medianaCentral_(valores) {
  if (!valores.length) return null;
  const ordenados = valores.slice().sort(function(a, b) { return a - b; });
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2
    ? ordenados[meio]
    : (ordenados[meio - 1] + ordenados[meio]) / 2;
}
function formatarDuracaoIndicadorCentral_(horas) {
  if (horas === null || horas === undefined || !isFinite(horas)) return 'Sem base';
  const dias = Math.round(horas / 24 * 10) / 10;
  const texto = String(dias).replace('.', ',');
  return texto + (dias <= 1 ? ' dia' : ' dias');
}
function ocultarFichaLegadaCentral_(){ /* Ficha histórica permanece intacta. */ }
function garantirDimensoesCentral_(aba, linhas, colunas) {
  if (aba.getMaxRows() < linhas) {
    aba.insertRowsAfter(aba.getMaxRows(), linhas - aba.getMaxRows());
  }
  if (aba.getMaxColumns() < colunas) {
    aba.insertColumnsAfter(aba.getMaxColumns(), colunas - aba.getMaxColumns());
  }
}
function definirLinkCentral_(celula, texto, url) {
  const richText = SpreadsheetApp.newRichTextValue()
    .setText(texto)
    .setLinkUrl(url)
    .build();
  celula.setRichTextValue(richText);
}
function montarMapaCentral_(cabecalhos) {
  const mapa = {};
  cabecalhos.forEach(function(cabecalho, indice) {
    mapa[normalizarTextoCentral_(cabecalho)] = indice;
  });
  return mapa;
}
function validarCamposCentral_(mapa, campos) {
  const ausentes = campos.filter(function(campo) {
    return mapa[normalizarTextoCentral_(campo)] === undefined;
  });
  if (ausentes.length) {
    throw new Error('Campos obrigatórios não encontrados:\n- ' + ausentes.join('\n- '));
  }
}
function pegarCampoCentral_(linha, mapa, nome) {
  const indice = mapa[normalizarTextoCentral_(nome)];
  return indice === undefined ? '' : linha[indice];
}
function montarChaveOrigemCentral_(carimbo, numeroLinha) {
  if (carimbo instanceof Date && !isNaN(carimbo.getTime())) {
    return 'FORM|' + carimbo.getTime();
  }
  const texto = textoCentral_(carimbo);
  return 'FORM|' + (texto || ('LINHA-' + numeroLinha));
}
function determinarStatusRegistroCentral_(momento) {
  const texto = normalizarTextoCentral_(momento);
  if (/encerr|conclu|finaliz|fechamento/.test(texto)) return 'Atendimento concluído';
  if (/retorno|acompanh|andamento|atualiza|tratativa/.test(texto)) {
    return 'Atendimento em acompanhamento';
  }
  return 'Atendimento em aberto';
}
function resumirClassificacaoCentral_(valor) {
  return textoCentral_(valor) ? textoCentral_(valor).split(':')[0].trim() : '';
}
function limparProcedimentoExecutadoCentral_(valor) {
  const texto = textoCentral_(valor);
  const normalizado = normalizarTextoCentral_(texto);
  if (/^(ficha de atendimento|finalizacao de atendimento|relato de atividade|diagnostico de area|vistoria cautelar)$/.test(normalizado)) {
    return '';
  }
  return texto;
}
function valorPreferencialCentral_(valores) {
  for (let i = 0; i < valores.length; i++) {
    if (textoCentral_(valores[i])) return valores[i];
  }
  return '';
}
function numeroOuVazioCentral_(valor) {
  if (typeof valor === 'number' && !isNaN(valor)) return valor;
  const encontrado = textoCentral_(valor).replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return encontrado ? Number(encontrado[0]) : '';
}
function valorDataOrdenacaoCentral_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) return valor.getTime();
  if (typeof valor === 'number') return valor;
  const data = new Date(valor);
  return isNaN(data.getTime()) ? 0 : data.getTime();
}
function textoCentral_(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).replace(/\s+/g, ' ').trim();
}
function normalizarTextoCentral_(valor) {
  return textoCentral_(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
/*
 * CENTRAL DE ATENDIMENTOS 3.0
 *
 * Esta camada substitui a operação editável do Dashboard por uma leitura
 * automática dos eventos registrados nos Procedimentos de Campo.
 *
 * Prioridade do estado:
 * 1. finalização do atendimento;
 * 2. retorno da execução;
 * 3. reconciliação do Controle de Manifestações;
 * 4. abertura do atendimento.
 */
function sincronizarCentralAtendimentos(silencioso, opcoes) {
  opcoes = opcoes || {};
  const origem = abrirOrigemCentralAtendimentos_();
  const ativa = SpreadsheetApp.getActiveSpreadsheet();
  const executandoNaOrigem = ativa && ativa.getId() === origem.getId();
  if (!opcoes.baseJaSincronizada && executandoNaOrigem &&
      typeof sincronizarBaseConsolidada1e3 === 'function') {
    sincronizarBaseConsolidada1e3({origem: 'central de atendimentos 3.0'});
  }
  const dados = origem.getSheetByName(
    CONFIG_CENTRAL_ATENDIMENTOS.ABA_CONSOLIDADA
  ).getDataRange().getValues();
  const errosFontesExternas = [];
  const fontesExecucaoExterna = lerAbasExecucaoExternasCentralV46_(
    CENTRAL_V3.PLANILHA_EXECUCAO_ID,
    errosFontesExternas
  );
  const dadosSatisfacaoExterna = lerDadosPlanilhaExternaOpcionalCentralV3_(
    CENTRAL_V3.PLANILHA_SATISFACAO_ID,
    ['Informe o número de protocolo', 'A sua solicitação foi concluída?'],
    'Pesquisa final de satisfação',
    errosFontesExternas
  );
  if (errosFontesExternas.length) throw new Error('Fonte externa indisponível; carteira preservada. '+JSON.stringify(errosFontesExternas));
  const trava = LockService.getScriptLock();
  const adquiriu = trava.tryLock(silencioso ? 3000 : 30000);
  if (!adquiriu) {
    throw new Error(
      'Outra atualização da Central ainda está terminando. Aguarde alguns segundos e tente novamente.'
    );
  }
  try {
    const destino = SpreadsheetApp.openById(CONFIG_CENTRAL_ATENDIMENTOS.DESTINO_ID);
    const estrutura = garantirEstruturaDestinoCentral_(destino);
    prepararHistoricoCentralV3_(estrutura.historico);
    const idsExistentes = lerIdsBaseCentral_(estrutura.base);
    const correcoes = lerCorrecoesPendentesCentral_(estrutura.finalizacoesPendentes);
    let casos = filtrarCasosNovoSistemaCentral_(
      lerCasosFonteCentral_(dados).concat(
        lerAberturasExternasCentralV46_(fontesExecucaoExterna)
      ),
      idsExistentes
    );
    const auditoriaAberturas = auditarAberturasExternasCentralV46_(casos);
    atribuirIdsCentral_(casos, idsExistentes);
    prepararAbaCorrecoesFichaFinalCentralV4_(
      estrutura.correcoesFicha,
      casos,
      destino
    );
    const processamentoCorrecoes = aplicarCorrecoesFichaFinalCentralV4_(
      estrutura.correcoesFicha,
      casos,
      destino
    );
    escreverBaseCentral_(estrutura.base, casos);
    garantirEventosAberturaCentralV3_(estrutura.historico, casos);
    casos = casos.filter(c => !af_incorporado_(c.id));
    const casosPorId = indexarCasosPorIdCentral_(casos);
    const finalizacoes = lerFinalizacoesFonteCentral_(dados);
    const processamento = processarFinalizacoesCentral_(
      finalizacoes,
      casosPorId,
      estrutura.historico,
      correcoes
    );
    const satisfacoesExternas = lerSatisfacoesExternasCentralV3_(
      dadosSatisfacaoExterna
    );
    const processamentoSatisfacao = processarSatisfacoesExternasCentralV3_(
      satisfacoesExternas,
      casosPorId,
      estrutura.historico,
      correcoes
    );
    const execucoes = deduplicarExecucoesCentralV46_(
      lerExecucoesFonteCentralV3_(dados).concat(
        lerExecucoesExternasCentralV46_(fontesExecucaoExterna)
      )
    );
    const auditoriaExecucao = processarExecucoesCentralV3_(
      execucoes,
      casosPorId,
      estrutura.historico
    );
    registrarObservacoesFormularioNaComunicacaoCentralV46_(
      casos,
      execucoes,
      CENTRAL_V3.PLANILHA_EXECUCAO_ID,
      errosFontesExternas
    );
    const comunicacoes = lerComunicacoesExternasCentralV46_(
      CENTRAL_V3.PLANILHA_EXECUCAO_ID,
      errosFontesExternas
    );
    const auditoriaComunicacao = processarComunicacoesCentralV46_(
      comunicacoes,
      casosPorId,
      estrutura.historico
    );
    reconciliarCarteiraAnteriorCentralV3_(destino, casos, estrutura.historico);
    const encerramentosSemResposta = encerrarAtendimentosSemRespostaCentralV42_(
      casos,
      estrutura.historico,
      new Date()
    );
    const historico = lerHistoricoCentralV3_(estrutura.historico);
    const linhasCompletas = casos.map(function(caso) {
      const ids = [caso.id].concat(af_vinculos_().filter(v=>af_resolver_(v.principal,true)===caso.id).map(v=>v.idOrigem));
      const vistos = new Set(), eventos = [];
      ids.forEach(id=>(historico[id]||[]).filter(e=>id===caso.id||['Execução','Comunicação entre áreas','Checklist compartilhado'].includes(e.tipoEvento)).forEach(e=>{const k=e.chaveEvento||JSON.stringify(e);if(!vistos.has(k)){vistos.add(k);eventos.push(e);}}));
      return montarLinhaCentralV3_(caso, eventos, destino);
    });
    const linhasPainel = filtrarLinhasPainelCentralV3_(linhasCompletas);
    ordenarLinhasCentralV3_(linhasPainel);
    const finalizacoesParaConferir = processamento.pendentes.concat(
      processamentoSatisfacao.pendentes
    );
    escreverFinalizacoesPendentesCentral_(
      estrutura.finalizacoesPendentes,
      finalizacoesParaConferir,
      correcoes
    );
    escreverDashboardCentralV3_(destino, estrutura.dashboard, linhasPainel);
    escreverResumoOrigemCentralV3_(origem, destino, linhasPainel);
    escreverIndicadoresCentralV3_(
      estrutura.indicadores,
      casos,
      linhasCompletas,
      historico
    );
    escreverAuditoriaCentralV3_(
      destino,
      casos,
      linhasCompletas,
      errosFontesExternas.concat(
        auditoriaExecucao,
        auditoriaComunicacao,
        auditoriaAberturas,
        auditarFinalizacoesPendentesCentralV46_(finalizacoesParaConferir),
        processamentoSatisfacao.auditoria,
        processamentoCorrecoes.auditoria
      )
    );
    organizarAbasCentralV3_(
      destino,
      estrutura,
      processamento.pendentes.length + processamentoSatisfacao.pendentes.length
    );
    ocultarFichaLegadaCentral_(origem);
    if (!silencioso) {
      try {
        origem.toast(
          casos.length + ' atendimento(s), ' + execucoes.length +
            ' retorno(s) de execução e ' +
            (processamento.processadas + processamentoSatisfacao.processadas) +
            ' finalização(ões) processados. Correções aplicadas: ' +
            processamentoCorrecoes.aplicadas + '. Encerramentos sem resposta: ' +
            encerramentosSemResposta + '.',
          'Central de Atendimentos',
          7
        );
      } catch (erro) {}
    }
  } finally {
    trava.releaseLock();
  }
}
/** Mantida para compatibilidade com menus antigos. */
function prepararAbaCorrecoesFichaFinalCentralV4_(aba, casos, destino) {
  const c = CONFIG_CENTRAL_ATENDIMENTOS.CORES;
  const quantidadeReserva = 200;
  garantirDimensoesCentral_(aba, quantidadeReserva + 5, 16);
  if (aba.getFilter()) aba.getFilter().remove();
  aba.getRange('A1:M3').breakApart();
  aba.getRange('A1:M1').merge().setValue(
    'CORREÇÕES DA FICHA FINAL DE ATENDIMENTO'
  );
  aba.getRange('A2:M2').merge().setValue(
    'Corrija os campos da ficha, inclusive procedência e informações da execução, sem alterar as respostas originais.'
  );
  aba.getRange('A3:M3').merge().setValue(
    'Use uma linha por campo. Informe protocolo, campo, novo valor e motivo. Protocolo e registros de auditoria não podem ser alterados.'
  );
  aba.getRange('A1:M1').setBackground(c.AZUL_ESCURO).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(15).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  aba.getRange('A2:M2').setBackground(c.AZUL).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(9)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  aba.getRange('A3:M3').setBackground(c.AZUL_CLARO).setFontColor(c.AZUL_ESCURO)
    .setFontFamily('Arial').setFontSize(9).setFontStyle('italic')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  aba.getRange(5, 1, 1, 13)
    .setValues([CENTRAL_V4_CABECALHOS_CORRECOES.slice(0, 13)])
    .setBackground(c.AZUL_ESCURO).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(8).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setWrap(true);
  aba.getRange(5, 14, 1, 3)
    .setValues([CENTRAL_V4_CABECALHOS_CORRECOES.slice(13)])
    .setBackground(c.CINZA_CLARO).setFontColor(c.CINZA)
    .setFontFamily('Arial').setFontSize(8).setFontWeight('bold');
  const ids = (casos || []).map(function(caso) { return caso.id; })
    .filter(Boolean);
  const regraIds = SpreadsheetApp.newDataValidation()
    .requireValueInList(ids.length ? ids : ['Nenhum protocolo disponível'], true)
    .setAllowInvalid(false)
    .setHelpText('Selecione o protocolo que será corrigido.')
    .build();
  const regraCampos = SpreadsheetApp.newDataValidation()
    .requireValueInList(CENTRAL_V4_CAMPOS_CORRECAO, true)
    .setAllowInvalid(false)
    .setHelpText('Escolha somente o campo que precisa ser corrigido.')
    .build();
  const regraCheckbox = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .setAllowInvalid(false)
    .build();
  aba.getRange(6, 1, quantidadeReserva, 1).setDataValidation(regraIds);
  aba.getRange(6, 4, quantidadeReserva, 1).setDataValidation(regraCampos);
  aba.getRange(6, 8, quantidadeReserva, 1).setDataValidation(regraCheckbox);
  aba.getRange(6, 2, quantidadeReserva, 1).setNumberFormat('dd/MM/yyyy');
  aba.getRange(6, 10, quantidadeReserva, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  const ultima = Math.max(5, aba.getLastRow());
  if (ultima >= 6) {
    aba.getRange(6, 1, ultima - 5, 13)
      .setFontFamily('Arial').setFontSize(9).setFontColor(c.TEXTO)
      .setVerticalAlignment('top').setWrap(true);
    aba.setRowHeights(6, ultima - 5, 54);
    aba.getRange(5, 1, ultima - 4, 13).createFilter();
  }
  aba.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Aplicada')
      .setBackground(c.VERDE_CLARO).setFontColor('#24734C').setBold(true)
      .setRanges([aba.getRange(6, 9, quantidadeReserva, 1)]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains('Aguardando')
      .setBackground(c.LARANJA_CLARO).setFontColor('#98520F').setBold(true)
      .setRanges([aba.getRange(6, 9, quantidadeReserva, 1)]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains('Informe')
      .setBackground(c.AZUL_CLARO).setFontColor(c.AZUL_ESCURO).setBold(true)
      .setRanges([aba.getRange(6, 9, quantidadeReserva, 1)]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains('não localizado')
      .setBackground(c.VERMELHO_CLARO).setFontColor('#A83E31').setBold(true)
      .setRanges([aba.getRange(6, 9, quantidadeReserva, 1)]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains('ignorada')
      .setBackground(c.VERMELHO_CLARO).setFontColor('#A83E31').setBold(true)
      .setRanges([aba.getRange(6, 9, quantidadeReserva, 1)]).build()
  ]);
  aba.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function(p) {
    if (p.getDescription() === 'Campos automáticos das correções') p.remove();
  });
  [aba.getRange('B6:C205'), aba.getRange('E6:E205'), aba.getRange('I6:P205')]
    .forEach(function(intervalo) {
      intervalo.protect().setDescription('Campos automáticos das correções')
        .setWarningOnly(true);
    });
  aba.setHiddenGridlines(false);
  aba.setFrozenRows(5);
  aba.setFrozenColumns(0);
  aba.setTabColor(c.ROXO);
  aba.setRowHeight(1, 34);
  aba.setRowHeight(2, 23);
  aba.setRowHeight(3, 28);
  aba.setRowHeight(4, 8);
  aba.setRowHeight(5, 44);
  [120, 105, 175, 190, 250, 280, 260, 105, 200, 145, 190, 210, 100]
    .forEach(function(largura, indice) { aba.setColumnWidth(indice + 1, largura); });
  aba.hideColumns(14, 3);
}
function aplicarCorrecoesFichaFinalCentralV4_(aba, casos, destino) {
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 6) return {aplicadas: 0, auditoria: []};
  const quantidade = ultimaLinha - 5;
  const valores = aba.getRange(6, 1, quantidade, 16).getValues();
  const casosPorId = indexarCasosPorIdCentral_(casos);
  const historico = destino.getSheetByName(CONFIG_CENTRAL_ATENDIMENTOS.ABA_HISTORICO);
  const eventosPorId = historico ? lerHistoricoCentralV3_(historico) : {};
  const auditoria = [];
  let aplicadas = 0;
  valores.forEach(function(linha, indice) {
    const numeroLinha = indice + 6;
    const possuiConteudo = [linha[0], linha[3], linha[5], linha[6], linha[7],
      linha[8], linha[11], linha[13], linha[14], linha[15]]
      .some(valorPreenchidoCorrecaoCentralV4_);
    if (!possuiConteudo) return;
    const id = normalizarIdAtendimentoCentral_(linha[0]);
    const caso = casosPorId[id];
    if (!caso) {
      linha[8] = 'Protocolo não localizado';
      if (linha[7] === true) {
        auditoria.push({
          tipo: 'Correção sem vínculo',
          chave: 'CORRECAO|L' + numeroLinha,
          id: linha[0],
          detalhe: 'O protocolo informado não existe na base operacional.'
        });
      }
      return;
    }
    const jaAplicada = normalizarTextoCentral_(linha[8]).indexOf('aplicada') === 0 &&
      textoCentral_(linha[11]) && textoCentral_(linha[13]);
    const campo = jaAplicada ? linha[13] : linha[3];
    const novoValorInformado = jaAplicada ? linha[14] : linha[5];
    const motivo = jaAplicada ? linha[15] : linha[6];
    const eventos = eventosPorId[id] || [];
    const valorAtual = obterValorCampoCorrecaoCentralV4_(caso, campo, eventos);
    linha[1] = caso.data || caso.carimbo || '';
    linha[2] = caso.nome || '';
    if (!valorPreenchidoCorrecaoCentralV4_(linha[4])) linha[4] = valorAtual;
    if (jaAplicada) {
      const validacaoAnterior = normalizarValorCorrecaoCentralV4_(campo, novoValorInformado);
      if (validacaoAnterior.ok) {
        if (ehCampoOperacionalCorrecaoCentralV44_(campo)) {
          registrarCorrecaoOperacionalCentralV44_(
            historico,
            caso,
            campo,
            validacaoAnterior.valor,
            motivo,
            linha[11],
            eventos
          );
        } else {
          aplicarValorCorrecaoCasoCentralV4_(caso, campo, validacaoAnterior.valor);
        }
      }
      const alterouLinha = normalizarTextoCentral_(linha[3]) !==
          normalizarTextoCentral_(campo) ||
        textoComparavelCorrecaoCentralV4_(linha[5]) !==
          textoComparavelCorrecaoCentralV4_(novoValorInformado) ||
        textoComparavelCorrecaoCentralV4_(linha[6]) !==
          textoComparavelCorrecaoCentralV4_(motivo);
      linha[8] = alterouLinha
        ? 'Aplicada. Nova edição ignorada, crie outra linha'
        : 'Aplicada';
      return;
    }
    if (!textoCentral_(campo)) {
      linha[8] = 'Informe o campo a corrigir';
      return;
    }
    if (!valorPreenchidoCorrecaoCentralV4_(novoValorInformado)) {
      linha[8] = 'Informe o novo valor';
      return;
    }
    if (!textoCentral_(motivo)) {
      linha[8] = 'Informe o motivo da correção';
      return;
    }
    const validacao = normalizarValorCorrecaoCentralV4_(campo, novoValorInformado);
    if (!validacao.ok) {
      linha[8] = validacao.mensagem;
      if (linha[7] === true) {
        auditoria.push({
          tipo: 'Correção inválida',
          chave: 'CORRECAO|L' + numeroLinha,
          id: id,
          detalhe: validacao.mensagem
        });
      }
      return;
    }
    if (linha[7] !== true) {
      linha[8] = 'Aguardando confirmação';
      return;
    }
    const chaveAuditoria = Utilities.getUuid();
    if (ehCampoOperacionalCorrecaoCentralV44_(campo)) {
      registrarCorrecaoOperacionalCentralV44_(
        historico,
        caso,
        campo,
        validacao.valor,
        motivo,
        chaveAuditoria,
        eventos
      );
    } else {
      aplicarValorCorrecaoCasoCentralV4_(caso, campo, validacao.valor);
    }
    linha[8] = 'Aplicada';
    linha[9] = new Date();
    linha[10] = obterUsuarioCorrecaoCentralV4_();
    linha[11] = chaveAuditoria;
    linha[13] = campo;
    linha[14] = validacao.valor;
    linha[15] = textoCentral_(motivo);
    aplicadas++;
  });
  valores.forEach(function(linha) {
    const id = normalizarIdAtendimentoCentral_(linha[0]);
    const caso = casosPorId[id];
    if (!caso) return;
    linha[1] = caso.data || caso.carimbo || '';
    linha[2] = caso.nome || '';
    linha[12] = 'Abrir ficha';
  });
  aba.getRange(6, 1, quantidade, 16).setValues(valores);
  aba.getRange(6, 2, quantidade, 1).setNumberFormat('dd/MM/yyyy');
  aba.getRange(6, 10, quantidade, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  valores.forEach(function(linha, indice) {
    const id = normalizarIdAtendimentoCentral_(linha[0]);
    if (!casosPorId[id]) return;
    const link = localizarLinkFichaCentralV3_(destino, id).ficha || destino.getUrl();
    definirLinkCentral_(aba.getRange(indice + 6, 13), 'Abrir ficha', link);
  });
  return {aplicadas: aplicadas, auditoria: auditoria};
}
function ehCampoOperacionalCorrecaoCentralV44_(campo) {
  const n = normalizarTextoCentral_(campo);
  return CENTRAL_V4_CAMPOS_OPERACIONAIS_CORRECAO
    .map(normalizarTextoCentral_).indexOf(n) >= 0;
}
function valorCorrecaoOperacionalCentralV44_(eventos, campo) {
  const origemEsperada = normalizarTextoCentral_(
    'Correção da Ficha Final: ' + textoCentral_(campo)
  );
  const ordenados = (eventos || []).slice().sort(function(a, b) {
    return valorDataOrdenacaoCentral_(a.dataHora) -
      valorDataOrdenacaoCentral_(b.dataHora);
  });
  for (let i = ordenados.length - 1; i >= 0; i--) {
    if (normalizarTextoCentral_(ordenados[i].origemAtualizacao) === origemEsperada) {
      return ordenados[i].comentarioFinalizacao;
    }
  }
  return '';
}
function ultimoValorEventoCentralV44_(eventos, campo, filtro) {
  const ordenados = (eventos || []).slice().sort(function(a, b) {
    return valorDataOrdenacaoCentral_(a.dataHora) -
      valorDataOrdenacaoCentral_(b.dataHora);
  });
  for (let i = ordenados.length - 1; i >= 0; i--) {
    if (filtro && !filtro(ordenados[i])) continue;
    if (valorPreenchidoCorrecaoCentralV4_(ordenados[i][campo])) {
      return ordenados[i][campo];
    }
  }
  return '';
}
function obterValorCampoCorrecaoCentralV4_(caso, campo, eventos) {
  const n = normalizarTextoCentral_(campo);
  const corrigido = valorCorrecaoOperacionalCentralV44_(eventos, campo);
  if (ehCampoOperacionalCorrecaoCentralV44_(campo) &&
      valorPreenchidoCorrecaoCentralV4_(corrigido)) {
    return textoCentral_(corrigido) === CENTRAL_V46_MARCADOR_REMOCAO
      ? '' : corrigido;
  }
  const ultimo = selecionarEventoAtualCentralV3_(eventos || []);
  if (n === 'data de abertura') return caso.data || caso.carimbo || '';
  if (n === 'horario do atendimento') return caso.horario || '';
  if (n === 'local do atendimento') return caso.local || '';
  if (n === 'responsavel pelo atendimento') return caso.responsavelRegistro || '';
  if (n === 'nome do solicitante') return caso.nome || '';
  if (n === 'telefone') return caso.telefones || '';
  if (n === 'e-mail' || n === 'email') return caso.email || '';
  if (n === 'endereco') return caso.endereco || caso.local || '';
  if (n === 'canal de recebimento') return caso.canalRecebimento || '';
  if (n === 'frente de obra') return caso.segmento || caso.area || '';
  if (n === 'tipo de manifestacao') return caso.tipoManifestacao || '';
  if (n === 'assunto principal') return caso.assunto || '';
  if (n === 'texto da solicitacao') return caso.solicitacao || '';
  if (n === 'descricao detalhada da ocorrencia') {
    return caso.descricaoDetalhada || '';
  }
  if (n === 'grau de urgencia') return caso.urgencia || '';
  if (n === 'providencias iniciais') return caso.tratativaInicial || '';
  if (n === 'fotos da abertura') return caso.arquivos || '';
  if (n === 'procedencia') return ultimo.procedencia || 'Em análise';
  if (n === 'responsavel atual') {
    return ultimo.responsavel || caso.responsavelInicial || '';
  }
  if (n === 'responsavel pela execucao') {
    return ultimoValorEventoCentralV44_(eventos, 'executadoPor');
  }
  if (n === 'data da execucao') {
    return ultimoValorEventoCentralV44_(eventos, 'dataExecucao');
  }
  if (n === 'providencias executadas') {
    return ultimoValorEventoCentralV44_(eventos, 'observacao', function(evento) {
      return normalizarTextoCentral_(evento.tipoEvento) === 'execucao';
    }) || caso.procedimentoExecutado || '';
  }
  if (n === 'conclusao ou devolutiva final') {
    return ultimoValorEventoCentralV44_(eventos, 'comentarioFinalizacao', function(evento) {
      return normalizarStatusCentralV3_(evento.status) === 'Concluída';
    }) || ultimoValorEventoCentralV44_(eventos, 'observacao', function(evento) {
      return normalizarStatusCentralV3_(evento.status) === 'Concluída';
    }) || caso.comentarioFinal || '';
  }
  if (n === 'fotos da execucao') {
    return ultimoValorEventoCentralV44_(eventos, 'evidencias');
  }
  if (n === 'status do atendimento') {
    return normalizarStatusCentralV3_(ultimo.status || caso.statusRegistro);
  }
  if (n === 'data de conclusao') {
    return ultimoValorEventoCentralV44_(eventos, 'dataHora', function(evento) {
      return normalizarStatusCentralV3_(evento.status) === 'Concluída';
    });
  }
  return '';
}
function aplicarValorCorrecaoCasoCentralV4_(caso, campo, valor) {
  if (textoCentral_(valor) === CENTRAL_V46_MARCADOR_REMOCAO) valor = '';
  const n = normalizarTextoCentral_(campo);
  if (n === 'data de abertura') caso.data = valor;
  else if (n === 'horario do atendimento') caso.horario = valor;
  else if (n === 'local do atendimento') caso.local = valor;
  else if (n === 'responsavel pelo atendimento') caso.responsavelRegistro = valor;
  else if (n === 'nome do solicitante') caso.nome = valor;
  else if (n === 'telefone') caso.telefones = valor;
  else if (n === 'e-mail' || n === 'email') caso.email = valor;
  else if (n === 'endereco') caso.endereco = valor;
  else if (n === 'canal de recebimento') caso.canalRecebimento = valor;
  else if (n === 'frente de obra') caso.segmento = valor;
  else if (n === 'tipo de manifestacao') caso.tipoManifestacao = valor;
  else if (n === 'assunto principal') caso.assunto = valor;
  else if (n === 'texto da solicitacao') caso.solicitacao = valor;
  else if (n === 'descricao detalhada da ocorrencia') {
    caso.descricaoDetalhada = valor;
  } else if (n === 'grau de urgencia') caso.urgencia = valor;
  else if (n === 'providencias iniciais') caso.tratativaInicial = valor;
  else if (n === 'fotos da abertura') caso.arquivos = valor;
  return caso;
}
function registrarCorrecaoOperacionalCentralV44_(
  historico, caso, campo, valor, motivo, chaveAuditoria, eventos
) {
  if (!historico) {
    throw new Error('A página Histórico não foi encontrada para registrar a correção.');
  }
  const chaveEvento = 'CORRECAO_FICHA|' + textoCentral_(chaveAuditoria);
  const existentes = lerChavesHistoricoCentralV3_(historico);
  if (existentes[chaveEvento]) return false;
  const n = normalizarTextoCentral_(campo);
  const ultimo = selecionarEventoAtualCentralV3_(eventos || []);
  let status = normalizarStatusCentralV3_(ultimo.status || caso.statusRegistro);
  let procedencia = textoCentral_(ultimo.procedencia) || 'Em análise';
  let responsavel = textoCentral_(ultimo.responsavel) || caso.responsavelInicial || '';
  let area = textoCentral_(ultimo.bola) ||
    (status === 'Concluída'
      ? CENTRAL_V3.RESPONSABILIDADES.CONCLUIDO
      : CENTRAL_V3.RESPONSABILIDADES.EXECUCAO);
  let proximaAcao = textoCentral_(ultimo.proximaAcao) ||
    definirProximaAcaoCentralV3_(status, area, ultimo);
  let dataExecucao = '';
  let executadoPor = '';
  let evidencias = '';
  if (n === 'procedencia') {
    procedencia = valor;
  } else if (n === 'status do atendimento') {
    status = normalizarStatusCentralV3_(valor);
  } else if (n === 'responsavel atual') {
    responsavel = valor;
  } else if (n === 'responsavel pela execucao') {
    executadoPor = valor;
  } else if (n === 'data da execucao') {
    dataExecucao = valor;
  } else if (n === 'fotos da execucao') {
    evidencias = valor;
  }
  const naoProcedente = /nao procedente/.test(normalizarTextoCentral_(procedencia));
  if (status === 'Concluída') {
    area = CENTRAL_V3.RESPONSABILIDADES.CONCLUIDO;
    proximaAcao = 'Nenhuma pendência';
  } else if (naoProcedente) {
    status = 'Aguardando finalização';
    area = CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO;
    proximaAcao = 'Registrar a devolutiva ao cliente e encerrar o atendimento';
  } else if (n === 'procedencia' || n === 'status do atendimento') {
    if (status === 'Aguardando finalização') {
      area = CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO;
      proximaAcao = 'Aplicar a pesquisa de satisfação ou concluir pela planilha';
    } else {
      area = CENTRAL_V3.RESPONSABILIDADES.EXECUCAO;
      proximaAcao = status === 'Recebida'
        ? 'Analisar a demanda e registrar a providência'
        : 'Concluir a providência e registrar retorno';
    }
  }
  const valorDescricao = textoCentral_(valor) === CENTRAL_V46_MARCADOR_REMOCAO
    ? 'informação removida'
    : (valor instanceof Date && !isNaN(valor.getTime())
      ? Utilities.formatDate(valor, 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm')
      : textoCentral_(valor));
  const evento = {
    id: caso.id,
    dataHora: new Date(),
    usuario: obterUsuarioCorrecaoCentralV4_(),
    status: status,
    procedencia: procedencia,
    responsavel: responsavel,
    observacao: 'Correção confirmada no campo ' + campo + '. Motivo: ' +
      textoCentral_(motivo) + '. Novo valor: ' + valorDescricao + '.',
    origemAtualizacao: 'Correção da Ficha Final: ' + campo,
    comentarioFinalizacao: valor,
    tipoEvento: 'Correção da Ficha',
    bola: area,
    proximaAcao: proximaAcao,
    chaveEvento: chaveEvento,
    dataExecucao: dataExecucao,
    executadoPor: executadoPor,
    evidencias: evidencias
  };
  const adicionou = appendEventoCentralV3_(historico, evento);
  if (adicionou && eventos) eventos.push(evento);
  return adicionou;
}
function normalizarValorCorrecaoCentralV4_(campo, valor) {
  const n = normalizarTextoCentral_(campo);
  if (CENTRAL_V4_CAMPOS_CORRECAO.map(normalizarTextoCentral_).indexOf(n) < 0) {
    return {ok: false, valor: '', mensagem: 'Campo de correção não permitido'};
  }
  if (textoCentral_(valor) === CENTRAL_V46_MARCADOR_REMOCAO) {
    const opcionais = [
      'telefone', 'e-mail', 'email', 'descricao detalhada da ocorrencia',
      'providencias iniciais', 'fotos da abertura', 'fotos da execucao'
    ];
    return opcionais.indexOf(n) >= 0
      ? {ok: true, valor: CENTRAL_V46_MARCADOR_REMOCAO, mensagem: ''}
      : {ok: false, valor: '', mensagem: 'Este campo não pode ficar vazio'};
  }
  if (n === 'data de abertura' || n === 'data da execucao' ||
      n === 'data de conclusao') {
    const data = dataValidaCentral_(valor);
    return data
      ? {ok: true, valor: data, mensagem: ''}
      : {ok: false, valor: '', mensagem: 'Informe uma data válida'};
  }
  if (n === 'grau de urgencia') {
    const urgencia = localizarOpcaoCorrecaoCentralV4_(
      valor,
      ['Baixo', 'Médio', 'Alto', 'Urgente', 'Não informada']
    );
    return urgencia
      ? {ok: true, valor: urgencia, mensagem: ''}
      : {ok: false, valor: '', mensagem: 'Use Baixo, Médio, Alto ou Urgente'};
  }
  if (n === 'canal de recebimento') {
    const canal = localizarOpcaoCorrecaoCentralV4_(valor, CENTRAL_V4_CANAIS);
    return canal
      ? {ok: true, valor: canal, mensagem: ''}
      : {ok: false, valor: '', mensagem: 'Selecione um canal válido'};
  }
  if (n === 'tipo de manifestacao') {
    const tipo = localizarOpcaoCorrecaoCentralV4_(valor, CENTRAL_V4_TIPOS_MANIFESTACAO);
    return tipo
      ? {ok: true, valor: tipo, mensagem: ''}
      : {ok: false, valor: '', mensagem: 'Selecione um tipo de manifestação válido'};
  }
  if (n === 'procedencia') {
    const procedencia = localizarOpcaoCorrecaoCentralV4_(
      valor,
      CENTRAL_V4_PROCEDENCIAS_CORRECAO
    );
    return procedencia
      ? {ok: true, valor: procedencia, mensagem: ''}
      : {ok: false, valor: '', mensagem: 'Selecione uma procedência válida'};
  }
  if (n === 'status do atendimento') {
    if (normalizarStatusCentralV3_(valor) === 'Concluída') {
      return {
        ok: false,
        valor: '',
        mensagem: 'Conclua pela pesquisa ou pela área Encerramento do Painel de Trabalho'
      };
    }
    const status = localizarOpcaoCorrecaoCentralV4_(
      valor,
      CENTRAL_V4_STATUS_CORRECAO
    );
    return status
      ? {ok: true, valor: status, mensagem: ''}
      : {ok: false, valor: '', mensagem: 'Selecione um status operacional válido'};
  }
  const texto = textoCentral_(valor);
  return texto
    ? {ok: true, valor: texto, mensagem: ''}
    : {ok: false, valor: '', mensagem: 'Informe o novo valor'};
}
function localizarOpcaoCorrecaoCentralV4_(valor, opcoes) {
  const n = normalizarTextoCentral_(valor);
  for (let i = 0; i < opcoes.length; i++) {
    if (normalizarTextoCentral_(opcoes[i]) === n) return opcoes[i];
  }
  return '';
}
function valorPreenchidoCorrecaoCentralV4_(valor) {
  return valor === true || valor === false || valor === 0 || Boolean(textoCentral_(valor));
}
function textoComparavelCorrecaoCentralV4_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) return String(valor.getTime());
  return normalizarTextoCentral_(valor);
}
function obterUsuarioCorrecaoCentralV4_() {
  try {
    return Session.getActiveUser().getEmail() || 'Usuário autorizado';
  } catch (erro) {
    return 'Usuário autorizado';
  }
}
function prepararHistoricoCentralV3_(aba) {
  garantirDimensoesCentral_(aba, 50, CENTRAL_V3_CABECALHOS_HISTORICO.length);
  aba.getRange(1, 1, 1, CENTRAL_V3_CABECALHOS_HISTORICO.length)
    .setValues([CENTRAL_V3_CABECALHOS_HISTORICO])
    .setBackground(CONFIG_CENTRAL_ATENDIMENTOS.CORES.AZUL_ESCURO)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  aba.setFrozenRows(1);
}
function garantirEventosAberturaCentralV3_(historico, casos) {
  const existente = lerHistoricoCentralV3_(historico);
  casos.forEach(function(caso) {
    const responsabilidadeInicial = normalizarResponsabilidadeAberturaCentralV46_(
      caso.segmento
    ) || CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO;
    const semSegmentoInformado = !textoCentral_(caso.segmento);
    const acaoInicial = semSegmentoInformado
      ? 'Validar o encaminhamento inicial e completar os dados da abertura'
      : (responsabilidadeInicial === CENTRAL_V3.RESPONSABILIDADES.EXECUCAO
        ? 'Analisar a demanda e registrar a providência'
        : 'Analisar a demanda e registrar o encaminhamento');
    const pediuEncerramentoImediato = respostaPositivaCentralV3_(
      caso.conclusaoDeclarada
    );
    const encerramentoImediatoIncompleto = pediuEncerramentoImediato &&
      (caso.notaEncerramento === '' || !textoCentral_(caso.clarezaEncerramento));
    if (existente[caso.id] && existente[caso.id].length) {
      if (encerramentoImediatoIncompleto) {
        const dataBase = dataValidaCentral_(caso.carimbo || caso.data) || new Date();
        appendEventoCentralV3_(historico, {
          id: caso.id,
          dataHora: new Date(dataBase.getTime() + 1000),
          usuario: caso.responsavelRegistro || 'Registro do formulário',
          status: 'Em andamento',
          procedencia: 'Em análise',
          responsavel: caso.responsavelInicial || '',
          observacao: 'A conclusão foi indicada, mas falta registrar a solução imediata para encerrar com segurança.',
          origemAtualizacao: 'Revisão automática do encerramento imediato',
          tipoEvento: 'Tarefa do Atendimento',
          bola: CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO,
          proximaAcao: 'Registrar a solução imediata e confirmar o encerramento',
          chaveEvento: 'REVISAO_IMEDIATA|' + caso.chaveOrigem
        });
      }
      return;
    }
    appendEventoCentralV3_(historico, {
      id: caso.id,
      dataHora: caso.carimbo || caso.data || new Date(),
      usuario: caso.responsavelRegistro || 'Registro do formulário',
      status: encerramentoImediatoIncompleto ? 'Em andamento' : 'Recebida',
      procedencia: 'Em análise',
      responsavel: caso.responsavelInicial || '',
      observacao: encerramentoImediatoIncompleto
        ? 'A conclusão foi indicada, mas falta registrar a solução imediata para encerrar com segurança.'
        : (caso.tratativaInicial || 'Atendimento recebido e encaminhado.'),
      origemAtualizacao: 'Abertura pelo formulário',
      tipoEvento: 'Abertura',
      bola: encerramentoImediatoIncompleto
        ? CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO
        : responsabilidadeInicial,
      proximaAcao: encerramentoImediatoIncompleto
        ? 'Registrar a solução imediata e confirmar o encerramento'
        : acaoInicial,
      chaveEvento: 'ABERTURA|' + caso.chaveOrigem
    });
  });
}
function normalizarResponsabilidadeAberturaCentralV46_(valor){return af_responsavel_(valor);}
function appendEventoCentralV3_(historico, item) {
  const chaves = lerChavesHistoricoCentralV3_(historico);
  if (item.chaveEvento && chaves[item.chaveEvento]) return false;
  const linha = Math.max(2, historico.getLastRow() + 1);
  historico.getRange(linha, 1, 1, CENTRAL_V3_CABECALHOS_HISTORICO.length)
    .setValues([[
      item.id, item.dataHora || new Date(), item.usuario || '', item.status || '',
      item.procedencia || 'Em análise', item.responsavel || '', item.observacao || '',
      item.origemAtualizacao || '', item.chaveFinalizacao || '',
      item.solicitacaoAtendida || '', item.conclusaoConfirmada || '',
      item.notaFinal === 0 ? 0 : (item.notaFinal || ''),
      item.informacoesClarasFinal || '', item.comentarioFinalizacao || '',
      item.tipoEvento || '', item.bola || '', item.proximaAcao || '',
      item.chaveEvento || '', item.dataExecucao || '', item.executadoPor || '',
      item.evidencias || ''
    ]]);
  historico.getRange(linha, 2).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  historico.getRange(linha, 19).setNumberFormat('dd/MM/yyyy');
  return true;
}
function lerChavesHistoricoCentralV3_(historico) {
  const mapa = {};
  if (historico.getLastRow() < 2 || historico.getMaxColumns() < 18) return mapa;
  historico.getRange(2, 18, historico.getLastRow() - 1, 1).getValues()
    .forEach(function(linha) {
      const chave = textoCentral_(linha[0]);
      if (chave) mapa[chave] = true;
    });
  return mapa;
}
function lerHistoricoCentralV3_(historico) {
  const saida = {};
  if (historico.getLastRow() < 2) return saida;
  prepararHistoricoCentralV3_(historico);
  historico.getRange(
    2,
    1,
    historico.getLastRow() - 1,
    CENTRAL_V3_CABECALHOS_HISTORICO.length
  ).getValues().forEach(function(linha) {
    const id = textoCentral_(linha[0]);
    if (!id) return;
    if (!saida[id]) saida[id] = [];
    const origem = textoCentral_(linha[7]);
    const tipo = textoCentral_(linha[14]) || tipoEventoPorOrigemCentralV3_(origem);
    saida[id].push({
      id: id,
      dataHora: linha[1],
      usuario: linha[2],
      status: normalizarStatusCentralV3_(linha[3]),
      procedencia: textoCentral_(linha[4]) || 'Em análise',
      responsavel: linha[5],
      observacao: linha[6],
      origemAtualizacao: origem,
      chaveFinalizacao: linha[8],
      solicitacaoAtendida: linha[9],
      conclusaoConfirmada: linha[10],
      notaFinal: linha[11],
      informacoesClarasFinal: linha[12],
      comentarioFinalizacao: linha[13],
      tipoEvento: tipo,
      bola: linha[15],
      proximaAcao: linha[16],
      chaveEvento: linha[17],
      dataExecucao: linha[18],
      executadoPor: linha[19],
      evidencias: linha[20]
    });
  });
  Object.keys(saida).forEach(function(id) {
    saida[id].sort(function(a, b) {
      return valorDataOrdenacaoCentral_(a.dataHora) - valorDataOrdenacaoCentral_(b.dataHora);
    });
  });
  return saida;
}
function tipoEventoPorOrigemCentralV3_(origem) {
  const n = normalizarTextoCentral_(origem);
  if (/comunicacao entre atendimento e execucao/.test(n)) {
    return 'Comunicação entre áreas';
  }
  if (/correcao da ficha final/.test(n)) return 'Correção da Ficha';
  if (/finaliza|encerramento/.test(n)) return 'Finalização';
  if (/execucao|obra/.test(n)) return 'Execução';
  if (/tarefa.*atendimento|demanda.*atendimento/.test(n)) return 'Tarefa do Atendimento';
  if (/reconcilia|controle/.test(n)) return 'Reconciliação';
  return 'Acompanhamento';
}
function normalizarStatusCentralV3_(valor) {
  const n = normalizarTextoCentral_(valor);
  if (/conclu|encerr|finalizad|resolvid/.test(n)) return 'Concluída';
  if (/aguard.*final|pesquisa.*satisfa/.test(n)) return 'Aguardando finalização';
  if (/andamento|execucao|acompanha/.test(n)) return 'Em andamento';
  return 'Recebida';
}
function lerExecucoesFonteCentralV3_(dados) {
  if (!dados || dados.length < 2) return [];
  const mapa = montarMapaCentral_(dados[0]);
  return dados.slice(1).map(function(linha, indice) {
    const procedimento = pegarPrimeiroCampoCentralV3_(linha, mapa, [
      'Selecione o procedimento a ser executado'
    ]);
    if (!/execucao.*atendimento|retorno.*execucao|resolucao.*atendimento|tratativa.*execucao/i
      .test(normalizarTextoCentral_(procedimento))) return null;
    const carimbo = pegarPrimeiroCampoCentralV3_(linha, mapa, ['Carimbo de data/hora']);
    return {
      chave: 'EXEC|' + valorDataOrdenacaoCentral_(carimbo) + '|L' + (indice + 2),
      carimbo: carimbo,
      idInformado: pegarPrimeiroCampoCentralV3_(linha, mapa, [
        'Informe o ID do atendimento', 'Informe o protocolo do atendimento',
        'Número do protocolo', 'Protocolo do atendimento'
      ]),
      procedencia: pegarPrimeiroCampoCentralV3_(linha, mapa, [
        'A demanda é procedente?', 'A reclamação é procedente?',
        'A ocorrência é procedente?'
      ]),
      resolvida: pegarPrimeiroCampoCentralV3_(linha, mapa, [
        'A demanda foi totalmente resolvida?', 'A demanda foi resolvida?',
        'O atendimento foi finalizado pela execução?', 'A providência foi concluída?'
      ]),
      executadoPor: pegarPrimeiroCampoCentralV3_(linha, mapa, [
        'Quem executou o atendimento?', 'Responsável pela execução',
        'Nome de quem executou a providência'
      ]),
      dataExecucao: pegarPrimeiroCampoCentralV3_(linha, mapa, [
        'Data da execução', 'Data da providência', 'Data da resolução'
      ]),
      descricao: pegarPrimeiroCampoCentralV3_(linha, mapa, [
        'Descreva detalhadamente o que foi executado',
        'Descrição da providência executada', 'O que foi resolvido?',
        'Observação detalhada da execução'
      ]),
      evidencias: pegarPrimeiroCampoCentralV3_(linha, mapa, [
        'Adicione evidências da execução', 'Fotos da execução',
        'Imagens ou arquivos da resolução'
      ]),
      responsavelRegistro: pegarPrimeiroCampoCentralV3_(linha, mapa, [
        'Colaborador responsável pelo registro'
      ])
    };
  }).filter(Boolean);
}
function pegarPrimeiroCampoCentralV3_(linha, mapa, nomes) {
  for (let i = 0; i < nomes.length; i++) {
    const valor = pegarCampoCentral_(linha, mapa, nomes[i]);
    if (textoCentral_(valor)) return valor;
  }
  return '';
}
function lerDadosPlanilhaExternaCentralV3_(planilhaId, cabecalhosObrigatorios) {
  let planilha;
  try {
    planilha = SpreadsheetApp.openById(planilhaId);
  } catch (erro) {
    throw new Error(
      'Não foi possível acessar uma das planilhas externas do atendimento. ' +
      'Confirme o compartilhamento com a conta que executa o Apps Script. Detalhe: ' +
      erro.message
    );
  }
  const abas = planilha.getSheets();
  for (let i = 0; i < abas.length; i++) {
    const dados = abas[i].getDataRange().getValues();
    if (!dados.length) continue;
    const mapa = montarMapaCentral_(dados[0]);
    const completa = cabecalhosObrigatorios.every(function(cabecalho) {
      return mapa[normalizarTextoCentral_(cabecalho)] !== undefined;
    });
    if (completa) return dados;
  }
  throw new Error(
    'A planilha externa foi acessada, mas a página de respostas esperada não foi localizada.'
  );
}
function lerDadosPlanilhaExternaOpcionalCentralV3_(
  planilhaId,
  cabecalhosObrigatorios,
  nomeFonte,
  auditoria
) {
  try {
    return lerDadosPlanilhaExternaCentralV3_(planilhaId, cabecalhosObrigatorios);
  } catch (erro) {
    const detalhe = nomeFonte + ': ' + erro.message;
    console.error(detalhe);
    if (auditoria) {
      auditoria.push({
        tipo: 'Fonte externa indisponível',
        chave: nomeFonte,
        id: '',
        detalhe: detalhe
      });
    }
    return [];
  }
}
/**
 * Lê todas as páginas de respostas compatíveis da planilha de Execução.
 * A mudança de estrutura do Forms criou duas páginas com ordens de colunas
 * diferentes; por isso cada página conserva o seu próprio cabeçalho.
 */
function lerAbasExecucaoExternasCentralV46_(planilhaId, auditoria) {
  try {
    const planilha = SpreadsheetApp.openById(planilhaId);
    const fontes = [];
    planilha.getSheets().forEach(function(aba) {
      if (aba.getLastRow() < 1 || aba.getLastColumn() < 2) return;
      const dados = aba.getDataRange().getValues();
      const mapa = montarMapaCentral_(dados[0]);
      const temCarimbo = mapa[normalizarTextoCentral_('Carimbo de data/hora')] !== undefined;
      const temProtocolo = mapa[normalizarTextoCentral_('Qual o número de protocolo?')] !== undefined;
      const temModo = mapa[normalizarTextoCentral_(
        'Você está abrindo ou executando uma ficha?'
      )] !== undefined;
      if (temCarimbo && (temProtocolo || temModo)) {
        fontes.push({nome: aba.getName(), dados: dados});
      }
    });
    if (!fontes.length) {
      throw new Error('Nenhuma página de respostas compatível foi localizada.');
    }
    return fontes;
  } catch (erro) {
    const detalhe = 'Formulário de execução: ' + erro.message;
    console.error(detalhe);
    if (auditoria) {
      auditoria.push({
        tipo: 'Fonte externa indisponível',
        chave: 'Formulário de execução',
        id: '',
        detalhe: detalhe
      });
    }
    return [];
  }
}
function lerAberturasExternasCentralV46_(fontes) {
  const encontradas = {};
  (fontes || []).forEach(function(fonte) {
    const dados = fonte.dados || [];
    if (dados.length < 2) return;
    const mapa = montarMapaCentral_(dados[0]);
    dados.slice(1).forEach(function(linha, indice) {
      const campo = function(nomes) {
        return pegarPrimeiroCampoCentralV3_(linha, mapa, nomes);
      };
      const modo = normalizarTextoCentral_(campo([
        'Você está abrindo ou executando uma ficha?'
      ]));
      if (!/abrindo|novo atendimento/.test(modo)) return;
      const carimbo = campo(['Carimbo de data/hora']);
      const endereco = campo([
        'Endereço completo', 'Endereço onde o serviço foi executado'
      ]);
      const solicitacao = campo(['Qual foi a solicitação ou reclamação?']);
      const assunto = campo(['Assunto']);
      if (![carimbo, endereco, solicitacao, assunto].some(function(v) {
        return Boolean(textoCentral_(v));
      })) return;
      const contato = separarContatoAberturaCentralV46_(campo([
        'Se sim coloque nome completo e telefone ou email de solicitantes'
      ]));
      const autor = campo([
        'Identifique-se, quem fez a execução',
        'Identique-se, quem fez a execução',
        'Indentique-se, quem fez a execução',
        'Indentifique-se, quem fez a execução',
        'Responsável pela execução',
        'Endereço de e-mail',
        'E-mail'
      ]);
      const dataInformada = campo([
        'Data de abertura do atendimento',
        'Data da abertura da ficha',
        'Data do atendimento'
      ]);
      const segmento = campo([
        'A demanda deve ser encaminhada para qual segmento do Consórcio?'
      ]);
      const assinatura = [
        valorDataOrdenacaoCentral_(carimbo),
        normalizarTextoCentral_(endereco),
        normalizarTextoCentral_(solicitacao),
        normalizarTextoCentral_(contato.nome)
      ].join('|');
      const chave = 'EXEC_ABERTURA|' + hashTextoCentralV3_(assinatura);
      if (encontradas[chave]) return;
      encontradas[chave] = {
        chaveOrigem: chave,
        id: '',
        linhaOrigem: fonte.nome + '!L' + (indice + 2),
        carimbo: carimbo,
        data: dataInformada || carimbo,
        horario: carimbo,
        momento: 'Abertura: Novo atendimento pela Execução',
        statusRegistro: 'Recebida',
        empresa: CONFIG_CENTRAL_ATENDIMENTOS.EMPRESA,
        responsavelRegistro: autor,
        local: endereco,
        assunto: assunto,
        tipoManifestacao: campo(['Tipo de Manifestação']),
        nome: contato.nome,
        telefones: contato.telefone,
        email: contato.email,
        endereco: endereco,
        solicitacao: solicitacao,
        tratativaInicial: campo(['Qual trabalho ou providências foram realizadas?']),
        urgencia: '',
        canalRecebimento: '',
        segmento: segmento,
        possivelSinistro: '',
        responsavelInicial: autor,
        arquivos: campo(['Fotos da execução e documentos quando houver']),
        informacoesClaras: '',
        solicitacaoAtendida: '',
        conclusaoDeclarada: '',
        notaEncerramento: '',
        clarezaEncerramento: '',
        grupoComunicacao: '',
        nota: '',
        pontoReferencia: '',
        tipoLocal: '',
        descricaoDetalhada: solicitacao,
        area: segmento,
        procedimentoExecutado: 'Abertura registrada pela Execução',
        jaAbordadoPesquisa: '',
        // Esta resposta é administrativa e segue para a base compartilhada,
        // nunca para a conclusão pública da ficha Sabesp.
        comentarioFinal: '',
        observacaoSeguimento: campo(['Observações para o seguimento da ficha'])
      };
      encontradas[chave].dataAberturaInferida = !textoCentral_(dataInformada);
      encontradas[chave].segmentoAusente = !textoCentral_(segmento);
      encontradas[chave].contatoIncompleto = !textoCentral_(contato.nome);
    });
  });
  return Object.keys(encontradas).map(function(chave) {
    return encontradas[chave];
  }).sort(function(a, b) {
    return valorDataOrdenacaoCentral_(a.carimbo) - valorDataOrdenacaoCentral_(b.carimbo);
  });
}
function auditarAberturasExternasCentralV46_(casos) {
  const saida = [];
  (casos || []).forEach(function(caso) {
    if (String(caso.chaveOrigem || '').indexOf('EXEC_ABERTURA|') !== 0) return;
    if (caso.dataAberturaInferida) {
      saida.push({
        tipo: 'Abertura da Execução para conferir',
        chave: caso.chaveOrigem,
        id: caso.id,
        detalhe: 'O formulário não informou a data da abertura; o carimbo foi usado provisoriamente.'
      });
    }
    if (caso.segmentoAusente) {
      saida.push({
        tipo: 'Encaminhamento inicial para conferir',
        chave: caso.chaveOrigem,
        id: caso.id,
        detalhe: 'O formulário não informou o segmento responsável; a triagem ficou com o Atendimento.'
      });
    }
    if (caso.contatoIncompleto) {
      saida.push({
        tipo: 'Contato da abertura incompleto',
        chave: caso.chaveOrigem,
        id: caso.id,
        detalhe: 'Não foi possível identificar o nome do solicitante no campo de contato.'
      });
    }
  });
  return saida;
}
function separarContatoAberturaCentralV46_(valor) {
  const original = textoCentral_(valor);
  const email = (original.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [''])[0];
  const telefoneEncontrado = original.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?9?\d{4}[-.\s]?\d{4}/);
  const telefone = telefoneEncontrado ? textoCentral_(telefoneEncontrado[0]) : '';
  let nome = original;
  if (email) nome = nome.replace(email, ' ');
  if (telefone) nome = nome.replace(telefone, ' ');
  nome = nome.replace(/[|;,\/]+/g, ' ').replace(/\s+/g, ' ').trim();
  return {nome: nome, telefone: telefone, email: email};
}
function lerExecucoesExternasCentralV46_(fontes) {
  let saida = [];
  (fontes || []).forEach(function(fonte) {
    saida = saida.concat(lerExecucoesExternasCentralV3_(fonte.dados));
  });
  return saida;
}
function deduplicarExecucoesCentralV46_(execucoes) {
  const chaves = {};
  return (execucoes || []).filter(function(item) {
    const chave = textoCentral_(item.chave);
    if (!chave || chaves[chave]) return false;
    chaves[chave] = true;
    return true;
  });
}
function lerComunicacoesExternasCentralV46_(planilhaId, auditoria) {
  try {
    const planilha = SpreadsheetApp.openById(planilhaId);
    const aba = garantirAbaComunicacaoCentralV46_(planilha);
    if (aba.getLastRow() < 2) return [];
    const dados = aba.getDataRange().getValues();
    const mapa = montarMapaCentral_(dados[0]);
    const ausentes = CENTRAL_V46_CABECALHOS_COMUNICACAO.filter(function(nome) {
      return mapa[normalizarTextoCentral_(nome)] === undefined;
    });
    if (ausentes.length) {
      throw new Error('Cabeçalhos incompatíveis: ' + ausentes.join(', '));
    }
    return dados.slice(1).map(function(linha) {
      const campo = function(nome) {
        return pegarCampoCentral_(linha, mapa, nome);
      };
      return {
        chave: textoCentral_(campo('Chave do evento')),
        protocolo: textoCentral_(campo('Protocolo')),
        dataHora: campo('Data e hora'),
        usuario: campo('Registrado por'),
        areaAutora: campo('Área autora'),
        destino: campo('Encaminhado para'),
        tipo: campo('Tipo de registro'),
        mensagem: campo('Mensagem'),
        tituloItem: campo('Título do item'),
        chaveItem: campo('Chave do item'),
        situacaoItem: campo('Situação do item'),
        prioridade: campo('Prioridade'),
        prazo: campo('Prazo'),
        arquivos: campo('Arquivos'),
        origem: campo('Origem')
      };
    }).filter(function(item) {
      return Boolean(item.chave && item.protocolo);
    }).sort(function(a, b) {
      return valorDataOrdenacaoCentral_(a.dataHora) - valorDataOrdenacaoCentral_(b.dataHora);
    });
  } catch (erro) {
    const detalhe = 'Comunicação entre áreas: ' + erro.message;
    console.error(detalhe);
    if (auditoria) {
      auditoria.push({
        tipo: 'Comunicação externa indisponível',
        chave: CENTRAL_V3.ABA_COMUNICACAO_EXECUCAO,
        id: '',
        detalhe: detalhe
      });
    }
    return [];
  }
}
function garantirAbaComunicacaoCentralV46_(planilha) {
  let aba = planilha.getSheetByName(CENTRAL_V3.ABA_COMUNICACAO_EXECUCAO);
  if (!aba) aba = planilha.insertSheet(CENTRAL_V3.ABA_COMUNICACAO_EXECUCAO);
  if (aba.getMaxColumns() < CENTRAL_V46_CABECALHOS_COMUNICACAO.length) {
    aba.insertColumnsAfter(
      aba.getMaxColumns(),
      CENTRAL_V46_CABECALHOS_COMUNICACAO.length - aba.getMaxColumns()
    );
  }
  const cabecalho = aba.getRange(
    1, 1, 1, CENTRAL_V46_CABECALHOS_COMUNICACAO.length
  ).getValues()[0];
  if (cabecalho.every(function(valor) { return !textoCentral_(valor); })) {
    aba.getRange(1, 1, 1, CENTRAL_V46_CABECALHOS_COMUNICACAO.length)
      .setValues([CENTRAL_V46_CABECALHOS_COMUNICACAO]);
  }
  const mapa = montarMapaCentral_(aba.getRange(
    1, 1, 1, CENTRAL_V46_CABECALHOS_COMUNICACAO.length
  ).getValues()[0]);
  const ausentes = CENTRAL_V46_CABECALHOS_COMUNICACAO.filter(function(nome) {
    return mapa[normalizarTextoCentral_(nome)] === undefined;
  });
  if (ausentes.length) {
    throw new Error('Cabeçalhos incompatíveis: ' + ausentes.join(', '));
  }
  try { aba.hideSheet(); } catch (erro) {}
  return aba;
}
function registrarObservacoesFormularioNaComunicacaoCentralV46_(
  casos,
  execucoes,
  planilhaId,
  auditoria
) {
  try {
    const planilha = SpreadsheetApp.openById(planilhaId);
    const aba = garantirAbaComunicacaoCentralV46_(planilha);
    const existentes = {};
    if (aba.getLastRow() >= 2) {
      aba.getRange(2, 1, aba.getLastRow() - 1, 1).getDisplayValues()
        .forEach(function(linha) { if (linha[0]) existentes[linha[0]] = true; });
    }
    const agora = new Date();
    const pendentes = [];
    (casos || []).forEach(function(caso) {
      if (String(caso.chaveOrigem || '').indexOf('EXEC_ABERTURA|') !== 0 ||
          !textoCentral_(caso.observacaoSeguimento) || !textoCentral_(caso.id)) return;
      pendentes.push({
        chave: 'FORM_COM|' + caso.chaveOrigem,
        protocolo: caso.id,
        data: caso.carimbo || caso.data || agora,
        usuario: caso.responsavelRegistro || 'Equipe de execução',
        mensagem: caso.observacaoSeguimento
      });
    });
    (execucoes || []).forEach(function(execucao) {
      const id = af_resolver_(normalizarIdAtendimentoCentral_(execucao.idInformado), true);
      if (!id || !textoCentral_(execucao.observacaoSeguimento)) return;
      pendentes.push({
        chave: 'FORM_COM|' + execucao.chave,
        protocolo: id,
        data: execucao.carimbo || execucao.dataExecucao || agora,
        usuario: execucao.responsavelRegistro || execucao.executadoPor ||
          'Equipe de execução',
        mensagem: execucao.observacaoSeguimento
      });
    });
    pendentes.forEach(function(item) {
      if (existentes[item.chave]) return;
      aba.appendRow([
        item.chave, item.protocolo, item.data, item.usuario,
        'Execução', CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO,
        'Mensagem do formulário', item.mensagem, '', '', '', '', '', '',
        '', item.data, 'Formulário de Execução', CENTRAL_V3.VERSAO
      ]);
      existentes[item.chave] = true;
    });
  } catch (erro) {
    const detalhe = 'Observações do formulário na comunicação: ' + erro.message;
    console.error(detalhe);
    if (auditoria) auditoria.push({
      tipo: 'Comunicação externa indisponível',
      chave: 'Observações do formulário',
      id: '',
      detalhe: detalhe
    });
  }
}
function processarComunicacoesCentralV46_(comunicacoes, casosPorId, historico) {
  const auditoria = [];
  const porId = lerHistoricoCentralV3_(historico);
  (comunicacoes || []).forEach(function(item) {
    const id = af_resolver_(normalizarIdAtendimentoCentral_(item.protocolo), true);
    if (!id || !casosPorId[id]) {
      auditoria.push({
        tipo: 'Comunicação sem vínculo',
        chave: item.chave,
        id: item.protocolo,
        detalhe: 'Protocolo não localizado na Base de Atendimentos.'
      });
      return;
    }
    const eventos = porId[id] || [];
    const ultimo = eventos.length ? eventos[eventos.length - 1] : {};
    const statusAnterior = normalizarStatusCentralV3_(ultimo.status || 'Recebida');
    const destino = normalizarResponsabilidadeAberturaCentralV46_(item.destino) ||
      textoCentral_(ultimo.bola) || CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO;
    const tipoNormalizado = normalizarTextoCentral_(item.tipo);
    const ehChecklist = tipoNormalizado.indexOf('checklist') >= 0;
    const itemConcluido = /concluido/.test(
      normalizarTextoCentral_(item.situacaoItem)
    );
    const mensagem = valorPreferencialCentral_([
      item.mensagem,
      item.tituloItem && (
        textoCentral_(item.tipo) + ': ' + textoCentral_(item.tituloItem)
      )
    ]);
    const proximaAcao = ehChecklist
      ? ((itemConcluido ? 'Conferir conclusão: ' : 'Acompanhar: ') +
        textoCentral_(item.tituloItem || item.mensagem))
      : (textoCentral_(item.destino)
        ? ('Consultar o encaminhamento de ' + textoCentral_(item.areaAutora || 'outra área'))
        : textoCentral_(ultimo.proximaAcao));
    const evento = {
      id: id,
      dataHora: item.dataHora || new Date(),
      usuario: item.usuario || item.areaAutora || 'Atualização compartilhada',
      status: statusAnterior,
      procedencia: textoCentral_(ultimo.procedencia) || 'Em análise',
      responsavel: item.usuario || '',
      observacao: mensagem || 'Atualização compartilhada entre as áreas.',
      origemAtualizacao: 'Comunicação entre Atendimento e Execução',
      tipoEvento: ehChecklist ? 'Checklist compartilhado' : 'Comunicação entre áreas',
      bola: statusAnterior === 'Concluída'
        ? CENTRAL_V3.RESPONSABILIDADES.CONCLUIDO : destino,
      proximaAcao: statusAnterior === 'Concluída' ? 'Nenhuma pendência' : proximaAcao,
      chaveEvento: 'COM|' + item.chave,
      evidencias: item.arquivos || ''
    };
    if (appendEventoCentralV3_(historico, evento)) {
      if (!porId[id]) porId[id] = [];
      porId[id].push(evento);
    }
  });
  return auditoria;
}
function lerExecucoesExternasCentralV3_(dados) {
  if (!dados || dados.length < 2) return [];
  const mapa = montarMapaCentral_(dados[0]);
  return dados.slice(1).map(function(linha, indice) {
    const campo = function(nomes) {
      return pegarPrimeiroCampoCentralV3_(linha, mapa, nomes);
    };
    const modo = normalizarTextoCentral_(campo([
      'Você está abrindo ou executando uma ficha?'
    ]));
    if (/abrindo|novo atendimento/.test(modo)) return null;
    const carimbo = campo(['Carimbo de data/hora']);
    const id = textoCentral_(campo([
      'Qual o número de protocolo?', 'Informe o número de protocolo',
      'Número do protocolo', 'Protocolo do atendimento'
    ])).split('|')[0].trim();
    if (!textoCentral_(id) && !textoCentral_(carimbo)) return null;
    const procedencia = campo(['A demanda é procedente?']);
    const titulo = campo(['Título da execução']);
    const relatoProcedente = campo([
      'Relado detalhado do que foi executado ou proposto junto ao morador',
      'Relato detalhado do que foi executado ou proposto junto ao morador'
    ]);
    const relatoNaoProcedente = campo([
      'Relato detalhado explicando a não procedência'
    ]);
    const assinatura = [
      valorDataOrdenacaoCentral_(carimbo), normalizarTextoCentral_(id),
      normalizarTextoCentral_(titulo), normalizarTextoCentral_(relatoProcedente),
      normalizarTextoCentral_(relatoNaoProcedente)
    ].join('|');
    return {
      chave: 'EXEC_EXT|' + hashTextoCentralV3_(assinatura),
      carimbo: carimbo,
      idInformado: id,
      emailRegistro: campo(['Endereço de e-mail', 'E-mail']),
      procedencia: procedencia,
      titulo: titulo,
      resolvida: campo(['A demanda foi resolvida?']),
      pendencias: campo(['Há pendências restantes?']),
      retornoAtendimento: campo(['Necessidade de retorno imediato do atendimento?']),
      executadoPor: campo(['Identifique-se, quem fez a execução', 'Identique-se, quem fez a execução', 'Indentique-se, quem fez a execução', 'Indentifique-se, quem fez a execução', 'Responsável pela execução']),
      dataExecucao: campo(['Data da atuação', 'Data da execução']),
      descricao: montarRelatoExecucaoCentralV3_(
        titulo,
        relatoProcedente || campo(['Qual trabalho ou providências foram realizadas?']),
        relatoNaoProcedente,
        campo(['Nome do morador que acompanhou a execução']),
        campo(['Endereço onde o serviço foi executado', 'Endereço completo']),
        campo(['Há pendências restantes?'])
      ),
      evidencias: campo(['Fotos da execução e documentos quando houver']),
      responsavelRegistro: campo([
        'Identifique-se, quem fez a execução',
        'Identique-se, quem fez a execução',
        'Indentique-se, quem fez a execução',
        'Indentifique-se, quem fez a execução',
        'Responsável pela execução',
        'Endereço de e-mail',
        'E-mail'
      ]),
      observacaoSeguimento: campo(['Observações para o seguimento da ficha'])
    };
  }).filter(Boolean);
}
function montarRelatoExecucaoCentralV3_(
  titulo,
  relatoProcedente,
  relatoNaoProcedente,
  morador,
  endereco,
  pendencias
) {
  const blocos = [];
  if (textoCentral_(titulo)) blocos.push('Execução: ' + textoCentral_(titulo) + '.');
  const relato = textoCentral_(relatoProcedente) || textoCentral_(relatoNaoProcedente);
  if (relato) blocos.push(relato);
  if (textoCentral_(morador)) {
    blocos.push('Acompanhamento no local: ' + textoCentral_(morador) + '.');
  }
  if (textoCentral_(endereco)) {
    blocos.push('Local da execução: ' + textoCentral_(endereco) + '.');
  }
  // O campo de pendências orienta o fluxo interno, mas não compõe a narrativa
  // pública da providência executada.
  return blocos.join('\n\n');
}
function lerSatisfacoesExternasCentralV3_(dados) {
  if (!dados || dados.length < 2) return [];
  const mapa = montarMapaCentral_(dados[0]);
  return dados.slice(1).map(function(linha, indice) {
    const campo = function(nomes) {
      return pegarPrimeiroCampoCentralV3_(linha, mapa, nomes);
    };
    const carimbo = campo(['Carimbo de data/hora']);
    const id = campo(['Informe o número de protocolo', 'Informe o ID do atendimento']);
    if (!textoCentral_(id) && !textoCentral_(carimbo)) return null;
    const concluida = campo(['A sua solicitação foi concluída?']);
    return {
      chave: 'SAT_EXT|' + valorDataOrdenacaoCentral_(carimbo) + '|L' + (indice + 2),
      carimbo: carimbo,
      responsavelRegistro: campo(['Endereço de e-mail']) || 'Pesquisa final do atendimento',
      procedimento: normalizarTextoCentral_(
        CONFIG_CENTRAL_ATENDIMENTOS.PROCEDIMENTO_FINALIZACAO
      ),
      idInformado: id,
      atendida: concluida,
      concluida: concluida,
      nota: numeroOuVazioCentral_(campo([
        'De 0 a 10 qual a satisfação com o atendimento prestado?',
        'De 0 a 10, qual a satisfação com atendimento prestado?'
      ])),
      clareza: campo(['As informações e providências ficaram claras?']),
      comentario: campo(['Deseja deixar um elogio ou observação?']),
      nome: campo(['Nome']),
      endereco: campo(['Endereço'])
    };
  }).filter(Boolean);
}
function processarSatisfacoesExternasCentralV3_(
  satisfacoes,
  casosPorId,
  historico,
  correcoesPendentes
) {
  const pendentes = [];
  const auditoria = [];
  let processadas = 0;
  satisfacoes.forEach(function(satisfacao) {
    const correcao = (correcoesPendentes || {})[satisfacao.chave] || {};
    const idOriginal = af_resolver_(normalizarIdAtendimentoCentral_(satisfacao.idInformado), true);
    const idCorrigido = correcao.confirmar
      ? af_resolver_(normalizarIdAtendimentoCentral_(correcao.idCorreto), true)
      : '';
    const id = idCorrigido || idOriginal;
    let situacao = '';
    if (!id) {
      situacao = 'Informe o protocolo correto e marque Confirmar vínculo.';
    } else if (!casosPorId[id]) {
      situacao = 'O protocolo ' + id + ' não foi encontrado na Base de Atendimentos.';
    } else if (!textoCentral_(satisfacao.concluida) || satisfacao.nota === '' ||
        !textoCentral_(satisfacao.clareza)) {
      situacao = 'A pesquisa final está incompleta e precisa ser conferida na planilha de origem.';
    }
    if (situacao) {
      pendentes.push({
        finalizacao: satisfacao,
        idCorreto: correcao.idCorreto || '',
        situacao: situacao
      });
      auditoria.push({
        tipo: 'Pesquisa final sem vínculo',
        chave: satisfacao.chave,
        id: satisfacao.idInformado,
        detalhe: situacao
      });
      return;
    }
    const concluida = respostaPositivaCentralV3_(satisfacao.concluida);
    const adicionou = appendEventoCentralV3_(historico, {
      id: id,
      dataHora: satisfacao.carimbo || new Date(),
      usuario: satisfacao.responsavelRegistro,
      status: concluida ? 'Concluída' : 'Em andamento',
      procedencia: 'Em análise',
      responsavel: 'Equipe de atendimento',
      observacao: montarObservacaoSatisfacaoCentralV3_(satisfacao),
      origemAtualizacao: 'Pesquisa de satisfação final',
      chaveFinalizacao: satisfacao.chave,
      solicitacaoAtendida: satisfacao.atendida,
      conclusaoConfirmada: satisfacao.concluida,
      notaFinal: satisfacao.nota,
      informacoesClarasFinal: satisfacao.clareza,
      comentarioFinalizacao: satisfacao.comentario || 'Nada a declarar',
      tipoEvento: 'Finalização',
      bola: concluida
        ? CENTRAL_V3.RESPONSABILIDADES.CONCLUIDO
        : CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO,
      proximaAcao: concluida
        ? 'Nenhuma pendência'
        : 'Reavaliar a pendência com o morador e encaminhar a tratativa',
      chaveEvento: satisfacao.chave
    });
    if (adicionou) processadas++;
  });
  return {pendentes: pendentes, auditoria: auditoria, processadas: processadas};
}
function montarObservacaoSatisfacaoCentralV3_(satisfacao) {
  return [
    'Conclusão informada pelo cliente: ' + textoCentral_(satisfacao.concluida) + '.',
    'Satisfação com o atendimento: ' + textoCentral_(satisfacao.nota) + '/10.',
    'Clareza das informações e providências: ' + textoCentral_(satisfacao.clareza) + '.',
    'Comentário: ' + (textoCentral_(satisfacao.comentario) || 'Nada a declarar') + '.'
  ].join('\n');
}
/**
 * Encerra administrativamente uma demanda quando a pesquisa permanece sem resposta.
 * A regra exige 14 dias corridos desde o envio e 3 tentativas registradas em
 * datas diferentes. Os limites ficam centralizados em CENTRAL_V3.
 */
function encerrarAtendimentosSemRespostaCentralV42_(casos, historico, agora) {
  const porId = lerHistoricoCentralV3_(historico);
  let encerrados = 0;
  (casos || []).forEach(function(caso) {
    const eventos = (porId[caso.id] || []).slice().sort(function(a, b) {
      return valorDataOrdenacaoCentral_(a.dataHora) -
        valorDataOrdenacaoCentral_(b.dataHora);
    });
    if (!eventos.length) return;
    const ultimo = selecionarEventoAtualCentralV3_(eventos);
    if (normalizarStatusCentralV3_(ultimo.status) !== 'Aguardando finalização') return;
    const acompanhamento = resumirAusenciaRespostaCentralV42_(eventos, agora);
    if (!acompanhamento.dataEnvio) return;
    const deveEncerrar = acompanhamento.dias >=
        CENTRAL_V3.DIAS_ENCERRAMENTO_SEM_RESPOSTA &&
      acompanhamento.tentativas >=
        CENTRAL_V3.TENTATIVAS_ENCERRAMENTO_SEM_RESPOSTA;
    if (!deveEncerrar) return;
    const motivo = acompanhamento.dias + ' dia(s) sem resposta desde o envio ' +
      'da pesquisa e ' + acompanhamento.tentativas +
      ' tentativa(s) em dias diferentes';
    const adicionou = appendEventoCentralV3_(historico, {
      id: caso.id,
      dataHora: agora,
      usuario: 'Regra automática de encerramento',
      status: 'Concluída',
      procedencia: textoCentral_(ultimo.procedencia) || 'Em análise',
      responsavel: 'Equipe de atendimento',
      observacao: 'Atendimento encerrado por ausência de resposta após ' + motivo + '.',
      origemAtualizacao: 'Encerramento administrativo por ausência de resposta',
      solicitacaoAtendida: 'Sem confirmação do solicitante',
      conclusaoConfirmada: 'Encerramento por ausência de resposta',
      comentarioFinalizacao: 'Pesquisa enviada, sem retorno do solicitante.',
      tipoEvento: 'Finalização',
      bola: CENTRAL_V3.RESPONSABILIDADES.CONCLUIDO,
      proximaAcao: 'Nenhuma pendência',
      chaveEvento: 'ENCERRAMENTO_SEM_RESPOSTA|' + caso.id + '|' +
        String(valorDataOrdenacaoCentral_(acompanhamento.dataEnvio))
    });
    if (adicionou) encerrados++;
  });
  return encerrados;
}
function resumirAusenciaRespostaCentralV42_(eventos, agora) {
  let indiceEnvio = -1;
  eventos.forEach(function(evento, indice) {
    const texto = normalizarTextoCentral_([
      evento.observacao, evento.proximaAcao, evento.origemAtualizacao
    ].join(' '));
    if (/pesquisa.*satisfacao.*enviada/.test(texto) || (indiceEnvio < 0 && /aguardar.*resposta.*pesquisa/.test(texto) && !/tentativa.*contato.*sem resposta/.test(texto))) {
      indiceEnvio = indice;
    }
  });
  if (indiceEnvio < 0) return {dataEnvio: '', dias: 0, tentativas: 0};
  const dataEnvio = dataValidaCentral_(eventos[indiceEnvio].dataHora);
  if (!dataEnvio) return {dataEnvio: '', dias: 0, tentativas: 0};
  const datasTentativas = {};
  eventos.slice(indiceEnvio + 1).forEach(function(evento) {
    const texto = normalizarTextoCentral_([
      evento.observacao, evento.origemAtualizacao, evento.chaveEvento
    ].join(' '));
    if (!/tentativa.*contato.*sem resposta/.test(texto) && !/^TAREFA_ATENDIMENTO\|REGISTRAR_TENTATIVA_SEM_RESPOSTA\|/.test(String(evento.chaveEvento || ''))) return;
    const data = dataValidaCentral_(evento.dataHora);
    if (!data) return;
    datasTentativas[Utilities.formatDate(data, 'America/Sao_Paulo', 'yyyy-MM-dd')] = true;
  });
  return {
    dataEnvio: dataEnvio,
    dias: diasCorridosCentralV42_(dataEnvio, agora),
    tentativas: Object.keys(datasTentativas).length
  };
}
function diasCorridosCentralV42_(inicio, fim) {
  const dataInicio = dataValidaCentral_(inicio);
  const dataFim = dataValidaCentral_(fim);
  if (!dataInicio || !dataFim) return 0;
  const primeiro = Date.UTC(
    dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate()
  );
  const ultimo = Date.UTC(
    dataFim.getFullYear(), dataFim.getMonth(), dataFim.getDate()
  );
  return Math.max(0, Math.floor((ultimo - primeiro) / 86400000));
}
function processarExecucoesCentralV3_(execucoes, casosPorId, historico) {
  const pendencias = [];
  const historicosAntes = lerHistoricoCentralV3_(historico);
  execucoes.forEach(function(execucao) {
    const id = af_resolver_(normalizarIdAtendimentoCentral_(execucao.idInformado), true);
    if (!id || !casosPorId[id]) {
      pendencias.push({
        tipo: 'Execução sem vínculo',
        chave: execucao.chave,
        id: execucao.idInformado,
        detalhe: 'Protocolo não localizado na Base de Atendimentos.'
      });
      return;
    }
    // Um formulário aberto antes da atualização da lista não pode reabrir uma ficha encerrada.
    const anteriores = (historicosAntes[id] || []).slice().sort(function(a,b){return valorDataOrdenacaoCentral_(a.dataHora)-valorDataOrdenacaoCentral_(b.dataHora);});
    const jaRegistrada = anteriores.some(function(e){return e.chaveEvento===execucao.chave;});
    if (!jaRegistrada && normalizarStatusCentralV3_(selecionarEventoAtualCentralV3_(anteriores).status)==='Concluída') {
      pendencias.push({tipo:'Execução recebida após encerramento',chave:execucao.chave,id:id,detalhe:'Resposta preservada no formulário. A ficha não foi reaberta; conferir com o Atendimento.'});
      return;
    }
    const procedencia = normalizarProcedenciaCentralV3_(execucao.procedencia);
    const retornoAtendimento = normalizarTextoCentral_(execucao.retornoAtendimento);
    const pendenciasResposta = normalizarTextoCentral_(execucao.pendencias);
    const precisaAtendimento = /^sim\b/.test(retornoAtendimento) ||
      /morador.*requer|mais informac|retorno imediato/.test(retornoAtendimento) ||
      /morador.*requer|mais alguma tratativa/.test(pendenciasResposta);
    const semPendencias = /^nao\b/.test(pendenciasResposta) ||
      /servico finalizado/.test(pendenciasResposta);
    const resolvida = respostaPositivaCentralV3_(execucao.resolvida) || (!textoCentral_(execucao.resolvida) && semPendencias);
    const encerraPeloAtendimento = procedencia === 'Não procedente';
    const status = encerraPeloAtendimento || resolvida ? 'Aguardando finalização' : 'Em andamento';
    const responsabilidade = encerraPeloAtendimento || resolvida || precisaAtendimento
      ? CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO : CENTRAL_V3.RESPONSABILIDADES.EXECUCAO;
    const proximaAcao = encerraPeloAtendimento || resolvida
      ? 'Aguardando revisão e finalização do Atendimento'
      : precisaAtendimento ? 'Contatar o morador e complementar as informações para a Execução'
      : 'Concluir a providência e registrar novo retorno';
    appendEventoCentralV3_(historico, {
      id: id,
      dataHora: execucao.carimbo || execucao.dataExecucao || new Date(),
      usuario: execucao.responsavelRegistro || execucao.executadoPor || 'Equipe de execução',
      status: status,
      procedencia: procedencia,
      responsavel: execucao.executadoPor || '',
      observacao: execucao.descricao || 'Retorno da execução registrado.',
      origemAtualizacao: 'Retorno da execução pelo formulário',
      tipoEvento: 'Execução',
      bola: responsabilidade,
      proximaAcao: proximaAcao,
      chaveEvento: execucao.chave,
      dataExecucao: execucao.dataExecucao,
      executadoPor: execucao.executadoPor,
      evidencias: execucao.evidencias,
      solicitacaoAtendida: execucao.resolvida,
      conclusaoConfirmada: ''
    });
  });
  return pendencias;
}
function respostaPositivaCentralV3_(valor) {
  const n = normalizarTextoCentral_(valor);
  return /^(sim|concluida|concluido|resolvida|resolvido)$/.test(n) ||
    /demanda resolvida|servico finalizado|totalmente resolvid/.test(n);
}
function normalizarProcedenciaCentralV3_(valor) {
  const n = normalizarTextoCentral_(valor);
  if (/possivel.*nao procedente/.test(n)) {
    return 'Possivelmente não procedente';
  }
  if (n === 'sim' || n.indexOf('procedente') >= 0 && n.indexOf('nao') < 0) {
    return 'Procedente';
  }
  if (n === 'nao' || n.indexOf('nao procedente') >= 0 || n.indexOf('improcedente') >= 0) {
    return 'Não procedente';
  }
  return 'Em análise';
}
function hashTextoCentralV3_(valor) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    textoCentral_(valor),
    Utilities.Charset.UTF_8
  );
  return bytes.slice(0, 8).map(function(byte) {
    const n = byte < 0 ? byte + 256 : byte;
    return ('0' + n.toString(16)).slice(-2);
  }).join('');
}
function montarLinhaCentralV3_(caso, eventos, destino) {
  const ordenados = eventos.slice().sort(function(a, b) {
    return valorDataOrdenacaoCentral_(a.dataHora) - valorDataOrdenacaoCentral_(b.dataHora);
  });
  const ultimo = selecionarEventoAtualCentralV3_(ordenados);
  const status = normalizarStatusCentralV3_(ultimo.status || caso.statusRegistro);
  const responsabilidade = definirResponsabilidadeCentralV3_(status, ultimo);
  const proximaAcao = definirProximaAcaoCentralV3_(status, responsabilidade, ultimo);
  const abertura = dataValidaCentral_(caso.data || caso.carimbo);
  const conclusaoEvento = status === 'Concluída' ? ordenados.slice().reverse().find(function(e){return normalizarStatusCentralV3_(e.status)==='Concluída' && e.tipoEvento!=='Correção da Ficha' && e.tipoEvento!=='Ciência administrativa';}) : null;
  const dataCorrigida = ordenados.slice().reverse().find(function(e){return normalizarTextoCentral_(e.origemAtualizacao)==='correcao da ficha final: data de conclusao';});
  const dataEfetiva = conclusaoEvento && normalizarTextoCentral_(conclusaoEvento.origemAtualizacao)==='encerramento pelo atendimento' ? dataValidaCentral_(conclusaoEvento.dataExecucao) : null;
  const conclusao = status==='Concluída' && dataCorrigida ? dataValidaCentral_(dataCorrigida.comentarioFinalizacao) : (conclusaoEvento ? dataEfetiva || conclusaoEvento.dataHora : '');
  const conclusaoOperacional = Boolean(
    conclusaoEvento &&
    (conclusaoEvento.tipoEvento === 'Finalização' ||
      (abertura && abertura >= CENTRAL_V3.DATA_CORTE))
  );
  const agoraOuConclusao = status === 'Concluída'
    ? (dataValidaCentral_(conclusao) || new Date())
    : new Date();
  const dias = af_dias_(abertura, agoraOuConclusao);
  const prioridadeDinamica = af_prioridade_(caso.urgencia, abertura, status, agoraOuConclusao);
  const urgenciaOriginal = rotuloUrgenciaCentralV3_(caso.urgencia);
  const limitePrazo = limiteUrgenciaCentralV3_(urgenciaOriginal);
  const links = localizarLinkFichaCentralV3_(destino, caso.id);
  return {
    id: caso.id,
    data: caso.data || caso.carimbo,
    diasAberto: status === 'Concluída' ? '' : dias,
    pontos: prioridadeDinamica.pontos,
    bola: responsabilidade,
    proximaAcao: proximaAcao,
    status: status,
    urgencia: status === 'Concluída'
      ? 'Atendimento concluído'
      : prioridadeDinamica.rotulo,
    limitePrazo: limitePrazo,
    foraDoPrazo: status !== 'Concluída' && limitePrazo !== null &&
      diasUteisCentralV3_(abertura, agoraOuConclusao) >= limitePrazo,
    nome: caso.nome,
    telefone: caso.telefones,
    endereco: caso.endereco || caso.local,
    solicitacao: resumirSolicitacaoCentralV3_(caso.assunto, caso.solicitacao),
    responsavel: textoCentral_(ultimo.responsavel) || caso.responsavelInicial || '',
    procedencia: textoCentral_(ultimo.procedencia) || 'Em análise',
    ultimaEdicao: ultimo.dataHora || caso.carimbo || caso.data,
    dataConclusao: conclusao,
    conclusaoOperacional: conclusaoOperacional,
    linkFicha: links.ficha,
    linkPdf: links.pdf,
    caso: caso,
    eventos: ordenados
  };
}
function selecionarEventoAtualCentralV3_(eventos) {
  if (!eventos.length) return {};
  const operacionais = eventos.filter(function(item) {
    return item.tipoEvento === 'Finalização' || item.tipoEvento === 'Execução' ||
      item.tipoEvento === 'Tarefa do Atendimento' ||
      item.tipoEvento === 'Correção da Ficha' ||
      item.tipoEvento === 'Comunicação entre áreas' ||
      item.tipoEvento === 'Checklist compartilhado';
  });
  if (operacionais.length) {const atual=operacionais[operacionais.length-1];
    if(atual.tipoEvento==='Execução'&&atual.status!=='Concluída'&&respostaPositivaCentralV3_(atual.solicitacaoAtendida))return Object.assign({},atual,{status:'Aguardando finalização',bola:CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO,proximaAcao:'Aguardando revisão e finalização do Atendimento'});
    return atual;}
  const reconciliacoes = eventos.filter(function(item) {
    return item.tipoEvento === 'Reconciliação';
  });
  if (reconciliacoes.length) return reconciliacoes[reconciliacoes.length - 1];
  return eventos[eventos.length - 1];
}
function definirResponsabilidadeCentralV3_(status, ultimo) {
  if (status === 'Concluída') return CENTRAL_V3.RESPONSABILIDADES.CONCLUIDO;
  if (status === 'Aguardando finalização') return CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO;
  const bola = textoCentral_(ultimo.bola);
  if (bola) return af_responsavel_(bola);
  const tipo = normalizarTextoCentral_(ultimo.tipoEvento || ultimo.origemAtualizacao);
  if (/execucao/.test(tipo) && respostaPositivaCentralV3_(ultimo.solicitacaoAtendida)) {
    return CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO;
  }
  return CENTRAL_V3.RESPONSABILIDADES.EXECUCAO;
}
function definirProximaAcaoCentralV3_(status, bola, ultimo) {
  if (status === 'Concluída') return 'Nenhuma pendência';
  if(af_revisao_(status))return af_rotulo_(status);
  if (textoCentral_(ultimo.proximaAcao)) return ultimo.proximaAcao;
  if (bola === CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO) {
    return 'Aplicar pesquisa de satisfação e encerrar';
  }
  if (status === 'Recebida') return 'Analisar a demanda e registrar a providência';
  return 'Concluir a providência e registrar retorno';
}
function resumirSolicitacaoCentralV3_(assunto, solicitacao) {
  const assuntoTexto = textoCentral_(assunto);
  const relato = textoCentral_(solicitacao);
  if (assuntoTexto && !/^(reclamacao|solicitacao)$/i.test(normalizarTextoCentral_(assuntoTexto))) {
    return assuntoTexto;
  }
  const texto = relato || assuntoTexto || 'Não informada';
  return texto.length > 220 ? texto.slice(0, 217).trim() + '...' : texto;
}
function localizarLinkFichaCentralV3_(destino, id) {
  const base = destino.getSheetByName(CENTRAL_V3.ABA_BASE_OFICIAL);
  if (base && base.getLastRow() >= 2) {
    const dados = base.getDataRange().getValues();
    const mapa = montarMapaCentral_(dados[0]);
    let melhor = null;
    dados.slice(1).forEach(function(linha) {
      const legado = textoCentral_(pegarCampoCentral_(linha, mapa, 'ID legado'));
      const protocolo = textoCentral_(pegarCampoCentral_(linha, mapa, 'Protocolo'));
      if (legado !== id && protocolo !== id) return;
      const documento = textoCentral_(pegarCampoCentral_(linha, mapa, 'ID do documento'));
      const pdf = textoCentral_(pegarCampoCentral_(linha, mapa, 'ID do PDF atual'));
      if (!melhor || documento || pdf) melhor = {documento: documento, pdf: pdf};
    });
    if (melhor) {
      return {
        ficha: melhor.documento
          ? 'https://docs.google.com/document/d/' + melhor.documento + '/edit'
          : '',
        pdf: melhor.pdf ? 'https://drive.google.com/open?id=' + melhor.pdf : ''
      };
    }
  }
  const indice = destino.getSheetByName(CENTRAL_V3.ABA_FICHAS_OFICIAIS);
  return {
    ficha: indice ? destino.getUrl() + '#gid=' + indice.getSheetId() : destino.getUrl(),
    pdf: ''
  };
}
function filtrarLinhasPainelCentralV3_(linhas) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return linhas.filter(function(item) {
    if (item.status !== 'Concluída') return true;
    const conclusao = dataValidaCentral_(item.dataConclusao || item.ultimaEdicao);
    const abertura = dataValidaCentral_(item.data);
    return Boolean(
      (item.conclusaoOperacional && conclusao && conclusao >= inicioMes) ||
      (abertura && abertura >= CENTRAL_V3.DATA_CORTE)
    );
  });
}
function ordenarLinhasCentralV3_(linhas){linhas.sort(af_ordenar_);}
function urgenciaAltaCentralV3_(valor) {
  return /alto|altissima|urgente|critica/i.test(normalizarTextoCentral_(valor));
}
function rotuloUrgenciaCentralV3_(valor) {
  const n = normalizarTextoCentral_(valor);
  if (/urgente|imediat|emergencial|critica/.test(n)) return 'Urgente';
  if (/\balto\b|altissima/.test(n)) return 'Alto';
  if (/medio|mediana/.test(n)) return 'Médio';
  if (/baixo|baixa atencao/.test(n)) return 'Baixo';
  return textoCentral_(valor) || 'Não informada';
}
function nivelUrgenciaCentralV3_(valor) {
  const n = normalizarTextoCentral_(valor);
  if (/urgente/.test(n)) return 4;
  if (/alto/.test(n)) return 3;
  if (/medio/.test(n)) return 2;
  if (/baixo/.test(n)) return 1;
  return 0;
}
function limiteUrgenciaCentralV3_(valor) {
  const nivel = nivelUrgenciaCentralV3_(valor);
  if (nivel === 4) return 2;
  if (nivel === 3) return 3;
  if (nivel === 2) return 5;
  if (nivel === 1) return 5;
  return null;
}
function diasUteisCentralV3_(inicio, fim) {
  const a = dataValidaCentral_(inicio);
  const b = dataValidaCentral_(fim);
  if (!a || !b || b < a) return 0;
  const cursor = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const limite = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  let dias = 0;
  while (cursor < limite) {
    cursor.setDate(cursor.getDate() + 1);
    const dia = cursor.getDay();
    if (dia !== 0 && dia !== 6) dias++;
  }
  return dias;
}
function escreverDashboardCentralV3_(destino, aba, linhas) {
  const c = CONFIG_CENTRAL_ATENDIMENTOS.CORES;
  garantirDimensoesCentral_(aba, Math.max(80, linhas.length + 15), 15);
  if (aba.getFilter()) aba.getFilter().remove();
  aba.getBandings().forEach(function(banda) { banda.remove(); });
  aba.setConditionalFormatRules([]);
  aba.getCharts().forEach(function(grafico) { aba.removeChart(grafico); });
  aba.getRange(1, 1, aba.getMaxRows(), aba.getMaxColumns()).breakApart();
  aba.clear();
  aba.getRange(1, 1, aba.getMaxRows(), aba.getMaxColumns()).clearDataValidations();
  aba.setHiddenGridlines(true);
  aba.setTabColor(c.AZUL);
  aba.setFrozenRows(CENTRAL_V3.LINHA_CABECALHO);
  aba.setFrozenColumns(0);
  aba.getRange('A1:O1').merge().setValue('CENTRAL DE ATENDIMENTOS');
  aba.getRange('A2:O2').merge().setValue(
    'Idade em dias corridos · prioridade progressiva semanal. Atualizado em ' +
    Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm')
  );
  aba.getRange('A1:O1').setBackground(c.AZUL_ESCURO).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(17).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  aba.getRange('A2:O2').setBackground(c.AZUL).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(9)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  const ativas = linhas.filter(function(item) { return item.status !== 'Concluída'; });
  const execucao = ativas.filter(function(item) {
    return item.bola === CENTRAL_V3.RESPONSABILIDADES.EXECUCAO;
  }).length;
  const atendimento = ativas.filter(function(item) {
    return item.bola === CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO;
  }).length;
  const urgentes = ativas.filter(function(item) {
    return urgenciaAltaCentralV3_(item.urgencia);
  }).length;
  const cartoes = [
    ['A3:D3', 'A4:D4', 'PENDÊNCIAS ATIVAS', ativas.length, c.AZUL],
    ['E3:H3', 'E4:H4', 'AÇÃO PENDENTE DA EXECUÇÃO', execucao, c.LARANJA],
    ['I3:L3', 'I4:L4', 'AÇÃO PENDENTE DO ATENDIMENTO', atendimento, c.ROXO],
    ['M3:O3', 'M4:O4', urgentes ? 'URGÊNCIAS ATIVAS' : 'SEM URGÊNCIAS ATIVAS',
      urgentes, urgentes ? c.VERMELHO : c.VERDE]
  ];
  cartoes.forEach(function(item) {
    aba.getRange(item[0]).merge().setValue(item[2]).setBackground(item[4])
      .setFontColor(c.BRANCO).setFontFamily('Arial').setFontSize(8)
      .setFontWeight('bold').setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    aba.getRange(item[1]).merge().setValue(item[3]).setBackground(c.BRANCO)
      .setFontColor(item[4]).setFontFamily('Arial').setFontSize(17)
      .setFontWeight('bold').setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, false, false, c.BORDA,
        SpreadsheetApp.BorderStyle.SOLID);
  });
  aba.getRange(6, 1, 1, 15).setValues([CENTRAL_V3_CABECALHOS_DASHBOARD])
    .setBackground(c.AZUL_ESCURO).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(8).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setWrap(true)
    .setBorder(true, true, true, true, true, true, c.AZUL_ESCURO,
      SpreadsheetApp.BorderStyle.SOLID);
  if (linhas.length) {
    const valores = linhas.map(function(item) {
      return [
        item.id, item.data, item.diasAberto, item.bola, item.proximaAcao,
        item.status, item.urgencia, item.nome, item.telefone, item.endereco,
        item.solicitacao, af_responsavel_(item.bola), item.procedencia,
        item.ultimaEdicao, 'Abrir ficha'
      ];
    });
    aba.getRange(7, 1, valores.length, 15).setValues(valores)
      .setFontFamily('Arial').setFontSize(10).setFontColor(c.TEXTO)
      .setVerticalAlignment('top').setWrap(true)
      .setBorder(false, false, true, false, true, true, c.BORDA,
        SpreadsheetApp.BorderStyle.SOLID);
    linhas.forEach(function(item, indice) {
      const linha = 7 + indice;
      aba.getRange(linha, 1, 1, 15)
        .setBackground(indice % 2 ? '#F7F9FB' : c.BRANCO);
      aba.getRange(linha, 1).setFontWeight('bold').setFontColor(c.AZUL_ESCURO)
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
      aba.getRange(linha, 2).setNumberFormat('dd/MM/yyyy')
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
      aba.getRange(linha, 3).setHorizontalAlignment('center').setVerticalAlignment('middle');
      aba.getRange(linha, 14).setNumberFormat('dd/MM/yyyy HH:mm')
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
      definirLinkCentral_(
        aba.getRange(linha, 15),
        'Abrir ficha',
        item.linkFicha || destino.getUrl()
      );
      aba.getRange(linha, 15).setHorizontalAlignment('center')
        .setVerticalAlignment('middle').setFontWeight('bold');
    });
    aba.setRowHeights(7, valores.length, 90);
    aba.getRange(6, 1, valores.length + 1, 15).createFilter();
  }
  aplicarRegrasDashboardCentralV3_(aba);
  linhas.forEach(function(item, indice) {
    formatarPrazoLinhaCentralV3_(aba.getRange(7 + indice, 3), item);
  });
  aplicarProtecaoDashboardCentralV3_(aba);
  aba.setRowHeight(1, 34);
  aba.setRowHeight(2, 23);
  aba.setRowHeight(3, 20);
  aba.setRowHeight(4, 30);
  aba.getRange('A5:O5').merge().setValue('PARA REGISTRAR OU CORRIGIR: menu ATENDIMENTO > Abrir painel de trabalho. Esta aba é para consulta.').setBackground('#E7F3F2').setFontColor('#155A59').setFontSize(10).setFontWeight('bold');
  aba.setRowHeight(5, 28);
  aba.setRowHeight(6, 46);
  [105, 105, 78, 155, 260, 135, 185, 175, 145, 250, 330, 175, 125, 145, 100]
    .forEach(function(largura, indice) { aba.setColumnWidth(indice + 1, largura); });
}
function aplicarRegrasDashboardCentralV3_(aba) {
  const c = CONFIG_CENTRAL_ATENDIMENTOS.CORES;
  const n = Math.max(1, aba.getMaxRows() - 6);
  const bola = aba.getRange(7, 4, n, 1);
  const status = aba.getRange(7, 6, n, 1);
  const urgencia = aba.getRange(7, 7, n, 1);
  aba.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Execução')
      .setBackground(c.LARANJA_CLARO).setFontColor('#98520F').setBold(true)
      .setRanges([bola]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Atendimento')
      .setBackground(c.ROXO_CLARO).setFontColor('#55488E').setBold(true)
      .setRanges([bola]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Atendimento concluído')
      .setBackground(c.VERDE).setFontColor(c.BRANCO).setBold(true)
      .setRanges([bola, urgencia]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Recebida')
      .setBackground(c.VERMELHO_CLARO).setFontColor('#A83E31').setBold(true)
      .setRanges([status]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Em andamento')
      .setBackground(c.LARANJA_CLARO).setFontColor('#98520F').setBold(true)
      .setRanges([status]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Aguardando finalização')
      .setBackground(c.ROXO_CLARO).setFontColor('#55488E').setBold(true)
      .setRanges([status]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Concluída')
      .setBackground(c.VERDE_CLARO).setFontColor('#24734C').setBold(true)
      .setRanges([status]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Urgente')
      .setBackground(c.VERMELHO).setFontColor(c.BRANCO).setBold(true)
      .setRanges([urgencia]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Alto')
      .setBackground(c.VERMELHO_CLARO).setFontColor('#A83E31').setBold(true)
      .setRanges([urgencia]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Médio')
      .setBackground(c.LARANJA_CLARO).setFontColor('#98520F').setBold(true)
      .setRanges([urgencia]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Baixo')
      .setBackground(c.AZUL_CLARO).setFontColor(c.AZUL_ESCURO).setBold(true)
      .setRanges([urgencia]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Não informada')
      .setBackground(c.CINZA_CLARO).setFontColor(c.CINZA).setBold(true)
      .setRanges([urgencia]).build()
  ]);
}
function formatarPrazoLinhaCentralV3_(celula, item) {
  const c = CONFIG_CENTRAL_ATENDIMENTOS.CORES;
  celula.setFontWeight('bold').setHorizontalAlignment('center');
  if (item.status === 'Concluída' || item.limitePrazo === null) {
    celula.setBackground(c.CINZA_CLARO).setFontColor(c.CINZA);
    return;
  }
  const dias = Number(item.diasAberto || 0);
  if (item.foraDoPrazo) {
    celula.setBackground(c.VERMELHO_CLARO).setFontColor('#A83E31');
  } else if (dias >= Math.max(1, item.limitePrazo - 1)) {
    celula.setBackground(c.LARANJA_CLARO).setFontColor('#98520F');
  } else {
    celula.setBackground(c.VERDE_CLARO).setFontColor('#24734C');
  }
}
function aplicarProtecaoDashboardCentralV3_(aba) {
  aba.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function(p) {
    if (p.getDescription() === 'Dados automáticos: Central de Atendimentos') p.remove();
  });
  aba.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function(p) {
    if (p.getDescription() === 'Dashboard automático 3.0') p.remove();
  });
  const protecao = aba.protect().setDescription('Dashboard automático 3.0');
  try {
    protecao.setWarningOnly(false);
    const usuario = Session.getEffectiveUser();
    if (usuario && usuario.getEmail()) protecao.addEditor(usuario);
    const emailAtual = usuario && usuario.getEmail() ? usuario.getEmail() : '';
    const demais = protecao.getEditors().filter(function(editor) {
      return editor.getEmail() !== emailAtual;
    });
    if (demais.length) protecao.removeEditors(demais);
    if (protecao.canDomainEdit()) protecao.setDomainEdit(false);
  } catch (erro) {
    throw new Error('Não foi possível manter a proteção do Dashboard: ' + erro.message);
  }
}
function escreverResumoOrigemCentralV3_(){ /* Navegação passa a Operação; não recriar aba Atendimentos na origem. */ }
function escreverIndicadoresCentralV3_(aba, casos, linhas, historico) {
  const c = CONFIG_CENTRAL_ATENDIMENTOS.CORES;
  const kpi = calcularIndicadoresCentralV3_(casos, linhas, historico, new Date());
  garantirDimensoesCentral_(aba, 75, 26);
  if (aba.getFilter()) aba.getFilter().remove();
  aba.getBandings().forEach(function(banda) { banda.remove(); });
  aba.setConditionalFormatRules([]);
  aba.getCharts().forEach(function(grafico) { aba.removeChart(grafico); });
  aba.getRange(1, 1, aba.getMaxRows(), aba.getMaxColumns()).breakApart();
  aba.clear();
  aba.setHiddenGridlines(true);
  aba.setFrozenRows(2);
  aba.setFrozenColumns(0);
  aba.setTabColor(c.VERDE);
  aba.getRange('A1:L1').merge().setValue('BI DE ATENDIMENTOS E RESOLUTIVAS');
  aba.getRange('A2:L2').merge().setValue(
    'Leitura objetiva da carteira, velocidade, qualidade e evolução. Atualizado em ' +
    Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm')
  );
  aba.getRange('A1:L1').setBackground(c.AZUL_ESCURO).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(18).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  aba.getRange('A2:L2').setBackground(c.AZUL).setFontColor(c.BRANCO)
    .setFontFamily('Arial').setFontSize(9)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  const cards1 = [
    ['A4:C4', 'A5:C6', 'PENDÊNCIAS ATIVAS', kpi.ativas, c.AZUL],
    ['D4:F4', 'D5:F6', 'AÇÃO PENDENTE DA EXECUÇÃO', kpi.comExecucao, c.LARANJA],
    ['G4:I4', 'G5:I6', 'AÇÃO PENDENTE DO ATENDIMENTO', kpi.comAtendimento, c.ROXO],
    ['J4:L4', 'J5:L6', 'CONCLUÍDAS NO MÊS', kpi.concluidasMes, c.VERDE]
  ];
  const cards2 = [
    ['A9:C9', 'A10:C11', 'MEDIANA DE RESOLUÇÃO EM DIAS', kpi.medianaResolucao, c.VERDE],
    ['D9:F9', 'D10:F11', 'PERCENTIL 80 DE RESOLUÇÃO EM DIAS', kpi.p80Resolucao, '#4B8F8A'],
    ['G9:I9', 'G10:I11', 'MEDIANA ENTRE ATUALIZAÇÕES EM DIAS', kpi.medianaAtualizacao, c.AZUL],
    ['J9:L9', 'J10:L11', 'ENCERRADAS NO MESMO DIA', kpi.mesmoDia, c.ROXO]
  ];
  const cards3 = [
    ['A14:C14', 'A15:C16', 'PRIORIDADE ALTA OU URGENTE', kpi.urgentes, c.VERMELHO],
    ['D14:F14', 'D15:F16', 'FORA DO PRAZO INFORMADO', kpi.foraPrazo, c.LARANJA],
    ['G14:I14', 'G15:I16', 'SEM ATUALIZAÇÃO HÁ 7 DIAS', kpi.paradas7, c.AZUL],
    ['J14:L14', 'J15:L16', 'NOTA MÉDIA NA FINALIZAÇÃO', kpi.notaMedia, c.VERDE]
  ];
  cards1.concat(cards2).concat(cards3).forEach(function(item) {
    escreverCartaoIndicadorCentral_(aba, item[0], item[1], item[2], item[3], item[4]);
  });
  escreverDadosGraficosCentralV3_(aba, kpi);
  inserirGraficosCentralV3_(aba, c, kpi);
  formatarFaixaTituloIndicadorCentral_(aba.getRange('A52:L52'), 'LEITURA GERENCIAL', c.AZUL_ESCURO);
  aba.getRange('A53:L56').merge().setValue(kpi.leitura)
    .setBackground(c.CINZA_CLARO).setFontColor(c.TEXTO)
    .setFontFamily('Arial').setFontSize(11).setFontWeight('bold')
    .setVerticalAlignment('middle').setWrap(true)
    .setBorder(true, true, true, true, false, false, c.BORDA,
      SpreadsheetApp.BorderStyle.SOLID);
  formatarFaixaTituloIndicadorCentral_(aba.getRange('A58:F58'), 'QUALIDADE DOS DADOS', c.AZUL);
  aba.getRange('A59:F63').merge().setValue(kpi.qualidade)
    .setBackground('#F7F9FB').setFontColor(c.TEXTO)
    .setFontFamily('Arial').setFontSize(10).setVerticalAlignment('top')
    .setWrap(true).setBorder(true, true, true, true, false, false, c.BORDA,
      SpreadsheetApp.BorderStyle.SOLID);
  formatarFaixaTituloIndicadorCentral_(aba.getRange('G58:L58'), 'COMO LER O DESEMPENHO', c.VERDE);
  aba.getRange('G59:L63').merge().setValue(
    'Os indicadores de velocidade consideram o novo fluxo e janelas recentes. A carteira antiga continua visível, mas não distorce o desempenho atual. A mediana reduz o efeito de um caso excepcionalmente longo.'
  ).setBackground(c.VERDE_CLARO).setFontColor('#24734C')
    .setFontFamily('Arial').setFontSize(10).setVerticalAlignment('top')
    .setWrap(true).setBorder(true, true, true, true, false, false, c.BORDA,
      SpreadsheetApp.BorderStyle.SOLID);
  aba.setRowHeight(1, 38);
  aba.setRowHeight(2, 24);
  [4, 9, 14].forEach(function(linha) { aba.setRowHeight(linha, 28); });
  [5, 10, 15].forEach(function(linha) { aba.setRowHeights(linha, 2, 28); });
  aba.setRowHeight(52, 28);
  aba.setRowHeights(53, 4, 34);
  aba.setRowHeight(58, 28);
  aba.setRowHeights(59, 5, 30);
  [120, 105, 105, 120, 105, 105, 120, 105, 105, 120, 105, 105]
    .forEach(function(largura, indice) { aba.setColumnWidth(indice + 1, largura); });
  try { aba.hideColumns(14, 13); } catch (erro) {}
}
function calcularIndicadoresCentralV3_(casos, linhas, historico, agora) {
  const ativas = linhas.filter(function(item) { return item.status !== 'Concluída'; });
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const limite7 = new Date(agora.getTime() - 7 * 86400000);
  const novoFluxo = linhas.filter(function(item) {
    const data = dataValidaCentral_(item.data);
    return data && data >= CENTRAL_V3.DATA_CORTE;
  });
  const concluidasNovo = novoFluxo.filter(function(item) { return item.status === 'Concluída'; });
  const duracoes = concluidasNovo.map(function(item) {
    const inicio = dataValidaCentral_(item.data);
    const fim = dataValidaCentral_(item.dataConclusao || item.ultimaEdicao);
    return diferencaHorasCentral_(inicio, fim);
  }).filter(function(valor) { return valor !== null; }).sort(function(a, b) { return a - b; });
  const intervalos = [];
  novoFluxo.forEach(function(item) {
    const eventos = (historico[item.id] || []).map(function(evento) {
      return dataValidaCentral_(evento.dataHora);
    }).filter(Boolean).sort(function(a, b) { return a.getTime() - b.getTime(); });
    for (let i = 1; i < eventos.length; i++) {
      intervalos.push(diferencaHorasCentral_(eventos[i - 1], eventos[i]));
    }
  });
  const finalizacoes = [];
  Object.keys(historico).forEach(function(id) {
    (historico[id] || []).forEach(function(evento) {
      if (evento.tipoEvento === 'Finalização') finalizacoes.push(evento);
    });
  });
  const notas = finalizacoes.map(function(item) {
    return numeroOuVazioCentral_(item.notaFinal);
  }).filter(function(valor) { return valor !== ''; });
  const encerramentosSemResposta = finalizacoes.filter(function(item) {
    return /ausencia.*resposta/.test(normalizarTextoCentral_([
      item.origemAtualizacao, item.observacao, item.conclusaoConfirmada
    ].join(' ')));
  }).length;
  const essenciaisCompletos = linhas.filter(function(item) {
    return textoCentral_(item.nome) && textoCentral_(item.telefone) &&
      textoCentral_(item.endereco) && textoCentral_(item.solicitacao) &&
      normalizarTextoCentral_(item.urgencia) !== 'nao informada';
  }).length;
  const concluidasMes = linhas.filter(function(item) {
    const data = dataValidaCentral_(item.dataConclusao || item.ultimaEdicao);
    return item.status === 'Concluída' && item.conclusaoOperacional &&
      data && data >= inicioMes;
  }).length;
  const mesmoDia = concluidasNovo.filter(function(item) {
    const inicio = dataValidaCentral_(item.data);
    const fim = dataValidaCentral_(item.dataConclusao || item.ultimaEdicao);
    return inicio && fim && inicio.toDateString() === fim.toDateString();
  }).length;
  const paradas7 = ativas.filter(function(item) {
    const data = dataValidaCentral_(item.ultimaEdicao || item.data);
    return data && data < limite7;
  }).length;
  const foraPrazo = ativas.filter(function(item) { return item.foraDoPrazo; }).length;
  const temas = contarTemasCentralV3_(linhas);
  const meses = serieMensalCentralV3_(linhas, agora);
  const idades = { '0 a 2 dias': 0, '3 a 7 dias': 0, '8 dias ou mais': 0 };
  ativas.forEach(function(item) {
    const dias = Number(item.diasAberto || 0);
    if (dias < 3) idades['0 a 2 dias']++;
    else if (dias < 8) idades['3 a 7 dias']++;
    else idades['8 dias ou mais']++;
  });
  const responsabilidades = {};
  responsabilidades[CENTRAL_V3.RESPONSABILIDADES.EXECUCAO] = 0;
  responsabilidades[CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO] = 0;
  ativas.forEach(function(item) {
    if (responsabilidades[item.bola] !== undefined) responsabilidades[item.bola]++;
  });
  const principalTema = Object.keys(temas).sort(function(a, b) {
    return temas[b] - temas[a];
  })[0] || 'Sem base';
  const faltas = {
    telefone: linhas.filter(function(x) { return telefoneInvalidoCentralV3_(x.telefone); }).length,
    endereco: linhas.filter(function(x) { return !textoCentral_(x.endereco); }).length,
    urgencia: linhas.filter(function(x) {
      return !textoCentral_(x.caso.urgencia) || normalizarTextoCentral_(x.caso.urgencia) === 'nao informada';
    }).length,
    canal: linhas.filter(function(x) { return !textoCentral_(x.caso.canalRecebimento); }).length,
    responsavel: ativas.filter(function(x) { return !textoCentral_(x.responsavel); }).length
  };
  const urgentes = ativas.filter(function(item) { return urgenciaAltaCentralV3_(item.urgencia); }).length;
  const percentualExecucao = ativas.length
    ? Math.round(responsabilidades[CENTRAL_V3.RESPONSABILIDADES.EXECUCAO] / ativas.length * 100)
    : 0;
  const leitura = ativas.length
    ? 'A carteira possui ' + ativas.length + ' pendência(s). ' + percentualExecucao +
      '% dependem de retorno da execução e ' +
      responsabilidades[CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO] +
      ' estão com a equipe de atendimento para complemento ou finalização. O tema mais frequente é ' +
      principalTema + '. Há ' + urgentes + ' urgência(s) ativa(s) e ' +
      foraPrazo + ' caso(s) fora do prazo indicado pela urgência. ' +
      paradas7 + ' demanda(s) estão há pelo menos 7 dias sem atualização.'
    : 'A carteira operacional está sem pendências. O tema mais frequente no histórico é ' +
      principalTema + '. As conclusões do mês somam ' + concluidasMes + '.';
  const qualidade = [
    'Telefone ausente ou incompleto: ' + faltas.telefone,
    'Endereço ausente: ' + faltas.endereco,
    'Urgência não informada: ' + faltas.urgencia,
    'Canal de recebimento não informado: ' + faltas.canal,
    'Pendências sem responsável nominal: ' + faltas.responsavel,
    'Finalizações com avaliação: ' + notas.length,
    'Encerramentos por ausência de resposta: ' + encerramentosSemResposta
  ].join('\n');
  return {
    ativas: ativas.length,
    comExecucao: responsabilidades[CENTRAL_V3.RESPONSABILIDADES.EXECUCAO],
    comAtendimento: responsabilidades[CENTRAL_V3.RESPONSABILIDADES.ATENDIMENTO],
    concluidasMes: concluidasMes,
    medianaResolucao: formatarDuracaoIndicadorCentral_(medianaCentral_(duracoes)),
    p80Resolucao: formatarDuracaoIndicadorCentral_(percentilCentralV3_(duracoes, 0.8)),
    medianaAtualizacao: formatarDuracaoIndicadorCentral_(medianaCentral_(intervalos)),
    mesmoDia: concluidasNovo.length
      ? Math.round(mesmoDia / concluidasNovo.length * 100) + '%'
      : 'Sem base',
    urgentes: urgentes,
    foraPrazo: foraPrazo,
    paradas7: paradas7,
    dadosCompletos: linhas.length
      ? Math.round(essenciaisCompletos / linhas.length * 100) + '%'
      : 'Sem base',
    notaMedia: notas.length
      ? String(Math.round(mediaCentral_(notas) * 10) / 10).replace('.', ',') + '/10'
      : 'Sem base',
    encerramentosSemResposta: encerramentosSemResposta,
    responsabilidades: responsabilidades,
    idades: idades,
    meses: meses,
    temas: temas,
    leitura: leitura,
    qualidade: qualidade
  };
}
function telefoneInvalidoCentralV3_(valor) {
  return textoCentral_(valor).replace(/\D/g, '').length < 8;
}
function percentilCentralV3_(valores, p) {
  if (!valores.length) return null;
  const ordenados = valores.slice().sort(function(a, b) { return a - b; });
  const indice = Math.ceil(p * ordenados.length) - 1;
  return ordenados[Math.max(0, Math.min(indice, ordenados.length - 1))];
}
function contarTemasCentralV3_(linhas) {
  const temas = {
    'Esgoto, vazamento e odor': 0,
    'Pavimento, calçada e buraco': 0,
    'Danos a imóvel ou bem': 0,
    'Acesso, mobilidade e sinalização': 0,
    'Limpeza e resíduos': 0,
    'Outros': 0
  };
  linhas.forEach(function(item) {
    const texto = normalizarTextoCentral_([
      item.caso.assunto, item.caso.solicitacao, item.caso.tipoManifestacao
    ].join(' '));
    let tema = 'Outros';
    if (/esgoto|vazamento|odor|cheiro|entup|infiltra/.test(texto)) {
      tema = 'Esgoto, vazamento e odor';
    } else if (/paviment|calcada|buraco|asfalto|piso|ceramica/.test(texto)) {
      tema = 'Pavimento, calçada e buraco';
    } else if (/portao|vidro|muro|parede|trinca|rachadura|dano|quebrad|amassad/.test(texto)) {
      tema = 'Danos a imóvel ou bem';
    } else if (/acesso|garagem|passagem|transito|sinaliza|tapume|barreira/.test(texto)) {
      tema = 'Acesso, mobilidade e sinalização';
    } else if (/limpeza|sujeira|residuo|galho|material/.test(texto)) {
      tema = 'Limpeza e resíduos';
    }
    temas[tema]++;
  });
  return temas;
}
function serieMensalCentralV3_(linhas, agora) {
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const saida = [];
  for (let deslocamento = 5; deslocamento >= 0; deslocamento--) {
    const inicio = new Date(agora.getFullYear(), agora.getMonth() - deslocamento, 1);
    const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1);
    const abertas = linhas.filter(function(item) {
      const data = dataValidaCentral_(item.data);
      return data && data >= inicio && data < fim;
    }).length;
    const concluidas = linhas.filter(function(item) {
      const data = dataValidaCentral_(item.dataConclusao);
      return item.status === 'Concluída' && item.conclusaoOperacional &&
        data && data >= inicio && data < fim;
    }).length;
    saida.push({
      mes: nomes[inicio.getMonth()] + '/' + String(inicio.getFullYear()).slice(-2),
      abertas: abertas,
      concluidas: concluidas
    });
  }
  return saida;
}
function escreverDadosGraficosCentralV3_(aba, kpi) {
  const responsa = Object.keys(kpi.responsabilidades).map(function(chave) {
    return [chave, kpi.responsabilidades[chave]];
  });
  aba.getRange(2, 14, 1, 2).setValues([['Responsabilidade', 'Total']]);
  aba.getRange(3, 14, responsa.length, 2).setValues(responsa);
  const idades = Object.keys(kpi.idades).map(function(chave) {
    return [chave, kpi.idades[chave]];
  });
  aba.getRange(2, 17, 1, 2).setValues([['Tempo em aberto', 'Total']]);
  aba.getRange(3, 17, idades.length, 2).setValues(idades);
  aba.getRange(2, 20, 1, 3).setValues([['Mês', 'Abertas', 'Concluídas']]);
  aba.getRange(3, 20, kpi.meses.length, 3).setValues(kpi.meses.map(function(item) {
    return [item.mes, item.abertas, item.concluidas];
  }));
  const temas = Object.keys(kpi.temas).map(function(chave) {
    return [chave, kpi.temas[chave]];
  }).sort(function(a, b) { return b[1] - a[1]; });
  aba.getRange(2, 24, 1, 2).setValues([['Tema', 'Total']]);
  aba.getRange(3, 24, temas.length, 2).setValues(temas);
}
function inserirGraficosCentralV3_(aba, c, kpi) {
  const base = {
    backgroundColor: '#FFFFFF',
    chartArea: {left: 70, top: 50, width: '72%', height: '65%'},
    fontName: 'Arial',
    titleTextStyle: {color: c.AZUL_ESCURO, fontSize: 14, bold: true},
    legend: {textStyle: {color: c.TEXTO, fontSize: 10}}
  };
  if (kpi && kpi.ativas > 0) {
    const responsabilidade = aba.newChart().asPieChart()
      .addRange(aba.getRange(2, 14, 3, 2))
      .setPosition(19, 1, 0, 0)
      .setOption('title', 'Responsabilidade pela próxima ação')
      .setOption('pieHole', 0.58)
      .setOption('colors', [c.LARANJA, c.ROXO])
      .setOption('width', 650).setOption('height', 310)
      .setOption('backgroundColor', base.backgroundColor)
      .setOption('chartArea', base.chartArea)
      .setOption('fontName', base.fontName)
      .setOption('titleTextStyle', base.titleTextStyle)
      .setOption('legend', base.legend)
      .build();
    aba.insertChart(responsabilidade);
  } else {
    formatarFaixaTituloIndicadorCentral_(
      aba.getRange('A19:L19'),
      'RESPONSABILIDADE PELA PRÓXIMA AÇÃO',
      c.VERDE
    );
    aba.getRange('A20:L31').merge()
      .setValue('CARTEIRA SEM PENDÊNCIAS\nTodos os atendimentos estão concluídos.')
      .setBackground(c.VERDE_CLARO).setFontColor('#24734C')
      .setFontFamily('Arial').setFontSize(13).setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle')
      .setWrap(true)
      .setBorder(true, true, true, true, false, false, c.BORDA,
        SpreadsheetApp.BorderStyle.SOLID);
  }
  if (kpi && kpi.ativas > 0) {
    const idade = aba.newChart().asColumnChart()
      .addRange(aba.getRange(2, 17, 4, 2))
      .setPosition(19, 7, 0, 0)
      .setOption('title', 'Prioridade por tempo em aberto')
      .setOption('colors', [c.AZUL])
      .setOption('legend', {position: 'none'})
      .setOption('width', 650).setOption('height', 310)
      .setOption('backgroundColor', base.backgroundColor)
      .setOption('chartArea', base.chartArea)
      .setOption('fontName', base.fontName)
      .setOption('titleTextStyle', base.titleTextStyle)
      .build();
    aba.insertChart(idade);
  }
  const mensal = aba.newChart().asColumnChart()
    .addRange(aba.getRange(2, 20, 7, 3))
    .setPosition(35, 1, 0, 0)
    .setOption('title', 'Aberturas e conclusões por mês')
    .setOption('colors', [c.AZUL, c.VERDE])
    .setOption('width', 650).setOption('height', 310)
    .setOption('backgroundColor', base.backgroundColor)
    .setOption('chartArea', base.chartArea)
    .setOption('fontName', base.fontName)
    .setOption('titleTextStyle', base.titleTextStyle)
    .setOption('legend', base.legend)
    .build();
  aba.insertChart(mensal);
  const temas = aba.newChart().asBarChart()
    .addRange(aba.getRange(2, 24, 7, 2))
    .setPosition(35, 7, 0, 0)
    .setOption('title', 'Temas mais frequentes')
    .setOption('colors', [c.ROXO])
    .setOption('legend', {position: 'none'})
    .setOption('width', 650).setOption('height', 310)
    .setOption('backgroundColor', base.backgroundColor)
    .setOption('chartArea', {left: 180, top: 50, width: '58%', height: '68%'})
    .setOption('fontName', base.fontName)
    .setOption('titleTextStyle', base.titleTextStyle)
    .build();
  aba.insertChart(temas);
}
function escreverAuditoriaCentralV3_(destino, casos, linhas, pendenciasExecucao) {
  let aba = destino.getSheetByName(CENTRAL_V3.ABA_AUDITORIA);
  if (!aba) aba = destino.insertSheet(CENTRAL_V3.ABA_AUDITORIA);
  garantirDimensoesCentral_(aba, Math.max(30, pendenciasExecucao.length + 12), 5);
  aba.clear();
  aba.getRange('A1:E1').merge().setValue('AUDITORIA TÉCNICA DA CENTRAL 3.0');
  aba.getRange('A3:B7').setValues([
    ['Versão', CENTRAL_V3.VERSAO],
    ['Atendimentos na base', casos.length],
    ['Atendimentos ativos', linhas.filter(function(x) { return x.status !== 'Concluída'; }).length],
    ['Registros externos sem vínculo', pendenciasExecucao.length],
    ['Última atualização', new Date()]
  ]);
  aba.getRange('A9:E9').setValues([[
    'Tipo', 'Chave', 'ID informado', 'Detalhe', 'Situação'
  ]]);
  if (pendenciasExecucao.length) {
    aba.getRange(10, 1, pendenciasExecucao.length, 5).setValues(
      pendenciasExecucao.map(function(item) {
        return [item.tipo, item.chave, item.id, item.detalhe, 'Revisar'];
      })
    );
  }
  aba.getRange('A1:E1').setBackground(CONFIG_CENTRAL_ATENDIMENTOS.CORES.AZUL_ESCURO)
    .setFontColor('#FFFFFF').setFontWeight('bold');
  aba.getRange('A9:E9').setBackground(CONFIG_CENTRAL_ATENDIMENTOS.CORES.AZUL)
    .setFontColor('#FFFFFF').setFontWeight('bold');
  aba.getRange(7, 2).setNumberFormat('dd/MM/yyyy HH:mm');
  try { aba.hideSheet(); } catch (erro) {}
}
function organizarAbasCentralV3_(destino, estrutura, pendencias) {
  estrutura.dashboard.showSheet();
  estrutura.indicadores.showSheet();
  try { estrutura.correcoesFicha.hideSheet(); } catch (erro) {}
  try { estrutura.finalizacoesPendentes.hideSheet(); } catch (erro) {}
  [
    CONFIG_CENTRAL_ATENDIMENTOS.ABA_BASE,
    CONFIG_CENTRAL_ATENDIMENTOS.ABA_HISTORICO,
    CENTRAL_V3.ABA_BASE_OFICIAL,
    CENTRAL_V3.ABA_AUDITORIA,
    'Configuração Fichas',
    'Log Fichas Oficiais',
    'Revisão de Migração'
  ].forEach(function(nome) {
    const aba = destino.getSheetByName(nome);
    if (!aba) return;
    try { aba.hideSheet(); } catch (erro) {}
  });
  destino.getSheets().forEach(function(aba) {
    if (/^ATD(?:\d{8}|-\d{4})$/i.test(aba.getName())) {
      try { aba.hideSheet(); } catch (erro) {}
    }
  });
}
function temCorrecaoFichaEmUsoCentralV43_(aba) {
  if (!aba || aba.getLastRow() < 6) return false;
  return aba.getRange(6, 1, aba.getLastRow() - 5, 8).getValues()
    .some(function(linha) {
      return [linha[0], linha[3], linha[5], linha[6], linha[7]]
        .some(function(valor) {
          return valor === true || Boolean(textoCentral_(valor));
        });
    });
}
/** Remove também o gatilho de edição e as versões agendadas anteriores. */
function filtrarCasosNovoSistemaCentral_(casos, idsExistentes) {
  const corte = Date.UTC(2026, 8, 1);
  return (casos || []).filter(function(caso) {
    if (idsExistentes && idsExistentes[caso.chaveOrigem]) return true;
    const carimbo = dataValidaCentral_(caso.carimbo);
    if (!carimbo) return false;
    const dia = Date.UTC(
      carimbo.getUTCFullYear(),
      carimbo.getUTCMonth(),
      carimbo.getUTCDate()
    );
    return dia >= corte;
  });
}
/** Atualiza dados e reaplica toda a apresentação sem excluir protocolos. */
function reconciliarCarteiraAnteriorCentralV3_() {
  return;
}
/** Ponte entre as solicitações do painel e a consolidação operacional existente. */
function processarSolicitacoesPainelAtendimento(){
 const ss=SpreadsheetApp.openById(CONFIG_CENTRAL_ATENDIMENTOS.DESTINO_ID),aba=ss.getSheetByName('Solicitações do Painel');
 if(!aba||aba.getLastRow()<2)return;
 const estados=aba.getRange(2,4,aba.getLastRow()-1,1).getValues();
 const pendentes=estados.map(function(r,i){return {estado:r[0],linha:i+2};}).filter(function(x){return x.estado==='AGUARDANDO CENTRAL';}).map(function(x){return {linha:x.linha,r:aba.getRange(x.linha,1,1,11).getValues()[0]};});
 if(!pendentes.length)return;
 // The existing sync owns its lock and rebuilds the protected Dashboard.
 try{
  sincronizarCentralAtendimentos(false,{baseJaSincronizada:true});
  pendentes.forEach(function(x){
   if(x.r[1]==='CORRIGIR'||x.r[1]==='CORRIGIR_LOTE'){
    const cor=ss.getSheetByName(CONFIG_CENTRAL_ATENDIMENTOS.ABA_CORRECOES_FICHA);
    const rows=cor.getRange(6,1,Math.max(1,cor.getLastRow()-5),16).getValues();
    const found=rows.filter(function(r){return r[6]&&String(r[6]).indexOf('[Painel '+x.r[0]+']')>=0;});
    const naoAplicada=found.find(function(r){return String(r[8]).indexOf('Aplicada')!==0;});
    if(!found.length||naoAplicada){aba.getRange(x.linha,4).setValue('ERRO');aba.getRange(x.linha,8).setValue('Correção não aplicada: '+(naoAplicada?naoAplicada[8]:'registro não encontrado'));return;}
   }
   aba.getRange(x.linha,4).setValue('CENTRAL ATUALIZADA');aba.getRange(x.linha,9).setValue(new Date());
  });
 }catch(e){pendentes.forEach(function(x){aba.getRange(x.linha,8).setValue('Aguardando atualização da Central: '+e.message);});throw e;}
}
/** Vínculos são persistentes no Controle. Respostas e eventos de origem nunca são apagados. */
function af_vinculos_(){if(AF_CACHE)return AF_CACHE;const sh=SpreadsheetApp.openById(AF_CENTRAL_ID).getSheetByName(AF_ABA);if(!sh)return AF_CACHE=[];const v=sh.getDataRange().getValues();if(JSON.stringify(v[0])!==JSON.stringify(AF_CAB))throw Error('Cabeçalhos dos vínculos alterados. Confira antes de continuar.');return AF_CACHE=v.slice(1).filter(r=>r[6]==='ATIVA').map(r=>({origem:String(r[0]),principal:String(r[1]),idOrigem:String(r[2]),idPrincipal:String(r[3]),chaveOrigem:r[4],chavePrincipal:r[5],data:r[7],autor:r[8],motivo:r[9],arquivo:r[10],publico:r[11]?JSON.parse(r[11]):{}}));}
function af_resolver_(id,central){id=String(id||'').trim();const vistos=new Set();for(let i=0;i<100;i++){const v=af_vinculos_().find(v=>v.origem===id||v.idOrigem===id);if(!v)return id;if(vistos.has(id))throw Error('Ciclo nos protocolos incorporados.');vistos.add(id);id=central?v.idPrincipal:v.principal;}throw Error('Limite de vínculos excedido.');}
function af_incorporado_(id){return af_vinculos_().some(v=>v.origem===id||v.idOrigem===id);}
function af_norm_(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function af_revisao_(status){return /^(aguardando finalizacao|aguardando revisao e finalizacao do atendimento)$/.test(af_norm_(status));}
function af_rotulo_(status){return af_revisao_(status)?'Aguardando revisão e finalização do Atendimento':status;}
function af_fechado_(status){return /^(concluida|concluido|encerrada|encerrado|atendimento concluido)$/.test(af_norm_(status));}
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
