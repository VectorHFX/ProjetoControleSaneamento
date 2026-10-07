// Relatos para o relatório (2.48, como na Central) com base, Drive e Docs simulados e dados fictícios: tipos elegíveis,
// pendente → revisado, relato no layout da Central (faixa, quadro de 6 linhas, seções só com texto, até 2 fotos lado a lado com
// legenda; foto que não abre vira aviso), FINAL e ORIGINAL em Docs + PDF na pasta do mês, revisar de novo refaz só o FINAL e
// guarda o anterior, compatibilidade com revisões da 2.43, "mudou na origem", permissões e prompt. node app/testes/relatos_relatorio.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
let email='social@example.com',locked=false;
const props=new Map([['CPT_APLICACAO_1',JSON.stringify({baseId:'base',administrador:'victor@example.com',agendaId:'agenda-0123456789',versao:'2.43.0'})],
  ['CPT_PESSOA:social@example.com',JSON.stringify({email:'social@example.com',nome:'Social Fictícia',papeis:['socioambiental'],ativo:true,versao:1})],
  ['CPT_PESSOA:atd@example.com',JSON.stringify({email:'atd@example.com',nome:'Atd',papeis:['atendimento'],ativo:true,versao:1})]]);
const fmt=(d,_,f)=>{const s=new Date(d.getTime()-3*3600e3).toISOString();return f.replace('yyyy',s.slice(0,4)).replace('MM',s.slice(5,7)).replace('dd',s.slice(8,10)).replace('HH',s.slice(11,13)).replace('mm',s.slice(14,16));};
class Sheet{constructor(n,rows=[]){this.name=n;this.rows=rows;}getName(){return this.name}getLastRow(){return this.rows.length}setFrozenRows(){}appendRow(r){this.rows.push(r)}
  getRange(r,c,n=1,m=1){const s=this;let px;const api={getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.rows[r+i-1]?.[c+j-1]??'')),getValue:()=>api.getValues()[0][0],
    setValues:v=>{v.forEach((row,i)=>{while(s.rows.length<r+i)s.rows.push([]);row.forEach((x,j)=>s.rows[r+i-1][c+j-1]=x)});return px}};px=new Proxy(api,{get:(t,k)=>k in t?t[k]:()=>px});return px;}}
class Book{constructor(id,sheets){this.id=id;this.sheets=sheets}getId(){return this.id}getSheetByName(n){return this.sheets.find(s=>s.name===n)||null}insertSheet(n){const a=new Sheet(n);this.sheets.push(a);return a}getSpreadsheetTimeZone(){return 'America/Sao_Paulo'}}
// ---- Docs simulado (documento criado do zero): corpo = lista de {tipo:'P',texto,titulo} | {tipo:'T',linhas:[[{texto,imagens,pars}]]} ----
const docs=new Map();let seq=0;const novoId=p=>p+String(++seq).padStart(24,'0');
const chain=o=>new Proxy(o,{get:(t,k)=>k in t?t[k]:()=>chain(o)});
const par=(lista,t)=>{const e={tipo:'P',texto:String(t),titulo:false};lista.push(e);const api=chain({setHeading:()=>{e.titulo=true;return api;},editAsText:()=>chain({}),setSpacingAfter:()=>api,setSpacingBefore:()=>api,setLineSpacing:()=>api,setAlignment:()=>api});return api;};
function corpo(lista){
  const celula=x=>chain({getChild:()=>chain({asParagraph:()=>chain({appendInlineImage:b=>{x.imagens.push(b.nome);return chain({getWidth:()=>800,getHeight:()=>600});}})}),appendParagraph:t=>par(x.pars,t),editAsText:()=>chain({})});
  return chain({clear:()=>{lista.length=0;},appendParagraph:t=>par(lista,t),appendTable:rows=>{const e={tipo:'T',linhas:rows.map(r=>r.map(v=>({texto:String(v),imagens:[],pars:[]})))};lista.push(e);
    return chain({getRow:r=>chain({getCell:c=>celula(e.linhas[r][c])}),setBorderWidth:()=>chain({}),setBorderColor:()=>chain({})});}});
}
const novoDoc=nome=>{const id=novoId('DOC');const d={id,nome,lista:[],rodape:[],salvo:false};docs.set(id,d);return d;};
// ---- Drive simulado ----
const pastas=new Map(),arquivos=new Map();
const pasta=(nome,pai)=>{const id=novoId('PASTA');const f={id,nome,pai,getId:()=>id,createFile:b=>arq(novoId('PDF'),b.nome,id,'application/pdf'),getFoldersByName:n=>{const l=[...pastas.values()].filter(x=>x.pai===id&&x.nome===n);let i=0;return {hasNext:()=>i<l.length,next:()=>l[i++]};},createFolder:n=>pasta(n,id)};pastas.set(id,f);return f;};
const arq=(id,nome,pai,mime='image/jpeg')=>{const a={id,nome,pai,mime,getMimeType:()=>a.mime,getSize:()=>1000,getBlob:()=>({nome:a.nome}),getThumbnail:()=>({nome:'thumb-'+a.nome}),moveTo:p=>{a.pai=p.getId();},getId:()=>id,
  getAs:()=>{const b={nome:a.nome,setName:n=>{b.nome=n;return b;}};return b;}};arquivos.set(id,a);return a;};
