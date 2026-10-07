// Obras e Fechamento do mês com serviços Google simulados. node app/testes/obras_relatorio.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
let email='victor@example.com',locked=false;
const props=new Map([['CPT_APLICACAO_1',JSON.stringify({baseId:'base',administrador:email,agendaId:'agenda',versao:'2.0.0'})],
  ['CPT_PESSOA:social@example.com',JSON.stringify({email:'social@example.com',nome:'Social',papeis:['socioambiental'],ativo:true,versao:1})],
  ['CPT_PESSOA:adm@example.com',JSON.stringify({email:'adm@example.com',nome:'Adm',papeis:['administrativo'],ativo:true,versao:1})],
  ['CPT_PESSOA:exe@example.com',JSON.stringify({email:'exe@example.com',nome:'Exe',papeis:['execucao'],ativo:true,versao:1})],['CPT_PESSOA:atd@example.com',JSON.stringify({email:'atd@example.com',nome:'Atd',papeis:['atendimento'],ativo:true,versao:1})]]);
const chain=()=>new Proxy(function(){},{get:(t,k)=>k==='then'?undefined:chain(),apply:()=>chain()});
class Sheet{constructor(n,rows=[]){this.name=n;this.rows=rows;this.cols=40;}getName(){return this.name}setName(n){this.name=n;return this}getLastRow(){return this.rows.length}getMaxColumns(){return this.cols}insertColumnsAfter(_,n){this.cols+=n}setFrozenRows(){}
  getRange(r,c,n=1,m=1){const s=this;const vals=()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.rows[r+i-1]?.[c+j-1]??''));let px;const api={getValues:vals,getValue:()=>vals()[0][0],
    setValues:v=>{v.forEach((row,i)=>{while(s.rows.length<r+i)s.rows.push([]);row.forEach((x,j)=>s.rows[r+i-1][c+j-1]=x)});return px},setValue:x=>api.setValues([[x]]),getFormulas:()=>vals().map(r=>r.map(()=>''))};
    px=new Proxy(api,{get:(t,k)=>k in t?t[k]:()=>px});return px;}}
class Book{constructor(id,sheets){this.id=id;this.sheets=sheets}getId(){return this.id}getUrl(){return 'https://docs.google.com/spreadsheets/d/'+this.id}getSheets(){return this.sheets}getSheetByName(n){return this.sheets.find(s=>s.name===n)||null}insertSheet(n){const a=new Sheet(n);this.sheets.push(a);return a}getSpreadsheetTimeZone(){return 'America/Sao_Paulo'}}
const colReg=['ID','Procedimento','Data do procedimento','Mês','Carimbo do envio','Origem','ID legado','Bairro','Bairro ID','Obra de referência','Obra ID','Responsável','Área','Atividade','Público informado','Protocolo informado','Situação do vínculo','Pesquisa','Conferência dos campos','Hash','Detalhes JSON'];
const reg=(i,proc,data,obraId,obra,ativ,pub,campos=[])=>['REG-'+String(i).padStart(24,'a'),proc,new Date(data+'T12:00:00Z'),data.slice(0,7),'','4.0','','Vila Linda','BAI-001',obra,obraId,'Resp','Social',ativ,pub,'','','x '+ativ,'',  '',JSON.stringify({campos})];
const registros=new Sheet('Registros',[colReg,
  reg(1,'Relato de atividade','2026-10-05','OBR-0001','Coletor A [OBR-0001]','Reunião com lideranças',15,[{titulo:'Público-alvo',valor:'Moradores'},{titulo:'Ferramenta utilizada',valor:'Comunicado'}]),
  reg(2,'Relato de atividade','2026-10-06','OBR-0001','Coletor A [OBR-0001]','Oficina de educação ambiental na escola','',[]),
  reg(3,'Pesquisa de Satisfação','2026-10-06','','','',''),reg(4,'Pesquisa de Satisfação','2026-10-13','','','',''),
  reg(5,'Relato de atividade','2026-09-30','','Texto antigo','Antiga',3)]);
const colAtd=['Protocolo','Protocolo principal','Situação do protocolo','Status','Data de abertura','Data de conclusão','Nome','Assunto','Endereço','Frente de obra','Área responsável','Responsável','Próxima ação','Atualização operacional','Documento','PDF','Origem','Pesquisa','Hash','Detalhes JSON'];
const atd=new Sheet('Atendimentos',[colAtd,['P1','P1','','Em andamento','2026-09-20','','Fulana','Vazamento','Rua X','Coletor A','Atd','Atd','Retornar','','','','CAC','','',JSON.stringify({campos:[{titulo:'Tipo de manifestação',valor:'Reclamação'},{titulo:'Canal',valor:'Atendimento itinerante'}]})],['P2','P2','','Concluído','2026-08-01','2026-08-10','Ciclano','Poeira','Rua Y','B','','','','','','','CAC']]);
const obrasRows=[['ID da obra','Nome da obra / frente','Bairros (separar por ;)','No formulário?'],['OBR-0001','Coletor A','Vila Linda',true,'','','MND','Santo André','Rua A','','','','','','','','','','',  'Em andamento',new Date('2026-08-01T12:00:00Z'),'','C','Alto','',new Date('2026-09-01T12:00:00Z')],['OBR-0002','Coletor B','',true,'','','','','','','','','','','','','','','','Paralisada']];
obrasRows[0][19]='Situação atual';obrasRows[0][27]='ATUALIZAR FORMULÁRIO';
const obras=new Sheet('Obras',obrasRows),bairros=new Sheet('Bairros',[['ID','Nome','No formulário?','Município','Tipo'],['BAI-001','Vila Linda',true,'SA','Bairro'],['BAI-002','Jardim',true,'SA','Bairro'],['BAI-099','Múltiplos bairros',true,'SA','Opção especial']]);
const books=new Map([['base',new Book('base',[registros,atd,obras,bairros])],['agenda',new Book('agenda',[new Sheet('Eventos',[['ID','Versão','Operação ID','Alterado em','Alterado por','Conteúdo JSON']])])]]);
let docs=[],criadas=0;const cacheMap=new Map();
const docMock=nome=>{const d={nome,partes:[],tabelas:[]};const par=t=>{d.partes.push(t);return chain()};const tab=rows=>{d.tabelas.push(rows);const t={setAttributes:()=>t,getNumRows:()=>rows.length,getRow:i=>({setAttributes:()=>{},getNumCells:()=>rows[i].length,getCell:()=>new Proxy({},{get:()=>()=>chain()})})};return t};
  d.body={setMarginLeft:()=>d.body,setMarginRight:()=>d.body,appendParagraph:par,appendTable:tab,appendPageBreak:()=>{}};docs.push(d);return {getBody:()=>d.body,saveAndClose(){},getId:()=>'doc'+docs.length,getUrl:()=>'https://docs.google.com/document/d/doc'+docs.length}};
