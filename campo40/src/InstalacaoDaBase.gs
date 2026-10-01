/**
 * InstalacaoDaBase — v4.0.3
 * SOMENTE INSTALAÇÃO. Cria ou retoma o formulário e a base; formata as quatro abas.
 * Pode ser removido após verificarCampo40() e o teste real de preenchimento/uploads.
 */
class InstalacaoDaBase {
  static instalar() {
    return ConfiguracaoDaBase.comTrava(function () {
      const inicio = Date.now();
      let estado = ConfiguracaoDaBase.lerEstado();
      if (estado.pronto) {
        // Corrige também instalações anteriores concluídas antes de renomear a aba.
        const basePronta = SpreadsheetApp.openById(estado.baseId);
        const formPronto = FormApp.openById(estado.formId);
        ConfiguracaoDaBase.organizarAbaRespostas(basePronta, formPronto, estado);
        estado.versao = ConfiguracaoDaBase.valores.VERSAO;
        ConfiguracaoDaBase.salvarEstado(estado);
        return ConfiguracaoDaBase.mostrarLinks(estado);
      }
      let estruturaOrigem;
      if (!estado.snapshotId) {
        const origem = FormApp.openById(DadosIniciaisDoPAC16.origemFormulario);
        if (origem.isQuiz()) throw new Error('A origem é um teste. Este instalador preserva procedimentos, não configurações de prova.');
        estruturaOrigem = AuditoriaDoFormulario.extrair(origem);
        AuditoriaDoFormulario.validarFinalizacao(estruturaOrigem, AuditoriaDoFormulario.finalizacao(estruturaOrigem));
        if(estruturaOrigem.itens.some(x => x.titulo===ConfiguracaoDaBase.valores.PERGUNTA_OBRA))throw new Error('A origem já tem a pergunta de obra. Este instalador é para a versão 3.0 enviada, sem essa pergunta.');
      }
      if (!estado.pastaId) {
        estado.pastaId = DriveApp.createFolder(ConfiguracaoDaBase.valores.NOME).getId(); ConfiguracaoDaBase.salvarEstado(estado);
      }
      const pasta = DriveApp.getFolderById(estado.pastaId);
      if (!estado.formId) {
        const copia = DadosIniciaisDoPAC16.copiaManualFormulario
          ? DriveApp.getFileById(DadosIniciaisDoPAC16.copiaManualFormulario)
          : DriveApp.getFileById(DadosIniciaisDoPAC16.origemFormulario).makeCopy(ConfiguracaoDaBase.valores.NOME, pasta);
        if (copia.getId() === DadosIniciaisDoPAC16.origemFormulario) throw new Error('A cópia deve ser um formulário novo. Não será editado o formulário 3.0.');
        estado.formId = copia.getId(); ConfiguracaoDaBase.salvarEstado(estado);
      }
      if (estado.formId === DadosIniciaisDoPAC16.origemFormulario) throw new Error('ID de destino inválido: coincide com a origem.');
      const form = FormApp.openById(estado.formId);
      form.setAcceptingResponses(false);
      if (!estado.snapshotId) {
        if (form.getResponses().length) throw new Error('A cópia já contém respostas. Use uma cópia nova e vazia. Nenhuma resposta foi apagada.');
        const copiaEstrutura = AuditoriaDoFormulario.extrair(form);
        InstalacaoDaBase.compararCopia(estruturaOrigem, copiaEstrutura, false);
        const registro={origem:estruturaOrigem,mapa:estruturaOrigem.itens.map((x,i) => ({original:x.id,novo:copiaEstrutura.itens[i].id}))};
        estado.snapshotId = pasta.createFile('Estrutura_original_3_0.json', JSON.stringify(registro, null, 2), MimeType.PLAIN_TEXT).getId();
        ConfiguracaoDaBase.salvarEstado(estado);
        console.log('Cópia conferida: ' + estruturaOrigem.perguntas + ' perguntas; ' + estruturaOrigem.secoes + ' seções.');
      }
      // A referência permanente é a fotografia do momento da cópia, não revisões posteriores do 3.0.
      const registro = JSON.parse(DriveApp.getFileById(estado.snapshotId).getBlob().getDataAsString('UTF-8'));
      const snapshot = registro.origem;
      if (!estado.textosProntos) {
        DadosIniciaisDoPAC16.corrigirFormulario(form);
        form.setTitle(ConfiguracaoDaBase.valores.NOME);
        form.setDescription(DadosIniciaisDoPAC16.corrigirTexto(snapshot.descricao));
        estado.textosProntos = true; ConfiguracaoDaBase.salvarEstado(estado);
      }
      if (!estado.baseId) {
        estado.baseId = SpreadsheetApp.create(ConfiguracaoDaBase.valores.NOME + ' | Base').getId(); ConfiguracaoDaBase.salvarEstado(estado);
        DriveApp.getFileById(estado.baseId).moveTo(pasta);
      }
      const base = SpreadsheetApp.openById(estado.baseId);
      base.setSpreadsheetLocale('pt_BR'); base.setSpreadsheetTimeZone('America/Sao_Paulo');
      if (!estado.cadastrosProntos) {
        InstalacaoDaBase.prepararCadastros(base, form);
        estado.cadastrosProntos = true; ConfiguracaoDaBase.salvarEstado(estado);
      }
      const itens = form.getItems();
      const existente = itens.filter(x => x.getTitle() === ConfiguracaoDaBase.valores.PERGUNTA_OBRA);
      if (existente.length > 1) throw new Error('Há mais de uma pergunta de obra. Corrija a duplicação na cópia.');
      if (!existente.length) {
        const nova = form.addListItem().setTitle(ConfiguracaoDaBase.valores.PERGUNTA_OBRA).setRequired(true)
          .setHelpText('Escolha a obra ou frente desta atividade. Se a atividade não estiver ligada a uma obra específica, use “Não se aplica”. Se a obra não aparecer, identifique-a na observação final.');
        estado.obraItemId = nova.getId(); ConfiguracaoDaBase.salvarEstado(estado);
      } else {
        if (String(existente[0].getType()) !== 'LIST') throw new Error('A pergunta de obra deve ser uma lista suspensa.');
        estado.obraItemId = existente[0].getId(); ConfiguracaoDaBase.salvarEstado(estado);
      }
      // Se uma execução foi interrompida após adicionar a pergunta, ela é reaproveitada.
      const bairro = form.getItems().find(x => x.getTitle().trim() === 'Bairro de realização do procedimento');
      if (!bairro) throw new Error('A pergunta de bairro da finalização não foi encontrada.');
      const obra = form.getItemById(Number(estado.obraItemId)).asListItem();
      obra.setRequired(true);
      // A API exige dois índices inteiros; ListItem não é o Item genérico.
      const de = obra.getIndex(), indiceBairro = bairro.getIndex();
      const para = de < indiceBairro ? indiceBairro : indiceBairro + 1;
      if (de !== para) form.moveItem(de, para);
      CatalogosDeObrasEBairros.sincronizar(base, form, estado);
      if (ConfiguracaoDaBase.lerDestinoRespostas(form) !== estado.baseId) {
        form.setDestination(FormApp.DestinationType.SPREADSHEET, estado.baseId);
      }
      // Reabre a base após setDestination, evitando depender da lista de abas lida antes.
      ConfiguracaoDaBase.organizarAbaRespostas(SpreadsheetApp.openById(estado.baseId), form, estado);
      const audit = InstalacaoDaBase.auditarCriacao(snapshot, form, estado, registro.mapa, DadosIniciaisDoPAC16.corrigirTexto);
      audit.instalacao_ms = Date.now() - inicio;
      estado.auditoriaId = ConfiguracaoDaBase.gravarJson(pasta, estado.auditoriaId, 'Auditoria_Campo40.json', audit);
      ConfiguracaoDaBase.salvarEstado(estado);
      InstalacaoDaBase.escreverInicio(base, form, estado, audit);
      estado.versao = ConfiguracaoDaBase.valores.VERSAO;
      estado.pronto = true; ConfiguracaoDaBase.salvarEstado(estado);
      console.log('Estrutura validada. O novo formulário fica fechado para você revisar uploads e testar os fluxos antes de publicar.');
      return ConfiguracaoDaBase.mostrarLinks(estado);
    });
  }

