/**
 * ObrasDoDiaCPT 2.14.0. "Outra obra", obras de hoje e as missões que saem delas.
 * - Vínculos: o registro do Campo 4.0 não é alterado (ele tem assinatura de integridade). O vínculo fica na coleção
 *   "Vínculos de obra" e é aplicado na leitura (DadosDaAplicacao.vincular), então vale em todas as telas e no relatório.
 * - Obras de hoje: a engenharia só avisa no próprio dia. A partir das 7h, a gerência confirma quais obras tiveram frente.
 *   Sugestão: obras do cronograma do dia + as confirmadas no dia anterior. Dia sem confirmação fica "não informado".
 * - Comparação (painel da gestão), por dia e no mês: ativas, com ação, ativas sem ação, ação em obra não ativa.
 * - Missões: tarefas automáticas do checklist. Somem sozinhas quando o trabalho é feito.
 * - Período de testes (PerfisCPT.travada): confirmar e vincular ficam só com o proprietário; depois, Administrativo e Gestão.
 * Desempenho: quem não confere obras não abre a base por causa disto. Os vínculos ficam em cache pela versão
 * CPT_VINCULOS_VERSAO (sem vínculo nenhum, nada é lido) e a contagem de pendentes, pela última linha dos registros.
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
  static versaoVinculos() { return Number(PropertiesService.getScriptProperties().getProperty('CPT_VINCULOS_VERSAO') || 0); }
  /** registroId → {id, rotulo}. Sem vínculo gravado ainda (versão 0), não abre planilha nenhuma. */
  static mapaVinculos() {
    if (VINCULOS_CPT_.mapa) return VINCULOS_CPT_.mapa;
    const c = VINCULOS_CPT_.config, v = ObrasDoDiaCPT.versaoVinculos();
    let lista = [];
    if (v && c && c.agendaId) try {
      lista = CacheCPT.obter('vinculos:' + c.agendaId + ':' + v, 21600, () => new ColecaoCPT({config: c}, 'Vínculos de obra', 'VIN').itens().filter(x => x.obraId).map(x => [x.registroId, x.obraId, x.rotulo]));
    } catch (_) { lista = []; }
    return (VINCULOS_CPT_.mapa = new Map(lista.map(([r, id, rotulo]) => [r, {id, rotulo}])));
  }
  /** Quem confere obras: Administrativo e Gestão; no período de testes, só o proprietário. */
  static pode(perfil) { return PerfisCPT.gerencia(perfil) && (perfil.papeis.includes('administrador') || !PerfisCPT.travada()); }

  constructor(ctx) {
    this.ctx = ctx;
    this.vinculos = new ColecaoCPT(ctx, 'Vínculos de obra', 'VIN'); this.dias = new ColecaoCPT(ctx, 'Obras do dia', 'ODD');
  }
  /** A base só é aberta quando alguém realmente precisa dela. */
  get dados() { if (!this._dados) { if (!this.ctx.base) this.ctx.base = planilhaCPT_(this.ctx.config.baseId); this._dados = new DadosDaAplicacao(this.ctx.base, this.ctx.perfil); } return this._dados; }
  exigirGerencia() {
    if (!PerfisCPT.gerencia(this.ctx.perfil)) throw new Error('Esta conferência é feita pelo Administrativo ou pela Gestão.');
    PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'Confirmar obras e vincular registros');
  }
  catalogo() { if (!this._obras) { void this.dados; /* abre a base */ const o = new ObrasCPT(this.ctx); this._obras = o.ler().linhas.map(x => o.publico(x)); } return this._obras; }
  obra(id) { const o = this.catalogo().find(x => x.id === id); if (!o) throw new Error('Obra não encontrada: ' + id + '. Atualize a página.'); return o; }
  resumoObra(o) { return {id: o.id, exibir: o.exibir, bairros: o.bairros, situacao: o.situacao}; }
  ativasDoCatalogo() { return this.catalogo().filter(o => ['Em andamento', 'Paralisada', 'A confirmar'].includes(o.situacao)); }

  // ---------- "Outra obra" ----------
  /** Linhas (A:N, com os vínculos já aplicados) e o número da linha na planilha. A coluna de detalhes, pesada, fica de fora. */
  linhasRegistros() { if (!this._linhas) this._linhas = this.dados.ler(this.dados.registros(), 14).map((r, i) => ({r, linha: i + 2})); return this._linhas; }
  pendentesDeVinculo() { return this.linhasRegistros().filter(x => x.r[0] && !String(x.r[10] || '') && ObrasDoDiaCPT.outraObra(x.r[9])); }
  /** Contagem para a missão: guardada pela última linha dos registros e pela versão dos vínculos. */
  contarPendentes() {
    const a = this.dados.registros(), chave = 'vinc-pend:' + this.ctx.config.baseId + ':' + a.getLastRow() + ':' + ObrasDoDiaCPT.versaoVinculos();
    return CacheCPT.obter(chave, 3600, () => ({n: this.pendentesDeVinculo().length})).n;
  }
  resumoRegistro(x, detalhes) {
    const r = x.r; let observacao = '';
    if (detalhes) try { const d = DadosDaAplicacao.lerDetalhes(this.dados.registros().getRange(x.linha, 21).getValue()); observacao = ((d.campos || []).filter(c => /observa/i.test(c.titulo || '') && c.valor).map(c => DadosDaAplicacao.json(c.valor)).pop() || ''); } catch (_) {}
    return {id: String(r[0]), procedimento: String(r[1]), data: this.dados.data(r[2]), bairro: String(r[7] || ''), responsavel: String(r[11] || ''), atividade: String(r[13] || ''), observacao: String(observacao).slice(0, 600)};
  }
  /** Pendentes (os 50 mais recentes, com a observação final) e os vínculos já feitos, para corrigir um engano. */
  listarVinculos() {
    this.exigirGerencia();
    const pend = this.pendentesDeVinculo().sort((a, b) => this.dados.data(b.r[2]).localeCompare(this.dados.data(a.r[2])));
    const porId = new Map(this.linhasRegistros().map(x => [String(x.r[0]), x]));
    const feitos = this.vinculos.itens().slice().sort((a, b) => String(b.alteradoEm).localeCompare(String(a.alteradoEm))).slice(0, 20)
      .map(v => porId.get(v.registroId) ? {...this.resumoRegistro(porId.get(v.registroId), false), obraId: v.obraId, obra: v.rotulo, por: v.alteradoPor} : null).filter(Boolean);
    return {pendentes: pend.slice(0, 50).map(x => this.resumoRegistro(x, true)), totalPendentes: pend.length, feitos,
      // 2.26.8: entram também as finalizadas (há ação pós-obra); as em andamento vêm primeiro. "busca" leva nome oficial e apelidos.
      obras: this.catalogo().map(o => ({...this.resumoObra(o), busca: ObrasCPT.nomesConhecidos(o).join(' ')}))
        .sort((a, b) => (a.situacao === 'Finalizada') - (b.situacao === 'Finalizada') || a.exibir.localeCompare(b.exibir, 'pt-BR'))};
  }
  vincular(p) {
    this.exigirGerencia();
    if (!p || typeof p.registroId !== 'string' || !/^REG-[a-f0-9]{24}$/.test(p.registroId)) throw new Error('Registro inválido.');
    const o = this.obra(String(p.obraId || ''));
    // Pode vincular um pendente ou trocar um vínculo já feito (para corrigir engano). Nada além disso.
    const atual = this.vinculos.obter('VIN-' + p.registroId);
    if (!atual && !this.pendentesDeVinculo().some(x => String(x.r[0]) === p.registroId)) throw new Error('Este registro já foi vinculado ou não é de "obra ainda não cadastrada". Atualize a página.');
    if (atual && atual.obraId === o.id) return {resultado: 'Este registro já está em ' + o.exibir + '.'};
    const rotulo = o.exibir + ' [' + o.id + ']';
    this.vinculos.gravar({registroId: p.registroId, obraId: o.id, rotulo}, atual ? atual.versao : 0, p.operacaoId, 'VIN-' + p.registroId);
    const props = PropertiesService.getScriptProperties(); props.setProperty('CPT_VINCULOS_VERSAO', String(ObrasDoDiaCPT.versaoVinculos() + 1));
    ObrasDoDiaCPT.iniciar(this.ctx.config); ObrasDoDiaCPT.invalidarPaineis();
    return {resultado: (atual ? 'Vínculo trocado para ' : 'Registro vinculado a ') + o.exibir + '.'};
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
      obras: this.ativasDoCatalogo().map(o => this.resumoObra(o)).sort((a, b) => a.exibir.localeCompare(b.exibir, 'pt-BR')), podeConfirmar: ObrasDoDiaCPT.pode(this.ctx.perfil)};
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
    if (!ObrasDoDiaCPT.pode(this.ctx.perfil)) return out;
    const {dia, hora} = ObrasDoDiaCPT.agora();
    if (hora >= ObrasDoDiaCPT.horaInicio && !this.confirmacao(dia))
      out.push({id: 'obras-hoje', titulo: 'Confirmar as obras de hoje', texto: 'Marque as obras com frente de serviço hoje. Sem isso, o dia fica "não informado" no painel.', rota: 'obras', aba: 'hoje'});
    const n = this.contarPendentes();
    if (n) out.push({id: 'vincular-obra', titulo: 'Vincular ' + n + (n === 1 ? ' registro' : ' registros') + ' de "outra obra"', texto: 'Ligue cada registro a uma obra do catálogo ou cadastre a obra nova.', rota: 'obras', aba: 'vincular'});
    return out;
  }
}

function listarVinculosObraCPT() { return AplicacaoCPT.executar((d, ctx) => new ObrasDoDiaCPT(ctx).listarVinculos(), 'obras.vinculos'); }
function vincularObraCPT(p) { return ColecaoCPT.executar('obras.vincular', ctx => new ObrasDoDiaCPT(ctx).vincular(p), true); }
function obrasDeHojeCPT(p) { return AplicacaoCPT.executar((d, ctx) => new ObrasDoDiaCPT(ctx).obrasDeHoje(p), 'obras.hoje'); }
function confirmarObrasDoDiaCPT(p) { return ColecaoCPT.executar('obras.confirmarDia', ctx => new ObrasDoDiaCPT(ctx).confirmar(p), true); }
function compararObrasDoMesCPT(mes) { return AplicacaoCPT.executar((d, ctx) => new ObrasDoDiaCPT(ctx).comparar(mes), 'obras.comparar'); }
// missoesCPT (todas as missões) fica em MissoesCPT.
