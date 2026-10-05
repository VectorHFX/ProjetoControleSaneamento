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
    const chave = 'painel:' + this.ctx.base.getId() + ':' + mes + ':' + reg.getLastRow() + ':' + atd.getLastRow() + ':' + (p.getProperty('CPT_ATD_VERSAO') || 0) + ':' + (p.getProperty('CPT_ENTREGAS_VERSAO') || 0) + ':' + hoje;
    return CacheCPT.obter(chave, 600, () => {
      let obras = [], parceiros = null;
      try { const o = new ObrasCPT(this.ctx); obras = o.ler().linhas.map(x => o.publico(x)); } catch (_) {}
      try { const pp = new ProgramaParceirosCPT(this.ctx); parceiros = {atual: pp.atual(mes), anterior: pp.atual(ProgramaParceirosCPT.mesAnterior(mes))}; } catch (_) {}
      return this.calcular({mes, hoje, linhas: this.dados.ler(reg, 19), fichas: this.dados.ler(atd, 18), obras, entregas: this.dados.situacoesEntregas(), parceiros});
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
    if (hoje.startsWith(mes)) { const d = new Date(hoje + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); const de = d.toISOString().slice(0, 10); d.setUTCDate(d.getUTCDate() + 6); const ate = d.toISOString().slice(0, 10); semana = {de, ate, total: pesquisas.filter(x => x >= de && x <= ate).length, meta: RelatorioMensalCPT.metaSemanal}; }
    const abertos = fichas.filter(c => !c.concluido), concluidosMes = fichas.filter(c => c.concluido && c.conclusao.startsWith(mes));
    const prazos = concluidosMes.filter(c => c.abertura && c.conclusao >= c.abertura).map(c => (Date.parse(c.conclusao + 'T12:00:00Z') - Date.parse(c.abertura + 'T12:00:00Z')) / 864e5);
    const frentesMes = new Set(acoes.map(x => S.frente(x.r[9])).filter(Boolean)), bairros = new Set(acoes.map(x => String(x.r[7])).filter(Boolean));
    const contrato = {
      acoes: acoes.length, pessoas: acoes.reduce((n, x) => n + (publico(x) || 0), 0), semPublico: acoes.filter(x => publico(x) === null).length,
      diagnosticos: doMes.filter(x => x.destino === '2').length, frentes: frentesMes.size, bairros: bairros.size,
      pesquisas: {mes: pesquisas.length, meta: RelatorioMensalCPT.metaMensal, semana}, relatos: {total: relatos.length, prontos},
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
    const porPessoa = contar(doMes, x => String(x.r[11]).trim()).slice(0, 12);
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
      if (!c.concluido) { f.casosAbertos++; f.casos.push({protocolo: c.protocolo, assunto: c.assunto, dias: c.dias, status: c.status}); }
      if (c.abertura.startsWith(mes)) f.casosMes++;
    });
    const lista = [...frentes.values()].map(f => ({...f, diasSemRegistro: f.ultimo ? Math.round((Date.parse(hoje + 'T12:00:00Z') - Date.parse(f.ultimo + 'T12:00:00Z')) / 864e5) : null,
      atividades: f.atividades.sort((a, b) => b.data.localeCompare(a.data)).slice(0, 15), casos: f.casos.sort((a, b) => (b.dias || 0) - (a.dias || 0)).slice(0, 20)}))
      .sort((a, b) => (a.situacao === 'Em andamento' ? 0 : 1) - (b.situacao === 'Em andamento' ? 0 : 1) || b.acoes - a.acoes || a.nome.localeCompare(b.nome, 'pt-BR'));

    // Alertas em português simples, do mais urgente ao informativo.
    const alertas = [];
    if (contrato.casos.acima30) alertas.push({nivel: 'alto', texto: contrato.casos.acima30 + ' atendimento(s) em aberto há mais de 30 dias.', rota: 'atendimentos'});
    if (semana && semana.total < semana.meta) alertas.push({nivel: 'medio', texto: 'Pesquisas de satisfação nesta semana: ' + semana.total + ' de ' + semana.meta + '.', rota: 'registros'});
    if (hoje.startsWith(mes)) { const dia = Number(hoje.slice(8, 10)), fim = new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0)).getUTCDate(), esperado = Math.round(RelatorioMensalCPT.metaMensal * dia / fim);
      if (pesquisas.length < esperado) alertas.push({nivel: 'medio', texto: 'Ritmo de pesquisas abaixo da meta: ' + pesquisas.length + ' até hoje (o esperado para a data é ' + esperado + ' de ' + RelatorioMensalCPT.metaMensal + ').', rota: 'registros'}); }
    const paradas = lista.filter(f => f.situacao === 'Em andamento' && (f.diasSemRegistro === null || f.diasSemRegistro > PaineisGestaoCPT.diasSemRegistro));
    if (paradas.length) alertas.push({nivel: 'medio', texto: paradas.length + ' frente(s) em andamento sem registro há mais de ' + PaineisGestaoCPT.diasSemRegistro + ' dias: ' + paradas.slice(0, 4).map(f => f.nome).join('; ') + (paradas.length > 4 ? '…' : '') + '.', aba: 'frentes'});
    if (contrato.semPublico) alertas.push({nivel: 'baixo', texto: contrato.semPublico + ' ação(ões) sem público informado (o total de pessoas alcançadas fica menor).', rota: 'registros'});
    if (relatos.length > prontos) alertas.push({nivel: 'baixo', texto: (relatos.length - prontos) + ' de ' + relatos.length + ' relatos ainda não estão prontos para o relatório.', rota: 'socioambiental'});
    if (e.parceiros && Number(hoje.slice(8, 10)) >= 5 && hoje.slice(0, 7) === PaineisGestaoCPT.meses(mes, 2)[1] && e.parceiros.anterior.situacao !== 'publicado')
      alertas.push({nivel: 'medio', texto: 'Programa Parceiros de ' + ProgramaParceirosCPT.mesAnterior(mes) + ' ainda não publicado.', rota: 'parceiros'});
    return {mes, hoje, contrato, serie, porItem, porPessoa, porTipo, frentes: lista, alertas, atualizadoEm: new Date().toISOString(),
      parceiros: e.parceiros ? {situacao: e.parceiros.atual.situacao, versao: e.parceiros.atual.versao, conferidos: Object.values(e.parceiros.atual.campos).filter(c => c.conferido).length} : null};
  }

  /** Relatos do mês em leitura rápida: quem, onde, quantas pessoas e o começo do relato. JSON lido só das linhas do mês. */
  relatos(mes) {
    this.dados.mes(mes);
    const a = this.dados.registros(), chave = 'relatos-resumo:' + this.ctx.base.getId() + ':' + mes + ':' + a.getLastRow() + ':' + (PropertiesService.getScriptProperties().getProperty('CPT_ENTREGAS_VERSAO') || 0);
    return CacheCPT.obter(chave, 600, () => {
      const base = this.dados.ler(a, 19), idx = []; base.forEach((r, i) => { if (r[0] && this.dados.mesCelula(r[3]) === mes && SocioambientalCPT.destino(r[1], r[13], r[17])) idx.push(i); });
      const json = new Map();
      // Faixas contínuas (as linhas do mês costumam estar juntas): poucas leituras da coluna de detalhes.
      for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++; const v = a.getRange(idx[i] + 2, 21, idx[j] - idx[i] + 1, 1).getValues(); v.forEach((x, k) => json.set(idx[i] + k, x[0])); i = j + 1; }
      const entregas = this.dados.situacoesEntregas(), R = RelatorioMensalCPT;
      const itens = idx.map(i => {
        const r = base[i], campos = R.campos(json.get(i)), texto = R.valor(campos, /^relato|relato da atividade|relato do diagnostico|descreva|como foi/) || '';
        return {id: String(r[0]), data: this.dados.data(r[2]), atividade: String(r[13] || r[1]), procedimento: String(r[1]), bairro: String(r[7]), frente: SocioambientalCPT.frente(r[9]), responsavel: String(r[11]),
          publico: r[14] !== '' && /^\d+$/.test(String(r[14])) ? Number(r[14]) : null, item: SocioambientalCPT.destino(r[1], r[13], r[17]),
          resumo: texto.length > 360 ? texto.slice(0, 357).replace(/\s+\S*$/, '') + '…' : texto, objetivo: R.valor(campos, /^objetivo/).slice(0, 200),
          fotos: (String(json.get(i) || '').match(/(?:\/d\/|[?&]id=)[A-Za-z0-9_-]{25,}/g) || []).length, situacao: (entregas.get(String(r[0])) || {}).situacao || ''};
      }).sort((x, y) => y.data.localeCompare(x.data));
      return {mes, itens};
    });
  }
}

function carregarPainelGestaoCPT(p) { return AplicacaoCPT.executar((d, ctx) => new PaineisGestaoCPT(ctx).carregar(String(p && p.mes || ''), !!(p && p.atualizar)), 'painel.carregar'); }
function carregarRelatosResumoCPT(mes) { return AplicacaoCPT.executar((d, ctx) => new PaineisGestaoCPT(ctx).relatos(String(mes || '')), 'painel.relatos'); }
