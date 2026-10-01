/**

 * CPT | Painel territorial 1.2 — módulo adicional em Procedimentos de Campo.

 * Fontes lidas: Base Consolidada. Escrita: somente CPT Análises Territoriais.

 * Não altera fichas SABESP, respostas, formulários ou gatilhos.

 * Acrescente criarMenuPainelTerritorial(); à função aoAbrirDiagnosticos(e)

 * existente para apresentar o menu nas próximas aberturas.

 */

const CPT_DT = Object.freeze({

  planilha: '1_6BKqeVbjzKm_hYdRsneU3YqEmd1rOWaVGCiV0LXtgQ',

  base: 'Base Consolidada', revisoes: 'CPT Análises Territoriais',

  cabecalho: ['Diagnóstico ID','Revisão','Data da revisão','Autor identificado','Estado','Texto da gestão','Notas internas','Assinatura da fonte'],

  procedimento: 'Selecione o procedimento a ser executado', bairro: 'Bairro de realização do procedimento',

  data: 'Data de realização do procedimento', id: 'ID de migração',

  nota: 'De 0 a 10, quanto está satisfeito com os serviços de saneamento de forma geral?'

});



/** Menu: chamado pela abertura da planilha, não pela instalação. */

function criarMenuPainelTerritorial() {

  const ui = cptDtUiDisponivel_();

  if (!ui) {

    console.log('Menu não criado nesta execução: não há interface ativa. Reabra a planilha Procedimentos de Campo no navegador.');

    return false;

  }

  ui.createMenu('TERRITÓRIOS')

    .addItem('Visão territorial • diagnósticos', 'abrirPainelTerritorial')

    .addToUi();

  return true;

}

/** Validação somente de leitura. Não chama getUi, não abre janelas e não cria gatilhos. */

function instalarPainelTerritorial() {

  const ss = cptDtPlanilha_();

  const dados = cptDtLer_();

  const revisoes = cptDtRevisoes_();

  const resultado = {

    versao: '1.2',

    status: 'Validação concluída',

    planilha: ss.getName(),

    diagnosticos: dados.records.filter(r => r.tipo === 'diagnostico de area').length,

    pesquisas: dados.records.filter(r => r.tipo === 'pesquisa de satisfacao').length,

    revisoesPreservadas: revisoes.length,

    avisos: dados.warnings,

    proximoPasso: 'Reabra a planilha e acesse TERRITÓRIOS → Visão territorial • diagnósticos. A criação do menu depende da função aoAbrirDiagnosticos já existente.'

  };

  console.log(JSON.stringify(resultado, null, 2));

  return resultado;

}

function cptDtUiDisponivel_() {

  try { return SpreadsheetApp.getUi(); }

  catch (erro) {

    const mensagem = String(erro && erro.message || erro);

    if (/Cannot call SpreadsheetApp\\.getUi\\(\\) from this context/i.test(mensagem)) return null;

    throw erro;

  }

}

function abrirPainelTerritorial() {

  cptDtPlanilha_();

  const ui = cptDtUiDisponivel_();

  if (!ui) throw new Error('Abra o painel pela planilha Procedimentos de Campo: TERRITÓRIOS → Visão territorial • diagnósticos. Esta execução está sem interface ativa.');

  ui.showModalDialog(HtmlService.createHtmlOutput(cptDtHtml_())

    .setWidth(1280).setHeight(800), 'CPT | Inteligência territorial');

}

function cptDtPlanilha_() {

  const s = SpreadsheetApp.getActiveSpreadsheet();

  if (!s || s.getId() !== CPT_DT.planilha) throw new Error('Este módulo pertence à planilha Procedimentos de Campo 3.0.');

  return s;

}

function cptDtNorm_(v) { return String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase(); }

function cptDtString_(v) { return v == null ? '' : String(v).trim(); }

function cptDtDate_(v,tz) {

  if (v instanceof Date && !isNaN(v.getTime())) return Utilities.formatDate(v,tz,'yyyy-MM-dd');

  const s=cptDtString_(v), iso=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/), br=s.match(/^(\d{2})\\/(\d{2})\\/(\d{4})$/);

  if (!iso && !br) return '';

  const y=+(iso?iso[1]:br[3]),m=+(iso?iso[2]:br[2]),d=+(iso?iso[3]:br[1]);

  const t=new Date(Date.UTC(y,m-1,d));

  return t.getUTCFullYear()===y && t.getUTCMonth()===m-1 && t.getUTCDate()===d ? [y,String(m).padStart(2,'0'),String(d).padStart(2,'0')].join('-') : '';

}

function cptDtNumero_(v) {

  if (typeof v === 'number') return Number.isFinite(v) ? v : null;

  const s=cptDtString_(v); return /^\d+(?:[.,]\d+)?$/.test(s) ? Number(s.replace(',','.')) : null;

}

function cptDtHash_(v) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(v))); }

