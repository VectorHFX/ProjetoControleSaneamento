// Fichas oficiais 2.38: pasta organizada (Casos, Versões anteriores, Pacotes), "Atualizar todas", pacote do mês e rotina 12h/0h.
// Drive simulado com pastas e arquivos de verdade (nome, pasta, descrição). node app/testes/fichas.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
let email='atd@example.com',locked=false;
const props=new Map([['CPT_APLICACAO_1',JSON.stringify({baseId:'base',administrador:'victor@example.com',agendaId:'agenda',versao:'2.38.0',pastaFichasId:'PASTAANTIGA'})],
  ['CPT_PESSOA:atd@example.com',JSON.stringify({email:'atd@example.com',nome:'Atd',papeis:['atendimento'],ativo:true,versao:1})],
  ['CPT_PESSOA:social@example.com',JSON.stringify({email:'social@example.com',nome:'Social',papeis:['socioambiental'],ativo:true,versao:1})]]);
class Sheet{constructor(n,rows=[]){this.name=n;this.rows=rows;}getName(){return this.name}getLastRow(){return this.rows.length}appendRow(r){this.rows.push(r)}
  getRange(r,c,n=1,m=1){const s=this;const vals=()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.rows[r+i-1]?.[c+j-1]??''));let px;
    const api={getValues:vals,getValue:()=>vals()[0][0],setValues:v=>{v.forEach((row,i)=>row.forEach((x,j)=>s.rows[r+i-1][c+j-1]=x));return px},setValue:x=>api.setValues([[x]])};
    px=new Proxy(api,{get:(t,k)=>k in t?t[k]:()=>px});return px;}}
class Book{constructor(id,sheets){this.id=id;this.sheets=sheets}getId(){return this.id}getSheetByName(n){return this.sheets.find(s=>s.name===n)||null}getSpreadsheetTimeZone(){return 'America/Sao_Paulo'}}
// ---- Drive simulado ----
let seq=0;const pastas=new Map(),arquivos=new Map(),copiasFeitas=[];const novoId=p=>p+String(++seq).padStart(22,'0');
const iter=a=>{let i=0;return {hasNext:()=>i<a.length,next:()=>a[i++]}};
const pasta=(nome,pai)=>{const id=novoId('PASTA');const f={id,nome,pai,getId:()=>id,getName:()=>f.nome,getUrl:()=>'https://drive.google.com/drive/folders/'+id,
  getFoldersByName:n=>iter([...pastas.values()].filter(x=>x.pai===id&&x.nome===n)),createFolder:n=>pasta(n,id),
  getFiles:()=>iter([...arquivos.values()].filter(x=>x.pai===id)),createFile:b=>arquivo(b.nome,id,b.conteudo)};pastas.set(id,f);return f;};
const arquivo=(nome,pai,conteudo='',pref='ARQ')=>{const id=novoId(pref);const a={id,nome,pai,desc:'',conteudo,getId:()=>id,getName:()=>a.nome,setName:n=>{a.nome=n;return a},moveTo:p=>{a.pai=p.getId();return a},
  setDescription:d=>{a.desc=d;return a},getDescription:()=>a.desc,makeCopy:(n,p)=>{copiasFeitas.push(n);return arquivo(n,p.getId(),a.conteudo,/\.pdf$/.test(n)?'PDF':'DOC')},
  getAs:()=>blob(a.nome+'.pdf','pdf de '+a.nome),getBlob:()=>({getContentType:()=>'image/jpeg'})};arquivos.set(id,a);return a;};
