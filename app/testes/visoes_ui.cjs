// Visões por cargo, Painel da gestão, Programa Parceiros, Auditoria e Conectores, na prévia. node app/testes/visoes_ui.cjs
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+(q||'');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});await p.addInitScript(()=>{try{localStorage.setItem('cpt.menu',JSON.stringify({mes:true,consulta:true}));}catch(_){}});/* grupos do menu abertos (preferência da pessoa) */const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  const nav=async()=>p.$$eval('.nav-item',l=>l.filter(x=>!x.hidden).map(x=>x.dataset.route));
  // As frentes entram pelo Meu espaço; a Visão do mês fica a um clique.
  const espaco=async()=>{await p.locator('.welcome-pets, .mascot-stage').first().waitFor();assert.equal(await p.locator('.nav-item.active').getAttribute('data-route'),'meuespaco');};
  const irInicio=async()=>{await p.locator('.nav-item[data-route=inicio]').click();await p.locator('.shortcuts').waitFor();};
  await p.goto(url('?latencia=40'));await p.locator('.panel-dias').waitFor();
  // Proprietário: faixa da visão aparece e a lateral é a do Administrativo.
  assert.match(await p.locator('#viewBanner').textContent(),/Tela de Administrativo/);
  assert.deepEqual(await nav(),['meuespaco','inicio','atendimentos','album','recados','cronograma','comunicacao','registros','mapa','obras','contatos','equipe','organograma','revisao','ajuda']);
  // Ver como Atendimento: cor, lateral, atalhos e auditoria.
  await p.selectOption('#viewSwitch','atendimento');await espaco();await irInicio();
  assert.equal(await p.getAttribute('html','data-visao'),'atendimento');
  assert.match(await p.locator('#viewBanner').textContent(),/Tela de Atendimento/);
  assert.deepEqual(await nav(),['meuespaco','inicio','atendimentos','album','recados','cronograma','registros','mapa','obras','contatos','organograma','ajuda']);
  assert.match(await p.locator('.home-hero .eyebrow').textContent(),/TELA DE ATENDIMENTO/);
  const semRelatorio=async v=>assert.equal(await p.locator('.report-items, .panel-tipos').count(),0,'"Para o relatório" fora da visão '+v);
  await semRelatorio('atendimento');
  await p.locator('.shortcut',{hasText:'Auditoria das fichas'}).click();await p.locator('.audit-item').first().waitFor();
  assert.match(await p.locator('#view').textContent(),/Recebidos sem nenhuma ação há mais de 3 dias/);assert.equal(await p.locator('.audit-item[open]').count(),2);
  await p.locator('.audit-item[open] [data-case]').first().click();await p.waitForFunction(()=>/Caso 1\d/.test(document.querySelector('#detailTitle').textContent));await p.locator('#closeDialog').click();
  await p.locator('[data-atd-modo=casos]').click();await p.locator('#caseFilters').waitFor();
  // Ver como Comercialização: só ferramentas comuns.
  await p.selectOption('#viewSwitch','comercializacao');await espaco();await irInicio();
  assert.deepEqual(await nav(),['meuespaco','inicio','atendimentos','album','recados','cronograma','registros','mapa','obras','contatos','organograma','ajuda']);
  assert.ok(!(await p.locator('.shortcuts').textContent()).includes('Auditoria'));
  await semRelatorio('comercializacao');
  // 2.27: "Para o relatório" saiu de todas as visões (o fechamento do relatório saiu da aplicação).
  for(const v of ['socioambiental','comunicacao']){await p.selectOption('#viewSwitch',v);await espaco();await irInicio();await p.locator('.panel-dias').waitFor();await semRelatorio(v);}
  // Gestão: painel com alertas, frentes, relatos.
  await p.selectOption('#viewSwitch','gestao');await p.locator('.shortcuts').waitFor();await p.locator('.panel-dias').waitFor();
  // 2.11: o painel são abas da Visão do mês (Resumo · Contrato · Frentes · Relatos); o menu mantém a Visão do mês marcada.
  await p.locator('.nav-item[data-route=inicio]').click();await p.locator('.mes-tabs [data-painel-aba=resumo][aria-selected=true]').waitFor();assert.equal(await p.locator('.nav-item[data-route=painel]').count(),0,'painel fora do menu');
  await p.locator('[data-painel-aba=contrato]').click();await p.locator('.alert-list').waitFor();assert.equal(await p.locator('.nav-item.active').getAttribute('data-route'),'inicio');
  assert.equal(await p.locator('#pageLabel').textContent(),'Visão do mês');
  assert.match(await p.locator('.attention').textContent(),/3 pontos/);assert.equal(await p.locator('.mini-chart').count(),4);
  await p.locator('[role=tab][data-painel-aba=frentes]').click();await p.locator('.front-card').first().waitFor();
  assert.equal(await p.locator('.front-card.is-late').count(),1);
  await p.locator('#frenteFiltro [name=busca]').fill('viela');await p.waitForFunction(()=>document.querySelectorAll('.front-card').length===1);assert.equal(await p.locator('#frenteFiltro [name=busca]').inputValue(),'viela','filtro com espera curta mantém o texto');
  assert.equal(await p.evaluate(()=>document.activeElement.name),'busca','foco mantido no filtro');
  await p.locator('[data-frente]').first().click();await p.waitForFunction(()=>document.querySelector('#detailType').textContent==='FRENTE DE SERVIÇO');
  assert.match(await p.locator('#detailContent').textContent(),/ATD20260014/);await p.locator('#closeDialog').click();
  await p.locator('[role=tab][data-painel-aba=relatos]').click();await p.locator('.relato-card').first().waitFor();
  assert.equal(await p.locator('.relato-card').count(),2);assert.match(await p.locator('#relatosResumo').textContent(),/sem foto/);
  // Conectores (Equipe → administração técnica).
  await p.locator('.nav-item[data-route=ajuda]').click();await p.locator('[data-route=conectores]').click();await p.locator('.connector-list').first().waitFor();
  assert.match(await p.locator('#view').textContent(),/Período de testes: configuração travada/);assert.match(await p.locator('#view').textContent(),/Abrir e compartilhar/);
  // Celular: sem rolagem lateral no painel; troca de visão disponível na faixa.
  await p.setViewportSize({width:390,height:844});
  for(const r of ['painel']){if(r==='painel'){await p.evaluate(()=>document.querySelector('.nav-item[data-route=inicio]').click());await p.locator('[data-painel-aba=contrato]').click();}else await p.evaluate(r=>document.querySelector('.nav-item[data-route='+r+']').click(),r);await p.locator(r==='painel'?'.painel-body':'#ppForm').waitFor();
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'sem rolagem lateral: '+r);}
  assert(await p.locator('#viewSwitch').isVisible(),'troca de visão visível no celular');
  // Pessoa com um papel só: sem faixa de troca, sem páginas da gestão.
  await p.setViewportSize({width:1366,height:900});const q=p;
  await q.goto(url('?perfil=comercializacao&latencia=20'));await espaco();await irInicio();
  assert.equal(await q.locator('#viewBanner').isHidden(),true);
  assert.deepEqual(await q.$$eval('.nav-item',l=>l.filter(x=>!x.hidden).map(x=>x.dataset.route)),['meuespaco','inicio','atendimentos','recados','cronograma','registros','obras','contatos','ajuda']);
  const s=p;
  await s.goto(url('?perfil=socioambiental&latencia=20'));await espaco();await irInicio();
  assert.deepEqual(await s.$$eval('.nav-item',l=>l.filter(x=>!x.hidden).map(x=>x.dataset.route)),['meuespaco','inicio','atendimentos','recados','cronograma','lembretes','registros','obras','contatos','ajuda']);
  assert.match(await s.locator('.shortcuts').textContent(),/Relatos do mês/);assert.doesNotMatch(await s.locator('.shortcuts').textContent(),/Mesa do relatório/);
  assert.deepEqual(errors,[]);
  console.log('PASS: visões por cargo (faixa, cor, lateral e atalhos mudam; pessoa de um papel não troca), auditoria de atendimentos, painel (alertas, frentes com filtro e detalhe, relatos), conectores e celular sem rolagem lateral.');
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
