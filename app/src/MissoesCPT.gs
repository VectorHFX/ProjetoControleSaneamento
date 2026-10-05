/**
 * MissoesCPT 2.16.0. Missões do checklist: tarefas automáticas que levam direto ao lugar certo e somem quando o trabalho é feito.
 * - Gerência: confirmar as obras de hoje; vincular registros de "outra obra" (ObrasDoDiaCPT).
 * - Quem escreveu um relato: dicas do que falta nos relatos dos últimos 7 dias; comentário da gestão sobre um relato.
 * - Atendimento: casos abertos há 30 dias ou mais.
 * - Socioambiental: relatos do mês ainda não preparados, a 5 dias do prazo do relatório (ou depois).
 * Nada é ranqueado nem comparado entre pessoas: cada um vê só as próprias missões.
 * Período de testes: só o proprietário recebe missões (as demais pessoas não veem nada novo até liberar).
 * Desempenho: pedido à parte (depois da tela) e cada fonte em cache; quem não tem missão não abre a base.
 */
class MissoesCPT {
  static get diasCaso() { return 30; }
  static get diasAntesDoPrazo() { return 5; }
  static get diasDica() { return 7; }
  constructor(ctx) { this.ctx = ctx; }
  get perfil() { return this.ctx.perfil; }
  tem(...papeis) { return this.perfil.papeis.some(p => p === 'administrador' || papeis.includes(p)); }
  get dados() { if (!this._dados) { if (!this.ctx.base) this.ctx.base = planilhaCPT_(this.ctx.config.baseId); this._dados = new DadosDaAplicacao(this.ctx.base, this.perfil); } return this._dados; }
  hoje() { return ObrasDoDiaCPT.agora().dia; }

  listar() {
    if (PerfisCPT.travada() && !this.perfil.papeis.includes('administrador')) return [];
    const out = [], fonte = (nome, fn) => { try { fn().forEach(m => out.push(m)); } catch (e) { console.warn('Missões (' + nome + '): ' + e.message); } };
    fonte('obras', () => new ObrasDoDiaCPT(this.ctx).missoes());
    fonte('devolutivas', () => this.devolutivas());
    fonte('relatos', () => this.dicasDeRelato());
    if (this.tem('atendimento', 'administrativo', 'gestao')) fonte('casos', () => this.casosAntigos());
    if (this.tem('socioambiental')) fonte('preparo', () => this.relatosSemPreparo());
    return out;
  }
  /** Comentários da gestão sobre relatos da pessoa, ainda não vistos. */
  devolutivas() {
    return new RelatosCPT(this.ctx).visiveis().filter(d => d.autor === this.ctx.email && d.situacao === 'aberta')
      .map(d => ({id: 'devolutiva:' + d.registroId, titulo: 'A gestão comentou seu relato de ' + d.data.split('-').reverse().join('/'), texto: d.atividade, tipo: 'devolutiva', devolutiva: d}));
  }
  /** Relatos da própria pessoa nos últimos 7 dias com algo faltando (o mais recente primeiro; até 2). */
  dicasDeRelato() {
    const eu = PerfisCPT.lista(this.ctx.config).find(p => p.email === this.ctx.email); if (!eu) return [];
    const hoje = this.hoje(), limite = new Date(Date.parse(hoje + 'T12:00:00Z') - MissoesCPT.diasDica * 864e5).toISOString().slice(0, 10);
    const meses = [...new Set([hoje.slice(0, 7), limite.slice(0, 7)])], pg = {relatos: m => PaineisGestaoCPT.relatosDoMes(this.dados, this.ctx, m)}, meu = DadosDaAplicacao.norm(eu.nome);
    const itens = meses.flatMap(m => pg.relatos(m).itens).filter(r => r.qualidade && r.qualidade.faltam && r.data >= limite && DadosDaAplicacao.norm(r.responsavel) === meu);
    return itens.slice(0, 2).map(r => ({id: 'relato-dica:' + r.id, titulo: 'Seu relato de ' + r.data.split('-').reverse().join('/') + ' pode ficar mais completo',
      texto: 'Falta: ' + r.qualidade.itens.filter(i => !i.ok).map(i => i.nome.toLowerCase()).join(', ') + '.', tipo: 'dica', registroId: r.id, qualidade: r.qualidade}));
  }
  /** Casos principais em aberto há 30 dias ou mais (em cache pela última linha e pelo dia). */
  casosAntigos() {
    const a = this.dados.atendimentos(), p = PropertiesService.getScriptProperties(), hoje = this.hoje();
    const chave = 'missao-casos:' + this.ctx.config.baseId + ':' + a.getLastRow() + ':' + (p.getProperty('CPT_ATD_VERSAO') || 0) + ':' + hoje;
    const n = CacheCPT.obter(chave, 3600, () => ({n: this.dados.ler(a, 20).filter(r => r[0] && this.dados.principal(r) && !this.dados.encerrado(r) && (this.dados.dias(r) ?? 0) >= MissoesCPT.diasCaso).length})).n;
    return n ? [{id: 'casos-antigos', titulo: n + (n === 1 ? ' atendimento aberto' : ' atendimentos abertos') + ' há ' + MissoesCPT.diasCaso + ' dias ou mais', texto: 'Veja a próxima ação de cada um ou registre por que continua em aberto.', rota: 'atendimentos', tipo: 'rota'}] : [];
  }
  /** Relatos do mês sem preparo "Pronto", a partir de 5 dias antes do prazo do relatório do mês. */
  relatosSemPreparo() {
    const hoje = this.hoje(), mes = hoje.slice(0, 7);
    let prazo = EntregasDoMesCPT.prazoPadrao(mes);
    try { const x = new ColecaoCPT(this.ctx, 'Entregas do mês', 'ENT').obter('ENT-' + mes + '-relatorio'); if (x && x.prazo) prazo = x.prazo; } catch (_) {}
    const aviso = new Date(Date.parse(prazo + 'T12:00:00Z') - MissoesCPT.diasAntesDoPrazo * 864e5).toISOString().slice(0, 10);
    if (hoje < aviso) return [];
    const n = PaineisGestaoCPT.relatosDoMes(this.dados, this.ctx, mes).itens.filter(r => r.qualidade && r.situacao !== 'pronto').length;
    return n ? [{id: 'relatos-preparo', titulo: n + (n === 1 ? ' relato do mês ainda não preparado' : ' relatos do mês ainda não preparados'), texto: 'O prazo do relatório é ' + prazo.split('-').reverse().join('/') + '. Prepare na Mesa do relatório.', rota: 'socioambiental', tipo: 'rota'}] : [];
  }
}

/** Pedido à parte, depois que o Meu espaço aparece: não atrasa a tela. */
function missoesCPT() { return ColecaoCPT.executar('missoes', ctx => ({missoes: new MissoesCPT(ctx).listar()})); }
