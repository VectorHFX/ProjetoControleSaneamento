// Anexos do relatório (2.26): Controle de manifestações acumulativo na planilha oficial, como nas Fichas Oficiais 3.2.1.
// Nunca apaga, nunca reordena, não reabre concluído, não troca texto manual por vazio, não mexe em fórmula,
// e as abas Matriz de Contatos e Indicadores 2026 ficam intactas. node app/testes/anexos.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
let email='victor@example.com',locked=false;
const pessoa=(e,n,papeis)=>['CPT_PESSOA:'+e,JSON.stringify({email:e,nome:n,papeis,ativo:true,versao:1})];
const props=new Map([['CPT_APLICACAO_1',JSON.stringify({baseId:'base',administrador:'victor@example.com',agendaId:'agenda',versao:'2.8.0'})],
  pessoa('gestao@example.com','Gestão',['gestao']),pessoa('social@example.com','Social',['socioambiental']),pessoa('atd@example.com','Atd',['atendimento'])]);
class Sheet{constructor(n,rows=[]){this.name=n;this.rows=rows;this.notes=[];this.formulas=[];this.maxRows=Math.max(rows.length,30);this.escritas=0;}
  getName(){return this.name}getLastRow(){let n=this.rows.length;while(n>0&&!(this.rows[n-1]||[]).some(v=>v!==''&&v!=null))n--;return n}getMaxRows(){return this.maxRows}insertRowsAfter(_,n){this.maxRows+=n}
  getRange(r,c,n=1,m=1){const s=this,grid=(src,def)=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>((src[r+i-1]||[])[c+j-1])??def));let px;
    const put=(dst,v)=>{v.forEach((row,i)=>{while(dst.length<r+i)dst.push([]);row.forEach((x,j)=>{dst[r+i-1][c+j-1]=x;});});};
    const api={getValues:()=>grid(s.rows,''),getNotes:()=>grid(s.notes,''),getFormulas:()=>grid(s.formulas,''),
      setValues:v=>{s.escritas++;put(s.rows,v);return px},setNote:t=>{put(s.notes,[[t]]);return px},setNotes:v=>{put(s.notes,v);return px},
      copyFormatToRange:()=>px};px=new Proxy(api,{get:(t,k)=>k in t?t[k]:()=>px});return px;}}
class Book{constructor(id,sheets){this.id=id;this.sheets=sheets}getId(){return this.id}getSheets(){return this.sheets}getSheetByName(n){return this.sheets.find(s=>s.name===n)||null}}
const D=(s)=>new Date(s+'T12:00:00-03:00');
const cab=['Data','Nome','Endereço','Canal','Tipo de Manifestação','Frente de obra','Histórico','Providência','Status','Obs.:'];
const controle=new Sheet('Controle de manisfestações',[['CONTROLE DE MANIFESTAÇÕES'],[],cab,
  [D('2026-08-03'),'Morador A','Rua A, 1','Telefone','Reclamação','Coletor A','Pedido antigo','Feito à mão','Concluído','Obs manual'],
  [D('2026-09-02'),'Morador B','Rua B, 2','Presencial','Solicitação','Coletor B','Pedido B','','Em andamento',''],
  [D('2026-09-05'),'Morador C','Rua C, 3','WhatsApp','Reclamação','Coletor C','Pedido C','Providência manual C','Em andamento','Obs C'],
  [D('2026-09-06'),'Morador F','Rua F, 6','Telefone','Outros','Coletor F','Pedido F','','Em andamento','']]);
