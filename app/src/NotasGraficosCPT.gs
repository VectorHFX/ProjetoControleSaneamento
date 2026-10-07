/**
 * NotasGraficosCPT 2.45.0. Comentários da gestão nos gráficos: o que o gráfico mostra (vale para todos os meses) ou a
 * justificativa de um mês ("julho: obra paralisada"). Gestão e Administrativo escrevem; todo o time lê, embaixo do gráfico
 * e na imagem copiada. Um comentário por gráfico e por mês (ou geral); apagar = salvar vazio (fica no histórico da coleção).
 */
class NotasGraficosCPT {
  static get aba() { return 'Notas dos gráficos'; }
  static pode(p) { return PerfisCPT.gerencia(p); }
  constructor(ctx) { this.ctx = ctx; this.col = new ColecaoCPT(ctx, NotasGraficosCPT.aba, 'NGR'); }
  listar() {
    return {notas: this.col.itens().filter(n => n.texto).map(n => ({id: n.id, grafico: n.grafico, mes: n.mes, texto: n.texto, nome: n.nome, em: n.alteradoEm, versao: n.versao})), podeEditar: NotasGraficosCPT.pode(this.ctx.perfil)};
  }
  salvar(p) {
    if (!NotasGraficosCPT.pode(this.ctx.perfil)) throw new Error('Comentários nos gráficos são da Gestão e do Administrativo.');
    p = p || {}; const grafico = String(p.grafico || ''), mes = String(p.mes || '');
    if (!/^[a-z0-9-]{2,80}$/.test(grafico)) throw new Error('Gráfico inválido. Atualize a página.');
    if (mes && !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new Error('Mês inválido.');
    const texto = ColecaoCPT.texto(p.texto, 600, 'comentário'), id = 'NGR-' + grafico + '-' + (mes || 'geral'), antigo = this.col.obter(id);
    if (!texto && !antigo) throw new Error('Escreva o comentário.');
    const e = this.col.gravar({grafico, mes, texto, nome: this.ctx.perfil.nome}, antigo ? antigo.versao : 0, p.operacaoId, id);
    return {resultado: texto ? 'Comentário salvo no gráfico.' : 'Comentário apagado.', nota: {id: e.id, grafico, mes, texto, nome: e.nome, em: e.alteradoEm, versao: e.versao}};
  }
}

function listarNotasGraficosCPT() { return ColecaoCPT.executar('graficos.notas', ctx => new NotasGraficosCPT(ctx).listar()); }
function salvarNotaGraficoCPT(p) { return ColecaoCPT.executar('graficos.nota', ctx => new NotasGraficosCPT(ctx).salvar(p), true); }
