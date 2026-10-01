/**
 * AuditoriaDoFormulario — v4.0.3
 * PERMANENTE. Confere seções, caminhos e a finalização obrigatória; exporta a estrutura.
 * Não depende dos arquivos de instalação após a configuração concluída.
 */
class AuditoriaDoFormulario {
  static exportar() {
    return ConfiguracaoDaBase.comTrava(function () {
      const e = ConfiguracaoDaBase.exigirInstalacao(); const form = FormApp.openById(e.formId);
      const estrutura = AuditoriaDoFormulario.extrair(form);
      const id = ConfiguracaoDaBase.gravarJson(DriveApp.getFolderById(e.pastaId), e.estruturaId, 'Estrutura_Campo40.json', estrutura);
      e.estruturaId=id; ConfiguracaoDaBase.salvarEstado(e);
      console.log('Estrutura: https://drive.google.com/file/d/' + id + '/view'); return estrutura;
    });
  }

  static extrair(form) {
    const itens = form.getItems();
    const paginas = {}; let secao = 0, pergunta = 0;
    itens.forEach(x => { if (String(x.getType()) === 'PAGE_BREAK') paginas[String(x.getId())] = ++secao; });
    secao = 0;
    const dados = itens.map(x => {
      const tipo = String(x.getType()); if (tipo === 'PAGE_BREAK') secao++;
      const d = {id:String(x.getId()), tipo:tipo, secao:secao, titulo:x.getTitle(), ajuda:x.getHelpText() || ''};
      const q = AuditoriaDoFormulario.tipar(x);
      if (!['PAGE_BREAK','SECTION_HEADER','IMAGE','VIDEO'].includes(tipo)) d.chave='PERG-' + String(++pergunta).padStart(4,'0');
      if (q && typeof q.isRequired === 'function') d.obrigatoria=q.isRequired();
      if (tipo === 'FILE_UPLOAD') d.obrigatoria='Configuração preservada pela cópia; FormApp não expõe este campo.';
      if (tipo === 'PAGE_BREAK') d.saidaPaginaAnterior = AuditoriaDoFormulario.navegar(q.getPageNavigationType(), q.getGoToPage(), paginas);
      if (['MULTIPLE_CHOICE','LIST','CHECKBOX'].includes(tipo)) {
        d.opcoes = q.getChoices().map(c => ({texto:c.getValue(), rota:tipo==='CHECKBOX' ? null : AuditoriaDoFormulario.navegar(c.getPageNavigationType(), c.getGotoPage(), paginas)}));
        if (tipo !== 'LIST') d.outro=q.hasOtherOption();
      }
      if (tipo === 'SCALE') d.escala=[q.getLowerBound(),q.getUpperBound(),q.getLeftLabel(),q.getRightLabel()];
      if (tipo === 'GRID' || tipo === 'CHECKBOX_GRID') { d.linhas=q.getRows();d.colunas=q.getColumns(); }
      return d;
    });
    return {versao:ConfiguracaoDaBase.valores.VERSAO, formularioId:form.getId(), titulo:form.getTitle(), descricao:form.getDescription(), perguntas:pergunta, secoes:secao+1, itens:dados};
  }

  static tipar(x) {
    const mapa={MULTIPLE_CHOICE:'asMultipleChoiceItem',LIST:'asListItem',CHECKBOX:'asCheckboxItem',TEXT:'asTextItem',PARAGRAPH_TEXT:'asParagraphTextItem',SCALE:'asScaleItem',DATE:'asDateItem',DATETIME:'asDateTimeItem',TIME:'asTimeItem',DURATION:'asDurationItem',GRID:'asGridItem',CHECKBOX_GRID:'asCheckboxGridItem',PAGE_BREAK:'asPageBreakItem'};
    const metodo=mapa[String(x.getType())]; return metodo ? x[metodo]() : null;
  }

  static navegar(tipo, pagina, paginas) {
    if (!tipo) return null;
    const t=String(tipo);
    if(t==='GO_TO_PAGE') {
      const n=pagina && paginas[String(pagina.getId())];
      if(n===undefined || n===null) throw new Error('Rota aponta para uma seção fora deste formulário.');
      return {tipo:t,secao:n};
    }
    return {tipo:t};
  }

  static finalizacao(s) {
    const b=s.itens.filter(x => x.tipo==='PAGE_BREAK' && x.titulo.trim().toLowerCase()==='identificação e finalização');
    if(b.length!==1) throw new Error('Não foi encontrada uma única seção “Identificação e finalização”. Nenhum fluxo será inventado.');
    return b[0].secao;
  }

