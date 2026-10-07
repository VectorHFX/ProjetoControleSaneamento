// Levantamento de traçado (2.33) com serviços Google simulados. node app/testes/levantamento.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
let email='social@example.com',locked=false;
const pessoa=(e,n,papeis)=>['CPT_PESSOA:'+e,JSON.stringify({email:e,nome:n,papeis,ativo:true,versao:1})];
const props=new Map([['CPT_APLICACAO_1',JSON.stringify({baseId:'base',administrador:'victor@example.com',agendaId:'agenda',versao:'2.33.0'})],
  pessoa('social@example.com','Ana',['socioambiental']),pessoa('com@example.com','Paula',['comunicacao'])]);
class Sheet{constructor(n,rows=[]){this.name=n;this.rows=rows;this.escritas=0;}getName(){return this.name}getLastRow(){return this.rows.length}getMaxColumns(){return 37}setFrozenRows(){}
  getRange(r,c,n=1,m=1){const s=this;const vals=()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.rows[r+i-1]?.[c+j-1]??''));let px;
    const api={getValues:vals,getValue:()=>vals()[0][0],setValues:v=>{s.escritas++;v.forEach((row,i)=>{while(s.rows.length<r+i)s.rows.push([]);row.forEach((x,j)=>s.rows[r+i-1][c+j-1]=x)});return px}};
    px=new Proxy(api,{get:(t,k)=>k in t?t[k]:()=>px});return px;}}
class Book{constructor(id,sheets){this.id=id;this.sheets=sheets}getId(){return this.id}getSheetByName(n){return this.sheets.find(s=>s.name===n)||null}insertSheet(n){const a=new Sheet(n);this.sheets.push(a);return a}getSpreadsheetTimeZone(){return 'America/Sao_Paulo'}}
// Obras: A=ID, B=nome oficial, C=bairros (;), T=situação; bloco da aplicação a partir de AF (nome de uso em AJ).
const obra=(id,nome,bairros,situacao,uso)=>{const r=Array(37).fill('');r[0]=id;r[1]=nome;r[2]=bairros;r[19]=situacao;r[35]=uso||'';return r;};
const obras=new Sheet('Obras',[Array(37).fill('cab'),obra('OBR-1','Viela Sanitária x Carijós','Vila Linda; Jardim do Estádio','Em andamento','Viela Carijós'),obra('OBR-2','Coletor Antigo','Centro','Finalizada'),obra('OBR-3','Rede Nova','','A confirmar')]);
const books=new Map([['base',new Book('base',[obras,new Sheet('Registros',[['ID']]),new Sheet('Atendimentos',[['Protocolo']])])],['agenda',new Book('agenda',[])]]);
const cacheMap=new Map();
const ctx={Date,console:{log(){},warn(){},error(){}},JSON,
  Session:{getActiveUser:()=>({getEmail:()=>email})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>Object.fromEntries(props),getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
  SpreadsheetApp:{openById:id=>{if(!books.has(id))throw Error('Não existe');return books.get(id)}},
  CacheService:{getScriptCache:()=>({get:k=>cacheMap.get(k)||null,put:(k,v)=>cacheMap.set(k,v),remove:k=>cacheMap.delete(k)})},
  Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:(d,_,f)=>{const s=new Date(d.getTime()-3*3600e3).toISOString();return f==='yyyy-MM'?s.slice(0,7):f==='yyyy-MM-dd'?s.slice(0,10):s.slice(0,16)}},
  LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},releaseLock:()=>locked=false})}};
vm.createContext(ctx);
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','SocioambientalCPT','PerfisCPT','CronogramaCPT','ObrasCPT','ObrasDoDiaCPT','AplicacaoCPT','ColecaoCPT','LevantamentoCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx))),op=()=>'OP-lev-'+crypto.randomUUID();
const aba=()=>books.get('agenda').getSheetByName('Levantamento de traçado');
const casa=(x={})=>({operacaoId:op(),obraId:'OBR-1',bairro:'Vila Linda',rua:'Rua das Flores',numero:'10',tipo:'Residencial',imovel:'Casa',resultado:'Comunicado',observacao:'',visitadaEm:new Date(Date.now()-36e5).toISOString(),...x});
const enviar=itens=>{ctx.p={itens};return run('enviarLevantamentoCPT(p)');};

// 0. Aba criada à mão e vazia: o primeiro envio põe o cabeçalho (sem ele, a primeira casa viraria cabeçalho).
books.get('agenda').insertSheet('Levantamento de traçado');
// 1. Consulta sem nada levantado: não cria a aba; obras com o nome de uso, ativas primeiro.
let l=run('listarLevantamentoCPT()');assert.equal(l.itens.length,0);assert.equal(aba().rows.length,0,'só consultar não escreve na aba');
assert.deepEqual(l.obras.map(o=>o.nome),['Viela Carijós','Rede Nova','Coletor Antigo']);assert.deepEqual(l.obras[0].bairros,['Vila Linda','Jardim do Estádio']);
assert.deepEqual(l.resultados,['Comunicado','Contato com morador']);
console.log('PASS: consulta — sem aba criada à toa, obras pelo nome de uso (ativas primeiro) com os bairros e as opções.');

