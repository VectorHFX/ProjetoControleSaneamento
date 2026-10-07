/**
 * AplicacaoCPT 2.0.0. Projeto próprio da interface.
 * Implantação: executar como o PROPRIETÁRIO, acesso "Qualquer pessoa em veolia.com".
 * A equipe não precisa de compartilhamento nas planilhas: a autorização é feita aqui, pelo cadastro.
 */
const VERSAO_CPT = '2.36.0';

/**
 * Cada planilha é aberta uma vez por execução e reaproveitada (o equivalente a um "pool" de conexões no Apps Script).
 * openById custa de 0,1 a 0,5 s a cada chamada; uma mesma consulta chegava a abrir a planilha de dados 3 ou 4 vezes.
 * O Google já descarta tudo ao fim de cada execução; executar() limpa no começo por segurança.
 */
const PLANILHAS_CPT_ = new Map();
function planilhaCPT_(id) {
  if (!PLANILHAS_CPT_.has(id)) PLANILHAS_CPT_.set(id, SpreadsheetApp.openById(id));
  return PLANILHAS_CPT_.get(id);
}

class AplicacaoCPT {
  static get baseId() { return '1vmFipKi9UKvnhuD4Jpfu10rJiBrmI-FnmqMs-yr4jA0'; }
  static get chave() { return 'CPT_APLICACAO_1'; }
  static get dominioPadrao() { return 'veolia.com'; }

  /** E-mail de quem abriu o link. Com execução como proprietário, só vem preenchido para contas do mesmo domínio. */
  static conta() {
    const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
    if (!email) throw new Error('Não foi possível identificar sua conta. Abra o link com sua conta @' + this.dominioPadrao + ' (no celular, confira qual conta está ativa no navegador).');
    return email;
  }
  static config() {
    const c = JSON.parse(PropertiesService.getScriptProperties().getProperty(this.chave) || '{}');
    if (!c.baseId || !c.administrador) throw new Error('A aplicação ainda precisa ser configurada no editor do Apps Script (instalarAplicacaoCPT).');
    return c;
  }
  /** Identidade e perfil, sem abrir nenhuma planilha. É a primeira coisa que a tela pede. */
  static identidade() {
    const email = this.conta(), c = this.config();
    if (c.dominio && !email.endsWith('@' + c.dominio)) throw new Error('Esta aplicação é exclusiva para contas @' + c.dominio + '. Você entrou como ' + email + '.');
    if (typeof ObrasDoDiaCPT !== 'undefined') ObrasDoDiaCPT.iniciar(c); // vínculos de "outra obra" são relidos uma vez nesta execução
    // emTeste: a tela esconde as páginas novas (marcadas emTeste nas ROTAS) de quem não é o proprietário até liberar.
    const perfil = PerfisCPT.obter(email, c); perfil.emTeste = PerfisCPT.travada();
    return {email: email, config: c, perfil};
  }
  static contexto() {
    const ctx = this.identidade();
    try { ctx.base = planilhaCPT_(ctx.config.baseId); }
    catch (_) { throw new Error('A base de dados não está disponível no momento. Avise a administração técnica.'); }
    return ctx;
  }
  static executar(acao, operacao = 'dados.consultar') {
    PLANILHAS_CPT_.clear();
    return DesempenhoCPT.medir(operacao, () => {
      const ctx = this.contexto();
      return acao(new DadosDaAplicacao(ctx.base, ctx.perfil), ctx);
    });
  }
}

/**
 * Execute no editor (Executar > instalarAplicacaoCPT) com a conta proprietária.
 * Pode ser repetido: não apaga cadastros, agenda nem dados. Não cria gatilhos.
 */
