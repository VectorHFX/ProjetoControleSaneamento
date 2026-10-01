/** Fila com versões, lease, retentativa e tempo limitado. Não contém envio de e-mails. */
function c5EnfileirarSemTrava_(tipo,arg){
  const s=c5Tabela_(C5.fila,C5H.fila), rows=c5Ler_(s), key=tipo+':'+arg, i=rows.findIndex(r=>r[0]===key);
  const r=i<0?[key,tipo,arg,0,'',0,'','','','',new Date()]:rows[i];
  r[3]=Number(r[3])+1;r[4]='PENDENTE';r[5]=0;r[6]='';r[9]='';r[10]=new Date();
  if(i<0)c5Append_(s,[r]);else s.getRange(i+2,1,1,r.length).setValues([r]);
}
function c5Enfileirar_(tipo,arg){return c5ComTrava_(()=>c5EnfileirarSemTrava_(tipo,arg));}
function c5ReceberFormulario(e){if(!e||!e.source)return;if(e.source.getId()===C5.origem){c5ComTrava_(()=>{const p=c5Props_(), r=e.range.getRow(),old=Number(p.getProperty('C5_DIRTY_ROW')||r);p.setProperty('C5_DIRTY_ROW',String(Math.min(old,r)));});}else c5Enfileirar_('ATENDIMENTO','');}
function c5ReceberEdicao(e){if(!e||!e.range)return;if(e.source.getId()===C5.origem){if(e.range.getSheet().getName()===c5Forms_(e.source).getName()&&e.range.getLastRow()>1)c5ReceberFormulario(e);}else c5Enfileirar_('ATENDIMENTO','');}
function c5PegarJob_(){return c5ComTrava_(()=>{
  const s=c5Tabela_(C5.fila,C5H.fila), rows=c5Ler_(s), now=Date.now();
  const candidates=rows.map((r,i)=>({r,i})).filter(x=>(x.r[4]==='PENDENTE'||x.r[4]==='RODANDO'&&now-new Date(x.r[8]).getTime()>420000)&&(!x.r[6]||new Date(x.r[6]).getTime()<=now));
  candidates.sort((a,b)=>Number(a.r[1]!=='INDICE')-Number(b.r[1]!=='INDICE')||new Date(a.r[10])-new Date(b.r[10]));
  if(!candidates.length)return null;const x=candidates[0],r=x.r;r[4]='RODANDO';r[7]=Utilities.getUuid();r[8]=new Date();s.getRange(x.i+2,1,1,r.length).setValues([r]);return {linha:x.i+2,r:r.slice()};
});}
function c5TerminarJob_(job,error){c5ComTrava_(()=>{const s=c5Tabela_(C5.fila,C5H.fila),r=s.getRange(job.linha,1,1,C5H.fila.length).getValues()[0];if(r[7]!==job.r[7]||r[3]!==job.r[3])return;r[5]=Number(r[5])+1;r[4]=error?(r[5]>=5?'ERRO':'PENDENTE'):'OK';r[9]=error?String(error.message||error).slice(0,500):'';r[6]=error?new Date(Date.now()+Math.min(60,Math.pow(2,r[5]))*60000):'';s.getRange(job.linha,1,1,r.length).setValues([r]);});}
/** Não segura ScriptLock durante integrações legadas que têm trava própria. */
function processarCampo5(){
  const p=c5Props_(), token=Utilities.getUuid(), allowed=c5ComTrava_(()=>{const lease=JSON.parse(p.getProperty('C5_WORKER')||'null');if(lease&&Date.now()-lease.inicio<420000)return false;p.setProperty('C5_WORKER',JSON.stringify({token,inicio:Date.now()}));return true;});if(!allowed)return;
  const inicio=Date.now();try{
    sincronizarCampo5();
    // Fila já usada pelo painel de atendimento. Sua rotina foi mantida, sem reinstalar o painel.
    c5Medir_('fila-atendimento',()=>processarSolicitacoesPainelAtendimento());
    const today=Utilities.formatDate(new Date(),C5.tz,'yyyy-MM-dd');
    if(p.getProperty('C5_ATD_DIA')!==today){c5Enfileirar_('ATENDIMENTO','');p.setProperty('C5_ATD_DIA',today);}
    let count=0;while(Date.now()-inicio<180000&&count++<3){const job=c5PegarJob_();if(!job)break;try{c5Medir_(job.r[1],()=>c5ExecutarJob_(job.r));c5TerminarJob_(job,null);}catch(e){c5TerminarJob_(job,e);}}
  }finally{c5ComTrava_(()=>{const lease=JSON.parse(p.getProperty('C5_WORKER')||'null');if(lease&&lease.token===token)p.deleteProperty('C5_WORKER');});}
}
function c5ExecutarJob_(r){switch(r[1]){
  case 'INDICE':return reconstruirIndiceCampo5();
  case 'RDAS':return c5RdasDia_(r[2]);
  case 'ATENDIMENTO':return sincronizarCentralAtendimentos(false,{baseJaSincronizada:true});
  case 'RELATORIO':if(c5Ler_(c5Tabela_(C5.fila,C5H.fila)).some(x=>x[1]==='INDICE'&&x[4]!=='OK'))throw Error('Aguardando atualização do índice.');return c5Relatorio_(c5Props_().getProperty('C5_MES'));
  default:throw Error('Tipo de tarefa desconhecido: '+r[1]);
}}
function retentarFalhasCampo5(){c5ComTrava_(()=>{const s=c5Tabela_(C5.fila,C5H.fila);c5Ler_(s).forEach((r,i)=>{if(r[4]==='ERRO'){r[4]='PENDENTE';r[5]=0;r[6]='';s.getRange(i+2,1,1,r.length).setValues([r]);}});});}
function c5Gatilhos_(){
  // Este projeto é substituído integralmente. Backups contêm o inventário anterior.
  // Não alcança gatilhos de outros projetos ou instalados por outras contas.
  ScriptApp.getProjectTriggers().forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('c5AoAbrir').forSpreadsheet(C5.origem).onOpen().create();
  [C5.origem,C5.execucao,C5.satisfacao].forEach(id=>ScriptApp.newTrigger('c5ReceberFormulario').forSpreadsheet(id).onFormSubmit().create());
  [C5.origem,C5.execucao,C5.satisfacao].forEach(id=>ScriptApp.newTrigger('c5ReceberEdicao').forSpreadsheet(id).onEdit().create());
  ScriptApp.newTrigger('processarCampo5').timeBased().everyMinutes(1).create();
}
function instalarCampo5(){
  const active=SpreadsheetApp.getActiveSpreadsheet();if(!active||active.getId()!==C5.origem)throw Error('Instale no Apps Script de Procedimentos de Campo.');
  c5BackupValido_();c5Auditoria_();const p=c5Props_();
  // Validar acessos antes de substituir gatilhos.
  [C5.rdas,C5.atendimento,C5.execucao,C5.satisfacao].forEach(id=>SpreadsheetApp.openById(id).getName());
  p.setProperty('CENTRAL_ATENDIMENTOS_ORIGEM_ID',C5.origem);
  if(!p.getProperty('C5_MES'))p.setProperty('C5_MES',Utilities.formatDate(new Date(),C5.tz,'yyyy-MM'));
  if(!p.getProperty('C5_OWNER'))p.setProperty('C5_OWNER',Session.getEffectiveUser().getEmail().toLowerCase());
  ['indice','cadastros','fila','log'].forEach(k=>c5Tabela_(C5[k],C5H[k]));
  c5PaginaOperacao_();reconstruirIndiceCampo5();
  // Inicializa pela leitura de TODAS as respostas em lotes retomáveis. Não zera a fonte.
  if(!p.getProperty('C5_CURSOR'))p.setProperty('C5_CURSOR','1');
  c5Enfileirar_('RELATORIO','');c5Organizar_();c5Gatilhos_();c5AoAbrir();
  console.log('Campo 5 instalado. A fila processa a migração em lotes; acompanhe Operação.');
}
function c5PaginaOperacao_(){const ss=c5SS_();let s=ss.getSheetByName('Operação');if(!s)s=ss.insertSheet('Operação',0);s.getRange('A1:D12').breakApart().clearContent();s.getRange('A1:D2').merge().setValue('CPT · Campo e território').setBackground('#153F47').setFontColor('#FFFFFF').setFontSize(22);s.getRange('A4:D5').merge().setValue('Uma base organizada. Menos espera.\nAbra CPT Campo → Abrir operação para obras, traçado, comunicados e entregas.').setWrap(true);s.getRange('A7:B11').setValues([['Respostas','Fonte original preservada'],['Relatório','Quadro de atividades do mês selecionado'],['Cadastro em lote','Obras, traçado e imóveis comunicados'],['Processamento','A cada minuto; somente tarefas pendentes'],['Versão',C5.versao]]);s.setColumnWidths(1,4,230);s.setRowHeights(1,12,30);s.setFrozenRows(2);s.getRange('A1:D12').setFontFamily('Arial');}
function c5Organizar_(){const ss=c5SS_(), visible=new Set(['Operação','Relatório',c5Forms_(ss).getName()]);if(!ss.getSheetByName('Relatório'))ss.insertSheet('Relatório');ss.getSheets().forEach(s=>visible.has(s.getName())?s.showSheet():s.hideSheet());}
/** Opcional, depois da validação: elimina somente páginas derivadas conhecidas. */
function removerPaginasAntigasCampo5(){c5BackupValido_();if(!c5Props_().getProperty('C5_OWNER'))throw Error('Instale primeiro.');const nomes=['Programa Parceiros','BI Satisfação','Pesquisa de Satisfação','Relatos de Atividade','Atendimentos','Vistorias Cautelares','Ficha da Cautelar','Ficha do Diagnóstico','Diagnósticos de Área','Indicadores Matriz de Contatos','Resumo da Migração','Resumo Integração 1.0 e 3.0','Auditoria Migração 1.0','Auditoria Migração 2.0','Log Matriz de Contatos','Auditoria Indicadores Anexos'];const ss=c5SS_();nomes.forEach(n=>{const s=ss.getSheetByName(n);if(s)ss.deleteSheet(s);});c5Organizar_();}
function c5AoAbrir(){SpreadsheetApp.getUi().createMenu('CPT Campo').addItem('Abrir operação','abrirCampo5').addItem('Processar pendências agora','processarCampo5').addItem('Tentar novamente as falhas','retentarFalhasCampo5').addItem('Medir leitura da base','medirLeituraCampo5').addItem('Auditar estrutura','auditarCampo5').addToUi();}
function medirLeituraCampo5(){return c5Medir_('benchmark-leitura-indice',()=>{const r=c5Ler_(c5Tabela_(C5.indice,C5H.indice));return {linhas:r.length,bytes:Utilities.newBlob(JSON.stringify(r)).getBytes().length};});}
