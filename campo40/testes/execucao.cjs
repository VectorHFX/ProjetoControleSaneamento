// Execução da engenharia (serviços Google simulados, dados fictícios). node campo40/testes/execucao.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
class Sheet{constructor(n,rows){this.n=n;this.rows=rows;this.fmt={};this.merges=[];this.link={};this.hidden=false;this.maxR=1000;this.maxC=26}getLastRow(){return this.rows.length}getLastColumn(){return Math.max(0,...this.rows.map(r=>r.length))}getName(){return this.n}
  setName(n){this.n=n;return this}getMaxRows(){return this.maxR}getMaxColumns(){return this.maxC}insertRowsAfter(_,k){this.maxR+=k}insertColumnsAfter(_,k){this.maxC+=k}hideColumns(){}setRowHeight(){}setColumnWidth(){}setHiddenGridlines(){}setTabColor(){}
  hideSheet(){this.hidden=true}isSheetHidden(){return this.hidden}
  getDataRange(){const w=this.getLastColumn();return {getValues:()=>this.rows.map(r=>Array.from({length:w},(_,j)=>r[j]??''))}}
  clearContents(){this.rows=[]}setFrozenRows(){}protect(){const p={setWarningOnly:()=>p,setDescription:()=>p};return p}
  getRange(r,c,nr=1,nc=1){const s=this;const fmt=k=>v=>{s.fmt[k]=v;return g};const g=new Proxy({getValues:()=>Array.from({length:nr},(_,i)=>Array.from({length:nc},(_,j)=>s.rows[r+i-1]?.[c+j-1]??'')),setValues:v=>{v.forEach((row,i)=>{while(s.rows.length<r+i)s.rows.push([]);row.forEach((x,j)=>s.rows[r+i-1][c+j-1]=x)});return g},
    clear:()=>{if(r===1&&nr>=s.rows.length){s.rows=[];s.fmt={};s.merges=[]}return g},merge:()=>{s.merges.push([r,c,nr,nc]);return g},setRichTextValues:v=>{v.forEach((row,i)=>row.forEach((rt,j)=>{if(rt.links.length)s.link[(r+i)+','+(c+j)]=rt.links}));return g},setBackgrounds:fmt('bg'),setFontColors:fmt('fc'),setFontWeights:fmt('fw')},{get:(t,k)=>k in t?t[k]:()=>g});return g}}
