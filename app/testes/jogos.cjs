// Joguinhos (2.21): forca e quebra-cabeça, metas, limite por dia e pontos conferidos no servidor. node app/testes/jogos.cjs
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
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','SocioambientalCPT','PerfisCPT','CronogramaCPT','AplicacaoCPT','ColecaoCPT','RecadosCPT','ComunicacaoCPT','PessoalCPT','ConteudoSaneamentoCPT','RevisaoConteudoCPT','QuizCPT','ObrasCPT','ObrasDoDiaCPT','CicloAtendimentoCPT','GaleriaCPT','AlbumCPT','JogosCPT','PlacarCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx))),op=()=>'OP-'+crypto.randomUUID();
const ini=jogo=>{ctx.p={jogo,operacaoId:op()};return run('iniciarJogoCPT(p)');},fim=(partida,o)=>{ctx.p={partida,...o,operacaoId:op()};return run('terminarJogoCPT(p)');};
const palavra=c=>c.map(n=>String.fromCharCode(n-7)).reverse().join(''),norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase();
const letrasDe=w=>[...new Set(norm(w).replace(/[^A-Z]/g,''))];
// 1. Trava de testes.
email='atd@example.com';assert.equal(run('carregarMeuEspacoCPT()').jogos,undefined);assert.throws(()=>ini('forca'),/reservado à administração técnica/);
// 2. Metas: forca com 5 dias de checklist pontuado.
email='victor@example.com';let d=run('carregarMeuEspacoCPT()');assert.equal(d.jogos.forca.liberado,false);assert.equal(d.jogos.quebra.liberado,false);
assert.throws(()=>ini('forca'),/libera com 5 dias de checklist \(você tem 0\)/);
for(let k=1;k<=5;k++){ctx.p={data:mais(-k),itens:[{id:'T-teste'+k,texto:'Tarefa',feito:true}],versao:0,operacaoId:op()};run('salvarChecklistCPT(p)');}
ctx.p={data:mais(3),itens:[{id:'T-futuro',texto:'Planejada',feito:true}],versao:0,operacaoId:op()};run('salvarChecklistCPT(p)');
d=run('carregarMeuEspacoCPT()');assert.equal(d.jogos.forca.tem,5,'dia futuro não conta');assert.equal(d.jogos.forca.liberado,true);const antes=d.pontos.saldo;
// 3. Forca: vence (+5), vence de novo (sem pontos), perde (mostra a palavra), limite de 3.
let r=ini('forca');const p1=r.partida;assert.equal(p1.palavra,undefined,'palavra não vai em texto');assert.ok(p1.dica&&p1.codigo.length);
assert.equal(ini('forca').partida.id,p1.id,'abrir de novo continua a mesma partida');
const w1=palavra(p1.codigo);assert.ok(run('JogosCPT.palavras').some(x=>x[0]===w1));
assert.throws(()=>fim(p1.id,{letras:['A','A']}),/Jogada inválida/);
r=fim(p1.id,{letras:letrasDe(w1)});assert.equal(r.situacao,'venceu');assert.equal(r.pontosGanhos,5);assert.equal(r.pontos.jogos,5);assert.equal(r.pontos.saldo,antes+5);
assert.throws(()=>fim(p1.id,{letras:letrasDe(w1)}),/já terminou/);
const p2=ini('forca').partida,w2=palavra(p2.codigo);assert.notEqual(w2,w1,'palavra nova');
// erros antes de completar contam: 6 letras erradas primeiro = perdeu, mesmo que as certas venham depois
const erradas=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter(l=>!letrasDe(w2).includes(l)).slice(0,6);
r=fim(p2.id,{letras:erradas.concat(letrasDe(w2)).slice(0,26)});assert.equal(r.situacao,'perdeu');assert.equal(r.palavra,w2);assert.match(r.resultado,/a palavra era/);
const p3=ini('forca').partida;r=fim(p3.id,{letras:letrasDe(palavra(p3.codigo))});assert.equal(r.situacao,'venceu');assert.equal(r.pontosGanhos,0,'só a primeira vitória do dia pontua');
assert.throws(()=>ini('forca'),/já jogou 3 partidas hoje/);
console.log('PASS: forca — libera com 5 dias de checklist pontuado, palavra só em código, servidor refaz as letras (6 erros antes de completar = perdeu), 1ª vitória do dia +5, limite de 3.');
// 4. Quebra-cabeça: 10 favoritas; servidor refaz as trocas.
assert.throws(()=>ini('quebra'),/10 fotos favoritadas no Álbum \(você tem 0\)/);
vm.runInContext(`(()=>{const c=new ColecaoCPT(AplicacaoCPT.identidade(),'Álbum','ALB');for(let i=0;i<11;i++)c.gravar({fileId:'FOTOALBUM'+String(i).padStart(12,'0'),ativo:i<10,dia:'2026-09-0'+(i%9+1),legenda:'Foto '+i},0,'OP-album-teste-'+i,'ALB-victor@example.com-FOTOALBUM'+String(i).padStart(12,'0'));})()`,ctx);
d=run('carregarMeuEspacoCPT()');assert.equal(d.jogos.quebra.tem,10,'favorita desmarcada não conta para a meta');
const q=ini('quebra').partida;assert.equal(q.ordem.length,9);assert.ok(!q.ordem.every((v,i)=>v===i),'nunca começa resolvido');assert.match(q.foto.fileId,/^FOTOALBUM/);
const resolver=o=>{o=o.slice();const t=[];for(let i=0;i<9;i++){const j=o.indexOf(i);if(j!==i){t.push([i,j]);[o[i],o[j]]=[o[j],o[i]];}}return t;};
assert.throws(()=>fim(q.id,{trocas:[[0,9]]}),/Jogada inválida/);
r=fim(q.id,{trocas:resolver(q.ordem)});assert.equal(r.situacao,'venceu');assert.equal(r.pontosGanhos,5);assert.equal(r.pontos.jogos,10);
const q2=ini('quebra').partida;r=fim(q2.id,{trocas:[]});assert.equal(r.situacao,'perdeu','sem resolver não vence');
console.log('PASS: quebra-cabeça — libera com 10 favoritas, foto do álbum da equipe, servidor refaz as trocas, 1ª vitória do dia +5.');
// 5. Privacidade: ninguém termina a partida de outra pessoa; pontos de jogo são de cada conta.
props.set('CPT_TRAVA_CONFIG','liberada');const q3=ini('quebra').partida;email='com@example.com';
assert.throws(()=>fim(q3.id,{trocas:resolver(q3.ordem)}),/Partida não encontrada/);assert.equal(run('carregarMeuEspacoCPT()').pontos.jogos,0);props.delete('CPT_TRAVA_CONFIG');
console.log('PASS: privacidade — partida e pontos dos joguinhos são de cada conta.');
// 6. Placar da equipe (2.23): só totais da equipe na semana, iguais para todos, sem nomes.
email='atd@example.com';assert.equal(run('carregarMeuEspacoCPT()').placar,undefined,'equipe não vê o placar nos testes');
email='victor@example.com';const pl=run('carregarMeuEspacoCPT()').placar;
assert.equal(pl.vitorias,3,'forca (2) e quebra-cabeça (1) vencidos hoje');assert.equal(pl.pontos-pl.tarefas*10,10,'vitórias com pontos somam 5 cada; nada de quiz nesta semana');
assert.equal(pl.historico.length,4);assert.ok(pl.historico[3].atual);assert.equal(pl.historico[3].pontos,pl.pontos);assert.equal(pl.meta,400);
props.set('CPT_TRAVA_CONFIG','liberada');email='com@example.com';const pl2=run('carregarMeuEspacoCPT()').placar;props.delete('CPT_TRAVA_CONFIG');
assert.deepEqual(pl2,pl,'o placar é o mesmo para todos');
const txt=JSON.stringify(pl);for(const e of ['victor','com@','Victor','Paula','atd@'])assert.ok(!txt.includes(e),'placar não mostra pessoas: '+e);
console.log('PASS: placar da equipe — só o proprietário nos testes, totais da semana (tarefas, acertos, vitórias, fotos) e 4 semanas, igual para todos, sem nomes.');