// 2. Lote: três casas numa gravação só; a mesma operação não grava duas vezes.
const a=casa(),b=casa({numero:'12',tipo:'Comercial',resultado:'Contato com morador'}),c=casa({numero:'14 A',bairro:'Bairro Inventado'});
let r=enviar([a,b,c]);assert.equal(r.salvas,3);assert.deepEqual(r.resultados.map(x=>x.situacao),['salva','salva','salva']);
assert.equal(aba().rows.length,4);assert.equal(aba().rows[0][0],'ID','cabeçalho na aba vazia');assert.equal(aba().escritas,2,'cabeçalho + um bloco com as três casas');
assert.equal(r.resultados[0].casa.nome,'Ana');assert.equal(r.resultados[0].casa.obra,'Viela Carijós');
assert.equal(r.resultados[2].casa.bairro,'Vila Linda','bairro fora da obra vira o primeiro bairro da obra');
r=enviar([a]);assert.equal(r.resultados[0].situacao,'ja-recebida');assert.equal(aba().rows.length,4,'reenvio (conexão caiu) não duplica');
console.log('PASS: lote — várias casas numa gravação, bairro conferido com a obra, reenvio da mesma operação não duplica.');

// 3. Mesma casa (sem acento, caixa e espaços): "duplicada" sem mexer; com atualizar, troca a linha no lugar.
r=enviar([casa({rua:'  RUA das  flores ',numero:'14a',resultado:'Contato com morador'})]);assert.equal(r.resultados[0].situacao,'duplicada');assert.equal(r.duplicadas,1);
assert.equal(r.resultados[0].casa.numero,'14 A','devolve a casa que já estava');assert.equal(aba().rows.length,4);
email='com@example.com';const novo=casa({numero:'14 A',resultado:'Contato com morador',imovel:'Prédio',atualizar:true});r=enviar([novo]);
assert.equal(r.resultados[0].situacao,'atualizada');assert.equal(aba().rows.length,4,'atualiza no lugar');
const linha=aba().rows[3];assert.equal(linha[9],'Contato com morador');assert.equal(linha[8],'Prédio');assert.equal(linha[15],'com@example.com');assert.equal(linha[12],'social@example.com','quem levantou primeiro continua registrado');
r=enviar([novo]);assert.equal(r.resultados[0].situacao,'ja-recebida','atualização reenviada também não repete');
// Duas iguais no mesmo lote: a segunda pede decisão.
r=enviar([casa({numero:'30'}),casa({numero:'30',resultado:'Contato com morador'})]);assert.deepEqual(r.resultados.map(x=>x.situacao),['salva','duplicada']);
// Atualizar uma casa que entrou no mesmo lote: vai na mesma gravação, já atualizada.
r=enviar([casa({numero:'32'}),casa({numero:'32',resultado:'Contato com morador',atualizar:true})]);assert.deepEqual(r.resultados.map(x=>x.situacao),['salva','atualizada']);
assert.equal(aba().rows.find(x=>x[6]==='32')[9],'Contato com morador');
console.log('PASS: casa repetida — avisa sem mexer, "atualizar" troca no lugar e guarda quem atualizou, repetida no mesmo lote também pega.');

// 4. Inválidas não derrubam o lote; hora da visita fora do razoável vira a hora do envio.
const futuro=new Date(Date.now()+5*864e5).toISOString();
r=enviar([casa({obraId:'OBR-9',numero:'40'}),casa({numero:'',rua:'Rua X'}),casa({numero:'41',tipo:'Galpão'}),casa({numero:'42',visitadaEm:futuro}),{...casa({numero:'43'}),operacaoId:'x'}]);
assert.deepEqual(r.resultados.map(x=>x.situacao),['invalida','invalida','invalida','salva','invalida']);assert.equal(r.invalidas,4);
assert.match(r.resultados[0].mensagem,/Obra não encontrada/);assert.match(r.resultados[1].mensagem,/número/);assert.match(r.resultados[2].mensagem,/tipo/);
assert.ok(Math.abs(new Date(r.resultados[3].casa.visitadaEm)-Date.now())<6e4,'visita no futuro vira a hora do envio');
console.log('PASS: inválidas — obra fora do catálogo, número vazio, tipo fora da lista e identificação ruim voltam com mensagem; as boas do lote entram.');

// 5. Limites, trava e cabeçalho.
assert.throws(()=>enviar([]),/Nada para enviar/);assert.throws(()=>enviar(Array.from({length:101},()=>casa())),/até 100/);
locked=true;assert.throws(()=>enviar([casa({numero:'50'})]),/continuam guardadas no celular/);locked=false;
l=run('listarLevantamentoCPT()');assert.equal(l.itens.length,aba().rows.length-1);assert.ok(l.itens.every(x=>x.obraId&&x.rua&&x.numero&&x.resultado));
aba().rows[0][5]='Logradouro';assert.throws(()=>run('listarLevantamentoCPT()'),/incompatível/);aba().rows[0][5]='Rua';
console.log('PASS: limites — lote vazio ou acima de 100 recusado, outro envio em andamento avisa que as casas seguem no celular, cabeçalho alterado não é sobrescrito.');