const ctx={Date,console:{log(){},warn(){},error(){}},JSON,
  Session:{getActiveUser:()=>({getEmail:()=>email})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>Object.fromEntries(props),getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v)})},
  SpreadsheetApp:{openById:id=>{if(!books.has(id))throw Error('Não existe');return books.get(id)},create:n=>{criadas++;const b=new Book('ss'+criadas,[new Sheet('Planilha1')]);books.set(b.id,b);return b}},
  DocumentApp:{create:docMock,Attribute:{FONT_FAMILY:'F',FONT_SIZE:'S',BOLD:'B',ITALIC:'I',FOREGROUND_COLOR:'C'},ParagraphHeading:{HEADING1:1,HEADING2:2},HorizontalAlignment:{CENTER:'c'}},
  DriveApp:{getFileById:()=>({moveTo(){}}),createFolder:()=>({getId:()=>'pasta',getFoldersByName:()=>({hasNext:()=>false}),createFolder:()=>({})}),getFolderById:()=>{throw Error('x')}},
  CacheService:{getScriptCache:()=>({get:k=>cacheMap.get(k)||null,put:(k,v)=>cacheMap.set(k,v),remove:k=>cacheMap.delete(k)}),getUserCache:()=>({get:()=>null,put(){}})},
  Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:(d,_,f)=>{const s=new Date(d.getTime()-3*3600e3).toISOString();return f==='yyyy-MM'?s.slice(0,7):f==='yyyy-MM-dd'?s.slice(0,10):s.slice(0,16)},newBlob:t=>({getBytes:()=>Buffer.from(t)})},
  LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},releaseLock:()=>locked=false})}};
