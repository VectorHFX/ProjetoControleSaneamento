// Qualidade dos relatos, guia, dicas e comentário privado da gestão, na prévia. node app/testes/relatos_ui.cjs
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});await p.addInitScript(()=>{try{localStorage.setItem('cpt.menu',JSON.stringify({mes:true,consulta:true}));}catch(_){}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+(q||'');
  const toast=async re=>p.waitForFunction(r=>new RegExp(r).test(document.querySelector('#toast').textContent),re.source);
  const espaco=async()=>{await p.locator('.nav-item[data-route=meuespaco]').click();await p.locator('.welcome-pets, .mascot-stage').first().waitFor();
    if(await p.locator('.welcome-pets').count()){await p.locator('[data-esp-especie=gato]').click();await p.locator('#espInicio [type=submit]').click();await p.locator('.mascot-stage').waitFor();}};
  await p.goto(url('?latencia=20'));await espaco();
  // Dica do relato: o que falta, guia com o ponto marcado, "Entendi" tira a missão (e ela não volta ao recarregar).
  await p.locator('.missao.t-dica').waitFor();await p.locator('[data-missao-dica]').click();
  assert.equal(await p.locator('.qualidade-lista li.falta').count(),1);assert.match(await p.locator('.qualidade-lista li.falta').textContent(),/Encaminhamento/);
  await p.locator('[data-dica-entendi]').click();await toast(/Dica guardada/);assert.equal(await p.locator('.missao.t-dica').count(),0);
  await espaco();await p.locator('.missao').first().waitFor();assert.equal(await p.locator('.missao.t-dica').count(),0,'dica vista não volta');
  // Gestão: relatos com a conferência (sem nota) e comentário privado já com as dicas do que falta.
  await p.selectOption('#viewSwitch','gestao');await p.locator('.nav-item[data-route=inicio]').click();await p.locator('[data-painel-aba=relatos]').click();
  await p.locator('.relato-card .qualidade-chips').first().waitFor();assert.equal(await p.locator('.relato-card').first().locator('.qualidade-chips li.falta').count(),1);
  assert.equal(await p.locator('text=/ranking|nota \\d/i').count(),0);
  await p.locator('[data-guia-relato]').first().click();await p.locator('.guia-pontos li').nth(5).waitFor();await p.locator('#closeDialog').click();
  await p.locator('[data-devolver]').first().click();assert.match(await p.locator('#devolverForm [name=comentario]').inputValue(),/Encaminhamento/);
  await p.locator('#devolverForm [type=submit]').click();await toast(/só para quem escreveu/);await p.locator('.devolutiva-status',{hasText:'Comentário enviado'}).waitFor();
  // Quem escreveu lê no Meu espaço, responde e a missão some.
  await espaco();await p.locator('.missao.t-devolutiva').waitFor();await p.locator('[data-missao-devolutiva]').click();
  assert.match(await p.locator('.devolutiva-texto').textContent(),/Encaminhamento/);await p.fill('#devolutivaForm [name=resposta]','Vou completar.');await p.locator('#devolutivaForm [type=submit]').click();
  await toast(/visto/);assert.equal(await p.locator('.missao.t-devolutiva').count(),0);
  // Mesa do relatório tem o guia; Gestão (fora do período de testes da prévia) não comenta.
  await p.locator('.nav-item[data-route=socioambiental]').click();await p.locator('.mesa-hero [data-guia-relato]').click();await p.locator('.guia-relato').waitFor();await p.locator('#closeDialog').click();
  await p.goto(url('?perfil=gestao'));await p.locator('#roleView option[value=gestao]').waitFor({state:'attached'});await p.locator('.nav-item[data-route=inicio]').click();await p.locator('[data-painel-aba=relatos]').click();
  await p.locator('.relato-card .qualidade-chips').first().waitFor();assert.equal(await p.locator('[data-devolver]').count(),0,'período de testes: só o proprietário comenta');
  assert.deepEqual(errors,[]);await b.close();
  console.log('PASS: relatos — conferência sem nota, guia com o que faltou, dica some ao "Entendi", comentário privado da gestão vira missão de quem escreveu e some ao marcar visto; só o proprietário comenta no período de testes.');
})().catch(e=>{console.error(e);process.exit(1);});
