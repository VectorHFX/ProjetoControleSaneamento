/** CPT: gerador de documentos 1.0. Requer Painel Territorial 1.1.
 * Cópias do modelo SABESP, PDF e Google Slides editáveis, sob demanda.
 * Sem gatilhos. Sem alteração de compartilhamento. Sem atendimentos.
 * A geração valida a estrutura do modelo antes de criar a ficha.
 */
const CPT_GD = Object.freeze({
 modelo:'1QT0ly_LVwYpl6CtYHadNKc-SQZflbSa7Lvp6avkrY4g',
 pasta:'1ZRxzA46y-G1g3fXzAG2jpBKSJAyQWt67',
 aba:'CPT Documentos Territoriais',versao:'1.0',
 cab:['Pedido','Diagnóstico ID','Assinatura da geração','Data','Estado','Documento','PDF','Apresentação','Avisos','Conteúdo da geração'],
 cores:{azul:'#083952',ciano:'#009FE3',petroleo:'#008A98',claro:'#F1F7FA',texto:'#16374D',cinza:'#526C7B'}
});
function cptGdCamposOficiais_(){return [
 ['frente',1,0,'FRENTE/CT'],['pvInicio',1,2,'PV INÍCIO'],['pvFim',1,4,'PV FIM'],
 ['metodo',2,0,'MÉTODO CONSTRUTIVO'],['extensao',2,2,'EXTENSÃO'],
 ['endereco',3,0,'RUA/AVENIDA'],['perfil',5,0,'PERFIL SOCIOECONÔMICO'],
 ['pavimento',6,0,'TIPO DO PAVIMENTO'],['condicao',7,0,'CONDIÇÃO DO PAVIMENTO'],
 ['impacto',8,0,'NÍVEL DE IMPACTO'],['impactos',9,0,'IMPACTOS IDENTIFICADOS'],
 ['veiculos',10,0,'TRÁFEGO DE VEÍCULOS'],['pedestres',11,0,'TRÁFEGO DE PEDESTRES'],
 ['residencias',12,0,'IMÓVEIS RESIDENCIAIS'],['comercios',13,0,'IMÓVEIS COMERCIAIS'],
 ['padrao',14,0,'PADRÃO CONSTRUTIVO'],['ipvs',15,0,'VULNERABILIDADE'],
 ['liderancas',16,0,'HOUVE IDENTIFICAÇÃO DE LIDERANÇAS'],['escolas',17,0,'ESCOLAS PÚBLICAS'],
 ['ubs',18,0,'UBS NO ENTORNO'],['ongs',19,0,'CENTROS COMUNITÁRIOS'],
 ['onibus',20,0,'PONTOS DE ÔNIBUS'],['comunicacao',21,0,'OPORTUNIDADES DE COMUNICAÇÃO'],
 ['criticos',22,0,'PONTOS CRÍTICOS']
 ];}
