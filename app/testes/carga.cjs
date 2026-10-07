// Medidor de carga do servidor com volume realista e dados fictícios: conta, por função, as chamadas ao Google (planilha,
// Drive, cache, propriedades) e as células lidas, com o cache frio (primeiro acesso) e quente (acessos seguintes).
// No Apps Script cada chamada à planilha custa ~50–300 ms; o "tempo estimado" é só para comparar funções entre si.
//   node app/testes/carga.cjs            → tabela
//   node app/testes/carga.cjs --conferir → falha se uma função passar do orçamento (cache quente)
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),zlib=require('zlib');
const N_REG=+process.env.N_REG||4000,N_ATD=+process.env.N_ATD||900,N_MOV=+process.env.N_MOV||2500;
let email='victor@example.com',locked=false;const GRANDES=new Set();const C={};const zera=()=>{for(const k of ['planilha','abrir','celulas','drive','cache','prop','escrita'])C[k]=0;};zera();
const pessoa=(e,n,p)=>['CPT_PESSOA:'+e,JSON.stringify({email:e,nome:n,papeis:p,ativo:true,versao:1})];
const props=new Map([['CPT_APLICACAO_1',JSON.stringify({baseId:'base',administrador:'victor@example.com',agendaId:'agenda',versao:'2.46.0'})],['CPT_TRAVA_CONFIG','liberada'],
  pessoa('victor@example.com','Victor',['administrador']),pessoa('gestao@example.com','Gestão Fictícia',['gestao']),pessoa('social@example.com','Ana Fictícia',['socioambiental']),
  pessoa('atd@example.com','Bia Fictícia',['atendimento']),pessoa('com@example.com','Rui Fictício',['comunicacao'])]);
// ---------- planilhas simuladas com contadores ----------
const chain=()=>new Proxy(function(){},{get:(t,k)=>k==='then'?undefined:chain(),apply:()=>chain()});
class Sheet{constructor(n,rows=[]){this.name=n;this.rows=rows;}getName(){return this.name}setName(n){this.name=n;return this}getSheetId(){return 1}
  getLastRow(){C.planilha++;return this.rows.length}getMaxColumns(){C.planilha++;return 40}getLastColumn(){C.planilha++;return 30}setFrozenRows(){}insertColumnsAfter(){}getColumnWidth(){return 100}setColumnWidth(){}
  appendRow(r){C.planilha++;C.escrita++;this.rows.push(r)}insertRowAfter(){C.planilha++;}
  getRange(r,c,n=1,m=1){if(typeof r==='string')return chain();const s=this;const vals=()=>{C.planilha++;C.celulas+=n*m;return Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.rows[r+i-1]?.[c+j-1]??''));};let px;
    const api={getValues:vals,getValue:()=>vals()[0][0],getDisplayValues:()=>vals().map(l=>l.map(String)),getFormulas:()=>{C.planilha++;return Array.from({length:n},()=>Array(m).fill(''));},getNotes:()=>{C.planilha++;return Array.from({length:n},()=>Array(m).fill(''));},
      setValues:v=>{C.planilha++;C.escrita++;v.forEach((row,i)=>{while(s.rows.length<r+i)s.rows.push([]);row.forEach((x,j)=>s.rows[r+i-1][c+j-1]=x)});return px},setValue:x=>{C.planilha++;C.escrita++;while(s.rows.length<r)s.rows.push([]);s.rows[r-1][c-1]=x;return px},
      getMergedRanges:()=>[],getNumRows:()=>n,getNumColumns:()=>m,getRow:()=>r,getColumn:()=>c};
    px=new Proxy(api,{get:(t,k)=>k in t?t[k]:()=>px});return px;}}
