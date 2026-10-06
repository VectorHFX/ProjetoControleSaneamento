// Teste de interface com a prévia (dados fictícios). Gere antes: python3 app/testes/gerar_previa.py
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),path=require('path'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined});const page=await b.newPage();await page.addInitScript(()=>{try{localStorage.setItem('cpt.menu',JSON.stringify({extras:true,admin:true}));}catch(_){}});/* grupos do menu abertos (preferência da pessoa) */const erros=[];page.on('pageerror',e=>erros.push(e.message));
const url='file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html');
// 1. Conta sem cadastro: nada de "Administrador", mensagem clara e diagnóstico.
await page.goto(url+'?perfil=negado');await page.getByText('Não conseguimos liberar sua entrada').waitFor();
assert.equal(await page.locator('#roleView').inputValue(),'');assert(await page.locator('#roleView').isDisabled());assert(!(await page.locator('#roleView').textContent()).includes('Administra'));
await page.locator('[data-check-access]').click();await page.getByText('VERIFICAR · Cadastro na aplicação').waitFor();
// 2. Colaboradora de Comunicação: vê sua visão, consegue consultar atendimentos e registrar observação.
await page.goto(url+'?perfil=comunicacao');await page.locator('#roleView option[value=comunicacao]').waitFor({state:'attached'});
assert.equal(await page.locator('#roleView').inputValue(),'comunicacao');assert(await page.locator('[data-route=equipe]').isHidden());assert(await page.locator('.nav-item[data-route=atendimentos]').isVisible());
assert.match(await page.locator('#accountLabel').textContent(),/Paula/);
await page.locator('.nav-item[data-route=atendimentos]').click();await page.locator('[data-case]').first().waitFor();
assert.deepEqual(await page.locator('#caseFilters select[name=estado] option').allTextContents(),['Todos os casos','Em aberto','Concluídos']);
await page.locator('[data-case]').first().click();await page.locator('#noteForm').waitFor();
await page.locator('#noteForm button[type=submit]').click();assert(await page.locator('#noteForm textarea').evaluate(e=>!e.checkValidity()));
// 2.31: "Fazer observação" leva ao campo; canal opcional em um toque; a observação vira recado para quem conduz.
await page.locator('[data-fazer-observacao]').click();await page.waitForFunction(()=>document.activeElement&&document.activeElement.name==='texto');
await page.locator('#noteForm .chip-opcao',{hasText:'Campo / itinerante'}).click();await page.fill('#noteForm textarea','Moradora informou retorno do vazamento.');await page.locator('#noteForm button[type=submit]').click();
await page.locator('#caseNotes .history-item').waitFor();assert.match(await page.locator('#caseNotes').textContent(),/retorno do vazamento/);await page.waitForFunction(()=>/receberam um recado/.test(document.querySelector('#toast').textContent));assert.equal(await page.locator('#noteForm textarea').inputValue(),'');
// 3. Proprietário: Administração técnica não aparece como "visão"; Equipe e acessos visível.
await page.goto(url);await page.locator('#roleView option[value=administrativo]').waitFor({state:'attached'});
const visoes=await page.locator('#roleView option').evaluateAll(o=>o.map(x=>x.value));assert(!visoes.includes('administrador'));assert(visoes.includes('comercializacao'));assert(await page.locator('[data-route=equipe]').isVisible());
await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.resolve(__dirname,'../previa/celular.png')});
assert.deepEqual(erros,[]);await b.close();console.log('PASS: acesso negado sem rótulo de administrador, visão real da colaboradora, filtro de situação, observações e Administração técnica separada.');})().catch(e=>{console.error(e);process.exit(1);});
