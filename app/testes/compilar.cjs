// Ferramenta de desenvolvimento. Não precisa ser instalada no Google Apps Script.
const fs=require('fs'),path=require('path'),vm=require('vm');
const prefix=process.env.CPT_BABEL_MODULES||'/tmp/cpt-compat/node_modules';
const babel=require(path.join(prefix,'@babel/core'));
const plugins=['transform-template-literals','transform-optional-chaining','transform-nullish-coalescing-operator'].map(n=>require(path.join(prefix,'@babel/plugin-'+n)));
for(const nome of ['Agenda','Interacoes','Obras','Inicio','Atendimentos','Gestao','Comunicacao','Recados','MeuEspaco','Mapa','Mascotes','Saber','Album','Jogos','Placar','Visual','Organograma']){
 const root=path.resolve(__dirname,'..'),original=fs.readFileSync(path.join(root,'fontes',nome+'.html'),'utf8');
 const js=original.replace(/^\s*<script>\s*/,'').replace(/\s*<\/script>\s*$/,'');
 const result=babel.transformSync(js,{configFile:false,babelrc:false,plugins,comments:false,compact:true,minified:true,generatorOpts:{jsescOption:{minimal:false}},filename:nome+'.js'}).code;
 new vm.Script(result,{filename:nome+'.js'});
 if(result.includes('`'))throw Error('Template literal remanescente');
 fs.writeFileSync(path.join(root,'src',nome+'.html'),'<script>\n'+result+'\n</script>\n');
 console.log(nome+': sintaxe conferida; sem template literals, encadeamento opcional ou operador nulo.');
}
// O selo de versão do menu (Aplicacao.html) acompanha VERSAO_CPT (maior.menor).
{const root=path.resolve(__dirname,'..'),v=fs.readFileSync(path.join(root,'src/AplicacaoCPT.gs'),'utf8').match(/VERSAO_CPT = '(\d+\.\d+)/)[1],selo=(fs.readFileSync(path.join(root,'src/Aplicacao.html'),'utf8').match(/class="version">([^<]+)</)||[])[1];
 if(selo!==v)throw Error('Selo de versão do menu ('+selo+') diferente de VERSAO_CPT ('+v+'): atualize app/src/Aplicacao.html.');console.log('Selo de versão do menu: '+selo);}