const ss=sheets=>({setActiveSheet:x=>{ss.ativa=x},moveActiveSheet:i=>{const k=sheets.indexOf(ss.ativa);sheets.splice(k,1);sheets.splice(i-1,0,ss.ativa)},getSheets:()=>sheets,getSheetByName:n=>sheets.find(s=>s.n===n)||null,insertSheet:n=>{const s=new Sheet(n,[]);sheets.push(s);return s},getUrl:()=>'https://docs.google.com/spreadsheets/d/exec'});
const A=['Protocolo','Protocolo principal','Situação do protocolo','Status','Data de abertura','Data de conclusão','Nome','Assunto','Endereço','Frente de obra','Área responsável','Responsável','Próxima ação','Atualização operacional','Documento','PDF','Origem','Pesquisa','Hash','Detalhes JSON'];
const M=['ID','Protocolo','Data e hora','Tipo','Status','Autor','Resumo','Origem','Hash','Detalhes JSON'];
const caso=(p,status,area,extra={})=>[p,extra.principal||p,'Principal',status,new Date('2026-09-01T12:00:00Z'),'','Morador '+p.slice(-2),'Vazamento','Rua Exemplo, '+p.slice(-2),'Coletor A',area,'Kesy','Analisar',new Date('2026-09-02T12:00:00Z'),'','','Migração','','',JSON.stringify({procedencia:'Em análise',telefone:'(11) 0000-00'+p.slice(-2)})];
const comPdf=caso('ATD20260011','Em andamento','Execução');comPdf[15]='https://drive.google.com/file/d/PDFNOVO00000000000000001/view';
const migrado=caso('ATD20260012','Concluída','Atendimento');migrado[19]=JSON.stringify({oficiais:[{campos:{'ID do PDF atual':'PDFANTIGO000000000000001'}}]});
const atd=new Sheet('Atendimentos',[A,caso('ATD20260010','Recebida','Execução'),comPdf,migrado,caso('ATD20260013','Em andamento','Atendimento',{principal:'ATD20260011'}),caso('ATD20260014','Aguardando finalização','Execução')]);
const mov=new Sheet('Movimentações',[M,['MOV-A','ATD20260010',new Date('2026-09-02'),'Atualização','Recebida','Kesy','Encaminhado: trocar tampa','Aplicação CPT']]);
const base={getId:()=>'base',getSheetByName:n=>[atd,mov,...extras].find(s=>s.n===n)||null,insertSheet:n=>{const s=new Sheet(n,[]);extras.push(s);return s},getSpreadsheetTimeZone:()=>'America/Sao_Paulo'};const extras=[];
const H=['Carimbo de data/hora','Endereço de e-mail','Você está abrindo ou executando uma ficha?','Qual o número de protocolo?','A demanda é procedente?','A demanda foi resolvida?','Título da execução','Relado detalhado do que foi executado ou proposto junto ao morador','Relato detalhado explicando a não procedência','Identifique-se, quem fez a execução','Data da atuação','Fotos da execução e documentos quando houver','Há pendências restantes?','Necessidade de retorno imediato do atendimento?','Observações para o seguimento da ficha','Endereço completo','Qual foi a solicitação ou reclamação?','Assunto','Se sim coloque nome completo e telefone ou email de solicitantes'];
const resp=(quando,o)=>H.map(h=>h==='Carimbo de data/hora'?new Date(quando):(o[h]??''));
const respostas=new Sheet('Respostas ao formulário 1',[H,
  resp('2026-09-20T12:00:00Z',{'Você está abrindo ou executando uma ficha?':'Executando','Qual o número de protocolo?':'ATD20260010 | Morador 10','A demanda é procedente?':'Sim','A demanda foi resolvida?':'Sim','Título da execução':'Antes do corte'}),
  resp('2026-10-02T13:00:00Z',{'Você está abrindo ou executando uma ficha?':'Executando','Qual o número de protocolo?':'ATD20260010 | Morador 10','A demanda é procedente?':'Sim','A demanda foi resolvida?':'Sim','Título da execução':'Troca da tampa','Relado detalhado do que foi executado ou proposto junto ao morador':'Tampa trocada.','Identifique-se, quem fez a execução':'Eng. Teste','Data da atuação':new Date('2026-10-02T12:00:00Z'),'Fotos da execução e documentos quando houver':'https://drive.google.com/open?id=x'}),
  resp('2026-10-02T14:00:00Z',{'Você está abrindo ou executando uma ficha?':'Executando','Qual o número de protocolo?':'ATD20260013 | Morador 13','A demanda é procedente?':'Sim','A demanda foi resolvida?':'Não','Há pendências restantes?':'Sim, falta recompor','Título da execução':'Escavação'}),
  resp('2026-10-02T15:00:00Z',{'Você está abrindo ou executando uma ficha?':'Executando','Qual o número de protocolo?':'ATD20260014 | Morador 14','A demanda é procedente?':'Não','Relato detalhado explicando a não procedência':'Rede da Sabesp, fora do escopo.'}),
  resp('2026-10-02T16:00:00Z',{'Você está abrindo ou executando uma ficha?':'Executando','Qual o número de protocolo?':'ATD20260012 | Morador 12','A demanda é procedente?':'Sim','Título da execução':'Retorno tardio'}),
  resp('2026-10-02T17:00:00Z',{'Você está abrindo ou executando uma ficha?':'Executando','Qual o número de protocolo?':'ATD20269999','Título da execução':'Protocolo errado'}),
  resp('2026-10-02T18:00:00Z',{'Você está abrindo ou executando uma ficha?':'Abrindo uma nova ficha','Endereço completo':'Rua Nova, 5','Qual foi a solicitação ou reclamação?':'Buraco na via','Assunto':'Pavimento','Identifique-se, quem fez a execução':'Eng. Teste','Se sim coloque nome completo e telefone ou email de solicitantes':'Fulana Teste 11 91234-5678'})]);
const comunicacao=new Sheet('Comunicação entre Áreas',[['Chave do evento','Protocolo','Data e hora','Registrado por','Área autora','Encaminhado para','Tipo de registro','Mensagem'],
  ['C1','ATD20260011',new Date('2026-10-02T19:00:00Z'),'Eng. Teste','Execução','Atendimento','Mensagem','Morador não estava em casa'],['C2','ATD20260011',new Date('2026-10-02T19:00:00Z'),'Kesy','Atendimento','Execução','Mensagem','Ignorar: autoria do Atendimento']]);
