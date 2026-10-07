/**
 * AlertasGestaoCPT 2.36.0. Alertas da Gestão e do Administrativo, sem nomes de pessoas (nada de ranking):
 * - dia útil sem nenhuma ação socioambiental (do dia 1 até ontem; fim de semana, feriado e ponto facultativo não contam);
 * - ações do mês sem público informado;
 * - atendimentos em aberto há mais de 30 dias;
 * - pesquisas de satisfação abaixo de 50% do ritmo esperado, a partir do dia 10;
 * - obras confirmadas ontem (Obras → Obras de hoje) sem nenhum registro de ação.
 * Usados pelo painel da gestão ("Pede atenção"), pelas missões do Meu espaço e pelo cartão da Visão do mês.
 * Feriados: a mesma regra do cronograma (Agenda.html); um teste confere as duas.
 */
class AlertasGestaoCPT {
  static get diasCaso() { return 30; }
  static get diaRitmo() { return 10; }
  static get fracaoRitmo() { return 0.5; }
  static get fixos() { return ['01-01', '04-08', '04-21', '05-01', '07-09', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25']; }
  static pascoa(ano) {
    const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return Date.UTC(ano, mes - 1, dia);
  }
  /** Dias sem expediente do ano (feriados nacionais, estadual de SP, municipais de Santo André e Carnaval). */
  static feriados(ano) {
    const memo = AlertasGestaoCPT.memo || (AlertasGestaoCPT.memo = {}); if (memo[ano]) return memo[ano];
    const p = AlertasGestaoCPT.pascoa(ano), iso = t => new Date(t).toISOString().slice(0, 10);
    return memo[ano] = new Set(AlertasGestaoCPT.fixos.map(md => ano + '-' + md).concat([-48, -47, -2, 60].map(n => iso(p + n * 864e5))));
  }
  static diaUtil(dia) { const w = new Date(dia + 'T12:00:00Z').getUTCDay(); return w > 0 && w < 6 && !AlertasGestaoCPT.feriados(Number(dia.slice(0, 4))).has(dia); }
  static ddmm(dia) { return dia.slice(8, 10) + '/' + dia.slice(5, 7); }
  static nomeMes(mes) { return ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][Number(mes.slice(5, 7)) - 1]; }

  /**
   * Separado da leitura para ser testável. e: {mes, hoje, linhas (Registros), fichas (atendimentos principais), ontem (confirmação de ontem ou null), nomes (id → nome da obra), D}.
   * Devolve [{id, nivel: 'alto'|'medio'|'baixo', titulo, texto, rota?, aba?, pendente?}] do mais urgente ao informativo.
   */
  static calcular(e) {
    const D = e.D, S = SocioambientalCPT, mes = e.mes, hoje = e.hoje, ontem = ObrasDoDiaCPT.diaAnterior(hoje), out = [];
    const linhas = e.linhas.filter(r => r[0]).map(r => ({r, mes: D.mesCelula(r[3]), data: D.data(r[2]), destino: S.destino(r[1], r[13], r[17])}));
    const acoes = linhas.filter(x => x.mes === mes && x.destino && x.destino !== '2');
    // Atendimentos (estado de agora).
    const velhos = e.fichas.filter(c => !c.concluido && (c.dias || 0) > AlertasGestaoCPT.diasCaso).length;
    if (velhos) out.push({id: 'casos-30', nivel: 'alto', titulo: velhos + (velhos === 1 ? ' atendimento em aberto' : ' atendimentos em aberto') + ' há mais de 30 dias', texto: 'Veja a próxima ação de cada um ou registre por que continua em aberto.', rota: 'atendimentos'});
    // Dias úteis sem ação: do dia 1 até ontem (ou até o fim do mês, se o mês já passou).
    const fim = new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0)).toISOString().slice(0, 10), ate = ontem < fim ? ontem : fim, comAcao = new Set(acoes.map(x => x.data));
    const vazios = []; for (let d = mes + '-01'; d <= ate; d = new Date(Date.parse(d + 'T12:00:00Z') + 864e5).toISOString().slice(0, 10)) if (AlertasGestaoCPT.diaUtil(d) && !comAcao.has(d)) vazios.push(d);
    if (vazios.length) out.push({id: 'dias-sem-acao', nivel: 'medio', titulo: vazios.length + (vazios.length === 1 ? ' dia útil sem ação' : ' dias úteis sem ação') + ' em ' + AlertasGestaoCPT.nomeMes(mes),
      texto: vazios.slice(-6).map(AlertasGestaoCPT.ddmm).join(', ') + (vazios.length > 6 ? ' e outros' : '') + '. Se houve ação, confira se o relato foi enviado com a data certa.', rota: 'inicio'});
    // Ritmo de pesquisas: só do dia 10 em diante e só no mês corrente.
    if (hoje.startsWith(mes) && Number(hoje.slice(8, 10)) >= AlertasGestaoCPT.diaRitmo) {
      const feitas = linhas.filter(x => x.mes === mes && /satisfac/.test(DadosDaAplicacao.norm(x.r[1])) && x.data.startsWith(mes)).length;
      const esperado = Math.round(DadosDaAplicacao.metaMensal * Number(hoje.slice(8, 10)) / Number(fim.slice(8, 10)));
      if (feitas < esperado * AlertasGestaoCPT.fracaoRitmo) out.push({id: 'ritmo-pesquisas', nivel: 'medio', titulo: 'Pesquisas de satisfação abaixo da metade do ritmo',
        texto: feitas + ' até hoje; para a data, o esperado seria ' + esperado + ' (meta de ' + DadosDaAplicacao.metaMensal + ' no mês).', rota: 'inicio'});
    }
    // Obras confirmadas ontem sem nenhum registro de ação nelas.
    if (e.ontem && !e.ontem.nenhuma && (e.ontem.obras || []).length && ontem.startsWith(mes)) {
      const comRegistro = new Set(linhas.filter(x => x.data === ontem && x.destino).map(x => String(x.r[10] || '')));
      const sem = e.ontem.obras.filter(id => !comRegistro.has(id)).map(id => (e.nomes && e.nomes.get(id)) || id).sort((a, b) => a.localeCompare(b, 'pt-BR'));
      if (sem.length) out.push({id: 'obras-ontem', nivel: 'medio', titulo: sem.length + (sem.length === 1 ? ' obra confirmada ontem sem relato' : ' obras confirmadas ontem sem relato'),
        texto: sem.slice(0, 4).join('; ') + (sem.length > 4 ? '…' : '') + '. Confira se a ação aconteceu e se o relato foi enviado.', rota: 'painel', aba: 'frentes'});
    }
    const semPublico = acoes.filter(x => x.r[14] === '' || !/^\d+$/.test(String(x.r[14]))).length;
    if (semPublico) out.push({id: 'sem-publico', nivel: 'baixo', titulo: semPublico + (semPublico === 1 ? ' ação sem público informado' : ' ações sem público informado'), texto: 'O total de pessoas alcançadas fica menor. Complete o público nos registros.', rota: 'registros', pendente: 'publico'});
    return out;
  }

  constructor(ctx) { this.ctx = ctx; }
  /** Alertas de hoje para o mês corrente (gerência), em cache por dia e pelas últimas linhas da base. */
  listar() {
    if (!PerfisCPT.gerencia(this.ctx.perfil)) return [];
    if (!this.ctx.base) this.ctx.base = planilhaCPT_(this.ctx.config.baseId);
    const D = new DadosDaAplicacao(this.ctx.base, this.ctx.perfil), reg = D.registros(), atd = D.atendimentos(), p = PropertiesService.getScriptProperties();
    const hoje = ObrasDoDiaCPT.agora().dia, odd = new ObrasDoDiaCPT(this.ctx), ontem = odd.confirmacao(ObrasDoDiaCPT.diaAnterior(hoje));
    const chave = 'alertas-gestao:' + this.ctx.base.getId() + ':' + hoje + ':' + reg.getLastRow() + ':' + atd.getLastRow() + ':' + (p.getProperty('CPT_ATD_VERSAO') || 0) + ':' + (ontem ? ontem.versao : 0);
    return CacheCPT.obter(chave, 1800, () => {
      let nomes = new Map(); try { nomes = new Map(odd.catalogo().map(o => [o.id, o.exibir])); } catch (_) {}
      return AlertasGestaoCPT.calcular({mes: hoje.slice(0, 7), hoje, linhas: D.ler(reg, 19), fichas: D.ler(atd, 18).filter(r => D.principal(r)).map(r => D.atendimento(r)), ontem, nomes, D});
    });
  }
}

/** Cartão "Pede atenção" da Visão do mês (Gestão e Administrativo); pedido à parte, depois da tela. */
function alertasGestaoCPT() { return AplicacaoCPT.executar((d, ctx) => ({alertas: new AlertasGestaoCPT(ctx).listar()}), 'alertas.gestao'); }