function cptDtCampos_() {

  return [

    ['Território','Endereço','Endereço completo'],

    ['Território','Numeração','Intervalo de numeração observado no trecho'],

    ['Território','Responsável','Colaborador responsável pelo registro'],

    ['Perfil social','Perfil socioeconômico','Perfil socioeconômico observado no território'],

    ['Perfil social','Evidências do perfil','Indicadores utilizados para classificar o perfil socioeconômico observado'],

    ['Perfil social','IPVS informado','Índice Paulista de Vulnerabilidade Social — IPVS'],

    ['Perfil social','Faixas etárias','Faixas etárias predominantes no trecho'],

    ['Perfil social','Grupos etários','Observações sobre grupos etários identificados'],

    ['Moradia e circulação','Imóveis residenciais','Quantidade de Imóveis Residênciais no Traçado'],

    ['Moradia e circulação','Imóveis comerciais','Quantidade de Imóveis Comerciais no Traçado'],

    ['Moradia e circulação','Padrão construtivo','Padrão ou padrões construtivos predominantemente observados'],

    ['Moradia e circulação','Concentração de construções','Há muitas construções no trecho?'],

    ['Moradia e circulação','Pavimento','Tipo de pavimento predominante'],

    ['Moradia e circulação','Condição da via','Condições da via'],

    ['Moradia e circulação','Calçadas','Tipo de calçadas predonimante'],

    ['Moradia e circulação','Veículos','Tráfego de Veículos'],

    ['Moradia e circulação','Pedestres','Tráfego de Pedestres'],

    ['Rede local','Lideranças','Foram identificadas lideranças no território?'],

    ['Rede local','Referências de lideranças','Onde encontrar essas lideranças?'],

    ['Rede local','Educação','Existem escolas ou equipamentos de educação no entorno?'],

    ['Rede local','Escolas públicas — quantidade','Quantidade de escolas públicas no traçado'],

    ['Rede local','Equipamentos de educação','Escolas e equipamentos de educação Identificados'],

    ['Rede local','Saúde','Existe UBS ou Hospitais no entorno?'],

    ['Rede local','UBS — quantidade','Quantidade de UBS no traçado'],

    ['Rede local','Equipamentos de saúde','UBS ou Hospitais identificados'],

    ['Rede local','Centros e ONGs','Existem centros comunitários ou ONGs no entorno?'],

    ['Rede local','Equipamentos comunitários','Centros comunitários, ONGs ou equipamentos identificados'],

    ['Rede local','Pontos de ônibus','Existem pontos de ônibus no traçado?'],

    ['Rede local','Frequência de ônibus','Com qual frequência passam os ônibus?'],

    ['Rede local','Praças','Há presença de praças no trecho?'],

    ['Infraestrutura','Estruturas sanitárias','Infraestrutura sanitária identificada no diagnóstico'],

    ['Infraestrutura','Observações sanitárias','Observações sobre a infraestrutura sanitária'],

    ['Infraestrutura','Ocorrências relatadas','Ocorrências observadas na região'],

    ['Infraestrutura','Pontos críticos','Pontos críticos observados'],

    ['Mobilização','Tenda','Possíveis locais para instalação de tenda'],

    ['Mobilização','Interesse na atividade','Durante o procedimento, houve interesse da população ao redor para saber mais da atividade?'],

    ['Mobilização','Interesse nas obras','Houve interesse da população ao redor de saber mais sobre as obras?'],

    ['Mobilização','Estratégia social','Há alguma observação de cunho social, que possa ser estratégica para realizar ações e conscientização da população ao redor dessa intervenção?'],

    ['Mobilização','Comunicação','Oportunidades de comunicação no local'],

    ['Mobilização','Estratégia de comunicação','Há alguma observação para a comunicação que possa ser estratégica para as ações?'],

    ['Relato de campo','Relato original','Relato do Diagnóstico'],

    ['Relato de campo','Observação final','Observação final do procedimento']

  ];

}

function cptDtLer_() {

  const ss=cptDtPlanilha_(), sh=ss.getSheetByName(CPT_DT.base);

  if (!sh) throw new Error('Base Consolidada não localizada. Atualize a integração pelo procedimento já existente.');

  const a=sh.getDataRange().getValues(), h=a.shift() || [], idx={};

  h.forEach((v,i)=>{const k=cptDtNorm_(v); if(k && idx[k]!==undefined) throw new Error('Cabeçalho repetido na base: '+v); if(k) idx[k]=i;});

  [CPT_DT.procedimento,CPT_DT.id,CPT_DT.bairro,CPT_DT.data,'Validação'].forEach(k=>{if(idx[cptDtNorm_(k)]===undefined) throw new Error('Campo necessário ausente: '+k);});

  const get=(r,k)=>r[idx[cptDtNorm_(k)]], records=[], seen={}, warnings=[];

  a.forEach((r,i)=>{

    if (!r.some(v=>v!=='' && v!=null)) return;

    const p=cptDtNorm_(get(r,CPT_DT.procedimento));

    if (!['diagnostico de area','pesquisa de satisfacao'].includes(p)) return;

    const valid=cptDtNorm_(get(r,'Validação'));

    if (!['valido para consolidacao','registro atual preservado'].includes(valid)) {warnings.push('Linha '+(i+2)+': validação não aceita; fora dos indicadores.');return;}

    const id=cptDtString_(get(r,CPT_DT.id));

    if (!id) {warnings.push('Linha '+(i+2)+': sem ID estável; fora do painel.');return;}

    if (seen[id]) throw new Error('ID repetido na Base Consolidada: '+id+'. Confira a integração antes de analisar.');

    seen[id]=true;

    const fields=cptDtCampos_().map(c=>({grupo:c[0],rotulo:c[1],campo:c[2],valor:cptDtString_(get(r,c[2]))}));

    const data=cptDtDate_(get(r,CPT_DT.data),ss.getSpreadsheetTimeZone());

    records.push({id:id,tipo:p,bairro:cptDtString_(get(r,CPT_DT.bairro)),data:data,linha:i+2,

      fonte:ss.getUrl()+'#gid='+sh.getSheetId()+'&range=A'+(i+2),

      fields:fields,fotos:cptDtNovasFotosDiagnostico_(r,idx),nota:cptDtNumero_(get(r,CPT_DT.nota)),

      hash:cptDtHash_(r),aviso:data?'':'Data do procedimento ausente ou inválida.'});

  });

  return {records:records,warnings:warnings};

}

