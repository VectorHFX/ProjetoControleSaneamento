const {chromium}=require('/opt/node-tools/node_modules/playwright'),path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--no-zygote','--single-process']});
const [w,h,suf]=[Number(process.argv[2]),Number(process.argv[3]),process.argv[4]];
const p=await b.newPage({viewport:{width:w,height:h}});await p.route(/fonts\.(googleapis|gstatic)\.com|drive\.google/,r=>r.abort());
await p.goto('file://'+path.resolve('app/previa/CPT_Previa_1_2_1.html')+'?latencia=20');await p.locator('#navigation .nav-item').first().waitFor();
await p.evaluate(()=>document.querySelector('.nav-item[data-route=inicio]').click());await p.waitForTimeout(1500);await p.screenshot({path:'/tmp/claude-0/-home-user-ProjetoControleSaneamento/e911b52e-fdf9-527f-b784-91095c5f97d8/scratchpad/inicio-'+suf+'.png'});
for(const r of ['meuespaco','fechamento','atendimentos']){await p.evaluate(r=>document.querySelector('.nav-item[data-route='+r+']').click(),r);await p.waitForTimeout(1500);await p.screenshot({path:'/tmp/claude-0/-home-user-ProjetoControleSaneamento/e911b52e-fdf9-527f-b784-91095c5f97d8/scratchpad/'+r+'-'+suf+'.png'});}
await b.close();})();
