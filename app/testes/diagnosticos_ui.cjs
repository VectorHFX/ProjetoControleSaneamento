// Diagnósticos como na Central (2.47) na prévia: lista para toda a equipe com a situação da revisão; revisão (registro de
// campo, síntese, situação, ficha oficial em "Mais detalhes", fotos com legenda); "Revisado" só da gerência; ficha Sabesp e
// apresentação geradas; "mudou no campo" barra a geração; por obra (consulta, tabela copiável) e vínculo; celular.
// node app/testes/diagnosticos_ui.cjs  (FOTOS=pasta)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const ctx=await b.newContext({viewport:{width:1366,height:900}});await ctx.grantPermissions(['clipboard-read','clipboard-write']);await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const p=await ctx.newPage();const erros=[];p.on('pageerror',e=>erros.push(e.message));
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png'),fullPage:true});};
  const toast=async re=>p.waitForFunction(r=>[...document.querySelectorAll('.toast,#toast,[role=status]')].some(t=>new RegExp(r).test(t.textContent)),re.source);
  const abrir=async q=>{await p.goto(url(q));await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});await p.locator('.welcome-pets, .mascot-stage, .panel-dias').first().waitFor();await p.evaluate(()=>document.querySelector('.nav-item[data-route=registros]').click());await p.locator('[data-rel-parte=diagnosticos]').click();await p.locator('.dg-card').first().waitFor();};
  const valores=async()=>(await p.locator('.stat-row .stat-value').allTextContents()).map(t=>t.trim());
  // Atendimento: consulta (sem revisar), filtro e detalhe.
  await abrir('?liberada=1&perfil=atendimento&latencia=20');
  assert.deepEqual(await valores(),['2','1','1']);assert.equal(await p.locator('.dg-card').count(),4);assert.equal(await p.locator('[data-dg-revisar]').count(),0,'Atendimento não revisa');
  assert.match(await p.locator('.dg-card').nth(1).textContent(),/Em revisão/);assert.match(await p.locator('.dg-card').nth(3).textContent(),/Revisado.*Mudou no campo/s);
  assert.match(await p.locator('.dg-card').nth(3).textContent(),/Ficha Sabesp \(PDF\)/);
  await p.selectOption('#dgFiltro','revisado');assert.equal(await p.locator('.dg-card').count(),1);await p.selectOption('#dgFiltro','');
  await p.fill('#dgBusca','exemplo');await p.waitForTimeout(350);assert.equal(await p.locator('.dg-card').count(),1);await p.fill('#dgBusca','');await p.waitForTimeout(350);
  await p.locator('[data-dg-ver="REG-dg1"]').click();await p.locator('#detailContent .dg-campos').first().waitFor();assert.equal(await p.locator('#detailContent .dg-fotos img').count(),3);assert.equal(await p.locator('#detailContent [data-dg-revisar]').count(),0);
  await p.locator('#closeDialog').click();
  // Socioambiental: revisa e manda para revisão; não aprova.
  await abrir('?liberada=1&perfil=socioambiental&latencia=20');await foto('diagnosticos-lista');
  await p.locator('[data-dg-revisar="REG-dg1"]').click();await p.locator('#dgForm').waitFor();
  assert.equal(await p.inputValue('#dgForm [name=titulo]'),'Diagnóstico local: Viela Carijós');assert.match(await p.inputValue('#dgForm [name=texto]'),/Trecho residencial/);
  assert.equal(await p.locator('#dgForm [name=situacao][value=revisado]').isDisabled(),true,'Revisado só da gerência');
  assert.equal(await p.locator('#dgForm .mais-detalhes').getAttribute('open'),null,'ficha oficial fica em Mais detalhes');assert.equal(await p.locator('[data-oficial]').count(),24);
  assert.equal(await p.inputValue('[data-oficial=residencias]'),'120');assert.equal(await p.locator('[data-dg-doc]').count(),0,'sem revisão salva, sem gerar');
  await p.locator('.dg-foto').nth(0).locator('input[type=checkbox]').check();await p.fill('[data-legenda="REG-dg1-f0"]','Esquina da escola');
  await p.fill('#dgForm [name=encaminhamentos]','Avisar a escola antes da obra.');await p.check('#dgForm [name=situacao][value=revisao]');
  await p.locator('#dgForm [type=submit]').click();await toast(/Revisão 1 salva \(Em revisão\)/);await p.locator('[data-dg-doc=ficha]').waitFor();
  await foto('diagnostico-revisao');
  await p.locator('[data-dg-doc=ficha]').click();await toast(/Ficha Sabesp gerada/);await p.locator('.dg-documentos a',{hasText:'Google Docs'}).waitFor();
  await p.locator('[data-dg-doc=slides]').click();await toast(/Apresentação gerada/);await p.locator('.dg-documentos a',{hasText:'Google Slides'}).waitFor();
  await p.fill('#dgForm [name=texto]','Síntese revisada.');assert.equal(await p.locator('#dgAvisoSalvar').isHidden(),false,'avisa que há mudança não salva');
  await p.locator('#closeDialog').click();await p.waitForFunction(()=>/Em revisão/.test(document.querySelector('.dg-card:nth-child(4)')?.textContent||'')||[...document.querySelectorAll('.dg-card')].some(c=>/Rua Fictícia, 100/.test(c.textContent)&&/Em revisão/.test(c.textContent)));
  // Gestão: aprova; "mudou no campo" barra a geração.
  await abrir('?liberada=1&perfil=gestao&latencia=20');
  await p.locator('[data-dg-revisar="REG-dg1"]').click();await p.locator('#dgForm').waitFor();assert.equal(await p.locator('#dgForm [name=situacao][value=revisado]').isDisabled(),false);
  await p.check('#dgForm [name=situacao][value=revisado]');await p.locator('#dgForm [type=submit]').click();await toast(/\(Revisado\)/);await p.locator('#closeDialog').click();
  await p.locator('[data-dg-revisar="REG-dg3"]').click();await p.locator('#dgForm').waitFor();assert.match(await p.locator('#detailContent .notice.warning').textContent(),/mudou depois desta revisão/);
  assert.equal(await p.locator('[data-dg-doc=ficha]').isDisabled(),true);await p.locator('#closeDialog').click();
  // Por obra (consulta) e vínculo.
  await p.locator('[data-dg-vista=obras]').click();await p.locator('[data-dg-obra="OBR-0001"]').waitFor();
  await p.locator('[data-dg-obra="OBR-0001"]').click();await p.locator('#detailContent .dg-tabela').waitFor();assert.equal(await p.locator('#detailContent [data-dg-gerar]').count(),0,'por obra é só consulta');
  await p.locator('[data-dg-copiar]').click();await toast(/Tabela copiada/);assert.match(await p.evaluate(()=>navigator.clipboard.readText()),/^Data\tTrecho\tIPVS/);await p.locator('#closeDialog').click();
  await p.selectOption('#dgObra-REG-dg4','OBR-0001');await p.locator('[data-dg-vincular="REG-dg4"]').click();await p.waitForFunction(()=>!document.querySelector('.dg-sem'));
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=390),true);
  await p.locator('[data-dg-vista=lista]').click();await p.locator('[data-dg-revisar="REG-dg2"]').click();await p.locator('#dgForm').waitFor();await p.waitForTimeout(150);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=390),true,'revisão cabe no celular');await foto('diagnostico-celular');
  assert.deepEqual(erros,[]);await b.close();
  console.log('PASS: diagnósticos na tela (como na Central) — lista com situação e documentos, filtro e busca, revisão (registro de campo, síntese, ficha oficial em Mais detalhes, fotos com legenda), Revisado só da gerência, ficha Sabesp e apresentação geradas, mudança não salva avisada, "mudou no campo" barra a geração, por obra só consulta (tabela copiável), vínculo e celular.');
})().catch(e=>{console.error(e);process.exit(1);});
