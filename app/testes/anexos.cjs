// Anexos do relatório (2.39) com planilha simulada: Controle de manisfestações (dados oficiais das fichas, sem apagar nem
// reordenar, sem mexer em fórmula e formatação; novos no fim com a formatação da linha de cima) e linhas automáticas dos
// Indicadores 2026 (coluna do mês "mês.ano", nota de fonte, rótulo conferido, nunca meses antes da ativação). node app/testes/anexos.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
let email='victor@example.com',locked=false;
const props=new Map([['CPT_APLICACAO_1',JSON.stringify({baseId:'base',administrador:'victor@example.com',agendaId:'agenda-0123456789',versao:'2.39.0'})],
  ['CPT_CONECTORES',JSON.stringify({anexos:{id:'anexos'}})],
  ['CPT_PESSOA:adm@example.com',JSON.stringify({email:'adm@example.com',nome:'Adm',papeis:['administrativo'],ativo:true,versao:1})],
  ['CPT_PESSOA:atd@example.com',JSON.stringify({email:'atd@example.com',nome:'Atd',papeis:['atendimento'],ativo:true,versao:1})]]);
const fmt=(d,_,f)=>{const s=new Date(d.getTime()-3*3600e3).toISOString();return f.replace('yyyy',s.slice(0,4)).replace('MM',s.slice(5,7)).replace('dd',s.slice(8,10)).replace('HH',s.slice(11,13)).replace('mm',s.slice(14,16));};
class Sheet{constructor(n,rows=[]){this.name=n;this.rows=rows;this.notes={};this.formulas={};this.formato={};this.validacao={};this.max=Math.max(60,rows.length);}
  getName(){return this.name}getLastRow(){let n=this.rows.length;while(n&&!(this.rows[n-1]||[]).some(v=>v!==''&&v!=null))n--;return n}getLastColumn(){return Math.max(...this.rows.map(r=>r.length),1)}getMaxRows(){return this.max}insertRowsAfter(_,n){this.max+=n}setFrozenRows(){}appendRow(r){this.rows.push(r)}
  cel(r,c){return (this.rows[r-1]||[])[c-1]}
  getRange(r,c,n=1,m=1){const s=this,k=(i,j)=>(r+i)+':'+(c+j),mapa=f=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>f(i,j)));let px;
    const api={getValues:()=>mapa((i,j)=>s.rows[r+i-1]?.[c+j-1]??''),getValue:()=>api.getValues()[0][0],getNotes:()=>mapa((i,j)=>s.notes[k(i,j)]||''),getFormulas:()=>mapa((i,j)=>s.formulas[k(i,j)]||''),
      setValues:v=>{if(r+v.length-1>s.max)throw Error('linha além do fim da aba');v.forEach((row,i)=>{while(s.rows.length<r+i)s.rows.push([]);row.forEach((x,j)=>{if(typeof x==='string'&&x[0]==='='){s.formulas[k(i,j)]=x;return;}s.rows[r+i-1][c+j-1]=x;delete s.formulas[k(i,j)];})});return px},setValue:x=>api.setValues([[x]]),
      setNote:t=>{s.notes[k(0,0)]=t;return px},setNotes:v=>{v.forEach((row,i)=>row.forEach((t,j)=>s.notes[k(i,j)]=t));return px},offset:(a,b,nn,mm)=>s.getRange(r+a,c+b,nn,mm),
      copyTo:(dest,tipo)=>{dest.celulas().forEach(([rr,cc])=>{const o=s.formato[r+':'+cc];if(tipo==='FMT')s.formato[rr+':'+cc]=o;else s.validacao[rr+':'+cc]=s.validacao[r+':'+cc];});return px},
      celulas:()=>mapa((i,j)=>[r+i,c+j]).flat()};
    px=new Proxy(api,{get:(t,kk)=>kk in t?t[kk]:()=>px});return px;}}
