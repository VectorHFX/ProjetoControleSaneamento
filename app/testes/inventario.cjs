// Inventário do Drive (serviços simulados, nomes fictícios). node app/testes/inventario.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const now=Date.now(),d=n=>new Date(now-n*864e5);
const arqs=[['base','Procedimentos de Campo 4.0 — Base','application/vnd.google-apps.spreadsheet',d(1)],['x1','Cópia de Painel de atendimento','application/vnd.google-apps.spreadsheet',d(2)],
 ['x2','Painel Gestão 3.2','application/vnd.google-apps.script',d(90)],['x3','Central de Atendimentos','application/vnd.google-apps.spreadsheet',d(5)],['x4','ATD20260007 Ficha de Atendimento','application/vnd.google-apps.document',d(1)],['x5','Planejamento','application/vnd.google-apps.document',d(200)],['form4','Formulário Campo','application/vnd.google-apps.form',d(3)]];
let escrito=null;
const ctx={console,JSON,Date,Map,Set,Math,Object,String,Number,Array,
 PropertiesService:{getScriptProperties:()=>({getProperty:()=>JSON.stringify({baseId:'base',administrador:'v@x',agendaId:'agenda'})})},
 ScriptApp:{getScriptId:()=>'app'},
 SpreadsheetApp:{openById:id=>({getFormUrl:()=>id==='base'?'https://docs.google.com/forms/d/form4/edit':null}),create:n=>({getUrl:()=>'url',getSheets:()=>[{setName(){return this},getRange:()=>({setValues(v){escrito=(escrito||[]).concat(v);return this},setFontWeight(){return this}}),setFrozenRows(){}}]})},
 FormApp:{openByUrl:u=>({getId:()=>u.match(/d\/([^/]+)/)[1]})},
 DriveApp:{searchFiles:()=>{let i=0;return {hasNext:()=>i<arqs.length,next:()=>{const a=arqs[i++];return {getId:()=>a[0],getName:()=>a[1],getMimeType:()=>a[2],getLastUpdated:()=>a[3],getUrl:()=>'https://x/'+a[0],getParents:()=>({hasNext:()=>false})}}}}},
 Utilities:{formatDate:()=>'2026-10-02'}};
vm.createContext(ctx);for(const f of ['AplicacaoCPT','FichaOficialCPT','InventarioDriveCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const r=JSON.parse(JSON.stringify(vm.runInContext('InventarioDriveCPT.executar()',ctx)));
const sug=Object.fromEntries(escrito.slice(1).map(l=>[l[2],l[0]]));
assert.equal(sug['Procedimentos de Campo 4.0 — Base'],'EM USO');assert.equal(sug['Formulário Campo'],'EM USO');assert.equal(sug['Cópia de Painel de atendimento'],'LEGADO');
assert.equal(sug['Painel Gestão 3.2'],'LEGADO');assert.equal(sug['Central de Atendimentos'],'REVISAR');assert.equal(sug['ATD20260007 Ficha de Atendimento'],'GERADO PELO SISTEMA');assert.equal(sug['Planejamento'],'REVISAR');
console.log('PASS inventário',JSON.stringify(r.resumo));
