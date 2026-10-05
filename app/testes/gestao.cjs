// Programa Parceiros, Painel da gestão, Auditoria de atendimentos, Conectores e trava de configuração, com serviços Google simulados.
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
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','SocioambientalCPT','PerfisCPT','CronogramaCPT','ObrasCPT','ColecaoCPT','ObrasDoDiaCPT','RelatorioMensalCPT','CicloAtendimentoCPT','AplicacaoCPT','ConectoresCPT','ProgramaParceirosCPT','PaineisGestaoCPT','RelatosCPT','AuditoriaAtendimentosCPT','EntregasDoMesCPT','ControleContratoCPT','OrganogramaCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx)));

// Máscara oficial: linha 2 com Junho (C:L), Julho (M:O), Agosto (P:R); perguntas na coluna B; fórmula em P9.
const perguntas=run('ProgramaParceirosCPT.perguntas');
const mrows=[[],['','Dados','Junho','','','','','','','','','','Julho','','','Agosto']];perguntas.forEach(([l,,r])=>{mrows[l-1]=['',r];});
mrows[2][15]=0;mrows[7][15]=8;mrows[8][15]=53;mrows[16][15]=8;
const mascara=new Sheet('Sheet1',mrows,2014363223);mascara.formulas.set('9,16','=40+13');mascara.merges=[{r:2,c:3,w:10},{r:2,c:13,w:3},{r:2,c:16,w:3}];
books.set('1ekpoNrPSdIbc18YxWp5ncQsTiWluS--m',new Book('1ekpoNrPSdIbc18YxWp5ncQsTiWluS--m',[mascara],'Máscara de lançamento'));