class Book{constructor(id,sheets){this.id=id;this.sheets=sheets}getId(){return this.id}getName(){return this.id}getUrl(){return 'https://docs.google.com/spreadsheets/d/'+this.id}getSheets(){return this.sheets}
  getSheetByName(n){C.planilha++;return this.sheets.find(s=>s.name===n)||null}insertSheet(n){const a=new Sheet(n);this.sheets.push(a);return a}getSpreadsheetTimeZone(){return 'America/Sao_Paulo'}}
// ---------- base fictícia com volume ----------
const rnd=(()=>{let s=42;return ()=>(s=(s*1103515245+12345)%2147483648)/2147483648;})(),pick=l=>l[Math.floor(rnd()*l.length)];
const hoje=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date()),dia=k=>{const d=new Date(hoje+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-k);return d;};
const iso=d=>d.toISOString().slice(0,10),texto=n=>Array.from({length:n},()=>pick(['moradores','obra','rua','equipe','conversa','calçada','esgoto','orientação','visita','comércio','escola'])).join(' ');
const obras=Array.from({length:30},(_,i)=>{const r=Array(37).fill('');r[0]='OBR-'+String(i+1).padStart(4,'0');r[1]='Obra Fictícia '+(i+1);r[2]='Bairro '+(i%12+1);r[3]=true;r[19]=pick(['Em andamento','Em andamento','Paralisada','Finalizada']);r[20]=dia(300);return r;});
const colReg=['ID','Procedimento','Data do procedimento','Mês','Carimbo do envio','Origem','ID legado','Bairro','Bairro ID','Obra de referência','Obra ID','Responsável','Área','Atividade','Público informado','Protocolo informado','Situação do vínculo','Pesquisa','Conferência dos campos','Hash','Detalhes JSON'];
const nomes=['Ana Fictícia','Bia Fictícia','Rui Fictício','Caio Fictício','Duda Fictícia'];
const registros=[colReg].concat(Array.from({length:N_REG},(_,i)=>{const d=dia(Math.floor(i*540/N_REG)),p=pick(['Relato de atividade','Relato de atividade','Pesquisa de Satisfação','Acompanhamento de Vistoria Cautelar','Relato de atividade','Diagnóstico de Área']),o=pick(obras);
  const ativ=p==='Relato de atividade'?pick(['Ação Social Externa','DDS','Sensibilização em frente de obra','Articulação Institucional','Tenda informativa']):'';
  const campos=[{titulo:'Relato da atividade',valor:texto(60)},{titulo:'Objetivo da atividade',valor:texto(12)},{titulo:'Colaboradores de apoio na atividade',valor:pick(nomes)},{titulo:'Fotos',valor:'https://drive.google.com/open?id=FOTO'+String(i).padStart(26,'0')}];
  return ['REG-'+crypto.createHash('md5').update('r'+i).digest('hex').slice(0,24),p,d,iso(d).slice(0,7),d,'4.0','',o[2],'BAI-001',o[1]+' ['+o[0]+']',o[0],pick(nomes),'Social',ativ,p==='Relato de atividade'?String(Math.floor(rnd()*40)):'','','','','','h'+i,JSON.stringify({campos})];}).reverse());
const colAtd=['Protocolo','Protocolo principal','Situação do protocolo','Status','Data de abertura','Data de conclusão','Nome','Assunto','Endereço','Frente de obra','Área responsável','Responsável','Próxima ação','Atualização operacional','Documento','PDF','Origem','Pesquisa','Hash','Detalhes JSON'];
const atds=[colAtd].concat(Array.from({length:N_ATD},(_,i)=>{const ab=dia(Math.floor(i*500/N_ATD)),fim=rnd()<.7,p='ATD'+iso(ab).slice(0,4)+String(i+1).padStart(4,'0');
  return [p,p,'',fim?'Concluído':'Em andamento',ab,fim?dia(Math.max(0,Math.floor(i*500/N_ATD)-5)):'','Morador Fictício '+i,pick(['Calçada quebrada','Vazamento','Elogio','Poeira']),'Rua Fictícia, '+i,pick(obras)[1],'Atendimento','',texto(6),'','','','CAC','','h'+i,JSON.stringify({tipo:pick(['Reclamação','Elogio','Solicitação']),descricao:texto(40)})];}));
