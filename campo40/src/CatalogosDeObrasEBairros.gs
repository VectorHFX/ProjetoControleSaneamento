/**
 * CatalogosDeObrasEBairros — v4.0.6 (nome de uso na lista; base 4.0.5)
 * PERMANENTE: cadastro, listas do formulário, controles de salvar e revisões.
 * A:S = referência PAC16 preservada. T:Z = dados atuais. AJ:AK = nome de uso e apelidos (gravados pela Aplicação CPT).
 * A lista do formulário mostra o nome de uso (ou o oficial) e sempre o [ID], que é o que liga o envio à obra. Nenhuma resposta é lida.
 */
class CatalogosDeObrasEBairros {
  static normalizar(v) {return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');}
  static get situacoes() {return ['Em andamento','Paralisada','Finalizada','A confirmar'];}
  static disponivel(v) {return ['Em andamento','Paralisada'].includes(v);}
  static get colunasAtuais() {return ['Situação atual','Início da obra','Início da comunicação','Público','Impacto','Observação atual','Atualizado em'];}
  static controle(nome) {return nome==='Obras'?{coluna:28,celula:'AB3'}:{coluna:8,celula:'H3'};}
  static lerLinhas(aba,colunas) {const n=aba.getLastRow()-1;return n>0?aba.getRange(2,1,n,colunas).getValues():[];}
  static ler(base) {
    const o=base.getSheetByName('Obras'),b=base.getSheetByName('Bairros');
    if(!o||!b)throw new Error('As abas Obras e Bairros são obrigatórias.');
    const largura=typeof o.getMaxColumns==='function'?Math.min(37,o.getMaxColumns()):19;
    return this.validarLinhas(this.lerLinhas(o,largura),this.lerLinhas(b,6));
  }
  static validarLinhas(oo,bb) {
    const ids=new Set(),nomes=new Set(),normalizar=this.normalizar;
    function idValido(id,padrao) {
      if(!padrao.test(id))throw new Error('ID inválido: '+id+'. Use OBR-0001 ou BAI-001, sem reaproveitar IDs.');
      if(ids.has(id))throw new Error('ID duplicado: '+id);ids.add(id);
    }
    // Só as colunas do cadastro contam: AB:AD (controle) e AF:AI (aplicação) têm textos que não são obras.
    const preenchida=r=>r.slice(0,26).concat(r.slice(35,37)).some(v=>v!==''&&v!==false&&v!==null&&v!==undefined);
    const bairros=bb.filter(preenchida).map(r=>{
      const id=String(r[0]||'').trim(),nome=String(r[1]||'').trim();idValido(id,/^BAI-\d{3,}$/);
      if(!nome||nomes.has(normalizar(nome)))throw new Error('Bairro vazio ou repetido: '+nome);
      nomes.add(normalizar(nome));return {id:id,nome:nome,mostrar:r[2]===true,tipo:String(r[4]||'')};
    });
    const mapa=new Map(bairros.map(x=>[normalizar(x.nome),x]));
    const obras=oo.filter(preenchida).map(r=>{
      const id=String(r[0]||'').trim(),nome=String(r[1]||'').trim();idValido(id,/^OBR-\d{4,}$/);
      if(!nome)throw new Error('Nome da obra vazio: '+id);
      const vinculados=String(r[2]||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{
        const bairro=mapa.get(normalizar(x));
        if(!bairro||bairro.tipo==='Opção especial')throw new Error(id+': bairro não cadastrado ou opção especial: '+x);
        return bairro;
      });
      const lat=r[9],lng=r[10];
      if((lat==='')!==(lng===''))throw new Error(id+': preencha latitude e longitude juntas.');
      if(lat!==''&&(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng))||Math.abs(Number(lat))>90||Math.abs(Number(lng))>180))throw new Error(id+': coordenadas inválidas.');
      const situacao=String(r[19]||'').trim();
      if(situacao&&!CatalogosDeObrasEBairros.situacoes.includes(situacao))throw new Error(id+': situação atual inválida. Use a lista da coluna T.');
      const data=v=>v instanceof Date?v.toISOString():String(v||'');
      return {id:id,nome:nome,bairros:vinculados.map(x=>x.nome),bairroIds:vinculados.map(x=>x.id),selecionada:r[3]===true,
        mostrar:r[3]===true&&(!situacao||CatalogosDeObrasEBairros.disponivel(situacao)),situacao:situacao,eap:String(r[4]||''),
        latitude:lat===''?null:Number(lat),longitude:lng===''?null:Number(lng),geojson:r[11]||null,pontoReferencia:String(r[12]||''),
        nomeUso:String(r[35]||'').trim(),apelidos:String(r[36]||'').split(';').map(x=>x.trim()).filter(Boolean),
        inicioObra:data(r[20]),inicioComunicacao:data(r[21]),publico:String(r[22]||''),impacto:String(r[23]||''),observacao:String(r[24]||'')};
    });
    return {obras:obras,bairros:bairros};
  }
  /** Rótulo da obra na lista do formulário: nome de uso (ou oficial) — bairros [ID]. */
  static rotulo(x) {return (x.nomeUso||x.nome)+(x.bairros.length?' — '+x.bairros.join(' / '):'')+' ['+x.id+']';}
  static sincronizar(base,form,estado,dados) {
    dados=dados||this.ler(base);
    if(estado.catalogosAtuais&&dados.obras.some(x=>x.selecionada&&!x.situacao))throw new Error('Uma obra marcada está sem situação atual. Preencha a coluna T e salve novamente.');
    const obras=dados.obras.filter(x=>x.mostrar).sort((a,b)=>(a.nomeUso||a.nome).localeCompare(b.nomeUso||b.nome,'pt-BR')),bairros=dados.bairros.filter(x=>x.mostrar);
    if(!bairros.length)throw new Error('Selecione pelo menos um bairro no cadastro.');
    const valores=obras.map(x=>CatalogosDeObrasEBairros.rotulo(x));
    valores.push(ConfiguracaoDaBase.valores.SEM_OBRA,ConfiguracaoDaBase.valores.OBRA_A_CADASTRAR);
    const obra=form.getItemById(Number(estado.obraItemId));
    // Após a primeira publicação, consulta o bairro pelo ID em vez de percorrer 150 perguntas.
    let bairro=estado.bairroItemId?form.getItemById(Number(estado.bairroItemId)):null;
    if(!bairro||bairro.getTitle().trim()!=='Bairro de realização do procedimento')
      bairro=form.getItems().find(x=>x.getTitle().trim()==='Bairro de realização do procedimento');
    if(!obra||String(obra.getType())!=='LIST')throw new Error('Pergunta de obra ausente ou com tipo incompatível.');
    if(!bairro||String(bairro.getType())!=='LIST')throw new Error('Pergunta de bairro ausente ou com tipo incompatível.');
    estado.bairroItemId=bairro.getId();
    const perguntas=[obra.asListItem(),bairro.asListItem()];
    if(perguntas.some(q=>q.getChoices().some(c=>c.getPageNavigationType())))throw new Error('Uma lista tem direcionamentos próprios. Nenhum direcionamento será substituído.');
    const antigas=perguntas.map(q=>q.getChoices().map(c=>c.getValue())),novas=[valores,bairros.map(x=>x.nome)],mudaram=[];
    try {perguntas.forEach((q,i)=>{if(JSON.stringify(antigas[i])!==JSON.stringify(novas[i])){q.setChoiceValues(novas[i]);mudaram.push(i);}});}
    catch(erro) {
      // Forms não tem transações; tenta restaurar as listas se ocorrer falha parcial.
      const falhas=[];mudaram.forEach(i=>{try{perguntas[i].setChoiceValues(antigas[i]);}catch(e){falhas.push(e);}});
      if(falhas.length)throw new Error('Atualização incompleta e restauração indisponível. Salve novamente para conferir as listas. '+String(erro.message||erro));
      throw erro;
    }
    return {atualizadoEm:new Date().toISOString(),obras:obras,bairros:bairros,cadastro:dados,listasAlteradas:mudaram.length};
  }
  static autor(evento) {
    try {const u=evento?evento.user:Session.getActiveUser();return u&&u.getEmail()?u.getEmail():'Não disponibilizado pelo Google';}
    catch(e){return 'Não disponibilizado pelo Google';}
  }
  static diferencas(anterior,atual) {
    const registros=[];
    ['obras','bairros'].forEach(tipo=>{
      const antes=new Map((anterior&&anterior[tipo]||[]).map(x=>[x.id,x])),depois=new Map(atual[tipo].map(x=>[x.id,x]));
      new Set([...antes.keys(),...depois.keys()]).forEach(id=>{
        const a=antes.get(id)||null,b=depois.get(id)||null;if(JSON.stringify(a)!==JSON.stringify(b))registros.push({tipo:tipo,id:id,antes:a,depois:b});
      });
    });return registros;
  }
  static registrarRevisao(pasta,e,r,anterior,autor,origem) {
    const diaBrasil=Utilities.formatDate(new Date(r.atualizadoEm),'America/Sao_Paulo','yyyy-MM-dd');
    const mes=diaBrasil.slice(0,7),nome='Revisoes_Catalogos_'+mes+'.jsonl';
    const registro={id:Utilities.getUuid(),em:r.atualizadoEm,diaBrasil:diaBrasil,autor:autor,origem:origem,
      obrasDisponiveis:r.obras.map(x=>x.id),bairrosDisponiveis:r.bairros.map(x=>x.id),alteracoes:this.diferencas(anterior&&anterior.cadastro,r.cadastro)};
    let arquivo=null;
    if(e.revisoesMes===mes&&e.revisoesId)arquivo=DriveApp.getFileById(e.revisoesId);
    else {const encontrados=pasta.getFilesByName(nome);if(encontrados.hasNext())arquivo=encontrados.next();}
    const linha=JSON.stringify(registro)+'\n';
    if(arquivo)arquivo.setContent(arquivo.getBlob().getDataAsString('UTF-8')+linha);
    else arquivo=pasta.createFile(nome,linha,MimeType.PLAIN_TEXT);
    e.revisoesMes=mes;e.revisoesId=arquivo.getId();e.ultimaRevisao=registro.em;return registro;
  }
  static publicar(base,form,e,autor,origem,dados) {
    const pasta=DriveApp.getFolderById(e.pastaId);
    const anterior=e.catalogosId?JSON.parse(DriveApp.getFileById(e.catalogosId).getBlob().getDataAsString('UTF-8')):null;
    const r=this.sincronizar(base,form,e,dados);
    this.registrarRevisao(pasta,e,r,anterior,autor,origem);
    e.catalogosId=ConfiguracaoDaBase.gravarJson(pasta,e.catalogosId,'Catalogos_Campo40.json',r);ConfiguracaoDaBase.salvarEstado(e);
    console.log(JSON.stringify({resultado:'Salvo e sincronizado; revisão registrada.',obras:r.obras.length,bairros:r.bairros.length,listasAlteradas:r.listasAlteradas,revisoesId:e.revisoesId}));return r;
  }
  static aviso(base,texto,erro) {
    // Projeto independente/gatilho: não existe contexto garantido de interface.
    // Feedback permanece nas células e no log; um aviso nunca invalida o salvamento.
    console.log(JSON.stringify({tipo:erro?'AVISO_ERRO':'AVISO',mensagem:texto}));
    ['Obras','Bairros'].forEach(nome=>{
      try {
        const aba=base.getSheetByName(nome),c=this.controle(nome);
        if(aba&&aba.getMaxColumns()>=c.coluna+2&&String(aba.getRange(1,c.coluna).getValue())==='ATUALIZAR FORMULÁRIO')
          aba.getRange(5,c.coluna,2,3).setValues([[texto,'',''],[Utilities.formatDate(new Date(),'America/Sao_Paulo','dd/MM/yyyy HH:mm:ss'),'','']])
            .setBackground(erro?'#fff0ed':'#edf8f3').setFontColor(erro?'#9c251b':'#175747').setWrap(true);
      }catch(falha){
        console.warn('Aviso na aba '+nome+' indisponível; consulte o Registro de execução: '+String(falha.message||falha));
      }
    });
  }
  static atualizar(evento,origem) {
    return ConfiguracaoDaBase.comTrava(function(){
      const e=ConfiguracaoDaBase.exigirInstalacao(),base=SpreadsheetApp.openById(e.baseId),form=FormApp.openById(e.formId);
      try {
        CatalogosDeObrasEBairros.aviso(base,'Salvando e atualizando as duas listas…',false);SpreadsheetApp.flush();
        const r=CatalogosDeObrasEBairros.publicar(base,form,e,CatalogosDeObrasEBairros.autor(evento),origem||'Atualização manual');
        CatalogosDeObrasEBairros.aviso(base,'Salvo! '+r.obras.length+' obras + 2 opções especiais; '+r.bairros.length+' bairros/opções. Revisão registrada.',false);return r;
      }catch(erro){CatalogosDeObrasEBairros.aviso(base,'Não foi possível concluir: '+String(erro.message||erro)+'. Corrija e salve novamente.',true);throw erro;}
    });
  }
  static prepararColunas(base) {
    const aba=base.getSheetByName('Obras');
    if(aba.getMaxColumns()<30)aba.insertColumnsAfter(aba.getMaxColumns(),30-aba.getMaxColumns());
    const h=aba.getRange(1,20,1,7).getValues()[0];
    if(h.some((v,i)=>v!==''&&v!==this.colunasAtuais[i]))throw new Error('As colunas T:Z já têm outro conteúdo. Nenhuma coluna será substituída.');
    aba.getRange(1,20,1,7).setValues([this.colunasAtuais]).setBackground('#12678f').setFontColor('#ffffff').setFontWeight('bold').setWrap(true);
    const n=aba.getMaxRows()-1;
    aba.getRange(2,20,n,1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(this.situacoes,true).setAllowInvalid(false).build());
    aba.getRange(2,4,n,1).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
    aba.getRange(2,21,n,2).setNumberFormat('dd/MM/yyyy');aba.getRange(2,26,n,1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    aba.getRange('T1').setNote('Situação atual: somente Em andamento ou Paralisada podem entrar no formulário.');
    aba.getRange('F1').setNote('Retrato do PAC16 de 26/04/2026; não seleciona obras atuais.');aba.setColumnWidth(20,170);
    if(aba.getColumnGroupDepth(5)===0)aba.getRange(1,5,aba.getMaxRows(),2).shiftColumnGroupDepth(1);
    if(aba.getColumnGroupDepth(21)===0)aba.getRange(1,21,aba.getMaxRows(),7).shiftColumnGroupDepth(1);
    aba.collapseAllColumnGroups();
  }
  static instalarControles(base,e) {
    ['Obras','Bairros'].forEach(nome=>{
      const aba=base.getSheetByName(nome),c=this.controle(nome);
      if(aba.getMaxColumns()<c.coluna+2)aba.insertColumnsAfter(aba.getMaxColumns(),c.coluna+2-aba.getMaxColumns());
      const area=aba.getRange(1,c.coluna,7,3).getValues();
      if(area.some(r=>r.some(v=>v!==''&&v!==false))&&area[0][0]!=='ATUALIZAR FORMULÁRIO')throw new Error(nome+': a área do controle já está ocupada.');
      aba.getRange(1,c.coluna,7,3).setValues([
        ['ATUALIZAR FORMULÁRIO','',''],['Edite o cadastro; depois marque abaixo.','',''],[false,'Salvar e atualizar formulário',''],
        ['Atualiza Obras e Bairros juntas.','',''],['Pronto para salvar.','',''],['','',''],['Cada salvamento registra a revisão, mesmo sem mudanças.','','']
      ]).setFontFamily('Arial').setWrap(true).setVerticalAlignment('middle');
      aba.getRange(1,c.coluna,1,3).setBackground('#175747').setFontColor('#ffffff').setFontWeight('bold');
      aba.getRange(3,c.coluna,1,3).setBackground('#dff2e9').setFontColor('#175747').setFontWeight('bold');
      aba.getRange(3,c.coluna).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
      aba.setColumnWidth(c.coluna,190);aba.setColumnWidth(c.coluna+1,220);aba.setColumnWidth(c.coluna+2,25);
      if(nome==='Bairros')aba.getRange(2,3,aba.getMaxRows()-1,1).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
    });
    const existentes=ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='aoEditarCatalogosCampo40'&&t.getTriggerSourceId()===e.baseId);
    if(!existentes.length)ScriptApp.newTrigger('aoEditarCatalogosCampo40').forSpreadsheet(e.baseId).onEdit().create();
    existentes.slice(1).forEach(t=>ScriptApp.deleteTrigger(t));e.controlesCatalogos=true;ConfiguracaoDaBase.salvarEstado(e);
    const inicio=base.getSheetByName('Início');
    if(inicio){
      const instrucoes={'Atualizar listas':'Em Obras ou Bairros, marque Salvar e atualizar formulário. Aguarde a confirmação e o horário.',
        'Obras':'Edite nome, bairros, situação atual (T) e No formulário?. Finalizadas ficam no cadastro, fora das opções.',
        'PAC16':'Colunas técnicas preservam o documento de abril; a situação atual está na coluna T.'};
      inicio.getRange(1,1,inicio.getLastRow(),2).getValues().forEach((r,i)=>{if(instrucoes[r[0]])inicio.getRange(i+1,2).setValue(instrucoes[r[0]]);});
    }
  }
  static editar(evento) {
    if(!evento||!evento.range||!evento.source)return;
    const e=ConfiguracaoDaBase.lerEstado();if(!e.pronto||!e.controlesCatalogos||evento.source.getId()!==e.baseId)return;
    const aba=evento.range.getSheet(),nome=aba.getName();if(!['Obras','Bairros'].includes(nome))return;
    const c=this.controle(nome);
    if(evento.range.getA1Notation()===c.celula&&String(evento.value).toUpperCase()==='TRUE') {
      try{this.atualizar(evento,'Salvar na aba '+nome);}
      catch(erro){this.aviso(evento.source,'Falha ao salvar: '+String(erro.message||erro),true);console.error(String(erro));}
      finally{aba.getRange(c.celula).setValue(false);}
    }else if(evento.range.getRow()>1&&evento.range.getColumn()<=(nome==='Obras'?26:6))
      aba.getRange(5,c.coluna).setValue('Alterações pendentes. Marque Salvar e atualizar formulário.').setBackground('#fff5d9');
  }
  static instalar() {
    return ConfiguracaoDaBase.comTrava(function(){
      const e=ConfiguracaoDaBase.exigirInstalacao(),base=SpreadsheetApp.openById(e.baseId);
      CatalogosDeObrasEBairros.prepararColunas(base);CatalogosDeObrasEBairros.instalarControles(base,e);
      console.log('Controles instalados; um gatilho de edição e nenhum periódico.');
    });
  }
}
/** Salva as listas e a revisão; alternativa ao controle na planilha. */
function atualizarCatalogosCampo40(){return CatalogosDeObrasEBairros.atualizar();}
/** Reinstala somente os controles, sem reaplicar a tabela do relatório. */
function instalarControlesDosCatalogosCampo40(){return CatalogosDeObrasEBairros.instalar();}
/** Acionado pela planilha; não executar manualmente. */
function aoEditarCatalogosCampo40(evento){return CatalogosDeObrasEBairros.editar(evento);}
