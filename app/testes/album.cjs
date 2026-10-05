// Álbum da equipe (2.20): favoritas (2 por dia), álbum do mês e Fotos da semana, com serviços Google simulados. node app/testes/album.cjs
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
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','SocioambientalCPT','PerfisCPT','CronogramaCPT','AplicacaoCPT','ColecaoCPT','RecadosCPT','ComunicacaoCPT','PessoalCPT','ConteudoSaneamentoCPT','RevisaoConteudoCPT','QuizCPT','ObrasCPT','ObrasDoDiaCPT','RelatorioMensalCPT','CicloAtendimentoCPT','GaleriaCPT','AlbumCPT','JogosCPT','PlacarCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx))),op=()=>'OP-'+crypto.randomUUID();
registros.rows.push(reg(4,'2026-09-10','Mutirão de limpeza',[{titulo:'Fotos',tipo:'FILE_UPLOAD',valor:[foto('FOTOSET0000000000000000003')]}]));
const F1='FOTOSET0000000000000000001',F2='FOTOSET0000000000000000002',F3='FOTOSET0000000000000000003',VID='VIDEOSET000000000000000001';
const fav=(fileId,ativo,mes='2026-09')=>{ctx.p={fileId,ativo,mes,operacaoId:op()};return run('favoritarAlbumCPT(p)');};
// 1. Trava de testes: só o proprietário.
email='atd@example.com';assert.throws(()=>run("carregarAlbumCPT({mes:'2026-09'})"),/reservado à administração técnica/);assert.throws(()=>fav(F1,true),/reservado à administração técnica/);
assert.equal(books.get('agenda').getSheetByName('Álbum'),null,'ninguém além do proprietário cria a aba');
// 2. Proprietário: fotos do mês sem vídeo; 2 favoritas por dia; desmarcar libera a vaga de hoje.
email='victor@example.com';let d=run("carregarAlbumCPT({mes:'2026-09'})");
assert.deepEqual(d.fotos.map(f=>f.fileId).sort(),[F1,F2,F3].sort(),'só fotos do mês, sem vídeo e sem repetir');assert.equal(d.usadasHoje,0);assert.deepEqual(d.album,[]);
assert.throws(()=>fav(VID,true),/não está na galeria/);assert.throws(()=>fav('FOTOAGOSTO000000000000001',true),/não está na galeria/,'foto de outro mês não entra pelo mês errado');
assert.throws(()=>fav('../x',true),/Foto inválida/);
let r=fav(F1,true);assert.equal(r.meu,true);assert.equal(r.coracoes,1);assert.equal(r.usadasHoje,1);assert.throws(()=>fav(F1,true),/já está nas suas favoritas/);
ctx.p={fileId:F2,ativo:true,mes:'2026-09',operacaoId:op()};const opRep={...ctx.p};assert.equal(run('favoritarAlbumCPT(p)').usadasHoje,2);ctx.p=opRep;assert.equal(run('favoritarAlbumCPT(p)').usadasHoje,2,'mesma operação não grava de novo');
fav(F2,false);
r=fav(F2,true);assert.equal(r.usadasHoje,2);assert.throws(()=>fav(F3,true),/já escolheu 2 favoritas hoje/);
r=fav(F2,false);assert.equal(r.meu,false);assert.equal(r.usadasHoje,1);r=fav(F3,true);assert.equal(r.usadasHoje,2,'desmarcar a de hoje liberou a vaga');
assert.throws(()=>fav(F2,false),/já não está/);
console.log('PASS: favoritas — só o proprietário nos testes, só fotos da galeria do mês (sem vídeo), 2 por dia, desmarcar a de hoje libera a vaga.');
// 3. Álbum da equipe e Fotos da semana: destaque das fotos, sem dizer quem favoritou.
props.set('CPT_TRAVA_CONFIG','liberada');
email='com@example.com';fav(F1,true);email='atd@example.com';fav(F1,true);fav(F3,true);
d=run("carregarAlbumCPT({mes:'2026-09'})");assert.equal(d.usadasHoje,2);
assert.deepEqual(d.semana.fotos.map(f=>[f.fileId,f.coracoes]),[[F1,3],[F3,2]],'mais favoritadas da semana primeiro');
assert.deepEqual(d.album.map(f=>f.fileId),[F1,F3]);assert.ok(d.album.every(f=>f.meu),'atd marcou as duas');
const txt=JSON.stringify(d);for(const e of ['victor@example.com','com@example.com','Paula','Victor'])assert.ok(!txt.includes(e),'álbum não diz quem favoritou: '+e);
email='social@example.com';d=run("carregarAlbumCPT({mes:'2026-09'})");assert.ok(d.album.every(f=>!f.meu));assert.equal(d.fotos.find(f=>f.fileId===F1).coracoes,3);
assert.deepEqual(run("carregarAlbumCPT({mes:'2026-08'})").album,[],'álbum do mês só com fotos do mês');
props.delete('CPT_TRAVA_CONFIG');
console.log('PASS: álbum da equipe — todos veem o álbum do mês e as Fotos da semana (mais favoritadas primeiro), sem nomes de quem favoritou.');
