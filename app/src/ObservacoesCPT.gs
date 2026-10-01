/**
 * ObservacoesCPT 2.0.0. Observações da equipe sobre atendimentos.
 * Cada observação é um evento novo: nunca altera a ficha nem o histórico original.
 * Fica na planilha "CPT • Dados da aplicação" (config.agendaId), aba Observações.
 */
class ObservacoesCPT {
  static get cabecalho() { return ['ID', 'Protocolo principal', 'Protocolo consultado', 'Operação ID', 'Registrado em', 'Autor', 'Nome do autor', 'Canal', 'Observação']; }
  static get canais() { return ['Escritório', 'Campo / itinerante', 'Telefone ou WhatsApp', 'E-mail', 'Reunião', 'Outro']; }
  static planilha(config) {
    if (!config.agendaId) throw new Error('Os dados da aplicação ainda não foram preparados. Avise a administração técnica.');
    return SpreadsheetApp.openById(config.agendaId);
  }
  static tabela(ss, criar) {
    let a = ss.getSheetByName('Observações');
    if (!a && criar) { a = ss.insertSheet('Observações'); a.getRange(1, 1, 1, this.cabecalho.length).setValues([this.cabecalho]); a.setFrozenRows(1); }
    if (a && a.getLastRow() > 0 && a.getRange(1, 1, 1, this.cabecalho.length).getValues()[0].some((v, i) => v !== this.cabecalho[i]))
      throw new Error('Cabeçalho de Observações incompatível. Nenhum dado foi substituído.');
    return a;
  }
  constructor(ctx) { this.ctx = ctx; }
  linhas(a) { return a && a.getLastRow() > 1 ? a.getRange(2, 1, a.getLastRow() - 1, this.constructor.cabecalho.length).getValues() : []; }
  publico(r) {
    return {id: String(r[0]), protocolo: String(r[1]), consultado: String(r[2]),
      em: r[4] instanceof Date ? r[4].toISOString() : String(r[4]), autor: String(r[5]), nome: String(r[6]), canal: String(r[7]), texto: String(r[8])};
  }
  listar(p) {
    const principal = new DadosDaAplicacao(this.ctx.base, this.ctx.perfil).ficha(String(p && p.protocolo || '')).ficha.protocolo;
    const a = ObservacoesCPT.tabela(ObservacoesCPT.planilha(this.ctx.config), false);
    return {protocolo: principal, canais: ObservacoesCPT.canais,
      itens: this.linhas(a).filter(r => String(r[1]) === principal).map(r => this.publico(r)).reverse()};
  }
  adicionar(p) {
    if (!p || typeof p.operacaoId !== 'string' || !/^OP-[a-zA-Z0-9-]{12,70}$/.test(p.operacaoId)) throw new Error('Identificação de salvamento inválida. Feche e abra a ficha novamente.');
    const texto = CronogramaCPT.texto(p.texto, 2000, true);
    if (!ObservacoesCPT.canais.includes(p.canal)) throw new Error('Informe por onde a informação chegou.');
    const consultado = String(p.protocolo || '');
    const principal = new DadosDaAplicacao(this.ctx.base, this.ctx.perfil).ficha(consultado).ficha.protocolo;
    const a = ObservacoesCPT.tabela(ObservacoesCPT.planilha(this.ctx.config), true), rows = this.linhas(a);
    const repetida = rows.find(r => String(r[3]) === p.operacaoId);
    if (repetida) {
      if (String(repetida[5]) !== this.ctx.email || String(repetida[8]) !== texto) throw new Error('Esta observação já foi registrada. Feche e abra a ficha para conferir.');
      return {resultado: 'Observação já registrada.', observacao: this.publico(repetida)};
    }
    const linha = ['OBS-' + Utilities.getUuid(), principal, consultado, p.operacaoId, new Date(), this.ctx.email, this.ctx.perfil.nome, p.canal, texto];
    a.getRange(a.getLastRow() + 1, 1, 1, linha.length).setValues([linha]);
    return {resultado: 'Observação registrada no caso ' + principal + '.', observacao: this.publico(linha)};
  }
  /** Histórico de alterações de acesso (antes ficava nas propriedades do script). */
  static registrarAcesso(config, anterior, novo) {
    const ss = this.planilha(config), cab = ['Alterado em', 'Alterado por', 'Pessoa', 'Antes', 'Depois'];
    let a = ss.getSheetByName('Histórico de acessos');
    if (!a) { a = ss.insertSheet('Histórico de acessos'); a.getRange(1, 1, 1, cab.length).setValues([cab]); a.setFrozenRows(1); }
    a.getRange(a.getLastRow() + 1, 1, 1, cab.length).setValues([[new Date(), novo.alteradoPor, novo.email, anterior ? JSON.stringify(anterior) : '', JSON.stringify(novo)]]);
  }
}

function listarObservacoesCPT(p) { return DesempenhoCPT.medir('observacoes.listar', () => new ObservacoesCPT(AplicacaoCPT.contexto()).listar(p)); }
function adicionarObservacaoCPT(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw new Error('Há outro salvamento em andamento. Seu texto continua na tela: tente novamente.');
  try { return DesempenhoCPT.medir('observacoes.adicionar', () => new ObservacoesCPT(AplicacaoCPT.contexto()).adicionar(p)); }
  finally { lock.releaseLock(); }
}
