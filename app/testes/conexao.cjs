const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
const context=await browser.newContext();
const source=fs.readFileSync(path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html'),'utf8');
const marker='<script>\n(() => {';
for(const mode of ['sucesso','negado','silencio','invalido','ponteAusente','sincrono','agendaAusente']){
 const page=await context.newPage();await page.clock.install();
 let s=source.replace(marker,`<script>
window.demoTransport=window.CPT_PREVIA;delete window.CPT_PREVIA;
window.google={script:{run:(function make(ok,bad){return new Proxy({}, {get:function(_,key){if(key==='withSuccessHandler')return function(f){return make(f,bad)};if(key==='withFailureHandler')return function(f){return make(ok,f)};return function(arg){
 if('${mode}'==='silencio')return;
 if('${mode}'==='sincrono')throw new Error('Falha de transporte simulada');
 if('${mode}'==='negado'){bad({message:'Esta conta não tem acesso à base Campo 4.0.'});return;}
 if('${mode}'==='invalido'){ok(null);return;}
 window.demoTransport.chamar(key,arg).then(ok,bad);
};}})})(null,null)}};
if('${mode}'==='ponteAusente')delete window.google;
</script>`+marker);
 if(mode==='agendaAusente')s=s.replace(/<script>\s*window.CPTAgenda\s*=[\s\S]*?<\/script>/,'');
 await page.setContent(s);await page.clock.fastForward(1000);
 if(mode==='sucesso'){await page.locator('.feature-tile').first().waitFor();assert.equal(await page.locator('#theme option').count(),2);assert.equal(await page.locator('#bootError').count(),0);assert(!/Conectando|Consultando/.test(await page.locator('#accountLabel').textContent()));}
 else if(mode==='agendaAusente'){await page.locator('#bootError').waitFor();assert((await page.locator('#bootMessage').textContent()).includes('Agenda.html'));}
 else {if(mode==='silencio')await page.clock.fastForward(51000);assert.equal(await page.locator('#accountLabel').textContent(),'Conexão não concluída');assert(await page.locator('[data-action=retry-home]').isVisible());}
 await page.close();console.log('PASS conexão: '+mode);
}
await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
