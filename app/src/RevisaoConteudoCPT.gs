/**
 * RevisaoConteudoCPT 2.26.0. Tela "Revisão do conteúdo": o proprietário decide, item a item, cada curiosidade e
 * pergunta do banco (ConteudoSaneamentoCPT): Aprovar, Suspender ou Voltar para revisão. Não há aprovação em lote.
 * - Coleção "Revisão do conteúdo" (IDs REV-<item>): cada decisão é uma revisão; nada é apagado.
 * - Ler as decisões: qualquer conta (o Meu espaço precisa saber o que mostrar), sem criar a aba se ela não existe.
 * - Abrir a tela e decidir: só o proprietário (administração técnica).
 * Efeito: suspenso some para todos; pendente só o proprietário vê ("a revisar"); aprovado aparece para a equipe
 * quando o quiz for liberado (trava de testes).
 */
class RevisaoConteudoCPT {
  static get aba() { return 'Revisão do conteúdo'; }
  static get situacoes() { return ['aprovado', 'suspenso', 'pendente']; }
  /** {itemId: {situacao, nota, versao, em}} */
  static decisoes(ctx) {
    if (!ColecaoCPT.existe(ctx, RevisaoConteudoCPT.aba)) return {};
    const out = {};
    ColecaoCPT.de(ctx, RevisaoConteudoCPT.aba, 'REV').itens().forEach(x => { if (x.item) out[x.item] = {situacao: x.situacao, nota: x.nota || '', versao: x.versao, em: x.alteradoEm}; });
    return out;
  }
  constructor(ctx) { PerfisCPT.admin(ctx.perfil); this.ctx = ctx; this.col = ColecaoCPT.de(ctx, RevisaoConteudoCPT.aba, 'REV'); }
  carregar() {
    const T = ConteudoSaneamentoCPT, dec = RevisaoConteudoCPT.decisoes(this.ctx), cor = T.correcoes;
    const base = x => { const d = dec[x.id]; return {id: x.id, tema: T.temas[x.tema], eixo: x.eixo, fonte: T.fonte(x.fonte), situacao: d ? d.situacao : 'pendente', nota: d ? d.nota : '', versao: d ? d.versao : 0, correcao: cor[x.id] || ''}; };
    const itens = T.curiosidades.map(c => ({...base(c), tipo: 'curiosidade', texto: c.texto, importa: c.importa}))
      .concat(T.perguntas.map(q => ({...base(q), tipo: 'pergunta', texto: q.pergunta, opcoes: q.opcoes, certa: q.certa, explica: q.explica})));
    const conta = k => itens.filter(x => x.situacao === k).length;
    return {itens, eixos: T.eixos, resumo: {total: itens.length, aprovado: conta('aprovado'), suspenso: conta('suspenso'), pendente: conta('pendente'),
      eixos: Object.keys(T.eixos).map(e => ({eixo: e, nome: T.eixos[e], n: itens.filter(x => x.eixo === e).length}))}};
  }
  decidir(p) {
    p = p || {}; const x = ConteudoSaneamentoCPT.item(String(p.id || '')); if (!x) throw new Error('Item não encontrado no banco.');
    const situacao = ColecaoCPT.opcao(p.situacao, RevisaoConteudoCPT.situacoes, 'decisão'), nota = ColecaoCPT.texto(p.nota, 500, 'observação');
    const id = 'REV-' + x.id, antigo = this.col.obter(id);
    const e = this.col.gravar({item: x.id, situacao, nota}, antigo ? Number(p.versao) : 0, p.operacaoId, id);
    const msg = {aprovado: 'Aprovado.', suspenso: 'Suspenso: não aparece para ninguém.', pendente: 'Voltou para a revisão.'};
    return {resultado: msg[e.situacao], item: {id: x.id, situacao: e.situacao, nota: e.nota, versao: e.versao}};
  }
  /**
   * 2.26.7: aprova de uma vez tudo o que ainda está "a revisar" (o que foi suspenso continua suspenso).
   * Decisão do proprietário: o conteúdo foi conferido. Cada item ganha uma revisão "aprovado", numa escrita só.
   */
  aprovarPendentes() {
    const T = ConteudoSaneamentoCPT, dec = RevisaoConteudoCPT.decisoes(this.ctx);
    const pendentes = T.curiosidades.concat(T.perguntas).filter(x => !dec[x.id] || dec[x.id].situacao === 'pendente');
    this.col.gravarLote(pendentes.map(x => ({idFixo: 'REV-' + x.id, item: {item: x.id, situacao: 'aprovado', nota: 'Aprovado em bloco pelo proprietário (conteúdo conferido).'}})), 'OP-aprovar-tudo-' + Utilities.getUuid().slice(0, 8));
    const conta = k => Object.values(dec).filter(d => d.situacao === k).length;
    return {aprovados: pendentes.length, jaAprovados: conta('aprovado'), suspensos: conta('suspenso')};
  }
}

function carregarRevisaoConteudoCPT() { return ColecaoCPT.executar('revisao.carregar', ctx => new RevisaoConteudoCPT(ctx).carregar()); }
/** Execute no editor (conta proprietária): aprova todo o conteúdo ainda "a revisar". Pode repetir: o que já foi decidido não muda. */
function aprovarTodoConteudoCPT() { return ColecaoCPT.executar('revisao.aprovarTudo', ctx => new RevisaoConteudoCPT(ctx).aprovarPendentes(), true); }
function decidirConteudoCPT(p) { return ColecaoCPT.executar('revisao.decidir', ctx => new RevisaoConteudoCPT(ctx).decidir(p), true); }
