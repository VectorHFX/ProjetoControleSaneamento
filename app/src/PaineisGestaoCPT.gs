/**
 * PaineisGestaoCPT 2.7.0. Painel da gestão: contrato inteiro, cada frente de serviço e os relatos em resumo.
 * Traz para a aplicação as visões do Painel de Gestão 3.2 (análise estratégica, relatos em resumo, territórios),
 * lendo a mesma base que o restante da aplicação. Só lê. Para Administrativo e Gestão.
 * Números com a mesma regra da Visão do mês e do relatório (SocioambientalCPT.destino): nada é contado duas vezes.
 */
class PaineisGestaoCPT {
  static get diasSemRegistro() { return 14; }
  constructor(ctx) {
    this.ctx = ctx;
    if (!PerfisCPT.gerencia(ctx.perfil)) throw new Error('O painel da gestão é do Administrativo e da Gestão.');
    this.dados = new DadosDaAplicacao(ctx.base, ctx.perfil);
  }
  static meses(mes, n) { const out = []; for (let i = n - 1; i >= 0; i--) { const d = new Date(mes + '-15T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() - i); out.push(d.toISOString().slice(0, 7)); } return out; }
  static chaveObra(nome) { return DadosDaAplicacao.norm(String(nome || '').replace(/\s*\[OBR-\d+\]\s*$/, '').split(' — ')[0]); }

  carregar(mes, atualizar) {
    this.dados.mes(mes);
    const reg = this.dados.registros(), atd = this.dados.atendimentos(), p = PropertiesService.getScriptProperties();
    const hoje = Utilities.formatDate(new Date(), this.dados.fuso, 'yyyy-MM-dd');
    // 2.36: confirmação das obras de ontem entra nos alertas (e na chave: confirmar tarde atualiza o painel).
    let ontem = null; try { ontem = new ObrasDoDiaCPT(this.ctx).confirmacao(ObrasDoDiaCPT.diaAnterior(hoje)); } catch (_) {}
    const chave = 'painel:' + this.ctx.base.getId() + ':' + mes + ':' + reg.getLastRow() + ':' + atd.getLastRow() + ':' + (p.getProperty('CPT_ATD_VERSAO') || 0) + ':' + (p.getProperty('CPT_ENTREGAS_VERSAO') || 0) + ':' + hoje + ':' + (ontem ? ontem.versao : 0);
    return CacheCPT.obter(chave, 600, () => {
      let obras = [];
      try { const o = new ObrasCPT(this.ctx); obras = o.ler().linhas.map(x => o.publico(x)); } catch (_) {}
      return this.calcular({mes, hoje, linhas: this.dados.ler(reg, 19), fichas: this.dados.ler(atd, 18), obras, entregas: this.dados.situacoesEntregas(), ontem});
    }, atualizar === true);
  }

  /** Separado da leitura para ser testável. */
  calcular(e) {
    const D = this.dados, N = DadosDaAplicacao.norm, S = SocioambientalCPT, mes = e.mes, hoje = e.hoje, meses = PaineisGestaoCPT.meses(mes, 6);
    const linhas = e.linhas.filter(r => r[0]).map(r => ({r, mes: D.mesCelula(r[3]), data: D.data(r[2]), destino: S.destino(r[1], r[13], r[17]), satisfacao: /satisfac/.test(N(r[1]))}));
    const fichas = e.fichas.filter(r => D.principal(r)).map(r => D.atendimento(r));
    const doMes = linhas.filter(x => x.mes === mes), acoes = doMes.filter(x => x.destino && x.destino !== '2');
    const publico = x => x.r[14] !== '' && /^\d+$/.test(String(x.r[14])) ? Number(x.r[14]) : null;

    // Contrato
    const relatos = doMes.filter(x => x.destino), prontos = relatos.filter(x => (e.entregas.get(String(x.r[0])) || {}).situacao === 'pronto').length;
    const pesquisas = doMes.filter(x => x.satisfacao && x.data.startsWith(mes)).map(x => x.data);
    let semana = null;
    if (hoje.startsWith(mes)) { const d = new Date(hoje + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); const de = d.toISOString().slice(0, 10); d.setUTCDate(d.getUTCDate() + 6); const ate = d.toISOString().slice(0, 10); semana = {de, ate, total: pesquisas.filter(x => x >= de && x <= ate).length, meta: DadosDaAplicacao.metaSemanal}; }
    const abertos = fichas.filter(c => !c.concluido), concluidosMes = fichas.filter(c => c.concluido && c.conclusao.startsWith(mes));
    const prazos = concluidosMes.filter(c => c.abertura && c.conclusao >= c.abertura).map(c => (Date.parse(c.conclusao + 'T12:00:00Z') - Date.parse(c.abertura + 'T12:00:00Z')) / 864e5);
    const frentesMes = new Set(acoes.map(x => S.frente(x.r[9])).filter(Boolean)), bairros = new Set(acoes.map(x => String(x.r[7])).filter(Boolean));
    const contrato = {
      acoes: acoes.length, pessoas: acoes.reduce((n, x) => n + (publico(x) || 0), 0), semPublico: acoes.filter(x => publico(x) === null).length,
      diagnosticos: doMes.filter(x => x.destino === '2').length, frentes: frentesMes.size, bairros: bairros.size,
      pesquisas: {mes: pesquisas.length, meta: DadosDaAplicacao.metaMensal, semana}, relatos: {total: relatos.length, prontos},
      casos: {abertos: abertos.length, recebidosMes: fichas.filter(c => c.abertura.startsWith(mes)).length, concluidosMes: concluidosMes.length,
        prazoMedio: prazos.length ? Math.round(prazos.reduce((a, b) => a + b, 0) / prazos.length) : null, acima30: abertos.filter(c => (c.dias || 0) > 30).length}
    };
    const serie = meses.map(m => {
      const l = linhas.filter(x => x.mes === m), a = l.filter(x => x.destino && x.destino !== '2');
      return {mes: m, acoes: a.length, pessoas: a.reduce((n, x) => n + (publico(x) || 0), 0), pesquisas: l.filter(x => x.satisfacao).length,
        recebidos: fichas.filter(c => c.abertura.startsWith(m)).length, concluidos: fichas.filter(c => c.concluido && c.conclusao.startsWith(m)).length};
    });
    const contar = (lista, f) => { const m = new Map(); lista.forEach(x => { const k = f(x) || 'Não informado'; m.set(k, (m.get(k) || 0) + 1); }); return [...m].map(([nome, quantidade]) => ({nome, quantidade})).sort((a, b) => b.quantidade - a.quantidade); };
    const porItem = S.itens.filter(i => i.tipo !== 'consolidado').map(i => ({item: i.item, titulo: i.titulo, quantidade: doMes.filter(x => x.destino === i.item).length}));
    // 2.35: sem contagem por pessoa (nada de ranking individual).
    const porTipo = contar(acoes, x => String(x.r[13]).trim()).slice(0, 8);

    // Frentes: catálogo (exceto finalizadas) + o que apareceu no mês fora do catálogo.
    const porId = new Map(e.obras.map(o => [o.id, o])), porNome = new Map(e.obras.flatMap(o => ObrasCPT.nomesConhecidos(o).map(n => [PaineisGestaoCPT.chaveObra(n), o])));
    const frentes = new Map(), frente = (id, nome) => {
      const o = (id && porId.get(id)) || porNome.get(PaineisGestaoCPT.chaveObra(nome)) || null, k = o ? o.id : 'X:' + PaineisGestaoCPT.chaveObra(nome);
      if (!frentes.has(k)) frentes.set(k, {id: o ? o.id : '', nome: o ? o.exibir : String(nome).replace(/\s*\[OBR-\d+\]\s*$/, ''), situacao: o ? o.situacao || 'A confirmar' : 'Fora do catálogo', bairros: o ? o.bairros : [],
        endereco: o ? o.endereco || o.logradouroPAC16 : '', impacto: o ? o.impacto : '', acoes: 0, pessoas: 0, diagnosticos: 0, ultimo: '', casosAbertos: 0, casosMes: 0, atividades: [], casos: []});
      return frentes.get(k);
    };
    e.obras.filter(o => o.situacao !== 'Finalizada').forEach(o => frente(o.id, o.exibir));
    linhas.forEach(x => {
      const nome = S.frente(x.r[9]); if (!nome || !x.destino) return;
      const id = String(x.r[10] || ''), ehCatalogo = (id && porId.has(id)) || porNome.has(PaineisGestaoCPT.chaveObra(nome));
      if (!ehCatalogo && x.mes !== mes) return;
      const f = frente(id, nome); if (x.data > f.ultimo && x.data <= hoje) f.ultimo = x.data;
      if (x.mes !== mes) return;
      if (x.destino === '2') f.diagnosticos++; else { f.acoes++; f.pessoas += publico(x) || 0; }
      f.atividades.push({id: String(x.r[0]), data: x.data, atividade: String(x.r[13] || x.r[1]), publico: publico(x), responsavel: String(x.r[11]), bairro: String(x.r[7]), diagnostico: x.destino === '2'});
    });
    fichas.forEach(c => {
      const k = PaineisGestaoCPT.chaveObra(c.obra); if (!k || /nao se aplica/.test(k)) return;
      const o = porNome.get(k); const f = o ? frentes.get(o.id) || frente(o.id, o.exibir) : (!c.concluido || c.abertura.startsWith(mes) ? frente('', c.obra) : null); if (!f) return;
      if (!c.concluido) { f.casosAbertos++; f.casos.push({caso: c.caso || '', protocolo: c.protocolo, assunto: c.assunto, dias: c.dias, status: c.status}); }
      if (c.abertura.startsWith(mes)) f.casosMes++;
    });
    const lista = [...frentes.values()].map(f => ({...f, diasSemRegistro: f.ultimo ? Math.round((Date.parse(hoje + 'T12:00:00Z') - Date.parse(f.ultimo + 'T12:00:00Z')) / 864e5) : null,
      atividades: f.atividades.sort((a, b) => b.data.localeCompare(a.data)).slice(0, 15), casos: f.casos.sort((a, b) => (b.dias || 0) - (a.dias || 0)).slice(0, 20)}))
      .sort((a, b) => (a.situacao === 'Em andamento' ? 0 : 1) - (b.situacao === 'Em andamento' ? 0 : 1) || b.acoes - a.acoes || a.nome.localeCompare(b.nome, 'pt-BR'));

    // Alertas em português simples, do mais urgente ao informativo. 2.36: as regras comuns ficam em AlertasGestaoCPT
    // (as mesmas das missões e do cartão da Visão do mês); aqui entram só as do painel (semana de pesquisas, frentes paradas).
    const alertas = AlertasGestaoCPT.calcular({mes, hoje, linhas: e.linhas, fichas, ontem: e.ontem || null, nomes: new Map(e.obras.map(o => [o.id, o.exibir])), D})
      .map(a => ({nivel: a.nivel, texto: a.titulo + '.', detalhe: a.texto, rota: a.rota === 'painel' ? '' : a.rota, aba: a.aba, pendente: a.pendente}));
    if (semana && semana.total < semana.meta) alertas.push({nivel: 'medio', texto: 'Pesquisas de satisfação nesta semana: ' + semana.total + ' de ' + semana.meta + '.', rota: 'inicio'});
    const paradas = lista.filter(f => f.situacao === 'Em andamento' && (f.diasSemRegistro === null || f.diasSemRegistro > PaineisGestaoCPT.diasSemRegistro));
    if (paradas.length) alertas.push({nivel: 'medio', texto: paradas.length + ' frente(s) em andamento sem registro há mais de ' + PaineisGestaoCPT.diasSemRegistro + ' dias: ' + paradas.slice(0, 4).map(f => f.nome).join('; ') + (paradas.length > 4 ? '…' : '') + '.', aba: 'frentes'});
    const ordem = {alto: 0, medio: 1, baixo: 2}; alertas.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
    return {mes, hoje, contrato, serie, porItem, porTipo, frentes: lista, alertas, atualizadoEm: new Date().toISOString()};
  }

  /**
   * 2.35: qualidade dos relatos de atividade (conferência automática, sem nomes de pessoas):
   * % completos nos 6 meses até o escolhido, os pontos que mais faltam e a completude por frente no mês escolhido.
   * Cada mês vira um resumo pequeno em cache (meses passados por 6 horas; o mês atual acompanha a base).
   */
  qualidade(mes) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(mes || ''))) throw new Error('Selecione um mês válido.');
    const a = this.dados.registros(), atual = Utilities.formatDate(new Date(), this.dados.fuso, 'yyyy-MM'), versao = PropertiesService.getScriptProperties().getProperty('CPT_ENTREGAS_VERSAO') || 0;
    const resumo = m => CacheCPT.obter('relatos-qualidade:' + this.ctx.base.getId() + ':' + m + ':' + (m >= atual ? a.getLastRow() : 'fechado') + ':' + versao, m >= atual ? 600 : 21600, () => {
      const rs = PaineisGestaoCPT.relatosDoMes(this.dados, this.ctx, m).itens.filter(r => RelatosCPT.ehRelato(r.procedimento) && r.qualidade), faltas = {}, frentes = {};
      rs.forEach(r => { r.qualidade.itens.forEach(i => { if (!i.ok) faltas[i.chave] = (faltas[i.chave] || 0) + 1; });
        const f = r.frente || 'Sem frente informada', x = frentes[f] || (frentes[f] = [0, 0]); x[0]++; if (!r.qualidade.faltam) x[1]++; });
      return {mes: m, total: rs.length, completos: rs.filter(r => !r.qualidade.faltam).length, faltas, frentes};
    });
    const meses = PaineisGestaoCPT.meses(mes, 6).map(resumo), este = meses[meses.length - 1];
    return {mes, meses: meses.map(x => ({mes: x.mes, total: x.total, completos: x.completos})), total: este.total, completos: este.completos,
      faltas: RelatosCPT.criterios.map(c => ({chave: c.chave, nome: c.nome, quantidade: este.faltas[c.chave] || 0})).sort((x, y) => y.quantidade - x.quantidade),
      frentes: Object.keys(este.frentes).map(nome => ({nome, total: este.frentes[nome][0], completos: este.frentes[nome][1]})).sort((x, y) => y.total - x.total || x.nome.localeCompare(y.nome, 'pt-BR'))};
  }

