// Matriz Sabesp (2.40) na prévia: aba em Contatos, importar (antes da importação), fila de propostas com "antes → depois",
// aprovar e recusar (com motivo) só para Gestão/Administrativo, propor contato e inativar, histórico de auditoria e busca geral.
// node app/testes/matriz_ui.cjs  (FOTOS=pasta salva capturas)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});const erros=[];p.on('pageerror',e=>erros.push(e.message));await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png'),fullPage:true});};
  const abrir=async q=>{await p.goto(url(q));await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});await p.locator('.welcome-pets, .mascot-stage, .panel-dias').first().waitFor();
    await p.evaluate(()=>document.querySelector('.nav-item[data-route=contatos]').click());await p.locator('[data-con-aba=matriz]').waitFor();await p.locator('[data-con-aba=matriz]').click();};
  // 1. Antes da importação: Gestão importa; equipe só vê o aviso.
  await abrir('?liberada=1&perfil=socioambiental&matriz=nova&latencia=20');await p.locator('#view h2',{hasText:'Trazer a Matriz'}).waitFor();assert.equal(await p.locator('[data-ms-importar]').count(),0);
  await abrir('?liberada=1&matriz=nova&latencia=20');await p.locator('[data-ms-importar]').click();await p.locator('.mat-table').waitFor();assert.equal(await p.locator('.mat-table .list-row').count(),6);
  // 2. Fila de propostas: contato novo e alteração com "antes → depois".
  await p.goto('about:blank');await abrir('?liberada=1&latencia=20');await p.locator('.mat-fila').waitFor();
  assert.match(await p.locator('.mat-fila h2').textContent(),/2 propostas/);const alt=p.locator('.mat-proposta',{hasText:'Alteração'});
  assert.equal(await alt.locator('del').first().textContent(),'Pessoa B');assert.equal(await alt.locator('ins').first().textContent(),'Pessoa B2');
  assert.match(await p.locator('.mat-table .list-row',{hasText:'Coletivo Cultural'}).textContent(),/Proposta aguardando/);
  await foto('matriz-fila');
  // 3. Aprovar a alteração; recusar o contato novo exige motivo.
  await alt.locator('[data-ms-decidir]').click();await p.waitForFunction(()=>/1 proposta/.test(document.querySelector('.mat-fila h2')?.textContent||''));
  assert.match(await p.locator('.mat-table .list-row',{hasText:'Coletivo Cultural'}).textContent(),/Pessoa B2/);
  await p.locator('.mat-proposta [data-ms-recusar]').click();await p.locator('#msMotivo').waitFor();await p.locator('#msMotivo [type=submit]').click();
  assert.equal(await p.locator('#msMotivo textarea').evaluate(e=>!e.checkValidity()),true,'motivo obrigatório');await p.fill('#msMotivo textarea','Já existe com outro nome');await p.locator('#msMotivo [type=submit]').click();
  await p.locator('.mat-fila').waitFor({state:'detached'});
  // 4. Histórico (auditoria) no contato e propor inativar com motivo.
  await p.locator('.mat-table .list-row',{hasText:'Coletivo Cultural'}).click();await p.locator('.mat-historico').waitFor();
  const h=await p.locator('.mat-historico li').allTextContents();assert.match(h[0],/Gravado na Matriz/);assert.match(h[1],/Aprovado/);assert.match(h.at(-1),/Importado da planilha/);
  await p.locator('[data-ms-ativo]').click();await p.fill('#msMotivo textarea','Grupo encerrou as atividades');await p.locator('#msMotivo [type=submit]').click();await p.locator('.mat-fila').waitFor();
  assert.match(await p.locator('.mat-proposta').textContent(),/Inativar · Coletivo Cultural Fictício/);
  // 5. Propor contato novo: seção obrigatória; vai para a fila.
  await p.locator('[data-ms-novo]').click();await p.locator('#msForm').waitFor();await p.fill('#msForm [name=nome]','Biblioteca Fictícia');await p.fill('#msForm [name=pessoa]','Pessoa H');
  await p.locator('#msForm [type=submit]').click();assert.equal(await p.locator('#msForm [name=secao]').evaluate(e=>!e.checkValidity()),true);
  await p.selectOption('#msForm [name=secao]','ESCOLAS MUNICIPAIS E ESTADUAIS');await p.locator('#msForm [type=submit]').click();await p.waitForFunction(()=>/2 propostas/.test(document.querySelector('.mat-fila h2')?.textContent||''));
  // 6. Filtro por seção.
  await p.selectOption('#msFiltro [name=secao]','ENTIDADES RELIGIOSAS');assert.equal(await p.locator('.mat-table .list-row').count(),1);
  // 7. Equipe: vê e propõe, mas não aprova.
  await p.goto('about:blank');await abrir('?liberada=1&perfil=socioambiental&latencia=20');await p.locator('.mat-fila').waitFor();assert.equal(await p.locator('[data-ms-decidir]').count(),0);assert.ok(await p.locator('[data-ms-novo]').count());
  // 8. Busca geral (Ctrl+K) acha o contato da Matriz e abre na aba certa.
  await p.goto('about:blank');await p.goto(url('?liberada=1&latencia=20'));await p.locator('.welcome-pets, .mascot-stage, .panel-dias').first().waitFor();
  await p.keyboard.press('Control+k');await p.locator('#searchInput').fill('paróquia');await p.locator('.search-item',{hasText:'Matriz Sabesp'}).click();
  await p.locator('#detailTitle',{hasText:'Paróquia Fictícia'}).waitFor();
  // 9. Celular sem rolagem lateral.
  await p.locator('#closeDialog').click();await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=390),true);await foto('matriz-celular');
  assert.deepEqual(erros,[]);await b.close();
  console.log('PASS: matriz na tela — importar só pela gestão, fila com antes → depois, aprovar e recusar com motivo, histórico de auditoria, propor inativar e contato novo (seção obrigatória), filtro por seção, equipe propõe sem aprovar, busca geral abre o contato e celular sem rolagem lateral.');
})().catch(e=>{console.error(e);process.exit(1);});