  static prepararCadastros(base, form) {
    const inicio=base.getSheetByName('Início') || base.getSheets()[0];inicio.setName('Início');
    const obras=base.getSheetByName('Obras') || base.insertSheet('Obras');
    const bairros=base.getSheetByName('Bairros') || base.insertSheet('Bairros');
    if(obras.getLastRow()<=1) {
      const h=['ID da obra','Nome da obra / frente','Bairros (separar por ;)','No formulário?','EAP original','Status no PAC16 — 26/04/2026','Método','Município','Logradouro / trecho','Latitude','Longitude','GeoJSON do traçado','Referência do ponto','Fonte PAC16','Células de origem','BM original','Competência PAC16','Observações PAC16','Conferência'];
      const r=DadosIniciaisDoPAC16.obras.map(x => [x.id,x.nome,'',x.mostrar_no_formulario,x.codigo_eap_original,x.status_no_documento,x.metodo,x.municipio,x.logradouro_trecho,'','','','',x.fonte,x.celulas,x.bm_original,x.competencia,x.observacoes_fonte,x.conferencia]);
      InstalacaoDaBase.formatarTabela(obras,h,r,[145,520,250,135,230,245,170,135,450,110,110,240,230,165,340,130,170,380,440]);
      obras.getRange(2,4,r.length,1).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
      // Detalhes técnicos permanecem acessíveis, recolhidos para facilitar a edição diária.
      obras.getRange(1,7,obras.getMaxRows(),13).shiftColumnGroupDepth(1);obras.collapseAllColumnGroups();
      obras.getRange('J2:J').setNumberFormat('0.000000');obras.getRange('K2:K').setNumberFormat('0.000000');
      obras.getRange('B1').setNote('Pode melhorar o nome para a equipe. Mantenha o ID permanente da coluna A.');
      obras.getRange('C1').setNote('O PAC16 não define os bairros de cada frente. Preencha somente bairros confirmados do cadastro Bairros, separados por ponto e vírgula.');
      obras.getRange('F1').setNote('Retrato do documento de 26/04/2026. Não é a situação atual da obra.');
    }
    if(bairros.getLastRow()<=1) {
      // Lê as opções reais do formulário; o markdown serve de referência, sem substituir uma revisão posterior.
      const item=form.getItems().find(x => x.getTitle().trim()==='Bairro de realização do procedimento');
      if(!item || String(item.getType())!=='LIST')throw new Error('O bairro da origem deve ser uma lista suspensa.');
      const nomes=item.asListItem().getChoices().map(c => c.getValue());
      const r=nomes.map((nome,i) => ['BAI-'+String(i+1).padStart(3,'0'),nome,true,'Santo André', /^(Fora da área|Outro bairro|Múltiplos)/i.test(nome)?'Opção especial':'Bairro','Formulário 3.0 — pergunta de bairro']);
      InstalacaoDaBase.formatarTabela(bairros,['ID do bairro','Nome do bairro / opção','No formulário?','Município','Tipo','Fonte'],r,[155,330,135,180,170,430]);
      bairros.getRange(2,3,r.length,1).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
    }
  }

