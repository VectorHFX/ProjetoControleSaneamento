/**
 * PAINEL DE GESTÃO 2.2.1 | Visão executiva CPT
 * Instalar somente na nova planilha da gestão. Lê as fontes sem modificá-las.
 * Seis abas. Fotografias privadas incorporadas quando a conta tem acesso.
 */
const PG = Object.freeze({
  VERSAO: '2.2.1', FUSO: 'America/Sao_Paulo',
  DESTINO: '1mWROhF6jD4G9lz4PkSWGb6lSLO05SJMJwH8sJHqRYek',
  PROCEDIMENTOS: '1_6BKqeVbjzKm_hYdRsneU3YqEmd1rOWaVGCiV0LXtgQ',
  ATENDIMENTOS: '1UHs_jFVD7jQRKgw7CVPCQ8R7sgvyhkJVv5rcj0v2K5g',
  RDAS: '176BymNYBSfVt7iQrkNR-IyT_NXdB9GC999mX9C2WtK4',
  ANEXOS: '1Et4M0nr4CxlRj7J6EDoru91aC4PJ-G2Y',
  ABAS: ['Início', 'Análise estratégica', 'Relatos em resumo', 'Relato 1', 'Relato 2', 'Relato 3'],
  CORES: {TEXTO:'#20364A',AZUL:'#073B56',CLARO:'#EDF3F7',BRANCO:'#FFFFFF',CINZA:'#647487',BORDA:'#DCE5EB',VERDE:'#247552',VERDE_CLARO:'#E9F5ED',AMARELO:'#FFF3D4',VERMELHO:'#C52228',VERMELHO_CLARO:'#FBECE9'},
  CAMPOS: {
    diagnosticoTexto:'Relato do Diagnóstico', diagnosticoFotos:'Fotos do diagnóstico', id:'ID de migração', procedimento:'Selecione o procedimento a ser executado', data:'Data de realização do procedimento',
    carimbo:'Carimbo de data/hora', validacao:'Validação', responsavel:'Colaborador responsável pelo registro',
    bairro:'Bairro de realização do procedimento', area:'Área responsável pelo procedimento',
    atividade:'Atividade realizada', complemento:'Complemento da atividade', frente:'Título da frente de serviço',
    endereco:'Endereço da frente de serviço', local:'Endereço completo', apoio:'Colaboradores de apoio na atividade',
    relato:'Relato da atividade', objetivo:'Objetivo da atividade', observacao:'Observação final do procedimento',
    fotos:'Adicione até 5 fotos com timestamp da atividade', publico:'Público-alvo da atividade', participantes:'Total de participantes',
    ferramentas:'Ferramenta', classificacao:'Classificação da atividade', entrada:'Horário de entrada na atividade', saida:'Horário de saída na atividade',
    clima:'Clima e tempo durante a atividade', panfletos:'Quantidade de panfletos entregues', interrupcao:'Houve interrupção da atividade?',motivoInterrupcao:["Descreva qual foi a interrução", "Descreva qual foi a interrupção", "Qual foi a interrupção da atividade?"],
    deslocamento:'Como que você chegou na atividade?', veiculo:'Quantas pessoas estavam no veículo com você no inicio dessa atividade.',
    nomePesquisa:'Nome - Pesquisa de Satisfação', saneamento:'De 0 a 10, quanto está satisfeito com os serviços de saneamento de forma geral?',
    aspectos:'De forma geral, quais aspectos observa sobre os serviços de saneamento?', mudanca:'Tem notado mudanças na qualidade de vida em relação ao saneamento de forma geral?',
    melhoria:'Se sim: De 0 a 10, quanto percebeu melhorias na qualidade de vida relacionadas ao saneamento?',
    notaAtendimento:'De 0 a 10, qual nota o munícipe atribui ao atendimento recebido?', clareza:'As informações ficaram claras?',
    comentarioPesquisa:'Quer adicionar algum comentário ou sugestão para melhoria dos serviços?'
  }
});

function instalarPainelGestao() {
  const trava=LockService.getScriptLock();
  if(!trava.tryLock(1000))throw new Error('O painel está sendo atualizado. Aguarde a conclusão e execute a instalação novamente.');
  try {
  const destino = SpreadsheetApp.getActiveSpreadsheet();
  if (!destino || destino.getId() !== PG.DESTINO) throw new Error('Abra o Apps Script da NOVA planilha da gestão para instalar este arquivo.');
  const fontes = pgLerFontes_(); // Verifica o acesso e os cabeçalhos antes de criar o painel.
  const modelo = pgMontarModelo_(fontes, pgConfig_(), new Date());
  pgPrepararAbas_(destino);
  destino.setSpreadsheetTimeZone(PG.FUSO); destino.setSpreadsheetLocale('pt_BR');
  pgAtualizar_(modelo, true);
  ['pgAoAbrir','pgAtualizarAutomaticamente'].forEach(function(nome) {
    ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()===nome;}).forEach(function(t){ScriptApp.deleteTrigger(t);});
  });
  ScriptApp.newTrigger('pgAoAbrir').forSpreadsheet(PG.DESTINO).onOpen().create();
  ScriptApp.newTrigger('pgAtualizarAutomaticamente').timeBased().everyMinutes(1).create();
  // O menu será criado ao reabrir a planilha, em contexto com interface.
  destino.toast('Painel instalado. Atualização automática a cada 15 minutos.','GESTÃO',8);
  } finally {trava.releaseLock();}
}
function pgAoAbrir() {
  SpreadsheetApp.getUi().createMenu('GESTÃO').addItem('Visão executiva CPT','abrirPainelExecutivoGestao').addItem('Guia dos sistemas','abrirGuiaSistemasGestao').addItem('Diagnósticos de área','abrirDiagnosticosGestao').addSeparator().addItem('Atualizar painel agora','atualizarPainelGestao')
    .addItem('Período e referência de volume','abrirConfiguracaoPainelGestao').addItem('Conferir registros dos indicadores','abrirConferenciaIndicadoresGestao').addSeparator()
    .addItem('Abrir análise estratégica','abrirAnalisePainelGestao').addItem('Ver relatos recentes','abrirRelatosPainelGestao')
    .addItem('Tentar carregar fotos novamente','recarregarFotosPainelGestao').addItem('Atualizar visual das abas','formatarAbasNativasPainelGestao').addItem('Diagnóstico das fotos','diagnosticarFotosPainelGestao').addToUi();
}
function abrirAnalisePainelGestao(){pgDestino_().setActiveSheet(pgDestino_().getSheetByName(PG.ABAS[1]));}
function abrirRelatosPainelGestao(){pgDestino_().setActiveSheet(pgDestino_().getSheetByName(PG.ABAS[2]));}
function pgExecutarAtualizacao_(fotos) {
  const trava=LockService.getScriptLock();
  if(!trava.tryLock(1000)) return {ocupado:true};
  try {
    const modelo=pgMontarModelo_(pgLerFontes_(),pgConfig_(),new Date());
    pgAtualizar_(modelo,fotos);
    return {atualizado:true,pesquisas:modelo.producao[0].atual,referencia:modelo.producao[0].referencia};
  } catch(erro) {
    pgSinalizarErro_(erro); throw erro;
  } finally {trava.releaseLock();}
}
function pgDestino_(){return SpreadsheetApp.openById(PG.DESTINO);}
function pgTexto_(v){return v===null||v===undefined?'':String(v).trim();}
function pgNorm_(v){return pgTexto_(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toLowerCase();}
function pgLiteral_(v){return typeof v==='string'&&/^\s*=/.test(v)?"'"+v:v;}
function pgDia_(v) {
  if(v instanceof Date&&!isNaN(v.getTime()))return Utilities.formatDate(v,PG.FUSO,'yyyy-MM-dd');
  const s=pgTexto_(v);let m=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/);
  if(!m){const br=s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?: .*)?$/);if(br)m=[br[0],br[3],br[2],br[1]];}
  if(!m)return '';
  const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));
  return d.getUTCFullYear()===+m[1]&&d.getUTCMonth()===+m[2]-1&&d.getUTCDate()===+m[3]?m[1]+'-'+m[2]+'-'+m[3]:'';
}
function pgData_(dia){return dia?new Date(dia+'T12:00:00-03:00'):'';}
function pgDataTexto_(dia){return dia?dia.slice(8,10)+'/'+dia.slice(5,7)+'/'+dia.slice(0,4):'Não informada';}
function pgMesDeslocado_(mes,delta){const d=new Date(Date.UTC(+mes.slice(0,4),+mes.slice(5,7)-1+delta,1));return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0');}
function pgMesTexto_(mes){const n=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];return n[+mes.slice(5)-1]+'/'+mes.slice(0,4);}
function pgDias_(inicio,fim){return Math.floor((Date.parse(fim+'T12:00:00Z')-Date.parse(inicio+'T12:00:00Z'))/86400000);}
function pgNumero_(v){if(v===null||v===undefined||pgTexto_(v)==='')return null;const n=Number(pgTexto_(v).replace(',','.'));return Number.isFinite(n)?n:null;}
function pgNota_(v){const n=pgNumero_(v);return n!==null&&n>=0&&n<=10?n:null;}
function pgLink_(id,gid,linha){return 'https://docs.google.com/spreadsheets/d/'+id+'/edit'+(gid!==null&&gid!==undefined?'#gid='+gid+(linha?'&range=A'+linha:''):'');}
function pgHash_(x){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(x)).map(function(b){return ('0'+(b&255).toString(16)).slice(-2);}).join('');}
function pgConfig_(){
  const p=PropertiesService.getScriptProperties().getProperty('PG_CONFIG');
  return Object.assign({mes:'',metaPesquisa:null,meses:3},p?JSON.parse(p):{});
}
function pgTabela_(ss,nome,necessarios,opcional){
  const aba=ss.getSheetByName(nome);if(!aba){if(opcional)return null;throw new Error('Não encontrei a aba "'+nome+'" em '+ss.getName()+'.');}
  const dados=aba.getDataRange().getValues();
  const indice=dados.slice(0,20).findIndex(function(r){const h=r.map(pgNorm_);return necessarios.every(function(n){return h.indexOf(pgNorm_(n))>=0;});});
  if(indice<0)throw new Error('Cabeçalhos diferentes dos esperados em "'+nome+'". Confira antes de atualizar o painel.');
  const mapa={};dados[indice].forEach(function(v,i){const n=pgNorm_(v);if(n){if(mapa[n]!==undefined)throw new Error('Cabeçalho repetido em '+nome+': '+v);mapa[n]=i;}});
  const resultado={nome:nome,gid:aba.getSheetId(),linhas:dados.slice(indice+1).map(function(v,i){return {v:v,linha:indice+i+2};}).filter(function(r){return r.v.some(function(x){return x!==null&&x!=='';});}),mapa:mapa};
  const colFoto=mapa[pgNorm_(PG.CAMPOS.fotos)];
  if(colFoto!==undefined&&dados.length>indice+1){try{
    const ricos=aba.getRange(indice+2,colFoto+1,dados.length-indice-1,1).getRichTextValues();
    resultado.linhas.forEach(function(l){const r=ricos[l.linha-indice-2]&&ricos[l.linha-indice-2][0];if(!r)return;const urls=[];if(r.getLinkUrl())urls.push(r.getLinkUrl());r.getRuns().forEach(function(t){if(t.getLinkUrl())urls.push(t.getLinkUrl());});l.fotosRicas=urls.join(' ');});
  }catch(e){console.warn('Links das fotos em texto rico: '+e.message);}}
  return resultado;
}
function pgCampo_(t,r,nome){if(Array.isArray(nome)){for(const n of nome){const v=pgCampo_(t,r,n);if(pgTexto_(v))return v;}return '';} const i=t.mapa[pgNorm_(nome)];return i===undefined?'':r.v[i];}
function pgLerFontes_(){
  const p=SpreadsheetApp.openById(PG.PROCEDIMENTOS),a=SpreadsheetApp.openById(PG.ATENDIMENTOS);
  const abasP={};p.getSheets().forEach(function(s){abasP[s.getName()]=s.getSheetId();});
  const abasA={};a.getSheets().forEach(function(s){abasA[s.getName()]=s.getSheetId();});
  const f={base:pgTabela_(p,'Base Consolidada',[PG.CAMPOS.id,PG.CAMPOS.data,PG.CAMPOS.procedimento]),
    forms:pgTabela_(p,'Respostas ao formulário 1',[PG.CAMPOS.carimbo,PG.CAMPOS.procedimento],true),
    casos:pgTabela_(a,'Base Fichas Oficiais',['Protocolo','Data de abertura','Status','Data de conclusão']),
    tarefas:pgTabela_(a,'Demandas do Atendimento',['Protocolo','Tarefa do Atendimento','Prazo','Chave técnica']),
    dashboard:pgTabela_(a,'Dashboard',['Protocolo','Status'],true),abasP:abasP,abasA:abasA};
  const auditoria=a.getSheetByName('Auditoria Central');
  f.atendimentoAtualizado=auditoria?auditoria.getDataRange().getValues().find(function(r){return pgNorm_(r[0])==='ultima atualizacao';}):null;
  f.territorial=pgComplementosTerritoriais_(p);
  return f;
}
function pgFotos_(valor){
  const vistos={},fotos=[];
  (pgTexto_(valor).match(/https?:\/\/[^\s,;]+/g)||[]).forEach(function(url){
    const m=url.match(/(?:[?&]id=|\/d\/)([-\w]{10,})/);const id=m?m[1]:'';
    if(!/^https:\/\/(?:drive|docs)\.google\.com\//i.test(url)||!id||vistos[id])return;
    vistos[id]=true;fotos.push({id:id,url:url});
  });
  return fotos;
}
function pgLerProcedimentos_(t,hoje,avisos){
  const vistos={},registros=[];
  t.linhas.forEach(function(linha){
    const r={};Object.keys(PG.CAMPOS).forEach(function(k){r[k]=pgCampo_(t,linha,PG.CAMPOS[k]);});
    r.id=pgTexto_(r.id);r.dia=pgDia_(r.data);r.linha=linha.linha;r.url=pgLink_(PG.PROCEDIMENTOS,t.gid,linha.linha);
    if(!r.id){avisos.push({texto:'Registro sem ID: conferir antes de contar.',url:r.url});return;}
    const assinatura=JSON.stringify(linha.v);if(vistos[r.id]){if(vistos[r.id]!==assinatura)throw new Error('ID repetido com dados diferentes na Base Consolidada: '+r.id);return;}vistos[r.id]=assinatura;
    if(r.validacao && ['valido para consolidacao','registro atual preservado'].indexOf(pgNorm_(r.validacao))<0){avisos.push({texto:r.id+': registro aguardando validação.',url:r.url});return;}
    if(!r.dia||r.dia>hoje){avisos.push({texto:r.id+': data da atividade ausente, inválida ou futura.',url:r.url});return;}
    r.diagnosticoFotos=pgNovasFotosDiagnostico_(linha.v,t.mapa).join(' ');r.tipo=pgNorm_(r.procedimento);r.fotos=pgFotos_([r.fotos,linha.fotosRicas||''].join(' '));
    r.pesquisa=r.tipo.indexOf('pesquisa de satisfacao')>=0||['nomePesquisa','saneamento','aspectos','mudanca'].some(function(k){return pgTexto_(r[k])!=='';});
    r.eRelato=r.tipo==='relato de atividade';
    registros.push(r);
  });
  return registros;
}
function pgMontarModelo_(fontes,cfg,agora){
  const hoje=pgDia_(agora),mes=cfg.mes||hoje.slice(0,7),avisos=[];
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)||mes>hoje.slice(0,7))throw new Error('Escolha um mês válido, até o mês atual.');
  if(!Number.isInteger(cfg.meses)||cfg.meses<1||cfg.meses>3)throw new Error('Escolha de 1 a 3 meses para comparação.');
  if(cfg.metaPesquisa!==null&&(!Number.isInteger(cfg.metaPesquisa)||cfg.metaPesquisa<0))throw new Error('A meta deve ser um número inteiro maior ou igual a zero, ou ficar em branco.');
  const registros=pgLerProcedimentos_(fontes.base,hoje,avisos),relatos=registros.filter(function(r){return r.eRelato;});
  const pesquisas=registros.filter(function(r){return r.pesquisa;});
  const meses=Array.from({length:cfg.meses},function(_,i){return pgMesDeslocado_(mes,i-cfg.meses);});
  const definicoes=[
    ['Pesquisas de satisfação',function(r){return r.pesquisa;}],['Relatos de atividade',function(r){return r.eRelato;}],
    ['Vistorias cautelares',function(r){return r.tipo.indexOf('cautelar')>=0;}],['Diagnósticos de área',function(r){return r.tipo.indexOf('diagnostico')>=0;}],
    ['Contatos e parcerias',function(r){return /matriz de contato/.test(r.tipo);}],['Oportunidades comerciais',function(r){return /oportunidade.*comercializa/.test(r.tipo);}]
  ];
  const producao=definicoes.map(function(d,i){
    const grupo=registros.filter(d[1]);const atual=grupo.filter(function(r){return r.dia.slice(0,7)===mes;}).length;
    // O primeiro mês observado pode ser parcial. Meses anteriores à cobertura não viram zero.
    const inicioGrupo=grupo.length?grupo.map(function(r){return r.dia.slice(0,7);}).sort()[0]:'';
    const historico=meses.map(function(m){return inicioGrupo&&m>inicioGrupo?grupo.filter(function(r){return r.dia.slice(0,7)===m;}).length:null;});
    const validos=historico.filter(function(n){return n!==null;}),media=validos.length?validos.reduce(function(a,b){return a+b;},0)/validos.length:null;
    const referencia=i===0?(cfg.metaPesquisa!==null?cfg.metaPesquisa:(media===null?null:Math.ceil(media))):null;
    return {nome:d[0],atual:atual,historico:historico,media:media,mesesValidos:validos.length,referencia:referencia,faltam:referencia===null?null:Math.max(0,referencia-atual),registros:grupo.filter(function(r){return r.dia.slice(0,7)===mes;})};
  });
  const ids={};const casos=fontes.casos.linhas.map(function(l){
    const get=function(n){return pgCampo_(fontes.casos,l,n);};const id=pgTexto_(get('Protocolo'));if(!id)return null;
    if(ids[id])throw new Error('Protocolo repetido na Base Fichas Oficiais: '+id);ids[id]=true;
    return {id:id,dia:pgDia_(get('Data de abertura')),conclusao:pgDia_(get('Data de conclusão')),status:pgTexto_(get('Status')),area:pgTexto_(get('Área responsável pela próxima ação')),acao:pgTexto_(get('Próxima ação')),urgencia:pgTexto_(get('Grau de urgência')),atualizacao:pgDia_(get('Última atualização operacional')),url:pgLink_(PG.ATENDIMENTOS,fontes.abasA['Fichas Oficiais']),encerrado:/conclu|encerrad|finalizad/.test(pgNorm_(get('Status'))),historico:pgTexto_(get('Histórico já entregue'))==='SIM'};
  }).filter(Boolean);
  const dashboard={};if(fontes.dashboard)fontes.dashboard.linhas.forEach(function(l){dashboard[pgTexto_(pgCampo_(fontes.dashboard,l,'Protocolo'))]=l.linha;});
  casos.forEach(function(c){if(dashboard[c.id])c.url=pgLink_(PG.ATENDIMENTOS,fontes.dashboard.gid,dashboard[c.id]);});
  const tarefas=fontes.tarefas.linhas.map(function(l){
    const get=function(n){return pgCampo_(fontes.tarefas,l,n);};if(!get('Chave técnica'))return null;
    const realizada=get('✓ Tarefa realizada')===true||get('✓ Tarefa realizada')==='Registrada'||Boolean(pgDia_(get('Data da realização')));
    return {id:pgTexto_(get('Protocolo')),chave:pgTexto_(get('Chave técnica')),tipo:pgTexto_(get('Tarefa do Atendimento')),acao:pgTexto_(get('Ação necessária')),prazo:pgDia_(get('Prazo')),realizada:realizada,url:pgLink_(PG.ATENDIMENTOS,fontes.tarefas.gid,l.linha)};
  }).filter(Boolean);
  const pendentes=tarefas.filter(function(t){return !t.realizada;}).sort(function(a,b){return (a.prazo||'9999').localeCompare(b.prazo||'9999')||a.id.localeCompare(b.id);});
  const abertos=casos.filter(function(c){return !c.encerrado&&!c.historico;});
  const chavesDia=Array.from(new Set(relatos.map(function(r){return r.dia;}))).sort().reverse().slice(0,3);
  const dias=chavesDia.map(function(d){return {dia:d,relatos:relatos.filter(function(r){return r.dia===d;}).sort(function(a,b){return pgTexto_(a.entrada).localeCompare(pgTexto_(b.entrada))||a.id.localeCompare(b.id);})};});
  const atualPesquisas=pesquisas.filter(function(r){return r.dia.slice(0,7)===mes;}),anterior=pesquisas.filter(function(r){return r.dia.slice(0,7)===pgMesDeslocado_(mes,-1);});
  const escuta=[['Satisfação com saneamento','saneamento'],['Melhoria na qualidade de vida','melhoria'],['Atendimento recebido','notaAtendimento']].map(function(d){
    const a=atualPesquisas.map(function(r){return pgNota_(r[d[1]]);}).filter(function(n){return n!==null;}),b=anterior.map(function(r){return pgNota_(r[d[1]]);}).filter(function(n){return n!==null;});
    return {nome:d[0],media:a.length?a.reduce(function(x,y){return x+y;},0)/a.length:null,n:a.length,anterior:b.length?b.reduce(function(x,y){return x+y;},0)/b.length:null,nAnterior:b.length,atencao:atualPesquisas.filter(function(r){const n=pgNota_(r[d[1]]);return n!==null&&n<=6;})};
  });
  const ultimaFonte=registros.map(function(r){return pgDia_(r.carimbo);}).filter(Boolean).sort().pop()||'';
  if(fontes.forms){const ultimoForm=fontes.forms.linhas.map(function(r){const d=pgCampo_(fontes.forms,r,PG.CAMPOS.carimbo);return d instanceof Date?d.getTime():0;}).reduce(function(a,b){return Math.max(a,b);},0);const ultimoBase=registros.map(function(r){return r.carimbo instanceof Date?r.carimbo.getTime():0;}).reduce(function(a,b){return Math.max(a,b);},0);if(ultimoForm>ultimoBase)avisos.push({texto:'Há respostas do formulário aguardando integração na Base Consolidada.',url:pgLink_(PG.PROCEDIMENTOS,fontes.abasP['Respostas ao formulário 1'])});}
  const qualidade=relatos.filter(function(r){return r.dia.slice(0,7)===mes&&(!pgTexto_(r.relato)||!pgTexto_(r.responsavel)||!pgTexto_(r.endereco||r.local)||!r.fotos.length);});
  return {hoje:hoje,agora:agora,mes:mes,meses:meses,cfg:cfg,producao:producao,pesquisas:atualPesquisas,escuta:escuta,dias:dias,relatos:relatos,registros:registros,casos:casos,abertos:abertos,pendentes:pendentes,vencidas:pendentes.filter(function(t){return t.prazo&&t.prazo<hoje;}),qualidade:qualidade,avisos:avisos,ultimaFonte:ultimaFonte,fontes:fontes};
}

