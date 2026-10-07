// Matriz de Contatos (2.40) com planilha simulada e dados fictícios: importar uma vez (seções e contatos), propor (novo,
// alteração, inativar), só Gestão/Administrativo aprovam ou recusam (com motivo), histórico auditável, escrita na planilha
// (alteração no lugar, novo no fim da seção com a formatação de cima, data na ATUALIZAÇÃO, nenhuma linha apagada) e
// "a gravar" refeito pela rotina. node app/testes/matriz.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
let email='adm@example.com',locked=false;
const props=new Map([['CPT_APLICACAO_1',JSON.stringify({baseId:'base',administrador:'victor@example.com',agendaId:'agenda-0123456789',versao:'2.40.0'})],['CPT_CONECTORES',JSON.stringify({anexos:{id:'anexos'}})],
  ['CPT_PESSOA:adm@example.com',JSON.stringify({email:'adm@example.com',nome:'Adm',papeis:['administrativo'],ativo:true,versao:1})],
  ['CPT_PESSOA:social@example.com',JSON.stringify({email:'social@example.com',nome:'Social',papeis:['socioambiental'],ativo:true,versao:1})]]);
const fmt=(d,_,f)=>{const s=new Date(d.getTime()-3*3600e3).toISOString();return f.replace('yyyy',s.slice(0,4)).replace('MM',s.slice(5,7)).replace('dd',s.slice(8,10)).replace('HH',s.slice(11,13)).replace('mm',s.slice(14,16));};
class Sheet{constructor(n,rows=[]){this.name=n;this.rows=rows;this.formato={};}getName(){return this.name}getLastRow(){return this.rows.length}appendRow(r){this.rows.push(r)}setFrozenRows(){}
  insertRowAfter(l){if(this.falhar)throw Error('planilha ocupada');this.rows.splice(l,0,[]);const f={};Object.entries(this.formato).forEach(([k,v])=>{const [r,c]=k.split(':').map(Number);f[(r>l?r+1:r)+':'+c]=v;});this.formato=f;}
  getRange(r,c,n=1,m=1){const s=this;let px;const api={getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.rows[r+i-1]?.[c+j-1]??'')),getValue:()=>api.getValues()[0][0],
    setValues:v=>{if(s.falhar)throw Error('planilha ocupada');v.forEach((row,i)=>{while(s.rows.length<r+i)s.rows.push([]);row.forEach((x,j)=>s.rows[r+i-1][c+j-1]=x)});return px},
    copyTo:(d,tipo)=>{d.cols().forEach(([rr,cc],j)=>s.formato[rr+':'+cc]=s.formato[r+':'+(c+j)]);return px},cols:()=>Array.from({length:m},(_,j)=>[r,c+j])};px=new Proxy(api,{get:(t,k)=>k in t?t[k]:()=>px});return px;}}
class Book{constructor(id,sheets){this.id=id;this.sheets=sheets}getId(){return this.id}getSheets(){return this.sheets}getSheetByName(n){return this.sheets.find(s=>s.name===n)||null}insertSheet(n){const a=new Sheet(n);this.sheets.push(a);return a}getSpreadsheetTimeZone(){return 'America/Sao_Paulo'}}
const H=['','NOME/FUNÇÃO/CARGO','PESSOA DE CONTATO','ENDEREÇO','TELEFONE','EMAIL','OBSERVAÇÃO','ATUALIZAÇÃO'],H2=['','NOME ','PESSOA DE CONTATO','ENDEREÇO','TELEFONE','EMAIL','OBSERVAÇÃO','ATUALIZAÇÃO'];
const matriz=new Sheet('Matriz de Contatos',[['','Matriz de Contatos '],['','REGIÃO/LOCALIDADE '],['','LIDERANÇAS LOCAIS '],H,
  ['','Associação Fictícia','Pessoa A','Rua A, 1','(11) 1111-1111','a@exemplo.org','',new Date(Date.UTC(2026,8,1,15))],
  ['','Coletivo Fictício','Pessoa B','','(11) 2222-2222','','Prefere WhatsApp',''],
  ['','ESCOLAS MUNICIPAIS'],H2,['','EMEF Fictícia','Diretora C','Rua C','(11) 3333-3333','','',''],
  ['','REGIÃO/LOCALIDADE'],['','LIDERANÇAS LOCAIS '],H,['','Liderança Fictícia D','Pessoa D','','(11) 4444-4444','','',''],['','Manutenção do contato'],['','Novo contato']]);
