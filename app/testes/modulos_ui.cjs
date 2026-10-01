// Interface de Obras e Fechamento na prévia (dados fictícios).
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),path=require('path'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined});const page=await b.newPage({viewport:{width:1280,height:900}});const erros=[];page.on('pageerror',e=>erros.push(e.message));
const url='file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html'),out=process.env.SHOTS;
await page.goto(url);await page.locator('#roleView option[value=administrativo]').waitFor({state:'attached'});
await page.locator('.nav-item[data-route=obras]').click();await page.locator('.obra-card').first().waitFor();assert.match(await page.locator('.results-head').textContent(),/2 obras exibidas/);
assert.match(await page.locator('#view').textContent(),/Revisada há 12 dias/);await page.locator('[data-obra-confirmar="OBR-0074"]').click();await page.getByText('Revisada hoje').waitFor();
await page.fill('#obraFiltros input[name=busca]','apia');await page.waitForTimeout(400);assert.equal(await page.locator('.obra-card').count(),1);assert.equal(await page.evaluate(()=>document.activeElement.name),'busca');
await page.fill('#obraFiltros input[name=busca]','');await page.waitForTimeout(400);
await page.locator('[data-obra-acao=nova]').click();await page.fill('#obraForm input[name=nome]','Rede Nova Teste');await page.locator('#obraForm input[value="Vila Linda"]').check();
if(out)await page.screenshot({path:out+'/obra_editor.png'});await page.locator('#obraForm button[type=submit]').click();await page.getByText('Rede Nova Teste').first().waitFor();
if(out)await page.screenshot({path:out+'/obras.png',fullPage:true});
await page.locator('.nav-item[data-route=fechamento]').click();await page.locator('.fechamento-item').first().waitFor();assert.equal(await page.locator('.fechamento-item').count(),4);
assert.match(await page.locator('.simple-table').textContent(),/\(parcial\)/);await page.fill('#gerarForm input[name=numero]','15');await page.locator('#gerarForm button').click();
await page.getByText('Abrir documento').waitFor();if(out)await page.screenshot({path:out+'/fechamento.png',fullPage:true});
await page.locator('[data-fechamento-ir]').nth(1).click();await page.locator('#recordFilters').waitFor();assert.equal(await page.locator('#recordFilters input[name=pendencia]').inputValue(),'publico');
// Colaboradora de Comunicação: vê Obras sem editar e vê Fechamento; Atendimento não vê Fechamento.
await page.goto(url+'?perfil=comunicacao');await page.locator('#roleView option[value=comunicacao]').waitFor({state:'attached'});assert(await page.locator('.nav-item[data-route=fechamento]').isVisible());
await page.locator('.nav-item[data-route=obras]').click();await page.locator('.obra-card').first().waitFor();assert.equal(await page.locator('[data-obra-acao=nova]').count(),0);assert.equal(await page.locator('[data-obra-confirmar]').count(),0);
await page.goto(url+'?perfil=atendimento');await page.locator('#roleView option[value=atendimento]').waitFor({state:'attached'});assert(await page.locator('.nav-item[data-route=fechamento]').isHidden());
assert.deepEqual(erros,[]);await b.close();console.log('PASS: Obras (filtro mantém foco, revisão diária, cadastro) e Fechamento (pendências, satisfação semanal, geração e atalho para a pendência) por perfil.');})().catch(e=>{console.error(e);process.exit(1);});