  static formatarTabela(aba,h,r,larguras) {
    const n=r.length+1;if(n>aba.getMaxRows())aba.insertRowsAfter(aba.getMaxRows(),n-aba.getMaxRows());
    if(h.length>aba.getMaxColumns())aba.insertColumnsAfter(aba.getMaxColumns(),h.length-aba.getMaxColumns());
    const range=aba.getRange(1,1,n,h.length); range.setValues([h].concat(r)).setFontFamily('Arial').setFontSize(11).setVerticalAlignment('top').setWrap(true);
    aba.setFrozenRows(1);aba.setFrozenColumns(1);aba.getRange(1,1,1,h.length).setBackground('#12678f').setFontColor('#ffffff').setFontWeight('bold');
    if(!aba.getFilter())range.createFilter();range.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY,true,false);
    aba.getRange(1,1,1,h.length).setBackground('#12678f').setFontColor('#ffffff');
    larguras.forEach((v,i) => aba.setColumnWidth(i+1,v));aba.setRowHeight(1,42);
    if(r.length)aba.setRowHeights(2,r.length,60);
  }

  static escreverInicio(base,form,e,audit) {
    const s=base.getSheetByName('Início');
    const r=[['PROCEDIMENTOS DE CAMPO 4.0','Base limpa para a próxima aplicação'],['Formulário — edição',form.getEditUrl()],['Formulário — preenchimento',form.getPublishedUrl()],['Situação inicial','Fechado para conferência. No formulário, confira uploads, publique e habilite respostas.'],['Obras','Edite o nome, os bairros confirmados e a seleção “No formulário?”. O ID não muda.'],['Bairros','Edite os bairros e opções de preenchimento. IDs permanentes, sem repetição.'],['Atualizar listas','No projeto novo, execute atualizarCatalogosCampo40(). Não muda as respostas já enviadas.'],['Respostas','O próprio Google Forms grava os envios aqui. Não há sincronização a cada 15 minutos.'],['Perguntas',audit.perguntasAntes+' originais + 1 pergunta de obra; '+audit.secoes+' seções preservadas.'],['PAC16','142 frentes do planejamento de 26/04/2026. Status dessa data, bairros e pontos exatos a confirmar.'],['Campos para o mapa','Na aba Obras, expanda os detalhes técnicos: latitude, longitude, GeoJSON e referência do ponto.'],['Auditoria','https://drive.google.com/file/d/'+e.auditoriaId+'/view'],['Arquivos da instalação','https://drive.google.com/drive/folders/'+e.pastaId],['Código / administração','https://script.google.com/home/projects/'+ScriptApp.getScriptId()+'/edit'],['Próxima etapa','Importar os registros antigos e construir a base consultável da aplicação. Nenhuma importação foi feita nesta etapa.']];
    s.getRange(1,1,r.length,2).setValues(r).setWrap(true).setFontFamily('Arial').setFontSize(12).setVerticalAlignment('middle');
    s.setColumnWidth(1,240);s.setColumnWidth(2,790);s.setRowHeights(1,r.length,60);s.setFrozenRows(1);
    s.getRange(1,1,1,2).setBackground('#12678f').setFontColor('#ffffff').setFontWeight('bold').setFontSize(16);
    s.getRange(2,1,r.length-1,1).setBackground('#eaf5fa').setFontWeight('bold');
  }

  static compararCopia(a,b,transformarTexto) {
    if(a.itens.length!==b.itens.length)throw new Error('Número de itens diferente entre a origem e a cópia.');
    a.itens.forEach((x,i) => {
      const esperado=JSON.parse(JSON.stringify(x));const atual=JSON.parse(JSON.stringify(b.itens[i]));
      delete esperado.id;delete atual.id;
      if(transformarTexto) {
        esperado.titulo=transformarTexto(esperado.titulo); esperado.ajuda=transformarTexto(esperado.ajuda);
        if(esperado.opcoes)esperado.opcoes.forEach(o => o.texto=transformarTexto(o.texto));
      }
      // Bairros são um cadastro editável autorizado, mas as rotas continuam iguais.
      if(transformarTexto && x.titulo.trim()==='Bairro de realização do procedimento') {
        esperado.opcoes=atual.opcoes;
        if(atual.opcoes.some(o => o.rota))throw new Error('O cadastro de bairro não pode introduzir navegação.');
      }
      if(JSON.stringify(esperado)!==JSON.stringify(atual))throw new Error('Conferência divergente em '+x.chave+' / '+x.titulo+'. Tipos, obrigatoriedade e direcionamentos não serão alterados silenciosamente.');
    });
  }

  static auditarCriacao(snapshot,form,estado,pares,transformarTexto) {
    const completa=AuditoriaDoFormulario.extrair(form);
    const nova=JSON.parse(JSON.stringify(completa));
    nova.itens=nova.itens.filter(x => x.id!==String(estado.obraItemId));
    let numero=0;nova.itens.forEach(x => {if(x.chave)x.chave='PERG-'+String(++numero).padStart(4,'0');});
    nova.perguntas=numero;InstalacaoDaBase.compararCopia(snapshot,nova,transformarTexto);
    AuditoriaDoFormulario.validarFinalizacao(completa,AuditoriaDoFormulario.finalizacao(completa));
    const obra=completa.itens.find(x => x.id===String(estado.obraItemId));
    if(!obra || !obra.obrigatoria || obra.secao!==AuditoriaDoFormulario.finalizacao(completa))throw new Error('A pergunta de obra deve ser obrigatória na finalização comum.');
    const mapa=pares.map((par,i) => ({chave:snapshot.itens[i].chave || 'SEC-'+snapshot.itens[i].secao,originalId:par.original,novoId:par.novo,tipo:snapshot.itens[i].tipo,tituloOriginal:snapshot.itens[i].titulo,tituloNovo:nova.itens[i].titulo,secao:snapshot.itens[i].secao}));
    return {versao:ConfiguracaoDaBase.valores.VERSAO,data:new Date().toISOString(),origem:snapshot.formularioId,formulario:estado.formId,base:estado.baseId,perguntasAntes:snapshot.perguntas,perguntasDepois:completa.perguntas,secoes:completa.secoes,perguntasNovas:1,fluxos:'Preservados e validados: toda rota de envio passa pela finalização comum.',uploads:snapshot.itens.filter(x => x.tipo==='FILE_UPLOAD').length,limiteAuditoria:'FormApp não expõe limites e obrigatoriedade dos uploads. A cópia preserva essas configurações, mas o envio real precisa ser testado no Google Forms.',obraItemId:estado.obraItemId,mapa:mapa,estruturaNova:completa};
  }
}

/** Execute novamente NO MESMO PROJETO: retoma a instalação interrompida. */
function instalarCampo40() { return InstalacaoDaBase.instalar(); }
