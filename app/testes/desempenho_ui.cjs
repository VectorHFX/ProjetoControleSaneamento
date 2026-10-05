// Desempenho na prévia: tela sem "pulos" (CLS), esqueletos, avisos pedidos depois, contatos em páginas, busca com espera curta e miniaturas preguiçosas.
// node app/testes/desempenho_ui.cjs
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:412,height:823}});await p.addInitScript(()=>{try{localStorage.setItem('cpt.menu',JSON.stringify({mes:true,consulta:true}));}catch(_){}});/* grupos do menu abertos (preferência da pessoa) */const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q;
  await p.addInitScript(()=>{window.__cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value;}).observe({type:'layout-shift',buffered:true});});
  // 1) Entrada como na implantação (perfil embutido): a tela não pula quando os dados chegam.
  await p.goto(url('?inicial=1&latencia=150'));await p.locator('.panel-dias').waitFor();await p.waitForTimeout(1800);
  const cls=await p.evaluate(()=>window.__cls);assert.ok(cls<0.1,'CLS '+cls.toFixed(3)+' deve ficar abaixo de 0,1');
  // 2) Avisos de recados pedidos depois dos dados do mês (não disputam a primeira tela).
  const ch=await p.evaluate(()=>window.CPT_PREVIA.chamadas.map(c=>[c.nome,c.inicio]));
  const ini=ch.find(c=>c[0]==='carregarInicioCPT'),avi=ch.find(c=>c[0]==='contarAvisosCPT');assert.ok(ini&&avi&&avi[1]>ini[1]+1000,'contarAvisosCPT adiado: '+JSON.stringify(ch));
  // 3) Esqueleto enquanto a página carrega.
  await p.goto(url('?inicial=1&latencia=900'));await p.locator('.panel-dias').waitFor();
  await p.locator('#tabMenu').click();await p.locator('.nav-item[data-route=obras]').click();await p.locator('.skel-list .skeleton').first().waitFor();await p.locator('.skel-list').waitFor({state:'detached'});
  // 4) Contatos: 50 por vez (2.13: linhas), "Mostrar mais", busca com espera curta.
  await p.goto(url('?inicial=1&latencia=20'));await p.locator('.panel-dias').waitFor();
  await p.locator('#tabMenu').click();await p.locator('.nav-item[data-route=contatos]').click();await p.locator('.contacts-table .list-row').first().waitFor();
  await p.evaluate(()=>{for(let i=0;i<130;i++)window.CPT_COM.contatos.push({id:'CON-X'+i,versao:1,nome:'Contato extra '+i,instituicao:'',tipo:'Comércio',telefone:'',email:'',endereco:'',bairro:'Vila Linda',frente:'',etiquetas:i===77?'padaria-unica':'',observacao:'',registros:[]});});
  await p.locator('#refresh').click();await p.waitForFunction(()=>document.querySelectorAll('.contacts-table .list-row').length>=50);
  const total=await p.evaluate(()=>window.CPT_COM.contatos.length);
  assert.equal(await p.locator('.contacts-table .list-row').count(),50,'primeira página');assert.match(await p.locator('[data-con-mais]').textContent(),/Mostrar mais 50/);
  await p.locator('[data-con-mais]').click();assert.equal(await p.locator('.contacts-table .list-row').count(),100);
  await p.locator('[data-con-mais]').click();assert.equal(await p.locator('.contacts-table .list-row').count(),total,'todos depois de mostrar mais');assert.equal(await p.locator('[data-con-mais]').count(),0);
  await p.locator('#conFiltro [name=busca]').pressSequentially('padaria-un',{delay:30});
  assert.ok(await p.locator('.contacts-table .list-row').count()>1,'enquanto digita, não redesenha a cada tecla');
  await p.waitForFunction(()=>document.querySelectorAll('.contacts-table .list-row').length===1);assert.equal(await p.evaluate(()=>document.activeElement.name),'busca');
  assert.equal(await p.locator('#conFiltro [name=busca]').inputValue(),'padaria-un','nenhuma letra perdida');
  // 5) Galeria: miniaturas pequenas, carregadas só quando aparecem.
  await p.locator('#tabMenu').click();await p.locator('.nav-item[data-route=comunicacao]').click();await p.locator('[data-com-aba=galeria]').click();await p.locator('.photo').first().waitFor();
  const img=await p.locator('.photo-open img').first().evaluate(i=>({l:i.getAttribute('loading'),d:i.getAttribute('decoding'),src:i.getAttribute('src')}));
  assert.equal(img.l,'lazy');assert.equal(img.d,'async');assert.match(img.src,/sz=w360$/);
  assert.deepEqual(errors,[]);
  console.log('PASS: desempenho na prévia — CLS '+cls.toFixed(3)+', avisos pedidos depois da primeira tela, esqueleto ao carregar, contatos de 50 em 50, busca com espera curta sem perder letras e miniaturas preguiçosas.');
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
