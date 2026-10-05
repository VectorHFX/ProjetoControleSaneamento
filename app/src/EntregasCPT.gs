/**
 * EntregasCPT 2.16.0. (2.16: diagnóstico só vira Pronto com aprovação da Gestão ou do Administrativo.)
 * Antes: 2.6.0. Preparo de relatos de atividade e de diagnósticos para o relatório, com versões.
 * A resposta original do formulário nunca é alterada: cada revisão é uma linha nova na aba Entregas.
 * - Relato: título, texto revisado, destino no relatório (item 3, 4.1–4.5, 7 ou 9), quadro do anexo (atividade, local,
 *   endereço, data e horário, mediação, público, objetivo) e até 8 imagens com legenda (fotos e listas de presença).
 * - Diagnóstico: síntese da Gestão, próximos passos, os 24 campos da ficha oficial e até 12 fotos.
 */
class EntregasCPT {
  static get limites() { return {relato: 8, diagnostico: 12}; }
  static get quadro() { return [['atividade', 'Atividade', 500], ['local', 'Local', 500], ['endereco', 'Endereço e bairro', 500], ['dataHorario', 'Data e horário', 200], ['mediacao', 'Mediação', 500], ['publico', 'Público', 500], ['objetivo', 'Objetivo', 3000]]; }
  static get situacoes() { return {relato: ['rascunho', 'pronto'], diagnostico: ['rascunho', 'revisao', 'pronto']}; }
  constructor(ctx){this.ctx=ctx;}
  fonte(id){
    if(!this.ctx.perfil.papeis.some(p=>SocioambientalCPT.papeis.includes(p)))throw new Error('Preparação de relatos disponível ao Administrativo, Gestão, Socioambiental e Comunicação.');
    const fonte=new DadosDaAplicacao(this.ctx.base,this.ctx.perfil).detalhe(id),proc=DadosDaAplicacao.norm(fonte.registro.procedimento);
    const tipo=/relato de atividade/.test(proc)?'relato':/diagnost/.test(proc)?'diagnostico':'';
    if(!tipo)throw new Error('Esta ferramenta prepara relatos de atividade e diagnósticos de área.');
    const hash=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(fonte)).map(b=>(b&255).toString(16).padStart(2,'0')).join('');
    return {fonte,hash,tipo};
  }
  tabela(criar){
    if(!this.ctx.config.agendaId)throw new Error('Agenda compartilhada não configurada.');
    const ss=planilhaCPT_(this.ctx.config.agendaId);let a=ss.getSheetByName('Entregas');
    const h=['Registro ID','Versão','Operação ID','Alterado em','Alterado por','Conteúdo JSON'];
    if(!a&&criar){a=ss.insertSheet('Entregas');a.getRange(1,1,1,6).setValues([h]);a.setFrozenRows(1);}
    if(a&&a.getRange(1,1,1,6).getValues()[0].some((x,i)=>x!==h[i]))throw new Error('Cabeçalho de Entregas incompatível. Nenhum dado foi substituído.');return a;
  }
  revisoes(a,id){if(!a||a.getLastRow()<2)return [];return a.getRange(2,1,a.getLastRow()-1,6).getValues().filter(r=>String(r[0])===id).map(r=>({op:String(r[2]),autor:String(r[4]),conteudo:JSON.parse(r[5])}));}
  publico(e){if(!e)return null;const {assinatura,...p}=e;return p;}
  /** Sugestão inicial: destino no relatório (relato) ou ficha pré-preenchida com as respostas (diagnóstico). */
  sugestao(tipo,fonte){
    const r=fonte.registro;
    if(tipo==='diagnostico')return DiagnosticoOficialCPT.sugestao(fonte);
    const texto=fonte.campos.filter(c=>/complemento|tema|ferramenta|classificacao|objetivo/i.test(DadosDaAplicacao.norm(c.titulo))).map(c=>String(c.valor)).join(' ');
    const c=DiagnosticoOficialCPT.leitor(fonte.campos),br=RelatorioMensalCPT.br(r.data),horas=[c('Horário de entrada na atividade'),c('Horário de saída na atividade')].filter(Boolean).join(' às ');
    const participantes=r.publico!=null?r.publico:c('Total de participantes');
    // Quadro do anexo, como nos relatos enviados à Sabesp (Central 4.x): a equipe revisa antes de gerar.
    const quadro={atividade:[r.atividade,c('Complemento da atividade')].filter(Boolean).join(' · '),local:c('Endereço da frente de serviço','Local da atividade','Endereço completo')||SocioambientalCPT.frente(r.obra),
      endereco:[c('Endereço da atividade'),r.bairro].filter(Boolean).join(' · '),dataHorario:[br,horas].filter(Boolean).join(' · '),mediacao:[r.responsavel,c('Colaboradores de apoio na atividade')].filter(Boolean).join(', '),
      publico:[c('Público-alvo da atividade','Público-alvo'),participantes!==''&&participantes!=null?participantes+' participantes':''].filter(Boolean).join(' · '),objetivo:c('Objetivo da atividade','Objetivo')};
    return {destino:SocioambientalCPT.destino(r.procedimento,r.atividade,texto)||'3',quadro};
  }
  carregar(id){
    const {fonte,hash,tipo}=this.fonte(id),rows=this.revisoes(this.tabela(false),id),atual=rows.length?rows[rows.length-1].conteudo:null;
    return {tipo,fonte,hash,entrega:this.publico(atual),fonteAlterada:!!atual&&atual.fonteHash!==hash,sugestao:this.sugestao(tipo,fonte),
      destinos:SocioambientalCPT.itens.filter(x=>x.tipo!=='diagnostico'&&x.item!=='5').map(x=>({item:x.item,titulo:x.titulo,legenda:x.legenda})),
      campos:tipo==='diagnostico'?DiagnosticoOficialCPT.campos.map(f=>({chave:f[0],rotulo:f[3]})):[],quadro:tipo==='relato'?EntregasCPT.quadro.map(([chave,rotulo])=>({chave,rotulo})):[],arquivos:SocioambientalCPT.arquivos(id),limite:EntregasCPT.limites[tipo],
      historico:rows.slice(-20).reverse().map(r=>({versao:r.conteudo.versao,autor:r.autor,data:r.conteudo.alteradoEm,situacao:r.conteudo.situacao}))};
  }
  salvar(p){
    if(!p||typeof p.id!=='string'||!/^OP-[a-zA-Z0-9-]{12,70}$/.test(p.operacaoId||''))throw new Error('Identificação de salvamento inválida.');
    const {fonte,hash,tipo}=this.fonte(p.id),a=this.tabela(false),rows=this.revisoes(a,p.id),atual=rows.length?rows[rows.length-1].conteudo:null;
    const assinatura=JSON.stringify([p.id,p.versao,p.fonteHash,p.titulo,p.texto,p.fotos,p.situacao,p.destino||'',p.encaminhamentos||'',p.oficiais||null,p.quadro||null]);const repetida=rows.find(r=>r.op===p.operacaoId);
    if(repetida){if(repetida.autor!==this.ctx.email||repetida.conteudo.assinatura!==assinatura)throw new Error('Operação já usada. Reabra o relato para conferir o último salvamento.');return {entrega:this.publico(repetida.conteudo),resultado:'Revisão já salva.'};}
    if(Number(p.versao)!==(atual?atual.versao:0))throw new Error('Outra pessoa salvou este '+(tipo==='relato'?'relato':'diagnóstico')+'. Copie seu texto antes de reabrir e conciliar as alterações.');
    if(p.fonteHash!==hash)throw new Error('O registro original mudou. Copie seu texto e reabra o relato para conferir a fonte antes de salvar.');
    const titulo=CronogramaCPT.texto(p.titulo,180,true),texto=CronogramaCPT.texto(p.texto,tipo==='diagnostico'?20000:12000,true);
    if(!EntregasCPT.situacoes[tipo].includes(p.situacao))throw new Error(tipo==='relato'?'Escolha Rascunho ou Pronto para entrega.':'Escolha Rascunho, Em revisão ou Pronto.');
    // Diagnóstico: quem prepara manda para revisão; aprovar (Pronto) é com a Gestão ou o Administrativo.
    if(tipo==='diagnostico'&&p.situacao==='pronto'&&(!atual||atual.situacao!=='pronto')&&!PerfisCPT.gerencia(this.ctx.perfil))throw new Error('Aprovar o diagnóstico é com a Gestão ou o Administrativo. Marque "Em revisão" para pedir a aprovação.');
    const max=EntregasCPT.limites[tipo];
    if(!Array.isArray(p.fotos)||p.fotos.length>max||new Set(p.fotos.map(f=>f.id)).size!==p.fotos.length)throw new Error('Selecione no máximo '+(max===8?'oito':'doze')+' imagens diferentes.');
    const anexos=new Set(fonte.anexos.map(x=>x.id));const fotos=p.fotos.map(f=>{if(!anexos.has(f.id))throw new Error('A foto não pertence a este registro.');return {id:f.id,legenda:CronogramaCPT.texto(f.legenda||'',300),lista:tipo==='relato'&&f.lista===true};});
    const e={id:p.id,tipo,versao:(atual?atual.versao:0)+1,fonteHash:hash,titulo,texto,fotos,situacao:p.situacao,alteradoEm:new Date().toISOString(),alteradoPor:this.ctx.email,registro:fonte.registro,assinatura};
    if(tipo==='relato'){
      const destino=String(p.destino||this.sugestao(tipo,fonte).destino);
      if(!SocioambientalCPT.item(destino)||['2','5'].includes(destino))throw new Error('Escolha em que item do relatório o relato entra.');
      e.destino=destino;
      const q=p.quadro&&typeof p.quadro==='object'?p.quadro:{};e.quadro={};
      EntregasCPT.quadro.forEach(([k,_,max])=>{e.quadro[k]=CronogramaCPT.texto(q[k]==null?'':String(q[k]),max);});
    }else{
      e.encaminhamentos=CronogramaCPT.texto(p.encaminhamentos||'',5000);
      const o=p.oficiais&&typeof p.oficiais==='object'?p.oficiais:{};e.oficiais={};
      DiagnosticoOficialCPT.chaves().forEach(k=>{e.oficiais[k]=CronogramaCPT.texto(o[k]==null?'':String(o[k]),2000);});
    }
    const json=JSON.stringify(e);if(json.length>45000)throw new Error('A revisão excede o tamanho permitido. Reduza o texto.');const target=a||this.tabela(true);target.getRange(target.getLastRow()+1,1,1,6).setValues([[p.id,e.versao,p.operacaoId,e.alteradoEm,this.ctx.email,json]]);
    try{const pr=PropertiesService.getScriptProperties();pr.setProperty('CPT_ENTREGAS_VERSAO',String(Number(pr.getProperty('CPT_ENTREGAS_VERSAO')||0)+1));}catch(_){}
    return {entrega:this.publico(e),resultado:'Revisão '+e.versao+' salva. Resposta original preservada.'};
  }
}
function carregarEntregaRelatoCPT(id){return DesempenhoCPT.medir('entregas.abrir',()=>new EntregasCPT(AplicacaoCPT.contexto()).carregar(id));}
function salvarEntregaRelatoCPT(p){const lock=LockService.getScriptLock();if(!lock.tryLock(15000))throw new Error('Há outro salvamento em andamento. Tente novamente.');try{return DesempenhoCPT.medir('entregas.salvar',()=>new EntregasCPT(AplicacaoCPT.contexto()).salvar(p));}finally{lock.releaseLock();}}
