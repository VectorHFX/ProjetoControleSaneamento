/**
 * PROCEDIMENTOS DE CAMPO 3.0: DIAGNOSTICO DE AREA
 *
 * Cria duas abas sem alterar a base consolidada:
 * 1. "Diagnósticos de Área": base consolidada e filtravel.
 * 2. "Ficha do Diagnóstico": ficha vertical pronta para consulta/relatorio.
 *
 * Antes de ler os dados, chama a integração das versões 1.0 e 3.0.
 * O script nao usa formulas. Portanto, nao depende de virgula ou ponto e
 * virgula como separador da localidade da planilha.
 */
const CONFIG_DIAGNOSTICO = {
  ABA_CONSOLIDADA: 'Base Consolidada',
  ABA_BASE: 'Diagnósticos de Área',
  ABA_FICHA: 'Ficha do Diagnóstico',
  CABECALHO_PROCEDIMENTO: 'Selecione o procedimento a ser executado',
  VALOR_PROCEDIMENTO: 'Diagnóstico de Área',
  CABECALHO_ID_MIGRACAO: 'ID de migração',
  CABECALHO_VALIDACAO: 'Validação',
  VALIDACOES_ACEITAS: ['Válido para consolidação', 'Registro atual preservado'],
  ABAS_DIAGNOSTICO: ['Diagnósticos de Área', 'Ficha do Diagnóstico'],
  PRIMEIRA_LINHA_DADOS: 12
};

const CABECALHOS_DIAGNOSTICO = [
  'ID', 'Data do diagnóstico', 'Bairro', 'Rua/Avenida e numeração',
  'Frente/CT', 'PV início', 'PV fim', 'Método construtivo', 'Extensão',
  'Perfil socioeconômico', 'Tipo do pavimento', 'Condição do pavimento',
  'Nível de impacto sugerido', 'Nível de impacto final', 'Impactos identificados',
  'Tráfego de veículos', 'Tráfego de pedestres', 'Imóveis residenciais', 'Imóveis comerciais',
  'Padrão construtivo (baixo/médio/alto)', 'Padrão construtivo observado', 'IPVS',
  'Lideranças', 'Escolas públicas', 'UBS/Hospitais', 'Centros comunitários/ONGs',
  'Pontos de ônibus', 'Oportunidades de comunicação', 'Pontos críticos',
  'Observações consolidadas', 'Relato do diagnóstico', 'Fotos',
  'Responsável pelo registro', 'Área responsável', 'Tipo do local', 'Possibilidade de tenda',
  'Infraestrutura e ocorrências'
];

const CAMPOS_PRESERVADOS_DIAGNOSTICO = [
  'PV início',
  'PV fim',
  'Método construtivo',
  'Extensão',
  'Condição do pavimento',
  'Nível de impacto final'
];

/**
 * Execute uma vez para instalar o menu e os gatilhos.
 * Usa gatilho instalavel para coexistir com o menu do script de Relatos.
 */
function instalarSistemaDiagnosticos() {
  removerGatilhosDiagnosticos_(false);
  const arquivo = SpreadsheetApp.getActiveSpreadsheet();

  ScriptApp.newTrigger('aoAbrirDiagnosticos')
    .forSpreadsheet(arquivo)
    .onOpen()
    .create();

  sincronizarBaseEAtualizarDiagnosticos();
  criarMenuDiagnosticos_();
  avisarDiagnostico_(
    'Sistema instalado. Os diagnósticos serão lidos da Base Consolidada.',
    'Diagnósticos'
  );
}

function aoAbrirDiagnosticos(e) {
  criarMenuDiagnosticos_();
  criarMenuPainelTerritorial();
}

function criarMenuDiagnosticos_() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('Diagnósticos')
      .addItem('Sincronizar base e atualizar diagnósticos', 'sincronizarBaseEAtualizarDiagnosticos')
      .addItem('Gerar ficha da linha selecionada', 'gerarFichaDaLinhaSelecionada')
      .addItem('Gerar ficha do diagnóstico mais recente', 'gerarFichaMaisRecente')
      .addSeparator()
      .addItem('Ocultar páginas de diagnóstico', 'ocultarPaginasDiagnostico')
      .addItem('Mostrar páginas de diagnóstico', 'mostrarPaginasDiagnostico')
      .addSeparator()
      .addItem('Instalar ou renovar automação', 'instalarSistemaDiagnosticos')
      .addItem('Remover automação', 'removerAutomacaoDiagnosticos')
      .addToUi();
    return true;
  } catch (erro) {
    return false;
  }
}

function sincronizarBaseEAtualizarDiagnosticos() {
  if (typeof sincronizarBaseConsolidada1e3 !== 'function') {
    throw new Error(
      'A integração da Base Consolidada não está instalada. ' +
      'Adicione o arquivo "Integracao_Procedimentos_1_0_e_3_0.gs" ao projeto.'
    );
  }
  sincronizarBaseConsolidada1e3();
  return atualizarDiagnosticosDeArea({baseJaSincronizada: true});
}

function atualizarDiagnosticosDeArea(e) {
  if (!(e && e.baseJaSincronizada)) {
    if (typeof sincronizarBaseConsolidada1e3 !== 'function') {
      throw new Error(
        'A Base Consolidada precisa ser sincronizada antes do diagnóstico. ' +
        'Instale o arquivo de integração das versões 1.0 e 3.0.'
      );
    }
    sincronizarBaseConsolidada1e3({origem: 'diagnostico'});
    e = {baseJaSincronizada: true};
  }
  const bloqueio = LockService.getDocumentLock();
  bloqueio.waitLock(30000);

  try {
    const arquivo = SpreadsheetApp.getActiveSpreadsheet();
    const consolidada = arquivo.getSheetByName(CONFIG_DIAGNOSTICO.ABA_CONSOLIDADA);
    if (!consolidada) {
      throw new Error('A aba "' + CONFIG_DIAGNOSTICO.ABA_CONSOLIDADA + '" não foi encontrada.');
    }

    const dados = consolidada.getDataRange().getValues();
    if (!dados.length) throw new Error('A Base Consolidada está vazia.');

    const mapaCabecalhos = montarMapaCabecalhosDiagnostico_(dados[0]);
    validarCabecalhosDiagnostico_(mapaCabecalhos);

    let base = arquivo.getSheetByName(CONFIG_DIAGNOSTICO.ABA_BASE);
    const complementos = lerComplementosManuais_(base);
    const diagnosticos = [];
    const chavesVistas = {};
    const indiceValidacao = mapaCabecalhos[normalizarTextoDiagnostico_(CONFIG_DIAGNOSTICO.CABECALHO_VALIDACAO)];
    const indiceIdMigracao = mapaCabecalhos[normalizarTextoDiagnostico_(CONFIG_DIAGNOSTICO.CABECALHO_ID_MIGRACAO)];

    for (let i = 1; i < dados.length; i++) {
      const linha = dados[i];
      if (!validacaoConsolidadaAceita_(linha[indiceValidacao])) continue;
      const procedimento = pegarCampo_(linha, mapaCabecalhos, CONFIG_DIAGNOSTICO.CABECALHO_PROCEDIMENTO);
      if (normalizarTextoDiagnostico_(procedimento) !== normalizarTextoDiagnostico_(CONFIG_DIAGNOSTICO.VALOR_PROCEDIMENTO)) {
        continue;
      }

      const chave = construirChaveRegistroDiagnostico_(linha, mapaCabecalhos);
      if (chavesVistas[chave]) continue;
      chavesVistas[chave] = true;

      const idMigracao = indiceIdMigracao === undefined ? '' : linha[indiceIdMigracao];
      const idDiagnostico = construirIdDiagnostico_(idMigracao, i + 1);
      const diagnostico = construirDiagnostico_(linha, idDiagnostico, mapaCabecalhos);
      aplicarComplementosManuais_(diagnostico, complementos[diagnostico.id]);
      diagnosticos.push(diagnostico);
    }

    diagnosticos.sort(compararDiagnosticosPorData_);

    if (!base) {
      base = arquivo.insertSheet(CONFIG_DIAGNOSTICO.ABA_BASE);
      base.setTabColor('#196FA5');
    }

    prepararAbaDiagnosticos_(base, diagnosticos.length);
    escreverBaseDiagnosticos_(base, diagnosticos);
    formatarBaseDiagnosticos_(base, diagnosticos);

    if (diagnosticos.length) {
      const fichaExistente = arquivo.getSheetByName(CONFIG_DIAGNOSTICO.ABA_FICHA);
      const manterFichaOculta = fichaExistente && fichaExistente.isSheetHidden();
      gerarFichaDiagnostico_(
        diagnosticos[diagnosticos.length - 1],
        Boolean(e) || Boolean(manterFichaOculta)
      );
    }

    if (!e) {
      arquivo.toast(
        diagnosticos.length + ' diagnóstico(s) lido(s) da Base Consolidada.',
        'Diagnósticos atualizados',
        5
      );
    }
  } finally {
    bloqueio.releaseLock();
  }
}

