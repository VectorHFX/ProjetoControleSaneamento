// Visual novo "Veolia acolhedor" (2.24) na prévia: só do proprietário nos testes, sem piscar ao abrir, movimento com significado
// e nada se mexendo com "Reduzir movimentos". node app/testes/visual_ui.cjs  (FOTOS=pasta salva capturas)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png')});};
  const attr=()=>p.evaluate(()=>document.documentElement.dataset.visual||'');
  // 1. Equipe: visual atual; quem tinha o novo guardado volta ao atual.
  await p.goto(url('?perfil=atendimento&latencia=20'));await p.evaluate(()=>localStorage.setItem('cpt.visual','v3'));await p.reload();await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});
  await p.waitForFunction(()=>!document.documentElement.dataset.visual);assert.equal(await p.evaluate(()=>localStorage.getItem('cpt.visual')),null,'equipe não fica com o visual novo');
  assert.equal(await p.evaluate(()=>getComputedStyle(document.querySelector('.sidebar')).backgroundImage),'none','lateral da equipe sem a parede ripada');
  // 2. Proprietário: visual novo, folhagem desenhada no navegador, lateral verde com jardim.
  await p.goto(url('?latencia=20'));await p.waitForFunction(()=>document.documentElement.dataset.visual==='v3');
  assert.ok(await p.evaluate(()=>document.documentElement.style.getPropertyValue('--v3-folhagem').startsWith('url("data:image/svg+xml')),'folhagem desenhada');
  assert.match(await p.evaluate(()=>getComputedStyle(document.querySelector('.sidebar')).backgroundImage),/repeating-linear-gradient/,'parede ripada');
  assert.equal(await p.evaluate(()=>localStorage.getItem('cpt.visual')),'v3');
  // Abrir de novo, com o servidor lento: o visual novo já está lá antes do perfil chegar (sem piscar).
  await p.goto(url('?latencia=1500'));assert.equal(await attr(),'v3','aplicado na abertura');await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});
  // 3. Entrada de página e cascata.
  // 2.26: uma vez só, quando o conteúdo chega (depois do esqueleto, só o que acabou de entrar sobe); nada repete ao redesenhar.
  await p.evaluate(()=>{window.__entradas=0;new MutationObserver(r=>r.forEach(x=>{if(x.attributeName==='data-entrando'&&x.target.hasAttribute('data-entrando'))window.__entradas++;if(x.attributeName==='class'&&x.target.classList.contains('v3-novo')&&!(x.oldValue||'').includes('v3-novo'))window.__entradas+=.001;})).observe(document.querySelector('#view'),{attributes:true,subtree:true,attributeOldValue:true,attributeFilter:['data-entrando','class']});});
  await p.locator('.nav-item[data-route=atendimentos]').first().click();await p.waitForFunction(()=>window.__entradas>0);
  await p.waitForFunction(()=>!document.querySelector('#view').hasAttribute('data-entrando')&&!document.querySelector('#view .v3-novo'),null,{timeout:4000});
  assert.equal(await p.evaluate(()=>document.querySelector('#view .skeleton,#view .loading-label')),null,'conteúdo chegou');
  const antes=await p.evaluate(()=>window.__entradas);await p.locator('#refresh').click();await p.waitForTimeout(2500);
  assert.equal(await p.evaluate(()=>Math.floor(window.__entradas)),Math.floor(antes),'Atualizar não repete a entrada da página');
  // O "i" de informação abre por cima do conteúdo, mesmo logo depois de chegar à página.
  await p.locator('.nav-item[data-route=cronograma]').first().click();await p.locator('#view .intro-info summary').waitFor();await p.locator('#view .intro-info summary').click();
  const topo=await p.evaluate(()=>{const t=document.querySelector('#view .intro-info p').getBoundingClientRect();const el=document.elementFromPoint(t.left+t.width/2,t.top+t.height-8);return !!el.closest('.intro-info');});
  assert.ok(topo,'o texto do "i" fica por cima do conteúdo');await p.locator('#view .intro-info summary').click();
  // 4. Meu espaço: o mascote na recepção (parede ripada, plantas, luminárias, placa), pontos que contam e folhas comemorando.
  await p.locator('.nav-item[data-route=meuespaco]').first().click();await p.locator('.welcome-pets').waitFor();await p.locator('[data-esp-especie=urso]').click();await p.locator('#espInicio [type=submit]').click();
  await p.locator('.space-hero.v3-cena-host .v3-cena').waitFor();assert.equal(await p.locator('.v3-cena .v3-placa').count(),1);assert.equal(await p.locator('.v3-cena .v3-lumi').count(),2);assert.ok(await p.locator('.v3-cena .v3-brisa path').count()>100,'parede de plantas');
  // 2.26: mascote maior em frente ao quadro da parede (paisagem sem foto no álbum) e caderno marrom que abre uma vez.
  assert.equal(await p.locator('.space-hero.com-quadro .hero-pet .pet-quadro .quadro-paisagem').count(),1,'quadro com paisagem');assert.match(await p.locator('.quadro-placa').textContent(),/Santo André/);
  assert.ok((await p.locator('.space-hero .hero-pet .mascot-svg').boundingBox()).width>=300,'mascote maior');
  await p.waitForFunction(()=>document.querySelector('.home-notebook.caderno').classList.contains('is-aberto'),null,{timeout:4000});
  assert.equal(await p.locator('.home-notebook.caderno .caderno-folha textarea.notebook').count(),1);assert.match(await p.locator('.caderno-rodape').textContent(),/Cada dia fica guardado/);
  assert.match(await p.evaluate(()=>getComputedStyle(document.querySelector('.caderno textarea.notebook')).backgroundImage),/repeating-linear-gradient/,'folha pautada');
  await foto('visual-meuespaco');
  // 2.25: ícones de traço no lugar dos emojis (selos, presente, painéis) e nenhum modelo cru na tela.
  assert.ok(await p.locator('.space-hero .home-chip svg.ic').count()>=3,'selos com ícone');assert.equal(await p.locator('.space-hero .gift svg.ic-gift').count(),1,'presente com ícone');
  assert.equal(await p.evaluate(()=>document.body.innerHTML.includes('${ic(')),false,'nenhum ícone como texto cru');
  assert.equal(await p.evaluate(()=>/[\u{1F300}-\u{1FAFF}]/u.test(document.querySelector('.space-hero').textContent)),false,'sem emoji no cartão de boas-vindas');
  await p.locator('#espNova [name=texto]').fill('Conferir a obra');await p.locator('#espNova [type=submit]').click();await p.locator('[data-esp-check]').first().waitFor();
  await p.locator('[data-esp-check]').first().check();await p.waitForFunction(()=>document.querySelector('.v3-folhas'));
  await p.waitForFunction(()=>document.querySelector('#espPontos').textContent.trim()==='10');await p.waitForFunction(()=>!document.querySelector('.v3-folhas'),null,{timeout:4000});
  // Parallax: o ponteiro sobre o cenário mexe as camadas.
  await p.evaluate(()=>window.scrollTo(0,0));const box=await p.locator('.space-hero').boundingBox();await p.mouse.move(box.x+40,box.y+40);await p.mouse.move(box.x+60,box.y+60);
  await p.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.space-hero')).getPropertyValue('--px'))<0);
  // 5. Reduzir movimentos: nada de entrada, folhas ou parallax.
  await p.evaluate(()=>{localStorage.setItem('cpt.motion','reduce');});await p.reload();await p.waitForFunction(()=>document.documentElement.dataset.motion==='reduce');
  await p.locator('.nav-item[data-route=meuespaco]').first().click();await p.locator('.welcome-pets').waitFor();await p.locator('[data-esp-especie=gato]').click();await p.locator('#espInicio [type=submit]').click();await p.locator('.space-hero').waitFor();await p.waitForTimeout(300);
  assert.equal(await p.evaluate(()=>document.querySelector('#view').hasAttribute('data-entrando')),false,'sem entrada animada');
  assert.equal(await p.evaluate(()=>getComputedStyle(document.querySelector('.v3-brisa-3')).animationName),'none','plantas paradas');
  assert.equal(await p.evaluate(()=>document.querySelector('.home-notebook.caderno').className.includes('is-aberto')&&!document.querySelector('.home-notebook.caderno').className.includes('is-abrindo')),true,'caderno já aberto, sem animar a capa');
  await p.locator('#espNova [name=texto]').fill('Conferir a obra');await p.locator('#espNova [type=submit]').click();await p.locator('[data-esp-check]').first().waitFor();
  await p.locator('[data-esp-check]').first().check();await p.waitForFunction(()=>document.querySelector('#espPontos').textContent.trim()==='10');await p.waitForTimeout(200);
  assert.equal(await p.locator('.v3-folhas').count(),0,'sem folhas voando');
  await p.evaluate(()=>localStorage.removeItem('cpt.motion'));
  // 6. Celular: sem rolagem lateral.
  await p.setViewportSize({width:390,height:844});await p.reload();await p.locator('#view').waitFor();await p.waitForTimeout(500);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'sem rolagem lateral no celular');
  assert.deepEqual(errors,[]);await b.close();
  console.log('PASS: visual novo — só o proprietário nos testes (equipe volta ao atual), aplicado já na abertura, entrada de página, mascote na recepção com plantas e luminárias, pontos contando com folhas, parallax, "Reduzir movimentos" para tudo, celular sem rolagem lateral.');
})().catch(e=>{console.error(e);process.exit(1);});
