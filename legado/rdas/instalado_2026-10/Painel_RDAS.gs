/**
 * RDAS | VISÃO EXECUTIVA E BANCO DE IMAGENS 1.2
 *
 * Instale este arquivo exclusivamente no Apps Script da planilha RDAS.
 * O visualizador lê somente as fichas diárias já geradas no próprio RDAS.
 * Ele não abre a planilha de Procedimentos de Campo e não cria gatilhos
 * instaláveis. O menu é criado pelo gatilho simples onOpen(e).
 */
const CONFIG_VISUALIZADOR_RDAS = {
  PREFIXO_ABA: 'RDAS ',
  PADRAO_ABA: /^RDAS \d{2}-\d{2}-\d{4}$/,
  VERSAO: 'RDAS • Visão executiva 1.2',
  FUSO_PADRAO: 'America/Sao_Paulo',
  MAX_DIAS_MENU: 31,
  MAX_DIAS_COMPARACAO: 10
};

/**
 * Autoriza os serviços usados pelo visualizador e confirma a estrutura.
 * Não cria, altera ou exclui gatilhos.
 */
function instalarVisualizadorRDAS() {
  const arquivo = SpreadsheetApp.getActiveSpreadsheet();
  if (!arquivo) throw new Error('Abra o Apps Script a partir da planilha RDAS.');
  DriveApp.getFileById(arquivo.getId()).getName();
  criarMenuVisualizadorRDAS_();
  const dias = rdasvListarDias_(arquivo);
  if (!dias.length) {
    throw new Error('Nenhuma aba diária no padrão “RDAS dd-MM-aaaa” foi localizada. Gere primeiro as fichas pelo Procedimentos de Campo.');
  }
  arquivo.toast(
    'Visualizador e Banco de imagens instalados sem criar gatilho adicional. ' + dias.length + ' dia(s) disponível(is).',
    'RDAS',
    8
  );
  return {
    versao: CONFIG_VISUALIZADOR_RDAS.VERSAO,
    gatilhosInstalaveisCriados: 0,
    diasLocalizados: dias.length,
    diaMaisRecente: rdasvFormatarData_(dias[0].data, rdasvFuso_(arquivo))
  };
}

function onOpen(e) {
  criarMenuVisualizadorRDAS_();
}

function criarMenuVisualizadorRDAS_() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('RDAS')
      .addItem('Abrir visão executiva', 'abrirVisaoExecutivaRDAS')
      .addItem('Abrir banco de imagens', 'abrirBancoImagensRDAS')
      .addItem('Enviar fotos e vincular vídeos', 'abrirEnvioFotosRDAS')
      .addSeparator()
      .addItem('Conferir dados disponíveis', 'conferirVisualizadorRDAS')
      .addToUi();
    return true;
  } catch (erro) {
    return false;
  }
}

function abrirVisaoExecutivaRDAS() {
  const dados = rdasvMontarDados_(null);
  const json = JSON.stringify(dados).replace(/</g, '\\u003c');
  const html = '<script>window.RDAS_DADOS_INICIAIS=' + json + ';</script>' + RDAS_EXEC_HTML;
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(1440).setHeight(900),
    'CPT | Visão executiva do RDAS'
  );
}

function obterDadosVisaoExecutivaRDAS(parametros) {
  return rdasvMontarDados_(parametros && parametros.dia ? parametros.dia : null);
}

function obterImagemVisaoExecutivaRDAS(url) {
  const leitura = cptfLer_(url, true);
  return {
    url: url,
    dataUri: 'data:' + leitura.blob.getContentType() + ';base64,' + Utilities.base64Encode(leitura.blob.getBytes()),
    tipo: leitura.tipoMidia,
    metodo: leitura.metodo,
    largura: leitura.largura,
    altura: leitura.altura
  };
}

function conferirVisualizadorRDAS() {
  const arquivo = SpreadsheetApp.getActiveSpreadsheet();
  if (!arquivo) throw new Error('Abra esta função a partir da planilha RDAS.');
  const dias = rdasvListarDias_(arquivo);
  const resultado = {
    versao: CONFIG_VISUALIZADOR_RDAS.VERSAO,
    executadoEm: new Date().toISOString(),
    somenteLeitura: true,
    planilha: arquivo.getName(),
    abasDiariasLocalizadas: dias.length,
    dias: dias.slice(0, CONFIG_VISUALIZADOR_RDAS.MAX_DIAS_COMPARACAO).map(function (item) {
      const resumo = rdasvResumoAba_(item.aba, rdasvFuso_(arquivo));
      return {
        aba: item.nome,
        data: resumo.data,
        execucoes: resumo.execucoes,
        midias: resumo.midias
      };
    }),
    gatilhosDoProjeto: ScriptApp.getProjectTriggers().map(function (gatilho) {
      return gatilho.getHandlerFunction();
    }),
    nota: 'O visualizador não cria gatilhos instaláveis e não altera as fichas.'
  };
  Logger.log(JSON.stringify(resultado, null, 2));
  SpreadsheetApp.getUi().alert(
    'Conferência concluída',
    dias.length + ' aba(s) diária(s) localizada(s). O resultado completo foi gravado no registro de execução.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
  return resultado;
}

function rdasvMontarDados_(chaveSolicitada) {
  const arquivo = SpreadsheetApp.getActiveSpreadsheet();
  if (!arquivo) throw new Error('Abra a Visão executiva a partir da planilha RDAS.');
  const fuso = rdasvFuso_(arquivo);
  const dias = rdasvListarDias_(arquivo);
  if (!dias.length) throw new Error('Nenhuma ficha diária do RDAS foi localizada.');
  const selecionado = dias.filter(function (item) { return item.nome === chaveSolicitada; })[0] || dias[0];
  const dia = rdasvLerDiaCompleto_(arquivo, selecionado.aba, fuso);
  return {
    versao: CONFIG_VISUALIZADOR_RDAS.VERSAO,
    geradoEm: Utilities.formatDate(new Date(), fuso, 'dd/MM/yyyy HH:mm'),
    dias: dias.slice(0, CONFIG_VISUALIZADOR_RDAS.MAX_DIAS_MENU).map(function (item) {
      return {
        chave: item.nome,
        rotulo: rdasvFormatarData_(item.data, fuso) + ' · ' + rdasvDiaSemana_(item.data)
      };
    }),
    dia: dia,
    recentes: dias.slice(0, CONFIG_VISUALIZADOR_RDAS.MAX_DIAS_COMPARACAO).map(function (item) {
      return rdasvResumoAba_(item.aba, fuso);
    })
  };
}

function rdasvListarDias_(arquivo) {
  const fuso = rdasvFuso_(arquivo);
  return arquivo.getSheets().filter(function (aba) {
    return CONFIG_VISUALIZADOR_RDAS.PADRAO_ABA.test(aba.getName());
  }).map(function (aba) {
    let data = rdasvData_(aba.getRange('C5').getValue());
    if (!data) data = rdasvDataDoNome_(aba.getName());
    return { aba: aba, nome: aba.getName(), data: data || new Date(0) };
  }).sort(function (a, b) {
    return b.data.getTime() - a.data.getTime();
  });
}

function rdasvResumoAba_(aba, fuso) {
  const cabecalho = aba.getRange(1, 1, Math.min(25, Math.max(1, aba.getLastRow())), 12).getValues();
  const data = rdasvData_(rdasvValor_(cabecalho, 4, 2)) || rdasvDataDoNome_(aba.getName()) || new Date(0);
  const execucoes = rdasvNumero_(rdasvValor_(cabecalho, 8, 0));
  const externas = rdasvNumero_(rdasvValor_(cabecalho, 8, 4));
  const internas = rdasvNumero_(rdasvValor_(cabecalho, 8, 6));
  const interrupcoes = rdasvNumero_(rdasvValor_(cabecalho, 8, 10));
  const tabela = rdasvLerTabela_(cabecalho);
  const midias = tabela.length
    ? tabela.reduce(function (total, item) { return total + item.midias; }, 0)
    : rdasvContarMidiasNaAba_(aba);
  return {
    chave: aba.getName(),
    data: rdasvFormatarData_(data, fuso),
    execucoes: execucoes,
    externas: externas,
    internas: internas,
    interrupcoes: interrupcoes,
    midias: midias
  };
}

function rdasvLerDiaCompleto_(arquivo, aba, fuso) {
  const ultimaLinha = Math.max(1, aba.getLastRow());
  const valores = aba.getRange(1, 1, ultimaLinha, 12).getValues();
  let ricos = [];
  try {
    ricos = aba.getRange(1, 1, ultimaLinha, 12).getRichTextValues();
  } catch (erro) {
    ricos = [];
  }
  const tabela = rdasvLerTabela_(valores);
  const porId = {};
  tabela.forEach(function (item) { porId[item.id] = item; });
  const relatos = [];
  const titulos = [];
  valores.forEach(function (linha, indice) {
    const correspondencia = String(linha[0] || '').match(/^FICHA\s+\d+\s+DE\s+\d+\s+\|\s*([^|]+?)\s*\|/i);
    if (correspondencia) titulos.push({ linha: indice, id: correspondencia[1].trim() });
  });
  titulos.forEach(function (titulo, indice) {
    const proximo = indice + 1 < titulos.length ? titulos[indice + 1].linha : valores.length;
    relatos.push(rdasvLerFicha_(valores, ricos, titulo.linha, proximo, titulo.id, porId[titulo.id] || {}, fuso));
  });
  tabela.forEach(function (item) {
    if (relatos.some(function (relato) { return relato.id === item.id; })) return;
    relatos.push(rdasvRelatoDaTabela_(item, fuso));
  });

  const data = rdasvData_(rdasvValor_(valores, 4, 2)) || rdasvDataDoNome_(aba.getName()) || new Date(0);
  const totalExecucoes = rdasvNumero_(rdasvValor_(valores, 8, 0)) || tabela.length || relatos.length;
  const participantes = rdasvNumero_(rdasvValor_(valores, 8, 2));
  const externas = rdasvNumero_(rdasvValor_(valores, 8, 4));
  const internas = rdasvNumero_(rdasvValor_(valores, 8, 6));
  const panfletos = rdasvNumero_(rdasvValor_(valores, 8, 8));
  const interrupcoes = rdasvNumero_(rdasvValor_(valores, 8, 10));
  const fotosLocalizadas = relatos.reduce(function (total, relato) { return total + relato.fotos.length; }, 0);
  const midiasInformadas = tabela.reduce(function (total, item) { return total + item.midias; }, 0);
  const deslocamentos = rdasvAgrupar_(relatos, 'deslocamento', false);
  const recursos = rdasvAgrupar_(relatos, 'ferramentas', true);
  const tendaRelatos = relatos.filter(function (relato) {
    return /\btenda\b/i.test([relato.atividade, relato.ferramentas, relato.relato, relato.observacao].join(' '));
  });
  const ocorrencias = relatos.filter(function (relato) {
    return rdasvNormalizar_(relato.interrupcao) === 'sim' || /interrup/i.test(relato.status);
  }).map(function (relato) {
    return { id: relato.id, clima: rdasvExibir_(relato.clima), texto: rdasvTextoOcorrencia_(relato) };
  });

  return {
    chave: aba.getName(),
    data: rdasvFormatarData_(data, fuso),
    diaSemana: rdasvDiaSemana_(data),
    link: 'https://docs.google.com/spreadsheets/d/' + arquivo.getId() + '/edit#gid=' + aba.getSheetId(),
    faixa: rdasvExibir_(rdasvValor_(valores, 5, 8)),
    clima: rdasvExibir_(rdasvValor_(valores, 5, 2)),
    totalExecucoes: totalExecucoes,
    participantes: participantes,
    externas: externas,
    internas: internas,
    panfletos: panfletos,
    interrupcoes: interrupcoes,
    midias: Math.max(fotosLocalizadas, midiasInformadas),
    equipe: rdasvUnicos_(relatos.reduce(function (lista, relato) { return lista.concat(rdasvSeparar_(relato.equipe)); }, [])),
    publicos: rdasvUnicos_(relatos.reduce(function (lista, relato) { return lista.concat(rdasvSeparar_(relato.publico)); }, [])),
    territorios: rdasvUnicos_(relatos.map(function (relato) { return relato.bairro; })),
    deslocamentos: deslocamentos,
    recursos: recursos,
    tenda: { relatos: tendaRelatos.length, ids: tendaRelatos.map(function (relato) { return relato.id; }) },
    ocorrencias: ocorrencias,
    relatos: relatos
  };
}

function rdasvLerTabela_(valores) {
  let cabecalho = -1;
  for (let linha = 0; linha < valores.length; linha++) {
    if (rdasvNormalizar_(rdasvValor_(valores, linha, 0)) === 'id' &&
        rdasvNormalizar_(rdasvValor_(valores, linha, 1)) === 'periodo') {
      cabecalho = linha;
      break;
    }
  }
  if (cabecalho < 0) return [];
  const itens = [];
  for (let linha = cabecalho + 1; linha < valores.length; linha++) {
    const id = String(rdasvValor_(valores, linha, 0) || '').trim();
    if (!id) break;
    itens.push({
      id: id,
      periodo: String(rdasvValor_(valores, linha, 1) || '').trim(),
      horario: String(rdasvValor_(valores, linha, 2) || '').trim(),
      local: String(rdasvValor_(valores, linha, 3) || '').trim(),
      equipe: String(rdasvValor_(valores, linha, 4) || '').trim(),
      atividade: String(rdasvValor_(valores, linha, 5) || '').trim(),
      publico: String(rdasvValor_(valores, linha, 6) || '').trim(),
      participantes: rdasvNumero_(rdasvValor_(valores, linha, 7)),
      clima: String(rdasvValor_(valores, linha, 8) || '').trim(),
      classificacao: String(rdasvValor_(valores, linha, 9) || '').trim(),
      midias: rdasvNumero_(rdasvValor_(valores, linha, 10)),
      status: String(rdasvValor_(valores, linha, 11) || '').trim()
    });
  }
  return itens;
}

function rdasvLerFicha_(valores, ricos, linha, proximaLinha, id, resumo, fuso) {
  const horarioDuracao = String(rdasvValor_(valores, linha + 1, 6) || resumo.horario || '');
  const partesHorario = horarioDuracao.split('|');
  const publicoParticipantes = String(rdasvValor_(valores, linha + 5, 2) || resumo.publico || '');
  const partesPublico = publicoParticipantes.split('|');
  const data = rdasvData_(rdasvValor_(valores, linha + 1, 2));
  const status = String(rdasvValor_(valores, linha + 1, 10) || resumo.status || '').trim();
  return {
    id: id,
    data: data ? rdasvFormatarData_(data, fuso) : '',
    horario: String(partesHorario[0] || resumo.horario || '').trim(),
    duracao: String(partesHorario[1] || '').trim(),
    periodo: resumo.periodo || '',
    atividade: rdasvExibir_(rdasvValor_(valores, linha + 2, 2) || resumo.atividade),
    local: rdasvExibir_(rdasvValor_(valores, linha + 3, 2) || resumo.local),
    bairro: rdasvExibir_(rdasvValor_(valores, linha + 3, 10)),
    equipe: rdasvExibir_(rdasvValor_(valores, linha + 4, 2) || resumo.equipe),
    publico: rdasvExibir_(String(partesPublico[0] || resumo.publico || '').trim()),
    participantes: resumo.participantes !== undefined ? resumo.participantes : rdasvNumero_(partesPublico[1]),
    classificacao: rdasvExibir_(rdasvValor_(valores, linha + 2, 10) || resumo.classificacao),
    clima: rdasvExibir_(rdasvValor_(valores, linha + 5, 8) || resumo.clima),
    deslocamento: rdasvExibir_(rdasvValor_(valores, linha + 6, 2)),
    pessoasVeiculo: rdasvNumero_(rdasvValor_(valores, linha + 6, 8)),
    ferramentas: rdasvExibir_(rdasvValor_(valores, linha + 7, 2)),
    panfletos: rdasvNumero_(rdasvValor_(valores, linha + 7, 10)),
    objetivo: rdasvExibir_(rdasvValor_(valores, linha + 10, 0)),
    relato: rdasvExibir_(rdasvValor_(valores, linha + 15, 0)),
    observacao: rdasvExibir_(rdasvValor_(valores, linha + 24, 0)),
    status: rdasvExibir_(status),
    interrupcao: /interrup/i.test(status) ? 'Sim' : 'Não',
    fotos: rdasvLinksDaFicha_(valores, ricos, linha, proximaLinha)
  };
}

function rdasvRelatoDaTabela_(item, fuso) {
  return {
    id: item.id,
    data: '',
    horario: item.horario,
    duracao: '',
    periodo: item.periodo,
    atividade: rdasvExibir_(item.atividade),
    local: rdasvExibir_(item.local),
    bairro: 'Não informado',
    equipe: rdasvExibir_(item.equipe),
    publico: rdasvExibir_(item.publico),
    participantes: item.participantes,
    classificacao: rdasvExibir_(item.classificacao),
    clima: rdasvExibir_(item.clima),
    deslocamento: 'Não informado',
    pessoasVeiculo: 0,
    ferramentas: 'Não informado',
    panfletos: 0,
    objetivo: 'Não informado',
    relato: 'Não informado',
    observacao: 'Não informado',
    status: rdasvExibir_(item.status),
    interrupcao: /interrup/i.test(item.status) ? 'Sim' : 'Não',
    fotos: []
  };
}

function rdasvLinksDaFicha_(valores, ricos, inicio, fim) {
  const fotos = [];
  const vistos = {};
  for (let linha = inicio; linha < fim; linha++) {
    for (let coluna = 0; coluna < 12; coluna++) {
      const texto = String(rdasvValor_(valores, linha, coluna) || '').trim();
      const links = [];
      const rico = ricos[linha] && ricos[linha][coluna];
      if (rico) {
        try { if (rico.getLinkUrl()) links.push(rico.getLinkUrl()); } catch (erro) {}
        try {
          rico.getRuns().forEach(function (trecho) {
            const link = trecho.getLinkUrl();
            if (link) links.push(link);
          });
        } catch (erro) {}
      }
      (texto.match(/https?:\/\/[^\s,;]+/gi) || []).forEach(function (link) { links.push(link); });
      links.forEach(function (link) {
        const limpo = String(link || '').trim().replace(/[),.;]+$/, '');
        if (!/^https:\/\/(?:drive|docs)\.google\.com\//i.test(limpo) || vistos[limpo]) return;
        vistos[limpo] = true;
        const rotulo = texto.split('|')[0].trim();
        fotos.push({ url: limpo, rotulo: /^(foto|prévia|previa|evidência|evidencia)/i.test(rotulo) ? rotulo : 'Mídia ' + (fotos.length + 1) });
      });
    }
  }
  return fotos;
}

function rdasvAgrupar_(relatos, campo, separar) {
  const mapa = {};
  const ordem = [];
  relatos.forEach(function (relato) {
    const valores = separar ? rdasvSeparar_(relato[campo]) : [relato[campo]];
    rdasvUnicos_(valores).forEach(function (valor) {
      if (rdasvEhAusente_(valor)) return;
      const chave = rdasvNormalizar_(valor);
      if (!mapa[chave]) {
        mapa[chave] = { nome: valor, ids: [] };
        ordem.push(chave);
      }
      if (mapa[chave].ids.indexOf(relato.id) < 0) mapa[chave].ids.push(relato.id);
    });
  });
  return ordem.map(function (chave) {
    return { nome: mapa[chave].nome, relatos: mapa[chave].ids.length, ids: mapa[chave].ids };
  });
}

function rdasvTextoOcorrencia_(relato) {
  const detalhe=String(relato.observacao||'').match(/(?:^|\n)Motivo da interrupção:\s*([\s\S]*)$/);
  if(detalhe&&detalhe[1].trim())return detalhe[1].trim();
  const candidatos = [relato.observacao, relato.relato];
  for (let indice = 0; indice < candidatos.length; indice++) {
    const texto = String(candidatos[indice] || '').replace(/\s+/g, ' ').trim();
    if (rdasvEhAusente_(texto)) continue;
    return texto.length > 360 ? texto.slice(0, 357).replace(/\s+\S*$/, '') + '…' : texto;
  }
  return 'Interrupção registrada sem detalhamento adicional.';
}

function rdasvContarMidiasNaAba_(aba) {
  const ultimaLinha = Math.max(1, aba.getLastRow());
  let ricos = [];
  try { ricos = aba.getRange(1, 1, ultimaLinha, 12).getRichTextValues(); } catch (erro) { return 0; }
  const vistos = {};
  ricos.forEach(function (linha) {
    linha.forEach(function (rico) {
      if (!rico) return;
      const links = [];
      try { if (rico.getLinkUrl()) links.push(rico.getLinkUrl()); } catch (erro) {}
      try { rico.getRuns().forEach(function (trecho) { if (trecho.getLinkUrl()) links.push(trecho.getLinkUrl()); }); } catch (erro) {}
      links.forEach(function (link) {
        if (/^https:\/\/(?:drive|docs)\.google\.com\//i.test(String(link || ''))) vistos[link] = true;
      });
    });
  });
  return Object.keys(vistos).length;
}

function rdasvValor_(matriz, linha, coluna) {
  return matriz[linha] && matriz[linha][coluna] !== undefined ? matriz[linha][coluna] : '';
}

function rdasvFuso_(arquivo) {
  return arquivo.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || CONFIG_VISUALIZADOR_RDAS.FUSO_PADRAO;
}

function rdasvData_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) return new Date(valor.getTime());
  const texto = String(valor || '').trim();
  let partes = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (partes) return new Date(Number(partes[3]), Number(partes[2]) - 1, Number(partes[1]), 12, 0, 0);
  partes = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (partes) return new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]), 12, 0, 0);
  const data = new Date(valor);
  return isNaN(data.getTime()) ? null : data;
}

