// Meu espaço (mascote, presentes, caderno, checklist e pontos) com serviços Google simulados. node app/testes/espaco.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
let email='victor@example.com',locked=false;
const pessoa=(e,n,papeis)=>['CPT_PESSOA:'+e,JSON.stringify({email:e,nome:n,papeis,ativo:true,versao:1})];
const props=new Map([['CPT_APLICACAO_1',JSON.stringify({baseId:'base',administrador:email,agendaId:'agenda',versao:'2.8.0'})],
  pessoa('com@example.com','Paula',['comunicacao']),pessoa('social@example.com','Ana',['socioambiental']),pessoa('atd@example.com','Bia',['atendimento']),pessoa('com2@example.com','Rui',['comunicacao'])]);
class Sheet{constructor(n,rows=[]){this.name=n;this.rows=rows;}getName(){return this.name}getLastRow(){return this.rows.length}setFrozenRows(){}
  getRange(r,c,n=1,m=1){const s=this;const vals=()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.rows[r+i-1]?.[c+j-1]??''));let px;
    const api={getValues:vals,getValue:()=>vals()[0][0],setValues:v=>{v.forEach((row,i)=>{while(s.rows.length<r+i)s.rows.push([]);row.forEach((x,j)=>s.rows[r+i-1][c+j-1]=x)});return px}};
    px=new Proxy(api,{get:(t,k)=>k in t?t[k]:()=>px});s.leituras=(s.leituras||0)+1;return px;}}
class Book{constructor(id,sheets){this.id=id;this.sheets=sheets}getId(){return this.id}getSheets(){return this.sheets}getSheetByName(n){return this.sheets.find(s=>s.name===n)||null}insertSheet(n){const a=new Sheet(n);this.sheets.push(a);return a}getSpreadsheetTimeZone(){return 'America/Sao_Paulo'}}
const D=s=>new Date(s+'T12:00:00Z'),hoje=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date()),mais=n=>{const d=new Date(hoje+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const foto=id=>'https://drive.google.com/open?id='+id;
const reg=(i,data,ativ,campos)=>['REG-'+String(i).padStart(24,'a'),'Relato de atividade',D(data),data.slice(0,7),'','4.0','','Vila Linda','',' ','','Ana','Social',ativ,10,'','','','','',JSON.stringify({campos})];
const colReg=['ID','Procedimento','Data do procedimento','Mês','Carimbo do envio','Origem','ID legado','Bairro','Bairro ID','Obra de referência','Obra ID','Responsável','Área','Atividade','Público informado','Protocolo informado','Situação do vínculo','Pesquisa','Conferência dos campos','Hash','Detalhes JSON'];
const registros=new Sheet('Registros',[colReg,reg(1,'2026-08-30','Antiga',[{titulo:'Fotos',tipo:'FILE_UPLOAD',valor:[foto('FOTOAGOSTO000000000000001')]}]),
  reg(2,'2026-09-05','Oficina de horta',[{titulo:'Adicione até 5 fotos',tipo:'FILE_UPLOAD',valor:[foto('FOTOSET0000000000000000001'),foto('FOTOSET0000000000000000002')]},{titulo:'Relato',valor:'texto'}]),
  reg(3,'2026-09-06','Diálogo',[{titulo:'Vídeo da atividade',tipo:'FILE_UPLOAD',valor:foto('VIDEOSET000000000000000001')},{titulo:'Fotos repetidas',tipo:'FILE_UPLOAD',valor:[foto('FOTOSET0000000000000000001')]}])]);
const eventos=new Sheet('Eventos',[['ID','Versão','Operação ID','Alterado em','Alterado por','Conteúdo JSON'],
  ['AG-1',1,'OP-x','', '',JSON.stringify({id:'AG-1',versao:1,titulo:'Ação na escola',data:mais(2),inicio:'',fim:'',frentes:['socioambiental'],responsaveis:[],status:'confirmada',natureza:'externo',criadoPor:'social@example.com'})],
  ['AG-2',1,'OP-y','', '',JSON.stringify({id:'AG-2',versao:1,titulo:'Reunião interna do atendimento',data:mais(1),inicio:'',fim:'',frentes:['atendimento'],responsaveis:[],status:'confirmada',natureza:'interno',criadoPor:'atd@example.com'})]]);
const books=new Map([['base',new Book('base',[registros])],['agenda',new Book('agenda',[eventos])]]);
const arquivos=new Map(),cacheMap=new Map();let criados=0;
const arquivo=(id,mime)=>({getId:()=>id,getMimeType:()=>mime,getSize:()=>1000,getName:()=>id+'.jpg',getBlob:()=>({setName(n){this.n=n;return this},getName(){return this.n}})});
['FOTOSET0000000000000000001','FOTOSET0000000000000000002','FOTOAGOSTO000000000000001'].forEach(id=>arquivos.set(id,arquivo(id,'image/jpeg')));arquivos.set('VIDEOSET000000000000000001',arquivo('VIDEOSET000000000000000001','video/mp4'));
const ctx={Date,console:{log(){},warn(){},error(){}},JSON,
  Session:{getActiveUser:()=>({getEmail:()=>email})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>Object.fromEntries(props),getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
  SpreadsheetApp:{openById:id=>{if(!books.has(id))throw Error('Não existe');return books.get(id)}},
  DriveApp:{getFileById:id=>{if(!arquivos.has(id))throw Error('sem acesso');return arquivos.get(id)},getFolderById:()=>{throw Error('x')},
    createFolder:()=>({getId:()=>'PASTA-EXTRAS',createFile:b=>{criados++;const id='EXTRA'+String(criados).padStart(20,'0');arquivos.set(id,arquivo(id,b.mime));return arquivos.get(id);}})},
  CacheService:{getScriptCache:()=>({get:k=>cacheMap.get(k)||null,put:(k,v)=>cacheMap.set(k,v),remove:k=>cacheMap.delete(k)})},
  Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:(d,_,f)=>{const s=new Date(d.getTime()-3*3600e3).toISOString();return f==='yyyy-MM'?s.slice(0,7):f==='yyyy-MM-dd'?s.slice(0,10):s.slice(0,16)},
    base64Decode:s=>[...Buffer.from(s,'base64')],newBlob:(b,mime,nome)=>({mime,nome}),zip:(blobs,n)=>({getBytes:()=>[1,2,3],blobs}),base64Encode:()=>'AQID'},
  LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},releaseLock:()=>locked=false})}};