function construirDiagnostico_(linha, idDiagnostico, mapa) {
  const campo = function (nome) { return pegarCampo_(linha, mapa, nome); };
  const endereco = juntarInformacoes_([
    campo('Endereço completo'),
    campo('Intervalo de numeração observado no trecho')
  ]);

  let impactos = juntarInformacoes_([
    rotularInformacao_('Condições da via', campo('Condições da via')),
    rotularInformacao_('Ocorrências', campo('Ocorrências observadas na região'))
  ]);
  if (!valorPreenchidoDiagnostico_(impactos)) impactos = campo('Relato do Diagnóstico');

  const observacaoFinal = campo('Observação final do procedimento');

  const observacoes = juntarInformacoes_([
    campo('Relato do Diagnóstico'),
    rotularInformacao_('Tipo do local', campo('Tipo do local')),
    rotularInformacao_(
      'Indicadores socioeconômicos',
      campo('Indicadores utilizados para classificar o perfil socioeconômico observado')
    ),
    rotularInformacao_(
      'Caracterização das edificações',
      campo('Padrão ou padrões construtivos predominantemente observados')
    ),
    rotularInformacao_('Praças', campo('Há presença de praças no trecho?')),
    rotularInformacao_('Possibilidade de tenda', campo('Possíveis locais para instalação de tenda')),
    rotularInformacao_('Calçadas', campo('Tipo de calçadas predonimante')),
    rotularInformacao_('Faixas etárias', campo('Faixas etárias predominantes no trecho')),
    rotularInformacao_('Grupos etários', campo('Observações sobre grupos etários identificados')),
    rotularInformacao_(
      'Infraestrutura sanitária identificada',
      campo('Infraestrutura sanitária identificada no diagnóstico')
    ),
    rotularInformacao_('Infraestrutura', campo('Observações sobre a infraestrutura sanitária')),
    rotularInformacao_(
      'Interesse da população durante o procedimento',
      campo('Durante o procedimento, houve interesse da população ao redor para saber mais da atividade?')
    ),
    rotularInformacao_(
      'Interesse da população sobre as obras',
      campo('Houve interesse da população ao redor de saber mais sobre as obras?')
    ),
    respostaNegativa_(campo('Foram identificadas lideranças no território?'))
      ? ''
      : rotularInformacao_('Referência de liderança', campo('Onde encontrar essas lideranças?')),
    rotularInformacao_(
      'Equipamento de educação identificado',
      campo('Escolas e equipamentos de educação Identificados')
    ),
    rotularInformacao_('UBS ou hospital identificado', campo('UBS ou Hospitais identificados')),
    rotularInformacao_('Frequência dos ônibus', campo('Com qual frequência passam os ônibus?')),
    rotularInformacao_(
      'Estratégia social',
      campo('Há alguma observação de cunho social, que possa ser estratégica para realizar ações e conscientização da população ao redor dessa intervenção?')
    ),
    rotularInformacao_(
      'Estratégia de comunicação',
      campo('Há alguma observação para a comunicação que possa ser estratégica para as ações?')
    ),
    textoComplementarSemDuplicar_(
      'Informações complementares registradas',
      observacaoFinal,
      campo('Relato do Diagnóstico')
    )
  ]);

  const nivelSugerido = sugerirNivelImpacto_(linha, mapa);

  return {
    id: idDiagnostico,
    dataHora: campo('Carimbo de data/hora'),
    data: campo('Data de realização do procedimento'),
    bairro: campo('Bairro de realização do procedimento'),
    endereco: endereco,
    frente: campo('Endereço completo'),
    pvInicio: '',
    pvFim: '',
    metodo: '-',
    extensao: '',
    perfil: campo('Perfil socioeconômico observado no território'),
    pavimento: campo('Tipo de pavimento predominante'),
    condicaoPavimento: classificarCondicaoPavimento_(linha, mapa),
    impactoSugerido: nivelSugerido,
    impactoFinal: nivelSugerido,
    impactos: impactos,
    trafegoVeiculos: campo('Tráfego de Veículos'),
    trafegoPedestres: campo('Tráfego de Pedestres'),
    residenciais: extrairNumeroOpcionalDiagnostico_(campo('Quantidade de Imóveis Residênciais no Traçado')),
    comerciais: extrairQuantidadeComerciaisDiagnostico_(linha, mapa),
    padraoConstrutivoNivel: campo('Há muitas construções no trecho?'),
    padraoConstrutivoObservado: campo('Padrão ou padrões construtivos predominantemente observados'),
    ipvs: campo('Índice Paulista de Vulnerabilidade Social — IPVS'),
    liderancas: resumirSimNao_(campo('Foram identificadas lideranças no território?')),
    escolas: quantidadeEquipamentoDiagnostico_(
      campo('Quantidade de escolas públicas no traçado'),
      campo('Existem escolas ou equipamentos de educação no entorno?')
    ),
    ubs: quantidadeEquipamentoDiagnostico_(
      campo('Quantidade de UBS no traçado'),
      campo('Existe UBS ou Hospitais no entorno?')
    ),
    ongs: valorPrincipalEquipamento_(
      campo('Centros comunitários, ONGs ou equipamentos identificados'),
      campo('Existem centros comunitários ou ONGs no entorno?')
    ),
    pontosOnibus: campo('Existem pontos de ônibus no traçado?'),
    comunicacao: formatarOportunidadesComunicacao_(campo('Oportunidades de comunicação no local')),
    pontosCriticos: campo('Pontos críticos observados'),
    observacoes: observacoes,
    relato: campo('Relato do Diagnóstico'),
    fotos: diagNovasFotosDiagnostico_(linha,mapa).join(', '),
    responsavel: campo('Colaborador responsável pelo registro'),
    area: campo('Área responsável pelo procedimento'),
    tipoLocal: campo('Tipo do local'),
    tenda: campo('Possíveis locais para instalação de tenda'),
    infraestruturaOcorrencias: juntarInformacoes_([
      campo('Infraestrutura sanitária identificada no diagnóstico'),
      campo('Ocorrências observadas na região')
    ])
  };
}

