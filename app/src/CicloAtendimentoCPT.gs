/**
 * CicloAtendimentoCPT 2.4.0. Fonte única dos casos: abas Atendimentos e Movimentações da Base Campo 4.0.
 * Ciclo: Abertura (formulário, automática no Campo 4.0) → Triagem/atualização (Atendimento) →
 *        Execução registrada (Execução ou Atendimento) → Finalização (Atendimento). Reabertura com motivo.
 * 2.4: dados da ficha lidos igualmente de casos novos e migrados (campos()), correção dos dados com histórico
 *      e incorporação de protocolo duplicado. Ficha oficial em PDF: FichaOficialCPT.
 * Encerramento por pesquisa de satisfação fica para uma etapa futura (não implementado).
 * Toda ação: autorização no servidor, trava, versão (Atualização operacional), operação idempotente e movimentação.
 */
class CicloAtendimentoCPT {
  static get status() { return ['Recebida', 'Em andamento', 'Concluída']; }
  static get procedencias() { return ['Em análise', 'Procedente', 'Não procedente']; }
  static get areas() { return ['Atendimento', 'Execução', 'Socioambiental', 'Comunicação', 'Gestão']; }
  static podeConduzir(p) { return PerfisCPT.gerencia(p) || p.papeis.includes('atendimento'); }
  /** A engenharia responde pelo formulário; na aplicação, quem conduz o caso registra execução em nome dela. */
  static podeExecutar(p) { return this.podeConduzir(p); }
  /** Telefone e e-mail do munícipe: só quem conduz o caso (Atendimento, Administrativo, Gestão). */
  static veContato(p) { return this.podeConduzir(p); }

  /** Campos que o Atendimento pode corrigir: [rótulo, tamanho máximo, aparece no histórico como "alterado" (dado de contato)]. */
  static get corrigiveis() {
    return {nome: ['Nome', 120], telefone: ['Telefone', 120, true], email: ['E-mail', 160, true], endereco: ['Endereço', 300], assunto: ['Assunto', 200],
      tipo: ['Tipo de manifestação', 60], canal: ['Canal de recebimento', 80], local: ['Local do atendimento', 200], solicitacao: ['Solicitação', 3000, true]};
  }
  /**
   * Dados da ficha num formato só, para casos abertos pelo formulário 4.0 (campos no topo do JSON)
   * e para os migrados do Controle antigo (oficiais / manuais / aberturas). Correções feitas na aplicação vencem.
   */
  static campos(d, r) {
    const N = DadosDaAplicacao.norm, txt = v => v instanceof Date ? v : String(v == null ? '' : v).trim();
    const pega = (o, ...k) => { if (!o) return ''; const m = new Map(Object.keys(o).map(x => [N(x), o[x]])); for (const n of k) { const v = m.get(N(n)); if (v != null && String(v).trim() !== '') return v; } return ''; };
    const o = ((d.oficiais || [])[0] || {}).campos, a = ((d.aberturas || [])[0] || {}).campos, m = ((d.manuais || []).slice(-1)[0] || {}).dados || {}, c = d.corrigido || {};
    const v = (k, oficial, manual, abertura, linha) => Object.prototype.hasOwnProperty.call(c, k) ? txt(c[k])
      : txt(d[k] || pega(o, ...oficial) || (manual ? m[manual] : '') || pega(a, ...abertura) || linha || '');
    const fotosNovas = (d.campos || []).filter(x => /foto|imagem|arquivo|video/.test(N(x.titulo)) || /drive\.google\.com/.test(String(x.valor)))
      .map(x => Array.isArray(x.valor) ? x.valor.join(' ') : String(x.valor || '')).join(' ');
    r = r || [];
    return {nome: v('nome', ['Nome'], 'nome', ['Nome do solicitante'], r[6]), telefone: v('telefone', ['Telefone'], 'telefone', ['Telefones']), email: v('email', ['E-mail'], 'email', ['E-mail']),
      endereco: v('endereco', ['Endereço'], 'endereco', ['Endereço do solicitante'], r[8]), assunto: v('assunto', ['Assunto'], 'assunto', ['Assunto'], r[7]),
      tipo: v('tipo', ['Tipo de manifestação'], 'tipo', ['Tipo de manifestação']), canal: v('canal', ['Canal de recebimento'], 'canalRecebimento', ['Canal de recebimento']),
      urgencia: v('urgencia', ['Grau de urgência'], '', ['Grau de urgência']), solicitacao: v('solicitacao', ['Solicitação'], 'solicitacao', ['Solicitação']),
      descricao: v('descricao', ['Descrição detalhada da reclamação'], '', ['Descrição detalhada da ocorrência']), tratativa: v('tratativa', [], 'tratativaInicial', ['Tratativa inicial']),
      local: v('local', ['Local do atendimento'], 'localAtendimento', ['Local']), horario: v('horario', ['Horário'], '', ['Horário do recebimento']),
      segmento: v('segmento', [], '', ['Segmento para encaminhamento']), responsavel: txt(r[11] || pega(o, 'Responsável pelo atendimento') || m.responsavel || pega(a, 'Responsável pelo registro')),
      fotosAbertura: [fotosNovas, pega(o, 'Fotos da abertura'), m.fotosAbertura, pega(a, 'Imagens/arquivos')].filter(Boolean).join(' '),
      solucaoAnterior: txt(pega(o, 'Solução') || m.solucao || ''), finalizacaoAnterior: txt(pega(o, 'Finalização') || m.finalizacao || ''),
      fotosSolucaoAnterior: txt(pega(o, 'Fotos da solução') || m.fotosSolucao || '')};
  }

