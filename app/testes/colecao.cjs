// Coleções (2.37): retrato do estado atual + cauda do histórico. node app/testes/colecao.cjs
// Confere a cada passo contra a leitura completa do histórico (a regra antiga), com escritas misturadas, retrato refeito,
// "queda" no meio da troca, histórico mexido à mão e quantas linhas cada leitura toca.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
let email='victor@example.com',locked=false,lidas=0;
const props=new Map([['CPT_APLICACAO_1',JSON.stringify({baseId:'base',administrador:email,agendaId:'agenda-0123456789',versao:'2.37.0'})],
  ['CPT_PESSOA:ana@example.com',JSON.stringify({email:'ana@example.com',nome:'Ana',papeis:['socioambiental'],ativo:true,versao:1})]]);
class Sheet{constructor(n,rows=[]){this.name=n;this.rows=rows;}getName(){return this.name}getLastRow(){return this.rows.length}setFrozenRows(){}
  getRange(r,c,n=1,m=1){const s=this;const vals=()=>{lidas+=n;return Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.rows[r+i-1]?.[c+j-1]??''));};let px;
    const api={getValues:vals,getValue:()=>vals()[0][0],setValues:v=>{if(s.falhar){s.falhar=false;throw Error('queda simulada');}v.forEach((row,i)=>{while(s.rows.length<r+i)s.rows.push([]);row.forEach((x,j)=>s.rows[r+i-1][c+j-1]=x)});return px}};
    px=new Proxy(api,{get:(t,k)=>k in t?t[k]:()=>px});return px;}}
class Book{constructor(id,sheets){this.id=id;this.sheets=sheets}getId(){return this.id}getSheetByName(n){return this.sheets.find(s=>s.name===n)||null}insertSheet(n){const a=new Sheet(n);this.sheets.push(a);return a}getSpreadsheetTimeZone(){return 'America/Sao_Paulo'}}
const agenda=new Book('agenda-0123456789',[]),books=new Map([['agenda-0123456789',agenda],['base',new Book('base',[])]]),cacheMap=new Map();
const ctx={Date,console:{log(){},warn(){},error(){}},JSON,
  Session:{getActiveUser:()=>({getEmail:()=>email})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>Object.fromEntries(props),getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
  SpreadsheetApp:{openById:id=>{if(!books.has(id))throw Error('Não existe');return books.get(id)}},
  CacheService:{getScriptCache:()=>({get:k=>usarCache?cacheMap.get(k)||null:null,put:(k,v)=>cacheMap.set(k,v),remove:k=>cacheMap.delete(k)})},
  Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:(d,_,f)=>new Date(d.getTime()-3*3600e3).toISOString().slice(0,f==='yyyy-MM'?7:10)},
  LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},releaseLock:()=>locked=false})}};
let usarCache=false;
vm.createContext(ctx);
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','SocioambientalCPT','PerfisCPT','ObrasDoDiaCPT','AplicacaoCPT','ColecaoCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx))),op=()=>'OP-'+crypto.randomUUID();
const hist=()=>agenda.getSheetByName('Notas'),atual=()=>agenda.getSheetByName('Notas · atual'),chave='CPT_RETRATO:'+'0123456789'+':Notas';
// Regra antiga: maior versão de cada ID lendo o histórico inteiro, na ordem da primeira aparição.
const completo=()=>{const m=new Map();hist().rows.slice(1).forEach(r=>{const e=JSON.parse(r[5]);const x=m.get(e.id);if(!x||x.versao<e.versao)m.set(e.id,e);});return [...m.values()];};
const ler=()=>run("new ColecaoCPT(AplicacaoCPT.identidade(),'Notas','NOT').itens()");
// Escrita como as telas fazem: ColecaoCPT.executar com escrita (trava) — o retrato é mantido no fim.
const escrever=(id,texto)=>{ctx.p={id,texto,op:op()};return run("ColecaoCPT.executar('t',c=>{const col=new ColecaoCPT(c,'Notas','NOT'),x=p.id?col.obter(p.id):null;return col.gravar({id:p.id||'',texto:p.texto},x?x.versao:0,p.op);},true)");};
const confere=msg=>{const a=ler(),b=completo();assert.deepEqual(a.map(x=>x.id),b.map(x=>x.id),msg+' (ordem e itens)');assert.deepEqual(a,b,msg);};

