// Sincronização do RDAS pelo Campo 4.0 (serviços Google simulados). node campo40/testes/rdas.cjs
// Prova de compatibilidade: a aba gerada é lida pelos leitores REAIS instalados hoje
// (Painel do RDAS 1.2 e Painel de Gestão 3.2), copiados em legado/rdas/instalado_2026-10 e legado/gestao.
process.env.TZ='America/Sao_Paulo';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const props=new Map([['CAMPO40_INSTALACAO',JSON.stringify({pronto:true,baseId:'BASE40',formId:'F'})]]);
// ---------- Planilha simulada (grade de valores, links e mesclagens) ----------
const A1=a=>{const m=a.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/),col=s=>[...s].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);return {r:+m[2],c:col(m[1]),n:m[3]?+m[4]-+m[2]+1:1,m:m[3]?col(m[3])-col(m[1])+1:1};};
class Sheet{constructor(name,id){this.name=name;this.id=id;this.v={};this.link={};this.rows=200;this.cols=12;this.imgs=[];this.notes={};this.heights={};}
  key(r,c){return r+','+c}getName(){return this.name}getSheetId(){return this.id}getMaxRows(){return this.rows}getMaxColumns(){return this.cols}getIndex(){return this.book.sheets.indexOf(this)+1}
  insertRowsAfter(_,n){this.rows+=n}insertColumnsAfter(_,n){this.cols+=n}getLastRow(){let m=0;Object.keys(this.v).forEach(k=>{if(this.v[k]!==''&&this.v[k]!=null)m=Math.max(m,+k.split(',')[0]);});return m;}
  setColumnWidth(){}getColumnWidth(){return 105}setRowHeights(r,n,h){for(let i=0;i<n;i++)this.heights[r+i]=h;}setRowHeight(r,h){this.heights[r]=h}getRowHeight(r){return this.heights[r]||24}
  setTabColor(){}setHiddenGridlines(){}setFrozenRows(){}setFrozenColumns(){}getFilter(){return null}setConditionalFormatRules(){}clear(){this.v={};this.link={};this.notes={};}
  getImages(){return this.imgs.slice()}insertImage(blob){const s=this,img={w:800,h:600,getWidth:()=>img.w,getHeight:()=>img.h,setWidth(w){img.w=w;return img},setHeight(h){img.h=h;return img},setAnchorCell(){return img},setAnchorCellXOffset(){return img},setAnchorCellYOffset(){return img},setAltTextTitle(){return img},setAltTextDescription(){return img},remove(){s.imgs=s.imgs.filter(x=>x!==img)}};s.imgs.push(img);return img;}
  getRange(a,b,c,d){const g=typeof a==='string'?A1(a):{r:a,c:b,n:c||1,m:d||1},s=this;let px;
    const api={merge:()=>px,breakApart:()=>px,setValue:x=>{s.v[s.key(g.r,g.c)]=x;delete s.link[s.key(g.r,g.c)];return px},getValue:()=>s.v[s.key(g.r,g.c)]??'',
      setValues:rows=>{rows.forEach((row,i)=>row.forEach((x,j)=>s.v[s.key(g.r+i,g.c+j)]=x));return px},
      getValues:()=>Array.from({length:g.n},(_,i)=>Array.from({length:g.m},(_,j)=>s.v[s.key(g.r+i,g.c+j)]??'')),
      setNote:t=>{s.notes[s.key(g.r,g.c)]=t;return px},getCell:(i,j)=>s.getRange(g.r+i-1,g.c+j-1),
      setRichTextValue:rt=>{s.v[s.key(g.r,g.c)]=rt.text;if(rt.url)s.link[s.key(g.r,g.c)]=rt.url;return px},
      setRichTextValues:rows=>{rows.forEach((row,i)=>row.forEach((rt,j)=>{s.v[s.key(g.r+i,g.c+j)]=rt.text;if(rt.url)s.link[s.key(g.r+i,g.c+j)]=rt.url;}));return px},
      getRichTextValues:()=>Array.from({length:g.n},(_,i)=>Array.from({length:g.m},(_,j)=>{const k=s.key(g.r+i,g.c+j),url=s.link[k]||null;return {getLinkUrl:()=>url,getRuns:()=>[],getText:()=>String(s.v[k]??'')};}))};
    px=new Proxy(api,{get:(t,k)=>k in t?t[k]:()=>px});return px;}}
