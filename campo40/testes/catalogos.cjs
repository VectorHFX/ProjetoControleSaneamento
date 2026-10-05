// Catálogo de obras e bairros: nome de uso na lista do formulário. node campo40/testes/catalogos.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ctx={console:{log(){},warn(){}},ConfiguracaoDaBase:{valores:{SEM_OBRA:'Não se aplica',OBRA_A_CADASTRAR:'Obra ainda não cadastrada'}}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/../src/CatalogosDeObrasEBairros.gs','utf8')+';this.C=CatalogosDeObrasEBairros;',ctx);
const C=ctx.C,linha=(id,nome,bairros,sit,uso,apelidos)=>{const r=Array(37).fill('');r[0]=id;r[1]=nome;r[2]=bairros;r[3]=true;r[19]=sit;if(uso!=null)r[35]=uso;if(apelidos!=null)r[36]=apelidos;return r;};
const bairros=[['BAI-001','Vila Linda',true,'Santo André','Bairro',''],['BAI-002','Jardim',true,'Santo André','Bairro','']];
const d=C.validarLinhas([linha('OBR-0001','Coletor tronco Tamanduateí — margem direita trecho 3','Vila Linda','Em andamento','Coletor Vila Linda','CT3; Margem direita'),linha('OBR-0002','Rede B','Jardim','Paralisada')],bairros);
assert.equal(d.obras[0].nomeUso,'Coletor Vila Linda');assert.equal(JSON.stringify(d.obras[0].apelidos),'["CT3","Margem direita"]');assert.equal(d.obras[1].nomeUso,'');
// Linhas antigas, só até a coluna Z, continuam válidas.
assert.equal(C.validarLinhas([linha('OBR-0003','Rede C','','Em andamento').slice(0,26)],bairros).obras[0].nomeUso,'');
assert.equal(C.rotulo(d.obras[0]),'Coletor Vila Linda — Vila Linda [OBR-0001]');assert.equal(C.rotulo(d.obras[1]),'Rede B — Jardim [OBR-0002]');
let escolhas=null;const lista=v=>({getType:()=>'LIST',getTitle:()=>'Bairro de realização do procedimento',getId:()=>2,asListItem:()=>({getChoices:()=>[],setChoiceValues:x=>{if(v)escolhas=x;}})});
const form={getItemById:id=>id===1?lista(true):lista(false),getItems:()=>[]};
C.sincronizar(null,form,{obraItemId:1,bairroItemId:2},d);assert.deepEqual([...escolhas.slice(0,2)],['Coletor Vila Linda — Vila Linda [OBR-0001]','Rede B — Jardim [OBR-0002]']);
console.log('PASS: nome de uso e apelidos lidos das colunas AJ:AK, lista do formulário com o nome de uso e o ID, linhas antigas compatíveis.');
