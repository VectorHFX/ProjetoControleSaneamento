// Visão geral e velocidade de abertura na prévia (latência simulada de 1 s por chamada).
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),path=require('path'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined});const page=await b.newPage({viewport:{width:1366,height:900}});const erros=[];page.on('pageerror',e=>erros.push(e.message));
const url='file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html');const t0=Date.now();
await page.goto(url+'?inicial=1&latencia=1000');await page.locator('.stat-value').first().waitFor();await page.locator('#homeAgenda .peek-row').first().waitFor();const total=Date.now()-t0;
const ch=await page.evaluate(()=>window.CPT_PREVIA.chamadas);assert(!ch.some(c=>c.nome==='carregarPerfilCPT'),'perfil já vem na página');
const ini=ch.find(c=>c.nome==='carregarInicioCPT'),ag=ch.find(c=>c.nome==='carregarCronogramaCPT');assert(Math.abs(ini.inicio-ag.inicio)<150,'mês e agenda em paralelo');assert(total<2600,'abertura em ~1 chamada: '+total+'ms');
assert.equal(await page.locator('.stat-tile').count(),4);assert.equal(await page.locator('.feature-tile').count(),0,'sem atalhos duplicados da navegação');
await page.locator('.day-chart .hit').nth(8).hover();assert.match(await page.locator('.chart-tip').textContent(),/09\/09\/2026 · \d+ aç(ão|ões)/);
await page.locator('#homeAgenda .peek-row').first().click();await page.waitForTimeout(200);assert(await page.locator('#detailDialog').evaluate(d=>d.open),'detalhe da atividade abre sem nova consulta');await page.keyboard.press('Escape');
const antes=(await page.evaluate(()=>window.CPT_PREVIA.chamadas.length));await page.locator('#refresh').click();await page.waitForTimeout(1300);
const novas=await page.evaluate(n=>window.CPT_PREVIA.chamadas.slice(n).map(c=>c.nome),antes);assert(novas.includes('carregarInicioCPT')&&novas.includes('carregarCronogramaCPT'));
await page.locator('.chip-alert').click();await page.locator('#recordFilters').waitFor();assert.equal(await page.locator('#recordFilters input[name=pendencia]').inputValue(),'publico');
assert.deepEqual(erros,[]);await b.close();console.log('PASS: abertura em '+total+' ms com 1 s de latência (perfil embutido, mês e agenda em paralelo), gráfico com valor no hover, agenda abre detalhe, Atualizar recarrega, pendência leva ao filtro.');})().catch(e=>{console.error(e);process.exit(1);});
