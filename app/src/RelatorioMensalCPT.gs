/**
 * RelatorioMensalCPT 2.2.0. Fechamento do mês e base do Relatório Mensal de Comunicação Social e Socioambiental.
 * Estrutura conforme o Orientador Sabesp (itens 1 a 13). Gera um Google Docs NOVO a cada pedido (v1, v2…):
 * nada é sobrescrito. Números vêm dos registros; textos que dependem de análise ficam marcados com [COMPLETAR].
 * Classificações automáticas (itens 4.x) são sugestões por palavras-chave e vêm sinalizadas para conferência.
 */
class RelatorioMensalCPT {
  static get papeis() { return ['administrador', 'administrativo', 'gestao', 'socioambiental', 'comunicacao']; }
  static get metaSemanal() { return 15; }
  static get metaMensal() { return 60; }
  static get eixos() {
    return [
      {item: '4.1', titulo: 'Reuniões, grupos de discussão e fóruns periódicos', re: /reuni|forum|grupo de discuss|assembl|roda de conversa/},
      {item: '4.2', titulo: 'Ações sob eixo de gestão de resíduos sólidos', re: /residuo|recicl|economia (solidaria|circular)|coleta seletiva|descarte/},
      {item: '4.3', titulo: 'Ações preventivas às doenças de veiculação hídrica', re: /doenca|veiculacao hidrica|dengue|leptospir|saude|higiene/},
      {item: '4.4', titulo: 'Ações de Educação Socioambiental', re: /educa|escola|oficina|palestra|aluno|crianca/},
      {item: '4.5', titulo: 'Governança Colaborativa', re: /governanca|comite|conselho|lideranc|parceri/}
    ];
  }
  constructor(ctx) {
    this.ctx = ctx;
    if (!ctx.perfil.papeis.some(p => RelatorioMensalCPT.papeis.includes(p))) throw new Error('O fechamento do mês está disponível para Administrativo, Gestão, Socioambiental e Comunicação.');
    this.dados = new DadosDaAplicacao(ctx.base, ctx.perfil); this.fuso = this.dados.fuso;
  }
  static norm(v) { return DadosDaAplicacao.norm(v); }
  static br(d) { return /^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : (d || ''); }
  static mesExtenso(m) { const n = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']; return n[Number(m.slice(5, 7)) - 1] + ' de ' + m.slice(0, 4); }
  /** Último relatório conhecido: nº 14 = setembro/2026. Os seguintes sobem um por mês. */
  static get referenciaNumero() { return {numero: 14, mes: '2026-09'}; }
  static mesesEntre(a, b) { return (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7)); }
  numeroSugerido(mes) {
    let base = RelatorioMensalCPT.referenciaNumero;
    try {
      const a = SpreadsheetApp.openById(this.ctx.config.agendaId).getSheetByName('Entregas mensais');
      if (a && a.getLastRow() > 1 && a.getLastColumn() >= 9) a.getRange(2, 1, a.getLastRow() - 1, 9).getValues()
        .filter(r => Number(r[8]) > 0 && String(r[1]) <= mes).forEach(r => { if (String(r[1]) >= base.mes) base = {numero: Number(r[8]), mes: String(r[1])}; });
    } catch (_) {}
    const n = base.numero + RelatorioMensalCPT.mesesEntre(base.mes, mes);
    return n > 0 ? n : '';
  }
  static proximoMes(m) { const d = new Date(m + '-15T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 1); return d.toISOString().slice(0, 7); }

  /** Campos do formulário guardados no registro (sem abrir arquivos do Drive). */
  static campos(json) {
    let d; try { d = JSON.parse(json || '{}'); } catch (_) { return null; }
    if (d.arquivoDetalhesId) return null;
    d = d.conteudo || d; const out = [];
    if (Array.isArray(d.campos)) d.campos.forEach(c => out.push([c.titulo, c.valor]));
    if (d.consolidado && d.consolidado.campos) Object.entries(d.consolidado.campos).forEach(e => out.push(e));
    return out;
  }
  /** Procura no JSON preservado da ficha um campo cujo título combine (ex.: "Tipo de manifestação"). Vazio se não houver. */
  static buscarNoJson(json, re) {
    let d; try { d = JSON.parse(json || '{}'); } catch (_) { return ''; }
    const fila = [d];
    for (let passos = 0; fila.length && passos < 2000; passos++) {
      const x = fila.shift();
      if (Array.isArray(x)) { fila.push(...x); continue; }
      if (!x || typeof x !== 'object') continue;
      if (typeof x.titulo === 'string' && re.test(RelatorioMensalCPT.norm(x.titulo)) && x.valor != null && x.valor !== '') return String(Array.isArray(x.valor) ? x.valor.join(', ') : x.valor);
      for (const [k, v] of Object.entries(x)) {
        if ((typeof v === 'string' || typeof v === 'number') && v !== '' && re.test(RelatorioMensalCPT.norm(k))) return String(v);
        if (v && typeof v === 'object') fila.push(v);
      }
    }
    return '';
  }
  static valor(campos, re) {
    if (!campos) return '';
    const achado = campos.find(([t, v]) => re.test(RelatorioMensalCPT.norm(t)) && v !== '' && v != null && !(Array.isArray(v) && !v.length));
    return achado ? (Array.isArray(achado[1]) ? achado[1].join(', ') : String(achado[1])) : '';
  }

  /** Reúne tudo o que o fechamento e o relatório usam, em uma leitura por tabela. */
  coletar(mes) {
    this.dados.mes(mes);
    const obrasCtl = new ObrasCPT(this.ctx), obras = obrasCtl.ler().linhas.map(o => obrasCtl.publico(o));
    const porId = new Map(obras.map(o => [o.id, o])), porNome = new Map(obras.map(o => [RelatorioMensalCPT.norm(o.nome), o]));
    const linhas = this.dados.ler(this.dados.registros(), 21).filter(r => r[0] && this.dados.mesCelula(r[3]) === mes);
    const registros = linhas.map(r => {
      const reg = this.dados.registro(r), campos = RelatorioMensalCPT.campos(r[20]);
      const obra = (reg.obraId && porId.get(reg.obraId)) || porNome.get(RelatorioMensalCPT.norm(String(reg.obra).replace(/\s*\[OBR-\d+\]\s*$/, '').split(' — ')[0])) || null;
      const tipo = RelatorioMensalCPT.norm(reg.procedimento);
      return {...reg, obraCadastro: obra, campos,
        satisfacao: /satisfac/.test(tipo), atendimento: /atendimento/.test(tipo) && !/satisfac/.test(tipo), relato: tipo === 'relato de atividade',
        frente: obra ? obra.nome : (reg.obra && !/nao se aplica/i.test(RelatorioMensalCPT.norm(reg.obra)) ? reg.obra.replace(/\s*\[OBR-\d+\]\s*$/, '') : 'Atividades sem obra específica'),
        endereco: obra ? (obra.endereco || obra.logradouroPAC16 || reg.bairro) : reg.bairro,
        publicoAlvo: RelatorioMensalCPT.valor(campos, /publico[- ]?alvo|publico atendido|publico da atividade/),
        ferramenta: RelatorioMensalCPT.valor(campos, /ferramenta|material (de comunicacao|utilizado)|instrumento/),
        texto: RelatorioMensalCPT.norm([reg.procedimento, reg.atividade, RelatorioMensalCPT.valor(campos, /tema|assunto|descri|relato/)].join(' '))};
    });
    const atividades = registros.filter(r => !r.satisfacao && !r.atendimento);
    // Entregas preparadas (última revisão de cada relato).
    const entregas = new Map();
    try {
      const a = SpreadsheetApp.openById(this.ctx.config.agendaId).getSheetByName('Entregas');
      if (a && a.getLastRow() > 1) a.getRange(2, 1, a.getLastRow() - 1, 6).getValues().forEach(r => { try { entregas.set(String(r[0]), JSON.parse(r[5])); } catch (_) {} });
    } catch (_) {}
    // Atendimentos que tocam o período: abertos até o fim do mês e não concluídos antes do início.
    const inicio = mes + '-01', fim = mes + '-31';
    const casos = this.dados.ler(this.dados.atendimentos(), 20).filter(r => this.dados.principal(r))
      .map(r => ({...this.dados.atendimento(r), tipo: RelatorioMensalCPT.buscarNoJson(r[19], /^tipo$|tipo de manifesta/), canal: RelatorioMensalCPT.buscarNoJson(r[19], /^canal|canal de (entrada|atendimento)|meio de contato|forma de contato/),
        procedencia: RelatorioMensalCPT.buscarNoJson(r[19], /^procedencia$/)}))
      .filter(c => (!c.abertura || c.abertura <= fim) && (!c.concluido || !c.conclusao || c.conclusao >= inicio));
    let agenda = [];
    try { agenda = new CronogramaCPT(this.ctx).listar({mes: RelatorioMensalCPT.proximoMes(mes)}).itens.filter(e => e.status !== 'cancelada'); } catch (_) {}
    return {mes, obras, registros, atividades, entregas, casos, agenda};
  }

  /** Semanas de segunda a domingo que tocam o mês; só contam pesquisas com data dentro do mês. */
  satisfacao(c) {
    const datas = c.registros.filter(r => r.satisfacao && r.data.startsWith(c.mes)).map(r => r.data), semanas = [];
    const ultimo = new Date(Date.UTC(Number(c.mes.slice(0, 4)), Number(c.mes.slice(5, 7)), 0)).getUTCDate();
    let d = new Date(c.mes + '-01T12:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    while (d.toISOString().slice(0, 7) <= c.mes) {
      const ini = d.toISOString().slice(0, 10), f = new Date(d); f.setUTCDate(f.getUTCDate() + 6); const fimS = f.toISOString().slice(0, 10);
      const a = ini < c.mes + '-01' ? c.mes + '-01' : ini, b = fimS > c.mes + '-' + ultimo ? c.mes + '-' + String(ultimo).padStart(2, '0') : fimS;
      semanas.push({de: a, ate: b, parcial: a !== ini || b !== fimS, total: datas.filter(x => x >= a && x <= b).length, meta: RelatorioMensalCPT.metaSemanal});
      d.setUTCDate(d.getUTCDate() + 7);
    }
    return {total: datas.length, meta: RelatorioMensalCPT.metaMensal, semanas};
  }

  conferir(mes) {
    const c = this.coletar(mes), relatos = c.registros.filter(r => r.relato), sat = this.satisfacao(c);
    const prontos = relatos.filter(r => (c.entregas.get(r.id) || {}).situacao === 'pronto').length, rascunhos = relatos.filter(r => (c.entregas.get(r.id) || {}).situacao === 'rascunho').length;
    const semPublico = relatos.filter(r => r.publico == null).length, vigente = mes >= '2026-10';
    const semObra = vigente ? c.atividades.filter(r => !r.obraId && !/nao se aplica/.test(RelatorioMensalCPT.norm(r.obra))).length : 0;
    const ativas = c.obras.filter(o => ['Em andamento', 'Paralisada'].includes(o.situacao));
    const comAtividade = new Set(c.atividades.filter(r => r.obraCadastro).map(r => r.obraCadastro.id));
    const semAtividade = ativas.filter(o => !comAtividade.has(o.id));
    const hoje = Utilities.formatDate(new Date(), this.fuso, 'yyyy-MM-dd'), limite = new Date(Date.now() - 7 * 864e5).toISOString();
    const desatualizadas = ativas.filter(o => !o.atualizadoEm || o.atualizadoEm < limite);
    const participantes = c.atividades.reduce((n, r) => n + (r.publico || 0), 0);
    const check = (nome, ok, detalhe, acao, atencao) => ({nome, situacao: ok ? 'ok' : atencao ? 'atencao' : 'pendente', detalhe, acao: acao || null});
    return {mes, geradoEm: new Date().toISOString(), hoje,
      numeros: {registros: c.registros.length, atividades: c.atividades.length, participantes, frentes: new Set(c.atividades.map(r => r.frente)).size,
        relatos: relatos.length, relatosProntos: prontos, satisfacao: sat.total, casosAbertos: c.casos.filter(x => !x.concluido).length,
        casosConcluidos: c.casos.filter(x => x.concluido && x.conclusao.startsWith(mes)).length, agendaProximoMes: c.agenda.length},
      satisfacao: sat,
      verificacoes: [
        check('Relatos preparados para o relatório', relatos.length && prontos === relatos.length, prontos + ' de ' + relatos.length + ' prontos' + (rascunhos ? ', ' + rascunhos + ' em rascunho' : '') + '. Relatos não preparados entram com o texto original.', {route: 'registros', procedimento: 'Relato de atividade'}, true),
        check('Público informado nos relatos', !semPublico, semPublico ? semPublico + ' relatos sem número de participantes.' : 'Todos os relatos têm público informado.', {route: 'registros', pendencia: 'publico'}),
        check('Obra informada nas atividades', !semObra, vigente ? (semObra ? semObra + ' atividades sem obra cadastrada (obrigatório desde 01/10/2026).' : 'Todas as atividades têm obra ou "não se aplica".') : 'Mês anterior à padronização de obras: textos originais preservados.', {route: 'registros'}),
        check('Pesquisas de satisfação (meta ' + sat.meta + ' no mês)', sat.total >= sat.meta, sat.total + ' de ' + sat.meta + '. Semanas: ' + sat.semanas.map(s => RelatorioMensalCPT.br(s.de).slice(0, 5) + '–' + RelatorioMensalCPT.br(s.ate).slice(0, 5) + ': ' + s.total + (s.parcial ? ' (parcial)' : '')).join(' · '), null, true),
        check('Obras ativas com atividade no mês', !semAtividade.length, semAtividade.length ? semAtividade.length + ' obras sem atividade: ' + semAtividade.slice(0, 6).map(o => o.nome).join('; ') + (semAtividade.length > 6 ? '…' : '') + '. O relatório pede o motivo.' : 'Todas as obras ativas tiveram atividade.', {route: 'obras'}, true),
        check('Situação das obras revisada na última semana', !desatualizadas.length, desatualizadas.length ? desatualizadas.length + ' obras ativas sem revisão há mais de 7 dias.' : 'Obras revisadas.', {route: 'obras'}, true),
        check('Cronograma do mês seguinte', c.agenda.length > 0, c.agenda.length + ' atividades previstas para ' + RelatorioMensalCPT.mesExtenso(RelatorioMensalCPT.proximoMes(mes)) + ' (item 12 do relatório).', {route: 'cronograma'}, true)
      ],
      historico: this.historicoGeracoes(mes), numeroSugerido: this.numeroSugerido(mes)};
  }

  historicoGeracoes(mes) {
    try {
      const a = SpreadsheetApp.openById(this.ctx.config.agendaId).getSheetByName('Entregas mensais'); if (!a || a.getLastRow() < 2) return [];
      return a.getRange(2, 1, a.getLastRow() - 1, 8).getValues().filter(r => String(r[1]) === mes).map(r => ({em: r[0] instanceof Date ? r[0].toISOString() : String(r[0]), versao: r[2], autor: String(r[4]), documento: String(r[5]), planilha: String(r[6]), avisos: String(r[7])})).reverse();
    } catch (_) { return []; }
  }

  pasta(mes) {
    const props = PropertiesService.getScriptProperties(), c = AplicacaoCPT.config();
    let raiz = null;
    if (c.pastaEntregasId) { try { raiz = DriveApp.getFolderById(c.pastaEntregasId); } catch (_) {} }
    if (!raiz) { raiz = DriveApp.createFolder('CPT • Entregas mensais'); c.pastaEntregasId = raiz.getId(); props.setProperty(AplicacaoCPT.chave, JSON.stringify(c)); }
    const it = raiz.getFoldersByName(mes); return it.hasNext() ? it.next() : raiz.createFolder(mes);
  }

  gerar(p) {
    if (!p || typeof p.operacaoId !== 'string' || !/^OP-[a-zA-Z0-9-]{12,70}$/.test(p.operacaoId)) throw new Error('Identificação do pedido inválida. Reabra o fechamento.');
    const mes = this.dados.mes(String(p.mes || '')), numero = p.numero === '' || p.numero == null ? '' : Number(p.numero);
    if (numero !== '' && (!Number.isInteger(numero) || numero < 1 || numero > 999)) throw new Error('Número do relatório inválido.');
    const ss = SpreadsheetApp.openById(this.ctx.config.agendaId), cab = ['Gerado em', 'Competência', 'Versão', 'Operação ID', 'Autor', 'Documento', 'Planilha de apoio aos anexos', 'Avisos', 'Número'];
    let log = ss.getSheetByName('Entregas mensais');
    if (!log) { log = ss.insertSheet('Entregas mensais'); log.getRange(1, 1, 1, cab.length).setValues([cab]); log.setFrozenRows(1); }
    const anteriores = log.getLastRow() > 1 ? log.getRange(2, 1, log.getLastRow() - 1, 9).getValues() : [];
    const repetido = anteriores.find(r => String(r[3]) === p.operacaoId);
    if (repetido) return {resultado: 'Esta base já foi gerada.', documento: String(repetido[5]), planilha: String(repetido[6]), versao: repetido[2]};
    const cache = CacheService.getScriptCache(), chave = 'cpt:relatorio:' + mes;
    if (cache.get(chave)) throw new Error('Já existe uma geração deste mês em andamento. Aguarde alguns minutos.');
    cache.put(chave, this.ctx.email, 360);
    try {
      const inicio = Date.now(), c = this.coletar(mes), avisos = [];
      const versao = anteriores.filter(r => String(r[1]) === mes).length + 1, pasta = this.pasta(mes);
      const planilha = this.planilhaAnexos(c, pasta, versao);
      const doc = new DocumentoRelatorioCPT(c, {numero, versao, autor: this.ctx.perfil.nome, inicio, equipe: PerfisCPT.lista(this.ctx.config).filter(x => x.ativo), sat: this.satisfacao(c)}).montar(pasta, avisos);
      log.getRange(log.getLastRow() + 1, 1, 1, cab.length).setValues([[new Date(), mes, versao, p.operacaoId, this.ctx.email, doc, planilha, avisos.join(' | '), numero]]);
      return {resultado: 'Base do relatório de ' + RelatorioMensalCPT.mesExtenso(mes) + ' gerada (versão ' + versao + ').', documento: doc, planilha, versao, avisos};
    } finally { cache.remove(chave); }
  }

  /** Legenda do Orientador: Em andamento / Concluído / Não procede. */
  static statusManifestacao(c) { return /nao procede|improcedent/.test(RelatorioMensalCPT.norm(c.procedencia + ' ' + c.status)) ? 'Não procede' : c.concluido ? 'Concluído' : 'Em andamento'; }
  static linhasManifestacoes(c) {
    return c.casos.slice().sort((a, b) => a.abertura.localeCompare(b.abertura)).map(x => [RelatorioMensalCPT.br(x.abertura), x.nome, x.endereco, x.canal || x.origem, x.tipo || x.assunto, x.obra,
      String(x.proximaAcao || ''), String(typeof x.atualizacao === 'string' ? x.atualizacao : JSON.stringify(x.atualizacao || '')).slice(0, 500), RelatorioMensalCPT.statusManifestacao(x), x.protocolo]);
  }
  /**
   * Planilha de apoio aos Anexos, no mesmo formato da planilha oficial "Anexos do relatório":
   * - Controle de manifestações (mesmas 10 colunas), para copiar e colar;
   * - Indicadores — prévia do mês: o que dá para calcular dos registros, com a regra de cada número.
   * A planilha oficial (Indicadores 2026) NÃO é alterada: a conferência e a transcrição continuam humanas.
   */
  planilhaAnexos(c, pasta, versao) {
    const ss = SpreadsheetApp.create(c.mes + '_Apoio_Anexos_v' + versao), m = ss.getSheets()[0];
    const cabM = ['Data', 'Nome', 'Endereço', 'Canal', 'Tipo de Manifestação', 'Frente de obra', 'Histórico', 'Providência', 'Status', 'Obs.:'];
    const linhas = RelatorioMensalCPT.linhasManifestacoes(c);
    m.setName('Controle de manifestações'); m.getRange(1, 1, 1, cabM.length).setValues([cabM]).setFontWeight('bold').setBackground('#12678f').setFontColor('#ffffff');
    if (linhas.length) m.getRange(2, 1, linhas.length, cabM.length).setValues(linhas);
    m.setFrozenRows(1); m.getRange(1, 1, Math.max(1, linhas.length + 1), cabM.length).setWrap(true).setVerticalAlignment('top');
    const ind = ss.insertSheet('Indicadores — prévia'), cabI = ['Grupo', 'Indicador (como na planilha oficial)', 'Valor calculado', 'Como foi calculado', 'Conferido / valor final'];
    const lin = this.indicadores(c).map(x => [x.grupo, x.nome, x.valor === null ? 'Informar' : x.valor, x.regra, '']);
    ind.getRange(1, 1, 1, cabI.length).setValues([cabI]).setFontWeight('bold').setBackground('#12678f').setFontColor('#ffffff');
    ind.getRange(2, 1, lin.length, cabI.length).setValues(lin); ind.setFrozenRows(1); ind.getRange(1, 1, lin.length + 1, cabI.length).setWrap(true).setVerticalAlignment('top');
    ind.getRange(lin.length + 3, 1).setValue('Prévia gerada pela Aplicação CPT. Confira cada valor antes de transcrever para "Indicadores 2026"; os itens "Informar" não existem nos registros.');
    DriveApp.getFileById(ss.getId()).moveTo(pasta);
    return ss.getUrl();
  }
  /** Indicadores da planilha oficial que podem ser estimados a partir dos registros do mês. null = informar manualmente. */
  indicadores(c) {
    const R = RelatorioMensalCPT, mes = c.mes, at = c.atividades, conta = re => at.filter(r => re.test(r.texto)).length;
    const abertas = c.casos.filter(x => x.abertura.startsWith(mes)), tipo = re => abertas.filter(x => re.test(R.norm(x.tipo || x.assunto))).length;
    const soma = lista => lista.reduce((n, r) => n + (r.publico || 0), 0), ums = at.filter(r => /\bums\b|unidade movel|tenda/.test(r.texto));
    const manual = (grupo, nome) => ({grupo, nome, valor: null, regra: 'Não há registro na aplicação; informar.'});
    return [
      manual('Gerenciais', 'Total de comunidades mapeadas'), manual('Gerenciais', 'Total de economias cadastradas no mês'),
      {grupo: 'Manifestações', nome: 'Manifestações abertas', valor: abertas.length, regra: 'Casos principais com data de abertura no mês.'},
      {grupo: 'Manifestações', nome: 'Solicitação', valor: tipo(/solicita/), regra: 'Abertas no mês com tipo/assunto contendo "solicitação".'},
      {grupo: 'Manifestações', nome: 'Reclamação', valor: tipo(/reclama|transtorno|dano/), regra: 'Abertas no mês com tipo/assunto de reclamação, transtorno ou dano.'},
      {grupo: 'Manifestações', nome: 'Elogio', valor: tipo(/elogio/), regra: 'Abertas no mês com tipo/assunto "elogio".'},
      {grupo: 'Manifestações', nome: 'Concluídas', valor: c.casos.filter(x => x.concluido && x.conclusao.startsWith(mes)).length, regra: 'Casos com conclusão no mês.'},
      {grupo: 'Manifestações', nome: 'Não procedente', valor: c.casos.filter(x => R.statusManifestacao(x) === 'Não procede').length, regra: 'Casos com status "não procede" no período.'},
      manual('Governança Colaborativa', 'Total de parceiros'), manual('Governança Colaborativa', 'Total de projetos de geração de renda'),
      {grupo: 'Governança Colaborativa', nome: 'Total de grupos de Governança', valor: conta(/governanca|comite|conselho/), regra: 'Atividades do mês que citam governança, comitê ou conselho (conferir se são grupos novos).'},
      manual('Governança Colaborativa', 'Total de pontos revitalizados'), manual('Governança Colaborativa', 'Qtd. lixo retirado de ponto viciado (kg)'),
      manual('Social', 'Trabalhadores contratados na comunidade (total, mulheres, homens, não identificado)'),
      manual('Atividade Socioambiental', 'Óleo de cozinha enviado para reciclagem (litros)'), manual('Atividade Socioambiental', 'Material enviado à reciclagem (kg)'),
      manual('Atividade Socioambiental', 'Coletores de material reciclável instalados'), manual('Atividade Socioambiental', 'Plantio (mudas)'),
      {grupo: 'Atividade Socioambiental', nome: 'Total de participantes em ações de Educação Socioambiental', valor: soma(at), regra: 'Soma do público informado nas atividades do mês (sem pesquisas e atendimentos). ' + at.filter(r => r.publico == null).length + ' atividades sem público informado.'},
      {grupo: 'Atividade Socioambiental', nome: 'Total de ações socioambientais', valor: at.length, regra: 'Registros de atividade do mês (sem pesquisas de satisfação e atendimentos).'},
      {grupo: 'Comunicação Social', nome: 'Total de comunicados entregues para vistoria cautelar', valor: c.registros.filter(r => /vistoria cautelar/.test(R.norm(r.procedimento))).length, regra: 'Quantidade de registros de Acompanhamento de Vistoria Cautelar (conferir se cada registro equivale a um comunicado).'},
      manual('Comunicação Social', 'Publicações na mídia'), manual('Comunicação Social', 'Ferramentas de comunicação criadas'),
      manual('Comunicação Social', 'Materiais impressos entregues'), manual('Comunicação Social', 'Vídeos produzidos'),
      ...[['Norma de Conduta', /normas? de conduta/], ['Relacionamento com a comunidade', /relacionamento com a comunidade/], ['Violência de Gênero', /violencia de genero/],
        ['Informe de canais de denúncia', /canais? de denuncia/], ['Abuso e exploração de menores', /abuso|exploracao de menores/], ['Fluxo de imprensa', /imprensa/], ['Diversidade e inclusão', /diversidade|inclusao/]]
        .map(([nome, re]) => ({grupo: 'Treinamento com público interno', nome, valor: conta(re), regra: 'Atividades do mês que citam o tema.'})),
      {grupo: 'Atendimento UMS / Tenda', nome: 'Total de atendimentos', valor: soma(ums), regra: 'Soma do público das atividades que citam UMS, unidade móvel ou tenda (' + ums.length + ' atividades).'}
    ];
  }
}

/** Monta o Google Docs no formato do Orientador (Arial 12; títulos em negrito; quadros Arial 10; fotos a 6 cm). */
class DocumentoRelatorioCPT {
  constructor(c, op) { this.c = c; this.op = op; this.foto = 0; }
  static get CM6() { return 170; } // 6 cm em pontos
  static fonte(tamanho, negrito, italico, cor) {
    const A = DocumentApp.Attribute, a = {};
    a[A.FONT_FAMILY] = 'Arial'; a[A.FONT_SIZE] = tamanho; a[A.BOLD] = !!negrito; a[A.ITALIC] = !!italico; a[A.FOREGROUND_COLOR] = cor || '#000000';
    return a;
  }
  p(texto, opcoes = {}) {
    const par = this.body.appendParagraph(texto || '');
    if (opcoes.titulo) par.setHeading(opcoes.titulo);
    par.setAttributes(DocumentoRelatorioCPT.fonte(opcoes.tamanho || 12, opcoes.negrito, opcoes.italico, opcoes.cor));
    par.setSpacingBefore(opcoes.antes ?? 0).setSpacingAfter(opcoes.depois ?? 6).setLineSpacing(opcoes.linha ?? 1.5);
    if (opcoes.centro) par.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    return par;
  }
  // Títulos como Cabeçalho 1/2 (aparecem no sumário do Docs), com o estilo do Orientador: Arial 12 negrito, 12pt antes / 6pt depois.
  titulo(texto, nivel = 1) { return this.p(texto, {negrito: true, antes: 12, depois: 6, titulo: nivel === 1 ? DocumentApp.ParagraphHeading.HEADING1 : DocumentApp.ParagraphHeading.HEADING2}); }
  completar(texto) { return this.p('[COMPLETAR] ' + texto, {italico: true, cor: '#9c251b'}); }
  quadro(cabecalho, linhas, vazio) {
    const dados = [cabecalho, ...(linhas.length ? linhas : [[vazio || 'Não houve no período.', ...cabecalho.slice(1).map(() => '')]])].map(r => r.map(v => String(v == null ? '' : v)));
    const t = this.body.appendTable(dados);
    t.setAttributes(DocumentoRelatorioCPT.fonte(10));
    t.getRow(0).setAttributes(DocumentoRelatorioCPT.fonte(10, true));
    for (let i = 0; i < t.getRow(0).getNumCells(); i++) t.getRow(0).getCell(i).setBackgroundColor('#e8eef3');
    for (let r = 0; r < t.getNumRows(); r++) for (let i = 0; i < t.getRow(r).getNumCells(); i++) t.getRow(r).getCell(i).setPaddingTop(2).setPaddingBottom(2);
    this.p('', {depois: 0});
    return t;
  }
  fotos(lista, avisos) {
    // Quadro de 2 colunas: foto (6 cm) e legenda numerada em sequência única no documento.
    for (let i = 0; i < lista.length; i += 2) {
      if (Date.now() - this.op.inicio > 240000) { this.completar('Inserir as fotos restantes (tempo de geração esgotado). ' + lista.slice(i).map(f => f.url).join(' ')); avisos.push('Fotos não inseridas por tempo'); return; }
      const par = lista.slice(i, i + 2), t = this.body.appendTable([par.map(() => ''), par.map(() => '')]);
      par.forEach((f, j) => {
        const celula = t.getRow(0).getCell(j), legenda = t.getRow(1).getCell(j); this.foto++;
        try {
          const arq = DriveApp.getFileById(f.id);
          if (!/^image\//.test(arq.getMimeType())) throw new Error('não é imagem');
          if (arq.getSize() > 8 * 1024 * 1024) throw new Error('arquivo maior que 8 MB');
          const img = celula.appendImage(arq.getBlob()), w = img.getWidth(), h = img.getHeight();
          img.setHeight(DocumentoRelatorioCPT.CM6).setWidth(Math.round(w * DocumentoRelatorioCPT.CM6 / h));
        } catch (e) { celula.setText('[Foto não inserida: ' + e.message + '] ' + f.url); avisos.push('Foto ' + this.foto + ': ' + e.message); }
        legenda.setText('Foto ' + this.foto + ' – ' + (f.legenda || '[COMPLETAR legenda]'));
      });
      t.setAttributes(DocumentoRelatorioCPT.fonte(10));
      this.p('', {depois: 0});
    }
  }
  montar(pasta, avisos) {
    const c = this.c, R = RelatorioMensalCPT, br = R.br, mesTxt = R.mesExtenso(c.mes);
    const doc = DocumentApp.create(c.mes + '_Relatorio_Socioambiental_Comunicacao_BASE_v' + this.op.versao);
    this.body = doc.getBody(); this.body.setMarginLeft(56).setMarginRight(56);
    const participantes = c.atividades.reduce((n, r) => n + (r.publico || 0), 0), frentes = [...new Set(c.atividades.map(r => r.frente))];

    // Capa
    this.p('CONSÓRCIO PERFORMANCE TAMANDUATEÍ', {negrito: true, centro: true, antes: 60});
    this.p('RELATÓRIO MENSAL DE COMUNICAÇÃO SOCIAL E SOCIOAMBIENTAL', {negrito: true, centro: true});
    this.p('Diretoria de Gestão de Empreendimentos de Esgoto da RMSP', {centro: true});
    this.p('Relatório nº ' + (this.op.numero || '[COMPLETAR]') + ' — Competência: ' + mesTxt, {centro: true, antes: 24});
    this.p('Documento-base gerado pela Aplicação CPT em ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm') + ' por ' + this.op.autor + ' (versão ' + this.op.versao + '). Revisar antes de assinar; transferir para o papel timbrado.', {italico: true, tamanho: 10, centro: true, antes: 24});
    this.quadro(['', 'Nome', 'Cargo', 'Assinatura'], [['Elaborado', '', '', ''], ['Revisto', '', '', ''], ['Aprovado', '', '', '']]);
    this.body.appendPageBreak();

    this.titulo('Introdução');
    this.p('No período de 01 a ' + new Date(Date.UTC(Number(c.mes.slice(0, 4)), Number(c.mes.slice(5, 7)), 0)).getUTCDate() + ' de ' + mesTxt + ', foram registradas ' + c.atividades.length + ' atividades de comunicação social e socioambiental em ' + frentes.length + ' frentes de serviço, com ' + participantes + ' participações informadas, além de ' + this.op.sat.total + ' pesquisas de satisfação e ' + c.casos.length + ' manifestações em acompanhamento no período.');
    this.completar('Parágrafo de continuidade com o período anterior, características do mês e considerações de Comunicação e Socioambiental (PTS e PCS).');

    this.titulo('1. Áreas de Trabalho');
    const ativas = c.obras.filter(o => ['Em andamento', 'Paralisada'].includes(o.situacao) || (o.situacao === 'Finalizada' && o.termino.startsWith(c.mes)))
      .sort((a, b) => b.inicioObra.localeCompare(a.inicioObra));
    this.quadro(['Frente de Serviço', 'Tipo de obra', 'Início', 'Término', 'Bairros', 'Tipo de público', 'Impacto', 'Início comunicação', 'Observação'],
      ativas.map(o => [o.nome, o.tipo || o.metodoPAC16, br(o.inicioObra), br(o.termino) || (o.situacao === 'Paralisada' ? 'Paralisada' : 'Em andamento'), o.bairros.join(', '), o.publico, o.impacto, br(o.inicioComunicacao), o.observacao]), 'Nenhuma obra ativa cadastrada.');

    this.titulo('2. Diagnóstico das áreas de trabalho');
    this.completar('Inserir somente diagnósticos novos ou atualizados no mês (quadro "Diagnóstico local"). Para os anteriores, citar o relatório em que foram atualizados. Incluir foto do pavimento atual.');
    this.titulo('2.1 Matriz de Contatos', 2);
    this.p('A matriz atualizada de contatos institucionais e lideranças locais consta no ANEXO 1 – Matriz de contatos.');

    this.titulo('3. Atividades desenvolvidas no período');
    const linhas3 = c.atividades.slice().sort((a, b) => a.frente.localeCompare(b.frente, 'pt-BR') || a.data.localeCompare(b.data))
      .map(r => [r.frente, r.endereco, br(r.data), r.atividade || r.procedimento, r.ferramenta || 'Não se aplica', r.publicoAlvo || '[COMPLETAR]', r.publico == null ? '[COMPLETAR]' : String(r.publico)]);
    const comAtividade = new Set(c.atividades.filter(r => r.obraCadastro).map(r => r.obraCadastro.id));
    c.obras.filter(o => ['Em andamento', 'Paralisada'].includes(o.situacao) && !comAtividade.has(o.id))
      .forEach(o => linhas3.push([o.nome, o.endereco || o.logradouroPAC16, 'Não se aplica', '*Não houve atividade', 'Não se aplica', 'Não se aplica', '[COMPLETAR motivo' + (o.situacao === 'Paralisada' ? ': obra paralisada' : '') + ']']));
    linhas3.push(['Total', '', '', c.atividades.length + ' atividades', '', '', String(participantes)]);
    this.p('No período foram realizadas ' + c.atividades.length + ' atividades, com ' + participantes + ' participantes no total. Os números devem conferir com a Planilha de Indicadores (base do Programa Parceiros para o Impacto).');
    this.quadro(['Frente de Serviço', 'Endereço da Frente', 'Data', 'Atividade', 'Ferramenta', 'Público-alvo', 'Total de participantes'], linhas3);

    this.titulo('3.1 Descrição das atividades por frente de serviço', 2);
    let n = 0;
    frentes.sort((a, b) => a.localeCompare(b, 'pt-BR')).forEach(frente => {
      n++; this.titulo('3.1.' + n + ' ' + frente, 2);
      c.atividades.filter(r => r.frente === frente).sort((a, b) => a.data.localeCompare(b.data)).forEach(r => {
        const e = c.entregas.get(r.id);
        this.p((e && e.titulo) || ((r.atividade || r.procedimento) + ' — ' + br(r.data)), {negrito: true});
        if (e && e.texto) this.p(e.texto + (e.situacao !== 'pronto' ? ' [RASCUNHO — revisar]' : ''));
        else this.completar('Descrever a atividade de ' + br(r.data) + ' (' + (r.atividade || r.procedimento) + ', ' + (r.bairro || 'bairro não informado') + '). Registro ' + r.id + '.');
        const fotos = e && Array.isArray(e.fotos) ? e.fotos.map(f => ({id: f.id, legenda: f.legenda, url: 'https://drive.google.com/file/d/' + f.id + '/view'})) : [];
        if (fotos.length) this.fotos(fotos, avisos);
      });
      this.p('As listas de presença correspondentes às ações desta frente constam no ANEXO 2 – Listas de presença.', {italico: true, tamanho: 10});
    });
    if (!frentes.length) this.p('Não houve atividades registradas no período.');

    this.titulo('4. Desenvolvimento de Ações Socioambientais');
    this.p('Sugestão automática por palavras-chave da atividade. Conferir e mover itens entre os quadros antes de finalizar.', {italico: true, tamanho: 10, cor: '#9c251b'});
    R.eixos.forEach(eixo => {
      this.titulo(eixo.item + ' ' + eixo.titulo, 2);
      if (eixo.item === '4.5') this.completar('Descrever o trabalho de governança colaborativa do mês (articulações entre empresas, poder público e moradores).');
      const itens = c.atividades.filter(r => eixo.re.test(r.texto));
      this.quadro(['Data', 'Público-alvo', 'Atividade', 'Tema / frente', 'Número de participantes'], itens.map(r => [br(r.data), r.publicoAlvo || '[COMPLETAR]', r.atividade || r.procedimento, r.frente, r.publico == null ? '' : String(r.publico)]));
    });

    this.titulo('5. Material audiovisual');
    this.completar('Descrever o conteúdo de imagens e vídeos (antes, durante e depois das obras) compartilhado no mês e o canal utilizado. Se houver produção de vídeo, anexar roteiro aprovado.');
    this.titulo('6. Mapeamento de veículos de imprensa (regional)');
    this.completar('Atualizar o mapeamento de veículos regionais e indicar inclusões.');
    this.titulo('7. Atividades da Unidade Móvel Socioambiental (UMS)');
    const ums = c.atividades.filter(r => /ums|unidade movel/.test(r.texto));
    this.quadro(['Data', 'Local', 'Nº de pessoas', 'Material de comunicação', 'Público-alvo', 'Resultados'], ums.map(r => [br(r.data), r.endereco, r.publico == null ? '' : String(r.publico), r.ferramenta, r.publicoAlvo, '[COMPLETAR]']), 'Não houve atividade da UMS no período.');
    this.titulo('8. Obras concluídas');
    const concluidas = c.obras.filter(o => o.situacao === 'Finalizada' && o.termino && o.termino.startsWith(c.mes));
    this.quadro(['Obra/Região', 'Conclusão apresentada'], concluidas.map(o => [o.nome + (o.bairros.length ? ' — ' + o.bairros.join(', ') : ''), br(o.termino)]), 'Nenhuma obra concluída no período.');
    if (concluidas.length) this.completar('Inserir quadro comparativo de fotos antes/depois de cada obra concluída.');
    this.titulo('9. Atividades Complementares');
    const internas = c.atividades.filter(r => /dds|treinamento|interna|integracao|normas de conduta|violencia|diversidade|canal de denuncia|imprensa/.test(r.texto));
    this.quadro(['Data', 'Atividade', 'Tema', 'Participantes'], internas.map(r => [br(r.data), r.atividade || r.procedimento, r.frente, r.publico == null ? '' : String(r.publico)]), 'Não houve atividade complementar registrada.');
    this.p('Temas obrigatórios: Normas de Conduta; Relacionamento com a comunidade; Violência de Gênero; Abuso e exploração de menores; Canais de denúncia; Relacionamento com Imprensa; Diversidade e inclusão.', {tamanho: 10});

    this.titulo('10. Manifestações Locais e Sabesp');
    this.p('Manifestações em acompanhamento no período: ' + c.casos.length + ' (' + c.casos.filter(x => x.concluido).length + ' concluídas). A mesma tabela segue em planilha aberta para compilação. As fichas constam individualmente em PDF no ANEXO 4.');
    this.quadro(['Data', 'Nome', 'Endereço', 'Canal', 'Tipo de Manifestação', 'Frente de obra', 'Histórico', 'Providência', 'Status', 'Obs.'],
      R.linhasManifestacoes(c).map(r => [r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7].slice(0, 200), r[8], r[9]]), 'Nenhuma manifestação no período.');

    this.titulo('11. Equipe de Trabalho');
    this.p('Funcionários em contato com o cliente. RG e horário não são guardados na aplicação: completar no documento final.', {italico: true, tamanho: 10});
    this.quadro(['Nome completo', 'RG', 'Função', 'Horário de trabalho'], this.op.equipe.filter(x => x.papeis.some(p => p !== 'administrador')).map(x => [x.nome, '', x.papeis.filter(p => p !== 'administrador').map(p => PerfisCPT.nomes[p]).join(', '), '']));

    this.titulo('12. Atividades previstas para o período subsequente');
    this.quadro(['Data', 'Horário', 'Atividade', 'Frentes', 'Local'], c.agenda.map(e => [br(e.data), e.inicio ? e.inicio + '–' + e.fim : 'Dia todo', e.titulo, e.frentes.map(f => PerfisCPT.nomes[f] || f).join(', '), [e.obra, e.bairro].filter(Boolean).join(' — ')]), 'Cronograma do próximo mês ainda não cadastrado.');

    this.titulo('13. Anexos');
    ['ANEXO 1_Matriz de contatos', 'ANEXO 2_Listas de presença', 'ANEXO 3_Planilha de Resultados/Indicadores', 'ANEXO 4_Fichas de Atendimentos (PDF, individualmente)', 'ANEXO 5_Controle de manifestações (planilha aberta)'].forEach(a => this.p(a));
    this.p('Inserir folha de rosto com o nome de cada anexo, na ordem acima.', {italico: true, tamanho: 10});

    doc.saveAndClose();
    DriveApp.getFileById(doc.getId()).moveTo(pasta);
    return doc.getUrl();
  }
}

function conferirFechamentoCPT(mes) { return AplicacaoCPT.executar((d, ctx) => new RelatorioMensalCPT(ctx).conferir(String(mes || '')), 'fechamento.conferir'); }
function gerarBaseRelatorioCPT(p) { return AplicacaoCPT.executar((d, ctx) => new RelatorioMensalCPT(ctx).gerar(p), 'fechamento.gerar'); }