function sugerirNivelImpacto_(linha, mapa) {
  const campo = function (nome) { return pegarCampo_(linha, mapa, nome); };
  const trafegoVeiculos = campo('Tráfego de Veículos');
  const trafegoPedestres = campo('Tráfego de Pedestres');
  const pontosCriticos = campo('Pontos críticos observados');
  const ocorrencias = campo('Ocorrências observadas na região');
  const via = campo('Condições da via');
  const texto = normalizarTextoDiagnostico_([
    trafegoVeiculos, trafegoPedestres, pontosCriticos, ocorrencias, via
  ].join(' '));

  let pontos = 0;
  if (/alto|grave|risco|resistencia|processo|paralis|interdi|alagamento|acidente|impactara totalmente/.test(texto)) pontos += 3;
  if (/medio|moderado|restricao|dificuldade|estacionamento/.test(texto)) pontos += 1;
  if (!respostaNegativa_(pontosCriticos)) pontos += 2;
  if (!respostaNegativa_(ocorrencias)) pontos += 2;
  if (extrairNumeroDiagnostico_(campo('Quantidade de Imóveis Residênciais no Traçado')) >= 50) pontos += 1;
  if (extrairNumeroDiagnostico_(campo('Quantidade de Imóveis Comerciais no Traçado')) >= 3) pontos += 1;

  return pontos >= 4 ? 'Alto' : pontos >= 2 ? 'Médio' : 'Baixo';
}

function classificarCondicaoPavimento_(linha, mapa) {
  const campo = function (nome) { return pegarCampo_(linha, mapa, nome); };
  const texto = normalizarTextoDiagnostico_([
    campo('Observações sobre a infraestrutura sanitária'),
    campo('Condições da via'),
    campo('Ocorrências observadas na região')
  ].join(' '));

  if (/pessim|ruim|precari|deterior|buraco|afund|danific|intransitavel/.test(texto)) return 'Ruim';

  const sinalDeUso = /regular|moderad|restri|estacionamento|desgast|remendo|antig|bastante tempo|refeit/.test(texto);
  const bomEstado = /bom estado|bem conserv|boa conserv|pavimentad/.test(texto);
  if (sinalDeUso || (bomEstado && /antig|bastante tempo|refeit/.test(texto))) return 'Regular';
  if (bomEstado || /novo|recente|excelente/.test(texto)) return 'Bom';
  return '';
}

function resumirSimNao_(valor) {
  if (respostaNegativa_(valor)) return 'Não';
  const texto = normalizarTextoDiagnostico_(valor);
  if (/^(sim|possui|foram identificad|foi identificad|ha )/.test(texto)) return 'Sim';
  return valorPreenchidoDiagnostico_(valor) ? String(valor).trim() : 'Não';
}

function valorPrincipalEquipamento_(identificado, respostaExistencia) {
  if (valorPreenchidoDiagnostico_(identificado) && !respostaNegativa_(identificado)) {
    return String(identificado).trim();
  }
  if (respostaNegativa_(respostaExistencia)) return 'Não';
  return valorPreenchidoDiagnostico_(respostaExistencia)
    ? String(respostaExistencia).trim()
    : 'Não identificado';
}

function formatarOportunidadesComunicacao_(valor) {
  if (respostaNegativa_(valor)) return 'Não possui oportunidades de comunicação';
  return valorPreenchidoDiagnostico_(valor) ? String(valor).trim() : 'Não identificado';
}

function diagnosticoParaLinha_(d) {
  return [
    d.id, d.data, d.bairro, d.endereco,
    d.frente, d.pvInicio, d.pvFim, d.metodo, d.extensao,
    d.perfil, d.pavimento, d.condicaoPavimento,
    d.impactoSugerido, d.impactoFinal, d.impactos,
    d.trafegoVeiculos, d.trafegoPedestres, d.residenciais, d.comerciais,
    d.padraoConstrutivoNivel, d.padraoConstrutivoObservado, d.ipvs,
    d.liderancas, d.escolas, d.ubs, d.ongs,
    d.pontosOnibus, d.comunicacao, d.pontosCriticos,
    d.observacoes, d.relato, d.fotos,
    d.responsavel, d.area, d.tipoLocal, d.tenda,
    d.infraestruturaOcorrencias
  ];
}

function escreverBaseDiagnosticos_(aba, diagnosticos) {
  const primeiraLinha = CONFIG_DIAGNOSTICO.PRIMEIRA_LINHA_DADOS;
  const linhas = diagnosticos.map(diagnosticoParaLinha_);

  aba.getRange('A1').setValue('DIAGNÓSTICOS DE ÁREA');
  aba.getRange('A2').setValue(
    'Base territorial gerada diretamente a partir da Base Consolidada'
  );
  aba.getRange('A3').setValue(
    'PV início/fim, método construtivo e extensão são dados técnicos da obra, não coletados pelo Social. Se inseridos pela área responsável, serão preservados nas atualizações.'
  );

  const totalResidenciais = diagnosticos.reduce(function (total, d) {
    return total + (Number(d.residenciais) || 0);
  }, 0);
  const totalComerciais = diagnosticos.reduce(function (total, d) {
    return total + (Number(d.comerciais) || 0);
  }, 0);
  const impactoAlto = diagnosticos.filter(function (d) {
    return normalizarTextoDiagnostico_(d.impactoFinal || d.impactoSugerido) === 'alto';
  }).length;
  const ultimo = diagnosticos.reduce(function (maior, d) {
    const data = converterParaDataDiagnostico_(d.data);
    const valor = data ? data.getTime() : 0;
    return valor > maior.valor ? { valor: valor, data: d.data } : maior;
  }, { valor: 0, data: '' }).data;

  const cartoes = [
    ['A5:G5', 'A6:G7', 'DIAGNÓSTICOS', diagnosticos.length],
    ['H5:N5', 'H6:N7', 'IMÓVEIS RESIDENCIAIS', totalResidenciais],
    ['O5:U5', 'O6:U7', 'IMÓVEIS COMERCIAIS', totalComerciais],
    ['V5:AB5', 'V6:AB7', 'IMPACTO ALTO', impactoAlto],
    ['AC5:AK5', 'AC6:AK7', 'ÚLTIMO DIAGNÓSTICO', ultimo]
  ];
  cartoes.forEach(function (cartao) {
    aba.getRange(cartao[0]).merge().setValue(cartao[2]);
    aba.getRange(cartao[1]).merge().setValue(cartao[3]);
  });

  aba.getRange('A9:AK9').merge().setValue(
    'DIAGNÓSTICOS FILTRADOS DA BASE CONSOLIDADA'
  );
  [
    ['A10:D10', 'IDENTIFICAÇÃO'],
    ['E10:I10', 'FRENTE E DADOS TÉCNICOS DA OBRA'],
    ['J10:O10', 'CARACTERIZAÇÃO E IMPACTO'],
    ['P10:V10', 'TERRITÓRIO'],
    ['W10:AC10', 'REDE LOCAL E COMUNICAÇÃO'],
    ['AD10:AK10', 'OBSERVAÇÕES E EVIDÊNCIAS']
  ].forEach(function (grupo) {
    aba.getRange(grupo[0]).merge().setValue(grupo[1]);
  });

  aba.getRange(11, 1, 1, CABECALHOS_DIAGNOSTICO.length).setValues([CABECALHOS_DIAGNOSTICO]);
  if (linhas.length) {
    aba.getRange(primeiraLinha, 1, linhas.length, CABECALHOS_DIAGNOSTICO.length).setValues(linhas);
  }
}