const blob=(nome,conteudo)=>{const b={nome,conteudo,setName:n=>{b.nome=n;return b},getAs:()=>blob(b.nome,'PDF:'+conteudo)};return b};
const antiga={id:'PASTAANTIGA'};const modelo=arquivo('Modelo',null,'modelo');
const noDrive=id=>{const a=arquivos.get(id);if(!a)throw Error('sem arquivo '+id);return a};
const caminho=id=>{const a=noDrive(id);const nomes=[];let p=a.pai;while(p&&pastas.has(p)){nomes.unshift(pastas.get(p).nome);p=pastas.get(p).pai;}return (p==='PASTAANTIGA'?'(antiga)/':'')+nomes.join('/');};
const idDe=u=>(String(u).match(/\/d\/([A-Za-z0-9_-]{20,})/)||[])[1];
// ---- Base: casos ----
const cab=['Protocolo','Protocolo principal','Situação do protocolo','Status','Data de abertura','Data de conclusão','Nome','Assunto','Endereço','Frente de obra','Área responsável','Responsável','Próxima ação','Atualização operacional','Documento','PDF','Origem','Pesquisa','Hash','Detalhes JSON'];
const dia=s=>s?new Date(s+'T12:00:00Z'):'';
const legado=n=>{const d=arquivo('Ficha antiga '+n,'PASTAANTIGA','doc','DOC'),p=arquivo('Ficha antiga '+n+'.pdf','PASTAANTIGA','pdf','PDF');return ['https://docs.google.com/document/d/'+d.id+'/edit','https://drive.google.com/file/d/'+p.id+'/view'];};
const caso=(n,abre,fecha,{sol='Pedido '+n,links=['',''],json={},principal}={})=>{const p='ATD2026'+String(n).padStart(4,'0');
  return [p,principal||p,'',fecha?'Concluído':'Em andamento',dia(abre),dia(fecha),'Morador '+n,'Assunto '+n,'Rua '+n,'Coletor A','Atendimento','Atd','','',links[0],links[1],'CAC','','',JSON.stringify({aberturas:[{campos:{'Nome do solicitante':'Morador '+n,'Solicitação':sol}}],...json})];};
const leg1=legado(1),leg3=legado(3),leg4=legado(4);
const atd=new Sheet('Atendimentos',[cab,
  caso(1,'2026-08-10','2026-09-05',{links:leg1}),   // em dia, na pasta antiga → mover
  caso(2,'2026-09-12',''),                          // sem ficha → gerar (aberto)
  caso(3,'2026-07-01','',{links:leg3}),             // em dia e na pasta nova → ok
  caso(4,'2026-06-01','2026-07-01',{links:leg4}),   // mudou → gerar (concluído: por último); fica fora do pacote de setembro
  caso(5,'2026-09-20','',{sol:''}),                 // sem solicitação → corrigir
  caso(6,'2026-09-21','',{principal:'ATD20260002'}),// incorporado: fora
  caso(7,'2026-10-02','')]);                        // aberto em outubro: fora do pacote de setembro
const movs=new Sheet('Movimentações',[['ID','Protocolo','Data','Tipo','Status','Autor','Resumo','Origem','',''] ]);
const books=new Map([['base',new Book('base',[atd,movs])]]),cacheMap=new Map();
const textos=[];const cell=()=>{const c={clear:()=>c,setVerticalAlignment:()=>c,appendParagraph:t=>{const p={appendText:x=>{textos.push(x);const tx=new Proxy({},{get:()=>()=>tx});return tx},setSpacingAfter:()=>p,setLineSpacing:()=>p,setAlignment:()=>p};return p},appendTable:()=>({setBorderWidth(){return this},setBorderColor(){return this},getCell:()=>cell()})};return c};
const ctx={Date,console:{log(){},warn(){},error(){}},JSON,
  Session:{getActiveUser:()=>({getEmail:()=>email})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>Object.fromEntries(props),getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
  SpreadsheetApp:{openById:id=>{if(!books.has(id))throw Error('Não existe');return books.get(id)}},
  DriveApp:{getFileById:noDrive,getFolderById:id=>{const f=pastas.get(id);if(!f)throw Error('sem pasta');return f},createFolder:n=>pasta(n,null)},
  DocumentApp:{openById:()=>({getBody:()=>({getTables:()=>[{getCell:()=>cell()},{getCell:()=>cell()}],editAsText:()=>({getText:()=>'',setForegroundColor(){}})}),saveAndClose(){}}),HorizontalAlignment:{CENTER:'c',JUSTIFY:'j'},VerticalAlignment:{CENTER:'c'}},
  MimeType:{PDF:'application/pdf'},
  CacheService:{getScriptCache:()=>({get:k=>cacheMap.get(k)||null,put:(k,v)=>cacheMap.set(k,v),remove:k=>cacheMap.delete(k)}),getUserCache:()=>({get:()=>null,put(){}})},
  Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:(d,_,f)=>{const s=new Date(d.getTime()-3*3600e3).toISOString();return f==='yyyy-MM'?s.slice(0,7):f==='yyyy-MM-dd'?s.slice(0,10):f==='HH:mm'?s.slice(11,16):s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4)},
    newBlob:(t,_,n)=>blob(n,t),computeDigest:(_,v)=>[...crypto.createHash('sha256').update(v).digest()].map(b=>b>127?b-256:b),DigestAlgorithm:{SHA_256:1},Charset:{UTF_8:1}},
  LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},releaseLock:()=>locked=false})}};