function instalarAplicacaoCPT() {
  const email = AplicacaoCPT.conta(), props = PropertiesService.getScriptProperties();
  const existente = JSON.parse(props.getProperty(AplicacaoCPT.chave) || '{}');
  const base = SpreadsheetApp.openById(AplicacaoCPT.baseId), dados = new DadosDaAplicacao(base);
  dados.registros(); dados.atendimentos();
  const config = {...existente, baseId: AplicacaoCPT.baseId, administrador: email,
    dominio: existente.dominio || AplicacaoCPT.dominioPadrao, versao: VERSAO_CPT};
  if (existente.administrador && existente.administrador !== email) config.administradorAnterior = existente.administrador;
  props.setProperty(AplicacaoCPT.chave, JSON.stringify(config));
  const r = {resultado: 'APLICAÇÃO CONFIGURADA', versao: VERSAO_CPT, administrador: email, dominio: config.dominio,
    proximoPasso: 'Execute prepararDadosDaAplicacaoCPT. Depois: Implantar > Gerenciar implantações > editar > Nova versão. Executar como: Eu. Quem pode acessar: qualquer pessoa em ' + config.dominio + '.'};
  console.log(JSON.stringify(r, null, 2)); return r;
}

/**
 * A página já sai com o perfil (sem chamada extra) e, se houver no cache, com a última Visão do mês e a agenda.
 * A tela mostra isso na hora e atualiza em segundo plano. Nenhuma planilha é aberta aqui.
 */
function doGet() {
  // Classes não ficam em globalThis: a referência direta lança ReferenceError se um arquivo faltar.
  try { void [DadosDaAplicacao, PerfisCPT, DesempenhoCPT, ObservacoesCPT, ObrasCPT, CacheCPT, CicloAtendimentoCPT, FichaOficialCPT, SocioambientalCPT, ObrasDoDiaCPT, MapaCPT, MissoesCPT, RelatosCPT, ConectoresCPT, PaineisGestaoCPT, AuditoriaAtendimentosCPT, ColecaoCPT, RecadosCPT, ContatosCPT, LembretesCPT, MateriaisCPT, GaleriaCPT, PessoalCPT, ConteudoSaneamentoCPT, RevisaoConteudoCPT, QuizCPT, JogosCPT, PlacarCPT, OrganogramaCPT, ControleContratoCPT, LevantamentoCPT, AlertasGestaoCPT]; }
  catch (_) { throw new Error('Instalação incompleta: confira todos os arquivos da versão ' + VERSAO_CPT + ' antes de publicar.'); }
  const t = HtmlService.createTemplateFromFile('Aplicacao');
  t.inicial = dadosIniciaisCPT_();
  return t.evaluate().setTitle('CPT | Campo e gestão').addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}
