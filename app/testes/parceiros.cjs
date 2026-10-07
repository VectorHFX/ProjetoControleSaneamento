// Programa Parceiros (2.41) com máscara simulada e dados fictícios: números automáticos na coluna do mês (bloco criado com a
// formatação do último), rótulo e fórmula conferidos, nota de fonte, médias das pesquisas, prompt sem nomes/telefones/e-mails
// e textos revisados gravados nas linhas 18 e 20 com quem e quando. node app/testes/parceiros.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
let email='adm@example.com',locked=false;
const props=new Map([['CPT_APLICACAO_1',JSON.stringify({baseId:'base',administrador:'victor@example.com',agendaId:'agenda-0123456789',versao:'2.41.0'})],['CPT_CONECTORES',JSON.stringify({parceiros:{id:'mascara'}})],
  ['CPT_PESSOA:adm@example.com',JSON.stringify({email:'adm@example.com',nome:'Adm',papeis:['administrativo'],ativo:true,versao:1})],
  ['CPT_PESSOA:social@example.com',JSON.stringify({email:'social@example.com',nome:'Social',papeis:['socioambiental'],ativo:true,versao:1})]]);
const fmt=(d,_,f)=>{const s=new Date(d.getTime()-3*3600e3).toISOString();return f.replace('yyyy',s.slice(0,4)).replace('MM',s.slice(5,7)).replace('dd',s.slice(8,10)).replace('HH',s.slice(11,13)).replace('mm',s.slice(14,16));};
class Sheet{constructor(n,rows=[]){this.name=n;this.rows=rows;this.notes={};this.formulas={};this.formato={};this.merges={};this.larg={};this.maxC=30;}
  getName(){return this.name}getLastRow(){return this.rows.length}getLastColumn(){return Math.max(...this.rows.map(r=>{let n=r.length;while(n&&(r[n-1]===''||r[n-1]==null))n--;return n;}),1)}getMaxColumns(){return this.maxC}insertColumnsAfter(_,n){this.maxC+=n}
  setColumnWidth(c,w){this.larg[c]=w}getColumnWidth(c){return this.larg[c]||100}setFrozenRows(){}appendRow(r){this.rows.push(r)}
  getRange(r,c,n=1,m=1){const s=this,k=(i,j)=>(r+i)+':'+(c+j),mapa=f=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>f(i,j)));let px;
    const api={getValues:()=>mapa((i,j)=>s.rows[r+i-1]?.[c+j-1]??''),getValue:()=>api.getValues()[0][0],getNotes:()=>mapa((i,j)=>s.notes[k(i,j)]||''),getFormulas:()=>mapa((i,j)=>s.formulas[k(i,j)]||''),getFormula:()=>s.formulas[k(0,0)]||'',
      setValues:v=>{v.forEach((row,i)=>{while(s.rows.length<r+i)s.rows.push([]);row.forEach((x,j)=>s.rows[r+i-1][c+j-1]=x)});return px},setValue:x=>api.setValues([[x]]),setNote:t=>{s.notes[k(0,0)]=t;return px},
      getMergedRanges:()=>s.merges[r+':'+c]?[{getNumColumns:()=>s.merges[r+':'+c]}]:[],
      copyTo:d=>{d.cel().forEach(([rr,cc],idx)=>{const i=Math.floor(idx/m),j=idx%m,o=(r+i)+':'+(c+j);s.formato[rr+':'+cc]=s.formato[o];s.notes[rr+':'+cc]=s.notes[o];while(s.rows.length<rr)s.rows.push([]);s.rows[rr-1][cc-1]=s.rows[r+i-1]?.[c+j-1]??'';if(s.merges[o])s.merges[rr+':'+cc]=s.merges[o];});return px},
      clearContent:()=>{api.cel().forEach(([rr,cc])=>{if(s.rows[rr-1])s.rows[rr-1][cc-1]='';});return px},clearNote:()=>{api.cel().forEach(([rr,cc])=>delete s.notes[rr+':'+cc]);return px},
      cel:()=>mapa((i,j)=>[r+i,c+j]).flat()};
    px=new Proxy(api,{get:(t,kk)=>kk in t?t[kk]:()=>px});return px;}}
