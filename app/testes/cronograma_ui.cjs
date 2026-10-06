// Cronograma 2.28 na prévia: feriados, cartões coloridos e compactos, fim de semana estreito, planilha .xlsx e impressão. node app/testes/cronograma_ui.cjs
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),path=require('path'),fs=require('fs'),os=require('os'),{execFileSync}=require('child_process'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined});const p=await b.newPage({viewport:{width:1366,height:900},acceptDownloads:true});const erros=[];p.on('pageerror',e=>erros.push(e.message));
  const out=process.env.SHOTS;
  await p.goto('file://'+path.resolve(__dirname,'../previa/CPT_Previa_1_2_1.html'));await p.locator('#roleView option[value=administrativo]').waitFor({state:'attached'});
  // Feriados calculados: fixos, Páscoa móvel (Sexta-feira Santa, Carnaval, Corpus Christi) e Santo André.
  const f=await p.evaluate(()=>[window.CPTAgenda.feriados(2026),window.CPTAgenda.feriados(2025)]);
  assert.equal(f[0]['2026-10-12'].nome,'Nossa Senhora Aparecida');assert.equal(f[0]['2026-04-03'].nome,'Sexta-feira Santa');assert.equal(f[0]['2026-02-16'].tipo,'facultativo');assert.equal(f[0]['2026-06-04'].nome,'Corpus Christi');
  assert.equal(f[0]['2026-04-08'].tipo,'municipal');assert.equal(f[0]['2026-07-09'].tipo,'estadual');assert.equal(f[0]['2026-11-20'].tipo,'nacional');assert.equal(f[1]['2025-04-18'].nome,'Sexta-feira Santa');assert.equal(f[1]['2025-06-19'].nome,'Corpus Christi');
  // 2.29: o Cronograma fica dentro da Visão do mês (aba).
  await p.locator('.nav-item[data-route=inicio]').click();await p.locator('[data-painel-aba=cronograma]').first().click();await p.locator('.calendar-grid').waitFor();
  assert.equal(await p.locator('.nav-item.active').getAttribute('data-route'),'inicio','no menu, a Visão do mês fica marcada');assert.equal(await p.locator('[data-painel-aba=cronograma]').getAttribute('aria-selected'),'true');
  await p.locator('#month').fill('2026-10');await p.locator('#month').dispatchEvent('change');
  await p.locator('.calendar-cell.holiday').first().waitFor();
  assert.match(await p.locator('.calendar-cell.holiday').first().textContent(),/^12[\s\S]*Nossa Senhora Aparecida/);
  // Sábado e domingo mais estreitos que os dias úteis.
  const larg=await p.$$eval('.calendar-grid .weekday',l=>l.map(x=>x.getBoundingClientRect().width));assert(larg[5]<larg[0]*0.75&&larg[6]<larg[0]*0.75,'fim de semana estreito: '+larg);
  // Cartão compacto e colorido: título em até 2 linhas, nomes curtos.
  const ev=p.locator('.calendar-event').first();await ev.waitFor();
  const est=await ev.evaluate(e=>({bg:getComputedStyle(e).backgroundColor,clamp:getComputedStyle(e.querySelector('strong')).webkitLineClamp}));assert.equal(est.clamp,'2');assert.notEqual(est.bg,'rgba(0, 0, 0, 0)');
  if(out)await p.screenshot({path:out+'/cronograma.png',fullPage:true});
  // Lista: o feriado aparece entre as atividades.
  await p.locator('[data-agenda-mode=lista]').click();await p.locator('.agenda-list-row.is-holiday',{hasText:'Nossa Senhora Aparecida'}).waitFor();await p.locator('[data-agenda-mode=mes]').click();
  // Exportar: planilha .xlsx com Calendário e Atividades.
  await p.locator('[data-agenda-action=select]').click();await p.locator('[data-agenda-action=export]').click();
  const [down]=await Promise.all([p.waitForEvent('download'),p.locator('[data-agenda-action=xlsx]').click()]);
  assert.match(down.suggestedFilename(),/^Cronograma_CPT_2026-10\.xlsx$/);const arq=path.join(os.tmpdir(),'cpt_cronograma_teste.xlsx');await down.saveAs(arq);
  const conf=execFileSync('python3',['-c',`
import sys,zipfile,xml.dom.minidom,openpyxl
z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None
for n in z.namelist(): xml.dom.minidom.parseString(z.read(n))
wb=openpyxl.load_workbook(sys.argv[1]);print(wb.sheetnames)
c=wb['Calendário'];a=wb['Atividades']
print(c['A1'].value);print(a['A1'].value,a['E1'].value,a.max_row,a.freeze_panes,a.auto_filter.ref)
print(a['A2'].number_format,a['A2'].value.date() if a['A2'].value else None)
print(any('Nossa Senhora Aparecida' in str(x.value or '') for row in c.iter_rows() for x in row))
`,arq]).toString();
  assert.match(conf,/\['Calendário', 'Atividades'\]/);assert.match(conf,/Cronograma CPT · outubro de 2026/);assert.match(conf,/Data Atividade \d+ A2 A1:L\d+/);assert.match(conf,/dd\/mm\/yyyy 2026-10-\d\d/);assert.match(conf,/\nTrue/);
  // Impressão: calendário na 1ª página e descrição depois, com a coluna de data larga.
  await p.evaluate(()=>{window.print=()=>{window.__imprimiu=true;};});/* o diálogo continua aberto depois de baixar */await p.locator('[data-agenda-action=print]').click();
  assert(await p.evaluate(()=>window.__imprimiu));assert.equal(await p.locator('#printAgenda .pa-cal tbody tr').count()>=5,true);assert.match(await p.locator('#printAgenda .pa-cal').textContent(),/Nossa Senhora Aparecida/);
  assert(await p.locator('#printAgenda .pa-tab tbody tr').count()>=1);assert.match(await p.locator('#printAgenda .pa-data').first().textContent(),/\d\d\/10\/2026(segunda|terça|quarta|quinta|sexta|sábado|domingo)/);
  if(out)await p.pdf({path:out+'/cronograma.pdf',landscape:true,printBackground:true});
  await p.emulateMedia({media:'print'});const w=await p.locator('#printAgenda .pa-data').first().evaluate(e=>e.getBoundingClientRect().width);const wb=await p.locator('#printAgenda .pa-data b').first().evaluate(e=>e.getBoundingClientRect().height);assert(wb<20,'data em uma linha só');await p.emulateMedia({media:'screen'});
  // 2.32: Nova atividade simples — o essencial na frente; "Dia todo" esconde os horários; o resto em "Mais detalhes".
  await p.evaluate(()=>{const d=document.querySelector('#detailDialog');if(d.open)d.close();});await p.locator('[data-agenda-action=new]').click();await p.locator('#eventForm').waitFor();
  assert.equal(await p.locator('#eventForm [name=diaTodo]').isChecked(),true);assert.equal(await p.locator('#eventForm [name=inicio]').isVisible(),false,'dia todo esconde os horários');
  assert.equal(await p.locator('#eventForm details.mais-detalhes').getAttribute('open'),null);assert.equal(await p.locator('#eventForm [name=natureza]').isVisible(),false);assert.equal(await p.locator('#eventForm [name=motivo]').count(),0,'motivo só ao editar');assert.equal(await p.locator('#eventForm [name=status] option[value=cancelada]').count(),0,'atividade nova não nasce cancelada (pediria motivo)');
  await p.locator('#eventForm [name=diaTodo]').uncheck();assert.equal(await p.locator('#eventForm [name=inicio]').isVisible(),true);await p.locator('#eventForm [name=inicio]').fill('09:30');await p.locator('#eventForm [name=fim]').fill('11:00');
  await p.locator('#eventForm [name=titulo]').fill('Roda de conversa na escola');await p.locator('#eventForm [name=data]').fill('2026-10-21');await p.locator('#saveEvent').click();
  await p.locator('.calendar-event',{hasText:'Roda de conversa na escola'}).waitFor();assert.match(await p.locator('.calendar-event',{hasText:'Roda de conversa na escola'}).textContent(),/09:30/);
  await p.locator('.calendar-event',{hasText:'Roda de conversa na escola'}).locator('[data-agenda-id]').click();await p.locator('[data-agenda-action=edit]').click();await p.locator('#eventForm [name=motivo]').waitFor();assert.equal(await p.locator('#eventForm [name=diaTodo]').isChecked(),false);assert.equal(await p.locator('#eventForm [name=status] option[value=cancelada]').count(),1);
    assert.deepEqual(erros,[]);await b.close();console.log('PASS: Cronograma — Nova atividade simples (dia todo, mais detalhes, motivo só ao editar), feriados (fixos, Páscoa e Santo André) no calendário e na lista, cartões coloridos de 2 linhas, sábado e domingo estreitos, planilha .xlsx válida (Calendário + Atividades com filtro e data) e impressão com calendário + descrição (data em uma linha, '+Math.round(w)+'px).');
})().catch(e=>{console.error(e);process.exit(1);});
