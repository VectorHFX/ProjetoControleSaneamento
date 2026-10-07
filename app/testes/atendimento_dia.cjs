// Mensagem do dia e e-mail do mês do atendimento (2.42), com base simulada e dados fictícios. node app/testes/atendimento_dia.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
let email='adm@example.com',locked=false,agoraMs=null;
const props=new Map([['CPT_APLICACAO_1',JSON.stringify({baseId:'base',administrador:'victor@example.com',agendaId:'agenda-0123456789',versao:'2.42.0',pastaFichasV2Id:'RAIZ'})],
  ['CPT_PESSOA:adm@example.com',JSON.stringify({email:'adm@example.com',nome:'Adm Fictício',papeis:['administrativo'],ativo:true,versao:1})],
  ['CPT_PESSOA:atd@example.com',JSON.stringify({email:'atd@example.com',nome:'Atd',papeis:['atendimento'],ativo:true,versao:1})],
  ['CPT_PESSOA:com@example.com',JSON.stringify({email:'com@example.com',nome:'Com',papeis:['comunicacao'],ativo:true,versao:1})],
  ['CPT_PESSOA:social@example.com',JSON.stringify({email:'social@example.com',nome:'Social',papeis:['socioambiental'],ativo:true,versao:1})]]);
const RealDate=Date;class FakeDate extends RealDate{constructor(...a){if(!a.length&&agoraMs!=null)super(agoraMs);else super(...a);}static now(){return agoraMs!=null?agoraMs:RealDate.now();}}
const fmt=(d,_,f)=>{const s=new RealDate(d.getTime()-3*3600e3).toISOString();return f.replace('yyyy',s.slice(0,4)).replace('MM',s.slice(5,7)).replace('dd',s.slice(8,10)).replace('HH',s.slice(11,13)).replace('mm',s.slice(14,16));};
class Sheet{constructor(n,rows=[]){this.name=n;this.rows=rows;}getName(){return this.name}getLastRow(){return this.rows.length}setFrozenRows(){}appendRow(r){this.rows.push(r)}
  getRange(r,c,n=1,m=1){const s=this;let px;const api={getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.rows[r+i-1]?.[c+j-1]??'')),getValue:()=>api.getValues()[0][0],
    setValues:v=>{v.forEach((row,i)=>{while(s.rows.length<r+i)s.rows.push([]);row.forEach((x,j)=>s.rows[r+i-1][c+j-1]=x)});return px},setValue:x=>api.setValues([[x]])};px=new Proxy(api,{get:(t,k)=>k in t?t[k]:()=>px});return px;}}
class Book{constructor(id,sheets){this.id=id;this.sheets=sheets}getId(){return this.id}getSheetByName(n){return this.sheets.find(s=>s.name===n)||null}insertSheet(n){const a=new Sheet(n);this.sheets.push(a);return a}getSpreadsheetTimeZone(){return 'America/Sao_Paulo'}}
const dia=s=>new FakeDate(s+'T15:00:00Z');
const cab=['Protocolo','Protocolo principal','Situação do protocolo','Status','Data de abertura','Data de conclusão','Nome','Assunto','Endereço','Frente de obra','Área responsável','Responsável','Próxima ação','Atualização operacional','Documento','PDF','Origem','Pesquisa','Hash','Detalhes JSON'];
const caso=(n,abre,fecha,{area='Atendimento',prox='',nome='Morador '+n,fim='',atual=''}={})=>{const p='ATD2026'+String(n).padStart(4,'0');return [p,p,'',fecha?'Concluído':'Em andamento',dia(abre),fecha?dia(fecha):'',nome,'Assunto '+n,'Rua '+n,'Coletor A',area,'Atd',prox,atual,'','','CAC','','',JSON.stringify({aberturas:[{campos:{'Nome do solicitante':nome+' da Silva Fictícia','Solicitação':'Pedido '+n}}],...(fim?{conclusao:fim}:{})})];};
const atd=new Sheet('Atendimentos',[cab,caso(1,'2026-09-02','2026-09-20',{fim:'Calçada refeita.'}),caso(2,'2026-08-10','',{area:'Execução',prox:'Vistoria com a engenharia'}),caso(3,'2026-09-28','',{prox:'Ligar para o morador'}),
  caso(4,'2026-10-05',''),caso(5,'2026-07-01','2026-10-06'),caso(6,'2026-06-01','2026-08-30')]);
