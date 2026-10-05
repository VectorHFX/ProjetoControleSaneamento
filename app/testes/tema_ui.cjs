// Tema do mês (2.22) na prévia: opção "Mês" só para o proprietário nos testes, cores da campanha e preferência guardada. node app/testes/tema_ui.cjs  (FOTOS=pasta)
const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:1366,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const url=q=>'file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+q,foto=async n=>{if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,n+'.png')});};
  const mes=String(Number(new Intl.DateTimeFormat('en-US',{month:'numeric',timeZone:'America/Sao_Paulo'}).format(new Date())));
  // Equipe: sem a opção; quem tinha "mes" salvo volta ao Claro.
  await p.goto(url('?perfil=atendimento&latencia=20'));await p.evaluate(()=>localStorage.setItem('cpt.theme','mes'));await p.reload();await p.locator('#navigation').waitFor();await p.waitForFunction(()=>!document.documentElement.dataset.campanha);
  assert.equal(await p.locator('#theme option[value=mes]').count(),0,'equipe não vê o tema do mês nos testes');assert.equal(await p.evaluate(()=>localStorage.getItem('cpt.theme')),'light');
  // Proprietário: escolhe "Mês"; destaque muda; recarregar mantém sem piscar.
  await p.goto(url('?latencia=20'));await p.locator('#theme option[value=mes]').waitFor({state:'attached'});
  assert.equal(await p.locator('#theme option[value=mes]').textContent(),'Mês');assert.match(await p.locator('#theme option[value=mes]').getAttribute('title'),/campanha do mês: \S+ \S+/);
  const antes=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--blue').trim());
  await p.selectOption('#theme','mes');assert.equal(await p.evaluate(()=>document.documentElement.dataset.campanha),mes);
  const depois=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--blue').trim());assert.notEqual(depois,antes,'cor de destaque do mês');
  await p.waitForTimeout(400);await foto('tema-mes');
  await p.reload();assert.equal(await p.evaluate(()=>document.documentElement.dataset.campanha),mes,'aplicado já na abertura');await p.locator('#navigation').waitFor();assert.equal(await p.locator('#theme').inputValue(),'mes');
  // Voltar ao Escuro tira as cores do mês.
  await p.selectOption('#theme','dark');assert.equal(await p.evaluate(()=>[document.documentElement.dataset.theme,document.documentElement.dataset.campanha||''].join()),'dark,');
  await p.selectOption('#theme','light');
  assert.deepEqual(errors,[]);await b.close();
  console.log('PASS: tema do mês — opção só do proprietário nos testes (quem tinha salvo volta ao Claro), cores da campanha, mantido ao abrir, Escuro e Claro tiram as cores.');
})().catch(e=>{console.error(e);process.exit(1);});