const dashAntigo=new Sheet('Dashboard',[['CENTRAL DE ATENDIMENTOS']]);const planilha=ss([respostas,comunicacao,dashAntigo]);
const OF=['Protocolo','Status','Data de conclusão','Área responsável pela próxima ação','Próxima ação'];
const antigo=ss([new Sheet('Base Fichas Oficiais',[OF,['ATD20260010','Recebida','','Execução','Analisar'],['ATD20260011','Concluída',new Date('2026-09-30T12:00:00Z'),'Atendimento concluído',''],['ATD20260014','Aguardando finalização','','Atendimento','Finalizar'],['ATD20260032','Recebida','','Execução','Analisar'],['ATD20260020','Recebida',new Date('2026-09-18T03:00:00Z'),'Atendimento concluído','Nenhuma pendência']]),
  new Sheet('Histórico',[['ID','Data e hora','Status','Procedência'],['ATD20260014',new Date('2026-09-10'),'Aguardando finalização','Procedente'],['ATD20260020',new Date('2026-09-03'),'Recebida','Em análise'],['ATD20260020',new Date('2026-09-18T14:00:00Z'),'Concluída','Procedente']])]);
let escolhas=['ATD20260001 | antigo'],tipo='LIST';const email=[];
const item={getTitle:()=>'Qual o número de protocolo?',getType:()=>tipo,asListItem:()=>({getChoices:()=>escolhas.map(v=>({getValue:()=>v})),setChoiceValues:v=>{escolhas=v}})};
const props=new Map([['CAMPO40_INSTALACAO',JSON.stringify({pronto:true,baseId:'base'})]]);const triggers=[];
const ctx={console,JSON,Date,Math,Map,Set,Object,Array,String,Number,RegExp,isNaN,
  Utilities:{computeDigest:(_,v)=>[...crypto.createHash('sha256').update(v).digest()].map(b=>b>127?b-256:b),DigestAlgorithm:{SHA_256:1},Charset:{UTF_8:1},
    formatDate:(d,_,f)=>{const x=new Date(d.getTime()-3*3600e3),p=n=>String(n).padStart(2,'0');const Y=x.getUTCFullYear(),Mo=p(x.getUTCMonth()+1),D=p(x.getUTCDate());return f==='yyyy'?String(Y):f==='yyyy-MM-dd'?Y+'-'+Mo+'-'+D:D+'/'+Mo+'/'+Y}},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k),getProperties:()=>Object.fromEntries(props)})},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
  SpreadsheetApp:{BorderStyle:{SOLID:'solid'},
    newTextStyle:()=>{const o={setFontFamily:()=>o,setFontSize:()=>o,setBold:()=>o,setUnderline:()=>o,setForegroundColor:()=>o,build:()=>({})};return o;},
    newRichTextValue:()=>{const o={text:'',links:[],setText(t){o.text=t;return o},setLinkUrl(a,b,u){o.links.push([o.text.slice(a,b),u]);return o},setTextStyle(){return o},build(){return {text:o.text,links:o.links}}};return o;},openById:id=>id==='base'?base:id==='1UHs_jFVD7jQRKgw7CVPCQ8R7sgvyhkJVv5rcj0v2K5g'?antigo:planilha},
  FormApp:{openById:()=>({getItems:()=>[item],getPublishedUrl:()=>'https://forms.example/exec'}),ItemType:{LIST:'LIST'}},
  ScriptApp:{getProjectTriggers:()=>triggers,deleteTrigger:()=>{},newTrigger:fn=>({forForm:id=>({onFormSubmit:()=>({create:()=>triggers.push({getHandlerFunction:()=>fn,id})})})})},
  MailApp:{getRemainingDailyQuota:()=>100,sendEmail:m=>email.push(m)}};
