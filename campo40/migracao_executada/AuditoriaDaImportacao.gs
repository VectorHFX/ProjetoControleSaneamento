/**
 * AuditoriaDaImportacao — v1.0.0
 * CONFERÊNCIA: descobre a base atual do formulário 3.0 e verifica cobertura do consolidado.
 * Não importa, não apaga e não altera células, perguntas ou gatilhos.
 * Usa ConfiguracaoDaBase do projeto Campo 4.0 já instalado.
 * Guarda somente a análise estrutural na pasta existente, sem dados pessoais.
 */
class AuditoriaDaImportacao {
  static normalizar(v) {return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');}
  static get formularioOrigemId() {return '14HqAvwLBiM0JFB549ZR-PBCE_7j-zOZL-gD5JQ2OKRM';}
  static lerTabela(aba) {
    if(!aba)throw new Error('Tabela necessária não encontrada.');
    const n=aba.getLastRow(),m=aba.getLastColumn();if(!n||!m)throw new Error('Tabela vazia: '+aba.getName());
    const valores=aba.getRange(1,1,n,m).getValues(),cabecalhos=valores[0].map(v=>String(v||'').trim());
    const linhas=valores.slice(1).filter(r=>r.some(v=>v!==''&&v!==null));
    return {aba:aba.getName(),id:aba.getSheetId(),cabecalhos:cabecalhos,linhas:linhas};
  }
  static conferir(respostas,consolidada) {
    const normalizar=this.normalizar,pendencias=[];
    const localizar=(t,nome)=>t.cabecalhos.findIndex(x=>normalizar(x)===normalizar(nome));
    const obrigatorias=['Carimbo de data/hora','Selecione o procedimento a ser executado','Data de realização do procedimento','Bairro de realização do procedimento','Colaborador responsável pelo registro'];
    [respostas,consolidada].forEach(t=>{
      obrigatorias.forEach(c=>{if(localizar(t,c)<0)pendencias.push(t.aba+': cabeçalho ausente: '+c);});
      const vistos=new Set();t.cabecalhos.forEach(c=>{if(!c)return;const chave=normalizar(c);if(vistos.has(chave))pendencias.push(t.aba+': cabeçalho repetido: '+c);vistos.add(chave);});
    });
    const colunaOrigem=localizar(consolidada,'Origem do registro'),colunaId=localizar(consolidada,'ID de migração');
    if(colunaOrigem<0||colunaId<0)pendencias.push('Consolidado sem origem ou ID de migração; é necessário conferir o mapeamento histórico.');
    const origens={},tipos={},ids=new Set();
    const carimbo=t=>localizar(t,'Carimbo de data/hora');
    const tipo=t=>localizar(t,'Selecione o procedimento a ser executado');
    // Cobertura por carimbo + tipo. Não elimina registros: multiconjunto preserva repetições.
    const chave=(t,r)=>{const v=r[carimbo(t)];return JSON.stringify([v instanceof Date?v.toISOString():String(v||''),String(r[tipo(t)]||'')]);};
    const cobertura=new Map();
    consolidada.linhas.forEach(r=>{
      const origem=colunaOrigem>=0?String(r[colunaOrigem]||'').trim():'Sem origem';origens[origem]=(origens[origem]||0)+1;
      const nome=String(r[tipo(consolidada)]||'').trim();tipos[nome]=(tipos[nome]||0)+1;
      if(colunaId>=0){const id=String(r[colunaId]||'').trim(),composta=JSON.stringify([origem,id]);if(!id)pendencias.push('Registro consolidado sem ID de migração.');else if(ids.has(composta))pendencias.push('ID de migração repetido na mesma origem.');else ids.add(composta);}
      if(normalizar(origem)==='procedimentos de campo 3.0'){const k=chave(consolidada,r);cobertura.set(k,(cobertura.get(k)||0)+1);}
    });
    let faltam=0;
    respostas.linhas.forEach(r=>{const k=chave(respostas,r),n=cobertura.get(k)||0;if(n)cobertura.set(k,n-1);else faltam++;});
    const excedentes=[...cobertura.values()].reduce((a,b)=>a+b,0);
    if(faltam)pendencias.push(faltam+' respostas atuais não foram localizadas no consolidado por carimbo e tipo.');
    if(excedentes)pendencias.push(excedentes+' registros identificados como 3.0 no consolidado não coincidem com as respostas atuais.');
    return {respostasAtuais:respostas.linhas.length,consolidados:consolidada.linhas.length,origens:origens,procedimentos:tipos,
      respostasForaDoConsolidado:faltam,consolidados30SemCorrespondencia:excedentes,
      conferenciasPendentes:[...new Set(pendencias)],
      observacao:'Cobertura por carimbo e tipo é conferência preliminar. A importação precisa comparar os campos e os IDs antes de deduplicar.'};
  }
  static analisar() {
    return ConfiguracaoDaBase.comTrava(function(){
      const inicio=Date.now(),e=ConfiguracaoDaBase.exigirInstalacao();
      const form=FormApp.openById(AuditoriaDaImportacao.formularioOrigemId);
      const origemId=ConfiguracaoDaBase.lerDestinoRespostas(form);
      if(!origemId)throw new Error('O formulário 3.0 está sem destino. Informe o link da base antiga atual para configurar a origem.');
      if(origemId===e.baseId)throw new Error('Origem e destino são a mesma base. Nenhuma importação ou alteração foi feita.');
      const base=SpreadsheetApp.openById(origemId);
      // Vínculo de formulário é a identidade; o nome da aba pode variar.
      const identificada=ConfiguracaoDaBase.localizarAbaRespostas(base,form).aba;
      const respostas=AuditoriaDaImportacao.lerTabela(identificada);
      const consolidada=AuditoriaDaImportacao.lerTabela(base.getSheetByName('Base Consolidada'));
      const resultado=AuditoriaDaImportacao.conferir(respostas,consolidada);
      const dados={etapa:'CONFERÊNCIA ANTES DA IMPORTAÇÃO',geradoEm:new Date().toISOString(),
        origem:'https://docs.google.com/spreadsheets/d/'+origemId+'/edit',
        destino:'https://docs.google.com/spreadsheets/d/'+e.baseId+'/edit',
        tabelas:[{nome:respostas.aba,id:respostas.id,colunas:respostas.cabecalhos.length,cabecalhos:respostas.cabecalhos},
          {nome:consolidada.aba,id:consolidada.id,colunas:consolidada.cabecalhos.length,cabecalhos:consolidada.cabecalhos}],
        ...resultado,tempoMs:Date.now()-inicio,
        atendimento:'Fichas e estados finais devem vir do Controle de Atendimentos completo; a visão Atendimentos do Procedimentos é resumida.',
        importacaoExecutada:false};
      const pasta=DriveApp.getFolderById(e.pastaId);
      e.auditoriaImportacaoId=ConfiguracaoDaBase.gravarJson(pasta,e.auditoriaImportacaoId,'Conferencia_Importacao_Campo40.json',dados);
      e.origemImportacaoId=origemId;ConfiguracaoDaBase.salvarEstado(e);
      const log={...dados,tabelas:dados.tabelas.map(t=>({nome:t.nome,id:t.id,colunas:t.colunas})),
        conferencia:'https://drive.google.com/file/d/'+e.auditoriaImportacaoId+'/view'};
      console.log(JSON.stringify(log,null,2));return log;
    });
  }
}
/** Execute no mesmo projeto Campo 4.0. Lê a origem atual; não importa registros. */
function analisarImportacaoCampo40(){return AuditoriaDaImportacao.analisar();}
