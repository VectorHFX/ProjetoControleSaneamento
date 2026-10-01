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
vm.createContext(ctx);for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','PerfisCPT','CronogramaCPT','ObservacoesCPT','ObrasCPT','RelatorioMensalCPT','CicloAtendimentoCPT','AplicacaoCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx)));
// Obras: consulta para todos, edição só para Administrativo/Gestão.
email='social@example.com';let l=run('listarObrasCPT()');assert.equal(l.obras.length,2);assert.equal(l.podeEditar,false);assert.deepEqual(l.bairros,['Jardim','Vila Linda']);
ctx.p={id:'OBR-0002',atualizadoEm:'',nome:'Coletor B',situacao:'Em andamento',bairros:['Jardim'],noFormulario:true};assert.throws(()=>run('salvarObraCPT(p)'),/Administrativo ou pela Gestão/);
email='adm@example.com';let r=run('salvarObraCPT(p)');assert.match(r.resultado,/atualizada/);assert.equal(obras.rows[2][2],'Jardim');assert.equal(obras.rows[2][19],'Em andamento');assert.equal(obras.rows[2][34],'adm@example.com');assert.match(obras.rows[5][27],/^PENDENTE — alterado pela aplicação/);
assert.equal(obras.rows[0][31],'Tipo de obra');assert.throws(()=>run('salvarObraCPT(p)'),/alterada por outra pessoa/);
ctx.p={...ctx.p,atualizadoEm:r.obra.atualizadoEm,bairros:['Múltiplos bairros']};assert.throws(()=>run('salvarObraCPT(p)'),/não cadastrado/);
ctx.p={...ctx.p,bairros:[],situacao:'Finalizada'};assert.throws(()=>run('salvarObraCPT(p)'),/término/);
ctx.p={...ctx.p,publico:'Z'};assert.throws(()=>run('salvarObraCPT(p)'),/Público/);
ctx.n={nome:'Rede Nova',situacao:'Em andamento',bairros:['vila linda'],noFormulario:true,inicioObra:'2026-10-02',tipo:'Rede coletora',publico:'a, b',impacto:'Médio'};r=run('salvarObraCPT(n)');assert.equal(r.obra.id,'OBR-0003');assert.deepEqual(r.obra.bairros,['Vila Linda']);assert.equal(r.obra.publico,'A, B');
assert.throws(()=>run('salvarObraCPT(n)'),/mesmo nome|Já existe/);
ctx.c={id:'OBR-0001',atualizadoEm:run('listarObrasCPT()').obras.find(o=>o.id==='OBR-0001').atualizadoEm};r=run('confirmarObraCPT(c)');assert.equal(r.obra.situacao,'Em andamento');
assert.equal(books.get('agenda').getSheetByName('Histórico de obras').rows.length,4);assert.equal(locked,false);
console.log('PASS: obras consultáveis por todos, edição restrita, conflito de versão, bairros validados, nova obra com ID sequencial, revisão diária e marcação para o formulário.');
// Fechamento: conferência e geração.
email='atd@example.com';assert.throws(()=>run("conferirFechamentoCPT('2026-10')"),/fechamento do mês está disponível/);
email='social@example.com';const f=run("conferirFechamentoCPT('2026-10')");
assert.equal(f.numeros.atividades,2);assert.equal(f.numeros.participantes,15);assert.equal(f.numeros.satisfacao,2);assert.equal(f.numeros.casosAbertos,1);
assert.equal(f.satisfacao.semanas[0].de,'2026-10-01');assert.equal(f.satisfacao.semanas[0].parcial,true);assert.equal(f.satisfacao.semanas[1].total,1);
assert.equal(f.verificacoes.find(v=>/Público/.test(v.nome)).situacao,'pendente');
ctx.g={mes:'2026-10',numero:'15',operacaoId:'OP-geracao1234567890'};const g=run('gerarBaseRelatorioCPT(g)');assert.equal(g.versao,1);assert.match(g.documento,/document/);
const d=docs[0],texto=d.partes.join('\n');for(const item of ['1. Áreas de Trabalho','3. Atividades desenvolvidas no período','4.1 Reuniões','10. Manifestações Locais e Sabesp','12. Atividades previstas','13. Anexos'])assert(texto.includes(item),item);
assert(texto.includes('Relatório nº 15'));const t3=d.tabelas.find(t=>t[0][0]==='Frente de Serviço'&&t[0][1]==='Endereço da Frente');assert.equal(t3.length,6);assert(t3.slice(3,5).every(r=>r[3]==='*Não houve atividade'));assert.equal(t3[1][4],'Comunicado');assert.equal(t3[1][5],'Moradores');assert.match(t3[2][6],/COMPLETAR/);
assert.equal(t3[5][0],'Total');const t41=d.tabelas[d.tabelas.findIndex(t=>t[0][0]==='Data'&&t[0][2]==='Atividade')];assert.equal(t41.length,2);
const man=d.tabelas.find(t=>t[0][0]==='Data'&&t[0][1]==='Nome');assert.equal(man.length,2);assert.equal(man[1][8],'Em andamento');assert.equal(man[1][3],'Atendimento itinerante');assert.equal(man[1][4],'Reclamação');
assert.equal(run('gerarBaseRelatorioCPT(g)').versao,1);ctx.g.operacaoId='OP-geracao9999999999';assert.equal(run('gerarBaseRelatorioCPT(g)').versao,2);
assert.equal(run("conferirFechamentoCPT('2026-10')").historico.length,2);
assert.equal(f.numeroSugerido,15);assert.equal(run("conferirFechamentoCPT('2026-12')").numeroSugerido,17);
const apoio=[...books.values()].find(b=>b.getSheetByName('Indicadores — prévia'));assert(apoio,'planilha de apoio');const ind=apoio.getSheetByName('Indicadores — prévia').rows;
assert.equal(ind.find(r=>r[1]==='Total de ações socioambientais')[2],2);assert.equal(ind.find(r=>r[1]==='Total de comunidades mapeadas')[2],'Informar');
assert.deepEqual(JSON.parse(JSON.stringify(apoio.getSheetByName('Controle de manifestações').rows[0])),['Data','Nome','Endereço','Canal','Tipo de Manifestação','Frente de obra','Histórico','Providência','Status','Obs.:']);
console.log('PASS: numeração sugerida (15 em outubro), planilha de apoio com Controle de manifestações no formato oficial e prévia de indicadores.');
console.log('PASS: fechamento com metas semanais e mensal, pendências, documento nos 13 itens do Orientador, versões sem sobrescrever e geração idempotente.');