function dadosIniciaisCPT_() {
  const inicial = {versao: VERSAO_CPT};
  try {
    const ctx = AplicacaoCPT.identidade(), mes = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM');
    inicial.conta = ctx.email; inicial.perfil = ctx.perfil; inicial.mes = mes;
    inicial.inicio = CacheCPT.ler('inicio:ultimo2:' + mes);
    inicial.agenda = CacheCPT.ler('agenda:mes:' + mes);
  } catch (e) { inicial.erro = e.message; }
  // Serializado com < escapado: o JSON vai dentro de uma tag <script>.
  return JSON.stringify(inicial).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
function incluirCPT_(nome) {
  if (!['Estilos', 'Interacoes', 'Agenda', 'Obras', 'Inicio', 'Atendimentos', 'Gestao', 'Comunicacao', 'Recados', 'MeuEspaco', 'Mapa', 'Mascotes', 'Saber', 'Jogos', 'Placar', 'Visual', 'Organograma', 'Levantamento', 'Relatos', 'Graficos'].includes(nome)) throw new Error('Componente desconhecido.');
  return HtmlService.createHtmlOutputFromFile(nome).getContent();
}

/** Primeira chamada da tela: só identidade e papéis. Não depende de nenhuma planilha. */
function carregarPerfilCPT() {
  return DesempenhoCPT.medir('perfil.carregar', () => {
    const ctx = AplicacaoCPT.identidade();
    return {conta: ctx.email, perfil: ctx.perfil, versao: VERSAO_CPT};
  });
}
/** Aceita 'AAAA-MM' ou {mes, atualizar}. atualizar=true ignora o cache (botão Atualizar). */
function carregarInicioCPT(p) {
  const pedido = typeof p === 'object' && p ? p : {mes: p};
  return AplicacaoCPT.executar((d, ctx) => {
    const competencia = d.mes(pedido.mes || Utilities.formatDate(new Date(), d.fuso, 'yyyy-MM'));
    return {...d.inicio(competencia, pedido.atualizar === true), conta: ctx.email, perfil: ctx.perfil, versao: VERSAO_CPT};
  }, 'inicio.carregar');
}
function buscarRegistrosCPT(filtros) { return AplicacaoCPT.executar(d => d.buscar(filtros), 'registros.buscar'); }
function abrirRegistroCPT(id) { return AplicacaoCPT.executar(d => d.detalhe(id), 'registros.detalhe'); }
// Consulta de atendimentos é comum a toda a equipe. Alterações oficiais continuam no controle de atendimento.
function buscarAtendimentosCPT(filtros) { return AplicacaoCPT.executar(d => d.carteira(filtros), 'atendimentos.buscar'); }
function consultarHistoricoFichaCPT(p) { return AplicacaoCPT.executar(d => d.historicoFicha(p), 'atendimentos.historico'); }

/** Execute no editor se precisar conferir a conexão; não modifica a base. */
function diagnosticarConexaoCPT() {
  const inicio = Date.now(); let etapa = 'configuração';
  try {
    const config = AplicacaoCPT.config(); etapa = 'base de dados';
    const ctx = AplicacaoCPT.contexto(); etapa = 'estrutura de Registros e Atendimentos';
    const dados = new DadosDaAplicacao(ctx.base, ctx.perfil), registros = dados.registros(), atendimentos = dados.atendimentos();
    const r = {resultado: 'CONEXÃO CONFERIDA', versao: VERSAO_CPT, dominio: config.dominio || '(sem restrição)',
      registros: Math.max(0, registros.getLastRow() - 1), atendimentos: Math.max(0, atendimentos.getLastRow() - 1),
      dadosDaAplicacao: !!config.agendaId, tempoMs: Date.now() - inicio};
    console.log(JSON.stringify(r, null, 2)); return r;
  } catch (e) {
    const r = {resultado: 'CONEXÃO NÃO CONCLUÍDA', etapa, mensagem: e.message, tempoMs: Date.now() - inicio};
    console.log(JSON.stringify(r, null, 2)); return r;
  }
}

/** Chamado pela tela de erro. Mostra em qual etapa o acesso parou, com a conta de quem está usando. */
function conferirMeuAcessoCPT() {
  const etapas = []; let email = '', c, p;
  try { email = AplicacaoCPT.conta(); etapas.push({nome: 'Conta Google', ok: true, mensagem: email}); }
  catch (e) { return {etapas: [{nome: 'Conta Google', ok: false, mensagem: e.message}]}; }
  try { c = AplicacaoCPT.config(); } catch (e) { etapas.push({nome: 'Configuração', ok: false, mensagem: e.message}); return {etapas}; }
  if (c.dominio && !email.endsWith('@' + c.dominio)) { etapas.push({nome: 'Domínio', ok: false, mensagem: 'Use sua conta @' + c.dominio + '.'}); return {etapas}; }
  try { p = PerfisCPT.obter(email, c); etapas.push({nome: 'Cadastro na aplicação', ok: true, mensagem: p.nome + ' · ' + p.papeis.map(x => PerfisCPT.nomes[x] || x).join(', ')}); }
  catch (e) { etapas.push({nome: 'Cadastro na aplicação', ok: false, mensagem: e.message}); return {etapas}; }
  for (const item of [{nome: 'Base de dados', id: c.baseId}, {nome: 'Dados da aplicação (agenda e observações)', id: c.agendaId}]) {
    try { if (!item.id) throw new Error('não configurada'); SpreadsheetApp.openById(item.id).getName(); etapas.push({nome: item.nome, ok: true, mensagem: 'Disponível.'}); }
    catch (e) { etapas.push({nome: item.nome, ok: false, mensagem: 'Indisponível (' + e.message + '). Avise a administração técnica.'}); }
  }
  return {etapas};
}