vm.createContext(ctx);for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','SocioambientalCPT','PerfisCPT','CronogramaCPT','ObservacoesCPT','ObrasCPT','ColecaoCPT','ObrasDoDiaCPT','PaineisGestaoCPT','RelatosCPT','MissoesCPT','MapaCPT','CicloAtendimentoCPT','FichaOficialCPT','AplicacaoCPT','ConectoresCPT','RecadosCPT','AlertasGestaoCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx)));
// Obras: consulta para todos, edição só para Administrativo/Gestão.
email='social@example.com';let l=run('listarObrasCPT()');assert.equal(l.obras.length,2);assert.equal(l.podeEditar,false);assert.deepEqual(l.bairros,['Jardim','Vila Linda']);
ctx.p={id:'OBR-0002',atualizadoEm:'',nome:'Coletor B',situacao:'Em andamento',bairros:['Jardim'],noFormulario:true};assert.throws(()=>run('salvarObraCPT(p)'),/Administrativo ou pela Gestão/);
email='adm@example.com';assert.equal(run('listarObrasCPT()').podeEditar,false);assert.throws(()=>run('salvarObraCPT(p)'),/período de testes/);
props.set('CPT_TRAVA_CONFIG','liberada');assert.equal(run('listarObrasCPT()').podeEditar,true);let r=run('salvarObraCPT(p)');assert.match(r.resultado,/atualizada/);assert.equal(obras.rows[2][2],'Jardim');assert.equal(obras.rows[2][19],'Em andamento');assert.equal(obras.rows[2][34],'adm@example.com');assert.match(obras.rows[5][27],/^PENDENTE — alterado pela aplicação/);
assert.equal(obras.rows[0][31],'Tipo de obra');assert.throws(()=>run('salvarObraCPT(p)'),/alterada por outra pessoa/);
ctx.p={...ctx.p,atualizadoEm:r.obra.atualizadoEm,bairros:['Múltiplos bairros']};assert.throws(()=>run('salvarObraCPT(p)'),/não cadastrado/);
ctx.p={...ctx.p,bairros:[],situacao:'Finalizada'};assert.throws(()=>run('salvarObraCPT(p)'),/término/);
ctx.p={...ctx.p,publico:'Z'};assert.throws(()=>run('salvarObraCPT(p)'),/Público/);
ctx.n={nome:'Rede Nova',situacao:'Em andamento',bairros:['vila linda'],noFormulario:true,inicioObra:'2026-10-02',tipo:'Rede coletora',publico:'a, b',impacto:'Médio'};r=run('salvarObraCPT(n)');assert.equal(r.obra.id,'OBR-0003');assert.deepEqual(r.obra.bairros,['Vila Linda']);assert.equal(r.obra.publico,'A, B');
assert.throws(()=>run('salvarObraCPT(n)'),/mesmo nome|Já existe/);
ctx.c={id:'OBR-0001',atualizadoEm:run('listarObrasCPT()').obras.find(o=>o.id==='OBR-0001').atualizadoEm};r=run('confirmarObraCPT(c)');assert.equal(r.obra.situacao,'Em andamento');
assert.equal(books.get('agenda').getSheetByName('Histórico de obras').rows.length,4);assert.equal(locked,false);
// Nome de uso e apelidos: a obra ganha um nome curto; o oficial continua guardado.
let o1=run('listarObrasCPT()').obras.find(o=>o.id==='OBR-0001');assert.equal(o1.exibir,'Coletor A');
ctx.u={...o1,nomeUso:'Coletor Linda',apelidos:['CT-A',' margem ','']};r=run('salvarObraCPT(u)');assert.equal(r.obra.exibir,'Coletor Linda');assert.equal(r.obra.nome,'Coletor A');
assert.equal(obras.rows[1][35],'Coletor Linda');assert.equal(obras.rows[1][36],'CT-A; margem');assert.equal(obras.rows[0][35],'Nome de uso');assert.equal(obras.rows[0][36],'Também chamada de');
ctx.u={...run('listarObrasCPT()').obras.find(o=>o.id==='OBR-0002'),nomeUso:'coletor linda'};assert.throws(()=>run('salvarObraCPT(u)'),/já usado/);
ctx.u={...ctx.u,nomeUso:'Coletor A'};assert.throws(()=>run('salvarObraCPT(u)'),/já usado/);
ctx.u={...ctx.u,nomeUso:'Coletor [B]'};assert.throws(()=>run('salvarObraCPT(u)'),/colchetes/);ctx.u={...ctx.u,nomeUso:'',apelidos:['B — trecho']};assert.throws(()=>run('salvarObraCPT(u)'),/travessão/);
ctx.u={nome:'Coletor Linda',situacao:'Em andamento',bairros:[],noFormulario:false};assert.throws(()=>run('salvarObraCPT(u)'),/já usado/,'obra nova não pode repetir nome de uso');
// Bairros: cadastrar, tirar do formulário e apelidos. Renomear não é permitido (as obras guardam o nome).
assert.deepEqual(run('listarObrasCPT()').bairrosCadastro.map(b=>b.id),['BAI-002','BAI-001']);
ctx.b={nome:'Vila Nova',noFormulario:true,apelidos:['VN']};r=run('salvarBairroCPT(b)');assert.equal(r.bairro.id,'BAI-100');assert.deepEqual(bairros.rows[4].slice(0,5),['BAI-100','Vila Nova',true,'Santo André','Bairro']);assert.equal(bairros.rows[4][11],'VN');assert.equal(bairros.rows[0][11],'Também chamado de');
assert.throws(()=>run('salvarBairroCPT(b)'),/Já existe/);
ctx.b={id:'BAI-002',nome:'Jardim',noFormulario:false,apelidos:['Jd.']};r=run('salvarBairroCPT(b)');assert.equal(bairros.rows[2][2],false);assert.equal(bairros.rows[2][11],'Jd.');
ctx.b={id:'BAI-002',nome:'Jardim Novo',noFormulario:false,apelidos:[]};assert.throws(()=>run('salvarBairroCPT(b)'),/não muda/);
ctx.b={id:'BAI-099',nome:'Múltiplos bairros',noFormulario:true,apelidos:[]};assert.throws(()=>run('salvarBairroCPT(b)'),/opção especial/);
assert.match(obras.rows[5][27],/^PENDENTE/);
email='social@example.com';ctx.b={nome:'Outro',noFormulario:true,apelidos:[]};assert.throws(()=>run('salvarBairroCPT(b)'),/Administrativo ou pela Gestão/);email='adm@example.com';
// "Outra obra": o registro do Campo 4.0 não é alterado; o vínculo fica na aplicação e vale em todas as leituras.
const OUTRA='REG-'+'f'.repeat(24);registros.rows.push([OUTRA,'Relato de atividade',new Date('2026-10-06T12:00:00Z'),'2026-10','','4.0','','Jardim','BAI-002','Obra ainda não cadastrada — identificar na observação final','','Resp','Social','Plantão na rua nova',4,'','','x','','',JSON.stringify({campos:[{titulo:'Observações finais',valor:'Obra na rua das Flores'}]})]);
const linhaOutra=JSON.stringify(registros.rows.at(-1));
assert.equal(books.get('agenda').getSheetByName('Vínculos de obra'),null,'sem vínculo gravado, a leitura dos registros não abre a aba de vínculos');
email='social@example.com';assert.throws(()=>run('listarVinculosObraCPT()'),/Administrativo ou pela Gestão/);
// Período de testes: só o proprietário confere obras; Administrativo e Gestão ficam travados e sem missão.
props.set('CPT_TRAVA_CONFIG','travada');email='adm@example.com';assert.throws(()=>run('listarVinculosObraCPT()'),/período de testes/);assert.deepEqual(run('missoesCPT()').missoes,[]);
assert.equal(run('listarObrasCPT()').gerencia,false);email='victor@example.com';assert.equal(run('listarVinculosObraCPT()').pendentes.length,1);assert.equal(run('listarObrasCPT()').gerencia,true);
props.set('CPT_TRAVA_CONFIG','liberada');
email='adm@example.com';let v=run('listarVinculosObraCPT()');assert.equal(v.pendentes.length,1);assert.equal(v.pendentes[0].id,OUTRA);assert.match(v.pendentes[0].observacao,/rua das Flores/);assert(v.obras.some(o=>o.id==='OBR-0002'));
// 2.26.8: a lista para vincular traz o catálogo inteiro (finalizadas também, por causa da ação pós-obra), finalizadas por último, com nomes para a busca.
{const cat=run('listarObrasCPT()').obras;assert.equal(v.obras.length,cat.length,'todas as obras do catálogo');const fin=v.obras.map(o=>o.situacao==='Finalizada');assert.ok(fin.every((f,i)=>!i||f>=fin[i-1]),'finalizadas por último');assert.ok(v.obras.every(o=>typeof o.busca==='string'&&o.busca.length));}
ctx.k={registroId:OUTRA,obraId:'OBR-9999',operacaoId:'OP-vinculo-0000001'};assert.throws(()=>run('vincularObraCPT(k)'),/Obra não encontrada/);
ctx.k={registroId:OUTRA,obraId:'OBR-0002',operacaoId:'OP-vinculo-0000002'};r=run('vincularObraCPT(k)');assert.match(r.resultado,/vinculado/);
assert.equal(JSON.stringify(registros.rows.at(-1)),linhaOutra,'registro original intacto');
assert.equal(run('listarVinculosObraCPT()').pendentes.length,0);
// Engano se corrige: o vínculo feito aparece na lista e pode ser trocado; registro comum não entra.
let fe=run('listarVinculosObraCPT()').feitos;assert.equal(fe.length,1);assert.equal(fe[0].obraId,'OBR-0002');
ctx.k={registroId:OUTRA,obraId:'OBR-0001',operacaoId:'OP-vinculo-0000003'};assert.match(run('vincularObraCPT(k)').resultado,/trocado/);
assert.equal(run("AplicacaoCPT.executar(d=>({obra:d.ler(d.registros(),11).find(r=>r[0]==='"+OUTRA+"')[10]}))").obra,'OBR-0001');
ctx.k={registroId:OUTRA,obraId:'OBR-0002',operacaoId:'OP-vinculo-0000004'};run('vincularObraCPT(k)');
ctx.k={registroId:registros.rows[1][0],obraId:'OBR-0002',operacaoId:'OP-vinculo-0000005'};assert.throws(()=>run('vincularObraCPT(k)'),/já foi vinculado ou não é/);
assert.equal(run("AplicacaoCPT.executar(d=>({obra:d.ler(d.registros(),11).find(r=>r[0]==='"+OUTRA+"')[10]}))").obra,'OBR-0002','vínculo aplicado na leitura');
// Obras de hoje: missão a partir das 7h, sugestão pelo cronograma e pelo dia anterior, confirmação pela gerência.
books.get('agenda').getSheetByName('Eventos').rows.push(['AG-1',1,'OP-x','','',JSON.stringify({id:'AG-1',versao:1,titulo:'Plantão',obra:'Coletor Linda',data:'2026-10-06',status:'confirmada',frentes:[],responsaveis:[]})]);
ctx.relogio=t=>{ctx.ObrasDoDiaCPT_relogio=new Date(t);};vm.runInContext('ObrasDoDiaCPT.relogio=()=>ObrasDoDiaCPT_relogio',ctx);
ctx.relogio('2026-10-06T08:00:00Z');assert(!run('missoesCPT()').missoes.some(m=>m.id==='obras-hoje'),'antes das 7h não há missão');
ctx.relogio('2026-10-06T13:00:00Z');assert(run('missoesCPT()').missoes.some(m=>m.id==='obras-hoje'));
let h=run('obrasDeHojeCPT()');assert.equal(h.dia,'2026-10-06');assert.deepEqual(h.sugestao,['OBR-0001']);assert.equal(h.confirmado,null);assert.equal(h.podeConfirmar,true);
ctx.q={dia:'2026-10-06',obras:['OBR-0404'],nenhuma:false,operacaoId:'OP-obras-dia-00001'};assert.throws(()=>run('confirmarObrasDoDiaCPT(q)'),/não encontrada/);
ctx.q={dia:'2026-10-09',obras:[],nenhuma:true,operacaoId:'OP-obras-dia-00002'};assert.throws(()=>run('confirmarObrasDoDiaCPT(q)'),/futuro/);
ctx.q={dia:'2026-10-06',obras:['OBR-0001'],nenhuma:false,operacaoId:'OP-obras-dia-00003'};r=run('confirmarObrasDoDiaCPT(q)');assert.match(r.resultado,/1 obra/);
assert(!run('missoesCPT()').missoes.some(m=>m.id==='obras-hoje'));
ctx.relogio('2026-10-07T13:00:00Z');assert.deepEqual(run('obrasDeHojeCPT()').sugestao,['OBR-0001'],'sugere as de ontem');
email='social@example.com';assert.equal(run('obrasDeHojeCPT()').podeConfirmar,false);assert.deepEqual(run('missoesCPT()').missoes,[]);
ctx.q={dia:'2026-10-07',obras:[],nenhuma:true,operacaoId:'OP-obras-dia-00004'};assert.throws(()=>run('confirmarObrasDoDiaCPT(q)'),/Administrativo ou pela Gestão/);email='adm@example.com';
// Comparação: dia informado com ação em obra não ativa; dia sem confirmação fica "não informado".
const cmp=run("compararObrasDoMesCPT('2026-10')"),d6=cmp.dias.find(x=>x.dia==='2026-10-06'),d5=cmp.dias.find(x=>x.dia==='2026-10-05');
assert.equal(cmp.dias.length,7);assert.equal(d5.informado,false);assert.equal(d6.informado,true);assert.equal(d6.ativas,1);assert.equal(d6.comAcao,2);
assert.deepEqual(d6.ativasSemAcao,[]);assert.deepEqual(d6.acaoForaDasAtivas,['Coletor B']);assert.equal(cmp.mes.diasInformados,1);assert.equal(cmp.mes.diasNaoInformados,6);assert.equal(cmp.mes.acaoForaDasAtivas,1);
registros.rows.pop();/* o fechamento abaixo conta os relatos de outubro sem este */
// Qualidade dos relatos: conferência explicável, sem nota nem ranking.
const Q=x=>run('RelatosCPT.conferir('+JSON.stringify(x)+')');
let q=Q({atividade:'Oficina',complemento:'Descarte de óleo',texto:'Na EMEF Jardim, conversamos com 20 alunos sobre descarte de óleo. Eles tiraram dúvidas e receberam folhetos. Ficou combinado o retorno em novembro para recolher o óleo. '.repeat(3),bairro:'Vila Linda',endereco:'',publico:20,publicoAlvo:'Alunos'});
assert.equal(q.faltam,0);q=Q({atividade:'Plantão',texto:'Fizemos plantão.',publico:null});assert.deepEqual(q.itens.filter(i=>!i.ok).map(i=>i.chave),['oque','onde','publico','resultado','encaminhamento','tamanho']);
// Missões: dicas para quem escreveu (só os próprios relatos), comentário privado da gestão, casos antigos e preparo perto do prazo.
props.set('CPT_PESSOA:social@example.com',JSON.stringify({email:'social@example.com',nome:'Social',papeis:['socioambiental'],ativo:true,versao:1}));
const RELS='REG-'+'c'.repeat(24);registros.rows.push([RELS,'Relato de atividade',new Date('2026-10-06T12:00:00Z'),'2026-10','','4.0','','Vila Linda','BAI-001','','','Social','Social','Plantão social',3,'','','plantao social','','',JSON.stringify({campos:[{titulo:'Relato da atividade',valor:'Fizemos plantão na praça.'}]})]);
props.set('CPT_ENTREGAS_VERSAO',String(Number(props.get('CPT_ENTREGAS_VERSAO')||0)+1));/* a linha removida acima repetiria a contagem de linhas do cache */
atd.rows.push(['P9','P9','','Em andamento',new Date('2026-08-01T12:00:00Z'),'','Beltrano','Ligação','Rua Z','','Atd','Atd','Ligar','','','','CAC']);
ctx.relogio('2026-10-07T13:00:00Z');email='social@example.com';
props.set('CPT_TRAVA_CONFIG','travada');assert.deepEqual(run('missoesCPT()').missoes,[],'período de testes: ninguém além do proprietário recebe missão');props.set('CPT_TRAVA_CONFIG','liberada');
let ms=run('missoesCPT()').missoes;const dica=ms.find(m=>m.tipo==='dica');assert(dica,'dica para quem escreveu');assert.equal(dica.registroId,RELS);assert.match(dica.texto,/encaminhamento/);assert(!ms.some(m=>m.id==='casos-antigos'),'Socioambiental não recebe casos');
email='atd@example.com';ms=run('missoesCPT()').missoes;assert(ms.some(m=>m.id==='casos-antigos'));assert(!ms.some(m=>m.tipo==='dica'),'ninguém recebe dica do relato de outra pessoa');
// 2.36: a gerência recebe os alertas como missões (com o caso antigo dentro deles), sem a missão de casos repetida.
email='adm@example.com';ms=run('missoesCPT()').missoes;assert(ms.some(m=>m.id==='alerta:casos-30'&&m.rota==='atendimentos'),'alerta de caso antigo vira missão');assert(!ms.some(m=>m.id==='casos-antigos'),'sem missão repetida');assert(ms.filter(m=>m.id.startsWith('alerta:')).every(m=>m.titulo&&m.texto&&(m.rota||m.pendente)));
// Devolutiva: privada (autor e gerência), travada no período de testes, autor responde e some da lista de missões.
email='social@example.com';ctx.v={registroId:RELS,comentario:'Faltou dizer o que ficou combinado.',operacaoId:'OP-devolutiva-0001'};assert.throws(()=>run('devolverRelatoCPT(v)'),/Gestão ou pelo Administrativo/);
email='adm@example.com';props.set('CPT_TRAVA_CONFIG','travada');assert.throws(()=>run('devolverRelatoCPT(v)'),/período de testes/);props.set('CPT_TRAVA_CONFIG','liberada');
r=run('devolverRelatoCPT(v)');assert.match(r.resultado,/só para Social/);
ctx.v2={registroId:registros.rows[1][0],comentario:'Ok',operacaoId:'OP-devolutiva-0002'};assert.match(run('devolverRelatoCPT(v2)').resultado,/combine pessoalmente/);
email='atd@example.com';assert.equal(run('minhasDevolutivasCPT()').devolutivas.length,0,'outras pessoas não veem');
email='social@example.com';assert.equal(run('minhasDevolutivasCPT()').devolutivas.length,1,'autor vê só a sua');ms=run('missoesCPT()').missoes;const dev=ms.find(m=>m.tipo==='devolutiva');assert.match(dev.devolutiva.comentario,/combinado/);
ctx.v={registroId:RELS,resposta:'Vou completar no próximo.',versao:dev.devolutiva.versao,operacaoId:'OP-devolutiva-0003'};assert.match(run('responderDevolutivaCPT(v)').resultado,/visto/);
assert(!run('missoesCPT()').missoes.some(m=>m.tipo==='devolutiva'));email='adm@example.com';assert.equal(run('minhasDevolutivasCPT()').devolutivas.find(d=>d.registroId===RELS).resposta,'Vou completar no próximo.');
// Preparo: a 5 dias do prazo (padrão dia 5 do mês seguinte), Socioambiental recebe a missão dos relatos não preparados.
email='social@example.com';ctx.relogio('2026-10-31T13:00:00Z');
// Relato grande com detalhes em arquivo à parte: a conferência lê o arquivo (sem ele, acusaria falta de tudo).
const RELX='REG-'+'b'.repeat(24),textoX='Na EMEF Jardim, conversamos com 20 alunos sobre descarte de óleo. Eles tiraram dúvidas e receberam folhetos. Ficou combinado o retorno em novembro. '.repeat(3);
registros.rows.push([RELX,'Relato de atividade',new Date('2026-10-08T12:00:00Z'),'2026-10','','4.0','','Vila Linda','BAI-001','','','Resp','Social','Oficina',20,'','','oficina','','',JSON.stringify({arquivoDetalhesId:'detalhesExternos'})]);
const getFile=ctx.DriveApp.getFileById;ctx.DriveApp.getFileById=id=>id==='detalhesExternos'?{getBlob:()=>({getDataAsString:()=>JSON.stringify({campos:[{titulo:'Relato da atividade',valor:textoX},{titulo:'Complemento da atividade',valor:'Óleo'},{titulo:'Público-alvo da atividade',valor:'Alunos'}]})})}:getFile(id);
props.set('CPT_ENTREGAS_VERSAO',String(Number(props.get('CPT_ENTREGAS_VERSAO')||0)+1));
const rx=run("AplicacaoCPT.executar(d=>({r:PaineisGestaoCPT.relatosDoMes(d,AplicacaoCPT.contexto(),'2026-10').itens.find(x=>x.id==='"+RELX+"')}))").r;
assert(rx.qualidade,'qualidade calculada pelo arquivo externo');assert.equal(rx.qualidade.faltam,0);ctx.DriveApp.getFileById=getFile;registros.rows.pop();
registros.rows.pop();atd.rows.pop();email='adm@example.com';
// Mapa: só contagens por obra e por bairro; pontos por clique (dentro do município) e sugestão pelo Google.
email='victor@example.com';ctx.relogio('2026-10-07T13:00:00Z');
registros.rows.push(['REG-'+'9'.repeat(24),'Relato de atividade',new Date('2026-10-06T12:00:00Z'),'2026-10','','4.0','','Jardim','BAI-002','Coletor A [OBR-0001]','OBR-0001','Resp','Social','Oficina',12,'','','oficina','','','{}']);
atd.rows.push(['P7','P7','','Em andamento',new Date('2026-10-06T12:00:00Z'),'','Fulano de Tal','Buraco','Rua Secreta, 99 - Jardim','','Atd','Atd','','','','','CAC']);
props.set('CPT_ENTREGAS_VERSAO',String(Number(props.get('CPT_ENTREGAS_VERSAO')||0)+1));
let mp=run("carregarMapaCPT({periodo:'mes',mes:'2026-10'})");const jardim=mp.bairros.find(x=>x.nome==='Jardim');
assert.equal(jardim.acoes,1);assert.equal(jardim.pessoas,12);assert.equal(jardim.casos,1,'atendimento no bairro pelo nome no endereço');assert.equal(jardim.lat,null);
assert(!/Rua Secreta|Fulano|P7/.test(JSON.stringify(mp)),'nenhum endereço, nome ou protocolo sai do servidor');assert.equal(mp.obras.find(o=>o.id==='OBR-0001').acoes>=1,true);
ctx.m={tipo:'bairro',id:'BAI-002',lat:-23.65,lng:-46.53};assert.match(run('posicionarNoMapaCPT(m)').resultado,/Jardim/);assert.equal(bairros.rows[2][12],-23.65);assert.equal(bairros.rows[0][12],'Latitude');
ctx.m={tipo:'obra',id:'OBR-0002',lat:-23.66,lng:-46.52};run('posicionarNoMapaCPT(m)');assert.equal(obras.rows[2][9],-23.66);assert.equal(obras.rows[2][10],-46.52);
ctx.m={tipo:'obra',id:'OBR-0002',lat:-22.9,lng:-43.2};assert.throws(()=>run('posicionarNoMapaCPT(m)'),/fora de Santo André/);
mp=run("carregarMapaCPT({periodo:'mes',mes:'2026-10'})");assert.equal(mp.bairros.find(x=>x.nome==='Jardim').lat,-23.65,'cache renovado depois de posicionar');
// Mudou o catálogo (obra nova): o mapa não espera o cache vencer.
ctx.n2={nome:'Rede do Mapa',situacao:'A confirmar',bairros:[],noFormulario:false};run('salvarObraCPT(n2)');assert(run("carregarMapaCPT({periodo:'mes',mes:'2026-10'})").obras.some(o=>o.nome==='Rede do Mapa'));
// A pesquisa do Google roda sem segurar a trava de salvamento.
let travadoDurante=null;
ctx.Maps={newGeocoder:()=>({setRegion(){return this},setLanguage(){return this},geocode:q=>(travadoDurante=travadoDurante||locked,/Vila Linda/.test(q))?{results:[{geometry:{location:{lat:-23.67,lng:-46.545}}}]}:{results:[{geometry:{location:{lat:-22.9,lng:-43.2}}}]}})};
let sg=run('sugerirBairrosNoMapaCPT()');assert.equal(travadoDurante,false,'trava livre durante a pesquisa');assert.equal(locked,false);assert.equal(sg.gravados,1);assert.match(sg.resultado,/Vila Nova/,'fora do município fica para o clique');assert.equal(bairros.rows[1][12],-23.67);
email='adm@example.com';props.set('CPT_TRAVA_CONFIG','travada');assert.throws(()=>run("carregarMapaCPT({periodo:'hoje'})"),/período de testes/);props.set('CPT_TRAVA_CONFIG','liberada');
assert.equal(run("carregarMapaCPT({periodo:'semana'})").periodo.de,'2026-10-01');
registros.rows.pop();atd.rows.pop();email='adm@example.com';
console.log('PASS: mapa — contagens por obra e bairro sem endereço/nome/protocolo, ponto por clique (obra J:K, bairro M:N) só dentro do município, sugestão do Google sem gravar fora, cache renovado e travado nos testes.');
console.log('PASS: qualidade dos relatos (6 critérios com dica), dicas só para quem escreveu, devolutiva privada e travada nos testes, casos de 30+ dias para o Atendimento, preparo a 5 dias do prazo para o Socioambiental.');
console.log('PASS: "Outra obra" vinculada sem tocar no registro original; obras de hoje (missão às 7h, sugestão do cronograma e de ontem, confirmação da gerência) e comparação ativas × ações por dia e no mês.');
console.log('PASS: nome de uso e apelidos das obras (únicos, oficial preservado) e bairros editáveis na aplicação, com histórico e marcação para o formulário.');
console.log('PASS: obras consultáveis por todos, edição restrita (travada no período de testes), conflito de versão, bairros validados, nova obra com ID sequencial, revisão diária e marcação para o formulário.');