class Book{constructor(id,sheets){this.id=id;this.sheets=sheets;sheets.forEach(s=>s.book=this);this.active=null;}getId(){return this.id}getName(){return 'RDAS'}getSheets(){return this.sheets}getSheetByName(n){return this.sheets.find(s=>s.name===n)||null}
  insertSheet(n){const s=new Sheet(n,1000+this.sheets.length);s.book=this;this.sheets.push(s);return s}getSpreadsheetTimeZone(){return 'America/Sao_Paulo'}setActiveSheet(s){this.active=s}moveActiveSheet(i){this.sheets=this.sheets.filter(x=>x!==this.active);this.sheets.splice(i-1,0,this.active);}}
// ---------- Dados: Campo 4.0 (Registros) e Procedimentos 3.0 (formulário) ----------
const cab40=['ID','Procedimento','Data do procedimento','Mês','Carimbo do envio','Origem','ID legado','Bairro','Bairro ID','Obra de referência','Obra ID','Responsável','Área','Atividade','Público informado','Protocolo informado','Situação do vínculo','Pesquisa','Conferência dos campos','Hash','Detalhes JSON'];
const campo=(titulo,valor,tipo)=>({titulo,valor,tipo:tipo||'TEXT'});
const reg40=(id,dia,ativ,pub,entrada,fotos,extra=[])=>[id,'Relato de atividade',new Date(dia+'T12:00:00Z'),dia.slice(0,7),new Date(dia+'T20:00:00Z'),'Procedimentos de Campo 4.0','resp-'+id,'Vila Linda','BAI-1','Viela Carijós [OBR-0117]','OBR-0117','Ana Souza','Socioambiental',ativ,pub,'','','','','',
  JSON.stringify({campos:[campo('Selecione o procedimento a ser executado','Relato de atividade'),campo('Atividade realizada',ativ),campo('Complemento da atividade','Oficina de horta'),campo('Endereço da frente de serviço','Rua Carijós, 100'),
    campo('Horário de entrada na atividade',entrada),campo('Horário de saída na atividade','11:30'),campo('Clima e tempo durante a atividade','Ensolarado'),campo('Classificação da atividade','Externa'),
    campo('Público-alvo da atividade','Moradores'),campo('Como você chegou à atividade?','Carro'),campo('Quantas pessoas estavam no veículo com você no início dessa atividade?','2'),
    campo('Quantidade de panfletos entregues','30'),campo('Houve interrupção da atividade?','Não'),campo('Objetivo da atividade','Ensinar compostagem.'),campo('Relato da atividade','Oficina com 12 moradores na praça.'),
    campo('Adicione até 5 fotos com timestamp da atividade',fotos.map(f=>'https://drive.google.com/open?id='+f),'FILE_UPLOAD'),...extra],
    anexos:fotos.map(f=>({arquivoId:f,url:'https://drive.google.com/file/d/'+f+'/view'}))})];
const registros=new Sheet('Registros',1);
const linhas40=[cab40,reg40('REG-abcdef0123456789abcdef01','2026-10-06','Ação Social Externa',12,'09:00',['FOTO000000000000000000001','FOTO000000000000000000002','FOTO000000000000000000003']),
  reg40('REG-0011223344556677889900aa','2026-10-06','DDS',8,'07:30',[]),reg40('REG-ffeeddccbbaa998877665544','2026-10-03','Ação Social Externa',5,'14:00',['FOTO000000000000000000009']),
  ['REG-migrado','Relato de atividade',new Date('2026-09-29T12:00:00Z'),'2026-09','', 'Procedimentos de Campo 3.0','REL-192','Cata Preta','','','','','','x',5,'','','','','','{}']];