class Book{constructor(id,sheets){this.id=id;this.sheets=sheets}getId(){return this.id}getSheets(){return this.sheets}getSheetByName(n){return this.sheets.find(s=>s.name===n)||null}insertSheet(n){const a=new Sheet(n);this.sheets.push(a);return a}getSpreadsheetTimeZone(){return 'America/Sao_Paulo'}}
// ---- datas relativas a hoje ----
const hoje=fmt(new Date(),0,'yyyy-MM-dd'),M=hoje.slice(0,7),P=(()=>{const d=new Date(M+'-15T12:00:00Z');d.setUTCMonth(d.getUTCMonth()-1);return d.toISOString().slice(0,7)})();
const dia=s=>new Date(s+'T15:00:00Z'),dM=n=>M+'-0'+n;
// ---- base ----
const cab=['Protocolo','Protocolo principal','Situação do protocolo','Status','Data de abertura','Data de conclusão','Nome','Assunto','Endereço','Frente de obra','Área responsável','Responsável','Próxima ação','Atualização operacional','Documento','PDF','Origem','Pesquisa','Hash','Detalhes JSON'];
const caso=(n,abre,fecha,{tipo='Reclamação',canal='Atendimento itinerante',local='',nome='Morador '+n,proc,status,principal,solucao='',fim=''}={})=>{const p='ATD2026'+String(n).padStart(4,'0');
  return [p,principal||p,'',status||(fecha?'Concluído':'Em andamento'),dia(abre),fecha?dia(fecha):'',nome,'Assunto '+n,'Rua '+n,'Coletor A [OBR-0001]','Atendimento','Atd','','','','','CAC','','',
    JSON.stringify({aberturas:[{campos:{'Nome do solicitante':nome,'Solicitação':'Pedido '+n,'Tipo de manifestação':tipo,'Canal de recebimento':canal,'Local':local}}],procedencia:proc,...(solucao?{corrigido:{solucaoAnterior:solucao}}:{}),...(fim?{conclusao:fim}:{})})];};
const atd=new Sheet('Atendimentos',[cab,
  caso(1,'2026-03-04',P+'-10',{fim:'Calçada refeita.'}),             // já na planilha com nota; mudou
  caso(2,'2026-03-19',''),                                          // linha antiga sem nota, igual pelo conteúdo
  caso(3,dM(2),'',{tipo:'Solicitação',canal:'Tenda'}),               // novo
  caso(4,dM(3),'',{tipo:'Elogio',local:'UMS Vila Linda',proc:'Não procedente'}), // novo
  caso(5,dM(4),'',{nome:''}),                                       // sem nome: fora do Controle (conta nos indicadores)
  caso(6,'2026-04-01',''),                                          // reaberto: Concluído na planilha
  caso(7,dM(5),'',{principal:'ATD20260003'})]);                     // incorporado: fora
const colReg=['ID','Procedimento','Data do procedimento','Mês','Carimbo do envio','Origem','ID legado','Bairro','Bairro ID','Obra de referência','Obra ID','Responsável','Área','Atividade','Público informado','Protocolo informado','Situação do vínculo','Pesquisa','Conferência dos campos','Hash','Detalhes JSON'];
const reg=(i,proc,ativ,pub,campos=[])=>['REG-'+String(i).padStart(24,'a'),proc,dia(dM(2)),M,'','4.0','','Vila Linda','BAI-001','Coletor A [OBR-0001]','OBR-0001','Resp','Social',ativ,pub,'','','','','h'+i,JSON.stringify({campos})];
const registros=new Sheet('Registros',[colReg,reg(1,'Relato de atividade','Sensibilização em frente de obra',12,[{titulo:'Quantidade de panfletos entregues',valor:'40'}]),
  reg(2,'Relato de atividade','Ação Social Externa',8,[{titulo:'Quantidade de panfletos entregues',valor:'1.200'},{titulo:'Ferramenta',valor:'Tenda, Panfleto'}]),reg(3,'Acompanhamento de Vistoria Cautelar','',''),reg(4,'Acompanhamento de Vistoria Cautelar','','')]);
const base=new Book('base',[registros,atd,new Sheet('Movimentações',[['ID']])]),agenda=new Book('agenda-0123456789',[]);
// ---- planilha oficial ----
const ctl=new Sheet('Controle de manisfestações',[['Data','Nome','Endereço','Canal','Tipo de Manifestação','Frente de obra','Histórico','Providência','Status','Obs.:']]);
const ind=new Sheet('Indicadores 2026',Array.from({length:45},()=>Array(21).fill('')));
const rot={9:'Maninfestações abertas',10:'Solicitação',11:'Reclamação',12:'Elogio',13:'Concluídas ',14:'Não procedente',15:'Total de parceiros ',28:'Total de participantes em ações de Educação Socioambiental',29:'Total de ações socioambientais',31:'Total de comunicados entregues para vistoria cautelar',32:'Publicações na mídia (jornal, rádio, TV, rede social e sites) ',33:'Ferramentas de comunicação social criadas (Cartaz, folder)',34:'Total de materias impressos entregues para a população',43:'Total de atendimentos'};
Object.entries(rot).forEach(([l,t])=>ind.rows[l-1][1]=t);ind.rows[2][1]='Indicadores';
// Linha 3: agosto/2025 a dezembro/2026 como datas cujo dia é o ano (25/08/2026 = "08.25").
for(let i=0;i<17;i++){const m=(7+i)%12+1,a=i<5?25:26;ind.rows[2][2+i]=new Date(Date.UTC(2026,m-1,a,3));}ind.rows[2][19]='Acumulado';
const colM=3+[...Array(17).keys()].find(i=>{const m=(7+i)%12+1,a=i<5?2025:2026;return a+'-'+String(m).padStart(2,'0')===M});
const anexos=new Book('anexos',[ind,ctl,new Sheet('Matriz de Contatos',[['','Matriz de Contatos'],['','LIDERANÇAS LOCAIS'],['','NOME/FUNÇÃO/CARGO','PESSOA DE CONTATO','ENDEREÇO','TELEFONE','EMAIL','OBSERVAÇÃO','ATUALIZAÇÃO'],
  ['','Líder A','Pessoa A','Rua 1','1111'],['','Líder B','','','2222'],['','ESCOLAS'],['','NOME ','PESSOA DE CONTATO','ENDEREÇO','TELEFONE','EMAIL','OBSERVAÇÃO','ATUALIZAÇÃO'],['','Escola C','Diretora','Rua 3'],['','Só nome'],['','Novo contato']])]);
