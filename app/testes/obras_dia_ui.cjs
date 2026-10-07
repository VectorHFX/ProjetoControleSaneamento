// Missões de obras (obras de hoje, "outra obra") e comparação no painel da gestão, na prévia. node app/testes/obras_dia_ui.cjs
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});await p.addInitScript(()=>{try{localStorage.setItem('cpt.menu',JSON.stringify({extras:true,admin:true}));}catch(_){}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+(q||'');
  const toast=async re=>p.waitForFunction(r=>new RegExp(r).test(document.querySelector('#toast').textContent),re.source);
  const espaco=async()=>{await p.locator('.nav-item[data-route=meuespaco]').click();await p.locator('.welcome-pets, .mascot-stage').first().waitFor();
    if(await p.locator('.welcome-pets').count()){await p.locator('[data-esp-especie=gato]').click();await p.locator('#espInicio [type=submit]').click();await p.locator('.mascot-stage').waitFor();}};
  await p.goto(url('?latencia=20'));await p.locator('.nav-item[data-route=meuespaco]').click();await p.locator('.welcome-pets').waitFor();
  // 2.18: o proprietário escolhe no elenco chibi (8 bichos) e o mascote já vem com o kit EPI (capacete branco).
  assert.equal(await p.locator('.pet-option').count(),8);assert.equal(await p.locator('.pet-option svg.chibi').count(),8);assert.equal(await p.locator('[data-esp-especie=sapo]').count(),1);
  await espaco();assert.equal(await p.locator('.hero-pet svg.chibi').count(),1);assert.ok(await p.locator('.hero-pet svg.chibi path[fill="#f7f5ef"]').count()>0,'capacete branco do kit');
  // Duas missões para a gerência; cada uma leva direto à parte certa de Obras.
  await p.locator('.missao.t-rota').first().waitFor();assert.equal(await p.locator('.missao.t-rota:not([data-missao^="alerta:"])').count(),2,'2.36: os alertas da gestão são missões à parte');
  await p.locator('.missao[data-missao=obras-hoje] .button').click();await p.locator('#obrasHojeForm').waitFor();
  assert.equal(await p.locator('[data-obra-aba=hoje]').getAttribute('aria-selected'),'true');
  assert.equal(await p.locator('.hoje-obra',{hasText:'Viela Carijós'}).locator('.hoje-sugerida').count(),1,'sugerida pelo cronograma/ontem');
  assert.ok(await p.locator('.hoje-obra',{hasText:'Viela Carijós'}).locator('input').isChecked(),'sugestão já vem marcada');
  // "Nenhuma obra" desmarca as obras; marcar uma obra desmarca "nenhuma".
  await p.locator('#obrasHojeForm [name=nenhuma]').check();assert.equal(await p.locator('#obrasHojeForm [name=obra]:checked').count(),0);
  await p.locator('.hoje-obra',{hasText:'Viela Carijós'}).locator('input').check();assert.ok(!(await p.locator('#obrasHojeForm [name=nenhuma]').isChecked()));
  await p.locator('#obrasHojeForm button[type=submit]').click();await toast(/1 obra confirmada/);await p.getByText(/Confirmado: 1 obra/).waitFor();
  await espaco();await p.waitForFunction(()=>document.querySelectorAll('.missao.t-rota:not([data-missao^="alerta:"])').length===1);
  await p.locator('.missao[data-missao=vincular-obra] .button').click();await p.locator('.vinculo-card').waitFor();
  assert.match(await p.locator('.vinculo-card').textContent(),/Rua das Flores/);
  await p.locator('.vinculo-card [data-vincular]').click();await toast(/escolha a obra/);
  // 2.26.8: digitar para achar a obra (sem acento, por nome, apelido ou bairro); finalizadas também aparecem.
  const busca=p.locator('.vinculo-card [data-vinc-busca]');await busca.fill('cipreste');await p.locator('.vinculo-card [data-escolher-obra]').first().waitFor();
  assert.match(await p.locator('.vinculo-card .obra-sugestoes').textContent(),/Rede coletora Jardim Cipreste.*Finalizada/);
  await busca.fill('apiai orquidea');await p.locator('.vinculo-card [data-escolher-obra="OBR-0074"]').waitFor();assert.equal(await p.locator('.vinculo-card [data-escolher-obra]').count(),1);
  await busca.press('Enter');assert.equal(await p.locator('.vinculo-card [data-vinc-obra]').inputValue(),'OBR-0074');assert.match(await busca.inputValue(),/Córrego Apiaí/);
  await p.locator('.vinculo-card [data-vincular]').click();await toast(/vinculado/);
  await p.getByText('Nenhum registro esperando vínculo.').waitFor();
  // Engano se corrige em "Vinculados recentemente".
  await p.locator('.vinculos-feitos summary').click();assert.equal(await p.locator('.vinculo-feito [data-vinc-obra]').inputValue(),'OBR-0074');
  await p.locator('.vinculo-feito [data-vinc-busca]').fill('carijos');await p.locator('.vinculo-feito [data-escolher-obra="OBR-0117"]').click();await p.locator('.vinculo-feito [data-vincular]').click();await toast(/trocado para Viela Carijós/);
  // Obra finalizada (ação pós-obra) também pode ser escolhida.
  await p.locator('.vinculos-feitos summary').click().catch(()=>{});if(!(await p.locator('.vinculo-feito [data-vinc-busca]').isVisible()))await p.locator('.vinculos-feitos summary').click();
  await p.locator('.vinculo-feito [data-vinc-busca]').fill('rede do cipreste');await p.locator('.vinculo-feito [data-escolher-obra="OBR-0042"]').click();await p.locator('.vinculo-feito [data-vincular]').click();await toast(/trocado para Rede coletora Jardim Cipreste/);
  await espaco();await p.locator('#espLista').waitFor();await p.waitForTimeout(300);assert.equal(await p.locator('.missao.t-rota:not([data-missao^="alerta:"])').count(),0,'missões cumpridas somem');
  // Painel da gestão: obras ativas × ações por dia.
  await p.selectOption('#viewSwitch','gestao');await p.locator('.nav-item[data-route=inicio]').click();await p.locator('[data-painel-aba=frentes]').click();
  await p.locator('.cmp-dia').first().waitFor();assert.ok(await p.locator('.cmp-dia').count()>=1);
  await p.locator('.cmp-dia').first().click();assert.match(await p.locator('.cmp-detalhe h3').textContent(),/não informado|ativas|nenhuma/);
  // Comunicação: catálogo e bairros, sem as abas da gerência.
  await p.goto(url('?perfil=comunicacao'));await p.locator('#roleView option[value=comunicacao]').waitFor({state:'attached'});
  await p.locator('.nav-item[data-route=obras]').click();await p.locator('.obra-card').first().waitFor();assert.deepEqual(await p.$$eval('[data-obra-aba]',l=>l.map(x=>x.dataset.obraAba)),['catalogo','bairros'],'só catálogo e bairros');
  assert.deepEqual(errors,[]);await b.close();
  console.log('PASS: missões da gerência (obras de hoje com sugestão e "nenhuma obra"; vincular "outra obra") somem quando cumpridas; painel compara obras ativas × ações por dia; Comunicação vê só o catálogo.');
})().catch(e=>{console.error(e);process.exit(1);});
