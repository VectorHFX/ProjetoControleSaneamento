// Programa Parceiros (2.41) na prévia: aba na Visão do mês (gestão), números conferidos sem gravar (bloco do mês ainda
// inexistente), Atualizar agora, Copiar prompt (área de transferência), textos revisados gravados com quem e quando.
// node app/testes/parceiros_ui.cjs  (FOTOS=pasta salva capturas)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const ctx=await b.newContext({viewport:{width:1366,height:900}});await ctx.grantPermissions(['clipboard-read','clipboard-write']);await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const p=await ctx.newPage();const erros=[];p.on('pageerror',e=>erros.push(e.message));
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png'),fullPage:true});};
  const abrir=async q=>{await p.goto(url(q));await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});await p.locator('.welcome-pets, .mascot-stage, .panel-dias').first().waitFor();await p.evaluate(()=>document.querySelector('.nav-item[data-route=inicio]').click());await p.locator('.panel-dias').waitFor();};
  await abrir('?liberada=1&perfil=socioambiental&latencia=20');assert.equal(await p.locator('[data-painel-aba=parceiros]').count(),0,'equipe não vê');
  await abrir('?liberada=1&latencia=40');await p.locator('[data-painel-aba=parceiros]').click();await p.locator('#parceirosBox .anexos-ind').waitFor();
  assert.match(await p.locator('#parceirosBox .anexos-topo').textContent(),/Conferido agora: nada foi gravado/);assert.match(await p.locator('#parceirosBox caption').textContent(),/o bloco do mês ainda não existe/);
  assert.equal(await p.locator('#parceirosBox .anexos-ind tbody tr').count(),13);
  const tiles=await p.locator('.pp-depo .stat-value').allTextContents();assert.deepEqual(tiles.map(t=>t.trim()),['23','2','6 sim','6']);
  // Copiar prompt.
  await p.locator('[data-parceiros-prompt]').click();await p.waitForFunction(()=>[...document.querySelectorAll('.toast,#toast,[role=status]')].some(t=>/Prompt copiado/.test(t.textContent)));
  assert.match(await p.evaluate(()=>navigator.clipboard.readText()),/não invente números/);
  await foto('parceiros');
  // Gravar textos: pelo menos um; depois mostra quem gravou.
  await p.locator('#ppTextos [type=submit]').click();await p.locator('#ppErro:not([hidden])').waitFor();assert.match(await p.locator('#ppErro').textContent(),/Cole ao menos/);
  await p.fill('#ppTextos [name=saneamento]','Os participantes avaliam bem o abastecimento.');await p.fill('#ppTextos [name=qualidade]','Não foram percebidas alterações no período.');
  await p.locator('#ppTextos [type=submit]').click();await p.locator('#ppTextos',{hasText:'Gravado por Victor (prévia)'}).waitFor();
  assert.equal(await p.locator('#ppTextos [name=saneamento]').inputValue(),'Os participantes avaliam bem o abastecimento.');
  // Atualizar agora: cria o bloco e grava.
  await p.locator('[data-parceiros-atualizar]').click();await p.waitForFunction(()=>/Atualizado agora/.test(document.querySelector('#parceirosBox .anexos-topo')?.textContent||''));
  assert.match(await p.locator('#parceirosBox caption').textContent(),/bloco do mês criado agora/);assert.equal(await p.locator('#parceirosBox .badge',{hasText:'Atualizado'}).count(),13);
  assert.equal(await p.locator('#ppTextos [name=qualidade]').inputValue(),'Não foram percebidas alterações no período.','textos continuam na tela');
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=390),true);
  assert.deepEqual(erros,[]);await b.close();
  console.log('PASS: parceiros na tela — aba só para a gestão, números conferidos sem gravar (bloco ainda inexistente), pesquisas do mês, Copiar prompt, textos revisados gravados com quem gravou, Atualizar agora cria o bloco e celular sem rolagem lateral.');
})().catch(e=>{console.error(e);process.exit(1);});
