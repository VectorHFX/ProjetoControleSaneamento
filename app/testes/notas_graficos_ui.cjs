// Comentários nos gráficos (2.45) na prévia: a equipe lê; Gestão/Administrativo comentam (todos os meses ou só o mês),
// editam e apagam; o comentário vai junto na imagem copiada. node app/testes/notas_graficos_ui.cjs  (FOTOS=pasta)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const ctx=await b.newContext({viewport:{width:1366,height:900}});await ctx.grantPermissions(['clipboard-read','clipboard-write']);await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const p=await ctx.newPage();const erros=[];p.on('pageerror',e=>erros.push(e.message));
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png'),fullPage:true});};
  const toast=async re=>p.waitForFunction(r=>[...document.querySelectorAll('.toast,#toast,[role=status]')].some(t=>new RegExp(r).test(t.textContent)),re.source);
  const contrato=async q=>{await p.goto(url(q));await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});await p.locator('.welcome-pets, .mascot-stage, .panel-dias').first().waitFor();await p.evaluate(()=>document.querySelector('.nav-item[data-route=inicio]').click());await p.locator('.panel-dias').waitFor();await p.locator('[data-painel-aba=contrato]').click();await p.locator('.mini-chart').first().waitFor();};
  const fig=t=>p.locator('.mini-chart',{has:p.locator('figcaption',{hasText:t})}).first();
  // 1. Gestão vê o comentário existente e o botão de comentar em cada gráfico.
  await contrato('?liberada=1&latencia=20');await fig('Ações socioambientais').locator('.graf-nota').waitFor();
  assert.match(await fig('Ações socioambientais').locator('.graf-nota').textContent(),/vale para todos os meses/);assert.ok(await fig('Pessoas alcançadas').locator('[data-graf-comentar]').count());
  // 2. Comentar só no mês; aparece com a marca do mês.
  await fig('Pessoas alcançadas').locator('[data-graf-comentar]').click();const f=fig('Pessoas alcançadas').locator('.graf-nota-form');await f.waitFor();
  await f.locator('input[name=escopo]').first().check();await f.locator('textarea').fill('Setembro teve mutirão na Viela Carijós.');await f.locator('[type=submit]').click();await toast(/Comentário salvo/);
  const n=fig('Pessoas alcançadas').locator('.graf-nota.is-mes');await n.waitFor();assert.match(await n.textContent(),/só em setembro de 2026/);
  // 3. A imagem copiada fica mais alta (o comentário vai no rodapé).
  const alt=async t=>{await p.evaluate(()=>navigator.clipboard.writeText('vazio'));await fig(t).locator('[data-graf-img]').click();for(let i=0;i<50;i++){if(await p.evaluate(async()=>(await navigator.clipboard.read())[0].types.includes('image/png')))break;await p.waitForTimeout(100);}return p.evaluate(async()=>{const it=(await navigator.clipboard.read())[0];const bm=await createImageBitmap(await it.getType('image/png'));return bm.height;});};
  const comNota=await alt('Pessoas alcançadas'),semNota=await alt('Pesquisas de satisfação');assert.ok(comNota>semNota,'imagem com comentário é mais alta ('+comNota+' > '+semNota+')');
  await foto('notas-graficos');
  // 4. Editar e apagar (salvar vazio); "Cancelar" volta sem mudar.
  await fig('Pessoas alcançadas').locator('[data-graf-comentar]').click();await fig('Pessoas alcançadas').locator('[data-graf-cancelar]').click();assert.equal(await fig('Pessoas alcançadas').locator('.graf-nota').count(),1);
  await fig('Pessoas alcançadas').locator('[data-graf-comentar]').click();await fig('Pessoas alcançadas').locator('textarea').fill('');await fig('Pessoas alcançadas').locator('[type=submit]').click();await toast(/Comentário apagado/);
  await p.waitForFunction(()=>![...document.querySelectorAll('.mini-chart')].some(f=>/Pessoas alcançadas/.test(f.querySelector('figcaption').textContent)&&f.querySelector('.graf-nota')));
  // 5. Equipe: lê, mas não comenta.
  await contrato('?liberada=1&perfil=socioambiental&latencia=20').catch(async()=>{});
  if(await p.locator('[data-painel-aba=contrato]').count()){await fig('Ações socioambientais').locator('.graf-nota').waitFor();assert.equal(await p.locator('[data-graf-comentar]').count(),0);}
  await p.goto(url('?liberada=1&perfil=socioambiental&latencia=20'));await p.locator('.welcome-pets, .mascot-stage, .panel-dias').first().waitFor();await p.evaluate(()=>document.querySelector('.nav-item[data-route=inicio]').click());await p.locator('.panel-dias .graf-acoes').waitFor();
  await p.waitForTimeout(400);assert.equal(await p.locator('[data-graf-comentar]').count(),0,'equipe não comenta');
  assert.deepEqual(erros,[]);await b.close();
  console.log('PASS: comentários nos gráficos — gestão comenta (todos os meses ou só o mês), edita, cancela e apaga; a equipe lê sem comentar; o comentário vai na imagem copiada.');
})().catch(e=>{console.error(e);process.exit(1);});
