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
  assert.equal(await p.locator('.home-jogos').count(),0,'equipe não vê os joguinhos nos testes');
  // Proprietário: forca liberada, quebra-cabeça travado (9 de 10).
  await p.goto(url('?latencia=20'));await p.locator('.nav-item[data-route=meuespaco]').first().click();await p.locator('.welcome-pets').waitFor();await p.locator('[data-esp-especie=gato]').click();await p.locator('#espInicio [type=submit]').click();
  await p.locator('.home-jogos').waitFor();const cards=p.locator('.jogo-card');assert.equal(await cards.count(),2);
  assert.match(await cards.nth(1).textContent(),/Libera com 10 fotos favoritas[\s\S]*9 de 10/);assert.equal(await cards.nth(1).locator('[data-jogo-abrir]').count(),0);
  await p.locator('.home-jogos').scrollIntoViewIfNeeded();await foto('jogos-1-painel');
  // Forca: erra uma, depois acerta tudo.
  await p.locator('[data-jogo-abrir=forca]').click();await p.locator('.forca-teclado').waitFor();
  const dica=(await p.locator('.forca-dica').textContent()).replace(/^Dica:\s*/,'').trim(),w=c.P.find(x=>x[1]===dica)[0],certas=[...new Set(norm(w).replace(/[^A-Z]/g,''))];
  const errada=[...'ZYXWQKJ'].find(l=>!certas.includes(l));await p.locator(`[data-forca-letra=${errada}]`).click();assert.equal(await p.locator('.forca-gota.is-seca').count(),1);
  await p.keyboard.press(certas[0].toLowerCase());assert.ok(await p.locator('.forca-tecla.is-certa').count()>=1,'teclado físico funciona');
  await foto('jogos-2-forca');
  for(const l of certas.slice(1))await p.locator(`[data-forca-letra=${l}]`).click();
  await toast(/Venceu! \+5/);assert.match(await p.locator('#detailContent').textContent(),/Venceu/);assert.match(await p.locator('#espPontos').textContent(),/5/);
  await foto('jogos-3-forca-venceu');await p.locator('#closeDialog').click();
  // Quebra-cabeça: favorita uma foto no Álbum (10 de 10) e joga.
  await p.locator('.nav-item[data-route=album]').first().click();await p.locator('.album-topo').waitFor();await p.locator('.album-bloco').last().locator('.album-foto:not(.is-meu) [data-album-fav]').first().click();await toast(/álbum da equipe/);
  await p.locator('.nav-item[data-route=meuespaco]').first().click();await p.locator('[data-jogo-abrir=quebra]').click();await p.locator('.quebra-tabuleiro').waitFor();
  await foto('jogos-4-quebra');
  for(let i=0;i<9;i++){const labels=await p.$$eval('.quebra-peca',l=>l.map(x=>Number(x.getAttribute('aria-label').match(/Peça (\d+)/)[1])-1));const j=labels.indexOf(i);if(j!==i){await p.locator(`[data-quebra-peca="${i}"]`).click();await p.locator(`[data-quebra-peca="${j}"]`).click();}}
  await toast(/Venceu! \+5/);await p.locator('.quebra-tabuleiro.is-pronto').waitFor();await foto('jogos-5-quebra-pronto');
  // Celular.
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(150);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'sem rolagem lateral no celular');
  assert.deepEqual(errors,[]);await b.close();
  console.log('PASS: Joguinhos — só o proprietário nos testes, quebra-cabeça travado até 10 favoritas, forca com erro (gotinha seca), teclado físico e vitória +5, quebra-cabeça resolvido +5, celular sem rolagem lateral.');
})().catch(e=>{console.error(e);process.exit(1);});
