/**
 * CicloAtendimentoCPT 2.3.0. Fonte única dos casos: abas Atendimentos e Movimentações da Base Campo 4.0.
 * Ciclo: Abertura (formulário, automática no Campo 4.0) → Triagem/atualização (Atendimento) →
 *        Execução registrada (Execução ou Atendimento) → Finalização (Atendimento). Reabertura com motivo.
 * Encerramento por pesquisa de satisfação fica para uma etapa futura (não implementado).
 * Toda ação: autorização no servidor, trava, versão (Atualização operacional), operação idempotente e movimentação.
 */
class CicloAtendimentoCPT {
  static get status() { return ['Recebida', 'Em andamento', 'Concluída']; }
  static get procedencias() { return ['Em análise', 'Procedente', 'Não procedente']; }
  static get areas() { return ['Atendimento', 'Execução', 'Socioambiental', 'Comunicação', 'Gestão']; }
  static podeConduzir(p) { return PerfisCPT.gerencia(p) || p.papeis.includes('atendimento'); }
  static podeExecutar(p) { return this.podeConduzir(p) || p.papeis.includes('execucao'); }
  /** Telefone e e-mail do munícipe: só quem conduz ou executa o caso. */
  static veContato(p) { return this.podeExecutar(p); }

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
    const contato = CicloAtendimentoCPT.veContato(p);
    const abertura = {tipo: d.tipo || '', canal: d.canal || '', urgencia: d.urgencia || '', solicitacao: d.solicitacao || '', tratativa: d.tratativa || '',
      local: d.local || '', segmento: d.segmento || '', registroId: d.registroId || '', telefone: contato ? (d.telefone || '') : '', email: contato ? (d.email || '') : '', contatoOculto: !contato && !!(d.telefone || d.email)};
    return {...base, abertura, procedencia: d.procedencia || 'Em análise', versao: this.versao(r), opcoes: {status: CicloAtendimentoCPT.status, procedencias: CicloAtendimentoCPT.procedencias, areas: CicloAtendimentoCPT.areas},
      pode: {atualizar: CicloAtendimentoCPT.podeConduzir(p), executar: CicloAtendimentoCPT.podeExecutar(p), finalizar: CicloAtendimentoCPT.podeConduzir(p), reabrir: CicloAtendimentoCPT.podeConduzir(p)}};
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
      d.execucoes = (d.execucoes || []).concat([{data: dataExec, por, feito: feito.slice(0, 500), registradoPor: this.ctx.email}]).slice(-20);
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