controle.notes[4]=['nota da equipe\nCPT_ATD_ID=ATD-B'];controle.formulas[6]=['','','','','','','','=A1','',''];controle.formulas[4]=['','','','','=TIPO_B()','','','','',''];
const matriz=new Sheet('Matriz de Contatos',[['Nome','Instituição'],['Liderança X','Associação']]),indicadores=new Sheet('Indicadores 2026',[['Indicador','set/26'],['Ações',12]]);
const anexos=new Book('1Et4M0nr4CxlRj7J6EDoru91aC4PJ-G2Y',[matriz,controle,indicadores]),books=new Map([[anexos.id,anexos],['agenda',new Book('agenda',[])]]);
const instant=JSON.stringify([matriz.rows,indicadores.rows]);
const ctx={Date,console:{log(){},warn(){},error(){}},JSON,Session:{getActiveUser:()=>({getEmail:()=>email})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>Object.fromEntries(props),getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
  SpreadsheetApp:{openById:id=>{if(!books.has(id))throw Error('Não existe');return books.get(id)},flush(){}},
  CacheService:{getScriptCache:()=>({get:()=>null,put(){},remove(){}})},
  Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:(d,_,f)=>{const s=new Date(d.getTime()-3*3600e3).toISOString();return f==='yyyy-MM'?s.slice(0,7):s.slice(0,10)}},
  LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},releaseLock:()=>locked=false})}};
vm.createContext(ctx);
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','PerfisCPT','ColecaoCPT','SocioambientalCPT','AplicacaoCPT','ConectoresCPT','EntregasDoMesCPT','AnexosRelatorioCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
// Casos do mês: vêm da base (FichaOficialCPT); aqui, prontos nas 10 colunas oficiais.
const caso=(id,data,nome,end,canal,tipo,frente,hist,prov,status,obs)=>({id,valores:[D(data),nome,end,canal,tipo,frente,hist,prov,status,obs]});
ctx.casosTeste=[caso('ATD-B','2026-09-02','Morador B','Rua B, 2','Presencial','Solicitação','Coletor B','Pedido B','Reparo feito','Concluído','Encerrado com o morador'),
  caso('ATD-C','2026-09-05','Morador C','Rua C, 3','WhatsApp','Reclamação','Coletor C','Pedido C','','Em andamento',''),
  caso('ATD-D','2026-09-20','Moradora D','Rua D, 4','Telefone','Danos à calçada','Coletor A','Calçada quebrada','','Em andamento',''),
  caso('ATD-E','2026-09-25','Morador E','Rua E, 5','Presencial','Transtornos causados pela obra','Coletor B','=poeira na rua','','Em andamento','')];