function formatarBaseDiagnosticos_(aba, diagnosticos) {
  const primeiraLinha = CONFIG_DIAGNOSTICO.PRIMEIRA_LINHA_DADOS;
  const quantidade = diagnosticos.length;
  const ultimaLinha = Math.max(primeiraLinha, primeiraLinha + quantidade - 1);

  aba.setHiddenGridlines(true);
  aba.setFrozenRows(11);
  aba.setFrozenColumns(0);
  aba.getRange('A1:AK' + ultimaLinha)
    .setFontFamily('Arial')
    .setFontSize(9)
    .setFontColor('#233247')
    .setVerticalAlignment('top');

  aba.getRange('A1:AK3').setBackground('#123B5D');
  aba.getRange('A1:AK1')
    .setFontSize(22).setFontWeight('bold').setFontColor('#FFFFFF').setVerticalAlignment('middle');
  aba.getRange('A2:AK2')
    .setFontSize(12).setFontColor('#D8EAF5').setVerticalAlignment('middle');
  aba.getRange('A3:AK3')
    .setFontSize(9).setFontStyle('italic').setFontColor('#FFE6A7').setVerticalAlignment('middle');
  aba.setRowHeight(1, 42);
  aba.setRowHeight(2, 25);
  aba.setRowHeight(3, 32);
  aba.setRowHeight(4, 12);

  const coresCartoes = ['#1976A3', '#0B8F87', '#2F6EB3', '#C85C4A', '#D18336'];
  const faixasCartoes = [
    ['A5:G5', 'A6:G7'], ['H5:N5', 'H6:N7'], ['O5:U5', 'O6:U7'],
    ['V5:AB5', 'V6:AB7'], ['AC5:AK5', 'AC6:AK7']
  ];
  faixasCartoes.forEach(function (faixa, indice) {
    aba.getRange(faixa[0])
      .setBackground(coresCartoes[indice]).setFontColor('#FFFFFF').setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    aba.getRange(faixa[1])
      .setBackground('#FFFFFF').setFontColor(coresCartoes[indice]).setFontSize(20).setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle')
      .setBorder(true, true, true, true, false, false, '#CDD8E3', SpreadsheetApp.BorderStyle.SOLID);
  });
  aba.getRange('AC6:AK7').setNumberFormat('dd/MM/yyyy');
  aba.setRowHeight(5, 24);
  aba.setRowHeights(6, 2, 28);
  aba.setRowHeight(8, 12);

  aba.getRange('A9:AK9')
    .setBackground('#DCEAF4').setFontColor('#123B5D').setFontSize(11).setFontWeight('bold')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, false, false, '#AFC6D8', SpreadsheetApp.BorderStyle.SOLID);
  aba.setRowHeight(9, 28);

  const grupos = [
    ['A10:D10', 'A11:D11', '#4B6584', '#E9EEF5'],
    ['E10:I10', 'E11:I11', '#667581', '#EDF1F4'],
    ['J10:O10', 'J11:O11', '#196FA5', '#E4F0F8'],
    ['P10:V10', 'P11:V11', '#178594', '#E3F2F3'],
    ['W10:AC10', 'W11:AC11', '#596AA0', '#EAECF5'],
    ['AD10:AK10', 'AD11:AK11', '#304C6D', '#E7EBF0']
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
  aba.setRowHeight(11, 48);

  if (quantidade) {
    const corpo = aba.getRange(primeiraLinha, 1, quantidade, CABECALHOS_DIAGNOSTICO.length);
    corpo.setFontSize(9).setWrap(true).setVerticalAlignment('top');

    const fundos = [];
    for (let i = 0; i < quantidade; i++) {
      fundos.push(new Array(CABECALHOS_DIAGNOSTICO.length).fill(i % 2 === 0 ? '#FFFFFF' : '#F3F7FA'));
    }
    corpo.setBackgrounds(fundos);
    aba.setRowHeights(primeiraLinha, quantidade, 150);

    aba.getRange('A' + primeiraLinha + ':A' + ultimaLinha)
      .setHorizontalAlignment('center').setVerticalAlignment('middle').setFontWeight('bold').setFontColor('#36566F');
    aba.getRange('B' + primeiraLinha + ':B' + ultimaLinha)
      .setNumberFormat('dd/MM/yyyy').setHorizontalAlignment('center').setVerticalAlignment('middle');
    aba.getRange('R' + primeiraLinha + ':S' + ultimaLinha)
      .setNumberFormat('0').setHorizontalAlignment('center').setVerticalAlignment('middle')
      .setFontWeight('bold').setFontColor('#0D6474');
    aba.getRange('V' + primeiraLinha + ':V' + ultimaLinha)
      .setNumberFormat('0').setHorizontalAlignment('center').setVerticalAlignment('middle');

    aba.getRange('F' + primeiraLinha + ':I' + ultimaLinha)
      .setBackground('#EDF1F4').setFontColor('#55636E');

    aplicarValidacoesDiagnostico_(aba, primeiraLinha, ultimaLinha);
    aplicarRegrasVisuaisDiagnostico_(aba, primeiraLinha, ultimaLinha);
    aba.getRange(11, 1, quantidade + 1, CABECALHOS_DIAGNOSTICO.length).createFilter();
  }

  const larguras = [
    88, 105, 120, 250, 130, 90, 90, 150, 105,
    210, 125, 125, 125, 125, 330,
    110, 110, 95, 95, 135, 170, 85,
    240, 240, 220, 240, 210, 240, 220,
    350, 350, 240, 180, 120, 120, 130, 300
  ];
  larguras.forEach(function (largura, indice) { aba.setColumnWidth(indice + 1, largura); });
}

function aplicarValidacoesDiagnostico_(aba, primeiraLinha, ultimaLinha) {
  const validacaoCondicao = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Ruim', 'Regular', 'Bom'], true)
    .setAllowInvalid(true)
    .build();
  const validacaoNivel = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Baixo', 'Médio', 'Alto'], true)
    .setAllowInvalid(true)
    .build();

  aba.getRange('L' + primeiraLinha + ':L' + ultimaLinha).setDataValidation(validacaoCondicao);
  aba.getRange('N' + primeiraLinha + ':N' + ultimaLinha).setDataValidation(validacaoNivel);
}

