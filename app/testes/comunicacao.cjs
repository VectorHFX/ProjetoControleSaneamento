// Recados, Contatos, Lembretes, Materiais e Galeria com serviços Google simulados. node app/testes/comunicacao.cjs
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
const arquivo=(id,mime)=>({getId:()=>id,getMimeType:()=>mime,getSize:()=>1000,getName:()=>id+'.jpg',getBlob:()=>({setName(n){this.n=n;return this},getName(){return this.n}}),getThumbnail:()=>({getContentType:()=>'image/jpeg',getBytes:()=>[1,2,3]})});
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
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','SocioambientalCPT','PerfisCPT','CronogramaCPT','ObrasCPT','ObrasDoDiaCPT','CicloAtendimentoCPT','AplicacaoCPT','ColecaoCPT','RecadosCPT','ContatosCPT','ComunicacaoCPT','GaleriaCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx))),op=()=>'OP-'+crypto.randomUUID();

// 1. Recados: só quem envia e quem recebe veem; leitura por pessoa; resposta reabre a leitura dos outros; idempotência.
email='social@example.com';ctx.p={para:{frentes:['comunicacao'],pessoas:[]},assunto:'Fotos da oficina',texto:'Separa 6 fotos?',operacaoId:op(),vinculo:{tipo:'registro',id:'REG-1',titulo:'Oficina',url:''}};
assert.throws(()=>run("enviarRecadoCPT({para:{frentes:[],pessoas:[]},assunto:'x',texto:'y',operacaoId:'"+op()+"'})"),/para quem vai/);
assert.throws(()=>run("enviarRecadoCPT({para:{frentes:[],pessoas:['estranho@x.com']},assunto:'x',texto:'y',operacaoId:'"+op()+"'})"),/frentes e pessoas da lista/);
const r1=run('enviarRecadoCPT(p)').recado;assert.equal(run('enviarRecadoCPT(p)').recado.id,r1.id,'mesma operação não duplica');assert.equal(books.get('agenda').getSheetByName('Recados').rows.length,2);
email='atd@example.com';assert.equal(run('listarRecadosCPT()').itens.length,0,'atendimento não vê recado da comunicação');assert.throws(()=>run("agirRecadoCPT({id:'"+r1.id+"',acao:'lido'})"),/não encontrado/);
email='com@example.com';let l=run('listarRecadosCPT()');assert.equal(l.itens.length,1);assert.equal(l.naoLidos,1);assert.equal(run('contarAvisosCPT()').recados,1);
run("agirRecadoCPT({id:'"+r1.id+"',acao:'lido'})");assert.equal(run('contarAvisosCPT()').recados,0);
email='com2@example.com';assert.equal(run('contarAvisosCPT()').recados,1,'leitura é por pessoa');
email='com@example.com';run("agirRecadoCPT({id:'"+r1.id+"',acao:'responder',texto:'Separo hoje.',operacaoId:'"+op()+"'})");
email='social@example.com';assert.equal(run('contarAvisosCPT()').recados,0,'quem enviou não conta como destinatário');let x=run('listarRecadosCPT()').itens[0];assert.equal(x.respostas.length,1);assert.equal(x.meu,true);
email='com2@example.com';run("agirRecadoCPT({id:'"+r1.id+"',acao:'resolver'})");email='com@example.com';assert.equal(run('contarAvisosCPT()').recados,0,'resolvido sai dos avisos');
console.log('PASS: recados — destinatário obrigatório e da lista, visível só a quem envia e recebe, leitura por pessoa, resposta e resolução, idempotência.');