class Book{constructor(id,sheets){this.id=id;this.sheets=sheets}getId(){return this.id}getSheets(){return this.sheets}getSheetByName(n){return this.sheets.find(s=>s.name===n)||null}insertSheet(n){const a=new Sheet(n);this.sheets.push(a);return a}getSpreadsheetTimeZone(){return 'America/Sao_Paulo'}}
const hoje=fmt(new Date(),0,'yyyy-MM-dd'),M=hoje.slice(0,7),dia=s=>new Date(s+'T15:00:00Z'),dM=n=>M+'-0'+n;
// ---- base ----
const cabA=['Protocolo','Protocolo principal','Situação do protocolo','Status','Data de abertura','Data de conclusão','Nome','Assunto','Endereço','Frente de obra','Área responsável','Responsável','Próxima ação','Atualização operacional','Documento','PDF','Origem','Pesquisa','Hash','Detalhes JSON'];
const caso=(n,abre,fecha,tipo,proc)=>{const p='ATD2026'+String(n).padStart(4,'0');return [p,p,'',fecha?'Concluído':'Em andamento',dia(abre),fecha?dia(fecha):'','Pessoa '+n,'Assunto','Rua','Coletor A','Atendimento','Atd','','','','','CAC','','',JSON.stringify({aberturas:[{campos:{'Nome do solicitante':'Pessoa '+n,'Solicitação':'Pedido','Tipo de manifestação':tipo}}],procedencia:proc})];};
const atd=new Sheet('Atendimentos',[cabA,caso(1,dM(1),dM(4),'Elogio'),caso(2,dM(2),'','Reclamação','Não procedente'),caso(3,dM(2),dM(8),'Reclamação'),caso(4,'2026-06-01',dM(3),'Solicitação'),caso(5,dM(3),'','Solicitação')]);
const colReg=['ID','Procedimento','Data do procedimento','Mês','Carimbo do envio','Origem','ID legado','Bairro','Bairro ID','Obra de referência','Obra ID','Responsável','Área','Atividade','Público informado','Protocolo informado','Situação do vínculo','Pesquisa','Conferência dos campos','Hash','Detalhes JSON'];
const reg=(i,proc,ativ,pub,campos)=>['REG-'+String(i).padStart(24,'b'),proc,dia(dM(2)),M,'','4.0','','Vila Linda','BAI-001','Coletor A [OBR-0001]','OBR-0001','Resp','Social',ativ,pub,'','','','','h'+i,JSON.stringify({consolidado:{campos}})];
const pesq=(i,nome,san,asp,mud,qual)=>reg(i,'Pesquisa de Satisfação','', '',{'Nome - Pesquisa de Satisfação':nome,'De 0 a 10, quanto está satisfeito com os serviços de saneamento de forma geral?':san,'De forma geral, quais aspectos observa sobre os serviços de saneamento?':asp,'Tem notado mudanças na qualidade de vida em relação ao saneamento de forma geral?':mud,'Se sim: De 0 a 10, quanto percebeu melhorias na qualidade de vida relacionadas ao saneamento?':qual});
const registros=new Sheet('Registros',[colReg,reg(1,'Relato de atividade','Sensibilização em frente de obra',12,{}),reg(2,'Relato de atividade','Articulação Institucional',30,{}),reg(3,'Relato de atividade','DDS',20,{}),
  pesq(4,'Maria Fictícia Souza','8','Água chega bem, Maria Fictícia elogia a equipe. Fone (11) 98888-7777','Sim','7'),pesq(5,'João Exemplo','6','Falta informação sobre a obra; escreva para joao@exemplo.com','Não',''),pesq(6,'Ana Teste','9','não','','')]);
const base=new Book('base',[registros,atd,new Sheet('Movimentações',[['ID']])]),agenda=new Book('agenda-0123456789',[]);
// ---- máscara: linha 2 com Junho (C..L mesclado), Julho (M..O), Agosto (P..R) ----
const rot={3:'Número de economias realizadas no período',8:'Número de reuniões, abertas à comunidade, (podendo ser reuniões de informe de obras)',9:'Número total de pessoas presentes nas reuniões abertas à comunidade',
  17:'De 0 a 10, quanto as pessoas estão satisfeitas com os serviços de saneamento? Média de todas as respostas.',18:'Transcreva os depoimentos dos participantes sobre os serviços de saneamento.',
  19:'De 0 a 10, quanto as pessoas percebem melhorias em sua qualidade de vida? Média de todas as respostas.',20:'Transcreva os depoimentos dos participantes sobre a qualidade de vida',
  23:'Número de entradas de manifestações do tipo elogio.',24:'Número de manifestações concluídas do tipo elogio.',25:'Número de entradas de manifestações do tipo solicitação.',26:'Número de manifestações concluídas do tipo solicitação.',
  27:'Número de entradas de manifestações do tipo reclamação.',28:'Número de manifestações concluídas do tipo reclamação.',29:'Número de manifestações (reclamações) Não Procedentes.',31:'Qual o prazo médio de atendimento dessas manifestações (em dias)?',32:'Número de publicações na mídia (jornal, rádio, TV, sites e redes sociais)'};