vm.createContext(ctx);
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','SocioambientalCPT','PerfisCPT','CronogramaCPT','AplicacaoCPT','ColecaoCPT','RecadosCPT','ComunicacaoCPT','PessoalCPT','ConteudoSaneamentoCPT','QuizCPT','JogosCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx))),op=()=>'OP-'+crypto.randomUUID();
const masc=(o)=>{ctx.m={...o,operacaoId:op()};return run('salvarMascoteCPT(m)');};
// 1. Semana ISO.
assert.equal(run("PessoalCPT.semana('2026-10-02')"),'2026-S40');assert.equal(run("PessoalCPT.semana('2026-01-01')"),'2026-S01');assert.equal(run("PessoalCPT.semana('2027-01-01')"),'2026-S53');
// 2. Primeiro mascote, nome, presente da semana uma vez.
email='com@example.com';let d=run('carregarMeuEspacoCPT()');assert.equal(d.perfil,null);assert.deepEqual(d.pendentes,[]);
assert.throws(()=>masc({acao:'iniciar',especie:'unicornio',nome:'X'}),/opção válida/);assert.throws(()=>masc({acao:'iniciar',especie:'pato',nome:'<b>'}),/só letras/);
let r=masc({acao:'iniciar',especie:'pato',nome:'Cleber'});assert.equal(r.perfil.id,'PES-com@example.com');assert.equal(r.pendentes.length,1);
assert.equal(masc({acao:'iniciar',especie:'gato',nome:'Outro'}).perfil.mascotes.length,1,'iniciar de novo não troca');
const chave=r.pendentes[0].chave;assert.match(chave,/^semana:\d{4}-S\d\d$/);
assert.throws(()=>masc({acao:'vestir',slot:'cabeca',item:'capacete-amarelo',versao:r.perfil.versao}),/ainda não é sua/);
assert.throws(()=>masc({acao:'resgatar',chave,escolha:'peca',item:'capacete-dourado',versao:r.perfil.versao}),/peça comum/);
r=masc({acao:'resgatar',chave,escolha:'peca',item:'capacete-amarelo',versao:r.perfil.versao});assert.equal(r.perfil.mascotes[0].equipado.cabeca,'capacete-amarelo');assert.deepEqual(r.pendentes,[]);
assert.throws(()=>masc({acao:'resgatar',chave,escolha:'mascote',especie:'gato',nome:'Mingau',versao:r.perfil.versao}),/já foi resgatado/);
assert.throws(()=>masc({acao:'nomear',nome:'Velho',versao:r.perfil.versao-1}),/Outra pessoa alterou/);
r=masc({acao:'nomear',nome:'Cleber Jr',versao:r.perfil.versao});assert.equal(r.perfil.mascotes[0].nome,'Cleber Jr');
// 2.10: cor do mascote (lista fixa, livre) e capivara.
assert.throws(()=>masc({acao:'colorir',cor:'neon',versao:r.perfil.versao}),/opção válida/);
r=masc({acao:'colorir',cor:'azul',versao:r.perfil.versao});assert.equal(r.perfil.mascotes[0].cor,'azul');assert.match(r.resultado,/azul/);
r=masc({acao:'colorir',cor:'',versao:r.perfil.versao});assert.equal(r.perfil.mascotes[0].cor,'');assert.match(r.resultado,/cor original/);
assert.ok(run('PessoalCPT.especies').capivara,'capivara entre os mascotes');
console.log('PASS: mascote — escolha e nome validados, presente da semana uma única vez (peça comum), peça só de quem tem, conflito de versão.');
// 3. Caderno: a cada 5 dias com anotação (≥ 20 caracteres) uma peça; futuro não; editar não duplica.
const dia=n=>{const x=new Date(hoje+'T12:00:00Z');x.setUTCDate(x.getUTCDate()-n);return x.toISOString().slice(0,10);};
const nota=(n,texto,versao)=>{ctx.n={data:dia(n),texto,versao:versao||0,operacaoId:op()};return run('salvarNotaCPT(n)');};
assert.throws(()=>nota(-1,'amanhã não pode ser escrito'),/hoje e dias anteriores/);
nota(0,'curto');for(let i=1;i<=4;i++)nota(i,'Anotação suficiente do dia número '+i);assert.equal(run('carregarMeuEspacoCPT()').caderno.dias,4);
let n5=nota(0,'Agora sim uma anotação longa o bastante',1);assert.equal(n5.dias,5);assert.match(n5.resultado,/peça nova/);assert.equal(n5.pendentes[0].chave,'caderno:5');
nota(0,'Editando de novo a mesma anotação do dia',2);assert.equal(run('carregarMeuEspacoCPT()').pendentes.length,1,'editar não cria outro presente');
d=run('carregarMeuEspacoCPT()');assert.throws(()=>masc({acao:'resgatar',chave:'caderno:5',escolha:'mascote',especie:'gato',nome:'Mingau',versao:d.perfil.versao}),/só no presente da semana/);
r=masc({acao:'resgatar',chave:'caderno:5',escolha:'peca',item:'camisa-timao',versao:d.perfil.versao});assert.equal(r.perfil.mascotes[0].equipado.corpo,'camisa-timao');
assert.throws(()=>masc({acao:'resgatar',chave:'caderno:10',escolha:'peca',item:'bone',versao:r.perfil.versao}),/já foi resgatado/);
console.log('PASS: caderno — 5 dias com anotação de verdade viram uma peça, futuro bloqueado, edição não duplica, resgate só uma vez.');
// 4. Checklist: 10 pontos por tarefa feita, uma vez; até 8 por dia; tarefa futura não pontua; apagar não tira pontos.
const lista=(n,itens,versao)=>{ctx.l={data:dia(n),itens,versao:versao||0,operacaoId:op()};return run('salvarChecklistCPT(l)');};
let L=lista(0,Array.from({length:10},(_,i)=>({id:'T-tarefa'+i,texto:'Tarefa '+i,feito:true})));assert.equal(L.pontos.ganhos,80,'limite de 8 por dia');assert.match(L.resultado,/\+80/);
L=lista(0,L.lista.itens.map(t=>({...t,feito:false})),L.lista.versao);L=lista(0,L.lista.itens.map(t=>({...t,feito:true})),L.lista.versao);assert.equal(L.pontos.ganhos,80,'desmarcar e marcar não soma');
L=lista(0,[{id:'T-tarefa0',texto:'Tarefa 0',feito:true}],L.lista.versao);assert.equal(L.pontos.ganhos,80,'apagar tarefa não tira pontos');assert.equal(L.lista.itens.filter(t=>!t.removido).length,1);
let F=lista(-2,[{id:'T-futura',texto:'Planejada',feito:true}]);assert.equal(F.pontos.ganhos,80,'tarefa de dia futuro não pontua');
lista(1,[{id:'T-ontem1',texto:'Ontem',feito:true},{id:'T-ontem2',texto:'Ontem 2',feito:false}]);assert.equal(run('carregarMeuEspacoCPT()').pontos.ganhos,90);
assert.throws(()=>lista(3,Array.from({length:31},(_,i)=>({texto:'x'+i}))),/até 30/);
d=run('carregarMeuEspacoCPT()');assert.deepEqual(d.proximos,[{data:dia(-2),pendentes:0}].filter(x=>x.pendentes));
// 5. Loja: pontos compram exclusivas; saldo nunca negativo.
assert.throws(()=>masc({acao:'comprar',item:'capacete-dourado',versao:d.perfil.versao}),/Faltam pontos/);
assert.throws(()=>masc({acao:'comprar',item:'bone',versao:d.perfil.versao}),/não é vendida/);
for(const n of [2,3,4])lista(n,Array.from({length:8},(_,i)=>({id:'T-d'+n+'x'+i,texto:'T'+i,feito:true})));
d=run('carregarMeuEspacoCPT()');assert.equal(d.pontos.saldo,330);
let r3=masc({acao:'comprar',item:'medalha',versao:d.perfil.versao});assert.equal(r3.pontos.saldo,130);assert.equal(r3.perfil.mascotes[0].equipado.pescoco,'medalha');
assert.throws(()=>masc({acao:'comprar',item:'medalha',versao:r3.perfil.versao}),/já tem/);assert.throws(()=>masc({acao:'comprar',item:'capacete-dourado',versao:r3.perfil.versao}),/Faltam pontos/);
console.log('PASS: checklist e loja — 10 pontos por tarefa uma única vez, até 8 por dia, futuro não pontua, apagar não tira, até 30 tarefas; peça exclusiva só com saldo e sem repetir.');
// 6. Privacidade: cada pessoa só tem o próprio espaço.
email='social@example.com';d=run('carregarMeuEspacoCPT()');assert.equal(d.perfil,null);assert.equal(d.caderno.dias,0);assert.equal(d.pontos.ganhos,0);assert.equal(d.nota.texto,'');
ctx.n={data:hoje,texto:'Anotação da Ana, só dela mesmo.',versao:0,operacaoId:op()};run('salvarNotaCPT(n)');
email='com@example.com';assert.equal(run('carregarMeuEspacoCPT()').nota.texto,'Editando de novo a mesma anotação do dia','a nota da outra pessoa não aparece');
// 2.18: elenco chibi e kit EPI — no período de testes, só o proprietário.
email='com@example.com';d=run('carregarMeuEspacoCPT()');assert.ok(d.especies.dinossauro&&!d.especies.urso,'quem não é o proprietário continua com o elenco anterior');assert.deepEqual(d.kit,[]);assert.deepEqual(d.classicos,{});
assert.throws(()=>masc({acao:'comprarClassico',especie:'abelha',nome:'Mel',versao:d.perfil.versao}),/chegam junto com o elenco novo/);assert.ok(!d.catalogo.some(x=>x.id==='camisa-veolia'),'camiseta Veolia só no elenco novo');
assert.throws(()=>masc({acao:'vestir',slot:'luvas',item:'luvas',versao:d.perfil.versao}),/ainda não é sua/);
email='victor@example.com';d=run('carregarMeuEspacoCPT()');assert.ok(d.especies.urso&&d.especies.sapo&&d.especies.gota&&!d.especies.dinossauro);assert.deepEqual([...d.kit].sort(),['bota-preta','capacete-branco','colete','laco-do-mes','luvas']);assert.ok(d.catalogo.some(x=>x.id==='camisa-veolia'&&x.slot==='corpo'&&!x.preco),'camiseta Veolia: peça comum de roupa');
r=masc({acao:'iniciar',especie:'urso',nome:'Tonico'});assert.deepEqual({...r.perfil.mascotes[0].equipado},{cabeca:'capacete-branco',corpo:'colete',luvas:'luvas',pes:'bota-preta',broche:'laco-do-mes'},'mascote novo já vem com o kit (e o laço do mês)');
r=masc({acao:'vestir',slot:'luvas',item:'',versao:r.perfil.versao});r=masc({acao:'vestir',slot:'luvas',item:'luvas',versao:r.perfil.versao});assert.equal(r.perfil.mascotes[0].equipado.luvas,'luvas','kit é de todo mundo');
assert.throws(()=>masc({acao:'comprarClassico',especie:'dinossauro',nome:'Rex',versao:r.perfil.versao}),/Faltam pontos/);
const oito=k=>Array.from({length:8},(_,i)=>({id:'T-'+k+i,texto:'Tarefa '+i,feito:true}));lista(1,oito('a'));lista(2,oito('b'));
r=masc({acao:'comprarClassico',especie:'dinossauro',nome:'Rex',versao:r.perfil.versao});assert.equal(r.perfil.mascotes.length,2);assert.equal(r.perfil.mascotes[1].especie,'dinossauro');assert.equal(r.pontos.saldo,10);
assert.throws(()=>masc({acao:'comprarClassico',especie:'dinossauro',nome:'Rex',versao:r.perfil.versao}),/já tem/);
assert.throws(()=>masc({acao:'comprarClassico',especie:'abelha',nome:'Mel',versao:r.perfil.versao}),/Faltam pontos/);
console.log('PASS: elenco chibi e kit EPI — elenco novo só do proprietário nos testes, mascote novo já com o kit, kit sem precisar ganhar, clássicos por 150 pontos (sem repetir).');
assert.equal(locked,false);
console.log('PASS: privacidade — caderno, checklist, pontos e mascote são de cada conta; ninguém lê o espaço do outro pela aplicação.');
