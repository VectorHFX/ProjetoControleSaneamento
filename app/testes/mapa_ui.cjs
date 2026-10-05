// Mapa de Santo André na prévia, com o Leaflet de verdade servido localmente (LEAFLET_DIR) e o fundo trocado por imagem vazia.
// Sem a cópia local, testa só a lista que aparece quando o mapa não carrega. node app/testes/mapa_ui.cjs
const {chromium}=require('playwright'),assert=require('assert'),path=require('path'),fs=require('fs');
const DIR=process.env.LEAFLET_DIR||'/tmp/cpt-leaflet',temLeaflet=fs.existsSync(path.join(DIR,'leaflet.js'));
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=','base64');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+(q||'');
  const pg=await b.newPage({viewport:{width:1366,height:900}});await pg.addInitScript(()=>{try{localStorage.setItem('cpt.menu',JSON.stringify({mes:true,consulta:true}));}catch(_){}});
  pg.errors=[];pg.on('pageerror',e=>pg.errors.push(e.message));await pg.route('**/basemaps.cartocdn.com/**',r=>r.fulfill({status:200,contentType:'image/png',body:PNG}));
  // Uma página só (o Chromium em processo único não abre outra): troca a rota da biblioteca entre as fases.
  const nova=async servir=>{await pg.unroute('https://unpkg.com/**');
    await pg.route('https://unpkg.com/**',r=>{if(!servir)return r.abort();const f=r.request().url().endsWith('.css')?'leaflet.css':'leaflet.js';return r.fulfill({status:200,contentType:f.endsWith('css')?'text/css':'application/javascript',headers:{'Access-Control-Allow-Origin':'*'},body:fs.readFileSync(path.join(DIR,f))});});return pg;};
  const toast=(p,re)=>p.waitForFunction(r=>new RegExp(r).test(document.querySelector('#toast').textContent),re.source);
  if(temLeaflet){
    const p=await nova(true);await p.goto(url());await p.locator('.nav-item[data-route=mapa]').click();
    await p.locator('.leaflet-container').waitFor();await p.locator('path.mapa-bolha-acao').first().waitFor({state:'attached'});
    assert.equal(await p.locator('path.mapa-bolha-acao').count(),2,'ações nos 2 bairros com ponto');assert.equal(await p.locator('path.mapa-obra-hoje').count(),1,'frente de hoje em destaque');
    assert.match(await p.locator('.leaflet-control-attribution').textContent(),/OpenStreetMap/);
    assert.equal(await p.locator('#mapaLado').textContent().then(t=>/Rua |@|protocolo/i.test(t)),false,'nenhum endereço ou protocolo na tela');
    await p.locator('[data-mapa-camada=acoes]').uncheck();assert.equal(await p.locator('path.mapa-bolha-acao').count(),0);await p.locator('[data-mapa-camada=acoes]').check();
    // Posicionar: escolhe a obra sem ponto e clica no mapa.
    assert.equal(await p.locator('path.mapa-obra').count(),1);await p.selectOption('#mapaAlvo','obra|OBR-0074');assert.ok(await p.locator('#mapaCanvas.is-posicionando').count());
    const box=await p.locator('#mapaCanvas').boundingBox();await p.mouse.click(box.x+box.width/2,box.y+box.height/2);await toast(p,/Ponto salvo/);
    await p.waitForFunction(()=>document.querySelectorAll('path.mapa-obra').length===2);
    await p.locator('#mapaSugerir').click();await toast(p,/posicionado pela pesquisa do Google/);await p.locator('.leaflet-container').waitFor();
    await p.locator('[data-mapa-periodo=hoje]').click();await p.locator('.leaflet-container').waitFor();assert.match(await p.locator('#mapaLado .eyebrow').textContent(),/\d{2}\/\d{2}\/\d{4}/);
    if(process.env.SHOTS)await p.screenshot({path:process.env.SHOTS+'/mapa.png'});
    assert.deepEqual(p.errors,[]);
  }
  // Sem a biblioteca: as mesmas contagens em lista.
  const q=await nova(false);await q.goto(url());await q.locator('.nav-item[data-route=mapa]').click();await q.locator('.mapa-lista table').waitFor();
  assert.match(await q.locator('.mapa-lista').textContent(),/Vila Assunção/);assert.deepEqual(q.errors,[]);
  // Período de testes: quem não é o proprietário não vê o mapa.
  const g=await nova(true);await g.goto(url('?perfil=gestao'));await g.locator('#roleView option[value=gestao]').waitFor({state:'attached'});assert.equal(await g.locator('.nav-item[data-route=mapa]').count()+await g.locator('.nav-item[data-route=mapa]:not([hidden])').count(),await g.locator('.nav-item[data-route=mapa]').count(),'');
  assert.equal(await g.locator('.nav-item[data-route=mapa]:visible').count(),0,'mapa escondido para a Gestão no período de testes');
  await b.close();console.log('PASS: mapa'+(temLeaflet?' (Leaflet real)':' (só a lista)')+' — camadas, frente de hoje em destaque, sem endereço, posicionar por clique, sugestão do Google, período, lista sem a biblioteca e escondido de quem não é o proprietário nos testes.');
})().catch(e=>{console.error(e);process.exit(1);});
