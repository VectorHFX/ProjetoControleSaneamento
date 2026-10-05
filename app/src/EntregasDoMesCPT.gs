/**
 * EntregasDoMesCPT 2.15.0. As 4 entregas do mês, cada uma com situação, responsável, prazo e versão.
 * - Relatório mensal (base gerada no Fechamento) · Anexos do relatório (2.26: a planilha oficial, AnexosRelatorioCPT) ·
 *   Programa Parceiros (máscara oficial) · Atendimentos (pasta das fichas oficiais + .zip).
 * - Situação: A fazer → Em preparo → Em revisão → Entregue. Sem situação gravada, vale "Em preparo" se já há arquivo.
 * - Ao marcar Entregue, guarda um retrato: cópia do arquivo na pasta do mês, em "Entregues/vN" (a máscara do
 *   Programa Parceiros é oficial e compartilhada: dela fica só o link e a versão publicada).
 * - Quem vê: Socioambiental, Comunicação, Gestão e Administrativo. Quem altera: os mesmos; "Entregue" só a gerência.
 *   No período de testes, só o proprietário altera (PerfisCPT.exigirConfiguracao).
 * - Os dados ficam na coleção "Entregas do mês" (uma linha por revisão; nada é apagado).
 */
class EntregasDoMesCPT {
  static get tipos() {
    return [
      {id: 'relatorio', titulo: 'Relatório mensal', texto: 'Base do relatório (itens 1 a 13), gerada aqui embaixo.', rota: '', icone: 'file'},
      {id: 'anexos', titulo: 'Anexos do relatório', texto: 'Planilha oficial: a aplicação acrescenta os casos do mês no Controle de manifestações; Matriz de Contatos e Indicadores 2026 são à mão.', rota: '', icone: 'file'},
      {id: 'parceiros', titulo: 'Programa Parceiros', texto: 'Respostas publicadas na máscara oficial.', rota: 'parceiros', icone: 'partner'},
      {id: 'atendimentos', titulo: 'Atendimentos', texto: 'Fichas oficiais do mês (abertas e concluídas no período) e o .zip.', rota: '', icone: 'case'}];
  }
  static get situacoes() { return ['afazer', 'preparo', 'revisao', 'entregue']; }
  static get nomesSituacao() { return {afazer: 'A fazer', preparo: 'Em preparo', revisao: 'Em revisão', entregue: 'Entregue'}; }
  /** Limite do Google para um arquivo montado pelo script (50 MB), com folga. */
  static get limiteZip() { return 45 * 1024 * 1024; }