// Cache compartilhado e página com dados embutidos.
registros.rows.push(reg(9,'Relato de atividade','2026-10-07','','','Nova',5));books.get('base').sheets.push(new Sheet('Início'));
email='social@example.com';const i1=run("carregarInicioCPT('2026-10')");assert.equal(i1.cache,false);assert.ok(i1.dias.length&&i1.dias.every(x=>typeof x.pessoas==='number'),'2.35: pessoas por dia junto com as ações');assert.equal(i1.dias.reduce((s,x)=>s+x.pessoas,0),i1.indicadores.pessoas,'soma dos dias = pessoas do mês');assert.equal(run("carregarInicioCPT({mes:'2026-10'})").cache,true);
assert.equal(run("carregarInicioCPT({mes:'2026-10',atualizar:true})").cache,false);registros.rows.push(reg(10,'Pesquisa de Satisfação','2026-10-08','','','',''));
const i2=run("carregarInicioCPT('2026-10')");assert.equal(i2.cache,false);assert.equal(i2.satisfacao.mes,3);assert.equal(i2.satisfacao.meta,60);
const mesAtual=ctx.Utilities.formatDate(new Date(),'America/Sao_Paulo','yyyy-MM');run("carregarInicioCPT('"+mesAtual+"')");run("carregarCronogramaCPT({mes:'"+mesAtual+"'})");
const ini=JSON.parse(vm.runInContext('dadosIniciaisCPT_()',ctx));assert.equal(ini.perfil.email,'social@example.com');assert.equal(ini.inicio.mes,mesAtual);assert(Array.isArray(ini.agenda.itens));
email='alguem@example.com';const negado=JSON.parse(vm.runInContext('dadosIniciaisCPT_()',ctx));assert(negado.erro&&!negado.inicio&&!negado.perfil,'sem cadastro: nada de dados embutidos');
assert(!vm.runInContext('dadosIniciaisCPT_()',ctx).includes('<'),'JSON seguro para <script>');
console.log('PASS: cache compartilhado invalidado por linha nova e pelo botão Atualizar; página já sai com perfil, Visão do mês e agenda; conta sem cadastro não recebe dados.');