// 1. Até o limite da cauda: nada muda (sem retrato).
const ids=[];for(let i=0;i<20;i++)ids.push(escrever('', 'nota '+i).id);
for(let i=0;i<250;i++)escrever(ids[i%20],'edição '+i);
assert.equal(atual(),null,'sem retrato enquanto a cauda é curta');confere('sem retrato');
// 2. Passou do limite: a próxima escrita refaz o retrato; a leitura passa a tocar retrato + cauda curta.
for(let i=0;i<60;i++)escrever(ids[(i*7)%20],'mais '+i);
assert.ok(atual(),'retrato criado numa escrita');const r=JSON.parse(props.get(chave));assert.equal(r.n,20);assert.ok(r.ate<=hist().getLastRow()&&hist().getLastRow()-r.ate<=300,'retrato feito na escrita que passou do limite');
confere('logo depois do retrato');
lidas=0;ler();const cauda=hist().getLastRow()-r.ate;assert.equal(lidas,20+cauda,'leitura toca só o retrato (20) + a cauda ('+cauda+'), não as '+hist().getLastRow()+' revisões');
// 3. Escritas novas (itens novos e antigos) depois do retrato: retrato + cauda continuam certos.
for(let i=0;i<40;i++){if(i%10===0)ids.push(escrever('','nova '+i).id);else escrever(ids[i%ids.length],'depois '+i);confere('cauda '+i);}
// 4. "Queda" no meio da troca do retrato (gravou o retrato, não a marca): a leitura com a marca antiga continua certa.
for(let i=0;i<320;i++)escrever(ids[i%ids.length],'lote '+i);
const marca=props.get(chave);props.set(chave+'-bak',marca);
const antes=JSON.parse(props.get(chave));for(let i=0;i<5;i++)escrever(ids[i],'x'+i);
// simula: retrato refeito à mão até agora, mas a marca volta para a antiga
run("(()=>{const c=AplicacaoCPT.identidade();const col=new ColecaoCPT(c,'Notas','NOT');const p=PropertiesService.getScriptProperties();p.deleteProperty(col.chaveRetrato());col.refazerSePreciso();return 1;})()");
props.set(chave,props.get(chave+'-bak'));confere('marca antiga com retrato novo');
// 5. Falha ao gravar o retrato: a escrita do usuário não cai e a leitura segue certa.
for(let i=0;i<310;i++)escrever(ids[i%ids.length],'falha '+i);
const ar=atual();ar.falhar=true;const ok=escrever(ids[0],'escrita com retrato falhando');assert.ok(ok.id,'escrita salva mesmo se o retrato falhar');confere('depois da falha');
// 6. Histórico mexido à mão (linhas apagadas no fim): sem usar o retrato, lê tudo de novo.
hist().rows.length=Math.max(2,JSON.parse(props.get(chave)).ate-50);confere('histórico encurtado');
// 6b. Aba do retrato apagada ou cortada à mão: a leitura continua certa e a próxima escrita refaz o retrato.
for(let i=0;i<310;i++)escrever(ids[i%ids.length],'refaz '+i);assert.ok(atual());
atual().rows.length=5;confere('retrato cortado à mão');escrever(ids[2],'depois do corte');assert.equal(atual().rows.length-1,JSON.parse(props.get(chave)).n,'retrato refeito por inteiro');confere('retrato refeito');
agenda.sheets=agenda.sheets.filter(s=>s.name!=='Notas · atual');confere('retrato apagado');escrever(ids[3],'depois de apagar');assert.ok(atual(),'retrato recriado na próxima escrita');confere('retrato recriado');
// 7. Repetir a mesma operação não grava duas vezes (procura nas últimas 1000 revisões).
ctx.q={id:ids[1],op:op()};const g=()=>run("ColecaoCPT.executar('t',c=>{const col=new ColecaoCPT(c,'Notas','NOT'),x=col.obter(q.id);return col.gravar({id:q.id,texto:'uma vez'},x.versao,q.op);},true)");
const n0=hist().getLastRow(),v1=g(),v2=g();assert.equal(v1.versao,v2.versao);assert.equal(hist().getLastRow(),n0+1,'repetição não duplica');
// 8. Com cache ligado (uso real), o resultado é o mesmo.
usarCache=true;confere('com cache');
console.log('PASS: coleções — retrato do estado atual + cauda: igual à leitura completa a cada passo, leitura toca ~'+'20 linhas em vez de '+n0+', segura com queda no meio da troca, falha ao gravar o retrato e histórico mexido à mão; repetição não duplica.');
