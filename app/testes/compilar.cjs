// Ferramenta de desenvolvimento. Não precisa ser instalada no Google Apps Script.
const fs=require('fs'),path=require('path'),vm=require('vm');
const prefix=process.env.CPT_BABEL_MODULES||'/tmp/cpt-compat/node_modules';
const babel=require(path.join(prefix,'@babel/core'));
const plugins=['transform-template-literals','transform-optional-chaining','transform-nullish-coalescing-operator'].map(n=>require(path.join(prefix,'@babel/plugin-'+n)));
for(const nome of ['Agenda','Interacoes','Entregas','Obras','Fechamento','Inicio']){
 const root=path.resolve(__dirname,'..'),original=fs.readFileSync(path.join(root,'fontes',nome+'.html'),'utf8');
 const js=original.replace(/^\s*<script>\s*/,'').replace(/\s*<\/script>\s*$/,'');
 const result=babel.transformSync(js,{configFile:false,babelrc:false,plugins,comments:false,compact:true,minified:true,generatorOpts:{jsescOption:{minimal:false}},filename:nome+'.js'}).code;
 new vm.Script(result,{filename:nome+'.js'});
 if(result.includes('`'))throw Error('Template literal remanescente');
 fs.writeFileSync(path.join(root,'src',nome+'.html'),'<script>\n'+result+'\n</script>\n');
 console.log(nome+': sintaxe conferida; sem template literals, encadeamento opcional ou operador nulo.');
}