linhas40.forEach((row,i)=>row.forEach((x,j)=>registros.v[(i+1)+','+(j+1)]=x));
const cab30=['Carimbo de data/hora','Selecione o procedimento a ser executado','Data de realização do procedimento','Atividade realizada','Complemento da atividade','Título da frente de serviço','Endereço da frente de serviço','Colaborador responsável pelo registro','Total de participantes','Classificação da atividade','Horário de entrada na atividade','Relato da atividade','Adicione até 5 fotos com timestamp da atividade'];
const forms30=new Sheet('Respostas ao formulário 1',2);
[cab30,[new Date('2026-10-03T13:00:00Z'),'Relato de atividade','03/10/2026','Realização de CAO','Reunião','Coletor A','Rua X','Bia',20,'Externa','08:00','CAO com lideranças.','https://drive.google.com/open?id=FOTO30000000000000000001']].forEach((row,i)=>row.forEach((x,j)=>forms30.v[(i+1)+','+(j+1)]=x));
forms30.getDataRange=function(){return this.getRange(1,1,2,cab30.length);};
const rdas=new Book('RDAS',[new Sheet('RDAS 29-09-2026',50)]);rdas.sheets[0].v['1,1']='RELATO DIÁRIO (3.0, intocado)';
const books={BASE40:new Book('BASE40',[registros]),RDAS:rdas,P30:new Book('P30',[forms30])};
const ctx={console:{log(){},warn(){},error(){}},JSON,Date,Math,
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}}),getUserLock:()=>({tryLock:()=>true,releaseLock(){}})},
  SpreadsheetApp:{openById:id=>{const k={'176BymNYBSfVt7iQrkNR-IyT_NXdB9GC999mX9C2WtK4':'RDAS','1_6BKqeVbjzKm_hYdRsneU3YqEmd1rOWaVGCiV0LXtgQ':'P30'}[id]||id;if(!books[k])throw Error('sem acesso');return books[k];},
    newTextStyle:()=>new Proxy({build:()=>({})},{get:(t,k)=>k==='build'?t.build:function(){return this;}}),
    newRichTextValue:()=>{const o={text:'',url:null,setText(t){o.text=t;return o},setLinkUrl(u){o.url=u;return o},setTextStyle(){return o},build(){return {text:o.text,url:o.url}}};return o;},
    BorderStyle:{SOLID:1,SOLID_MEDIUM:2}},
  DriveApp:{getFileById:id=>({getId:()=>id,getMimeType:()=>'image/jpeg',getSize:()=>500000,getResourceKey:()=>'',getBlob:()=>({getBytes:()=>{const b=new Array(30).fill(0);b[0]=255;b[1]=216;b[2]=255;b[3]=192;b[4]=0;b[5]=17;b[6]=8;b[7]=2;b[8]=88;b[9]=3;b[10]=32;return b;},getContentType:()=>'image/jpeg',setContentType(){}}),getThumbnail:()=>null})},
  Utilities:{formatDate:(d,_,f)=>{const p=n=>String(n).padStart(2,'0'),y=d.getFullYear(),m=p(d.getMonth()+1),dd=p(d.getDate());return f==='yyyy-MM-dd'?y+'-'+m+'-'+dd:f==='dd-MM-yyyy'?dd+'-'+m+'-'+y:f==='dd/MM/yyyy'?dd+'/'+m+'/'+y:d.toISOString();}}};
