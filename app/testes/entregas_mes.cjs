// Entregas do mês (4 cartões, situação, retrato ao entregar, .zip das fichas) com Google simulado. node app/testes/entregas_mes.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
let email='victor@example.com';
const props=new Map([['CPT_APLICACAO_1',JSON.stringify({baseId:'base',administrador:'victor@example.com',agendaId:'agenda',versao:'2.15.0',pastaEntregasId:'raiz'})],
  ['CPT_PESSOA:adm@example.com',JSON.stringify({email:'adm@example.com',nome:'Adm',papeis:['administrativo'],ativo:true,versao:1})],
  ['CPT_PESSOA:social@example.com',JSON.stringify({email:'social@example.com',nome:'Social',papeis:['socioambiental'],ativo:true,versao:1})],
  ['CPT_PESSOA:atd@example.com',JSON.stringify({email:'atd@example.com',nome:'Atd',papeis:['atendimento'],ativo:true,versao:1})]]);
class Sheet{constructor(n){this.name=n;this.rows=[];}getName(){return this.name}getLastRow(){return this.rows.length}setFrozenRows(){}getMaxColumns(){return 10}
  getRange(r,c,n=1,m=1){const s=this;const vals=()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.rows[r+i-1]?.[c+j-1]??''));
    return {getValues:vals,getValue:()=>vals()[0][0],setValues:v=>{v.forEach((row,i)=>{while(s.rows.length<r+i)s.rows.push([]);row.forEach((x,j)=>s.rows[r+i-1][c+j-1]=x)});}};}}
class Book{constructor(id){this.id=id;this.sheets=[]}getId(){return this.id}getSheetByName(n){return this.sheets.find(s=>s.name===n)||null}insertSheet(n){const a=new Sheet(n);this.sheets.push(a);return a}getSpreadsheetTimeZone(){return 'America/Sao_Paulo'}}
const books=new Map([['base',new Book('base')],['agenda',new Book('agenda')]]);
// Drive simulado: pastas e arquivos com cópia, lixeira e tamanho.
let nid=0;const arquivos=new Map();
const iter=l=>{let i=0;return {hasNext:()=>i<l.length,next:()=>l[i++]}};
class Arq{constructor(nome,pai,tam=1000){this.id='f'+(++nid)+'x'.repeat(24);this.nome=nome;this.pai=pai;this.tam=tam;this.lixo=false;arquivos.set(this.id,this);pai&&pai.arqs.push(this);}
  getId(){return this.id}getName(){return this.nome}getUrl(){return 'https://drive.google.com/file/d/'+this.id+'/view'}getSize(){return this.tam}getBlob(){return {nome:this.nome}}getLastUpdated(){return new Date()}
  setTrashed(v){this.lixo=v;this.pai.arqs=this.pai.arqs.filter(a=>a!==this)}makeCopy(n,d){return new Arq(n,d,this.tam)}}
class Pasta{constructor(nome){this.nome=nome;this.subs=[];this.arqs=[];this.id='p'+(++nid)}getName(){return this.nome}getUrl(){return 'https://drive.google.com/drive/folders/'+this.id}
  getFoldersByName(n){return iter(this.subs.filter(s=>s.nome===n))}createFolder(n){const p=new Pasta(n);this.subs.push(p);return p}
  getFilesByName(n){return iter(this.arqs.filter(a=>a.nome===n))}getFiles(){return iter(this.arqs.slice())}createFile(b){return new Arq(b.nome,this,b.tam||5000)}}
const raiz=new Pasta('CPT • Entregas mensais');
const ctx={Date,JSON,console:{log(){},warn(){},error(){}},
  Session:{getActiveUser:()=>({getEmail:()=>email})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>Object.fromEntries(props),getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v)})},
  SpreadsheetApp:{openById:id=>books.get(id)},
  DriveApp:{getFolderById:id=>{if(id!=='raiz')throw Error('x');return raiz},getFileById:id=>{const a=arquivos.get(id);if(!a)throw Error('Arquivo sem acesso');return a},createFolder:()=>raiz},
  CacheService:{getScriptCache:()=>({get:()=>null,put(){},remove(){}})},
  Utilities:{getUuid:()=>crypto.randomUUID(),zip:(blobs,nome)=>({nome,tam:blobs.length*100}),formatDate:(d,_,f)=>new Date(d.getTime()-3*3600e3).toISOString().slice(0,f==='yyyy-MM'?7:10)},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})}};
