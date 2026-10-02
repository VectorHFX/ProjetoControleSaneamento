// Gatilhos do Campo 4.0: conferir e reinstalar só os necessários. node campo40/testes/gatilhos.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const props=new Map([['CAMPO40_INSTALACAO',JSON.stringify({pronto:true,baseId:'BASE',formId:'FORM40',controlesCatalogos:true})],['CAMPO40_EXECUCAO',JSON.stringify({formId:'FORMEXEC'})]]);
let triggers=[];const T=(fn,tipo,origem)=>({fn,getHandlerFunction:()=>fn,getEventType:()=>tipo,getTriggerSourceId:()=>origem||null});
const novo=fn=>{const b={timeBased:()=>({everyHours:()=>({create:()=>triggers.push(T(fn,'CLOCK'))})}),forForm:id=>({onFormSubmit:()=>({create:()=>triggers.push(T(fn,'ON_FORM_SUBMIT',id))})}),forSpreadsheet:id=>({onEdit:()=>({create:()=>triggers.push(T(fn,'ON_EDIT',id))})})};return b;};
const ctx={console,JSON,Date,Math,Map,Set,Object,Array,String,Number,RegExp,
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v)})},
  LockService:{getScriptLock:()=>({tryLock:()=>true,waitLock:()=>{},releaseLock:()=>{}})},
  ScriptApp:{getProjectTriggers:()=>triggers.slice(),deleteTrigger:t=>{triggers=triggers.filter(x=>x!==t)},newTrigger:novo}};
vm.createContext(ctx);
for(const f of ['ConfiguracaoDaBase','ProcessamentoDosEnvios','ExecucaoDaEngenharia','GatilhosDoCampo40'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const proc=vm.runInContext('ProcessamentoDosEnvios.chave',ctx);props.set(proc,JSON.stringify({instalado:true,formId:'FORM40',baseId:'BASE'}));
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx)));
// Tudo apagado: conferir aponta os 4 que faltam, sem alterar.
let r=run('GatilhosDoCampo40.conferir()');assert.equal(r.faltando.length,4);assert.equal(triggers.length,0);
// Reinstalar cria exatamente os 4, com a origem certa.
r=run('GatilhosDoCampo40.reinstalar()');assert.equal(r.resultado,'GATILHOS EM ORDEM');assert.equal(triggers.length,4);
assert.deepEqual(triggers.map(t=>[t.fn,t.getEventType(),t.getTriggerSourceId()]).sort(),[['aoEditarCatalogosCampo40','ON_EDIT','BASE'],['aoReceberEnvioCampo40','ON_FORM_SUBMIT','FORM40'],['aoReceberExecucaoCampo40','ON_FORM_SUBMIT','FORMEXEC'],['retomarEnviosAutomaticamenteCampo40','CLOCK',null]]);
// Repetir não duplica; cópia repetida é removida; desconhecido fica e aparece.
run('GatilhosDoCampo40.reinstalar()');assert.equal(triggers.length,4);
triggers.push(T('retomarEnviosAutomaticamenteCampo40','CLOCK'),T('funcaoAntiga','CLOCK'));
r=run('GatilhosDoCampo40.conferir()');assert.match(r.resultado,/CÓPIAS REPETIDAS/);assert.deepEqual(r.desconhecidos,['funcaoAntiga · CLOCK']);
r=run('GatilhosDoCampo40.reinstalar()');assert.deepEqual(r.copiasRemovidas,['retomarEnviosAutomaticamenteCampo40']);assert.equal(triggers.length,5);assert.ok(triggers.some(t=>t.fn==='funcaoAntiga'),'desconhecido não é apagado');
// Gatilho do formulário apontando para outro formulário não conta.
triggers=triggers.filter(t=>t.fn!=='aoReceberEnvioCampo40');triggers.push(T('aoReceberEnvioCampo40','ON_FORM_SUBMIT','OUTRO'));
r=run('GatilhosDoCampo40.conferir()');assert.equal(r.faltando.length,1);
console.log('PASS: gatilhos — conferir não altera; reinstalar cria só os 4 necessários com a origem certa, não duplica, remove cópias e mantém desconhecidos.');
