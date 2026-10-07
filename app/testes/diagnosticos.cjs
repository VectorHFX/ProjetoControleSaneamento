// Diagnósticos como na Central CPT 4.0 (2.47) com base, Drive, Docs e Slides simulados e dados fictícios: lista para toda a
// equipe com a situação da revisão; agrupamento por obra (consulta) pelo Obra ID, nome de uso e apelido; vínculo da gerência;
// índice e cache; revisão (versões, conflito, "Revisado" só da gerência, fotos do próprio registro, até 12); ficha Sabesp
// (modelo oficial conferido e só preenchido) e apresentação no desenho da Central, cada uma com PDF, na pasta do mês;
// gerar de novo guarda a anterior; registro mudou no campo → não gera até salvar de novo; missões. node app/testes/diagnosticos.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
let email='social@example.com',locked=false,leiturasDetalhe=0;
const pessoa=(e,n,p)=>['CPT_PESSOA:'+e,JSON.stringify({email:e,nome:n,papeis:p,ativo:true,versao:1})];
const props=new Map([['CPT_APLICACAO_1',JSON.stringify({baseId:'base',administrador:'victor@example.com',agendaId:'agenda-0123456789',versao:'2.46.0'})],['CPT_TRAVA_CONFIG','liberada'],
  pessoa('social@example.com','Social Fictícia',['socioambiental']),pessoa('atd@example.com','Atd Fictícia',['atendimento']),pessoa('gestao@example.com','Gestão Fictícia',['gestao'])]);
const fmt=(d,_,f)=>{const s=new Date(d.getTime()-3*3600e3).toISOString();return f.replace('yyyy',s.slice(0,4)).replace('MM',s.slice(5,7)).replace('dd',s.slice(8,10)).replace('HH',s.slice(11,13)).replace('mm',s.slice(14,16));};
class Sheet{constructor(n,rows=[]){this.name=n;this.rows=rows;}getName(){return this.name}getLastRow(){return this.rows.length}getMaxColumns(){return 40}setFrozenRows(){}appendRow(r){this.rows.push(r)}
  getRange(r,c,n=1,m=1){const s=this;if(s.name==='Registros'&&c===21)leiturasDetalhe++;let px;const api={getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.rows[r+i-1]?.[c+j-1]??'')),getValue:()=>api.getValues()[0][0],
    setValues:v=>{v.forEach((row,i)=>{while(s.rows.length<r+i)s.rows.push([]);row.forEach((x,j)=>s.rows[r+i-1][c+j-1]=x)});return px}};px=new Proxy(api,{get:(t,k)=>k in t?t[k]:()=>px});return px;}}
class Book{constructor(id,sheets){this.id=id;this.sheets=sheets}getId(){return this.id}getSheetByName(n){return this.sheets.find(s=>s.name===n)||null}insertSheet(n){const a=new Sheet(n);this.sheets.push(a);return a}getSpreadsheetTimeZone(){return 'America/Sao_Paulo'}}
// ---- Docs simulado (documento criado do zero): lista de {tipo:'P',texto,heading} | {tipo:'T',linhas} | {tipo:'Q'} ----
const docs=new Map();let seq=0;const novoId=p=>p+String(++seq).padStart(24,'0');
const chain=o=>new Proxy(o,{get:(t,k)=>k in t?t[k]:()=>chain(o)});
function tabela(rows){const e={tipo:'T',linhas:rows.map(r=>r.map(v=>({texto:String(v),imagens:[]})))};
  const cel=x=>chain({getChild:()=>chain({asParagraph:()=>chain({appendInlineImage:b=>{x.imagens.push(b.nome);return chain({getWidth:()=>800,getHeight:()=>600});}})}),setText:t=>{x.texto=t;return cel(x);}});
  e.api=chain({getNumRows:()=>e.linhas.length,getRow:r=>chain({getNumCells:()=>e.linhas[r].length,getCell:c=>cel(e.linhas[r][c])}),getCell:(r,c)=>cel(e.linhas[r][c])});return e;}