// 1. Programa Parceiros: só Gestão/Administrativo; sugestões com regra; mês anterior vindo da máscara.
email='social@example.com';assert.throws(()=>run("carregarParceirosCPT('2026-09')"),/Gestão e pelo Administrativo/);
email='gestao@example.com';let d=run("carregarParceirosCPT('2026-09')");
assert.equal(d.mascara.ok,true);assert.equal(d.mascara.coluna,0);assert.equal(d.atual.versao,0);assert.equal(d.podePublicar,false);
assert.equal(d.anterior[8].valor,8);assert.equal(d.origemAnterior,'Máscara oficial');
assert.equal(d.definicoes.flatMap(g=>g.perguntas).length,90);
assert.equal(d.sugestoes[8].valor,1,'DDS não é reunião aberta à comunidade');assert.equal(d.sugestoes[9].valor,15);assert.match(d.sugestoes[10].valor,/Ação Social Externa/);
assert.equal(d.sugestoes[17].valor,8.5);assert.equal(d.sugestoes[19].valor,8);assert.match(d.sugestoes[18].valor,/esperança/);
assert.equal(d.sugestoes[23].valor,1);assert.equal(d.sugestoes[24].valor,1);assert.equal(d.sugestoes[28].valor,1);assert.equal(d.sugestoes[27].valor,0);
assert.equal(d.sugestoes[31].valor,12,'média de 2 e 21 dias, arredondada');assert.equal(d.sugestoes[44].valor,1);
assert.ok(d.sugestoes[8].regra.length>20,'toda sugestão diz como foi calculada');
// 2. Salvar: validação por tipo, versão, idempotência e conflito.
ctx.s={mes:'2026-09',versao:0,operacaoId:'OP-aaaaaaaaaa',campos:{17:{valor:'11',conferido:true}}};assert.throws(()=>run('salvarParceirosCPT(s)'),/0 a 10/);
ctx.s.campos={8:{valor:'onze',conferido:false}};assert.throws(()=>run('salvarParceirosCPT(s)'),/número/);
ctx.s.campos={999:{valor:'1'}};assert.throws(()=>run('salvarParceirosCPT(s)'),/fora da máscara/);
ctx.s.campos={8:{valor:'11',conferido:true},9:{valor:'94',conferido:true},10:{valor:'=HOJE()',conferido:true},17:{valor:'8,7',conferido:true},33:{valor:'29.839',conferido:true},12:{valor:'não se aplica',conferido:true},59:{valor:true,conferido:true},83:{valor:'Sim',conferido:false},3:{valor:'',conferido:false}};
let r=run('salvarParceirosCPT(s)');assert.equal(r.atual.versao,1);assert.equal(r.atual.campos[17].valor,8.7);assert.equal(r.atual.campos[33].valor,29839);assert.equal(r.atual.campos[12].valor,'Não aplicada');assert.equal(r.atual.campos[3],undefined);
assert.equal(run('salvarParceirosCPT(s)').atual.versao,1,'mesma operação não duplica');
ctx.s={...ctx.s,operacaoId:'OP-bbbbbbbbbb'};assert.throws(()=>run('salvarParceirosCPT(s)'),/Outra pessoa salvou/);
assert.equal(run("carregarParceirosCPT('2026-09')").atual.versao,1);
// 3. Publicar: travado para a Gestão durante os testes; o proprietário publica só os conferidos e cria a coluna do mês.
ctx.pub={mes:'2026-09',versao:1};assert.throws(()=>run('publicarParceirosCPT(pub)'),/período de testes/);
email='victor@example.com';r=run('publicarParceirosCPT(pub)');
assert.equal(mascara.rows[1][18],'Setembro/2026');assert.equal(r.atual.publicacao.coluna,19);assert.equal(r.atual.publicacao.criada,true);
assert.equal(mascara.rows[7][18],11);assert.equal(mascara.rows[16][18],8.7);assert.equal(mascara.rows[9][18],"'=HOJE()",'texto que parece fórmula entra como texto');
assert.equal(mascara.rows[58][18],true);assert.equal(mascara.rows[82]?.[18]??'','','não conferido não é gravado');assert.equal(r.atual.situacao,'publicado');assert.equal(locked,false);
// Mês com fórmula: a linha com fórmula é preservada.
ctx.s={mes:'2026-08',versao:0,operacaoId:'OP-cccccccccc',campos:{8:{valor:'9',conferido:true},9:{valor:'60',conferido:true}}};run('salvarParceirosCPT(s)');
r=run("publicarParceirosCPT({mes:'2026-08',versao:1})");assert.equal(mascara.rows[7][15],9);assert.equal(mascara.rows[8][15],53);assert.deepEqual(r.atual.publicacao.comFormula,[9]);assert.match(r.resultado,/fórmula preservadas: 9/);
// Falha no meio: valores anteriores restaurados.
ctx.s={mes:'2026-08',versao:2,operacaoId:'OP-dddddddddd',campos:{8:{valor:'7',conferido:true},17:{valor:'6',conferido:true}}};run('salvarParceirosCPT(s)');
falharGravacao=2;assert.throws(()=>run("publicarParceirosCPT({mes:'2026-08',versao:3})"),/restaurados/);assert.equal(mascara.rows[7][15],9);assert.equal(mascara.rows[16][15],8);falharGravacao=0;
// Máscara alterada: nada é gravado.
mascara.rows[7][1]='Outra pergunta qualquer no lugar';assert.throws(()=>run("publicarParceirosCPT({mes:'2026-08',versao:3})"),/máscara mudou na linha 8/);mascara.rows[7][1]=perguntas.find(p=>p[0]===8)[2];
// Exportar: planilha nova com as 90 perguntas, sem tocar na máscara.
r=run("exportarParceirosCPT({mes:'2026-09'})");assert.match(r.xlsx,/format=xlsx/);assert.equal(books.get('ss'+criadas).sheets[0].rows.length,91);
console.log('PASS: Programa Parceiros — 90 perguntas da máscara, sugestões com regra (reuniões sem DDS, satisfação, manifestações, prazo), validação por tipo, versão, idempotência, conflito, publicação só do conferido (trava de testes, coluna nova, fórmula preservada, restauração, máscara alterada) e planilha de conferência.');