const F1='FOTO'+'1'.repeat(26),F2='FOTO'+'2'.repeat(26),F3='FOTO'+'3'.repeat(26),FV='FOTO'+'V'.repeat(26);arq(F1,'f1.jpg',null);arq(F2,'f2.jpg',null);arq(FV,'v.mp4',null,'video/mp4');// F3 não existe (sem acesso)
const caminho=id=>{const a=arquivos.get(id);const n=[];let p=a.pai;while(p&&pastas.has(p)){n.unshift(pastas.get(p).nome);p=pastas.get(p).pai;}return n.join('/');};
const idDe=u=>u.match(/\/d\/([A-Za-z0-9_-]+)/)[1];
// ---- base ----
const colReg=['ID','Procedimento','Data do procedimento','Mês','Carimbo do envio','Origem','ID legado','Bairro','Bairro ID','Obra de referência','Obra ID','Responsável','Área','Atividade','Público informado','Protocolo informado','Situação do vínculo','Pesquisa','Conferência dos campos','Hash','Detalhes JSON'];
const fotos=l=>({titulo:'Adicione até 5 fotos com timestamp da atividade',valor:l.map(x=>'https://drive.google.com/open?id='+x).join(', ')});
const relatoTxt='A equipe social realizou roda de conversa com os moradores sobre a obra de esgoto, explicou as etapas e registrou dúvidas sobre o acesso das garagens durante a semana.';
const reg=(i,proc,ativ,pub,campos,hash='h')=>['REG-'+String(i).padStart(24,'c'),proc,new Date('2026-09-1'+i+'T15:00:00Z'),'2026-09','','4.0','','Vila Linda','BAI-001','Coletor A [OBR-0001]','OBR-0001','Pessoa Responsável','Social',ativ,pub,'','','','',hash+i,JSON.stringify({campos})];
const registros=new Sheet('Registros',[colReg,
  reg(1,'Relato de atividade','Ação Social Externa',25,[{titulo:'Complemento da atividade',valor:'Roda de conversa na praça'},{titulo:'Horário de entrada na atividade',valor:'09:00'},{titulo:'Horário de saída na atividade',valor:'11:00'},{titulo:'Colaboradores de apoio na atividade',valor:'Apoio Fictício'},{titulo:'Público-alvo da atividade',valor:'Moradores'},{titulo:'Objetivo da atividade',valor:'Informar sobre a obra'},{titulo:'Relato da atividade',valor:relatoTxt},{titulo:'Houve interrupção da atividade?',valor:'Não'},fotos([F1,F2,F3,FV])]),
  reg(2,'Relato de atividade','DDS',12,[{titulo:'Relato da atividade',valor:'Diálogo de segurança.'}]),
  reg(3,'Relato de atividade','Sensibilização em frente de obra',8,[]),reg(4,'Pesquisa de Satisfação','',''),
  reg(5,'Relato de atividade','Articulação Institucional',4,[{titulo:'Relato da atividade',valor:relatoTxt},{titulo:'Houve interrupção da atividade?',valor:'Sim'},{titulo:'Descreva qual foi a interrupção',valor:'Chuva forte'}])]);