// 2. Contatos: todos cadastram; edição pelo autor/Comunicação/Gestão; duplicado avisado; conversa registrada por qualquer um.
email='atd@example.com';ctx.c={nome:'Dona Maria',instituicao:'Associação de moradores',tipo:'Liderança comunitária',telefone:'11 98888-7777',email:'',operacaoId:op()};
const c1=run('salvarContatoCPT(c)').contato;assert.equal(c1.podeEditar,true);
ctx.c={...ctx.c,operacaoId:op()};assert.throws(()=>run('salvarContatoCPT(c)'),/Já existe/);
email='social@example.com';ctx.e={...c1,observacao:'x',versao:c1.versao,operacaoId:op()};assert.throws(()=>run('salvarContatoCPT(e)'),/editado por quem criou/);
run("registrarConversaContatoCPT({id:'"+c1.id+"',data:'2026-09-10',canal:'Telefone',texto:'Combinou reunião.',operacaoId:'"+op()+"'})");
email='com@example.com';ctx.e={...c1,observacao:'Prefere WhatsApp',versao:1,operacaoId:op()};assert.throws(()=>run('salvarContatoCPT(e)'),/Outra pessoa alterou/);
ctx.e.versao=2;const c2=run('salvarContatoCPT(e)').contato;assert.equal(c2.observacao,'Prefere WhatsApp');assert.equal(c2.registros.length,1,'edição não apaga conversas');assert.equal(c2.criadoPor,'atd@example.com');
assert.throws(()=>run("salvarContatoCPT({nome:'',instituicao:'',tipo:'Outro',operacaoId:'"+op()+"'})"),/nome da pessoa ou a instituição/);
console.log('PASS: contatos — todos cadastram, edição restrita, duplicado avisado, conflito de versão, conversas preservadas na edição.');

// 3. Lembretes (2.30: tarefas "para quem", todo o time) e materiais (Comunicação); resumo do mês.
email='atd@example.com';assert.deepEqual(run("ColecaoCPT.executar('lembretes.listar',ctx=>new LembretesCPT(ctx).listar())").itens,[],'todo o time usa; só vê os seus');const ma=run('listarMateriaisCPT()');assert.equal(ma.podeEditar,false,'2.29: todo o time vê os materiais');assert.throws(()=>run("salvarMaterialCPT({titulo:'x',tipo:'Outro',situacao:'afazer',operacaoId:'"+op()+"'})"),/Comunicação e da Gestão/);
email='social@example.com';ctx.l={tipo:'material',titulo:'Levar panfletos',data:hoje,material:'200 panfletos',frentes:['comunicacao','x'],operacaoId:op(),evento:{id:'AG-1',titulo:'Ação na escola',data:mais(2)}};
const l1=run('salvarLembreteCPT(l)').lembrete;assert.deepEqual(l1.frentes,['comunicacao']);
run("salvarLembreteCPT({tipo:'acao',titulo:'Divulgar',data:'"+mais(-2)+"',frentes:['comunicacao'],operacaoId:'"+op()+"'})");run("salvarLembreteCPT({tipo:'acao',titulo:'Depois',data:'"+mais(20)+"',frentes:['comunicacao'],operacaoId:'"+op()+"'})");
assert.throws(()=>run("salvarLembreteCPT({titulo:'Sem destino',data:'"+hoje+"',operacaoId:'"+op()+"'})"),/para quem é a tarefa/);
assert.throws(()=>run("salvarLembreteCPT({tipo:'acao',titulo:'',data:'"+hoje+"',operacaoId:'"+op()+"'})"),/tarefa/);
email='atd@example.com';assert.equal(run('contarAvisosCPT()').lembretes,0,'não é da Comunicação');email='com@example.com';assert.equal(run('contarAvisosCPT()').lembretes,2,'hoje + atrasado');
run("ColecaoCPT.executar('lembretes.concluir',ctx=>new LembretesCPT(ctx).concluir({id:'"+l1.id+"',operacaoId:'"+op()+"'}),true)");assert.equal(run('contarAvisosCPT()').lembretes,1);
email='social@example.com';assert.equal(run('listarMateriaisCPT()').podeEditar,false);
email='com@example.com';
assert.throws(()=>run("salvarMaterialCPT({titulo:'Post',tipo:'Publicação em rede social',url:'javascript:alert(1)',operacaoId:'"+op()+"'})"),/https/);
assert.throws(()=>run("salvarMaterialCPT({titulo:'Post',tipo:'Publicação em rede social',alcance:'muita',operacaoId:'"+op()+"'})"),/números inteiros/);
run("salvarMaterialCPT({titulo:'Post da obra',tipo:'Publicação em rede social',situacao:'concluido',publicadoEm:'2026-09-15',alcance:'1.200',canal:'Instagram',operacaoId:'"+op()+"'})");
run("salvarMaterialCPT({titulo:'Matéria no jornal',tipo:'Matéria na mídia (jornal, rádio, TV, site)',situacao:'concluido',publicadoEm:'2026-09-20',operacaoId:'"+op()+"'})");
run("salvarMaterialCPT({titulo:'Panfleto',tipo:'Material impresso',situacao:'concluido',publicadoEm:'2026-09-21',quantidade:'500',operacaoId:'"+op()+"'})");
run("salvarMaterialCPT({titulo:'Vídeo outubro',tipo:'Vídeo',situacao:'concluido',publicadoEm:'2026-10-01',operacaoId:'"+op()+"'})");
run("salvarMaterialCPT({titulo:'Banner da feira',tipo:'Arte / peça digital',situacao:'producao',prazo:'"+mais(3)+"',url:'https://www.canva.com/x',operacaoId:'"+op()+"'})");
const m=run("listarMateriaisCPT('2026-09')");assert.equal(m.resumo.publicacoes,2);assert.equal(m.resumo.alcance,1200);assert.equal(m.resumo.semAlcance,1);assert.equal(m.resumo.impressos,500);assert.equal(m.resumo.videos,0);assert.equal(m.resumo.ferramentas,1);
assert.equal(m.itens[0].situacao,'producao','em aberto primeiro');
console.log('PASS: lembretes como tarefas "para quem" (todo o time cria; destino obrigatório; avisos de hoje e atrasados só para quem recebe; feito), materiais com link seguro, números validados e resumo do mês só com concluídos pela data de publicação.');

