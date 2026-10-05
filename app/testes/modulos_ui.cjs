// Interface de Obras e Fechamento na prévia (dados fictícios).
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),path=require('path'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined});const page=await b.newPage({viewport:{width:1280,height:900}});await page.addInitScript(()=>{try{localStorage.setItem('cpt.menu',JSON.stringify({mes:true,consulta:true}));}catch(_){}});/* grupos do menu abertos (preferência da pessoa) */const erros=[];page.on('pageerror',e=>erros.push(e.message));
const url='file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html'),out=process.env.SHOTS;
await page.goto(url);await page.locator('#roleView option[value=administrativo]').waitFor({state:'attached'});
await page.locator('.nav-item[data-route=obras]').click();await page.locator('.obra-card').first().waitFor();assert.match(await page.locator('.results-head').textContent(),/2 obras exibidas/);
assert.match(await page.locator('#view').textContent(),/Revisada há 12 dias/);await page.locator('[data-obra-confirmar="OBR-0074"]').click();await page.getByText('Revisada hoje').waitFor();
await page.fill('#obraFiltros input[name=busca]','apia');await page.waitForTimeout(400);assert.equal(await page.locator('.obra-card').count(),1);assert.equal(await page.evaluate(()=>document.activeElement.name),'busca');
await page.fill('#obraFiltros input[name=busca]','');await page.waitForTimeout(400);
await page.locator('[data-obra-acao=nova]').click();await page.fill('#obraForm input[name=nome]','Rede Nova Teste');await page.locator('#obraForm input[value="Vila Linda"]').check();
if(out)await page.screenshot({path:out+'/obra_editor.png'});await page.locator('#obraForm button[type=submit]').click();await page.getByText('Rede Nova Teste').first().waitFor();
// Nome de uso em destaque, oficial abaixo; apelidos entram na busca.
const viela=page.locator('.obra-card',{hasText:'OBR-0117'});assert.equal(await viela.locator('h3').textContent(),'Viela Carijós');assert.match(await viela.locator('.obra-oficial').textContent(),/Viela Sanitária x Carijós/);
await page.fill('#obraFiltros input[name=busca]','grande');await page.waitForTimeout(400);assert.equal(await page.locator('.obra-card').count(),1);await page.fill('#obraFiltros input[name=busca]','');await page.waitForTimeout(400);
await page.locator('[data-obra="OBR-0074"]').click();await page.fill('#obraForm input[name=nomeUso]','Orquídea');await page.fill('#obraForm input[name=apelidos]','Apiaí, Margem esquerda');
await page.locator('#obraForm button[type=submit]').click();await page.locator('.obra-card h3',{hasText:/^Orquídea$/}).waitFor();
// Bairros: cadastrar e tirar do formulário.
await page.locator('#bairrosPainel summary').click();assert.equal(await page.locator('.bairro-row').count(),3);
await page.locator('[data-bairro-novo]').click();await page.fill('#bairroForm input[name=nome]','Vila Nova');await page.fill('#bairroForm input[name=apelidos]','VN');await page.locator('#bairroForm button[type=submit]').click();
await page.locator('.bairro-row',{hasText:'Vila Nova'}).waitFor();assert.equal(await page.locator('.bairro-row').count(),4);
await page.locator('[data-bairro="Vila Assunção"]').click();assert(await page.locator('#bairroForm input[name=nome]').isDisabled(),'nome do bairro não muda');await page.locator('#bairroForm input[name=noFormulario]').uncheck();await page.locator('#bairroForm button[type=submit]').click();
await page.locator('.bairro-row',{hasText:'Vila Assunção'}).locator('text=Fora do formulário').waitFor();
if(out)await page.screenshot({path:out+'/obras.png',fullPage:true});
await page.locator('.nav-item[data-route=fechamento]').click();await page.locator('.fechamento-item').first().waitFor();assert.equal(await page.locator('.fechamento-item').count(),4);
// Entregas do mês: 4 cartões; relatório já gerado começa "Em preparo"; atualizar, entregar (retrato) e .zip das fichas.
await page.locator('.entrega-card').nth(3).waitFor();assert.equal(await page.locator('.entrega-card').count(),4);assert.equal(await page.locator('.page-intro h1').first().textContent().then(t=>t.trim()),'Entregas do mês');
const rel=page.locator('.entrega-card[data-entrega=relatorio]');assert.match(await rel.locator('.badge').textContent(),/Em preparo/);assert.match(await page.locator('.entrega-card[data-entrega=anexos] .badge').textContent(),/A fazer/);
await rel.locator('[data-entrega-editar]').click();await page.selectOption('#entregaForm [name=situacao]','revisao');await page.selectOption('#entregaForm [name=responsavel]','ana@example.com');await page.locator('#entregaForm button[type=submit]').click();
await page.waitForFunction(()=>/Em revisão/.test(document.querySelector('.entrega-card[data-entrega=relatorio] .badge').textContent));assert.match(await rel.locator('.entrega-meta').textContent(),/Ana \(demo\)/);
await page.locator('.entrega-card[data-entrega=anexos] [data-entrega-editar]').click();await page.selectOption('#entregaForm [name=situacao]','entregue');await page.locator('#entregaForm button[type=submit]').click();
await page.getByText('Ainda não há arquivo desta entrega').waitFor();await page.locator('#closeDialog').click();
await rel.locator('[data-entrega-editar]').click();await page.selectOption('#entregaForm [name=situacao]','entregue');await page.locator('#entregaForm button[type=submit]').click();
await page.locator('.entrega-card.acabou-de-entregar[data-entrega=relatorio]').waitFor();assert.match(await rel.locator('.entrega-retratos summary').textContent(),/Entregas anteriores \(1\)/);
assert.match(await page.locator('.entregas-topo h2').textContent(),/1 de 4/);
await page.locator('[data-entrega-zip]').click();await page.locator('.entrega-card[data-entrega=atendimentos] .entrega-arquivo',{hasText:'.zip das fichas'}).waitFor();
if(out)await page.locator('#entregasMes').screenshot({path:out+'/entregas.png'});
assert.match(await page.locator('.simple-table').textContent(),/\(parcial\)/);await page.fill('#gerarForm input[name=numero]','15');await page.locator('#gerarForm button').click();
await page.getByText('Abrir documento').waitFor();if(out)await page.screenshot({path:out+'/fechamento.png',fullPage:true});
await page.locator('[data-fechamento-ir]').nth(1).click();await page.locator('#recordFilters').waitFor();assert.equal(await page.locator('#recordFilters input[name=pendencia]').inputValue(),'publico');
// Colaboradora de Comunicação: vê Obras sem editar e vê Fechamento; Atendimento não vê Fechamento.
await page.goto(url+'?perfil=comunicacao');await page.locator('#roleView option[value=comunicacao]').waitFor({state:'attached'});assert(await page.locator('.nav-item[data-route=fechamento]').isVisible());
await page.locator('.nav-item[data-route=fechamento]').click();await page.locator('.entrega-card').nth(3).waitFor();assert.equal(await page.locator('[data-entrega-editar]').count(),0,'Comunicação acompanha sem alterar (período de testes)');
await page.locator('.nav-item[data-route=obras]').click();await page.locator('.obra-card').first().waitFor();assert.equal(await page.locator('[data-obra-acao=nova]').count(),0);assert.equal(await page.locator('[data-obra-confirmar]').count(),0);assert.equal(await page.locator('[data-bairro-novo]').count(),0);
await page.goto(url+'?perfil=atendimento');await page.locator('#roleView option[value=atendimento]').waitFor({state:'attached'});assert(await page.locator('.nav-item[data-route=fechamento]').isHidden());
assert.deepEqual(erros,[]);await b.close();console.log('PASS: Obras (filtro mantém foco, revisão diária, cadastro) e Fechamento (pendências, satisfação semanal, geração e atalho para a pendência) por perfil.');})().catch(e=>{console.error(e);process.exit(1);});
