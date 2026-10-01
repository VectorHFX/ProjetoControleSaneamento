/** CPT Campo 5.0 · núcleo. Instalar junto dos demais arquivos do pacote.
 * Não limpa Forms, Base Consolidada, fichas ou planilhas externas.
 * Fuso de negócio: America/Sao_Paulo. Valores ausentes não viram zero.
 */
const C5 = Object.freeze({
  versao:'5.0.0', origem:'1_6BKqeVbjzKm_hYdRsneU3YqEmd1rOWaVGCiV0LXtgQ',
  rdas:'176BymNYBSfVt7iQrkNR-IyT_NXdB9GC999mX9C2WtK4',
  atendimento:'1UHs_jFVD7jQRKgw7CVPCQ8R7sgvyhkJVv5rcj0v2K5g',
  execucao:'1Y5zioMOTaJDtp78OPBovXeHhvuns_ZEG6SMyHqng-Uk',
  satisfacao:'1QlNjWWIHhQYEVvw5fWrKGQmGVqGYmH5B2237ajwmedI',
  anexos:'1Et4M0nr4CxlRj7J6EDoru91aC4PJ-G2Y', mascara:'1ekpoNrPSdIbc18YxWp5ncQsTiWluS--m',
  central:'18Hzcw0amILZBUcy8D952YwJarM6mj16Q8Vg_pei6UmU',
  tz:'America/Sao_Paulo', base:'Base Consolidada', indice:'_CPT_Indice',
  cadastros:'_CPT_Cadastros', fila:'_CPT_Fila', log:'_CPT_Desempenho', lote:100
});
const C5H = Object.freeze({
  indice:['ID','Linha base','Dia','Mês','Procedimento','Bairro','Frente','Endereço','Atividade','Complemento','Público','Participantes','Ferramenta','Responsável','Apoio','Classificação','Nota saneamento','Nota qualidade de vida','Texto base','Fotos','Assinatura'],
  cadastros:['ID','Tipo','Obra ID','Dia','Revisão','Atualizado em','Autor','Dados JSON','Pedido'],
  fila:['Chave','Tipo','Argumento','Versão','Estado','Tentativas','Próxima tentativa','Token','Início','Erro','Atualizado em'],
  log:['Data','Operação','Duração ms','Linhas','Resultado','Detalhe']
});
function c5Props_(){return PropertiesService.getScriptProperties();}
function c5SS_(){return SpreadsheetApp.openById(C5.origem);}
function c5Norm_(x){return String(x==null?'':x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();}
function c5Texto_(x){return String(x==null?'':x).trim();}
function c5Literal_(x){return typeof x==='string'&&/^[=+@-]/.test(x)?"'"+x:x;}
function c5Hash_(x){return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(x)));}
function c5Mapa_(h){const m={};h.forEach((v,i)=>{const k=c5Norm_(v);if(k&&m[k]!==undefined)throw Error('Cabeçalho repetido: '+v);if(k)m[k]=i;});return m;}
function c5Campo_(r,m,n){return r[m[c5Norm_(n)]]??'';}
function c5Dia_(x){
  if(x instanceof Date&&!isNaN(x))return Utilities.formatDate(x,C5.tz,'yyyy-MM-dd');
  const s=c5Texto_(x), br=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/), iso=br?br[3]+'-'+br[2]+'-'+br[1]:s;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return '';
  const d=new Date(iso+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===iso?iso:'';
}
function c5Numero_(x){if(x===''||x==null)return '';const n=Number(String(x).replace(',','.'));return Number.isFinite(n)&&n>=0?n:'';}
function c5ComTrava_(fn){const l=LockService.getScriptLock();l.waitLock(25000);try{return fn();}finally{l.releaseLock();}}
function c5Tabela_(nome,cab){const ss=c5SS_();let s=ss.getSheetByName(nome);if(!s){s=ss.insertSheet(nome);s.getRange(1,1,1,cab.length).setValues([cab]);s.setFrozenRows(1);s.hideSheet();}else if(JSON.stringify(s.getRange(1,1,1,cab.length).getValues()[0])!==JSON.stringify(cab))throw Error('Estrutura inesperada: '+nome);return s;}
function c5Ler_(s){return s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,s.getLastColumn()).getValues():[];}
function c5Append_(s,rows){if(!rows.length)return;const start=s.getLastRow()+1;if(start+rows.length-1>s.getMaxRows())s.insertRowsAfter(s.getMaxRows(),start+rows.length-1-s.getMaxRows());s.getRange(start,1,rows.length,rows[0].length).setValues(rows.map(r=>r.map(c5Literal_)));}
function c5Log_(op,t,n,status,detail){const entry=[new Date(),op,Date.now()-t,n,status,c5Texto_(detail).slice(0,500)];console.log(JSON.stringify(entry));try{c5ComTrava_(()=>{const s=c5Tabela_(C5.log,C5H.log);c5Append_(s,[entry]);if(s.getLastRow()>2001)s.deleteRows(2,s.getLastRow()-2001);});}catch(e){console.error('Não foi possível gravar medição: '+e.message);}}
function c5Medir_(op,fn){const t=Date.now();try{const r=fn();c5Log_(op,t,r&&r.linhas||0,'OK','');return r;}catch(e){c5Log_(op,t,0,'ERRO',e.message);throw e;}}
function c5Forms_(ss){const s=ss.getSheetByName('Respostas ao formulário 1')||ss.getSheetByName('Respostas do Formulário 1');if(!s)throw Error('Aba original do formulário não localizada.');return s;}
function c5Auditoria_(){
  const ss=c5SS_(), f=c5Forms_(ss), b=ss.getSheetByName(C5.base);if(!b)throw Error('Base Consolidada ausente. Restaure a fonte antes de instalar.');
  const rows=b.getDataRange().getValues(), m=c5Mapa_(rows[0]), ids=new Set();
  ['ID de migração','Linha na origem','Origem do registro','Carimbo de data/hora','Selecione o procedimento a ser executado'].forEach(k=>{if(m[c5Norm_(k)]===undefined)throw Error('Campo obrigatório ausente: '+k);});
  rows.slice(1).forEach((r,i)=>{if(!r.some(v=>v!==''))return;const id=c5Texto_(c5Campo_(r,m,'ID de migração'));if(!id||ids.has(id))throw Error('ID vazio/duplicado na linha '+(i+2));ids.add(id);});
  c5Mapa_(f.getRange(1,1,1,f.getLastColumn()).getValues()[0]);
  return {versao:C5.versao,abas:ss.getSheets().map(s=>({nome:s.getName(),linhas:s.getLastRow()})),respostas:f.getLastRow()-1,consolidados:ids.size,gatilhos:ScriptApp.getProjectTriggers().map(t=>({funcao:t.getHandlerFunction(),id:t.getUniqueId()}))};
}
function auditarCampo5(){const r=c5Auditoria_();console.log(JSON.stringify(r,null,2));return r;}
/** Backup verificável por arquivo. Pode ser retomado após falha, sem apagar nada. */
function criarBackupCampo5(){
  if(SpreadsheetApp.getActiveSpreadsheet().getId()!==C5.origem)throw Error('Execute em Procedimentos de Campo.');
  const p=c5Props_(), anteriores=JSON.parse(p.getProperty('C5_BACKUP')||'null');
  const b=anteriores&&!anteriores.concluido?anteriores:{criado:new Date().toISOString(),pasta:DriveApp.createFolder('CPT · antes da migração '+Utilities.formatDate(new Date(),C5.tz,'yyyy-MM-dd HHmmss')).getId(),arquivos:[]};
  p.setProperty('C5_BACKUP',JSON.stringify(b));
  const folder=DriveApp.getFolderById(b.pasta);
  for(const id of [C5.origem,C5.rdas,C5.atendimento,C5.execucao,C5.satisfacao,C5.anexos,C5.mascara,C5.central]){
    if(b.arquivos.some(x=>x.origem===id))continue;
    const src=SpreadsheetApp.openById(id), before=src.getSheets().map(s=>[s.getName(),s.getLastRow(),s.getLastColumn()]);
    const file=DriveApp.getFileById(id).makeCopy('BACKUP · '+src.getName(),folder), cp=SpreadsheetApp.openById(file.getId());
    const after=cp.getSheets().map(s=>[s.getName(),s.getLastRow(),s.getLastColumn()]);
    if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Backup divergente ou fonte alterada durante a cópia: '+src.getName()+'. Repita a função.');
    const inventory=folder.createFile('estrutura-'+id+'.json',JSON.stringify(before),MimeType.PLAIN_TEXT);
    b.arquivos.push({origem:id,copia:file.getId(),inventario:inventory.getId()});p.setProperty('C5_BACKUP',JSON.stringify(b));
  }
  b.concluido=true;p.setProperty('C5_BACKUP',JSON.stringify(b));folder.createFile('inventario.json',JSON.stringify(b,null,2),MimeType.PLAIN_TEXT);
  console.log('Backup concluído: https://drive.google.com/drive/folders/'+b.pasta);return b;
}
function c5BackupValido_(){const b=JSON.parse(c5Props_().getProperty('C5_BACKUP')||'null');if(!b||!b.concluido||Date.now()-Date.parse(b.criado)>86400000)throw Error('Faça um backup novo com criarBackupCampo5 (válido por 24 horas).');return b;}
function c5RegistroIndice_(r,m,linha){
  const g=n=>c5Campo_(r,m,n), dia=c5Dia_(g('Data de realização do procedimento'));
  return [g('ID de migração'),linha,dia,dia.slice(0,7),g('Selecione o procedimento a ser executado'),g('Bairro de realização do procedimento'),g('Título da frente de serviço'),g('Endereço da frente de serviço')||g('Endereço completo'),g('Atividade realizada'),g('Complemento da atividade'),g('Público-alvo da atividade'),c5Numero_(g('Total de participantes')),g('Ferramenta'),g('Colaborador responsável pelo registro'),g('Colaboradores de apoio na atividade'),g('Classificação da atividade'),c5Numero_(g('De 0 a 10, quanto está satisfeito com os serviços de saneamento de forma geral?')),c5Numero_(g('Se sim: De 0 a 10, quanto percebeu melhorias na qualidade de vida relacionadas ao saneamento?')),g('Relato da atividade')||g('Relato do Diagnóstico'),g('Adicione até 5 fotos com timestamp da atividade'),c5Hash_(r)];
}
function c5Reindexar_(){const b=c5SS_().getSheetByName(C5.base), v=b.getDataRange().getValues(), m=c5Mapa_(v[0]), s=c5Tabela_(C5.indice,C5H.indice), rows=v.slice(1).map((r,i)=>c5RegistroIndice_(r,m,i+2));if(s.getMaxRows()<rows.length+1)s.insertRowsAfter(s.getMaxRows(),rows.length+1-s.getMaxRows());if(rows.length)s.getRange(2,1,rows.length,C5H.indice.length).setValues(rows.map(r=>r.map(c5Literal_)));if(s.getLastRow()>rows.length+1)s.getRange(rows.length+2,1,s.getLastRow()-rows.length-1,C5H.indice.length).clearContent();c5Props_().setProperty('C5_REV',Utilities.getUuid());return {linhas:rows.length};}
function reconstruirIndiceCampo5(){return c5Medir_('reindexar',()=>c5ComTrava_(c5Reindexar_));}
/** Reprocessa por ID; não ordene/exclua linhas da aba vinculada ao Forms. */
function c5Ingerir_(){return c5ComTrava_(()=>{
  const ss=c5SS_(), f=c5Forms_(ss), p=c5Props_(), last=f.getLastRow(), cursor=Number(p.getProperty('C5_CURSOR')||1);
  if(last<cursor)throw Error('Respostas foram removidas. Restaure a aba original; o cursor não será reiniciado automaticamente.');
  const dirty=Number(p.getProperty('C5_DIRTY_ROW')||0), start=dirty?Math.min(dirty,cursor+1):cursor+1;if(start>last)return {linhas:0};
  const end=Math.min(last,start+C5.lote-1), fh=f.getRange(1,1,1,f.getLastColumn()).getValues()[0], fm=c5Mapa_(fh), b=ss.getSheetByName(C5.base), all=b.getDataRange().getValues(), bh=all[0], bm=c5Mapa_(bh);
  fh.forEach(h=>{if(bm[c5Norm_(h)]===undefined){bm[c5Norm_(h)]=bh.length;bh.push(h);}});
  if(b.getMaxColumns()<bh.length)b.insertColumnsAfter(b.getMaxColumns(),bh.length-b.getMaxColumns());b.getRange(1,1,1,bh.length).setValues([bh]);
  const byId=new Map();all.slice(1).forEach((r,i)=>byId.set(c5Texto_(c5Campo_(r,bm,'ID de migração')),{r,i:i+2}));
  const incoming=f.getRange(start,1,end-start+1,fh.length).getValues(), append=[], updates=[], dirtyDays=new Set();let changed=0, atd=false;
  incoming.forEach((src,j)=>{
    if(!src.some(x=>x!==''))return;
    const line=start+j,id='ATUAL-3.0-'+String(line).padStart(4,'0'), old=byId.get(id), row=old?old.r.slice():Array(bh.length).fill('');while(row.length<bh.length)row.push('');
    if(old&&String(c5Campo_(old.r,bm,'Carimbo de data/hora'))!==String(src[fm[c5Norm_('Carimbo de data/hora')]]))throw Error('A posição da resposta '+line+' mudou. Não é seguro associar por linha.');
    fh.forEach((h,k)=>row[bm[c5Norm_(h)]]=src[k]);
    // Mantém o campo legado de foto usado por leitores antigos.
    const photo=fm[c5Norm_('Fotos do diagnóstico - Foto da Rua')];if(photo!==undefined&&bm[c5Norm_('Fotos do diagnóstico')]!==undefined)row[bm[c5Norm_('Fotos do diagnóstico')]]=src[photo];
    row[bm[c5Norm_('ID de migração')]]=id;row[bm[c5Norm_('Origem do registro')]]='Procedimentos de Campo 3.0';row[bm[c5Norm_('Linha na origem')]]=line;
    row[bm[c5Norm_('Validação')]]='Registro atual preservado';
    const day=c5Dia_(c5Campo_(row,bm,'Data de realização do procedimento'));if(!old)row[bm[c5Norm_('Mês de referência')]]=day?new Date(day.slice(0,7)+'-01T12:00:00-03:00'):'';
    if(old&&c5Hash_(row)===c5Hash_(old.r))return;
    changed++;
    if(old){const prev=c5RegistroIndice_(old.r,bm,old.i);if(c5Norm_(prev[4])==='relato de atividade'&&prev[2])dirtyDays.add(prev[2]);}
    const tipo=c5Norm_(c5Campo_(row,bm,'Selecione o procedimento a ser executado'));if(tipo==='relato de atividade'&&day)dirtyDays.add(day);if(/atendimento/.test(tipo)||old&&/atendimento/.test(c5Norm_(c5Campo_(old.r,bm,'Selecione o procedimento a ser executado'))))atd=true;
    if(old)updates.push({linha:old.i,row});else append.push(row);
  });
  // Intenções duráveis ANTES da escrita. Reexecução após falha não perde integrações.
  if(changed){c5EnfileirarSemTrava_('INDICE','');c5EnfileirarSemTrava_('RELATORIO','');dirtyDays.forEach(d=>c5EnfileirarSemTrava_('RDAS',d));if(atd)c5EnfileirarSemTrava_('ATENDIMENTO','');}
  updates.sort((a,b)=>a.linha-b.linha);let group=[];
  const flush=()=>{if(group.length)b.getRange(group[0].linha,1,group.length,bh.length).setValues(group.map(x=>x.row.map(c5Literal_)));group=[];};
  updates.forEach(x=>{if(group.length&&x.linha!==group[group.length-1].linha+1)flush();group.push(x);});flush();
  c5Append_(b,append);
  // Enfileirar antes do cursor: uma falha nunca pula a integração pendente.
  // O índice é materializado uma vez pelo worker, após o lote.
  p.setProperty('C5_CURSOR',String(Math.max(cursor,end)));
  if(dirty){if(end<last)p.setProperty('C5_DIRTY_ROW',String(end+1));else p.deleteProperty('C5_DIRTY_ROW');}
  return {linhas:incoming.length,alteradas:changed,restantes:last-end};
});}
function sincronizarCampo5(){return c5Medir_('ingestao',c5Ingerir_);}