const books=new Map([['base',new Book('base',[registros,new Sheet('Atendimentos',[[]])])],['agenda-0123456789',new Book('agenda-0123456789',[])]]),cacheMap=new Map();
const ctx={Date,console:{log(){},warn(){},error(){}},JSON,Session:{getActiveUser:()=>({getEmail:()=>email})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>Object.fromEntries(props),getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
  SpreadsheetApp:{openById:id=>{if(!books.has(id))throw Error('Não existe');return books.get(id)}},
  DriveApp:{getFileById:id=>{const a=arquivos.get(id);if(!a)throw Error('sem acesso');return a;},getFolderById:id=>{const f=pastas.get(id);if(!f)throw Error('sem pasta');return f;},createFolder:n=>pasta(n,null)},
  MimeType:{PDF:'application/pdf'},
  DocumentApp:{create:n=>{const d=novoDoc(n);arq(d.id,n,null,'application/vnd.google-apps.document');const pe={clear:()=>{d.rodape.length=0;},appendParagraph:t=>{d.rodape.push(t);return chain({});}};
      return {getId:()=>d.id,getBody:()=>corpo(d.lista),getFooter:()=>null,addFooter:()=>chain(pe),saveAndClose:()=>{d.salvo=true;}};},
    HorizontalAlignment:{CENTER:'c'},ParagraphHeading:{HEADING2:'h2'}},
  CacheService:{getScriptCache:()=>({get:k=>cacheMap.get(k)||null,put:(k,v)=>cacheMap.set(k,v),remove:k=>cacheMap.delete(k)})},
  Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:fmt},LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},releaseLock:()=>locked=false})}};
vm.createContext(ctx);
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','SocioambientalCPT','PerfisCPT','ColecaoCPT','CicloAtendimentoCPT','FichaOficialCPT','AnexosCPT','AplicacaoCPT','RelatosRelatorioCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx))),op=()=>'OP-'+crypto.randomUUID(),call=(f,p)=>{ctx.p={...p,operacaoId:op()};return run(f+'(p)');};
const ID1='REG-'+'1'.padStart(24,'c'),ID2='REG-'+'2'.padStart(24,'c'),ID5='REG-'+'5'.padStart(24,'c');

