// Ferramenta Relatos (2.34) na prévia: cartões do mês para todos, pontos de melhoria só para quem participou (responsável ou
// apoio) e a gestão, filtros simples, "Abrir no RDAS" abrindo a ficha numa aba nova e "Outros registros" com a lista de antes.
// node app/testes/relatos_ferramenta_ui.cjs  (FOTOS=pasta salva capturas)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const ctx=await b.newContext({viewport:{width:1366,height:900}});await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());await ctx.route(/docs\.google\.com/,r=>r.fulfill({contentType:'text/html',body:'<title>RDAS</title>ok'}));
  const p=await ctx.newPage();const erros=[];p.on('pageerror',e=>erros.push(e.message));
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png'),fullPage:true});};
  const abrir=async()=>{await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});await p.waitForFunction(()=>window.CPTRelatos&&document.querySelector('.nav-item[data-route=registros]'));
    await p.evaluate(()=>document.querySelector('.nav-item[data-route=registros]').click());await p.locator('.rel-card').first().waitFor();};
  const card=t=>p.locator('.rel-card',{hasText:t});

  // 1. Pessoa da equipe: vê todos os cartões; pontos só nos relatos de que participou.
  await p.goto(url('?liberada=1&perfil=socioambiental&latencia=20'));await abrir();
  assert.equal(await p.locator('.rel-card').count(),3);assert.equal(await p.locator('[data-rel-parte=relatos]').getAttribute('aria-selected'),'true');
  assert.equal(await card('Diálogo com moradores').locator('.rel-pontos').count(),1,'responsável vê os pontos');
  await card('Diálogo com moradores').locator('.rel-pontos summary').click();assert.match(await card('Diálogo com moradores').locator('.rel-pontos').textContent(),/Encaminhamento:/);
  assert.equal(await card('Roda de conversa').locator('.rel-ok').count(),1,'colaborador de apoio vê que está completo');
  assert.equal(await card('Sensibilização').locator('.rel-pontos, .rel-ok').count(),0,'quem não participou não vê pontos');
  assert.equal(await p.locator('[data-rel-chip=pontos]').count(),0,'filtro de pontos é da gestão');
  await foto('relatos-equipe');
  // 2. Filtros simples: os meus, busca e bairro.
  await p.locator('.rel-chips .chip-opcao',{hasText:'Os meus'}).click();assert.equal(await p.locator('.rel-card').count(),2);
  await p.locator('#relBusca').fill('escola');await p.waitForFunction(()=>document.querySelectorAll('.rel-card').length===1);
  await p.locator('#relBusca').fill('');await p.locator('.rel-chips .chip-opcao',{hasText:'Os meus'}).click();await p.selectOption('#relBairro','Vila Assunção');assert.equal(await p.locator('.rel-card').count(),1);await p.selectOption('#relBairro','');
  // 3. Abrir no RDAS: a aba nova abre no clique e recebe o endereço da ficha.
  const [aba]=await Promise.all([ctx.waitForEvent('page'),card('Diálogo com moradores').locator('[data-rel-rdas]').click()]);
  await aba.waitForURL(/docs\.google\.com\/spreadsheets\/d\/previa\/edit#gid=1&range=A40/);await aba.close();
  // 4. Outros registros: a lista de todos os registros, com os mesmos filtros de antes; voltar mostra os cartões.
  await p.locator('[data-rel-parte=outros]').click();await p.locator('#recordFilters').waitFor();await p.locator('#recordResults .list-row').first().waitFor();
  assert.equal(await p.locator('[data-rel-parte=outros]').getAttribute('aria-selected'),'true');
  await p.locator('[data-rel-parte=relatos]').click();await p.locator('.rel-card').first().waitFor();
  // 5. Gestão: pontos de todos e filtro "Com pontos para melhorar".
  await p.goto(url('?liberada=1&latencia=20'));await abrir();
  assert.equal(await p.locator('.rel-card .rel-pontos').count(),2);assert.equal(await p.locator('.rel-card .rel-ok').count(),1);
  await p.locator('.rel-chips .chip-opcao',{hasText:'Com pontos'}).click();assert.equal(await p.locator('.rel-card').count(),2);
  // 6. Atalho "Relatos do mês" (Visão do mês) cai nos cartões; alerta "sem público" cai em Outros registros (testado em inicio_ui).
  await p.evaluate(()=>document.querySelector('.nav-item[data-route=inicio]').click());await p.waitForTimeout(300);
  await p.evaluate(()=>document.querySelector('.nav-item[data-route=registros]').click());await p.locator('.rel-card').first().waitFor();
  // 7. Celular: uma coluna, sem rolagem lateral.
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=390),true);
  await foto('relatos-celular');
  assert.deepEqual(erros,[]);await b.close();
  console.log('PASS: ferramenta Relatos — cartões do mês para todos, pontos de melhoria só para quem participou (responsável ou apoio) e para a gestão, filtros (os meus, busca, bairro, com pontos), Abrir no RDAS abre a ficha numa aba nova, Outros registros com a lista de antes, celular sem rolagem lateral.');
})().catch(e=>{console.error(e);process.exit(1);});
