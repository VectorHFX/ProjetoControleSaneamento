// Fichas oficiais (2.38) na prévia: aba em Atendimentos para quem gera fichas, quatro números, "Atualizar todas" que continua
// sozinho até terminar (com progresso), aviso de quando a pasta antiga pode ser apagada e pacote do mês.
// node app/testes/fichas_ui.cjs  (FOTOS=pasta salva capturas)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});const erros=[];p.on('pageerror',e=>erros.push(e.message));await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png'),fullPage:true});};
  const atendimentos=async q=>{await p.goto(url(q));await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});await p.locator('.welcome-pets, .mascot-stage, .panel-dias').first().waitFor();await p.evaluate(()=>document.querySelector('.nav-item[data-route=atendimentos]').click());await p.locator('#caseFilters').waitFor();};
  // 1. Socioambiental não vê a aba (nem Auditoria).
  await atendimentos('?liberada=1&perfil=socioambiental&latencia=20');assert.equal(await p.locator('[data-atd-modo]').count(),0);
  // 2. Comunicação vê Casos e Fichas oficiais (gera fichas), sem Auditoria.
  await atendimentos('?liberada=1&perfil=comunicacao&latencia=20');assert.deepEqual(await p.locator('[data-atd-modo]').evaluateAll(b=>b.map(x=>x.dataset.atdModo)),['casos','fichas']);
  // 3. Proprietário (Administrativo): os quatro números, pasta, corrigir e rotina.
  await atendimentos('?liberada=1&latencia=60');await p.locator('[data-atd-modo=fichas]').click();await p.locator('.fichas-grid').waitFor();
  const n=await p.locator('.stat-row .stat-value').allTextContents();assert.deepEqual(n,['38','7','22','2']);
  assert.match(await p.locator('.fichas-grid h2').first().textContent(),/29 fichas para atualizar/);
  assert.equal(await p.locator('.fichas-grid a',{hasText:'Abrir pasta'}).getAttribute('href'),'https://drive.google.com/drive/folders/previa-nova');
  assert.match(await p.locator('.fichas-antiga').textContent(),/Ainda há 22 fichas na pasta antiga/);assert.equal(await p.locator('.fichas-liberada').count(),0);
  assert.match(await p.locator('.fichas-corrigir summary').textContent(),/Sem nome ou solicitação/);assert.match(await p.locator('.fichas-grid').textContent(),/Última rotina automática: 07\/10\/2026, 00:02 · Fichas oficiais: 2 gerada/);
  await foto('fichas-antes');
  // 4. Atualizar todas: continua sozinho, mostra o progresso e termina com tudo em dia e a pasta antiga liberada.
  await p.locator('[data-fichas-todas]').click();await p.locator('#fichasProgresso .meter').waitFor();
  assert.match(await p.locator('#fichasProgresso').textContent(),/fichas prontas; faltam \d+\. Continuando/);
  await p.locator('#fichasProgresso .ok-line').waitFor({timeout:15000});assert.match(await p.locator('#fichasProgresso').textContent(),/7 fichas geradas e 22 organizadas/);
  assert.deepEqual(await p.locator('.stat-row .stat-value').allTextContents(),['67','0','0','2']);assert.match(await p.locator('.fichas-grid h2').first().textContent(),/Tudo em dia/);
  assert.equal(await p.locator('[data-fichas-todas]').isDisabled(),true);assert.match(await p.locator('.fichas-liberada').textContent(),/pode ser apagada/);
  // 5. Pacote do mês: padrão é o mês anterior; resultado com grupos, pendências e a pasta.
  const meses=await p.locator('#pacoteForm select option').evaluateAll(o=>o.map(x=>x.value));assert.equal(meses.length,12);assert.equal(await p.locator('#pacoteForm select').inputValue(),meses[1]);
  await p.selectOption('#pacoteForm select','2026-09');await p.locator('#pacoteForm [type=submit]').click();await p.locator('.pacote-pronto').waitFor();
  const t=await p.locator('.pacote-pronto').textContent();assert.match(t,/setembro de 2026: 23 casos/);assert.match(t,/9 abertos · 6 concluídos · 8 em andamento/);assert.match(t,/2 casos sem ficha/);
  assert.equal(await p.locator('.pacote-pronto a').getAttribute('href'),'https://drive.google.com/drive/folders/previa-pacote');assert.ok(await p.locator('.pacote-pronto.is-warn').count());
  await foto('fichas-depois');
  // 6. Caso a corrigir abre a ficha.
  await p.locator('.fichas-corrigir summary').click();await p.locator('.fichas-corrigir [data-case]').first().click();await p.waitForFunction(()=>/41/.test(document.querySelector('#detailTitle').textContent));await p.locator('#closeDialog').click();
  // 7. Celular: sem rolagem lateral.
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=390),true);await foto('fichas-celular');
  assert.deepEqual(erros,[]);await b.close();
  console.log('PASS: fichas oficiais na tela — aba só para quem gera fichas, quatro números, Atualizar todas com progresso até terminar, aviso de que a pasta antiga pode ser apagada, pacote do mês (mês anterior por padrão, grupos e pendências) e celular sem rolagem lateral.');
})().catch(e=>{console.error(e);process.exit(1);});
