// Mesa socioambiental, preparo de relato e de diagnóstico, e a Visão do mês 2.6, na prévia. node app/testes/socioambiental_ui.cjs
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});await p.addInitScript(()=>{try{localStorage.setItem('cpt.menu',JSON.stringify({mes:true,consulta:true}));}catch(_){}});/* grupos do menu abertos (preferência da pessoa) */const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html'));
  // Visão do mês: números do relatório, sem "Registros de campo" nem "Por tipo de procedimento".
  await p.locator('.report-items').waitFor();
  const home=await p.locator('#view').textContent();
  assert(home.includes('Foram contabilizadas 38 ações socioambientais, totalizando 412 pessoas alcançadas.'));
  assert(home.includes('Ações socioambientais')&&home.includes('Pessoas alcançadas')&&home.includes('Manifestações em tratativa'));
  assert(!home.includes('Registros de campo')&&!home.includes('Por tipo de procedimento'));
  assert(home.includes('Sem ação: entra o parágrafo padrão'),'eixo vazio sinalizado');assert(home.includes('1 de 2 prontos'));
  // Mesa do relatório.
  await p.locator('.nav-item[data-route=socioambiental]').click();await p.locator('.mesa-group').first().waitFor();
  const mesa=await p.locator('#view').textContent();
  assert(mesa.includes('ITEM 4.3')&&mesa.includes('Copiar parágrafo padrão'));assert(mesa.includes('Viela Sanitária x Carijós'));
  assert.equal(await p.locator('.mesa-index a').count(),9);
  // Relato: destino sugerido, legenda padrão com data, até 6 fotos, salvar e gerar.
  await p.locator('#item-4-4 [data-prepare-relato]').click();await p.locator('#deliveryForm').waitFor();
  assert.equal(await p.locator('#deliveryForm [name=destino]').inputValue(),'4.4');
  await p.locator('[data-delivery=base]').click();assert.match(await p.locator('#deliveryForm [name=texto]').inputValue(),/^Em \d{2}\/\d{2}\/2026/);assert.equal(await p.locator('[data-quadro]').count(),7);
  await p.locator('[data-delivery=gerar]').click();assert.match(await p.locator('#deliveryNotice').textContent(),/Salve a revisão/);
  // 2.13.1: o cartão de cada foto do relato fica inteiro (borda, miniatura, link e legenda em blocos), sem herdar o estilo da galeria.
  const card=await p.locator('#deliveryForm .photo-pick').first().evaluate(e=>{const c=getComputedStyle(e),leg=e.querySelector('[data-caption]').getBoundingClientRect(),img=e.querySelector('img').getBoundingClientRect(),lk=e.querySelector('a').getBoundingClientRect();return {display:c.display,borda:c.borderTopWidth,legenda:leg.width,abaixo:lk.top>=img.bottom-1};});
  assert.equal(card.display,'grid');assert.notEqual(card.borda,'0px');assert.ok(card.legenda>=150,'legenda com largura útil: '+card.legenda);assert.ok(card.abaixo,'link abaixo da miniatura, sem sobrepor');
  await p.locator('.photo-pick input[name=foto]').first().check();assert((await p.locator('#photoCount').textContent()).includes('1 de 8'));
  assert.match(await p.locator('[data-caption]').first().getAttribute('placeholder'),/^\d{2}\/\d{2}\/2026 - Evento - /);
  await p.selectOption('#deliveryForm [name=destino]','9');assert.match(await p.locator('[data-caption]').first().getAttribute('placeholder'),/ - DDS - Tema - /);
  await p.selectOption('#deliveryForm [name=situacao]','pronto');await p.locator('#saveDelivery').click();
  await p.waitForFunction(()=>document.querySelector('#deliveryNotice').textContent.includes('Revisão demonstrativa'));
  await p.locator('[data-delivery=gerar]').click();await p.waitForFunction(()=>document.querySelector('#deliveryFiles').textContent.includes('Relato ilustrado'));
  await p.locator('#closeDelivery').click();
  await p.locator('#gerarAnexos').click();await p.waitForFunction(()=>/Anexos gerados/.test(document.querySelector('#anexosResultado').textContent));
  // Diagnóstico: síntese, campos oficiais pré-preenchidos, dois documentos.
  await p.locator('#item-2 [data-prepare-relato]').click();await p.locator('#deliveryForm .official-grid').waitFor();
  assert.equal(await p.locator('#deliveryTitle').textContent(),'Preparar diagnóstico de área');
  assert.equal(await p.locator('[data-oficial=residencias]').inputValue(),'48');assert.equal(await p.locator('[data-oficial]').count(),24);
  await p.locator('[data-delivery=base]').click();assert.match(await p.locator('#deliveryForm [name=texto]').inputValue(),/^REGISTRO DE CAMPO/);
  await p.locator('#deliveryForm [name=encaminhamentos]').fill('Tenda na esquina com a escola.');await p.locator('#saveDelivery').click();
  await p.waitForFunction(()=>document.querySelector('#deliveryNotice').textContent.includes('Revisão demonstrativa'));
  assert.equal(await p.locator('[data-delivery=gerar]').count(),2);
  await p.locator('[data-delivery=gerar][data-tipo=ficha]').click();await p.waitForFunction(()=>document.querySelector('#deliveryFiles').textContent.includes('Ficha Sabesp'));
  await p.locator('#closeDelivery').click();
  // Celular: sem rolagem lateral.
  await p.setViewportSize({width:390,height:844});await p.locator('.mesa-group').first().waitFor();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'sem rolagem lateral no celular');
  assert.deepEqual(errors,[]);
  console.log('PASS: Visão do mês com frase de totais e preparo por item; mesa por item com parágrafo padrão; relato com destino, legenda padrão e documento; diagnóstico com 24 campos oficiais, síntese e ficha; celular sem rolagem lateral.');
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
