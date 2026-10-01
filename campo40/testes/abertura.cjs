// Abertura automática de casos (serviços Google simulados). node campo40/testes/abertura.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
class Sheet{constructor(n,rows){this.n=n;this.rows=rows}getLastRow(){return this.rows.length}getName(){return this.n}
  getRange(r,c,nr=1,nc=1){const s=this;return {getValues:()=>Array.from({length:nr},(_,i)=>Array.from({length:nc},(_,j)=>s.rows[r+i-1]?.[c+j-1]??'')),setValues:v=>{v.forEach((row,i)=>{while(s.rows.length<r+i)s.rows.push([]);row.forEach((x,j)=>s.rows[r+i-1][c+j-1]=x)})}}}}
const A=['Protocolo','Protocolo principal','Situação do protocolo','Status','Data de abertura','Data de conclusão','Nome','Assunto','Endereço','Frente de obra','Área responsável','Responsável','Próxima ação','Atualização operacional','Documento','PDF','Origem','Pesquisa','Hash','Detalhes JSON'];
const M=['ID','Protocolo','Data e hora','Tipo','Status','Autor','Resumo','Origem','Hash','Detalhes JSON'];
const reg=(id,proc,data,origem,campos)=>[id,proc,new Date(data+'T12:00:00Z'),data.slice(0,7),'',origem,'','Vila Linda','','Coletor A [OBR-0001]','','Kesy','Atendimento','','','','','','','',JSON.stringify({campos})];
const id=n=>'REG-'+String(n).padStart(24,'b');
const campos=[{titulo:'Nome - Atendimento',valor:'Moradora Teste'},{titulo:'Telefone ou Telefones - Atendimento',valor:'(11) 0000-0000'},{titulo:'Endereço Completo do Solicitante do Atendimento',valor:'Rua Exemplo, 10'},{titulo:'Assunto Principal',valor:'Vazamento na calçada'},{titulo:'Classificação principal da manifestação',valor:'Reclamação'},{titulo:'Breve relato do solicitante',valor:'Saída de lama na calçada.'},{titulo:'Canal de recebimento da demanda',valor:'Atendimento itinerante'}];
const atd=new Sheet('Atendimentos',[A,['ATD20260027','ATD20260027','Principal','Em andamento'],['ATD20250003','ATD20250003','Principal','Concluída']]);
const mov=new Sheet('Movimentações',[M]);
const registros=new Sheet('Registros',[['cab'],reg(id(1),'Ficha de Atendimento','2026-09-20','Procedimentos de Campo 4.0',campos),reg(id(2),'Relato de atividade','2026-09-21','Procedimentos de Campo 4.0',[]),reg(id(3),'Ficha de Atendimento','2026-08-02','Histórico 3.0',campos),reg(id(4),'Ficha de atendimento','2026-10-01','Procedimentos de Campo 4.0',campos)]);
const base={getSheetByName:n=>({Atendimentos:atd,'Movimentações':mov,Registros:registros})[n]||null,getSpreadsheetTimeZone:()=>'America/Sao_Paulo'};
const ctx={console,JSON,Date,Utilities:{computeDigest:(_,v)=>[...crypto.createHash('sha256').update(v).digest()].map(b=>b>127?b-256:b),DigestAlgorithm:{SHA_256:1},Charset:{UTF_8:1},formatDate:(d,_,f)=>f==='yyyy'?String(new Date(d.getTime()-3*3600e3).getUTCFullYear()):''},base};
vm.createContext(ctx);for(const f of ['ConfiguracaoDaBase','RepositorioDosRegistros','AberturaDeAtendimentos'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx)));
let r=run('AberturaDeAtendimentos.abrirPendentes(base)');
assert.deepEqual(r.abertos.map(x=>x.protocolo),['ATD20260028','ATD20260029'],'continua a numeração de 2026; ignora histórico 3.0 e relatos');
const caso=atd.rows[3];assert.equal(caso[3],'Recebida');assert.equal(caso[6],'Moradora Teste');assert.equal(caso[7],'Vazamento na calçada');assert.equal(caso[8],'Rua Exemplo, 10');assert.equal(caso[9],'Coletor A');assert.match(caso[16],new RegExp(id(1)));
const det=JSON.parse(caso[19]);assert.equal(det.tipo,'Reclamação');assert.equal(det.canal,'Atendimento itinerante');assert.equal(det.procedencia,'Em análise');assert.equal(det.campos.length,7);
assert.equal(mov.rows.length,3);assert.equal(mov.rows[1][3],'Abertura');assert.equal(registros.rows[1][15],'ATD20260028');
r=run('AberturaDeAtendimentos.abrirPendentes(base)');assert.equal(r.abertos.length,0,'repetir não cria protocolo novo');assert.equal(atd.rows.length,5);
console.log('PASS: ficha do formulário vira caso ATD+ano+sequência (continua de ATD20260027), campos preservados, movimentação de abertura, registro marcado e repetição segura.');