function rdasvDataDoNome_(nome) {
  const partes = String(nome || '').match(/^RDAS (\d{2})-(\d{2})-(\d{4})$/);
  return partes ? new Date(Number(partes[3]), Number(partes[2]) - 1, Number(partes[1]), 12, 0, 0) : null;
}

function rdasvFormatarData_(data, fuso) {
  return Utilities.formatDate(data, fuso, 'dd/MM/yyyy');
}

function rdasvDiaSemana_(data) {
  return ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][data.getDay()];
}

function rdasvNumero_(valor) {
  if (typeof valor === 'number' && isFinite(valor)) return Math.max(0, Math.round(valor));
  const encontrado = String(valor || '').replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return encontrado ? Math.max(0, Math.round(Number(encontrado[0]))) : 0;
}

function rdasvSeparar_(valor) {
  return String(valor || '').split(/\s*(?:,|;|\n|\|)\s*/).map(function (item) {
    return item.trim();
  }).filter(Boolean);
}

function rdasvUnicos_(valores) {
  const vistos = {};
  const saida = [];
  valores.forEach(function (valor) {
    const limpo = String(valor || '').trim();
    const chave = rdasvNormalizar_(limpo);
    if (!limpo || !chave || rdasvEhAusente_(limpo) || vistos[chave]) return;
    vistos[chave] = true;
    saida.push(limpo);
  });
  return saida;
}

function rdasvNormalizar_(valor) {
  return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function rdasvEhAusente_(valor) {
  const texto = rdasvNormalizar_(valor).replace(/[.]+$/, '');
  return !texto || /^(nao informado|n|nao|n\/a|ni|nenhum|nenhuma|sem observacoes|sem observacao)$/.test(texto);
}

function rdasvExibir_(valor) {
  const texto = String(valor === null || valor === undefined ? '' : valor).trim();
  return rdasvEhAusente_(texto) ? 'Não informado' : texto;
}

/**
 * BANCO DE IMAGENS DO RDAS | 1.0
 *
 * Este módulo é parte do Visualizador Executivo 1.1 e deve permanecer no
 * mesmo projeto da planilha RDAS. Trabalha somente em leitura: não altera
 * fichas, imagens, respostas ou abas da planilha.
 */
const CONFIG_BANCO_IMAGENS_RDAS = {
  VERSAO: 'Banco de imagens RDAS 1.0',
  MAX_ITENS_PACOTE: 10,
  MAX_BYTES_PACOTE: 18 * 1024 * 1024,
  MAX_BYTES_DOWNLOAD_DIRETO: 12 * 1024 * 1024
};

function abrirBancoImagensRDAS() {
  const dados = rdasbMontarDados_({});
  const json = JSON.stringify(dados).replace(/</g, '\\u003c');
  const html = '<script>window.RDAS_BANCO_INICIAL=' + json + ';</script>' + RDAS_BANCO_HTML;
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(1500).setHeight(900),
    'CPT | Banco de imagens do RDAS'
  );
}

function obterDadosBancoImagensRDAS(parametros) {
  return rdasbMontarDados_(parametros || {});
}

function obterImagemBancoImagensRDAS(url) {
  return obterImagemVisaoExecutivaRDAS(url);
}

function prepararDownloadImagemRDAS(parametros) {
  const url = parametros && parametros.url ? parametros.url : '';
  if (!url) throw new Error('A imagem não foi identificada.');
  const ref = cptfReferencia_(url);
  const arquivo = cptfArquivo_(ref);
  const mime = String(arquivo.getMimeType() || 'application/octet-stream');
  const tamanho = Number(arquivo.getSize() || 0);
  const nome = rdasbNomeArquivo_(parametros && parametros.nome, arquivo.getName(), 1);
  if (!/^image\//i.test(mime) || tamanho > CONFIG_BANCO_IMAGENS_RDAS.MAX_BYTES_DOWNLOAD_DIRETO) {
    return {
      modo: 'drive',
      url: rdasbLinkDownloadDrive_(arquivo, ref),
      nome: nome,
      mime: mime,
      bytes: tamanho,
      nota: /^image\//i.test(mime)
        ? 'O original é grande e será baixado diretamente pelo Google Drive.'
        : 'Vídeos e outros arquivos são baixados diretamente pelo Google Drive.'
    };
  }
  const blob = arquivo.getBlob();
  return {
    modo: 'dados',
    dataUri: 'data:' + (blob.getContentType() || mime) + ';base64,' + Utilities.base64Encode(blob.getBytes()),
    nome: nome,
    mime: mime,
    bytes: tamanho
  };
}

function prepararPacoteImagensRDAS(parametros) {
  const itens = parametros && Array.isArray(parametros.itens) ? parametros.itens : [];
  if (!itens.length) throw new Error('Selecione ao menos uma foto para montar o pacote.');
  if (itens.length > CONFIG_BANCO_IMAGENS_RDAS.MAX_ITENS_PACOTE) {
    throw new Error('O pacote aceita até ' + CONFIG_BANCO_IMAGENS_RDAS.MAX_ITENS_PACOTE + ' fotos por vez.');
  }
  const blobs = [];
  const idsVistos = {};
  let totalBytes = 0;
  itens.forEach(function (item, indice) {
    const ref = cptfReferencia_(item && item.url ? item.url : '');
    const arquivo = cptfArquivo_(ref);
    const id = arquivo.getId ? arquivo.getId() : ref.id;
    if (idsVistos[id]) return;
    idsVistos[id] = true;
    const mime = String(arquivo.getMimeType() || '');
    if (!/^image\//i.test(mime)) {
      throw new Error('O item “' + (item.nome || arquivo.getName()) + '” não é uma foto. Vídeos devem ser baixados individualmente.');
    }
    const tamanho = Number(arquivo.getSize() || 0);
    totalBytes += tamanho;
    if (totalBytes > CONFIG_BANCO_IMAGENS_RDAS.MAX_BYTES_PACOTE) {
      throw new Error('As fotos selecionadas ultrapassam 18 MB. Reduza a seleção ou baixe os originais individualmente.');
    }
    const blob = arquivo.getBlob();
    blob.setName(rdasbNomeArquivo_(item.nome, arquivo.getName(), indice + 1));
    blobs.push(blob);
  });
  if (!blobs.length) throw new Error('Nenhuma foto válida permaneceu na seleção.');
  const mes = rdasbMesValido_(parametros && parametros.mes) || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Sao_Paulo', 'yyyy-MM');
  const nomePacote = 'Vitrine_RDAS_' + mes + '.zip';
  const zip = Utilities.zip(blobs, nomePacote);
  return {
    modo: 'dados',
    dataUri: 'data:application/zip;base64,' + Utilities.base64Encode(zip.getBytes()),
    nome: nomePacote,
    arquivos: blobs.length,
    bytesOriginais: totalBytes
  };
}

