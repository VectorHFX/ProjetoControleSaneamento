/** API de operação da base. O web app definitivo terá projeto/interface próprios. */
function c5Autor_(){const email=Session.getActiveUser().getEmail().toLowerCase(),p=c5Props_(),allowed=[p.getProperty('C5_OWNER')].concat(JSON.parse(p.getProperty('C5_EDITORES')||'[]')).filter(Boolean).map(x=>x.toLowerCase());if(!email||!allowed.includes(email))throw Error('Seu acesso ainda não está habilitado. Solicite acesso ao administrador.');return email;}
function c5Mes_(m){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(m)))throw Error('Mês inválido. Use AAAA-MM.');return m;}
function c5Cadastros_(){return c5Ler_(c5Tabela_(C5.cadastros,C5H.cadastros)).map((r,i)=>({id:r[0],tipo:r[1],obra:r[2],dia:r[3],revisao:Number(r[4]),atualizado:r[5] instanceof Date?r[5].toISOString():r[5],autor:r[6],dados:JSON.parse(r[7]),pedido:r[8],linha:i+2}));}
function c5ValidarLote_(p,obras){
  if(!['tracado','comunicado'].includes(p.tipo))throw Error('Escolha traçado ou comunicado.');
  if(!obras.some(o=>o.id===p.obra&&o.tipo==='obra'))throw Error('Cadastre e selecione a obra.');
  if(!Array.isArray(p.itens)||!p.itens.length||p.itens.length>100)throw Error('Envie de 1 a 100 imóveis por lote.');
  const seen=new Set();return p.itens.map((x,i)=>{
    const v={logradouro:c5Texto_(x.logradouro),numero:c5Texto_(x.numero),complemento:c5Texto_(x.complemento),classificacao:c5Texto_(x.classificacao),dia:c5Dia_(x.dia)};
    if(!v.logradouro||!v.numero||!v.classificacao||!v.dia)throw Error('Linha '+(i+1)+': informe logradouro, número (ou S/N), tipo/abordagem e data válida.');
    if(Object.values(v).some(s=>s.length>250))throw Error('Linha '+(i+1)+': campo maior que 250 caracteres.');
    const key=c5Hash_([p.tipo,p.obra,c5Norm_(v.logradouro),c5Norm_(v.numero),c5Norm_(v.complemento),c5Norm_(v.classificacao),v.dia]);
    if(seen.has(key))throw Error('Linha '+(i+1)+' repetida no lote.');seen.add(key);return {id:p.tipo.slice(0,3).toUpperCase()+'-'+key.slice(0,24),v};
  });
}
function campo5SalvarObra(p){c5Autor_();return c5ComTrava_(()=>{
  if(!p||!c5Texto_(p.titulo)||!c5Texto_(p.bairro)||!c5Texto_(p.endereco))throw Error('Informe título, bairro e endereço da obra.');
  const all=c5Cadastros_(), old=p.id?all.find(x=>x.id===p.id&&x.tipo==='obra'):null;
  if(p.id&&!old)throw Error('Obra não encontrada.');if(old&&old.revisao!==Number(p.revisao))throw Error('Outra pessoa atualizou esta obra. Reabra antes de salvar.');
  const dados={titulo:c5Texto_(p.titulo),bairro:c5Texto_(p.bairro),endereco:c5Texto_(p.endereco),ct:c5Texto_(p.ct),status:c5Texto_(p.status)||'Em andamento',responsavel:c5Texto_(p.responsavel),inicio:p.inicio?c5Dia_(p.inicio):'',termino:p.termino?c5Dia_(p.termino):''};
  if(p.inicio&&!dados.inicio||p.termino&&!dados.termino)throw Error('Data da obra inválida.');if(Object.values(dados).some(v=>v.length>500))throw Error('Campo longo demais.');
  const id=old?old.id:'OBR-'+Utilities.getUuid(),r=[id,'obra',id,'',old?old.revisao+1:1,new Date(),c5Autor_(),JSON.stringify(dados),''];
  const s=c5Tabela_(C5.cadastros,C5H.cadastros);if(old)s.getRange(old.linha,1,1,r.length).setValues([r]);else c5Append_(s,[r]);return {id,revisao:r[4]};
});}
function campo5SalvarLote(p){const autor=c5Autor_();return c5ComTrava_(()=>{
  const all=c5Cadastros_(), itens=c5ValidarLote_(p,all), existing=new Set(all.filter(x=>x.tipo===p.tipo&&x.obra===p.obra).map(x=>c5ValidarLote_({tipo:x.tipo,obra:x.obra,itens:[x.dados]},all)[0].id)),rows=[];
  itens.forEach(x=>{if(!existing.has(x.id))rows.push([x.id,p.tipo,p.obra,x.v.dia,1,new Date(),autor,JSON.stringify(x.v),c5Texto_(p.pedido).slice(0,100)]);});
  c5Append_(c5Tabela_(C5.cadastros,C5H.cadastros),rows);return {salvos:rows.length,jaExistiam:itens.length-rows.length};
});}
function campo5ConsultarCadastros(p){c5Autor_();const tipo=p.tipo,obra=p.obra,mes=c5Mes_(p.mes),offset=Math.max(0,Number(p.offset)||0),rows=c5Cadastros_().filter(x=>x.tipo===tipo&&(!obra||x.obra===obra)&&x.dia.startsWith(mes));return {total:rows.length,itens:rows.slice(offset,offset+50),proximo:offset+50<rows.length?offset+50:null};}
function campo5CorrigirCadastro(p){const autor=c5Autor_();return c5ComTrava_(()=>{
  const all=c5Cadastros_(),old=all.find(x=>x.id===p.id&&['tracado','comunicado'].includes(x.tipo));if(!old)throw Error('Cadastro não encontrado.');if(old.revisao!==Number(p.revisao))throw Error('Cadastro alterado por outra pessoa. Consulte novamente.');
  const novo=c5ValidarLote_({tipo:old.tipo,obra:old.obra,itens:[p.dados]},all)[0];
  if(all.some(x=>x.id!==old.id&&x.tipo===old.tipo&&x.obra===old.obra&&c5Hash_(x.dados)===c5Hash_(novo.v)))throw Error('Já existe este imóvel/abordagem/data.');
  // ID é estável; correções não recriam a identidade.
  const r=[old.id,old.tipo,old.obra,novo.v.dia,old.revisao+1,new Date(),autor,JSON.stringify(novo.v),old.pedido];
  c5Tabela_(C5.cadastros,C5H.cadastros).getRange(old.linha,1,1,r.length).setValues([r]);return {id:old.id,revisao:r[4]};
});}
function c5Resumo_(mes,rows){
  const month=rows.filter(r=>r[3]===mes),relatos=month.filter(r=>c5Norm_(r[4])==='relato de atividade'&&c5Norm_(r[8])!=='atividade logistica interna');
  const valid=month.filter(r=>/pesquisa de satisfacao|cautelar/.test(c5Norm_(r[4]))).map(r=>r[16]).filter(n=>typeof n==='number'&&n>=0&&n<=10);
  return {mes,registros:month.length,acoes:relatos.length,participacoes:relatos.reduce((n,r)=>n+(typeof r[11]==='number'?r[11]:0),0),semPublico:relatos.filter(r=>r[11]==='').length,diagnosticos:month.filter(r=>c5Norm_(r[4])==='diagnostico de area').length,satisfacao:valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:null,amostra:valid.length,semData:rows.filter(r=>!r[2]).length};
}
function campo5Inicio(mes){c5Autor_();mes=c5Mes_(mes);const t=Date.now(),cad=c5Cadastros_(),fila=c5Ler_(c5Tabela_(C5.fila,C5H.fila)),cache=CacheService.getScriptCache(),key='C5_RESUMO_'+c5Props_().getProperty('C5_REV')+'_'+mes;let resumo;try{resumo=JSON.parse(cache.get(key)||'null');}catch(e){}if(!resumo){resumo=c5Resumo_(mes,c5Ler_(c5Tabela_(C5.indice,C5H.indice)));try{cache.put(key,JSON.stringify(resumo),120);}catch(e){console.warn('Resumo sem cache: '+e.message);}}return {resumo,obras:cad.filter(x=>x.tipo==='obra'),fila:fila.filter(r=>r[4]!=='OK').map(r=>({tipo:r[1],argumento:r[2],estado:r[4],tentativas:r[5],erro:r[9]})),cursor:Number(c5Props_().getProperty('C5_CURSOR')||1),leituraMs:Date.now()-t};}
function campo5SelecionarMes(mes){c5Autor_();c5Props_().setProperty('C5_MES',c5Mes_(mes));c5Enfileirar_('RELATORIO','');return {mensagem:'Relatório solicitado. A fila atualizará a página.'};}
function c5Relatorio_(mes){
  mes=c5Mes_(mes);return c5ComTrava_(()=>{const rows=c5Ler_(c5Tabela_(C5.indice,C5H.indice)),r=c5Resumo_(mes,rows),ss=c5SS_();let s=ss.getSheetByName('Relatório');if(!s)s=ss.insertSheet('Relatório');
  const dados=rows.filter(x=>x[3]===mes&&c5Norm_(x[4])==='relato de atividade'&&c5Norm_(x[8])!=='atividade logistica interna').sort((a,b)=>a[2].localeCompare(b[2]));
  s.getDataRange().breakApart().clearContent();s.getRange('A1:I2').merge().setValue('ATIVIDADES · '+mes).setBackground('#153F47').setFontColor('#FFFFFF').setFontSize(20);
  s.getRange('A3:I3').merge().setValue(r.acoes+' ações · '+r.participacoes+' participações · '+r.semPublico+' registros sem público informado. Participações não equivalem a pessoas únicas.').setWrap(true);
  s.getRange('A5:I5').setValues([['Bairro','Frente de serviço','Endereço','Data','Atividade','Ferramenta','Público-alvo','Total','ID fonte']]).setBackground('#D9EDF1').setFontWeight('bold');
  const out=dados.map(x=>[x[5],x[6],x[7],new Date(x[2]+'T12:00:00-03:00'),[x[8],x[9]].filter(Boolean).join(' — '),x[12],x[10],x[11],x[0]]);
  if(s.getMaxRows()<out.length+5)s.insertRowsAfter(s.getMaxRows(),out.length+5-s.getMaxRows());
  if(out.length){s.getRange(6,1,out.length,9).setValues(out.map(x=>x.map(c5Literal_))).setWrap(true).setVerticalAlignment('top');s.getRange(6,4,out.length,1).setNumberFormat('dd/MM/yyyy');s.setRowHeights(6,out.length,70);}
  s.setFrozenRows(5);s.setColumnWidths(1,9,155);s.setColumnWidth(3,235);s.setColumnWidth(5,260);s.getDataRange().setFontFamily('Arial');s.showSheet();return {linhas:out.length};});
}
function c5RdasDia_(dia){
  if(!c5Dia_(dia))throw Error('Dia do RDAS inválido.');const source=c5SS_().getSheetByName(C5.base),all=source.getDataRange().getValues(),m=c5Mapa_(all[0]);
  const selected=[all[0]].concat(all.slice(1).filter(r=>c5Dia_(c5Campo_(r,m,'Data de realização do procedimento'))===dia));
  const p=c5Props_(),hash=c5Hash_([selected,C5.versao,p.getProperty('C5_RDAS_FORCE_'+dia)]),key='C5_RDAS_'+dia;if(p.getProperty(key)===hash)return {linhas:0};
  const relatos=[],seen={};lerRelatosFonteRDAS_({historico:true,aba:{getName:()=>C5.base,getDataRange:()=>({getValues:()=>selected,getRichTextValues:()=>[]})}},C5.tz,relatos,seen);
  const group=consolidarRelatosPorDiaRDAS_(relatos,C5.tz)[0];if(!group)throw Error('Dia sem relatos: confira a ficha antiga antes de removê-la.');
  const ss=SpreadsheetApp.openById(C5.rdas),official=nomeAbaDiaRDAS_(group.data,C5.tz),old=ss.getSheetByName(official),tmp='_CPT preparando '+dia;
  let stale=ss.getSheetByName(tmp);if(stale)ss.deleteSheet(stale);group.nomeTemporario=tmp;
  const result=construirAbaDoDiaRDAS_(ss,group,C5.tz);SpreadsheetApp.flush();const ready=ss.getSheetByName(tmp);
  // A ficha anterior só é removida depois de a nova ter sido gerada e promovida.
  const archive='_CPT anterior '+dia+' '+Date.now();if(old)old.setName(archive);
  try{ready.setName(official);}catch(e){if(old)old.setName(official);throw e;}
  if(old)ss.deleteSheet(old);p.setProperty(key,hash);
  if(result.falhas)console.warn('RDAS '+dia+': '+result.falhas+' prévias sem imagem. Confira os links das fotos.');
  return {linhas:relatos.length,previasComFalha:result.falhas};
}
function campo5ReprocessarRdas(dia){c5Autor_();dia=c5Dia_(dia);if(!dia)throw Error('Informe uma data válida.');c5ComTrava_(()=>{c5Props_().setProperty('C5_RDAS_FORCE_'+dia,Utilities.getUuid());c5EnfileirarSemTrava_('RDAS',dia);});return {mensagem:'A ficha de '+dia+' entrou na fila de geração.'};}
/** Exportação revisável; não escreve em Indicadores 2026 nem substitui anexos existentes. */
function campo5ExportarImoveis(p){c5Autor_();const mes=c5Mes_(p.mes);if(!['tracado','comunicado'].includes(p.tipo))throw Error('Tipo inválido.');const all=c5Cadastros_(),obra=all.find(x=>x.id===p.obra&&x.tipo==='obra');if(!obra)throw Error('Obra inválida.');const rows=all.filter(x=>x.tipo===p.tipo&&x.obra===p.obra&&x.dia.startsWith(mes));if(!rows.length)throw Error('Sem imóveis neste filtro.');
  const nome=p.tipo==='tracado'?'Levantamento de Traçado':'Relação de imóveis comunicados';
  const ss=SpreadsheetApp.create(nome+' · '+obra.dados.titulo+' · '+mes),s=ss.getSheets()[0];s.setName(nome);ss.setSpreadsheetLocale('pt_BR');ss.setSpreadsheetTimeZone(C5.tz);
  s.getRange('A1:D2').merge().setValue(nome.toUpperCase()).setBackground('#153F47').setFontColor('#FFFFFF').setFontWeight('bold');
  s.getRange('A4:B4').setValues([['CONTRATO: 00725/24','MUNICÍPIO: Santo André']]);s.getRange('A6:D6').merge().setValue('FRENTE / CT: '+obra.dados.titulo+' / '+(obra.dados.ct||'Não informado'));
  s.getRange('A8:D8').setValues([['LOGRADOURO','Nº IMÓVEL',p.tipo==='tracado'?'TIPO DO IMÓVEL':'ABORDAGEM','DATA']]).setBackground('#D9EDF1').setFontWeight('bold');
  const out=rows.map(x=>[x.dados.logradouro,[x.dados.numero,x.dados.complemento].filter(Boolean).join(' · '),x.dados.classificacao,new Date(x.dia+'T12:00:00-03:00')]);if(out.length+8>s.getMaxRows())s.insertRowsAfter(s.getMaxRows(),out.length+8-s.getMaxRows());s.getRange(9,1,out.length,4).setValues(out.map(r=>r.map(c5Literal_))).setWrap(true);s.getRange(9,4,out.length,1).setNumberFormat('dd/MM/yyyy');s.setColumnWidth(1,350);s.setColumnWidths(2,3,170);s.setFrozenRows(8);s.getDataRange().setFontFamily('Arial');return {url:ss.getUrl(),linhas:rows.length};
}
function campo5Desempenho(){c5Autor_();const r=c5Ler_(c5Tabela_(C5.log,C5H.log)),groups={};r.forEach(x=>{if(!groups[x[1]])groups[x[1]]=[];groups[x[1]].push(x);});return Object.keys(groups).map(k=>{const a=groups[k],n=a.filter(x=>x[4]==='OK').map(x=>Number(x[2])).sort((x,y)=>x-y);return {operacao:k,amostras:a.length,falhas:a.filter(x=>x[4]!=='OK').length,mediana:n.length?n[Math.floor(n.length/2)]:null,p95:n.length?n[Math.ceil(n.length*.95)-1]:null};});}
/** Publicação explícita de quadros mensais na planilha oficial de Anexos.
 * Exclusivo das duas saídas abaixo. Indicadores e manifestações nunca são tocados.
 */
