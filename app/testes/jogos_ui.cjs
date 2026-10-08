// Joguinhos (2.21) na prévia: forca e quebra-cabeça no Meu espaço. node app/testes/jogos_ui.cjs  (FOTOS=pasta salva capturas)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path'),fs=require('fs'),vm=require('vm');
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/JogosCPT.gs'),'utf8')+';this.P=JogosCPT.palavras',c);
const norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase();
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  await p.route(/drive\.google\.com\/thumbnail/,r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#7cb3e2"/><circle cx="420" cy="160" r="80" fill="#ffd36b"/><path d="M0 600 L180 300 L330 470 L450 330 L600 600Z" fill="#3e8f5a"/></svg>'}));
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png')});};
  const toast=async re=>p.waitForFunction(r=>new RegExp(r).test(document.querySelector('#toast').textContent),re.source);
  // Equipe não vê.
  await p.goto(url('?perfil=atendimento&latencia=20'));await p.locator('.welcome-pets').waitFor();await p.locator('[data-esp-especie=pato]').click();await p.locator('#espInicio [type=submit]').click();await p.locator('.mascot-stage').waitFor();
  assert.equal(await p.locator('.home-jogos, .home-placar').count(),0,'equipe não vê os joguinhos nem o placar nos testes');
  // Proprietário: forca liberada, quebra-cabeça travado (14 de 15 dias de checklist).
  await p.goto(url('?latencia=20'));await p.locator('.nav-item[data-route=meuespaco]').first().click();await p.locator('.welcome-pets').waitFor();await p.locator('[data-esp-especie=gato]').click();await p.locator('#espInicio [type=submit]').click();
  await p.locator('[data-esp-parte=jogos]').click();/* 2.27.1: joguinhos e placar na própria aba */await p.locator('.home-jogos').waitFor();const cards=p.locator('.jogo-card');assert.equal(await cards.count(),3,'2.51: caminho do esgoto + forca + quebra-cabeça');
  assert.match(await cards.nth(2).textContent(),/Libera com 15 dias de checklist[\s\S]*14 de 15/);assert.equal(await cards.nth(2).locator('[data-jogo-abrir]').count(),0);
  await p.locator('.home-jogos').scrollIntoViewIfNeeded();await foto('jogos-1-painel');
  // Placar da equipe (2.23): só totais, meta e 4 semanas.
  assert.match(await p.locator('.home-placar').textContent(),/de 400 pontos na meta da semana[\s\S]*tarefas feitas[\s\S]*acertos no quiz/);assert.doesNotMatch(await p.locator('.home-placar').textContent(),/favorit/,'2.29: sem fotos favoritadas');assert.equal(await p.locator('.placar-semana').count(),4);
  assert.doesNotMatch(await p.locator('.home-placar').textContent(),/Victor|Paula|@/);await p.locator('.home-placar').scrollIntoViewIfNeeded();await foto('placar');
  // Forca: erra uma, depois acerta tudo.
  await p.locator('[data-jogo-abrir=forca]').click();await p.locator('.forca-teclado').waitFor();
  const dica=(await p.locator('.forca-dica').textContent()).replace(/^Dica:\s*/,'').trim(),w=c.P.find(x=>x[1]===dica)[0],certas=[...new Set(norm(w).replace(/[^A-Z]/g,''))];
  const errada=[...'ZYXWQKJ'].find(l=>!certas.includes(l));await p.locator(`[data-forca-letra=${errada}]`).click();assert.equal(await p.locator('.forca-gota.is-seca').count(),1);
  await p.keyboard.press(certas[0].toLowerCase());assert.ok(await p.locator('.forca-tecla.is-certa').count()>=1,'teclado físico funciona');
  await foto('jogos-2-forca');
  for(const l of certas.slice(1))await p.locator(`[data-forca-letra=${l}]`).click();
  await toast(/Venceu! \+5/);assert.match(await p.locator('#detailContent').textContent(),/Venceu/);await p.waitForFunction(()=>document.querySelector('#espPontos').textContent.trim()==='5');
  await foto('jogos-3-forca-venceu');await p.locator('#closeDialog').click();
  // 2.29: quadro atrás do mascote — desenho pronto ou foto da Galeria; o quebra-cabeça usa a foto do quadro.
  await p.locator('[data-esp-parte=dia]').click();await p.locator('[data-esp-quadro]').click();await p.locator('[data-esp-paisagem=noite]').waitFor();assert.equal(await p.locator('[data-esp-paisagem]').count(),4);
  await p.locator('[data-esp-paisagem=noite]').click();await toast(/Quadro trocado/);await p.waitForFunction(()=>/Noite estrelada/.test(document.querySelector('.quadro-placa').textContent));
  await p.locator('[data-esp-quadro]').click();await p.locator('[data-esp-foto]').first().waitFor();await foto('quadro-escolher');await p.locator('[data-esp-foto]').first().click();await toast(/Foto nova no quadro/);
  await p.locator('.pet-quadro.tem-foto img').waitFor();await p.waitForFunction(()=>document.querySelector('.pet-quadro img').naturalWidth>0);
  // Quebra-cabeça: uma tarefa do checklist feita completa os 15 dias e libera.
  await p.locator('#espNova [name=texto]').fill('Conferir os panfletos');await p.locator('#espNova [type=submit]').click();await p.locator('[data-esp-check]').first().check();await toast(/pontos/);
  await p.locator('.nav-item[data-route=meuespaco]').first().click();await p.locator('[data-esp-parte=jogos]').click();await p.locator('[data-jogo-abrir=quebra]').click();await p.locator('.quebra-tabuleiro').waitFor();
  assert.match(await p.locator('#detailContent').textContent(),/Oficina de horta|Diálogo com moradores/,'foto do quadro no jogo');
  await foto('jogos-4-quebra');
  for(let i=0;i<9;i++){const labels=await p.$$eval('.quebra-peca',l=>l.map(x=>Number(x.getAttribute('aria-label').match(/Peça (\d+)/)[1])-1));const j=labels.indexOf(i);if(j!==i){await p.locator(`[data-quebra-peca="${i}"]`).click();await p.locator(`[data-quebra-peca="${j}"]`).click();}}
  await toast(/Venceu! \+5/);await p.locator('.quebra-tabuleiro.is-pronto').waitFor();await foto('jogos-5-quebra-pronto');
  // Celular.
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(150);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'sem rolagem lateral no celular');
  assert.deepEqual(errors,[]);await b.close();
  console.log('PASS: Joguinhos — só o proprietário nos testes, quadro com desenho ou foto da Galeria, quebra-cabeça travado até 15 dias de checklist e com a foto do quadro, forca com erro (gotinha seca), teclado físico e vitória +5, quebra-cabeça resolvido +5, celular sem rolagem lateral.');
})().catch(e=>{console.error(e);process.exit(1);});
