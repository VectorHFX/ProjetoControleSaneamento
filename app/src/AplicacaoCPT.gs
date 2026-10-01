/** AplicacaoCPT 1.5.0. Projeto próprio da interface, sem gatilhos ou migrações. */
class AplicacaoCPT {
  static get baseId() { return '1vmFipKi9UKvnhuD4Jpfu10rJiBrmI-FnmqMs-yr4jA0'; }
  static get chave() { return 'CPT_APLICACAO_1'; }
  static conta() {
    const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
    const efetiva = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
    if (!email || email !== efetiva) throw new Error('Entre com sua conta Google e publique a aplicação para executar como “Usuário que acessa o aplicativo da Web”.');
    return email;
  }
  static config() {
    const c = JSON.parse(PropertiesService.getScriptProperties().getProperty(this.chave) || '{}');
    if (!c.baseId || !c.administrador) throw new Error('A aplicação ainda precisa ser instalada por Victor no editor do Apps Script.');
    return c;
  }
  static contexto() {
    const email = this.conta(), c = this.config();
    let base;
    try { base = SpreadsheetApp.openById(c.baseId); base.getName(); }
    catch (_) { throw new Error('Esta conta não tem acesso à base Campo 4.0. Peça ao administrador para conferir o compartilhamento da planilha.'); }
    return {email: email, base: base, config: c, perfil: PerfisCPT.obter(email,c)};
  }
  static executar(acao, operacao = 'dados.consultar') {
    return DesempenhoCPT.medir(operacao, () => {
      const ctx = this.contexto();
      return acao(new DadosDaAplicacao(ctx.base, ctx.perfil), ctx);
    });
  }
}

/** Execute no editor uma vez. Não cria planilha, aba, resposta ou gatilho. */
function instalarAplicacaoCPT() {
  const email = AplicacaoCPT.conta(), props = PropertiesService.getScriptProperties();
  const existente = JSON.parse(props.getProperty(AplicacaoCPT.chave) || '{}');
  if (existente.administrador && existente.administrador !== email) throw new Error('Somente quem instalou a aplicação pode alterar sua configuração.');
  const base = SpreadsheetApp.openById(AplicacaoCPT.baseId), dados = new DadosDaAplicacao(base);
  dados.registros(); dados.atendimentos();
  const config = {...existente, baseId: AplicacaoCPT.baseId, administrador: email, versao: '1.5.0'};
  props.setProperty(AplicacaoCPT.chave, JSON.stringify(config));
  const r = {resultado: 'APLICAÇÃO CONFIGURADA', versao: config.versao, novasAbas: 0, gatilhosCriados: 0,
    proximoPasso: 'Implantar > Nova implantação > Aplicativo da Web. Executar como: Usuário que acessa o aplicativo da Web.'};
  console.log(JSON.stringify(r, null, 2)); return r;
}

/** A página abre primeiro; dados chegam depois, por chamadas autenticadas. */
function doGet() {
  AplicacaoCPT.config();
  if(typeof DadosDaAplicacao==='undefined'||typeof PerfisCPT==='undefined'||typeof DesempenhoCPT==='undefined')throw new Error('Instalação incompleta: confira os dez arquivos do pacote CPT 1.5.0 antes de publicar.');
  return HtmlService.createTemplateFromFile('Aplicacao').evaluate().setTitle('CPT | Campo e gestão')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}
function incluirCPT_(nome) {
  if (!['Estilos', 'Interacoes', 'Agenda', 'Entregas'].includes(nome)) throw new Error('Componente desconhecido.');
  return HtmlService.createHtmlOutputFromFile(nome).getContent();
}
function carregarInicioCPT(mes) {
  return AplicacaoCPT.executar((d, ctx) => {
    const competencia = d.mes(mes || Utilities.formatDate(new Date(), d.fuso, 'yyyy-MM'));
    return {...d.inicio(competencia), conta: ctx.email, perfil: ctx.perfil, versao: '1.5.0'};
  }, 'inicio.carregar');
}
function buscarRegistrosCPT(filtros) { return AplicacaoCPT.executar(d => d.buscar(filtros), 'registros.buscar'); }
function abrirRegistroCPT(id) { return AplicacaoCPT.executar(d => d.detalhe(id), 'registros.detalhe'); }
function buscarAtendimentosCPT(filtros) { return AplicacaoCPT.executar((d,ctx) => { if(!PerfisCPT.gerencia(ctx.perfil)&&!ctx.perfil.papeis.includes('atendimento'))throw new Error('Consulta de fichas restrita ao Atendimento e à Gestão.');return d.carteira(filtros);}, 'atendimentos.buscar'); }
function abrirAtendimentoCPT(protocolo) { return AplicacaoCPT.executar((d,ctx) => {if(!PerfisCPT.gerencia(ctx.perfil)&&!ctx.perfil.papeis.includes('atendimento'))throw new Error('Consulta de fichas restrita ao Atendimento e à Gestão.');return d.ficha(protocolo);}, 'atendimentos.detalhe'); }

/** Execute no editor se precisar conferir a conexão; não modifica a base. */
function diagnosticarConexaoCPT(){
  const inicio=Date.now();let etapa='configuração';
  try{const config=AplicacaoCPT.config();etapa='conta Google e permissão da base';const ctx=AplicacaoCPT.contexto();etapa='estrutura de Registros e Atendimentos';const dados=new DadosDaAplicacao(ctx.base,ctx.perfil);const registros=dados.registros(),atendimentos=dados.atendimentos();const r={resultado:'CONEXÃO CONFERIDA',versao:'1.5.0',registros:Math.max(0,registros.getLastRow()-1),atendimentos:Math.max(0,atendimentos.getLastRow()-1),agendaConfigurada:!!config.agendaId,tempoMs:Date.now()-inicio};console.log(JSON.stringify(r,null,2));return r;}
  catch(e){const r={resultado:'CONEXÃO NÃO CONCLUÍDA',etapa,mensagem:e.message,tempoMs:Date.now()-inicio};console.log(JSON.stringify(r,null,2));return r;}
}

function conferirMeuAcessoCPT(){
 const etapas=[];let email='',c,p;
 try{email=AplicacaoCPT.conta();etapas.push({nome:'Conta Google',ok:true,mensagem:email});}catch(e){return {etapas:[{nome:'Conta Google',ok:false,mensagem:e.message}]};}
 try{c=AplicacaoCPT.config();p=PerfisCPT.obter(email,c);etapas.push({nome:'Cadastro na aplicação',ok:true,mensagem:p.nome});}catch(e){etapas.push({nome:'Cadastro na aplicação',ok:false,mensagem:e.message});return {etapas};}
 for(const item of [{nome:'Base Campo 4.0',id:c.baseId},{nome:'Agenda compartilhada',id:c.agendaId}]){
  try{if(!item.id)throw new Error('Planilha não configurada.');SpreadsheetApp.openById(item.id).getName();etapas.push({nome:item.nome,ok:true,mensagem:'Leitura disponível. A edição da agenda depende do compartilhamento como editor.'});}
  catch(e){etapas.push({nome:item.nome,ok:false,mensagem:'Não foi possível ler esta planilha com sua conta. Peça ao administrador para conferir o compartilhamento.'});}
 }
 return {etapas};
}
function consultarHistoricoFichaCPT(p){return AplicacaoCPT.executar((d,ctx)=>{if(!PerfisCPT.gerencia(ctx.perfil)&&!ctx.perfil.papeis.includes('atendimento'))throw new Error('Histórico restrito ao Atendimento e à Gestão.');return d.historicoFicha(p);},'atendimentos.historico');}
