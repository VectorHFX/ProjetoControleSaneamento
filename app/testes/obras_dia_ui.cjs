// Missões de obras (obras de hoje, "outra obra") e comparação no painel da gestão, na prévia. node app/testes/obras_dia_ui.cjs
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});await p.addInitScript(()=>{try{localStorage.setItem('cpt.menu',JSON.stringify({mes:true,consulta:true}));}catch(_){}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+(q||'');
  const toast=async re=>p.waitForFunction(r=>new RegExp(r).test(document.querySelector('#toast').textContent),re.source);
  const espaco=async()=>{await p.locator('.nav-item[data-route=meuespaco]').click();await p.locator('.welcome-pets, .mascot-stage').first().waitFor();
    if(await p.locator('.welcome-pets').count()){await p.locator('[data-esp-especie=gato]').click();await p.locator('#espInicio [type=submit]').click();await p.locator('.mascot-stage').waitFor();}};
  await p.goto(url('?latencia=20'));await espaco();
  // Duas missões para a gerência; cada uma leva direto à parte certa de Obras.
  await p.locator('.missao').first().waitFor();assert.equal(await p.locator('.missao').count(),2);
  await p.locator('.missao[data-missao=obras-hoje] .button').click();await p.locator('#obrasHojeForm').waitFor();
  assert.equal(await p.locator('[data-obra-aba=hoje]').getAttribute('aria-selected'),'true');
  assert.equal(await p.locator('.hoje-obra',{hasText:'Viela Carijós'}).locator('.hoje-sugerida').count(),1,'sugerida pelo cronograma/ontem');
  assert.ok(await p.locator('.hoje-obra',{hasText:'Viela Carijós'}).locator('input').isChecked(),'sugestão já vem marcada');
  // "Nenhuma obra" desmarca as obras; marcar uma obra desmarca "nenhuma".
  await p.locator('#obrasHojeForm [name=nenhuma]').check();assert.equal(await p.locator('#obrasHojeForm [name=obra]:checked').count(),0);
  await p.locator('.hoje-obra',{hasText:'Viela Carijós'}).locator('input').check();assert.ok(!(await p.locator('#obrasHojeForm [name=nenhuma]').isChecked()));
  await p.locator('#obrasHojeForm button[type=submit]').click();await toast(/1 obra confirmada/);await p.getByText(/Confirmado: 1 obra/).waitFor();
  await espaco();assert.equal(await p.locator('.missao').count(),1);
  await p.locator('.missao[data-missao=vincular-obra] .button').click();await p.locator('.vinculo-card').waitFor();
  assert.match(await p.locator('.vinculo-card').textContent(),/Rua das Flores/);
  await p.locator('.vinculo-card [data-vincular]').click();await toast(/Escolha a obra/);
  await p.selectOption('.vinculo-card [data-vinc-obra]','OBR-0074');await p.locator('.vinculo-card [data-vincular]').click();await toast(/vinculado/);
  await p.getByText('Nenhum registro esperando vínculo.').waitFor();
  await espaco();assert.equal(await p.locator('.missao').count(),0,'missões cumpridas somem');
  // Painel da gestão: obras ativas × ações por dia.
  await p.selectOption('#viewSwitch','gestao');await p.locator('.nav-item[data-route=inicio]').click();await p.locator('[data-painel-aba=frentes]').click();
  await p.locator('.cmp-dia').first().waitFor();assert.ok(await p.locator('.cmp-dia').count()>=1);
  await p.locator('.cmp-dia').first().click();assert.match(await p.locator('.cmp-detalhe h3').textContent(),/não informado|ativas|nenhuma/);
  // Comunicação: só o catálogo, sem as abas da gerência.
  await p.goto(url('?perfil=comunicacao'));await p.locator('#roleView option[value=comunicacao]').waitFor({state:'attached'});
  await p.locator('.nav-item[data-route=obras]').click();await p.locator('.obra-card').first().waitFor();assert.equal(await p.locator('[data-obra-aba]').count(),0);
  assert.deepEqual(errors,[]);await b.close();
  console.log('PASS: missões da gerência (obras de hoje com sugestão e "nenhuma obra"; vincular "outra obra") somem quando cumpridas; painel compara obras ativas × ações por dia; Comunicação vê só o catálogo.');
})().catch(e=>{console.error(e);process.exit(1);});
