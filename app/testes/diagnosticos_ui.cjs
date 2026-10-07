// Diagnósticos por obra (2.46) na prévia: aba em Relatos para toda a equipe, cartões por obra com a situação do documento,
// tabela da obra (copiável), detalhe do diagnóstico, vínculo da gerência e documento gerado; celular sem rolagem lateral.
// node app/testes/diagnosticos_ui.cjs  (FOTOS=pasta)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const ctx=await b.newContext({viewport:{width:1366,height:900}});await ctx.grantPermissions(['clipboard-read','clipboard-write']);await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const p=await ctx.newPage();const erros=[];p.on('pageerror',e=>erros.push(e.message));
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png'),fullPage:true});};
  const abrir=async q=>{await p.goto(url(q));await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});await p.locator('.welcome-pets, .mascot-stage, .panel-dias').first().waitFor();await p.evaluate(()=>document.querySelector('.nav-item[data-route=registros]').click());await p.locator('[data-rel-parte=diagnosticos]').click();await p.locator('.dg-card').first().waitFor();};
  // Atendimento: consulta, sem gerar nem vincular.
  await abrir('?liberada=1&perfil=atendimento&latencia=20');
  assert.deepEqual((await p.locator('.stat-row .stat-value').allTextContents()).map(t=>t.trim()),['4','2','1']);
  assert.equal(await p.locator('[data-dg-vincular]').count(),0);assert.match(await p.locator('.dg-sem').textContent(),/A Gestão ou o Administrativo vinculam/);
  await p.locator('[data-dg-obra="OBR-0001"]').click();await p.locator('#detailContent .dg-tabela').waitFor();assert.equal(await p.locator('[data-dg-gerar]').count(),0,'Atendimento não gera');
  assert.equal(await p.locator('#detailContent .dg-tabela tbody tr').count(),2);
  await p.locator('[data-dg-copiar]').click();await p.waitForFunction(()=>[...document.querySelectorAll('.toast,#toast,[role=status]')].some(t=>/Tabela copiada/.test(t.textContent)));
  const copiado=await p.evaluate(()=>navigator.clipboard.readText());assert.match(copiado,/^Data\tTrecho\tIPVS/);assert.match(copiado,/10\/08\/2026\tRua Fictícia, 100\tGrupo 4 \(média\)/);assert.match(copiado,/80 \/ —/);
  await p.locator('#detailContent [data-dg-ver="REG-dg1"]').click();await p.locator('#detailContent .dg-campos').first().waitFor();
  assert.match(await p.locator('#detailTitle').textContent(),/10\/08\/2026 · Rua Fictícia, 100/);assert.equal(await p.locator('#detailContent .dg-bloco').count(),6);assert.equal(await p.locator('#detailContent .dg-fotos img').count(),3);
  await foto('diagnostico-detalhe');await p.locator('#closeDialog').click();
  // Gestão: vincula o sem obra e gera o documento.
  await abrir('?liberada=1&perfil=gestao&latencia=20');await foto('diagnosticos-lista');
  assert.match(await p.locator('.dg-card').nth(1).textContent(),/Mudou desde o documento/);
  await p.locator('[data-dg-vincular="REG-dg4"]').click();await p.waitForFunction(()=>[...document.querySelectorAll('.toast,#toast,[role=status]')].some(t=>/Escolha a obra/.test(t.textContent)));
  await p.selectOption('#dgObra-REG-dg4','OBR-0001');await p.locator('[data-dg-vincular="REG-dg4"]').click();await p.waitForFunction(()=>!document.querySelector('.dg-sem')&&document.querySelectorAll('.dg-card').length===2);
  assert.deepEqual((await p.locator('.stat-row .stat-value').allTextContents()).map(t=>t.trim()),['4','2','0']);assert.match(await p.locator('.dg-card').first().textContent(),/3 diagnósticos/);
  await p.locator('[data-dg-obra="OBR-0001"]').click();await p.locator('[data-dg-gerar="OBR-0001"]').click();
  await p.locator('#detailContent a',{hasText:'Abrir documento'}).waitFor();assert.match(await p.locator('#detailContent').textContent(),/Documento em dia/);assert.match(await p.locator('[data-dg-gerar]').textContent(),/Gerar de novo/);
  await foto('diagnostico-obra');await p.locator('#closeDialog').click();assert.match(await p.locator('.dg-card').first().textContent(),/Documento v1 por Victor/);
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=390),true);
  await p.locator('[data-dg-obra="OBR-0001"]').click();await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=390),true,'tabela rola dentro da caixa');await foto('diagnostico-celular');
  assert.deepEqual(erros,[]);await b.close();
  console.log('PASS: diagnósticos na tela — aba para toda a equipe, cartões por obra com a situação do documento, tabela copiável (texto e Docs), detalhe por blocos com fotos, vínculo da gerência (obra obrigatória), documento gerado e celular sem rolagem lateral.');
})().catch(e=>{console.error(e);process.exit(1);});
