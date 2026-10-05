/**
 * ObrasDoDiaCPT 2.14.0. "Outra obra", obras de hoje e as missões que saem delas.
 * - Vínculos: o registro do Campo 4.0 não é alterado (ele tem assinatura de integridade). O vínculo fica na coleção
 *   "Vínculos de obra" e é aplicado na leitura (DadosDaAplicacao.vincular), então vale em todas as telas e no relatório.
 * - Obras de hoje: a engenharia só avisa no próprio dia. A partir das 7h, a gerência confirma quais obras tiveram frente.
 *   Sugestão: obras do cronograma do dia + as confirmadas no dia anterior. Dia sem confirmação fica "não informado".
 * - Comparação (painel da gestão), por dia e no mês: ativas, com ação, ativas sem ação, ação em obra não ativa.
 * - Missões: tarefas automáticas do checklist. Somem sozinhas quando o trabalho é feito.
 */
const VINCULOS_CPT_ = {config: null, mapa: null};
class ObrasDoDiaCPT {
  static get horaInicio() { return 7; }
  static get fuso() { return 'America/Sao_Paulo'; }
  /** Relógio substituível nos testes. */
  static relogio() { return new Date(); }
  static agora() { const s = Utilities.formatDate(ObrasDoDiaCPT.relogio(), ObrasDoDiaCPT.fuso, "yyyy-MM-dd'T'HH:mm"); return {dia: s.slice(0, 10), hora: Number(s.slice(11, 13))}; }
  static diaAnterior(dia) { return new Date(Date.parse(dia + 'T12:00:00Z') - 864e5).toISOString().slice(0, 10); }
  static outraObra(texto) { return /ainda nao cadastrada/.test(DadosDaAplicacao.norm(texto)); }

  /** Chamado no início de cada execução: os vínculos são lidos de novo, uma vez, quando alguém ler os registros. */
  static iniciar(config) { VINCULOS_CPT_.config = config; VINCULOS_CPT_.mapa = null; }
  /** registroId → {id, rotulo}. Sem dados da aplicação preparados, nada é aplicado. */
  static mapaVinculos() {
    if (VINCULOS_CPT_.mapa) return VINCULOS_CPT_.mapa;
    const m = new Map(), c = VINCULOS_CPT_.config;
    if (c && c.agendaId) try { new ColecaoCPT({config: c}, 'Vínculos de obra', 'VIN').itens().forEach(v => { if (v.obraId) m.set(v.registroId, {id: v.obraId, rotulo: v.rotulo}); }); } catch (_) {}
    return (VINCULOS_CPT_.mapa = m);
  }

  constructor(ctx) {
    this.ctx = ctx; if (!ctx.base) ctx.base = planilhaCPT_(ctx.config.baseId);
    this.dados = new DadosDaAplicacao(ctx.base, ctx.perfil);
    this.vinculos = new ColecaoCPT(ctx, 'Vínculos de obra', 'VIN'); this.dias = new ColecaoCPT(ctx, 'Obras do dia', 'ODD');
  }
  exigirGerencia() { if (!PerfisCPT.gerencia(this.ctx.perfil)) throw new Error('Esta conferência é feita pelo Administrativo ou pela Gestão.'); }
  catalogo() { if (!this._obras) { const o = new ObrasCPT(this.ctx); this._obras = o.ler().linhas.map(x => o.publico(x)); } return this._obras; }
  obra(id) { const o = this.catalogo().find(x => x.id === id); if (!o) throw new Error('Obra não encontrada: ' + id + '. Atualize a página.'); return o; }
  resumoObra(o) { return {id: o.id, exibir: o.exibir, bairros: o.bairros, situacao: o.situacao}; }
  ativasDoCatalogo() { return this.catalogo().filter(o => ['Em andamento', 'Paralisada', 'A confirmar'].includes(o.situacao)); }

