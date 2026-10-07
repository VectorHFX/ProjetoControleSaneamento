// Relatos para o relatório (2.43) com base, Drive e Docs simulados e dados fictícios: tipos elegíveis, pendente → revisado,
// documento no modelo (marcadores preenchidos, seções vazias tiradas, fotos em grade, foto que não abre vira aviso), pastas
// AAAA/MM - mês/Tipo, nova versão move a anterior, "mudou na origem", permissões e prompt. node app/testes/relatos_relatorio.cjs
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
// ---- Docs simulado: corpo = lista de elementos {tipo:'P', texto} | {tipo:'T', celulas} | {tipo:'Q'} ----
const docs=new Map();let seq=0;const novoId=p=>p+String(++seq).padStart(24,'0');
const chain=o=>new Proxy(o,{get:(t,k)=>k in t?t[k]:()=>chain(o)});
function corpo(lista){
  const par=el=>chain({getType:()=>'PARAGRAPH',asText:()=>txt(el),asParagraph:()=>chain({clear:()=>{el.texto='';},appendInlineImage:b=>{el.imagens=(el.imagens||[]).concat([b.nome]);return chain({getWidth:()=>800,getHeight:()=>600});}}),
    getParent:()=>par(el),removeFromParent:()=>{const i=lista.indexOf(el);if(i>=0)lista.splice(i,1);},getPreviousSibling:()=>{const i=lista.indexOf(el);return i>0&&lista[i-1].tipo==='P'?par(lista[i-1]):null;},_el:el});
  const txt=el=>({deleteText:(a,b)=>{el.texto=el.texto.slice(0,a)+el.texto.slice(b+1);},insertText:(a,v)=>{el.texto=el.texto.slice(0,a)+v+el.texto.slice(a);}});
  const api={getText:()=>lista.filter(e=>e.tipo==='P').map(e=>e.texto).join('\n'),
    findText:(pad,depois)=>{const re=new RegExp(pad);let ini=depois?lista.indexOf(depois._el)+1:0;for(let i=ini;i<lista.length;i++){const e=lista[i];if(e.tipo!=='P')continue;const m=e.texto.match(re);if(m)return {getElement:()=>par(e),getStartOffset:()=>m.index,getEndOffsetInclusive:()=>m.index+m[0].length-1,_el:e};}return null;},
    getChildIndex:p=>lista.indexOf(p._el),insertParagraph:(i,t)=>{const e={tipo:'P',texto:t};lista.splice(i,0,e);return chain({});},insertPageBreak:i=>{lista.splice(i,0,{tipo:'Q'});return chain({});},
    insertTable:(i,rows)=>{const e={tipo:'T',celulas:rows.map(r=>r.map(()=>({texto:'',imagens:[]})))};lista.splice(i,0,e);
      return chain({getCell:(r,c)=>{const cel=e.celulas[r][c];return chain({getChild:()=>chain({asParagraph:()=>chain({appendInlineImage:b=>{cel.imagens.push(b.nome);return chain({getWidth:()=>800,getHeight:()=>600});}})}),setText:t=>{cel.texto=t;return chain({});}});}});}};
  return chain(api);
}
const novoDoc=(nome,lista,rodape)=>{const id=novoId('DOC');const d={id,nome,lista,rodape,salvo:false};docs.set(id,d);return d;};
const modeloLista=()=>['CONSÓRCIO PERFORMANCE TAMANDUATEÍ','Relato da atividade','{{TITULO}}','{{ATIVIDADE}}','{{LOCAL}}','{{ENDERECO}}','{{DATA_HORARIO}}','{{MEDIACAO}}','{{EQUIPE}}','{{PUBLICO}}','Objetivo','{{OBJETIVO}}','Relato da atividade','{{RELATO}}','Resultados e encaminhamentos','{{RESULTADOS}}','Interrupção informada','{{INTERRUPCAO}}','Registro fotográfico','{{FOTOS}}'].map(t=>({tipo:'P',texto:t}));
const modelo=novoDoc('MODELO',modeloLista(),[{tipo:'P',texto:'{{REFERENCIA}}'}]);
// ---- Drive simulado ----
const pastas=new Map(),arquivos=new Map();
const pasta=(nome,pai)=>{const id=novoId('PASTA');const f={id,nome,pai,getId:()=>id,getUrl:()=>'https://drive.google.com/drive/folders/'+id,getFoldersByName:n=>{const l=[...pastas.values()].filter(x=>x.pai===id&&x.nome===n);let i=0;return {hasNext:()=>i<l.length,next:()=>l[i++]};},createFolder:n=>pasta(n,id)};pastas.set(id,f);return f;};
const arq=(id,nome,pai,mime='image/jpeg')=>{const a={id,nome,pai,mime,getMimeType:()=>a.mime,getSize:()=>1000,getBlob:()=>({nome:a.nome}),getThumbnail:()=>({nome:'thumb-'+a.nome}),moveTo:p=>{a.pai=p.getId();},
  makeCopy:(n,p)=>{const d=docs.get(id);const c=novoDoc(n,d.lista.map(e=>({...e})),d.rodape.map(e=>({...e})));arquivos.set(c.id,arq(c.id,n,p.getId(),'application/vnd.google-apps.document'));return arquivos.get(c.id);},getId:()=>id};arquivos.set(id,a);return a;};
