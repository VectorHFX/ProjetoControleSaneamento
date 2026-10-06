// Meu espaço (mascote, presente, guarda-roupa, checklist com pontos, caderno) na prévia. node app/testes/espaco_ui.cjs
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});await p.addInitScript(()=>{try{localStorage.setItem('cpt.menu',JSON.stringify({extras:true,admin:true}));}catch(_){}});/* grupos do menu abertos (preferência da pessoa) */const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q;
  const toast=async re=>p.waitForFunction(r=>new RegExp(r).test(document.querySelector('#toast').textContent),re.source);
  // Atendimento entra pelo Meu espaço, não pela Visão do mês.
  await p.goto(url('?perfil=atendimento&latencia=20'));await p.locator('.welcome-pets').waitFor();
  assert.equal(await p.locator('.nav-item.active').getAttribute('data-route'),'meuespaco');assert.equal(await p.locator('.pet-option').count(),7,'seis mascotes + capivara');assert.equal(await p.locator('[data-esp-especie=capivara]').count(),1);
  await p.locator('[data-esp-especie=pato]').click();assert.equal(await p.locator('#espInicio [name=nome]').inputValue(),'Cleber');
  await p.locator('#espInicio [name=nome]').fill('Cleber Jr');await p.locator('#espInicio [type=submit]').click();await p.locator('.mascot-stage').waitFor();
  assert.match(await p.locator('.mascot-name').textContent(),/Cleber Jr/);assert.equal(await p.locator('.missao').count(),0,'Atendimento não recebe missões de obras');assert.equal(await p.locator('svg.chibi').count(),0,'período de testes: a equipe continua com o desenho anterior');assert.match(await p.locator('.mascot-stage').textContent(),/Pato de Paula/);
  // 2.13.1: o mascote vira o ícone da pessoa no topo (no lugar de "Minha visão"), e continua lá ao recarregar.
  await p.locator('#topAvatar .mascot-svg').waitFor();assert.match(await p.locator('#topAvatar').getAttribute('aria-label'),/Cleber Jr/);
  assert.equal(JSON.parse(await p.evaluate(()=>localStorage.getItem('cpt.avatar'))).especie,'pato','ícone guardado para aparecer já ao abrir');
  // Presente da semana → peça → aparece no mascote.
  await p.locator('[data-esp-presente]').click();await p.locator('[data-esp-modo=peca]').click();await p.locator('[data-esp-ganhar=capacete-amarelo]').click();await toast(/Capacete amarelo/);
  assert.equal(await p.locator('[data-esp-presente]').count(),0);
  // Guarda-roupa: tirar e recolocar; exclusiva sem pontos não compra.
  await p.locator('[data-esp-guarda]').click();await p.locator('[data-esp-tirar=cabeca]').click();await toast(/guardada|Pronto/);
  await p.locator('[data-esp-vestir=capacete-amarelo]').click();await p.waitForFunction(()=>document.querySelector('.wardrobe-item.is-on'));
  await p.locator('[data-esp-comprar=capacete-dourado]').click({force:true});await toast(/Faltam 300 pontos/);await p.locator('#closeDialog').click();
  // Cor do mascote: livre, muda o desenho na hora; "Original" volta à cor da espécie.
  await p.locator('[data-esp-cor]').click();assert.equal(await p.locator('[data-esp-colorir]').count(),13);await p.locator('[data-esp-colorir=azul]').click();await toast(/azul/);
  assert.match(await p.locator('.space-hero .mascot-art').innerHTML(),/#5b9bd5/i,'pato azul');
  // Página inicial: agenda de hoje vinda do cronograma, com a frente da pessoa em destaque.
  await p.locator('#espAgenda .agenda-item').first().waitFor();assert.ok(await p.locator('#espAgenda .agenda-today:not(.is-next) .agenda-item').count()>=1);assert.ok(await p.locator('#espAgenda .agenda-item.is-mine').count()>=1);
  // Menu (hambúrguer) no computador: recolhe a lateral e lembra a escolha.
  await p.locator('#menuToggle').click();await p.waitForFunction(()=>document.body.classList.contains('nav-compact')&&document.querySelector('.sidebar').getBoundingClientRect().width<100);
  assert.equal(await p.locator('#menuToggle').getAttribute('aria-expanded'),'false');await p.locator('#menuToggle').click();await p.waitForFunction(()=>!document.body.classList.contains('nav-compact'));
  // Checklist: +10 uma vez só por tarefa.
  for(const t of ['Ligar para a moradora','Conferir fichas'])await p.locator('#espNova [name=texto]').fill(t),await p.locator('#espNova [type=submit]').click();
  await p.waitForFunction(()=>document.querySelectorAll('.check-list li').length===2);
  await p.locator('[data-esp-check]').first().check();await toast(/\+10 pontos/);await p.waitForFunction(()=>document.querySelector('#espPontos').textContent==='10');
  await p.locator('[data-esp-check]').first().uncheck();await p.waitForTimeout(400);await p.locator('[data-esp-check]').first().check();await p.waitForTimeout(500);
  assert.equal(await p.locator('#espPontos').textContent(),'10','desmarcar e marcar não soma de novo');
  assert.equal(await p.locator('.check-list .pts').count(),1);
  // Caderno salva sozinho.
  await p.locator('#espNota').fill('Hoje visitei a obra da viela e anotei as dúvidas dos moradores.');await p.waitForFunction(()=>/Salvo às/.test(document.querySelector('#espNotaEstado').textContent),null,{timeout:8000});assert.equal(await p.locator('#espDias').textContent(),'1','contador do caderno atualiza na hora');
  // Dia seguinte: planejamento (caderno fechado), e volta para hoje mantendo o texto.
  await p.locator('[data-esp-dia="1"]').click();await p.waitForFunction(()=>/PLANEJAMENTO/.test(document.querySelector('.day-nav').textContent));
  assert.equal(await p.locator('#espNota').count(),0);await p.locator('[data-esp-dia="0"]').click();await p.locator('#espNota').waitFor();
  assert.match(await p.locator('#espNota').inputValue(),/visitei a obra/);
  // Celular sem rolagem lateral.
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'sem rolagem lateral');
  // Celular: barra de atalhos com 4 páginas + Menu; o Menu abre a gaveta com todas as páginas; Esc fecha; navegar fecha.
  assert.equal(await p.locator('#tabbar .tab-item[data-route]').count(),4);assert.equal(await p.locator('#tabbar .tab-item[data-route=meuespaco].active').count(),1);
  await p.locator('#tabMenu').click();await p.waitForFunction(()=>document.body.classList.contains('nav-open')&&document.querySelector('.sidebar').getBoundingClientRect().left>=0);
  await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.body.classList.contains('nav-open'));
  await p.locator('#menuToggle').click();await p.locator('.nav-item[data-route=obras]').click();await p.waitForFunction(()=>!document.body.classList.contains('nav-open'));
  assert.equal(await p.locator('.nav-item.active').getAttribute('data-route'),'obras');await p.locator('#tabbar .tab-item[data-route=meuespaco]').click();await p.locator('.space-hero').waitFor();
  // Gestão continua entrando pelos números do mês.
  await p.setViewportSize({width:1366,height:900});await p.goto(url('?perfil=gestao&latencia=20'));await p.locator('.panel-dias').waitFor();
  assert.equal(await p.locator('.nav-item.active').getAttribute('data-route'),'inicio');assert.equal(await p.locator('.nav-item[data-route=meuespaco]').isHidden(),false);
  assert.deepEqual(errors,[]);
  console.log('PASS: Meu espaço 2.10 — capivara, cor do mascote, agenda de hoje, menu recolhível, barra de atalhos e gaveta no celular; atendimento entra por ele (gestão pela Visão do mês), escolhe e nomeia o mascote, presente da semana vira peça, guarda-roupa, exclusiva só com pontos, checklist +10 uma vez por tarefa, caderno salvo sozinho, planejamento de outro dia e celular sem rolagem.');
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