function corpoNovo(lista){
  const par=e=>chain({setHeading:h=>{e.heading=h;return par(e);},getType:()=>'PARAGRAPH',asParagraph:()=>chain({getText:()=>e.texto}),removeFromParent:()=>{lista.splice(lista.indexOf(e),1);}});
  return chain({appendParagraph:t=>{const e={tipo:'P',texto:t};lista.push(e);return par(e);},appendTable:rows=>{assert.ok(rows.every(r=>r.every(v=>typeof v==='string')),'células só com texto');const e=tabela(rows);lista.push(e);return e.api;},
    appendPageBreak:()=>{lista.push({tipo:'Q'});return chain({});},getChild:i=>par(lista[i])});
}
// ---- Drive simulado ----
const pastas=new Map(),arquivos=new Map();
const pasta=(nome,pai)=>{const id=novoId('PASTA');const f={id,nome,pai,getId:()=>id,createFile:b=>arq(novoId('PDF'),b.nome,id,'application/pdf'),getFoldersByName:n=>{const l=[...pastas.values()].filter(x=>x.pai===id&&x.nome===n);let i=0;return {hasNext:()=>i<l.length,next:()=>l[i++]};},createFolder:n=>pasta(n,id)};pastas.set(id,f);return f;};
const arq=(id,nome,pai,mime='image/jpeg',conteudo='')=>{const a={id,nome,pai,mime,getMimeType:()=>a.mime,getSize:()=>1000,getBlob:()=>({nome:a.nome,getDataAsString:()=>conteudo}),getThumbnail:()=>({nome:'thumb-'+a.nome}),moveTo:p=>{a.pai=p.getId();},getId:()=>id,getName:()=>a.nome,
  getAs:t=>{const b={nome:a.nome+'.pdf',de:id,setName:n=>{b.nome=n;return b;}};return b;},makeCopy:(n,p)=>{const novo=novoId('DOC');docs.set(novo,{id:novo,nome:n,tabela:modeloTabela(),salvo:false});return arq(novo,n,p.getId(),'application/vnd.google-apps.document');}};arquivos.set(id,a);return a;};
// ---- Modelo oficial DIAGNÓSTICO LOCAL simulado: uma tabela de 23 linhas × 6 células com os rótulos no lugar ----
let rotulos=null;const modeloTabela=extra=>{const linhas=Array.from({length:23},(_,r)=>Array.from({length:6},(_,c)=>(rotulos[r]||[])[c]||''));if(extra)linhas[10][5]='TEXTO DO EXEMPLO';
  return {linhas,getNumRows:()=>23,getRow:r=>({getNumCells:()=>6,getCell:c=>({getText:()=>linhas[r][c],editAsText:()=>({setText:t=>{linhas[r][c]=t;}})})})};};
const MODELO='MODELO'+'m'.repeat(30);
// ---- Slides simulado: cada slide guarda os textos e as imagens ----
const decks=new Map();
const slidesApp={PredefinedLayout:{BLANK:'b'},ShapeType:{RECTANGLE:'r'},create:n=>{const id=novoId('SLD'),deck={id,nome:n,slides:[{velho:true}],salvo:false};decks.set(id,deck);arq(id,n,null,'application/vnd.google-apps.presentation');
  const forma=()=>chain({});return {getId:()=>id,getPageWidth:()=>720,getPageHeight:()=>405,getSlides:()=>deck.slides.filter(x=>x.velho).map(x=>({remove:()=>{deck.slides.splice(deck.slides.indexOf(x),1);}})),saveAndClose:()=>{deck.salvo=true;},
    appendSlide:()=>{const sl={textos:[],imagens:[]};deck.slides.push(sl);return chain({getBackground:()=>chain({}),insertShape:forma,insertTextBox:t=>{sl.textos.push(t);return chain({});},
      insertImage:b=>{sl.imagens.push(b.nome);return chain({getWidth:()=>800,getHeight:()=>600});}});}};}};