function pgPrepararAbas_(ss){
  const props=PropertiesService.getScriptProperties(),salvas=JSON.parse(props.getProperty('PG_ABAS')||'{}');
  PG.ABAS.forEach(function(n){const s=ss.getSheetByName(n);if(s&&salvas[n]!==s.getSheetId()&&s.getLastRow()>0)throw new Error('A aba '+n+' já tem conteúdo e não pertence a este painel. Nada foi substituído.');});
  PG.ABAS.forEach(function(n,i){
    let s=ss.getSheetByName(n);
    if(!s){const todas=ss.getSheets();const vazia=i===0&&todas.length===1&&todas[0].getLastRow()===0&&todas[0].getImages().length===0&&todas[0].getCharts().length===0?todas[0]:null;s=vazia?vazia.setName(n):ss.insertSheet(n);}
    salvas[n]=s.getSheetId();
  });
  props.setProperty('PG_ABAS',JSON.stringify(salvas));
}
function pgAtualizar_(m,forcarFotos){
  const ss=pgDestino_(),p=PropertiesService.getScriptProperties(),salvas=JSON.parse(p.getProperty('PG_ABAS')||'{}');
  PG.ABAS.forEach(function(n){const s=ss.getSheetByName(n);if(!s||salvas[n]!==s.getSheetId())throw new Error('Execute instalarPainelGestao() antes de atualizar. Aba não reconhecida: '+n);});
  const photoCache={},fotoAvisos=[];
  pgEscreverInicio_(ss,m);pgEscreverAnalise_(ss,m);
  for(let i=0;i<3;i++){
    const s=ss.getSheetByName(PG.ABAS[i+3]),dia=m.dias[i]||null;
    const hash=pgHash_({versao:PG.VERSAO,dia:dia});
    if(forcarFotos||p.getProperty('PG_DIA_'+i)!==hash){
      pgEscreverDia_(s,dia,i,m,photoCache,fotoAvisos);
      // Só grava a marca quando todas as imagens tiveram uma resposta definitiva.
      p.setProperty('PG_DIA_'+i,hash);
    }
  }
  const hashResumo=pgHash_({versao:PG.VERSAO,dias:m.dias});
  if(forcarFotos||p.getProperty('PG_RESUMO')!==hashResumo){pgEscreverResumo_(ss,m,photoCache,fotoAvisos);p.setProperty('PG_RESUMO',hashResumo);}
  pgAplicarProtecoes_(ss);
  const stamp='Atualizado em '+Utilities.formatDate(new Date(),PG.FUSO,'dd/MM/yyyy HH:mm');
  PG.ABAS.forEach(function(n){const s=ss.getSheetByName(n);s.getRange('B4:M4').setValue(stamp).setFontColor(PG.CORES.CINZA).setBackground(PG.CORES.BRANCO);});
  if(fotoAvisos.length){p.setProperty('PG_AVISO_FOTOS',Array.from(new Set(fotoAvisos)).length+' foto(s) sem prévia nesta atualização. O link original está no relato. Use GESTÃO > Tentar carregar fotos novamente.');}
  else if(forcarFotos||Object.keys(photoCache).length)p.deleteProperty('PG_AVISO_FOTOS');
  const avisoFoto=p.getProperty('PG_AVISO_FOTOS');if(avisoFoto)ss.getSheetByName(PG.ABAS[2]).getRange('B5:M5').breakApart().merge().setValue(avisoFoto).setBackground(PG.CORES.AMARELO).setWrap(true);
  p.setProperty('PG_ULTIMA',String(Date.now()));const pendente=p.getProperty('PG_PEDIDO');if(!pendente||JSON.parse(pendente).quando<=m.agora.getTime())p.deleteProperty('PG_PEDIDO');p.deleteProperty('PG_ERRO');SpreadsheetApp.flush();
}
function pgSinalizarErro_(erro){
  const mensagem='Atualização interrompida. Parte do painel pode manter dados da atualização anterior. '+erro.message;
  PropertiesService.getScriptProperties().setProperty('PG_ERRO',mensagem);
  const ss=pgDestino_(),salvas=JSON.parse(PropertiesService.getScriptProperties().getProperty('PG_ABAS')||'{}');
  PG.ABAS.forEach(function(n){const s=ss.getSheetByName(n);if(s&&salvas[n]===s.getSheetId())s.getRange('B4:M4').setValue(mensagem).setBackground(PG.CORES.VERMELHO_CLARO).setFontColor(PG.CORES.VERMELHO).setWrap(true);});
}
function pgBaseVisual_(s,titulo,subtitulo,linhas,preservarNotas){
  if(s.getMaxColumns()<14)s.insertColumnsAfter(s.getMaxColumns(),14-s.getMaxColumns());
  if(s.getMaxRows()<linhas)s.insertRowsAfter(s.getMaxRows(),linhas-s.getMaxRows());
  const ate=preservarNotas?24:Math.max(linhas,s.getLastRow());
  if(s.getFilter())s.getFilter().remove();
  s.getRange(1,1,ate,14).breakApart().clearContent().clearFormat().clearDataValidations();
  if(!preservarNotas)s.getImages().forEach(function(img){img.remove();});
  s.getRange(1,1,Math.max(linhas,46),14).setFontFamily('Arial').setFontSize(12).setFontColor(PG.CORES.TEXTO).setVerticalAlignment('middle').setBackground('#F1F5F9');
  s.setHiddenGridlines(true);s.setFrozenRows(4);s.setFrozenColumns(0);
  s.setColumnWidth(1,20);s.setColumnWidths(2,12,82);s.setColumnWidth(14,20);
  s.setRowHeights(1,ate,24);s.setRowHeight(1,12);s.setRowHeight(2,42);s.setRowHeight(3,28);s.setRowHeight(4,25);
  pgBloco_(s,2,2,12,titulo,{size:20,bold:true,color:PG.CORES.BRANCO,fill:'#073B56'});
  pgBloco_(s,3,2,12,subtitulo,{size:10,color:'#E4EDF2',fill:'#073B56'});
  pgBloco_(s,4,2,12,'Atualização em andamento. Aguarde a conclusão.',{size:9,color:PG.CORES.CINZA});
  s.getRange('B3:M3').setBorder(null,null,true,null,null,null,'#E30613',SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  s.setTabColor(s.getName()==='Análise estratégica'?PG.CORES.AZUL:PG.CORES.CLARO);
}
function pgBloco_(s,linha,coluna,largura,valor,estilo){
  const r=s.getRange(linha,coluna,1,largura);if(largura>1)r.merge();r.setValue(pgLiteral_(valor===null?'Sem base':valor));r.setWrap(true);
  const e=Object.assign({},estilo||{});if(e.size&&e.size<12)e.size=12;r.setHorizontalAlignment(e.align||(typeof valor==='number'?'center':'left'));if(e.bold)r.setFontWeight('bold');if(e.size)r.setFontSize(e.size);if(e.fill)r.setBackground(e.fill);if(e.color)r.setFontColor(e.color);if(e.align)r.setHorizontalAlignment(e.align);if(e.format)r.setNumberFormat(e.format);
  return r;
}
function pgLinkCelula_(s,linha,coluna,largura,texto,url,fill){
  const r=pgBloco_(s,linha,coluna,largura,texto,{bold:true,color:PG.CORES.AZUL,fill:fill||PG.CORES.CLARO});
  r.setRichTextValue(SpreadsheetApp.newRichTextValue().setText(texto).setLinkUrl(url).build());return r;
}
function pgSecao_(s,linha,texto){pgBloco_(s,linha,2,12,texto,{bold:true,fill:'#244D68',color:'#FFFFFF',size:11});s.setRowHeight(linha,35);}
function pgLinhasTexto_(s,linha,titulo,texto){
  pgBloco_(s,linha,2,12,titulo,{bold:true});linha++;
  const valor=pgTexto_(texto)||'Não informado no registro.';
  const partes=valor.match(/[\s\S]{1,2400}/g)||[''];
  partes.forEach(function(t){pgBloco_(s,linha,2,12,t,{fill:'#FFFFFF'}).setVerticalAlignment('top');const n=t.split('\n').reduce(function(a,l){return a+Math.max(1,Math.ceil(l.length/118));},0);s.setRowHeight(linha,Math.max(50,n*21+26));linha++;});
  return linha;
}
function pgEscreverInicio_(ss,m){
  const s=ss.getSheetByName(PG.ABAS[0]);pgBaseVisual_(s,'CPT | Gestão socioambiental','Visão integrada da operação · '+pgMesTexto_(m.mes),74,true);
  const dia=m.dias[0],v=m.producao[0];
  pgCartaoNativo_(s,6,2,4,'ATENDIMENTO',m.abertos.length,'Protocolos abertos em '+pgDataTexto_(m.hoje),'#073B56');
  pgCartaoNativo_(s,6,6,4,'PROGRAMA PARCEIROS',v.atual,'Pesquisas em '+pgMesTexto_(m.mes)+' · referência: '+(v.referencia===null?'sem base':v.referencia),'#008AC4');
  pgCartaoNativo_(s,6,10,4,'MEMÓRIA DE CAMPO',dia?dia.relatos.length:0,dia?'Relatos de '+pgDataTexto_(dia.dia):'Sem relatos com data válida','#244D68');
  s.setRowHeight(9,15);
  [[2,'ANÁLISE E OPORTUNIDADES','Indicadores e contexto do período',PG.ABAS[1]],[8,'MEMÓRIA RECENTE DA EQUIPE','Relatos originais e evidências',PG.ABAS[2]]].forEach(function(x){
    pgLinkCelula_(s,10,x[0],6,x[1],pgLink_(PG.DESTINO,ss.getSheetByName(x[3]).getSheetId()),'#E6F3F3');
    pgBloco_(s,11,x[0],6,x[2],{size:10,fill:'#E6F3F3',color:'#466477'});pgContorno_(s,10,x[0],2,6);
  });s.setRowHeight(10,30);s.setRowHeight(11,26);s.setRowHeight(12,12);
  const links=[['Controle de Atendimentos','Protocolos, acompanhamento e fichas',PG.ATENDIMENTOS,m.fontes.abasA.Dashboard],['Procedimentos de Campo','Registros originais e processos da equipe',PG.PROCEDIMENTOS,m.fontes.abasP['Respostas ao formulário 1']],['RDAS','Relatos diários e evidências de campo',PG.RDAS,null],['Anexos do relatório','Entregas mensais para a Sabesp',PG.ANEXOS,null],['Programa Parceiros','Requisitos e resultados do programa',PG.PROCEDIMENTOS,m.fontes.abasP['Programa Parceiros']],['Pesquisa de Satisfação','Respostas e comentários da população',PG.PROCEDIMENTOS,m.fontes.abasP['Pesquisa de Satisfação']],['Diagnósticos de Área','Reconhecimento das frentes de serviço',PG.PROCEDIMENTOS,m.fontes.abasP['Diagnósticos de Área']],['Execução de Atendimentos','Comunicação entre setores e registros da execução','1Y5zioMOTaJDtp78OPBovXeHhvuns_ZEG6SMyHqng-Uk',321623213]];
  links.forEach(function(x,i){const row=13+Math.floor(i/2)*2,col=i%2?8:2;pgLinkCelula_(s,row,col,6,x[0],pgLink_(x[2],x[3]),'#FFFFFF');pgBloco_(s,row+1,col,6,x[1],{size:10,color:'#536B82',fill:'#FFFFFF'});pgContorno_(s,row,col,2,6);s.setRowHeight(row,29);s.setRowHeight(row+1,26);});
  pgBloco_(s,21,2,12,'Janela interativa: GESTÃO > Visão executiva CPT · Base consultada até '+pgDataTexto_(m.ultimaFonte),{size:10,color:'#536B82'});s.setRowHeight(21,33);s.setRowHeight(22,15);
  pgSecao_(s,23,'ESPAÇO DA GESTÃO');pgBloco_(s,24,2,12,'Observações, decisões e acompanhamentos · conteúdo preservado a cada atualização',{size:10,color:'#536B82',fill:'#E6F3F3'});s.setRowHeight(24,29);
  [[2,2,'Referência'],[4,5,'Observação ou decisão'],[9,2,'Interlocutor'],[11,2,'Data de acompanhamento'],[13,1,'Concluído']].forEach(function(x){pgBloco_(s,25,x[0],x[1],x[2],{size:10,bold:true,fill:'#244D68',color:'#FFFFFF'});});s.setRowHeight(25,42);
  const notas=s.getRange('B26:M45').getValues();
  for(let r=26;r<=45;r++){
    [[2,2],[4,5],[9,2],[11,2]].forEach(function(x){s.getRange(r,x[0],1,x[1]).merge().setWrap(true);});
    const n=notas[r-26],linhas=pgTexto_(n[2]).split('\n').reduce(function(a,l){return a+Math.max(1,Math.ceil(l.length/58));},0);
    s.setRowHeight(r,Math.max(76,Math.min(390,linhas*19+22)));s.getRange(r,2,1,12).setBackground(r%2?'#F4F9FC':'#FFFFFF').setVerticalAlignment('top').setBorder(null,null,true,null,null,null,'#DCE5EC',SpreadsheetApp.BorderStyle.SOLID);
    s.getRange(r,4,1,5).setFontSize(11);s.getRange(r,11).setNumberFormat('dd/MM/yyyy');s.getRange(r,13).setHorizontalAlignment('center').setVerticalAlignment('middle');
  }
  s.getRange('M26:M45').setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  const area=s.getRange('B26:M45');s.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$M26=TRUE').setBackground('#E9F5ED').setRanges([area]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=($D26<>"")*ISNUMBER($K26)*($K26<TODAY())*($M26<>TRUE)').setBackground('#FFF1E1').setRanges([area]).build()
  ]);pgContorno_(s,25,2,21,12);pgTerritoriosNativos_(s,m);
}

