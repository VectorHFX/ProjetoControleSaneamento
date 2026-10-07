// Qualidade dos relatos, guia, dicas e comentário privado da gestão, na prévia. node app/testes/relatos_ui.cjs
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});await p.addInitScript(()=>{try{localStorage.setItem('cpt.menu',JSON.stringify({extras:true,admin:true}));}catch(_){}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
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
  // Gestão: na ferramenta Relatos (2.49: saiu da Visão do mês), pontos para melhorar (sem nota) e comentário privado já com as dicas do que falta.
  await p.locator('.nav-item[data-route=registros]').click();await p.locator('.rel-card').first().waitFor();
  assert.match(await p.locator('.rel-card').first().locator('.rel-pontos summary').textContent(),/1 ponto para melhorar/);
  assert.equal(await p.locator('text=/ranking|nota \\d/i').count(),0);
  await p.locator('.results-head [data-guia-relato]').click();await p.locator('.guia-pontos li').nth(5).waitFor();await p.locator('#closeDialog').click();
  await p.locator('.rel-card').first().locator('[data-rel-comentar]').click();assert.match(await p.locator('#relComentar [name=comentario]').inputValue(),/Encaminhamento/);
  await p.locator('#relComentar [type=submit]').click();await toast(/só para quem escreveu/);
  await p.locator('.rel-card').first().locator('.devolutiva-status',{hasText:'Comentário da gestão'}).waitFor();assert.equal(await p.locator('.rel-card').first().locator('[data-rel-comentar]').textContent(),'Novo comentário');
  // Quem escreveu lê no Meu espaço, responde e a missão some.
  await espaco();await p.locator('.missao.t-devolutiva').waitFor();await p.locator('[data-missao-devolutiva]').click();
  assert.match(await p.locator('.devolutiva-texto').textContent(),/Encaminhamento/);await p.fill('#devolutivaForm [name=resposta]','Vou completar.');await p.locator('#devolutivaForm [type=submit]').click();
  await toast(/visto/);assert.equal(await p.locator('.missao.t-devolutiva').count(),0);
  // Gestão (fora do período de testes da prévia) não comenta.
  await p.goto(url('?perfil=gestao'));await p.locator('#roleView option[value=gestao]').waitFor({state:'attached'});await p.locator('.nav-item[data-route=registros]').click();
  await p.locator('.rel-card .rel-pontos').first().waitFor();assert.equal(await p.locator('[data-rel-comentar]').count(),0,'período de testes: só o proprietário comenta');
  // A Visão do mês fica só com os gráficos de qualidade e o caminho para os relatos.
  await p.locator('.nav-item[data-route=inicio]').click();await p.locator('[data-painel-aba=relatos]').click();await p.locator('.rel-qualidade').waitFor();
  assert.equal(await p.locator('#view .relato-card').count(),0,'sem a lista repetida');await p.locator('.rel-ir [data-route=registros]').click();await p.locator('.rel-card').first().waitFor();
  assert.deepEqual(errors,[]);await b.close();
  console.log('PASS: relatos — conferência sem nota, guia com o que faltou, dica some ao "Entendi", comentário privado da gestão (no cartão de Relatos) vira missão de quem escreveu e some ao marcar visto; só o proprietário comenta no período de testes; a Visão do mês leva aos relatos sem repetir a lista.');
})().catch(e=>{console.error(e);process.exit(1);});
