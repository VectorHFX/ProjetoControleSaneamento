/**
 * ColecaoCPT 2.8.0. Coleções com versões na planilha "CPT • Dados da aplicação" (uma aba por coleção).
 * Cada linha guarda o estado completo de um item e é uma revisão: nada é apagado, o histórico fica na aba.
 * O estado atual é a maior versão de cada ID. Usada por Recados, Contatos, Lembretes, Materiais e Mídias extras.
 * Salvamento: versão esperada (conflito), operação idempotente (a mesma operação não grava duas vezes) e trava.
 */
class ColecaoCPT {
  static get cabecalho() { return ['ID', 'Versão', 'Operação ID', 'Alterado em', 'Alterado por', 'Conteúdo JSON']; }
  /** Uma instância por aba em cada pedido (2.21): telas que juntam vários módulos (Meu espaço) leem cada aba uma vez só. */
  static de(ctx, aba, prefixo) { const m = ctx.colecoesCPT || (ctx.colecoesCPT = {}); return m[aba] || (m[aba] = new ColecaoCPT(ctx, aba, prefixo)); }
  constructor(ctx, aba, prefixo) { this.ctx = ctx; this.nome = aba; this.prefixo = prefixo; this.cache = null; }
  /** A aba já existe? (para ler sem criar a aba de quem só consulta) */
  static existe(ctx, aba) { try { return !!planilhaCPT_(ctx.config.agendaId).getSheetByName(aba); } catch (_) { return false; } }
  aba() {
    if (!this.ctx.config.agendaId) throw new Error('Os dados da aplicação ainda não foram preparados. Avise a administração técnica.');
    const ss = planilhaCPT_(this.ctx.config.agendaId); let a = ss.getSheetByName(this.nome);
    if (!a) { a = ss.insertSheet(this.nome); a.getRange(1, 1, 1, 6).setValues([ColecaoCPT.cabecalho]); a.setFrozenRows(1); }
    return a;
  }
  /** Estado atual de todos os itens. Cache compartilhado pela última linha da aba (uma revisão nova invalida sozinha). */
  itens() {
    if (this.cache) return this.cache;
    const a = this.aba(), n = a.getLastRow() - 1, chave = 'colecao:' + this.ctx.config.agendaId + ':' + this.nome + ':' + n;
    const salvo = CacheCPT.ler(chave); if (salvo) { this.cache = salvo; return salvo; }
    const atuais = new Map();
    (n > 0 ? a.getRange(2, 1, n, 6).getValues() : []).forEach(r => { if (!r[0]) return; let e; try { e = JSON.parse(r[5]); } catch (_) { return; } const x = atuais.get(e.id); if (!x || x.versao < e.versao) atuais.set(e.id, e); });
    this.cache = [...atuais.values()]; CacheCPT.gravar(chave, this.cache, 3600); return this.cache;
  }
  /** Índice por ID (montado uma vez por leitura da coleção): busca direta em vez de percorrer a lista. */
  obter(id) {
    const itens = this.itens();
    if (!this.indice || this.indice.fonte !== itens) this.indice = {fonte: itens, mapa: new Map(itens.map(x => [x.id, x]))};
    return this.indice.mapa.get(id) || null;
  }
  /** Grava uma nova versão. Mesma operação = devolve o que já foi gravado (clique duplo, conexão que caiu). */
  /** idFixo: para itens de uma pessoa (ex.: PES-email, CAD-email-data), o primeiro salvamento usa esse ID. */
  gravar(item, versaoEsperada, operacaoId, idFixo) {
    if (typeof operacaoId !== 'string' || !/^OP-[\w-]{8,70}$/.test(operacaoId)) throw new Error('Operação inválida. Recarregue a página.');
    const a = this.aba(), ja = this.porOperacao(operacaoId); if (ja) return ja;
    const antigo = idFixo ? this.obter(idFixo) : item.id ? this.obter(item.id) : null;
    if (!idFixo && item.id && !antigo) throw new Error('Item não encontrado. Atualize a página.');
    if (antigo && Number(versaoEsperada) !== antigo.versao) throw new Error('Outra pessoa alterou este item agora há pouco. Seu texto continua na tela: atualize e confira antes de salvar de novo.');
    const agora = new Date().toISOString(), e = {...item, id: antigo ? antigo.id : idFixo || this.prefixo + '-' + Utilities.getUuid(), versao: (antigo ? antigo.versao : 0) + 1,
      criadoPor: antigo ? antigo.criadoPor : this.ctx.email, criadoEm: antigo ? antigo.criadoEm : agora, alteradoPor: this.ctx.email, alteradoEm: agora};
    a.getRange(a.getLastRow() + 1, 1, 1, 6).setValues([[e.id, e.versao, operacaoId, agora, this.ctx.email, JSON.stringify(e)]]);
    this.cache = null; return e;
  }
  /** O item gravado por esta operação, se ela já aconteceu (para repetir sem duplicar). */
  porOperacao(operacaoId) {
    const a = this.aba(), n = a.getLastRow() - 1; if (n < 1) return null;
    const i = a.getRange(2, 3, n, 1).getValues().findIndex(r => String(r[0]) === operacaoId);
    return i >= 0 ? JSON.parse(a.getRange(i + 2, 6).getValue()) : null;
  }
  /** Revisões de um item, da mais nova para a mais antiga. */
  historico(id) {
    const a = this.aba(), n = a.getLastRow() - 1;
    return (n > 0 ? a.getRange(2, 1, n, 6).getValues() : []).filter(r => String(r[0]) === id).map(r => { try { return JSON.parse(r[5]); } catch (_) { return null; } }).filter(Boolean).reverse();
  }
  // Validações comuns.
  static texto(v, max, campo, obrigatorio) {
    const s = String(v == null ? '' : v).trim();
    if (obrigatorio && !s) throw new Error('Preencha: ' + campo + '.');
    if (s.length > max) throw new Error(campo + ': use até ' + max + ' caracteres.');
    return s;
  }
  static data(v, campo, obrigatorio) {
    const s = String(v || '').trim(); if (!s && !obrigatorio) return '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || new Date(s + 'T12:00:00Z').toISOString().slice(0, 10) !== s) throw new Error('Informe uma data válida em ' + campo + '.');
    return s;
  }
  static url(v, campo) {
    const s = String(v || '').trim(); if (!s) return '';
    if (!/^https:\/\/[^\s<>"']{4,1990}$/.test(s)) throw new Error(campo + ': cole um link completo, começando com https://');
    return s;
  }
  static opcao(v, lista, campo) { if (!lista.includes(v)) throw new Error('Escolha uma opção válida em ' + campo + '.'); return v; }
  static hoje() { return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd'); }
  /** Pessoas ativas (nome e e-mail) para escolher destinatários e responsáveis. */
  static pessoas(ctx) { return PerfisCPT.lista(ctx.config).filter(p => p.ativo).map(p => ({email: p.email, nome: p.nome, papeis: p.papeis.filter(x => x !== 'administrador')})); }
  static executar(nome, fn, escrita) {
    return DesempenhoCPT.medir(nome, () => {
      if (!escrita) return fn(AplicacaoCPT.identidade());
      const lock = LockService.getScriptLock(); if (!lock.tryLock(15000)) throw new Error('Há outro salvamento em andamento. Tente de novo em alguns segundos.');
      try { return fn(AplicacaoCPT.identidade()); } finally { lock.releaseLock(); }
    });
  }
}
