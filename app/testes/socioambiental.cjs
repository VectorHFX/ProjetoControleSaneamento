// Socioambiental 2.6 com serviços Google simulados. node app/testes/socioambiental.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
let email='social@example.com',locked=false;
const props=new Map([['CPT_APLICACAO_1',JSON.stringify({baseId:'base',administrador:'victor@example.com',agendaId:'agenda',versao:'2.0.0'})],
  ['CPT_PESSOA:social@example.com',JSON.stringify({email:'social@example.com',nome:'Social',papeis:['socioambiental'],ativo:true,versao:1})],
  ['CPT_PESSOA:gestao@example.com',JSON.stringify({email:'gestao@example.com',nome:'Gestão',papeis:['gestao'],ativo:true,versao:1})],
  ['CPT_PESSOA:atd@example.com',JSON.stringify({email:'atd@example.com',nome:'Atd',papeis:['atendimento'],ativo:true,versao:1})]]);
class Sheet{constructor(n,rows=[]){this.name=n;this.rows=rows;}getName(){return this.name}getLastRow(){return this.rows.length}setFrozenRows(){}
  getRange(r,c,n=1,m=1){const s=this;const vals=()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.rows[r+i-1]?.[c+j-1]??''));let px;const api={getValues:vals,getValue:()=>vals()[0][0],
    setValues:v=>{v.forEach((row,i)=>{while(s.rows.length<r+i)s.rows.push([]);row.forEach((x,j)=>s.rows[r+i-1][c+j-1]=x)});return px},setValue:x=>api.setValues([[x]])};
    px=new Proxy(api,{get:(t,k)=>k in t?t[k]:()=>px});return px;}}
class Book{constructor(id,sheets){this.id=id;this.sheets=sheets}getId(){return this.id}getSheets(){return this.sheets}getSheetByName(n){return this.sheets.find(s=>s.name===n)||null}insertSheet(n){const a=new Sheet(n);this.sheets.push(a);return a}getSpreadsheetTimeZone(){return 'America/Sao_Paulo'}}
const colReg=['ID','Procedimento','Data do procedimento','Mês','Carimbo do envio','Origem','ID legado','Bairro','Bairro ID','Obra de referência','Obra ID','Responsável','Área','Atividade','Público informado','Protocolo informado','Situação do vínculo','Pesquisa','Conferência dos campos','Hash','Detalhes JSON'];
const id=i=>'REG-'+String(i).padStart(24,'a');
const reg=(i,proc,data,obra,ativ,pub,campos=[])=>[id(i),proc,new Date(data+'T12:00:00Z'),data.slice(0,7),'','4.0','','Vila Linda','BAI-001',obra,'','Resp','Social',ativ,pub,'','',ativ+' '+campos.map(c=>c.valor).join(' '),'','',JSON.stringify({campos})];
const registros=new Sheet('Registros',[colReg,
  reg(1,'Relato de atividade','2026-10-03','Coletor A [OBR-0001]','Ação Social Externa',40,[{titulo:'Complemento da atividade',valor:'Campanha de coleta de óleo de cozinha'}]),
  reg(2,'Relato de atividade','2026-10-04','Coletor A [OBR-0001]','Realização de CAO',22),
  reg(3,'Relato de atividade','2026-10-05','Não se aplica','DDS',12),
  reg(4,'Relato de atividade','2026-10-06','Coletor B [OBR-0002]','Sensibilização em frente de obra',30),
  reg(5,'Relato de atividade','2026-10-06','Coletor B [OBR-0002]','Atendimento em tenda',''),
  reg(6,'Diagnóstico de Área','2026-10-07','Coletor B [OBR-0002]','',''),
  reg(7,'Pesquisa de Satisfação','2026-10-07','','',''),
  reg(8,'Relato de atividade','2026-09-20','Coletor A [OBR-0001]','Sensibilização em frente de obra',5)]);
