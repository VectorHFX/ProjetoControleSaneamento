// Saber mais (2.19) na prévia: balão "Você sabia?", pergunta do dia e quiz da semana. node app/testes/quiz_ui.cjs  (FOTOS=pasta salva capturas)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png'),fullPage:true});};
  const toast=async re=>p.waitForFunction(r=>new RegExp(r).test(document.querySelector('#toast').textContent),re.source);
  // Período de testes: a equipe não vê nada do quiz.
  await p.goto(url('?perfil=atendimento&latencia=20'));await p.locator('.welcome-pets').waitFor();await p.locator('[data-esp-especie=pato]').click();await p.locator('#espInicio [type=submit]').click();await p.locator('.mascot-stage').waitFor();
  assert.equal(await p.locator('.home-saber, .saber-balao').count(),0,'equipe não vê o quiz durante os testes');
  // Proprietário.
  await p.evaluate(()=>{delete window.CPT_ESP;});await p.goto(url('?latencia=20'));await p.locator('.nav-item[data-route=meuespaco]').first().click();
  await p.locator('.welcome-pets').waitFor();await p.locator('[data-esp-especie=urso]').click();await p.locator('#espInicio [type=submit]').click();await p.locator('.mascot-stage').waitFor();
  await p.locator('.saber-balao').waitFor();assert.match(await p.locator('.saber-balao').textContent(),/Você sabia\?[\s\S]*Fonte:/);assert.equal(await p.locator('.saber-balao a[target=_blank][rel=noopener]').count(),1);
  assert.equal(await p.locator('.saber-balao .saber-revisar').count(),1,'marca "a revisar" para o proprietário');
  assert.match(await p.locator('.home-saber .saber-mes').textContent(),/(Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)/);
  assert.equal(await p.locator('#quizDia .quiz-opcao').count(),4);assert.match(await p.locator('.space-hero .mascot-art').innerHTML(),/pensativo|class="[^"]*chibi/,'mascote presente');
  await foto('saber-1-inicio');
  // Pergunta do dia: responde a primeira alternativa; a certa aparece e as opções travam.
  const antes=Number((await p.locator('#espPontos').textContent()).replace(/\D/g,''));
  await p.locator('#quizDia .quiz-opcao').first().click();await toast(/Acertou|Quase/);
  await p.locator('#quizDia .quiz-resultado').waitFor();assert.equal(await p.locator('#quizDia .quiz-opcao.is-certa').count(),1);assert.equal(await p.locator('#quizDia .quiz-opcao:not([disabled])').count(),0);
  const ok=await p.locator('#quizDia .quiz-resultado.is-ok').count();assert.equal(Number((await p.locator('#espPontos').textContent()).replace(/\D/g,'')),antes+(ok?2:0));
  await foto('saber-2-dia');
  // Quiz da semana: 5 perguntas em sequência, placar no fim.
  await p.locator('[data-quiz-semana]').click();await p.locator('#detailDialog[open] .quiz-opcao').first().waitFor();assert.match(await p.locator('#detailTitle').textContent(),/Pergunta 1 de 5/);
  for(let i=0;i<5;i++){await p.locator('#detailDialog .quiz-opcao:not([disabled])').nth(i%4).click();await p.locator('#detailDialog .quiz-resultado').waitFor();if(i===0)await foto('saber-3-semana');if(i<4){await p.locator('[data-quiz-proxima]').click();await p.waitForFunction(n=>document.querySelector('#detailTitle').textContent.includes('Pergunta '+n),String(i+2));}}
  assert.match(await p.locator('#detailTitle').textContent(),/Resultado: \d de 5/);await p.locator('.quiz-placar').waitFor();assert.equal(await p.locator('.quiz-revisao .quiz-item').count(),5);
  await p.locator('#closeDialog').click();assert.match(await p.locator('.quiz-semana').textContent(),/Feito!/);assert.match(await p.locator('[data-quiz-semana]').textContent(),/Ver respostas/);
  // Celular: sem rolagem lateral, alternativas em uma coluna.
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(150);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'sem rolagem lateral no celular');
  await foto('saber-4-celular');
  assert.deepEqual(errors,[]);await b.close();
  console.log('PASS: Saber mais — só o proprietário nos testes, curiosidade com fonte e marca "a revisar", pergunta do dia trava e soma pontos, quiz da semana com 5 perguntas e placar, celular sem rolagem lateral.');
})().catch(e=>{console.error(e);process.exit(1);});