const caminho=id=>{const a=arquivos.get(id);const n=[];let p=a.pai;while(p&&pastas.has(p)){n.unshift(pastas.get(p).nome);p=pastas.get(p).pai;}return n.join('/');};
const F=k=>'FOTO'+k.repeat(26);['1','2','3','4','5'].forEach(k=>arq(F(k),'f'+k+'.jpg',null));// F('9') não existe (sem acesso)
// ---- base ----
const colReg=['ID','Procedimento','Data do procedimento','Mês','Carimbo do envio','Origem','ID legado','Bairro','Bairro ID','Obra de referência','Obra ID','Responsável','Área','Atividade','Público informado','Protocolo informado','Situação do vínculo','Pesquisa','Conferência dos campos','Hash','Detalhes JSON'];
const ID=i=>'REG-'+String(i).padStart(24,'a');
const campos=o=>Object.entries(o).map(([titulo,valor])=>({titulo,valor}));
const fotos=l=>({'Fotos do diagnóstico':l.map(x=>'https://drive.google.com/open?id='+F(x)).join(', ')});
const reg=(i,proc,dia,obra,obraId,c)=>[ID(i),proc,new Date(dia+'T15:00:00Z'),dia.slice(0,7),'','4.0','','Vila Linda','BAI-001',obra,obraId,'Pessoa da Equipe','Social','',  '','','','','','h'+i,typeof c==='string'?c:JSON.stringify({campos:campos(c)})];
const detalheArquivo=JSON.stringify({campos:campos({'Endereço completo':'Rua Dois, 200','Índice Paulista de Vulnerabilidade Social — IPVS':'Grupo 5 (alta)','Quantidade de Imóveis Residênciais no Traçado':'80'})});
arq('DETALHE'+'x'.repeat(24),'detalhes.json',null,'application/json',detalheArquivo);
const registros=new Sheet('Registros',[colReg,
  reg(1,'Diagnóstico de Área','2026-08-10','Coletor Tronco A [OBR-0001]','OBR-0001',{'Endereço completo':'Rua Um, 100','Relato do Diagnóstico':'Trecho residencial com comércio na esquina e calçadas estreitas.','Tipo de pavimento predominante':'Asfalto',
    'Tipo de calçadas predonimante':'','Existem escolas no traçado?':'Sim','Quantidade de escolas públicas no traçado':'2','Quantidade de UBS no traçado':'1','Perfil socioeconômico observado no território':'Classe média baixa',
    'Índice Paulista de Vulnerabilidade Social — IPVS':'Grupo 4 (média)','Quantidade de Imóveis Residênciais no Traçado':'120','Quantidade de Imóveis Comerciais no Traçado':'15','Pontos críticos observados':'Escola na esquina; ponto de ônibus',
    'Infraestrutura sanitária identificada no diagnóstico':'Rede coletora antiga','Observação final do procedimento':'Avisar a escola antes da obra.',...fotos(['1','9','2','3','4','5'])}),
  reg(2,'Diagnóstico de Área','2026-09-05','Coletor A','',JSON.stringify({arquivoDetalhesId:'DETALHE'+'x'.repeat(24)})),
  reg(3,'Diagnóstico de Área','2026-09-12','','',{'Título da frente de serviço':'Interceptor B','Endereço da frente':'Av. Três','Perfil socioeconômico observado no território':'Popular'}),
  reg(4,'Diagnóstico de Área','2026-09-20','Outra obra (ainda não cadastrada)','',{'Endereço completo':'Rua Quatro','Relato do Diagnóstico':'Viela sem calçada.'}),
  reg(5,'Diagnóstico de Área','2026-09-21','','',{'Relato do Diagnóstico':'Sem obra informada.'}),
  reg(6,'Relato de atividade','2026-09-21','Coletor Tronco A [OBR-0001]','OBR-0001',{'Relato da atividade':'Não é diagnóstico.'})]);