vm.createContext(ctx);
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','PerfisCPT','ColecaoCPT','SocioambientalCPT','AplicacaoCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
// As fontes reais de cada arquivo (Fechamento, Parceiros) têm testes próprios: aqui só devolvem o último arquivo.
ctx.historico=[];ctx.parceiros={mes:'2026-10',versao:0,publicacao:null};
vm.runInContext(`class RelatorioMensalCPT{constructor(c){this.ctx=c}historicoGeracoes(){return historico}pasta(mes){const it=DriveApp.getFolderById('raiz').getFoldersByName(mes);return it.hasNext()?it.next():DriveApp.getFolderById('raiz').createFolder(mes)}}
class ProgramaParceirosCPT{constructor(c){}atual(){return parceiros}}`,ctx);
vm.runInContext(fs.readFileSync(__dirname+'/../src/EntregasDoMesCPT.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx)));
const op=()=>'OP-'+crypto.randomUUID();

// Quem vê: a mesa do relatório. Atendimento não.
email='atd@example.com';assert.throws(()=>run("carregarEntregasDoMesCPT('2026-10')"),/Socioambiental, Comunicação, Gestão e Administrativo/);
email='social@example.com';let c=run("carregarEntregasDoMesCPT('2026-10')");
assert.deepEqual(c.cartoes.map(x=>x.tipo),['relatorio','anexos','parceiros','atendimentos']);assert(c.cartoes.every(x=>x.situacao==='afazer'&&x.prazo==='2026-11-05'));
assert.equal(c.podeAlterar,false,'período de testes: só o proprietário altera');assert(c.pessoas.some(p=>p.email==='social@example.com')&&!c.pessoas.some(p=>p.email==='atd@example.com'));
ctx.p={mes:'2026-10',tipo:'relatorio',situacao:'preparo',responsavel:'',prazo:'',operacaoId:op()};assert.throws(()=>run('salvarEntregaDoMesCPT(p)'),/período de testes/);
// Proprietário: arquivo gerado deixa o cartão "Em preparo"; entregar sem arquivo não pode.
email='victor@example.com';
ctx.p={mes:'2026-10',tipo:'relatorio',situacao:'entregue',operacaoId:op()};assert.throws(()=>run('salvarEntregaDoMesCPT(p)'),/Ainda não há arquivo/);
assert.equal(raiz.subs.length,0,'abrir o painel não cria pastas');const mesP=raiz.createFolder('2026-10'),doc=new Arq('Relatório 15 — base',mesP);ctx.historico.push({versao:2,documento:'https://docs.google.com/document/d/'+doc.id+'/edit',em:'2026-11-02T12:00:00Z'});
c=run("carregarEntregasDoMesCPT('2026-10')");assert.equal(c.cartoes[0].situacao,'preparo');assert.match(c.cartoes[0].arquivo.titulo,/versão 2/);
ctx.p={mes:'2026-10',tipo:'relatorio',situacao:'revisao',responsavel:'social@example.com',prazo:'2026-11-04',operacaoId:op()};let r=run('salvarEntregaDoMesCPT(p)');
assert.equal(r.cartao.situacao,'revisao');assert.equal(r.cartao.responsavel,'social@example.com');assert.equal(r.cartao.prazo,'2026-11-04');
ctx.p={...ctx.p,responsavel:'ninguem@example.com',operacaoId:op(),versao:r.cartao.versao};assert.throws(()=>run('salvarEntregaDoMesCPT(p)'),/Responsável não encontrado/);
ctx.p={...ctx.p,responsavel:'social@example.com',situacao:'voando',operacaoId:op()};assert.throws(()=>run('salvarEntregaDoMesCPT(p)'),/situação da lista/);
// Entregue: retrato (cópia) na pasta do mês, em Entregues/<entrega> · v1. Gerar de novo depois não muda o retrato.
ctx.p={...ctx.p,situacao:'entregue',operacaoId:op()};r=run('salvarEntregaDoMesCPT(p)');assert.match(r.resultado,/entregue \(versão 1\)/);
assert.equal(r.cartao.entregas,1);assert.equal(r.cartao.retratos.length,1);assert.equal(r.cartao.retratos[0].copias.length,1);
const entregues=mesP.subs.find(s=>s.nome==='Entregues');assert.equal(entregues.subs[0].nome,'Relatório mensal · v1');assert.equal(entregues.subs[0].arqs[0].nome,'Relatório 15 — base');
// Voltar para revisão e entregar de novo vira a versão 2, com outro retrato.
ctx.p={...ctx.p,situacao:'revisao',versao:r.cartao.versao,operacaoId:op()};r=run('salvarEntregaDoMesCPT(p)');
ctx.p={...ctx.p,situacao:'entregue',versao:r.cartao.versao,operacaoId:op()};r=run('salvarEntregaDoMesCPT(p)');assert.equal(r.cartao.entregas,2);assert.equal(entregues.subs.length,2);
// Clique repetido (mesma operação) não tira outro retrato; versão antiga não copia nada.
const copias=()=>[...arquivos.values()].filter(a=>!a.lixo).length;let antes=copias();ctx.p={...ctx.p};r=run('salvarEntregaDoMesCPT(p)');assert.match(r.resultado,/já salvo/);assert.equal(copias(),antes,'sem cópia repetida');
ctx.p={mes:'2026-10',tipo:'relatorio',situacao:'revisao',versao:r.cartao.versao,operacaoId:op()};let rv=run('salvarEntregaDoMesCPT(p)');ctx.p={...ctx.p,situacao:'entregue',versao:1,operacaoId:op()};antes=copias();
assert.throws(()=>run('salvarEntregaDoMesCPT(p)'),/Outra pessoa alterou/);assert.equal(copias(),antes,'conflito não deixa cópia solta no Drive');
ctx.p={...ctx.p,situacao:'entregue',versao:rv.cartao.versao,operacaoId:op()};r=run('salvarEntregaDoMesCPT(p)');assert.equal(r.cartao.entregas,3);
// Conflito: versão antiga não grava por cima.
ctx.p={...ctx.p,situacao:'preparo',versao:1,operacaoId:op()};assert.throws(()=>run('salvarEntregaDoMesCPT(p)'),/Outra pessoa alterou/);
// Programa Parceiros: retrato só com link (máscara oficial não é copiada).
ctx.parceiros={mes:'2026-10',versao:3,publicacao:{url:'https://docs.google.com/spreadsheets/d/mascara',em:'2026-11-03T12:00:00Z'}};
ctx.p={mes:'2026-10',tipo:'parceiros',situacao:'entregue',operacaoId:op()};r=run('salvarEntregaDoMesCPT(p)');assert.equal(r.cartao.retratos[0].copias.length,0);assert.match(r.cartao.retratos[0].origem.url,/mascara/);
// Atendimentos: .zip das fichas (substitui o anterior), limite de 45 MB e retrato com o .zip.
assert.throws(()=>run("zipFichasDoMesCPT('2026-10')"),/Gere as fichas/);
const fichas=mesP.createFolder('Fichas');new Arq('P1_Ficha_Atendimento.pdf',fichas);new Arq('P2_Ficha_Atendimento.pdf',fichas);new Arq('anotacao.txt',fichas);
r=run("zipFichasDoMesCPT('2026-10')");assert.equal(r.fichas,2);r=run("zipFichasDoMesCPT('2026-10')");assert.equal(mesP.arqs.filter(a=>/\.zip$/.test(a.nome)).length,1,'zip anterior vai para a lixeira');
c=run("carregarEntregasDoMesCPT('2026-10')");const at=c.cartoes.find(x=>x.tipo==='atendimentos');assert(at.arquivo.zip);assert.equal(at.situacao,'preparo');
ctx.p={mes:'2026-10',tipo:'atendimentos',situacao:'entregue',operacaoId:op()};r=run('salvarEntregaDoMesCPT(p)');assert.match(r.cartao.retratos[0].copias[0].titulo,/\.zip$/);
new Arq('P3_Ficha_Atendimento.pdf',fichas,46*1024*1024);assert.throws(()=>run("zipFichasDoMesCPT('2026-10')"),/45 MB/);
// Depois de liberar: Socioambiental muda a situação, mas "Entregue" é com a gerência.
props.set('CPT_TRAVA_CONFIG','liberada');email='social@example.com';
ctx.p={mes:'2026-10',tipo:'anexos',situacao:'revisao',operacaoId:op()};r=run('salvarEntregaDoMesCPT(p)');assert.equal(r.cartao.situacao,'revisao');
props.set('CPT_ANEXOS:2026-10',JSON.stringify({doc:'https://docs.google.com/document/d/'+new Arq('Anexos',mesP).id+'/edit',em:'2026-11-01T10:00:00Z'}));
ctx.p={...ctx.p,situacao:'entregue',versao:r.cartao.versao,operacaoId:op()};assert.throws(()=>run('salvarEntregaDoMesCPT(p)'),/Gestão ou o Administrativo/);
email='adm@example.com';assert.equal(run("carregarEntregasDoMesCPT('2026-10')").podeEntregar,true);r=run('salvarEntregaDoMesCPT(p)');assert.equal(r.cartao.entregas,1);
console.log('PASS: entregas do mês — 4 cartões por perfil, travadas no período de testes, situação/responsável/prazo com conflito de versão, retrato ao entregar (cópia na pasta do mês; Parceiros só link), reentrega vira versão 2, .zip das fichas com limite e só a gerência marca Entregue.');