function aplicarRegrasVisuaisDiagnostico_(aba, primeiraLinha, ultimaLinha) {
  const impacto = aba.getRange('M' + primeiraLinha + ':N' + ultimaLinha);
  const regras = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Alto').setBackground('#FCE0DC').setFontColor('#A83E31').setBold(true)
      .setRanges([impacto]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Médio').setBackground('#FFF0D6').setFontColor('#A3600B').setBold(true)
      .setRanges([impacto]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Baixo').setBackground('#E1F2E8').setFontColor('#24734C').setBold(true)
      .setRanges([impacto]).build()
  ];
  aba.setConditionalFormatRules(regras);
}

function separarTodasCelulasDiagnostico_(aba) {
  aba.getRange(1, 1, aba.getMaxRows(), aba.getMaxColumns()).breakApart();
}

function prepararAbaDiagnosticos_(aba, quantidade) {
  if (aba.getFilter()) aba.getFilter().remove();
  separarTodasCelulasDiagnostico_(aba);
  aba.clear();
  aba.setConditionalFormatRules([]);

  const linhasNecessarias = Math.max(33, CONFIG_DIAGNOSTICO.PRIMEIRA_LINHA_DADOS + quantidade);
  const colunasNecessarias = CABECALHOS_DIAGNOSTICO.length;
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

function lerComplementosManuais_(aba) {
  const resultado = {};
  if (!aba || aba.getLastRow() < CONFIG_DIAGNOSTICO.PRIMEIRA_LINHA_DADOS) return resultado;

  const ultimaColuna = Math.min(aba.getLastColumn(), CABECALHOS_DIAGNOSTICO.length);
  const cabecalhos = aba.getRange(11, 1, 1, ultimaColuna).getDisplayValues()[0];
  const mapa = montarMapaCabecalhosDiagnostico_(cabecalhos);
  const linhas = aba.getRange(
    CONFIG_DIAGNOSTICO.PRIMEIRA_LINHA_DADOS,
    1,
    aba.getLastRow() - CONFIG_DIAGNOSTICO.PRIMEIRA_LINHA_DADOS + 1,
    ultimaColuna
  ).getValues();

  linhas.forEach(function (linha) {
    const id = linha[mapa[normalizarTextoDiagnostico_('ID')]];
    if (!id) return;
    resultado[id] = {};
    CAMPOS_PRESERVADOS_DIAGNOSTICO.forEach(function (campo) {
      const indice = mapa[normalizarTextoDiagnostico_(campo)];
      if (indice !== undefined) resultado[id][campo] = linha[indice];
    });
  });
  return resultado;
}

function aplicarComplementosManuais_(d, complemento) {
  if (!complemento) return;
  d.pvInicio = valorPreservado_(complemento['PV início'], d.pvInicio);
  d.pvFim = valorPreservado_(complemento['PV fim'], d.pvFim);
  d.metodo = valorPreservado_(complemento['Método construtivo'], d.metodo);
  d.extensao = valorPreservado_(complemento['Extensão'], d.extensao);
  d.condicaoPavimento = valorPreservado_(complemento['Condição do pavimento'], d.condicaoPavimento);
  d.impactoFinal = valorPreservado_(complemento['Nível de impacto final'], d.impactoSugerido);
}

function gerarFichaDaLinhaSelecionada() {
  const arquivo = SpreadsheetApp.getActiveSpreadsheet();
  const aba = arquivo.getActiveSheet();
  const linhaSelecionada = aba.getActiveRange().getRow();

  if (aba.getName() !== CONFIG_DIAGNOSTICO.ABA_BASE || linhaSelecionada < CONFIG_DIAGNOSTICO.PRIMEIRA_LINHA_DADOS) {
    avisarDiagnostico_(
      'Selecione uma célula na linha do diagnóstico desejado, dentro da aba "' +
      CONFIG_DIAGNOSTICO.ABA_BASE + '".',
      'Diagnósticos'
    );
    return;
  }

  const valores = aba.getRange(linhaSelecionada, 1, 1, CABECALHOS_DIAGNOSTICO.length).getValues()[0];
  gerarFichaDiagnostico_(linhaParaDiagnostico_(valores));
}

function gerarFichaMaisRecente() {
  const arquivo = SpreadsheetApp.getActiveSpreadsheet();
  const aba = arquivo.getSheetByName(CONFIG_DIAGNOSTICO.ABA_BASE);
  if (!aba || aba.getLastRow() < CONFIG_DIAGNOSTICO.PRIMEIRA_LINHA_DADOS) {
    avisarDiagnostico_('Não há diagnósticos consolidados. Atualize a base primeiro.', 'Diagnósticos');
    return;
  }
  const valores = aba.getRange(
    aba.getLastRow(), 1, 1, CABECALHOS_DIAGNOSTICO.length
  ).getValues()[0];
  gerarFichaDiagnostico_(linhaParaDiagnostico_(valores));
}

function linhaParaDiagnostico_(linha) {
  const indice = {};
  CABECALHOS_DIAGNOSTICO.forEach(function (cabecalho, posicao) {
    indice[cabecalho] = posicao;
  });
  const valor = function (cabecalho) { return linha[indice[cabecalho]]; };

  return {
    id: valor('ID'), data: valor('Data do diagnóstico'), bairro: valor('Bairro'),
    endereco: valor('Rua/Avenida e numeração'), frente: valor('Frente/CT'),
    pvInicio: valor('PV início'), pvFim: valor('PV fim'), metodo: valor('Método construtivo'),
    extensao: valor('Extensão'), perfil: valor('Perfil socioeconômico'),
    pavimento: valor('Tipo do pavimento'), condicaoPavimento: valor('Condição do pavimento'),
    impactoSugerido: valor('Nível de impacto sugerido'), impactoFinal: valor('Nível de impacto final'),
    impactos: valor('Impactos identificados'), trafegoVeiculos: valor('Tráfego de veículos'),
    trafegoPedestres: valor('Tráfego de pedestres'), residenciais: valor('Imóveis residenciais'),
    comerciais: valor('Imóveis comerciais'), padraoConstrutivoNivel: valor('Padrão construtivo (baixo/médio/alto)'),
    padraoConstrutivoObservado: valor('Padrão construtivo observado'), ipvs: valor('IPVS'),
    liderancas: valor('Lideranças'), escolas: valor('Escolas públicas'), ubs: valor('UBS/Hospitais'),
    ongs: valor('Centros comunitários/ONGs'), pontosOnibus: valor('Pontos de ônibus'),
    comunicacao: valor('Oportunidades de comunicação'), pontosCriticos: valor('Pontos críticos'),
    observacoes: valor('Observações consolidadas'), relato: valor('Relato do diagnóstico'),
    fotos: valor('Fotos'), responsavel: valor('Responsável pelo registro')
  };
}

function gerarFichaDiagnostico_(d, silencioso) {
  const arquivo = SpreadsheetApp.getActiveSpreadsheet();
  let aba = arquivo.getSheetByName(CONFIG_DIAGNOSTICO.ABA_FICHA);
  if (!aba) {
    aba = arquivo.insertSheet(CONFIG_DIAGNOSTICO.ABA_FICHA);
    aba.setTabColor('#304C6D');
  }

  if (aba.getFilter()) aba.getFilter().remove();
  separarTodasCelulasDiagnostico_(aba);
  aba.clear();
  aba.setConditionalFormatRules([]);
  aba.setHiddenGridlines(true);
  aba.setFrozenRows(2);
  aba.setFrozenColumns(0);

  if (aba.getMaxRows() < 36) aba.insertRowsAfter(aba.getMaxRows(), 36 - aba.getMaxRows());
  if (aba.getMaxColumns() < 8) aba.insertColumnsAfter(aba.getMaxColumns(), 8 - aba.getMaxColumns());

  aba.getRange('A1:H36')
    .setFontFamily('Arial').setFontSize(10).setFontColor('#233247')
    .setVerticalAlignment('top').setWrap(true).setBackground('#F7F9FC');

  aba.getRange('A1:H1').merge().setValue('FICHA DE DIAGNÓSTICO LOCAL');
  aba.getRange('A2:H2').merge().setValue(
    valorParaFicha_(d.id, 'Sem identificação') + ' • ' + valorParaFicha_(d.bairro, 'Bairro não informado')
  );
  aba.getRange('A1:H2').setBackground('#123B5D');
  aba.getRange('A1:H1')
    .setFontSize(20).setFontWeight('bold').setFontColor('#FFFFFF')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  aba.getRange('A2:H2')
    .setFontSize(11).setFontColor('#D8EAF5')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  aba.setRowHeight(1, 42);
  aba.setRowHeight(2, 26);
  aba.setRowHeight(3, 10);

  escreverParFicha_(aba, 'A4:B4', 'C4:D4', 'FRENTE/CT', valorParaFicha_(d.frente, 'Não informado'));
  escreverParFicha_(aba, 'E4:E4', 'F4:F4', 'PV INÍCIO', valorTecnicoParaFicha_(d.pvInicio, ''), true);
  escreverParFicha_(aba, 'G4:G4', 'H4:H4', 'PV FIM', valorTecnicoParaFicha_(d.pvFim, ''), true);
  escreverParFicha_(aba, 'A5:B5', 'C5:D5', 'MÉTODO CONSTRUTIVO', valorTecnicoParaFicha_(d.metodo, '-'), true);
  escreverParFicha_(aba, 'E5:F5', 'G5:H5', 'EXTENSÃO', valorTecnicoParaFicha_(d.extensao, ''), true);
  escreverParFicha_(
    aba,
    'A6:B6',
    'C6:H6',
    'RUA/AVENIDA COM Nº (INTERVALO DE NUMERAÇÃO)',
    valorParaFicha_(d.endereco, 'Sem numeração identificável')
  );

  aba.getRange('A8:H8').merge().setValue('INFORMAÇÕES DO ENTORNO DAS OBRAS');
  aba.getRange('A8:H8')
    .setBackground('#196FA5').setFontSize(11).setFontWeight('bold').setFontColor('#FFFFFF')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');

  escreverParFicha_(aba, 'A9:B9', 'C9:H9', 'PERFIL SOCIOECONÔMICO', valorParaFicha_(d.perfil, 'Não informado'));
  escreverParFicha_(aba, 'A10:B10', 'C10:D10', 'TIPO DO PAVIMENTO (SOLO, PARALELEPÍPEDO, ASFALTO, CONCRETO)', valorParaFicha_(d.pavimento, 'Não informado'));
  escreverParFicha_(aba, 'E10:F10', 'G10:H10', 'CONDIÇÃO DO PAVIMENTO (RUIM, REGULAR, BOM)', valorParaFicha_(d.condicaoPavimento, 'Não classificada'));
  escreverParFicha_(aba, 'A11:B11', 'C11:D11', 'NÍVEL DE IMPACTO (BAIXO, MÉDIO, ALTO)', valorParaFicha_(d.impactoFinal, d.impactoSugerido));
  escreverParFicha_(aba, 'E11:F11', 'G11:H11', 'VULNERABILIDADE (IPVS: 1 A 7)', valorParaFicha_(d.ipvs, 'Não informado'));
  escreverParFicha_(aba, 'A12:B12', 'C12:D12', 'TRÁFEGO DE VEÍCULOS', valorParaFicha_(d.trafegoVeiculos, 'Não informado'));
  escreverParFicha_(aba, 'E12:F12', 'G12:H12', 'TRÁFEGO DE PEDESTRES', valorParaFicha_(d.trafegoPedestres, 'Não informado'));
  escreverParFicha_(aba, 'A13:B13', 'C13:D13', 'IMÓVEIS RESIDENCIAIS NO TRAÇADO (TOTAL)', numeroParaFicha_(d.residenciais));
  escreverParFicha_(aba, 'E13:F13', 'G13:H13', 'IMÓVEIS COMERCIAIS NO TRAÇADO (TOTAL)', numeroParaFicha_(d.comerciais));

  escreverParFicha_(
    aba,
    'A14:B14',
    'C14:H14',
    'PADRÃO CONSTRUTIVO PREDOMINANTE (BAIXO, MÉDIO, ALTO)',
    valorParaFicha_(d.padraoConstrutivoNivel, 'Não informado')
  );

  escreverBlocoFicha_(aba, 'A15:B17', 'C15:H17', 'IMPACTOS IDENTIFICADOS', valorParaFicha_(d.impactos, 'Não informado'));
  escreverParFicha_(aba, 'A18:B18', 'C18:H18', 'HOUVE IDENTIFICAÇÃO DE LIDERANÇAS? (SIM/NÃO)', valorParaFicha_(d.liderancas, 'Não'));
  escreverParFicha_(aba, 'A19:B19', 'C19:H19', 'ESCOLAS PÚBLICAS NO ENTORNO (TOTAL)', numeroParaFicha_(d.escolas));
  escreverParFicha_(aba, 'A20:B20', 'C20:H20', 'UBS NO ENTORNO (TOTAL)', numeroParaFicha_(d.ubs));
  escreverParFicha_(aba, 'A21:B21', 'C21:H21', 'CENTROS COMUNITÁRIOS/ONGS NO ENTORNO', valorParaFicha_(d.ongs, 'Não identificados'));
  escreverParFicha_(aba, 'A22:B22', 'C22:H22', 'PONTOS DE ÔNIBUS NO TRAÇADO', valorParaFicha_(d.pontosOnibus, 'Não identificados'));
  escreverParFicha_(aba, 'A23:B23', 'C23:H23', 'OPORTUNIDADES DE COMUNICAÇÃO', valorParaFicha_(d.comunicacao, 'Não identificadas'));
  escreverParFicha_(aba, 'A24:B24', 'C24:H24', 'PONTOS CRÍTICOS', valorParaFicha_(d.pontosCriticos, 'Não identificados'));

  aba.getRange('A25:H25').merge().setValue('RESULTADOS CONSOLIDADOS DA PESQUISA');
  aba.getRange('A25:H25')
    .setBackground('#304C6D').setFontSize(11).setFontWeight('bold').setFontColor('#FFFFFF')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  escreverBlocoFicha_(
    aba,
    'A26:B34',
    'C26:H34',
    'OBSERVAÇÕES\n(INFORMAÇÕES COMPLEMENTARES SOBRE O DIAGNÓSTICO)',
    valorParaFicha_(d.observacoes, d.relato || 'Não informado')
  );
  escreverParFicha_(aba, 'A35:B35', 'C35:H35', 'REGISTRO FOTOGRÁFICO', valorParaFicha_(d.fotos, 'Não informado'));
  escreverParFicha_(aba, 'A36:B36', 'C36:D36', 'RESPONSÁVEL', valorParaFicha_(d.responsavel, 'Não informado'));
  escreverParFicha_(aba, 'E36:F36', 'G36:H36', 'DATA', d.data || 'Não informado');
  aba.getRange('G36:H36').setNumberFormat('dd/MM/yyyy');

  for (let coluna = 1; coluna <= 8; coluna++) aba.setColumnWidth(coluna, 125);
  for (let linha = 4; linha <= 14; linha++) aba.setRowHeight(linha, 34);
  aba.setRowHeight(6, 44);
  aba.setRowHeight(10, 52);
  aba.setRowHeight(11, 44);
  aba.setRowHeight(13, 48);
  aba.setRowHeight(14, 52);
  aba.setRowHeights(15, 3, 32);
  aba.setRowHeights(18, 7, 56);
  aba.setRowHeight(25, 28);
  const tamanhoObservacoes = String(d.observacoes || d.relato || '').length;
  const alturaObservacoes = Math.max(48, Math.min(90, Math.ceil(tamanhoObservacoes / 55)));
  aba.setRowHeights(26, 9, alturaObservacoes);
  aba.setRowHeights(35, 2, 38);

  if (!silencioso) {
    if (aba.isSheetHidden()) aba.showSheet();
    arquivo.setActiveSheet(aba);
    arquivo.toast('Ficha gerada para ' + d.id + '.', 'Ficha atualizada', 4);
  }
}

function escreverParFicha_(aba, faixaRotulo, faixaValor, rotulo, valor, dadoTecnico) {
  aba.getRange(faixaRotulo).merge().setValue(rotulo);
  aba.getRange(faixaValor).merge().setValue(valor);
  aba.getRange(faixaRotulo)
    .setBackground('#DCEAF4').setFontColor('#123B5D').setFontSize(9).setFontWeight('bold')
    .setVerticalAlignment('middle').setWrap(true);
  aba.getRange(faixaValor)
    .setBackground(dadoTecnico ? '#EDF1F4' : '#FFFFFF')
    .setFontColor(dadoTecnico ? '#55636E' : '#233247')
    .setVerticalAlignment('middle').setWrap(true);
  const inicio = faixaRotulo.split(':')[0];
  const fim = faixaValor.split(':').pop();
  aba.getRange(inicio + ':' + fim)
    .setBorder(true, true, true, true, true, true, '#C8D2DC', SpreadsheetApp.BorderStyle.SOLID);
}

function escreverBlocoFicha_(aba, faixaRotulo, faixaValor, rotulo, valor) {
  aba.getRange(faixaRotulo).merge().setValue(rotulo);
  aba.getRange(faixaValor).merge().setValue(valor);
  aba.getRange(faixaRotulo)
    .setBackground('#DCEAF4').setFontColor('#123B5D').setFontSize(9).setFontWeight('bold')
    .setVerticalAlignment('middle').setWrap(true);
  aba.getRange(faixaValor)
    .setBackground('#FFFFFF').setFontColor('#233247').setVerticalAlignment('top').setWrap(true);
  const inicio = faixaRotulo.split(':')[0];
  const fim = faixaValor.split(':').pop();
  aba.getRange(inicio + ':' + fim)
    .setBorder(true, true, true, true, true, true, '#C8D2DC', SpreadsheetApp.BorderStyle.SOLID);
}

function validarCabecalhosDiagnostico_(mapa) {
  const obrigatorios = [
    CONFIG_DIAGNOSTICO.CABECALHO_PROCEDIMENTO,
    CONFIG_DIAGNOSTICO.CABECALHO_ID_MIGRACAO,
    CONFIG_DIAGNOSTICO.CABECALHO_VALIDACAO,
    'Carimbo de data/hora',
    'Data de realização do procedimento',
    'Endereço completo',
    'Relato do Diagnóstico',
    'Colaborador responsável pelo registro'
  ];
  const ausentes = obrigatorios.filter(function (cabecalho) {
    return mapa[normalizarTextoDiagnostico_(cabecalho)] === undefined;
  });
  if (ausentes.length) {
    throw new Error('Campos obrigatórios não encontrados:\n- ' + ausentes.join('\n- '));
  }
}

function montarMapaCabecalhosDiagnostico_(cabecalhos) {
  const mapa = {};
  cabecalhos.forEach(function (cabecalho, indice) {
    mapa[normalizarTextoDiagnostico_(cabecalho)] = indice;
  });
  return mapa;
}

function pegarCampo_(linha, mapa, cabecalho) {
  const indice = mapa[normalizarTextoDiagnostico_(cabecalho)];
  return indice === undefined ? '' : linha[indice];
}

function validacaoConsolidadaAceita_(valor) {
  const normalizado = normalizarTextoDiagnostico_(valor);
  return CONFIG_DIAGNOSTICO.VALIDACOES_ACEITAS.some(function (opcao) {
    return normalizarTextoDiagnostico_(opcao) === normalizado;
  });
}

function construirIdDiagnostico_(idMigracao, numeroLinhaConsolidada) {
  const id = String(idMigracao || '').trim();
  const atual = id.match(/^ATUAL-3\.0-(\d+)$/i);
  if (atual) return 'DIA-' + String(Number(atual[1])).padStart(3, '0');
  if (id) return id;
  return 'DIA-CONS-' + String(numeroLinhaConsolidada).padStart(4, '0');
}

function construirChaveRegistroDiagnostico_(linha, mapa) {
  const idMigracao = pegarCampo_(linha, mapa, CONFIG_DIAGNOSTICO.CABECALHO_ID_MIGRACAO);
  if (valorPreenchidoDiagnostico_(idMigracao)) {
    return 'id|' + normalizarTextoDiagnostico_(idMigracao);
  }

  const campos = [
    'Carimbo de data/hora',
    'Data de realização do procedimento',
    'Colaborador responsável pelo registro',
    'Endereço completo',
    'Intervalo de numeração observado no trecho',
    'Relato do Diagnóstico'
  ];
  return campos.map(function (campo) {
    const valor = pegarCampo_(linha, mapa, campo);
    const data = campo === 'Carimbo de data/hora' || campo === 'Data de realização do procedimento'
      ? converterParaDataDiagnostico_(valor)
      : null;
    return data ? String(data.getTime()) : normalizarTextoDiagnostico_(valor);
  }).join('|');
}

function compararDiagnosticosPorData_(a, b) {
  const dataA = converterParaDataDiagnostico_(a.data);
  const dataB = converterParaDataDiagnostico_(b.data);
  const diferencaData = (dataA ? dataA.getTime() : 0) - (dataB ? dataB.getTime() : 0);
  if (diferencaData) return diferencaData;

  const registroA = converterParaDataDiagnostico_(a.dataHora);
  const registroB = converterParaDataDiagnostico_(b.dataHora);
  const diferencaRegistro = (registroA ? registroA.getTime() : 0) - (registroB ? registroB.getTime() : 0);
  return diferencaRegistro || String(a.id).localeCompare(String(b.id));
}

function converterParaDataDiagnostico_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) return valor;
  if (typeof valor === 'number' && isFinite(valor)) {
    return new Date(Date.UTC(1899, 11, 30) + valor * 86400000);
  }
  const texto = String(valor || '').trim();
  if (!texto) return null;
  const brasileira = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (brasileira) {
    return new Date(
      Number(brasileira[3]),
      Number(brasileira[2]) - 1,
      Number(brasileira[1]),
      Number(brasileira[4] || 0),
      Number(brasileira[5] || 0),
      Number(brasileira[6] || 0)
    );
  }
  const data = new Date(texto);
  return isNaN(data.getTime()) ? null : data;
}

