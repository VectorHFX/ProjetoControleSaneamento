// Acabamento visual Água 1.0 • 22/09/2026 • regras operacionais preservadas.
/** REVISÃO 20/09/2026 · 03_Painel_Atendimento_3_5_0.gs · SUBSTITUIÇÃO COMPLETA do módulo correspondente. */
/** Cadastro de atendimentos antigos já encerrados. Instalar no Controle de Atendimentos.
 * Fonte: Base Encerrados Manuais, com revisões anexadas, nunca sobrescritas pelo script.
 * O cadastro histórico mantém fonte própria. O painel de encerramento atualiza Histórico e Dashboard. Requer Fichas Oficiais 2.9.
 */
const HEC_CONFIG = Object.freeze({
  FORM: 'Cadastrar encerrado', BASE: 'Base Encerrados Manuais', LISTA: 'Encerrados cadastrados',
  CAB: ['Identificador', 'Revisão', 'Registrado em', 'Responsável pelo cadastro', 'Motivo da revisão', 'Dados do registro'],
  CAMPOS: [
    ['referencia', 'Referência da ficha ou documento anterior *'],
    ['protocoloAnterior', 'Protocolo anterior, se houver'],
    ['dataAbertura', 'Data de abertura da ficha *'],
    ['dataConclusao', 'Data efetiva do encerramento *'],
    ['nome', 'Nome do solicitante *'],
    ['telefone', 'Telefone'], ['email', 'E-mail'],
    ['endereco', 'Endereço do solicitante *'],
    ['localAtendimento', 'Local do atendimento *'],
    ['responsavel', 'Responsável pelo atendimento *'],
    ['canalRecebimento', 'Canal de recebimento *'],
    ['tipo', 'Tipo de manifestação *'], ['frente', 'Frente de obra *'],
    ['assunto', 'Assunto *'], ['solicitacao', 'Solicitação do morador *'],
    ['tratativaInicial', 'Tratativa inicial'], ['solucao', 'O que foi realizado *'],
    ['finalizacao', 'Resultado e devolutiva ao morador *'],
    ['procedencia', 'Procedência *'],
    ['natureza', 'Forma de encerramento *'],
    ['fotosAbertura', 'Links das fotos da abertura'], ['fotosSolucao', 'Links das fotos da execução'],
    ['jaEnviado', 'Ficha já enviada à Sabesp? *'],
    ['autor', 'Responsável por este cadastro *'], ['motivo', 'Motivo desta inclusão ou correção *']
  ]
});

const PAINEL_ATENDIMENTO_V3 = Object.freeze({
  VERSAO: '3.5.0',
  EXECUCAO_ID: '1Y5zioMOTaJDtp78OPBovXeHhvuns_ZEG6SMyHqng-Uk',
  ABA_COMUNICACAO: 'Comunicação entre Áreas',
  MARCADOR_REMOCAO: '[[REMOVER]]',
  AREAS: Object.freeze(['Atendimento','Execução']),
  CABECALHOS_COMUNICACAO: Object.freeze([
    'Chave do evento', 'Protocolo', 'Data e hora', 'Registrado por',
    'Área autora', 'Encaminhado para', 'Tipo de registro', 'Mensagem',
    'Título do item', 'Chave do item', 'Situação do item', 'Prioridade',
    'Prazo', 'Arquivos', 'Lido pelo Atendimento em',
    'Lido pela Execução em', 'Origem', 'Versão'
  ])
});

const PAINEL_EDITOR_CAMPOS = Object.freeze([
  {chave: 'dataAbertura', campo: 'Data de abertura', obrigatorio: true},
  {chave: 'horario', campo: 'Horário do atendimento', obrigatorio: false},
  {chave: 'localAtendimento', campo: 'Local do atendimento', obrigatorio: true},
  {chave: 'responsavel', campo: 'Responsável pelo atendimento', obrigatorio: true},
  {chave: 'nome', campo: 'Nome do solicitante', obrigatorio: true},
  {chave: 'telefone', campo: 'Telefone', obrigatorio: false, removivel: true},
  {chave: 'email', campo: 'E-mail', obrigatorio: false, removivel: true},
  {chave: 'endereco', campo: 'Endereço', obrigatorio: true},
  {chave: 'assunto', campo: 'Assunto principal', obrigatorio: true},
  {chave: 'tipo', campo: 'Tipo de manifestação', obrigatorio: true},
  {chave: 'solicitacao', campo: 'Texto da solicitação', obrigatorio: true},
  {chave: 'descricao', campo: 'Descrição detalhada da ocorrência', removivel: true},
  {chave: 'providencias', campo: 'Providências executadas', obrigatorio: false},
  {chave: 'conclusao', campo: 'Conclusão ou devolutiva final', obrigatorio: false},
  {chave: 'fotosAbertura', campo: 'Fotos da abertura', removivel: true},
  {chave: 'fotosExecucao', campo: 'Fotos da execução', removivel: true}
]);

function hec_central_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
  if (!ss || ss.getId() !== FO_CONFIG.CENTRAL_ID) {
    throw new Error('Abra o Apps Script do Controle de Atendimentos para usar este cadastro.');
  }
  return ss;
}

function instalarCadastroEncerrados(){painelPrepararCadastro_();aoAbrirFichasOficiaisSabesp();}

function hec_linha_(chave) {
  const indice = HEC_CONFIG.CAMPOS.findIndex(function(c){return c[0] === chave;});
  if (indice < 0) throw new Error('Campo de cadastro desconhecido.');
  return indice + 7;
}

function abrirCadastroEncerrados(){painelAbrirCadastro();}

function hec_validarCabecalho_(aba) {
  const h = aba.getRange(1, 1, 1, HEC_CONFIG.CAB.length).getValues()[0];
  if (JSON.stringify(h) !== JSON.stringify(HEC_CONFIG.CAB)) {
    throw new Error('A estrutura da Base Encerrados Manuais mudou. Nenhum registro foi alterado.');
  }
}

function hec_lerUltimos_(ss) {
  const aba = ss.getSheetByName(HEC_CONFIG.BASE), ultimos = Object.create(null);
  if (!aba) return ultimos;
  hec_validarCabecalho_(aba);
  if (aba.getLastRow() < 2) return ultimos;
  aba.getRange(2, 1, aba.getLastRow() - 1, 6).getValues().forEach(function(linha, i){
    if (linha.every(function(v){return v === '' || v === null;})) return;
    let r;
    try { r = JSON.parse(linha[5]); } catch(e) { throw new Error('Revisar linha ' + (i+2) + ' da Base Encerrados Manuais: registro ilegível.'); }
    const chave = String(linha[0]), anterior = ultimos[chave];
    if (!/^HIST\d{4}-[A-F0-9]{12}$/.test(chave) || r.chave !== chave ||
        Number(linha[1]) !== (anterior ? anterior.revisao + 1 : 1)) {
      throw new Error('Sequência de revisão inválida na linha ' + (i+2) + ' da Base Encerrados Manuais.');
    }
    ['dataAbertura','dataConclusao','registradoEm'].forEach(function(k){
      r[k] = new Date(r[k]); if (isNaN(r[k].getTime())) throw new Error('Data inválida no registro ' + chave);
    });
    ultimos[chave] = {revisao:Number(linha[1]), registro:r};
  });
  return ultimos;
}

function hec_dataObrigatoria_(valor, rotulo) {
  if (valor instanceof Date && !isNaN(valor.getTime())) return new Date(valor.getTime());
  const m = String(valor || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]),Number(m[2])-1,Number(m[1]));
    if (d.getFullYear()===Number(m[3]) && d.getMonth()===Number(m[2])-1 && d.getDate()===Number(m[1])) return d;
  }
  throw new Error(rotulo + ': informe uma data válida no formato dd/mm/aaaa.');
}

function hec_validarEntrada_(entrada, agora) {
  const r = Object.assign({}, entrada);
  HEC_CONFIG.CAMPOS.forEach(function(c){
    if (c[0] === 'dataAbertura' || c[0] === 'dataConclusao') return;
    r[c[0]] = fo_texto_(r[c[0]]);
    if (c[1].indexOf('*') >= 0 && !fo_textoNarrativoLimpo_(r[c[0]])) throw new Error('Preencha: ' + c[1].replace(' *',''));
    if (/^\s*=/.test(r[c[0]])) throw new Error('Use texto, não fórmula, no campo ' + c[1]);
  });
  r.dataAbertura = hec_dataObrigatoria_(r.dataAbertura,'Data de abertura');
  r.dataConclusao = hec_dataObrigatoria_(r.dataConclusao,'Data de encerramento');
  if (r.dataAbertura.getFullYear()<2000 || r.dataConclusao<r.dataAbertura || r.dataConclusao>agora) {
    throw new Error('Confira as datas: encerramento não pode ser anterior à abertura nem futuro.');
  }
  if (['Sim','Não'].indexOf(r.jaEnviado)<0) throw new Error('Informe se a ficha já foi enviada à Sabesp.');
  if (['Procedente','Não procedente','Em análise'].indexOf(r.procedencia)<0) throw new Error('Selecione a procedência.');
  if (['Conclusão confirmada pelo morador','Encerramento administrativo sem resposta','Encerramento documentado em ficha anterior'].indexOf(r.natureza)<0) throw new Error('Selecione a forma de encerramento.');
  if (JSON.stringify(r).length > 40000) throw new Error('Registro muito extenso. Use links para documentos complementares.');
  return r;
}

function hec_assinaturaCaso_(r) {
  return [fo_formatarData_(r.dataAbertura),fo_normalizar_(r.nome),fo_normalizar_(r.endereco),fo_normalizar_(r.solicitacao)].join('|');
}

function salvarCadastroEncerrado() {
  const ss=hec_central_(), form=ss.getSheetByName(HEC_CONFIG.FORM);
  if (!form) throw new Error('Execute instalarCadastroEncerrados primeiro.');
  const trava=LockService.getScriptLock(); trava.waitLock(30000);
  let chave;
  try {
    if (form.getRange(7,2,HEC_CONFIG.CAMPOS.length,1).getFormulas().some(function(r){return Boolean(r[0]);})) {
      throw new Error('O cadastro aceita valores e textos. Retire as fórmulas dos campos.');
    }
    const valores=form.getRange(7,2,HEC_CONFIG.CAMPOS.length,1).getValues();
    const entrada={}; HEC_CONFIG.CAMPOS.forEach(function(c,i){entrada[c[0]]=valores[i][0];});
    const agora=new Date(), r=hec_validarEntrada_(entrada,agora);
    const ultimos=hec_lerUltimos_(ss);
    chave=fo_texto_(form.getRange('B4').getValue()).toUpperCase();
    const revisao=Number(form.getRange('B5').getValue() || 0);
    if (chave && (!ultimos[chave] || ultimos[chave].revisao!==revisao)) {
      throw new Error('Carregue o registro novamente antes de corrigir. A revisão está desatualizada ou o identificador não existe.');
    }
    if (!chave && revisao) throw new Error('Use Novo cadastro antes de incluir outro caso.');
    if (chave && HEC_CONFIG.CAMPOS.every(function(c){
      return String(r[c[0]]) === String(ultimos[chave].registro[c[0]]);
    })) throw new Error('Este conteúdo já está salvo. Nenhuma nova revisão foi criada.');
    const assinatura=hec_assinaturaCaso_(r);
    Object.keys(ultimos).forEach(function(k){
      if (k!==chave && (hec_assinaturaCaso_(ultimos[k].registro)===assinatura ||
          fo_normalizar_(ultimos[k].registro.referencia)===fo_normalizar_(r.referencia))) {
        throw new Error('Possível cadastro repetido: ' + k + '. Confira a referência e carregue-o para corrigir.');
      }
    });
    const atuais=fo_lerRegistrosBaseOficial_(ss);
    atuais.forEach(function(caso){
      if (caso.chave!==chave && !/^HIST\d{4}-/.test(caso.chave) &&
          (hec_assinaturaCaso_(caso)===assinatura ||
           (r.protocoloAnterior && fo_normalizar_(r.protocoloAnterior)===fo_normalizar_(caso.protocolo)))) {
        throw new Error('Este caso pode já estar no sistema: '+caso.protocolo+'. Abra-o no Painel de Trabalho para corrigir ou encerrar.');
      }
    });
    if (!chave) {
      do { chave='HIST'+r.dataAbertura.getFullYear()+'-'+Utilities.getUuid().replace(/-/g,'').slice(0,12).toUpperCase(); }
      while (ultimos[chave]);
    }
    r.chave=chave; r.registradoEm=agora;
    r.usuario=Session.getActiveUser().getEmail() || '';
    const base=ss.getSheetByName(HEC_CONFIG.BASE);
    if (base.getLastRow()+1>base.getMaxRows()) base.insertRowsAfter(base.getMaxRows(),100);
    base.getRange(base.getLastRow()+1,1,1,6).setValues([[chave,revisao+1,agora,r.autor,r.motivo,JSON.stringify(r)]]);
    // O registro é confirmado na fonte antes de atualizar a apresentação.
    form.getRange('B4:B5').setValues([[chave],[revisao+1]]);
    SpreadsheetApp.flush();
  } finally { trava.releaseLock(); }
  try {
    sincronizarBaseFichasOficiais();
    ss.toast('Registro salvo: '+chave+'. Os anexos seguem a atualização já configurada.','Encerrado cadastrado',8);
  } catch(erro) {
    throw new Error('O cadastro '+chave+' FOI SALVO. A apresentação não atualizou: '+erro.message+'. Use Sincronizar e revisar; não cadastre novamente.');
  }
}

function carregarCadastroEncerrado() {
  const ss=hec_central_(), form=ss.getSheetByName(HEC_CONFIG.FORM);
  if (!form) throw new Error('Instale o cadastro primeiro.');
  const chave=fo_texto_(form.getRange('B4').getValue()).toUpperCase();
  const item=hec_lerUltimos_(ss)[chave];
  if (!item) throw new Error('Identificador não encontrado. Confira B4.');
  form.getRange(7,2,HEC_CONFIG.CAMPOS.length,1).setValues(HEC_CONFIG.CAMPOS.map(function(c){
    return [c[0]==='motivo'?'':item.registro[c[0]] || ''];
  }));
  form.getRange('B5').setValue(item.revisao); abrirCadastroEncerrados();
}

function consultarCadastrosEncerrados() {
  const ss=hec_central_(), registros=hec_lerUltimos_(ss);
  let aba=ss.getSheetByName(HEC_CONFIG.LISTA);
  if (!aba) aba=ss.insertSheet(HEC_CONFIG.LISTA);
  const linhas=Object.keys(registros).map(function(k){
    const r=registros[k].registro;
    return [k,r.nome,r.dataAbertura,r.dataConclusao,r.jaEnviado,r.referencia,registros[k].revisao];
  });
  aba.getRange(1,1,Math.max(aba.getLastRow(),3),7).clearContent();
  aba.getRange('A1:G1').merge().setValue('ENCERRADOS CADASTRADOS');
  aba.getRange('A2:G2').merge().setValue('Consulta legada. Para revisar um cadastro histórico, use o Painel de Trabalho do Atendimento.');
  aba.getRange('A2:G2').setWrap(true);aba.setRowHeight(2,44);
  aba.getRange(3,1,1,7).setValues([['Identificador','Nome','Abertura','Encerramento','Já enviado à Sabesp?','Referência anterior','Revisão']]);
  if (linhas.length) {
    if (aba.getMaxRows()<linhas.length+3) aba.insertRowsAfter(aba.getMaxRows(),linhas.length+3-aba.getMaxRows());
    aba.getRange(4,1,linhas.length,7).setValues(linhas).setWrap(true);
    aba.getRange(4,3,linhas.length,2).setNumberFormat('dd/MM/yyyy');
  }
  [235,250,120,120,150,270,85].forEach(function(largura,i){aba.setColumnWidth(i+1,largura);});
  aba.getRange(3,1,1,7).setBackground('#123B5D').setFontColor('#FFFFFF').setFontWeight('bold');
  aba.setFrozenRows(3);aba.setHiddenGridlines(true);aba.showSheet();ss.setActiveSheet(aba);
}

function novoCadastroEncerrado() {
  const ss=hec_central_(), form=ss.getSheetByName(HEC_CONFIG.FORM);
  if (!form) throw new Error('Instale o cadastro primeiro.');
  const ui=SpreadsheetApp.getUi();
  if (ui.alert('Novo cadastro','Limpar apenas os campos desta tela? Os registros salvos permanecem no histórico.',ui.ButtonSet.YES_NO)!==ui.Button.YES) return;
  form.getRange('B4:B5').clearContent();
  form.getRange(7,2,HEC_CONFIG.CAMPOS.length,1).clearContent();
}

function hec_registrosOficiais_(ss, existentes) {
  const ultimos=hec_lerUltimos_(ss);
  return Object.keys(ultimos).map(function(chave){
    const item=ultimos[chave].registro;
    // Validação também na leitura: uma fonte corrompida não pode apagar a base derivada.
    hec_validarEntrada_(item,new Date());
    const anterior=existentes.porChave[chave] || {};
    const registro=Object.assign({},anterior,{
      chave:chave, protocolo:chave, idLegado:chave,
      origem:'Cadastro manual de encerrados', linhaControle:'',
      dataAbertura:item.dataAbertura, dataConclusao:item.dataConclusao, horario:'',
      localAtendimento:item.localAtendimento,responsavel:item.responsavel,
      assunto:item.assunto,tipo:item.tipo,nome:item.nome,telefone:item.telefone,email:item.email,
      endereco:item.endereco,frente:item.frente,solicitacao:item.solicitacao,
      solucao:fo_textoNarrativoLimpo_(fo_juntarTextosUnicos_([item.tratativaInicial,item.solucao])),
      finalizacao:fo_textoNarrativoLimpo_(fo_juntarTextosUnicos_([
        item.natureza==='Encerramento administrativo sem resposta'?'Encerramento administrativo sem confirmação do morador.':'',item.finalizacao])),
      status:'Concluída', fotosAbertura:item.fotosAbertura,fotosSolucao:item.fotosSolucao,
      procedencia:item.procedencia,canalRecebimento:item.canalRecebimento,
      urgencia:'Atendimento concluído',areaProxima:'Atendimento concluído',proximaAcao:'Nenhuma pendência',
      carimboFonte:item.registradoEm,ultimaAtualizacao:item.registradoEm,
      situacaoVinculo:'Cadastro manual conferido',historicoEntregue:item.jaEnviado==='Sim'?'SIM':'',
      encerradoLegado:'',revisaoObrigatoria:'',motivoRevisao:'',descricaoReclamacao:'',
      documentoId:anterior.documentoId || '',pdfId:anterior.pdfId || '',
      hashOficial:anterior.hashOficial || '',ultimaGeracao:anterior.ultimaGeracao || '',
      assinaturaControle:''
    });
    registro.camposFaltantes=fo_camposFaltantes_(registro).join(', ');
    return registro;
  });
}

function painelPrepararCadastro_() {
  const ss=hec_central_();
  let base=ss.getSheetByName(HEC_CONFIG.BASE);
  if (!base) {
    base=ss.insertSheet(HEC_CONFIG.BASE);
    base.getRange(1,1,1,6).setValues([HEC_CONFIG.CAB]);base.setFrozenRows(1);base.hideSheet();
  } else hec_validarCabecalho_(base);
  const antiga=ss.getSheetByName(HEC_CONFIG.FORM);
  if (antiga) {
    const rascunho=antiga.getRange(7,2,HEC_CONFIG.CAMPOS.length,1).getValues().some(function(r){return fo_texto_(r[0]);});
    if (!rascunho) antiga.hideSheet();
  }
}

function painelAbrir_(modo) {
  hec_central_();
  if (typeof painelHtml_ !== 'function') {
    throw new Error('Atualize também o arquivo Painel de Trabalho Atendimento.gs.');
  }
  const html = HtmlService.createHtmlOutput(painelHtml_(modo))
    .setWidth(1440)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(
    html,
    'Atendimento | Painel de Trabalho 3.5.0'
  );
}
function painelAbrirEncerramento(){painelAbrir_('encerrar');}
function painelAbrirCadastro(){painelAbrir_('historico');}
function painelAbrirFicha(){painelAbrir_('ficha');}
function painelAbrirComunicacao(){painelAbrir_('comunicacao');}

function painelIniciar() {
  const ss = hec_central_();
  const registros = fo_lerRegistrosBaseOficial_(ss);
  const comunicacao = painelLerComunicacao_('');
  const porProtocolo = painelIndexarComunicacao_(comunicacao);
  const agora = new Date();
  const casos = registros.filter(function(r) {
    return af_os_(r.protocolo,r.historicoEntregue);
  }).map(function(r) {
    const interacoes = porProtocolo[r.protocolo] || [];
    const ultima = interacoes.filter(e => e.destino && !e.protocoloOrigem).slice(-1)[0] || null;
    const abertura = fo_data_(r.dataAbertura);
    const prioridade = af_prioridade_(r.urgencia, abertura, r.status, agora);
    const dias = prioridade.dias;
    const destino = ultima && fo_texto_(ultima.destino);
    const naoLidas = interacoes.filter(function(item) {
      return painelEhArea_(item.destino, 'Atendimento') && !item.lidoAtendimento;
    }).length;
    return {
      id: r.protocolo,
      nome: r.nome,
      assunto: r.assunto || "",
      resumo: fo_texto_(r.solicitacao || r.descricaoDetalhada || r.assunto).slice(0,240),
      endereco: r.endereco,
      status: r.status,
      abertura: fo_formatarData_(r.dataAbertura),
      dias: dias,
      area: af_area_(r.status,r.areaProxima,r.ultimaAtualizacao,destino,ultima && ultima.dataHora),
      proxima: af_revisao_(r.status) ? af_rotulo_(r.status) : r.proximaAcao || 'Conferir o atendimento',
      urgencia: af_prioridade_(r.urgencia,r.dataAbertura,r.status).rotulo,
      pontos: af_prioridade_(r.urgencia,r.dataAbertura,r.status).pontos, prioridadeOriginal:r.urgencia,
      motivoPrioridade: af_prioridade_(r.urgencia,r.dataAbertura,r.status).motivo,
      procedencia: r.procedencia || 'Em análise',
      ultima: painelFormatarDataHora_(
        ultima ? ultima.dataHora : r.ultimaAtualizacao
      ),
      ultimaOutraArea: painelUltimaOutraArea_(interacoes, 'Atendimento'),
      naoLidas: naoLidas,
      revisao: r.revisaoObrigatoria === 'SIM',
      pdf: Boolean(r.pdfId),
      historico: /^HIST/.test(r.chave)
    };
  }).sort(painelOrdenarCarteira_);
  const abertos = casos.filter(function(c) { return af_aberto_(c.status); });
  return {
    versao: PAINEL_ATENDIMENTO_V3.VERSAO,
    casos: casos,
    indicadores: {
      abertos: abertos.length,
      atendimento: abertos.filter(function(c) {
        return painelEhArea_(c.area, 'Atendimento');
      }).length,
      execucao: abertos.filter(function(c) {
        return painelEhArea_(c.area, 'Execução');
      }).length,
      urgentes: abertos.filter(function(c) {
        return /alto|urgente/i.test(fo_normalizar_(c.urgencia));
      }).length,
      naoLidas: abertos.reduce(function(total, c) { return total + c.naoLidas; }, 0)
    },
    historicos: painelHistoricos(),
    mesAtual: Utilities.formatDate(
      new Date(), Session.getScriptTimeZone(), 'yyyy-MM'
    ),
    campos: PAINEL_CAMPOS,
    areas: painelAreasDisponiveis_(registros),
    ultimaSolicitacao: painelUltimaSolicitacao(),
    pacoteAnterior: PropertiesService.getScriptProperties()
      .getProperty(FO_CONFIG.PROPRIEDADE_MES_FILA) || '',
    comunicacaoDisponivel: comunicacao.disponivel !== false,
    avisoComunicacao: comunicacao.aviso || ''
  };
}