const books=new Map([['base',base],['agenda-0123456789',agenda],['anexos',anexos]]),cacheMap=new Map();
const ctx={Date,console:{log(){},warn(){},error(){}},JSON,
  Session:{getActiveUser:()=>({getEmail:()=>email})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>Object.fromEntries(props),getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
  SpreadsheetApp:{openById:id=>{if(!books.has(id))throw Error('Não existe');return books.get(id)},CopyPasteType:{PASTE_FORMAT:'FMT',PASTE_DATA_VALIDATION:'DV'}},
  DriveApp:{getFileById:()=>({getMimeType:()=>'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})},MimeType:{GOOGLE_SHEETS:'application/vnd.google-apps.spreadsheet'},
  CacheService:{getScriptCache:()=>({get:k=>cacheMap.get(k)||null,put:(k,v)=>cacheMap.set(k,v),remove:k=>cacheMap.delete(k)}),getUserCache:()=>({get:()=>null,put(){}})},
  Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:fmt,computeDigest:(_,v)=>[...crypto.createHash('sha256').update(v).digest()].map(b=>b>127?b-256:b),DigestAlgorithm:{SHA_256:1},Charset:{UTF_8:1}},
  LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},releaseLock:()=>locked=false})}};
vm.createContext(ctx);
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','SocioambientalCPT','PerfisCPT','ObrasDoDiaCPT','CicloAtendimentoCPT','FichaOficialCPT','ColecaoCPT','ComunicacaoCPT','RelatosCPT','PaineisGestaoCPT','ConectoresCPT','AplicacaoCPT','AnexosCPT','RotinaCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx)));
// Linhas que já estão na planilha: caso 1 (com nota, histórico velho, Obs. com fórmula), caso 2 (igual, sem nota), uma linha à mão e o caso 6 concluído.
const val=n=>vm.runInContext("new AnexosCPT(AplicacaoCPT.contexto()).fichas()",ctx).find(x=>x.id==='ATD2026000'+n).valores.slice();
const v1=val(1);v1[6]='Histórico antigo';v1[8]='Em andamento';ctl.rows.push(v1);ctl.notes['2:1']='\nCPT_ATD_ID=ATD20260001\n======';ctl.formulas['2:10']='=X1';ctl.rows[1][9]='valor da fórmula';
ctl.rows.push(val(2));const manual=[dia('2026-02-01'),'Escrito à mão','Rua M','CAC Canteiro','Outros','Social','Texto manual','Prov','Concluído','Obs'];ctl.rows.push(manual.slice());
const v6=val(6);v6[8]='Concluído';ctl.rows.push(v6);ctl.notes['5:1']='CPT_ATD_ID=ATD20260006';
for(let c=1;c<=10;c++)ctl.formato['5:'+c]='fmt-linha5';ctl.validacao['5:5']='lista-tipos';
// Materiais do mês (pelo próprio módulo): 1 publicação e 1 impresso concluídos; 1 a fazer (não conta).
for(const m of [{titulo:'Post',tipo:'Publicação em rede social',situacao:'concluido',publicadoEm:dM(3)},{titulo:'Folder',tipo:'Material impresso',situacao:'concluido',publicadoEm:dM(3),quantidade:'300'},{titulo:'Vídeo',tipo:'Vídeo',situacao:'afazer'}]){ctx.m=m;ctx.m.operacaoId='OP-'+crypto.randomUUID();run("ColecaoCPT.executar('t',c=>new MateriaisCPT(c).salvar(m),true)");}