vm.createContext(ctx);
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','PerfisCPT','CicloAtendimentoCPT','FichaOficialCPT','AplicacaoCPT','RotinaCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx)));
const cfg=()=>JSON.parse(props.get('CPT_APLICACAO_1'));cfg.salvar=c=>props.set('CPT_APLICACAO_1',JSON.stringify(c));
let c0=cfg();c0.modeloFichaId=modelo.id;cfg.salvar(c0);
// Casos 1 e 3 já estão em dia (mesmo hash); o 3 já foi para a pasta nova; o 4 tem hash velho.
vm.runInContext("var F=new FichaOficialCPT(AplicacaoCPT.contexto());",ctx);
for(const [i,extra] of [[1,{}],[3,{fichaPasta:'v2'}],[4,{fichaHash:'velho'}]]){const r=atd.rows[i];const d=JSON.parse(r[19]);ctx.linha=r;d.fichaHash=extra.fichaHash||run("F.hash(F.registro(linha))");if(extra.fichaPasta)d.fichaPasta='v2';r[19]=JSON.stringify(d);}
const lin=p=>atd.rows.find(r=>r[0]===p);

// 1. Permissão e estado inicial: só olhar não cria pasta nenhuma.
email='social@example.com';assert.throws(()=>run('estadoFichasCPT()'),/ficam com Atendimento/);assert.throws(()=>run('atualizarFichasCPT()'),/ficam com Atendimento/);assert.throws(()=>run("montarPacoteFichasCPT({mes:'2026-09'})"),/ficam com Atendimento/);
email='atd@example.com';let e=run('estadoFichasCPT()');
assert.equal(e.naPastaAntiga,2,'casos 1 e 4 têm ficha fora da pasta nova');assert.deepEqual([e.total,e.ok,e.gerar,e.mover,e.nCorrigir],[6,1,3,1,1],'incorporado fica de fora; 1 ok, 3 a gerar, 1 a mover, 1 a corrigir');
assert.deepEqual(e.corrigir,[{caso:'Caso 5',protocolo:'ATD20260005'}]);assert.equal(e.pasta,'');assert.match(e.pastaAntiga,/PASTAANTIGA$/);assert.equal(e.rotina,null);assert.equal(pastas.size,0,'consultar não cria pasta');
// 2. Atualizar todas: abertos primeiro, depois os que só mudam de pasta, depois os concluídos. Nada é apagado.
let r=run('atualizarFichasCPT()');
assert.deepEqual([r.geradas,r.movidas,r.faltam,r.erros.length,r.ok,r.gerar,r.mover,r.nCorrigir],[3,1,0,0,5,0,0,1]);assert.equal(r.naPastaAntiga,0,'tudo na pasta nova: a antiga pode ser apagada');
assert.deepEqual(copiasFeitas,['Caso 2 · ATD20260002 · Ficha de Atendimento','Caso 7 · ATD20260007 · Ficha de Atendimento','Caso 4 · ATD20260004 · Ficha de Atendimento'],'ordem: abertos, depois concluídos');
const raiz=[...pastas.values()].find(p=>!p.pai);assert.equal(raiz.nome,'CPT • Fichas oficiais da Sabesp');assert.equal(cfg().pastaFichasV2Id,raiz.id);assert.equal(r.pasta,raiz.getUrl());
for(const p of ['ATD20260001','ATD20260002','ATD20260004','ATD20260007']){const x=lin(p);assert.equal(caminho(idDe(x[14])),'CPT • Fichas oficiais da Sabesp/Casos',p);assert.equal(caminho(idDe(x[15])),'CPT • Fichas oficiais da Sabesp/Casos',p);assert.equal(JSON.parse(x[19]).fichaPasta,'v2');}
assert.equal(noDrive(idDe(lin('ATD20260001')[14])).nome,'Caso 1 · ATD20260001 · Ficha de Atendimento','movida ganha o número do caso no nome');assert.equal(noDrive(idDe(leg1[1])).nome,'Caso 1 · ATD20260001 · Ficha de Atendimento.pdf');
assert.equal(caminho(idDe(leg4[0])),'(antiga)/','versão antiga do caso 4 fica na pasta antiga (apagada inteira depois)');
assert.equal(caminho(idDe(leg3[0])),'(antiga)/','caso 3 já marcado na pasta nova não é mexido');
assert.equal(movs.rows.filter(x=>x[3]==='Ficha oficial gerada').length,3);assert.equal(locked,false);assert.equal(cacheMap.get('CPT_FICHAS_LOTE'),undefined,'lote liberado no fim');
// 3. De novo: nada a fazer. Caso muda → só ele é refeito e a versão anterior (da pasta nova) vai para Versões anteriores.
r=run('atualizarFichasCPT()');assert.deepEqual([r.geradas,r.movidas],[0,0]);
const doc2=idDe(lin('ATD20260002')[14]),pdf2=idDe(lin('ATD20260002')[15]);
{const x=lin('ATD20260002'),d=JSON.parse(x[19]);d.corrigido={solicitacao:'Pedido 2 corrigido'};x[19]=JSON.stringify(d);}
r=run('atualizarFichasCPT()');assert.equal(r.geradas,1);assert.equal(caminho(doc2),'CPT • Fichas oficiais da Sabesp/Versões anteriores');assert.equal(caminho(pdf2),'CPT • Fichas oficiais da Sabesp/Versões anteriores');
assert.notEqual(idDe(lin('ATD20260002')[15]),pdf2);
// 4. Um lote por vez: com outro em andamento, a tela avisa e não gera nada em dobro.
cacheMap.set('CPT_FICHAS_LOTE','12:01');assert.throws(()=>run('atualizarFichasCPT()'),/já estão sendo atualizadas \(desde 12:01\)/);assert.throws(()=>run("montarPacoteFichasCPT({mes:'2026-09'})"),/já estão sendo atualizadas/);cacheMap.delete('CPT_FICHAS_LOTE');
// Sem tempo: nada é feito agora, tudo fica para a próxima rodada.
{const x=lin('ATD20260007'),d=JSON.parse(x[19]);d.corrigido={solicitacao:'Outro pedido'};x[19]=JSON.stringify(d);}
r=run('new FichaOficialCPT(AplicacaoCPT.contexto()).atualizarTodas(-1)');assert.deepEqual([r.geradas,r.faltam,r.gerar],[0,1,1]);
// 5. Quem entra no pacote do mês.
const P=(abertura,concluido,conclusao)=>run("FichaOficialCPT.doPacote("+JSON.stringify({abertura,concluido,conclusao})+",'2026-09')");
assert.equal(P('2026-09-03',false,''),true);assert.equal(P('2026-08-01',true,'2026-09-30'),true);assert.equal(P('2026-03-01',false,''),true,'em andamento no fim do mês');
assert.equal(P('2026-08-01',true,'2026-10-02'),true,'concluído depois: estava em andamento no fim do mês');assert.equal(P('2026-08-01',true,'2026-08-31'),false);assert.equal(P('2026-10-01',false,''),false);assert.equal(P('',false,''),false);
assert.equal(run("FichaOficialCPT.grupo({abertura:'2026-09-03',concluido:true,conclusao:'2026-09-20'},'2026-09')"),'Aberto no mês');assert.equal(run("FichaOficialCPT.grupo({abertura:'2026-08-01',concluido:true,conclusao:'2026-10-20'},'2026-09')"),'Em andamento');
// 6. Pacote de setembro: casos 1 (concluído no mês), 2 e 5 (abertos), 3 (em andamento). O 5 não tem ficha: fica pendente.
assert.throws(()=>run("montarPacoteFichasCPT({mes:'2026-13'})"),/mês válido/);
r=run("montarPacoteFichasCPT({mes:'2026-09'})");
assert.deepEqual([r.casos,r.copiadas,r.iguais,r.pendentes,r.faltam,r.completo],[4,3,0,1,0,false]);assert.deepEqual(r.grupos,{'Aberto no mês':2,'Concluído no mês':1,'Em andamento':1});
assert.deepEqual([r.geradas,r.movidas],[0,0],'tudo de setembro já estava em dia');
const pac=[...pastas.values()].find(p=>p.nome==='2026-09');assert.equal(r.pasta,pac.getUrl());assert.equal(pastas.get(pac.pai).nome,'Pacotes');
const noPacote=()=>[...arquivos.values()].filter(a=>a.pai===pac.id).map(a=>a.nome).sort();
assert.deepEqual(noPacote(),['00 · Índice do pacote 2026-09.pdf','Caso 1 · ATD20260001.pdf','Caso 2 · ATD20260002.pdf','Caso 3 · ATD20260003.pdf']);
const indice=[...arquivos.values()].find(a=>a.pai===pac.id&&/Índice/.test(a.nome)).conteudo;assert.match(indice,/setembro/);assert.match(indice,/4 casos: 2 abertos no mês, 1 concluído no mês e 1 em andamento/);assert.match(indice,/Morador 5/);assert.doesNotMatch(indice,/Morador 7|Morador 4/);
const copia2=[...arquivos.values()].find(a=>a.pai===pac.id&&a.nome==='Caso 2 · ATD20260002.pdf');assert.equal(copia2.desc,idDe(lin('ATD20260002')[15]),'cópia congelada guarda de qual PDF veio');
// Montar de novo: só troca o que mudou; o substituído vai para "Substituídas".
r=run("montarPacoteFichasCPT({mes:'2026-09'})");assert.deepEqual([r.copiadas,r.iguais],[0,3]);
{const x=lin('ATD20260002'),d=JSON.parse(x[19]);d.corrigido={solicitacao:'Pedido 2, terceira versão'};x[19]=JSON.stringify(d);}
r=run("montarPacoteFichasCPT({mes:'2026-09'})");assert.deepEqual([r.geradas,r.copiadas,r.iguais],[1,1,2]);
assert.equal(caminho(copia2.id),'CPT • Fichas oficiais da Sabesp/Pacotes/2026-09/Substituídas');assert.equal(noPacote().length,4,'continua um arquivo por caso e um índice');
assert.equal(locked,false);
// 7. Rotina das 12h/0h (acionador do proprietário): põe as fichas em dia e guarda o resultado para a tela.
email='victor@example.com';r=run('rotinaCPT()');assert.equal(r.passos[0].id,'fichas');assert.equal(r.passos[0].ok,true);assert.match(r.passos[0].texto,/^1 gerada\(s\), 0 movida\(s\)$/);
email='atd@example.com';e=run('estadoFichasCPT()');assert.equal(e.rotina.passos[0].texto,r.passos[0].texto);assert.equal(e.gerar,0);
cacheMap.set('CPT_FICHAS_LOTE','23:59');email='victor@example.com';r=run('rotinaCPT()');assert.equal(r.passos[0].ok,false);assert.match(r.passos[0].texto,/já estão sendo atualizadas/);cacheMap.delete('CPT_FICHAS_LOTE');
// 8. Ficha em dia, mas o arquivo antigo sumiu (apagado à mão): em vez de travar no erro, a ficha é gerada de novo.
{const x=lin('ATD20260001'),d=JSON.parse(x[19]);delete d.fichaPasta;x[19]=JSON.stringify(d);arquivos.delete(idDe(x[14]));arquivos.delete(idDe(x[15]));}
email='atd@example.com';r=run('atualizarFichasCPT()');assert.deepEqual([r.geradas,r.movidas,r.erros.length,r.naPastaAntiga],[1,0,0,0]);assert.equal(caminho(idDe(lin('ATD20260001')[15])),'CPT • Fichas oficiais da Sabesp/Casos');
// 9. Fichas do sistema antigo (sem hash): caso intocado na aplicação é movido, não refeito; caso com execução depois da migração é refeito.
{const l20=legado(20),l21=legado(21);atd.rows.push(caso(20,'2026-04-01','',{links:l20}),caso(21,'2026-04-02','',{links:l21,json:{execucoes:[{data:'2026-09-01',feito:'Vistoria feita'}]}}));
 const antesCopias=copiasFeitas.length;r=run('atualizarFichasCPT()');assert.deepEqual([r.geradas,r.movidas],[1,1]);
 assert.equal(caminho(idDe(l20[0])),'CPT • Fichas oficiais da Sabesp/Casos','legado intocado: o mesmo arquivo, movido');assert.equal(noDrive(idDe(l20[1])).nome,'Caso 20 · ATD20260020 · Ficha de Atendimento.pdf');
 assert.ok(JSON.parse(lin('ATD20260020')[19]).fichaHash,'ganha a base para refazer quando mudar');assert.equal(copiasFeitas.slice(antesCopias).join(),'Caso 21 · ATD20260021 · Ficha de Atendimento');
 r=run('atualizarFichasCPT()');assert.deepEqual([r.geradas,r.movidas],[0,0],'depois disso, em dia');
 {const x=lin('ATD20260020'),d=JSON.parse(x[19]);d.corrigido={solicitacao:'Mudou'};x[19]=JSON.stringify(d);}r=run('atualizarFichasCPT()');assert.equal(r.geradas,1,'mudou na aplicação: refeita');}
console.log('PASS: fichas oficiais — pasta organizada (Casos com o número do caso, Versões anteriores, Pacotes/AAAA-MM), Atualizar todas (abertos primeiro, move as em dia, gera só o que mudou, um lote por vez, continua de onde parou), pacote do mês (abertos, concluídos e em andamento; cópias congeladas; índice; refazer troca só o que mudou) rotina 12h/0h ficha refeita quando o arquivo antigo sumiu e fichas antigas intocadas movidas sem refazer.');
