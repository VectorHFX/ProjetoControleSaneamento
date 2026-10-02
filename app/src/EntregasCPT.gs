class EntregasCPT {
  constructor(ctx){this.ctx=ctx;}
  fonte(id){
    if(!this.ctx.perfil.papeis.some(p=>['administrador','administrativo','gestao','socioambiental','comunicacao'].includes(p)))throw new Error('Preparação de relatos disponível ao Administrativo, Gestão, Socioambiental e Comunicação.');
    const fonte=new DadosDaAplicacao(this.ctx.base,this.ctx.perfil).detalhe(id);
    if(!/relato de atividade/.test(DadosDaAplicacao.norm(fonte.registro.procedimento)))throw new Error('Esta ferramenta prepara relatos de atividade.');
    const hash=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(fonte)).map(b=>(b&255).toString(16).padStart(2,'0')).join('');
    return {fonte,hash};
  }
  tabela(criar){
    if(!this.ctx.config.agendaId)throw new Error('Agenda compartilhada não configurada.');
    const ss=SpreadsheetApp.openById(this.ctx.config.agendaId);let a=ss.getSheetByName('Entregas');
    const h=['Registro ID','Versão','Operação ID','Alterado em','Alterado por','Conteúdo JSON'];
    if(!a&&criar){a=ss.insertSheet('Entregas');a.getRange(1,1,1,6).setValues([h]);a.setFrozenRows(1);}
    if(a&&a.getRange(1,1,1,6).getValues()[0].some((x,i)=>x!==h[i]))throw new Error('Cabeçalho de Entregas incompatível. Nenhum dado foi substituído.');return a;
  }
  revisoes(a,id){if(!a||a.getLastRow()<2)return [];return a.getRange(2,1,a.getLastRow()-1,6).getValues().filter(r=>String(r[0])===id).map(r=>({op:String(r[2]),autor:String(r[4]),conteudo:JSON.parse(r[5])}));}
  publico(e){if(!e)return null;const {assinatura,...p}=e;return p;}
  carregar(id){const {fonte,hash}=this.fonte(id),rows=this.revisoes(this.tabela(false),id),atual=rows.length?rows[rows.length-1].conteudo:null;return {fonte,hash,entrega:this.publico(atual),fonteAlterada:!!atual&&atual.fonteHash!==hash,historico:rows.slice(-20).reverse().map(r=>({versao:r.conteudo.versao,autor:r.autor,data:r.conteudo.alteradoEm,situacao:r.conteudo.situacao}))};}
  salvar(p){
    if(PerfisCPT.somenteLeitura(this.ctx.perfil))throw new Error('A Gestão acompanha os relatos; a preparação é feita pelo Administrativo, Socioambiental ou Comunicação.');
    if(!p||typeof p.id!=='string'||!/^OP-[a-zA-Z0-9-]{12,70}$/.test(p.operacaoId||''))throw new Error('Identificação de salvamento inválida.');
    const {fonte,hash}=this.fonte(p.id),a=this.tabela(false),rows=this.revisoes(a,p.id),atual=rows.length?rows[rows.length-1].conteudo:null;
    const assinatura=JSON.stringify([p.id,p.versao,p.fonteHash,p.titulo,p.texto,p.fotos,p.situacao]);const repetida=rows.find(r=>r.op===p.operacaoId);
    if(repetida){if(repetida.autor!==this.ctx.email||repetida.conteudo.assinatura!==assinatura)throw new Error('Operação já usada. Reabra o relato para conferir o último salvamento.');return {entrega:this.publico(repetida.conteudo),resultado:'Revisão já salva.'};}
    if(Number(p.versao)!==(atual?atual.versao:0))throw new Error('Outra pessoa salvou este relato. Copie seu texto antes de reabrir e conciliar as alterações.');
    if(p.fonteHash!==hash)throw new Error('O registro original mudou. Copie seu texto e reabra o relato para conferir a fonte antes de salvar.');
    const titulo=CronogramaCPT.texto(p.titulo,180,true),texto=CronogramaCPT.texto(p.texto,12000,true);
    if(!['rascunho','pronto'].includes(p.situacao))throw new Error('Escolha Rascunho ou Pronto para entrega.');
    if(!Array.isArray(p.fotos)||p.fotos.length>2||new Set(p.fotos.map(f=>f.id)).size!==p.fotos.length)throw new Error('Selecione no máximo duas fotos diferentes.');
    const anexos=new Set(fonte.anexos.map(x=>x.id));const fotos=p.fotos.map(f=>{if(!anexos.has(f.id))throw new Error('A foto não pertence a este registro.');return {id:f.id,legenda:CronogramaCPT.texto(f.legenda||'',300)};});
    const e={id:p.id,versao:(atual?atual.versao:0)+1,fonteHash:hash,titulo,texto,fotos,situacao:p.situacao,alteradoEm:new Date().toISOString(),alteradoPor:this.ctx.email,registro:fonte.registro,assinatura};
    const json=JSON.stringify(e);if(json.length>45000)throw new Error('A revisão excede o tamanho permitido. Reduza o texto.');const target=a||this.tabela(true);target.getRange(target.getLastRow()+1,1,1,6).setValues([[p.id,e.versao,p.operacaoId,e.alteradoEm,this.ctx.email,json]]);
    return {entrega:this.publico(e),resultado:'Revisão '+e.versao+' salva. Resposta original preservada.'};
  }
}
function carregarEntregaRelatoCPT(id){return DesempenhoCPT.medir('entregas.abrir',()=>new EntregasCPT(AplicacaoCPT.contexto()).carregar(id));}
function salvarEntregaRelatoCPT(p){const lock=LockService.getScriptLock();if(!lock.tryLock(15000))throw new Error('Há outro salvamento em andamento. Tente novamente.');try{return DesempenhoCPT.medir('entregas.salvar',()=>new EntregasCPT(AplicacaoCPT.contexto()).salvar(p));}finally{lock.releaseLock();}}