  // ---------- "Outra obra" ----------
  pendentesDeVinculo() {
    return this.dados.ler(this.dados.registros(), 21).filter(r => r[0] && !String(r[10] || '') && ObrasDoDiaCPT.outraObra(r[9]));
  }
  listarVinculos() {
    this.exigirGerencia();
    const pendentes = this.pendentesDeVinculo().map(r => {
      let observacao = '';
      try { const d = DadosDaAplicacao.lerDetalhes(r[20]); observacao = ((d.campos || []).filter(c => /observa/i.test(c.titulo || '') && c.valor).map(c => DadosDaAplicacao.json(c.valor)).pop() || ''); } catch (_) {}
      return {id: String(r[0]), procedimento: String(r[1]), data: this.dados.data(r[2]), bairro: String(r[7] || ''), responsavel: String(r[11] || ''), atividade: String(r[13] || ''), observacao: String(observacao).slice(0, 600)};
    }).sort((a, b) => b.data.localeCompare(a.data));
    return {pendentes, obras: this.catalogo().filter(o => o.situacao !== 'Finalizada').map(o => this.resumoObra(o)).sort((a, b) => a.exibir.localeCompare(b.exibir, 'pt-BR'))};
  }
  vincular(p) {
    this.exigirGerencia();
    if (!p || typeof p.registroId !== 'string' || !/^REG-[a-f0-9]{24}$/.test(p.registroId)) throw new Error('Registro inválido.');
    const o = this.obra(String(p.obraId || ''));
    if (!this.pendentesDeVinculo().some(r => String(r[0]) === p.registroId)) throw new Error('Este registro já foi vinculado ou não é de "obra ainda não cadastrada". Atualize a página.');
    const rotulo = o.exibir + ' [' + o.id + ']', atual = this.vinculos.obter('VIN-' + p.registroId);
    this.vinculos.gravar({registroId: p.registroId, obraId: o.id, rotulo}, atual ? atual.versao : 0, p.operacaoId, 'VIN-' + p.registroId);
    ObrasDoDiaCPT.iniciar(this.ctx.config); ObrasDoDiaCPT.invalidarPaineis();
    return {resultado: 'Registro vinculado a ' + o.exibir + '.'};
  }
  /** Visão do mês e painel guardam cálculo em cache pela última linha; vínculo e obras do dia não mudam a linha. */
  static invalidarPaineis() { const p = PropertiesService.getScriptProperties(); p.setProperty('CPT_ENTREGAS_VERSAO', String(Number(p.getProperty('CPT_ENTREGAS_VERSAO') || 0) + 1)); }

  // ---------- Obras de hoje ----------
  confirmacao(dia) { const x = this.dias.obter('ODD-' + dia); return x ? {dia, obras: x.obras || [], nenhuma: !!x.nenhuma, versao: x.versao, por: x.alteradoPor, em: x.alteradoEm} : null; }
  /** Obras citadas no cronograma do dia: pelo [OBR-…] no texto ou por qualquer nome conhecido (oficial, de uso, apelido). */
  doCronograma(dia) {
    let eventos = [];
    try { eventos = [...new CronogramaCPT(this.ctx).ler().atuais.values()].filter(e => e.data === dia && e.status !== 'cancelada' && e.obra); } catch (_) { return []; }
    const porNome = new Map(); this.ativasDoCatalogo().forEach(o => ObrasCPT.nomesConhecidos(o).forEach(n => porNome.set(DadosDaAplicacao.norm(n), o.id)));
    const ids = new Set();
    eventos.forEach(e => { const m = String(e.obra).match(/\[(OBR-\d+)\]/); const id = m ? m[1] : porNome.get(DadosDaAplicacao.norm(String(e.obra).split(' — ')[0])); if (id) ids.add(id); });
    return [...ids];
  }
  obrasDeHoje(p) {
    const {dia: hoje, hora} = ObrasDoDiaCPT.agora(), dia = p && p.dia ? ColecaoCPT.data(p.dia, 'dia', true) : hoje;
    const ontem = this.confirmacao(ObrasDoDiaCPT.diaAnterior(dia)), ativas = new Set(this.ativasDoCatalogo().map(o => o.id));
    const sugestao = [...new Set(this.doCronograma(dia).concat(ontem ? ontem.obras : []))].filter(id => ativas.has(id)).sort();
    return {dia, hoje, antesDoHorario: dia === hoje && hora < ObrasDoDiaCPT.horaInicio, confirmado: this.confirmacao(dia), sugestao,
      obras: this.ativasDoCatalogo().map(o => this.resumoObra(o)).sort((a, b) => a.exibir.localeCompare(b.exibir, 'pt-BR')), podeConfirmar: PerfisCPT.gerencia(this.ctx.perfil)};
  }
  confirmar(p) {
    this.exigirGerencia();
    if (!p || typeof p !== 'object') throw new Error('Dados inválidos.');
    const {dia: hoje} = ObrasDoDiaCPT.agora(), dia = ColecaoCPT.data(p.dia, 'dia', true);
    if (dia > hoje) throw new Error('Não dá para confirmar um dia no futuro: a engenharia só informa no próprio dia.');
    if (!Array.isArray(p.obras) || p.obras.length > 200) throw new Error('Lista de obras inválida.');
    const obras = [...new Set(p.obras.map(String))].map(id => this.obra(id).id).sort(), nenhuma = p.nenhuma === true;
    if (nenhuma && obras.length) throw new Error('Marque as obras ou "nenhuma obra hoje", não os dois.');
    if (!nenhuma && !obras.length) throw new Error('Marque pelo menos uma obra ou "nenhuma obra hoje".');
    const atual = this.dias.obter('ODD-' + dia);
    this.dias.gravar({dia, obras, nenhuma}, p.versao != null ? p.versao : atual ? atual.versao : 0, p.operacaoId, 'ODD-' + dia);
    ObrasDoDiaCPT.invalidarPaineis();
    return {resultado: nenhuma ? 'Registrado: nenhuma obra em ' + dia.split('-').reverse().join('/') + '.' : obras.length + (obras.length === 1 ? ' obra confirmada' : ' obras confirmadas') + ' para ' + dia.split('-').reverse().join('/') + '.', confirmado: this.confirmacao(dia)};
  }

