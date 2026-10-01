/**
 * ProcessamentoDosEnvios — 1.1.0 — PERMANENTE.
 * Um gatilho do Forms; registros novos por ID, retomada (manual e de hora em hora) e diagnóstico.
 * 1.1.0: vigência de obras/bairros desde 01/10/2026; resposta editada não trava a retomada; uma falha não bloqueia as demais.
 * Não publica/fecha o formulário, não gera respostas de teste e não apaga dados.
 * Depende de ConfiguracaoDaBase, CatalogosDeObrasEBairros e RepositorioDosRegistros.
 */
class ProcessamentoDosEnvios {
  static get chave() { return 'CAMPO40_OPERACAO_1'; }
  static get handler() { return 'aoReceberEnvioCampo40'; }
  static estado() { return JSON.parse(PropertiesService.getScriptProperties().getProperty(this.chave) || '{}'); }
  static salvar(e) { PropertiesService.getScriptProperties().setProperty(this.chave, JSON.stringify(e)); }
  static chaveFalha(id) { return 'CAMPO40_FALHA_' + RepositorioDosRegistros.hash(String(id)).slice(0, 24); }
  static chaveRevisao(id) { return 'CAMPO40_REVISAO_' + RepositorioDosRegistros.hash(String(id)).slice(0, 24); }
  static get gatilhoRetomada() { return 'retomarEnviosAutomaticamenteCampo40'; }
  static revisoes() {
    const p = PropertiesService.getScriptProperties().getProperties();
    return Object.keys(p).filter(k => k.indexOf('CAMPO40_REVISAO_') === 0).map(k => JSON.parse(p[k])).sort((a, b) => a.em.localeCompare(b.em));
  }
  static falhas() {
    const p = PropertiesService.getScriptProperties().getProperties();
    return Object.keys(p).filter(k => k.indexOf('CAMPO40_FALHA_') === 0)
      .map(k => JSON.parse(p[k])).sort((a, b) => a.em.localeCompare(b.em));
  }
  static get nomes() {
    return {procedimento: 'Selecione o procedimento a ser executado', data: 'Data de realização do procedimento',
      bairro: 'Bairro de realização do procedimento', obra: 'Qual a obra de referência?',
      responsavel: 'Colaborador responsável pelo registro', area: 'Área responsável pelo procedimento',
      atividade: 'Atividade realizada', publico: 'Total de participantes', protocolo: 'Informe o ID do atendimento'};
  }
  static tituloComparavel(titulo) {
    return RepositorioDosRegistros.normalizar(titulo).replace(/[\s:?.!*]+$/g, '');
  }
  static mapearProtocolo(itens) {
    // Campo específico de um fluxo. Sua ausência não impede os demais procedimentos.
    // Só reconhece títulos explícitos, sem escolher uma pergunta por aproximação.
    const titulos = ['Informe o ID do atendimento', 'Informe o ID de atendimento',
      'ID do atendimento', 'Informe o protocolo do atendimento', 'Protocolo do atendimento',
      'Número do protocolo do atendimento'].map(t => this.tituloComparavel(t));
    return itens.filter(x => ['TEXT', 'PARAGRAPH_TEXT', 'LIST', 'MULTIPLE_CHOICE'].includes(x.tipo) &&
      titulos.includes(this.tituloComparavel(x.titulo))).map(x => x.id);
  }
  static montarEsquema(form) {
    let secao = 'Início';
    const itens = form.getItems().map(x => {
      const tipo = String(x.getType()); if (tipo === 'PAGE_BREAK') secao = x.getTitle();
      const d = {id: String(x.getId()), titulo: x.getTitle(), tipo: tipo, secao: secao};
      if (tipo === 'DATE') d.incluiAno = x.asDateItem().includesYear();
      return d;
    }).filter(x => !['PAGE_BREAK', 'SECTION_HEADER', 'IMAGE', 'VIDEO'].includes(x.tipo));
    const norm = RepositorioDosRegistros.normalizar, campos = {};
    Object.keys(this.nomes).forEach(k => {
      if (k === 'protocolo') { campos[k] = this.mapearProtocolo(itens); return; }
      const encontrados = itens.filter(x => norm(x.titulo) === norm(this.nomes[k]));
      if (encontrados.length !== 1) throw new Error('Pergunta não identificada de forma única: ' + this.nomes[k] + '. Nenhum envio foi processado.');
      campos[k] = encontrados[0].id;
    });
    if (itens.find(x => x.id === campos.data).tipo !== 'DATE') throw new Error('A data do procedimento precisa ser uma pergunta do tipo Data, com ano.');
    if (!itens.find(x => x.id === campos.data).incluiAno) throw new Error('Ative o ano na pergunta de data do procedimento, sem alterar suas outras perguntas.');
    return {versao: '1.0.1', formularioId: form.getId(), campos: campos, itens: itens,
      mapeamentoProtocolo: {quantidade: campos.protocolo.length,
        situacao: campos.protocolo.length ? 'Ler o campo efetivamente respondido, por ID' :
          'Pergunta de protocolo não localizada; respostas originais preservadas, sem vínculo automático',
        perguntas: itens.filter(x => campos.protocolo.includes(x.id)).map(x => ({id: x.id, titulo: x.titulo, secao: x.secao}))}};
  }
  static esquema(e) {
    const chave = 'c40:esquema:' + e.esquemaId + ':' + e.esquemaHash;
    const cache = CacheService.getScriptCache(), salvo = cache.get(chave);
    if (salvo) { try { return JSON.parse(salvo); } catch (_) { cache.remove(chave); } }
    const s = JSON.parse(DriveApp.getFileById(e.esquemaId).getBlob().getDataAsString('UTF-8'));
    if (RepositorioDosRegistros.hash(s) !== e.esquemaHash || s.formularioId !== e.formId) throw new Error('O mapa das perguntas mudou. Execute instalarProcessamentoCampo40 para conferir.');
    const texto = JSON.stringify(s); if (Utilities.newBlob(texto).getBytes().length < 90000) cache.put(chave, texto, 600);
    return s;
  }
  static gatilhos(formId) {
    return ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === this.handler &&
      String(t.getTriggerSource()) === 'FORMS' && String(t.getEventType()) === 'ON_FORM_SUBMIT' && t.getTriggerSourceId() === formId);
  }
  static contexto() {
    const c = ConfiguracaoDaBase.exigirInstalacao(), e = this.estado();
    if (!e.instalado || e.baseId !== c.baseId || e.formId !== c.formId) throw new Error('Execute instalarProcessamentoCampo40 primeiro.');
    const base = SpreadsheetApp.openById(c.baseId);
    return {config: c, estado: e, base: base, repositorio: new RepositorioDosRegistros(base),
      esquema: this.esquema(e), catalogos: CatalogosDeObrasEBairros.ler(base)};
  }
  static instalar() {
    return ConfiguracaoDaBase.comTrava(() => {
      const inicio = Date.now(), c = ConfiguracaoDaBase.exigirInstalacao();
      const base = SpreadsheetApp.openById(c.baseId), form = FormApp.openById(c.formId);
      if (ConfiguracaoDaBase.lerDestinoRespostas(form) !== c.baseId) throw new Error('O formulário não está ligado à base Campo 4.0.');
      const respostas = base.getSheets().find(s => s.getSheetId() === c.respostasAbaId);
      if (!respostas) throw new Error('A aba de respostas vinculada não foi encontrada pelo ID.');
      new RepositorioDosRegistros(base); // Confere a estrutura, sem escrever registros.
      CatalogosDeObrasEBairros.ler(base);
      const s = this.montarEsquema(form), anterior = this.estado();
      if (anterior.instalado && (anterior.baseId !== c.baseId || anterior.formId !== c.formId)) throw new Error('A operação já pertence a outra base. A configuração foi preservada.');
      const hash = RepositorioDosRegistros.hash(s);
      const id = anterior.esquemaHash === hash ? anterior.esquemaId :
        DriveApp.getFolderById(c.pastaId).createFile('Mapa_Perguntas_Operacao_' + hash.slice(0, 12) + '.json', JSON.stringify(s), MimeType.PLAIN_TEXT).getId();
      const e = {...anterior, instalado: true, versao: '1.0.1', baseId: c.baseId, formId: c.formId,
        esquemaId: id, esquemaHash: hash, instaladoEm: anterior.instaladoEm || new Date().toISOString(),
        cursor: anterior.cursor || {tempo: 0, id: ''}};
      this.salvar(e);
      const atuais = this.gatilhos(c.formId);
      if (!atuais.length) ScriptApp.newTrigger(this.handler).forForm(form).onFormSubmit().create();
      else atuais.slice(1).forEach(t => ScriptApp.deleteTrigger(t));
      const r = {resultado: 'PROCESSAMENTO INSTALADO', versao: e.versao, gatilhosDeEnvio: this.gatilhos(c.formId).length,
        perguntasMapeadas: s.itens.length, mapeamentoProtocolo: s.mapeamentoProtocolo,
        historicos: 'Preservados', novasAbas: 0, respostaDeTeste: false,
        tempoMs: Date.now() - inicio, proximoPasso: 'Execute processarEnviosPendentesCampo40. Se não houver envios reais, não haverá novas linhas.'};
      console.log(JSON.stringify(r, null, 2)); return r;
    });
  }
  static capturar(response, s) {
    const id = response.getId(), carimbo = response.getTimestamp();
    if (!id || !(carimbo instanceof Date) || !Number.isFinite(carimbo.getTime())) throw new Error('Não foi recebida uma resposta enviada válida do Google Forms.');
    const conhecidos = new Map(s.itens.map(x => [x.id, x]));
    const campos = response.getItemResponses().map(ir => {
      const item = ir.getItem(), perguntaId = String(item.getId()), modelo = conhecidos.get(perguntaId);
      const tipo = String(item.getType()), valor = RepositorioDosRegistros.serializar(ir.getResponse());
      if (!modelo || modelo.tipo !== tipo) throw new Error('Pergunta nova ou de tipo alterado: ' + perguntaId + '. Execute instalarProcessamentoCampo40 e depois a retomada.');
      return {id: perguntaId, titulo: item.getTitle(), secao: modelo.secao, tipo: tipo, valor: valor};
    });
    if (new Set(campos.map(x => x.id)).size !== campos.length) throw new Error('Resposta com identidade de pergunta repetida.');
    // Identidade não depende do título ou da posição da pergunta.
    const valoresHash = campos.map(x => ({id: x.id, tipo: x.tipo,
      valor: x.tipo === 'CHECKBOX' && Array.isArray(x.valor) ? x.valor.slice().sort() : x.valor})).sort((a, b) => a.id.localeCompare(b.id));
    const email = response.getRespondentEmail() || '';
    return {formularioId: s.formularioId, respostaId: String(id), carimbo: carimbo.toISOString(),
      email: email, campos: campos, hashResposta: RepositorioDosRegistros.hash([s.formularioId, String(id), carimbo, email, valoresHash])};
  }
  static preparar(snapshot, contexto) {
    const R = RepositorioDosRegistros, s = contexto.esquema, c = contexto.config, fuso = contexto.repositorio.fuso;
    const mapa = new Map(snapshot.campos.map(x => [x.id, x.valor]));
    const obter = chave => mapa.get(s.campos[chave]) ?? '', texto = chave => R.texto(obter(chave));
    const avisos = [], data = R.dataCivil(obter('data'), fuso), tipo = texto('procedimento');
    if (!tipo) throw new Error('Procedimento não informado na resposta ' + snapshot.respostaId);
    if (!data) avisos.push('Data do procedimento não reconhecida; conferir o original');
    const bairroTexto = texto('bairro'), obraTexto = texto('obra');
    // Antes da vigência, nomes e textos originais ficam como foram enviados: nenhum ID é atribuído.
    const anterior = !!data && data < ConfiguracaoDaBase.valores.VIGENCIA_REFERENCIAS;
    const bairro = anterior ? null : contexto.catalogos.bairros.find(x => R.normalizar(x.nome) === R.normalizar(bairroTexto));
    if (!bairro && !anterior) avisos.push('Bairro sem ID confirmado; conferir cadastro');
    const idMatch = obraTexto.match(/\[(OBR-\d{4,})\]\s*$/);
    const obra = idMatch && !anterior ? contexto.catalogos.obras.find(x => x.id === idMatch[1]) : null;
    const especial = [ConfiguracaoDaBase.valores.SEM_OBRA, ConfiguracaoDaBase.valores.OBRA_A_CADASTRAR].includes(obraTexto);
    if (!obra && !especial && !anterior) avisos.push('Obra sem ID confirmado; não foi aproximada por nome');
    if (obra && bairro && obra.bairroIds.length && !obra.bairroIds.includes(bairro.id) && bairro.tipo !== 'Opção especial') {
      avisos.push('Bairro informado diferente dos bairros cadastrados para a obra');
    }
    const publicoTexto = texto('publico'); let publico = '';
    if (publicoTexto !== '') {
      if (/^\d+$/.test(publicoTexto) && Number.isSafeInteger(Number(publicoTexto))) publico = Number(publicoTexto);
      else avisos.push('Público não numérico; valor original preservado');
    }
    const responsavel = texto('responsavel'), area = texto('area'), atividade = texto('atividade');
    // Compatível também com o mapa 1.0.0, que guardava um único ID como string.
    const idsProtocolo = Array.isArray(s.campos.protocolo) ? s.campos.protocolo : s.campos.protocolo ? [s.campos.protocolo] : [];
    const protocolos = [...new Set(idsProtocolo.map(id => R.texto(mapa.get(id))).filter(Boolean))];
    const protocolo = protocolos.length === 1 ? protocolos[0] : '';
    if (protocolos.length > 1) avisos.push('Protocolos diferentes informados em perguntas distintas; conferir os campos originais antes de vincular');
    const id = 'REG-' + R.hash([c.baseId, snapshot.formularioId, snapshot.respostaId]).slice(0, 24);
    const anexos = [];
    snapshot.campos.filter(x => x.tipo === 'FILE_UPLOAD').forEach(x => {
      const valores = Array.isArray(x.valor) ? x.valor : x.valor ? [x.valor] : [];
      valores.forEach(v => {
        const valor = String(v), m = valor.match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]+)/);
        const arquivoId = m ? m[1] : /^[A-Za-z0-9_-]{10,}$/.test(valor) ? valor : '';
        anexos.push({perguntaId: x.id, arquivoId: arquivoId,
          url: arquivoId ? 'https://drive.google.com/file/d/' + arquivoId + '/view' : '', valorOriginal: v});
        if (!arquivoId) avisos.push('Anexo sem ID reconhecido; referência original preservada');
      });
    });
    const vinculo = anterior ? 'Realizada antes de ' + ConfiguracaoDaBase.valores.VIGENCIA_REFERENCIAS.split('-').reverse().join('/') + ': texto original preservado' :
      obra ? 'ID da obra informado no formulário' : obraTexto === ConfiguracaoDaBase.valores.SEM_OBRA ?
      'Atividade sem obra específica' : 'Obra a conferir';
    const detalhe = {...snapshot, versao: '1.0.0', fuso: fuso, anexos: anexos,
      vinculos: {bairroId: bairro ? bairro.id : '', obraId: obra ? obra.id : '', avisos: [...new Set(avisos)]},
      atendimento: R.normalizar(tipo).includes('atendimento') ?
        {protocoloInformado: protocolo, situacao: 'Envio recebido; estado operacional da ficha não alterado nesta etapa'} : null};
    const linha = [id, tipo, data ? new Date(data + 'T12:00:00.000Z') : '', data.slice(0, 7), new Date(snapshot.carimbo),
      'Procedimentos de Campo 4.0', snapshot.respostaId, bairroTexto, bairro ? bairro.id : '',
      obraTexto, obra ? obra.id : '', responsavel, area, atividade, publico, protocolo, vinculo,
      R.normalizar([tipo, bairroTexto, obraTexto, responsavel, area, atividade, protocolo].join(' ')),
      avisos.length ? [...new Set(avisos)].join(' | ') : 'Envio identificado por ID; campos originais preservados'];
    return {linha: linha, detalhes: detalhe};
  }
  static receber(response, contexto) {
    const inicio = Date.now(), snapshot = this.capturar(response, contexto.esquema);
    const id = 'REG-' + RepositorioDosRegistros.hash([contexto.config.baseId, snapshot.formularioId, snapshot.respostaId]).slice(0, 24);
    const existente = contexto.repositorio.conferirExistente(id, snapshot.hashResposta);
    if (existente && !existente.igual) {
      // Guarda a nova versão para revisão, sem apagar o registro já utilizado no relatório.
      const pasta = DriveApp.getFolderById(contexto.config.pastaId);
      const nome = 'Revisao_' + id + '_' + snapshot.hashResposta.slice(0, 12) + '.json';
      const arquivos = pasta.getFilesByName(nome);
      const arquivoId = arquivos.hasNext() ? arquivos.next().getId() : pasta.createFile(nome, JSON.stringify(snapshot), MimeType.PLAIN_TEXT).getId();
      // Fica listado em conferirProcessamentoCampo40 até alguém revisar. Não é falha: não bloqueia a fila.
      const props = PropertiesService.getScriptProperties();
      props.setProperty(this.chaveRevisao(snapshot.respostaId + ':' + snapshot.hashResposta), JSON.stringify({em: new Date().toISOString(),
        respostaId: snapshot.respostaId, registro: id, linha: existente.linha, arquivo: 'https://drive.google.com/file/d/' + arquivoId + '/view'}));
      props.deleteProperty(this.chaveFalha(snapshot.respostaId));
      console.warn(JSON.stringify({resultado: 'RESPOSTA EDITADA', registro: id, arquivo: arquivoId}));
      return {resultado: 'RESPOSTA EDITADA — ORIGINAL PRESERVADO, NOVA VERSÃO ARQUIVADA', id: id, linha: existente.linha, inserido: false, revisao: true};
    }
    const preparado = existente ? null : this.preparar(snapshot, contexto);
    const r = existente ? {resultado: 'JÁ PROCESSADO', id: id, linha: existente.linha, inserido: false} :
      contexto.repositorio.gravar(preparado.linha, preparado.detalhes, contexto.config.pastaId);
    // Ficha de Atendimento: abre o caso com protocolo sequencial. Uma falha aqui não perde o registro;
    // a retomada de hora em hora (abrirPendentes) cria o caso depois.
    if (r.inserido && AberturaDeAtendimentos.ehAbertura(preparado.linha[1])) {
      try { const caso = AberturaDeAtendimentos.abrir(contexto.base, preparado.linha, preparado.detalhes); r.protocolo = caso.protocolo;
        AberturaDeAtendimentos.marcarRegistro(contexto.base, id, caso.protocolo); }
      catch (erro) { console.error('Caso não aberto agora para ' + id + ': ' + String(erro.message || erro)); }
    }
    // O contador não substitui a tabela: uma interrupção depois da escrita é retomável pelo ID.
    const e = this.estado();
    e.ultimoProcessamento = {em: new Date().toISOString(), id: r.id, resultado: r.resultado, tempoMs: Date.now() - inicio};
    this.salvar(e);
    PropertiesService.getScriptProperties().deleteProperty(this.chaveFalha(snapshot.respostaId));
    return r;
  }
  static falha(erro, respostaId) {
    // Uma chave por resposta: uma falha concorrente não apaga o cursor nem outra falha.
    if (respostaId && this.estado().instalado) PropertiesService.getScriptProperties().setProperty(this.chaveFalha(respostaId),
      JSON.stringify({em: new Date().toISOString(), respostaId: String(respostaId), mensagem: String(erro.message || erro).slice(0, 600)}));
    console.error(JSON.stringify({resultado: 'ENVIO PENDENTE', respostaId: respostaId || '',
      mensagem: String(erro.message || erro), acao: 'Após corrigir a causa, execute processarEnviosPendentesCampo40.'}));
  }
  static evento(e) {
    if (!e || !e.response || !e.source) throw new Error('aoReceberEnvioCampo40 é automática. Para execução manual use processarEnviosPendentesCampo40.');
    const inicio = Date.now();
    const config = ConfiguracaoDaBase.exigirInstalacao();
    // Eventos de outra fonte não pertencem à fila de retomada desta base.
    if (String(e.source.getId()) !== config.formId) throw new Error('O evento veio de outro formulário.');
    try {
      return ConfiguracaoDaBase.comTrava(() => {
        const c = ConfiguracaoDaBase.exigirInstalacao();
        if (c.formId !== config.formId) throw new Error('A configuração mudou durante o recebimento.');
        if (ConfiguracaoDaBase.lerDestinoRespostas(e.source) !== c.baseId) throw new Error('O destino do formulário mudou; o envio ficou pendente, sem escrever em outra base.');
        const r = this.receber(e.response, this.contexto());
        console.log(JSON.stringify({...r, tempoTotalMs: Date.now() - inicio})); return r;
      });
    } catch (erro) {
      // A resposta real continua no Forms e na aba Respostas, mesmo se a trava ou a escrita falhar.
      try { this.falha(erro, e.response.getId()); } catch (falhaLog) { console.error('Não foi possível registrar o diagnóstico: ' + falhaLog.message); }
      throw erro;
    }
  }
  static retomar() {
    return ConfiguracaoDaBase.comTrava(() => {
      const inicio = Date.now(), ctx = this.contexto(), form = FormApp.openById(ctx.config.formId);
      if (ConfiguracaoDaBase.lerDestinoRespostas(form) !== ctx.config.baseId) throw new Error('Destino do formulário diferente da base instalada.');
      const e = this.estado(), cursor = e.cursor || {tempo: 0, id: ''};
      const posteriores = form.getResponses(new Date(Math.max(0, cursor.tempo - 1)))
        .map(r => ({r: r, tempo: r.getTimestamp().getTime(), id: String(r.getId())}))
        .filter(x => x.tempo > cursor.tempo || x.tempo === cursor.tempo && x.id > cursor.id)
        .sort((a, b) => a.tempo - b.tempo || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      let novos = 0, repetidos = 0, feitos = 0;
      // Falhas do gatilho anteriores ao cursor são retomadas pelo ID exato.
      const idsPosteriores = new Set(posteriores.map(x => x.id));
      const falhasAnteriores = this.falhas().filter(x => !idsPosteriores.has(x.respostaId));
      // Cada resposta é independente: uma falha fica registrada pelo ID e a fila continua.
      // Três falhas seguidas indicam problema geral (base, permissão): a retomada para e informa.
      let falhasRetomadas = 0, comFalha = 0, seguidas = 0, revisoes = 0, interrompida = '';
      const tentar = (resposta, respostaId) => {
        try { const r = this.receber(resposta, ctx); r.revisao ? revisoes++ : r.inserido ? novos++ : repetidos++; seguidas = 0; return true; }
        catch (erro) { this.falha(erro, respostaId); comFalha++; seguidas++; if (seguidas >= 3) interrompida = String(erro.message || erro); return false; }
      };
      for (const falha of falhasAnteriores) {
        if (feitos >= 40 || Date.now() - inicio > 90000 || interrompida) break;
        let resposta = null; try { resposta = form.getResponse(falha.respostaId); } catch (_) {}
        feitos++; falhasRetomadas++;
        if (!resposta) { this.falha(new Error('Resposta não encontrada no formulário (pode ter sido excluída).'), falha.respostaId); comFalha++; continue; }
        tentar(resposta, falha.respostaId);
      }
      let posterioresFeitos = 0;
      for (const x of posteriores) {
        if (feitos >= 40 || Date.now() - inicio > 90000 || interrompida) break;
        tentar(x.r, x.id); feitos++; posterioresFeitos++;
        // A falha ficou registrada pelo ID e será tentada de novo; o cursor pode avançar.
        const atual = this.estado(); atual.cursor = {tempo: x.tempo, id: x.id}; this.salvar(atual);
      }
      const restantes = posteriores.length - posterioresFeitos + falhasAnteriores.length - falhasRetomadas;
      const r = {resultado: interrompida ? 'RETOMADA INTERROMPIDA — PROBLEMA GERAL: ' + interrompida :
        restantes ? 'RETOMADA PARCIAL — EXECUTE NOVAMENTE' : comFalha ? 'ENVIOS CONFERIDOS, COM FALHAS REGISTRADAS' : 'ENVIOS REAIS CONFERIDOS',
        novos: novos, jaProcessados: repetidos, respostasEditadas: revisoes, falhas: comFalha, restantes: restantes,
        falhasPendentes: this.falhas().length, tempoMs: Date.now() - inicio, testeCriado: false, historicoPreservado: true};
      console.log(JSON.stringify(r, null, 2)); return r;
    });
  }
  static conferir() {
    const inicio = Date.now(), c = ConfiguracaoDaBase.exigirInstalacao(), e = this.estado();
    const base = SpreadsheetApp.openById(c.baseId), form = FormApp.openById(c.formId);
    const s = this.montarEsquema(form), aba = RepositorioDosRegistros.exigirTabela(base);
    const h = RepositorioDosRegistros.hash(s), gatilhos = this.gatilhos(c.formId).length;
    const correto = e.instalado && e.baseId === c.baseId && e.formId === c.formId &&
      h === e.esquemaHash && gatilhos === 1 && ConfiguracaoDaBase.lerDestinoRespostas(form) === c.baseId;
    const r = {resultado: correto ? 'CONFIGURAÇÃO CONFERIDA' : 'CONFIGURAÇÃO A REINSTALAR',
      registros: Math.max(0, aba.getLastRow() - 1), gatilhosDeEnvioDestaConta: gatilhos,
      ultimoProcessamento: e.ultimoProcessamento || 'Aguardando o primeiro envio real',
      falhasPendentes: this.falhas(), respostasEditadasParaRevisar: this.revisoes(),
      retomadaAutomatica: ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === this.gatilhoRetomada) ? 'Ativa (de hora em hora)' : 'Não instalada: execute instalarRetomadaAutomaticaCampo40',
      tempoMs: Date.now() - inicio,
      validacaoOperacional: e.ultimoProcessamento ? 'Envio real processado; confira conteúdo e acesso aos anexos' : 'Pendente da primeira resposta real, sem criar linha fictícia'};
    console.log(JSON.stringify(r, null, 2)); return r;
  }
  static conferirTodos() {
    // Auditoria extraordinária: reinicia APENAS a posição da leitura, nunca as tabelas.
    ConfiguracaoDaBase.comTrava(() => {
      const e = this.estado(); if (!e.instalado) throw new Error('Instale o processamento primeiro.');
      e.cursor = {tempo: 0, id: ''}; this.salvar(e);
    });
    return this.retomar();
  }
}

