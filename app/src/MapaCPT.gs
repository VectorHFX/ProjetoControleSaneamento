/**
 * MapaCPT 2.17.1. Mapa de Santo André (Leaflet + imagens oficiais do OpenStreetMap no navegador; nada pago, sem chave).
 * - Camadas: obras (as confirmadas hoje em destaque), ações socioambientais e atendimentos (bolhas), bairros.
 * - Período: hoje, últimos 7 dias ou o mês da competência.
 * - Privacidade: só contagens agregadas por obra ou por bairro. Nenhum endereço, nome ou protocolo sai do servidor.
 *   Atendimento entra na obra pela "Frente de obra"; sem obra, no bairro cujo nome aparece no endereço; senão, "sem local".
 * - Pontos: obras em Obras J:K (latitude, longitude, as mesmas colunas do PAC16); bairros em Bairros M:N.
 *   Definidos por clique no mapa ou sugeridos pela pesquisa de endereços do Google (Maps, serviço do Apps Script).
 * - Período de testes: só o proprietário vê o mapa e posiciona pontos (PerfisCPT.exigirConfiguracao).
 */
class MapaCPT {
  /** Retângulo que cobre o município (inclui Paranapiacaba). Ponto fora dele é recusado. */
  static get limites() { return {latMin: -23.86, latMax: -23.55, lngMin: -46.60, lngMax: -46.24}; }
  static get centro() { return [-23.6639, -46.5383]; }
  static get colunasBairro() { return {lat: 13, cabecalho: ['Latitude', 'Longitude']}; }
  static dentro(lat, lng) { const l = MapaCPT.limites; return Number.isFinite(lat) && Number.isFinite(lng) && lat >= l.latMin && lat <= l.latMax && lng >= l.lngMin && lng <= l.lngMax; }