const linhaObra=(id,nome,bairros,situacao,nomeUso,apelidos)=>{const r=Array(37).fill('');r[0]=id;r[1]=nome;r[2]=bairros;r[3]=true;r[8]='Rua Um';r[19]=situacao;r[33]='Rua Um, trecho 1';r[35]=nomeUso;r[36]=apelidos;return r;};
const obras=new Sheet('Obras',[['ID da obra','Nome da obra / frente'],linhaObra('OBR-0001','Coletor Tronco A','Vila Linda','Em andamento','Coletor A',''),linhaObra('OBR-0002','Interceptor Ribeirão','Jardim','Paralisada','','Interceptor B'),linhaObra('OBR-0003','Rede C','Centro','Finalizada','','')]);
const books=new Map([['base',new Book('base',[registros,new Sheet('Atendimentos',[[]]),obras,new Sheet('Bairros',[['ID','Nome']])])],['agenda-0123456789',new Book('agenda-0123456789',[])]]),cacheMap=new Map();
const ctx={Date,console:{log(){},warn(){},error(){}},JSON,Session:{getActiveUser:()=>({getEmail:()=>email})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>Object.fromEntries(props),getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
  SpreadsheetApp:{openById:id=>{if(!books.has(id))throw Error('Não existe');return books.get(id)}},
  DriveApp:{getFileById:id=>{const a=arquivos.get(id);if(!a)throw Error('sem acesso');return a;},getFolderById:id=>{const f=pastas.get(id);if(!f)throw Error('sem pasta');return f;},createFolder:n=>pasta(n,null)},
  MimeType:{PDF:'application/pdf'},SlidesApp:slidesApp,
  DocumentApp:{openById:id=>{const d=docs.get(id);if(!d||!d.tabela)throw Error('sem doc');return {getId:()=>id,getBody:()=>({getTables:()=>d.tabelas||[d.tabela]}),saveAndClose:()=>{d.salvo=true;}};},create:n=>{const id=novoId('DOC'),d={id,nome:n,lista:[{tipo:'P',texto:''}],rodape:[],salvo:false};docs.set(id,d);arq(id,n,null,'application/vnd.google-apps.document');
      return {getId:()=>id,getBody:()=>corpoNovo(d.lista),addFooter:()=>chain({appendParagraph:t=>{d.rodape.push(t);return chain({});}}),saveAndClose:()=>{d.salvo=true;}};},
    ElementType:{PARAGRAPH:'PARAGRAPH'},HorizontalAlignment:{CENTER:'c'},ParagraphHeading:{TITLE:'t',HEADING1:'h1'}},
  CacheService:{getScriptCache:()=>({get:k=>cacheMap.get(k)||null,put:(k,v)=>cacheMap.set(k,v),remove:k=>cacheMap.delete(k)})},
  Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:fmt},LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},releaseLock:()=>locked=false})}};
vm.createContext(ctx);
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','SocioambientalCPT','PerfisCPT','ColecaoCPT','CicloAtendimentoCPT','FichaOficialCPT','AnexosCPT','ObrasCPT','ObrasDoDiaCPT','PaineisGestaoCPT','AplicacaoCPT','RelatosRelatorioCPT','DiagnosticosCPT','RelatosCPT','AlertasGestaoCPT','ControleContratoCPT','AtendimentoDiaCPT','MissoesCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx))),op=()=>'OP-'+crypto.randomUUID(),call=(f,p)=>{ctx.p={...p,operacaoId:op()};return run(f+'(p)');};
const listar=()=>run('listarDiagnosticosCPT()');
rotulos={0:['DIAGNÓSTICO LOCAL'],4:['INFORMAÇÕES DO ENTORNO DAS OBRAS'],5:['','','OBSERVAÇÕES']};
run('DiagnosticoOficialCPT.campos').forEach(([_,r,c,t])=>{rotulos[r]=rotulos[r]||[];rotulos[r][c]=t;});
docs.set(MODELO,{id:MODELO,nome:'MODELO',tabela:modeloTabela()});arq(MODELO,'MODELO',null,'application/vnd.google-apps.document');
{const c=JSON.parse(props.get('CPT_APLICACAO_1'));c.modeloDiagnosticoId=MODELO;props.set('CPT_APLICACAO_1',JSON.stringify(c));}