vm.createContext(ctx);
for(const f of ['ConfiguracaoDaBase','RepositorioDosRegistros','SincronizacaoDoRDAS'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f+'.gs'),'utf8'),ctx);
const run=s=>{const x=vm.runInContext(s,ctx);return x===undefined?x:JSON.parse(JSON.stringify(x));};
// 1. Leitura do Campo 4.0: campos pelos títulos do formulário 4.0, fotos pelos anexos, ID curto, só origem 4.0.
const r40=run("SincronizacaoDoRDAS.relatos40(null)");assert.equal(r40.length,3,'migrados do 3.0 ficam com a sincronização antiga');
const a=r40.find(x=>x.id==='R4-ABCDEF');assert.ok(a);assert.equal(a.local,'Viela Carijós | Rua Carijós, 100');assert.equal(a.atividadeCompleta,'Ação Social Externa - Oficina de horta');
assert.equal(a.deslocamento,'Carro');assert.equal(a.pessoasVeiculo,2);assert.equal(a.periodo,'Manhã');assert.equal(a.duracao,'02h30');assert.equal(a.fotos.length,3);assert.equal(a.panfletos,30);
// 2. Dia só do Campo 4.0 (a partir de 05/10): tabela em ordem de horário, fichas, fotos, links.
let r=run("SincronizacaoDoRDAS.atualizarDia('2026-10-06')");assert.equal(r.relatos,2);assert.equal(r.midias,3);assert.equal(r.previasInseridas,3);assert.equal(r.falhas,0);
const aba=rdas.getSheetByName('RDAS 06-10-2026');assert.ok(aba);assert.equal(rdas.sheets[0].name,'RDAS 06-10-2026','mais recente primeiro');
assert.match(aba.v['3,1'],/Procedimentos de Campo 4\.0/);assert.equal(aba.v['21,1'],'R4-001122','DDS 07:30 vem antes');assert.equal(aba.v['9,1'],2);assert.equal(aba.v['9,3'],20);
const fichaDDS=Object.keys(aba.v).find(k=>/^FICHA 1 DE 2 \| R4-001122 \| DDS/.test(aba.v[k]));assert.ok(fichaDDS);assert.equal(aba.link['21,1'],'#gid='+aba.id+'&range=A'+fichaDDS.split(',')[0],'ID leva à ficha');
const legenda=Object.keys(aba.v).filter(k=>/^Foto \d de 3 \| 06\/10\/2026 \| R4-ABCDEF/.test(aba.v[k]));assert.equal(legenda.length,3);assert.ok(aba.link[legenda[0]].startsWith('https://drive.google.com/'));
assert.ok(Object.values(aba.v).some(v=>/^3 fotos deste relato/.test(v)));assert.equal(aba.imgs.length,3);
// 3. Compatibilidade com o Painel do RDAS 1.2 (Visão executiva) — mesmo leitor instalado na planilha.
const painel=fs.readFileSync(path.join(__dirname,'../../legado/rdas/instalado_2026-10/Painel_RDAS.gs'),'utf8');
const pegar=(src,nome)=>{const i=src.indexOf('function '+nome+'(');assert.ok(i>=0,nome);let n=0,j=src.indexOf('{',i);for(;j<src.length;j++){if(src[j]==='{')n++;else if(src[j]==='}'&&--n===0)break;}return src.slice(i,j+1);};
const leitor=vm.createContext({console,Utilities:ctx.Utilities,Session:{getScriptTimeZone:()=>'America/Sao_Paulo'}});
['rdasvLerDiaCompleto_','rdasvLerTabela_','rdasvLerFicha_','rdasvRelatoDaTabela_','rdasvLinksDaFicha_','rdasvAgrupar_','rdasvTextoOcorrencia_','rdasvValor_','rdasvData_','rdasvDataDoNome_','rdasvFormatarData_','rdasvDiaSemana_','rdasvNumero_','rdasvSeparar_','rdasvUnicos_','rdasvNormalizar_','rdasvEhAusente_','rdasvExibir_','rdasvContarMidiasNaAba_','rdasvResumoAba_']
  .forEach(n=>vm.runInContext(pegar(painel,n),leitor));
