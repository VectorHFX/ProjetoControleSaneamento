// Levantamento de traçado (2.33) na prévia, no tamanho de celular: obra digitada, bairro da obra, casa salva na hora,
// aviso de casa repetida, fila guardada no celular sem internet (e enviada sozinha depois), duplicada do servidor com
// "Atualizar com o novo", resultados por obra e por rua e planilha .xlsx válida. node app/testes/levantamento_ui.cjs
const {chromium}=require('playwright'),assert=require('assert'),path=require('path'),fs=require('fs'),os=require('os'),{execFileSync}=require('child_process');
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/cpt-chromium',args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process']});
  const p=await b.newPage({viewport:{width:390,height:844},acceptDownloads:true});const erros=[];p.on('pageerror',e=>erros.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const url='file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html')+'?liberada=1&perfil=socioambiental&latencia=20';
  const abrir=async()=>{await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});await p.waitForFunction(()=>window.CPTLevantamento&&document.querySelector('.nav-item[data-route=levantamento]')&&!document.querySelector('.nav-item[data-route=levantamento]').hidden);
    await p.evaluate(()=>document.querySelector('.nav-item[data-route=levantamento]').click());};
  const fila=()=>p.evaluate(()=>{const k=Object.keys(localStorage).find(x=>x.startsWith('cpt.lev.v1.'));return k?JSON.parse(localStorage.getItem(k)).fila.length:0;});
  const casa=async(rua,numero,resultado)=>{const f=p.locator('#levForm');if(rua!=null)await f.locator('[name=rua]').fill(rua);await f.locator('[name=numero]').fill(numero);
    await f.locator('.chip-opcao',{hasText:resultado}).click();await f.locator('.lev-salvar').click();};
  await p.goto(url);await abrir();

  // 1. Começo: obra pela busca; o bairro vem da obra (duas opções nesta obra).
  await p.locator('#levBusca').waitFor();await p.locator('#levBusca').fill('carij');
  await p.locator('[data-lev-obra="OBR-0117"]').click();await p.locator('#levForm').waitFor();
  assert.equal(await p.locator('[name=levBairro]').count(),2,'obra com dois bairros: escolha em um toque');
  await p.locator('.lev-sessao .chip-opcao',{hasText:'Vila Linda'}).click();
  // 2. Casa repetida (já está no levantamento): avisa e o botão vira "Atualizar casa"; trocar o número tira o aviso.
  await p.locator('#levForm [name=rua]').fill('rua das  flores');await p.locator('#levForm [name=numero]').fill('10');
  assert.equal(await p.locator('#levDup').isVisible(),true,'aviso de casa já levantada (sem acento/caixa/espaço)');assert.equal(await p.locator('.lev-salvar').textContent(),'Atualizar casa');
  await p.locator('#levForm [name=numero]').fill('14');assert.equal(await p.locator('#levDup').isVisible(),false);assert.equal(await p.locator('.lev-salvar').textContent(),'Salvar casa');
  // 3. Sem resultado não salva (mensagem curta, sem passos a mais).
  await p.locator('#levForm [name=rua]').fill('Rua das Flores');await p.locator('.lev-salvar').click();assert.match(await p.locator('#levErro').textContent(),/resultado/);
  // 4. Salva: número limpa, rua fica, vai sozinha para a planilha.
  await p.locator('#levForm .chip-opcao',{hasText:'Comunicado'}).click();await p.locator('.lev-salvar').click();
  assert.equal(await p.locator('#levForm [name=numero]').inputValue(),'');assert.equal(await p.locator('#levForm [name=rua]').inputValue(),'Rua das Flores');
  await p.waitForFunction(()=>/Tudo enviado/.test((document.getElementById('levStatus')||{}).textContent||''));
  assert.equal(await p.evaluate(()=>window.CPT_LEV.itens.some(c=>c.numero==='14'&&c.bairro==='Vila Linda'&&c.resultado==='Comunicado')),true,'casa chegou com o bairro escolhido');
  assert.match(await p.locator('.lev-recentes').textContent(),/Rua das Flores, 14[\s\S]*enviada/);
  // 5. Sem internet: as casas ficam guardadas no celular e o status avisa.
  await p.evaluate(()=>{window.CPT_PREVIA.semRede=true;});
  await casa(null,'16','Contato com morador');await casa(null,'18','Comunicado');
  await p.waitForFunction(()=>/aguardando|guardadas/.test(document.getElementById('levStatus').textContent));
  assert.equal(await fila(),2,'duas casas guardadas no celular');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=390),true,'sem rolagem lateral no celular');
  if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,'lev-campo.png'),fullPage:true});
  // 6. Reabre com internet: a fila vai sozinha, sem tocar em nada.
  await p.goto(url);await p.locator('#navigation .nav-item').first().waitFor({state:'attached'});
  await p.waitForFunction(()=>window.CPT_LEV&&window.CPT_LEV.itens.some(c=>c.numero==='16')&&window.CPT_LEV.itens.some(c=>c.numero==='18'),null,{timeout:15000});
  await p.waitForFunction(()=>{const k=Object.keys(localStorage).find(x=>x.startsWith('cpt.lev.v1.'));return k&&JSON.parse(localStorage.getItem(k)).fila.length===0;});
  // 7. Outra pessoa levantou a mesma casa enquanto isso: o servidor devolve "duplicada" e a casa pede uma decisão.
  await abrir();await p.locator('#levForm').waitFor();
  await p.evaluate(()=>window.CPT_LEV.itens.push({id:'LEV-x',obraId:'OBR-0117',obra:'Viela Carijós',bairro:'Vila Linda',rua:'Rua das Flores',numero:'20',tipo:'Residencial',imovel:'Casa',resultado:'Comunicado',observacao:'',visitadaEm:'2026-10-06T12:00:00Z',nome:'Colega',atualizadoEm:''}));
  await casa('Rua das Flores','20','Contato com morador');
  await p.locator('.lev-atencao [data-lev-atualizar]').waitFor();assert.match(await p.locator('.lev-atencao').textContent(),/Colega/);
  await p.locator('.lev-atencao [data-lev-atualizar]').click();
  await p.waitForFunction(()=>window.CPT_LEV.itens.find(c=>c.numero==='20').resultado==='Contato com morador');
  await p.waitForFunction(()=>!document.querySelector('.lev-atencao'));
  // 8. Resultados: por rua (obra da sessão) e por obra; planilha com duas abas.
  await p.locator('[data-lev-parte=resultados]').click();await p.locator('.lev-tabela').waitFor();
  const linha=await p.locator('.lev-tabela tbody tr',{hasText:'Rua das Flores'}).textContent();// A prévia recomeça o servidor de mentira ao recarregar: ficam 10 e 12 (exemplo), 16 e 18 (da fila) e 20 (atualizada).
  assert.match(linha,/Rua das Flores\s*5\s*2\s*3\s*4\s*1\s*0/,'5 casas: 2 comunicado, 3 contato; 4 residenciais e 1 comercial ('+linha+')');
  await p.selectOption('#levVer','');assert.match(await p.locator('.lev-tabela thead').textContent(),/Obra/);
  await p.selectOption('#levVer','OBR-0117');
  const [dl]=await Promise.all([p.waitForEvent('download'),p.locator('[data-lev-xlsx]').click()]);
  const arq=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'lev-')),dl.suggestedFilename());await dl.saveAs(arq);assert.match(dl.suggestedFilename(),/^Levantamento_Viela_Carijos\.xlsx$/);
  const conf=execFileSync('python3',['-I','-c',"import sys,zipfile,xml.dom.minidom as m;z=zipfile.ZipFile(sys.argv[1]);[m.parseString(z.read(n)) for n in z.namelist() if n.endswith('.xml') or n.endswith('.rels')];w=z.read('xl/workbook.xml').decode();s=z.read('xl/worksheets/sheet2.xml').decode();print(w.count('<sheet '),'Por rua' in w,'Rua das Flores' in s,s.count('<row '))",arq]).toString().trim();
  assert.equal(conf,'2 True True 8','xlsx: 2 abas, XML válido, 5 casas + título/subtítulo/cabeçalho ('+conf+')');
  if(process.env.FOTOS)await p.screenshot({path:path.join(process.env.FOTOS,'lev-resultados.png'),fullPage:true});
  assert.deepEqual(erros,[]);await b.close();
  console.log('PASS: Levantamento de traçado — obra pela busca com bairro da obra, aviso de casa repetida, casa salva e enviada sozinha, fila guardada sem internet e enviada ao reabrir, duplicada do servidor resolvida com "Atualizar com o novo", resultados por rua e por obra, planilha .xlsx com 2 abas válidas, sem rolagem lateral no celular.');
})().catch(e=>{console.error(e);process.exit(1);});