  constructor(ctx) { this.ctx = ctx; this.dados = new DadosDaAplicacao(ctx.base, ctx.perfil); this.fuso = this.dados.fuso; }
  aba(nome) { const a = this.ctx.base.getSheetByName(nome); if (!a) throw new Error('Aba ' + nome + ' não encontrada na base.'); return a; }
  static json(v) { try { return JSON.parse(v || '{}') || {}; } catch (_) { return {}; } }
  versao(r) { return r[13] instanceof Date ? r[13].toISOString() : String(r[13] || ''); }

  localizar(protocolo) {
    if (typeof protocolo !== 'string' || !/^[A-Z0-9-]{3,30}$/i.test(protocolo)) throw new Error('Protocolo inválido.');
    const a = this.dados.atendimentos(), n = a.getLastRow() - 1, ids = n > 0 ? a.getRange(2, 1, n, 1).getValues() : [];
    const i = ids.findIndex(x => String(x[0]) === protocolo); if (i < 0) throw new Error('Protocolo não encontrado.');
    const linha = i + 2, r = a.getRange(linha, 1, 1, 20).getValues()[0];
    if (r[1] && String(r[1]) !== protocolo) throw new Error('Este protocolo foi incorporado ao ' + r[1] + '. Atualize o caso principal.');
    return {a, linha, r};
  }
  /** Detalhe completo para a tela: resumo, dados da abertura, permissões e versão para controle de conflito. */
  detalhe(protocolo) {
    if (!/^[A-Z0-9-]{3,30}$/i.test(protocolo)) throw new Error('Protocolo inválido.');
    const base = this.dados.ficha(protocolo), principal = base.ficha.protocolo, {r} = this.localizar(principal), d = CicloAtendimentoCPT.json(r[19]), p = this.ctx.perfil;
    const contato = CicloAtendimentoCPT.veContato(p), c = CicloAtendimentoCPT.campos(d, r), conduz = CicloAtendimentoCPT.podeConduzir(p);
    const abertura = {tipo: c.tipo, canal: c.canal, urgencia: c.urgencia, solicitacao: c.solicitacao, descricao: c.descricao !== c.solicitacao ? c.descricao : '', tratativa: c.tratativa,
      local: c.local, segmento: c.segmento, registroId: d.registroId || '', telefone: contato ? c.telefone : '', email: contato ? c.email : '', contatoOculto: !contato && !!(c.telefone || c.email),
      execucoesAntigas: c.solucaoAnterior, conclusaoAntiga: c.finalizacaoAnterior};
    // Valores atuais para o formulário de correção (só para quem conduz o caso).
    const correcao = conduz ? Object.fromEntries(Object.keys(CicloAtendimentoCPT.corrigiveis).map(k => [k, c[k] instanceof Date ? '' : c[k]])) : null;
    return {...base, abertura, correcao, procedencia: d.procedencia || 'Em análise', versao: this.versao(r), fichaAtualizada: !!(d.fichaHash && r[15]), opcoes: {status: CicloAtendimentoCPT.status, procedencias: CicloAtendimentoCPT.procedencias, areas: CicloAtendimentoCPT.areas},
      pode: {atualizar: conduz, executar: CicloAtendimentoCPT.podeExecutar(p), finalizar: conduz, reabrir: conduz, corrigir: conduz, incorporar: conduz, fichaOficial: conduz}};
  }
  static texto(v, max, campo, obrigatorio) {
    if (v == null) v = '';
    if (typeof v !== 'string' || v.length > max || (obrigatorio && !v.trim())) throw new Error('Confira o campo ' + campo + (obrigatorio ? ' (obrigatório)' : '') + '.');
    return v.trim();
  }
  static data(v, campo) {
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || new Date(v + 'T12:00:00Z').toISOString().slice(0, 10) !== v) throw new Error('Data inválida em ' + campo + '.');
    return v;
  }
  /** Executa uma ação com conflito de versão e idempotência. aplicar(r, d) devolve {tipo, resumo, detalhes}. */
  agir(p, permissao, aplicar) {
    if (!p || typeof p.operacaoId !== 'string' || !/^OP-[a-zA-Z0-9-]{12,70}$/.test(p.operacaoId)) throw new Error('Identificação da operação inválida. Feche e abra a ficha novamente.');
    if (!permissao) throw new Error('Seu perfil não permite esta ação no caso.');
    const m = this.aba('Movimentações'), idMov = 'MOV-APP-' + p.operacaoId.slice(3), n = m.getLastRow() - 1;
    if (n > 0 && m.getRange(2, 1, n, 1).getValues().some(x => String(x[0]) === idMov)) return {resultado: 'Esta ação já foi registrada.', repetida: true};
    const {a, linha, r} = this.localizar(String(p.protocolo || ''));
    if (String(p.versao || '') !== this.versao(r)) throw new Error('Este caso foi atualizado por outra pessoa. Seu texto continua na tela: copie, feche e abra a ficha para ver a versão atual.');
    const d = CicloAtendimentoCPT.json(r[19]), novo = r.slice(), ev = aplicar(novo, d), agora = new Date();
    novo[13] = agora; novo[19] = JSON.stringify(d).slice(0, 49000);
    a.getRange(linha, 1, 1, 20).setValues([novo]);
    m.getRange(m.getLastRow() + 1, 1, 1, 10).setValues([[idMov, r[0], agora, ev.tipo, novo[3], this.ctx.perfil.nome + ' <' + this.ctx.email + '>', ev.resumo.slice(0, 1000), 'Aplicação CPT', '', JSON.stringify(ev.detalhes || {})]]);
    CicloAtendimentoCPT.invalidar();
    return {resultado: ev.mensagem, versao: agora.toISOString(), status: novo[3], procedencia: d.procedencia};
  }
  /** As consultas em cache (Visão do mês, carteira) passam a ler o estado novo. */
  static invalidar() { const p = PropertiesService.getScriptProperties(); p.setProperty('CPT_ATD_VERSAO', String(Number(p.getProperty('CPT_ATD_VERSAO') || 0) + 1)); }

  atualizar(p) {
    const T = CicloAtendimentoCPT.texto;
    return this.agir(p, CicloAtendimentoCPT.podeConduzir(this.ctx.perfil), (r, d) => {
      if (/conclu/i.test(String(r[3]))) throw new Error('O caso está concluído. Use Reabrir para alterar.');
      const status = T(p.status, 20, 'Situação', true), procedencia = T(p.procedencia, 20, 'Procedência', true), area = T(p.area, 30, 'Área responsável', true);
      if (status === 'Concluída') throw new Error('Para concluir, use Finalizar ficha.');
      if (!CicloAtendimentoCPT.status.includes(status) || !CicloAtendimentoCPT.procedencias.includes(procedencia) || !CicloAtendimentoCPT.areas.includes(area)) throw new Error('Escolha os valores das listas.');
      const proxima = T(p.proximaAcao, 500, 'Próxima ação', true), responsavel = T(p.responsavel, 120, 'Responsável', false), obs = T(p.observacao, 2000, 'Observação', false);
      const mudancas = [['Situação', r[3], status], ['Procedência', d.procedencia || 'Em análise', procedencia], ['Área', r[10], area], ['Próxima ação', r[12], proxima], ['Responsável', r[11], responsavel || r[11]]]
        .filter(([, a, b]) => String(a || '') !== String(b || '')).map(([k, a, b]) => k + ': ' + (a || '—') + ' → ' + b);
      if (!mudancas.length && !obs) throw new Error('Nada foi alterado.');
      r[3] = status; r[10] = area; r[12] = proxima; if (responsavel) r[11] = responsavel; d.procedencia = procedencia;
      return {tipo: 'Atualização', resumo: [mudancas.join(' · '), obs].filter(Boolean).join('\n'), detalhes: {mudancas, observacao: obs}, mensagem: 'Caso atualizado.'};
    });
  }
  registrarExecucao(p) {
    const T = CicloAtendimentoCPT.texto;
    return this.agir(p, CicloAtendimentoCPT.podeExecutar(this.ctx.perfil), (r, d) => {
      if (/conclu/i.test(String(r[3]))) throw new Error('O caso está concluído. Peça ao Atendimento para reabrir antes de registrar nova execução.');
      const feito = T(p.feito, 3000, 'O que foi feito', true), dataExec = CicloAtendimentoCPT.data(p.data, 'Data da execução'), por = T(p.executadoPor, 120, 'Executado por', true);
      const evid = T(p.evidencias, 1500, 'Evidências', false), links = (evid.match(/https:\/\/(?:drive|docs)\.google\.com\/[^\s]+/g) || []);
      if (dataExec > Utilities.formatDate(new Date(), this.fuso, 'yyyy-MM-dd')) throw new Error('A data da execução não pode ser futura.');
      r[3] = 'Em andamento'; r[10] = 'Atendimento'; r[12] = 'Conferir execução e finalizar ficha';
      d.execucoes = (d.execucoes || []).concat([{data: dataExec, por, feito: feito.slice(0, 1500), evidencias: links.join(' '), registradoPor: this.ctx.email}]).slice(-20);
      return {tipo: 'Execução', resumo: feito + '\nExecutado por ' + por + ' em ' + dataExec.split('-').reverse().join('/') + (links.length ? '\nEvidências: ' + links.join(' ') : ''),
        detalhes: {data: dataExec, executadoPor: por, evidencias: evid, links}, mensagem: 'Execução registrada. O Atendimento confere e finaliza a ficha.'};
    });
  }
  finalizar(p) {
    const T = CicloAtendimentoCPT.texto;
    return this.agir(p, CicloAtendimentoCPT.podeConduzir(this.ctx.perfil), (r, d) => {
      if (/conclu/i.test(String(r[3]))) throw new Error('O caso já está concluído.');
      const conclusao = T(p.conclusao, 3000, 'Conclusão', true), dataFim = CicloAtendimentoCPT.data(p.data, 'Data de conclusão'), procedencia = T(p.procedencia, 20, 'Procedência', true);
      if (!['Procedente', 'Não procedente'].includes(procedencia)) throw new Error('Na finalização, a procedência é Procedente ou Não procedente.');
      const abertura = r[4] instanceof Date ? Utilities.formatDate(r[4], this.fuso, 'yyyy-MM-dd') : String(r[4] || '').slice(0, 10);
      if (dataFim > Utilities.formatDate(new Date(), this.fuso, 'yyyy-MM-dd')) throw new Error('A data de conclusão não pode ser futura.');
      if (abertura && dataFim < abertura) throw new Error('A conclusão não pode ser antes da abertura (' + abertura.split('-').reverse().join('/') + ').');
      if (procedencia === 'Procedente' && !(d.execucoes || []).length && p.semExecucao !== true) throw new Error('Não há execução registrada. Registre a execução ou confirme que o caso foi resolvido sem execução.');
      r[3] = 'Concluída'; r[5] = new Date(dataFim + 'T12:00:00'); r[12] = ''; r[10] = 'Atendimento'; d.procedencia = procedencia; d.conclusao = conclusao;
      return {tipo: 'Finalização', resumo: procedencia + ' · ' + conclusao, detalhes: {data: dataFim, procedencia, conclusao, semExecucao: p.semExecucao === true}, mensagem: 'Ficha finalizada.'};
    });
  }
  /** Corrige dados da abertura (nome, contato, endereço, assunto, solicitação…). O original continua no JSON e no histórico. */
  corrigir(p) {
    const T = CicloAtendimentoCPT.texto, C = CicloAtendimentoCPT.corrigiveis;
    return this.agir(p, CicloAtendimentoCPT.podeConduzir(this.ctx.perfil), (r, d) => {
      const motivo = T(p.motivo, 500, 'Motivo da correção', true), atual = CicloAtendimentoCPT.campos(d, r), novos = p.dados && typeof p.dados === 'object' ? p.dados : {}, mud = [], campos = [];
      d.corrigido = d.corrigido || {};
      Object.keys(C).forEach(k => {
        if (!Object.prototype.hasOwnProperty.call(novos, k)) return;
        const [rotulo, max, reservado] = C[k], valor = T(novos[k], max, rotulo, false);
        if (valor === String(atual[k] instanceof Date ? '' : atual[k] || '')) return;
        if (k === 'email' && valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) throw new Error('Confira o e-mail.');
        d.corrigido[k] = valor; campos.push(k);
        mud.push(rotulo + (reservado ? ': alterado' : ': ' + (atual[k] || '—') + ' → ' + (valor || '—')));
      });
      if (!mud.length) throw new Error('Nada foi alterado.');
      if (campos.includes('nome')) r[6] = d.corrigido.nome; if (campos.includes('assunto')) r[7] = d.corrigido.assunto; if (campos.includes('endereco')) r[8] = d.corrigido.endereco;
      d.fichaHash = '';
      return {tipo: 'Correção de ficha', resumo: mud.join(' · ') + '\nMotivo: ' + motivo, detalhes: {campos, motivo}, mensagem: 'Dados corrigidos. Gere a ficha oficial de novo para o PDF trazer a correção.'};
    });
  }
  /** Incorpora um protocolo duplicado a este caso (mesma demanda registrada duas vezes). */
  incorporar(p) {
    const T = CicloAtendimentoCPT.texto;
    return this.agir(p, CicloAtendimentoCPT.podeConduzir(this.ctx.perfil), (r, d) => {
      const outro = T(p.outro, 30, 'Protocolo a incorporar', true).toUpperCase(), motivo = T(p.motivo, 500, 'Motivo', true), principal = String(r[0]);
      if (outro === principal) throw new Error('Escolha um protocolo diferente deste caso.');
      const alvo = this.localizar(outro), filhos = alvo.a.getRange(2, 1, alvo.a.getLastRow() - 1, 2).getValues().filter(x => String(x[1]) === outro && String(x[0]) !== outro);
      if (filhos.length) throw new Error('O ' + outro + ' já tem protocolos incorporados. Incorpore este caso a ele, no sentido contrário.');
      const o = alvo.r.slice(), agora = new Date(); o[1] = principal; o[2] = 'Incorporado'; o[13] = agora;
      alvo.a.getRange(alvo.linha, 1, 1, 20).setValues([o]);
      this.aba('Movimentações').appendRow(['MOV-APP-' + p.operacaoId.slice(3) + '-I', outro, agora, 'Vínculo de protocolos', String(o[3]), this.ctx.perfil.nome + ' <' + this.ctx.email + '>', 'Incorporado ao ' + principal + '. Motivo: ' + motivo, 'Aplicação CPT', '', '{}']);
      d.incorporados = (d.incorporados || []).concat([outro]);
      return {tipo: 'Vínculo de protocolos', resumo: outro + ' incorporado a este caso. Motivo: ' + motivo, detalhes: {outro, motivo}, mensagem: outro + ' agora aponta para este caso.'};
    });
  }
  reabrir(p) {
    const T = CicloAtendimentoCPT.texto;
    return this.agir(p, CicloAtendimentoCPT.podeConduzir(this.ctx.perfil), (r, d) => {
      if (!/conclu/i.test(String(r[3]))) throw new Error('O caso não está concluído.');
      const motivo = T(p.motivo, 1000, 'Motivo da reabertura', true);
      r[3] = 'Em andamento'; r[5] = ''; r[12] = T(p.proximaAcao, 500, 'Próxima ação', true); d.reaberturas = (d.reaberturas || 0) + 1;
      return {tipo: 'Reabertura', resumo: motivo, detalhes: {motivo}, mensagem: 'Caso reaberto. A conclusão anterior continua no histórico.'};
    });
  }
}