// 1. Permissão e lista: só os tipos do relatório; todos pendentes.
email='atd@example.com';assert.throws(()=>run("listarRelatosRelatorioCPT({mes:'2026-09'})"),/Socioambiental, Comunicação, Gestão e Administrativo/);
email='social@example.com';let l=run("listarRelatosRelatorioCPT({mes:'2026-09'})");
assert.deepEqual(l.itens.map(x=>[x.id,x.tipo,x.situacao]),[[ID1,'Ação social externa','pendente'],[ID2,'CAO ou DDS','pendente'],[ID5,'Articulação institucional','pendente']],'sensibilização e pesquisa ficam de fora');
// 2. Abrir: campos vindos do registro, fotos (até 8 marcadas) e prompt sem inventar.
let a=run(`abrirRelatoRelatorioCPT({id:'${ID1}'})`);const c=a.campos;
assert.equal(c.titulo,'Roda de conversa na praça');assert.equal(c.dataHorario,'11/09/2026 · 09:00 às 11:00');assert.equal(c.equipe,'Pessoa Responsável, Apoio Fictício');assert.equal(c.publico,'Moradores · 25 participantes informados');
assert.equal(c.interrupcao,'');assert.equal(a.fotos.length,4);assert.deepEqual(a.fotos.filter(f=>f.escolhida).map(f=>f.id),[F1,F2],'as 2 primeiras já marcadas');assert.equal(a.max,2);assert.match(a.legendaPadrao,/^11\/09\/2026 - Evento - /);assert.match(a.prompt,/não invente/);assert.match(a.prompt,/sem citar nomes de moradores/);assert.equal(a.revisao,null);
assert.equal(run(`abrirRelatoRelatorioCPT({id:'${ID5}'})`).campos.interrupcao,'Chuva forte');
// 3. Revisar: relato curto é barrado; até 2 fotos; depois gera FINAL e ORIGINAL (Docs + PDF) na pasta do mês.
assert.throws(()=>call('revisarRelatoRelatorioCPT',{id:ID2,...run(`abrirRelatoRelatorioCPT({id:'${ID2}'})`).campos,relato:'Diálogo de segurança.',fotos:[]}),/curto demais/);
assert.throws(()=>call('revisarRelatoRelatorioCPT',{...c,id:ID1,fotos:[F1,F2,FV]}),/no máximo 2 fotos/);
assert.throws(()=>call('revisarRelatoRelatorioCPT',{...c,id:ID1,fotos:[{id:'FOTO'+'z'.repeat(26)}]}),/não pertence/);
let r=call('revisarRelatoRelatorioCPT',{...c,id:ID1,objetivo:'Informar os moradores sobre as etapas da obra.',resultados:'',fotos:[{id:F1,legenda:'Roda de conversa'},{id:F3,legenda:''}]});
assert.match(r.resultado,/Relato FINAL e ORIGINAL gerados \(Docs e PDF\) na pasta 2026\/09/);assert.match(r.resultado,/Foto 2 não abriu/);
const fin=r.revisao.arquivos.final,ori=r.revisao.arquivos.original,dF=docs.get(idDe(fin.doc)),dO=docs.get(idDe(ori.doc));
assert.equal(caminho(idDe(fin.doc)),'CPT • Relatos do relatório/2026/09 - setembro');assert.equal(caminho(idDe(fin.pdf)),'CPT • Relatos do relatório/2026/09 - setembro');
assert.equal(arquivos.get(idDe(fin.doc)).nome,'11-09-2026 — Ação social externa — Roda de conversa na praça — FINAL');assert.equal(arquivos.get(idDe(fin.pdf)).nome,'11-09-2026 — Ação social externa — Roda de conversa na praça — FINAL.pdf');
assert.equal(arquivos.get(idDe(ori.doc)).nome,'11-09-2026 — Ação social externa — Roda de conversa na praça — ORIGINAL');assert.equal(dF.salvo,true);assert.equal(dO.salvo,true);
// Layout da Central: faixa, subtítulo, quadro de 6 linhas, seções só com texto, fotos lado a lado com legenda, rodapé.
const T=dF.lista.filter(e=>e.tipo==='T'),P=dF.lista.filter(e=>e.tipo==='P');
assert.equal(T[0].linhas[0][0].texto,'Relato da atividade');assert.equal(P[0].texto,'Roda de conversa na praça');
assert.deepEqual(Array.from(T[1].linhas,l=>l[0].texto),['Atividade','Local','Endereço e bairro','Data e horário','Mediação','Público']);assert.equal(T[1].linhas[3][1].texto,'11/09/2026 · 09:00 às 11:00');
assert.deepEqual(P.filter(e=>e.titulo).map(e=>e.texto),['Objetivo','Relato da atividade','Registro fotográfico'],'resultados vazio fica de fora');
assert.ok(P.some(e=>e.texto==='Informar os moradores sobre as etapas da obra.')&&P.some(e=>e.texto===relatoTxt));
assert.equal(T[2].linhas[0].length,1,'só a foto que abriu');assert.deepEqual(T[2].linhas[0][0].imagens,['f1.jpg']);assert.equal(T[2].linhas[0][0].pars[0].texto,'Roda de conversa');
assert.equal(dF.rodape[0],'11/09/2026 · Consórcio Performance Tamanduateí');
// ORIGINAL: como veio do campo (objetivo do formulário).
assert.ok(dO.lista.some(e=>e.tipo==='P'&&e.texto==='Informar sobre a obra'),'original com o texto do campo');
let l2=run("listarRelatosRelatorioCPT({mes:'2026-09'})");const i1=l2.itens.find(x=>x.id===ID1);assert.equal(i1.situacao,'revisado');assert.equal(i1.revisadoPor,'Social Fictícia');assert.equal(i1.pdf,fin.pdf);
let a2=run(`abrirRelatoRelatorioCPT({id:'${ID1}'})`);assert.deepEqual(a2.fotos.filter(f=>f.escolhida).map(f=>[f.id,f.legenda]),[[F1,'Roda de conversa'],[F3,'11/09/2026 - Evento - Coletor A']],'legenda vazia vira a padrão');
// 4. Revisar de novo: refaz só o FINAL (v2); o anterior vai para "Versões anteriores"; o ORIGINAL fica.
r=call('revisarRelatoRelatorioCPT',{...c,id:ID1,titulo:'Roda de conversa',fotos:[{id:F1,legenda:'Roda'},{id:F2,legenda:'Praça'}]});assert.equal(r.revisao.versao,2);assert.match(r.resultado,/Relato FINAL gerados/);
assert.equal(caminho(idDe(fin.doc)),'CPT • Relatos do relatório/2026/09 - setembro/Versões anteriores');assert.equal(caminho(idDe(fin.pdf)),'CPT • Relatos do relatório/2026/09 - setembro/Versões anteriores');
assert.equal(r.revisao.arquivos.original.doc,ori.doc,'o ORIGINAL é gerado uma vez só');assert.match(arquivos.get(idDe(r.revisao.arquivos.final.doc)).nome,/FINAL v2$/);
assert.equal(docs.get(idDe(r.revisao.arquivos.final.doc)).lista.filter(e=>e.tipo==='T')[2].linhas[0].length,2,'2 fotos lado a lado');
assert.equal(run(`abrirRelatoRelatorioCPT({id:'${ID1}'})`).campos.titulo,'Roda de conversa','a tela reabre com o texto revisado');
// 5. O registro mudou na origem depois da revisão: aparece para conferir.
registros.rows[1][19]='h1-novo';assert.equal(run("listarRelatosRelatorioCPT({mes:'2026-09'})").itens.find(x=>x.id===ID1).situacao,'mudou');
// 6. Revisão feita na 2.43 (fotos só com ID e um documento): abre e, ao revisar, o documento antigo vai para Versões anteriores.
{const velho=novoDoc('antigo');arq(velho.id,'antigo',pastas.values().next().value.id,'application/vnd.google-apps.document');
 run(`(()=>{const c=new ColecaoCPT(AplicacaoCPT.identidade(),'Relatos do relatório','RRL');c.gravar({registroId:'${ID5}',mes:'2026-09',tipo:'Articulação institucional',campos:{titulo:'Reunião antiga',relato:${JSON.stringify(relatoTxt)}},fotos:[],doc:'https://docs.google.com/document/d/${velho.id}/edit',versaoDoc:1,hashOrigem:'h5'},0,'OP-antigo-0001','RRL-${ID5}');return 1;})()`);
 const a5=run(`abrirRelatoRelatorioCPT({id:'${ID5}'})`);assert.equal(a5.campos.titulo,'Reunião antiga');assert.equal(a5.revisao.versao,1);
 r=call('revisarRelatoRelatorioCPT',{...a5.campos,id:ID5,fotos:[]});assert.match(caminho(velho.id),/Versões anteriores$/);assert.ok(r.revisao.arquivos.original,'ganha o ORIGINAL');}
assert.equal(RelatosTipo('acao social interna com idosos'),'Ação social interna');assert.equal(RelatosTipo('Realização de CAO'),'CAO ou DDS');assert.equal(RelatosTipo('Sensibilização'),'');
function RelatosTipo(t){return run('RelatosRelatorioCPT.tipo('+JSON.stringify(t)+')');}
assert.equal(locked,false);
console.log('PASS: relatos para o relatório (como na Central) — tipos elegíveis, permissões, campos do registro, prompt sem inventar, relato curto e mais de 2 fotos barrados, layout da Central (faixa, quadro de 6 linhas, seções só com texto, fotos lado a lado com legenda, rodapé), FINAL e ORIGINAL em Docs + PDF na pasta do mês, revisar de novo refaz só o FINAL guardando o anterior, legenda padrão, compatível com revisões da 2.43 e "mudou na origem".');
