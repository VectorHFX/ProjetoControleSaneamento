// Ferramentas da antiga Comunicação (2.29: lembretes, Materiais e Galeria como páginas), Recados e Contatos na prévia. node app/testes/comunicacao_ui.cjs
const {chromium}=require('playwright'),assert=require('assert'),path=require('path'),fs=require('fs'),os=require('os');
// PNG 1x1 para testar o envio de foto.
const png=path.join(os.tmpdir(),'cpt_teste.png');fs.writeFileSync(png,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==','base64'));
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900},acceptDownloads:true});await p.addInitScript(()=>{try{localStorage.setItem('cpt.menu',JSON.stringify({extras:true,admin:true}));}catch(_){}});/* grupos do menu abertos (preferência da pessoa) */const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  // A prévia não abre o Drive: a miniatura recusada (…01) vai para a aplicação; as demais vêm como imagem gerada.
  await p.route(/drive\.google\.com\/thumbnail/,r=>{const id=new URL(r.request().url()).searchParams.get('id');if(/(01|08)$/.test(id))return r.fulfill({status:403,body:''});r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="360" height="270"><rect width="360" height="270" fill="#7cb3e2"/></svg>'});});
  const toast=async re=>p.waitForFunction(r=>new RegExp(r).test(document.querySelector('#toast').textContent),re.source);
  await p.goto('file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+'?perfil=comunicacao&latencia=30');
  // 2.29: entra pelo Meu espaço; a página "Comunicação" e o "Hoje" saíram — Galeria e Materiais nas Ferramentas extras.
  await p.locator('.welcome-pets').waitFor();assert.equal(await p.locator('.nav-item.active').getAttribute('data-route'),'meuespaco');
  assert.deepEqual(await p.$$eval('.nav-item',l=>l.filter(x=>!x.hidden).map(x=>x.dataset.route)),['meuespaco','inicio','atendimentos','registros','galeria','obras','contatos','materiais','ajuda']);
  assert.match(await p.locator('.nav-group[data-grupo=extras] .nav-group-head').textContent(),/Ferramentas extras/);assert.match(await p.locator('.nav-group[data-grupo=ferramentas] .nav-caption').textContent(),/FERRAMENTAS/);
  // 2.30: recados e tarefas recebidas somam no "Meu espaço" (1 recado + 1 tarefa atrasada da Comunicação).
  await p.waitForFunction(()=>document.querySelector('.nav-item[data-route=meuespaco] .nav-badge')?.textContent==='2');
  await p.locator('[data-esp-especie=gato]').click();await p.locator('#espInicio [type=submit]').click();await p.locator('.mascot-stage').waitFor();
  // Recado novo no topo do "Meu dia".
  await p.locator('.home-novos-recados').waitFor();assert.match(await p.locator('.home-novos-recados').textContent(),/Fotos da oficina de horta/);assert.equal(await p.locator('#espTab-recados .tab-count').textContent(),'1');
  // Tarefa recebida (lembrete da Comunicação, atrasado) no checklist: marcar pontua e conclui.
  const rec=p.locator('.check-list li.is-recebida',{hasText:'Divulgar a ação de óleo'});await rec.waitFor();assert.match(await rec.textContent(),/de Comunicadora de exemplo[\s\S]*desde/);
  assert.match(await p.locator('.check-list li.is-recebida',{hasText:'Levar 200 panfletos'}).textContent(),/para Comunicadora de exemplo/,'quem passou acompanha');assert.equal(await p.locator('.check-list li.is-recebida',{hasText:'Levar 200 panfletos'}).locator('input').isDisabled(),true);
  await rec.locator('input').click();/* a linha vira tarefa da própria lista (o elemento é trocado) */await toast(/\+10 pontos/);
  await p.waitForFunction(()=>[...document.querySelectorAll('.check-list li')].some(li=>/Divulgar a ação de óleo/.test(li.textContent)&&li.querySelector('input').checked&&!li.classList.contains('is-recebida')));
  // Passar uma tarefa para outra frente: vira lembrete no dia aberto.
  await p.locator('#espNova [name=texto]').fill('Levar banner para a feira');await p.selectOption('#espNova [name=para]','frente:socioambiental');await p.locator('#espNova [type=submit]').click();await toast(/Tarefa enviada/);
  await p.locator('.check-list li.is-recebida',{hasText:'Levar banner para a feira'}).locator('text=para Socioambiental').waitFor();
  // Recado: abrir pelo cartão marca como lido; responder e resolver na aba Recados.
  await p.locator('[data-esp-recado]').first().click();await p.locator('#recResposta').waitFor();
  assert.match(await p.locator('#detailContent').textContent(),/Oficina de horta/);
  await p.waitForFunction(()=>!document.querySelector('.home-novos-recados'),null,{timeout:8000});
  await p.locator('#recResposta [name=texto]').fill('Separo hoje à tarde.');await p.locator('#recResposta [type=submit]').click();await toast(/Feito/);
  assert.match(await p.locator('#detailContent').textContent(),/Separo hoje à tarde/);
  await p.locator('[data-rec-situacao=resolver]').click();await p.waitForFunction(()=>document.querySelector('[data-rec-situacao=reabrir]'));await p.locator('#closeDialog').click();
  await p.locator('[data-esp-parte=recados]').first().click();await p.locator('#espRecados .tool-head').waitFor();assert.equal(await p.locator('#espTab-recados .tab-count').count(),0);
  // Novo recado exige destinatário.
  await p.locator('[data-rec-novo]').first().click();await p.locator('#recForm').waitFor();
  await p.locator('#recForm [name=assunto]').fill('Teste');await p.locator('#recForm [name=texto]').fill('Mensagem');await p.locator('#recForm [type=submit]').click();
  await p.waitForFunction(()=>/Escolha para quem/.test(document.querySelector('#recErro').textContent));
  await p.locator('#recForm [name=frente][value=socioambiental]').check();await p.locator('#recForm [type=submit]').click();await toast(/Recado enviado/);
  assert.equal(await p.locator('[data-rec-aba=enviados]').getAttribute('aria-selected'),'true');
  // Materiais: concluir com alcance entra no mês.
  await p.locator('.nav-item[data-route=materiais]').click();await p.locator('.month-strip').waitFor();assert.equal(await p.locator('.com-tabs').count(),0,'sem abas da antiga Comunicação');
  assert.match(await p.locator('.month-strip').textContent(),/Publicações1/);
  await p.locator('[data-mat-concluir]').first().click();await p.locator('#matForm').waitFor();
  await p.locator('#matForm [name=alcance]').fill('1200');await p.locator('#matForm [name=publicadoEm]').fill('2026-09-20');await p.locator('#matForm [type=submit]').click();await toast(/concluído/);
  await p.waitForFunction(()=>/Publicações2/.test(document.querySelector('.month-strip')?.textContent));assert.match(await p.locator('.month-strip').textContent(),/6\.200/);
  await p.locator('#matBusca').fill('vídeo');await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>document.activeElement.id),'matBusca','depois do redesenho com espera curta, o foco continua na busca');
  await p.locator('[data-mat-filtro=mes]').click();assert.equal(await p.locator('.material').count(),1);
  // Galeria: escolher, baixar, enviar foto.
  await p.locator('.nav-item[data-route=galeria]').click();await p.locator('.photo').first().waitFor();
  // 2.26.5: Drive recusa (…01) e a aplicação entrega a miniatura; …08 nem a aplicação abre: aviso no lugar.
  await p.waitForFunction(()=>[...document.querySelectorAll('.photo img[data-mini$="01"]')].some(i=>i.src.startsWith('data:image')&&i.naturalWidth>0));
  await p.waitForFunction(()=>document.querySelector('.photo .photo-missing'));
  await p.locator('.photo img[data-mini$="01"]').first().locator('xpath=..').click();await p.locator('#detailDialog[open] img.media-mini').waitFor();assert.equal(await p.locator('#detailDialog[open] iframe').count(),0,'sem visualizador do Drive para foto sem acesso');await p.locator('#closeDialog').click();
  assert.equal(await p.locator('.photo').count(),24);await p.locator('[data-gal-mais]').click();assert.equal(await p.locator('.photo').count(),30);
  await p.locator('[data-gal-marcar]').nth(0).check();await p.locator('[data-gal-marcar]').nth(1).check();assert.equal(await p.locator('#galSel').textContent(),'2');
  const [dl]=await Promise.all([p.waitForEvent('download'),p.locator('[data-gal-baixar]').click()]);assert.match(dl.suggestedFilename(),/^Fotos 2026-09\.zip$/);
  await p.locator('[data-gal-enviar]').first().click();await p.locator('#galForm').waitFor();
  await p.setInputFiles('#galForm [name=arquivos]',png);await p.locator('#galForm [name=atividade]').fill('Oficina de horta');await p.locator('#galForm [type=submit]').click();
  await toast(/Foto guardada/);
  // Contatos: cadastrar, registrar conversa, filtro mantém o foco.
  await p.locator('.nav-item[data-route=contatos]').click();await p.locator('.contacts-table .list-row').first().waitFor();
  await p.locator('[data-con-novo]').click();await p.locator('#conForm').waitFor();
  await p.locator('#conForm [name=nome]').fill('Jornalista de exemplo');await p.selectOption('#conForm [name=tipo]','Imprensa');await p.locator('#conForm [name=telefone]').fill('(11) 98888-7777');
  await p.locator('#conForm [type=submit]').click();await toast(/Contato salvo/);assert.equal(await p.locator('.contacts-table .list-row').count(),2);
  assert.ok(await p.locator('.contacts-table .list-row',{hasText:'Jornalista'}).locator('a[href^="https://wa.me/55"]').count());
  await p.locator('#conFiltro [name=busca]').fill('horta');await p.waitForFunction(()=>document.querySelectorAll('.contacts-table .list-row').length===1);assert.equal(await p.evaluate(()=>document.activeElement.name),'busca','foco continua na busca depois de redesenhar');
  await p.locator('[data-con-abrir]').click();await p.locator('#conConversa [name=texto]').fill('Confirmou a oficina.');await p.locator('#conConversa [type=submit]').click();await toast(/Conversa registrada/);
  assert.match(await p.locator('#detailContent').textContent(),/Confirmou a oficina/);await p.locator('#closeDialog').click();
  // Celular: sem rolagem lateral.
  await p.setViewportSize({width:390,height:844});
  for(const aba of ['galeria','materiais','meuespaco']){await p.evaluate(a=>document.querySelector('.nav-item[data-route='+a+']').click(),aba);await p.waitForTimeout(500);
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'sem rolagem lateral: '+aba);}
  // Social vê lembretes e a galeria (envia fotos); materiais só para consultar.
  await p.setViewportSize({width:1366,height:900});await p.goto('file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+'?perfil=socioambiental&latencia=20');await p.locator('.welcome-pets').waitFor();
  // Endereço antigo de Lembretes leva ao Meu espaço.
  await p.evaluate(()=>document.querySelector('[data-route=lembretes]')?.click());await p.locator('.welcome-pets, .mascot-stage').first().waitFor();assert.equal(await p.locator('.nav-item.active').getAttribute('data-route'),'meuespaco');
  await p.locator('.nav-item[data-route=materiais]').click();await p.locator('.month-strip').waitFor();assert.equal(await p.locator('[data-mat-novo], [data-mat-editar]').count(),0,'Social só consulta os materiais');
  await p.locator('.nav-item[data-route=galeria]').click();await p.locator('.photo').first().waitFor();assert.equal(await p.locator('[data-gal-enviar]').count(),1);
  // Atendimento vê a galeria, sem enviar.
  await p.goto('file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+'?perfil=atendimento&latencia=20');await p.locator('.welcome-pets').waitFor();
  await p.locator('.nav-item[data-route=galeria]').click();await p.locator('.photo').first().waitFor();assert.equal(await p.locator('[data-gal-enviar]').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: ferramentas da antiga Comunicação (2.29) e Meu espaço com recados e tarefas (2.30) — menu com Ferramentas e Ferramentas extras, aviso somado no Meu espaço, recado novo no Meu dia, tarefa recebida pontua e conclui, tarefa passada para uma frente, Galeria e Materiais para todos (enviar e editar só quem pode), recado lido/respondido/resolvido e novo recado validado, material concluído entra no mês, galeria (mais, escolher, baixar .zip, enviar foto), contatos (cadastro, WhatsApp, conversa, filtro com foco), celular sem rolagem e Social com lembretes.');
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