function rdasbMontarDados_(parametros) {
  const arquivo = SpreadsheetApp.getActiveSpreadsheet();
  if (!arquivo) throw new Error('Abra o Banco de imagens a partir da planilha RDAS.');
  const fuso = rdasvFuso_(arquivo);
  const dias = rdasvListarDias_(arquivo);
  const manuais=cm43Manuais_('');
  if (!dias.length&&!manuais.length) throw new Error('Nenhuma mídia localizada.');
  const mapaMeses = {};
  dias.forEach(function (item) {
    const chave = Utilities.formatDate(item.data, fuso, 'yyyy-MM');
    if (!mapaMeses[chave]) mapaMeses[chave] = [];
    mapaMeses[chave].push(item);
  });
  manuais.forEach(x=>{const m=x.dataIso.slice(0,7);if(!mapaMeses[m])mapaMeses[m]=[];});
  const meses = Object.keys(mapaMeses).sort().reverse();
  const mesAtual = Utilities.formatDate(new Date(), fuso, 'yyyy-MM');
  const solicitado = rdasbMesValido_(parametros && parametros.mes);
  const mesSelecionado = solicitado && mapaMeses[solicitado]
    ? solicitado
    : mapaMeses[mesAtual] ? mesAtual : meses[0];
  const itens = [];
  const vistos = {};
  mapaMeses[mesSelecionado].forEach(function (itemDia) {
    const dia = rdasvLerDiaCompleto_(arquivo, itemDia.aba, fuso);
    dia.relatos.forEach(function (relato) {
      relato.fotos.forEach(function (foto, indice) {
        const url = String(foto.url || '').trim();
        if (!/^https:\/\/(?:drive|docs)\.google\.com\//i.test(url) || vistos[url]) return;
        vistos[url] = true;
        const video = /vídeo|video/i.test(String(foto.rotulo || ''));
        const dataIso = Utilities.formatDate(itemDia.data, fuso, 'yyyy-MM-dd');
        itens.push({
          chave: dataIso + '|' + relato.id + '|' + (indice + 1),
          url: url,
          rotulo: foto.rotulo || (video ? 'Prévia de vídeo' : 'Foto ' + (indice + 1)),
          tipo: video ? 'Vídeo' : 'Foto',
          selecionavel: !video,
          id: relato.id,
          data: dia.data,
          dataIso: dataIso,
          chaveDia: dia.chave,
          linkDia: dia.link,
          bairro: rdasbValorFiltro_(relato.bairro),
          atividade: rdasbValorFiltro_(relato.atividade),
          local: rdasbValorFiltro_(relato.local),
          equipe: rdasbValorFiltro_(relato.equipe),
          classificacao: rdasbValorFiltro_(relato.classificacao),
          relato: rdasbValorFiltro_(relato.relato),
          nomeDownload: rdasbNomeBase_(dataIso + '_' + relato.id + '_' + (video ? 'Video' : 'Foto') + '_' + (indice + 1))
        });
      });
    });
  });
  manuais.filter(x=>x.dataIso.slice(0,7)===mesSelecionado).forEach(x=>itens.push(x));
  itens.sort(function (a, b) {
    if (a.dataIso !== b.dataIso) return a.dataIso < b.dataIso ? 1 : -1;
    if (a.id !== b.id) return a.id.localeCompare(b.id);
    return a.rotulo.localeCompare(b.rotulo);
  });
  const bairros = rdasbUnicosOrdenados_(itens.map(function (item) { return item.bairro; }));
  const atividades = rdasbUnicosOrdenados_(itens.map(function (item) { return item.atividade; }));
  const locais = rdasbUnicosOrdenados_(itens.map(function (item) { return item.local; }));
  const diasFiltro = rdasbUnicosOrdenados_(itens.map(function (item) { return item.data; })).sort(function (a, b) {
    return rdasbDataFiltro_(b) - rdasbDataFiltro_(a);
  });
  return {
    versao: CONFIG_BANCO_IMAGENS_RDAS.VERSAO,
    geradoEm: Utilities.formatDate(new Date(), fuso, 'dd/MM/yyyy HH:mm'),
    mesAtual: mesAtual,
    mesSelecionado: mesSelecionado,
    usandoMesAtual: mesSelecionado === mesAtual,
    meses: meses.map(function (mes) { return { chave: mes, rotulo: rdasbRotuloMes_(mes) }; }),
    filtros: {
      dias: diasFiltro,
      bairros: bairros,
      atividades: atividades,
      locais: locais
    },
    resumo: {
      evidencias: itens.length,
      fotos: itens.filter(function (item) { return item.tipo === 'Foto'; }).length,
      videos: itens.filter(function (item) { return item.tipo === 'Vídeo'; }).length,
      dias: diasFiltro.length,
      bairros: bairros.length,
      atividades: atividades.length,
      frentes: locais.length
    },
    limites: {
      itensPacote: CONFIG_BANCO_IMAGENS_RDAS.MAX_ITENS_PACOTE,
      megabytesPacote: Math.round(CONFIG_BANCO_IMAGENS_RDAS.MAX_BYTES_PACOTE / 1024 / 1024)
    },
    itens: itens
  };
}

function rdasbLinkDownloadDrive_(arquivo, ref) {
  const id = arquivo.getId ? arquivo.getId() : ref.id;
  const chave = arquivo.getResourceKey ? arquivo.getResourceKey() : ref.key;
  return 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(id) +
    (chave ? '&resourcekey=' + encodeURIComponent(chave) : '');
}

function rdasbNomeArquivo_(sugerido, original, indice) {
  const nomeOriginal = String(original || 'imagem').trim();
  const extensao = (nomeOriginal.match(/(\.[A-Za-z0-9]{2,6})$/) || [])[1] || '';
  let base = rdasbNomeBase_(sugerido || nomeOriginal.replace(/\.[^.]+$/, '') || ('imagem_' + indice));
  if (!base) base = 'imagem_' + indice;
  if (extensao && !new RegExp('\\' + extensao + '$', 'i').test(base)) base += extensao.toLowerCase();
  return base.slice(0, 120);
}

function rdasbNomeBase_(valor) {
  return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').replace(/_+/g, '_');
}

function rdasbMesValido_(valor) {
  const texto = String(valor || '').trim();
  return /^\d{4}-\d{2}$/.test(texto) ? texto : '';
}

function rdasbRotuloMes_(mes) {
  const partes = String(mes || '').split('-');
  const nomes = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return nomes[Number(partes[1]) - 1] + ' de ' + partes[0];
}

function rdasbValorFiltro_(valor) {
  const texto = String(valor || '').trim();
  return !texto || /^não informado$/i.test(texto) ? 'Não informado' : texto;
}

function rdasbUnicosOrdenados_(valores) {
  const mapa = {};
  valores.forEach(function (valor) {
    const texto = rdasbValorFiltro_(valor);
    const chave = rdasvNormalizar_(texto);
    if (!mapa[chave]) mapa[chave] = texto;
  });
  return Object.keys(mapa).map(function (chave) { return mapa[chave]; }).sort(function (a, b) {
    return a.localeCompare(b);
  });
}

function rdasbDataFiltro_(valor) {
  const partes = String(valor || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return partes ? new Date(Number(partes[3]), Number(partes[2]) - 1, Number(partes[1])).getTime() : 0;
}

/** Fotos 1.2: valida bytes E pixels antes de inserir na grade. */
const CPTF_CACHE = {};
function cptfReferencia_(valor) {
  const url=String(valor||'').trim().replace(/[),.;]+$/,'');
  if(!/^https:\/\/(?:drive|docs)\.google\.com\//i.test(url))throw new Error('LINK: endereço de arquivo do Google Drive não reconhecido.');
  const m=url.match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{10,})/);
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
    while(i+3<n){if(u(i)!==255){i++;continue;}while(i<n&&u(i)===255)i++;const marker=u(i++);
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
    const endpoint='https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?fields=thumbnailLink&supportsAllDrives=true';
    const meta=UrlFetchApp.fetch(endpoint,{headers:headers,muteHttpExceptions:true});
    if(meta.getResponseCode()!==200)throw new Error('Metadados HTTP '+meta.getResponseCode());
    const link=JSON.parse(meta.getContentText()).thumbnailLink;
    if(!/^https:\/\/(?:[a-z0-9-]+\.)*googleusercontent\.com\//i.test(String(link||'')))throw new Error('Link de miniatura não disponível.');
    // O sufixo de tamanho pode variar no serviço. A resposta sempre é medida.
    const menor=link.replace(/=s\d+(?:-[A-Za-z0-9]+)*(?=$|[?&])/,'=s800');
    const result=receber(menor);result.metodo='Miniatura do Drive validada';return result;
  }catch(e){diagnosticos.push('Miniatura autenticada: '+e.message);}
  // Compatibilidade com projetos em que a consulta REST de metadados não está disponível.
  for(const largura of [800,480]){
    try{const url='https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w'+largura+(key?'&resourcekey='+encodeURIComponent(key):'');const result=receber(url);result.metodo='Miniatura reduzida e validada ('+largura+' px solicitados)';return result;}
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
  if(!ok&&/^image\/(png|jpeg|jpg|gif)$/i.test(mime)&&size<=2000000){try{avaliar(f.getBlob(),'Imagem original');}catch(e){erros.push('Original: '+e.message);}}
  if(!ok&&!preferirMiniatura)miniatura();
  if(!ok){try{ok=cptfMiniaturaMenor_(f,ref,erros);if(ok)metodo=ok.metodo;}catch(e){erros.push('Miniatura reduzida: '+e.message);}}
  if(!ok)throw new Error('IMAGEM: nenhuma prévia compatível com 2 MB e 1 milhão de pixels. Original: '+mime+', '+size+' bytes. '+erros.join(' | '));
  const r={id:ref.id,url:ref.url,blob:ok.blob,metodo:metodo,mimeOriginal:mime,bytesOriginais:size,bytesImagem:ok.bytes,largura:ok.dim.largura,altura:ok.dim.altura,pixels:ok.dim.largura*ok.dim.altura,tipoMidia:/^video\//.test(mime)?'Vídeo':/^image\//.test(mime)?'Foto':'Arquivo'};
  CPTF_CACHE[cacheKey]=r;return r;
}
function cptfEncaixar_(largura,altura,areaLargura,areaAltura,margem) {
  if(!(largura>0&&altura>0&&areaLargura>0&&areaAltura>0))throw new Error('Dimensões inválidas para encaixe da imagem.');
  const pad=margem===undefined?12:margem,k=Math.min(1,(areaLargura-2*pad)/largura,(areaAltura-2*pad)/altura);
  const w=Math.max(1,Math.floor(largura*k)),h=Math.max(1,Math.floor(altura*k));
  return {largura:w,altura:h,x:Math.max(pad,Math.floor((areaLargura-w)/2)),y:Math.max(pad,Math.floor((areaAltura-h)/2))};
}
function cptfInserirNaArea_(s,blob,linha,coluna,linhas,colunas,titulo,descricao){
  let w=0,h=0,img=null;for(let c=coluna;c<coluna+colunas;c++)w+=s.getColumnWidth(c);for(let r=linha;r<linha+linhas;r++)h+=s.getRowHeight(r);
  try{
    img=s.insertImage(blob,coluna,linha);const fit=cptfEncaixar_(img.getWidth(),img.getHeight(),w,h,12);
    let col=coluna,row=linha,x=fit.x,y=fit.y;
    while(col<coluna+colunas-1&&x>=s.getColumnWidth(col)){x-=s.getColumnWidth(col);col++;}
    while(row<linha+linhas-1&&y>=s.getRowHeight(row)){y-=s.getRowHeight(row);row++;}
    img.setWidth(fit.largura).setHeight(fit.altura).setAnchorCell(s.getRange(row,col)).setAnchorCellXOffset(x).setAnchorCellYOffset(y).setAltTextTitle(titulo).setAltTextDescription(descricao||'');
    return fit;
  }catch(e){if(img){try{img.remove();}catch(ignore){}}throw e;}
}

const RDAS_EXEC_HTML = "<div id=\"rdas-app\" class=\"app\">\n  <aside class=\"sidebar\">\n    <div class=\"brand\"><strong>CPT</strong><span>Relatos socioambientais</span><small>Visão executiva RDAS</small></div>\n    <nav id=\"nav\" aria-label=\"Seções da visão executiva\">\n      <button class=\"nav-item active\" data-view=\"geral\"><span class=\"nav-icon\">01</span><span>Visão geral</span></button>\n      <button class=\"nav-item\" data-view=\"operacao\"><span class=\"nav-icon\">02</span><span>Operação</span></button>\n      <button class=\"nav-item\" data-view=\"relatos\"><span class=\"nav-icon\">03</span><span>Relatos do dia</span></button>\n      <button class=\"nav-item\" data-view=\"galeria\"><span class=\"nav-icon\">04</span><span>Galeria</span></button>\n      <button class=\"nav-item\" data-view=\"recentes\"><span class=\"nav-icon\">05</span><span>Dias recentes</span></button>\n    </nav>\n    <div class=\"sidebar-foot\"><span class=\"status-dot\"></span><span id=\"versao\"></span></div>\n  </aside>\n  <main class=\"main\">\n    <header class=\"topbar\">\n      <div><p class=\"eyebrow\">GESTÃO SOCIOAMBIENTAL</p><h1 id=\"view-title\">Visão geral</h1><p id=\"view-subtitle\" class=\"subtitle\"></p></div>\n      <div class=\"controls\">\n        <label><span>Dia do RDAS</span><select id=\"dia-select\"></select></label>\n        <label><span>Tamanho da janela</span><select id=\"size-select\"><option value=\"1000,650\">Compacto</option><option value=\"1200,750\">Confortável</option><option value=\"1440,900\" selected>Amplo</option></select></label>\n        <button id=\"refresh\" class=\"outline\">Atualizar visão</button>\n      </div>\n    </header>\n    <div id=\"loading\" class=\"loading hidden\"><span></span>Atualizando a leitura do dia…</div>\n    <section id=\"content\" class=\"content\" aria-live=\"polite\"></section>\n  </main>\n</div>\n<div id=\"lightbox\" class=\"lightbox hidden\" role=\"dialog\" aria-modal=\"true\" aria-label=\"Visualização ampliada da evidência\">\n  <button id=\"lightbox-close\" aria-label=\"Fechar imagem\">×</button><img id=\"lightbox-img\" alt=\"\"><p id=\"lightbox-caption\"></p>\n</div>\n\n<style>\n  :root{--navy:#101f30;--navy2:#17364e;--petrol:#0b8f9c;--lime:#adf25d;--ink:#102338;--muted:#61758a;--line:#d9e3ec;--soft:#f1f6fa;--white:#fff;--blue:#2879b8;--green:#0b9b82;--purple:#7061b6;--orange:#df8c32;--red:#c6524a;--shadow:0 10px 28px rgba(16,31,48,.08)}\n  *{box-sizing:border-box}html,body{margin:0;background:#eef4f8;color:var(--ink);font-family:Arial,sans-serif}.app{min-height:100vh;display:grid;grid-template-columns:214px minmax(0,1fr)}\n  .sidebar{background:var(--navy);color:#fff;padding:30px 18px 18px;display:flex;flex-direction:column;min-height:100vh}.brand{padding:0 10px 26px;border-bottom:1px solid rgba(255,255,255,.1)}.brand strong{display:block;color:var(--lime);font-size:34px;letter-spacing:4px}.brand span{display:block;font-size:14px;margin-top:7px}.brand small{display:block;color:#9fc0d3;margin-top:5px;font-size:11px}\n  nav{padding-top:22px;display:grid;gap:7px}.nav-item{width:100%;border:0;background:transparent;color:#dceaf3;border-radius:9px;padding:12px 11px;display:flex;gap:11px;align-items:center;text-align:left;font-size:14px;cursor:pointer}.nav-item:hover{background:rgba(255,255,255,.07)}.nav-item.active{background:#294c62;color:#fff;box-shadow:inset 3px 0 var(--lime)}.nav-icon{display:grid;place-items:center;width:25px;height:25px;border:1px solid rgba(255,255,255,.18);border-radius:6px;font-size:9px;color:#9ec1d5}.nav-item.active .nav-icon{color:var(--lime);border-color:rgba(173,242,93,.5)}\n  .sidebar-foot{margin-top:auto;padding:16px 10px 2px;color:#9fb7c7;font-size:11px;display:flex;align-items:center;gap:8px}.status-dot{width:8px;height:8px;border-radius:50%;background:var(--lime);box-shadow:0 0 0 4px rgba(173,242,93,.12)}\n  .main{min-width:0;padding:28px 30px 36px}.topbar{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}.eyebrow{margin:0 0 5px;color:var(--petrol);font-size:10px;font-weight:700;letter-spacing:1.7px}.topbar h1{font-size:28px;margin:0;letter-spacing:-.5px}.subtitle{margin:7px 0 0;color:var(--muted);font-size:13px}.controls{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;justify-content:flex-end}.controls label{display:grid;gap:5px}.controls label span{font-size:10px;color:var(--muted);font-weight:700}.controls select,.outline{height:39px;border:1px solid #cbd9e5;background:#fff;color:var(--ink);border-radius:8px;padding:0 11px;font:12px Arial}.outline{cursor:pointer;font-weight:700}.outline:hover{border-color:var(--petrol);color:var(--petrol)}\n  .content{margin-top:26px}.loading{position:fixed;z-index:20;top:20px;left:50%;transform:translateX(-50%);background:#fff;border:1px solid var(--line);border-radius:999px;padding:10px 16px;box-shadow:var(--shadow);font-size:12px;color:var(--muted);display:flex;align-items:center;gap:9px}.loading span{width:14px;height:14px;border:2px solid #d7e5ed;border-top-color:var(--petrol);border-radius:50%;animation:spin .8s linear infinite}.hidden{display:none!important}@keyframes spin{to{transform:rotate(360deg)}}\n  .kpis{display:grid;grid-template-columns:repeat(6,minmax(120px,1fr));gap:12px}.kpi{background:#fff;border:1px solid var(--line);border-top:4px solid var(--accent);border-radius:11px;padding:15px 13px 13px;min-height:115px;box-shadow:0 3px 12px rgba(16,31,48,.035);text-align:center}.kpi .label{display:block;color:#526a80;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase}.kpi strong{display:block;font-size:32px;line-height:1;margin:13px 0 8px;color:var(--accent)}.kpi small{font-size:10px;line-height:1.35;color:var(--muted)}\n  .grid{display:grid;gap:16px;margin-top:16px}.grid.two{grid-template-columns:minmax(0,1.45fr) minmax(300px,.8fr)}.grid.equal{grid-template-columns:repeat(2,minmax(0,1fr))}.card{background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);overflow:hidden}.card-head{padding:16px 18px 13px;border-bottom:1px solid #e8eef3;display:flex;justify-content:space-between;gap:12px;align-items:center}.card-head h2{font-size:16px;margin:0}.card-head p{margin:4px 0 0;color:var(--muted);font-size:11px}.card-body{padding:17px 18px}.badge{display:inline-flex;align-items:center;border-radius:999px;background:#e7f7f5;color:#08786f;padding:5px 9px;font-size:10px;font-weight:700;white-space:nowrap}.badge.red{background:#fff0ed;color:#a64039}.badge.blue{background:#eaf3fb;color:#276997}.badge.purple{background:#f0edfa;color:#62529e}\n  .head-actions{display:flex;align-items:center;gap:8px}.native-link{border:1px solid #cbd9e5;border-radius:7px;color:#1f668f;text-decoration:none;font-size:10px;font-weight:700;padding:6px 9px;white-space:nowrap}.native-link:hover{border-color:var(--petrol);color:var(--petrol)}\n  .quick-list{display:grid;gap:12px}.quick-report{display:grid;grid-template-columns:116px minmax(0,1fr);gap:14px;padding-bottom:12px;border-bottom:1px solid #edf1f4}.quick-report:last-child{border:0;padding-bottom:0}.quick-photo{height:84px;border-radius:8px;background:linear-gradient(135deg,#dfeaf1,#f7fafc);overflow:hidden;display:grid;place-items:center;color:#7b8fa1;font-size:10px}.quick-photo img{width:100%;height:100%;object-fit:contain;background:#eaf0f4}.quick-report h3{font-size:13px;margin:1px 0 5px;line-height:1.3}.meta{font-size:10px;color:var(--muted);margin:0 0 6px}.excerpt{font-size:11px;line-height:1.45;color:#395066;margin:0}.text-link{border:0;background:none;color:#087d87;padding:0;font:700 10px Arial;cursor:pointer;margin-top:7px}.text-link:hover{text-decoration:underline}\n  .distribution{display:flex;gap:15px;align-items:center}.donut{--pct:50;flex:0 0 112px;width:112px;height:112px;border-radius:50%;background:conic-gradient(var(--blue) calc(var(--pct)*1%),var(--purple) 0);position:relative}.donut:after{content:\"\";position:absolute;inset:20px;border-radius:50%;background:#fff}.donut-label{position:absolute;inset:0;z-index:1;display:grid;place-content:center;text-align:center;font-size:10px;color:var(--muted)}.donut-label strong{font-size:22px;color:var(--ink)}.legend{display:grid;gap:9px;font-size:11px}.legend span{display:flex;align-items:center;gap:7px}.swatch{width:9px;height:9px;border-radius:3px}.fact-list{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.fact{background:var(--soft);border-radius:9px;padding:12px}.fact span{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.8px;font-weight:700}.fact strong{display:block;margin-top:6px;font-size:12px;line-height:1.35}.section-title{margin:0 0 13px;font-size:18px}.section-note{margin:-7px 0 18px;color:var(--muted);font-size:11px}\n  .report-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.report-card{background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);overflow:hidden}.report-accent{height:4px;background:var(--accent)}.report-pad{padding:17px}.report-top{display:flex;justify-content:space-between;gap:12px}.report-card h2{font-size:15px;line-height:1.35;margin:0}.report-card .where{margin:7px 0 0;color:var(--muted);font-size:11px}.chips{display:flex;gap:6px;flex-wrap:wrap;margin:13px 0}.chip{background:#f0f5f8;color:#425d73;border-radius:999px;padding:5px 8px;font-size:9px}.narrative{border-left:3px solid var(--petrol);padding-left:12px;margin-top:14px}.narrative label{display:block;color:#087b83;font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;margin-bottom:5px}.narrative p{font-size:12px;line-height:1.55;margin:0;color:#293f53;white-space:pre-line}.mini-strip{display:flex;gap:8px;margin-top:14px;overflow:hidden}.mini-strip .media{height:72px;flex:0 0 104px}.media{position:relative;background:#e8eff4;border-radius:8px;overflow:hidden;display:grid;place-items:center;color:#718599;font-size:10px}.media img{width:100%;height:100%;object-fit:contain;background:#e8eff4}.media .media-label{position:absolute;left:6px;bottom:5px;background:rgba(16,31,48,.78);color:#fff;padding:3px 5px;border-radius:4px;font-size:8px}\n  .gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.gallery-card{background:#fff;border:1px solid var(--line);border-radius:11px;overflow:hidden;box-shadow:var(--shadow)}.gallery-card .media{height:210px;border-radius:0}.gallery-copy{padding:12px}.gallery-copy strong{font-size:11px;display:block}.gallery-copy span{font-size:10px;color:var(--muted);display:block;margin-top:4px;line-height:1.35}.media-button{border:0;padding:0;cursor:zoom-in;width:100%}\n  .metric-groups{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.group-list{display:grid;gap:9px}.group-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;background:#f5f8fa;border-radius:8px;padding:10px}.group-row strong{font-size:11px}.group-row span{font-size:10px;color:var(--muted)}.group-count{font-size:19px!important;color:var(--petrol)!important;font-weight:700;text-align:center;min-width:28px}.occurrence{border-left:4px solid var(--red);background:#fff7f5;border-radius:7px;padding:12px;margin-bottom:10px}.occurrence:last-child{margin-bottom:0}.occurrence strong{font-size:11px}.occurrence span{font-size:9px;color:#9b514b;margin-left:7px}.occurrence p{font-size:11px;line-height:1.5;margin:7px 0 0;color:#5d4140}\n  table{width:100%;border-collapse:collapse}th{text-align:left;background:var(--navy);color:#fff;padding:11px;font-size:10px}td{padding:11px;border-bottom:1px solid #e7edf2;font-size:11px}td.num,th.num{text-align:center}.bar-cell{width:190px}.bar{height:8px;background:#e3ecf2;border-radius:999px;overflow:hidden}.bar i{display:block;height:100%;background:var(--petrol);border-radius:inherit}.day-button{border:0;background:none;color:#087d87;font:700 11px Arial;cursor:pointer;padding:0}.day-button:hover{text-decoration:underline}.empty{padding:45px 20px;text-align:center;color:var(--muted);font-size:12px}\n  .lightbox{position:fixed;z-index:100;inset:0;background:rgba(7,18,29,.91);display:grid;place-items:center;padding:50px}.lightbox img{max-width:min(94vw,1400px);max-height:78vh;object-fit:contain}.lightbox p{position:absolute;bottom:17px;color:#d9e6ef;font-size:11px}.lightbox button{position:absolute;right:24px;top:16px;border:0;background:transparent;color:#fff;font-size:34px;cursor:pointer}\n  @media(max-width:1180px){.kpis{grid-template-columns:repeat(3,1fr)}.metric-groups{grid-template-columns:1fr}.gallery{grid-template-columns:repeat(2,1fr)}}\n  @media(max-width:850px){.app{grid-template-columns:1fr}.sidebar{min-height:auto;padding:16px}.brand{display:none}nav{padding:0;display:flex;overflow:auto}.nav-item{min-width:max-content}.sidebar-foot{display:none}.main{padding:20px}.topbar{display:block}.controls{justify-content:flex-start;margin-top:15px}.grid.two,.grid.equal,.report-grid{grid-template-columns:1fr}.gallery{grid-template-columns:1fr}.kpis{grid-template-columns:repeat(2,1fr)}}\n</style>\n\n<script>\n(function(){\n  'use strict';\n  var state={data:window.RDAS_DADOS_INICIAIS,view:'geral',imageCache:{},imageLoading:{}};\n  var titles={geral:['Visão geral','Leitura rápida do dia, relatos e evidências'],operacao:['Operação','Recursos, deslocamentos e condições registradas'],relatos:['Relatos do dia','Narrativas originais organizadas para leitura'],galeria:['Galeria','Evidências visuais incorporadas ao RDAS'],recentes:['Dias recentes','Comparação dos registros mais recentes']};\n  var colors=['#2879b8','#0b9b82','#7061b6','#df8c32','#c6524a'];\n  var el=function(id){return document.getElementById(id);};\n  function esc(v){return String(v===null||v===undefined?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c];});}\n  function truncate(v,n){v=String(v||'');return v.length>n?v.slice(0,n-1).replace(/\\s+\\S*$/,'')+'…':v;}\n  function showLoading(on){el('loading').classList.toggle('hidden',!on);}\n  function apiData(day){return new Promise(function(resolve,reject){google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).obterDadosVisaoExecutivaRDAS({dia:day});});}\n  function apiImage(url){return new Promise(function(resolve,reject){google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).obterImagemVisaoExecutivaRDAS(url);});}\n  function initSelectors(){var s=el('dia-select');s.innerHTML=state.data.dias.map(function(d){return '<option value=\"'+esc(d.chave)+'\"'+(d.chave===state.data.dia.chave?' selected':'')+'>'+esc(d.rotulo)+'</option>';}).join('');el('versao').textContent=state.data.versao;}\n  function setView(view){state.view=view;document.querySelectorAll('.nav-item').forEach(function(b){b.classList.toggle('active',b.dataset.view===view);});el('view-title').textContent=titles[view][0];el('view-subtitle').textContent=titles[view][1]+' · '+state.data.dia.data;render();}\n  function kpi(label,value,note,color){return '<article class=\"kpi\" style=\"--accent:'+color+'\"><span class=\"label\">'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(note)+'</small></article>';}\n  function badge(text,kind){return '<span class=\"badge '+(kind||'')+'\">'+esc(text)+'</span>';}\n  function media(item,caption,klass){var key=encodeURIComponent(item.url);return '<button class=\"media media-button '+(klass||'')+'\" data-media=\"'+esc(item.url)+'\" data-caption=\"'+esc(caption)+'\" aria-label=\"Ampliar '+esc(item.rotulo)+'\"><span>Carregando prévia…</span><span class=\"media-label\">'+esc(item.rotulo)+'</span></button>';}\n  function hydrateImages(){var queue=[].slice.call(document.querySelectorAll('[data-media]')).filter(function(n){return !n.dataset.started;});var active=0;function next(){while(active<2&&queue.length){(function(n){var url=n.dataset.media,label=n.querySelector('.media-label')?n.querySelector('.media-label').textContent:'Evidência';n.dataset.started='1';active++;loadImage(url).then(function(src){n.innerHTML='<img alt=\"\"><span class=\"media-label\">'+esc(label)+'</span>';n.querySelector('img').src=src;n.querySelector('img').alt=n.dataset.caption||'Evidência de campo';}).catch(function(){n.innerHTML='<span>Prévia indisponível<br>O original permanece vinculado à ficha</span>';}).finally(function(){active--;next();});})(queue.shift());}}next();}\n  function loadImage(url){if(state.imageCache[url])return Promise.resolve(state.imageCache[url]);if(state.imageLoading[url])return state.imageLoading[url];state.imageLoading[url]=apiImage(url).then(function(r){state.imageCache[url]=r.dataUri;delete state.imageLoading[url];return r.dataUri;},function(e){delete state.imageLoading[url];throw e;});return state.imageLoading[url];}\n  function baseKpis(d){return '<div class=\"kpis\">'+kpi('Execuções',d.totalExecucoes,d.data,colors[0])+kpi('Pessoas',d.participantes,'participantes informados',colors[1])+kpi('Externas',d.externas,'atividades de campo',colors[0])+kpi('Internas',d.internas,'atividades internas',colors[2])+kpi('Interrupções',d.interrupcoes,'relatos com registro',colors[4])+kpi('Mídias',d.midias,'fotos e prévias',colors[3])+'</div>';}\n  function renderGeral(){var d=state.data.dia,rel=d.relatos.slice(0,3);var quick=rel.map(function(r){var photo=r.fotos[0]?media(r.fotos[0],r.id+' · '+r.atividade,'quick-photo'):'<div class=\"quick-photo\">Sem mídia</div>';return '<article class=\"quick-report\">'+photo+'<div><h3>'+esc(r.atividade)+'</h3><p class=\"meta\">'+esc(r.id+' · '+r.horario+' · '+r.equipe)+'</p><p class=\"excerpt\">'+esc(truncate(r.relato,190))+'</p><button class=\"text-link\" data-open-report=\"'+esc(r.id)+'\">Ver relato completo</button></div></article>';}).join('');var pct=d.totalExecucoes?Math.round(d.externas/d.totalExecucoes*100):0;return baseKpis(d)+'<div class=\"grid two\"><article class=\"card\"><div class=\"card-head\"><div><h2>Resumo executivo diário</h2><p>Relatos originais e primeiras evidências do dia</p></div><div class=\"head-actions\">'+badge(d.relatos.length+' relatos','blue')+'<a class=\"native-link\" href=\"'+esc(d.link)+'\" target=\"_blank\" rel=\"noopener\">Ficha nativa ↗</a></div></div><div class=\"card-body quick-list\">'+quick+'</div></article><div class=\"grid\" style=\"margin-top:0\"><article class=\"card\"><div class=\"card-head\"><div><h2>Perfil das execuções</h2><p>Distribuição declarada no formulário</p></div></div><div class=\"card-body distribution\"><div class=\"donut\" style=\"--pct:'+pct+'\"><div class=\"donut-label\"><strong>'+pct+'%</strong>externas</div></div><div class=\"legend\"><span><i class=\"swatch\" style=\"background:'+colors[0]+'\"></i>'+d.externas+' externas</span><span><i class=\"swatch\" style=\"background:'+colors[2]+'\"></i>'+d.internas+' internas</span></div></div></article><article class=\"card\"><div class=\"card-head\"><div><h2>Contexto do dia</h2><p>Informações registradas pela equipe</p></div></div><div class=\"card-body fact-list\"><div class=\"fact\"><span>Faixa de atuação</span><strong>'+esc(d.faixa)+'</strong></div><div class=\"fact\"><span>Clima</span><strong>'+esc(d.clima)+'</strong></div><div class=\"fact\"><span>Territórios</span><strong>'+esc(d.territorios.join(' · ')||'Não informado')+'</strong></div><div class=\"fact\"><span>Equipe citada</span><strong>'+esc(d.equipe.length+' colaboradores')+'</strong></div></div></article></div></div>';\n  }\n  function groupCard(title,note,items){return '<article class=\"card\"><div class=\"card-head\"><div><h2>'+esc(title)+'</h2><p>'+esc(note)+'</p></div></div><div class=\"card-body group-list\">'+(items.length?items.map(function(x){return '<div class=\"group-row\"><div><strong>'+esc(x.nome)+'</strong><span>'+esc(x.ids.join(' · '))+'</span></div><span class=\"group-count\">'+x.relatos+'</span></div>';}).join(''):'<div class=\"empty\">Sem informação registrada neste dia.</div>')+'</div></article>';}\n  function renderOperacao(){var d=state.data.dia;var occ=d.ocorrencias.map(function(x){return '<div class=\"occurrence\"><strong>'+esc(x.id)+'</strong><span>'+esc(x.clima)+'</span><p>'+esc(x.texto)+'</p></div>';}).join('');var tenda=d.tenda.relatos?[{nome:'Tenda mencionada nos relatos',relatos:d.tenda.relatos,ids:d.tenda.ids}]:[];return baseKpis(d)+'<div class=\"metric-groups\" style=\"margin-top:16px\">'+groupCard('Deslocamentos','Quantidade de relatos que mencionou cada meio; não representa número de veículos.',d.deslocamentos)+groupCard('Recursos e materiais','Quantidade de relatos em que cada recurso foi registrado.',d.recursos)+groupCard('Apoio de tenda','Menções localizadas nas atividades, materiais ou narrativas.',tenda)+'</div><div class=\"grid equal\"><article class=\"card\"><div class=\"card-head\"><div><h2>Condições e ocorrências</h2><p>Registros associados às interrupções declaradas</p></div>'+badge(d.interrupcoes+' interrupções','red')+'</div><div class=\"card-body\">'+(occ||'<div class=\"empty\">Nenhuma interrupção declarada neste dia.</div>')+'</div></article><article class=\"card\"><div class=\"card-head\"><div><h2>Alcance e território</h2><p>Leitura consolidada dos campos preenchidos</p></div></div><div class=\"card-body fact-list\"><div class=\"fact\"><span>Públicos</span><strong>'+esc(d.publicos.join(' · ')||'Não informado')+'</strong></div><div class=\"fact\"><span>Participantes</span><strong>'+esc(d.participantes+' informados')+'</strong></div><div class=\"fact\"><span>Territórios</span><strong>'+esc(d.territorios.join(' · ')||'Não informado')+'</strong></div><div class=\"fact\"><span>Panfletos</span><strong>'+esc(d.panfletos+' registrados')+'</strong></div></div></article></div>';\n  }\n  function reportCard(r,i){var photos=r.fotos.slice(0,3).map(function(p){return media(p,r.id+' · '+r.atividade,'');}).join('');return '<article class=\"report-card\" id=\"report-'+esc(r.id)+'\" style=\"--accent:'+colors[i%colors.length]+'\"><div class=\"report-accent\"></div><div class=\"report-pad\"><div class=\"report-top\"><div><h2>'+esc(r.atividade)+'</h2><p class=\"where\">'+esc(r.id+' · '+r.local+' · '+r.bairro)+'</p></div>'+badge(r.classificacao,r.interrupcao.toLowerCase()==='sim'?'red':'blue')+'</div><div class=\"chips\"><span class=\"chip\">'+esc(r.horario+' · '+r.duracao)+'</span><span class=\"chip\">'+esc(r.equipe)+'</span><span class=\"chip\">'+esc(r.clima)+'</span><span class=\"chip\">'+esc(r.participantes+' participantes')+'</span></div><div class=\"narrative\"><label>Objetivo</label><p>'+esc(r.objetivo)+'</p></div><div class=\"narrative\"><label>Relato da equipe</label><p>'+esc(r.relato)+'</p></div><div class=\"narrative\"><label>Observações e resultados</label><p>'+esc(r.observacao)+'</p></div>'+(photos?'<div class=\"mini-strip\">'+photos+'</div>':'')+'</div></article>';}\n  function renderRelatos(){var r=state.data.dia.relatos;return '<h2 class=\"section-title\">'+r.length+' relatos registrados</h2><p class=\"section-note\">Textos preservados conforme a origem; organização visual para consulta.</p><div class=\"report-grid\">'+r.map(reportCard).join('')+'</div>';}\n  function renderGaleria(){var d=state.data.dia,items=[];d.relatos.forEach(function(r){r.fotos.forEach(function(p){items.push({p:p,r:r});});});return '<h2 class=\"section-title\">'+items.length+' evidências vinculadas</h2><p class=\"section-note\">Clique em uma miniatura para ampliar. A imagem mantém sua proporção e o original segue vinculado à ficha.</p>'+(items.length?'<div class=\"gallery\">'+items.map(function(x){return '<article class=\"gallery-card\">'+media(x.p,x.r.id+' · '+x.r.atividade,'')+'<div class=\"gallery-copy\"><strong>'+esc(x.r.id+' · '+x.p.rotulo)+'</strong><span>'+esc(x.r.atividade)+'</span><span>'+esc(x.r.local)+'</span></div></article>';}).join('')+'</div>':'<div class=\"card empty\">Nenhuma mídia vinculada neste dia.</div>');}\n  function renderRecentes(){var data=state.data.recentes,max=Math.max.apply(null,data.map(function(x){return x.execucoes;} ).concat([1]));return '<article class=\"card\"><div class=\"card-head\"><div><h2>Produção recente do RDAS</h2><p>Volume por data, com acesso direto à leitura executiva</p></div></div><div class=\"card-body\" style=\"padding:0;overflow:auto\"><table><thead><tr><th>Data</th><th>Volume</th><th class=\"num\">Execuções</th><th class=\"num\">Externas</th><th class=\"num\">Internas</th><th class=\"num\">Interrupções</th><th class=\"num\">Mídias</th></tr></thead><tbody>'+data.map(function(x){return '<tr><td><button class=\"day-button\" data-day=\"'+esc(x.chave)+'\">'+esc(x.data)+'</button></td><td class=\"bar-cell\"><div class=\"bar\"><i style=\"width:'+Math.round(x.execucoes/max*100)+'%\"></i></div></td><td class=\"num\">'+x.execucoes+'</td><td class=\"num\">'+x.externas+'</td><td class=\"num\">'+x.internas+'</td><td class=\"num\">'+x.interrupcoes+'</td><td class=\"num\">'+x.midias+'</td></tr>';}).join('')+'</tbody></table></div></article>';}\n  function render(){var html=state.view==='geral'?renderGeral():state.view==='operacao'?renderOperacao():state.view==='relatos'?renderRelatos():state.view==='galeria'?renderGaleria():renderRecentes();el('content').innerHTML=html;bindDynamic();hydrateImages();}\n  function bindDynamic(){document.querySelectorAll('[data-open-report]').forEach(function(b){b.onclick=function(){setView('relatos');setTimeout(function(){var n=el('report-'+b.dataset.openReport);if(n)n.scrollIntoView({behavior:'smooth',block:'start'});},30);};});document.querySelectorAll('[data-day]').forEach(function(b){b.onclick=function(){loadDay(b.dataset.day);};});document.querySelectorAll('[data-media]').forEach(function(b){b.onclick=function(){loadImage(b.dataset.media).then(function(src){el('lightbox-img').src=src;el('lightbox-img').alt=b.dataset.caption||'Evidência de campo';el('lightbox-caption').textContent=b.dataset.caption||'';el('lightbox').classList.remove('hidden');});};});}\n  function loadDay(day){showLoading(true);apiData(day).then(function(data){state.data=data;initSelectors();setView(state.view);}).catch(function(e){alert('Não foi possível atualizar a visão: '+(e.message||e));}).finally(function(){showLoading(false);});}\n  document.querySelectorAll('.nav-item').forEach(function(b){b.onclick=function(){setView(b.dataset.view);};});\n  el('dia-select').onchange=function(){loadDay(this.value);};el('refresh').onclick=function(){loadDay(el('dia-select').value);};\n  el('size-select').onchange=function(){var p=this.value.split(',');if(window.google&&google.script&&google.script.host){google.script.host.setWidth(Number(p[0]));google.script.host.setHeight(Number(p[1]));}};\n  el('lightbox-close').onclick=function(){el('lightbox').classList.add('hidden');};el('lightbox').onclick=function(e){if(e.target===this)this.classList.add('hidden');};document.addEventListener('keydown',function(e){if(e.key==='Escape')el('lightbox').classList.add('hidden');});\n  initSelectors();setView('geral');\n})();\n</script>\n";

const RDAS_BANCO_HTML = "<div class=\"app\">\n  <aside class=\"sidebar\">\n    <div class=\"brand\">\n      <strong>CPT</strong>\n      <span>Banco de imagens</span>\n      <small>Curadoria mensal do RDAS</small>\n    </div>\n\n    <section class=\"side-section\">\n      <p class=\"side-label\">PERÍODO EM ANÁLISE</p>\n      <strong id=\"side-month\" class=\"side-value\"></strong>\n      <span id=\"side-updated\" class=\"side-note\"></span>\n    </section>\n\n    <section class=\"side-section selection-panel\">\n      <p class=\"side-label\">SELEÇÃO PARA VITRINE</p>\n      <div class=\"selection-number\"><strong id=\"selected-count\">0</strong><span>fotos</span></div>\n      <button id=\"download-selected\" class=\"button lime\" disabled>Baixar seleção em ZIP</button>\n      <button id=\"clear-selected\" class=\"button ghost\" disabled>Limpar seleção</button>\n      <p id=\"selection-limit\" class=\"side-note\"></p>\n    </section>\n\n    <section class=\"side-section guide\">\n      <p class=\"side-label\">LEITURA DOS CARDS</p>\n      <p><i class=\"dot photo\"></i> Foto disponível para curadoria</p>\n      <p><i class=\"dot video\"></i> Prévia de vídeo vinculada</p>\n      <p><i class=\"dot chosen\"></i> Evidência selecionada</p>\n    </section>\n\n    <div class=\"side-footer\"><i></i><span id=\"version\"></span></div>\n  </aside>\n\n  <main class=\"main\">\n    <header class=\"topbar\">\n      <div>\n        <p class=\"eyebrow\">MEMÓRIA VISUAL DO PROJETO</p>\n        <h1>Banco de imagens do RDAS</h1>\n        <p class=\"subtitle\">Fotos organizadas pela atividade de campo, prontas para seleção e uso no relatório.</p>\n      </div>\n      <div class=\"month-control\">\n        <label for=\"month-filter\">Mês de referência</label>\n        <div class=\"month-actions\">\n          <select id=\"month-filter\"></select>\n          <button id=\"refresh\" class=\"button outline\">Atualizar acervo</button>\n        </div>\n      </div>\n    </header>\n\n    <section id=\"month-note\" class=\"month-note hidden\"></section>\n\n    <section class=\"metrics\" aria-label=\"Resumo do acervo\">\n      <article class=\"metric blue\"><span>Evidências localizadas</span><strong id=\"metric-media\">0</strong><small>fotos e prévias vinculadas</small></article>\n      <article class=\"metric green\"><span>Fotos disponíveis</span><strong id=\"metric-photos\">0</strong><small>selecionáveis para o relatório</small></article>\n      <article class=\"metric purple\"><span>Atividades representadas</span><strong id=\"metric-activities\">0</strong><small>tipos de execução no período</small></article>\n      <article class=\"metric orange\"><span>Frentes e locais</span><strong id=\"metric-fronts\">0</strong><small>territórios presentes no acervo</small></article>\n    </section>\n\n    <section class=\"filter-card\">\n      <div class=\"filter-title\">\n        <div><h2>Explorar acervo</h2><p>Os filtros atuam juntos e mantêm o contexto de cada evidência.</p></div>\n        <button id=\"clear-filters\" class=\"text-button\">Restaurar visão do mês</button>\n      </div>\n      <div class=\"filters\">\n        <label><span>Dia</span><select id=\"day-filter\"></select></label>\n        <label><span>Bairro</span><select id=\"neighborhood-filter\"></select></label>\n        <label class=\"activity-filter\"><span>Atividade</span><select id=\"activity-filter\"></select></label>\n        <label><span>Tipo de mídia</span><select id=\"type-filter\"><option value=\"\">Todas</option><option value=\"Foto\">Fotos</option><option value=\"Vídeo\">Vídeos</option></select></label>\n        <label class=\"search-filter\"><span>Busca livre</span><input id=\"search-filter\" type=\"search\" placeholder=\"Frente, endereço, equipe ou código\"></label>\n      </div>\n    </section>\n\n    <section class=\"results-head\">\n      <div><h2 id=\"results-title\">Acervo do mês</h2><p id=\"results-context\"></p></div>\n      <div class=\"view-info\"><strong id=\"visible-count\">0</strong><span>resultados</span></div>\n    </section>\n\n    <section id=\"gallery\" class=\"gallery\" aria-live=\"polite\"></section>\n\n    <nav id=\"pagination\" class=\"pagination\" aria-label=\"Páginas do acervo\">\n      <button id=\"previous-page\" class=\"button outline\">Anterior</button>\n      <span id=\"page-info\"></span>\n      <button id=\"next-page\" class=\"button outline\">Próxima</button>\n    </nav>\n  </main>\n</div>\n\n<div id=\"loading\" class=\"loading hidden\"><span></span><strong>Organizando o acervo…</strong></div>\n<div id=\"toast\" class=\"toast hidden\"></div>\n\n<div id=\"lightbox\" class=\"lightbox hidden\" role=\"dialog\" aria-modal=\"true\" aria-label=\"Evidência ampliada\">\n  <button id=\"close-lightbox\" class=\"lightbox-close\" aria-label=\"Fechar\">×</button>\n  <div class=\"lightbox-content\">\n    <div class=\"lightbox-image\"><img id=\"lightbox-image\" alt=\"\"></div>\n    <div class=\"lightbox-copy\">\n      <span id=\"lightbox-badge\" class=\"media-badge\"></span>\n      <h2 id=\"lightbox-title\"></h2>\n      <p id=\"lightbox-meta\"></p>\n      <p id=\"lightbox-text\"></p>\n      <div class=\"lightbox-actions\">\n        <button id=\"lightbox-download\" class=\"button primary\">Baixar original</button>\n        <a id=\"lightbox-sheet\" class=\"button outline\" target=\"_blank\" rel=\"noopener\">Abrir ficha do dia</a>\n      </div>\n    </div>\n  </div>\n</div>\n\n<style>\n  :root{--navy:#101f30;--navy2:#18374c;--petrol:#0b8f9c;--lime:#adf25d;--ink:#11263b;--muted:#617489;--line:#d9e3eb;--soft:#eff5f8;--white:#fff;--blue:#2879b8;--green:#0b9b82;--purple:#7061b6;--orange:#d9852e;--red:#c6524a;--shadow:0 10px 28px rgba(16,31,48,.08)}\n  *{box-sizing:border-box}html,body{margin:0;background:#eef4f8;color:var(--ink);font-family:Arial,sans-serif}.hidden{display:none!important}.app{min-height:100vh;display:grid;grid-template-columns:230px minmax(0,1fr)}\n  .sidebar{position:sticky;top:0;height:100vh;background:var(--navy);color:#fff;padding:28px 19px 18px;display:flex;flex-direction:column}.brand{padding:0 10px 24px;border-bottom:1px solid rgba(255,255,255,.11)}.brand strong{display:block;color:var(--lime);font-size:34px;letter-spacing:4px}.brand span{display:block;font-size:15px;margin-top:7px}.brand small{display:block;color:#9fc0d3;margin-top:5px;font-size:11px}\n  .side-section{padding:21px 10px;border-bottom:1px solid rgba(255,255,255,.1)}.side-label{margin:0 0 9px;color:#90adbf;font-size:9px;font-weight:700;letter-spacing:1.4px}.side-value{display:block;font-size:16px;line-height:1.35}.side-note{display:block;margin-top:7px;color:#9fb7c7;font-size:10px;line-height:1.45}.selection-number{display:flex;align-items:baseline;gap:7px;margin:5px 0 15px}.selection-number strong{font-size:35px;color:var(--lime)}.selection-number span{font-size:12px;color:#bad0dd}.side-section .button{width:100%;margin-top:7px}.guide p:not(.side-label){margin:8px 0;color:#bad0dd;font-size:10px;display:flex;gap:8px;align-items:center}.dot{width:8px;height:8px;border-radius:50%;display:inline-block}.dot.photo{background:var(--petrol)}.dot.video{background:var(--purple)}.dot.chosen{background:var(--lime)}.side-footer{margin-top:auto;color:#8ca9ba;font-size:9px;display:flex;gap:7px;align-items:center;padding:10px}.side-footer i{width:7px;height:7px;background:var(--lime);border-radius:50%;box-shadow:0 0 0 4px rgba(173,242,93,.11)}\n  .main{min-width:0;padding:27px 30px 40px}.topbar{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}.eyebrow{margin:0 0 5px;color:var(--petrol);font-size:10px;font-weight:700;letter-spacing:1.6px}.topbar h1{font-size:28px;letter-spacing:-.5px;margin:0}.subtitle{margin:7px 0 0;color:var(--muted);font-size:12px}.month-control{display:grid;gap:6px;min-width:310px}.month-control>label,.filters label span{color:#536b80;font-size:9px;font-weight:700;letter-spacing:.7px;text-transform:uppercase}.month-actions{display:flex;gap:8px}.month-actions select{flex:1}\n  select,input{height:39px;border:1px solid #cbd8e3;border-radius:8px;background:#fff;color:var(--ink);padding:0 10px;font:11px Arial;outline:none}select:focus,input:focus{border-color:var(--petrol);box-shadow:0 0 0 3px rgba(11,143,156,.09)}.button{min-height:37px;border:0;border-radius:8px;padding:0 12px;font:700 10px Arial;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap}.button:disabled{opacity:.42;cursor:not-allowed}.button.primary{background:var(--petrol);color:#fff}.button.lime{background:var(--lime);color:#13283a}.button.ghost{background:rgba(255,255,255,.08);color:#d6e6ef;border:1px solid rgba(255,255,255,.12)}.button.outline{background:#fff;color:#2b617d;border:1px solid #cbd8e3}.button.outline:hover{border-color:var(--petrol);color:var(--petrol)}\n  .month-note{margin-top:18px;padding:11px 14px;border:1px solid #f0dcae;border-left:4px solid var(--orange);background:#fffaf0;border-radius:8px;color:#70552b;font-size:11px}.metrics{margin-top:24px;display:grid;grid-template-columns:repeat(4,minmax(140px,1fr));gap:13px}.metric{background:#fff;border:1px solid var(--line);border-top:4px solid var(--accent);border-radius:11px;padding:14px 15px;min-height:108px;box-shadow:0 3px 12px rgba(16,31,48,.035);text-align:center}.metric.blue{--accent:var(--blue)}.metric.green{--accent:var(--green)}.metric.purple{--accent:var(--purple)}.metric.orange{--accent:var(--orange)}.metric span{display:block;color:#526a80;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.9px}.metric strong{display:block;color:var(--accent);font-size:30px;margin:11px 0 7px}.metric small{color:var(--muted);font-size:9px}\n  .filter-card{margin-top:15px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 17px;box-shadow:var(--shadow)}.filter-title{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.filter-title h2,.results-head h2{font-size:15px;margin:0}.filter-title p,.results-head p{font-size:10px;color:var(--muted);margin:4px 0 0}.text-button{border:0;background:transparent;color:#087f88;font:700 10px Arial;cursor:pointer;padding:4px}.text-button:hover{text-decoration:underline}.filters{margin-top:14px;display:grid;grid-template-columns:150px 190px minmax(230px,1.3fr) 145px minmax(210px,1fr);gap:10px}.filters label{display:grid;gap:5px}.filters select,.filters input{width:100%}\n  .results-head{display:flex;justify-content:space-between;align-items:flex-end;margin:23px 1px 12px}.view-info{display:flex;align-items:baseline;gap:5px;color:var(--muted)}.view-info strong{font-size:20px;color:var(--petrol)}.view-info span{font-size:10px}.gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.media-card{position:relative;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);overflow:hidden;transition:transform .18s,border-color .18s,box-shadow .18s}.media-card:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(16,31,48,.12)}.media-card.selected{border-color:#83c834;box-shadow:0 0 0 3px rgba(173,242,93,.28),var(--shadow)}.media-card.selected:before{content:'SELECIONADA';position:absolute;z-index:4;right:9px;top:9px;background:var(--lime);color:#173044;border-radius:999px;padding:5px 8px;font-size:8px;font-weight:700;letter-spacing:.6px}\n  .media-frame{height:210px;background:#e8eff4;position:relative;display:grid;place-items:center;overflow:hidden}.media-frame img{width:100%;height:100%;object-fit:contain;background:#e8eff4}.media-frame .placeholder{font-size:10px;color:#718599;text-align:center;line-height:1.5}.media-frame button{position:absolute;inset:0;width:100%;height:100%;border:0;background:transparent;cursor:zoom-in}.media-badge{position:absolute;left:10px;top:10px;z-index:3;background:rgba(16,31,48,.84);color:#fff;border-radius:999px;padding:5px 8px;font-size:8px;font-weight:700}.media-badge.video{background:rgba(91,72,157,.9)}.card-copy{padding:13px 14px 14px}.card-kicker{font-size:9px;font-weight:700;color:var(--petrol);letter-spacing:.5px;margin:0 0 6px}.card-copy h3{font-size:13px;line-height:1.35;margin:0;min-height:35px}.card-place{font-size:10px;color:var(--muted);line-height:1.4;margin:6px 0 0;min-height:28px}.card-report{font-size:10px;color:#3c5266;line-height:1.45;margin:9px 0 0;min-height:43px}.card-team{font-size:9px;color:#7a8b9b;margin:8px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.card-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px}.card-actions .select-button{grid-column:1/-1;background:#edf8f6;color:#087970}.card-actions .select-button.active{background:var(--lime);color:#173044}.card-actions .select-button.video-action{background:#f0edfa;color:#62529e;cursor:default}.card-actions .button{min-height:34px;font-size:9px}\n  .empty{grid-column:1/-1;background:#fff;border:1px dashed #c8d5df;border-radius:12px;text-align:center;padding:58px 20px;color:var(--muted)}.empty strong{display:block;color:var(--ink);font-size:15px;margin-bottom:6px}.empty span{font-size:11px}.pagination{display:flex;justify-content:center;align-items:center;gap:14px;margin-top:22px}.pagination span{font-size:10px;color:var(--muted)}.pagination .button{min-width:82px}\n  .loading{position:fixed;z-index:100;inset:0;background:rgba(238,244,248,.84);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;gap:11px;color:var(--ink);font-size:12px}.loading span{width:22px;height:22px;border:3px solid #cfe0e8;border-top-color:var(--petrol);border-radius:50%;animation:spin .75s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.toast{position:fixed;z-index:150;right:25px;bottom:24px;max-width:390px;background:var(--navy);color:#fff;border-radius:10px;padding:12px 15px;box-shadow:0 12px 35px rgba(0,0,0,.24);font-size:11px;line-height:1.45}.toast.error{background:#8f3e39}\n  .lightbox{position:fixed;z-index:120;inset:0;background:rgba(6,16,26,.92);display:grid;place-items:center;padding:42px}.lightbox-close{position:absolute;right:23px;top:14px;background:transparent;color:#fff;border:0;font-size:34px;cursor:pointer}.lightbox-content{width:min(1250px,94vw);max-height:86vh;display:grid;grid-template-columns:minmax(0,1.65fr) minmax(310px,.75fr);background:#fff;border-radius:14px;overflow:hidden}.lightbox-image{min-height:540px;background:#0d1925;display:grid;place-items:center}.lightbox-image img{width:100%;height:100%;max-height:86vh;object-fit:contain}.lightbox-copy{position:relative;padding:34px 29px;overflow:auto}.lightbox-copy .media-badge{position:static;display:inline-block}.lightbox-copy h2{font-size:21px;line-height:1.35;margin:15px 0 8px}.lightbox-copy>p{font-size:11px;line-height:1.55;color:var(--muted)}.lightbox-copy #lightbox-text{color:#30485d;font-size:12px;margin-top:20px}.lightbox-actions{display:flex;gap:8px;margin-top:23px;flex-wrap:wrap}.lightbox-actions .button{min-height:39px}\n  @media(max-width:1250px){.filters{grid-template-columns:repeat(3,minmax(170px,1fr))}.search-filter{grid-column:2/4}.gallery{grid-template-columns:repeat(2,minmax(0,1fr))}.metrics{grid-template-columns:repeat(2,1fr)}}\n  @media(max-width:850px){.app{grid-template-columns:1fr}.sidebar{position:static;height:auto}.guide{display:none}.main{padding:20px}.topbar{display:block}.month-control{margin-top:16px}.filters{grid-template-columns:1fr}.search-filter{grid-column:auto}.gallery{grid-template-columns:1fr}.lightbox{padding:15px}.lightbox-content{grid-template-columns:1fr;overflow:auto}.lightbox-image{min-height:300px}.metrics{grid-template-columns:repeat(2,1fr)}}\n</style>\n\n<script>\n(function(){\n  'use strict';\n  var state={data:window.RDAS_BANCO_INICIAL,page:1,pageSize:18,selected:{},imageCache:{},imageLoading:{},current:null};\n  var el=function(id){return document.getElementById(id);};\n  function esc(value){return String(value===null||value===undefined?'':value).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c];});}\n  function norm(value){return String(value||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/\\s+/g,' ').trim();}\n  function short(value,size){value=String(value||'');return value.length>size?value.slice(0,size-1).replace(/\\s+\\S*$/,'')+'…':value;}\n  function apiData(month){return new Promise(function(resolve,reject){google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).obterDadosBancoImagensRDAS({mes:month});});}\n  function apiImage(url){return new Promise(function(resolve,reject){google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).obterImagemBancoImagensRDAS(url);});}\n  function apiDownload(item){return new Promise(function(resolve,reject){google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).prepararDownloadImagemRDAS({url:item.url,nome:item.nomeDownload});});}\n  function apiPackage(items){return new Promise(function(resolve,reject){google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).prepararPacoteImagensRDAS({mes:state.data.mesSelecionado,itens:items.map(function(item){return {url:item.url,nome:item.nomeDownload};})});});}\n  function setBusy(on){el('loading').classList.toggle('hidden',!on);}\n  var toastTimer=null;function toast(message,error){clearTimeout(toastTimer);var node=el('toast');node.textContent=message;node.classList.toggle('error',!!error);node.classList.remove('hidden');toastTimer=setTimeout(function(){node.classList.add('hidden');},5000);}\n  function options(values,allLabel){return '<option value=\"\">'+esc(allLabel)+'</option>'+values.map(function(value){return '<option value=\"'+esc(value)+'\">'+esc(value)+'</option>';}).join('');}\n  function setupData(){var d=state.data;el('version').textContent=d.versao;el('side-updated').textContent='Atualizado em '+d.geradoEm;el('side-month').textContent=(d.meses.find(function(m){return m.chave===d.mesSelecionado;})||{}).rotulo||d.mesSelecionado;el('selection-limit').textContent='Pacotes com até '+d.limites.itensPacote+' fotos e '+d.limites.megabytesPacote+' MB.';\n    el('month-filter').innerHTML=d.meses.map(function(m){return '<option value=\"'+esc(m.chave)+'\"'+(m.chave===d.mesSelecionado?' selected':'')+'>'+esc(m.rotulo)+'</option>';}).join('');\n    el('day-filter').innerHTML=options(d.filtros.dias,'Todos os dias');el('neighborhood-filter').innerHTML=options(d.filtros.bairros,'Todos os bairros');el('activity-filter').innerHTML=options(d.filtros.atividades,'Todas as atividades');el('type-filter').value='';el('search-filter').value='';\n    el('metric-media').textContent=d.resumo.evidencias;el('metric-photos').textContent=d.resumo.fotos;el('metric-activities').textContent=d.resumo.atividades;el('metric-fronts').textContent=d.resumo.frentes;\n    el('month-note').classList.toggle('hidden',d.usandoMesAtual);if(!d.usandoMesAtual)el('month-note').textContent='Ainda não há fichas no mês vigente. O acervo mais recente disponível foi aberto automaticamente.';\n    state.page=1;renderSelection();render();\n  }\n  function filtered(){var day=el('day-filter').value,neighborhood=el('neighborhood-filter').value,activity=el('activity-filter').value,type=el('type-filter').value,query=norm(el('search-filter').value);return state.data.itens.filter(function(item){if(day&&item.data!==day)return false;if(neighborhood&&item.bairro!==neighborhood)return false;if(activity&&item.atividade!==activity)return false;if(type&&item.tipo!==type)return false;if(query&&!norm([item.id,item.data,item.bairro,item.atividade,item.local,item.equipe,item.relato].join(' ')).includes(query))return false;return true;});}\n  function card(item){var selected=!!state.selected[item.url],badge=item.tipo==='Vídeo'?'Vídeo · prévia':'Foto';var choose=item.selecionavel?'<button class=\"button select-button '+(selected?'active':'')+'\" data-select=\"'+esc(item.url)+'\">'+(selected?'✓ Selecionada para vitrine':'Adicionar à vitrine')+'</button>':'<span class=\"button select-button video-action\">Vídeo vinculado · seleção de foto indisponível</span>';return '<article class=\"media-card '+(selected?'selected':'')+'\" data-card=\"'+esc(item.url)+'\"><div class=\"media-frame\" data-preview=\"'+esc(item.url)+'\"><span class=\"media-badge '+(item.tipo==='Vídeo'?'video':'')+'\">'+esc(badge)+'</span><span class=\"placeholder\">Carregando prévia…</span><button data-open=\"'+esc(item.url)+'\" aria-label=\"Ampliar '+esc(item.rotulo)+'\"></button></div><div class=\"card-copy\"><p class=\"card-kicker\">'+esc(item.data+' · '+item.id+' · '+item.rotulo)+'</p><h3>'+esc(item.atividade)+'</h3><p class=\"card-place\">'+esc(item.bairro+' · '+item.local)+'</p><p class=\"card-report\">'+esc(short(item.relato,145))+'</p><p class=\"card-team\">'+esc(item.equipe)+'</p><div class=\"card-actions\">'+choose+'<button class=\"button primary\" data-download=\"'+esc(item.url)+'\">Baixar original</button><a class=\"button outline\" href=\"'+esc(item.linkDia)+'\" target=\"_blank\" rel=\"noopener\">Abrir ficha</a></div></div></article>';}\n  function render(){var items=filtered(),pages=Math.max(1,Math.ceil(items.length/state.pageSize));if(state.page>pages)state.page=pages;var start=(state.page-1)*state.pageSize,current=items.slice(start,start+state.pageSize);el('visible-count').textContent=items.length;el('results-context').textContent=items.length===state.data.itens.length?'Visão completa do período selecionado.':'Resultado combinado dos filtros ativos.';el('gallery').innerHTML=current.length?current.map(card).join(''):'<div class=\"empty\"><strong>Nenhuma evidência nesta combinação</strong><span>Os filtros podem ser restaurados para retomar a visão completa do mês.</span></div>';el('page-info').textContent='Página '+state.page+' de '+pages;el('previous-page').disabled=state.page<=1;el('next-page').disabled=state.page>=pages;el('pagination').classList.toggle('hidden',items.length<=state.pageSize);bindCards();hydrate();}\n  function renderSelection(){var count=Object.keys(state.selected).length;el('selected-count').textContent=count;el('download-selected').disabled=!count;el('clear-selected').disabled=!count;}\n  function bindCards(){document.querySelectorAll('[data-select]').forEach(function(button){button.onclick=function(){var item=findItem(button.dataset.select);if(!item)return;if(state.selected[item.url])delete state.selected[item.url];else{if(Object.keys(state.selected).length>=state.data.limites.itensPacote){toast('A seleção aceita até '+state.data.limites.itensPacote+' fotos por pacote.',true);return;}state.selected[item.url]=item;}renderSelection();render();};});document.querySelectorAll('[data-download]').forEach(function(button){button.onclick=function(){var item=findItem(button.dataset.download);if(item)downloadOne(item);};});document.querySelectorAll('[data-open]').forEach(function(button){button.onclick=function(){var item=findItem(button.dataset.open);if(item)openLightbox(item);};});}\n  function findItem(url){return state.data.itens.find(function(item){return item.url===url;});}\n  function loadImage(url){if(state.imageCache[url])return Promise.resolve(state.imageCache[url]);if(state.imageLoading[url])return state.imageLoading[url];state.imageLoading[url]=apiImage(url).then(function(result){state.imageCache[url]=result.dataUri;delete state.imageLoading[url];return result.dataUri;},function(error){delete state.imageLoading[url];throw error;});return state.imageLoading[url];}\n  function hydrate(){var queue=[].slice.call(document.querySelectorAll('[data-preview]')).filter(function(node){return !node.dataset.started;});var active=0;function next(){while(active<3&&queue.length){(function(node){node.dataset.started='1';active++;loadImage(node.dataset.preview).then(function(src){var placeholder=node.querySelector('.placeholder');if(placeholder)placeholder.remove();var image=document.createElement('img');image.alt='Evidência de campo';image.src=src;node.insertBefore(image,node.querySelector('button'));}).catch(function(){var placeholder=node.querySelector('.placeholder');if(placeholder)placeholder.innerHTML='Prévia indisponível<br>O original continua vinculado';}).finally(function(){active--;next();});})(queue.shift());}}next();}\n  function saveResult(result){if(result.modo==='dados'){var link=document.createElement('a');link.href=result.dataUri;link.download=result.nome;document.body.appendChild(link);link.click();link.remove();return;}var direct=document.createElement('a');direct.href=result.url;direct.target='_blank';direct.rel='noopener';document.body.appendChild(direct);direct.click();direct.remove();}\n  function downloadOne(item){setBusy(true);apiDownload(item).then(function(result){saveResult(result);toast(result.nota||('Download preparado: '+result.nome));}).catch(function(error){toast('Não foi possível preparar o download: '+(error.message||error),true);}).finally(function(){setBusy(false);});}\n  function downloadSelected(){var items=Object.keys(state.selected).map(function(url){return state.selected[url];});if(!items.length)return;setBusy(true);apiPackage(items).then(function(result){saveResult(result);toast(result.arquivos+' foto(s) reunida(s) em '+result.nome+'.');}).catch(function(error){toast('Não foi possível montar o pacote: '+(error.message||error),true);}).finally(function(){setBusy(false);});}\n  function openLightbox(item){state.current=item;el('lightbox-badge').textContent=item.tipo+' · '+item.data+' · '+item.id;el('lightbox-badge').className='media-badge '+(item.tipo==='Vídeo'?'video':'');el('lightbox-title').textContent=item.atividade;el('lightbox-meta').textContent=item.bairro+' · '+item.local+' · '+item.equipe;el('lightbox-text').textContent=item.relato;el('lightbox-sheet').href=item.linkDia;el('lightbox-image').removeAttribute('src');el('lightbox-image').alt='Evidência '+item.id;el('lightbox').classList.remove('hidden');loadImage(item.url).then(function(src){if(state.current&&state.current.url===item.url)el('lightbox-image').src=src;}).catch(function(){toast('A prévia não pôde ser ampliada. O original permanece disponível.',true);});}\n  function closeLightbox(){state.current=null;el('lightbox').classList.add('hidden');el('lightbox-image').removeAttribute('src');}\n  function changeMonth(month){setBusy(true);apiData(month).then(function(data){state.data=data;state.selected={};state.imageCache={};setupData();}).catch(function(error){toast('Não foi possível atualizar o acervo: '+(error.message||error),true);}).finally(function(){setBusy(false);});}\n  ['day-filter','neighborhood-filter','activity-filter','type-filter'].forEach(function(id){el(id).onchange=function(){state.page=1;render();};});el('search-filter').oninput=function(){state.page=1;render();};el('month-filter').onchange=function(){changeMonth(this.value);};el('refresh').onclick=function(){changeMonth(el('month-filter').value);};el('clear-filters').onclick=function(){el('day-filter').value='';el('neighborhood-filter').value='';el('activity-filter').value='';el('type-filter').value='';el('search-filter').value='';state.page=1;render();};el('previous-page').onclick=function(){if(state.page>1){state.page--;render();window.scrollTo({top:document.querySelector('.results-head').offsetTop-15,behavior:'smooth'});}};el('next-page').onclick=function(){state.page++;render();window.scrollTo({top:document.querySelector('.results-head').offsetTop-15,behavior:'smooth'});};el('download-selected').onclick=downloadSelected;el('clear-selected').onclick=function(){state.selected={};renderSelection();render();};el('close-lightbox').onclick=closeLightbox;el('lightbox').onclick=function(event){if(event.target===this)closeLightbox();};el('lightbox-download').onclick=function(){if(state.current)downloadOne(state.current);};document.addEventListener('keydown',function(event){if(event.key==='Escape')closeLightbox();});\n  setupData();\n})();\n</script>\n";

/** Banco compartilhado no RDAS. Metadados leves; bytes só ao abrir a mídia. */
const CM43={rdas:'176BymNYBSfVt7iQrkNR-IyT_NXdB9GC999mX9C2WtK4',aba:'_CPT Midias',headers:['Chave','Data','Atividade','Bairro','Legenda','Arquivo ID','URL','Tipo MIME','Autor','Enviado em','Pedido','Local']};
function cm43SS_(){return SpreadsheetApp.openById(CM43.rdas);}
function instalarEnvioMidiasRDAS(){const ss=SpreadsheetApp.getActiveSpreadsheet();if(!ss||ss.getId()!==CM43.rdas)throw Error('Execute a instalação no projeto do RDAS.');let sh=ss.getSheetByName(CM43.aba);if(sh){cm43Aba_();return {ok:true,mensagem:'Banco já preparado. Abra Enviar fotos no menu RDAS.'};}const parents=DriveApp.getFileById(ss.getId()).getParents(),folder=parents.hasNext()?parents.next().createFolder('RDAS Fotos complementares'):DriveApp.createFolder('RDAS Fotos complementares');sh=ss.insertSheet(CM43.aba);sh.getRange(1,1,1,CM43.headers.length).setValues([CM43.headers]);sh.getRange('A1').setNote(JSON.stringify({pasta:folder.getId()}));sh.hideSheet();SpreadsheetApp.getUi().alert('Envio preparado. Confira os acessos à pasta: '+folder.getUrl()+'\nQuem envia precisa de edição no RDAS e na pasta. Quem consulta precisa de leitura nas fotos.');return {ok:true,pasta:folder.getUrl(),mensagem:'Compartilhe a pasta com quem envia e consulta as fotos. Nenhum gatilho foi criado.'};}
function cm43Aba_(){const sh=cm43SS_().getSheetByName(CM43.aba);if(!sh)throw Error('O administrador precisa executar instalarEnvioMidiasRDAS no RDAS uma vez.');if(JSON.stringify(sh.getRange(1,1,1,12).getValues()[0])!==JSON.stringify(CM43.headers))throw Error('Cabeçalhos do banco de mídias foram alterados.');return sh;}
function cm43Manuais_(mes){const sh=cm43SS_().getSheetByName(CM43.aba);if(!sh||sh.getLastRow()<2)return [];const seen=new Set();return sh.getRange(2,1,sh.getLastRow()-1,12).getValues().filter(r=>r[0]&&(!mes||String(r[1]).slice(0,7)===mes)).map(r=>({chave:String(r[0]),dataIso:String(r[1]),data:String(r[1]).split('-').reverse().join('/'),atividade:String(r[2]),bairro:String(r[3]),rotulo:String(r[4]),fileId:String(r[5]),url:String(r[6]),mime:String(r[7]),tipo:/^video\//.test(r[7])?'Vídeo':'Foto',autor:String(r[8]),quando:String(r[9]),pedido:String(r[10]),local:String(r[11]),id:'Complementar',selecionavel:!/^video\//.test(r[7]),equipe:String(r[8]),classificacao:'Registro complementar',relato:'',nomeDownload:String(r[1])+'_'+String(r[2]).replace(/[^\wÀ-ÿ -]/g,'')})).filter(r=>{if(seen.has(r.chave))return false;seen.add(r.chave);return true;});}
function cm43Validar_(p){if(!p||!/^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(p.data||'')||new Date(p.data+'T12:00:00Z').toISOString().slice(0,10)!==p.data)throw Error('Informe a data da atividade.');if(!String(p.atividade||'').trim()||String(p.atividade).length>200)throw Error('Informe a atividade com até 200 caracteres.');if(!/^[\w-]{10,100}$/.test(p.pedido||''))throw Error('Identificador do envio inválido.');for(const k of ['bairro','legenda','local'])if(String(p[k]||'').length>500)throw Error('Use até 500 caracteres em '+k);}
function cm43Enviar(p){cm43Validar_(p);const lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw Error('Outro envio está terminando. Repita este arquivo.');let created=null,appendStarted=false;const props=PropertiesService.getUserProperties(),pendingKey='CM43_UPLOAD_'+p.pedido;try{const old=cm43Manuais_('').find(x=>x.pedido===p.pedido);if(old){props.deleteProperty(pendingKey);return old;}const sh=cm43Aba_(),cfg=JSON.parse(sh.getRange('A1').getNote()||'{}');let file;
 if(p.url){const match=String(p.url).match(/^https:\/\/(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/);if(!match)throw Error('Use o link de um arquivo do Google Drive.');const rk=String(p.url).match(/[?&]resourcekey=([\w-]+)/);file=rk?DriveApp.getFileByIdAndResourceKey(match[1],rk[1]):DriveApp.getFileById(match[1]);if(!/^(image|video)\//.test(file.getMimeType()))throw Error('Escolha foto ou vídeo.');}
 else{if(!/^(image\/(jpeg|png|webp))$/.test(p.mime||''))throw Error('Use JPG, PNG ou WEBP. Para vídeo, vincule o arquivo do Drive.');if(typeof p.base64!=='string'||p.base64.length>11200000||!/^[A-Za-z0-9+/]*={0,2}$/.test(p.base64))throw Error('Imagem acima do limite de 8 MB ou conteúdo inválido.');const bytes=Utilities.base64Decode(p.base64);if(!bytes.length||bytes.length>8*1024*1024)throw Error('Use uma imagem de até 8 MB.');const folder=DriveApp.getFolderById(cfg.pasta),saved=props.getProperty(pendingKey);if(saved){file=DriveApp.getFileById(saved);}else{file=folder.createFile(Utilities.newBlob(bytes,p.mime,p.data+' '+String(p.nome||'foto').replace(/[\\/:*?"<>|]/g,'').slice(0,150)));created=file;props.setProperty(pendingKey,file.getId());}}
 const id=file.getId(),row=[Utilities.getUuid(),p.data,String(p.atividade).trim(),String(p.bairro||''),String(p.legenda||''),id,file.getUrl(),file.getMimeType(),Session.getActiveUser().getEmail()||'Conta identificada pelo acesso ao Drive',new Date().toISOString(),p.pedido,String(p.local||'')];
 // append é atômico no serviço Sheets, inclusive entre Central e RDAS.
 const url='https://sheets.googleapis.com/v4/spreadsheets/'+CM43.rdas+'/values/'+encodeURIComponent("'"+CM43.aba+"'!A:L")+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS';
 appendStarted=true;const resp=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},payload:JSON.stringify({values:[row]}),muteHttpExceptions:true});if(resp.getResponseCode()>=300){if(created){created.setTrashed(true);created=null;props.deleteProperty(pendingKey);}throw Error('Não foi possível registrar a mídia. Verifique edição no RDAS e suas proteções.');}props.deleteProperty(pendingKey);created=null;return {chave:row[0],fileId:id,url:file.getUrl()};
 }catch(e){if(created&&!appendStarted)try{created.setTrashed(true);props.deleteProperty(pendingKey);}catch(ignore){}throw e;}finally{lock.releaseLock();}}
function cm43Galeria(p){const mes=String(p&&p.mes||Utilities.formatDate(new Date(),'America/Sao_Paulo','yyyy-MM'));if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(mes))throw Error('Competência inválida.');const ss=cm43SS_(),dias=cr43ListarDias_(ss).filter(d=>Utilities.formatDate(d.data,'America/Sao_Paulo','yyyy-MM')===mes),off=Math.max(0,Number(p.cursor)||0),part=dias.slice(off,off+3),itens=off===0?cm43Manuais_(mes):[];part.forEach(d=>{const day=cr43LerDiaCompleto_(ss,d.aba,cr43Fuso_(ss));day.relatos.forEach(r=>r.fotos.forEach((f,i)=>{const match=String(f.url).match(/(?:\/d\/|[?&]id=)([\w-]+)/);if(!match)return;itens.push({chave:match[1]+'|'+day.chave+'|'+r.id,fileId:match[1],url:f.url,dataIso:Utilities.formatDate(d.data,'America/Sao_Paulo','yyyy-MM-dd'),atividade:r.atividade,bairro:r.bairro,local:r.local,equipe:r.equipe,rotulo:f.rotulo||'Registro '+(i+1),tipo:/v[ií]deo/i.test(f.rotulo||'')?'Vídeo':'Foto',id:r.id});}));});return {itens,proximo:off+3<dias.length?off+3:null,dias:dias.length,mes};}
function cm43ArquivoPermitido_(id,url){if(!/^[\w-]+$/.test(id))throw Error('Arquivo inválido.');const key=String(url||'').match(/[?&]resourcekey=([\w-]+)/);return key?DriveApp.getFileByIdAndResourceKey(id,key[1]):DriveApp.getFileById(id);}
function cm43Previa(p){const f=cm43ArquivoPermitido_(p.fileId,p.url),mime=f.getMimeType(),key=f.getResourceKey();if(/^video\//.test(mime))return {video:true,src:'https://drive.google.com/file/d/'+f.getId()+'/preview'+(key?'?resourcekey='+encodeURIComponent(key):''),url:f.getUrl()};const b=f.getThumbnail()||(/^image\/(png|jpeg|gif)$/.test(mime)&&f.getSize()<4000000?f.getBlob():null);if(!b)throw Error('Prévia indisponível. Abra o original no Drive.');return {video:false,src:'data:'+b.getContentType()+';base64,'+Utilities.base64Encode(b.getBytes()),url:f.getUrl()};}
function cm43Pacote(p){if(!p||!Array.isArray(p.itens)||!p.itens.length||p.itens.length>15)throw Error('Selecione de 1 a 15 imagens.');let size=0;const blobs=p.itens.map((x,i)=>{const f=cm43ArquivoPermitido_(x.fileId,x.url);if(!/^image\//.test(f.getMimeType()))throw Error('Vídeos devem ser baixados pelo original.');size+=f.getSize();if(size>20*1024*1024)throw Error('Pacote acima de 20 MB. Selecione menos imagens.');return f.getBlob().setName(String(i+1).padStart(2,'0')+'_'+f.getName());});const zip=Utilities.zip(blobs,'Fotos_RDAS.zip');return {nome:'Fotos_RDAS.zip',base64:Utilities.base64Encode(zip.getBytes()),mime:'application/zip'};}
function abrirEnvioFotosRDAS(){SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(CM43_UPLOAD_HTML).setWidth(1180).setHeight(820),'RDAS | Enviar fotos e vincular vídeos');}

const CONFIG_CR43_RDAS={PADRAO_ABA:/^RDAS \d{2}-\d{2}-\d{4}$/,FUSO_PADRAO:'America/Sao_Paulo',MAX_DIAS_MENU:31,MAX_DIAS_COMPARACAO:10};
function cr43ListarDias_(arquivo) {
  const fuso = cr43Fuso_(arquivo);
  return arquivo.getSheets().filter(function (aba) {
    return CONFIG_CR43_RDAS.PADRAO_ABA.test(aba.getName());
  }).map(function (aba) {
    let data = cr43Data_(aba.getRange('C5').getValue());
    if (!data) data = cr43DataDoNome_(aba.getName());
    return { aba: aba, nome: aba.getName(), data: data || new Date(0) };
  }).sort(function (a, b) {
    return b.data.getTime() - a.data.getTime();
  });
}

function cr43ResumoAba_(aba, fuso) {
  const cabecalho = aba.getRange(1, 1, Math.min(25, Math.max(1, aba.getLastRow())), 12).getValues();
  const data = cr43Data_(cr43Valor_(cabecalho, 4, 2)) || cr43DataDoNome_(aba.getName()) || new Date(0);
  const execucoes = cr43Numero_(cr43Valor_(cabecalho, 8, 0));
  const externas = cr43Numero_(cr43Valor_(cabecalho, 8, 4));
  const internas = cr43Numero_(cr43Valor_(cabecalho, 8, 6));
  const interrupcoes = cr43Numero_(cr43Valor_(cabecalho, 8, 10));
  const tabela = cr43LerTabela_(cabecalho);
  const midias = tabela.length
    ? tabela.reduce(function (total, item) { return total + item.midias; }, 0)
    : cr43ContarMidiasNaAba_(aba);
  return {
    chave: aba.getName(),
    data: cr43FormatarData_(data, fuso),
    execucoes: execucoes,
    externas: externas,
    internas: internas,
    interrupcoes: interrupcoes,
    midias: midias
  };
}

function cr43LerDiaCompleto_(arquivo, aba, fuso) {
  const ultimaLinha = Math.max(1, aba.getLastRow());
  const valores = aba.getRange(1, 1, ultimaLinha, 12).getValues();
  let ricos = [];
  try {
    ricos = aba.getRange(1, 1, ultimaLinha, 12).getRichTextValues();
  } catch (erro) {
    ricos = [];
  }
  const tabela = cr43LerTabela_(valores);
  const porId = {};
  tabela.forEach(function (item) { porId[item.id] = item; });
  const relatos = [];
  const titulos = [];
  valores.forEach(function (linha, indice) {
    const correspondencia = String(linha[0] || '').match(/^FICHA\s+\d+\s+DE\s+\d+\s+\|\s*([^|]+?)\s*\|/i);
    if (correspondencia) titulos.push({ linha: indice, id: correspondencia[1].trim() });
  });
  titulos.forEach(function (titulo, indice) {
    const proximo = indice + 1 < titulos.length ? titulos[indice + 1].linha : valores.length;
    relatos.push(cr43LerFicha_(valores, ricos, titulo.linha, proximo, titulo.id, porId[titulo.id] || {}, fuso));
  });
  tabela.forEach(function (item) {
    if (relatos.some(function (relato) { return relato.id === item.id; })) return;
    relatos.push(cr43RelatoDaTabela_(item, fuso));
  });

  const data = cr43Data_(cr43Valor_(valores, 4, 2)) || cr43DataDoNome_(aba.getName()) || new Date(0);
  const totalExecucoes = cr43Numero_(cr43Valor_(valores, 8, 0)) || tabela.length || relatos.length;
  const participantes = cr43Numero_(cr43Valor_(valores, 8, 2));
  const externas = cr43Numero_(cr43Valor_(valores, 8, 4));
  const internas = cr43Numero_(cr43Valor_(valores, 8, 6));
  const panfletos = cr43Numero_(cr43Valor_(valores, 8, 8));
  const interrupcoes = cr43Numero_(cr43Valor_(valores, 8, 10));
  const fotosLocalizadas = relatos.reduce(function (total, relato) { return total + relato.fotos.length; }, 0);
  const midiasInformadas = tabela.reduce(function (total, item) { return total + item.midias; }, 0);
  const deslocamentos = cr43Agrupar_(relatos, 'deslocamento', false);
  const recursos = cr43Agrupar_(relatos, 'ferramentas', true);
  const tendaRelatos = relatos.filter(function (relato) {
    return /\btenda\b/i.test([relato.atividade, relato.ferramentas, relato.relato, relato.observacao].join(' '));
  });
  const ocorrencias = relatos.filter(function (relato) {
    return cr43Normalizar_(relato.interrupcao) === 'sim' || /interrup/i.test(relato.status);
  }).map(function (relato) {
    return { id: relato.id, clima: cr43Exibir_(relato.clima), texto: cr43TextoOcorrencia_(relato) };
  });

  return {
    chave: aba.getName(),
    data: cr43FormatarData_(data, fuso),
    diaSemana: cr43DiaSemana_(data),
    link: 'https://docs.google.com/spreadsheets/d/' + arquivo.getId() + '/edit#gid=' + aba.getSheetId(),
    faixa: cr43Exibir_(cr43Valor_(valores, 5, 8)),
    clima: cr43Exibir_(cr43Valor_(valores, 5, 2)),
    totalExecucoes: totalExecucoes,
    participantes: participantes,
    externas: externas,
    internas: internas,
    panfletos: panfletos,
    interrupcoes: interrupcoes,
    midias: Math.max(fotosLocalizadas, midiasInformadas),
    equipe: cr43Unicos_(relatos.reduce(function (lista, relato) { return lista.concat(cr43Separar_(relato.equipe)); }, [])),
    publicos: cr43Unicos_(relatos.reduce(function (lista, relato) { return lista.concat(cr43Separar_(relato.publico)); }, [])),
    territorios: cr43Unicos_(relatos.map(function (relato) { return relato.bairro; })),
    deslocamentos: deslocamentos,
    recursos: recursos,
    tenda: { relatos: tendaRelatos.length, ids: tendaRelatos.map(function (relato) { return relato.id; }) },
    ocorrencias: ocorrencias,
    relatos: relatos
  };
}

function cr43LerTabela_(valores) {
  let cabecalho = -1;
  for (let linha = 0; linha < valores.length; linha++) {
    if (cr43Normalizar_(cr43Valor_(valores, linha, 0)) === 'id' &&
        cr43Normalizar_(cr43Valor_(valores, linha, 1)) === 'periodo') {
      cabecalho = linha;
      break;
    }
  }
  if (cabecalho < 0) return [];
  const itens = [];
  for (let linha = cabecalho + 1; linha < valores.length; linha++) {
    const id = String(cr43Valor_(valores, linha, 0) || '').trim();
    if (!id) break;
    itens.push({
      id: id,
      periodo: String(cr43Valor_(valores, linha, 1) || '').trim(),
      horario: String(cr43Valor_(valores, linha, 2) || '').trim(),
      local: String(cr43Valor_(valores, linha, 3) || '').trim(),
      equipe: String(cr43Valor_(valores, linha, 4) || '').trim(),
      atividade: String(cr43Valor_(valores, linha, 5) || '').trim(),
      publico: String(cr43Valor_(valores, linha, 6) || '').trim(),
      participantes: cr43Numero_(cr43Valor_(valores, linha, 7)),
      clima: String(cr43Valor_(valores, linha, 8) || '').trim(),
      classificacao: String(cr43Valor_(valores, linha, 9) || '').trim(),
      midias: cr43Numero_(cr43Valor_(valores, linha, 10)),
      status: String(cr43Valor_(valores, linha, 11) || '').trim()
    });
  }
  return itens;
}

function cr43LerFicha_(valores, ricos, linha, proximaLinha, id, resumo, fuso) {
  const horarioDuracao = String(cr43Valor_(valores, linha + 1, 6) || resumo.horario || '');
  const partesHorario = horarioDuracao.split('|');
  const publicoParticipantes = String(cr43Valor_(valores, linha + 5, 2) || resumo.publico || '');
  const partesPublico = publicoParticipantes.split('|');
  const data = cr43Data_(cr43Valor_(valores, linha + 1, 2));
  const status = String(cr43Valor_(valores, linha + 1, 10) || resumo.status || '').trim();
  return {
    id: id,
    data: data ? cr43FormatarData_(data, fuso) : '',
    horario: String(partesHorario[0] || resumo.horario || '').trim(),
    duracao: String(partesHorario[1] || '').trim(),
    periodo: resumo.periodo || '',
    atividade: cr43Exibir_(cr43Valor_(valores, linha + 2, 2) || resumo.atividade),
    local: cr43Exibir_(cr43Valor_(valores, linha + 3, 2) || resumo.local),
    bairro: cr43Exibir_(cr43Valor_(valores, linha + 3, 10)),
    equipe: cr43Exibir_(cr43Valor_(valores, linha + 4, 2) || resumo.equipe),
    publico: cr43Exibir_(String(partesPublico[0] || resumo.publico || '').trim()),
    participantes: resumo.participantes !== undefined ? resumo.participantes : cr43Numero_(partesPublico[1]),
    classificacao: cr43Exibir_(cr43Valor_(valores, linha + 2, 10) || resumo.classificacao),
    clima: cr43Exibir_(cr43Valor_(valores, linha + 5, 8) || resumo.clima),
    deslocamento: cr43Exibir_(cr43Valor_(valores, linha + 6, 2)),
    pessoasVeiculo: cr43Numero_(cr43Valor_(valores, linha + 6, 8)),
    ferramentas: cr43Exibir_(cr43Valor_(valores, linha + 7, 2)),
    panfletos: cr43Numero_(cr43Valor_(valores, linha + 7, 10)),
    objetivo: cr43Exibir_(cr43Valor_(valores, linha + 10, 0)),
    relato: cr43Exibir_(cr43Valor_(valores, linha + 15, 0)),
    observacao: cr43Exibir_(cr43Valor_(valores, linha + 24, 0)),
    status: cr43Exibir_(status),
    interrupcao: /interrup/i.test(status) ? 'Sim' : 'Não',
    fotos: cr43LinksDaFicha_(valores, ricos, linha, proximaLinha)
  };
}

function cr43RelatoDaTabela_(item, fuso) {
  return {
    id: item.id,
    data: '',
    horario: item.horario,
    duracao: '',
    periodo: item.periodo,
    atividade: cr43Exibir_(item.atividade),
    local: cr43Exibir_(item.local),
    bairro: 'Não informado',
    equipe: cr43Exibir_(item.equipe),
    publico: cr43Exibir_(item.publico),
    participantes: item.participantes,
    classificacao: cr43Exibir_(item.classificacao),
    clima: cr43Exibir_(item.clima),
    deslocamento: 'Não informado',
    pessoasVeiculo: 0,
    ferramentas: 'Não informado',
    panfletos: 0,
    objetivo: 'Não informado',
    relato: 'Não informado',
    observacao: 'Não informado',
    status: cr43Exibir_(item.status),
    interrupcao: /interrup/i.test(item.status) ? 'Sim' : 'Não',
    fotos: []
  };
}

function cr43LinksDaFicha_(valores, ricos, inicio, fim) {
  const fotos = [];
  const vistos = {};
  for (let linha = inicio; linha < fim; linha++) {
    for (let coluna = 0; coluna < 12; coluna++) {
      const texto = String(cr43Valor_(valores, linha, coluna) || '').trim();
      const links = [];
      const rico = ricos[linha] && ricos[linha][coluna];
      if (rico) {
        try { if (rico.getLinkUrl()) links.push(rico.getLinkUrl()); } catch (erro) {}
        try {
          rico.getRuns().forEach(function (trecho) {
            const link = trecho.getLinkUrl();
            if (link) links.push(link);
          });
        } catch (erro) {}
      }
      (texto.match(/https?:\/\/[^\s,;]+/gi) || []).forEach(function (link) { links.push(link); });
      links.forEach(function (link) {
        const limpo = String(link || '').trim().replace(/[),.;]+$/, '');
        if (!/^https:\/\/(?:drive|docs)\.google\.com\//i.test(limpo) || vistos[limpo]) return;
        vistos[limpo] = true;
        const rotulo = texto.split('|')[0].trim();
        fotos.push({ url: limpo, rotulo: /^(foto|prévia|previa|evidência|evidencia)/i.test(rotulo) ? rotulo : 'Mídia ' + (fotos.length + 1) });
      });
    }
  }
  return fotos;
}

function cr43Agrupar_(relatos, campo, separar) {
  const mapa = {};
  const ordem = [];
  relatos.forEach(function (relato) {
    const valores = separar ? cr43Separar_(relato[campo]) : [relato[campo]];
    cr43Unicos_(valores).forEach(function (valor) {
      if (cr43EhAusente_(valor)) return;
      const chave = cr43Normalizar_(valor);
      if (!mapa[chave]) {
        mapa[chave] = { nome: valor, ids: [] };
        ordem.push(chave);
      }
      if (mapa[chave].ids.indexOf(relato.id) < 0) mapa[chave].ids.push(relato.id);
    });
  });
  return ordem.map(function (chave) {
    return { nome: mapa[chave].nome, relatos: mapa[chave].ids.length, ids: mapa[chave].ids };
  });
}

function cr43TextoOcorrencia_(relato) {
  const detalhe=String(relato.observacao||'').match(/(?:^|\n)Motivo da interrupção:\s*([\s\S]*)$/);
  if(detalhe&&detalhe[1].trim())return detalhe[1].trim();
  const candidatos = [relato.observacao, relato.relato];
  for (let indice = 0; indice < candidatos.length; indice++) {
    const texto = String(candidatos[indice] || '').replace(/\s+/g, ' ').trim();
    if (cr43EhAusente_(texto)) continue;
    return texto.length > 360 ? texto.slice(0, 357).replace(/\s+\S*$/, '') + '…' : texto;
  }
  return 'Interrupção registrada sem detalhamento adicional.';
}

function cr43ContarMidiasNaAba_(aba) {
  const ultimaLinha = Math.max(1, aba.getLastRow());
  let ricos = [];
  try { ricos = aba.getRange(1, 1, ultimaLinha, 12).getRichTextValues(); } catch (erro) { return 0; }
  const vistos = {};
  ricos.forEach(function (linha) {
    linha.forEach(function (rico) {
      if (!rico) return;
      const links = [];
      try { if (rico.getLinkUrl()) links.push(rico.getLinkUrl()); } catch (erro) {}
      try { rico.getRuns().forEach(function (trecho) { if (trecho.getLinkUrl()) links.push(trecho.getLinkUrl()); }); } catch (erro) {}
      links.forEach(function (link) {
        if (/^https:\/\/(?:drive|docs)\.google\.com\//i.test(String(link || ''))) vistos[link] = true;
      });
    });
  });
  return Object.keys(vistos).length;
}

function cr43Valor_(matriz, linha, coluna) {
  return matriz[linha] && matriz[linha][coluna] !== undefined ? matriz[linha][coluna] : '';
}

function cr43Fuso_(arquivo) {
  return arquivo.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || CONFIG_CR43_RDAS.FUSO_PADRAO;
}

function cr43Data_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) return new Date(valor.getTime());
  const texto = String(valor || '').trim();
  let partes = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (partes) return new Date(Number(partes[3]), Number(partes[2]) - 1, Number(partes[1]), 12, 0, 0);
  partes = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (partes) return new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]), 12, 0, 0);
  const data = new Date(valor);
  return isNaN(data.getTime()) ? null : data;
}

function cr43DataDoNome_(nome) {
  const partes = String(nome || '').match(/^RDAS (\d{2})-(\d{2})-(\d{4})$/);
  return partes ? new Date(Number(partes[3]), Number(partes[2]) - 1, Number(partes[1]), 12, 0, 0) : null;
}

function cr43FormatarData_(data, fuso) {
  return Utilities.formatDate(data, fuso, 'dd/MM/yyyy');
}

function cr43DiaSemana_(data) {
  return ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][data.getDay()];
}

function cr43Numero_(valor) {
  if (typeof valor === 'number' && isFinite(valor)) return Math.max(0, Math.round(valor));
  const encontrado = String(valor || '').replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return encontrado ? Math.max(0, Math.round(Number(encontrado[0]))) : 0;
}

function cr43Separar_(valor) {
  return String(valor || '').split(/\s*(?:,|;|\n|\|)\s*/).map(function (item) {
    return item.trim();
  }).filter(Boolean);
}

function cr43Unicos_(valores) {
  const vistos = {};
  const saida = [];
  valores.forEach(function (valor) {
    const limpo = String(valor || '').trim();
    const chave = cr43Normalizar_(limpo);
    if (!limpo || !chave || cr43EhAusente_(limpo) || vistos[chave]) return;
    vistos[chave] = true;
    saida.push(limpo);
  });
  return saida;
}

function cr43Normalizar_(valor) {
  return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function cr43EhAusente_(valor) {
  const texto = cr43Normalizar_(valor).replace(/[.]+$/, '');
  return !texto || /^(nao informado|n|nao|n\/a|ni|nenhum|nenhuma|sem observacoes|sem observacao)$/.test(texto);
}

function cr43Exibir_(valor) {
  const texto = String(valor === null || valor === undefined ? '' : valor).trim();
  return cr43EhAusente_(texto) ? 'Não informado' : texto;
}

/**
 * BANCO DE IMAGENS DO RDAS | 1.0
 *
 * Este módulo é parte do Visualizador Executivo 1.1 e deve permanecer no
 * mesmo projeto da planilha RDAS. Trabalha somente em leitura: não altera
 * fichas, imagens, respostas ou abas da planilha.
 */

const CM43_UPLOAD_HTML="<!DOCTYPE html><html lang=\"pt-BR\"><head><base target=\"_blank\"><meta charset=\"UTF-8\"><style>\n:root{--navy:#083952;--blue:#009fe3;--red:#e51c35;--ink:#173747;--muted:#536d7a;--line:#d9e5ed;--bg:#f2f6f9;--font:15px}*{box-sizing:border-box}body{margin:0;background:var(--bg);font:var(--font)/1.45 Arial,sans-serif;color:var(--ink)}button,input,select,textarea{font:inherit}button,a,input,select,textarea{outline-offset:3px}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--blue)}button,a.action{cursor:pointer;border:1px solid var(--line);border-radius:9px;padding:10px 14px;background:white;color:var(--navy);font-weight:600;text-decoration:none}button:hover,a.action:hover{background:#e5f4fc}button.primary{background:var(--navy);color:white;border-color:var(--navy)}button:disabled{opacity:.5;cursor:wait}a{color:#0074a6}input,select,textarea{width:100%;border:1px solid #bfd2df;border-radius:8px;padding:10px 12px;background:white;color:var(--ink)}textarea{resize:vertical;min-height:100px}label{display:block;font-size:.9em;font-weight:600;margin-bottom:6px}h1,h2,h3,p{margin:0 0 12px}h1{font-size:2em;line-height:1.15;letter-spacing:-.8px}h2{font-size:1.4em}h3{font-size:1.06em}small,.muted{color:var(--muted)}#shell{display:grid;grid-template-columns:222px minmax(0,1fr);height:100vh}aside{background:var(--navy);color:white;border-top:5px solid var(--red);padding:25px 14px;overflow:auto;display:flex;flex-direction:column}.brand{padding:0 12px;font-weight:bold;line-height:1.2}.brand strong{font-size:2.2em;color:#36c7f5;display:block;letter-spacing:-1px}.brand small{display:block;color:#b3d3e3;font-size:.7em;margin-top:12px}.navtitle{font-size:.68em;color:#92b7c9;letter-spacing:1.4px;padding:22px 12px 7px}.nav{display:grid;gap:4px}.nav button{background:transparent;color:#e0edf4;border:0;text-align:left;font-weight:normal;padding:10px 12px}.nav button.active{background:#285267;box-shadow:inset 3px 0 #3ed1ff;font-weight:bold}.asidefoot{margin-top:auto;color:#92b7c9;padding:25px 12px 0;font-size:.72em}.main{min-width:0;display:flex;flex-direction:column;overflow:hidden}.top{display:flex;justify-content:space-between;align-items:center;padding:13px 26px;gap:18px;background:white;border-bottom:1px solid var(--line)}.top small{display:block;font-size:.72em;margin-top:3px}.tools{display:flex;gap:8px;align-items:center}.tools input,.tools select{width:auto;font-size:.8em;padding:7px}.content{overflow:auto;flex:1;padding:28px}.hero{border-radius:17px;background:linear-gradient(115deg,#07354e,#0c526c);padding:30px 34px;color:white;border-top:4px solid var(--red);position:relative;overflow:hidden;margin-bottom:24px}.hero:after{content:'';position:absolute;width:230px;height:230px;border:40px solid #ffffff07;border-radius:50%;right:-70px;bottom:-105px}.hero p{color:#c4e2ee;max-width:660px;margin:14px 0 0}.eyebrow{font-size:.72em;text-transform:uppercase;letter-spacing:1.4px;color:#027d9c;font-weight:bold;margin-bottom:10px}.hero .eyebrow{color:#49d0fb}.heading{display:flex;justify-content:space-between;gap:20px;align-items:start;margin-bottom:22px}.grid{display:grid;gap:18px}.two{grid-template-columns:1fr 1fr}.three{grid-template-columns:repeat(3,minmax(0,1fr))}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin:0 0 24px}.metric{border:1px solid var(--line);border-top:3px solid var(--blue);border-radius:13px;background:white;padding:18px}.metric:nth-child(2){border-top-color:#168c81}.metric:nth-child(3){border-top-color:var(--red)}.metric:nth-child(4){border-top-color:#7766a9}.metric .n{font-size:2.25em;font-weight:bold;color:var(--navy);display:block;letter-spacing:-1px;margin:4px 0}.metric small{font-size:.74em}.card{padding:22px;background:white;border:1px solid var(--line);border-radius:14px;min-width:0}.card.link{text-align:left;font-weight:normal;transition:transform .15s,box-shadow .15s}.card.link:hover{transform:translateY(-2px);box-shadow:0 8px 25px #08395214}.card p{color:var(--muted);font-size:.9em}.index{display:block;color:var(--red);font-size:.7em;letter-spacing:1px;font-weight:bold;margin-bottom:15px}.arrow{color:#007d9c;font-weight:bold}.section{margin-top:22px;padding-top:20px;border-top:1px solid var(--line)}.gap{margin-top:22px}.actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}.toolbar input{flex:2;min-width:190px}.toolbar select{flex:1;min-width:130px}.pill{display:inline-block;background:#eaf4f9;border-radius:20px;padding:4px 9px;font-size:.73em;color:#176683}.pill.red{background:#fff0f1;color:#a5293a}.pill.green{background:#e5f5ed;color:#147451}.record{display:grid;grid-template-columns:1fr auto;gap:20px;align-items:center;border-bottom:1px solid #e7eff4;padding:17px 0}.record:last-child{border:0}.record h3{margin:6px 0}.record p{margin:5px 0}.record small{font-size:.78em}.empty{padding:42px;text-align:center;color:var(--muted)}.notice{background:#e8f5fc;border-left:4px solid var(--blue);padding:13px 16px;border-radius:5px;font-size:.86em;margin:15px 0}.notice.warn{background:#fff6de;border-color:#d58a00}.field{margin-bottom:16px}.editor{display:grid;grid-template-columns:minmax(350px,1fr) minmax(350px,1fr);gap:24px}.paper{background:white;border:1px solid #d1dfe8;box-shadow:0 6px 25px #12334214;padding:28px;font:11pt/1.4 Arial;color:#173747;align-self:start;position:sticky;top:0}.paper h2{font-size:20pt;color:#083952}.paper h3{font-size:12pt;margin-top:18px}.paper p{white-space:pre-wrap;color:#173747}.paper table{border-collapse:collapse;width:100%;font-size:9.5pt}.paper td{border:1px solid #cfdde5;padding:7px;vertical-align:top}.paper td:first-child{background:#eaf4f8;font-weight:bold;width:29%}.paper img{max-width:100%;max-height:250px;object-fit:contain;display:block;margin:10px auto}.paper .branddoc{text-align:right;color:#009fe3;font-size:8pt;font-weight:bold;margin-bottom:15px}.photos{display:grid;grid-template-columns:1fr 1fr;gap:12px}.photo{padding:10px;border:1px solid var(--line);border-radius:9px}.photo img,.photo iframe{width:100%;height:150px;object-fit:cover;border:0}.photo label{font-size:.8em;margin-top:9px}.photo input[type=checkbox]{width:auto}.photo small{font-size:.72em}.monthfield{display:grid;grid-template-columns:minmax(220px,1fr) minmax(220px,1fr);gap:22px;padding:17px 0;border-bottom:1px solid var(--line)}.monthfield small{display:block;font-weight:normal;margin-top:7px}.check{display:flex;align-items:center;gap:8px;margin:10px 0;font-size:.85em}.check input[type=checkbox]{width:auto}.footnote{font-size:.77em;color:var(--muted);margin-top:15px}.links{display:flex;gap:8px;flex-wrap:wrap;margin:15px 0}.links a{font-size:.83em}.bar{height:9px;background:#e7f0f5;border-radius:8px;overflow:hidden;margin-top:7px}.bar span{display:block;height:100%;background:var(--blue);border-radius:8px}.barlabel{display:flex;justify-content:space-between;font-size:.84em}.bars>div{margin:17px 0}.calendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:7px}.dayhead{text-align:center;font-size:.73em;font-weight:bold;padding:8px}.day{min-height:115px;background:white;border:1px solid var(--line);border-radius:9px;padding:9px}.day.blank{border:0;background:transparent}.day.today{border:2px solid var(--blue)}.task{display:block;width:100%;text-align:left;font-size:.73em;font-weight:normal;padding:6px;margin-top:6px;border:0;border-left:3px solid var(--blue);background:#edf6fb;border-radius:4px}.task.done{background:#e9f7ed;border-color:#25855c}.task.late{background:#fff0f1;border-color:var(--red)}details{margin:15px 0}summary{cursor:pointer;font-weight:bold}dialog{width:min(660px,92vw);max-height:90vh;padding:25px;border:0;border-radius:14px;box-shadow:0 12px 90px #0004}dialog::backdrop{background:#08395288}.row{display:flex;gap:12px}.row>*{flex:1}#toast{display:none;position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:40;background:#083952;color:white;max-width:85%;padding:13px 20px;border-radius:10px;box-shadow:0 4px 24px #0002}#toast.error{background:#a52a3b}#busy{display:none;position:fixed;top:0;left:0;right:0;height:3px;background:var(--blue);z-index:50;animation:pulse 1s infinite}@keyframes pulse{50%{opacity:.2}}.hide{display:none!important}.mini{padding:7px 10px;font-size:.8em}#mobile{display:none}body.large{--font:18px}body.contrast{--bg:#fff;--muted:#314d5c;--line:#91aabc}\n@media(max-width:1100px){#shell{grid-template-columns:180px minmax(0,1fr)}aside{padding:20px 10px}.content{padding:20px}.top{padding:12px 20px}.editor{grid-template-columns:1fr}.paper{position:static}.metrics{gap:10px}.metric{padding:14px}.three{grid-template-columns:1fr 1fr}.sizes{display:none}}\n@media(max-width:760px){#shell{grid-template-columns:1fr}aside{display:none}body.showmenu aside{display:flex;position:absolute;inset:0 auto 0 0;width:230px;z-index:30}#mobile{display:inline}.content{padding:16px}.top{padding:10px}.top input{max-width:140px}.top b{font-size:.9em}.two,.three{grid-template-columns:1fr}.metrics{grid-template-columns:1fr 1fr}.monthfield{grid-template-columns:1fr;gap:8px}.calendar{gap:3px}.day{padding:4px;min-height:95px}.task{font-size:.66em}.record{grid-template-columns:1fr}.heading{display:block}.hero{padding:25px}.paper{padding:20px}}\n/* Edição 4.2: preenchimento guiado e temas persistentes. */\n.hero{padding:34px 36px;border-radius:22px;min-height:215px}.hero:after{width:310px;height:310px;border-width:50px;right:-95px;bottom:-160px}.hero h1{max-width:790px}.hero:before{content:'VEOLIA';position:absolute;right:25px;bottom:20px;font-weight:800;font-size:38px;letter-spacing:5px;color:#ffffff0d;pointer-events:none}.hero p{position:relative;z-index:1}.brand{letter-spacing:.1px}.brand small{border-top:1px solid #ffffff20;padding-top:12px}.metrics{gap:17px}.metric{border-radius:17px;box-shadow:0 4px 18px #11374e05}.metric .n{font-size:2.5em}.card{box-shadow:0 4px 18px #11374e04}.top{flex-wrap:wrap}.top .tools{flex-wrap:wrap}.question label{font-size:1.02em;line-height:1.4;max-width:970px}.question .eyebrow{margin-bottom:7px}.answerhint{font-size:.87em;color:#526d7e;line-height:1.5;margin-bottom:12px;padding:9px 12px;background:#edf7fc;border-radius:8px}.monthfield{display:block;padding:24px 0}.monthcompare{display:grid;grid-template-columns:minmax(170px,.8fr) minmax(170px,.85fr) minmax(240px,1.35fr);gap:16px;margin-top:15px}.refbox,.answerbox{background:#f3f7fa;border:1px solid var(--line);border-radius:10px;padding:14px;overflow-wrap:anywhere}.refbox strong{font-size:1.05em;display:block;margin:11px 0;white-space:pre-wrap;font-weight:600}.refbox>small:first-child,.answerbox>label:first-child{font-size:.67em;font-weight:bold;letter-spacing:.6px}.answerbox{background:#fff;border-color:#8bc9e3}.answerbox input,.answerbox textarea{font-size:1.05em;line-height:1.5}.suggestion{border-top:1px solid var(--line);margin-top:13px;padding-top:12px;font-size:.85em}.suggestion b{display:block}.suggestion button{margin-top:9px}.monthlybar{position:sticky;top:-28px;z-index:5;display:flex;gap:15px;align-items:center;justify-content:space-between;padding:13px 18px;background:#083952;color:#fff;border-radius:12px;box-shadow:0 5px 20px #0a2c4425}.monthlybar small{display:block;color:#bdd9e6;font-size:.74em}.monthlybar button{font-size:.8em}.toolbar .check{flex:0 0 auto}.toolbar .check input{flex:none;min-width:0;width:auto}.internalrecord{border-left:4px solid var(--blue);padding:18px 15px;margin-top:12px;border-radius:8px;background:#f7fafc}.tone-verde{border-left-color:#118264}.tone-vermelho{border-left-color:#d92942}.tone-roxo{border-left-color:#7952b2}.tone-cinza{border-left-color:#728292}.profile{background:#edf5fa;padding:18px;border-radius:12px}.profile p{font-size:.9em;line-height:1.5;margin:10px 0}.timelineitem{border-left:2px solid var(--line);padding:8px 15px;margin:8px 0}.timelineitem b,.timelineitem small{display:block}.timelineitem p{font-size:.9em;margin:6px 0}#internalDialog{width:min(850px,94vw)}\nbody.dark{--bg:#0b1722;--ink:#e4edf4;--muted:#a9becd;--line:#30475a;--navy:#092d40;--blue:#37b9ee}body.dark aside{background:#071e2c}body.dark .top,body.dark .card,body.dark .metric,body.dark dialog,body.dark .day,body.dark .answerbox{background:#142636;color:var(--ink)}body.dark button,body.dark input,body.dark select,body.dark textarea,body.dark .action{background:#1a3042;color:#e4edf4;border-color:#395468}body.dark button.primary{background:#007d9e;border-color:#007d9e;color:white}body.dark .metric .n{color:#70d2f7}body.dark .notice,body.dark .answerhint,body.dark .profile,body.dark .refbox{background:#172e40;color:#c2d9e8}body.dark .notice.warn{background:#423523;color:#f6dfaa}body.dark .internalrecord{background:#142636}body.dark .pill{background:#20475e;color:#9cdcff}body.dark .pill.red{background:#532b38;color:#ffc2ca}body.dark .pill.green{background:#174333;color:#9be2bf}body.dark .day.blank{background:transparent}body.dark .day.today{background:#133c51}body.dark .task{background:#214254;color:#e1eef6}body.dark .task.done{background:#153c30}body.dark .task.late{background:#442333}body.dark .bar{background:#2b4354}body.dark .card.link:hover{box-shadow:0 8px 25px #0005}body.dark .paper{background:#fff;color:#173747}body.dark .paper .muted{color:#536D7A}body.dark .paper td{color:#173747}body.dark .paper h2{color:#083952}body.dark #toast{background:#d6eefb;color:#082b3f}body.dark #toast.error{background:#81243a;color:#fff}body.contrast{--bg:#fff;--ink:#102a3b;--muted:#243d4d;--line:#627e90}.contrast .answerhint,.contrast .refbox,.contrast .notice{background:#f0f5f8;color:#102a3b}.contrast .metric small,.contrast .card p{color:#243d4d}\n@media(max-width:1100px){.monthcompare{grid-template-columns:1fr 1fr}.answerbox{grid-column:1/-1}.monthlybar{top:-20px}.top .tools{gap:6px}.hero{padding:25px}}@media(max-width:760px){.monthcompare{grid-template-columns:1fr}.answerbox{grid-column:auto}.monthlybar{top:-16px;align-items:start;flex-direction:column}.hero h1{font-size:1.7em}.top .tools{width:100%}.refbox{padding:12px}.refbox strong{margin:7px 0}}\n\n.signature{margin-top:23px;padding-top:14px;border-top:1px solid #ffffff22;color:#fff;font-size:.82em;font-weight:bold;letter-spacing:1px}.signature span{font-size:.72em;letter-spacing:.4px;color:#a9d2e5;margin-left:12px}\n.richmetrics{grid-template-columns:repeat(6,minmax(0,1fr))}.metric small{display:block}.trend43{height:240px;display:flex;gap:18px;align-items:flex-end;padding:20px 10px}.trend43>div{flex:1;text-align:center;min-width:0}.trendtrack{height:155px;display:flex;align-items:flex-end;background:var(--soft,#edf3f8);border-radius:8px;margin:9px 0}.trendtrack i{display:block;width:100%;border-radius:8px 8px 0 0;min-height:2px}.donutwrap{display:flex;align-items:center;gap:30px;flex-wrap:wrap}.donut43{width:180px;height:180px;border-radius:50%;display:grid;place-items:center}.donut43 span{background:var(--card,#fff);border-radius:50%;width:125px;height:125px;display:flex;flex-direction:column;justify-content:center;align-items:center}.donut43 b{font-size:2.4em}.color43{width:12px;height:12px;border-radius:4px;display:inline-block;margin-right:9px}.territory43{grid-template-columns:minmax(280px,.8fr) minmax(380px,1.2fr)}.territory43 .source43{max-height:75vh;overflow:auto;position:sticky;top:10px}.territory43 .paper{grid-column:1/-1;max-width:950px;margin:auto}.territory43 .diagsteps43{grid-column:1/-1;color:var(--muted)}.territory43 details p{font-size:.88em;line-height:1.55}.photos img{max-height:180px;object-fit:contain} .task[hidden]{display:none}.media43{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.mediacard43{border:1px solid var(--line,#cbdde6);border-radius:15px;overflow:hidden;background:var(--card,#fff)}.mediacard43 .image43{height:190px;background:linear-gradient(135deg,#dbeef5,#eee7fa);display:grid;place-items:center}.image43 img{width:100%;height:100%;object-fit:contain}.mediacard43 .caption43{padding:15px}.caption43 p{margin:5px 0}.caption43 small{display:block}.gallerytools{position:sticky;top:0;z-index:4;background:var(--card,#fff);padding:15px;border-radius:14px;margin-bottom:18px;box-shadow:0 3px 15px #1232}.media43 iframe{width:100%;height:420px}.commhero{background:linear-gradient(125deg,#123f60,#4d3981);color:white;border-top:4px solid #e91d43;border-radius:22px;padding:38px;margin-bottom:26px}.commhero h1{color:white;font-size:2.5em}.comtiles{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.comtiles button{text-align:left;min-height:180px;border-top:5px solid var(--accent);padding:24px;border-radius:18px}.comtiles h3{font-size:1.35em}.uploadrow{display:grid;grid-template-columns:90px 1fr;gap:15px;padding:16px;border-bottom:1px solid #ccdce8}.uploadrow img{width:90px;height:80px;object-fit:contain}.uploadrow input{width:100%}.mapgrid43{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}.mapgrid43 .card{border-top:4px solid #00A78D}.viewer43{width:min(1000px,95vw)}.viewer43 img{width:100%;max-height:70vh;object-fit:contain}.viewer43 iframe{width:100%;height:65vh;border:0}.c43status{padding:10px;border-radius:8px;background:#e4f5ec;color:#175441}.gallerytools input{max-width:360px}@media(max-width:1100px){.richmetrics{grid-template-columns:repeat(3,1fr)}.media43,.comtiles,.mapgrid43{grid-template-columns:repeat(2,1fr)}}@media(max-width:800px){.territory43,.media43,.comtiles,.mapgrid43{grid-template-columns:1fr}.territory43 .source43{position:static;max-height:350px}.richmetrics{grid-template-columns:repeat(2,1fr)}}\n\nbody[data-comm=\"galeria\"] aside{background:linear-gradient(160deg,#182f4c,#463160)}body[data-comm=\"enviar\"] aside{background:linear-gradient(160deg,#17344c,#674925)}body[data-comm=\"contatos\"] aside{background:linear-gradient(160deg,#123b4a,#205e57)}body[data-comm=\"mapa\"] aside{background:linear-gradient(160deg,#123f60,#1b5869)}body[data-comm=\"agenda\"] aside{background:linear-gradient(160deg,#182f4c,#564275)}body.contrast aside{background:#000!important}</style></head><body><div id=\"busy\"></div><main style=\"padding:24px\"><div id=\"view\"></div></main><div id=\"toast\" role=\"status\"></div><dialog id=\"taskDialog\"></dialog><script>const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c])),bold=v=>esc(v).replace(/\\*\\*([^*]+)\\*\\*/g,'<strong>$1</strong>'),dt=v=>v?String(v).slice(0,10).split('-').reverse().join('/'):'Sem data',mes=()=>$('mes').value,uid=()=>crypto.randomUUID();\nfunction msg(text,error=false){$('toast').textContent=text;$('toast').className=error?'error':'';$('toast').style.display='block';clearTimeout(msg.timer);msg.timer=setTimeout(()=>$('toast').style.display='none',error?15000:6500)}\nfunction rpc(name,p){pending++;$('busy').style.display='block';return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(r=>{if(!--pending)$('busy').style.display='none';resolve(r)}).withFailureHandler(e=>{if(!--pending)$('busy').style.display='none';msg(e.message||String(e),true);reject(e)})[name](p));}\nfunction work(b,fn){b.disabled=true;return Promise.resolve().then(fn).catch(e=>msg(e.message||String(e),true)).finally(()=>b.disabled=false)}\nfunction heading(t,sub,action=''){return '<div class=\"heading\"><div><div class=\"eyebrow\">Banco de imagens RDAS</div><h1>'+esc(t)+'</h1><p class=\"muted\">'+esc(sub)+'</p></div>'+action+'</div>'}\nfunction field(k,label,value,area=false){return '<div class=\"field\"><label for=\"f_'+k+'\">'+esc(label)+'</label>'+(area?'<textarea id=\"f_'+k+'\" rows=\"'+(k==='texto'?11:4)+'\">'+esc(value)+'</textarea>':'<input id=\"f_'+k+'\" value=\"'+esc(value)+'\">')+'</div>'}\nlet pending=0;const S={token:0};const G43={uploads:[]};\nfunction c43Upload(){G43.uploads=[];$('view').innerHTML=heading('Enviar fotos da atividade','Preencha os dados do lote e a legenda de cada foto. Os arquivos entram no mesmo banco do RDAS.')+'<section class=\"card\"><div class=\"row\">'+field('udata','Data da atividade',new Date().toLocaleDateString('en-CA'))+field('uatividade','Atividade','')+'</div><div class=\"row\">'+field('ubairro','Bairro','')+field('ulocal','Local / frente','')+'</div><label for=\"ufiles\">Escolher fotos (até 30 por lote, 8 MB por foto)</label><input id=\"ufiles\" type=\"file\" multiple accept=\"image/jpeg,image/png,image/webp\"><div id=\"uploadrows\"></div><div class=\"actions section\"><button id=\"usend\" class=\"primary\">Enviar fotos pendentes</button></div><p id=\"uresult\" role=\"status\"></p></section><section class=\"card gap\"><h3>Vincular vídeo ou imagem já no Drive</h3><p>Para vídeos e arquivos maiores, use o envio do Drive e cole o link. O arquivo mantém suas permissões.</p>'+field('ulink','Link do arquivo','')+field('ucaption','Legenda do arquivo','')+'<button id=\"ulinksend\">Adicionar ao banco</button></section>';$('f_udata').type='date';$('ufiles').onchange=()=>{G43.uploads.forEach(x=>x.preview&&URL.revokeObjectURL(x.preview));G43.uploads=[...$('ufiles').files].slice(0,30).map(file=>({file,pedido:uid(),preview:URL.createObjectURL(file),done:false}));$('uploadrows').innerHTML=G43.uploads.map((x,i)=>'<div class=\"uploadrow\"><img src=\"'+x.preview+'\" alt=\"Prévia da foto\"><div><b>'+esc(x.file.name)+'</b><input id=\"uc_'+i+'\" placeholder=\"Legenda desta foto\" aria-label=\"Legenda da foto '+(i+1)+'\"><small id=\"ust_'+i+'\">Pendente</small></div></div>').join('');};const meta=()=>({data:$('f_udata').value,atividade:$('f_uatividade').value,bairro:$('f_ubairro').value,local:$('f_ulocal').value});$('usend').onclick=e=>work(e.target,async()=>{const p=meta();if(!p.data||!p.atividade.trim())throw Error('Informe data e atividade antes de enviar.');if(!G43.uploads.length)throw Error('Selecione as fotos.');G43.enviando=true;$('ufiles').disabled=true;let ok=0;try{for(let i=0;i<G43.uploads.length;i++){const x=G43.uploads[i];if(x.done)continue;$('ust_'+i).textContent='Enviando…';try{if(x.file.size>8*1024*1024)throw Error('Acima de 8 MB. Reduza ou use um link do Drive.');const base64=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result.split(',')[1]);fr.onerror=()=>reject(Error('Falha ao ler foto.'));fr.readAsDataURL(x.file)});await rpc('cm43Enviar',{...p,legenda:$('uc_'+i).value,pedido:x.pedido,nome:x.file.name,mime:x.file.type,base64});x.done=true;ok++;$('ust_'+i).textContent='Salva no banco';$('uc_'+i).disabled=true;}catch(err){$('ust_'+i).textContent=err.message;}}}finally{G43.enviando=false;if($('ufiles'))$('ufiles').disabled=false;}$('uresult').textContent=ok+' fotos enviadas agora. '+G43.uploads.filter(x=>!x.done).length+' pendentes. Você pode repetir somente as pendentes.';});let linkRequest=null;$('ulinksend').onclick=e=>work(e.target,async()=>{const p={...meta(),url:$('f_ulink').value,legenda:$('f_ucaption').value};const sign=JSON.stringify(p);if(!linkRequest||linkRequest.sign!==sign)linkRequest={sign,id:uid()};await rpc('cm43Enviar',{...p,pedido:linkRequest.id});msg('Arquivo vinculado ao banco.');$('f_ulink').value='';linkRequest=null;});}\n\nc43Upload();</script></body></html>";