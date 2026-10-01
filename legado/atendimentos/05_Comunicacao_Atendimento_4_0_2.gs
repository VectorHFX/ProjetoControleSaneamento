// Correção 28/09/2026: detalhes dos concluídos no dia; visual Água preservado.
// Acabamento visual Água 1.0 • 22/09/2026 • regras operacionais preservadas.
/** REVISÃO 20/09/2026 · 05_Comunicacao_Atendimento_4_0_0.gs · SUBSTITUIÇÃO COMPLETA do módulo correspondente. */
/** COMUNICAÇÃO E ACOMPANHAMENTO 2.0 | Instalar SOMENTE no Controle de Atendimentos.
 * Reutiliza painelProcessarFila. E-mails por evento, não por horário fixo.
 * WhatsApp: preparação automática; revisão e envio pela pessoa na janela.
 */
const AD_CONFIG=Object.freeze({FORM_ID:'1TXAPh6z6Y6MX6JLVoY_KhO-u24Fi8TqnbDHUdrkeecE',EXECUCAO_ID:'1Y5zioMOTaJDtp78OPBovXeHhvuns_ZEG6SMyHqng-Uk',FUSO:'America/Sao_Paulo',ABA:'Acompanhamento diário',FILA:'Registro de avisos',PROP:'AD_CONTROLE_V2',ULTIMO:'AD_CONTROLE_PACOTE',ERRO:'AD_CONTROLE_ERRO',LEASE:'AD_CONTROLE_LEASE',EMAILS:['Andre.neves@concrejato.com.br','gustavo.ferreira@concrejato.com.br','erinaldo.silva@concrejato.com.br'],VAZIO:'Nenhuma ordem de serviço em aberto. Consulte o Atendimento.',CAB:['Chave do aviso','Protocolo','Motivo','Detectado em','Estado','Tentativas','Atualizado em','Anexos','Detalhe'],INTERVALO:15*60000});
function ad_props_(){return PropertiesService.getScriptProperties();}
function ad_cfg_(){return JSON.parse(ad_props_().getProperty(AD_CONFIG.PROP)||'null');}
function ad_norm_(v){return fo_normalizar_(v).replace(/[^a-z0-9]+/g,' ').trim();}
function ad_fmt_(v,hora){const d=fo_data_(v);return d?Utilities.formatDate(d,AD_CONFIG.FUSO,hora?'dd/MM/yyyy HH:mm':'dd/MM/yyyy'):'';}
function ad_validarProjeto_(){const ss=SpreadsheetApp.getActiveSpreadsheet();if(!ss||ss.getId()!==FO_CONFIG.CENTRAL_ID)throw new Error('Execute no Apps Script do Controle de Atendimentos.');return ss;}
function ad_ehOS_(r){return af_os_(r.Protocolo,r['Histórico já entregue']);}

function ad_aberto_(r){return ad_ehOS_(r)&&af_aberto_(r.Status);}

function ad_validarBases_(bases){const ids=new Set();bases.forEach(r=>{const id=fo_texto_(r.Protocolo);if(!id)return;if(ids.has(id))throw new Error('Protocolo duplicado na base: '+id);ids.add(id);});}
function ad_opcoes_(bases){ad_validarBases_(bases);return bases.filter(ad_aberto_).sort((a,b)=>fo_texto_(a.Protocolo).localeCompare(fo_texto_(b.Protocolo),undefined,{numeric:true})).map(r=>fo_texto_(r.Protocolo)+' | '+(fo_texto_(r.Nome).replace(/[\r\n|]+/g,' ').trim()||'Nome não informado'));}
function ad_lerFontes_(){
 const ss=hec_central_(),sh=ss.getSheetByName(FO_CONFIG.ABA_BASE_OFICIAL),hist=ss.getSheetByName(FO_CONFIG.ABA_HISTORICO_CENTRAL);
 if(!sh||!hist)throw new Error('Base Fichas Oficiais ou Histórico não localizado.');
 const oficiais=fo_lerRegistrosBaseOficial_(ss),porHistorico=fo_lerHistorico_(hist),comms=painelLerComunicacao_('');if(comms.disponivel===false)throw new Error(comms.aviso);
 const bases=[],rastro=[],comunicacoes={};
 oficiais.forEach(r=>{
  const b={Protocolo:fo_texto_(r.protocolo),Nome:r.nome,Status:r.status,Assunto:r.assunto,Solicitação:r.solicitacao,Endereço:r.endereco,Telefone:r.telefone,'E-mail':r.email,'Frente de obra':r.frente,'Data de abertura':r.dataAbertura,'Data de conclusão':r.dataConclusao,'Área responsável':r.areaProxima,'Última atualização':r.ultimaAtualizacao,'Próxima ação':r.proximaAcao,Urgência:r.urgencia,Procedência:r.procedencia,Solução:r.solucao,Finalização:r.finalizacao,'Descrição detalhada':r.descricaoReclamacao,'Fotos da abertura':r.fotosAbertura,'Fotos da execução':r.fotosSolucao,'Histórico já entregue':r.historicoEntregue};
  if(!ad_ehOS_(b))return;bases.push(b);
  const seen=new Set();(porHistorico[fo_texto_(r.idLegado)]||[]).concat(porHistorico[b.Protocolo]||[],...af_vinculos_().filter(v=>af_resolver_(v.principal)===b.Protocolo).map(v=>porHistorico[v.idOrigem]||[])).forEach(e=>{const key=e.chaveEvento||[e.data,e.origem,e.tipoEvento].join('|');if(seen.has(key))return;seen.add(key);rastro.push({Protocolo:b.Protocolo,'Data e hora':e.data,Usuário:e.usuario,Status:e.status,Procedência:e.procedencia,'Origem da atualização':e.origem,'Tipo de evento':e.tipoEvento,'Área responsável':e.area,'Próxima ação':e.proximaAcao,'Chave do evento':e.chaveEvento,'Data da execução':e.dataExecucao,'Executado por':e.executadoPor,Evidências:e.evidencias});});
  const items=comms.filter(e=>e.protocolo===b.Protocolo),last=items.filter(e=>e.destino&&!e.protocoloOrigem).slice(-1)[0];
  comunicacoes[b.Protocolo]={areaAtual:last&&last.destino||'',dataArea:last&&last.dataHora||null,checklist:painelEstadoChecklist_(items),eventos:items.map(e=>({chave:e.chave,data:ad_fmt_(e.dataHora,true),usuario:e.usuario,area:e.areaAutora,destino:e.destino,tipo:e.tipo,mensagem:e.mensagem,titulo:e.tituloItem,arquivos:e.arquivos}))};
 });
 ad_validarBases_(bases);return {bases,rastro,comunicacoes,comms};
}
function ad_resumirCaso_(r,c){c=c||{};const abertura=fo_data_(r['Data de abertura']);return {id:r.Protocolo,status:af_rotulo_(r.Status),area:ad_fechado_(r.Status)?'Atendimento':af_area_(r.Status,r['Área responsável'],r['Última atualização'],c.areaAtual,c.dataArea),proxima:af_revisao_(r.Status)?af_rotulo_(r.Status):r['Próxima ação']||'Conferir encaminhamento',urgencia:af_prioridade_(r.Urgência,abertura,r.Status).rotulo,pontos:af_prioridade_(r.Urgência,abertura,r.Status).pontos,procedencia:r.Procedência||'Em análise',dias:af_fechado_(r.Status)?'':af_dias_(abertura)};}
function ad_snapshot_(f){f=f||ad_lerFontes_();const s=ad_montar_(f.bases,f.rastro,f.comunicacoes,new Date(),new Date().toISOString());s.assinatura=fo_hash_(JSON.stringify(['4.0.2',s.periodo.inicio,ad_dia_(new Date()),f.bases,f.rastro,f.comunicacoes]));return s;}