// 4. (2.29: a página "Hoje" da Comunicação saiu.)
email='social@example.com';run("enviarRecadoCPT({para:{frentes:[],pessoas:['com@example.com']},assunto:'Banner',texto:'Pode ser amanhã?',operacaoId:'"+op()+"'})");

// 5. Galeria: fotos do mês pelos registros (sem repetir), extras com envio idempotente, pacote só com fotos da galeria.
email='atd@example.com';assert.equal(run("listarGaleriaCPT({mes:'2026-09'})").podeEnviar,false,'2.29: todo o time vê a galeria; enviar não');assert.throws(()=>run("enviarFotoGaleriaCPT({data:'2026-09-07',atividade:'x',mime:'image/jpeg',base64:'AA==',operacaoId:'"+op()+"'})"),/Comunicação, do Socioambiental/);
// Formato real do Formulário 4.0 (2.13.1): foto como código puro do arquivo, lista de anexos (arquivoId) e detalhes guardados num arquivo à parte.
const regBruto=(i,data,ativ,detalhes)=>{const r=reg(i,data,ativ,[]);r[20]=JSON.stringify(detalhes);return r;};
registros.rows.push(regBruto(7,'2026-09-08','Plantão 4.0',{campos:[{titulo:'Fotos da atividade',tipo:'FILE_UPLOAD',valor:['FOTO40CODIGOPURO0000000001']}]}),
  regBruto(8,'2026-09-09','Anexos 4.0',{campos:[],anexos:[{perguntaId:1,arquivoId:'FOTO40ANEXO000000000000001',url:'https://drive.google.com/file/d/FOTO40ANEXO000000000000001/view'}]}),
  regBruto(9,'2026-09-10','Detalhes grandes',{arquivoDetalhesId:'DETALHESJSON00000000000001'}));