// 1. Toda a equipe consulta; agrupamento por Obra ID, nome de uso e apelido; "sem obra" à parte; relato fica de fora.
email='atd@example.com';let l=listar();
assert.equal(l.total,5);assert.equal(l.podeRevisar,false);assert.equal(l.podeVincular,false);assert.deepEqual(l.catalogo,[],'sem catálogo para quem não vincula');
assert.deepEqual(l.diagnosticos.map(x=>[x.id,x.situacao,x.obra]),[[ID(5),'sem',''],[ID(4),'sem','Outra obra (ainda não cadastrada)'],[ID(3),'sem','Interceptor Ribeirão'],[ID(2),'sem','Coletor A'],[ID(1),'sem','Coletor A']],'lista: mais recente primeiro, com a obra');
assert.deepEqual(l.obras.map(o=>[o.obraId,o.nome,o.total]),[['OBR-0002','Interceptor Ribeirão',1],['OBR-0001','Coletor A',2]],'por obra: mais recente primeiro; nome de uso');
assert.deepEqual(l.semObra.map(d=>d.id),[ID(5),ID(4)]);assert.equal(l.semObra[1].obraTexto,'Outra obra (ainda não cadastrada)');
const a1=l.obras[1];assert.equal(a1.primeiro,'2026-08-10');assert.equal(a1.ultimo,'2026-09-05');
assert.deepEqual(a1.linhas[0],{id:ID(1),data:'2026-08-10',trecho:'Rua Um, 100',ipvs:'Grupo 4 (média)',perfil:'Classe média baixa',residenciais:'120',comerciais:'15',escolas:'2',ubs:'1',pontos:'Escola na esquina; ponto de ônibus',responsavel:'Pessoa da Equipe',fotos:6});
assert.equal(a1.linhas[1].ipvs,'Grupo 5 (alta)','detalhes no arquivo à parte');assert.equal(a1.linhas[1].trecho,'Rua Dois, 200');
// 2. Cache: a segunda consulta não relê os detalhes; registro alterado relê.
const lidas=leiturasDetalhe;listar();assert.equal(leiturasDetalhe,lidas,'detalhes em cache');
assert.equal(books.get('agenda-0123456789').getSheetByName('Índice dos diagnósticos').rows.length,6,'índice gravado (cabeçalho + 5)');
cacheMap.clear();listar();assert.equal(leiturasDetalhe,lidas,'sem cache: o índice evita reler os detalhes');
registros.rows[4][19]='h4-novo';cacheMap.clear();listar();assert.equal(leiturasDetalhe,lidas+1,'registro alterado: só ele é relido');
// 3. Abrir: blocos com só os campos preenchidos.
let d=run(`abrirDiagnosticoCPT({id:'${ID(1)}'})`);
assert.deepEqual(d.campos.map(c=>c[0]),['Território','Equipamentos do entorno','Infraestrutura sanitária','População','Imóveis e pontos de atenção']);
assert.deepEqual(d.campos[0][1],[['Pavimento','Asfalto']],'calçadas vazia fica de fora');assert.equal(d.observacao,'Avisar a escola antes da obra.');assert.equal(d.fotos.length,6);assert.match(d.fotos[0].thumb,/thumbnail\?id=FOTO1/);
assert.throws(()=>run(`abrirDiagnosticoCPT({id:'REG-x'})`),/não encontrado/);assert.equal(d.revisao,undefined,'quem não revisa não recebe a revisão');
// 4. Vincular: só a gerência, só os sem obra; depois o diagnóstico entra na obra (a linha da base não muda).
assert.throws(()=>call('vincularDiagnosticoCPT',{registroId:ID(4),obraId:'OBR-0002'}),/Administrativo ou pela Gestão/);
email='gestao@example.com';l=listar();assert.equal(l.podeVincular,true);assert.deepEqual(l.catalogo.map(o=>o.id),['OBR-0001','OBR-0002','OBR-0003'],'finalizada por último');
assert.throws(()=>call('vincularDiagnosticoCPT',{registroId:ID(1),obraId:'OBR-0002'}),/já está numa obra/);
assert.throws(()=>call('vincularDiagnosticoCPT',{registroId:ID(5),obraId:'OBR-9999'}),/Obra não encontrada/);
let r=call('vincularDiagnosticoCPT',{registroId:ID(5),obraId:'OBR-0002'});assert.match(r.resultado,/vinculado a Interceptor Ribeirão/);
assert.equal(registros.rows[5][10],'','base intacta');
l=listar();assert.deepEqual(l.semObra.map(x=>x.id),[ID(4)]);assert.equal(l.obras.find(o=>o.obraId==='OBR-0002').total,2);
// 5. Revisar: sugestão do formulário, permissões, conflito, "Revisado" só da gerência, fotos do próprio registro.
email='atd@example.com';assert.throws(()=>call('salvarDiagnosticoCPT',{id:ID(1),titulo:'x',texto:'y',situacao:'rascunho'}),/Socioambiental, Comunicação, Gestão e Administrativo/);
email='social@example.com';d=run(`abrirDiagnosticoCPT({id:'${ID(1)}'})`);
assert.equal(d.revisao,null);assert.equal(d.sugestao.titulo,'Diagnóstico local: Coletor Tronco A');assert.equal(d.sugestao.texto,'Trecho residencial com comércio na esquina e calçadas estreitas.');
assert.equal(d.sugestao.oficiais.residencias,'120');assert.equal(d.sugestao.oficiais.ipvs,'Grupo 4 (média)');assert.equal(d.sugestao.oficiais.endereco,'Rua Um, 100');assert.equal(d.sugestao.oficiais.criticos,'Escola na esquina; ponto de ônibus');
assert.equal(d.camposFicha.length,24);assert.equal(d.limite,12);assert.equal(d.podeAprovar,false);assert.equal(d.campos[0][0],'Território','os blocos do registro continuam em campos');
const base={id:ID(1),titulo:'Diagnóstico local: Coletor A — Rua Um',texto:'Síntese revisada: trecho residencial, escola na esquina.',encaminhamentos:'Avisar a escola; tenda na praça.',oficiais:d.sugestao.oficiais,fotos:[{id:F('1'),legenda:'10/08/2026 - Rua Um - Diagnóstico'},{id:F('9'),legenda:''},{id:F('2'),legenda:'Fachadas'}]};
assert.throws(()=>call('salvarDiagnosticoCPT',{...base,situacao:'revisado',versao:0}),/Gestão ou o Administrativo/);
assert.throws(()=>call('salvarDiagnosticoCPT',{...base,situacao:'revisao',versao:0,fotos:[{id:'FOTO'+'z'.repeat(26)}]}),/não pertence/);
assert.throws(()=>call('salvarDiagnosticoCPT',{...base,situacao:'revisao',versao:0,texto:''}),/síntese/);
assert.throws(()=>call('gerarDocumentoDiagnosticoCPT',{id:ID(1),tipo:'ficha'}),/Salve a revisão/);
r=call('salvarDiagnosticoCPT',{...base,situacao:'revisao',versao:0});assert.match(r.resultado,/Revisão 1 salva \(Em revisão\)/);
assert.throws(()=>call('salvarDiagnosticoCPT',{...base,situacao:'revisao',versao:0}),/Outra pessoa salvou/);
assert.equal(listar().diagnosticos.find(x=>x.id===ID(1)).situacao,'revisao');
// Missões: gerência vê a aprovação; quem revisa vê os sem revisão.
const missoes=()=>run('missoesCPT()').missoes.filter(m=>/^diagnosticos-/.test(m.id));
assert.deepEqual(missoes().map(m=>[m.id,m.titulo]),[['diagnosticos-revisar','4 diagnósticos sem revisão']]);
email='gestao@example.com';assert.deepEqual(missoes().map(m=>[m.id,m.aba]),[['diagnosticos-aprovar','diagnosticos']]);
r=call('salvarDiagnosticoCPT',{...base,situacao:'revisado',versao:1});assert.match(r.resultado,/Revisão 2 salva \(Revisado\)/);assert.deepEqual(missoes(),[],'nada a aprovar');
email='social@example.com';assert.throws(()=>call('salvarDiagnosticoCPT',{...base,situacao:'revisado',versao:2}),/já foi aprovado/);
// 6. Ficha Sabesp: modelo conferido, cópia só preenchida, PDF, pasta do mês.
r=call('gerarDocumentoDiagnosticoCPT',{id:ID(1),tipo:'ficha'});assert.match(r.resultado,/Ficha Sabesp gerada \(Google Docs e PDF\) a partir da revisão 2/);
const fichaId=r.arquivos.ficha.doc.match(/\/d\/([A-Za-z0-9_-]+)/)[1],ficha=docs.get(fichaId);
assert.equal(caminho(fichaId),'CPT • Diagnósticos/2026/08 - agosto');assert.equal(arquivos.get(fichaId).nome,'10-08-2026 — Coletor A — Rua Um — FICHA SABESP');assert.equal(ficha.salvo,true);
const L=ficha.tabela.linhas;assert.equal(L[12][1],'120','IMÓVEIS RESIDENCIAIS');assert.equal(L[15][1],'Grupo 4 (média)','VULNERABILIDADE');assert.equal(L[1][3],'Não informado','PV INÍCIO vazio');assert.equal(L[0][0],'DIAGNÓSTICO LOCAL','rótulos intactos');
assert.equal(L[6][2],'Síntese revisada: trecho residencial, escola na esquina.\n\nPróximos passos\nAvisar a escola; tenda na praça.','OBSERVAÇÕES = síntese + próximos passos');
const pdfId=r.arquivos.ficha.pdf.match(/\/d\/([A-Za-z0-9_-]+)/)[1];assert.equal(arquivos.get(pdfId).nome,'10-08-2026 — Coletor A — Rua Um — FICHA SABESP.pdf');assert.equal(caminho(pdfId),'CPT • Diagnósticos/2026/08 - agosto');
assert.equal(docs.get(MODELO).tabela.linhas[12][1],'','o modelo não é tocado');
// Modelo fora do padrão: nada é gerado.
docs.get(MODELO).tabela=modeloTabela(true);assert.throws(()=>call('gerarDocumentoDiagnosticoCPT',{id:ID(1),tipo:'ficha'}),/texto fora dos campos/);
docs.get(MODELO).tabelas=[modeloTabela(),modeloTabela()];assert.throws(()=>call('gerarDocumentoDiagnosticoCPT',{id:ID(1),tipo:'ficha'}),/só a tabela oficial/);
delete docs.get(MODELO).tabelas;docs.get(MODELO).tabela=modeloTabela();
// 7. Apresentação no desenho da Central: capa, indicadores, temas, próximos passos e fotos (a sem acesso vira aviso).
r=call('gerarDocumentoDiagnosticoCPT',{id:ID(1),tipo:'slides'});assert.match(r.resultado,/Apresentação gerada \(Google Slides e PDF\)/);assert.match(r.resultado,/Foto 2 não abriu/);
assert.ok(r.arquivos.ficha&&r.arquivos.slides,'guarda os dois documentos');
const deck=decks.get(r.arquivos.slides.doc.match(/\/d\/([A-Za-z0-9_-]+)/)[1]);assert.equal(deck.salvo,true);assert.ok(!deck.slides.some(x=>x.velho),'slide em branco inicial removido');
const titulos=deck.slides.map(x=>x.textos[0]);
assert.deepEqual(titulos.slice(0,2),['DIAGNÓSTICO TERRITORIAL','Leitura do território']);assert.equal(deck.slides[0].textos[1],'Diagnóstico local: Coletor A — Rua Um');
assert.ok(titulos.includes('Moradia e perfil social')&&titulos.includes('Condições sanitárias')&&titulos.includes('Pontos de atenção')&&titulos.includes('Próximos passos'));
const kpi=deck.slides.find(x=>x.textos[0]==='Moradia e perfil social');assert.ok(kpi.textos.includes('120')&&kpi.textos.includes('15')&&kpi.textos.includes('Grupo 4 (média)'),'indicadores');
assert.deepEqual(deck.slides.flatMap(x=>x.imagens),['f1.jpg','f2.jpg'],'fotos escolhidas que abriram');assert.ok(deck.slides.some(x=>x.textos.includes('Fachadas')),'legenda da foto');
assert.match(deck.slides[0].textos[deck.slides[0].textos.length-1],/^Consórcio Performance Tamanduateí {4}REG-/);
// 8. Gerar de novo: a anterior vai para "Versões anteriores"; registro mudou no campo → não gera até salvar.
r=call('gerarDocumentoDiagnosticoCPT',{id:ID(1),tipo:'ficha'});assert.equal(caminho(fichaId),'CPT • Diagnósticos/2026/08 - agosto/Versões anteriores');assert.equal(caminho(pdfId),'CPT • Diagnósticos/2026/08 - agosto/Versões anteriores');
registros.rows[1][19]='h1-novo';cacheMap.clear();
d=run(`abrirDiagnosticoCPT({id:'${ID(1)}'})`);assert.equal(d.revisao.mudou,true);assert.equal(listar().diagnosticos.find(x=>x.id===ID(1)).mudou,true);
assert.throws(()=>call('gerarDocumentoDiagnosticoCPT',{id:ID(1),tipo:'slides'}),/mudou depois da revisão/);
r=call('salvarDiagnosticoCPT',{...base,situacao:'revisao',versao:d.revisao.versao});assert.equal(r.revisao.mudou,false);assert.ok(r.revisao.arquivos.ficha,'documentos continuam ligados');
d=run(`abrirDiagnosticoCPT({id:'${ID(1)}'})`);assert.ok(d.historico.length>=5);assert.deepEqual(d.historico.slice(0,2).map(h=>h.situacao),['revisao','revisado']);assert.ok(d.historico.some(h=>h.gerou==='slides'));
assert.equal(locked,false);
console.log('PASS: diagnósticos como na Central — lista com a situação da revisão para toda a equipe, por obra (ID, nome de uso, apelido) e vínculo da gerência, índice e cache, revisão (sugestão do formulário, versões, conflito, Revisado só da gerência, fotos do próprio registro), missões, ficha Sabesp no modelo oficial conferido (só preenchida, OBSERVAÇÕES = síntese + próximos passos) com PDF, apresentação no desenho da Central (capa, indicadores, temas, fotos com legenda, foto sem acesso avisada), pasta do mês, versão anterior guardada e “mudou no campo” barrando a geração.');