  static validarFinalizacao(s, final) {
    // A navegação de um PAGE_BREAK controla a página ANTERIOR, conforme a API do Google.
    const paginas=Array.from({length:s.secoes},() => []); s.itens.forEach(x => paginas[x.secao].push(x));
    function destino(r, p, padrao) {
      if(!r)return padrao;
      if(r.tipo==='SUBMIT')return -1;
      if(r.tipo==='RESTART')return 0;
      if(r.tipo==='GO_TO_PAGE')return r.secao;
      return p+1<s.secoes?p+1:-1;
    }
    const quebras = new Map(s.itens.filter(x => x.tipo==='PAGE_BREAK').map(x => [x.secao,x]));
    const grafo=paginas.map((xs,p) => {
      const proxima=quebras.get(p+1);
      const padrao=destino(proxima && proxima.saidaPaginaAnterior,p,p+1<s.secoes?p+1:-1);
      const roteadoras=xs.filter(x => x.opcoes && x.opcoes.some(o => o.rota));
      if(!roteadoras.length)return [padrao];
      const q=roteadoras[roteadoras.length-1];
      const saidas=q.opcoes.map(o => destino(o.rota,p,padrao));
      if(!q.obrigatoria || q.outro)saidas.push(padrao);
      return Array.from(new Set(saidas));
    });
    const vistos=new Set(), pendentes=[0];
    while(pendentes.length) {
      const p=pendentes.pop(); if(p===final || vistos.has(p))continue;
      if(p===-1)throw new Error('Existe uma rota que envia sem passar pela identificação final. O instalador preserva o fluxo e exige conferência dessa rota.');
      if(!grafo[p])throw new Error('Seção de destino inválida: '+p);
      vistos.add(p); grafo[p].forEach(n => pendentes.push(n));
    }
    if(!s.itens.some(x => x.secao===final && x.titulo.trim()==='Bairro de realização do procedimento'))throw new Error('O bairro não está na finalização comum.');
    return grafo;
  }

  static verificar() {
    return ConfiguracaoDaBase.comTrava(function () {
      const e = ConfiguracaoDaBase.exigirInstalacao();
      const base = SpreadsheetApp.openById(e.baseId), form = FormApp.openById(e.formId);
      // Confere a base antes da leitura completa das 150 perguntas.
      ['Início','Obras','Bairros'].forEach(nome => {
        if (!base.getSheetByName(nome)) throw new Error('Aba necessária ausente: ' + nome);
      });
      const respostas = ConfiguracaoDaBase.localizarAbaRespostas(base, form);
      const estrutura = AuditoriaDoFormulario.extrair(form);
      const final = AuditoriaDoFormulario.finalizacao(estrutura);
      AuditoriaDoFormulario.validarFinalizacao(estrutura, final);
      const referencia = JSON.parse(DriveApp.getFileById(e.auditoriaId).getBlob().getDataAsString('UTF-8'));
      if (estrutura.perguntas !== referencia.perguntasDepois || estrutura.secoes !== referencia.secoes)
        throw new Error('A quantidade de perguntas ou seções mudou após a instalação. Confira antes de prosseguir.');
      const indiceObra = estrutura.itens.findIndex(x => x.id === String(e.obraItemId));
      const obra = estrutura.itens[indiceObra];
      const bairro = estrutura.itens[indiceObra - 1];
      if (!obra || obra.tipo !== 'LIST' || !obra.obrigatoria || obra.secao !== final ||
          !bairro || bairro.titulo.trim() !== 'Bairro de realização do procedimento')
        throw new Error('A obra deve ser uma lista obrigatória, após o bairro na finalização comum.');
      const cadastros = CatalogosDeObrasEBairros.ler(base);
      const resultado = {
        versao: ConfiguracaoDaBase.valores.VERSAO, resultado: 'CONFERIDO',
        perguntas: estrutura.perguntas, secoes: estrutura.secoes,
        obras: cadastros.obras.length, bairros: cadastros.bairros.length,
        abaRespostas: respostas.aba.getName(), abaRespostasId: respostas.aba.getSheetId(),
        identificacaoRespostas: respostas.identificacao,
        finalizacaoObrigatoria: true, destinoCorreto: true,
        pendenciaManual: 'Faça um envio real, incluindo fotos, antes de liberar o formulário para a equipe.'
      };
      console.log(JSON.stringify(resultado, null, 2));
      return resultado;
    });
  }

}

/** Execute para exportar a estrutura, sem dados pessoais de respostas. */
function exportarEstruturaCampo40() { return AuditoriaDoFormulario.exportar(); }

/** Execute para conferir a instalação antes de remover os dois arquivos iniciais. */
function verificarCampo40() { return AuditoriaDoFormulario.verificar(); }