{// Ciclo do atendimento na aplicação (fonte única: Atendimentos + Movimentações).
const hojeT=ctx.Utilities.formatDate(new Date(),'America/Sao_Paulo','yyyy-MM-dd');const movs=new Sheet('Movimentações',[['ID','Protocolo','Data e hora','Tipo','Status','Autor','Resumo','Origem','Hash','Detalhes JSON']]);books.get('base').sheets.push(movs);
atd.rows.push(['ATD20260028','ATD20260028','Principal','Recebida',new Date('2026-09-28T12:00:00Z'),'','Moradora','Vazamento','Rua Z','Coletor A','Atendimento','Kesy','Triagem do Atendimento',new Date('2026-10-02T13:00:00Z'),'','','Formulário 4.0 · REG-x','','',JSON.stringify({registroId:'REG-x',procedencia:'Em análise',tipo:'Reclamação',canal:'Atendimento itinerante',telefone:'(11) 0000-0000',solicitacao:'Lama na calçada'})]);
email='social@example.com';let det;det=run("abrirAtendimentoCPT('ATD20260028')");assert.equal(det.pode.atualizar,false);assert.equal(det.pode.executar,false);assert.equal(det.abertura.telefone,'(11) 0000-0000','2.31: ficha completa para todo o time');assert.equal(det.abertura.contatoOculto,false);assert.equal(det.pode.finalizar,false);assert.equal(det.pode.incorporar,false,'Socioambiental não finaliza nem mescla');assert.equal(det.abertura.tipo,'Reclamação');
ctx.a={protocolo:'ATD20260028',versao:det.versao,operacaoId:'OP-atualiza000000001',status:'Em andamento',procedencia:'Procedente',area:'Execução',proximaAcao:'Reparar calçada',responsavel:'Equipe obra'};assert.throws(()=>run('atualizarAtendimentoCPT(a)'),/não permite/);
// 2.31: observação de qualquer pessoa do time vira recado para Atendimento, Comunicação, Gestão e Administrativo (quem escreveu não recebe).
ctx.ob={protocolo:'ATD20260028',texto:'Moradora contou na feira que a calçada afundou de novo.',operacaoId:'OP-obsrecado0000001'};const ob=run('adicionarObservacaoCPT(ob)');assert.equal(ob.avisou,true);assert.equal(ob.observacao.canal,'Não informado','canal opcional');assert.match(ob.resultado,/receberam um recado/);
assert.equal(run('listarRecadosCPT()').naoLidos,0,'quem escreveu não recebe aviso');
email='atd@example.com';const rr=run('listarRecadosCPT()').itens.find(x=>/Nova observação no Caso/.test(x.assunto));assert.ok(rr&&rr.paraMim&&!rr.lido,'Atendimento recebe');assert.equal(rr.vinculo.tipo,'protocolo');assert.equal(rr.vinculo.id,'ATD20260028');assert.match(rr.texto,/calçada afundou[\s\S]*— Social/);
email='adm@example.com';assert.ok(run('listarRecadosCPT()').itens.some(x=>x.id===rr.id&&x.paraMim),'Administrativo recebe');
email='atd@example.com';det=run("abrirAtendimentoCPT('ATD20260028')");assert.equal(det.abertura.telefone,'(11) 0000-0000');r=run('atualizarAtendimentoCPT(a)');assert.match(r.resultado,/atualizado/);
assert.equal(atd.rows[3][3],'Em andamento');assert.equal(atd.rows[3][10],'Execução');assert.equal(movs.rows.length,2);assert.match(movs.rows[1][6],/Procedência: Em análise → Procedente/);
assert.equal(run('atualizarAtendimentoCPT(a)').repetida,true,'mesma operação não duplica');ctx.a.operacaoId='OP-atualiza000000002';assert.throws(()=>run('atualizarAtendimentoCPT(a)'),/outra pessoa/);
email='exe@example.com';det=run("abrirAtendimentoCPT('ATD20260028')");assert.equal(det.pode.executar,false,'papel Execução não existe mais: engenharia usa o formulário');assert.equal(det.pode.finalizar,false);
ctx.f={protocolo:'ATD20260028',versao:det.versao,operacaoId:'OP-finaliza000000001',conclusao:'x',data:hojeT,procedencia:'Procedente'};assert.throws(()=>run('finalizarAtendimentoCPT(f)'),/não permite/);
email='atd@example.com';assert.throws(()=>run("registrarExecucaoCPT({protocolo:'ATD20260028',versao:'x',operacaoId:'OP-execucao00000000x',feito:'x',data:'2026-01-01',executadoPor:'x'})"),/outra pessoa/);ctx.e={protocolo:'ATD20260028',versao:det.versao,operacaoId:'OP-execucao000000001',feito:'Troca de 3 m² de piso.',data:'2099-01-01',executadoPor:'Equipe obra',evidencias:'https://drive.google.com/file/d/abc'};assert.throws(()=>run('registrarExecucaoCPT(e)'),/futura/);
ctx.e.data=hojeT;r=run('registrarExecucaoCPT(e)');assert.match(r.resultado,/Execução registrada/);assert.equal(atd.rows[3][12],'Conferir execução e finalizar ficha');assert.equal(movs.rows[2][3],'Execução');
email='atd@example.com';det=run("abrirAtendimentoCPT('ATD20260028')");ctx.f={...ctx.f,versao:det.versao,data:'2026-09-01'};assert.throws(()=>run('finalizarAtendimentoCPT(f)'),/antes da abertura/);
ctx.f.data=hojeT;ctx.f.procedencia='Em análise';assert.throws(()=>run('finalizarAtendimentoCPT(f)'),/Procedente ou Não procedente/);ctx.f.procedencia='Procedente';r=run('finalizarAtendimentoCPT(f)');
assert.equal(atd.rows[3][3],'Concluída');assert.equal(JSON.parse(atd.rows[3][19]).procedencia,'Procedente');assert.equal(movs.rows[3][3],'Finalização');
det=run("abrirAtendimentoCPT('ATD20260028')");assert.equal(det.ficha.concluido,true);ctx.e={...ctx.e,versao:det.versao,operacaoId:'OP-execucao000000002'};email='atd@example.com';assert.throws(()=>run('registrarExecucaoCPT(e)'),/concluído/);
email='atd@example.com';ctx.ra={protocolo:'ATD20260028',versao:det.versao,operacaoId:'OP-reabre0000000001',motivo:'Vazamento voltou',proximaAcao:'Nova vistoria'};run('reabrirAtendimentoCPT(ra)');assert.equal(atd.rows[3][3],'Em andamento');assert.equal(atd.rows[3][5],'');
assert.throws(()=>run("abrirAtendimentoCPT('ATD;DROP')"),/Protocolo inválido/);assert.equal(locked,false);
assert(Number(props.get('CPT_ATD_VERSAO'))>=4,'cache da Visão do mês invalidado a cada ação');
console.log('PASS: ciclo do caso — permissões por perfil (2.31: ficha completa para todo o time; observação vira recado para quem conduz), atualização com histórico, execução, finalização com regras, reabertura, idempotência e conflito.');
}

