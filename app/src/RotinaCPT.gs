/**
 * RotinaCPT 2.39.0. Rotina fora do expediente: dois acionadores criados à mão no editor (rotinaCPT, todo dia entre 12h e 13h
 * e entre 0h e 1h; ver o guia). Sem e-mail e sem permissão nova: cada passo trabalha por tempo e continua na próxima rodada.
 * - Fichas oficiais: gera as que faltam ou mudaram e move para a pasta organizada (FichaOficialCPT.atualizarTodas).
 * - Anexos do relatório (2.39): Controle de manifestações e linhas automáticas dos Indicadores (AnexosCPT).
 * O resultado da última rodada fica guardado (CPT_ROTINA) e aparece na tela das fichas.
 */
class RotinaCPT {
  static get chave() { return 'CPT_ROTINA'; }
  /** Passos em ordem, com o tempo de cada um (segundos); o total fica abaixo dos 6 minutos do Apps Script. */
  static get passos() {
    return [{id: 'fichas', nome: 'Fichas oficiais', segundos: 200, fazer: (ctx, s) => { const r = new FichaOficialCPT(ctx).atualizarTodas(s); return r.geradas + ' gerada(s), ' + r.movidas + ' movida(s)' + (r.faltam ? ', ' + r.faltam + ' para a próxima rodada' : '') + (r.erros.length ? ', ' + r.erros.length + ' com erro' : ''); }},
      // 2.39: depois das fichas, os Anexos leem os dados oficiais já em dia.
      {id: 'anexos', nome: 'Anexos do relatório', segundos: 90, fazer: ctx => AnexosCPT.texto(AnexosCPT.resumir(AnexosCPT.sozinho(() => new AnexosCPT(ctx).rodar(true)))) }];
  }
  static ultima() { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(RotinaCPT.chave) || 'null'); } catch (_) { return null; } }
  static rodar() {
    PLANILHAS_CPT_.clear();
    const ctx = AplicacaoCPT.contexto(), inicio = new Date(), passos = [];
    RotinaCPT.passos.forEach(p => {
      try { passos.push({id: p.id, nome: p.nome, ok: true, texto: p.fazer(ctx, p.segundos)}); }
      catch (e) { passos.push({id: p.id, nome: p.nome, ok: false, texto: String(e.message || e).slice(0, 300)}); }
    });
    const r = {em: inicio.toISOString(), segundos: Math.round((Date.now() - inicio) / 1000), passos};
    PropertiesService.getScriptProperties().setProperty(RotinaCPT.chave, JSON.stringify(r));
    return r;
  }
}

/** Chamada pelos acionadores das 12h e das 0h (criados à mão no editor). Também pode ser rodada pelo editor para testar. */
function rotinaCPT() { return DesempenhoCPT.medir('rotina', () => RotinaCPT.rodar()); }