const movs=[['ID','Protocolo','Data','Tipo','Status','Autor','Texto','Origem','Anexo','Detalhes JSON']].concat(Array.from({length:N_MOV},(_,i)=>['MOV-'+i,atds[1+i%N_ATD][0],dia(i%400),'Atualização','Em andamento','Fulano',texto(20),'Campo','','{}']));
const base=new Book('base',[new Sheet('Registros',registros),new Sheet('Atendimentos',atds),new Sheet('Movimentações',movs),new Sheet('Obras',[['ID da obra','Nome']].concat(obras)),
  new Sheet('Bairros',[['ID','Nome','No formulário?','Município','Tipo']].concat(Array.from({length:12},(_,i)=>['BAI-'+i,'Bairro '+(i+1),true,'SA','Bairro'])))]);
const agenda=new Book('agenda',[new Sheet('Eventos',[['ID','Versão','Operação ID','Alterado em','Alterado por','Conteúdo JSON']].concat(Array.from({length:600},(_,i)=>{const d=iso(dia(i%120-30));return ['EVT-'+i,1,'OP-x'+i,'','',JSON.stringify({id:'EVT-'+i,versao:1,titulo:'Atividade '+i,data:d,inicio:'09:00',fim:'11:00',tipo:'interno',equipe:[pick(nomes)],responsaveis:['social@example.com'],situacao:'confirmada'})];})))]);
const books=new Map([['base',base],['agenda',agenda]]),cacheMap=new Map();
const blob=(bytes)=>({getBytes:()=>[...bytes],getDataAsString:()=>Buffer.from(bytes).toString('utf8')});
const ctx={Date,console:{log(){},warn(){},error(){}},JSON,Math,Session:{getActiveUser:()=>({getEmail:()=>email}),getEffectiveUser:()=>({getEmail:()=>'victor@example.com'})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>{C.prop++;return Object.fromEntries(props);},getProperty:k=>{C.prop++;return props.get(k)??null;},setProperty:(k,v)=>{C.prop++;props.set(k,v);},deleteProperty:k=>{C.prop++;props.delete(k);},getKeys:()=>{C.prop++;return [...props.keys()];}}),getUserProperties:()=>({getProperty:()=>null,setProperty(){}})},
  SpreadsheetApp:{openById:id=>{C.abrir++;if(!books.has(id))throw Error('Não existe');return books.get(id)},flush(){}},
  DriveApp:{getFileById:id=>{C.drive++;throw Error('sem acesso');},getFolderById:id=>{C.drive++;throw Error('sem pasta');},createFolder:()=>{C.drive++;return chain();},getFoldersByName:()=>{C.drive++;return {hasNext:()=>false};},searchFiles:()=>{C.drive++;return {hasNext:()=>false};}},
  CacheService:{getScriptCache:()=>({get:k=>{C.cache++;return cacheMap.get(k)??null;},put:(k,v)=>{C.cache++;if(Buffer.byteLength(v)>95000){GRANDES.add(k.split(':').slice(0,2).join(':')+' ('+Math.round(Buffer.byteLength(v)/1000)+' KB)');throw Error('Argument too large');}cacheMap.set(k,v);},remove:k=>{C.cache++;cacheMap.delete(k);},getAll:ks=>{C.cache++;return Object.fromEntries(ks.filter(k=>cacheMap.has(k)).map(k=>[k,cacheMap.get(k)]));},putAll:o=>{C.cache++;Object.entries(o).forEach(([k,v])=>cacheMap.set(k,v));},removeAll:ks=>{C.cache++;ks.forEach(k=>cacheMap.delete(k));}}),getUserCache:()=>({get:()=>null,put(){}})},
  Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:(d,_,f)=>{const s=new Date(d.getTime()-3*3600e3).toISOString();return f.replace('yyyy',s.slice(0,4)).replace('MM',s.slice(5,7)).replace('dd',s.slice(8,10)).replace('HH',s.slice(11,13)).replace('mm',s.slice(14,16)).replace('ss',s.slice(17,19));},
    newBlob:(d)=>blob(typeof d==='string'?Buffer.from(d,'utf8'):Buffer.from(d)),gzip:b=>blob(zlib.gzipSync(Buffer.from(b.getBytes()))),ungzip:b=>blob(zlib.gunzipSync(Buffer.from(b.getBytes()))),
    base64Encode:b=>Buffer.from(b).toString('base64'),base64Decode:s=>[...Buffer.from(s,'base64')],computeDigest:(_,s)=>[...crypto.createHash('sha256').update(String(s)).digest()],DigestAlgorithm:{SHA_256:'s'},Charset:{UTF_8:'u'},sleep(){}},
  LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},waitLock(){locked=true;},releaseLock:()=>locked=false,hasLock:()=>locked})},
  HtmlService:{createTemplateFromFile:()=>chain(),createHtmlOutputFromFile:()=>chain(),XFrameOptionsMode:{ALLOWALL:1}},ScriptApp:{getService:()=>({getUrl:()=>'https://script.google.com/x'}),getProjectTriggers:()=>[]},
  MailApp:{},GmailApp:{},DocumentApp:{},UrlFetchApp:{fetch:()=>{throw Error('sem rede');}}};
