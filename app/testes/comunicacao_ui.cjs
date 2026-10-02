// Comunicação (Hoje, lembretes, materiais, galeria), Recados e Contatos na prévia. node app/testes/comunicacao_ui.cjs
const {chromium}=require('playwright'),assert=require('assert'),path=require('path'),fs=require('fs'),os=require('os');
// PNG 1x1 para testar o envio de foto.
const png=path.join(os.tmpdir(),'cpt_teste.png');fs.writeFileSync(png,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==','base64'));
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900},acceptDownloads:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  const toast=async re=>p.waitForFunction(r=>new RegExp(r).test(document.querySelector('#toast').textContent),re.source);
  await p.goto('file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+'?perfil=comunicacao&latencia=30');
  // Entra direto no "Hoje", com aviso de recado na lateral.
  await p.locator('.welcome-pets').waitFor();assert.equal(await p.locator('.nav-item.active').getAttribute('data-route'),'meuespaco');
  await p.locator('.nav-item[data-route=comunicacao]').click();await p.locator('.today-hello').waitFor();
  assert.deepEqual(await p.$$eval('.nav-item',l=>l.filter(x=>!x.hidden).map(x=>x.dataset.route)),['meuespaco','inicio','comunicacao','recados','cronograma','registros','atendimentos','socioambiental','obras','contatos','fechamento','ajuda']);
  await p.waitForFunction(()=>document.querySelector('.nav-item[data-route=recados] .nav-badge')?.textContent==='1');
  assert.match(await p.locator('.today-hello').textContent(),/coisas para olhar/);
  assert.equal(await p.locator('.today-block').count(),5);assert.equal(await p.locator('.today-step').first().textContent(),'1');
  // Lembrete atrasado e de hoje: marcar feito.
  assert.equal(await p.locator('.today-block').nth(1).locator('.today-row').count(),2);
  await p.locator('.today-block').nth(1).locator('[data-lem-feito]').first().click();await toast(/Feito!/);
  await p.waitForFunction(()=>document.querySelectorAll('.today-block')[1]?.querySelectorAll('.today-row').length===1);
  // Ação da semana → "Precisa de material?" cria lembrete ligado à atividade.
  await p.locator('[data-lem-evento]').first().click();await p.locator('#lemForm').waitFor();
  assert.equal(await p.locator('#lemForm [name=tipo]:checked').getAttribute('value'),'material');assert.match(await p.locator('#lemForm').textContent(),/Sensibilização com moradores/);
  await p.locator('#lemForm [name=material]').fill('Banner e 100 panfletos');await p.locator('#lemForm [type=submit]').click();await toast(/Lembrete salvo/);
  // Recado: abrir marca como lido, responder e resolver.
  await p.locator('.nav-item[data-route=recados]').click();await p.locator('.simple-row.is-new').waitFor();
  await p.locator('.simple-row.is-new').click();await p.locator('#recResposta').waitFor();
  assert.match(await p.locator('#detailContent').textContent(),/Oficina de horta/);
  await p.waitForFunction(()=>!document.querySelector('.nav-item[data-route=recados] .nav-badge'));
  await p.locator('#recResposta [name=texto]').fill('Separo hoje à tarde.');await p.locator('#recResposta [type=submit]').click();await toast(/Feito/);
  assert.match(await p.locator('#detailContent').textContent(),/Separo hoje à tarde/);
  await p.locator('[data-rec-situacao=resolver]').click();await p.waitForFunction(()=>document.querySelector('[data-rec-situacao=reabrir]'));await p.locator('#closeDialog').click();
  // Novo recado exige destinatário.
  await p.locator('[data-rec-novo]').first().click();await p.locator('#recForm').waitFor();
  await p.locator('#recForm [name=assunto]').fill('Teste');await p.locator('#recForm [name=texto]').fill('Mensagem');await p.locator('#recForm [type=submit]').click();
  await p.waitForFunction(()=>/Escolha para quem/.test(document.querySelector('#recErro').textContent));
  await p.locator('#recForm [name=frente][value=socioambiental]').check();await p.locator('#recForm [type=submit]').click();await toast(/Recado enviado/);
  assert.equal(await p.locator('[data-rec-aba=enviados]').getAttribute('aria-selected'),'true');
  // Materiais: concluir com alcance entra no mês.
  await p.locator('.nav-item[data-route=comunicacao]').click();await p.locator('[data-com-aba=materiais]').first().click();await p.locator('.month-strip').waitFor();
  assert.match(await p.locator('.month-strip').textContent(),/Publicações1/);
  await p.locator('[data-mat-concluir]').first().click();await p.locator('#matForm').waitFor();
  await p.locator('#matForm [name=alcance]').fill('1200');await p.locator('#matForm [name=publicadoEm]').fill('2026-09-20');await p.locator('#matForm [type=submit]').click();await toast(/concluído/);
  await p.waitForFunction(()=>/Publicações2/.test(document.querySelector('.month-strip')?.textContent));assert.match(await p.locator('.month-strip').textContent(),/6\.200/);
  await p.locator('#matBusca').fill('vídeo');assert.equal(await p.evaluate(()=>document.activeElement.id),'matBusca');
  await p.locator('[data-mat-filtro=mes]').click();assert.equal(await p.locator('.material').count(),1);
  // Galeria: escolher, baixar, enviar foto.
  await p.locator('[data-com-aba=galeria]').click();await p.locator('.photo').first().waitFor();
  assert.equal(await p.locator('.photo').count(),24);await p.locator('[data-gal-mais]').click();assert.equal(await p.locator('.photo').count(),30);
  await p.locator('[data-gal-marcar]').nth(0).check();await p.locator('[data-gal-marcar]').nth(1).check();assert.equal(await p.locator('#galSel').textContent(),'2');
  const [dl]=await Promise.all([p.waitForEvent('download'),p.locator('[data-gal-baixar]').click()]);assert.match(dl.suggestedFilename(),/^Fotos 2026-09\.zip$/);
  await p.locator('[data-gal-enviar]').first().click();await p.locator('#galForm').waitFor();
  await p.setInputFiles('#galForm [name=arquivos]',png);await p.locator('#galForm [name=atividade]').fill('Oficina de horta');await p.locator('#galForm [type=submit]').click();
  await toast(/Foto guardada/);
  // Contatos: cadastrar, registrar conversa, filtro mantém o foco.
  await p.locator('.nav-item[data-route=contatos]').click();await p.locator('.contact-card').first().waitFor();
  await p.locator('[data-con-novo]').click();await p.locator('#conForm').waitFor();
  await p.locator('#conForm [name=nome]').fill('Jornalista de exemplo');await p.selectOption('#conForm [name=tipo]','Imprensa');await p.locator('#conForm [name=telefone]').fill('(11) 98888-7777');
  await p.locator('#conForm [type=submit]').click();await toast(/Contato salvo/);assert.equal(await p.locator('.contact-card').count(),2);
  assert.ok(await p.locator('.contact-card',{hasText:'Jornalista'}).locator('a[href^="https://wa.me/55"]').count());
  await p.locator('#conFiltro [name=busca]').fill('horta');assert.equal(await p.locator('.contact-card').count(),1);assert.equal(await p.evaluate(()=>document.activeElement.name),'busca');
  await p.locator('[data-con-abrir]').click();await p.locator('#conConversa [name=texto]').fill('Confirmou a oficina.');await p.locator('#conConversa [type=submit]').click();await toast(/Conversa registrada/);
  assert.match(await p.locator('#detailContent').textContent(),/Confirmou a oficina/);await p.locator('#closeDialog').click();
  // Celular: sem rolagem lateral.
  await p.setViewportSize({width:390,height:844});
  for(const aba of ['hoje','galeria','lembretes']){await p.evaluate(()=>document.querySelector('.nav-item[data-route=comunicacao]').click());await p.locator('.com-tabs').waitFor();await p.locator('[data-com-aba='+aba+']').click();await p.waitForTimeout(400);
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'sem rolagem lateral: '+aba);}
  // Social vê lembretes (rota própria), não a Comunicação.
  await p.setViewportSize({width:1366,height:900});await p.goto('file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+'?perfil=socioambiental&latencia=20');await p.locator('.welcome-pets').waitFor();
  assert.equal(await p.locator('.nav-item[data-route=comunicacao]').isHidden(),true);await p.locator('.nav-item[data-route=lembretes]').click();await p.locator('.reminder').first().waitFor();
  assert.equal(await p.locator('.com-tabs').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: Comunicação (entra pelo Meu espaço) com "Hoje" (5 blocos numerados, aviso de recado), lembrete feito e criado a partir da ação da semana, recado lido/respondido/resolvido e novo recado validado, material concluído entra no mês, galeria (mais, escolher, baixar .zip, enviar foto), contatos (cadastro, WhatsApp, conversa, filtro com foco), celular sem rolagem e Social com lembretes.');
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