arq(modelo.id,'MODELO',null,'application/vnd.google-apps.document');
const F1='FOTO'+'1'.repeat(26),F2='FOTO'+'2'.repeat(26),F3='FOTO'+'3'.repeat(26),FV='FOTO'+'V'.repeat(26);arq(F1,'f1.jpg',null);arq(F2,'f2.jpg',null);arq(FV,'v.mp4',null,'video/mp4');// F3 não existe (sem acesso)
const caminho=id=>{const a=arquivos.get(id);const n=[];let p=a.pai;while(p&&pastas.has(p)){n.unshift(pastas.get(p).nome);p=pastas.get(p).pai;}return n.join('/');};
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
  DocumentApp:{openById:id=>{const d=docs.get(id);if(!d)throw Error('sem doc');return {getId:()=>id,getBody:()=>corpo(d.lista),getFooter:()=>corpo(d.rodape),saveAndClose:()=>{d.salvo=true;}};},
    create:n=>{const d=novoDoc(n,[],[]);arq(d.id,n,null,'application/vnd.google-apps.document');return {getId:()=>d.id,getBody:()=>chain({clear:()=>{},getText:()=>''}),addFooter:()=>chain({}),saveAndClose(){}};},
    ElementType:{PARAGRAPH:'PARAGRAPH'},HorizontalAlignment:{CENTER:'c'},ParagraphHeading:{TITLE:'t'}},
  CacheService:{getScriptCache:()=>({get:k=>cacheMap.get(k)||null,put:(k,v)=>cacheMap.set(k,v),remove:k=>cacheMap.delete(k)})},
  Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:fmt},LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},releaseLock:()=>locked=false})}};
vm.createContext(ctx);
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','SocioambientalCPT','PerfisCPT','ColecaoCPT','CicloAtendimentoCPT','FichaOficialCPT','AnexosCPT','AplicacaoCPT','RelatosRelatorioCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx))),op=()=>'OP-'+crypto.randomUUID(),call=(f,p)=>{ctx.p={...p,operacaoId:op()};return run(f+'(p)');};
{const c=JSON.parse(props.get('CPT_APLICACAO_1'));c.modeloRelatoId=modelo.id;props.set('CPT_APLICACAO_1',JSON.stringify(c));}
const ID1='REG-'+'1'.padStart(24,'c'),ID2='REG-'+'2'.padStart(24,'c'),ID5='REG-'+'5'.padStart(24,'c');