for(let c=2;c<=8;c++){matriz.formato['6:'+c]='fmt-lideranca';matriz.formato['9:'+c]='fmt-escola';}
const books=new Map([['base',new Book('base',[])],['agenda-0123456789',new Book('agenda-0123456789',[])],['anexos',new Book('anexos',[matriz])]]),cacheMap=new Map();
const ctx={Date,console:{log(){},warn(){},error(){}},JSON,Session:{getActiveUser:()=>({getEmail:()=>email})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>Object.fromEntries(props),getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
  SpreadsheetApp:{openById:id=>{if(!books.has(id))throw Error('Não existe');return books.get(id)},CopyPasteType:{PASTE_FORMAT:'FMT'}},DriveApp:{getFileById:()=>({getMimeType:()=>'application/vnd.google-apps.spreadsheet'})},MimeType:{GOOGLE_SHEETS:'application/vnd.google-apps.spreadsheet'},
  CacheService:{getScriptCache:()=>({get:k=>cacheMap.get(k)||null,put:(k,v)=>cacheMap.set(k,v),remove:k=>cacheMap.delete(k)})},
  Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:fmt},LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},releaseLock:()=>locked=false})}};
vm.createContext(ctx);
for(const f of ['CacheCPT','DesempenhoCPT','DadosDaAplicacao','PerfisCPT','ColecaoCPT','ConectoresCPT','AplicacaoCPT','AnexosCPT','MatrizCPT','ContatosCPT'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f+'.gs','utf8'),ctx);
const run=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx))),op=()=>'OP-'+crypto.randomUUID(),call=(f,p)=>{ctx.p={...p,operacaoId:op()};return run(f+'(p)');};
const hoje=fmt(new Date(),0,'yyyy-MM-dd'),hojeBr=hoje.split('-').reverse().join('/');
const lista=()=>run('listarMatrizCPT()'),achar=n=>lista().itens.find(x=>x.nome===n),linhas=()=>matriz.rows.map(r=>r[1]);

