// Interface de Obras na prévia (dados fictícios); 2.27: o Fechamento saiu.
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
// 2.27.1: Bairros é aba própria, com busca.
await page.locator('[data-obra-aba=bairros]').click();await page.locator('#bairroFiltro').waitFor();assert.equal(await page.locator('.obra-card').count(),0,'catálogo fora da aba Bairros');assert.equal(await page.locator('.bairro-row').count(),3);
await page.fill('#bairroFiltro input[name=busca]','assun');assert.equal(await page.locator('.bairro-row').count(),1);await page.fill('#bairroFiltro input[name=busca]','');
await page.locator('[data-bairro-novo]').click();await page.fill('#bairroForm input[name=nome]','Vila Nova');await page.fill('#bairroForm input[name=apelidos]','VN');await page.locator('#bairroForm button[type=submit]').click();
await page.locator('.bairro-row',{hasText:'Vila Nova'}).waitFor();assert.equal(await page.locator('.bairro-row').count(),4);
await page.locator('[data-bairro="Vila Assunção"]').click();assert(await page.locator('#bairroForm input[name=nome]').isDisabled(),'nome do bairro não muda');await page.locator('#bairroForm input[name=noFormulario]').uncheck();await page.locator('#bairroForm button[type=submit]').click();
await page.locator('.bairro-row',{hasText:'Vila Assunção'}).locator('text=Fora do formulário').waitFor();assert.equal(await page.locator('[data-obra-aba=bairros]').getAttribute('aria-selected'),'true','continua na aba Bairros depois de salvar');
// 2.27.1: catálogo mostra 12 por vez; "Mostrar mais" traz o próximo lote; filtrar volta ao primeiro lote.
await page.evaluate(()=>{for(let i=0;i<20;i++)obrasDemo.push(Object.assign({},obrasDemo[0],{id:'OBR-9'+String(i).padStart(3,'0'),nome:'Obra extra '+i,nomeUso:'',apelidos:[]}));});
await page.locator('[data-obra-aba=catalogo]').click();await page.locator('#obraFiltros select[name=situacao]').selectOption('todas');await page.locator('[data-obra-mais]').waitFor();assert.equal(await page.locator('.obra-card').count(),12);
await page.locator('[data-obra-mais]').click();await page.waitForFunction(()=>document.querySelectorAll('.obra-card').length>12);assert.equal(await page.locator('[data-obra-mais]').count(),0,'todas exibidas');
await page.fill('#obraFiltros input[name=busca]','extra');await page.waitForTimeout(400);assert.equal(await page.locator('.obra-card').count(),12);assert.match(await page.locator('[data-obra-mais]').textContent(),/Mostrar mais 8/);
if(out)await page.screenshot({path:out+'/obras.png',fullPage:true});
// 2.27: o fechamento do mês saiu da aplicação — nenhuma visão tem as páginas Socioambiental, Entregas do mês ou Programa Parceiros.
await page.goto(url+'?perfil=comunicacao');await page.locator('#roleView option[value=comunicacao]').waitFor({state:'attached'});assert.equal(await page.locator('.nav-item[data-route=fechamento], .nav-item[data-route=socioambiental], .nav-item[data-route=parceiros]').count(),0,'fechamento fora do menu');
await page.locator('.nav-item[data-route=obras]').click();await page.locator('.obra-card').first().waitFor();assert.equal(await page.locator('[data-obra-acao=nova]').count(),0);assert.equal(await page.locator('[data-obra-confirmar]').count(),0);assert.equal(await page.locator('[data-bairro-novo]').count(),0);await page.locator('[data-obra-aba=bairros]').click();await page.locator('.bairro-row').first().waitFor();assert.equal(await page.locator('[data-bairro-novo], [data-bairro]').count(),0,'só consulta');
await page.goto(url+'?perfil=atendimento');await page.locator('#roleView option[value=atendimento]').waitFor({state:'attached'});assert(await page.locator('.nav-item[data-route=fechamento]').isHidden());
assert.deepEqual(erros,[]);await b.close();console.log('PASS: Obras (filtro mantém foco, revisão diária, cadastro) e o fechamento fora do menu em todas as visões.');})().catch(e=>{console.error(e);process.exit(1);});
