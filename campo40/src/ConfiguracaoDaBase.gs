/**
 * ConfiguracaoDaBase — v4.0.4
 * PERMANENTE. Identidade da base, estado da instalação, travas e links.
 * Mantenha CAMPO40_INSTALACAO: ela permite retomar a execução que falhou.
 */
class ConfiguracaoDaBase {
  static get valores() {
    return Object.freeze({
      VERSAO: '4.0.4',
      NOME: 'Procedimentos de Campo 4.0',
      PERGUNTA_OBRA: 'Qual a obra de referência?',
      ESTADO: 'CAMPO40_INSTALACAO',
      SEM_OBRA: 'Não se aplica — atividade sem obra específica',
      OBRA_A_CADASTRAR: 'Obra ainda não cadastrada — identificar na observação final'
    });
  }
  static comTrava(acao) {
    const l=LockService.getScriptLock();if(!l.tryLock(10000))throw new Error('Outra execução está em andamento. Aguarde antes de executar novamente.');
    try{return acao();}finally{l.releaseLock();}
  }

  static lerEstado() {return JSON.parse(PropertiesService.getScriptProperties().getProperty(ConfiguracaoDaBase.valores.ESTADO)||'{}');}

  static salvarEstado(e) {PropertiesService.getScriptProperties().setProperty(ConfiguracaoDaBase.valores.ESTADO,JSON.stringify(e));}

  static exigirInstalacao() {const e=ConfiguracaoDaBase.lerEstado();if(!e.pronto)throw new Error('Execute instalarCampo40() primeiro. Se houve interrupção, a mesma função retoma a instalação.');return e;}

  /** FormApp lança esta exceção quando a cópia ainda não tem planilha vinculada. */
  static lerDestinoRespostas(form) {
    try {
      return form.getDestinationId();
    } catch (erro) {
      const mensagem = String(erro && erro.message || erro);
      if (/the form currently has no response destination/i.test(mensagem)) return null;
      // Permissões, indisponibilidade e qualquer outra falha precisam ser informadas.
      throw erro;
    }
  }

  /** Localiza a aba real de respostas. O nome visível não é a identidade da aba. */
  static localizarAbaRespostas(base, form) {
    if (ConfiguracaoDaBase.lerDestinoRespostas(form) !== base.getId()) {
      throw new Error('O formulário não está ligado à base registrada.');
    }
    function idDoFormulario(url) {
      const match = String(url || '').match(/\/forms\/(?:u\/\d+\/)?d\/(?:e\/)?([^/?#]+)/);
      return match ? match[1] : '';
    }
    const ids = new Set([String(form.getId()), idDoFormulario(form.getEditUrl()),
      idDoFormulario(form.getPublishedUrl())].filter(Boolean));
    const todas = base.getSheets();
    const candidatas = todas.filter(s => !['Início','Obras','Bairros'].includes(s.getName()))
      .map(aba => ({aba: aba, url: aba.getFormUrl()}));
    let encontradas = candidatas.filter(x => x.url && ids.has(idDoFormulario(x.url)));
    let metodo = 'Vínculo do Google Forms';
    if (!encontradas.length) {
      // Cabeçalhos permitem reconhecer uma aba que já apareceu antes do vínculo na API.
      function normalizar(texto) {
        return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
          .trim().toLowerCase().replace(/\s+/g,' ');
      }
      encontradas = candidatas.filter(x => {
        if (x.url || !x.aba.getLastRow() || !x.aba.getLastColumn()) return false;
        const h = x.aba.getRange(1,1,1,x.aba.getLastColumn()).getValues()[0].map(normalizar);
        return ['carimbo de data/hora','timestamp','marca temporal'].includes(h[0]) &&
          h.includes(normalizar(ConfiguracaoDaBase.valores.PERGUNTA_OBRA)) &&
          h.includes(normalizar('Bairro de realização do procedimento'));
      });
      metodo = 'Cabeçalhos da aba de respostas';
    }
    if (encontradas.length > 1) {
      throw new Error('Mais de uma aba corresponde às respostas do formulário: ' +
        encontradas.map(x => x.aba.getName()).join(', ') + '. Nenhuma aba foi renomeada.');
    }
    if (!encontradas.length) {
      throw new Error('A base está vinculada, mas a aba real de respostas ainda não foi identificada. ' +
        'Abas encontradas: ' + todas.map(s => s.getName()).join(', ') +
        '. Confira no formulário, em Respostas, se o destino é esta base; depois execute instalarCampo40 novamente.');
    }
    return {aba: encontradas[0].aba, identificacao: metodo};
  }

  /** Organiza somente a aba identificada, sem recriar o vínculo ou os dados. */
  static organizarAbaRespostas(base, form, estado) {
    const resultado = ConfiguracaoDaBase.localizarAbaRespostas(base, form);
    const aba = resultado.aba;
    const nomeAnterior = aba.getName();
    const conflito = base.getSheetByName('Respostas');
    if (conflito && conflito.getSheetId() !== aba.getSheetId()) {
      throw new Error('Já existe outra aba chamada Respostas. A aba vinculada é “' +
        nomeAnterior + '”. Nenhuma aba foi substituída.');
    }
    if (nomeAnterior !== 'Respostas') aba.setName('Respostas');
    if (estado.respostasAbaId !== aba.getSheetId()) {
      estado.respostasAbaId = aba.getSheetId();
      ConfiguracaoDaBase.salvarEstado(estado);
    }
    console.log(JSON.stringify({abaRespostas:aba.getName(), abaId:aba.getSheetId(),
      nomeAnterior:nomeAnterior, identificacao:resultado.identificacao}));
    return resultado;
  }

  static gravarJson(pasta,id,nome,objeto) {
    const texto=JSON.stringify(objeto,null,2);if(id){DriveApp.getFileById(id).setContent(texto);return id;}
    return pasta.createFile(nome,texto,MimeType.PLAIN_TEXT).getId();
  }

  static mostrarLinks(e) {
    const r={versao:ConfiguracaoDaBase.valores.VERSAO,base:'https://docs.google.com/spreadsheets/d/'+e.baseId+'/edit',formulario_edicao:'https://docs.google.com/forms/d/'+e.formId+'/edit',pasta:'https://drive.google.com/drive/folders/'+e.pastaId};
    console.log(JSON.stringify(r,null,2));return r;
  }
}

/** Execute para consultar os links salvos, sem reler as respostas. */
function verLinksCampo40() { return ConfiguracaoDaBase.mostrarLinks(ConfiguracaoDaBase.exigirInstalacao()); }