function cptGdTabela_(doc){
 if(typeof doc.getTabs==='function' && (doc.getTabs().length!==1 || doc.getTabs()[0].getChildTabs().length))
   throw new Error('O modelo deve conter somente uma guia de documento. A geração foi interrompida antes do preenchimento.');
 const body=doc.getBody(),tables=body.getTables();
 if(tables.length!==1)throw new Error('O modelo precisa ter a única tabela oficial do diagnóstico. Foram encontradas '+tables.length+'.');
 const t=tables[0];if(t.getNumRows()!==23)throw new Error('O modelo convertido tem '+t.getNumRows()+' linhas. Esperadas 23. Envie o diagnóstico do modelo para conferir a conversão.');
 const expected={0:1,1:6,2:4,3:2,4:1,5:3,6:3};
 Object.keys(expected).forEach(r=>{if(t.getRow(+r).getNumCells()!==expected[r])throw new Error('Mesclagem diferente na linha '+(+r+1)+' do modelo. Nenhuma ficha foi preenchida.');});
 const begins=(r,c,text)=>cptDtNorm_(t.getRow(r).getCell(c).getText()).startsWith(cptDtNorm_(text));
 if(!begins(0,0,'DIAGNÓSTICO LOCAL')||!begins(4,0,'INFORMAÇÕES DO ENTORNO DAS OBRAS')||!begins(5,2,'OBSERVAÇÕES'))throw new Error('Cabeçalhos do modelo oficial não reconhecidos.');
 cptGdCamposOficiais_().forEach(f=>{const row=t.getRow(f[1]);if(row.getNumCells()<=f[2]+1||!begins(f[1],f[2],f[3]))throw new Error('Campo não reconhecido no modelo: '+f[3]+'.');});
 // Só são permitidos rótulos, valores mapeados e a célula de observações.
 for(let r=7;r<23;r++){const row=t.getRow(r);if(row.getNumCells()<2||row.getNumCells()>3)throw new Error('Mesclagem inesperada na linha '+(r+1));if(row.getNumCells()===3&&row.getCell(2).getText().trim())throw new Error('Há texto fora da célula principal de observações na linha '+(r+1)+'. Confira a conversão do modelo.');}
 for(let i=0;i<body.getNumChildren();i++){const child=body.getChild(i);if(child.getType()!==DocumentApp.ElementType.TABLE && typeof child.getText==='function' && child.getText().trim())throw new Error('Há texto adicional fora da tabela do modelo. Confira para evitar transportar conteúdo do exemplo.');}
 return t;
}
function diagnosticarModeloTerritorial(){
 cptDtPlanilha_();const doc=DocumentApp.openById(CPT_GD.modelo),body=doc.getBody(),result={versao:CPT_GD.versao,somenteLeitura:true,modelo:doc.getUrl(),tabelas:body.getTables().map(t=>({linhas:t.getNumRows(),celulas:Array.from({length:t.getNumRows()},(_,r)=>t.getRow(r).getNumCells())}))};
 try{cptGdTabela_(doc);DriveApp.getFolderById(CPT_GD.pasta).getName();result.status='Modelo e pasta acessíveis. Estrutura reconhecida.';}
 catch(e){result.status='Conferência necessária';result.motivo=e.message;}
 console.log(JSON.stringify(result,null,2));return result;
}
function instalarGeradorTerritorial(){const r=diagnosticarModeloTerritorial();if(r.status==='Conferência necessária')throw new Error(r.motivo);console.log('Gerador disponível na seção Documentos e slides do painel. Nenhum gatilho foi criado.');return r;}
function cptGdCampo_(d,label){return (d.fields.find(f=>f.rotulo===label)||{}).valor||'';}
function cptGdNormalizarOpcao_(s,allowed){const n=cptDtNorm_(s);return allowed.find(v=>cptDtNorm_(v)===n)||'';}
function cptGdOficiais_(d,p){
 const v=n=>cptGdCampo_(d,n),out={
 frente:p.frente,pvInicio:p.pvInicio,pvFim:p.pvFim,metodo:p.metodo,extensao:p.extensao,
 endereco:[v('Endereço'),v('Numeração')].filter(Boolean).join('\n'),perfil:v('Perfil socioeconômico'),pavimento:v('Pavimento'),
 condicao:p.condicao,impacto:p.impacto,impactos:[v('Condição da via'),v('Ocorrências relatadas')].filter(Boolean).join('\n'),
 veiculos:v('Veículos'),pedestres:v('Pedestres'),residencias:v('Imóveis residenciais'),comercios:v('Imóveis comerciais'),
 padrao:p.padrao,ipvs:v('IPVS informado'),liderancas:v('Lideranças'),escolas:v('Escolas públicas — quantidade'),ubs:v('UBS — quantidade'),
 ongs:v('Equipamentos comunitários')||v('Centros e ONGs'),onibus:v('Pontos de ônibus'),comunicacao:v('Comunicação'),criticos:v('Pontos críticos'),observacoes:p.observacoes
 };Object.keys(out).forEach(k=>out[k]=cptDtString_(out[k])||(['pvInicio','pvFim','metodo','extensao'].includes(k)?'-':'Não informado'));
 const leader=cptDtNorm_(out.liderancas);
 if(['nao','nao foram identificadas liderancas'].includes(leader))out.liderancas='Não';
 if(['sim','foram identificadas liderancas'].includes(leader))out.liderancas='Sim';
 return out;
}
function cptGdRegistros_(){
 const sh=cptDtPlanilha_().getSheetByName(CPT_GD.aba);if(!sh)return [];
 const a=sh.getDataRange().getValues(),h=a.shift()||[];
 if(JSON.stringify(h)!==JSON.stringify(CPT_GD.cab))throw new Error('Estrutura do histórico de documentos alterada.');
 return a.filter(r=>r[0]).map((r,i)=>({row:i+2,pedido:String(r[0]),id:String(r[1]),assinatura:String(r[2]),data:r[3] instanceof Date?r[3].toISOString():String(r[3]),estado:String(r[4]),documento:String(r[5]||''),pdf:String(r[6]||''),slides:String(r[7]||''),avisos:String(r[8]||''),snapshot:String(r[9]||'')}));
}
function listarDocumentosTerritoriais(id){return cptGdRegistros_().filter(r=>r.id===id).map(r=>{let parametros=null;try{parametros=JSON.parse(r.snapshot);}catch(e){}return {data:r.data,estado:r.estado,documento:r.documento,pdf:r.pdf,slides:r.slides,avisos:r.avisos,parametros:parametros};}).reverse();}
function cptGdSalvarLinha_(r){
 let sh=cptDtPlanilha_().getSheetByName(CPT_GD.aba);
 if(!sh){sh=cptDtPlanilha_().insertSheet(CPT_GD.aba);sh.getRange(1,1,1,10).setValues([CPT_GD.cab]);sh.setFrozenRows(1);sh.hideSheet();}
 r.row=r.row||sh.getLastRow()+1;
 sh.getRange(r.row,1,1,10).setValues([[r.pedido,r.id,r.assinatura,r.data,r.estado,r.documento||'',r.pdf||'',r.slides||'',r.avisos||'',r.snapshot]]);SpreadsheetApp.flush();
}
function cptGdValidarPedido_(p,d){
 if(!p||!['ficha','slides'].includes(p.tipo)||!/^[a-zA-Z0-9_-]{10,100}$/.test(p.pedido||''))throw new Error('Pedido de geração inválido.');
 if(p.hash!==d.hash||p.rev!==d.revisao.rev)throw new Error('O diagnóstico ou a revisão mudou. Atualize o painel antes de gerar.');
 ['frente','pvInicio','pvFim','metodo','extensao','condicao','impacto','padrao','observacoes'].forEach(k=>{if(typeof p[k]!=='string'||p[k].length>(k==='observacoes'?12000:300))throw new Error('Confira o campo '+k+'.');});
 if(!p.frente.trim())throw new Error('Informe a Frente/CT para identificar a entrega.');
 if(p.frente.length>120)throw new Error('Use até 120 caracteres no nome da Frente/CT.');
 if(!p.observacoes.trim())throw new Error('O texto de observações está vazio.');
 if(!['','Ruim','Regular','Bom'].includes(p.condicao)||!['','Baixo','Médio','Alto'].includes(p.impacto)||!['','Baixo','Médio','Alto'].includes(p.padrao))throw new Error('Classificação fora das opções da ficha oficial.');
 if(!Array.isArray(p.fotos)||p.fotos.length>12||new Set(p.fotos).size!==p.fotos.length||p.fotos.some(u=>!d.fotos.includes(u)))throw new Error('Selecione até 12 imagens vinculadas ao diagnóstico.');
 if(p.mes!==''&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(p.mes))throw new Error('Período de pesquisas inválido.');
 if(p.tipo==='slides'&&!p.mes)throw new Error('Selecione o mês das pesquisas para contextualizar a apresentação.');
}
function gerarEntregaTerritorial(p){
 if(!p||typeof p.id!=='string')throw new Error('Selecione um diagnóstico antes de gerar.');
 cptDtPlanilha_();const lock=LockService.getDocumentLock();lock.waitLock(20000);
 let record=null,created=[];
 try{
   const all=carregarPainelTerritorial(),d=all.diagnosticos.find(d=>d.id===p.id);if(!d)throw new Error('Diagnóstico não localizado.');
   cptGdValidarPedido_(p,d);
   const oficiais=cptGdOficiais_(d,p),snapshot={versao:CPT_GD.versao,tipo:p.tipo,id:d.id,hash:d.hash,revisao:d.revisao.rev,oficiais:oficiais,fotos:p.fotos,mes:p.mes};
   if(p.tipo==='ficha'){cptGdTabela_(DocumentApp.openById(CPT_GD.modelo));snapshot.modeloAtualizado=DriveApp.getFileById(CPT_GD.modelo).getLastUpdated().toISOString();}
   const signature=cptDtHash_(snapshot),history=cptGdRegistros_(),sameRequest=history.find(r=>r.pedido===p.pedido);
   if(sameRequest){if(sameRequest.assinatura!==signature)throw new Error('O pedido anterior usa outro conteúdo. Atualize a lista antes de tentar novamente.');if(sameRequest.estado==='Concluído')return cptGdResposta_(sameRequest,true);throw new Error('Este pedido já foi registrado com estado '+sameRequest.estado+'. Confira o histórico antes de iniciar outra versão.');}
   const existing=history.slice().reverse().find(r=>r.assinatura===signature&&r.estado==='Concluído');
   if(existing&&!p.novaVersao)return cptGdResposta_(existing,true);
   const folder=DriveApp.getFolderById(CPT_GD.pasta),stamp=Utilities.formatDate(new Date(),cptDtPlanilha_().getSpreadsheetTimeZone(),'yyyyMMdd_HHmmss');
   const name=(p.tipo==='ficha'?'Diagnóstico SABESP':'Diagnóstico territorial')+' '+d.id+' '+p.frente.replace(/[\\/:*?"<>|]/g,' ').slice(0,70)+' '+stamp;
   record={pedido:p.pedido,id:d.id,assinatura:signature,data:new Date().toISOString(),estado:'Em geração',snapshot:JSON.stringify(snapshot)};
   cptGdSalvarLinha_(record);
   if(p.tipo==='ficha'){
     const file=DriveApp.getFileById(CPT_GD.modelo).makeCopy(name,folder);created.push(file);
     const doc=DocumentApp.openById(file.getId()),table=cptGdTabela_(doc);
     cptGdCamposOficiais_().forEach(f=>cptGdPreencherCelula_(table.getRow(f[1]).getCell(f[2]+1),oficiais[f[0]]));
     cptGdPreencherCelula_(table.getRow(6).getCell(2),oficiais.observacoes);
     doc.saveAndClose();record.documento=file.getUrl();
     const pdf=folder.createFile(file.getAs(MimeType.PDF).setName(name+'.pdf'));created.push(pdf);record.pdf=pdf.getUrl();
   }else{
     const pages=cptGdRoteiro_(d,p,all.pesquisas),deck=SlidesApp.create(name),file=DriveApp.getFileById(deck.getId());created.push(file);file.moveTo(folder);
     const warnings=[];cptGdRenderSlides_(deck,pages,warnings);deck.saveAndClose();record.slides=file.getUrl();record.avisos=warnings.join('\n');
   }
   record.estado='Concluído';cptGdSalvarLinha_(record);return cptGdResposta_(record,false);
 }catch(e){
   // Somente arquivos criados nesta tentativa são descartados. O modelo nunca é alterado.
   if(record){const pending=[];created.forEach(f=>{try{f.setTrashed(true);}catch(clean){pending.push(f.getUrl());}});record.estado='Falhou';record.documento='';record.pdf='';record.slides='';record.avisos=String(e.message||e)+(pending.length?'\nArquivos parciais para conferência: '+pending.join(' '):'');try{cptGdSalvarLinha_(record);}catch(logError){throw new Error(record.avisos+'\nNão foi possível atualizar o histórico: '+logError.message);}}
   throw e;
 }finally{lock.releaseLock();}
}
function cptGdResposta_(r,reused){return {documento:r.documento,pdf:r.pdf,slides:r.slides,avisos:r.avisos,reutilizado:reused,data:r.data};}
function cptGdPreencherCelula_(cell,value){
 const text=cell.editAsText(),old=text.getText(),attributes=old.length?text.getAttributes(0):text.getAttributes();
 text.setText(value);if(value.length)text.setAttributes(0,value.length-1,attributes);
}
/** Quebra conservadora por caracteres e linhas. Nenhuma resposta é truncada. */
function cptGdPartes_(text,max){
 const out=[];let pending=[];
 String(text||'Não informado').split(/\n\s*\n/).forEach(par=>{
   const lines=cptGdWrap_(par,58).split('\n');
   if(pending.length&&pending.length+lines.length+1>9){out.push(pending.join('\n'));pending=[];}
   if(lines.length>9){for(let i=0;i<lines.length;i+=9)out.push(lines.slice(i,i+9).join('\n'));}
   else{if(pending.length)pending.push('');pending.push(...lines);}
 });if(pending.length)out.push(pending.join('\n'));
 return out.length?out:['Não informado'];
}
function cptGdWrap_(text,width){const lines=[];String(text).split('\n').forEach(par=>{let rest=par.trim();if(!rest){lines.push('');return;}while(rest){let cut=Math.min(rest.length,width);if(cut<rest.length){const sp=rest.lastIndexOf(' ',cut);if(sp>width/3)cut=sp;}lines.push(rest.slice(0,cut));rest=rest.slice(cut).trim();}});return lines.join('\n');}
function cptGdRoteiro_(d,p,pesquisas){
 const v=n=>cptGdCampo_(d,n)||'Não informado',date=d.data?d.data.split('-').reverse().join('/'):'Data não informada',pages=[];
 pages.push({kind:'cover',title:p.frente,subtitle:d.bairro||'Bairro não informado',date:date,photo:p.fotos[0]||''});
 pages.push({kind:'metrics',title:'O trecho em perspectiva',items:[['Imóveis residenciais',v('Imóveis residenciais')],['Imóveis comerciais',v('Imóveis comerciais')],['IPVS informado',v('IPVS informado')]],body:[v('Endereço'),v('Numeração'),'Registro de '+v('Responsável')].join('\n')});
 const addText=(title,text)=>cptGdPartes_(text,570).forEach((part,i)=>pages.push({kind:'text',title:title+(i?' (continuação)':''),body:part}));
 const extendedMetrics=pages[1].items.filter(it=>it[1].length>15);
 if(extendedMetrics.length){addText('Informações de contagem',extendedMetrics.map(it=>it[0]+': '+it[1]).join('\n\n'));extendedMetrics.forEach(it=>it[1]='Ver detalhe');}
 const technical=[['PV início',p.pvInicio],['PV fim',p.pvFim],['Método construtivo',p.metodo],['Extensão',p.extensao],['Condição do pavimento',p.condicao],['Nível de impacto',p.impacto],['Padrão construtivo',p.padrao]].filter(it=>it[1].trim()&&it[1]!=='-');
 if(technical.length)addText('Referências da frente',technical.map(it=>it[0]+': '+it[1]).join('\n\n'));
 const section=(title,labels)=>{
   let page={kind:'fields',title:title,items:[]},col=0,top=0;
   const flush=()=>{if(page.items.length)pages.push(page);page={kind:'fields',title:title,items:[]};col=0;top=0;};
   labels.forEach(label=>{const value=cptGdWrap_(v(label),34),height=44+value.split('\n').length*26;
     if(height>340){flush();addText(title,label+': '+v(label));return;}
     if(top+height>340){col++;top=0;}if(col>1)flush();
     page.items.push({label:label,value:value,raw:v(label),x:48+col*444,y:124+top,height:height});top+=height+10;
   });flush();
 };
 section('Perfil social e moradia',['Perfil socioeconômico','Evidências do perfil','Faixas etárias','Grupos etários','Padrão construtivo']);
 section('Circulação e infraestrutura',['Pavimento','Condição da via','Calçadas','Veículos','Pedestres','Observações sanitárias']);
 section('Infraestrutura sanitária',['Estruturas sanitárias']);
 section('Equipamentos e mobilização',['Educação','Equipamentos de educação','Saúde','Equipamentos de saúde','Equipamentos comunitários','Tenda','Comunicação']);
 section('Ocorrências registradas',['Ocorrências relatadas','Pontos críticos']);
 addText('O relato da equipe',v('Relato original'));
 const bairro=cptDtNorm_(d.bairro),ps=bairro?pesquisas.filter(r=>cptDtNorm_(r.bairro)===bairro&&r.data.slice(0,7)===p.mes):[];
 const valid=ps.filter(r=>r.nota!==null&&r.nota>=0&&r.nota<=10),avg=valid.length?(valid.reduce((s,r)=>s+r.nota,0)/valid.length).toFixed(1).replace('.',','):'Não disponível';
 pages.push({kind:'metrics',title:'A escuta no bairro',items:[['Pesquisas no período',bairro?String(ps.length):'Não disponível'],['Notas válidas',bairro?String(valid.length):'Não disponível'],['Média de satisfação',avg]],body:'Satisfação com os serviços de saneamento em geral. Escala de 0 a 10.\n'+(p.mes?p.mes.split('-').reverse().join('/'):'Período não informado')+'\nAs respostas coletadas não representam, por si só, toda a população do bairro.',extraSources:ps.map(r=>r.fonte)});
 // O texto-base repete os campos já apresentados. Uma redação própria recebe slides próprios.
 if(p.observacoes.trim()!==d.textoBase.trim())addText('Leitura consolidada do território',p.observacoes);
 const gallery=p.fotos.slice(1);for(let i=0;i<gallery.length;i+=2)pages.push({kind:'photos',title:'Registros de campo',photos:gallery.slice(i,i+2),caption:p.frente+'\n'+date});
 pages.forEach((page,i)=>{page.number=i+1;page.source=d.fonte;page.id=d.id;page.date=date;});
 if(pages.length>50)throw new Error('O conteúdo resultaria em mais de 50 slides. Revise o texto consolidado antes de gerar.');return pages;
}
function cptGdRenderSlides_(deck,pages,warnings){
 const first=deck.getSlides();
 const w=deck.getPageWidth(),h=deck.getPageHeight(),sx=w/960,sy=h/540,C=CPT_GD.cores;
 const box=(s,text,x,y,bw,bh,size,color,bold,center)=>{
   const shape=s.insertTextBox(String(text),x*sx,y*sy,bw*sx,bh*sy);
   shape.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);
   shape.getText().getTextStyle().setFontFamily('Arial').setFontSize(size*Math.min(sx,sy)).setForegroundColor(color).setBold(!!bold);
   shape.getText().getParagraphStyle().setParagraphAlignment(center?SlidesApp.ParagraphAlignment.CENTER:SlidesApp.ParagraphAlignment.START);
   return shape;
 };
 pages.forEach(p=>{
   const s=deck.appendSlide(SlidesApp.PredefinedLayout.BLANK),dark=p.kind==='cover'||(p.kind==='fields'&&p.number%2===0);s.getBackground().setSolidFill(dark?C.azul:(p.kind==='metrics'?C.claro:'#FFFFFF'));
   const notes=s.getNotesPage().getSpeakerNotesShape();if(notes)notes.getText().setText('Diagnóstico '+p.id+'\nFonte: '+p.source+'\n'+(p.extraSources||[]).join('\n'));
   if(p.kind==='cover'){
     box(s,'Consórcio Performance Tamanduateí',54,38,840,44,22,'#FFFFFF',false,false);
     const titleWidth=p.photo?446:840;
     box(s,'Diagnóstico territorial',54,116,titleWidth,90,p.photo?34:40,C.ciano,true,false);
     box(s,p.title,54,214,titleWidth,155,p.photo&&p.title.length>60?24:(p.title.length>50?30:42),'#FFFFFF',true,false);
     box(s,p.subtitle+'\n'+p.date,54,397,titleWidth,72,24,'#FFFFFF',false,false);
     if(p.photo){try{const im=s.insertImage(cptGdFoto_(p.photo)),ratio=Math.min(352*sx/im.getWidth(),322*sy/im.getHeight());im.setWidth(im.getWidth()*ratio).setHeight(im.getHeight()*ratio);im.setLeft(554*sx+(352*sx-im.getWidth())/2).setTop(116*sy+(322*sy-im.getHeight())/2);im.setTitle('Registro do território');im.setDescription(p.photo);}catch(e){warnings.push('Imagem da capa indisponível: '+p.photo);box(s,'Registro do território\nOriginal disponível no link',554,180,352,160,24,'#FFFFFF',false,true);}box(s,'Arquivo original',554,443,352,30,17,C.ciano,false,true).getText().getTextStyle().setLinkUrl(p.photo);}return;
   }
   box(s,p.title,48,26,864,80,32,dark?'#FFFFFF':C.azul,true,false);
   if(p.kind==='fields')p.items.forEach(it=>{const single=p.items.length===1;box(s,it.label,it.x,it.y,single?864:410,34,18,dark?'#72D7FF':C.petroleo,true,false);box(s,single?cptGdWrap_(it.raw,65):it.value,it.x,it.y+38,single?864:410,single?270:it.height-38,22,dark?'#FFFFFF':C.texto,false,false);});
   if(p.kind==='text')box(s,p.body,48,125,864,330,24,C.texto,false,false);
   if(p.kind==='metrics'){
     p.items.forEach((it,i)=>{box(s,it[0],48+i*296,137,272,55,21,C.cinza,false,true);box(s,it[1],48+i*296,198,272,88,it[1].length>15?24:42,i===1?C.petroleo:C.ciano,true,true);});
     box(s,p.body,48,332,864,125,21,C.texto,false,false);
   }
   if(p.kind==='photos'){
     p.photos.forEach((url,i)=>{const x=p.photos.length===1?174:48+i*440,bw=p.photos.length===1?612:424;
       try{const blob=cptGdFoto_(url);const im=s.insertImage(blob);const ratio=Math.min(bw*sx/im.getWidth(),300*sy/im.getHeight());im.setWidth(im.getWidth()*ratio).setHeight(im.getHeight()*ratio);im.setLeft(x*sx+(bw*sx-im.getWidth())/2).setTop(120*sy+(300*sy-im.getHeight())/2);im.setTitle('Evidência '+p.id);im.setDescription(url);}
       catch(e){warnings.push('Imagem indisponível: '+url+' ('+e.message+')');box(s,'Prévia indisponível\nArquivo original no link abaixo',x,170,bw,130,24,C.cinza,false,true);}
       box(s,'Arquivo original',x,428,bw,27,17,C.ciano,false,true).getText().getTextStyle().setLinkUrl(url);
     });
   }
   box(s,p.id+'  '+p.date,48,487,780,28,14,dark?'#B1CDDC':C.cinza,false,false).getText().getTextStyle().setLinkUrl(p.source);
   box(s,p.number,866,482,46,34,17,dark?'#B1CDDC':C.cinza,false,true);
 });
 first.forEach(s=>s.remove());
}
function cptGdFoto_(url){
 const id=cptDtFileId_(url),key=url.match(/[?&]resourcekey=([\w-]+)/),f=key?DriveApp.getFileByIdAndResourceKey(id,key[1]):DriveApp.getFileById(id);
 let blob=null;if(/^image\/(jpeg|png|gif)$/.test(f.getMimeType())&&f.getSize()<=8000000)blob=f.getBlob();else blob=f.getThumbnail();
 if(!blob||!/^image\/(jpeg|png|gif)$/.test(blob.getContentType()))throw new Error('Imagem compatível não disponível');return blob;
}