vm.createContext(ctx);
for(const f of fs.readdirSync(__dirname+'/../src').filter(f=>f.endsWith('.gs')).sort())vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f,'utf8'),ctx,{filename:f});
ctx.__GR=GRANDES;vm.runInContext("{const g=CacheCPT.gravar.bind(CacheCPT);CacheCPT.gravar=function(k,v,t){let s=JSON.stringify(v);if(s.length>CacheCPT.comprimirAcima)s=CacheCPT.comprimir(s);if(s.length>=95000)__GR.add(String(k).split(':').slice(0,2).join(':')+' ('+Math.round(s.length/1000)+' mil caracteres)');return g(k,v,t);};}",ctx);
const mes=hoje.slice(0,7);
// Funções lidas pelas telas, na ordem em que a aplicação abre.
const FUNCOES=[['carregarPerfilCPT()',null],['carregarMeuEspacoCPT({})',null],['missoesCPT()',null],['carregarInicioCPT({mes})',null],['alertasGestaoCPT()',null],['carregarCronogramaCPT({mes})',null],
  ['buscarRegistrosCPT({mes})',null],['buscarAtendimentosCPT({})',null],['carregarRelatosCPT({mes})',null],['listarRelatosRelatorioCPT({mes})',null],['listarDiagnosticosCPT()',null],
  ['carregarPainelGestaoCPT({mes})',null],['carregarRelatosResumoCPT(mes)',null],['qualidadeRelatosCPT({mes})',null],['listarObrasCPT()',null],['listarContatosCPT()',null],['listarNotasGraficosCPT()',null],
  ['estadoFichasCPT()',null],['auditarAtendimentosCPT({mes})',null],['controleContratoCPT({mes})',null],['carregarMapaCPT({mes})',null],['listarGaleriaCPT({mes})',null],['listarRecadosCPT()',null],['contarAvisosCPT()',null],
  ['mensagemDiaCPT()',null],['listarMatrizCPT()',null],['carregarOrganogramaCPT()',null],['listarLevantamentoCPT()',null],['listarVinculosObraCPT()',null],['compararObrasDoMesCPT(mes)',null]];
