// Dia e mês do atendimento (2.42) na prévia: mensagem do dia (preparar só para Gestão/Administrativo, no máximo 3 casos,
// publicar, copiar) e o e-mail do mês copiado como HTML para o Gmail. node app/testes/atendimento_dia_ui.cjs  (FOTOS=pasta)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const ctx=await b.newContext({viewport:{width:1366,height:900}});await ctx.grantPermissions(['clipboard-read','clipboard-write']);await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const p=await ctx.newPage();const erros=[];p.on('pageerror',e=>erros.push(e.message));
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png'),fullPage:true});};
  const toast=async re=>p.waitForFunction(r=>[...document.querySelectorAll('.toast,#toast,[role=status]')].some(t=>new RegExp(r).test(t.textContent)),re.source);
  const abrir=async q=>{await p.goto(url(q));await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});await p.locator('.welcome-pets, .mascot-stage, .panel-dias').first().waitFor();
    await p.evaluate(()=>document.querySelector('.nav-item[data-route=atendimentos]').click());await p.locator('#caseFilters').waitFor();await p.locator('[data-atd-modo=dia]').click();await p.locator('.dia-grid').waitFor();};
  // 1. Atendimento: vê a mensagem (ainda não publicada) e o e-mail, mas não prepara.
  await abrir('?liberada=1&perfil=atendimento&latencia=20');assert.match(await p.locator('.dia-grid').textContent(),/Ainda não publicada hoje/);assert.equal(await p.locator('#diaForm').count(),0);assert.ok(await p.locator('[data-dia-email]').count());
  // 2. Gestão: prepara; no máximo 3 casos; publica; copia a mensagem.
  await abrir('?liberada=1&latencia=20');assert.match(await p.locator('.dia-grid .stat-row').first().textContent(),/Caso 61/);
  await p.locator('#diaForm [type=submit]').click();await p.locator('#diaErro:not([hidden])').waitFor();
  const cx=p.locator('#diaForm [name=caso]');for(let i=0;i<4;i++)await p.locator('.dia-caso').nth(i).click();
  assert.equal(await p.locator('#diaForm [name=caso]:checked').count(),3,'no máximo 3');assert.match(await p.locator('#diaConta').textContent(),/3 de 3/);
  await p.locator('.dia-caso').nth(2).click();await p.locator('#diaForm summary').click();await p.fill('#diaForm [name=nota]','Prioridade para a vistoria.');await p.locator('#diaForm [type=submit]').click();
  await p.locator('.dia-msg').waitFor();const t=await p.locator('.dia-msg').textContent();assert.match(t,/• Caso 12 · Vazamento na calçada — com Execução/);assert.match(t,/• Caso 31/);assert.doesNotMatch(t,/Caso 47 ·/);assert.match(t,/Prioridade para a vistoria/);
  assert.match(await p.locator('#diaForm [type=submit]').textContent(),/Publicar de novo/);
  await p.locator('[data-dia-copiar]').click();await toast(/Mensagem copiada/);assert.match(await p.evaluate(()=>navigator.clipboard.readText()),/Para trabalhar hoje/);
  await foto('dia');
  // 3. E-mail do mês: copiado como HTML (tabela) e texto; assunto à parte.
  await p.locator('[data-dia-email]').click();await toast(/E-mail copiado/);
  const html=await p.evaluate(async()=>{const it=(await navigator.clipboard.read())[0];return it.types.includes('text/html')?await (await it.getType('text/html')).text():'';});assert.match(html,/<table/);assert.match(html,/Moradora Fictícia da Silva/);
  await p.locator('[data-dia-assunto]').click();await toast(/Assunto copiado/);assert.equal(await p.evaluate(()=>navigator.clipboard.readText()),'Atendimentos de setembro de 2026 — relatório do mês');
  await p.locator('.dia-grid details summary',{hasText:'Ver o e-mail'}).click();await p.locator('.email-previa table').waitFor();
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=390),true);
  assert.deepEqual(erros,[]);await b.close();
  console.log('PASS: dia e mês — Atendimento vê e não prepara, Gestão escolhe no máximo 3 casos e publica (recado em Mais detalhes), copiar mensagem, e-mail do mês copiado como HTML com a tabela e assunto à parte, celular sem rolagem lateral.');
})().catch(e=>{console.error(e);process.exit(1);});