function painelHistoricos() {
  const registros=hec_lerUltimos_(hec_central_());
  return Object.keys(registros).map(function(k){return {id:k,nome:registros[k].registro.nome};});
}

function painelAssinatura_(ss,protocolo) {
  const aba=ss.getSheetByName(FO_CONFIG.ABA_HISTORICO_CENTRAL);
  const eventos=aba?aba.getDataRange().getValues().filter(function(r){return fo_texto_(r[0])===protocolo;}):[];
  return fo_hash_(JSON.stringify(eventos));
}

function painelCarregarFicha(protocolo) {
  const ss = hec_central_();
  const r = fo_lerRegistrosBaseOficial_(ss).find(function(item) {
    return item.protocolo === protocolo;
  });
  if (!r) {
    throw new Error('Atendimento não encontrado. Atualize o painel e tente novamente.');
  }
  const historico = painelHistoricoCaso_(ss, r.idLegado || protocolo);
  const comunicacao = painelComunicacao(protocolo, true);
  const camposPublicos = painelCamposPublicos_(r);
  return {
    id: r.protocolo,
    chave: r.chave,
    nome: r.nome,
    endereco: r.endereco,
    abertura: fo_formatarData_(r.dataAbertura),
    status: r.status,
    urgencia: af_prioridade_(r.urgencia,r.dataAbertura,r.status).rotulo,
      pontos: af_prioridade_(r.urgencia,r.dataAbertura,r.status).pontos, prioridadeOriginal:r.urgencia,
      motivoPrioridade: af_prioridade_(r.urgencia,r.dataAbertura,r.status).motivo,
    area: af_area_(r.status,r.areaProxima,r.ultimaAtualizacao,comunicacao.areaAtual,comunicacao.dataArea),
    proxima: af_revisao_(r.status) ? af_rotulo_(r.status) : r.proximaAcao || comunicacao.proximaAcao || '',
    solicitacao: r.solicitacao,
    providencias: fo_textoPublico_(r.solucao),
    conclusao: fo_textoPublico_(r.finalizacao),
    responsavel: r.responsavel,
    procedencia: r.procedencia,
    camposPublicos: camposPublicos,
    fotos: painelFotosFicha_(r),
    historicoOperacional: historico,
    comunicacao: comunicacao,
    assinatura: painelAssinaturaCompleta_(ss, r, protocolo),
    assinaturaEncerramento: painelAssinatura_(ss, protocolo),
    acaoId: Utilities.getUuid(),
    historicoManual: /^HIST/.test(r.chave),
    revisaoObrigatoria: r.revisaoObrigatoria === 'SIM',
    motivoRevisao: r.motivoRevisao || '',
    documento: r.documentoId
      ? 'https://docs.google.com/document/d/' + r.documentoId + '/edit' : '',
    pdf: r.pdfId ? 'https://drive.google.com/file/d/' + r.pdfId + '/view' : '',
    ultimaGeracao: r.ultimaGeracao
      ? painelFormatarDataHora_(r.ultimaGeracao) : 'Ainda não gerada'
  };
}

function painelGerarFichaExecutar_(protocolo) {
  hec_central_();
  sincronizarBaseFichasOficiais();
  const r=fo_lerRegistrosBaseOficial_(hec_central_()).find(function(x){return x.protocolo===protocolo;});
  if (!r) throw new Error('Protocolo não encontrado.');
  if (r.historicoEntregue==='SIM') throw new Error('Este cadastro está marcado como já enviado. Altere essa indicação no cadastro se precisar gerar outra ficha.');
  const gerado=gerarFichaOficialPorProtocolo_(protocolo,true);
  return {pdf:'https://drive.google.com/file/d/'+gerado.pdfId+'/view',documento:'https://docs.google.com/document/d/'+gerado.documentoId+'/edit',protocolo:protocolo};
}

function painelValidarEncerramento_(p,r) {
  if (p.semPesquisa === true && (!fo_texto_(p.motivoSemPesquisa) || /^\s*=/.test(p.motivoSemPesquisa) || String(p.motivoSemPesquisa).length>2000)) throw new Error('Informe o motivo do encerramento sem pesquisa, com até 2.000 caracteres.');
  ['tratativa','devolutiva','resultado','responsavel','canal','dataContato'].forEach(function(k){
    if (!fo_texto_(p[k])) throw new Error('Preencha '+({tratativa:'o que foi realizado',devolutiva:'a devolutiva ao morador',resultado:'o resultado do contato',responsavel:'o responsável',canal:'o canal interno do contato',dataContato:'a data da devolutiva'}[k])+'.');
  });
  if (!fo_textoPublico_(p.tratativa)||!fo_textoPublico_(p.devolutiva)) throw new Error('Descreva a providência e a devolutiva com respostas completas.');
  if (['Cliente informado e ciente','Cliente informado, mas discordou'].indexOf(p.resultado)<0) throw new Error('O contato ainda não foi concluído. Mantenha o caso aberto e registre as tentativas em Demandas do Atendimento.');
  if (!/^[a-f0-9-]{36}$/i.test(p.acaoId||'')) throw new Error('Recarregue o atendimento antes de confirmar.');
  ['tratativa','devolutiva','responsavel','canal'].forEach(function(k){if (/^\s*=/.test(p[k]) || String(p[k]).length>20000) throw new Error('Use texto simples, com até 20 mil caracteres, em '+k+'.');});
  const data=hec_dataObrigatoria_(p.dataContato,'Data da devolutiva');
  const abertura=fo_data_(r.dataAbertura);if(abertura)abertura.setHours(0,0,0,0);
  if (data>new Date() || (abertura && data<abertura)) throw new Error('Confira a data: deve estar entre a abertura da ficha e hoje.');
  return data;
}

function painelEncerrarExecutar_(p) {
  const ss=hec_central_(),trava=LockService.getScriptLock();trava.waitLock(30000);
  let salvo=false;
  try {
    const historico=ss.getSheetByName(FO_CONFIG.ABA_HISTORICO_CENTRAL);
    if (!historico) throw new Error('Histórico não encontrado.');
    const chave='ENCERRAMENTO_PAINEL|'+fo_texto_(p.acaoId);
    const dados=historico.getDataRange().getValues();
    if (dados.some(function(l){return l[0]===p.protocolo&&l[17]===chave;})) return {mensagem:'Este encerramento já foi salvo. Use Ficha para Sabesp para gerar o PDF atualizado.'};
    const r=fo_lerRegistrosBaseOficial_(ss).find(function(x){return x.protocolo===p.protocolo;});
    if (!r || !fo_deveEncerrarPeloAtendimento_(r)) throw new Error('Este atendimento já está concluído ou não está disponível para encerramento.');
    if (painelAssinatura_(ss,p.protocolo)!==p.assinatura) throw new Error('Há uma nova atualização deste caso. Selecione o atendimento novamente para conferir antes de encerrar.');
    const data=painelValidarEncerramento_(p,r),agora=new Date();
    fo_garantirDimensoes_(historico,historico.getLastRow()+2,21);
    const linha=historico.getLastRow()+1;
    historico.getRange(linha,1,1,21).setValues([[
      r.protocolo,agora,p.autor||Session.getActiveUser().getEmail()||p.responsavel,'Concluída',r.procedencia,p.responsavel,
      fo_texto_(p.tratativa),FO_CONFIG.ABA_ENCERRAMENTO_ATENDIMENTO,chave,'',
      'Encerrado pelo Atendimento sem pesquisa de satisfação. Motivo: '+(fo_texto_(p.motivoSemPesquisa)||'Finalização direta registrada no painel.')+' | Canal interno: '+fo_texto_(p.canal)+' | Resultado do contato: '+fo_texto_(p.resultado),
      '','',
      fo_texto_(p.devolutiva),
      'Finalização','Atendimento concluído','Nenhuma pendência',chave,data,p.responsavel,''
    ]]);
    salvo=true;
    fo_refletirEncerramentoNoDashboard_(ss,r.protocolo,r.procedencia,p.responsavel,agora);
    fo_sincronizarBaseFichasOficiaisSemTrava_();
    if (PropertiesService.getScriptProperties().getProperty(FO_CONFIG.PROPRIEDADE_CONTROLE_ATIVO)==='SIM') fo_atualizarControleManifestacoesSemTrava_();
    return {mensagem:'Atendimento encerrado sem pesquisa de satisfação. Motivo e responsável registrados no histórico; nenhuma nota foi criada. Use Ficha para Sabesp para gerar o PDF atualizado.'};
  } catch(e) {
    if (salvo) throw new Error('O encerramento FOI SALVO. A atualização visual falhou: '+e.message+'. Use Sincronizar e revisar; não registre outro encerramento.');
    throw e;
  } finally {trava.releaseLock();}
}

function painelCarregarHistorico(chave) {
  const item=hec_lerUltimos_(hec_central_())[chave];
  if (!item) throw new Error('Cadastro histórico não encontrado.');
  const r=Object.assign({},item.registro);
  ['dataAbertura','dataConclusao'].forEach(function(k){r[k]=fo_formatarData_(r[k]);});
  delete r.registradoEm;r.motivo='';
  return {dados:r,chave:chave,revisao:item.revisao};
}

function painelSalvarHistoricoExecutar_(p) {
  const ss=hec_central_(),trava=LockService.getScriptLock();trava.waitLock(30000);
  let chave;
  try {
    const r=hec_validarEntrada_(p.dados,new Date()),ultimos=hec_lerUltimos_(ss);
    if(p.pedidoId){const repetido=Object.keys(ultimos).find(function(k){return ultimos[k].registro.pedidoId===p.pedidoId;});if(repetido)return {chave:repetido,revisao:ultimos[repetido].revisao,mensagem:'Este cadastro já foi salvo.'};}
    r.pedidoId=p.pedidoId||'';
    chave=fo_texto_(p.chave).toUpperCase();const revisao=Number(p.revisao||0);
    if (chave&&(!ultimos[chave]||ultimos[chave].revisao!==revisao)) throw new Error('Outra revisão foi salva. Carregue o cadastro novamente.');
    if (!chave&&revisao) throw new Error('Selecione Novo cadastro para iniciar outro registro.');
    if (chave&&HEC_CONFIG.CAMPOS.every(function(c){return String(r[c[0]])===String(ultimos[chave].registro[c[0]]);})) return {chave:chave,revisao:revisao,mensagem:'Este conteúdo já está salvo.'};
    const assinatura=hec_assinaturaCaso_(r);
    Object.keys(ultimos).forEach(function(k){if(k!==chave&&(hec_assinaturaCaso_(ultimos[k].registro)===assinatura||fo_normalizar_(ultimos[k].registro.referencia)===fo_normalizar_(r.referencia))) throw new Error('Possível cadastro repetido: '+k+'. Selecione esse cadastro na lista para corrigir.');});
    fo_lerRegistrosBaseOficial_(ss).forEach(function(c){if(!/^HIST/.test(c.chave)&&(hec_assinaturaCaso_(c)===assinatura||(r.protocoloAnterior&&fo_normalizar_(r.protocoloAnterior)===fo_normalizar_(c.protocolo)))) throw new Error('O caso pode já estar cadastrado como '+c.protocolo+'. Use o atendimento atual.');});
    if (!chave) {do{chave='HIST'+r.dataAbertura.getFullYear()+'-'+Utilities.getUuid().replace(/-/g,'').slice(0,12).toUpperCase();}while(ultimos[chave]);}
    r.chave=chave;r.registradoEm=new Date();r.usuario=Session.getActiveUser().getEmail()||'';
    const base=ss.getSheetByName(HEC_CONFIG.BASE);
    if (!base) throw new Error('Execute instalarSistemaFichasOficiaisSabesp antes de cadastrar.');
    if (base.getLastRow()+1>base.getMaxRows()) base.insertRowsAfter(base.getMaxRows(),100);
    base.getRange(base.getLastRow()+1,1,1,6).setValues([[chave,revisao+1,r.registradoEm,r.autor,r.motivo,JSON.stringify(r)]]);
    p.revisao=revisao+1;
  } finally{trava.releaseLock();}
  try{sincronizarBaseFichasOficiais();}
  catch(e){return {chave:chave,revisao:p.revisao,mensagem:'Cadastro salvo. A apresentação ainda precisa atualizar: '+e.message+'. Use Sincronizar e revisar.'};}
  return {chave:chave,revisao:p.revisao,mensagem:'Encerrado salvo. O histórico anterior foi preservado e os anexos seguem a atualização configurada.'};
}

function painelFormatarDataHora_(valor) {
  const data = fo_data_(valor);
  return data ? Utilities.formatDate(
    data, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'
  ) : '';
}

function painelEhArea_(valor, esperada) {
  return !!fo_texto_(valor)&&af_responsavel_(valor)===af_responsavel_(esperada);
}

function painelOrdenarCarteira_(a,b){return af_ordenar_(a,b);}

function painelAreasDisponiveis_(registros){return ['Atendimento','Execução'];}

function painelGarantirComunicacao_() {
  const planilha = SpreadsheetApp.openById(PAINEL_ATENDIMENTO_V3.EXECUCAO_ID);
  let aba = planilha.getSheetByName(PAINEL_ATENDIMENTO_V3.ABA_COMUNICACAO);
  if (!aba) aba = planilha.insertSheet(PAINEL_ATENDIMENTO_V3.ABA_COMUNICACAO);
  if (aba.getMaxColumns() < PAINEL_ATENDIMENTO_V3.CABECALHOS_COMUNICACAO.length) {
    aba.insertColumnsAfter(
      aba.getMaxColumns(),
      PAINEL_ATENDIMENTO_V3.CABECALHOS_COMUNICACAO.length - aba.getMaxColumns()
    );
  }
  const cabecalho = aba.getRange(
    1, 1, 1, PAINEL_ATENDIMENTO_V3.CABECALHOS_COMUNICACAO.length
  );
  const atual = cabecalho.getValues()[0];
  const vazio = atual.every(function(valor) { return !fo_texto_(valor); });
  if (vazio) {
    cabecalho.setValues([PAINEL_ATENDIMENTO_V3.CABECALHOS_COMUNICACAO]);
  } else if (JSON.stringify(atual) !== JSON.stringify(
    PAINEL_ATENDIMENTO_V3.CABECALHOS_COMUNICACAO
  )) {
    throw new Error(
      'A página Comunicação entre Áreas possui cabeçalhos diferentes. ' +
      'Nenhum registro foi alterado.'
    );
  }
  cabecalho.setBackground('#10263A').setFontColor('#FFFFFF')
    .setFontWeight('bold').setFontFamily('Arial').setWrap(true);
  aba.setFrozenRows(1);
  try { aba.hideSheet(); } catch (erro) {}
  return aba;
}

function painelPrepararComunicacao_() {
  try {
    painelGarantirComunicacao_();
    return {ok: true, mensagem: ''};
  } catch (erro) {
    return {ok: false, mensagem: erro.message};
  }
}

function painelMapaCabecalhoComunicacao_(cabecalho) {
  return cabecalho.reduce(function(mapa, nome, indice) {
    mapa[fo_normalizar_(nome)] = indice;
    return mapa;
  }, {});
}

