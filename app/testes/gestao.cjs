// Painel da gestão, Auditoria de atendimentos, Conectores e trava de configuração, com serviços Google simulados.
// node app/testes/gestao.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
let email='victor@example.com',locked=false,falharGravacao=0;
const props=new Map([['CPT_APLICACAO_1',JSON.stringify({baseId:'base',administrador:email,agendaId:'agenda',versao:'2.7.0'})],
  ['CPT_PESSOA:social@example.com',JSON.stringify({email:'social@example.com',nome:'Social',papeis:['socioambiental'],ativo:true,versao:1})],
  ['CPT_PESSOA:gestao@example.com',JSON.stringify({email:'gestao@example.com',nome:'Gestão',papeis:['gestao'],ativo:true,versao:1})],
  ['CPT_PESSOA:atd@example.com',JSON.stringify({email:'atd@example.com',nome:'Atd',papeis:['atendimento'],ativo:true,versao:1})]]);
const chain=()=>new Proxy(function(){},{get:(t,k)=>k==='then'?undefined:chain(),apply:()=>chain()});
class Sheet{constructor(n,rows=[],id=0){this.name=n;this.rows=rows;this.id=id;this.cols=30;this.formulas=new Map();this.merges=[];this.widths={};}
  getName(){return this.name}setName(n){this.name=n;return this}getSheetId(){return this.id}getLastRow(){return this.rows.length}getMaxColumns(){return this.cols}insertColumnsAfter(_,n){this.cols+=n}setFrozenRows(){}
  getLastColumn(){return Math.max(0,...this.rows.map(r=>{for(let i=r.length-1;i>=0;i--)if(r[i]!==''&&r[i]!=null)return i+1;return 0;}))}
  setColumnWidth(c,w){this.widths[c]=w}getColumnWidth(c){return this.widths[c]||100}
  getRange(r,c,n=1,m=1){const s=this;const vals=()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.rows[r+i-1]?.[c+j-1]??''));let px;
    const put=(i,j,x)=>{while(s.rows.length<r+i)s.rows.push([]);s.rows[r+i-1][c+j-1]=x;};
    const api={getValues:vals,getValue:()=>vals()[0][0],getDisplayValues:()=>vals().map(l=>l.map(String)),
      setValues:v=>{v.forEach((row,i)=>row.forEach((x,j)=>put(i,j,x)));return px},
      setValue:x=>{if(falharGravacao&&--falharGravacao===0)throw Error('Falha simulada');put(0,0,x);return px},
      getFormulas:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.formulas.get((r+i)+','+(c+j))||'')),
      getMergedRanges:()=>s.merges.filter(g=>g.r===r&&c>=g.c&&c<g.c+g.w).map(g=>({getNumColumns:()=>g.w})),
      copyTo:d=>{s.copias=(s.copias||0)+1;return px},clearContent:()=>px};
    px=new Proxy(api,{get:(t,k)=>k in t?t[k]:()=>px});return px;}}
class Book{constructor(id,sheets,name){this.id=id;this.sheets=sheets;this.name=name||id}getId(){return this.id}getName(){return this.name}getUrl(){return 'https://docs.google.com/spreadsheets/d/'+this.id}getSheets(){return this.sheets}getSheetByName(n){return this.sheets.find(s=>s.name===n)||null}insertSheet(n){const a=new Sheet(n);this.sheets.push(a);return a}getSpreadsheetTimeZone(){return 'America/Sao_Paulo'}}
const D=s=>new Date(s+'T12:00:00Z');
const colReg=['ID','Procedimento','Data do procedimento','Mês','Carimbo do envio','Origem','ID legado','Bairro','Bairro ID','Obra de referência','Obra ID','Responsável','Área','Atividade','Público informado','Protocolo informado','Situação do vínculo','Pesquisa','Conferência dos campos','Hash','Detalhes JSON'];
const reg=(i,proc,data,obraId,obra,ativ,pub,campos=[])=>['REG-'+String(i).padStart(24,'a'),proc,D(data),data.slice(0,7),'','4.0','','Vila Linda','BAI-001',obra,obraId,'Ana','Social',ativ,pub,'','','','','',JSON.stringify({campos})];
const pesq=(i,data,nota,coment)=>reg(i,'Pesquisa de Satisfação',data,'','','', '',[{titulo:'De 0 a 10, quanto está satisfeito com os serviços de saneamento de forma geral?',valor:nota},{titulo:'Se sim: De 0 a 10, quanto percebeu melhorias na qualidade de vida relacionadas ao saneamento?',valor:'8'},{titulo:'De forma geral, quais aspectos observa sobre os serviços de saneamento?',valor:coment}]);
const registros=new Sheet('Registros',[colReg,
  reg(1,'Relato de atividade','2026-09-05','OBR-0001','Coletor A [OBR-0001]','Ação Social Externa',15,[{titulo:'Relato da atividade',valor:'Conversa com moradores sobre a obra e o descarte correto. https://drive.google.com/file/d/FOTO00000000000000000000001/view'}]),
  reg(2,'Relato de atividade','2026-09-06','OBR-0001','Coletor A [OBR-0001]','DDS',20),
  reg(3,'Diagnóstico de Área','2026-09-07','OBR-0001','Coletor A [OBR-0001]','Diagnóstico',''),
  pesq(4,'2026-09-08','9','A obra melhorou o cheiro da rua e trouxe esperança'),pesq(5,'2026-09-09','8','Poeira atrapalha um pouco o comércio local da rua'),
  reg(6,'Acompanhamento de Vistoria Cautelar','2026-09-10','','','Vistoria',''),
  reg(7,'Relato de atividade','2026-08-20','OBR-0001','Coletor A [OBR-0001]','Ação Social Externa',10)]);