leitor.aba=aba;leitor.arquivo=rdas;const dia=JSON.parse(JSON.stringify(vm.runInContext("rdasvLerDiaCompleto_(arquivo,aba,'America/Sao_Paulo')",leitor)));
assert.equal(dia.totalExecucoes,2);assert.equal(dia.participantes,20);assert.equal(dia.relatos.length,2);assert.equal(dia.midias,3);
const lido=dia.relatos.find(x=>x.id==='R4-ABCDEF');assert.equal(lido.local,'Viela Carijós | Rua Carijós, 100');assert.equal(lido.bairro,'Vila Linda');assert.equal(lido.relato,'Oficina com 12 moradores na praça.');
assert.equal(lido.objetivo,'Ensinar compostagem.');assert.equal(lido.fotos.length,3);assert.match(lido.fotos[0].rotulo,/^Foto 1 de 3/);assert.equal(lido.deslocamento,'Carro');assert.equal(lido.panfletos,30);
const resumo=JSON.parse(JSON.stringify(vm.runInContext("rdasvResumoAba_(aba,'America/Sao_Paulo')",leitor)));assert.equal(resumo.execucoes,2);assert.equal(resumo.midias,3);
// 4. Compatibilidade com o Painel de Gestão 3.2 (leitura do RDAS na visão executiva).
const gestao=fs.readFileSync(path.join(__dirname,'../../legado/gestao/Painel_Gestao_3_2_Completo.gs'),'utf8');
const lg=vm.createContext({PG:{RDAS:'RDAS'},console});['pgTexto_','pgNorm_','pgLink_','cptfReferencia_','pgExtrairDiaRDAS_'].forEach(n=>vm.runInContext(pegar(gestao,n),lg));
const linhas=aba.getRange(1,1,aba.getLastRow(),12).getValues(),links=linhas.map((row,i)=>row.map((_,j)=>aba.link[(i+1)+','+(j+1)]||'').filter(Boolean));
lg.v=linhas;lg.l=links;const g=JSON.parse(JSON.stringify(vm.runInContext("pgExtrairDiaRDAS_(v,l,"+aba.id+",'RDAS 06-10-2026')",lg)));
assert.equal(g.dia,'2026-10-06');assert.equal(g.relatos.length,2);const gr=g.relatos.find(x=>x.id==='R4-ABCDEF');
assert.equal(gr.atividade,'Ação Social Externa - Oficina de horta');assert.equal(gr.equipe,'Ana Souza');assert.equal(gr.relato,'Oficina com 12 moradores na praça.');assert.equal(gr.fotos.length,3,'links internos do ID não contam como foto');
// 5. Dia anterior ao corte: junta o relato atrasado do 4.0 com o do formulário 3.0 (sem perder o que já estava).
r=run("SincronizacaoDoRDAS.atualizarDia('2026-10-03')");assert.equal(r.relatos,2);const a3=rdas.getSheetByName('RDAS 03-10-2026');
assert.match(a3.v['3,1'],/3\.0 e 4\.0/);assert.deepEqual([a3.v['21,1'],a3.v['22,1']],['REL-002','R4-FFEEDD'],'IDs do 3.0 preservados, ordem por horário');
// 6. Dia sem relato: nada é apagado. Aba do 3.0 intocada. Fila de pendentes.
r=run("SincronizacaoDoRDAS.atualizarDia('2026-09-29')");assert.equal(r.relatos,0);assert.equal(rdas.getSheetByName('RDAS 29-09-2026').v['1,1'],'RELATO DIÁRIO (3.0, intocado)');
run("SincronizacaoDoRDAS.marcarPendente('2026-10-06')");run("SincronizacaoDoRDAS.marcarPendente('2026-10-06')");assert.deepEqual(JSON.parse(props.get('RDAS_DIAS_PENDENTES')),['2026-10-06']);
r=run("SincronizacaoDoRDAS.processarPendentes()");assert.equal(r.resultado,'RDAS ATUALIZADO');assert.deepEqual(JSON.parse(props.get('RDAS_DIAS_PENDENTES')),[]);
props.set('RDAS_SO_CAMPO40','2026-10-01');r=run("SincronizacaoDoRDAS.atualizarDia('2026-10-03')");assert.equal(r.relatos,1,'depois do corte configurado, só o 4.0');
console.log('PASS: RDAS pelo Campo 4.0 — campos do formulário 4.0, fotos e IDs; aba no layout 1.5 lida pelo Painel do RDAS e pelo Painel de Gestão reais; ID leva à ficha; fotos maiores com legenda curta e link; dia antigo junta 3.0 e 4.0; nada apagado sem relato; fila sem repetição.');