function c5QuadroAnexo_(p){
  const mes=c5Mes_(p.mes);if(!['tracado','comunicado'].includes(p.tipo))throw Error('Tipo inválido.');
  const all=c5Cadastros_(), obras=new Map(all.filter(x=>x.tipo==='obra').map(x=>[x.id,x.dados]));
  const rows=all.filter(x=>x.tipo===p.tipo&&x.dia.startsWith(mes)).sort((a,b)=>a.obra.localeCompare(b.obra)||a.dia.localeCompare(b.dia));
  if(!rows.length)throw Error('Nenhum imóvel para publicar neste mês.');
  const nome=p.tipo==='tracado'?'Levantamento de Traçado':'Relação de imóveis comunicados';
  const data=[[nome.toUpperCase(),'','',''],['MÊS: '+mes,'CONTRATO: 00725/24','MUNICÍPIO: Santo André',''],['','','','']];let last='';
  rows.forEach(x=>{const obra=obras.get(x.obra);if(!obra)throw Error('Obra não localizada: '+x.obra);if(last!==x.obra){if(last)data.push(['','','','']);data.push(['FRENTE / CT: '+obra.titulo+' / '+(obra.ct||'Não informado'),'','','']);data.push(['LOGRADOURO','Nº IMÓVEL',p.tipo==='tracado'?'TIPO DO IMÓVEL':'ABORDAGEM','DATA']);last=x.obra;}data.push([x.dados.logradouro,[x.dados.numero,x.dados.complemento].filter(Boolean).join(' · '),x.dados.classificacao,new Date(x.dia+'T12:00:00-03:00')]);});
  return {nome,data,registros:rows.length,obras:new Set(rows.map(x=>x.obra)).size,fingerprint:c5Hash_([data,rows.map(x=>[x.id,x.revisao])])};
}
function c5AssinaturaAnexo_(s){return s?c5Hash_([s.getDataRange().getValues(),s.getDataRange().getFormulas(),s.getRange('A1').getNote()]):'AUSENTE';}
function campo5PrepararPublicacao(p){const autor=c5Autor_(),q=c5QuadroAnexo_(p),ss=SpreadsheetApp.openById(C5.anexos),s=ss.getSheetByName(q.nome);if(s&&s.getRange('A1').getNote()!=='CPT_CAMPO5_SAIDA')throw Error('A aba oficial já existe e não pertence a esta automação. Use o quadro separado para revisão; nenhum conteúdo manual será substituído.');const token=Utilities.getUuid();CacheService.getUserCache().put('C5_PUB_'+token,JSON.stringify({autor,mes:p.mes,tipo:p.tipo,fonte:q.fingerprint,destino:c5AssinaturaAnexo_(s)}),600);return {token,aba:q.nome,registros:q.registros,obras:q.obras,existente:!!s,mes:p.mes};}
function campo5PublicarAnexo(token){const autor=c5Autor_();return c5ComTrava_(()=>{const cache=CacheService.getUserCache(),value=cache.get('C5_PUB_'+token);if(!value)throw Error('Prévia expirada. Confira novamente.');const p=JSON.parse(value);if(p.autor!==autor)throw Error('Prévia de outro usuário.');const q=c5QuadroAnexo_(p),ss=SpreadsheetApp.openById(C5.anexos);let s=ss.getSheetByName(q.nome);if(p.fonte!==q.fingerprint||p.destino!==c5AssinaturaAnexo_(s))throw Error('Os dados mudaram desde a prévia. Confira novamente.');
  let backup='';if(s){const copy=DriveApp.getFileById(C5.anexos).makeCopy('Anexos · antes da publicação '+new Date().toISOString());backup=copy.getUrl();}else{s=ss.insertSheet(q.nome);s.getRange('A1').setNote('CPT_CAMPO5_SAIDA');}
  const oldRows=s.getLastRow(),height=q.data.length;if(s.getMaxRows()<height)s.insertRowsAfter(s.getMaxRows(),height-s.getMaxRows());s.getDataRange().breakApart();
  s.getRange(1,1,height,4).setValues(q.data.map(r=>r.map(c5Literal_))).setWrap(true).setVerticalAlignment('top').setFontFamily('Arial');if(oldRows>height)s.getRange(height+1,1,oldRows-height,4).clearContent();
  s.getRange('A1:D1').setBackground('#153F47').setFontColor('#FFFFFF').setFontWeight('bold');s.getRange('A1').setNote('CPT_CAMPO5_SAIDA');s.getRange(1,4,height,1).setNumberFormat('dd/MM/yyyy');s.setColumnWidth(1,380);s.setColumnWidths(2,3,180);s.setFrozenRows(2);cache.remove('C5_PUB_'+token);return {url:ss.getUrl()+'#gid='+s.getSheetId(),backup,registros:q.registros};
});}