function textoComplementarSemDuplicar_(rotulo, complemento, referencia) {
  if (!valorPreenchidoDiagnostico_(complemento)) return '';
  const textoComplemento = normalizarTextoDiagnostico_(complemento);
  const textoReferencia = normalizarTextoDiagnostico_(referencia);
  if (textoReferencia && textoReferencia.indexOf(textoComplemento) !== -1) return '';
  return rotulo + ': ' + String(complemento).trim();
}

function extrairNumeroOpcionalDiagnostico_(valor) {
  if (!valorPreenchidoDiagnostico_(valor)) return '';
  return extrairNumeroDiagnostico_(valor);
}

function extrairQuantidadeComerciaisDiagnostico_(linha, mapa) {
  const informado = pegarCampo_(linha, mapa, 'Quantidade de Imóveis Comerciais no Traçado');
  if (valorPreenchidoDiagnostico_(informado)) return extrairNumeroDiagnostico_(informado);

  const evidencias = juntarInformacoes_([
    pegarCampo_(linha, mapa, 'Relato do Diagnóstico'),
    pegarCampo_(linha, mapa, 'Observação final do procedimento')
  ]);
  const texto = normalizarTextoDiagnostico_(evidencias);
  const encontrado = texto.match(/(\d+)\s+estabelecimentos?\s+comerciais?/) ||
    texto.match(/(\d+)\s+comercios?/);
  return encontrado ? Number(encontrado[1]) : '';
}