  constructor(ctx) { this.ctx = ctx; this.dados = new DadosDaAplicacao(ctx.base, ctx.perfil); this.obrasCtl = new ObrasCPT(ctx); }
  exigirVer() { PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'O mapa'); }
  exigirPosicionar() {
    if (!PerfisCPT.gerencia(this.ctx.perfil)) throw new Error('Posicionar obras e bairros é com a Gestão ou o Administrativo.');
    PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'Posicionar obras e bairros');
  }
  periodo(p) {
    const hoje = ObrasDoDiaCPT.agora().dia, tipo = String(p && p.periodo || 'mes');
    if (tipo === 'hoje') return {tipo, de: hoje, ate: hoje};
    if (tipo === 'semana') return {tipo, de: new Date(Date.parse(hoje + 'T12:00:00Z') - 6 * 864e5).toISOString().slice(0, 10), ate: hoje};
    if (tipo !== 'mes') throw new Error('Período inválido.');
    const mes = this.dados.mes(String(p && p.mes || hoje.slice(0, 7))), fim = new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0)).toISOString().slice(0, 10);
    return {tipo, de: mes + '-01', ate: fim};
  }
  /** Bairros com ponto (M:N). */
  bairros() {
    const a = this.obrasCtl.aba('Bairros'), n = a.getLastRow() - 1, c = MapaCPT.colunasBairro.lat;
    const pts = n > 0 && a.getMaxColumns() >= c + 1 ? a.getRange(2, c, n, 2).getValues() : [];
    return this.obrasCtl.bairros().filter(b => !b.especial).map(b => {
      const x = pts[b.linha - 2] || ['', '']; const lat = x[0] === '' ? null : Number(x[0]), lng = x[1] === '' ? null : Number(x[1]);
      return {...b, lat: MapaCPT.dentro(lat, lng) ? lat : null, lng: MapaCPT.dentro(lat, lng) ? lng : null};
    });
  }

  carregar(p) {
    this.exigirVer();
    const per = this.periodo(p), reg = this.dados.registros(), atd = this.dados.atendimentos(), props = PropertiesService.getScriptProperties();
    const chave = ['mapa', this.ctx.config.baseId, per.tipo, per.de, per.ate, reg.getLastRow(), atd.getLastRow(), props.getProperty('CPT_ATD_VERSAO') || 0,
      props.getProperty('CPT_VINCULOS_VERSAO') || 0, props.getProperty('CPT_MAPA_VERSAO') || 0, props.getProperty('CPT_ENTREGAS_VERSAO') || 0].join(':');
    const r = CacheCPT.obter(chave, 600, () => this.calcular(per), !!(p && p.atualizar === true));
    let podePosicionar = PerfisCPT.gerencia(this.ctx.perfil); try { PerfisCPT.exigirConfiguracao(this.ctx.perfil, ''); } catch (_) { podePosicionar = false; }
    return {...r, podePosicionar, centro: MapaCPT.centro, limites: MapaCPT.limites};
  }
  calcular(per) {
    const dentro = d => d >= per.de && d <= per.ate;
    const obras = this.obrasCtl.ler().linhas.map(o => this.obrasCtl.publico(o)).filter(o => o.situacao !== 'Finalizada' || (o.termino && o.termino >= per.de));
    const bairros = this.bairros(), porBairroNome = new Map(bairros.map(b => [DadosDaAplicacao.norm(b.nome), b]));
    let hojeConfirmadas = [];
    try { const c = new ObrasDoDiaCPT(this.ctx).confirmacao(ObrasDoDiaCPT.agora().dia); hojeConfirmadas = c ? c.obras : []; } catch (_) {}
    const O = new Map(obras.map(o => [o.id, {id: o.id, nome: o.exibir, situacao: o.situacao, lat: o.latitude, lng: o.longitude, hoje: hojeConfirmadas.includes(o.id), acoes: 0, pessoas: 0, casos: 0}]));
    const B = new Map(bairros.map(b => [b.id, {id: b.id, nome: b.nome, lat: b.lat, lng: b.lng, acoes: 0, pessoas: 0, casos: 0}]));
    const sem = {acoes: 0, casos: 0}, porNomeObra = new Map();
    obras.forEach(o => ObrasCPT.nomesConhecidos(o).forEach(n => porNomeObra.set(DadosDaAplicacao.norm(n), o.id)));
    // Ações: no bairro do registro (as bolhas de ação ficam por bairro; a obra também soma, para o destaque).
    this.dados.ler(this.dados.registros(), 18).forEach(r => {
      if (!r[0] || !dentro(this.dados.data(r[2]))) return;
      const destino = SocioambientalCPT.destino(r[1], r[13], r[17]); if (!destino || destino === '2') return;
      const pessoas = r[14] !== '' && /^\d+$/.test(String(r[14])) ? Number(r[14]) : 0;
      const b = (r[8] && B.get(String(r[8]))) || (porBairroNome.get(DadosDaAplicacao.norm(r[7])) && B.get(porBairroNome.get(DadosDaAplicacao.norm(r[7])).id));
      if (b) { b.acoes++; b.pessoas += pessoas; } else sem.acoes++;
      const o = r[10] && O.get(String(r[10])); if (o) { o.acoes++; o.pessoas += pessoas; }
    });
    // Atendimentos recebidos no período: obra pela frente; senão bairro pelo nome no endereço (o endereço não sai daqui).
    const nomesBairro = bairros.map(b => [DadosDaAplicacao.norm(b.nome), b.id]).filter(([n]) => n.length >= 4).sort((a, b) => b[0].length - a[0].length);
    this.dados.ler(this.dados.atendimentos(), 10).forEach(r => {
      if (!this.dados.principal(r) || !dentro(this.dados.data(r[4]))) return;
      const frente = DadosDaAplicacao.norm(String(r[9] || '').replace(/\s*\[OBR-\d+\]\s*$/, '').split(' — ')[0]), idObra = (String(r[9] || '').match(/\[(OBR-\d+)\]/) || [])[1] || porNomeObra.get(frente);
      if (idObra && O.get(idObra)) { O.get(idObra).casos++; return; }
      const end = ' ' + DadosDaAplicacao.norm(r[8]) + ' ', achado = nomesBairro.find(([n]) => end.includes(' ' + n + ' ') || end.includes(' ' + n + ',') || end.includes('-' + n) || end.includes(n + ' -'));
      if (achado) B.get(achado[1]).casos++; else sem.casos++;
    });
    const lista = m => [...m.values()];
    const obrasL = lista(O), bairrosL = lista(B);
    return {periodo: per, obras: obrasL, bairros: bairrosL, semLocal: sem,
      semPonto: {obras: obrasL.filter(o => o.lat == null && (o.situacao === 'Em andamento' || o.situacao === 'Paralisada')).length, bairros: bairrosL.filter(b => b.lat == null).length},
      totais: {acoes: bairrosL.reduce((s, b) => s + b.acoes, 0) + sem.acoes, pessoas: bairrosL.reduce((s, b) => s + b.pessoas, 0), casos: bairrosL.reduce((s, b) => s + b.casos, 0) + obrasL.reduce((s, o) => s + o.casos, 0) + sem.casos}};
  }

  /** Grava o ponto de uma obra (Obras J:K) ou bairro (Bairros M:N), com histórico. */
  posicionar(p) {
    this.exigirPosicionar();
    if (!p || !['obra', 'bairro'].includes(p.tipo)) throw new Error('Escolha uma obra ou um bairro.');
    const lat = Math.round(Number(p.lat) * 1e6) / 1e6, lng = Math.round(Number(p.lng) * 1e6) / 1e6;
    if (!MapaCPT.dentro(lat, lng)) throw new Error('O ponto ficou fora de Santo André. Aproxime o mapa e clique de novo.');
    let antes = null, nome = '';
    if (p.tipo === 'obra') {
      const {aba, linhas} = this.obrasCtl.ler(), alvo = linhas.find(o => String(o.r[0]).trim() === p.id);
      if (!alvo) throw new Error('Obra não encontrada.');
      const o = this.obrasCtl.publico(alvo); antes = {latitude: o.latitude, longitude: o.longitude}; nome = o.exibir;
      aba.getRange(alvo.linha, 10, 1, 2).setValues([[lat, lng]]);
    } else {
      const a = this.obrasCtl.aba('Bairros'), b = this.obrasCtl.bairros().find(x => x.id === p.id), c = MapaCPT.colunasBairro;
      if (!b || b.especial) throw new Error('Bairro não encontrado.');
      this.garantirColunasBairro(a);
      const x = a.getRange(b.linha, c.lat, 1, 2).getValues()[0]; antes = {latitude: x[0], longitude: x[1]}; nome = b.nome;
      a.getRange(b.linha, c.lat, 1, 2).setValues([[lat, lng]]);
    }
    this.obrasCtl.historico(antes, {id: p.id, latitude: lat, longitude: lng}, 'Ponto no mapa');
    MapaCPT.invalidar();
    return {resultado: 'Ponto de ' + nome + ' salvo.', lat, lng};
  }
  garantirColunasBairro(a) {
    const c = MapaCPT.colunasBairro;
    if (a.getMaxColumns() < c.lat + 1) a.insertColumnsAfter(a.getMaxColumns(), c.lat + 1 - a.getMaxColumns());
    const h = a.getRange(1, c.lat, 1, 2).getValues()[0];
    if (h.some((v, i) => v !== '' && v !== c.cabecalho[i])) throw new Error('As colunas M:N da aba Bairros têm outro conteúdo. Nada foi gravado.');
    if (h.some(v => v === '')) a.getRange(1, c.lat, 1, 2).setValues([c.cabecalho]).setFontWeight('bold');
  }
  static invalidar() { const p = PropertiesService.getScriptProperties(); p.setProperty('CPT_MAPA_VERSAO', String(Number(p.getProperty('CPT_MAPA_VERSAO') || 0) + 1)); }

  /**
   * Sugere o ponto dos bairros ainda sem ponto pela pesquisa de endereços do Google ("<bairro>, Santo André - SP").
   * Só grava resultado dentro do município; o resto fica para o clique. Até 40 por vez (limite de tempo do Google).
   */
  /** Pesquisa sem trava (pode levar dezenas de segundos); a gravação, curta, fica com a trava em sugerirBairrosNoMapaCPT. */
  pesquisarBairros() {
    this.exigirPosicionar();
    const faltam = this.bairros().filter(b => b.lat == null).slice(0, 40), achados = [], fora = [];
    const geo = faltam.length ? Maps.newGeocoder().setRegion('br').setLanguage('pt-BR') : null;
    faltam.forEach(b => {
      try {
        const r = geo.geocode(b.nome + ', Santo André - SP, Brasil'), res = (r && r.results || []).find(x => MapaCPT.dentro(x.geometry.location.lat, x.geometry.location.lng));
        if (!res) { fora.push(b.nome); return; }
        achados.push({id: b.id, nome: b.nome, lat: Math.round(res.geometry.location.lat * 1e6) / 1e6, lng: Math.round(res.geometry.location.lng * 1e6) / 1e6});
      } catch (e) { fora.push(b.nome); }
    });
    return {faltavam: faltam.length, achados, fora};
  }
  /** Grava o que a pesquisa achou, só em bairro que continua sem ponto (alguém pode ter clicado nesse meio tempo). */
  sugerirBairros(pesquisa) {
    this.exigirPosicionar();
    const r0 = pesquisa || this.pesquisarBairros(), fora = r0.fora;
    if (!r0.faltavam) return {resultado: 'Todos os bairros já têm ponto.', gravados: 0, fora: []};
    const a = this.obrasCtl.aba('Bairros'), c = MapaCPT.colunasBairro, gravados = [];
    this.garantirColunasBairro(a);
    const atuais = new Map(this.bairros().map(b => [b.id, b]));
    r0.achados.forEach(x => { const b = atuais.get(x.id); if (!b || b.lat != null) return; a.getRange(b.linha, c.lat, 1, 2).setValues([[x.lat, x.lng]]); gravados.push(b.nome); });
    if (gravados.length) { this.obrasCtl.historico(null, {id: 'BAIRROS', sugeridos: gravados}, 'Pontos sugeridos pela pesquisa do Google'); MapaCPT.invalidar(); }
    return {resultado: gravados.length + (gravados.length === 1 ? ' bairro posicionado' : ' bairros posicionados') + ' pela pesquisa do Google. Confira no mapa e ajuste com um clique se precisar.' + (fora.length ? ' Sem resultado em Santo André: ' + fora.join(', ') + '.' : ''), gravados: gravados.length, fora};
  }
}

function carregarMapaCPT(p) { return AplicacaoCPT.executar((d, ctx) => new MapaCPT(ctx).carregar(p), 'mapa.carregar'); }
function posicionarNoMapaCPT(p) {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(15000)) throw new Error('Há outro salvamento em andamento. Tente de novo em alguns segundos.');
  try { return AplicacaoCPT.executar((d, ctx) => new MapaCPT(ctx).posicionar(p), 'mapa.posicionar'); } finally { lock.releaseLock(); }
}
function sugerirBairrosNoMapaCPT() {
  // A pesquisa no Google demora: roda sem a trava, para não segurar os salvamentos da equipe. Só a gravação usa a trava.
  return AplicacaoCPT.executar((d, ctx) => {
    const m = new MapaCPT(ctx), pesquisa = m.pesquisarBairros();
    const lock = LockService.getScriptLock(); if (!lock.tryLock(15000)) throw new Error('Há outro salvamento em andamento. Tente de novo em alguns segundos.');
    try { return m.sugerirBairros(pesquisa); } finally { lock.releaseLock(); }
  }, 'mapa.sugerir');
}
