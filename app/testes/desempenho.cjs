// Desempenho no servidor: planilha aberta uma vez por execução e cache comprimido (gzip). node app/testes/desempenho.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),zlib=require('zlib');
const store=new Map();let aberturas=0;
const blob=(bytes,tipo)=>({getBytes:()=>[...bytes],getDataAsString:()=>Buffer.from(bytes).toString('utf8'),tipo});
const ctx={console,JSON,Date,Math,Map,Set,Object,Array,String,Number,RegExp,Buffer,
  CacheService:{getScriptCache:()=>({get:k=>store.get(k)??null,put:(k,v)=>{if(Buffer.byteLength(v)>100000)throw new Error('Argument too large');store.set(k,v);}})},
  Utilities:{newBlob:(d,t)=>blob(typeof d==='string'?Buffer.from(d,'utf8'):Buffer.from(d),t),gzip:b=>blob(zlib.gzipSync(Buffer.from(b.getBytes()))),ungzip:b=>blob(zlib.gunzipSync(Buffer.from(b.getBytes()))),
    base64Encode:b=>Buffer.from(b).toString('base64'),base64Decode:s=>[...Buffer.from(s,'base64')]},
  SpreadsheetApp:{openById:id=>{aberturas++;return {id};}},
  DesempenhoCPT:{medir:(_,f)=>f()}};
vm.createContext(ctx);
for(const f of ['CacheCPT','AplicacaoCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
// 1) Mesma planilha, várias aberturas na mesma execução → uma só chamada ao Google.
run("planilhaCPT_('AGENDA');planilhaCPT_('AGENDA');planilhaCPT_('BASE');planilhaCPT_('AGENDA');");
assert.equal(aberturas,2,'abre cada planilha uma vez');
assert.equal(run("planilhaCPT_('AGENDA')===planilhaCPT_('AGENDA')"),true);
// executar() começa do zero (nova execução = planilha aberta de novo).
run("AplicacaoCPT.contexto=()=>({base:planilhaCPT_('BASE'),perfil:{}});DadosDaAplicacao=function(){};");
aberturas=0;run("AplicacaoCPT.executar(()=>planilhaCPT_('BASE'))");assert.equal(aberturas,1,'executar limpa no começo e reaproveita dentro');
// 2) Cache: valor pequeno vai puro; grande vai comprimido e volta idêntico (com acentos).
run("CacheCPT.gravar('pequeno',{a:1},60)");assert.equal(store.get('23:pequeno'),'{"a":1}');
const grande={itens:Array.from({length:3000},(_,i)=>({id:'REG-'+i,atividade:'Ação socioambiental na Vila Assunção',bairro:'Jardim do Estádio',publico:i%40}))};
const bruto=JSON.stringify(grande);assert.ok(bruto.length>95000,'antes não cabia no cache ('+bruto.length+' caracteres)');
ctx.grande=grande;run("CacheCPT.gravar('grande',grande,60)");
const guardado=store.get('23:grande');assert.ok(guardado&&guardado.startsWith('z:'),'guardado comprimido');assert.ok(guardado.length<95000);
assert.deepEqual(JSON.parse(JSON.stringify(run("CacheCPT.ler('grande')"))),grande,'volta idêntico');
// obter: segunda leitura não recalcula.
let calc=0;ctx.calc=()=>{calc++;return grande;};run("CacheCPT.obter('k',60,calc)");run("CacheCPT.obter('k',60,calc)");assert.equal(calc,1);
// Sem gzip disponível: grava puro (se couber) e nunca quebra.
ctx.Utilities.gzip=()=>{throw new Error('indisponível');};run("CacheCPT.gravar('semgzip',{b:'é'.repeat(30000)},60)");assert.equal(JSON.parse(store.get('23:semgzip')).b.length,30000);
// Valor corrompido: lê como vazio e recalcula.
store.set('23:ruim','z:@@@');assert.equal(run("CacheCPT.ler('ruim')"),null);
console.log('PASS: desempenho — cada planilha aberta uma vez por execução; cache comprimido (gzip) guarda o que antes não cabia ('+Math.round(bruto.length/1000)+' KB → '+Math.round(guardado.length/1000)+' KB) e devolve idêntico.');