const colAtd=['Protocolo','Protocolo principal','Situação do protocolo','Status','Data de abertura','Data de conclusão','Nome','Assunto','Endereço','Frente de obra','Área responsável','Responsável','Próxima ação','Atualização operacional','Documento','PDF','Origem','Pesquisa','Hash','Detalhes JSON'];
const atd=new Sheet('Atendimentos',[colAtd,['ATD1','ATD1','','Recebida',new Date('2026-10-02T12:00:00Z'),'','X','A','','','Atendimento','','','','','','','','','{}'],
  ['ATD2','ATD2','','Concluída',new Date('2026-09-02T12:00:00Z'),new Date('2026-10-03T12:00:00Z'),'Y','B','','','Atendimento','','','','','','','','','{}']]);
const books=new Map([['base',new Book('base',[registros,atd,new Sheet('Início')])],['agenda',new Book('agenda',[])]]);const cache=new Map();
const ctx={Date,console:{log(){}},JSON,Session:{getActiveUser:()=>({getEmail:()=>email})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>Object.fromEntries(props),getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
  SpreadsheetApp:{openById:i=>{if(!books.has(i))throw Error('Não existe');return books.get(i)}},
  CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)}),getUserCache:()=>({get:()=>null,put(){}})},
  Utilities:{DigestAlgorithm:{SHA_256:1},computeDigest:(_,v)=>[...crypto.createHash('sha256').update(v).digest()],getUuid:()=>crypto.randomUUID(),formatDate:(d,_,f)=>{const s=new Date(d.getTime()-3*3600e3).toISOString();return f==='yyyy-MM'?s.slice(0,7):f==='yyyy-MM-dd'?s.slice(0,10):s.slice(0,16)}},
  LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},releaseLock:()=>locked=false})}};
vm.createContext(ctx);
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','SocioambientalCPT','PerfisCPT','CronogramaCPT','ObservacoesCPT','ObrasCPT','RelatorioMensalCPT','AplicacaoCPT','EntregasCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx)));

// 1. Destino de cada atividade (regra confirmada em 02/10).
const destino=(p,a,t='')=>run(`SocioambientalCPT.destino(${JSON.stringify(p)},${JSON.stringify(a)},${JSON.stringify(t)})`);
assert.equal(destino('Relato de atividade','Ação Social Externa','Coleta de óleo'),'4.2');
assert.equal(destino('Relato de atividade','Ação Social Externa','Combate à dengue'),'4.3');
assert.equal(destino('Relato de atividade','Ação Social Externa','Tapete pedagógico no CRAS'),'4.4');
assert.equal(destino('Relato de atividade','Realização de CAO'),'4.1');
assert.equal(destino('Relato de atividade','Realização de CAO','com lideranças e comerciantes'),'4.5');
assert.equal(destino('Relato de atividade','Articulação Institucional'),'4.5');
assert.equal(destino('Relato de atividade','DDS'),'9');assert.equal(destino('Relato de atividade','Ação Social Interna','Campanha do agasalho'),'9');
assert.equal(destino('Relato de atividade','Atendimento em tenda'),'7');assert.equal(destino('Relato de atividade','Sensibilização em frente de obra','Apoio da Tenda'),'7');
assert.equal(destino('Relato de atividade','Sensibilização em frente de obra'),'3');assert.equal(destino('Relato de atividade','Levantamento de traçado'),'3');
assert.equal(destino('Relato de atividade','Captação de conteúdo'),'5');assert.equal(destino('Diagnóstico de Área',''),'2');
assert.equal(destino('Pesquisa de Satisfação',''),null);assert.equal(destino('Relato de atividade','Atendimento de manifestação'),null);
console.log('PASS: destino no relatório — Ação Social Externa por eixo (4.2/4.3/4.4), CAO 4.1/4.5, articulação 4.5, DDS e internas 9, tenda 7, consolidadas 3, diagnóstico 2.');

