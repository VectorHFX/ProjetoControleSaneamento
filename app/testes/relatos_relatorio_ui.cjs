// Para o relatório (2.43) na prévia: aba em Relatos só para quem revisa, situação de cada relato, revisão com texto, fotos
// (no máximo 8), prompt copiado e documento gerado. node app/testes/relatos_relatorio_ui.cjs  (FOTOS=pasta)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const ctx=await b.newContext({viewport:{width:1366,height:900}});await ctx.grantPermissions(['clipboard-read','clipboard-write']);await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const p=await ctx.newPage();const erros=[];p.on('pageerror',e=>erros.push(e.message));
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png'),fullPage:true});};
  const abrir=async q=>{await p.goto(url(q));await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});await p.locator('.welcome-pets, .mascot-stage, .panel-dias').first().waitFor();await p.evaluate(()=>document.querySelector('.nav-item[data-route=registros]').click());await p.locator('[data-rel-parte=relatos]').waitFor();};
  await abrir('?liberada=1&perfil=atendimento&latencia=20');assert.equal(await p.locator('[data-rel-parte=relatorio]').count(),0,'Atendimento não revisa');
  await abrir('?liberada=1&perfil=socioambiental&latencia=20');await p.locator('[data-rel-parte=relatorio]').click();await p.locator('.rr-card').first().waitFor();
  assert.deepEqual((await p.locator('.stat-row .stat-value').allTextContents()).map(t=>t.trim()),['1','1','1']);assert.equal(await p.locator('.rr-card').count(),3);
  assert.match(await p.locator('.rr-card').nth(2).textContent(),/Mudou na origem/);
  await p.selectOption('#rrTipo','CAO ou DDS');assert.equal(await p.locator('.rr-card').count(),1);await p.selectOption('#rrTipo','');
  await foto('relatorio-lista');
  // Revisar: prompt, fotos, relato curto barrado, gera.
  await p.locator('[data-rr-revisar="REG-rr1"]').click();await p.locator('#rrForm').waitFor();
  await p.locator('[data-rr-prompt]').click();await p.waitForFunction(()=>[...document.querySelectorAll('.toast,#toast,[role=status]')].some(t=>/Prompt copiado/.test(t.textContent)));assert.match(await p.evaluate(()=>navigator.clipboard.readText()),/não invente/);
  assert.equal(await p.locator('#rrForm [name=foto]:checked').count(),2,'as 2 primeiras marcadas');await p.locator('.rr-foto').nth(2).locator('input[type=checkbox]').click();assert.equal(await p.locator('#rrForm [name=foto]:checked').count(),2,'no máximo 2');
  await p.locator('.rr-foto').nth(1).locator('input[type=checkbox]').click();assert.equal(await p.locator('#rrForm [name=foto]:checked').count(),1);assert.match(await p.getAttribute('[data-rr-legenda=FOTO1]','placeholder'),/ - Evento - /);await p.fill('[data-rr-legenda=FOTO1]','Roda de conversa na praça');
  assert.equal(await p.locator('#rrForm [name=interrupcao], #rrForm [name=equipe]').count(),0,'quadro da Central: sem equipe e interrupção');assert.equal(await p.locator('#rrForm [name=atividade]').count(),1);
  await p.fill('#rrForm [name=relato]','Curto demais.');await p.locator('#rrForm [type=submit]').click();await p.locator('#rrErro:not([hidden])').waitFor();assert.match(await p.locator('#rrErro').textContent(),/curto demais/);
  await p.fill('#rrForm [name=relato]','A equipe social realizou roda de conversa com os moradores sobre a obra de esgoto, explicou as etapas e registrou as dúvidas sobre o acesso das garagens.');
  await p.locator('#rrForm [type=submit]').click();await p.locator('#detailContent .notice',{hasText:'Revisado por Victor (prévia) (versão 2)'}).waitFor();
  assert.match(await p.locator('#detailContent .rr-docs').textContent(),/FINAL: Docs · PDF · ORIGINAL: Docs · PDF/);assert.equal(await p.inputValue('[data-rr-legenda=FOTO1]'),'Roda de conversa na praça');
  await foto('relatorio-revisao');await p.locator('#closeDialog').click();
  assert.match(await p.locator('.rr-card').first().textContent(),/Revisado/);assert.deepEqual((await p.locator('.stat-row .stat-value').allTextContents()).map(t=>t.trim()),['0','1','2']);
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=390),true);
  assert.deepEqual(erros,[]);await b.close();
  console.log('PASS: para o relatório na tela — aba só para quem revisa, situação (pendente, mudou na origem, revisado), filtro por tipo, prompt copiado, fotos escolhidas, no máximo 2 fotos com legenda, relato curto barrado, FINAL e ORIGINAL gerados (Docs e PDF) e celular sem rolagem lateral.');
})().catch(e=>{console.error(e);process.exit(1);});