function cptDtUrls_(v) {

  return Array.from(new Set((cptDtString_(v).match(/https:\\/\\/drive\\.google\\.com\\/[^\s,;]+/g)||[])

    .map(s=>s.replace(/[)\]]+$/,'')))).filter(s=>cptDtFileId_(s));

}

function cptDtFileId_(url) {const m=String(url).match(/(?:[?&]id=|\\/d\\/)([\w-]+)/);return m?m[1]:'';}

function cptDtTexto_(d) {

  const v=n=>{const f=d.fields.find(f=>f.rotulo===n);return f?f.valor:'';};

  const groups=[

    ['No levantamento de campo', [['Perfil socioeconômico','o perfil socioeconômico foi registrado como'],['Evidências do perfil','as evidências informadas foram'],['Faixas etárias','as faixas etárias apontadas foram']]],

    ['Quanto à circulação e às condições do trecho', [['Pavimento','o pavimento informado foi'],['Condição da via','a condição da via foi descrita como'],['Veículos','o tráfego de veículos foi registrado como'],['Pedestres','o tráfego de pedestres foi registrado como']]],

    ['Sobre a infraestrutura', [['Estruturas sanitárias','foram registradas as seguintes características'],['Observações sanitárias','a equipe acrescentou'],['Ocorrências relatadas','o registro de ocorrências informa']]],

    ['Para a mobilização local', [['Tenda','a possibilidade de tenda foi descrita como'],['Comunicação','o campo de oportunidades de comunicação registra'],['Estratégia social','o registro de estratégia social informa']]]

  ];

  const out=['O diagnóstico'+(d.data?' de '+d.data.split('-').reverse().join('/'):'')+(d.bairro?', no bairro '+d.bairro:'')+(v('Endereço')?', abrange o endereço '+v('Endereço'):'')+'.'];

  groups.forEach(g=>{const clauses=g[1].filter(x=>v(x[0])).map(x=>x[1]+' “'+v(x[0])+'”');if(clauses.length)out.push(g[0]+', '+clauses.join('; ')+'.');});

  if(v('Relato original'))out.push('A equipe relata: “'+v('Relato original')+'”');

  if(v('Observação final'))out.push('Ao final do procedimento, foi registrado: “'+v('Observação final')+'”');

  return out.join('\n\n');

}

function cptDtRevisoes_() {

  const sh=cptDtPlanilha_().getSheetByName(CPT_DT.revisoes);if(!sh)return [];

  const rows=sh.getDataRange().getValues(),h=rows.shift()||[];

  if(JSON.stringify(h)!==JSON.stringify(CPT_DT.cabecalho))throw new Error('A estrutura de CPT Análises Territoriais foi alterada. A gravação foi interrompida para preservar o histórico.');

  return rows.filter(r=>r[0]).map(r=>({id:String(r[0]),rev:Number(r[1]),quando:r[2] instanceof Date?r[2].toISOString():String(r[2]),autor:String(r[3]),estado:String(r[4]),texto:cptDtUnliteral_(r[5]),notas:cptDtUnliteral_(r[6]),hash:String(r[7])}));

}