const masc=new Sheet('Sheet1',Array.from({length:92},()=>Array(18).fill('')));Object.entries(rot).forEach(([l,t])=>masc.rows[l-1][1]=t);masc.rows[2][2]=0;
[[3,'Junho',10],[13,'Julho',3],[16,'Agosto',3]].forEach(([c,n,w])=>{masc.rows[1][c-1]=n;masc.merges['2:'+c]=w;for(let r=2;r<=92;r++)masc.formato[r+':'+c]='fmt-'+n;});masc.larg[16]=140;masc.notes['8:16']='nota de agosto';
const books=new Map([['base',base],['agenda-0123456789',agenda],['mascara',new Book('mascara',[masc])]]),cacheMap=new Map();
const ctx={Date,console:{log(){},warn(){},error(){}},JSON,Session:{getActiveUser:()=>({getEmail:()=>email})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>Object.fromEntries(props),getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
  SpreadsheetApp:{openById:id=>{if(!books.has(id))throw Error('Não existe');return books.get(id)}},DriveApp:{getFileById:()=>({getMimeType:()=>'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})},MimeType:{GOOGLE_SHEETS:'application/vnd.google-apps.spreadsheet'},
  CacheService:{getScriptCache:()=>({get:k=>cacheMap.get(k)||null,put:(k,v)=>cacheMap.set(k,v),remove:k=>cacheMap.delete(k)}),getUserCache:()=>({get:()=>null,put(){}})},
  Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:fmt,computeDigest:(_,v)=>[...crypto.createHash('sha256').update(v).digest()].map(b=>b>127?b-256:b),DigestAlgorithm:{SHA_256:1},Charset:{UTF_8:1}},
  LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},releaseLock:()=>locked=false})}};
vm.createContext(ctx);
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','SocioambientalCPT','PerfisCPT','ObrasDoDiaCPT','CicloAtendimentoCPT','FichaOficialCPT','ColecaoCPT','ComunicacaoCPT','RelatosCPT','PaineisGestaoCPT','ConectoresCPT','AplicacaoCPT','AnexosCPT','ParceirosCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx)));
ctx.m={titulo:'Post',tipo:'Publicação em rede social',situacao:'concluido',publicadoEm:dM(3),operacaoId:'OP-'+crypto.randomUUID()};run("ColecaoCPT.executar('t',c=>new MateriaisCPT(c).salvar(m),true)");