function painelLerComunicacao_(protocolo) {
  const saida = af_eventosCompartilhados_().filter(e => !protocolo || e.protocolo===protocolo);
  saida.disponivel = true;
  saida.aviso = '';
  try {
    const planilha = SpreadsheetApp.openById(PAINEL_ATENDIMENTO_V3.EXECUCAO_ID);
    const aba = planilha.getSheetByName(PAINEL_ATENDIMENTO_V3.ABA_COMUNICACAO);
    if (!aba || aba.getLastRow() < 2) return saida;
    const dados = aba.getDataRange().getValues();
    const mapa = painelMapaCabecalhoComunicacao_(dados[0]);
    const ausentes = PAINEL_ATENDIMENTO_V3.CABECALHOS_COMUNICACAO.filter(
      function(nome) { return mapa[fo_normalizar_(nome)] === undefined; }
    );
    if (ausentes.length) throw new Error('Cabeçalhos ausentes: ' + ausentes.join(', '));
    dados.slice(1).forEach(function(linha, indice) {
      const valor = function(nome) { return linha[mapa[fo_normalizar_(nome)]]; };
      const item = {
        linha: indice + 2,
        chave: fo_texto_(valor('Chave do evento')),
        protocolo: fo_texto_(valor('Protocolo')),
        dataHora: valor('Data e hora'),
        usuario: valor('Registrado por'),
        areaAutora: valor('Área autora'),
        destino: valor('Encaminhado para'),
        tipo: valor('Tipo de registro'),
        mensagem: valor('Mensagem'),
        tituloItem: valor('Título do item'),
        chaveItem: valor('Chave do item'),
        situacaoItem: valor('Situação do item'),
        prioridade: valor('Prioridade'),
        prazo: valor('Prazo'),
        arquivos: valor('Arquivos'),
        lidoAtendimento: valor('Lido pelo Atendimento em'),
        lidoExecucao: valor('Lido pela Execução em'),
        origem: valor('Origem')
      };
      if (!item.chave || !item.protocolo) return;
      const original = item.protocolo; item.protocolo=af_resolver_(original);
      if(original!==item.protocolo){item.protocoloOrigem=original;item.mensagem='['+original+'] '+item.mensagem;}
      if (protocolo && item.protocolo !== protocolo) return;
      saida.push(item);
    });
    saida.sort(function(a, b) {
      const da = fo_data_(a.dataHora);
      const db = fo_data_(b.dataHora);
      return (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
    });
    return saida;
  } catch (erro) {
    saida.disponivel = false;
    saida.aviso = 'A comunicação compartilhada não pôde ser aberta: ' + erro.message;
    return saida;
  }
}

function painelIndexarComunicacao_(comunicacoes) {
  return (comunicacoes || []).reduce(function(mapa, item) {
    if (!mapa[item.protocolo]) mapa[item.protocolo] = [];
    mapa[item.protocolo].push(item);
    return mapa;
  }, {});
}

function painelUltimaOutraArea_(interacoes, areaAtual) {
  const item = (interacoes || []).slice().reverse().find(function(registro) {
    return registro.areaAutora && !painelEhArea_(registro.areaAutora, areaAtual);
  });
  if (!item) return '';
  return painelFormatarDataHora_(item.dataHora) + ' · ' +
    fo_texto_(item.areaAutora) + ' · ' +
    fo_texto_(item.mensagem || item.tituloItem);
}

function painelEstadoChecklist_(interacoes) {
  const itens = {};
  (interacoes || []).forEach(function(item) {
    if (fo_normalizar_(item.tipo).indexOf('checklist') < 0 || !item.chaveItem) return;
    if (!itens[item.chaveItem]) {
      itens[item.chaveItem] = {
        chave: item.chaveItem,
        titulo: item.tituloItem || item.mensagem,
        prioridade: item.prioridade || 'Média',
        prazo: item.prazo,
        situacao: 'Pendente',
        destino: item.destino,
        criadoPor: item.usuario
      };
    }
    if (item.tituloItem) itens[item.chaveItem].titulo = item.tituloItem;
    if (item.prioridade) itens[item.chaveItem].prioridade = item.prioridade;
    if (item.prazo) itens[item.chaveItem].prazo = item.prazo;
    if (item.destino) itens[item.chaveItem].destino = item.destino;
    if (item.situacaoItem) itens[item.chaveItem].situacao = item.situacaoItem;
  });
  return Object.keys(itens).map(function(chave) {
    const item = itens[chave];
    item.prazo = fo_formatarData_(item.prazo);
    return item;
  }).sort(function(a, b) {
    return Number(a.situacao === 'Concluído') - Number(b.situacao === 'Concluído');
  });
}

function painelComunicacao(protocolo, marcarLeitura) {
  const interacoes = painelLerComunicacao_(protocolo);
  if (marcarLeitura && interacoes.disponivel !== false) {
    try {
      const aba = SpreadsheetApp.openById(PAINEL_ATENDIMENTO_V3.EXECUCAO_ID)
        .getSheetByName(PAINEL_ATENDIMENTO_V3.ABA_COMUNICACAO);
      const agora = new Date();
      interacoes.forEach(function(item) {
        if (painelEhArea_(item.destino, 'Atendimento') && !item.lidoAtendimento) {
          aba.getRange(item.linha, 15).setValue(agora);
          item.lidoAtendimento = agora;
        }
      });
    } catch (erro) {
      interacoes.aviso = 'As mensagens foram exibidas, mas a confirmação de leitura não foi salva.';
    }
  }
  const ultima = interacoes.filter(e => e.destino && !e.protocoloOrigem).slice(-1)[0] || null;
  const checklist = painelEstadoChecklist_(interacoes);
  const pendente = checklist.find(function(item) { return item.situacao !== 'Concluído'; });
  return {
    disponivel: interacoes.disponivel !== false,
    aviso: interacoes.aviso || '',
    areaAtual: ultima && fo_texto_(ultima.destino),
    dataArea: ultima && fo_data_(ultima.dataHora) ? fo_data_(ultima.dataHora).toISOString() : null,
    proximaAcao: pendente ? pendente.titulo : (ultima && ultima.mensagem),
    naoLidas: interacoes.filter(function(item) {
      return painelEhArea_(item.destino, 'Atendimento') && !item.lidoAtendimento;
    }).length,
    checklist: checklist,
    eventos: interacoes.slice().reverse().map(function(item) {
      return {
        chave: item.chave,
        data: painelFormatarDataHora_(item.dataHora),
        usuario: fo_texto_(item.usuario),
        area: fo_texto_(item.areaAutora),
        destino: fo_texto_(item.destino),
        tipo: fo_texto_(item.tipo),
        mensagem: fo_texto_(item.mensagem),
        titulo: fo_texto_(item.tituloItem),
        prioridade: fo_texto_(item.prioridade),
        prazo: fo_formatarData_(item.prazo),
        arquivos: fo_texto_(item.arquivos)
      };
    })
  };
}

function painelValidarTextoCompartilhado_(valor, rotulo, obrigatorio) {
  const texto = fo_texto_(valor);
  if (obrigatorio && !texto) throw new Error('Informe ' + rotulo + '.');
  if (/^\s*=/.test(texto)) throw new Error('Use texto, sem fórmulas, em ' + rotulo + '.');
  if (texto.length > 12000) throw new Error(rotulo + ' excede 12 mil caracteres.');
  return texto;
}

function painelAdicionarEventoComunicacao_(dados) {
  const aba = painelGarantirComunicacao_();
  const chave = fo_texto_(dados.chave) || Utilities.getUuid();
  const existentes = aba.getLastRow() < 2 ? [] :
    aba.getRange(2, 1, aba.getLastRow() - 1, 1).getValues();
  if (existentes.some(function(linha) { return linha[0] === chave; })) {
    return {chave: chave, repetido: true};
  }
  const agora = new Date();
  const linha = Math.max(2, aba.getLastRow() + 1);
  if (linha > aba.getMaxRows()) aba.insertRowsAfter(aba.getMaxRows(), 100);
  aba.getRange(linha, 1, 1, PAINEL_ATENDIMENTO_V3.CABECALHOS_COMUNICACAO.length)
    .setValues([[
      chave, dados.protocolo, agora,
      dados.usuario || Session.getActiveUser().getEmail() || 'Atendimento',
      dados.areaAutora || 'Atendimento', dados.destino || '',
      dados.tipo || 'Comentário', dados.mensagem || '', dados.tituloItem || '',
      dados.chaveItem || '', dados.situacaoItem || '', dados.prioridade || '',
      dados.prazo || '', dados.arquivos || '', agora, '',
      'Painel de Trabalho do Atendimento', PAINEL_ATENDIMENTO_V3.VERSAO
    ]]);
  aba.getRange(linha, 3).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  aba.getRange(linha, 13).setNumberFormat('dd/MM/yyyy');
  aba.getRange(linha, 15, 1, 2).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  painelRefletirComunicacaoNoHistorico_(dados, chave, agora);
  return {chave: chave, repetido: false};
}

function painelRefletirComunicacaoNoHistorico_(dados, chave, agora) {
  const ss = hec_central_();
  const historico = ss.getSheetByName(FO_CONFIG.ABA_HISTORICO_CENTRAL);
  if (!historico) return;
  const chaveHistorico = 'COM|' + chave;
  if (historico.getLastRow() >= 2 && historico.getRange(
    2, 18, historico.getLastRow() - 1, 1
  ).getValues().some(function(linha) { return linha[0] === chaveHistorico; })) return;
  const registro = painelRegistro_(dados.protocolo);
  fo_garantirDimensoes_(historico, historico.getLastRow() + 2, 21);
  historico.appendRow([
    registro.idLegado || registro.protocolo, agora,
    dados.usuario || Session.getActiveUser().getEmail() || 'Atendimento',
    registro.status, registro.procedencia || 'Em análise',
    'Atendimento', dados.mensagem || dados.tituloItem || '',
    'Comunicação entre Atendimento e Execução', '', '', '', '', '', '',
    fo_normalizar_(dados.tipo).indexOf('checklist') >= 0
      ? 'Checklist compartilhado' : 'Comunicação entre áreas',
    dados.destino || registro.areaProxima || 'Atendimento',
    dados.tituloItem || dados.mensagem || registro.proximaAcao || '',
    chaveHistorico, '', '', dados.arquivos || ''
  ]);
}

function painelSalvarComunicacaoExecutar_(p) {
  const protocolo = fo_texto_(p.protocolo);
  painelRegistro_(protocolo);
  const mensagem = painelValidarTextoCompartilhado_(p.mensagem, 'a mensagem', true);
  const destino = af_responsavel_(painelValidarTextoCompartilhado_(p.destino, 'a área que receberá a ficha', true));
  const arquivos = painelValidarTextoCompartilhado_(p.arquivos, 'os links de apoio', false);
  const resultado = painelAdicionarEventoComunicacao_({
    chave: p.pedidoId,
    usuario: p.autor,
    protocolo: protocolo,
    areaAutora: 'Atendimento',
    destino: destino,
    tipo: destino === 'Atendimento' ? 'Comentário' : 'Encaminhamento',
    mensagem: mensagem,
    arquivos: arquivos
  });
  return {
    mensagem: resultado.repetido
      ? 'Esta atualização já estava registrada.'
      : 'Atualização registrada e sinalizada para ' + destino + '.',
    comunicacao: painelComunicacao(protocolo, false)
  };
}

function painelCriarChecklistExecutar_(p) {
  const protocolo = fo_texto_(p.protocolo);
  painelRegistro_(protocolo);
  const titulo = painelValidarTextoCompartilhado_(p.titulo, 'o item de acompanhamento', true);
  const destino = af_responsavel_(painelValidarTextoCompartilhado_(p.destino, 'a área responsável', true));
  const prioridade = fo_texto_(p.prioridade) || 'Média';
  if (['Baixa', 'Média', 'Alta', 'Urgente'].indexOf(prioridade) < 0) {
    throw new Error('Selecione uma prioridade válida.');
  }
  let prazo = '';
  if (fo_texto_(p.prazo)) prazo = hec_dataObrigatoria_(p.prazo, 'Prazo');
  const chaveItem = Utilities.getUuid();
  const resultado = painelAdicionarEventoComunicacao_({
    chave: p.pedidoId,
    usuario: p.autor,
    protocolo: protocolo,
    areaAutora: 'Atendimento',
    destino: destino,
    tipo: 'Checklist criado',
    mensagem: painelValidarTextoCompartilhado_(p.mensagem, 'o contexto do item', false),
    tituloItem: titulo,
    chaveItem: chaveItem,
    situacaoItem: 'Pendente',
    prioridade: prioridade,
    prazo: prazo
  });
  return {
    mensagem: resultado.repetido
      ? 'Este item já estava registrado.'
      : 'Item criado e encaminhado para ' + destino + '.',
    comunicacao: painelComunicacao(protocolo, false)
  };
}

function painelAlterarChecklistExecutar_(p) {
  const protocolo = fo_texto_(p.protocolo);
  painelRegistro_(protocolo);
  const chaveItem = fo_texto_(p.chaveItem);
  const estado = fo_texto_(p.situacao);
  if (!chaveItem || ['Pendente', 'Concluído'].indexOf(estado) < 0) {
    throw new Error('O item ou a situação não é válido. Atualize a ficha.');
  }
  const itens = painelEstadoChecklist_(painelLerComunicacao_(protocolo));
  const item = itens.find(function(registro) { return registro.chave === chaveItem; });
  if (!item) throw new Error('O item não foi localizado. Atualize a comunicação.');
  const resultado = painelAdicionarEventoComunicacao_({
    chave: p.pedidoId,
    usuario: p.autor,
    protocolo: protocolo,
    areaAutora: 'Atendimento',
    destino: p.destino || item.destino || 'Atendimento',
    tipo: estado === 'Concluído' ? 'Checklist concluído' : 'Checklist reaberto',
    mensagem: painelValidarTextoCompartilhado_(p.mensagem, 'o comentário da atualização', false),
    tituloItem: item.titulo,
    chaveItem: chaveItem,
    situacaoItem: estado,
    prioridade: item.prioridade,
    prazo: item.prazo ? hec_dataObrigatoria_(item.prazo, 'Prazo') : ''
  });
  return {
    mensagem: resultado.repetido
      ? 'Esta mudança já estava registrada.'
      : 'Item atualizado para ' + estado.toLowerCase() + '.',
    comunicacao: painelComunicacao(protocolo, false)
  };
}

function painelHistoricoCaso_(ss, id) {
  const aba = ss.getSheetByName(FO_CONFIG.ABA_HISTORICO_CENTRAL);
  if (!aba) return [];
  const mapa=fo_lerHistorico_(aba),principal=af_resolver_(id,true),eventos=(mapa[principal]||[]).slice();
  af_vinculos_().filter(v=>af_resolver_(v.idPrincipal,true)===principal).forEach(v=>(mapa[v.idOrigem]||[]).forEach(e=>eventos.push(Object.assign({},e,{observacao:'['+v.origem+'] '+(e.observacao||'')}))));
  return eventos.slice().sort(function(a, b) {
    return (fo_data_(b.data) || 0) - (fo_data_(a.data) || 0);
  }).map(function(item) {
    return {
      data: painelFormatarDataHora_(item.data),
      usuario: fo_texto_(item.usuario),
      status: fo_texto_(item.status),
      procedencia: fo_texto_(item.procedencia),
      area: fo_texto_(item.area),
      proxima: fo_texto_(item.proximaAcao),
      tipo: fo_texto_(item.tipoEvento),
      relato: fo_texto_(item.observacao),
      evidencias: fo_texto_(item.evidencias)
    };
  });
}

function painelCamposPublicos_(registro) {
  return {
    dataAbertura: fo_formatarData_(registro.dataAbertura),
    horario: fo_formatarHora_(registro.horario),
    localAtendimento: fo_texto_(registro.localAtendimento),
    responsavel: fo_texto_(registro.responsavel),
    nome: fo_texto_(registro.nome),
    telefone: fo_texto_(registro.telefone),
    email: fo_texto_(registro.email),
    endereco: fo_texto_(registro.endereco),
    assunto: fo_texto_(registro.assunto),
    tipo: fo_texto_(registro.tipo),
    solicitacao: fo_texto_(registro.solicitacao),
    descricao: fo_textoPublico_(registro.descricaoReclamacao),
    providencias: fo_textoPublico_(registro.solucao),
    conclusao: fo_textoPublico_(registro.finalizacao),
    fotosAbertura: fo_texto_(registro.fotosAbertura),
    fotosExecucao: fo_texto_(registro.fotosSolucao)
  };
}

function painelSepararLinksFotos_(valor) {
  const links = typeof fo_separarLinks_ === 'function'
    ? fo_separarLinks_(valor) : fo_texto_(valor).split(/[\n,;]+/);
  const unicos = {};
  return links.map(fo_texto_).filter(function(link) {
    if (!link || unicos[link]) return false;
    unicos[link] = true;
    return true;
  });
}

function painelMiniaturaFoto_(link) {
  const id = fo_extrairIdDrive_(link);
  const item = {link: link, id: id, preview: '', nome: 'Arquivo do Drive'};
  if (!id) return item;
  try {
    const arquivo = DriveApp.getFileById(id);
    item.nome = arquivo.getName();
    let blob = arquivo.getThumbnail();
    if (!blob && /^image\//i.test(arquivo.getMimeType()) && arquivo.getSize() <= 900000) {
      blob = arquivo.getBlob();
    }
    if (blob && blob.getBytes().length <= 1200000) {
      item.preview = 'data:' + (blob.getContentType() || 'image/jpeg') + ';base64,' +
        Utilities.base64Encode(blob.getBytes());
    }
  } catch (erro) {
    item.erro = 'Prévia indisponível';
  }
  return item;
}

function painelFotosFicha_(registro) {
  const montar = function(valor, grupo) {
    return painelSepararLinksFotos_(valor).slice(0, 12).map(function(link) {
      const foto = painelMiniaturaFoto_(link);
      foto.grupo = grupo;
      return foto;
    });
  };
  return montar(registro.fotosAbertura, 'abertura')
    .concat(montar(registro.fotosSolucao, 'execucao'));
}

function painelAssinaturaCompleta_(ss, registro, protocolo) {
  return fo_hash_([
    painelAssinatura_(ss, protocolo),
    fo_hashOficialRegistro_(registro),
    registro.ultimaAtualizacao,
    registro.hashOficial
  ].map(fo_texto_).join('|'));
}

function painelValidarAlteracaoPublica_(config, valor, registro) {
  let novo = valor === null || valor === undefined ? '' : String(valor).trim();
  if (/^\s*=/.test(novo)) throw new Error('Use texto, sem fórmulas, em ' + config.campo + '.');
  if (novo.length > 30000) throw new Error(config.campo + ' excede 30 mil caracteres.');
  if (!novo) {
    if (config.obrigatorio) throw new Error(config.campo + ' não pode ficar vazio.');
    if (!config.removivel) throw new Error(
      'Para retirar ' + config.campo + ', registre primeiro a justificativa no acompanhamento.'
    );
    return PAINEL_ATENDIMENTO_V3.MARCADOR_REMOCAO;
  }
  if (config.campo === 'Data de abertura') {
    const data = hec_dataObrigatoria_(novo, config.campo);
    const conclusao = fo_data_(registro.dataConclusao);
    if (data > new Date() || (conclusao && data > conclusao)) {
      throw new Error('Confira a data de abertura informada.');
    }
    return data;
  }
  return novo;
}

function painelMontarLoteCorrecoes_(p) {
  p = p || {};
  const ss = hec_central_();
  const registro = painelRegistro_(fo_texto_(p.protocolo));
  if (/^HIST/.test(registro.chave)) {
    throw new Error('Este é um cadastro histórico. Use Cadastro de histórico para revisá-lo.');
  }
  if (painelAssinaturaCompleta_(ss, registro, registro.protocolo) !== p.assinatura) {
    throw new Error('A ficha recebeu outra atualização. Recarregue antes de salvar.');
  }
  const atual = painelCamposPublicos_(registro);
  const alteracoes = [];
  PAINEL_EDITOR_CAMPOS.forEach(function(config) {
    const recebido = p.valores && p.valores[config.chave];
    const anterior = atual[config.chave] || '';
    if (String(recebido === undefined ? anterior : recebido).trim() === String(anterior).trim()) {
      return;
    }
    alteracoes.push({
      campo: config.campo,
      anterior: anterior,
      valor: painelValidarAlteracaoPublica_(config, recebido, registro)
    });
  });
  if (!alteracoes.length) {
    return {registro: registro, alteracoes: [], motivo: ''};
  }
  const motivo = painelValidarTextoCompartilhado_(
    p.motivo, 'o motivo desta revisão', true
  );
  return {registro: registro, alteracoes: alteracoes, motivo: motivo};
}

function painelSalvarFichaCompleta(p) {
  p = p || {};
  const lote = painelMontarLoteCorrecoes_(p);
  if (!lote.alteracoes.length) {
    return {mensagem: 'Nenhuma alteração foi identificada na ficha.'};
  }
  const pedidoId = fo_texto_(p.pedidoId) || Utilities.getUuid();
  if (!/^[a-f0-9-]{36}$/i.test(pedidoId)) {
    throw new Error('Identificador de revisão inválido. Reabra a ficha.');
  }
  return painelRegistrarPedido_('CORRIGIR_LOTE', {
    protocolo: lote.registro.protocolo,
    assinatura: p.assinatura,
    valores: p.valores || {},
    motivo: lote.motivo,
    pedidoId: pedidoId
  }, pedidoId);
}

function painelAplicarCorrecaoLote_(p, pedidoId) {
  const lote = painelMontarLoteCorrecoes_(p);
  if (!lote.alteracoes.length) {
    return {mensagem: 'Nenhuma alteração foi identificada na ficha.'};
  }
  const ss = hec_central_();
  const aba = ss.getSheetByName('Correções da Ficha Final de Atendimento');
  if (!aba) throw new Error('A base de correções não foi encontrada. Reinstale a Central 4.6.');
  if (!/^[a-f0-9-]{36}$/i.test(pedidoId || '')) {
    throw new Error('Identificador de revisão inválido.');
  }
  const marca = '[Painel ' + pedidoId + ']';
  const existentes = aba.getLastRow() < 6 ? [] :
    aba.getRange(6, 7, aba.getLastRow() - 5, 1).getValues();
  if (!existentes.some(function(linha) { return String(linha[0]).indexOf(marca) >= 0; })) {
    const primeira = Math.max(6, aba.getLastRow() + 1);
    fo_garantirDimensoes_(aba, primeira + lote.alteracoes.length + 2, 16);
    const linhas = lote.alteracoes.map(function(item) {
      return [
        lote.registro.idLegado || lote.registro.protocolo,
        lote.registro.dataAbertura,
        lote.registro.nome,
        item.campo,
        item.anterior,
        item.valor,
        marca + ' ' + lote.motivo,
        true,
        'Aguardando aplicação', '', '', '', '', '', '', ''
      ];
    });
    aba.getRange(primeira, 1, linhas.length, 16).setValues(linhas);
  }
  return {
    mensagem: lote.alteracoes.length +
      ' campo(s) registrado(s) para aplicação e atualização do documento.'
  };
}

function painelHtml_(modo) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    :root{--navy:#10263a;--navy2:#163c55;--petrol:#078c91;--cyan:#e7f6f6;--lime:#b7f34a;--ink:#17283a;--muted:#607487;--line:#d7e1e8;--paper:#fff;--bg:#eef3f7;--danger:#bd4b43;--warn:#d7822e;--ok:#278260;--shadow:0 14px 45px rgba(20,45,65,.12)}
    *{box-sizing:border-box}html,body{height:100%;margin:0}body{font:14px Arial,sans-serif;color:var(--ink);background:var(--bg);overflow:hidden}
    button,input,select,textarea{font:inherit}button{cursor:pointer}.app{display:grid;grid-template-columns:224px minmax(0,1fr);height:100vh}.sidebar{background:var(--navy);color:#fff;padding:22px 14px;display:flex;flex-direction:column;min-height:0}.brand{padding:4px 12px 22px}.brand b{display:block;color:var(--lime);font-size:25px;letter-spacing:3px}.brand span{display:block;margin-top:4px;color:#c9d9e5;font-size:12px}.nav{display:grid;gap:5px;overflow:auto}.nav button{border:0;border-radius:9px;padding:11px 12px;background:transparent;color:#dce8ef;text-align:left;font-weight:700}.nav button:hover,.nav button.active{background:#284b61;color:#fff}.nav button.active{box-shadow:inset 3px 0 var(--lime)}.nav .group{margin:16px 12px 5px;color:#7f9bad;font-size:10px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase}.version{margin-top:auto;padding:15px 12px 0;color:#8da7b7;font-size:11px}.workspace{display:grid;grid-template-rows:auto 1fr;min-width:0;min-height:0}.topbar{background:#fff;border-bottom:1px solid var(--line);padding:14px 24px;display:grid;grid-template-columns:minmax(240px,1fr) minmax(330px,540px) auto;gap:16px;align-items:center}.title h1{font-size:20px;margin:0}.title p{margin:4px 0 0;color:var(--muted);font-size:12px}.case-picker label{display:block;color:var(--muted);font-size:11px;font-weight:700;margin-bottom:5px}.case-picker select{width:100%;border:1px solid #bfd0db;border-radius:8px;background:#fff;padding:10px}.status-dot{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:12px}.status-dot i{width:9px;height:9px;border-radius:50%;background:var(--ok)}.main{overflow:auto;padding:22px 24px 42px}.page{display:none}.page.active{display:block}.hero{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:16px}.hero h2{font-size:23px;margin:0 0 5px}.hero p{margin:0;color:var(--muted);line-height:1.45}.cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:18px}.metric{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px;box-shadow:0 3px 14px rgba(28,54,72,.04)}.metric small{display:block;color:#557087;text-transform:uppercase;letter-spacing:.7px;font-size:10px;font-weight:800}.metric strong{display:block;font-size:29px;margin-top:8px}.metric span{color:var(--muted);font-size:11px}.metric.petrol{border-top:4px solid var(--petrol)}.metric.orange{border-top:4px solid var(--warn)}.metric.lime{border-top:4px solid #83b82d}.metric.red{border-top:4px solid var(--danger)}.metric.blue{border-top:4px solid #3b75b6}.panel{background:#fff;border:1px solid var(--line);border-radius:13px;box-shadow:0 5px 20px rgba(21,49,69,.05);margin-bottom:16px}.panel-head{padding:16px 18px;border-bottom:1px solid #e3ebf0;display:flex;align-items:center;justify-content:space-between;gap:12px}.panel-head h3{margin:0;font-size:16px}.panel-body{padding:18px}.filters{display:grid;grid-template-columns:minmax(220px,1fr) repeat(3,170px);gap:10px}.input,select,textarea,input{width:100%;border:1px solid #bccdd8;border-radius:8px;padding:10px 11px;background:#fff;color:var(--ink)}textarea{min-height:90px;resize:vertical;line-height:1.45}label{display:block;font-size:12px;font-weight:700;margin:0 0 6px}.hint{font-size:12px;color:var(--muted);line-height:1.5}.btn{border:1px solid #b8cad5;background:#fff;color:#234459;border-radius:8px;padding:10px 14px;font-weight:700}.btn:hover{border-color:#7895a6}.btn.primary{background:var(--petrol);border-color:var(--petrol);color:#fff}.btn.dark{background:var(--navy);border-color:var(--navy);color:#fff}.btn.danger{color:#9a3934;border-color:#e0aaa6}.btn.small{padding:7px 10px;font-size:12px}.actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.sticky-actions{position:sticky;bottom:-1px;background:rgba(238,243,247,.96);backdrop-filter:blur(8px);padding:12px 0;z-index:4}.table-wrap{overflow:auto;max-height:470px}.case-table{width:100%;border-collapse:collapse;min-width:980px}.case-table th{position:sticky;top:0;background:#f2f7fa;color:#536e80;font-size:10px;text-transform:uppercase;letter-spacing:.6px;text-align:left;padding:10px;border-bottom:1px solid var(--line);z-index:1}.case-table td{padding:11px 10px;border-bottom:1px solid #e8eef2;vertical-align:top}.case-table tr{cursor:pointer}.case-table tbody tr:hover,.case-table tbody tr.selected{background:#edfafa}.protocol{font-weight:800;color:#0a7379}.badge{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 8px;background:#edf2f5;color:#3e596a;font-size:11px;font-weight:700;white-space:nowrap}.badge.exec{background:#fff0dc;color:#965b19}.badge.atd{background:#e2f4ee;color:#216f55}.badge.alert{background:#fde9e7;color:#9f3c36}.badge.new{background:#e9f1ff;color:#315f9b}.dot-alert{width:18px;height:18px;border-radius:50%;display:inline-grid;place-items:center;background:var(--danger);color:#fff;font-size:10px;font-weight:800}.selected-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-bottom:16px}.selected-summary div{background:#fff;padding:12px}.selected-summary small{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;font-weight:800}.selected-summary b{display:block;margin-top:5px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.span2{grid-column:1/-1}.timeline{display:grid;gap:10px}.event{border-left:3px solid #9db7c7;padding:2px 0 2px 13px}.event.atendimento{border-color:var(--petrol)}.event.execucao{border-color:var(--warn)}.event b{font-size:12px}.event small{display:block;color:var(--muted);margin:3px 0 5px}.event p{white-space:pre-wrap;margin:0;line-height:1.48}.checklist{display:grid;gap:9px}.check-item{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:start;border:1px solid var(--line);border-radius:9px;padding:11px}.check-item.done{opacity:.65;background:#f4f7f5}.check-item input{width:18px;height:18px;margin:2px 0}.check-item b{display:block}.check-item small{color:var(--muted)}.paper-wrap{display:flex;justify-content:center;padding:6px}.paper{width:min(100%,880px);background:#fff;border:1px solid #cbd7df;box-shadow:var(--shadow);padding:28px 32px;color:#111}.paper-title{background:#173f60;color:#fff;margin:-28px -32px 18px;padding:18px 24px}.paper-title h3{font-size:21px;margin:0}.paper-title p{margin:4px 0 0;color:#d9e6ef}.paper-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:11px 16px}.paper-section{border-top:2px solid #173f60;margin-top:18px;padding-top:13px}.paper-section h4{margin:0 0 10px;text-transform:uppercase;font-size:12px;letter-spacing:.7px}.paper input,.paper select,.paper textarea{border:1px solid transparent;border-bottom-color:#aab9c3;border-radius:3px;padding:7px;background:#fbfcfd}.paper input:focus,.paper select:focus,.paper textarea:focus{border-color:var(--petrol);outline:0;background:#fff}.paper textarea{min-height:105px}.photo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.photo{position:relative;border:1px solid var(--line);background:#f2f5f7;border-radius:8px;min-height:145px;display:flex;align-items:center;justify-content:center;overflow:hidden}.photo img{width:100%;height:150px;object-fit:contain;background:#edf1f3}.photo .placeholder{padding:15px;text-align:center;color:var(--muted);font-size:11px;overflow-wrap:anywhere}.photo button{position:absolute;right:6px;top:6px;width:auto;border:0;border-radius:50%;background:rgba(16,38,58,.9);color:#fff;padding:5px 8px}.photo-add{display:grid;grid-template-columns:1fr 150px;gap:8px;margin-top:10px}.notice{border-radius:9px;padding:11px 13px;margin-bottom:13px;line-height:1.45}.notice.ok{background:#e4f4ed;color:#225f4d}.notice.error{background:#fde9e7;color:#8f3833}.notice.loading{background:#e8f1f8;color:#2b5877}.notice.warn{background:#fff1dc;color:#875313}.notice:empty{display:none}.empty{padding:28px;text-align:center;color:var(--muted)}.link-list a{display:inline-block;margin:4px 10px 4px 0;color:#08777c;font-weight:700}.history-form{display:grid;gap:16px}.history-group{background:#fff;border:1px solid var(--line);border-radius:11px;padding:15px}.history-group h3{margin:0 0 12px}.history-fields{display:grid;grid-template-columns:1fr 1fr;gap:11px}.history-fields .wide{grid-column:1/-1}.divider{height:1px;background:var(--line);margin:14px 0}.loader{display:inline-block;width:14px;height:14px;border:2px solid #b5c8d4;border-top-color:var(--petrol);border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:980px){.app{grid-template-columns:78px minmax(0,1fr)}.brand span,.nav button span,.nav .group,.version{display:none}.brand{padding-left:10px}.brand b{font-size:18px}.nav button{text-align:center}.topbar{grid-template-columns:1fr}.cards{grid-template-columns:repeat(2,1fr)}.filters,.grid2{grid-template-columns:1fr}.paper-grid{grid-template-columns:1fr}.photo-grid{grid-template-columns:repeat(2,1fr)}}
    @media print{body{overflow:visible;background:#fff}.sidebar,.topbar,.main>.page:not(#ficha),#ficha>.hero,#ficha>.selected-summary,#ficha>.sticky-actions,#globalMessage,.paper .screen-only{display:none!important}.app,.workspace{display:block;height:auto}.main{padding:0;overflow:visible}.paper-wrap{padding:0}.paper{width:100%;border:0;box-shadow:none}.page#ficha{display:block}}
  
:root{--ui-font:16px;--lime:#47c8f5;--navy:#08364c;--petrol:#007e94}
body{font-size:var(--ui-font);line-height:1.45}.topbar{grid-template-columns:minmax(190px,1fr) minmax(230px,1.2fr);gap:10px}.access-controls{display:flex;gap:12px;grid-column:1/-1;align-items:center;flex-wrap:wrap}.access-controls label{display:flex;align-items:center;gap:8px;font-size:13px;margin:0}.access-controls select{width:auto;padding:6px 10px;min-height:36px}.sidebar{border-top:4px solid #ed1b2f}.brand b{letter-spacing:0}.nav button{font-size:var(--ui-font);min-height:44px}.metric strong{text-align:center}.badge{white-space:normal}.case-table{font-size:var(--ui-font)}.case-table small,.hint,.event b,.event small{font-size:.88rem}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #009ee2;outline-offset:3px}.case-table td{line-height:1.4}.nav button span{display:inline}.case-table th{font-size:12px}
@media(max-width:1100px){.app{grid-template-columns:190px minmax(0,1fr)}.nav button span{display:inline}.nav button{text-align:left}.topbar{grid-template-columns:1fr}.filters{grid-template-columns:1fr 1fr}.main{padding:16px}.cards{grid-template-columns:repeat(2,1fr)}}
@media(max-width:720px){.app{display:flex;flex-direction:column}.sidebar{padding:8px;max-height:180px;flex:none}.brand,.version,.nav .group{display:none}.nav{display:flex;flex-wrap:wrap;gap:4px}.nav button{padding:8px}.workspace{flex:1;min-height:0}.grid2,.grid3,.selected-summary{grid-template-columns:1fr}.filters{grid-template-columns:1fr}.topbar{padding:10px}.access-controls{gap:8px}}


/* Ajuste exclusivamente visual: mais área útil e uma rolagem vertical por página. */
@media screen{
.app{grid-template-columns:206px minmax(0,1fr)}
.sidebar,.side{padding:14px 10px;min-height:0;border-top:4px solid #ed1b2f}
.brand{padding:3px 10px 12px}.brand b{font-size:23px}.brand span{margin-top:2px}
.nav{gap:3px;overflow:auto;min-height:0}.nav button{padding:9px 10px;min-height:40px;line-height:1.25;flex-shrink:0}
.nav .group,.nav small{margin:12px 10px 4px}.version{padding:8px 10px 0;font-size:11px}
.topbar,.top{display:grid;grid-template-columns:minmax(170px,.8fr) minmax(250px,1.35fr) auto;gap:6px 16px;padding:10px 18px;align-items:center}
.title{grid-column:1;grid-row:1}.title h1{font-size:20px;line-height:1.15}.title p{margin-top:3px;line-height:1.25;font-size:12px}
.case-picker,.picker{grid-column:2;grid-row:1}.case-picker select,.picker select{padding:8px 10px;min-height:39px}
.access-controls{grid-column:3;grid-row:1;display:flex;flex-wrap:nowrap;gap:10px;align-items:end}
.access-controls label{display:flex;flex-direction:column;align-items:flex-start;gap:4px;font-size:11px;margin:0}
.access-controls select{min-height:36px;padding:7px 9px;max-width:165px;font-size:13px}
.status-dot,.sync{grid-column:1/-1;grid-row:2;font-size:11px;line-height:1.2;margin:0;white-space:normal}
.main{padding:16px 18px 24px;min-height:0}.hero{margin-bottom:12px}.hero h2{font-size:22px}.hero p{font-size:.9rem}
.cards{gap:10px;margin-bottom:14px}.metric{padding:12px}.metric strong{margin:5px 0;font-size:29px}.metric small{line-height:1.3}
.panel-head{padding:12px 15px}.panel-body{padding:14px 15px}.table-wrap{max-height:none;overflow-x:auto}
.case-table,.cases{table-layout:fixed;min-width:1000px;width:100%}
.case-table th:nth-child(1),.cases th:nth-child(1){width:25%}
.case-table th:nth-child(2),.cases th:nth-child(2){width:12%}
.case-table th:nth-child(3),.cases th:nth-child(3){width:10%}
.case-table th:nth-child(4),.cases th:nth-child(4){width:20%}
.case-table th:nth-child(5),.cases th:nth-child(5){width:20%}
.case-table th:nth-child(6),.cases th:nth-child(6){width:13%}
.case-table td,.cases td{padding:12px;overflow-wrap:anywhere}.case-table th,.cases th{padding:11px 12px;font-size:11px}
@media(max-width:1100px){.app{grid-template-columns:185px minmax(0,1fr)}.topbar,.top{grid-template-columns:1fr 1.25fr;gap:8px 12px}.access-controls{grid-column:2;grid-row:2}.status-dot,.sync{grid-column:1;grid-row:2}.cards{grid-template-columns:repeat(3,minmax(0,1fr))}.nav button span{display:inline}}
@media(max-width:720px){.app{display:flex;flex-direction:column}.sidebar,.side{max-height:135px;padding:7px;flex:none}.brand,.version,.nav .group,.nav small{display:none}.nav{display:flex;flex-wrap:wrap;gap:3px}.nav button{padding:7px;font-size:13px}.workspace,.work{flex:1;min-height:0}.topbar,.top{padding:8px;grid-template-columns:1fr}.title{display:none}.case-picker,.picker{grid-row:1;grid-column:1}.access-controls{grid-row:2;grid-column:1}.status-dot,.sync{display:none}.main{padding:12px}.cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
}


@media screen{.extra-filters{display:flex;gap:12px;align-items:end;flex-wrap:wrap;padding:0 16px 16px}.extra-filters label{flex:1;min-width:175px;font-size:12px;color:#32526a}.extra-filters select{display:block;width:100%;margin-top:5px}.priority-help{margin:0 16px 14px;padding:10px 14px;background:#eef7fb;border-left:3px solid #00a1df;border-radius:8px;color:#164660;font-size:13px}.priority-help summary{cursor:pointer;font-weight:600}.priority-help p{max-width:85ch;line-height:1.5}.priority-note{display:block;font-size:11px;color:#546778;margin-top:6px;line-height:1.4}}
/* Acabamento Água 1.0: somente interface; impressão preservada. */
@media screen {
:root{--navy:#064778;--navy2:#07588f;--petrol:#007ca8;--lime:#42c9ed;--cyan:#eaf9ff;--ink:#163c55;--muted:#526f81;--line:#d5e6ee;--bg:#f5fafd;--blue:#008dce;--orange:#e28b23;--warn:#b86b13;--red:#bd3e48;--danger:#bd3e48;--shadow:0 12px 36px #06477812}
body{background:var(--bg);font-family:Arial,sans-serif}
.app{grid-template-columns:232px minmax(0,1fr);height:100vh;height:100dvh}
.sidebar,.side{background:linear-gradient(160deg,#fff 60%,#edfaff);color:var(--ink);border-top:4px solid #009ee0;border-right:1px solid var(--line);padding:20px 12px;overflow:hidden}
.brand{padding:4px 14px 24px}.brand b{font-size:24px;letter-spacing:-.6px;color:#006eb1}.brand span{color:var(--muted);font-size:12px}
.nav{display:grid;gap:5px;overflow:auto;min-height:0;scrollbar-width:thin}.nav button{position:relative;text-align:left;background:transparent;color:#31536a;border:1px solid transparent;border-radius:12px;padding:12px;min-height:44px;line-height:1.35;font-size:var(--ui-font);transition:background .15s,color .15s}.nav button span{display:inline}.nav button:hover{background:#eaf7fd;color:#00578b}.nav button.active{background:#007cba;color:#fff;border-color:#007cba;box-shadow:0 5px 12px #007cba20,inset 4px 0 #48dbeb}.nav .group,.nav small{display:block;color:#526f81;font-size:10px;letter-spacing:1.2px;margin:20px 12px 5px}.version{color:#526f81;padding:16px 12px 0}
.topbar,.top{background:#fff;padding:16px 24px;gap:10px 18px;border-bottom:1px solid var(--line)}.title h1{color:#084c77;font-size:21px}.title p{line-height:1.45}.main{padding:24px;scrollbar-width:thin;scrollbar-color:#aecfdf transparent}
.hero{position:relative;isolation:isolate;overflow:hidden;align-items:center;background:#fff;border:1px solid var(--line);border-radius:22px 22px 32px 8px;padding:24px;margin-bottom:20px;min-height:114px}.hero:after{content:'';position:absolute;z-index:-1;pointer-events:none;width:260px;height:190px;border:24px solid #e6f7fd;border-radius:48% 52% 66% 34%;right:-110px;top:-120px;transform:rotate(-18deg)}.hero h2{font-size:clamp(22px,2.2vw,30px);letter-spacing:-.6px;color:#005e97}.hero p{max-width:78ch;line-height:1.55}.hero .actions{flex-shrink:0}
.cards{gap:14px;margin-bottom:22px;grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}.metric{position:relative;border-radius:17px;padding:18px;background:#fff;box-shadow:0 4px 15px #07588f06;border-top-width:4px}.metric strong{text-align:left;font-size:34px;color:#074b78;font-variant-numeric:tabular-nums;margin:8px 0}.metric small{font-size:11px;letter-spacing:.6px}.metric span{font-size:12px}.metric.petrol{border-top-color:#00a6c3}.metric.blue{border-top-color:#008dce}.metric.orange{border-top-color:#f3ad35}.metric.lime{border-top-color:#51aa73}.metric.red{border-top-color:#de6263}
.panel,.chart,.quick-card,.history-group{border-radius:18px;border-color:var(--line);box-shadow:0 4px 18px #06477805}.panel-head{padding:18px 20px;flex-wrap:wrap}.panel-head h3{color:#09577f}.panel-body{padding:20px}.filters{grid-template-columns:minmax(200px,2fr) repeat(3,minmax(120px,1fr))}.input,input,select,textarea{border-color:#bfd7e4;border-radius:10px;min-width:0;max-width:100%;accent-color:#007cba}input:not([type=checkbox]):not([type=radio]),select{min-height:44px}input[type=checkbox],input[type=radio]{min-height:0;width:auto}textarea{line-height:1.6}.btn{border-radius:11px;min-height:44px;padding:11px 16px;color:#07588f;border-color:#bfd7e4;background:#fff}.btn.primary{background:#007cba;border-color:#007cba;color:#fff}.btn.dark{background:#085485;border-color:#085485;color:#fff}.btn:hover{border-color:#008dce;box-shadow:0 3px 10px #007cba14}.btn:disabled{opacity:.55;cursor:wait}.btn.danger{color:#a73340;border-color:#e3b8bd}.sticky-actions{background:#f5fafd;backdrop-filter:none;border-top:1px solid var(--line)}
.table-wrap{max-height:none;overflow-x:auto;overscroll-behavior-x:contain;border-radius:0 0 18px 18px}.case-table th,.cases th{background:#edf7fc;color:#365e77;letter-spacing:.5px;padding:14px 12px}.case-table td,.cases td{padding:16px 12px;line-height:1.55;word-break:normal;overflow-wrap:break-word}.case-table tbody tr:nth-child(even),.cases tbody tr:nth-child(even){background:#fbfdff}.case-table tbody tr:hover,.cases tbody tr:hover{background:#eef9ff}.case-table tbody tr.selected,.cases tbody tr.selected{background:#e4f4fd;box-shadow:inset 4px 0 #008dce}.protocol{color:#0079b5}.badge{padding:6px 10px;line-height:1.4;white-space:normal}.badge.atd{background:#e2f4ff;color:#075c8b}.badge.exec{background:#fff2d8;color:#875311}.priority-help{background:#eff9fe;border-color:#00a4d5;border-radius:12px}.event{border-left-color:#86cfe6}.selected-summary,.summary{border-radius:14px}.selected-summary div,.summary div{padding:16px}.chart{padding:22px}.track{height:15px;background:#edf5fa}.bar{background:#00a4c7}.bar.blue{background:#008dce}.bar.orange{background:#edab32}.bar.lime{background:#51aa73}.notice.loading{background:#eaf8ff;color:#07588f}.notice{border-radius:12px}
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid #0085c2;outline-offset:3px}
@media(min-width:1500px){.main{padding:28px 32px}.app{grid-template-columns:248px minmax(0,1fr)}}
@media(max-width:1200px){.app{grid-template-columns:202px minmax(0,1fr)}.topbar,.top{grid-template-columns:1fr 1.25fr;padding:14px 18px}.access-controls{grid-column:2;grid-row:2;flex-wrap:wrap}.status-dot,.sync{grid-column:1;grid-row:2}.main{padding:18px}.filters{grid-template-columns:1fr 1fr}.grid2,.charts{grid-template-columns:1fr}.brand span,.version{display:block}.hero{padding:20px}}
@media(max-width:760px){.app{display:flex;flex-direction:column}.sidebar,.side{flex:none;max-height:166px;padding:8px;border-right:0;border-bottom:1px solid var(--line)}.brand,.version{display:none}.nav{display:flex;flex-wrap:nowrap;overflow-x:auto;gap:6px;padding:3px 2px 8px}.nav .group,.nav small{display:none}.nav button{flex:0 0 auto;max-width:190px;white-space:normal;padding:10px 13px;font-size:14px}.nav button span{display:inline}.workspace,.work{flex:1;min-height:0}.topbar,.top{padding:10px 12px;grid-template-columns:1fr;gap:8px}.title,.status-dot,.sync{display:none}.case-picker,.picker{grid-column:1;grid-row:1}.access-controls{grid-column:1;grid-row:2;gap:12px;flex-wrap:wrap}.access-controls label{flex-direction:row;align-items:center}.access-controls select{max-width:150px}.main{padding:14px}.hero{padding:19px;border-radius:18px;align-items:flex-start;flex-direction:column;gap:14px}.hero h2{font-size:24px}.cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.metric{padding:14px}.metric strong{font-size:29px}.filters,.grid2,.grid3,.charts,.quick,.paper-grid,.history-fields,.info-grid{grid-template-columns:1fr}.selected-summary,.summary{grid-template-columns:repeat(2,minmax(0,1fr))}.panel-head,.panel-body{padding:16px}.extra-filters{padding:0 16px 16px}.extra-filters label{min-width:0;flex-basis:100%}.paper{padding:20px 16px}.paper-title{margin:-20px -16px 18px;padding:18px 16px}.bar-row{grid-template-columns:minmax(90px,1fr) 1fr 32px}.photo-add{grid-template-columns:1fr}.actions{gap:8px}.actions .btn{white-space:normal}.case-table,.cases{min-width:900px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
}

</style>
</head>
<body>
<div class="app">
  <aside class="sidebar">
    <div class="brand"><b>Atendimento</b><span>Atendimento integrado</span></div>
    <nav class="nav">
      <div class="group">Visão de trabalho</div>
      <button data-page="carteira"><span>◫ &nbsp; Escolher atendimento</span></button>
      <button data-page="ficha"><span>▤ &nbsp; Editar ficha Sabesp</span></button>
      <button data-page="demandas"><span>✓ &nbsp; Contatos internos</span></button>
      <button data-page="avisos"><span>✉ &nbsp; Avisos e acompanhamento</span></button><button data-page="encerrar"><span>● &nbsp; Concluir atendimento</span></button>
      <div class="group">Entrega</div>
      <button data-page="pacote"><span>⬇ &nbsp; Pacote mensal</span></button>
      <div class="group">Ferramentas</div>
      <button data-page="comunicacao"><span>↔ &nbsp; Passar para outra área</span></button>
      <button data-page="mesclar"><span>⇄ &nbsp; Mesclar protocolos</span></button>
      <button data-page="historico"><span>＋ &nbsp; Cadastro histórico</span></button>
      <button data-page="acessos"><span>? &nbsp; Ajuda e acessos</span></button><button data-page="atualizar"><span>↻ &nbsp; Atualização</span></button>
    </nav>
    <div class="version" id="version">Painel 3.0</div>
  </aside>
  <div class="workspace">
    <header class="topbar">
      <div class="title"><h1>Painel de Trabalho</h1><p>Edição, validação e acompanhamento das fichas</p></div>
      <div class="case-picker"><label for="caseSelect">Ficha em foco</label><select id="caseSelect"><option value="">Selecione um atendimento</option></select></div>
      <div class="status-dot"><i></i><span id="syncLabel">Base protegida</span></div>
    <div class="access-controls"><label>Janela<select id="uiSize"><option value="notebook">Notebook</option><option value="compact">Compacta</option><option value="wide">Ampla</option><option value="auto">Ajustar à tela</option></select></label><label>Letras<select id="uiFont"><option value="14">Padrão</option><option value="16" selected>Confortável</option><option value="18">Grande</option><option value="20">Muito grande</option></select></label></div></header>
    <main class="main">
      <div id="globalMessage" class="notice" role="status" aria-live="polite"></div>
      <section class="page" id="avisos"><div id="avisosHost"></div></section>
<section class="page" id="mesclar"><div class="hero"><div><h2>Uma demanda, um protocolo principal</h2><p>Incorpore uma ficha duplicada após conferir as duas solicitações.</p></div></div><div class="panel"><div class="panel-body"><div class="grid2"><label>Ficha duplicada — será incorporada<select id="mergeSource"></select></label><label>Ficha principal — continuará na carteira<select id="mergeTarget"></select></label></div><button class="btn" id="mergePreview">Conferir as duas fichas</button><div id="mergeSummary" class="grid2" style="margin-top:16px"></div><p class="notice warn">O protocolo principal mantém seus textos, fotos selecionadas e situação. O histórico, os relatos e os links de fotos da duplicada passam a ser consultados nele. A ficha incorporada sai da carteira após a sincronização; seus dados de origem são preservados. Não mescle apenas por coincidência de nome.</p><label>Motivo<textarea id="mergeReason" maxlength="1500"></textarea></label><label><input type="checkbox" id="mergeCheck" style="width:auto"> Conferi e confirmo que é a mesma demanda e que o principal foi escolhido corretamente.</label><button class="btn primary" id="mergeConfirm">Confirmar incorporação</button></div></div></section>
<section class="page" id="acessos"><div class="hero"><div><h2>Ajuda e acesso da equipe</h2><p>Confira esta tela usando a conta da pessoa que encontrou o problema.</p></div></div><div class="panel"><div class="panel-body"><h3>Onde faço cada coisa?</h3><p><b>Escolher atendimento:</b> encontrar o caso e selecionar a ficha em foco.<br><b>Passar para outra área:</b> encaminhar, comentar e combinar ações.<br><b>Editar ficha Sabesp:</b> revisar texto e fotos do documento oficial.<br><b>Contatos internos:</b> registrar tentativas e acompanhamento exclusivo do Atendimento.<br><b>Concluir atendimento:</b> registrar solução, devolutiva e motivo da conclusão sem pesquisa.<br><b>Avisos:</b> preparar e copiar o acompanhamento para a equipe.</p><button class="btn primary" id="checkAccess">Verificar meus acessos</button><a id="authLink" class="btn" target="_blank" rel="noopener" hidden>Autorizar aplicativo</a><pre id="accessReport" style="white-space:pre-wrap;font:inherit"></pre><div id="accessLinks" class="link-list"></div><div id="adminAccess" hidden><label>E-mails das atendentes, já editoras do Controle<textarea id="accessEmails" placeholder="uma.pessoa@empresa.com; outra.pessoa@empresa.com"></textarea></label><button class="btn" id="grantQueue">Liberar somente a fila de solicitações</button></div><p class="hint">Compartilhar uma planilha e autorizar o aplicativo são etapas diferentes. Não é necessário retirar a proteção do Histórico ou do Dashboard para trabalhar pela janela.</p></div></div></section>
<section class="page" id="carteira">
        <div class="hero"><div><h2>Carteira de atendimentos</h2><p>Uma visão única de prioridade, responsabilidade e última movimentação.</p></div><button class="btn" id="refreshPortfolio">Atualizar visão</button></div>
        <div class="cards" id="metrics"></div>
        <div class="panel"><div class="panel-head"><h3>Fichas e próximos movimentos</h3><span class="hint" id="caseCount"></span></div><div class="panel-body"><div class="filters"><input id="searchCases" placeholder="Buscar protocolo, pessoa, endereço ou assunto"><select id="filterArea"><option value="">Todas as áreas</option></select><select id="filterStatus"><option value="abertas">Somente em aberto</option><option value="">Todos os status</option><option>Recebida</option><option>Em andamento</option><option>Aguardando finalização</option><option>Concluída</option></select><select id="filterPriority"><option value="">Todas as prioridades</option><option>Urgente</option><option>Alto</option><option>Médio</option><option>Baixo</option></select></div></div><details class="priority-help"><summary>Mais filtros, ordenação e regra de prioridade</summary><div class="extra-filters"><label>Tempo em aberto<select id="ageFilter"><option value="">Qualquer idade</option><option value="7">7 dias ou mais</option><option value="15">15 dias ou mais</option><option value="30">30 dias ou mais</option><option value="90">90 dias ou mais</option></select></label><label>Necessidade<select id="needFilter"><option value="">Todas</option><option value="review">Aguardando finalizar</option><option value="unread">Mensagens não lidas</option><option value="document">Revisão documental</option></select></label><label>Ordem<select id="orderFilter"><option value="priority">Prioridade e antiguidade</option><option value="oldest">Mais antigas primeiro</option><option value="signals">Mais mensagens não lidas</option></select></label><button class="btn" id="clearFilters" type="button">Limpar filtros</button></div><p>Prioridade informada + um nível a cada 7 dias corridos, até Urgente. Desempate pela antiguidade. Regra interna de organização.</p></details><div class="table-wrap"><table class="case-table"><thead><tr><th>Ficha</th><th>Responsabilidade</th><th>Prioridade</th><th>Próximo movimento</th><th>Última atualização da outra área</th><th>Status</th></tr></thead><tbody id="caseRows"></tbody></table></div></div>
      </section>
      <section class="page" id="comunicacao">
        <div class="hero"><div><h2>Comunicação entre áreas</h2><p>Comentários, encaminhamentos e compromissos preservados em ordem cronológica.</p></div></div>
        <div class="selected-summary" data-summary></div>
        <div class="grid2"><div>
          <div class="panel"><div class="panel-head"><h3>Passar a ficha adiante</h3></div><div class="panel-body"><label for="commDestination">Encaminhar para</label><select id="commDestination"></select><label for="commMessage">Contexto e necessidade</label><textarea id="commMessage" placeholder="Registre o que já foi feito e o que a outra área precisa analisar."></textarea><label for="commFiles">Links de apoio</label><textarea id="commFiles" placeholder="Um link do Drive por linha"></textarea><div class="actions"><button class="btn primary" id="saveComm">Registrar e sinalizar</button></div></div></div>
          <div class="panel"><div class="panel-head"><h3>Novo item de acompanhamento</h3></div><div class="panel-body"><label for="checkTitle">Resultado esperado</label><input id="checkTitle" placeholder="Ex.: Confirmar a recomposição da calçada"><div class="grid3"><div><label for="checkDestination">Responsável</label><select id="checkDestination"></select></div><div><label for="checkPriority">Prioridade</label><select id="checkPriority"><option>Baixa</option><option selected>Média</option><option>Alta</option><option>Urgente</option></select></div><div><label for="checkDeadline">Prazo</label><input id="checkDeadline" placeholder="dd/mm/aaaa"></div></div><label for="checkContext">Contexto</label><textarea id="checkContext" placeholder="Informação que ajuda a concluir o item"></textarea><button class="btn primary" id="createCheck">Criar item</button></div></div>
        </div><div><div class="panel"><div class="panel-head"><h3>Compromissos da ficha</h3></div><div class="panel-body"><div class="checklist" id="checklist"></div></div></div><div class="panel"><div class="panel-head"><h3>Linha do tempo compartilhada</h3></div><div class="panel-body"><div class="timeline" id="commTimeline"></div></div></div></div></div>
      </section>
      <section class="page" id="ficha">
        <div class="hero"><div><h2>Ficha final para a Sabesp</h2><p>A aparência abaixo reproduz a leitura do documento final. Os campos destacados podem ser revisados diretamente.</p></div></div>
        <div class="selected-summary" data-summary></div>
        <div class="paper-wrap"><article class="paper" id="paper"><div class="paper-title"><h3>FICHA DE ATENDIMENTO</h3><p id="paperProtocol">Selecione uma ficha</p></div><div class="paper-grid"><div><label>Empresa contratada</label><input value="Consórcio Performance Tamanduateí" disabled></div><div><label>Responsável pelo atendimento</label><input id="ed_responsavel"></div><div><label>Data</label><input id="ed_dataAbertura"></div><div><label>Horário</label><input id="ed_horario"></div><div><label>Local do atendimento</label><input id="ed_localAtendimento"></div><div><label>Assunto</label><input id="ed_assunto"></div><div><label>Tipo de manifestação</label><select id="ed_tipo"><option>Reclamação</option><option>Solicitação</option><option>Informação</option><option>Elogio</option><option>Danos à calçada</option><option>Ligações de Esgoto</option><option>Danos e limpeza da via</option><option>Danos à edificação</option><option>Danos a veículos</option><option>Transtornos causados pela obra</option><option>Outros</option></select></div></div><div class="paper-section"><h4>Dados do cliente</h4><div class="paper-grid"><div><label>Nome</label><input id="ed_nome"></div><div><label>Telefone</label><input id="ed_telefone"></div><div><label>E-mail</label><input id="ed_email"></div><div><label>Endereço</label><input id="ed_endereco"></div></div></div><div class="paper-section"><h4>Solicitação</h4><textarea id="ed_solicitacao"></textarea><label>Complemento da ocorrência</label><textarea id="ed_descricao"></textarea></div><div class="paper-section"><h4>Providências realizadas</h4><textarea id="ed_providencias"></textarea></div><div class="paper-section"><h4>Conclusão</h4><textarea id="ed_conclusao"></textarea></div><div class="paper-section"><h4>Registro fotográfico</h4><div class="photo-grid" id="photoGrid"></div><div class="photo-add screen-only"><textarea id="newPhotoLinks" placeholder="Cole links do Drive, um por linha"></textarea><select id="newPhotoGroup"><option value="abertura">Fotos da abertura</option><option value="execucao">Fotos da execução</option></select></div><button class="btn small screen-only" id="addPhotoLinks">Adicionar links à ficha</button></div><div class="paper-section"><b>Status: </b><span id="paperStatus"></span></div></article></div>
        <div class="panel"><div class="panel-body"><label for="editReason">Registro desta revisão</label><textarea id="editReason" placeholder="Explique por que a ficha foi revisada. O motivo fica apenas na auditoria interna."></textarea><div class="actions"><button class="btn primary" id="saveSheet">Salvar alterações da ficha</button><button class="btn dark" id="generate">Gerar PDF atualizado</button><button class="btn" id="goClose">Revisar e encerrar este atendimento</button><button class="btn" id="printSheet">Imprimir prévia</button><a class="btn" id="openPdf" target="_blank" hidden>Abrir PDF atual</a></div><p class="hint">Salvar não altera as respostas originais. Cada campo modificado gera uma revisão rastreável antes de atualizar o PDF.</p></div></div>
      </section>
      <section class="page" id="demandas"><div class="hero"><div><h2>Acompanhamento interno</h2><p>Contatos, cobranças e controles exclusivos do Atendimento. Esta área não aparece no painel da Execução nem na ficha Sabesp.</p></div></div><div class="selected-summary" data-summary></div><div class="grid2"><div class="panel"><div class="panel-head"><h3>Ações atuais</h3></div><div class="panel-body"><label for="taskSelect">Ação pendente</label><select id="taskSelect"><option value="">Selecione</option></select><p id="taskInfo" class="hint"></p><div id="taskContact" class="link-list"></div><label for="taskReport">Registro do acompanhamento</label><textarea id="taskReport"></textarea><button class="btn primary" id="saveTask">Concluir esta ação</button></div></div><div class="panel"><div class="panel-head"><h3>Histórico operacional</h3></div><div class="panel-body"><div class="timeline" id="internalTimeline"></div></div></div></div></section>
      <section class="page" id="encerrar"><div class="hero"><div><h2>Concluir o atendimento</h2><p>O Atendimento confere a solução e a devolutiva e registra o encerramento diretamente. Esta ação não gera avaliação ou nota do cliente.</p></div></div><div class="selected-summary" data-summary></div><div class="panel"><div class="panel-body"><p class="notice loading">1. Confira a solução · 2. Registre a devolutiva · 3. Confirme o encerramento. Salvar um texto na ficha Sabesp não encerra o caso.</p><label for="tratativa">1. Solução realizada — texto da ficha</label><textarea id="tratativa"></textarea><label for="devolutiva">2. Devolutiva ao morador — texto da ficha</label><textarea id="devolutiva"></textarea><div class="grid2"><div><label for="resultado">Resultado do contato</label><select id="resultado"><option value="">Selecione</option><option>Cliente informado e ciente</option><option>Cliente informado, mas discordou</option></select></div><div><label for="dataContato">Data da devolutiva</label><input id="dataContato" placeholder="dd/mm/aaaa"></div><div><label for="responsavel">Responsável pelo atendimento</label><input id="responsavel"></div><div><label for="canal">Canal do contato — interno</label><select id="canal"><option value="">Selecione</option><option>Ligação telefônica</option><option>WhatsApp</option><option>Presencial</option><option>E-mail</option><option>Outro</option></select></div></div><div class="notice warn">O canal e o resultado do contato permanecem no controle administrativo. O texto público da ficha recebe apenas a devolutiva.</div><label for="motivoSemPesquisa">Motivo para concluir sem pesquisa de satisfação</label><textarea id="motivoSemPesquisa" placeholder="Ex.: formulário de pesquisa indisponível; devolutiva realizada por telefone."></textarea><div id="closeChecklist" class="notice loading" role="status"></div><button class="btn primary" id="closeCase">3. Confirmar encerramento sem pesquisa</button><p class="hint">Ao confirmar, você recebe um número de solicitação. Pode continuar usando o painel; a automação conclui a gravação e a atualização.</p></div></div></section>
      <section class="page" id="pacote"><div class="hero"><div><h2>Pacote mensal Sabesp</h2><p>Conferência do período, composição das fichas e arquivo ZIP para entrega.</p></div></div><div class="panel"><div class="panel-body"><div class="grid2"><div><label for="packageMonth">Período do pacote</label><input id="packageMonth" type="month"></div><div class="actions" style="align-items:end"><button class="btn" id="checkPackage">Conferir composição</button><button class="btn primary" id="makePackage">Gerar pacote conferido</button></div></div><p id="legacyPackage" class="hint"></p><div id="packageSummary"></div><div class="timeline" id="packageList"></div><div id="packageLinks" class="link-list"></div></div></div></section>
      <section class="page" id="historico"><div class="hero"><div><h2>Cadastro de histórico</h2><p>Inclusão ou revisão de fichas antigas já encerradas, preservando todas as versões.</p></div></div><div class="panel"><div class="panel-body"><label for="historySelect">Cadastro</label><select id="historySelect"><option value="">Novo cadastro</option></select></div></div><div class="history-form" id="historyFields"></div><div class="sticky-actions"><button class="btn primary" id="saveHistory">Salvar cadastro histórico</button></div></section>
      <section class="page" id="atualizar"><div class="hero"><div><h2>Atualização e integridade</h2><p>Consolida formulários, revisões, fichas e anexos sem alterar as respostas originais.</p></div></div><div class="panel"><div class="panel-body"><h3>Sincronização segura</h3><p class="hint">A solicitação continua em segundo plano se a janela for fechada. O mesmo pedido não é duplicado.</p><div class="actions"><button class="btn primary" id="refreshData">Atualizar consultas e anexos</button><button class="btn" id="resume">Consultar última solicitação</button><button class="btn" id="retryJob" hidden>Tentar novamente</button></div><p id="resumeStatus" class="hint"></p><div id="jobLinks" class="link-list"></div></div></div></section>
    </main>
  </div>
</div>
<script>

function statusLabel(s){return s==='Aguardando finalização'?'Aguardando revisão e finalização do Atendimento':s}
(function(){var key='atd-access-v3',size=document.getElementById('uiSize'),font=document.getElementById('uiFont');size.value='wide';try{var saved=JSON.parse(localStorage.getItem(key)||'{}');if(saved.size)size.value=saved.size;if(saved.font)font.value=saved.font}catch(e){}
function apply(){var px=Number(font.value)||16;document.documentElement.style.fontSize=px+'px';document.documentElement.style.setProperty('--ui-font',px+'px');
// Mais altura no Amplo; a interface do Google pode limitar o tamanho final.
var sw=screen.availWidth||1440,sh=screen.availHeight||900,ow=window.outerWidth,oh=window.outerHeight;
var bw=ow>600?Math.min(sw,ow):sw,bh=oh>450?Math.min(sh,oh):sh;
var maxW=Math.max(480,bw-64),maxH=Math.max(340,bh-110);
var dims={compact:[Math.min(980,maxW),Math.min(540,maxH*.78)],notebook:[Math.min(1180,maxW*.87),Math.min(660,maxH*.85)],wide:[maxW,maxH],auto:[maxW,maxH]},d=dims[size.value]||dims.wide;
google.script.host.setWidth(Math.round(d[0]));google.script.host.setHeight(Math.round(d[1]));try{localStorage.setItem(key,JSON.stringify({size:size.value,font:font.value}))}catch(e){}}
size.onchange=apply;font.onchange=apply;apply();})();

  var initialMode='__MODO__',state={data:null,cases:[],current:null,mode:'carteira',busy:false,token:0,preview:null,photos:{abertura:[],execucao:[]},tasks:[],historyKey:'',historyRevision:0,lastJob:''};
  var pages=['carteira','comunicacao','ficha','demandas','encerrar','pacote','historico','atualizar','avisos','mesclar','acessos'];
  var editKeys=['dataAbertura','horario','localAtendimento','responsavel','nome','telefone','email','endereco','assunto','tipo','solicitacao','descricao','providencias','conclusao'];
  function el(id){return document.getElementById(id)}
  function esc(value){return String(value==null?'':value).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]})}
  function uid(){return self.crypto&&crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)})}
  function call(name){var args=[].slice.call(arguments,1);return new Promise(function(resolve,reject){var runner=google.script.run.withSuccessHandler(resolve).withFailureHandler(reject);runner[name](...args)})}
  async function rpc(name){var args=[].slice.call(arguments,1),result=await call.apply(null,[name].concat(args));if(result&&result.pedido)return followJob(result.pedido);return result}
  function message(text,type){var box=el('globalMessage');box.textContent=text||'';box.className='notice '+(type||'ok');if(text)box.scrollIntoView({block:'nearest'})}
  function setBusy(on){state.busy=on;document.querySelectorAll('button').forEach(function(button){button.disabled=on&&!button.hasAttribute('data-page')});el('syncLabel').innerHTML=on?'<span class="loader"></span> Processando':'Base protegida'}
  async function action(fn){if(state.busy)return;setBusy(true);message('Aguarde enquanto a informação é conferida…','loading');try{await fn()}catch(error){message(error&&error.message?error.message:String(error),'error')}finally{setBusy(false)}}
  
var avisosMounted=false;
function mountAvisos(){if(avisosMounted)return;avisosMounted=true;const root=window.document.getElementById('avisosHost').attachShadow({mode:'open'});root.innerHTML=__AD_MARKUP__;const document={getElementById:id=>root.getElementById(id),createElement:tag=>window.document.createElement(tag),body:root,execCommand:cmd=>window.document.execCommand(cmd)};

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

}
var mergePreviewData=null;
function populateMerge(){['mergeSource','mergeTarget'].forEach(function(id){var s=el(id),old=s.value;s.replaceChildren(new Option('Selecione uma ficha',''));state.cases.filter(c=>c.status!=='Concluída'&&!c.historico).forEach(c=>s.add(new Option(c.id+' · '+c.nome,c.id)));s.value=old});mergePreviewData=null;el('mergeCheck').checked=false}
['mergeSource','mergeTarget'].forEach(id=>el(id).onchange=function(){mergePreviewData=null;el('mergeCheck').checked=false;el('mergeSummary').replaceChildren()});
el('mergePreview').onclick=function(){action(async function(){mergePreviewData=await call('painelPreviaMescla',{origem:el('mergeSource').value,principal:el('mergeTarget').value});el('mergeSummary').replaceChildren();['origem','principal'].forEach(function(k){var c=mergePreviewData[k],div=window.document.createElement('div');div.className='notice loading';var title=window.document.createElement('b');title.textContent=(k==='origem'?'Incorporar: ':'Manter: ')+c.id;var text=window.document.createElement('p');text.textContent=[c.nome,c.endereco,c.demanda,statusLabel(c.status)].filter(Boolean).join(' · ');div.append(title,text);el('mergeSummary').append(div)});message('Confira as duas demandas, o destino e o motivo antes de confirmar.','ok')})};
el('mergeConfirm').onclick=function(){action(async function(){if(!mergePreviewData)throw Error('Confira as duas fichas primeiro.');if(!el('mergeCheck').checked)throw Error('Confirme a conferência das demandas.');var result=await call('painelConfirmarMescla',{origem:mergePreviewData.origem.id,principal:mergePreviewData.principal.id,assinatura:mergePreviewData.assinatura,motivo:el('mergeReason').value,confirmado:true});mergePreviewData=null;el('mergeCheck').checked=false;await reloadAll('');populateMerge();message(result.mensagem,'ok')})};

  function show(page){if(pages.indexOf(page)<0)page='carteira';state.mode=page;if(page==='avisos')mountAvisos();if(page==='mesclar')populateMerge();if(page==='encerrar')closeGuide();document.querySelectorAll('.page').forEach(function(section){section.classList.toggle('active',section.id===page)});document.querySelectorAll('[data-page]').forEach(function(button){button.classList.toggle('active',button.dataset.page===page)});message('');if(state.current){if(page==='comunicacao')renderCommunication(state.current.comunicacao);if(page==='demandas'&&!state.busy)loadTasks();}}
  document.querySelectorAll('[data-page]').forEach(function(button){button.onclick=function(){show(button.dataset.page)}});
  function fillSelect(select,values,placeholder){select.replaceChildren(new Option(placeholder||'Selecione',''));(values||[]).forEach(function(value){select.add(new Option(value,value))})}
  function areaClass(value){return /execu/i.test(value)?'exec':'atd'}
  function summaryHtml(){var c=state.current;if(!c)return '<div class="empty span2">Selecione uma ficha no topo da janela.</div>';return '<div><small>Protocolo</small><b>'+esc(c.id)+'</b></div><div><small>Status</small><b>'+esc(statusLabel(c.status))+'</b></div><div><small>Com quem está</small><b>'+esc(c.area||'Em triagem')+'</b></div><div><small>Próximo movimento</small><b>'+esc(c.proxima||'Em análise')+'</b></div>'}
  function renderSummaries(){document.querySelectorAll('[data-summary]').forEach(function(box){box.innerHTML=summaryHtml()})}
  function renderMetrics(){var i=state.data.indicadores||{},items=[['Pendências ativas',i.abertos||0,'carteira atual','petrol'],['Com Atendimento',i.atendimento||0,'ação ou validação','blue'],['Com Execução',i.execucao||0,'providência em campo','orange'],['Alta prioridade',i.urgentes||0,'alto ou urgente','red'],['Novas mensagens',i.naoLidas||0,'para o Atendimento','lime']];el('metrics').innerHTML=items.map(function(m){return '<div class="metric '+m[3]+'"><small>'+m[0]+'</small><strong>'+m[1]+'</strong><span>'+m[2]+'</span></div>'}).join('')}
  function caseMatches(c){var q=el('searchCases').value.toLowerCase(),hay=[c.id,c.nome,c.endereco,c.assunto,c.resumo,c.proxima,c.procedencia].join(' ').toLowerCase();return(!q||hay.indexOf(q)>=0)&&(!el('filterArea').value||c.area===el('filterArea').value)&&(!el('filterStatus').value||(el('filterStatus').value==='abertas'?!/conclu|encerrad/i.test(c.status):c.status===el('filterStatus').value))&&(!el('filterPriority').value||String(c.urgencia).indexOf(el('filterPriority').value)>=0)}

  el('clearFilters').onclick=function(){["searchCases", "filterArea", "filterStatus", "filterPriority", "ageFilter", "needFilter"].forEach(function(id){el(id).value=''});el('orderFilter').value='priority';el('filterStatus').value='abertas';renderCases()};
  function extraMatches(c){var age=el('ageFilter').value,need=el('needFilter').value;return (!age||(c.dias!==''&&Number(c.dias)>=Number(age)))&&(!need||(need==='review'&&/aguardando.*finaliza/i.test(c.status))||(need==='unread'&&c.naoLidas>0)||(need==='document'&&c.revisao));}
  function orderRows(rows){var mode=el('orderFilter').value;return rows.sort(function(a,b){if(mode==='oldest')return (Number(b.dias)||0)-(Number(a.dias)||0);if(mode==='signals')return (Number(b.naoLidas)||0)-(Number(a.naoLidas)||0)||(Number(b.pontos)||0)-(Number(a.pontos)||0);return (Number(b.pontos)||0)-(Number(a.pontos)||0)||(Number(b.dias)||0)-(Number(a.dias)||0)});}
  ['ageFilter','needFilter','orderFilter'].forEach(function(id){el(id).onchange=renderCases});
  function renderCases(){var rows=orderRows(state.cases.filter(caseMatches).filter(extraMatches));el('caseCount').textContent=rows.length+' ficha(s) com estes filtros · cartões acima: carteira total';el('caseRows').innerHTML=rows.map(function(c){var last=c.ultimaOutraArea||'Sem atualização compartilhada';return '<tr data-id="'+esc(c.id)+'" class="'+(state.current&&state.current.id===c.id?'selected':'')+'"><td><span class="protocol">'+esc(c.id)+'</span><br><b>'+esc(c.nome||'Nome em conferência')+'</b><br><small>'+esc(c.endereco||'Endereço em conferência')+'</small><div style="margin-top:8px;color:#234e66;font-size:13px;max-width:360px;white-space:normal"><b>'+esc(c.assunto||'Demanda')+'</b><br>'+esc(c.resumo||'Resumo não informado')+'</div></td><td><span class="badge '+areaClass(c.area)+'">'+esc(c.area||'Em triagem')+'</span> '+(c.naoLidas?'<span class="dot-alert">'+c.naoLidas+'</span>':'')+'</td><td><span class="badge '+(/alto|urgente/i.test(c.urgencia)?'alert':'')+'">'+esc(c.urgencia)+'</span><small class="priority-note" title="'+esc(c.motivoPrioridade||'')+'">'+esc(c.prioridadeOriginal?'Informada: '+c.prioridadeOriginal:'')+'</small><br><small>'+esc(c.dias===''?'Concluída':c.dias+' dias em aberto')+'</small></td><td>'+esc(c.proxima)+'</td><td>'+esc(last)+'</td><td><span class="badge">'+esc(statusLabel(c.status))+'</span>'+(c.revisao?'<br><span class="badge alert">Revisão necessária</span>':'')+'</td></tr>'}).join('')||'<tr><td colspan="6" class="empty">Nenhuma ficha corresponde aos filtros.</td></tr>';el('caseRows').querySelectorAll('tr[data-id]').forEach(function(row){row.onclick=function(){selectCase(row.dataset.id,'comunicacao')}})}
  var caseSearchTimer;function scheduleCaseSearch(){clearTimeout(caseSearchTimer);caseSearchTimer=setTimeout(renderCases,140)}function applyCaseFilters(){clearTimeout(caseSearchTimer);renderCases()}el('searchCases').oninput=scheduleCaseSearch;el('searchCases').onchange=applyCaseFilters;["filterArea", "filterStatus", "filterPriority"].forEach(function(id){el(id).onchange=applyCaseFilters});
  function populateCases(){var select=el('caseSelect'),current=select.value;select.replaceChildren(new Option('Selecione um atendimento',''));state.cases.forEach(function(c){select.add(new Option(c.id+' · '+(c.nome||'Nome em conferência'),c.id))});if(current)select.value=current}
  async function loadCaseRaw(id,nextPage){var token=++state.token;el('caseSelect').value=id;var result=await rpc('painelCarregarFicha',id);if(token!==state.token)return;state.current=result;fillCurrent();renderCases();if(nextPage)show(nextPage);if(state.mode==='demandas')await fetchTasksRaw();message('Ficha '+id+' carregada.','ok')}
  async function selectCase(id,nextPage){await action(async function(){await loadCaseRaw(id,nextPage)})}
  el('caseSelect').onchange=function(){if(this.value)selectCase(this.value);else{state.current=null;renderSummaries();renderCases()}};
  function fillCurrent(){var c=state.current||{};renderSummaries();editKeys.forEach(function(key){if(el('ed_'+key))el('ed_'+key).value=c.camposPublicos&&c.camposPublicos[key]||''});el('paperProtocol').textContent=(c.id||'')+' · '+(c.abertura||'');el('paperStatus').textContent=statusLabel(c.status)||'';el('tratativa').value=c.providencias||'';el('responsavel').value=c.responsavel||'';['resultado','canal','motivoSemPesquisa'].forEach(function(id){el(id).value=''});el('devolutiva').value=c.conclusao||'';el('dataContato').value=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo'}).format(new Date());closeGuide();state.photos={abertura:[],execucao:[]};(c.fotos||[]).forEach(function(photo){state.photos[photo.grupo].push(photo)});renderPhotos();renderCommunication(c.comunicacao);renderInternal(c.historicoOperacional);el('openPdf').hidden=!c.pdf;el('openPdf').href=c.pdf||'#'}
  function renderPhotos(){var all=state.photos.abertura.concat(state.photos.execucao);el('photoGrid').innerHTML=all.map(function(photo,index){var content=photo.preview?'<img src="'+photo.preview+'" alt="'+esc(photo.nome)+'">':'<div class="placeholder">'+esc(photo.nome||photo.link)+'</div>';return '<div class="photo" data-group="'+photo.grupo+'" data-link="'+esc(photo.link)+'">'+content+'<button title="Retirar desta ficha" data-remove="'+index+'">×</button></div>'}).join('')||'<div class="empty span2">Nenhuma foto incorporada nesta ficha.</div>';el('photoGrid').querySelectorAll('[data-remove]').forEach(function(button){button.onclick=function(){var box=button.parentElement,group=box.dataset.group,link=box.dataset.link;state.photos[group]=state.photos[group].filter(function(photo){return photo.link!==link});renderPhotos()}})}
  el('addPhotoLinks').onclick=function(){if(!state.current)return message('Selecione uma ficha.','error');var group=el('newPhotoGroup').value,links=el('newPhotoLinks').value.split(/[\\n,;]+/).map(function(v){return v.trim()}).filter(Boolean);links.forEach(function(link){if(!state.photos[group].some(function(p){return p.link===link}))state.photos[group].push({link:link,nome:'Novo link do Drive',preview:'',grupo:group})});el('newPhotoLinks').value='';renderPhotos()};
  function renderCommunication(comm){comm=comm||{checklist:[],eventos:[]};el('checklist').innerHTML=(comm.checklist||[]).map(function(item){var done=item.situacao==='Concluído';return '<label class="check-item '+(done?'done':'')+'"><input type="checkbox" data-check="'+esc(item.chave)+'" '+(done?'checked':'')+'><span><b>'+esc(item.titulo)+'</b><small>'+esc(item.destino||'Sem responsável')+' · '+esc(item.prioridade||'Média')+(item.prazo?' · até '+esc(item.prazo):'')+'</small></span><span class="badge">'+esc(item.situacao)+'</span></label>'}).join('')||'<div class="empty">Nenhum compromisso compartilhado.</div>';el('checklist').querySelectorAll('[data-check]').forEach(function(box){box.onchange=function(){toggleCheck(box.dataset.check,box.checked)}});el('commTimeline').innerHTML=(comm.eventos||[]).map(function(item){return '<div class="event '+(/execu/i.test(item.area)?'execucao':'atendimento')+'"><b>'+esc(item.tipo)+' · '+esc(item.area)+' → '+esc(item.destino||'registro interno')+'</b><small>'+esc(item.data)+' · '+esc(item.usuario)+'</small><p>'+esc(item.mensagem||item.titulo)+'</p>'+(item.arquivos?'<small>'+esc(item.arquivos)+'</small>':'')+'</div>'}).join('')||'<div class="empty">Ainda não há mensagens nesta ficha.</div>'}
  async function toggleCheck(key,done){if(!state.current)return;await action(async function(){var result=await call('painelAlterarChecklist',{protocolo:state.current.id,chaveItem:key,situacao:done?'Concluído':'Pendente',destino:done?'Execução':'',mensagem:'',pedidoId:uid()});watchJob(result.pedido);message('Atualização do checklist recebida. Acompanhe em Atualização.','ok')})}
  el('saveComm').onclick=function(){action(async function(){if(!state.current)throw Error('Selecione uma ficha.');var result=await call('painelSalvarComunicacao',{protocolo:state.current.id,destino:el('commDestination').value,mensagem:el('commMessage').value,arquivos:el('commFiles').value,pedidoId:uid()});watchJob(result.pedido);el('commMessage').value='';el('commFiles').value='';message('Encaminhamento recebido. Pedido '+result.pedido+'. A comunicação será atualizada pela automação.','ok')})};
  el('createCheck').onclick=function(){action(async function(){if(!state.current)throw Error('Selecione uma ficha.');var result=await call('painelCriarChecklist',{protocolo:state.current.id,titulo:el('checkTitle').value,destino:el('checkDestination').value,prioridade:el('checkPriority').value,prazo:el('checkDeadline').value,mensagem:el('checkContext').value,pedidoId:uid()});watchJob(result.pedido);message('Atualização do checklist recebida. Acompanhe em Atualização.','ok')})};
  function renderInternal(items){el('internalTimeline').innerHTML=(items||[]).map(function(item){return '<div class="event"><b>'+esc(item.tipo||item.status)+' · '+esc(item.area||'')+'</b><small>'+esc(item.data)+' · '+esc(item.usuario)+'</small><p>'+esc(item.relato)+'</p></div>'}).join('')||'<div class="empty">Sem movimentações operacionais.</div>'}
  async function fetchTasksRaw(){if(!state.current)return;state.tasks=await rpc('painelDemandas',state.current.id);var select=el('taskSelect');select.replaceChildren(new Option('Selecione',''));state.tasks.forEach(function(task){select.add(new Option(task.tipo,task.chave))});el('taskInfo').textContent=state.tasks.length?'Selecione uma ação para ver o contexto.':'Não há ações internas pendentes nesta lista.'}
  async function loadTasks(){if(!state.current)return;await action(async function(){await fetchTasksRaw();message('','ok')})}
  el('taskSelect').onchange=function(){var task=state.tasks.find(function(item){return item.chave===el('taskSelect').value});el('taskInfo').textContent=task?task.acao+'\\n\\nPróxima etapa: '+task.proxima:'';el('taskReport').value=task?task.observacao||'':'';el('taskContact').innerHTML=task&&task.whatsapp?'<a href="'+task.whatsapp+'" target="_blank" rel="noopener">Abrir conversa no WhatsApp</a>':''};
  el('saveTask').onclick=function(){action(async function(){if(!state.current||!el('taskSelect').value)throw Error('Selecione a ficha e a ação.');var result=await rpc('painelSalvarDemanda',{protocolo:state.current.id,chave:el('taskSelect').value,relato:el('taskReport').value,pedidoId:uid()});await fetchTasksRaw();message(result.mensagem,'ok')})};
  el('saveSheet').onclick=function(){action(async function(){if(!state.current)throw Error('Selecione uma ficha.');var values={};editKeys.forEach(function(key){values[key]=el('ed_'+key).value});values.fotosAbertura=state.photos.abertura.map(function(p){return p.link}).join('\\n');values.fotosExecucao=state.photos.execucao.map(function(p){return p.link}).join('\\n');var result=await rpc('painelSalvarFichaCompleta',{protocolo:state.current.id,assinatura:state.current.assinatura,valores:values,motivo:el('editReason').value,pedidoId:uid()});el('editReason').value='';message(result.mensagem||'Revisões aplicadas. Recarregue a ficha antes de gerar o PDF.','ok');state.current=await rpc('painelCarregarFicha',state.current.id);fillCurrent()})};
  el('generate').onclick=function(){action(async function(){if(!state.current)throw Error('Selecione uma ficha.');var result=await rpc('painelGerarFicha',state.current.id);state.current.pdf=result.pdf;el('openPdf').href=result.pdf;el('openPdf').hidden=false;message('PDF atualizado. Confira o documento antes do envio.','ok')})};
  el('printSheet').onclick=function(){if(!state.current)return message('Selecione uma ficha.','error');window.print()};
  el('closeCase').onclick=function(){action(async function(){if(!state.current)throw Error('Selecione uma ficha.');var p={protocolo:state.current.id,assinatura:state.current.assinaturaEncerramento,acaoId:state.current.acaoId,tratativa:el('tratativa').value,devolutiva:el('devolutiva').value,resultado:el('resultado').value,responsavel:el('responsavel').value,canal:el('canal').value,dataContato:el('dataContato').value,semPesquisa:true,motivoSemPesquisa:el('motivoSemPesquisa').value};var result=await call('painelEncerrar',p);state.lastJob=result.pedido;watchJob(result.pedido);message('Encerramento solicitado. Pedido '+result.pedido+'. Pode continuar usando o painel; acompanhe em Atualização.','ok')})};
  function buildHistoryForm(){var groups=[['Identificação',[['referencia','Referência da ficha anterior *'],['protocoloAnterior','Protocolo anterior'],['dataAbertura','Data da abertura *'],['dataConclusao','Data do encerramento *'],['nome','Nome do solicitante *'],['telefone','Telefone'],['email','E-mail'],['endereco','Endereço *'],['localAtendimento','Local do atendimento *'],['responsavel','Responsável pelo atendimento *']]],['Solicitação e tratativa',[['solicitacao','Solicitação do morador *','text'],['tratativaInicial','Tratativa inicial','text'],['solucao','O que foi realizado *','text'],['finalizacao','Resultado e devolutiva ao morador *','text']]],['Classificação e conferência',[['canalRecebimento','Canal de recebimento *'],['tipo','Tipo de manifestação *'],['frente','Frente de obra *'],['assunto','Assunto *'],['procedencia','Procedência *',['Procedente','Não procedente','Em análise']],['natureza','Forma de encerramento *',['Conclusão confirmada pelo morador','Encerramento administrativo sem resposta','Encerramento documentado em ficha anterior']],['fotosAbertura','Links das fotos da abertura'],['fotosSolucao','Links das fotos da execução'],['jaEnviado','Ficha já enviada à Sabesp? *',['Sim','Não']],['autor','Responsável pelo cadastro *'],['motivo','Motivo da inclusão ou correção *','text']]]];state.historyFields=[];var root=el('historyFields');root.innerHTML='';groups.forEach(function(group){var card=document.createElement('div');card.className='history-group';card.innerHTML='<h3>'+group[0]+'</h3>';var grid=document.createElement('div');grid.className='history-fields';group[1].forEach(function(field){state.historyFields.push(field[0]);var wrap=document.createElement('div');if(field[2]==='text')wrap.className='wide';var label=document.createElement('label');label.textContent=field[1];var input=document.createElement(Array.isArray(field[2])?'select':field[2]==='text'?'textarea':'input');input.id='h_'+field[0];if(Array.isArray(field[2])){input.add(new Option('Selecione',''));field[2].forEach(function(v){input.add(new Option(v,v))})}wrap.append(label,input);grid.append(wrap)});card.append(grid);root.append(card)})}
  el('historySelect').onchange=function(){action(async function(){var key=el('historySelect').value;if(!key){state.historyFields.forEach(function(k){el('h_'+k).value=''});state.historyKey='';state.historyRevision=0;message('Novo cadastro iniciado. Use somente informações conferidas.','ok');return}var result=await rpc('painelCarregarHistorico',key);state.historyKey=result.chave;state.historyRevision=result.revisao;state.historyFields.forEach(function(k){el('h_'+k).value=result.dados[k]||''});message('Cadastro carregado. A revisão anterior será preservada.','ok')})};
  el('saveHistory').onclick=function(){action(async function(){var data={};state.historyFields.forEach(function(k){data[k]=el('h_'+k).value});var result=await rpc('painelSalvarHistorico',{dados:data,chave:state.historyKey,revisao:state.historyRevision,pedidoId:uid()});state.historyKey=result.chave;state.historyRevision=result.revisao;if(!Array.from(el('historySelect').options).some(function(o){return o.value===result.chave}))el('historySelect').add(new Option(result.chave+' · '+data.nome,result.chave));el('historySelect').value=result.chave;message(result.mensagem,'ok')})};

var watchingJob='';
function watchJob(id){state.lastJob=id;watchingJob=id;el('resumeStatus').textContent='Solicitação '+id+' recebida. Pode continuar trabalhando.';var count=0;async function poll(){if(watchingJob!==id)return;try{var r=await call('painelConsultarPedido',id);if(!r)return;el('resumeStatus').textContent=r.tipo+' · '+r.estado;renderJobLinks(r.resultado||{});if(r.estado==='CONCLUÍDA'||r.estado==='ERRO'){watchingJob='';message(r.estado==='ERRO'?'Pedido '+id+': '+r.mensagem:(r.resultado&&r.resultado.mensagem||'Solicitação concluída. Atualize a visão para consultar o resultado.'),r.estado==='ERRO'?'error':'ok');return}}catch(e){el('resumeStatus').textContent='Pedido registrado; consulta temporariamente indisponível.'}if(++count<60)setTimeout(poll,10000)}setTimeout(poll,1500)}

  async function followJob(id){state.lastJob=id;for(var i=0;i<75;i++){var result=await call('painelConsultarPedido',id);if(!result)throw Error('Solicitação não localizada.');el('resumeStatus').textContent=result.tipo+' · '+result.estado;renderJobLinks(result.resultado||{});if(result.estado==='CONCLUÍDA')return result.resultado||{};if(result.estado==='ERRO'){el('retryJob').hidden=['PDF','PACOTE','ATUALIZAR'].indexOf(result.tipo)<0;throw Error((result.mensagem||'Falha no processamento')+'. O pedido foi preservado para conferência.')}message((result.resultado&&result.resultado.mensagem||'Solicitação recebida.')+' '+result.estado+'.','loading');await new Promise(function(resolve){setTimeout(resolve,4000)})}throw Error('A solicitação continua registrada. Consulte novamente em Atualização; não envie outra cópia.')}
  function renderJobLinks(result){var links=[['zip','Baixar pacote ZIP'],['pastaUrl','Abrir pasta do pacote'],['pdf','Abrir PDF atualizado']];el('jobLinks').innerHTML=links.filter(function(item){return result&&result[item[0]]}).map(function(item){return '<a href="'+result[item[0]]+'" target="_blank" rel="noopener">'+item[1]+'</a>'}).join('');el('packageLinks').innerHTML=el('jobLinks').innerHTML}
  el('packageMonth').onchange=function(){state.preview=null;el('packageSummary').textContent='';el('packageList').textContent=''};
  el('checkPackage').onclick=function(){action(async function(){state.preview=await rpc('painelPreviaPacote',el('packageMonth').value);el('packageSummary').innerHTML='<div class="cards" style="grid-template-columns:repeat(3,1fr);margin-top:14px"><div class="metric"><small>Total do pacote</small><strong>'+state.preview.total+'</strong></div><div class="metric"><small>Em aberto</small><strong>'+state.preview.abertas+'</strong></div><div class="metric"><small>Concluídas no período</small><strong>'+state.preview.concluidas+'</strong></div></div>';el('packageList').innerHTML=state.preview.fichas.map(function(f){return '<div class="event"><b>'+esc(f.id)+' · '+esc(f.nome)+'</b><small>'+esc(f.status)+'</small></div>'}).join('');message('Composição conferida. Revise a lista antes de gerar.','ok')})};
  el('makePackage').onclick=function(){action(async function(){if(!state.preview||state.preview.mes!==el('packageMonth').value)throw Error('Confira primeiro a composição do mês selecionado.');var result=await rpc('painelSolicitarPacote',{mes:state.preview.mes,assinatura:state.preview.assinatura,pedidoId:uid()});renderJobLinks(result);message(result.mensagem,'ok')})};
  el('refreshData').onclick=function(){action(async function(){var result=await rpc('painelAtualizarDados');message(result.mensagem||'Atualização concluída.','ok');await reloadAll(state.current&&state.current.id)})};
  el('resume').onclick=function(){action(async function(){if(!state.lastJob)throw Error('Não há solicitação recente nesta sessão.');var result=await followJob(state.lastJob);message(result.mensagem||'Solicitação concluída.','ok')})};
  el('retryJob').onclick=function(){action(async function(){var result=await rpc('painelTentarNovamente',state.lastJob);message(result.mensagem||'Processamento retomado.','ok')})};
  async function reloadAll(selected){var data=await rpc('painelIniciar');state.data=data;state.cases=data.casos||[];el('version').textContent='Painel '+data.versao;renderMetrics();populateCases();fillSelect(el('filterArea'),data.areas,'Todas as áreas');fillSelect(el('commDestination'),data.areas,'Selecione a área');fillSelect(el('checkDestination'),data.areas,'Selecione a área');el('packageMonth').value=data.mesAtual;el('legacyPackage').textContent=data.pacoteAnterior?'Existe uma fila anterior preservada para '+data.pacoteAnterior.slice(0,7)+'. O período abaixo continua independente.':'';el('historySelect').replaceChildren(new Option('Novo cadastro',''));(data.historicos||[]).forEach(function(h){el('historySelect').add(new Option(h.id+' · '+h.nome,h.id))});if(data.ultimaSolicitacao){state.lastJob=data.ultimaSolicitacao.id;el('resumeStatus').textContent=data.ultimaSolicitacao.tipo+' · '+data.ultimaSolicitacao.estado}renderCases();if(selected)await loadCaseRaw(selected);if(data.avisoComunicacao)message(data.avisoComunicacao,'warn')}
  el('refreshPortfolio').onclick=function(){action(async function(){await reloadAll(state.current&&state.current.id);message('Visão atualizada.','ok')})};

el('goClose').onclick=function(){if(!state.current){message('Selecione primeiro uma ficha.','warn');return}show('encerrar');closeGuide()};
function closeGuide(){var campos={tratativa:'solução realizada',devolutiva:'devolutiva ao morador',resultado:'resultado do contato',responsavel:'responsável',canal:'canal do contato',dataContato:'data da devolutiva',motivoSemPesquisa:'motivo para encerrar sem pesquisa'},faltam=Object.keys(campos).filter(k=>!el(k).value.trim());el('closeChecklist').textContent=!state.current?'Selecione a ficha em foco.':faltam.length?'Falta preencher: '+faltam.map(k=>campos[k]).join(', ')+'.':'Tudo preenchido. Revise e confirme o encerramento.';}
['tratativa','devolutiva','resultado','responsavel','canal','dataContato','motivoSemPesquisa'].forEach(id=>el(id).addEventListener('input',closeGuide));
el('checkAccess').onclick=async function(){try{el('accessReport').textContent='Verificando esta conta…';const r=await call('painelVerificarAcessos');el('accessReport').textContent='Conta: '+r.conta+'\\nResponsável pela automação: '+r.instalador+'\\n\\n'+r.verificacoes.map(c=>(c.ok?'✓ ':'Ajustar: ')+c.item+' — '+c.acao+(c.detalhe?'\\n'+c.detalhe:'')).join('\\n\\n');el('authLink').hidden=!r.autorizacao;el('authLink').href=r.autorizacao||'#';el('adminAccess').hidden=!r.administrador;el('accessLinks').replaceChildren();r.verificacoes.filter(c=>c.url).forEach(c=>{const a=window.document.createElement('a');a.textContent='Abrir: '+c.item;a.href=c.url;a.target='_blank';a.rel='noopener';el('accessLinks').append(a)})}catch(e){el('accessReport').textContent='Não foi possível verificar. Reabra a planilha e use ATENDIMENTO → Autorizar meu acesso. Se persistir, o administrador deve revisar as permissões do projeto. Detalhe: '+e.message}};
el('grantQueue').onclick=async function(){try{const r=await call('painelLiberarFilaEquipe',{emails:el('accessEmails').value});el('accessReport').textContent=r.mensagem}catch(e){el('accessReport').textContent=e.message}};

  buildHistoryForm();show(initialMode==='correcao'?'ficha':initialMode);action(async function(){await reloadAll('')});

  var refreshingPortfolio=false;
  setInterval(async function(){
    if(refreshingPortfolio||state.busy||document.hidden||!el('carteira').classList.contains('active'))return;
    refreshingPortfolio=true;
    try{var data=await rpc('painelIniciar');state.data=data;state.cases=data.casos||[];renderMetrics();renderCases();var picker=el('caseSelect'),selected=picker.value;picker.replaceChildren(new Option('Selecione uma ficha',''));state.cases.forEach(function(c){picker.add(new Option(c.id+' · '+(c.nome||'Nome em conferência'),c.id))});picker.value=selected;}
    catch(e){message('A atualização automática não terminou. A última consulta foi mantida. '+(e.message||''),'warn')}
    finally{refreshingPortfolio=false;}
  },60000);
</script>
</body>
</html>`.replace('__MODO__', ['carteira','avisos','mesclar','encerrar','historico','correcao','atualizar','acessos'].includes(modo)?modo:'carteira').replace('__AD_MARKUP__',JSON.stringify("<style>\n*{box-sizing:border-box}:host{margin:0;background:#eff5f9;color:#12394e;font:var(--ui-font,16px) Arial,sans-serif}header{padding:22px 26px;background:#073b56;color:white;border-top:4px solid #ed1b2f}h1{margin:0 0 6px;font-size:25px}h2{font-size:20px;margin:0 0 14px}h3{font-size:16px;margin:0 0 8px}main{padding:20px;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.8fr);gap:18px}.card{background:white;border:1px solid #d7e4ed;border-radius:14px;padding:22px;min-width:0}.wide{grid-column:1/-1}button,a.btn{display:inline-block;background:#087e91;color:white;border:0;border-radius:8px;padding:12px 15px;font:inherit;cursor:pointer;text-decoration:none;margin:4px 6px 4px 0}button.secondary,a.secondary{background:#e5eef4;color:#12394e}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid #009fe3;outline-offset:3px}button:disabled{opacity:.55;cursor:wait}input,textarea,select{font:inherit;width:100%;padding:11px;border:1px solid #b6ccd9;border-radius:7px;margin:6px 0 12px}textarea{min-height:85px;resize:vertical}p,small{line-height:1.5}small{color:#526e80}.stamp{font-size:13px;color:#526e80}#preview{white-space:pre-wrap;background:#f1f8fa;padding:18px;border-left:4px solid #009fe3;line-height:1.5;min-height:200px}#status{padding:12px 24px;color:#075669;background:#e9f5f7}#error{color:#a41c2e;white-space:pre-wrap}#warning{white-space:pre-wrap;font-size:13px;color:#71521d}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0 18px}.kpis div{background:#eef6fb;padding:12px;border-radius:9px}.kpis b{display:block;font-size:29px;margin-bottom:4px}.kpis div:first-child{border-top:3px solid #e78332}.kpis div:nth-child(2){border-top:3px solid #009fe3}.kpis div:last-child{border-top:3px solid #15926d}.versions{border-top:1px solid #dde6ed;padding-top:14px;margin-top:16px}.file-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.file-row>a:not(.btn){font-size:12px;color:#255775}.message-layout{display:grid;grid-template-columns:.8fr 1.2fr;gap:22px}summary{cursor:pointer;font-weight:bold;line-height:1.5}table{width:100%;border-collapse:collapse;font-size:14px}td,th{text-align:left;padding:10px;border-bottom:1px solid #dde6ed;vertical-align:top}.info{border-left:3px solid #00a1df;padding-left:12px}@media(max-width:850px){main,.message-layout{grid-template-columns:1fr}.wide{grid-column:auto}}\n\n@media screen{body,:host{background:#f5fafd;color:#163c55}header{background:linear-gradient(115deg,#f0faff,#fff);color:#07588f;border-top:4px solid #009ee0;border-bottom:1px solid #d5e6ee;border-radius:0 0 28px 0;padding:24px}main{padding:20px;gap:18px}.card{border-radius:18px;border-color:#d5e6ee;box-shadow:0 4px 18px #06477805}button,a.btn{background:#007cba;color:#fff;border-radius:11px;min-height:44px}button.secondary,a.secondary{background:#eaf6fc;color:#07588f}input,select,textarea{border-radius:10px;border-color:#bfd7e4;max-width:100%;min-width:0}.kpis div{background:#f0f9fd;border-radius:12px}.kpis b{color:#07588f}#preview{background:#f0f9fd;border-radius:0 14px 14px 0}#status{background:#eaf8ff;color:#07588f}main>*{min-width:0}@media(max-width:850px){main,.message-layout{grid-template-columns:1fr}}@media(max-width:480px){header,main,.card{padding:16px}.kpis{grid-template-columns:1fr}.kpis div{display:flex;align-items:center;gap:12px}.kpis b{margin:0}h1{font-size:23px}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}}\n</style><header><h1>Comunicação do dia</h1>Consórcio Performance Tamanduateí · Atendimento e Execução</header><div id=\"status\" role=\"status\" aria-live=\"polite\">Buscando a última versão pronta…</div><main>\n<section class=\"card\"><h2>1. Baixar o acompanhamento</h2><div class=\"kpis\"><div><b id=\"execution\">—</b>com Execução</div><div><b id=\"care\">—</b>com Atendimento</div><div><b id=\"done\">—</b>encerradas no período</div></div><p id=\"updated\" class=\"stamp\"></p><div id=\"files\"></div><p><button class=\"secondary\" id=\"generate\">Preparar versão atualizada</button><button class=\"secondary\" id=\"refresh\">Consultar situação</button></p><small>Você pode baixar a versão pronta durante a atualização. Uma nova versão substitui a atual somente após Excel e PDF estarem completos.</small><details class=\"versions\"><summary>Backup da versão anterior</summary><p id=\"backupDate\" class=\"stamp\"></p><div id=\"backup\"></div><small>Mantemos duas versões completas. Arquivos de acompanhamento mais antigos são movidos à lixeira automaticamente.</small></details><details class=\"versions\"><summary>Caderno completo de fichas</summary><p id=\"bookDate\" class=\"stamp\"></p><div id=\"bookFiles\"></div><button class=\"secondary\" id=\"book\">Preparar caderno completo</button><p><small>Preparação separada do acompanhamento. Confira a data antes de enviar.</small></p></details></section>\n<section class=\"card\"><h2>Avisos automáticos</h2><p id=\"active\"></p><p>Ficha nova ou encaminhamento à Execução entra na fila de e-mail, com acompanhamento e fichas de comunicação.</p><small id=\"recipients\"></small><p><button id=\"enable\">Ativar avisos</button><button class=\"secondary\" id=\"pause\">Pausar avisos</button></p><p class=\"info\"><small>Atualização do acompanhamento a cada 15 minutos quando há mudanças, ou por solicitação. A rotina existente prepara os arquivos em segundo plano.</small></p><p id=\"error\" role=\"alert\"></p><p id=\"warning\"></p></section>\n<section class=\"card wide\"><h2>2. Preparar a mensagem e enviar</h2><div class=\"message-layout\"><div><label>Saudação<select id=\"greeting\"><option>Bom dia, equipe!</option><option>Boa tarde, equipe!</option><option>Boa noite, equipe!</option><option value=\"\">Sem saudação</option><option value=\"custom\">Personalizar…</option></select></label><input id=\"custom\" placeholder=\"Sua saudação\" hidden maxlength=\"200\"><label>Texto de abertura<textarea id=\"intro\" placeholder=\"Segue o acompanhamento das demandas.\"></textarea></label><button class=\"secondary\" id=\"save\">Salvar meu texto</button><p><small>Os números são os da versão pronta para baixar. O período vira ao meio-dia. A semana começa na segunda-feira.</small></p></div><div><div id=\"preview\"></div><button id=\"copy\">Copiar mensagem</button><button id=\"whatsapp\">Abrir WhatsApp</button><p><small>Escolha o contato ou grupo e anexe o PDF ou Excel baixado acima. O envio é feito por você.</small></p></div></div></section>\n<section class=\"card wide\"><details><summary>Consultar os últimos avisos por e-mail</summary><button class=\"secondary\" id=\"eventsLoad\">Carregar avisos</button><div style=\"overflow:auto\"><table><thead><tr><th>Protocolo</th><th>Motivo</th><th>Situação</th><th>Atualizado</th></tr></thead><tbody id=\"events\"></tbody></table></div><small>ENVIADO indica aceite do serviço de e-mail. CONFERIR_ENVIO requer conferir o envio antes de tentar novamente.</small></details></section>\n</main>").replace(/</g,'\\u003c'));
}

const PAINEL_FILA='Solicitações do Painel';
const PAINEL_CAMPOS=[
 ['Nome do solicitante','nome'],['Telefone','telefone'],['E-mail','email'],['Endereço','endereco'],
 ['Data de abertura','dataAbertura'],['Horário do atendimento','horario'],['Local do atendimento','localAtendimento'],
 ['Responsável pelo atendimento','responsavel'],['Texto da solicitação','solicitacao'],['Assunto principal','assunto'],
 ['Providências iniciais',''],['Providências executadas','solucao'],['Conclusão ou devolutiva final','finalizacao'],
 ['Fotos da abertura','fotosAbertura'],['Fotos da execução','fotosSolucao'],['Data de conclusão','dataConclusao'],
 ['Data da execução',''],['Responsável pela execução',''],['Responsável atual',''],
 ['Procedência','procedencia',['Em análise','Procedente','Possivelmente não procedente','Não procedente']],
 ['Status do atendimento','status',['Recebida','Em andamento','Aguardando finalização']],
 ['Grau de urgência','urgencia',['Baixo','Médio','Alto','Urgente','Não informada']],
 ['Frente de obra','frente'],['Tipo de manifestação','tipo',['Danos à calçada','Ligações de Esgoto','Danos e limpeza da via','Danos à edificação','Danos a veículos','Transtornos causados pela obra','Informação','Elogio','Outros','Reclamação','Solicitação']],
 ['Canal de recebimento','canalRecebimento',['Atendimento itinerante','Central de atendimento ao cliente','Operacional do consórcio','Comunicado Sabesp','Mídia']],
 ['Descrição detalhada da ocorrência','descricaoReclamacao']
];
function painelAbrirAtendimento(){painelAbrir_('carteira');}
function painelAbrirDemandas(){painelAbrir_('demandas');}
function painelAbrirCorrecao(){painelAbrir_('ficha');}
function painelAbrirPacote(){painelAbrir_('pacote');}
function painelAbrirAtualizacao(){painelAbrir_('atualizar');}

function painelInstalarAutomacao_(){
 const ss=hec_central_(),aba=ss.getSheetByName(PAINEL_FILA);
 if(!aba||aba.getRange('L1').getValue()!=='CENTRAL 4.6')throw new Error('Primeiro instale a Central 4.6 nos Procedimentos de Campo. Depois execute este instalador novamente.');
 ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='painelProcessarFila';}).forEach(function(t){ScriptApp.deleteTrigger(t);});
 ScriptApp.newTrigger('painelProcessarFila').timeBased().everyMinutes(1).create();
 PropertiesService.getScriptProperties().setProperty('PAINEL_INSTALADOR',Session.getEffectiveUser().getEmail());
 const comunicacao=painelPrepararComunicacao_();
 if(!comunicacao.ok)console.warn(comunicacao.mensagem);
}
function painelOrganizarAbas_(){
 const ss=SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID);
 const visiveis=['Indicadores','Dashboard','Fichas Oficiais','Demandas do Atendimento'];
 visiveis.forEach(function(n){const s=ss.getSheetByName(n);if(s)s.showSheet();});
 ['Encerramento pelo Atendimento','Correções da Ficha Final de Atendimento','Cadastrar encerrado','Encerrados cadastrados','Base Encerrados Manuais',PAINEL_FILA].forEach(function(n){const s=ss.getSheetByName(n);if(s)s.hideSheet();});
 // Dashboard keeps the protection maintained by the Procedures project.
 ['Indicadores','Fichas Oficiais','Demandas do Atendimento','Correções da Ficha Final de Atendimento','Encerramento pelo Atendimento','Base Fichas Oficiais','Base Encerrados Manuais','Histórico'].forEach(function(n){
  const s=ss.getSheetByName(n);if(!s)return;
  const desc='Consulta pelo painel 3.0';let p=s.getProtections(SpreadsheetApp.ProtectionType.SHEET).find(function(p){return p.getDescription()===desc||p.getDescription()==='Consulta pelo painel 2.8';});
  if(!p)p=s.protect();p.setDescription(desc);
  // Só o check e a observação são liberados às pessoas com edição na planilha.
  p.setUnprotectedRanges(n==='Demandas do Atendimento' ? [s.getRange(5,13,s.getMaxRows()-4,1),s.getRange(5,15,s.getMaxRows()-4,1)] : []);
  p.setWarningOnly(false);const user=Session.getEffectiveUser();p.addEditor(user);
  const email=user.getEmail();const outros=p.getEditors().filter(function(u){return u.getEmail()!==email;});if(outros.length)p.removeEditors(outros);if(p.canDomainEdit())p.setDomainEdit(false);
 });
 const d=ss.getSheetByName('Demandas do Atendimento');if(d)d.getRange('A2:P2').breakApart().merge().setValue('CHECKLIST: escreva o acompanhamento na coluna O e marque ✓ Tarefa realizada na coluna M. Para encerrar a ficha: menu ATENDIMENTO > Encerrar atendimento.');
}
function painelRegistrarPedido_(tipo,dados,id){
 const ss=hec_central_(),aba=ss.getSheetByName(PAINEL_FILA);
 if(!aba||!PropertiesService.getScriptProperties().getProperty('PAINEL_INSTALADOR'))throw new Error('A instalação do Painel de Trabalho 3.0 ainda não foi concluída.');
 if(['ENCERRAR','HISTORICO','CORRIGIR','CORRIGIR_LOTE','DEMANDA','PDF','PACOTE','ATUALIZAR','COMUNICAR','CHECKLIST_CRIAR','CHECKLIST_ALTERAR'].indexOf(tipo)<0)throw new Error('Ação indisponível.');
 const texto=JSON.stringify(dados||{});if(texto.length>40000)throw new Error('Texto muito extenso. Reduza o conteúdo antes de salvar.');
 id=id||Utilities.getUuid();if(!/^[a-f0-9-]{36}$/i.test(id))throw new Error('Identificador inválido. Reabra a janela.');
 if(!aba.getRange(Math.min(aba.getMaxRows(),Math.max(2,aba.getLastRow()+1)),1,1,11).canEdit())throw Error('Seu pedido não foi gravado: a fila está protegida para esta conta. Abra Ajuda e acessos e peça ao administrador para liberar a fila de solicitações. Não é necessário desproteger o Histórico.');
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const linhas=aba.getDataRange().getValues();const anterior=linhas.find(function(r){return r[0]===id;});
  if(anterior){if(anterior[1]!==tipo||anterior[2]!==texto)throw new Error('Este pedido já foi enviado com outro conteúdo. Recarregue o caso.');return {pedido:id};}
  const row=aba.getLastRow()+1;fo_garantirDimensoes_(aba,row,12);
  aba.getRange(row,1,1,11).setValues([[id,tipo,texto,'RECEBIDA',new Date(),Session.getActiveUser().getEmail()||'Usuário com edição na planilha','','',new Date(),0,'']]);
  PropertiesService.getUserProperties().setProperty('PAINEL_ULTIMO_PEDIDO',id);
  return {pedido:id};
 }finally{lock.releaseLock();}
}
function painelConsultarPedido(id){
 const aba=hec_central_().getSheetByName(PAINEL_FILA);if(!aba)return null;
 const r=aba.getDataRange().getValues().find(function(r){return r[0]===id;});if(!r)return null;
 return {id:r[0],tipo:r[1],estado:r[3],resultado:r[6]?JSON.parse(r[6]):{},mensagem:r[7]||'',etapa:r[10]||''};
}
function painelUltimaSolicitacao(){
 const aba=hec_central_().getSheetByName(PAINEL_FILA);if(!aba)return null;
 const ultimo=PropertiesService.getUserProperties().getProperty('PAINEL_ULTIMO_PEDIDO');
 if(ultimo){const pedido=painelConsultarPedido(ultimo);if(pedido)return {id:pedido.id,tipo:pedido.tipo,estado:pedido.estado};}
 const user=Session.getActiveUser().getEmail();if(!user)return null;
 const r=aba.getDataRange().getValues().slice(1).reverse().find(function(r){return r[5]===user;});return r?{id:r[0],tipo:r[1],estado:r[3]}:null;
}
function painelEncerrar(p){painelValidarEncerramento_(p,painelRegistro_(p.protocolo));return painelRegistrarPedido_('ENCERRAR',p,p.acaoId);}
function painelSalvarHistorico(p){hec_validarEntrada_(p.dados,new Date());return painelRegistrarPedido_('HISTORICO',p,p.pedidoId);}
function painelGerarFicha(p){return painelRegistrarPedido_('PDF',{protocolo:p});}
function painelAtualizarDados(){return painelRegistrarPedido_('ATUALIZAR',{});}
function painelRegistro_(id){const r=fo_lerRegistrosBaseOficial_(hec_central_()).find(function(r){return r.protocolo===id;});if(!r)throw new Error('Protocolo não localizado. Atualize os dados.');return r;}
function painelDadosCorrecao(id){
 const r=painelRegistro_(id),valores={};
 PAINEL_CAMPOS.forEach(function(c){valores[c[0]]=c[1]?r[c[1]]||'':'';if(c[0].indexOf('Data')===0)valores[c[0]]=fo_formatarData_(valores[c[0]]);if(valores[c[0]] instanceof Date)valores[c[0]]=fo_formatarData_(valores[c[0]]);});
 valores['Horário do atendimento']=fo_formatarHora_(r.horario);
 const ss=hec_central_(),hist=ss.getSheetByName(FO_CONFIG.ABA_HISTORICO_CENTRAL);
 const eventos=hist?(fo_lerHistorico_(hist)[r.idLegado||id]||[]):[];
 const ordenados=eventos.slice().sort(function(a,b){return new Date(b.data)-new Date(a.data);});
 const ultimo=ordenados[0]||{};valores['Responsável atual']=ultimo.responsavel||'';
 const executado=ordenados.find(function(e){return e.executadoPor;})||{};valores['Responsável pela execução']=executado.executadoPor||'';
 const dataExec=ordenados.find(function(e){return e.dataExecucao&&fo_normalizar_(e.origem)!=='encerramento pelo atendimento';})||{};valores['Data da execução']=fo_formatarData_(dataExec.dataExecucao);
 const base=ss.getSheetByName(FO_CONFIG.ABA_BASE_CENTRAL),caso=base?fo_lerBaseCentral_(base).find(function(c){return c.idLegado===(r.idLegado||id);}):null;valores['Providências iniciais']=caso?caso.tratativa||'':'';
 return {valores:valores,assinatura:painelAssinatura_(hec_central_(),id),id:id,historico:/^HIST/.test(r.chave)};
}
function painelValidarCorrecao_(p){
 const config=PAINEL_CAMPOS.find(function(c){return c[0]===p.campo;});if(!config)throw new Error('Selecione um campo da lista.');
 if(!fo_texto_(p.motivo)||!fo_texto_(p.valor))throw new Error('Informe o novo valor e o motivo da correção.');
 if(/^\s*=/.test(p.valor)||/^\s*=/.test(p.motivo))throw new Error('Preencha texto, sem fórmulas.');
 if(config[2]&&config[2].indexOf(p.valor)<0)throw new Error('Selecione um dos valores indicados.');
 if(/^Data /.test(p.campo)){
  const d=hec_dataObrigatoria_(p.valor,p.campo),r=painelRegistro_(p.protocolo);
  if(d>new Date())throw new Error('A data não pode ser futura.');
  if(p.campo==='Data de conclusão'&&d<fo_data_(r.dataAbertura))throw new Error('A conclusão não pode ser anterior à abertura.');
  if(p.campo==='Data de abertura'&&r.dataConclusao&&d>fo_data_(r.dataConclusao))throw new Error('A abertura não pode ser posterior à conclusão.');
 }
}
function painelSalvarCorrecao(p){painelValidarCorrecao_(p);return painelRegistrarPedido_('CORRIGIR',p,p.pedidoId);}
function painelAplicarCorrecao_(p,id){
 painelValidarCorrecao_(p);const ss=hec_central_(),r=painelRegistro_(p.protocolo);
 if(/^HIST/.test(r.chave))throw new Error('Para corrigir esse caso, selecione-o em Cadastro de histórico.');
 const aba=ss.getSheetByName('Correções da Ficha Final de Atendimento');if(!aba)throw new Error('Base de correções não encontrada. Reinstale a Central 4.6 nos Procedimentos de Campo.');
 const dados=aba.getDataRange().getValues(),marca='[Painel '+id+']';
 if(dados.some(function(r){return String(r[6]).indexOf(marca)>=0;}))return {mensagem:'Correção registrada para aplicação.'};
 if(p.assinatura!==painelAssinatura_(ss,p.protocolo))throw new Error('O atendimento recebeu uma atualização. Carregue a ficha novamente antes de corrigir.');
 const linha=Math.max(6,aba.getLastRow()+1);fo_garantirDimensoes_(aba,linha,16);
 const valor=/^Data /.test(p.campo)?hec_dataObrigatoria_(p.valor,p.campo):p.valor;
 aba.getRange(linha,1,1,16).setValues([[r.idLegado||r.protocolo,r.dataAbertura,r.nome,p.campo,p.anterior||'',valor,marca+' '+p.motivo,true,'Aguardando aplicação','','','','','','','']]);
 return {mensagem:'Correção registrada para aplicação.'};
}
function painelDemandas(id){
 const ss=hec_central_(),s=ss.getSheetByName(FO_CONFIG.ABA_AVISOS_PROTOCOLO);if(!s||s.getLastRow()<5)return [];
 return s.getRange(5,1,s.getLastRow()-4,19).getValues().filter(function(r){return r[0]===id&&r[16]&&r[12]!==true&&r[12]!=='Registrada'&&r[2]!=='Registrar encerramento imediato';}).map(function(r){return {chave:r[16],tipo:r[2],acao:r[9],mensagem:r[10],proxima:r[15],observacao:r[14]||'',whatsapp:fo_urlWhatsApp_(r[6],r[10])||''};});
}
function painelSalvarDemanda(p){if(!fo_texto_(p.relato)||/^\s*=/.test(p.relato))throw new Error('Descreva o acompanhamento realizado, sem fórmulas.');return painelRegistrarPedido_('DEMANDA',p,p.pedidoId);}
function painelAplicarDemanda_(p) {
  const trava = LockService.getScriptLock();
  trava.waitLock(30000);
  try {
    const ss = hec_central_(), aba = ss.getSheetByName(FO_CONFIG.ABA_AVISOS_PROTOCOLO);
    if (!aba) throw new Error('A aba Demandas do Atendimento não foi encontrada. Atualize o painel.');
    const linhas = aba.getDataRange().getValues();
    const i = linhas.findIndex(function(r) { return r[16] === p.chave && r[0] === p.protocolo; });
    if (i < 4) throw new Error('Essa demanda já mudou. Consulte as ações atuais antes de confirmar.');
    const r = linhas[i], linha = i + 1;
    const evento = fo_eventoDemandaRegistrado_(ss, p.chave);
    // Preserva também as confirmações da versão anterior, que já possuem data.
    const data = fo_data_(r[13]) || (evento && evento.data);
    if (evento || data || r[12] === 'Registrada') {
      aba.getRange(linha, 13).setValue(true);
      if (data) aba.getRange(linha, 14).setValue(data).setNumberFormat('dd/MM/yyyy HH:mm');
      fo_formatarLinhaDemandaAtendimento_(aba, linha, {realizada: true, prioridade: r[1], prazo: r[3]});
      return {registradaAgora: false, mensagem: p.desmarcar
        ? 'A tarefa já foi registrada. Desmarcar não apaga o histórico nem reabre a ficha.'
        : 'Esta ação já estava registrada.'};
    }
    if (p.desmarcar) {
      aba.getRange(linha, 13).setValue(false);
      return {registradaAgora: false, mensagem: ''};
    }
    const tipo = fo_texto_(r[2]), relato = fo_texto_(p.relato);
    let erro = '';
    if (tipo === 'Registrar encerramento imediato') erro = 'Use ATENDIMENTO > Encerrar atendimento para registrar a solução e a devolutiva.';
    else if (/^\s*=/.test(relato) || aba.getRange(linha, 15).getFormula()) erro = 'Digite um texto na Observação do Atendimento, sem fórmula.';
    else if (!relato && ['Avisar protocolo', 'Aplicar pesquisa de satisfação', 'Registrar tentativa sem resposta', 'Confirmar ciência do encerramento automático'].indexOf(tipo) < 0) {
      erro = 'Escreva o que foi feito na coluna O (Observação do Atendimento) e marque o check novamente.';
    }
    if (erro) {
      aba.getRange(linha, 13).setValue(false);
      throw new Error(erro);
    }
    // A data só é preenchida depois da gravação no Histórico.
    aba.getRange(linha, 15).setValue(relato);
    let resultado;
    try {
      resultado = fo_registrarTarefaAtendimentoNoHistorico_(aba, linha, p.chave, p.autor);
    } catch (erroRegistro) {
      const salvo = fo_eventoDemandaRegistrado_(ss, p.chave);
      if (salvo) resultado = {data: salvo.data, existia: false};
      else {
        aba.getRange(linha, 13).setValue(false);
        throw erroRegistro;
      }
    }
    if (!resultado || !resultado.data) return {registradaAgora: false, mensagem: 'Já havia uma tentativa registrada hoje. Ela não foi duplicada.'};
    aba.getRange(linha, 13, 1, 2).setValues([[true, resultado.data]]);
    aba.getRange(linha, 14).setNumberFormat('dd/MM/yyyy HH:mm');
    fo_formatarLinhaDemandaAtendimento_(aba, linha, {realizada: true, prioridade: r[1], prazo: r[3]});
    return {registradaAgora: !resultado.existia, mensagem: 'Acompanhamento registrado. Os painéis estão sendo atualizados.'};
  } finally {
    trava.releaseLock();
  }
}

/** Executed only by the installer-owned time trigger. UI users never write protected views. */
function painelProcessarFilaCore_(){
 const trava=LockService.getUserLock();if(!trava.tryLock(1000))return;
 try{
  const ss=SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID),aba=ss.getSheetByName(PAINEL_FILA);if(!aba||aba.getLastRow()<2)return;
  const estados=aba.getRange(2,4,aba.getLastRow()-1,1).getValues();
  const indice=estados.findIndex(function(r){return r[0]&&['CONCLUÍDA','ERRO','AGUARDANDO CENTRAL'].indexOf(r[0])<0;});if(indice<0)return;
  const linha=indice+2,r=aba.getRange(linha,1,1,11).getValues()[0];
  if(r[3]==='AGUARDANDO CENTRAL'||(r[3]==='PROCESSANDO'&&new Date()-new Date(r[8])<=360000))return;
  const p=JSON.parse(r[2]),anterior=r[3];p.autor=r[5]||'Atendimento';
  aba.getRange(linha,4).setValue('PROCESSANDO');aba.getRange(linha,9).setValue(new Date());
  let resultado=r[6]?JSON.parse(r[6]):{};
  try{
   if(anterior==='CENTRAL ATUALIZADA'||r[10]==='FINALIZAR'){
    aba.getRange(linha,11).setValue('FINALIZAR');
    sincronizarBaseFichasOficiais();
    PropertiesService.getScriptProperties().setProperty('AD_PEDIDO',new Date().toISOString());
    if(!['COMUNICAR','CHECKLIST_CRIAR','CHECKLIST_ALTERAR','ATUALIZAR'].includes(r[1])&&PropertiesService.getScriptProperties().getProperty(FO_CONFIG.PROPRIEDADE_CONTROLE_ATIVO)==='SIM')atualizarControleManifestacoesPelaCentral(true);
    resultado.mensagem='Dados da ficha atualizados. A comunicação está disponível para consulta.';
    aba.getRange(linha,7).setValue(JSON.stringify(resultado));aba.getRange(linha,4).setValue('CONCLUÍDA');return;
   }
   if(r[1]==='PACOTE'){
    resultado=painelExecutarPacote_(p,resultado,r[0],function(j){aba.getRange(linha,7).setValue(JSON.stringify(j));});
    aba.getRange(linha,7).setValue(JSON.stringify(resultado));aba.getRange(linha,4).setValue(resultado.concluido?'CONCLUÍDA':'PACOTE EM GERAÇÃO');return;
   }
   if(r[1]==='COMUNICAR')resultado=painelSalvarComunicacaoExecutar_(p);
   else if(r[1]==='CHECKLIST_CRIAR')resultado=painelCriarChecklistExecutar_(p);
   else if(r[1]==='CHECKLIST_ALTERAR')resultado=painelAlterarChecklistExecutar_(p);
   else if(r[1]==='ENCERRAR')resultado=painelEncerrarExecutar_(p);
   else if(r[1]==='HISTORICO')resultado=painelSalvarHistoricoExecutar_(p);
   else if(r[1]==='CORRIGIR')resultado=painelAplicarCorrecao_(p,r[0]);
   else if(r[1]==='CORRIGIR_LOTE')resultado=painelAplicarCorrecaoLote_(p,r[0]);
   else if(r[1]==='DEMANDA')resultado=painelAplicarDemanda_(p);
   else if(r[1]==='PDF')resultado=painelGerarFichaExecutar_(p.protocolo);
   else if(r[1]==='ATUALIZAR')resultado={mensagem:'Atualização solicitada.'};
   else throw new Error('Ação desconhecida.');
   aba.getRange(linha,7).setValue(JSON.stringify(resultado||{}));
   if(['PDF','HISTORICO'].indexOf(r[1])>=0){if(r[1]==='HISTORICO')atualizarControleManifestacoesPelaCentral(false);aba.getRange(linha,4).setValue('CONCLUÍDA');}
   else aba.getRange(linha,4).setValue('AGUARDANDO CENTRAL');
  }catch(e){aba.getRange(linha,4).setValue('ERRO');aba.getRange(linha,8).setValue(e.message);}
  finally{aba.getRange(linha,9).setValue(new Date());}
 }finally{trava.releaseLock();}
}

function painelMes_(texto){
 if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(texto||''))throw new Error('Escolha o mês e o ano do pacote.');
 const p=texto.split('-');return new Date(Number(p[0]),Number(p[1])-1,1);
}
function painelPreviaPacote(mes){
 const data=painelMes_(mes),registros=fo_lerRegistrosBaseOficial_(hec_central_()).filter(function(r){return fo_pertenceAoPacoteMensal_(r,data);});
 const fichas=registros.map(function(r){return {id:r.protocolo,nome:r.nome,status:r.status};});
 return {mes:mes,total:fichas.length,abertas:fichas.filter(function(r){return r.status!=='Concluída';}).length,concluidas:fichas.filter(function(r){return r.status==='Concluída';}).length,fichas:fichas,assinatura:fo_hash_(JSON.stringify(registros.map(function(r){return [r.protocolo,fo_hashOficialRegistro_(r)];})))};
}
function painelSolicitarPacote(p){const previa=painelPreviaPacote(p.mes);if(!previa.total)throw new Error('Não há fichas para o mês escolhido.');if(previa.assinatura!==p.assinatura)throw new Error('As fichas mudaram. Confira a lista novamente.');return painelRegistrarPedido_('PACOTE',p,p.pedidoId);}
function painelExecutarPacote_(p,job,id,persistir){
 const mes=painelMes_(p.mes);
 if(!job.pasta){
  sincronizarBaseFichasOficiais();const atual=painelPreviaPacote(p.mes);if(atual.assinatura!==p.assinatura)throw new Error('Os dados mudaram após a conferência. Confira o mês e a lista novamente.');
  const raiz=fo_subpasta_('Pacotes Mensais'),ano=fo_obterOuCriarSubpasta_(raiz,String(mes.getFullYear())),pastaMes=fo_obterOuCriarSubpasta_(ano,fo_nomeMesPasta_(mes));
  const nome='Pacote '+p.mes+' '+id.slice(0,8);let it=pastaMes.getFoldersByName(nome);const pasta=it.hasNext()?it.next():pastaMes.createFolder(nome);
  job={assinatura:p.assinatura,mes:p.mes,pasta:pasta.getId(),protocolos:atual.fichas.map(function(r){return r.id;}),indice:0,pdfs:[],concluido:false};persistir(job);
  SpreadsheetApp.openById(FO_CONFIG.CENTRAL_ID).getSheetByName(FO_CONFIG.ABA_INDICE).getRange('B3').setValue(mes);
 }
 if(painelPreviaPacote(p.mes).assinatura!==job.assinatura)throw new Error('As fichas mudaram durante a geração. Confira a lista e gere um novo pacote. A pasta parcial foi preservada.');
 const pasta=DriveApp.getFolderById(job.pasta);const limite=Math.min(job.protocolos.length,job.indice+3);
 for(;job.indice<limite;){
  const protocolo=job.protocolos[job.indice],gerado=gerarFichaOficialPorProtocolo_(protocolo,false),nome=protocolo+'_Ficha_Atendimento.pdf';
  const antes=pasta.getFilesByName(nome);let copia=antes.hasNext()?antes.next():DriveApp.getFileById(gerado.pdfId).makeCopy(nome,pasta);
  job.pdfs.push(copia.getId());job.indice++;persistir(job);
 }
 job.mensagem=job.indice+' de '+job.protocolos.length+' fichas preparadas para '+job.mes+'.';job.pastaUrl=pasta.getUrl();
 if(job.indice===job.protocolos.length){
  if(painelPreviaPacote(p.mes).assinatura!==job.assinatura)throw new Error('Os dados mudaram. Confira a lista e gere um novo pacote.');
  const nome='Fichas_'+job.mes+'.zip',existente=pasta.getFilesByName(nome);let zip;
  if(existente.hasNext())zip=existente.next();else zip=pasta.createFile(Utilities.zip(job.pdfs.map(function(id){return DriveApp.getFileById(id).getBlob();}),nome));
  job.zip=zip.getUrl();job.concluido=true;job.mensagem='Pacote '+job.mes+' concluído com '+job.pdfs.length+' fichas. Confira antes de enviar.';
 }
 return job;
}

function painelTentarNovamente(id){
 const ss=hec_central_(),a=ss.getSheetByName(PAINEL_FILA),rows=a.getDataRange().getValues(),i=rows.findIndex(function(r){return r[0]===id;});
 if(i<1||rows[i][3]!=='ERRO'||['PDF','PACOTE','ATUALIZAR'].indexOf(rows[i][1])<0)throw new Error('Confira a mensagem e abra a ação correspondente para corrigir os dados.');
 const lock=LockService.getScriptLock();lock.waitLock(30000);try{a.getRange(i+1,4).setValue(rows[i][1]==='PACOTE'?'PACOTE EM GERAÇÃO':'RECEBIDA');a.getRange(i+1,8).clearContent();a.getRange(i+1,10).setValue(Number(rows[i][9]||0)+1);}finally{lock.releaseLock();}return {pedido:id};
}

/** Mantém o gatilho existente e isola a comunicação das tarefas da carteira. */
function painelProcessarFila(){
  const dono=PropertiesService.getScriptProperties().getProperty('PAINEL_INSTALADOR');if(!dono||Session.getEffectiveUser().getEmail()!==dono)return;
  PropertiesService.getScriptProperties().setProperty('PAINEL_ULTIMA_ROTINA',new Date().toISOString());
  const inicio=Date.now();try{painelProcessarFilaCore_();}finally{if(Date.now()-inicio<90000&&typeof ad_rotina_==='function')try{ad_rotina_();}catch(e){console.error('Comunicação: '+e.message);}}
}

function painelSalvarComunicacao(p){painelRegistro_(p.protocolo);p.destino=af_destino_(p.destino);painelValidarTextoCompartilhado_(p.mensagem,'a mensagem',true);painelValidarTextoCompartilhado_(p.destino,'a área de destino',true);painelValidarTextoCompartilhado_(p.arquivos,'os links',false);p.autor=Session.getActiveUser().getEmail()||'Atendente identificada na fila';return painelRegistrarPedido_('COMUNICAR',p,p.pedidoId);}

function painelCriarChecklist(p){painelRegistro_(p.protocolo);p.destino=af_destino_(p.destino);painelValidarTextoCompartilhado_(p.titulo,'o item de acompanhamento',true);painelValidarTextoCompartilhado_(p.destino,'a área responsável',true);if(p.prazo)hec_dataObrigatoria_(p.prazo,'Prazo');p.autor=Session.getActiveUser().getEmail()||'Atendente identificada na fila';return painelRegistrarPedido_('CHECKLIST_CRIAR',p,p.pedidoId);}

function painelAlterarChecklist(p){painelRegistro_(p.protocolo);if(!p.chaveItem||!['Pendente','Concluído'].includes(p.situacao))throw Error('Confira o item e a situação.');p.autor=Session.getActiveUser().getEmail()||'Atendente identificada na fila';return painelRegistrarPedido_('CHECKLIST_ALTERAR',p,p.pedidoId);}

/** Verifica a conta que está usando a janela. Não altera compartilhamentos. */
function painelVerificarAcessos(){
 const checks=[],r={conta:Session.getActiveUser().getEmail()||'Conta não informada pelo Google',autorizacao:'',verificacoes:checks};
 try{const info=ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);if(info.getAuthorizationStatus()===ScriptApp.AuthorizationStatus.REQUIRED)r.autorizacao=info.getAuthorizationUrl();}catch(e){checks.push({item:'Autorização do aplicativo',ok:false,acao:'Use ATENDIMENTO → Autorizar meu acesso e conceda as permissões solicitadas.',detalhe:e.message});}
 const p=PropertiesService.getScriptProperties();r.instalador=p.getProperty('PAINEL_INSTALADOR')||'';r.ultimaRotina=p.getProperty('PAINEL_ULTIMA_ROTINA')||'';
 [[FO_CONFIG.CENTRAL_ID,'Controle de Atendimentos'],[PAINEL_ATENDIMENTO_V3.EXECUCAO_ID,'Comunicação com a Execução']].forEach(par=>{try{const ss=SpreadsheetApp.openById(par[0]);ss.getName();checks.push({item:par[1],ok:true,acao:'Leitura disponível.',url:ss.getUrl()});if(par[0]===FO_CONFIG.CENTRAL_ID){const sh=ss.getSheetByName(PAINEL_FILA);const ok=!!sh&&sh.getRange(Math.min(sh.getMaxRows(),Math.max(2,sh.getLastRow()+1)),1,1,11).canEdit();checks.push({item:'Registrar pedidos pela janela',ok,acao:ok?'Fila de solicitações disponível. Bases continuam protegidas.':'O administrador precisa liberar esta conta na proteção da aba Solicitações do Painel.',url:ss.getUrl()});}}catch(e){checks.push({item:par[1],ok:false,acao:/Required permissions|permission to call|authorization/i.test(e.message)?'Autorize o aplicativo com sua própria conta. Se o escopo continuar ausente, o administrador deve revisar o manifesto.':'Peça acesso à planilha usando exatamente a conta exibida acima.',detalhe:e.message,url:'https://docs.google.com/spreadsheets/d/'+par[0]+'/edit'});}});
 const pasta=p.getProperty('AD_CONTROLE_PASTA');if(pasta)try{DriveApp.getFolderById(pasta).getName();checks.push({item:'Pasta dos acompanhamentos',ok:true,acao:'Pasta acessível. Arquivos com restrição individual ainda podem exigir liberação.',url:'https://drive.google.com/drive/folders/'+pasta});}catch(e){checks.push({item:'Pasta dos acompanhamentos',ok:false,acao:'O administrador deve compartilhar esta pasta como leitor com a equipe.',url:'https://drive.google.com/drive/folders/'+pasta,detalhe:e.message});}
 r.administrador=Session.getEffectiveUser().getEmail()===r.instalador;
 if(r.administrador){
 [[FO_CONFIG.CENTRAL_ID,FO_CONFIG.ABA_HISTORICO_CENTRAL],[PAINEL_ATENDIMENTO_V3.EXECUCAO_ID,PAINEL_ATENDIMENTO_V3.ABA_COMUNICACAO]].forEach(par=>{try{const ss=SpreadsheetApp.openById(par[0]),sh=ss.getSheetByName(par[1]),ok=!!sh&&sh.getRange(Math.min(sh.getMaxRows(),Math.max(2,sh.getLastRow()+1)),1).canEdit();checks.push({item:'Automação grava em '+par[1],ok,acao:ok?'Conta responsável liberada.':'O proprietário deve permitir que a conta da automação edite esta aba protegida.',url:ss.getUrl()});}catch(e){checks.push({item:'Automação grava em '+par[1],ok:false,acao:'Confira acesso da conta responsável à planilha e à proteção.',detalhe:e.message});}});
 r.gatilho=ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='painelProcessarFila');checks.push({item:'Automação do Atendimento',ok:r.gatilho,acao:r.gatilho?'Gatilho encontrado na conta responsável.':'Execute repararAutomacaoPainelAtendimento nesta conta.'});}
 else checks.push({item:'Automação do Atendimento',ok:!!r.ultimaRotina,acao:r.ultimaRotina?'Última passagem pela rotina: '+painelFormatarDataHora_(new Date(r.ultimaRotina)):'Ainda sem confirmação da rotina atualizada. Peça ao administrador para verificar o gatilho.'});
 return r;
}
function autorizarMeuAcessoAtendimento(){ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);const r=painelVerificarAcessos();console.log(JSON.stringify(r,null,2));try{painelAbrir_('acessos');}catch(e){console.log('Autorização consultada. Reabra a planilha e use o painel.');}return r;}
function repararAutomacaoPainelAtendimento(){
 const owner=PropertiesService.getScriptProperties().getProperty('PAINEL_INSTALADOR'),user=Session.getEffectiveUser().getEmail();if(!owner||user!==owner)throw Error('Execute com a conta da automação: '+(owner||'instalação pendente'));
 const ts=ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='painelProcessarFila');if(!ts.length)ScriptApp.newTrigger('painelProcessarFila').timeBased().everyMinutes(1).create();else ts.slice(1).forEach(t=>ScriptApp.deleteTrigger(t));
 return {mensagem:'Automação conferida. Um gatilho painelProcessarFila mantido nesta conta.'};
}
function painelLiberarFilaEquipe(p){
 const owner=PropertiesService.getScriptProperties().getProperty('PAINEL_INSTALADOR');if(!owner||Session.getEffectiveUser().getEmail()!==owner)throw Error('Somente a conta responsável pela automação pode aplicar esta liberação.');
 const emails=String(p&&p.emails||'').split(/[;,\s]+/).filter(Boolean).map(s=>s.toLowerCase());if(!emails.length||emails.some(e=>!/^\S+@\S+\.\S+$/.test(e)))throw Error('Informe os e-mails das atendentes que já são editoras do Controle.');
 const ss=hec_central_(),editores=ss.getEditors().map(u=>u.getEmail().toLowerCase());const dono=ss.getOwner();if(dono)editores.push(dono.getEmail().toLowerCase());if(emails.some(e=>!editores.includes(e)))throw Error('Primeiro confirme esses e-mails como editores diretos no botão Compartilhar do Controle. A lista automática não expande grupos.');
 const sh=ss.getSheetByName(PAINEL_FILA);if(!sh)throw Error('A fila não existe; confira a instalação da Central.');const protecoes=sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).concat(sh.getProtections(SpreadsheetApp.ProtectionType.RANGE));
 if(protecoes.some(p=>!p.canEdit()))throw Error('Há uma proteção que esta conta não pode alterar. O proprietário deve liberar a fila.');
 protecoes.forEach(p=>p.addEditors(emails));return {mensagem:protecoes.length?'Equipe liberada nas proteções da fila. Nenhuma base foi desprotegida.':'A fila não possui proteções. Confira a autorização do aplicativo na conta da colaboradora.'};
}

/** Conferência única e somente leitura das projeções. Execute no Controle. */
function conferirConsistenciaAtendimento(){
 const ss=hec_central_(),f=ad_lerFontes_(),snap=ad_snapshot_(f),exec=SpreadsheetApp.openById(AD_CONFIG.EXECUCAO_ID);
 const ids=b=>b.filter(ad_aberto_).map(r=>String(r.Protocolo)).sort();const principal=ids(f.bases);
 const diagnostico={consultadoEm:new Date().toISOString(),abertas:principal.length,aguardandoFinalizacao:snap.revisar.length,execucao:snap.execucao.length,atendimentoOutras:snap.atendimento.length,outras:snap.outras.length,mesclagens:af_vinculos_().map(v=>({incorporado:v.origem,principal:af_resolver_(v.principal)})),projecoes:[]};
 [['Dashboard do Controle',ss.getSheetByName('Dashboard'),6,'Status'],['Base Executiva',exec.getSheetByName('Base Executiva'),1,'Status']].forEach(x=>{
  if(!x[1]){diagnostico.projecoes.push({nome:x[0],erro:'Aba não encontrada'});return;}
  const rows=x[1].getDataRange().getValues(),header=rows[x[2]-1]||[],ip=header.indexOf('Protocolo'),st=header.indexOf(x[3]);if(ip<0||st<0){diagnostico.projecoes.push({nome:x[0],erro:'Cabeçalho ausente ou atualização em andamento'});return;}
  const atuais=rows.slice(x[2]).filter(r=>r[ip]&&af_aberto_(r[st])).map(r=>String(r[ip])).sort();
  diagnostico.projecoes.push({nome:x[0],abertas:atuais.length,sobrando:atuais.filter(id=>!principal.includes(id)),faltando:principal.filter(id=>!atuais.includes(id)),duplicados:atuais.filter((id,i)=>atuais.indexOf(id)!==i)});
 });
 [ss,exec].forEach(w=>{const sh=w.getSheetByName('Acompanhamento diário');diagnostico.projecoes.push({nome:'Acompanhamento · '+w.getName(),periodo:sh?sh.getRange('A2').getDisplayValue():'Ausente',consulta:sh?sh.getRange('A3').getDisplayValue():'Ausente',resumo:sh?sh.getRange('A6').getDisplayValue():'Ausente'});});
 console.log(JSON.stringify(diagnostico,null,2));return diagnostico;
}
