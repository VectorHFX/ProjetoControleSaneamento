// O caminho do esgoto (2.51) na prévia: casa (com erro e explicação), rua (girar os canos até a água chegar), estação (erro e ordem certa),
// rio com estrelas e +5, opinião sem nome, resumo do teste só do proprietário, celular e tema escuro. node app/testes/caminho_ui.cjs  (FOTOS=pasta)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
const VAI=['Água do banho','Água de lavar a louça','Água da máquina de lavar','Descarga do vaso'],ORDEM=['Gradeamento','Caixa de areia','Decantador primário','Tanque de aeração','Decantador secundário'];
const dir=(a,b)=>b[0]<a[0]?0:b[1]>a[1]?1:b[0]>a[0]?2:3,lados=(t,g)=>t==='reta'?[g%4,(g+2)%4]:[g%4,(g+1)%4];
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png')});};
  const toast=async re=>p.waitForFunction(r=>new RegExp(r).test(document.querySelector('#toast').textContent),re.source);
  const espaco=async q=>{await p.goto(url(q));await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});await p.waitForTimeout(500);await p.evaluate(()=>document.querySelector('.nav-item[data-route=meuespaco]').click());
    await p.locator('.welcome-pets, .mascot-stage').first().waitFor();if(await p.locator('.welcome-pets').count()){await p.locator('[data-esp-especie=gato]').click();await p.locator('#espInicio [type=submit]').click();await p.locator('.mascot-stage').waitFor();}
    await p.locator('[data-esp-parte=jogos]').click();await p.locator('.home-jogos').waitFor();};
  // Proprietário: cartão em destaque, liberado (sem meta), com o resumo do teste.
  await espaco('?latencia=20');const card=p.locator('.jogo-card.is-destaque');assert.match(await card.textContent(),/O caminho do esgoto[\s\S]*Novo · em teste/);assert.equal(await card.locator('[data-cam-teste]').count(),1);
  // 1. Casa: um erro de propósito (explicação aparece, mascote triste), o resto certo.
  await p.locator('[data-jogo-abrir=caminho]').click();await p.locator('.cam-trilha li.is-agora',{hasText:'Casa'}).waitFor();assert.equal(await p.locator('.cam-relogio[role=timer] [data-cam-seg]').textContent(),'12','relógio começa nos 12 segundos');
  // 3.0: os segundos correm no anel e a barra encolhe (movidos pelo código, valem mesmo com as animações desligadas).
  await p.waitForFunction(()=>+document.querySelector('[data-cam-seg]').textContent<=10,null,{timeout:5000});
  assert.ok(await p.evaluate(()=>{const m=getComputedStyle(document.querySelector('[data-cam-barra]')).transform;return m!=='none'&&+m.split(/[(,]/)[1]<.9;}),'a barra encolhe');
  assert.ok(await p.locator('.cam-mascote svg.chibi').count()===1,'o mascote da pessoa é o personagem');
  for(let i=0;i<8;i++){const nome=(await p.locator('.cam-cartao-nome').textContent()).trim(),vai=VAI.includes(nome),certo=i!==0;
    await p.locator(`[data-cam-casa="${(certo?vai:!vai)?1:0}"]`).click();await p.locator('[data-cam-seguir]').waitFor();
    if(i===0){assert.match(await p.locator('.cam-fala').textContent(),/Ops/);assert.equal(await p.locator('.cam-cartao.is-errado').count(),1);assert.ok((await p.locator('.cam-cartao').textContent()).length>40,'explica o porquê');assert.match(await p.locator('.cam-mascote').innerHTML(),/#8fd0f2/,'mascote triste (gotinha)');await foto('caminho-1-casa-erro');}
    await p.locator('[data-cam-seguir]').click();}
  // 2. Rua: gira cada peça até a água passar; a água avança trecho a trecho.
  await p.locator('.cam-grade').waitFor();await foto('caminho-2-rua');
  const cel=await p.$$eval('[data-cam-cano]',l=>l.map(x=>({i:+x.dataset.camCano,rc:x.dataset.camCel.split(',').map(Number),tipo:x.dataset.camTipo,g:+x.dataset.camGiro})).sort((a,c)=>a.i-c.i));assert.equal(cel.length,8);
  let toques=0;for(let k=0;k<cel.length;k++){const c=cel[k],entra=k===0?3:(dir(cel[k-1].rc,c.rc)+2)%4,sai=k===cel.length-1?1:dir(c.rc,cel[k+1].rc);let n=0;
    while(!(lados(c.tipo,(c.g+n)%4).includes(entra)&&lados(c.tipo,(c.g+n)%4).includes(sai)))n++;for(let j=0;j<n;j++){await p.locator(`[data-cam-cano="${c.i}"]`).click();toques++;}
    if(k<cel.length-1)assert.ok(await p.locator('.cam-cano.is-agua').count()>=k+1,'a água chegou até a peça '+(k+1));}
  await p.locator('.cam-cartao.is-certo',{hasText:'ligação do imóvel é obrigatória'}).waitFor();assert.equal(await p.locator('.cam-cano.is-agua').count(),8);assert.equal(await p.locator('.cam-cano:not([disabled])').count(),0,'resolvido: canos travados');
  assert.match(await p.locator('.cam-contador').textContent(),new RegExp('^'+toques+' toques?'));await foto('caminho-3-rua-ok');await p.locator('[data-cam-seguir]').click();
  // 3. Estação: escolha errada primeiro, depois a ordem do lodo ativado.
  await p.locator('.cam-etapas').waitFor();await p.locator('.cam-carta',{hasText:'Decantador secundário'}).click();assert.match(await p.locator('.cam-fala').textContent(),/Ainda não/);assert.match(await p.locator('.cam-contador').textContent(),/1 erro/);
  for(const n of ORDEM)await p.locator('.cam-carta',{hasText:n}).click();assert.equal(await p.locator('.cam-etapas li.is-feita').count(),5);await foto('caminho-4-estacao');
  // 4. Rio: estrelas, +5 e opinião.
  await p.locator('[data-cam-seguir]').click();await p.locator('.cam-placar').waitFor();await toast(/chegou tratado ao rio! \+5/);
  const placar=await p.locator('.cam-placar').textContent();assert.match(placar,/Casa★★☆7 de 8 certos/);assert.match(placar,/Estação★★☆1 erro/);assert.match(placar,new RegExp('Rua★★★'+toques+' toques'));
  await p.waitForFunction(()=>document.querySelector('#espPontos').textContent.trim()==='5');await foto('caminho-5-rio');
  await p.locator('#camOpiniao [type=submit]').click();assert.equal(await p.locator('#camOpiniao').count(),1,'sem nota, o formulário não envia');
  await p.locator('#camOpiniao .cam-nota',{hasText:'4'}).click();await p.locator('#camOpiniao .cam-nota',{hasText:'Um pouco'}).click();await p.fill('#camOpiniao [name=sugestao]','Mais fases na rua.');
  await p.locator('#camOpiniao [type=submit]').click();await toast(/sem o seu nome/);await p.locator('.cam',{hasText:'Obrigado pela opinião'}).waitFor();
  assert.match(await p.locator('.dialog-actions [data-jogo-abrir=caminho]').textContent(),/Jogar de novo \(2 hoje\)/);
  // 5. Resumo do teste (proprietário): sem nomes.
  await p.locator('#closeDialog').click();await p.locator('[data-cam-teste]').click();await p.locator('#detailContent .stat-row').waitFor();const rs=await p.locator('#detailContent').textContent();
  assert.match(rs,/Partidas[\s\S]*Diversão[\s\S]*O que mais confunde na casa[\s\S]*Trocas mais comuns na estação[\s\S]*O que mudariam/);assert.doesNotMatch(rs,/Victor|@example/);await foto('caminho-6-teste');await p.locator('#closeDialog').click();
  // 6. Fechar no meio para o relógio e recomeça a partida aberta; celular sem rolagem lateral; tema escuro.
  // 3.0: sem resposta, o anel fica vermelho nos últimos segundos e, ao zerar, conta como "o tempo acabou" (com a explicação).
  await p.locator('[data-jogo-abrir=caminho]').click();await p.locator('.cam-cartao-nome').waitFor();await p.locator('.cam-pergunta.is-pouco').waitFor({timeout:9000});await foto('caminho-0-relogio');
  await p.locator('.cam-pergunta.is-fim').waitFor({timeout:4000});await p.locator('.cam-fala',{hasText:'O tempo acabou'}).waitFor({timeout:5000});assert.equal(await p.locator('.cam-cartao.is-errado').count(),1);
  assert.equal(await p.locator('[data-cam-seg]').count(),0,'relógio some com a resposta');await p.locator('#closeDialog').click();await p.waitForTimeout(200);
  await p.locator('[data-jogo-abrir=caminho]').click();await p.locator('.cam-cartao-nome').waitFor();await p.locator('#closeDialog').click();await p.waitForTimeout(200);
  await p.setViewportSize({width:390,height:844});await p.locator('[data-jogo-abrir=caminho]').click();await p.locator('.cam-cartao-nome').waitFor();assert.match(await p.locator('.cam-contador').textContent(),/^1 de 8/,'recomeça do início');
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'sem rolagem lateral no celular');await foto('caminho-7-celular');
  await p.locator('#closeDialog').click();await p.locator('#theme').selectOption('dark');await p.locator('[data-jogo-abrir=caminho]').click();await p.locator('.cam-cartao-nome').waitFor();await foto('caminho-8-escuro');
  assert.deepEqual(errors,[]);await b.close();
  console.log('PASS: caminho do esgoto na tela — cartão em destaque, mascote como personagem (triste no erro), casa com relógio (segundos no anel, barra, tempo esgotado) e explicação, rua com a água avançando até travar resolvida, estação com erro e ordem certa, rio com estrelas e +5, opinião obrigatória nas notas e sem nome, resumo do teste sem nomes, recomeço ao fechar, celular e tema escuro.');
})().catch(e=>{console.error(e);process.exit(1);});
