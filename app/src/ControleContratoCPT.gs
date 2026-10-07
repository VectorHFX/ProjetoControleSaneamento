/**
 * ControleContratoCPT 2.26.0. Lembrete mensal da planilha de controle do contrato (Gestão).
 * A planilha é preenchida 100% à mão: a aplicação NUNCA escreve nela nem a abre para editar. Ela só:
 *  - mostra o link (direto na aba do controle) e a competência a responder (o mês anterior), com prazo no dia 10;
 *  - lembra a Gestão (missão do checklist) até alguém marcar "respondida" — a marca fica na coleção
 *    "Controle do contrato" (CTR-AAAA-MM), nunca na planilha;
 *  - mostra a data da última alteração do arquivo (só os dados do Drive, sem abrir a planilha);
 *  - traz os indicadores do mês calculados pela aplicação (Visão do mês · Contrato), para conferir na hora de preencher.
 * Quem vê: Administrativo e Gestão. Marcar "respondida": os mesmos; nos testes, só o proprietário.
 */
class ControleContratoCPT {
  static get prazoDia() { return 10; }
  static get aba() { return 'Controle do contrato'; }
  constructor(ctx) {
    if (!PerfisCPT.gerencia(ctx.perfil)) throw new Error('A planilha de controle do contrato é da Gestão e do Administrativo.');
    this.ctx = ctx; this.col = ColecaoCPT.de(ctx, ControleContratoCPT.aba, 'CTR');
  }
  static mesAnterior(dia) { const d = new Date(dia.slice(0, 7) + '-15T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); }
  static prazo(mes) { const [a, m] = mes.split('-').map(Number); return new Date(Date.UTC(a, m, ControleContratoCPT.prazoDia)).toISOString().slice(0, 10); }
  static url() { const c = ConectoresCPT.item('contrato'), id = ConectoresCPT.id('contrato'); return 'https://docs.google.com/spreadsheets/d/' + id + '/edit' + (c.aba ? '#gid=' + c.aba : ''); }
  registro(mes) { return ColecaoCPT.existe(this.ctx, ControleContratoCPT.aba) ? this.col.obter('CTR-' + mes) : null; }
  marca(mes) { const x = this.registro(mes); return x && x.respondida ? x : null; }
  podeMarcar() { return !PerfisCPT.travada() || this.ctx.perfil.papeis.includes('administrador'); }
  /** Só os dados do arquivo no Drive (sem abrir a planilha). */
  ultimaAlteracao() {
    const id = ConectoresCPT.id('contrato');
    try { return CacheCPT.obter('controle-contrato:alteracao:' + id, 600, () => ({em: DriveApp.getFileById(id).getLastUpdated().toISOString()})).em; } catch (_) { return ''; }
  }
  resumo(p) {
    const hoje = ColecaoCPT.hoje(), pedido = String(p && p.mes || ''), mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(pedido) ? pedido : ControleContratoCPT.mesAnterior(hoje), prazo = ControleContratoCPT.prazo(mes);
    const reg = this.registro(mes), x = reg && reg.respondida ? reg : null; let indicadores = null;
    try { const c = new PaineisGestaoCPT(this.ctx).carregar(mes).contrato; indicadores = [
      {nome: 'Ações socioambientais', valor: c.acoes}, {nome: 'Pessoas alcançadas', valor: c.pessoas, nota: c.semPublico ? DadosDaAplicacao.plural(c.semPublico, 'ação', 'ações') + ' sem público informado' : ''},
      {nome: 'Frentes com atividade', valor: c.frentes}, {nome: 'Bairros com ação', valor: c.bairros}, {nome: 'Diagnósticos', valor: c.diagnosticos},
      {nome: 'Pesquisas de satisfação', valor: c.pesquisas.mes, nota: 'meta ' + c.pesquisas.meta}, {nome: 'Atendimentos recebidos', valor: c.casos.recebidosMes},
      {nome: 'Atendimentos concluídos', valor: c.casos.concluidosMes, nota: c.casos.prazoMedio != null ? 'prazo médio ' + c.casos.prazoMedio + ' dias' : ''},
      {nome: 'Atendimentos em aberto', valor: c.casos.abertos, nota: c.casos.acima30 ? c.casos.acima30 + ' há mais de 30 dias' : ''}, {nome: 'Relatos de atividade', valor: c.relatos.total, nota: ''}]; } catch (e) { console.warn('Controle do contrato: ' + e.message); }
    return {mes, mesNome: DadosDaAplicacao.mesExtenso(mes), prazo, hoje, atrasada: !x && hoje > prazo, url: ControleContratoCPT.url(), ultimaAlteracao: this.ultimaAlteracao(),
      respondida: x ? {nome: x.nome || x.alteradoPor, em: x.alteradoEm} : null, versao: reg ? reg.versao : 0,
      podeMarcar: this.podeMarcar(), indicadores};
  }
  marcar(p) {
    p = p || {}; PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'Marcar a planilha de controle');
    const mes = DadosDaAplicacao.mesValido(p.mes), id = 'CTR-' + mes, antigo = this.registro(mes), respondida = p.respondida !== false;
    const e = this.col.gravar({respondida, nome: this.ctx.perfil.nome}, antigo ? Number(p.versao) : 0, p.operacaoId, id);
    return {resultado: respondida ? 'Marcada como respondida. O lembrete deste mês some do checklist.' : 'Marca desfeita: o lembrete volta.', mes, respondida: e.respondida ? {nome: e.nome, em: e.alteradoEm} : null, versao: e.versao};
  }
  /** Missão do checklist: responder a planilha da competência anterior, até alguém marcar. */
  missoes() {
    const hoje = ColecaoCPT.hoje(), mes = ControleContratoCPT.mesAnterior(hoje); if (this.marca(mes)) return [];
    const prazo = ControleContratoCPT.prazo(mes), br = prazo.split('-').reverse().slice(0, 2).join('/');
    return [{id: 'controle-contrato:' + mes, titulo: 'Responder a planilha de controle de ' + DadosDaAplicacao.mesExtenso(mes), tipo: 'rota', rota: 'painel',
      texto: (hoje > prazo ? 'O prazo era ' + br + '. ' : 'Prazo: ' + br + '. ') + 'É preenchida à mão; na Visão do mês · Contrato estão o link e os números para conferir.'}];
  }
}

function controleContratoCPT(p) { return AplicacaoCPT.executar((d, ctx) => new ControleContratoCPT(ctx).resumo(p), 'controle.resumo'); }
function marcarControleContratoCPT(p) { return ColecaoCPT.executar('controle.marcar', ctx => new ControleContratoCPT(ctx).marcar(p), true); }
