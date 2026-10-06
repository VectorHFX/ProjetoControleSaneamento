/**
 * LevantamentoCPT 2.33.0. Levantamento de traçado: casa por casa ao longo de uma obra.
 * Fica na planilha "CPT • Dados da aplicação" (config.agendaId), aba "Levantamento de traçado": uma linha por casa (obra + rua + número).
 * - O celular guarda cada casa na hora e envia em lotes; a mesma operação nunca grava duas vezes.
 * - Casa já levantada só muda com "atualizar" (as casas não são revisitadas: o aviso pega número digitado duas vezes).
 * - Só o endereço do imóvel e o resultado. Nome e telefone do morador não entram aqui.
 * - Toda a equipe usa e vê os resultados (trava de testes pausada).
 */
class LevantamentoCPT {
  static get abaNome() { return 'Levantamento de traçado'; }
  static get cabecalho() { return ['ID', 'Operação ID', 'Obra ID', 'Obra', 'Bairro', 'Rua', 'Número', 'Tipo', 'Imóvel', 'Resultado', 'Observação', 'Visitada em', 'Registrado por', 'Nome', 'Registrado em', 'Atualizado por', 'Atualizado em']; }
  static get tipos() { return ['Residencial', 'Comercial', 'Outro']; }
  static get imoveis() { return ['Casa', 'Prédio', 'Terreno']; }
  static get resultados() { return ['Comunicado', 'Contato com morador']; }
  static get lote() { return 100; }
  /** Mesma casa = mesma obra, rua e número (sem acento, caixa ou espaços extras). */
  static chave(obraId, rua, numero) { const n = DadosDaAplicacao.norm; return [String(obraId), n(rua).replace(/\s+/g, ' '), n(numero).replace(/\s+/g, '')].join('|'); }
  constructor(ctx) { this.ctx = ctx; }
  aba(criar) {
    if (!this.ctx.config.agendaId) throw new Error('Os dados da aplicação ainda não foram preparados. Avise a administração técnica.');
    const ss = planilhaCPT_(this.ctx.config.agendaId), cab = LevantamentoCPT.cabecalho; let a = ss.getSheetByName(LevantamentoCPT.abaNome);
    if (!a && criar) { a = ss.insertSheet(LevantamentoCPT.abaNome); a.getRange(1, 1, 1, cab.length).setValues([cab]); a.setFrozenRows(1); }
    if (a && a.getLastRow() > 0 && a.getRange(1, 1, 1, cab.length).getValues()[0].some((v, i) => v !== cab[i]))
      throw new Error('Cabeçalho do Levantamento de traçado incompatível. Nenhum dado foi substituído.');
    return a;
  }
  linhas(a) { return a && a.getLastRow() > 1 ? a.getRange(2, 1, a.getLastRow() - 1, LevantamentoCPT.cabecalho.length).getValues() : []; }
  static instante(v) { return v instanceof Date ? v.toISOString() : String(v || ''); }
  publico(r) {
    return {id: String(r[0]), obraId: String(r[2]), obra: String(r[3]), bairro: String(r[4]), rua: String(r[5]), numero: String(r[6]), tipo: String(r[7]), imovel: String(r[8]),
      resultado: String(r[9]), observacao: String(r[10]), visitadaEm: LevantamentoCPT.instante(r[11]), nome: String(r[13]), atualizadoEm: LevantamentoCPT.instante(r[16])};
  }
  /** Obras para começar a sessão (busca digitada no celular): todas, com o nome de uso e os bairros. */
  obras() {
    const o = new ObrasCPT(this.ctx), ordem = {'Em andamento': 0, 'Paralisada': 1, 'A confirmar': 2, '': 3, 'Finalizada': 4};
    return o.ler().linhas.map(x => o.publico(x)).map(x => ({id: x.id, nome: x.exibir, oficial: x.nome, apelidos: x.apelidos, bairros: x.bairros, situacao: x.situacao}))
      .sort((a, b) => (ordem[a.situacao] ?? 3) - (ordem[b.situacao] ?? 3) || a.nome.localeCompare(b.nome, 'pt-BR'));
  }
  /** Casas levantadas (todas as obras) e as opções. O celular guarda a lista para avisar duplicadas sem internet. */
  listar() {
    const itens = this.linhas(this.aba(false)).filter(r => r[0]).map(r => this.publico(r));
    return {itens, obras: this.obras(), tipos: LevantamentoCPT.tipos, imoveis: LevantamentoCPT.imoveis, resultados: LevantamentoCPT.resultados, agora: new Date().toISOString()};
  }
  /**
   * Lote vindo do celular: [{operacaoId, obraId, bairro, rua, numero, tipo, imovel, resultado, observacao, visitadaEm, atualizar}].
   * Cada casa volta com situacao: 'salva' | 'atualizada' | 'ja-recebida' | 'duplicada' (já levantada; reenviar com atualizar) | 'invalida' (com mensagem).
   */
  enviar(p) {
    const lista = p && Array.isArray(p.itens) ? p.itens : null;
    if (!lista || !lista.length) throw new Error('Nada para enviar.');
    if (lista.length > LevantamentoCPT.lote) throw new Error('Envie até ' + LevantamentoCPT.lote + ' casas por vez.');
    const a = this.aba(true), rows = this.linhas(a), porOp = new Map(), porChave = new Map(), obras = new Map(this.obras().map(o => [o.id, o]));
    rows.forEach((r, i) => { if (!r[0]) return; porOp.set(String(r[1]), i); porChave.set(LevantamentoCPT.chave(r[2], r[5], r[6]), i); });
    const agora = new Date(), novas = [], mudadas = new Set(), resultados = [];
    lista.forEach(x => {
      const op = x && typeof x.operacaoId === 'string' && /^OP-[\w-]{8,70}$/.test(x.operacaoId) ? x.operacaoId : '';
      try {
        if (!op) throw new Error('Identificação inválida. Apague esta casa e registre de novo.');
        if (porOp.has(op)) { resultados.push({operacaoId: op, situacao: 'ja-recebida', casa: this.publico(rows[porOp.get(op)])}); return; }
        const c = this.validar(x, obras), k = LevantamentoCPT.chave(c.obraId, c.rua, c.numero);
        if (porChave.has(k)) {
          const i = porChave.get(k);
          if (x.atualizar !== true) { resultados.push({operacaoId: op, situacao: 'duplicada', casa: this.publico(rows[i])}); return; }
          const r = rows[i]; r[1] = op; r[4] = c.bairro; r[7] = c.tipo; r[8] = c.imovel; r[9] = c.resultado; r[10] = c.observacao; r[11] = c.visitadaEm; r[15] = this.ctx.email; r[16] = agora;
          porOp.set(op, i); mudadas.add(i); resultados.push({operacaoId: op, situacao: 'atualizada', casa: this.publico(r)}); return;
        }
        const r = ['LEV-' + Utilities.getUuid(), op, c.obraId, c.obra, c.bairro, c.rua, c.numero, c.tipo, c.imovel, c.resultado, c.observacao, c.visitadaEm, this.ctx.email, this.ctx.perfil.nome, agora, '', ''];
        rows.push(r); porOp.set(op, rows.length - 1); porChave.set(k, rows.length - 1); novas.push(r);
        resultados.push({operacaoId: op, situacao: 'salva', casa: this.publico(r)});
      } catch (e) { resultados.push({operacaoId: op || String(x && x.operacaoId || ''), situacao: 'invalida', mensagem: e.message}); }
    });
    // Atualizações: linha a linha (poucas). Novas: um único bloco no fim da aba.
    mudadas.forEach(i => { if (i < rows.length - novas.length) a.getRange(i + 2, 1, 1, LevantamentoCPT.cabecalho.length).setValues([rows[i]]); });
    if (novas.length) a.getRange(a.getLastRow() + 1, 1, novas.length, LevantamentoCPT.cabecalho.length).setValues(novas);
    const n = s => resultados.filter(r => r.situacao === s).length;
    return {resultados, salvas: n('salva') + n('atualizada') + n('ja-recebida'), duplicadas: n('duplicada'), invalidas: n('invalida')};
  }
  validar(x, obras) {
    const T = ColecaoCPT.texto, o = obras.get(String(x.obraId || ''));
    if (!o) throw new Error('Obra não encontrada no catálogo. Comece a sessão de novo pela obra.');
    const bairro = T(x.bairro, 150, 'bairro'), v = new Date(String(x.visitadaEm || '')), agora = Date.now();
    return {obraId: o.id, obra: o.nome, bairro: o.bairros.includes(bairro) ? bairro : bairro && !o.bairros.length ? bairro : o.bairros[0] || '',
      rua: T(x.rua, 150, 'rua', true), numero: T(x.numero, 20, 'número', true),
      tipo: ColecaoCPT.opcao(x.tipo, LevantamentoCPT.tipos, 'tipo'), imovel: ColecaoCPT.opcao(x.imovel, LevantamentoCPT.imoveis, 'imóvel'),
      resultado: ColecaoCPT.opcao(x.resultado, LevantamentoCPT.resultados, 'resultado'), observacao: T(x.observacao, 500, 'observação'),
      // Hora da visita vem do celular (a casa pode ser enviada horas depois); fora do razoável, vale a hora do envio.
      visitadaEm: isNaN(v) || v.getTime() > agora + 36e5 || v.getTime() < agora - 30 * 864e5 ? new Date(agora) : v};
  }
}

function listarLevantamentoCPT() { return DesempenhoCPT.medir('levantamento.listar', () => new LevantamentoCPT(AplicacaoCPT.contexto()).listar()); }
function enviarLevantamentoCPT(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('Há outro envio em andamento. As casas continuam guardadas no celular e vão no próximo envio.');
  try { return DesempenhoCPT.medir('levantamento.enviar', () => new LevantamentoCPT(AplicacaoCPT.contexto()).enviar(p)); }
  finally { lock.releaseLock(); }
}