function atualizarProtocolosAtivosFormulario(){ad_validarProjeto_();const bases=ad_lerFontes_().bases;return ad_atualizarLista_(bases);}
function ad_atualizarLista_(bases){return ad_lock_(()=>{const item=ad_itemProtocolo_(),opcoes=ad_opcoes_(bases),values=opcoes.length?opcoes:[AD_CONFIG.VAZIO];if(JSON.stringify(item.getChoices().map(c=>c.getValue()))!==JSON.stringify(values))item.setChoiceValues(values);item.setRequired(true).setHelpText(opcoes.length?'Somente ordens de serviço em aberto: protocolo | nome do solicitante. Confira também o caso no painel.':'Nenhuma ordem de serviço em aberto. Para novo caso, use Abrindo no início do formulário.');return {ativos:opcoes.length};});}
function ad_fila_(){const c=ad_cfg_(),ss=hec_central_(),s=c&&ss.getSheets().find(s=>s.getSheetId()===c.fila);if(!s)throw new Error('Registro de avisos não encontrado. Execute instalarComunicacaoAtendimento.');if(JSON.stringify(s.getRange(1,1,1,AD_CONFIG.CAB.length).getValues()[0])!==JSON.stringify(AD_CONFIG.CAB))throw new Error('Cabeçalho do Registro de avisos foi alterado.');return s;}
function ad_linhas_(){const s=ad_fila_();return s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,9).getValues():[];}
function ad_eventos_(f){
 const es=f.bases.map(r=>({chave:'NOVA|'+r.Protocolo,id:r.Protocolo,motivo:'Nova ficha de atendimento'}));
 const ids=new Set(f.bases.map(r=>r.Protocolo));
 f.comms.filter(e=>ids.has(e.protocolo)&&ad_norm_(e.destino)==='execucao').forEach(e=>{if(ad_norm_(e.tipo).includes('checklist')&&ad_norm_(e.situacaoItem)==='concluido')return;es.push({chave:'COM|'+e.chave,id:e.protocolo,motivo:'Encaminhamento para a Execução: '+ad_resumo_(e.mensagem||e.tituloItem||e.tipo,500)});});
 f.bases.forEach(r=>{let area='';f.rastro.filter(e=>e.Protocolo===r.Protocolo).sort((a,b)=>(fo_data_(a['Data e hora'])||0)-(fo_data_(b['Data e hora'])||0)).forEach(e=>{const atual=ad_norm_(e['Área responsável']),tipo=ad_norm_(e['Tipo de evento']);if(atual==='execucao'&&area&&area!=='execucao'&&!/comunicacao|checklist|abertura/.test(tipo)&&e['Chave do evento'])es.push({chave:'HIST|'+e['Chave do evento'],id:r.Protocolo,motivo:'Responsabilidade encaminhada para a Execução: '+fo_texto_(e['Próxima ação'])});if(atual)area=atual;});});
 return es;
}
function ad_detectar_(f,baseline){return ad_lock_(()=>{const s=ad_fila_(),rows=ad_linhas_(),seen=new Set(rows.map(r=>r[0])),agora=new Date(),add=[];ad_eventos_(f).forEach(e=>{if(seen.has(e.chave))return;seen.add(e.chave);add.push([e.chave,e.id,ad_celula_(e.motivo),agora,baseline?'REFERÊNCIA':'PENDENTE',0,agora,'','']);});if(add.length){fo_garantirDimensoes_(s,s.getLastRow()+add.length,9);s.getRange(s.getLastRow()+1,1,add.length,9).setValues(add);}return add.length;});}
function instalarComunicacaoAtendimento(){
 const ss=ad_validarProjeto_();ad_itemProtocolo_();const f=ad_lerFontes_();const owner=Session.getEffectiveUser().getEmail();if(!owner)throw new Error('Execute com a conta responsável pela automação.');
 let cfg=ad_cfg_();if(!cfg){if(ss.getSheetByName(AD_CONFIG.ABA)||ss.getSheetByName(AD_CONFIG.FILA))throw new Error('Há abas com os nomes do novo módulo. Confira antes de instalar.');const home=ss.insertSheet(AD_CONFIG.ABA),fila=ss.insertSheet(AD_CONFIG.FILA);fila.getRange(1,1,1,9).setValues([AD_CONFIG.CAB]);fila.hideSheet();cfg={aba:home.getSheetId(),fila:fila.getSheetId(),owner,ativo:false,baseline:false};ad_props_().setProperty(AD_CONFIG.PROP,JSON.stringify(cfg));}
 if(!cfg.baseline){ad_detectar_(f,true);cfg.baseline=true;ad_props_().setProperty(AD_CONFIG.PROP,JSON.stringify(cfg));}
 ad_atualizarLista_(f.bases);ad_formatar_(ss.getSheets().find(s=>s.getSheetId()===cfg.aba),ad_snapshot_(f));
 try{aoAbrirFichasOficiaisSabesp();}catch(e){console.log('Reabra a planilha para atualizar o menu.');}
 console.log('Instalado no Controle. Fichas anteriores registradas como referência, sem disparos retroativos. Execute ativarAvisosAtendimento.');
}
function ativarAvisosAtendimento(){
 ad_validarProjeto_();const c=ad_cfg_();if(!c||!c.baseline)throw new Error('Execute instalarComunicacaoAtendimento primeiro.');
 const owner=Session.getEffectiveUser().getEmail();if(owner!==c.owner)throw new Error('Ative com a mesma conta que instalou a comunicação: '+c.owner);
 if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='painelProcessarFila'&&String(t.getEventType())==='CLOCK'))throw new Error('Esta conta não possui o gatilho painelProcessarFila. Use a conta que já mantém a automação do Controle.');
 MailApp.getRemainingDailyQuota();c.ativo=true;ad_props_().setProperty(AD_CONFIG.PROP,JSON.stringify(c));console.log('Avisos por ficha nova e encaminhamento ativados. O acompanhamento é atualizado automaticamente a cada 15 minutos quando os dados mudam.');
}
function pausarAvisoDiarioExecutores(){const c=ad_cfg_();if(c){c.ativo=false;ad_props_().setProperty(AD_CONFIG.PROP,JSON.stringify(c));}}
function ad_pasta_(dia){const prop=ad_props_().getProperty('AD_CONTROLE_PASTA');let p;if(prop)p=DriveApp.getFolderById(prop);else{p=DriveApp.createFolder('CPT | Comunicação do Atendimento');ad_props_().setProperty('AD_CONTROLE_PASTA',p.getId());}let it=p.getFoldersByName(dia.slice(0,7));return it.hasNext()?it.next():p.createFolder(dia.slice(0,7));}
function ad_gerar_(s){
 const p=ad_props_(),pedido=p.getProperty('AD_PEDIDO');if(!ad_cfg_())throw Error('Instale a comunicação.');
 s=s||ad_snapshot_();const antes=ad_pacotes_();
 if(antes.atual&&antes.atual.assinatura===s.assinatura){if(p.getProperty('AD_PEDIDO')===pedido)p.deleteProperty('AD_PEDIDO');return antes.atual;}
 ad_limparTemporarios_();
 const pasta=ad_pasta_(s.dia),sufixo=s.dia+'_'+Utilities.formatDate(new Date(),AD_CONFIG.FUSO,'HHmmss')+'_'+Utilities.getUuid().slice(0,8);
 const criados=JSON.parse(p.getProperty('AD_ESTAGIO_V4')||'[]');let temp,publicado=false;
 function lembrar(id){criados.push(id);p.setProperty('AD_ESTAGIO_V4',JSON.stringify(criados));}
 try{
  temp=SpreadsheetApp.create('TMP_CPT_Acompanhamento_'+sufixo);lembrar(temp.getId());DriveApp.getFileById(temp.getId()).moveTo(pasta);
  const sh=temp.getSheets()[0];sh.setName('Acompanhamento');const n=ad_formatar_(sh,s);SpreadsheetApp.flush();
  const root='https://docs.google.com/spreadsheets/d/'+temp.getId()+'/export?';
  const x=pasta.createFile(ad_exportar_(root+'format=xlsx','Acompanhamento_'+sufixo+'.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));lembrar(x.getId());
  const pdf=pasta.createFile(ad_exportar_(root+'format=pdf&size=A4&portrait=false&fitw=true&sheetnames=false&gridlines=false&fzr=true&gid='+sh.getSheetId()+'&r1=0&c1=0&r2='+n+'&c2=7','Acompanhamento_'+sufixo+'.pdf','application/pdf'));lembrar(pdf.getId());
  const pack={versao:4,dia:s.dia,periodo:s.periodo.rotulo,geradoEm:s.geradoEm,assinatura:s.assinatura,abertas:s.abertas.length,encerradas:s.encerradas.length,semana:s.encerradasSemana.length,executadas:s.executadas.length,revisar:s.revisar.length,execucao:s.execucao.length,atendimento:s.atendimento.length,mensagem:ad_mensagem_(s),arquivos:[x,pdf].map(ad_arquivo_)};
  // One manifest publishes both pointers together only after BOTH exports succeed.
  p.setProperty('AD_PACOTES_V4',JSON.stringify({atual:pack,anterior:antes.atual}));publicado=true;
  p.deleteProperty(AD_CONFIG.ERRO);if(p.getProperty('AD_PEDIDO')===pedido)p.deleteProperty('AD_PEDIDO');
  try{ad_reterPacotes_();}catch(e){p.setProperty('AD_LIMPEZA_AVISO','Versão pronta. A limpeza será repetida: '+e.message);}
  return pack;
 }finally{
  // Protect both published versions even if execution stopped just after manifest commit.
  const restantes=ad_limparIds_(criados,ad_protegidos_());
  if(restantes.length)p.setProperty('AD_ESTAGIO_V4',JSON.stringify(restantes));else p.deleteProperty('AD_ESTAGIO_V4');
 }
}

function ad_lease_(){
 const lock=LockService.getUserLock();if(!lock.tryLock(100))return null;
 try{const p=ad_props_(),l=JSON.parse(p.getProperty(AD_CONFIG.LEASE)||'null');if(l&&Date.now()-l.time<7*60000)return null;const token=Utilities.getUuid();p.setProperty(AD_CONFIG.LEASE,JSON.stringify({token,time:Date.now()}));return token;}finally{lock.releaseLock();}
}

function ad_liberar_(token){const l=LockService.getUserLock();if(!l.tryLock(1000))return;try{const p=ad_props_(),atual=JSON.parse(p.getProperty(AD_CONFIG.LEASE)||'null');if(atual&&atual.token===token)p.deleteProperty(AD_CONFIG.LEASE);}finally{l.releaseLock();}}

function gerarAcompanhamentoDiario(){ad_validarProjeto_();if(!ad_cfg_())throw Error('Instale a comunicação primeiro.');ad_props_().setProperty('AD_PEDIDO',String(Date.now()));return {solicitado:true,mensagem:'Atualização solicitada. Os últimos arquivos prontos continuam disponíveis.'};}

function ad_statusLinhas_(selecionadas,estado,detalhe,arquivos){const s=ad_fila_();selecionadas.forEach(x=>{s.getRange(x.row,5,1,5).setValues([[estado,Number(x.v[5]||0)+1,new Date(),arquivos||'',detalhe||'']]);});SpreadsheetApp.flush();}
function ad_enviarPendentes_(f,s){
 let pend=ad_linhas_().map((v,i)=>({v,row:i+2})).filter(x=>['PENDENTE','ERRO'].includes(x.v[4])&&Number(x.v[5]||0)<3).slice(0,4);if(!pend.length)return false;
 const existentes=new Set(f.bases.map(r=>r.Protocolo)),ausentes=pend.filter(x=>!existentes.has(x.v[1]));if(ausentes.length)ad_statusLinhas_(ausentes,'CONFERIR','Protocolo não localizado.');pend=pend.filter(x=>existentes.has(x.v[1]));if(!pend.length)return false;
 const ids=new Set(pend.map(x=>x.v[1]));const selecionadas=f.bases.filter(r=>ids.has(r.Protocolo));if(!selecionadas.length){ad_statusLinhas_(pend,'CONFERIR','Protocolos não localizados.');return false;}
 if(MailApp.getRemainingDailyQuota()<AD_CONFIG.EMAILS.length)throw new Error('Cota de e-mail insuficiente. Avisos preservados na fila.');
 let tentativaEnvio=false;
 try{
  const pacote=ad_gerar_(s),pasta=ad_pasta_(s.dia),p=s.abertas.concat(s.encerradas,s.executadas),all=ad_montar_(selecionadas,f.rastro,f.comunicacoes,new Date(),new Date().toISOString());
  // Inclui também uma ficha nova já concluída na data anterior, sem omitir seu aviso.
  const seen=new Set(all.abertas.concat(all.encerradas,all.executadas).map(x=>x.caso.id));selecionadas.filter(r=>!seen.has(r.Protocolo)).forEach(r=>all.executadas.push({registro:r,caso:ad_resumirCaso_(r,f.comunicacoes[r.Protocolo]),comunicacao:f.comunicacoes[r.Protocolo]||{eventos:[],checklist:[]},rastro:f.rastro.filter(e=>e.Protocolo===r.Protocolo)}));
  const fichas=ad_pdfComunicacoes_(all,pasta,'Avisos_'+s.dia+'_'+Utilities.getUuid().slice(0,8));
  const files=[pacote.arquivos[0].id,pacote.arquivos[1].id,fichas.getId()],blobs=files.map(id=>DriveApp.getFileById(id).getBlob());if(blobs.reduce((n,b)=>n+b.getBytes().length,0)>20*1024*1024)throw new Error('Anexos acima de 20 MB. Consulte os downloads.');
  const motivos=pend.map(x=>x.v[1]+' | '+x.v[2]).join('\n');
  ad_lock_(()=>{const c=ad_cfg_();if(!c.ativo)throw new Error('Avisos pausados durante a preparação.');ad_statusLinhas_(pend,'ENVIO_INICIADO','',files.join('\n'));});tentativaEnvio=true;
  MailApp.sendEmail({to:AD_CONFIG.EMAILS.join(','),subject:'Consórcio Performance Tamanduateí | '+ids.size+' ficha(s) | Novo registro ou encaminhamento à Execução',body:'Olá, equipe.\n\n'+motivos+'\n\n'+pacote.mensagem+'\n\nAnexos: acompanhamento atualizado e fichas de comunicação dos avisos acima. As fotografias do caderno ficam como links dos originais.',attachments:blobs,name:'Consórcio Performance Tamanduateí'});
  // ENVIADO só depois da confirmação do serviço. Não prova leitura pelo destinatário.
  ad_statusLinhas_(pend,'ENVIADO','Aceito pelo serviço de e-mail.',files.join('\n'));return true;
 }catch(e){ad_statusLinhas_(pend,tentativaEnvio?'CONFERIR_ENVIO':'ERRO',e.message);throw e;}
}
function ad_rotina_(){
 const c=ad_cfg_();if(!c||!c.baseline||c.owner!==Session.getEffectiveUser().getEmail())return {ignorado:true};
 const token=ad_lease_();if(!token)return {ocupado:true};
 const p=ad_props_(),avisos=[];
 try{
  ad_limparTemporarios_();
  const f=ad_lerFontes_(),s=ad_snapshot_(f),now=Date.now();
  p.setProperty('AD_CONFERENCIA_V4',JSON.stringify({assinatura:s.assinatura,em:new Date().toISOString()}));
  try{ad_detectar_(f,false);}catch(e){avisos.push('Avisos: '+e.message);}
  if(now-Number(p.getProperty('AD_LISTA_EM')||0)>120000){try{ad_atualizarLista_(f.bases);p.setProperty('AD_LISTA_EM',String(now));}catch(e){avisos.push('Lista do formulário: '+e.message);}}
  try{ad_atualizarAbaDiaria_(s);}catch(e){avisos.push('Aba diária: '+e.message);}
  const ultimo=ad_pacotes_().atual,req=p.getProperty('AD_PEDIDO'),tentativa=Number(p.getProperty('AD_GERACAO_EM')||0);
  if(req||!ultimo||(now-tentativa>=AD_CONFIG.INTERVALO&&ultimo.assinatura!==s.assinatura)){
   p.setProperty('AD_GERACAO_EM',String(now));ad_gerar_(s);
  }else if(c.ativo&&ad_enviarPendentes_(f,s)){}
  else if(p.getProperty('AD_PEDIDO_CADERNO'))ad_gerarCaderno_(s);
  if(now-Number(p.getProperty('AD_LIMPEZA_EM')||0)>3600000)try{ad_reterPacotes_();}catch(e){avisos.push('Limpeza: '+e.message);}
  p.deleteProperty(AD_CONFIG.ERRO);p.setProperty('AD_ROTINA_AVISO',avisos.join('\n'));return {ok:true,avisos};
 }catch(e){p.setProperty(AD_CONFIG.ERRO,new Date().toISOString()+' | '+e.message);console.error(e.stack||e.message);return {ok:false,erro:e.message};}
 finally{ad_liberar_(token);}
}

function ad_estado(){
 ad_validarProjeto_();const p=ad_props_(),config=ad_cfg_();if(!config)throw Error('Instale a comunicação no Controle antes de abrir esta página.');
 const packs=ad_pacotes_(),l=JSON.parse(p.getProperty(AD_CONFIG.LEASE)||'null'),conf=JSON.parse(p.getProperty('AD_CONFERENCIA_V4')||'null');
 return {config,atual:packs.atual,ultimo:packs.atual,anterior:packs.anterior,caderno:JSON.parse(p.getProperty('AD_CADERNO_PRONTO')||'null'),pedido:p.getProperty('AD_PEDIDO')||'',gerando:!!l&&Date.now()-l.time<7*60000,pendente:!!packs.atual&&!!conf&&conf.assinatura!==packs.atual.assinatura,conferidoEm:conf&&conf.em,erro:p.getProperty(AD_CONFIG.ERRO)||'',aviso:[p.getProperty('AD_ROTINA_AVISO'),p.getProperty('AD_LIMPEZA_AVISO')].filter(Boolean).join('\n'),emails:AD_CONFIG.EMAILS,mensagem:JSON.parse(PropertiesService.getUserProperties().getProperty('AD_MENSAGEM')||'null')};
}

function ad_salvarMensagem(p){if(!p||typeof p.saudacao!=='string'||typeof p.texto!=='string'||p.saudacao.length>200||p.texto.length>12000)throw new Error('Confira a mensagem. Limite de 12 mil caracteres.');PropertiesService.getUserProperties().setProperty('AD_MENSAGEM',JSON.stringify(p));return {ok:true};}
function diagnosticarComunicacaoAtendimento(){const e=ad_estado();console.log(JSON.stringify(e,null,2));return e;}
function abrirAcompanhamentoDiario(){painelAbrir_('avisos');}

function ad_lock_(fn){const l=LockService.getUserLock();if(!l.tryLock(1000))throw Error('A rotina de comunicação está ocupada. O pedido será retomado no próximo ciclo.');try{return fn();}finally{l.releaseLock();}}

function ad_dia_(v){const d=fo_data_(v);return d?Utilities.formatDate(d,AD_CONFIG.FUSO,'yyyy-MM-dd'):'';}

function ad_fechado_(status){return /^(concluida|concluido|encerrada|encerrado|atendimento concluido)$/.test(ad_norm_(status));}

function ad_texto_(v){return fo_texto_(v);}

function ad_resumo_(v,n){const t=ad_texto_(v).replace(/\s+/g,' ');return t.length>(n||240)?t.slice(0,(n||240)-1)+'…':t;}

function ad_celula_(v){const t=ad_texto_(v);return /^[=+@-]/.test(t)?"'"+t:t;}

function ad_esc_(s){return ad_texto_(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function ad_itemProtocolo_(){
  const form=FormApp.openById(AD_CONFIG.FORM_ID);
  if(form.getDestinationId()!==AD_CONFIG.EXECUCAO_ID)throw new Error('O formulário não aponta para a planilha de Execução configurada. Confira o vínculo antes de continuar.');
  const itens=form.getItems().filter(i=>ad_norm_(i.getTitle())==='qual o numero de protocolo');
  if(itens.length!==1)throw new Error('Deve existir exatamente uma pergunta chamada Qual o número de protocolo? no formulário.');
  if(itens[0].getType()!==FormApp.ItemType.LIST)throw new Error('No formulário, altere a pergunta Qual o número de protocolo? para Lista suspensa, mantendo a mesma pergunta e título. Depois execute novamente.');
  return itens[0].asListItem();
}





function ad_formatar_(sh,s){
  const grupos=[['EXECUÇÃO | DEMANDAS EM ABERTO',s.execucao],['ATENDIMENTO | TRATATIVA E FINALIZAÇÃO',s.atendimento],['ENCERRADAS NO PERÍODO | SAÍRAM DA FILA',s.encerradas]];
  const linhas=[['CONSÓRCIO PERFORMANCE TAMANDUATEÍ','','','','','',''],['Período: '+s.periodo.rotulo,'','','','','',''],['Consulta: '+ad_fmt_(s.geradoEm,true)+' | cópia da fonte: '+ad_fmt_(s.atualizado,true),'','','','','',''],[s.execucao.length+' COM EXECUÇÃO','',s.atendimento.length+' COM ATENDIMENTO','',s.encerradasSemana.length+' ENCERRADAS NA SEMANA','',''],['','','','','','',''],[s.abertas.length+' demandas em aberto · '+s.encerradas.length+' encerradas no período · '+s.revisar.length+' aguardando revisão e finalização do Atendimento.','','','','','','']];
  const sections=[],heads=[],details=[];
  grupos.forEach(g=>{linhas.push(['','','','','','','']);sections.push(linhas.length+1);linhas.push([g[0],'','','','','','']);heads.push(linhas.length+1);linhas.push(['Protocolo','Resumo da demanda','Endereço','Responsável atual','Próximo movimento','Prioridade','Situação']);if(!g[1].length){linhas.push(['Nenhum registro neste grupo.','','','','','','']);return;}g[1].forEach(x=>{const r=x.registro,c=x.caso;details.push(linhas.length+1);linhas.push([c.id,ad_resumo_([r.Assunto,r.Solicitação].filter(Boolean).join(' · '),300),r.Endereço,c.area,c.proxima,c.urgencia,c.status].map(ad_celula_));});});
  linhas.push(['','','','','','',''],['Período operacional: meio-dia a meio-dia, horário de São Paulo. Movimentações contadas pelo horário do registro no histórico. Uso interno.','','','','','','']);
  fo_garantirDimensoes_(sh,linhas.length,7);sh.getDataRange().breakApart().clearContent().clearFormat();
  const range=sh.getRange(1,1,linhas.length,7);range.setValues(linhas).setFontFamily('Arial').setFontSize(11).setFontColor('#173D54').setBackground('#FFFFFF').setWrap(true).setVerticalAlignment('middle');
  [110,260,210,140,235,90,130].forEach((w,i)=>sh.setColumnWidth(i+1,w));sh.setHiddenGridlines(true);sh.setTabColor('#009FE3');sh.setFrozenRows(6);
  [1,2,3,6,linhas.length].forEach(r=>sh.getRange(r,1,1,7).merge());
  sh.getRange(1,1,2,7).setBackground('#073B56').setFontColor('#FFFFFF').setFontWeight('bold');sh.getRange('A1').setFontSize(20);sh.setRowHeight(1,40);sh.setRowHeight(2,28);sh.setRowHeight(3,25);sh.setRowHeight(6,36);
  [['A4:B5','#E4F1FF'],['C4:D5','#E3F3E9'],['E4:G5','#FFF0E5']].forEach(c=>sh.getRange(c[0]).merge().setBackground(c[1]).setFontWeight('bold').setFontSize(15).setHorizontalAlignment('center'));
  sections.forEach(r=>{sh.getRange(r,1,1,7).merge().setBackground('#078C91').setFontColor('#FFFFFF').setFontWeight('bold');sh.setRowHeight(r,30);});
  heads.forEach(r=>{sh.getRange(r,1,1,7).setBackground('#DCEAF2').setFontWeight('bold');sh.setRowHeight(r,30);});
  details.forEach((r,i)=>{sh.getRange(r,1,1,7).setBackground(i%2?'#F0F5F8':'#FFFFFF');sh.getRange(r,1).setFontWeight('bold');sh.getRange(r,6,1,2).setHorizontalAlignment('center');sh.setRowHeight(r,90);});
  sh.autoResizeRows(7,Math.max(1,linhas.length-6));return linhas.length;
}

function ad_exportar_(url,nome,mime){
  for(let i=0;i<3;i++){
    const res=UrlFetchApp.fetch(url,{headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true});
    const code=res.getResponseCode();if(code===200){const blob=res.getBlob();if(/text\/html|application\/json/.test(blob.getContentType()))throw new Error('A exportação não retornou um arquivo válido: '+nome);return blob.setContentType(mime).setName(nome);}
    if(![429,500,502,503,504].includes(code)||i===2)throw new Error('Falha ao exportar '+nome+' (HTTP '+code+'). Nenhum e-mail foi enviado.');Utilities.sleep(700*(i+1));
  }
}

function ad_pdfComunicacoes_(s,pasta,sufixo){
  const mapa={};s.abertas.concat(s.encerradas,s.executadas).forEach(x=>mapa[x.caso.id]=x);
  const lista=Object.keys(mapa).map(id=>mapa[id]);const doc=DocumentApp.create('Fichas_Comunicacao_'+sufixo),id=doc.getId();
  try{
    const b=doc.getBody();b.clear();b.setMarginTop(30).setMarginBottom(30).setMarginLeft(35).setMarginRight(35);
    b.appendParagraph('CPT | FICHAS DE COMUNICAÇÃO').setHeading(DocumentApp.ParagraphHeading.TITLE).editAsText().setForegroundColor('#073B56');
    b.appendParagraph('Consórcio Performance Tamanduateí | '+ad_fmt_(s.geradoEm,true));
    b.appendParagraph(lista.length+' ficha(s). Uso interno. Contém as demandas em aberto e as fichas movimentadas no dia. Não substitui os documentos oficiais Sabesp.').editAsText().setFontSize(10);
    if(!lista.length)b.appendParagraph('Nenhuma ficha em aberto ou movimentada neste dia.');
    lista.forEach(x=>{
      b.appendPageBreak();const r=x.registro,c=x.caso;
      b.appendParagraph(c.id+' | '+(r.Assunto||'Atendimento')).setHeading(DocumentApp.ParagraphHeading.HEADING1).editAsText().setForegroundColor('#073B56').setBold(true);
      ad_tabelaDoc_(b,[['Situação / responsável atual',c.status+' | '+c.area],['Abertura / conclusão',ad_fmt_(r['Data de abertura'])+' | '+ad_fmt_(r['Data de conclusão'])],['Solicitante',r.Nome],['Endereço / frente',[r.Endereço,r['Frente de obra']].filter(Boolean).join(' | ')],['Contato',[r.Telefone,r['E-mail']].filter(Boolean).join(' | ')],['Procedência / prioridade',c.procedencia+' | '+c.urgencia],['Próximo movimento',c.proxima]]);
      ad_blocoDoc_(b,'DEMANDA',r.Solicitação||r.Assunto);if(r['Descrição detalhada'])ad_blocoDoc_(b,'CONTEXTO',r['Descrição detalhada']);
      ad_blocoDoc_(b,'PROVIDÊNCIAS REGISTRADAS',r.Solução);ad_blocoDoc_(b,'RESULTADO ATUAL',r.Finalização);
      const np=x.rastro.filter(e=>ad_norm_(e.Procedência)==='nao procedente').sort((a,z)=>(fo_data_(a['Data e hora'])||0)-(fo_data_(z['Data e hora'])||0)).pop();
      if(np)ad_blocoDoc_(b,'REGISTRO DE NÃO PROCEDÊNCIA',ad_fmt_(np['Data e hora'],true)+' | '+np.Usuário+' | '+np['Origem da atualização']);
      const eventos=x.comunicacao.eventos||[],check=x.comunicacao.checklist||[];
      ad_blocoDoc_(b,'COMPROMISSOS COMPARTILHADOS',check.map(t=>'['+t.situacao+'] '+t.titulo+' | '+t.destino+(t.prazo?' | '+t.prazo:'')).join('\n')||'Nenhum compromisso compartilhado.');
      ad_blocoDoc_(b,'COMUNICAÇÃO ENTRE ÁREAS',eventos.map(e=>e.data+' | '+e.area+' → '+(e.destino||'Registro')+' | '+e.usuario+'\n'+(e.mensagem||e.titulo||e.tipo)+(e.arquivos?'\nArquivos: '+e.arquivos:'')).join('\n\n')||'Nenhuma mensagem compartilhada.');
      // Apenas rastro executivo, sem notas internas do Atendimento e sem marcar mensagens como lidas.
      ad_blocoDoc_(b,'RASTREABILIDADE',x.rastro.map(e=>ad_fmt_(e['Data e hora'],true)+' | '+e['Tipo de evento']+' | '+e.Usuário+' | '+e.Status+(e['Executado por']?' | Execução: '+e['Executado por']:'' )).join('\n')||'Sem eventos copiados.');
      const links=[r['Fotos da abertura'],r['Fotos da execução']].filter(Boolean).join('\n');
      if(links)ad_blocoDoc_(b,'EVIDÊNCIAS | LINKS DOS ORIGINAIS',links);
      b.appendParagraph('Fotografias incorporadas e ficha individual: disponíveis no Painel Executivo, em Ficha de comunicação.').editAsText().setFontSize(9).setForegroundColor('#607487');
    });
    doc.saveAndClose();return pasta.createFile(DriveApp.getFileById(id).getAs(MimeType.PDF).setName('Fichas_Comunicacao_'+sufixo+'.pdf'));
  }finally{try{doc.saveAndClose();DriveApp.getFileById(id).setTrashed(true);}catch(e){console.warn('Documento temporário preservado: '+id);}}
}

function ad_secaoDoc_(corpo, titulo) {
  const p = corpo.appendParagraph(titulo);
  p.setSpacingBefore(12).setSpacingAfter(5);
  p.editAsText().setBold(true).setForegroundColor('#073B56');
}


function ad_blocoDoc_(corpo, titulo, texto) {
  ad_secaoDoc_(corpo, titulo);
  corpo.appendParagraph(fo_texto_(texto) || 'Não informado.');
}


function ad_tabelaDoc_(corpo, pares) {
  const linhas = pares.filter(function(par) { return fo_texto_(par[1]); })
    .map(function(par) { return [par[0], fo_texto_(par[1])]; });
  if (!linhas.length) return;
  const tabela = corpo.appendTable(linhas);
  for (let i = 0; i < tabela.getNumRows(); i++) {
    tabela.getRow(i).getCell(0).setBackgroundColor('#E8F1F5');
    tabela.getRow(i).getCell(0).editAsText().setBold(true);
  }
}


const AD_HTML=`<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box}body{margin:0;background:#eff5f9;color:#12394e;font:var(--ui-font,16px) Arial,sans-serif}header{padding:22px 26px;background:#073b56;color:white;border-top:4px solid #ed1b2f}h1{margin:0 0 6px;font-size:25px}h2{font-size:20px;margin:0 0 14px}h3{font-size:16px;margin:0 0 8px}main{padding:20px;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.8fr);gap:18px}.card{background:white;border:1px solid #d7e4ed;border-radius:14px;padding:22px;min-width:0}.wide{grid-column:1/-1}button,a.btn{display:inline-block;background:#087e91;color:white;border:0;border-radius:8px;padding:12px 15px;font:inherit;cursor:pointer;text-decoration:none;margin:4px 6px 4px 0}button.secondary,a.secondary{background:#e5eef4;color:#12394e}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid #009fe3;outline-offset:3px}button:disabled{opacity:.55;cursor:wait}input,textarea,select{font:inherit;width:100%;padding:11px;border:1px solid #b6ccd9;border-radius:7px;margin:6px 0 12px}textarea{min-height:85px;resize:vertical}p,small{line-height:1.5}small{color:#526e80}.stamp{font-size:13px;color:#526e80}#preview{white-space:pre-wrap;background:#f1f8fa;padding:18px;border-left:4px solid #009fe3;line-height:1.5;min-height:200px}#status{padding:12px 24px;color:#075669;background:#e9f5f7}#error{color:#a41c2e;white-space:pre-wrap}#warning{white-space:pre-wrap;font-size:13px;color:#71521d}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0 18px}.kpis div{background:#eef6fb;padding:12px;border-radius:9px}.kpis b{display:block;font-size:29px;margin-bottom:4px}.kpis div:first-child{border-top:3px solid #e78332}.kpis div:nth-child(2){border-top:3px solid #009fe3}.kpis div:last-child{border-top:3px solid #15926d}.versions{border-top:1px solid #dde6ed;padding-top:14px;margin-top:16px}.file-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.file-row>a:not(.btn){font-size:12px;color:#255775}.message-layout{display:grid;grid-template-columns:.8fr 1.2fr;gap:22px}summary{cursor:pointer;font-weight:bold;line-height:1.5}table{width:100%;border-collapse:collapse;font-size:14px}td,th{text-align:left;padding:10px;border-bottom:1px solid #dde6ed;vertical-align:top}.info{border-left:3px solid #00a1df;padding-left:12px}@media(max-width:850px){main,.message-layout{grid-template-columns:1fr}.wide{grid-column:auto}}

@media screen{body,:host{background:#f5fafd;color:#163c55}header{background:linear-gradient(115deg,#f0faff,#fff);color:#07588f;border-top:4px solid #009ee0;border-bottom:1px solid #d5e6ee;border-radius:0 0 28px 0;padding:24px}main{padding:20px;gap:18px}.card{border-radius:18px;border-color:#d5e6ee;box-shadow:0 4px 18px #06477805}button,a.btn{background:#007cba;color:#fff;border-radius:11px;min-height:44px}button.secondary,a.secondary{background:#eaf6fc;color:#07588f}input,select,textarea{border-radius:10px;border-color:#bfd7e4;max-width:100%;min-width:0}.kpis div{background:#f0f9fd;border-radius:12px}.kpis b{color:#07588f}#preview{background:#f0f9fd;border-radius:0 14px 14px 0}#status{background:#eaf8ff;color:#07588f}main>*{min-width:0}@media(max-width:850px){main,.message-layout{grid-template-columns:1fr}}@media(max-width:480px){header,main,.card{padding:16px}.kpis{grid-template-columns:1fr}.kpis div{display:flex;align-items:center;gap:12px}.kpis b{margin:0}h1{font-size:23px}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}}
</style></head><body><header><h1>Comunicação do dia</h1>Consórcio Performance Tamanduateí · Atendimento e Execução</header><div id="status" role="status" aria-live="polite">Buscando a última versão pronta…</div><main>
<section class="card"><h2>1. Baixar o acompanhamento</h2><div class="kpis"><div><b id="execution">—</b>com Execução</div><div><b id="care">—</b>com Atendimento</div><div><b id="done">—</b>encerradas no período</div></div><p id="updated" class="stamp"></p><div id="files"></div><p><button class="secondary" id="generate">Preparar versão atualizada</button><button class="secondary" id="refresh">Consultar situação</button></p><small>Você pode baixar a versão pronta durante a atualização. Uma nova versão substitui a atual somente após Excel e PDF estarem completos.</small><details class="versions"><summary>Backup da versão anterior</summary><p id="backupDate" class="stamp"></p><div id="backup"></div><small>Mantemos duas versões completas. Arquivos de acompanhamento mais antigos são movidos à lixeira automaticamente.</small></details><details class="versions"><summary>Caderno completo de fichas</summary><p id="bookDate" class="stamp"></p><div id="bookFiles"></div><button class="secondary" id="book">Preparar caderno completo</button><p><small>Preparação separada do acompanhamento. Confira a data antes de enviar.</small></p></details></section>
<section class="card"><h2>Avisos automáticos</h2><p id="active"></p><p>Ficha nova ou encaminhamento à Execução entra na fila de e-mail, com acompanhamento e fichas de comunicação.</p><small id="recipients"></small><p><button id="enable">Ativar avisos</button><button class="secondary" id="pause">Pausar avisos</button></p><p class="info"><small>Atualização do acompanhamento a cada 15 minutos quando há mudanças, ou por solicitação. A rotina existente prepara os arquivos em segundo plano.</small></p><p id="error" role="alert"></p><p id="warning"></p></section>
<section class="card wide"><h2>2. Preparar a mensagem e enviar</h2><div class="message-layout"><div><label>Saudação<select id="greeting"><option>Bom dia, equipe!</option><option>Boa tarde, equipe!</option><option>Boa noite, equipe!</option><option value="">Sem saudação</option><option value="custom">Personalizar…</option></select></label><input id="custom" placeholder="Sua saudação" hidden maxlength="200"><label>Texto de abertura<textarea id="intro" placeholder="Segue o acompanhamento das demandas."></textarea></label><button class="secondary" id="save">Salvar meu texto</button><p><small>Os números são os da versão pronta para baixar. O período vira ao meio-dia. A semana começa na segunda-feira.</small></p></div><div><div id="preview"></div><button id="copy">Copiar mensagem</button><button id="whatsapp">Abrir WhatsApp</button><p><small>Escolha o contato ou grupo e anexe o PDF ou Excel baixado acima. O envio é feito por você.</small></p></div></div></section>
<section class="card wide"><details><summary>Consultar os últimos avisos por e-mail</summary><button class="secondary" id="eventsLoad">Carregar avisos</button><div style="overflow:auto"><table><thead><tr><th>Protocolo</th><th>Motivo</th><th>Situação</th><th>Atualizado</th></tr></thead><tbody id="events"></tbody></table></div><small>ENVIADO indica aceite do serviço de e-mail. CONFERIR_ENVIO requer conferir o envio antes de tentar novamente.</small></details></section>
</main><script>
let state=null,initialized=false,loading=false;const el=id=>document.getElementById(id);function say(t){el('status').textContent=t}function failure(e){loading=false;say('Não foi possível concluir: '+e.message+'. Os downloads já prontos continuam disponíveis.')}function stamp(t){return t?new Date(t).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'—'}
function greeting(){return el('greeting').value==='custom'?el('custom').value:el('greeting').value}
function message(){return [greeting(),el('intro').value,state&&state.atual?state.atual.mensagem:'Aguardando a primeira versão do acompanhamento.'].filter(Boolean).join('\\n\\n')}
function preview(){el('custom').hidden=el('greeting').value!=='custom';el('preview').textContent=message()}
function links(target,p){const host=el(target);host.replaceChildren();if(!p)return;(p.arquivos||[]).forEach(f=>{const row=document.createElement('div'),a=document.createElement('a'),drive=document.createElement('a');row.className='file-row';a.className='btn';a.textContent=/xlsx$/i.test(f.nome)?'↓ Baixar Excel':'↓ Baixar PDF';a.href=f.download;a.title=f.nome;a.target='_blank';a.rel='noopener';drive.textContent='Abrir no Drive';drive.href='https://drive.google.com/file/d/'+encodeURIComponent(f.id)+'/view';drive.target='_blank';drive.rel='noopener';row.append(a,drive);host.append(row)});}
function load(){if(loading)return;loading=true;google.script.run.withFailureHandler(failure).withSuccessHandler(function(s){loading=false;render(s)}).ad_estado()}
function render(s){state=s;const p=s.atual;el('active').textContent=s.config&&s.config.ativo?'● E-mails automáticos ativos':'E-mails automáticos pausados';el('recipients').textContent=s.emails.join(' · ');el('error').textContent=s.erro?'A última tentativa não terminou: '+s.erro:'';el('warning').textContent=s.aviso||'';el('execution').textContent=p&&p.execucao!==undefined?p.execucao:'—';el('care').textContent=p&&p.atendimento!==undefined?p.atendimento:'—';el('done').textContent=p?p.encerradas:'—';el('updated').textContent=p?'Versão pronta · '+stamp(p.geradoEm)+(s.pendente?' · há mudanças aguardando preparação':''):'Primeira preparação pendente.';links('files',p);links('backup',s.anterior);el('backupDate').textContent=s.anterior?stamp(s.anterior.geradoEm):'O backup estará disponível após a segunda preparação.';links('bookFiles',s.caderno?{arquivos:[s.caderno]}:null);el('bookDate').textContent=s.caderno?'Caderno preparado em '+stamp(s.caderno.geradoEm):'Nenhum caderno preparado.';
 if(!initialized){const m=s.mensagem||{saudacao:'Bom dia, equipe!',texto:'Segue o acompanhamento das demandas para alinharmos as próximas ações.'};const choices=Array.from(el('greeting').options).map(o=>o.value);if(choices.includes(m.saudacao))el('greeting').value=m.saudacao;else{el('greeting').value='custom';el('custom').value=m.saudacao}el('intro').value=m.texto;initialized=true;}preview();el('copy').disabled=!p;el('whatsapp').disabled=!p;say(s.gerando?'Preparando a próxima versão. Baixe normalmente a versão pronta.':s.pedido?'Atualização solicitada. A versão pronta continua disponível.':p?'Arquivos disponíveis. Última preparação: '+stamp(p.geradoEm):'Solicite a primeira preparação.');}
el('generate').onclick=function(){say('Solicitando atualização…');google.script.run.withFailureHandler(failure).withSuccessHandler(load).gerarAcompanhamentoDiario()};el('refresh').onclick=load;
el('book').onclick=function(){google.script.run.withFailureHandler(failure).withSuccessHandler(()=>say('Caderno solicitado. Os acompanhamentos permanecem disponíveis.')).solicitarCadernoComunicacao()};
el('enable').onclick=function(){google.script.run.withFailureHandler(failure).withSuccessHandler(load).ativarAvisosAtendimento()};el('pause').onclick=function(){google.script.run.withFailureHandler(failure).withSuccessHandler(load).pausarAvisoDiarioExecutores()};
el('greeting').onchange=preview;el('custom').oninput=preview;el('intro').oninput=preview;el('save').onclick=function(){google.script.run.withFailureHandler(failure).withSuccessHandler(()=>say('Texto salvo.')).ad_salvarMensagem({saudacao:greeting(),texto:el('intro').value})};
el('eventsLoad').onclick=function(){google.script.run.withFailureHandler(failure).withSuccessHandler(function(rows){el('events').replaceChildren();rows.forEach(v=>{const tr=document.createElement('tr');[v.id,v.motivo,v.estado+(v.erro?' · '+v.erro:''),v.quando].forEach(t=>{const td=document.createElement('td');td.textContent=t;tr.append(td)});el('events').append(tr)});say(rows.length+' aviso(s) consultado(s).');}).ad_consultarAvisos()};
el('copy').onclick=async function(){try{await navigator.clipboard.writeText(message());say('Mensagem copiada.')}catch(e){say('Selecione e copie o texto da prévia.')}};
el('whatsapp').onclick=function(){if(state&&state.atual)window.open('https://api.whatsapp.com/send?text='+encodeURIComponent(message()),'_blank','noopener')};
setInterval(function(){if(window.document.hidden||!el('files').isConnected||el('files').getClientRects().length===0)return;load()},15000);load();
</script></body></html>`;

function ad_periodo_(agora){const dia=Utilities.formatDate(agora,AD_CONFIG.FUSO,'yyyy-MM-dd');let inicio=new Date(dia+'T12:00:00-03:00');if(agora<inicio)inicio=new Date(inicio.getTime()-86400000);const fim=new Date(inicio.getTime()+86400000);return {inicio:inicio.toISOString(),fim:fim.toISOString(),rotulo:ad_fmt_(inicio,true)+' até '+ad_fmt_(fim,true)};}

function ad_downloadsProntos(){ad_validarProjeto_();return ad_pacotes_().atual;}

function solicitarCadernoComunicacao(){ad_validarProjeto_();if(!ad_cfg_())throw Error('Instale a comunicação primeiro.');ad_props_().setProperty('AD_PEDIDO_CADERNO',String(Date.now()));return {solicitado:true};}
function ad_gerarCaderno_(s){const pedido=ad_props_().getProperty('AD_PEDIDO_CADERNO');const arquivo=ad_pdfComunicacoes_(s,ad_pasta_(s.dia),'Completo_'+s.dia+'_'+Utilities.getUuid().slice(0,8));const f={id:arquivo.getId(),nome:arquivo.getName(),download:'https://drive.google.com/uc?export=download&id='+arquivo.getId(),geradoEm:s.geradoEm,assinatura:s.assinatura};ad_props_().setProperty('AD_CADERNO_PRONTO',JSON.stringify(f));if(ad_props_().getProperty('AD_PEDIDO_CADERNO')===pedido)ad_props_().deleteProperty('AD_PEDIDO_CADERNO');return f;}

function ad_atualizarAbaDiaria_(s){
 const ss=hec_central_(),aba=ss.getSheetByName(AD_CONFIG.ABA);if(!aba)return;
 const chave='AD_ABA_ASSINATURA',p=ad_props_();if(p.getProperty(chave)===s.assinatura)return;
 ad_formatar_(aba,s);SpreadsheetApp.flush();p.setProperty(chave,s.assinatura);
}

function ad_pacotes_(){
 const p=ad_props_(),novo=p.getProperty('AD_PACOTES_V4');
 if(novo)return JSON.parse(novo);
 return {atual:JSON.parse(p.getProperty(AD_CONFIG.ULTIMO)||'null'),anterior:null};
}

function ad_arquivo_(f){return {id:f.getId(),nome:f.getName(),download:'https://drive.google.com/uc?export=download&id='+f.getId()};}

function ad_limparIds_(ids,protegidos){
 const erros=[];Array.from(new Set(ids||[])).filter(id=>id&&!protegidos.has(id)).forEach(id=>{try{DriveApp.getFileById(id).setTrashed(true);}catch(e){erros.push(id);}});return erros;
}

function ad_protegidos_(){const p=ad_pacotes_();return new Set([p.atual,p.anterior].filter(Boolean).flatMap(x=>(x.arquivos||[]).map(f=>f.id)));}

function ad_limparTemporarios_(){
 const p=ad_props_(),ids=JSON.parse(p.getProperty('AD_ESTAGIO_V4')||'[]'),restantes=ad_limparIds_(ids,ad_protegidos_());
 if(restantes.length)p.setProperty('AD_ESTAGIO_V4',JSON.stringify(restantes));else p.deleteProperty('AD_ESTAGIO_V4');
}

function ad_reterPacotes_(){
 const p=ad_props_(),root=p.getProperty('AD_CONTROLE_PASTA');if(!root)return;
 const protegidos=ad_protegidos_();if(!protegidos.size)return;
 const inicio=Date.now(),raiz=DriveApp.getFolderById(root),pastas=[raiz],it=raiz.getFolders();
 while(it.hasNext()){const f=it.next();if(/^\d{4}-\d{2}$/.test(f.getName()))pastas.push(f);}
 let erros=0,removidos=0;
 for(const pasta of pastas){const fs=pasta.getFiles();while(fs.hasNext()){
  if(Date.now()-inicio>15000){p.setProperty('AD_LIMPEZA_AVISO','Limpeza parcial; continuará no próximo ciclo.');return;}
  const f=fs.next(),nome=f.getName();
  if(!/^Acompanhamento_\d{4}-\d{2}-\d{2}_\d{6}_[a-zA-Z0-9]+\.(xlsx|pdf)$/.test(nome)||protegidos.has(f.getId()))continue;
  if(!['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(f.getMimeType()))continue;
  try{f.setTrashed(true);removidos++;}catch(e){erros++;}
 }}
 p.setProperty('AD_LIMPEZA_EM',String(Date.now()));
 if(erros)p.setProperty('AD_LIMPEZA_AVISO',erros+' arquivo(s) antigo(s) sem permissão para mover à lixeira.');else p.deleteProperty('AD_LIMPEZA_AVISO');
 return {removidos,erros};
}

function ad_consultarAvisos(){ad_validarProjeto_();return ad_linhas_().filter(r=>r[4]!=='REFERÊNCIA').slice(-30).reverse().map(r=>({id:r[1],motivo:r[2],estado:r[4],quando:ad_fmt_(r[6],true),erro:r[8]}));}

function ad_encerramento_(x,agora){
  if(!ad_fechado_(x.registro.Status))return null;
  const dates=x.rastro.filter(e=>ad_fechado_(e.Status)&&/finalizacao|encerramento/.test(ad_norm_(e['Tipo de evento'])+' '+ad_norm_(e['Origem da atualização']))).map(e=>fo_data_(e['Data e hora'])).filter(d=>d&&d<=agora).sort((a,b)=>b-a);
  if(dates.length)return dates[0];
  const explicit=fo_data_(x.registro['Data de conclusão']);return explicit&&explicit<=agora?explicit:null;
}
function ad_montar_(bases,rastro,comunicacoes,agora,atualizado){
  ad_validarBases_(bases);const periodo=ad_periodo_(agora),dentro=v=>{const t=fo_data_(v);return t&&t.getTime()>=Date.parse(periodo.inicio)&&t.getTime()<Date.parse(periodo.fim)&&t<=agora;};
  const day=ad_dia_(agora),local=new Date(day+'T00:00:00-03:00'),semana=new Date(local.getTime()-((local.getUTCDay()+6)%7)*86400000);
  // Indexa o histórico uma vez, sem varrer todos os eventos para cada ficha.
  const byProtocol=new Map();rastro.forEach(e=>{if(!byProtocol.has(e.Protocolo))byProtocol.set(e.Protocolo,[]);byProtocol.get(e.Protocolo).push(e);});
  const casos=bases.filter(r=>ad_ehOS_(r)&&!af_incorporado_(r.Protocolo)).map(r=>({registro:r,caso:ad_resumirCaso_(r,comunicacoes[r.Protocolo]),comunicacao:comunicacoes[r.Protocolo]||{eventos:[],checklist:[]},rastro:byProtocol.get(r.Protocolo)||[]})).sort((a,b)=>painelOrdenarCarteira_(a.caso,b.caso));
  casos.forEach(x=>x.encerramento=ad_encerramento_(x,agora));
  const abertas=casos.filter(x=>ad_aberto_(x.registro)),executadas=casos.filter(x=>x.rastro.some(e=>ad_norm_(e['Tipo de evento'])==='execucao'&&dentro(e['Data e hora']))),encerradas=casos.filter(x=>dentro(x.encerramento)),encerradasSemana=casos.filter(x=>x.encerramento&&x.encerramento>=semana&&x.encerramento<=agora),encerradasHoje=casos.filter(x=>x.encerramento&&ad_dia_(x.encerramento)===day);
  const revisar=abertas.filter(x=>af_revisao_(x.registro.Status)),execucao=abertas.filter(x=>x.caso.area==='Execução'),atendimento=abertas.filter(x=>x.caso.area==='Atendimento');
  if(abertas.length!==execucao.length+atendimento.length)throw Error('Responsabilidade inconsistente: confira a classificação da carteira.');
  return {dia:day,periodo,geradoEm:agora.toISOString(),atualizado,abertas,encerradas,encerradasSemana,encerradasHoje,executadas,revisar,execucao,atendimento,outras:[]};
}
function ad_mensagem_(s){
  const clean=v=>fo_texto_(v).replace(/\s+/g,' ').trim(),today=(s.encerradasHoje||[]).slice().sort((a,b)=>clean(a.caso.id).localeCompare(clean(b.caso.id),undefined,{numeric:true}));
  const detalhes=today.length?today.map(x=>'• '+clean(x.caso.id)+' | '+(clean(x.registro.Nome)||'Nome não informado')+' | '+(clean(x.registro.Assunto)||'Assunto não informado')).join('\n'):'Nenhum atendimento concluído nesta data.';
  return 'Consórcio Performance Tamanduateí\n\nExecução: '+s.execucao.length+' em aberto.\nAtendimento: '+s.atendimento.length+' em aberto.\nEncerradas no período: '+s.encerradas.length+'.\nEncerradas nesta semana: '+s.encerradasSemana.length+'.\n\nConcluídos em '+s.dia.split('-').reverse().join('/')+': '+today.length+'\n'+detalhes+'\n\nPeríodo operacional: '+s.periodo.rotulo+'\nA lista de concluídos considera o dia civil, no horário de São Paulo.\nAtualizado em '+ad_fmt_(s.geradoEm,true)+'.';
}
