// Visões por cargo, Painel da gestão, Programa Parceiros, Auditoria e Conectores, na prévia. node app/testes/visoes_ui.cjs
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+(q||'');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  const nav=async()=>p.$$eval('.nav-item',l=>l.filter(x=>!x.hidden).map(x=>x.dataset.route));
  // As frentes entram pelo Meu espaço; a Visão do mês fica a um clique.
  const espaco=async()=>{await p.locator('.welcome-pets, .mascot-stage').first().waitFor();assert.equal(await p.locator('.nav-item.active').getAttribute('data-route'),'meuespaco');};
  const irInicio=async()=>{await p.locator('.nav-item[data-route=inicio]').click();await p.locator('.shortcuts').waitFor();};
  await p.goto(url('?latencia=40'));await p.locator('.report-items').waitFor();
  // Proprietário: faixa da visão aparece e a lateral é a do Administrativo.
  assert.match(await p.locator('#viewBanner').textContent(),/Tela de Administrativo/);
  assert.deepEqual(await nav(),['meuespaco','inicio','comunicacao','recados','painel','parceiros','cronograma','registros','atendimentos','socioambiental','obras','contatos','fechamento','equipe','ajuda']);
  // Ver como Atendimento: cor, lateral, atalhos e auditoria.
  await p.selectOption('#viewSwitch','atendimento');await espaco();await irInicio();
  assert.equal(await p.getAttribute('html','data-visao'),'atendimento');
  assert.match(await p.locator('#viewBanner').textContent(),/Tela de Atendimento/);
  assert.deepEqual(await nav(),['meuespaco','inicio','recados','cronograma','registros','atendimentos','obras','contatos','ajuda']);
  assert.match(await p.locator('.home-hero .eyebrow').textContent(),/TELA DE ATENDIMENTO/);
  await p.locator('.shortcut',{hasText:'Auditoria das fichas'}).click();await p.locator('.audit-item').first().waitFor();
  assert.match(await p.locator('#view').textContent(),/Recebidos sem nenhuma ação há mais de 3 dias/);assert.equal(await p.locator('.audit-item[open]').count(),2);
  await p.locator('.audit-item[open] [data-case]').first().click();await p.waitForFunction(()=>/DEMO-10/.test(document.querySelector('#detailTitle').textContent));await p.locator('#closeDialog').click();
  await p.locator('[data-atd-modo=casos]').click();await p.locator('#caseFilters').waitFor();
  // Ver como Comercialização: só ferramentas comuns.
  await p.selectOption('#viewSwitch','comercializacao');await espaco();await irInicio();
  assert.deepEqual(await nav(),['meuespaco','inicio','recados','cronograma','registros','atendimentos','obras','contatos','ajuda']);
  assert.ok(!(await p.locator('.shortcuts').textContent()).includes('Auditoria'));
  // Gestão: painel com alertas, frentes, relatos.
  await p.selectOption('#viewSwitch','gestao');await p.locator('.shortcuts').waitFor();
  await p.locator('.nav-item[data-route=painel]').click();await p.locator('.alert-list').waitFor();
  assert.match(await p.locator('.attention').textContent(),/3 pontos/);assert.equal(await p.locator('.mini-chart').count(),4);
  await p.locator('[role=tab][data-painel-aba=frentes]').click();await p.locator('.front-card').first().waitFor();
  assert.equal(await p.locator('.front-card.is-late').count(),1);
  await p.locator('#frenteFiltro [name=busca]').fill('viela');await p.waitForFunction(()=>document.querySelectorAll('.front-card').length===1);assert.equal(await p.locator('#frenteFiltro [name=busca]').inputValue(),'viela','filtro com espera curta mantém o texto');
  assert.equal(await p.evaluate(()=>document.activeElement.name),'busca','foco mantido no filtro');
  await p.locator('[data-frente]').first().click();await p.waitForFunction(()=>document.querySelector('#detailType').textContent==='FRENTE DE SERVIÇO');
  assert.match(await p.locator('#detailContent').textContent(),/DEMO-102/);await p.locator('#closeDialog').click();
  await p.locator('[role=tab][data-painel-aba=relatos]').click();await p.locator('.relato-card').first().waitFor();
  assert.equal(await p.locator('.relato-card').count(),2);assert.match(await p.locator('#relatosResumo').textContent(),/sem foto/);
  // Programa Parceiros: sugestões, salvar, publicar, imprimir.
  await p.locator('.nav-item[data-route=parceiros]').click();await p.locator('#ppForm').waitFor();
  assert.match(await p.locator('#pp8').textContent(),/Mês anterior: 8/);assert.match(await p.locator('#pp9').textContent(),/fórmula/);
  await p.locator('#ppSugestoes').click();assert.equal(await p.locator('[data-linha="8"]').inputValue(),'11');assert.equal(await p.locator('[data-linha="17"]').inputValue(),'8.7');
  await p.locator('[data-pp-na="3"]').click();assert.equal(await p.locator('[data-linha="3"]').inputValue(),'Não aplicada');
  await p.locator('[data-pp-ok="8"]').check();assert.match(await p.locator('#ppEstado').textContent(),/não salvas/);
  await p.locator('.pp-eng summary').click();await p.locator('[data-linha="59"]').check();await p.selectOption('[data-linha="83"]','Sim');
  await p.locator('#ppSalvar').click();await p.waitForFunction(()=>document.querySelector('#ppEstado').textContent==='Tudo salvo');
  assert.match(await p.locator('#ppSituacao').textContent(),/versão 1/);
  await p.locator('#ppPublicar').click();await p.waitForFunction(()=>/Publicado/.test(document.querySelector('#ppSituacao').textContent));
  await p.locator('#ppExportar').click();await p.waitForFunction(()=>/Baixar Excel/.test(document.querySelector('#ppResultado').textContent));
  // Alteração sem salvar fica guardada no navegador e volta ao reabrir.
  await p.locator('[data-linha="10"]').fill('Oficinas e rodas de conversa');await p.locator('.nav-item[data-route=painel]').click();await p.locator('.painel-body').waitFor();
  await p.locator('.nav-item[data-route=parceiros]').click();await p.locator('#ppForm').waitFor();
  assert.equal(await p.locator('[data-linha="10"]').inputValue(),'Oficinas e rodas de conversa');assert.match(await p.locator('#view').textContent(),/Recuperamos respostas/);
  // Conectores (Equipe → administração técnica).
  await p.locator('#ppSalvar').click();await p.waitForFunction(()=>document.querySelector('#ppEstado').textContent==='Tudo salvo');
  await p.locator('.nav-item[data-route=ajuda]').click();await p.locator('[data-route=conectores]').click();await p.locator('.connector-list').first().waitFor();
  assert.match(await p.locator('#view').textContent(),/Período de testes: configuração travada/);assert.match(await p.locator('#view').textContent(),/Abrir e compartilhar/);
  // Celular: sem rolagem lateral no painel e no Programa Parceiros; troca de visão disponível na faixa.
  await p.setViewportSize({width:390,height:844});
  for(const r of ['painel','parceiros']){await p.evaluate(r=>document.querySelector('.nav-item[data-route='+r+']').click(),r);await p.locator(r==='painel'?'.painel-body':'#ppForm').waitFor();
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'sem rolagem lateral: '+r);}
  assert(await p.locator('#viewSwitch').isVisible(),'troca de visão visível no celular');
  // Pessoa com um papel só: sem faixa de troca, sem páginas da gestão.
  await p.setViewportSize({width:1366,height:900});const q=p;
  await q.goto(url('?perfil=comercializacao&latencia=20'));await espaco();await irInicio();
  assert.equal(await q.locator('#viewBanner').isHidden(),true);
  assert.deepEqual(await q.$$eval('.nav-item',l=>l.filter(x=>!x.hidden).map(x=>x.dataset.route)),['meuespaco','inicio','recados','cronograma','registros','atendimentos','obras','contatos','ajuda']);
  const s=p;
  await s.goto(url('?perfil=socioambiental&latencia=20'));await espaco();await irInicio();
  assert.deepEqual(await s.$$eval('.nav-item',l=>l.filter(x=>!x.hidden).map(x=>x.dataset.route)),['meuespaco','inicio','recados','cronograma','registros','atendimentos','socioambiental','lembretes','obras','contatos','fechamento','ajuda']);
  assert.match(await s.locator('.shortcuts').textContent(),/Mesa do relatório/);
  assert.deepEqual(errors,[]);
  console.log('PASS: visões por cargo (faixa, cor, lateral e atalhos mudam; pessoa de um papel não troca), auditoria de atendimentos, painel (alertas, frentes com filtro e detalhe, relatos), Programa Parceiros (sugestão, não se aplica, conferido, salvar, publicar, exportar, rascunho recuperado), conectores e celular sem rolagem lateral.');
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