const colAtd=['Protocolo','Protocolo principal','Situação do protocolo','Status','Data de abertura','Data de conclusão','Nome','Assunto','Endereço','Frente de obra','Área responsável','Responsável','Próxima ação','Atualização operacional','Documento','PDF','Origem','Pesquisa','Hash','Detalhes JSON'];
const caso=(p,status,ab,conc,nome,assunto,end,frente,area,prox,pdf,tipo)=>[p,p,'',status,ab?D(ab):'',conc?D(conc):'',nome,assunto,end,frente,area,'',prox,'','',pdf,'CAC','','',JSON.stringify({tipo})];
const atd=new Sheet('Atendimentos',[colAtd,
  caso('P1','Concluído','2026-09-02','2026-09-04','Fulana','Elogio à equipe','Rua das Flores, 10','Coletor A','Atendimento','', 'https://drive.google.com/file/d/x/view','Elogio'),
  caso('P2','Concluído','2026-08-20','2026-09-10','Ciclano','Calçada quebrada','Rua B, 20','Coletor A','Execução','','https://drive.google.com/file/d/y/view','Reclamação'),
  caso('P3','Recebida','2026-01-02','','Beltrana','Vazamento','Rua das Flores 10','Coletor A','', '', '','Reclamação'),
  caso('P4','Em andamento','2026-09-20','','','Dúvida','Rua das Flores, nº 10','Coletor A','Atendimento','Ligar','','')]);
const obras=new Sheet('Obras',[['ID da obra','Nome da obra / frente','Bairros','No formulário?'],
  ['OBR-0001','Coletor A','Vila Linda',true,'','','','','','','','','','','','','','','','Em andamento',D('2026-08-01'),'','C','Alto','',''],
  ['OBR-0002','Coletor B','Jardim',true,'','','','','','','','','','','','','','','','Em andamento',D('2026-08-01'),'','C','Médio','','']]);
const base=new Book('base',[registros,atd,obras,new Sheet('Bairros',[['ID','Nome']])]);
const agenda=new Book('agenda',[new Sheet('Eventos',[['ID','Versão','Operação ID','Alterado em','Alterado por','Conteúdo JSON']])]);
const books=new Map([['base',base],['agenda',agenda]]);
let criadas=0;const cacheMap=new Map();
const ctx={Date,console:{log(){},warn(){},error(){}},JSON,MimeType:{GOOGLE_SHEETS:'application/vnd.google-apps.spreadsheet',PDF:'pdf'},
  Session:{getActiveUser:()=>({getEmail:()=>email})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>Object.fromEntries(props),getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
  SpreadsheetApp:{openById:id=>{if(!books.has(id))throw Error('Não existe');return books.get(id)},create:n=>{criadas++;const b=new Book('ss'+criadas,[new Sheet('Planilha1')],n);books.set(b.id,b);return b},flush(){}},
  DriveApp:{getFileById:id=>{if(String(id).startsWith('sem-acesso'))throw Error('negado');return {getName:()=>'Arquivo '+id,getMimeType:()=>'application/vnd.google-apps.spreadsheet',getLastUpdated:()=>new Date('2026-10-02T13:40:00Z'),getSharingAccess:()=>'PRIVATE',getSharingPermission:()=>'NONE',getViewers:()=>[],getEditors:()=>[],moveTo(){},
      getParents:()=>{let n=0;return {hasNext:()=>n===0,next:()=>{n++;return {getId:()=>'PASTA-FOTOS',getName:()=>'Fotos (File responses)',getSharingAccess:()=>'DOMAIN',getSharingPermission:()=>'VIEW',getParents:()=>({hasNext:()=>false})};}};}};},
    getFolderById:id=>({getId:()=>id,getName:()=>'Pasta '+id,getSharingAccess:()=>'PRIVATE',getSharingPermission:()=>'NONE',getViewers:()=>[],getEditors:()=>[],getFoldersByName:()=>({hasNext:()=>false}),createFolder:()=>({})}),
    createFolder:()=>({getId:()=>'pasta',getFoldersByName:()=>({hasNext:()=>false}),createFolder:()=>({})})},
  CacheService:{getScriptCache:()=>({get:k=>cacheMap.get(k)||null,put:(k,v)=>cacheMap.set(k,v),remove:k=>cacheMap.delete(k)})},
  Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:(d,_,f)=>{const s=new Date(d.getTime()-3*3600e3).toISOString();return f==='yyyy-MM'?s.slice(0,7):f==='yyyy-MM-dd'?s.slice(0,10):s.slice(0,16)}},
  LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},releaseLock:()=>locked=false})}};
vm.createContext(ctx);
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','SocioambientalCPT','PerfisCPT','CronogramaCPT','ObrasCPT','ColecaoCPT','ObrasDoDiaCPT','CicloAtendimentoCPT','AplicacaoCPT','ConectoresCPT','PaineisGestaoCPT','RelatosCPT','AuditoriaAtendimentosCPT','ControleContratoCPT','OrganogramaCPT','AlertasGestaoCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx)));