function cptDtUnliteral_(v) {return cptDtString_(v).replace(/^'(?=[=+\@-])/,'');}

function cptDtLiteral_(v) {const s=String(v);return /^[=+\@-]/.test(s)?"'"+s:s;}

function carregarPainelTerritorial() {

  const data=cptDtLer_(), reviews=cptDtRevisoes_();

  return {atualizado:new Date().toISOString(),warnings:data.warnings,

    diagnosticos:data.records.filter(r=>r.tipo==='diagnostico de area').map(d=>{

      d.textoBase=cptDtTexto_(d);d.historico=reviews.filter(r=>r.id===d.id).sort((a,b)=>b.rev-a.rev);

      d.revisao=d.historico[0]||{rev:0,estado:'Rascunho',texto:'',notas:'',hash:d.hash};return d;

    }),pesquisas:data.records.filter(r=>r.tipo==='pesquisa de satisfacao').map(r=>({id:r.id,bairro:r.bairro,data:r.data,nota:r.nota,fonte:r.fonte})),

    perguntaNota:CPT_DT.nota};

}

function salvarAnaliseTerritorial(p) {

  if(!p || typeof p.id!=='string' || !Number.isInteger(p.rev) || p.rev<0 || !['Rascunho','Revisado pela gestão'].includes(p.estado))throw new Error('Dados de revisão inválidos.');

  if(typeof p.texto!=='string'||typeof p.notas!=='string'||p.texto.length>30000||p.notas.length>15000)throw new Error('Texto inválido ou muito longo. Limites: análise 30.000 e notas 15.000 caracteres.');

  if(p.estado==='Revisado pela gestão'&&!p.texto.trim())throw new Error('Uma análise vazia não pode ser marcada como revisada.');

  const lock=LockService.getDocumentLock();lock.waitLock(20000);

  try {

    const d=cptDtLer_().records.find(d=>d.id===p.id&&d.tipo==='diagnostico de area');

    if(!d)throw new Error('Diagnóstico não localizado na base validada.');

    if(d.hash!==p.hash)throw new Error('As respostas de campo mudaram. Copie seu texto e atualize a visão antes de salvar.');

    const hist=cptDtRevisoes_().filter(r=>r.id===p.id), current=hist.reduce((n,r)=>Math.max(n,r.rev),0);

    if(current!==p.rev)throw new Error('Outra revisão foi salva. Copie seu texto e atualize a visão para comparar as versões.');

    let sh=cptDtPlanilha_().getSheetByName(CPT_DT.revisoes);

    if(!sh){sh=cptDtPlanilha_().insertSheet(CPT_DT.revisoes);sh.getRange(1,1,1,8).setValues([CPT_DT.cabecalho]);sh.setFrozenRows(1);sh.hideSheet();}

    const now=new Date(),autor=Session.getActiveUser().getEmail()||'Identidade não disponibilizada pelo Google';

    sh.getRange(sh.getLastRow()+1,1,1,8).setValues([[p.id,current+1,now,autor,p.estado,cptDtLiteral_(p.texto.trim()),cptDtLiteral_(p.notas.trim()),d.hash]]);

    SpreadsheetApp.flush();

    return {id:p.id,rev:current+1,quando:now\.toISOString(),autor:autor,estado:p.estado,texto:p.texto.trim(),notas:p.notas.trim(),hash:d.hash};

  }finally{lock.releaseLock();}

}

function carregarFotoTerritorial(id,url) {

  const d=cptDtLer_().records.find(d=>d.id===id&&d.tipo==='diagnostico de area');

  if(!d||!d.fotos.includes(url))throw new Error('Imagem não vinculada a este diagnóstico.');

  const key=String(url).match(/[?&]resourcekey=([\w-]+)/),fid=cptDtFileId_(url);

  const f=key?DriveApp.getFileByIdAndResourceKey(fid,key[1]):DriveApp.getFileById(fid);

  let blob=f.getThumbnail();

  if(!blob&&/^image\\/(jpeg|png|gif)$/.test(f.getMimeType())&&f.getSize()<=2000000)blob=f.getBlob();

  if(!blob || !/^image\\/(jpeg|png|gif)$/.test(blob.getContentType()))throw new Error('Miniatura indisponível. O arquivo original continua acessível pelo link.');

  const b=blob.getBytes();if(b.length>2000000)throw new Error('Miniatura acima do limite de exibição.');

  return {src:'data:'+blob.getContentType()+';base64,'+Utilities.base64Encode(b),nome:f.getName(),video:/^video\\//.test(f.getMimeType())};

}



function cptDtHtml_() {

  return \`\<!doctype html>\<html lang="pt-BR">\<head>\<base target="_blank">\<meta name="viewport" content="width=device-width,initial-scale=1">\<style>

  *{box-sizing:border-box}body{margin:0;font:14px Arial,sans-serif;color:#12334c;background:#f2f6fa}button,select,textarea,input{font:inherit}button,select,input{border:1px solid #cbdbe5;border-radius:8px;background:white;padding:10px;color:#12334c}button{cursor:pointer}button:disabled{opacity:.55;cursor:wait}button.primary{background:#008da3;color:white;border:0}a{color:#007c9d}aside{background:#102a40;color:white;padding:26px 18px;position:fixed;width:208px;inset:0 auto 0 0}aside strong{font-size:30px;color:#00a5e8}aside p{line-height:1.6;color:#b4cad9}aside button{display:block;width:100%;text-align:left;margin:10px 0;background:transparent;color:white;border-color:#315068}aside button.on{background:#24495e;border-left:4px solid #1dc5cb}main{margin-left:208px;padding:24px;max-width:1400px}header{display:flex;align-items:center;justify-content:space-between;gap:12px}h1{font-size:27px;margin:0 0 8px}h2{font-size:19px;margin:0 0 14px}h3{font-size:15px;margin:0 0 10px}.muted,small{color:#597287;line-height:1.5}.filters{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}.filters label{display:grid;gap:5px;font-size:12px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:18px 0}.card,.panel{background:white;border:1px solid #dce7ee;border-radius:12px;padding:20px;margin-bottom:14px}.card{border-top:4px solid #0099da;text-align:center;margin:0}.card:nth-child(2){border-top-color:#009f92}.card:nth-child(3){border-top-color:#7862b7}.number{display:block;font-size:32px;font-weight:bold;margin:10px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.item{padding:14px 0;border-bottom:1px solid #e5edf2}.item:last-child{border:0}.tag{display:inline-block;background:#e9f5f6;border-radius:5px;padding:4px 7px;color:#007788;font-size:12px}.warn{background:#fff4df;color:#70520a;border-radius:8px;padding:12px;line-height:1.5;margin:12px 0}.text{white-space:pre-wrap;line-height:1.65}.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.gallery figure{margin:0;padding:8px;background:#f2f6fa;border-radius:8px}.gallery img{width:100%;height:190px;object-fit:contain}.gallery figcaption{font-size:12px;padding:8px;line-height:1.5}textarea{width:100%;min-height:260px;padding:16px;border:1px solid #bfd4df;border-radius:8px;color:#12334c;line-height:1.65;resize:vertical}textarea.notes{min-height:100px}.toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:12px 0}details{border-bottom:1px solid #e4edf3;padding:14px 0}summary{cursor:pointer;font-weight:bold}dl{margin:8px 0}dt{font-size:12px;color:#597287;margin-top:12px}dd{margin:4px 0;white-space:pre-wrap;line-height:1.5}.bar{height:7px;background:#e6eef3;border-radius:9px;margin:9px 0}.bar span{display:block;height:7px;background:#009caf;border-radius:9px}#status{min-height:22px;color:#007788;white-space:pre-wrap}button:focus-visible,a:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #00a5e8;outline-offset:2px}@media(max-width:850px){aside{position:static;width:auto;padding:12px}aside p{display:none}aside button{display:inline-block;width:auto;margin:4px}main{margin:0;padding:14px}.grid,.cards{grid-template-columns:1fr}.gallery{grid-template-columns:repeat(2,1fr)}}

  \</style>\</head>\<body>\<aside>\<strong>CPT\</strong>\<p>Inteligência territorial\<br>Performance Tamanduateí\</p>\<button class="on" data-tab="visao">Visão do território\</button>\<button data-tab="registro">Diagnóstico de campo\</button>\<button data-tab="analise">Análise da gestão\</button>\<button data-tab="galeria">Galeria de evidências\</button>\<button data-tab="documentos">Documentos e slides\</button>\<button data-tab="fontes">Rastreabilidade\</button>\<p>Registros de campo conectados à leitura da gestão.\</p>\</aside>\<main>\<header>\<div>\<h1>Conhecer para atuar\</h1>\<span class="muted">Diagnósticos, escuta da população e memória territorial.\</span>\</div>\<button id="reload">Atualizar visão\</button>\</header>\<div class="filters">\<label>Bairro\<select id="bairro">\</select>\</label>\<label>Pesquisas • mês de realização\<input type="month" id="mes">\</label>\<label>Diagnóstico\<select id="diag">\</select>\</label>\</div>\<div id="status" role="status" aria-live="polite">Carregando registros…\</div>\<div id="content">\</div>\</main>\<script>

  let data=null,tab='visao',dirty=false,busy=false,photoRun=0;const photoCache={};

  const $=id=>document.getElementById(id),esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const norm=s=>String(s||'').normalize('NFD').replace(/[\\\u0300-\\\u036f]/g,'').trim().replace(/\\\s+/g,' ').toLowerCase();

  const date=s=>s?s.split('-').reverse().join('/'):'Data não informada';

  const selected=()=>data&&data.diagnosticos.find(d=>d.id===$('diag').value);

  const field=(d,n)=>(d.fields.find(f=>f.rotulo===n)||{}).valor||'Não informado';

  const msg=s=>$('status').textContent=s;

  function rpc(name,...args){return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(resolve).withFailureHandler(e=>reject(Error(e.message||e)))[name]\(...args));}

  function mayLeave(){return !busy&&(!dirty||confirm('Há texto ainda não salvo. Deseja sair desta edição?'));}

  async function load(){if(!mayLeave())return;dirty=false;busy=true;$('reload').disabled=true;msg('Consultando a Base Consolidada…');try{data=await rpc('carregarPainelTerritorial');const prev=$('bairro').value;const names=[...new Map(data.diagnosticos.map(d=>[norm(d.bairro),d.bairro||'Bairro não informado'])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));$('bairro').innerHTML=names.map(([k,v])=>'\<option value="'+esc(k)+'">'+esc(v)+'\</option>').join('');if(names.some(x=>x[0]===prev))$('bairro').value=prev;fillDiagnoses();msg('Leitura atualizada. Os indicadores refletem a Base Consolidada disponível.');}catch(e){msg(e.message);}finally{busy=false;$('reload').disabled=false;}}

  function fillDiagnoses(){const prev=$('diag').value;const list=data.diagnosticos.filter(d=>norm(d.bairro)===$('bairro').value).sort((a,b)=>b.data.localeCompare(a.data)||a.id.localeCompare(b.id));$('diag').innerHTML=list.map(d=>'\<option value="'+esc(d.id)+'">'+esc(date(d.data)+' • '+field(d,'Endereço')+' • '+d.id)+'\</option>').join('');if(list.some(d=>d.id===prev))$('diag').value=prev;render();}

  function render(){photoRun++;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));const d=selected();if(!d){$('content').innerHTML='\<div class="panel">Nenhum diagnóstico validado disponível.\</div>';return;}const b=$('bairro').value,month=$('mes').value;const ds=data.diagnosticos.filter(x=>norm(x.bairro)===b);const ps=b?data.pesquisas.filter(p=>norm(p.bairro)===b&&(!month||p.data.slice(0,7)===month)):[];const valid=ps.filter(p=>p.nota!==null&&p.nota>=0&&p.nota<=10);const avg=valid.length?(valid.reduce((s,p)=>s+p.nota,0)/valid.length).toFixed(1).replace('.',','):'—';const period=month?month.split('-').reverse().join('/'):'todos os períodos';

    let html='\<div class="toolbar">\<span class="tag">'+esc(d.id)+'\</span>\<span>'+esc(date(d.data))+'\</span>\<a href="'+esc(d.fonte)+'">Registro original ↗\</a>\</div>';

    if(d.aviso)html+='\<div class="warn">'+esc(d.aviso)+'\</div>';

    if(tab==='visao'){

      html+='\<div class="cards">\<div class="card">Diagnósticos do bairro\<span class="number">'+ds.length+'\</span>\<small>Todos os períodos • não representa cobertura de todo o bairro\</small>\</div>\<div class="card">Pesquisas no bairro\<span class="number">'+(b?ps.length:'—')+'\</span>\<small>'+esc(period)+' • respostas validadas\</small>\</div>\<div class="card">Satisfação com saneamento\<span class="number">'+avg+'\</span>\<small>Escala 0–10 • '+valid.length+' notas válidas • '+esc(period)+'\</small>\</div>\</div>\<div class="grid">\<section class="panel">\<h2>Memória do território\</h2>'+ds.map(x=>'\<div class="item">\<span class="muted">'+esc(date(x.data))+' • '+esc(x.id)+'\</span>\<h3>'+esc(field(x,'Endereço'))+'\</h3>\<p>'+esc(field(x,'Responsável'))+'\</p>\<button data-select="'+esc(x.id)+'">Conhecer diagnóstico\</button>\</div>').join('')+'\</section>\<section class="panel">\<h2>Leitura do diagnóstico selecionado\</h2>'+['Perfil socioeconômico','Veículos','Pedestres','Tenda'].map(n=>'\<div class="item">\<small>'+n+'\</small>\<div>'+esc(field(d,n))+'\</div>\</div>').join('')+'\</section>\</div>\<section class="panel">\<h2>Voz da equipe\</h2>\<div class="text">'+esc(field(d,'Relato original'))+'\</div>\</section>\<p class="muted">A média descreve as respostas coletadas; não é uma estimativa representativa de todos os moradores. Nenhum índice de impacto é calculado automaticamente.\</p>';

    }else if(tab==='registro'){

      html+='\<section class="panel">\<h2>O território, pelas respostas de campo\</h2>\<p class="muted">Os campos sem resposta permanecem identificados. A ficha oficial SABESP não é alterada por esta consulta.\</p>'+groups(d)+'\</section>';

    }else if(tab==='analise'){

      html+='\<section class="panel">\<h2>Texto-base do registro\</h2>\<p class="muted">Rascunho por conexão de respostas, com trechos originais entre aspas. Não substitui avaliação técnica. Os demais campos continuam em Diagnóstico de campo.\</p>\<details>\<summary>Consultar texto-base\</summary>\<div class="text">'+esc(d.textoBase)+'\</div>\</details>\<button id="useBase">Usar texto-base na edição\</button>\</section>\<section class="panel">\<h2>Análise da gestão\</h2>\<p class="muted">Espaço para interpretar, revisar a redação e preparar outros documentos. Cada salvamento mantém uma versão anterior.\</p>'+(d.revisao.rev&&d.revisao.hash!==d.hash?'\<div class="warn">As respostas de origem mudaram depois desta análise. A versão anterior foi preservada; vale conferir a revisão.\</div>':'')+'\<label for="texto">Texto consolidado\</label>\<textarea id="texto">'+esc(d.revisao.texto)+'\</textarea>\<label for="notas">Notas internas da gestão\</label>\<textarea class="notes" id="notas">'+esc(d.revisao.notas)+'\</textarea>\<div class="toolbar">\<select id="estado">\<option>Rascunho\</option>\<option>Revisado pela gestão\</option>\</select>\<button class="primary" id="save">Salvar nova revisão\</button>\<button id="download">Baixar texto consolidado\</button>\</div>\<small>Revisão '+d.revisao.rev+(d.revisao.autor?' • '+esc(d.revisao.autor):' • ainda sem versão salva')+'\</small>\</section>\<section class="panel">\<h2>Histórico de versões\</h2>'+d.historico.map(r=>'\<details>\<summary>Revisão '+r.rev+' • '+esc(r.estado)+' • '+esc(r.quando)+'\</summary>\<small>'+esc(r.autor)+'\</small>\<div class="text">'+esc(r.texto)+'\</div>\</details>').join('')+'\</section>';

    }else if(tab==='galeria'){

      html+='\<section class="panel">\<h2>Evidências do diagnóstico\</h2>\<p class="muted">'+d.fotos.length+' arquivos vinculados. As prévias usam as permissões da sua conta no Drive.\</p>\<div class="gallery">'+d.fotos.map((u,i)=>'\<figure>\<div id="photo'+i+'" class="muted">Carregando prévia…\</div>\<figcaption>\<a href="'+esc(u)+'">Arquivo '+(i+1)+' ↗\</a>\<div>'+esc(d.id)+' • '+esc(date(d.data))+'\</div>\</figcaption>\</figure>').join('')+'\</div>'+(d.fotos.length?'':'\<p>Não há arquivos vinculados neste registro.\</p>')+'\</section>';

    }else if(tab==='documentos'){

      html+=documentInputs(d);

    }else{

      html+='\<section class="panel">\<h2>Origem e critérios de leitura\</h2>\<p>Diagnóstico: \<a href="'+esc(d.fonte)+'">'+esc(d.id)+' • Base Consolidada, linha '+d.linha+'\</a>\</p>\<p>Data: realização do procedimento. Chave: ID de migração. Apenas registros com validação aceita entram no painel. Bairros são comparados por nome, desconsiderando acentos, maiúsculas e espaços extras.\</p>\<p>Pergunta da média: '+esc(data.perguntaNota)+'\</p>\<p>Notas vazias, textuais ou fora de 0–10 não entram na média. Pesquisa de atendimento não é misturada com pesquisa de satisfação territorial.\</p>\<h3>Pesquisas usadas na leitura do bairro • '+esc(period)+'\</h3>'+ps.map(p=>'\<div class="item">\<a href="'+esc(p.fonte)+'">'+esc(p.id)+'\</a> • '+esc(date(p.data))+' • nota: '+(p.nota===null?'não informada':esc(p.nota))+'\</div>').join('')+'\<h3>Conferência da integração\</h3>\<p>'+data.warnings.map(esc).join('\<br>')+'\</p>\<p>O cruzamento por bairro contextualiza o território; não estabelece relação causal entre obra e satisfação.\</p>\</section>';

    }

    $('content').innerHTML=html;

    document.querySelectorAll('[data-select]').forEach(el=>el.onclick=()=>{$('diag').value=el.dataset.select;tab='registro';render();});

    if(tab==='analise')bindEdit(d);

    if(tab==='documentos')bindDocuments(d);

    if(tab==='galeria')loadPhotos(d,photoRun);

  }

  function groups(d){return [...new Set(d.fields.map(f=>f.grupo))].map(g=>'\<details open>\<summary>'+esc(g)+'\</summary>\<dl>'+d.fields.filter(f=>f.grupo===g).map(f=>'\<dt>'+esc(f.rotulo)+'\</dt>\<dd>'+esc(f.valor||'Não informado')+'\</dd>').join('')+'\</dl>\</details>').join('');}

const exportDrafts={};let exportToken='';

function documentInputs(d){

 const labels=[['frente','Frente/CT'],['pvInicio','PV início'],['pvFim','PV fim'],['metodo','Método construtivo'],['extensao','Extensão e unidade']];

 const revised=d.revisao.estado==='Revisado pela gestão'&&d.revisao.hash===d.hash;

 return '\<section class="panel">\<h2>Ficha SABESP e apresentação\</h2>\<p class="muted">A ficha utiliza uma cópia do modelo oficial. A apresentação terá composição própria, nas cores do consórcio, com fotos selecionadas. As observações abaixo são o texto desta entrega.\</p>\<div class="grid">'+labels.map(x=>'\<label>'+x[1]+'\<input style="width:100%;margin:6px 0 14px" id="exp_'+x[0]+'" maxlength="'+(x[0]==='frente'?120:300)+'">\</label>').join('')+[['condicao','Condição do pavimento',['','Ruim','Regular','Bom']],['impacto','Nível de impacto',['','Baixo','Médio','Alto']],['padrao','Padrão construtivo predominante',['','Baixo','Médio','Alto']]].map(x=>'\<label>'+x[1]+'\<select style="width:100%;margin:6px 0 14px" id="exp_'+x[0]+'">'+x[2].map(v=>'\<option value="'+v+'">'+(v||'Não informado')+'\</option>').join('')+'\</select>\</label>').join('')+'\</div>\<p class="muted">Frente/CT inicia com o endereço como sugestão para conferência. PV, método e extensão sem informação permanecem com “-”, como no modelo. A descrição da via não determina automaticamente a condição do pavimento.\</p>\<label for="exp_observacoes">Observações consolidadas\</label>\<textarea id="exp_observacoes" maxlength="12000">'+esc(revised?d.revisao.texto:d.textoBase)+'\</textarea>\<p class="muted">'+(revised?'Texto inicial: análise revisada pela gestão.':'Texto inicial: texto-base das respostas, disponível para revisão.')+' As alterações feitas aqui ficam registradas com a entrega. Para atualizar a análise principal, use Análise da gestão.\</p>\<h3>Fotos da apresentação\</h3>\<p class="muted">Até 12 arquivos por apresentação. A ficha oficial conserva a tabela do modelo, sem acrescentar uma galeria.\</p>'+d.fotos.map((u,i)=>'\<label style="display:block;margin:8px 0">\<input type="checkbox" class="exp_photo" value="'+esc(u)+'" '+(i<12?'checked':'')+'> Arquivo '+(i+1)+' \<a href="'+esc(u)+'">Consultar original\</a>\</label>').join('')+'\<p>\<label>\<input id="exp_new" type="checkbox"> Criar uma nova versão mesmo quando o conteúdo for igual\</label>\</p>\<div class="toolbar">\<button class="primary" id="exp_ficha">Gerar ficha SABESP e PDF\</button>\<button class="primary" id="exp_slides">Gerar apresentação\</button>\</div>\<p class="muted">As pesquisas dos slides usarão o mês selecionado no topo do painel. Arquivos anteriores e edições feitas diretamente neles são preservados.\</p>\<div id="exp_result" role="status">\</div>\</section>\<section class="panel">\<h2>Documentos deste diagnóstico\</h2>\<div id="exp_history">Consultando arquivos gerados…\</div>\</section>';

}

function readExport(d){const p={id:d.id,hash:d.hash,rev:d.revisao.rev,mes:$('mes').value,novaVersao:$('exp_new').checked,fotos:[...document.querySelectorAll('.exp_photo:checked')].map(x=>x.value)};['frente','pvInicio','pvFim','metodo','extensao','condicao','impacto','padrao','observacoes'].forEach(k=>p[k]=$('exp_'+k).value);return p;}

function exportLinks(r){return [['documento','Documento editável'],['pdf','PDF da ficha'],['slides','Apresentação Google Slides']].filter(x=>/^https:\\\\/\\\\/(docs|drive)\\\\.google\\\\.com\\\\//.test(r[x[0]]||'')).map(x=>'\<a style="margin-right:16px" href="'+esc(r[x[0]])+'">'+x[1]+' ↗\</a>').join('');}

async function bindDocuments(d){

 const initial={frente:field(d,'Endereço')==='Não informado'?'':field(d,'Endereço'),pvInicio:'',pvFim:'',metodo:'',extensao:'',condicao:'',impacto:'',padrao:''};

 const draft=exportDrafts[d.id];Object.entries(draft||initial).forEach(([k,v])=>{if($('exp_'+k)&&typeof v==='string')$('exp_'+k).value=v;});

 if(draft){document.querySelectorAll('.exp_photo').forEach(e=>e.checked=draft.fotos.includes(e.value));$('exp_new').checked=draft.novaVersao;}

 const change=()=>{exportDrafts[d.id]=readExport(d);exportToken='';};

 document.querySelectorAll('[id^="exp_"] input,[id^="exp_"] select,[id^="exp_"] textarea,input[id^="exp_"],select[id^="exp_"],textarea[id^="exp_"],.exp_photo').forEach(el=>el.oninput=change);

 ['ficha','slides'].forEach(tipo=>$('exp_'+tipo).onclick=async()=>{

   if(busy)return;const p=readExport(d);p.tipo=tipo;p.pedido=exportToken||(exportToken='gd_'+Date.now()+'_'+Math.random().toString(36).slice(2));

   busy=true;$('exp_ficha').disabled=true;$('exp_slides').disabled=true;$('reload').disabled=true;msg('Gerando '+(tipo==='ficha'?'a ficha e o PDF':'a apresentação')+'. A execução pode levar alguns minutos.');

   // Bloqueia o formulário durante a geração para evitar mudanças no pedido em trânsito.

   document.querySelectorAll('#content input,#content textarea,#content select').forEach(e=>e.disabled=true);

   try{const r=await rpc('gerarEntregaTerritorial',p);$('exp_result').innerHTML='\<p>'+(r.reutilizado?'Já existe uma entrega com esse conteúdo.':'Entrega gerada.')+'\</p>'+exportLinks(r)+(r.avisos?'\<div class="warn">'+esc(r.avisos)+'\</div>':'');exportToken='';msg('Arquivos disponíveis para conferência.');await historyDocuments(d);}

   catch(e){msg(e.message+' Se a resposta da execução foi interrompida, consulte o histórico antes de gerar outra versão.');}

   finally{busy=false;$('reload').disabled=false;if($('exp_ficha')){$('exp_ficha').disabled=false;$('exp_slides').disabled=false;document.querySelectorAll('#content input,#content textarea,#content select').forEach(e=>e.disabled=false);}}

 });

 await historyDocuments(d,!draft);

}

async function historyDocuments(d,restore){

 try{const rows=await rpc('listarDocumentosTerritoriais',d.id);if(!selected()||selected().id!==d.id||tab!=='documentos')return;$('exp_history').innerHTML=rows.length?rows.map(r=>'\<div class="item">\<b>'+esc(r.estado)+'\</b> '+esc(r.data)+'\<p>'+exportLinks(r)+'\</p>'+(r.avisos?'\<p class="muted">'+esc(r.avisos)+'\</p>':'')+'\</div>').join(''):'Nenhum documento gerado para este diagnóstico.';

 if(restore&&!exportDrafts[d.id]){const last=rows.find(r=>r.estado==='Concluído'&&r.parametros);if(last){['frente','pvInicio','pvFim','metodo','extensao','condicao','impacto','padrao'].forEach(k=>{const val=last.parametros.oficiais[k];if(val&&val!=='Não informado'&&val!=='-')$('exp_'+k).value=val;});}}

 }catch(e){if($('exp_history'))$('exp_history').textContent='Não foi possível consultar o histórico: '+e.message;}

}



  function bindEdit(d){$('estado').value=d.revisao.estado;['texto','notas','estado'].forEach(id=>$(id).oninput=()=>{dirty=true;});$('useBase').onclick=()=>{if(!$('texto').value||confirm('Substituir o texto em edição pelo texto-base? A versão salva permanece no histórico.')){$('texto').value=d.textoBase;dirty=true;}};$('save').onclick=async()=>{if(busy)return;busy=true;$('save').disabled=true;msg('Salvando revisão…');try{const r=await rpc('salvarAnaliseTerritorial',{id:d.id,rev:d.revisao.rev,hash:d.hash,estado:$('estado').value,texto:$('texto').value,notas:$('notas').value});d.revisao=r;d.historico.unshift(r);dirty=false;render();msg('Revisão '+r.rev+' salva.');}catch(e){msg(e.message);}finally{busy=false;if($('save'))$('save').disabled=false;}};$('download').onclick=()=>{const body='DIAGNÓSTICO • '+d.id+'\\\n'+date(d.data)+' • '+d.bairro+'\\\n'+$('estado').value+(dirty?' • edição ainda não salva':'')+'\\\n\\\n'+$('texto').value+'\\\n\\\nFonte: '+d.fonte;const a=document.createElement('a'),u=URL.createObjectURL(new Blob([body],{type:'text/plain;charset=utf-8'}));a.href=u;a.download='Analise_'+d.id+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};}

  async function loadPhotos(d,run){for(let i=0;i\<d.fotos.length;i++){if(run!==photoRun)return;const u=d.fotos[i];try{const p=photoCache[u]||await rpc('carregarFotoTerritorial',d.id,u);photoCache[u]=p;if(run!==photoRun)return;const el=$('photo'+i);const img=document.createElement('img');img.src=p.src;img.alt=p.nome;el.replaceChildren(img);if(p.video)el.insertAdjacentHTML('beforeend','\<small>Prévia de vídeo\</small>');}catch(e){if(run!==photoRun)return;$('photo'+i).textContent='Prévia indisponível. Consulte o original abaixo.';}}}

  document.querySelectorAll('[data-tab]').forEach(el=>el.onclick=()=>{if(!mayLeave())return;dirty=false;tab=el.dataset.tab;render();});

  let oldB='',oldD='';$('bairro').onfocus=()=>oldB=$('bairro').value;$('diag').onfocus=()=>oldD=$('diag').value;

  $('bairro').onchange=()=>{if(!mayLeave()){$('bairro').value=oldB;return;}dirty=false;fillDiagnoses();oldB=$('bairro').value;};$('diag').onchange=()=>{if(!mayLeave()){$('diag').value=oldD;return;}dirty=false;render();oldD=$('diag').value;};$('mes').onchange=()=>{if(tab==='analise'||tab==='documentos')return;render();};$('reload').onclick=load;

  window\.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});

  $('mes').value=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'}).slice(0,7);load();

  \</script>\</body>\</html>\`;

}



function cptDtNovasFotosDiagnostico_(linha,mapa){

  const ids={},urls=[];

  Object.keys(mapa).filter(k=>/^fotos? do diagnostico(?:$|\s*-)/.test(k)).forEach(k=>{

    (String(linha[mapa[k]]||'').match(/https:\\/\\/(?:drive|docs)\\.google\\.com\\/[^\s,;]+/g)||[]).forEach(u=>{

      const m=u.match(/(?:[?&]id=|\\/d\\/)([\w-]+)/);if(m&&!ids[m[1]]){ids[m[1]]=true;urls.push(u.replace(/[)\]]+$/,''));}

    });

  });return urls;

}