// 4. Painel da gestão: contrato, frentes e relatos em resumo.
email='atd@example.com';assert.throws(()=>run("carregarPainelGestaoCPT({mes:'2026-09'})"),/Administrativo e da Gestão/);
email='gestao@example.com';const p=run("carregarPainelGestaoCPT({mes:'2026-09'})");
assert.equal(p.contrato.acoes,2);assert.equal(p.contrato.pessoas,35);assert.equal(p.contrato.diagnosticos,1);assert.equal(p.contrato.pesquisas.mes,2);
assert.equal(p.contrato.casos.abertos,2);assert.equal(p.contrato.casos.concluidosMes,2);assert.equal(p.serie.length,6);assert.equal(p.serie[4].acoes,1,'agosto');
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
email='victor@example.com';let ms=run('new ControleContratoCPT(AplicacaoCPT.contexto()).missoes()').filter(x=>x.id.startsWith('controle-contrato:'));assert.equal(ms.length,1);assert.equal(ms[0].id,'controle-contrato:'+antC);assert.equal(ms[0].rota,'painel');
ctx.m={mes:antC,respondida:true,versao:0,operacaoId:'OP-controle-0002'};let mk=run('marcarControleContratoCPT(m)');assert.ok(mk.respondida.nome,'quem respondeu');
assert.equal(run('new ControleContratoCPT(AplicacaoCPT.contexto()).missoes()').filter(x=>x.id.startsWith('controle-contrato:')).length,0,'respondida: o lembrete some');
ctx.m={mes:antC,respondida:false,versao:mk.versao,operacaoId:'OP-controle-0003'};assert.equal(run('marcarControleContratoCPT(m)').respondida,null);
assert.equal(run('new ControleContratoCPT(AplicacaoCPT.contexto()).missoes()').filter(x=>x.id.startsWith('controle-contrato:')).length,1,'desfeita: o lembrete volta');
assert.ok(!abertas.includes('1pQJ5B8wRzsdlU8udlh9ZzcWXozT3BOh4'),'a planilha de controle nunca é aberta pela aplicação');ctx.SpreadsheetApp.openById=abrir0;
console.log('PASS: planilha de controle — lembrete mensal com link na aba, prazo e números do mês; marcar respondida só pelo proprietário nos testes; missão some e volta; a planilha nunca é aberta.');
// 2.26: organograma — todos veem; Gestão/Administrativo editam (só o proprietário nos testes); sem ciclos; trazer da equipe sem repetir.
email='atd@example.com';let og=run('carregarOrganogramaCPT()');assert.deepEqual(og.pessoas,[]);assert.equal(og.podeEditar,false);assert.equal(books.get('agenda').getSheetByName('Organograma'),null,'ler não cria a aba');
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
email='atd@example.com';og=run('carregarOrganogramaCPT()');assert.equal(og.pessoas.length,nEquipe-1,'quem saiu não aparece (fica no histórico)');assert.ok(!og.pessoas.some(x=>'email' in x),'e-mail não vai para a tela');
console.log('PASS: organograma — todos veem; só Gestão/Administrativo editam (proprietário nos testes); trazer da equipe sem repetir; sem ciclo nem chefia de si mesmo; tirar pede mudar quem responde; e-mail não vai à tela.');

// 5. Auditoria de atendimentos.
email='social@example.com';assert.throws(()=>run('auditarAtendimentosCPT()'),/Atendimento, Administrativo e Gestão/);
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
run('liberarConfiguracaoCPT()');email='gestao@example.com';assert.equal(run("carregarParceirosCPT('2026-09')").podePublicar,true);run('travarConfiguracaoCPT()');assert.equal(run("carregarParceirosCPT('2026-09')").podePublicar,false);
ctx.pessoa={email:'nova@example.com',nome:'Nova',papeis:['atendimento'],ativo:true,versao:0};assert.throws(()=>run('PerfisCPT.salvar(AplicacaoCPT.identidade(),pessoa)'),/exclusiva da administração técnica/);
console.log('PASS: conectores só para a administração técnica (conferência, pasta das fotos, troca por link validada); trava de testes liga/desliga publicação; cargos só pelo proprietário.');
// 2.13: registros vêm 50 por vez (linhas ocupam menos espaço), com cursor para "Mostrar mais".
for(let i=0;i<60;i++)registros.rows.push(reg(900+i,'Relato de atividade','2026-10-'+String(1+i%28).padStart(2,'0'),'OBR-0001','Coletor A [OBR-0001]','Plantão '+i,3));
{const p1=JSON.parse(JSON.stringify(vm.runInContext("buscarRegistrosCPT({mes:'2026-10'})",ctx)));assert.equal(p1.itens.length,50,'primeira página com 50');assert.ok(p1.proximoCursor);
 ctx.cur=p1.proximoCursor;const p2=JSON.parse(JSON.stringify(vm.runInContext("buscarRegistrosCPT({mes:'2026-10',cursor:cur})",ctx)));assert.equal(p2.itens.length,10,'segunda página com o resto');assert.equal(p2.proximoCursor,null);
 assert.equal(new Set(p1.itens.concat(p2.itens).map(x=>x.id)).size,60,'sem repetir nem pular');}
console.log('PASS: registros 50 por vez, sem repetir nem pular.');