// 1. Permissão e lista: só os tipos do relatório; todos pendentes.
email='atd@example.com';assert.throws(()=>run("listarRelatosRelatorioCPT({mes:'2026-09'})"),/Socioambiental, Comunicação, Gestão e Administrativo/);
email='social@example.com';let l=run("listarRelatosRelatorioCPT({mes:'2026-09'})");
assert.deepEqual(l.itens.map(x=>[x.id,x.tipo,x.situacao]),[[ID1,'Ação social externa','pendente'],[ID2,'CAO ou DDS','pendente'],[ID5,'Articulação institucional','pendente']],'sensibilização e pesquisa ficam de fora');
// 2. Abrir: campos vindos do registro, fotos (até 8 marcadas) e prompt sem inventar.
let a=run(`abrirRelatoRelatorioCPT({id:'${ID1}'})`);const c=a.campos;
assert.equal(c.titulo,'Roda de conversa na praça');assert.equal(c.dataHorario,'11/09/2026 · 09:00 às 11:00');assert.equal(c.equipe,'Pessoa Responsável, Apoio Fictício');assert.equal(c.publico,'Moradores · 25 participantes informados');
assert.equal(c.interrupcao,'');assert.equal(a.fotos.length,4);assert.ok(a.fotos.every(f=>f.escolhida));assert.match(a.prompt,/não invente/);assert.match(a.prompt,/sem citar nomes de moradores/);assert.equal(a.revisao,null);
assert.equal(run(`abrirRelatoRelatorioCPT({id:'${ID5}'})`).campos.interrupcao,'Chuva forte');
// 3. Revisar: relato curto é barrado; depois gera o documento na pasta certa.
assert.throws(()=>call('revisarRelatoRelatorioCPT',{id:ID2,titulo:'DDS',relato:'Diálogo de segurança.',fotos:[]}),/curto demais/);
let r=call('revisarRelatoRelatorioCPT',{...c,id:ID1,objetivo:'Informar os moradores sobre as etapas da obra.',resultados:'',fotos:[F1,F2,F3,FV]});
assert.match(r.resultado,/pasta 2026\/09\/Ação social externa/);assert.match(r.resultado,/Foto 3 não abriu/);
const docId=r.doc.match(/\/d\/([A-Za-z0-9_-]+)/)[1],d=docs.get(docId);assert.equal(caminho(docId),'CPT • Relatos do relatório/2026/09 - setembro/Ação social externa');
assert.equal(arquivos.get(docId).nome,'11-09-2026 · Ação social externa · Roda de conversa na praça');assert.equal(d.salvo,true);
const textos=d.lista.filter(e=>e.tipo==='P').map(e=>e.texto);assert.ok(!textos.some(t=>/\{\{/.test(t)),'nenhum marcador sobrando');
assert.ok(textos.includes('Roda de conversa na praça')&&textos.includes('Informar os moradores sobre as etapas da obra.')&&textos.includes(relatoTxt));
assert.ok(!textos.includes('Resultados e encaminhamentos')&&!textos.includes('Interrupção informada'),'seções vazias saem com o título');
const grade=d.lista.filter(e=>e.tipo==='T');assert.equal(grade.length,2,'3 fotos em grade de 2 colunas');assert.deepEqual(grade[0].celulas[0][0].imagens,['f1.jpg']);assert.deepEqual(grade[1].celulas[0][0].imagens,['thumb-v.mp4']);
assert.equal(grade[1].celulas[1][0].texto,'Prévia de vídeo 3 · 11/09/2026');assert.match(d.rodape[0].texto,/^11\/09\/2026 · REG-/);
l=run("listarRelatosRelatorioCPT({mes:'2026-09'})");const i1=l.itens.find(x=>x.id===ID1);assert.equal(i1.situacao,'revisado');assert.equal(i1.revisadoPor,'Social Fictícia');
// 4. Revisar de novo: versão 2; a anterior vai para "Versões anteriores".
r=call('revisarRelatoRelatorioCPT',{...c,id:ID1,titulo:'Roda de conversa',fotos:[F1]});assert.equal(r.revisao.versao,2);assert.equal(caminho(docId),'CPT • Relatos do relatório/2026/09 - setembro/Ação social externa/Versões anteriores');
assert.match(arquivos.get(r.doc.match(/\/d\/([A-Za-z0-9_-]+)/)[1]).nome,/· v2$/);
assert.equal(run(`abrirRelatoRelatorioCPT({id:'${ID1}'})`).campos.titulo,'Roda de conversa','a tela reabre com o texto revisado');
// 5. O registro mudou na origem depois da revisão: aparece para conferir.
registros.rows[1][19]='h1-novo';assert.equal(run("listarRelatosRelatorioCPT({mes:'2026-09'})").itens.find(x=>x.id===ID1).situacao,'mudou');
// 6. Modelo sem marcador: nada é gerado.
modelo.lista=modelo.lista.filter(e=>e.texto!=='{{RELATO}}');assert.throws(()=>call('revisarRelatoRelatorioCPT',{...c,id:ID5,relato:relatoTxt,fotos:[]}),/Marcador \{\{RELATO\}\} ausente/);
assert.equal(RelatosTipo('acao social interna com idosos'),'Ação social interna');assert.equal(RelatosTipo('Realização de CAO'),'CAO ou DDS');assert.equal(RelatosTipo('Sensibilização'),'');
function RelatosTipo(t){return run('RelatosRelatorioCPT.tipo('+JSON.stringify(t)+')');}
assert.equal(locked,false);
console.log('PASS: relatos para o relatório — tipos elegíveis, permissões, campos do registro, prompt sem inventar, relato curto barrado, documento no modelo (marcadores, seções vazias fora, fotos em grade com prévia de vídeo, foto sem acesso avisada), pasta AAAA/MM - mês/Tipo, nova versão com a anterior guardada, "mudou na origem" e modelo sem marcador barrado.');
