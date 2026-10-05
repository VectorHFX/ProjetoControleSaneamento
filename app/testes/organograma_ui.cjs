// Organograma (2.26) na prévia: todos veem, só o proprietário edita nos testes, desenho com título e legenda, downloads PNG/SVG
// e PDF pela impressão (só o organograma, A4 deitado). node app/testes/organograma_ui.cjs  (FOTOS=pasta salva capturas)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path'),fs=require('fs');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900},acceptDownloads:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png'),fullPage:false});};
  const abrir=async()=>{await p.evaluate(()=>{const g=document.querySelector('.nav-group[data-grupo=consulta] .nav-group-head');if(g&&g.getAttribute('aria-expanded')==='false')g.click();});await p.locator('.nav-item[data-route=organograma]').click();await p.locator('#orgQuadro svg, .org-painel .empty').first().waitFor();};
  // 1. Equipe: nos testes, a página é só do proprietário (como o Álbum e o Mapa).
  await p.goto(url('?perfil=atendimento&latencia=20'));await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});
  assert.equal(await p.locator('.nav-item[data-route=organograma]').isHidden(),true,'equipe não vê a página nos testes');
  // 2. Proprietário: desenho completo com título, legenda e um cartão por pessoa; quem tem muita gente sem equipe abaixo vira coluna.
  await p.goto(url('?latencia=20'));await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});await abrir();
  const svg=await p.locator('#orgQuadro svg').innerHTML();assert.ok(svg.includes('Organograma da equipe')&&svg.includes('Cada cor é uma área'),'título e explicação');
  assert.equal(await p.locator('#orgQuadro .org-no').count(),12);assert.ok(svg.includes('Campo e mobilização (5)'),'legenda com contagem por área');
  const xs=await p.$$eval('#orgQuadro .org-no',l=>l.map(g=>g.getAttribute('transform')));assert.ok(xs.every(t=>!/NaN|undefined/.test(t)),'posições válidas');
  // cartões não se sobrepõem
  const caixas=await p.$$eval('#orgQuadro .org-no',l=>l.map(g=>{const m=g.getAttribute('transform').match(/translate\(([\d.]+),([\d.]+)\)/);return [Number(m[1]),Number(m[2])];}));
  for(let i=0;i<caixas.length;i++)for(let j=i+1;j<caixas.length;j++){const [a,c]=[caixas[i],caixas[j]];assert.ok(Math.abs(a[0]-c[0])>=240||Math.abs(a[1]-c[1])>=100,'cartões sobrepostos '+i+' '+j);}
  await foto('organograma');
  // 3. Downloads: PNG e SVG de verdade.
  let [dl]=await Promise.all([p.waitForEvent('download'),p.locator('[data-org-png]').click()]);assert.match(dl.suggestedFilename(),/^Organograma CPT \d{4}-\d{2}-\d{2}\.png$/);
  const png=fs.readFileSync(await dl.path());assert.equal(png.slice(1,4).toString(),'PNG');assert.ok(png.length>20000,'imagem com conteúdo');
  [dl]=await Promise.all([p.waitForEvent('download'),p.locator('[data-org-svg]').click()]);assert.match(fs.readFileSync(await dl.path(),'utf8'),/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  // 4. PDF: a impressão mostra só o organograma.
  await p.evaluate(()=>{window.print=()=>{window.__imprimiu=true;};});await p.locator('[data-org-pdf]').click();assert.ok(await p.evaluate(()=>window.__imprimiu));
  await p.emulateMedia({media:'print'});const vis=await p.evaluate(()=>[...document.body.children].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.id||e.tagName));
  assert.deepEqual(vis.filter(x=>x!=='SCRIPT'),['orgImpressao'],'impressão só com o organograma: '+vis);assert.ok(await p.evaluate(()=>document.querySelector('#orgImpressao svg')!==null));
  await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await p.emulateMedia({media:'screen'});assert.equal(await p.evaluate(()=>document.documentElement.classList.contains('org-imprimindo')),false);
  // 5. Editar: mudar a quem responde; ciclo e campo vazio são recusados; trazer da equipe.
  await p.locator('#orgQuadro .org-no').nth(2).click();await p.locator('#orgForm').waitFor();
  await p.locator('#orgForm [name=cargo]').fill('');await p.locator('#orgForm [type=submit]').click();assert.equal(await p.locator('#orgForm [name=cargo]').evaluate(e=>e.validity.valid),false);
  await p.locator('#orgForm [name=cargo]').fill('Supervisão geral');await p.locator('#orgForm [type=submit]').click();await p.locator('#detailDialog').waitFor({state:'hidden'});
  await p.waitForFunction(()=>{const q=document.querySelector('#orgQuadro svg');return q&&q.innerHTML.includes('Supervisão geral');});
  await p.locator('[data-org-importar]').click();await p.waitForFunction(()=>document.querySelectorAll('#orgQuadro .org-no').length===14);assert.equal(await p.locator('[data-org-importar]').count(),0);
  // 6. Celular: sem rolagem lateral na página (o quadro rola por dentro).
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'rolagem lateral no celular');
  await foto('organograma-celular');
  assert.deepEqual(errors,[]);await b.close();
  console.log('PASS: organograma — só o proprietário nos testes (página e edição); título, legenda por área e cartões sem sobrepor; PNG e SVG baixam; PDF imprime só o organograma; editar e trazer da equipe; celular sem rolagem lateral.');
})().catch(e=>{console.error(e);process.exit(1);});
