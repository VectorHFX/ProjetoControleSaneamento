// Quiz e conteúdo de saneamento (2.19) com serviços Google simulados. node app/testes/quiz.cjs  (--atualizar regrava docs/CONTEUDO_SANEAMENTO.md)
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
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','SocioambientalCPT','PerfisCPT','CronogramaCPT','AplicacaoCPT','ColecaoCPT','RecadosCPT','ComunicacaoCPT','PessoalCPT','ConteudoSaneamentoCPT','RevisaoConteudoCPT','QuizCPT','JogosCPT','PlacarCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx))),op=()=>'OP-'+crypto.randomUUID();
const path=require('path'),DOC=path.join(__dirname,'../../docs/CONTEUDO_SANEAMENTO.md');
// 1. Banco: ~150 itens, IDs únicos, 4 alternativas distintas, certa válida, fonte existente (https ou "prática da equipe"),
//    eixos 60/25/15 (com folga), curiosidade = fato + por que importa, sem decoreba de cores e sem alternativas óbvias.
const C=run('ConteudoSaneamentoCPT.curiosidades'),Q=run('ConteudoSaneamentoCPT.perguntas'),F=run('ConteudoSaneamentoCPT.fontes'),T=run('ConteudoSaneamentoCPT.temas'),E=run('ConteudoSaneamentoCPT.eixos'),COR=run('ConteudoSaneamentoCPT.correcoes');
const todos=[...C,...Q];assert.equal(new Set(todos.map(x=>x.id)).size,todos.length,'IDs repetidos');
assert.ok(todos.length>=145&&todos.length<=160,'banco com ~150 itens: '+todos.length);
for(const x of C){assert.ok(F[x.fonte],x.id+' fonte');assert.ok(T[x.tema],x.id+' tema');assert.ok(E[x.eixo],x.id+' eixo');assert.ok(x.texto.length>=30&&x.texto.length<=220,x.id+' tamanho');assert.ok(x.importa&&x.importa.length>=20&&x.importa.length<=180,x.id+' por que importa');}
for(const q of Q){assert.ok(F[q.fonte],q.id+' fonte');assert.ok(T[q.tema],q.id+' tema');assert.ok(E[q.eixo],q.id+' eixo');assert.equal(q.opcoes.length,4,q.id);assert.equal(new Set(q.opcoes).size,4,q.id+' opções repetidas');
  assert.ok(Number.isInteger(q.certa)&&q.certa>=0&&q.certa<4,q.id+' certa');assert.ok(q.explica&&q.pergunta.length<=170,q.id);
  assert.ok(!q.opcoes.some(o=>/^(ninguém|açúcar|vira água tratada)$/i.test(o)),q.id+' alternativa óbvia');}