const est=c=>Math.round(c.abrir*150+(c.planilha-c.abrir)*70+c.celulas*0.004+c.drive*150+c.cache*12+c.prop*6);
const medir=(f,perfil)=>{email=perfil;zera();let erro='';const t=Date.now();try{vm.runInContext('var mes='+JSON.stringify(mes)+';'+f,ctx);}catch(e){erro=e.message.slice(0,90);}return {...C,ms:Date.now()-t,est:est(C),erro};};
const linhas=[];
for(const perfil of ['victor@example.com','atd@example.com']){
  cacheMap.clear();
  for(const [f] of FUNCOES){const frio=medir(f,perfil),quente=medir(f,perfil);linhas.push({perfil:perfil.split('@')[0],f:f.replace(/\(.*$/,''),frio,quente});}
}
const pad=(s,n)=>String(s).padEnd(n).slice(0,n),num=(s,n)=>String(s).padStart(n);
if(!process.argv.includes('--conferir')){console.log(`Base fictícia: ${N_REG} registros, ${N_ATD} atendimentos, ${N_MOV} movimentações. Frio = primeiro acesso; quente = seguinte.`);
console.log(pad('perfil',7)+pad('função',30)+num('frio:planilha',14)+num('células',9)+num('cache',6)+num('prop',6)+num('estim.ms',9)+' |'+num('quente:planilha',16)+num('cache',6)+num('prop',6)+num('estim.ms',9)+'  erro');
linhas.forEach(l=>console.log(pad(l.perfil,7)+pad(l.f,30)+num(l.frio.planilha+'/'+l.frio.abrir,14)+num(l.frio.celulas,9)+num(l.frio.cache,6)+num(l.frio.prop,6)+num(l.frio.est,9)+' |'+num(l.quente.planilha,16)+num(l.quente.cache,6)+num(l.quente.prop,6)+num(l.quente.est,9)+'  '+(l.frio.erro||l.quente.erro)));}
// Orçamento (chamadas à planilha, cache quente; missões também frio). Folga de ~30% sobre o medido na 2.46.1.
const ORCAMENTO={carregarMeuEspacoCPT:3,missoesCPT:14,'missoesCPT:frio':65,carregarInicioCPT:10,alertasGestaoCPT:8,carregarCronogramaCPT:4,listarDiagnosticosCPT:9,'listarDiagnosticosCPT:frio':25,
  carregarPainelGestaoCPT:8,listarObrasCPT:10,listarContatosCPT:2,listarNotasGraficosCPT:2,listarRecadosCPT:2,contarAvisosCPT:2,mensagemDiaCPT:2,listarMatrizCPT:2,carregarMapaCPT:8,listarGaleriaCPT:4};
if(process.argv.includes('--conferir')){
  const falhas=[];
  linhas.forEach(l=>{const e=l.frio.erro||l.quente.erro;if(e&&!/(é|são|ficam com|feita pel)[^.]*(Gestão|Administrativo|Socioambiental)/.test(e))falhas.push(l.perfil+' '+l.f+': erro '+e);
    if(ORCAMENTO[l.f]!=null&&l.quente.planilha>ORCAMENTO[l.f])falhas.push(l.perfil+' '+l.f+': '+l.quente.planilha+' chamadas com cache (orçamento '+ORCAMENTO[l.f]+')');
    if(ORCAMENTO[l.f+':frio']!=null&&l.frio.planilha>ORCAMENTO[l.f+':frio'])falhas.push(l.perfil+' '+l.f+': '+l.frio.planilha+' chamadas sem cache (orçamento '+ORCAMENTO[l.f+':frio']+')');});
  if(GRANDES.size)falhas.push('valores grandes demais para o cache: '+[...GRANDES].join(', '));
  if(falhas.length){console.error('FALHA de desempenho:\n  '+falhas.join('\n  '));process.exit(1);}
  console.log('PASS: carga — '+linhas.length+' consultas com '+N_REG+' registros fictícios dentro do orçamento de chamadas (Meu espaço, missões, diagnósticos, coleções…), sem erros e sem valores fora do cache.');
}
if(GRANDES.size)console.log('Grandes demais para o cache (recalculados a cada chamada): '+[...GRANDES].join(', '));
module.exports={linhas};
