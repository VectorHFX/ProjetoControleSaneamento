/**
 * AtendimentoDiaCPT 2.42.0. O dia e o mês do atendimento, sem e-mail automático.
 * - Mensagem do dia (Gestão e Administrativo preparam): casos novos e concluídos desde a última mensagem e os casos
 *   escolhidos para trabalhar hoje. Publicada, vira missão no Meu espaço de Atendimento, Gestão, Administrativo e
 *   Comunicação (um caso por missão; some quando o caso é atualizado depois da mensagem). Também pode ser copiada.
 * - E-mail do mês: resumo e a tabela caso a caso (nome completo, assunto, com quem está, situação, observações) com o link
 *   do pacote de fichas do mês, pronto para copiar e colar no Gmail. Os casos são os mesmos do pacote (abertos no mês,
 *   concluídos no mês e em andamento no fim do mês).
 * Mensagens ficam na coleção "Mensagens do atendimento" (uma por dia; publicar de novo cria outra versão).
 */
class AtendimentoDiaCPT {
  static get aba() { return 'Mensagens do atendimento'; }
  static get maxEscolhidos() { return 3; }
  static pode(p) { return PerfisCPT.gerencia(p); }
  static recebe(p) { return p.papeis.some(x => ['administrador', 'administrativo', 'gestao', 'atendimento', 'comunicacao'].includes(x)); }
  constructor(ctx) { this.ctx = ctx; this.col = new ColecaoCPT(ctx, AtendimentoDiaCPT.aba, 'MSA'); }
  get dados() { if (!this._dados) { if (!this.ctx.base) this.ctx.base = planilhaCPT_(this.ctx.config.baseId); this._dados = new DadosDaAplicacao(this.ctx.base, this.ctx.perfil); } return this._dados; }
  hoje() { return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd'); }
  static br(d) { return d ? d.split('-').reverse().join('/') : ''; }
  /** Casos principais com o que a mensagem e o e-mail usam (nome completo como na ficha). */
  casos() {
    if (this._casos) return this._casos;
    const D = this.dados;
    return this._casos = D.ler(D.atendimentos(), 20).filter(r => D.principal(r)).map(r => {
      const a = D.atendimento(r), j = CicloAtendimentoCPT.json(r[19]), c = CicloAtendimentoCPT.campos(j, r);
      return {protocolo: a.protocolo, caso: a.caso, nome: String(c.nome || a.nome || '').trim(), assunto: a.assunto || c.assunto, area: a.area, responsavel: a.responsavel, status: a.status, concluido: a.concluido,
        abertura: a.abertura, conclusao: a.conclusao, dias: a.dias, proximaAcao: a.proximaAcao, finalizacao: String(j.conclusao || c.finalizacaoAnterior || '').trim(),
        alteradoEm: r[13] instanceof Date ? r[13].toISOString() : String(r[13] || '')};
    });
  }
  static rotulo(c) { return (c.caso || c.protocolo) + (c.assunto ? ' · ' + c.assunto : ''); }
  ultima() { return this.col.itens().filter(m => m.publicadaEm).sort((a, b) => b.publicadaEm.localeCompare(a.publicadaEm))[0] || null; }
  deHoje() { return this.col.obter('MSA-' + this.hoje()); }

  // ---------------- Mensagem do dia ----------------
  /** Desde quando contar "novos" e "concluídos": a última mensagem antes de hoje; sem nenhuma, os últimos 3 dias. */
  desde() {
    const hoje = this.hoje(), antes = this.col.itens().filter(m => m.dia < hoje && m.publicadaEm).sort((a, b) => b.dia.localeCompare(a.dia))[0];
    return antes ? antes.dia : new Date(Date.parse(hoje + 'T12:00:00Z') - 3 * 864e5).toISOString().slice(0, 10);
  }
  preparar() {
    if (!AtendimentoDiaCPT.pode(this.ctx.perfil)) throw new Error('A mensagem do dia é preparada pela Gestão ou pelo Administrativo.');
    const desde = this.desde(), casos = this.casos(), curto = c => ({protocolo: c.protocolo, caso: c.caso, nome: c.nome, assunto: c.assunto, area: c.area, dias: c.dias, proximaAcao: c.proximaAcao, status: c.status});
    return {hoje: this.hoje(), desde, novos: casos.filter(c => c.abertura > desde).map(curto), concluidos: casos.filter(c => c.concluido && c.conclusao > desde).map(curto),
      abertos: casos.filter(c => !c.concluido).sort((a, b) => (b.dias || 0) - (a.dias || 0)).map(curto), atual: this.deHoje(), max: AtendimentoDiaCPT.maxEscolhidos};
  }
  static texto(m) {
    const lista = l => l.map(AtendimentoDiaCPT.rotulo).join('; ');
    return ['Atendimento · ' + AtendimentoDiaCPT.br(m.dia),
      m.novos.length ? m.novos.length + (m.novos.length === 1 ? ' caso novo' : ' casos novos') + ' desde ' + AtendimentoDiaCPT.br(m.desde) + ': ' + lista(m.novos) + '.' : 'Nenhum caso novo desde ' + AtendimentoDiaCPT.br(m.desde) + '.',
      m.concluidos.length ? m.concluidos.length + (m.concluidos.length === 1 ? ' concluído' : ' concluídos') + ': ' + lista(m.concluidos) + '.' : 'Nenhum caso concluído no período.',
      'Para trabalhar hoje:\n' + m.escolhidos.map(c => '• ' + AtendimentoDiaCPT.rotulo(c) + (c.area ? ' — com ' + c.area : '') + (c.proximaAcao ? ' — ' + c.proximaAcao : '')).join('\n'),
      m.nota ? m.nota : ''].filter(Boolean).join('\n\n');
  }
  publicar(p) {
    if (!AtendimentoDiaCPT.pode(this.ctx.perfil)) throw new Error('A mensagem do dia é preparada pela Gestão ou pelo Administrativo.');
    p = p || {}; const escolhidos = [...new Set((Array.isArray(p.escolhidos) ? p.escolhidos : []).map(String))];
    if (!escolhidos.length) throw new Error('Escolha os casos para trabalhar hoje.');
    if (escolhidos.length > AtendimentoDiaCPT.maxEscolhidos) throw new Error('Escolha no máximo ' + AtendimentoDiaCPT.maxEscolhidos + ' casos.');
    const casos = this.casos(), sel = escolhidos.map(id => casos.find(c => c.protocolo === id && !c.concluido));
    if (sel.some(c => !c)) throw new Error('Um dos casos escolhidos não está mais em aberto. Atualize a tela.');
    const prep = this.preparar(), hoje = this.hoje(), antiga = this.deHoje(), curto = c => ({protocolo: c.protocolo, caso: c.caso, assunto: c.assunto, area: c.area, proximaAcao: c.proximaAcao});
    const m = {dia: hoje, desde: prep.desde, novos: prep.novos.map(curto), concluidos: prep.concluidos.map(curto), escolhidos: sel.map(curto), nota: ColecaoCPT.texto(p.nota, 500, 'recado'),
      publicadaEm: new Date().toISOString(), por: this.ctx.email, nome: this.ctx.perfil.nome};
    m.texto = AtendimentoDiaCPT.texto(m);
    const e = this.col.gravar(m, antiga ? antiga.versao : 0, p.operacaoId, 'MSA-' + hoje);
    return {resultado: 'Mensagem publicada: os casos de hoje viraram missão para Atendimento, Gestão, Administrativo e Comunicação.', mensagem: e};
  }
  /** Mensagem de hoje para quem recebe (sem preparar). */
  hojePara() { return AtendimentoDiaCPT.recebe(this.ctx.perfil) ? this.deHoje() : null; }
  /** Missões: um caso escolhido por missão, até ele ser atualizado depois da mensagem (ou ser concluído). */
  missoes() {
    if (!AtendimentoDiaCPT.recebe(this.ctx.perfil)) return [];
    const m = this.deHoje(); if (!m) return [];
    const casos = new Map(this.casos().map(c => [c.protocolo, c]));
    return m.escolhidos.filter(e => { const c = casos.get(e.protocolo); return c && !c.concluido && !(c.alteradoEm && c.alteradoEm > m.publicadaEm); })
      .map(e => ({id: 'caso-do-dia:' + e.protocolo, titulo: 'Caso do dia: ' + AtendimentoDiaCPT.rotulo(e), texto: (e.area ? 'Com ' + e.area + '. ' : '') + (e.proximaAcao ? 'Próxima ação: ' + e.proximaAcao + '. ' : '') + 'Registre o andamento na ficha.', tipo: 'caso', protocolo: e.protocolo}));
  }

  // ---------------- E-mail do mês ----------------
  /** Link da pasta do pacote do mês, se já foi montado (só lê; não cria pasta). */
  pacote(mes) {
    try {
      const id = AplicacaoCPT.config().pastaFichasV2Id; if (!id) return '';
      const it = DriveApp.getFolderById(id).getFoldersByName('Pacotes'); if (!it.hasNext()) return '';
      const m = it.next().getFoldersByName(mes); return m.hasNext() ? m.next().getUrl() : '';
    } catch (_) { return ''; }
  }
  email(mes) {
    if (!AtendimentoDiaCPT.recebe(this.ctx.perfil)) throw new Error('O e-mail do mês fica com Atendimento, Comunicação, Gestão e Administrativo.');
    mes = DadosDaAplicacao.mesValido(mes);
    const lista = this.casos().filter(c => FichaOficialCPT.doPacote(c, mes)).sort((a, b) => a.abertura.localeCompare(b.abertura) || a.protocolo.localeCompare(b.protocolo));
    const grupo = c => FichaOficialCPT.grupo(c, mes), conta = g => lista.filter(c => grupo(c) === g).length, nomeMes = DadosDaAplicacao.mesExtenso(mes), pacote = this.pacote(mes);
    const prazos = lista.filter(c => c.concluido && c.conclusao.startsWith(mes)).map(c => (Date.parse(c.conclusao + 'T12:00:00Z') - Date.parse(c.abertura + 'T12:00:00Z')) / 864e5).filter(n => n >= 0);
    const resumo = {casos: lista.length, abertos: conta('Aberto no mês'), concluidos: lista.filter(c => c.concluido && c.conclusao.startsWith(mes)).length, andamento: lista.filter(c => !c.concluido || c.conclusao > mes + '-31').length,
      prazoMedio: prazos.length ? Math.round(prazos.reduce((a, b) => a + b, 0) / prazos.length) : null};
    const obs = c => c.concluido && c.conclusao.startsWith(mes) ? (c.finalizacao || 'Concluído em ' + AtendimentoDiaCPT.br(c.conclusao) + '.') : c.proximaAcao ? 'Próxima ação: ' + c.proximaAcao : '';
    const situacao = c => !c.concluido ? (c.status || 'Em andamento') : c.conclusao <= mes + '-31' ? 'Concluído em ' + AtendimentoDiaCPT.br(c.conclusao) : 'Em andamento no fim do mês · concluído em ' + AtendimentoDiaCPT.br(c.conclusao);
    const linhas = lista.map(c => ({caso: c.caso || c.protocolo, protocolo: c.protocolo, nome: c.nome, assunto: c.assunto, com: c.area || c.responsavel || '', situacao: situacao(c), observacoes: obs(c), abertura: AtendimentoDiaCPT.br(c.abertura)}));
    const assunto = 'Atendimentos de ' + nomeMes + ' — relatório do mês';
    const intro = 'Segue o relatório dos atendimentos de ' + nomeMes + ': ' + resumo.casos + ' casos no período (' + resumo.abertos + ' abertos no mês, ' + resumo.concluidos + ' concluídos no mês e ' + resumo.andamento + ' seguem em andamento)' + (resumo.prazoMedio != null ? '; prazo médio de atendimento dos concluídos: ' + resumo.prazoMedio + ' dias' : '') + '.';
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, x => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[x]);
    const th = 'style="text-align:left;padding:6px 8px;border:1px solid #c9d3cf;background:#e9f1ee;font-weight:bold"', td = 'style="padding:6px 8px;border:1px solid #c9d3cf;vertical-align:top"';
    const html = '<div style="font-family:Arial,sans-serif;font-size:13px;color:#1f2a26"><p>Olá,</p><p>' + esc(intro) + '</p>' +
      (pacote ? '<p>Fichas do mês em PDF (pacote): <a href="' + esc(pacote) + '">' + esc(pacote) + '</a></p>' : '') +
      '<table style="border-collapse:collapse;font-size:12px"><thead><tr>' + ['Caso', 'Abertura', 'Nome completo', 'Assunto', 'Com quem está', 'Situação', 'Observações'].map(h => '<th ' + th + '>' + h + '</th>').join('') + '</tr></thead><tbody>' +
      linhas.map(l => '<tr>' + [esc(l.caso) + '<br><small>' + esc(l.protocolo) + '</small>'].concat([l.abertura, l.nome, l.assunto, l.com, l.situacao, l.observacoes].map(esc)).map(v => '<td ' + td + '>' + v + '</td>').join('') + '</tr>').join('') +
      '</tbody></table><p>Atenciosamente,<br>' + esc(this.ctx.perfil.nome || '') + '<br>' + esc(FichaOficialCPT.empresa) + '</p></div>';
    const texto = ['Olá,', intro, pacote ? 'Fichas do mês em PDF (pacote): ' + pacote : '', linhas.map(l => [l.caso + ' (' + l.protocolo + ')', 'aberto em ' + l.abertura, l.nome, l.assunto, 'com ' + (l.com || '—'), l.situacao, l.observacoes].filter(Boolean).join(' · ')).join('\n'), 'Atenciosamente,\n' + (this.ctx.perfil.nome || '') + '\n' + FichaOficialCPT.empresa].filter(Boolean).join('\n\n');
    return {mes, assunto, resumo, linhas, pacote, html, texto};
  }
}

function preparoMensagemDiaCPT() { return ColecaoCPT.executar('dia.preparar', ctx => new AtendimentoDiaCPT(ctx).preparar()); }
function publicarMensagemDiaCPT(p) { return ColecaoCPT.executar('dia.publicar', ctx => new AtendimentoDiaCPT(ctx).publicar(p), true); }
function mensagemDiaCPT() { return ColecaoCPT.executar('dia.hoje', ctx => ({mensagem: new AtendimentoDiaCPT(ctx).hojePara()})); }
function emailMesAtendimentoCPT(p) { return ColecaoCPT.executar('dia.email', ctx => new AtendimentoDiaCPT(ctx).email(String(p && p.mes || ''))); }