function pgEscreverAnalise_(ss,m){
  const s=ss.getSheetByName(PG.ABAS[1]);pgBaseVisual_(s,'Visão da gestão','Consórcio Performance Tamanduateí | Produção de '+pgMesTexto_(m.mes)+' | Atendimento em '+pgDataTexto_(m.hoje),95,false);
  const comExecucao=m.abertos.filter(function(c){return pgNorm_(c.area).indexOf('execucao')>=0;}).length;
  const cards=[
    ['PESQUISAS REALIZADAS','=H24','No mês selecionado'],
    ['PESQUISAS ATÉ A REFERÊNCIA','=K24',m.producao[0].referencia===null?'Referência ainda não definida':'Para alcançar '+m.producao[0].referencia+' no mês'],
    ['ATENDIMENTOS ABERTOS',m.abertos.length,comExecucao+' aguardam a Execução'],
    ['TAREFAS VENCIDAS',m.vencidas.length,'De '+m.pendentes.length+' tarefas pendentes']
  ];
  cards.forEach(function(a,i){
    const fill=i===3&&m.vencidas.length?'#FBECE9':i%2===0?'#EDF3F7':'#F7FAFB';
    const color=i===3&&m.vencidas.length?PG.CORES.VERMELHO:PG.CORES.AZUL;
    pgBloco_(s,6,2+i*3,3,a[0],{size:9,bold:true,fill:fill,color:color,align:'center'});
    const r=pgBloco_(s,7,2+i*3,3,typeof a[1]==='string'?'':a[1],{size:30,bold:true,format:'0',fill:fill,color:color,align:'center'});if(typeof a[1]==='string')r.setFormula(a[1]);
    pgBloco_(s,8,2+i*3,3,a[2],{size:10,fill:fill,color:PG.CORES.CINZA,align:'center'});
  });s.setRowHeight(6,29);s.setRowHeight(7,46);s.setRowHeight(8,29);s.setRowHeight(9,16);
  const volume=m.producao[0],fim=new Date(Date.UTC(+m.mes.slice(0,4),+m.mes.slice(5,7),0)).toISOString().slice(0,10);
  const orientacao=volume.faltam===null?'Referência de pesquisas ainda indisponível para este mês':(m.mes<m.hoje.slice(0,7)?(volume.faltam?'Fechamento: '+volume.faltam+' pesquisas abaixo da referência':'Fechamento: referência de pesquisas alcançada'):(volume.faltam?volume.atual+' pesquisas em '+pgMesTexto_(m.mes)+' | Referência de volume: '+volume.referencia:'Referência de pesquisas alcançada no mês'));
  pgBloco_(s,10,2,12,orientacao,{size:14,bold:true,color:PG.CORES.BRANCO,fill:'#087F83'});s.setRowHeight(10,42);
  const referencia=volume.referencia===null?'Referência ajustável em GESTÃO > Período e referência de volume.':(m.cfg.metaPesquisa===null?'Referência de '+volume.referencia+' pesquisas, pela média de '+m.meses.filter(function(x,i){return volume.historico[i]!==null;}).map(pgMesTexto_).join(', ')+'.':'Meta de '+volume.referencia+' pesquisas definida pela gestão.');
  pgBloco_(s,11,2,12,referencia,{size:10,color:PG.CORES.CINZA});s.setRowHeight(11,28);s.setRowHeight(12,14);
  pgSecao_(s,13,'Atendimento | Acompanhamentos por prazo');
  [[2,2,'Protocolo'],[4,6,'Próxima ação registrada'],[10,2,'Prazo'],[12,2,'Situação']].forEach(function(x){pgBloco_(s,14,x[0],x[1],x[2],{size:10,bold:true,color:PG.CORES.CINZA});});s.setRowHeight(14,30);
  m.pendentes.slice(0,3).forEach(function(t,i){
    const r=15+i,vencida=Boolean(t.prazo&&t.prazo<m.hoje),venceHoje=t.prazo===m.hoje;
    const fill=vencida?'#FFF4F1':i%2?'#F7FAFB':PG.CORES.BRANCO;
    pgLinkCelula_(s,r,2,2,t.id,t.url,fill);
    const acao=t.acao||t.tipo;pgBloco_(s,r,4,6,acao,{fill:fill});
    pgBloco_(s,r,10,2,t.prazo?pgData_(t.prazo):'Sem prazo',{format:'dd/MM/yyyy',fill:fill,align:'center'});
    pgBloco_(s,r,12,2,vencida?'Vencida':venceHoje?'Vence hoje':t.prazo?'Em acompanhamento':'Sem prazo registrado',{size:10,bold:true,fill:fill,align:'center',color:vencida?PG.CORES.VERMELHO:PG.CORES.AZUL});
    s.setRowHeight(r,Math.max(52,Math.ceil(pgTexto_(acao).length/66)*18+14));
  });
  if(!m.pendentes.length)pgBloco_(s,15,2,12,'Nenhuma tarefa pendente no Controle de Atendimentos.');
  s.setRowHeight(18,12);
  pgLinkCelula_(s,19,2,7,'Abrir todas as '+m.pendentes.length+' tarefas do Atendimento',pgLink_(PG.ATENDIMENTOS,m.fontes.tarefas.gid));
  pgLinkCelula_(s,19,9,5,'Ver os relatos recentes da equipe',pgLink_(PG.DESTINO,ss.getSheetByName(PG.ABAS[2]).getSheetId()));s.setRowHeight(19,38);
  pgBloco_(s,20,2,12,'Protocolos vinculados ao controle original. Comparativos mensais disponíveis abaixo.',{size:9,color:PG.CORES.CINZA});s.setRowHeight(20,25);s.setRowHeight(21,18);
  pgSecao_(s,22,'Produção e referência mensal');
  const meses=Array(3-m.meses.length).fill('').concat(m.meses);
  pgBloco_(s,23,2,3,'Procedimento',{bold:true,fill:PG.CORES.AZUL,color:PG.CORES.BRANCO});
  const cab=meses.map(function(x){return x?pgMesTexto_(x):'';}).concat(['No mês','Média mensal','Referência','Diferença']);
  cab.forEach(function(x,i){pgBloco_(s,23,5+i,1,x,{bold:true,fill:PG.CORES.AZUL,color:PG.CORES.BRANCO,align:'center'});});pgBloco_(s,23,12,2,'Conferência',{bold:true,fill:PG.CORES.AZUL,color:PG.CORES.BRANCO});s.setRowHeight(23,46);
  m.producao.forEach(function(p,i){
    const r=24+i;pgBloco_(s,r,2,3,p.nome,{bold:true});const hist=Array(3-p.historico.length).fill(null).concat(p.historico);
    s.getRange(r,5,1,4).setValues([hist.map(function(n){return n===null?'':n;}).concat([p.atual])]).setNumberFormat('0');
    if(p.media!==null)s.getRange(r,9).setFormula('=SUM(E'+r+':G'+r+')/COUNT(E'+r+':G'+r+')').setNumberFormat('0.0');else s.getRange(r,9).setValue('Sem base');
    if(i===0&&p.referencia!==null){if(m.cfg.metaPesquisa===null)s.getRange(r,10).setFormula('=ROUNDUP(I'+r+';0)');else s.getRange(r,10).setValue(m.cfg.metaPesquisa);s.getRange(r,11).setFormula('=MAX(0;J'+r+'-H'+r+')').setNumberFormat('0');}
    else {s.getRange(r,10,1,2).setValues([[i===0?'Sem base':'',i===0?'Sem base':'']]);}
    pgLinkCelula_(s,r,12,2,'Ver origem',pgLink_(PG.PROCEDIMENTOS,m.fontes.base.gid,p.registros[0]?p.registros[0].linha:1));s.setRowHeight(r,45);
  });
  s.getRange('E24:K29').setHorizontalAlignment('center');
  pgBloco_(s,31,2,12,'Média: registros disponíveis nos meses encerrados. O primeiro mês encontrado pode ser parcial e fica fora da comparação. Campos vazios não significam zero.',{color:PG.CORES.CINZA});s.setRowHeight(31,48);
  pgBloco_(s,32,2,12,'Para ver a lista exata de registros e os meses usados: GESTÃO > Conferir registros dos indicadores.',{color:PG.CORES.AZUL});s.setRowHeight(32,32);
  pgSecao_(s,34,'Escuta da população e Programa Parceiros');
  [[2,4,'Pergunta avaliada'],[6,2,'Média do mês'],[8,2,'Respostas válidas'],[10,2,'Mês anterior'],[12,2,'Notas de 0 a 6']].forEach(function(x){pgBloco_(s,35,x[0],x[1],x[2],{bold:true});});s.setRowHeight(35,44);
  m.escuta.forEach(function(e,i){const r=36+i;pgBloco_(s,r,2,4,e.nome);pgBloco_(s,r,6,2,e.media,{format:'0.0" / 10"'});pgBloco_(s,r,8,2,e.n,{format:'0'});pgBloco_(s,r,10,2,e.anterior,{format:'0.0" / 10"'});pgBloco_(s,r,12,2,e.n?e.atencao.length+' de '+e.n:'Sem respostas',{color:e.atencao.length?PG.CORES.VERMELHO:PG.CORES.TEXTO});s.setRowHeight(r,44);});
  s.getRange('F35:M38').setHorizontalAlignment('center');
  pgBloco_(s,40,2,12,'Cada média usa somente as notas válidas. Em qualidade de vida, são os valores informados na pergunta sobre melhoria. A referência mensal acompanha o volume de pesquisas.',{color:PG.CORES.CINZA});s.setRowHeight(40,45);
  pgSecao_(s,42,'Pontos para a gestão observar');
  const itens=[m.abertos.filter(function(c){return pgNorm_(c.area).indexOf('execucao')>=0;}).length+' atendimento(s) aguardam providência da Execução.',
    m.abertos.filter(function(c){return pgNorm_(c.area).indexOf('atendimento')>=0;}).length+' atendimento(s) aguardam ação do Atendimento.',
    m.casos.filter(function(c){return c.encerrado&&c.conclusao.slice(0,7)===m.mes;}).length+' ficha(s) concluída(s) em '+pgMesTexto_(m.mes)+'. A carteira antiga continua em recadastro.',
    m.qualidade.length+' relato(s) do mês sem pelo menos um destes campos: responsável, local, texto ou foto. Conferir a necessidade de completar o registro.'];
  itens.forEach(function(t,i){pgBloco_(s,43+i,2,12,t);s.setRowHeight(43+i,36);});
  const atores={};m.registros.filter(function(r){return r.dia.slice(0,7)===m.mes&&(r.eRelato||r.pesquisa);}).forEach(function(r){const n=pgTexto_(r.responsavel)||'Responsável não informado';if(!atores[n])atores[n]={pesquisas:0,relatos:0};if(r.pesquisa)atores[n].pesquisas++;if(r.eRelato)atores[n].relatos++;});
  pgSecao_(s,48,'Registros enviados pela equipe no mês');pgBloco_(s,49,2,8,'Responsável pelo registro',{bold:true});pgBloco_(s,49,10,2,'Pesquisas',{bold:true,align:'center'});pgBloco_(s,49,12,2,'Relatos',{bold:true,align:'center'});s.setRowHeight(49,34);
  let linha=50;Object.keys(atores).sort(function(a,b){return a.localeCompare(b,'pt-BR');}).forEach(function(n){pgBloco_(s,linha,2,8,n);pgBloco_(s,linha,10,2,atores[n].pesquisas,{format:'0'});pgBloco_(s,linha,12,2,atores[n].relatos,{format:'0'});s.setRowHeight(linha++,32);});
  pgBloco_(s,linha+1,2,12,'Atribuição a quem registrou o formulário. Colaboradores de apoio aparecem nos relatos. Estes totais não são uma avaliação individual de desempenho.',{color:PG.CORES.CINZA});s.setRowHeight(linha+1,48);
  pgSecao_(s,linha+3,'Conferência das fontes');
  const status=m.fontes.atendimentoAtualizado?m.fontes.atendimentoAtualizado[1]:'';
  pgBloco_(s,linha+4,2,12,'Atualização informada pelo Controle de Atendimentos: '+(status instanceof Date?Utilities.formatDate(status,PG.FUSO,'dd/MM/yyyy HH:mm'):'não disponível')+'.');s.setRowHeight(linha+4,34);
  m.avisos.slice(0,8).forEach(function(a,i){pgLinkCelula_(s,linha+5+i,2,12,a.texto,a.url,PG.CORES.AMARELO);s.setRowHeight(linha+5+i,40);});
  pgAcabamentoAnalise_(s);
  if(m.avisos.length>8)pgBloco_(s,linha+13,2,12,'Mais '+(m.avisos.length-8)+' registros exigem conferência na base.');
}

function pgEscreverDia_(s,dia,indice,m,cache,avisos){
  const registros=dia?dia.relatos:[];pgBaseVisual_(s,'Relato '+(indice+1)+(dia?' | '+pgDataTexto_(dia.dia):''),'Cópia dos registros do dia, com o texto original da equipe.',Math.max(120,registros.length*80),false);
  if(!dia){pgBloco_(s,7,2,12,'Ainda não há outro dia com relato registrado.');return;}
  pgBloco_(s,6,2,12,registros.length+' relato(s) registrado(s) neste dia. Os dados completos ficam nos Procedimentos de Campo.');s.setRowHeight(6,34);
  let linha=8;
  registros.forEach(function(r,i){
    pgSecao_(s,linha, 'Registro '+(i+1)+': '+pgTexto_(r.atividade||'Atividade não informada'));linha++;
    pgLinkCelula_(s,linha,2,12,r.id+' | Abrir registro de origem',r.url);linha++;
    const campos=[['Responsável pelo registro',r.responsavel],['Colaboradores de apoio',r.apoio],['Local',r.endereco||r.local],['Bairro e frente',[r.bairro,r.frente].map(pgTexto_).filter(Boolean).join(' / ')],
      ['Área e classificação',[r.area,r.classificacao].map(pgTexto_).filter(Boolean).join(' / ')],['Complemento da atividade',r.complemento],['Público e participantes',pgTexto_(r.publico)+(pgNumero_(r.participantes)!==null?' | '+pgNumero_(r.participantes)+' participante(s)':' | quantidade não informada')],
      ['Ferramentas',r.ferramentas],['Horários',[pgHora_(r.entrada),pgHora_(r.saida)].filter(Boolean).join(' até ')],['Clima e interrupção',[r.clima,r.interrupcao].map(pgTexto_).filter(Boolean).join(' / ')],
      ['Deslocamento',pgTexto_(r.deslocamento)+(pgNumero_(r.veiculo)!==null?' | pessoas informadas no veículo: '+pgNumero_(r.veiculo):'')],['Panfletos entregues',pgNumero_(r.panfletos)]];
    const escreverCampo=function(c){pgBloco_(s,linha,2,4,c[0],{bold:true});pgBloco_(s,linha,6,8,c[1]===null||pgTexto_(c[1])===''?'Não informado':c[1]);s.setRowHeight(linha,Math.max(36,Math.ceil(pgTexto_(c[1]).length/75)*20+12));linha++;};
    campos.slice(0,4).forEach(escreverCampo);
    linha=pgLinhasTexto_(s,linha+1,'Relato do funcionário',r.relato);
    linha=pgGaleria_(s,linha+1,r.fotos,false,cache,avisos)+1;
    pgSecao_(s,linha++,'Detalhes da atividade');
    campos.slice(4).forEach(escreverCampo);
    linha=pgLinhasTexto_(s,linha+1,'Objetivo da atividade',r.objetivo);
    if(pgTexto_(r.observacao))linha=pgLinhasTexto_(s,linha+1,'Observação registrada pela equipe',r.observacao);
    linha+=2;
  });
}
function pgHora_(v){return v instanceof Date?Utilities.formatDate(v,PG.FUSO,'HH:mm'):pgTexto_(v).replace(/^(\d{2}:\d{2}):\d{2}$/,'$1');}
function pgEscreverResumo_(ss,m,cache,avisos){
  const s=ss.getSheetByName(PG.ABAS[2]),total=m.dias.reduce(function(n,d){return n+d.relatos.length;},0);
  pgBaseVisual_(s,'Relatos em resumo','Quem participou, onde foi, o que a equipe relatou e as fotos.',Math.max(100,total*30),false);
  pgBloco_(s,6,2,12,total+' relato(s) nos últimos '+m.dias.length+' dias com atividade: '+m.dias.map(function(d){return pgDataTexto_(d.dia);}).join(', ')+'.');s.setRowHeight(6,34);
  let linha=8;
  m.dias.forEach(function(d,i){
    pgLinkCelula_(s,linha,2,12,pgDataTexto_(d.dia)+' | Abrir o dia completo',pgLink_(PG.DESTINO,ss.getSheetByName(PG.ABAS[i+3]).getSheetId()));s.setRowHeight(linha++,34);
    d.relatos.forEach(function(r){
      pgBloco_(s,linha,2,12,'Quem: '+(pgTexto_(r.responsavel)||'Não informado')+(pgTexto_(r.apoio)?'. Apoio: '+pgTexto_(r.apoio):''),{bold:true});s.setRowHeight(linha++,52);
      pgBloco_(s,linha,2,12,'Onde: '+(pgTexto_(r.endereco||r.local)||'Não informado')+(pgTexto_(r.frente)?'. Frente: '+pgTexto_(r.frente):''));s.setRowHeight(linha++,44);
      linha=pgLinhasTexto_(s,linha,'Relato do funcionário',r.relato);
      linha=pgGaleria_(s,linha,r.fotos,true,cache,avisos);
      pgLinkCelula_(s,linha,2,12,'Conferir '+r.id+' na origem',r.url,PG.CORES.BRANCO);s.setRowHeight(linha++,28);linha++;
    });
  });
  if(!total)pgBloco_(s,8,2,12,'Nenhum relato com data válida foi encontrado.');
}
function pgBlobFoto_(foto,cache){
  if(Object.prototype.hasOwnProperty.call(cache,foto.id))return cache[foto.id];
  try{cache[foto.id]=cptfLer_(foto.url,false).blob;}
  catch(e){cache[foto.id]=null;console.warn('Foto do painel: '+foto.id+' | '+e.message);}
  return cache[foto.id];
}

function pgGaleria_(s,linha,fotos,compacta,cache,avisos){
  if(!fotos.length){pgBloco_(s,linha,2,12,'Nenhuma mídia vinculada a este registro.',{color:PG.CORES.CINZA,fill:'#FFFFFF'});s.setRowHeight(linha,35);return linha+1;}
  const colunas=compacta?3:2,span=12/colunas,altura=compacta?190:320;
  for(let offset=0;offset<fotos.length;offset+=colunas){
    s.setRowHeight(linha,altura);s.setRowHeight(linha+1,36);
    fotos.slice(offset,offset+colunas).forEach(function(f,i){const col=2+i*span;pgBloco_(s,linha,col,span,'',{fill:'#FFFFFF'});pgContorno_(s,linha,col,2,span);let titulo='Evidência '+(offset+i+1);
      try{const leitura=cptfLer_(f.url,false);cptfInserirNaArea_(s,leitura.blob,linha,col,1,span,titulo,f.url);titulo=(leitura.tipoMidia==='Vídeo'?'Prévia de vídeo ':leitura.tipoMidia==='Foto'?'Foto ':'Prévia de arquivo ')+(offset+i+1);}
      catch(e){pgBloco_(s,linha,col,span,'Prévia indisponível nesta atualização.',{size:10,color:'#8A560C',fill:'#FFF5E9'});s.getRange(linha,col).setNote(e.message);avisos.push(f.id);console.warn('Mídia do painel: '+f.id+' | '+e.message);}
      pgLinkCelula_(s,linha+1,col,span,titulo+' · original',f.url,'#E6F3F3');
    });linha+=3;
  }return linha;
}

function pgAplicarProtecoes_(ss){
  const me=Session.getEffectiveUser(),email=me.getEmail();
  PG.ABAS.forEach(function(n){
    const s=ss.getSheetByName(n),desc='Painel de gestão: dados automáticos';let p=s.getProtections(SpreadsheetApp.ProtectionType.SHEET).find(function(x){return x.getDescription()===desc;});
    if(!p)p=s.protect().setDescription(desc);
    p.addEditor(me);const outros=p.getEditors().filter(function(u){return u.getEmail()!==email;});if(outros.length)p.removeEditors(outros);if(p.canDomainEdit())p.setDomainEdit(false);
    p.setWarningOnly(false);p.setUnprotectedRanges(n==='Início'?[s.getRange('B26:M45')]:[]);
  });
}