// 2. Mesa do mês.
email='atd@example.com';assert.throws(()=>run("carregarMesaSocioambientalCPT('2026-10')"),/mesa socioambiental está disponível/);
email='social@example.com';let m=run("carregarMesaSocioambientalCPT('2026-10')");
assert.equal(m.totais.acoes,5);assert.equal(m.totais.pessoas,104);assert.equal(m.totais.semPublico,1);assert.equal(m.totais.frentes,2,'Não se aplica não é frente');assert.equal(m.totais.diagnosticos,1);assert.equal(m.totais.pesquisas,1);
assert.match(m.totais.frase,/^Foram contabilizadas 5 ações socioambientais, totalizando 104 pessoas alcançadas\.$/);
const g=i=>m.grupos.find(x=>x.item===i);assert.equal(g('4.2').itens[0].id,id(1));assert.equal(g('4.1').itens[0].id,id(2));assert.equal(g('9').itens[0].id,id(3));assert.equal(g('7').itens[0].id,id(5));assert.equal(g('2').itens[0].id,id(6));
assert.equal(g('4.3').itens.length,0);assert.match(g('4.3').vazio,/doenças de veiculação hídrica/,'eixo vazio traz o parágrafo padrão');
assert.equal(m.frentes[0].frente,'Coletor A');assert.equal(m.frentes.at(-1).semObra,true);assert.equal(m.totais.proprios,5);assert.equal(m.totais.prontos,0);
console.log('PASS: mesa do mês com frase de totais do item 3, frentes sem "não se aplica", grupos por item e parágrafo padrão nos eixos vazios.');

// 3. Diagnóstico: ficha pré-preenchida, síntese da Gestão, 24 campos e até 12 fotos.
const fotos=n=>Array.from({length:n},(_,i)=>({id:'FOTO'+String(i).padStart(12,'0'),titulo:'Fotos do diagnóstico'}));
ctx.fontes={[id(6)]:{registro:{id:id(6),procedimento:'Diagnóstico de Área',data:'2026-10-07',bairro:'Vila Linda',obra:'Coletor B [OBR-0002]'},
  campos:[{titulo:'Quantidade de Imóveis Residênciais no Traçado',valor:'48'},{titulo:'Índice Paulista de Vulnerabilidade Social — IPVS',valor:'5'},{titulo:'Relato do Diagnóstico',valor:'Rua estreita com comércio.'},
    {titulo:'Foram identificadas lideranças no território?',valor:'Sim'},{titulo:'Onde encontrar essas lideranças?',valor:'Associação de bairro'},{titulo:'Tráfego de Veículos:',valor:'Intenso'}],anexos:fotos(14)},
  [id(1)]:{registro:{id:id(1),procedimento:'Relato de atividade',atividade:'Ação Social Externa',data:'2026-10-03',bairro:'Vila Linda',obra:'Coletor A'},campos:[{titulo:'Complemento da atividade',valor:'Campanha de óleo'}],anexos:fotos(8)}};