// 4. Painel da gestão: contrato, frentes e relatos em resumo.
email='atd@example.com';assert.throws(()=>run("carregarPainelGestaoCPT({mes:'2026-09'})"),/Administrativo e da Gestão/);
email='gestao@example.com';const p=run("carregarPainelGestaoCPT({mes:'2026-09'})");
assert.equal(p.contrato.acoes,2);assert.equal(p.contrato.pessoas,35);assert.equal(p.contrato.diagnosticos,1);assert.equal(p.contrato.pesquisas.mes,2);
assert.equal(p.contrato.casos.abertos,2);assert.equal(p.contrato.casos.concluidosMes,2);assert.equal(p.serie.length,6);assert.equal(p.serie[4].acoes,1,'agosto');
// 2.45: comentários nos gráficos — Gestão/Administrativo escrevem (geral ou do mês); todos leem; vazio apaga.
{vm.runInContext(fs.readFileSync(__dirname+'/../src/NotasGraficosCPT.gs','utf8'),ctx);const op=()=>'OP-'+crypto.randomUUID();
 email='atd@example.com';assert.equal(run('listarNotasGraficosCPT()').podeEditar,false);ctx.n={grafico:'acoes-socioambientais',mes:'',texto:'x',operacaoId:op()};assert.throws(()=>run('salvarNotaGraficoCPT(n)'),/Gestão e do Administrativo/);
 email='gestao@example.com';ctx.n={grafico:'acoes-socioambientais',mes:'',texto:'O que o gráfico mostra.',operacaoId:op()};run('salvarNotaGraficoCPT(n)');
 ctx.n={grafico:'acoes-socioambientais',mes:'2026-07',texto:'Julho: obra paralisada.',operacaoId:op()};run('salvarNotaGraficoCPT(n)');
 ctx.n={grafico:'acoes-socioambientais',mes:'2026-07',texto:'Julho: obra paralisada por chuva.',operacaoId:op()};run('salvarNotaGraficoCPT(n)');
 ctx.n={grafico:'../x',mes:'',texto:'y',operacaoId:op()};assert.throws(()=>run('salvarNotaGraficoCPT(n)'),/Gráfico inválido/);
 email='atd@example.com';let ns=run('listarNotasGraficosCPT()').notas;assert.equal(ns.length,2);assert.equal(ns.find(x=>x.mes==='2026-07').texto,'Julho: obra paralisada por chuva.');
 email='gestao@example.com';ctx.n={grafico:'acoes-socioambientais',mes:'2026-07',texto:'',operacaoId:op()};assert.match(run('salvarNotaGraficoCPT(n)').resultado,/apagado/);assert.equal(run('listarNotasGraficosCPT()').notas.length,1);
 ctx.n={grafico:'outro',mes:'',texto:'',operacaoId:op()};assert.throws(()=>run('salvarNotaGraficoCPT(n)'),/Escreva o comentário/);}