/** Pedidos da gestão são atendidos pelo gatilho da conta instaladora. */
function pgPedirAtualizacao_(fotos){
  PropertiesService.getScriptProperties().setProperty('PG_PEDIDO',JSON.stringify({fotos:Boolean(fotos),quando:Date.now()}));
  return {mensagem:'Atualização solicitada. O painel será atualizado pela automação, normalmente no próximo minuto.'};
}
function atualizarPainelGestao(){const r=pgPedirAtualizacao_(false);pgDestino_().toast(r.mensagem,'GESTÃO',7);return r;}
function recarregarFotosPainelGestao(){const r=pgPedirAtualizacao_(true);pgDestino_().toast(r.mensagem,'GESTÃO',7);return r;}
function pgAtualizarAutomaticamente(){
  const p=PropertiesService.getScriptProperties(),req=p.getProperty('PG_PEDIDO');
  if(!req&&Date.now()-Number(p.getProperty('PG_ULTIMA')||0)<15*60000)return;
  return pgExecutarAtualizacao_(Boolean(req&&JSON.parse(req).fotos));
}
function abrirConfiguracaoPainelGestao(){
  const cfg=pgConfig_();const dados=JSON.stringify(cfg).replace(/</g,'\\u003c');
  const html='<html><head><base target="_top"><style>body{font:14px Arial;color:#20364A;margin:26px}h2{font-size:20px}label{display:block;font-weight:bold;margin:18px 0 7px}input,select{box-sizing:border-box;width:100%;padding:10px;border:1px solid #bdcbd5;border-radius:6px}p{line-height:1.5;color:#647487}button{margin-top:22px;padding:12px 18px;background:#164c70;color:white;border:0;border-radius:6px;cursor:pointer}#msg{white-space:pre-wrap}</style></head><body><h2>Período e referência de pesquisas</h2><p>A mudança altera somente este painel de gestão.</p><label>Mês da análise</label><input id="mes" type="month"><p>Deixe vazio para acompanhar sempre o mês atual. Os relatos mostram sempre os dias mais recentes.</p><label>Meses anteriores para comparação</label><select id="meses"><option value="1">1 mês</option><option value="2">2 meses</option><option value="3">3 meses</option></select><label>Meta de pesquisas definida pela gestão</label><input id="meta" type="number" min="0" step="1" placeholder="Em branco: usar a média histórica"><p>Esta é uma referência de quantidade. As notas e respostas dos moradores continuam sendo apresentadas como foram registradas.</p><button id="salvar">Salvar e atualizar</button><p id="msg" role="status"></p><script>const cfg='+dados+';document.getElementById("mes").value=cfg.mes||"";document.getElementById("meses").value=cfg.meses;document.getElementById("meta").value=cfg.metaPesquisa===null?"":cfg.metaPesquisa;document.getElementById("salvar").onclick=function(){const b=this;b.disabled=true;document.getElementById("msg").textContent="Salvando...";google.script.run.withSuccessHandler(function(r){document.getElementById("msg").textContent=r.mensagem;b.disabled=false;}).withFailureHandler(function(e){document.getElementById("msg").textContent=e.message;b.disabled=false;}).salvarConfiguracaoPainelGestao({mes:document.getElementById("mes").value,meses:Number(document.getElementById("meses").value),metaPesquisa:document.getElementById("meta").value});};</script></body></html>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(520).setHeight(660),'GESTÃO | Período e meta');
}
function salvarConfiguracaoPainelGestao(p){
  const mes=pgTexto_(p.mes),meses=Number(p.meses),meta=pgTexto_(p.metaPesquisa)===''?null:pgNumero_(p.metaPesquisa);
  if(mes&&(!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)||mes>pgDia_(new Date()).slice(0,7)))throw new Error('Escolha um mês válido, até o mês atual.');
  if(!Number.isInteger(meses)||meses<1||meses>3)throw new Error('Escolha de 1 a 3 meses anteriores.');
  if(pgTexto_(p.metaPesquisa)!==''&&(meta===null||!Number.isInteger(meta)||meta<0))throw new Error('A meta deve ser inteira, maior ou igual a zero.');
  PropertiesService.getScriptProperties().setProperty('PG_CONFIG',JSON.stringify({mes:mes,meses:meses,metaPesquisa:meta}));return pgPedirAtualizacao_(false);
}
function abrirConferenciaIndicadoresGestao(){
  const html='<html><head><base target="_blank"><style>body{font:14px Arial;color:#20364A;margin:24px}select,button{padding:10px;margin:8px 0}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:9px;border-bottom:1px solid #dce5eb}p{line-height:1.5}a{color:#164c70}</style></head><body><h2>Registros dos indicadores</h2><p>Confira os registros individuais que compõem a quantidade do período e dos meses de comparação.</p><select id="tipo"><option value="0">Pesquisas de satisfação</option><option value="1">Relatos de atividade</option><option value="2">Vistorias cautelares</option><option value="3">Diagnósticos de área</option><option value="4">Contatos e parcerias</option><option value="5">Oportunidades comerciais</option></select><button id="buscar">Conferir</button><p id="msg" role="status"></p><table><thead><tr><th>Data</th><th>Registro</th><th>Responsável</th><th>Origem</th></tr></thead><tbody id="rows"></tbody></table><script>document.getElementById("buscar").onclick=function(){const b=this;b.disabled=true;document.getElementById("msg").textContent="Consultando...";google.script.run.withSuccessHandler(function(r){document.getElementById("msg").textContent=r.mensagem;const rows=document.getElementById("rows");rows.replaceChildren();r.registros.forEach(function(x){const tr=document.createElement("tr");[x.data,x.id,x.responsavel].forEach(function(v){const td=document.createElement("td");td.textContent=v;tr.appendChild(td);});const td=document.createElement("td"),a=document.createElement("a");a.href=x.url;a.textContent="Abrir";a.target="_blank";a.rel="noopener";td.appendChild(a);tr.appendChild(td);rows.appendChild(tr);});b.disabled=false;}).withFailureHandler(function(e){document.getElementById("msg").textContent=e.message;b.disabled=false;}).consultarIndicadorGestao(Number(document.getElementById("tipo").value));};</script></body></html>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(820).setHeight(680),'GESTÃO | Conferência dos indicadores');
}
function consultarIndicadorGestao(indice){
  if(!Number.isInteger(indice)||indice<0||indice>5)throw new Error('Indicador inválido.');
  const m=pgMontarModelo_(pgLerFontes_(),pgConfig_(),new Date());
  const todos=[m.mes].concat(m.meses),nome=m.producao[indice].nome;
  const tipos=[function(r){return r.pesquisa;},function(r){return r.eRelato;},function(r){return /cautelar/.test(r.tipo);},function(r){return /diagnostico/.test(r.tipo);},function(r){return /matriz de contato/.test(r.tipo);},function(r){return /oportunidade.*comercializa/.test(r.tipo);}];
  const lista=m.registros.filter(function(r){return tipos[indice](r)&&todos.indexOf(r.dia.slice(0,7))>=0;}).sort(function(a,b){return b.dia.localeCompare(a.dia)||a.id.localeCompare(b.id);});
  return {mensagem:nome+'. Períodos consultados: '+todos.map(pgMesTexto_).join(', ')+'. '+lista.length+' registro(s). Meses usados na média: '+m.meses.filter(function(_,i){return m.producao[indice].historico[i]!==null;}).map(pgMesTexto_).join(', ')+'. Meses sem cobertura não entram na média.',registros:lista.map(function(r){return {data:pgDataTexto_(r.dia),id:r.id,responsavel:pgTexto_(r.responsavel)||'Não informado',url:r.url};})};
}

