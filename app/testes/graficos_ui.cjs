// Gráficos (2.35) na prévia: Ações/Pessoas por dia na Visão do mês, qualidade dos relatos na gestão (sem ranking por pessoa)
// e "Copiar imagem" / "Copiar tabela" em todos os gráficos (imagem em fundo claro e 2x; sem permissão, baixa o arquivo).
// node app/testes/graficos_ui.cjs  (FOTOS=pasta salva capturas)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path'),fs=require('fs');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const ctx=await b.newContext({viewport:{width:1366,height:900},acceptDownloads:true});await ctx.grantPermissions(['clipboard-read','clipboard-write']);await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const p=await ctx.newPage();const erros=[];p.on('pageerror',e=>erros.push(e.message));
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png'),fullPage:true});};
  const toast=async re=>{await p.waitForFunction(r=>[...document.querySelectorAll('.toast,#toast,[role=status]')].some(t=>new RegExp(r).test(t.textContent)),re.source);};
  await p.goto(url('?liberada=1&latencia=20'));await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});
  await p.evaluate(()=>document.querySelector('.nav-item[data-route=inicio]').click());await p.locator('.panel-dias .day-chart').waitFor();

  // 1. Ações / Pessoas por dia: mesma área, troca em um toque, dica no passar do mouse.
  assert.match(await p.locator('.panel-dias h2').textContent(),/Ações por dia/);
  await p.locator('[data-dias-medida=pessoas]').click();assert.match(await p.locator('.panel-dias h2').textContent(),/Pessoas alcançadas por dia/);
  assert.match(await p.locator('.panel-dias .panel-head p').textContent(),/pessoas alcançadas/);
  const hit=p.locator('.panel-dias .hit[data-tip*="pessoas"]').first();assert.ok(await hit.count(),'dica fala em pessoas');
  // 2. Copiar tabela: texto com tabulação (cola na planilha) com dia, ações, pessoas e total.
  await p.locator('.panel-dias [data-graf-tab]').click();await toast(/Tabela copiada/);
  const tsv=await p.evaluate(()=>navigator.clipboard.readText());assert.match(tsv,/^Dia\tAções\tPessoas alcançadas\n/);assert.match(tsv,/\nTotal\t\d+\t\d+$/);
  // 3. Copiar imagem: PNG na área de transferência, 2x, fundo claro mesmo no tema escuro.
  await p.evaluate(()=>{document.documentElement.dataset.theme='dark';});
  await p.locator('.panel-dias [data-graf-img]').click();await toast(/Imagem copiada/);
  const img=await p.evaluate(async()=>{const it=(await navigator.clipboard.read())[0];if(!it.types.includes('image/png'))return null;const bl=await it.getType('image/png'),bm=await createImageBitmap(bl),c=document.createElement('canvas');c.width=bm.width;c.height=bm.height;const x=c.getContext('2d');x.drawImage(bm,0,0);return {w:bm.width,h:bm.height,px:[...x.getImageData(4,4,1,1).data]};});
  assert.ok(img,'imagem na área de transferência');assert.equal(img.w,1920,'resolução dobrada');assert.deepEqual(img.px.slice(0,3),[255,253,248],'fundo claro');
  await p.evaluate(()=>{document.documentElement.dataset.theme='light';});
  // 4. Sem permissão de área de transferência: a imagem é baixada.
  await p.evaluate(()=>{navigator.clipboard.write=()=>Promise.reject(new Error('negado'));});
  const [dl]=await Promise.all([p.waitForEvent('download'),p.locator('.panel-dias [data-graf-img]').click()]);assert.match(dl.suggestedFilename(),/^Pessoas_alcancadas_por_dia.*\.png$/);
  await toast(/foi baixada/);
  await foto('graficos-dias');
  // 5. Gestão · Contrato: gráficos com os dois botões e sem "Quem registrou" (nada de ranking por pessoa).
  await p.locator('[data-painel-aba=contrato]').click();await p.locator('.mini-chart').first().waitFor();
  assert.equal(await p.getByText('Quem registrou').count(),0);
  assert.equal(await p.locator('.mini-chart .graf-acoes').count(),await p.locator('.mini-chart').count(),'cada mini gráfico com Copiar');
  assert.ok(await p.locator('.hbars + .graf-acoes').count()>=2);
  // 6. Gestão · Relatos em resumo: qualidade (% completos em 6 meses, o que mais falta, completude por frente).
  await p.locator('[data-painel-aba=relatos]').click();await p.locator('.rel-qualidade').waitFor();
  const q=await p.locator('.rel-qualidade').textContent();assert.match(q,/15 de 20 relatos completos/);assert.match(q,/O que mais falta/);assert.match(q,/Encaminhamento/);assert.match(q,/Viela Carijós/);assert.match(q,/89% \(8 de 9\)/);
  assert.equal(await p.locator('.rel-qualidade .graf-acoes').count(),3);assert.match(await p.locator('.rel-qualidade .mini-chart svg').getAttribute('aria-label'),/abril de 2026: Completos sem dados/);
  await p.locator('.rel-qualidade [data-graf-tab]').last().click();await toast(/Tabela copiada/);
  assert.match(await p.evaluate(()=>navigator.clipboard.readText()),/^Frente\tRelatos\tCompletos\t% completos\nViela Carijós\t9\t8\t89%/);
  await foto('graficos-qualidade');
  // 7. Celular: sem rolagem lateral.
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=390),true);
  assert.deepEqual(erros,[]);await b.close();
  console.log('PASS: gráficos — Ações/Pessoas por dia na Visão do mês, qualidade dos relatos na gestão (sem "Quem registrou"), Copiar tabela (cola na planilha), Copiar imagem (PNG 2x em fundo claro, até no tema escuro) e imagem baixada quando o navegador não deixa copiar.');
})().catch(e=>{console.error(e);process.exit(1);});