// 2.44: com o histórico dos Anexos, os meses antes da aplicação usam os números já entregues (pesquisas continuam da base); destaques do período.
{vm.runInContext(fs.readFileSync(__dirname+'/../src/AnexosCPT.gs','utf8'),ctx);
 props.set('CPT_ANEXOS_HISTORICO',JSON.stringify({lido:'2026-10-07T10:00:00Z',meses:{'2026-05':{acoes:54,pessoas:82,abertas:4,concluidas:2,impressos:70,tenda:2,elogios:1,parceiros:79},'2026-06':{acoes:55,pessoas:163,abertas:6,concluidas:0,impressos:200,parceiros:77},'2026-07':{acoes:0,pessoas:0,impressos:220}}}));
 const h=run("carregarPainelGestaoCPT({mes:'2026-09',atualizar:true})"),sm=m=>h.serie.find(x=>x.mes===m);
 assert.deepEqual(h.serie.map(x=>x.mes),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
 assert.deepEqual([sm('2026-05').acoes,sm('2026-05').pessoas,sm('2026-05').recebidos,sm('2026-05').fonte],[54,82,4,'anexos']);assert.equal(sm('2026-07').acoes,0);assert.equal(sm('2026-08').fonte,'aplicacao');assert.equal(sm('2026-08').acoes,1);
 assert.equal(sm('2026-05').pesquisas,p.serie.find(x=>x.mes==='2026-05').pesquisas,'pesquisas não vêm dos Anexos');
 const d=h.destaques;assert.equal(d.acoes,54+55+0+1+2);assert.equal(d.impressos,490);assert.deepEqual(d.parceiros,{valor:77,mes:'2026-06'});assert.deepEqual(d.mesesAnexos,['2026-05','2026-06','2026-07']);assert.equal(d.melhor.mes,'2026-06');
 assert.equal(d.variacao,100,'set (2) vs ago (1)');
 // Depois da ativação, o mês é da aplicação mesmo que o histórico tenha número.
 {const c=JSON.parse(props.get('CPT_APLICACAO_1'));c.anexosDesde='2026-06';props.set('CPT_APLICACAO_1',JSON.stringify(c));const h2=run("carregarPainelGestaoCPT({mes:'2026-09',atualizar:true})");
  assert.equal(h2.serie.find(x=>x.mes==='2026-06').fonte,'aplicacao');assert.equal(h2.serie.find(x=>x.mes==='2026-05').fonte,'anexos');delete c.anexosDesde;props.set('CPT_APLICACAO_1',JSON.stringify(c));}
 assert.equal(run("PaineisGestaoCPT.mesesContrato('2027-02').length"),10,'de maio/2026 a fevereiro/2027');assert.equal(run("PaineisGestaoCPT.mesesContrato('2027-09').length"),12);props.delete('CPT_ANEXOS_HISTORICO');}
const fa=p.frentes.find(f=>f.id==='OBR-0001'),fb=p.frentes.find(f=>f.id==='OBR-0002');
assert.equal(fa.acoes,2);assert.equal(fa.diagnosticos,1);assert.equal(fa.casosAbertos,2);assert.equal(fb.acoes,0);assert.equal(fb.ultimo,'');
assert.ok(p.alertas.some(a=>/sem registro/.test(a.texto)&&/Coletor B/.test(a.texto)),'frente parada aparece nos alertas');
assert.ok(p.alertas.some(a=>/mais de 30 dias/.test(a.texto)));
const rr=run("carregarRelatosResumoCPT('2026-09')");assert.equal(rr.itens.length,3);assert.match(rr.itens.find(x=>x.atividade==='Ação Social Externa').resumo,/Conversa com moradores/);assert.equal(rr.itens.find(x=>x.atividade==='Ação Social Externa').fotos,1);
console.log('PASS: painel da gestão — números do contrato iguais à regra do relatório, série de 6 meses, frentes com ações, diagnósticos e casos, alertas (frente parada, casos antigos) e relatos em resumo com trecho e fotos.');
// 2.26: planilha de controle do contrato — lembrete mensal; a aplicação só lê os dados do arquivo no Drive e nunca abre a planilha.
const abertas=[];const abrir0=ctx.SpreadsheetApp.openById;ctx.SpreadsheetApp.openById=id=>{abertas.push(id);return abrir0(id);};
email='atd@example.com';assert.throws(()=>run("controleContratoCPT({mes:'2026-09'})"),/Gestão e do Administrativo/);
email='gestao@example.com';let ct=run("controleContratoCPT({mes:'2026-09'})");
assert.equal(ct.mes,'2026-09');assert.equal(ct.prazo,'2026-10-10');assert.match(ct.url,/1pQJ5B8wRzsdlU8udlh9ZzcWXozT3BOh4\/edit#gid=733716505$/);assert.equal(ct.respondida,null);assert.equal(ct.ultimaAlteracao,'2026-10-02T13:40:00.000Z');
assert.equal(ct.indicadores.find(x=>x.nome==='Ações socioambientais').valor,2,'mesmos números do painel');assert.equal(ct.indicadores.find(x=>x.nome==='Atendimentos concluídos').valor,2);assert.equal(ct.podeMarcar,false,'nos testes, só o proprietário marca');
ctx.m={mes:'2026-09',respondida:true,versao:0,operacaoId:'OP-controle-0001'};assert.throws(()=>run('marcarControleContratoCPT(m)'),/reservado à administração técnica/);
const hojeC=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date()),antC=(()=>{const d=new Date(hojeC.slice(0,7)+'-15T12:00:00Z');d.setUTCMonth(d.getUTCMonth()-1);return d.toISOString().slice(0,7);})();
email='victor@example.com';let ms=run('new ControleContratoCPT(AplicacaoCPT.contexto()).missoes()').filter(x=>x.id.startsWith('controle-contrato:'));assert.equal(ms.length,1);assert.equal(ms[0].id,'controle-contrato:'+antC);assert.equal(ms[0].rota,'painel');assert.equal(ms[0].aba,'entregas','2.49: leva a Entregas do mês');
ctx.m={mes:antC,respondida:true,versao:0,operacaoId:'OP-controle-0002'};let mk=run('marcarControleContratoCPT(m)');assert.ok(mk.respondida.nome,'quem respondeu');
assert.equal(run('new ControleContratoCPT(AplicacaoCPT.contexto()).missoes()').filter(x=>x.id.startsWith('controle-contrato:')).length,0,'respondida: o lembrete some');
ctx.m={mes:antC,respondida:false,versao:mk.versao,operacaoId:'OP-controle-0003'};assert.equal(run('marcarControleContratoCPT(m)').respondida,null);
assert.equal(run('new ControleContratoCPT(AplicacaoCPT.contexto()).missoes()').filter(x=>x.id.startsWith('controle-contrato:')).length,1,'desfeita: o lembrete volta');
assert.ok(!abertas.includes('1pQJ5B8wRzsdlU8udlh9ZzcWXozT3BOh4'),'a planilha de controle nunca é aberta pela aplicação');ctx.SpreadsheetApp.openById=abrir0;
console.log('PASS: planilha de controle — lembrete mensal com link na aba, prazo e números do mês; marcar respondida só pelo proprietário nos testes; missão some e volta; a planilha nunca é aberta.');
// 2.26: organograma — todos veem; Gestão/Administrativo editam (só o proprietário nos testes); sem ciclos; trazer da equipe sem repetir.
email='atd@example.com';assert.throws(()=>run('carregarOrganogramaCPT()'),/reservado à administração técnica/,'nos testes, a página é só do proprietário');
props.set('CPT_TRAVA_CONFIG','liberada');let og=run('carregarOrganogramaCPT()');assert.deepEqual(og.pessoas,[]);assert.equal(og.podeEditar,false);assert.equal(books.get('agenda').getSheetByName('Organograma'),null,'ler não cria a aba');props.delete('CPT_TRAVA_CONFIG');
ctx.o={nome:'X',cargo:'Y',area:'gestao',operacaoId:'OP-org-00000001'};assert.throws(()=>run('salvarOrganogramaCPT(o)'),/Gestão e pelo Administrativo/);
email='gestao@example.com';assert.throws(()=>run('salvarOrganogramaCPT(o)'),/reservado à administração técnica/);
email='victor@example.com';ctx.o={operacaoId:'OP-org-00000002'};og=run('importarOrganogramaCPT(o)');assert.match(og.resultado,/pessoas entraram/);const nEquipe=og.pessoas.length;assert.ok(nEquipe>=4);
assert.equal(og.foraDoOrganograma,0);ctx.o={operacaoId:'OP-org-00000003'};assert.match(run('importarOrganogramaCPT(o)').resultado,/Toda a equipe já está/);
const gest=og.pessoas.find(x=>x.nome==='Gestão'),soc=og.pessoas.find(x=>x.nome==='Social');assert.equal(soc.area,'socioambiental');assert.equal(soc.cargo,'Socioambiental');
ctx.o={id:soc.id,versao:soc.versao,nome:soc.nome,cargo:'Mobilizadora',area:'campo',chefia:gest.id,desde:'jul/2025',operacaoId:'OP-org-00000004'};let so=run('salvarOrganogramaCPT(o)').pessoa;assert.equal(so.chefia,gest.id);
ctx.o={id:gest.id,versao:gest.versao,nome:gest.nome,cargo:'Gerente',area:'gestao',chefia:soc.id,operacaoId:'OP-org-00000005'};assert.throws(()=>run('salvarOrganogramaCPT(o)'),/ciclo/);
ctx.o={id:gest.id,versao:gest.versao,nome:gest.nome,cargo:'Gerente',area:'gestao',chefia:gest.id,operacaoId:'OP-org-00000006'};assert.throws(()=>run('salvarOrganogramaCPT(o)'),/ela mesma/);
ctx.o={id:gest.id,versao:gest.versao,nome:gest.nome,cargo:'',area:'gestao',operacaoId:'OP-org-00000007'};assert.throws(()=>run('salvarOrganogramaCPT(o)'),/cargo/);
ctx.o={id:gest.id,versao:gest.versao,nome:gest.nome,cargo:'Gerente',area:'gestao',ativo:false,operacaoId:'OP-org-00000008'};assert.throws(()=>run('salvarOrganogramaCPT(o)'),/mude quem responde/);
ctx.o={id:soc.id,versao:so.versao,nome:soc.nome,cargo:'Mobilizadora',area:'campo',chefia:gest.id,ativo:false,operacaoId:'OP-org-00000009'};run('salvarOrganogramaCPT(o)');
props.set('CPT_TRAVA_CONFIG','liberada');email='atd@example.com';og=run('carregarOrganogramaCPT()');props.delete('CPT_TRAVA_CONFIG');assert.equal(og.pessoas.length,nEquipe-1,'quem saiu não aparece (fica no histórico)');assert.ok(!og.pessoas.some(x=>'email' in x),'e-mail não vai para a tela');
console.log('PASS: organograma — só o proprietário nos testes, depois todos veem; só Gestão/Administrativo editam (proprietário nos testes); trazer da equipe sem repetir; sem ciclo nem chefia de si mesmo; tirar pede mudar quem responde; e-mail não vai à tela.');

// 5. Auditoria de atendimentos.
email='social@example.com';assert.throws(()=>run('auditarAtendimentosCPT()'),/Atendimento, da Comunicação, do Administrativo e da Gestão/);
email='atd@example.com';const a=run('auditarAtendimentosCPT()'),v=id=>a.verificacoes.find(x=>x.id===id);
assert.deepEqual(v('recebidaParada').itens.map(x=>x.protocolo),['P3']);assert.deepEqual(v('prazo').itens.map(x=>x.protocolo),['P3']);
assert.deepEqual(v('semProximaAcao').itens.map(x=>x.protocolo),['P3']);assert.deepEqual(v('semArea').itens.map(x=>x.protocolo),['P3']);
assert.deepEqual(v('incompleto').itens.map(x=>x.protocolo),['P4']);assert.match(v('incompleto').itens[0].detalhe,/nome.*tipo/);
assert.deepEqual(v('duplicado').itens.map(x=>x.protocolo).sort(),['P3','P4'],'mesmo endereço escrito de jeitos diferentes');
assert.deepEqual(v('semFicha').itens.map(x=>x.protocolo).sort(),['P3','P4']);assert.equal(a.pendencias,2);
assert.equal(a.numeros.abertos,2);assert.equal(a.numeros.porMes.length,6);
console.log('PASS: auditoria — recebidos parados, acima de 30 dias, sem próxima ação/área, dados faltando, duplicados por endereço, sem ficha; números por mês; só para quem conduz casos.');

// 6. Conectores e trava.
email='gestao@example.com';assert.throws(()=>run('conferirConectoresCPT()'),/administração técnica/);assert.throws(()=>run("configurarConectorCPT({chave:'rdas',id:'https://docs.google.com/spreadsheets/d/NOVOIDNOVOIDNOVOIDNOVOID123/edit'})"),/administração técnica/);
email='victor@example.com';const c=run('conferirConectoresCPT()');assert.equal(c.travada,true);assert.equal(c.conectores.length,6);assert.ok(c.conectores.every(x=>x.ok));
assert.ok(c.pastas.some(x=>x.nome==='Fotos (File responses)'&&x.equipeVe===true),'pasta das fotos encontrada pelos registros');
run("configurarConectorCPT({chave:'rdas',id:'https://docs.google.com/spreadsheets/d/NOVOIDNOVOIDNOVOIDNOVOID123/edit#gid=0'})");assert.equal(JSON.parse(props.get('CPT_CONECTORES')).rdas.id,'NOVOIDNOVOIDNOVOIDNOVOID123');
assert.throws(()=>run("configurarConectorCPT({chave:'rdas',id:'sem-acesso-sem-acesso-123'})"),/não abre/);
run('liberarConfiguracaoCPT()');email='gestao@example.com';assert.equal(run('listarObrasCPT()').gerencia,true,'liberada: gerência edita obras');run('travarConfiguracaoCPT()');assert.equal(run('listarObrasCPT()').gerencia,false,'travada: só o proprietário');
ctx.pessoa={email:'nova@example.com',nome:'Nova',papeis:['atendimento'],ativo:true,versao:0};assert.throws(()=>run('PerfisCPT.salvar(AplicacaoCPT.identidade(),pessoa)'),/exclusiva da administração técnica/);
console.log('PASS: conectores só para a administração técnica (conferência, pasta das fotos, troca por link validada); trava de testes liga/desliga a edição da gerência; cargos só pelo proprietário.');
// 2.13: registros vêm 50 por vez (linhas ocupam menos espaço), com cursor para "Mostrar mais".
for(let i=0;i<60;i++)registros.rows.push(reg(900+i,'Relato de atividade','2026-10-'+String(1+i%28).padStart(2,'0'),'OBR-0001','Coletor A [OBR-0001]','Plantão '+i,3));
{const p1=JSON.parse(JSON.stringify(vm.runInContext("buscarRegistrosCPT({mes:'2026-10'})",ctx)));assert.equal(p1.itens.length,50,'primeira página com 50');assert.ok(p1.proximoCursor);
 ctx.cur=p1.proximoCursor;const p2=JSON.parse(JSON.stringify(vm.runInContext("buscarRegistrosCPT({mes:'2026-10',cursor:cur})",ctx)));assert.equal(p2.itens.length,10,'segunda página com o resto');assert.equal(p2.proximoCursor,null);
 assert.equal(new Set(p1.itens.concat(p2.itens).map(x=>x.id)).size,60,'sem repetir nem pular');}
console.log('PASS: registros 50 por vez, sem repetir nem pular.');

// 2.34: ferramenta Relatos — cartões para todos; pontos de melhoria só para quem participou (responsável ou apoio) e a gerência; RDAS no clique.
{const r20=reg(20,'Relato de atividade','2026-09-12','OBR-0001','Coletor A [OBR-0001]','Roda de conversa',18,[{titulo:'Relato da atividade',valor:'Conversa curta.'},{titulo:'Colaboradores de apoio na atividade',valor:['Atd','Fulano de Tal']}]);r20[11]='Social';registros.rows.push(r20);
 const id20=r20[0],id2=registros.rows.find(r=>r[13]==='DDS')[0],idPesq=registros.rows.find(r=>r[1]==='Pesquisa de Satisfação')[0];
 email='social@example.com';let f=run("carregarRelatosCPT({mes:'2026-09'})");
 assert.equal(f.itens.length,3,'só relatos de atividade do mês');assert.equal(f.gerencia,false);
 const meu=f.itens.find(x=>x.id===id20),outro=f.itens.find(x=>x.id===id2);
 assert.equal(meu.meu,true);assert.ok(Array.isArray(meu.pontos)&&meu.pontos.length>0,'responsável vê os pontos');assert.ok(meu.pontos.every(x=>x.nome&&x.dica));assert.match(meu.apoio,/Atd/);
 assert.equal(outro.meu,false);assert.equal(outro.pontos,null,'quem não participou não vê os pontos');assert.equal(outro.devolutiva,null);assert.ok(outro.resumo!==undefined&&outro.responsavel==='Ana','o cartão em si é para todos');
 email='atd@example.com';f=run("carregarRelatosCPT({mes:'2026-09'})");assert.equal(f.itens.find(x=>x.id===id20).meu,true,'colaborador de apoio também vê');assert.equal(f.itens.find(x=>x.id===id2).pontos,null);
 email='gestao@example.com';f=run("carregarRelatosCPT({mes:'2026-09'})");assert.equal(f.gerencia,true);assert.ok(f.itens.every(x=>Array.isArray(x.pontos)),'gestão vê os pontos de todos');
 // 2.49: o comentário privado da gestão fica no cartão (mesma regra: gerência e configuração liberada).
 props.set('CPT_TRAVA_CONFIG','liberada');assert.equal(run("carregarRelatosCPT({mes:'2026-09'})").podeDevolver,true);props.set('CPT_TRAVA_CONFIG','travada');assert.equal(run("carregarRelatosCPT({mes:'2026-09'})").podeDevolver,false);
 props.set('CPT_TRAVA_CONFIG','liberada');email='social@example.com';assert.equal(run("carregarRelatosCPT({mes:'2026-09'})").podeDevolver,false,'equipe não comenta');props.delete('CPT_TRAVA_CONFIG');email='gestao@example.com';
 assert.throws(()=>run("carregarRelatosCPT({mes:'2026-13'})"),/mês válido/);
 // Abrir no RDAS: procura "| R4-xxxxxx |" na aba do dia, só no clique.
 const codigo='R4-'+id20.replace(/^REG-/,'').slice(0,6).toUpperCase();let procurou=0;
 const abaDia={getName:()=>'RDAS 12-09-2026',getSheetId:()=>7,createTextFinder:t=>{procurou++;return {matchCase:()=>({findNext:()=>t===' | '+codigo+' | '?{getRow:()=>40}:null})};}};
 books.set('rdas-teste',{getId:()=>'rdas-teste',getSheetByName:n=>n==='RDAS 12-09-2026'?abaDia:null});props.set('CPT_CONECTORES',JSON.stringify({rdas:{id:'rdas-teste'}}));
 email='social@example.com';let r=run("abrirNoRdasCPT('"+id20+"')");assert.equal(r.achou,true);assert.equal(r.url,'https://docs.google.com/spreadsheets/d/rdas-teste/edit#gid=7&range=A40');assert.equal(procurou,1);
 r=run("abrirNoRdasCPT('"+id2+"')");assert.equal(r.achou,false);assert.match(r.texto,/06\/09 ainda não está no RDAS/);assert.equal(r.url,'https://docs.google.com/spreadsheets/d/rdas-teste/edit');
 assert.throws(()=>run("abrirNoRdasCPT('"+idPesq+"')"),/relatos de atividade/);assert.throws(()=>run("abrirNoRdasCPT('x')"),/inválido/);
 props.set('CPT_CONECTORES',JSON.stringify({rdas:{id:'sem-rdas'}}));r=run("abrirNoRdasCPT('"+id20+"')");assert.equal(r.achou,false);assert.match(r.texto,/procure a aba do dia 12\/09/);}
console.log('PASS: ferramenta Relatos — cartões dos relatos do mês para todos, pontos de melhoria só para responsável, colaboradores de apoio e gestão; Abrir no RDAS acha a linha da ficha na aba do dia e explica quando o dia ainda não está lá.');

// 2.35: qualidade dos relatos (sem nomes): % completos em 6 meses, pontos que mais faltam, completude por frente; sem ranking por pessoa.
{email='atd@example.com';assert.throws(()=>run("qualidadeRelatosCPT({mes:'2026-09'})"),/Administrativo e da Gestão/);
 email='gestao@example.com';const q=run("qualidadeRelatosCPT({mes:'2026-09'})");
 assert.equal(q.meses.length,6);assert.deepEqual(q.meses.map(m=>m.mes),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
 const set=run("carregarRelatosCPT({mes:'2026-09'})").itens;assert.equal(q.total,set.length,'mesmos relatos da ferramenta');assert.equal(q.completos,set.filter(x=>x.pontos&&!x.pontos.length).length);
 assert.equal(q.meses[5].total,q.total);assert.equal(q.meses[4].total,1,'agosto: 1 relato');
 assert.equal(q.faltas.length,6);assert.ok(q.faltas.every((f,i)=>!i||q.faltas[i-1].quantidade>=f.quantidade),'do que mais falta para o que menos falta');
 assert.equal(q.faltas.reduce((s,f)=>s+f.quantidade,0),set.reduce((s,x)=>s+x.pontos.length,0),'faltas batem com os pontos dos cartões');
 assert.equal(q.frentes.reduce((s,f)=>s+f.total,0),q.total);assert.ok(q.frentes.every(f=>f.completos<=f.total));
 assert.ok(!JSON.stringify(q).includes('Ana')&&!JSON.stringify(q).includes('Social'),'sem nomes de pessoas');
 assert.equal(run("carregarPainelGestaoCPT({mes:'2026-09'})").porPessoa,undefined,'painel sem contagem por pessoa');
 assert.throws(()=>run("qualidadeRelatosCPT({mes:'x'})"),/mês válido/);}
console.log('PASS: qualidade dos relatos — % completos nos 6 meses, pontos que mais faltam (ordenados) e completude por frente, iguais aos cartões; sem nomes e sem contagem por pessoa.');

// 2.36: alertas da gestão (mesmas regras no painel, nas missões e no cartão). Datas fixas: hoje = qua 14/10/2026 (12/10 é feriado).
{const R=(i,proc,data,obraId,ativ,pub)=>reg(5000+i,proc,data,obraId,obraId?'Obra '+obraId:'',ativ,pub);
 const acao=(i,data,pub=10,obra='OBR-0001')=>R(i,'Relato de atividade',data,obra,'Ação Social Externa',pub);
 const pesq=(i,data)=>R(i,'Pesquisa de Satisfação',data,'','','');
 ctx.linhasA=[acao(1,'2026-10-01'),acao(2,'2026-10-02'),acao(3,'2026-10-05'),acao(4,'2026-10-06',''),acao(5,'2026-10-07'),acao(6,'2026-10-08'),acao(7,'2026-10-13',8,'OBR-0001'),pesq(8,'2026-10-02')];
 ctx.fichasA=[{concluido:false,dias:31},{concluido:false,dias:30},{concluido:true,dias:90}];
 const calc=(hoje,mes,extra='')=>run("AlertasGestaoCPT.calcular({mes:'"+mes+"',hoje:'"+hoje+"',linhas:linhasA,fichas:fichasA,ontem:ontemA,nomes:new Map([['OBR-0001','Coletor A'],['OBR-0002','Coletor B']]),D:new DadosDaAplicacao(SpreadsheetApp.openById('base'))})");
 ctx.ontemA={obras:['OBR-0001','OBR-0002'],nenhuma:false};
 let a=calc('2026-10-14','2026-10');const por=id=>a.find(x=>x.id===id);
 assert.deepEqual(a.map(x=>x.id),['casos-30','dias-sem-acao','ritmo-pesquisas','obras-ontem','sem-publico'],'ordem: urgente → informativo');
 assert.match(por('casos-30').titulo,/^1 atendimento em aberto há mais de 30 dias$/,'30 dias exatos ainda não conta');
 assert.match(por('dias-sem-acao').titulo,/^1 dia útil sem ação em outubro$/);assert.match(por('dias-sem-acao').texto,/^09\/10\./,'fim de semana e o feriado de 12/10 não contam; hoje (14) também não');
 assert.match(por('ritmo-pesquisas').texto,/^1 até hoje; para a data, o esperado seria 27 \(meta de 60 no mês\)/);
 assert.match(por('obras-ontem').titulo,/^1 obra confirmada ontem sem relato$/);assert.match(por('obras-ontem').texto,/^Coletor B\./);assert.equal(por('obras-ontem').aba,'frentes');
 assert.equal(por('sem-publico').pendente,'publico');assert.match(por('sem-publico').titulo,/^1 ação sem público/);
 // Ritmo: com metade do esperado já não alerta; antes do dia 10 também não.
 for(let i=0;i<13;i++)ctx.linhasA.push(pesq(100+i,'2026-10-0'+(1+i%9)));
 assert.equal(calc('2026-10-14','2026-10').some(x=>x.id==='ritmo-pesquisas'),false,'14 de 27 esperadas = acima da metade');
 ctx.linhasA=ctx.linhasA.slice(0,8);assert.equal(calc('2026-10-09','2026-10').some(x=>x.id==='ritmo-pesquisas'),false,'antes do dia 10, sem alerta de ritmo');
 // Ontem sem confirmação, ou "nenhuma obra": sem alerta de obras.
 ctx.ontemA=null;assert.equal(calc('2026-10-14','2026-10').some(x=>x.id==='obras-ontem'),false);
 ctx.ontemA={obras:[],nenhuma:true};assert.equal(calc('2026-10-14','2026-10').some(x=>x.id==='obras-ontem'),false);
 // Dia 1: nada de "dias sem ação" (o mês acabou de começar).
 assert.equal(calc('2026-10-01','2026-10').some(x=>x.id==='dias-sem-acao'),false);
 // Mês passado (painel de setembro visto em outubro): o mês inteiro conta; ritmo e obras de ontem não.
 a=calc('2026-10-14','2026-09');assert.match(a.find(x=>x.id==='dias-sem-acao').titulo,/dias úteis sem ação em setembro/);assert.equal(a.some(x=>x.id==='ritmo-pesquisas'||x.id==='obras-ontem'),false);
 // Feriados iguais aos do cronograma (Agenda.html).
 const src=fs.readFileSync(__dirname+'/../src/Agenda.html','utf8').replace(/^<script>\s*/,'').replace(/\s*<\/script>\s*$/,''),cli={window:{},document:{addEventListener(){},getElementById(){return null}},console,Intl,Date,Math,TextEncoder,Uint8Array,Uint32Array,DataView,ArrayBuffer,Blob:function(){},URL};
 vm.createContext(cli);vm.runInContext(src,cli);
 for(const ano of [2025,2026,2027,2028,2029,2030])assert.deepEqual(run('[...AlertasGestaoCPT.feriados('+ano+')].sort()'),Object.keys(cli.window.CPTAgenda.feriados(ano)).sort(),'feriados '+ano);
 // Painel da gestão usa as mesmas regras (com o detalhe) e o botão de "sem público" abre a lista filtrada.
 email='gestao@example.com';const pg=run("carregarPainelGestaoCPT({mes:'2026-09',atualizar:true})");assert.ok(pg.alertas.every((x,i)=>!i||({alto:0,medio:1,baixo:2})[pg.alertas[i-1].nivel]<=({alto:0,medio:1,baixo:2})[x.nivel]),'painel em ordem de urgência');
 assert.ok(pg.alertas.some(x=>/dias? úte(l|is) sem ação/.test(x.texto)&&x.detalhe),'painel mostra dias úteis sem ação com detalhe');
 // Só a gerência recebe alertas.
 email='atd@example.com';assert.deepEqual(run('alertasGestaoCPT()').alertas,[]);email='gestao@example.com';assert.ok(Array.isArray(run('alertasGestaoCPT()').alertas));}
console.log('PASS: alertas da gestão — caso aberto há mais de 30 dias, dias úteis sem ação (sem fim de semana, feriado e o dia de hoje), ritmo de pesquisas abaixo da metade a partir do dia 10, obras confirmadas ontem sem relato, ações sem público; feriados iguais aos do cronograma; painel com as mesmas regras; só para a gerência.');

// 2.37: índice mensal dos relatos — os detalhes (coluna 21) são lidos uma vez por registro; resultado igual à regra antiga.
{let col21=0;const g0=registros.getRange.bind(registros);registros.getRange=(r,c,n,m)=>{if(c===21)col21+=n||1;return g0(r,c,n,m);};
 agenda.sheets=agenda.sheets.filter(s=>!s.name.startsWith('Índice dos relatos'));cacheMap.clear();email='gestao@example.com';
 const r1=run("carregarRelatosResumoCPT('2026-09')");assert.ok(col21>0,'primeira vez lê os detalhes');
 const aba=agenda.getSheetByName('Índice dos relatos · 2026-09');assert.ok(aba,'índice do mês criado');assert.equal(aba.rows.length-1,r1.itens.length);
 cacheMap.clear();col21=0;const r2=run("carregarRelatosResumoCPT('2026-09')");assert.equal(col21,0,'com o índice, não lê a coluna de detalhes');assert.deepEqual(r2.itens.map(({...x})=>x),r1.itens.map(({...x})=>x),'mesmo resultado');
 // Conferência igual à regra antiga (doRegistro sobre os detalhes completos).
 r2.itens.forEach(it=>{const row=registros.rows.find(r=>r[0]===it.id);ctx.rowX=row;const q=run("(()=>{const c=DadosDaAplicacao.campos(rowX[20]);return RelatosCPT.ehRelato(rowX[1])&&c?RelatosCPT.doRegistro(rowX,c):null;})()");assert.deepEqual(it.qualidade,q,'conferência igual para '+it.id);});
 // Registro alterado (hash muda): só ele é relido.
 const alvo=registros.rows.find(r=>r[0]===r1.itens[0].id);alvo[19]='hash-novo';cacheMap.clear();col21=0;run("carregarRelatosResumoCPT('2026-09')");assert.equal(col21,1,'só o registro alterado é relido');
 // Índice apagado à mão: refaz sozinho.
 agenda.sheets=agenda.sheets.filter(s=>!s.name.startsWith('Índice dos relatos'));cacheMap.clear();assert.equal(run("carregarRelatosResumoCPT('2026-09')").itens.length,r1.itens.length);
 registros.getRange=g0;}
console.log('PASS: índice dos relatos — detalhes lidos uma vez por registro (depois, nenhuma leitura da coluna de detalhes), conferência igual à regra antiga, registro alterado relido sozinho, índice apagado refeito.');

// 2.37: aquecimento opcional — prepara início, relatos (índice), painel, alertas e cronograma; um passo com falha não derruba os outros.
{email='victor@example.com';cacheMap.clear();const r=run('aquecerCPT()');assert.equal(r.resultado,'AQUECIDO',JSON.stringify(r.falhas));assert.deepEqual(r.feitos,['inicio','relatos','painel','alertas','cronograma']);
 const fmt=ctx.Utilities.formatDate;ctx.Utilities.formatDate=(d,z,f)=>f==='H'?'23':fmt(d,z,f);assert.equal(run('aquecerCPT()').resultado,'FORA DO HORÁRIO');ctx.Utilities.formatDate=fmt;}
console.log('PASS: aquecimento — prepara início, relatos, painel, alertas e cronograma; fora das 6h às 21h não faz nada.');