vm.runInContext('AnexosRelatorioCPT.prototype.casos=function(){return casosTeste;};AplicacaoCPT.executar=function(acao){const c=AplicacaoCPT.identidade();c.base=null;return acao(null,c);};',ctx);
const run=s=>vm.runInContext(s,ctx);
// 1. Regras puras: categoria oficial e texto público.
assert.equal(run("AnexosRelatorioCPT.tipo({tipo:'Reclamação',assunto:'Rachadura no muro'})"),'Danos à edificação');
assert.equal(run("AnexosRelatorioCPT.tipo({assunto:'Buraco na calçada'})"),'Danos à calçada');assert.equal(run("AnexosRelatorioCPT.tipo({tipo:'Elogio'})"),'Elogio');
assert.equal(run("AnexosRelatorioCPT.tipo({assunto:'xyz'})"),'Outros');assert.ok(run('AnexosRelatorioCPT.tipos').includes(run("AnexosRelatorioCPT.tipo({tipo:'Solicitação de vistoria'})")));
assert.equal(run("AnexosRelatorioCPT.publico('NI\\nResultado: reparo feito\\nNão informado')"),'reparo feito');
// 2. Quem pode: atendimento não vê; socioambiental confere mas não grava; gestão nos testes também não grava.
email='atd@example.com';assert.throws(()=>run("estadoAnexosCPT('2026-09')"),/Socioambiental, Comunicação, Gestão e Administrativo/);
email='social@example.com';let c=JSON.parse(JSON.stringify(run("conferirAnexosCPT('2026-09')")));
assert.deepEqual(c.novos,['ATD-D','ATD-E']);assert.deepEqual(c.atualizados,['ATD-B'],'C só ganha o protocolo na nota (conteúdo igual)');assert.equal(c.casosDoMes,4);assert.equal(c.linhasNaPlanilha,4);
assert.deepEqual(c.abas,{controle:true,matriz:true,indicadores:true});assert.equal(c.podeGravar,false);assert.equal(controle.escritas,0,'conferir não grava nada');
assert.throws(()=>run("atualizarAnexosCPT({mes:'2026-09'})"),/Gestão e do Administrativo/);
email='gestao@example.com';assert.throws(()=>run("atualizarAnexosCPT({mes:'2026-09'})"),/reservado à administração técnica/);assert.equal(controle.escritas,0);
// 3. Proprietário grava: atualiza no lugar, acrescenta no fim, preserva o manual e a fórmula, guarda o protocolo na nota.
email='victor@example.com';const antes=controle.rows.slice(3,7).map(r=>r.slice());let r=JSON.parse(JSON.stringify(run("atualizarAnexosCPT({mes:'2026-09'})")));
assert.equal(r.incluidos,2);assert.equal(r.atualizados,1);assert.match(r.resultado,/Nada foi apagado/);
const L=controle.rows;assert.deepEqual(L[3],antes[0],'linha de agosto (sem caso no mês) intacta');assert.deepEqual(L[6],antes[3],'linha manual sem caso intacta');
assert.equal(L[4][8],'Concluído');assert.equal(L[4][4],'=TIPO_B()','fórmula da linha atualizada fica como estava');assert.equal(L[4][7],'Reparo feito');assert.match(controle.notes[4][0],/^nota da equipe\nCPT_ATD_ID=ATD-B$/,'nota da equipe preservada');
assert.equal(L[5][7],'Providência manual C','providência manual não vira vazio');assert.equal(L[5][9],'Obs C');assert.match(controle.notes[5][0],/CPT_ATD_ID=ATD-C/,'linha reconhecida pelo conteúdo ganha o protocolo');
assert.equal(L[7][1],'Moradora D');assert.equal(L[8][1],'Morador E');assert.equal(L[8][6],"'=poeira na rua",'texto que começa com = não vira fórmula');assert.match(controle.notes[8][0],/CPT_ATD_ID=ATD-E/);
assert.equal(L.length,9,'nada foi apagado');assert.equal(JSON.stringify([matriz.rows,indicadores.rows]),instant,'Matriz e Indicadores 2026 intactos');
assert.equal(JSON.parse(props.get('CPT_ANEXOS_SYNC:2026-09')).incluidos,2);
// 4. Repetir não duplica (reconhece pelas notas); caso concluído na planilha e aberto na base para tudo.
controle.escritas=0;r=JSON.parse(JSON.stringify(run("atualizarAnexosCPT({mes:'2026-09'})")));assert.equal(r.incluidos,0);assert.equal(r.atualizados,0);assert.equal(controle.rows.length,9);
ctx.casosTeste[0].valores[8]='Em andamento';assert.throws(()=>run("atualizarAnexosCPT({mes:'2026-09'})"),/nenhum caso foi reaberto/);ctx.casosTeste[0].valores[8]='Concluído';
// 5. Duplicidade na planilha: duas linhas com o mesmo protocolo param tudo (nada é gravado).
controle.notes[7]=['CPT_ATD_ID=ATD-B'];const n0=controle.escritas;assert.throws(()=>run("atualizarAnexosCPT({mes:'2026-09'})"),/aparece em duas linhas/);assert.equal(controle.escritas,n0);
assert.equal(locked,false,'trava liberada mesmo com erro');
// 6. Links de download da planilha oficial inteira.
const lk=JSON.parse(JSON.stringify(run("estadoAnexosCPT('2026-09')"))).links;assert.match(lk.xlsx,/1Et4M0nr4CxlRj7J6EDoru91aC4PJ-G2Y\/export\?format=xlsx$/);assert.match(lk.pdf,/format=pdf/);
console.log('PASS: anexos — Controle de manifestações acumulativo (atualiza no lugar, acrescenta no fim, protocolo na nota, manual e fórmula preservados, sem duplicar, sem reabrir concluído); conferir não grava; só o proprietário grava nos testes; Matriz e Indicadores 2026 intactos; Excel e PDF.');