const books=new Map([['base',new Book('base',[atd])],['agenda-0123456789',new Book('agenda-0123456789',[])]]),cacheMap=new Map();
const pasta=(nome,filhos={})=>({getFoldersByName:n=>{const f=filhos[n];let ok=!!f;return {hasNext:()=>ok,next:()=>{ok=false;return f;}}},getUrl:()=>'https://drive.google.com/drive/folders/'+nome});
const ctx={Date:FakeDate,console:{log(){},warn(){},error(){}},JSON,Session:{getActiveUser:()=>({getEmail:()=>email})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>Object.fromEntries(props),getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
  SpreadsheetApp:{openById:id=>{if(!books.has(id))throw Error('Não existe');return books.get(id)}},DriveApp:{getFolderById:()=>pasta('RAIZ',{Pacotes:pasta('PACOTES',{'2026-09':pasta('PACOTE-SET')})})},
  CacheService:{getScriptCache:()=>({get:k=>cacheMap.get(k)||null,put:(k,v)=>cacheMap.set(k,v),remove:k=>cacheMap.delete(k)})},
  Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:fmt},LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},releaseLock:()=>locked=false})}};
vm.createContext(ctx);
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','PerfisCPT','ColecaoCPT','CicloAtendimentoCPT','FichaOficialCPT','AplicacaoCPT','AtendimentoDiaCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx))),op=()=>'OP-'+crypto.randomUUID(),call=(f,p)=>{ctx.p={...p,operacaoId:op()};return run(f+'(p)');};
agoraMs=RealDate.parse('2026-10-07T12:00:00Z');
// 1. Preparar: só Gestão/Administrativo; sem mensagem anterior, conta os últimos 3 dias.
email='atd@example.com';assert.throws(()=>run('preparoMensagemDiaCPT()'),/Gestão ou pelo Administrativo/);
email='adm@example.com';let r=run('preparoMensagemDiaCPT()');assert.equal(r.desde,'2026-10-04');assert.deepEqual(r.novos.map(c=>c.protocolo),['ATD20260004']);assert.deepEqual(r.concluidos.map(c=>c.protocolo),['ATD20260005']);
assert.deepEqual(r.abertos.map(c=>c.protocolo),['ATD20260002','ATD20260003','ATD20260004'],'mais antigos primeiro');
// 2. Publicar: escolhe 1 a 3 casos em aberto; o texto tem novos, concluídos e os casos do dia com quem está e próxima ação.
assert.throws(()=>call('publicarMensagemDiaCPT',{escolhidos:[]}),/Escolha os casos/);assert.throws(()=>call('publicarMensagemDiaCPT',{escolhidos:['ATD20260001']}),/não está mais em aberto/);
assert.throws(()=>call('publicarMensagemDiaCPT',{escolhidos:['ATD20260002','ATD20260003','ATD20260004','ATD20260002x']}),/no máximo 3/);
r=call('publicarMensagemDiaCPT',{escolhidos:['ATD20260002','ATD20260003'],nota:'Prioridade para a vistoria.'});const t=r.mensagem.texto;
assert.match(t,/^Atendimento · 07\/10\/2026/);assert.match(t,/1 caso novo desde 04\/10\/2026: Caso 4 · Assunto 4\./);assert.match(t,/1 concluído: Caso 5 · Assunto 5\./);
assert.match(t,/• Caso 2 · Assunto 2 — com Execução — Vistoria com a engenharia\n• Caso 3 · Assunto 3 — com Atendimento — Ligar para o morador/);assert.match(t,/Prioridade para a vistoria\.$/);
// 3. Missões para Atendimento, Gestão, Administrativo e Comunicação (não para Socioambiental); somem quando o caso é atualizado depois.
const miss=()=>run('new AtendimentoDiaCPT(AplicacaoCPT.identidade()).missoes()');
for(const e of ['atd@example.com','com@example.com','adm@example.com']){email=e;assert.deepEqual(miss().map(m=>m.protocolo),['ATD20260002','ATD20260003'],e);}
email='social@example.com';assert.deepEqual(miss(),[]);assert.equal(run('mensagemDiaCPT()').mensagem,null);
email='atd@example.com';assert.match(run('mensagemDiaCPT()').mensagem.texto,/Para trabalhar hoje/);assert.equal(miss()[0].tipo,'caso');
atd.rows[2][13]='2026-10-07T13:00:00.000Z';assert.deepEqual(miss().map(m=>m.protocolo),['ATD20260003'],'caso 2 atualizado depois da mensagem: missão cumprida');
// 4. No dia seguinte: "desde" passa a ser o dia da última mensagem e as missões de ontem somem.
agoraMs=RealDate.parse('2026-10-08T12:00:00Z');email='adm@example.com';r=run('preparoMensagemDiaCPT()');assert.equal(r.desde,'2026-10-07');assert.equal(r.atual,null);email='atd@example.com';assert.deepEqual(miss(),[]);
// 5. E-mail de setembro: casos do pacote (abertos no mês, concluídos no mês, em andamento no fim do mês), nome completo, com quem está, observações e link do pacote.
r=run("emailMesAtendimentoCPT({mes:'2026-09'})");assert.equal(r.assunto,'Atendimentos de setembro de 2026 — relatório do mês');
assert.deepEqual(r.linhas.map(l=>l.protocolo),['ATD20260005','ATD20260002','ATD20260001','ATD20260003'],'sem o caso 6 (concluído em agosto) nem o 4 (outubro)');
assert.deepEqual(r.resumo,{casos:4,abertos:2,concluidos:1,andamento:3,prazoMedio:18});
const l1=r.linhas.find(l=>l.protocolo==='ATD20260001');assert.equal(l1.nome,'Morador 1 da Silva Fictícia');assert.equal(l1.situacao,'Concluído em 20/09/2026');assert.equal(l1.observacoes,'Calçada refeita.');
const l5=r.linhas.find(l=>l.protocolo==='ATD20260005');assert.equal(l5.situacao,'Em andamento no fim do mês · concluído em 06/10/2026','concluído só em outubro');
assert.equal(r.linhas.find(l=>l.protocolo==='ATD20260002').com,'Execução');assert.equal(r.pacote,'https://drive.google.com/drive/folders/PACOTE-SET');
assert.match(r.html,/<table style="border-collapse:collapse/);assert.match(r.html,/PACOTE-SET/);assert.match(r.texto,/Caso 1 \(ATD20260001\) · aberto em 02\/09\/2026 · Morador 1 da Silva Fictícia/);
assert.equal(run("emailMesAtendimentoCPT({mes:'2026-10'})").pacote,'','pacote ainda não montado: sem link');
email='social@example.com';assert.throws(()=>run("emailMesAtendimentoCPT({mes:'2026-09'})"),/Atendimento, Comunicação, Gestão e Administrativo/);
// Texto com caracteres especiais vira texto no HTML.
atd.rows[3][7]='<b>Vazamento</b> & lama';email='adm@example.com';assert.match(run("emailMesAtendimentoCPT({mes:'2026-09'})").html,/&lt;b&gt;Vazamento&lt;\/b&gt; &amp; lama/);
assert.equal(locked,false);
console.log('PASS: atendimento do dia — preparar só pela gestão (novos e concluídos desde a última mensagem), publicar 1 a 3 casos em aberto, texto pronto, missões para Atendimento/Gestão/Administrativo/Comunicação que somem quando o caso anda, e-mail do mês com os casos do pacote, nome completo, com quem está, situação, observações e link do pacote.');
