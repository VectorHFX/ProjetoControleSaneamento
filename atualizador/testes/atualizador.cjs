// Atualizador (GitHub e API do Apps Script simulados). node atualizador/testes/atualizador.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const props=new Map();const chamadas=[];
const github={'app/src':{'AplicacaoCPT.gs':'nova','Estilos.html':'css','appsscript.json':'{"m":2}','LEIA.md':'x'},'campo40/src':{'ExecucaoDaEngenharia.gs':'exec2','PainelDaExecucao.gs':'painel'}};
const google={APP:[{name:'appsscript',type:'JSON',source:'{"m":1}',functionSet:{}},{name:'AplicacaoCPT',type:'SERVER_JS',source:'velha'},{name:'Estilos',type:'HTML',source:'css'},{name:'SoNoGoogle',type:'SERVER_JS',source:'x'},{name:'RelatorioMensalCPT',type:'SERVER_JS',source:'fechamento'},{name:'Fechamento',type:'HTML',source:'tela'}],
  CAMPO:[{name:'appsscript',type:'JSON',source:'{"campo":1}'},{name:'ExecucaoDaEngenharia',type:'SERVER_JS',source:'exec1'}]};
const resp=(code,obj)=>({getResponseCode:()=>code,getContentText:()=>typeof obj==='string'?obj:JSON.stringify(obj)});
const ctx={console:{log(){}},JSON,Map,Set,Object,Array,String,encodeURIComponent,Date,
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v)})},
 ScriptApp:{getOAuthToken:()=>'tok'},Utilities:{formatDate:()=>'02/10/2026 10:00'},
 UrlFetchApp:{fetch:(url,o)=>{chamadas.push([o.method||'get',url,o.payload]);
  if(url.includes('api.github.com')){if(o.headers.Authorization!=='Bearer ghp')return resp(401,'');const m=url.match(/contents\/(.+?)\?ref=/);if(url.includes('/commits'))return resp(200,[{sha:'abc1234567',commit:{message:'CPT 2.5\n\ndetalhes'}}]);
    const path=decodeURIComponent(m[1]);if(github[path])return resp(200,Object.keys(github[path]).map(n=>({type:'file',name:n})));const dir=path.slice(0,path.lastIndexOf('/')),f=path.slice(path.lastIndexOf('/')+1);return resp(200,github[dir][f]);}
  const id=url.match(/projects\/([^/]+)/)[1],proj=id==='1B2gVRbnDP9E4tdecW7lknY5Wq8QlRbmjXXenx-8cOPQX0wBmePmWUhML'?'APP':'CAMPO';
  if(url.endsWith('/content')&&(!o.method||o.method==='get'))return resp(200,{files:google[proj]});
  if(url.endsWith('/content')&&o.method==='put'){google[proj]=JSON.parse(o.payload).files;return resp(200,{});}
  if(url.endsWith('/versions'))return resp(200,{versionNumber:chamadas.filter(c=>c[1].endsWith('/versions')).length+10});
  if(url.endsWith('/deployments'))return resp(200,{deployments:[{deploymentId:'HEAD',deploymentConfig:{}},{deploymentId:'WEB1',deploymentConfig:{versionNumber:3},entryPoints:[{entryPointType:'WEB_APP'}]}]});
  if(url.includes('/deployments/WEB1'))return resp(200,{});throw Error('inesperado '+url);}}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/../src/AtualizadorCPT.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx)));
assert.throws(()=>run('conferirAtualizacaoCPT()'),/token do GitHub/);
props.set('CPT_ATUALIZADOR',JSON.stringify({token:'ghp',scriptIds:{campo40:'CAMPOID'}}));
const antes=JSON.stringify(google);let r=run('conferirAtualizacaoCPT()');assert.equal(JSON.stringify(google),antes,'conferir não altera');
assert.deepEqual(r.projetos[0].alterar.sort(),['AplicacaoCPT','appsscript']);assert.deepEqual(r.projetos[0].manterSoNoGoogle,['SoNoGoogle']);assert.deepEqual(r.projetos[0].remover,['RelatorioMensalCPT','Fechamento'],'aposentados (2.27) saem do Google');assert.deepEqual(r.projetos[1].criar,['PainelDaExecucao']);
r=run('atualizarTudoCPT()');const app=Object.fromEntries(google.APP.map(f=>[f.name,f]));
assert.equal(app.AplicacaoCPT.source,'nova');assert.equal(app.SoNoGoogle.source,'x','arquivo só do Google mantido');assert.ok(!app.RelatorioMensalCPT&&!app.Fechamento,'aposentados apagados');assert.deepEqual(r.resultados[0].removidos,['RelatorioMensalCPT','Fechamento']);assert.equal(google.APP[0].name,'appsscript');assert.ok(!('functionSet' in google.APP[0]),'só name/type/source vão para a API');assert.ok(!app.LEIA,'só .gs/.html/.json');
const campo=Object.fromEntries(google.CAMPO.map(f=>[f.name,f]));assert.equal(campo.appsscript.source,'{"campo":1}','manifesto do Campo mantido');assert.equal(campo.PainelDaExecucao.type,'SERVER_JS');
assert.ok(r.resultados[0].versaoDeSeguranca);assert.match(r.resultados[0].publicacao,/versão/);
const put=chamadas.find(c=>c[1].includes('/deployments/WEB1'));assert.equal(JSON.parse(put[2]).deploymentConfig.versionNumber>r.resultados[0].versaoDeSeguranca,true,'publica a versão nova, depois da de segurança');
assert.ok(!chamadas.some(c=>c[1].includes('deployments/HEAD')),'não mexe na implantação de teste');
r=run('atualizarTudoCPT()');assert.match(r.resultados[0].resultado,/Já estava atualizado/);
console.log('PASS: atualizador — conferir sem alterar, versão de segurança, mescla (arquivos só do Google ficam, manifesto do Campo mantido), publicação no mesmo link e repetição sem efeito.');
