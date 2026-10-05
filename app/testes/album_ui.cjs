// Álbum da equipe (2.20) na prévia: Fotos da semana, álbum do mês e favoritas (2 por dia). node app/testes/album_ui.cjs  (FOTOS=pasta salva capturas)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  // Miniaturas do Drive trocadas por imagens geradas (a prévia não tem acesso ao Drive); uma sem acesso para testar o quadro.
  const cores=['#7cb3e2','#93cf72','#f2a65e','#b39ae0','#f2c230','#ef7fa6'];
  await p.route(/drive\.google\.com\/thumbnail/,r=>{const id=new URL(r.request().url()).searchParams.get('id');if(id.endsWith('08')||id.endsWith('05'))return r.fulfill({status:403,body:''});const n=Number(id.slice(-2))||0,c=cores[n%6];
    r.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${c}"/><circle cx="${80+n*9}" cy="90" r="40" fill="#fff8" /><path d="M0 300 L120 160 L220 250 L300 180 L400 300Z" fill="#0003"/></svg>`});});
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png'),fullPage:true});};
  const toast=async re=>p.waitForFunction(r=>new RegExp(r).test(document.querySelector('#toast').textContent),re.source);
  // Período de testes: a equipe não vê o Álbum no menu.
  await p.goto(url('?perfil=atendimento&latencia=20'));await p.locator('#navigation').waitFor();
  assert.equal(await p.locator('.nav-item[data-route=album]:not([hidden])').count(),0,'equipe não vê o álbum durante os testes');
  // Proprietário.
  await p.goto(url('?latencia=20'));await p.locator('.nav-item[data-route=album]').first().click();
  await p.locator('.album-topo').waitFor();assert.equal(await p.locator('#pageLabel').textContent(),'Álbum da equipe');
  assert.equal(await p.locator('.album-grade.is-destaque .album-foto').count(),3,'três fotos já favoritadas pela equipe');
  // 2.26.2: escolha entre as fotos do mês e dos dois meses anteriores, separadas por mês.
  assert.equal(await p.locator('.album-bloco .album-mes').count(),3,'três meses de fotos');assert.ok(await p.locator('.album-bloco .album-mes').nth(2).locator('xpath=following-sibling::div[1]').locator('.album-foto').count()>0,'fotos do mês mais antigo');
  assert.match(await p.locator('.album-grade.is-destaque .album-foto').first().textContent(),/3/,'mais favoritada primeiro');
  assert.doesNotMatch(await p.locator('#view').textContent(),/Victor|Paula|@example/,'ninguém aparece como quem favoritou');
  await p.waitForFunction(()=>document.querySelector('.album-foto.sem-imagem'));assert.ok(await p.locator('.album-foto.sem-imagem').count()>=1,'sem acesso à foto: quadro no lugar');
  // 2.26.3: o Drive recusa (…05) mas a aplicação abre pela conta proprietária: a miniatura aparece; …08 nem a aplicação abre.
  await p.waitForFunction(()=>[...document.querySelectorAll('.album-foto img[data-mini$="05"]')].some(i=>i.src.startsWith('data:image')&&i.complete&&i.naturalWidth>0&&!i.closest('.sem-imagem')));
  assert.ok(await p.evaluate(()=>{const l=[...document.querySelectorAll('.album-foto img[data-mini$="08"]')];return l.some(i=>i.closest('.sem-imagem'))&&l.every(i=>!i.src.startsWith('data:'));}),'sem jeito: quadro no lugar');
  assert.ok(await p.evaluate(()=>window.CPT_PREVIA.miniaturas<=3),'miniaturas pedidas em lote, não uma por foto');
  await foto('album-1-inicio');
  // Favoritar duas (a terceira não deixa), desmarcar libera.
  const fotosMes=p.locator('.album-bloco').last().locator('.album-foto:not(.is-meu) [data-album-fav]');
  const vagas=re=>p.waitForFunction(r=>new RegExp(r).test(document.querySelector('#albumVagas').textContent),re.source);
  await fotosMes.nth(0).click();await vagas(/1 favorita/);await fotosMes.nth(0).click();await vagas(/escolhidas/);await toast(/álbum da equipe/);
  await p.locator('.album-bloco').last().locator('.album-foto:not(.is-meu) [data-album-fav]').first().click({force:true});await toast(/já escolheu 2 favoritas/);
  const meus=await p.locator('.album-bloco').last().locator('.album-foto.is-meu').count();assert.equal(meus,2);
  await p.locator('.album-bloco').last().locator('.album-foto.is-meu [data-album-fav]').first().click();await toast(/tirada/);await vagas(/1 favorita/);
  // Ampliar.
  await p.locator('.album-bloco').last().locator('[data-album-ver]').first().click();await p.locator('#detailDialog[open] .album-grande img').waitFor();await foto('album-2-ampliar');await p.locator('#closeDialog').click();
  await foto('album-3-favoritas');
  // Celular.
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(150);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'sem rolagem lateral no celular');await foto('album-4-celular');
  assert.deepEqual(errors,[]);await b.close();
  console.log('PASS: Álbum — só o proprietário nos testes, Fotos da semana (mais favoritadas primeiro, sem nomes), 2 favoritas por dia e desmarcar libera, foto sem acesso vira quadro, ampliar, celular sem rolagem lateral.');
})().catch(e=>{console.error(e);process.exit(1);});