// Cache compartilhado e página com dados embutidos.
registros.rows.push(reg(9,'Relato de atividade','2026-10-07','','','Nova',5));books.get('base').sheets.push(new Sheet('Início'));
email='social@example.com';const i1=run("carregarInicioCPT('2026-10')");assert.equal(i1.cache,false);assert.equal(run("carregarInicioCPT({mes:'2026-10'})").cache,true);
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
email='social@example.com';let det;det=run("abrirAtendimentoCPT('ATD20260028')");assert.equal(det.pode.atualizar,false);assert.equal(det.pode.executar,false);assert.equal(det.abertura.telefone,'');assert.equal(det.abertura.contatoOculto,true);assert.equal(det.abertura.tipo,'Reclamação');
ctx.a={protocolo:'ATD20260028',versao:det.versao,operacaoId:'OP-atualiza000000001',status:'Em andamento',procedencia:'Procedente',area:'Execução',proximaAcao:'Reparar calçada',responsavel:'Equipe obra'};assert.throws(()=>run('atualizarAtendimentoCPT(a)'),/não permite/);
email='atd@example.com';det=run("abrirAtendimentoCPT('ATD20260028')");assert.equal(det.abertura.telefone,'(11) 0000-0000');r=run('atualizarAtendimentoCPT(a)');assert.match(r.resultado,/atualizado/);
assert.equal(atd.rows[3][3],'Em andamento');assert.equal(atd.rows[3][10],'Execução');assert.equal(movs.rows.length,2);assert.match(movs.rows[1][6],/Procedência: Em análise → Procedente/);
assert.equal(run('atualizarAtendimentoCPT(a)').repetida,true,'mesma operação não duplica');ctx.a.operacaoId='OP-atualiza000000002';assert.throws(()=>run('atualizarAtendimentoCPT(a)'),/outra pessoa/);
email='exe@example.com';det=run("abrirAtendimentoCPT('ATD20260028')");assert.equal(det.pode.executar,true);assert.equal(det.pode.finalizar,false);
ctx.f={protocolo:'ATD20260028',versao:det.versao,operacaoId:'OP-finaliza000000001',conclusao:'x',data:hojeT,procedencia:'Procedente'};assert.throws(()=>run('finalizarAtendimentoCPT(f)'),/não permite/);
ctx.e={protocolo:'ATD20260028',versao:det.versao,operacaoId:'OP-execucao000000001',feito:'Troca de 3 m² de piso.',data:'2099-01-01',executadoPor:'Equipe obra',evidencias:'https://drive.google.com/file/d/abc'};assert.throws(()=>run('registrarExecucaoCPT(e)'),/futura/);
ctx.e.data=hojeT;r=run('registrarExecucaoCPT(e)');assert.match(r.resultado,/Execução registrada/);assert.equal(atd.rows[3][12],'Conferir execução e finalizar ficha');assert.equal(movs.rows[2][3],'Execução');
email='atd@example.com';det=run("abrirAtendimentoCPT('ATD20260028')");ctx.f={...ctx.f,versao:det.versao,data:'2026-09-01'};assert.throws(()=>run('finalizarAtendimentoCPT(f)'),/antes da abertura/);
ctx.f.data=hojeT;ctx.f.procedencia='Em análise';assert.throws(()=>run('finalizarAtendimentoCPT(f)'),/Procedente ou Não procedente/);ctx.f.procedencia='Procedente';r=run('finalizarAtendimentoCPT(f)');
assert.equal(atd.rows[3][3],'Concluída');assert.equal(JSON.parse(atd.rows[3][19]).procedencia,'Procedente');assert.equal(movs.rows[3][3],'Finalização');
det=run("abrirAtendimentoCPT('ATD20260028')");assert.equal(det.ficha.concluido,true);ctx.e={...ctx.e,versao:det.versao,operacaoId:'OP-execucao000000002'};email='exe@example.com';assert.throws(()=>run('registrarExecucaoCPT(e)'),/concluído/);
email='atd@example.com';ctx.ra={protocolo:'ATD20260028',versao:det.versao,operacaoId:'OP-reabre0000000001',motivo:'Vazamento voltou',proximaAcao:'Nova vistoria'};run('reabrirAtendimentoCPT(ra)');assert.equal(atd.rows[3][3],'Em andamento');assert.equal(atd.rows[3][5],'');
assert.throws(()=>run("abrirAtendimentoCPT('ATD;DROP')"),/Protocolo inválido/);assert.equal(locked,false);
assert(Number(props.get('CPT_ATD_VERSAO'))>=4,'cache da Visão do mês invalidado a cada ação');
console.log('PASS: ciclo do caso — permissões por perfil (contato só para Atendimento/Execução), atualização com histórico, execução, finalização com regras, reabertura, idempotência e conflito.');
}