vm.runInContext('DadosDaAplicacao.prototype.detalhe=function(i){if(!fontes[i])throw Error("não encontrado");return fontes[i];}',ctx);
email='gestao@example.com';let d=run(`carregarEntregaRelatoCPT('${id(6)}')`);
assert.equal(d.tipo,'diagnostico');assert.equal(d.limite,12);assert.equal(d.campos.length,24);assert.equal(d.sugestao.oficiais.residencias,'48');assert.equal(d.sugestao.oficiais.ipvs,'5');
assert.equal(d.sugestao.oficiais.liderancas,'Sim · Associação de bairro');assert.equal(d.sugestao.oficiais.veiculos,'Intenso','título com pontuação final reconhecido');assert.equal(d.sugestao.oficiais.frente,'Coletor B');
assert.match(d.sugestao.textoBase,/^REGISTRO DE CAMPO\nRua estreita com comércio\./);assert.match(d.sugestao.textoBase,/MORADIA E CIRCULAÇÃO/);
ctx.p={id:id(6),versao:0,fonteHash:d.hash,titulo:'Diagnóstico local: Coletor B',texto:'Síntese da Gestão.',encaminhamentos:'Tenda na esquina.',situacao:'revisao',oficiais:{...d.sugestao.oficiais,impacto:'Alto',extra:'ignorado'},fotos:fotos(13).map(f=>({id:f.id,legenda:''})),operacaoId:'OP-diagnostico000001'};
assert.throws(()=>run('salvarEntregaRelatoCPT(p)'),/doze/);ctx.p.fotos=ctx.p.fotos.slice(0,12);
let s=run('salvarEntregaRelatoCPT(p)');assert.equal(s.entrega.tipo,'diagnostico');assert.equal(s.entrega.oficiais.impacto,'Alto');assert(!('extra' in s.entrega.oficiais));assert.equal(s.entrega.encaminhamentos,'Tenda na esquina.');
ctx.p={...ctx.p,versao:1,situacao:'pronto',operacaoId:'OP-diagnostico000002'};run('salvarEntregaRelatoCPT(p)');
// 4. Relato: destino escolhido pela equipe vence a sugestão; até 6 fotos.
email='social@example.com';d=run(`carregarEntregaRelatoCPT('${id(1)}')`);assert.equal(d.tipo,'relato');assert.equal(d.sugestao.destino,'4.2');assert(d.destinos.some(x=>x.item==='9')&&!d.destinos.some(x=>x.item==='2'));
ctx.r={id:id(1),versao:0,fonteHash:d.hash,titulo:'Campanha de óleo',texto:'Narrativa.',situacao:'pronto',destino:'4.4',fotos:fotos(9).map(f=>({id:f.id,legenda:'03/10/2026 - Campanha - Vila Linda'})),quadro:{...d.sugestao.quadro,mediacao:'Equipe social',extra:'x'},operacaoId:'OP-relato00000000001'};
assert.throws(()=>run('salvarEntregaRelatoCPT(r)'),/oito/);ctx.r.fotos=ctx.r.fotos.slice(0,8);ctx.r.fotos[7].lista=true;ctx.r.destino='2';assert.throws(()=>run('salvarEntregaRelatoCPT(r)'),/Escolha em que item/);
assert.equal(d.sugestao.quadro.atividade,'Ação Social Externa · Campanha de óleo');assert.equal(d.sugestao.quadro.dataHorario,'03/10/2026');
ctx.r.destino='4.4';ctx.r.operacaoId='OP-relato00000000002';const sr=run('salvarEntregaRelatoCPT(r)').entrega;assert.equal(sr.destino,'4.4');assert.equal(sr.quadro.mediacao,'Equipe social');assert(!('extra' in sr.quadro));
assert.equal(sr.fotos[7].lista,true);assert.equal(sr.fotos[0].lista,false);
m=run("carregarMesaSocioambientalCPT('2026-10')");assert.equal(m.grupos.find(x=>x.item==='4.4').itens[0].situacao,'pronto');assert.equal(m.grupos.find(x=>x.item==='4.2').itens.length,0);
assert.equal(m.grupos.find(x=>x.item==='2').itens[0].situacao,'pronto');assert.equal(m.totais.prontos,2);assert.equal(locked,false);
console.log('PASS: diagnóstico com ficha pré-preenchida pelas respostas, texto-base por temas, campos oficiais filtrados e até 12 fotos; relato com destino escolhido, quadro do anexo e até 8 imagens (fotos e listas); mesa reflete o preparo.');

// 5. Visão do mês: números do relatório no lugar da contagem bruta.
const v=run("carregarInicioCPT({mes:'2026-10',atualizar:true})"),k=v.indicadores;
assert.equal(k.acoes,5);assert.equal(k.pessoas,104);assert.equal(k.frentes,2);assert.equal(k.diagnosticos,1);assert.equal(k.relatosSemPublico,1);assert.equal(k.recebidasNoMes,1);assert.equal(k.concluidosNoMes,1);assert.equal(k.abertos,1);
assert.equal(v.comparacao.anterior,1,'mês anterior compara ações');assert.equal(v.dias.reduce((n,x)=>n+x.quantidade,0),5,'gráfico conta só ações');
const dv=i=>v.destinos.find(x=>x.item===i);assert.equal(dv('4.4').prontos,1);assert.equal(dv('2').prontos,1);assert.equal(dv('4.3').quantidade,0);assert.equal(dv('3').quantidade,1);assert(!dv('5'),'item sem ação e consolidado não aparece');
assert.match(k.frase,/104 pessoas alcançadas/);
console.log('PASS: Visão do mês com ações, pessoas alcançadas, frentes, diagnósticos, balanço de manifestações e preparo por item; gráfico por dia só com ações.');