vm.createContext(ctx);for(const f of ['ConfiguracaoDaBase','RepositorioDosRegistros','AberturaDeAtendimentos','ExecucaoDaEngenharia','PainelDaExecucao','CorteDoControleAntigo'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx)));
// Instalação no corte: só respostas a partir de agora; avisos atuais viram referência.
props.set('CAMPO40_EXECUCAO',JSON.stringify({desde:'2026-10-01T03:00:00.000Z'}));
let r=run('instalarExecucaoDaEngenhariaCampo40()');
assert.equal(triggers.length,1,'gatilho do formulário de Execução');
const linha=p=>atd.rows.find(x=>x[0]===p);
assert.equal(linha('ATD20260010')[3],'Em andamento');assert.equal(linha('ATD20260010')[10],'Atendimento');assert.equal(linha('ATD20260010')[12],'Conferir execução e finalizar ficha');
assert.equal(JSON.parse(linha('ATD20260010')[19]).procedencia,'Procedente');assert.equal(JSON.parse(linha('ATD20260010')[19]).execucoes[0].data,'2026-10-02');
assert.equal(linha('ATD20260011')[10],'Execução','incorporado aplica no principal; com pendência fica com a Execução');assert.equal(linha('ATD20260011')[12],'Concluir a providência e registrar novo retorno');
assert.equal(linha('ATD20260014')[10],'Atendimento');assert.equal(JSON.parse(linha('ATD20260014')[19]).procedencia,'Não procedente');
assert.equal(linha('ATD20260012')[3],'Concluída','resposta para caso concluído não reabre');
const tipos=mov.rows.slice(1).map(x=>x[3]);
assert.deepEqual(tipos.filter(t=>t==='Execução').length,3);assert.ok(tipos.includes('Execução após conclusão'));assert.ok(tipos.includes('Abertura'));
assert.equal(tipos.filter(t=>t==='Comunicação').length,1,'só mensagens da Execução');
assert.ok(!mov.rows.some(x=>/Antes do corte/.test(x[6])),'respostas antes da instalação ficam de fora');
const nova=atd.rows.find(x=>/Formulário de Execução · REG-/.test(x[16]));assert.equal(nova[0],'ATD20260015','abertura pela engenharia continua a sequência');assert.equal(nova[6],'Fulana Teste');assert.equal(JSON.parse(nova[19]).telefone,'11 91234-5678');
assert.ok(r.erros.length===0,JSON.stringify(r.erros));
assert.deepEqual(escolhas,['ATD20260010 | Morador 10','ATD20260011 | Morador 11','ATD20260014 | Morador 14','ATD20260015 | Fulana Teste'],'lista: casos em aberto, sem concluídos e sem incorporados');
const painel=planilha.getSheetByName('CPT • Painel da Execução');assert.ok(painel,'painel criado');assert.equal(planilha.getSheets()[0],painel,'painel é a primeira aba');
const pv=painel.rows.map(r=>r.map(String));assert.match(pv[0][0],/Painel de Atendimentos/);
const lin=p=>pv.findIndex(r=>r[0]===p),cab=pv.findIndex(r=>r[0]==='Protocolo');assert.deepEqual(pv[cab].slice(0,4),['Protocolo','Aberta em','Dias','Situação']);
assert.ok(lin('ATD20260011')>cab,'caso com a Execução no primeiro quadro');assert.equal(pv[lin('ATD20260011')][7],'(11) 0000-0011');
const iAt=pv.findIndex(r=>r[0]==='Aguardando o Atendimento');assert.ok(lin('ATD20260010')>iAt,'caso devolvido ao Atendimento no segundo quadro');
const rs=lin('ATD20260011');assert.equal(painel.fmt.bg[rs][3],'#FFF2C2','Em andamento em amarelo');
assert.ok(pv.some(r=>r[0]==='Concluídas nos últimos 30 dias'));assert.ok(!pv.some(r=>r[0]==='ATD20260012'),'concluída sem data recente fica fora');
assert.ok(painel.merges.length>5);
// Ficha oficial: Ver · Baixar no painel (PDF novo) e aba com todos os casos (inclui o PDF da ficha antiga migrada).
const cf=pv[cab].indexOf('Ficha oficial');assert.equal(cf,10,'última coluna do painel');
assert.equal(pv[rs][cf],'Ver · Baixar');assert.deepEqual(painel.link[(rs+1)+','+(cf+1)],[['Ver','https://drive.google.com/file/d/PDFNOVO00000000000000001/view'],['Baixar','https://drive.google.com/uc?export=download&id=PDFNOVO00000000000000001']]);
assert.equal(pv[lin('ATD20260014')][cf],'não gerada');
const fichas=planilha.getSheetByName('CPT • Fichas oficiais');assert.ok(fichas,'aba de fichas criada');assert.equal(planilha.getSheets()[1],fichas,'segunda aba');
const fv=fichas.rows.map(r=>r.map(String)),fl=p=>fv.findIndex(r=>r[0]===p);
assert.ok(fl('ATD20260012')>0,'concluída antiga também aparece');assert.equal(fv[fl('ATD20260012')][8],'Ver · Baixar');
assert.match(fichas.link[(fl('ATD20260012')+1)+',9'][1][1],/id=PDFANTIGO000000000000001$/);
assert.ok(fl('ATD20260013')<0,'incorporado fica de fora');assert.ok(fl('ATD20260015')<fl('ATD20260010'),'mais novos primeiro');
assert.match(fv[1][0],/2 de 5 ficha\(s\) com PDF/);assert.match(r.ordens,/fichas oficiais: 2 de 5 com PDF/);assert.equal(dashAntigo.isSheetHidden(),true,'aba antiga oculta, não apagada');assert.ok(planilha.getSheetByName('Dashboard'));
const avisos=base.getSheetByName('Avisos à engenharia');assert.ok(avisos.rows.slice(1).every(x=>x[4]==='REFERÊNCIA'));assert.equal(email.length,0,'instalação não envia e-mail');
// Repetir é idempotente.
const nMov=mov.rows.length,nAtd=atd.rows.length;run('sincronizarExecucaoDaEngenhariaCampo40()');assert.equal(mov.rows.length,nMov);assert.equal(atd.rows.length,nAtd);
// Atendimento encaminha um caso à Execução pela aplicação → aviso só depois de ativar.
const l15=linha('ATD20260015');l15[10]='Execução';l15[12]='Avaliar o buraco';mov.rows.push(['MOV-APP-1','ATD20260015',new Date(),'Atualização','Recebida','Kesy','Área: Atendimento → Execução','Aplicação CPT']);
run('sincronizarExecucaoDaEngenhariaCampo40()');assert.equal(email.length,0,'avisos desligados por padrão');
run('ativarAvisosEngenhariaCampo40()');r=run('sincronizarExecucaoDaEngenhariaCampo40()');
assert.equal(email.length,1);assert.match(email[0].body,/ATD20260015 \| Fulana Teste/);assert.match(email[0].htmlBody,/Avaliar o buraco/);assert.equal(email[0].to.split(',').length,3);
run('sincronizarExecucaoDaEngenhariaCampo40()');assert.equal(email.length,1,'não repete aviso');
// Pergunta que não é lista: erro claro, o resto continua.
tipo='TEXT';r=run('sincronizarExecucaoDaEngenhariaCampo40()');assert.match(r.erros.join(),/Lista suspensa/);
// Corte: compara com o Controle antigo, protege a numeração e só ajusta casos ainda não movimentados na Base.
atd.rows.push(caso('ATD20260020','Recebida','Atendimento'));
const c40=atd.rows.findIndex(x=>x[0]==='ATD20260011');const antes=JSON.stringify(atd.rows);
r=run('compararComControleAntigoCampo40()');assert.equal(JSON.stringify(atd.rows),antes,'comparar não altera casos');
assert.deepEqual(r.faltandoNaBase,['ATD20260032']);assert.deepEqual(JSON.parse(props.get('CAMPO40_PROTOCOLO_MINIMO')),{2026:32});
assert.ok(r.conferirNaAplicacao.some(x=>x.protocolo==='ATD20260011'),'movimentado pela engenharia: não sobrescreve');
const l14=linha('ATD20260014');mov.rows=mov.rows.filter(x=>x[1]!=='ATD20260014');l14[3]='Aguardando finalização';
r=run('compararComControleAntigoCampo40()');assert.ok(r.aAjustar.some(x=>x.protocolo==='ATD20260014'));
r=run('trazerEstadoDoControleAntigoCampo40()');assert.deepEqual(r.ajustados.sort(),['ATD20260014','ATD20260020']);
const l20=linha('ATD20260020');assert.equal(l20[3],'Concluída','ficha oficial antiga dizia Recebida, mas o Histórico finalizou');assert.ok(l20[5] instanceof Date);assert.equal(l20[12],'');assert.equal(JSON.parse(l20[19]).procedencia,'Procedente');assert.equal(l14[3],'Em andamento');assert.equal(JSON.parse(l14[19]).procedencia,'Procedente');
assert.ok(mov.rows.some(x=>x[3]==='Ajuste do corte'));assert.equal(atd.rows[c40][3],'Em andamento');
r=run('compararComControleAntigoCampo40()');assert.equal(r.aAjustar.length,0,'repetir não acha nada novo');
console.log('PASS: corte — comparação sem alterar, piso de numeração, ajuste só onde a Base não foi movimentada.');
console.log('PASS: painel com Ver · Baixar da ficha oficial e aba CPT • Fichas oficiais com todos os casos (PDF novo ou da ficha antiga).');
console.log('PASS: retornos da engenharia viram movimentações com a regra da Central; abertura pela engenharia ganha protocolo; lista do formulário e ordens em aberto vêm da Base; avisos só após ativar, sem repetir; idempotente.');