/** EXECUTE UMA VEZ, na conta de Victor. Repetir não duplica seu gatilho. */
function instalarProcessamentoCampo40() { return ProcessamentoDosEnvios.instalar(); }
/** AUTOMÁTICA — não execute pelo botão Executar. */
function aoReceberEnvioCampo40(e) { return ProcessamentoDosEnvios.evento(e); }
/** EXECUTE para incorporar somente respostas reais pendentes. Sem envios = sem linhas. */
function processarEnviosPendentesCampo40() { return ProcessamentoDosEnvios.retomar(); }
/** EXECUTE para conferir a instalação e os tempos, sem alterar dados. */
function conferirProcessamentoCampo40() { return ProcessamentoDosEnvios.conferir(); }
/** Opcional: verifica de novo todos os envios reais; não recria nem apaga históricos. */
function conferirTodosOsEnviosCampo40() { return ProcessamentoDosEnvios.conferirTodos(); }

/** EXECUTE UMA VEZ. Cria um único gatilho de hora em hora que retoma envios que falharam. Repetir não duplica. */
function instalarRetomadaAutomaticaCampo40() {
  const nome = ProcessamentoDosEnvios.gatilhoRetomada, atuais = ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === nome);
  if (!atuais.length) ScriptApp.newTrigger(nome).timeBased().everyHours(1).create(); else atuais.slice(1).forEach(t => ScriptApp.deleteTrigger(t));
  const r = {resultado: 'RETOMADA AUTOMÁTICA ATIVA', frequencia: 'de hora em hora', gatilhos: 1};
  console.log(JSON.stringify(r, null, 2)); return r;
}
/** AUTOMÁTICA (gatilho de hora em hora). Se outra execução estiver em andamento, tenta na próxima hora. */
function retomarEnviosAutomaticamenteCampo40() {
  sincronizarObrasAlteradasNaAplicacaoCampo40_();
  let r = null;
  try { r = ProcessamentoDosEnvios.retomar(); }
  catch (erro) {
    if (/Outra execução está em andamento/.test(String(erro.message))) { console.log('Retomada adiada: outra execução em andamento.'); return null; }
    throw erro;
  }
  // Fichas de atendimento registradas que ainda não têm caso (falha pontual na abertura).
  try { ConfiguracaoDaBase.comTrava(() => AberturaDeAtendimentos.abrirPendentes(SpreadsheetApp.openById(ConfiguracaoDaBase.exigirInstalacao().baseId))); }
  catch (erro) { console.error('Abertura de casos pendentes adiada: ' + String(erro.message || erro)); }
  return r;
}
/**
 * A Aplicação CPT edita a aba Obras e escreve "PENDENTE — alterado pela aplicação" em AB6.
 * Aqui as listas do formulário são atualizadas pelo mesmo caminho do botão da planilha (com revisão registrada).
 */
