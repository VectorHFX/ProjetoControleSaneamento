// Anexos do relatório (2.39) na prévia: aba na Visão do mês (Gestão/Administrativo), conferência sem gravar ao abrir,
// tabela das linhas automáticas (vai mudar / igual / pulada com aviso), Controle de manifestações e "Atualizar agora".
// node app/testes/anexos_ui.cjs  (FOTOS=pasta salva capturas)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});const erros=[];p.on('pageerror',e=>erros.push(e.message));await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png'),fullPage:true});};
  const abrir=async q=>{await p.goto(url(q));await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});await p.locator('.welcome-pets, .mascot-stage, .panel-dias').first().waitFor();await p.evaluate(()=>document.querySelector('.nav-item[data-route=inicio]').click());await p.locator('.panel-dias').waitFor();};
  // 1. Equipe não vê a aba.
  await abrir('?liberada=1&perfil=socioambiental&latencia=20');assert.equal(await p.locator('[data-painel-aba=anexos]').count(),0);
  // 2. Gestão: abre conferindo, sem gravar.
  await abrir('?liberada=1&latencia=40');await p.locator('[data-painel-aba=anexos]').click();await p.locator('.anexos-ind').waitFor();
  assert.match(await p.locator('.anexos-topo').textContent(),/Conferido agora: nada foi gravado/);
  assert.equal(await p.locator('.anexos-ind tbody tr').count(),13);assert.equal(await p.locator('.anexos-ind tr.is-muda').count(),12);
  const l43=await p.locator('.anexos-ind tbody tr').last().textContent();assert.match(l43,/Rótulo diferente/);assert.match(l43,/Pulada/);
  assert.match(await p.locator('.anexos-ind caption').textContent(),/^Outubro de 2026$/);
  const ctl=await p.locator('#anexosBox').textContent();assert.match(ctl,/58 casos com os dados oficiais/);assert.match(ctl,/Novos: ATD20260061, ATD20260062/);assert.match(ctl,/foi reaberto/);
  assert.equal(await p.locator('.anexos-topo a',{hasText:'Abrir planilha'}).getAttribute('href'),'https://docs.google.com/spreadsheets/d/previa-anexos/edit');
  await foto('anexos-conferir');
  // 3. Atualizar agora: grava e mostra "Atualizado".
  await p.locator('[data-anexos-atualizar]').click();await p.waitForFunction(()=>/Atualizado agora/.test((document.querySelector('.anexos-topo')||{}).textContent||''));
  assert.equal(await p.locator('.anexos-ind .badge',{hasText:'Atualizado'}).count(),12);assert.match(await p.locator('#anexosBox').textContent(),/Incluídos: ATD20260061/);
  // 4. Volta para a aba: não confere de novo à toa (fica o último resultado).
  await p.locator('[data-painel-aba=contrato]').click();await p.locator('[data-painel-aba=anexos]').click();await p.locator('.anexos-ind').waitFor();assert.match(await p.locator('.anexos-topo').textContent(),/Atualizado agora/);
  // 5. Celular sem rolagem lateral.
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=390),true);await foto('anexos-celular');
  assert.deepEqual(erros,[]);await b.close();
  console.log('PASS: anexos na tela — aba só para a gestão, conferência sem gravar ao abrir (vai mudar / igual / pulada com aviso), Controle com novos, atualizados e avisos, Atualizar agora e celular sem rolagem lateral.');
})().catch(e=>{console.error(e);process.exit(1);});
