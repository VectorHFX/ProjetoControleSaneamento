// Etapa 3 (2.13): listas em linhas (Atendimentos, Registros, Contatos) com painel de detalhe. node app/testes/listas_ui.cjs
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{try{localStorage.setItem('cpt.menu',JSON.stringify({mes:true,consulta:true}));}catch(_){}});
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q;
  // Atendimentos: uma linha por caso, com as colunas combinadas.
  await p.goto(url('?inicial=1&latencia=20'));await p.locator('.report-items').waitFor();
  await p.locator('.nav-item[data-route=atendimentos]').click();await p.locator('#caseResults .list-row').first().waitFor();
  assert.deepEqual(await p.$$eval('#caseResults .list-head [data-col]',l=>l.map(x=>x.textContent.trim())),['Caso','Nome','Assunto','Situação','Com quem está','Dias','Próxima ação']);
  const linha=p.locator('#caseResults .list-row',{hasText:'ATD20260016'});
  assert.match(await linha.textContent(),/Pessoa de exemplo 5/);assert.match(await linha.textContent(),/Conferir o retorno/);
  assert.equal(await linha.locator('.dias').textContent(),'64');assert.match(await linha.locator('.dias').getAttribute('class'),/vermelho/);
  assert.match(await p.locator('#caseResults .list-row',{hasText:'ATD20260015'}).locator('.dias').getAttribute('class'),/amarelo/);
  assert.match(await p.locator('#caseResults .list-row',{hasText:'ATD20260017'}).locator('.dias').getAttribute('class'),/verde/);
  // Computador: clicar abre o painel ao lado (a lista continua clicável) e marca a linha aberta.
  await linha.click();await p.locator('#detailDialog.is-side[open] .case-status').waitFor();
  assert.match(await linha.getAttribute('class'),/is-open/);assert.match(await p.locator('#detailTitle').textContent(),/Caso 16(?!\d)/);
  const box=await p.locator('#detailDialog').boundingBox();assert.ok(box.x>500,'painel à direita');
  await p.locator('#caseResults .list-row',{hasText:'ATD20260017'}).click();await p.waitForFunction(()=>/Caso 17(?!\d)/.test(document.querySelector('#detailTitle').textContent));
  assert.equal(await p.locator('#caseResults .list-row.is-open').count(),1);assert.match(await p.locator('#caseResults .list-row.is-open').textContent(),/Caso 17(?!\d)/);
  // Teclado: ↓/J próximo, ↑/K anterior, Esc fecha (e tira o destaque).
  await p.keyboard.press('ArrowDown');await p.waitForFunction(()=>/Caso 18(?!\d)/.test(document.querySelector('#detailTitle').textContent));
  await p.keyboard.press('k');await p.waitForFunction(()=>/Caso 17(?!\d)/.test(document.querySelector('#detailTitle').textContent));
  await p.keyboard.press('j');await p.waitForFunction(()=>/Caso 18(?!\d)/.test(document.querySelector('#detailTitle').textContent));
  // 2.26.6: a lista mostra "Caso N" com o protocolo embaixo, e o detalhe mostra o protocolo oficial.
  assert.match(await p.locator('#caseResults .list-row',{hasText:'ATD20260017'}).locator('.c-caso').textContent(),/^Caso 17$/);assert.match(await p.locator('#detailContent').textContent(),/Protocolo ATD20260018/);
  await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('#detailDialog').open);
  assert.equal(await p.locator('.list-row.is-open').count(),0);assert.equal(await p.evaluate(()=>document.body.classList.contains('detail-side')),false);
  // Fechar pelo ✕ também.
  await linha.click();await p.locator('#detailDialog.is-side[open]').waitFor();await p.locator('#closeDialog').click();await p.waitForFunction(()=>!document.querySelector('#detailDialog').open);
  // Tela média: janela por cima (sem painel ao lado). Enter numa linha com foco também abre.
  await p.setViewportSize({width:1000,height:800});await p.locator('#caseResults .list-row',{hasText:'ATD20260015'}).focus();await p.keyboard.press('Enter');
  await p.locator('#detailDialog[open] .case-status').waitFor();assert.equal(await p.evaluate(()=>document.querySelector('#detailDialog').classList.contains('is-side')),false,'janela por cima');
  await p.locator('#closeDialog').click();
  // Celular: linha em duas faixas (protocolo e nome / situação, dias, com quem está), sem rolagem lateral, janela por cima.
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'sem rolagem lateral');
  const r=await p.locator('#caseResults .list-row',{hasText:'ATD20260016'}),cel=n=>r.locator(n).boundingBox();
  const prot=await cel('.c-prot'),sit=await cel('.c-sit'),dias=await cel('.c-dias');assert.ok(sit.y>prot.y+8,'situação na segunda faixa');assert.ok(Math.abs(dias.y-sit.y)<12,'dias na mesma faixa da situação');
  assert.equal(await p.locator('#caseResults .list-head').isVisible(),false,'cabeçalho escondido no celular');
  await r.click();await p.locator('#detailDialog[open] .case-status').waitFor();assert.equal(await p.evaluate(()=>document.querySelector('#detailDialog').classList.contains('is-side')),false);
  await p.locator('#closeDialog').click();await p.setViewportSize({width:1366,height:900});
  // Registros: Data · [etiqueta do procedimento] Atividade · Bairro · Responsável; os 36 do mês numa página só (50 por vez).
  await p.locator('.nav-item[data-route=registros]').click();await p.locator('#recordResults .list-row').first().waitFor();
  assert.deepEqual(await p.$$eval('#recordResults .list-head [data-col]',l=>l.map(x=>x.textContent.trim())),['Data','Atividade','Bairro','Responsável']);
  assert.equal(await p.locator('#recordResults .list-row').count(),36);assert.equal(await p.locator('[data-action=more-records]').count(),0,'sem "mais": cabem em 50');
  assert.equal(await p.locator('#recordResults .list-row .proc-tag.tag-pesquisa').first().textContent(),'Pesquisa');assert.ok(await p.locator('#recordResults .list-row .proc-tag.tag-relato').count()>0);
  const reg1=p.locator('#recordResults .list-row').nth(1);await reg1.click();await p.locator('#detailDialog.is-side[open]').waitFor();
  assert.equal(await p.locator('#detailType').textContent(),'REGISTRO DE CAMPO');const t1=await p.locator('#detailTitle').textContent();
  await p.keyboard.press('ArrowDown');await p.waitForFunction(()=>document.querySelectorAll('#recordResults .list-row')[2].classList.contains('is-open'));
  await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('#detailDialog').open);
  // Contatos: Nome · Instituição · Tipo · Bairro + Ligar/WhatsApp na linha; clicar na linha abre o painel; tocar em Ligar não abre.
  await p.locator('.nav-item[data-route=contatos]').click();await p.locator('.contacts-table .list-row').first().waitFor();
  assert.deepEqual(await p.$$eval('.contacts-table .list-head [data-col]',l=>l.map(x=>x.textContent.trim())),['Nome','Instituição','Tipo','Bairro','']);
  const c1=p.locator('.contacts-table .list-row',{hasText:'Diretora de exemplo'});
  assert.match(await c1.locator('a[aria-label^="Ligar"]').getAttribute('href'),/^tel:/);assert.match(await c1.locator('a[aria-label^="WhatsApp"]').getAttribute('href'),/^https:\/\/wa\.me\/55/);
  await c1.locator('.c-nome').click();await p.locator('#detailDialog.is-side[open]').waitFor();assert.match(await p.locator('#detailTitle').textContent(),/Diretora de exemplo/);
  await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('#detailDialog').open);
  await c1.locator('a[aria-label^="Ligar"]').evaluate(a=>{a.addEventListener('click',e=>e.preventDefault(),{once:true});a.click();});await p.waitForTimeout(300);
  assert.equal(await p.evaluate(()=>document.querySelector('#detailDialog').open),false,'Ligar não abre o painel');
  assert.deepEqual(errors,[]);
  console.log('PASS: listas — contatos em linhas com Ligar/WhatsApp e painel; registros em linhas com etiqueta do procedimento e painel; atendimentos em linhas com colunas e cores dos dias; painel ao lado com a lista clicável; teclado ↑↓ J K e Esc; tela média e celular com janela e linha em duas faixas.');
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