function quantidadeEquipamentoDiagnostico_(quantidade, existencia) {
  if (valorPreenchidoDiagnostico_(quantidade)) return extrairNumeroDiagnostico_(quantidade);
  if (valorPreenchidoDiagnostico_(existencia) && respostaNegativa_(existencia)) return 0;
  return '';
}

function rotularInformacao_(rotulo, valor) {
  return valorPreenchidoDiagnostico_(valor) ? rotulo + ': ' + String(valor).trim() : '';
}

function juntarInformacoes_(valores) {
  return valores
    .filter(valorPreenchidoDiagnostico_)
    .map(function (valor) { return String(valor).trim(); })
    .join('\n');
}

function valorPreenchidoDiagnostico_(valor) {
  return valor !== null && valor !== undefined && String(valor).trim() !== '';
}

function valorParaFicha_(valor, substituto) {
  if (valorPreenchidoDiagnostico_(valor)) return valor;
  return substituto === undefined ? 'PREENCHER' : substituto;
}

function valorTecnicoParaFicha_(valor, substituto) {
  if (
    valorPreenchidoDiagnostico_(valor) &&
    normalizarTextoDiagnostico_(valor) !== 'preencher'
  ) return valor;
  return substituto === undefined ? '' : substituto;
}

function numeroParaFicha_(valor) {
  return valorPreenchidoDiagnostico_(valor)
    ? extrairNumeroDiagnostico_(valor)
    : 'Não informado';
}

