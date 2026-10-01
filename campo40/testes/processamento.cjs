// Testes locais do ProcessamentoDosEnvios (serviços Google simulados). node campo40/testes/processamento.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
const props=new Map();let locked=false;
const fmt=(d,_,f)=>{const iso=new Date(d.getTime()-3*3600e3).toISOString();return f==='yyyy-MM'?iso.slice(0,7):iso.slice(0,10);};
const ctx={console:{log(){},warn(){},error(){}},JSON,Date,
  Utilities:{computeDigest:(_,v)=>[...crypto.createHash('sha256').update(v).digest()].map(b=>b>127?b-256:b),DigestAlgorithm:{SHA_256:1},Charset:{UTF_8:1},formatDate:fmt},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k),getProperties:()=>Object.fromEntries(props)})},
  LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true;},releaseLock:()=>{locked=false;}})},
  ScriptApp:{getProjectTriggers:()=>[]}};
vm.createContext(ctx);for(const f of ['ConfiguracaoDaBase','RepositorioDosRegistros','ProcessamentoDosEnvios'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
// 1. Vigência das referências: pela data de realização.
const esquema={formularioId:'F',campos:{procedimento:'p',data:'d',bairro:'b',obra:'o',responsavel:'r',area:'a',atividade:'t',publico:'n',protocolo:[]}};
ctx.contexto={esquema,config:{baseId:'B'},repositorio:{fuso:'America/Sao_Paulo'},catalogos:{bairros:[{id:'BAI-1',nome:'Vila Linda',tipo:''}],obras:[{id:'OBR-0001',bairroIds:['BAI-1']}]}};
const snap=data=>({formularioId:'F',respostaId:'R'+data,carimbo:'2026-10-02T12:00:00.000Z',campos:[{id:'p',valor:'Relato de atividade'},{id:'d',valor:data},{id:'b',valor:'Vila Linda'},{id:'o',valor:'Obra X [OBR-0001]'},{id:'n',valor:'12'}]});
ctx.s=snap('2026-09-30');let r=run('ProcessamentoDosEnvios.preparar(s,contexto)');assert.equal(r.linha[8],'');assert.equal(r.linha[10],'');assert.match(r.linha[16],/antes de 01\/10\/2026/);assert.equal(r.linha[7],'Vila Linda');assert.equal(r.detalhes.vinculos.avisos.length,0);
ctx.s=snap('2026-10-01');r=run('ProcessamentoDosEnvios.preparar(s,contexto)');assert.equal(r.linha[8],'BAI-1');assert.equal(r.linha[10],'OBR-0001');assert.equal(r.linha[16],'ID da obra informado no formulário');
console.log('PASS: obras e bairros com ID só para atividades realizadas a partir de 01/10/2026; anteriores mantêm o texto original.');
// 2. Retomada: uma falha (ou resposta editada) não bloqueia as seguintes; 3 falhas seguidas interrompem.
const resp=(id,t)=>({getId:()=>id,getTimestamp:()=>new Date(t)});
let respostas=[resp('A',1000),resp('B',2000),resp('C',3000)],comportamento={};
props.set('CAMPO40_INSTALACAO',JSON.stringify({pronto:true,baseId:'B',formId:'F'}));props.set('CAMPO40_OPERACAO_1',JSON.stringify({instalado:true,baseId:'B',formId:'F',cursor:{tempo:0,id:''}}));
ctx.FormApp={openById:()=>({getDestinationId:()=>'B',getResponses:()=>respostas,getResponse:id=>respostas.find(x=>x.getId()===id)||null})};
ctx.comportamento=comportamento;run(`ProcessamentoDosEnvios.contexto=function(){return {config:{baseId:'B',formId:'F'}};};ProcessamentoDosEnvios.receber=function(r){const c=comportamento[r.getId()];if(c==='erro')throw new Error('falhou '+r.getId());if(c==='editada')return {revisao:true,inserido:false};PropertiesService.getScriptProperties().deleteProperty(this.chaveFalha(r.getId()));return {inserido:true};};`);
comportamento.A='editada';comportamento.B='erro';
r=JSON.parse(JSON.stringify(run('ProcessamentoDosEnvios.retomar()')));assert.equal(r.novos,1);assert.equal(r.respostasEditadas,1);assert.equal(r.falhas,1);assert.equal(r.falhasPendentes,1);assert.equal(JSON.parse(props.get('CAMPO40_OPERACAO_1')).cursor.id,'C');assert.equal(locked,false);
delete comportamento.B;r=JSON.parse(JSON.stringify(run('ProcessamentoDosEnvios.retomar()')));assert.equal(r.novos,1);assert.equal(r.falhasPendentes,0);assert.equal(r.resultado,'ENVIOS REAIS CONFERIDOS');
respostas.push(resp('D',4000),resp('E',5000),resp('F',6000),resp('G',7000));Object.assign(comportamento,{D:'erro',E:'erro',F:'erro'});
r=JSON.parse(JSON.stringify(run('ProcessamentoDosEnvios.retomar()')));assert.match(r.resultado,/INTERROMPIDA/);assert.equal(r.falhasPendentes,3);assert.equal(JSON.parse(props.get('CAMPO40_OPERACAO_1')).cursor.id,'F');
console.log('PASS: resposta editada e falha isolada não travam a fila; falha geral interrompe sem perder envios.');
