/**
 * ColecaoCPT 2.8.0. Coleções com versões na planilha "CPT • Dados da aplicação" (uma aba por coleção).
 * Cada linha guarda o estado completo de um item e é uma revisão: nada é apagado, o histórico fica na aba.
 * O estado atual é a maior versão de cada ID. Usada por Recados, Contatos, Lembretes, Materiais e Mídias extras.
 * Salvamento: versão esperada (conflito), operação idempotente (a mesma operação não grava duas vezes) e trava.
 * 2.37 — retrato do estado atual: a aba "<coleção> · atual" guarda a última versão de cada item até uma linha do histórico
 * (Script Properties CPT_RETRATO:…). A leitura junta o retrato com as linhas novas do histórico (a "cauda"), em vez de ler
 * todas as revisões. O histórico continua inteiro na aba original. O retrato é refeito numa escrita (com a trava), quando a
 * cauda passa de limiteCauda linhas. A ordem dos itens no retrato é estável (novos no fim): uma leitura que pegue o retrato
 * no meio da troca continua certa, porque cada item fica com a maior versão entre retrato e cauda.
 */
class ColecaoCPT {
  static get cabecalho() { return ['ID', 'Versão', 'Operação ID', 'Alterado em', 'Alterado por', 'Conteúdo JSON']; }
  /** Uma instância por aba em cada pedido (2.21): telas que juntam vários módulos (Meu espaço) leem cada aba uma vez só. */
  static de(ctx, aba, prefixo) { const m = ctx.colecoesCPT || (ctx.colecoesCPT = {}); return m[aba] || (m[aba] = new ColecaoCPT(ctx, aba, prefixo)); }
  constructor(ctx, aba, prefixo) { this.ctx = ctx; this.nome = aba; this.prefixo = prefixo; this.cache = null; (ctx.colecoesTodasCPT || (ctx.colecoesTodasCPT = [])).push(this); }
  static get limiteCauda() { return 300; }
  chaveRetrato() { return 'CPT_RETRATO:' + String(this.ctx.config.agendaId).slice(-10) + ':' + this.nome; }
  retrato() { try { const r = JSON.parse(PropertiesService.getScriptProperties().getProperty(this.chaveRetrato()) || 'null'); return r && r.ate >= 1 && r.n >= 0 ? r : null; } catch (_) { return null; } }
  abaRetrato(criar) {
    const ss = planilhaCPT_(this.ctx.config.agendaId), nome = this.nome + ' · atual'; let a = ss.getSheetByName(nome);
    if (!a && criar) { a = ss.insertSheet(nome); a.getRange(1, 1, 1, 3).setValues([['ID', 'Versão', 'Estado atual (o histórico completo fica na aba ' + this.nome + ')']]); a.setFrozenRows(1); }
    return a;
  }
  /** A aba já existe? (para ler sem criar a aba de quem só consulta) */
  static existe(ctx, aba) { try { return !!planilhaCPT_(ctx.config.agendaId).getSheetByName(aba); } catch (_) { return false; } }
  aba() {
    if (!this.ctx.config.agendaId) throw new Error('Os dados da aplicação ainda não foram preparados. Avise a administração técnica.');
    const ss = planilhaCPT_(this.ctx.config.agendaId); let a = ss.getSheetByName(this.nome);
    if (!a) { a = ss.insertSheet(this.nome); a.getRange(1, 1, 1, 6).setValues([ColecaoCPT.cabecalho]); a.setFrozenRows(1); }
    return a;
  }
  /**
   * 2.46.1: última linha de cada coleção, guardada a cada gravação (e ao ler sem cache). Com ela a leitura em cache não abre
   * a aba: Meu espaço, missões e contatos juntam várias coleções e gastavam 2 chamadas à planilha por coleção só para a chave.
   * Linha acrescentada à mão na aba aparece quando o cache vence (até 1 hora) — pela aplicação, na hora.
   */
  chaveLinhas() { return 'CPT_LINHAS:' + String(this.ctx.config.agendaId).slice(-10) + ':' + this.nome; }
  marcar(ultima) { try { PropertiesService.getScriptProperties().setProperty(this.chaveLinhas(), String(ultima)); } catch (e) { console.warn('Marca ' + this.nome + ': ' + e.message); } }
  /** Antes de gravar, a conferência de versão usa a aba de verdade (pela última linha), nunca o atalho. */
  paraEscrever() { this.escrita = true; if (this.atalho) { this.cache = null; this.atalho = false; } }
  chaveCache(n) { return 'colecao:' + this.ctx.config.agendaId + ':' + this.nome + ':' + n; }
  /** Estado atual de todos os itens. Cache compartilhado pela última linha da aba (uma revisão nova invalida sozinha). */
  itens() {
    if (this.cache) return this.cache;
    const marca = this.ctx.config.agendaId ? Number(PropertiesService.getScriptProperties().getProperty(this.chaveLinhas()) || 0) : 0;
    if (marca >= 1 && !this.escrita) { const s = CacheCPT.ler(this.chaveCache(marca - 1)); if (s) { this.cache = s; this.atalho = true; return s; } }
    const a = this.aba(), ultima = a.getLastRow(), n = ultima - 1, chave = this.chaveCache(n);
    if (ultima > marca) this.marcar(ultima); // só sobe: uma leitura antiga nunca desfaz a marca de uma gravação mais nova
    const salvo = CacheCPT.ler(chave); if (salvo) { this.cache = salvo; return salvo; }
    const atuais = new Map(), soma = e => { if (!e || !e.id) return; const x = atuais.get(e.id); if (!x || x.versao < e.versao) atuais.set(e.id, e); };
    // Retrato + cauda; sem retrato válido (ou histórico mexido à mão), lê tudo como antes.
    let de = 2; const r = this.retrato(), ar = r && r.ate <= ultima ? this.abaRetrato(false) : null;
    if (ar) {
      (r.n ? ar.getRange(2, 3, r.n, 1).getValues() : []).forEach(x => { try { soma(JSON.parse(x[0])); } catch (_) {} });
      // Retrato incompleto (aba mexida à mão): descarta e lê o histórico inteiro, como antes.
      if (atuais.size < r.n) atuais.clear(); else de = r.ate + 1;
    }
    if (ultima >= de) a.getRange(de, 1, ultima - de + 1, 6).getValues().forEach(x => { if (!x[0]) return; try { soma(JSON.parse(x[5])); } catch (_) {} });
    this.cache = [...atuais.values()]; CacheCPT.gravar(chave, this.cache, 3600); return this.cache;
  }
  /** Refaz o retrato quando a cauda ficou longa. Só dentro de uma escrita (a trava já está com esta execução). */
  refazerSePreciso() {
    if (!this.ctx.config || !this.ctx.config.agendaId) return false;
    const a = planilhaCPT_(this.ctx.config.agendaId).getSheetByName(this.nome); if (!a) return false;
    const ultima = a.getLastRow(), r = this.retrato(), base = r && r.ate <= ultima ? r.ate : 1;
    // Refaz também quando a aba do retrato sumiu ou ficou menor do que a marca diz (mexida à mão).
    const ar = r ? this.abaRetrato(false) : null, estragado = !!r && (!ar || ar.getLastRow() - 1 < r.n);
    if (!estragado && ultima - base <= ColecaoCPT.limiteCauda) return false;
    this.cache = null; const itens = this.itens(), linhas = itens.map(e => [e.id, e.versao, JSON.stringify(e)]);
    // Primeiro o retrato (numa escrita só), depois a marca: quem ler no meio usa a marca antiga e continua certo.
    if (linhas.length) this.abaRetrato(true).getRange(2, 1, linhas.length, 3).setValues(linhas); else this.abaRetrato(true);
    PropertiesService.getScriptProperties().setProperty(this.chaveRetrato(), JSON.stringify({ate: ultima, n: linhas.length, em: new Date().toISOString()}));
    return true;
  }
  /** Depois de uma escrita: mantém o retrato de cada coleção usada nesta execução. Nunca derruba a escrita. */
  static manter(ctx) { (ctx.colecoesTodasCPT || []).forEach(c => { try { c.refazerSePreciso(); } catch (e) { console.warn('Retrato ' + c.nome + ': ' + e.message); } }); }
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
    this.paraEscrever();
    const a = this.aba(), ja = this.porOperacao(operacaoId); if (ja) return ja;
    const antigo = idFixo ? this.obter(idFixo) : item.id ? this.obter(item.id) : null;
    if (!idFixo && item.id && !antigo) throw new Error('Item não encontrado. Atualize a página.');
    if (antigo && Number(versaoEsperada) !== antigo.versao) throw new Error('Outra pessoa alterou este item agora há pouco. Seu texto continua na tela: atualize e confira antes de salvar de novo.');
    const agora = new Date().toISOString(), e = {...item, id: antigo ? antigo.id : idFixo || this.prefixo + '-' + Utilities.getUuid(), versao: (antigo ? antigo.versao : 0) + 1,
      criadoPor: antigo ? antigo.criadoPor : this.ctx.email, criadoEm: antigo ? antigo.criadoEm : agora, alteradoPor: this.ctx.email, alteradoEm: agora};
    const linha = a.getLastRow() + 1; a.getRange(linha, 1, 1, 6).setValues([[e.id, e.versao, operacaoId, agora, this.ctx.email, JSON.stringify(e)]]);
    this.marcar(linha); this.cache = null; return e;
  }
  /**
   * 2.26.7: várias revisões numa escrita só (para ações em bloco feitas pelo proprietário no editor).
   * lista: [{item, idFixo}] — cada um vira a versão seguinte do seu ID; nada é apagado.
   */
  gravarLote(lista, operacaoBase) {
    if (!lista.length) return [];
    this.paraEscrever();
    const a = this.aba(), agora = new Date().toISOString(), linhas = [], out = [];
    lista.forEach(({item, idFixo}, i) => {
      const antigo = this.obter(idFixo), e = {...item, id: idFixo, versao: (antigo ? antigo.versao : 0) + 1,
        criadoPor: antigo ? antigo.criadoPor : this.ctx.email, criadoEm: antigo ? antigo.criadoEm : agora, alteradoPor: this.ctx.email, alteradoEm: agora};
      linhas.push([e.id, e.versao, operacaoBase + '-' + i, agora, this.ctx.email, JSON.stringify(e)]); out.push(e);
    });
    const de = a.getLastRow() + 1; a.getRange(de, 1, linhas.length, 6).setValues(linhas);
    this.marcar(de + linhas.length - 1); this.cache = null; return out;
  }
  /** O item gravado por esta operação, se ela já aconteceu (para repetir sem duplicar). 2.37: procura só nas últimas
   *  1000 revisões (uma repetição chega em segundos ou minutos), em vez de ler a coluna inteira. */
  porOperacao(operacaoId) {
    const a = this.aba(), ultima = a.getLastRow(); if (ultima < 2) return null;
    const de = Math.max(2, ultima - 999), i = a.getRange(de, 3, ultima - de + 1, 1).getValues().findIndex(r => String(r[0]) === operacaoId);
    return i >= 0 ? JSON.parse(a.getRange(de + i, 6).getValue()) : null;
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
      try { const ctx = AplicacaoCPT.identidade(), r = fn(ctx); ColecaoCPT.manter(ctx); return r; } finally { lock.releaseLock(); }
    });
  }
}