function valorPreservado_(valor, padrao) {
  return valorPreenchidoDiagnostico_(valor) ? valor : padrao;
}

function extrairNumeroDiagnostico_(valor) {
  if (typeof valor === 'number') return valor;
  const encontrado = String(valor || '').match(/\d+/);
  return encontrado ? Number(encontrado[0]) : 0;
}

function respostaNegativa_(valor) {
  const texto = normalizarTextoDiagnostico_(valor);
  return !texto || /^(nao|nenhum|nenhuma|sem |nao ha|nao foram|nao foi|nao possui|nao identificado)/.test(texto);
}

function normalizarTextoDiagnostico_(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function ocultarPaginasDiagnostico() {
  const arquivo = SpreadsheetApp.getActiveSpreadsheet();
  const nomes = CONFIG_DIAGNOSTICO.ABAS_DIAGNOSTICO;
  const ativa = arquivo.getActiveSheet();
  const ativaSeraOcultada = ativa && nomes.indexOf(ativa.getName()) !== -1;

  if (ativaSeraOcultada) {
    const alternativa = arquivo.getSheets().find(function (aba) {
      return nomes.indexOf(aba.getName()) === -1 && !aba.isSheetHidden();
    });
    if (!alternativa) {
      avisarDiagnostico_('Não há outra página visível para manter ativa.', 'Diagnósticos');
      return;
    }
    arquivo.setActiveSheet(alternativa);
  }

  let ocultadas = 0;
  nomes.forEach(function (nome) {
    const aba = arquivo.getSheetByName(nome);
    if (aba && !aba.isSheetHidden()) {
      aba.hideSheet();
      ocultadas++;
    }
  });
  avisarDiagnostico_(
    ocultadas ? 'Páginas de diagnóstico ocultadas.' : 'As páginas de diagnóstico já estavam ocultas.',
    'Diagnósticos'
  );
}

function mostrarPaginasDiagnostico() {
  const arquivo = SpreadsheetApp.getActiveSpreadsheet();
  let primeira = null;
  let exibidas = 0;
  CONFIG_DIAGNOSTICO.ABAS_DIAGNOSTICO.forEach(function (nome) {
    const aba = arquivo.getSheetByName(nome);
    if (!aba) return;
    if (!primeira) primeira = aba;
    if (aba.isSheetHidden()) {
      aba.showSheet();
      exibidas++;
    }
  });
  if (primeira) arquivo.setActiveSheet(primeira);
  avisarDiagnostico_(
    exibidas ? 'Páginas de diagnóstico exibidas.' : 'As páginas de diagnóstico já estavam visíveis.',
    'Diagnósticos'
  );
}

function avisarDiagnostico_(mensagem, titulo) {
  const arquivo = SpreadsheetApp.getActiveSpreadsheet();
  try {
    SpreadsheetApp.getUi().alert(String(mensagem));
  } catch (erro) {
    if (arquivo) arquivo.toast(String(mensagem), titulo || 'Diagnósticos', 5);
  }
}

function aoEnviarFormularioDiagnosticos(e) {
  if (typeof sincronizarBaseConsolidada1e3 === 'function') {
    sincronizarBaseConsolidada1e3(e || {origem: 'gatilho'});
    atualizarDiagnosticosDeArea({baseJaSincronizada: true, silencioso: true});
    return;
  }
  avisarDiagnostico_(
    'A integração da Base Consolidada não está instalada. Atualização não executada.',
    'Diagnósticos'
  );
}

function removerAutomacaoDiagnosticos() {
  removerGatilhosDiagnosticos_(true);
}

function removerGatilhosDiagnosticos_(mostrarAviso) {
  const funcoes = ['aoAbrirDiagnosticos', 'aoEnviarFormularioDiagnosticos'];
  ScriptApp.getProjectTriggers().forEach(function (gatilho) {
    if (funcoes.indexOf(gatilho.getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(gatilho);
    }
  });
  if (mostrarAviso) avisarDiagnostico_('Automação de diagnósticos removida.', 'Diagnósticos');
}

function diagNovasFotosDiagnostico_(linha,mapa){
  const ids={},urls=[];
  Object.keys(mapa).filter(k=>/^fotos? do diagnostico(?:$|\s*-)/.test(k)).forEach(k=>{
    (String(linha[mapa[k]]||'').match(/https:\/\/(?:drive|docs)\.google\.com\/[^\s,;]+/g)||[]).forEach(u=>{
      const m=u.match(/(?:[?&]id=|\/d\/)([\w-]+)/);if(m&&!ids[m[1]]){ids[m[1]]=true;urls.push(u.replace(/[)\]]+$/,''));}
    });
  });return urls;
}
