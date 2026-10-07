// Alertas da gestão (2.36) na prévia: cartão "Pede atenção" na Visão do mês (só Gestão e Administrativo), cada alerta leva ao
// lugar certo (lista de ações sem público, painel · Frentes, Atendimentos) e os mesmos alertas aparecem como missões no Meu espaço.
// node app/testes/alertas_ui.cjs  (FOTOS=pasta salva capturas)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});const erros=[];p.on('pageerror',e=>erros.push(e.message));await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png'),fullPage:true});};
  const ir=async r=>{await p.evaluate(r=>document.querySelector('.nav-item[data-route='+r+']').click(),r);};
  const inicio=async()=>{await ir('inicio');await p.locator('.panel-dias').waitFor();};

  // 1. Equipe: sem cartão de alertas.
  await p.goto(url('?liberada=1&perfil=socioambiental&latencia=20'));await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});await inicio();
  await p.waitForTimeout(300);assert.equal(await p.locator('#homeAlertas').count(),0,'equipe não vê os alertas da gestão');
  // 2. Gestão: cartão com os alertas, do mais urgente ao informativo, cada um com o detalhe.
  await p.goto(url('?liberada=1&latencia=20'));await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});await inicio();
  await p.locator('.home-alertas').waitFor();assert.match(await p.locator('.home-alertas h2').textContent(),/4 pontos/);
  const itens=await p.locator('.home-alertas li').allTextContents();assert.match(itens[0],/há mais de 30 dias/);assert.match(itens[3],/sem público/);assert.match(itens[1],/01\/10, 05\/10/);
  assert.equal(await p.locator('.home-alertas li').nth(1).locator('button').count(),0,'dias sem ação: já estamos na Visão do mês');
  await foto('alertas-cartao');
  // 3. Cada alerta leva ao lugar certo.
  await p.locator('.home-alertas li',{hasText:'sem público'}).locator('button').click();await p.locator('#recordFilters').waitFor();
  assert.equal(await p.locator('#recordFilters input[name=pendencia]').inputValue(),'publico','lista filtrada nas ações sem público');
  await inicio();await p.locator('.home-alertas').waitFor();
  await p.locator('.home-alertas li',{hasText:'obra confirmada ontem'}).locator('button').click();await p.locator('[data-painel-aba=frentes][aria-selected=true]').waitFor();
  await inicio();await p.locator('.home-alertas').waitFor();
  await p.locator('.home-alertas li',{hasText:'30 dias'}).locator('button').click();await p.waitForFunction(()=>document.querySelector('.nav-item.active')&&document.querySelector('.nav-item.active').dataset.route==='atendimentos');
  // 4. Os mesmos alertas são missões no Meu espaço.
  await ir('meuespaco');await p.locator('.welcome-pets').waitFor();await p.locator('[data-esp-especie=urso]').click();await p.locator('#espInicio [type=submit]').click();
  await p.locator('.missao[data-missao="alerta:obras-ontem"]').waitFor();
  assert.equal(await p.locator('.missao[data-missao^="alerta:"]').count(),4);assert.equal(await p.locator('.missao[data-missao="alerta:sem-publico"] [data-pending=publico]').count(),1);
  await p.locator('.missao[data-missao="alerta:obras-ontem"] button').click();await p.locator('[data-painel-aba=frentes][aria-selected=true]').waitFor();
  assert.deepEqual(erros,[]);await b.close();
  console.log('PASS: alertas da gestão — cartão "Pede atenção" só para Gestão/Administrativo, em ordem de urgência e com detalhe; abrir leva à lista sem público, ao painel · Frentes e aos Atendimentos; os mesmos alertas viram missões no Meu espaço.');
})().catch(e=>{console.error(e);process.exit(1);});