  // ---------- Comparação (painel da gestão) ----------
  comparar(mes) {
    mes = this.dados.mes(mes);
    const {dia: hoje} = ObrasDoDiaCPT.agora(), nome = new Map(this.catalogo().map(o => [o.id, o.exibir])), porDia = new Map();
    this.dados.ler(this.dados.registros(), 11).forEach(r => {
      const d = this.dados.data(r[2]), id = String(r[10] || '');
      if (!r[0] || !id || !d.startsWith(mes)) return;
      if (!porDia.has(d)) porDia.set(d, new Set()); porDia.get(d).add(id);
    });
    const ultimo = new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0)).getUTCDate(), dias = [];
    for (let i = 1; i <= ultimo; i++) {
      const dia = mes + '-' + String(i).padStart(2, '0'); if (dia > hoje) break;
      const c = this.confirmacao(dia), acao = porDia.get(dia) || new Set(), ativas = new Set(c ? c.obras : []);
      const nomes = ids => ids.map(id => nome.get(id) || id).sort((a, b) => a.localeCompare(b, 'pt-BR'));
      dias.push({dia, informado: !!c, nenhuma: !!(c && c.nenhuma), ativas: ativas.size, comAcao: acao.size,
        ativasSemAcao: c ? nomes([...ativas].filter(id => !acao.has(id))) : [], acaoForaDasAtivas: c ? nomes([...acao].filter(id => !ativas.has(id))) : []});
    }
    const informados = dias.filter(d => d.informado), soma = k => informados.reduce((s, d) => s + d[k].length, 0);
    return {dias, mes: {diasInformados: informados.length, diasNaoInformados: dias.length - informados.length, ativasSemAcao: soma('ativasSemAcao'), acaoForaDasAtivas: soma('acaoForaDasAtivas')}};
  }

  // ---------- Missões ----------
  missoes() {
    const out = [];
    if (!PerfisCPT.gerencia(this.ctx.perfil)) return out;
    const {dia, hora} = ObrasDoDiaCPT.agora();
    if (hora >= ObrasDoDiaCPT.horaInicio && !this.confirmacao(dia))
      out.push({id: 'obras-hoje', titulo: 'Confirmar as obras de hoje', texto: 'Marque as obras com frente de serviço hoje. Sem isso, o dia fica "não informado" no painel.', rota: 'obras', aba: 'hoje'});
    const n = this.pendentesDeVinculo().length;
    if (n) out.push({id: 'vincular-obra', titulo: 'Vincular ' + n + (n === 1 ? ' registro' : ' registros') + ' de "outra obra"', texto: 'Ligue cada registro a uma obra do catálogo ou cadastre a obra nova.', rota: 'obras', aba: 'vincular'});
    return out;
  }
}

function listarVinculosObraCPT() { return AplicacaoCPT.executar((d, ctx) => new ObrasDoDiaCPT(ctx).listarVinculos(), 'obras.vinculos'); }
function vincularObraCPT(p) { return ColecaoCPT.executar('obras.vincular', ctx => new ObrasDoDiaCPT(ctx).vincular(p), true); }
function obrasDeHojeCPT(p) { return AplicacaoCPT.executar((d, ctx) => new ObrasDoDiaCPT(ctx).obrasDeHoje(p), 'obras.hoje'); }
function confirmarObrasDoDiaCPT(p) { return ColecaoCPT.executar('obras.confirmarDia', ctx => new ObrasDoDiaCPT(ctx).confirmar(p), true); }
function compararObrasDoMesCPT(mes) { return AplicacaoCPT.executar((d, ctx) => new ObrasDoDiaCPT(ctx).comparar(mes), 'obras.comparar'); }
function missoesCPT() { return AplicacaoCPT.executar((d, ctx) => ({missoes: new ObrasDoDiaCPT(ctx).missoes()}), 'missoes'); }