// 6. Modelo oficial do diagnóstico: confere a tabela antes de preencher; apresentação paginada.
const rotulos={0:['DIAGNÓSTICO LOCAL'],4:['INFORMAÇÕES DO ENTORNO DAS OBRAS'],5:['PERFIL SOCIOECONÔMICO','','OBSERVAÇÕES']};
vm.runInContext('DiagnosticoOficialCPT.campos',ctx).forEach(([_,r,c,t])=>{rotulos[r]=rotulos[r]||[];rotulos[r][c]=t;});
const tabela=extra=>({getNumRows:()=>23,getRow:r=>{const linha=Array.from({length:6},(_,c)=>(rotulos[r]||[])[c]||'');if(extra&&r===10)linha[5]='TEXTO DO EXEMPLO';return {getNumCells:()=>6,getCell:c=>({getText:()=>linha[c]})};}});
const doc=t=>({getBody:()=>({getTables:()=>[t]})});
ctx.ok=doc(tabela(false));ctx.ruim=doc(tabela(true));vm.runInContext('DiagnosticoOficialCPT.tabela(ok)',ctx);assert.throws(()=>vm.runInContext('DiagnosticoOficialCPT.tabela(ruim)',ctx),/texto fora dos campos/);
ctx.dup={getBody:()=>({getTables:()=>[tabela(false),tabela(false)]})};assert.throws(()=>vm.runInContext('DiagnosticoOficialCPT.tabela(dup)',ctx),/só a tabela oficial/);
const pg=run(`DocumentosSocioambientaisCPT.paginas({bairro:'Vila Linda',data:'2026-10-07'},{titulo:'Coletor B',texto:${JSON.stringify('palavra '.repeat(400))},encaminhamentos:'Tenda.',oficiais:{residencias:'48',ipvs:'5',endereco:'Rua A'},fotos:[{id:'F1',legenda:'Rua'},{id:'F2',legenda:'Fachada'}]})`);
assert.equal(pg[0].capa,true);assert.match(pg[0].texto,/07\/10\/2026/);assert(pg.some(p=>/continuação/.test(p.titulo)),'texto longo continua');assert(pg.some(p=>p.kpis&&p.kpis[0][1]==='48'));assert.equal(pg.filter(p=>p.foto!=null).length,2,'todas as fotos aparecem');
// 7. Relato no formato dos Anexos: página própria, faixa contornada, quadro de 6 linhas e listas de presença separadas.
const reg7=[];const chain=()=>new Proxy(function(){},{get:(_,k)=>k==='then'?undefined:k==='appendInlineImage'?()=>({getWidth:()=>800,getHeight:()=>600,setWidth(){return this},setHeight(){return this}}):chain,apply:()=>chain()});
const corpo={appendPageBreak:()=>reg7.push('QUEBRA'),appendParagraph:t=>{reg7.push('P:'+t);return chain();},appendTable:rows=>{reg7.push('T:'+rows.map(r=>r.join('|')).join('/'));return chain();}};
ctx.DocumentApp={ParagraphHeading:{HEADING2:2},HorizontalAlignment:{CENTER:'c',JUSTIFY:'j'}};ctx.corpo=corpo;ctx.ent=sr;
vm.runInContext("DocumentosSocioambientaisCPT.prototype.escreverRelato.call({},corpo,ent.registro,ent,ent.fotos.map(f=>({...f,blob:{}})),true)",ctx);
assert.equal(reg7[0],'QUEBRA','cada relato começa em página nova');assert.equal(reg7[1],'T:Relato da atividade');assert(reg7.some(x=>x.startsWith('T:Atividade|Ação Social Externa · Campanha de óleo/Local|')));
assert(reg7.includes('P:Registro fotográfico')&&reg7.includes('P:Listas de presença'),'listas em seção própria');assert(reg7.includes('P:Narrativa.'));
console.log('PASS: relato no formato dos Anexos (página própria, faixa, quadro de 6 linhas, objetivo, relato, fotos e listas de presença).');
console.log('PASS: modelo oficial conferido (23 linhas, rótulos, nada fora dos campos) e apresentação com capa, indicadores, continuação e todas as fotos.');