{// 2.4: casos migrados, correção, incorporação, filtro "com quem está" e ficha oficial.
const movs=books.get('base').getSheetByName('Movimentações');Sheet.prototype.appendRow=function(r){this.rows.push(r);return this};
const migrado={protocolo:'ATD20260007',aberturas:[{campos:{'Nome do solicitante':'Nome Antigo','Telefones':'(11) 1111-1111','Solicitação':'Texto da abertura'}}],
  oficiais:[{campos:{'Nome':'Morador Migrado','Telefone':'(11) 2222-2222','E-mail':'m@example.com','Solicitação':'Buraco na rua','Tipo de manifestação':'Reclamação','Canal de recebimento':'Atendimento itinerante','Local do atendimento':'Rua A','Horário':'2026-03-05T13:30:00.000Z','Solução':'Equipe vistoriou o local.','Fotos da abertura':'https://drive.google.com/file/d/FOTOABERTURA000000000001/view'}}],manuais:[],historico:[],correcoes:[],vinculos:[]};
atd.rows.push(['ATD20260007','ATD20260007','Principal','Recebida',new Date('2026-03-05T12:00:00Z'),'','Morador Migrado','Buraco','Rua A, 1','Coletor A','Execução','Kesy','Analisar','2026-09-01','https://docs.google.com/document/d/DOCANTIGO000000000000001/edit','https://drive.google.com/file/d/PDFANTIGO000000000000001/view','Base Fichas Oficiais','','',JSON.stringify(migrado)],
  ['ATD20260008','ATD20260008','Principal','Recebida',new Date('2026-03-06T12:00:00Z'),'','Morador Migrado','Buraco','Rua A, 1','','Execução','','Analisar','','','','Base Fichas Oficiais','','','{}']);
email='atd@example.com';let det=run("abrirAtendimentoCPT('ATD20260007')");
assert.equal(det.abertura.telefone,'(11) 2222-2222','migrado: ficha oficial antiga vence a abertura');assert.equal(det.abertura.solicitacao,'Buraco na rua');assert.equal(det.abertura.tipo,'Reclamação');assert.equal(det.abertura.execucoesAntigas,'Equipe vistoriou o local.');
assert.equal(det.correcao.nome,'Morador Migrado');assert.equal(det.pode.corrigir,true);
email='social@example.com';assert.equal(run("abrirAtendimentoCPT('ATD20260007')").correcao,null,'quem não conduz não recebe dados para correção');
email='atd@example.com';ctx.c={protocolo:'ATD20260007',versao:det.versao,operacaoId:'OP-corrige000000001',motivo:'Telefone novo',dados:{...det.correcao,telefone:'(11) 3333-3333',nome:'Morador Corrigido'}};
let r=run('corrigirAtendimentoCPT(c)');assert.match(r.resultado,/corrigidos/);const l7=atd.rows.find(x=>x[0]==='ATD20260007');assert.equal(l7[6],'Morador Corrigido');
const mc=movs.rows[movs.rows.length-1];assert.equal(mc[3],'Correção de ficha');assert.match(mc[6],/Telefone: alterado/);assert(!/3333/.test(mc[6]),'telefone não vai para o histórico aberto');
det=run("abrirAtendimentoCPT('ATD20260007')");assert.equal(det.abertura.telefone,'(11) 3333-3333');
ctx.c={...ctx.c,versao:det.versao,operacaoId:'OP-corrige000000002',dados:det.correcao};assert.throws(()=>run('corrigirAtendimentoCPT(c)'),/Nada foi alterado/);
// Incorporação
ctx.i={protocolo:'ATD20260007',versao:det.versao,operacaoId:'OP-incorpora00000001',outro:'ATD20260007',motivo:'dup'};assert.throws(()=>run('incorporarAtendimentoCPT(i)'),/diferente/);
ctx.i.outro='atd20260008';r=run('incorporarAtendimentoCPT(i)');const l8=atd.rows.find(x=>x[0]==='ATD20260008');assert.equal(l8[1],'ATD20260007');assert.equal(l8[2],'Incorporado');
assert.equal(run("abrirAtendimentoCPT('ATD20260008')").ficha.protocolo,'ATD20260007','protocolo incorporado abre o principal');
assert.ok(movs.rows.filter(x=>x[3]==='Vínculo de protocolos').length===2,'movimentação nos dois protocolos');
// Filtro "com quem está" e dias em aberto
let lista=run("buscarAtendimentosCPT({estado:'abertos',com:'Execução'})");assert.ok(lista.itens.every(x=>x.area==='Execução'&&!x.concluido));assert.ok(lista.itens.some(x=>x.protocolo==='ATD20260007'));assert.ok(!lista.itens.some(x=>x.protocolo==='ATD20260008'));
assert.ok(lista.itens.find(x=>x.protocolo==='ATD20260007').dias>100);
// 2.26.6: número curto do caso ("Caso 7"), busca por "7", "caso 7", "#7" e "7/26"; o ano aparece só quando o número se repete em outro ano.
assert.equal(lista.itens.find(x=>x.protocolo==='ATD20260007').caso,'Caso 7');
for(const b of ['7','caso 7','Caso 07','#7','7/26','7/2026']){const r=run("buscarAtendimentosCPT({busca:"+JSON.stringify(b)+"})");assert.deepEqual(r.itens.map(x=>x.protocolo),['ATD20260007'],'busca '+b);}
assert.equal(run("buscarAtendimentosCPT({busca:'7/25'})").itens.length,0,'ano errado não acha');assert.ok(run("buscarAtendimentosCPT({busca:'ATD20260007'})").itens.some(x=>x.protocolo==='ATD20260007'),'protocolo completo continua');
assert.equal(run("DadosDaAplicacao.buscaCaso('Rua 7 de setembro')"),null,'texto com número não vira busca por caso');assert.equal(run("DadosDaAplicacao.numeroCaso('DEMO-1')"),null);
vm.runInContext("var dCaso=new DadosDaAplicacao(planilhaCPT_(AplicacaoCPT.config().baseId),{papeis:['administrador']});dCaso._anosCaso=new Map([[7,new Set(['2025','2026'])],[8,new Set(['2026'])]]);",ctx);
assert.equal(run("dCaso.caso('ATD20260007')"),'Caso 7/26');assert.equal(run("dCaso.caso('ATD20250007')"),'Caso 7/25');assert.equal(run("dCaso.caso('ATD20260008')"),'Caso 8');
assert.equal(run("dCaso.caso('ATD20260007')"),'Caso 7/26');assert.equal(run("dCaso.caso('ATD20250007')"),'Caso 7/25');assert.equal(run("dCaso.caso('ATD20260008')"),'Caso 8');assert.throws(()=>run("buscarAtendimentosCPT({com:'Outro'})"),/inválido/);
// Ficha oficial: preenche o modelo, gera PDF, guarda links e só refaz quando muda.
const textos=[];let copias=0,pdfs=0;const movidos=[];
const cell=()=>{const c={clear:()=>c,setVerticalAlignment:()=>c,appendParagraph:t=>{const p={appendText:x=>{textos.push(x);const tx={setFontFamily:()=>tx,setFontSize:()=>tx,setBold:()=>tx,setForegroundColor:()=>tx,setUnderline:()=>tx,setLinkUrl:()=>tx};return tx},setSpacingAfter:()=>p,setLineSpacing:()=>p,setAlignment:()=>p,appendInlineImage:()=>({getWidth:()=>800,getHeight:()=>600,setWidth(){},setHeight(){}})};if(t)textos.push(t);return p},appendTable:()=>({setBorderWidth(){return this},setBorderColor(){return this},getCell:()=>cell()})};return c};
const pasta=nome=>({getId:()=>'p'+nome,getUrl:()=>'https://drive.google.com/drive/folders/'+nome,getFoldersByName:()=>({hasNext:()=>false}),createFolder:n=>pasta(n),createFile:b=>{pdfs++;return {getId:()=>'PDFNOVO00000000000000000'+pdfs}},getFiles:()=>({hasNext:()=>false}),getFilesByName:()=>({hasNext:()=>false})});
ctx.DriveApp={createFolder:n=>pasta(n),getFolderById:()=>pasta('x'),getFileById:id=>({makeCopy:()=>{copias++;return {getId:()=>'DOCNOVO00000000000000000'+copias,getAs:()=>({setName:()=>({})})}},moveTo:()=>movidos.push(id),getBlob:()=>({getContentType:()=>'image/jpeg'})})};
ctx.DocumentApp={...ctx.DocumentApp,openById:()=>({getBody:()=>({getTables:()=>[{getCell:()=>cell()},{getCell:()=>cell()}],editAsText:()=>({getText:()=>'x',setForegroundColor(){}})}),saveAndClose(){}}),HorizontalAlignment:{CENTER:'c',JUSTIFY:'j'},VerticalAlignment:{CENTER:'c'}};
ctx.MimeType={PDF:'application/pdf'};ctx.Utilities.computeDigest=(_,v)=>[...crypto.createHash('sha256').update(v).digest()].map(b=>b>127?b-256:b);ctx.Utilities.DigestAlgorithm={SHA_256:1};ctx.Utilities.Charset={UTF_8:1};
email='social@example.com';assert.throws(()=>run("gerarFichaOficialCPT({protocolo:'ATD20260007'})"),/não gera/);
email='atd@example.com';r=run("gerarFichaOficialCPT({protocolo:'ATD20260007'})");assert.equal(r.gerada,true);assert.match(l7[15],/PDFNOVO/);
assert.ok(textos.includes('Morador Corrigido')&&textos.includes('(11) 3333-3333')&&textos.includes('Equipe vistoriou o local.')&&textos.includes('Atendimento em andamento.'),'modelo preenchido com os dados atuais');
assert.ok(textos.includes('Consórcio Performance Tamanduateí'));assert.deepEqual(movidos,[],'versão da pasta antiga fica onde está (a pasta antiga é apagada inteira depois)');
assert.ok(movs.rows.some(x=>x[3]==='Ficha oficial gerada'));
r=run("gerarFichaOficialCPT({protocolo:'ATD20260007'})");assert.equal(r.gerada,false,'sem mudança não refaz');assert.equal(copias,1);
assert.equal(run("abrirAtendimentoCPT('ATD20260007')").fichaAtualizada,true);
r=run("gerarFichaOficialCPT({protocolo:'ATD20260007',forcar:true})");assert.equal(r.gerada,true);assert.deepEqual(movidos.sort(),['DOCNOVO000000000000000001','PDFNOVO000000000000000001'],'versão anterior da pasta nova vai para Versões anteriores');
assert.equal(locked,false);
console.log('PASS: casos migrados mostram os dados da ficha antiga; correção com histórico sem expor contato; incorporação de protocolo; filtro por responsável com dias em aberto; ficha oficial no modelo, sem refazer à toa, e pacote do mês.');
}
// 2.13: atendimentos vêm 50 por vez (linhas ocupam menos espaço).
{const modelo=atd.rows.find(x=>x[0]==='ATD20260007');for(let i=0;i<60;i++){const r=modelo.slice();r[0]=r[1]='ATD2026'+String(500+i);r[2]='';r[3]='Em andamento';atd.rows.push(r);}
 const p1=run("buscarAtendimentosCPT({estado:'abertos'})");assert.equal(p1.itens.length,50,'primeira página com 50');assert.equal(p1.proximaPagina,1);
 const p2=run("buscarAtendimentosCPT({estado:'abertos',pagina:1})");assert.equal(p1.total-50,p2.itens.length,'segunda página com o resto');assert.equal(p2.proximaPagina,null);}
console.log('PASS: atendimentos 50 por vez.');