['FOTO40CODIGOPURO0000000001','FOTO40ANEXO000000000000001','FOTO40ARQUIVO0000000000001'].forEach(id=>arquivos.set(id,arquivo(id,'image/jpeg')));
arquivos.set('DETALHESJSON00000000000001',{getId:()=>'DETALHESJSON00000000000001',getMimeType:()=>'text/plain',getBlob:()=>({getDataAsString:()=>JSON.stringify({campos:[{titulo:'Fotos',tipo:'FILE_UPLOAD',valor:['FOTO40ARQUIVO0000000000001']}]})})});
email='com@example.com';let g=run("listarGaleriaCPT({mes:'2026-09'})");
assert.deepEqual(g.itens.map(i=>i.fileId).sort(),['FOTO40ANEXO000000000000001','FOTO40ARQUIVO0000000000001','FOTO40CODIGOPURO0000000001','FOTOSET0000000000000000001','FOTOSET0000000000000000002','VIDEOSET000000000000000001'],'fotos do 4.0 (código puro, anexos e detalhes em arquivo) entram na galeria');
assert.equal(g.itens.find(i=>i.fileId==='VIDEOSET000000000000000001').video,true);
// 2.26.5: miniatura pela conta da aplicação para quem não tem leitura na pasta — só arquivos da galeria do mês, até 12.
['FOTOSET0000000000000000001','FOTOSET0000000000000000002','VIDEOSET000000000000000001','ARQUIVOFORA00000000000001'].forEach(id=>{if(!arquivos.has(id))arquivos.set(id,arquivo(id,id.startsWith('VIDEO')?'video/mp4':'image/jpeg'));});
ctx.m={mes:'2026-09',ids:['FOTOSET0000000000000000001','VIDEOSET000000000000000001','ARQUIVOFORA00000000000001','x']};const gm=run('miniaturasGaleriaCPT(m)').miniaturas;
assert.deepEqual(Object.keys(gm).sort(),['FOTOSET0000000000000000001','VIDEOSET000000000000000001'],'só arquivos da galeria do mês');assert.equal(gm.FOTOSET0000000000000000001,'data:image/jpeg;base64,AQID');
email='atd@example.com';assert.deepEqual(Object.keys(run('miniaturasGaleriaCPT(m)').miniaturas).sort(),Object.keys(gm).sort(),'2.29: todo o time vê as miniaturas da galeria');email='com@example.com';assert.equal(g.itens[0].legenda.split(' - ')[0].length,10);
ctx.f={data:'2026-09-07',atividade:'Feira de saúde',local:'Praça',mime:'image/jpeg',base64:Buffer.from('foto').toString('base64'),operacaoId:op()};
const e1=run('enviarFotoGaleriaCPT(f)');assert.equal(e1.item.legenda,'07/09/2026 - Feira de saúde - Praça');run('enviarFotoGaleriaCPT(f)');assert.equal(criados,1,'repetir o envio não cria outro arquivo');
assert.throws(()=>run("enviarFotoGaleriaCPT({data:'2026-09-07',atividade:'x',mime:'video/mp4',base64:'AA==',operacaoId:'"+op()+"'})"),/JPG, PNG ou WEBP/);
assert.throws(()=>run("enviarFotoGaleriaCPT({data:'2026-09-07',atividade:'x',link:'https://drive.google.com/file/d/NAOEXISTE00000000000000/view',operacaoId:'"+op()+"'})"),/não consegue abrir/);
g=run("listarGaleriaCPT({mes:'2026-09'})");assert.equal(g.itens.length,7,'6 fotos de registros (3 antigas + 3 no formato 4.0) e 1 extra');assert.ok(g.itens.some(x=>x.origem==='Extra'&&x.fileId===e1.item.fileId),'extra na galeria');assert.equal(g.itens[0].data,'2026-09-10','mais recentes primeiro');
const z=run("baixarPacoteGaleriaCPT({mes:'2026-09',ids:['FOTOSET0000000000000000001','"+e1.item.fileId+"']})");assert.match(z.nome,/Fotos 2026-09\.zip/);assert.match(z.legendas,/01 - 05\/09\/2026 - Oficina de horta/);
assert.throws(()=>run("baixarPacoteGaleriaCPT({mes:'2026-09',ids:['FOTOAGOSTO000000000000001']})"),/não pertence/);
assert.throws(()=>run("baixarPacoteGaleriaCPT({mes:'2026-09',ids:['VIDEOSET000000000000000001']})"),/Vídeos/);
console.log('PASS: galeria — fotos e vídeos dos registros do mês sem repetição, legenda no padrão do relatório, envio idempotente e só de imagens, pacote .zip apenas com arquivos da galeria do mês.');

assert.equal(locked,false);