  constructor(ctx) { this.ctx = ctx; this.col = new ColecaoCPT(ctx, 'Entregas do mês', 'ENT'); }
  static pode(perfil) { return perfil.papeis.some(p => SocioambientalCPT.papeis.includes(p)); }
  exigirVer() { if (!EntregasDoMesCPT.pode(this.ctx.perfil)) throw new Error('As entregas do mês ficam com Socioambiental, Comunicação, Gestão e Administrativo.'); }
  exigirAlterar() { this.exigirVer(); PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'Alterar as entregas do mês'); }
  static mes(v) { const s = String(v || ''); if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(s)) throw new Error('Escolha um mês válido.'); return s; }
  /** Prazo sugerido: dia 5 do mês seguinte. */
  static prazoPadrao(mes) { const [a, m] = mes.split('-').map(Number), d = new Date(Date.UTC(a, m, 5)); return d.toISOString().slice(0, 10); }
  static idDoc(url) { return (String(url || '').match(/\/d\/([A-Za-z0-9_-]{20,})/) || [])[1] || ''; }
  pasta(mes) { return RelatorioMensalCPT.prototype.pasta.call(null, mes); }
  /** Só para ler: não cria a pasta do mês se ela ainda não existe. */
  pastaSeExiste(mes) {
    const c = AplicacaoCPT.config(); if (!c.pastaEntregasId) return null;
    try { const it = DriveApp.getFolderById(c.pastaEntregasId).getFoldersByName(mes); return it.hasNext() ? it.next() : null; } catch (_) { return null; }
  }
  subpasta(pai, nome) { const it = pai.getFoldersByName(nome); return it.hasNext() ? it.next() : pai.createFolder(nome); }

  /** Último arquivo de cada entrega, lido de onde ele é gerado. Falha numa fonte não derruba as outras. */
  arquivo(tipo, mes) {
    try {
      if (tipo === 'relatorio') { const h = new RelatorioMensalCPT(this.ctx).historicoGeracoes(mes)[0]; return h ? {titulo: 'Base do relatório · versão ' + h.versao, url: h.documento, em: h.em} : null; }
      if (tipo === 'anexos') { const a = AnexosRelatorioCPT.ultimaSync(mes); return a ? {titulo: 'Planilha oficial dos Anexos · atualizada', url: AnexosRelatorioCPT.links().planilha, em: a.em} : null; }
      if (tipo === 'parceiros') { const p = new ProgramaParceirosCPT(this.ctx).atual(mes); return p && p.publicacao ? {titulo: 'Publicado na máscara · versão ' + p.versao, url: p.publicacao.url, em: p.publicacao.em} : null; }
      if (tipo === 'atendimentos') {
        const pasta = this.pastaSeExiste(mes), it = pasta && pasta.getFoldersByName('Fichas'); if (!it || !it.hasNext()) return null;
        const f = it.next(), z = pasta.getFilesByName(EntregasDoMesCPT.nomeZip(mes)), zip = z.hasNext() ? z.next() : null;
        return {titulo: 'Pasta das fichas', url: f.getUrl(), zip: zip ? {url: zip.getUrl(), id: zip.getId(), em: zip.getLastUpdated().toISOString()} : null};
      }
    } catch (_) {}
    return null;
  }
  static nomeZip(mes) { return 'Fichas_de_atendimento_' + mes + '.zip'; }

  item(mes, tipo) { return this.col.obter('ENT-' + mes + '-' + tipo); }
  cartao(mes, t) {
    const x = this.item(mes, t.id), arquivo = this.arquivo(t.id, mes);
    return {tipo: t.id, titulo: t.titulo, texto: t.texto, rota: t.rota, situacao: x ? x.situacao : arquivo ? 'preparo' : 'afazer', gravada: !!x,
      responsavel: x ? x.responsavel || '' : '', prazo: x && x.prazo ? x.prazo : EntregasDoMesCPT.prazoPadrao(mes), entregas: x ? x.entregas || 0 : 0,
      versao: x ? x.versao : 0, retratos: x ? (x.retratos || []).slice(-5).reverse() : [], arquivo, alteradoPor: x ? x.alteradoPor : '', alteradoEm: x ? x.alteradoEm : ''};
  }
  carregar(mes) {
    this.exigirVer(); mes = EntregasDoMesCPT.mes(mes);
    const pessoas = PerfisCPT.lista(this.ctx.config).filter(p => p.ativo && EntregasDoMesCPT.pode(p)).map(p => ({email: p.email, nome: p.nome}));
    let podeAlterar = true; try { PerfisCPT.exigirConfiguracao(this.ctx.perfil, ''); } catch (_) { podeAlterar = false; }
    // 2.26.1: o cartão dos Anexos (links e última atualização) vem junto; antes era um pedido à parte ao servidor.
    let anexos = null; try { anexos = new AnexosRelatorioCPT(this.ctx).estado(mes); } catch (_) {}
    return {mes, cartoes: EntregasDoMesCPT.tipos.map(t => this.cartao(mes, t)), pessoas, nomes: EntregasDoMesCPT.nomesSituacao,
      podeAlterar, podeEntregar: podeAlterar && PerfisCPT.gerencia(this.ctx.perfil), anexos};
  }

  salvar(p) {
    this.exigirAlterar();
    if (!p || typeof p !== 'object') throw new Error('Dados inválidos.');
    const mes = EntregasDoMesCPT.mes(p.mes), t = EntregasDoMesCPT.tipos.find(x => x.id === p.tipo);
    if (!t) throw new Error('Entrega desconhecida.');
    if (!EntregasDoMesCPT.situacoes.includes(p.situacao)) throw new Error('Escolha uma situação da lista.');
    const responsavel = String(p.responsavel || '');
    if (responsavel && !PerfisCPT.lista(this.ctx.config).some(x => x.ativo && x.email === responsavel)) throw new Error('Responsável não encontrado na equipe.');
    const prazo = p.prazo ? ColecaoCPT.data(p.prazo, 'prazo', true) : '';
    // Antes de copiar qualquer arquivo: clique repetido devolve o que já foi gravado; versão antiga não grava (nem copia).
    const ja = this.col.porOperacao(String(p.operacaoId || '')); if (ja) return {resultado: t.titulo + ': já salvo.', cartao: this.cartao(mes, t)};
    const atual = this.item(mes, t.id), antes = atual ? atual.situacao : '';
    if (Number(p.versao != null ? p.versao : atual ? atual.versao : 0) !== (atual ? atual.versao : 0)) throw new Error('Outra pessoa alterou este item agora há pouco. Atualize a página e confira antes de salvar de novo.');
    if (p.situacao === 'entregue' && antes !== 'entregue' && !PerfisCPT.gerencia(this.ctx.perfil)) throw new Error('Marcar como entregue é com a Gestão ou o Administrativo.');
    const novo = {mes, tipo: t.id, situacao: p.situacao, responsavel, prazo, entregas: atual ? atual.entregas || 0 : 0, retratos: atual ? atual.retratos || [] : []};
    let aviso = '';
    if (p.situacao === 'entregue' && antes !== 'entregue') {
      const arquivo = this.arquivo(t.id, mes);
      if (!arquivo) throw new Error('Ainda não há arquivo desta entrega no mês. Gere o arquivo antes de marcar como entregue.');
      novo.entregas++;
      const r = this.retrato(mes, t, arquivo, novo.entregas); novo.retratos = novo.retratos.concat([r]); aviso = r.aviso || '';
    }
    const e = this.col.gravar(novo, p.versao != null ? Number(p.versao) : atual ? atual.versao : 0, p.operacaoId, 'ENT-' + mes + '-' + t.id);
    const nome = EntregasDoMesCPT.nomesSituacao[e.situacao];
    return {resultado: (p.situacao === 'entregue' && antes !== 'entregue' ? t.titulo + ' entregue (versão ' + e.entregas + '). Retrato guardado na pasta do mês.' : t.titulo + ': ' + nome + '.') + aviso,
      cartao: this.cartao(mes, t)};
  }
  /** Cópia do que foi entregue, para saber exatamente o que saiu mesmo se o arquivo for gerado de novo. */
  retrato(mes, t, arquivo, n) {
    const r = {versao: n, em: new Date().toISOString(), por: this.ctx.email, origem: {titulo: arquivo.titulo, url: arquivo.url}, copias: []};
    if (t.id === 'parceiros') return r;
    try {
      const destino = this.subpasta(this.subpasta(this.pasta(mes), 'Entregues'), t.titulo + ' · v' + n);
      const ids = t.id === 'atendimentos' ? (arquivo.zip ? [arquivo.zip.id] : []) : [EntregasDoMesCPT.idDoc(arquivo.url)].filter(Boolean);
      ids.forEach(id => { const f = DriveApp.getFileById(id), c = f.makeCopy(f.getName(), destino); r.copias.push({titulo: c.getName(), url: c.getUrl()}); });
      r.pasta = destino.getUrl();
      if (t.id === 'atendimentos' && !arquivo.zip) r.aviso = ' Sem o .zip das fichas, o retrato guarda só o link da pasta.';
    } catch (e) { r.aviso = ' Não foi possível copiar o arquivo (' + String(e.message || e) + '); ficou guardado o link.'; }
    return r;
  }

  /** Junta os PDFs da pasta Fichas do mês num .zip (substitui o anterior do mesmo mês). */
  zipFichas(mes) {
    this.exigirAlterar(); mes = EntregasDoMesCPT.mes(mes);
    if (!PerfisCPT.gerencia(this.ctx.perfil) && !this.ctx.perfil.papeis.includes('atendimento')) throw new Error('Seu perfil não gera o pacote de fichas.');
    const pasta = this.pasta(mes), it = pasta.getFoldersByName('Fichas');
    if (!it.hasNext()) throw new Error('Gere as fichas do mês antes de montar o .zip.');
    const arquivos = it.next().getFiles(), blobs = []; let total = 0;
    while (arquivos.hasNext()) {
      const f = arquivos.next(); if (!/\.pdf$/i.test(f.getName())) continue;
      total += f.getSize(); if (total > EntregasDoMesCPT.limiteZip) throw new Error('As fichas passam de 45 MB, o limite do Google para montar um .zip. Use o link da pasta.');
      blobs.push(f.getBlob());
    }
    if (!blobs.length) throw new Error('A pasta das fichas está vazia. Gere as fichas do mês primeiro.');
    const nome = EntregasDoMesCPT.nomeZip(mes), velhos = pasta.getFilesByName(nome);
    while (velhos.hasNext()) velhos.next().setTrashed(true);
    const zip = pasta.createFile(Utilities.zip(blobs, nome));
    return {resultado: '.zip com ' + blobs.length + (blobs.length === 1 ? ' ficha' : ' fichas') + ' pronto.', url: zip.getUrl(), fichas: blobs.length};
  }
}

function carregarEntregasDoMesCPT(mes) { return AplicacaoCPT.executar((d, ctx) => new EntregasDoMesCPT(ctx).carregar(mes), 'entregas.mes'); }
function salvarEntregaDoMesCPT(p) {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(15000)) throw new Error('Há outro salvamento em andamento. Tente de novo em alguns segundos.');
  try { return AplicacaoCPT.executar((d, ctx) => new EntregasDoMesCPT(ctx).salvar(p), 'entregas.mes.salvar'); } finally { lock.releaseLock(); }
}
function zipFichasDoMesCPT(mes) { return AplicacaoCPT.executar((d, ctx) => new EntregasDoMesCPT(ctx).zipFichas(mes), 'entregas.mes.zip'); }
