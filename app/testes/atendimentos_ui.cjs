// Ciclo do caso na interface (prévia com dados fictícios).
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),path=require('path'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined});const page=await b.newPage({viewport:{width:1280,height:900}});const erros=[];page.on('pageerror',e=>erros.push(e.message));
const url='file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html'),out=process.env.SHOTS;
const abrirCaso=async q=>{await page.goto(url+'?inicial=1'+q);await page.locator('#roleView option').nth(0).waitFor({state:'attached'});await page.waitForTimeout(300);await page.locator('.nav-item[data-route=atendimentos]').click();await page.locator('[data-case]').nth(2).click();await page.locator('.case-status').waitFor();};
// Comunicação: consulta e observa, sem ações nem telefone.
await abrirCaso('&perfil=comunicacao');assert.equal(await page.locator('[data-caso-form]').count(),0);assert.match(await page.locator('#detailContent').textContent(),/Visível para Atendimento e Execução/);assert.equal(await page.locator('#noteForm').count(),1);
// Gestão: vê tudo (inclusive o contato), sem ações.
await abrirCaso('&perfil=gestao');assert.equal(await page.locator('[data-caso-form]').count(),0);assert.match(await page.locator('#detailContent').textContent(),/\(11\) 0000-0000/);
// Atendimento registra a execução em nome da engenharia.
await abrirCaso('&perfil=atendimento');await page.locator('[data-caso-form=execucao]').click();await page.locator('.case-form button[type=submit]').click();assert(await page.locator('.case-form textarea[name=feito]').evaluate(e=>!e.checkValidity()));
await page.fill('.case-form textarea[name=feito]','Reparo da calçada concluído.');await page.locator('.case-form button[type=submit]').click();await page.locator('.timeline .tipo-execucao').waitFor();
// Atendimento (perfil completo): atualizar, finalizar, reabrir.
await abrirCaso('');assert.deepEqual(await page.locator('[data-caso-form]').evaluateAll(b=>b.map(x=>x.dataset.casoForm)),['atualizar','execucao','finalizar','corrigir','incorporar']);
// Correção dos dados e ficha oficial.
await page.locator('[data-caso-form=corrigir]').click();await page.fill('.case-form input[name=nome]','Nome Corrigido');await page.fill('.case-form input[name=motivo]','Nome digitado errado');await page.locator('.case-form button[type=submit]').click();await page.locator('.timeline .tipo-correcaodeficha').waitFor();assert.match(await page.locator('#detailTitle').textContent(),/Nome Corrigido/);
await page.locator('[data-ficha-oficial]').click();await page.locator('[data-ficha-oficial]',{hasText:'em dia'}).waitFor();assert.equal(await page.locator('#detailContent a',{hasText:'Abrir PDF'}).count(),1);
await page.locator('[data-caso-form=finalizar]').click();await page.fill('.case-form textarea[name=conclusao]','Calçada refeita; moradora ciente.');if(out)await page.screenshot({path:out+'/caso_finalizar.png'});
await page.locator('.case-form button[type=submit]').click();await page.locator('[data-caso-form=reabrir]').waitFor();assert.match(await page.locator('.case-status').textContent(),/Concluído/);
await page.locator('[data-caso-form=reabrir]').click();await page.fill('.case-form textarea[name=motivo]','Vazamento voltou');await page.fill('.case-form input[name=proximaAcao]','Nova vistoria');await page.locator('.case-form button[type=submit]').click();await page.locator('[data-caso-form=finalizar]').waitFor();
assert.equal(await page.locator('.timeline .tipo-reabertura').count(),1);assert.deepEqual(erros,[]);await b.close();
console.log('PASS: ficha por perfil — Comunicação consulta (sem contato), Gestão vê sem editar, Atendimento registra execução, Atendimento corrige dados, gera a ficha oficial, finaliza e reabre; linha do tempo atualizada.');})().catch(e=>{console.error(e);process.exit(1);});