// 1. Permissão: só Gestão e Administrativo.
email='atd@example.com';assert.throws(()=>run('conferirAnexosCPT()'),/Gestão e o Administrativo/);assert.throws(()=>run('atualizarAnexosCPT()'),/Gestão e o Administrativo/);
// 2. Conferir: mostra tudo e não grava nada.
email='adm@example.com';const antes=JSON.stringify([ctl.rows,ctl.notes,ind.rows]);let r=run('conferirAnexosCPT()');
assert.equal(JSON.stringify([ctl.rows,ctl.notes,ind.rows]),antes,'conferir não grava');assert.equal(r.gravado,false);assert.equal(cfgDesde(),undefined,'conferir não ativa');
function cfgDesde(){return JSON.parse(props.get('CPT_APLICACAO_1')).anexosDesde;}
assert.deepEqual(r.controle.novos,['ATD20260003','ATD20260004']);assert.deepEqual(r.controle.atualizados.sort(),['ATD20260001','ATD20260006']);assert.equal(r.controle.marcados,1,'caso 2 só ganha a nota');assert.equal(r.controle.semNome,1);
assert.match(r.controle.avisos[0],/ATD20260006 foi reaberto/);
const im=r.indicadores.find(x=>x.mes===M);assert.equal(im.coluna,colM);const v=k=>im.linhas.find(x=>x.linha===k).valor;
assert.deepEqual([9,10,11,12,13,14,15,31,32,33,34,43].map(v),[3,1,1,1,0,1,3,2,1,1,1240,8],'manifestações (o caso 5 é Reclamação), contatos da Matriz, tenda pelas pessoas das ações com Tenda, vistorias, materiais, panfletos e tenda/UMS');
const vis=run(`new DadosDaAplicacao(planilhaCPT_('base'),{papeis:['administrador']}).inicio('${M}',true).indicadores`);assert.equal(v(28),vis.pessoas);assert.equal(v(29),vis.acoes);assert.equal(v(28),20);
// 3. Atualizar: grava, ativa a partir deste mês e guarda o resumo.
r=run('atualizarAnexosCPT()');assert.equal(cfgDesde(),M);assert.ok(props.get('CPT_ANEXOS_ULTIMA'));assert.equal(locked,false);assert.equal(cacheMap.get('CPT_ANEXOS_LOTE'),undefined);
// Controle: nada apagado nem reordenado; caso 1 atualizado com a fórmula intacta; linha à mão igual; novos no fim, com nota e formatação.
assert.equal(ctl.rows[1][6],'Pedido 1');assert.equal(ctl.rows[1][8],'Concluído');assert.equal(ctl.formulas['2:10'],'=X1','fórmula preservada');assert.equal(ctl.rows[1][9],'valor da fórmula');
assert.equal(ctl.notes['2:1'],'\nCPT_ATD_ID=ATD20260001\n======','nota existente não é reescrita');assert.equal(ctl.notes['3:1'],'CPT_ATD_ID=ATD20260002');
assert.deepEqual(ctl.rows[3],manual,'linha escrita à mão continua igual');assert.equal(ctl.rows[4][8],'Em andamento','reaberto volta para Em andamento no lugar');
assert.deepEqual(ctl.rows.slice(5).map(x=>x[1]),['Morador 3','Morador 4']);assert.equal(ctl.notes['6:1'],'CPT_ATD_ID=ATD20260003');assert.equal(ctl.notes['7:1'],'CPT_ATD_ID=ATD20260004');
assert.equal(ctl.rows[5][3],'Tenda');assert.equal(ctl.rows[5][4],'Solicitação');assert.equal(ctl.rows[5][5],'Coletor A');assert.equal(ctl.formato['7:3'],'fmt-linha5','nova linha com a formatação da linha de cima');assert.equal(ctl.validacao['6:5'],'lista-tipos');
assert.ok(!ctl.rows.some(x=>x[1]==='Morador 5'),'sem nome fica fora');
// Indicadores: coluna do mês preenchida com nota de fonte; outras colunas e linhas manuais intactas.
assert.equal(ind.rows[8][colM-1],3);assert.equal(ind.rows[33][colM-1],1240);assert.match(ind.notes['34:'+colM],/^CPT: automático · Fonte: panfletos entregues/);
assert.equal(ind.rows[14][colM-1],3,'linha 15 = contatos da Matriz (seção e linha só com nome não contam)');assert.equal(anexos.getSheetByName('Matriz de Contatos').rows.length,10,'Matriz não é alterada');assert.equal(ind.rows[8][colM-2]||'','','mês anterior não é tocado (antes da ativação)');
// 4. De novo: nada muda (nem notas).
r=run('atualizarAnexosCPT()');assert.deepEqual([r.controle.novos.length,r.controle.atualizados.length,r.controle.marcados],[0,0,0]);assert.equal(r.indicadores[0].linhas.filter(x=>x.situacao==='muda').length,0);
assert.equal(ctl.rows.length,7);
// 5. Segurança da planilha: rótulo mudou de lugar → linha pulada; fórmula → não tocada; coluna do mês sumiu → avisa.
ind.rows[11][1]='Outra coisa';ind.formulas['13:'+colM]='=1+1';atd.rows.push(caso(8,dM(6),'',{tipo:'Elogio'}),caso(9,dM(6),P+'-01',{}));
r=run('atualizarAnexosCPT()');const l=k=>r.indicadores[0].linhas.find(x=>x.linha===k);
assert.equal(l(12).situacao,'pulada');assert.match(l(12).aviso,/Rótulo diferente/);assert.equal(ind.rows[11][colM-1],1,'linha com rótulo trocado não é escrita');assert.equal(l(13).situacao,'formula');assert.equal(l(9).valor,5);
// Duplicidade na planilha: para tudo antes de gravar.
ctl.notes['8:1']='CPT_ATD_ID=ATD20260003';ctl.rows.push(ctl.rows[5].slice());assert.throws(()=>run('atualizarAnexosCPT()'),/aparece em duas linhas/);ctl.rows.pop();delete ctl.notes['8:1'];
// 6. Quais meses: o atual e, até o dia 10, o anterior; nunca antes da ativação.
assert.deepEqual(run("AnexosCPT.mesesParaGravar('2026-11-05','2026-10')"),['2026-10','2026-11']);assert.deepEqual(run("AnexosCPT.mesesParaGravar('2026-11-11','2026-10')"),['2026-11']);
assert.deepEqual(run("AnexosCPT.mesesParaGravar('2026-10-05','2026-10')"),['2026-10']);
assert.equal(run("AnexosCPT.mesDaCelula('10.26','America/Sao_Paulo')"),'2026-10');assert.equal(run("AnexosCPT.mesDaCelula(new Date(Date.UTC(2026,7,25,3)),'America/Sao_Paulo')"),'2025-08');
// 7. Planilha em Excel no Drive: mensagem clara.
props.set('CPT_CONECTORES',JSON.stringify({anexos:{id:'xlsx-no-drive'}}));assert.throws(()=>run('conferirAnexosCPT()'),/Salvar como Planilhas Google/);
{const c=JSON.parse(props.get('CPT_APLICACAO_1'));delete c.anexosDesde;props.set('CPT_APLICACAO_1',JSON.stringify(c));assert.throws(()=>run('atualizarAnexosCPT()'),/Planilhas Google/);assert.equal(cfgDesde(),undefined,'falha não ativa');c.anexosDesde=M;props.set('CPT_APLICACAO_1',JSON.stringify(c));}props.set('CPT_CONECTORES',JSON.stringify({anexos:{id:'anexos'}}));
// O endereço antigo (Excel) salvo em Conectores é trocado pela Planilha Google.
props.set('CPT_CONECTORES',JSON.stringify({anexos:{id:'1Et4M0nr4CxlRj7J6EDoru91aC4PJ-G2Y'}}));assert.equal(run('AnexosCPT.id()'),'1Lxm4a6qs9XGwhGokUTYUBcOuCWQssOEWlOBsU3R3REc');props.set('CPT_CONECTORES',JSON.stringify({anexos:{id:'anexos'}}));
// 8. Rotina: passo dos Anexos depois das fichas.
email='victor@example.com';vm.runInContext("FichaOficialCPT.prototype.atualizarTodas=()=>({geradas:0,movidas:0,faltam:0,erros:[]})",ctx);
r=run('rotinaCPT()');assert.deepEqual(r.passos.map(p=>p.id),['fichas','anexos']);assert.equal(r.passos[1].ok,true);assert.match(r.passos[1].texto,/caso\(s\) novo\(s\)/);
console.log('PASS: anexos — Controle de manifestações (dados oficiais, nada apagado nem reordenado, fórmula e linha à mão intactas, reaberto avisado, novos no fim com formatação e nota) e Indicadores (coluna do mês, nota de fonte, rótulo e fórmula conferidos, sem mexer em meses anteriores à ativação), conferir sem gravar, duplicidade barrada, Excel avisado e passo na rotina.');
