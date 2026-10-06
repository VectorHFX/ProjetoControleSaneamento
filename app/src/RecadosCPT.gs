/**
 * RecadosCPT 2.8.0. Recado para outra frente ou pessoa: mais prático que e-mail, mais institucional que WhatsApp.
 * Aviso dentro da aplicação (contador na lateral e na abertura). NÃO envia e-mail nem WhatsApp.
 * Cada pessoa vê os recados que enviou e os endereçados a ela ou à sua frente. Leitura registrada por pessoa.
 * Um recado pode levar um vínculo (material/link, protocolo, obra, lembrete ou registro) para abrir com um clique.
 */
class RecadosCPT {
  static get frentes() { return ['atendimento', 'socioambiental', 'comunicacao', 'comercializacao', 'gestao', 'administrativo']; }
  static get vinculos() { return ['link', 'protocolo', 'obra', 'lembrete', 'registro']; }
  constructor(ctx) { this.ctx = ctx; this.col = new ColecaoCPT(ctx, 'Recados', 'REC'); this.papeis = ctx.perfil.papeis.filter(x => x !== 'administrador'); }
  paraMim(r) { return r.para.pessoas.includes(this.ctx.email) || r.para.frentes.some(f => this.papeis.includes(f)); }
  visivel(r) { return r.criadoPor === this.ctx.email || this.paraMim(r); }
  publico(r) { return {...r, paraMim: this.paraMim(r), lido: !!(r.lidos || {})[this.ctx.email], meu: r.criadoPor === this.ctx.email}; }
  naoLidos() { return this.col.itens().filter(r => this.paraMim(r) && r.criadoPor !== this.ctx.email && !(r.lidos || {})[this.ctx.email] && r.situacao !== 'resolvido'); }
  listar() {
    const itens = this.col.itens().filter(r => this.visivel(r)).map(r => this.publico(r)).sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
    return {itens, pessoas: ColecaoCPT.pessoas(this.ctx), naoLidos: this.naoLidos().length};
  }
  enviar(p) {
    p = p || {};
    const pessoas = ColecaoCPT.pessoas(this.ctx).map(x => x.email), para = p.para || {};
    const frentes = [...new Set(Array.isArray(para.frentes) ? para.frentes : [])], destinos = [...new Set(Array.isArray(para.pessoas) ? para.pessoas : [])];
    if (frentes.some(f => !RecadosCPT.frentes.includes(f)) || destinos.some(e => !pessoas.includes(e))) throw new Error('Escolha frentes e pessoas da lista.');
    if (!frentes.length && !destinos.length) throw new Error('Escolha para quem vai o recado (uma frente ou uma pessoa).');
    let vinculo = null;
    if (p.vinculo && p.vinculo.tipo) {
      const v = p.vinculo; ColecaoCPT.opcao(v.tipo, RecadosCPT.vinculos, 'vínculo');
      vinculo = {tipo: v.tipo, id: ColecaoCPT.texto(v.id, 120, 'vínculo'), titulo: ColecaoCPT.texto(v.titulo, 200, 'título do vínculo'), url: ColecaoCPT.url(v.url, 'link do vínculo')};
    }
    const agora = new Date().toISOString(), r = {para: {frentes, pessoas: destinos}, assunto: ColecaoCPT.texto(p.assunto, 120, 'assunto', true), texto: ColecaoCPT.texto(p.texto, 2000, 'mensagem', true),
      importante: p.importante === true, prazo: ColecaoCPT.data(p.prazo, 'prazo'), vinculo, situacao: 'aberto', respostas: [], lidos: {[this.ctx.email]: agora}, nomeAutor: this.ctx.perfil.nome, atualizadoEm: agora};
    return {resultado: 'Recado enviado. Quem recebe vê o aviso ao abrir a aplicação.', recado: this.publico(this.col.gravar(r, 0, p.operacaoId))};
  }
  /** Responder, marcar como lido, resolver ou reabrir. Lê sempre a versão atual (ações de pessoas diferentes não se anulam). */
  agir(p) {
    p = p || {}; const r = this.col.obter(String(p.id || ''));
    if (!r || !this.visivel(r)) throw new Error('Recado não encontrado.');
    const agora = new Date().toISOString(), novo = JSON.parse(JSON.stringify(r)); novo.lidos = novo.lidos || {};
    if (p.acao === 'lido') { if (novo.lidos[this.ctx.email]) return {recado: this.publico(r)}; novo.lidos[this.ctx.email] = agora; }
    else if (p.acao === 'responder') { novo.respostas.push({autor: this.ctx.email, nome: this.ctx.perfil.nome, em: agora, texto: ColecaoCPT.texto(p.texto, 2000, 'resposta', true)}); novo.lidos = {[this.ctx.email]: agora}; novo.situacao = 'aberto'; novo.atualizadoEm = agora; }
    else if (p.acao === 'resolver' || p.acao === 'reabrir') { novo.situacao = p.acao === 'resolver' ? 'resolvido' : 'aberto'; novo.resolvidoPor = p.acao === 'resolver' ? this.ctx.email : ''; novo.atualizadoEm = agora; novo.lidos[this.ctx.email] = agora; }
    else throw new Error('Ação inválida.');
    const e = this.col.gravar(novo, r.versao, p.operacaoId || 'OP-' + Utilities.getUuid());
    return {resultado: {lido: 'Marcado como lido.', responder: 'Resposta enviada.', resolver: 'Recado resolvido.', reabrir: 'Recado reaberto.'}[p.acao], recado: this.publico(e)};
  }
}

function listarRecadosCPT() { return ColecaoCPT.executar('recados.listar', ctx => new RecadosCPT(ctx).listar()); }
function enviarRecadoCPT(p) { return ColecaoCPT.executar('recados.enviar', ctx => new RecadosCPT(ctx).enviar(p), true); }
function agirRecadoCPT(p) { return ColecaoCPT.executar('recados.agir', ctx => new RecadosCPT(ctx).agir(p), true); }
/** Contadores leves para a lateral: recados não lidos e lembretes vencendo. Chamado depois que a tela abre. */
function contarAvisosCPT() {
  return ColecaoCPT.executar('avisos.contar', ctx => {
    const out = {recados: 0, lembretes: 0};
    try { out.recados = new RecadosCPT(ctx).naoLidos().length; } catch (_) {}
    try { out.lembretes = new LembretesCPT(ctx).pendentesHoje(); } catch (_) {}
    return out;
  });
}