/** Fotos 1.2: valida bytes E pixels antes de inserir na grade. */
const CPTF_CACHE = {};
function cptfReferencia_(valor) {
  const url=String(valor||'').trim().replace(/[),.;]+$/,'');
  if(!/^https:\/\/(?:drive|docs)\.google\.com\//i.test(url))throw new Error('LINK: endereço de arquivo do Google Drive não reconhecido.');
  const m=url.match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{10,})/);
  if(!m)throw new Error('LINK: o endereço precisa identificar um arquivo, não uma pasta.');
  const key=url.match(/[?&]resourcekey=([^&#]+)/i);
  return {id:m[1],key:key?decodeURIComponent(key[1]):'',url:url};
}
function cptfArquivo_(ref) {
  let f;try{f=ref.key?DriveApp.getFileByIdAndResourceKey(ref.id,ref.key):DriveApp.getFileById(ref.id);}
  catch(e){throw new Error('ACESSO: a conta executora não conseguiu ler o arquivo. '+e.message);}
  const vistos={};
  for(let i=0;f.getMimeType()==='application/vnd.google-apps.shortcut';i++){
    if(i>=3||vistos[f.getId()])throw new Error('ATALHO: destino não resolvido.');
    vistos[f.getId()]=true;const id=f.getTargetId(),key=f.getTargetResourceKey();
    try{f=key?DriveApp.getFileByIdAndResourceKey(id,key):DriveApp.getFileById(id);}catch(e){throw new Error('ACESSO: destino do atalho indisponível. '+e.message);}
  }return f;
}
function cptfDimensoes_(bytes) {
  const n=bytes.length,u=function(i){return (bytes[i]||0)&255;};
  const be=function(i){return u(i)*256+u(i+1);},be32=function(i){return u(i)*16777216+u(i+1)*65536+u(i+2)*256+u(i+3);};
  if(n>=24&&u(0)===137&&u(1)===80&&u(2)===78&&u(3)===71&&u(12)===73&&u(13)===72&&u(14)===68&&u(15)===82)return {largura:be32(16),altura:be32(20),mime:'image/png'};
  if(n>=10&&u(0)===71&&u(1)===73&&u(2)===70)return {largura:u(6)+256*u(7),altura:u(8)+256*u(9),mime:'image/gif'};
  if(n>=4&&u(0)===255&&u(1)===216){
    let i=2;
    while(i+3<n){if(u(i)!==255){i++;continue;}while(i<n&&u(i)===255)i++;const marker=u(i++);
      if(marker===217||marker===218)break;if(marker===0||marker===1||(marker>=208&&marker<=215))continue;
      const len=be(i);if(len<2||i+len>n)break;
      if([192,193,194,195,197,198,199,201,202,203,205,206,207].indexOf(marker)>=0&&len>=7)return {altura:be(i+3),largura:be(i+5),mime:'image/jpeg'};
      i+=len;
    }
  }return null;
}
function cptfValidarBlob_(blob) {
  if(!blob)return {ok:false,motivo:'Miniatura não disponível.'};
  const bytes=blob.getBytes(),dim=cptfDimensoes_(bytes);
  if(bytes.length>2000000)return {ok:false,motivo:'TAMANHO: '+bytes.length+' bytes excedem 2 MB.'};
  if(!dim||!dim.largura||!dim.altura)return {ok:false,motivo:'FORMATO: cabeçalho JPEG, PNG ou GIF válido não localizado.'};
  if(dim.largura*dim.altura>1000000)return {ok:false,motivo:'PIXELS: '+dim.largura+' × '+dim.altura+' excedem 1 milhão de pixels.',dim:dim};
  // Normaliza somente o tipo do blob; nenhum byte ou arquivo original é alterado.
  if(blob.getContentType()!==dim.mime)blob.setContentType(dim.mime);
  return {ok:true,blob:blob,bytes:bytes.length,dim:dim};
}
function cptfMiniaturaMenor_(arquivo,ref,diagnosticos) {
  const id=arquivo.getId?arquivo.getId():ref.id,key=arquivo.getResourceKey?arquivo.getResourceKey():(id===ref.id?ref.key:'');
  const headers={Authorization:'Bearer '+ScriptApp.getOAuthToken()};if(key)headers['X-Goog-Drive-Resource-Keys']=id+'/'+key;
  const receber=function(url){const resp=UrlFetchApp.fetch(url,{headers:headers,muteHttpExceptions:true,followRedirects:true});if(resp.getResponseCode()!==200)throw new Error('HTTP '+resp.getResponseCode());const check=cptfValidarBlob_(resp.getBlob());if(!check.ok)throw new Error(check.motivo);return check;};
  // thumbnailLink é obtido com credenciais e nunca é enviado ao navegador.
  try{
    const endpoint='https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?fields=thumbnailLink&supportsAllDrives=true';
    const meta=UrlFetchApp.fetch(endpoint,{headers:headers,muteHttpExceptions:true});
    if(meta.getResponseCode()!==200)throw new Error('Metadados HTTP '+meta.getResponseCode());
    const link=JSON.parse(meta.getContentText()).thumbnailLink;
    if(!/^https:\/\/(?:[a-z0-9-]+\.)*googleusercontent\.com\//i.test(String(link||'')))throw new Error('Link de miniatura não disponível.');
    // O sufixo de tamanho pode variar no serviço. A resposta sempre é medida.
    const menor=link.replace(/=s\d+(?:-[A-Za-z0-9]+)*(?=$|[?&])/,'=s800');
    const result=receber(menor);result.metodo='Miniatura do Drive validada';return result;
  }catch(e){diagnosticos.push('Miniatura autenticada: '+e.message);}
  // Compatibilidade com projetos em que a consulta REST de metadados não está disponível.
  for(const largura of [800,480]){
    try{const url='https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w'+largura+(key?'&resourcekey='+encodeURIComponent(key):'');const result=receber(url);result.metodo='Miniatura reduzida e validada ('+largura+' px solicitados)';return result;}
    catch(e){diagnosticos.push('Prévia '+largura+': '+e.message);}
  }return null;
}
function cptfLer_(url,preferirMiniatura) {
  const ref=cptfReferencia_(url),cacheKey=ref.id+'|'+ref.key+'|'+Boolean(preferirMiniatura);
  if(CPTF_CACHE[cacheKey])return CPTF_CACHE[cacheKey];
  const f=cptfArquivo_(ref),mime=f.getMimeType(),size=f.getSize(),erros=[];let ok=null,metodo='';
  const avaliar=function(blob,nome){const r=cptfValidarBlob_(blob);if(r.ok){ok=r;metodo=nome;return true;}erros.push(nome+': '+r.motivo);return false;};
  const miniatura=function(){try{return avaliar(f.getThumbnail(),'Miniatura do Drive');}catch(e){erros.push('Miniatura: '+e.message);return false;}};
  if(preferirMiniatura)miniatura();
  if(!ok&&/^image\/(png|jpeg|jpg|gif)$/i.test(mime)&&size<=2000000){try{avaliar(f.getBlob(),'Imagem original');}catch(e){erros.push('Original: '+e.message);}}
  if(!ok&&!preferirMiniatura)miniatura();
  if(!ok){try{ok=cptfMiniaturaMenor_(f,ref,erros);if(ok)metodo=ok.metodo;}catch(e){erros.push('Miniatura reduzida: '+e.message);}}
  if(!ok)throw new Error('IMAGEM: nenhuma prévia compatível com 2 MB e 1 milhão de pixels. Original: '+mime+', '+size+' bytes. '+erros.join(' | '));
  const r={id:ref.id,url:ref.url,blob:ok.blob,metodo:metodo,mimeOriginal:mime,bytesOriginais:size,bytesImagem:ok.bytes,largura:ok.dim.largura,altura:ok.dim.altura,pixels:ok.dim.largura*ok.dim.altura,tipoMidia:/^video\//.test(mime)?'Vídeo':/^image\//.test(mime)?'Foto':'Arquivo'};
  CPTF_CACHE[cacheKey]=r;return r;
}
function cptfEncaixar_(largura,altura,areaLargura,areaAltura,margem) {
  if(!(largura>0&&altura>0&&areaLargura>0&&areaAltura>0))throw new Error('Dimensões inválidas para encaixe da imagem.');
  const pad=margem===undefined?12:margem,k=Math.min(1,(areaLargura-2*pad)/largura,(areaAltura-2*pad)/altura);
  const w=Math.max(1,Math.floor(largura*k)),h=Math.max(1,Math.floor(altura*k));
  return {largura:w,altura:h,x:Math.max(pad,Math.floor((areaLargura-w)/2)),y:Math.max(pad,Math.floor((areaAltura-h)/2))};
}
function cptfInserirNaArea_(s,blob,linha,coluna,linhas,colunas,titulo,descricao){
  let w=0,h=0,img=null;for(let c=coluna;c<coluna+colunas;c++)w+=s.getColumnWidth(c);for(let r=linha;r<linha+linhas;r++)h+=s.getRowHeight(r);
  try{
    img=s.insertImage(blob,coluna,linha);const fit=cptfEncaixar_(img.getWidth(),img.getHeight(),w,h,12);
    let col=coluna,row=linha,x=fit.x,y=fit.y;
    while(col<coluna+colunas-1&&x>=s.getColumnWidth(col)){x-=s.getColumnWidth(col);col++;}
    while(row<linha+linhas-1&&y>=s.getRowHeight(row)){y-=s.getRowHeight(row);row++;}
    img.setWidth(fit.largura).setHeight(fit.altura).setAnchorCell(s.getRange(row,col)).setAnchorCellXOffset(x).setAnchorCellYOffset(y).setAltTextTitle(titulo).setAltTextDescription(descricao||'');
    return fit;
  }catch(e){if(img){try{img.remove();}catch(ignore){}}throw e;}
}

function pgExtrairDiaRDAS_(valores,links,gid,nome) {
  const match=nome.match(/^RDAS (\d{2})-(\d{2})-(\d{4})$/);if(!match)return null;
  const dia=match[3]+'-'+match[2]+'-'+match[1],fichas=[];
  valores.forEach(function(r,i){if(/^FICHA \d+ DE \d+\s*\|/.test(pgTexto_(r[0])))fichas.push(i);});
  const relatos=fichas.map(function(inicio,pos){
    const fim=pos+1<fichas.length?fichas[pos+1]:valores.length,titulo=pgTexto_(valores[inicio][0]).split('|');
    const r={id:pgTexto_(titulo[1]),dia:dia,atividade:titulo.slice(2).join('|').trim(),equipe:'',local:'',bairro:'',relato:'',objetivo:'',fotos:[],url:pgLink_(PG.RDAS,gid,inicio+1),origem:'RDAS'};
    const fotos={};
    for(let i=inicio+1;i<fim;i++){
      const row=valores[i],label=pgNorm_(row[0]);
      if(label==='frente / endereco'){r.local=pgTexto_(row[2]);r.bairro=pgTexto_(row[10]);}
      if(label==='equipe responsavel')r.equipe=pgTexto_(row[2]);
      if(label==='relato da execucao'&&i+1<fim){const partes=[];for(let j=i+1;j<fim;j++){const t=pgTexto_(valores[j][0]);if(!t||['objetivo da atividade','observacoes da equipe','interrupcoes da atividade','evidencias da atividade','observacoes e resultados complementares','registro fotografico automatico'].indexOf(pgNorm_(t))>=0)break;partes.push(String(valores[j][0]));}r.relato=partes.join('');}
      if(label==='observacoes e resultados complementares'&&i+1<fim){const m=pgTexto_(valores[i+1][0]).match(/(?:^|\n)Motivo da interrupção:\s*([\s\S]*)$/);r.motivoInterrupcao=m?m[1]:'';}
      if(label==='objetivo da atividade'&&i+1<fim)r.objetivo=pgTexto_(valores[i+1][0]);
      if(label==='data'){r.horario=pgTexto_(row[6]);r.situacao=pgTexto_(row[10]);}
      (links[i]||[]).forEach(function(url){if(!url)return;try{const f=cptfReferencia_(url);if(!fotos[f.id]){fotos[f.id]=true;r.fotos.push({id:f.id,url:f.url});}}catch(e){/* Células com outros acessos não são fotos. */}});
    }
    return r;
  });
  return {dia:dia,relatos:relatos,url:pgLink_(PG.RDAS,gid),origem:'RDAS'};
}
function pgLerDiarioExecutivo_(){
  const ss=SpreadsheetApp.openById(PG.RDAS),hoje=pgDia_(new Date());
  const sheets=ss.getSheets().map(function(s){const m=s.getName().match(/^RDAS (\d{2})-(\d{2})-(\d{4})$/);return m?{s:s,dia:m[3]+'-'+m[2]+'-'+m[1]}:null;}).filter(function(x){return x&&x.dia<=hoje;}).sort(function(a,b){return b.dia.localeCompare(a.dia);}).slice(0,3);
  return sheets.map(function(item){
    const range=item.s.getDataRange(),v=range.getValues();let rich=[];
    try{rich=range.getRichTextValues();}catch(e){/* Links podem estar em texto simples. */}
    const links=v.map(function(row,i){const out=[];row.forEach(function(value,j){
      (pgTexto_(value).match(/https:\/\/(?:drive|docs)\.google\.com\/[^\s,;]+/g)||[]).forEach(function(u){out.push(u);});
      const r=rich[i]&&rich[i][j];if(r){const u=r.getLinkUrl();if(u)out.push(u);r.getRuns().forEach(function(run){const x=run.getLinkUrl();if(x)out.push(x);});}
    });return out;});
    return pgExtrairDiaRDAS_(v,links,item.s.getSheetId(),item.s.getName());
  }).filter(function(d){return d&&d.relatos.length;});
}
function pgNotasExecutivas_(){
  const rows=pgDestino_().getSheetByName(PG.ABAS[0]).getRange('B26:M45').getValues();
  const notas=rows.map(function(r,i){return {indice:i,referencia:pgTexto_(r[0]),texto:pgTexto_(r[2]),responsavel:pgTexto_(r[7]),prazo:pgDia_(r[9]),concluido:r[11]===true};});
  return {revisao:pgHash_(notas),itens:notas};
}
function pgEstruturaExecutiva_(m,dias,notas){
  const grupos={};m.abertos.forEach(function(c){const key=c.area||'Área não informada';grupos[key]=(grupos[key]||0)+1;});
  const equipe={};m.registros.filter(function(r){return r.dia.slice(0,7)===m.mes&&(r.eRelato||r.pesquisa);}).forEach(function(r){const nome=pgTexto_(r.responsavel)||'Responsável não informado';if(!equipe[nome])equipe[nome]={nome:nome,pesquisas:0,relatos:0};if(r.pesquisa)equipe[nome].pesquisas++;if(r.eRelato)equipe[nome].relatos++;});
  const v=m.producao[0],st=m.fontes.atendimentoAtualizado;
  return {mes:m.mes,mesTexto:pgMesTexto_(m.mes),hoje:m.hoje,atualizado:Utilities.formatDate(new Date(),PG.FUSO,'dd/MM/yyyy HH:mm'),
    atendimento:{abertos:m.abertos.length,vencidas:m.vencidas.length,pendentes:m.pendentes.length,concluidos:m.casos.filter(function(c){return c.encerrado&&c.conclusao.slice(0,7)===m.mes;}).length,areas:Object.keys(grupos).map(function(k){return {nome:k,valor:grupos[k]};}),tarefas:m.pendentes,casos:m.abertos,atualizado:st&&st[1] instanceof Date?Utilities.formatDate(st[1],PG.FUSO,'dd/MM/yyyy HH:mm'):''},
    parceiros:{quantidade:v.atual,media:v.media,referencia:v.referencia,distancia:v.faltam,manual:m.cfg.metaPesquisa!==null,historico:m.meses.map(function(mes,i){return {mes:mes,quantidade:v.historico[i]};}),notas:m.escuta.map(function(e){return {nome:e.nome,media:e.media,base:e.n,anterior:e.anterior,baseAnterior:e.nAnterior,notasBaixas:e.atencao.length};})},
    producao:m.producao.map(function(p){return {nome:p.nome,quantidade:p.atual,media:p.media};}),equipe:Object.keys(equipe).sort().map(function(n){return equipe[n];}),dias:dias,notasGestao:notas,
    territorios:pgTerritoriosGestao_(m),links:pgAcessosGestao_(m),avisos:m.avisos.map(function(a){return a.texto;})};
}
function obterDadosPainelExecutivo(p){
  const cfg=pgConfig_();if(p&&p.mes!==undefined)cfg.mes=pgTexto_(p.mes);
  const m=pgMontarModelo_(pgLerFontes_(),cfg,new Date());let dias=[];
  try{dias=pgLerDiarioExecutivo_();}catch(e){m.avisos.push({texto:'RDAS não disponível nesta consulta: '+e.message});}
  if(!dias.length){dias=m.dias.map(function(d){return {dia:d.dia,origem:'Procedimentos',url:pgLink_(PG.PROCEDIMENTOS,m.fontes.base.gid),relatos:d.relatos.map(function(r){return {id:r.id,dia:r.dia,atividade:pgTexto_(r.atividade),equipe:[r.responsavel,r.apoio].filter(Boolean).join(', '),local:pgTexto_(r.endereco||r.local),bairro:pgTexto_(r.bairro),motivoInterrupcao:pgTexto_(r.motivoInterrupcao),relato:pgTexto_(r.relato),objetivo:pgTexto_(r.objetivo),fotos:r.fotos,url:r.url,origem:'Procedimentos'};})};});}
  const allowed={};dias.forEach(function(d){d.relatos.forEach(function(r){r.fotos.forEach(function(f){allowed[f.id]=f.url;});});});
  pgTerritoriosGestao_(m).itens.forEach(function(r){r.fotos.forEach(function(f){allowed[f.id]=f.url;});});
  CacheService.getUserCache().put('PG_EXEC_FOTOS',JSON.stringify(allowed),1800);
  return pgEstruturaExecutiva_(m,dias,pgNotasExecutivas_());
}
function obterImagemPainelExecutivo(id){
  const raw=CacheService.getUserCache().get('PG_EXEC_FOTOS'),allowed=raw?JSON.parse(raw):{};
  if(!allowed[id])return {erro:'A consulta de imagens expirou. Uma nova consulta do painel restabelece o acesso.'};
  try{const r=cptfLer_(allowed[id],true);return {src:'data:'+r.blob.getContentType()+';base64,'+Utilities.base64Encode(r.blob.getBytes()),metodo:r.metodo,tipoMidia:r.tipoMidia};}
  catch(e){return {erro:e.message};}
}
function salvarNotaPainelExecutivo(p){
  if(!p||!Number.isInteger(p.indice)||p.indice<0||p.indice>=20)throw new Error('Registro da gestão inválido.');
  if(typeof p.concluido!=='boolean')throw new Error('Situação do registro inválida.');
  const prazoInformado=pgTexto_(p.prazo),prazo=pgDia_(prazoInformado);if(prazoInformado&&!prazo)throw new Error('A data informada não é válida.');
  ['referencia','texto','responsavel'].forEach(function(k){if(typeof p[k]!=='string'||p[k].length>5000)throw new Error('O campo '+k+' deve ter até 5.000 caracteres.');});
  const lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw new Error('Há outra atualização em andamento. A anotação pode ser registrada em instantes.');
  try{
    const atual=pgNotasExecutivas_();if(atual.revisao!==p.revisao)throw new Error('Outra anotação foi alterada desde sua consulta. Seu texto continua nesta janela; guarde-o antes de atualizar a visão e tentar novamente.');
    const s=pgDestino_().getSheetByName(PG.ABAS[0]),row=p.indice+26;
    s.getRange(row,2).setValue(pgLiteral_(p.referencia));s.getRange(row,4).setValue(pgLiteral_(p.texto));s.getRange(row,9).setValue(pgLiteral_(p.responsavel));s.getRange(row,11).setValue(pgData_(prazo));s.getRange(row,13).setValue(p.concluido);
    return pgNotasExecutivas_();
  }finally{lock.releaseLock();}
}
function abrirPainelExecutivoGestao(){pgAbrirVisaoGestao_('geral');}
function pgAbrirVisaoGestao_(pagina){
  const dados=obterDadosPainelExecutivo({});dados.paginaInicial=pagina||'geral';
  const bridge='<script>window.CPT_BRIDGE={tamanho:function(w,h){google.script.host.setWidth(w);google.script.host.setHeight(h);},dados:function(p){return new Promise(function(ok,fail){google.script.run.withSuccessHandler(ok).withFailureHandler(fail).obterDadosPainelExecutivo(p);});},foto:function(id){return new Promise(function(ok,fail){google.script.run.withSuccessHandler(ok).withFailureHandler(fail).obterImagemPainelExecutivo(id);});},nota:function(p){return new Promise(function(ok,fail){google.script.run.withSuccessHandler(ok).withFailureHandler(fail).salvarNotaPainelExecutivo(p);});}};</script>';
  const html='<html><head><base target="_blank"></head><body style="margin:0">'+bridge+PG_EXEC_HTML.replace('__CPT_DADOS__',function(){return JSON.stringify(dados).replace(/</g,'\\u003c');})+'</body></html>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(1280).setHeight(680),'CPT | Visão executiva');
}
function diagnosticarFotosPainelGestao(){
  const d=obterDadosPainelExecutivo({}),fotos=[];
  d.dias.forEach(function(dia){dia.relatos.forEach(function(r){r.fotos.forEach(function(f){if(!fotos.some(function(x){return x.id===f.id;}))fotos.push(f);});});});
  const resultados=fotos.slice(0,8).map(function(f){try{const r=cptfLer_(f.url,false);return {id:f.id,url:f.url,status:'LEITURA OK',metodo:r.metodo,tipoOriginal:r.mimeOriginal,bytesOriginais:r.bytesOriginais,bytesImagem:r.bytesImagem,largura:r.largura,altura:r.altura,pixels:r.pixels,tipoMidia:r.tipoMidia};}catch(e){return {id:f.id,url:f.url,status:'FALHA',motivo:e.message};}});
  const r={somenteLeitura:true,fotosLocalizadas:fotos.length,resultados:resultados,nota:'A inserção no Google deve ser conferida após uma atualização.'};Logger.log(JSON.stringify(r,null,2));return r;
}

function pgContorno_(s,linha,coluna,linhas,colunas,cor){
  s.getRange(linha,coluna,linhas,colunas).setBorder(true,true,true,true,false,false,cor||'#DCE5EC',SpreadsheetApp.BorderStyle.SOLID);
}

function pgCartaoNativo_(s,linha,coluna,largura,rotulo,valor,contexto,cor){
  const acento=cor||'#008AC4';
  pgBloco_(s,linha,coluna,largura,rotulo,{size:10,bold:true,fill:acento,color:'#FFFFFF'});
  pgBloco_(s,linha+1,coluna,largura,valor,{size:30,bold:true,fill:'#FFFFFF',color:'#073B56',format:'0',align:'center'});
  pgBloco_(s,linha+2,coluna,largura,contexto,{size:10,fill:'#FFFFFF',color:'#536B82'});
  pgContorno_(s,linha,coluna,3,largura);s.setRowHeight(linha,29);s.setRowHeight(linha+1,49);s.setRowHeight(linha+2,43);
}

function pgAcabamentoAnalise_(s){
  s.getRange('J49:M49').setHorizontalAlignment('center');
  for(let i=0;i<4;i++){const col=2+i*3,cor=i===3?'#8D4E32':i===0?'#008AC4':'#244D68';s.getRange(6,col,1,3).setBackground(cor).setFontColor('#FFFFFF').setFontSize(12);s.getRange(7,col,2,3).setBackground('#FFFFFF');s.getRange(7,col).setFontColor('#073B56');pgContorno_(s,6,col,3,3);}
  [14,23,35,49].forEach(function(r){s.getRange(r,2,1,12).setBackground('#244D68').setFontColor('#FFFFFF').setFontSize(12);});
  [[15,17],[24,29],[36,38]].forEach(function(intervalo){for(let r=intervalo[0];r<=intervalo[1];r++){s.getRange(r,2,1,12).setBackground(r%2?'#F3F7FA':'#FFFFFF').setBorder(null,null,true,null,null,null,'#DCE5EC',SpreadsheetApp.BorderStyle.SOLID);}});
  s.getRange('H24:H29').setBackground('#E6F3F3').setFontWeight('bold');
  pgContorno_(s,14,2,4,12);pgContorno_(s,23,2,7,12);pgContorno_(s,35,2,4,12);
  s.setRowHeight(8,46);s.setRowHeight(11,38);s.setRowHeight(31,48);
}

function formatarAbasNativasPainelGestao(){
  const ativo=SpreadsheetApp.getActiveSpreadsheet();if(!ativo||ativo.getId()!==PG.DESTINO)throw new Error('Execute esta função no Apps Script do Painel de Gestão.');
  const r=pgExecutarAtualizacao_(true);if(r.ocupado)throw new Error('Uma atualização está em andamento. Tente novamente após a conclusão.');ativo.toast('Visual nativo atualizado. Observações da gestão preservadas.','GESTÃO',8);return r;
}

/** Integração de consulta: nenhuma escrita nas planilhas de origem. */
function pgComplementosTerritoriais_(ss){
  const out={documentos:[],avisos:[]};
  try{
    const t=pgTabela_(ss,'CPT Documentos Territoriais',['Diagnóstico ID','Estado','Data','Documento','PDF','Apresentação'],true);
    if(t)t.linhas.forEach(function(l){
      const get=function(n){return pgCampo_(t,l,n);};
      if(pgNorm_(get('Estado'))!=='concluido')return;
      const safe=function(v){v=pgTexto_(v);return /^https:\/\/(docs|drive)\.google\.com\//.test(v)?v:'';};
      out.documentos.push({id:pgTexto_(get('Diagnóstico ID')),data:pgDia_(get('Data')),ordem:get('Data') instanceof Date?get('Data').getTime():l.linha,documento:safe(get('Documento')),pdf:safe(get('PDF')),slides:safe(get('Apresentação'))});
    });
  }catch(e){out.avisos.push('O histórico de documentos territoriais não pôde ser lido: '+e.message);}
  return out;
}
function pgTerritoriosGestao_(m){
  const extra=m.fontes.territorial||{documentos:[],avisos:[]};
  const itens=m.registros.filter(function(r){return /diagnostico/.test(r.tipo);}).map(function(r){
    const docs=extra.documentos.filter(function(x){return x.id===r.id;}).sort(function(a,b){return b.ordem-a.ordem;})[0]||null;
    const bairro=pgTexto_(r.bairro);
    return {id:r.id,dia:r.dia,bairro:bairro||'Bairro não informado',local:pgTexto_(r.local),responsavel:pgTexto_(r.responsavel),texto:pgTexto_(r.diagnosticoTexto),fotos:pgFotos_(r.diagnosticoFotos),url:r.url,documentos:docs,
      pesquisas:bairro?m.pesquisas.filter(function(p){return pgNorm_(p.bairro)===pgNorm_(bairro);}).length:null};
  }).sort(function(a,b){return b.dia.localeCompare(a.dia)||a.id.localeCompare(b.id);});
  return {itens:itens,avisos:extra.avisos,mes:m.mes,url:pgLink_(PG.PROCEDIMENTOS,m.fontes.abasP['Diagnósticos de Área']),pasta:'https://drive.google.com/drive/folders/1ZRxzA46y-G1g3fXzAG2jpBKSJAyQWt67'};
}
function pgAcessosGestao_(m){return [
  {nome:'Controle de Atendimentos',descricao:'Atendimento ao morador, revisão da ficha final e pacote Sabesp',url:pgLink_(PG.ATENDIMENTOS,m.fontes.abasA.Dashboard)},
  {nome:'Execução de Atendimentos',descricao:'Comunicação entre setores, abertura e retorno da execução',url:'https://docs.google.com/spreadsheets/d/1Y5zioMOTaJDtp78OPBovXeHhvuns_ZEG6SMyHqng-Uk/edit?gid=321623213#gid=321623213'},
  {nome:'Procedimentos de Campo',descricao:'Registros originais e base consolidada da operação',url:pgLink_(PG.PROCEDIMENTOS,m.fontes.base.gid)},
  {nome:'RDAS',descricao:'Relatos diários, fotos e galeria para o relatório',url:pgLink_(PG.RDAS)},
  {nome:'Anexos do relatório',descricao:'Entregas mensais no padrão Sabesp',url:pgLink_(PG.ANEXOS)},
  {nome:'Programa Parceiros',descricao:'Resultados registrados e referência de volume',url:pgLink_(PG.PROCEDIMENTOS,m.fontes.abasP['Programa Parceiros'])},
  {nome:'Pesquisa de Satisfação',descricao:'Notas, percepção e comentários dos moradores',url:pgLink_(PG.PROCEDIMENTOS,m.fontes.abasP['Pesquisa de Satisfação'])},
  {nome:'Diagnósticos de Área',descricao:'Em Procedimentos: menu TERRITÓRIOS → Visão territorial',url:pgLink_(PG.PROCEDIMENTOS,m.fontes.abasP['Diagnósticos de Área'])},
  {nome:'Documentos dos diagnósticos',descricao:'Fichas e apresentações já produzidas',url:'https://drive.google.com/drive/folders/1ZRxzA46y-G1g3fXzAG2jpBKSJAyQWt67'},
  {nome:'Vistorias Cautelares',descricao:'Condições registradas e evidências das vistorias',url:pgLink_(PG.PROCEDIMENTOS,m.fontes.abasP['Vistorias Cautelares'])},
  {nome:'Central de Atendimento · WhatsApp',descricao:'(11) 93232-4659 · abre a conversa, sem envio automático',url:'https://wa.me/5511932324659'}
];}
function pgTerritoriosNativos_(s,m){
  const t=pgTerritoriosGestao_(m);
  pgSecao_(s,47,'TERRITÓRIOS | Diagnósticos e documentos');
  pgBloco_(s,48,2,12,t.itens.length+' diagnósticos na base válida · '+t.itens.filter(function(x){return x.dia.slice(0,7)===m.mes;}).length+' em '+pgMesTexto_(m.mes)+' · consulta completa na janela: Diagnósticos',{size:12});s.setRowHeight(48,42);
  pgLinkCelula_(s,49,2,6,'Abrir painel territorial em Procedimentos',t.url);
  pgLinkCelula_(s,49,8,6,'Documentos e apresentações',t.pasta);s.setRowHeight(49,40);
  t.itens.slice(0,3).forEach(function(x,i){const row=51+i*2;pgLinkCelula_(s,row,2,12,x.bairro+' · '+pgDataTexto_(x.dia)+' · '+x.id,x.url,'#FFFFFF');pgBloco_(s,row+1,2,12,(x.local||'Local não informado')+' · '+(x.responsavel||'Responsável não informado'),{size:12,fill:'#FFFFFF'});s.setRowHeight(row,36);s.setRowHeight(row+1,42);});
  pgSecao_(s,58,'GUIA DOS SISTEMAS | disponível também na janela');
  pgBloco_(s,59,2,12,'GESTÃO → Guia dos sistemas: onde consultar, onde registrar e como as entregas se conectam.',{size:12});s.setRowHeight(59,42);
  const links=pgAcessosGestao_(m);links.forEach(function(x,i){const row=61+Math.floor(i/2)*2,col=i%2?8:2;pgLinkCelula_(s,row,col,6,x.nome,x.url,'#FFFFFF');pgBloco_(s,row+1,col,6,x.descricao,{size:12,fill:'#FFFFFF'});s.setRowHeight(row,38);s.setRowHeight(row+1,54);});
}
function abrirGuiaSistemasGestao(){pgAbrirVisaoGestao_('tutorial');}
function abrirDiagnosticosGestao(){pgAbrirVisaoGestao_('territorios');}
/** Atualiza a versão existente sem criar ou remover gatilhos. */
function atualizarVersaoPainelGestao(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();if(!ss||ss.getId()!==PG.DESTINO)throw new Error('Execute no Apps Script do Painel de Gestão.');
  const r=pgExecutarAtualizacao_(false);if(r&&r.ocupado)throw new Error('Outra atualização está em andamento. Aguarde antes de tentar novamente.');
  ss.toast('Versão 2.2 aplicada. Reabra a planilha para atualizar o menu. Anotações preservadas.','GESTÃO',10);return r;
}


function pgNovasFotosDiagnostico_(linha,mapa){
  const ids={},urls=[];
  Object.keys(mapa).filter(k=>/^fotos? do diagnostico(?:$|\s*-)/.test(k)).forEach(k=>{
    (String(linha[mapa[k]]||'').match(/https:\/\/(?:drive|docs)\.google\.com\/[^\s,;]+/g)||[]).forEach(u=>{
      const m=u.match(/(?:[?&]id=|\/d\/)([\w-]+)/);if(m&&!ids[m[1]]){ids[m[1]]=true;urls.push(u.replace(/[)\]]+$/,''));}
    });
  });return urls;
}

const PG_EXEC_HTML = "<div id=\"cpt-executivo\">\n  <style>\n    #cpt-executivo{font:14px Arial,sans-serif;color:#172B43;background:#F1F5F9;min-height:0;box-sizing:border-box;color-scheme:light}\n    #cpt-executivo *{box-sizing:border-box}#cpt-executivo button,#cpt-executivo input,#cpt-executivo select,#cpt-executivo textarea{font:inherit}\n    #cpt-executivo .cpt-shell{display:grid;grid-template-columns:190px minmax(0,1fr);min-height:0}\n    #cpt-executivo .cpt-side{background:#073B56;color:#ECF4FC;padding:28px 16px;display:flex;flex-direction:column;gap:24px}\n    #cpt-executivo .cpt-brand{font-size:30px;letter-spacing:3px;font-weight:700;color:#28B9EF}#cpt-executivo .cpt-brand small{display:block;font-size:12px;font-weight:400;letter-spacing:0;color:#B2C7D8;margin-top:7px;line-height:1.5}\n    #cpt-executivo .cpt-side nav{display:grid;gap:8px}#cpt-executivo .cpt-nav{background:transparent;border:0;color:#C9D9E6;text-align:left;border-radius:7px;min-height:43px;padding:11px 12px;cursor:pointer;line-height:1.35}\n    #cpt-executivo .cpt-nav[aria-selected=true]{color:#FFFFFF;background:#264357;box-shadow:inset 3px 0 #28B9EF}\n    #cpt-executivo .cpt-side-footer{font-size:11px;line-height:1.65;color:#AFC4D6;margin-top:auto}\n    #cpt-executivo .cpt-main{padding:25px 26px;min-width:0}#cpt-executivo .cpt-top{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;flex-wrap:wrap;margin-bottom:22px}\n    #cpt-executivo h1{font-size:25px;font-weight:700;margin:0 0 6px}#cpt-executivo h2{font-size:16px;margin:0 0 5px;font-weight:700}#cpt-executivo h3{font-size:14px;margin:0 0 5px}\n    #cpt-executivo .cpt-muted{color:#536B82;font-size:12px;line-height:1.5}#cpt-executivo .cpt-top-tools{display:flex;align-items:end;gap:10px;flex-wrap:wrap}\n    #cpt-executivo label{display:grid;gap:6px;font-size:12px;color:#52687D}#cpt-executivo input,#cpt-executivo select,#cpt-executivo textarea{min-height:37px;padding:8px 10px;border:1px solid #CBD7E2;border-radius:6px;background:#FFFFFF;color:#172B43;min-width:0}\n    #cpt-executivo .cpt-button{border:1px solid #C9D8E3;border-radius:6px;background:#FFFFFF;color:#17495F;min-height:37px;padding:9px 13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-size:12px}\n    #cpt-executivo .cpt-button-primary{background:#0B7F8D;color:#FFFFFF;border-color:#0B7F8D}#cpt-executivo button:disabled{opacity:.55;cursor:wait}\n    #cpt-executivo .cpt-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin-bottom:18px}\n    #cpt-executivo .cpt-kpi{background:#FFFFFF;border:1px solid #DFE7EF;border-radius:10px;padding:18px 19px;position:relative;min-width:0}\n    #cpt-executivo .cpt-kpi-label{color:#536B82;font-size:11px;font-weight:700;letter-spacing:.8px;margin-bottom:12px}\n    #cpt-executivo .cpt-kpi-number{font-size:34px;font-weight:700;line-height:1.05;font-variant-numeric:tabular-nums;display:inline-block;margin-right:8px}\n    #cpt-executivo .cpt-kpi-unit{font-size:13px;color:#526B81}#cpt-executivo .cpt-kpi-context{margin-top:11px;color:#536B82;font-size:12px;line-height:1.5}\n    #cpt-executivo .cpt-chip{display:inline-block;border-radius:5px;padding:4px 7px;font-size:11px;background:#E8F4F1;color:#286653;line-height:1.3}\n    #cpt-executivo .cpt-chip-attention{background:#FFF0DB;color:#8A560C}#cpt-executivo .cpt-chip-late{background:#F9E9EC;color:#993B4D}\n    #cpt-executivo .cpt-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:18px;margin-bottom:18px}\n    #cpt-executivo .cpt-panel{background:#FFFFFF;border:1px solid #DFE7EF;border-radius:10px;padding:19px;min-width:0}\n    #cpt-executivo .cpt-panel-head{display:flex;justify-content:space-between;align-items:start;gap:12px;margin-bottom:17px}\n    #cpt-executivo .cpt-panel-head a{color:#096E7F;text-decoration:none;font-size:12px;white-space:nowrap}\n    #cpt-executivo .cpt-record,#cpt-executivo td,#cpt-executivo .cpt-note{overflow-wrap:anywhere}\n    #cpt-executivo .cpt-daily-item{display:grid;grid-template-columns:62px minmax(0,1fr);gap:12px;padding:13px 0;border-top:1px solid #E8EEF3}\n    #cpt-executivo .cpt-daily-item:first-of-type{border-top:0}#cpt-executivo .cpt-daily-title{font-weight:700;font-size:13px;line-height:1.4;margin-bottom:4px}\n    #cpt-executivo .cpt-plain-action{background:transparent;color:#096E7F;border:0;padding:5px 0;text-align:left;font-size:12px;cursor:pointer}\n    #cpt-executivo .cpt-mini-photo{height:61px;width:62px;overflow:hidden;border-radius:6px;display:block}\n    #cpt-executivo .cpt-photo{background:#EDF2F6;border:0;border-radius:7px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-width:0;color:#526A80;cursor:pointer;padding:0;overflow:hidden;position:relative}\n    #cpt-executivo .cpt-photo img{width:100%;height:100%;object-fit:cover;display:block}#cpt-executivo .cpt-photo small{font-size:11px;line-height:1.25;padding:5px}\n    #cpt-executivo .cpt-photo-symbol{font-size:20px;line-height:1;color:#778FA3}\n    #cpt-executivo .cpt-trend{height:172px;display:flex;align-items:end;gap:14px;padding-top:25px;margin:0 4px 10px;position:relative}\n    #cpt-executivo .cpt-trend-column{height:100%;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:end;min-width:0;position:relative}\n    #cpt-executivo .cpt-trend-bar{width:72%;background:#A6C6D6;border-radius:4px 4px 0 0;min-height:0;position:relative}\n    #cpt-executivo .cpt-trend-number{position:absolute;top:-22px;left:0;width:100%;text-align:center;font-size:12px;color:#28435B;font-weight:700}\n    #cpt-executivo .cpt-trend-label{font-size:11px;margin-top:8px;color:#536B82;white-space:nowrap}\n    #cpt-executivo .cpt-insight{background:#EAF4F4;border-radius:7px;padding:12px;color:#225968;font-size:12px;line-height:1.55;margin-top:12px}\n    #cpt-executivo .cpt-bars{display:grid;gap:14px;margin-top:17px}#cpt-executivo .cpt-bar-title{display:flex;justify-content:space-between;gap:10px;font-size:12px;line-height:1.4;margin-bottom:6px}\n    #cpt-executivo .cpt-track{height:8px;background:#EAF0F5;border-radius:4px;overflow:hidden}#cpt-executivo .cpt-fill{height:100%;background:#158A98;border-radius:4px}\n    #cpt-executivo .cpt-controls{display:flex;gap:12px;flex-wrap:wrap;margin:0 0 17px}#cpt-executivo .cpt-controls>*{flex:1;min-width:150px}\n    #cpt-executivo .cpt-table-wrap{overflow:auto}#cpt-executivo table{width:100%;border-collapse:collapse;text-align:left;font-size:12px}#cpt-executivo th{font-weight:700;color:#536B82;padding:11px 9px;border-bottom:1px solid #CFDDE7}#cpt-executivo td{padding:13px 9px;border-bottom:1px solid #E7EDF3;vertical-align:top;line-height:1.45}#cpt-executivo td a{color:#096E7F;text-decoration:none;font-weight:700}\n    #cpt-executivo .cpt-feed{display:grid;gap:18px}#cpt-executivo .cpt-record{background:#FFFFFF;border:1px solid #DFE7EF;border-radius:10px;padding:21px}\n    #cpt-executivo .cpt-record-title{font-size:17px;font-weight:700;line-height:1.45;margin:8px 0 11px}#cpt-executivo .cpt-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:15px;color:#536B82;font-size:12px;line-height:1.5}\n    #cpt-executivo .cpt-narrative{font-size:14px;line-height:1.65;white-space:pre-wrap;margin:12px 0 16px;color:#263F56}\n    #cpt-executivo .cpt-gallery{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:15px 0}#cpt-executivo .cpt-gallery .cpt-photo{height:120px}\n    #cpt-executivo .cpt-photo-caption{font-size:11px;color:#536B82;margin-top:5px}#cpt-executivo .cpt-link{color:#096E7F;font-size:12px;text-decoration:none}\n    #cpt-executivo .cpt-note-form{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-top:14px}#cpt-executivo .cpt-note-form .cpt-span{grid-column:1/-1}#cpt-executivo textarea{min-height:95px;resize:vertical}\n    #cpt-executivo .cpt-note-list{display:grid;gap:12px}#cpt-executivo .cpt-note{background:#F6F9FC;border-radius:7px;padding:15px;font-size:13px;line-height:1.6}\n    #cpt-executivo .cpt-access{display:grid;grid-template-columns:1fr 1fr;gap:12px}#cpt-executivo .cpt-access a{display:block;padding:18px;text-decoration:none;border:1px solid #DFE7EF;border-radius:8px;color:#172B43;background:#FFFFFF}\n    #cpt-executivo .cpt-status{font-size:12px;color:#526A80;line-height:1.5;margin:10px 0;min-height:18px}#cpt-executivo .cpt-foot{font-size:11px;color:#647B90;line-height:1.5;margin-top:18px}\n    #cpt-executivo dialog{border:0;border-radius:10px;padding:15px;background:#FFFFFF;max-width:90%;max-height:90%}#cpt-executivo dialog::backdrop{background:#073B56DD}#cpt-executivo dialog img{display:block;max-width:100%;max-height:650px;object-fit:contain;margin:10px auto}\n    @media(max-width:950px){#cpt-executivo .cpt-shell{grid-template-columns:155px minmax(0,1fr)}#cpt-executivo .cpt-main{padding:20px 18px}#cpt-executivo .cpt-side{padding:24px 12px}#cpt-executivo .cpt-grid{grid-template-columns:1fr}#cpt-executivo .cpt-kpi-number{font-size:29px}#cpt-executivo .cpt-kpi{padding:15px 12px}}\n    @media(max-width:640px){#cpt-executivo .cpt-shell{display:block}#cpt-executivo .cpt-side{padding:16px;gap:14px}#cpt-executivo .cpt-brand{font-size:23px}#cpt-executivo .cpt-brand small,#cpt-executivo .cpt-side-footer{display:none}#cpt-executivo .cpt-side nav{display:flex;flex-wrap:wrap;gap:5px}#cpt-executivo .cpt-nav{font-size:12px;min-height:40px;padding:8px}#cpt-executivo .cpt-kpis{grid-template-columns:1fr}#cpt-executivo .cpt-meta,#cpt-executivo .cpt-note-form,#cpt-executivo .cpt-access{grid-template-columns:1fr}#cpt-executivo .cpt-gallery{grid-template-columns:1fr 1fr}#cpt-executivo input,#cpt-executivo select,#cpt-executivo textarea{font-size:16px}#cpt-executivo .cpt-top-tools{width:100%}}\n\n    #cpt-executivo{font-size:16px;line-height:1.5;--texto:16px}\n    #cpt-executivo .cpt-side{border-top:5px solid #E30613;gap:18px;padding:22px 14px}\n    #cpt-executivo .cpt-shell{grid-template-columns:210px minmax(0,1fr)}\n    #cpt-executivo .cpt-main{padding:24px;min-width:0}\n    #cpt-executivo .cpt-muted,#cpt-executivo label,#cpt-executivo table,#cpt-executivo .cpt-button,#cpt-executivo .cpt-link,#cpt-executivo .cpt-narrative,#cpt-executivo .cpt-note,#cpt-executivo .cpt-daily-title,#cpt-executivo .cpt-meta,#cpt-executivo .cpt-insight,#cpt-executivo .cpt-bar-title,#cpt-executivo .cpt-kpi-context{font-size:var(--texto);line-height:1.55}\n    #cpt-executivo .cpt-kpi{text-align:center;border-top:4px solid #009FE3}\n    #cpt-executivo .cpt-kpi-label,#cpt-executivo .cpt-kpi-unit,#cpt-executivo .cpt-status,#cpt-executivo .cpt-foot{font-size:14px}\n    #cpt-executivo h2{font-size:21px}#cpt-executivo h3{font-size:18px}\n    #cpt-executivo button,#cpt-executivo input,#cpt-executivo select{min-height:44px}\n    #cpt-executivo :focus-visible{outline:3px solid #0076A8;outline-offset:3px}\n    #cpt-executivo .cpt-nav{font-size:16px;padding:9px 11px}\n    #cpt-executivo summary{font-weight:700;font-size:18px;cursor:pointer;padding:8px 0;color:#073B56}\n    #cpt-executivo .cpt-panel{margin-bottom:16px}\n    #cpt-executivo .cpt-top-tools{gap:8px}#cpt-executivo textarea{min-height:160px}\n    #cpt-executivo .cpt-side-footer{border-top:2px solid #E30613;padding-top:16px}\n    @media(max-width:1250px){#cpt-executivo .cpt-grid{grid-template-columns:1fr}#cpt-executivo .cpt-main{padding:18px}#cpt-executivo .cpt-shell{grid-template-columns:195px minmax(0,1fr)}}\n    @media(max-width:760px){#cpt-executivo .cpt-shell{display:block}#cpt-executivo .cpt-side nav{display:flex;flex-wrap:wrap}#cpt-executivo .cpt-side-footer{display:none}#cpt-executivo .cpt-kpis,#cpt-executivo .cpt-access{grid-template-columns:1fr}#cpt-executivo .cpt-gallery{grid-template-columns:1fr 1fr}}\n  </style>\n  <div class=\"cpt-shell\">\n    <aside class=\"cpt-side\"><div class=\"cpt-brand\">CPT<small>Gestão socioambiental<br>Performance Tamanduateí</small></div><nav aria-label=\"Visões do painel\" role=\"tablist\"></nav><div class=\"cpt-side-footer\">Atendimento · Parceiros · Relatos<br><br>Visão integrada<br>Pacote 16<br><img alt=\"Veolia\" style=\"margin-top:12px;background:white;padding:5px;width:120px;height:auto;border-radius:4px\" src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIkAAAAlCAYAAAB2+spcAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAtqSURBVHhe7Zp5bBXVF8e/M30trxst+1LZBQth0RJWi7JYFgE1uEYjgkoICKlGMOofbIqAv8SoEUVRolCQoEYFxBZQKC1rQBAQZRGktQhSofC6vb6+fn9/nDfemXlLy6MImvdJbt7M3HPvnTdz7rnnnDsaSSJChBDo9gsRItiJKEmEWtGu2XLj8QDFxVJycoCvvgL++APwesHkZGiDBwP33w+0bw80aQLExdl7iHCDUP9KQgJ79gDr1gHLlwNFRXKNBDRNyQCArgPx8cADDwBjxkiJibF0F+H6U79K4naDU6ZAy8kBzp4VZYiLA0aNEkVo3VoU5dIlYMsWYOVKkdM0IDER6NkTeP99oFs3e88RriesD2pqyOPHyfR0sRmaRjZtSk6bRhYXS30gKivJrCyyXTvS4ZC2bdqQGzcGbxPhH6d+lOTnn8khQ0hdl9K/P2vy8+v+oo8dIydOFEXRNLJ9e3LdOrtUhOvE1StJSQnZq5coB0D27EmePGmXqp1Ll8gXXjC8F7FEmzbZpSJcB65OSaqqyClT1Itt0YIsKrJL1R2vlxw3TqwJQPbpQxYU2KUi/MNcXZ4kNxf4+ms5jo0F5s4V5zRcdB146SXgppvk/NAh4NNPgepqu+SNx+XLwL59wDffAF9+CaxdK8/n99+Bmhq79L+K8KOb8nIgMxNYtkwewsCBwKpVQLt2dskrw+0GJk0CsrLkPDUV2LoVaN7cKnf8ODBnjuRhGjcGXnwR6NXLKmPm4EHgjTeAM2ckmpoxA8jIUPXl5cC77wK7d0v0FYj77gOmTrVeO38e+N//gO++k0itvBzwekXhY2Lk3tLSwFmzoKWmWtsePgwsXCh93H67PM+kJKuMnbVrgQ8+AKqqgOefB0aMsEsoVq+WCNLtBpo1A2bNAm65xS5VO3bTUmdOnyZbt5ZlQdfJZ58lq6vtUuHxySdkgwYqUlq1yi4hS91dd6mlrmNHsrzcLiVUVpKjR0tfmkZ26ULu3y91Hg+5YYMslUZfwcr06dZ+jxyRiM7wxzSNjIkh4+Lk/o3rAJmcTK5da31GeXlk27ZS36wZmZtr7t2fP/8kR4xQy/FHH9klFNu2kdHRanynk3zzzboHEybCX27y8yWDCgBOJ9CjBxAVZZcKj969gehoOSaBFSvsElKfmSkzFgBOngQ+/tguJZw4IaafvoTenXeqGZWbC0ybBpw7J+fR0UDnzkB6OjBkiLV06aL6rKwEZs4Etm8XS+p0AsOHy2x96y1gwQJg4kSgRQuRLykBJk8G8vJUH2bcbrEOofB4RI61GH+3G1i0SOTN17Kzgb/+MkvWDbvW1JlHH1Va2qiR5DbqC5eLTEr6u/+a2FiyrMwuJdakXz91H927kxcv2qXIp59Wsy8ujvz+e7leUUHec4+qa96cfPtt8tQp8tw58vx5ayktVX1mZZFRUWrs8eNFxjxTKyvJnByySROR0XWRu3xZ6s2WpGHD2qO5oiJy8GA1ZjBLsnWrGtNs0cz//QoI35Ls36+OdR1o0MBc609lpaToCwtlVoUiNlZZCABaRQVw9KhFBPDN+unTAYdDzk+fBjZutMqcPSuWiL7Z16ePWBJALGFOjqobN058jvbtxQdq2tRa4uNFjhSr5fXKeXQ0MG+eyBhbD4A8k/R04N575XpNDbB3r/hF1wqPR/yWkhIZ8+67gaFDpa68HFiyRP3fOhK+khQWqmOvV24gGGfOiKM4YACYlgY88gi4fbtdSlFa6h8RGEubnTvukHQ+AJSVARs2ABUVqn7FCjG1gDiSc+cqBdy8WdUBQL9+8j9crsDFeLglJcCxY6pdjx7BHfa4OCAtTS3FBQXAhQt2qfrj9GnZ8vB6ZeyRI4HZs9XyvX498NNP9lYhCV9JzC/C7ZabC4TXK97/e+8BhYXQfLvC2qxZEh4G4tQpNUsNzOOZadVKNgYdDlGsLVvUTD1/XoXogEQzgwap80OH1DEAvPKK1AcrRr/FxVb/oXNndRyIpk2VpS0ru7ZKsm2bRE2ApBJGjQIGDgSHDZNr5eUSUV0B4StJQoI6rqyUENPsKBkUFQE7d/pbhsOHgSNHrNcM9uzxd+IMU2/H4ZDZ0rKlnBcWAt9+K8d79kioDJ9zPWmSZRlDWZk6hk85Dx4MXgyr4/FYTbbTqY4DER2txiWt1qs+8XqBDz/8+z1w7FigTRtA16FNnaqsyebNgZfvIISvJB06qGMS2LUrsDVxufxfBnxListlvyrXN2/2V7i2ba3nZnr3Bvr3l2NSrNbFi5JfKS6WtblvX5Ez06iR9TwjA5gwIXhJTBS5uDirsl28qI4DUV6uEoKappTK7L/UB7m5MjF8aI0bA59/LqWgQHIl8N1vdrb/xA2G3ZOtM5MnKy8bkJj89dftUpJWN0cgRmnePHBElJ8v+zZm2eRkiWRCsWOHNV+xYAGZmirnDge5aJGk/c0sX24dZ9kyiUiCFYOKCrJTJ9Wubdvg+Qevl1y4UN1bw4bkzp1St2sX2aGDXI+PJ7Oz7a2thIpuPB5y2DDr/4mPJxMSpMTHq2hM08iMDIng6kD4lmTkSOts8niA+fPFLNNkilNSgO7d1blBhw7+a7nLpbKoZjIylKkMxoABgLHuksCrryqTmpgo2VLz/QIib1gHQLKm1dXiPwQqBk6n5E0MCgokqjL/bwPDotXUiOXo1EnN6MRE1W9FRXAfrS7s2KEiTk2T5dlsqTRNxtJ1uc/8fOCXX1R9KOxaU2fOnCFvvtmquQDZtatYA/Os3bFDYnSz3Pz5VpnCQvLxx1XOwijR0ZKprAs5OWRsrP89PfmkXVJwu8knnlCzvFEjyapu3EgePCifQJjL2bOq7Q8/iFUwxkhLkxxEWZlkVd1uyUq//LLKHjscZGamygyXlMgnFkYfPXpIdnnfPsnmGuMePSrywSyJ203OmKG+yWnZkly8mFy50lreeYdMSVHtH35Y/Z8QhK8kbjc5c6Y19QyfKevcmVy/Xsl6vWLuDdm0NPk0wODHH8nhw63JKaOkp0uSqi5cuCBm1Nw+ISH0zvTevZKEM+SjoiQR1aaNfAxlLrNnW9u+9pqk4eFLlLVoQfbuTY4cSQ4aJJPInBpPTZWPs8x89pl6ufAtESkp1nG7dhXZYEpy7Jh8ogHf83/qqcDJx+pqq5vgdJIHDtil/AhfSUhZWzt2tL4UozgcckMHDsiMqaqSfYeUFMlolpbK7+LFZOPG/u3hyxAuWRJ8vbdTUyOzxemUl+10ks89Z5fyZ/du8tZbycREealRUYFLZqa1XWkpOWcO2aqVKIuxN2T+D7ou/6NfP/LECWt7g6VLRRliY+W52cdNShK5oiJy6FC5lpgoCkaSK1ao+05JCf3B1pEj4g8a40yYUOvzDX8XGJD1e8EC8SMCecqaJrua6enil/z2m6zRffvKcV6e/AZjzBhg6VIV3tYBnjwJbfVqiShatgQeesh/BzkQFRWSqTxxInhOpn9/uSczpGRRN20Cfv1VwuhLl0Bdh9akCdCxI3DbbfKNrz2aMnP0qOR4zp3zj+xiYmRPyOUC1qyRMVJSgAcflBzMF1+IP6JpMtbYsaF9uLw85X8lJ0vWOkTG/OqUBL7wbvJk2ZIO1ZU93AslC0h8n5trDbVvdNxu0OWCVlWlQt2EhNAv7F/A1SsJfGnq8eMl9rbPgitF12X2ZWdLJBDhuhN+CGwmOVm2xydODGm2akXX5eOlrKyIgtxA1I8lMSgtlczrM8/I2h7ITwmEpolZnj0beOyxK/JBIlx76ldJDMrKZBNpzRpJjLlcsq9gHkrX5ZOAZs3EsZ03T7boI9xwXBslMfB4ZFdy1y75btTY2dV1ceq6dQNGjwYaNrS3jHADcW2VJMJ/gvpxXCP8p4koSYRaiShJhFqJKEmEWvk/aYB1DY6/EZUAAAAASUVORK5CYII=\"></div></aside>\n    <main class=\"cpt-main\"><header class=\"cpt-top\"><div><h1></h1><div class=\"cpt-muted\" data-subtitle></div></div><div class=\"cpt-top-tools\"><label>Tamanho da janela<select data-size aria-label=\"Tamanho da janela\"><option value=\"compacto\">Notebook compacto</option><option value=\"confortavel\">Confortável</option><option value=\"amplo\">Máximo disponível</option></select></label><label>Leitura<select data-font aria-label=\"Tamanho do texto\"><option value=\"normal\">Confortável</option><option value=\"grande\">Letras maiores</option></select></label><label>Mês dos indicadores<input data-month type=\"month\" aria-label=\"Mês dos indicadores\"></label><button class=\"cpt-button\" data-refresh type=\"button\">Atualizar visão</button></div></header><div class=\"cpt-status\" aria-live=\"polite\" data-status></div><section id=\"cpt-exec-view\" data-view role=\"tabpanel\"></section><footer class=\"cpt-foot\" data-foot></footer></main>\n  </div>\n  <dialog data-photo-dialog><button class=\"cpt-button\" type=\"button\" data-close-photo>Fechar imagem</button><img alt=\"\"><div class=\"cpt-photo-caption\"></div></dialog>\n  <script>\n  (function(){\n    const root=document.getElementById('cpt-executivo');let d=__CPT_DADOS__,active=d.paginaInicial||'geral';const api=window.CPT_BRIDGE||null,photos=new Map(),jobs=[];let running=0,diarioFiltro={dia:'',bairro:'',equipe:''};\n    const $=s=>root.querySelector(s),el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};\n    const fmt=n=>n===null||n===undefined?'Sem base':Number(n).toLocaleString('pt-BR',{maximumFractionDigits:1});\n    const date=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'Sem data';\n    const month=s=>s?['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][+s.slice(5,7)-1]+'/'+s.slice(0,4):'';\n    const norm=s=>String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();\n    const views=[['geral','Visão geral'],['atendimento','Atendimento'],['parceiros','Programa Parceiros'],['execucoes','Relatos'],['diario','Memória diária'],['territorios','Diagnósticos'],['tutorial','Guia dos sistemas'],['notas','Espaço da gestão'],['acessos','Acessos']];\n    function button(text,fn,primary){const b=el('button','cpt-button'+(primary?' cpt-button-primary':''),text);b.type='button';b.onclick=fn;return b;}\n    function link(text,url){const a=el('a','cpt-link',text);a.href=url;a.target='_blank';a.rel='noopener';return a;}\n    function panel(title,sub){const p=el('section','cpt-panel'),head=el('div','cpt-panel-head'),t=el('div');t.append(el('h2','',title));if(sub)t.append(el('div','cpt-muted',sub));head.append(t);p.append(head);return p;}\n    function kpis(items){const g=el('div','cpt-kpis');items.forEach(x=>{const p=el('section','cpt-kpi');p.append(el('div','cpt-kpi-label',x[0]));const v=el('div');v.append(el('span','cpt-kpi-number',fmt(x[1])),el('span','cpt-kpi-unit',x[2]));p.append(v,el('div','cpt-kpi-context',x[3]));g.append(p);});return g;}\n    function insight(){const p=d.parceiros;if(p.referencia===null)return 'Histórico disponível ainda insuficiente para uma referência de volume.';const base=p.manual?'referência definida pela gestão':'média dos meses anteriores encerrados';return fmt(p.quantidade)+' pesquisas em '+month(d.mes)+'. A '+base+' é '+fmt(p.referencia)+'. '+(p.distancia>0?fmt(p.distancia)+' pesquisas adicionais correspondem à diferença de volume.':'O volume registrado alcançou essa referência.');}\n    function bars(items,max){const g=el('div','cpt-bars'),ceiling=max||Math.max(1,...items.map(x=>x.valor||0));items.forEach(x=>{const row=el('div'),head=el('div','cpt-bar-title');head.append(el('span','',x.nome),el('strong','',fmt(x.valor)+(x.unidade||'')));const track=el('div','cpt-track'),fill=el('div','cpt-fill');fill.style.width=Math.max(0,Math.min(100,(x.valor||0)/ceiling*100))+'%';track.append(fill);row.append(head,track);if(x.contexto)row.append(el('div','cpt-muted',x.contexto));g.append(row);});g.setAttribute('role','img');g.setAttribute('aria-label',items.map(x=>x.nome+': '+fmt(x.valor)+(x.unidade||'')).join('; '));return g;}\n    function trend(){const p=panel('Volume de pesquisas','Quantidade registrada por mês'),items=d.parceiros.historico.concat([{mes:d.mes,quantidade:d.parceiros.quantidade,atual:true}]),g=el('div','cpt-trend'),max=Math.max(1,...items.map(x=>x.quantidade||0));items.forEach(x=>{const c=el('div','cpt-trend-column'),bar=el('div','cpt-trend-bar');bar.style.height=x.quantidade===null?'0':Math.max(0,x.quantidade/max*115)+'px';if(x.atual)bar.style.background='#0B8F9C';bar.append(el('span','cpt-trend-number',x.quantidade===null?'—':fmt(x.quantidade)));c.append(bar,el('span','cpt-trend-label',month(x.mes)));g.append(c);});g.setAttribute('role','img');g.setAttribute('aria-label',items.map(x=>month(x.mes)+': '+fmt(x.quantidade)+' pesquisas').join('; '));p.append(g,el('div','cpt-muted',d.mes===d.hoje.slice(0,7)?month(d.mes)+' está em andamento.':'Mês selecionado encerrado.'),el('div','cpt-insight',insight()));return p;}\n    async function pump(){while(running<3&&jobs.length){const job=jobs.shift();running++;try{job.ok((await api.foto(job.id))||{erro:'Imagem não disponível nesta consulta.'});}catch(e){job.ok({erro:e.message});}finally{running--;pump();}}}\n    function imageData(id){if(!api)return Promise.resolve({erro:'Prévia baseada nos arquivos enviados. A imagem privada depende da validação no Google.'});if(!photos.has(id))photos.set(id,new Promise(ok=>{jobs.push({id,ok});pump();}));return photos.get(id);}\n    function photo(f,r,small){const b=el('button','cpt-photo'+(small?' cpt-mini-photo':''));b.type='button';b.setAttribute('aria-label','Foto de '+r.atividade);b.append(el('span','cpt-photo-symbol','▧'),el('small','',api?'Imagem em consulta':'Foto vinculada'));\n      imageData(f.id).then(x=>{if(x.src&&/^data:image\\/(png|jpeg|jpg|gif);base64,/.test(x.src)){b.replaceChildren();const img=el('img');img.src=x.src;img.alt=r.atividade+' | '+date(r.dia);b.append(img);b.onclick=()=>{const dialog=$('[data-photo-dialog]');dialog.querySelector('img').src=x.src;dialog.querySelector('img').alt=img.alt;dialog.querySelector('.cpt-photo-caption').replaceChildren(el('div','',(x.tipoMidia==='Vídeo'?'Prévia de vídeo · ':'')+date(r.dia)+' · '+r.local),link('Original no Drive',f.url));dialog.showModal();};}else{b.replaceChildren(el('span','cpt-photo-symbol','▧'),el('small','',small?'Foto':'Prévia indisponível'));b.onclick=()=>{const msg=el('div','cpt-insight',x.erro||'Imagem não disponível nesta consulta.');msg.append(el('br'),link('Arquivo original',f.url));b.parentElement.append(msg);};}});return b;}\n    function latest(){const day=d.dias[0],p=panel('Resumo executivo diário',day?date(day.dia)+' · '+day.relatos.length+' atividades registradas no '+day.origem:'Sem relatos disponíveis');if(!day)return p;day.relatos.slice(0,3).forEach(r=>{const row=el('div','cpt-daily-item');if(r.fotos.length)row.append(photo(r.fotos[0],r,true));else row.append(el('div','cpt-photo cpt-mini-photo','Sem foto'));const t=el('div');t.append(el('div','cpt-daily-title',r.atividade),el('div','cpt-muted',r.equipe),el('div','cpt-muted',r.local));if(r.relato)t.append(el('div','cpt-muted',r.relato.length>145?r.relato.slice(0,145)+'…':r.relato));const b=el('button','cpt-plain-action','Relato e evidências');b.type='button';b.onclick=()=>{diarioFiltro={dia:r.dia,bairro:'',equipe:''};select('diario');};t.append(b);row.append(t);p.append(row);});return p;}\n    function home(v){const last=d.dias[0];v.append(kpis([['ATENDIMENTO',d.atendimento.abertos,'em aberto',d.atendimento.vencidas+' tarefas com prazo excedido · carteira atual'],['PROGRAMA PARCEIROS',d.parceiros.quantidade,'pesquisas',month(d.mes)+' · referência de volume: '+fmt(d.parceiros.referencia)],['RELATOS',last?last.relatos.length:null,'atividades',last?date(last.dia)+' · '+last.relatos.reduce((n,r)=>n+r.fotos.length,0)+' mídias vinculadas':'Diário recente']]));const grid=el('div','cpt-grid');grid.append(latest(),trend());v.append(grid);const g=el('div','cpt-grid'),a=panel('Atendimento por próxima área','Carteira atual · '+d.atendimento.abertos+' protocolos');a.append(bars(d.atendimento.areas));const e=panel('Presença registrada em campo','Atividades nos três dias recentes do RDAS');e.append(bars(d.dias.map(day=>({nome:date(day.dia),valor:day.relatos.length}))));g.append(a,e);v.append(g);}\n    function table(headers,rows){const wrap=el('div','cpt-table-wrap'),t=el('table'),thead=el('thead'),tr=el('tr');headers.forEach(h=>{const th=el('th','',h);if(['Pesquisas','Relatos'].includes(h))th.style.textAlign='center';tr.append(th);});thead.append(tr);const tb=el('tbody');rows.forEach(row=>{const tr=el('tr');row.forEach(x=>{const td=el('td');if(typeof x==='number'||typeof x==='string'&&/^\\d+(?:[.,]\\d+)?$/.test(x))td.style.textAlign='center';td.append(x instanceof Node?x:el('span','',x));tr.append(td);});tb.append(tr);});t.append(thead,tb);wrap.append(t);return wrap;}\n    function attendance(v){v.append(kpis([['CARTEIRA ATUAL',d.atendimento.abertos,'protocolos','Atendimentos em aberto'],['ACOMPANHAMENTOS',d.atendimento.pendentes,'tarefas','Uma ficha pode ter mais de uma tarefa'],['PRAZOS EXCEDIDOS',d.atendimento.vencidas,'tarefas','Prazos registrados no controle de origem']]));const p=panel('Demandas em acompanhamento','Situação atual da carteira, independente do mês dos indicadores'),filters=el('div','cpt-controls'),search=el('input');search.placeholder='Protocolo ou assunto';search.setAttribute('aria-label','Protocolo ou assunto');const choice=el('select');[['todos','Todos os prazos'],['vencido','Prazo excedido'],['hoje','Prazo de hoje']].forEach(x=>{const o=el('option','',x[1]);o.value=x[0];choice.append(o);});choice.setAttribute('aria-label','Recorte por prazo');filters.append(search,choice);const list=el('div');function render(){const items=d.atendimento.tarefas.filter(t=>(norm(t.id+' '+t.acao+' '+t.tipo).includes(norm(search.value)))&&(choice.value==='todos'||choice.value==='vencido'&&t.prazo&&t.prazo<d.hoje||choice.value==='hoje'&&t.prazo===d.hoje));list.replaceChildren(table(['Protocolo','Acompanhamento','Prazo','Situação'],items.map(t=>[link(t.id,t.url),t.acao||t.tipo,date(t.prazo),el('span','cpt-chip'+(t.prazo&&t.prazo<d.hoje?' cpt-chip-late':''),t.prazo&&t.prazo<d.hoje?'Prazo excedido':t.prazo===d.hoje?'Prazo de hoje':'Em acompanhamento')])));if(!items.length)list.append(el('p','cpt-muted','Nenhum registro neste recorte.'));}search.oninput=render;choice.onchange=render;render();p.append(filters,list);if(d.atendimento.listagemParcial)p.append(el('p','cpt-muted','A prévia contém as cinco demandas visíveis no arquivo enviado. A consulta ao Google apresenta a lista disponível na origem.'));v.append(p);}\n    function partners(v){v.append(kpis([['PESQUISAS EM '+month(d.mes).toUpperCase(),d.parceiros.quantidade,'registros','Respostas identificadas nos procedimentos'],['MÉDIA RECENTE',d.parceiros.media,'pesquisas/mês',d.parceiros.historico.filter(x=>x.quantidade!==null).map(x=>month(x.mes)).join(' · ')],['DISTÂNCIA DE VOLUME',d.parceiros.distancia,'pesquisas','Em relação a '+fmt(d.parceiros.referencia)+' no período']]));const grid=el('div','cpt-grid'),q=panel('Escuta da população','Notas registradas de 0 a 10');q.append(bars(d.parceiros.notas.map(n=>({nome:n.nome,valor:n.media,unidade:' / 10',contexto:n.base+' respostas válidas · mês anterior: '+fmt(n.anterior)+' / 10'+(n.baseAnterior===null?'':' ('+n.baseAnterior+' respostas)')})),10));q.append(el('p','cpt-muted','Em qualidade de vida, a média corresponde aos valores informados na pergunta sobre melhoria.'));grid.append(trend(),q);v.append(grid);const p=panel('Contexto para a leitura','Quantidade de pesquisas e percepção dos moradores são dimensões distintas');p.append(el('p','cpt-muted','A referência de quantidade apoia o planejamento da escuta. Os demais requisitos do Programa Parceiros permanecem no controle completo.'),link('Programa Parceiros',d.links.find(l=>l.nome==='Programa Parceiros').url));v.append(p);}\n    function executions(v){const grid=el('div','cpt-grid'),p=panel('Procedimentos consolidados','Quantidade de registros em '+month(d.mes)),a=panel('Autoria dos registros','Responsável pelo envio · '+month(d.mes));p.append(bars(d.producao.map(x=>({nome:x.nome,valor:x.quantidade}))));a.append(table(['Responsável','Relatos','Pesquisas'],d.equipe.map(e=>[e.nome,String(e.relatos),String(e.pesquisas)])));a.append(el('p','cpt-muted','A equipe de apoio aparece em cada relato. A autoria do envio não representa sozinha o trabalho individual.'));grid.append(p,a);v.append(grid,latest());}\n    function selector(label,values,value,changed){const l=el('label','',label),s=el('select');values.forEach(x=>{const o=el('option','',x[1]);o.value=x[0];s.append(o);});s.value=value;s.onchange=()=>changed(s.value);l.append(s);return l;}\n    function diary(v){const all=d.dias.flatMap(day=>day.relatos),neighborhoods=[...new Set(all.map(r=>r.bairro).filter(Boolean))].sort(),people=[...new Set(all.flatMap(r=>r.equipe.split(',').map(x=>x.trim())).filter(Boolean))].sort();const filters=el('div','cpt-controls');filters.append(selector('Dia da atividade',[['','Três dias recentes'],...d.dias.map(x=>[x.dia,date(x.dia)])],diarioFiltro.dia,x=>{diarioFiltro.dia=x;paint();}),selector('Bairro',[['','Todos os bairros'],...neighborhoods.map(x=>[x,x])],diarioFiltro.bairro,x=>{diarioFiltro.bairro=x;paint();}),selector('Equipe',[['','Todos os colaboradores'],...people.map(x=>[x,x])],diarioFiltro.equipe,x=>{diarioFiltro.equipe=x;paint();}));v.append(filters);const list=all.filter(r=>(!diarioFiltro.dia||r.dia===diarioFiltro.dia)&&(!diarioFiltro.bairro||r.bairro===diarioFiltro.bairro)&&(!diarioFiltro.equipe||r.equipe.split(',').map(x=>x.trim()).includes(diarioFiltro.equipe)));v.append(el('p','cpt-muted',list.length+' relatos neste recorte · texto original da equipe'));const feed=el('div','cpt-feed');list.forEach(r=>{const p=el('article','cpt-record');p.append(el('span','cpt-chip',date(r.dia)+' · '+r.origem),el('div','cpt-record-title',r.atividade));const meta=el('div','cpt-meta');meta.append(el('div','',r.equipe),el('div','',r.local+(r.bairro?' · '+r.bairro:'')));p.append(meta,el('div','cpt-narrative',r.relato||'Sem narrativa registrada.'));if(r.motivoInterrupcao)p.append(el('p','cpt-insight','Interrupção informada: '+r.motivoInterrupcao));const gallery=el('div','cpt-gallery');r.fotos.forEach((f,i)=>{const item=el('div');item.append(photo(f,r,false),el('div','cpt-photo-caption','Evidência '+(i+1)+' · '+date(r.dia)));gallery.append(item);});p.append(gallery,link('Registro '+r.id+' · origem completa',r.url));feed.append(p);});v.append(feed);}\n    function notes(v){const p=panel('Espaço da gestão','Leituras, decisões e acompanhamentos em um só lugar'),list=el('div','cpt-note-list');d.notasGestao.itens.filter(n=>n.texto||n.referencia||n.responsavel).forEach(n=>{const item=el('div','cpt-note');item.append(el('strong','',n.referencia||'Registro da gestão'),el('div','',n.texto),el('div','cpt-muted',[n.responsavel,n.prazo?date(n.prazo):'',n.concluido?'Concluído':'Em acompanhamento'].filter(Boolean).join(' · ')),button('Editar registro',()=>editor(n)));list.append(item);});p.append(list);const free=d.notasGestao.itens.find(n=>!n.texto&&!n.referencia&&!n.responsavel);if(free)p.append(button('Nova observação',()=>editor(free),true));if(!list.children.length)p.append(el('p','cpt-muted','Um espaço disponível para observações da gestão.'));const slot=el('div');p.append(slot);function editor(n){slot.replaceChildren();const f=el('form','cpt-note-form');function field(name,value,type){const l=el('label','',name),i=el(type==='textarea'?'textarea':'input');if(type!=='textarea')i.type=type||'text';i.value=value||'';l.append(i);f.append(l);return i;}const ref=field('Protocolo ou referência',n.referencia),owner=field('Responsável ou interlocutor',n.responsavel),text=field('Observação ou decisão',n.texto,'textarea');text.parentElement.className='cpt-span';const prazo=field('Data de acompanhamento',n.prazo,'date');let concluded=n.concluido;f.append(selector('Situação',[['false','Em acompanhamento'],['true','Concluído']],String(concluded),x=>{concluded=x==='true';}));const actions=el('div','cpt-span');const save=button('Salvar registro',async()=>{save.disabled=true;try{const payload={indice:n.indice,referencia:ref.value,responsavel:owner.value,texto:text.value,prazo:prazo.value,concluido:concluded,revisao:d.notasGestao.revisao};if(api)d.notasGestao=await api.nota(payload);else{d.notasGestao.itens[n.indice]=payload;d.notasGestao.revisao=String(Date.now());}paint();$('[data-status]').textContent=api?'Observação registrada.':'Observação registrada apenas nesta prévia.';}catch(e){$('[data-status]').textContent=e.message;save.disabled=false;}},true);actions.append(save,button('Fechar edição',()=>slot.replaceChildren()));f.append(actions);f.onsubmit=e=>e.preventDefault();slot.append(f);}v.append(p);}\n    function accesses(v){const g=el('div','cpt-access');d.links.forEach(x=>{const a=link('',x.url);a.append(el('h3','',x.nome),el('div','cpt-muted',x.descricao));g.append(a);});v.append(g);if(d.avisos.length){const p=panel('Disponibilidade das fontes');d.avisos.forEach(x=>p.append(el('p','cpt-muted',x)));v.append(p);}}\n    function territories(v){\n      const t=d.territorios||{itens:[],avisos:[]},items=t.itens;\n      v.append(kpis([['DIAGNÓSTICOS',items.length,'registros','Base válida disponível até '+date(d.hoje)],['NO MÊS',items.filter(x=>x.dia.slice(0,7)===d.mes).length,'registros',month(d.mes)],['BAIRROS IDENTIFICADOS',new Set(items.filter(x=>x.bairro!=='Bairro não informado').map(x=>norm(x.bairro))).size,'bairros','Nomes cadastrados na base; sem agrupamento aproximado']]));\n      const intro=panel('Conhecimento do território','Diagnósticos de todas as datas · pesquisas referentes a '+month(d.mes));intro.append(el('p','cpt-muted','Esta consulta reúne o registro de campo e os documentos disponíveis. A análise da gestão, a revisão e a geração continuam no painel territorial, em Procedimentos de Campo → TERRITÓRIOS.'));\n      if(t.url)intro.append(link('Abrir Procedimentos de Campo',t.url));v.append(intro);\n      const controls=el('div','cpt-controls'),q=el('input'),b=el('select');q.placeholder='Local, responsável ou ID';q.setAttribute('aria-label','Buscar diagnóstico');b.setAttribute('aria-label','Bairro do diagnóstico');b.append(el('option','','Todos os bairros'));b.firstChild.value='';Array.from(new Set(items.map(x=>x.bairro))).sort().forEach(x=>{const o=el('option','',x);o.value=x;b.append(o);});controls.append(q,b);v.append(controls);const feed=el('div','cpt-feed');v.append(feed);\n      function draw(){feed.replaceChildren();const selected=items.filter(x=>(!b.value||x.bairro===b.value)&&norm([x.id,x.local,x.responsavel].join(' ')).includes(norm(q.value)));selected.forEach(x=>{const card=panel(x.bairro,date(x.dia)+' · '+x.id);card.append(el('p','',x.local||'Local não informado'),el('p','cpt-muted',x.responsavel||'Responsável não informado'));\n        card.append(el('p','cpt-insight',x.pesquisas===null?'Sem bairro identificado para relacionar pesquisas.':x.pesquisas+' pesquisas registradas neste bairro em '+month(d.mes)+'. Contagem por bairro, não por diagnóstico; não somar entre fichas do mesmo bairro.'));\n        const text=el('details');text.append(el('summary','','Relato original do diagnóstico'),el('p','cpt-narrative',x.texto||'Sem relato consolidado neste campo. Os demais campos estão disponíveis na origem.'));card.append(text);\n        const gallery=el('div','cpt-gallery');(x.fotos||[]).forEach(f=>gallery.append(photo(f,{atividade:'Diagnóstico · '+x.bairro,dia:x.dia,local:x.local})));card.append(gallery,link('Conferir registro original',x.url));\n        if(x.documentos){const p=el('div','cpt-controls');[['Documento',x.documentos.documento],['PDF',x.documentos.pdf],['Apresentação',x.documentos.slides]].forEach(a=>{if(a[1])p.append(link(a[0],a[1]));});card.append(p,el('p','cpt-muted','Última geração registrada: '+date(x.documentos.data)+'. O documento mantém o conteúdo da geração; revisões posteriores podem exigir uma nova versão.'));}else card.append(el('p','cpt-muted','Nenhuma geração concluída localizada para este diagnóstico.'));feed.append(card);});if(!selected.length)feed.append(el('p','cpt-muted','Nenhum diagnóstico neste recorte.'));}\n      q.oninput=draw;b.onchange=draw;draw();(t.avisos||[]).forEach(a=>v.append(el('p','cpt-insight',a)));\n    }\n    function tutorial(v){\n      const sections=[\n        ['Atendimento · duas planilhas, um protocolo','Controle de Atendimentos','O Controle de Atendimentos é o espaço da equipe que acompanha o morador. Reúne as fichas, demandas, revisão de texto e fotos, encerramento e preparação do pacote Sabesp. A planilha Execução de Atendimentos concentra a comunicação com a execução e os registros de abertura ou continuidade do serviço. O protocolo conecta as informações.','A execução informa o que ocorreu e o que precisa de retorno. O atendimento confere a informação, conversa com o morador e mantém o controle da ficha final. “Responsável atual” indica o setor da próxima ação; não é uma classificação de culpa.'],\n        ['Demandas, comunicação e ficha final','Execução de Atendimentos','Marcar uma demanda como realizada conclui aquela tarefa. O encerramento da ficha segue o fluxo de atendimento e suas regras. Comentários entre setores registram o que já foi feito e qual retorno é necessário. O acompanhamento interno do atendimento permanece no controle da equipe.','A ficha Sabesp apresenta a solicitação, a tratativa e o resultado humano. Canais de contato e mensagens administrativas pertencem ao acompanhamento. O ZIP do período reúne concluídas no mês selecionado e ainda abertas, mesmo de meses anteriores. O mês merece conferência antes da geração.'],\n        ['Diagnóstico de área · do campo à apresentação','Diagnósticos de Área','O formulário alimenta o diagnóstico com os campos do orientador Sabesp. No painel territorial, a gestão consulta o registro, suas fotos e a rastreabilidade, e pode trabalhar uma análise consolidada própria, sem substituir a resposta original.','O gerador territorial instalado disponibiliza ficha em documento, PDF e apresentação. Os links aparecem aqui quando há uma geração concluída no histórico. Uma mudança posterior no diagnóstico não atualiza silenciosamente uma apresentação já editada. Revisão e nova versão acontecem no painel territorial.'],\n        ['RDAS · memória de campo e galeria','RDAS','Os relatos organizam quem participou, onde esteve, o que aconteceu e quais evidências foram registradas. A memória diária do painel reúne os três dias mais recentes disponíveis; o mês dos indicadores não muda esse recorte.','No RDAS, a galeria apoia a seleção de imagens por período, dia, bairro e atividade para o relatório. Os arquivos mantêm os acessos originais do Drive. Uma prévia indisponível não significa que a atividade não aconteceu.'],\n        ['Programa Parceiros · quantidade com contexto','Programa Parceiros','O volume do mês é comparado com uma meta definida pela gestão ou com a média histórica disponível. O painel informa o período de comparação e a quantidade de respostas usada nas notas.','Volume de pesquisas não comprova sozinho qualidade, representatividade ou cumprimento contratual. Meses sem cobertura não viram zero. As respostas e os comentários dos moradores complementam os números.'],\n        ['Procedimentos e anexos · origem e entrega','Procedimentos de Campo','Procedimentos de Campo reúne as respostas e a Base Consolidada que alimenta os controles. Os acessos “Ver origem” permitem conferir os registros por trás de cada indicador. Os anexos são a entrega mensal no modelo Sabesp.','As correções devem ocorrer pelo fluxo do sistema de origem. O painel de gestão consulta os dados e preserva um espaço próprio para decisões; não altera as respostas do campo nem a formatação dos documentos oficiais.'],\n        ['Espaço da gestão e atualização','Anexos do relatório','As observações podem ser registradas na janela ou nas linhas reservadas da aba Início, com referência, interlocutor e data. Elas são preservadas nas atualizações.','“Atualizar visão” consulta novamente os dados da janela. “Atualizar painel agora”, no menu GESTÃO, solicita a atualização das abas pela automação. Os controles de origem possuem seus próprios ciclos; a data de consulta não garante que uma resposta recém-enviada já foi integrada.']\n      ];\n      const p=panel('Como os sistemas se conectam','Consulta rápida para orientar decisões e encontrar o espaço certo');p.append(el('p','cpt-muted','Origem no campo → acompanhamento e revisão → evidências e entregas. Cada área mantém sua responsabilidade e o registro continua rastreável.'));v.append(p);\n      const q=el('input');q.placeholder='Buscar: ficha, fotos, diagnóstico, pacote…';q.setAttribute('aria-label','Buscar no guia dos sistemas');q.style.width='100%';q.style.margin='16px 0';v.append(q);const list=el('div','cpt-feed');v.append(list);\n      function draw(){list.replaceChildren();const found=sections.filter(s=>norm(s.join(' ')).includes(norm(q.value)));found.forEach((s,i)=>{const a=el('details','cpt-panel');a.open=Boolean(q.value)||i===0;a.append(el('summary','',s[0]),el('p','cpt-narrative',s[2]),el('p','cpt-insight',s[3]));const dest=d.links.find(l=>l.nome===s[1]);if(dest)a.append(link('Acessar '+s[1],dest.url));list.append(a);});if(!found.length)list.append(el('p','cpt-muted','Nenhum tópico encontrado.'));}q.oninput=draw;draw();\n    }\n\n    function select(key){active=key;paint();}function paint(){const title=views.find(x=>x[0]===active)[1];root.querySelector('h1').textContent=title;$('[data-subtitle]').textContent=active==='tutorial'?'Entenda os sistemas e seus acessos':active==='territorios'?'Registros do território · documentos e evidências':active==='diario'?'Evidências e memória das atividades':active==='atendimento'?'Carteira atual em '+date(d.hoje):'Indicadores de '+month(d.mes)+' · visão integrada';root.querySelectorAll('.cpt-nav').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.key===active)));const v=$('[data-view]');v.replaceChildren();v.setAttribute('aria-label',title);v.setAttribute('aria-labelledby','cpt-nav-'+active);({geral:home,atendimento:attendance,parceiros:partners,execucoes:executions,diario:diary,territorios:territories,tutorial:tutorial,notas:notes,acessos:accesses})[active](v);$('[data-foot]').textContent=(d.previa?'Prévia com os arquivos enviados. ':'Consulta em '+d.atualizado+'. ')+'Atendimento: '+(d.atendimento.atualizado||'horário da origem não disponível')+'. RDAS e Base Consolidada mantêm seus próprios ciclos de atualização.';}\n    const nav=root.querySelector('nav');views.forEach(x=>{const b=el('button','cpt-nav',x[1]);b.type='button';b.dataset.key=x[0];b.id='cpt-nav-'+x[0];b.setAttribute('role','tab');b.setAttribute('aria-controls','cpt-exec-view');b.setAttribute('aria-selected',String(x[0]===active));b.onclick=()=>select(x[0]);nav.append(b);});\n    \n    function tamanhoJanela(modo,tela){const presets={compacto:[1000,650],confortavel:[1200,750],amplo:[1680,980]},p=presets[modo]||presets.amplo;const w=Number(tela&&tela.availWidth)||1600,h=Number(tela&&tela.availHeight)||1080;return {largura:Math.max(320,Math.min(p[0],w-48)),altura:Math.max(320,Math.min(p[1],h-140))};}\n    const size=$('[data-size]');let modo='amplo';try{modo=window.localStorage.getItem('CPT_TAMANHO_JANELA')||modo;}catch(e){}if(!['compacto','confortavel','amplo'].includes(modo))modo='amplo';size.value=modo;\n    function redimensionar(){const t=tamanhoJanela(size.value,window.screen);if(api&&api.tamanho)api.tamanho(t.largura,t.altura);try{window.localStorage.setItem('CPT_TAMANHO_JANELA',size.value);}catch(e){}}\n    size.onchange=redimensionar;if(api&&api.tamanho)redimensionar();\n\n    const font=$('[data-font]');try{font.value=localStorage.getItem('CPT_FONTE_GESTAO')||'normal';}catch(e){}function fontApply(){root.style.setProperty('--texto',font.value==='grande'?'19px':'16px');try{localStorage.setItem('CPT_FONTE_GESTAO',font.value);}catch(e){}}font.onchange=fontApply;fontApply();\n    const monthInput=$('[data-month]');monthInput.value=d.mes;monthInput.max=d.hoje.slice(0,7);async function reload(){const b=$('[data-refresh]');b.disabled=true;$('[data-status]').textContent='Consultando os registros…';try{if(api){d=await api.dados({mes:monthInput.value});photos.clear();}else if(monthInput.value!==d.mes){monthInput.value=d.mes;throw Error('Esta prévia usa o mês dos arquivos enviados. No Google, a seleção consulta os registros da base.');}paint();$('[data-status]').textContent=api?'Visão atualizada.':'Prévia local dos arquivos enviados.';}catch(e){$('[data-status]').textContent=e.message;}finally{b.disabled=false;}}monthInput.onchange=reload;$('[data-refresh]').onclick=reload;$('[data-close-photo]').onclick=()=>$('[data-photo-dialog]').close();paint();\n  })();\n  </script>\n</div>\n";