// 1. Leitura da planilha: seções (títulos antes dos contatos; repetida ganha "(2)") e só linhas de contato.
const lido=run(`MatrizCPT.ler(${JSON.stringify(matriz.rows.map(r=>r.map(v=>v instanceof Date?'':v)))})`);
assert.deepEqual(lido.secoes.map(s=>s.nome),['REGIÃO/LOCALIDADE · LIDERANÇAS LOCAIS','ESCOLAS MUNICIPAIS','REGIÃO/LOCALIDADE · LIDERANÇAS LOCAIS (2)']);
assert.deepEqual(lido.contatos.map(c=>c.linha),[5,6,9,13]);assert.equal(lido.contatos[2].secao,'ESCOLAS MUNICIPAIS');
// 2. Importar: só Gestão/Administrativo, uma vez.
email='social@example.com';assert.throws(()=>run('importarMatrizCPT()'),/Gestão e do Administrativo/);
email='adm@example.com';let r=run('importarMatrizCPT()');assert.equal(r.importados,4);assert.equal(r.secoes,3);assert.throws(()=>run('importarMatrizCPT()'),/já foi importada/);
let l=lista();assert.equal(l.importada,true);assert.equal(l.itens.length,4);assert.equal(achar('Associação Fictícia').atualizacao,'2026-09-01');assert.match(achar('Associação Fictícia').historico[0].detalhe,/linha 5/);
const antes=JSON.stringify(matriz.rows);assert.equal(JSON.stringify(matriz.rows),antes,'importar não altera a planilha');
// Busca e ferramentas: contatos da Matriz junto dos internos (só aprovados e ativos).
assert.equal(run('listarContatosCPT()').matriz.length,4);
// 3. Equipe propõe contato novo: não vale até aprovar.
email='social@example.com';assert.throws(()=>call('proporMatrizCPT',{tipo:'novo',secao:'Inventada',nome:'X',pessoa:'Y'}),/seção/);
assert.throws(()=>call('proporMatrizCPT',{tipo:'novo',secao:'ESCOLAS MUNICIPAIS',nome:'EMEF Sem Dados'}),/ao menos/);
assert.throws(()=>call('proporMatrizCPT',{tipo:'novo',secao:'ESCOLAS MUNICIPAIS',nome:'emef fictícia',pessoa:'diretora c'}),/já está na Matriz/);
r=call('proporMatrizCPT',{tipo:'novo',secao:'REGIÃO/LOCALIDADE · LIDERANÇAS LOCAIS',nome:'Grupo Fictício E',pessoa:'Pessoa E',telefone:'(11) 5555-5555'});
const novoId=r.contato.id;assert.equal(r.contato.situacao,'pendente');assert.equal(run('listarContatosCPT()').matriz.length,4,'pendente fora da busca');assert.equal(JSON.stringify(matriz.rows),antes,'proposta não escreve na planilha');
assert.throws(()=>call('decidirMatrizCPT',{id:novoId,decisao:'aprovar',versao:1}),/Gestão e do Administrativo/);
// 4. Aprovar: entra no fim da sua seção, com a formatação de cima e a data de hoje; as outras linhas só descem.
email='adm@example.com';r=call('decidirMatrizCPT',{id:novoId,decisao:'aprovar',versao:1});assert.match(r.resultado,/gravado na Matriz/);
assert.deepEqual(linhas().slice(3,8),['NOME/FUNÇÃO/CARGO','Associação Fictícia','Coletivo Fictício','Grupo Fictício E','ESCOLAS MUNICIPAIS']);
assert.equal(matriz.rows[6][7].toISOString().slice(0,10),hoje);assert.equal(matriz.formato['7:4'],'fmt-lideranca','formatação da linha de cima');assert.equal(matriz.formato['10:4'],'fmt-escola','formatação de baixo desceu junto');
const e=achar('Grupo Fictício E');assert.equal(e.situacao,'aprovado');assert.deepEqual(e.historico.map(h=>h.acao),['Proposto','Aprovado','Gravado na Matriz']);assert.equal(e.historico[0].por,'social@example.com');assert.equal(e.historico[1].por,'adm@example.com');
// 5. Alteração proposta pela equipe e aprovada: muda no lugar (achada pelo nome e pessoa gravados), com a data.
email='social@example.com';const b=achar('Coletivo Fictício');
assert.throws(()=>call('proporMatrizCPT',{id:b.id,tipo:'alteracao',versao:b.versao,nome:b.nome,pessoa:b.pessoa,telefone:b.telefone,observacao:b.observacao}),/Nada mudou/);
r=call('proporMatrizCPT',{id:b.id,tipo:'alteracao',versao:b.versao,nome:b.nome,pessoa:'Pessoa B2',telefone:'(11) 2222-0000',observacao:b.observacao});
assert.throws(()=>call('proporMatrizCPT',{id:b.id,tipo:'inativar',versao:r.contato.versao,motivo:'x'}),/já tem uma proposta/);
assert.equal(achar('Coletivo Fictício').pessoa,'Pessoa B','antes de aprovar, vale o atual');
email='adm@example.com';r=call('decidirMatrizCPT',{id:b.id,decisao:'aprovar',versao:r.contato.versao});
assert.deepEqual(matriz.rows[5].slice(1,5),['Coletivo Fictício','Pessoa B2','','(11) 2222-0000']);assert.equal(matriz.rows[5][7].toISOString().slice(0,10),hoje);
assert.match(achar('Coletivo Fictício').historico.find(h=>h.acao==='Aprovado').detalhe,/Pessoa de contato: "Pessoa B" → "Pessoa B2"/);
// 6. Recusar pede motivo e não muda nada; contato novo recusado some da lista mas fica no histórico da coleção.
email='social@example.com';const d=achar('Liderança Fictícia D');r=call('proporMatrizCPT',{id:d.id,tipo:'alteracao',versao:d.versao,nome:d.nome,pessoa:'Outra',telefone:d.telefone});
email='adm@example.com';assert.throws(()=>call('decidirMatrizCPT',{id:d.id,decisao:'recusar',versao:r.contato.versao}),/motivo da recusa/);
r=call('decidirMatrizCPT',{id:d.id,decisao:'recusar',versao:r.contato.versao,motivo:'Dado não confirmado'});assert.equal(achar('Liderança Fictícia D').pessoa,'Pessoa D');assert.equal(matriz.rows[13][2],'Pessoa D');
email='social@example.com';r=call('proporMatrizCPT',{tipo:'novo',secao:'ESCOLAS MUNICIPAIS',nome:'EMEF Duvidosa',pessoa:'Z'});email='adm@example.com';call('decidirMatrizCPT',{id:r.contato.id,decisao:'recusar',versao:1,motivo:'Duplicado'});
assert.equal(achar('EMEF Duvidosa'),undefined);
// 7. Inativar: a linha continua; a observação diz desde quando. Reativar tira o aviso.
email='social@example.com';assert.throws(()=>call('proporMatrizCPT',{id:d.id,tipo:'inativar',versao:achar('Liderança Fictícia D').versao}),/motivo/);
r=call('proporMatrizCPT',{id:d.id,tipo:'inativar',versao:achar('Liderança Fictícia D').versao,motivo:'Mudou de bairro'});email='adm@example.com';call('decidirMatrizCPT',{id:d.id,decisao:'aprovar',versao:r.contato.versao});
assert.equal(matriz.rows[13][1],'Liderança Fictícia D','linha não é apagada');assert.equal(matriz.rows[13][6],'Inativo desde '+hojeBr+'. Mudou de bairro.');assert.equal(achar('Liderança Fictícia D').ativo,false);
assert.equal(run('listarContatosCPT()').matriz.length,4,'inativo sai da busca (4 ativos: A, B, E e a escola)');
r=call('proporMatrizCPT',{id:d.id,tipo:'reativar',versao:achar('Liderança Fictícia D').versao});call('decidirMatrizCPT',{id:d.id,decisao:'aprovar',versao:r.contato.versao});assert.equal(matriz.rows[13][6],'');
// 8. Planilha indisponível na aprovação: aprovado na aplicação, "a gravar"; a rotina grava depois.
matriz.falhar=true;email='social@example.com';const a=achar('Associação Fictícia');r=call('proporMatrizCPT',{id:a.id,tipo:'alteracao',versao:a.versao,nome:a.nome,pessoa:a.pessoa,endereco:a.endereco,telefone:'(11) 1111-0000',email:a.email});
email='adm@example.com';r=call('decidirMatrizCPT',{id:a.id,decisao:'aprovar',versao:r.contato.versao});assert.match(r.resultado,/rotina tenta de novo/);assert.equal(achar('Associação Fictícia').aGravar,true);assert.equal(matriz.rows[4][4],'(11) 1111-1111');
matriz.falhar=false;r=run("new MatrizCPT(AplicacaoCPT.identidade()).gravarPendentes()");assert.deepEqual(r,{gravados:1,faltam:0});assert.equal(matriz.rows[4][4],'(11) 1111-0000');assert.equal(achar('Associação Fictícia').aGravar,false);
// 9. Linha mudada à mão (nome trocado na planilha): não escreve em lugar errado; fica a gravar com o motivo.
matriz.rows[9][1]='EMEF Renomeada à Mão';email='social@example.com';const c=achar('EMEF Fictícia');r=call('proporMatrizCPT',{id:c.id,tipo:'alteracao',versao:c.versao,nome:c.nome,pessoa:c.pessoa,endereco:'Rua C, 10',telefone:c.telefone});
email='adm@example.com';r=call('decidirMatrizCPT',{id:c.id,decisao:'aprovar',versao:r.contato.versao});assert.match(r.resultado,/não foi achada/);assert.equal(matriz.rows[9][3],'Rua C','nada escrito');
assert.equal(locked,false);
console.log('PASS: matriz — leitura de seções e contatos, importar uma vez (planilha intacta), propor novo/alteração/inativar/reativar, só Gestão/Administrativo decidem, recusa com motivo, histórico com quem e quando, novo no fim da seção com formatação, alteração no lugar com data, nenhuma linha apagada, "a gravar" refeito pela rotina e linha mudada à mão não é sobrescrita.');