// 1. Permissão.
email='social@example.com';assert.throws(()=>run(`carregarParceirosCPT({mes:'${M}'})`),/Gestão e o Administrativo/);assert.throws(()=>run('atualizarParceirosCPT()'),/Gestão e o Administrativo/);
// 2. Carregar: confere sem gravar (o bloco do mês ainda não existe).
email='adm@example.com';const antes=JSON.stringify(masc.rows);let r=run(`carregarParceirosCPT({mes:'${M}'})`);assert.equal(JSON.stringify(masc.rows),antes,'carregar não grava');
const m0=r.numeros.meses.find(x=>x.mes===M);assert.equal(m0.semBloco,true);const v=k=>m0.linhas.find(x=>x.linha===k);
const dd=(a,b)=>(Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/864e5,prazo=Math.round((dd(dM(1),dM(4))+dd(dM(2),dM(8))+dd('2026-06-01',dM(3)))/3);
assert.deepEqual([8,9,17,19,23,24,25,26,27,28,29,31,32].map(k=>v(k).valor),[1,12,7.7,7,1,1,1,1,2,1,1,prazo,1],'ações abertas (fora articulação e DDS), médias, manifestações, prazo e publicações');
// 3. Depoimentos e prompt: sem nomes, telefones e e-mails; "não" não conta como depoimento; dados abstratos de qualidade de vida.
const d=r.depoimentos;assert.equal(d.pesquisas,3);assert.equal(d.saneamento.respostas.length,2);assert.deepEqual([d.qualidade.sim,d.qualidade.nao,d.qualidade.semResposta,d.qualidade.notas],[1,1,1,1]);
assert.doesNotMatch(r.prompt,/Maria|Fictícia Souza|João|98888|joao@exemplo/);assert.match(r.prompt,/\[nome\] elogia a equipe/);assert.match(r.prompt,/\[telefone\]/);assert.match(r.prompt,/\[e-mail\]/);
assert.match(r.prompt,/não invente números/);assert.match(r.prompt,/não perceberam alterações/);assert.match(r.prompt,/Serviços de saneamento: <texto>/);
// 4. Atualizar: cria o bloco do mês com a formatação do último (sem conteúdo nem notas), grava números com nota de fonte.
r=run('atualizarParceirosCPT()');const mm=r.meses.find(x=>x.mes===M);assert.equal(mm.criado,true);const col=mm.coluna;assert.equal(col,19);
assert.match(String(masc.rows[1][col-1]),new RegExp('/'+M.slice(0,4)+'$'));assert.equal(masc.formato['8:'+col],'fmt-Agosto');assert.equal(masc.larg[col],140);assert.equal(masc.merges['2:'+col],3);
assert.equal(masc.rows[7][col-1],1);assert.equal(masc.rows[16][col-1],7.7);assert.match(masc.notes['17:'+col],/^CPT: automático · Fonte: média das notas/);assert.equal(masc.notes['8:'+col].startsWith('CPT'),true,'nota copiada de agosto foi trocada');
assert.equal(masc.rows[2][col-1],'','linha manual (economias) fica vazia para preencher');assert.equal(JSON.parse(props.get('CPT_APLICACAO_1')).parceirosDesde,M);
// 5. De novo: nada muda; mês com rótulo trocado → pulada; fórmula → não tocada.
r=run('atualizarParceirosCPT()');assert.equal(r.meses.find(x=>x.mes===M).linhas.filter(x=>x.situacao==='muda').length,0);
masc.rows[23][1]='Outra pergunta';masc.formulas['25:'+col]='=1';r=run('atualizarParceirosCPT()');const l=k=>r.meses.find(x=>x.mes===M).linhas.find(x=>x.linha===k);assert.equal(l(24).situacao,'pulada');assert.equal(l(25).situacao,'formula');masc.rows[23][1]=rot[24];
// 6. Textos revisados: gravados nas linhas 18 e 20, com quem e quando; aparecem ao carregar de novo.
assert.throws(()=>run(`gravarTextosParceirosCPT({mes:'${M}',saneamento:'',qualidade:'',operacaoId:'OP-${crypto.randomUUID()}'})`),/Cole ao menos/);
r=run(`gravarTextosParceirosCPT({mes:'${M}',saneamento:'Os participantes avaliam bem o abastecimento.',qualidade:'Não foram percebidas alterações na qualidade de vida no período.',operacaoId:'OP-${crypto.randomUUID()}'})`);
assert.equal(masc.rows[17][col-1],'Os participantes avaliam bem o abastecimento.');assert.equal(masc.rows[19][col-1],'Não foram percebidas alterações na qualidade de vida no período.');
r=run(`carregarParceirosCPT({mes:'${M}'})`);assert.equal(r.textos.nome,'Adm');assert.match(r.textos.saneamento,/abastecimento/);assert.equal(locked,false);
// Rótulo da linha 18 mudou: nada é gravado.
masc.rows[17][1]='Outra coisa';assert.throws(()=>run(`gravarTextosParceirosCPT({mes:'${M}',saneamento:'x y',qualidade:'',operacaoId:'OP-${crypto.randomUUID()}'})`),/mudou na linha 18/);masc.rows[17][1]=rot[18];
// Endereço antigo (Excel) salvo em Conectores: troca pela Planilha Google.
props.set('CPT_CONECTORES',JSON.stringify({parceiros:{id:'1ekpoNrPSdIbc18YxWp5ncQsTiWluS--m'}}));assert.equal(run('ParceirosCPT.id()'),'10YIKpK3uk8EwySF-e2ox6MlEzWDAnlNlHyC_T1Ktltw');props.set('CPT_CONECTORES',JSON.stringify({parceiros:{id:'mascara'}}));
// 7. Cabeçalhos de mês e Excel.
assert.equal(run("ParceirosCPT.mesDoCabecalho('Agosto')"),'2026-08');assert.equal(run("ParceirosCPT.mesDoCabecalho('Setembro/2026')"),'2026-09');assert.equal(run("ParceirosCPT.mesDoCabecalho('set/27')"),'2027-09');assert.equal(run("ParceirosCPT.mesDoCabecalho('Dados')"),'');
props.set('CPT_CONECTORES',JSON.stringify({parceiros:{id:'xlsx'}}));assert.match(run(`carregarParceirosCPT({mes:'${M}'})`).erro,/Salvar como Planilhas Google/);
console.log('PASS: parceiros — números automáticos (ações abertas, médias das pesquisas, manifestações, prazo, publicações) na coluna do mês, bloco do mês criado com a formatação do último, nota de fonte, rótulo e fórmula conferidos, prompt sem nomes/telefones/e-mails e com abstrações, textos revisados nas linhas 18 e 20 com quem gravou e Excel avisado.');