for(const [k,[n,u]] of Object.entries(F)){if(k==='equipe')assert.equal(u,'','prática da equipe não tem link');else assert.match(u,/^https:\/\//,k);assert.ok(n,k);}
const usadas=new Set(todos.map(x=>x.fonte));for(const k of Object.keys(F))assert.ok(usadas.has(k),'fonte sem uso: '+k);
for(const id of Object.keys(COR))assert.ok(todos.some(x=>x.id===id),'correção de item que não existe: '+id);
const pct=e=>todos.filter(x=>x.eixo===e).length/todos.length;assert.ok(pct('pratica')>=.55&&pct('pratica')<=.65,'práticas '+pct('pratica'));
assert.ok(pct('entender')>=.20&&pct('entender')<=.30,'compreensão '+pct('entender'));assert.ok(pct('curiosidade')>=.10&&pct('curiosidade')<=.20,'curiosidades '+pct('curiosidade'));
assert.ok(Q.filter(q=>/qual cor/i.test(q.pergunta)).length===0,'sem decoreba de cores');
assert.ok(!/166,3|110 litros|3,5 bilh/.test(JSON.stringify(todos)),'números suspensos não voltam');
// Sem viés de posição: a certa não fica sempre no mesmo lugar (e é a mesma a cada leitura).
const pos=[0,1,2,3].map(i=>Q.filter(q=>q.certa===i).length);assert.ok(Math.max(...pos)<Q.length*.35&&Math.min(...pos)>Q.length*.15,'certas concentradas: '+pos);
assert.deepEqual(run('ConteudoSaneamentoCPT.perguntas').map(q=>q.certa),Q.map(q=>q.certa));
// Documento de revisão sincronizado com o código.
const fonteMd=f=>F[f][1]?`[${F[f][0]}](${F[f][1]})`:'_prática da equipe_';
const md=['# Conteúdo de saneamento — para revisão','','Gerado de `app/src/ConteudoSaneamentoCPT.gs` por `node app/testes/quiz.cjs --atualizar`. Não edite à mão.','',
  'A decisão de cada item (Aprovar, Suspender, Voltar) é feita na aplicação, em **Revisão do conteúdo** (só o proprietário). Enquanto um item não for aprovado, só o proprietário o vê, com a marca "a revisar".','',
  'Eixos: '+Object.entries(E).map(([k,n])=>`${n} ${todos.filter(x=>x.eixo===k).length}`).join(' · ')+` (de ${todos.length}).`,'',
  '## Curiosidades ('+C.length+')','',...C.map(x=>`- **${x.id}** · ${T[x.tema]} · ${E[x.eixo]} — ${x.texto} **Por que importa:** ${x.importa} (${fonteMd(x.fonte)})${COR[x.id]?` _Corrigido: ${COR[x.id]}_`:''}`),'',
  '## Perguntas do quiz ('+Q.length+')','',...Q.flatMap(q=>[`### ${q.id} · ${T[q.tema]} · ${E[q.eixo]}`,'',q.pergunta,'',...q.opcoes.map((o,i)=>`${i===q.certa?'- **✔ '+o+'**':'- '+o}`),'',`> ${q.explica} — ${fonteMd(q.fonte)}`,...(COR[q.id]?['',`_Corrigido: ${COR[q.id]}_`]:[]),'']),
  '## Fontes','',...Object.entries(F).map(([k,[n,u]])=>`- \`${k}\`: ${u?`[${n}](${u})`:n}`),''].join('\n');
if(process.argv.includes('--atualizar'))fs.writeFileSync(DOC,md);
assert.equal(fs.existsSync(DOC)&&fs.readFileSync(DOC,'utf8'),md,'docs/CONTEUDO_SANEAMENTO.md desatualizado: rode node app/testes/quiz.cjs --atualizar');
console.log(`PASS: banco — ${C.length} curiosidades (fato + por que importa) e ${Q.length} perguntas; eixos ${['pratica','entender','curiosidade'].map(e=>Math.round(pct(e)*100)+'%').join('/')}; certas ${pos.join('/')}; fontes primárias ou "prática da equipe"; documento em dia.`);
// 2. Trava de testes: só o proprietário. Os outros nem veem nem respondem; aprovados aparecem para todos depois.
email='com@example.com';let d=run('carregarMeuEspacoCPT()');assert.equal(d.saber,undefined);
ctx.p={tipo:'dia',escolha:0,id:'Q001',operacaoId:op()};assert.throws(()=>run('responderQuizCPT(p)'),/reservado à administração técnica/);
assert.equal(books.get('agenda').getSheetByName('Quiz'),null,'ninguém além do proprietário cria a aba');
// 3. Proprietário: pergunta do dia estável, sem a resposta; responder dá 2 pontos se acertar, só uma vez.
email='victor@example.com';d=run('carregarMeuEspacoCPT()');const s=d.saber;
assert.ok(s.curiosidade.texto&&s.curiosidade.fonte.url&&s.curiosidade.revisar);assert.ok(s.mes.campanha&&s.mes.tema);
const qd=s.quiz.dia.pergunta;assert.ok(qd&&qd.opcoes.length===4&&qd.revisar);assert.equal(qd.certa,undefined,'certa não vai antes');assert.equal(qd.explica,undefined);
assert.equal(run('carregarMeuEspacoCPT()').saber.quiz.dia.pergunta.id,qd.id,'mesma pergunta ao recarregar');
const sem=s.quiz.semana;assert.equal(sem.total,5);assert.equal(sem.respondidas,0);assert.ok(sem.proxima&&sem.proxima.certa===undefined);
const ids5=run(`new QuizCPT(AplicacaoCPT.identidade()).perguntasDaSemana(PessoalCPT.semana(ColecaoCPT.hoje()),QuizCPT.segunda(ColecaoCPT.hoje()))`);
assert.ok(!ids5.includes(qd.id),'pergunta do dia fora do quiz da semana');assert.equal(new Set(ids5).size,5);
const certa=id=>Q.find(q=>q.id===id).certa,errada=id=>(certa(id)+1)%4,antes=d.pontos.saldo;
ctx.p={tipo:'dia',escolha:certa(qd.id),id:'Q999',operacaoId:op()};assert.throws(()=>run('responderQuizCPT(p)'),/pergunta mudou/);
ctx.p={tipo:'dia',escolha:7,id:qd.id,operacaoId:op()};assert.throws(()=>run('responderQuizCPT(p)'),/alternativas/);
const opDia=op();ctx.p={tipo:'dia',escolha:certa(qd.id),id:qd.id,versao:0,operacaoId:opDia};let r=run('responderQuizCPT(p)');
assert.match(r.resultado,/Acertou! \+2/);assert.equal(r.resposta.acertou,true);assert.equal(r.resposta.certa,certa(qd.id));assert.ok(r.resposta.explica&&r.resposta.fonte.url);
assert.equal(r.pontos.saldo,antes+2);assert.equal(r.pontos.quiz,2);
assert.equal(run('responderQuizCPT(p)').pontos.saldo,antes+2,'mesma operação não soma de novo');
ctx.p={tipo:'dia',escolha:certa(qd.id),id:qd.id,versao:1,operacaoId:op()};assert.throws(()=>run('responderQuizCPT(p)'),/já respondeu a pergunta de hoje/);
d=run('carregarMeuEspacoCPT()');assert.equal(d.saber.quiz.dia.pergunta,null);assert.equal(d.saber.quiz.dia.resposta.id,qd.id);assert.equal(d.pontos.saldo,antes+2);
console.log('PASS: pergunta do dia — só do proprietário nos testes, estável, resposta certa só depois, 2 pontos se acertar, uma vez (operação repetida não soma).');
// 4. Quiz da semana: 5 em ordem, 10 por acerto, erro mostra a explicação, depois da 5ª acabou.
let v=0,ganho=0;for(let i=0;i<5;i++){const e=run('carregarMeuEspacoCPT()').saber.quiz.semana;assert.equal(e.indice,i);assert.equal(e.proxima.id,ids5[i]);
  const acerta=i%2===0;ctx.p={tipo:'semana',escolha:acerta?certa(ids5[i]):errada(ids5[i]),id:ids5[i],versao:v,operacaoId:op()};r=run('responderQuizCPT(p)');v=r.estado.semana.versao;ganho+=acerta?10:0;
  assert.equal(r.resposta.acertou,acerta);if(!acerta)assert.match(r.resultado,/Quase/);}
assert.equal(r.estado.semana.respondidas,5);assert.equal(r.estado.semana.acertos,3);assert.equal(r.estado.semana.pontos,30);assert.equal(r.estado.semana.proxima,null);assert.equal(r.pontos.quiz,32);
ctx.p={tipo:'semana',escolha:0,id:ids5[0],versao:v,operacaoId:op()};assert.throws(()=>run('responderQuizCPT(p)'),/já fez o quiz desta semana/);
console.log('PASS: quiz da semana — 5 perguntas em ordem, 10 pontos por acerto (3 de 5 = 30), sem refazer; pontos do quiz somam ao saldo da loja.');
// 5. Amanhã: a pergunta do dia não repete o que já foi respondido; outra pessoa não vê nada do quiz do proprietário.
const amanha=run(`(()=>{const q=new QuizCPT(AplicacaoCPT.identidade());const d=new Date(ColecaoCPT.hoje()+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return q.perguntaDoDia(d.toISOString().slice(0,10));})()`);
assert.ok(amanha&&amanha!==qd.id&&!ids5.includes(amanha),'amanhã é pergunta nova');
// 6. Revisão do conteúdo: só o proprietário abre e decide, item a item. Depois de liberar, os outros só veem o aprovado.
email='com@example.com';assert.throws(()=>run('carregarRevisaoConteudoCPT()'),/exclusiva da administração técnica/);
ctx.p={id:'Q001',situacao:'aprovado',operacaoId:op()};assert.throws(()=>run('decidirConteudoCPT(p)'),/exclusiva da administração técnica/);
props.set('CPT_TRAVA_CONFIG','liberada');email='social@example.com';d=run('carregarMeuEspacoCPT()');
assert.equal(d.saber.curiosidade,null);assert.equal(d.saber.quiz.dia,null);assert.equal(d.saber.quiz.semana,null);assert.deepEqual(d.saber.mes.datas,[]);
assert.equal(books.get('agenda').getSheetByName('Revisão do conteúdo'),null,'ler as decisões não cria a aba');
email='victor@example.com';let rv=run('carregarRevisaoConteudoCPT()');assert.equal(rv.itens.length,todos.length);assert.equal(rv.resumo.pendente,todos.length);
assert.ok(rv.itens.find(x=>x.id==='C27').correcao,'mostra o que foi corrigido');const q1=rv.itens.find(x=>x.id==='Q001');assert.equal(q1.opcoes[q1.certa],'ODS 6');
const aprovar=['C01','Q001','Q002','Q007','Q017','Q018','Q019','Q020'];for(const id of aprovar){ctx.p={id,situacao:'aprovado',versao:0,operacaoId:op()};assert.match(run('decidirConteudoCPT(p)').resultado,/Aprovado/);}
ctx.p={id:'Q999',situacao:'aprovado',versao:0,operacaoId:op()};assert.throws(()=>run('decidirConteudoCPT(p)'),/não encontrado/);
ctx.p={id:'Q001',situacao:'talvez',versao:1,operacaoId:op()};assert.throws(()=>run('decidirConteudoCPT(p)'),/opção válida/);
ctx.p={id:'Q001',situacao:'suspenso',versao:0,operacaoId:op()};assert.throws(()=>run('decidirConteudoCPT(p)'),/Outra pessoa alterou/);
rv=run('carregarRevisaoConteudoCPT()');assert.equal(rv.resumo.aprovado,8);
email='social@example.com';d=run('carregarMeuEspacoCPT()');assert.equal(d.saber.curiosidade.id,'C01');assert.equal(d.saber.curiosidade.revisar,false);assert.ok(d.saber.curiosidade.importa);
assert.ok(aprovar.includes(d.saber.quiz.dia.pergunta.id));assert.equal(d.saber.quiz.semana.total,5);assert.equal(d.pontos.quiz,0,'pontos do proprietário não aparecem para os outros');
// Suspender tira o item de todos, até do proprietário; o que estava no quiz da semana e não foi respondido sai da lista.
let sq=d.saber.quiz.semana;ctx.p={tipo:'semana',escolha:0,id:sq.proxima.id,versao:0,operacaoId:op()};sq=run('responderQuizCPT(p)').estado.semana;const alvo=sq.proxima.id,feita=sq.respostas[0].id;
email='victor@example.com';ctx.p={id:alvo,situacao:'suspenso',nota:'conferir fonte',versao:1,operacaoId:op()};assert.match(run('decidirConteudoCPT(p)').resultado,/Suspenso/);
email='social@example.com';d=run('carregarMeuEspacoCPT()');assert.equal(d.saber.quiz.semana.total,4);assert.equal(d.saber.quiz.semana.respondidas,1);assert.notEqual(d.saber.quiz.semana.proxima.id,alvo);assert.equal(d.saber.quiz.semana.respostas[0].id,feita,'o que já foi respondido fica');
email='victor@example.com';assert.ok(!run(`new QuizCPT(AplicacaoCPT.identidade()).banco().map(q=>q.id)`).includes(alvo),'suspenso some até para o proprietário');
ctx.p={id:alvo,situacao:'pendente',versao:2,operacaoId:op()};assert.match(run('decidirConteudoCPT(p)').resultado,/Voltou/);
assert.ok(run(`new QuizCPT(AplicacaoCPT.identidade()).banco().map(q=>q.id)`).includes(alvo),'pendente volta para o proprietário');
props.delete('CPT_TRAVA_CONFIG');
console.log('PASS: revisão — só o proprietário abre e decide (item a item, com versão); suspenso some para todos; os outros só veem o aprovado depois de liberar.');