function abrirAtendimentoCPT(protocolo) { return AplicacaoCPT.executar((d, ctx) => new CicloAtendimentoCPT(ctx).detalhe(String(protocolo || '')), 'atendimentos.detalhe'); }
function acaoAtendimentoCPT_(nome, p, metodo) {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(15000)) throw new Error('Há outro salvamento em andamento. Seu texto continua na tela: tente novamente.');
  try { return AplicacaoCPT.executar((d, ctx) => new CicloAtendimentoCPT(ctx)[metodo](p), nome); } finally { lock.releaseLock(); }
}
function atualizarAtendimentoCPT(p) { return acaoAtendimentoCPT_('atendimentos.atualizar', p, 'atualizar'); }
function registrarExecucaoCPT(p) { return acaoAtendimentoCPT_('atendimentos.execucao', p, 'registrarExecucao'); }
function finalizarAtendimentoCPT(p) { return acaoAtendimentoCPT_('atendimentos.finalizar', p, 'finalizar'); }
function reabrirAtendimentoCPT(p) { return acaoAtendimentoCPT_('atendimentos.reabrir', p, 'reabrir'); }
function corrigirAtendimentoCPT(p) { return acaoAtendimentoCPT_('atendimentos.corrigir', p, 'corrigir'); }
function incorporarAtendimentoCPT(p) { return acaoAtendimentoCPT_('atendimentos.incorporar', p, 'incorporar'); }
