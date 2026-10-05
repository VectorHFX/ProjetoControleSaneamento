// Etapa 1 da navegação: menu em grupos recolhíveis, cabeçalho compacto e busca geral (Ctrl+K). node app/testes/navegacao_ui.cjs
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q;
  const fechado=g=>p.evaluate(g=>document.querySelector('.nav-group[data-grupo="'+g+'"]').classList.contains('is-closed'),g);
  // Gestão/administrativo (muitas páginas): grupos do mês e de consultas começam recolhidos; "Dia a dia" sempre aberto.
  await p.goto(url('?inicial=1&latencia=20'));await p.locator('.report-items').waitFor();
  assert.equal(await fechado('mes'),true);assert.equal(await fechado('consulta'),true);assert.equal(await p.locator('.nav-item[data-route=atendimentos]').isVisible(),true);
  assert.equal(await p.locator('.nav-item[data-route=obras]').isVisible(),false,'obras escondida no grupo recolhido');
  await p.locator('.nav-group[data-grupo=consulta] .nav-group-head').click();assert.equal(await p.locator('.nav-item[data-route=obras]').isVisible(),true);
  assert.equal(await p.locator('.nav-group[data-grupo=consulta] .nav-group-head').getAttribute('aria-expanded'),'true');
  await p.reload();await p.locator('.report-items').waitFor();assert.equal(await fechado('consulta'),false,'escolha lembrada');assert.equal(await fechado('mes'),true);
  // Cabeçalho compacto: título numa linha; explicação no ⓘ.
  await p.locator('.nav-item[data-route=atendimentos]').click();await p.locator('.page-intro.is-compact h1').waitFor();
  assert.equal(await p.locator('.intro-info p').isVisible(),false);await p.locator('.intro-info summary').click();assert.equal(await p.locator('.intro-info p').isVisible(),true);
  assert.match(await p.locator('#viewBanner').textContent(),/Tela de Administrativo/);
  assert.equal(await p.locator('.role-label').isVisible(),false,'"Minha visão" saiu da lateral');assert.equal(await p.locator('#viewSwitch').isVisible(),true,'troca de tela continua no "Ver como"');
  // Busca: Ctrl+K → página.
  await p.keyboard.press('Control+k');await p.locator('#searchDialog[open]').waitFor();await p.locator('#searchInput').fill('fecham');
  await p.waitForFunction(()=>/Entregas do mês/.test(document.querySelector('.search-item.is-sel')?.textContent||''));await p.keyboard.press('Enter');
  await p.waitForFunction(()=>document.querySelector('.nav-item.active')?.dataset.route==='fechamento');assert.equal(await fechado('mes'),false,'grupo abre ao entrar numa página dele');
  assert.equal(await p.locator('#searchDialog[open]').count(),0);
  // Busca: protocolo → abre a ficha.
  await p.locator('#searchOpen').click();await p.locator('#searchInput').fill('DEMO-102');await p.locator('.search-item',{hasText:'DEMO-102'}).first().waitFor();
  await p.locator('.search-item',{hasText:'DEMO-102'}).first().click();await p.locator('.case-status').waitFor();assert.equal(await p.locator('.nav-item.active').getAttribute('data-route'),'atendimentos');
  await p.locator('#closeDialog').click();
  // Busca: ação "Novo contato" → abre o formulário; obra → filtra a lista de obras.
  await p.keyboard.press('Control+k');await p.locator('#searchInput').fill('novo contato');await p.locator('.search-item',{hasText:'Novo contato'}).waitFor();await p.keyboard.press('Enter');
  await p.locator('#conForm').waitFor();await p.locator('#closeDialog').click();
  await p.keyboard.press('Control+k');await p.locator('#searchInput').fill('corrego grande');await p.locator('.search-item',{hasText:'Viela Carijós'}).first().waitFor();
  await p.locator('.search-item',{hasText:'Obra'}).first().click();await p.waitForFunction(()=>(document.querySelector('#obraFiltros [name=busca]')||{}).value);
  assert.match(await p.locator('#obraFiltros [name=busca]').inputValue(),/^Viela Carijós$/);
  // Esc fecha mesmo com texto digitado (o campo de busca não só apaga o texto).
  await p.keyboard.press('Control+k');await p.locator('#searchInput').fill('obras');await p.keyboard.press('Escape');assert.equal(await p.locator('#searchDialog[open]').count(),0,'Esc fecha com texto');
  // Busca: aba do painel (Visão do mês · Frentes de serviço).
  await p.keyboard.press('Control+k');await p.locator('#searchInput').fill('frentes');await p.locator('.search-item',{hasText:'Frentes de serviço'}).first().click();
  await p.locator('.front-card').first().waitFor();assert.equal(await p.locator('[data-painel-aba=frentes]').getAttribute('aria-selected'),'true');assert.equal(await p.locator('.nav-item.active').getAttribute('data-route'),'inicio');
  // Setas e Esc.
  await p.keyboard.press('Control+k');await p.locator('#searchInput').fill('');await p.keyboard.press('ArrowDown');assert.equal(await p.locator('.search-item').nth(1).getAttribute('aria-selected'),'true');
  await p.keyboard.press('Escape');assert.equal(await p.locator('#searchDialog[open]').count(),0);
  // Registro único (ROTAS): toda página do menu abre, com o título do registro e sem erro (quem tem todos os cargos).
  for(const g of ['mes','consulta'])if(await fechado(g))await p.locator('.nav-group[data-grupo='+g+'] .nav-group-head').click();
  const rotas=await p.$$eval('#navigation .nav-item',l=>l.filter(x=>!x.hidden).map(x=>[x.dataset.route,x.querySelector('span').textContent]));
  assert.equal(rotas.length,15,'menu completo do proprietário (com o Mapa, em teste): '+rotas.length);
  for(const [r,titulo] of rotas){await p.locator('.nav-item[data-route='+r+']').click();await p.waitForFunction(r=>document.querySelector('.nav-item.active')?.dataset.route===r,r);
    assert.equal(await p.locator('#pageLabel').textContent(),titulo,'título de '+r);await p.waitForTimeout(250);}
  assert.deepEqual(errors,[],'nenhuma página com erro');
  // Pessoa com um cargo (poucas páginas): grupos abertos, sem nada escondido.
  await p.evaluate(()=>localStorage.removeItem('cpt.menu'));await p.goto(url('?perfil=atendimento&latencia=20'));await p.locator('.nav-item[data-route=obras]').waitFor();
  assert.equal(await fechado('consulta'),false);assert.equal(await p.locator('.nav-group[data-grupo=mes]').isHidden(),true,'grupo sem páginas some');
  // Socioambiental (12 páginas, mas não é gestão): grupos abertos — a página de trabalho dela não pode ficar escondida.
  await p.evaluate(()=>localStorage.removeItem('cpt.menu'));await p.goto(url('?perfil=socioambiental&latencia=20'));await p.locator('.nav-item[data-route=socioambiental]').waitFor();
  assert.equal(await fechado('mes'),false);assert.equal(await p.locator('.nav-item[data-route=socioambiental]').isVisible(),true);
  // Celular: sem rolagem lateral, busca vira ícone.
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'sem rolagem lateral');
  await p.locator('#searchOpen').click();await p.locator('#searchDialog[open]').waitFor();await p.keyboard.press('Escape');
  assert.deepEqual(errors,[]);
  console.log('PASS: navegação — todas as páginas do registro abrem com o título certo; grupos recolhidos para quem vê muitas páginas (e lembrados), abertos para quem tem um cargo; cabeçalho compacto com ⓘ; busca Ctrl+K acha página, protocolo, ação e obra; setas, Enter e Esc; celular sem rolagem lateral.');
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