  /** Relatos do mês em leitura rápida: quem, onde, quantas pessoas e o começo do relato. JSON lido só das linhas do mês. */
  relatos(mes) { return PaineisGestaoCPT.relatosDoMes(this.dados, this.ctx, mes); }
  /** Relatos do mês (com a conferência de qualidade), em cache. Sem checagem de perfil: quem chama decide o que mostrar (ex.: MissoesCPT, só os da própria pessoa). */
  static relatosDoMes(dados, ctx, mes) {
    dados.mes(mes);
    const a = dados.registros(), chave = 'relatos-resumo:' + ctx.base.getId() + ':' + mes + ':' + a.getLastRow() + ':' + (PropertiesService.getScriptProperties().getProperty('CPT_ENTREGAS_VERSAO') || 0);
    return CacheCPT.obter(chave, 600, () => {
      const base = dados.ler(a, 19), idx = []; base.forEach((r, i) => { if (r[0] && dados.mesCelula(r[3]) === mes && SocioambientalCPT.destino(r[1], r[13], r[17])) idx.push(i); });
      const json = new Map();
      // Faixas contínuas (as linhas do mês costumam estar juntas): poucas leituras da coluna de detalhes.
      for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++; const v = a.getRange(idx[i] + 2, 21, idx[j] - idx[i] + 1, 1).getValues(); v.forEach((x, k) => json.set(idx[i] + k, x[0])); i = j + 1; }
      const entregas = dados.situacoesEntregas(), R = DadosDaAplicacao;
      const itens = idx.map(i => {
        // Relato grande: o Campo 4.0 guarda os detalhes num arquivo à parte. Sem lê-lo, a conferência acusaria falta de tudo.
        let campos = R.campos(json.get(i));
        if (!campos && /arquivoDetalhesId/.test(String(json.get(i) || ''))) try { campos = R.campos(JSON.stringify(DadosDaAplicacao.lerDetalhes(json.get(i)))); } catch (_) { campos = null; }
        const r = base[i], texto = R.valor(campos, /^relato|relato da atividade|relato do diagnostico|descreva|como foi/) || '';
        return {id: String(r[0]), data: dados.data(r[2]), atividade: String(r[13] || r[1]), procedimento: String(r[1]), bairro: String(r[7]), frente: SocioambientalCPT.frente(r[9]), responsavel: String(r[11]),
          publico: r[14] !== '' && /^\d+$/.test(String(r[14])) ? Number(r[14]) : null, item: SocioambientalCPT.destino(r[1], r[13], r[17]),
          resumo: texto.length > 360 ? texto.slice(0, 357).replace(/\s+\S*$/, '') + '…' : texto, objetivo: R.valor(campos, /^objetivo/).slice(0, 200), apoio: R.valor(campos, /^colaboradores de apoio/).slice(0, 400),
          fotos: (String(json.get(i) || '').match(/(?:\/d\/|[?&]id=)[A-Za-z0-9_-]{25,}/g) || []).length, situacao: (entregas.get(String(r[0])) || {}).situacao || '',
          qualidade: RelatosCPT.ehRelato(r[1]) && campos ? RelatosCPT.doRegistro(r, campos) : null};
      }).sort((x, y) => y.data.localeCompare(x.data));
      return {mes, itens};
    });
  }
}

function carregarPainelGestaoCPT(p) { return AplicacaoCPT.executar((d, ctx) => new PaineisGestaoCPT(ctx).carregar(String(p && p.mes || ''), !!(p && p.atualizar)), 'painel.carregar'); }
function qualidadeRelatosCPT(p) { return AplicacaoCPT.executar((d, ctx) => new PaineisGestaoCPT(ctx).qualidade(String(p && p.mes || '')), 'painel.qualidade'); }
function carregarRelatosResumoCPT(mes) { return AplicacaoCPT.executar((d, ctx) => new PaineisGestaoCPT(ctx).relatos(String(mes || '')), 'painel.relatos'); }