function sincronizarObrasAlteradasNaAplicacaoCampo40_() {
  try {
    const e = ConfiguracaoDaBase.lerEstado(); if (!e.pronto || !e.controlesCatalogos) return;
    const aba = SpreadsheetApp.openById(e.baseId).getSheetByName('Obras');
    if (!aba || aba.getMaxColumns() < 30 || !String(aba.getRange(6, 28).getValue()).startsWith('PENDENTE — alterado pela aplicação')) return;
    CatalogosDeObrasEBairros.atualizar(null, 'Aplicação CPT');
  } catch (erro) {
    // O erro fica visível na aba Obras (AB5) e na tela Obras da aplicação; a retomada de envios continua.
    console.error('Listas do formulário não atualizadas: ' + String(erro.message || erro));
  }
}
/** EXECUTE se quiser levar agora ao formulário as obras alteradas na aplicação (sem esperar a próxima hora). */
function atualizarFormularioComObrasDaAplicacaoCampo40() { return CatalogosDeObrasEBairros.atualizar(null, 'Aplicação CPT (manual)'); }
/** EXECUTE depois de revisar as respostas editadas listadas em conferirProcessamentoCampo40. */
function marcarRespostasEditadasComoRevisadasCampo40() {
  const props = PropertiesService.getScriptProperties(), chaves = Object.keys(props.getProperties()).filter(k => k.indexOf('CAMPO40_REVISAO_') === 0);
  chaves.forEach(k => props.deleteProperty(k));
  const r = {resultado: 'REVISÕES MARCADAS COMO CONFERIDAS', quantidade: chaves.length, arquivosMantidos: true};
  console.log(JSON.stringify(r, null, 2)); return r;
}
